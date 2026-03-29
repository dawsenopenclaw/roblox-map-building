import { db } from './db'
import { Prisma } from '@prisma/client'

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
  })
}

export async function getTokenBalance(userId: string) {
  return db.tokenBalance.findUnique({
    where: { userId },
    include: { transactions: { orderBy: { createdAt: 'desc' }, take: 20 } },
  })
}
