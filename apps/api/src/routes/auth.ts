import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth'
import { db } from '../lib/db'
import { createLogger } from '../lib/logger'
import { incrementCounter } from '../lib/metrics'

const log = createLogger('auth')

export const authRoutes = new Hono()

/**
 * GET /api/auth/me — returns the authenticated user's profile.
 * Requires: Authorization: Bearer <clerk-jwt>
 */
authRoutes.get('/me', requireAuth, async (c) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clerkId = (c as any).get('clerkId') as string as string
  const requestId = c.get('requestId') as string | undefined
  const userId = c.get('userId') as string | undefined
  const reqLog = log.child({ requestId, userId })

  const user = await db.user.findUnique({
    where: { clerkId },
    include: { subscription: true, tokenBalance: true },
  })
  if (!user) {
    reqLog.warn('auth/me: user not found in db', { clerkId })
    return c.json({ error: 'User not found' }, 404)
  }

  reqLog.debug('auth/me: profile fetched', { clerkId })
  incrementCounter('auth_events_total', { event: 'profile_fetch' })
  return c.json(user)
})
