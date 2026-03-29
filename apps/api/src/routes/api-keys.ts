import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { requireAuth } from '../middleware/auth'
import { db } from '../lib/db'
import { createHash, randomBytes } from 'crypto'
import { apiKeyCreateSchema } from '../lib/validators'
import { apiKeyUsageRoutes } from './api-keys/usage'

export const apiKeyRoutes = new Hono()

// Mount usage sub-routes (GET /api/keys/:id/usage)
apiKeyRoutes.route('/', apiKeyUsageRoutes)

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
apiKeyRoutes.post('/', requireAuth, zValidator('json', apiKeyCreateSchema), async (c) => {
  const clerkId = (c as any).get('clerkId') as string
  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return c.json({ error: 'User not found' }, 404)

  const { name, scopes, expiresAt } = c.req.valid('json')

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
      scopes: scopes as Scope[],
      expiresAt: expiresAt ?? null,
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

// POST /api/keys/:id/rotate — rotate a key (generates new key, old key valid for 24h grace)
apiKeyRoutes.post('/:id/rotate', requireAuth, async (c) => {
  const clerkId = (c as any).get('clerkId') as string
  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return c.json({ error: 'User not found' }, 404)

  const id = c.req.param('id')
  const oldKey = await db.apiKey.findFirst({
    where: { id, userId: user.id, revokedAt: null },
    select: { id: true, name: true, scopes: true, tier: true, expiresAt: true },
  })
  if (!oldKey) return c.json({ error: 'API key not found or already revoked' }, 404)

  const graceEndsAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const { raw, hash, prefix } = generateApiKey()

  // Create the new key, mark old key as entering grace period
  const [newKey] = await db.$transaction([
    db.apiKey.create({
      data: {
        userId: user.id,
        name: oldKey.name,
        keyHash: hash,
        prefix,
        scopes: oldKey.scopes,
        tier: oldKey.tier,
        expiresAt: oldKey.expiresAt,
        rotatedFromId: oldKey.id,
        rotatedFromGraceEndsAt: graceEndsAt,
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
    }),
    // Mark old key as revoked at grace end (soft-revoke: set revokedAt = graceEndsAt)
    db.apiKey.update({
      where: { id: oldKey.id },
      data: { revokedAt: graceEndsAt },
    }),
  ])

  return c.json({
    key: { ...newKey, rawKey: raw },
    rotation: {
      oldKeyId: oldKey.id,
      graceEndsAt: graceEndsAt.toISOString(),
      message: 'Old key will stop working after 24 hours. Update your integrations before then.',
    },
  })
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
