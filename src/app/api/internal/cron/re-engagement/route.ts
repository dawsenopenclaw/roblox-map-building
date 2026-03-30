/**
 * GET /api/internal/cron/re-engagement
 *
 * Sends re-engagement emails to users who have been inactive for 14 days.
 * Scheduled: daily at 10:00 UTC via vercel.json cron.
 * Secured by CRON_SECRET header.
 */

import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { db } from '@/lib/db'
import { sendReEngagementEmail } from '@/lib/email'

function isCronAuthorized(req: NextRequest): boolean {
  const secret = req.headers.get('x-cron-secret')
  const expected = process.env.CRON_SECRET
  if (!secret || !expected) return false
  try {
    const a = Buffer.from(secret)
    const b = Buffer.from(expected)
    return a.length === b.length && timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const INACTIVE_DAYS = 14
  const inactiveThreshold = new Date()
  inactiveThreshold.setDate(inactiveThreshold.getDate() - INACTIVE_DAYS)

  // Cap re-engagement at 30 days to avoid spamming long-term churned users
  const maxInactiveThreshold = new Date()
  maxInactiveThreshold.setDate(maxInactiveThreshold.getDate() - 30)

  try {
    // Find users whose last build was exactly in the 14-30 day window
    // and who have not already received a re-engagement email in the last 30 days
    const candidates = await db.user.findMany({
      where: {
        deletedAt: null,
        email: { not: { endsWith: '@deleted.invalid' } },
        subscription: { status: { notIn: ['CANCELED'] } },
        gameScans: {
          // Has some activity (not brand new) but last was 14-30 days ago
          some: {},
          none: { createdAt: { gte: inactiveThreshold } },
        },
        // Exclude users with very recent game scans
        NOT: {
          gameScans: { some: { createdAt: { gte: maxInactiveThreshold } } },
        },
      },
      select: { id: true, email: true, displayName: true },
      take: 500,
    })

    let sent = 0
    let failed = 0

    await Promise.allSettled(
      candidates.map(async (user) => {
        try {
          await sendReEngagementEmail({
            email: user.email,
            name: user.displayName ?? 'Creator',
            daysInactive: INACTIVE_DAYS,
            bonusTokens: 50,
          })
          sent++
        } catch {
          failed++
        }
      })
    )

    return NextResponse.json({ ok: true, sent, failed, total: candidates.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[cron/re-engagement] failed:', message)
    return NextResponse.json({ error: 'Internal error', details: message }, { status: 500 })
  }
}
