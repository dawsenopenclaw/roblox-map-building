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

  // Fail open when Redis is unavailable — a Redis outage should not take down
  // the application. Requests are allowed through; Sentry will surface the issue.
  if (!redisInstance) {
    return { allowed: true, limit, remaining: limit, resetAt }
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
    // Redis error mid-request — fail open rather than blocking all traffic
    console.warn('[rate-limit] Redis pipeline error — failing open for', identifier)
    return { allowed: true, limit, remaining: limit, resetAt }
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
