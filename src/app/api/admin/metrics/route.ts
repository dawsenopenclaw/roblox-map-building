import { NextResponse } from 'next/server'
import { requireAdmin } from '../_adminGuard'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 86_400_000)

    const [
      totalUsers,
      usersLast30,
      usersLast60,
      usersToday,
      activeSubscriptions,
      totalTemplates,
      totalPurchases,
      purchasesLast30,
      totalTokenTransactions,
      tokensUsedLast30,
      subsByTier,
      subsByStatus,
      revenueData30,
      revenueData60,
      signupData,
      topTemplates,
      topCreators,
      recentUsers,
      achievementStats,
      streakStats,
    ] = await Promise.all([
      // User counts
      db.user.count({ where: { deletedAt: null } }),
      db.user.count({ where: { deletedAt: null, createdAt: { gte: thirtyDaysAgo } } }),
      db.user.count({ where: { deletedAt: null, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
      db.user.count({ where: { deletedAt: null, createdAt: { gte: today } } }),

      // Subscriptions
      db.subscription.count({ where: { status: { in: ['ACTIVE', 'TRIALING'] } } }),

      // Marketplace
      db.template.count({ where: { status: 'PUBLISHED' } }),
      db.templatePurchase.count(),
      db.templatePurchase.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),

      // Token usage
      db.tokenTransaction.count(),
      db.tokenTransaction.aggregate({
        where: { createdAt: { gte: thirtyDaysAgo }, type: 'SPEND' },
        _sum: { amount: true },
      }),

      // Sub breakdown by tier
      db.subscription.groupBy({
        by: ['tier'],
        where: { status: { in: ['ACTIVE', 'TRIALING'] } },
        _count: { tier: true },
      }),

      // Sub breakdown by status
      db.subscription.groupBy({
        by: ['status'],
        _count: { status: true },
      }),

      // Revenue (30 days)
      db.dailyCostSnapshot.findMany({
        where: { date: { gte: thirtyDaysAgo } },
        orderBy: { date: 'asc' },
        select: { date: true, totalRevenueMicro: true, totalCostUsdMicro: true },
      }),

      // Revenue (60 days for comparison)
      db.dailyCostSnapshot.findMany({
        where: { date: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
        orderBy: { date: 'asc' },
        select: { date: true, totalRevenueMicro: true },
      }),

      // Signups per day (30 days)
      db.user.findMany({
        where: { createdAt: { gte: thirtyDaysAgo }, deletedAt: null },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
        take: 10_000,
      }),

      // Top templates by purchases
      db.template.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { purchases: { _count: 'desc' } },
        take: 5,
        select: { id: true, title: true, category: true, priceCents: true, _count: { select: { purchases: true } } },
      }),

      // Top creators by earnings
      db.creatorEarning.groupBy({
        by: ['userId'],
        _sum: { amountCents: true },
        orderBy: { _sum: { amountCents: 'desc' } },
        take: 5,
      }),

      // Recent signups
      db.user.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, email: true, displayName: true, createdAt: true, role: true },
      }),

      // Gamification
      db.userAchievement.count(),
      db.streak.aggregate({ _avg: { loginStreak: true }, _max: { longestLoginStreak: true } }),
    ])

    // ─── Calculated metrics ──────────────────────────────────────────────────

    const tierPricesCents: Record<string, number> = {
      FREE: 0, HOBBY: 499, CREATOR: 1299, STUDIO: 3999,
    }

    const mrrCents = subsByTier.reduce((sum, row) => {
      const price = tierPricesCents[row.tier] ?? 0
      return sum + price * row._count.tier
    }, 0)

    const arrCents = mrrCents * 12

    // User growth rate
    const growthRate = usersLast60 > 0
      ? Math.round(((usersLast30 - usersLast60) / usersLast60) * 100)
      : 100

    // Revenue charts
    const revenueChart = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(thirtyDaysAgo)
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().slice(0, 10)
      const match = revenueData30.find((r) => r.date.toISOString().slice(0, 10) === dateStr)
      return {
        date: dateStr,
        revenueCents: match ? Math.round(match.totalRevenueMicro / 10_000) : 0,
        costCents: match ? Math.round(match.totalCostUsdMicro / 10_000) : 0,
      }
    })

    const totalRevenue30 = revenueChart.reduce((s, r) => s + r.revenueCents, 0)
    const totalRevenue60 = revenueData60.reduce((s, r) => s + Math.round(r.totalRevenueMicro / 10_000), 0)
    const revenueGrowth = totalRevenue60 > 0
      ? Math.round(((totalRevenue30 - totalRevenue60) / totalRevenue60) * 100)
      : 0

    // Signups chart
    const signupsChart = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(thirtyDaysAgo)
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().slice(0, 10)
      const count = signupData.filter(
        (u) => u.createdAt.toISOString().slice(0, 10) === dateStr
      ).length
      return { date: dateStr, count }
    })

    // Conversion rate (free → paid)
    const conversionRate = totalUsers > 0
      ? ((activeSubscriptions / totalUsers) * 100).toFixed(1)
      : '0'

    // ARPU
    const arpu = activeSubscriptions > 0
      ? Math.round(mrrCents / activeSubscriptions)
      : 0

    // Token usage
    const tokensSpentLast30 = Math.abs(tokensUsedLast30._sum.amount ?? 0)

    // Resolve top creator names
    const creatorIds = topCreators.map((c) => c.userId)
    const creatorUsers = creatorIds.length > 0
      ? await db.user.findMany({
          where: { id: { in: creatorIds } },
          select: { id: true, displayName: true, email: true },
        })
      : []

    const topCreatorsWithNames = topCreators.map((c) => {
      const user = creatorUsers.find((u) => u.id === c.userId)
      return {
        userId: c.userId,
        name: user?.displayName || user?.email || 'Unknown',
        totalEarningsCents: c._sum.amountCents ?? 0,
      }
    })

    // System health
    let dbStatus: 'ok' | 'down' = 'ok'
    try { await db.$queryRaw`SELECT 1` } catch { dbStatus = 'down' }

    let redisStatus: 'ok' | 'down' = 'ok'
    try {
      const { redis } = await import('@/lib/redis')
      await redis.ping()
    } catch { redisStatus = 'down' }

    return NextResponse.json({
      // ─── Overview cards ───
      totalUsers,
      usersToday,
      usersLast30,
      userGrowthPercent: growthRate,
      mrrCents,
      arrCents,
      revenueGrowth,
      activeSubscriptions,
      conversionRate: Number(conversionRate),
      arpu,
      totalBuilds: totalTokenTransactions,
      tokensSpentLast30,

      // ─── Marketplace ───
      totalTemplates,
      totalPurchases,
      purchasesLast30,
      topTemplates: topTemplates.map((t) => ({
        id: t.id,
        title: t.title,
        category: t.category,
        purchaseCount: t._count.purchases,
        priceCents: t.priceCents,
      })),
      topCreators: topCreatorsWithNames,

      // ─── Subscriptions breakdown ───
      subsByTier: subsByTier.map((r) => ({ tier: r.tier, count: r._count.tier })),
      subsByStatus: subsByStatus.map((r) => ({ status: r.status, count: r._count.status })),

      // ─── Charts ───
      revenueChart,
      signupsChart,

      // ─── Gamification ───
      totalAchievements: achievementStats,
      avgLoginStreak: Math.round(streakStats._avg.loginStreak ?? 0),
      longestStreak: streakStats._max.longestLoginStreak ?? 0,

      // ─── Recent ───
      recentUsers: recentUsers.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
      })),

      // ─── Build Analytics ───
      buildAnalytics: await (async () => {
        try {
          const { getBuildMetrics, computeSuccessRate } = await import('@/lib/build-analytics')
          const today = await getBuildMetrics()
          return { today, successRate: computeSuccessRate(today) }
        } catch { return { today: {}, successRate: {} } }
      })(),

      // ─── System ───
      health: { db: dbStatus, redis: redisStatus, api: 'ok' as const },
      generatedAt: now.toISOString(),
    })
  } catch (err) {
    console.error('[admin/metrics] Failed:', err)
    return NextResponse.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 }
    )
  }
}
