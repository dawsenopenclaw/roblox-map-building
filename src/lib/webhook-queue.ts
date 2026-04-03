import type { TokenTransactionType, Prisma } from '@prisma/client'
import { db } from '@/lib/db'

export type TokenGrantJobInput = {
  userId: string
  amount: number
  type: TokenTransactionType
  description: string
  metadata?: Prisma.InputJsonValue
  invoiceId?: string
  sessionId?: string
}

/** Queue a token grant for async processing. Persists to DB immediately. */
export async function queueTokenGrant(job: TokenGrantJobInput) {
  return db.tokenGrantJob.create({
    data: {
      userId: job.userId,
      amount: job.amount,
      type: job.type,
      description: job.description,
      metadata: job.metadata ?? undefined,
      invoiceId: job.invoiceId,
      sessionId: job.sessionId,
      status: 'PENDING',
    },
  })
}

/** Process pending token grant jobs. Returns the number of jobs processed. */
export async function processTokenGrantJobs(batchSize = 50): Promise<number> {
  const pendingJobs = await db.tokenGrantJob.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    take: batchSize,
  })

  let processed = 0

  for (const job of pendingJobs) {
    try {
      // Mark as processing
      await db.tokenGrantJob.update({
        where: { id: job.id },
        data: { status: 'PROCESSING', attempts: { increment: 1 } },
      })

      // Credit the user's token balance in a transaction
      await db.$transaction(async (tx) => {
        // Upsert token balance — create if missing (new user)
        const balance = await tx.tokenBalance.upsert({
          where: { userId: job.userId },
          create: {
            userId: job.userId,
            balance: job.amount,
            lifetimeEarned: job.amount,
          },
          update: {
            balance: { increment: job.amount },
            lifetimeEarned: { increment: job.amount },
          },
        })

        // Record the transaction
        await tx.tokenTransaction.create({
          data: {
            balanceId: balance.id,
            type: job.type,
            amount: job.amount,
            description: job.description,
            metadata: job.metadata ?? undefined,
          },
        })
      })

      // Mark completed
      await db.tokenGrantJob.update({
        where: { id: job.id },
        data: { status: 'COMPLETED', processedAt: new Date() },
      })

      processed++
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[webhook-queue] Failed to process token grant:', { jobId: job.id, error: message })

      await db.tokenGrantJob.update({
        where: { id: job.id },
        data: {
          status: job.attempts >= 2 ? 'FAILED' : 'PENDING',
          lastError: message,
        },
      }).catch(() => {}) // Don't throw on status update failure
    }
  }

  return processed
}

/** Get pending token grants for a user (admin/debug). */
export async function getPendingTokenGrants(userId: string) {
  return db.tokenGrantJob.findMany({
    where: { userId, status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
  })
}

/** Get failed token grant jobs (admin view). */
export async function getFailedTokenGrants(limit = 100) {
  return db.tokenGrantJob.findMany({
    where: { status: 'FAILED' },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

/** Retry a failed token grant job by resetting its status. */
export async function retryTokenGrantJob(jobId: string) {
  await db.tokenGrantJob.update({
    where: { id: jobId },
    data: { status: 'PENDING', lastError: null },
  })
}
