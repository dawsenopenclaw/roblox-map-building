/**
 * MCP tool implementations — pure functions extracted from the MCP server packages.
 *
 * These are the canonical implementations shared by:
 *   - /api/mcp/asset-alchemist/route.ts
 *   - /api/mcp/city-architect/route.ts
 *   - /api/mcp/terrain-forge/route.ts
 *   - Any AI chat route that wants to call tools directly without HTTP round-trips
 *
 * No MCP SDK. No Node http server. Just functions.
 * All AI calls prefer Gemini (GEMINI_API_KEY) over Anthropic.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Shared env helpers
// ─────────────────────────────────────────────────────────────────────────────

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`${name} is not set`)
  return v
}

function meshyKey(): string { return requireEnv('MESHY_API_KEY') }
function falKey(): string {
  const k = process.env.FAL_KEY ?? process.env.FAL_API_KEY
  if (!k) throw new Error('FAL_KEY is not set')
  return k
}

// ─────────────────────────────────────────────────────────────────────────────
// AI client — Gemini-first, Anthropic fallback
// ─────────────────────────────────────────────────────────────────────────────

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta'
const GEMINI_MODEL = 'gemini-2.5-flash'
const ANTHROPIC_BASE = 'https://api.anthropic.com/v1'
const CLAUDE_MODEL = 'claude-3-5-sonnet-20241022'

/**
 * Calls Gemini generateContent and returns the text response.
 * Throws on non-2xx or when the API key is absent.
 */
async function geminiGenerate(system: string, user: string, maxTokens = 2000): Promise<string> {
  const key = requireEnv('GEMINI_API_KEY')
  const res = await fetch(
    `${GEMINI_BASE}/models/${GEMINI_MODEL}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: { maxOutputTokens: maxTokens },
      }),
      signal: AbortSignal.timeout(30_000),
    },
  )
  if (!res.ok) {
    const txt = await res.text().catch(() => String(res.status))
    throw new Error(`Gemini error (${res.status}): ${txt}`)
  }
  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  if (!text) throw new Error('Gemini returned empty response')
  return text
}

/**
 * Calls Claude messages and returns the text response.
 */
async function claudeGenerate(system: string, user: string, maxTokens = 2000): Promise<string> {
  const key = requireEnv('ANTHROPIC_API_KEY')
  const res = await fetch(`${ANTHROPIC_BASE}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
    }),
    signal: AbortSignal.timeout(30_000),
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => String(res.status))
    throw new Error(`Anthropic error (${res.status}): ${txt}`)
  }
  const data = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>
  }
  const text = data.content
    ?.filter((b) => b.type === 'text')
    .map((b) => b.text ?? '')
    .join('') ?? ''
  if (!text) throw new Error('Claude returned empty response')
  return text
}

/**
 * Gemini-first AI call with Anthropic fallback.
 * Returns raw text from the model.
 */
async function aiGenerate(system: string, user: string, maxTokens = 2000): Promise<string> {
  if (process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_MAIN) {
    try {
      return await geminiGenerate(system, user, maxTokens)
    } catch (err) {
      // Fall through to Anthropic if Gemini fails and Anthropic key is present
      if (!process.env.ANTHROPIC_API_KEY) throw err
      console.warn('[mcp-tools] Gemini failed, falling back to Anthropic:', (err as Error).message)
    }
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return claudeGenerate(system, user, maxTokens)
  }
  throw new Error('No AI API key configured — set GEMINI_API_KEY or ANTHROPIC_API_KEY')
}

/**
 * Parse JSON from AI output, stripping markdown code fences if present.
 */
function parseAiJson<T>(raw: string): T {
  const trimmed = raw.trim()
  // Strip ```json ... ``` or ``` ... ```
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]+?)```/)
  const source = fenced ? fenced[1].trim() : trimmed
  return JSON.parse(source) as T
}

// ─────────────────────────────────────────────────────────────────────────────
// ── ASSET ALCHEMIST ───────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

// ── Meshy helpers ─────────────────────────────────────────────────────────────

const MESHY_BASE = 'https://api.meshy.ai'
const POLL_INTERVAL_MS = 4_000
const POLL_MAX_ATTEMPTS = 40

type MeshyStatus = 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED'

export interface MeshyTask {
  id: string
  status: MeshyStatus
  model_urls?: { glb?: string; fbx?: string; obj?: string }
  thumbnail_url?: string
  polygon_count?: number
  vertex_count?: number
  progress?: number
}

async function createMeshyTask(prompt: string, artStyle: string, polyTarget: number): Promise<string> {
  const res = await fetch(`${MESHY_BASE}/v2/text-to-3d`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${meshyKey()}`,
    },
    body: JSON.stringify({
      mode: 'preview',
      prompt,
      negative_prompt: 'low quality, blurry, distorted, floating parts, disconnected mesh, NSFW, text, watermark, multiple objects, background, base plate, excessive detail, wireframe',
      art_style: artStyle,
      topology: 'quad',
      target_polycount: polyTarget,
    }),
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => String(res.status))
    throw new Error(`Meshy task creation failed (${res.status}): ${txt}`)
  }
  const data = (await res.json()) as { result: string }
  return data.result
}

