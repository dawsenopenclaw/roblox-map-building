/**
 * Build Planner — AI-powered game decomposition engine.
 *
 * Takes a freeform user prompt ("build me a tycoon game") and uses Claude
 * to produce a structured BuildPlan: typed tasks, dependency graph,
 * parallel execution waves, and time/token cost estimates.
 *
 * The planner itself is pure — it only calls Claude and returns data.
 * Execution is handled by build-executor.ts.
 */

import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { serverEnv } from '@/lib/env'
import { callAI } from './provider'

// ── Lazy Anthropic client (kept for optional custom-key path only) ────────────
// Primary AI path now uses callAI() → Gemini (primary) + Groq (fallback).

let _anthropic: Anthropic | null = null
function getClient(): Anthropic | null {
  if (process.env.ANTHROPIC_DISABLED === 'true') return null
  if (_anthropic) return _anthropic
  const key = serverEnv.ANTHROPIC_API_KEY
  if (!key) return null
  _anthropic = new Anthropic({ apiKey: key })
  return _anthropic
}

// ── Public types ──────────────────────────────────────────────────────────────

export type BuildTaskType =
  | 'terrain'
  | 'building'
  | 'prop'
  | 'npc'
  | 'script'
  | 'ui'
  | 'economy'
  | 'lighting'
  | 'audio'

export interface BuildTask {
  id: string
  type: BuildTaskType
  name: string
  prompt: string
  /** IDs of tasks that must complete before this one starts */
  dependencies: string[]
  /** Parallel execution group — all tasks in the same wave run concurrently */
  wave: number
  /** Estimated Claude/pipeline token spend for this task */
  estimatedTokens: number
  /** Estimated wall-clock seconds to complete */
  estimatedSeconds: number
  /** Optional parameters passed to Luau template generators */
  templateParams?: Record<string, unknown>
}

export interface BuildPlan {
  id: string
  title: string
  description: string
  gameType: string
  tasks: BuildTask[]
  totalWaves: number
  estimatedTokens: number
  estimatedMinutes: number
  createdAt: string
}

// ── Zod schemas for Claude's JSON output ─────────────────────────────────────

const buildTaskSchema = z.object({
  id: z.string().regex(/^[a-z0-9_-]+$/, 'IDs must be lowercase alphanumeric + _ -'),
  type: z.enum(['terrain', 'building', 'prop', 'npc', 'script', 'ui', 'economy', 'lighting', 'audio']),
  name: z.string().min(1).max(120),
  prompt: z.string().min(10).max(1500),
  dependencies: z.array(z.string()),
  wave: z.number().int().min(0),
  estimatedTokens: z.number().int().min(50).max(5000),
  estimatedSeconds: z.number().int().min(2).max(300),
  templateParams: z.record(z.unknown()).optional(),
})

const buildPlanOutputSchema = z.object({
  title: z.string().min(1).max(80),
  description: z.string().min(10).max(500),
  gameType: z.string().min(1).max(60),
  tasks: z.array(buildTaskSchema).min(3).max(50),
})

type BuildPlanOutput = z.infer<typeof buildPlanOutputSchema>

// ── Token cost estimate per task type ────────────────────────────────────────

const TOKEN_COST_BY_TYPE: Record<BuildTaskType, number> = {
  terrain:  400,
  building: 500,
  prop:     300,
  npc:      350,
  script:   600,
  ui:       450,
  economy:  550,
  lighting: 200,
  audio:    150,
}

const SECONDS_BY_TYPE: Record<BuildTaskType, number> = {
  terrain:  25,
  building: 30,
  prop:     18,
  npc:      22,
  script:   35,
  ui:       28,
  economy:  32,
  lighting: 10,
  audio:    8,
}

// ── System prompt ─────────────────────────────────────────────────────────────

