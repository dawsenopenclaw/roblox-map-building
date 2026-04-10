/**
 * Agentic Playtest Loop — Like Ropilot's autonomous testing
 *
 * Flow: Generate Code → Send to Studio → Start Playtest → Capture Screenshot
 *       → Get Output Log → Analyze Errors → Fix Code → Repeat
 *
 * This module provides the server-side orchestration for the autonomous
 * build-test-fix cycle that competitors like Ropilot use as their #1 differentiator.
 *
 * Uses the Studio Bridge MCP server's HTTP API to communicate with the
 * ForjeGames Studio Plugin.
 */

const API_BASE = process.env.FORJE_API_BASE ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

interface PlaytestStep {
  action: 'generate' | 'execute' | 'playtest' | 'screenshot' | 'analyze' | 'fix' | 'complete' | 'failed'
  details: string
  timestamp: number
  data?: unknown
}

interface PlaytestResult {
  success: boolean
  steps: PlaytestStep[]
  finalCode?: string
  errors?: string[]
  screenshots?: string[]
  iterations: number
}

interface StudioCommandResult {
  ok: boolean
  result?: unknown
  error?: string
}

/**
 * Send a command to the Studio Bridge via the ForjeGames API.
 * The Studio plugin polls /api/studio/sync and executes these commands.
 */
async function sendStudioCommand(
  sessionId: string,
  type: string,
  data: Record<string, unknown>,
  token: string,
): Promise<StudioCommandResult> {
  try {
    const res = await fetch(`${API_BASE}/api/studio/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Session-Id': sessionId,
      },
      body: JSON.stringify({ type, data, sessionId }),
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) {
      const err = await res.text().catch(() => String(res.status))
      return { ok: false, error: `Studio command failed (${res.status}): ${err}` }
    }

    const body = await res.json()
    return { ok: true, result: body }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Studio command failed' }
  }
}

/**
 * Wait for a result from the Studio plugin after queuing a command.
 */
async function waitForStudioResult(
  requestId: string,
  resultType: string,
  token: string,
  sessionId: string,
  timeoutMs = 15_000,
): Promise<StudioCommandResult> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 1_500))
    try {
      const res = await fetch(
        `${API_BASE}/api/studio/bridge-result?requestId=${requestId}&resultType=${resultType}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Session-Id': sessionId,
          },
          signal: AbortSignal.timeout(5_000),
        },
      )
      if (res.ok) {
        const body = await res.json()
        if (body.ready) return { ok: true, result: body.data }
      }
    } catch { /* retry */ }
  }
  return { ok: false, error: 'Timeout waiting for Studio result' }
}

/**
 * Run the full agentic playtest loop.
 *
 * @param code - The Luau code to test
 * @param sessionId - Studio plugin session ID
 * @param token - API auth token
 * @param maxIterations - Max fix-and-retry attempts (default 3)
 * @param onStep - Callback for streaming progress updates to the client
 */
