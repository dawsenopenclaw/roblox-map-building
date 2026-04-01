/**
 * MCP Client — connects to MCP servers via HTTP POST.
 *
 * Server registry is loaded from env vars:
 *   MCP_ASSET_ALCHEMIST_URL  (default: http://localhost:3002)
 *   MCP_CITY_ARCHITECT_URL   (default: http://localhost:3003)
 *   MCP_TERRAIN_FORGE_URL    (default: http://localhost:3004)
 *
 * Falls back to demo data with a warning when a server is unreachable.
 * Exports the same interface as the previous stub so all call-sites are unchanged.
 */

import { z } from 'zod'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface McpCallResult {
  server: string
  tool: string
  success: boolean
  data: Record<string, unknown>
  /** true when the result is synthetic demo data, not a real MCP response */
  demo: boolean
  /** populated when demo: true and the server is reachable but responded with an error */
  warning?: string
}

// ── MCP JSON-RPC envelope schemas ────────────────────────────────────────────

const mcpRequestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number()]),
  method: z.literal('tools/call'),
  params: z.object({
    name: z.string(),
    arguments: z.record(z.unknown()),
  }),
})

const mcpSuccessResponseSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number()]),
  result: z.object({
    content: z.array(
      z.object({
        type: z.string(),
        text: z.string().optional(),
        data: z.record(z.unknown()).optional(),
      })
    ),
    isError: z.boolean().optional(),
  }),
})

const mcpErrorResponseSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number()]).nullable(),
  error: z.object({
    code: z.number(),
    message: z.string(),
    data: z.unknown().optional(),
  }),
})

type McpSuccessResponse = z.infer<typeof mcpSuccessResponseSchema>

// ── Server registry ───────────────────────────────────────────────────────────

const SERVER_URLS: Record<string, string> = {
  'asset-alchemist': process.env.MCP_ASSET_ALCHEMIST_URL ?? 'http://localhost:3002',
  'city-architect':  process.env.MCP_CITY_ARCHITECT_URL  ?? 'http://localhost:3003',
  'terrain-forge':   process.env.MCP_TERRAIN_FORGE_URL   ?? 'http://localhost:3004',
}

function getServerUrl(server: string): string | null {
  return SERVER_URLS[server] ?? null
}

// ── Demo data fallback ────────────────────────────────────────────────────────

function buildDemoResult(
  server: string,
  tool: string,
  warning?: string
): McpCallResult {
  return {
    server,
    tool,
    success: true,
    demo: true,
    warning,
    data: {
      message: `[Demo] ${server}/${tool} would generate real output when MCP servers are connected`,
      preview: 'https://forjegames.com/demo/mesh-preview.svg',
    },
  }
}

// ── HTTP transport with retry ─────────────────────────────────────────────────

const RETRY_DELAYS_MS = [500, 1_000, 2_000] as const
const REQUEST_TIMEOUT_MS = 15_000

async function httpCallWithRetry(
  url: string,
  body: z.infer<typeof mcpRequestSchema>,
  attempt = 0
): Promise<McpSuccessResponse> {
  const res = await fetch(`${url}/mcp`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body:    JSON.stringify(body),
    signal:  AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => `HTTP ${res.status}`)
    // 4xx — do not retry, bubble up
    if (res.status >= 400 && res.status < 500) {
      throw new Error(`MCP server responded with ${res.status}: ${text}`)
    }
    // 5xx — retry up to 3 times
    if (attempt < RETRY_DELAYS_MS.length) {
      await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]))
      return httpCallWithRetry(url, body, attempt + 1)
    }
    throw new Error(`MCP server at ${url} failed after ${attempt + 1} attempts: ${text}`)
  }

  const raw: unknown = await res.json()

  // Check for JSON-RPC error envelope first
  const errorParsed = mcpErrorResponseSchema.safeParse(raw)
  if (errorParsed.success) {
    throw new Error(
      `MCP error ${errorParsed.data.error.code}: ${errorParsed.data.error.message}`
    )
  }

  const parsed = mcpSuccessResponseSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(
      `MCP response validation failed: ${parsed.error.flatten().fieldErrors}`
    )
  }

  if (parsed.data.result.isError) {
    const firstContent = parsed.data.result.content[0]
    throw new Error(`MCP tool error: ${firstContent?.text ?? 'unknown error'}`)
  }

  return parsed.data
}

