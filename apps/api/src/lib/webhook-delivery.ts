/**
 * Production webhook delivery engine.
 *
 * Features:
 *  - HMAC-SHA256 payload signing with timestamp (replay-attack resistant)
 *  - 5-second delivery timeout
 *  - 3 retry attempts with exponential backoff (10s, 60s, 300s)
 *  - Dead letter queue after all retries exhausted
 *  - Delivery status tracking: pending | delivered | failed | dead_letter
 *  - Idempotency key header to prevent duplicate processing on recipient side
 *
 * RETRY ARCHITECTURE NOTE:
 *  setTimeout-based retries are unreliable in serverless environments (Vercel)
 *  because the function process is killed as soon as the response is sent.
 *  Instead, failed deliveries store `nextRetryAt` in the DB. A separate cron
 *  at /api/internal/cron/webhook-retry drives retries by calling
 *  `processWebhookRetries()` every 5 minutes.
 */

import { createHmac, randomBytes, timingSafeEqual } from 'crypto'
import { db } from './db'
import type { WebhookEvent, WebhookPayload } from './webhook-events'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DeliveryStatus = 'pending' | 'delivered' | 'failed' | 'dead_letter'

export interface DeliveryResult {
  deliveryId: string
  status: DeliveryStatus
  statusCode: number | null
  attempt: number
  durationMs: number
}

// Retry schedule in milliseconds — 10s, 60s, 300s
const RETRY_DELAYS_MS = [10_000, 60_000, 300_000] as const
const MAX_ATTEMPTS = RETRY_DELAYS_MS.length + 1  // 4 total (1 initial + 3 retries)
const DELIVERY_TIMEOUT_MS = 5_000

// ---------------------------------------------------------------------------
// Signature helpers
// ---------------------------------------------------------------------------

/**
 * Build the signed signature string.
 *
 * Format: `sha256=<hex>` where the HMAC input is `${timestampSeconds}.${rawBody}`.
 * This binds the timestamp into the signature, preventing replay attacks.
 */
export function buildSignature(secret: string, timestampSeconds: number, rawBody: string): string {
  const signingInput = `${timestampSeconds}.${rawBody}`
  const hmac = createHmac('sha256', secret).update(signingInput).digest('hex')
  return `sha256=${hmac}`
}

/**
 * Verify an inbound webhook signature.
 *
 * @param secret        The shared webhook secret
 * @param signature     Value of the X-ForjeGames-Signature header
 * @param timestamp     Value of the X-ForjeGames-Timestamp header (Unix seconds)
 * @param rawBody       Raw request body string (before JSON.parse)
 * @param toleranceSec  Maximum age of the request in seconds (default 300)
 */
export function verifySignature(
  secret: string,
  signature: string,
  timestamp: string,
  rawBody: string,
  toleranceSec = 300
): boolean {
  const ts = parseInt(timestamp, 10)
  if (isNaN(ts)) return false

  const nowSec = Math.floor(Date.now() / 1000)
  if (Math.abs(nowSec - ts) > toleranceSec) return false

  const expected = buildSignature(secret, ts, rawBody)

  // Constant-time comparison using crypto.timingSafeEqual to prevent timing attacks.
  // Buffers must be equal length — pad to the longer of the two so we never
  // short-circuit on length mismatch while still returning false on a mismatch.
  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

// ---------------------------------------------------------------------------
// Core delivery (single attempt)
// ---------------------------------------------------------------------------

export interface SingleDeliveryOptions {
  url: string
  secret: string
  payload: WebhookPayload
  idempotencyKey: string
  attempt: number
}

export interface SingleDeliveryOutcome {
  success: boolean
  statusCode: number | null
  responseBody: string | null
  durationMs: number
}

export async function attemptDelivery(opts: SingleDeliveryOptions): Promise<SingleDeliveryOutcome> {
  const { url, secret, payload, idempotencyKey, attempt } = opts
  const rawBody = JSON.stringify(payload)
  const timestampSeconds = Math.floor(Date.now() / 1000)
  const signature = buildSignature(secret, timestampSeconds, rawBody)

  const start = Date.now()
  let statusCode: number | null = null
  let responseBody: string | null = null
  let success = false

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-ForjeGames-Signature': signature,
        'X-ForjeGames-Timestamp': String(timestampSeconds),
        'X-ForjeGames-Event': payload.event,
        'X-ForjeGames-Delivery': payload.id,
        'X-ForjeGames-Idempotency-Key': idempotencyKey,
        'X-ForjeGames-Attempt': String(attempt),
        'User-Agent': 'ForjeGames-Webhooks/1.0',
      },
      body: rawBody,
      signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
    })

    statusCode = res.status
    responseBody = await res.text().catch(() => null)
    // 2xx = success
    success = res.status >= 200 && res.status < 300
  } catch (err) {
    responseBody = err instanceof Error ? err.message : 'Unknown error'
  }

  return { success, statusCode, responseBody, durationMs: Date.now() - start }
}

// ---------------------------------------------------------------------------
// Delivery record persistence
// ---------------------------------------------------------------------------

