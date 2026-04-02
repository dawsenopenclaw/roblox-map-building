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
import { updateSessionState, getSessionByToken, createSession } from '@/lib/studio-session'
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
  /** Workspace snapshot pushed by scan_workspace command */
  snapshot?: Record<string, unknown>
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

  // Resolve sessionId: prefer explicit sessionId, then look up by token
  let sessionId = rawBody.sessionId
  if (!sessionId && rawBody.sessionToken) {
    const sessionByToken = getSessionByToken(rawBody.sessionToken)
    if (sessionByToken) {
      sessionId = sessionByToken.sessionId
    } else if (rawBody.sessionToken.length >= 32) {
      // Auto-recreate session on Vercel cold start
      const newSession = createSession({
        placeId: rawBody.placeId ?? 'unknown',
        placeName: (rawBody as Record<string, unknown>).placeName as string ?? 'Reconnected Session',
        pluginVersion: '1.0.0',
        authToken: rawBody.sessionToken,
      })
      sessionId = newSession.sessionId
    }
  }
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

  // Attach workspace snapshot when the plugin sends a scan result
  if (body.event === 'workspace_snapshot' && body.snapshot) {
    statePayload.worldSnapshot = body.snapshot
    statePayload.snapshotAt = Date.now()
  }

  const session = await updateSessionState(body.sessionId, statePayload)
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
