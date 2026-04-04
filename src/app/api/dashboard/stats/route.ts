import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()

    if (clerkId) {
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

          // Build activity per day (last 7 days)
          const activity: number[] = []
          for (let i = 6; i >= 0; i--) {
            const dayStart = new Date()
            dayStart.setDate(dayStart.getDate() - i)
            dayStart.setHours(0, 0, 0, 0)
            const dayEnd = new Date(dayStart)
            dayEnd.setDate(dayEnd.getDate() + 1)

            const count = await db.tokenTransaction.count({
              where: {
                balanceId: tokenBalance.id,
                type: 'SPEND',
                createdAt: { gte: dayStart, lt: dayEnd },
              },
            })
            activity.push(count)
          }

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

    return NextResponse.json({
      buildsThisWeek: 0,
      activeProjects: 0,
      streakDays: 0,
      buildActivity: [0, 0, 0, 0, 0, 0, 0],
    })
  } catch {
    return NextResponse.json({
      buildsThisWeek: 0,
      activeProjects: 0,
      streakDays: 0,
      buildActivity: [0, 0, 0, 0, 0, 0, 0],
    })
  }
}
