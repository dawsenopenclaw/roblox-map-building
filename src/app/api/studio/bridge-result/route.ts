/**
 * /api/studio/bridge-result
 *
 * This route closes the hole that caused the `studio-controller` MCP server
 * (packages/mcp/studio-controller/src/tools.ts) to time out on every read-
 * path tool. The MCP queues a command via `/api/studio/execute` with a
 * `_requestId`, then polls GET `/api/studio/bridge-result?requestId=X` until
 * the plugin's response is available. The endpoint didn't exist — every
 * poll 404'd, the 20s deadline expired, and the tool returned a "queued"
 * placeholder for what the caller expected to be a real scene snapshot.
 *
 * Two paths:
 *
 *   GET ?requestId=<id>&resultType=<snapshot|screenshot|...>
 *     Tries two sources in order:
 *       1. Redis hot path — the plugin (future version) may POST structured
 *          results here, correlated by requestId. If we find one, return it.
 *       2. Session-scoped fallback — for `resultType=snapshot` read
 *          `session.latestState`, for `screenshot` read `session.latestScreenshot`
 *          + `latestScreenshotAt`. The current ForjeGames plugin (v4.5.x)
 *          pushes these continuously via /api/studio/{snapshot,screenshot}
 *          regardless of requestId, so the MCP read tools get real data
 *          without needing a plugin upgrade.
 *
 *   POST { requestId, resultType, data }
 *     Forward-compat: when the plugin is upgraded to correlate responses by
 *     requestId, it will POST them here. We store under
 *     `fj:studio:result:<sessionId>:<requestId>:<resultType>` in Redis with
 *     a 300s TTL (matches the POLL_TIMEOUT_MS * 15 safety margin on the MCP
 *     side, so a plugin that posts late still gets its data consumed).
 *
 * Auth: same JWT-over-Authorization-header pattern as /api/studio/execute
 * and /api/studio/sync — validated via the shared `getStudioAuthSecret`.
 * No new trust assumptions.
 *
 * Rate limit: shares `studioExecuteRateLimit` — the MCP already burns that
 * budget for the paired /execute call, so reads cost ~nothing extra.
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { z } from 'zod'
import { getSession } from '@/lib/studio-session'
import { studioExecuteRateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import { getStudioAuthSecret } from '@/lib/studio-auth-secret'
import { getRedis } from '@/lib/redis'
import { parseBody } from '@/lib/validations'

// ---------------------------------------------------------------------------
// JWT (duplicated from execute/sync — single source would be nicer but the
// shared helper doesn't exist yet and this is the third copy, not the first)
// ---------------------------------------------------------------------------

interface JwtPayload {
  sid: string
  pid: string
  pn:  string
  pv:  string
  iat: number
}

function verifyJwt(token: string): JwtPayload | null {
  try {
    const dot = token.lastIndexOf('.')
    if (dot < 1) return null
    const payloadB64 = token.slice(0, dot)
    const sig = token.slice(dot + 1)
    const expectedSig = crypto
      .createHmac('sha256', getStudioAuthSecret())
      .update(payloadB64)
      .digest('base64url')
    const sigBuf = Buffer.from(sig)
    const expBuf = Buffer.from(expectedSig)
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8')) as JwtPayload
    if (!payload.sid || !payload.pid) return null
    if (payload.iat && Date.now() - payload.iat > 30 * 24 * 60 * 60 * 1000) return null
    return payload
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Max age in ms for a session.latestState / latestScreenshot to count as
 *  "fresh enough" for a read. Older than this and we report not-ready so the
 *  MCP keeps polling (or eventually times out honestly). */
const FRESH_WINDOW_MS = 30_000

/** TTL for Redis-stored per-request results. Matches ~5x the MCP poll
 *  deadline — a plugin that posts late still gets consumed by a retry. */
const RESULT_TTL_SECONDS = 300

function resultKey(sessionId: string, requestId: string, resultType: string): string {
  return `fj:studio:result:${sessionId}:${requestId}:${resultType}`
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

// ---------------------------------------------------------------------------
// Auth helper — all three methods go through this
// ---------------------------------------------------------------------------

type AuthResult = { payload: JwtPayload } | { error: NextResponse }

function authenticate(req: NextRequest): AuthResult {
  const authHeader = req.headers.get('authorization') ?? ''
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!bearer) {
    return {
      error: NextResponse.json(
        { ok: false, error: 'missing_token' },
        { status: 401, headers: CORS_HEADERS },
      ),
    }
  }
  const payload = verifyJwt(bearer)
  if (!payload) {
    return {
      error: NextResponse.json(
        { ok: false, error: 'invalid_token' },
        { status: 401, headers: CORS_HEADERS },
      ),
    }
  }
  return { payload }
}

