/**
 * GET /api/studio/stream?sessionId=<id>
 *
 * Server-Sent Events endpoint. Opens a persistent connection for a single
 * Studio session and pushes state changes as they arrive — replacing the
 * browser's polling loop against /status, /screenshot, and /context.
 *
 * Event catalogue:
 *   context        — camera, nearbyParts, partCount, selection, placeId
 *   screenshot     — { image: string }  (base64 PNG, no data-URI prefix)
 *   command_result — { commandId: string, success: boolean, error?: string }
 *   heartbeat      — { serverTime: number }  (keepalive every 15 s)
 *   disconnect     — { reason: string }  (session expired / not found)
 *
 * Other routes call `pushToSession(sessionId, eventName, data)` to fan out
 * to all SSE connections subscribed to that session.
 *
 * Architecture: in-process pub/sub via a globalThis Map so the store survives
 * Next.js hot-reloads without losing live connections. On Vercel each Lambda
 * instance maintains its own subscriber Map — cross-instance fan-out is
 * handled by the caller through Redis Pub/Sub if needed (out of scope here).
 */

import 'server-only'
import { type NextRequest } from 'next/server'
import { getSession, SESSION_TTL_MS } from '@/lib/studio-session'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SseEventName =
  | 'context'
  | 'screenshot'
  | 'command_result'
  | 'heartbeat'
  | 'disconnect'

interface SseController {
  /** Enqueue a raw SSE frame into the stream. */
  enqueue: (chunk: string) => void
  /** Terminate this subscriber's stream. */
  close: () => void
  /** Unix ms when this subscriber connected — for expiry audits. */
  connectedAt: number
}

// ---------------------------------------------------------------------------
// Subscriber registry — survives Next.js hot-reload via globalThis
// ---------------------------------------------------------------------------

type SubscriberMap = Map<string, Set<SseController>>

// @ts-expect-error — attach to globalThis for hot-reload persistence
const subscribers: SubscriberMap = (globalThis.__fjSseSubscribers ??= new Map())
// @ts-expect-error
globalThis.__fjSseSubscribers = subscribers

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function getOrCreateSet(sessionId: string): Set<SseController> {
  let set = subscribers.get(sessionId)
  if (!set) {
    set = new Set()
    subscribers.set(sessionId, set)
  }
  return set
}

function removeController(sessionId: string, ctrl: SseController): void {
  const set = subscribers.get(sessionId)
  if (!set) return
  set.delete(ctrl)
  if (set.size === 0) subscribers.delete(sessionId)
}

/**
 * Encode a single SSE frame.
 * `id` is omitted for heartbeat/disconnect frames to keep bandwidth low.
 */
function encodeFrame(event: SseEventName, data: unknown, id?: string): string {
  const payload = JSON.stringify(data)
  const lines: string[] = []
  if (id) lines.push(`id:${id}`)
  lines.push(`event:${event}`)
  lines.push(`data:${payload}`)
  lines.push('', '') // blank line terminates the frame
  return lines.join('\n')
}

/** SSE comment — keeps the connection alive through proxies / load balancers. */
function keepaliveComment(): string {
  return `: ping ${Date.now()}\n\n`
}

// ---------------------------------------------------------------------------
// Public API — called by other route handlers to push data to SSE clients
// ---------------------------------------------------------------------------

/**
 * Push an event to every SSE connection subscribed to `sessionId`.
 *
 * @returns The number of active subscribers that received the event.
 *
 * Usage from other route handlers:
 * ```ts
 * import { pushToSession } from '@/app/api/studio/stream/route'
 * pushToSession(sessionId, 'context', { camera, nearbyParts, partCount })
 * pushToSession(sessionId, 'screenshot', { image: base64 })
 * pushToSession(sessionId, 'command_result', { commandId, success, error })
 * ```
 */
export function pushToSession(
  sessionId: string,
  event: SseEventName,
  data: Record<string, unknown>,
): number {
  const set = subscribers.get(sessionId)
  if (!set || set.size === 0) return 0

  const frame = encodeFrame(event, data, `${Date.now()}`)
  let delivered = 0

  for (const ctrl of set) {
    try {
      ctrl.enqueue(frame)
      delivered++
    } catch {
      // Controller's stream was closed on client disconnect — clean it up.
      set.delete(ctrl)
    }
  }

  if (set.size === 0) subscribers.delete(sessionId)
  return delivered
}

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

// ---------------------------------------------------------------------------
// GET handler — opens the SSE connection
// ---------------------------------------------------------------------------

