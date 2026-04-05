/**
 * MCP Client — direct function-call transport.
 *
 * Instead of making HTTP JSON-RPC calls to sidecar MCP servers, this module
 * calls tool functions imported from `src/lib/mcp-tools.ts` in-process.
 * No network hop, no protocol overhead, Vercel-friendly.
 *
 * When `mcp-tools.ts` is not yet present (e.g. the companion agent hasn't
 * shipped yet) or when an external API key is missing (MESHY_API_KEY,
 * FAL_KEY), calls transparently fall back to synthetic demo data so the rest
 * of the app continues to work.
 *
 * Public API (unchanged — all call-sites remain compatible):
 *   callTool(server, tool, args)           → McpCallResult
 *   callToolsParallel([{server,tool,args}]) → McpCallResult[]
 *   detectMcpIntent(userMsg, aiResponse)   → McpDetectedIntent[] | null
 *   getMcpToolStatus()                     → McpToolStatus
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface McpCallResult {
  server: string
  tool: string
  success: boolean
  data: Record<string, unknown>
  /** true when the result is synthetic demo data, not a real tool response */
  demo: boolean
  /** populated when demo: true — explains why demo data was returned */
  warning?: string
}

/**
 * A single detected intent from a conversation turn.
 * `detectMcpIntent` may return several when a message spans multiple domains.
 */
export interface McpDetectedIntent {
  server: string
  tool: string
  args: Record<string, unknown>
  /** 0–1 score; callers can threshold (e.g. only act when > 0.5) */
  confidence: number
}

/**
 * Reports which MCP tools are available in the current environment.
 * Drives UI badges / capability warnings without needing to attempt a real call.
 */
export interface McpToolStatus {
  /** mcp-tools.ts module is loaded and available */
  moduleLoaded: boolean
  /** External 3-D generation API (Meshy) is configured */
  meshyAvailable: boolean
  /** External texture generation API (Fal) is configured */
  falAvailable: boolean
  /** Terrain + city tools work without external keys */
  terrainAvailable: boolean
  cityAvailable: boolean
}

// ── Tool module interface ─────────────────────────────────────────────────────
//
// We use a dynamic import so the file compiles cleanly before mcp-tools.ts
// exists, and auto-activates the moment it ships.

type ToolFn = (args: Record<string, unknown>) => Promise<Record<string, unknown>>

interface McpToolsModule {
  generateTerrain:  ToolFn
  planCity:         ToolFn
  textTo3d:         ToolFn
  generateTexture:  ToolFn
}

let _toolsModule: McpToolsModule | null = null
let _toolsLoadAttempted = false

async function loadToolsModule(): Promise<McpToolsModule | null> {
  if (_toolsLoadAttempted) return _toolsModule
  _toolsLoadAttempted = true
  try {
    // Dynamic import — silently absent until the companion agent delivers the file.
    const mod = await import('./mcp-tools') as Partial<McpToolsModule>
    if (
      typeof mod.generateTerrain === 'function' &&
      typeof mod.planCity        === 'function' &&
      typeof mod.textTo3d        === 'function' &&
      typeof mod.generateTexture === 'function'
    ) {
      _toolsModule = mod as McpToolsModule
    }
  } catch {
    // mcp-tools.ts not present yet — stay in demo mode
  }
  return _toolsModule
}

// ── Tool router ───────────────────────────────────────────────────────────────

type ToolKey = `${string}/${string}`

/** Maps "server/tool" → the function in McpToolsModule that handles it. */
const TOOL_ROUTES: Record<ToolKey, (m: McpToolsModule) => ToolFn> = {
  'terrain-forge/generate-terrain': (m) => m.generateTerrain,
  'city-architect/plan-city':       (m) => m.planCity,
  'asset-alchemist/text-to-3d':     (m) => m.textTo3d,
  'asset-alchemist/generate-texture': (m) => m.generateTexture,
}

// ── Demo fallback ─────────────────────────────────────────────────────────────

