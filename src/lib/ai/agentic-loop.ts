/**
 * Agentic Self-Healing Loop
 *
 * Orchestrates a generate -> deploy -> playtest -> observe -> fix cycle.
 * Each iteration generates code from a prompt, deploys it to Studio via the
 * plugin command queue, starts a playtest, captures output + screenshot,
 * and analyzes the result. If errors are found, it feeds the error context
 * back into the AI to generate a fix, then loops.
 *
 * Designed to work with the Studio Bridge MCP server and the existing
 * ForjeGames build pipeline.
 */

import 'server-only'

import { callAI, type AIMessage } from './provider'
import { queueCommand, getSession } from '@/lib/studio-session'
import { analyzeLuau, autoFixLuau } from './static-analysis'
import { luauToStructuredCommands } from './structured-commands'
import { analyzePlaytestScreenshot, analyzePlaytestScene } from './playtest-vision'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AgenticPhase = 'generate' | 'deploy' | 'playtest' | 'observe' | 'fix'
export type AgenticStatus = 'pending' | 'running' | 'success' | 'failed'

export interface AgenticStep {
  phase: AgenticPhase
  status: AgenticStatus
  iteration: number
  result?: string
  error?: string
  screenshot?: string
  /** Workspace hierarchy snapshot captured via scan_workspace during observe */
  worldSnapshot?: unknown
  outputLog?: string[]
  timestamp: number
  durationMs?: number
}

export interface AgenticLoopResult {
  steps: AgenticStep[]
  success: boolean
  totalIterations: number
  finalCode?: string
}

