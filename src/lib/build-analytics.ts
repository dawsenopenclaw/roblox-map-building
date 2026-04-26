/**
 * Build Analytics — Track build success/failure metrics via Redis counters.
 *
 * Tracks per-day:
 * - builds:generated — total AI code generations
 * - builds:sent_to_studio — successfully sent to plugin
 * - builds:zero_errors — no console errors after 3s
 * - builds:verified — passed playtest verification
 * - builds:cache_hit — served from proven-build cache
 * - builds:error_recovered — auto-fixed by error recovery
 * - builds:user_thumbs_up — user gave positive feedback
 * - builds:user_thumbs_down — user gave negative feedback
 *
 * Redis key pattern: analytics:builds:{metric}:{YYYY-MM-DD}
 * TTL: 90 days (7,776,000 seconds)
 */

import 'server-only'
import { getRedis } from '@/lib/redis'

const TTL_SECONDS = 90 * 24 * 60 * 60 // 90 days

type BuildMetric =
  | 'generated'
  | 'sent_to_studio'
  | 'zero_errors'
  | 'verified'
  | 'cache_hit'
  | 'error_recovered'
  | 'user_thumbs_up'
  | 'user_thumbs_down'

function todayKey(metric: BuildMetric): string {
  const d = new Date()
  const day = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
  return `analytics:builds:${metric}:${day}`
}

/** Increment a build metric counter for today. Fire-and-forget. */
export async function trackBuild(metric: BuildMetric): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  try {
    const key = todayKey(metric)
    await redis.incr(key)
    await redis.expire(key, TTL_SECONDS)
  } catch {
    // Non-blocking — analytics should never break the build flow
  }
}

/** Track multiple metrics at once */
export async function trackBuildMulti(...metrics: BuildMetric[]): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  try {
    const pipeline = redis.pipeline()
    for (const metric of metrics) {
      const key = todayKey(metric)
      pipeline.incr(key)
      pipeline.expire(key, TTL_SECONDS)
    }
    await pipeline.exec()
  } catch {
    // Non-blocking
  }
}

/** Get metrics for a specific date (YYYY-MM-DD) or today */
export async function getBuildMetrics(date?: string): Promise<Record<BuildMetric, number>> {
  const redis = getRedis()
  const d = date || (() => {
    const now = new Date()
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`
  })()

  const metrics: BuildMetric[] = [
    'generated', 'sent_to_studio', 'zero_errors', 'verified',
    'cache_hit', 'error_recovered', 'user_thumbs_up', 'user_thumbs_down',
  ]

  const result: Record<string, number> = {}
  if (!redis) {
    for (const m of metrics) result[m] = 0
    return result as Record<BuildMetric, number>
  }

  try {
    const pipeline = redis.pipeline()
    for (const m of metrics) {
      pipeline.get(`analytics:builds:${m}:${d}`)
    }
    const values = await pipeline.exec()
    for (let i = 0; i < metrics.length; i++) {
      result[metrics[i]] = parseInt(String(values?.[i] ?? '0'), 10) || 0
    }
  } catch {
    for (const m of metrics) result[m] = 0
  }

  return result as Record<BuildMetric, number>
}

/** Get metrics for the last N days */
export async function getBuildMetricsRange(days: number = 7): Promise<Array<{ date: string; metrics: Record<BuildMetric, number> }>> {
  const results: Array<{ date: string; metrics: Record<BuildMetric, number> }> = []
  const now = new Date()
  for (let i = 0; i < days; i++) {
    const d = new Date(now)
    d.setUTCDate(d.getUTCDate() - i)
    const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
    const metrics = await getBuildMetrics(dateStr)
    results.push({ date: dateStr, metrics })
  }
  return results
}

/** Compute success rate from metrics */
export function computeSuccessRate(metrics: Record<BuildMetric, number>): {
  generationRate: number    // % of builds that generated code
  studioRate: number        // % that made it to Studio
  errorFreeRate: number     // % with zero errors
  verificationRate: number  // % that passed verification
  cacheHitRate: number      // % served from cache
  overallScore: number      // weighted composite 0-100
} {
  const gen = metrics.generated || 1 // avoid div by zero
  const studioRate = (metrics.sent_to_studio / gen) * 100
  const errorFreeRate = metrics.sent_to_studio > 0
    ? (metrics.zero_errors / metrics.sent_to_studio) * 100
    : 0
  const verificationRate = metrics.sent_to_studio > 0
    ? (metrics.verified / metrics.sent_to_studio) * 100
    : 0
  const cacheHitRate = (metrics.cache_hit / gen) * 100

  // Weighted score: 40% error-free, 30% verification, 20% studio delivery, 10% cache efficiency
  const overallScore = Math.round(
    errorFreeRate * 0.4 +
    verificationRate * 0.3 +
    studioRate * 0.2 +
    cacheHitRate * 0.1
  )

  return {
    generationRate: 100, // if generated, it generated
    studioRate: Math.round(studioRate),
    errorFreeRate: Math.round(errorFreeRate),
    verificationRate: Math.round(verificationRate),
    cacheHitRate: Math.round(cacheHitRate),
    overallScore,
  }
}
