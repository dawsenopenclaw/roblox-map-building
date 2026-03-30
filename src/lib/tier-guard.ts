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
        },
      },
    },
  })

  const subscription = user?.subscription
  const isActive =
    subscription?.status === 'ACTIVE' ||
    subscription?.status === 'TRIALING'

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
