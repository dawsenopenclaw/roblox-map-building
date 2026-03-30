/**
 * GET /api/internal/cron/webhook-retry
 *
 * Drives durable webhook retries for failed deliveries whose nextRetryAt is due.
 *
 * WHY THIS EXISTS:
 *  setTimeout-based retries are silently dropped in serverless environments —
 *  the Vercel function process is killed once the HTTP response is sent.
 *  This cron replaces that unreliable mechanism with DB-backed, cursor-paginated
 *  retry processing so no retry is ever lost.
 *
 * Scheduled: every 5 minutes via vercel.json cron.
 * Secured by CRON_SECRET header.
 */

import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import * as Sentry from '@sentry/nextjs'
import { processWebhookRetries } from '@/lib/webhook-dispatch'

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

  try {
    const result = await processWebhookRetries(50)
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[cron/webhook-retry] failed:', message)
    Sentry.captureException(err, { tags: { cron: 'webhook-retry' } })
    return NextResponse.json({ error: 'Internal error', details: message }, { status: 500 })
  }
}
