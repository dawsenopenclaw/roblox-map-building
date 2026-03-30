import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST /api/email/unsubscribe
 *
 * Body: { token: string }
 *
 * Validates the one-time unsubscribe token stored against a user record and
 * records the marketing email opt-out. Tokens are single-use and should be
 * stored in the User table (or a dedicated EmailToken table) with an expiry.
 *
 * Response codes:
 *   200 — opt-out recorded
 *   400 — missing/malformed token
 *   404 — token not found or expired
 *   500 — server error
 */
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

  try {
    // Look up the token in the database.
    // Assumes a User record has an `unsubscribeToken` field (string, unique, nullable)
    // and a `marketingEmailsOptOut` boolean field (default false).
    // Adjust the field names to match your actual Prisma schema.
    const user = await db.user.findFirst({
      where: { unsubscribeToken: token },
      select: { id: true, marketingEmailsOptOut: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Token not found or expired' }, { status: 404 })
    }

    if (!user.marketingEmailsOptOut) {
      await db.user.update({
        where: { id: user.id },
        data: {
          marketingEmailsOptOut: true,
          // Rotate the token after use so the same link cannot be replayed
          unsubscribeToken: null,
        },
      })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    // Log server-side but never expose internals to the client
    console.error('[unsubscribe] db error:', err instanceof Error ? err.message : 'unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
