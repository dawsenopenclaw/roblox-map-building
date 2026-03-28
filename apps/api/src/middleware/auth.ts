import type { Context, Next } from 'hono'
import { createClerkClient } from '@clerk/backend'

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! })

/**
 * Hono middleware that validates Clerk JWT and sets userId + clerkId context.
 * Usage: app.use('/api/v1/*', requireAuth)
 * Access in routes: const clerkId = c.get('clerkId')
 */
export async function requireAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing authorization header' }, 401)
  }
  const token = authHeader.slice(7)
  try {
    const payload = await clerk.verifyToken(token)
    c.set('userId', payload.sub)
    c.set('clerkId', payload.sub)
    await next()
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }
}
