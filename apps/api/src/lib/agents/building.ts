/**
 * Building agent — places and modifies structures in Roblox games.
 * Uses Claude to plan layouts, then generates REAL 3D meshes via Meshy AI
 * + PBR textures via Fal AI in parallel. Outputs MeshPart Luau code.
 */

import { claudeChat } from '../ai/providers/anthropic'
import { anthropicBreaker, meshyBreaker, falBreaker } from '../ai/circuit-breaker'
import { textTo3DComplete } from '../ai/providers/meshy'
import { generateTextures } from '../ai/providers/fal'
import type { AgentCommand, AgentResult, GameChange } from './types'
import {
  detectTheme,
  getThemeMaterials,
  getMaterialColor,
  THEME_PALETTES,
  RobloxMaterial,
  type ThemeName,
} from '../../../../../src/lib/roblox-materials'
import {
  detectLightingPreset,
  getLightingPreset,
  generateLightingLuau,
  type LightingPresetName,
} from '../../../../../src/lib/roblox-lighting'
import {
  getBuildingTemplate,
  WALL,
  DOOR,
  WINDOW,
  FLOOR,
  ROOF,
} from '../../../../../src/lib/roblox-scale'

// ---------------------------------------------------------------------------
// Image analysis type (mirrors /api/ai/analyze-image output)
// ---------------------------------------------------------------------------

export interface ImageAnalysis {
  theme: string
  style: string
  /** hex strings e.g. "#8B4513" */
  colors: string[]
  /** Roblox Enum.Material names */
  materials: string[]
  objects: string[]
  lighting: string
  scale: 'small' | 'medium' | 'large' | 'massive'
  summary: string
  sourceGame?: string
  confidence: number
}

// ---------------------------------------------------------------------------
// Prompt expander — turns terse inputs into detailed build briefs
// ---------------------------------------------------------------------------

const EXPANSION_MAP: Record<string, string> = {
  castle:    'medieval stone castle with 4 corner towers (each 8x8 studs, 40 studs tall), 4-stud-thick curtain walls (24 studs tall), a gatehouse with a portcullis, a moat filled with water (8 studs wide, 4 studs deep), a great hall keep (30x20x20 studs), interior courtyard, wall-mounted torches with PointLights, flag poles with union-flag Parts on top of each tower, a drawbridge that can rotate, arrow-slit windows, and battlements along the top of every wall',
  house:     'two-storey wooden house with a tiled brick roof, front porch with wooden beams, shuttered windows with glass panes, a chimney stack with smoke particle, a front door with a ProximityPrompt, interior floor and ceiling Parts, and a lantern hanging above the door with a PointLight',
  tower:     'tall stone wizard tower with a spiral staircase visible through windows, pointed conical roof in dark SmoothPlastic, narrow arched windows, ivy texture on the lower third using Concrete material, a glowing orb at the top using a Neon Part with PointLight, and a wooden door at the base',
  bridge:    'stone arch bridge spanning a river, 6 studs wide, arched underside using WedgeParts, cobblestone deck, stone railings every 4 studs, moss Concrete material on the piers, lantern posts at both ends with SpotLights pointing down, and water beneath using a flat reflective Part',
  shop:      'market stall or small shop with a wooden sign (using a SurfaceGui), tiled SmoothPlastic counter, striped awning using WedgeParts, display items on shelves, a bell above the door, lantern light with PointLight, and a ProximityPrompt on the door to open/close it',
  dungeon:   'underground dungeon with 6x6 stud stone corridors, arched ceilings using WedgeParts, iron-bar cell doors (thin Neon Parts), wall-mounted torch sconces with PointLights in orange-amber, a torture chamber with chains, a treasure room at the end with a chest, and rubble Parts scattered on the floor',
  arena:     'gladiatorial arena with a flat sand floor (256x256 studs), tiered stone seating surrounding it (8 tiers, each 6 studs high and 4 studs deep), 4 grand entrance arches, torches on every column, a raised VIP box at one end, weapon racks along the walls, and sand-colour Concrete floor texture',
  village:   'medieval village with 6-8 varied timber-framed houses, a central well with a rope-and-bucket mechanism, cobblestone paths connecting buildings, a blacksmith forge with fire particle and SurfaceLight, a tavern with a hanging sign, a small chapel with a bell tower, market stalls, and lantern posts at path intersections',
  temple:    'ancient stone temple with 6 grand columns at the entrance (each 4x4x30 studs, Marble material), wide stone steps leading to the entrance, interior altar with glowing Neon Parts, torches on walls, cracked and weathered Concrete textures, large stone door with engraved patterns using Decals, and a reflecting pool in front',
  lighthouse: 'coastal lighthouse tower (10x10 base, 80 studs tall, SmoothPlastic white), spiral staircase inside, red-band stripe 40 studs up, rotating SpotLight at the top (bright white, 500 range), dock extending into the sea, foamy wave Parts around the base, and a keeper cottage beside it',
  volcano:   'erupting volcano with rocky basalt terrain (dark grey Slate material), flowing lava rivers using orange-red Neon Parts at low elevation, ash particle emitters at the crater, smoke billowing up, obsidian rock formations, and a cave entrance at the base',
  spaceship: 'sleek sci-fi spaceship hull (SmoothPlastic grey-white), glowing blue thruster exhausts using Neon and PointLights, cockpit glass dome using Glass material, wing structures with running lights in red and green, landing gear using cylinder Parts, interior pilot seat visible through the cockpit, and engine exhaust particle effects',
  waterfall: 'tall cliff face (60 studs) with a waterfall of transparent blue Parts flowing down into a pool, mist particle effects at the base, tropical jungle plants on the cliff ledge, rocks around the pool edge in Slate material, and a hidden cave behind the waterfall',
}

