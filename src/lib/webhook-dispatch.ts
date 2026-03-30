/**
 * Webhook dispatch for Next.js app routes.
 *
 * Thin wrapper around the shared delivery engine logic.
 * Finds all active endpoints subscribed to an event for a given user
 * and delivers with HMAC-SHA256 signing, 4-attempt retry, and dead-letter logging.
 *
 * Mirror of apps/api/src/lib/webhook-delivery.ts — keep in sync.
 */

import { createHmac, randomBytes } from 'crypto'
import { db } from './db'

// ---------------------------------------------------------------------------
// Event catalog (subset used by Next.js route handlers)
// ---------------------------------------------------------------------------

export type WebhookEvent =
  | 'build.completed'
  | 'build.failed'
  | 'template.sold'
  | 'template.reviewed'
  | 'token.low'
  | 'token.depleted'
  | 'subscription.changed'
  | 'team.member_joined'
  | 'achievement.unlocked'

export interface WebhookPayload {
  id: string
  event: WebhookEvent
  version: 'v1'
  createdAt: string
  data: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Delivery constants
// ---------------------------------------------------------------------------

const RETRY_DELAYS_MS = [10_000, 60_000, 300_000] as const
const MAX_ATTEMPTS = RETRY_DELAYS_MS.length + 1 // 4 total
const DELIVERY_TIMEOUT_MS = 5_000

// ---------------------------------------------------------------------------
// Signature
// ---------------------------------------------------------------------------

function buildSignature(secret: string, timestampSeconds: number, rawBody: string): string {
  const signingInput = `${timestampSeconds}.${rawBody}`
  return `sha256=${createHmac('sha256', secret).update(signingInput).digest('hex')}`
}

// ---------------------------------------------------------------------------
// Single attempt
// ---------------------------------------------------------------------------

async function attemptDelivery(opts: {
  url: string
  secret: string
  payload: WebhookPayload
  idempotencyKey: string
  attempt: number
}): Promise<{ success: boolean; statusCode: number | null; responseBody: string | null; durationMs: number }> {
  const rawBody = JSON.stringify(opts.payload)
  const timestampSeconds = Math.floor(Date.now() / 1000)
  const signature = buildSignature(opts.secret, timestampSeconds, rawBody)
  const start = Date.now()

  let statusCode: number | null = null
  let responseBody: string | null = null
  let success = false

  try {
    const res = await fetch(opts.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-ForjeGames-Signature': signature,
        'X-ForjeGames-Timestamp': String(timestampSeconds),
        'X-ForjeGames-Event': opts.payload.event,
        'X-ForjeGames-Delivery': opts.payload.id,
        'X-ForjeGames-Idempotency-Key': opts.idempotencyKey,
        'X-ForjeGames-Attempt': String(opts.attempt),
        'User-Agent': 'ForjeGames-Webhooks/1.0',
      },
      body: rawBody,
      signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
    })
    statusCode = res.status
    responseBody = await res.text().catch(() => null)
    success = res.status >= 200 && res.status < 300
  } catch (err) {
    responseBody = err instanceof Error ? err.message : 'Unknown error'
  }

  return { success, statusCode, responseBody, durationMs: Date.now() - start }
}

// ---------------------------------------------------------------------------
// Retry loop
// ---------------------------------------------------------------------------

async function deliverWithRetry(
  endpointId: string,
  url: string,
  secret: string,
  payload: WebhookPayload,
  attempt = 1,
  idempotencyKey = randomBytes(16).toString('hex')
): Promise<void> {
  const outcome = await attemptDelivery({ url, secret, payload, idempotencyKey, attempt })

  let status: 'pending' | 'delivered' | 'failed' | 'dead_letter'
  let nextRetryAt: Date | null = null

  if (outcome.success) {
    status = 'delivered'
  } else if (attempt < MAX_ATTEMPTS) {
    status = 'failed'
    nextRetryAt = new Date(Date.now() + RETRY_DELAYS_MS[attempt - 1])
  } else {
    status = 'dead_letter'
  }

  await db.webhookDelivery.create({
    data: {
      endpointId,
      event: payload.event,
      payload: payload as never,
      statusCode: outcome.statusCode,
      responseBody: outcome.responseBody,
      attempt,
      success: outcome.success,
      nextRetryAt,
    },
  })

  if (status === 'failed' && nextRetryAt) {
    const delayMs = RETRY_DELAYS_MS[attempt - 1]
    setTimeout(() => {
      deliverWithRetry(endpointId, url, secret, payload, attempt + 1, idempotencyKey).catch((err) =>
        console.error(`[webhook] retry ${attempt + 1} scheduling error:`, err)
      )
    }, delayMs)
  }

  if (status === 'dead_letter') {
    console.error(
      `[webhook] dead letter — endpointId=${endpointId} event=${payload.event} id=${payload.id} attempts=${attempt}`
    )
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Find all active endpoints subscribed to `event` for `userId` and deliver concurrently.
 * Fire-and-forget safe — retries are scheduled asynchronously via setTimeout.
 *
 * NOTE: setTimeout-based retry is acceptable for low-volume paths. When QStash is
 * provisioned, replace the setTimeout block in deliverWithRetry with a QStash publish
 * call so retries survive process restarts.
 */
export async function dispatchWebhookEvent(
  userId: string,
  event: WebhookEvent,
  data: Record<string, unknown>
): Promise<void> {
  const endpoints = await db.webhookEndpoint.findMany({
    where: { userId, active: true, events: { has: event } },
    select: { id: true, url: true, secret: true },
  })

  if (endpoints.length === 0) return

  const payload: WebhookPayload = {
    id: randomBytes(16).toString('hex'),
    event,
    version: 'v1',
    createdAt: new Date().toISOString(),
    data,
  }

  await Promise.allSettled(
    endpoints.map((ep) => deliverWithRetry(ep.id, ep.url, ep.secret, payload))
  )
}
