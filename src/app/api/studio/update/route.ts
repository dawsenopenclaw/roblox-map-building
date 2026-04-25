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
import { getRedis } from '@/lib/redis'

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
  /** Recent console messages pushed by get_output command */
  outputLog?: unknown[]
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
  // `in` narrowing instead of `!parsedBody.ok` — zod's .refine() widens the
  // discriminator property type to `boolean` in some TS versions, which
  // breaks plain discriminated-union narrowing. Using `in` sidesteps that.
  if ('error' in parsedBody) {
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
  // Force the change entries to PluginChange[] — zod's inference loses the
  // required-ness of `type` when the outer schema has a .refine() wrapper.
  const safeChanges: PluginChange[] = (rawBody.changes ?? []).filter(
    (c): c is PluginChange => typeof c?.type === 'string',
  )
  const body: UpdateBody = { ...rawBody, sessionId, changes: safeChanges }

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

  // Attach recent LogService output when the plugin posts its ring buffer.
  // The plugin sends `outputLog` alongside `event: 'output_log'`; we stash
  // it on latestState.outputLog so agentic-loop.ts captureOutputLog() can
  // read it back through getSession() → session.latestState.outputLog.
  if (body.event === 'output_log' && Array.isArray(body.outputLog)) {
    statePayload.outputLog = body.outputLog
    statePayload.outputLogAt = Date.now()

    // Also store in Redis for the ConsolePanel UI to poll via /api/studio/console
    const VALID_LOG_TYPES = new Set(['Output', 'Warning', 'Error', 'Info', 'MessageOutput', 'MessageWarning', 'MessageError', 'MessageInfo', 'unknown'])
    try {
      const redis = getRedis()
      if (redis && body.sessionId) {
        const key = `fj:studio:console:${body.sessionId}`
        const entries = (body.outputLog as Array<{ message?: string; type?: string; timestamp?: number }>)
        // Only take last 50 entries to avoid processing huge payloads
        const batch = entries.length > 50 ? entries.slice(-50) : entries
        const pipeline = redis.pipeline()
        for (const entry of batch) {
          const rawType = String(entry.type ?? 'unknown')
          pipeline.rpush(key, JSON.stringify({
            message: String(entry.message ?? '').slice(0, 500),
            type: VALID_LOG_TYPES.has(rawType) ? rawType : 'unknown',
            timestamp: typeof entry.timestamp === 'number' ? entry.timestamp : Math.floor(Date.now() / 1000),
          }))
        }
        pipeline.ltrim(key, -100, -1)
        pipeline.expire(key, 600)
        pipeline.exec().catch((e) => {
          console.warn('[studio/update] Redis console pipeline error:', e instanceof Error ? e.message : e)
        })
      }
    } catch { /* Redis unavailable — non-critical */ }
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

  // Process command_result changes — store in Redis AND Postgres
  for (const change of safeChanges) {
    if (change.type === 'command_result' && change.data?.commandId) {
      const resultData = {
        success: change.data.success as boolean,
        partsCreated: (change.data.partsCreated as number) ?? 0,
        partsFailed: (change.data.partsFailed as number) ?? 0,
        totalCommands: (change.data.totalCommands as number) ?? 0,
        error: (change.data.error as string) ?? undefined,
        method: (change.data.method as string) ?? undefined,
      }
      // Try Redis first
      try {
        const { storeCommandResult } = await import('@/lib/studio-session')
        await storeCommandResult(change.data.commandId as string, resultData)
      } catch { /* Redis unavailable */ }
      // Always store in Postgres (free, no limits)
      try {
        const { pgStoreCommandResult } = await import('@/lib/studio-queue-pg')
        await pgStoreCommandResult(change.data.commandId as string, resultData)
      } catch { /* Postgres unavailable */ }
    }
  }

  // Touch heartbeat in Postgres (free, no limits — always works even when Redis is down)
  try {
    const { pgTouchHeartbeat } = await import('@/lib/studio-queue-pg')
    await pgTouchHeartbeat(body.sessionId)
  } catch { /* non-critical */ }

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