function expandPrompt(prompt: string): string {
  const lower = prompt.toLowerCase()
  for (const [key, expansion] of Object.entries(EXPANSION_MAP)) {
    if (lower.includes(key)) {
      return `${prompt}\n\nDetailed build requirements: ${expansion}`
    }
  }
  return prompt
}

// ---------------------------------------------------------------------------
// System prompt — static base (theme-specific data injected at call time)
// ---------------------------------------------------------------------------

const BUILDING_SYSTEM_PROMPT_BASE = `You are a senior Roblox Studio architect who generates professional-quality builds identical to those seen in top games like Adopt Me, Blox Fruits, and Pet Simulator X.

Given a build request, return ONLY valid JSON with this exact shape:
{
  "structures": [
    {
      "name": string,
      "type": string,
      "style": string,
      "position": {"x": number, "y": number, "z": number},
      "size": {"width": number, "height": number, "depth": number},
      "parts": [
        {
          "name": string,
          "partType": "Part" | "WedgePart" | "CornerWedgePart" | "TrussPart" | "UnionOperation",
          "size": {"x": number, "y": number, "z": number},
          "cframe": {"x": number, "y": number, "z": number, "rx": number, "ry": number, "rz": number},
          "color3": {"r": number, "g": number, "b": number},
          "material": string,
          "transparency": number,
          "castShadow": boolean,
          "anchored": boolean,
          "light": {"type": "PointLight"|"SpotLight"|"SurfaceLight"|null, "brightness": number, "range": number, "color": {"r":number,"g":number,"b":number}} | null
        }
      ],
      "marketplaceQuery": string,
      "instanceCount": number,
      "luauScript": string
    }
  ],
  "totalInstanceCount": number,
  "buildScript": string,
  "lightingScript": string,
  "description": string
}

CRITICAL RULES — every output must follow these:

SCALE (realistic studs, 1 stud ≈ 0.28 m — character height is 5 studs):
- Wall thickness (interior): 1 stud | exterior: 2 studs | castle: 4 studs
- Door: 4 studs wide, 7 studs tall (double door: 8 wide, 9 tall)
- Window: 3 studs wide, 3 studs tall, sill at 3 studs from floor
- Story height (floor-to-floor): 12 studs
- Tower: 8-12 studs diameter, 40-60 studs tall
- House: 20-50 studs wide, 12-36 studs tall
- Floor/ceiling slab: 1 stud thick
- Never use 1x1x1 Parts as buildings

MATERIALS (NEVER use plain Plastic — it looks terrible):
- Stone/castle: Cobblestone, Slate, Granite, Concrete
- Wood: WoodPlanks, Wood
- Metal: Metal, DiamondPlate
- Fancy/marble: Marble, Limestone, SmoothPlastic (cream/white only)
- Ground/paths: Cobblestone, Ground, Mud, Sand, Grass
- Glass: Glass (transparency 0.3-0.5)
- Accents/glow: Neon (use sparingly for light sources and magical details only)

LIGHTING — always include where natural:
- Torches: PointLight, brightness=2, range=16, color r=1.0 g=0.65 b=0.2 (orange)
- Lanterns: PointLight, brightness=1.5, range=12, color r=1.0 g=0.9 b=0.75 (warm white)
- Fire/forge: PointLight brightness=3, range=20, color r=1.0 g=0.4 b=0.1 + Fire particle
- Interior: SurfaceLight on ceiling Parts, brightness=0.8
- Spotlights on statues/signs: SpotLight, face=Top, brightness=2

BUILDSCRIPT field: must be a COMPLETE runnable Luau script that:
1. Creates an Instance.new("Model") named after the structure, parented to workspace
2. Uses Instance.new("Part") / Instance.new("WedgePart") etc. for every major component
3. Sets .Size, .CFrame (use CFrame.new(x,y,z) * CFrame.Angles(rx,ry,rz)), .Material (Enum.Material.Cobblestone etc.), .Color (Color3.new(r,g,b) using the EXACT Color3 values listed in your THEME PALETTE below), .Anchored=true, .CastShadow
4. Adds PointLight/SpotLight children where specified
5. Adds a Fire or Smoke instance for forges/torches
6. Groups all Parts into the Model
7. Uses descriptive variable names (e.g. castleWallNorth, mainGateLeft)
8. Includes comments explaining each major section

LIGHTINGSCRIPT field: the lighting preset Luau script provided in the context below — include it verbatim.

LUAUSCRIPT per structure: per-structure script that handles interactivity (doors opening, lights flickering, etc.)

Keep totalInstanceCount below 8000. Generate at minimum 15-25 named Parts per structure so builds look detailed.`

