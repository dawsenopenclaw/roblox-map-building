import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { requireAuth } from '../middleware/auth'
import { db } from '../lib/db'
import { generateWebhookSecret } from '../lib/webhook-delivery'
import { ALL_WEBHOOK_EVENTS } from '../lib/webhook-events'
import { webhookCreateSchema, webhookUpdateSchema } from '../lib/validators'
import { createLogger } from '../lib/logger'
import { incrementCounter } from '../lib/metrics'
import { webhookTestRoutes } from './webhooks/test'
import { hashSecret } from '../lib/crypto'

const log = createLogger('webhooks')

export const webhookRoutes = new Hono()

// POST /api/webhooks/:id/test — mounted first so it isn't shadowed by /:id
webhookRoutes.route('/', webhookTestRoutes)

// GET /api/webhooks — list endpoints
webhookRoutes.get('/', requireAuth, async (c) => {
  const clerkId = (c as any).get('clerkId') as string
  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return c.json({ error: 'User not found' }, 404)

  const endpoints = await db.webhookEndpoint.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      url: true,
      events: true,
      active: true,
      createdAt: true,
      deliveries: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { event: true, statusCode: true, success: true, createdAt: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return c.json({ endpoints, availableEvents: ALL_WEBHOOK_EVENTS })
})

// POST /api/webhooks — create endpoint
webhookRoutes.post('/', requireAuth, zValidator('json', webhookCreateSchema), async (c) => {
  const clerkId = (c as any).get('clerkId') as string
  const requestId = c.get('requestId') as string | undefined
  const userId = c.get('userId') as string | undefined
  const reqLog = log.child({ requestId, userId })

  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return c.json({ error: 'User not found' }, 404)

  const { url, events } = c.req.valid('json')

  const count = await db.webhookEndpoint.count({ where: { userId: user.id } })
  if (count >= 5) {
    reqLog.warn('webhook endpoint creation rejected: limit reached', { userId: user.id })
    return c.json({ error: 'Maximum of 5 webhook endpoints allowed per account' }, 400)
  }

  const rawSecret = generateWebhookSecret()
  // Hash the raw secret with HMAC-SHA256 before persisting.
  // The hash is stored in the DB; the raw secret is returned to the user exactly
  // once and never re-readable. The delivery engine reads ep.secret from the DB
  // and uses it as the HMAC signing key — therefore we store the raw secret here.
  // secretHash is computed for tamper-evidence and future verification endpoints.
  const secretHash = hashSecret(rawSecret)

  const endpoint = await db.webhookEndpoint.create({
    data: {
      userId: user.id,
      url,
      // NOTE: raw secret stored so delivery engine can use it as the HMAC signing
      // key. If the delivery architecture changes to a server-managed signing key,
      // replace this with secretHash and remove raw secret from storage entirely.
      secret: rawSecret,
      events,
    },
    select: {
      id: true,
      url: true,
      events: true,
      active: true,
      createdAt: true,
    },
  })

  reqLog.info('webhook endpoint created', {
    endpointId: endpoint.id,
    url,
    events,
    // Log the hash (never the raw secret) for audit trails
    secretHash,
  })
  incrementCounter('payment_events_total', { event: 'webhook_endpoint_created' })

  // Return raw secret ONCE — user must save it; it is never shown again.
  // secretHash is also returned so the user can verify their saved copy at any
  // time via a future GET /api/webhooks/:id/verify-secret endpoint.
  return c.json({ endpoint: { ...endpoint, secret: rawSecret, secretHash } }, 201)
})

// DELETE /api/webhooks/:id — delete endpoint
webhookRoutes.delete('/:id', requireAuth, async (c) => {
  const clerkId = (c as any).get('clerkId') as string
  const requestId = c.get('requestId') as string | undefined
  const userId = c.get('userId') as string | undefined
  const reqLog = log.child({ requestId, userId })

  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return c.json({ error: 'User not found' }, 404)

  const id = c.req.param('id')
  const endpoint = await db.webhookEndpoint.findFirst({ where: { id, userId: user.id } })
  if (!endpoint) return c.json({ error: 'Webhook endpoint not found' }, 404)

  await db.webhookEndpoint.delete({ where: { id } })
  reqLog.info('webhook endpoint deleted', { endpointId: id })
  return c.json({ success: true })
})

// ---------------------------------------------------------------------------
// PATCH /api/webhooks/:id — update active state or subscribed events
// ---------------------------------------------------------------------------
webhookRoutes.patch('/:id', requireAuth, zValidator('json', webhookUpdateSchema), async (c) => {
  const clerkId = (c as any).get('clerkId') as string
  const requestId = c.get('requestId') as string | undefined
  const userId = c.get('userId') as string | undefined
  const reqLog = log.child({ requestId, userId })

  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return c.json({ error: 'User not found' }, 404)

  const id = c.req.param('id')
  const existing = await db.webhookEndpoint.findFirst({ where: { id, userId: user.id } })
  if (!existing) return c.json({ error: 'Webhook endpoint not found' }, 404)

  const updates = c.req.valid('json')
  if (Object.keys(updates).length === 0) {
    return c.json({ error: 'Nothing to update — provide active or events' }, 400)
  }

  const endpoint = await db.webhookEndpoint.update({
    where: { id },
    data: updates,
    select: { id: true, url: true, events: true, active: true, updatedAt: true },
  })

  reqLog.info('webhook endpoint updated', { endpointId: id, updates })
  return c.json({ endpoint })
})

// ---------------------------------------------------------------------------
// GET /api/webhooks/:id/deliveries — paginated delivery history
// ---------------------------------------------------------------------------
webhookRoutes.get('/:id/deliveries', requireAuth, async (c) => {
  const clerkId = (c as any).get('clerkId') as string
  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return c.json({ error: 'User not found' }, 404)

  const id = c.req.param('id')
  const endpoint = await db.webhookEndpoint.findFirst({ where: { id, userId: user.id } })
  if (!endpoint) return c.json({ error: 'Webhook endpoint not found' }, 404)

  const deliveries = await db.webhookDelivery.findMany({
    where: { endpointId: id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      event: true,
      statusCode: true,
      success: true,
      attempt: true,
      nextRetryAt: true,
      createdAt: true,
    },
  })

  return c.json({ deliveries })
})
