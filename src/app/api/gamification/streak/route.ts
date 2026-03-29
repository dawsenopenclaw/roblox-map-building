import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

const STREAK_BONUSES: Array<{ days: number; tokens: number }> = [
  { days: 7, tokens: 50 },
  { days: 30, tokens: 200 },
  { days: 100, tokens: 1000 },
]

function getBonusForStreak(streak: number): number {
  for (const { days, tokens } of STREAK_BONUSES) {
    if (streak === days) return tokens
  }
  return 0
}

// GET /api/gamification/streak — get current streak data
export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      streak: true,
    },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  if (!user.streak) {
    return NextResponse.json({
      loginStreak: 0,
      buildStreak: 0,
      longestLoginStreak: 0,
      longestBuildStreak: 0,
      totalLogins: 0,
      totalBuilds: 0,
    })
  }

  return NextResponse.json(user.streak)
}

// POST /api/gamification/streak — record login or build activity
export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      streak: true,
      tokenBalance: { select: { id: true, balance: true } },
    },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { type } = body as { type?: 'login' | 'build' }
  if (type !== 'login' && type !== 'build') {
    return NextResponse.json({ error: 'type must be "login" or "build"' }, { status: 400 })
  }

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)

  let streak = user.streak
  let bonusTokens = 0
  let streakIncremented = false

  if (!streak) {
    streak = await db.streak.create({
      data: {
        userId: user.id,
        loginStreak: type === 'login' ? 1 : 0,
        buildStreak: type === 'build' ? 1 : 0,
        longestLoginStreak: type === 'login' ? 1 : 0,
        longestBuildStreak: type === 'build' ? 1 : 0,
        totalLogins: type === 'login' ? 1 : 0,
        totalBuilds: type === 'build' ? 1 : 0,
        lastLoginDate: today,
        lastBuildDate: today,
      },
    })
    streakIncremented = true
  } else {
    const lastDate = type === 'login' ? new Date(streak.lastLoginDate) : new Date(streak.lastBuildDate)
    lastDate.setUTCHours(0, 0, 0, 0)

    const isSameDay = lastDate.getTime() === today.getTime()
    const isConsecutive = lastDate.getTime() === yesterday.getTime()

    if (!isSameDay) {
      const currentStreak = type === 'login' ? streak.loginStreak : streak.buildStreak
      const newStreak = isConsecutive ? currentStreak + 1 : 1
      const longestField = type === 'login' ? 'longestLoginStreak' : 'longestBuildStreak'
      const currentLongest = type === 'login' ? streak.longestLoginStreak : streak.longestBuildStreak

      bonusTokens = getBonusForStreak(newStreak)

      streak = await db.streak.update({
        where: { id: streak.id },
        data: {
          loginStreak: type === 'login' ? newStreak : streak.loginStreak,
          buildStreak: type === 'build' ? newStreak : streak.buildStreak,
          [longestField]: Math.max(currentLongest, newStreak),
          lastLoginDate: type === 'login' ? today : streak.lastLoginDate,
          lastBuildDate: type === 'build' ? today : streak.lastBuildDate,
          totalLogins: type === 'login' ? { increment: 1 } : undefined,
          totalBuilds: type === 'build' ? { increment: 1 } : undefined,
        },
      })
      streakIncremented = true
    }
  }

  // Award token bonus if milestone hit — create balance record if user doesn't have one yet
  if (bonusTokens > 0) {
    const streakDays = type === 'login' ? streak.loginStreak : streak.buildStreak
    const description = `${streakDays}-day ${type} streak bonus`

    if (user.tokenBalance) {
      await db.tokenBalance.update({
        where: { id: user.tokenBalance.id },
        data: {
          balance: { increment: bonusTokens },
          lifetimeEarned: { increment: bonusTokens },
          transactions: {
            create: { type: 'BONUS', amount: bonusTokens, description },
          },
        },
      })
    } else {
      // First-time balance record — create it with the bonus as starting balance
      await db.tokenBalance.create({
        data: {
          userId: user.id,
          balance: bonusTokens,
          lifetimeEarned: bonusTokens,
          transactions: {
            create: { type: 'BONUS', amount: bonusTokens, description },
          },
        },
      })
    }
  }

  return NextResponse.json({
    streak,
    streakIncremented,
    bonusTokensAwarded: bonusTokens,
  })
}
