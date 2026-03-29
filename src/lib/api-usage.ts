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
  apiKeyId,
}: {
  userId: string
  provider: 'claude' | 'deepgram' | 'meshy' | 'fal' | 'elevenlabs' | 'openai'
  operation: string
  tokensUsed?: number
  /** Cost in USD (fractional). Stored internally as micro-dollars (integer). */
  costUsd?: number
  durationMs?: number
  success?: boolean
  metadata?: Record<string, unknown>
  /** Optional: API key that triggered this usage record */
  apiKeyId?: string | null
}) {
  return db.apiUsageRecord.create({
    data: {
      userId,
      provider,
      operation,
      tokensUsed,
      // Convert USD float → micro-dollars integer to avoid float precision drift
      costUsdMicro: Math.round(costUsd * 1_000_000),
      durationMs,
      success,
      metadata: metadata as never,
      ...(apiKeyId ? { apiKeyId } : {}),
    },
  })
}
