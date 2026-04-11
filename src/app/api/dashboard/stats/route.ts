import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { generalRateLimit, rateLimitResponse } from '@/lib/rate-limit'

// Cache the unauthenticated/empty payload at the edge so 1k+ unauth pollers
// don't hit the lambda repeatedly. Authenticated responses bypass the cache
// because Clerk's session cookie varies per user.
export const revalidate = 0

const EMPTY_STATS = {
  buildsThisWeek: 0,
  activeProjects: 0,
  streakDays: 0,
  buildActivity: [0, 0, 0, 0, 0, 0, 0],
}

export async function GET() {
  try {
    const { userId: clerkId } = await auth()

    if (clerkId) {
      // Rate limit BEFORE any DB work — DashboardHomeClient polls this every
      // 60s via SWR. At thousands of users that's hundreds of req/s with 4-5
      // queries each. 60/min per user = once per second, well above the SWR
      // refresh rate, leaves headroom for tab focus refetches.
      const rl = await generalRateLimit(clerkId)
      if (!rl.allowed) return rateLimitResponse(rl)

      try {
        const { db } = await import('@/lib/db')

        const user = await db.user.findUnique({
          where: { clerkId },
          select: { id: true },
        })

        if (user) {
          const streak = await db.streak.findUnique({
            where: { userId: user.id },
            select: { buildStreak: true, totalBuilds: true },
          })

          // Get the user's token balance record
          const tokenBalance = await db.tokenBalance.findUnique({
            where: { userId: user.id },
            select: { id: true },
          })

          if (!tokenBalance) {
            return NextResponse.json({
              buildsThisWeek: 0,
              activeProjects: 0,
              streakDays: streak?.buildStreak ?? 0,
              buildActivity: [0, 0, 0, 0, 0, 0, 0],
            })
          }

          // Count SPEND transactions this week as builds
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)

          const buildsThisWeek = await db.tokenTransaction.count({
            where: {
              balanceId: tokenBalance.id,
              type: 'SPEND',
              createdAt: { gte: weekAgo },
            },
          })

          // Build activity per day (last 7 days) — single query, grouped in JS
          const sevenDaysAgo = new Date()
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
          sevenDaysAgo.setHours(0, 0, 0, 0)

          const activityRows = await db.tokenTransaction.findMany({
            where: {
              balanceId: tokenBalance.id,
              type: 'SPEND',
              createdAt: { gte: sevenDaysAgo },
            },
            select: { createdAt: true },
          })

          // Group counts into a [day-0 .. day-6] array (oldest → newest)
          const dayCounts = new Array<number>(7).fill(0)
          for (const row of activityRows) {
            const dayOffset = Math.floor(
              (row.createdAt.getTime() - sevenDaysAgo.getTime()) / 86_400_000
            )
            if (dayOffset >= 0 && dayOffset < 7) dayCounts[dayOffset]++
          }
          const activity = dayCounts

          // Count unique descriptions as rough project count
          const activeProjects = await db.tokenTransaction.groupBy({
            by: ['description'],
            where: {
              balanceId: tokenBalance.id,
              type: 'SPEND',
              createdAt: { gte: weekAgo },
            },
          })

          return NextResponse.json({
            buildsThisWeek,
            activeProjects: activeProjects.length,
            streakDays: streak?.buildStreak ?? 0,
            buildActivity: activity,
          })
        }
      } catch {
        // DB not connected — fall through
      }
    }

    return NextResponse.json(EMPTY_STATS)
  } catch {
    return NextResponse.json(EMPTY_STATS)
  }
}
