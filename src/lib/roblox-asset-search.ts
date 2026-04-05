/**
 * Roblox Marketplace Asset Search
 *
 * Searches the Roblox Creator Store (catalog API) for real marketplace assets.
 * Used by the AI building pipeline to find existing assets before generating
 * custom meshes with Meshy — marketplace-first approach.
 *
 * Supported asset types: Model, Audio, Decal, MeshPart
 * Results are in-memory cached for 5 minutes per query key.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type AssetType = 'Model' | 'Audio' | 'Decal' | 'MeshPart'

export interface MarketplaceAsset {
  assetId: number
  name: string
  description: string
  creator: string
  creatorId: number
  type: AssetType
  /** Free = price 0, not null */
  isFree: boolean
  thumbnailUrl: string | null
  /** Roblox catalog page URL */
  catalogUrl: string
}

export interface AssetSearchResult {
  query: string
  type: AssetType
  assets: MarketplaceAsset[]
  fromCache: boolean
  searchedAt: Date
}

export interface BuildAssetPlan {
  /** Search term → found marketplace asset (or null if none found) */
  found: Array<{ searchTerm: string; asset: MarketplaceAsset }>
  /** Search terms where nothing was found — need custom Meshy generation */
  missing: string[]
  totalMarketplace: number
  totalCustom: number
  /** Estimated cost for custom generation (Meshy credits) */
  estimatedCustomCost: number
}

// ─── In-memory cache (5 min TTL) ─────────────────────────────────────────────

interface CacheEntry {
  data: MarketplaceAsset[]
  expiresAt: number
}

const _cache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

function cacheKey(query: string, type: AssetType): string {
  return `${type}::${query.toLowerCase().trim()}`
}

function getCached(query: string, type: AssetType): MarketplaceAsset[] | null {
  const key = cacheKey(query, type)
  const entry = _cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    _cache.delete(key)
    return null
  }
  return entry.data
}

function setCached(query: string, type: AssetType, data: MarketplaceAsset[]): void {
  _cache.set(cacheKey(query, type), { data, expiresAt: Date.now() + CACHE_TTL_MS })
}

// ─── Thumbnail batch fetcher ───────────────────────────────────────────────────

async function fetchThumbnails(assetIds: number[]): Promise<Record<number, string>> {
  if (assetIds.length === 0) return {}
  try {
    const res = await fetch(
      `https://thumbnails.roblox.com/v1/assets?assetIds=${assetIds.join(',')}&returnPolicy=PlaceHolder&size=150x150&format=Png&isCircular=false`,
      { next: { revalidate: 3600 } },
    )
    if (!res.ok) return {}
    const json = await res.json() as { data?: Array<{ targetId: number; imageUrl: string }> }
    const map: Record<number, string> = {}
    for (const entry of json.data ?? []) {
      if (entry.targetId && entry.imageUrl) map[entry.targetId] = entry.imageUrl
    }
    return map
  } catch {
    return {}
  }
}

// ─── Roblox catalog API types ─────────────────────────────────────────────────

interface CatalogItem {
  id: number
  name: string
  description?: string
  creatorName?: string
  creatorTargetId?: number
  price?: number
  lowestPrice?: number
  priceStatus?: string
}

interface CatalogResponse {
  data: CatalogItem[]
}

// Maps our AssetType to the Roblox catalog category param
const CATALOG_CATEGORY: Record<AssetType, string> = {
  Model:    'Models',
  Audio:    'Audio',
  Decal:    'Decals',
  MeshPart: 'MeshPart',
}

// ─── Core search ──────────────────────────────────────────────────────────────

/**
 * Search the Roblox marketplace for assets matching a query.
 * Results are cached in-memory for 5 minutes.
 */
