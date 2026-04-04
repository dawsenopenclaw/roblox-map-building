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
    const sessionByToken = await getSessionByToken(rawBody.sessionToken)
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

  // Store camera + nearby parts + selection + ground from heartbeat for AI context
  const extra = rawBody as Record<string, unknown>
  if (extra.camera) statePayload.camera = extra.camera
  if (extra.partCount !== undefined) statePayload.partCount = extra.partCount
  if (extra.nearbyParts) statePayload.nearbyParts = extra.nearbyParts
  if (extra.selected !== undefined) statePayload.selected = extra.selected
  if (extra.groundY !== undefined) statePayload.groundY = extra.groundY

  const session = await updateSessionState(body.sessionId, statePayload)
  if (!session) {
    return NextResponse.json(
      { error: 'session_not_found', reconnect: true },
      { status: 404, headers: CORS_HEADERS },
    )
  }

  // Persist camera/context on the session object for status endpoint
  const s = session as unknown as Record<string, unknown>
  if (extra.camera) s.camera = extra.camera
  if (extra.partCount !== undefined) s.partCount = extra.partCount
  if (extra.modelCount !== undefined) s.modelCount = extra.modelCount
  if (extra.lightCount !== undefined) s.lightCount = extra.lightCount
  if (extra.nearbyParts) s.nearbyParts = extra.nearbyParts
  if (extra.selected !== undefined) s.selected = extra.selected
  if (extra.sceneTree !== undefined) s.sceneTree = extra.sceneTree
  if (extra.groundY !== undefined) s.groundY = extra.groundY

  // Push to SSE subscribers — instant browser updates, no polling needed
  try {
    const { pushToSession } = await import('@/lib/studio-sse-bus')
    if (extra.camera || extra.nearbyParts || extra.selected) {
      pushToSession(body.sessionId, 'context', {
        camera: extra.camera ?? null,
        partCount: extra.partCount,
        modelCount: extra.modelCount,
        lightCount: extra.lightCount,
        nearbyParts: extra.nearbyParts,
        selected: extra.selected,
        sceneTree: extra.sceneTree,
        groundY: extra.groundY,
      })
    }
  } catch { /* SSE not available — browser falls back to polling */ }

  return NextResponse.json(
    {
      received: true,
      serverTime: Date.now(),
      changeCount: body.changes?.length ?? 0,
    },
    { status: 200, headers: CORS_HEADERS },
  )
}
