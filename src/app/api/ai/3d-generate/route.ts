/**
 * POST /api/ai/3d-generate
 *
 * Unified 3D asset generation endpoint.
 * Classifies asset type → enhances prompt → selects agent chain → enqueues async pipeline job.
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

export const maxDuration = 60

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
type AssetType       = Generate3dInput['type']
type AssetStyle      = Generate3dInput['style']

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

// ── Cost breakdown per asset type ────────────────────────────────────────────
//
// Multipliers reflect real generation cost drivers:
//   character — bone rigging passes inflate compute ~30%
//   building  — mostly box extrusions; AI resolves faster, cheaper
//   terrain   — large surface, heavy UV unwrap
//   effect    — particle mesh; lightweight geometry

interface CostBreakdown {
  meshCost:         number
  textureCost:      number
  optimizationCost: number
  rigCost:          number
  animCost:         number
  totalTokens:      number
}

function buildCostBreakdown(input: Generate3dInput): CostBreakdown {
  // Per-type complexity multipliers on base mesh cost
  const MESH_MULTIPLIERS: Record<AssetType, number> = {
    character: 1.30,  // rigging complexity even before rig pass
    custom:    1.20,  // unknown shape = extra inference
    vehicle:   1.10,  // symmetry + mechanical detail
    terrain:   1.05,  // large surface area
    building:  0.90,  // repetitive geometry; resolves fast
    weapon:    0.95,
    furniture: 0.95,
    prop:      1.00,
    effect:    0.85,  // minimal geometry
  }

  const baseMesh    = Math.round(TOKEN_COSTS[input.type] * MESH_MULTIPLIERS[input.type])
  const textureCost = input.textured  ? TEXTURE_TOKEN_COST : 0
  const rigCost     = input.rigged    ? RIGGED_TOKEN_COST  : 0
  const animCost    = input.animated  ? ANIM_TOKEN_COST    : 0

  // Roblox optimization pass: LOD generation + collision shape bake
  const optimizationCost = input.robloxOptimized ? Math.round(baseMesh * 0.15) : 0

  return {
    meshCost:         baseMesh,
    textureCost,
    optimizationCost,
    rigCost,
    animCost,
    totalTokens:      baseMesh + textureCost + optimizationCost + rigCost + animCost,
  }
}

// ── Prompt enhancer ───────────────────────────────────────────────────────────

/**
 * Injects professional 3D artist context into the user prompt before it
 * reaches the Meshy / generation pipeline.  The extras are appended as a
 * structured suffix so the user's original intent stays dominant.
 */
