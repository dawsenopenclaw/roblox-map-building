import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as Sentry from '@sentry/nextjs'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        createdAt: true,
        referralCode: true,
        tokenBalance: {
          select: {
            balance: true,
            lifetimeSpent: true,
          },
        },
        subscription: {
          select: {
            tier: true,
          },
        },
        apiKeys: {
          where: { revokedAt: null },
          select: { id: true },
        },
        streak: {
          select: {
            loginStreak: true,
          },
        },
        userXp: {
          select: {
            totalXp: true,
            tier: true,
          },
        },
        _count: {
          select: {
            builds: true,
          },
        },
      },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const tier = user.subscription?.tier ?? 'FREE'

    const tierMeta: Record<string, { label: string; color: string }> = {
      FREE:    { label: 'Free',    color: '#9CA3AF' },
      HOBBY:   { label: 'Hobby',   color: '#60A5FA' },
      CREATOR: { label: 'Creator', color: '#A78BFA' },
      STUDIO:  { label: 'Studio',  color: '#D4AF37' },
    }

    const { label: tierLabel, color: tierColor } = tierMeta[tier] ?? tierMeta.FREE

    return NextResponse.json({
      totalBuilds:      user._count.builds,
      tokensUsed:       user.tokenBalance?.lifetimeSpent ?? 0,
      tokensRemaining:  user.tokenBalance?.balance ?? 0,
      memberSince:      user.createdAt.toISOString(),
      apiKeysActive:    user.apiKeys.length,
      streakDays:       user.streak?.loginStreak ?? 0,
      totalXp:          user.userXp?.totalXp ?? 0,
      xpTier:           user.userXp?.tier ?? 'NOVICE',
      tierLabel,
      tierColor,
      referralCode:     user.referralCode,
    })
  } catch (err) {
    Sentry.captureException(err)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
