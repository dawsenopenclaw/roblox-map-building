/**
 * Automated Playtest Loop
 *
 * A self-contained, HTTP-driven loop that:
 *   1. Writes Luau code to Roblox Studio via the plugin bridge
 *   2. Starts a playtest
 *   3. Waits, then captures a screenshot and the output log
 *   4. Parses the output log for errors
 *   5. If errors are found, feeds them back to the AI for a fix
 *   6. Repeats until the code is clean or max iterations are reached
 *
 * Unlike the server-side agentic-loop (src/lib/ai/agentic-loop.ts) which
 * uses the Redis command queue, this module communicates directly with the
 * Studio session HTTP API — suitable for calling from Next.js API routes,
 * the useChat hook, or standalone scripts.
 *
 * Studio Bridge endpoints used (all routed through the session API):
 *   POST /api/studio/command   { sessionId, type, data }
 *     type = "execute_luau"       — writes & runs a script
 *     type = "start_playtest"     — triggers Play in Studio
 *     type = "stop_playtest"      — stops the active playtest
 *     type = "capture_screenshot" — triggers a viewport capture
 *     type = "get_output"         — retrieves the output log
 *
 * The /api/studio/command endpoint enqueues commands through the same
 * queueCommand() path the existing MCP bridge uses, so the plugin picks
 * them up on its next poll cycle.
 */

import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PlaytestLoopOptions {
  /** The generated Luau code to test */
  code: string
  /** Studio session ID (from the connected plugin) */
  sessionId: string
  /** Base URL for the API (e.g. "https://forjegames.com" or "http://localhost:3000") */
  apiBaseUrl: string
  /** Maximum number of fix iterations (default: 3) */
  maxIterations?: number
  /** Seconds to let the playtest run before capturing output (default: 5) */
  playtestDurationSec?: number
  /** Auth token for the API (Bearer) */
  authToken?: string
  /** Callback invoked when the AI should fix the code. If not provided, the loop
   *  returns with errors after the first failed iteration. */
  onFixCode?: (currentCode: string, errors: string[]) => Promise<string | null>
  /** Callback for progress updates */
  onProgress?: (phase: PlaytestPhase, iteration: number, detail?: string) => void
}

export type PlaytestPhase =
  | 'write-script'
  | 'start-playtest'
  | 'waiting'
  | 'capture-screenshot'
  | 'read-output'
  | 'stop-playtest'
  | 'analyzing'
  | 'fixing'
  | 'done'

export interface PlaytestLoopResult {
  /** Whether the code ran without errors */
  success: boolean
  /** Total iterations executed (1 = first try, 2+ = had to fix) */
  iterations: number
  /** Collected error strings from all iterations */
  errors: string[]
  /** Latest screenshot URL/data if captured */
  screenshotUrl?: string
  /** The final version of the code (may have been fixed) */
  finalCode?: string
}

/** Shape of an output-log entry returned by the plugin's get_output handler */
export interface OutputLogEntry {
  message: string
  messageType: 'error' | 'warning' | 'info' | 'output'
  timestamp: number
}

// ---------------------------------------------------------------------------
// Error patterns — matches Roblox Studio error output conventions
// ---------------------------------------------------------------------------

