import { Hono } from 'hono'
import { requireAuth } from '../../middleware/auth'
import { db } from '../../lib/db'

export const apiKeyUsageRoutes = new Hono()

// ─── Helpers ─────────────────────────────────────────────────────────────────

const RANGE_HOURS: Record<string, number> = {
  '1h': 1,
  '6h': 6,
  '24h': 24,
  '7d': 168,
}

/**
 * Bucket request counts into hour-sized slots.
 * Returns an array ordered oldest → newest with `requests` and `errors` per slot.
 */
function bucketByHour(
  records: Array<{ createdAt: Date; success: boolean }>,
  hours: number
): Array<{ hour: string; requests: number; errors: number }> {
  const now = Date.now()
  // Determine bucket size: for 7d use 4-hour buckets; otherwise 1-hour
  const bucketMs = hours > 24 ? 4 * 60 * 60 * 1000 : 60 * 60 * 1000
  const bucketCount = Math.ceil((hours * 60 * 60 * 1000) / bucketMs)

  const buckets: Array<{ hour: string; requests: number; errors: number }> = []
  for (let i = bucketCount - 1; i >= 0; i--) {
    const bucketStart = new Date(now - (i + 1) * bucketMs)
    buckets.push({ hour: bucketStart.toISOString(), requests: 0, errors: 0 })
  }

  for (const r of records) {
    const age = now - r.createdAt.getTime()
    const bucketIdx = Math.floor(age / bucketMs)
    const slot = bucketCount - 1 - bucketIdx
    if (slot >= 0 && slot < bucketCount) {
      buckets[slot].requests++
      if (!r.success) buckets[slot].errors++
    }
  }

  return buckets
}

// ─── GET /api/keys/:id/usage ─────────────────────────────────────────────────

/**
 * Returns usage stats for a specific API key owned by the authenticated user.
 *
 * Query params:
 *   range: '1h' | '6h' | '24h' | '7d'  (default: '24h')
 */
apiKeyUsageRoutes.get('/:id/usage', requireAuth, async (c) => {
  const clerkId = (c as any).get('clerkId') as string
  const id = c.req.param('id')
  const range = (c.req.query('range') ?? '24h') as string
  const hours = RANGE_HOURS[range] ?? 24

  // Verify ownership
  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return c.json({ error: 'User not found' }, 404)

  const apiKey = await db.apiKey.findFirst({
    where: { id, userId: user.id },
    select: {
      id: true,
      name: true,
      prefix: true,
      tier: true,
      scopes: true,
      lastUsedAt: true,
      createdAt: true,
      revokedAt: true,
      expiresAt: true,
    },
  })

  if (!apiKey) return c.json({ error: 'API key not found' }, 404)

  const since = new Date(Date.now() - hours * 60 * 60 * 1000)

  // Fetch all usage records for this key in the window
  const records = await db.apiUsageRecord.findMany({
    where: {
      apiKeyId: id,
      createdAt: { gte: since },
    },
    select: {
      createdAt: true,
      success: true,
      httpMethod: true,
      httpPath: true,
      tokensUsed: true,
      statusCode: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  // ── Hourly buckets ──
  const hourlyBuckets = bucketByHour(records, hours)

  // ── Totals ──
  const totalRequests = records.length
  const totalErrors = records.filter((r) => !r.success).length
  const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0
  const totalTokens = records.reduce((sum, r) => sum + r.tokensUsed, 0)

  // ── Top endpoints ──
  const endpointCounts: Record<string, { method: string; path: string; count: number; errors: number }> = {}
  for (const r of records) {
    const key = `${r.httpMethod ?? 'UNKNOWN'} ${r.httpPath ?? '/unknown'}`
    if (!endpointCounts[key]) {
      endpointCounts[key] = {
        method: r.httpMethod ?? 'UNKNOWN',
        path: r.httpPath ?? '/unknown',
        count: 0,
        errors: 0,
      }
    }
    endpointCounts[key].count++
    if (!r.success) endpointCounts[key].errors++
  }

  const topEndpoints = Object.values(endpointCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((e) => ({
      ...e,
      errorRate: e.count > 0 ? Math.round((e.errors / e.count) * 100) : 0,
    }))

  // ── Current rate limit window usage (last hour only) ──
  const TIER_LIMITS: Record<string, number> = {
    FREE: 10,
    HOBBY: 100,
    CREATOR: 500,
    STUDIO: 1000,
  }
  const limitHour = TIER_LIMITS[apiKey.tier] ?? 10
  const lastHourRecords = records.filter(
    (r) => r.createdAt >= new Date(Date.now() - 60 * 60 * 1000)
  )
  const currentHourUsage = lastHourRecords.length

  return c.json({
    key: {
      id: apiKey.id,
      name: apiKey.name,
      prefix: apiKey.prefix,
      tier: apiKey.tier,
      scopes: apiKey.scopes,
      lastUsedAt: apiKey.lastUsedAt,
      createdAt: apiKey.createdAt,
      revokedAt: apiKey.revokedAt,
      expiresAt: apiKey.expiresAt,
    },
    usage: {
      range,
      totalRequests,
      totalErrors,
      errorRate: Math.round(errorRate * 10) / 10,
      totalTokens,
      hourlyBuckets,
    },
    rateLimit: {
      tier: apiKey.tier,
      limitPerHour: limitHour,
      currentHourUsage,
      remaining: Math.max(0, limitHour - currentHourUsage),
    },
    topEndpoints,
  })
})
