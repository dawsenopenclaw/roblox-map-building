import type { Context, Next } from 'hono'
import { db } from '../lib/db'

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export async function auditMiddleware(c: Context, next: Next) {
  await next()
  if (!MUTATING_METHODS.has(c.req.method)) return
  const userId = c.get('userId') as string | undefined
  try {
    await db.auditLog.create({
      data: {
        userId: userId || null,
        action: `${c.req.method} ${c.req.path}`,
        resource: c.req.path.split('/')[2] || 'unknown',
        ipAddress: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
        userAgent: c.req.header('user-agent'),
        metadata: { status: c.res.status },
      },
    })
  } catch (e) {
    // audit failures must never break the request
    console.error('Audit log failed:', e)
  }
}
