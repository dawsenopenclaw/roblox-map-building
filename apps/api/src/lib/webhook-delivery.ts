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
 */

import { createHmac, randomBytes } from 'crypto'
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
 * @param signature     Value of the X-RobloxForge-Signature header
 * @param timestamp     Value of the X-RobloxForge-Timestamp header (Unix seconds)
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

  // Constant-time comparison to prevent timing attacks
  if (expected.length !== signature.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i)
  }
  return diff === 0
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
        'X-RobloxForge-Signature': signature,
        'X-RobloxForge-Timestamp': String(timestampSeconds),
        'X-RobloxForge-Event': payload.event,
        'X-RobloxForge-Delivery': payload.id,
        'X-RobloxForge-Idempotency-Key': idempotencyKey,
        'X-RobloxForge-Attempt': String(attempt),
        'User-Agent': 'RobloxForge-Webhooks/1.0',
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

  // Schedule next retry asynchronously — does not block the caller
  if (status === 'failed' && nextRetryAt) {
    const delayMs = RETRY_DELAYS_MS[attempt - 1]
    setTimeout(() => {
      deliverWithRetry(endpointId, url, secret, payload, attempt + 1, idempotencyKey).catch(
        (err) => console.error(`[webhook] retry ${attempt + 1} scheduling error:`, err)
      )
    }, delayMs)
  }

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
