import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/community/creator-leaderboard?sort=xp|forks|likes&limit=25
 *
 * Returns top creators ranked by XP, total forks received, or total likes
 * received. Public — no auth required.
 *
 * Caching: 5 minutes.
 *
 * STATUS — known limitation: the User model does NOT currently expose `xp`,
 * `isPublic`, `totalForks`, or `totalLikes`. XP lives on the UserXP model and
 * forks/likes are derived from Project aggregates. The previous implementation
 * tried to select those fields directly on User, threw a Prisma error, and
 * silently fell through to DEMO_ENTRIES on every single request — and it did
 * so AFTER hitting the DB, which wasted a query per call. Until the proper
 * UserXP join + Project aggregate path lands in a follow-up, we serve the
 * curated demo set directly. This is what users currently see anyway, just
 * without the wasted DB roundtrip.
 *
 * Follow-up: replace with a denormalized creator_leaderboard materialized
 * view refreshed nightly. Tracked in .planning/old-windows-assets/ audit doc.
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
  const sort: SortKey =
    sortParam === 'forks' || sortParam === 'likes' ? sortParam : 'xp'

  return NextResponse.json({ sort, entries: DEMO_ENTRIES, demo: true })
}