// ---------------------------------------------------------------------------
// GET — the MCP polls this waiting for plugin results
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const authed = authenticate(req)
  if ('error' in authed) return authed.error
  const { payload } = authed

  const rl = await studioExecuteRateLimit(payload.sid)
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: 'rate_limited' },
      { status: 429, headers: { ...CORS_HEADERS, ...rateLimitHeaders(rl) } },
    )
  }

  const url = req.nextUrl
  const requestId = url.searchParams.get('requestId') ?? ''
  const resultType = url.searchParams.get('resultType') ?? ''

  if (!requestId || !resultType) {
    return NextResponse.json(
      { ok: false, error: 'missing_requestId_or_resultType' },
      { status: 400, headers: CORS_HEADERS },
    )
  }

  // ── Hot path: Redis-stored per-request result (future plugin upgrade) ─
  try {
    const redis = getRedis()
    if (redis) {
      const raw = await redis.get(resultKey(payload.sid, requestId, resultType))
      if (raw) {
        // One-shot read: delete after consume so the MCP can't replay it.
        try { await redis.del(resultKey(payload.sid, requestId, resultType)) } catch { /* swallow */ }
        return NextResponse.json(
          { ok: true, ready: true, source: 'redis', data: JSON.parse(raw) },
          { headers: CORS_HEADERS },
        )
      }
    }
  } catch {
    // Redis not available — fall through to session fallback
  }

  // ── Fallback path: read the session state the current plugin already pushes ─
  const session = await getSession(payload.sid)
  if (!session) {
    return NextResponse.json(
      { ok: true, ready: false, note: 'session_not_found' },
      { headers: CORS_HEADERS },
    )
  }

  const now = Date.now()

  if (resultType === 'snapshot' || resultType === 'scene' || resultType === 'hierarchy' || resultType === 'properties') {
    // Any recent snapshot counts — the plugin pushes these every ~2s via sync context
    if (session.latestState && now - session.lastHeartbeat < FRESH_WINDOW_MS) {
      return NextResponse.json(
        { ok: true, ready: true, source: 'session.latestState', data: session.latestState },
        { headers: CORS_HEADERS },
      )
    }
    return NextResponse.json(
      { ok: true, ready: false, note: 'no_recent_snapshot' },
      { headers: CORS_HEADERS },
    )
  }

  if (resultType === 'screenshot') {
    if (
      session.latestScreenshot &&
      session.latestScreenshotAt &&
      now - session.latestScreenshotAt < FRESH_WINDOW_MS
    ) {
      return NextResponse.json(
        {
          ok: true,
          ready: true,
          source: 'session.latestScreenshot',
          data: { screenshot: session.latestScreenshot, capturedAt: session.latestScreenshotAt },
        },
        { headers: CORS_HEADERS },
      )
    }
    return NextResponse.json(
      { ok: true, ready: false, note: 'no_recent_screenshot' },
      { headers: CORS_HEADERS },
    )
  }

  if (resultType === 'camera') {
    if (session.camera && now - session.lastHeartbeat < FRESH_WINDOW_MS) {
      return NextResponse.json(
        { ok: true, ready: true, source: 'session.camera', data: session.camera },
        { headers: CORS_HEADERS },
      )
    }
    return NextResponse.json(
      { ok: true, ready: false, note: 'no_recent_camera' },
      { headers: CORS_HEADERS },
    )
  }

  // Types the current plugin doesn't volunteer — script source, output log,
  // instance properties. They need the plugin to POST a result correlated
  // by requestId. Until that ships, we report not-ready honestly so the
  // MCP surface degrades gracefully.
  return NextResponse.json(
    {
      ok: true,
      ready: false,
      note: `resultType_${resultType}_requires_plugin_upgrade`,
    },
    { headers: CORS_HEADERS },
  )
}

// ---------------------------------------------------------------------------
// POST — plugin (future version) uploads correlated result
// ---------------------------------------------------------------------------

const postSchema = z.object({
  requestId:  z.string().min(1).max(128),
  resultType: z.string().min(1).max(64),
  data:       z.unknown(),
})

export async function POST(req: NextRequest) {
  const authed = authenticate(req)
  if ('error' in authed) return authed.error
  const { payload } = authed

  const parsed = await parseBody(req, postSchema)
  if ('error' in parsed) {
    return NextResponse.json(
      { ok: false, error: parsed.error },
      { status: parsed.status, headers: CORS_HEADERS },
    )
  }

  const { requestId, resultType, data } = parsed.data

  // Best-effort Redis write. If Redis is down we can't correlate across
  // lambdas anyway — no-op and return ok so the plugin doesn't retry
  // forever on an inherently-local setup.
  try {
    const redis = getRedis()
    if (redis) {
      await redis.set(
        resultKey(payload.sid, requestId, resultType),
        JSON.stringify(data),
        'EX',
        RESULT_TTL_SECONDS,
      )
    }
  } catch {
    // Swallow — endpoint still returns ok so the plugin can move on
  }

  return NextResponse.json({ ok: true, stored: true }, { headers: CORS_HEADERS })
}
