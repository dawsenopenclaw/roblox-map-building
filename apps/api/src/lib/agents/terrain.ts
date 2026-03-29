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

const TERRAIN_SYSTEM_PROMPT = `You are a Roblox terrain architect. Generate a terrain layout as JSON.
Output ONLY valid JSON with this structure:
{
  "zones": [
    {"name": string, "type": string, "x": number, "z": number, "width": number, "height": number, "elevation": number, "biome": string}
  ],
  "features": [
    {"type": string, "x": number, "z": number, "radius": number, "properties": {}}
  ],
  "heightmap": {"resolution": 64, "description": string},
  "metadata": {"totalWidth": number, "totalHeight": number, "style": string, "theme": string, "instanceEstimate": number}
}

Rules:
- Keep instanceEstimate below 20000 (Roblox performance limit)
- Use realistic Roblox coordinates (studs)
- Biomes: plains, forest, mountain, desert, ocean, tundra, volcanic, tropical
- Features: trees, rocks, water, bridges, paths, ruins, caves`

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

  const userMessage = operation === 'modify'
    ? `Modify terrain in region (${parameters.region ?? 'center area'}): ${parameters.description ?? biome}`
    : `Generate a ${biome} terrain ${width}×${height} studs. Features requested: ${features.join(', ') || 'natural variety'}. Elevation target: ${biomeDefaults.elevation} studs.`

  try {
    const result = await anthropicBreaker.execute(() =>
      claudeChat(
        [{ role: 'user', content: userMessage }],
        { systemPrompt: TERRAIN_SYSTEM_PROMPT, maxTokens: 2000, temperature: 0.2 }
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
