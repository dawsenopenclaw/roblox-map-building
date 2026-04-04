/**
 * Shared SSE pub/sub bus for Studio sessions.
 * Imported by both stream/route.ts and update/route.ts to avoid
 * cross-bundle globalThis splits on Vercel serverless.
 *
 * Cross-instance fan-out (Vercel Lambda A → Lambda B):
 *   - pushToSession publishes to Redis channel fj:sse:<sessionId>
 *   - addSubscriber subscribes that Redis channel for the session
 *   - removeSubscriber unsubscribes when the last local subscriber leaves
 *   - Redis messages are forwarded to local subscribers
 *
 * Deduplication: each published message carries a unique msgId. The Lambda
 * that called pushToSession already delivered it locally, so when its own
 * Redis subscription fires it skips re-delivery by checking a short-lived
 * Set of recently-sent IDs.
 *
 * Graceful degradation: if Redis is unavailable the bus falls back to the
 * original in-memory-only behaviour without throwing.
 */

import 'server-only'
import type Redis from 'ioredis'
import { getRedis } from '@/lib/redis'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SseController {
  enqueue: (data: string) => void
  close: () => void
}

type SubscriberMap = Map<string, Set<SseController>>

// ---------------------------------------------------------------------------
// In-memory subscriber registry — survives Next.js hot-reload via globalThis
// ---------------------------------------------------------------------------

const G = globalThis as unknown as {
  __fjSseSubscribers?: SubscriberMap
  __fjSseSubRedis?: Redis | null
  __fjSseRedisChannels?: Set<string>
  __fjSseSentIds?: Set<string>
}

if (!G.__fjSseSubscribers) G.__fjSseSubscribers = new Map()
if (!G.__fjSseRedisChannels) G.__fjSseRedisChannels = new Set()
if (!G.__fjSseSentIds) G.__fjSseSentIds = new Set()

export const subscribers: SubscriberMap = G.__fjSseSubscribers

// Recently-published msgIds on this instance — used to skip re-delivery when
// our own Redis subscription echoes the message back.
const sentIds: Set<string> = G.__fjSseSentIds

// Active Redis channel subscriptions on this instance.
const redisChannels: Set<string> = G.__fjSseRedisChannels

// ---------------------------------------------------------------------------
// Redis subscriber connection
// ---------------------------------------------------------------------------

/**
 * Returns a DEDICATED subscriber Redis connection.
 * ioredis requires a separate connection in subscribe mode — you cannot mix
 * regular commands with subscribe/unsubscribe on the same connection.
 */
