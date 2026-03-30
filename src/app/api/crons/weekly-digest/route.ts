import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { db } from '@/lib/db'
import { sendWeeklyDigestEmail } from '@/lib/email'

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

async function runWeeklyDigest(req: NextRequest): Promise<NextResponse> {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    // Fetch trending templates once for the entire run — same for every user
    const trendingTemplates = await db.template.findMany({
      where: { status: 'PUBLISHED', deletedAt: null },
      orderBy: { downloads: 'desc' },
      take: 3,
      select: { title: true, category: true, purchases: { where: { createdAt: { gte: weekAgo } }, select: { id: true } }, thumbnailUrl: true },
    })

    const trending = trendingTemplates.map((t) => ({
      name: t.title,
      category: t.category,
      sales: t.purchases.length,
      thumbnailUrl: t.thumbnailUrl ?? undefined,
    }))

    // Find active (non-deleted) users with email, process in pages to avoid OOM
    const PAGE_SIZE = 100
    let cursor: string | undefined
    let totalSent = 0
    let totalSkipped = 0

    while (true) {
      const users = await db.user.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          email: true,
          displayName: true,
          username: true,
          tokenBalance: { select: { transactions: { where: { createdAt: { gte: weekAgo } }, select: { amount: true, type: true } } } },
          streak: { select: { loginStreak: true } },
          creatorEarnings: { where: { createdAt: { gte: weekAgo }, status: 'PAID' }, select: { netCents: true } },
        },
        take: PAGE_SIZE,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        orderBy: { id: 'asc' },
      })

      if (users.length === 0) break
      cursor = users[users.length - 1]!.id

      for (const user of users) {
        const name = user.displayName ?? user.username ?? 'Builder'
        const transactions = user.tokenBalance?.transactions ?? []
        const tokensUsed = transactions
          .filter((t) => t.type === 'SPEND')
          .reduce((sum, t) => sum + Math.abs(t.amount), 0)
        // Build count: approximate via SPEND transactions (1 build ≈ 1 SPEND)
        const buildsThisWeek = transactions.filter((t) => t.type === 'SPEND').length
        const earningsThisWeek = (user.creatorEarnings ?? []).reduce((sum, e) => sum + e.netCents, 0) / 100
        const streakDays = user.streak?.loginStreak ?? 0

        try {
          await sendWeeklyDigestEmail({
            email: user.email,
            name,
            buildsThisWeek,
            tokensUsed,
            earningsThisWeek,
            streakDays,
            trendingTemplates: trending,
          })
          totalSent++
        } catch (err) {
          console.error(`[cron/weekly-digest] email failed for ${user.id}:`, err)
          totalSkipped++
        }
      }

      if (users.length < PAGE_SIZE) break
    }

    return NextResponse.json({ ok: true, totalSent, totalSkipped })
  } catch (error) {
    console.error('[cron/weekly-digest] fatal:', error)
    return NextResponse.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 }
    )
  }
}

export async function GET(req: NextRequest) {
  return runWeeklyDigest(req)
}

export async function POST(req: NextRequest) {
  return runWeeklyDigest(req)
}
