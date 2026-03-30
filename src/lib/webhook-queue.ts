// TODO: The TokenGrantJob model does not yet exist in the Prisma schema.
// Until the migration is run (add model TokenGrantJob to schema.prisma and
// run `prisma migrate dev`), all functions in this file are stubbed so the
// TypeScript build succeeds without referencing the missing model.
//
// To un-stub: add the model to prisma/schema.prisma, run the migration,
// then restore the full implementation from git history.

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

/** Queue a token grant for async processing. */
export async function queueTokenGrant(job: TokenGrantJob): Promise<TokenGrantJob> {
  // TODO: persist to TokenGrantJob table once the model exists in the schema.
  console.warn('[webhook-queue] queueTokenGrant is stubbed — TokenGrantJob model not in schema', {
    userId: job.userId,
    type: job.type,
    amount: job.amount,
  })
  return job
}

/** Process pending token grant jobs (background worker entry point). */
export async function processTokenGrantJobs(_batchSize = 50): Promise<number> {
  // TODO: implement once TokenGrantJob model is in the schema.
  return 0
}

/** Get pending token grants for a user (admin/debug). */
export async function getPendingTokenGrants(_userId: string): Promise<TokenGrantJob[]> {
  // TODO: implement once TokenGrantJob model is in the schema.
  return []
}

/** Get failed token grant jobs (admin view). */
export async function getFailedTokenGrants(_limit = 100): Promise<TokenGrantJob[]> {
  // TODO: implement once TokenGrantJob model is in the schema.
  return []
}

/** Retry a failed token grant job. */
export async function retryTokenGrantJob(_jobId: string): Promise<void> {
  // TODO: implement once TokenGrantJob model is in the schema.
}
