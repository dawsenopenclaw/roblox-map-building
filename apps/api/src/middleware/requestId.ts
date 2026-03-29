/**
 * Request ID middleware for Hono.
 *
 * Generates a UUID v4 for every inbound request, attaches it to the Hono
 * context under the key 'requestId', and echoes it back in the
 * X-Request-ID response header.
 *
 * If the caller already sent an X-Request-ID header that looks like a UUID,
 * it is reused — allowing end-to-end tracing across services.
 *
 * Usage:
 *   app.use('*', requestIdMiddleware)
 *   // then in any route:
 *   const requestId = c.get('requestId') as string
 */

import type { Context, Next } from 'hono'

// ---------------------------------------------------------------------------
// UUID v4 — no external deps, crypto.randomUUID available in Node 15+
// ---------------------------------------------------------------------------

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback for older Node versions
  const { randomBytes } = require('crypto') as typeof import('crypto')
  const bytes = randomBytes(16)
  bytes[6] = (bytes[6] & 0x0f) | 0x40 // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80 // variant 1
  const hex = bytes.toString('hex')
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-')
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export async function requestIdMiddleware(c: Context, next: Next): Promise<void> {
  const incoming = c.req.header('x-request-id')
  const requestId =
    incoming && UUID_REGEX.test(incoming) ? incoming : generateUUID()

  // Make available to all downstream handlers and log helpers
  c.set('requestId', requestId)

  // Return in response so clients / load-balancers can correlate
  c.header('X-Request-ID', requestId)

  await next()
}
