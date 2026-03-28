import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth'
import { db } from '../lib/db'
import { generateWebhookSecret } from '../lib/webhooks'

export const webhookRoutes = new Hono()

const VALID_EVENTS = ['build.completed', 'build.failed', 'template.sold', 'token.low'] as const

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

  return c.json({ endpoints })
})

// POST /api/webhooks — create endpoint
webhookRoutes.post('/', requireAuth, async (c) => {
  const clerkId = (c as any).get('clerkId') as string
  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return c.json({ error: 'User not found' }, 404)

  const body = await c.req.json().catch(() => null)
  if (!body) return c.json({ error: 'Invalid JSON body' }, 400)

  const { url, events } = body as { url?: string; events?: string[] }

  if (!url || typeof url !== 'string') {
    return c.json({ error: 'url is required' }, 400)
  }

  try {
    new URL(url)
  } catch {
    return c.json({ error: 'url must be a valid URL' }, 400)
  }

  if (!url.startsWith('https://')) {
    return c.json({ error: 'url must use HTTPS' }, 400)
  }

  const resolvedEvents: string[] = []
  if (Array.isArray(events)) {
    for (const e of events) {
      if (!VALID_EVENTS.includes(e as any)) {
        return c.json({ error: `Invalid event: ${e}. Valid: ${VALID_EVENTS.join(', ')}` }, 400)
      }
      resolvedEvents.push(e)
    }
  }
  if (resolvedEvents.length === 0) resolvedEvents.push(...VALID_EVENTS)

  const count = await db.webhookEndpoint.count({ where: { userId: user.id } })
  if (count >= 5) {
    return c.json({ error: 'Maximum of 5 webhook endpoints allowed per account' }, 400)
  }

  const secret = generateWebhookSecret()

  const endpoint = await db.webhookEndpoint.create({
    data: {
      userId: user.id,
      url,
      secret,
      events: resolvedEvents,
    },
    select: {
      id: true,
      url: true,
      events: true,
      active: true,
      createdAt: true,
    },
  })

  // Return secret ONCE on creation
  return c.json({ endpoint: { ...endpoint, secret } }, 201)
})

// DELETE /api/webhooks/:id — delete endpoint
webhookRoutes.delete('/:id', requireAuth, async (c) => {
  const clerkId = (c as any).get('clerkId') as string
  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return c.json({ error: 'User not found' }, 404)

  const id = c.req.param('id')
  const endpoint = await db.webhookEndpoint.findFirst({ where: { id, userId: user.id } })
  if (!endpoint) return c.json({ error: 'Webhook endpoint not found' }, 404)

  await db.webhookEndpoint.delete({ where: { id } })
  return c.json({ success: true })
})
