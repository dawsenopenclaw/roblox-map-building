import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { db } from '@/lib/db'
import { sendReEngagementEmail } from '@/lib/email'

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

// Users inactive for 14+ days but not beyond 60 days (avoid spamming long-gone users)
const INACTIVE_DAYS_MIN = 14
const INACTIVE_DAYS_MAX = 60

async function runReEngagement(req: NextRequest): Promise<NextResponse> {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const cutoffMin = new Date(now)
    cutoffMin.setDate(now.getDate() - INACTIVE_DAYS_MAX)

    const cutoffMax = new Date(now)
    cutoffMax.setDate(now.getDate() - INACTIVE_DAYS_MIN)

    // Find users whose last login streak update (lastLoginDate) falls in the inactive window
    const inactiveUsers = await db.streak.findMany({
      where: {
        lastLoginDate: { gte: cutoffMin, lte: cutoffMax },
      },
      select: {
        lastLoginDate: true,
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            username: true,
            deletedAt: true,
          },
        },
      },
    })

    let totalSent = 0
    let totalSkipped = 0

    for (const record of inactiveUsers) {
      const { user, lastLoginDate } = record
      if (user.deletedAt) {
        totalSkipped++
        continue
      }

      const daysInactive = Math.floor(
        (now.getTime() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      const name = user.displayName ?? user.username ?? 'Builder'

      try {
        await sendReEngagementEmail({
          email: user.email,
          name,
          daysInactive,
          bonusTokens: 50,
        })
        totalSent++
      } catch (err) {
        console.error(`[cron/re-engagement] email failed for ${user.id}:`, err)
        totalSkipped++
      }
    }

    return NextResponse.json({ ok: true, totalSent, totalSkipped })
  } catch (error) {
    console.error('[cron/re-engagement] fatal:', error)
    return NextResponse.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 }
    )
  }
}

export async function GET(req: NextRequest) {
  return runReEngagement(req)
}

export async function POST(req: NextRequest) {
  return runReEngagement(req)
}
