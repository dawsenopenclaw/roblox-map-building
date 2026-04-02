/**
 * GET /api/studio/status?sessionId=<id>
 *
 * Connection health check. Called by the web editor (and optionally the plugin)
 * to determine whether a Studio session is live.
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
 * }
 *
 * Returns 200 regardless of connection state so the web editor can always
 * read the response body without catching HTTP errors.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession, getSessionByToken, SESSION_TTL_MS } from '@/lib/studio-session'

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

  // Resolve session: prefer sessionId param, fall back to token param
  let sessionId = searchParams.get('sessionId')
  let session = sessionId ? await getSession(sessionId) : undefined

  if (!session) {
    const token = searchParams.get('token')
    if (token) {
      session = getSessionByToken(token)
      if (session) {
        sessionId = session.sessionId
      }
    }
  }

  if (!sessionId && !session) {
    // No session specified — return a simple server-alive ping
    return NextResponse.json(
      {
        connected: false,
        lastHeartbeat: null,
        placeId: null,
        placeName: null,
        pluginVersion: null,
        sessionId: null,
        queueDepth: 0,
        serverTime: Date.now(),
        error: 'sessionId query param is required',
      },
      { status: 200, headers: CORS_HEADERS },
    )
  }

  if (!session) {
    return NextResponse.json(
      {
        connected: false,
        lastHeartbeat: null,
        placeId: null,
        placeName: null,
        pluginVersion: null,
        sessionId,
        queueDepth: 0,
        serverTime: Date.now(),
        reconnect: true,
      },
      { status: 200, headers: CORS_HEADERS },
    )
  }

  const staleCutoff = Date.now() - SESSION_TTL_MS
  const connected = session.lastHeartbeat > staleCutoff

  return NextResponse.json(
    {
      connected,
      lastHeartbeat: session.lastHeartbeat,
      /** Seconds since last heartbeat — useful for UI indicators */
      secondsSinceHeartbeat: Math.floor(
        (Date.now() - session.lastHeartbeat) / 1000,
      ),
      placeId: session.placeId,
      placeName: session.placeName,
      pluginVersion: session.pluginVersion,
      sessionId: session.sessionId,
      queueDepth: session.commandQueue.length,
      serverTime: Date.now(),
    },
    { status: 200, headers: CORS_HEADERS },
  )
}
