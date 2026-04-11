/**
 * POST /api/notifications/build-complete
 *
 * Fire-and-forget endpoint that triggers out-of-band (email + push)
 * notifications when a build has finished executing in Studio. The editor
 * calls this after `handleBuildComplete` on the client so the heavy lifting
 * (Resend + VAPID) runs on the server without blocking the UI.
 *
 * Per-channel preferences are consulted inside `notifyBuildComplete`, so
 * users who disabled EMAIL / PUSH for BUILD_COMPLETE will silently be
 * skipped — this endpoint never returns an error for disabled channels.
 *
 * Body: { buildId: string, summary: { buildName, buildType, success, thumbnailUrl? } }
 *
 * Auth: Clerk session required.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { notifyBuildComplete } from '@/lib/notifications-server'
import { db } from '@/lib/db'

interface BuildCompleteBody {
  buildId?: string
  summary?: {
    buildName?: string
    buildType?: string
    success?: boolean
    thumbnailUrl?: string
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: BuildCompleteBody
  try {
    body = (await req.json()) as BuildCompleteBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const buildId = typeof body.buildId === 'string' && body.buildId.length > 0
    ? body.buildId
    : `build-${Date.now()}`

  const summary = {
    buildName: body.summary?.buildName?.slice(0, 200) || 'Untitled Build',
    buildType: body.summary?.buildType?.slice(0, 80) || 'build',
    success: body.summary?.success !== false, // default true
    thumbnailUrl: typeof body.summary?.thumbnailUrl === 'string'
      ? body.summary.thumbnailUrl
      : undefined,
  }

  try {
    // `notifyBuildComplete` expects an internal user id, not a Clerk id.
    const user = await db.user.findUnique({
      where: { clerkId },
      select: { id: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fire-and-forget — the function swallows its own failures, but await
    // here so we can report a 500 if the outer DB lookup throws.
    await notifyBuildComplete(user.id, buildId, summary)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[notifications/build-complete POST] failed:', err)
    // Still return 200 so the client doesn't surface an error toast for
    // something that's purely a best-effort side channel.
    return NextResponse.json({ ok: false, skipped: true })
  }
}
