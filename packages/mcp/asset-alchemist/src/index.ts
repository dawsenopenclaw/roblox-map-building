#!/usr/bin/env node
/**
 * Asset Alchemist MCP Server — port 3002
 *
 * Tools:
 *   text-to-3d        → Meshy v2 text-to-3D (preview mode, polls to completion)
 *   generate-texture  → Fal AI PBR texture set (albedo/normal/roughness/metallic)
 *   optimize-mesh     → Roblox-specific mesh optimisation recommendations
 *
 * Transport: StreamableHTTP over Node http on /mcp (stateless + session modes)
 * Auth:      MESHY_API_KEY + FAL_KEY from process.env
 */

import { createServer, IncomingMessage, ServerResponse } from 'node:http'
import { randomUUID } from 'node:crypto'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PORT = Number(process.env.ASSET_ALCHEMIST_PORT ?? 3002)
const MESHY_BASE = 'https://api.meshy.ai'
const FAL_QUEUE_BASE = 'https://queue.fal.run'
const POLL_INTERVAL_MS = 4_000
const POLL_MAX_ATTEMPTS = 40

// ---------------------------------------------------------------------------
// Env helpers
// ---------------------------------------------------------------------------

function meshyKey(): string {
  const k = process.env.MESHY_API_KEY
  if (!k) throw new Error('MESHY_API_KEY is not set')
  return k
}

function falKey(): string {
  const k = process.env.FAL_KEY ?? process.env.FAL_API_KEY
  if (!k) throw new Error('FAL_KEY is not set')
  return k
}

// ---------------------------------------------------------------------------
// Anthropic client (for prompt enrichment)
// ---------------------------------------------------------------------------

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? '',
})
const CLAUDE_MODEL = 'claude-3-5-sonnet-20241022'

// ---------------------------------------------------------------------------
// Meshy helpers — text-to-3D with polling
// ---------------------------------------------------------------------------

type MeshyStatus = 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED'

interface MeshyTask {
  id: string
  status: MeshyStatus
  model_urls?: { glb?: string; fbx?: string; obj?: string }
  thumbnail_url?: string
  polygon_count?: number
  vertex_count?: number
  progress?: number
}