const ERROR_PATTERNS: RegExp[] = [
  /\[Error\]/i,
  /attempt to index nil/i,
  /attempt to call a nil value/i,
  /attempt to perform arithmetic/i,
  /is not a valid member of/i,
  /expected .+, got .+/i,
  /stack traceback/i,
  /ServerScriptService\..+:\d+:/,
  /Workspace\..+:\d+:/,
  /Script '.+'.*:\d+:/,
  /^error:/im,
  /infinite yield possible/i,
  /cannot resume dead coroutine/i,
  /ServerScriptService\.Script:\d+: attempt to call a nil value/,
  /Players\.Player\.PlayerGui/,
  /Workspace\.Model is not a valid member/,
  /ReplicatedStorage\..+:\d+:/,
  /StarterPlayerScripts\..+:\d+:/,
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Default timeout for plugin responses (ms). */
const STUDIO_COMMAND_TIMEOUT_MS = 10_000

async function studioCommand(
  apiBaseUrl: string,
  sessionId: string,
  type: string,
  data: Record<string, unknown>,
  authToken?: string,
): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }

  try {
    const res = await fetch(`${apiBaseUrl}/api/studio/command`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ sessionId, type, data }),
      signal: AbortSignal.timeout(STUDIO_COMMAND_TIMEOUT_MS),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText)
      return { ok: false, error: `HTTP ${res.status}: ${text}` }
    }

    const json = await res.json().catch(() => ({}))
    return { ok: true, data: json }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'TimeoutError') {
      return {
        ok: false,
        error: `Studio plugin did not respond within ${STUDIO_COMMAND_TIMEOUT_MS / 1000}s. Is the plugin running and connected?`,
      }
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

/**
 * Fetch the latest screenshot from the session endpoint.
 */
async function fetchScreenshot(
  apiBaseUrl: string,
  sessionId: string,
  authToken?: string,
): Promise<string | undefined> {
  const headers: Record<string, string> = {}
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }

  try {
    const res = await fetch(
      `${apiBaseUrl}/api/studio/session/${sessionId}/screenshot`,
      { headers },
    )
    if (!res.ok) return undefined
    const json = await res.json().catch(() => null)
    return json?.screenshot ?? json?.screenshotUrl ?? undefined
  } catch {
    return undefined
  }
}

/**
 * Fetch the output log through the session state endpoint.
 * The get_output command stores its result via bridgeResult which
 * becomes available through the session's latest state.
 */
async function fetchOutputLog(
  apiBaseUrl: string,
  sessionId: string,
  authToken?: string,
): Promise<OutputLogEntry[]> {
  const headers: Record<string, string> = {}
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }

  try {
    const res = await fetch(
      `${apiBaseUrl}/api/studio/session/${sessionId}/output`,
      { headers },
    )
    if (!res.ok) return []
    const json = await res.json().catch(() => null)
    if (Array.isArray(json)) return json as OutputLogEntry[]
    if (json?.entries && Array.isArray(json.entries)) return json.entries as OutputLogEntry[]
    return []
  } catch {
    return []
  }
}

/**
 * Parse output log entries and detect errors by matching against known Roblox
 * Studio error patterns. Entries with `messageType: 'error'` are always
 * included; other entries are scanned against `ERROR_PATTERNS`.
 *
 * @param entries - Array of output log entries from the Studio plugin.
 * @returns Array of error message strings found in the log.
 */
