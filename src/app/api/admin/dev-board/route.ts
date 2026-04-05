import { NextResponse } from 'next/server'
import { requireAdmin } from '../_adminGuard'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const now = new Date()

    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)

    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - 7)
    startOfWeek.setHours(0, 0, 0, 0)

    const startOfMonth = new Date(now)
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(now.getDate() - 30)

    const startOfThisWeek = new Date(now)
    startOfThisWeek.setDate(now.getDate() - 7)
    startOfThisWeek.setHours(0, 0, 0, 0)

    const [
      // User counts
      totalUsers,
      signupsToday,
      signupsWeek,
      signupsMonth,

      // Subscription breakdown
      subsByTier,

      // Token economy aggregates
      tokenAggregates,

      // Token transactions breakdown
      tokensBoughtTotal,
      tokensSpentTotal,

      // Templates
      topTemplates,
      totalTemplates,

      // API usage
      apiUsageToday,
      apiUsageWeek,
      apiUsageMonth,
      apiUsageByProvider,

      // Audit log (activity feed)
      recentActivity,

      // Revenue chart (30d)
      revenueChart,

      // Projects (using ApiUsageRecord as proxy for "activity")
      totalProjects,

      // Cost tracking
      costToday,
      costThisWeek,
      costTotal30d,
      costByProvider,
      costSnapshots,
    ] = await Promise.all([
      // Total users
      db.user.count({ where: { deletedAt: null } }),

      // Signups
      db.user.count({ where: { deletedAt: null, createdAt: { gte: startOfToday } } }),
      db.user.count({ where: { deletedAt: null, createdAt: { gte: startOfWeek } } }),
      db.user.count({ where: { deletedAt: null, createdAt: { gte: startOfMonth } } }),

      // Subscription tiers — only ACTIVE or TRIALING count toward MRR
      db.subscription.groupBy({
        by: ['tier'],
        where: { status: { in: ['ACTIVE', 'TRIALING'] } },
        _count: { tier: true },
      }),

      // Token balance aggregates across all users
      db.tokenBalance.aggregate({
        _sum: { balance: true, lifetimeEarned: true, lifetimeSpent: true },
        _avg: { balance: true },
      }),

      // Tokens purchased (PURCHASE type only — TokenTransaction has no stripeSessionId field)
      db.tokenTransaction.aggregate({
        where: { type: 'PURCHASE' },
        _sum: { amount: true },
        _count: { id: true },
      }),

      // Tokens spent
      db.tokenTransaction.aggregate({
        where: { type: 'SPEND' },
        _sum: { amount: true },
        _count: { id: true },
      }),

      // Top templates by purchase count
      db.template.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { downloads: 'desc' },
        take: 8,
        select: {
          id: true,
          title: true,
          downloads: true,
          priceCents: true,
          averageRating: true,
          category: true,
          thumbnailUrl: true,
          _count: { select: { purchases: true } },
        },
      }),

      // Total templates
      db.template.count({ where: { status: 'PUBLISHED' } }),

      // API usage counts
      db.apiUsageRecord.count({ where: { createdAt: { gte: startOfToday } } }),
      db.apiUsageRecord.count({ where: { createdAt: { gte: startOfWeek } } }),
      db.apiUsageRecord.count({ where: { createdAt: { gte: startOfMonth } } }),

      // API usage by provider (30d)
      db.apiUsageRecord.groupBy({
        by: ['provider'],
        where: { createdAt: { gte: thirtyDaysAgo } },
        _count: { id: true },
        _sum: { tokensUsed: true, costUsdMicro: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),

      // Recent activity feed
      db.auditLog.findMany({
        take: 25,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          action: true,
          resource: true,
          resourceId: true,
          createdAt: true,
          user: { select: { email: true, displayName: true } },
        },
      }),

      // Revenue chart from DailyCostSnapshot
      db.dailyCostSnapshot.findMany({
        where: { date: { gte: thirtyDaysAgo } },
        orderBy: { date: 'asc' },
        select: { date: true, totalRevenueMicro: true },
      }),

      // Total "projects" — use GeneratedAsset count as proxy
      db.generatedAsset.count(),

      // Cost today
      db.apiUsageRecord.aggregate({
        where: { createdAt: { gte: startOfToday } },
        _sum: { costUsdMicro: true },
      }),

      // Cost this week (last 7 days)
      db.apiUsageRecord.aggregate({
        where: { createdAt: { gte: startOfThisWeek } },
        _sum: { costUsdMicro: true },
      }),

      // Cost last 30 days
      db.apiUsageRecord.aggregate({
        where: { createdAt: { gte: thirtyDaysAgo } },
        _sum: { costUsdMicro: true },
      }),

      // Cost by provider (30d)
      db.apiUsageRecord.groupBy({
        by: ['provider'],
        where: { createdAt: { gte: thirtyDaysAgo } },
        _count: { id: true },
        _sum: { costUsdMicro: true },
        orderBy: { _sum: { costUsdMicro: 'desc' } },
        take: 10,
      }),

      // Daily cost snapshots for chart (30d)
      db.dailyCostSnapshot.findMany({
        where: { date: { gte: thirtyDaysAgo } },
        orderBy: { date: 'asc' },
        select: { date: true, totalCostUsdMicro: true },
      }),
    ])

    // Compute MRR — only ACTIVE/TRIALING subs with correct prices
    const tierPricesCents: Record<string, number> = {
      FREE: 0,
      HOBBY: 999,
      CREATOR: 2499,
      STUDIO: 4999,
    }
    const mrrCents = subsByTier.reduce((sum, row) => {
      return sum + (tierPricesCents[row.tier] ?? 0) * row._count.tier
    }, 0)

    // Build 30-day revenue chart buckets
    const revenueChartData = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(thirtyDaysAgo)
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().slice(0, 10)
      const match = revenueChart.find((r) => r.date.toISOString().slice(0, 10) === dateStr)
      return {
        date: dateStr,
        revenueCents: match ? Math.round(match.totalRevenueMicro / 10_000) : 0,
      }
    })

    // Build subscription pie data
    const subPieData = subsByTier.map((row) => ({
      tier: row.tier,
      count: row._count.tier,
    }))

    // Total revenue (30d)
    const revenueTotal30d = revenueChartData.reduce((s, d) => s + d.revenueCents, 0)

    // Weekly revenue (last 7 days)
    const revenueWeek = revenueChartData.slice(-7).reduce((s, d) => s + d.revenueCents, 0)

    return NextResponse.json({
      // Revenue
      mrrCents,
      revenueTodayCents: revenueChartData[revenueChartData.length - 1]?.revenueCents ?? 0,
      revenueWeekCents: revenueWeek,
      revenueMonthCents: revenueTotal30d,
      revenueChart: revenueChartData,

      // Users
      totalUsers,
      signupsToday,
      signupsWeek,
      signupsMonth,

      // Subscriptions
      subsByTier: subPieData,

      // Tokens
      tokenBalance: tokenAggregates._sum.balance ?? 0,
      tokenLifetimeEarned: tokenAggregates._sum.lifetimeEarned ?? 0,
      tokenLifetimeSpent: tokenAggregates._sum.lifetimeSpent ?? 0,
      tokenAvgBalance: Math.round(tokenAggregates._avg.balance ?? 0),
      tokensBoughtCount: tokensBoughtTotal._count.id,
      tokensBoughtAmount: tokensBoughtTotal._sum.amount ?? 0,
      tokensSpentCount: tokensSpentTotal._count.id,
      tokensSpentAmount: Math.abs(tokensSpentTotal._sum.amount ?? 0),

      // Templates
      topTemplates: topTemplates.map((t) => ({
        id: t.id,
        title: t.title,
        downloads: t.downloads,
        priceCents: t.priceCents,
        averageRating: t.averageRating,
        category: t.category,
        purchases: t._count.purchases,
      })),
      totalTemplates,

      // Projects
      totalProjects,

      // API usage
      apiUsageToday,
      apiUsageWeek,
      apiUsageMonth,
      apiUsageByProvider: apiUsageByProvider.map((row) => ({
        provider: row.provider,
        calls: row._count.id,
        tokensUsed: row._sum.tokensUsed ?? 0,
        costCents: Math.round((row._sum.costUsdMicro ?? 0) / 10_000),
      })),

      // Activity
      recentActivity: recentActivity.map((a) => ({
        id: a.id,
        action: a.action,
        resource: a.resource,
        resourceId: a.resourceId,
        createdAt: a.createdAt.toISOString(),
        userEmail: a.user?.email ?? null,
        userName: a.user?.displayName ?? null,
      })),

      // Cost breakdown
      costBreakdown: {
        costTodayCents: Math.round((costToday._sum.costUsdMicro ?? 0) / 10_000),
        costThisWeekCents: Math.round((costThisWeek._sum.costUsdMicro ?? 0) / 10_000),
        costTotal30dCents: Math.round((costTotal30d._sum.costUsdMicro ?? 0) / 10_000),
        costByProvider: costByProvider.map((row) => ({
          provider: row.provider,
          calls: row._count.id,
          costCents: Math.round((row._sum.costUsdMicro ?? 0) / 10_000),
        })),
        costChart: Array.from({ length: 30 }, (_, i) => {
          const d = new Date(thirtyDaysAgo)
          d.setDate(d.getDate() + i)
          const dateStr = d.toISOString().slice(0, 10)
          const match = costSnapshots.find((s) => s.date.toISOString().slice(0, 10) === dateStr)
          return {
            date: dateStr,
            costCents: match ? Math.round(match.totalCostUsdMicro / 10_000) : 0,
          }
        }),
      },

      fetchedAt: now.toISOString(),
    })
  } catch (err) {
    console.error('[dev-board] error:', err)
    return NextResponse.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 }
    )
  }
}