async function pollMeshyTask(taskId: string): Promise<MeshyTask> {
  for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
    await new Promise<void>((r) => setTimeout(r, i === 0 ? 3_000 : POLL_INTERVAL_MS))
    const res = await fetch(`${MESHY_BASE}/v2/text-to-3d/${taskId}`, {
      headers: { Authorization: `Bearer ${meshyKey()}` },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) continue
    const task = (await res.json()) as MeshyTask
    if (task.status === 'SUCCEEDED') return task
    if (task.status === 'FAILED' || task.status === 'EXPIRED') {
      throw new Error(`Meshy task ${taskId} ended with status: ${task.status}`)
    }
  }
  throw new Error(`Meshy task ${taskId} did not complete within timeout`)
}

const ART_STYLE_MAP: Record<string, string> = {
  realistic: 'pbr',
  stylized: 'cartoon',
  lowpoly: 'low-poly',
  roblox: 'low-poly',
  cartoon: 'cartoon',
  pbr: 'pbr',
  low_poly: 'low-poly',
}

// ── Fal helpers ───────────────────────────────────────────────────────────────

const FAL_QUEUE_BASE = 'https://queue.fal.run'

interface FalQueueResponse { request_id: string }
interface FalStatusResponse { status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' }
interface FalOutput {
  albedo?: { url: string }
  normal?: { url: string }
  roughness?: { url: string }
  metallic?: { url: string }
  images?: Array<{ url: string }>
}

export interface TextureSet {
  albedo: string | null
  normal: string | null
  roughness: string | null
  metallic: string | null
}

async function generatePbrTextures(prompt: string): Promise<TextureSet> {
  const key = falKey()
  const submitRes = await fetch(`${FAL_QUEUE_BASE}/fal-ai/fast-sdxl/texture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Key ${key}` },
    body: JSON.stringify({
      prompt: `${prompt}, seamless PBR texture, physically based rendering, game asset, high detail`,
      resolution: 1024,
      output_format: 'png',
    }),
    signal: AbortSignal.timeout(15_000),
  })
  if (!submitRes.ok) {
    const txt = await submitRes.text().catch(() => String(submitRes.status))
    throw new Error(`Fal texture submission failed (${submitRes.status}): ${txt}`)
  }
  const queue = (await submitRes.json()) as FalQueueResponse
  const reqId = queue.request_id

  for (let i = 0; i < 20; i++) {
    await new Promise<void>((r) => setTimeout(r, 4_000))
    const statusRes = await fetch(
      `${FAL_QUEUE_BASE}/fal-ai/fast-sdxl/texture/requests/${reqId}/status`,
      { headers: { Authorization: `Key ${key}` }, signal: AbortSignal.timeout(8_000) },
    )
    if (!statusRes.ok) continue
    const status = (await statusRes.json()) as FalStatusResponse
    if (status.status === 'COMPLETED') {
      const resultRes = await fetch(
        `${FAL_QUEUE_BASE}/fal-ai/fast-sdxl/texture/requests/${reqId}`,
        { headers: { Authorization: `Key ${key}` }, signal: AbortSignal.timeout(10_000) },
      )
      if (!resultRes.ok) throw new Error('Failed to fetch Fal result')
      const out = (await resultRes.json()) as FalOutput
      return {
        albedo: out.albedo?.url ?? out.images?.[0]?.url ?? null,
        normal: out.normal?.url ?? out.images?.[1]?.url ?? null,
        roughness: out.roughness?.url ?? out.images?.[2]?.url ?? null,
        metallic: out.metallic?.url ?? null,
      }
    }
    if (status.status === 'FAILED') throw new Error('Fal texture generation failed')
  }
  throw new Error('Fal texture generation timed out')
}

// ── Meshy prompt enhancement ──────────────────────────────────────────────────

/**
 * Deterministic pre-pass that strips noise words and injects quality modifiers
 * before any optional AI enrichment. Runs synchronously — no API call needed.
 *
 * Goal: turn "create a building for my roblox game" into
 * "building, stylized game asset, high quality, clean topology"
 */
function enhanceMeshyPrompt(raw: string): string {
  // 1. Strip generic filler words that dilute the Meshy prompt
  let prompt = raw
    .replace(
      /\b(create|make|generate|build|design|produce|a|an|the|for|my|your|game|roblox|please|me|some)\b/gi,
      ' ',
    )
    .replace(/\s{2,}/g, ' ')
    .trim()

  // 2. Ensure we still have meaningful content after stripping
  if (prompt.length < 3) prompt = raw.trim()

  // 3. Append style qualifier if no style descriptor already present
  if (!/\b(style|poly|cartoon|realistic|stylized|pbr|low.?poly|anime|toon)\b/i.test(prompt)) {
    prompt += ', stylized game asset'
  }

  // 4. Append quality/topology modifiers if absent
  if (!/\b(quality|detailed|clean|topology|optimized|optimised|crisp|sharp)\b/i.test(prompt)) {
    prompt += ', high quality, clean topology'
  }

  // 5. Ensure Roblox-friendliness hints are present
  if (!/\b(roblox|game.ready|watertight|no.floating|single.mesh)\b/i.test(prompt)) {
    prompt += ', game-ready, watertight mesh, no floating parts'
  }

  return prompt
}

// ── Prompt enrichment ─────────────────────────────────────────────────────────

