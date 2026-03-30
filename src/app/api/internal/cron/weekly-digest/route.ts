/**
 * GET /api/internal/cron/weekly-digest
 *
 * Sends weekly digest emails to all active users.
 * Scheduled: every Sunday at 9:00 UTC via vercel.json cron.
 * Secured by CRON_SECRET header.
 */

import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { db } from '@/lib/db'
import { sendWeeklyDigestEmail } from '@/lib/email'

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

  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - 7)

  try {
    // Fetch active users who opted into digest emails (no deletedAt)
    const users = await db.user.findMany({
      where: { deletedAt: null, email: { not: { endsWith: '@deleted.invalid' } } },
      select: {
        id: true,
        email: true,
        displayName: true,
        subscription: { select: { status: true } },
      },
      take: 1000, // Process in batches if needed
    })

    let sent = 0
    let failed = 0

    await Promise.allSettled(
      users.map(async (user) => {
        // Skip suspended/canceled accounts
        if (user.subscription?.status === 'CANCELED') return

        try {
          // Gather user's weekly stats
          const [buildsThisWeek, tokensUsedResult, earningsResult, streak] = await Promise.all([
            db.gameScan.count({
              where: { userId: user.id, createdAt: { gte: weekStart } },
            }),
            db.tokenTransaction.aggregate({
              where: {
                balance: { userId: user.id },
                type: 'SPEND',
                createdAt: { gte: weekStart },
              },
              _sum: { amount: true },
            }),
            db.creatorEarning.aggregate({
              where: {
                userId: user.id,
                createdAt: { gte: weekStart },
                status: { in: ['PENDING', 'PAID'] },
              },
              _sum: { netCents: true },
            }),
            db.streak.findUnique({ where: { userId: user.id }, select: { buildStreak: true } }),
          ])

          const tokensUsed = Math.abs(tokensUsedResult._sum.amount ?? 0)
          const earningsThisWeek = (earningsResult._sum.netCents ?? 0) / 100

          await sendWeeklyDigestEmail({
            email: user.email,
            name: user.displayName ?? 'Creator',
            buildsThisWeek,
            tokensUsed,
            earningsThisWeek,
            streakDays: streak?.buildStreak ?? 0,
          })
          sent++
        } catch {
          failed++
        }
      })
    )

    return NextResponse.json({ ok: true, sent, failed, total: users.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[cron/weekly-digest] failed:', message)
    return NextResponse.json({ error: 'Internal error', details: message }, { status: 500 })
  }
}
