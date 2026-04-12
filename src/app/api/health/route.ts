/**
 * GET /api/health
 *
 * System health check endpoint. Used by:
 *   - Studio plugin to detect if the local dev server is running
 *   - Uptime monitors (Better Uptime, etc.)
 *   - Vercel / Fly.io health probe
 *
 * TWO response modes:
 *   Public (no auth):    { status: "ok"|"degraded"|"down", timestamp }
 *   Admin (authenticated): full details with all service check statuses
 *
 * Admin auth: supply either
 *   Authorization: Bearer <HEALTH_CHECK_SECRET>   (env var)
 *   OR a valid Clerk session with ADMIN role / owner email
 *
 * Each check returns "ok" | "degraded" | "error" | "unconfigured".
 * The top-level `status` is "healthy" if all required checks pass,
 * "degraded" if optional checks fail, "unhealthy" if required checks fail.
 */
import { NextRequest, NextResponse } from 'next/server'
import pkg from '../../../../package.json'
import { requireAdmin } from '../admin/_adminGuard'

// ── Types ────────────────────────────────────────────────────────────────────

type CheckStatus = 'ok' | 'degraded' | 'error' | 'unconfigured'

interface HealthChecks {
  database: CheckStatus
  redis: CheckStatus
  stripe: CheckStatus
  meshy: CheckStatus
  fal: CheckStatus
  mcp_asset_alchemist: CheckStatus
  mcp_city_architect: CheckStatus
  mcp_terrain_forge: CheckStatus
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  version: string
  checks: HealthChecks
  timestamp: string
}

interface PublicHealthResponse {
  status: 'ok' | 'degraded' | 'down'
  timestamp: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function fetchWithTimeout(url: string, timeoutMs = 2000, headers?: Record<string, string>): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { signal: controller.signal, headers })
  } finally {
    clearTimeout(timer)
  }
}

async function checkMcp(url: string): Promise<CheckStatus> {
  if (!url) return 'unconfigured'
  // A localhost MCP URL is a dev default — in production it will always fail
  // and cause the top-level status to flip to "degraded" / "unhealthy" for no
  // real reason. Treat localhost URLs as unconfigured so the status reflects
  // what is actually serving users.
  if (
    process.env.NODE_ENV === 'production' &&
    (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1'))
  ) {
    return 'unconfigured'
  }
  try {
    const res = await fetchWithTimeout(`${url}/health`)
    return res.ok ? 'ok' : 'degraded'
  } catch {
    return 'error'
  }
}

async function checkDatabase(): Promise<CheckStatus> {
  if (!process.env.DATABASE_URL) return 'unconfigured'
  try {
    // Dynamic import keeps Prisma out of the module graph at build time
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    await prisma.$queryRaw`SELECT 1`
    await prisma.$disconnect()
    return 'ok'
  } catch {
    return 'error'
  }
}

async function checkRedis(): Promise<CheckStatus> {
  const redisUrl = process.env.REDIS_URL
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!redisUrl && !upstashUrl) return 'unconfigured'

  // Upstash: HTTP ping — Authorization header required, otherwise Upstash returns 401 (not PONG)
  if (upstashUrl && upstashToken) {
    try {
      const res = await fetchWithTimeout(`${upstashUrl}/ping`, 2000, {
        Authorization: `Bearer ${upstashToken}`,
      })
      const body = await res.text()
      return body.includes('PONG') ? 'ok' : 'degraded'
    } catch {
      return 'error'
    }
  }

  // Classic Redis: TCP via ioredis
  if (redisUrl) {
    try {
      const { default: Redis } = await import('ioredis')
      const redis = new Redis(redisUrl, {
        connectTimeout: 2000,
        maxRetriesPerRequest: 0,
        lazyConnect: true,
      })
      await redis.connect()
      await redis.ping()
      redis.disconnect()
      return 'ok'
    } catch {
      return 'error'
    }
  }

  return 'unconfigured'
}

async function checkMeshy(): Promise<CheckStatus> {
  if (!process.env.MESHY_API_KEY) return 'unconfigured'
  try {
    const res = await fetchWithTimeout('https://api.meshy.ai/v3/text-to-3d?page_size=1')
    // 200 or 401 both confirm the API is up
    return res.status < 500 ? 'ok' : 'degraded'
  } catch {
    return 'error'
  }
}

