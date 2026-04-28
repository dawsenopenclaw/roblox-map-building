/**
 * Rate limiting via @upstash/ratelimit (sliding-window) with an in-memory
 * fallback when Redis is unavailable.
 *
 * Uses @upstash/redis REST client (HTTP-based) so it works on serverless /
 * edge runtimes without TCP sockets. Falls back to per-instance in-memory
 * counters when the Upstash env vars are not set or Redis is unreachable.
 *
 * Required env vars:
 *   UPSTASH_REDIS_REST_URL   — e.g. https://tough-cicada-90991.upstash.io
 *   UPSTASH_REDIS_REST_TOKEN — Upstash REST token
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ---------------------------------------------------------------------------
// Upstash Redis client (REST / HTTP)
// ---------------------------------------------------------------------------

const upstashConfigured = !!(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
)

const redis = upstashConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

// ---------------------------------------------------------------------------
// Upstash rate limiters — one per resource tier
// ---------------------------------------------------------------------------

function createLimiter(requests: number, window: string, prefix: string): Ratelimit | null {
  if (!redis) return null
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window as Parameters<typeof Ratelimit.slidingWindow>[1]),
    prefix,
  })
}

/** AI chat: 20 requests per minute per user. */
const aiChatLimiter = createLimiter(20, '1 m', 'ratelimit:ai:chat')

/** AI image generation: 5 per minute. */
const aiImageLimiter = createLimiter(5, '1 m', 'ratelimit:ai:image')

/** AI mesh generation: 3 per minute (expensive). */
const aiMeshLimiter = createLimiter(3, '1 m', 'ratelimit:ai:mesh')

/** AI texture generation: 5 per minute. */
const aiTextureLimiter = createLimiter(5, '1 m', 'ratelimit:ai:texture')

/** Prompt enhancement: 30 per minute. */
const aiEnhanceLimiter = createLimiter(30, '1 m', 'ratelimit:ai:enhance')

/** General API: 100 per minute. */
const apiLimiter = createLimiter(100, '1 m', 'ratelimit:api')

/** Studio sync polling: 120 per minute (2/sec). */
const studioSyncLimiter = createLimiter(120, '1 m', 'ratelimit:studio')

/** Billing routes: 10 per minute. */
const billingLimiter = createLimiter(10, '1 m', 'ratelimit:billing')

/** Parental consent: 3 per hour per IP. */
const parentalConsentLimiter = createLimiter(3, '1 h', 'ratelimit:parental')

/** Marketplace read: 30 per minute. */
const marketplaceReadLimiter = createLimiter(30, '1 m', 'ratelimit:mkt:read')

/** Marketplace write: 10 per minute. */
const marketplaceWriteLimiter = createLimiter(10, '1 m', 'ratelimit:mkt:write')

/** Studio execute: 30 per minute. */
const studioExecuteLimiter = createLimiter(30, '1 m', 'ratelimit:studio:exec')

/** Auth API routes: 10 per minute per IP (brute-force protection). */
const authApiLimiter = createLimiter(10, '1 m', 'ratelimit:auth:api')

/** Sign-in page: 20 per minute per IP. */
const signInLimiter = createLimiter(20, '1 m', 'ratelimit:auth:signin')

/** Sign-up page: 5 per minute per IP (anti-spam). */
const signUpLimiter = createLimiter(5, '1 m', 'ratelimit:auth:signup')

/** Studio connect: 5 per minute per user. */
const studioConnectLimiter = createLimiter(5, '1 m', 'ratelimit:studio:connect')

/**
 * Exported map of all named limiters — handy when you want to reference them
 * by key rather than importing individual functions.
 */
export const rateLimits = {
  aiChat: aiChatLimiter,
  aiImage: aiImageLimiter,
  aiMesh: aiMeshLimiter,
  aiTexture: aiTextureLimiter,
  aiEnhance: aiEnhanceLimiter,
  api: apiLimiter,
  studioSync: studioSyncLimiter,
  billing: billingLimiter,
  parentalConsent: parentalConsentLimiter,
  marketplaceRead: marketplaceReadLimiter,
  marketplaceWrite: marketplaceWriteLimiter,
  studioExecute: studioExecuteLimiter,
  authApi: authApiLimiter,
  signIn: signInLimiter,
  signUp: signUpLimiter,
  studioConnect: studioConnectLimiter,
}

// ---------------------------------------------------------------------------
// In-memory fallback rate limiter
// ---------------------------------------------------------------------------

/**
 * Per-instance in-memory fallback used when Upstash is unavailable.
 *
 * The fallback limit is intentionally 2x the Redis limit to account for load
 * being spread across multiple serverless instances.
 */
const memoryCounters = new Map<string, { count: number; resetAt: number }>()

// Prune expired buckets every 5 minutes to prevent unbounded Map growth.
setInterval(() => {
  const now = Date.now()
  memoryCounters.forEach((entry, key) => {
    if (entry.resetAt <= now) memoryCounters.delete(key)
  })
}, 5 * 60 * 1000).unref()

