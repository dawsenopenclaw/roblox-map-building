/**
 * Global and per-user spending guard — hard daily caps to prevent API key abuse.
 *
 * This is a last-line-of-defense circuit breaker. Even if rate limits and token
 * balances are somehow bypassed, this stops runaway bills.
 *
 * Redis key patterns:
 *   spend:global:{YYYY-MM-DD}        — total API calls across all users today
 *   spend:user:{userId}:{YYYY-MM-DD} — API calls for this user today
 *
 * Falls back to in-memory counters when Redis is unavailable (per-instance only).
 */

import 'server-only'
import { getRedis } from '@/lib/redis'

// ── Hard caps ─────────────────────────────────────────────────────────────────

/** Max AI API calls across ALL users per day. If hit, all AI stops until midnight UTC. */
const GLOBAL_DAILY_CAP = 10_000

/** Max AI API calls per single user per day. Catches compromised accounts. */
const PER_USER_DAILY_CAP = 500

/** Max AI API calls per single user per hour. Catches automated abuse. */
const PER_USER_HOURLY_CAP = 100

const REDIS_DAY_TTL = 90_000  // 25 hours
const REDIS_HOUR_TTL = 3_700  // 61 minutes

// ── In-memory fallback ────────────────────────────────────────────────────────

const memCounters = new Map<string, { count: number; resetAt: number }>()

function memIncr(key: string, ttlMs: number): number {
  const now = Date.now()
  const entry = memCounters.get(key)
  if (!entry || entry.resetAt <= now) {
    memCounters.set(key, { count: 1, resetAt: now + ttlMs })
    return 1
  }
  entry.count++
  return entry.count
}

