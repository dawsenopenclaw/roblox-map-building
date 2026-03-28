import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { ACHIEVEMENTS } from '@/lib/achievements'

// GET /api/gamification/achievements — all achievements with user unlock status
export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({
    where: { clerkId },
    include: {
      userAchievements: { include: { achievement: true } },
    },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const unlockedSlugs = new Set(user.userAchievements.map((ua) => ua.achievement.slug))
  const unlockedAt = new Map(
    user.userAchievements.map((ua) => [ua.achievement.slug, ua.unlockedAt])
  )

  const achievements = ACHIEVEMENTS.map((a) => ({
    ...a,
    unlocked: unlockedSlugs.has(a.slug),
    unlockedAt: unlockedAt.get(a.slug) ?? null,
  }))

  return NextResponse.json({ achievements, unlockedCount: unlockedSlugs.size, total: ACHIEVEMENTS.length })
}
