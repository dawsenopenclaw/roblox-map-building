#!/usr/bin/env node
/**
 * City Architect MCP Server — port 3003
 *
 * Tools:
 *   plan-city           → Claude-powered structured city layout JSON (zones, roads, buildings)
 *   generate-building   → Single building spec via Claude + optional Meshy mesh kick-off
 *   layout-district     → Array of building placements for a district type
 *
 * Transport: StreamableHTTP over Node http on /mcp
 * Auth:      ANTHROPIC_API_KEY + optional MESHY_API_KEY from process.env
 */

import { createServer, IncomingMessage, ServerResponse } from 'node:http'
import { randomUUID } from 'node:crypto'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PORT = Number(process.env.CITY_ARCHITECT_PORT ?? 3003)
const MESHY_BASE = 'https://api.meshy.ai'

// ---------------------------------------------------------------------------
// Anthropic client
// ---------------------------------------------------------------------------

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? '' })
const CLAUDE_MODEL = 'claude-3-5-sonnet-20241022'

function meterUsage(tool: string, inputTokens: number, outputTokens: number): void {
  const costUsd = (inputTokens / 1_000_000) * 3.0 + (outputTokens / 1_000_000) * 15.0
  process.stderr.write(
    `[city-architect] ${tool}: ${inputTokens}in/${outputTokens}out ($${costUsd.toFixed(6)})\n`,
  )
}

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
// Tool: plan-city — Claude-generated structured city layout
// ---------------------------------------------------------------------------

async function planCity(params: {
  cityType: string
  size: 'small' | 'medium' | 'large'
  style: string
}): Promise<Record<string, unknown>> {
  const { cityType, size, style } = params

  const studsMap = { small: 512, medium: 1024, large: 2048 }
  const studs = studsMap[size]

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2000,
    system: `You are a Roblox city layout architect. Given a city type, size, and style, output ONLY a single valid JSON object representing the full city plan. No prose, no markdown fences. The JSON must match this exact structure:
{
  "cityType": string,
  "style": string,
  "bounds": { "width": number, "height": number },
  "zones": [{ "id": string, "name": string, "type": "commercial"|"residential"|"industrial"|"park"|"civic"|"mixed", "x": number, "z": number, "width": number, "height": number }],
  "roads": [{ "id": string, "fromX": number, "fromZ": number, "toX": number, "toZ": number, "width": number, "type": "main"|"secondary"|"alley"|"highway" }],
  "buildings": [{ "id": string, "x": number, "z": number, "width": number, "depth": number, "height": number, "floors": number, "type": string, "style": string, "rotation": number }],
  "landmarks": [{ "id": string, "name": string, "x": number, "z": number, "type": string }],
  "atmosphere": string,
  "colorPalette": { "primary": string, "accent": string, "road": string }
}
All coordinates are Roblox studs. The map fits within ${studs}×${studs} studs. Include 4-8 zones, a realistic road grid, and 20-50 buildings placed in their zones.`,
    messages: [
      {
        role: 'user',
        content: `Plan a ${size} ${cityType} city with ${style} style, ${studs}×${studs} studs.`,
      },
    ],
  })

  meterUsage('plan-city', response.usage.input_tokens, response.usage.output_tokens)

  const raw = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as Anthropic.TextBlock).text)
    .join('')

  try {
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    const match = raw.match(/```(?:json)?\s*([\s\S]+?)```/)
    if (match) return JSON.parse(match[1]) as Record<string, unknown>
    // Fallback: use the algorithmic generator
    const bounds = { width: studs, height: studs }
    const { roads, zones } = createUrbanGrid(bounds, style)
    const buildings = placeBuildings(zones, [], style)
    return { cityType, style, bounds, zones, roads, buildings, landmarks: [], atmosphere: style }
  }
}

// ---------------------------------------------------------------------------
// Tool: generate-building — spec + optional Meshy kick-off
// ---------------------------------------------------------------------------

