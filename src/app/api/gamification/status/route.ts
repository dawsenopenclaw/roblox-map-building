import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

// Demo data returned when DB or auth is unavailable
const DEMO_STATUS = {
  xp: { totalXp: 2450, tier: 'APPRENTICE', dailyXpToday: 120 },
  streak: { loginStreak: 7, buildStreak: 3, longestLoginStreak: 12, longestBuildStreak: 8 },
  recentAchievements: [],
  demo: true,
}

// GET /api/gamification/status — combined XP + streak + achievements status
export async function GET() {
  // Demo mode: auth() may throw or return null when Clerk keys are absent
  let clerkId: string | null = null
  try {
    const session = await auth()
    clerkId = session.userId ?? null
  } catch {
    // Clerk not configured — return demo data
    return NextResponse.json(DEMO_STATUS)
  }
  if (!clerkId) return NextResponse.json(DEMO_STATUS)

  try {
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
  } catch {
    // DB unavailable — return demo data so the UI renders
    return NextResponse.json(DEMO_STATUS)
  }
}
