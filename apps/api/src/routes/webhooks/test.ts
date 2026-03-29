/**
 * POST /api/webhooks/:id/test
 *
 * Sends a one-shot test event to the specified endpoint and returns the delivery
 * result immediately.  No retries — test deliveries are diagnostic only.
 *
 * Real HMAC signing is used so consumers can validate their verification logic
 * before going to production.
 */

import { Hono } from 'hono'
import { randomBytes } from 'crypto'
import { requireAuth } from '../../middleware/auth'
import { db } from '../../lib/db'
import { attemptDelivery } from '../../lib/webhook-delivery'
import { WEBHOOK_EVENT_CATALOG, type WebhookEvent } from '../../lib/webhook-events'

export const webhookTestRoutes = new Hono()

// POST /api/webhooks/:id/test
webhookTestRoutes.post('/:id/test', requireAuth, async (c) => {
  const clerkId = (c as any).get('clerkId') as string
  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return c.json({ error: 'User not found' }, 404)

  const endpointId = c.req.param('id')
  const endpoint = await db.webhookEndpoint.findFirst({
    where: { id: endpointId, userId: user.id },
    select: { id: true, url: true, secret: true, events: true, active: true },
  })
  if (!endpoint) return c.json({ error: 'Webhook endpoint not found' }, 404)

  // Caller may request a specific event; default to first subscribed event
  const body = await c.req.json().catch(() => ({}))
  const requestedEvent = (body as any)?.event as string | undefined

  let testEvent: WebhookEvent
  if (requestedEvent) {
    if (!endpoint.events.includes(requestedEvent)) {
      return c.json({ error: `Endpoint is not subscribed to event: ${requestedEvent}` }, 400)
    }
    if (!(requestedEvent in WEBHOOK_EVENT_CATALOG)) {
      return c.json({ error: `Unknown event: ${requestedEvent}` }, 400)
    }
    testEvent = requestedEvent as WebhookEvent
  } else {
    testEvent = (endpoint.events[0] ?? 'build.completed') as WebhookEvent
  }

  const definition = WEBHOOK_EVENT_CATALOG[testEvent]
  const idempotencyKey = `test_${randomBytes(16).toString('hex')}`

  const payload = {
    id: randomBytes(16).toString('hex'),
    event: testEvent,
    version: 'v1' as const,
    createdAt: new Date().toISOString(),
    // Realistic sample data so recipients can validate their parsing
    data: { ...definition.sampleData, _test: true },
  }

  const outcome = await attemptDelivery({
    url: endpoint.url,
    secret: endpoint.secret,
    payload,
    idempotencyKey,
    attempt: 1,
  })

  // Persist delivery record (no retry scheduling — test is one-shot)
  const delivery = await db.webhookDelivery.create({
    data: {
      endpointId: endpoint.id,
      event: payload.event,
      payload: payload as any,
      statusCode: outcome.statusCode,
      responseBody: outcome.responseBody,
      attempt: 1,
      success: outcome.success,
      nextRetryAt: null,
    },
    select: {
      id: true,
      statusCode: true,
      success: true,
      responseBody: true,
      createdAt: true,
    },
  })

  return c.json({
    delivery: {
      ...delivery,
      durationMs: outcome.durationMs,
      status: outcome.success ? 'delivered' : 'failed',
      eventSent: testEvent,
      endpointUrl: endpoint.url,
      idempotencyKey,
    },
  })
})
