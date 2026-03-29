/**
 * Building agent — places and modifies structures in Roblox games.
 * Uses Claude to plan structure layouts and marketplace search for assets.
 */

import { claudeChat } from '../ai/providers/anthropic'
import { anthropicBreaker } from '../ai/circuit-breaker'
import type { AgentCommand, AgentResult, GameChange } from './types'

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
// System prompt
// ---------------------------------------------------------------------------

const BUILDING_SYSTEM_PROMPT = `You are a senior Roblox Studio architect who generates professional-quality builds identical to those seen in top games like Adopt Me, Blox Fruits, and Pet Simulator X.

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
  "description": string
}

CRITICAL RULES — every output must follow these:

SCALE (realistic studs, 1 stud ≈ 0.28 m):
- Castle wall: 4 studs thick, 20-30 studs tall minimum
- Tower: 8-12 studs diameter, 40-60 studs tall
- Door: 4 studs wide, 7 studs tall
- House: 30-50 studs wide, 15-25 studs tall
- Floor/ceiling: 1-2 studs thick
- Never use 1x1x1 Parts as buildings

MATERIALS (never use plain Plastic):
- Stone/castle: Cobblestone, Slate, SmoothPlastic (dark grey), Concrete
- Wood: WoodPlanks, Wood
- Metal: Metal, SmoothPlastic (grey)
- Ground/paths: Cobblestone, Ground, Mud, Sand, Grass
- Marble/fancy: Marble, Granite, SmoothPlastic (white/cream)
- Glass: Glass (transparency 0.3-0.6)

COLOR3 VALUES (realistic):
- Stone grey: r=0.63, g=0.63, b=0.63
- Dark stone: r=0.38, g=0.37, b=0.38
- Warm wood brown: r=0.49, g=0.33, b=0.18
- Dark wood: r=0.29, g=0.18, b=0.09
- Roof tile red: r=0.58, g=0.24, b=0.13
- Sand/cream: r=0.94, g=0.88, b=0.69
- Lava orange: r=1.0, g=0.42, b=0.0
- Sky blue glass: r=0.6, g=0.8, b=1.0
- Torch orange light: r=1.0, g=0.65, b=0.2
- Moonlight blue: r=0.5, g=0.7, b=1.0

LIGHTING — always include where natural:
- Torches: PointLight, brightness=2, range=16, color orange
- Lanterns: PointLight, brightness=1.5, range=12, color warm white
- Fire: PointLight brightness=3, range=20, animated (add a Fire particle via script)
- Interior: SurfaceLight on ceiling Parts, brightness=0.8
- Spotlights on statues/signs: SpotLight, face=Top, brightness=2

BUILDSCRIPT field: must be a COMPLETE runnable Luau script that:
1. Creates an Instance.new("Model") named after the structure, parented to workspace
2. Uses Instance.new("Part") / Instance.new("WedgePart") etc. for every major component
3. Sets .Size, .CFrame (use CFrame.new(x,y,z) * CFrame.Angles(rx,ry,rz)), .Material (Enum.Material.Cobblestone etc.), .Color (Color3.new(r,g,b)), .Anchored=true, .CastShadow
4. Adds PointLight/SpotLight children where specified
5. Adds a Fire or Smoke instance for forges/torches
6. Groups all Parts into the Model
7. Uses descriptive variable names (e.g. castleWallNorth, mainGateLeft)
8. Includes comments explaining each major section

LUAUSCRIPT per structure: per-structure script that handles interactivity (doors opening, lights flickering, etc.)

Keep totalInstanceCount below 8000. Generate at minimum 15-25 named Parts per structure so builds look detailed.`

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
// Agent implementation
// ---------------------------------------------------------------------------

export async function runBuildingAgent(command: AgentCommand): Promise<AgentResult> {
  const start = Date.now()
  const { parameters } = command

  const type = (parameters.type as string | undefined) ?? 'structure'
  const style = (parameters.style as string | undefined) ?? 'realistic'
  const position = (parameters.position as { x?: number; y?: number; z?: number } | undefined) ?? {}

  // Demo fallback
  if (!process.env.ANTHROPIC_API_KEY) {
    return demoBuildResult(type, style, position, start)
  }

  const typeDefaults = STRUCTURE_TYPES[type.toLowerCase()] ?? STRUCTURE_TYPES.house
  // Prefer expandedPrompt from intent parser if available, otherwise expand locally
  const expandedFromIntent = parameters.expandedPrompt as string | undefined
  const rawPrompt = expandedFromIntent
    ?? `Design a ${style} ${type}. Position: x=${position.x ?? 0}, z=${position.z ?? 0}. Approximate size: ${JSON.stringify(typeDefaults.defaultSize)} studs. Include ${typeDefaults.defaultParts.join(', ')}.`
  const prompt = expandedFromIntent ? rawPrompt : expandPrompt(rawPrompt)

  try {
    const result = await anthropicBreaker.execute(() =>
      claudeChat(
        [{ role: 'user', content: prompt }],
        { systemPrompt: BUILDING_SYSTEM_PROMPT, maxTokens: 8000, temperature: 0.2 }
      )
    )

    let buildPlan: Record<string, unknown> = {}
    try {
      const raw = result.content.replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim()
      buildPlan = JSON.parse(raw)
    } catch {
      buildPlan = { raw: result.content, structures: [] }
    }

    const structures = (buildPlan.structures as unknown[]) ?? []

    const changes: GameChange[] = structures.map((s) => {
      const structure = s as Record<string, unknown>
      const pos = structure.position as { x: number; y: number; z: number } | undefined
      return {
        type: 'building' as const,
        description: `${structure.style ?? style} ${structure.type ?? type} — ${structure.instanceCount ?? 'unknown'} instances`,
        position: pos ? { x: pos.x, y: pos.y, z: pos.z } : { x: position.x ?? 0, y: 0, z: position.z ?? 0 },
        metadata: { marketplaceQuery: structure.marketplaceQuery, parts: structure.parts },
      }
    })

    const instanceCount = (buildPlan.totalInstanceCount as number | undefined) ?? 0

    return {
      success: true,
      message: `${type} designed: ${structures.length} structure(s), ~${instanceCount} instances. ${buildPlan.description ?? ''}`.trim(),
      tokensUsed: result.totalTokens,
      changes,
      duration: Date.now() - start,
      agent: 'building',
      data: buildPlan,
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
 * place_building(type, position, style) — public API
 */
export async function placeBuilding(
  type: string,
  position: { x: number; y: number; z: number },
  style: string,
  context: AgentCommand['context']
): Promise<AgentResult> {
  return runBuildingAgent({
    intent: 'build_structure',
    parameters: { type, position, style },
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
  start: number
): AgentResult {
  const defaults = STRUCTURE_TYPES[type.toLowerCase()] ?? STRUCTURE_TYPES.house
  return {
    success: true,
    message: `[Demo] ${style} ${type} designed at (${position.x ?? 0}, 0, ${position.z ?? 0}). Parts: ${defaults.defaultParts.join(', ')}. Set ANTHROPIC_API_KEY for real generation.`,
    tokensUsed: 0,
    changes: [
      {
        type: 'building',
        description: `${style} ${type}`,
        position: { x: position.x ?? 0, y: 0, z: position.z ?? 0 },
        metadata: { size: defaults.defaultSize, parts: defaults.defaultParts, marketplaceQuery: `${style} ${type} roblox` },
      },
    ],
    duration: Date.now() - start,
    agent: 'building',
    data: { demo: true, type, style, position },
  }
}
