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
import { createSession, getSession, getSessionByToken } from '@/lib/studio-session'
import { studioConnectSchema, parseBody } from '@/lib/validations'

interface ConnectBody {
  /** Auth token — must match STUDIO_PLUGIN_SECRET env var */
  token: string
  placeId: string
  placeName?: string
  pluginVersion?: string
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

/**
 * Extract the sessionId (sid) claim from a JWT without full signature verification.
 * Used only to look up / pin the session — the JWT is fully verified by the
 * auth/route.ts and sync/route.ts before any privileged action is taken.
 */
function extractSessionIdFromJwt(token: string): string | null {
  try {
    const dot = token.lastIndexOf('.')
    if (dot < 1) return null
    const payloadB64 = token.slice(0, dot)
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8')) as { sid?: string }
    return payload.sid ?? null
  } catch {
    return null
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(req: NextRequest) {
  const parsedBody = await parseBody(req, studioConnectSchema)
  if (!parsedBody.ok) {
    return NextResponse.json({ error: parsedBody.error }, { status: parsedBody.status, headers: CORS_HEADERS })
  }
  const body = parsedBody.data

  // Token validation — accept either a static env secret OR a valid session JWT.
  // The plugin sends its auth token (from code exchange) in body.token.
  const secret = process.env.STUDIO_PLUGIN_SECRET
  let existingSession = undefined

  if (secret && body.token !== secret) {
    // Not the static secret — try memory lookup first (fast path)
    existingSession = getSessionByToken(body.token)

    if (!existingSession) {
      // Memory miss — try to reconstruct from JWT (cross-Lambda / cold-start safe)
      try {
        const jwtSessionId = extractSessionIdFromJwt(body.token)
        if (jwtSessionId) {
          existingSession = await getSession(jwtSessionId)
        }
      } catch { /* invalid JWT — handled below */ }
    }

    if (!existingSession) {
      // Check whether the token looks like a valid JWT before rejecting.
      // If it's a JWT (two dots), the session simply doesn't exist yet on this
      // Lambda — recreate it. If it's not a JWT and not the static secret, reject.
      const isJwtShape = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(body.token)
      if (!isJwtShape) {
        return NextResponse.json(
          { error: 'invalid_token' },
          { status: 401, headers: CORS_HEADERS },
        )
      }
      // JWT-shaped token but session not found anywhere — will be created below
      // with the JWT's embedded sessionId so the plugin's stored ID stays valid.
    }
  }

  // If an existing session was found by token, reuse it (touch heartbeat) instead
  // of creating a duplicate. Previously a new session was always created here,
  // which orphaned the old session along with any queued commands.
  //
  // For JWT tokens where the session doesn't exist yet (cold Lambda), extract the
  // sessionId from the JWT so the newly created session uses the same ID the
  // plugin already has stored — prevents the plugin from having a stale sessionId.
  let jwtPinnedId: string | undefined
  if (!existingSession && secret && body.token !== secret) {
    jwtPinnedId = extractSessionIdFromJwt(body.token) ?? undefined
  }

  const session = existingSession ?? createSession({
    sessionId: jwtPinnedId,
    placeId: String(body.placeId),
    placeName: body.placeName ?? 'Unknown Place',
    pluginVersion: body.pluginVersion ?? '0.0.0',
    authToken: body.token,
  })
  if (existingSession) {
    // Refresh heartbeat so the reconnect is reflected immediately
    existingSession.lastHeartbeat  = Date.now()
    existingSession.connected      = true
    existingSession.pluginVersion  = body.pluginVersion ?? existingSession.pluginVersion
  }

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
