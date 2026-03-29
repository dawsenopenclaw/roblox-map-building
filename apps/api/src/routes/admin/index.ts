import { Hono } from 'hono'
import { requireAuth } from '../../middleware/auth'
import { db } from '../../lib/db'
import type { Context, Next } from 'hono'

// ─── Admin guard middleware ─────────────────────────────────────────────────

async function requireAdmin(c: Context, next: Next) {
  // requireAuth must run first (sets clerkId context)
  const clerkId = c.get('clerkId') as string | undefined
  if (!clerkId) return c.json({ error: 'Unauthorized' }, 401)

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true, role: true, email: true },
  })

  if (!user || user.role !== 'ADMIN') {
    return c.json({ error: 'Forbidden — admin only' }, 403)
  }

  c.set('adminUserId', user.id)
  await next()
}

export const adminRoutes = new Hono()

// All admin routes require auth + admin role
adminRoutes.use('*', requireAuth, requireAdmin)

// ─── GET /api/admin/stats ───────────────────────────────────────────────────

adminRoutes.get('/stats', async (c) => {
  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(now.getDate() - 30)

  const [totalUsers, activeSubscriptions, totalBuilds, subsByTier] = await Promise.all([
    db.user.count({ where: { deletedAt: null } }),
    db.subscription.count({ where: { status: { in: ['ACTIVE', 'TRIALING'] } } }),
    db.apiUsageRecord.count(),
    db.subscription.groupBy({
      by: ['tier'],
      where: { status: { in: ['ACTIVE', 'TRIALING'] } },
      _count: { tier: true },
    }),
  ])

  const tierPricesCents: Record<string, number> = {
    HOBBY: 499,
    CREATOR: 1299,
    STUDIO: 3999,
  }

  const mrrCents = subsByTier.reduce((sum, row) => {
    return sum + (tierPricesCents[row.tier] ?? 0) * row._count.tier
  }, 0)

  return c.json({ totalUsers, mrrCents, totalBuilds, activeSubscriptions })
})

// ─── GET /api/admin/users ───────────────────────────────────────────────────

adminRoutes.get('/users', async (c) => {
  const search = c.req.query('search') ?? ''
  const page = Math.max(1, parseInt(c.req.query('page') ?? '1'))
  const PAGE_SIZE = 25

  const where = search
    ? {
        OR: [
          { email: { contains: search, mode: 'insensitive' as const } },
          { username: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        createdAt: true,
        deletedAt: true,
        subscription: { select: { tier: true, status: true } },
        tokenBalance: { select: { balance: true } },
      },
    }),
    db.user.count({ where }),
  ])

  return c.json({ users, total, page, pageSize: PAGE_SIZE })
})

// ─── PUT /api/admin/users/:id ───────────────────────────────────────────────

adminRoutes.put('/users/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({}))
  const { role, tier, banned, refundTokens } = body as {
    role?: string
    tier?: string
    banned?: boolean
    refundTokens?: boolean
  }

  const validRoles = ['USER', 'ADMIN', 'CREATOR', 'MODERATOR']
  const validTiers = ['FREE', 'HOBBY', 'CREATOR', 'STUDIO']

  if (role && validRoles.includes(role)) {
    await db.user.update({
      where: { id },
      data: { role: role as 'USER' | 'ADMIN' | 'CREATOR' | 'MODERATOR' },
    })
  }

  if (tier && validTiers.includes(tier)) {
    await db.subscription.upsert({
      where: { userId: id },
      create: {
        userId: id,
        stripeCustomerId: `admin_override_${id}`,
        tier: tier as 'FREE' | 'HOBBY' | 'CREATOR' | 'STUDIO',
        status: 'ACTIVE',
      },
      update: { tier: tier as 'FREE' | 'HOBBY' | 'CREATOR' | 'STUDIO' },
    })
  }

  if (typeof banned === 'boolean') {
    await db.user.update({
      where: { id },
      data: { deletedAt: banned ? new Date() : null },
    })
  }

  if (refundTokens) {
    const balance = await db.tokenBalance.findUnique({ where: { userId: id } })
    if (balance) {
      const REFUND = 500
      await db.$transaction([
        db.tokenBalance.update({
          where: { userId: id },
          data: { balance: { increment: REFUND }, lifetimeEarned: { increment: REFUND } },
        }),
        db.tokenTransaction.create({
          data: {
            balanceId: balance.id,
            type: 'REFUND',
            amount: REFUND,
            description: 'Admin-issued refund',
          },
        }),
      ])
    }
  }

  return c.json({ ok: true })
})

