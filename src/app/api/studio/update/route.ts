/**
 * POST /api/studio/update
 *
 * Receives state updates pushed by the Studio plugin after it executes
 * commands or detects local changes (e.g. part moved in Studio).
 *
 * Body: {
 *   sessionId: string,
 *   timestamp: number,         // Unix ms when the update was generated in Studio
 *   changes: Change[],         // Array of changes the plugin is reporting
 *   source: 'plugin' | 'user', // Who triggered the change
 *   placeId: string,
 *   jobId?: string,            // Roblox job/server ID (optional)
 * }
 *
 * Response: { received: true, serverTime: number }
 *
 * The latest state snapshot is stored on the session object so the web editor
 * can request it on demand. Future iterations can forward via WebSocket/SSE.
 */

import { NextRequest, NextResponse } from 'next/server'
import { updateSessionState } from '@/lib/studio-session'
import { studioUpdateSchema, parseBody } from '@/lib/validations'

interface PluginChange {
  type: string
  data: Record<string, unknown>
  timestamp?: number
}

interface UpdateBody {
  sessionId: string
  timestamp?: number
  changes?: PluginChange[]
  source?: string
  placeId?: string
  jobId?: string
  /** Heartbeat-only pings (no changes) use event: "heartbeat" */
  event?: string
  /** Legacy: some plugin versions send sessionToken instead of sessionId */
  sessionToken?: string
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
  const parsedBody = await parseBody(req, studioUpdateSchema)
  if (!parsedBody.ok) {
    return NextResponse.json({ error: parsedBody.error }, { status: parsedBody.status, headers: CORS_HEADERS })
  }
  const rawBody = parsedBody.data

  // Support legacy plugin versions that send sessionToken instead of sessionId
  const sessionId = rawBody.sessionId ?? rawBody.sessionToken
  if (!sessionId) {
    return NextResponse.json(
      { error: 'sessionId is required' },
      { status: 400, headers: CORS_HEADERS },
    )
  }
  const body: UpdateBody = { ...rawBody, sessionId, changes: rawBody.changes ?? [] }

  // Store the latest state snapshot on the session
  const statePayload: Record<string, unknown> = {
    timestamp: body.timestamp ?? Date.now(),
    changes: body.changes,
    source: body.source ?? 'plugin',
    placeId: body.placeId,
    jobId: body.jobId ?? null,
    receivedAt: Date.now(),
  }

  const session = updateSessionState(body.sessionId, statePayload)
  if (!session) {
    return NextResponse.json(
      { error: 'session_not_found', reconnect: true },
      { status: 404, headers: CORS_HEADERS },
    )
  }

  // TODO: forward relevant changes to connected web clients via SSE/WebSocket
  // when a push channel is available (e.g. Pusher, Ably, or Next.js route handler SSE).

  return NextResponse.json(
    {
      received: true,
      serverTime: Date.now(),
      changeCount: body.changes?.length ?? 0,
    },
    { status: 200, headers: CORS_HEADERS },
  )
}
