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
import {
  downloadAndUpload,
  downloadAndUploadTexture,
  type UploadAssetResult,
} from '@/lib/roblox-asset-upload'

// ── Types ────────────────────────────────────────────────────────────────────

type Quality = 'draft' | 'standard' | 'premium'

type AssetCategory =
  | 'character'
  | 'building'
  | 'weapon'
  | 'vehicle'
  | 'prop'
  | 'furniture'
  | 'environment'
  | 'default'

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

// Cost estimates in USD
const COST_MESH: Record<Quality, number> = {
  draft:    0.10,  // preview only
  standard: 0.20,  // preview + refine
  premium:  0.30,  // preview + refine + PBR
}
const COST_TEXTURE = 0.08  // Fal PBR texture set

// Professional quality-specific polygon targets — tuned for Roblox
const POLY_TARGETS: Record<Quality, number> = {
  draft:    3000,   // fast preview
  standard: 8000,   // good for Roblox real-time
  premium:  15000,  // high detail, LOD-friendly
}

// ── Category detection ────────────────────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<AssetCategory, string[]> = {
  character: [
    'character', 'person', 'human', 'player', 'npc', 'hero', 'villain',
    'warrior', 'soldier', 'knight', 'mage', 'wizard', 'zombie', 'monster',
    'creature', 'alien', 'robot', 'avatar', 'humanoid', 'figure', 'man',
    'woman', 'child', 'guard', 'boss',
  ],
  building: [
    'building', 'house', 'castle', 'tower', 'shop', 'store', 'skyscraper',
    'warehouse', 'barn', 'church', 'temple', 'palace', 'mansion', 'cottage',
    'hut', 'fort', 'fortress', 'dungeon', 'structure', 'architecture',
    'office', 'hospital', 'school', 'library', 'museum',
  ],
  weapon: [
    'weapon', 'sword', 'gun', 'rifle', 'pistol', 'shotgun', 'bow', 'arrow',
    'axe', 'spear', 'staff', 'wand', 'dagger', 'knife', 'hammer', 'mace',
    'crossbow', 'shield', 'cannon', 'blade', 'katana', 'scythe',
  ],
  vehicle: [
    'vehicle', 'car', 'truck', 'bus', 'bike', 'motorcycle', 'plane',
    'airplane', 'helicopter', 'boat', 'ship', 'submarine', 'tank', 'spaceship',
    'rocket', 'train', 'tram', 'ufo', 'drone', 'jeep', 'van', 'ambulance',
  ],
  furniture: [
    'furniture', 'chair', 'table', 'sofa', 'couch', 'desk', 'bed', 'shelf',
    'bookcase', 'cabinet', 'wardrobe', 'dresser', 'stool', 'lamp',
    'bookshelf', 'nightstand', 'ottoman', 'throne',
  ],
  environment: [
    'environment', 'terrain', 'rock', 'tree', 'cliff', 'mountain', 'island',
    'cave', 'ruins', 'bridge', 'path', 'road', 'ground', 'tile', 'platform',
    'pillar', 'column', 'wall', 'floor', 'landscape', 'nature', 'forest',
    'plant', 'bush', 'mushroom', 'crystal', 'gem',
  ],
  prop: [
    'barrel', 'crate', 'box', 'sign', 'lantern', 'torch', 'candle', 'flag',
    'banner', 'trophy', 'clock', 'vase', 'bottle', 'key', 'chest', 'basket',
    'bucket', 'pot', 'cauldron', 'anvil', 'wheel', 'rope', 'chain', 'ladder',
    'fence', 'gate', 'trapdoor', 'lever', 'button', 'orb', 'potion', 'scroll',
    'book', 'map', 'compass', 'telescope', 'crown', 'ring', 'amulet', 'mask',
    'food', 'pizza', 'burger', 'cake', 'fruit', 'bread', 'fish', 'meat',
    'cup', 'plate', 'bowl', 'mug', 'glass', 'goblet', 'pan', 'frying',
    'fire hydrant', 'mailbox', 'trash', 'garbage', 'dumpster', 'hydrant',
    'parking meter', 'bollard', 'cone', 'barrier', 'newspaper', 'phone booth',
    'vending machine', 'atm', 'speaker', 'microphone', 'camera', 'satellite',
    'computer', 'monitor', 'keyboard', 'phone', 'tv', 'television', 'radio',
    'arcade', 'piano', 'guitar', 'drum', 'instrument', 'tool', 'shovel',
    'pickaxe', 'wrench', 'screwdriver', 'toolbox', 'paint', 'easel',
    'tent', 'campfire', 'sleeping bag', 'backpack', 'suitcase', 'bag',
    'flower', 'pot plant', 'potted', 'decoration', 'ornament', 'statue',
    'fountain', 'well', 'lamp post', 'street light', 'traffic light',
    'bench', 'swing', 'slide', 'seesaw', 'trampoline', 'playground',
  ],
  default: [], // fallback
}