export async function runAgenticPlaytest(
  code: string,
  sessionId: string,
  token: string,
  maxIterations = 3,
  onStep?: (step: PlaytestStep) => void,
): Promise<PlaytestResult> {
  const steps: PlaytestStep[] = []
  const screenshots: string[] = []
  let currentCode = code
  let iteration = 0

  function addStep(action: PlaytestStep['action'], details: string, data?: unknown) {
    const step: PlaytestStep = { action, details, timestamp: Date.now(), data }
    steps.push(step)
    onStep?.(step)
  }

  while (iteration < maxIterations) {
    iteration++
    addStep('execute', `Iteration ${iteration}: Sending code to Studio...`)

    // Step 1: Execute the code in Studio
    const execResult = await sendStudioCommand(sessionId, 'execute_code', {
      code: currentCode,
      target: 'ServerScriptService',
    }, token)

    if (!execResult.ok) {
      addStep('failed', `Failed to send code to Studio: ${execResult.error}`)
      return { success: false, steps, errors: [execResult.error || 'Unknown error'], iterations: iteration }
    }

    // Step 2: Wait briefly for code to initialize, then start playtest
    await new Promise((r) => setTimeout(r, 2_000))
    addStep('playtest', 'Starting playtest...')

    const playtestResult = await sendStudioCommand(sessionId, 'run_playtest', {}, token)
    if (!playtestResult.ok) {
      addStep('failed', `Failed to start playtest: ${playtestResult.error}`)
      // Still try to get output logs even if playtest fails
    }

    // Step 3: Wait for playtest to run for a few seconds
    await new Promise((r) => setTimeout(r, 5_000))

    // Step 4: Capture screenshot
    addStep('screenshot', 'Capturing viewport screenshot...')
    const screenshotResult = await sendStudioCommand(sessionId, 'capture_screenshot', {}, token)
    if (screenshotResult.ok && screenshotResult.result) {
      const ssData = screenshotResult.result as { screenshotUrl?: string }
      if (ssData.screenshotUrl) {
        screenshots.push(ssData.screenshotUrl)
      }
    }

    // Step 5: Get output log (errors, warnings, prints)
    addStep('analyze', 'Reading Studio output log...')
    const logResult = await sendStudioCommand(sessionId, 'get_output_log', {
      maxLines: 50,
      filter: 'errors',
    }, token)

    // Step 6: Stop playtest
    await sendStudioCommand(sessionId, 'stop_playtest', {}, token)

    // Step 7: Analyze errors
    const outputLog = logResult.ok ? logResult.result : null
    const errors = extractErrors(outputLog)

    if (errors.length === 0) {
      addStep('complete', `Playtest passed with no errors on iteration ${iteration}!`)
      return {
        success: true,
        steps,
        finalCode: currentCode,
        screenshots,
        iterations: iteration,
      }
    }

    // Step 8: If errors found and we have retries left, fix the code
    if (iteration < maxIterations) {
      addStep('fix', `Found ${errors.length} error(s). Fixing code (attempt ${iteration + 1})...`, { errors })

      // Call the chat API to fix the code based on errors
      try {
        const fixRes = await fetch(`${API_BASE}/api/ai/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: `Fix the following Luau code based on these errors:\n\nErrors:\n${errors.join('\n')}\n\nCode:\n\`\`\`lua\n${currentCode}\n\`\`\`\n\nReturn ONLY the fixed code, no explanations.`,
            model: 'claude-3-5-sonnet-20241022',
            stream: false,
            aiMode: 'debug',
            lastError: errors.join('\n'),
            retryAttempt: iteration,
            previousCode: currentCode,
          }),
        })

        if (fixRes.ok) {
          const fixData = await fixRes.json()
          const fixedCode = extractCodeFromResponse(fixData.content || fixData.text || '')
          if (fixedCode && fixedCode !== currentCode) {
            currentCode = fixedCode
            addStep('fix', `Code fixed. Retrying playtest...`)
            continue
          }
        }
      } catch {
        // Fix failed — report the errors
      }
    }

    addStep('failed', `Playtest failed after ${iteration} iteration(s). Errors: ${errors.join('; ')}`)
    return {
      success: false,
      steps,
      finalCode: currentCode,
      errors,
      screenshots,
      iterations: iteration,
    }
  }

  return { success: false, steps, finalCode: currentCode, errors: ['Max iterations reached'], screenshots, iterations: iteration }
}

/**
 * Extract error messages from Studio output log
 */
function extractErrors(output: unknown): string[] {
  if (!output) return []

  const errors: string[] = []
  const logStr = typeof output === 'string' ? output : JSON.stringify(output)

  // Match Roblox-style error patterns
  const errorPatterns = [
    /Error: (.+)/gi,
    /(.+):(\d+): (.+)/g,       // file:line: error
    /Script '(.+)', Line (\d+)/gi,
    /attempt to (.+)/gi,        // common Lua errors
    /expected (.+), got (.+)/gi,
    /invalid argument/gi,
    /stack overflow/gi,
    /ServerScriptService\.(.+):(\d+): (.+)/g,
  ]

  for (const pattern of errorPatterns) {
    const matches = logStr.matchAll(pattern)
    for (const match of matches) {
      errors.push(match[0].trim())
    }
  }

  return [...new Set(errors)] // deduplicate
}

/**
 * Extract Luau code from an AI response that may contain markdown
 */
function extractCodeFromResponse(text: string): string | null {
  // Try to extract from markdown code block
  const codeBlockMatch = text.match(/```(?:lua|luau)?\s*\n([\s\S]*?)```/)
  if (codeBlockMatch) return codeBlockMatch[1].trim()

  // If the whole response looks like code (no markdown), use it directly
  if (text.includes('local ') || text.includes('game.') || text.includes('Instance.new')) {
    return text.trim()
  }

  return null
}
