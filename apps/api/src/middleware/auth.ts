import type { Context, Next } from 'hono'
import { createClerkClient } from '@clerk/backend'
import { createLogger } from '../lib/logger'
import { incrementCounter } from '../lib/metrics'
import { captureException } from '../lib/sentry'

const log = createLogger('middleware:auth')
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! })

// Authorized parties tell Clerk which `azp` claim values are acceptable in
// the JWT. This prevents tokens issued for a different frontend origin from
// being accepted by this API. List every domain that legitimately issues
// Clerk sessions for this service.
const AUTHORIZED_PARTIES: string[] = (process.env.CLERK_AUTHORIZED_PARTIES ?? '')
  .split(',')
  .map((p) => p.trim())
  .filter(Boolean)

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
      // Enforce authorized parties when the env var is populated.
      // In local dev the var can be left empty to skip the check.
      ...(AUTHORIZED_PARTIES.length > 0 ? { authorizedParties: AUTHORIZED_PARTIES } : {}),
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
  } catch (err) {
    // Distinguish between a JWT validation failure (expected, log as warn) and
    // an unexpected infrastructure error (log as error + capture in Sentry).
    const isAuthError =
      err instanceof Error &&
      (err.message.includes('token') ||
        err.message.includes('JWT') ||
        err.message.includes('expired') ||
        err.message.includes('invalid') ||
        err.message.includes('unauthorized'))

    if (isAuthError) {
      log.warn('auth rejected: token verification failed', { requestId, path: c.req.path, error: (err as Error).message })
      incrementCounter('auth_events_total', { event: 'failed_login', reason: 'invalid_token' })
    } else {
      log.error('auth middleware threw unexpected error', { requestId, path: c.req.path, error: (err as Error).message })
      incrementCounter('auth_events_total', { event: 'failed_login', reason: 'exception' })
      captureException(err instanceof Error ? err : new Error(String(err)), {
        path: c.req.path,
        requestId,
      })
    }

    return c.json({ error: 'Invalid or expired token' }, 401)
  }
}
