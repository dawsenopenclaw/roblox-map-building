/**
 * GET /api/studio/sessions
 *
 * Returns all currently live Studio sessions for the authenticated user.
 * Reads from both in-memory store and Redis to handle cross-Lambda visibility
 * on Vercel serverless.
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
  // listSessions() now merges L1 memory + Redis internally — no manual merge needed
  const sessions = await listSessions()

  // Sort by most recent heartbeat first
  sessions.sort((a, b) => b.lastHeartbeat - a.lastHeartbeat)

  return NextResponse.json(
    { sessions },
    { status: 200, headers: CORS_HEADERS },
  )
}
