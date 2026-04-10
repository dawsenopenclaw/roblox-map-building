import { NextResponse } from 'next/server'
import { requireAdmin } from '../_adminGuard'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const startTime = Date.now()
  const status: Record<string, unknown> = {}

  // --- Database ping ---
  try {
    const dbStart = Date.now()
    await db.$queryRawUnsafe('SELECT 1')
    status.database = { connected: true, latencyMs: Date.now() - dbStart }
  } catch (e) {
    status.database = { connected: false, error: e instanceof Error ? e.message : 'Unknown' }
  }

  // --- Redis / Upstash ---
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN
  if (upstashUrl && upstashToken) {
    try {
      const redisStart = Date.now()
      const res = await fetch(`${upstashUrl}/ping`, {
        headers: { Authorization: `Bearer ${upstashToken}` },
      })
      status.redis = { connected: res.ok, latencyMs: Date.now() - redisStart }
    } catch (e) {
      status.redis = { connected: false, error: e instanceof Error ? e.message : 'Unknown' }
    }
  } else {
    // Try ioredis fallback
    try {
      const { redis } = await import('@/lib/redis')
      const redisStart = Date.now()
      const pong = await redis.ping()
      status.redis = { connected: pong === 'PONG', latencyMs: Date.now() - redisStart }
    } catch (e) {
      status.redis = {
        connected: false,
        error: e instanceof Error ? e.message : 'Not configured',
      }
    }
  }

  // --- AI Provider Status (liveness checks) ---
  const aiProviders: Record<
    string,
    { configured: boolean; reachable: boolean | null; latencyMs: number | null; error?: string }
  > = {}

  // Anthropic (Claude)
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const start = Date.now()
      const res = await fetch('https://api.anthropic.com/v1/models', {
        method: 'GET',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        signal: AbortSignal.timeout(5000),
      })
      aiProviders.anthropic = {
        configured: true,
        reachable: res.ok || res.status === 200,
        latencyMs: Date.now() - start,
      }
    } catch (e) {
      aiProviders.anthropic = {
        configured: true,
        reachable: false,
        latencyMs: null,
        error: e instanceof Error ? e.message : 'Unknown',
      }
    }
  } else {
    aiProviders.anthropic = { configured: false, reachable: null, latencyMs: null }
  }

  // Gemini (Google AI)
  if (process.env.GEMINI_API_KEY) {
    try {
      const start = Date.now()
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`,
        { signal: AbortSignal.timeout(5000) }
      )
      aiProviders.gemini = {
        configured: true,
        reachable: res.ok,
        latencyMs: Date.now() - start,
      }
    } catch (e) {
      aiProviders.gemini = {
        configured: true,
        reachable: false,
        latencyMs: null,
        error: e instanceof Error ? e.message : 'Unknown',
      }
    }
  } else {
    aiProviders.gemini = { configured: false, reachable: null, latencyMs: null }
  }

  // OpenAI (Groq uses OpenAI-compatible API, but let's check both)
  if (process.env.OPENAI_API_KEY) {
    try {
      const start = Date.now()
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        signal: AbortSignal.timeout(5000),
      })
      aiProviders.openai = {
        configured: true,
        reachable: res.ok,
        latencyMs: Date.now() - start,
      }
    } catch (e) {
      aiProviders.openai = {
        configured: true,
        reachable: false,
        latencyMs: null,
        error: e instanceof Error ? e.message : 'Unknown',
      }
    }
  } else {
    aiProviders.openai = { configured: false, reachable: null, latencyMs: null }
  }

  // Fal.ai
  if (process.env.FAL_KEY) {
    aiProviders.fal = { configured: true, reachable: null, latencyMs: null }
  } else {
    aiProviders.fal = { configured: false, reachable: null, latencyMs: null }
  }

  // Meshy
  if (process.env.MESHY_API_KEY) {
    aiProviders.meshy = { configured: true, reachable: null, latencyMs: null }
  } else {
    aiProviders.meshy = { configured: false, reachable: null, latencyMs: null }
  }

  // Deepgram
  if (process.env.DEEPGRAM_API_KEY) {
    aiProviders.deepgram = { configured: true, reachable: null, latencyMs: null }
  } else {
    aiProviders.deepgram = { configured: false, reachable: null, latencyMs: null }
  }

  // ElevenLabs
  if (process.env.ELEVENLABS_API_KEY) {
    aiProviders.elevenlabs = { configured: true, reachable: null, latencyMs: null }
  } else {
    aiProviders.elevenlabs = { configured: false, reachable: null, latencyMs: null }
  }

  status.aiProviders = aiProviders

  // --- Studio Plugin Connections ---
  try {
    const { listSessions } = await import('@/lib/studio-session')
    const sessions = await listSessions()
    status.studioConnections = {
      active: sessions.filter((s) => s.connected).length,
      total: sessions.length,
      sessions: sessions.map((s) => ({
        sessionId: s.sessionId,
        placeId: s.placeId,
        placeName: s.placeName,
        connected: s.connected,
        lastHeartbeat: s.lastHeartbeat,
        pluginVersion: s.pluginVersion,
        queueDepth: s.queueDepth,
      })),
    }
  } catch {
    status.studioConnections = { active: 0, sessions: [], error: 'Could not query studio sessions' }
  }

  // --- Memory Usage ---
  const mem = process.memoryUsage()
  status.memory = {
    rssBytes: mem.rss,
    heapUsedBytes: mem.heapUsed,
    heapTotalBytes: mem.heapTotal,
    rssMb: Math.round(mem.rss / 1024 / 1024),
    heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
  }

  // --- Process uptime ---
  status.uptimeSeconds = Math.floor(process.uptime())

  // --- Active users (last 15 min) ---
  try {
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000)
    const activeUsers = await db.auditLog.findMany({
      where: { createdAt: { gte: fifteenMinAgo } },
      distinct: ['userId'],
      select: { userId: true },
    })
    status.activeConnections = activeUsers.filter((u) => u.userId).length
  } catch {
    status.activeConnections = 0
  }

  // --- Counts ---
  try {
    const [totalUsers, totalBuilds] = await Promise.all([
      db.user.count({ where: { deletedAt: null } }),
      db.build.count(),
    ])
    status.totalUsers = totalUsers
    status.totalBuilds = totalBuilds
  } catch {
    status.totalUsers = 0
    status.totalBuilds = 0
  }

  // --- Error rate (last hour) ---
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const [totalRequests, failedRequests] = await Promise.all([
      db.apiUsageRecord.count({ where: { createdAt: { gte: oneHourAgo } } }),
      db.apiUsageRecord.count({
        where: {
          createdAt: { gte: oneHourAgo },
          OR: [{ success: false }, { statusCode: { gte: 400 } }],
        },
      }),
    ])
    status.errorRateLastHour = {
      totalRequests,
      failedRequests,
      rate: totalRequests > 0 ? Number(((failedRequests / totalRequests) * 100).toFixed(2)) : 0,
    }
  } catch {
    status.errorRateLastHour = { totalRequests: 0, failedRequests: 0, rate: 0 }
  }

  // --- Avg response time (last hour) ---
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const result = await db.apiUsageRecord.aggregate({
      where: { createdAt: { gte: oneHourAgo }, durationMs: { not: null } },
      _avg: { durationMs: true },
      _max: { durationMs: true },
      _min: { durationMs: true },
      _count: { durationMs: true },
    })
    status.responseTimesLastHour = {
      avgMs: Math.round(result._avg.durationMs ?? 0),
      maxMs: result._max.durationMs ?? 0,
      minMs: result._min.durationMs ?? 0,
      sampleCount: result._count.durationMs,
    }
  } catch {
    status.responseTimesLastHour = { avgMs: 0, maxMs: 0, minMs: 0, sampleCount: 0 }
  }

  status.responseTimeMs = Date.now() - startTime

  // --- Overall health summary ---
  const dbOk = (status.database as Record<string, unknown>)?.connected === true
  const redisOk = (status.redis as Record<string, unknown>)?.connected === true
  const criticalAiOk =
    aiProviders.anthropic?.configured &&
    (aiProviders.anthropic?.reachable !== false)

  status.overallHealth = dbOk && redisOk && criticalAiOk ? 'healthy' : dbOk ? 'degraded' : 'critical'

  return NextResponse.json(status)
}
