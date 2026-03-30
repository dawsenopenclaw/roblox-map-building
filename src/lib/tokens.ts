import crypto from 'crypto'
import { hashSecret } from './crypto'

export function generateConsentToken(): { token: string; expires: Date } {
  const token = crypto.randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours
  return { token, expires }
}

/**
 * Hash a single-use token for safe storage in the database.
 *
 * Uses HMAC-SHA256 (keyed with TOKEN_HASH_SECRET) rather than plain SHA-256
 * so the stored value cannot be brute-forced even if the hash algorithm is known.
 * The raw token goes into the email link; only the hash is persisted.
 */
export function hashToken(token: string): string {
  return hashSecret(token)
}