// ---------------------------------------------------------------------------
// Dynamic system prompt builder — injects theme palette + lighting into prompt
// ---------------------------------------------------------------------------

function buildSystemPrompt(theme: ThemeName, lightingPreset: LightingPresetName): string {
  const palette = THEME_PALETTES[theme]
  const lighting = getLightingPreset(lightingPreset)

  // Build color table for theme materials
  const materialLines = palette.materials.map((mat) => {
    const col = getMaterialColor(mat, theme)
    return `  - ${mat}: ${col.luau}  -- ${col.hex}`
  })

  const themeSection = `
DETECTED THEME: ${palette.displayName.toUpperCase()}
Use ONLY these materials and their exact Color3 values unless the prompt explicitly specifies otherwise:
${materialLines.join('\n')}

LIGHTING PRESET: ${lighting.displayName} — ${lighting.description}
Include the following lightingScript verbatim in the "lightingScript" field of your JSON:
\`\`\`
${generateLightingLuau(lightingPreset).trim()}
\`\`\`
`

  return BUILDING_SYSTEM_PROMPT_BASE + '\n\n' + themeSection
}

// ---------------------------------------------------------------------------
// Image analysis → system prompt injection
// ---------------------------------------------------------------------------

function buildImageContextBlock(analysis: ImageAnalysis): string {
  const hex2rgb = (hex: string): string => {
    const clean = hex.replace('#', '')
    const r = parseInt(clean.slice(0, 2), 16) / 255
    const g = parseInt(clean.slice(2, 4), 16) / 255
    const b = parseInt(clean.slice(4, 6), 16) / 255
    return `r=${r.toFixed(2)}, g=${g.toFixed(2)}, b=${b.toFixed(2)}`
  }

  const colorLines = analysis.colors
    .slice(0, 8)
    .map((hex, i) => `  Color ${i + 1}: ${hex} → Color3.new(${hex2rgb(hex)})`)
    .join('\n')

  const sourceLine = analysis.sourceGame
    ? `\nSource game style: ${analysis.sourceGame}`
    : ''

  return `
IMAGE REFERENCE ANALYSIS (MUST follow exactly):
Theme: ${analysis.theme}
Style: ${analysis.style}${sourceLine}
Objects detected: ${analysis.objects.join(', ')}
Lighting mood: ${analysis.lighting}
Scale: ${analysis.scale}
Summary: ${analysis.summary}

EXACT MATERIALS TO USE (from the image):
${analysis.materials.map((m) => `  - Enum.Material.${m}`).join('\n')}

EXACT COLORS TO USE (converted from image palette):
${colorLines}

STYLE RULES derived from image:
- Primary material: Enum.Material.${analysis.materials[0] ?? 'SmoothPlastic'}
- Secondary material: Enum.Material.${analysis.materials[1] ?? 'Cobblestone'}
- Dominant color: Color3.new(${hex2rgb(analysis.colors[0] ?? '#808080')})
- Accent color: Color3.new(${hex2rgb(analysis.colors[1] ?? '#D4AF37')})
- Style is "${analysis.style}" — ${
    analysis.style.includes('cartoon') || analysis.style.includes('pastel')
      ? 'use smooth rounded shapes, SmoothPlastic material, bright saturated colors, avoid sharp harsh edges'
      : analysis.style.includes('realistic')
        ? 'use detailed textures, Cobblestone/Slate/WoodPlanks materials, realistic proportions'
        : 'match the detected visual style closely'
  }

YOU MUST use the exact Color3 values and Enum.Material names above. Do not substitute different colors or materials.`
}