export async function searchMarketplace(
  query: string,
  type: AssetType = 'Model',
  limit = 10,
): Promise<AssetSearchResult> {
  const cached = getCached(query, type)
  if (cached) {
    return { query, type, assets: cached, fromCache: true, searchedAt: new Date() }
  }

  const url = new URL('https://catalog.roblox.com/v1/search/items')
  url.searchParams.set('keyword', query)
  url.searchParams.set('limit', String(Math.min(limit, 30)))
  url.searchParams.set('includeNotForSale', 'false')
  url.searchParams.set('isKeywordSuggestionEnabled', 'true')
  const cat = CATALOG_CATEGORY[type]
  if (cat) url.searchParams.set('category', cat)

  let items: CatalogItem[] = []
  try {
    const res = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; ForjeGames/1.0)',
      },
      next: { revalidate: 60 },
    })
    if (res.ok) {
      const json = (await res.json()) as CatalogResponse
      items = json.data ?? []
    }
  } catch {
    // Network error — return empty, skip cache
    return { query, type, assets: [], fromCache: false, searchedAt: new Date() }
  }

  // Batch thumbnail fetch
  const ids = items.map((i) => i.id)
  const thumbs = await fetchThumbnails(ids)

  const assets: MarketplaceAsset[] = items.map((item) => ({
    assetId:     item.id,
    name:        item.name,
    description: item.description ?? '',
    creator:     item.creatorName ?? 'Roblox',
    creatorId:   item.creatorTargetId ?? 0,
    type,
    isFree:      (item.price ?? item.lowestPrice ?? 0) === 0,
    thumbnailUrl: thumbs[item.id] ?? null,
    catalogUrl:  `https://www.roblox.com/catalog/${item.id}`,
  }))

  setCached(query, type, assets)
  return { query, type, assets, fromCache: false, searchedAt: new Date() }
}

// ─── Multi-term search ────────────────────────────────────────────────────────

/**
 * Search multiple terms in parallel and return all results grouped by term.
 */
export async function searchMultiple(
  terms: Array<{ query: string; type?: AssetType }>,
  limitPerTerm = 5,
): Promise<Map<string, AssetSearchResult>> {
  const results = await Promise.all(
    terms.map(({ query, type = 'Model' }) => searchMarketplace(query, type, limitPerTerm)),
  )
  const map = new Map<string, AssetSearchResult>()
  for (let i = 0; i < terms.length; i++) {
    map.set(terms[i].query, results[i])
  }
  return map
}

// ─── Build planner ────────────────────────────────────────────────────────────

/**
 * Given a list of asset search terms (e.g. extracted from a build prompt),
 * search marketplace for each and return a plan: what was found vs what
 * needs custom generation.
 *
 * Theme and scale aware: uses pickBestAsset() to select the most contextually
 * appropriate result rather than just the first free hit.
 *
 * Example input: ['medieval castle', 'oak tree', 'stone wall', 'torch']
 */
export async function planBuildAssets(
  searchTerms: string[],
  options: SmartPickOptions = {},
): Promise<BuildAssetPlan> {
  const MESHY_CREDIT_COST = 1 // credits per custom model at standard quality

  const results = await searchMultiple(
    searchTerms.map((q) => ({ query: q, type: 'Model' as AssetType })),
    6, // fetch top 6 per term so pickBestAsset has more candidates to score
  )

  const found: BuildAssetPlan['found'] = []
  const missing: string[] = []

  for (const term of searchTerms) {
    const result = results.get(term)
    const freeAssets = result?.assets.filter((a) => a.isFree) ?? []
    if (freeAssets.length > 0) {
      // Infer scale hint from the search term itself
      const termLower = term.toLowerCase()
      const termScale: AssetScale =
        Object.entries(ASSET_SCALE_HINTS).find(([k]) => termLower.includes(k))?.[1] ?? 'any'

      const best = pickBestAsset(freeAssets, {
        theme: options.theme,
        preferredScale: options.preferredScale ?? termScale,
        nearbyColor: options.nearbyColor,
        requireThumbnail: false,
      })
      if (best) {
        found.push({ searchTerm: term, asset: best })
      } else {
        missing.push(term)
      }
    } else {
      missing.push(term)
    }
  }

  return {
    found,
    missing,
    totalMarketplace: found.length,
    totalCustom: missing.length,
    estimatedCustomCost: missing.length * MESHY_CREDIT_COST,
  }
}

// ─── Luau code generator ──────────────────────────────────────────────────────

export interface AssetPlacement {
  assetId: number
  name: string
  position: { x: number; y: number; z: number }
  rotation?: { x: number; y: number; z: number }
  scale?: number
}

/**
 * Generate Luau code that uses InsertService:LoadAsset() to place
 * marketplace assets at given positions. This creates builds using real
 * Roblox marketplace assets instead of custom-built parts.
 *
 * @param placements - Array of assets with positions
 * @param parentPath - Roblox path to parent (default: "workspace")
 */
