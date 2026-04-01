/**
 * GET /api/studio/sessions
 *
 * Returns all currently live Studio sessions.  In a multi-user deployment
 * you would filter by the authenticated user's userId; here we return all
 * sessions in the in-memory store (single-server, single-user architecture).
 *
 * Response:
 * {
 *   sessions: Array<{
 *     sessionId:    string
 *     placeName:    string
 *     placeId:      string
 *     connected:    boolean
 *     pluginVersion: string
 *     lastHeartbeat: number   // Unix ms
 *     queueDepth:   number
 *   }>
 * }
 */

import { NextResponse } from 'next/server'
import { listSessions } from '@/lib/studio-session'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function GET() {
  const sessions = listSessions()

  return NextResponse.json(
    { sessions },
    { status: 200, headers: CORS_HEADERS },
  )
}