export interface AgenticLoopOptions {
  /** Maximum number of generate-test-fix iterations */
  maxIterations?: number
  /** Seconds to wait after playtest starts before capturing output */
  playtestDurationSec?: number
  /** Whether to capture screenshots during observation */
  captureScreenshots?: boolean
  /** System prompt override for code generation */
  systemPrompt?: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_MAX_ITERATIONS = 3
const DEFAULT_PLAYTEST_DURATION_SEC = 5
const COMMAND_QUEUE_DELAY_MS = 2_000
const PLAYTEST_POLL_INTERVAL_MS = 1_000

const SYSTEM_PROMPT = `You are a Roblox game architect for the ForjeGames platform.

When asked to build a game (simulator, tycoon, obby, TD, RPG, horror, etc.),
you generate a SINGLE Luau block that assembles a COMPLETE playable game in one
run — world, leaderstats, scripts, and UI — not a single-purpose snippet.

## What "complete" means
A user should be able to run your code once in a fresh baseplate and immediately
have a working game: parts spawned, leaderstats wired, server/client scripts
created and started, ProximityPrompts hooked up, and a clear player loop.

## Required architecture
- Use game:GetService() for every service you touch (Workspace, Players,
  ServerScriptService, StarterPlayerScripts, StarterGui, Lighting, TweenService,
  RunService, CollectionService, ReplicatedStorage).
- Create scripts via Instance.new("Script") / Instance.new("LocalScript") /
  Instance.new("ModuleScript"), set their .Source with a Luau string literal
  (use [[ ... ]] long-strings to avoid escaping), then Parent them to the
  correct service.
- ServerScripts go to ServerScriptService. LocalScripts go to
  StarterPlayerScripts (or StarterGui for UI).
- leaderstats: create a "leaderstats" Folder under Player on PlayerAdded and
  add the IntValues / StringValues the game needs (Coins, XP, Level, etc.).
- Wire RemoteEvents via Instance.new("RemoteEvent") Parented to
  ReplicatedStorage when server→client or client→server communication is
  needed.
- Every created Part must be Anchored=true (unless the mechanic explicitly
  requires physics) AND tagged via game:GetService("CollectionService"):AddTag(part, "fj_generated").
- Wrap any DataStore calls in pcall; leave persistence as
  warn("[ForjeAI] DataStore persistence TODO").
- Use TweenService for any animation — never loops with task.wait for motion.

## Output shape
Return ONE Luau code block that runs end-to-end when executed once. No
markdown fences, no explanations, no chat, no preface. Start immediately with
Luau code (local Players = game:GetService("Players")... style).

## If the user request is vague
Make confident choices and build a real game. Do not ask clarifying questions.
The user's intent is "produce something playable" — a reasonable complete game
is always better than a half-built question.`

const FIX_PROMPT = `You are a Roblox game architect debugging Luau code.

The previous Luau ran in Roblox Studio and produced issues during playtest.
You receive: the original user request, the previous full code, and a list
of issues tagged [harness], [console], or [visual]:
  - [harness] — pcall failures the test wrapper raised.
  - [console] — LogService messageType=error output the plugin captured.
  - [visual] — scene manifest analysis found missing/misplaced content.

Fix ALL issues in one pass. Keep the "complete game" architecture from the
original — scripts, leaderstats, world, UI — don't regress to a snippet.

Return ONLY the corrected Luau code (no fences, no explanation, no preface).`

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createStep(
  phase: AgenticPhase,
  iteration: number,
  status: AgenticStatus = 'pending',
): AgenticStep {
  return { phase, status, iteration, timestamp: Date.now() }
}

function completeStep(step: AgenticStep, status: AgenticStatus, result?: string, error?: string): AgenticStep {
  return {
    ...step,
    status,
    result,
    error,
    durationMs: Date.now() - step.timestamp,
  }
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---------------------------------------------------------------------------
// Phase implementations
// ---------------------------------------------------------------------------

/**
 * Generate Luau code from a prompt using the AI provider.
 */
async function generateCode(
  prompt: string,
  previousCode?: string,
  errorContext?: string,
  systemPromptOverride?: string,
): Promise<{ code: string | null; error?: string }> {
  const messages: AIMessage[] = []

  if (previousCode && errorContext) {
    // Fix mode: include the broken code and errors
    messages.push({
      role: 'user',
      content: [
        `Original request: ${prompt}`,
        '',
        'Previous code that produced errors:',
        '```lua',
        previousCode,
        '```',
        '',
        'Errors from playtest output:',
        errorContext,
        '',
        'Fix the code to resolve these errors. Return ONLY the corrected Luau code.',
      ].join('\n'),
    })
  } else {
    messages.push({ role: 'user', content: prompt })
  }

  const systemPrompt = previousCode ? FIX_PROMPT : (systemPromptOverride ?? SYSTEM_PROMPT)

  try {
    const response = await callAI(systemPrompt, messages, {
      codeMode: true,
      maxTokens: 4096,
    })

    if (!response) {
      return { code: null, error: 'AI returned empty response' }
    }

    // Strip markdown code fences if present
    let code = response.trim()
    if (code.startsWith('```lua')) {
      code = code.slice(6)
    } else if (code.startsWith('```')) {
      code = code.slice(3)
    }
    if (code.endsWith('```')) {
      code = code.slice(0, -3)
    }
    code = code.trim()

    return { code }
  } catch (err) {
    return { code: null, error: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * Run static analysis on generated code before deploying.
 */
function runStaticAnalysis(code: string): { valid: boolean; errors: string[]; fixedCode?: string } {
  const analysis = analyzeLuau(code)
  const analysisErrors = analysis.issues.filter((i) => i.severity === 'error')

  if (analysisErrors.length === 0) {
    return { valid: true, errors: [] }
  }

  // Attempt auto-fix
  const fixed = autoFixLuau(code)
  const reanalysis = analyzeLuau(fixed)
  const reanalysisErrors = reanalysis.issues.filter((i) => i.severity === 'error')

  if (reanalysisErrors.length === 0) {
    return { valid: true, errors: [], fixedCode: fixed }
  }

  return {
    valid: false,
    errors: reanalysisErrors.map((e) => `Line ${e.line}: ${e.message}`),
    fixedCode: fixed,
  }
}

/**
 * Deploy code to Studio via the command queue.
 *
 * Branches on plugin edition (mirrors src/app/api/ai/chat/route.ts):
 *   - Creator Store edition (pluginVersion ends in `-store`) cannot run
 *     loadstring(), so we translate the Luau to structured commands and
 *     queue `structured_commands`. If the code contains constructs the
 *     translator cannot handle, we fail the deploy with a clear message.
 *   - Direct-download edition receives raw Luau via `execute_luau`.
 */
async function deployToStudio(
  sessionId: string,
  code: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession(sessionId)
  const isStoreEdition = session?.pluginVersion?.endsWith('-store') ?? false

  if (isStoreEdition) {
    const { commands, hasUntranslatableCode, warnings } = luauToStructuredCommands(code)
    if (hasUntranslatableCode) {
      return {
        ok: false,
        error:
          'Generated Luau contains constructs that cannot be translated to structured commands for the Creator Store plugin edition' +
          (warnings.length > 0 ? ` (${warnings.join('; ')})` : '') +
          '. Use the direct-download plugin edition for this prompt.',
      }
    }
    if (commands.length === 0) {
      return {
        ok: false,
        error: 'Translation produced zero structured commands; nothing to deploy to the store-edition plugin.',
      }
    }
    const result = await queueCommand(sessionId, {
      type: 'structured_commands',
      data: { commands },
    })
    if (!result.ok) {
      return { ok: false, error: result.error ?? 'Failed to queue structured_commands' }
    }
    await delay(COMMAND_QUEUE_DELAY_MS)
    return { ok: true }
  }

  // Direct-download plugin: raw Luau via loadstring
  const result = await queueCommand(sessionId, {
    type: 'execute_luau',
    data: { code },
  })

  if (!result.ok) {
    return { ok: false, error: result.error ?? 'Failed to queue command' }
  }

  // Give the plugin time to pick up and execute the command
  await delay(COMMAND_QUEUE_DELAY_MS)
  return { ok: true }
}

/**
 * Start a playtest in Studio.
 */
async function startPlaytest(sessionId: string): Promise<{ ok: boolean; error?: string }> {
  const result = await queueCommand(sessionId, {
    type: 'start_playtest',
    data: { mode: 'server' },
  })
  return result.ok ? { ok: true } : { ok: false, error: result.error }
}

/**
 * Stop the playtest.
 */
async function stopPlaytest(sessionId: string): Promise<void> {
  await queueCommand(sessionId, {
    type: 'stop_playtest',
    data: {},
  })
  await delay(1_000)
}

/**
 * Capture the output log from Studio.
 *
 * Queues a `get_output` command and reads the result back from two places:
 *   1. `session.latestOutputLog` — the plugin POSTs its LogService ring
 *      buffer to /api/studio/update with event=output_log. This is the
 *      uncorrelated fallback that always has the freshest data.
 *   2. bridge-result correlated read — not used here because the agentic
 *      loop does not currently propagate requestId to the plugin; we rely
 *      on the session-state path which is simpler and always fresh.
 */
async function captureOutputLog(sessionId: string): Promise<string[]> {
  // Remember the pre-command output log size so we can diff it later and
  // only return messages that showed up during this observe window
  const preSession = await getSession(sessionId)
  const preLog = Array.isArray(
    (preSession?.latestState as Record<string, unknown> | undefined)?.outputLog,
  )
    ? ((preSession!.latestState as { outputLog: unknown[] }).outputLog as unknown[])
    : []
  const preCount = preLog.length

  // Queue a get_output command. Plugin handler POSTs the ring buffer to
  // /api/studio/update with event=output_log, which stores it on
  // session.latestState.outputLog (see update/route.ts).
  await queueCommand(sessionId, {
    type: 'get_output',
    data: { limit: 200, clear: false },
  })

  // Wait for the plugin to poll, run the command, and POST the result back
  await delay(COMMAND_QUEUE_DELAY_MS * 2)

  const updated = await getSession(sessionId)
  const rawLog = (updated?.latestState as Record<string, unknown> | undefined)?.outputLog
  if (!Array.isArray(rawLog)) return []

  // Each entry is { time, text, type, seq } from the plugin. Flatten to
  // strings so analyzeOutput() can regex-scan them. Only return messages
  // newer than the pre-command snapshot so we don't re-flag old noise.
  const newMessages = rawLog.slice(preCount) as Array<Record<string, unknown>>
  return newMessages
    .map((entry) => {
      const type = typeof entry.type === 'string' ? entry.type.toUpperCase() : 'OUTPUT'
      const text = typeof entry.text === 'string' ? entry.text : ''
      return `[${type}] ${text}`
    })
    .filter((s) => s.trim().length > 0)
}

/**
 * Analyze output log for errors.
 */
function analyzeOutput(logEntries: string[]): {
  hasErrors: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  for (const entry of logEntries) {
    const lower = entry.toLowerCase()
    if (
      lower.includes('error') ||
      lower.includes('attempt to') ||
      lower.includes('is not a valid member') ||
      lower.includes('expected') ||
      lower.includes('stack traceback')
    ) {
      errors.push(entry)
    } else if (lower.includes('warn') || lower.includes('deprecated')) {
      warnings.push(entry)
    }
  }

  return {
    hasErrors: errors.length > 0,
    errors,
    warnings,
  }
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------

/**
 * Run the agentic self-healing loop.
 *
 * Flow per iteration:
 *   1. Generate code from the prompt (or fix code if errors were found)
 *   2. Run static analysis -- auto-fix if possible
 *   3. Deploy the code to Studio via the plugin command queue
 *   4. Start a playtest
 *   5. Wait, then capture screenshot + output log
 *   6. Stop the playtest
 *   7. Analyze output for errors
 *   8. If errors, loop back with error context; if clean, done
 */
export async function runAgenticLoop(
  prompt: string,
  sessionId: string,
  options: AgenticLoopOptions = {},
): Promise<AgenticLoopResult> {
  const maxIterations = options.maxIterations ?? DEFAULT_MAX_ITERATIONS
  const playtestDuration = (options.playtestDurationSec ?? DEFAULT_PLAYTEST_DURATION_SEC) * 1_000

  const steps: AgenticStep[] = []
  let currentCode: string | null = null
  let lastErrors: string | undefined
  let success = false

  // Verify session exists and is connected
  const session = await getSession(sessionId)
  if (!session || !session.connected) {
    steps.push(
      completeStep(
        createStep('generate', 0),
        'failed',
        undefined,
        `Studio session ${sessionId} is not connected`,
      ),
    )
    return { steps, success: false, totalIterations: 0 }
  }

  for (let i = 0; i < maxIterations; i++) {
    const isFixIteration = i > 0 && lastErrors

    // ---- Phase 1: Generate (or Fix) ----
    const genStep = createStep(isFixIteration ? 'fix' : 'generate', i, 'running')
    steps.push(genStep)

    const genResult = await generateCode(
      prompt,
      isFixIteration ? (currentCode ?? undefined) : undefined,
      isFixIteration ? lastErrors : undefined,
      options.systemPrompt,
    )

    if (!genResult.code) {
      Object.assign(genStep, completeStep(genStep, 'failed', undefined, genResult.error))
      break
    }

    // Run static analysis
    const analysis = runStaticAnalysis(genResult.code)
    currentCode = analysis.fixedCode ?? genResult.code

    if (!analysis.valid) {
      Object.assign(genStep, completeStep(
        genStep,
        'failed',
        `Static analysis found ${analysis.errors.length} issue(s)`,
        analysis.errors.join('; '),
      ))
      lastErrors = analysis.errors.join('\n')
      continue
    }

    Object.assign(genStep, completeStep(genStep, 'success', 'Code generated and passed static analysis'))

    // ---- Phase 2: Deploy ----
    const deployStep = createStep('deploy', i, 'running')
    steps.push(deployStep)

    const deployResult = await deployToStudio(sessionId, currentCode)
    if (!deployResult.ok) {
      Object.assign(deployStep, completeStep(deployStep, 'failed', undefined, deployResult.error))
      break
    }
    Object.assign(deployStep, completeStep(deployStep, 'success', 'Code deployed to Studio'))

    // ---- Phase 3: Playtest ----
    const ptStep = createStep('playtest', i, 'running')
    steps.push(ptStep)

    const ptResult = await startPlaytest(sessionId)
    if (!ptResult.ok) {
      Object.assign(ptStep, completeStep(ptStep, 'failed', undefined, ptResult.error))
      // Playtest failed to start -- still try to observe the deploy result
    } else {
      Object.assign(ptStep, completeStep(ptStep, 'success', 'Playtest started'))
    }

    // ---- Phase 4: Observe ----
    const obsStep = createStep('observe', i, 'running')
    steps.push(obsStep)

    // Wait for the playtest to run
    await delay(playtestDuration)

    // Capture output log
    const outputLog = await captureOutputLog(sessionId)
    obsStep.outputLog = outputLog

    // Capture screenshot (if the plugin ever supports it) AND a workspace
    // scan. The scan is the real production path: the plugin's
    // `cmdScanWorkspace` returns a hierarchy of BaseParts with positions,
    // sizes, materials, and colors — enough for a text-based LLM to judge
    // whether the scene matches the user's prompt. Screenshot path is kept
    // for forward-compat with a future plugin that can actually grab pixels.
    if (options.captureScreenshots) {
      await queueCommand(sessionId, {
        type: 'capture_screenshot',
        data: {},
      })
      // Queue a real workspace scan — plugin handler exists and its tree
      // will be POSTed to /api/studio/update → session.latestState.worldSnapshot
      // (once the plugin fix that stops discarding the scan result ships).
      await queueCommand(sessionId, {
        type: 'scan_workspace',
        data: { maxDepth: 4, maxNodes: 300 },
      })
      await delay(COMMAND_QUEUE_DELAY_MS)
      const updatedSession = await getSession(sessionId)
      if (updatedSession?.latestScreenshot) {
        obsStep.screenshot = updatedSession.latestScreenshot
      }
      // Pull the freshest worldSnapshot from latestState for the scene check
      const snapshot =
        (updatedSession?.latestState as Record<string, unknown> | undefined)?.worldSnapshot
      if (snapshot) {
        obsStep.worldSnapshot = snapshot
      }
    }

    // Stop playtest
    await stopPlaytest(sessionId)

    // Analyze output
    const analysis2 = analyzeOutput(outputLog)

    // Semantic check — closes the Apr 9 audit gap where the loop captured
    // snapshots but never read them back for decision-making, so
    // visually-broken builds (parts fallen through the floor, missing assets,
    // empty workspace) passed the loop as long as the console was clean.
    // Two analyzers, tried in order:
    //   1. Scene manifest via text LLM — WORKS TODAY (plugin provides
    //      scan_workspace tree).
    //   2. Pixel vision via Gemini — kept for the day Roblox exposes a
    //      plugin screenshot API.
    // Both fail soft: missing API key or an API error returns ok=true
    // with a skippedReason, and the loop behaves exactly as before.
    let visionIssues: string[] = []
    if (!analysis2.hasErrors) {
      // Prefer the scene path — it's the one that actually runs in prod
      if (obsStep.worldSnapshot) {
        const scene = await analyzePlaytestScene(obsStep.worldSnapshot, prompt)
        if (!scene.ok) {
          visionIssues = scene.issues
        }
      }
      // Also run the pixel path if we somehow have a real screenshot AND the
      // scene path didn't already surface issues — redundancy is cheap here,
      // each analyzer catches different bug classes.
      if (visionIssues.length === 0 && obsStep.screenshot) {
        const vision = await analyzePlaytestScreenshot(obsStep.screenshot, prompt)
        if (!vision.ok) {
          visionIssues = vision.issues
        }
      }
    }

    if (analysis2.hasErrors || visionIssues.length > 0) {
      const logPart = analysis2.errors.join('\n')
      const visionPart =
        visionIssues.length > 0
          ? `Visual issues detected in playtest screenshot:\n- ${visionIssues.join('\n- ')}`
          : ''
      lastErrors = [logPart, visionPart].filter(Boolean).join('\n\n')
      const totalIssues = analysis2.errors.length + visionIssues.length
      Object.assign(obsStep, completeStep(
        obsStep,
        'failed',
        `Found ${totalIssues} issue(s) (${analysis2.errors.length} console, ${visionIssues.length} visual)`,
        lastErrors,
      ))
      // Loop continues to fix iteration
    } else {
      Object.assign(obsStep, completeStep(obsStep, 'success', 'No errors detected in output or screenshot'))
      success = true
      break
    }
  }

  return {
    steps,
    success,
    totalIterations: Math.min(
      maxIterations,
      steps.filter((s) => s.phase === 'generate' || s.phase === 'fix').length,
    ),
    finalCode: currentCode ?? undefined,
  }
}
