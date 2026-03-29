import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth'
import { db } from '../lib/db'
import { notificationSSERoutes } from './notifications/sse'

export const notificationRoutes = new Hono()

// Mount SSE sub-router — handles GET /api/notifications/stream
notificationRoutes.route('/', notificationSSERoutes)

// GET /api/notifications — list notifications
notificationRoutes.get('/', requireAuth, async (c) => {
  const clerkId = (c as any).get('clerkId') as string
  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return c.json({ error: 'User not found' }, 404)

  const cursor = c.req.query('cursor')
  const limit = Math.min(parseInt(c.req.query('limit') ?? '20', 10), 50)

  const notifications = await db.notification.findMany({
    where: {
      userId: user.id,
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
  })

  const hasMore = notifications.length > limit
  if (hasMore) notifications.pop()

  const unreadCount = await db.notification.count({
    where: { userId: user.id, read: false },
  })

  return c.json({
    notifications,
    unreadCount,
    hasMore,
    nextCursor: hasMore
      ? notifications[notifications.length - 1]?.createdAt.toISOString()
      : null,
  })
})

// PUT /api/notifications/:id/read — mark single notification read
notificationRoutes.put('/:id/read', requireAuth, async (c) => {
  const clerkId = (c as any).get('clerkId') as string
  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return c.json({ error: 'User not found' }, 404)

  const id = c.req.param('id')
  const notification = await db.notification.findFirst({
    where: { id, userId: user.id },
  })
  if (!notification) return c.json({ error: 'Notification not found' }, 404)

  await db.notification.update({ where: { id }, data: { read: true } })
  return c.json({ success: true })
})

// PUT /api/notifications/read-all — mark all notifications read
notificationRoutes.put('/read-all', requireAuth, async (c) => {
  const clerkId = (c as any).get('clerkId') as string
  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return c.json({ error: 'User not found' }, 404)

  await db.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  })

  return c.json({ success: true })
})

// DELETE /api/notifications/:id — dismiss (delete) a notification
notificationRoutes.delete('/:id', requireAuth, async (c) => {
  const clerkId = (c as any).get('clerkId') as string
  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return c.json({ error: 'User not found' }, 404)

  const id = c.req.param('id')
  const notification = await db.notification.findFirst({
    where: { id, userId: user.id },
  })
  if (!notification) return c.json({ error: 'Notification not found' }, 404)

  await db.notification.delete({ where: { id } })
  return c.json({ success: true })
})
