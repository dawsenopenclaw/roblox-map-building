#!/usr/bin/env node
/**
 * Studio Bridge MCP Server -- port 3005
 *
 * Provides direct read/write access to Roblox Studio objects and automated
 * playtesting via the ForjeGames Studio Plugin's HTTP command queue.
 *
 * Tools:
 *   read_hierarchy     -> Get the full game object tree from Studio
 *   get_properties     -> Read properties of a specific Instance by path
 *   set_property       -> Change a property on an Instance
 *   create_instance    -> Create a new Instance in Studio
 *   delete_instance    -> Remove an Instance by name
 *   get_scripts        -> Read source code of all scripts
 *   run_playtest       -> Start a playtest in Studio
 *   stop_playtest      -> Stop the running playtest
 *   capture_screenshot -> Take a screenshot of the viewport/game
 *   simulate_input     -> Simulate keyboard/mouse input during playtest
 *   get_output_log     -> Read Studio's Output window (errors, prints)
 *   get_selection      -> Get currently selected objects in Studio
 *
 * Transport: StreamableHTTP over Node http on /mcp (stateless + session modes)
 *
 * Communication: All tools queue commands via HTTP POST to the ForjeGames API
 * server, which the Studio plugin polls every 2-5 seconds. Responses come back
 * through the plugin's change push mechanism.
 */

import { createServer, IncomingMessage, ServerResponse } from 'node:http'
import { randomUUID } from 'node:crypto'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PORT = Number(process.env.STUDIO_BRIDGE_PORT ?? 3005)
const API_BASE = process.env.FORJE_API_BASE ?? 'https://forjegames.com'
const POLL_TIMEOUT_MS = 15_000
const POLL_INTERVAL_MS = 1_500

// ---------------------------------------------------------------------------
// Auth helper -- uses the same session token as the Studio plugin
// ---------------------------------------------------------------------------

function getApiToken(): string {
  const t = process.env.FORJE_API_TOKEN ?? process.env.FORJE_SESSION_TOKEN
  if (!t) throw new Error('FORJE_API_TOKEN or FORJE_SESSION_TOKEN is not set')
  return t
}

function getSessionId(): string {
  const s = process.env.FORJE_SESSION_ID
  if (!s) throw new Error('FORJE_SESSION_ID is not set')
  return s
}

// ---------------------------------------------------------------------------
// API communication helpers
// ---------------------------------------------------------------------------

interface ApiHeaders {
  'Content-Type': string
  Authorization: string
  'X-Session-Id': string
}