function getSubRedis(): Redis | null {
  // Return cached instance if it exists and is still open.
  if (G.__fjSseSubRedis) return G.__fjSseSubRedis

  const pub = getRedis()
  if (!pub) return null

  try {
    // duplicate() clones configuration (URL, TLS, retry strategy, etc.)
    // and returns a new connection that starts in a clean non-subscribed state.
    const sub = pub.duplicate()
    sub.on('error', () => {
      // Subscriber connection lost — clear so next call recreates it.
      G.__fjSseSubRedis = null
      redisChannels.clear()
    })
    sub.on('message', (channel: string, message: string) => {
      handleRedisMessage(channel, message)
    })
    G.__fjSseSubRedis = sub
    return sub
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Redis channel helpers
// ---------------------------------------------------------------------------

function channelFor(sessionId: string): string {
  return `fj:sse:${sessionId}`
}

/**
 * Ensure this Lambda instance is subscribed to the Redis channel for sessionId.
 * Safe to call multiple times — tracks subscribed channels in redisChannels.
 */
async function ensureRedisSubscription(sessionId: string): Promise<void> {
  const channel = channelFor(sessionId)
  if (redisChannels.has(channel)) return

  const sub = getSubRedis()
  if (!sub) return

  try {
    await sub.subscribe(channel)
    redisChannels.add(channel)
  } catch {
    // Redis unavailable — local-only mode
  }
}

/**
 * Remove the Redis subscription for sessionId when there are no more local
 * subscribers for that session.
 */
async function removeRedisSubscription(sessionId: string): Promise<void> {
  const channel = channelFor(sessionId)
  if (!redisChannels.has(channel)) return

  const sub = getSubRedis()
  if (!sub) return

  try {
    await sub.unsubscribe(channel)
    redisChannels.delete(channel)
  } catch {
    redisChannels.delete(channel)
  }
}

// ---------------------------------------------------------------------------
// Redis message handler — called when another Lambda publishes to our channel
// ---------------------------------------------------------------------------

interface RedisSseMessage {
  msgId: string
  event: string
  payload: string // pre-serialised SSE frame
}

function handleRedisMessage(channel: string, raw: string): void {
  let msg: RedisSseMessage
  try {
    msg = JSON.parse(raw) as RedisSseMessage
  } catch {
    return
  }

  // Skip if this instance was the original publisher — it already delivered
  // the event locally inside pushToSession.
  if (sentIds.has(msg.msgId)) return

  // Extract sessionId from channel name: "fj:sse:<sessionId>"
  const sessionId = channel.slice('fj:sse:'.length)
  const set = subscribers.get(sessionId)
  if (!set || set.size === 0) return

  for (const ctrl of set) {
    try {
      ctrl.enqueue(msg.payload)
    } catch {
      set.delete(ctrl)
    }
  }
  if (set.size === 0) subscribers.delete(sessionId)
}

// ---------------------------------------------------------------------------
// Dedup ID helpers
// ---------------------------------------------------------------------------

function generateMsgId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/** Keep sentIds bounded — purge entries older than 10 s (by count proxy). */
const SENT_IDS_MAX = 2_000

function trackSentId(msgId: string): void {
  sentIds.add(msgId)
  if (sentIds.size > SENT_IDS_MAX) {
    // Delete the oldest entries (Set iteration order is insertion order).
    const iter = sentIds.values()
    const toDelete = sentIds.size - SENT_IDS_MAX
    for (let i = 0; i < toDelete; i++) {
      const next = iter.next()
      if (!next.done) sentIds.delete(next.value)
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Register a new SSE connection for sessionId.
 * Also subscribes to the Redis channel for this session so events published
 * by other Lambda instances are forwarded here.
 */
export function addSubscriber(sessionId: string, controller: SseController): void {
  let set = subscribers.get(sessionId)
  if (!set) {
    set = new Set()
    subscribers.set(sessionId, set)
  }
  set.add(controller)

  // Fire-and-forget Redis subscription — errors are swallowed inside.
  void ensureRedisSubscription(sessionId)
}

/**
 * Deregister an SSE connection.
 * When the last local subscriber leaves, the Redis channel subscription is
 * also removed to avoid orphaned subscriptions accumulating.
 */
export function removeSubscriber(sessionId: string, controller: SseController): void {
  const set = subscribers.get(sessionId)
  if (set) {
    set.delete(controller)
    if (set.size === 0) {
      subscribers.delete(sessionId)
      // Fire-and-forget — errors swallowed inside.
      void removeRedisSubscription(sessionId)
    }
  }
}

/**
 * Push an SSE event to all browser connections watching this session.
 *
 * Delivers locally to subscribers on this Lambda instance, then publishes to
 * Redis so other instances can forward the event to their local subscribers.
 *
 * Returns the number of local subscribers that received the event.
 */
export function pushToSession(sessionId: string, event: string, data: unknown): number {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  const msgId = generateMsgId()

  // ── Local delivery ──────────────────────────────────────────────────────
  const set = subscribers.get(sessionId)
  let delivered = 0

  if (set && set.size > 0) {
    for (const ctrl of set) {
      try {
        ctrl.enqueue(payload)
        delivered++
      } catch {
        set.delete(ctrl)
      }
    }
    if (set.size === 0) subscribers.delete(sessionId)
  }

  // ── Redis publish (cross-instance fan-out) ──────────────────────────────
  // Track the msgId BEFORE publishing so that our own subscription callback
  // (if it fires before the next tick) skips re-delivery.
  trackSentId(msgId)

  const pub = getRedis()
  if (pub) {
    const message: RedisSseMessage = { msgId, event, payload }
    // publish is fire-and-forget; errors are swallowed by ioredis error handler.
    pub.publish(channelFor(sessionId), JSON.stringify(message)).catch(() => {
      // Redis unavailable — local-only delivery already happened above.
    })
  }

  return delivered
}
