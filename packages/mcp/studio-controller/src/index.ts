#!/usr/bin/env node
/**
 * Studio Controller MCP Server -- port 3006
 *
 * Bridges the AI web app and Roblox Studio by talking directly to the local
 * Studio plugin HTTP endpoint (default localhost:33796). Unlike studio-bridge
 * (which relays through the ForjeGames cloud API), this server communicates
 * with Studio in real time over localhost -- no polling delay.
 *
 * Tools:
 *   read_scene              -> Full scene hierarchy (services, instances, properties)
 *   read_script             -> Read a Luau script's source from a given path
 *   write_script            -> Write Luau code to a script at a given path
 *   start_playtest          -> Start a playtest session in Studio
 *   stop_playtest           -> Stop the current playtest
 *   capture_screenshot      -> Capture the Studio viewport as PNG
 *   get_output_log          -> Get the Output/console log from Studio
 *   simulate_input          -> Simulate keyboard/mouse input during playtest
 *   navigate_character      -> Move the player character to a position
 *   get_instance_properties -> Get properties of a specific instance
 *
 * Transport: StreamableHTTP over Node http on /mcp (stateless + session modes)
 */

import { createServer, IncomingMessage, ServerResponse } from 'node:http'
import { randomUUID } from 'node:crypto'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'

import {
  // Schemas
  ReadSceneSchema,
  ReadScriptSchema,
  WriteScriptSchema,
  StartPlaytestSchema,
  StopPlaytestSchema,
  CaptureScreenshotSchema,
  GetOutputLogSchema,
  SimulateInputSchema,
  NavigateCharacterSchema,
  GetInstancePropertiesSchema,
  // Handlers
  handleReadScene,
  handleReadScript,
  handleWriteScript,
  handleStartPlaytest,
  handleStopPlaytest,
  handleCaptureScreenshot,
  handleGetOutputLog,
  handleSimulateInput,
  handleNavigateCharacter,
  handleGetInstanceProperties,
} from './tools.js'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PORT = Number(process.env.STUDIO_CONTROLLER_PORT ?? 3006)

// ---------------------------------------------------------------------------
// MCP server -- tool registration
// ---------------------------------------------------------------------------

