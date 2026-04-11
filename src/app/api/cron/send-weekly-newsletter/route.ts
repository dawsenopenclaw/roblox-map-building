/**
 * GET /api/cron/send-weekly-newsletter
 *
 * BUG 5: Vercel cron — runs every Monday at 14:00 UTC (see vercel.json).
 *
 * Finds every user who has weekly-newsletter notifications enabled and
 * dispatches the `notifyWeeklyDigest()` helper for them in batches of 100.
 * Each batch is awaited sequentially so we don't thundering-herd the email
 * provider (Resend) or the Prisma connection pool.
 *
 * Auth: protected by the shared CRON_SECRET env var. Vercel cron invocations
 * automatically include `Authorization: Bearer <CRON_SECRET>` when the
 * secret is set in project env.
 *
 * Response:
 * {
 *   ok:         boolean,
 *   queued:     number,  // total users targeted
 *   succeeded:  number,
 *   failed:     number,
 *   durationMs: number,
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { notifyWeeklyDigest } from '@/lib/notifications-server'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes — digest queries can be slow

const CRON_SECRET = process.env.CRON_SECRET ?? ''
const BATCH_SIZE = 100

function isAuthorized(req: NextRequest): boolean {
  if (!CRON_SECRET) return false
  const auth = req.headers.get('authorization') ?? ''
  return auth === `Bearer ${CRON_SECRET}`
}

/**
 * Find all users who have opted in to newsletter / weekly digest emails.
 * Uses two fallback paths so the query still works across schema revisions:
 *  1. notificationPreferences JSON field with `newsletter: true`
 *  2. legacy boolean column `emailNewsletter`
 * Either path is considered an opt-in.
 */
async function loadSubscribers(): Promise<{ id: string; email: string | null }[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = prisma as any
  return client.user.findMany({
    where: {
      email: { not: null },
      OR: [
        { notificationPreferences: { path: ['newsletter'], equals: true } },
        { emailNewsletter: true },
      ],
    },
    select: { id: true, email: true },
    take: 5000, // hard cap — avoid runaway sends
  })
}

async function sendBatch(users: { id: string }[]): Promise<{ ok: number; fail: number }> {
  let ok = 0
  let fail = 0
  await Promise.all(
    users.map(async (u) => {
      try {
        await notifyWeeklyDigest(u.id)
        ok++
      } catch (err) {
        fail++
        console.warn(
          `[cron/send-weekly-newsletter] digest failed for user ${u.id}:`,
          err instanceof Error ? err.message : err,
        )
      }
    }),
  )
  return { ok, fail }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const startedAt = Date.now()

  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let subscribers: { id: string; email: string | null }[] = []
  try {
    subscribers = await loadSubscribers()
  } catch (err) {
    console.error('[cron/send-weekly-newsletter] loadSubscribers failed:', err)
    return NextResponse.json({ error: 'Failed to load subscribers' }, { status: 500 })
  }

  const targets = subscribers.filter((u) => !!u.email)
  if (targets.length === 0) {
    return NextResponse.json({
      ok: true,
      queued: 0,
      succeeded: 0,
      failed: 0,
      durationMs: Date.now() - startedAt,
    })
  }

  let succeeded = 0
  let failed = 0
  for (let i = 0; i < targets.length; i += BATCH_SIZE) {
    const batch = targets.slice(i, i + BATCH_SIZE)
    const res = await sendBatch(batch)
    succeeded += res.ok
    failed += res.fail
  }

  console.log(
    `[cron/send-weekly-newsletter] queued=${targets.length} ok=${succeeded} fail=${failed} in ${Date.now() - startedAt}ms`,
  )

  return NextResponse.json({
    ok: true,
    queued: targets.length,
    succeeded,
    failed,
    durationMs: Date.now() - startedAt,
  })
}