// ---------------------------------------------------------------------------
// Structure categories
// ---------------------------------------------------------------------------

const STRUCTURE_TYPES: Record<string, { defaultSize: { width: number; height: number; depth: number }; defaultParts: string[] }> = {
  castle:    { defaultSize: { width: 120, height: 80, depth: 120 }, defaultParts: ['keep', 'towers', 'walls', 'gate', 'moat'] },
  house:     { defaultSize: { width: 30, height: 20, depth: 25 },  defaultParts: ['walls', 'roof', 'door', 'windows'] },
  tower:     { defaultSize: { width: 15, height: 60, depth: 15 },  defaultParts: ['base', 'shaft', 'battlements'] },
  shop:      { defaultSize: { width: 25, height: 18, depth: 20 },  defaultParts: ['walls', 'roof', 'sign', 'counter'] },
  bridge:    { defaultSize: { width: 8,  height: 4,  depth: 60 },  defaultParts: ['deck', 'railings', 'supports'] },
  dungeon:   { defaultSize: { width: 60, height: 15, depth: 60 },  defaultParts: ['rooms', 'corridors', 'cells'] },
  arena:     { defaultSize: { width: 100, height: 30, depth: 100 }, defaultParts: ['floor', 'walls', 'stands', 'gate'] },
  village:   { defaultSize: { width: 200, height: 20, depth: 200 }, defaultParts: ['houses', 'well', 'paths', 'market'] },
}

// ---------------------------------------------------------------------------
// 3D Mesh generation result
// ---------------------------------------------------------------------------

export interface BuildMeshResult {
  meshJobId: string
  meshUrl: string | null
  fbxUrl: string | null
  thumbnailUrl: string | null
  polygonCount: number | null
  textures: { albedo: string; normal: string; roughness: string } | null
  meshCostUsd: number
  textureCostUsd: number
  luauCode: string
}

/**
 * Generate a real 3D mesh via Meshy + matching PBR textures via Fal, in parallel.
 * Falls back gracefully if API keys are missing.
 */