function detectAssetCategory(prompt: string): AssetCategory {
  const lower = prompt.toLowerCase()

  // Check high-specificity categories first (character, building, weapon, vehicle,
  // furniture, environment) before the broad 'prop' catch-all.
  const PRIORITY_ORDER: AssetCategory[] = [
    'character', 'building', 'weapon', 'vehicle', 'furniture', 'environment', 'prop',
  ]

  for (const category of PRIORITY_ORDER) {
    const keywords = CATEGORY_KEYWORDS[category]
    if (keywords.length > 0 && keywords.some((kw) => lower.includes(kw))) {
      return category
    }
  }

  return 'prop'
}

// ── Prompt templates ──────────────────────────────────────────────────────────

const PROMPT_TEMPLATES: Record<AssetCategory, string> = {
  character:
    '{prompt}, 3D character model, clean topology, T-pose ready for rigging, quad-dominant mesh, uniform UVs, game-ready, Roblox proportions, PBR textures, 4K detail',
  building:
    '{prompt}, 3D architectural model, clean geometry, proper UV unwrap, modular design, real-world scale, PBR materials, game-optimized LOD-friendly mesh',
  weapon:
    '{prompt}, 3D weapon model, hard-surface modeling, beveled edges, clean normals, centered pivot, proper UV islands, metallic PBR, game-ready topology',
  vehicle:
    '{prompt}, 3D vehicle model, clean hard-surface, proper wheel pivots, separated body panels, aerodynamic form, PBR car paint material, game-ready',
  prop:
    '{prompt}, 3D game prop, clean mesh, optimized triangle count, proper UV mapping, PBR textures, suitable for real-time rendering, Roblox compatible',
  furniture:
    '{prompt}, 3D furniture model, clean geometry, real-world proportions, wood/fabric PBR materials, game-ready mesh, optimized for Roblox',
  environment:
    '{prompt}, 3D environment piece, tileable edges where applicable, clean LOD mesh, PBR terrain materials, optimized for streaming',
  default:
    '{prompt}, high quality 3D model, clean topology, proper UV unwrap, PBR materials, game-ready, optimized for real-time rendering, Roblox compatible',
}

// Truncated to fit Meshy's 200-char negative_prompt limit
const NEGATIVE_PROMPT =
  'low quality, blurry, distorted, floating parts, disconnected mesh, overlapping faces, non-manifold geometry, inverted normals, stretched UVs, NSFW, watermark, text, deformed, ugly'

