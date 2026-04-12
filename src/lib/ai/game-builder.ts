/**
 * Step-by-step game builder.
 *
 * Instead of generating one giant Luau block that tries to create an
 * entire game in a single execution, this breaks the build into 5-6
 * discrete steps. Each step:
 *   1. Generates focused Luau for ONE aspect of the game
 *   2. Sends it to Studio via execute_luau
 *   3. Waits for the plugin to execute
 *   4. Reports success/failure to the caller via an onStep callback
 *
 * Each step's Luau is shorter, more reliable, and builds ON TOP of
 * what previous steps created. The AI is told "you're building step N
 * of a game — previous steps already created X, Y, Z. Only add the
 * new elements for this step."
 *
 * Usage from the chat route or the /api/ai/build-game endpoint:
 *
 *   const result = await buildGameStepByStep(prompt, sessionId, {
 *     onStep: (step) => streamToClient(step),
 *   })
 */

import { callAI, type AIMessage } from './provider'
import { queueCommand, getSession } from '@/lib/studio-session'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BuildStep {
  index: number
  total: number
  title: string
  status: 'pending' | 'generating' | 'deploying' | 'done' | 'failed'
  luauCode?: string
  error?: string
  durationMs?: number
}

export interface BuildResult {
  success: boolean
  steps: BuildStep[]
  totalDurationMs: number
  errors: string[]
}

export interface BuildOptions {
  /** Called after each step completes. Use for SSE streaming. */
  onStep?: (step: BuildStep) => void
  /** Max time per step for AI generation (ms). Default 30000. */
  stepTimeoutMs?: number
}

// ---------------------------------------------------------------------------
// Step definitions — what each phase of a game build does
// ---------------------------------------------------------------------------

const GAME_BUILD_PHASES = [
  {
    title: 'Setting up the world',
    instruction: `Create the world layout: ground/platform, terrain, lighting, skybox, and all major physical structures (buildings, walls, floors, decorations). Use Instance.new for every Part. Set Lighting properties for atmosphere. Anchor all parts. Tag everything with CollectionService "fj_generated".`,
  },
  {
    title: 'Adding player systems',
    instruction: `Create the player systems: a ServerScript in ServerScriptService that on PlayerAdded creates a "leaderstats" Folder with all the IntValues/StringValues the game needs (Coins, XP, Level, Health, etc. as appropriate). Also create any player-specific attributes. Do NOT recreate any parts from step 1 — they already exist.`,
  },
  {
    title: 'Building core game mechanics',
    instruction: `Create the core gameplay ServerScripts: the main game loop, click handlers (ClickDetectors), proximity prompts (ProximityPrompts), enemy spawners, item collection, combat, progression — whatever the core mechanic is. Create each as a separate Instance.new("Script") in ServerScriptService with its .Source set. Wire RemoteEvents in ReplicatedStorage for anything that needs client communication. Do NOT recreate parts or leaderstats from earlier steps.`,
  },
  {
    title: 'Creating UI and client scripts',
    instruction: `Create the client-side UI and scripts: a LocalScript in StarterPlayerScripts (or StarterGui) that creates a ScreenGui with the HUD — coin counter, health bar, level display, minimap, or whatever the game needs. Connect it to the leaderstats created in step 2 using .Changed events. Also add any BillboardGuis or SurfaceGuis on world objects. Do NOT recreate server scripts, parts, or leaderstats.`,
  },
  {
    title: 'Adding sounds and polish',
    instruction: `Add the finishing touches: ambient sounds (Sound instances in SoundService or Workspace), particle effects (ParticleEmitter on relevant parts), TweenService animations for any moving parts, sound effects for key actions (clicks, purchases, level-ups, damage). Create a completion sound that plays on join. Make the game FEEL polished. Do NOT recreate anything from earlier steps.`,
  },
]

// ---------------------------------------------------------------------------
// System prompt for step-by-step generation
// ---------------------------------------------------------------------------

const STEP_SYSTEM_PROMPT = `You are a Roblox game architect building a game ONE STEP AT A TIME.

You are executing step {STEP_NUM} of {TOTAL_STEPS}: "{STEP_TITLE}"

CRITICAL RULES:
- Previous steps have ALREADY created parts, scripts, and systems in the workspace. DO NOT recreate them.
- Only create the NEW elements described in this step's instruction.
- Use game:GetService() for all services.
- Create scripts via Instance.new("Script"/"LocalScript") with .Source set using [[ long strings ]].
- Parent ServerScripts to ServerScriptService, LocalScripts to StarterPlayerScripts or StarterGui.
- Anchor all parts. Tag with CollectionService "fj_generated".
- Return ONLY Luau code. No markdown fences, no explanation.
- Start immediately with local statements.`

