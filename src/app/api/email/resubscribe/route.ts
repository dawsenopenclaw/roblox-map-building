import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import * as Sentry from '@sentry/nextjs'
import { db } from '@/lib/db'
import { parseBody } from '@/lib/validations'
import { z } from 'zod'

/**
 * POST /api/email/resubscribe
 *
 * Body: { token: string }
 *
 * Uses the same HMAC token as /api/email/unsubscribe so no new token
 * format is required. Sets marketingEmailsOptOut = false.
 *
 * Response codes:
 *   200 — opt-in recorded
 *   400 — missing/malformed token
 *   401 — invalid token signature
 *   404 — user not found
 *   500 — server error
 */

const resubscribeSchema = z.object({
  token: z.string().min(8, 'token is required'),
})

const SECRET = process.env.UNSUBSCRIBE_SECRET ?? process.env.AUTH_SECRET ?? 'default-secret'

function signUserId(userId: string): string {
  return createHmac('sha256', SECRET).update(userId).digest('base64url')
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
  const parsed = await parseBody(request, resubscribeSchema)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  }
  const token = parsed.data.token.trim()

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

    await db.user.update({
      where: { id: userId },
      data: { marketingEmailsOptOut: false },
    })

    try {
      const { getPostHogClient } = await import('@/lib/posthog')
      const ph = getPostHogClient()
      if (ph) {
        ph.identify({
          distinctId: userId,
          properties: { marketing_emails_opt_out: false },
        })
      }
    } catch {
      // Analytics failure must not block the resubscribe response
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'email/resubscribe' } })
    console.error('[resubscribe] error:', err instanceof Error ? err.message : 'unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
