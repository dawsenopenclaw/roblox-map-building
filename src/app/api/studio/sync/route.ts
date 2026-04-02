/**
 * GET /api/studio/sync?sessionId=<id>&token=<tok>&pluginVer=<ver>&lastSync=<timestamp>
 *
 * Polled by the Studio plugin on a 1-second interval to receive pending
 * commands from the web editor. Each poll:
 *  1. Validates the session (memory → Redis → auto-recreate from token)
 *  2. Checks plugin version against MINIMUM_PLUGIN_VERSION
 *  3. Drains commands enqueued since `lastSync`
 *  4. Returns commands + server time + optional updateAvailable flag
 *
 * Response shape:
 * {
 *   serverTime: number,          // Unix ms — plugin should store as next lastSync
 *   heartbeat: true,             // always true while session is live
 *   sessionId: string,
 *   changes: [...],
 *   updateAvailable?: true,      // present when plugin is outdated
 *   updateUrl?: string,          // download URL for the latest plugin
 *   reconnect?: true,            // present when session cannot be recovered — re-auth required
 * }
 *
 * Rate limit: max 1 poll per second per session (enforced in drainCommands).
 * Returns 429 when polled too fast.
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { drainCommands, getSession, getSessionByToken, createSession } from '@/lib/studio-session'

// ── JWT helpers (mirrors auth/route.ts) ───────────────────────────────────────
// STUDIO_AUTH_SECRET must be set in .env. If missing, a per-process random
// secret is generated — tokens issued in a previous process will be invalid
// after a restart, which is the safe failure mode.
const SECRET: string = (() => {
  const s = process.env.STUDIO_AUTH_SECRET ?? process.env.CLERK_SECRET_KEY
  if (!s) {
    const fallback = crypto.randomBytes(32).toString('hex')
    console.warn('[studio/sync] WARNING: STUDIO_AUTH_SECRET is not set. Using a per-process random secret — any tokens from a previous process will be rejected. Set STUDIO_AUTH_SECRET in your environment.')
    return fallback
  }
  return s
})()

interface JwtPayload {
  sid: string   // sessionId
  pid: string   // placeId
  pn:  string   // placeName
  pv:  string   // pluginVersion
  iat: number   // issued-at (ms)
}

/**
 * Verify a JWT-style token produced by the auth/claim endpoint.
 * Returns the decoded payload on success, null on any failure.
 */
function verifyJwt(token: string): JwtPayload | null {
  try {
    const dot = token.lastIndexOf('.')
    if (dot < 1) return null
    const payloadB64 = token.slice(0, dot)
    const sig = token.slice(dot + 1)

    // Verify HMAC
    const expectedSig = crypto
      .createHmac('sha256', SECRET)
      .update(payloadB64)
      .digest('base64url')
    if (sig !== expectedSig) return null

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8')) as JwtPayload
    if (!payload.sid || !payload.pid) return null
    return payload
  } catch {
    return null
  }
}

/** Minimum plugin version the server accepts without flagging an update. */
const MINIMUM_PLUGIN_VERSION = '4.0.0'

