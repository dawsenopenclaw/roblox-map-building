/**
 * GET /api/assets/search
 *
 * Searches the Roblox catalog API for marketplace assets.
 *
 * Query params:
 *   query    — search term (required)
 *   category — models | meshes | images | audio | plugins (default: models)
 *   cursor   — pagination cursor from previous response
 *   limit    — results per page, max 30 (default: 24)
 *
 * Response: { items: CatalogItem[], nextCursor: string | null }
 *
 * Results are cached in-memory for 5 minutes per unique (query+category+cursor) key.
 */

import { NextRequest, NextResponse } from 'next/server'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CatalogItem {
  id: number
  name: string
  creatorName: string
  creatorType: 'User' | 'Group'
  price: number | null
  thumbnailUrl: string | null
  category: string
  assetType: string
}

interface CatalogSearchResponse {
  items: CatalogItem[]
  nextCursor: string | null
}

// ─── Category mapping ─────────────────────────────────────────────────────────

type CategoryKey = 'models' | 'meshes' | 'images' | 'audio' | 'plugins'

/** Maps our UI category slugs to Roblox catalog subcategory IDs */
const CATEGORY_SUBCATEGORY: Record<CategoryKey, number> = {
  models:  10, // Models
  meshes:  40, // Meshes
  images:  13, // Decals / Images
  audio:   11, // Audio
  plugins: 38, // Plugins
}

const CATEGORY_ASSET_TYPE: Record<CategoryKey, string> = {
  models:  'Model',
  meshes:  'MeshPart',
  images:  'Decal',
  audio:   'Audio',
  plugins: 'Plugin',
}

// ─── In-memory cache ──────────────────────────────────────────────────────────

interface CacheEntry {
  data: CatalogSearchResponse
  expiresAt: number
}

// @ts-expect-error — survive Next.js hot-reload
const cache: Map<string, CacheEntry> = (globalThis.__fjAssetSearchCache ??= new Map())
// @ts-expect-error
globalThis.__fjAssetSearchCache = cache

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

function getCached(key: string): CatalogSearchResponse | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return null
  }
  return entry.data
}

function setCache(key: string, data: CatalogSearchResponse): void {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS })
  // Evict oldest entries if cache grows too large
  if (cache.size > 500) {
    const first = cache.keys().next().value
    if (first !== undefined) cache.delete(first)
  }
}

// ─── Thumbnail fetcher ────────────────────────────────────────────────────────

async function fetchThumbnails(assetIds: number[]): Promise<Map<number, string>> {
  if (assetIds.length === 0) return new Map()
  try {
    const ids = assetIds.join(',')
    const url = `https://thumbnails.roblox.com/v1/assets?assetIds=${ids}&returnPolicy=PlaceHolder&size=150x150&format=Png&isCircular=false`
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 300 },
    })
    if (!res.ok) return new Map()
    const json = await res.json() as { data: { targetId: number; imageUrl: string }[] }
    const map = new Map<number, string>()
    for (const item of json.data ?? []) {
      if (item.imageUrl) map.set(item.targetId, item.imageUrl)
    }
    return map
  } catch {
    return new Map()
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const rawQuery    = searchParams.get('query')?.trim() ?? ''
  const rawCategory = (searchParams.get('category')?.toLowerCase() ?? 'models') as CategoryKey
  const cursor      = searchParams.get('cursor') ?? ''
  const rawLimit    = parseInt(searchParams.get('limit') ?? '24', 10)
  const limit       = Math.min(Math.max(rawLimit, 1), 30)

  if (!rawQuery) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 })
  }

  const category: CategoryKey = Object.prototype.hasOwnProperty.call(CATEGORY_SUBCATEGORY, rawCategory)
    ? rawCategory
    : 'models'

  const cacheKey = `${rawQuery}::${category}::${cursor}::${limit}`
  const cached = getCached(cacheKey)
  if (cached) {
    return NextResponse.json(cached, {
      headers: { 'X-Cache': 'HIT', 'Cache-Control': 'public, max-age=300' },
    })
  }

  try {
    // Build Roblox catalog search URL
    const params = new URLSearchParams({
      keyword:         rawQuery,
      subcategory:     String(CATEGORY_SUBCATEGORY[category]),
      limit:           String(limit),
      sortType:        '0', // Relevance
      includeNotForSale: 'false',
    })
    if (cursor) params.set('cursor', cursor)

    const catalogUrl = `https://catalog.roblox.com/v1/search/items?${params.toString()}`

    const catalogRes = await fetch(catalogUrl, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 300 },
    })

    if (!catalogRes.ok) {
      return NextResponse.json(
        { error: `Roblox catalog error: ${catalogRes.status}` },
        { status: 502 },
      )
    }

    interface RobloxCatalogItem {
      id: number
      name: string
      creatorName: string
      creatorType: 'User' | 'Group'
      price: number | null
      lowestPrice: number | null
    }

    interface RobloxCatalogResponse {
      nextPageCursor: string | null
      data: RobloxCatalogItem[]
    }

    const catalogJson = await catalogRes.json() as RobloxCatalogResponse
    const rawItems: RobloxCatalogItem[] = catalogJson.data ?? []

    // Fetch thumbnails in parallel
    const ids = rawItems.map((i) => i.id)
    const thumbnails = await fetchThumbnails(ids)

    const items: CatalogItem[] = rawItems.map((item) => ({
      id:          item.id,
      name:        item.name,
      creatorName: item.creatorName,
      creatorType: item.creatorType,
      price:       item.price ?? item.lowestPrice ?? null,
      thumbnailUrl: thumbnails.get(item.id) ?? null,
      category:    category,
      assetType:   CATEGORY_ASSET_TYPE[category],
    }))

    const result: CatalogSearchResponse = {
      items,
      nextCursor: catalogJson.nextPageCursor ?? null,
    }

    setCache(cacheKey, result)

    return NextResponse.json(result, {
      headers: { 'X-Cache': 'MISS', 'Cache-Control': 'public, max-age=300' },
    })
  } catch (err) {
    console.error('[assets/search] Error:', (err as Error).message)
    return NextResponse.json({ error: 'Failed to fetch catalog' }, { status: 500 })
  }
}
