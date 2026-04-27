import 'server-only'
import { randomUUID } from 'crypto'
import { getRedis } from '@/lib/redis'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface WebhookPayload {
  id: string
  url: string
  body: string
  headers?: Record<string, string>
  source: string // 'discord' | 'clerk' | 'custom'
  createdAt: number
  attempts: number
  lastError?: string
}

// ─── Constants ──────────────────────────────────────────────────────────────

const RETRY_QUEUE_KEY = 'webhook:retry:queue' // sorted set, score = next retry ts
const RETRY_DATA_PREFIX = 'webhook:retry:data:' // hash per item
const DLQ_KEY = 'webhook:dlq' // list
const DLQ_TTL = 30 * 24 * 60 * 60 // 30 days in seconds

const MAX_ATTEMPTS = 5
// Backoff schedule in seconds: 5s, 30s, 2min, 10min, 30min
const BACKOFF_SECONDS = [5, 30, 120, 600, 1800]
const DELIVERY_TIMEOUT_MS = 10_000

// ─── Helpers ────────────────────────────────────────────────────────────────

function serializePayload(p: WebhookPayload): string {
  return JSON.stringify(p)
}

function deserializePayload(raw: string): WebhookPayload | null {
  try {
    return JSON.parse(raw) as WebhookPayload
  } catch {
    return null
  }
}

/** Fire-and-forget HTTP delivery with timeout */
async function attemptDelivery(
  url: string,
  body: string,
  headers?: Record<string, string>,
): Promise<{ ok: boolean; status?: number; error?: string }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body,
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (res.status >= 200 && res.status < 300) {
      return { ok: true, status: res.status }
    }
    const text = await res.text().catch(() => '')
    return { ok: false, status: res.status, error: `HTTP ${res.status}: ${text.slice(0, 200)}` }
  } catch (err) {
    clearTimeout(timer)
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, error: msg }
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Deliver a webhook. On first failure, enqueue for retry.
 * Falls back to fire-and-forget if Redis is unavailable.
 */
export async function deliverWebhook(
  payload: Omit<WebhookPayload, 'id' | 'createdAt' | 'attempts'>,
): Promise<{ success: boolean; id: string }> {
  const id = randomUUID()
  const full: WebhookPayload = {
    ...payload,
    id,
    createdAt: Date.now(),
    attempts: 1,
  }

  const result = await attemptDelivery(full.url, full.body, full.headers)

  if (result.ok) {
    return { success: true, id }
  }

  // First attempt failed — enqueue for retry
  full.lastError = result.error ?? `Status ${result.status}`
  console.warn(
    `[webhook-retry] Delivery failed (attempt 1/${MAX_ATTEMPTS}) id=${id} source=${full.source}: ${full.lastError}`,
  )

  const redis = getRedis()
  if (!redis) {
    // No Redis — can't retry, just log and return
    console.error(`[webhook-retry] Redis unavailable, dropping webhook id=${id}`)
    return { success: false, id }
  }

  try {
    const nextRetryAt = Date.now() + BACKOFF_SECONDS[0]! * 1000
    await redis.set(RETRY_DATA_PREFIX + id, serializePayload(full), 'EX', DLQ_TTL)
    await redis.zadd(RETRY_QUEUE_KEY, nextRetryAt, id)
  } catch (err) {
    console.error(`[webhook-retry] Failed to enqueue retry for id=${id}:`, err)
  }

  return { success: false, id }
}

/**
 * Process items from the retry queue whose next-retry timestamp has passed.
 * Returns stats on what happened.
 */
