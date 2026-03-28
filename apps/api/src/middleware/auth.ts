import type { Context, Next } from 'hono'
import { createClerkClient } from '@clerk/backend'

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! })

/**
 * Hono middleware that validates Clerk JWT and sets userId + clerkId context.
 * Usage: app.use('/api/v1/*', requireAuth)
 * Access in routes: const clerkId = c.get('clerkId') as string
 */
export async function requireAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing authorization header' }, 401)
  }

  try {
    const requestState = await clerk.authenticateRequest(c.req.raw, {
      jwtKey: process.env.CLERK_JWT_KEY,
    })

    if (!requestState.isSignedIn || !requestState.toAuth().userId) {
      return c.json({ error: 'Invalid or expired token' }, 401)
    }

    const userId = requestState.toAuth().userId
    c.set('userId', userId)
    c.set('clerkId', userId)
    await next()
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }
}
