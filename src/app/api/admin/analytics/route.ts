import { NextResponse } from 'next/server'
import { requireAdmin } from '../_adminGuard'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const now = new Date()
    const ninetyDaysAgo = new Date(now)
    ninetyDaysAgo.setDate(now.getDate() - 90)

    const [
      costSnapshots,
      templateRevenue,
      userCount,
      payingCount,
      activatedCount,
      subscriptions,
    ] = await Promise.all([
      db.dailyCostSnapshot.findMany({
        where: { date: { gte: ninetyDaysAgo } },
        orderBy: { date: 'asc' },
        take: 500,
        select: { date: true, totalCostUsdMicro: true, totalRevenueMicro: true, marginMicro: true },
      }),
      db.templatePurchase.groupBy({
        by: ['templateId'],
        _sum: { amountCents: true },
        orderBy: { _sum: { amountCents: 'desc' } },
        take: 10,
      }),
      db.user.count({ where: { deletedAt: null } }),
      db.subscription.count({
        where: { status: { in: ['ACTIVE', 'TRIALING'] }, tier: { not: 'FREE' } },
      }),
      db.apiUsageRecord.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: ninetyDaysAgo } },
        _count: { userId: true },
        having: { userId: { _count: { gt: 0 } } },
        take: 500,
      }),
      db.subscription.groupBy({
        by: ['tier'],
        where: { status: { in: ['ACTIVE', 'TRIALING'] } },
        _count: { tier: true },
      }),
    ])

    // Fetch template details for top revenue templates
    const templateIds = templateRevenue.map((t) => t.templateId)
    const templates = await db.template.findMany({
      where: { id: { in: templateIds } },
      select: { id: true, title: true, downloads: true },
    })

    const tierPricesCents: Record<string, number> = {
      HOBBY: 499,
      CREATOR: 1299,
      STUDIO: 3999,
    }

    const mrrCents = subscriptions.reduce((sum, row) => {
      return sum + (tierPricesCents[row.tier] ?? 0) * row._count.tier
    }, 0)

    // Churn rate — approximation: canceled in last 30 days / active 30 days ago
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(now.getDate() - 30)
    const canceledRecent = await db.subscription.count({
      where: { status: 'CANCELED', updatedAt: { gte: thirtyDaysAgo } },
    })
    const activeLast30 = await db.subscription.count({
      where: {
        status: { in: ['ACTIVE', 'TRIALING', 'CANCELED'] },
        createdAt: { lte: thirtyDaysAgo },
      },
    })
    const churnRate = activeLast30 > 0 ? (canceledRecent / activeLast30) * 100 : 0

    // ARPU = MRR / paying users
    const arpu = payingCount > 0 ? mrrCents / 100 / payingCount : 0

    // LTV = ARPU / churnRate (in months), clamp to avoid infinity
    const churnMonthly = churnRate / 100
    const ltv = churnMonthly > 0.001 ? arpu / churnMonthly : arpu * 12

    // MRR trend (last 90 days monthly buckets)
    const mrrTrend = costSnapshots.map((s) => ({
      date: s.date.toISOString().slice(0, 10),
      mrrCents: Math.round(s.totalRevenueMicro / 10_000),
    }))

    // Funnel (approximated from DB)
    const funnel = {
      visits: userCount * 8, // rough estimate: 8x signups = visits
      signups: userCount,
      activated: activatedCount.length,
      paying: payingCount,
    }

    // Top templates
    const topTemplates = templateRevenue.map((tr) => {
      const t = templates.find((t) => t.id === tr.templateId)
      return {
        id: tr.templateId,
        title: t?.title ?? 'Unknown',
        revenueCents: tr._sum.amountCents ?? 0,
        downloads: t?.downloads ?? 0,
      }
    })

    // Cohort retention — simplified (no actual cohort table, return empty)
    const cohortRetention: {
      cohort: string
      week1: number
      week2: number
      week4: number
      week8: number
    }[] = []

    // Cost vs revenue (last 30 days daily)
    const costVsRevenue = costSnapshots.slice(-30).map((s) => ({
      date: s.date.toISOString().slice(0, 10),
      costMicro: s.totalCostUsdMicro,
      revenueMicro: s.totalRevenueMicro,
      marginMicro: s.marginMicro,
    }))

    return NextResponse.json({
      mrrTrend,
      churnRate,
      ltv,
      arpu,
      funnel,
      topTemplates,
      cohortRetention,
      costVsRevenue,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Service temporarily unavailable', details: 'Database not connected' },
      { status: 503 }
    )
  }
}
