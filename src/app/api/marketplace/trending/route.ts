import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PERF: Trending is expensive — we fetch 4x the limit, compute a score per item,
// then fire-and-forget UPDATEs. That's a lot to do per request. The UI also
// auto-refreshes. A 60s revalidate window lets Next.js/edge cache the response
// so repeat viewers within the minute hit the cache instead of the DB.
export const revalidate = 60

// ── Trending score algorithm ────────────────────────────────────────────────
// score = (likes * 3 + forks * 5 + views) / (hours_since_creation + 2)^1.5

function calculateTrendingScore(item: {
  likeCount: number
  forkCount: number
  viewCount: number
  createdAt: Date
}): number {
  const hoursSinceCreation =
    (Date.now() - item.createdAt.getTime()) / (1000 * 60 * 60)
  const engagement =
    item.likeCount * 3 + item.forkCount * 5 + item.viewCount
  return engagement / Math.pow(hoursSinceCreation + 2, 1.5)
}

// ── GET /api/marketplace/trending — top trending templates ──────────────────

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const limitParam = url.searchParams.get('limit')
  const limit = Math.min(Math.max(parseInt(limitParam || '12', 10) || 12, 1), 50)

  try {
    // Fetch recent published templates with engagement data
    const templates = await db.template.findMany({
      where: {
        status: 'PUBLISHED',
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        category: true,
        priceCents: true,
        thumbnailUrl: true,
        tags: true,
        likeCount: true,
        forkCount: true,
        viewCount: true,
        downloads: true,
        averageRating: true,
        reviewCount: true,
        featured: true,
        createdAt: true,
        creator: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true,
          },
        },
        forkedFrom: {
          take: 1,
          select: {
            originalItem: {
              select: { id: true, title: true, slug: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      // Fetch more than needed so we can re-sort by trending score
      take: limit * 4,
    })

    // Calculate trending scores and sort
    const scored = templates.map((t) => ({
      ...t,
      trendingScore: calculateTrendingScore(t),
    }))

    scored.sort((a, b) => b.trendingScore - a.trendingScore)

    const trending = scored.slice(0, limit)

    // Batch-update trending scores in background (fire-and-forget)
    Promise.allSettled(
      scored.map((t) =>
        db.template.update({
          where: { id: t.id },
          data: { trending: t.trendingScore },
        })
      )
    ).catch(() => {
      // ignore errors — trending score update is best-effort
    })

    return NextResponse.json(
      { templates: trending },
      {
        headers: {
          // Edge/CDN cache for 60s, serve stale for up to 120s while revalidating.
          // Trending changes slowly — stale data is fine for a minute.
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      },
    )
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch trending templates' },
      { status: 500 }
    )
  }
}
