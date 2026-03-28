#!/usr/bin/env node
/**
 * city-architect MCP Server
 * Grid-based urban planning algorithms + Claude style interpretation.
 * Tools: generate_city_layout, generate_road_network, place_buildings
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
// Token metering
// ---------------------------------------------------------------------------
interface TokenUsage {
  inputTokens: number
  outputTokens: number
  costUsd: number
  tool: string
  timestamp: string
}

const sessionTokens: TokenUsage[] = []

function meterUsage(tool: string, inputTokens: number, outputTokens: number): TokenUsage {
  const costUsd =
    (inputTokens / 1_000_000) * 3.0 + (outputTokens / 1_000_000) * 15.0
  const entry: TokenUsage = {
    inputTokens,
    outputTokens,
    costUsd,
    tool,
    timestamp: new Date().toISOString(),
  }
  sessionTokens.push(entry)
  process.stderr.write(
    `[city-architect] ${tool}: ${inputTokens}in/${outputTokens}out ($${costUsd.toFixed(6)})\n`
  )
  return entry
}

// ---------------------------------------------------------------------------
// Anthropic
// ---------------------------------------------------------------------------
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const CLAUDE_MODEL = 'claude-3-5-sonnet-20241022'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface RoadSegment {
  id: string
  fromX: number
  fromZ: number
  toX: number
  toZ: number
  width: number
  type: 'main' | 'secondary' | 'alley' | 'highway'
}

interface BuildingPlacement {
  id: string
  x: number
  z: number
  width: number
  depth: number
  floors: number
  type: string
  style: string
  rotation: number
}

interface Zone {
  id: string
  name: string
  type: 'commercial' | 'residential' | 'industrial' | 'park' | 'civic' | 'mixed'
  x: number
  z: number
  width: number
  height: number
}

interface CityLayout {
  zones: Zone[]
  roads: RoadSegment[]
  buildings: BuildingPlacement[]
  bounds: { width: number; height: number }
  style: string
  metadata: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Urban planning grid algorithm
// ---------------------------------------------------------------------------
function createUrbanGrid(
  bounds: { width: number; height: number },
  style: string
): { roads: RoadSegment[]; zones: Zone[] } {
  const roads: RoadSegment[] = []
  const zones: Zone[] = []

  const isModern = style.includes('modern') || style.includes('urban')
  const isOrganic = style.includes('organic') || style.includes('village')

  // Grid spacing based on style
  const blockSize = isOrganic ? 80 : isModern ? 120 : 100
  const mainRoadWidth = isModern ? 20 : 16
  const secondaryRoadWidth = isModern ? 12 : 10
  const alleyWidth = 6

  let roadId = 0

  // Main roads (every 2 blocks)
  for (let x = 0; x <= bounds.width; x += blockSize * 2) {
    roads.push({
      id: `road-${roadId++}`,
      fromX: x,
      fromZ: 0,
      toX: x,
      toZ: bounds.height,
      width: mainRoadWidth,
      type: 'main',
    })
  }
  for (let z = 0; z <= bounds.height; z += blockSize * 2) {
    roads.push({
      id: `road-${roadId++}`,
      fromX: 0,
      fromZ: z,
      toX: bounds.width,
      toZ: z,
      width: mainRoadWidth,
      type: 'main',
    })
  }

  // Secondary roads (every block)
  for (let x = blockSize; x < bounds.width; x += blockSize * 2) {
    roads.push({
      id: `road-${roadId++}`,
      fromX: x,
      fromZ: 0,
      toX: x,
      toZ: bounds.height,
      width: secondaryRoadWidth,
      type: 'secondary',
    })
  }
  for (let z = blockSize; z < bounds.height; z += blockSize * 2) {
    roads.push({
      id: `road-${roadId++}`,
      fromX: 0,
      fromZ: z,
      toX: bounds.width,
      toZ: z,
      width: secondaryRoadWidth,
      type: 'secondary',
    })
  }

  // Optional alleys (for dense urban)
  if (isModern) {
    for (let x = blockSize / 2; x < bounds.width; x += blockSize) {
      roads.push({
        id: `road-${roadId++}`,
        fromX: x,
        fromZ: 0,
        toX: x,
        toZ: bounds.height,
        width: alleyWidth,
        type: 'alley',
      })
    }
  }

  // Zone generation based on concentric rings
  const centerX = bounds.width / 2
  const centerZ = bounds.height / 2

  let zoneId = 0
  const zoneTypes: Zone['type'][] = ['commercial', 'mixed', 'residential', 'industrial', 'park']

  for (let bz = 0; bz < bounds.height; bz += blockSize) {
    for (let bx = 0; bx < bounds.width; bx += blockSize) {
      const distFromCenter = Math.sqrt(
        Math.pow(bx - centerX, 2) + Math.pow(bz - centerZ, 2)
      )
      const maxDist = Math.sqrt(Math.pow(bounds.width, 2) + Math.pow(bounds.height, 2)) / 2

      let zoneType: Zone['type']
      const ratio = distFromCenter / maxDist

      if (ratio < 0.15) {
        zoneType = 'commercial'
      } else if (ratio < 0.3) {
        zoneType = 'mixed'
      } else if (ratio < 0.5) {
        zoneType = 'residential'
      } else if (ratio < 0.7) {
        zoneType = 'residential'
      } else if (bx % (blockSize * 4) < blockSize) {
        zoneType = 'park'
      } else {
        zoneType = 'industrial'
      }

      zones.push({
        id: `zone-${zoneId++}`,
        name: `${zoneType}-${zoneId}`,
        type: zoneType,
        x: bx + mainRoadWidth / 2,
        z: bz + mainRoadWidth / 2,
        width: blockSize - mainRoadWidth,
        height: blockSize - mainRoadWidth,
      })
    }
  }

  return { roads, zones }
}

// ---------------------------------------------------------------------------
// Building placement within zones
// ---------------------------------------------------------------------------
function placeBuildings(
  zones: Zone[],
  buildingTypes: string[],
  style: string
): BuildingPlacement[] {
  const buildings: BuildingPlacement[] = []
  let buildId = 0

  const zoneTypeToBuildingTypes: Record<Zone['type'], string[]> = {
    commercial: ['office', 'shop', 'restaurant', 'hotel', 'mall'],
    residential: ['house', 'apartment', 'townhouse', 'villa'],
    industrial: ['warehouse', 'factory', 'workshop'],
    park: ['pavilion', 'gazebo'],
    civic: ['city_hall', 'library', 'school', 'hospital'],
    mixed: ['apartment', 'shop', 'office', 'cafe'],
  }

  for (const zone of zones) {
    // Skip tiny zones
    if (zone.width < 20 || zone.height < 20) continue

    const applicableTypes = zoneTypeToBuildingTypes[zone.type] ?? ['generic']
    const intersection = buildingTypes.length > 0
      ? buildingTypes.filter((t) => applicableTypes.includes(t))
      : applicableTypes

    const typePool = intersection.length > 0 ? intersection : applicableTypes

    // Place buildings in a grid within the zone
    const padding = 4
    const buildingStep = zone.type === 'residential' ? 24 : 32

    for (let bz = zone.z + padding; bz + 12 <= zone.z + zone.height - padding; bz += buildingStep) {
      for (let bx = zone.x + padding; bx + 12 <= zone.x + zone.width - padding; bx += buildingStep) {
        const typeIndex = (buildId) % typePool.length
        const selectedType = typePool[typeIndex]

        const floors =
          zone.type === 'commercial' ? 3 + (buildId % 5) :
          zone.type === 'industrial' ? 1 :
          zone.type === 'park' ? 1 :
          1 + (buildId % 3)

        const buildingWidth = zone.type === 'residential' ? 12 + (buildId % 8) : 16 + (buildId % 12)
        const buildingDepth = zone.type === 'residential' ? 12 + (buildId % 6) : 16 + (buildId % 10)

        buildings.push({
          id: `building-${buildId++}`,
          x: bx,
          z: bz,
          width: buildingWidth,
          depth: buildingDepth,
          floors,
          type: selectedType,
          style,
          rotation: 0,
        })
      }
    }
  }

  return buildings
}

// ---------------------------------------------------------------------------
// Tool: generate_city_layout
// ---------------------------------------------------------------------------
const GenerateCityLayoutSchema = z.object({
  description: z.string().describe('Zone/city description in natural language'),
  bounds: z
    .object({ width: z.number().default(1024), height: z.number().default(1024) })
    .optional()
    .default({ width: 1024, height: 1024 }),
  buildingTypes: z.array(z.string()).optional().default([]),
})

async function generateCityLayout(params: z.infer<typeof GenerateCityLayoutSchema>): Promise<CityLayout> {
  const { description, bounds = { width: 1024, height: 1024 }, buildingTypes = [] } = params

  // Ask Claude to interpret the style
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 800,
    system: `You are a Roblox city style interpreter. Output ONLY valid JSON:
{
  "style": string (e.g. "modern-downtown", "medieval-village", "futuristic-city"),
  "density": "sparse" | "medium" | "dense",
  "theme": string,
  "primaryBuildingTypes": string[],
  "atmosphere": string,
  "landmarks": string[]
}`,
    messages: [{ role: 'user', content: `Interpret city style for: ${description}` }],
  })

  meterUsage('generate_city_layout', response.usage.input_tokens, response.usage.output_tokens)

  const raw = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as Anthropic.TextBlock).text)
    .join('')

  let metadata: Record<string, unknown>
  try {
    metadata = JSON.parse(raw)
  } catch {
    const match = raw.match(/```(?:json)?\s*([\s\S]+?)```/)
    metadata = match ? JSON.parse(match[1]) : { style: 'modern', raw }
  }

  const style = (metadata.style as string) ?? 'modern'
  const primaryTypes = (metadata.primaryBuildingTypes as string[]) ?? buildingTypes

  const { roads, zones } = createUrbanGrid(bounds, style)
  const buildings = placeBuildings(zones, primaryTypes, style)

  return {
    zones,
    roads,
    buildings,
    bounds,
    style,
    metadata,
  }
}

// ---------------------------------------------------------------------------
// Tool: generate_road_network
// ---------------------------------------------------------------------------
const GenerateRoadNetworkSchema = z.object({
  bounds: z.object({
    width: z.number(),
    height: z.number(),
  }),
  style: z
    .enum(['grid', 'radial', 'organic', 'highway'])
    .default('grid')
    .describe('Road network style'),
  mainRoadSpacing: z.number().default(200).describe('Spacing between main roads in studs'),
  includeHighways: z.boolean().default(false),
})

async function generateRoadNetwork(params: z.infer<typeof GenerateRoadNetworkSchema>) {
  const { bounds, style, mainRoadSpacing = 200, includeHighways = false } = params

  const roads: RoadSegment[] = []
  let roadId = 0

  if (style === 'grid') {
    // Standard grid
    for (let x = 0; x <= bounds.width; x += mainRoadSpacing) {
      roads.push({
        id: `road-${roadId++}`,
        fromX: x, fromZ: 0, toX: x, toZ: bounds.height,
        width: x % (mainRoadSpacing * 2) === 0 ? 20 : 12,
        type: x % (mainRoadSpacing * 2) === 0 ? 'main' : 'secondary',
      })
    }
    for (let z = 0; z <= bounds.height; z += mainRoadSpacing) {
      roads.push({
        id: `road-${roadId++}`,
        fromX: 0, fromZ: z, toX: bounds.width, toZ: z,
        width: z % (mainRoadSpacing * 2) === 0 ? 20 : 12,
        type: z % (mainRoadSpacing * 2) === 0 ? 'main' : 'secondary',
      })
    }
  } else if (style === 'radial') {
    // Radial spokes from center
    const cx = bounds.width / 2
    const cz = bounds.height / 2
    const spokeCount = 8
    const ringCount = 3

    for (let i = 0; i < spokeCount; i++) {
      const angle = (i / spokeCount) * Math.PI * 2
      roads.push({
        id: `road-${roadId++}`,
        fromX: cx, fromZ: cz,
        toX: cx + Math.cos(angle) * bounds.width * 0.6,
        toZ: cz + Math.sin(angle) * bounds.height * 0.6,
        width: 16,
        type: 'main',
      })
    }

    // Concentric rings
    for (let r = 1; r <= ringCount; r++) {
      const radius = (r / (ringCount + 1)) * Math.min(bounds.width, bounds.height) * 0.5
      const segments = Math.floor(spokeCount * r * 1.5)
      for (let s = 0; s < segments; s++) {
        const a1 = (s / segments) * Math.PI * 2
        const a2 = ((s + 1) / segments) * Math.PI * 2
        roads.push({
          id: `road-${roadId++}`,
          fromX: cx + Math.cos(a1) * radius,
          fromZ: cz + Math.sin(a1) * radius,
          toX: cx + Math.cos(a2) * radius,
          toZ: cz + Math.sin(a2) * radius,
          width: r === 1 ? 16 : 10,
          type: r === 1 ? 'main' : 'secondary',
        })
      }
    }
  } else if (style === 'organic') {
    // Irregular organic layout
    const numRoads = Math.floor((bounds.width * bounds.height) / (mainRoadSpacing * mainRoadSpacing * 2))
    for (let i = 0; i < numRoads; i++) {
      const x1 = (i * 137.5) % bounds.width
      const z1 = (i * 97.3) % bounds.height
      const angle = (i * 53.1 * Math.PI) / 180
      const len = mainRoadSpacing * 0.5 + (i % 3) * mainRoadSpacing * 0.25
      roads.push({
        id: `road-${roadId++}`,
        fromX: x1, fromZ: z1,
        toX: Math.min(bounds.width, x1 + Math.cos(angle) * len),
        toZ: Math.min(bounds.height, z1 + Math.sin(angle) * len),
        width: 10 + (i % 3) * 3,
        type: i % 5 === 0 ? 'main' : 'secondary',
      })
    }
  }

  // Add perimeter highway
  if (includeHighways) {
    roads.push(
      { id: `road-${roadId++}`, fromX: 0, fromZ: 0, toX: bounds.width, toZ: 0, width: 28, type: 'highway' },
      { id: `road-${roadId++}`, fromX: bounds.width, fromZ: 0, toX: bounds.width, toZ: bounds.height, width: 28, type: 'highway' },
      { id: `road-${roadId++}`, fromX: 0, fromZ: bounds.height, toX: bounds.width, toZ: bounds.height, width: 28, type: 'highway' },
      { id: `road-${roadId++}`, fromX: 0, fromZ: 0, toX: 0, toZ: bounds.height, width: 28, type: 'highway' }
    )
  }

  return {
    success: true,
    roads,
    totalRoads: roads.length,
    bounds,
    style,
  }
}

// ---------------------------------------------------------------------------
// Tool: place_buildings
// ---------------------------------------------------------------------------
const PlaceBuildingsSchema = z.object({
  layout: z
    .object({
      zones: z.array(z.object({
        id: z.string(),
        name: z.string(),
        type: z.string(),
        x: z.number(),
        z: z.number(),
        width: z.number(),
        height: z.number(),
      })),
      style: z.string().optional(),
    })
    .describe('City layout from generate_city_layout'),
  buildingTypes: z
    .array(z.string())
    .default([])
    .describe('Building types to place (e.g. "office", "house", "shop")'),
  density: z
    .enum(['sparse', 'medium', 'dense'])
    .default('medium'),
})

async function placeBuildingsFromLayout(params: z.infer<typeof PlaceBuildingsSchema>) {
  const { layout, buildingTypes = [], density = 'medium' } = params

  const densitySpacing: Record<string, number> = {
    sparse: 48,
    medium: 32,
    dense: 20,
  }

  const step = densitySpacing[density]
  const buildings: BuildingPlacement[] = []
  let buildId = 0

  const zoneTypeBuildingMap: Record<string, string[]> = {
    commercial: ['office', 'shop', 'restaurant', 'hotel'],
    residential: ['house', 'apartment', 'townhouse'],
    industrial: ['warehouse', 'factory'],
    park: ['pavilion'],
    civic: ['city_hall', 'library', 'school'],
    mixed: ['apartment', 'shop', 'cafe'],
  }

  for (const zone of layout.zones) {
    const applicableTypes = zoneTypeBuildingMap[zone.type] ?? ['generic']
    const pool = buildingTypes.length > 0
      ? buildingTypes.filter((t) => applicableTypes.includes(t)).concat(applicableTypes)
      : applicableTypes

    const padding = 6
    for (let bz = zone.z + padding; bz + 10 <= zone.z + zone.height - padding; bz += step) {
      for (let bx = zone.x + padding; bx + 10 <= zone.x + zone.width - padding; bx += step) {
        const selectedType = pool[buildId % pool.length]
        const floors = zone.type === 'commercial' ? 2 + (buildId % 6) : 1 + (buildId % 2)

        buildings.push({
          id: `building-${buildId++}`,
          x: bx,
          z: bz,
          width: density === 'dense' ? 12 : 16,
          depth: density === 'dense' ? 12 : 16,
          floors,
          type: selectedType,
          style: layout.style ?? 'modern',
          rotation: 0,
        })
      }
    }
  }

  return {
    success: true,
    buildings,
    totalBuildings: buildings.length,
    density,
  }
}

// ---------------------------------------------------------------------------
// MCP Tools definition
// ---------------------------------------------------------------------------
const TOOLS: Tool[] = [
  {
    name: 'generate_city_layout',
    description:
      'Generate a complete city layout with zones, road network, and building placements from a natural language description.',
    inputSchema: {
      type: 'object',
      properties: {
        description: { type: 'string', description: 'City/zone description (e.g. "dense Japanese downtown with neon signs")' },
        bounds: {
          type: 'object',
          properties: { width: { type: 'number' }, height: { type: 'number' } },
        },
        buildingTypes: { type: 'array', items: { type: 'string' } },
      },
      required: ['description'],
    },
  },
  {
    name: 'generate_road_network',
    description:
      'Generate a road network for a given area using grid, radial, organic, or highway patterns.',
    inputSchema: {
      type: 'object',
      properties: {
        bounds: {
          type: 'object',
          properties: { width: { type: 'number' }, height: { type: 'number' } },
          required: ['width', 'height'],
        },
        style: { type: 'string', enum: ['grid', 'radial', 'organic', 'highway'] },
        mainRoadSpacing: { type: 'number' },
        includeHighways: { type: 'boolean' },
      },
      required: ['bounds'],
    },
  },
  {
    name: 'place_buildings',
    description:
      'Place buildings across zones from a city layout, returning precise coordinates for Studio insertion.',
    inputSchema: {
      type: 'object',
      properties: {
        layout: { type: 'object', description: 'Layout from generate_city_layout' },
        buildingTypes: { type: 'array', items: { type: 'string' } },
        density: { type: 'string', enum: ['sparse', 'medium', 'dense'] },
      },
      required: ['layout'],
    },
  },
]

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------
const server = new Server(
  { name: 'city-architect', version: '1.0.0' },
  { capabilities: { tools: {} } }
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  try {
    let result: unknown

    switch (name) {
      case 'generate_city_layout': {
        const parsed = GenerateCityLayoutSchema.parse(args)
        result = await generateCityLayout(parsed)
        break
      }
      case 'generate_road_network': {
        const parsed = GenerateRoadNetworkSchema.parse(args)
        result = await generateRoadNetwork(parsed)
        break
      }
      case 'place_buildings': {
        const parsed = PlaceBuildingsSchema.parse(args)
        result = await placeBuildingsFromLayout(parsed)
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
    process.stderr.write('[city-architect] ERROR: ANTHROPIC_API_KEY not set\n')
    process.exit(1)
  }

  const transport = new StdioServerTransport()
  await server.connect(transport)
  process.stderr.write('[city-architect] MCP server running on stdio\n')
}

main().catch((err) => {
  process.stderr.write(`[city-architect] Fatal: ${err.message}\n`)
  process.exit(1)
})