function buildDemoResult(
  server: string,
  tool: string,
  warning?: string
): McpCallResult {
  return {
    server,
    tool,
    success: true,
    demo: true,
    warning,
    data: {
      message: `[Demo] ${server}/${tool} will generate real output once mcp-tools.ts is deployed and API keys are configured`,
      preview: 'https://forjegames.com/demo/mesh-preview.svg',
    },
  }
}

// ── Public: callTool ──────────────────────────────────────────────────────────

/**
 * Calls a tool by server + tool name.
 *
 * Resolution order:
 *   1. Direct function call via mcp-tools.ts (zero HTTP overhead)
 *   2. Demo data with a descriptive warning
 *
 * Throws never — errors are captured into `warning` on the demo result.
 */
export async function callTool(
  server: string,
  tool: string,
  args: Record<string, unknown>
): Promise<McpCallResult> {
  const key: ToolKey = `${server}/${tool}`
  const routeSelector = TOOL_ROUTES[key]

  if (!routeSelector) {
    return buildDemoResult(
      server,
      tool,
      `Unknown tool "${key}". Registered: ${Object.keys(TOOL_ROUTES).join(', ')}`
    )
  }

  const mod = await loadToolsModule()

  if (!mod) {
    return buildDemoResult(
      server,
      tool,
      'mcp-tools.ts is not yet available. Falling back to demo data.'
    )
  }

  try {
    const fn   = routeSelector(mod)
    const data = await fn(args)
    return { server, tool, success: true, demo: false, data }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return buildDemoResult(server, tool, message)
  }
}

// ── Public: callToolsParallel ─────────────────────────────────────────────────

/**
 * Calls multiple tools concurrently. Returns all results (settled).
 * Useful for orchestrating multi-tool workflows from a single user command.
 */
export async function callToolsParallel(
  calls: Array<{ server: string; tool: string; args: Record<string, unknown> }>
): Promise<McpCallResult[]> {
  const results = await Promise.allSettled(
    calls.map((c) => callTool(c.server, c.tool, c.args))
  )
  return results.map((r, i) =>
    r.status === 'fulfilled'
      ? r.value
      : buildDemoResult(
          calls[i]!.server,
          calls[i]!.tool,
          r.reason instanceof Error ? r.reason.message : 'Unknown error'
        )
  )
}

// ── Intent detection helpers ──────────────────────────────────────────────────

const BIOME_KEYWORDS: Record<string, string> = {
  forest: 'forest', jungle: 'jungle', desert: 'desert',
  snow: 'snow', arctic: 'snow', tundra: 'tundra',
  swamp: 'swamp', marsh: 'swamp', bog: 'swamp',
  beach: 'beach', ocean: 'ocean', sea: 'ocean',
  lake: 'lake', pond: 'lake', river: 'river', stream: 'river',
  volcanic: 'volcanic', lava: 'volcanic',
  mountain: 'mountain', hill: 'mountain', ridge: 'mountain',
  valley: 'valley', canyon: 'canyon', gorge: 'canyon',
  cave: 'cave', cavern: 'cave',
  meadow: 'meadow', plains: 'plains', savanna: 'savanna',
  island: 'island', cliff: 'cliff',
}

function detectBiome(text: string): string {
  const lower = text.toLowerCase()
  for (const [keyword, biome] of Object.entries(BIOME_KEYWORDS)) {
    if (lower.includes(keyword)) return biome
  }
  return 'forest'
}

function detectArtStyle(text: string): string {
  const lower = text.toLowerCase()
  if (/realistic|photorealistic|lifelike/.test(lower))               return 'realistic'
  if (/cartoon|toon|styliz|cell.?shad/.test(lower))                  return 'cartoon'
  if (/voxel|blocky|minecraft/.test(lower))                          return 'voxel'
  if (/low.?poly/.test(lower))                                       return 'low-poly'
  if (/anime|manga|japanese\s+styl/.test(lower))                     return 'anime'
  if (/fantasy|magical|epic/.test(lower))                            return 'fantasy'
  if (/sci.?fi|futuristic|cyberpunk/.test(lower))                    return 'sci-fi'
  return 'game-asset'
}