const PLANNER_SYSTEM_PROMPT = `You are an expert Roblox game architect and producer. Your job is to decompose a user's game idea into a detailed, executable build plan.

ROBLOX GAME DESIGN RULES:
- Character scale: 5 studs tall. All structures scale from this baseline.
- Door: 4w × 7h studs. Ceiling height: 12 studs min. Wall thickness: 0.5-1 studs.
- Materials: Cobblestone (castle), WoodPlanks (floors), Slate (roofs), Glass (windows), Metal (gates/fences), Neon (signage/effects), SmoothPlastic (modern), Granite (paths).
- Always Anchor static parts. Add PointLights to torches (Brightness=1.5, Range=16).
- Wrap all Studio mutations in ChangeHistoryService for undo support.
- Use Terrain:FillBlock for ground, Terrain:FillBall for organic terrain shapes.
- Scripts must be in ServerScriptService (server logic) or StarterPlayerScripts (client logic).
- Economy systems must be server-authoritative — never trust clients.
- UI goes in StarterGui with ScreenGui.ResetOnSpawn = false.

CRITICAL — TASK PROMPT DETAIL RULES:
When writing the "prompt" field for each task, you MUST include SPECIFIC architectural details. NEVER write vague prompts like "build a house" or "create a shop". Instead, specify:

For BUILDING tasks, the prompt MUST include:
- Exact dimensions (e.g., "24 studs wide, 20 studs deep, 2 floors")
- Style (e.g., "medieval stone", "modern glass", "victorian brick")
- Specific Color3.fromRGB values for walls, trim, and roof
- Required features: foundation, recessed windows with frames, door with frame, roof type (pitched/flat with parapet), corner trim, floor ledges between stories, interior floors, PointLights in windows
- Position: CFrame offset from origin so buildings don't overlap

For PROP tasks, the prompt MUST include:
- What the prop looks like (multiple Parts, not a single box)
- Dimensions in studs
- Material and Color3.fromRGB values
- Position relative to the building it belongs to
- Example: "A wooden market stall: 8x3x6 stud frame using WoodPlanks (Color3.fromRGB(139,90,43)), with a sloped canvas roof using Fabric (Color3.fromRGB(180,30,30)), counter slab in front, 2 support posts"

For TERRAIN tasks, the prompt MUST include:
- Map size in studs (e.g., "256x256")
- Multiple terrain layers: ground material, hills (positions + heights), paths/roads, water features, rock formations
- Biome type and specific materials to use

For NPC tasks, the prompt MUST describe:
- Visual appearance (body colors, clothing colors, accessories)
- Behavior type (patrol, idle, dialog, combat)
- Position in the world

TASK DECOMPOSITION RULES:
1. terrain tasks always go in wave 0 (they have no dependencies)
2. lighting tasks go in wave 0 (no dependencies, just Lighting service config)
3. building tasks depend on terrain (wave 1+)
4. prop tasks depend on at least one building task (wave 2+) — ALWAYS create separate prop tasks for interior furniture if a building has interiors
5. npc tasks depend on prop tasks being placed (wave 3+)
6. economy/script tasks can often run in parallel with building tasks (wave 1+)
7. ui tasks depend on economy/script (wave 2+)
8. audio tasks can run in wave 1 (no spatial dependencies)
9. Never create circular dependencies
10. For building tasks, set templateParams to include: style, withInterior (true for any building players enter), withWallDetail (always true), roomsPerFloor (2-4 for houses, 1 for shops, 0 for simple structures)
11. ALWAYS create at least one separate "prop" task per building for its interior furniture (tables, chairs, shelves, beds, etc.) — do NOT try to cram furniture into the building task

GAME TYPE BLUEPRINTS:

TYCOON: terrain(baseplate+terrain), building(factory/dropper/collectors x3-5), prop(machines/conveyors), economy(currency+dropper+upgrader+shop), script(server game loop+leaderboard), npc(optional), ui(hud+shop gui+upgrade panel), lighting(daytime industrial), audio(ambient factory sounds)

SIMULATOR: terrain(themed world), building(area1+area2+area3+hub), prop(collectibles+obstacles+decorations), economy(currency+multiplier+rebirth), script(click collecting+auto-collect+rebirth system), npc(merchant+tutorial), ui(hud+rebirth gui+inventory), lighting(bright cheerful), audio(collect sfx+ambient)

RPG: terrain(world map+dungeons), building(town+castle+dungeon1+dungeon2), prop(chests+npcs+obstacles), npc(questgivers+merchants+enemies), script(combat+inventory+quest tracker+saves), economy(gold+shop+equipment pricing), ui(health bar+inventory+quest log+dialog), lighting(epic dramatic), audio(battle music+ambient)

OBBY: terrain(void+platforms), building(checkpoint1+checkpoint2+checkpoint3+finish), prop(spinning obstacles+moving platforms+bouncy parts), script(checkpoint saving+timer+lives system), ui(timer+lives counter+completion screen), lighting(colorful fun), audio(level music)

ROLEPLAY: terrain(city map+interiors), building(houses+shops+school+park+police), prop(furniture+vehicles+decorations), npc(ambient pedestrians), script(job system+money+car spawn), economy(salary+shops+house prices), ui(phone gui+job hud+money display), lighting(realistic day-night cycle), audio(city ambience)

TOWER DEFENSE: terrain(path+base+enemy spawn), building(tower slots+base structure+path markers), prop(tower models+enemy models), script(wave spawner+tower placement+enemy pathfinding+lives), economy(gold+tower costs+upgrades), ui(wave counter+health bar+tower shop), lighting(strategic map lighting), audio(tower sfx+wave music)

OUTPUT FORMAT:
You must respond with ONLY a valid JSON object matching this exact structure. No markdown, no explanation, no code fences — just raw JSON:

{
  "title": "Short catchy name for the game",
  "description": "2-3 sentence description of what will be built",
  "gameType": "tycoon|simulator|rpg|obby|roleplay|tower_defense|custom",
  "tasks": [
    {
      "id": "unique_snake_case_id",
      "type": "terrain|building|prop|npc|script|ui|economy|lighting|audio",
      "name": "Human readable task name",
      "prompt": "Detailed Luau/Roblox Studio generation prompt for this specific task. Include exact dimensions, materials, colors (Color3.fromRGB values), structure names, and expected output.",
      "dependencies": ["id_of_task_1", "id_of_task_2"],
      "wave": 0,
      "estimatedTokens": 400,
      "estimatedSeconds": 25,
      "templateParams": { "key": "value" }
    }
  ]
}

Always produce 10–30 tasks for a full game. More complex games deserve more tasks. Ensure all dependency IDs reference real task IDs in your plan.`

