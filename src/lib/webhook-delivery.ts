/**
 * Durable webhook retry processor for the Next.js app.
 *
 * processWebhookRetries() is called by the cron at
 * /api/internal/cron/webhook-retry every 5 minutes.
 * It finds failed deliveries whose nextRetryAt is now due and re-attempts them.
 *
 * Mirror of apps/api/src/lib/webhook-delivery.ts — keep in sync.
 */

import { createHmac, randomBytes } from 'crypto'
import { db } from './db'
import type { WebhookEvent, WebhookPayload } from './webhook-dispatch'

// ---------------------------------------------------------------------------
// Delivery constants (must match webhook-dispatch.ts)
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
// Public API
// ---------------------------------------------------------------------------

/**
 * Process up to `batchSize` failed webhook deliveries whose nextRetryAt is due.
 * Returns counts of processed and failed deliveries.
 */
export async function processWebhookRetries(batchSize = 50): Promise<{
  processed: number
  succeeded: number
  failed: number
  deadLettered: number
}> {
  const now = new Date()

  const pendingRetries = await db.webhookDelivery.findMany({
    where: {
      success: false,
      nextRetryAt: { lte: now },
      attempt: { lt: MAX_ATTEMPTS },
    },
    include: {
      endpoint: {
        select: { id: true, url: true, secret: true, active: true },
      },
    },
    orderBy: { nextRetryAt: 'asc' },
    take: batchSize,
  })

  let processed = 0
  let succeeded = 0
  let failed = 0
  let deadLettered = 0

  await Promise.allSettled(
    pendingRetries.map(async (delivery) => {
      const { endpoint, attempt, payload } = delivery

      // Skip deliveries for deactivated endpoints
      if (!endpoint.active) {
        processed++
        return
      }

      const nextAttempt = attempt + 1
      const idempotencyKey = randomBytes(16).toString('hex')

      const outcome = await attemptDelivery({
        url: endpoint.url,
        secret: endpoint.secret,
        payload: payload as unknown as WebhookPayload,
        idempotencyKey,
        attempt: nextAttempt,
      })

      let nextRetryAt: Date | null = null
      let status: 'delivered' | 'failed' | 'dead_letter'

      if (outcome.success) {
        status = 'delivered'
        succeeded++
      } else if (nextAttempt < MAX_ATTEMPTS) {
        status = 'failed'
        nextRetryAt = new Date(Date.now() + RETRY_DELAYS_MS[nextAttempt - 1])
        failed++
      } else {
        status = 'dead_letter'
        deadLettered++
        console.error(
          `[webhook-delivery] dead letter — endpointId=${endpoint.id} attempt=${nextAttempt}`
        )
      }

      await db.webhookDelivery.create({
        data: {
          endpointId: endpoint.id,
          event: (payload as unknown as WebhookPayload).event as WebhookEvent,
          payload: payload as never,
          statusCode: outcome.statusCode,
          responseBody: outcome.responseBody,
          attempt: nextAttempt,
          success: outcome.success,
          nextRetryAt,
        },
      })

      processed++
    })
  )

  return { processed, succeeded, failed, deadLettered }
}
