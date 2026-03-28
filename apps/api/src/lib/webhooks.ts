import { createHmac, randomBytes } from 'crypto'
import { db } from './db'

export type WebhookEvent =
  | 'build.completed'
  | 'build.failed'
  | 'template.sold'
  | 'token.low'

export interface WebhookPayload {
  id: string
  event: WebhookEvent
  createdAt: string
  data: Record<string, unknown>
}

function signPayload(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex')
}

async function deliverWebhook(
  endpointId: string,
  url: string,
  secret: string,
  payload: WebhookPayload,
  attempt: number
): Promise<void> {
  const body = JSON.stringify(payload)
  const signature = signPayload(secret, body)

  let statusCode: number | null = null
  let responseBody: string | null = null
  let success = false

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RobloxForge-Signature': `sha256=${signature}`,
        'X-RobloxForge-Event': payload.event,
        'X-RobloxForge-Delivery': payload.id,
      },
      body,
      signal: AbortSignal.timeout(10_000),
    })

    statusCode = res.status
    responseBody = await res.text().catch(() => null)
    success = res.ok
  } catch (err) {
    responseBody = err instanceof Error ? err.message : 'Unknown error'
  }

  await db.webhookDelivery.create({
    data: {
      endpointId,
      event: payload.event,
      payload: payload as any,
      statusCode,
      responseBody,
      attempt,
      success,
    },
  })

  if (!success && attempt < 3) {
    // Exponential backoff: 5s, 25s
    const delayMs = Math.pow(5, attempt) * 1000
    setTimeout(() => {
      deliverWebhook(endpointId, url, secret, payload, attempt + 1)
    }, delayMs)
  }
}

export async function dispatchWebhookEvent(
  userId: string,
  event: WebhookEvent,
  data: Record<string, unknown>
): Promise<void> {
  const endpoints = await db.webhookEndpoint.findMany({
    where: {
      userId,
      active: true,
      events: { has: event },
    },
  })

  if (endpoints.length === 0) return

  const payload: WebhookPayload = {
    id: randomBytes(16).toString('hex'),
    event,
    createdAt: new Date().toISOString(),
    data,
  }

  await Promise.allSettled(
    endpoints.map((ep) => deliverWebhook(ep.id, ep.url, ep.secret, payload, 1))
  )
}

export function generateWebhookSecret(): string {
  return randomBytes(32).toString('hex')
}
