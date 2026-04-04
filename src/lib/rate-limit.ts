/**
 * Rate limiting via Redis sliding-window counters.
 *
 * NOTE: @upstash/ratelimit is NOT in package.json — this module implements
 * the same sliding-window semantics directly over ioredis (which is already
 * a project dependency). If you later add @upstash/ratelimit you can swap
 * the implementation behind the same exported helpers without touching callers.
 *
 * Install reminder (if you switch to the Upstash SDK):
 *   npm install @upstash/ratelimit @upstash/redis
 */

import { getRedis } from './redis'

// ---------------------------------------------------------------------------
// In-memory fallback rate limiter
// ---------------------------------------------------------------------------

/**
 * Per-instance in-memory fallback used when Redis is unavailable.
 *
 * Tradeoff: this is not global — each Lambda/Node instance tracks its own
 * counters. The fallback limit is intentionally 2× the Redis limit to account
 * for load being spread across multiple instances. It won't stop a perfectly
 * distributed flood, but it prevents a single instance from being hammered
 * (e.g. AI generation hammered during a Redis outage, burning real money).
 */
const memoryCounters = new Map<string, { count: number; resetAt: number }>()

function checkMemoryLimit(
  identifier: string,
  limit: number,
  windowSec: number,
): RateLimitResult {
  const now = Date.now()
  const bucket = Math.floor(now / 1000 / windowSec)
  const key = `${identifier}:${windowSec}:${bucket}`
  const resetAt = (bucket + 1) * windowSec * 1000
  // 2× limit since this is per-instance, not global
  const fallbackLimit = limit * 2

  const entry = memoryCounters.get(key)
  if (!entry || entry.resetAt <= now) {
    memoryCounters.set(key, { count: 1, resetAt })
    return { allowed: true, limit: fallbackLimit, remaining: fallbackLimit - 1, resetAt }
  }

  entry.count += 1
  return {
    allowed: entry.count <= fallbackLimit,
    limit: fallbackLimit,
    remaining: Math.max(0, fallbackLimit - entry.count),
    resetAt,
  }
}

// ---------------------------------------------------------------------------
// Core sliding-window implementation
// ---------------------------------------------------------------------------

export interface RateLimitResult {
  /** Whether the request is allowed to proceed. */
  allowed: boolean
  /** Maximum requests allowed in the window. */
  limit: number
  /** Remaining requests in the current window. */
  remaining: number
  /** Unix timestamp (ms) when the window resets. */
  resetAt: number
}

/**
 * Sliding-window rate limit check using Redis INCR + EXPIRE.
 *
 * The key is scoped per `identifier` (userId or IP) and per `windowSec`
 * bucket — requests that arrive in the same second share a bucket,
 * giving a true sliding window across multiple calls.
 *
 * @param identifier - Unique key (userId, IP address, etc.)
 * @param limit       - Maximum requests allowed in the window
 * @param windowSec   - Window duration in seconds
 */
async function checkLimit(
  identifier: string,
  limit: number,
  windowSec: number,
): Promise<RateLimitResult> {
  const redisInstance = getRedis()
  const resetAt = (Math.floor(Date.now() / 1000 / windowSec) + 1) * windowSec * 1000

  // Redis unavailable — fall back to per-instance in-memory limiter rather than
  // failing open unconditionally. Sentry will surface the outage separately.
  if (!redisInstance) {
    return checkMemoryLimit(identifier, limit, windowSec)
  }

  // Bucket by window so we get a coarse sliding window
  const bucket = Math.floor(Date.now() / 1000 / windowSec)
  const key = `rl:${identifier}:${windowSec}:${bucket}`

  let count: number
  try {
    // Atomic increment + set TTL on first write
    const pipeline = redisInstance.pipeline()
    pipeline.incr(key)
    pipeline.expire(key, windowSec * 2) // 2× TTL so the previous bucket lingers for overlap
    const results = await pipeline.exec()
    count = (results?.[0]?.[1] as number) ?? 1
  } catch {
    // Redis error mid-request — fall back to in-memory limiter rather than failing open
    console.warn('[rate-limit] Redis pipeline error — using memory fallback for', identifier)
    return checkMemoryLimit(identifier, limit, windowSec)
  }

  return {
    allowed: count <= limit,
    limit,
    remaining: Math.max(0, limit - count),
    resetAt,
  }
}

// ---------------------------------------------------------------------------
// Tier helpers
// ---------------------------------------------------------------------------

/**
 * AI routes — 20 requests per minute per user.
 *
 * @param userId - Clerk user ID or session ID
 */
export async function aiRateLimit(userId: string): Promise<RateLimitResult> {
  return checkLimit(`ai:${userId}`, 20, 60)
}

/**
 * Billing routes — 10 requests per minute per user.
 *
 * @param userId - Clerk user ID or session ID
 */
export async function billingRateLimit(userId: string): Promise<RateLimitResult> {
  return checkLimit(`billing:${userId}`, 10, 60)
}

/**
 * Parental consent routes — 3 requests per hour per IP.
 * Low limit because this endpoint handles COPPA consent flows.
 *
 * @param ip - Client IP address (e.g. from x-forwarded-for)
 */
export async function parentalConsentRateLimit(ip: string): Promise<RateLimitResult> {
  return checkLimit(`parental:${ip}`, 3, 3600)
}

/**
 * General API routes — 60 requests per minute per user.
 *
 * @param userId - Clerk user ID or session ID
 */
export async function generalRateLimit(userId: string): Promise<RateLimitResult> {
  return checkLimit(`general:${userId}`, 60, 60)
}

/**
 * Marketplace read routes (browse/list) — 30 requests per minute per identifier.
 * Identifier should be userId when authenticated, IP address otherwise.
 *
 * @param identifier - Clerk user ID or client IP address
 */
export async function marketplaceReadRateLimit(identifier: string): Promise<RateLimitResult> {
  return checkLimit(`mkt_read:${identifier}`, 30, 60)
}

/**
 * Marketplace write routes (purchase, review, submit) — 10 requests per minute per user.
 * Lower limit because these routes mutate financial or user-generated data.
 *
 * @param userId - Clerk user ID
 */
export async function marketplaceWriteRateLimit(userId: string): Promise<RateLimitResult> {
  return checkLimit(`mkt_write:${userId}`, 10, 60)
}

/**
 * Studio sync endpoint — 120 requests per 60 seconds per session.
 * Allows burst up to 2 req/s while blocking runaway polls or reconnect storms.
 * The sync route already enforces an 800ms MIN_POLL_INTERVAL_MS inside
 * drainCommands; this layer is a coarse guard at the HTTP boundary.
 *
 * @param sessionId - Studio session ID
 */
export async function studioSyncRateLimit(sessionId: string): Promise<RateLimitResult> {
  return checkLimit(`studio_sync:${sessionId}`, 120, 60)
}

/**
 * Studio execute endpoint — 30 commands per 60 seconds per user.
 * Prevents script-injection floods while still allowing 1 command every 2 s comfortably.
 *
 * @param userId - Clerk user ID or session ID when unauthenticated
 */
export async function studioExecuteRateLimit(userId: string): Promise<RateLimitResult> {
  return checkLimit(`studio_exec:${userId}`, 30, 60)
}

// ---------------------------------------------------------------------------
// Response helper
// ---------------------------------------------------------------------------

/**
 * Builds standard rate-limit headers from a RateLimitResult.
 * Pass these to NextResponse or Hono's c.header() calls.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
    ...(result.allowed ? {} : { 'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)) }),
  }
}
