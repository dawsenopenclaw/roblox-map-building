import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({
      where: { clerkId },
      select: {
        id: true, email: true, displayName: true, username: true,
        createdAt: true, isUnder13: true,
        subscription: { select: { tier: true, status: true, currentPeriodEnd: true } },
        tokenBalance: { select: { balance: true, lifetimeEarned: true, lifetimeSpent: true } },
        userXp: { select: { totalXp: true, tier: true } },
        userAchievements: { select: { achievement: { select: { name: true, slug: true } }, unlockedAt: true } },
        streak: { select: { loginStreak: true, buildStreak: true, longestLoginStreak: true, longestBuildStreak: true } },
      },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    return NextResponse.json({
      exportDate: new Date().toISOString(),
      profile: { email: user.email, displayName: user.displayName, username: user.username, createdAt: user.createdAt },
      subscription: user.subscription,
      tokens: user.tokenBalance,
      xp: user.userXp,
      achievements: user.userAchievements,
      streak: user.streak,
    }, {
      headers: { 'Content-Disposition': 'attachment; filename="forjegames-data-export.json"' },
    })
  } catch {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