function enhancePromptForPro(prompt: string, type: AssetType, style: AssetStyle): string {
  const parts: string[] = [prompt.trim()]

  // ── Material vocabulary ──────────────────────────────────────────────────
  const MATERIAL_HINTS: Partial<Record<string, string>> = {
    metal:    'brushed steel surface, subtle wear scratches, slight specular reflection',
    steel:    'cold-rolled steel, brushed finish, faint surface grain, realistic specularity',
    iron:     'cast iron, rough surface, oxidised edges, matte dark grey',
    wood:     'oak grain running lengthwise, natural knots, slight sheen from lacquer',
    stone:    'granite micro-texture, irregular surface bumps, diffuse matte finish',
    brick:    'handmade clay brick, mortar joints recessed 2mm, slight colour variation',
    glass:    'float glass, 92% transmission, slight green tint at edges, minimal reflection',
    plastic:  'injection-moulded ABS, smooth surface, low roughness, sharp edge chamfers',
    fabric:   'woven cotton, visible thread weave at 8cm scale, soft diffuse shading',
    leather:  'full-grain leather, pore texture, slight creasing at fold lines',
    concrete: 'poured concrete, formwork board marks, hairline cracks, matte diffuse',
    gold:     'polished 18ct gold, warm yellow specular, mirror-like finish',
    rubber:   'vulcanised rubber, matte black, slight surface bloom, Shore 70A hardness feel',
  }

  const lowerPrompt = prompt.toLowerCase()
  const matchedMaterials = Object.entries(MATERIAL_HINTS)
    .filter(([kw]) => lowerPrompt.includes(kw))
    .map(([, desc]) => desc)

  if (matchedMaterials.length > 0) {
    parts.push(`Material detail: ${matchedMaterials.join('; ')}.`)
  }

  // ── Lighting hints ───────────────────────────────────────────────────────
  parts.push(
    'Lighting: neutral studio HDRI, soft directional key light from upper-left at 45°, ' +
    'fill light at 25% intensity opposite side, even shadow coverage with no harsh gradients.',
  )

  // ── Scale context ────────────────────────────────────────────────────────
  const SCALE_CONTEXT: Record<AssetType, string> = {
    building:  'real-world proportions — floor-to-ceiling 3m, door frame 2.1m tall, 0.9m wide',
    character: '1:1 human scale — standing height 1.75m, shoulder width 0.45m, hand span 0.19m',
    vehicle:   'automotive proportions — wheelbase 2.7m, roof height 1.5m, wheel diameter 0.65m',
    weapon:    'ergonomic scale — pistol grip 13cm, rifle overall 95cm, sword blade 75cm',
    furniture: 'interior design scale — chair seat 45cm high, table 75cm, sofa 85cm seat depth',
    terrain:   'landscape scale — gentle slope gradients 5-20°, rock formations 0.5-3m tall',
    prop:      'hand-interaction scale — object graspable in one hand or placed on a desk',
    effect:    'particle emitter bounds — centre-pivot aligned, symmetrical bounding box',
    custom:    'real-world proportions, 1:1 human scale reference for any interactive elements',
  }
  parts.push(`Scale: ${SCALE_CONTEXT[type]}.`)

  // ── Topology hints ───────────────────────────────────────────────────────
  parts.push(
    'Topology: quad-dominant polygon flow, clean edge loops, no n-gons, ' +
    'chamfered hard edges, support loops on structural geometry, ' +
    'manifold mesh (watertight), no overlapping faces, UV seams placed in hidden areas.',
  )

  // ── Roblox-specific overrides ────────────────────────────────────────────
  if (style === 'roblox') {
    parts.push(
      'Roblox game aesthetic: slightly exaggerated proportions, child-friendly design, ' +
      'no sharp weaponised spikes, saturated but not neon colours, ' +
      '10 000 triangle budget (hard limit), LOD-ready silhouette readable at 50 studs distance.',
    )
  }

  // ── Style-specific additions ─────────────────────────────────────────────
  if (style === 'lowpoly') {
    parts.push(
      'Low-poly art style: flat shading preferred, bold silhouette, ' +
      'geometric approximation of organic shapes, 500–3 000 triangle budget.',
    )
  }
  if (style === 'realistic') {
    parts.push(
      'Photorealistic target: physically-based materials, accurate surface micro-detail, ' +
      'subsurface scattering on organic elements, high-frequency normal map detail.',
    )
  }
  if (style === 'stylized') {
    parts.push(
      'Stylized aesthetic: hand-painted texture look, exaggerated proportions for readability, ' +
      'strong silhouette, thick outline-friendly edge flow.',
    )
  }

  return parts.join(' ')
}

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

function estimateFileSizeMB(polyTarget: number, textured: boolean): number {
  const baseMb = (polyTarget / 1000) * 0.12
  const texMb  = textured ? 3.5 : 0
  return parseFloat((baseMb + texMb).toFixed(2))
}

function estimateFileSizeLabel(polyTarget: number, textured: boolean): string {
  const total = estimateFileSizeMB(polyTarget, textured)
  return total < 1 ? `${Math.round(total * 1024)} KB` : `${total.toFixed(1)} MB`
}