function isOutdated(pluginVer: string): boolean {
  try {
    const [pMaj, pMin, pPatch] = pluginVer.split('.').map(Number)
    const [mMaj, mMin, mPatch] = MINIMUM_PLUGIN_VERSION.split('.').map(Number)
    if (pMaj !== mMaj) return pMaj < mMaj
    if (pMin !== mMin) return pMin < mMin
    return pPatch < mPatch
  } catch {
    return false
  }
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function GET(req: NextRequest) {
  try { return await handleSync(req) } catch (err) {
    // NEVER return 500 with empty body — plugin can't parse it
    return NextResponse.json(
      { serverTime: Date.now(), heartbeat: false, changes: [], error: 'internal', message: String(err) },
      { status: 200, headers: CORS_HEADERS },
    )
  }
}

async function handleSync(req: NextRequest) {
  const { searchParams } = req.nextUrl

  const lastSyncRaw = searchParams.get('lastSync')
  const pluginVer   = searchParams.get('pluginVer') ?? req.headers.get('x-plugin-version') ?? '0.0.0'

  // ── Resolve token (query param or Authorization header) ──────────────────
  let token = searchParams.get('token')
  if (!token) {
    const authHeader = req.headers.get('authorization') ?? ''
    if (authHeader.startsWith('Bearer ')) token = authHeader.slice(7)
  }

  // ── Resolve session ───────────────────────────────────────────────────────
  // Priority order:
  //   1. JWT token (stateless — every Lambda can verify independently)
  //   2. sessionId param + memory/Redis lookup
  //   3. Legacy plain-token memory lookup (backwards compat)

  let sessionId = searchParams.get('sessionId') ?? req.headers.get('x-session-id')
  let session = sessionId ? await getSession(sessionId) : undefined

  // ── Path 1: JWT — stateless, works on any Lambda invocation ──────────────
  if (!session && token) {
    const jwtPayload = verifyJwt(token)
    if (jwtPayload) {
      sessionId = jwtPayload.sid
      // Try memory/Redis first (cheap)
      session = await getSession(sessionId)
      // Not there? Recreate from the self-contained JWT payload.
      // This is the key fix: no shared state needed between Lambdas.
      if (!session) {
        session = createSession({
          sessionId:     jwtPayload.sid,
          placeId:       jwtPayload.pid,
          placeName:     jwtPayload.pn,
          pluginVersion: jwtPayload.pv || pluginVer,
          authToken:     token,
        })
        sessionId = jwtPayload.sid
      }
    }
  }

  // ── Path 2: Legacy plain-token memory lookup (older plugin versions) ──────
  if (!session && token) {
    const byToken = getSessionByToken(token)
    if (byToken) {
      session = byToken
      sessionId = byToken.sessionId
    }
  }

  // ── No session recoverable — tell plugin to re-auth ───────────────────────
  if (!sessionId || !session) {
    return NextResponse.json(
      {
        error:     'session_not_found',
        reconnect: true,
        message:   'Session expired. Re-enter your connection code.',
      },
      { status: 200, headers: CORS_HEADERS },
    )
  }

  // ── Capture camera data from plugin ──────────────────────────────────────
  const camX = searchParams.get('camX')
  if (camX && session) {
    session.camera = {
      posX: parseFloat(camX) || 0,
      posY: parseFloat(searchParams.get('camY') ?? '0') || 0,
      posZ: parseFloat(searchParams.get('camZ') ?? '0') || 0,
      lookX: parseFloat(searchParams.get('lookX') ?? '0') || 0,
      lookY: parseFloat(searchParams.get('lookY') ?? '0') || 0,
      lookZ: parseFloat(searchParams.get('lookZ') ?? '0') || 0,
    }
  }

  // ── Version check ─────────────────────────────────────────────────────────
  const needsUpdate = isOutdated(pluginVer)

  // ── Parse lastSync — default to 0 (return everything in queue) ────────────
  const lastSync = lastSyncRaw ? parseInt(lastSyncRaw, 10) : 0
  const since    = Number.isFinite(lastSync) ? lastSync : 0

  // ── drainCommands returns null when rate-limited ───────────────────────────
  const commands = await drainCommands(sessionId, since)
  if (commands === null) {
    return NextResponse.json(
      { serverTime: Date.now(), heartbeat: true, changes: [], rateLimited: true, retryAfterMs: 1000 },
      { status: 200, headers: CORS_HEADERS },
    )
  }

  const body: Record<string, unknown> = {
    serverTime: Date.now(),
    heartbeat:  true,
    sessionId,
    placeId:    session.placeId,
    changes:    commands,
  }

  if (needsUpdate) {
    body.updateAvailable = true
    body.updateUrl       = '/api/studio/plugin'
  }

  return NextResponse.json(body, { status: 200, headers: CORS_HEADERS })
}
