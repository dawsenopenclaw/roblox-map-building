/**
 * GET /api/studio/status?sessionId=<id>&token=<tok>&pluginVer=<ver>
 *
 * Connection health check. Called by the web editor and plugin to determine
 * whether a Studio session is live.
 *
 * Resolution order:
 *  1. sessionId param → async getSession() (memory + Redis)
 *  2. token param / Authorization header → getSessionByToken() (memory)
 *  3. If token looks valid (≥32 chars) but no session found → auto-recreate
 *
 * Response:
 * {
 *   connected: boolean,
 *   lastHeartbeat: number | null,   // Unix ms
 *   placeId: string | null,
 *   placeName: string | null,
 *   pluginVersion: string | null,
 *   sessionId: string | null,
 *   queueDepth: number,
 *   serverTime: number,
 *   updateAvailable?: boolean,
 *   updateUrl?: string,
 *   reconnect?: boolean,            // true when re-auth is needed
 * }
 *
 * Returns 200 regardless of connection state so callers can always
 * read the response body without catching HTTP errors.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession, getSessionByToken, createSession, SESSION_TTL_MS } from '@/lib/studio-session'

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

  const pluginVer = searchParams.get('pluginVer') ?? req.headers.get('x-plugin-version') ?? ''

  // ── Resolve token (query param or Authorization header) ──────────────────
  let token = searchParams.get('token')
  if (!token) {
    const authHeader = req.headers.get('authorization') ?? ''
    if (authHeader.startsWith('Bearer ')) token = authHeader.slice(7)
  }

  // ── Resolve session: sessionId → async getSession (memory + Redis) ────────
  let sessionId = searchParams.get('sessionId')
  let session = sessionId ? await getSession(sessionId) : undefined

  // ── Fallback 1: look up by token in memory ────────────────────────────────
  if (!session && token) {
    session = getSessionByToken(token)
    if (session) sessionId = session.sessionId
  }

  // ── Fallback 2: token valid but session evicted — auto-recreate ───────────
  if (!session && token && token.length >= 32) {
    const newSession = createSession({
      placeId:       searchParams.get('placeId')   ?? 'unknown',
      placeName:     searchParams.get('placeName') ?? 'Reconnected Session',
      pluginVersion: pluginVer || '1.0.0',
      authToken:     token,
    })
    session   = newSession
    sessionId = newSession.sessionId
  }

  // ── No session at all — server-alive ping ────────────────────────────────
  if (!sessionId && !session) {
    return NextResponse.json(
      {
        connected:     false,
        lastHeartbeat: null,
        placeId:       null,
        placeName:     null,
        pluginVersion: null,
        sessionId:     null,
        queueDepth:    0,
        serverTime:    Date.now(),
        error:         'sessionId or token query param is required',
      },
      { status: 200, headers: CORS_HEADERS },
    )
  }

  // ── Session ID provided but genuinely not found anywhere ─────────────────
  if (!session) {
    return NextResponse.json(
      {
        connected:     false,
        lastHeartbeat: null,
        placeId:       null,
        placeName:     null,
        pluginVersion: null,
        sessionId,
        queueDepth:    0,
        serverTime:    Date.now(),
        reconnect:     true,
        message:       'Session expired. Re-enter your connection code.',
      },
      { status: 200, headers: CORS_HEADERS },
    )
  }

  const staleCutoff = Date.now() - SESSION_TTL_MS
  const connected   = session.lastHeartbeat > staleCutoff

  const body: Record<string, unknown> = {
    connected,
    lastHeartbeat: session.lastHeartbeat,
    secondsSinceHeartbeat: Math.floor((Date.now() - session.lastHeartbeat) / 1000),
    placeId:       session.placeId,
    placeName:     session.placeName,
    pluginVersion: session.pluginVersion,
    sessionId:     session.sessionId,
    queueDepth:    session.commandQueue.length,
    serverTime:    Date.now(),
    camera:        (session as Record<string, unknown>).camera ?? null,
    partCount:     (session as Record<string, unknown>).partCount ?? 0,
    modelCount:    (session as Record<string, unknown>).modelCount ?? 0,
    lightCount:    (session as Record<string, unknown>).lightCount ?? 0,
    nearbyParts:   (session as Record<string, unknown>).nearbyParts ?? [],
    selected:      (session as Record<string, unknown>).selected ?? [],
    sceneTree:     (session as Record<string, unknown>).sceneTree ?? [],
    groundY:       (session as Record<string, unknown>).groundY ?? 0,
  }

  if (pluginVer && isOutdated(pluginVer)) {
    body.updateAvailable = true
    body.updateUrl       = '/api/studio/plugin'
  }

  return NextResponse.json(body, { status: 200, headers: CORS_HEADERS })
}
