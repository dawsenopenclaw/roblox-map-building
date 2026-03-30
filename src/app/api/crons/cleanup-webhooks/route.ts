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

const RETENTION_DAYS = 30

async function runCleanupWebhooks(req: NextRequest): Promise<NextResponse> {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - RETENTION_DAYS)

    const result = await db.webhookDelivery.deleteMany({
      where: { createdAt: { lt: cutoff } },
    })

    return NextResponse.json({
      ok: true,
      deletedCount: result.count,
      cutoff: cutoff.toISOString(),
    })
  } catch (error) {
    console.error('[cron/cleanup-webhooks] fatal:', error)
    return NextResponse.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 }
    )
  }
}

export async function GET(req: NextRequest) {
  return runCleanupWebhooks(req)
}

export async function POST(req: NextRequest) {
  return runCleanupWebhooks(req)
}
