/**
 * Build Executor — wave-by-wave orchestration engine.
 *
 * Takes a BuildPlan and executes it:
 *  - Wave 0 tasks run immediately in parallel
 *  - Each subsequent wave waits for all tasks in the prior wave to settle
 *  - Per-task handlers route to the right generator (terrain, scripts, meshes, etc.)
 *  - Progress is written to Redis so the status endpoint can poll without WebSockets
 *  - Failed tasks are marked and skipped — remaining tasks still execute
 */

import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { redis } from '@/lib/redis'
import { queueCommand } from '@/lib/studio-session'
import { startMeshPipeline } from '@/lib/pipeline/mesh-pipeline'
import { spendTokens } from '@/lib/tokens-server'
import { serverEnv } from '@/lib/env'
import type { BuildPlan, BuildTask, BuildTaskType } from './build-planner'
import {
  economySystem,
  tycoonDropper,
  npcDialogSystem,
  leaderboardProgression,
  basicCombat,
  inventorySystem,
  dayNightCycle,
  spawnSystem,
  obbyCheckpoints,
  petFollowSystem,
} from './luau-templates'

// ── Lazy Anthropic client ─────────────────────────────────────────────────────

let _anthropic: Anthropic | null = null
function getClient(): Anthropic {
  if (_anthropic) return _anthropic
  const key = serverEnv.ANTHROPIC_API_KEY
  if (!key) throw new Error('[build-executor] ANTHROPIC_API_KEY not configured')
  _anthropic = new Anthropic({ apiKey: key })
  return _anthropic
}

// ── Redis key schema ──────────────────────────────────────────────────────────

const BUILD_KEY = (buildId: string) => `build:${buildId}`
const BUILD_TTL = 60 * 60 * 4  // 4 hours

// ── Public types ──────────────────────────────────────────────────────────────

export type TaskStatus = 'pending' | 'running' | 'complete' | 'failed' | 'skipped'

export interface TaskProgress {
  id: string
  name: string
  type: BuildTaskType
  wave: number
  status: TaskStatus
  startedAt?: string
  completedAt?: string
  errorMessage?: string
  luauCode?: string
  assetId?: string
}

export interface BuildProgress {
  buildId: string
  planId: string
  status: 'running' | 'complete' | 'failed'
  progress: number
  currentWave: number
  completedTasks: number
  totalTasks: number
  tasks: TaskProgress[]
  startedAt: string
  completedAt?: string
}

// ── ID generator ──────────────────────────────────────────────────────────────

