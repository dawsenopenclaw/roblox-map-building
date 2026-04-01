/**
 * POST /api/ai/3d-generate
 *
 * Unified 3D asset generation endpoint.
 * Classifies asset type → selects agent chain → calls Meshy (mesh) + Fal (textures)
 * → generates InsertService Luau code for Roblox Studio.
 *
 * Falls back to detailed demo data when API keys are not configured.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { parseBody } from '@/lib/validations'
import { requireTier } from '@/lib/tier-guard'
import { aiRateLimit, rateLimitHeaders } from '@/lib/rate-limit'

// ── Request schema ────────────────────────────────────────────────────────────

const generate3dSchema = z.object({
  type: z.enum([
    'building', 'character', 'vehicle', 'weapon',
    'furniture', 'terrain', 'prop', 'effect', 'custom',
  ]),
  prompt: z.string().min(1, 'prompt is required').max(2000),
  style: z.enum(['realistic', 'stylized', 'lowpoly', 'roblox']).default('roblox'),
  polyTarget: z.number().int().min(500).max(50000).default(5000),
  textured: z.boolean().default(true),
  rigged: z.boolean().default(false),
  animated: z.boolean().default(false),
  exportFormat: z.enum(['fbx', 'obj', 'glb']).default('glb'),
  robloxOptimized: z.boolean().default(true),
})

type Generate3dInput = z.infer<typeof generate3dSchema>
type AssetType = Generate3dInput['type']
type AssetStyle = Generate3dInput['style']

// ── Agent chain definitions ───────────────────────────────────────────────────

const AGENT_CHAINS: Record<AssetType, string[]> = {
  building:  ['@asset-scout', '@roblox-builder', '@visual-inspector'],
  character: ['@asset-scout', '@roblox-builder', '@visual-inspector', '@performance-auditor'],
  vehicle:   ['@asset-scout', '@roblox-builder', '@visual-inspector'],
  weapon:    ['@asset-scout', '@roblox-builder'],
  furniture: ['@asset-scout', '@roblox-builder'],
  terrain:   ['@researcher', '@roblox-builder', '@visual-inspector'],
  prop:      ['@asset-scout', '@roblox-builder'],
  effect:    ['@roblox-builder', '@visual-inspector'],
  custom:    ['@researcher', '@roblox-builder', '@visual-inspector', '@code-reviewer'],
}

// ── Token cost model (ForjeGames tokens, not USD) ─────────────────────────────

const TOKEN_COSTS: Record<AssetType, number> = {
  building:  80,
  character: 120,
  vehicle:   100,
  weapon:    60,
  furniture: 50,
  terrain:   90,
  prop:      40,
  effect:    70,
  custom:    140,
}

const TEXTURE_TOKEN_COST = 30
const RIGGED_TOKEN_COST  = 50
const ANIM_TOKEN_COST    = 80

// ── Meshy API types ───────────────────────────────────────────────────────────

interface MeshyTask {
  id: string
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED'
  model_urls?: { glb?: string; fbx?: string; obj?: string }
  thumbnail_url?: string
  polygon_count?: number
  vertex_count?: number
  progress?: number
}

// ── Fal API types ─────────────────────────────────────────────────────────────

interface FalQueueResponse { request_id: string }
interface FalStatusResponse { status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' }
interface FalTextureOutput {
  albedo?:    { url: string }
  normal?:    { url: string }
  roughness?: { url: string }
  metallic?:  { url: string }
  images?:    Array<{ url: string }>
}

// ── Style → Meshy art_style mapping ──────────────────────────────────────────

function toMeshyArtStyle(style: AssetStyle): string {
  switch (style) {
    case 'realistic': return 'pbr'
    case 'stylized':  return 'cartoon'
    case 'lowpoly':   return 'low-poly'
    case 'roblox':    return 'low-poly'
  }
}

// ── Prompt enrichment per type ────────────────────────────────────────────────

function enrichPrompt(prompt: string, type: AssetType, style: AssetStyle, robloxOpt: boolean): string {
  const styleHints: Record<AssetStyle, string> = {
    realistic: 'photorealistic, physically based materials',
    stylized:  'stylized cartoon, bold colors, clean geometry',
    lowpoly:   'low poly, faceted geometry, minimal triangles',
    roblox:    'Roblox game asset, blocky proportions, family-friendly, bright colors',
  }

  const typeHints: Record<AssetType, string> = {
    building:  'architectural exterior, self-contained structure, entrance visible',
    character: 'character, upright pose, T-pose preferred for rigging',
    vehicle:   'vehicle, wheels/treads visible, cockpit or seat',
    weapon:    'hand-held weapon, ergonomic grip, game-ready scale',
    furniture: 'furniture piece, interior scale, flat base',
    terrain:   'terrain feature, organic shape, natural material',
    prop:      'game prop, standalone object, pickup-friendly scale',
    effect:    'VFX emitter base, stylized shape, glowy elements',
    custom:    '',
  }

  const robloxSuffix = robloxOpt
    ? ', optimized for Roblox import, no floating geometry, watertight mesh, proper UV unwrap'
    : ''

  return `${prompt}, ${styleHints[style]}, ${typeHints[type]}, game asset, real-time rendering${robloxSuffix}`
}

// ── Meshy helpers ─────────────────────────────────────────────────────────────

const MESHY_BASE = 'https://api.meshy.ai'

async function createMeshyTask(
  enrichedPrompt: string,
  polyTarget: number,
  artStyle: string,
  apiKey: string,
): Promise<string> {
  const res = await fetch(`${MESHY_BASE}/v2/text-to-3d`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      mode:             'preview',
      prompt:           enrichedPrompt,
      negative_prompt:  'low quality, blurry, distorted, floating parts, disconnected mesh, NSFW',
      art_style:        artStyle,
      topology:         'quad',
      target_polycount: polyTarget,
    }),
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
  maxAttempts = 35,
  intervalMs   = 4_000,
): Promise<MeshyTask> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, i === 0 ? 3_000 : intervalMs))

    const res = await fetch(`${MESHY_BASE}/v2/text-to-3d/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal:  AbortSignal.timeout(10_000),
    })
    if (!res.ok) continue

    const task = (await res.json()) as MeshyTask
    if (task.status === 'SUCCEEDED') return task
    if (task.status === 'FAILED' || task.status === 'EXPIRED') {
      throw new Error(`Meshy task ${taskId} ended with status: ${task.status}`)
    }
  }

  return { id: taskId, status: 'IN_PROGRESS' }
}

// ── Fal texture helpers ───────────────────────────────────────────────────────

const FAL_QUEUE_BASE = 'https://queue.fal.run'

async function generateFalTextures(
  prompt: string,
  apiKey: string,
): Promise<{ albedo: string | null; normal: string | null; roughness: string | null; metallic: string | null } | null> {
  try {
    const submitRes = await fetch(`${FAL_QUEUE_BASE}/fal-ai/fast-sdxl/texture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Key ${apiKey}` },
      body: JSON.stringify({
        prompt: `${prompt}, seamless PBR texture, physically based rendering, game asset, high detail`,
        resolution:    1024,
        output_format: 'png',
      }),
      signal: AbortSignal.timeout(15_000),
    })

    if (!submitRes.ok) return null

    const queue   = (await submitRes.json()) as FalQueueResponse
    const reqId   = queue.request_id

    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 4_000))

      const statusRes = await fetch(
        `${FAL_QUEUE_BASE}/fal-ai/fast-sdxl/texture/requests/${reqId}/status`,
        { headers: { Authorization: `Key ${apiKey}` }, signal: AbortSignal.timeout(8_000) },
      )
      if (!statusRes.ok) continue

      const status = (await statusRes.json()) as FalStatusResponse
      if (status.status === 'COMPLETED') {
        const resultRes = await fetch(
          `${FAL_QUEUE_BASE}/fal-ai/fast-sdxl/texture/requests/${reqId}`,
          { headers: { Authorization: `Key ${apiKey}` }, signal: AbortSignal.timeout(10_000) },
        )
        if (!resultRes.ok) return null

        const out = (await resultRes.json()) as FalTextureOutput
        return {
          albedo:    out.albedo?.url    ?? out.images?.[0]?.url ?? null,
          normal:    out.normal?.url    ?? out.images?.[1]?.url ?? null,
          roughness: out.roughness?.url ?? out.images?.[2]?.url ?? null,
          metallic:  out.metallic?.url  ?? null,
        }
      }
      if (status.status === 'FAILED') return null
    }
    return null
  } catch {
    return null
  }
}

// ── Luau code generator ───────────────────────────────────────────────────────

function generateInsertServiceLuau(params: {
  prompt:    string
  type:      AssetType
  meshUrl:   string | null
  taskId:    string
  textures:  { albedo: string | null; normal: string | null; roughness: string | null; metallic: string | null } | null
  polyCount: number | null
  dims:      { x: number; y: number; z: number }
}): string {
  const { prompt, type, meshUrl, taskId, textures, polyCount, dims } = params

  const safeName = prompt.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 40)

  const meshInstruction = meshUrl
    ? `-- STEP 1: Download the GLB → Studio > Asset Manager > Import 3D\n-- STEP 2: Copy the new Asset ID and paste it below\nmeshPart.MeshId = "rbxassetid://YOUR_ASSET_ID_HERE"  -- source: ${meshUrl}`
    : `-- Mesh still generating. Poll GET /api/ai/mesh?taskId=${taskId}\nmeshPart.MeshId = "rbxassetid://YOUR_ASSET_ID_HERE"`

  const textureBlock = textures?.albedo
    ? `
  -- PBR Surface Appearance
  -- Upload each texture URL to Roblox then replace the asset IDs below
  local sa = Instance.new("SurfaceAppearance")
  sa.ColorMap     = "rbxassetid://ALBEDO_ASSET_ID"    -- ${textures.albedo}
  ${textures.normal    ? `sa.NormalMap    = "rbxassetid://NORMAL_ASSET_ID"     -- ${textures.normal}` : '-- sa.NormalMap  = "" -- not generated'}
  ${textures.roughness ? `sa.RoughnessMap = "rbxassetid://ROUGHNESS_ASSET_ID"  -- ${textures.roughness}` : '-- sa.RoughnessMap = "" -- not generated'}
  ${textures.metallic  ? `sa.MetalnessMap = "rbxassetid://METALLIC_ASSET_ID"   -- ${textures.metallic}` : '-- sa.MetalnessMap = "" -- not generated'}
  sa.Parent = meshPart`
    : ''

  const anchorLine = ['terrain', 'building', 'furniture', 'prop'].includes(type)
    ? 'meshPart.Anchored = true'
    : 'meshPart.Anchored = false  -- vehicle/character/weapon — anchor manually if needed'

  return `--[[
  ForjeAI 3D Asset: ${prompt}
  Type:         ${type}
  Poly count:   ${polyCount?.toLocaleString() ?? 'pending'}
  Dimensions:   ${dims.x}w x ${dims.y}h x ${dims.z}d studs
  Task ID:      ${taskId}
  Generated:    ${new Date().toISOString()}

  SETUP INSTRUCTIONS:
  1. Download the .glb file from the meshUrl in the API response
  2. Import via Roblox Studio > Asset Manager > Bulk Import > 3D Model
  3. Copy the uploaded asset ID and replace YOUR_ASSET_ID_HERE below
  4. If textures were generated, upload each PNG and replace ASSET_ID placeholders
  5. Parent the returned model to workspace or a folder
--]]

local function create_${safeName}()
  local model    = Instance.new("Model")
  model.Name     = "${prompt.slice(0, 50)}"
  model.Parent   = workspace

  local meshPart = Instance.new("MeshPart")
  meshPart.Name  = "${prompt.slice(0, 50)}"
  ${meshInstruction}
  meshPart.Size  = Vector3.new(${dims.x}, ${dims.y}, ${dims.z})
  meshPart.CFrame = CFrame.new(0, ${dims.y / 2}, 0)
  ${anchorLine}
  meshPart.CastShadow       = true
  meshPart.CollisionFidelity = Enum.CollisionFidelity.Default
  meshPart.RenderFidelity    = Enum.RenderFidelity.Automatic
  meshPart.Parent            = model
${textureBlock}

  model.PrimaryPart = meshPart
  return model
end

-- Usage
local asset = create_${safeName}()
print("[ForjeAI] Placed:", asset.Name, "at", asset.PrimaryPart and asset.PrimaryPart.Position or "N/A")
`
}

// ── Dimension estimator by asset type ────────────────────────────────────────

function estimateDimensions(type: AssetType): { x: number; y: number; z: number } {
  const dims: Record<AssetType, { x: number; y: number; z: number }> = {
    building:  { x: 30, y: 25, z: 30 },
    character: { x: 4,  y: 6,  z: 4  },
    vehicle:   { x: 16, y: 8,  z: 28 },
    weapon:    { x: 2,  y: 8,  z: 1  },
    furniture: { x: 8,  y: 5,  z: 6  },
    terrain:   { x: 40, y: 10, z: 40 },
    prop:      { x: 5,  y: 5,  z: 5  },
    effect:    { x: 8,  y: 8,  z: 8  },
    custom:    { x: 10, y: 10, z: 10 },
  }
  return dims[type]
}

function estimateFileSize(polyTarget: number, textured: boolean): string {
  const baseMb = (polyTarget / 1000) * 0.12
  const texMb  = textured ? 3.5 : 0
  const total  = baseMb + texMb
  return total < 1 ? `${Math.round(total * 1024)} KB` : `${total.toFixed(1)} MB`
}

// ── Demo thumbnail placeholder (SVG, no external dependency) ─────────────────

const DEMO_THUMBNAIL_3D =
  'data:image/svg+xml;base64,' +
  Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128">' +
    '<rect width="128" height="128" fill="#1a1a2e"/>' +
    '<polygon points="64,20 100,90 28,90" fill="none" stroke="#D4AF37" stroke-width="3"/>' +
    '<text x="64" y="112" text-anchor="middle" fill="#D4AF37" font-size="10" font-family="sans-serif">3D DEMO</text>' +
    '</svg>',
  ).toString('base64')

// ── Demo response ─────────────────────────────────────────────────────────────

function buildDemoResponse(input: Generate3dInput) {
  const dims     = estimateDimensions(input.type)
  const taskId   = `demo-${input.type}-${Date.now()}`
  const baseCost = TOKEN_COSTS[input.type]
  const totalCost = baseCost
    + (input.textured  ? TEXTURE_TOKEN_COST : 0)
    + (input.rigged    ? RIGGED_TOKEN_COST  : 0)
    + (input.animated  ? ANIM_TOKEN_COST    : 0)

  return NextResponse.json({
    status: 'demo',
    asset: {
      meshUrl:      null,
      textureUrls: { albedo: null, normal: null, roughness: null, metallic: null },
      thumbnailUrl: DEMO_THUMBNAIL_3D,
      polyCount:    input.polyTarget,
      fileSize:     estimateFileSize(input.polyTarget, input.textured),
      dimensions:   dims,
    },
    luauCode:      generateInsertServiceLuau({
      prompt:    input.prompt,
      type:      input.type,
      meshUrl:   null,
      taskId,
      textures:  null,
      polyCount: input.polyTarget,
      dims,
    }),
    agentChain:    AGENT_CHAINS[input.type],
    tokensCost:    totalCost,
    estimatedTime: estimateTime(input),
    taskId,
    message: 'Set MESHY_API_KEY to generate real 3D models. Set FAL_KEY for PBR textures.',
  })
}

function estimateTime(input: Generate3dInput): string {
  let seconds = 45
  if (input.polyTarget > 20000)  seconds += 30
  if (input.textured)            seconds += 25
  if (input.rigged)              seconds += 45
  if (input.animated)            seconds += 90
  if (input.type === 'character') seconds += 30
  if (seconds < 60)  return `~${seconds}s`
  if (seconds < 120) return `~${Math.round(seconds / 60)} min`
  return `~${Math.ceil(seconds / 60)} min`
}

// ── POST handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (process.env.DEMO_MODE !== 'true') {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const tierDenied = await requireTier(userId, 'HOBBY')
    if (tierDenied) return tierDenied

    try {
      const rl = await aiRateLimit(userId)
      if (!rl.allowed) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please wait before generating another asset.' },
          { status: 429, headers: rateLimitHeaders(rl) },
        )
      }
    } catch {
      // Redis unavailable — allow through
    }
  }

  const parsed = await parseBody(req, generate3dSchema)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  }

  const input    = parsed.data
  const meshyKey = process.env.MESHY_API_KEY
  const falKey   = process.env.FAL_KEY ?? process.env.FAL_API_KEY

  // Demo mode — no API keys
  if (!meshyKey) {
    return buildDemoResponse(input)
  }

  const dims           = estimateDimensions(input.type)
  const enrichedPrompt = enrichPrompt(input.prompt, input.type, input.style, input.robloxOptimized)
  const artStyle       = toMeshyArtStyle(input.style)
  const agentChain     = AGENT_CHAINS[input.type]

  const baseCost  = TOKEN_COSTS[input.type]
  const totalCost = baseCost
    + (input.textured ? TEXTURE_TOKEN_COST : 0)
    + (input.rigged   ? RIGGED_TOKEN_COST  : 0)
    + (input.animated ? ANIM_TOKEN_COST    : 0)

  try {
    // Start Meshy task
    const taskId = await createMeshyTask(enrichedPrompt, input.polyTarget, artStyle, meshyKey)

    // Start Fal textures in parallel (non-blocking)
    const texturePromise = input.textured && falKey
      ? generateFalTextures(enrichedPrompt, falKey)
      : Promise.resolve(null)

    // Poll Meshy
    const task = await pollMeshyTask(taskId, meshyKey)

    if (task.status === 'IN_PROGRESS') {
      const textures = await texturePromise
      const luauCode = generateInsertServiceLuau({
        prompt:    input.prompt,
        type:      input.type,
        meshUrl:   null,
        taskId,
        textures,
        polyCount: input.polyTarget,
        dims,
      })

      return NextResponse.json({
        status: 'pending',
        taskId,
        asset: {
          meshUrl:      null,
          textureUrls:  textures ?? { albedo: null, normal: null, roughness: null, metallic: null },
          thumbnailUrl: null,
          polyCount:    input.polyTarget,
          fileSize:     estimateFileSize(input.polyTarget, input.textured),
          dimensions:   dims,
        },
        luauCode,
        agentChain,
        tokensCost:    totalCost,
        estimatedTime: estimateTime(input),
        message: `3D model still generating. Poll GET /api/ai/mesh?taskId=${taskId}`,
      })
    }

    // Mesh complete
    const textures   = await texturePromise
    const meshUrl    = task.model_urls?.glb ?? task.model_urls?.fbx ?? task.model_urls?.obj ?? null
    const polyCount  = task.polygon_count ?? input.polyTarget

    const luauCode = generateInsertServiceLuau({
      prompt:    input.prompt,
      type:      input.type,
      meshUrl,
      taskId,
      textures,
      polyCount,
      dims,
    })

    return NextResponse.json({
      status: 'complete',
      taskId,
      asset: {
        meshUrl,
        textureUrls: textures ?? { albedo: null, normal: null, roughness: null, metallic: null },
        thumbnailUrl: task.thumbnail_url ?? null,
        polyCount,
        fileSize:     estimateFileSize(polyCount, input.textured),
        dimensions:   dims,
      },
      luauCode,
      agentChain,
      tokensCost:    totalCost,
      estimatedTime: estimateTime(input),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: '3D generation failed', detail: message }, { status: 502 })
  }
}
