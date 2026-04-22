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

export async function GET(): Promise<NextResponse> {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { db } = await import('@/lib/db')
    const { getUserDailySpend } = await import('@/lib/cost-tracker')
    const { checkGenerationLimit } = await import('@/lib/generation-limits')

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
  } catch (err) {
    console.error('[dashboard/usage] Error:', err instanceof Error ? err.message : err)
    return NextResponse.json(
      { error: 'Failed to load usage data' },
      { status: 500 },
    )
  }
}
