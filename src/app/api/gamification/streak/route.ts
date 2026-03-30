import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { streakSchema, parseBody } from '@/lib/validations'

const STREAK_BONUSES: Array<{ days: number; tokens: number }> = [
  { days: 7, tokens: 50 },
  { days: 30, tokens: 200 },
  { days: 100, tokens: 1000 },
]

function getBonusForStreak(streak: number, claimedMilestones: number[]): number {
  for (const { days, tokens } of STREAK_BONUSES) {
    // Only grant if the streak just reached this milestone AND it hasn't been claimed before.
    // This prevents re-earning when a streak resets and rebuilds to the same day count.
    if (streak === days && !claimedMilestones.includes(days)) return tokens
  }
  return 0
}

// Demo streak returned when auth or DB is unavailable
const DEMO_STREAK = {
  loginStreak: 7,
  buildStreak: 3,
  longestLoginStreak: 12,
  longestBuildStreak: 8,
  totalLogins: 42,
  totalBuilds: 18,
  demo: true,
}

// GET /api/gamification/streak — get current streak data
export async function GET() {
  // Demo mode: auth() may throw or return null when Clerk keys are absent
  let clerkId: string | null = null
  try {
    const session = await auth()
    clerkId = session.userId ?? null
  } catch {
    return NextResponse.json(DEMO_STREAK)
  }
  if (!clerkId) return NextResponse.json(DEMO_STREAK)

  try {
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
  } catch {
    // DB unavailable — return demo data so the UI renders
    return NextResponse.json(DEMO_STREAK)
  }
}

// POST /api/gamification/streak — record login or build activity
export async function POST(req: NextRequest) {
  try {
    let clerkId: string | null = null
    try {
      const session = await auth()
      clerkId = session?.userId ?? null
    } catch { /* demo mode — Clerk not configured */ }
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

    const parsedBody = await parseBody(req, streakSchema)
    if (!parsedBody.ok) {
      return NextResponse.json({ error: parsedBody.error }, { status: parsedBody.status })
    }
    const { type } = parsedBody.data

    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setUTCDate(yesterday.getUTCDate() - 1)

    let streak = user.streak
    let bonusTokens = 0
    let streakIncremented = false

    if (!streak) {
      const initialStreak = type === 'login' ? 1 : 0
      const buildStreak   = type === 'build' ? 1 : 0
      streak = await db.streak.create({
        data: {
          userId: user.id,
          loginStreak: initialStreak,
          buildStreak,
          longestLoginStreak: initialStreak,
          longestBuildStreak: buildStreak,
          totalLogins: type === 'login' ? 1 : 0,
          totalBuilds: type === 'build' ? 1 : 0,
          lastLoginDate: today,
          lastBuildDate: today,
          claimedMilestones: [],
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

        // Parse claimed milestones — stored as JSON array of day-counts
        const claimed: number[] = Array.isArray(streak.claimedMilestones)
          ? (streak.claimedMilestones as number[])
          : []

        bonusTokens = getBonusForStreak(newStreak, claimed)

        // If a bonus is being awarded, add the milestone to the claimed set
        const newClaimed = bonusTokens > 0 ? [...claimed, newStreak] : claimed

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
            claimedMilestones: newClaimed,
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
  } catch (error) {
    return NextResponse.json(
      { error: 'Service temporarily unavailable', details: 'Database not connected' },
      { status: 503 }
    )
  }
}