function detectDensity(text: string): number {
  const lower = text.toLowerCase()
  if (/dense|packed|crowded|busy/.test(lower))                       return 0.8
  if (/sparse|spread|open|rural/.test(lower))                        return 0.2
  if (/suburban|residential|quiet/.test(lower))                      return 0.4
  if (/downtown|metropolitan|city\s*center|high.?rise/.test(lower))  return 0.9
  if (/mid.?density|medium/.test(lower))                             return 0.5
  return 0.5
}

function detectMapSize(text: string): number {
  const lower = text.toLowerCase()
  if (/\bhuge\b|\bmassive\b|\bvast\b/.test(lower))   return 4096
  if (/\blarge\b|\bbig\b/.test(lower))               return 2048
  if (/\bsmall\b|\btiny\b|\bcompact\b/.test(lower))  return 512
  return 1024
}

function detectGridSize(text: string): number {
  const lower = text.toLowerCase()
  if (/\blarge\b|\bbig\b|\bhuge\b/.test(lower))    return 8
  if (/\bsmall\b|\btiny\b/.test(lower))            return 3
  return 5
}

// ── Intent pattern definitions ────────────────────────────────────────────────

interface IntentPattern {
  server:     string
  tool:       string
  /**
   * Positive pattern groups — each group is an OR; all groups must match (AND).
   * Single group = standard OR match.
   */
  patterns:   RegExp[][]
  /** If any exclusion matches the combined text, this intent is suppressed. */
  exclude?:   RegExp[]
  /** Base confidence when patterns match. Boosted by extra keyword hits. */
  baseScore:  number
  /** Extra patterns that each add +0.1 to confidence (capped at 1). */
  boostPatterns?: RegExp[]
  extractArgs: (userMessage: string, aiResponse: string) => Record<string, unknown>
}

// Pattern arrays use nested arrays: outer = AND groups, inner = OR alternatives.
// For backward compat, a flat array is treated as a single AND group.

