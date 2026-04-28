/**
 * API Key authentication for external integrations (MCP servers, CLI, etc.)
 *
 * Keys are stored as SHA-256 hashes in the DB. The raw key is only shown once
 * at creation time. Format: `fj_live_<32 hex chars>` (prefix `fj_live_` for easy identification).
 */

import { createHash, randomBytes } from 'crypto'
import { db } from '@/lib/db'

const KEY_PREFIX = 'fj_live_'

/** Generate a new API key. Returns the raw key (show once) and its hash. */
export function generateApiKey(): { rawKey: string; keyHash: string; prefix: string } {
  const secret = randomBytes(24).toString('hex') // 48 hex chars
  const rawKey = `${KEY_PREFIX}${secret}`
  const keyHash = hashKey(rawKey)
  const prefix = rawKey.slice(0, 12) + '...' // "fj_live_abcd..."
  return { rawKey, keyHash, prefix }
}

/** Hash a raw API key for storage/lookup. */
export function hashKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex')
}

export interface ApiKeyUser {
  userId: string       // Internal DB user ID
  keyId: string        // API key record ID
  scopes: string[]     // Granted scopes
  tier: string         // API key tier
}

/**
 * Verify a raw API key from an Authorization header.
 * Returns the associated user info or null if invalid.
 */
export async function verifyApiKey(rawKey: string): Promise<ApiKeyUser | null> {
  if (!rawKey.startsWith(KEY_PREFIX)) return null

  const hash = hashKey(rawKey)

  try {
    const key = await db.apiKey.findUnique({
      where: { keyHash: hash },
      select: {
        id: true,
        userId: true,
        scopes: true,
        tier: true,
        revokedAt: true,
        expiresAt: true,
      },
    })

    if (!key) return null
    if (key.revokedAt) return null
    if (key.expiresAt && key.expiresAt < new Date()) return null

    // Update last used timestamp (fire-and-forget)
    db.apiKey.update({
      where: { id: key.id },
      data: { lastUsedAt: new Date() },
    }).catch(() => {})

    return {
      userId: key.userId,
      keyId: key.id,
      scopes: key.scopes,
      tier: key.tier,
    }
  } catch {
    return null
  }
}

/**
 * Extract API key from request. Checks:
 * 1. Authorization: Bearer fj_live_...
 * 2. X-API-Key: fj_live_...
 */
export function extractApiKey(req: Request): string | null {
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer fj_live_')) {
    return authHeader.slice(7) // Remove "Bearer "
  }

  const xApiKey = req.headers.get('x-api-key')
  if (xApiKey?.startsWith('fj_live_')) {
    return xApiKey
  }

  return null
}
