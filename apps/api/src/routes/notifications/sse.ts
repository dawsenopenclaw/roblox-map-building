/**
 * GET /api/notifications/stream
 * Server-Sent Events endpoint for real-time notification delivery.
 *
 * Auth:   Bearer token via Authorization header
 * Retry:  Client should reconnect after 1s on disconnect
 * Events: "notification" — new notification payload
 *         "ping"         — heartbeat every 30s (keeps connection alive through proxies)
 *
 * Last-Event-ID support: on reconnect, events newer than the provided ID are
 * replayed from the DB (up to 20 missed notifications).
 */

import { Hono } from 'hono'
import { createClerkClient } from '@clerk/backend'
import { db } from '../../lib/db'
import { redis } from '../../lib/redis'
import { userNotificationChannel } from '../../lib/notifications'

export const notificationSSERoutes = new Hono()

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! })

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function authenticateSSE(req: Request): Promise<string | null> {
  try {
    const requestState = await clerk.authenticateRequest(req, {
      jwtKey: process.env.CLERK_JWT_KEY,
    })
    if (!requestState.isSignedIn) return null
    return requestState.toAuth().userId ?? null
  } catch {
    return null
  }
}

function formatSSEEvent(event: string, data: string, id?: string): string {
  let msg = ''
  if (id) msg += `id: ${id}\n`
  msg += `event: ${event}\n`
  msg += `data: ${data}\n\n`
  return msg
}

// ─── GET /api/notifications/stream ───────────────────────────────────────────

notificationSSERoutes.get('/stream', async (c) => {
  // Authenticate via Bearer token header OR ?token= query param
  // EventSource API in browsers cannot set custom headers, so we accept the
  // token as a query parameter as a fallback.
  let clerkId = await authenticateSSE(c.req.raw)
  if (!clerkId) {
    const tokenParam = c.req.query('token')
    if (tokenParam) {
      // Reconstruct a fake request with Authorization header for Clerk
      const fakeReq = new Request(c.req.url, {
        headers: { Authorization: `Bearer ${tokenParam}` },
      })
      clerkId = await authenticateSSE(fakeReq)
    }
  }
  if (!clerkId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })
  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  const userId = user.id
  // Last-Event-ID can arrive as a header (spec) or as a query param (our client fallback)
  const lastEventId =
    c.req.header('Last-Event-ID') ?? c.req.query('lastEventId') ?? null

  // Deduplicate subscriber connections per user (track in Redis)
  const connKey = `notif:conn:${userId}`

  // Hoist cleanup so both start() return value and cancel() can call it
  let cleanupFn: (() => void) | null = null

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      function send(event: string, data: string, id?: string) {
        try {
          controller.enqueue(encoder.encode(formatSSEEvent(event, data, id)))
        } catch {
          // Client disconnected
        }
      }

      // ── Replay missed notifications since last seen event ──────────────────
      if (lastEventId) {
        try {
          const missed = await db.notification.findMany({
            where: {
              userId,
              createdAt: { gt: new Date(parseInt(lastEventId, 36)) },
            },
            orderBy: { createdAt: 'asc' },
            take: 20,
          })
          for (const n of missed) {
            const eventId = n.createdAt.getTime().toString(36)
            send(
              'notification',
              JSON.stringify({
                id: n.id,
                type: n.type,
                title: n.title,
                body: n.body,
                actionUrl: n.actionUrl,
                createdAt: n.createdAt.toISOString(),
                read: n.read,
              }),
              eventId
            )
          }
        } catch (err) {
          console.error('[SSE] replay failed:', err)
        }
      }

      // ── Subscribe to Redis pub/sub for this user ───────────────────────────
      // Each SSE connection needs its own Redis subscriber instance
      let subscriber: ReturnType<typeof redis.duplicate> | null = null
      let heartbeat: ReturnType<typeof setInterval> | null = null
      let closed = false

      function cleanup() {
        if (closed) return
        closed = true
        if (heartbeat) clearInterval(heartbeat)
        if (subscriber) {
          subscriber.unsubscribe().catch(() => {})
          subscriber.disconnect()
        }
        redis.decr(connKey).catch(() => {})
        try {
          controller.close()
        } catch {
          // already closed
        }
      }

      // Expose cleanup so the cancel() callback can reach it
      cleanupFn = cleanup

      try {
        subscriber = redis.duplicate()
        await subscriber.connect()
        await redis.incr(connKey)

        await subscriber.subscribe(userNotificationChannel(userId), (message) => {
          if (closed) return
          try {
            const parsed = JSON.parse(message)
            const eventId = new Date(parsed.createdAt).getTime().toString(36)
            send('notification', message, eventId)
          } catch {
            // Malformed message — skip
          }
        })

        // Send initial connection confirmation
        send('connected', JSON.stringify({ userId, ts: Date.now() }))

        // Heartbeat every 30 seconds to keep proxy connections alive
        heartbeat = setInterval(() => {
          if (closed) return
          send('ping', JSON.stringify({ ts: Date.now() }))
        }, 30_000)

      } catch (err) {
        console.error('[SSE] setup failed:', err)
        cleanup()
      }
    },

    cancel() {
      // Called when the client disconnects — invoke the shared cleanup
      cleanupFn?.()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // disable Nginx buffering
      'retry': '1000', // suggest 1s reconnect delay
    },
  })
})