// ---------------------------------------------------------------------------
// Main builder
// ---------------------------------------------------------------------------

/**
 * Build a complete game step-by-step.
 *
 * @param prompt   The user's original game description
 * @param sessionId  Studio session ID for queueing commands
 * @param options  Callbacks and configuration
 */
export async function buildGameStepByStep(
  prompt: string,
  sessionId: string,
  options: BuildOptions = {},
): Promise<BuildResult> {
  const { onStep, stepTimeoutMs = 30_000 } = options
  const steps: BuildStep[] = []
  const errors: string[] = []
  const startTime = Date.now()

  // Verify session
  const session = await getSession(sessionId)
  if (!session?.connected) {
    return {
      success: false,
      steps: [],
      totalDurationMs: 0,
      errors: ['Studio session not connected'],
    }
  }

  // Track what previous steps created so the AI knows context
  const previousStepSummaries: string[] = []

  for (let i = 0; i < GAME_BUILD_PHASES.length; i++) {
    const phase = GAME_BUILD_PHASES[i]
    const step: BuildStep = {
      index: i + 1,
      total: GAME_BUILD_PHASES.length,
      title: phase.title,
      status: 'generating',
    }
    steps.push(step)
    onStep?.({ ...step })

    const stepStart = Date.now()

    // Build the prompt for this specific step
    const systemPrompt = STEP_SYSTEM_PROMPT
      .replace('{STEP_NUM}', String(i + 1))
      .replace('{TOTAL_STEPS}', String(GAME_BUILD_PHASES.length))
      .replace('{STEP_TITLE}', phase.title)

    const contextBlock = previousStepSummaries.length > 0
      ? `\n\nPREVIOUS STEPS ALREADY COMPLETED:\n${previousStepSummaries.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}\n\nDo NOT recreate any of the above.`
      : ''

    const userMessage = `GAME BEING BUILT:\n${prompt}\n\nTHIS STEP'S TASK:\n${phase.instruction}${contextBlock}\n\nGenerate the Luau code for this step only. Return ONLY code.`

    const messages: AIMessage[] = [{ role: 'user', content: userMessage }]

    try {
      const code = await callAI(systemPrompt, messages, {
        codeMode: true,
        maxTokens: 4096,
      })

      if (!code || code.trim().length < 20) {
        step.status = 'failed'
        step.error = 'AI returned empty or too-short response'
        step.durationMs = Date.now() - stepStart
        errors.push(`Step ${i + 1} (${phase.title}): empty response`)
        onStep?.({ ...step })
        continue // try next step anyway
      }

      // Strip markdown fences if present
      let cleanCode = code.trim()
      if (cleanCode.startsWith('```lua')) cleanCode = cleanCode.slice(6)
      else if (cleanCode.startsWith('```')) cleanCode = cleanCode.slice(3)
      if (cleanCode.endsWith('```')) cleanCode = cleanCode.slice(0, -3)
      cleanCode = cleanCode.trim()

      step.luauCode = cleanCode
      step.status = 'deploying'
      onStep?.({ ...step })

      // Send to Studio
      const result = await queueCommand(sessionId, {
        type: 'execute_luau',
        data: { code: cleanCode },
      })

      if (!result.ok) {
        step.status = 'failed'
        step.error = result.error ?? 'Failed to queue command'
        step.durationMs = Date.now() - stepStart
        errors.push(`Step ${i + 1} (${phase.title}): ${step.error}`)
        onStep?.({ ...step })
        continue
      }

      // Wait for plugin to execute (1s poll + execution time)
      await new Promise((r) => setTimeout(r, 3000))

      step.status = 'done'
      step.durationMs = Date.now() - stepStart
      previousStepSummaries.push(`${phase.title} — created ${phase.instruction.slice(0, 80)}...`)
      onStep?.({ ...step })

    } catch (err) {
      step.status = 'failed'
      step.error = err instanceof Error ? err.message : String(err)
      step.durationMs = Date.now() - stepStart
      errors.push(`Step ${i + 1} (${phase.title}): ${step.error}`)
      onStep?.({ ...step })
    }
  }

  const allDone = steps.every((s) => s.status === 'done')
  const someDone = steps.some((s) => s.status === 'done')

  return {
    success: allDone || someDone,
    steps,
    totalDurationMs: Date.now() - startTime,
    errors,
  }
}