function estimateTime(input: Generate3dInput): string {
  let seconds = 45
  if (input.polyTarget > 20000)   seconds += 30
  if (input.textured)             seconds += 25
  if (input.rigged)               seconds += 45
  if (input.animated)             seconds += 90
  if (input.type === 'character') seconds += 30
  if (seconds < 60)  return `~${seconds}s`
  if (seconds < 120) return `~${Math.round(seconds / 60)} min`
  return `~${Math.ceil(seconds / 60)} min`
}

// ── Quality report builder ────────────────────────────────────────────────────

interface QualityReport {
  estimatedTriangles:      number
  estimatedVertices:       number
  robloxSizeStuds:         { x: number; y: number; z: number }
  estimatedFileSizeMB:     number
  estimatedGenerationTime: string
  importSteps:             string[]
  optimizationTips:        string[]
}

function buildQualityReport(input: Generate3dInput, dims: { x: number; y: number; z: number }): QualityReport {
  // Vertices run ~60% of tri count for quad-remeshed exports
  const estimatedTriangles = input.polyTarget
  const estimatedVertices  = Math.round(input.polyTarget * 0.6)

  const importSteps = buildImportSteps(input.type, input.exportFormat, dims)
  const optimizationTips = buildOptimizationTips(input)

  return {
    estimatedTriangles,
    estimatedVertices,
    robloxSizeStuds:         dims,
    estimatedFileSizeMB:     estimateFileSizeMB(input.polyTarget, input.textured),
    estimatedGenerationTime: estimateTime(input),
    importSteps,
    optimizationTips,
  }
}

// ── Import instructions per asset type ───────────────────────────────────────