async function generateMeshAndTextures(params: {
  structureName: string
  type: string
  style: string
  theme?: string | null
  targetPolycount?: number
}): Promise<BuildMeshResult> {
  const { structureName, type, style, theme, targetPolycount = 20000 } = params
  const hasMeshyKey = !!process.env.MESHY_API_KEY
  const hasFalKey = !!(process.env.FAL_KEY ?? process.env.FAL_API_KEY)

  const base = theme ? `${style} ${theme}` : `${style} ${type}`
  const meshPrompt = `${base}, Roblox game asset, optimized for real-time rendering, detailed architecture`
  const texturePrompt = `${style} ${type} texture, game asset, PBR, physically based rendering`

  const [meshSettled, textureSettled] = await Promise.allSettled([
    hasMeshyKey
      ? meshyBreaker.execute(() =>
          textTo3DComplete({ prompt: meshPrompt, artStyle: 'realistic', targetPolycount })
        )
      : Promise.reject(new Error('MESHY_API_KEY not configured')),
    hasFalKey
      ? falBreaker.execute(() =>
          generateTextures({ prompt: texturePrompt, resolution: 1024 })
        )
      : Promise.reject(new Error('FAL_KEY not configured')),
  ])

  const meshResult = meshSettled.status === 'fulfilled' ? meshSettled.value : null
  const textureResult = textureSettled.status === 'fulfilled' ? textureSettled.value : null

  if (meshSettled.status === 'rejected') {
    console.error('[Meshy] Mesh generation failed:', meshSettled.reason)
  }
  if (textureSettled.status === 'rejected') {
    console.error('[FAL] Texture generation failed:', textureSettled.reason)
  }

  const meshUrl = (meshResult?.modelUrls?.glb ?? meshResult?.modelUrls?.fbx) as string | undefined ?? null
  const fbxUrl = (meshResult?.modelUrls?.fbx) as string | undefined ?? null
  const textures = textureResult
    ? { albedo: textureResult.albedo, normal: textureResult.normal, roughness: textureResult.roughness }
    : null

  const safeName = structureName.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 40)
  const jobId = meshResult?.jobId ?? `no-key-${Date.now()}`

  const meshLine = meshUrl
    ? `  -- Upload GLB to Roblox Studio > Asset Manager > 3D Importer, then replace asset ID\n  meshPart.MeshId = "rbxassetid://YOUR_MESH_ASSET_ID"  -- ${meshUrl}`
    : `  -- Set MESHY_API_KEY and re-run, or upload your own GLB\n  -- meshPart.MeshId = "rbxassetid://..."  -- poll GET /api/ai/mesh?taskId=${jobId}`

  const saLines = textures
    ? `  local sa = Instance.new("SurfaceAppearance")
  sa.ColorMap     = "rbxassetid://ALBEDO_ID"    -- ${textures.albedo}
  sa.NormalMap    = "rbxassetid://NORMAL_ID"    -- ${textures.normal}
  sa.RoughnessMap = "rbxassetid://ROUGH_ID"     -- ${textures.roughness}
  sa.TextureSynthesisEnabled = true
  sa.Parent = meshPart`
    : `  -- Set FAL_KEY to auto-generate PBR textures`

  const luauCode = `--[[
  ForjeAI MeshPart: ${structureName}
  Polygons: ${meshResult?.polygonCount?.toLocaleString() ?? 'unknown'} | Job: ${jobId}
  STEPS: 1) Download GLB  2) Import in Studio  3) Replace asset ID below
--]]
local function build_${safeName}(parentModel: Model?)
  local model = Instance.new("Model")
  model.Name = "${structureName}"

  local meshPart = Instance.new("MeshPart")
  meshPart.Name = "${structureName}_mesh"
${meshLine}
  meshPart.Size = Vector3.new(10, 10, 10) -- adjust to match imported asset scale
  meshPart.CFrame = CFrame.new(0, 5, 0)
  meshPart.Anchored = true
  meshPart.CastShadow = true
  meshPart.CollisionFidelity = Enum.CollisionFidelity.Default
  meshPart.RenderFidelity = Enum.RenderFidelity.Automatic
  meshPart.Parent = model

${saLines}

  model.PrimaryPart = meshPart
  model.Parent = parentModel or workspace
  return model
end

local builtModel = build_${safeName}()
print("[ForjeAI] Placed:", builtModel.Name)
`

  return {
    meshJobId: jobId,
    meshUrl,
    fbxUrl,
    thumbnailUrl: (meshResult?.thumbnailUrl) as string | undefined ?? null,
    polygonCount: meshResult?.polygonCount ?? null,
    textures,
    meshCostUsd: meshResult ? 0.2 : 0,
    textureCostUsd: textureResult ? textureResult.costUsd : 0,
    luauCode,
  }
}

// ---------------------------------------------------------------------------
// Agent implementation
// ---------------------------------------------------------------------------