// Style detection from user prompt
const STYLE_MODIFIERS: Record<string, string> = {
  'low poly':    ', flat shading, low polygon count, minimal vertices, stylized game asset',
  'lowpoly':     ', flat shading, low polygon count, minimal vertices, stylized game asset',
  'cartoon':     ', cartoon style, bright colors, exaggerated proportions, cel shading',
  'realistic':   ', photorealistic, high detail, accurate proportions, natural materials',
  'medieval':    ', medieval style, aged materials, stone and wood, fantasy setting',
  'modern':      ', modern style, clean lines, contemporary design, minimalist',
  'futuristic':  ', sci-fi futuristic, sleek design, glowing elements, high-tech materials',
  'cyberpunk':   ', cyberpunk style, neon lights, dark urban, chrome and holographic',
  'fantasy':     ', fantasy style, magical elements, ornate details, enchanted materials',
  'pirate':      ', pirate theme, weathered wood, rope, barnacles, nautical',
  'japanese':    ', Japanese style, minimalist, bamboo, paper screens, zen aesthetic',
  'steampunk':   ', steampunk style, gears, brass, copper pipes, Victorian industrial',
  'horror':      ', horror style, dark, decayed, eerie, unsettling, cobwebs',
  'cute':        ', cute kawaii style, rounded shapes, pastel colors, chibi proportions',
  'voxel':       ', voxel art style, cubic shapes, pixel art 3D, blocky retro',
  'stylized':    ', stylized art, hand-painted look, clean silhouette, game-ready',
}

// Meshy v2 enforces a 500-char limit on the prompt field and a 200-char limit
// on negative_prompt. Exceeding either causes a 422 validation error from the API.
const MESHY_PROMPT_MAX_CHARS     = 500
const MESHY_NEG_PROMPT_MAX_CHARS = 200

function buildMeshyPrompt(rawPrompt: string, category: AssetCategory): string {
  const template = PROMPT_TEMPLATES[category] ?? PROMPT_TEMPLATES.default
  let result = template.replace('{prompt}', rawPrompt)

  // Detect and append style modifier
  const lower = rawPrompt.toLowerCase()
  for (const [key, modifier] of Object.entries(STYLE_MODIFIERS)) {
    if (lower.includes(key)) {
      result += modifier
      break
    }
  }

  // Hard-truncate to Meshy's limit — truncate at a word boundary where possible
  if (result.length > MESHY_PROMPT_MAX_CHARS) {
    result = result.slice(0, MESHY_PROMPT_MAX_CHARS).replace(/[,\s]+$/, '')
  }

  return result
}

// ── Collision fidelity per category ──────────────────────────────────────────

const COLLISION_FIDELITY: Record<AssetCategory, string> = {
  character:   'Enum.CollisionFidelity.Hull',
  building:    'Enum.CollisionFidelity.Box',
  weapon:      'Enum.CollisionFidelity.Hull',
  vehicle:     'Enum.CollisionFidelity.Hull',
  prop:        'Enum.CollisionFidelity.Box',
  furniture:   'Enum.CollisionFidelity.Box',
  environment: 'Enum.CollisionFidelity.Box',
  default:     'Enum.CollisionFidelity.Hull',
}

// Default sizes in studs per category (X, Y, Z)
const DEFAULT_SIZES: Record<AssetCategory, [number, number, number]> = {
  character:   [4,  6,  4],
  building:    [20, 20, 20],
  weapon:      [1,  8,  1],
  vehicle:     [12, 6,  20],
  prop:        [4,  4,  4],
  furniture:   [6,  5,  6],
  environment: [16, 8,  16],
  default:     [6,  6,  6],
}

// ── Meshy helpers ─────────────────────────────────────────────────────────────

