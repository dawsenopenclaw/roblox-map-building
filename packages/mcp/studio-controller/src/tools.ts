/**
 * Studio Controller -- Tool Definitions
 *
 * These tools talk to the Roblox Studio plugin via the same cloud relay
 * pattern used by `packages/mcp/studio-bridge/`. Roblox Studio plugins
 * cannot accept inbound HTTP, so this server queues commands through the
 * ForjeGames `/api/studio/execute` endpoint; the plugin polls and picks
 * them up. Results are returned via the plugin change-push pipeline and
 * retrieved from `/api/studio/bridge-result`.
 *
 * Required environment variables:
 *   FORJE_API_BASE    -- ForjeGames API base (default https://forjegames.com)
 *   FORJE_API_TOKEN   -- Session token (same token the Studio plugin uses)
 *   FORJE_SESSION_ID  -- Studio session id to target
 */

import { randomUUID } from 'node:crypto'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Relay configuration
// ---------------------------------------------------------------------------

const API_BASE = process.env.FORJE_API_BASE ?? 'https://forjegames.com'
const POLL_TIMEOUT_MS = 20_000
const POLL_INTERVAL_MS = 1_500
const QUEUE_TIMEOUT_MS = 10_000

function getApiToken(): string {
  const t = process.env.FORJE_API_TOKEN ?? process.env.FORJE_SESSION_TOKEN
  if (!t) throw new Error('FORJE_API_TOKEN (or FORJE_SESSION_TOKEN) is not set')
  return t
}

function getSessionId(): string {
  const s = process.env.FORJE_SESSION_ID
  if (!s) throw new Error('FORJE_SESSION_ID is not set')
  return s
}

function apiHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getApiToken()}`,
    'X-Session-Id': getSessionId(),
  }
}

// ---------------------------------------------------------------------------
// Relay client
// ---------------------------------------------------------------------------

interface PluginResponse {
  success: boolean
  data?: unknown
  error?: string
}

/**
 * Queue a command for the Studio plugin via the ForjeGames cloud relay.
 * Shape matches `packages/mcp/studio-bridge/src/index.ts`.
 */
async function queuePluginCommand(
  type: string,
  data: Record<string, unknown>,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/studio/execute`, {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ type, data, sessionId: getSessionId() }),
      signal: AbortSignal.timeout(QUEUE_TIMEOUT_MS),
    })
    if (!res.ok) {
      const txt = await res.text().catch(() => String(res.status))
      return { ok: false, error: `API returned ${res.status}: ${txt}` }
    }
    return { ok: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `Failed to reach ForjeGames relay: ${msg}` }
  }
}

/**
 * Queue a command and poll the bridge-result endpoint for the plugin's
 * response. Used for commands that need a round-trip (reads, screenshots,
 * script source, etc).
 */
async function queueAndWaitForResult(
  type: string,
  data: Record<string, unknown>,
  resultType: string,
): Promise<PluginResponse> {
  const requestId = randomUUID()
  const queueRes = await queuePluginCommand(type, { ...data, _requestId: requestId })
  if (!queueRes.ok) return { success: false, error: queueRes.error }

  const deadline = Date.now() + POLL_TIMEOUT_MS
  while (Date.now() < deadline) {
    await new Promise<void>((r) => setTimeout(r, POLL_INTERVAL_MS))
    try {
      const pollRes = await fetch(
        `${API_BASE}/api/studio/bridge-result?requestId=${requestId}&resultType=${resultType}`,
        {
          method: 'GET',
          headers: apiHeaders(),
          signal: AbortSignal.timeout(5_000),
        },
      )
      if (pollRes.ok) {
        const body = (await pollRes.json()) as { ready?: boolean; data?: unknown }
        if (body.ready) {
          return { success: true, data: body.data }
        }
      }
    } catch {
      // Transient polling failure -- keep trying until deadline
    }
  }

  // Fire-and-forget fallback: command was queued but no round-trip result in time
  return {
    success: true,
    data: {
      status: 'queued',
      note: 'Command queued via cloud relay but response was not received within timeout. The plugin will execute it on its next poll cycle.',
    },
  }
}

