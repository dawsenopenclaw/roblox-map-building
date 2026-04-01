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

// Process users in pages of this size to stay well within Vercel's
// 10s function timeout and the DB connection pool limit.
// Each page fires up to CONCURRENCY_LIMIT parallel email+DB tasks.
const PAGE_SIZE = 100
const CONCURRENCY_LIMIT = 10

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - 7)

  let sent = 0
  let failed = 0
  let total = 0
  let cursor: string | undefined

  try {
    // Cursor-paginated scan so the full user table never loads into memory
    // and the function won't timeout regardless of user count.
    while (true) {
      const users = await db.user.findMany({
        where: { deletedAt: null, marketingEmailsOptOut: false, email: { not: { endsWith: '@deleted.invalid' } } },
        select: {
          id: true,
          email: true,
          displayName: true,
          subscription: { select: { status: true } },
        },
        orderBy: { id: 'asc' },
        take: PAGE_SIZE,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      })

      if (users.length === 0) break
      total += users.length

      // Process this page with bounded concurrency to avoid saturating the
      // connection pool (4 queries/user × CONCURRENCY_LIMIT active users).
      for (let i = 0; i < users.length; i += CONCURRENCY_LIMIT) {
        const chunk = users.slice(i, i + CONCURRENCY_LIMIT)
        await Promise.allSettled(
          chunk.map(async (user) => {
            // Skip suspended/canceled accounts
            if (user.subscription?.status === 'CANCELED') return

            try {
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
      }

      cursor = users[users.length - 1]?.id
      if (users.length < PAGE_SIZE) break
    }

    return NextResponse.json({ ok: true, sent, failed, total })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[cron/weekly-digest] failed:', message)
    return NextResponse.json({ error: 'Internal error', details: message }, { status: 500 })
  }
}