function apiHeaders(): ApiHeaders {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getApiToken()}`,
    'X-Session-Id': getSessionId(),
  }
}

/**
 * Queue a command for the Studio plugin via the ForjeGames API.
 * The plugin polls /api/studio/sync and picks up commands from the queue.
 */
async function queuePluginCommand(
  type: string,
  data: Record<string, unknown>,
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`${API_BASE}/api/studio/execute`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ type, data, sessionId: getSessionId() }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => String(res.status))
    return { ok: false, error: `API returned ${res.status}: ${txt}` }
  }
  return { ok: true }
}

/**
 * Queue a command and then poll for the result. Many Studio bridge commands
 * need a round-trip: we queue the command, the plugin executes it, then the
 * plugin pushes the result back as a change. We poll /api/studio/sync to
 * pick up that result.
 */
async function queueAndWaitForResult(
  type: string,
  data: Record<string, unknown>,
  resultType: string,
): Promise<{ ok: boolean; result?: unknown; error?: string }> {
  const requestId = randomUUID()
  const queueRes = await queuePluginCommand(type, { ...data, _requestId: requestId })
  if (!queueRes.ok) return { ok: false, error: queueRes.error }

  // Poll for the response from the plugin
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
          return { ok: true, result: body.data }
        }
      }
    } catch {
      // Polling error -- retry
    }
  }

  // Timeout -- the command was queued but we didn't get a response in time.
  // This is expected for fire-and-forget commands like set_property.
  return { ok: true, result: { status: 'queued', note: 'Command queued but response not received within timeout. The plugin will execute it on next poll.' } }
}

// ---------------------------------------------------------------------------
// MCP server -- tool registration
// ---------------------------------------------------------------------------

function buildMcpServer(): McpServer {
  const mcp = new McpServer({ name: 'forje-studio-bridge', version: '1.0.0' })

  // -- read_hierarchy --------------------------------------------------------

  // @ts-ignore -- TS2589: MCP SDK zod-compat deep type inference with Zod v3
  mcp.registerTool(
    'read_hierarchy',
    {
      title: 'Read Hierarchy',
      description:
        'Get the full game object tree from Roblox Studio. Returns a recursive tree of {name, className, children} for all objects under the specified root.',
      inputSchema: {
        root: z
          .string()
          .default('Workspace')
          .describe('Root service/instance to read from (e.g. "Workspace", "ReplicatedStorage", "ServerScriptService")'),
        maxDepth: z
          .number()
          .int()
          .min(1)
          .max(20)
          .default(10)
          .describe('Maximum depth to traverse'),
      },
    },
    async ({ root, maxDepth }) => {
      const res = await queueAndWaitForResult(
        'get_hierarchy',
        { root, maxDepth },
        'hierarchy_result',
      )
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(res.ok ? res.result : { error: res.error }) }],
      }
    },
  )

  // -- get_properties --------------------------------------------------------

  // @ts-ignore -- TS2589
  mcp.registerTool(
    'get_properties',
    {
      title: 'Get Properties',
      description:
        'Read all serializable properties of a specific Instance in Roblox Studio, identified by its dotted path (e.g. "Workspace.SpawnLocation").',
      inputSchema: {
        instancePath: z.string().min(1).describe('Dotted path to the instance (e.g. "Workspace.MyModel.Part1")'),
      },
    },
    async ({ instancePath }) => {
      const res = await queueAndWaitForResult(
        'get_properties',
        { instancePath },
        'properties_result',
      )
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(res.ok ? res.result : { error: res.error }) }],
      }
    },
  )

  // -- set_property ----------------------------------------------------------

  // @ts-ignore -- TS2589
  mcp.registerTool(
    'set_property',
    {
      title: 'Set Property',
      description:
        'Change a property on an Instance in Roblox Studio. Supports primitive types (string, number, bool) and special types like Color3, Vector3, CFrame via string encoding.',
      inputSchema: {
        instancePath: z.string().min(1).describe('Dotted path to the instance'),
        property: z.string().min(1).describe('Property name (e.g. "Size", "Color", "Anchored")'),
        value: z.union([z.string(), z.number(), z.boolean()]).describe('New value for the property'),
        valueType: z
          .enum(['string', 'number', 'boolean', 'Color3', 'Vector3', 'CFrame', 'BrickColor', 'Enum'])
          .default('string')
          .describe('Type hint for complex value deserialization'),
      },
    },
    async ({ instancePath, property, value, valueType }) => {
      const res = await queuePluginCommand('set_property', {
        instancePath,
        property,
        value,
        valueType,
      })
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(res.ok ? { success: true, instancePath, property, value } : { error: res.error }) }],
      }
    },
  )

  // -- create_instance -------------------------------------------------------

  // @ts-ignore -- TS2589
  mcp.registerTool(
    'create_instance',
    {
      title: 'Create Instance',
      description:
        'Create a new Roblox Instance in Studio. Specify the class name, parent path, and optional initial properties.',
      inputSchema: {
        className: z.string().min(1).describe('Roblox class name (e.g. "Part", "Model", "Script", "SpawnLocation")'),
        parentPath: z.string().default('Workspace').describe('Dotted path to the parent instance'),
        name: z.string().default('').describe('Name for the new instance (defaults to className)'),
        properties: z
          .record(z.union([z.string(), z.number(), z.boolean()]))
          .default({})
          .describe('Initial properties to set as key-value pairs'),
      },
    },
    async ({ className, parentPath, name, properties }) => {
      const res = await queuePluginCommand('create_instance', {
        className,
        parentPath,
        name: name || className,
        properties,
      })
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(res.ok ? { success: true, className, parentPath, name: name || className } : { error: res.error }) }],
      }
    },
  )

  // -- delete_instance -------------------------------------------------------

  // @ts-ignore -- TS2589
  mcp.registerTool(
    'delete_instance',
    {
      title: 'Delete Instance',
      description:
        'Remove an Instance from Roblox Studio by its dotted path or name. Performs a recursive FindFirstChild search.',
      inputSchema: {
        instancePath: z.string().min(1).describe('Dotted path or name of the instance to delete'),
      },
    },
    async ({ instancePath }) => {
      const res = await queuePluginCommand('delete_instance', { instancePath })
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(res.ok ? { success: true, deleted: instancePath } : { error: res.error }) }],
      }
    },
  )

  // -- get_scripts -----------------------------------------------------------

  // @ts-ignore -- TS2589
  mcp.registerTool(
    'get_scripts',
    {
      title: 'Get Scripts',
      description:
        'Read the source code of all Script, LocalScript, and ModuleScript instances in the game. Returns an array of {path, className, source}.',
      inputSchema: {
        root: z
          .string()
          .default('game')
          .describe('Root to search from (e.g. "game", "Workspace", "ServerScriptService")'),
        maxResults: z
          .number()
          .int()
          .min(1)
          .max(100)
          .default(50)
          .describe('Maximum number of scripts to return'),
      },
    },
    async ({ root, maxResults }) => {
      const res = await queueAndWaitForResult(
        'get_scripts',
        { root, maxResults },
        'scripts_result',
      )
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(res.ok ? res.result : { error: res.error }) }],
      }
    },
  )

  // -- run_playtest ----------------------------------------------------------

  // @ts-ignore -- TS2589
  mcp.registerTool(
    'run_playtest',
    {
      title: 'Run Playtest',
      description:
        'Start a playtest in Roblox Studio. The plugin will switch to Play mode (server). Returns immediately; use get_output_log and capture_screenshot to observe.',
      inputSchema: {
        mode: z
          .enum(['server', 'client', 'start'])
          .default('server')
          .describe('Playtest mode: "server" for Play (default), "client" for local test, "start" for the Start button'),
      },
    },
    async ({ mode }) => {
      const res = await queuePluginCommand('start_playtest', { mode })
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(res.ok ? { success: true, mode, status: 'playtest_starting' } : { error: res.error }) }],
      }
    },
  )

  // -- stop_playtest ---------------------------------------------------------

  // @ts-ignore -- TS2589
  mcp.registerTool(
    'stop_playtest',
    {
      title: 'Stop Playtest',
      description: 'Stop the currently running playtest in Roblox Studio and return to Edit mode.',
      inputSchema: {},
    },
    async () => {
      const res = await queuePluginCommand('stop_playtest', {})
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(res.ok ? { success: true, status: 'playtest_stopping' } : { error: res.error }) }],
      }
    },
  )

  // -- capture_screenshot ----------------------------------------------------

  // @ts-ignore -- TS2589
  mcp.registerTool(
    'capture_screenshot',
    {
      title: 'Capture Screenshot',
      description:
        'Take a screenshot of the current Studio viewport or active playtest. Returns a base64-encoded PNG via the session screenshot store.',
      inputSchema: {},
    },
    async () => {
      const res = await queueAndWaitForResult(
        'capture_screenshot',
        {},
        'screenshot_result',
      )
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(res.ok ? res.result : { error: res.error }) }],
      }
    },
  )

  // -- simulate_input --------------------------------------------------------

  // @ts-ignore -- TS2589
  mcp.registerTool(
    'simulate_input',
    {
      title: 'Simulate Input',
      description:
        'Simulate keyboard or mouse input during an active playtest. Useful for automated testing of game mechanics.',
      inputSchema: {
        inputType: z
          .enum(['keyboard', 'mouse_click', 'mouse_move'])
          .describe('Type of input to simulate'),
        key: z
          .string()
          .default('')
          .describe('For keyboard: Enum.KeyCode name (e.g. "W", "Space", "E"). For mouse: ignored.'),
        action: z
          .enum(['press', 'release', 'tap'])
          .default('tap')
          .describe('"tap" simulates press+release. "press" holds down. "release" lets go.'),
        x: z.number().default(0).describe('For mouse_click/mouse_move: screen X coordinate'),
        y: z.number().default(0).describe('For mouse_click/mouse_move: screen Y coordinate'),
        duration: z
          .number()
          .min(0)
          .max(10)
          .default(0.1)
          .describe('Duration in seconds for tap/hold actions'),
      },
    },
    async ({ inputType, key, action, x, y, duration }) => {
      const res = await queuePluginCommand('simulate_input', {
        inputType,
        key,
        action,
        x,
        y,
        duration,
      })
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(res.ok ? { success: true, inputType, key, action } : { error: res.error }) }],
      }
    },
  )

  // -- get_output_log --------------------------------------------------------

  // @ts-ignore -- TS2589
  mcp.registerTool(
    'get_output_log',
    {
      title: 'Get Output Log',
      description:
        'Read Studio\'s Output window contents. Returns recent log entries including prints, warnings, and errors. Essential for debugging playtest issues.',
      inputSchema: {
        maxEntries: z
          .number()
          .int()
          .min(1)
          .max(500)
          .default(100)
          .describe('Maximum number of log entries to return'),
        filter: z
          .enum(['all', 'errors', 'warnings', 'info'])
          .default('all')
          .describe('Filter log entries by severity'),
      },
    },
    async ({ maxEntries, filter }) => {
      const res = await queueAndWaitForResult(
        'get_output',
        { maxEntries, filter },
        'output_result',
      )
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(res.ok ? res.result : { error: res.error }) }],
      }
    },
  )

  // -- get_selection ---------------------------------------------------------

  // @ts-ignore -- TS2589
  mcp.registerTool(
    'get_selection',
    {
      title: 'Get Selection',
      description:
        'Get the currently selected objects in Roblox Studio. Returns an array of {name, className, path} for each selected Instance.',
      inputSchema: {},
    },
    async () => {
      const res = await queueAndWaitForResult(
        'get_selection',
        {},
        'selection_result',
      )
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(res.ok ? res.result : { error: res.error }) }],
      }
    },
  )

  return mcp
}

// ---------------------------------------------------------------------------
// HTTP server -- StreamableHTTP transport with session management
// ---------------------------------------------------------------------------

const mcpServer = buildMcpServer()
const transports = new Map<string, StreamableHTTPServerTransport>()

async function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.setEncoding('utf8')
    req.on('data', (chunk: string) => { raw += chunk })
    req.on('end', () => {
      try { resolve(JSON.parse(raw)) } catch { resolve(undefined) }
    })
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, statusCode: number, body: unknown): void {
  const payload = JSON.stringify(body)
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
  })
  res.end(payload)
}

const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  // CORS headers for local dev
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.url === '/health' && req.method === 'GET') {
    sendJson(res, 200, { status: 'ok', server: 'forje-studio-bridge', port: PORT })
    return
  }

  if (req.url !== '/mcp') {
    sendJson(res, 404, { error: 'Not found. POST /mcp or GET /health' })
    return
  }

  try {
    if (req.method === 'POST') {
      const body = await readBody(req)
      const sessionId = req.headers['mcp-session-id'] as string | undefined

      // Resume existing session
      if (sessionId && transports.has(sessionId)) {
        await transports.get(sessionId)!.handleRequest(req, res, body)
        return
      }

      if (!sessionId && isInitializeRequest(body)) {
        // New stateful session
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (id) => { transports.set(id, transport) },
        })
        transport.onclose = () => {
          if (transport.sessionId) transports.delete(transport.sessionId)
        }
        await mcpServer.connect(transport)
        await transport.handleRequest(req, res, body)
        return
      }

      // Stateless fallback
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
      await mcpServer.connect(transport)
      await transport.handleRequest(req, res, body)
      return
    }

    if (req.method === 'GET') {
      const sessionId = req.headers['mcp-session-id'] as string | undefined
      if (sessionId && transports.has(sessionId)) {
        await transports.get(sessionId)!.handleRequest(req, res)
        return
      }
      sendJson(res, 400, {
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Invalid or missing session ID' },
        id: null,
      })
      return
    }

    if (req.method === 'DELETE') {
      const sessionId = req.headers['mcp-session-id'] as string | undefined
      if (sessionId && transports.has(sessionId)) {
        await transports.get(sessionId)!.handleRequest(req, res)
        transports.delete(sessionId)
        return
      }
      sendJson(res, 404, { error: 'Session not found' })
      return
    }

    sendJson(res, 405, { error: 'Method not allowed' })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    process.stderr.write(`[studio-bridge] Request error: ${message}\n`)
    if (!res.headersSent) {
      sendJson(res, 500, {
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error', data: message },
        id: null,
      })
    }
  }
})

httpServer.listen(PORT, () => {
  process.stderr.write(`[studio-bridge] MCP server listening on http://localhost:${PORT}/mcp\n`)
})

httpServer.on('error', (err: NodeJS.ErrnoException) => {
  process.stderr.write(`[studio-bridge] Server error: ${err.message}\n`)
  process.exit(1)
})

process.on('SIGTERM', async () => {
  process.stderr.write('[studio-bridge] Shutting down...\n')
  await mcpServer.close()
  httpServer.close(() => process.exit(0))
})
