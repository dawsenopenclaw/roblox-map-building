/**
 * POST /api/ai/generate
 * General-purpose AI generation: terrain, city, assets, full-game
 * Cost estimation → confirmation → pipeline execution
 */

import { randomBytes } from 'crypto'
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { requireAuth } from '../../middleware/auth'
import { aiRateLimit } from '../../middleware/security'
import {
  terrainPipeline,
  cityPipeline,
  assetsPipeline,
  estimatePipelineCost,
  type ProgressCallback,
} from '../../lib/ai/pipeline'
import { estimateCost, usdToTokens } from '../../lib/ai/cost-estimator'
import { getAllCircuitStats } from '../../lib/ai/circuit-breaker'
import { db } from '../../lib/db'
import { createLogger } from '../../lib/logger'
import { incrementCounter, recordDuration, recordGauge } from '../../lib/metrics'
import {
  notifyBuildComplete,
  notifyBuildFailed,
  notifyTokenLow,
  notifyTokenDepleted,
} from '../../lib/notifications'
import { dispatchWebhookEvent } from '../../lib/webhook-delivery'
import { aiGenerateSchema } from '../../lib/validators'

const log = createLogger('ai:generate')

async function spendTokens(userId: string, amount: number, description: string) {
  return db.$transaction(async (tx) => {
    const current = await tx.tokenBalance.findUnique({ where: { userId } })
    if (!current) throw new Error('Token balance not found')
    if (current.balance < amount) throw new Error('Insufficient token balance')
    const balance = await tx.tokenBalance.update({
      where: { userId },
      data: { balance: { decrement: amount }, lifetimeSpent: { increment: amount } },
    })
    await tx.tokenTransaction.create({
      data: {
        balanceId: balance.id,
        type: 'SPEND',
        amount: -amount,
        description,
        metadata: {} as never,
      },
    })
    return balance
  })
}

export const generateRoutes = new Hono()

generateRoutes.use('*', requireAuth)
generateRoutes.use('*', aiRateLimit)

type GenerationMode = 'terrain' | 'city' | 'assets' | 'full-game'

interface GenerateBody {
  mode: GenerationMode
  prompt: string
  confirmed?: boolean
  options?: {
    style?: string
    buildingCount?: number
    assetCount?: number
    assetTypes?: string[]
    size?: { width: number; height: number }
    zones?: string[]
  }
}

/**
 * POST /api/ai/generate
 * Two-phase: first call returns estimate (confirmed=false), second executes (confirmed=true)
 */