async function generateBuilding(params: {
  buildingType: string
  style: string
  kickOffMesh: boolean
}): Promise<Record<string, unknown>> {
  const { buildingType, style, kickOffMesh } = params

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 800,
    system: `You are a Roblox building architect. Given a building type and style, output ONLY valid JSON:
{
  "name": string,
  "buildingType": string,
  "style": string,
  "width": number,
  "depth": number,
  "floors": number,
  "heightPerFloor": number,
  "totalHeight": number,
  "materials": { "facade": string, "roof": string, "trim": string },
  "features": string[],
  "meshPrompt": string,
  "colorHex": string,
  "robloxMaterial": string
}
All dimensions in Roblox studs. meshPrompt should be a 1-2 sentence Meshy-ready 3D generation prompt.`,
    messages: [{ role: 'user', content: `Design a ${buildingType} in ${style} style.` }],
  })

  meterUsage('generate-building', response.usage.input_tokens, response.usage.output_tokens)

  const raw = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as Anthropic.TextBlock).text)
    .join('')

  let spec: Record<string, unknown>
  try {
    spec = JSON.parse(raw) as Record<string, unknown>
  } catch {
    const match = raw.match(/```(?:json)?\s*([\s\S]+?)```/)
    spec = match ? (JSON.parse(match[1]) as Record<string, unknown>) : { buildingType, style, raw }
  }

  // Optionally kick off a Meshy task for the mesh
  if (kickOffMesh && process.env.MESHY_API_KEY) {
    try {
      const meshPrompt = (spec.meshPrompt as string) ?? `${buildingType}, ${style} style, Roblox game asset`
      const res = await fetch(`${MESHY_BASE}/v2/text-to-3d`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.MESHY_API_KEY}`,
        },
        body: JSON.stringify({
          mode: 'preview',
          prompt: meshPrompt,
          art_style: style.includes('realistic') ? 'pbr' : 'low-poly',
          target_polycount: 20_000,
        }),
        signal: AbortSignal.timeout(15_000),
      })
      if (res.ok) {
        const data = (await res.json()) as { result: string }
        spec.meshTaskId = data.result
        spec.meshStatus = 'IN_PROGRESS'
      }
    } catch {
      spec.meshStatus = 'skipped'
    }
  }

  return spec
}

// ---------------------------------------------------------------------------
// Tool: layout-district — building placements for a district type
// ---------------------------------------------------------------------------

function layoutDistrict(params: {
  districtType: Zone['type']
  width: number
  height: number
  density: 'sparse' | 'medium' | 'dense'
  style: string
}): BuildingPlacement[] {
  const { districtType, width, height, density, style } = params

  const zone: Zone = {
    id: 'district-0',
    name: districtType,
    type: districtType,
    x: 0,
    z: 0,
    width,
    height,
  }

  const densitySpacing: Record<string, number> = { sparse: 48, medium: 32, dense: 20 }
  const step = densitySpacing[density] ?? 32
  const buildings: BuildingPlacement[] = []
  let buildId = 0

  const typePool: Record<Zone['type'], string[]> = {
    commercial: ['office', 'shop', 'restaurant', 'hotel', 'mall'],
    residential: ['house', 'apartment', 'townhouse', 'villa'],
    industrial: ['warehouse', 'factory', 'workshop'],
    park: ['pavilion', 'gazebo', 'fountain'],
    civic: ['city_hall', 'library', 'school', 'hospital'],
    mixed: ['apartment', 'shop', 'cafe', 'office'],
  }

  const pool = typePool[districtType] ?? ['generic']
  const padding = 6

  for (let bz = zone.z + padding; bz + 10 <= zone.z + height - padding; bz += step) {
    for (let bx = zone.x + padding; bx + 10 <= zone.x + width - padding; bx += step) {
      const selectedType = pool[buildId % pool.length]!
      const floors = districtType === 'commercial' ? 2 + (buildId % 6) : 1 + (buildId % 3)

      buildings.push({
        id: `building-${buildId++}`,
        x: bx,
        z: bz,
        width: density === 'dense' ? 12 : 16,
        depth: density === 'dense' ? 12 : 16,
        floors,
        type: selectedType,
        style,
        rotation: 0,
      })
    }
  }

  return buildings
}

// ---------------------------------------------------------------------------
// MCP server — tool registration
// ---------------------------------------------------------------------------

function buildMcpServer(): McpServer {
  const mcp = new McpServer({ name: 'city-architect', version: '1.0.0' })

  // ── plan-city ──────────────────────────────────────────────────────────────

  // @ts-ignore — TS2589: MCP SDK zod-compat deep type inference with Zod v3
  mcp.registerTool(
    'plan-city',
    {
      title: 'Plan City',
      description:
        'Use Claude to generate a complete city layout plan with zones, roads, building positions, and color palette. Returns structured JSON ready for Studio insertion.',
      inputSchema: {
        cityType: z
          .string()
          .min(2)
          .describe('Type of city (e.g. "Japanese downtown", "medieval village", "futuristic megacity")'),
        size: z
          .enum(['small', 'medium', 'large'])
          .default('medium')
          .describe('City size: small=512 studs, medium=1024, large=2048'),
        style: z
          .string()
          .default('modern')
          .describe('Visual style (e.g. "modern", "cyberpunk", "fantasy", "industrial")'),
      },
    },
    async ({ cityType, size, style }) => {
      const layout = await planCity({ cityType, size, style })
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(layout) }],
      }
    },
  )

  // ── generate-building ──────────────────────────────────────────────────────

  // @ts-ignore — TS2589: MCP SDK zod-compat deep type inference
  mcp.registerTool(
    'generate-building',
    {
      title: 'Generate Building',
      description:
        'Design a single building spec using Claude (dimensions, materials, style). Optionally kick off a Meshy 3D mesh generation task.',
      inputSchema: {
        buildingType: z
          .string()
          .min(2)
          .describe('Building type (e.g. "office tower", "medieval inn", "warehouse")'),
        style: z
          .string()
          .default('modern')
          .describe('Visual style for the building'),
        kickOffMesh: z
          .boolean()
          .default(false)
          .describe('Start a Meshy text-to-3D task and return the task ID'),
      },
    },
    async ({ buildingType, style, kickOffMesh }) => {
      const spec = await generateBuilding({ buildingType, style, kickOffMesh })
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(spec) }],
      }
    },
  )

  // ── layout-district ────────────────────────────────────────────────────────

  // @ts-ignore — TS2589: MCP SDK zod-compat deep type inference
  mcp.registerTool(
    'layout-district',
    {
      title: 'Layout District',
      description:
        'Generate an array of building placements with positions, rotations, and scales for a given district type. No AI call — instant deterministic result.',
      inputSchema: {
        districtType: z
          .enum(['commercial', 'residential', 'industrial', 'park', 'civic', 'mixed'])
          .describe('Type of district to populate'),
        width: z
          .number()
          .int()
          .min(50)
          .default(256)
          .describe('District width in studs'),
        height: z
          .number()
          .int()
          .min(50)
          .default(256)
          .describe('District height in studs'),
        density: z
          .enum(['sparse', 'medium', 'dense'])
          .default('medium')
          .describe('Building density'),
        style: z
          .string()
          .default('modern')
          .describe('Visual style applied to all buildings'),
      },
    },
    async ({ districtType, width, height, density, style }) => {
      const buildings = layoutDistrict({ districtType, width, height, density, style })
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ buildings, totalBuildings: buildings.length, districtType, density }),
          },
        ],
      }
    },
  )

  return mcp
}

// ---------------------------------------------------------------------------
// HTTP server — StreamableHTTP transport
// ---------------------------------------------------------------------------

const mcpServer = buildMcpServer()
const transports = new Map<string, StreamableHTTPServerTransport>()

async function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.setEncoding('utf8')
    req.on('data', (chunk: string) => { raw += chunk })
    req.on('end', () => {
      try { resolve(JSON.parse(raw)) } catch { resolve(undefined) }
    })
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, statusCode: number, body: unknown): void {
  const payload = JSON.stringify(body)
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
  })
  res.end(payload)
}

const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  if (req.url === '/health' && req.method === 'GET') {
    sendJson(res, 200, { status: 'ok', server: 'city-architect', port: PORT })
    return
  }

  if (req.url !== '/mcp') {
    sendJson(res, 404, { error: 'Not found. POST /mcp or GET /health' })
    return
  }

  try {
    if (req.method === 'POST') {
      const body = await readBody(req)
      const sessionId = req.headers['mcp-session-id'] as string | undefined

      if (sessionId && transports.has(sessionId)) {
        await transports.get(sessionId)!.handleRequest(req, res, body)
        return
      }

      if (!sessionId && isInitializeRequest(body)) {
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (id) => { transports.set(id, transport) },
        })
        transport.onclose = () => {
          if (transport.sessionId) transports.delete(transport.sessionId)
        }
        await mcpServer.connect(transport)
        await transport.handleRequest(req, res, body)
        return
      }

      // Stateless — no session header (used by mcp-client.ts tools/call)
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
      await mcpServer.connect(transport)
      await transport.handleRequest(req, res, body)
      return
    }

    if (req.method === 'GET') {
      const sessionId = req.headers['mcp-session-id'] as string | undefined
      if (sessionId && transports.has(sessionId)) {
        await transports.get(sessionId)!.handleRequest(req, res)
        return
      }
      sendJson(res, 400, { jsonrpc: '2.0', error: { code: -32000, message: 'Invalid session' }, id: null })
      return
    }

    if (req.method === 'DELETE') {
      const sessionId = req.headers['mcp-session-id'] as string | undefined
      if (sessionId && transports.has(sessionId)) {
        await transports.get(sessionId)!.handleRequest(req, res)
        transports.delete(sessionId)
        return
      }
      sendJson(res, 404, { error: 'Session not found' })
      return
    }

    sendJson(res, 405, { error: 'Method not allowed' })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    process.stderr.write(`[city-architect] Request error: ${message}\n`)
    if (!res.headersSent) {
      sendJson(res, 500, {
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error', data: message },
        id: null,
      })
    }
  }
})

httpServer.listen(PORT, () => {
  process.stderr.write(`[city-architect] MCP server listening on http://localhost:${PORT}/mcp\n`)
})

httpServer.on('error', (err: NodeJS.ErrnoException) => {
  process.stderr.write(`[city-architect] Server error: ${err.message}\n`)
  process.exit(1)
})

process.on('SIGTERM', async () => {
  process.stderr.write('[city-architect] Shutting down...\n')
  await mcpServer.close()
  httpServer.close(() => process.exit(0))
})
