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
import { createSession } from '@/lib/studio-session'

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
  let body: ConnectBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'invalid_json' },
      { status: 400, headers: CORS_HEADERS },
    )
  }

  // Validate required fields
  if (!body.token || !body.placeId) {
    return NextResponse.json(
      { error: 'token and placeId are required' },
      { status: 400, headers: CORS_HEADERS },
    )
  }

  // Token validation — compare against env secret (or allow any non-empty token
  // in development when STUDIO_PLUGIN_SECRET is not set)
  const secret = process.env.STUDIO_PLUGIN_SECRET
  if (secret && body.token !== secret) {
    return NextResponse.json(
      { error: 'invalid_token' },
      { status: 401, headers: CORS_HEADERS },
    )
  }

  const session = createSession({
    placeId: String(body.placeId),
    placeName: body.placeName ?? 'Unknown Place',
    pluginVersion: body.pluginVersion ?? '0.0.0',
    authToken: body.token,
  })

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
