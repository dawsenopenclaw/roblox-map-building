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
 * Example input: ['medieval castle', 'oak tree', 'stone wall', 'torch']
 */
export async function planBuildAssets(searchTerms: string[]): Promise<BuildAssetPlan> {
  const MESHY_CREDIT_COST = 1 // credits per custom model at standard quality

  const results = await searchMultiple(
    searchTerms.map((q) => ({ query: q, type: 'Model' as AssetType })),
    3, // top 3 results per term — pick best one
  )

  const found: BuildAssetPlan['found'] = []
  const missing: string[] = []

  for (const term of searchTerms) {
    const result = results.get(term)
    const freeAssets = result?.assets.filter((a) => a.isFree) ?? []
    if (freeAssets.length > 0) {
      // Pick highest-quality: prefer assets with thumbnails
      const best = freeAssets.find((a) => a.thumbnailUrl) ?? freeAssets[0]
      found.push({ searchTerm: term, asset: best })
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

/**
 * Given a free-text prompt, extract relevant search terms.
 * Checks for known themes first, then falls back to extracting nouns.
 */
export function extractSearchTerms(prompt: string): string[] {
  const lower = prompt.toLowerCase()

  // Check named themes
  for (const [theme, terms] of Object.entries(THEME_SEARCH_TERMS)) {
    if (lower.includes(theme)) return terms
  }

  // Keyword extraction fallback — look for common Roblox asset types
  const ASSET_KEYWORDS = [
    'castle', 'house', 'building', 'tower', 'wall', 'gate', 'bridge',
    'tree', 'rock', 'boulder', 'log', 'plant', 'flower',
    'torch', 'lamp', 'light', 'lantern',
    'chest', 'barrel', 'crate', 'box',
    'fence', 'door', 'window', 'stair',
    'ship', 'boat', 'car', 'truck', 'wagon',
    'pillar', 'arch', 'ruin', 'statue',
    'npc', 'character', 'monster', 'enemy',
  ]

  const found: string[] = []
  const words = lower.split(/\s+/)
  for (const word of words) {
    if (ASSET_KEYWORDS.includes(word) && !found.some((f) => f.includes(word))) {
      // Search as "<adjective context> <keyword>" if adjective precedes it
      const idx = words.indexOf(word)
      if (idx > 0) {
        found.push(`${words[idx - 1]} ${word}`)
      } else {
        found.push(word)
      }
    }
  }

  // Deduplicate and cap at 8 terms
  return [...new Set(found)].slice(0, 8)
}