const HEARTBEAT_INTERVAL_MS = 15_000
const SESSION_POLL_INTERVAL_MS = 16_000  // slightly offset from heartbeat

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = req.nextUrl
  const sessionId = searchParams.get('sessionId')

  if (!sessionId) {
    return new Response(
      JSON.stringify({ error: 'sessionId query param is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } },
    )
  }

  // Validate that the session exists before accepting the connection.
  const session = await getSession(sessionId)
  if (!session) {
    return new Response(
      JSON.stringify({ error: 'session_not_found', reconnect: true }),
      { status: 404, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } },
    )
  }

  // Capture the narrowed string after the null/notFound guards so closures
  // below always see `string`, not `string | null`.
  const resolvedSessionId: string = sessionId

  const textEncoder = new TextEncoder()

  let heartbeatTimer: ReturnType<typeof setInterval> | null = null
  let sessionWatchTimer: ReturnType<typeof setInterval> | null = null
  let ctrl: SseController | null = null

  const stream = new ReadableStream({
    start(controller) {
      const enqueue = (chunk: string): void => {
        controller.enqueue(textEncoder.encode(chunk))
      }

      ctrl = {
        enqueue,
        close: () => controller.close(),
        connectedAt: Date.now(),
      }

      // Register this subscriber.
      getOrCreateSet(resolvedSessionId).add(ctrl)

      // ── Initial state burst ──────────────────────────────────────────────
      // Push the current session state immediately so the client doesn't wait
      // for the first mutation to hydrate.
      try {
        const initial = buildContextPayload(session as SessionLike)
        enqueue(encodeFrame('context', initial, `${Date.now()}`))

        if (session.latestScreenshot) {
          enqueue(
            encodeFrame('screenshot', { image: session.latestScreenshot }, `${Date.now()}`),
          )
        }
      } catch {
        // Non-fatal — client will receive the next pushed update.
      }

      // ── Heartbeat loop ───────────────────────────────────────────────────
      heartbeatTimer = setInterval(() => {
        try {
          enqueue(keepaliveComment())
          enqueue(encodeFrame('heartbeat', { serverTime: Date.now() }))
        } catch {
          cleanup()
        }
      }, HEARTBEAT_INTERVAL_MS)

      // ── Session expiry watch ─────────────────────────────────────────────
      // Periodically verify the session is still alive. If it expires, push
      // a disconnect event and close the stream so the client reconnects.
      sessionWatchTimer = setInterval(async () => {
        try {
          const live = await getSession(resolvedSessionId)
          const isExpired =
            !live || Date.now() - live.lastHeartbeat > SESSION_TTL_MS

          if (isExpired) {
            enqueue(
              encodeFrame('disconnect', {
                reason: 'session_expired',
                serverTime: Date.now(),
              }),
            )
            cleanup()
          }
        } catch {
          // Redis unavailable — keep the connection open; the client will
          // detect stale context via the heartbeat timestamps.
        }
      }, SESSION_POLL_INTERVAL_MS)
    },

    cancel() {
      // Called when the client closes the connection (navigation, tab close).
      cleanup()
    },
  })

  function cleanup(): void {
    if (heartbeatTimer !== null) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
    if (sessionWatchTimer !== null) {
      clearInterval(sessionWatchTimer)
      sessionWatchTimer = null
    }
    if (ctrl !== null) {
      removeController(resolvedSessionId, ctrl)
      try {
        ctrl.close()
      } catch {
        // Already closed — ignore.
      }
      ctrl = null
    }
  }

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',  // disable Nginx/proxy response buffering
      ...CORS_HEADERS,
    },
  })
}

// ---------------------------------------------------------------------------
// Payload builders — kept co-located to stay consistent with update/route.ts
// ---------------------------------------------------------------------------

interface SessionLike {
  placeId: string
  placeName: string
  partCount: number
  camera: {
    posX: number; posY: number; posZ: number
    lookX: number; lookY: number; lookZ: number
    fov?: number
  } | null
  latestState: Record<string, unknown> | null
  latestScreenshot: string | null
  lastHeartbeat: number
}

function buildContextPayload(session: SessionLike): Record<string, unknown> {
  const state = session.latestState ?? {}
  return {
    placeId: session.placeId,
    placeName: session.placeName,
    partCount: session.partCount,
    camera: session.camera,
    nearbyParts: (state.nearbyParts as unknown[] | undefined) ?? [],
    selection: (state.selection as unknown[] | undefined) ?? [],
    serverTime: Date.now(),
    lastHeartbeat: session.lastHeartbeat,
  }
}
