/**
 * POST /api/ai/mesh
 *
 * Generates a real 3D mesh from a text prompt using Meshy AI,
 * with matching PBR textures from Fal AI in parallel.
 *
 * Body:
 *   { prompt: string; quality?: "draft"|"standard"|"premium"; withTextures?: boolean }
 *
 * Returns:
 *   {
 *     meshUrl: string | null        -- GLB download URL
 *     fbxUrl: string | null         -- FBX download URL
 *     thumbnailUrl: string | null
 *     videoUrl: string | null
 *     polygonCount: number | null
 *     textures: { albedo, normal, roughness } | null
 *     luauCode: string              -- ready-to-paste MeshPart script
 *     costEstimateUsd: number
 *     actualCostUsd: number
 *     status: "complete"|"pending"|"demo"
 *     taskId?: string
 *   }
 *
 * GET /api/ai/mesh?taskId=xxx
 *   Poll for status of an async Meshy task
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { meshGenerateSchema, parseBody } from '@/lib/validations'
import { requireTier } from '@/lib/tier-guard'
import { aiRateLimit, rateLimitHeaders } from '@/lib/rate-limit'

// ── Types ────────────────────────────────────────────────────────────────────

type Quality = 'draft' | 'standard' | 'premium'

// postBodySchema lives in @/lib/validations — see meshGenerateSchema


interface MeshyTask {
  id: string
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED'
  model_urls?: { glb?: string; fbx?: string; usdz?: string; obj?: string }
  thumbnail_url?: string
  video_url?: string
  polygon_count?: number
  vertex_count?: number
  progress?: number
}

interface FalQueueResponse {
  request_id: string
  response_url: string
  status_url: string
}

interface FalStatusResponse {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
}

interface FalTextureOutput {
  albedo?: { url: string }
  normal?: { url: string }
  roughness?: { url: string }
  images?: Array<{ url: string }>
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MESHY_BASE = 'https://api.meshy.ai'
const FAL_QUEUE_BASE = 'https://queue.fal.run'
const FAL_RESULT_BASE = 'https://queue.fal.run'

// Cost estimates in USD
const COST_MESH: Record<Quality, number> = {
  draft:    0.10,  // preview only
  standard: 0.20,  // preview + refine
  premium:  0.30,  // preview + refine + PBR
}
const COST_TEXTURE = 0.08  // Fal PBR texture set

// ── Meshy helpers ─────────────────────────────────────────────────────────────

async function createMeshyTask(
  prompt: string,
  quality: Quality,
  apiKey: string,
): Promise<string> {
  const isRefine = quality !== 'draft'
  const body: Record<string, unknown> = {
    mode: 'preview',
    prompt: `${prompt}, game asset, optimized for real-time rendering`,
    negative_prompt: 'low quality, blurry, distorted, oversized, floating parts, disconnected mesh',
    art_style: quality === 'premium' ? 'pbr' : 'realistic',
    topology: 'quad',
    target_polycount: quality === 'draft' ? 10000 : quality === 'standard' ? 20000 : 30000,
  }

  if (isRefine) {
    body.enable_pbr = quality === 'premium'
  }

  const res = await fetch(`${MESHY_BASE}/v2/text-to-3d`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Meshy task creation failed (${res.status}): ${err}`)
  }

  const data = (await res.json()) as { result: string }
  return data.result
}

async function pollMeshyTask(
  taskId: string,
  apiKey: string,
  maxAttempts = 40,
  intervalMs = 4_000,
): Promise<MeshyTask> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, i === 0 ? 3_000 : intervalMs))

    const res = await fetch(`${MESHY_BASE}/v2/text-to-3d/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) continue

    const task = (await res.json()) as MeshyTask
    if (task.status === 'SUCCEEDED') return task
    if (task.status === 'FAILED' || task.status === 'EXPIRED') {
      throw new Error(`Meshy task ${taskId} ended with status: ${task.status}`)
    }
  }

  // Exhausted polling — return as still in progress so client can poll via GET
  return { id: taskId, status: 'IN_PROGRESS' }
}

async function getMeshyTask(taskId: string, apiKey: string): Promise<MeshyTask> {
  const res = await fetch(`${MESHY_BASE}/v2/text-to-3d/${taskId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`Meshy poll failed (${res.status})`)
  return (await res.json()) as MeshyTask
}

// ── Fal texture helpers ───────────────────────────────────────────────────────

async function generateFalTextures(
  prompt: string,
  apiKey: string,
  resolution = 1024,
): Promise<{ albedo: string; normal: string; roughness: string } | null> {
  // Submit to Fal queue
  const submitRes = await fetch(`${FAL_QUEUE_BASE}/fal-ai/fast-sdxl/texture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Key ${apiKey}` },
    body: JSON.stringify({
      prompt: `${prompt}, seamless PBR texture, game asset, physically based rendering`,
      resolution,
      output_format: 'png',
    }),
    signal: AbortSignal.timeout(15_000),
  })

  if (!submitRes.ok) {
    // Texture generation is non-critical — fall back gracefully
    return null
  }

  const queue = (await submitRes.json()) as FalQueueResponse
  const requestId = queue.request_id

  // Poll for completion (max 60s for textures)
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 4_000))

    const statusRes = await fetch(`${FAL_RESULT_BASE}/fal-ai/fast-sdxl/texture/requests/${requestId}/status`, {
      headers: { Authorization: `Key ${apiKey}` },
      signal: AbortSignal.timeout(8_000),
    })

    if (!statusRes.ok) continue

    const status = (await statusRes.json()) as FalStatusResponse
    if (status.status === 'COMPLETED') {
      const resultRes = await fetch(`${FAL_RESULT_BASE}/fal-ai/fast-sdxl/texture/requests/${requestId}`, {
        headers: { Authorization: `Key ${apiKey}` },
        signal: AbortSignal.timeout(10_000),
      })
      if (!resultRes.ok) return null

      const output = (await resultRes.json()) as FalTextureOutput
      if (output.albedo && output.normal && output.roughness) {
        return {
          albedo: output.albedo.url,
          normal: output.normal.url,
          roughness: output.roughness.url,
        }
      }
      // Some Fal models return images[] instead of named maps
      if (output.images && output.images.length >= 3) {
        return {
          albedo: output.images[0].url,
          normal: output.images[1].url,
          roughness: output.images[2].url,
        }
      }
      return null
    }
    if (status.status === 'FAILED') return null
  }

  return null
}

// ── Luau code generator ───────────────────────────────────────────────────────

function generateMeshPartLuau(params: {
  prompt: string
  meshUrl: string | null
  textures: { albedo: string; normal: string; roughness: string } | null
  polygonCount: number | null
  taskId: string
}): string {
  const { prompt, meshUrl, textures, taskId } = params

  const meshLine = meshUrl
    ? `-- IMPORTANT: Upload the GLB file to Roblox and replace this MeshId\n  meshPart.MeshId = "rbxassetid://YOUR_ASSET_ID"  -- from: ${meshUrl}`
    : `-- No mesh URL yet — poll /api/ai/mesh?taskId=${taskId} then upload the GLB`

  const textureLinesAlbedo = textures?.albedo
    ? `
  -- Albedo (diffuse) texture — upload to Roblox and replace asset ID
  local surfaceAppearance = Instance.new("SurfaceAppearance")
  surfaceAppearance.ColorMapType = Enum.ColorMapType.Color
  surfaceAppearance.ColorMap = "rbxassetid://ALBEDO_ASSET_ID"   -- from: ${textures.albedo}
  surfaceAppearance.NormalMap = "rbxassetid://NORMAL_ASSET_ID"  -- from: ${textures.normal}
  surfaceAppearance.RoughnessMap = "rbxassetid://ROUGHNESS_ASSET_ID"  -- from: ${textures.roughness}
  surfaceAppearance.Parent = meshPart`
    : ''

  return `--[[
  Generated 3D Mesh: ${prompt}
  Polygon Count: ${params.polygonCount?.toLocaleString() ?? 'unknown'}
  Task ID: ${taskId}

  SETUP INSTRUCTIONS:
  1. Download the GLB file from the meshUrl returned by the API
  2. Upload it to Roblox via Studio > Asset Manager > Import 3D
  3. Copy the new asset ID and paste it into MeshId below
  4. Optionally: upload albedo/normal/roughness textures and update SurfaceAppearance
--]]

local function create_${prompt.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40)}()
  local model = Instance.new("Model")
  model.Name = "${prompt.slice(0, 50)}"
  model.Parent = workspace

  local meshPart = Instance.new("MeshPart")
  meshPart.Name = "${prompt.slice(0, 50)}"
  ${meshLine}
  meshPart.Size = Vector3.new(10, 10, 10)  -- adjust to match your asset's real dimensions
  meshPart.CFrame = CFrame.new(0, 5, 0)    -- adjust position as needed
  meshPart.Anchored = true
  meshPart.CastShadow = true
  meshPart.CollisionFidelity = Enum.CollisionFidelity.Default
  meshPart.RenderFidelity = Enum.RenderFidelity.Automatic
  meshPart.Parent = model
${textureLinesAlbedo}

  -- Set as primary part for easy manipulation
  model.PrimaryPart = meshPart

  return model
end

-- Create and place the model
local builtModel = create_${prompt.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40)}()
print("[ForjeAI] Placed:", builtModel.Name)
`
}

// ── Demo thumbnail placeholder (SVG, no external dependency) ─────────────────

const DEMO_THUMBNAIL =
  'data:image/svg+xml;base64,' +
  Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128">' +
    '<rect width="128" height="128" fill="#1a1a2e"/>' +
    '<polygon points="64,20 100,90 28,90" fill="none" stroke="#D4AF37" stroke-width="3"/>' +
    '<text x="64" y="112" text-anchor="middle" fill="#D4AF37" font-size="10" font-family="sans-serif">3D DEMO</text>' +
    '</svg>',
  ).toString('base64')

// ── Demo response ─────────────────────────────────────────────────────────────

function demoResponse(prompt: string) {
  return NextResponse.json({
    meshUrl: null,
    fbxUrl: null,
    thumbnailUrl: DEMO_THUMBNAIL,
    videoUrl: null,
    polygonCount: null,
    textures: null,
    luauCode: generateMeshPartLuau({ prompt, meshUrl: null, textures: null, polygonCount: null, taskId: 'demo-task' }),
    costEstimateUsd: 0,
    actualCostUsd: 0,
    status: 'demo',
    message: 'Set MESHY_API_KEY to generate real 3D models. Set FAL_KEY to generate textures.',
  })
}

// ── GET — poll existing task ──────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (process.env.DEMO_MODE !== 'true') {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const tierDenied = await requireTier(userId, 'HOBBY')
    if (tierDenied) return tierDenied
  }
  const taskId = req.nextUrl.searchParams.get('taskId')
  if (!taskId) {
    return NextResponse.json({ error: 'taskId query param required' }, { status: 400 })
  }

  const apiKey = process.env.MESHY_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'MESHY_API_KEY not configured' }, { status: 503 })

  try {
    const task = await getMeshyTask(taskId, apiKey)
    if (task.status !== 'SUCCEEDED') {
      return NextResponse.json({ status: 'pending', progress: task.progress ?? 0, taskId })
    }

    return NextResponse.json({
      meshUrl: task.model_urls?.glb ?? task.model_urls?.fbx ?? null,
      fbxUrl: task.model_urls?.fbx ?? null,
      thumbnailUrl: task.thumbnail_url ?? null,
      videoUrl: task.video_url ?? null,
      polygonCount: task.polygon_count ?? null,
      textures: null,
      luauCode: generateMeshPartLuau({
        prompt: `mesh_${taskId}`,
        meshUrl: task.model_urls?.glb ?? null,
        textures: null,
        polygonCount: task.polygon_count ?? null,
        taskId,
      }),
      status: 'complete',
      taskId,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: 'Poll failed', detail: message }, { status: 502 })
  }
}

// ── POST — generate new mesh ──────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (process.env.DEMO_MODE !== 'true') {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const tierDenied = await requireTier(userId, 'HOBBY')
    if (tierDenied) return tierDenied

    // Rate limit: 20 AI requests per minute per user
    try {
      const rl = await aiRateLimit(userId)
      if (!rl.allowed) {
        return NextResponse.json(
          { error: 'Too many requests. Please wait before generating another mesh.' },
          { status: 429, headers: rateLimitHeaders(rl) },
        )
      }
    } catch {
      // Redis unavailable — allow through rather than hard-fail
    }
  }

  // Parse + validate body
  const parsed = await parseBody(req, meshGenerateSchema)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  }

  const prompt = parsed.data.prompt.trim()
  const quality: Quality = parsed.data.quality ?? 'standard'
  const withTextures = parsed.data.withTextures ?? true

  const meshyKey = process.env.MESHY_API_KEY
  const falKey = process.env.FAL_KEY ?? process.env.FAL_API_KEY

  // Cost estimate (always returned even in demo)
  const costEstimateUsd = COST_MESH[quality] + (withTextures && falKey ? COST_TEXTURE : 0)

  // Demo mode
  if (!meshyKey) {
    return demoResponse(prompt)
  }

  let actualCostUsd = 0

  try {
    // Start Meshy task
    const taskId = await createMeshyTask(prompt, quality, meshyKey)
    actualCostUsd += COST_MESH[quality]

    // Start Fal texture generation in parallel (non-blocking)
    const texturePromise: Promise<{ albedo: string; normal: string; roughness: string } | null> =
      withTextures && falKey
        ? generateFalTextures(prompt, falKey).then((t) => { if (t) actualCostUsd += COST_TEXTURE; return t })
        : Promise.resolve(null)

    // Poll Meshy (up to ~2.5 minutes)
    const task = await pollMeshyTask(taskId, meshyKey)

    if (task.status === 'IN_PROGRESS') {
      // Still running — return taskId for client-side polling
      const textures = await texturePromise  // textures may already be ready
      return NextResponse.json({
        meshUrl: null,
        fbxUrl: null,
        thumbnailUrl: null,
        videoUrl: null,
        polygonCount: null,
        textures,
        luauCode: generateMeshPartLuau({ prompt, meshUrl: null, textures, polygonCount: null, taskId }),
        costEstimateUsd,
        actualCostUsd,
        status: 'pending',
        taskId,
        message: `3D model still generating. Poll GET /api/ai/mesh?taskId=${taskId}`,
      })
    }

    // Mesh succeeded — await textures
    const textures = await texturePromise

    const meshUrl = task.model_urls?.glb ?? task.model_urls?.fbx ?? null
    const luauCode = generateMeshPartLuau({
      prompt,
      meshUrl,
      textures,
      polygonCount: task.polygon_count ?? null,
      taskId,
    })

    return NextResponse.json({
      meshUrl,
      fbxUrl: task.model_urls?.fbx ?? null,
      thumbnailUrl: task.thumbnail_url ?? null,
      videoUrl: task.video_url ?? null,
      polygonCount: task.polygon_count ?? null,
      textures,
      luauCode,
      costEstimateUsd,
      actualCostUsd,
      status: 'complete',
      taskId,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: 'Mesh generation failed', detail: message }, { status: 502 })
  }
}
