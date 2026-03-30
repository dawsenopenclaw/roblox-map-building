/**
 * GET /api/internal/cron/notification-archive
 *
 * Archives (deletes) read notifications older than 90 days to prevent table bloat.
 * Unread notifications are never deleted so users don't lose pending items.
 * Scheduled: daily at 03:00 UTC via vercel.json cron.
 * Secured by CRON_SECRET header.
 */

import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { db } from '@/lib/db'

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

const ARCHIVE_AFTER_DAYS = 90

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - ARCHIVE_AFTER_DAYS)

  try {
    // Only delete notifications that have been read AND are older than 90 days.
    // readAt being non-null is the signal that the user has seen the notification.
    const result = await db.notification.deleteMany({
      where: {
        readAt: { not: null, lt: cutoff },
      },
    })

    console.info(`[cron/notification-archive] archived ${result.count} read notifications older than ${ARCHIVE_AFTER_DAYS} days`)
    return NextResponse.json({ ok: true, archived: result.count, cutoff: cutoff.toISOString() })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[cron/notification-archive] failed:', message)
    return NextResponse.json({ error: 'Internal error', details: message }, { status: 500 })
  }
}
