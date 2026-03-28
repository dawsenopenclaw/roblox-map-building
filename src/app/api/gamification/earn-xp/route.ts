import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { Prisma, XPEventType, XPTier } from '@prisma/client'

const DAILY_CAP = 500

const XP_AMOUNTS: Record<XPEventType, number | ((meta: Record<string, unknown>) => number)> = {
  BUILD: 10,
  PUBLISH: 100,
  SALE: (meta) => {
    const cents = (meta?.amountCents as number) || 0
    if (cents >= 10000) return 500
    if (cents >= 5000) return 200
    if (cents >= 1000) return 100
    return 50
  },
  REFERRAL: 200,
  ACHIEVEMENT: (meta) => (meta?.xpReward as number) || 0,
  STREAK_BONUS: (meta) => (meta?.bonus as number) || 0,
  DAILY_LOGIN: 5,
}

const TIER_THRESHOLDS: Array<{ tier: XPTier; min: number }> = [
  { tier: XPTier.MYTHIC, min: 50000 },
  { tier: XPTier.LEGEND, min: 15000 },
  { tier: XPTier.MASTER, min: 5000 },
  { tier: XPTier.BUILDER, min: 2000 },
  { tier: XPTier.APPRENTICE, min: 500 },
  { tier: XPTier.NOVICE, min: 0 },
]

function getTier(xp: number): XPTier {
  for (const { tier, min } of TIER_THRESHOLDS) {
    if (xp >= min) return tier
  }
  return XPTier.NOVICE
}

// POST /api/gamification/earn-xp
export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({
    where: { clerkId },
    include: { userXp: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { type, metadata } = body as { type?: string; metadata?: Record<string, unknown> }
  if (!type || !(type in XP_AMOUNTS)) {
    return NextResponse.json({ error: 'Invalid XP event type' }, { status: 400 })
  }

  const xpEventType = type as XPEventType
  const rawAmount = XP_AMOUNTS[xpEventType]
  let baseXp = typeof rawAmount === 'function' ? rawAmount(metadata || {}) : rawAmount

  // Get or create UserXP record
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  let userXp = user.userXp
  if (!userXp) {
    userXp = await db.userXP.create({
      data: {
        userId: user.id,
        totalXp: 0,
        tier: XPTier.NOVICE,
        dailyXpToday: 0,
        dailyXpDate: today,
      },
    })
  }

  // Reset daily cap if new day
  const lastDate = new Date(userXp.dailyXpDate)
  lastDate.setUTCHours(0, 0, 0, 0)
  const isNewDay = lastDate.getTime() < today.getTime()
  const dailyUsed = isNewDay ? 0 : userXp.dailyXpToday

  // Apply daily cap (skip for achievements and streak bonuses — they bypass cap)
  const bypassCap = xpEventType === XPEventType.ACHIEVEMENT || xpEventType === XPEventType.STREAK_BONUS
  if (!bypassCap) {
    const remaining = DAILY_CAP - dailyUsed
    if (remaining <= 0) {
      return NextResponse.json({
        awarded: 0,
        capped: true,
        totalXp: userXp.totalXp,
        tier: userXp.tier,
        dailyCapRemaining: 0,
      })
    }
    baseXp = Math.min(baseXp, remaining)
  }

  const newTotal = userXp.totalXp + baseXp
  const newTier = getTier(newTotal)
  const tierChanged = newTier !== userXp.tier

  const updatedXp = await db.userXP.update({
    where: { id: userXp.id },
    data: {
      totalXp: newTotal,
      tier: newTier,
      dailyXpToday: isNewDay ? baseXp : userXp.dailyXpToday + baseXp,
      dailyXpDate: today,
      xpEvents: {
        create: {
          type: xpEventType,
          amount: baseXp,
          metadata: metadata ? (metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
        },
      },
    },
  })

  return NextResponse.json({
    awarded: baseXp,
    capped: false,
    totalXp: updatedXp.totalXp,
    tier: updatedXp.tier,
    tierChanged,
    previousTier: tierChanged ? userXp.tier : undefined,
    dailyCapRemaining: bypassCap ? null : DAILY_CAP - (isNewDay ? baseXp : userXp.dailyXpToday + baseXp),
  })
}
