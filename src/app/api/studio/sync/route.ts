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
import { drainCommands, getSession } from '@/lib/studio-session'

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

  const sessionId = searchParams.get('sessionId')
  const lastSyncRaw = searchParams.get('lastSync')

  if (!sessionId) {
    return NextResponse.json(
      { error: 'sessionId query param is required' },
      { status: 400, headers: CORS_HEADERS },
    )
  }

  const session = getSession(sessionId)
  if (!session) {
    // Session unknown or expired — tell the plugin to re-connect
    return NextResponse.json(
      { error: 'session_not_found', reconnect: true },
      { status: 404, headers: CORS_HEADERS },
    )
  }

  // Parse lastSync — default to 0 (return everything in queue)
  const lastSync = lastSyncRaw ? parseInt(lastSyncRaw, 10) : 0
  const since = Number.isFinite(lastSync) ? lastSync : 0

  // drainCommands returns null when rate-limited
  const commands = drainCommands(sessionId, since)
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
