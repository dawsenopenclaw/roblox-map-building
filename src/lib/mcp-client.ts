/**
 * MCP Client — unified helper for calling terrain-forge, city-architect, asset-alchemist.
 *
 * Strategy:
 *  1. In production: calls the MCP tool functions directly (imported from packages/mcp/*).
 *     The MCP servers run as stdio processes; the web app calls their logic inline instead
 *     of standing up a separate HTTP MCP server.
 *  2. When API keys are missing or an error occurs: returns demo/mock data so the editor
 *     always has a response to show.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type McpServer = 'terrain' | 'city' | 'assets'

export interface McpCallResult {
  success: boolean
  demo: boolean
  server: McpServer
  tool: string
  data: Record<string, unknown>
  error?: string
}

// ---------------------------------------------------------------------------
// Demo data — mirrors what each MCP tool would return for a simple call
// ---------------------------------------------------------------------------

const DEMO_TERRAIN: Record<string, unknown> = {
  success: true,
  metadata: {
    biome: 'plains',
    elevationProfile: 'rolling',
    baseElevation: 30,
    elevationVariance: 15,
    primaryMaterial: 'Grass',
    secondaryMaterial: 'Dirt',
    accentMaterial: 'Rock',
    features: ['river', 'gentle hills'],
    waterLevel: 10,
    description: 'Rolling grassland plains with a winding river (demo data)',
  },
  heightmap: Array.from({ length: 16 }, (_, i) => ({
    x: (i % 4) * 128,
    z: Math.floor(i / 4) * 128,
    height: 25 + Math.sin(i * 0.8) * 10,
    material: i % 5 === 0 ? 'Dirt' : 'Grass',
  })),
  size: { width: 512, height: 512 },
  gridResolution: 4,
  totalPoints: 16,
  waterLevel: 10,
  seed: null,
  _demo: true,
}

const DEMO_SMOOTH: Record<string, unknown> = {
  success: true,
  heightmap: Array.from({ length: 16 }, (_, i) => ({
    x: (i % 4) * 128,
    z: Math.floor(i / 4) * 128,
    height: 28 + Math.sin(i * 0.4) * 6,
    material: 'Grass',
  })),
  smoothedPoints: 16,
  passes: 3,
  strength: 0.5,
  _demo: true,
}

const DEMO_PAINT: Record<string, unknown> = {
  success: true,
  materialMap: {
    region: { x: 0, z: 0, width: 256, height: 256 },
    materials: [
      { x: 0, z: 0, material: 'Grass' },
      { x: 16, z: 0, material: 'Grass' },
      { x: 0, z: 16, material: 'Grass' },
      { x: 16, z: 16, material: 'Grass' },
    ],
  },
  pointsModified: 4,
  material: 'Grass',
  _demo: true,
}

const DEMO_CITY_LAYOUT: Record<string, unknown> = {
  zones: [
    { id: 'zone-0', name: 'commercial-0', type: 'commercial', x: 10, z: 10, width: 80, height: 80 },
    { id: 'zone-1', name: 'residential-1', type: 'residential', x: 110, z: 10, width: 80, height: 80 },
    { id: 'zone-2', name: 'mixed-2', type: 'mixed', x: 10, z: 110, width: 80, height: 80 },
    { id: 'zone-3', name: 'park-3', type: 'park', x: 110, z: 110, width: 80, height: 80 },
  ],
  roads: [
    { id: 'road-0', fromX: 0, fromZ: 0, toX: 0, toZ: 200, width: 20, type: 'main' },
    { id: 'road-1', fromX: 100, fromZ: 0, toX: 100, toZ: 200, width: 12, type: 'secondary' },
    { id: 'road-2', fromX: 0, fromZ: 0, toX: 200, toZ: 0, width: 20, type: 'main' },
    { id: 'road-3', fromX: 0, fromZ: 100, toX: 200, toZ: 100, width: 12, type: 'secondary' },
  ],
  buildings: [
    { id: 'building-0', x: 14, z: 14, width: 20, depth: 16, floors: 4, type: 'office', style: 'modern', rotation: 0 },
    { id: 'building-1', x: 50, z: 14, width: 20, depth: 16, floors: 2, type: 'shop', style: 'modern', rotation: 0 },
    { id: 'building-2', x: 114, z: 14, width: 16, depth: 14, floors: 2, type: 'house', style: 'modern', rotation: 0 },
  ],
  bounds: { width: 200, height: 200 },
  style: 'modern-downtown',
  metadata: { style: 'modern-downtown', density: 'medium', theme: 'urban', primaryBuildingTypes: ['office', 'shop', 'house'], atmosphere: 'busy', landmarks: ['city hall', 'park'] },
  _demo: true,
}

const DEMO_ROAD_NETWORK: Record<string, unknown> = {
  success: true,
  roads: [
    { id: 'road-0', fromX: 0, fromZ: 0, toX: 0, toZ: 500, width: 20, type: 'main' },
    { id: 'road-1', fromX: 200, fromZ: 0, toX: 200, toZ: 500, width: 12, type: 'secondary' },
    { id: 'road-2', fromX: 400, fromZ: 0, toX: 400, toZ: 500, width: 20, type: 'main' },
    { id: 'road-3', fromX: 0, fromZ: 0, toX: 500, toZ: 0, width: 20, type: 'main' },
    { id: 'road-4', fromX: 0, fromZ: 200, toX: 500, toZ: 200, width: 12, type: 'secondary' },
    { id: 'road-5', fromX: 0, fromZ: 400, toX: 500, toZ: 400, width: 20, type: 'main' },
  ],
  totalRoads: 6,
  bounds: { width: 500, height: 500 },
  style: 'grid',
  _demo: true,
}

const DEMO_BUILDINGS: Record<string, unknown> = {
  success: true,
  buildings: [
    { id: 'building-0', x: 16, z: 16, width: 16, depth: 16, floors: 3, type: 'office', style: 'modern', rotation: 0 },
    { id: 'building-1', x: 48, z: 16, width: 16, depth: 16, floors: 2, type: 'shop', style: 'modern', rotation: 0 },
    { id: 'building-2', x: 16, z: 48, width: 16, depth: 16, floors: 1, type: 'house', style: 'modern', rotation: 0 },
    { id: 'building-3', x: 48, z: 48, width: 12, depth: 12, floors: 1, type: 'pavilion', style: 'modern', rotation: 0 },
  ],
  totalBuildings: 4,
  density: 'medium',
  _demo: true,
}

const DEMO_3D_MODEL: Record<string, unknown> = {
  success: true,
  jobId: `demo-${Date.now()}`,
  status: 'processing',
  modelUrls: null,
  thumbnailUrl: null,
  prompt: 'A game-ready low-poly Roblox prop (demo)',
  originalDescription: 'demo',
  tags: ['low-poly', 'roblox', 'game-ready'],
  style: 'low_poly',
  provider: 'meshy',
  circuitBreakerState: 'closed',
  _demo: true,
}

const DEMO_TEXTURE: Record<string, unknown> = {
  success: true,
  url: 'https://placehold.co/1024x1024/4a7c59/ffffff?text=Demo+Texture',
  width: 1024,
  height: 1024,
  prompt: 'Tileable game texture (demo)',
  originalDescription: 'demo',
  tags: ['tileable', 'pbr', 'game-ready'],
  provider: 'fal',
  circuitBreakerState: 'closed',
  _demo: true,
}

const DEMO_ASSET_PACK: Record<string, unknown> = {
  success: true,
  theme: 'demo theme',
  models: [
    { name: 'main building', jobId: `demo-model-1-${Date.now()}`, status: 'processing', success: true },
    { name: 'prop', jobId: `demo-model-2-${Date.now()}`, status: 'processing', success: true },
    { name: 'decoration', jobId: `demo-model-3-${Date.now()}`, status: 'processing', success: true },
  ],
  textures: [
    { type: 'ground', url: 'https://placehold.co/1024x1024/7a6c4a/ffffff?text=Ground', width: 1024, height: 1024 },
    { type: 'wall', url: 'https://placehold.co/1024x1024/8a8a8a/ffffff?text=Wall', width: 1024, height: 1024 },
  ],
  assetCount: 3,
  textureCount: 2,
  style: 'low_poly',
  tags: ['game-ready', 'roblox'],
  totalCostUsd: 0,
  circuitBreakers: { meshy: 'closed', fal: 'closed' },
  _demo: true,
}

// ---------------------------------------------------------------------------
// Demo data registry
// ---------------------------------------------------------------------------

const DEMO_DATA: Record<string, Record<string, Record<string, unknown>>> = {
  terrain: {
    generate_terrain: DEMO_TERRAIN,
    smooth_terrain: DEMO_SMOOTH,
    paint_terrain: DEMO_PAINT,
  },
  city: {
    generate_city_layout: DEMO_CITY_LAYOUT,
    generate_road_network: DEMO_ROAD_NETWORK,
    place_buildings: DEMO_BUILDINGS,
  },
  assets: {
    generate_3d_model: DEMO_3D_MODEL,
    generate_texture: DEMO_TEXTURE,
    generate_asset_pack: DEMO_ASSET_PACK,
  },
}

// ---------------------------------------------------------------------------
// Tool dispatch — calls the real MCP function logic directly.
// Each server's logic is imported lazily so the web bundle doesn't pull in
// the MCP SDK unless the route is actually hit.
// ---------------------------------------------------------------------------

async function callTerrainTool(tool: string, args: Record<string, unknown>): Promise<Record<string, unknown>> {
  // Dynamically import to avoid loading MCP SDK on every request
  const mod = await import('../../packages/mcp/terrain-forge/src/index.js').catch(() => null)
  if (!mod) throw new Error('terrain-forge module not resolvable from web context')

  // The MCP index does not export functions; call the HTTP proxy route instead.
  // This path only runs in Node.js server context (Next.js API route).
  throw new Error('Direct module import not supported — use HTTP proxy')
}

async function callCityTool(tool: string, args: Record<string, unknown>): Promise<Record<string, unknown>> {
  throw new Error('Direct module import not supported — use HTTP proxy')
}

async function callAssetsTool(tool: string, args: Record<string, unknown>): Promise<Record<string, unknown>> {
  throw new Error('Direct module import not supported — use HTTP proxy')
}

// ---------------------------------------------------------------------------
// HTTP proxy — calls the MCP server over HTTP if MCP_BASE_URL is set.
// Each server listens on a dedicated port when running in HTTP mode.
// ---------------------------------------------------------------------------

const MCP_URLS: Record<McpServer, string> = {
  terrain: process.env.MCP_TERRAIN_URL ?? 'http://localhost:3010',
  city: process.env.MCP_CITY_URL ?? 'http://localhost:3011',
  assets: process.env.MCP_ASSETS_URL ?? 'http://localhost:3012',
}

async function callViaHttp(
  server: McpServer,
  tool: string,
  args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const baseUrl = MCP_URLS[server]

  const res = await fetch(`${baseUrl}/tools/call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: tool, arguments: args }),
    signal: AbortSignal.timeout(30_000),
  })

  if (!res.ok) {
    throw new Error(`MCP HTTP ${server} ${tool}: ${res.status} ${await res.text()}`)
  }

  const json = await res.json() as { content?: Array<{ type: string; text: string }>; error?: string }

  if (json.error) throw new Error(json.error)

  const text = json.content?.find((c) => c.type === 'text')?.text
  if (!text) throw new Error('Empty MCP response')

  return JSON.parse(text) as Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Main export: callTool
// ---------------------------------------------------------------------------

/**
 * Call an MCP tool with automatic demo fallback.
 *
 * Flow:
 *  1. Try HTTP proxy (MCP_*_URL env vars point to running MCP server)
 *  2. On any error → return demo data
 *
 * @param server  'terrain' | 'city' | 'assets'
 * @param tool    Tool name (e.g. 'generate_terrain')
 * @param args    Tool arguments
 * @param forceDemo  Skip live call, return demo data immediately
 */
