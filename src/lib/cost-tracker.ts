/**
 * Real USD cost tracking for all AI operations.
 *
 * Design notes:
 * - Costs stored as micro-dollars (Int) in ApiUsageRecord to avoid float precision bugs.
 *   1 USD = 1_000_000 micro-dollars.
 * - DailyCostSnapshot is an aggregate (platform-wide) — kept separate from per-user spend.
 * - Per-user daily spend is computed from ApiUsageRecord on demand (cheap with the index).
 * - 80% warn / 100% block thresholds use tier budget defined in TIER_DAILY_BUDGET_USD.
 */

import 'server-only'
import { db } from '@/lib/db'

// ── USD cost table (exact, matches billing page) ──────────────────────────────

export const OPERATION_COSTS_USD: Record<string, number> = {
  meshy_preview:  0.03,
  meshy_refine:   0.10,
  fal_texture:    0.08,
  claude_haiku:   0.001,  // per 1K tokens
  claude_sonnet:  0.015,  // per 1K tokens
  roblox_upload:  0.00,
}

// ── Tier daily USD budgets (soft-limit per user) ──────────────────────────────

const TIER_DAILY_BUDGET_USD: Record<string, number> = {
  FREE:    0.50,
  HOBBY:   2.00,
  CREATOR: 8.00,
  STUDIO:  Infinity,
}

// Micro-dollar conversion helpers
const USD_TO_MICRO = 1_000_000
function toMicro(usd: number): number { return Math.round(usd * USD_TO_MICRO) }
function fromMicro(micro: number): number { return micro / USD_TO_MICRO }

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TrackCostParams {
  userId:      string
  operation:   keyof typeof OPERATION_COSTS_USD
  /** Pre-computed USD cost. Pass 0 for fixed-cost ops; pass (tokens/1000)*rate for LLM ops. */
  costUsd:     number
  tokensCost:  number
  metadata?:   Record<string, unknown>
}

export interface UserDailySpend {
  meshesGenerated:   number
  texturesGenerated: number
  buildsRun:         number
  totalCostUsd:      number
  tierLimit:         number
  percentUsed:       number
  warnThresholdHit:  boolean
  limitHit:          boolean
}

export interface PeriodSpend {
  totalCostUsd: number
  byOperation:  Record<string, number>
  recordCount:  number
}

// ── Core: record one operation ─────────────────────────────────────────────────

export async function trackCost(params: TrackCostParams): Promise<void> {
  const { userId, operation, costUsd, tokensCost, metadata } = params
  const costMicro = toMicro(costUsd)

  // Derive provider from operation name
  const provider = operation.startsWith('meshy')
    ? 'meshy'
    : operation.startsWith('fal')
      ? 'fal'
      : operation.startsWith('claude')
        ? 'anthropic'
        : 'roblox'

  await db.apiUsageRecord.create({
    data: {
      userId,
      provider,
      operation,
      tokensUsed:   tokensCost,
      costUsdMicro: costMicro,
      success:      true,
      metadata:     (metadata ?? {}) as Record<string, string | number | boolean | null>,
    },
  })

  // Fire-and-forget: update platform daily snapshot
  void updateDailyCostSnapshot(costMicro).catch(() => undefined)
}

// ── Platform daily cost snapshot (aggregated) ──────────────────────────────────

async function updateDailyCostSnapshot(newCostMicro: number): Promise<void> {
  const today = startOfDay(new Date())

  const existing = await db.dailyCostSnapshot.findUnique({
    where: { date: today },
  })

  if (existing) {
    await db.dailyCostSnapshot.update({
      where: { date: today },
      data:  {
        totalCostUsdMicro: { increment: newCostMicro },
        marginMicro:       { decrement: newCostMicro },
        updatedAt:         new Date(),
      },
    })
  } else {
    await db.dailyCostSnapshot.create({
      data: {
        date:              today,
        providerCosts:     {},
        totalCostUsdMicro: newCostMicro,
        totalRevenueMicro: 0,
        marginMicro:       -newCostMicro,
      },
    })
  }
}

// ── Per-user spend query ───────────────────────────────────────────────────────

export async function getUserDailySpend(userId: string): Promise<UserDailySpend> {
  const todayStart = startOfDay(new Date())
  const todayEnd   = endOfDay(new Date())

  const [records, subscription] = await Promise.all([
    db.apiUsageRecord.findMany({
      where: {
        userId,
        createdAt: { gte: todayStart, lte: todayEnd },
      },
      select: {
        operation:    true,
        costUsdMicro: true,
        tokensUsed:   true,
      },
    }),
    db.subscription.findUnique({
      where:  { userId },
      select: { tier: true, status: true },
    }),
  ])

  const isActive = subscription?.status === 'ACTIVE' || subscription?.status === 'TRIALING'
  const tier = isActive ? (subscription?.tier ?? 'FREE') : 'FREE'
  const tierLimit = TIER_DAILY_BUDGET_USD[tier] ?? TIER_DAILY_BUDGET_USD.FREE

  let meshesGenerated   = 0
  let texturesGenerated = 0
  let buildsRun         = 0
  let totalCostMicro    = 0

  for (const r of records) {
    totalCostMicro += r.costUsdMicro
    if (r.operation === 'meshy_preview' || r.operation === 'meshy_refine') meshesGenerated++
    if (r.operation === 'fal_texture') texturesGenerated++
    if (r.operation === 'claude_haiku' || r.operation === 'claude_sonnet') buildsRun++
  }

  const totalCostUsd = fromMicro(totalCostMicro)
  const percentUsed  = tierLimit === Infinity ? 0 : (totalCostUsd / tierLimit) * 100

  return {
    meshesGenerated,
    texturesGenerated,
    buildsRun,
    totalCostUsd,
    tierLimit: tierLimit === Infinity ? -1 : tierLimit,
    percentUsed: Math.min(percentUsed, 100),
    warnThresholdHit: percentUsed >= 80,
    limitHit: tierLimit !== Infinity && totalCostUsd >= tierLimit,
  }
}

// ── Platform-wide spend query ──────────────────────────────────────────────────

export async function getTotalSpend(period: { from: Date; to: Date }): Promise<PeriodSpend> {
  const records = await db.apiUsageRecord.findMany({
    where: { createdAt: { gte: period.from, lte: period.to } },
    select: { operation: true, costUsdMicro: true },
  })

  const byOperation: Record<string, number> = {}
  let totalMicro = 0

  for (const r of records) {
    totalMicro += r.costUsdMicro
    byOperation[r.operation] = (byOperation[r.operation] ?? 0) + fromMicro(r.costUsdMicro)
  }

  return {
    totalCostUsd: fromMicro(totalMicro),
    byOperation,
    recordCount:  records.length,
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function startOfDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0))
}

function endOfDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999))
}
