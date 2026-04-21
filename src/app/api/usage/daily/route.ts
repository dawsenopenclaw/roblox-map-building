import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getRedis } from '@/lib/redis'

/**
 * GET /api/usage/daily
 *
 * Returns the user's daily build usage, limit, and tier.
 * Reads from Redis first (same counters as generation-limits.ts),
 * falls back to DB count if Redis is unavailable.
 */

type TierKey = 'FREE' | 'HOBBY' | 'CREATOR' | 'STUDIO'

const DAILY_BUILD_LIMITS: Record<TierKey, number> = {
  FREE: 1,
  HOBBY: 5,
  CREATOR: 15,
  STUDIO: -1, // unlimited
}

function utcDateString(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user + subscription in one query
    const user = await db.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        subscription: { select: { tier: true, status: true } },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isActive = user.subscription?.status === 'ACTIVE' || user.subscription?.status === 'TRIALING'
    const tier = (isActive ? (user.subscription?.tier ?? 'FREE') : 'FREE') as TierKey
    const limit = DAILY_BUILD_LIMITS[tier]

    // For unlimited tier, skip counting
    if (limit === -1) {
      return NextResponse.json({ used: 0, limit: -1, tier })
    }

    // Try Redis first — matches the key pattern from generation-limits.ts
    let used = 0
    const redis = getRedis()
    const redisKey = `gen:${user.id}:build:${utcDateString(new Date())}`

    if (redis) {
      try {
        const raw = await redis.get(redisKey)
        used = raw === null ? 0 : parseInt(raw as string, 10)
      } catch {
        // Redis failed — fall back to DB
        used = await countBuildsFromDB(user.id)
      }
    } else {
      used = await countBuildsFromDB(user.id)
    }

    return NextResponse.json({ used, limit, tier })
  } catch (err) {
    console.error('[usage/daily] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

async function countBuildsFromDB(userId: string): Promise<number> {
  const now = new Date()
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

  return db.build.count({
    where: {
      userId,
      createdAt: { gte: startOfDay },
    },
  })
}