const INTENT_PATTERNS: IntentPattern[] = [
  // ── Terrain ──────────────────────────────────────────────────────────────
  {
    server: 'terrain-forge',
    tool:   'generate-terrain',
    patterns: [[
      /\bterrain\b/i,    /\blandscape\b/i,  /\bbiome\b/i,
      /\bheightmap\b/i,  /\bmountain/i,     /\bhill\b/i,
      /\bvalley\b/i,     /\bocean\b/i,      /\blake\b/i,
      /\briver\b/i,      /\bbeach\b/i,      /\bflatten\b/i,
      /\bdesert\b/i,     /\bvolcanic\b/i,   /\bcanyon\b/i,
      /\bcliff/i,        /\bswamp\b/i,      /\bforest\s*floor/i,
      /\bgenerate\s*(a\s*)?(new\s*)?map\b/i,
      /\bsculpt\s*(the\s*)?ground/i,        /\bsnow.*\bground/i,
      /\btopograph/i,    /\berosion\b/i,    /\belevation\b/i,
    ]],
    exclude:  [/\bcity\b/i, /\bbuilding\b/i, /\b3d\s*model\b/i],
    baseScore: 0.6,
    boostPatterns: [
      /\bterrain\b/i, /\bbiome\b/i, /\bheightmap\b/i, /\blandscape\b/i,
    ],
    extractArgs: (msg) => ({
      biome:     detectBiome(msg),
      seed:      Date.now(),
      size:      detectMapSize(msg),
      roughness: /\bflat\b/i.test(msg) ? 0.1 : /\brough\b|\brugged\b/i.test(msg) ? 0.9 : 0.5,
    }),
  },

  // ── City ─────────────────────────────────────────────────────────────────
  {
    server: 'city-architect',
    tool:   'plan-city',
    patterns: [[
      /\bcity\b/i,          /\btown\b/i,         /\burban\b/i,
      /\broad\s*network/i,  /\bstreet/i,         /\bblock\b/i,
      /\bneighborhood\b/i,  /\bdistrict\b/i,     /\bskyline\b/i,
      /\bskyscraper/i,      /\bdowntown\b/i,     /\bvillage\b/i,
      /\bsuburb/i,          /\bintersection\b/i, /\bparking\s*lot\b/i,
      /\bsidewalk/i,        /\bcrosswalk/i,      /\bmetropolis\b/i,
      /\bhighway\b/i,       /\bavenue\b/i,       /\bboulevard\b/i,
      /\bzoning\b/i,        /\bcivic\b/i,        /\bcommercial\s*area/i,
    ]],
    exclude:  [/\b3d\s*model\b/i, /\bmesh\b/i],
    baseScore: 0.6,
    boostPatterns: [
      /\bcity\b/i, /\burban\b/i, /\btown\b/i, /\bstreet/i,
    ],
    extractArgs: (msg) => ({
      density:  detectDensity(msg),
      style:    /\bmodern\b/i.test(msg)     ? 'modern'
              : /\bmedieval\b/i.test(msg)   ? 'medieval'
              : /\bfuturistic\b/i.test(msg) ? 'futuristic'
              : /\bwestern\b/i.test(msg)    ? 'western'
              : /\bjapanese\b/i.test(msg)   ? 'japanese'
              : 'mixed',
      gridSize: detectGridSize(msg),
    }),
  },

  // ── 3D model via Meshy ────────────────────────────────────────────────────
  {
    server: 'asset-alchemist',
    tool:   'text-to-3d',
    patterns: [[
      /\b3d\s*model\b/i,            /\bmesh\b/i,
      /\bgenerate\s*(a\s*)?(3d\s*)?model/i,
      /\bcreate\s*(a\s*)?(3d\s*)?model/i,
      /\bmake\s*(a\s*)?(3d\s*)?model/i,
      /\bsculpt\s*(a|an)\b/i,       /\bcustom\s*asset\b/i,
      /\bgenerate\s*(a\s*)?mesh\b/i,
      /\b3d\s*prop\b/i,             /\bprop\s*model\b/i,
      /\bfurniture\s*model\b/i,     /\bvehicle\s*model\b/i,
      /\bweapon\s*model\b/i,        /\bcharacter\s*model\b/i,
      /\btext.to.3d\b/i,            /\b3d\s*asset\b/i,
    ]],
    baseScore: 0.55,
    boostPatterns: [
      /\b3d\b/i, /\bmesh\b/i, /\bmodel\b/i, /\bprop\b/i,
    ],
    extractArgs: (msg) => ({
      prompt: msg
        .replace(/^(generate|create|make|build)\s*(a\s*)?(3d\s*)?(model|mesh|prop|asset)\s*(of\s*)?/i, '')
        .trim() || msg,
      art_style:        detectArtStyle(msg),
      target_polycount: /\blow.?poly\b/i.test(msg) ? 5_000 : 15_000,
    }),
  },

  // ── Texture via Fal ───────────────────────────────────────────────────────
  {
    server: 'asset-alchemist',
    tool:   'generate-texture',
    patterns: [[
      /\btexture\b/i,               /\bpbr\b/i,
      /\bmaterial\s*map/i,          /\bsurface\s*(texture|material)/i,
      /\balbedo\b/i,                /\bnormal\s*map/i,
      /\broughness\s*map/i,         /\bmetallic\s*map/i,
      /\bgenerate\s*(a\s*)?texture/i,
      /\bcreate\s*(a\s*)?texture/i, /\bseamless\s*texture/i,
      /\btile(able)?\s*(texture|pattern)/i,
      /\bskin\s*(texture|pattern)/i,
      /\bground\s*texture/i,        /\bwall\s*texture/i,
      /\bfloor\s*texture/i,
    ]],
    exclude:  [/\b3d\s*model\b/i, /\bmesh\b/i, /\bcity\b/i, /\bterrain\b/i],
    baseScore: 0.55,
    boostPatterns: [
      /\btexture\b/i, /\bpbr\b/i, /\bmaterial\b/i, /\bseamless\b/i,
    ],
    extractArgs: (msg) => ({
      prompt:     msg,
      resolution: /\bhigh\s*res\b|\b2k\b|\b4k\b/i.test(msg) ? 2048 : 1024,
      seamless:   !/\bnon.?seamless\b/i.test(msg),
    }),
  },
]