function buildMcpServer(): McpServer {
  const mcp = new McpServer({ name: 'studio-controller', version: '1.0.0' })

  // -- read_scene ------------------------------------------------------------

  // @ts-ignore -- TS2589: MCP SDK zod-compat deep type inference with Zod v3
  mcp.registerTool(
    'read_scene',
    {
      title: 'Read Scene',
      description:
        'Get the full scene hierarchy from Roblox Studio. Returns a recursive tree of services, instances, and their class names. Use this to understand the current state of the game world.',
      inputSchema: ReadSceneSchema,
    },
    async (args) => handleReadScene(args),
  )

  // -- read_script -----------------------------------------------------------

  // @ts-ignore -- TS2589
  mcp.registerTool(
    'read_script',
    {
      title: 'Read Script',
      description:
        'Read the Luau source code of a script at the given instance path. Returns the full source text of a Script, LocalScript, or ModuleScript.',
      inputSchema: ReadScriptSchema,
    },
    async (args) => handleReadScript(args),
  )

  // -- write_script ----------------------------------------------------------

  // @ts-ignore -- TS2589
  mcp.registerTool(
    'write_script',
    {
      title: 'Write Script',
      description:
        'Write Luau source code to a script at the given path. If the script does not exist, it will be created with the specified type. Overwrites the entire script source.',
      inputSchema: WriteScriptSchema,
    },
    async (args) => handleWriteScript(args),
  )

  // -- start_playtest --------------------------------------------------------

  // @ts-ignore -- TS2589
  mcp.registerTool(
    'start_playtest',
    {
      title: 'Start Playtest',
      description:
        'Start a playtest session in Roblox Studio. The game will begin running and you can observe it via get_output_log, capture_screenshot, and simulate_input.',
      inputSchema: StartPlaytestSchema,
    },
    async (args) => handleStartPlaytest(args),
  )

  // -- stop_playtest ---------------------------------------------------------

  // @ts-ignore -- TS2589
  mcp.registerTool(
    'stop_playtest',
    {
      title: 'Stop Playtest',
      description:
        'Stop the currently running playtest in Roblox Studio and return to Edit mode.',
      inputSchema: StopPlaytestSchema,
    },
    async () => handleStopPlaytest(),
  )

  // -- capture_screenshot ----------------------------------------------------

  // @ts-ignore -- TS2589
  mcp.registerTool(
    'capture_screenshot',
    {
      title: 'Capture Screenshot',
      description:
        'Capture a screenshot of the current Studio viewport or active playtest. Returns base64-encoded image data.',
      inputSchema: CaptureScreenshotSchema,
    },
    async (args) => handleCaptureScreenshot(args),
  )

  // -- get_output_log --------------------------------------------------------

  // @ts-ignore -- TS2589
  mcp.registerTool(
    'get_output_log',
    {
      title: 'Get Output Log',
      description:
        'Get the Output/console log from Roblox Studio. Returns recent print(), warn(), and error() messages. Essential for debugging scripts and observing playtest behavior.',
      inputSchema: GetOutputLogSchema,
    },
    async (args) => handleGetOutputLog(args),
  )

  // -- simulate_input --------------------------------------------------------

  // @ts-ignore -- TS2589
  mcp.registerTool(
    'simulate_input',
    {
      title: 'Simulate Input',
      description:
        'Simulate keyboard or mouse input during an active playtest. Use this to test game mechanics, trigger UI interactions, or control the player character.',
      inputSchema: SimulateInputSchema,
    },
    async (args) => handleSimulateInput(args),
  )

  // -- navigate_character ----------------------------------------------------

  // @ts-ignore -- TS2589
  mcp.registerTool(
    'navigate_character',
    {
      title: 'Navigate Character',
      description:
        'Move the player character to a specific world position during an active playtest. Uses Humanoid:MoveTo() pathfinding. Requires a running playtest with a spawned character.',
      inputSchema: NavigateCharacterSchema,
    },
    async (args) => handleNavigateCharacter(args),
  )

  // -- get_instance_properties -----------------------------------------------

  // @ts-ignore -- TS2589
  mcp.registerTool(
    'get_instance_properties',
    {
      title: 'Get Instance Properties',
      description:
        'Get the properties of a specific instance in Roblox Studio by its dotted path. Returns serializable property names and values. Optionally filter to specific property names.',
      inputSchema: GetInstancePropertiesSchema,
    },
    async (args) => handleGetInstanceProperties(args),
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
    req.on('data', (chunk: string) => {
      raw += chunk
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw))
      } catch {
        resolve(undefined)
      }
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

const httpServer = createServer(
  async (req: IncomingMessage, res: ServerResponse) => {
    // CORS headers for local dev
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, mcp-session-id',
    )

    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    if (req.url === '/health' && req.method === 'GET') {
      sendJson(res, 200, {
        status: 'ok',
        server: 'studio-controller',
        port: PORT,
      })
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
            onsessioninitialized: (id) => {
              transports.set(id, transport)
            },
          })
          transport.onclose = () => {
            if (transport.sessionId) transports.delete(transport.sessionId)
          }
          await mcpServer.connect(transport)
          await transport.handleRequest(req, res, body)
          return
        }

        // Stateless fallback
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined,
        })
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
      process.stderr.write(
        `[studio-controller] Request error: ${message}\n`,
      )
      if (!res.headersSent) {
        sendJson(res, 500, {
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error',
            data: message,
          },
          id: null,
        })
      }
    }
  },
)

httpServer.listen(PORT, () => {
  process.stderr.write(
    `[studio-controller] MCP server listening on http://localhost:${PORT}/mcp\n`,
  )
})

httpServer.on('error', (err: NodeJS.ErrnoException) => {
  process.stderr.write(
    `[studio-controller] Server error: ${err.message}\n`,
  )
  process.exit(1)
})

process.on('SIGTERM', async () => {
  process.stderr.write('[studio-controller] Shutting down...\n')
  await mcpServer.close()
  httpServer.close(() => process.exit(0))
})