// ---------------------------------------------------------------------------
// Tool input schemas (exported for use in index.ts)
// ---------------------------------------------------------------------------

export const ReadSceneSchema = {
  root: z
    .string()
    .default('game')
    .describe(
      'Root service or instance path to start from (e.g. "game", "Workspace", "ServerScriptService", "ReplicatedStorage")',
    ),
  maxDepth: z
    .number()
    .int()
    .min(1)
    .max(30)
    .default(10)
    .describe('Maximum depth to traverse the instance hierarchy'),
}

export const ReadScriptSchema = {
  scriptPath: z
    .string()
    .min(1)
    .describe(
      'Dotted path to the script instance (e.g. "ServerScriptService.GameManager", "Workspace.NPC.BehaviorScript")',
    ),
}

export const WriteScriptSchema = {
  scriptPath: z
    .string()
    .min(1)
    .describe(
      'Dotted path to the script instance. If the script does not exist, the plugin will create it.',
    ),
  source: z
    .string()
    .describe('The full Luau source code to write to the script'),
  scriptType: z
    .enum(['Script', 'LocalScript', 'ModuleScript'])
    .default('Script')
    .describe('Type of script to create if the path does not exist'),
}

export const StartPlaytestSchema = {
  mode: z
    .enum(['play', 'play_here', 'run'])
    .default('play')
    .describe(
      '"play" starts a full server+client playtest, "play_here" spawns at the camera, "run" starts the server only',
    ),
}

export const StopPlaytestSchema = {}

export const CaptureScreenshotSchema = {
  format: z
    .enum(['png', 'jpeg'])
    .default('png')
    .describe('Image format for the captured screenshot'),
  quality: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(90)
    .describe('JPEG quality (1-100). Ignored for PNG.'),
}

export const GetOutputLogSchema = {
  maxEntries: z
    .number()
    .int()
    .min(1)
    .max(1000)
    .default(100)
    .describe('Maximum number of log entries to return'),
  filter: z
    .enum(['all', 'errors', 'warnings', 'info'])
    .default('all')
    .describe('Filter log entries by severity level'),
  since: z
    .number()
    .default(0)
    .describe(
      'Unix timestamp (seconds). Only return entries after this time. 0 = all available.',
    ),
}

export const SimulateInputSchema = {
  inputType: z
    .enum(['keyboard', 'mouse_click', 'mouse_move', 'mouse_scroll'])
    .describe('Type of input to simulate'),
  key: z
    .string()
    .default('')
    .describe(
      'For keyboard: Enum.KeyCode name (e.g. "W", "Space", "E", "Return"). For mouse: button name ("Left", "Right", "Middle").',
    ),
  action: z
    .enum(['press', 'release', 'tap'])
    .default('tap')
    .describe(
      '"tap" simulates a press followed by release. "press" holds the key down. "release" lets go.',
    ),
  x: z.number().default(0).describe('Screen X coordinate for mouse actions'),
  y: z.number().default(0).describe('Screen Y coordinate for mouse actions'),
  duration: z
    .number()
    .min(0)
    .max(10)
    .default(0.1)
    .describe('Duration in seconds for tap/hold actions'),
  scrollDelta: z
    .number()
    .default(0)
    .describe('Scroll wheel delta for mouse_scroll (positive = up, negative = down)'),
}

export const NavigateCharacterSchema = {
  x: z.number().describe('Target world X coordinate'),
  y: z.number().describe('Target world Y coordinate'),
  z: z.number().describe('Target world Z coordinate'),
  speed: z
    .number()
    .min(0)
    .max(100)
    .default(16)
    .describe('Walk speed override (default 16, Roblox default)'),
  timeout: z
    .number()
    .min(0.5)
    .max(60)
    .default(10)
    .describe('Maximum seconds to wait for the character to reach the destination'),
}

