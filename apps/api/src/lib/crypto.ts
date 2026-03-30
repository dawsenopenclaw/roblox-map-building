/**
 * Cryptographic primitives for hashing and verifying sensitive field values.
 *
 * Uses HMAC-SHA256 with a server-side key (TOKEN_HASH_SECRET) so the stored
 * digest cannot be brute-forced even when the hash algorithm is known.
 *
 * Usage:
 *   - hashSecret(value)          — produce a keyed hash for DB storage
 *   - verifySecret(plain, stored) — timing-safe check against a stored hash
 *
 * NOTE on webhook secrets:
 *   WebhookEndpoint.secret is used as the HMAC key for outbound payload
 *   signing, so it must remain raw (reversible) in the database — it is NOT
 *   a lookup token. Use hashSecret() to produce a tamper-evident digest for
 *   audit/verification UIs, but store it separately from the signing key.
 *   parentConsentToken IS a lookup token and uses hashSecret() exclusively.
 */
import { createHmac, timingSafeEqual } from 'crypto'

function getHashKey(): string {
  const key = process.env.TOKEN_HASH_SECRET
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[crypto] TOKEN_HASH_SECRET is required in production')
    }
    return 'dev-insecure-hash-key-do-not-use-in-production'
  }
  return key
}

/**
 * Produce an HMAC-SHA256 hex digest of `value` keyed with TOKEN_HASH_SECRET.
 */
export function hashSecret(value: string): string {
  return createHmac('sha256', getHashKey()).update(value).digest('hex')
}

/**
 * Timing-safe comparison of a plaintext value against a stored HMAC hash.
 * Returns true when hashSecret(plain) === stored.
 */
export function verifySecret(plain: string, stored: string): boolean {
  const candidate = hashSecret(plain)
  if (candidate.length !== stored.length) return false
  return timingSafeEqual(Buffer.from(candidate, 'utf8'), Buffer.from(stored, 'utf8'))
}
