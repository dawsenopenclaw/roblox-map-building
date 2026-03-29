import { NextRequest, NextResponse } from 'next/server'

// Maps our category names to Roblox catalog category IDs
const CATEGORY_MAP: Record<string, string> = {
  models:  'Models',
  meshes:  'MeshPart',
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

async function getThumbnail(assetId: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://thumbnails.roblox.com/v1/assets?assetIds=${assetId}&returnPolicy=PlaceHolder&size=150x150&format=Png&isCircular=false`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return null
    const json = await res.json()
    return json?.data?.[0]?.imageUrl ?? null
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const query    = searchParams.get('query') ?? ''
  const category = (searchParams.get('category') ?? 'all').toLowerCase()
  const limit    = Math.min(Number(searchParams.get('limit') ?? 20), 30)

  const robloxCategory = CATEGORY_MAP[category] ?? ''

  // Build Roblox catalog search URL
  const url = new URL('https://catalog.roblox.com/v1/search/items')
  url.searchParams.set('keyword', query)
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('includeNotForSale', 'false')
  url.searchParams.set('isKeywordSuggestionEnabled', 'true')
  if (robloxCategory) url.searchParams.set('category', robloxCategory)

  let catalogData: RobloxCatalogResponse
  try {
    const res = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; ForjeGames/1.0)',
      },
      next: { revalidate: 60 },
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('[roblox/search] catalog error:', res.status, text.slice(0, 200))
      return NextResponse.json({ error: 'Roblox catalog unavailable', status: res.status }, { status: 502 })
    }

    catalogData = await res.json()
  } catch (err) {
    console.error('[roblox/search] fetch error:', err)
    return NextResponse.json({ error: 'Failed to reach Roblox API' }, { status: 502 })
  }

  const items = catalogData?.data ?? []

  // Fetch thumbnails in parallel (batch, up to 10 at a time to avoid rate limits)
  const assetIds = items.map((i) => i.id)
  let thumbnailMap: Record<number, string> = {}
  if (assetIds.length > 0) {
    try {
      const batchRes = await fetch(
        `https://thumbnails.roblox.com/v1/assets?assetIds=${assetIds.join(',')}&returnPolicy=PlaceHolder&size=150x150&format=Png&isCircular=false`,
        { next: { revalidate: 3600 } }
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
      // Thumbnails optional — continue without them
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
