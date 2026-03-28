import type { MiddlewareHandler } from 'hono'
import { corsMiddleware } from './cors'
import { rateLimit } from './rateLimit'
import { auditMiddleware } from './audit'

// Standard API rate limit: 100 req/min per user/IP
export const apiRateLimit = rateLimit(100, 60)

// Strict rate limit for auth endpoints: 10 req/min
export const authRateLimit = rateLimit(10, 60)

// Strict rate limit for AI endpoints: 20 req/min
export const aiRateLimit = rateLimit(20, 60)

// Webhook endpoints: 200 req/min (high volume from Stripe/Clerk)
export const webhookRateLimit = rateLimit(200, 60)

export { corsMiddleware, auditMiddleware }

// Apply all security middleware at once for standard API routes
export function applySecurityMiddleware(app: {
  use: (path: string, ...handlers: MiddlewareHandler[]) => void
}) {
  app.use('*', corsMiddleware)
  app.use('/api/*', apiRateLimit)
  app.use('/api/*', auditMiddleware)
}
