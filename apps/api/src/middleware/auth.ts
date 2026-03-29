import type { Context, Next } from 'hono'
import { createClerkClient } from '@clerk/backend'
import { createLogger } from '../lib/logger'
import { incrementCounter } from '../lib/metrics'

const log = createLogger('middleware:auth')
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! })

/**
 * Hono middleware that validates Clerk JWT and sets userId + clerkId context.
 * Usage: app.use('/api/v1/*', requireAuth)
 * Access in routes: const clerkId = c.get('clerkId') as string
 */
export async function requireAuth(c: Context, next: Next) {
  const requestId = c.get('requestId') as string | undefined
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    log.warn('auth rejected: missing bearer token', { requestId, path: c.req.path })
    incrementCounter('auth_events_total', { event: 'failed_login', reason: 'missing_token' })
    return c.json({ error: 'Missing authorization header' }, 401)
  }

  try {
    const requestState = await clerk.authenticateRequest(c.req.raw, {
      jwtKey: process.env.CLERK_JWT_KEY,
    })

    if (!requestState.isSignedIn || !requestState.toAuth().userId) {
      log.warn('auth rejected: invalid or expired token', { requestId, path: c.req.path })
      incrementCounter('auth_events_total', { event: 'failed_login', reason: 'invalid_token' })
      return c.json({ error: 'Invalid or expired token' }, 401)
    }

    const userId = requestState.toAuth().userId
    c.set('userId', userId)
    c.set('clerkId', userId)
    log.debug('auth: token verified', { requestId, userId, path: c.req.path })
    incrementCounter('auth_events_total', { event: 'login' })
    await next()
  } catch {
    log.warn('auth rejected: token verification threw', { requestId, path: c.req.path })
    incrementCounter('auth_events_total', { event: 'failed_login', reason: 'exception' })
    return c.json({ error: 'Invalid or expired token' }, 401)
  }
}
