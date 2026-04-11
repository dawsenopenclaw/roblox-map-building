/**
 * GET /api/ai/build/status?buildId=xxx
 *
 * Returns the current execution progress for a build. Designed for
 * client-side polling (1-2s interval). Reads from Redis — no DB hit.
 *
 * Response shape: BuildProgress | { error: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { getBuildProgress } from '@/lib/ai/build-executor'

const statusQuerySchema = z.object({
  buildId: z.string().min(1),
})

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries())
  const parsed = statusQuerySchema.safeParse(searchParams)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'buildId query parameter is required' },
      { status: 400 }
    )
  }

  const { buildId } = parsed.data

  const progress = await getBuildProgress(buildId)
  if (!progress) {
    return NextResponse.json(
      { error: 'Build not found. It may have expired (4h TTL) or never started.' },
      { status: 404 }
    )
  }

  // Cache-Control: no-store so browsers never cache progress responses
  return NextResponse.json(progress, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}