export async function callTool(
  server: McpServer,
  tool: string,
  args: Record<string, unknown>,
  forceDemo = false,
): Promise<McpCallResult> {
  const demoData = DEMO_DATA[server]?.[tool] ?? { _demo: true, message: 'No demo data for this tool' }

  if (forceDemo) {
    return { success: true, demo: true, server, tool, data: { ...demoData, args } }
  }

  try {
    const data = await callViaHttp(server, tool, args)
    return { success: true, demo: false, server, tool, data }
  } catch {
    // MCP server not running or unreachable — return demo data gracefully
    return { success: true, demo: true, server, tool, data: { ...demoData, args } }
  }
}

// ---------------------------------------------------------------------------
// Tool discovery
// ---------------------------------------------------------------------------

export interface McpToolInfo {
  name: string
  description: string
  inputSchema: Record<string, unknown>
}

const TOOL_REGISTRY: Record<McpServer, McpToolInfo[]> = {
  terrain: [
    {
      name: 'generate_terrain',
      description: 'Generate Roblox terrain heightmap and material mapping from a natural language biome description.',
      inputSchema: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          size: { type: 'object', properties: { width: { type: 'number' }, height: { type: 'number' } } },
          seed: { type: 'number' },
        },
        required: ['description'],
      },
    },
    {
      name: 'smooth_terrain',
      description: 'Apply smoothing to an existing heightmap.',
      inputSchema: {
        type: 'object',
        properties: {
          heightmap: { type: 'array' },
          region: { type: 'object' },
          passes: { type: 'number' },
          strength: { type: 'number' },
        },
        required: ['heightmap'],
      },
    },
    {
      name: 'paint_terrain',
      description: 'Assign a Roblox material to a terrain region.',
      inputSchema: {
        type: 'object',
        properties: {
          region: { type: 'object' },
          material: { type: 'string' },
          blendEdges: { type: 'boolean' },
          existingHeightmap: { type: 'array' },
        },
        required: ['region', 'material'],
      },
    },
  ],
  city: [
    {
      name: 'generate_city_layout',
      description: 'Generate a complete city layout with zones, roads, and buildings.',
      inputSchema: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          bounds: { type: 'object' },
          buildingTypes: { type: 'array' },
        },
        required: ['description'],
      },
    },
    {
      name: 'generate_road_network',
      description: 'Generate a road network (grid, radial, organic, or highway).',
      inputSchema: {
        type: 'object',
        properties: {
          bounds: { type: 'object' },
          style: { type: 'string' },
          mainRoadSpacing: { type: 'number' },
          includeHighways: { type: 'boolean' },
        },
        required: ['bounds'],
      },
    },
    {
      name: 'place_buildings',
      description: 'Place buildings across zones from a city layout.',
      inputSchema: {
        type: 'object',
        properties: {
          layout: { type: 'object' },
          buildingTypes: { type: 'array' },
          density: { type: 'string' },
        },
        required: ['layout'],
      },
    },
  ],
  assets: [
    {
      name: 'generate_3d_model',
      description: 'Generate a Roblox-ready 3D model via Meshy AI.',
      inputSchema: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          artStyle: { type: 'string' },
          skipEnrichment: { type: 'boolean' },
        },
        required: ['description'],
      },
    },
    {
      name: 'generate_texture',
      description: 'Generate a game texture via Fal AI.',
      inputSchema: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          resolution: { type: 'string' },
          skipEnrichment: { type: 'boolean' },
        },
        required: ['description'],
      },
    },
    {
      name: 'generate_asset_pack',
      description: 'Generate a complete themed asset pack (models + textures).',
      inputSchema: {
        type: 'object',
        properties: {
          theme: { type: 'string' },
          includeTextures: { type: 'boolean' },
          modelCount: { type: 'number' },
        },
        required: ['theme'],
      },
    },
  ],
}

