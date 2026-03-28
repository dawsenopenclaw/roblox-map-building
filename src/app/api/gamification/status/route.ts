import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

// GET /api/gamification/status — combined XP + streak + achievements status
export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({
    where: { clerkId },
    include: {
      userXp: true,
      streak: true,
      userAchievements: {
        include: { achievement: true },
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
}
