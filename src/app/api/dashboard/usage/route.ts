/**
 * GET /api/dashboard/usage
 *
 * Returns the current user's daily spend + generation limits.
 * Consumed by UsageDashboard component (polls every 60s).
 *
 * Response shape matches the UsageData interface in UsageDashboard.tsx.
 */

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getUserDailySpend } from '@/lib/cost-tracker'
import { checkGenerationLimit } from '@/lib/generation-limits'

export async function GET(): Promise<NextResponse> {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Resolve internal userId from clerkId
  const user = await db.user.findUnique({
    where:  { clerkId },
    select: {
      id: true,
      subscription: { select: { tier: true, status: true } },
    },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const isActive =
    user.subscription?.status === 'ACTIVE' ||
    user.subscription?.status === 'TRIALING'
  const tier = (isActive ? (user.subscription?.tier ?? 'FREE') : 'FREE') as string

  const [spend, meshLimit, buildLimit, textureLimit] = await Promise.all([
    getUserDailySpend(user.id),
    checkGenerationLimit(user.id, 'mesh'),
    checkGenerationLimit(user.id, 'build'),
    checkGenerationLimit(user.id, 'texture'),
  ])

  return NextResponse.json({
    spend,
    limits: {
      mesh:    meshLimit,
      build:   buildLimit,
      texture: textureLimit,
    },
    tier,
    isStudio: tier === 'STUDIO',
  })
}
