/**
 * Global and per-user spending guard — hard daily caps to prevent API key abuse.
 *
 * This is a last-line-of-defense circuit breaker. Even if rate limits and token
 * balances are somehow bypassed, this stops runaway bills.
 *
 * Redis key patterns:
 *   spend:global:{YYYY-MM-DD}        — total API calls across all users today
 *   spend:user:{userId}:{YYYY-MM-DD} — API calls for this user today
 *
 * Falls back to in-memory counters when Redis is unavailable (per-instance only).
 */

import 'server-only'
import { getRedis } from '@/lib/redis'

// ── Hard caps ─────────────────────────────────────────────────────────────────

/** Max AI API calls across ALL users per day. If hit, all AI stops until midnight UTC. */
const GLOBAL_DAILY_CAP = 10_000

/** Max AI API calls per single user per day. Catches compromised accounts. */
const PER_USER_DAILY_CAP = 500

/** Max AI API calls per single user per hour. Catches automated abuse. */
const PER_USER_HOURLY_CAP = 100

const REDIS_DAY_TTL = 90_000  // 25 hours
const REDIS_HOUR_TTL = 3_700  // 61 minutes

// ── In-memory fallback ────────────────────────────────────────────────────────

const memCounters = new Map<string, { count: number; resetAt: number }>()

function memIncr(key: string, ttlMs: number): number {
  const now = Date.now()
  const entry = memCounters.get(key)
  if (!entry || entry.resetAt <= now) {
    memCounters.set(key, { count: 1, resetAt: now + ttlMs })
    return 1
  }
  entry.count++
  return entry.count
}

// Prune stale entries every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    memCounters.forEach((v, k) => { if (v.resetAt <= now) memCounters.delete(k) })
  }, 600_000).unref?.()
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function utcDate(): string {
  const d = new Date()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

function utcHour(): string {
  const d = new Date()
  return `${utcDate()}T${String(d.getUTCHours()).padStart(2, '0')}`
}

// ── Main check ────────────────────────────────────────────────────────────────

export interface SpendingGuardResult {
  allowed: boolean
  reason?: string
  globalCount: number
  userDayCount: number
  userHourCount: number
}

/**
 * Check if this AI request should be allowed. Call BEFORE making any external
 * API call (Anthropic, Gemini, Groq, Meshy, FAL, etc.).
 *
 * This also increments the counters, so only call once per request.
 */
export async function checkSpendingGuard(userId: string): Promise<SpendingGuardResult> {
  const redis = getRedis()
  const dayKey = utcDate()
  const hourKey = utcHour()

  let globalCount: number
  let userDayCount: number
  let userHourCount: number

  if (redis) {
    try {
      const pipe = redis.pipeline()
      pipe.incr(`spend:global:${dayKey}`)
      pipe.expire(`spend:global:${dayKey}`, REDIS_DAY_TTL)
      pipe.incr(`spend:user:${userId}:${dayKey}`)
      pipe.expire(`spend:user:${userId}:${dayKey}`, REDIS_DAY_TTL)
      pipe.incr(`spend:user:${userId}:hour:${hourKey}`)
      pipe.expire(`spend:user:${userId}:hour:${hourKey}`, REDIS_HOUR_TTL)
      const results = await pipe.exec()
      globalCount = (results?.[0]?.[1] as number) ?? 0
      userDayCount = (results?.[2]?.[1] as number) ?? 0
      userHourCount = (results?.[4]?.[1] as number) ?? 0
    } catch {
      // Redis failed — use memory fallback
      globalCount = memIncr(`spend:global:${dayKey}`, 86_400_000)
      userDayCount = memIncr(`spend:user:${userId}:${dayKey}`, 86_400_000)
      userHourCount = memIncr(`spend:user:${userId}:hour:${hourKey}`, 3_600_000)
    }
  } else {
    globalCount = memIncr(`spend:global:${dayKey}`, 86_400_000)
    userDayCount = memIncr(`spend:user:${userId}:${dayKey}`, 86_400_000)
    userHourCount = memIncr(`spend:user:${userId}:hour:${hourKey}`, 3_600_000)
  }

  if (globalCount > GLOBAL_DAILY_CAP) {
    console.error(`[SPENDING GUARD] GLOBAL DAILY CAP HIT: ${globalCount}/${GLOBAL_DAILY_CAP}`)
    return {
      allowed: false,
      reason: 'Our AI systems are at capacity for today. Please try again tomorrow.',
      globalCount, userDayCount, userHourCount,
    }
  }

  if (userDayCount > PER_USER_DAILY_CAP) {
    console.error(`[SPENDING GUARD] USER DAILY CAP HIT: ${userId} at ${userDayCount}/${PER_USER_DAILY_CAP}`)
    return {
      allowed: false,
      reason: 'You\'ve reached the daily generation limit. Your limit resets at midnight UTC.',
      globalCount, userDayCount, userHourCount,
    }
  }

  if (userHourCount > PER_USER_HOURLY_CAP) {
    console.warn(`[SPENDING GUARD] USER HOURLY CAP: ${userId} at ${userHourCount}/${PER_USER_HOURLY_CAP}`)
    return {
      allowed: false,
      reason: 'Too many requests this hour. Please wait a bit and try again.',
      globalCount, userDayCount, userHourCount,
    }
  }

  return { allowed: true, globalCount, userDayCount, userHourCount }
}
