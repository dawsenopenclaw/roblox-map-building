/**
 * POST /api/metrics — ingest endpoint for client-side `metrics.flush()`.
 *
 * Flow:
 *   1. Validate payload shape.
 *   2. Forward to PostHog as `$capture` events (when POSTHOG_KEY is set).
 *   3. Persist a short time-series summary in Redis for the /status page
 *      (latest 100 points per metric name + label signature).
 *
 * The endpoint is designed to be cheap: it never blocks the caller on external
 * writes — both PostHog and Redis are fire-and-forget with best-effort error
 * handling. Invalid payloads return 400 without leaking shape information.
 */

import 'server-only'
import { NextResponse } from 'next/server'
import { getRedis } from '@/lib/redis'
import { serverEnv } from '@/lib/env'
import { log } from '@/lib/observability/structured-logger'
import { cacheHeaders } from '@/lib/cache/cdn-headers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type MetricKind = 'counter' | 'histogram' | 'gauge'

interface IncomingPoint {
  kind: MetricKind
  name: string
  value: number
  labels: Record<string, string | number | boolean>
  at: number
}

interface IncomingPayload {
  points: IncomingPoint[]
}

const MAX_POINTS = 500
const MAX_NAME_LENGTH = 128
const MAX_LABEL_COUNT = 16

function isMetricKind(v: unknown): v is MetricKind {
  return v === 'counter' || v === 'histogram' || v === 'gauge'
}

function validate(body: unknown): IncomingPayload | null {
  if (!body || typeof body !== 'object') return null
  const payload = body as { points?: unknown }
  if (!Array.isArray(payload.points)) return null
  if (payload.points.length === 0 || payload.points.length > MAX_POINTS) return null

  const cleaned: IncomingPoint[] = []
  for (const raw of payload.points) {
    if (!raw || typeof raw !== 'object') return null
    const p = raw as Partial<IncomingPoint>
    if (!isMetricKind(p.kind)) return null
    if (typeof p.name !== 'string' || p.name.length === 0 || p.name.length > MAX_NAME_LENGTH) {
      return null
    }
    if (typeof p.value !== 'number' || !Number.isFinite(p.value)) return null
    if (typeof p.at !== 'number' || !Number.isFinite(p.at)) return null
    if (!p.labels || typeof p.labels !== 'object') return null
    const labelEntries = Object.entries(p.labels as Record<string, unknown>)
    if (labelEntries.length > MAX_LABEL_COUNT) return null
    const labels: Record<string, string | number | boolean> = {}
    for (const [k, v] of labelEntries) {
      if (typeof k !== 'string' || k.length === 0 || k.length > 64) return null
      if (typeof v !== 'string' && typeof v !== 'number' && typeof v !== 'boolean') return null
      labels[k] = v
    }
    cleaned.push({
      kind: p.kind,
      name: p.name,
      value: p.value,
      at: p.at,
      labels,
    })
  }
  return { points: cleaned }
}

function labelSignature(labels: Record<string, string | number | boolean>): string {
  const keys = Object.keys(labels).sort()
  if (keys.length === 0) return ''
  return keys.map((k) => `${k}=${String(labels[k])}`).join('|')
}

async function persistInRedis(points: readonly IncomingPoint[]): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  try {
    const pipeline = redis.pipeline()
    for (const p of points) {
      const key = `metrics:v1:${p.name}:${labelSignature(p.labels)}`
      pipeline.lpush(key, JSON.stringify({ v: p.value, t: p.at, k: p.kind }))
      pipeline.ltrim(key, 0, 99)
      pipeline.expire(key, 86_400)
    }
    await pipeline.exec()
  } catch (err) {
    log.warn('metrics.redis_persist_failed', {}, err)
  }
}

async function forwardToPostHog(points: readonly IncomingPoint[]): Promise<void> {
  const key = (serverEnv as unknown as { POSTHOG_KEY?: string; NEXT_PUBLIC_POSTHOG_KEY?: string })
    .POSTHOG_KEY ?? (serverEnv as unknown as { NEXT_PUBLIC_POSTHOG_KEY?: string }).NEXT_PUBLIC_POSTHOG_KEY
  if (!key) return
  try {
    const batch = points.map((p) => ({
      event: `metric.${p.kind}.${p.name}`,
      distinct_id: 'forjegames-server',
      properties: {
        value: p.value,
        ...p.labels,
      },
      timestamp: new Date(p.at).toISOString(),
    }))
    await fetch('https://us.i.posthog.com/batch/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ api_key: key, batch }),
      keepalive: true,
    })
  } catch (err) {
    log.warn('metrics.posthog_forward_failed', { count: points.length }, err)
  }
}

export async function POST(req: Request): Promise<Response> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: 'invalid json' },
      { status: 400, headers: cacheHeaders('private') },
    )
  }

  const payload = validate(body)
  if (!payload) {
    return NextResponse.json(
      { ok: false, error: 'invalid payload' },
      { status: 400, headers: cacheHeaders('private') },
    )
  }

  // Fire-and-forget. Never block the caller on downstream writes.
  void persistInRedis(payload.points)
  void forwardToPostHog(payload.points)

  return NextResponse.json(
    { ok: true, received: payload.points.length },
    { status: 202, headers: cacheHeaders('private') },
  )
}

export async function GET(): Promise<Response> {
  return NextResponse.json(
    { ok: true, endpoint: 'metrics', method: 'POST' },
    { headers: cacheHeaders('private') },
  )
}
