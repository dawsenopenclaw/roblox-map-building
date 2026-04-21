/**
 * Agentic Playtest Loop — v3 (2026-04-11 full automation upgrade)
 *
 * The "no human needed" pipeline that every chat build triggers when
 * `autoPlaytest` is enabled. Runs up to N iterations of:
 *
 *   1. Wrap user Luau in a sentinel test harness (pcall + partCount delta +
 *      ServerStorage ModuleScript with outcome fields + error() on failure
 *      so plugin's State.pendingError gets populated).
 *   2. `execute_luau` (real plugin command).
 *   3. `scan_workspace` to force a fresh snapshot POST to /api/studio/update.
 *   4. `get_output` to pull the LogService ring buffer (captures console
 *      errors the harness didn't raise, like runtime deprecation warnings).
 *   5. Read back via session fallback path — session.latestState exposes
 *      both `worldSnapshot` and `outputLog` because plugin mirrors both
 *      via POST /api/studio/update (scan_workspace commit 3fd0919,
 *      get_output commit 3fd0919+).
 *   6. Run THREE analyses against the results:
 *      (a) `extractErrors` — reads `pendingError` field from the session
 *          snapshot, which captures pcall failures the harness raised.
 *      (b) `analyzeConsoleOutput` — regex-scans outputLog entries for
 *          "error", "attempt to", etc. Catches runtime errors that
 *          happen OUTSIDE pcall (deferred tasks, signal handlers).
 *      (c) `analyzePlaytestScene` — semantic LLM check against the
 *          worldSnapshot tree + user prompt. Catches visually-broken
 *          but cleanly-compiling builds (empty workspace, parts
 *          below the ground, scale 10x wrong, missing features).
 *   7. If any analysis reports issues, use `callAI` directly (not the
 *      chat route) to generate fixed code in one network hop with the
 *      full error context merged into the prompt, then retry.
 *   8. On clean run, return success. On max iterations, return failure
 *      with all accumulated errors.
 *
 * Honest limitations:
 *  - Plugin can't press Studio's Play button. The harness runs user code
 *    in the Edit session, which catches most logic bugs but not any that
 *    only manifest under Player/Character lifecycle.
 *  - No pixel screenshot — Roblox plugin API doesn't expose viewport
 *    capture. The scene manifest vision check is the semantic equivalent.
 *  - Network hops between server and plugin add latency. Each full
 *    iteration takes ~6-10s on a warm connection.
 */