async function enrichPrompt(description: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_MAIN && !process.env.ANTHROPIC_API_KEY) return description
  try {
    const text = await aiGenerate(
      `You are a Roblox 3D asset prompt engineer. Given a short description, return ONLY a single enriched prompt string (no JSON, no quotes) that is specific, game-ready, low-poly focused, Roblox-appropriate, and 1-2 sentences.`,
      description,
      300,
    )
    return text.length > 10 ? text : description
  } catch (err) {
    console.error('[MCP/enrichPrompt] AI prompt enrichment failed, using original:', err instanceof Error ? err.message : err)
    return description
  }
}

// ── Optimisation recommendations ──────────────────────────────────────────────

export interface OptimisationResult {
  recommendations: string[]
  priority: 'low' | 'medium' | 'high' | 'critical'
  estimatedSavingsPct: string
  robloxBudget: string
}

export function buildOptimisationRecommendations(polyCount: number): OptimisationResult {
  const recs: string[] = []
  let priority: OptimisationResult['priority'] = 'low'
  let budget: string

  if (polyCount > 100_000) {
    priority = 'critical'
    budget = 'EXCEEDS Roblox recommended maximum of 100K polys — will impact performance on all devices'
    recs.push('Decimate mesh to under 100K polygons — use Blender Decimate modifier at 0.5-0.7 ratio')
    recs.push('Set up LOD tiers: full detail < 50 studs, 50% at 50-200 studs, 20% beyond 200 studs')
    recs.push('Use RenderFidelity = Automatic on MeshPart so Roblox manages LOD automatically')
    recs.push('Set CollisionFidelity = Box or Hull to reduce physics CPU cost')
    recs.push('Consider splitting into smaller instanced meshes if structure is modular')
  } else if (polyCount > 50_000) {
    priority = 'high'
    budget = 'Mobile will struggle — target under 10K for props, 20K for buildings'
    recs.push('Target under 50K polygons for cross-device compatibility')
    recs.push('Enable RenderFidelity = Automatic to let Roblox manage LOD')
    recs.push('Bake high-res detail into normal maps to retain visual quality at lower poly count')
    recs.push('Set CollisionFidelity = Hull for convex shapes, Box for simple geometry')
  } else if (polyCount > 10_000) {
    priority = 'medium'
    budget = 'Acceptable for desktop; optimise further for mobile'
    recs.push('Merge coplanar faces to eliminate redundant interior geometry')
    recs.push('Bake ambient occlusion and normal maps from a high-res source mesh')
    recs.push('Remove geometry hidden by other parts (interior walls, floor undersides)')
  } else {
    priority = 'low'
    budget = 'Within Roblox best-practice range — good for props and small assets'
    recs.push('Polygon count is within recommended range for Roblox game assets')
    recs.push('Ensure UV islands are packed efficiently (< 5% wasted UV space)')
    recs.push('Verify mesh is watertight — no open edges or internal faces')
  }

  recs.push('Combine albedo + normal + roughness into a 1024×1024 texture atlas to reduce draw calls')
  recs.push('Set CastShadow = false on small props (< 2 studs) to reduce shadow batches')

  const savingsPct = polyCount > 50_000 ? '40-60%' : polyCount > 10_000 ? '20-40%' : '5-15%'
  return { recommendations: recs, priority, estimatedSavingsPct: savingsPct, robloxBudget: budget }
}

// ── Public tool functions — asset-alchemist ───────────────────────────────────

export interface TextTo3dArgs {
  prompt: string
  style?: 'realistic' | 'stylized' | 'lowpoly' | 'roblox' | 'cartoon' | 'pbr' | 'low_poly'
  polyTarget?: number
  enrichPromptWithAI?: boolean
}

export interface TextTo3dResult {
  taskId: string
  meshUrl: string
  thumbnailUrl: string | null
  polygonCount: number | null
  vertexCount: number | null
  artStyle: string
  prompt: string
  status: string
}

export async function toolTextTo3d(args: TextTo3dArgs): Promise<TextTo3dResult> {
  const { prompt, style = 'roblox', polyTarget = 10_000, enrichPromptWithAI = false } = args
  const artStyle = ART_STYLE_MAP[style] ?? 'low-poly'

  // Always run deterministic enhancement first, then optionally layer AI enrichment on top
  const enhanced = enhanceMeshyPrompt(prompt)
  const finalPrompt = enrichPromptWithAI
    ? await enrichPrompt(enhanced)
    : enhanced

  const taskId = await createMeshyTask(finalPrompt, artStyle, polyTarget)
  const task = await pollMeshyTask(taskId)
  const meshUrl = task.model_urls?.glb ?? task.model_urls?.fbx ?? task.model_urls?.obj ?? null
  if (!meshUrl) throw new Error('Meshy returned no downloadable mesh URL')

  return {
    taskId: task.id,
    meshUrl,
    thumbnailUrl: task.thumbnail_url ?? null,
    polygonCount: task.polygon_count ?? null,
    vertexCount: task.vertex_count ?? null,
    artStyle,
    prompt: finalPrompt,
    status: task.status,
  }
}

export interface GenerateTextureArgs {
  prompt: string
}

export async function toolGenerateTexture(args: GenerateTextureArgs): Promise<TextureSet> {
  return generatePbrTextures(args.prompt)
}

