import { NextRequest, NextResponse } from 'next/server'

// Valid subcategory values confirmed against catalog.roblox.com/v1/search/items/details
const SUBCATEGORY_MAP: Record<string, string> = {
  models:  'Models',
  meshes:  'Meshes',
  audio:   'Audio',
  images:  'Decals',
  plugins: 'Plugins',
  all:     '',
}

// Curated keywords that surface high-quality, popular assets per category
const TRENDING_QUERIES: Record<string, string> = {
  models:  'building',
  meshes:  'mesh part',
  audio:   'background music',
  images:  'texture',
  plugins: 'studio plugin',
  all:     'game asset',
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const category = (searchParams.get('category') ?? 'all').toLowerCase()

  const subcategory = SUBCATEGORY_MAP[category] ?? ''
  const keyword     = TRENDING_QUERIES[category] ?? 'game asset'

  // Use /details endpoint — base endpoint only returns id+itemType, no names/prices
  // Allowed limit values: 10, 28, 30, 50, 60, 100, 120
  const url = new URL('https://catalog.roblox.com/v1/search/items/details')
  url.searchParams.set('keyword', keyword)
  url.searchParams.set('limit', '30')
  if (subcategory) url.searchParams.set('subcategory', subcategory)

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; RobloxMapBuilder/1.0)',
      },
      next: { revalidate: 300 },
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('[roblox/trending] catalog error:', res.status, text.slice(0, 300))
      return NextResponse.json(
        { error: 'Roblox catalog unavailable', status: res.status },
        { status: 502 },
      )
    }

    const catalogData = await res.json()
    const items = catalogData?.data ?? []

    // Batch-fetch thumbnails
    const assetIds = items.map((i: { id: number }) => i.id)
    const thumbnailMap: Record<number, string> = {}

    if (assetIds.length > 0) {
      try {
        const thumbRes = await fetch(
          `https://thumbnails.roblox.com/v1/assets?assetIds=${assetIds.join(',')}&returnPolicy=PlaceHolder&size=150x150&format=Png&isCircular=false`,
          { next: { revalidate: 3600 } },
        )
        if (thumbRes.ok) {
          const thumbJson = await thumbRes.json()
          for (const entry of thumbJson?.data ?? []) {
            if (entry.targetId && entry.imageUrl) thumbnailMap[entry.targetId] = entry.imageUrl
          }
        }
      } catch {
        // Thumbnails are optional — continue without them
      }
    }

    const results = items.map((item: {
      id: number
      name: string
      description?: string
      creatorName?: string
      price?: number
      lowestPrice?: number
      priceStatus?: string
    }) => ({
      id:           item.id,
      name:         item.name,
      description:  item.description ?? '',
      creatorName:  item.creatorName ?? 'Roblox',
      price:        item.price ?? item.lowestPrice ?? 0,
      priceStatus:  item.priceStatus ?? null,
      thumbnailUrl: thumbnailMap[item.id] ?? null,
    }))

    return NextResponse.json({ results, category, total: results.length })
  } catch (err) {
    console.error('[roblox/trending] error:', err)
    return NextResponse.json({ error: 'Failed to reach Roblox API' }, { status: 502 })
  }
}