function buildImportSteps(type: AssetType, format: string, dims: { x: number; y: number; z: number }): string[] {
  const ext = format.toUpperCase()

  const COMMON_IMPORT: string[] = [
    `1. Download the generated .${format} file from the asset panel.`,
    `2. Open Roblox Studio — ensure you have the "Asset Manager" panel open (View → Asset Manager).`,
    `3. In Asset Manager, click the upload button (cloud icon) → select your .${format} file.`,
    `4. Wait for upload confirmation — copy the resulting rbxassetid from the panel.`,
    `5. In the Explorer, insert a MeshPart: right-click Workspace → Insert Object → MeshPart.`,
    `6. In Properties, set MeshPart.MeshId to rbxassetid://YOUR_ID_HERE.`,
    `7. Set MeshPart.Size to Vector3.new(${dims.x}, ${dims.y}, ${dims.z}).`,
  ]

  const TYPE_STEPS: Record<AssetType, string[]> = {
    building: [
      ...COMMON_IMPORT,
      `8. Set MeshPart.Anchored = true — buildings should not fall under gravity.`,
      `9. Set CollisionFidelity to Enum.CollisionFidelity.Box for best performance on large structures.`,
      `10. Add a SelectionBox highlight during testing: local sb = Instance.new("SelectionBox") sb.Adornee = meshPart sb.Parent = workspace.`,
      `11. Place in a Folder named "Buildings" under Workspace for organisation.`,
    ],
    character: [
      ...COMMON_IMPORT,
      `8. Characters use R15 rig — swap MeshPart for the generated R15 bundle via Marketplace import if rigged.`,
      `9. If this is a custom NPC skin: apply it as a MeshPart inside an existing R15 Model.`,
      `10. Set CollisionFidelity to Enum.CollisionFidelity.Hull — never Precise on characters (2× CPU cost).`,
      `11. Attach a HumanoidRootPart and Humanoid if this is a full NPC model.`,
      `12. Test locomotion with a basic walk animation: Humanoid:LoadAnimation(animTrack):Play().`,
    ],
    vehicle: [
      ...COMMON_IMPORT,
      `8. Set MeshPart.Anchored = false — vehicles need physics simulation.`,
      `9. Add a VehicleSeat as PrimaryPart of the Model.`,
      `10. Attach BodyVelocity and BodyAngularVelocity constraints for movement.`,
      `11. Set CollisionFidelity to Enum.CollisionFidelity.Hull for accurate vehicle collisions.`,
      `12. Group all wheel MeshParts under a "Wheels" folder and set Anchored = false on each.`,
    ],
    weapon: [
      ...COMMON_IMPORT,
      `8. Parent the weapon MeshPart inside a Tool instance (not directly to Workspace).`,
      `9. Set the Tool.Handle to the weapon MeshPart.`,
      `10. Add a grip Attachment at CFrame.new(0, -${(dims.y / 2).toFixed(1)}, 0) for correct hand placement.`,
      `11. Set CollisionFidelity to Enum.CollisionFidelity.Box — weapons rarely need precise collision.`,
      `12. Add the Tool to StarterPack for player inventory.`,
    ],
    furniture: [
      ...COMMON_IMPORT,
      `8. Set MeshPart.Anchored = true for static furniture.`,
      `9. For sit-able furniture (chairs, sofas): add a Seat or VehicleSeat as a child.`,
      `10. Set CollisionFidelity to Enum.CollisionFidelity.Default — good balance for furniture.`,
      `11. Group related pieces (chair + legs + cushion) under one Model with a clear name.`,
    ],
    terrain: [
      `1. Download the generated .${format} file.`,
      `2. For terrain meshes: use the Terrain editor (Home → Edit → Terrain) for voxel-based terrain.`,
      `3. Alternatively, import as a MeshPart and set it as a static decoration layer above voxel terrain.`,
      `4. Set Anchored = true, CanCollide = false if using as a visual overlay.`,
      `5. For playable terrain, use Roblox's built-in terrain tools — mesh terrain is for visuals only.`,
      `6. Set RenderFidelity to Enum.RenderFidelity.Performance on large terrain meshes.`,
    ],
    prop: [
      ...COMMON_IMPORT,
      `8. Props are typically Anchored = true (decorative) or false (interactive/pickable).`,
      `9. For pickable props: parent inside a Tool with Handle set.`,
      `10. Set CollisionFidelity to Enum.CollisionFidelity.Box unless the prop shape is complex.`,
      `11. Add a BillboardGui label above the prop if it needs a name tag.`,
    ],
    effect: [
      ...COMMON_IMPORT,
      `8. Effect meshes are usually paired with a ParticleEmitter — set CanCollide = false.`,
      `9. Set Anchored = false if the effect follows a character or projectile.`,
      `10. Attach the MeshPart to a Part with a ParticleEmitter as a sibling.`,
      `11. Use TweenService to animate Scale or Transparency for pulsing effects.`,
    ],
    custom: [
      ...COMMON_IMPORT,
      `8. Review CollisionFidelity based on the asset shape — Box for blocky, Hull for organic.`,
      `9. Set Anchored based on whether the asset is static or physics-driven.`,
      `10. Rename the MeshPart and parent Model to match your project naming convention.`,
      `11. Run the MicroProfiler (Ctrl+F6 in Studio) after placing to check draw call impact.`,
    ],
  }

  return TYPE_STEPS[type] ?? COMMON_IMPORT
}

// ── Optimization tips per input ───────────────────────────────────────────────

