/**
 * Cryptographic primitives for hashing and verifying sensitive field values.
 *
 * Uses HMAC-SHA256 with a server-side key so that the hashed output is
 * unguessable even if an attacker knows the input (unlike plain SHA-256).
 *
 * Usage:
 *   - `hashSecret(value)`  — produce a keyed hash to store in the database
 *   - `verifySecret(plain, stored)` — timing-safe comparison against a stored hash
 *
 * Required env var: TOKEN_HASH_SECRET — a high-entropy secret key, at least 32 chars.
 * Falls back to a dev placeholder when the var is absent (non-production only).
 */
import { createHmac, timingSafeEqual } from 'crypto'

// ---------------------------------------------------------------------------
// Key resolution
// ---------------------------------------------------------------------------

function getHashKey(): string {
  const key = process.env.TOKEN_HASH_SECRET
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[crypto] TOKEN_HASH_SECRET is required in production')
    }
    // Dev / test fallback — clearly not a secret, prevents accidental prod use
    return 'dev-insecure-hash-key-do-not-use-in-production'
  }
  return key
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Produce an HMAC-SHA256 hex digest of `value` keyed with TOKEN_HASH_SECRET.
 *
 * Safe to store in the database as the canonical representation of a sensitive
 * field (e.g., a single-use email token) that will only ever be compared, never
 * decrypted.
 */
export function hashSecret(value: string): string {
  return createHmac('sha256', getHashKey()).update(value).digest('hex')
}

/**
 * Timing-safe comparison of a plaintext value against a stored HMAC hash.
 *
 * Returns `true` when `hashSecret(plain) === stored`.
 * Always runs in constant time to prevent timing-based secret recovery.
 */
export function verifySecret(plain: string, stored: string): boolean {
  const candidate = hashSecret(plain)
  // Both buffers must be the same byte length for timingSafeEqual
  if (candidate.length !== stored.length) return false
  return timingSafeEqual(Buffer.from(candidate, 'utf8'), Buffer.from(stored, 'utf8'))
}
