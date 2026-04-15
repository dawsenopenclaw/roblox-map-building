/**
 * GET /api/studio/live?sessionId=<id>&token=<jwt>
 *
 * Server-Sent Events endpoint for the PLUGIN (not the browser).
 * The plugin opens a persistent SSE connection via CreateWebStreamClient().
 * When the web app queues a command, it's pushed down this connection
 * instantly — no polling, no Redis, no 5-second delays.
 *
 * This replaces the polling-based /api/studio/sync for plugins that
 * support SSE (plugin v5.0+). Older plugins fall back to /sync polling.
 *
 * Event format:
 *   event: command
 *   data: {"id":"...","type":"execute_luau","data":{...},"timestamp":...}
 *
 *   event: heartbeat
 *   data: {"serverTime":...}
 *
 * Architecture: uses the same globalThis pub/sub as studio-sse-bus.ts
 * but with a separate subscriber map keyed to "plugin:<sessionId>".
 */

import { type NextRequest } from 'next/server'

// ── Plugin subscriber store (survives hot-reload via globalThis) ────────────

interface PluginSubscriber {
  enqueue: (chunk: string) => void
  close: () => void
  connectedAt: number
}

const globalStore = globalThis as unknown as {
  __fjPluginSubscribers?: Map<string, PluginSubscriber[]>
}
const pluginSubs: Map<string, PluginSubscriber[]> =
  (globalStore.__fjPluginSubscribers ??= new Map())

/** Push a command to all live plugin SSE connections for a session. */
export function pushCommandToPlugin(sessionId: string, command: Record<string, unknown>): boolean {
  const subs = pluginSubs.get(sessionId)
  if (!subs || subs.length === 0) return false
  const frame = `event: command\ndata: ${JSON.stringify(command)}\n\n`
  for (const sub of subs) {
    try { sub.enqueue(frame) } catch { /* dead connection */ }
  }
  return true
}

// ── GET handler — opens SSE stream ──────────────────────────────────────────

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId')
  if (!sessionId) {
    return new Response('sessionId required', { status: 400 })
  }

  // Touch the session in Postgres so the chat Lambda knows we're alive
  try {
    const { pgUpsertSession } = await import('@/lib/studio-queue-pg')
    await pgUpsertSession({ sessionId })
  } catch { /* non-critical */ }

  const encoder = new TextEncoder()
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null
  let subscriber: PluginSubscriber | null = null

  const stream = new ReadableStream({
    start(controller) {
      subscriber = {
        enqueue: (chunk: string) => {
          try { controller.enqueue(encoder.encode(chunk)) } catch { /* stream closed */ }
        },
        close: () => {
          try { controller.close() } catch { /* already closed */ }
        },
        connectedAt: Date.now(),
      }

      // Register this subscriber
      const existing = pluginSubs.get(sessionId) ?? []
      existing.push(subscriber)
      pluginSubs.set(sessionId, existing)

      // Send initial connected event
      controller.enqueue(encoder.encode(
        `event: connected\ndata: ${JSON.stringify({ sessionId, serverTime: Date.now() })}\n\n`
      ))

      // Drain any pending commands from Postgres (queued while plugin wasn't connected via SSE)
      void (async () => {
        try {
          const { pgDrainCommands } = await import('@/lib/studio-queue-pg')
          const pending = await pgDrainCommands(sessionId)
          for (const cmd of pending) {
            const frame = `event: command\ndata: ${JSON.stringify(cmd)}\n\n`
            try { controller.enqueue(encoder.encode(frame)) } catch { break }
          }
          if (pending.length > 0) {
            console.log(`[studio/live] Drained ${pending.length} pending commands for ${sessionId}`)
          }
        } catch { /* Postgres unavailable */ }
      })()

      // Heartbeat every 15 seconds to keep the connection alive
      heartbeatTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(
            `event: heartbeat\ndata: ${JSON.stringify({ serverTime: Date.now() })}\n\n`
          ))
        } catch {
          // Stream died — cleanup will happen in cancel()
        }

        // Touch heartbeat in Postgres
        void (async () => {
          try {
            const { pgTouchHeartbeat } = await import('@/lib/studio-queue-pg')
            await pgTouchHeartbeat(sessionId)
          } catch { /* non-critical */ }
        })()
      }, 15_000)
    },

    cancel() {
      // Clean up when plugin disconnects
      if (heartbeatTimer) clearInterval(heartbeatTimer)
      if (subscriber) {
        const subs = pluginSubs.get(sessionId) ?? []
        const idx = subs.indexOf(subscriber)
        if (idx >= 0) subs.splice(idx, 1)
        if (subs.length === 0) pluginSubs.delete(sessionId)
      }
      console.log(`[studio/live] Plugin disconnected: ${sessionId}`)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'X-Accel-Buffering': 'no',
    },
  })
}