export async function processRetryQueue(
  limit = 10,
): Promise<{ processed: number; succeeded: number; failed: number }> {
  const redis = getRedis()
  if (!redis) return { processed: 0, succeeded: 0, failed: 0 }

  const now = Date.now()
  let processed = 0
  let succeeded = 0
  let failed = 0

  try {
    // Grab items whose score (next retry timestamp) <= now
    const ids = await redis.zrangebyscore(RETRY_QUEUE_KEY, 0, now, 'LIMIT', 0, limit)
    if (!ids || ids.length === 0) return { processed: 0, succeeded: 0, failed: 0 }

    for (const id of ids) {
      const raw = await redis.get(RETRY_DATA_PREFIX + id)
      if (!raw) {
        // Stale entry — clean up
        await redis.zrem(RETRY_QUEUE_KEY, id)
        continue
      }

      const payload = deserializePayload(raw)
      if (!payload) {
        await redis.zrem(RETRY_QUEUE_KEY, id)
        await redis.del(RETRY_DATA_PREFIX + id)
        continue
      }

      processed++
      payload.attempts++

      const result = await attemptDelivery(payload.url, payload.body, payload.headers)

      if (result.ok) {
        // Success — clean up
        succeeded++
        await redis.zrem(RETRY_QUEUE_KEY, id)
        await redis.del(RETRY_DATA_PREFIX + id)
        console.log(
          `[webhook-retry] Delivered on attempt ${payload.attempts}/${MAX_ATTEMPTS} id=${id} source=${payload.source}`,
        )
        continue
      }

      payload.lastError = result.error ?? `Status ${result.status}`
      console.warn(
        `[webhook-retry] Retry failed (attempt ${payload.attempts}/${MAX_ATTEMPTS}) id=${id}: ${payload.lastError}`,
      )

      if (payload.attempts >= MAX_ATTEMPTS) {
        // Move to DLQ
        failed++
        await redis.zrem(RETRY_QUEUE_KEY, id)
        await redis.del(RETRY_DATA_PREFIX + id)
        await redis.lpush(DLQ_KEY, serializePayload(payload))
        // Set TTL on DLQ list itself (refreshes each time we push)
        await redis.expire(DLQ_KEY, DLQ_TTL)
        console.error(
          `[webhook-retry] Moved to DLQ after ${MAX_ATTEMPTS} attempts id=${id} source=${payload.source}`,
        )
      } else {
        // Schedule next retry
        const backoffIdx = Math.min(payload.attempts - 1, BACKOFF_SECONDS.length - 1)
        const nextRetryAt = Date.now() + BACKOFF_SECONDS[backoffIdx]! * 1000
        await redis.set(RETRY_DATA_PREFIX + id, serializePayload(payload), 'EX', DLQ_TTL)
        await redis.zadd(RETRY_QUEUE_KEY, nextRetryAt, id)
      }
    }
  } catch (err) {
    console.error('[webhook-retry] processRetryQueue error:', err)
  }

  return { processed, succeeded, failed }
}

/**
 * Get all items in the dead-letter queue.
 */
export async function getDLQ(limit = 50): Promise<WebhookPayload[]> {
  const redis = getRedis()
  if (!redis) return []

  try {
    const items = await redis.lrange(DLQ_KEY, 0, limit - 1)
    return items.map(deserializePayload).filter((p): p is WebhookPayload => p !== null)
  } catch (err) {
    console.error('[webhook-retry] getDLQ error:', err)
    return []
  }
}

/**
 * Retry a specific DLQ item by ID. Removes from DLQ and attempts delivery;
 * if it still fails, re-enqueues into the retry queue.
 */
export async function retryDLQItem(id: string): Promise<{ success: boolean }> {
  const redis = getRedis()
  if (!redis) return { success: false }

  try {
    const items = await redis.lrange(DLQ_KEY, 0, -1)
    let targetIdx = -1
    let targetPayload: WebhookPayload | null = null

    for (let i = 0; i < items.length; i++) {
      const p = deserializePayload(items[i]!)
      if (p && p.id === id) {
        targetIdx = i
        targetPayload = p
        break
      }
    }

    if (targetIdx === -1 || !targetPayload) {
      return { success: false }
    }

    // Remove from DLQ using lrem (removes first matching value)
    await redis.lrem(DLQ_KEY, 1, items[targetIdx]!)

    // Reset attempts and try delivery
    targetPayload.attempts = 0
    const result = await deliverWebhook({
      url: targetPayload.url,
      body: targetPayload.body,
      headers: targetPayload.headers,
      source: targetPayload.source,
    })

    return { success: result.success }
  } catch (err) {
    console.error('[webhook-retry] retryDLQItem error:', err)
    return { success: false }
  }
}

/**
 * Clear (acknowledge) a DLQ item — removes it permanently.
 */
export async function clearDLQItem(id: string): Promise<void> {
  const redis = getRedis()
  if (!redis) return

  try {
    const items = await redis.lrange(DLQ_KEY, 0, -1)
    for (const raw of items) {
      const p = deserializePayload(raw)
      if (p && p.id === id) {
        await redis.lrem(DLQ_KEY, 1, raw)
        return
      }
    }
  } catch (err) {
    console.error('[webhook-retry] clearDLQItem error:', err)
  }
}
