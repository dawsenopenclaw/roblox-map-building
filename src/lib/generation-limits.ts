/**
 * Per-tier generation limits enforced via Redis counters with daily TTL.
 *
 * Redis key pattern: gen:{userId}:{operation}:{YYYY-MM-DD}
 * TTL is set to 25 hours (90_000s) to ensure the bucket outlives the day
 * even with minor clock drift between servers.
 *
 * checkGenerationLimit is designed to be called BEFORE the operation runs.
 * Call it, check `allowed`, then run the pipeline, then call trackCost.
 *
 * Integration with requireTier: the caller is responsible for ensuring the
 * user has the correct tier before calling checkGenerationLimit. This module
 * only enforces daily volume caps — not tier eligibility.
 */

import 'server-only'
import { getRedis } from '@/lib/redis'
import { db } from '@/lib/db'

// ── Limit table ───────────────────────────────────────────────────────────────

type OperationType = 'mesh' | 'build' | 'texture'
type TierKey = 'FREE' | 'STARTER' | 'HOBBY' | 'BUILDER' | 'CREATOR' | 'PRO' | 'STUDIO'

const DAILY_LIMITS: Record<TierKey, Record<OperationType, number>> = {
  FREE:    { mesh: 5,   build: 10,  texture: 10  },  // Raised build from 5→10 so free users can try a game
  STARTER: { mesh: 20,  build: 30,  texture: 50  },  // Entry paid tier
  HOBBY:   { mesh: 20,  build: 30,  texture: 50  },  // Backward compat alias for STARTER
  BUILDER: { mesh: 50,  build: 75,  texture: 100 },  // Enough for 2-3 full games/day
  CREATOR: { mesh: 75,  build: 150, texture: 150 },  // Raised build from 30→150
  PRO:     { mesh: -1,  build: -1,  texture: -1  },  // Unlimited
  STUDIO:  { mesh: -1,  build: -1,  texture: -1  },  // Unlimited
}

// Unlimited sentinel
const UNLIMITED = -1
const REDIS_TTL_SECS = 90_000 // 25 hours

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GenerationLimitResult {
  allowed:   boolean
  remaining: number   // -1 means unlimited
  limit:     number   // -1 means unlimited
  resetsAt:  Date
}

// ── Main check ────────────────────────────────────────────────────────────────

export async function checkGenerationLimit(
  userId:    string,
  operation: OperationType,
): Promise<GenerationLimitResult> {
  const tier = await getUserTier(userId)
  const limit = DAILY_LIMITS[tier][operation]
  const resetsAt = nextMidnightUTC()

  // STUDIO tier is unlimited — skip Redis entirely
  if (limit === UNLIMITED) {
    return { allowed: true, remaining: UNLIMITED, limit: UNLIMITED, resetsAt }
  }

  const redis = getRedis()
  const key   = redisKey(userId, operation)

  // Fail open when Redis is unavailable — treat as no usage recorded yet
  if (!redis) {
    return { allowed: true, remaining: limit, limit, resetsAt }
  }

  // Atomic pipeline: get current count without incrementing
  // We read first, gate, then the caller increments after success via trackCost
  const raw = await redis.get(key)
  const current = raw === null ? 0 : parseInt(raw, 10)

  if (current >= limit) {
    return { allowed: false, remaining: 0, limit, resetsAt }
  }

  return {
    allowed:   true,
    remaining: limit - current,
    limit,
    resetsAt,
  }
}

/**
 * Increment the counter for an operation. Call this AFTER a successful generation.
 * If the key does not exist yet (first use today), set the TTL so it auto-expires.
 */
export async function incrementGenerationCounter(
  userId:    string,
  operation: OperationType,
): Promise<void> {
  const tier = await getUserTier(userId)
  const limit = DAILY_LIMITS[tier][operation]

  // No counter needed for unlimited tier
  if (limit === UNLIMITED) return

  const redis   = getRedis()

  // Skip increment when Redis is unavailable — counter will just not persist
  if (!redis) return

  const key  = redisKey(userId, operation)
  const pipe = redis.pipeline()

  pipe.incr(key)
  pipe.expire(key, REDIS_TTL_SECS)

  await pipe.exec()
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function redisKey(userId: string, operation: OperationType): string {
  const date = utcDateString(new Date())
  return `gen:${userId}:${operation}:${date}`
}

function utcDateString(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

function nextMidnightUTC(): Date {
  const now = new Date()
  return new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0,
  ))
}

// Cache user tier in-process for the duration of a request (lightweight)
const tierCache = new Map<string, { tier: TierKey; expiresAt: number }>()
const TIER_CACHE_TTL_MS = 60_000 // 1 min

export async function getUserTier(userId: string): Promise<TierKey> {
  const cached = tierCache.get(userId)
  if (cached && cached.expiresAt > Date.now()) return cached.tier

  const sub = await db.subscription.findUnique({
    where:  { userId },
    select: { tier: true, status: true },
  })

  const isActive = sub?.status === 'ACTIVE' || sub?.status === 'TRIALING'
  const rawTier  = isActive ? (sub?.tier ?? 'FREE') : 'FREE'
  // Normalize: ensure the tier exists in DAILY_LIMITS (handles any future tier names gracefully)
  const tier     = (rawTier in DAILY_LIMITS ? rawTier : 'FREE') as TierKey

  tierCache.set(userId, { tier, expiresAt: Date.now() + TIER_CACHE_TTL_MS })
  return tier
}