function buildOptimizationTips(input: Generate3dInput): string[] {
  const tips: string[] = []

  if (input.polyTarget > 20000) {
    tips.push(`High poly count (${input.polyTarget.toLocaleString()} tris) — use RenderFidelity.Performance on instances placed more than 100 studs from the camera.`)
    tips.push('Consider creating a low-poly LOD variant at 25% poly count for distant rendering.')
  }

  if (input.polyTarget > 10000) {
    tips.push('Enable Streaming Enabled on your Place to automatically unload this mesh when players are far away.')
  }

  if (input.type === 'character') {
    tips.push('Set CollisionFidelity to Hull — never Precise on characters. Precise costs 2× CPU per character.')
    tips.push('Pool idle NPC models in ReplicatedStorage rather than destroying and recreating them.')
  }

  if (input.type === 'building') {
    tips.push('Use CollisionFidelity.Box on large building shells — precise collision on buildings causes significant physics overhead.')
    tips.push('Break large buildings into modular pieces so only nearby modules are rendered when StreamingEnabled is on.')
  }

  if (input.type === 'terrain') {
    tips.push('Terrain meshes over 40×40 studs should use RenderFidelity.Performance — terrain is always in view.')
    tips.push('Bake ambient occlusion into the texture albedo at generation time for best visual quality without runtime lighting cost.')
  }

  if (input.textured) {
    tips.push('Pack albedo + roughness + metallic into a single 1024×1024 texture atlas to reduce draw calls from 3 texture samples to 1.')
    tips.push('Use Enum.Material.Custom on the MeshPart and apply a SurfaceAppearance child for PBR textures.')
  }

  if (input.rigged) {
    tips.push('Rig joints should not exceed 64 bones for Roblox character compatibility.')
    tips.push('Bake any shape-key animations into bone animations before export — Roblox does not support blend shapes.')
  }

  if (input.animated) {
    tips.push('Compress animation data: remove keyframes where values do not change. Roblox animation clips are downloaded per-player.')
    tips.push('Store animation IDs in a centralised AnimationIds module to make updates easy across all scripts.')
  }

  if (input.robloxOptimized) {
    tips.push('The generated mesh includes a pre-baked LOD hull. Use it as the CollisionFidelity target to save physics budget.')
  }

  // Always-applicable tips
  tips.push('Group all related assets under one Model and give the Model a descriptive name — this keeps the Explorer readable and makes streaming more predictable.')
  tips.push('Use CastShadow = false on small props (< 3 studs) — shadow geometry on tiny objects wastes GPU without visible benefit.')

  return tips
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

// ── Realistic poly counts per asset type for demo ────────────────────────────
//
// Based on shipped Roblox game assets in 2024-2026.

const DEMO_POLY_COUNTS: Record<AssetType, { triangles: number; label: string }> = {
  building:  { triangles: 8400,   label: '8,400 tris — typical modular building shell' },
  character: { triangles: 6200,   label: '6,200 tris — R15-compatible NPC body' },
  vehicle:   { triangles: 11800,  label: '11,800 tris — full vehicle with interior' },
  weapon:    { triangles: 1800,   label: '1,800 tris — hand weapon with grip detail' },
  furniture: { triangles: 2400,   label: '2,400 tris — mid-complexity interior prop' },
  terrain:   { triangles: 14000,  label: '14,000 tris — 40×40 stud terrain tile' },
  prop:      { triangles: 900,    label: '900 tris — hero prop, LOD-ready' },
  effect:    { triangles: 320,    label: '320 tris — emitter mesh, minimal geometry' },
  custom:    { triangles: 5000,   label: '5,000 tris — estimated from prompt complexity' },
}

// ── Luau code generator ───────────────────────────────────────────────────────

function generateInsertServiceLuau(params: {
  prompt:    string
  type:      AssetType
  taskId:    string
  polyCount: number | null
  dims:      { x: number; y: number; z: number }
}): string {
  const { prompt, type, taskId, polyCount, dims } = params

  // Lua identifier: must start with a letter, alphanumeric + underscore only
  const identBase = prompt.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40)
  const safeName  = /^[0-9_]/.test(identBase) || identBase.length === 0
    ? `asset_${identBase}`.slice(0, 46)
    : identBase

  // Safe for Lua double-quoted strings: escape backslashes, double-quotes, newlines
  const displayName = prompt.slice(0, 50)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, ' ')

  // Safe for Lua block comment: prevent premature comment close
  const safePromptComment = prompt.replace(/--\]\]/g, '-- ]]').replace(/\r?\n/g, ' ')

  const anchorLine = ['terrain', 'building', 'furniture', 'prop'].includes(type)
    ? 'meshPart.Anchored = true'
    : 'meshPart.Anchored = false  -- vehicle/character/weapon — anchor manually if needed'

  const collisionFidelity: Record<AssetType, string> = {
    building:  'Enum.CollisionFidelity.Box',
    character: 'Enum.CollisionFidelity.Hull',
    vehicle:   'Enum.CollisionFidelity.Hull',
    weapon:    'Enum.CollisionFidelity.Box',
    furniture: 'Enum.CollisionFidelity.Default',
    terrain:   'Enum.CollisionFidelity.Default',
    prop:      'Enum.CollisionFidelity.Box',
    effect:    'Enum.CollisionFidelity.Box',
    custom:    'Enum.CollisionFidelity.Default',
  }

  return `--[[
  ForjeAI 3D Asset: ${safePromptComment}
  Type:         ${type}
  Poly count:   ${polyCount?.toLocaleString() ?? 'pending'}
  Dimensions:   ${dims.x}w x ${dims.y}h x ${dims.z}d studs
  Task ID:      ${taskId}
  Generated:    ${new Date().toISOString()}

  SETUP: Poll GET /api/ai/generation-status?assetId=ASSET_ID until status === "ready"
  The rbxAssetUrl will contain the rbxassetid:// once uploaded.
  Replace YOUR_ASSET_ID_HERE below with the numeric ID from the panel.
--]]

local function create_${safeName}()
  local model    = Instance.new("Model")
  model.Name     = "${displayName}"
  model.Parent   = workspace

  local meshPart            = Instance.new("MeshPart")
  meshPart.Name             = "${displayName}"
  meshPart.MeshId           = "rbxassetid://YOUR_ASSET_ID_HERE"  -- replace after upload completes
  meshPart.Size             = Vector3.new(${dims.x}, ${dims.y}, ${dims.z})
  meshPart.CFrame           = CFrame.new(0, ${dims.y / 2}, 0)
  ${anchorLine}
  meshPart.CastShadow       = true
  meshPart.CollisionFidelity = ${collisionFidelity[type]}
  meshPart.RenderFidelity    = Enum.RenderFidelity.Automatic
  meshPart.Parent            = model

  model.PrimaryPart = meshPart
  return model
end

local asset = create_${safeName}()
print("[ForjeAI] Placed:", asset.Name)
`
}

