import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

// GET /api/gamification/status — combined XP + streak + achievements status
export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        userXp: {
          select: { totalXp: true, tier: true, dailyXpToday: true },
        },
        streak: {
          select: { loginStreak: true, buildStreak: true, longestLoginStreak: true, longestBuildStreak: true },
        },
        userAchievements: {
          select: {
            unlockedAt: true,
            achievement: {
              select: { slug: true, name: true, description: true, icon: true, category: true, xpReward: true },
            },
          },
          orderBy: { unlockedAt: 'desc' },
          take: 5,
        },
      },
    })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    return NextResponse.json({
      xp: user.userXp ?? { totalXp: 0, tier: 'NOVICE', dailyXpToday: 0 },
      streak: user.streak ?? { loginStreak: 0, buildStreak: 0 },
      recentAchievements: user.userAchievements,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Service temporarily unavailable', details: 'Database not connected' },
      { status: 503 }
    )
  }
}
