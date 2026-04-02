/**
 * GET /api/studio/snapshot?sessionId=X  or  ?token=JWT
 * Returns the latest workspace snapshot for a session.
 *
 * POST /api/studio/scan?sessionId=X  or  ?token=JWT
 * Queues a scan_workspace command so the plugin captures a fresh snapshot.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession, getSessionByToken, queueCommand } from '@/lib/studio-session'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

async function resolveSession(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const sessionId = searchParams.get('sessionId')
  const token     = searchParams.get('token')

  if (sessionId) {
    return getSession(sessionId)
  }
  if (token) {
    return getSessionByToken(token)
  }
  return undefined
}

export async function GET(req: NextRequest) {
  const session = await resolveSession(req)

  if (!session) {
    return NextResponse.json(
      { error: 'session_not_found' },
      { status: 404, headers: CORS_HEADERS },
    )
  }

  const snapshot = (session.latestState?.worldSnapshot as Record<string, unknown> | undefined) ?? null
  const snapshotAt = (session.latestState?.snapshotAt as number | undefined) ?? null

  return NextResponse.json(
    {
      sessionId:   session.sessionId,
      connected:   session.connected,
      snapshot,
      snapshotAt,
      hasSnapshot: snapshot !== null,
    },
    { status: 200, headers: CORS_HEADERS },
  )
}

export async function POST(req: NextRequest) {
  const session = await resolveSession(req)

  if (!session) {
    return NextResponse.json(
      { error: 'session_not_found' },
      { status: 404, headers: CORS_HEADERS },
    )
  }

  if (!session.connected) {
    return NextResponse.json(
      { error: 'session_disconnected' },
      { status: 409, headers: CORS_HEADERS },
    )
  }

  const result = await queueCommand(session.sessionId, {
    type: 'scan_workspace',
    data: {},
  })

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: 409, headers: CORS_HEADERS },
    )
  }

  return NextResponse.json(
    { queued: true, commandId: result.commandId },
    { status: 202, headers: CORS_HEADERS },
  )
}
