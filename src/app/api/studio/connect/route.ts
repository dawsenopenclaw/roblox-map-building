/**
 * POST /api/studio/connect
 *
 * Plugin connection handshake. The Studio plugin calls this once on startup
 * (or reconnect) to establish a session. Returns a sessionId the plugin must
 * include in all subsequent requests.
 *
 * Body: { token, placeId, placeName, pluginVersion }
 * Response: { sessionId, pollInterval, features }
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createSession, getSession } from '@/lib/studio-session'
import { studioConnectSchema, parseBody } from '@/lib/validations'
import { trackConnect } from '@/lib/studio-analytics'
import { getStudioAuthSecret } from '@/lib/studio-auth-secret'
import * as Sentry from '@sentry/nextjs'

interface JwtPayload {
  sid: string   // sessionId
  pid: string   // placeId
  pn:  string   // placeName
  pv:  string   // pluginVersion
  iat: number   // issued-at (ms)
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

/**
 * Verify a JWT-style token produced by the auth/claim endpoint.
 * Returns the decoded payload on success, null on any failure.
 * Same logic as sync/route.ts — both routes MUST agree on verification.
 */
function verifyJwt(token: string): JwtPayload | null {
  try {
    const dot = token.lastIndexOf('.')
    if (dot < 1) return null
    const payloadB64 = token.slice(0, dot)
    const sig = token.slice(dot + 1)

    // Verify HMAC — use timingSafeEqual to prevent timing-based side-channel attacks
    const expectedSig = crypto
      .createHmac('sha256', getStudioAuthSecret())
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

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(req: NextRequest) {
  try {
    return await handleConnect(req)
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'studio/connect' } })
    return NextResponse.json({ error: 'internal' }, { status: 500, headers: CORS_HEADERS })
  }
}

async function handleConnect(req: NextRequest) {
  const parsedBody = await parseBody(req, studioConnectSchema)
  if (!parsedBody.ok) {
    return NextResponse.json({ error: parsedBody.error }, { status: parsedBody.status, headers: CORS_HEADERS })
  }
  const body = parsedBody.data

  // ── Verify JWT signature ────────────────────────────────────────────────
  // The plugin sends the JWT it received from auth/claim. We MUST verify
  // the HMAC signature using the same secret that auth used to sign it.
  // Previously this route only checked JWT shape (regex) which meant ANY
  // payload.signature string was accepted — sync then rejected it, so
  // commands never reached Studio.
  const jwtPayload = verifyJwt(body.token)
  if (!jwtPayload) {
    return NextResponse.json(
      { error: 'invalid_token', message: 'Invalid or expired token. Re-enter your connection code at forjegames.com/editor' },
      { status: 401, headers: CORS_HEADERS },
    )
  }

  const pluginVersion = body.pluginVersion ?? '0.0.0'

  // ── Resolve or create session ───────────────────────────────────────────
  // Try to find an existing session by the JWT's embedded sessionId.
  // If not found (TTL expired, cold Lambda), recreate it from the JWT
  // payload — same pattern as sync/route.ts.
  let session = await getSession(jwtPayload.sid)

  if (session) {
    // Refresh heartbeat so the reconnect is reflected immediately
    session.lastHeartbeat  = Date.now()
    session.connected      = true
    session.pluginVersion  = pluginVersion
  } else {
    // Recreate session from the self-contained JWT payload
    session = createSession({
      sessionId:     jwtPayload.sid,
      placeId:       jwtPayload.pid,
      placeName:     jwtPayload.pn || body.placeName || 'Unknown Place',
      pluginVersion,
      authToken:     body.token,
    })
  }

  // Persist to Postgres so the chat Lambda can find this session
  // even when Redis is down (Upstash quota exhausted).
  try {
    const { pgUpsertSession } = await import('@/lib/studio-queue-pg')
    await pgUpsertSession({
      sessionId:     jwtPayload.sid,
      placeId:       jwtPayload.pid,
      placeName:     jwtPayload.pn || body.placeName || 'Unknown Place',
      pluginVersion,
    })
  } catch { /* Postgres write failed — non-critical */ }

  // Track connection analytics (fire-and-forget)
  trackConnect(pluginVersion)

  return NextResponse.json(
    {
      sessionId: session.sessionId,
      /** How often the plugin should poll /api/studio/sync in milliseconds */
      pollInterval: 1000,
      /** Feature flags the plugin can use to gate behaviour */
      features: {
        executeCode: true,
        insertModel: true,
        deleteModel: true,
        updateProperty: true,
        insertAsset: true,
        screenshotRelay: true,
      },
      serverTime: Date.now(),
    },
    { status: 200, headers: CORS_HEADERS },
  )
}
