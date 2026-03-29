import type { Context, Next } from 'hono'
import { createHash } from 'crypto'
import { db } from '../lib/db'
import { redis } from '../lib/redis'

// ─── Tier rate limits (requests per hour) ──────────────────────────────────

const TIER_RATE_LIMITS: Record<string, number> = {
  FREE: 10,
  HOBBY: 100,
  CREATOR: 500,
  STUDIO: 1000,
}

// ─── Scope permission map ───────────────────────────────────────────────────

/**
 * Maps HTTP method + path prefix to the minimum scope required.
 * 'full' > 'terrain-only' | 'assets-only' > 'read-only'
 */
const SCOPE_HIERARCHY = ['full', 'terrain-only', 'assets-only', 'read-only']

function isScopeAllowed(keyScopes: string[], requiredScope: string): boolean {
  // 'full' scope permits everything
  if (keyScopes.includes('full')) return true
  return keyScopes.includes(requiredScope)
}

function getRequiredScope(method: string, path: string): string {
  if (method === 'GET' || method === 'HEAD') return 'read-only'
  if (path.includes('/terrain')) return 'terrain-only'
  if (path.includes('/assets') || path.includes('/ai/image') || path.includes('/ai/voice')) {
    return 'assets-only'
  }
  return 'full'
}

// ─── Redis sliding-window rate limiter for API keys ─────────────────────────

async function checkRateLimit(keyId: string, limit: number): Promise<{ allowed: boolean; remaining: number }> {
  const windowSec = 3600 // 1 hour
  const now = Date.now()
  const windowStart = now - windowSec * 1000
  const redisKey = `rl:apikey:${keyId}`

  const pipe = redis.pipeline()
  pipe.zremrangebyscore(redisKey, 0, windowStart)
  pipe.zadd(redisKey, now, `${now}-${Math.random()}`)
  pipe.zcard(redisKey)
  pipe.expire(redisKey, windowSec)
  const results = await pipe.exec()

  const count = (results?.[2]?.[1] as number) ?? 0
  const remaining = Math.max(0, limit - count)
  return { allowed: count <= limit, remaining }
}

// ─── Middleware ──────────────────────────────────────────────────────────────

/**
 * API key authentication middleware for Hono.
 *
 * Extracts key from `Authorization: Bearer rf_sk_...` header.
 * Sets context values: `apiKeyId`, `apiKeyUserId`, `apiKeyTier`, `apiKeyScopes`.
 *
 * Returns 401 if key missing/invalid, 403 if scope insufficient, 429 if rate limited.
 */
export async function apiKeyAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')

  if (!authHeader?.startsWith('Bearer rf_sk_')) {
    return c.json({ error: 'Missing or invalid API key. Use Authorization: Bearer <key>' }, 401)
  }

  const raw = authHeader.slice(7) // strip "Bearer "
  const hash = createHash('sha256').update(raw).digest('hex')

  // Look up the key
  const apiKey = await db.apiKey.findUnique({
    where: { keyHash: hash },
    select: {
      id: true,
      userId: true,
      scopes: true,
      tier: true,
      revokedAt: true,
      expiresAt: true,
      rotatedFromGraceEndsAt: true,
    },
  })

  if (!apiKey) {
    return c.json({ error: 'Invalid API key' }, 401)
  }

  // Check revocation
  if (apiKey.revokedAt) {
    return c.json({ error: 'API key has been revoked' }, 401)
  }

  // Check expiry
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return c.json({ error: 'API key has expired' }, 401)
  }

  // Check scope
  const method = c.req.method
  const path = c.req.path
  const required = getRequiredScope(method, path)
  if (!isScopeAllowed(apiKey.scopes, required)) {
    return c.json(
      {
        error: `API key lacks required scope: ${required}. Key has: ${apiKey.scopes.join(', ')}`,
      },
      403
    )
  }

  // Check rate limit
  const limit = TIER_RATE_LIMITS[apiKey.tier] ?? TIER_RATE_LIMITS.FREE
  const { allowed, remaining } = await checkRateLimit(apiKey.id, limit)

  c.header('X-RateLimit-Limit', String(limit))
  c.header('X-RateLimit-Remaining', String(remaining))
  c.header('X-RateLimit-Window', '3600')

  if (!allowed) {
    return c.json(
      {
        error: 'Rate limit exceeded',
        limit,
        remaining: 0,
        resetIn: '1 hour',
      },
      429
    )
  }

  // Update lastUsedAt asynchronously (fire-and-forget, don't block request)
  db.apiKey
    .update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => {
      // Non-critical — do not fail the request
    })

  // Expose to downstream handlers
  c.set('apiKeyId', apiKey.id)
  c.set('apiKeyUserId', apiKey.userId)
  c.set('apiKeyTier', apiKey.tier)
  c.set('apiKeyScopes', apiKey.scopes)

  await next()
}