export async function runBuildingAgent(command: AgentCommand): Promise<AgentResult> {
  const start = Date.now()
  const { parameters } = command

  const type = (parameters.type as string | undefined) ?? 'structure'
  const style = (parameters.style as string | undefined) ?? 'realistic'
  const position = (parameters.position as { x?: number; y?: number; z?: number } | undefined) ?? {}
  const imageAnalysis = (parameters.imageAnalysis as ImageAnalysis | undefined) ?? null

  // Demo fallback
  if (!process.env.ANTHROPIC_API_KEY) {
    return demoBuildResult(type, style, position, start, imageAnalysis)
  }

  const typeDefaults = STRUCTURE_TYPES[type.toLowerCase()] ?? STRUCTURE_TYPES.house

  // Prefer expandedPrompt from intent parser if available, otherwise expand locally.
  // When imageAnalysis is provided, use its theme/objects to shape the prompt.
  const expandedFromIntent = parameters.expandedPrompt as string | undefined
  const imageTheme = imageAnalysis ? imageAnalysis.theme : null
  const imageObjects = imageAnalysis ? imageAnalysis.objects.slice(0, 8).join(', ') : null

  const rawPrompt = expandedFromIntent
    ?? (imageAnalysis
        ? `Design a ${imageAnalysis.style} ${imageTheme ?? type} in the style described by the reference image analysis. Include these elements: ${imageObjects}. Position: x=${position.x ?? 0}, z=${position.z ?? 0}. Approximate size: ${JSON.stringify(typeDefaults.defaultSize)} studs.`
        : `Design a ${style} ${type}. Position: x=${position.x ?? 0}, z=${position.z ?? 0}. Approximate size: ${JSON.stringify(typeDefaults.defaultSize)} studs. Include ${typeDefaults.defaultParts.join(', ')}.`)
  const prompt = expandedFromIntent ? rawPrompt : expandPrompt(rawPrompt)

  // Auto-detect theme and lighting from the full prompt text
  const fullPromptText = [
    parameters.expandedPrompt,
    type,
    style,
    imageAnalysis?.theme,
    imageAnalysis?.style,
    imageAnalysis?.objects?.join(' '),
  ]
    .filter(Boolean)
    .join(' ')

  const detectedTheme: ThemeName = detectTheme(fullPromptText)
  const detectedLighting: LightingPresetName = detectLightingPreset(fullPromptText)

  // Build theme-aware system prompt, then inject image analysis context when available
  const themeSystemPrompt = buildSystemPrompt(detectedTheme, detectedLighting)
  const systemPrompt = imageAnalysis
    ? `${themeSystemPrompt}\n${buildImageContextBlock(imageAnalysis)}`
    : themeSystemPrompt

  try {
    const result = await anthropicBreaker.execute(() =>
      claudeChat(
        [{ role: 'user', content: prompt }],
        { systemPrompt, maxTokens: 8000, temperature: 0.2 }
      )
    )

    let buildPlan: Record<string, unknown> = {}
    try {
      const raw = result.content.replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim()
      buildPlan = JSON.parse(raw)
    } catch {
      buildPlan = { raw: result.content, structures: [] }
    }

    const structures = (buildPlan.structures as Record<string, unknown>[] | undefined) ?? []

    // Generate real 3D meshes + PBR textures in parallel for each structure
    const meshPromises = structures.map(async (structure) => {
      const sName = String(structure.name ?? type)
      const sType = String(structure.type ?? type)
      const sStyle = String(structure.style ?? style)
      const polycount = Math.min(30000, Math.max(5000, (structure.targetPolycount as number | undefined) ?? 20000))
      try {
        return await generateMeshAndTextures({
          structureName: sName,
          type: sType,
          style: sStyle,
          theme: imageAnalysis?.theme ?? null,
          targetPolycount: polycount,
        })
      } catch (err) {
        console.error(`[Meshy] Structure "${sName}" mesh failed:`, err)
        return null
      }
    })

    // If Claude returned no structures (e.g. JSON parse fail), still try one mesh
    if (structures.length === 0) {
      const singleMesh = await generateMeshAndTextures({
        structureName: `${style} ${type}`,
        type,
        style,
        theme: imageAnalysis?.theme ?? null,
        targetPolycount: 20000,
      }).catch(() => null)

      return {
        success: true,
        message: `${style} ${type}${singleMesh?.meshUrl ? ' — 3D mesh generated' : ' — add MESHY_API_KEY for real mesh'}.`,
        tokensUsed: result.totalTokens,
        changes: [{
          type: 'building' as const,
          description: `${style} ${type}`,
          position: { x: position.x ?? 0, y: 0, z: position.z ?? 0 },
          metadata: { meshResult: singleMesh, luauCode: singleMesh?.luauCode },
        }],
        duration: Date.now() - start,
        agent: 'building',
        data: { buildPlan, meshResults: [singleMesh], detectedTheme, detectedLighting },
      }
    }

    const meshResults = await Promise.all(meshPromises)

    const changes: GameChange[] = structures.map((s, i) => {
      const pos = s.position as { x: number; y: number; z: number } | undefined
      const meshResult = meshResults[i]
      return {
        type: 'building' as const,
        description: `${s.style ?? style} ${s.type ?? type}${meshResult?.meshUrl ? ' — 3D mesh ready' : ''}`,
        position: pos ? { x: pos.x, y: pos.y, z: pos.z } : { x: position.x ?? 0, y: 0, z: position.z ?? 0 },
        metadata: { marketplaceQuery: s.marketplaceQuery, parts: s.parts, meshResult, luauCode: meshResult?.luauCode },
      }
    })

    const instanceCount = (buildPlan.totalInstanceCount as number | undefined) ?? 0
    const meshesReady = meshResults.filter((m) => m?.meshUrl).length
    const totalMeshCost = meshResults.reduce((sum, m) => sum + (m?.meshCostUsd ?? 0) + (m?.textureCostUsd ?? 0), 0)

    const combinedLuau = meshResults
      .filter((m): m is BuildMeshResult => m !== null && !!m.luauCode)
      .map((m) => m.luauCode)
      .join('\n\n-- ── Next structure ──────────────────────────────────────\n\n')

    return {
      success: true,
      message: `${type} designed: ${structures.length} structure(s), ~${instanceCount} instances. ${meshesReady}/${structures.length} meshes generated. Cost: $${totalMeshCost.toFixed(3)}. Theme: ${detectedTheme}.`.trim(),
      tokensUsed: result.totalTokens,
      changes,
      duration: Date.now() - start,
      agent: 'building',
      data: { ...buildPlan, meshResults, combinedLuau, totalMeshCostUsd: totalMeshCost, detectedTheme, detectedLighting },
    }
  } catch (err) {
    return {
      success: false,
      message: `Building agent failed: ${err instanceof Error ? err.message : String(err)}`,
      tokensUsed: 0,
      changes: [],
      duration: Date.now() - start,
      agent: 'building',
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

/**
 * place_building(type, position, style, imageAnalysis?) — public API
 */
export async function placeBuilding(
  type: string,
  position: { x: number; y: number; z: number },
  style: string,
  context: AgentCommand['context'],
  imageAnalysis?: ImageAnalysis
): Promise<AgentResult> {
  return runBuildingAgent({
    intent: 'build_structure',
    parameters: { type, position, style, ...(imageAnalysis ? { imageAnalysis } : {}) },
    context,
  })
}

/**
 * modify_building(id, changes) — update an existing structure
 */
export async function modifyBuilding(
  buildingId: string,
  changes: Record<string, unknown>,
  context: AgentCommand['context']
): Promise<AgentResult> {
  return runBuildingAgent({
    intent: 'build_structure',
    parameters: { buildingId, changes, operation: 'modify', type: 'existing', style: 'matching' },
    context,
  })
}

// ---------------------------------------------------------------------------
// Demo helper
// ---------------------------------------------------------------------------

function demoBuildResult(
  type: string,
  style: string,
  position: { x?: number; y?: number; z?: number },
  start: number,
  imageAnalysis?: ImageAnalysis | null
): AgentResult {
  const defaults = STRUCTURE_TYPES[type.toLowerCase()] ?? STRUCTURE_TYPES.house
  const effectiveStyle = imageAnalysis?.style ?? style
  const effectiveType = imageAnalysis?.theme ?? type
  const imageNote = imageAnalysis
    ? ` Matched to image: ${imageAnalysis.theme} (${imageAnalysis.style} style, materials: ${imageAnalysis.materials.slice(0, 3).join(', ')}).`
    : ''
  return {
    success: true,
    message: `[Demo] ${effectiveStyle} ${effectiveType} designed at (${position.x ?? 0}, 0, ${position.z ?? 0}). Parts: ${defaults.defaultParts.join(', ')}.${imageNote} Set ANTHROPIC_API_KEY for real generation.`,
    tokensUsed: 0,
    changes: [
      {
        type: 'building',
        description: `${effectiveStyle} ${effectiveType}`,
        position: { x: position.x ?? 0, y: 0, z: position.z ?? 0 },
        metadata: {
          size: defaults.defaultSize,
          parts: defaults.defaultParts,
          marketplaceQuery: `${effectiveStyle} ${effectiveType} roblox`,
          imageAnalysis: imageAnalysis ?? undefined,
        },
      },
    ],
    duration: Date.now() - start,
    agent: 'building',
    data: { demo: true, type: effectiveType, style: effectiveStyle, position, imageAnalysis },
  }
}
