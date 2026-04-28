import { db } from './db'
import { Prisma } from '@prisma/client'
import { sendTokenLowEmail, sendUpgradeNudgeEmail } from './email'
import { dispatchWebhookEvent } from './webhook-dispatch'
import { getRedis } from './redis'

export async function earnTokens(
  userId: string,
  amount: number,
  type: 'PURCHASE' | 'BONUS' | 'ROLLOVER' | 'SUBSCRIPTION_GRANT' | 'REFUND',
  description: string,
  metadata?: Record<string, unknown>
) {
  return db.$transaction(async (tx) => {
    const balance = await tx.tokenBalance.upsert({
      where: { userId },
      create: { userId, balance: amount, lifetimeEarned: amount },
      update: {
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
    // Block spending for subscriptions that are past due or canceled
    const sub = await tx.subscription.findUnique({ where: { userId }, select: { status: true } })
    if (sub?.status === 'PAST_DUE' || sub?.status === 'CANCELED') {
      throw new Error('Subscription payment overdue')
    }

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
    // token.low — balance fell below 20% of plan quota but not yet depleted.
    // Throttle to once per 24 hours per user to prevent email spam on every spend.
    if (balance.balance > 0 && percentRemaining < 20) {
      dispatchWebhookEvent(userId, 'token.low', {
        userId,
        remainingTokens: balance.balance,
        planQuota,
        percentRemaining,
      }).catch(() => {})

      // Check if we already sent a low-token email in the last 24 hours
      const redis = getRedis()
      const throttleKey = `token_low_email:${userId}`
      const alreadySent = redis ? await redis.get(throttleKey).catch(() => null) : null
      if (!alreadySent) {
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
        // Mark as sent for 24 hours regardless of email success — avoid hammering
        if (redis) {
          redis.set(throttleKey, '1', 'EX', 86400).catch(() => {})
        }
      }
    }

    // Upgrade nudge — free users who drop below 200 tokens (80% of 1,000 used).
    // Only send once per user (lifetime throttle via Redis key that never expires).
    const tier = sub?.tier ?? 'FREE'
    if (tier === 'FREE' && balance.balance > 0 && balance.balance <= 200) {
      const redis = getRedis()
      const nudgeKey = `upgrade_nudge_email:${userId}`
      const alreadySent = redis ? await redis.get(nudgeKey).catch(() => null) : null
      if (!alreadySent) {
        const user = await db.user.findUnique({ where: { id: userId }, select: { email: true, displayName: true } })
        if (user?.email) {
          sendUpgradeNudgeEmail({
            email: user.email,
            name: user.displayName || 'Creator',
            tokenCount: balance.balance,
          }).catch((err) => {
            console.warn('[tokens] Failed to send upgrade nudge email:', err)
          })
        }
        // Mark as sent permanently (30 day TTL) — only nudge once
        if (redis) {
          redis.set(nudgeKey, '1', 'EX', 2592000).catch(() => {})
        }
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
