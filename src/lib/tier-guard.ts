/**
 * Tier guard utilities for AI route handlers.
 *
 * Usage:
 *   const guard = await requireTier(userId, 'HOBBY')
 *   if (guard) return guard   // returns a 403 NextResponse when tier is insufficient
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export type SubscriptionTier = 'FREE' | 'HOBBY' | 'CREATOR' | 'STUDIO'

// Tier hierarchy — higher index = higher tier
const TIER_ORDER: SubscriptionTier[] = ['FREE', 'HOBBY', 'CREATOR', 'STUDIO']

function tierRank(tier: string): number {
  const idx = TIER_ORDER.indexOf(tier as SubscriptionTier)
  return idx === -1 ? 0 : idx
}

/**
 * Checks whether the user's active subscription meets the minimum required tier.
 *
 * Returns `null` when the user has sufficient access (caller should continue).
 * Returns a `NextResponse` (403) when access is denied (caller should return it).
 */
export async function requireTier(
  userId: string,
  minTier: SubscriptionTier,
): Promise<NextResponse | null> {
  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: {
      subscription: {
        select: {
          tier: true,
          status: true,
          currentPeriodEnd: true,
        },
      },
    },
  })

  const subscription = user?.subscription

  // A subscription is only honored when:
  //   1. Status is ACTIVE or TRIALING, AND
  //   2. The current paid period has not ended (covers lapsed / PAST_DUE subs
  //      whose Stripe webhook has not yet fired — we must not keep charging
  //      tokens for a subscription that has actually expired upstream).
  const now = new Date()
  const periodValid =
    !subscription?.currentPeriodEnd ||
    new Date(subscription.currentPeriodEnd) > now
  const isActive =
    (subscription?.status === 'ACTIVE' ||
      subscription?.status === 'TRIALING') &&
    periodValid

  const currentTier: SubscriptionTier = isActive
    ? ((subscription?.tier as SubscriptionTier) ?? 'FREE')
    : 'FREE'

  if (tierRank(currentTier) >= tierRank(minTier)) {
    return null // access granted
  }

  return NextResponse.json(
    {
      error: 'Subscription upgrade required',
      requiredTier: minTier,
      currentTier,
      upgradeUrl: '/dashboard/billing',
    },
    { status: 403 },
  )
}