async function createMeshyTask(
  prompt: string,
  artStyle: string,
  polyTarget: number,
): Promise<string> {
  const res = await fetch(`${MESHY_BASE}/v2/text-to-3d`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${meshyKey()}`,
    },
    body: JSON.stringify({
      mode: 'preview',
      prompt,
      negative_prompt: 'low quality, blurry, distorted, floating parts, disconnected mesh, NSFW',
      art_style: artStyle,
      topology: 'quad',
      target_polycount: polyTarget,
    }),
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => String(res.status))
    throw new Error(`Meshy task creation failed (${res.status}): ${txt}`)
  }
  const data = (await res.json()) as { result: string }
  return data.result
}

async function pollMeshyTask(taskId: string): Promise<MeshyTask> {
  for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
    await new Promise<void>((r) => setTimeout(r, i === 0 ? 3_000 : POLL_INTERVAL_MS))
    const res = await fetch(`${MESHY_BASE}/v2/text-to-3d/${taskId}`, {
      headers: { Authorization: `Bearer ${meshyKey()}` },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) continue
    const task = (await res.json()) as MeshyTask
    if (task.status === 'SUCCEEDED') return task
    if (task.status === 'FAILED' || task.status === 'EXPIRED') {
      throw new Error(`Meshy task ${taskId} ended with status: ${task.status}`)
    }
  }
  throw new Error(`Meshy task ${taskId} did not complete within timeout`)
}

const ART_STYLE_MAP: Record<string, string> = {
  realistic: 'pbr',
  stylized: 'cartoon',
  lowpoly: 'low-poly',
  roblox: 'low-poly',
  cartoon: 'cartoon',
  pbr: 'pbr',
  low_poly: 'low-poly',
}

// ---------------------------------------------------------------------------
// Fal helpers — PBR texture generation (queue-based)
// ---------------------------------------------------------------------------

interface FalQueueResponse { request_id: string }
interface FalStatusResponse { status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' }
interface FalOutput {
  albedo?: { url: string }
  normal?: { url: string }
  roughness?: { url: string }
  metallic?: { url: string }
  images?: Array<{ url: string }>
}

interface TextureSet {
  albedo: string | null
  normal: string | null
  roughness: string | null
  metallic: string | null
}

async function generatePbrTextures(prompt: string): Promise<TextureSet> {
  const key = falKey()
  const submitRes = await fetch(`${FAL_QUEUE_BASE}/fal-ai/fast-sdxl/texture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Key ${key}` },
    body: JSON.stringify({
      prompt: `${prompt}, seamless PBR texture, physically based rendering, game asset, high detail`,
      resolution: 1024,
      output_format: 'png',
    }),
    signal: AbortSignal.timeout(15_000),
  })
  if (!submitRes.ok) {
    const txt = await submitRes.text().catch(() => String(submitRes.status))
    throw new Error(`Fal texture submission failed (${submitRes.status}): ${txt}`)
  }
  const queue = (await submitRes.json()) as FalQueueResponse
  const reqId = queue.request_id

  for (let i = 0; i < 20; i++) {
    await new Promise<void>((r) => setTimeout(r, 4_000))
    const statusRes = await fetch(
      `${FAL_QUEUE_BASE}/fal-ai/fast-sdxl/texture/requests/${reqId}/status`,
      { headers: { Authorization: `Key ${key}` }, signal: AbortSignal.timeout(8_000) },
    )
    if (!statusRes.ok) continue
    const status = (await statusRes.json()) as FalStatusResponse
    if (status.status === 'COMPLETED') {
      const resultRes = await fetch(
        `${FAL_QUEUE_BASE}/fal-ai/fast-sdxl/texture/requests/${reqId}`,
        { headers: { Authorization: `Key ${key}` }, signal: AbortSignal.timeout(10_000) },
      )
      if (!resultRes.ok) throw new Error('Failed to fetch Fal result')
      const out = (await resultRes.json()) as FalOutput
      return {
        albedo: out.albedo?.url ?? out.images?.[0]?.url ?? null,
        normal: out.normal?.url ?? out.images?.[1]?.url ?? null,
        roughness: out.roughness?.url ?? out.images?.[2]?.url ?? null,
        metallic: out.metallic?.url ?? null,
      }
    }
    if (status.status === 'FAILED') throw new Error('Fal texture generation failed')
  }
  throw new Error('Fal texture generation timed out')
}

// ---------------------------------------------------------------------------
// Claude prompt enrichment (optional — degrades gracefully without API key)
// ---------------------------------------------------------------------------

async function enrichPrompt(description: string): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) return description
  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 300,
      system: `You are a Roblox 3D asset prompt engineer. Given a short description, return ONLY a single enriched prompt string (no JSON, no quotes) that is specific, game-ready, low-poly focused, Roblox-appropriate, and 1-2 sentences.`,
      messages: [{ role: 'user', content: description }],
    })
    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as Anthropic.TextBlock).text)
      .join('')
      .trim()
    return text.length > 10 ? text : description
  } catch {
    return description
  }
}

// ---------------------------------------------------------------------------
// Optimisation recommendations (pure logic, no API calls)
// ---------------------------------------------------------------------------

interface OptimisationResult {
  recommendations: string[]
  priority: 'low' | 'medium' | 'high' | 'critical'
  estimatedSavingsPct: string
  robloxBudget: string
}

function buildOptimisationRecommendations(polyCount: number): OptimisationResult {
  const recs: string[] = []
  let priority: OptimisationResult['priority'] = 'low'
  let budget: string

  if (polyCount > 100_000) {
    priority = 'critical'
    budget = 'EXCEEDS Roblox recommended maximum of 100K polys — will impact performance on all devices'
    recs.push('Decimate mesh to under 100K polygons — use Blender Decimate modifier at 0.5-0.7 ratio')
    recs.push('Set up LOD tiers: full detail < 50 studs, 50% at 50-200 studs, 20% beyond 200 studs')
    recs.push('Use RenderFidelity = Automatic on MeshPart so Roblox manages LOD automatically')
    recs.push('Set CollisionFidelity = Box or Hull to reduce physics CPU cost')
    recs.push('Consider splitting into smaller instanced meshes if structure is modular')
  } else if (polyCount > 50_000) {
    priority = 'high'
    budget = 'Mobile will struggle — target under 10K for props, 20K for buildings'
    recs.push('Target under 50K polygons for cross-device compatibility')
    recs.push('Enable RenderFidelity = Automatic to let Roblox manage LOD')
    recs.push('Bake high-res detail into normal maps to retain visual quality at lower poly count')
    recs.push('Set CollisionFidelity = Hull for convex shapes, Box for simple geometry')
  } else if (polyCount > 10_000) {
    priority = 'medium'
    budget = 'Acceptable for desktop; optimise further for mobile'
    recs.push('Merge coplanar faces to eliminate redundant interior geometry')
    recs.push('Bake ambient occlusion and normal maps from a high-res source mesh')
    recs.push('Remove geometry hidden by other parts (interior walls, floor undersides)')
  } else {
    priority = 'low'
    budget = 'Within Roblox best-practice range — good for props and small assets'
    recs.push('Polygon count is within recommended range for Roblox game assets')
    recs.push('Ensure UV islands are packed efficiently (< 5% wasted UV space)')
    recs.push('Verify mesh is watertight — no open edges or internal faces')
  }

  recs.push('Combine albedo + normal + roughness into a 1024×1024 texture atlas to reduce draw calls')
  recs.push('Set CastShadow = false on small props (< 2 studs) to reduce shadow batches')

  const savingsPct = polyCount > 50_000 ? '40-60%' : polyCount > 10_000 ? '20-40%' : '5-15%'
  return { recommendations: recs, priority, estimatedSavingsPct: savingsPct, robloxBudget: budget }
}

// ---------------------------------------------------------------------------
// MCP server — tool registration
// ---------------------------------------------------------------------------

function buildMcpServer(): McpServer {
  const mcp = new McpServer({ name: 'asset-alchemist', version: '1.0.0' })

  // ── text-to-3d ─────────────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore — TS2589: MCP SDK zod-compat deep type inference with Zod v3
  mcp.registerTool(
    'text-to-3d',
    {
      title: 'Text to 3D',
      description:
        'Generate a Roblox-ready 3D mesh from a text prompt using Meshy AI. Polls until complete and returns the mesh URL, thumbnail, and polygon count.',
      inputSchema: {
        prompt: z.string().min(3).describe('Description of the 3D asset to generate'),
        style: z
          .enum(['realistic', 'stylized', 'lowpoly', 'roblox', 'cartoon', 'pbr', 'low_poly'])
          .default('roblox')
          .describe('Art style for the mesh'),
        polyTarget: z
          .number()
          .int()
          .min(500)
          .max(100_000)
          .default(10_000)
          .describe('Target polygon count'),
        enrichPromptWithAI: z
          .boolean()
          .default(false)
          .describe('Use Claude to enrich the prompt before sending to Meshy'),
      },
    },
    async ({ prompt, style, polyTarget, enrichPromptWithAI }) => {
      const artStyle = ART_STYLE_MAP[style] ?? 'low-poly'
      const finalPrompt = enrichPromptWithAI
        ? await enrichPrompt(prompt)
        : `${prompt}, Roblox-ready game asset, no floating geometry, watertight mesh`

      const taskId = await createMeshyTask(finalPrompt, artStyle, polyTarget)
      const task = await pollMeshyTask(taskId)
      const meshUrl =
        task.model_urls?.glb ?? task.model_urls?.fbx ?? task.model_urls?.obj ?? null
      if (!meshUrl) throw new Error('Meshy returned no downloadable mesh URL')

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              taskId: task.id,
              meshUrl,
              thumbnailUrl: task.thumbnail_url ?? null,
              polygonCount: task.polygon_count ?? null,
              vertexCount: task.vertex_count ?? null,
              artStyle,
              prompt: finalPrompt,
              status: task.status,
            }),
          },
        ],
      }
    },
  )

  // ── generate-texture ────────────────────────────────────────────────────────

  // @ts-ignore — TS2589: MCP SDK zod-compat deep type inference
  mcp.registerTool(
    'generate-texture',
    {
      title: 'Generate PBR Texture',
      description:
        'Generate a seamless PBR texture set (albedo, normal, roughness, metallic) via Fal AI for use in Roblox SurfaceAppearance.',
      inputSchema: {
        prompt: z.string().min(3).describe('Description of the material or surface to texture'),
      },
    },
    async ({ prompt }) => {
      const textures = await generatePbrTextures(prompt)
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(textures) }],
      }
    },
  )

  // ── optimize-mesh ───────────────────────────────────────────────────────────

  // @ts-ignore — TS2589: MCP SDK zod-compat deep type inference
  mcp.registerTool(
    'optimize-mesh',
    {
      title: 'Optimise Mesh',
      description:
        'Returns prioritised Roblox-specific mesh optimisation recommendations based on polygon count. No external API call — instant result.',
      inputSchema: {
        meshUrl: z.string().url().describe('URL of the mesh to analyse'),
        polyCount: z.number().int().min(0).describe('Current polygon count of the mesh'),
      },
    },
    async ({ meshUrl, polyCount }) => {
      const result = buildOptimisationRecommendations(polyCount)
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ meshUrl, polyCount, ...result }),
          },
        ],
      }
    },
  )

  return mcp
}

// ---------------------------------------------------------------------------
// HTTP server — StreamableHTTP transport with session management
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
  if (req.url === '/health' && req.method === 'GET') {
    sendJson(res, 200, { status: 'ok', server: 'asset-alchemist', port: PORT })
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

      // Stateless fallback (no session header; used by mcp-client.ts)
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
    process.stderr.write(`[asset-alchemist] Request error: ${message}\n`)
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
  process.stderr.write(`[asset-alchemist] MCP server listening on http://localhost:${PORT}/mcp\n`)
})

httpServer.on('error', (err: NodeJS.ErrnoException) => {
  process.stderr.write(`[asset-alchemist] Server error: ${err.message}\n`)
  process.exit(1)
})

process.on('SIGTERM', async () => {
  process.stderr.write('[asset-alchemist] Shutting down...\n')
  await mcpServer.close()
  httpServer.close(() => process.exit(0))
})