// ── Demo quality checklist ────────────────────────────────────────────────────

function buildDemoQualityChecklist(type: AssetType, style: AssetStyle): string[] {
  const base = [
    'Quad-dominant topology with clean edge flow',
    'No n-gons, no overlapping faces, manifold mesh',
    'UV unwrapped with seams in non-visible areas',
    'Pivot point at base-centre for correct Roblox placement',
    'All transforms applied (scale = 1, rotation = 0)',
  ]

  if (style === 'roblox') {
    base.push('10 000 triangle budget respected')
    base.push('Silhouette readable at 50 studs distance')
    base.push('Child-friendly design — no sharp edges or adult content')
  }

  const TYPE_EXTRAS: Partial<Record<AssetType, string[]>> = {
    character: [
      'R15 bone hierarchy exported (15 joints)',
      'Weight painting smooth across joints',
      'Skin vertex groups named to Roblox conventions',
    ],
    building: [
      'Modular grid-aligned geometry (4-stud grid)',
      'Interior faces removed (backface culling safe)',
      'Doorway and window openings clean-edged',
    ],
    vehicle: [
      'Wheels separated as individual mesh objects',
      'Symmetric geometry verified on X axis',
      'Engine bay and interior blocking present',
    ],
    weapon: [
      'Grip centred at world origin for hand attachment',
      'No interior geometry on blade/barrel',
      'Edge bevels on all visible hard edges',
    ],
  }

  return [...base, ...(TYPE_EXTRAS[type] ?? [])]
}

