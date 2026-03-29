/**
 * Building agent — places and modifies structures in Roblox games.
 * Uses Claude to plan structure layouts and marketplace search for assets.
 */

import { claudeChat } from '../ai/providers/anthropic'
import { anthropicBreaker } from '../ai/circuit-breaker'
import type { AgentCommand, AgentResult, GameChange } from './types'

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const BUILDING_SYSTEM_PROMPT = `You are a Roblox structure designer. Given a build request, return ONLY valid JSON:
{
  "structures": [
    {
      "name": string,
      "type": string,
      "style": string,
      "position": {"x": number, "y": number, "z": number},
      "size": {"width": number, "height": number, "depth": number},
      "parts": [{"name": string, "shape": string, "color": string, "material": string}],
      "marketplaceQuery": string,
      "instanceCount": number
    }
  ],
  "totalInstanceCount": number,
  "buildScript": string,
  "description": string
}

Rules:
- Roblox coordinates in studs (1 stud ≈ 0.28 meters)
- Keep totalInstanceCount below 5000 per structure
- materialss: SmoothPlastic, Brick, Wood, Cobblestone, Metal, Neon, Glass, Concrete
- style options: realistic, low-poly, cartoon, modern, medieval, sci-fi, fantasy
- marketplaceQuery: short search string to find this asset on Roblox marketplace`

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
  const prompt = `Design a ${style} ${type}. Position: x=${position.x ?? 0}, z=${position.z ?? 0}. Approximate size: ${JSON.stringify(typeDefaults.defaultSize)} studs. Include ${typeDefaults.defaultParts.join(', ')}.`

  try {
    const result = await anthropicBreaker.execute(() =>
      claudeChat(
        [{ role: 'user', content: prompt }],
        { systemPrompt: BUILDING_SYSTEM_PROMPT, maxTokens: 2000, temperature: 0.3 }
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
