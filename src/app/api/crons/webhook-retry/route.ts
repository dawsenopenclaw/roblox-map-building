import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { processRetryQueue } from '@/lib/webhook-retry'

export const runtime = 'nodejs'
export const maxDuration = 30

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

async function run(req: NextRequest): Promise<NextResponse> {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const stats = await processRetryQueue(10)
    console.log(`[cron/webhook-retry] processed=${stats.processed} succeeded=${stats.succeeded} failed=${stats.failed}`)
    return NextResponse.json({ ok: true, ...stats })
  } catch (err) {
    console.error('[cron/webhook-retry] fatal:', err)
    return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
  }
}

export async function GET(req: NextRequest) {
  return run(req)
}

export async function POST(req: NextRequest) {
  return run(req)
}
