import { db } from '@/lib/db'
import { Prisma, XPEventType, XPTier } from '@prisma/client'

export const DAILY_XP_CAP = 500

export const XP_AMOUNTS: Record<XPEventType, number | ((meta: Record<string, unknown>) => number)> = {
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
  // ACHIEVEMENT and STREAK_BONUS XP is always supplied via the baseXpOverride param
  // from server-internal callers (achievements/route.ts, streak/route.ts).
  // The map entry is 0 so that any path that forgets the override grants nothing
  // rather than trusting attacker-controlled metadata.
  ACHIEVEMENT: 0,
  STREAK_BONUS: 0,
  DAILY_LOGIN: 5,
  PURCHASE: 25,
  REVIEW_GIVEN: 15,
}

export const TIER_THRESHOLDS: Array<{ tier: XPTier; min: number }> = [
  { tier: XPTier.MYTHIC, min: 50000 },
  { tier: XPTier.LEGEND, min: 15000 },
  { tier: XPTier.MASTER, min: 5000 },
  { tier: XPTier.BUILDER, min: 2000 },
  { tier: XPTier.APPRENTICE, min: 500 },
  { tier: XPTier.NOVICE, min: 0 },
]

export function getTier(xp: number): XPTier {
  for (const { tier, min } of TIER_THRESHOLDS) {
    if (xp >= min) return tier
  }
  return XPTier.NOVICE
}

export interface EarnXpResult {
  awarded: number
  capped: boolean
  totalXp: number
  tier: XPTier
  tierChanged: boolean
  previousTier?: XPTier
  dailyCapRemaining: number | null
}

/**
 * Core XP-earning logic. Can be called directly from server code without going through HTTP.
 * @param userId          The internal DB user id (not clerkId)
 * @param type            The XP event type
 * @param metadata        Optional metadata stored on the XPEvent record (never used for XP calculation)
 * @param baseXpOverride  Trusted server-side XP amount for ACHIEVEMENT and STREAK_BONUS events.
 *                        Must be sourced from the DB record, never from client input.
 */
export async function grantXp(
  userId: string,
  type: XPEventType,
  metadata?: Record<string, unknown>,
  baseXpOverride?: number,
): Promise<EarnXpResult> {
  const rawAmount = XP_AMOUNTS[type]
  // baseXpOverride is used for ACHIEVEMENT and STREAK_BONUS — their map entries are 0
  // to prevent any metadata-sourced XP. All other types resolve from the static map.
  let baseXp = baseXpOverride !== undefined
    ? Math.max(0, Math.floor(baseXpOverride))
    : (typeof rawAmount === 'function' ? rawAmount(metadata || {}) : rawAmount)

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  // Get or create UserXP record — wrapped in transaction to prevent create race
  const userXp = await db.$transaction(async (tx) => {
    const existing = await tx.userXP.findUnique({
      where: { userId },
      select: { id: true, totalXp: true, tier: true, dailyXpToday: true, dailyXpDate: true },
    })
    if (existing) return existing
    return tx.userXP.create({
      data: {
        userId,
        totalXp: 0,
        tier: XPTier.NOVICE,
        dailyXpToday: 0,
        dailyXpDate: today,
      },
    })
  })

  const lastDate = new Date(userXp.dailyXpDate)
  lastDate.setUTCHours(0, 0, 0, 0)
  const isNewDay = lastDate.getTime() < today.getTime()
  const dailyUsed = isNewDay ? 0 : userXp.dailyXpToday

  // ACHIEVEMENT and STREAK_BONUS bypass the daily cap
  const bypassCap = type === XPEventType.ACHIEVEMENT || type === XPEventType.STREAK_BONUS
  if (!bypassCap) {
    const remaining = DAILY_XP_CAP - dailyUsed
    if (remaining <= 0) {
      return {
        awarded: 0,
        capped: true,
        totalXp: userXp.totalXp,
        tier: userXp.tier,
        tierChanged: false,
        dailyCapRemaining: 0,
      }
    }
    baseXp = Math.min(baseXp, remaining)
  }

  // Compute projected total for tier calculation only (not written directly)
  const projectedTotal = userXp.totalXp + baseXp
  const newTier = getTier(projectedTotal)
  const tierChanged = newTier !== userXp.tier

  const updatedXp = await db.userXP.update({
    where: { id: userXp.id },
    data: {
      // Atomic increments avoid read-then-write race on concurrent XP grants
      totalXp: { increment: baseXp },
      tier: newTier,
      // For cap-subject events: increment on same day, reset to baseXp on new day
      // For bypass events: reset to 0 on new day, leave unchanged otherwise
      dailyXpToday: bypassCap
        ? (isNewDay ? 0 : userXp.dailyXpToday)
        : isNewDay
          ? baseXp
          : { increment: baseXp },
      dailyXpDate: today,
      xpEvents: {
        create: {
          type,
          amount: baseXp,
          metadata: metadata ? (metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
        },
      },
    },
  })

  const newDailyXp = bypassCap
    ? (isNewDay ? 0 : userXp.dailyXpToday)
    : (isNewDay ? baseXp : userXp.dailyXpToday + baseXp)

  return {
    awarded: baseXp,
    capped: false,
    totalXp: updatedXp.totalXp,
    tier: updatedXp.tier,
    tierChanged,
    previousTier: tierChanged ? userXp.tier : undefined,
    dailyCapRemaining: bypassCap ? null : DAILY_XP_CAP - newDailyXp,
  }
}
