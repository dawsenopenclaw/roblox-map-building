import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Secured by CRON_SECRET header — called by Vercel cron (GET) or GitHub Actions nightly (POST)
async function runSnapshot(req: NextRequest): Promise<NextResponse> {
  const secret = req.headers.get('x-cron-secret')
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)

    const dayEnd = new Date(yesterday)
    dayEnd.setHours(23, 59, 59, 999)

    // Aggregate API usage by provider for yesterday
    const records = await db.apiUsageRecord.groupBy({
      by: ['provider'],
      where: { createdAt: { gte: yesterday, lte: dayEnd } },
      _sum: { costUsdMicro: true },
    })

    // costUsdMicro is stored as micro-dollars; divide by 1_000_000 for USD
    const providerCosts: Record<string, number> = Object.fromEntries(
      records.map((r) => [r.provider, (r._sum?.costUsdMicro ?? 0) / 1_000_000])
    )
    const totalCostUsd = Object.values(providerCosts).reduce((a, b) => a + b, 0)

    // Revenue will be wired to Stripe in Phase 3
    const totalRevenue = 0
    const margin = totalRevenue > 0 ? ((totalRevenue - totalCostUsd) / totalRevenue) * 100 : 0

    // Schema stores values as micro-dollars (multiply by 1_000_000 for precision)
    const totalCostUsdMicro = Math.round(totalCostUsd * 1_000_000)
    const totalRevenueMicro = Math.round(totalRevenue * 1_000_000)
    const marginMicro = Math.round(margin * 1_000_000)

    await db.dailyCostSnapshot.upsert({
      where: { date: yesterday },
      create: { date: yesterday, providerCosts, totalCostUsdMicro, totalRevenueMicro, marginMicro },
      update: { providerCosts, totalCostUsdMicro, totalRevenueMicro, marginMicro },
    })

    return NextResponse.json({
      ok: true,
      date: yesterday.toISOString().split('T')[0],
      totalCostUsd,
      providerCosts,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Service temporarily unavailable', details: 'Database not connected' },
      { status: 503 }
    )
  }
}

export async function GET(req: NextRequest) {
  return runSnapshot(req)
}

export async function POST(req: NextRequest) {
  return runSnapshot(req)
}