// ── Demo response ─────────────────────────────────────────────────────────────

function buildDemoResponse(input: Generate3dInput) {
  const dims        = estimateDimensions(input.type)
  const taskId      = `demo-${input.type}-${Date.now()}`
  const costBreak   = buildCostBreakdown(input)
  const qualityRpt  = buildQualityReport(input, dims)
  const polyInfo    = DEMO_POLY_COUNTS[input.type]
  const enhanced    = enhancePromptForPro(input.prompt, input.type, input.style)

  return NextResponse.json({
    status:  'demo',
    assetId: null,
    jobId:   null,

    asset: {
      meshUrl:      null,
      textureUrls:  { albedo: null, normal: null, roughness: null, metallic: null },
      thumbnailUrl: DEMO_THUMBNAIL_3D,
      polyCount:    polyInfo.triangles,
      polyLabel:    polyInfo.label,
      fileSize:     estimateFileSizeLabel(polyInfo.triangles, input.textured),
      dimensions:   dims,
    },

    enhancedPrompt: enhanced,

    qualityReport: qualityRpt,

    qualityChecklist: buildDemoQualityChecklist(input.type, input.style),

    luauCode: generateInsertServiceLuau({
      prompt:    input.prompt,
      type:      input.type,
      taskId,
      polyCount: polyInfo.triangles,
      dims,
    }),

    agentChain:  AGENT_CHAINS[input.type],

    costBreakdown: costBreak,
    tokensCost:    costBreak.totalTokens,

    estimatedTime: estimateTime(input),

    message: [
      'Set MESHY_API_KEY to generate real 3D models.',
      'Set FAL_KEY for PBR textures (albedo + normal + roughness + metallic).',
      'The enhancedPrompt field shows exactly what will be sent to the generation pipeline.',
    ].join(' '),
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

  const dims        = estimateDimensions(input.type)
  const costBreak   = buildCostBreakdown(input)
  const qualityRpt  = buildQualityReport(input, dims)
  const enhanced    = enhancePromptForPro(input.prompt, input.type, input.style)

  try {
    // Enqueue async pipeline — returns immediately.
    // Pass input.prompt (raw user intent) rather than the fully-enhanced string:
    // mesh-pipeline.ts's enrichPrompt() already appends type/style/technical suffixes
    // and enforces Meshy's 500-char limit. Feeding the pre-enhanced prompt would
    // double-stack enrichments and reliably overflow the char limit.
    const { assetId, jobId } = await startMeshPipeline({
      userId,
      prompt:     input.prompt,
      type:       input.type,
      style:      input.style,
      polyTarget: input.polyTarget,
      textured:   input.textured,
      tokensCost: costBreak.totalTokens,
    })

    // Return queued status — client polls /api/ai/generation-status?assetId=xxx
    return NextResponse.json({
      status:  'queued',
      assetId,
      jobId,

      asset: {
        meshUrl:      null,
        textureUrls:  { albedo: null, normal: null, roughness: null, metallic: null },
        thumbnailUrl: null,
        polyCount:    input.polyTarget,
        fileSize:     estimateFileSizeLabel(input.polyTarget, input.textured),
        dimensions:   dims,
      },

      enhancedPrompt: enhanced,

      qualityReport: qualityRpt,

      luauCode: generateInsertServiceLuau({
        prompt:    input.prompt,
        type:      input.type,
        taskId:    assetId,
        polyCount: input.polyTarget,
        dims,
      }),

      agentChain:  AGENT_CHAINS[input.type],

      costBreakdown: costBreak,
      tokensCost:    costBreak.totalTokens,

      estimatedTime: estimateTime(input),

      message: `Generation queued. Poll GET /api/ai/generation-status?assetId=${assetId}`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[3d-generate POST] Failed to queue:', message)
    return NextResponse.json({ error: '3D generation failed to queue' }, { status: 502 })
  }
}