generateRoutes.post('/', zValidator('json', aiGenerateSchema), async (c) => {
  const start = Date.now()
  const userId = c.get('userId') as string
  const requestId = c.get('requestId') as string | undefined
  const reqLog = log.child({ requestId, userId })

  if (!userId) return c.json({ error: 'Unauthorized' }, 401)

  const body = c.req.valid('json')

  // Normalize mode for cost estimator
  const costMode = body.mode === 'full-game' ? 'full-game' : body.mode
  const estimate = estimateCost(costMode as Parameters<typeof estimateCost>[0])

  // --- Phase 1: Return estimate if not confirmed ---
  if (!body.confirmed) {
    reqLog.info('ai generation estimate requested', { mode: body.mode, estimateTokens: estimate.totalTokens })
    return c.json({
      phase: 'estimate',
      message: `This generation will cost ${estimate.summary} (≈ $${estimate.totalUsd.toFixed(4)})`,
      estimate: {
        summary: estimate.summary,
        totalTokens: estimate.totalTokens,
        totalUsd: estimate.totalUsd,
        breakdown: estimate.breakdown,
      },
      mode: body.mode,
      prompt: body.prompt,
      confirm_hint: 'Send same request with "confirmed": true to execute',
    })
  }

  // --- Phase 2: Execute generation ---
  reqLog.info('ai generation started', { mode: body.mode, estimateTokens: estimate.totalTokens })
  incrementCounter('ai_requests_total', { mode: body.mode, status: 'started' })

  // Balance check
  const balance = await db.tokenBalance.findUnique({ where: { userId } })
  if (!balance || balance.balance < estimate.totalTokens) {
    reqLog.warn('ai generation rejected: insufficient tokens', {
      mode: body.mode,
      required: estimate.totalTokens,
      available: balance?.balance ?? 0,
    })
    incrementCounter('ai_requests_total', { mode: body.mode, status: 'insufficient_tokens' })
    return c.json({
      error: 'Insufficient tokens',
      required: estimate.totalTokens,
      available: balance?.balance ?? 0,
      estimate: estimate.summary,
    }, 402)
  }

  // Progress tracking (will be included in final response)
  const progressHistory: Array<{ percentComplete: number; currentStep?: string; completedSteps: number }> = []
  const onProgress: ProgressCallback = (progress) => {
    progressHistory.push({
      percentComplete: progress.percentComplete,
      currentStep: progress.currentStep,
      completedSteps: progress.completedSteps,
    })
  }

  let result
  try {
    switch (body.mode) {
      case 'terrain':
        result = await terrainPipeline({
          prompt: body.prompt,
          style: body.options?.style,
          size: body.options?.size,
          onProgress,
        })
        break

      case 'city':
        result = await cityPipeline({
          prompt: body.prompt,
          zones: body.options?.zones,
          buildingCount: body.options?.buildingCount ?? 3,
          onProgress,
        })
        break

      case 'assets':
        result = await assetsPipeline({
          prompt: body.prompt,
          assetTypes: body.options?.assetTypes,
          count: body.options?.assetCount ?? 3,
          onProgress,
        })
        break

      case 'full-game': {
        // Full game = terrain + city + assets in sequence
        const [terrainResult, cityResult, assetsResult] = await Promise.allSettled([
          terrainPipeline({ prompt: body.prompt, onProgress }),
          cityPipeline({ prompt: body.prompt, buildingCount: 5, onProgress }),
          assetsPipeline({ prompt: body.prompt, count: 5, onProgress }),
        ])
        result = {
          success: true,
          data: {
            terrain: terrainResult.status === 'fulfilled' ? terrainResult.value.data : null,
            city: cityResult.status === 'fulfilled' ? cityResult.value.data : null,
            assets: assetsResult.status === 'fulfilled' ? assetsResult.value.data : null,
          },
          steps: [
            ...(terrainResult.status === 'fulfilled' ? terrainResult.value.steps : []),
            ...(cityResult.status === 'fulfilled' ? cityResult.value.steps : []),
            ...(assetsResult.status === 'fulfilled' ? assetsResult.value.steps : []),
          ],
          totalCostUsd:
            (terrainResult.status === 'fulfilled' ? terrainResult.value.totalCostUsd : 0) +
            (cityResult.status === 'fulfilled' ? cityResult.value.totalCostUsd : 0) +
            (assetsResult.status === 'fulfilled' ? assetsResult.value.totalCostUsd : 0),
          totalTokens: 0,
          durationMs: Date.now() - start,
          errors: [
            ...(terrainResult.status === 'rejected' ? [String(terrainResult.reason)] : []),
            ...(cityResult.status === 'rejected' ? [String(cityResult.reason)] : []),
            ...(assetsResult.status === 'rejected' ? [String(assetsResult.reason)] : []),
          ],
          cacheHits: 0,
        }
        result.totalTokens = usdToTokens(result.totalCostUsd)
        break
      }
    }
  } catch (err) {
    const durationMs = Date.now() - start
    reqLog.error('ai generation pipeline failed', {
      mode: body.mode,
      durationMs,
      error: err instanceof Error ? err.message : String(err),
    })
    incrementCounter('ai_requests_total', { mode: body.mode, status: 'error' })
    recordDuration('ai_request_duration_ms', durationMs, { mode: body.mode, status: 'error' })
    // Best-effort failure notification
    notifyBuildFailed(userId, {
      mode: body.mode,
      prompt: body.prompt,
      error: err instanceof Error ? err.message : String(err),
    }).catch(() => {})

    // Dispatch build.failed webhook (best-effort)
    dispatchWebhookEvent(userId, 'build.failed', {
      buildId: requestId ?? randomBytes(8).toString('hex'),
      projectId: body.options ? JSON.stringify(body.options) : body.mode,
      userId,
      errorCode: 'PIPELINE_ERROR',
      errorMessage: err instanceof Error ? err.message : String(err),
      tokensUsed: 0,
    }).catch(() => {})

    return c.json({
      error: 'Generation pipeline failed',
      detail: err instanceof Error ? err.message : String(err),
    }, 502)
  }

  // Deduct actual cost (cap at estimated)
  const actualTokens = Math.min(result.totalTokens, estimate.totalTokens * 1.2)
  const tokensToCharge = Math.max(actualTokens, 1)

  try {
    await spendTokens(userId, tokensToCharge, `generate-${body.mode}: "${body.prompt.slice(0, 50)}"`)
  } catch (err) {
    // Log but don't fail the request — generation already happened
    reqLog.error('token deduction failed', {
      mode: body.mode,
      tokensToCharge,
      error: err instanceof Error ? err.message : String(err),
    })
  }

  const durationMs = Date.now() - start
  reqLog.info('ai generation completed', {
    mode: body.mode,
    durationMs,
    tokensSpent: tokensToCharge,
    cacheHits: result.cacheHits,
    stepsCount: result.steps.length,
    errors: result.errors.length,
  })
  incrementCounter('ai_requests_total', { mode: body.mode, status: result.success ? 'success' : 'partial' })
  recordDuration('ai_request_duration_ms', durationMs, { mode: body.mode, status: 'success' })
  if (result.cacheHits > 0) {
    incrementCounter('ai_cache_hits_total', { mode: body.mode }, result.cacheHits)
  }

  // Fire notification (best-effort, non-blocking)
  notifyBuildComplete(userId, {
    mode: body.mode,
    prompt: body.prompt,
    tokensSpent: tokensToCharge,
    durationMs,
  }).catch((err) => reqLog.error('build-complete notification failed', { error: String(err) }))

  // Dispatch build.completed webhook (best-effort)
  dispatchWebhookEvent(userId, 'build.completed', {
    buildId: requestId ?? randomBytes(8).toString('hex'),
    projectId: body.mode,
    userId,
    durationMs,
    tokensUsed: tokensToCharge,
  }).catch(() => {})

  // Check token balance — send low/depleted alerts and dispatch webhooks
  db.tokenBalance.findUnique({
    where: { userId },
    select: { balance: true },
  }).then(async (bal) => {
    if (!bal) return
    // Derive plan quota from subscription tier; fall back to a conservative default
    const sub = await db.subscription.findUnique({ where: { userId }, select: { tier: true } })
    const TIER_QUOTAS: Record<string, number> = { FREE: 1000, HOBBY: 2000, CREATOR: 7000, STUDIO: 20000 }
    const planQuota = TIER_QUOTAS[sub?.tier ?? 'FREE'] ?? 1000
    const percentRemaining = Math.round((bal.balance / planQuota) * 100)

    if (bal.balance === 0) {
      notifyTokenDepleted(userId).catch(() => {})
      dispatchWebhookEvent(userId, 'token.depleted', {
        userId,
        planQuota,
        depletedAt: new Date().toISOString(),
      }).catch(() => {})
    } else if (percentRemaining < 20) {
      notifyTokenLow(userId, bal.balance).catch(() => {})
      dispatchWebhookEvent(userId, 'token.low', {
        userId,
        remainingTokens: bal.balance,
        planQuota,
        percentRemaining,
      }).catch(() => {})
    }
  }).catch(() => {})

  return c.json({
    phase: 'result',
    mode: body.mode,
    success: result.success,
    data: result.data,
    steps: result.steps.map((s) => ({
      id: s.id,
      name: s.name,
      provider: s.provider,
      status: s.status,
      durationMs: s.durationMs,
      costUsd: s.costUsd,
      error: s.error,
    })),
    progressHistory,
    tokens_spent: tokensToCharge,
    total_cost_usd: result.totalCostUsd,
    cache_hits: result.cacheHits,
    errors: result.errors,
    duration_ms: durationMs,
  })
})