export const GetInstancePropertiesSchema = {
  instancePath: z
    .string()
    .min(1)
    .describe(
      'Dotted path to the instance (e.g. "Workspace.SpawnLocation", "Lighting")',
    ),
  properties: z
    .array(z.string())
    .default([])
    .describe(
      'Specific property names to read. Empty array = return all serializable properties.',
    ),
}

// ---------------------------------------------------------------------------
// Tool handlers
// ---------------------------------------------------------------------------

function jsonContent(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] }
}

export async function handleReadScene(args: { root: string; maxDepth: number }) {
  const res = await queueAndWaitForResult(
    'get_hierarchy',
    { root: args.root, maxDepth: args.maxDepth },
    'hierarchy_result',
  )
  return jsonContent(res.success ? res.data : { error: res.error })
}

export async function handleReadScript(args: { scriptPath: string }) {
  const res = await queueAndWaitForResult(
    'read_script',
    { path: args.scriptPath },
    'script_result',
  )
  return jsonContent(res.success ? res.data : { error: res.error })
}

export async function handleWriteScript(args: {
  scriptPath: string
  source: string
  scriptType: string
}) {
  const res = await queuePluginCommand('write_script', {
    path: args.scriptPath,
    source: args.source,
    scriptType: args.scriptType,
  })
  return jsonContent(
    res.ok
      ? { success: true, path: args.scriptPath, bytesWritten: args.source.length }
      : { error: res.error },
  )
}

export async function handleStartPlaytest(args: { mode: string }) {
  const res = await queueAndWaitForResult(
    'start_playtest',
    { mode: args.mode },
    'start_playtest_result',
  )
  return jsonContent(res.success ? res.data : { error: res.error })
}

export async function handleStopPlaytest() {
  const res = await queueAndWaitForResult(
    'stop_playtest',
    {},
    'stop_playtest_result',
  )
  return jsonContent(res.success ? res.data : { error: res.error })
}

export async function handleCaptureScreenshot(args: {
  format: string
  quality: number
}) {
  const res = await queueAndWaitForResult(
    'capture_screenshot',
    { format: args.format, quality: args.quality },
    'screenshot_result',
  )
  return jsonContent(res.success ? res.data : { error: res.error })
}

export async function handleGetOutputLog(args: {
  maxEntries: number
  filter: string
  since: number
}) {
  const res = await queueAndWaitForResult(
    'get_output',
    {
      maxEntries: args.maxEntries,
      filter: args.filter,
      since: args.since,
    },
    'output_result',
  )
  return jsonContent(res.success ? res.data : { error: res.error })
}

export async function handleSimulateInput(args: {
  inputType: string
  key: string
  action: string
  x: number
  y: number
  duration: number
  scrollDelta: number
}) {
  const res = await queuePluginCommand('simulate_input', {
    inputType: args.inputType,
    key: args.key,
    action: args.action,
    x: args.x,
    y: args.y,
    duration: args.duration,
    scrollDelta: args.scrollDelta,
  })
  return jsonContent(
    res.ok
      ? { success: true, inputType: args.inputType, key: args.key, action: args.action }
      : { error: res.error },
  )
}

export async function handleNavigateCharacter(args: {
  x: number
  y: number
  z: number
  speed: number
  timeout: number
}) {
  const res = await queueAndWaitForResult(
    'navigate_character',
    {
      targetX: args.x,
      targetY: args.y,
      targetZ: args.z,
      speed: args.speed,
      timeout: args.timeout,
    },
    'navigate_character_result',
  )
  return jsonContent(
    res.success
      ? { success: true, target: { x: args.x, y: args.y, z: args.z }, ...((res.data as object) ?? {}) }
      : { error: res.error },
  )
}

export async function handleGetInstanceProperties(args: {
  instancePath: string
  properties: string[]
}) {
  const res = await queueAndWaitForResult(
    'get_properties',
    {
      instancePath: args.instancePath,
      properties: args.properties,
    },
    'properties_result',
  )
  return jsonContent(res.success ? res.data : { error: res.error })
}
