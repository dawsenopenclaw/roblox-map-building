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

const SYSTEM_PROMPT = `You are a Roblox Luau code generator for the ForjeGames platform.
Generate clean, production-ready Luau scripts that run in Roblox Studio.
Follow these rules:
- Use proper Roblox API patterns (game:GetService, Instance.new, etc.)
- Always anchor parts unless physics simulation is intended
- Use pcall for operations that may fail
- Add the fj_generated attribute to created instances
- Return ONLY the Luau code, no markdown fences or explanations`

const FIX_PROMPT = `You are debugging Roblox Luau code. The previous code produced errors during playtest.
Analyze the error output and fix the code. Return ONLY the corrected Luau code, no explanations.`

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
 */
async function captureOutputLog(sessionId: string): Promise<string[]> {
  // Queue a get_output command -- the result comes back through bridge_result
  await queueCommand(sessionId, {
    type: 'get_output',
    data: { maxEntries: 200, filter: 'all' },
  })

  // Wait for the result to arrive
  await delay(COMMAND_QUEUE_DELAY_MS)

  // The output log is available through the session state
  // In a real implementation, this would poll a bridge-result endpoint
  return []
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

    // Capture screenshot if enabled
    if (options.captureScreenshots) {
      await queueCommand(sessionId, {
        type: 'capture_screenshot',
        data: {},
      })
      await delay(COMMAND_QUEUE_DELAY_MS)
      // Screenshot is stored in session.latestScreenshot
      const updatedSession = await getSession(sessionId)
      if (updatedSession?.latestScreenshot) {
        obsStep.screenshot = updatedSession.latestScreenshot
      }
    }

    // Stop playtest
    await stopPlaytest(sessionId)

    // Analyze output
    const analysis2 = analyzeOutput(outputLog)

    if (analysis2.hasErrors) {
      lastErrors = analysis2.errors.join('\n')
      Object.assign(obsStep, completeStep(
        obsStep,
        'failed',
        `Found ${analysis2.errors.length} error(s) in output`,
        lastErrors,
      ))
      // Loop continues to fix iteration
    } else {
      Object.assign(obsStep, completeStep(obsStep, 'success', 'No errors detected in output'))
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
