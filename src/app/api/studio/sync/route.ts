/**
 * GET /api/studio/sync?sessionId=<id>&lastSync=<timestamp>
 *
 * Polled by the Studio plugin on a 1-second interval to receive pending
 * commands from the web editor. Each poll:
 *  1. Validates the session
 *  2. Drains commands enqueued since `lastSync`
 *  3. Returns the commands along with server time and a heartbeat flag
 *
 * Response shape:
 * {
 *   serverTime: number,          // Unix ms — plugin should store as next lastSync
 *   heartbeat: true,             // always true while session is live
 *   changes: [
 *     { id, type, data, timestamp }
 *   ]
 * }
 *
 * Rate limit: max 1 poll per second per session (enforced in drainCommands).
 * Returns 429 when polled too fast.
 */

import { NextRequest, NextResponse } from 'next/server'
import { drainCommands, getSession, getSessionByToken } from '@/lib/studio-session'

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

  if (!sessionId || !session) {
    return NextResponse.json(
      { error: 'session_not_found', reconnect: true },
      { status: 404, headers: CORS_HEADERS },
    )
  }

  // Parse lastSync — default to 0 (return everything in queue)
  const lastSync = lastSyncRaw ? parseInt(lastSyncRaw, 10) : 0
  const since = Number.isFinite(lastSync) ? lastSync : 0

  // drainCommands returns null when rate-limited
  const commands = await drainCommands(sessionId, since)
  if (commands === null) {
    return NextResponse.json(
      { error: 'rate_limited', retryAfterMs: 1000 },
      { status: 429, headers: CORS_HEADERS },
    )
  }

  return NextResponse.json(
    {
      serverTime: Date.now(),
      heartbeat: true,
      sessionId,
      placeId: session.placeId,
      changes: commands,
    },
    { status: 200, headers: CORS_HEADERS },
  )
}
