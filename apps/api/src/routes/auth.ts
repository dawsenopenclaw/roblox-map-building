import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth'
import { db } from '../lib/db'

export const authRoutes = new Hono()

/**
 * GET /api/auth/me — returns the authenticated user's profile.
 * Requires: Authorization: Bearer <clerk-jwt>
 */
authRoutes.get('/me', requireAuth, async (c) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clerkId = (c as any).get('clerkId') as string as string
  const user = await db.user.findUnique({
    where: { clerkId },
    include: { subscription: true, tokenBalance: true },
  })
  if (!user) return c.json({ error: 'User not found' }, 404)
  return c.json(user)
})
