import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth'
import { db } from '../lib/db'
import { createHash, randomBytes } from 'crypto'

export const apiKeyRoutes = new Hono()

const VALID_SCOPES = ['full', 'terrain-only', 'assets-only', 'read-only'] as const
type Scope = (typeof VALID_SCOPES)[number]

function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const secret = randomBytes(32).toString('hex')
  const raw = `rf_sk_${secret}`
  const prefix = `rf_sk_${secret.slice(0, 8)}`
  const hash = createHash('sha256').update(raw).digest('hex')
  return { raw, hash, prefix }
}

// GET /api/keys — list keys for authenticated user
apiKeyRoutes.get('/', requireAuth, async (c) => {
  const clerkId = (c as any).get('clerkId') as string
  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return c.json({ error: 'User not found' }, 404)

  const keys = await db.apiKey.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      name: true,
      prefix: true,
      scopes: true,
      tier: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return c.json({ keys })
})

// POST /api/keys — create a new API key
apiKeyRoutes.post('/', requireAuth, async (c) => {
  const clerkId = (c as any).get('clerkId') as string
  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return c.json({ error: 'User not found' }, 404)

  const body = await c.req.json().catch(() => null)
  if (!body) return c.json({ error: 'Invalid JSON body' }, 400)

  const { name, scopes, expiresAt } = body as {
    name?: string
    scopes?: string[]
    expiresAt?: string
  }

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return c.json({ error: 'name is required' }, 400)
  }

  const resolvedScopes: Scope[] = []
  if (Array.isArray(scopes)) {
    for (const s of scopes) {
      if (!VALID_SCOPES.includes(s as Scope)) {
        return c.json({ error: `Invalid scope: ${s}. Valid: ${VALID_SCOPES.join(', ')}` }, 400)
      }
      resolvedScopes.push(s as Scope)
    }
  }
  if (resolvedScopes.length === 0) resolvedScopes.push('read-only')

  // Check existing key count (limit 10 per user)
  const existing = await db.apiKey.count({ where: { userId: user.id } })
  if (existing >= 10) {
    return c.json({ error: 'Maximum of 10 API keys allowed per account' }, 400)
  }

  const { raw, hash, prefix } = generateApiKey()

  const key = await db.apiKey.create({
    data: {
      userId: user.id,
      name: name.trim(),
      keyHash: hash,
      prefix,
      scopes: resolvedScopes,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
    select: {
      id: true,
      name: true,
      prefix: true,
      scopes: true,
      tier: true,
      expiresAt: true,
      createdAt: true,
    },
  })

  // Return the raw key ONCE — never stored
  return c.json({ key: { ...key, rawKey: raw } }, 201)
})

// DELETE /api/keys/:id — revoke a key
apiKeyRoutes.delete('/:id', requireAuth, async (c) => {
  const clerkId = (c as any).get('clerkId') as string
  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return c.json({ error: 'User not found' }, 404)

  const id = c.req.param('id')
  const key = await db.apiKey.findFirst({ where: { id, userId: user.id } })
  if (!key) return c.json({ error: 'API key not found' }, 404)

  await db.apiKey.delete({ where: { id } })
  return c.json({ success: true })
})
