/**
 * Terrain agent — generates and modifies Roblox terrain using Claude-generated
 * heightmap plans. When no API key is present, returns a descriptive demo result.
 */

import { claudeChat } from '../ai/providers/anthropic'
import { anthropicBreaker } from '../ai/circuit-breaker'
import type { AgentCommand, AgentResult, GameChange } from './types'

// ---------------------------------------------------------------------------
// Terrain biome definitions
// ---------------------------------------------------------------------------

const BIOME_DEFAULTS: Record<string, { elevation: number; features: string[] }> = {
  plains:    { elevation: 10,  features: ['grass', 'scattered_trees'] },
  forest:    { elevation: 15,  features: ['dense_trees', 'undergrowth', 'rivers'] },
  mountain:  { elevation: 120, features: ['rocky_peaks', 'snow_cap', 'cliff_faces'] },
  desert:    { elevation: 5,   features: ['dunes', 'cacti', 'oasis'] },
  ocean:     { elevation: -30, features: ['water', 'waves', 'coral'] },
  tundra:    { elevation: 20,  features: ['snow', 'ice_patches', 'sparse_trees'] },
  volcanic:  { elevation: 80,  features: ['lava', 'ash', 'obsidian_rocks'] },
  tropical:  { elevation: 8,   features: ['palms', 'water', 'colorful_flowers'] },
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const TERRAIN_SYSTEM_PROMPT = `You are a senior Roblox terrain architect. Generate professional Roblox terrain that rivals Adopt Me, Natural Disaster Survival, and MeepCity in visual quality.

Output ONLY valid JSON with this exact structure:
{
  "zones": [
    {
      "name": string,
      "type": string,
      "x": number, "z": number,
      "width": number, "height": number,
      "elevation": number,
      "biome": string,
      "material": string,
      "color3": {"r": number, "g": number, "b": number}
    }
  ],
  "features": [
    {
      "type": string,
      "x": number, "z": number,
      "radius": number,
      "elevation": number,
      "material": string,
      "properties": {}
    }
  ],
  "atmosphere": {
    "density": number,
    "offset": number,
    "color": {"r": number, "g": number, "b": number},
    "glare": number,
    "haze": number
  },
  "lighting": {
    "ambientColor": {"r": number, "g": number, "b": number},
    "brightness": number,
    "timeOfDay": string,
    "shadowSoftness": number,
    "bloomEnabled": boolean,
    "bloomIntensity": number
  },
  "heightmap": {"resolution": 64, "description": string},
  "metadata": {
    "totalWidth": number,
    "totalHeight": number,
    "style": string,
    "theme": string,
    "instanceEstimate": number
  },
  "buildScript": string
}

TERRAIN MATERIAL MAP (use Enum.Material values):
- Grass:      Enum.Material.Grass       — rolling plains, meadows
- Mud:        Enum.Material.Mud         — swamps, riverbanks
- Sand:       Enum.Material.Sand        — beaches, deserts
- Rock:       Enum.Material.Rock        — mountain faces
- Sandstone:  Enum.Material.Sandstone   — desert cliffs
- Snow:       Enum.Material.Snow        — mountain tops, tundra
- Ice:        Enum.Material.Glacier     — frozen lakes
- WoodPlanks: Enum.Material.WoodPlanks  — wooden docks/bridges
- SmoothRock: Enum.Material.SmoothRock  — polished stone features
- Ground:     Enum.Material.Ground      — dirt paths
- Asphalt:    Enum.Material.Asphalt     — roads
- Water:      fill with Water material  — rivers, lakes, oceans

BIOME COLOUR PALETTES:
- plains:   grass r=0.42,g=0.67,b=0.29 | dirt r=0.6,g=0.45,b=0.27
- forest:   dark grass r=0.25,g=0.47,b=0.18 | bark r=0.29,g=0.18,b=0.09
- mountain: rock r=0.48,g=0.45,b=0.40 | snow r=0.96,g=0.96,b=0.98
- desert:   sand r=0.93,g=0.80,b=0.52 | rock r=0.67,g=0.48,b=0.29
- ocean:    water r=0.06,g=0.48,b=0.71 | sand r=0.90,g=0.84,b=0.65
- tundra:   snow r=0.90,g=0.92,b=0.96 | ice r=0.72,g=0.84,b=0.93
- volcanic: basalt r=0.17,g=0.15,b=0.15 | lava r=1.0,g=0.42,b=0.0
- tropical: vivid grass r=0.29,g=0.72,b=0.24 | water r=0.0,g=0.72,b=0.84

ATMOSPHERE DEFAULTS BY BIOME:
- plains/forest: density=0.3, haze=0.3, glare=0.1, color pale blue
- mountain: density=0.15, haze=0.1, glare=0.3, color white-grey
- desert: density=0.5, haze=0.8, glare=0.5, color warm orange-yellow
- ocean: density=0.2, haze=0.2, glare=0.2, color light blue
- volcanic: density=0.8, haze=0.9, glare=0.3, color dark red-grey

BUILDSCRIPT field — must be a COMPLETE runnable Luau script that:
1. Gets workspace.Terrain
2. Uses Terrain:FillBlock(CFrame.new(x,y,z), Vector3.new(w,h,d), Enum.Material.Grass) for flat zones
3. Uses Terrain:FillCylinder(CFrame.new(x,y,z), height, radius, Enum.Material.Rock) for hills/mountains
4. Uses Terrain:FillWedge(CFrame.new(x,y,z), Vector3.new(w,h,d), Enum.Material.Rock) for cliff faces
5. Uses Terrain:FillBall(CFrame.new(x,y,z), radius, Enum.Material.Sand) for dunes/rounded hills
6. Adds a Water fill for rivers/lakes using Terrain:FillBlock with Enum.Material.Water
7. Configures game.Lighting with the atmosphere settings (Atmosphere instance, BloomEffect, ColorCorrection)
8. Adds Atmosphere instance parented to Lighting with correct density/offset/haze/glare/color
9. Adds a BloomEffect if bloomEnabled=true
10. Uses descriptive variable names and section comments
11. After terrain fills, adds surface detail Parts: rocks (Slate material), tree trunks (WoodPlanks), boulders (Rock)

Keep instanceEstimate below 20000. Generate at least 5-8 distinct zones per terrain.`

// ---------------------------------------------------------------------------
// Agent implementation
// ---------------------------------------------------------------------------

export async function runTerrainAgent(command: AgentCommand): Promise<AgentResult> {
  const start = Date.now()
  const { parameters, context } = command

  const biome = (parameters.biome as string | undefined) ?? 'plains'
  const size = (parameters.size as { width?: number; height?: number } | undefined) ?? {}
  const features = (parameters.features as string[] | undefined) ?? []
  const operation = (parameters.operation as string | undefined) ?? 'generate'

  // Demo fallback when no API key
  if (!process.env.ANTHROPIC_API_KEY) {
    return demoBuildResult(biome, size, operation, start)
  }

  const biomeDefaults = BIOME_DEFAULTS[biome] ?? BIOME_DEFAULTS.plains
  const width = size.width ?? 1000
  const height = size.height ?? 1000

  const expandedFromIntent = parameters.expandedPrompt as string | undefined
  const baseMessage = operation === 'modify'
    ? `Modify terrain in region (${parameters.region ?? 'center area'}): ${parameters.description ?? biome}`
    : `Generate a ${biome} terrain ${width}×${height} studs. Features requested: ${features.join(', ') || 'natural variety'}. Elevation target: ${biomeDefaults.elevation} studs. Include realistic surface detail: rocks, paths, water features, and atmospheric effects.`
  const userMessage = expandedFromIntent ?? baseMessage

  try {
    const result = await anthropicBreaker.execute(() =>
      claudeChat(
        [{ role: 'user', content: userMessage }],
        { systemPrompt: TERRAIN_SYSTEM_PROMPT, maxTokens: 6000, temperature: 0.2 }
      )
    )

    let terrainPlan: Record<string, unknown> = {}
    try {
      const raw = result.content.replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim()
      terrainPlan = JSON.parse(raw)
    } catch {
      terrainPlan = { raw: result.content, zones: [], features: [] }
    }

    const zones = (terrainPlan.zones as unknown[]) ?? []
    const metadata = terrainPlan.metadata as Record<string, unknown> | undefined

    const changes: GameChange[] = zones.map((z) => {
      const zone = z as Record<string, unknown>
      return {
        type: 'terrain' as const,
        description: `${zone.biome ?? biome} zone at (${zone.x ?? 0}, ${zone.z ?? 0}) — ${zone.width ?? 100}×${zone.height ?? 100} studs`,
        position: { x: Number(zone.x ?? 0), y: Number(zone.elevation ?? 0), z: Number(zone.z ?? 0) },
        metadata: zone,
      }
    })

    return {
      success: true,
      message: `Terrain ${operation === 'modify' ? 'modified' : 'generated'}: ${biome} biome, ${zones.length} zones, ~${metadata?.instanceEstimate ?? 'unknown'} instances.`,
      tokensUsed: result.totalTokens,
      changes,
      duration: Date.now() - start,
      agent: 'terrain',
      data: terrainPlan,
    }
  } catch (err) {
    return {
      success: false,
      message: `Terrain agent failed: ${err instanceof Error ? err.message : String(err)}`,
      tokensUsed: 0,
      changes: [],
      duration: Date.now() - start,
      agent: 'terrain',
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

/**
 * generate_terrain(biome, size, features) — public surface exposed by the agent
 */
export async function generateTerrain(
  biome: string,
  size: { width: number; height: number },
  features: string[],
  context: AgentCommand['context']
): Promise<AgentResult> {
  return runTerrainAgent({
    intent: 'modify_terrain',
    parameters: { biome, size, features, operation: 'generate' },
    context,
  })
}

/**
 * modify_terrain(region, operation) — reshape an existing terrain area
 */
export async function modifyTerrain(
  region: string,
  operation: string,
  description: string,
  context: AgentCommand['context']
): Promise<AgentResult> {
  return runTerrainAgent({
    intent: 'modify_terrain',
    parameters: { region, operation, description },
    context,
  })
}

// ---------------------------------------------------------------------------
// Demo helper
// ---------------------------------------------------------------------------

function demoBuildResult(
  biome: string,
  size: { width?: number; height?: number },
  operation: string,
  start: number
): AgentResult {
  const w = size.width ?? 1000
  const h = size.height ?? 1000
  const defaults = BIOME_DEFAULTS[biome] ?? BIOME_DEFAULTS.plains

  return {
    success: true,
    message: `[Demo] ${operation === 'modify' ? 'Modified' : 'Generated'} ${biome} terrain (${w}×${h} studs). Features: ${defaults.features.join(', ')}. Set ANTHROPIC_API_KEY for real generation.`,
    tokensUsed: 0,
    changes: [
      {
        type: 'terrain',
        description: `${biome} terrain zone — ${w}×${h} studs`,
        position: { x: 0, y: defaults.elevation, z: 0 },
        metadata: { biome, width: w, height: h, features: defaults.features },
      },
    ],
    duration: Date.now() - start,
    agent: 'terrain',
    data: { demo: true, biome, size: { width: w, height: h }, features: defaults.features },
  }
}
