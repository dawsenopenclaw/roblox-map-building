import { db } from './db'
import { earnTokens } from './tokens-server'
import type { TokenTransactionType } from '@prisma/client'

export type TokenGrantJob = {
  userId: string
  amount: number
  type: TokenTransactionType
  description: string
  metadata?: Record<string, unknown>
  invoiceId?: string
  sessionId?: string
}

/**
 * Queue a token grant for async processing
 * This survives webhook handler failures and database downtime
 * A background worker should poll TokenGrantJob status='PENDING' and process them
 */
export async function queueTokenGrant(job: TokenGrantJob) {
  // Check for existing job to prevent duplicates
  if (job.invoiceId) {
    const existing = await db.tokenGrantJob.findFirst({
      where: {
        userId: job.userId,
        invoiceId: job.invoiceId,
        status: { in: ['PENDING', 'PROCESSING', 'COMPLETED'] },
      },
    })
    if (existing) return existing // Already queued/processed
  }

  if (job.sessionId) {
    const existing = await db.tokenGrantJob.findFirst({
      where: {
        userId: job.userId,
        sessionId: job.sessionId,
        status: { in: ['PENDING', 'PROCESSING', 'COMPLETED'] },
      },
    })
    if (existing) return existing
  }

  return db.tokenGrantJob.create({
    data: {
      userId: job.userId,
      amount: job.amount,
      type: job.type,
      description: job.description,
      metadata: job.metadata,
      invoiceId: job.invoiceId,
      sessionId: job.sessionId,
      status: 'PENDING',
    },
  })
}

/**
 * Process pending token grant jobs
 * Call this from a background worker (Inngest, Bull, cron, etc.)
 * Returns number of jobs processed
 */
export async function processTokenGrantJobs(batchSize = 50): Promise<number> {
  const jobs = await db.tokenGrantJob.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    take: batchSize,
  })

  let processed = 0

  for (const job of jobs) {
    try {
      // Mark as processing to prevent duplicate processing
      await db.tokenGrantJob.update({
        where: { id: job.id },
        data: { status: 'PROCESSING', attempts: { increment: 1 } },
      })

      // Process the grant
      await earnTokens(job.userId, job.amount, job.type, job.description, job.metadata)

      // Mark as completed
      await db.tokenGrantJob.update({
        where: { id: job.id },
        data: { status: 'COMPLETED', processedAt: new Date() },
      })

      processed++
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      const attempts = (job.attempts || 0) + 1
      const maxAttempts = 10

      if (attempts >= maxAttempts) {
        // Max retries exceeded, mark as failed
        await db.tokenGrantJob.update({
          where: { id: job.id },
          data: {
            status: 'FAILED',
            lastError: `Max attempts (${maxAttempts}) exceeded: ${message}`,
          },
        })
        console.error('[token-grant-job] Failed after max attempts', {
          jobId: job.id,
          userId: job.userId,
          attempts,
          error: message,
        })
      } else {
        // Retry: reset to PENDING
        await db.tokenGrantJob.update({
          where: { id: job.id },
          data: {
            status: 'PENDING',
            lastError: message,
            attempts: { increment: 1 },
          },
        })
        console.warn('[token-grant-job] Retry scheduled', {
          jobId: job.id,
          userId: job.userId,
          attempts,
          error: message,
        })
      }
    }
  }

  return processed
}

/**
 * Get pending token grant jobs for a user
 * Useful for debugging or admin dashboards
 */
export async function getPendingTokenGrants(userId: string) {
  return db.tokenGrantJob.findMany({
    where: {
      userId,
      status: { in: ['PENDING', 'PROCESSING'] },
    },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Get failed token grant jobs (admin view)
 */
export async function getFailedTokenGrants(limit = 100) {
  return db.tokenGrantJob.findMany({
    where: { status: 'FAILED' },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

/**
 * Retry a failed token grant job
 */
export async function retryTokenGrantJob(jobId: string) {
  return db.tokenGrantJob.update({
    where: { id: jobId },
    data: {
      status: 'PENDING',
      attempts: 0,
      lastError: null,
    },
  })
}
