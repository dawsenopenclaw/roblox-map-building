import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth'
import { db } from '../lib/db'

export const earningsRoutes = new Hono()

// GET /api/earnings/summary — aggregate earnings stats
earningsRoutes.get('/summary', requireAuth, async (c) => {
  const clerkId = (c as any).get('clerkId') as string
  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return c.json({ error: 'User not found' }, 404)

  const period = (c.req.query('period') as 'daily' | 'weekly' | 'monthly') ?? 'monthly'
  const now = new Date()

  let startDate: Date
  if (period === 'daily') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // last 30 days
  } else if (period === 'weekly') {
    startDate = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000) // last 12 weeks
  } else {
    startDate = new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000) // last 12 months
  }

  const earnings = await db.creatorEarning.findMany({
    where: { userId: user.id, createdAt: { gte: startDate } },
    orderBy: { createdAt: 'asc' },
  })

  const totalCents = earnings.reduce((sum, e) => sum + e.amountCents, 0)
  const netCents = earnings.reduce((sum, e) => sum + e.netCents, 0)
  const paidCents = earnings
    .filter((e) => e.status === 'PAID')
    .reduce((sum, e) => sum + e.netCents, 0)

  // Build chart data grouped by period
  const chartMap = new Map<string, number>()
  for (const e of earnings) {
    let key: string
    if (period === 'daily') {
      key = e.createdAt.toISOString().slice(0, 10)
    } else if (period === 'weekly') {
      const d = new Date(e.createdAt)
      const dayOfWeek = d.getDay()
      const weekStart = new Date(d.getTime() - dayOfWeek * 86400000)
      key = weekStart.toISOString().slice(0, 10)
    } else {
      key = e.createdAt.toISOString().slice(0, 7)
    }
    chartMap.set(key, (chartMap.get(key) ?? 0) + e.netCents)
  }

  const chartData = Array.from(chartMap.entries()).map(([date, cents]) => ({
    date,
    revenue: (cents / 100).toFixed(2),
  }))

  // Per-template breakdown
  const templateMap = new Map<string, { name: string; sales: number; revenueCents: number }>()
  for (const e of earnings) {
    const key = e.templateId ?? 'other'
    const existing = templateMap.get(key) ?? { name: e.templateName ?? 'Other', sales: 0, revenueCents: 0 }
    existing.sales += 1
    existing.revenueCents += e.netCents
    templateMap.set(key, existing)
  }

  const templateBreakdown = Array.from(templateMap.entries())
    .map(([id, data]) => ({ templateId: id, ...data, revenue: (data.revenueCents / 100).toFixed(2) }))
    .sort((a, b) => b.revenueCents - a.revenueCents)

  // Milestone thresholds (in cents)
  const milestones = [10000, 100000, 1000000]
  const nextMilestone = milestones.find((m) => m > netCents) ?? null

  return c.json({
    summary: {
      totalRevenue: (totalCents / 100).toFixed(2),
      netRevenue: (netCents / 100).toFixed(2),
      paidOut: (paidCents / 100).toFixed(2),
      pending: ((netCents - paidCents) / 100).toFixed(2),
      salesCount: earnings.length,
    },
    chart: chartData,
    templateBreakdown,
    milestones: {
      current: netCents,
      next: nextMilestone,
      achieved: milestones.filter((m) => m <= netCents),
    },
  })
})

// GET /api/earnings/transactions — paginated transaction list
earningsRoutes.get('/transactions', requireAuth, async (c) => {
  const clerkId = (c as any).get('clerkId') as string
  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return c.json({ error: 'User not found' }, 404)

  const cursor = c.req.query('cursor')
  const limit = Math.min(parseInt(c.req.query('limit') ?? '20', 10), 50)

  const transactions = await db.creatorEarning.findMany({
    where: {
      userId: user.id,
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
  })

  const hasMore = transactions.length > limit
  if (hasMore) transactions.pop()

  return c.json({
    transactions: transactions.map((t) => ({
      ...t,
      amountUsd: (t.amountCents / 100).toFixed(2),
      netUsd: (t.netCents / 100).toFixed(2),
    })),
    hasMore,
    nextCursor: hasMore
      ? transactions[transactions.length - 1]?.createdAt.toISOString()
      : null,
  })
})
