import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const id   = searchParams.get('id')
  const size  = searchParams.get('size') ?? '150x150'
  const type  = searchParams.get('type') ?? 'asset'

  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
  }

  // Validate size to prevent abuse
  const ALLOWED_SIZES = ['75x75', '110x110', '140x140', '150x150', '160x100', '250x250', '256x144', '420x420', '512x512']
  const safeSize = ALLOWED_SIZES.includes(size) ? size : '150x150'

  let thumbnailUrl: string

  if (type === 'user') {
    thumbnailUrl = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${id}&size=${safeSize}&format=Png&isCircular=false`
  } else {
    thumbnailUrl = `https://thumbnails.roblox.com/v1/assets?assetIds=${id}&returnPolicy=PlaceHolder&size=${safeSize}&format=Png&isCircular=false`
  }

  try {
    const metaRes = await fetch(thumbnailUrl, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 3600 },
    })

    if (!metaRes.ok) {
      return NextResponse.json({ error: 'Thumbnail not found' }, { status: 404 })
    }

    const json = await metaRes.json()
    const imageUrl: string | undefined = json?.data?.[0]?.imageUrl

    if (!imageUrl) {
      return NextResponse.json({ error: 'No thumbnail available' }, { status: 404 })
    }

    // Proxy the actual image bytes so the browser never hits roblox.com directly
    const imgRes = await fetch(imageUrl, { next: { revalidate: 3600 } })
    if (!imgRes.ok) {
      return NextResponse.json({ error: 'Image fetch failed' }, { status: 502 })
    }

    const imgBuffer = await imgRes.arrayBuffer()
    const contentType = imgRes.headers.get('content-type') ?? 'image/png'

    return new NextResponse(imgBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'X-Asset-Id': id,
      },
    })
  } catch (err) {
    console.error('[roblox/thumbnail] error:', err)
    return NextResponse.json({ error: 'Thumbnail proxy failed' }, { status: 502 })
  }
}
