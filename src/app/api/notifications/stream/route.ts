import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getRedis } from '@/lib/redis'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/notifications/stream
 *
 * Server-Sent Events stream. Subscribes to the Redis pub/sub channel
 * `notif:user:{userId}` and forwards each published JSON payload to the
 * browser as an SSE `data:` event.
 *
 * Falls back gracefully when Redis is not configured — the client will
 * rely on its 30-second polling interval instead.
 *
 * The stream sends a heartbeat comment every 25 seconds to keep proxies
 * and load balancers from closing idle connections.
 */
export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Resolve internal userId from clerkId
  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })
  if (!user) {
    return new Response('User not found', { status: 404 })
  }

  const channel = `notif:user:${user.id}`

  // Check Redis availability
  const redisClient = getRedis()
  if (!redisClient) {
    // Redis not configured — return a minimal SSE stream that immediately closes.
    // The client will fall back to polling.
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(': redis-unavailable\n\n'))
        controller.close()
      },
    })
    return new Response(body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    })
  }

  // Each SSE connection needs its own subscriber Redis client (ioredis subscribers
  // are single-purpose — calling subscribe() puts them into subscribe mode and
  // they can no longer issue regular commands).
  const subscriber = redisClient.duplicate()

  const encoder = new TextEncoder()

  const body = new ReadableStream({
    async start(controller) {
      // Heartbeat every 25s to prevent proxy/LB timeouts
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'))
        } catch {
          clearInterval(heartbeat)
        }
      }, 25_000)

      subscriber.on('message', (_ch: string, message: string) => {
        try {
          controller.enqueue(encoder.encode(`data: ${message}\n\n`))
        } catch {
          // Stream already closed
        }
      })

      subscriber.on('error', () => {
        clearInterval(heartbeat)
        try { controller.close() } catch { /* already closed */ }
      })

      await subscriber.subscribe(channel).catch(() => {
        clearInterval(heartbeat)
        try { controller.close() } catch { /* already closed */ }
      })

      // Clean up when the client disconnects
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        subscriber.unsubscribe(channel).catch(() => {})
        subscriber.quit().catch(() => {})
        try { controller.close() } catch { /* already closed */ }
      })
    },
  })

  return new Response(body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // disable nginx buffering
    },
  })
}
