/**
 * Per-user rate limits for the audio generation routes.
 *
 * Kept in a dedicated file so we can iterate on audio quotas without
 * touching `src/lib/rate-limit.ts`, which is shared with every other
 * AI endpoint and currently being edited by the mesh pipeline agent.
 *
 * Uses Upstash REST (shared with the rest of the app) when configured and
 * falls back to a per-instance in-memory counter. The in-memory fallback
 * is intentionally 2x the Redis limit so a multi-instance deploy still
 * approximates the real quota.
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { checkRateLimit, type RateLimitResult } from './rate-limit'

const upstashConfigured = !!(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
)

const redis = upstashConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

function createLimiter(requests: number, prefix: string): Ratelimit | null {
  if (!redis) return null
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, '1 h'),
    prefix,
  })
}

const musicLimiter = createLimiter(10, 'ratelimit:ai:audio:music')
const sfxLimiter   = createLimiter(30, 'ratelimit:ai:audio:sfx')
const voiceLimiter = createLimiter(20, 'ratelimit:ai:audio:voice')

/** Music: 10 requests per hour per user. */
export async function audioMusicRateLimit(userId: string): Promise<RateLimitResult> {
  return checkRateLimit(musicLimiter, userId, 10, 3600)
}

/** SFX: 30 requests per hour per user. */
export async function audioSfxRateLimit(userId: string): Promise<RateLimitResult> {
  return checkRateLimit(sfxLimiter, userId, 30, 3600)
}

/** Voice: 20 requests per hour per user. */
export async function audioVoiceRateLimit(userId: string): Promise<RateLimitResult> {
  return checkRateLimit(voiceLimiter, userId, 20, 3600)
}
