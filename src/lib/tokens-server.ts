import { db } from './db'

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
        metadata: metadata as any,
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
    const current = await tx.tokenBalance.findUnique({ where: { userId } })
    if (!current) throw new Error('Token balance not found')
    if (current.balance < amount) throw new Error('Insufficient token balance')

    const balance = await tx.tokenBalance.update({
      where: { userId },
      data: {
        balance: { decrement: amount },
        lifetimeSpent: { increment: amount },
      },
    })
    await tx.tokenTransaction.create({
      data: {
        balanceId: balance.id,
        type: 'SPEND',
        amount: -amount,
        description,
        metadata: metadata as any,
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