export interface OptimizeMeshArgs {
  meshUrl: string
  polyCount: number
}

export interface OptimizeMeshResult extends OptimisationResult {
  meshUrl: string
  polyCount: number
}

export function toolOptimizeMesh(args: OptimizeMeshArgs): OptimizeMeshResult {
  const result = buildOptimisationRecommendations(args.polyCount)
  return { meshUrl: args.meshUrl, polyCount: args.polyCount, ...result }
}

// ─────────────────────────────────────────────────────────────────────────────
// ── CITY ARCHITECT ────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RoadSegment {
  id: string
  fromX: number
  fromZ: number
  toX: number
  toZ: number
  width: number
  type: 'main' | 'secondary' | 'alley' | 'highway'
}

export interface BuildingPlacement {
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

export type ZoneType = 'commercial' | 'residential' | 'industrial' | 'park' | 'civic' | 'mixed'

export interface Zone {
  id: string
  name: string
  type: ZoneType
  x: number
  z: number
  width: number
  height: number
}

// ── Urban planning grid ───────────────────────────────────────────────────────

export function createUrbanGrid(
  bounds: { width: number; height: number },
  style: string,
): { roads: RoadSegment[]; zones: Zone[] } {
  const roads: RoadSegment[] = []
  const zones: Zone[] = []

  const isModern = style.includes('modern') || style.includes('urban')
  const isOrganic = style.includes('organic') || style.includes('village')

  const blockSize = isOrganic ? 80 : isModern ? 120 : 100
  const mainRoadWidth = isModern ? 20 : 16
  const secondaryRoadWidth = isModern ? 12 : 10
  const alleyWidth = 6

  let roadId = 0

  for (let x = 0; x <= bounds.width; x += blockSize * 2) {
    roads.push({ id: `road-${roadId++}`, fromX: x, fromZ: 0, toX: x, toZ: bounds.height, width: mainRoadWidth, type: 'main' })
  }
  for (let z = 0; z <= bounds.height; z += blockSize * 2) {
    roads.push({ id: `road-${roadId++}`, fromX: 0, fromZ: z, toX: bounds.width, toZ: z, width: mainRoadWidth, type: 'main' })
  }
  for (let x = blockSize; x < bounds.width; x += blockSize * 2) {
    roads.push({ id: `road-${roadId++}`, fromX: x, fromZ: 0, toX: x, toZ: bounds.height, width: secondaryRoadWidth, type: 'secondary' })
  }
  for (let z = blockSize; z < bounds.height; z += blockSize * 2) {
    roads.push({ id: `road-${roadId++}`, fromX: 0, fromZ: z, toX: bounds.width, toZ: z, width: secondaryRoadWidth, type: 'secondary' })
  }
  if (isModern) {
    for (let x = blockSize / 2; x < bounds.width; x += blockSize) {
      roads.push({ id: `road-${roadId++}`, fromX: x, fromZ: 0, toX: x, toZ: bounds.height, width: alleyWidth, type: 'alley' })
    }
  }

  const centerX = bounds.width / 2
  const centerZ = bounds.height / 2
  let zoneId = 0

  for (let bz = 0; bz < bounds.height; bz += blockSize) {
    for (let bx = 0; bx < bounds.width; bx += blockSize) {
      const dist = Math.sqrt(Math.pow(bx - centerX, 2) + Math.pow(bz - centerZ, 2))
      const maxDist = Math.sqrt(Math.pow(bounds.width, 2) + Math.pow(bounds.height, 2)) / 2
      const ratio = dist / maxDist

      let zoneType: ZoneType
      if (ratio < 0.15) zoneType = 'commercial'
      else if (ratio < 0.3) zoneType = 'mixed'
      else if (ratio < 0.7) zoneType = 'residential'
      else if (bx % (blockSize * 4) < blockSize) zoneType = 'park'
      else zoneType = 'industrial'

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

// ── Building placement ────────────────────────────────────────────────────────

export function placeBuildings(zones: Zone[], buildingTypes: string[], style: string): BuildingPlacement[] {
  const buildings: BuildingPlacement[] = []
  let buildId = 0

  const zoneTypeToBuildingTypes: Record<ZoneType, string[]> = {
    commercial: ['office', 'shop', 'restaurant', 'hotel', 'mall'],
    residential: ['house', 'apartment', 'townhouse', 'villa'],
    industrial: ['warehouse', 'factory', 'workshop'],
    park: ['pavilion', 'gazebo'],
    civic: ['city_hall', 'library', 'school', 'hospital'],
    mixed: ['apartment', 'shop', 'office', 'cafe'],
  }

  for (const zone of zones) {
    if (zone.width < 20 || zone.height < 20) continue
    const applicable = zoneTypeToBuildingTypes[zone.type] ?? ['generic']
    const intersection = buildingTypes.length > 0 ? buildingTypes.filter((t) => applicable.includes(t)) : applicable
    const typePool = intersection.length > 0 ? intersection : applicable
    const padding = 4
    const buildingStep = zone.type === 'residential' ? 24 : 32

    for (let bz = zone.z + padding; bz + 12 <= zone.z + zone.height - padding; bz += buildingStep) {
      for (let bx = zone.x + padding; bx + 12 <= zone.x + zone.width - padding; bx += buildingStep) {
        const selectedType = typePool[buildId % typePool.length]!
        const floors =
          zone.type === 'commercial' ? 3 + (buildId % 5) :
          zone.type === 'industrial' ? 1 :
          zone.type === 'park' ? 1 :
          1 + (buildId % 3)
        const bw = zone.type === 'residential' ? 12 + (buildId % 8) : 16 + (buildId % 12)
        const bd = zone.type === 'residential' ? 12 + (buildId % 6) : 16 + (buildId % 10)
        buildings.push({ id: `building-${buildId++}`, x: bx, z: bz, width: bw, depth: bd, floors, type: selectedType, style, rotation: 0 })
      }
    }
  }

  return buildings
}

// ── Public tool functions — city-architect ────────────────────────────────────

export interface PlanCityArgs {
  cityType: string
  size?: 'small' | 'medium' | 'large'
  style?: string
}

export async function toolPlanCity(args: PlanCityArgs): Promise<Record<string, unknown>> {
  const { cityType, size = 'medium', style = 'modern' } = args
  const studsMap = { small: 512, medium: 1024, large: 2048 }
  const studs = studsMap[size]

  const system = `You are a Roblox city layout architect. Given a city type, size, and style, output ONLY a single valid JSON object representing the full city plan. No prose, no markdown fences. The JSON must match this exact structure:
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
All coordinates are Roblox studs. The map fits within ${studs}x${studs} studs. Include 4-8 zones, a realistic road grid, and 20-50 buildings placed in their zones.`

  const user = `Plan a ${size} ${cityType} city with ${style} style, ${studs}x${studs} studs.`

  try {
    const raw = await aiGenerate(system, user, 2000)
    return parseAiJson<Record<string, unknown>>(raw)
  } catch (err) {
    console.error('[MCP/cityPlan] AI city planning failed, using algorithmic fallback:', err instanceof Error ? err.message : err)
    // Algorithmic fallback
    const bounds = { width: studs, height: studs }
    const { roads, zones } = createUrbanGrid(bounds, style)
    const buildings = placeBuildings(zones, [], style)
    return { cityType, style, bounds, zones, roads, buildings, landmarks: [], atmosphere: style }
  }
}

export interface GenerateBuildingArgs {
  buildingType: string
  style?: string
  kickOffMesh?: boolean
}

export async function toolGenerateBuilding(args: GenerateBuildingArgs): Promise<Record<string, unknown>> {
  const { buildingType, style = 'modern', kickOffMesh = false } = args

  const system = `You are a Roblox building architect. Given a building type and style, output ONLY valid JSON:
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
All dimensions in Roblox studs. meshPrompt should be a 1-2 sentence Meshy-ready 3D generation prompt.`

  let spec: Record<string, unknown>
  try {
    const raw = await aiGenerate(system, `Design a ${buildingType} in ${style} style.`, 800)
    spec = parseAiJson<Record<string, unknown>>(raw)
  } catch (err) {
    console.error('[MCP/generateBuilding] AI building spec failed, using minimal fallback:', err instanceof Error ? err.message : err)
    spec = { buildingType, style }
  }

  if (kickOffMesh && process.env.MESHY_API_KEY) {
    try {
      const meshPrompt = (spec.meshPrompt as string) ?? `${buildingType}, ${style} style, Roblox game asset`
      const res = await fetch(`${MESHY_BASE}/v2/text-to-3d`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.MESHY_API_KEY}` },
        body: JSON.stringify({ mode: 'preview', prompt: meshPrompt, art_style: style.includes('realistic') ? 'pbr' : 'low-poly', target_polycount: 20_000 }),
        signal: AbortSignal.timeout(15_000),
      })
      if (res.ok) {
        const data = (await res.json()) as { result: string }
        spec.meshTaskId = data.result
        spec.meshStatus = 'IN_PROGRESS'
      }
    } catch (meshErr) {
      console.error('[MCP/generateBuilding] Meshy 3D mesh generation failed:', meshErr instanceof Error ? meshErr.message : meshErr)
      spec.meshStatus = 'skipped'
    }
  }

  return spec
}

export interface LayoutDistrictArgs {
  districtType: ZoneType
  width?: number
  height?: number
  density?: 'sparse' | 'medium' | 'dense'
  style?: string
}

export interface LayoutDistrictResult {
  buildings: BuildingPlacement[]
  totalBuildings: number
  districtType: ZoneType
  density: string
}

export function toolLayoutDistrict(args: LayoutDistrictArgs): LayoutDistrictResult {
  const { districtType, width = 256, height = 256, density = 'medium', style = 'modern' } = args

  const densitySpacing: Record<string, number> = { sparse: 48, medium: 32, dense: 20 }
  const step = densitySpacing[density] ?? 32
  const buildings: BuildingPlacement[] = []
  let buildId = 0

  const typePool: Record<ZoneType, string[]> = {
    commercial: ['office', 'shop', 'restaurant', 'hotel', 'mall'],
    residential: ['house', 'apartment', 'townhouse', 'villa'],
    industrial: ['warehouse', 'factory', 'workshop'],
    park: ['pavilion', 'gazebo', 'fountain'],
    civic: ['city_hall', 'library', 'school', 'hospital'],
    mixed: ['apartment', 'shop', 'cafe', 'office'],
  }

  const pool = typePool[districtType] ?? ['generic']
  const padding = 6

  for (let bz = padding; bz + 10 <= height - padding; bz += step) {
    for (let bx = padding; bx + 10 <= width - padding; bx += step) {
      const selectedType = pool[buildId % pool.length]!
      const floors = districtType === 'commercial' ? 2 + (buildId % 6) : 1 + (buildId % 3)
      buildings.push({
        id: `building-${buildId++}`,
        x: bx, z: bz,
        width: density === 'dense' ? 12 : 16,
        depth: density === 'dense' ? 12 : 16,
        floors, type: selectedType, style, rotation: 0,
      })
    }
  }

  return { buildings, totalBuildings: buildings.length, districtType, density }
}

// ─────────────────────────────────────────────────────────────────────────────
// ── TERRAIN FORGE ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

// ── Constants ─────────────────────────────────────────────────────────────────

export const ROBLOX_MATERIALS = [
  'Grass', 'Dirt', 'Sand', 'Rock', 'Sandstone', 'Snow', 'Mud',
  'WoodPlanks', 'SmoothPlastic', 'LeafyGrass', 'Asphalt', 'Cobblestone',
  'Ice', 'Water', 'Ground', 'Limestone', 'Basalt', 'Glacier',
  'Slate', 'CrackedLava', 'Salt', 'Concrete', 'Fabric',
] as const

export type RobloxMaterial = typeof ROBLOX_MATERIALS[number]

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

// ── Types ─────────────────────────────────────────────────────────────────────

export interface HeightmapPoint {
  x: number
  z: number
  height: number
  material: string
}

export interface TerrainRegion {
  x: number
  z: number
  width: number
  height: number
}

export interface BiomeMeta {
  biome: string
  elevationProfile: 'flat' | 'rolling' | 'hilly' | 'mountainous'
  baseElevation: number
  elevationVariance: number
  primaryMaterial: string
  secondaryMaterial: string
  features: string[]
  waterLevel: number | null
}

// ── Luau code generators ──────────────────────────────────────────────────────

function luauMaterial(mat: string): string {
  const valid = new Set<string>(ROBLOX_MATERIALS)
  const resolved = valid.has(mat) ? mat : 'Grass'
  return `Enum.Material.${resolved}`
}

export function generateTerrainLuau(params: {
  heightmap: HeightmapPoint[]
  originX: number
  originY: number
  originZ: number
  voxelSize: number
  biome: string
  waterLevel: number | null
}): string {
  const { heightmap, originX, originY, originZ, voxelSize, biome, waterLevel } = params
  const lines: string[] = [
    `-- Generated by ForjeGames Terrain Forge`,
    `-- Biome: ${biome}`,
    `-- Points: ${heightmap.length}`,
    `local terrain = workspace.Terrain`,
    `local vs = ${voxelSize} -- voxel size in studs`,
    ``,
    `-- Fill base terrain layer`,
    `terrain:Clear()`,
    ``,
  ]

  for (const pt of heightmap) {
    const worldX = originX + pt.x
    const worldY = originY + pt.height
    const worldZ = originZ + pt.z
    const mat = luauMaterial(pt.material)
    const blockH = Math.max(4, pt.height)
    lines.push(
      `terrain:FillBlock(CFrame.new(${worldX}, ${originY + blockH / 2}, ${worldZ}), ` +
      `Vector3.new(vs, ${blockH}, vs), ${mat})`,
    )
  }

  if (waterLevel !== null && waterLevel > 0) {
    lines.push(``, `-- Water layer at elevation ${waterLevel}`)
    for (const pt of heightmap) {
      if (pt.height < waterLevel) {
        const worldX = originX + pt.x
        const worldZ = originZ + pt.z
        const waterH = waterLevel - pt.height
        lines.push(
          `terrain:FillBlock(CFrame.new(${worldX}, ${originY + waterLevel - waterH / 2}, ${worldZ}), ` +
          `Vector3.new(vs, ${waterH}, vs), Enum.Material.Water)`,
        )
      }
    }
  }

  lines.push(``, `print("[TerrainForge] Terrain generation complete — ${heightmap.length} voxels placed")`)
  return lines.join('\n')
}

export function generatePaintTerrainLuau(params: {
  region: TerrainRegion
  material: string
  originX: number
  originY: number
  originZ: number
  voxelSize: number
  terrainHeight: number
}): string {
  const { region, material, originX, originY, originZ, voxelSize, terrainHeight } = params
  const mat = luauMaterial(material)
  const lines: string[] = [
    `-- Generated by ForjeGames Terrain Forge — Paint: ${material}`,
    `local terrain = workspace.Terrain`,
    `local vs = ${voxelSize}`,
    ``,
  ]

  for (let z = region.z; z < region.z + region.height; z += voxelSize) {
    for (let x = region.x; x < region.x + region.width; x += voxelSize) {
      const worldX = originX + x
      const worldZ = originZ + z
      lines.push(
        `terrain:FillBlock(CFrame.new(${worldX}, ${originY + terrainHeight / 2}, ${worldZ}), ` +
        `Vector3.new(vs, ${terrainHeight}, vs), ${mat})`,
      )
    }
  }

  lines.push(``, `print("[TerrainForge] Paint complete — material: ${material}")`)
  return lines.join('\n')
}

export function generateWaterLuau(params: {
  waterType: 'ocean' | 'river' | 'lake'
  x: number
  y: number
  z: number
  width: number
  depth: number
  length: number
}): string {
  const { waterType, x, y, z, width, depth, length } = params
  const lines: string[] = [
    `-- Generated by ForjeGames Terrain Forge — Water: ${waterType}`,
    `local terrain = workspace.Terrain`,
    ``,
  ]

  if (waterType === 'ocean' || waterType === 'river') {
    const cx = x + width / 2
    const cy = y - depth / 2
    const cz = z + length / 2
    lines.push(
      `terrain:FillBlock(`,
      `  CFrame.new(${cx}, ${cy}, ${cz}),`,
      `  Vector3.new(${width}, ${depth}, ${length}),`,
      `  Enum.Material.Water`,
      `)`,
    )
    if (waterType === 'ocean') {
      lines.push(
        ``,
        `terrain:FillBlock(`,
        `  CFrame.new(${cx}, ${cy - depth}, ${cz}),`,
        `  Vector3.new(${width}, ${depth}, ${length}),`,
        `  Enum.Material.Sand`,
        `)`,
      )
    }
  } else {
    const radius = Math.min(width, length) / 2
    lines.push(
      `terrain:FillBall(`,
      `  Vector3.new(${x + width / 2}, ${y - radius * 0.4}, ${z + length / 2}),`,
      `  ${radius},`,
      `  Enum.Material.Water`,
      `)`,
      ``,
      `terrain:FillBall(`,
      `  Vector3.new(${x + width / 2}, ${y - radius * 0.9}, ${z + length / 2}),`,
      `  ${radius * 1.1},`,
      `  Enum.Material.Rock`,
      `)`,
    )
  }

  lines.push(``, `print("[TerrainForge] Water (${waterType}) placed at ${x}, ${y}, ${z}")`)
  return lines.join('\n')
}

// ── Biome meta (AI-enriched or keyword fallback) ──────────────────────────────

export async function getBiomeMeta(description: string): Promise<BiomeMeta> {
  const keywordFallback = (): BiomeMeta => {
    const lower = description.toLowerCase()
    const biome =
      lower.includes('snow') || lower.includes('arctic') ? 'arctic' :
      lower.includes('desert') || lower.includes('sand') ? 'desert' :
      lower.includes('ocean') || lower.includes('sea') ? 'ocean' :
      lower.includes('mountain') ? 'mountains' :
      lower.includes('volcano') || lower.includes('lava') ? 'volcanic' :
      lower.includes('swamp') || lower.includes('marsh') ? 'swamp' :
      lower.includes('city') || lower.includes('urban') ? 'urban' :
      'forest'

    const mats = BIOME_MATERIALS[biome] ?? BIOME_MATERIALS['forest']!
    return {
      biome,
      elevationProfile: biome === 'mountains' ? 'mountainous' : biome === 'desert' ? 'flat' : 'rolling',
      baseElevation: biome === 'ocean' ? 10 : 40,
      elevationVariance: biome === 'mountains' ? 40 : 15,
      primaryMaterial: mats[0]!,
      secondaryMaterial: mats[1] ?? 'Rock',
      features: [],
      waterLevel: biome === 'ocean' ? 30 : biome === 'swamp' ? 25 : null,
    }
  }

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_MAIN && !process.env.ANTHROPIC_API_KEY) return keywordFallback()

  try {
    const raw = await aiGenerate(
      `You are a Roblox terrain generation engine. Given a biome description, output ONLY valid JSON:
{
  "biome": string,
  "elevationProfile": "flat"|"rolling"|"hilly"|"mountainous",
  "baseElevation": number,
  "elevationVariance": number,
  "primaryMaterial": string,
  "secondaryMaterial": string,
  "features": string[],
  "waterLevel": number|null
}
Valid materials: ${ROBLOX_MATERIALS.join(', ')}`,
      description,
      600,
    )
    return parseAiJson<BiomeMeta>(raw)
  } catch {
    return keywordFallback()
  }
}

// ── Noise helpers ─────────────────────────────────────────────────────────────

function createRng(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0x100000000
  }
}

function seedHash(nx: number, nz: number, octave: number): number {
  const ix = Math.floor(nx * 1000)
  const iz = Math.floor(nz * 1000)
  let h = (ix * 374761393 + iz * 668265263 + octave * 2246822519) >>> 0
  h ^= h >>> 13
  h = Math.imul(h, 1540483477) >>> 0
  h ^= h >>> 15
  return h / 0x100000000
}

function noiseOctaves(_rng: () => number, nx: number, nz: number, profile: string): number {
  const octaves = profile === 'mountainous' ? 5 : profile === 'hilly' ? 4 : 3
  let value = 0
  let amplitude = 1
  let frequency = 1
  let maxValue = 0
  for (let i = 0; i < octaves; i++) {
    const h = seedHash(nx * frequency, nz * frequency, i) * 2 - 1
    value += amplitude * h * Math.sin(nx * frequency * Math.PI) * Math.cos(nz * frequency * Math.PI)
    maxValue += amplitude
    amplitude *= 0.5
    frequency *= 2
  }
  const normalized = value / maxValue
  if (profile === 'flat') return normalized * 0.2
  if (profile === 'rolling') return normalized * 0.6
  if (profile === 'hilly') return normalized * 0.8
  return normalized
}

// ── Public tool functions — terrain-forge ─────────────────────────────────────

export interface GenerateTerrainArgs {
  biome: string
  size?: { width: number; depth: number }
  features?: string[]
  originX?: number
  originY?: number
  originZ?: number
  voxelSize?: number
  seed?: number
}

export interface GenerateTerrainResult {
  luauScript: string
  meta: BiomeMeta
  voxelCount: number
  gridSize: number
  size: { width: number; depth: number }
  seed: number | null
}

export async function toolGenerateTerrain(args: GenerateTerrainArgs): Promise<GenerateTerrainResult> {
  const {
    biome,
    size = { width: 512, depth: 512 },
    features = [],
    originX = 0,
    originY = 0,
    originZ = 0,
    voxelSize = 4,
    seed,
  } = args

  const meta = await getBiomeMeta(
    features.length > 0 ? `${biome}, features: ${features.join(', ')}` : biome,
  )

  const rng = createRng(seed ?? Date.now())
  const gridSize = Math.floor(Math.min(size.width, size.depth) / voxelSize)
  const clampedGrid = Math.min(gridSize, 64)
  const heightmap: HeightmapPoint[] = []

  for (let gz = 0; gz < clampedGrid; gz++) {
    for (let gx = 0; gx < clampedGrid; gx++) {
      const nx = gx / clampedGrid
      const nz = gz / clampedGrid
      let elevation = meta.baseElevation + noiseOctaves(rng, nx, nz, meta.elevationProfile) * meta.elevationVariance
      elevation = Math.max(4, Math.min(100, elevation))

      const biomeDefaults = BIOME_MATERIALS[meta.biome] ?? BIOME_MATERIALS['forest']!
      let material: string
      if (meta.waterLevel !== null && elevation < meta.waterLevel) {
        material = 'Water'
      } else if (elevation > 80) {
        material = meta.biome === 'arctic' ? 'Glacier' : 'Rock'
      } else if (elevation > 60) {
        material = meta.secondaryMaterial ?? biomeDefaults[1] ?? 'Rock'
      } else {
        material = meta.primaryMaterial ?? biomeDefaults[0] ?? 'Grass'
      }

      heightmap.push({
        x: Math.round((gx / clampedGrid) * size.width),
        z: Math.round((gz / clampedGrid) * size.depth),
        height: Math.round(elevation * 10) / 10,
        material,
      })
    }
  }

  const luauScript = generateTerrainLuau({ heightmap, originX, originY, originZ, voxelSize, biome: meta.biome, waterLevel: meta.waterLevel })

  return { luauScript, meta, voxelCount: heightmap.length, gridSize: clampedGrid, size, seed: seed ?? null }
}

export interface PaintTerrainArgs {
  material: string
  region: TerrainRegion
  originX?: number
  originY?: number
  originZ?: number
  voxelSize?: number
  terrainHeight?: number
}

export interface PaintTerrainResult {
  luauScript: string
  material: string
  region: TerrainRegion
  voxelSize: number
}

export function toolPaintTerrain(args: PaintTerrainArgs): PaintTerrainResult {
  const { material, region, originX = 0, originY = 0, originZ = 0, voxelSize = 4, terrainHeight = 20 } = args
  const valid = new Set<string>(ROBLOX_MATERIALS)
  if (!valid.has(material)) {
    throw new Error(`Invalid material "${material}". Valid: ${ROBLOX_MATERIALS.join(', ')}`)
  }
  const luauScript = generatePaintTerrainLuau({ region, material, originX, originY, originZ, voxelSize, terrainHeight })
  return { luauScript, material, region, voxelSize }
}

export interface CreateWaterArgs {
  waterType: 'ocean' | 'river' | 'lake'
  x?: number
  y?: number
  z?: number
  width?: number
  depth?: number
  length?: number
}

export interface CreateWaterResult {
  luauScript: string
  waterType: 'ocean' | 'river' | 'lake'
  x: number
  y: number
  z: number
  width: number
  depth: number
  length: number
}

export function toolCreateWater(args: CreateWaterArgs): CreateWaterResult {
  const { waterType, x = 0, y = 0, z = 0, width = 256, depth = 20, length = 256 } = args
  const luauScript = generateWaterLuau({ waterType, x, y, z, width, depth, length })
  return { luauScript, waterType, x, y, z, width, depth, length }
}

// ─────────────────────────────────────────────────────────────────────────────
// mcp-client.ts compatibility aliases
//
// mcp-client.ts dynamically imports this module and expects these exact names
// via its McpToolsModule interface. These delegates keep the call-site unchanged.
// ─────────────────────────────────────────────────────────────────────────────

export async function generateTerrain(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const result = await toolGenerateTerrain(args as unknown as GenerateTerrainArgs)
  return result as unknown as Record<string, unknown>
}

export async function planCity(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  return toolPlanCity(args as unknown as PlanCityArgs)
}

export async function textTo3d(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const result = await toolTextTo3d(args as unknown as TextTo3dArgs)
  return result as unknown as Record<string, unknown>
}

export async function generateTexture(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const result = await toolGenerateTexture(args as unknown as GenerateTextureArgs)
  return result as unknown as Record<string, unknown>
}
