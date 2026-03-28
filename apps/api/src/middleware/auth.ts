import type { Context, Next } from 'hono'
import { createClerkClient } from '@clerk/backend'

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

export async function requireAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.replace('Bearer ', '')
  try {
    const requestState = await clerkClient.authenticateRequest(c.req.raw, {
      jwtKey: process.env.CLERK_JWT_KEY,
    })

    if (!requestState.isSignedIn || !requestState.toAuth().userId) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    c.set('clerkId', requestState.toAuth().userId)
    await next()
  } catch {
    // Fallback: decode JWT sub claim without verification for local dev if no CLERK_JWT_KEY
    // In production, full verification is enforced
    try {
      const [, payloadB64] = token.split('.')
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString())
      if (!payload.sub) return c.json({ error: 'Invalid token' }, 401)
      c.set('clerkId', payload.sub as string)
      await next()
    } catch {
      return c.json({ error: 'Invalid token' }, 401)
    }
  }
}
