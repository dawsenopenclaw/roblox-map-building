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
import { studioSyncRateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import { getRedis } from '@/lib/redis'
import { trackCommand } from '@/lib/studio-analytics'

// ── JWT helpers (mirrors auth/route.ts) ───────────────────────────────────────
// STUDIO_AUTH_SECRET must be set in .env. If missing, a per-process random
// secret is generated — tokens issued in a previous process will be invalid
// after a restart, which is the safe failure mode.
const SECRET: string = (() => {
  const s = process.env.STUDIO_AUTH_SECRET
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

    // Verify HMAC — use timingSafeEqual to prevent timing-based side-channel attacks
    const expectedSig = crypto
      .createHmac('sha256', SECRET)
      .update(payloadB64)
      .digest('base64url')
    const sigBuf = Buffer.from(sig)
    const expBuf = Buffer.from(expectedSig)
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8')) as JwtPayload
    if (!payload.sid || !payload.pid) return null
    // Reject tokens older than 30 days
    if (payload.iat && Date.now() - payload.iat > 30 * 24 * 60 * 60 * 1000) return null
    return payload
  } catch {
    return null
  }
}

/** Fallback manifest when Redis has no stored version yet. */
const DEFAULT_MANIFEST = {
  version:     '4.5.0',
  minVersion:  '4.0.0',
  downloadUrl: '/api/studio/plugin',
  changelog:   'Auto-update pipeline, version manifest endpoint, force-update support.',
  forceUpdate: false,
}

const MANIFEST_REDIS_KEY = 'fj:studio:plugin:version'
let _manifestCache: { data: typeof DEFAULT_MANIFEST; expiresAt: number } | null = null

async function getPluginManifest(): Promise<typeof DEFAULT_MANIFEST> {
  if (_manifestCache && _manifestCache.expiresAt > Date.now()) return _manifestCache.data
  try {
    const r = getRedis()
    if (r) {
      const raw = await r.get(MANIFEST_REDIS_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as typeof DEFAULT_MANIFEST
        _manifestCache = { data: parsed, expiresAt: Date.now() + 300_000 }
        return parsed
      }
    }
  } catch { /* Redis unavailable — use defaults */ }
  _manifestCache = { data: DEFAULT_MANIFEST, expiresAt: Date.now() + 300_000 }
  return DEFAULT_MANIFEST
}

function semverLt(a: string, b: string): boolean {
  try {
    const [aMaj, aMin, aPat] = a.split('.').map(Number)
    const [bMaj, bMin, bPat] = b.split('.').map(Number)
    if (aMaj !== bMaj) return aMaj < bMaj
    if (aMin !== bMin) return aMin < bMin
    return aPat < bPat
  } catch { return false }
}

function isOutdated(pluginVer: string, manifest: typeof DEFAULT_MANIFEST): boolean {
  return semverLt(pluginVer, manifest.minVersion)
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

  // ── Path 2: Legacy plain-token lookup — L1 then Redis (older plugin versions)
  if (!session && token) {
    const byToken = await getSessionByToken(token)
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

  // ── HTTP-boundary rate limit (120 req/60 s per session) ──────────────────
  // drainCommands enforces MIN_POLL_INTERVAL_MS internally; this is a coarse
  // guard against reconnect storms and misbehaving plugin versions.
  const rl = await studioSyncRateLimit(sessionId)
  if (!rl.allowed) {
    return NextResponse.json(
      { serverTime: Date.now(), heartbeat: true, changes: [], rateLimited: true, retryAfterMs: 1000 },
      { status: 429, headers: { ...CORS_HEADERS, ...rateLimitHeaders(rl) } },
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

  // ── Version check (Redis-backed manifest, 5-min cache) ───────────────────
  const manifest    = await getPluginManifest()
  const needsUpdate = isOutdated(pluginVer, manifest)
  const forceUpdate = semverLt(pluginVer, manifest.minVersion)

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

  // Track each delivered command by type (fire-and-forget)
  if (commands.length > 0) {
    console.log('[studio/sync] Delivering', commands.length, 'commands to session:', sessionId, 'types:', commands.map(c => c.type).join(','))
  }
  for (const cmd of commands) {
    trackCommand(cmd.type)
  }

  const serverTime = Date.now()
  const body: Record<string, unknown> = {
    serverTime,
    heartbeat:  true,
    sessionId,
    placeId:    session.placeId,
    changes:    commands,
  }

  // Store plugin version on the session for analytics
  if (session && pluginVer && pluginVer !== '0.0.0') {
    session.pluginVersion = pluginVer
  }

  if (needsUpdate) {
    const absDownloadUrl = manifest.downloadUrl.startsWith('http')
      ? manifest.downloadUrl
      : `${req.nextUrl.origin}${manifest.downloadUrl}`

    body.updateAvailable = true
    body.latestVersion   = manifest.version
    body.updateUrl       = absDownloadUrl
    body.downloadUrl     = absDownloadUrl
    body.changelog       = manifest.changelog
    body.forceUpdate     = forceUpdate

    if (forceUpdate) {
      body.deprecationWarning =
        `Plugin v${pluginVer} is no longer supported (min: ${manifest.minVersion}). ` +
        `Please update to v${manifest.version} to continue using ForjeGames.`
    }
  }

  // Return 304 Not Modified when there are no new commands and the client has
  // an up-to-date ETag. This cuts response body bandwidth by ~90% on idle
  // sessions, which is the dominant case at scale (thousands of plugins polling
  // every 1-2 s with nothing queued).
  if (commands.length === 0 && !needsUpdate) {
    // ETag encodes the queue-empty state for this session at this poll interval.
    // We use a coarse 2-second bucket so back-to-back polls that both see an
    // empty queue share the same ETag and yield a 304 on the second call.
    const etagBucket = Math.floor(serverTime / 2000)
    const etag = `"empty-${sessionId}-${etagBucket}"`
    const ifNoneMatch = req.headers.get('if-none-match')
    if (ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: { ...CORS_HEADERS, ETag: etag },
      })
    }
    return NextResponse.json(body, {
      status: 200,
      headers: { ...CORS_HEADERS, ETag: etag },
    })
  }

  return NextResponse.json(body, { status: 200, headers: CORS_HEADERS })
}
