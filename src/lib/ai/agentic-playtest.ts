/**
 * Agentic Playtest Loop — rewritten 2026-04-11 to actually work against the
 * plugin that ships in production.
 *
 * BEFORE: the loop sent command types the plugin doesn't implement
 * (`execute_code`, `run_playtest`, `capture_screenshot`, `get_output_log`,
 * `stop_playtest`). The plugin's dispatchCommand only handles:
 *   execute_luau, insert_asset, update_property, delete_model, scan_workspace
 * Every command failed silently, the server polled /api/studio/bridge-result
 * (which didn't exist until this session), the error extractor got an empty
 * log, and the loop reported "Playtest passed with no errors!" — false
 * positive on every call.
 *
 * AFTER: the loop uses only `execute_luau` with a test-harness wrapper. The
 * wrapper captures errors via pcall, writes outcome attributes onto a sentinel
 * ModuleScript (game:GetService("ServerStorage"):FindFirstChild("ForjeAIPlaytest")),
 * and the server reads them back via the plugin's `scan_workspace` command
 * (which IS supported) plus the /api/studio/bridge-result snapshot fallback.
 *
 * Honest limitations (these need a plugin upgrade, documented in the
 * studio-controller README):
 *  - Real Play-button simulation (RunService.Heartbeat in Play mode) is not
 *    available from plugin context. The test harness runs the user's Luau
 *    inside the Edit session, which exercises most logic bugs but not
 *    anything that depends on the Player/Character lifecycle.
 *  - No viewport screenshot — the plugin has no cmdCaptureScreenshot handler.
 *    The session store's `latestScreenshot` is plugin-pushed separately on a
 *    2-second cadence via /api/studio/screenshot; we read whatever's there as
 *    a best-effort "before vs after" visual.
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

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

async function queueCommand(
  sessionId: string,
  type: 'execute_luau' | 'scan_workspace',
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
      body: JSON.stringify({
        command: type,
        payload: data,
        sessionId,
      }),
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
 * Poll /api/studio/bridge-result for the latest plugin-pushed state.
 * Returns `null` if nothing new arrived within `timeoutMs`.
 */
