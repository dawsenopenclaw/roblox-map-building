/**
 * GET /api/health
 *
 * System health check endpoint. Used by:
 *   - Studio plugin to detect if the local dev server is running
 *   - Uptime monitors (Better Uptime, etc.)
 *   - Vercel / Fly.io health probe
 *
 * Response shape:
 *   { status, version, checks: { ... }, timestamp }
 *
 * Each check returns "ok" | "degraded" | "error" | "unconfigured".
 * The top-level `status` is "healthy" if all required checks pass,
 * "degraded" if optional checks fail, "unhealthy" if required checks fail.
 */
import { NextResponse } from 'next/server'
import pkg from '../../../../package.json'

// ── Types ────────────────────────────────────────────────────────────────────

type CheckStatus = 'ok' | 'degraded' | 'error' | 'unconfigured'

interface HealthChecks {
  database: CheckStatus
  redis: CheckStatus
  meshy: CheckStatus
  fal: CheckStatus
  mcp_asset_alchemist: CheckStatus
  mcp_city_architect: CheckStatus
  mcp_terrain_forge: CheckStatus
  studio_sessions: number
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  version: string
  checks: HealthChecks
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
    const res = await fetchWithTimeout('https://api.meshy.ai/v2/text-to-3d?page_size=1')
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

function getStudioSessions(): number {
  // Wire up to your session registry (Redis set / DB) when built.
  return 0
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET() {
  const MCP_ASSET_URL   = process.env.MCP_ASSET_ALCHEMIST_URL ?? 'http://localhost:3002'
  const MCP_CITY_URL    = process.env.MCP_CITY_ARCHITECT_URL  ?? 'http://localhost:3003'
  const MCP_TERRAIN_URL = process.env.MCP_TERRAIN_FORGE_URL   ?? 'http://localhost:3004'

  // Run all checks concurrently — none block each other
  const [database, redis, meshy, fal, mcp_asset_alchemist, mcp_city_architect, mcp_terrain_forge] =
    await Promise.all([
      checkDatabase(),
      checkRedis(),
      checkMeshy(),
      checkFal(),
      checkMcp(MCP_ASSET_URL),
      checkMcp(MCP_CITY_URL),
      checkMcp(MCP_TERRAIN_URL),
    ])

  const checks: HealthChecks = {
    database,
    redis,
    meshy,
    fal,
    mcp_asset_alchemist,
    mcp_city_architect,
    mcp_terrain_forge,
    studio_sessions: getStudioSessions(),
  }

  const requiredChecks: CheckStatus[] = [checks.database]
  const hasRequiredFailure = requiredChecks.some((s) => s === 'error')
  const hasAnyFailure = (Object.values(checks) as (CheckStatus | number)[])
    .some((s) => s === 'error')

  const status: HealthResponse['status'] = hasRequiredFailure
    ? 'unhealthy'
    : hasAnyFailure
      ? 'degraded'
      : 'healthy'

  const body: HealthResponse = {
    status,
    version: pkg.version,
    checks,
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(body, {
    status: status === 'unhealthy' ? 503 : 200,
    headers: {
      // Allow Studio plugin (any origin) and desktop Electron app
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    },
  })
}

// CORS preflight — Studio plugin sends OPTIONS before GET
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