async function createMeshyTask(
  rawPrompt: string,
  quality: Quality,
  apiKey: string,
  category?: AssetCategory,
  retryWithCleanMesh = false,
): Promise<string> {
  const resolvedCategory = category ?? detectAssetCategory(rawPrompt)
  let builtPrompt = buildMeshyPrompt(rawPrompt, resolvedCategory)
  if (retryWithCleanMesh) {
    builtPrompt = `${builtPrompt}, clean mesh`
  }

  const body: Record<string, unknown> = {
    mode: 'preview',
    prompt: builtPrompt,
    negative_prompt: NEGATIVE_PROMPT,
    art_style: quality === 'premium' ? 'pbr' : 'realistic',
    topology: 'quad',
    target_polycount: POLY_TARGETS[quality],
  }

  if (quality !== 'draft') {
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

    if (!res.ok) {
      // 4xx errors (bad key, invalid taskId) are unrecoverable — fail fast
      if (res.status >= 400 && res.status < 500) {
        throw new Error(`Meshy poll failed with ${res.status} — check taskId and API key`)
      }
      // 5xx — transient, keep retrying
      continue
    }

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
  const texturePrompt = `${prompt}, seamless PBR game texture, physically based rendering, 4K detail, no visible tiling, clean UV mapping, consistent lighting, neutral lighting conditions`

  // Submit to Fal queue
  const submitRes = await fetch(`${FAL_QUEUE_BASE}/fal-ai/fast-sdxl/texture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Key ${apiKey}` },
    body: JSON.stringify({
      prompt: texturePrompt,
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

  // Poll for completion — hard cap at 45s so we never blow Vercel's 60s function limit.
  // Each iteration: 4s wait + up to 8s fetch = 12s worst case → 3 safe iterations before cutoff.
  const FAL_POLL_DEADLINE = Date.now() + 45_000
  for (let i = 0; i < 15; i++) {
    if (Date.now() >= FAL_POLL_DEADLINE) return null
    await new Promise((r) => setTimeout(r, 4_000))

    const statusRes = await fetch(
      `${FAL_QUEUE_BASE}/fal-ai/fast-sdxl/texture/requests/${requestId}/status`,
      {
        headers: { Authorization: `Key ${apiKey}` },
        signal: AbortSignal.timeout(8_000),
      },
    )

    if (!statusRes.ok) continue

    const status = (await statusRes.json()) as FalStatusResponse
    if (status.status === 'COMPLETED') {
      const resultRes = await fetch(
        `${FAL_QUEUE_BASE}/fal-ai/fast-sdxl/texture/requests/${requestId}`,
        {
          headers: { Authorization: `Key ${apiKey}` },
          signal: AbortSignal.timeout(10_000),
        },
      )
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
  category?: AssetCategory
  /** Real rbxassetid:// strings from Roblox Open Cloud upload — skips manual steps */
  rbxMeshId?: string
  rbxTextureIds?: { albedo: string; normal: string; roughness: string }
}): string {
  const { prompt, meshUrl, textures, taskId } = params
  const category: AssetCategory = params.category ?? detectAssetCategory(prompt)
  const collisionFidelity = COLLISION_FIDELITY[category]
  const [sx, sy, sz] = DEFAULT_SIZES[category]

  // Sanitize for Lua identifier — must start with a letter, no special chars
  const identBase = prompt.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40)
  // Prefix with 'asset_' if first character is a digit or the string is empty
  const safeName = /^[0-9_]/.test(identBase) || identBase.length === 0
    ? `asset_${identBase}`.slice(0, 46)
    : identBase

  // Sanitize for use inside Lua double-quoted string literals — escape backslashes
  // and double-quotes so the generated code is always syntactically valid.
  const displayName = prompt.slice(0, 50).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ')

  // Prefer the real rbxassetid:// if the upload already succeeded
  const meshLine = params.rbxMeshId
    ? `meshPart.MeshId = "${params.rbxMeshId}"`
    : meshUrl
      ? `-- IMPORTANT: Upload the GLB file to Roblox and replace this MeshId\n\tmeshPart.MeshId = "rbxassetid://YOUR_ASSET_ID"  -- source: ${meshUrl}`
      : `-- No mesh URL yet — poll GET /api/ai/mesh?taskId=${taskId} then upload the GLB`

  // Prefer real uploaded texture IDs; fall back to placeholder comment with source URLs
  const surfaceAppearanceBlock = params.rbxTextureIds
    ? `
\tlocal sa = Instance.new("SurfaceAppearance")
\tsa.AlphaMode    = Enum.AlphaMode.Overlay
\tsa.ColorMap     = "${params.rbxTextureIds.albedo}"
\tsa.NormalMap    = "${params.rbxTextureIds.normal}"
\tsa.RoughnessMap = "${params.rbxTextureIds.roughness}"
\tsa.MetalnessMap = ""  -- optional: add a metalness map if available
\tsa.Parent = meshPart`
    : textures?.albedo
      ? `
\tlocal sa = Instance.new("SurfaceAppearance")
\tsa.AlphaMode = Enum.AlphaMode.Overlay
\t-- Upload textures to Roblox Asset Manager and paste the asset IDs below
\tsa.ColorMap    = "rbxassetid://ALBEDO_ASSET_ID"    -- source: ${textures.albedo}
\tsa.NormalMap   = "rbxassetid://NORMAL_ASSET_ID"    -- source: ${textures.normal}
\tsa.RoughnessMap = "rbxassetid://ROUGHNESS_ASSET_ID" -- source: ${textures.roughness}
\tsa.MetalnessMap = ""  -- optional: upload a metalness map if available
\tsa.Parent = meshPart`
      : `
\t-- No textures generated. Add a SurfaceAppearance manually if needed.`

  // Plain number string — no locale commas — so the Lua print line is valid.
  const polyCountDisplay = params.polygonCount != null ? String(params.polygonCount) : 'unknown'

  return `--!strict
--[[
  ForjeAI Generated Mesh: ${displayName}
  Category:      ${category}
  Polygon Count: ${polyCountDisplay}
  Quality:       auto-detected
  Task ID:       ${taskId}

  IMPORTANT: Run this code in the Studio COMMAND BAR or inside a Plugin script.
  It will NOT work as a regular Script/LocalScript in the Explorer because it uses
  ChangeHistoryService and Selection, which are Plugin-only services.

  SETUP INSTRUCTIONS:
${params.rbxMeshId
  ? `  Assets were automatically uploaded to Roblox — MeshId and textures are pre-filled.
  1. Paste this script into the Studio Command Bar and press Enter
  2. Adjust Size and CFrame to match your scene layout`
  : `  1. Download the GLB from the meshUrl in the API response
  2. In Studio: Asset Manager > Import 3D > select your GLB
  3. Copy the new rbxassetid and paste it into MeshId below
  4. (Optional) Upload albedo/normal/roughness PNGs and update SurfaceAppearance IDs
  5. Paste this script into the Studio Command Bar and press Enter
  6. Adjust Size and CFrame to match your scene layout`}
--]]

local CollectionService  = game:GetService("CollectionService")
local ChangeHistoryService = game:GetService("ChangeHistoryService")
local Selection          = game:GetService("Selection")

local function create_${safeName}(): Model
\t-- Place near the camera so it lands in view immediately
\tlocal camera  = workspace.CurrentCamera
\tlocal spawnCF = camera.CFrame * CFrame.new(0, 0, -${Math.max(sx, sy, sz) * 2})

\tlocal model = Instance.new("Model")
\tmodel.Name = "${displayName}"

\tlocal meshPart = Instance.new("MeshPart")
\tmeshPart.Name = "${displayName}"
\t${meshLine}
\tmeshPart.Size             = Vector3.new(${sx}, ${sy}, ${sz})
\tmeshPart.CFrame           = spawnCF
\tmeshPart.Anchored         = true
\tmeshPart.CastShadow       = true
\tmeshPart.CollisionFidelity = ${collisionFidelity}
\tmeshPart.RenderFidelity   = Enum.RenderFidelity.Automatic
\tmeshPart.Parent           = model
${surfaceAppearanceBlock}

\tmodel.PrimaryPart = meshPart
\tmodel.Parent      = workspace

\t-- Tag for ForjeAI asset tracking
\tCollectionService:AddTag(model, "ForjeAI")
\tCollectionService:AddTag(meshPart, "ForjeAI")

\treturn model
end

-- Record for undo support
ChangeHistoryService:SetWaypoint("Before ForjeAI Place: ${displayName}")

local builtModel = create_${safeName}()

-- Select the placed model in Studio Explorer
Selection:Set({ builtModel })

ChangeHistoryService:SetWaypoint("After ForjeAI Place: ${displayName}")

print(string.format("[ForjeAI] Placed '%s' (%s) — polygon count: ${polyCountDisplay}", builtModel.Name, "${category}"))
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
  const category = detectAssetCategory(prompt)
  return NextResponse.json({
    meshUrl: null,
    fbxUrl: null,
    thumbnailUrl: DEMO_THUMBNAIL,
    videoUrl: null,
    polygonCount: null,
    textures: null,
    luauCode: generateMeshPartLuau({
      prompt,
      meshUrl: null,
      textures: null,
      polygonCount: null,
      taskId: 'demo-task',
      category,
    }),
    costEstimateUsd: 0,
    actualCostUsd: 0,
    status: 'demo',
    category,
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

    const glbUrl = task.model_urls?.glb ?? task.model_urls?.fbx ?? null

    // Attempt Roblox upload so the polled response also gets real asset IDs
    let rbxMeshId: string | undefined

    const robloxApiKey  = process.env.ROBLOX_OPEN_CLOUD_API_KEY
    const robloxCreator = process.env.ROBLOX_CREATOR_ID

    if (robloxApiKey && robloxCreator && glbUrl) {
      const meshResult = await downloadAndUpload(glbUrl, `mesh_${taskId}`, {
        description: `ForjeAI polled mesh — task ${taskId}`,
      }).catch((err: unknown) => {
        console.error('[mesh GET] Roblox mesh upload failed:', err instanceof Error ? err.message : err)
        return null
      })
      if (meshResult) rbxMeshId = meshResult.rbxAssetId
    }

    return NextResponse.json({
      meshUrl: glbUrl,
      fbxUrl: task.model_urls?.fbx ?? null,
      thumbnailUrl: task.thumbnail_url ?? null,
      videoUrl: task.video_url ?? null,
      polygonCount: task.polygon_count ?? null,
      textures: null,
      luauCode: generateMeshPartLuau({
        prompt: `mesh_${taskId}`,
        meshUrl: glbUrl,
        textures: null,
        polygonCount: task.polygon_count ?? null,
        taskId,
        rbxMeshId,
      }),
      status: 'complete',
      taskId,
      rbxMeshId:     rbxMeshId ?? null,
      rbxTextureIds: null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[mesh GET] Poll failed:', message)
    return NextResponse.json({ error: 'Poll failed' }, { status: 502 })
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

  // Detect category once — used for both prompt building and Luau code gen
  const category = detectAssetCategory(prompt)

  // Cost estimate (always returned even in demo)
  const costEstimateUsd = COST_MESH[quality] + (withTextures && falKey ? COST_TEXTURE : 0)

  // Demo mode
  if (!meshyKey) {
    return demoResponse(prompt)
  }

  let actualCostUsd = 0

  try {
    // Start Meshy task — with one retry on failure
    let taskId: string
    try {
      taskId = await createMeshyTask(prompt, quality, meshyKey, category)
    } catch (firstErr) {
      // Retry once with "clean mesh" appended to the prompt
      try {
        taskId = await createMeshyTask(prompt, quality, meshyKey, category, true)
      } catch {
        // Surface the original error if retry also fails
        throw firstErr
      }
    }

    actualCostUsd += COST_MESH[quality]

    // Start Fal texture generation in parallel (non-blocking).
    // Returns a tuple [textures, textureWasBilled] to avoid closure mutation races.
    const texturePromise: Promise<[{ albedo: string; normal: string; roughness: string } | null, boolean]> =
      withTextures && falKey
        ? generateFalTextures(prompt, falKey).then((t) => [t, t !== null] as [typeof t, boolean])
        : Promise.resolve([null, false] as [null, false])

    // Poll Meshy (up to ~2.5 minutes)
    const task = await pollMeshyTask(taskId, meshyKey)

    if (task.status === 'IN_PROGRESS') {
      // Still running — return taskId for client-side polling
      const [textures, textureBilled] = await texturePromise  // textures may already be ready
      if (textureBilled) actualCostUsd += COST_TEXTURE
      return NextResponse.json({
        meshUrl: null,
        fbxUrl: null,
        thumbnailUrl: null,
        videoUrl: null,
        polygonCount: null,
        textures,
        luauCode: generateMeshPartLuau({ prompt, meshUrl: null, textures, polygonCount: null, taskId, category }),
        costEstimateUsd,
        actualCostUsd,
        status: 'pending',
        category,
        taskId,
        message: `3D model still generating. Poll GET /api/ai/mesh?taskId=${taskId}`,
      })
    }

    // Mesh succeeded — await textures
    const [textures, textureBilled] = await texturePromise
    if (textureBilled) actualCostUsd += COST_TEXTURE

    const meshUrl = task.model_urls?.glb ?? task.model_urls?.fbx ?? null

    // ── Roblox Open Cloud upload ─────────────────────────────────────────────
    // Upload the mesh and all three texture maps to Roblox in parallel so the
    // generated Luau code contains real rbxassetid:// URLs — no manual steps.
    let rbxMeshId: string | undefined
    let rbxTextureIds: { albedo: string; normal: string; roughness: string } | undefined

    const robloxApiKey   = process.env.ROBLOX_OPEN_CLOUD_API_KEY
    const robloxCreator  = process.env.ROBLOX_CREATOR_ID

    if (robloxApiKey && robloxCreator && meshUrl) {
      const safeDisplayName = prompt.slice(0, 50)

      // Upload mesh + textures concurrently — texture uploads are independent
      const meshUploadPromise = downloadAndUpload(meshUrl, safeDisplayName, {
        description: `ForjeAI generated mesh (${category}) — task ${taskId}`,
      }).catch((err: unknown) => {
        console.error('[mesh POST] Roblox mesh upload failed:', err instanceof Error ? err.message : err)
        return null
      })

      const textureUploadPromise: Promise<{ albedo: string; normal: string; roughness: string } | null> =
        textures
          ? Promise.all([
              downloadAndUploadTexture(textures.albedo,   `${safeDisplayName} Albedo`,   { description: `Albedo map — ${taskId}` }),
              downloadAndUploadTexture(textures.normal,   `${safeDisplayName} Normal`,   { description: `Normal map — ${taskId}` }),
              downloadAndUploadTexture(textures.roughness,`${safeDisplayName} Roughness`,{ description: `Roughness map — ${taskId}` }),
            ])
              .then(([a, n, r]: [UploadAssetResult, UploadAssetResult, UploadAssetResult]) => ({
                albedo:    a.rbxAssetId,
                normal:    n.rbxAssetId,
                roughness: r.rbxAssetId,
              }))
              .catch((err: unknown) => {
                console.error('[mesh POST] Roblox texture upload failed:', err instanceof Error ? err.message : err)
                return null
              })
          : Promise.resolve(null)

      const [meshResult, textureResult] = await Promise.all([meshUploadPromise, textureUploadPromise])

      if (meshResult) rbxMeshId = meshResult.rbxAssetId
      if (textureResult) rbxTextureIds = textureResult
    }
    // ── End Roblox upload ────────────────────────────────────────────────────

    const luauCode = generateMeshPartLuau({
      prompt,
      meshUrl,
      textures,
      polygonCount: task.polygon_count ?? null,
      taskId,
      category,
      rbxMeshId,
      rbxTextureIds,
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
      category,
      taskId,
      // Expose the real IDs so the client can use them directly if needed
      rbxMeshId:     rbxMeshId ?? null,
      rbxTextureIds: rbxTextureIds ?? null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[mesh POST] Generation failed:', message)
    return NextResponse.json({ error: 'Mesh generation failed' }, { status: 502 })
  }
}