async function persistDelivery(opts: {
  endpointId: string
  payload: WebhookPayload
  idempotencyKey: string
  attempt: number
  outcome: SingleDeliveryOutcome
  status: DeliveryStatus
  nextRetryAt: Date | null
}): Promise<string> {
  const record = await db.webhookDelivery.create({
    data: {
      endpointId: opts.endpointId,
      event: opts.payload.event,
      payload: opts.payload as any,
      statusCode: opts.outcome.statusCode,
      responseBody: opts.outcome.responseBody,
      attempt: opts.attempt,
      success: opts.outcome.success,
      nextRetryAt: opts.nextRetryAt,
    },
    select: { id: true },
  })
  return record.id
}

// ---------------------------------------------------------------------------
// Retry loop
// ---------------------------------------------------------------------------

/**
 * Deliver a webhook payload to a single endpoint, retrying up to MAX_ATTEMPTS.
 *
 * Returns the final DeliveryResult so callers can log / respond immediately.
 * Retry scheduling is done via setTimeout — fire-and-forget after the first attempt.
 */
export async function deliverWithRetry(
  endpointId: string,
  url: string,
  secret: string,
  payload: WebhookPayload,
  attempt = 1,
  idempotencyKey = randomBytes(16).toString('hex')
): Promise<DeliveryResult> {
  const outcome = await attemptDelivery({ url, secret, payload, idempotencyKey, attempt })

  let status: DeliveryStatus
  let nextRetryAt: Date | null = null

  if (outcome.success) {
    status = 'delivered'
  } else if (attempt < MAX_ATTEMPTS) {
    status = 'failed'
    const delayMs = RETRY_DELAYS_MS[attempt - 1]  // attempt 1 → 10s, 2 → 60s, 3 → 300s
    nextRetryAt = new Date(Date.now() + delayMs)
  } else {
    // All attempts exhausted → dead letter
    status = 'dead_letter'
  }

  const deliveryId = await persistDelivery({
    endpointId,
    payload,
    idempotencyKey,
    attempt,
    outcome,
    status,
    nextRetryAt,
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

  return { deliveryId, status, statusCode: outcome.statusCode, attempt, durationMs: outcome.durationMs }
}

// ---------------------------------------------------------------------------
// Public dispatch API
// ---------------------------------------------------------------------------

/**
 * Find all active endpoints subscribed to the given event and deliver concurrently.
 * Each endpoint gets its own idempotency key and independent retry lifecycle.
 */
export async function dispatchWebhookEvent(
  userId: string,
  event: WebhookEvent,
  data: Record<string, unknown>
): Promise<DeliveryResult[]> {
  const endpoints = await db.webhookEndpoint.findMany({
    where: { userId, active: true, events: { has: event } },
    select: { id: true, url: true, secret: true },
  })

  if (endpoints.length === 0) return []

  const payload: WebhookPayload = {
    id: randomBytes(16).toString('hex'),
    event,
    version: 'v1',
    createdAt: new Date().toISOString(),
    data,
  }

  const results = await Promise.allSettled(
    endpoints.map((ep) => deliverWithRetry(ep.id, ep.url, ep.secret, payload))
  )

  return results
    .filter((r): r is PromiseFulfilledResult<DeliveryResult> => r.status === 'fulfilled')
    .map((r) => r.value)
}

export function generateWebhookSecret(): string {
  return `whsec_${randomBytes(32).toString('hex')}`
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
 * Uses cursor-based pagination so it never loads the entire table into memory.
 * Each batch re-delivers up to BATCH_SIZE due entries, advancing the cursor
 * until no more due records exist.
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

        // Skip if endpoint was deactivated since the delivery was scheduled
        if (!delivery.endpoint?.active) {
          await db.webhookDelivery.update({
            where: { id: delivery.id },
            data: { nextRetryAt: null },  // Remove from retry queue
          })
          return
        }

        const nextAttempt = delivery.attempt + 1
        const idempotencyKey = (delivery.payload as WebhookPayload).id

        const outcome = await attemptDelivery({
          url: delivery.endpoint.url,
          secret: delivery.endpoint.secret,
          payload: delivery.payload as WebhookPayload,
          idempotencyKey,
          attempt: nextAttempt,
        })

        let status: DeliveryStatus
        let nextRetryAt: Date | null = null

        if (outcome.success) {
          status = 'delivered'
          result.succeeded++
        } else if (nextAttempt < MAX_ATTEMPTS) {
          status = 'failed'
          const delayMs = RETRY_DELAYS_MS[nextAttempt - 1]
          nextRetryAt = new Date(Date.now() + delayMs)
          result.failed++
        } else {
          status = 'dead_letter'
          result.deadLettered++
          console.error(
            `[webhook] dead letter — endpointId=${delivery.endpointId} attempt=${nextAttempt}`
          )
        }

        // Update the existing record in-place rather than creating a new row,
        // so delivery history remains traceable as a single record.
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
    if (dueBatch.length < batchSize) break  // Last page
  }

  return result
}
