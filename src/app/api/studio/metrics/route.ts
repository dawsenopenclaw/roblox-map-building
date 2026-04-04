/**
 * GET /api/studio/metrics
 *
 * Internal monitoring endpoint — returns a JSON snapshot of live Studio API
 * health and throughput metrics pulled from Redis + session store.
 *
 * Protected by METRICS_SECRET env var (Bearer token or ?token= query param).
 *
 * Response shape:
 * {
 *   activeSessions:      number,
 *   totalDownloads:      number,
 *   cmdsLastHour:        number,
 *   avgSyncLatencyMs:    number,
 *   redisOk:             boolean,
 *   timestamp:           number,
 *   connectionsByHour:   { hour: string; count: number }[],
 *   versionDistribution: Record<string, number>,
 *   commandsByType:      Record<string, number>,
 *   errorRate:           number,
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { listSessions } from '@/lib/studio-session'
import {
  getConnectionsByHour,
  getVersionDistribution,
  getCommandsByType,
  getErrorRate,
} from '@/lib/studio-analytics'

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

const METRICS_SECRET = process.env.METRICS_SECRET ?? ''

function isAuthorized(req: NextRequest): boolean {
  if (!METRICS_SECRET) return false
  const auth = req.headers.get('authorization') ?? ''
  if (auth.startsWith('Bearer ')) return auth.slice(7) === METRICS_SECRET
  return (req.nextUrl.searchParams.get('token') ?? '') === METRICS_SECRET
}

// ---------------------------------------------------------------------------
// Redis helpers
// ---------------------------------------------------------------------------

function getRedis() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@/lib/redis') as { getRedis?: () => import('ioredis').Redis | null }
    return mod.getRedis ? mod.getRedis() : null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const hourKey = `fj:studio:cmds:hour:${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}-${String(now.getUTCHours()).padStart(2, '0')}`

  const r = getRedis()
  let totalDownloads    = 0
  let cmdsLastHour      = 0
  let avgSyncLatencyMs  = 0
  let redisOk           = false

  if (r) {
    try {
      const [downloads, cmds, latencyRaw] = await Promise.all([
        r.get('fj:studio:downloads').then((v) => parseInt(v ?? '0', 10)),
        r.get(hourKey).then((v) => parseInt(v ?? '0', 10)),
        r.get('fj:studio:sync:latency:samples').then((v) => {
          if (!v) return 0
          try {
            const samples = JSON.parse(v) as number[]
            if (!samples.length) return 0
            return Math.round(samples.reduce((a, b) => a + b, 0) / samples.length)
          } catch { return 0 }
        }),
      ])
      totalDownloads   = isNaN(downloads) ? 0 : downloads
      cmdsLastHour     = isNaN(cmds) ? 0 : cmds
      avgSyncLatencyMs = latencyRaw
      redisOk          = true
    } catch {
      redisOk = false
    }
  }

  // Run all heavy fetches in parallel
  const [sessions, connectionsByHour, versionDistribution, commandsByType, errorRate] =
    await Promise.all([
      listSessions(),
      getConnectionsByHour(),
      getVersionDistribution(),
      getCommandsByType(),
      getErrorRate(),
    ])

  const activeSessions = sessions.filter((s) => s.connected).length

  return NextResponse.json(
    {
      activeSessions,
      totalDownloads,
      cmdsLastHour,
      avgSyncLatencyMs,
      redisOk,
      timestamp: Date.now(),
      connectionsByHour,
      versionDistribution,
      commandsByType,
      errorRate,
    },
    {
      status: 200,
      headers: { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' },
    },
  )
}