// ── Response content → data extraction ────────────────────────────────────────

function extractData(response: McpSuccessResponse): Record<string, unknown> {
  const content = response.result.content

  // Prefer explicit data objects
  const dataContent = content.find((c) => c.type === 'data' && c.data)
  if (dataContent?.data) return dataContent.data

  // Fall back to text content — attempt JSON parse, else wrap as message
  const textContent = content.find((c) => c.type === 'text' && c.text)
  if (textContent?.text) {
    try {
      const parsed: unknown = JSON.parse(textContent.text)
      if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
    } catch {
      // not JSON
    }
    return { message: textContent.text }
  }

  // Return all content as-is
  return { content }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Detects which MCP server and tool to call based on the conversation context.
 * Returns null if no MCP action is appropriate for this message pair.
 */
export function detectMcpIntent(
  userMessage: string,
  aiResponse: string
): { server: string; tool: string; args: Record<string, unknown> } | null {
  const lower = (userMessage + ' ' + aiResponse).toLowerCase()

  if (lower.includes('terrain') || lower.includes('landscape') || lower.includes('biome')) {
    return {
      server: 'terrain-forge',
      tool:   'generate-terrain',
      args:   { biome: 'forest', seed: Date.now() },
    }
  }
  if (lower.includes('city') || lower.includes('road') || lower.includes('urban')) {
    return {
      server: 'city-architect',
      tool:   'plan-city',
      args:   { density: 0.5 },
    }
  }
  if (lower.includes('3d') || lower.includes('mesh') || lower.includes('model')) {
    return {
      server: 'asset-alchemist',
      tool:   'text-to-3d',
      args:   { prompt: userMessage },
    }
  }

  return null
}

/**
 * Calls a tool on an MCP server via HTTP POST (JSON-RPC 2.0).
 *
 * Retries up to 3 times on 5xx errors.
 * Falls back to demo data if the server is unreachable or not registered.
 */
export async function callTool(
  server: string,
  tool: string,
  args: Record<string, unknown>
): Promise<McpCallResult> {
  const baseUrl = getServerUrl(server)

  if (!baseUrl) {
    return buildDemoResult(
      server,
      tool,
      `Unknown MCP server "${server}". Registered servers: ${Object.keys(SERVER_URLS).join(', ')}`
    )
  }

  const requestId = `${server}-${tool}-${Date.now()}`
  const body = mcpRequestSchema.parse({
    jsonrpc: '2.0',
    id:      requestId,
    method:  'tools/call',
    params:  { name: tool, arguments: args },
  })

  try {
    const response = await httpCallWithRetry(baseUrl, body)
    const data     = extractData(response)

    return { server, tool, success: true, demo: false, data }
  } catch (err) {
    const isNetworkError =
      err instanceof TypeError ||
      (err instanceof Error && (
        err.message.includes('ECONNREFUSED') ||
        err.message.includes('fetch failed') ||
        err.message.includes('AbortError') ||
        err.message.includes('timeout')
      ))

    if (isNetworkError) {
      // Server is down — silent fallback to demo
      return buildDemoResult(
        server,
        tool,
        `MCP server "${server}" at ${baseUrl} is unreachable. Start it with: npm run dev --workspace=packages/mcp`
      )
    }

    // Server is up but returned a tool/protocol error — surface the warning
    const message = err instanceof Error ? err.message : String(err)
    return buildDemoResult(server, tool, message)
  }
}