// Prune stale entries every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    memCounters.forEach((v, k) => { if (v.resetAt <= now) memCounters.delete(k) })
  }, 600_000).unref?.()
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function utcDate(): string {
  const d = new Date()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

function utcHour(): string {
  const d = new Date()
  return `${utcDate()}T${String(d.getUTCHours()).padStart(2, '0')}`
}

// ── Main check ────────────────────────────────────────────────────────────────

export interface SpendingGuardResult {
  allowed: boolean
  reason?: string
  globalCount: number
  userDayCount: number
  userHourCount: number
}

/**
 * Check if this AI request should be allowed. Call BEFORE making any external
 * API call (Anthropic, Gemini, Groq, Meshy, FAL, etc.).
 *
 * This also increments the counters, so only call once per request.
 */
export async function checkSpendingGuard(userId: string): Promise<SpendingGuardResult> {
  const redis = getRedis()
  const dayKey = utcDate()
  const hourKey = utcHour()

  let globalCount: number
  let userDayCount: number
  let userHourCount: number

  if (redis) {
    try {
      const pipe = redis.pipeline()
      pipe.incr(`spend:global:${dayKey}`)
      pipe.expire(`spend:global:${dayKey}`, REDIS_DAY_TTL)
      pipe.incr(`spend:user:${userId}:${dayKey}`)
      pipe.expire(`spend:user:${userId}:${dayKey}`, REDIS_DAY_TTL)
      pipe.incr(`spend:user:${userId}:hour:${hourKey}`)
      pipe.expire(`spend:user:${userId}:hour:${hourKey}`, REDIS_HOUR_TTL)
      const results = await pipe.exec()
      globalCount = (results?.[0]?.[1] as number) ?? 0
      userDayCount = (results?.[2]?.[1] as number) ?? 0
      userHourCount = (results?.[4]?.[1] as number) ?? 0
    } catch {
      // Redis failed — use memory fallback
      globalCount = memIncr(`spend:global:${dayKey}`, 86_400_000)
      userDayCount = memIncr(`spend:user:${userId}:${dayKey}`, 86_400_000)
      userHourCount = memIncr(`spend:user:${userId}:hour:${hourKey}`, 3_600_000)
    }
  } else {
    globalCount = memIncr(`spend:global:${dayKey}`, 86_400_000)
    userDayCount = memIncr(`spend:user:${userId}:${dayKey}`, 86_400_000)
    userHourCount = memIncr(`spend:user:${userId}:hour:${hourKey}`, 3_600_000)
  }

  if (globalCount > GLOBAL_DAILY_CAP) {
    console.error(`[SPENDING GUARD] GLOBAL DAILY CAP HIT: ${globalCount}/${GLOBAL_DAILY_CAP}`)
    return {
      allowed: false,
      reason: 'Our AI systems are at capacity for today. Please try again tomorrow.',
      globalCount, userDayCount, userHourCount,
    }
  }

  if (userDayCount > PER_USER_DAILY_CAP) {
    console.error(`[SPENDING GUARD] USER DAILY CAP HIT: ${userId} at ${userDayCount}/${PER_USER_DAILY_CAP}`)
    return {
      allowed: false,
      reason: 'You\'ve reached the daily generation limit. Your limit resets at midnight UTC.',
      globalCount, userDayCount, userHourCount,
    }
  }

  if (userHourCount > PER_USER_HOURLY_CAP) {
    console.warn(`[SPENDING GUARD] USER HOURLY CAP: ${userId} at ${userHourCount}/${PER_USER_HOURLY_CAP}`)
    return {
      allowed: false,
      reason: 'Too many requests this hour. Please wait a bit and try again.',
      globalCount, userDayCount, userHourCount,
    }
  }

  return { allowed: true, globalCount, userDayCount, userHourCount }
}

// ═══════════════════════════════════════════════════════════════════════
// OPENROUTER COST GUARD — $30/day per user, master toggle
// ═══════════════════════════════════════════════════════════════════════

/**
 * Master toggle for paid AI models.
 *
 * Set ENABLE_PAID_MODELS=true in .env to activate OpenRouter.
 * When false (default), the system uses ONLY free models (Gemini + Groq).
 *
 * This is your safety switch — don't turn it on until you have revenue.
 */
export function isPaidModelsEnabled(): boolean {
  return process.env.ENABLE_PAID_MODELS === 'true'
}

/** Per-user daily cost cap in USD. Default $30/day. */
const USER_DAILY_COST_CAP = Number(process.env.USER_DAILY_COST_CAP ?? '5')

/** Global daily cost cap in USD. Default $200/day. */
const GLOBAL_DAILY_COST_CAP = Number(process.env.GLOBAL_DAILY_COST_CAP ?? '50')

/**
 * Track and check cost for a request.
 * Returns false if the user or global cap would be exceeded.
 *
 * @param userId     Clerk user ID
 * @param costUsd    Estimated cost for this request in USD
 */
export async function checkCostGuard(
  userId: string,
  costUsd: number,
): Promise<{ allowed: boolean; reason?: string; userDayCost: number; globalDayCost: number }> {
  // If paid models are disabled, no cost tracking needed
  if (!isPaidModelsEnabled()) {
    return { allowed: true, userDayCost: 0, globalDayCost: 0 }
  }

  const redis = getRedis()
  const dayKey = utcDate()
  const userCostKey = `cost:user:${userId}:${dayKey}`
  const globalCostKey = `cost:global:${dayKey}`

  // Cost is stored in cents (integer) to avoid floating point issues
  const costCents = Math.ceil(costUsd * 100)

  let userDayCents = 0
  let globalDayCents = 0

  if (redis) {
    try {
      const pipe = redis.pipeline()
      pipe.incrby(userCostKey, costCents)
      pipe.expire(userCostKey, REDIS_DAY_TTL)
      pipe.incrby(globalCostKey, costCents)
      pipe.expire(globalCostKey, REDIS_DAY_TTL)
      const results = await pipe.exec()
      userDayCents = (results?.[0]?.[1] as number) ?? 0
      globalDayCents = (results?.[2]?.[1] as number) ?? 0
    } catch {
      // Redis unavailable — use memory fallback
      userDayCents = memIncr(userCostKey, 86_400_000) * costCents
      globalDayCents = memIncr(globalCostKey, 86_400_000) * costCents
    }
  } else {
    userDayCents = memIncr(userCostKey, 86_400_000) * costCents
    globalDayCents = memIncr(globalCostKey, 86_400_000) * costCents
  }

  const userDayCost = userDayCents / 100
  const globalDayCost = globalDayCents / 100

  if (userDayCost > USER_DAILY_COST_CAP) {
    console.error(`[COST GUARD] USER CAP: ${userId} spent $${userDayCost.toFixed(2)}/$${USER_DAILY_COST_CAP} today`)
    return {
      allowed: false,
      reason: `You've reached the $${USER_DAILY_COST_CAP}/day AI spending limit. Switching to free models.`,
      userDayCost,
      globalDayCost,
    }
  }

  if (globalDayCost > GLOBAL_DAILY_COST_CAP) {
    console.error(`[COST GUARD] GLOBAL CAP: $${globalDayCost.toFixed(2)}/$${GLOBAL_DAILY_COST_CAP} today`)
    return {
      allowed: false,
      reason: 'AI systems at capacity. Switching to free models.',
      userDayCost,
      globalDayCost,
    }
  }

  return { allowed: true, userDayCost, globalDayCost }
}

/**
 * Estimate cost for a model + token count.
 * Returns cost in USD.
 */
export function estimateRequestCost(modelId: string, inputTokens: number, outputTokens: number): number {
  // Cost per million tokens (approximate)
  const costs: Record<string, [number, number]> = {
    // [inputPer1M, outputPer1M]
    'google/gemini-2.5-flash-exp:free': [0, 0],
    'meta-llama/llama-3.3-70b-instruct': [0, 0],
    'google/gemini-2.5-flash-preview': [0.15, 0.60],
    'deepseek/deepseek-chat-v3-0324': [0.14, 0.28],
    'anthropic/claude-sonnet-4': [3, 15],
    'openai/gpt-4o': [2.5, 10],
    'google/gemini-2.5-pro-preview': [1.25, 10],
    'anthropic/claude-opus-4': [15, 75],
    'openai/gpt-4.1': [2, 8],
  }

  const [inputCost, outputCost] = costs[modelId] ?? [0, 0]
  return (inputTokens * inputCost + outputTokens * outputCost) / 1_000_000
}
