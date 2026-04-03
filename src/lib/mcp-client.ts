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

/**
 * Parses an MCP response body that may be either plain JSON or SSE
 * (text/event-stream).  The StreamableHTTP transport wraps every response in
 * SSE, so we need to extract the `data:` line and parse the embedded JSON.
 */
async function parseMcpResponseBody(res: Response): Promise<unknown> {
  const contentType = res.headers.get('content-type') ?? ''

  if (contentType.includes('text/event-stream')) {
    const text = await res.text()
    // SSE format: "event: message\ndata: {...}\n\n"
    // Extract the last non-empty "data:" line.
    const dataLine = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.startsWith('data:'))
      .at(-1)
    if (!dataLine) throw new Error('SSE response contained no data line')
    return JSON.parse(dataLine.slice('data:'.length).trim())
  }

  return res.json()
}

async function httpCallWithRetry(
  url: string,
  body: z.infer<typeof mcpRequestSchema>,
  attempt = 0
): Promise<McpSuccessResponse> {
  const res = await fetch(`${url}/mcp`, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      // StreamableHTTP transport requires both content types in Accept
      Accept: 'application/json, text/event-stream',
    },
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

  const raw: unknown = await parseMcpResponseBody(res)

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

// ── Intent patterns ──────────────────────────────────────────────────────────

interface IntentPattern {
  server: string
  tool: string
  /** Patterns — at least one must match for this intent to fire */
  patterns: RegExp[]
  /** Negative patterns — if any match, this intent is suppressed */
  exclude?: RegExp[]
  /** Extract richer arguments from the user message */
  extractArgs: (userMessage: string, aiResponse: string) => Record<string, unknown>
  /** Priority — higher = checked first (default 0) */
  priority?: number
}

const BIOME_KEYWORDS: Record<string, string> = {
  forest: 'forest', jungle: 'jungle', desert: 'desert', snow: 'snow', arctic: 'snow',
  tundra: 'tundra', swamp: 'swamp', beach: 'beach', ocean: 'ocean', volcanic: 'volcanic',
  lava: 'volcanic', mountain: 'mountain', cave: 'cave', meadow: 'meadow', savanna: 'savanna',
  plains: 'plains', island: 'island', canyon: 'canyon', marsh: 'swamp',
}

function detectBiome(text: string): string {
  const lower = text.toLowerCase()
  for (const [keyword, biome] of Object.entries(BIOME_KEYWORDS)) {
    if (lower.includes(keyword)) return biome
  }
  return 'forest'
}

function detectArtStyle(text: string): string {
  const lower = text.toLowerCase()
  if (lower.includes('realistic') || lower.includes('photorealistic')) return 'realistic'
  if (lower.includes('cartoon') || lower.includes('toon') || lower.includes('stylized')) return 'cartoon'
  if (lower.includes('voxel') || lower.includes('blocky') || lower.includes('minecraft')) return 'voxel'
  if (lower.includes('low poly') || lower.includes('low-poly')) return 'low-poly'
  if (lower.includes('anime') || lower.includes('japanese')) return 'anime'
  return 'game-asset'
}

function detectDensity(text: string): number {
  const lower = text.toLowerCase()
  if (lower.includes('dense') || lower.includes('packed') || lower.includes('crowded')) return 0.8
  if (lower.includes('sparse') || lower.includes('spread') || lower.includes('few')) return 0.2
  if (lower.includes('suburban') || lower.includes('residential')) return 0.4
  if (lower.includes('downtown') || lower.includes('metropolitan')) return 0.9
  return 0.5
}

const INTENT_PATTERNS: IntentPattern[] = [
  // Terrain generation — highest priority for terrain-specific requests
  {
    server: 'terrain-forge',
    tool: 'generate-terrain',
    patterns: [
      /\bterrain\b/i, /\blandscape\b/i, /\bbiome\b/i, /\bheightmap\b/i,
      /\bsculpt\s*(the\s*)?ground/i, /\bmountain/i, /\bhill/i, /\bvalley/i,
      /\briver\b/i, /\blake\b/i, /\bocean\b/i, /\bbeach\b/i,
      /\bflatten\b/i, /\bgenerate\s*(a\s*)?(new\s*)?map/i,
      /\bdesert\b/i, /\bsnow\b.*\bground/i, /\bvolcanic\b/i,
      /\bcanyon\b/i, /\bcliff/i, /\bswamp\b/i, /\bforest\s*floor/i,
    ],
    exclude: [/\bcity\b/i, /\bbuilding\b/i, /\b3d\s*model\b/i],
    priority: 2,
    extractArgs: (msg) => ({
      biome: detectBiome(msg),
      seed: Date.now(),
      size: msg.toLowerCase().includes('large') ? 2048 : msg.toLowerCase().includes('small') ? 512 : 1024,
      roughness: msg.toLowerCase().includes('flat') ? 0.1 : msg.toLowerCase().includes('rough') ? 0.9 : 0.5,
    }),
  },

  // City / urban planning
  {
    server: 'city-architect',
    tool: 'plan-city',
    patterns: [
      /\bcity\b/i, /\btown\b/i, /\burban\b/i, /\broads?\b/i,
      /\bstreet/i, /\bblock\b/i, /\bneighborhood\b/i, /\bdistrict\b/i,
      /\bskyline\b/i, /\bskyscraper/i, /\bdowntown\b/i,
      /\bvillage\b/i, /\bsuburb/i, /\bintersection\b/i,
      /\bparking\s*lot\b/i, /\bsidewalk/i, /\bcrosswalk/i,
    ],
    exclude: [/\b3d\s*model\b/i, /\bmesh\b/i],
    priority: 2,
    extractArgs: (msg) => ({
      density: detectDensity(msg),
      style: msg.toLowerCase().includes('modern') ? 'modern'
        : msg.toLowerCase().includes('medieval') ? 'medieval'
        : msg.toLowerCase().includes('futuristic') ? 'futuristic'
        : 'mixed',
      gridSize: msg.toLowerCase().includes('large') ? 8 : msg.toLowerCase().includes('small') ? 3 : 5,
    }),
  },

  // 3D model generation via Meshy
  {
    server: 'asset-alchemist',
    tool: 'text-to-3d',
    patterns: [
      /\b3d\b/i, /\bmesh\b/i, /\bgenerate\s*(a\s*)?(3d\s*)?model/i,
      /\bcreate\s*(a\s*)?(3d\s*)?model/i, /\bmake\s*(a\s*)?(3d\s*)?model/i,
      /\bsculpt\s*(a|an)\b/i, /\bcustom\s*asset/i,
      /\bgenerate\s*(a\s*)?mesh/i,
    ],
    priority: 1,
    extractArgs: (msg) => ({
      prompt: msg.replace(/^(generate|create|make|build)\s*(a\s*)?(3d\s*)?(model|mesh)\s*(of\s*)?/i, '').trim() || msg,
      art_style: detectArtStyle(msg),
      target_polycount: msg.toLowerCase().includes('low poly') ? 5000 : 15000,
    }),
  },

  // Texture generation via Fal
  {
    server: 'asset-alchemist',
    tool: 'generate-texture',
    patterns: [
      /\btexture\b/i, /\bpbr\b/i, /\bmaterial\s*map/i,
      /\balbedo\b/i, /\bnormal\s*map/i, /\broughness\s*map/i,
      /\bgenerate\s*(a\s*)?texture/i, /\bcreate\s*(a\s*)?texture/i,
    ],
    exclude: [/\b3d\b/i, /\bmesh\b/i],
    priority: 1,
    extractArgs: (msg) => ({
      prompt: msg,
      resolution: 1024,
      seamless: true,
    }),
  },
]

/**
 * Detects which MCP server and tool to call based on the conversation context.
 * Uses pattern matching with priority ordering, exclusion filters, and rich arg extraction.
 * Returns null if no MCP action is appropriate for this message pair.
 */
export function detectMcpIntent(
  userMessage: string,
  aiResponse: string
): { server: string; tool: string; args: Record<string, unknown> } | null {
  const combined = userMessage + ' ' + aiResponse

  // Sort by priority (highest first)
  const sorted = [...INTENT_PATTERNS].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))

  for (const intent of sorted) {
    // Check exclusion patterns first
    if (intent.exclude?.some((re) => re.test(combined))) continue

    // Check if any positive pattern matches
    if (intent.patterns.some((re) => re.test(combined))) {
      return {
        server: intent.server,
        tool: intent.tool,
        args: intent.extractArgs(userMessage, aiResponse),
      }
    }
  }

  return null
}

/**
 * Calls multiple MCP tools in parallel. Returns all results (settled).
 * Useful for orchestrating multi-agent workflows from a single user command.
 */
export async function callToolsParallel(
  calls: Array<{ server: string; tool: string; args: Record<string, unknown> }>
): Promise<McpCallResult[]> {
  const results = await Promise.allSettled(
    calls.map((c) => callTool(c.server, c.tool, c.args))
  )
  return results.map((r, i) =>
    r.status === 'fulfilled'
      ? r.value
      : buildDemoResult(calls[i].server, calls[i].tool, r.reason?.message ?? 'Unknown error')
  )
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