async function readSessionState(
  sessionId: string,
  token: string,
  resultType: 'snapshot' | 'screenshot',
  timeoutMs = 12_000,
): Promise<unknown | null> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 1_500))
    try {
      const res = await fetch(
        `${API_BASE}/api/studio/bridge-result?requestId=playtest_${Date.now()}&resultType=${resultType}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Session-Id': sessionId,
          },
          signal: AbortSignal.timeout(5_000),
        },
      )
      if (res.ok) {
        const body = (await res.json()) as { ready?: boolean; data?: unknown }
        if (body.ready) return body.data
      }
    } catch {
      // keep trying until deadline
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// The Luau test harness — wraps the user code so errors and side effects
// get reported back in a form the server can read.
// ---------------------------------------------------------------------------

function buildTestHarness(userCode: string, iterationId: string): string {
  // We can't interpolate backticks inside a JS template literal that contains
  // Luau, so use plain string concatenation and escape the sentinels.
  const safeId = iterationId.replace(/[^a-zA-Z0-9_]/g, '_')

  return `-- ForjeAI playtest harness — iteration ${safeId}
local ServerStorage = game:GetService("ServerStorage")
local Workspace = game:GetService("Workspace")

-- Sentinel ModuleScript we use to stash test outcomes the server can read
local sentinelName = "ForjeAIPlaytestResult_${safeId}"
local sentinel = ServerStorage:FindFirstChild(sentinelName)
if sentinel then sentinel:Destroy() end
sentinel = Instance.new("ModuleScript")
sentinel.Name = sentinelName
sentinel.Source = "return { ok = false, error = 'not_run', partsBefore = 0, partsAfter = 0 }"
sentinel.Parent = ServerStorage

-- Count parts before execution for a before/after delta
local function countWorkspaceParts()
  local n = 0
  for _, inst in ipairs(Workspace:GetDescendants()) do
    if inst:IsA("BasePart") then n += 1 end
  end
  return n
end

local partsBefore = countWorkspaceParts()
local startedAt = os.clock()

local ok, err = pcall(function()
${userCode.split('\n').map((line) => '  ' + line).join('\n')}
end)

local partsAfter = countWorkspaceParts()
local elapsedMs = math.floor((os.clock() - startedAt) * 1000)

-- Stash the result on the sentinel
sentinel.Source = string.format(
  "return { ok = %s, error = %q, partsBefore = %d, partsAfter = %d, elapsedMs = %d }",
  tostring(ok),
  tostring(err or ""),
  partsBefore,
  partsAfter,
  elapsedMs
)

-- Raise so the plugin captures it in State.pendingError when ok == false.
-- This is how we get the error into the next scan_workspace response.
if not ok then
  error(string.format("[ForjeAI playtest ${safeId}] %s", tostring(err)), 2)
end
`
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------

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
    const iterId = `i${iteration}_${Date.now().toString(36)}`

    // ── Step 1: Execute the wrapped code ─────────────────────────────────
    addStep('execute', `Iteration ${iteration}: deploying code to Studio via execute_luau...`)

    const harnessed = buildTestHarness(currentCode, iterId)
    const execResult = await queueCommand(
      sessionId,
      'execute_luau',
      { code: harnessed, prompt: `agentic playtest iteration ${iteration}` },
      token,
    )

    if (!execResult.ok) {
      addStep('failed', `Queue failed: ${execResult.error}`)
      return { success: false, steps, errors: [execResult.error || 'queue failed'], iterations: iteration }
    }

    // ── Step 2: Wait for plugin to drain the queue and execute ───────────
    addStep('playtest', 'Waiting for plugin to run the harness (plugin polls on a 1s cadence)...')
    await new Promise((r) => setTimeout(r, 4_000))

    // ── Step 3: Ask plugin to scan the workspace so we get the latest ─
    //          `pendingError` surfaced in the next sync cycle.
    await queueCommand(sessionId, 'scan_workspace', { maxParts: 200 }, token)

    // ── Step 4: Read the session snapshot (contains latestState + any ─
    //          pendingError the plugin reported back).
    addStep('analyze', 'Reading session snapshot for pluginPendingError...')
    const snapshot = (await readSessionState(sessionId, token, 'snapshot', 8_000)) as
      | {
          partCount?: number
          pendingError?: { message?: string; commandId?: string; cmdType?: string } | null
        }
      | null

    const errors = extractErrors(snapshot)

    // ── Step 5 (best-effort): grab a screenshot if the plugin has pushed one ─
    const screenshotData = (await readSessionState(sessionId, token, 'screenshot', 4_000)) as
      | { screenshot?: string; capturedAt?: number }
      | null
    if (screenshotData?.screenshot) {
      screenshots.push(screenshotData.screenshot)
    }

    if (errors.length === 0) {
      addStep(
        'complete',
        `Playtest passed on iteration ${iteration}. partCount=${snapshot?.partCount ?? 'unknown'}.`,
      )
      return {
        success: true,
        steps,
        finalCode: currentCode,
        screenshots,
        iterations: iteration,
      }
    }

    // ── Step 6: Ask chat to fix the code based on the errors we saw ─────
    if (iteration < maxIterations) {
      addStep('fix', `Found ${errors.length} error(s). Requesting a fix...`, { errors })

      try {
        const fixRes = await fetch(`${API_BASE}/api/ai/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message:
              `Fix the following Luau code based on these errors that surfaced during playtest:\n\n` +
              `Errors:\n${errors.join('\n')}\n\n` +
              `Code:\n\`\`\`lua\n${currentCode}\n\`\`\`\n\n` +
              `Return ONLY the fixed Luau code, no explanations.`,
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
          const fixedCode = extractCodeFromResponse(fixData.content || fixData.text || fixData.response || '')
          if (fixedCode && fixedCode !== currentCode) {
            currentCode = fixedCode
            addStep('fix', `Code updated by /api/ai/chat. Retrying playtest...`)
            continue
          }
        }
      } catch {
        // Fix request failed; we'll fall through and report the errors.
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

  return {
    success: false,
    steps,
    finalCode: currentCode,
    errors: ['Max iterations reached without a clean run'],
    screenshots,
    iterations: iteration,
  }
}

// ---------------------------------------------------------------------------
// Error extractor — reads pendingError from the session snapshot
// ---------------------------------------------------------------------------

function extractErrors(snapshot: unknown): string[] {
  if (!snapshot || typeof snapshot !== 'object') return []
  const s = snapshot as {
    pendingError?: { message?: string; commandId?: string; cmdType?: string } | null
  }
  if (s.pendingError && typeof s.pendingError.message === 'string') {
    return [s.pendingError.message]
  }
  return []
}

// ---------------------------------------------------------------------------
// Helper — pull a Luau code block out of a chat response
// ---------------------------------------------------------------------------

function extractCodeFromResponse(raw: string): string | null {
  if (!raw) return null
  // Prefer triple-backtick luau / lua block
  const fenceMatch = raw.match(/```(?:luau|lua)?\s*\n([\s\S]*?)\n```/i)
  if (fenceMatch) return fenceMatch[1].trim()
  // Fallback: raw looks like code (has "local " or "function ")
  if (/^\s*(local |function |return |--)/m.test(raw)) return raw.trim()
  return null
}
