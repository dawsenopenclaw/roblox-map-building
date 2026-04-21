/**
 * POST /api/studio/disconnect
 *
 * Explicitly ends a Studio session. Called by the web editor when the user
 * clicks disconnect. Clears the session from both L1 memory and Redis so
 * the next status poll sees it as gone — prevents "ghost session" where the
 * UI shows a stale active connection.
 *
 * Body: { sessionId: string }
 * Response: { ok: true } or { error: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { deleteSession } from '@/lib/studio-session'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { sessionId?: string }
    const sessionId = body?.sessionId

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400, headers: CORS_HEADERS },
      )
    }

    const deleted = await deleteSession(sessionId)

    return NextResponse.json(
      { ok: true, deleted },
      { status: 200, headers: CORS_HEADERS },
    )
  } catch (err) {
    console.error('[disconnect] Error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: CORS_HEADERS },
    )
  }
}