function generateBuildId(): string {
  return `build_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

// ── Progress persistence ──────────────────────────────────────────────────────

async function writeProgress(progress: BuildProgress): Promise<void> {
  await redis.set(BUILD_KEY(progress.buildId), JSON.stringify(progress), 'EX', BUILD_TTL)
}

async function readProgress(buildId: string): Promise<BuildProgress | null> {
  const raw = await redis.get(BUILD_KEY(buildId))
  if (!raw) return null
  try {
    return JSON.parse(raw) as BuildProgress
  } catch {
    return null
  }
}

// ── Task type system prompt fragments ────────────────────────────────────────

const TASK_SYSTEM_PROMPTS: Record<BuildTaskType, string> = {
  terrain: `You are a Roblox terrain generation expert. Generate complete, runnable Luau code that uses workspace.Terrain API to create terrain. Use Terrain:FillBlock, Terrain:FillBall, Terrain:WriteVoxels, and Terrain:FillWedge. Always wrap in ChangeHistoryService. Include Lighting and Atmosphere setup if relevant to the terrain type. Output ONLY the Luau code, no explanation.`,

  building: `You are a Roblox Studio building expert. Generate complete Luau code that constructs a detailed building using Parts, WedgeParts, UnionOperations, and SpecialMeshes. Group all parts in a named Model. Use correct materials (WoodPlanks, Cobblestone, Slate, SmoothPlastic etc), real Color3.fromRGB values, proper scale (5-stud characters, 12-stud ceilings, 4x7 doors). Anchor ALL parts. Add PointLights to light sources. Wrap in ChangeHistoryService. Output ONLY the Luau code.`,

  prop: `You are a Roblox prop placement expert. Generate Luau code that creates and positions decorative props and objects. Use proper materials, colors, and scale. Group props in named Models. Anchor static props. Add appropriate lighting to interactive props. Output ONLY the Luau code.`,

  npc: `You are a Roblox NPC creation expert. Generate complete Luau code that creates NPC characters with R6/R15 rigs OR simple geometric humanoids, adds AI pathfinding or idle animations, configures Humanoid health/walkspeed, adds dialog proximity detectors, and sets up any combat behaviors. Output ONLY the Luau code.`,

  script: `You are a Roblox Luau scripting expert. Generate a complete, production-quality game system script. Follow best practices: server-authoritative, pcall error handling, DataStore persistence, proper service access via GetService(), RemoteEvent/RemoteFunction for client-server communication. Output ONLY the Luau code, no markdown.`,

  ui: `You are a Roblox GUI expert. Generate Luau code that creates ScreenGui elements via Instance.new(). Use proper UDim2 sizing, Color3 values matching the game theme (gold accents: Color3.fromRGB(212,175,55), dark backgrounds: Color3.fromRGB(20,20,30)). Add UICorner (CornerRadius = UDim.new(0,8)), UIStroke, UIGradient for polish. Add TweenService animations for show/hide. Parent to StarterGui or the specified location. Output ONLY the Luau code.`,

  economy: `You are a Roblox economy system expert. Generate a complete, server-authoritative economy script. Never trust client values. Use DataStore for persistence. Include currency tracking, shop system, and leaderstat sync. Output ONLY the Luau code.`,

  lighting: `You are a Roblox lighting and atmosphere expert. Generate Luau code that configures game:GetService("Lighting") properties: Ambient, OutdoorAmbient, Brightness, ShadowSoftness, FogEnd, FogColor, ClockTime, GeographicLatitude. Add Atmosphere (Density, Offset, Color, Decay, Glare, Haze), Bloom (Intensity, Size, Threshold), ColorCorrection (Brightness, Contrast, Saturation, TintColor). Output ONLY the Luau code, no explanation.`,

  audio: `You are a Roblox audio/sound expert. Generate Luau code that inserts Sound objects into appropriate locations (SoundService for music, workspace Parts for spatial audio). Configure Volume, PlaybackSpeed, RollOffMaxDistance, RollOffMinDistance. Use real Roblox sound asset IDs where appropriate (e.g. 9125402735 for ambient wind). Add SoundGroup management. Output ONLY the Luau code.`,
}

// ── Luau code generator for a single task ────────────────────────────────────

async function generateLuauForTask(task: BuildTask): Promise<string> {
  // Check if the task has templateParams that match a known template
  const params = task.templateParams
  if (params) {
    const templateName = params['template'] as string | undefined

    if (templateName === 'economy_system' && params['currencies']) {
      return economySystem({
        currencies: params['currencies'] as string[],
        startingCash: (params['startingCash'] as number) ?? 100,
        shopItems: params['shopItems'] as { name: string; price: number }[] | undefined,
      })
    }
    if (templateName === 'tycoon_dropper') {
      return tycoonDropper({
        resourceName: (params['resourceName'] as string) ?? 'Resource',
        value: (params['value'] as number) ?? 10,
        interval: (params['interval'] as number) ?? 5,
        currency: params['currency'] as string | undefined,
      })
    }
    if (templateName === 'leaderboard') {
      return leaderboardProgression({
        stats: (params['stats'] as { name: string; startValue: number; isXP?: boolean }[]) ?? [
          { name: 'Cash', startValue: 0 },
        ],
        xpToLevelCurve: params['xpToLevelCurve'] as 'linear' | 'quadratic' | 'exponential' | undefined,
        maxLevel: params['maxLevel'] as number | undefined,
      })
    }
    if (templateName === 'basic_combat') {
      return basicCombat({
        clickDamage: (params['clickDamage'] as number) ?? 25,
        attackRange: (params['attackRange'] as number) ?? 15,
        attackCooldown: (params['attackCooldown'] as number) ?? 0.5,
        enemyTag: params['enemyTag'] as string | undefined,
      })
    }
    if (templateName === 'inventory') {
      return inventorySystem({
        maxSlots: (params['maxSlots'] as number) ?? 20,
        categories: (params['categories'] as string[]) ?? ['Weapon', 'Tool', 'Consumable'],
        stackable: params['stackable'] as boolean | undefined,
      })
    }
    if (templateName === 'day_night_cycle') {
      return dayNightCycle({
        cycleDurationMinutes: (params['cycleDurationMinutes'] as number) ?? 15,
        sunriseHour: params['sunriseHour'] as number | undefined,
        sunsetHour: params['sunsetHour'] as number | undefined,
      })
    }
    if (templateName === 'spawn_system') {
      return spawnSystem({
        spawnPoints: (params['spawnPoints'] as number) ?? 4,
        respawnDelay: (params['respawnDelay'] as number) ?? 5,
        teamBased: params['teamBased'] as boolean | undefined,
      })
    }
    if (templateName === 'obby_checkpoints') {
      return obbyCheckpoints({
        totalCheckpoints: (params['totalCheckpoints'] as number) ?? 10,
        completionReward: params['completionReward'] as { currency: string; amount: number } | undefined,
      })
    }
    if (templateName === 'pet_follow') {
      return petFollowSystem({
        petName: (params['petName'] as string) ?? 'Buddy',
        followSpeed: (params['followSpeed'] as number) ?? 8,
        followDistance: (params['followDistance'] as number) ?? 5,
        petModelId: params['petModelId'] as string | undefined,
        bonusMultiplier: params['bonusMultiplier'] as number | undefined,
      })
    }
    if (templateName === 'npc_dialog') {
      return npcDialogSystem({
        npcName: (params['npcName'] as string) ?? 'Guide',
        dialogLines: (params['dialogLines'] as string[]) ?? ['Welcome, adventurer!'],
        questName: params['questName'] as string | undefined,
        questRewardCurrency: params['questRewardCurrency'] as string | undefined,
        questRewardAmount: params['questRewardAmount'] as number | undefined,
      })
    }
  }

  // Fall through to Claude generation
  const client = getClient()
  const systemPrompt = TASK_SYSTEM_PROMPTS[task.type]

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 3000,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: task.prompt,
      },
    ],
  })

  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim()

  // Strip any accidental markdown fences
  return text
    .replace(/^```(?:lua|luau)?\n?/m, '')
    .replace(/\n?```$/m, '')
    .trim()
}

// ── Studio command push ───────────────────────────────────────────────────────

function pushToStudio(sessionId: string, taskId: string, luauCode: string): void {
  const result = queueCommand(sessionId, {
    type: 'execute_luau',
    data: {
      source: luauCode,
      taskId,
      origin: 'build_executor',
    },
  })

  if (!result.ok) {
    console.warn(`[build-executor] Failed to push task ${taskId} to Studio: ${result.error}`)
  }
}

// ── Single task executor ──────────────────────────────────────────────────────

async function executeTask(
  task: BuildTask,
  userId: string,
  sessionId: string,
  progress: BuildProgress,
): Promise<void> {
  // Mark running
  const taskProgress = progress.tasks.find((t) => t.id === task.id)
  if (!taskProgress) return
  taskProgress.status = 'running'
  taskProgress.startedAt = new Date().toISOString()
  await writeProgress(progress)

  try {
    if (task.type === 'building' || task.type === 'prop') {
      // 3D mesh tasks — start the async mesh pipeline then push a placeholder
      const pipelineResult = await startMeshPipeline({
        userId,
        prompt: task.prompt,
        type: task.type === 'building' ? 'building' : 'prop',
        style: 'roblox',
        polyTarget: task.type === 'building' ? 8000 : 3000,
        textured: true,
        tokensCost: task.estimatedTokens,
      })

      taskProgress.assetId = pipelineResult.assetId
      taskProgress.status = 'complete'
      taskProgress.completedAt = new Date().toISOString()
    } else {
      // Script/terrain/ui/economy/npc/lighting/audio — generate Luau directly
      const luauCode = await generateLuauForTask(task)

      // Deduct tokens for this task
      await spendTokens(userId, task.estimatedTokens, `Build task: ${task.name}`, {
        buildId: progress.buildId,
        taskId: task.id,
        taskType: task.type,
      }).catch((err) => {
        console.warn(`[build-executor] Token spend failed for task ${task.id}:`, err)
      })

      // Push to Studio if session is connected
      if (sessionId && luauCode.length > 0) {
        pushToStudio(sessionId, task.id, luauCode)
      }

      taskProgress.luauCode = luauCode
      taskProgress.status = 'complete'
      taskProgress.completedAt = new Date().toISOString()
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[build-executor] Task ${task.id} failed: ${message}`)
    taskProgress.status = 'failed'
    taskProgress.errorMessage = message
    taskProgress.completedAt = new Date().toISOString()
  }

  await writeProgress(progress)
}

