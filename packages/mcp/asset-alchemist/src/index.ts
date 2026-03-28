#!/usr/bin/env node
/**
 * asset-alchemist MCP Server
 * Multi-model pipeline: Claude → Meshy (3D) + Fal (textures)
 * Tools: generate_3d_model, generate_texture, generate_asset_pack
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Token metering
// ---------------------------------------------------------------------------
const tokenLog: Array<{
  tool: string
  provider: string
  inputTokens?: number
  outputTokens?: number
  costUsd: number
  timestamp: string
}> = []

function meterClaude(tool: string, inputTokens: number, outputTokens: number) {
  const costUsd = (inputTokens / 1e6) * 3.0 + (outputTokens / 1e6) * 15.0
  tokenLog.push({ tool, provider: 'claude', inputTokens, outputTokens, costUsd, timestamp: new Date().toISOString() })
  process.stderr.write(`[asset-alchemist] claude/${tool}: $${costUsd.toFixed(6)}\n`)
  return costUsd
}

function meterExternal(tool: string, provider: string, costUsd: number) {
  tokenLog.push({ tool, provider, costUsd, timestamp: new Date().toISOString() })
  process.stderr.write(`[asset-alchemist] ${provider}/${tool}: $${costUsd.toFixed(4)}\n`)
}

// ---------------------------------------------------------------------------
// Circuit breaker
// ---------------------------------------------------------------------------
type BreakerState = 'closed' | 'open' | 'half-open'

class CircuitBreaker {
  private state: BreakerState = 'closed'
  private failureCount = 0
  private lastFailureTime = 0
  private readonly threshold = 3
  private readonly timeout = 30_000

  constructor(public readonly name: string) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open'
      } else {
        throw new Error(`Circuit breaker OPEN for ${this.name}`)
      }
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (err) {
      this.onFailure()
      throw err
    }
  }

  private onSuccess() {
    this.failureCount = 0
    this.state = 'closed'
  }

  private onFailure() {
    this.failureCount++
    this.lastFailureTime = Date.now()
    if (this.failureCount >= this.threshold) {
      this.state = 'open'
      process.stderr.write(`[asset-alchemist] Circuit breaker OPENED for ${this.name}\n`)
    }
  }

  getState(): BreakerState { return this.state }
}

const meshyBreaker = new CircuitBreaker('meshy')
const falBreaker = new CircuitBreaker('fal')

// ---------------------------------------------------------------------------
// Anthropic client
// ---------------------------------------------------------------------------
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const CLAUDE_MODEL = 'claude-3-5-sonnet-20241022'

// ---------------------------------------------------------------------------
// Meshy API client (text-to-3D)
// ---------------------------------------------------------------------------
interface MeshyPreviewResult {
  jobId: string
  status: string
  modelUrls?: Record<string, string>
  thumbnailUrl?: string
}

async function meshyTextTo3D(prompt: string, artStyle = 'realistic'): Promise<MeshyPreviewResult> {
  const apiKey = process.env.MESHY_API_KEY
  if (!apiKey) throw new Error('MESHY_API_KEY not set')

  // Step 1: Create preview task
  const previewRes = await fetch('https://api.meshy.ai/openapi/v2/text-to-3d', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      mode: 'preview',
      prompt,
      art_style: artStyle,
      negative_prompt: 'low quality, blurry',
      target_polycount: 20000,
    }),
  })

  if (!previewRes.ok) {
    throw new Error(`Meshy preview failed: ${previewRes.status} ${await previewRes.text()}`)
  }

  const { result: jobId } = await previewRes.json() as { result: string }
  meterExternal('generate_3d_model', 'meshy', 0.2)

  return { jobId, status: 'processing' }
}

// ---------------------------------------------------------------------------
// Fal AI texture generation
// ---------------------------------------------------------------------------
interface FalTextureResult {
  url: string
  width: number
  height: number
}

async function falGenerateTexture(prompt: string): Promise<FalTextureResult> {
  const apiKey = process.env.FAL_KEY
  if (!apiKey) throw new Error('FAL_KEY not set')

  const res = await fetch('https://fal.run/fal-ai/flux/schnell', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Key ${apiKey}`,
    },
    body: JSON.stringify({
      prompt,
      image_size: 'square_hd',
      num_inference_steps: 4,
      num_images: 1,
    }),
  })

  if (!res.ok) {
    throw new Error(`Fal texture failed: ${res.status} ${await res.text()}`)
  }

  const data = await res.json() as { images: Array<{ url: string; width: number; height: number }> }
  const img = data.images[0]
  if (!img) throw new Error('No image returned from Fal')

  meterExternal('generate_texture', 'fal', 0.003)

  return { url: img.url, width: img.width, height: img.height }
}

// ---------------------------------------------------------------------------
// Claude asset prompt enrichment
// ---------------------------------------------------------------------------
async function enrichPromptWithClaude(
  description: string,
  assetType: 'model' | 'texture' | 'pack'
): Promise<{ enrichedPrompt: string; tags: string[]; style: string }> {
  const systemPrompts: Record<typeof assetType, string> = {
    model: `You are a Roblox 3D asset prompt engineer. Given a description, output ONLY JSON:
{"enrichedPrompt": string, "tags": string[], "style": string, "negativePrompt": string}
Make prompts specific, game-ready, low-poly focused.`,
    texture: `You are a Roblox texture prompt engineer. Given a description, output ONLY JSON:
{"enrichedPrompt": string, "tags": string[], "style": string}
Make textures tileable, game-appropriate, PBR when possible.`,
    pack: `You are a Roblox asset pack designer. Given a theme, output ONLY JSON:
{"enrichedPrompt": string, "tags": string[], "style": string, "assetList": string[]}
List 3-5 specific assets that belong in the pack.`,
  }

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 500,
    system: systemPrompts[assetType],
    messages: [{ role: 'user', content: description }],
  })

  meterClaude(`enrich-${assetType}`, response.usage.input_tokens, response.usage.output_tokens)

  const raw = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as Anthropic.TextBlock).text)
    .join('')

  try {
    return JSON.parse(raw)
  } catch {
    const match = raw.match(/```(?:json)?\s*([\s\S]+?)```/)
    return match ? JSON.parse(match[1]) : { enrichedPrompt: description, tags: [], style: 'realistic' }
  }
}

// ---------------------------------------------------------------------------
// Tool: generate_3d_model
// ---------------------------------------------------------------------------
const Generate3DModelSchema = z.object({
  description: z.string().describe('Description of the 3D model'),
  artStyle: z
    .enum(['realistic', 'cartoon', 'low_poly', 'pbr'])
    .default('realistic'),
  skipEnrichment: z.boolean().default(false).describe('Skip Claude prompt enrichment'),
})

async function generate3DModel(params: z.infer<typeof Generate3DModelSchema>) {
  const { description, artStyle = 'realistic', skipEnrichment = false } = params

  let enriched = { enrichedPrompt: description, tags: [] as string[], style: artStyle }

  if (!skipEnrichment) {
    enriched = await enrichPromptWithClaude(description, 'model')
  }

  const meshyResult = await meshyBreaker.execute(() =>
    meshyTextTo3D(enriched.enrichedPrompt, artStyle)
  )

  return {
    success: true,
    jobId: meshyResult.jobId,
    status: meshyResult.status,
    modelUrls: meshyResult.modelUrls,
    thumbnailUrl: meshyResult.thumbnailUrl,
    prompt: enriched.enrichedPrompt,
    originalDescription: description,
    tags: enriched.tags,
    style: enriched.style,
    provider: 'meshy',
    circuitBreakerState: meshyBreaker.getState(),
    tokenUsage: tokenLog.filter((t) => t.tool.startsWith('enrich')).slice(-1)[0],
  }
}

// ---------------------------------------------------------------------------
// Tool: generate_texture
// ---------------------------------------------------------------------------
const GenerateTextureSchema = z.object({
  description: z.string().describe('Texture description'),
  resolution: z.enum(['256', '512', '1024']).default('1024'),
  skipEnrichment: z.boolean().default(false),
})

async function generateTexture(params: z.infer<typeof GenerateTextureSchema>) {
  const { description, resolution = '1024', skipEnrichment = false } = params

  let enriched = { enrichedPrompt: description, tags: [] as string[], style: 'pbr' }

  if (!skipEnrichment) {
    enriched = await enrichPromptWithClaude(description, 'texture')
  }

  const textureResult = await falBreaker.execute(() =>
    falGenerateTexture(`${enriched.enrichedPrompt}, game texture, tileable, ${resolution}px`)
  )

  return {
    success: true,
    url: textureResult.url,
    width: textureResult.width,
    height: textureResult.height,
    prompt: enriched.enrichedPrompt,
    originalDescription: description,
    tags: enriched.tags,
    provider: 'fal',
    circuitBreakerState: falBreaker.getState(),
  }
}

// ---------------------------------------------------------------------------
// Tool: generate_asset_pack
// ---------------------------------------------------------------------------
const GenerateAssetPackSchema = z.object({
  theme: z.string().describe('Pack theme (e.g. "medieval village", "sci-fi space station")'),
  includeTextures: z.boolean().default(true),
  modelCount: z.number().min(1).max(5).default(3),
})

async function generateAssetPack(params: z.infer<typeof GenerateAssetPackSchema>) {
  const { theme, includeTextures = true, modelCount = 3 } = params

  // Get asset list from Claude
  const packMeta = await enrichPromptWithClaude(theme, 'pack') as {
    enrichedPrompt: string
    tags: string[]
    style: string
    assetList?: string[]
  }

  const assetList = packMeta.assetList?.slice(0, modelCount) ?? [
    `${theme} building`,
    `${theme} prop`,
    `${theme} decoration`,
  ]

  // Parallel: Meshy for each model + Fal for textures
  const modelPromises = assetList.map((assetDesc) =>
    meshyBreaker
      .execute(() => meshyTextTo3D(`${assetDesc}, ${packMeta.style}, game-ready, low poly`))
      .then((r) => ({ name: assetDesc, ...r, success: true }))
      .catch((err) => ({
        name: assetDesc,
        jobId: `failed-${Date.now()}`,
        status: 'failed',
        success: false,
        error: err instanceof Error ? err.message : String(err),
      }))
  )

  const texturePromises: Promise<unknown>[] = includeTextures
    ? [
        falBreaker
          .execute(() =>
            falGenerateTexture(`${theme} ground texture, tileable, game texture`)
          )
          .then((r) => ({ type: 'ground', ...r }))
          .catch(() => ({ type: 'ground', failed: true })),
        falBreaker
          .execute(() =>
            falGenerateTexture(`${theme} wall texture, tileable, seamless, game texture`)
          )
          .then((r) => ({ type: 'wall', ...r }))
          .catch(() => ({ type: 'wall', failed: true })),
      ]
    : []

  const [models, textures] = await Promise.all([
    Promise.all(modelPromises),
    Promise.all(texturePromises),
  ])

  const totalCost = tokenLog.reduce((sum, t) => sum + t.costUsd, 0)

  return {
    success: true,
    theme,
    models,
    textures: includeTextures ? textures : [],
    assetCount: models.length,
    textureCount: textures.length,
    style: packMeta.style,
    tags: packMeta.tags,
    totalCostUsd: Math.round(totalCost * 10000) / 10000,
    circuitBreakers: {
      meshy: meshyBreaker.getState(),
      fal: falBreaker.getState(),
    },
  }
}

// ---------------------------------------------------------------------------
// MCP Tools definition
// ---------------------------------------------------------------------------
const TOOLS: Tool[] = [
  {
    name: 'generate_3d_model',
    description:
      'Generate a Roblox-ready 3D model from a description using Meshy AI. Returns a job ID for polling + optional model URLs when complete.',
    inputSchema: {
      type: 'object',
      properties: {
        description: { type: 'string', description: 'What to generate (e.g. "wooden medieval tavern")' },
        artStyle: { type: 'string', enum: ['realistic', 'cartoon', 'low_poly', 'pbr'] },
        skipEnrichment: { type: 'boolean', description: 'Skip Claude prompt enrichment' },
      },
      required: ['description'],
    },
  },
  {
    name: 'generate_texture',
    description:
      'Generate a game texture from a description using Fal AI. Returns a URL to the generated texture image.',
    inputSchema: {
      type: 'object',
      properties: {
        description: { type: 'string', description: 'Texture description (e.g. "mossy stone wall")' },
        resolution: { type: 'string', enum: ['256', '512', '1024'] },
        skipEnrichment: { type: 'boolean' },
      },
      required: ['description'],
    },
  },
  {
    name: 'generate_asset_pack',
    description:
      'Generate a complete themed asset pack: multiple 3D models + matching textures in parallel. Returns job IDs and texture URLs.',
    inputSchema: {
      type: 'object',
      properties: {
        theme: { type: 'string', description: 'Pack theme (e.g. "Japanese cherry blossom village")' },
        includeTextures: { type: 'boolean', description: 'Also generate matching textures' },
        modelCount: { type: 'number', description: 'Number of 3D models (1-5)' },
      },
      required: ['theme'],
    },
  },
]

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------
const server = new Server(
  { name: 'asset-alchemist', version: '1.0.0' },
  { capabilities: { tools: {} } }
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  try {
    let result: unknown

    switch (name) {
      case 'generate_3d_model': {
        const parsed = Generate3DModelSchema.parse(args)
        result = await generate3DModel(parsed)
        break
      }
      case 'generate_texture': {
        const parsed = GenerateTextureSchema.parse(args)
        result = await generateTexture(parsed)
        break
      }
      case 'generate_asset_pack': {
        const parsed = GenerateAssetPackSchema.parse(args)
        result = await generateAssetPack(parsed)
        break
      }
      default:
        throw new Error(`Unknown tool: ${name}`)
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: message }) }],
      isError: true,
    }
  }
})

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    process.stderr.write('[asset-alchemist] ERROR: ANTHROPIC_API_KEY not set\n')
    process.exit(1)
  }

  const transport = new StdioServerTransport()
  await server.connect(transport)
  process.stderr.write('[asset-alchemist] MCP server running on stdio\n')
}

main().catch((err) => {
  process.stderr.write(`[asset-alchemist] Fatal: ${err.message}\n`)
  process.exit(1)
})
