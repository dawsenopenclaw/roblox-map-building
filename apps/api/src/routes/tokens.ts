import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth'
import { db } from '../lib/db'

export const tokenRoutes = new Hono()

tokenRoutes.get('/balance', requireAuth, async (c) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clerkId = (c as any).get('clerkId') as string
  const user = await db.user.findUnique({
    where: { clerkId },
    include: {
      tokenBalance: {
        include: {
          transactions: { orderBy: { createdAt: 'desc' }, take: 10 },
        },
      },
    },
  })
  if (!user?.tokenBalance) return c.json({ balance: 0, transactions: [] })
  return c.json({
    balance: user.tokenBalance.balance,
    lifetimeEarned: user.tokenBalance.lifetimeEarned,
    lifetimeSpent: user.tokenBalance.lifetimeSpent,
    transactions: user.tokenBalance.transactions,
  })
})
