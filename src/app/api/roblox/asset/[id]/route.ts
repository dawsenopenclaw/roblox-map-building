import { NextRequest, NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params
  const assetId = Number(id)

  if (!assetId || isNaN(assetId)) {
    return NextResponse.json({ error: 'Invalid asset ID' }, { status: 400 })
  }

  // Fetch details + thumbnail in parallel
  const [detailsRes, thumbnailRes] = await Promise.allSettled([
    fetch(`https://economy.roblox.com/v2/assets/${assetId}/details`, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 300 },
    }),
    fetch(
      `https://thumbnails.roblox.com/v1/assets?assetIds=${assetId}&returnPolicy=PlaceHolder&size=420x420&format=Png&isCircular=false`,
      { next: { revalidate: 3600 } }
    ),
  ])

  if (detailsRes.status === 'rejected') {
    return NextResponse.json({ error: 'Failed to reach Roblox API' }, { status: 502 })
  }

  const detailsFetch = detailsRes.value
  if (!detailsFetch.ok) {
    return NextResponse.json({ error: 'Asset not found', status: detailsFetch.status }, { status: detailsFetch.status === 404 ? 404 : 502 })
  }

  const details = await detailsFetch.json()

  let thumbnailUrl: string | null = null
  if (thumbnailRes.status === 'fulfilled' && thumbnailRes.value.ok) {
    const thumbJson = await thumbnailRes.value.json()
    thumbnailUrl = thumbJson?.data?.[0]?.imageUrl ?? null
  }

  return NextResponse.json({
    id:           details.AssetId ?? assetId,
    name:         details.Name ?? '',
    description:  details.Description ?? '',
    creator: {
      id:   details.Creator?.Id ?? null,
      name: details.Creator?.Name ?? 'Roblox',
      type: details.Creator?.CreatorType ?? 'User',
    },
    price:        details.PriceInRobux ?? 0,
    isForSale:    details.IsForSale ?? false,
    isLimited:    details.IsLimited ?? false,
    assetTypeId:  details.AssetTypeId ?? null,
    assetTypeName: details.AssetTypeName ?? null,
    thumbnailUrl,
    created:      details.Created ?? null,
    updated:      details.Updated ?? null,
  })
}