function checkMemoryLimit(
  identifier: string,
  limit: number,
  windowSec: number,
): RateLimitResult {
  const now = Date.now()
  const bucket = Math.floor(now / 1000 / windowSec)
  const key = `${identifier}:${windowSec}:${bucket}`
  const resetAt = (bucket + 1) * windowSec * 1000
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
// Shared result type
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

// ---------------------------------------------------------------------------
// Core check — uses Upstash if available, memory fallback otherwise
// ---------------------------------------------------------------------------

/**
 * Check a rate limit for `identifier` using the given Upstash limiter.
 * Returns a normalized RateLimitResult.
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string,
  fallbackLimit = 20,
  fallbackWindowSec = 60,
): Promise<RateLimitResult> {
  if (!limiter) {
    return checkMemoryLimit(identifier, fallbackLimit, fallbackWindowSec)
  }

  try {
    const result = await limiter.limit(identifier)
    return {
      allowed: result.success,
      limit: result.limit,
      remaining: result.remaining,
      resetAt: result.reset,
    }
  } catch (err) {
    // Upstash unreachable (quota exhausted, network error, service outage).
    // Fall back to the per-instance in-memory limiter so the site stays up,
    // but loudly report the failure to Sentry so ops can react — silent
    // degradation previously masked the exhausted-quota incident on Apr 11.
    console.error(
      '[rate-limit] Upstash error — using memory fallback for',
      identifier,
      err,
    )
    // Lazy import so missing @sentry/nextjs never breaks rate limiting.
    import('@sentry/nextjs')
      .then((sentry) => {
        sentry.captureException(err, {
          tags: { component: 'rate-limit', fallback: 'memory' },
          extra: { identifier, fallbackLimit, fallbackWindowSec },
        })
      })
      .catch(() => {
        /* Sentry not installed — nothing to do beyond console.error above. */
      })
    return checkMemoryLimit(identifier, fallbackLimit, fallbackWindowSec)
  }
}

/**
 * Build a 429 Response object with standard rate-limit headers.
 */
export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({ error: 'Rate limit exceeded. Please slow down.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(result.resetAt / 1000).toString(),
        'Retry-After': Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000)).toString(),
      },
    },
  )
}

// ---------------------------------------------------------------------------
// Tier helpers — backward-compatible with existing callers
// ---------------------------------------------------------------------------

/** AI routes — 20 requests per minute per user (generic, used by chat). */
export async function aiRateLimit(userId: string): Promise<RateLimitResult> {
  return checkRateLimit(aiChatLimiter, userId, 20, 60)
}

/** AI mesh — 3 requests per minute per user. */
export async function aiMeshRateLimit(userId: string): Promise<RateLimitResult> {
  return checkRateLimit(aiMeshLimiter, userId, 3, 60)
}

/** AI texture — 5 requests per minute per user. */
export async function aiTextureRateLimit(userId: string): Promise<RateLimitResult> {
  return checkRateLimit(aiTextureLimiter, userId, 5, 60)
}

/** AI image — 5 requests per minute per user. */
export async function aiImageRateLimit(userId: string): Promise<RateLimitResult> {
  return checkRateLimit(aiImageLimiter, userId, 5, 60)
}

/** AI prompt enhancement — 30 requests per minute. */
export async function aiEnhanceRateLimit(userId: string): Promise<RateLimitResult> {
  return checkRateLimit(aiEnhanceLimiter, userId, 30, 60)
}

/** Billing routes — 10 requests per minute per user. */
export async function billingRateLimit(userId: string): Promise<RateLimitResult> {
  return checkRateLimit(billingLimiter, userId, 10, 60)
}

/** Parental consent — 3 requests per hour per IP. */
export async function parentalConsentRateLimit(ip: string): Promise<RateLimitResult> {
  return checkRateLimit(parentalConsentLimiter, ip, 3, 3600)
}

/** General API routes — 100 requests per minute per user. */
export async function generalRateLimit(userId: string): Promise<RateLimitResult> {
  return checkRateLimit(apiLimiter, userId, 100, 60)
}

/** Marketplace read — 30 requests per minute. */
export async function marketplaceReadRateLimit(identifier: string): Promise<RateLimitResult> {
  return checkRateLimit(marketplaceReadLimiter, identifier, 30, 60)
}

/** Marketplace write — 10 requests per minute per user. */
export async function marketplaceWriteRateLimit(userId: string): Promise<RateLimitResult> {
  return checkRateLimit(marketplaceWriteLimiter, userId, 10, 60)
}

/** Studio sync — 120 requests per minute per session. */
export async function studioSyncRateLimit(sessionId: string): Promise<RateLimitResult> {
  return checkRateLimit(studioSyncLimiter, sessionId, 120, 60)
}

/** Studio execute — 30 commands per minute per user. */
export async function studioExecuteRateLimit(userId: string): Promise<RateLimitResult> {
  return checkRateLimit(studioExecuteLimiter, userId, 30, 60)
}

/** Auth API — 10 requests per minute per IP (brute-force protection). */
export async function authApiRateLimit(ip: string): Promise<RateLimitResult> {
  return checkRateLimit(authApiLimiter, ip, 10, 60)
}

/** Sign-in — 20 requests per minute per IP. */
export async function signInRateLimit(ip: string): Promise<RateLimitResult> {
  return checkRateLimit(signInLimiter, ip, 20, 60)
}

/** Sign-up — 5 requests per minute per IP (anti-spam). */
export async function signUpRateLimit(ip: string): Promise<RateLimitResult> {
  return checkRateLimit(signUpLimiter, ip, 5, 60)
}

/** Studio connect — 5 per minute per user. */
export async function studioConnectRateLimit(userId: string): Promise<RateLimitResult> {
  return checkRateLimit(studioConnectLimiter, userId, 5, 60)
}

// ---------------------------------------------------------------------------
// Response header helper — backward-compatible with existing callers
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
    ...(result.allowed ? {} : { 'Retry-After': String(Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000))) }),
  }
}
