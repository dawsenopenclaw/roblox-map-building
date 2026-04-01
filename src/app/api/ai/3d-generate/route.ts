/**
 * POST /api/ai/3d-generate
 *
 * Unified 3D asset generation endpoint.
 * Classifies asset type → selects agent chain → enqueues async pipeline job.
 * Returns immediately with { status: 'queued', jobId, assetId }.
 *
 * Client polls GET /api/ai/generation-status?assetId=xxx for progress.
 *
 * Falls back to detailed demo data when API keys are not configured.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { parseBody } from '@/lib/validations'
import { requireTier } from '@/lib/tier-guard'
import { aiRateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import { startMeshPipeline } from '@/lib/pipeline/mesh-pipeline'

// ── Request schema ────────────────────────────────────────────────────────────

const generate3dSchema = z.object({
  type: z.enum([
    'building', 'character', 'vehicle', 'weapon',
    'furniture', 'terrain', 'prop', 'effect', 'custom',
  ]),
  prompt:          z.string().min(1, 'prompt is required').max(2000),
  style:           z.enum(['realistic', 'stylized', 'lowpoly', 'roblox']).default('roblox'),
  polyTarget:      z.number().int().min(500).max(50000).default(5000),
  textured:        z.boolean().default(true),
  rigged:          z.boolean().default(false),
  animated:        z.boolean().default(false),
  exportFormat:    z.enum(['fbx', 'obj', 'glb']).default('glb'),
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

// ── Dimension estimator ───────────────────────────────────────────────────────

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

// ── Luau code generator ───────────────────────────────────────────────────────

function generateInsertServiceLuau(params: {
  prompt:    string
  type:      AssetType
  taskId:    string
  polyCount: number | null
  dims:      { x: number; y: number; z: number }
}): string {
  const { prompt, type, taskId, polyCount, dims } = params
  const safeName = prompt.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 40)
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

  SETUP: Poll GET /api/ai/generation-status?assetId=ASSET_ID until status === "ready"
  The rbxAssetUrl will contain the rbxassetid:// once uploaded.
--]]

local function create_${safeName}()
  local model    = Instance.new("Model")
  model.Name     = "${prompt.slice(0, 50)}"
  model.Parent   = workspace

  local meshPart = Instance.new("MeshPart")
  meshPart.Name  = "${prompt.slice(0, 50)}"
  meshPart.MeshId = "rbxassetid://YOUR_ASSET_ID_HERE"  -- replace after upload completes
  meshPart.Size  = Vector3.new(${dims.x}, ${dims.y}, ${dims.z})
  meshPart.CFrame = CFrame.new(0, ${dims.y / 2}, 0)
  ${anchorLine}
  meshPart.CastShadow       = true
  meshPart.CollisionFidelity = Enum.CollisionFidelity.Default
  meshPart.RenderFidelity    = Enum.RenderFidelity.Automatic
  meshPart.Parent            = model

  model.PrimaryPart = meshPart
  return model
end

local asset = create_${safeName}()
print("[ForjeAI] Placed:", asset.Name)
`
}

// ── Demo response ─────────────────────────────────────────────────────────────

function buildDemoResponse(input: Generate3dInput) {
  const dims      = estimateDimensions(input.type)
  const taskId    = `demo-${input.type}-${Date.now()}`
  const totalCost = TOKEN_COSTS[input.type]
    + (input.textured  ? TEXTURE_TOKEN_COST : 0)
    + (input.rigged    ? RIGGED_TOKEN_COST  : 0)
    + (input.animated  ? ANIM_TOKEN_COST    : 0)

  return NextResponse.json({
    status: 'demo',
    assetId: null,
    jobId:   null,
    asset: {
      meshUrl:      null,
      textureUrls:  { albedo: null, normal: null, roughness: null, metallic: null },
      thumbnailUrl: DEMO_THUMBNAIL_3D,
      polyCount:    input.polyTarget,
      fileSize:     estimateFileSize(input.polyTarget, input.textured),
      dimensions:   dims,
    },
    luauCode:      generateInsertServiceLuau({
      prompt:    input.prompt,
      type:      input.type,
      taskId,
      polyCount: input.polyTarget,
      dims,
    }),
    agentChain:    AGENT_CHAINS[input.type],
    tokensCost:    totalCost,
    estimatedTime: estimateTime(input),
    message: 'Set MESHY_API_KEY to generate real 3D models. Set FAL_KEY for PBR textures.',
  })
}

// ── POST handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  let userId: string | null = null

  if (process.env.DEMO_MODE !== 'true') {
    const session = await auth()
    userId = session.userId

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

  const input = parsed.data

  // Demo mode — no API keys or user session
  if (!process.env.MESHY_API_KEY || !userId) {
    return buildDemoResponse(input)
  }

  const dims      = estimateDimensions(input.type)
  const totalCost = TOKEN_COSTS[input.type]
    + (input.textured ? TEXTURE_TOKEN_COST : 0)
    + (input.rigged   ? RIGGED_TOKEN_COST  : 0)
    + (input.animated ? ANIM_TOKEN_COST    : 0)

  try {
    // Enqueue async pipeline — returns immediately
    const { assetId, jobId } = await startMeshPipeline({
      userId,
      prompt:     input.prompt,
      type:       input.type,
      style:      input.style,
      polyTarget: input.polyTarget,
      textured:   input.textured,
      tokensCost: totalCost,
    })

    // Return queued status — client polls /api/ai/generation-status?assetId=xxx
    return NextResponse.json({
      status:   'queued',
      assetId,
      jobId,
      asset: {
        meshUrl:      null,
        textureUrls:  { albedo: null, normal: null, roughness: null, metallic: null },
        thumbnailUrl: null,
        polyCount:    input.polyTarget,
        fileSize:     estimateFileSize(input.polyTarget, input.textured),
        dimensions:   dims,
      },
      luauCode: generateInsertServiceLuau({
        prompt:    input.prompt,
        type:      input.type,
        taskId:    assetId,
        polyCount: input.polyTarget,
        dims,
      }),
      agentChain:    AGENT_CHAINS[input.type],
      tokensCost:    totalCost,
      estimatedTime: estimateTime(input),
      message: `Generation queued. Poll GET /api/ai/generation-status?assetId=${assetId}`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: '3D generation failed to queue', detail: message }, { status: 502 })
  }
}
