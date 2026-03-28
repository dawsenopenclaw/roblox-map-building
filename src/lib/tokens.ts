import crypto from 'crypto'

export function generateConsentToken(): { token: string; expires: Date } {
  const token = crypto.randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours
  return { token, expires }
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}
