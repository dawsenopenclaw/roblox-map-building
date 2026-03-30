/**
 * POST /api/ai/texture
 *
 * Generates seamless tileable PBR textures from a text description via Fal AI.
 * Uses the Fal queue endpoint with proper polling for async generation.
 *
 * Body:
 *   { prompt: string; resolution?: "512"|"1024"|"2048"; seamless?: boolean }
 *
 * Returns:
 *   {
 *     textureUrl: string | null        -- albedo / diffuse map
 *     normalUrl: string | null         -- normal map
 *     roughnessUrl: string | null      -- roughness map
 *     resolution: string
 *     costEstimateUsd: number
 *     status: "complete"|"demo"
 *     luauCode: string                 -- SurfaceAppearance Luau snippet
 *   }
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { requireTier } from '@/lib/tier-guard'
import { textureGenerateSchema, parseBody } from '@/lib/validations'

type Resolution = '512' | '1024' | '2048'

// ── Fal types ─────────────────────────────────────────────────────────────────

interface FalQueueResponse {
  request_id: string
}

interface FalStatusResponse {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
}

interface FalTextureOutput {
  albedo?: { url: string }
  normal?: { url: string }
  roughness?: { url: string }
  metallic?: { url: string }
  images?: Array<{ url: string; width: number; height: number }>
}

interface FalImageOutput {
  images?: Array<{ url: string; width: number; height: number }>
}

// ── Fal model config ──────────────────────────────────────────────────────────

// Try the texture-specific endpoint first; fall back to flux-pro with tileable prompt
const FAL_TEXTURE_MODEL = 'fal-ai/fast-sdxl/texture'
const FAL_FLUX_MODEL = 'fal-ai/flux-pro'
const FAL_QUEUE_BASE = 'https://queue.fal.run'

// ── Cost estimate ─────────────────────────────────────────────────────────────
const COST_TEXTURE_PBR = 0.08   // Fal PBR texture set
const COST_TEXTURE_IMAGE = 0.055 // Fal Flux Pro fallback

// ── Helpers ───────────────────────────────────────────────────────────────────

async function falQueueSubmit(
  model: string,
  input: Record<string, unknown>,
  apiKey: string,
): Promise<string> {
  const res = await fetch(`${FAL_QUEUE_BASE}/${model}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Key ${apiKey}` },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Fal queue submit failed (${res.status}): ${err}`)
  }
  const data = (await res.json()) as FalQueueResponse
  return data.request_id
}

async function falQueuePoll<T>(
  model: string,
  requestId: string,
  apiKey: string,
  maxAttempts = 20,
  intervalMs = 3_000,
): Promise<T> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, i === 0 ? 2_000 : intervalMs))

    const statusRes = await fetch(`${FAL_QUEUE_BASE}/${model}/requests/${requestId}/status`, {
      headers: { Authorization: `Key ${apiKey}` },
      signal: AbortSignal.timeout(8_000),
    })
    if (!statusRes.ok) continue

    const status = (await statusRes.json()) as FalStatusResponse

    if (status.status === 'COMPLETED') {
      const resultRes = await fetch(`${FAL_QUEUE_BASE}/${model}/requests/${requestId}`, {
        headers: { Authorization: `Key ${apiKey}` },
        signal: AbortSignal.timeout(10_000),
      })
      if (!resultRes.ok) throw new Error('Fal result fetch failed')
      return (await resultRes.json()) as T
    }

    if (status.status === 'FAILED') {
      throw new Error(`Fal job ${requestId} failed`)
    }
  }

  throw new Error('Fal texture generation timed out')
}

// ── Luau generator ────────────────────────────────────────────────────────────

function generateSurfaceAppearanceLuau(params: {
  prompt: string
  albedoUrl: string | null
  normalUrl: string | null
  roughnessUrl: string | null
}): string {
  const { prompt, albedoUrl, normalUrl, roughnessUrl } = params
  return `--[[
  Generated PBR Texture: ${prompt}

  SETUP:
  1. Download the texture URLs below and upload each to Roblox (Asset Manager)
  2. Replace the rbxassetid:// placeholders with your uploaded asset IDs
  3. Paste this SurfaceAppearance inside any BasePart (Part, MeshPart, etc.)

  Albedo URL:    ${albedoUrl ?? 'not generated'}
  Normal URL:    ${normalUrl ?? 'not generated'}
  Roughness URL: ${roughnessUrl ?? 'not generated'}
--]]

-- Apply to a specific part (change "yourPart" to your variable name)
local function applyTexture(part: BasePart)
  -- Remove any existing SurfaceAppearance
  local existing = part:FindFirstChildOfClass("SurfaceAppearance")
  if existing then existing:Destroy() end

  local sa = Instance.new("SurfaceAppearance")
  sa.Name = "ForjeAI_Texture"

  ${albedoUrl ? `sa.ColorMap = "rbxassetid://UPLOAD_ALBEDO_ASSET_ID"   -- ${albedoUrl}` : '-- sa.ColorMap = "rbxassetid://..."  -- upload albedo first'}
  ${normalUrl ? `sa.NormalMap = "rbxassetid://UPLOAD_NORMAL_ASSET_ID"  -- ${normalUrl}` : '-- sa.NormalMap = "rbxassetid://..."'}
  ${roughnessUrl ? `sa.RoughnessMap = "rbxassetid://UPLOAD_ROUGHNESS_ASSET_ID"  -- ${roughnessUrl}` : '-- sa.RoughnessMap = "rbxassetid://..."'}
  sa.MetalnessMap = ""  -- add metallic map if available
  sa.TextureSynthesisEnabled = true  -- enables tiling
  sa.Parent = part
end

-- Example usage:
-- applyTexture(workspace.MyPart)
`
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (process.env.DEMO_MODE !== 'true') {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const tierDenied = await requireTier(userId, 'HOBBY')
    if (tierDenied) return tierDenied
  }

  // Parse + validate body
  const parsed = await parseBody(req, textureGenerateSchema)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  }

  const prompt = parsed.data.prompt.trim()
  const resolution: Resolution = parsed.data.resolution ?? '1024'
  const seamless = parsed.data.seamless ?? true

  const apiKey = process.env.FAL_KEY ?? process.env.FAL_API_KEY

  // Demo mode
  if (!apiKey) {
    return NextResponse.json({
      textureUrl: null,
      normalUrl: null,
      roughnessUrl: null,
      resolution,
      costEstimateUsd: 0,
      status: 'demo',
      luauCode: generateSurfaceAppearanceLuau({ prompt, albedoUrl: null, normalUrl: null, roughnessUrl: null }),
      message: 'Set FAL_KEY to generate real PBR textures via Fal AI',
    })
  }

  const seamlessSuffix = seamless ? ', seamless tileable, repeating pattern, no visible edges' : ''
  const enrichedPrompt = `${prompt}${seamlessSuffix}, high detail game asset texture, PBR material`
  const size = parseInt(resolution, 10)

  // Try PBR texture model first
  try {
    const requestId = await falQueueSubmit(
      FAL_TEXTURE_MODEL,
      { prompt: enrichedPrompt, resolution: size, output_format: 'png' },
      apiKey,
    )

    const output = await falQueuePoll<FalTextureOutput>(FAL_TEXTURE_MODEL, requestId, apiKey)

    const albedoUrl = output.albedo?.url ?? output.images?.[0]?.url ?? null
    const normalUrl = output.normal?.url ?? output.images?.[1]?.url ?? null
    const roughnessUrl = output.roughness?.url ?? output.images?.[2]?.url ?? null

    return NextResponse.json({
      textureUrl: albedoUrl,
      normalUrl,
      roughnessUrl,
      resolution,
      costEstimateUsd: COST_TEXTURE_PBR,
      status: 'complete',
      luauCode: generateSurfaceAppearanceLuau({ prompt, albedoUrl, normalUrl, roughnessUrl }),
    })
  } catch {
    // PBR model failed — fall back to Flux Pro for just the albedo texture
    try {
      const requestId = await falQueueSubmit(
        FAL_FLUX_MODEL,
        {
          prompt: enrichedPrompt,
          image_size: { width: size, height: size },
          num_inference_steps: 28,
          guidance_scale: 3.5,
          num_images: 1,
          enable_safety_checker: true,
        },
        apiKey,
      )

      const output = await falQueuePoll<FalImageOutput>(FAL_FLUX_MODEL, requestId, apiKey)
      const albedoUrl = output.images?.[0]?.url ?? null

      return NextResponse.json({
        textureUrl: albedoUrl,
        normalUrl: null,
        roughnessUrl: null,
        resolution,
        costEstimateUsd: COST_TEXTURE_IMAGE,
        status: 'complete',
        luauCode: generateSurfaceAppearanceLuau({ prompt, albedoUrl, normalUrl: null, roughnessUrl: null }),
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      return NextResponse.json({ error: 'Texture generation failed', detail: message }, { status: 502 })
    }
  }
}