export function generateMarketplaceLuau(
  placements: AssetPlacement[],
  parentPath = 'workspace',
): string {
  const lines: string[] = [
    '-- Generated by ForjeAI — Marketplace-First Build',
    '-- Uses real Roblox Creator Store assets via InsertService',
    '',
    'local InsertService = game:GetService("InsertService")',
    `local parent = game:GetService("Workspace")`,
    '',
    '-- Asset placements',
    'local function placeAsset(assetId, name, position, rotation, scale)',
    '\tlocal success, result = pcall(function()',
    '\t\treturn InsertService:LoadAsset(assetId)',
    '\tend)',
    '\tif not success then',
    '\t\twarn("Failed to load asset " .. assetId .. ": " .. tostring(result))',
    '\t\treturn nil',
    '\tend',
    '\tlocal model = result:FindFirstChildOfClass("Model") or result',
    '\tmodel.Name = name',
    '\tif model:IsA("Model") and model.PrimaryPart then',
    '\t\tmodel:SetPrimaryPartCFrame(',
    '\t\t\tCFrame.new(position) * CFrame.Angles(rotation.x, rotation.y, rotation.z)',
    '\t\t)',
    '\telse',
    '\t\tmodel:MoveTo(position)',
    '\tend',
    '\tif scale and scale ~= 1 then',
    '\t\tlocal cf, size = model:GetBoundingBox()',
    '\t\t-- Scale via ResizeConstraint on each BasePart',
    '\t\tfor _, part in ipairs(model:GetDescendants()) do',
    '\t\t\tif part:IsA("BasePart") then',
    '\t\t\t\tpart.Size = part.Size * scale',
    '\t\t\t\tpart.CFrame = cf:ToObjectSpace(part.CFrame)',
    '\t\t\tend',
    '\t\tend',
    '\tend',
    `\tmodel.Parent = ${parentPath === 'workspace' ? 'parent' : `game:GetService("${parentPath}")`}`,
    '\treturn model',
    'end',
    '',
    '-- Place all assets',
  ]

  for (const p of placements) {
    const pos = `Vector3.new(${p.position.x}, ${p.position.y}, ${p.position.z})`
    const rot = p.rotation
      ? `{x=${p.rotation.x}, y=${p.rotation.y}, z=${p.rotation.z}}`
      : '{x=0, y=0, z=0}'
    const scale = p.scale ?? 1
    lines.push(
      `placeAsset(${p.assetId}, "${p.name}", ${pos}, ${rot}, ${scale})`,
    )
  }

  return lines.join('\n')
}

// ─── Theme → search terms mapper ─────────────────────────────────────────────

/**
 * Maps a build theme/description to a list of marketplace search terms.
 * Used by the AI pipeline to know what to search before generating.
 */
export const THEME_SEARCH_TERMS: Record<string, string[]> = {
  medieval: [
    'medieval castle',
    'medieval house',
    'stone wall medieval',
    'oak tree',
    'torch wall medieval',
    'wooden barrel',
    'medieval gate',
    'cobblestone floor',
  ],
  forest: [
    'oak tree',
    'pine tree',
    'boulder rock',
    'fallen log',
    'mushroom',
    'flower bush',
    'grass patch',
  ],
  city: [
    'city building',
    'street lamp',
    'park bench',
    'road barrier',
    'bus stop',
    'fire hydrant',
    'traffic light',
  ],
  dungeon: [
    'dungeon wall stone',
    'prison cell door',
    'torch dungeon',
    'stone pillar',
    'treasure chest',
    'skeleton decoration',
    'wooden door',
  ],
  fantasy: [
    'fantasy tree glowing',
    'crystal formation',
    'magic portal',
    'fantasy house',
    'floating island',
    'ancient ruins',
  ],
  pirate: [
    'pirate ship',
    'treasure chest',
    'palm tree',
    'wooden dock',
    'cannon',
    'rope ladder',
  ],
  space: [
    'space station module',
    'alien rock',
    'spacecraft',
    'lunar crater',
    'space capsule',
    'satellite dish',
  ],
  farm: [
    'barn building',
    'hay bale',
    'fence wooden',
    'windmill',
    'tractor',
    'chicken coop',
    'apple tree',
  ],
}

// ─── Theme style modifiers ────────────────────────────────────────────────────

/**
 * Style qualifier prefixes per theme — prepended to generic search terms so
 * marketplace results match the scene's aesthetic rather than returning the
 * first generic hit (e.g. "medieval lamp" not just "lamp").
 */