async function checkFal(): Promise<CheckStatus> {
  if (!process.env.FAL_KEY) return 'unconfigured'
  try {
    const res = await fetchWithTimeout('https://queue.fal.run')
    return res.status < 500 ? 'ok' : 'degraded'
  } catch {
    return 'error'
  }
}

async function checkStripe(): Promise<CheckStatus> {
  if (!process.env.STRIPE_SECRET_KEY) return 'unconfigured'
  try {
    // Lightweight read-only call — no charge created, just confirms API reachability
    const res = await fetchWithTimeout('https://api.stripe.com/v1/balance', 2000, {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
    })
    // 200 = ok, 401 = wrong key but API is up (unconfigured), 5xx = degraded
    if (res.status === 200) return 'ok'
    if (res.status === 401) return 'unconfigured'
    return 'degraded'
  } catch {
    return 'error'
  }
}

// ── Auth helpers ──────────────────────────────────────────────────────────────

/**
 * Returns true if the request carries a valid HEALTH_CHECK_SECRET bearer token
 * OR passes the admin session check.
 */
async function isAuthorized(req: NextRequest): Promise<boolean> {
  // 1. Static secret — fast path, no DB/Clerk needed (for uptime monitors that
  //    need full detail, CI pipelines, etc.)
  const secret = process.env.HEALTH_CHECK_SECRET
  if (secret) {
    const authHeader = req.headers.get('Authorization') ?? ''
    if (authHeader === `Bearer ${secret}`) return true
  }

  // 2. Clerk admin session
  const { error } = await requireAdmin()
  return error === null
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const timestamp = new Date().toISOString()

  // ── Run all service checks concurrently regardless of auth mode so we can
  //    derive the top-level status for both response shapes.
  const MCP_ASSET_URL   = process.env.MCP_ASSET_ALCHEMIST_URL ?? 'http://localhost:3002'
  const MCP_CITY_URL    = process.env.MCP_CITY_ARCHITECT_URL  ?? 'http://localhost:3003'
  const MCP_TERRAIN_URL = process.env.MCP_TERRAIN_FORGE_URL   ?? 'http://localhost:3004'

  const [database, redis, stripe, meshy, fal, mcp_asset_alchemist, mcp_city_architect, mcp_terrain_forge] =
    await Promise.all([
      checkDatabase(),
      checkRedis(),
      checkStripe(),
      checkMeshy(),
      checkFal(),
      checkMcp(MCP_ASSET_URL),
      checkMcp(MCP_CITY_URL),
      checkMcp(MCP_TERRAIN_URL),
    ])

  const checks: HealthChecks = {
    database,
    redis,
    stripe,
    meshy,
    fal,
    mcp_asset_alchemist,
    mcp_city_architect,
    mcp_terrain_forge,
  }

  const hasRequiredFailure = checks.database === 'error'
  const hasAnyFailure = Object.values(checks).some((s) => s === 'error')

  const detailedStatus: HealthResponse['status'] = hasRequiredFailure
    ? 'unhealthy'
    : hasAnyFailure
      ? 'degraded'
      : 'healthy'

  const httpStatus = detailedStatus === 'unhealthy' ? 503 : 200

  // ── Auth check — determines which response shape to return ─────────────────
  const authorized = await isAuthorized(req)

  if (!authorized) {
    // Public mode: minimal info — safe for uptime monitors
    const publicStatus: PublicHealthResponse['status'] =
      detailedStatus === 'healthy' ? 'ok' :
      detailedStatus === 'degraded' ? 'degraded' : 'down'

    const publicBody: PublicHealthResponse = { status: publicStatus, timestamp }

    return NextResponse.json(publicBody, {
      status: httpStatus,
      headers: { 'Cache-Control': 'no-store' },
    })
  }

  // Authenticated admin mode: full detail
  const body: HealthResponse = {
    status: detailedStatus,
    version: pkg.version,
    checks,
    timestamp,
  }

  return NextResponse.json(body, {
    status: httpStatus,
    headers: { 'Cache-Control': 'no-store' },
  })
}

// CORS preflight — Studio plugin sends OPTIONS before GET
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
