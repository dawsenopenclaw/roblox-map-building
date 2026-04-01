/**
 * GET /api/ai/generation-status?jobId=xxx
 *
 * Returns the current status, progress %, and result data for an
 * async asset-generation job queued via BullMQ.
 *
 * Response shapes:
 *
 *   Waiting / active:
 *     { jobId, type, state: "waiting"|"active"|"delayed", progress: 0-100 }
 *
 *   Completed:
 *     { jobId, type, state: "completed", progress: 100, result: JobResult, finishedAt: string }
 *
 *   Failed:
 *     { jobId, type, state: "failed", failReason: string, finishedAt: string }
 *
 *   Not found / cleaned:
 *     { jobId, state: "unknown" }
 *
 * Auth: Clerk (required — 401 if unauthenticated)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getJobStatus } from '@/lib/job-queue'

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Auth
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Validate query param
  const jobId = req.nextUrl.searchParams.get('jobId')
  if (!jobId || jobId.trim() === '') {
    return NextResponse.json(
      { error: 'jobId query parameter is required' },
      { status: 400 }
    )
  }

  try {
    const status = await getJobStatus(jobId.trim())

    // Return shape varies by state — always include jobId + state
    return NextResponse.json(status)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to fetch job status', detail: message },
      { status: 502 }
    )
  }
}