// ── Wave executor ─────────────────────────────────────────────────────────────

async function executeWave(
  wave: number,
  tasks: BuildTask[],
  userId: string,
  sessionId: string,
  progress: BuildProgress,
): Promise<void> {
  const waveTasks = tasks.filter((t) => t.wave === wave)
  if (waveTasks.length === 0) return

  progress.currentWave = wave
  await writeProgress(progress)

  // Run all tasks in this wave concurrently
  await Promise.allSettled(
    waveTasks.map((task) => executeTask(task, userId, sessionId, progress))
  )

  // Count completions
  progress.completedTasks = progress.tasks.filter(
    (t) => t.status === 'complete' || t.status === 'failed' || t.status === 'skipped'
  ).length
  progress.progress = Math.round((progress.completedTasks / progress.totalTasks) * 100)
  await writeProgress(progress)
}

// ── Main executor ─────────────────────────────────────────────────────────────

/**
 * Starts executing a BuildPlan asynchronously.
 * Returns immediately with a buildId — poll getBuildProgress() for status.
 */
export async function executeBuildPlan(
  plan: BuildPlan,
  userId: string,
  sessionId: string,
): Promise<{ buildId: string }> {
  const buildId = generateBuildId()

  const initialProgress: BuildProgress = {
    buildId,
    planId: plan.id,
    status: 'running',
    progress: 0,
    currentWave: 0,
    completedTasks: 0,
    totalTasks: plan.tasks.length,
    startedAt: new Date().toISOString(),
    tasks: plan.tasks.map((t) => ({
      id: t.id,
      name: t.name,
      type: t.type,
      wave: t.wave,
      status: 'pending' as TaskStatus,
    })),
  }

  await writeProgress(initialProgress)

  // Run in background — do not await
  void (async () => {
    try {
      for (let wave = 0; wave <= plan.totalWaves - 1; wave++) {
        const progress = await readProgress(buildId)
        if (!progress) break
        await executeWave(wave, plan.tasks, userId, sessionId, progress)
      }

      const finalProgress = await readProgress(buildId)
      if (finalProgress) {
        const hasFailed = finalProgress.tasks.every((t) => t.status === 'failed')
        finalProgress.status = hasFailed ? 'failed' : 'complete'
        finalProgress.completedAt = new Date().toISOString()
        finalProgress.progress = 100
        await writeProgress(finalProgress)
      }
    } catch (err) {
      const progress = await readProgress(buildId)
      if (progress) {
        progress.status = 'failed'
        progress.completedAt = new Date().toISOString()
        await writeProgress(progress)
      }
      console.error(`[build-executor] Build ${buildId} crashed:`, err)
    }
  })()

  return { buildId }
}

// ── Status poller ─────────────────────────────────────────────────────────────

/**
 * Fetch the current execution status of a build by ID.
 * Safe to call at any frequency — reads from Redis.
 */
export async function getBuildProgress(buildId: string): Promise<BuildProgress | null> {
  return readProgress(buildId)
}

// ── Plan storage (pre-execution approval flow) ────────────────────────────────

const PLAN_KEY = (planId: string) => `plan:${planId}`
const PLAN_TTL = 60 * 30  // 30 minutes to approve

export async function storePlan(plan: BuildPlan): Promise<void> {
  await redis.set(PLAN_KEY(plan.id), JSON.stringify(plan), 'EX', PLAN_TTL)
}

export async function retrievePlan(planId: string): Promise<BuildPlan | null> {
  const raw = await redis.get(PLAN_KEY(planId))
  if (!raw) return null
  try {
    return JSON.parse(raw) as BuildPlan
  } catch {
    return null
  }
}
