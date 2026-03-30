/**
 * GET /api/internal/cron/re-engagement
 *
 * Sends re-engagement emails to users who have been inactive for 14 days.
 * Scheduled: daily at 10:00 UTC via vercel.json cron.
 * Secured by CRON_SECRET header.
 */

import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { db } from '@/lib/db'
import { sendReEngagementEmail } from '@/lib/email'

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

  const INACTIVE_DAYS = 14
  const inactiveThreshold = new Date()
  inactiveThreshold.setDate(inactiveThreshold.getDate() - INACTIVE_DAYS)

  // Cap re-engagement at 30 days to avoid spamming long-term churned users
  const maxInactiveThreshold = new Date()
  maxInactiveThreshold.setDate(maxInactiveThreshold.getDate() - 30)

  const PAGE_SIZE = 100

  let sent = 0
  let failed = 0
  let total = 0
  let cursor: string | undefined

  const candidateWhere = {
    deletedAt: null,
    email: { not: { endsWith: '@deleted.invalid' } },
    subscription: { status: { notIn: ['CANCELED'] } },
    gameScans: {
      some: {},
      none: { createdAt: { gte: inactiveThreshold } },
    },
    NOT: {
      gameScans: { some: { createdAt: { gte: maxInactiveThreshold } } },
    },
  } as const

  try {
    // Cursor-paginated so the cron handles any number of inactive users
    // without loading the full set or timing out.
    while (true) {
      const candidates = await db.user.findMany({
        where: candidateWhere,
        select: { id: true, email: true, displayName: true },
        orderBy: { id: 'asc' },
        take: PAGE_SIZE,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      })

      if (candidates.length === 0) break
      total += candidates.length

      await Promise.allSettled(
        candidates.map(async (user) => {
          try {
            await sendReEngagementEmail({
              email: user.email,
              name: user.displayName ?? 'Creator',
              daysInactive: INACTIVE_DAYS,
              bonusTokens: 50,
            })
            sent++
          } catch {
            failed++
          }
        })
      )

      cursor = candidates[candidates.length - 1]?.id
      if (candidates.length < PAGE_SIZE) break
    }

    return NextResponse.json({ ok: true, sent, failed, total })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[cron/re-engagement] failed:', message)
    return NextResponse.json({ error: 'Internal error', details: message }, { status: 500 })
  }
}
