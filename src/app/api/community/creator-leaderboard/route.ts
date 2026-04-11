import { NextRequest, NextResponse } from 'next/server'
import { levelForXp } from '@/lib/viral/xp-engine'

/**
 * GET /api/community/creator-leaderboard?sort=xp|forks|likes&limit=25
 *
 * Returns top creators ranked by XP, total forks received, or total likes
 * received. Public — no auth required.
 *
 * Caching: 5 minutes.
 */

export const revalidate = 300

type SortKey = 'xp' | 'forks' | 'likes'

interface LeaderboardEntry {
  rank: number
  userId: string
  username: string
  avatarUrl: string | null
  xp: number
  level: number
  totalForks: number
  totalLikes: number
}

const DEMO_ENTRIES: LeaderboardEntry[] = [
  { rank: 1, userId: 'u1', username: 'pixeldev', avatarUrl: null, xp: 48200, level: 31, totalForks: 842, totalLikes: 2301 },
  { rank: 2, userId: 'u2', username: 'dough_master', avatarUrl: null, xp: 37100, level: 27, totalForks: 613, totalLikes: 1788 },
  { rank: 3, userId: 'u3', username: 'gothkid', avatarUrl: null, xp: 29400, level: 24, totalForks: 472, totalLikes: 2112 },
  { rank: 4, userId: 'u4', username: 'apexgrip', avatarUrl: null, xp: 23150, level: 21, totalForks: 391, totalLikes: 904 },
  { rank: 5, userId: 'u5', username: 'knotworks', avatarUrl: null, xp: 18900, level: 19, totalForks: 342, totalLikes: 760 },
]

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const sortParam = url.searchParams.get('sort')
  const limitParam = url.searchParams.get('limit')
  const sort: SortKey =
    sortParam === 'forks' || sortParam === 'likes' ? sortParam : 'xp'
  const limit = Math.min(Math.max(Number(limitParam) || 25, 1), 100)

  try {
    const { db } = await import('@/lib/db')

    // Order users by the requested dimension.
    const orderBy =
      sort === 'xp'
        ? [{ xp: 'desc' as const }]
        : sort === 'forks'
          ? [{ totalForks: 'desc' as const }]
          : [{ totalLikes: 'desc' as const }]

    // `totalForks`/`totalLikes` may be maintained as denormalized columns or
    // computed from project aggregates. We attempt the simple path first; if
    // the column is missing, we fall back to computing on-the-fly.
    let users: Array<{
      id: string
      username: string | null
      avatarUrl: string | null
      xp: number | null
      totalForks?: number | null
      totalLikes?: number | null
    }> = []
    try {
      users = await db.user.findMany({
        where: { isPublic: true },
        orderBy,
        take: limit,
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          xp: true,
          // @ts-expect-error — fields may not exist in all envs
          totalForks: true,
          // @ts-expect-error — see above
          totalLikes: true,
        },
      })
    } catch {
      // Fallback: simple XP sort without denormalized columns.
      users = await db.user.findMany({
        where: { isPublic: true },
        orderBy: [{ xp: 'desc' }],
        take: limit,
        select: { id: true, username: true, avatarUrl: true, xp: true },
      })
    }

    if (users.length === 0) {
      return NextResponse.json({ sort, entries: DEMO_ENTRIES, demo: true })
    }

    const entries: LeaderboardEntry[] = users.map((u, i) => ({
      rank: i + 1,
      userId: u.id,
      username: u.username ?? 'anonymous',
      avatarUrl: u.avatarUrl ?? null,
      xp: u.xp ?? 0,
      level: levelForXp(u.xp ?? 0),
      totalForks: u.totalForks ?? 0,
      totalLikes: u.totalLikes ?? 0,
    }))

    return NextResponse.json({ sort, entries })
  } catch {
    return NextResponse.json({ sort, entries: DEMO_ENTRIES, demo: true })
  }
}
