/**
 * POST /api/ai/generate
 * General-purpose AI generation: terrain, city, assets, full-game
 * Cost estimation → confirmation → pipeline execution
 */

import { Hono } from 'hono'
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
generateRoutes.post('/', async (c) => {
  const start = Date.now()
  const userId = c.get('userId') as string
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)

  const body = await c.req.json<GenerateBody>().catch(() => null)
  if (!body || !body.mode || !body.prompt) {
    return c.json({
      error: 'Invalid request body',
      required: { mode: 'terrain | city | assets | full-game', prompt: 'string' },
    }, 400)
  }

  const validModes: GenerationMode[] = ['terrain', 'city', 'assets', 'full-game']
  if (!validModes.includes(body.mode)) {
    return c.json({ error: `Invalid mode. Must be one of: ${validModes.join(', ')}` }, 400)
  }

  // Normalize mode for cost estimator
  const costMode = body.mode === 'full-game' ? 'full-game' : body.mode
  const estimate = estimateCost(costMode as Parameters<typeof estimateCost>[0])

  // --- Phase 1: Return estimate if not confirmed ---
  if (!body.confirmed) {
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

  // Balance check
  const balance = await db.tokenBalance.findUnique({ where: { userId } })
  if (!balance || balance.balance < estimate.totalTokens) {
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
    console.error('[generate] Token deduction failed:', err)
  }

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
    duration_ms: Date.now() - start,
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
