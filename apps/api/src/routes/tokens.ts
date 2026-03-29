import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth'
import { db } from '../lib/db'
import { createLogger } from '../lib/logger'
import { recordGauge, incrementCounter } from '../lib/metrics'

const log = createLogger('tokens')

export const tokenRoutes = new Hono()

tokenRoutes.get('/balance', requireAuth, async (c) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clerkId = (c as any).get('clerkId') as string
  const requestId = c.get('requestId') as string | undefined
  const userId = c.get('userId') as string | undefined
  const reqLog = log.child({ requestId, userId })

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

  const balance = user.tokenBalance.balance
  reqLog.debug('token balance fetched', { balance })

  // Track current balance as a gauge for monitoring
  if (userId) {
    recordGauge('token_balance_current', balance, { userId })
  }
  incrementCounter('payment_events_total', { event: 'balance_fetch' })

  return c.json({
    balance,
    lifetimeEarned: user.tokenBalance.lifetimeEarned,
    lifetimeSpent: user.tokenBalance.lifetimeSpent,
    transactions: user.tokenBalance.transactions,
  })
})
