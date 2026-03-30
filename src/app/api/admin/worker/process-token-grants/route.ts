import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { processTokenGrantJobs } from '@/lib/webhook-queue'
import { serverEnv } from '@/lib/env'

/**
 * Worker endpoint to process pending token grants
 * Should be called by a background job scheduler (Inngest, Bull, cron service, etc.)
 *
 * Authorization: Expects WORKER_SECRET header
 * Usage: POST /api/admin/worker/process-token-grants
 *
 * Response: { processed: number, error?: string }
 */
export async function POST(req: NextRequest) {
  // Verify worker authorization
  const authHeader = req.headers.get('authorization')
  const expectedAuth = `Bearer ${serverEnv.WORKER_SECRET || ''}`

  if (!authHeader || authHeader !== expectedAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const batchSize = Math.min(parseInt(req.headers.get('x-batch-size') || '50'), 500)
    const processed = await processTokenGrantJobs(batchSize)

    return NextResponse.json({
      processed,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[worker] Token grant job processing failed', { message })

    Sentry.captureException(err, {
      tags: { worker: 'token-grant-processor' },
    })

    return NextResponse.json(
      { error: 'Processing failed', details: message },
      { status: 500 }
    )
  }
}
