import { db } from './db'

export async function recordApiUsage({
  userId,
  provider,
  operation,
  tokensUsed = 0,
  costUsd = 0,
  durationMs,
  success = true,
  metadata,
}: {
  userId: string
  provider: 'claude' | 'deepgram' | 'meshy' | 'fal' | 'elevenlabs' | 'openai'
  operation: string
  tokensUsed?: number
  costUsd?: number
  durationMs?: number
  success?: boolean
  metadata?: Record<string, unknown>
}) {
  return db.apiUsageRecord.create({
    data: {
      userId,
      provider,
      operation,
      tokensUsed,
      costUsd,
      durationMs,
      success,
      metadata: metadata as never,
    },
  })
}