// ── Public: detectMcpIntent ───────────────────────────────────────────────────

/**
 * Detects which MCP tool(s) to call based on the conversation turn.
 *
 * Returns an array of detected intents sorted by confidence (highest first),
 * or `null` if no intent cleared the minimum threshold (0.4).
 *
 * Callers that only want the single best match can use `result?.[0]`.
 * The legacy shape `{ server, tool, args }` is available on each element too.
 *
 * Supports detecting MULTIPLE intents per message
 * (e.g. "build a city with custom terrain" → [city@0.75, terrain@0.65]).
 */
export function detectMcpIntent(
  userMessage: string,
  aiResponse:  string
): McpDetectedIntent[] | null {
  const combined = `${userMessage} ${aiResponse}`
  const MINIMUM_CONFIDENCE = 0.4

  const matches: McpDetectedIntent[] = []

  for (const pattern of INTENT_PATTERNS) {
    // Exclusion check
    if (pattern.exclude?.some((re) => re.test(combined))) continue

    // Each element of `patterns` is an OR group.
    // All groups must have at least one hit (AND of ORs).
    const singleGroup = pattern.patterns[0]
    if (!singleGroup) continue

    const groupHits = pattern.patterns.filter((group) =>
      group.some((re) => re.test(combined))
    )
    if (groupHits.length !== pattern.patterns.length) continue

    // Count individual positive pattern hits for confidence boosting
    const positiveHits = singleGroup.filter((re) => re.test(combined)).length
    const boostHits    = (pattern.boostPatterns ?? []).filter((re) => re.test(combined)).length

    const confidence = Math.min(
      1,
      pattern.baseScore
        + positiveHits  * 0.05   // each extra positive pattern hit adds 0.05
        + boostHits     * 0.10   // each boost-word hit adds 0.10
    )

    if (confidence >= MINIMUM_CONFIDENCE) {
      matches.push({
        server:     pattern.server,
        tool:       pattern.tool,
        args:       pattern.extractArgs(userMessage, aiResponse),
        confidence,
      })
    }
  }

  if (matches.length === 0) return null

  // Deduplicate by server/tool (keep highest confidence if both patterns fired)
  const seen = new Map<ToolKey, McpDetectedIntent>()
  for (const m of matches) {
    const key: ToolKey = `${m.server}/${m.tool}`
    const existing = seen.get(key)
    if (!existing || m.confidence > existing.confidence) seen.set(key, m)
  }

  const deduped = [...seen.values()]
  deduped.sort((a, b) => b.confidence - a.confidence)
  return deduped
}

// ── Public: getMcpToolStatus ──────────────────────────────────────────────────

/**
 * Returns which MCP tools are available in the current process environment.
 * Use this to drive UI badges, capability warnings, or conditional prompting.
 *
 * This function is synchronous and safe to call at module evaluation time.
 */
export function getMcpToolStatus(): McpToolStatus {
  const meshyAvailable = Boolean(
    process.env.MESHY_API_KEY ?? process.env.NEXT_PUBLIC_MESHY_KEY
  )
  const falAvailable = Boolean(
    process.env.FAL_KEY ?? process.env.FAL_API_KEY ?? process.env.NEXT_PUBLIC_FAL_KEY
  )

  return {
    // moduleLoaded reflects last cached state; true once first successful import
    moduleLoaded:     _toolsModule !== null,
    meshyAvailable,
    falAvailable,
    // Terrain and city generation are pure-compute — no external API needed
    terrainAvailable: true,
    cityAvailable:    true,
  }
}