const THEME_STYLE_PREFIX: Record<string, string> = {
  medieval:  'medieval',
  fantasy:   'fantasy',
  space:     'sci-fi space',
  pirate:    'pirate',
  dungeon:   'dungeon stone',
  forest:    'forest nature',
  city:      'modern city',
  farm:      'farm rustic',
  horror:    'horror spooky',
  japanese:  'japanese',
  futuristic: 'futuristic neon',
  tropical:  'tropical island',
  winter:    'winter snow',
  western:   'western saloon',
}

/**
 * Scale hints per asset category — helps callers decide whether a result is
 * appropriately sized for the scene without needing to inspect geometry.
 */
export type AssetScale = 'small' | 'medium' | 'large' | 'any'

const ASSET_SCALE_HINTS: Record<string, AssetScale> = {
  // Small props
  'torch': 'small', 'lantern': 'small', 'barrel': 'small', 'crate': 'small',
  'bench': 'small', 'chair': 'small', 'table': 'small', 'flower': 'small',
  'mushroom': 'small', 'rock': 'small', 'sign': 'small', 'chest': 'small',
  // Medium objects
  'tree': 'medium', 'bush': 'medium', 'boulder': 'medium', 'fence': 'medium',
  'gate': 'medium', 'door': 'medium', 'statue': 'medium', 'fountain': 'medium',
  'car': 'medium', 'boat': 'medium', 'lamp': 'medium', 'pillar': 'medium',
  // Large structures
  'castle': 'large', 'house': 'large', 'building': 'large', 'tower': 'large',
  'ship': 'large', 'bridge': 'large', 'wall': 'large', 'arena': 'large',
  'dungeon': 'large', 'ruins': 'large', 'mansion': 'large', 'warehouse': 'large',
}

/**
 * Detect the dominant theme/style in a prompt.
 * Returns the theme key or null if no clear match.
 */
export function detectTheme(prompt: string): string | null {
  const lower = prompt.toLowerCase()
  // Order matters — more specific themes first
  const THEME_SIGNALS: Array<{ theme: string; signals: RegExp }> = [
    { theme: 'japanese',   signals: /\b(japanese|japan|torii|pagoda|samurai|cherry blossom|zen|shrine)\b/ },
    { theme: 'pirate',     signals: /\b(pirate|ship|cannon|treasure|jolly roger|plank|anchor)\b/ },
    { theme: 'horror',     signals: /\b(horror|haunted|spooky|ghost|skeleton|zombie|graveyard|tombstone)\b/ },
    { theme: 'western',    signals: /\b(western|saloon|cowboy|sheriff|gold mine|wagon|tumbleweed)\b/ },
    { theme: 'space',      signals: /\b(space|sci.?fi|alien|ufo|spaceship|station|laser|hologram|futuristic)\b/ },
    { theme: 'futuristic', signals: /\b(futuristic|neon city|cyberpunk|hologram|hover|mech|android)\b/ },
    { theme: 'tropical',   signals: /\b(tropical|island|palm|beach|ocean|paradise|tiki)\b/ },
    { theme: 'winter',     signals: /\b(winter|snow|ice|christmas|frozen|arctic|blizzard|igloo)\b/ },
    { theme: 'farm',       signals: /\b(farm|barn|hay|tractor|windmill|silo|harvest|rural)\b/ },
    { theme: 'dungeon',    signals: /\b(dungeon|prison|underground|cavern|cave|tomb|crypt)\b/ },
    { theme: 'fantasy',    signals: /\b(fantasy|magic|crystal|enchanted|wizard|dragon|fairy|portal|rune)\b/ },
    { theme: 'medieval',   signals: /\b(medieval|castle|knight|sword|shield|stone wall|cobblestone|tavern|village)\b/ },
    { theme: 'forest',     signals: /\b(forest|woods|nature|oak|pine|jungle|swamp|meadow)\b/ },
    { theme: 'city',       signals: /\b(city|urban|street|road|modern|office|apartment|downtown|skyscraper)\b/ },
  ]
  for (const { theme, signals } of THEME_SIGNALS) {
    if (signals.test(lower)) return theme
  }
  return null
}

/**
 * Given a free-text prompt, extract relevant search terms.
 * Theme-aware: qualifies generic keywords with the detected style so
 * marketplace results match the scene's aesthetic (e.g. "medieval lamp"
 * instead of plain "lamp" when building a castle scene).
 */
