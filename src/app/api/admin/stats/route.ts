import { NextResponse } from 'next/server'
import { requireAdmin } from '../_adminGuard'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const now = new Date()
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(now.getDate() - 30)

    const [
      totalUsers,
      activeSubscriptions,
      totalBuilds,
      revenueData,
      signupData,
      recentActivity,
      // New: active sessions in last 24h
      activeSessions24h,
      // New: total generations (all time)
      totalGenerations,
      // New: generations in last 24h for error rate / avg response time
      recentGenerations,
      // New: recent signups (last 7 days)
      recentSignupCount,
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
        take: 10_000,
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
      // Active sessions: distinct users with audit log activity in last 24h
      db.auditLog.findMany({
        where: { createdAt: { gte: twentyFourHoursAgo }, userId: { not: null } },
        distinct: ['userId'],
        select: { userId: true },
      }),
      // Total generations (all time)
      db.apiUsageRecord.count(),
      // Recent generations for error rate + avg response time
      db.apiUsageRecord.findMany({
        where: { createdAt: { gte: twentyFourHoursAgo } },
        select: { success: true, durationMs: true, statusCode: true },
        take: 50_000,
      }),
      // Recent signups (last 7 days)
      db.user.count({
        where: {
          deletedAt: null,
          createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ])

    // --- Error rate (last 24h) ---
    const totalRecent = recentGenerations.length
    const failedRecent = recentGenerations.filter(
      (r) => !r.success || (r.statusCode !== null && r.statusCode >= 400)
    ).length
    const errorRate = totalRecent > 0 ? Number(((failedRecent / totalRecent) * 100).toFixed(2)) : 0

    // --- Avg response time (last 24h) ---
    const durationsMs = recentGenerations
      .map((r) => r.durationMs)
      .filter((d): d is number => d !== null && d > 0)
    const avgResponseTimeMs =
      durationsMs.length > 0
        ? Math.round(durationsMs.reduce((a, b) => a + b, 0) / durationsMs.length)
        : 0

    // --- P95 response time ---
    const sortedDurations = [...durationsMs].sort((a, b) => a - b)
    const p95ResponseTimeMs =
      sortedDurations.length > 0
        ? sortedDurations[Math.floor(sortedDurations.length * 0.95)] ?? 0
        : 0

    // MRR from active subs
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

    // System health -- simple DB ping
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

    // --- Tier breakdown for subscribers ---
    const tierBreakdown = subsByTier.reduce(
      (acc, row) => {
        acc[row.tier] = row._count.tier
        return acc
      },
      {} as Record<string, number>
    )

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
      // --- New fields ---
      activeSessions24h: activeSessions24h.filter((u) => u.userId).length,
      totalGenerations,
      recentSignupCount,
      errorRate,
      avgResponseTimeMs,
      p95ResponseTimeMs,
      tierBreakdown,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Service temporarily unavailable', details: 'Database not connected' },
      { status: 503 }
    )
  }
}
