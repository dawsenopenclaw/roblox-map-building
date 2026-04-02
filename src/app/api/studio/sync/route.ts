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
import { drainCommands, getSession, getSessionByToken, createSession } from '@/lib/studio-session'

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
  const { searchParams } = req.nextUrl

  const lastSyncRaw = searchParams.get('lastSync')
  const pluginVer   = searchParams.get('pluginVer') ?? req.headers.get('x-plugin-version') ?? '0.0.0'

  // ── Resolve token (query param or Authorization header) ──────────────────
  let token = searchParams.get('token')
  if (!token) {
    const authHeader = req.headers.get('authorization') ?? ''
    if (authHeader.startsWith('Bearer ')) token = authHeader.slice(7)
  }

  // ── Resolve session: sessionId → async getSession (memory + Redis) ────────
  let sessionId = searchParams.get('sessionId') ?? req.headers.get('x-session-id')
  let session = sessionId ? await getSession(sessionId) : undefined

  // ── Fallback 1: look up by token in memory ────────────────────────────────
  if (!session && token) {
    session = getSessionByToken(token)
    if (session) sessionId = session.sessionId
  }

  // ── Fallback 2: token valid but not in memory — auto-recreate from cold start
  // This handles Vercel Lambda restarts that wipe the in-memory store.
  // Redis was checked inside getSession() already; if we're here it means
  // Redis also missed. We trust the token (≥32 hex chars) and recreate.
  if (!session && token && token.length >= 32) {
    const newSession = createSession({
      placeId:       searchParams.get('placeId')   ?? 'unknown',
      placeName:     searchParams.get('placeName') ?? 'Unknown Place',
      pluginVersion: pluginVer,
      authToken:     token,
    })
    session   = newSession
    sessionId = newSession.sessionId
  }

  // ── No session recoverable — tell plugin to re-auth ───────────────────────
  if (!sessionId || !session) {
    return NextResponse.json(
      {
        error:     'session_not_found',
        reconnect: true,
        message:   'Session expired. Re-enter your connection code.',
      },
      { status: 404, headers: CORS_HEADERS },
    )
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
      { error: 'rate_limited', retryAfterMs: 1000 },
      { status: 429, headers: CORS_HEADERS },
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
