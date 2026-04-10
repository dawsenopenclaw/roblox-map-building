/**
 * Studio Controller — Tool Definitions
 *
 * Each tool delegates to HTTP calls against the local Roblox Studio plugin
 * endpoint. The plugin runs an HTTP server on localhost (default port 33796)
 * that accepts JSON-RPC-style requests.
 *
 * Endpoint pattern:
 *   POST http://localhost:<PLUGIN_PORT>/<action>
 *   Body: JSON payload specific to each action
 *   Response: JSON with { success: boolean, data?: unknown, error?: string }
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Plugin HTTP configuration
// ---------------------------------------------------------------------------

const PLUGIN_PORT = Number(process.env.STUDIO_PLUGIN_PORT ?? 33796)
const PLUGIN_HOST = process.env.STUDIO_PLUGIN_HOST ?? 'localhost'
const REQUEST_TIMEOUT_MS = 30_000

function pluginUrl(action: string): string {
  return `http://${PLUGIN_HOST}:${PLUGIN_PORT}/${action}`
}

// ---------------------------------------------------------------------------
// Plugin HTTP client
// ---------------------------------------------------------------------------

interface PluginResponse {
  success: boolean
  data?: unknown
  error?: string
}

async function callPlugin(
  action: string,
  payload: Record<string, unknown> = {},
): Promise<PluginResponse> {
  try {
    const res = await fetch(pluginUrl(action), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
    if (!res.ok) {
      const txt = await res.text().catch(() => String(res.status))
      return { success: false, error: `Plugin returned ${res.status}: ${txt}` }
    }
    const body = (await res.json()) as PluginResponse
    return body
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      error: `Failed to reach Studio plugin at ${pluginUrl(action)}: ${msg}`,
    }
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
  const res = await callPlugin('read_scene', {
    root: args.root,
    maxDepth: args.maxDepth,
  })
  return jsonContent(res.success ? res.data : { error: res.error })
}

export async function handleReadScript(args: { scriptPath: string }) {
  const res = await callPlugin('read_script', { path: args.scriptPath })
  return jsonContent(res.success ? res.data : { error: res.error })
}

export async function handleWriteScript(args: {
  scriptPath: string
  source: string
  scriptType: string
}) {
  const res = await callPlugin('write_script', {
    path: args.scriptPath,
    source: args.source,
    scriptType: args.scriptType,
  })
  return jsonContent(
    res.success
      ? { success: true, path: args.scriptPath, bytesWritten: args.source.length }
      : { error: res.error },
  )
}

export async function handleStartPlaytest(args: { mode: string }) {
  const res = await callPlugin('start_playtest', { mode: args.mode })
  return jsonContent(
    res.success
      ? { success: true, mode: args.mode, status: 'playtest_starting' }
      : { error: res.error },
  )
}

export async function handleStopPlaytest() {
  const res = await callPlugin('stop_playtest', {})
  return jsonContent(
    res.success
      ? { success: true, status: 'playtest_stopping' }
      : { error: res.error },
  )
}

export async function handleCaptureScreenshot(args: {
  format: string
  quality: number
}) {
  const res = await callPlugin('capture_screenshot', {
    format: args.format,
    quality: args.quality,
  })
  return jsonContent(res.success ? res.data : { error: res.error })
}

export async function handleGetOutputLog(args: {
  maxEntries: number
  filter: string
  since: number
}) {
  const res = await callPlugin('get_output_log', {
    maxEntries: args.maxEntries,
    filter: args.filter,
    since: args.since,
  })
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
  const res = await callPlugin('simulate_input', {
    inputType: args.inputType,
    key: args.key,
    action: args.action,
    x: args.x,
    y: args.y,
    duration: args.duration,
    scrollDelta: args.scrollDelta,
  })
  return jsonContent(
    res.success
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
  const res = await callPlugin('navigate_character', {
    targetX: args.x,
    targetY: args.y,
    targetZ: args.z,
    speed: args.speed,
    timeout: args.timeout,
  })
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
  const res = await callPlugin('get_instance_properties', {
    path: args.instancePath,
    properties: args.properties,
  })
  return jsonContent(res.success ? res.data : { error: res.error })
}
