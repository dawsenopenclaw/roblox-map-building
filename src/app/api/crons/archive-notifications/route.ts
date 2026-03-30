import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { db } from '@/lib/db'

function verifyCronSecret(req: NextRequest): boolean {
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

// Archive (delete) read notifications older than 90 days to keep the table lean.
// Unread notifications are never purged — users may still need them.
const ARCHIVE_AFTER_DAYS = 90

async function runArchiveNotifications(req: NextRequest): Promise<NextResponse> {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - ARCHIVE_AFTER_DAYS)

    const result = await db.notification.deleteMany({
      where: {
        read: true,
        createdAt: { lt: cutoff },
      },
    })

    return NextResponse.json({
      ok: true,
      archivedCount: result.count,
      cutoff: cutoff.toISOString(),
    })
  } catch (error) {
    console.error('[cron/archive-notifications] fatal:', error)
    return NextResponse.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 }
    )
  }
}

export async function GET(req: NextRequest) {
  return runArchiveNotifications(req)
}

export async function POST(req: NextRequest) {
  return runArchiveNotifications(req)
}
