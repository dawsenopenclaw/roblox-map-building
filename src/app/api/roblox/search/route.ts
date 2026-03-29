import { NextRequest, NextResponse } from 'next/server'

// Maps our category names to Roblox catalog subcategory values
// Valid subcategory values confirmed against catalog.roblox.com/v1/search/items/details
const SUBCATEGORY_MAP: Record<string, string> = {
  models:  'Models',
  meshes:  'Meshes',
  audio:   'Audio',
  images:  'Decals',
  plugins: 'Plugins',
  all:     '',
}

interface RobloxCatalogItem {
  id: number
  name: string
  description?: string
  creatorName?: string
  creatorTargetId?: number
  price?: number
  lowestPrice?: number
  priceStatus?: string
  itemType?: string
}

interface RobloxCatalogResponse {
  data: RobloxCatalogItem[]
  nextPageCursor?: string
  previousPageCursor?: string
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const query    = searchParams.get('query') ?? ''
  const category = (searchParams.get('category') ?? 'all').toLowerCase()
  // Allowed limit values by Roblox API: 10, 28, 30, 50, 60, 100, 120
  const limit    = 30

  const subcategory = SUBCATEGORY_MAP[category] ?? ''

  // Use the /details endpoint which returns full item data (name, creator, price, etc.)
  // The base /v1/search/items endpoint only returns id + itemType
  const url = new URL('https://catalog.roblox.com/v1/search/items/details')
  if (query.trim()) url.searchParams.set('keyword', query.trim())
  url.searchParams.set('limit', String(limit))
  if (subcategory) url.searchParams.set('subcategory', subcategory)

  let catalogData: RobloxCatalogResponse
  try {
    const res = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; RobloxMapBuilder/1.0)',
      },
      next: { revalidate: 60 },
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('[roblox/search] catalog error:', res.status, text.slice(0, 300))
      return NextResponse.json(
        { error: 'Roblox catalog unavailable', status: res.status },
        { status: 502 },
      )
    }

    catalogData = await res.json()
  } catch (err) {
    console.error('[roblox/search] fetch error:', err)
    return NextResponse.json({ error: 'Failed to reach Roblox API' }, { status: 502 })
  }

  const items = catalogData?.data ?? []

  // Batch-fetch thumbnails for all asset IDs
  const assetIds = items.map((i) => i.id)
  const thumbnailMap: Record<number, string> = {}

  if (assetIds.length > 0) {
    try {
      const batchRes = await fetch(
        `https://thumbnails.roblox.com/v1/assets?assetIds=${assetIds.join(',')}&returnPolicy=PlaceHolder&size=150x150&format=Png&isCircular=false`,
        { next: { revalidate: 3600 } },
      )
      if (batchRes.ok) {
        const batchJson = await batchRes.json()
        for (const entry of batchJson?.data ?? []) {
          if (entry.targetId && entry.imageUrl) {
            thumbnailMap[entry.targetId] = entry.imageUrl
          }
        }
      }
    } catch {
      // Thumbnails are optional — continue without them
    }
  }

  const results = items.map((item) => ({
    id:           item.id,
    name:         item.name,
    description:  item.description ?? '',
    creatorName:  item.creatorName ?? 'Roblox',
    price:        item.price ?? item.lowestPrice ?? 0,
    priceStatus:  item.priceStatus ?? null,
    thumbnailUrl: thumbnailMap[item.id] ?? null,
  }))

  return NextResponse.json({ results, total: results.length })
}