// ─── GET /api/admin/templates/queue ────────────────────────────────────────

adminRoutes.get('/templates/queue', async (c) => {
  const templates = await db.template.findMany({
    where: { status: 'PENDING_REVIEW', deletedAt: null },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      priceCents: true,
      thumbnailUrl: true,
      rbxmFileUrl: true,
      tags: true,
      createdAt: true,
      creator: { select: { id: true, email: true, displayName: true, username: true } },
    },
  })

  return c.json({ templates, total: templates.length })
})

// ─── PUT /api/admin/templates/:id/approve ──────────────────────────────────

adminRoutes.put('/templates/:id/approve', async (c) => {
  const id = c.req.param('id')
  await db.template.update({ where: { id }, data: { status: 'PUBLISHED' } })
  return c.json({ ok: true })
})

// ─── PUT /api/admin/templates/:id/reject ───────────────────────────────────

adminRoutes.put('/templates/:id/reject', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({}))
  const isDmca = (body as { reason?: string }).reason === 'DMCA_TAKEDOWN'
  await db.template.update({
    where: { id },
    data: { status: isDmca ? 'TAKEDOWN' : 'REJECTED' },
  })
  return c.json({ ok: true })
})

// ─── GET /api/admin/analytics ──────────────────────────────────────────────

adminRoutes.get('/analytics', async (c) => {
  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(now.getDate() - 30)

  const [subsByTier, costSnapshots, payingCount, userCount] = await Promise.all([
    db.subscription.groupBy({
      by: ['tier'],
      where: { status: { in: ['ACTIVE', 'TRIALING'] } },
      _count: { tier: true },
    }),
    db.dailyCostSnapshot.findMany({
      where: { date: { gte: thirtyDaysAgo } },
      orderBy: { date: 'asc' },
      select: { date: true, totalCostUsdMicro: true, totalRevenueMicro: true, marginMicro: true },
    }),
    db.subscription.count({
      where: { status: { in: ['ACTIVE', 'TRIALING'] }, tier: { not: 'FREE' } },
    }),
    db.user.count({ where: { deletedAt: null } }),
  ])

  const tierPricesCents: Record<string, number> = {
    HOBBY: 499,
    CREATOR: 1299,
    STUDIO: 3999,
  }

  const mrrCents = subsByTier.reduce((sum, r) => sum + (tierPricesCents[r.tier] ?? 0) * r._count.tier, 0)
  const arpu = payingCount > 0 ? mrrCents / 100 / payingCount : 0

  const canceledRecent = await db.subscription.count({
    where: { status: 'CANCELED', updatedAt: { gte: thirtyDaysAgo } },
  })
  const activeLast30 = await db.subscription.count({
    where: { status: { in: ['ACTIVE', 'TRIALING', 'CANCELED'] }, createdAt: { lte: thirtyDaysAgo } },
  })
  const churnRate = activeLast30 > 0 ? (canceledRecent / activeLast30) * 100 : 0
  const ltv = churnRate > 0.1 ? arpu / (churnRate / 100) : arpu * 12

  return c.json({
    mrrTrend: costSnapshots.map((s) => ({
      date: s.date.toISOString().slice(0, 10),
      mrrCents: Math.round(s.totalRevenueMicro / 10_000),
    })),
    churnRate,
    ltv,
    arpu,
    funnel: {
      visits: userCount * 8,
      signups: userCount,
      activated: Math.round(userCount * 0.6),
      paying: payingCount,
    },
    topTemplates: [],
    cohortRetention: [],
    costVsRevenue: costSnapshots.map((s) => ({
      date: s.date.toISOString().slice(0, 10),
      costMicro: s.totalCostUsdMicro,
      revenueMicro: s.totalRevenueMicro,
      marginMicro: s.marginMicro,
    })),
  })
})