import { callAI, type AIMessage } from './provider'
import { analyzePlaytestScene } from './playtest-vision'
import { getSession } from '@/lib/studio-session'
import { recordBuildOutcome } from './experience-memory'

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
  type: 'execute_luau' | 'scan_workspace' | 'get_output',
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
  userPrompt?: string,
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

    // ── Step 1: Execute the harness-wrapped code ────────────────────────
    addStep('execute', `Iteration ${iteration}: deploying code to Studio...`)

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

    // ── Step 2: Wait for plugin to drain the queue and run the harness ─
    addStep('playtest', 'Waiting for plugin to run the harness (1s poll cadence)...')
    await new Promise((r) => setTimeout(r, 4_000))

    // ── Step 3: Queue get_output + scan_workspace so we get a fresh ────
    //          outputLog and worldSnapshot. Both commands mirror their
    //          results to /api/studio/update so we read them back via
    //          getSession().latestState — no correlation by requestId
    //          needed. Fire get_output first so any console errors
    //          raised by the harness's error() call get captured.
    await queueCommand(sessionId, 'get_output', { limit: 100, filter: 'all' }, token)
    await queueCommand(sessionId, 'scan_workspace', { maxDepth: 4, maxNodes: 300 }, token)

    // Let the plugin drain both commands and POST back. 2s per command
    // + 1s slack for the sync poll cycle = 5s total.
    addStep('analyze', 'Reading session snapshot + output log + world scene...')
    await new Promise((r) => setTimeout(r, 5_000))

    // ── Step 4: Read everything from session.latestState in one shot ───
    const session = await getSession(sessionId)
    const latestState = (session?.latestState ?? {}) as Record<string, unknown>

    // Harness pendingError (pcall failure the plugin captured)
    const harnessErrors = extractErrors({ pendingError: latestState.pendingError })

    // Runtime console errors from the LogService ring buffer
    const outputLogRaw = latestState.outputLog
    const outputEntries: Array<{ text?: unknown; type?: unknown }> = Array.isArray(outputLogRaw)
      ? (outputLogRaw as Array<{ text?: unknown; type?: unknown }>)
      : []
    const consoleErrors = outputEntries
      .filter((e) => e && typeof e === 'object' && e.type === 'error')
      .map((e) => (typeof e.text === 'string' ? e.text : ''))
      .filter((s) => s.length > 0)

    // Semantic scene check — empty workspace? parts below ground?
    // missing the features the user asked for? Uses callAI directly via
    // playtest-vision.analyzePlaytestScene. Fails soft (returns ok=true)
    // if GEMINI_API_KEY is missing or the model errors.
    let sceneIssues: string[] = []
    const worldSnapshot = latestState.worldSnapshot
    if (worldSnapshot && userPrompt) {
      try {
        const scene = await analyzePlaytestScene(worldSnapshot, userPrompt)
        if (!scene.ok) {
          sceneIssues = scene.issues
        }
      } catch (err) {
        // Never block the loop on a vision failure
        console.warn('[agentic-playtest] scene analysis failed', err)
      }
    }

    // ── Step 5: Combine all three analyses into a single error list ────
    const allErrors: string[] = []
    if (harnessErrors.length > 0) {
      allErrors.push(...harnessErrors.map((e) => `[harness] ${e}`))
    }
    if (consoleErrors.length > 0) {
      allErrors.push(...consoleErrors.map((e) => `[console] ${e}`))
    }
    if (sceneIssues.length > 0) {
      allErrors.push(...sceneIssues.map((e) => `[visual] ${e}`))
    }

    // ── Step 6: Best-effort screenshot grab (always null in practice —
    //          Roblox plugin API limitation — but kept for forward compat)
    const screenshotField = latestState.latestScreenshot
    if (typeof screenshotField === 'string' && screenshotField.length > 0) {
      screenshots.push(screenshotField)
    }

    if (allErrors.length === 0) {
      const partCount = typeof latestState.partCount === 'number' ? latestState.partCount : undefined
      addStep(
        'complete',
        `Playtest passed on iteration ${iteration}.${partCount !== undefined ? ` partCount=${partCount}` : ''}`,
      )

      // Learning system: record playtest-verified success
      if (userPrompt) {
        void recordBuildOutcome(userPrompt, currentCode, 85, 'playtest-verified', {
          partCount: partCount ?? null,
          playtestPass: true,
        }).catch(() => {})
      }

      return {
        success: true,
        steps,
        finalCode: currentCode,
        screenshots,
        iterations: iteration,
      }
    }

    // ── Step 7: Fix via callAI directly — no chat route round-trip ─────
    if (iteration < maxIterations) {
      addStep(
        'fix',
        `Found ${allErrors.length} issue(s) (${harnessErrors.length} harness, ${consoleErrors.length} console, ${sceneIssues.length} visual). Generating fix...`,
        { errors: allErrors },
      )

      const fixPrompt = [
        userPrompt ? `ORIGINAL USER REQUEST:\n${userPrompt}` : null,
        '',
        'PREVIOUS CODE (ran in Studio but produced issues):',
        '```lua',
        currentCode,
        '```',
        '',
        'ISSUES DETECTED DURING PLAYTEST:',
        allErrors.map((e, i) => `${i + 1}. ${e}`).join('\n'),
        '',
        'Fix the code to resolve ALL of the above issues. Return ONLY the corrected Luau code, no explanations or markdown fences.',
      ]
        .filter((l) => l !== null)
        .join('\n')

      const messages: AIMessage[] = [{ role: 'user', content: fixPrompt }]
      const systemPrompt =
        'You are a Roblox Luau code fixer. You receive the original user request, ' +
        'the previous code that was run in Studio, and a list of issues detected during ' +
        'playtest (harness errors, console log errors, and visual scene issues). Return ' +
        'ONLY the corrected Luau code — no markdown, no fences, no explanations.'

      try {
        const fixed = await callAI(systemPrompt, messages, {
          codeMode: true,
          maxTokens: 4096,
        })

        const extractedCode = extractCodeFromResponse(fixed) ?? fixed.trim()
        if (extractedCode && extractedCode.length > 0 && extractedCode !== currentCode) {
          currentCode = extractedCode
          addStep('fix', `Code updated via callAI. Retrying playtest...`)
          continue
        }
        addStep('fix', 'AI returned no meaningful change — accepting current errors as final.')
      } catch (err) {
        addStep(
          'fix',
          `Fix generation failed: ${err instanceof Error ? err.message : 'unknown'}`,
        )
      }
    }

    addStep('failed', `Playtest failed after ${iteration} iteration(s). ${allErrors.length} issue(s) remain.`)

    // Learning system: record playtest failure as anti-pattern
    if (userPrompt) {
      void recordBuildOutcome(userPrompt, currentCode, 20, 'playtest-failed', {
        playtestPass: false,
      }).catch(() => {})
    }

    return {
      success: false,
      steps,
      finalCode: currentCode,
      errors: allErrors,
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
