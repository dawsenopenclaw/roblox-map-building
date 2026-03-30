import { db } from './db'
import { Prisma } from '@prisma/client'
import { sendTokenLowEmail } from './email'
import { dispatchWebhookEvent } from './webhook-dispatch'

export async function earnTokens(
  userId: string,
  amount: number,
  type: 'PURCHASE' | 'BONUS' | 'ROLLOVER' | 'SUBSCRIPTION_GRANT' | 'REFUND',
  description: string,
  metadata?: Record<string, unknown>
) {
  return db.$transaction(async (tx) => {
    const balance = await tx.tokenBalance.update({
      where: { userId },
      data: {
        balance: { increment: amount },
        lifetimeEarned: { increment: amount },
      },
    })
    await tx.tokenTransaction.create({
      data: {
        balanceId: balance.id,
        type,
        amount,
        description,
        metadata: (metadata ?? Prisma.DbNull) as Prisma.InputJsonValue,
      },
    })
    return balance
  })
}

export async function spendTokens(
  userId: string,
  amount: number,
  description: string,
  metadata?: Record<string, unknown>
) {
  return db.$transaction(async (tx) => {
    // Use updateMany with a balance filter to prevent race-condition overdrafts.
    // This collapses the read-check-write into a single atomic conditional update.
    const updated = await tx.tokenBalance.updateMany({
      where: { userId, balance: { gte: amount } },
      data: {
        balance: { decrement: amount },
        lifetimeSpent: { increment: amount },
      },
    })

    if (updated.count === 0) {
      // Either record doesn't exist or balance was insufficient
      const current = await tx.tokenBalance.findUnique({ where: { userId } })
      if (!current) throw new Error('Token balance not found')
      throw new Error('Insufficient token balance')
    }

    const balance = await tx.tokenBalance.findUniqueOrThrow({ where: { userId } })
    await tx.tokenTransaction.create({
      data: {
        balanceId: balance.id,
        type: 'SPEND',
        amount: -amount,
        description,
        metadata: (metadata ?? Prisma.DbNull) as Prisma.InputJsonValue,
      },
    })
    return balance
  }).then(async (balance) => {
    const TIER_QUOTAS: Record<string, number> = { FREE: 1000, HOBBY: 2000, CREATOR: 7000, STUDIO: 20000 }
    const sub = await db.subscription.findUnique({ where: { userId }, select: { tier: true } })
    const planQuota = TIER_QUOTAS[sub?.tier ?? 'FREE'] ?? 1000
    const percentRemaining = Math.round((balance.balance / planQuota) * 100)

    // token.depleted — balance hit 0
    if (balance.balance === 0) {
      dispatchWebhookEvent(userId, 'token.depleted', {
        userId,
        planQuota,
        depletedAt: new Date().toISOString(),
      }).catch(() => {})
    }
    // token.low — balance fell below 20% of plan quota but not yet depleted
    if (balance.balance > 0 && percentRemaining < 20) {
      dispatchWebhookEvent(userId, 'token.low', {
        userId,
        remainingTokens: balance.balance,
        planQuota,
        percentRemaining,
      }).catch(() => {})
      const user = await db.user.findUnique({ where: { id: userId }, select: { email: true, displayName: true } })
      if (user?.email) {
        sendTokenLowEmail({
          email: user.email,
          name: user.displayName || 'Creator',
          tokenCount: balance.balance,
        }).catch((err) => {
          console.warn('[tokens] Failed to send low token email:', err)
        })
      }
    }
    return balance
  })
}

export async function getTokenBalance(userId: string) {
  return db.tokenBalance.findUnique({
    where: { userId },
    include: { transactions: { orderBy: { createdAt: 'desc' }, take: 20 } },
  })
}