export function parseOutputForErrors(entries: OutputLogEntry[]): string[] {
  const errors: string[] = []

  for (const entry of entries) {
    // Entries with messageType "error" are always errors
    if (entry.messageType === 'error') {
      errors.push(entry.message)
      continue
    }

    // Check message text against known error patterns
    for (const pattern of ERROR_PATTERNS) {
      if (pattern.test(entry.message)) {
        errors.push(entry.message)
        break
      }
    }
  }

  return errors
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------

/**
 * Run the automated playtest loop.
 *
 * The loop writes code to Studio, starts a playtest, waits for it to run,
 * then reads the output log and checks for errors. If errors are found and
 * an `onFixCode` callback is provided, the code is sent for fixing and the
 * loop repeats. Otherwise, the loop exits with the error list.
 *
 * @returns A result object indicating success, iteration count, errors, and
 *          optionally the latest screenshot and final code.
 */
export async function runPlaytestLoop(
  options: PlaytestLoopOptions,
): Promise<PlaytestLoopResult> {
  const {
    sessionId,
    apiBaseUrl,
    authToken,
    onFixCode,
    onProgress,
    maxIterations = 3,
    playtestDurationSec = 5,
  } = options

  let currentCode = options.code
  const allErrors: string[] = []
  let screenshotUrl: string | undefined
  let iteration = 0

  for (iteration = 0; iteration < maxIterations; iteration++) {
    // ---- Step 1: Write the script to Studio ----
    onProgress?.('write-script', iteration, 'Deploying code to Studio...')

    const writeResult = await studioCommand(
      apiBaseUrl,
      sessionId,
      'execute_luau',
      { code: currentCode },
      authToken,
    )

    if (!writeResult.ok) {
      allErrors.push(`Deploy failed: ${writeResult.error}`)
      return {
        success: false,
        iterations: iteration + 1,
        errors: allErrors,
        finalCode: currentCode,
      }
    }

    // Give the plugin time to pick up and execute the command
    await delay(2_000)

    // ---- Step 2: Start the playtest ----
    onProgress?.('start-playtest', iteration, 'Starting playtest...')

    const ptResult = await studioCommand(
      apiBaseUrl,
      sessionId,
      'start_playtest',
      { mode: 'server' },
      authToken,
    )

    if (!ptResult.ok) {
      // Playtest failed to start but code was deployed -- still try to observe
      allErrors.push(`Playtest start failed: ${ptResult.error}`)
    }

    // ---- Step 3: Wait for the playtest to run ----
    onProgress?.('waiting', iteration, `Waiting ${playtestDurationSec}s for playtest...`)
    await delay(playtestDurationSec * 1_000)

    // ---- Step 4: Capture a screenshot ----
    onProgress?.('capture-screenshot', iteration, 'Capturing screenshot...')

    await studioCommand(
      apiBaseUrl,
      sessionId,
      'capture_screenshot',
      {},
      authToken,
    )
    // Give time for the screenshot to propagate
    await delay(1_500)
    screenshotUrl = await fetchScreenshot(apiBaseUrl, sessionId, authToken)

    // ---- Step 5: Read the output log ----
    onProgress?.('read-output', iteration, 'Reading output log...')

    await studioCommand(
      apiBaseUrl,
      sessionId,
      'get_output',
      { maxEntries: 200, filter: 'all' },
      authToken,
    )
    await delay(2_000)

    const logEntries = await fetchOutputLog(apiBaseUrl, sessionId, authToken)

    // ---- Step 6: Stop the playtest ----
    onProgress?.('stop-playtest', iteration, 'Stopping playtest...')

    await studioCommand(
      apiBaseUrl,
      sessionId,
      'stop_playtest',
      {},
      authToken,
    )
    await delay(1_000)

    // ---- Step 7: Analyze the output log ----
    onProgress?.('analyzing', iteration, 'Analyzing output for errors...')

    const iterationErrors = parseOutputForErrors(logEntries)

    if (iterationErrors.length === 0) {
      // Clean run!
      onProgress?.('done', iteration, 'Playtest completed without errors.')
      return {
        success: true,
        iterations: iteration + 1,
        errors: [],
        screenshotUrl,
        finalCode: currentCode,
      }
    }

    // Errors found
    allErrors.push(...iterationErrors)

    // ---- Step 8: Attempt to fix (if callback provided and iterations remain) ----
    if (!onFixCode || iteration >= maxIterations - 1) {
      // No fix callback or last iteration -- exit with errors
      onProgress?.('done', iteration, `Failed after ${iteration + 1} iteration(s).`)
      break
    }

    onProgress?.('fixing', iteration, `Found ${iterationErrors.length} error(s), requesting fix...`)

    const fixedCode = await onFixCode(currentCode, iterationErrors)
    if (!fixedCode) {
      // Fix callback returned null -- give up
      onProgress?.('done', iteration, 'Fix callback returned no code, stopping.')
      break
    }

    currentCode = fixedCode
    // Loop continues with the fixed code
  }

  return {
    success: false,
    iterations: iteration + 1,
    errors: allErrors,
    screenshotUrl,
    finalCode: currentCode,
  }
}

// ---------------------------------------------------------------------------
// Screenshot comparison (visual regression)
// ---------------------------------------------------------------------------

export interface ScreenshotDiffResult {
  /** Normalized diff score: 0 = identical, 1 = completely different. -1 on error. */
  score: number
  /** Human-readable summary of the comparison. */
  summary: string
  /** Number of pixels that differ between the two images (absent on error). */
  diffPixelCount?: number
  /** Total pixel count used for the comparison (absent on error). */
  totalPixels?: number
}

/** Pixelmatch threshold — lower values mean stricter matching. */
const PIXELMATCH_THRESHOLD = 0.1

/**
 * Fetch a PNG image and decode it into an RGBA pixel buffer.
 *
 * Accepts either a remote URL (http/https) or a data URL
 * (e.g. `data:image/png;base64,...`). The returned object is the parsed PNG
 * with `.data` (Buffer of RGBA pixels), `.width`, and `.height`.
 */
async function fetchAndDecodePng(source: string): Promise<PNG> {
  let buffer: Buffer

  if (source.startsWith('data:')) {
    const commaIdx = source.indexOf(',')
    if (commaIdx === -1) {
      throw new Error('Malformed data URL')
    }
    const header = source.slice(0, commaIdx)
    const payload = source.slice(commaIdx + 1)
    if (header.includes(';base64')) {
      buffer = Buffer.from(payload, 'base64')
    } else {
      buffer = Buffer.from(decodeURIComponent(payload), 'binary')
    }
  } else {
    const res = await fetch(source)
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} fetching screenshot`)
    }
    const arrayBuffer = await res.arrayBuffer()
    buffer = Buffer.from(arrayBuffer)
  }

  return PNG.sync.read(buffer)
}

/**
 * Compare two screenshots and return a diff score for visual regression testing.
 *
 * Both images are fetched, decoded into RGBA pixel buffers, and compared with
 * pixelmatch at a threshold of {@link PIXELMATCH_THRESHOLD}. The score is the
 * fraction of pixels that differ (0 = identical, 1 = completely different).
 *
 * If either image fails to load or decode, returns `{ score: -1, summary: 'Error: ...' }`.
 *
 * @param beforeUrl - URL or data URL of the "before" screenshot.
 * @param afterUrl  - URL or data URL of the "after" screenshot.
 * @returns A diff result with a normalized score (0-1), summary text, and pixel counts.
 */
export async function compareScreenshots(
  beforeUrl: string,
  afterUrl: string,
): Promise<ScreenshotDiffResult> {
  try {
    const [before, after] = await Promise.all([
      fetchAndDecodePng(beforeUrl),
      fetchAndDecodePng(afterUrl),
    ])

    if (before.width !== after.width || before.height !== after.height) {
      return {
        score: -1,
        summary: `Error: image dimensions differ (${before.width}x${before.height} vs ${after.width}x${after.height})`,
      }
    }

    const { width, height } = before
    const totalPixels = width * height
    const diff = new PNG({ width, height })

    const diffPixelCount = pixelmatch(
      before.data,
      after.data,
      diff.data,
      width,
      height,
      { threshold: PIXELMATCH_THRESHOLD },
    )

    const score = totalPixels > 0 ? diffPixelCount / totalPixels : 0
    const summary =
      score === 0
        ? 'Identical'
        : `${(score * 100).toFixed(2)}% of pixels differ`

    return { score, summary, diffPixelCount, totalPixels }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      score: -1,
      summary: `Error: ${message}`,
    }
  }
}

// ---------------------------------------------------------------------------
// Visual bug detection across multiple screenshot pairs
// ---------------------------------------------------------------------------

/** Significance threshold — regions with a diff score above this are flagged. */
const VISUAL_BUG_THRESHOLD = 0.05

export interface ScreenshotPair {
  /** URL or data URL of the baseline screenshot. */
  before: string
  /** URL or data URL of the screenshot to compare. */
  after: string
  /** Human-readable label identifying this region/view (e.g. "lobby", "shop-ui"). */
  label: string
}

export interface VisualBugRegion {
  /** Label from the input pair. */
  label: string
  /** Diff score for this region (0-1, or -1 on error). */
  score: number
  /** Human-readable summary from {@link compareScreenshots}. */
  summary: string
  /** Number of differing pixels (absent on error). */
  diffPixelCount?: number
  /** Total pixel count (absent on error). */
  totalPixels?: number
}

/**
 * Run {@link compareScreenshots} across an array of screenshot pairs and
 * return only those regions whose diff score exceeds
 * {@link VISUAL_BUG_THRESHOLD} (5% by default). Errored comparisons
 * (`score === -1`) are also returned so callers can surface them.
 *
 * @param screenshots - Array of `{ before, after, label }` pairs to compare.
 * @returns Regions that changed significantly, each annotated with score and summary.
 */
export async function detectVisualBugs(
  screenshots: ScreenshotPair[],
): Promise<VisualBugRegion[]> {
  const results = await Promise.all(
    screenshots.map(async (pair): Promise<VisualBugRegion> => {
      const diff = await compareScreenshots(pair.before, pair.after)
      return {
        label: pair.label,
        score: diff.score,
        summary: diff.summary,
        diffPixelCount: diff.diffPixelCount,
        totalPixels: diff.totalPixels,
      }
    }),
  )

  return results.filter(
    (region) => region.score === -1 || region.score > VISUAL_BUG_THRESHOLD,
  )
}

// ---------------------------------------------------------------------------
// AI-assisted playtest wrapper
// ---------------------------------------------------------------------------

export interface PlaytestWithAIOptions {
  /** The generated Luau code to test. */
  code: string
  /** Studio session ID (from the connected plugin). */
  sessionId: string
  /** Base URL for the API (e.g. "https://forjegames.com" or "http://localhost:3000"). */
  apiBaseUrl: string
  /** Maximum number of AI fix iterations (default: 3). */
  maxIterations?: number
  /** Seconds to let the playtest run before capturing output (default: 5). */
  playtestDurationSec?: number
  /** Auth token for the API (Bearer). */
  authToken?: string
  /** Optional context about what the code is supposed to do (helps the AI fix it). */
  codeDescription?: string
  /** Callback for progress updates. */
  onProgress?: (phase: PlaytestPhase, iteration: number, detail?: string) => void
}

/**
 * High-level wrapper that combines `runPlaytestLoop` with the `/api/ai/chat`
 * endpoint. When the playtest detects errors, this function automatically
 * sends the error context to the AI chat API and uses the returned fix.
 *
 * This is the recommended entry point for fully-automated "write, test, fix"
 * workflows — callers don't need to implement their own `onFixCode` callback.
 *
 * @param options - Configuration for the AI-assisted playtest.
 * @returns The same `PlaytestLoopResult` produced by `runPlaytestLoop`.
 */
export async function playtestWithAI(
  options: PlaytestWithAIOptions,
): Promise<PlaytestLoopResult> {
  const {
    code,
    sessionId,
    apiBaseUrl,
    authToken,
    maxIterations = 3,
    playtestDurationSec = 5,
    codeDescription,
    onProgress,
  } = options

  const onFixCode = async (
    currentCode: string,
    errors: string[],
  ): Promise<string | null> => {
    const systemPrompt = [
      'You are a Roblox Luau expert. The following code produced errors during a playtest.',
      'Fix the code and return ONLY the corrected Luau code — no markdown, no explanations.',
      codeDescription ? `Context: ${codeDescription}` : '',
    ]
      .filter(Boolean)
      .join('\n')

    const userMessage = [
      '--- CURRENT CODE ---',
      currentCode,
      '',
      '--- ERRORS ---',
      ...errors,
    ].join('\n')

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`
    }

    try {
      const res = await fetch(`${apiBaseUrl}/api/ai/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
        }),
        signal: AbortSignal.timeout(30_000),
      })

      if (!res.ok) {
        console.error(`[playtestWithAI] AI chat returned ${res.status}`)
        return null
      }

      const json = await res.json().catch(() => null)
      const fixedCode =
        json?.choices?.[0]?.message?.content ??
        json?.message?.content ??
        json?.content ??
        json?.text ??
        null

      if (typeof fixedCode !== 'string' || fixedCode.trim().length === 0) {
        return null
      }

      // Strip markdown code fences if the model wrapped them
      return fixedCode
        .replace(/^```(?:lua|luau)?\n?/i, '')
        .replace(/\n?```$/i, '')
        .trim()
    } catch (err) {
      console.error(
        '[playtestWithAI] Failed to get fix from AI:',
        err instanceof Error ? err.message : err,
      )
      return null
    }
  }

  return runPlaytestLoop({
    code,
    sessionId,
    apiBaseUrl,
    authToken,
    maxIterations,
    playtestDurationSec,
    onFixCode,
    onProgress,
  })
}
