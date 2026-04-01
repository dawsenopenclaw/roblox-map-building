/**
 * Webhook dispatch for Next.js app routes.
 *
 * Thin wrapper around the shared delivery engine logic.
 * Finds all active endpoints subscribed to an event for a given user
 * and delivers with HMAC-SHA256 signing, 4-attempt retry, and dead-letter logging.
 *
 * Mirror of apps/api/src/lib/webhook-delivery.ts — keep in sync.
 *
 * RETRY ARCHITECTURE NOTE:
 *  setTimeout-based retries are unreliable in serverless environments (Vercel)
 *  because the function process is killed once the HTTP response is sent.
 *  Instead, failed deliveries store `nextRetryAt` in the DB. The cron at
 *  /api/internal/cron/webhook-retry drives retries every 5 minutes via
 *  processWebhookRetries() defined at the bottom of this file.
 */

import { createHmac, randomBytes, timingSafeEqual } from 'crypto'
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

  // Retries are driven by the webhook-retry cron (processWebhookRetries below),
  // not by setTimeout — setTimeout callbacks are dropped when the serverless
  // function exits after sending the response. The nextRetryAt written to DB
  // is the durable trigger the cron reads.

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
 * Failed deliveries write nextRetryAt to DB; the webhook-retry cron re-drives them.
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

// ---------------------------------------------------------------------------
// Cron-driven retry processor
// ---------------------------------------------------------------------------

export interface RetryProcessResult {
  processed: number
  succeeded: number
  failed: number
  deadLettered: number
}

/**
 * Process all webhook deliveries whose nextRetryAt is in the past.
 * Called from /api/internal/cron/webhook-retry every 5 minutes.
 *
 * Cursor-paginated so it never loads the entire table — safe at any scale.
 */
export async function processWebhookRetries(
  batchSize = 50
): Promise<RetryProcessResult> {
  const result: RetryProcessResult = { processed: 0, succeeded: 0, failed: 0, deadLettered: 0 }
  const now = new Date()
  let cursor: string | undefined

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const dueBatch = await db.webhookDelivery.findMany({
      where: {
        success: false,
        nextRetryAt: { lte: now },
      },
      select: {
        id: true,
        endpointId: true,
        attempt: true,
        payload: true,
        endpoint: {
          select: { url: true, secret: true, active: true },
        },
      },
      orderBy: { nextRetryAt: 'asc' },
      take: batchSize,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })

    if (dueBatch.length === 0) break

    await Promise.allSettled(
      dueBatch.map(async (delivery) => {
        result.processed++

        // Deactivated endpoint — remove from retry queue
        if (!delivery.endpoint?.active) {
          await db.webhookDelivery.update({
            where: { id: delivery.id },
            data: { nextRetryAt: null },
          })
          return
        }

        const nextAttempt = delivery.attempt + 1
        const typedPayload = delivery.payload as unknown as WebhookPayload
        const idempotencyKey = typedPayload.id

        const outcome = await attemptDelivery({
          url: delivery.endpoint.url,
          secret: delivery.endpoint.secret,
          payload: typedPayload,
          idempotencyKey,
          attempt: nextAttempt,
        })

        let nextRetryAt: Date | null = null
        if (!outcome.success && nextAttempt < MAX_ATTEMPTS) {
          nextRetryAt = new Date(Date.now() + RETRY_DELAYS_MS[nextAttempt - 1])
          result.failed++
        } else if (!outcome.success) {
          result.deadLettered++
          console.error(
            `[webhook] dead letter — endpointId=${delivery.endpointId} attempt=${nextAttempt}`
          )
        } else {
          result.succeeded++
        }

        await db.webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            attempt: nextAttempt,
            success: outcome.success,
            statusCode: outcome.statusCode,
            responseBody: outcome.responseBody,
            nextRetryAt,
          },
        })
      })
    )

    cursor = dueBatch[dueBatch.length - 1]?.id
    if (dueBatch.length < batchSize) break
  }

  return result
}