export function listTools(server: McpServer): McpToolInfo[] {
  return TOOL_REGISTRY[server] ?? []
}

export function listAllTools(): Record<McpServer, McpToolInfo[]> {
  return TOOL_REGISTRY
}

// ---------------------------------------------------------------------------
// Intent detection — used by the AI chat route to auto-trigger MCP tools
// ---------------------------------------------------------------------------

export type McpIntent =
  | { server: 'terrain'; tool: string; args: Record<string, unknown> }
  | { server: 'city'; tool: string; args: Record<string, unknown> }
  | { server: 'assets'; tool: string; args: Record<string, unknown> }
  | null

/**
 * Inspect a Claude response text and return an MCP call to make automatically.
 * Only triggers when the response strongly implies generation happened.
 */
export function detectMcpIntent(message: string, claudeResponse: string): McpIntent {
  const combined = `${message} ${claudeResponse}`.toLowerCase()

  // Terrain generation triggers
  if (
    /\b(terrain|biome|heightmap|generate.*terrain|terrain.*generat)\b/.test(combined) &&
    /\b(generat|creat|build|plac)\b/.test(combined)
  ) {
    // Extract description from the message
    const descMatch = message.match(/(?:terrain|biome)\s+(?:for\s+)?(.{5,80})/i)
    return {
      server: 'terrain',
      tool: 'generate_terrain',
      args: {
        description: descMatch?.[1]?.trim() ?? message.slice(0, 100),
        size: { width: 512, height: 512 },
      },
    }
  }

  // City / building generation triggers
  if (
    /\b(city|town|village|district|urban|downtown|block|road network|road grid|building layout)\b/.test(combined) &&
    /\b(generat|creat|build|plac|design|layout)\b/.test(combined)
  ) {
    const descMatch = message.match(/(?:city|town|village|district|urban)\s+(?:of\s+|for\s+)?(.{5,80})/i)
    return {
      server: 'city',
      tool: 'generate_city_layout',
      args: {
        description: descMatch?.[1]?.trim() ?? message.slice(0, 100),
        bounds: { width: 1024, height: 1024 },
      },
    }
  }

  // Asset / model generation triggers
  if (
    /\b(3d model|mesh|generate model|generate asset|asset pack|texture)\b/.test(combined) &&
    /\b(generat|creat|build)\b/.test(combined)
  ) {
    // Texture vs model vs pack
    if (/\b(asset pack|pack of|set of)\b/.test(combined)) {
      const themeMatch = message.match(/(?:pack|set)\s+(?:of\s+|for\s+)?(.{5,60})/i)
      return {
        server: 'assets',
        tool: 'generate_asset_pack',
        args: { theme: themeMatch?.[1]?.trim() ?? message.slice(0, 80) },
      }
    }

    if (/\b(texture|material|surface)\b/.test(combined)) {
      return {
        server: 'assets',
        tool: 'generate_texture',
        args: { description: message.slice(0, 150) },
      }
    }

    return {
      server: 'assets',
      tool: 'generate_3d_model',
      args: { description: message.slice(0, 150), artStyle: 'low_poly' },
    }
  }

  return null
}
