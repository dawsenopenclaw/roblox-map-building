/**
 * Aggregated health checks for the ForjeGames stack.
 *
 * Each check is bounded by a timeout so a hung dependency can't hang the
 * whole probe. Results are returned as a structured payload that both
 * /api/health (for probes) and the public /status page can render.
 */

import 'server-only'
import { getRedis } from '../redis'
import { withTimeout, TimeoutError } from '../reliability/retry'
import { serverEnv } from '../env'

export type HealthStatus = 'ok' | 'degraded' | 'down' | 'skipped'

export interface CheckResult {
  name: string
  status: HealthStatus
  durationMs: number
  message?: string
  meta?: Record<string, string | number | boolean>
}

export interface HealthReport {
  status: HealthStatus
  checkedAt: string
  durationMs: number
  checks: readonly CheckResult[]
}

const DEFAULT_TIMEOUT_MS = 2_500

interface CheckDef {
  name: string
  optional: boolean
  run: (signal: AbortSignal) => Promise<Omit<CheckResult, 'name' | 'durationMs'>>
}

/** Aggregate a set of statuses into a single top-level status. */
function aggregate(results: readonly CheckResult[]): HealthStatus {
  if (results.length === 0) return 'ok'
  if (results.some((r) => r.status === 'down')) return 'down'
  if (results.some((r) => r.status === 'degraded')) return 'degraded'
  return 'ok'
}

async function runCheck(def: CheckDef, timeoutMs: number): Promise<CheckResult> {
  const started = Date.now()
  try {
    const res = await withTimeout((signal) => def.run(signal), timeoutMs)
    return { name: def.name, durationMs: Date.now() - started, ...res }
  } catch (err) {
    const durationMs = Date.now() - started
    if (err instanceof TimeoutError) {
      return {
        name: def.name,
        status: def.optional ? 'degraded' : 'down',
        durationMs,
        message: `timeout after ${timeoutMs}ms`,
      }
    }
    const message = err instanceof Error ? err.message : String(err)
    return {
      name: def.name,
      status: def.optional ? 'degraded' : 'down',
      durationMs,
      message,
    }
  }
}

// ---- individual checks ----

const checkDatabase: CheckDef = {
  name: 'database',
  optional: false,
  run: async () => {
    const mod = (await import('../db')) as { db?: { $queryRawUnsafe?: (q: string) => Promise<unknown> } }
    const db = mod.db
    if (!db?.$queryRawUnsafe) {
      return { status: 'skipped', message: 'db module has no $queryRawUnsafe' }
    }
    await db.$queryRawUnsafe('SELECT 1')
    return { status: 'ok' }
  },
}

const checkRedis: CheckDef = {
  name: 'redis',
  optional: true,
  run: async () => {
    const r = getRedis()
    if (!r) return { status: 'skipped', message: 'REDIS_URL not configured' }
    const pong = await r.ping()
    if (pong !== 'PONG') return { status: 'degraded', message: `ping returned ${pong}` }
    return { status: 'ok' }
  },
}

async function httpProbe(
  url: string,
  signal: AbortSignal,
  headers: HeadersInit = {},
): Promise<Omit<CheckResult, 'name' | 'durationMs'>> {
  const res = await fetch(url, { method: 'GET', signal, headers })
  if (res.status >= 500) {
    return { status: 'down', message: `HTTP ${res.status}` }
  }
  if (res.status >= 400 && res.status !== 401 && res.status !== 403) {
    return { status: 'degraded', message: `HTTP ${res.status}` }
  }
  return { status: 'ok', meta: { httpStatus: res.status } }
}

const checkAnthropic: CheckDef = {
  name: 'anthropic',
  optional: true,
  run: async (signal) => {
    if (!serverEnv.ANTHROPIC_API_KEY) {
      return { status: 'skipped', message: 'ANTHROPIC_API_KEY not set' }
    }
    return httpProbe('https://api.anthropic.com/v1/models', signal, {
      'x-api-key': serverEnv.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    })
  },
}

const checkMeshy: CheckDef = {
  name: 'meshy',
  optional: true,
  run: async (signal) => {
    const key = (serverEnv as unknown as { MESHY_API_KEY?: string }).MESHY_API_KEY
    if (!key) return { status: 'skipped', message: 'MESHY_API_KEY not set' }
    return httpProbe('https://api.meshy.ai/openapi/v2/text-to-3d', signal, {
      authorization: `Bearer ${key}`,
    })
  },
}

const checkStripe: CheckDef = {
  name: 'stripe',
  optional: true,
  run: async (signal) => {
    const key = (serverEnv as unknown as { STRIPE_SECRET_KEY?: string }).STRIPE_SECRET_KEY
    if (!key) return { status: 'skipped', message: 'STRIPE_SECRET_KEY not set' }
    return httpProbe('https://api.stripe.com/v1/balance', signal, {
      authorization: `Bearer ${key}`,
    })
  },
}

const checkRoblox: CheckDef = {
  name: 'roblox-open-cloud',
  optional: true,
  run: async (signal) => {
    const res = await fetch('https://apis.roblox.com/cloud/v2/', { method: 'GET', signal })
    if (res.status >= 500) return { status: 'down', message: `HTTP ${res.status}` }
    return { status: 'ok', meta: { httpStatus: res.status } }
  },
}

const ALL_CHECKS: readonly CheckDef[] = [
  checkDatabase,
  checkRedis,
  checkAnthropic,
  checkMeshy,
  checkStripe,
  checkRoblox,
]

export interface HealthCheckOptions {
  timeoutMs?: number
  only?: readonly string[]
}

export async function runHealthChecks(opts: HealthCheckOptions = {}): Promise<HealthReport> {
  const started = Date.now()
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const selected = opts.only
    ? ALL_CHECKS.filter((c) => opts.only?.includes(c.name))
    : ALL_CHECKS

  const results = await Promise.all(selected.map((c) => runCheck(c, timeoutMs)))
  return {
    status: aggregate(results),
    checkedAt: new Date().toISOString(),
    durationMs: Date.now() - started,
    checks: results,
  }
}
