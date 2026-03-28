import { Hono } from 'hono'
import { db } from '../lib/db'

export const costTrackerRoutes = new Hono()

// Get daily snapshots for the last 30 days
costTrackerRoutes.get('/snapshots', async (c) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const snapshots = await db.dailyCostSnapshot.findMany({
    where: { date: { gte: thirtyDaysAgo } },
    orderBy: { date: 'desc' },
  })
  return c.json(snapshots)
})

// Get today's running cost (aggregated from ApiUsageRecord)
costTrackerRoutes.get('/today', async (c) => {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const records = await db.apiUsageRecord.groupBy({
    by: ['provider'],
    where: { createdAt: { gte: todayStart } },
    _sum: { costUsd: true, tokensUsed: true },
    _count: { id: true },
  })

  const totalCostUsd = records.reduce((sum, r) => sum + (r._sum.costUsd || 0), 0)
  const byProvider = Object.fromEntries(
    records.map((r) => [
      r.provider,
      {
        costUsd: r._sum.costUsd || 0,
        tokensUsed: r._sum.tokensUsed || 0,
        calls: r._count.id,
      },
    ])
  )

  return c.json({ date: todayStart.toISOString().split('T')[0], totalCostUsd, byProvider })
})
