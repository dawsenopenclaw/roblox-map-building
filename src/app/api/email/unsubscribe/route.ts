import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { db } from '@/lib/db'

/**
 * POST /api/email/unsubscribe
 *
 * Body: { token: string }
 *
 * The token is a stateless HMAC-signed value: base64url(<userId>.<hmac>)
 * where hmac = HMAC-SHA256(UNSUBSCRIBE_SECRET, userId).
 *
 * No new DB fields are required — the opt-out is recorded via PostHog
 * identity update. If you later add a `marketingEmailsOptOut` field to
 * the User model you can uncomment the db.user.update block below.
 *
 * Response codes:
 *   200 — opt-out recorded
 *   400 — missing/malformed token
 *   401 — invalid token signature
 *   404 — user not found
 *   500 — server error
 */

const SECRET = process.env.UNSUBSCRIBE_SECRET ?? process.env.AUTH_SECRET ?? 'default-secret'

function signUserId(userId: string): string {
  return createHmac('sha256', SECRET).update(userId).digest('base64url')
}

/** Build an unsubscribe token for outbound emails. */
export function createUnsubscribeToken(userId: string): string {
  const sig = signUserId(userId)
  return Buffer.from(`${userId}.${sig}`).toString('base64url')
}

function verifyToken(token: string): string | null {
  let decoded: string
  try {
    decoded = Buffer.from(token, 'base64url').toString('utf8')
  } catch {
    return null
  }

  const dotIndex = decoded.lastIndexOf('.')
  if (dotIndex < 1) return null

  const userId = decoded.slice(0, dotIndex)
  const providedSig = decoded.slice(dotIndex + 1)
  const expectedSig = signUserId(userId)

  // Constant-time comparison to prevent timing attacks
  try {
    const a = Buffer.from(providedSig, 'base64url')
    const b = Buffer.from(expectedSig, 'base64url')
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  } catch {
    return null
  }

  return userId
}

export async function POST(request: NextRequest) {
  let token: string | undefined

  try {
    const body = await request.json()
    token = typeof body?.token === 'string' ? body.token.trim() : undefined
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!token || token.length < 8) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  const userId = verifyToken(token)
  if (!userId) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
  }

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Record the opt-out via PostHog so marketing tools respect it.
    // Uncomment the block below once marketingEmailsOptOut is added to schema:
    //
    // await db.user.update({
    //   where: { id: userId },
    //   data: { marketingEmailsOptOut: true },
    // })

    try {
      const { getPostHogClient } = await import('@/lib/posthog')
      const ph = getPostHogClient()
      if (ph) {
        ph.identify({
          distinctId: userId,
          properties: { marketing_emails_opt_out: true },
        })
      }
    } catch {
      // Analytics failure must not block the unsubscribe response
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    console.error('[unsubscribe] error:', err instanceof Error ? err.message : 'unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