export function extractSearchTerms(prompt: string): string[] {
  const lower = prompt.toLowerCase()

  // 1. Check exact named themes — return full curated term list
  for (const [theme, terms] of Object.entries(THEME_SEARCH_TERMS)) {
    if (lower.includes(theme)) return terms
  }

  // 2. Detect implicit theme for style-qualified searches
  const detectedTheme = detectTheme(prompt)
  const stylePrefix = detectedTheme ? (THEME_STYLE_PREFIX[detectedTheme] ?? '') : ''

  // 3. Keyword extraction — look for common Roblox asset types
  const ASSET_KEYWORDS = [
    'castle', 'house', 'building', 'tower', 'wall', 'gate', 'bridge',
    'tree', 'rock', 'boulder', 'log', 'plant', 'flower',
    'torch', 'lamp', 'light', 'lantern',
    'chest', 'barrel', 'crate', 'box',
    'fence', 'door', 'window', 'stair',
    'ship', 'boat', 'car', 'truck', 'wagon',
    'pillar', 'arch', 'ruin', 'statue', 'ruins',
    'npc', 'character', 'monster', 'enemy',
    'bench', 'fountain', 'sign', 'table', 'chair',
    'mushroom', 'crystal', 'portal', 'cannon', 'shrine',
  ]

  const found: string[] = []
  const words = lower.split(/\s+/)
  for (const word of words) {
    if (ASSET_KEYWORDS.includes(word) && !found.some((f) => f.includes(word))) {
      // Prefer explicit adjective context from the prompt first
      const idx = words.indexOf(word)
      const prevWord = idx > 0 ? words[idx - 1] : ''
      const isGenericPrev = ['a', 'an', 'the', 'some', 'my', 'your'].includes(prevWord)

      if (prevWord && !isGenericPrev) {
        // Explicit: "stone pillar", "oak tree"
        found.push(`${prevWord} ${word}`)
      } else if (stylePrefix) {
        // Theme-qualified: "medieval pillar", "fantasy tree"
        found.push(`${stylePrefix} ${word}`)
      } else {
        found.push(word)
      }
    }
  }

  // Deduplicate and cap at 8 terms
  return [...new Set(found)].slice(0, 8)
}

// ─── Smart asset picker ───────────────────────────────────────────────────────

export interface SmartPickOptions {
  /** Detected theme/style of the build (e.g. "medieval", "fantasy") */
  theme?: string | null
  /** Preferred scale — filter out assets that are clearly wrong size */
  preferredScale?: AssetScale
  /** RGB color of nearby parts — used to prefer assets that likely match */
  nearbyColor?: { r: number; g: number; b: number } | null
  /** Whether to require a thumbnail (better quality signal) */
  requireThumbnail?: boolean
}

/**
 * Given a list of free assets, pick the best one for the current build context.
 * Scoring: thumbnail presence + theme keyword match + scale hint match.
 */
export function pickBestAsset(
  assets: MarketplaceAsset[],
  options: SmartPickOptions = {},
): MarketplaceAsset | null {
  if (assets.length === 0) return null

  const { theme, preferredScale, requireThumbnail = false } = options

  // Filter: require thumbnail if specified
  const candidates = requireThumbnail
    ? assets.filter((a) => a.thumbnailUrl)
    : assets

  if (candidates.length === 0) return assets[0] // fallback to first

  // Score each candidate
  const scored = candidates.map((asset) => {
    let score = 0
    const nameLower = asset.name.toLowerCase()
    const descLower = asset.description.toLowerCase()

    // Thumbnail = quality signal
    if (asset.thumbnailUrl) score += 10

    // Theme match in name/description
    if (theme) {
      const prefix = THEME_STYLE_PREFIX[theme] ?? theme
      const themeWords = prefix.split(' ')
      for (const tw of themeWords) {
        if (nameLower.includes(tw)) score += 8
        if (descLower.includes(tw)) score += 3
      }
    }

    // Scale hint match — penalize obvious mismatches
    if (preferredScale && preferredScale !== 'any') {
      // Infer scale from name keywords
      const looksLarge = /\b(large|huge|big|massive|full|complete|set|pack)\b/.test(nameLower)
      const looksSmall = /\b(small|tiny|mini|little|prop|decoration|detail)\b/.test(nameLower)
      if (preferredScale === 'large' && looksLarge) score += 5
      if (preferredScale === 'small' && looksSmall) score += 5
      if (preferredScale === 'large' && looksSmall) score -= 8
      if (preferredScale === 'small' && looksLarge) score -= 8
    }

    // Prefer assets with descriptions (more complete, typically higher quality)
    if (asset.description.length > 20) score += 2

    return { asset, score }
  })

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score)
  return scored[0].asset
}