/**
 * GET /api/ai/generate/estimate
 * Query: ?mode=terrain&prompt=...
 */
generateRoutes.get('/estimate', async (c) => {
  const mode = c.req.query('mode') as GenerationMode | undefined
  const prompt = c.req.query('prompt') ?? ''

  if (!mode) {
    // Return all estimates
    const modes: GenerationMode[] = ['terrain', 'city', 'assets', 'full-game']
    const estimates = Object.fromEntries(
      modes.map((m) => [m, estimateCost(m === 'full-game' ? 'full-game' : m)])
    )
    return c.json({ estimates, prompt })
  }

  const estimate = estimateCost(mode === 'full-game' ? 'full-game' : mode)
  return c.json({
    mode,
    prompt,
    estimate: estimate.summary,
    breakdown: estimate.breakdown,
    totalUsd: estimate.totalUsd,
    totalTokens: estimate.totalTokens,
  })
})

/**
 * GET /api/ai/generate/health
 * Returns circuit breaker states for all AI providers
 */
generateRoutes.get('/health', async (c) => {
  const stats = getAllCircuitStats()
  const allHealthy = stats.every((s) => s.state === 'CLOSED')
  return c.json({
    healthy: allHealthy,
    providers: stats,
    checkedAt: new Date().toISOString(),
  }, allHealthy ? 200 : 503)
})
