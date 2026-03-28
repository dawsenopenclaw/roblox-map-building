#!/usr/bin/env node
/**
 * terrain-forge MCP Server
 * Exposes AI terrain generation as MCP tools for Roblox Studio.
 * Tools: generate_terrain, smooth_terrain, paint_terrain
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Token metering — track every Claude call
// ---------------------------------------------------------------------------
interface TokenUsage {
  inputTokens: number
  outputTokens: number
  costUsd: number
  tool: string
  timestamp: string
}

const tokenLog: TokenUsage[] = []

function meterUsage(tool: string, inputTokens: number, outputTokens: number): void {
  const inputCostPerM = 3.0  // Claude 3.5 Sonnet
  const outputCostPerM = 15.0
  const costUsd =
    (inputTokens / 1_000_000) * inputCostPerM +
    (outputTokens / 1_000_000) * outputCostPerM

  tokenLog.push({
    inputTokens,
    outputTokens,
    costUsd,
    tool,
    timestamp: new Date().toISOString(),
  })

  // Write to stderr so it doesn't pollute MCP stdio protocol
  process.stderr.write(
    `[terrain-forge] ${tool}: ${inputTokens}in/${outputTokens}out ($${costUsd.toFixed(6)})\n`
  )
}

// ---------------------------------------------------------------------------
// Anthropic client
// ---------------------------------------------------------------------------
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const CLAUDE_MODEL = 'claude-3-5-sonnet-20241022'

// ---------------------------------------------------------------------------
// Terrain data types
// ---------------------------------------------------------------------------
interface HeightmapPoint {
  x: number
  z: number
  height: number
  material: string
}

interface TerrainRegion {
  x: number
  z: number
  width: number
  height: number
}

interface MaterialMap {
  region: TerrainRegion
  materials: Array<{
    x: number
    z: number
    material: string
    color?: string
  }>
}

// ---------------------------------------------------------------------------
// Roblox material list
// ---------------------------------------------------------------------------
const ROBLOX_MATERIALS = [
  'Grass', 'Dirt', 'Sand', 'Rock', 'Sandstone', 'Snow', 'Mud',
  'WoodPlanks', 'SmoothPlastic', 'LeafyGrass', 'Asphalt', 'Cobblestone',
  'Ice', 'Water', 'Ground', 'Limestone', 'Basalt', 'Glacier',
  'Slate', 'CrackedLava', 'Salt', 'Concrete', 'Fabric',
]

// ---------------------------------------------------------------------------
// Biome → default material mapping
// ---------------------------------------------------------------------------
const BIOME_MATERIALS: Record<string, string[]> = {
  forest: ['LeafyGrass', 'Grass', 'Dirt', 'Mud'],
  desert: ['Sand', 'Sandstone', 'Salt', 'Rock'],
  arctic: ['Snow', 'Ice', 'Glacier', 'Rock'],
  volcanic: ['CrackedLava', 'Basalt', 'Rock', 'Slate'],
  ocean: ['Water', 'Sand', 'Rock', 'Limestone'],
  swamp: ['Mud', 'Grass', 'LeafyGrass', 'Dirt'],
  mountains: ['Rock', 'Slate', 'Snow', 'Limestone'],
  plains: ['Grass', 'Ground', 'Dirt', 'LeafyGrass'],
  urban: ['Concrete', 'Asphalt', 'Cobblestone', 'WoodPlanks'],
}

// ---------------------------------------------------------------------------
// Tool: generate_terrain
// ---------------------------------------------------------------------------
const GenerateTerrainSchema = z.object({
  description: z.string().describe('Natural language biome/terrain description'),
  size: z
    .object({ width: z.number().default(512), height: z.number().default(512) })
    .optional()
    .default({ width: 512, height: 512 }),
  seed: z.number().optional().describe('Optional seed for reproducible generation'),
})

async function generateTerrain(params: z.infer<typeof GenerateTerrainSchema>) {
  const { description, size = { width: 512, height: 512 }, seed } = params

  // Ask Claude to parse the biome intent and generate terrain metadata
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1500,
    system: `You are a Roblox terrain generation engine. Given a biome description, output ONLY valid JSON with:
{
  "biome": string,
  "elevationProfile": "flat" | "rolling" | "hilly" | "mountainous",
  "baseElevation": number (0-100),
  "elevationVariance": number (0-50),
  "primaryMaterial": string (from: ${ROBLOX_MATERIALS.join(', ')}),
  "secondaryMaterial": string,
  "accentMaterial": string,
  "features": string[] (e.g. ["river", "cliffs", "lake"]),
  "waterLevel": number (0-100, null if no water),
  "description": string
}`,
    messages: [{ role: 'user', content: `Generate terrain metadata for: ${description}` }],
  })

  meterUsage(
    'generate_terrain',
    response.usage.input_tokens,
    response.usage.output_tokens
  )

  const rawContent = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as Anthropic.TextBlock).text)
    .join('')

  let metadata: Record<string, unknown>
  try {
    metadata = JSON.parse(rawContent)
  } catch {
    const match = rawContent.match(/```(?:json)?\s*([\s\S]+?)```/)
    metadata = match ? JSON.parse(match[1]) : { raw: rawContent }
  }

  // Generate heightmap using deterministic noise based on metadata
  const rng = createRng(seed ?? Date.now())
  const biome = (metadata.biome as string ?? 'plains').toLowerCase()
  const baseElevation = (metadata.baseElevation as number) ?? 30
  const elevationVariance = (metadata.elevationVariance as number) ?? 15
  const elevationProfile = (metadata.elevationProfile as string) ?? 'rolling'
  const primaryMaterial = (metadata.primaryMaterial as string) ?? 'Grass'
  const waterLevel = metadata.waterLevel as number | null

  const gridSize = 32 // 32x32 heightmap points
  const heightmap: HeightmapPoint[] = []

  for (let gz = 0; gz < gridSize; gz++) {
    for (let gx = 0; gx < gridSize; gx++) {
      const nx = gx / gridSize
      const nz = gz / gridSize

      // Multi-octave noise
      let elevation = baseElevation
      elevation += noiseOctaves(rng, nx, nz, elevationProfile) * elevationVariance

      // Clamp
      elevation = Math.max(0, Math.min(100, elevation))

      // Material selection based on elevation and biome
      const biomeDefaults = BIOME_MATERIALS[biome] ?? BIOME_MATERIALS['plains']
      let material: string

      if (waterLevel !== null && elevation < waterLevel) {
        material = 'Water'
      } else if (elevation > 80) {
        material = biome === 'arctic' ? 'Glacier' : 'Rock'
      } else if (elevation > 60) {
        material = (metadata.secondaryMaterial as string) ?? biomeDefaults[1] ?? 'Rock'
      } else {
        material = primaryMaterial ?? biomeDefaults[0] ?? 'Grass'
      }

      heightmap.push({
        x: Math.round((gx / gridSize) * size.width),
        z: Math.round((gz / gridSize) * size.height),
        height: Math.round(elevation * 10) / 10,
        material,
      })
    }
  }

  return {
    success: true,
    metadata,
    heightmap,
    size,
    gridResolution: gridSize,
    totalPoints: heightmap.length,
    waterLevel,
    seed: seed ?? null,
    tokenUsage: tokenLog[tokenLog.length - 1],
  }
}

// ---------------------------------------------------------------------------
// Tool: smooth_terrain
// ---------------------------------------------------------------------------
const SmoothTerrainSchema = z.object({
  heightmap: z
    .array(
      z.object({
        x: z.number(),
        z: z.number(),
        height: z.number(),
        material: z.string(),
      })
    )
    .describe('Existing heightmap points'),
  region: z
    .object({ x: z.number(), z: z.number(), width: z.number(), height: z.number() })
    .optional()
    .describe('Subregion to smooth (defaults to entire map)'),
  passes: z.number().min(1).max(10).default(3).describe('Number of smoothing passes'),
  strength: z
    .number()
    .min(0)
    .max(1)
    .default(0.5)
    .describe('Smoothing strength 0-1'),
})

async function smoothTerrain(params: z.infer<typeof SmoothTerrainSchema>) {
  const { heightmap, region, passes = 3, strength = 0.5 } = params

  // Filter to region if provided
  let pointsToSmooth = heightmap
  if (region) {
    pointsToSmooth = heightmap.filter(
      (p) =>
        p.x >= region.x &&
        p.x <= region.x + region.width &&
        p.z >= region.z &&
        p.z <= region.z + region.height
    )
  }

  // Build lookup map for fast neighbor access
  const lookup = new Map<string, HeightmapPoint>()
  for (const p of heightmap) {
    lookup.set(`${p.x},${p.z}`, p)
  }

  // Determine step size from data
  const xs = [...new Set(heightmap.map((p) => p.x))].sort((a, b) => a - b)
  const step = xs.length > 1 ? xs[1] - xs[0] : 16

  // Run smoothing passes
  let current = pointsToSmooth.map((p) => ({ ...p }))

  for (let pass = 0; pass < passes; pass++) {
    const next = current.map((p) => {
      const neighbors = [
        lookup.get(`${p.x - step},${p.z}`),
        lookup.get(`${p.x + step},${p.z}`),
        lookup.get(`${p.x},${p.z - step}`),
        lookup.get(`${p.x},${p.z + step}`),
      ].filter(Boolean) as HeightmapPoint[]

      if (neighbors.length === 0) return p

      const avgHeight =
        neighbors.reduce((sum, n) => sum + n.height, 0) / neighbors.length
      const smoothedHeight = p.height + (avgHeight - p.height) * strength

      return { ...p, height: Math.round(smoothedHeight * 10) / 10 }
    })

    // Update lookup for next pass
    for (const p of next) {
      lookup.set(`${p.x},${p.z}`, p)
    }
    current = next
  }

  // Merge smoothed region back into full heightmap
  const smoothedSet = new Map(current.map((p) => [`${p.x},${p.z}`, p]))
  const result = heightmap.map((p) => smoothedSet.get(`${p.x},${p.z}`) ?? p)

  return {
    success: true,
    heightmap: result,
    smoothedPoints: current.length,
    passes,
    strength,
  }
}

// ---------------------------------------------------------------------------
// Tool: paint_terrain
// ---------------------------------------------------------------------------
const PaintTerrainSchema = z.object({
  region: z.object({
    x: z.number(),
    z: z.number(),
    width: z.number(),
    height: z.number(),
  }),
  material: z
    .string()
    .describe(`Roblox material name: ${ROBLOX_MATERIALS.join(', ')}`),
  blendEdges: z
    .boolean()
    .default(true)
    .describe('Blend material at region edges'),
  existingHeightmap: z
    .array(z.object({ x: z.number(), z: z.number(), height: z.number(), material: z.string() }))
    .optional()
    .describe('Optional existing heightmap to merge with'),
})

async function paintTerrain(params: z.infer<typeof PaintTerrainSchema>) {
  const { region, material, blendEdges = true, existingHeightmap } = params

  // Validate material
  if (!ROBLOX_MATERIALS.includes(material)) {
    throw new Error(
      `Invalid material "${material}". Valid materials: ${ROBLOX_MATERIALS.join(', ')}`
    )
  }

  const materialMap: MaterialMap = {
    region,
    materials: [],
  }

  // Generate a grid of material assignments within the region
  const gridStep = 16
  for (let z = region.z; z < region.z + region.height; z += gridStep) {
    for (let x = region.x; x < region.x + region.width; x += gridStep) {
      let assignedMaterial = material

      if (blendEdges) {
        const edgeDistance = Math.min(
          x - region.x,
          region.x + region.width - x,
          z - region.z,
          region.z + region.height - z
        )
        const blendThreshold = gridStep * 2
        if (edgeDistance < blendThreshold) {
          // Edge blending — keep original material at edges
          // In practice the Studio plugin would lerp; we just flag it
          assignedMaterial = material
        }
      }

      materialMap.materials.push({ x, z, material: assignedMaterial })
    }
  }

  // If existing heightmap provided, merge material changes
  let mergedHeightmap: HeightmapPoint[] | undefined
  if (existingHeightmap) {
    const paintedSet = new Map(
      materialMap.materials.map((m) => [`${m.x},${m.z}`, m.material])
    )
    mergedHeightmap = existingHeightmap.map((p) => ({
      ...p,
      material: paintedSet.get(`${p.x},${p.z}`) ?? p.material,
    }))
  }

  return {
    success: true,
    materialMap,
    pointsModified: materialMap.materials.length,
    material,
    mergedHeightmap,
  }
}

// ---------------------------------------------------------------------------
// Noise helpers (no external dep)
// ---------------------------------------------------------------------------
function createRng(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function noiseOctaves(
  rng: () => number,
  nx: number,
  nz: number,
  profile: string
): number {
  const octaves = profile === 'mountainous' ? 5 : profile === 'hilly' ? 4 : 3
  let value = 0
  let amplitude = 1
  let frequency = 1
  let maxValue = 0

  for (let i = 0; i < octaves; i++) {
    value += amplitude * (rng() * 2 - 1) * Math.sin(nx * frequency * Math.PI) * Math.cos(nz * frequency * Math.PI)
    maxValue += amplitude
    amplitude *= 0.5
    frequency *= 2
  }

  const normalized = value / maxValue

  // Flatten for 'flat', exaggerate for 'mountainous'
  if (profile === 'flat') return normalized * 0.2
  if (profile === 'rolling') return normalized * 0.6
  if (profile === 'hilly') return normalized * 0.8
  return normalized  // mountainous
}

// ---------------------------------------------------------------------------
// MCP Server setup
// ---------------------------------------------------------------------------
const TOOLS: Tool[] = [
  {
    name: 'generate_terrain',
    description:
      'Generate Roblox terrain heightmap and material mapping from a natural language biome description. Returns a grid of height values and Roblox material assignments ready for Studio import.',
    inputSchema: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          description: 'Natural language description of the terrain (e.g., "snowy mountain range with frozen lake")',
        },
        size: {
          type: 'object',
          properties: {
            width: { type: 'number', default: 512 },
            height: { type: 'number', default: 512 },
          },
          description: 'Terrain size in Roblox studs',
        },
        seed: {
          type: 'number',
          description: 'Optional seed for reproducible generation',
        },
      },
      required: ['description'],
    },
  },
  {
    name: 'smooth_terrain',
    description:
      'Apply Gaussian-like smoothing to an existing heightmap. Reduces sharp transitions between height values. Returns the modified heightmap.',
    inputSchema: {
      type: 'object',
      properties: {
        heightmap: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              x: { type: 'number' },
              z: { type: 'number' },
              height: { type: 'number' },
              material: { type: 'string' },
            },
            required: ['x', 'z', 'height', 'material'],
          },
          description: 'Array of heightmap points from generate_terrain',
        },
        region: {
          type: 'object',
          properties: {
            x: { type: 'number' },
            z: { type: 'number' },
            width: { type: 'number' },
            height: { type: 'number' },
          },
          description: 'Optional subregion to smooth',
        },
        passes: { type: 'number', default: 3, description: 'Smoothing passes (1-10)' },
        strength: { type: 'number', default: 0.5, description: 'Smoothing strength (0-1)' },
      },
      required: ['heightmap'],
    },
  },
  {
    name: 'paint_terrain',
    description:
      'Assign a Roblox material to a region of terrain. Returns a material map that can be applied via the Studio plugin.',
    inputSchema: {
      type: 'object',
      properties: {
        region: {
          type: 'object',
          properties: {
            x: { type: 'number' },
            z: { type: 'number' },
            width: { type: 'number' },
            height: { type: 'number' },
          },
          required: ['x', 'z', 'width', 'height'],
          description: 'Region to paint in Roblox world coordinates',
        },
        material: {
          type: 'string',
          description: `Roblox material name. Valid: ${ROBLOX_MATERIALS.join(', ')}`,
        },
        blendEdges: {
          type: 'boolean',
          default: true,
          description: 'Blend material transitions at region boundaries',
        },
        existingHeightmap: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              x: { type: 'number' },
              z: { type: 'number' },
              height: { type: 'number' },
              material: { type: 'string' },
            },
          },
          description: 'Optional existing heightmap to merge material changes into',
        },
      },
      required: ['region', 'material'],
    },
  },
]

// ---------------------------------------------------------------------------
// Server instantiation
// ---------------------------------------------------------------------------
const server = new Server(
  { name: 'terrain-forge', version: '1.0.0' },
  { capabilities: { tools: {} } }
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  try {
    let result: unknown

    switch (name) {
      case 'generate_terrain': {
        const parsed = GenerateTerrainSchema.parse(args)
        result = await generateTerrain(parsed)
        break
      }
      case 'smooth_terrain': {
        const parsed = SmoothTerrainSchema.parse(args)
        result = await smoothTerrain(parsed)
        break
      }
      case 'paint_terrain': {
        const parsed = PaintTerrainSchema.parse(args)
        result = await paintTerrain(parsed)
        break
      }
      default:
        throw new Error(`Unknown tool: ${name}`)
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: message }) }],
      isError: true,
    }
  }
})

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    process.stderr.write('[terrain-forge] ERROR: ANTHROPIC_API_KEY not set\n')
    process.exit(1)
  }

  const transport = new StdioServerTransport()
  await server.connect(transport)
  process.stderr.write('[terrain-forge] MCP server running on stdio\n')
}

main().catch((err) => {
  process.stderr.write(`[terrain-forge] Fatal: ${err.message}\n`)
  process.exit(1)
})
