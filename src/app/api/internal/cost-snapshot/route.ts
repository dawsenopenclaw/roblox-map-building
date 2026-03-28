import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Secured by CRON_SECRET header — called by Vercel cron or GitHub Actions nightly
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)

  const dayEnd = new Date(yesterday)
  dayEnd.setHours(23, 59, 59, 999)

  // Aggregate API usage by provider for yesterday
  const records = await db.apiUsageRecord.groupBy({
    by: ['provider'],
    where: { createdAt: { gte: yesterday, lte: dayEnd } },
    _sum: { costUsd: true },
  })

  const providerCosts: Record<string, number> = Object.fromEntries(
    records.map((r) => [r.provider, r._sum.costUsd || 0])
  )
  const totalCostUsd = Object.values(providerCosts).reduce((a, b) => a + b, 0)

  // Revenue will be wired to Stripe in Phase 3
  const totalRevenue = 0
  const margin = totalRevenue > 0 ? ((totalRevenue - totalCostUsd) / totalRevenue) * 100 : 0

  await db.dailyCostSnapshot.upsert({
    where: { date: yesterday },
    create: { date: yesterday, providerCosts, totalCostUsd, totalRevenue, margin },
    update: { providerCosts, totalCostUsd, totalRevenue, margin },
  })

  return NextResponse.json({
    ok: true,
    date: yesterday.toISOString().split('T')[0],
    totalCostUsd,
    providerCosts,
  })
}