// ── Wave assignment validator/fixer ──────────────────────────────────────────

/**
 * Validates the dependency graph is acyclic and recomputes wave numbers
 * using topological sort. Fixes any wave mismatches Claude produces.
 */
function computeWaves(tasks: BuildPlanOutput['tasks']): BuildPlanOutput['tasks'] {
  const idToTask = new Map(tasks.map((t) => [t.id, t]))
  const waveMap = new Map<string, number>()

  function resolveWave(taskId: string, visited = new Set<string>()): number {
    if (waveMap.has(taskId)) return waveMap.get(taskId)!
    if (visited.has(taskId)) {
      // Circular dependency — break by returning 0
      console.warn(`[build-planner] Circular dependency detected on task: ${taskId}`)
      return 0
    }
    visited.add(taskId)
    const task = idToTask.get(taskId)
    if (!task || task.dependencies.length === 0) {
      waveMap.set(taskId, 0)
      return 0
    }
    const maxDepWave = Math.max(
      ...task.dependencies.map((dep) => resolveWave(dep, new Set(visited)))
    )
    const wave = maxDepWave + 1
    waveMap.set(taskId, wave)
    return wave
  }

  for (const task of tasks) {
    resolveWave(task.id)
  }

  return tasks.map((t) => ({ ...t, wave: waveMap.get(t.id) ?? 0 }))
}

// ── ID generator ──────────────────────────────────────────────────────────────

function generatePlanId(): string {
  return `plan_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Decomposes a user's game prompt into a structured BuildPlan using Claude.
 *
 * @param userPrompt  Free-form description, e.g. "build me a sci-fi tycoon game"
 * @returns           Fully validated BuildPlan with wave-grouped tasks
 */
export async function generateBuildPlan(userPrompt: string): Promise<BuildPlan> {
  // Use Gemini (primary) → Groq (fallback). jsonMode asks Gemini for raw JSON.
  const rawText = await callAI(
    PLANNER_SYSTEM_PROMPT,
    [
      {
        role: 'user',
        content: `Generate a complete build plan for this Roblox game idea:\n\n"${userPrompt.slice(0, 1000)}"`,
      },
    ],
    { maxTokens: 6000, temperature: 0.3, jsonMode: true, useRAG: true, ragCategories: ['pattern', 'building', 'service'] },
  )

  // Strip any accidental markdown fences free models might add
  const jsonText = rawText
    .replace(/^```(?:json)?\n?/m, '')
    .replace(/\n?```$/m, '')
    .trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch (err) {
    throw new Error(`[build-planner] AI returned invalid JSON: ${String(err)}\nRaw: ${jsonText.slice(0, 200)}`)
  }

  const validated = buildPlanOutputSchema.safeParse(parsed)
  if (!validated.success) {
    const issues = validated.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    throw new Error(`[build-planner] Build plan failed validation: ${issues}`)
  }

  // Recompute waves from actual dependency graph (fixes any Claude errors)
  const tasksWithCorrectWaves = computeWaves(validated.data.tasks)

  const totalWaves = Math.max(...tasksWithCorrectWaves.map((t) => t.wave)) + 1

  // Apply per-type defaults for tokens/seconds if Claude's estimates are off
  const tasks: BuildTask[] = tasksWithCorrectWaves.map((t) => ({
    ...t,
    estimatedTokens: Math.max(t.estimatedTokens, TOKEN_COST_BY_TYPE[t.type]),
    estimatedSeconds: Math.max(t.estimatedSeconds, SECONDS_BY_TYPE[t.type]),
  }))

  // Compute totals — waves run in parallel, so time = sum of slowest task per wave
  const waveMaxSeconds = new Map<number, number>()
  for (const task of tasks) {
    const current = waveMaxSeconds.get(task.wave) ?? 0
    waveMaxSeconds.set(task.wave, Math.max(current, task.estimatedSeconds))
  }
  const totalSeconds = Array.from(waveMaxSeconds.values()).reduce((a, b) => a + b, 0)
  const totalTokens = tasks.reduce((a, t) => a + t.estimatedTokens, 0)

  return {
    id: generatePlanId(),
    title: validated.data.title,
    description: validated.data.description,
    gameType: validated.data.gameType,
    tasks,
    totalWaves,
    estimatedTokens: totalTokens,
    estimatedMinutes: Math.ceil(totalSeconds / 60),
    createdAt: new Date().toISOString(),
  }
}
