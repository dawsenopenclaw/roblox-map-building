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
import { createSession, getSessionByToken } from '@/lib/studio-session'
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

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(req: NextRequest) {
  const parsedBody = await parseBody(req, studioConnectSchema)
  if (!parsedBody.ok) {
    return NextResponse.json({ error: parsedBody.error }, { status: parsedBody.status, headers: CORS_HEADERS })
  }
  const body = parsedBody.data

  // Token validation — accept either a static env secret OR a valid session auth token.
  // The plugin sends its auth token (from code exchange) in body.token.
  const secret = process.env.STUDIO_PLUGIN_SECRET
  let existingSession = undefined
  if (secret && body.token !== secret) {
    // Not the static secret — check if it's a valid session auth token
    existingSession = getSessionByToken(body.token)
    if (!existingSession) {
      return NextResponse.json(
        { error: 'invalid_token' },
        { status: 401, headers: CORS_HEADERS },
      )
    }
  }

  // If an existing session was found by token, reuse it (touch heartbeat) instead
  // of creating a duplicate. Previously a new session was always created here,
  // which orphaned the old session along with any queued commands.
  const session = existingSession ?? createSession({
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
