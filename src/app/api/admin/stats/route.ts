import { NextResponse } from 'next/server'
import { requireAdmin } from '../_adminGuard'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const now = new Date()
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(now.getDate() - 30)

    const [
      totalUsers,
      activeSubscriptions,
      totalBuilds,
      revenueData,
      signupData,
      recentActivity,
    ] = await Promise.all([
      db.user.count({ where: { deletedAt: null, createdAt: { gte: thirtyDaysAgo } } }),
      db.subscription.count({
        where: { status: { in: ['ACTIVE', 'TRIALING'] } },
      }),
      db.apiUsageRecord.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      db.dailyCostSnapshot.findMany({
        where: { date: { gte: thirtyDaysAgo } },
        orderBy: { date: 'asc' },
        select: { date: true, totalRevenueMicro: true },
      }),
      db.user.findMany({
        where: { createdAt: { gte: thirtyDaysAgo }, deletedAt: null },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      db.auditLog.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          action: true,
          resource: true,
          createdAt: true,
          user: { select: { email: true } },
        },
      }),
    ])

    // MRR from STUDIO (highest tier) active subs — approximation using price from tiers
    const tierPricesCents: Record<string, number> = {
      HOBBY: 499,
      CREATOR: 1299,
      STUDIO: 3999,
    }

    const subsByTier = await db.subscription.groupBy({
      by: ['tier'],
      where: { status: { in: ['ACTIVE', 'TRIALING'] } },
      _count: { tier: true },
    })

    const mrrCents = subsByTier.reduce((sum, row) => {
      const price = tierPricesCents[row.tier] ?? 0
      return sum + price * row._count.tier
    }, 0)

    // Build revenue chart (30-day daily buckets from DailyCostSnapshot)
    const revenueChart = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(thirtyDaysAgo)
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().slice(0, 10)
      const match = revenueData.find((r) => r.date.toISOString().slice(0, 10) === dateStr)
      return {
        date: dateStr,
        revenueCents: match ? Math.round(match.totalRevenueMicro / 10_000) : 0,
      }
    })

    // Build signups chart (30-day daily buckets)
    const signupsChart = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(thirtyDaysAgo)
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().slice(0, 10)
      const count = signupData.filter(
        (u) => u.createdAt.toISOString().slice(0, 10) === dateStr
      ).length
      return { date: dateStr, count }
    })

    // System health — simple DB ping
    let dbStatus: 'ok' | 'degraded' | 'down' = 'ok'
    try {
      await db.$queryRaw`SELECT 1`
    } catch {
      dbStatus = 'down'
    }

    let redisStatus: 'ok' | 'degraded' | 'down' = 'ok'
    try {
      const { redis } = await import('@/lib/redis')
      await redis.ping()
    } catch {
      redisStatus = 'down'
    }

    return NextResponse.json({
      totalUsers,
      mrrCents,
      totalBuilds,
      activeSubscriptions,
      revenueChart,
      signupsChart,
      recentActivity: recentActivity.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
      })),
      health: {
        api: 'ok' as const,
        db: dbStatus,
        redis: redisStatus,
        ai: 'ok' as const,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Service temporarily unavailable', details: 'Database not connected' },
      { status: 503 }
    )
  }
}
