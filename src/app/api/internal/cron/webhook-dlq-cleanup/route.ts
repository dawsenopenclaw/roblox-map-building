/**
 * GET /api/internal/cron/webhook-dlq-cleanup
 *
 * Deletes webhook deliveries that entered dead_letter status more than 30 days ago.
 * Keeps the webhookDelivery table lean and prevents unbounded growth.
 * Scheduled: daily at 02:00 UTC via vercel.json cron.
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

const DLQ_RETENTION_DAYS = 30

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - DLQ_RETENTION_DAYS)

  try {
    // Delete dead-letter entries older than 30 days
    const result = await db.webhookDelivery.deleteMany({
      where: {
        success: false,
        nextRetryAt: null, // no more retries scheduled → dead letter
        createdAt: { lt: cutoff },
      },
    })

    console.info(`[cron/webhook-dlq-cleanup] deleted ${result.count} dead-letter entries older than ${DLQ_RETENTION_DAYS} days`)
    return NextResponse.json({ ok: true, deleted: result.count, cutoff: cutoff.toISOString() })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[cron/webhook-dlq-cleanup] failed:', message)
    return NextResponse.json({ error: 'Internal error', details: message }, { status: 500 })
  }
}
