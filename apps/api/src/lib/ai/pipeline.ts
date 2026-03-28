/**
 * Multi-model AI pipeline orchestrator
 * Parallel execution with Promise.allSettled, progress tracking, cost totaling
 */

import { buildCacheKey, withCache } from './cache'
import { anthropicBreaker, meshyBreaker, falBreaker, withFallback } from './circuit-breaker'
import { claudeChat, claudeVision, type ChatOptions } from './providers/anthropic'
import { generateImages, generateTextures, type FalModel } from './providers/fal'
import { textTo3DComplete, imageTo3DComplete } from './providers/meshy'
import { aggregateCosts, estimateCost, type GenerationType, type TotalCostEstimate } from './cost-estimator'
import { validate3DModel, validateImageResult, validateAIResponse, withQualityGate } from './quality-gate'

export type PipelineStepStatus = 'pending' | 'running' | 'done' | 'failed' | 'skipped' | 'cached'

export interface PipelineStep {
  id: string
  name: string
  provider: string
  status: PipelineStepStatus
  startedAt?: number
  completedAt?: number
  durationMs?: number
  costUsd?: number
  error?: string
}

export interface PipelineProgress {
  totalSteps: number
  completedSteps: number
  failedSteps: number
  cachedSteps: number
  percentComplete: number
  currentStep?: string
  steps: PipelineStep[]
}

export interface PipelineResult<T = unknown> {
  success: boolean
  data?: T
  steps: PipelineStep[]
  totalCostUsd: number
  totalTokens: number
  durationMs: number
  errors: string[]
  cacheHits: number
}

export type ProgressCallback = (progress: PipelineProgress) => void

/**
 * Terrain generation pipeline
 * Claude → terrain layout plan → Fal texture generation in parallel
 */
export async function terrainPipeline(params: {
  prompt: string
  style?: string
  size?: { width: number; height: number }
  onProgress?: ProgressCallback
}): Promise<PipelineResult<{
  layout: unknown
  terrainPlan: string
  textures?: { albedo: string; normal: string; roughness: string }
}>> {
  const start = Date.now()
  const steps: PipelineStep[] = []
  const errors: string[] = []
  let cacheHits = 0
  let totalCostUsd = 0

  const { prompt, style = 'realistic', onProgress } = params

  const updateProgress = (stepId: string, status: PipelineStepStatus) => {
    const step = steps.find((s) => s.id === stepId)
    if (step) {
      step.status = status
      if (status === 'running') step.startedAt = Date.now()
      if (status === 'done' || status === 'failed' || status === 'cached') {
        step.completedAt = Date.now()
        step.durationMs = step.startedAt ? step.completedAt - step.startedAt : 0
      }
    }
    const completed = steps.filter((s) => ['done', 'failed', 'cached'].includes(s.status)).length
    onProgress?.({
      totalSteps: steps.length,
      completedSteps: completed,
      failedSteps: steps.filter((s) => s.status === 'failed').length,
      cachedSteps: steps.filter((s) => s.status === 'cached').length,
      percentComplete: Math.round((completed / steps.length) * 100),
      currentStep: stepId,
      steps: [...steps],
    })
  }

  // Step 1: Claude terrain plan
  const planStep: PipelineStep = { id: 'terrain-plan', name: 'Generate terrain plan', provider: 'claude', status: 'pending' }
  steps.push(planStep)

  const systemPrompt = `You are a Roblox terrain designer. Generate terrain layouts as JSON with:
- zones: array of {name, type, x, z, width, height, elevation, biome}
- features: array of {type, x, z, properties}
- metadata: {totalSize, style, theme}
Style: ${style}. Respond ONLY with valid JSON.`

  updateProgress('terrain-plan', 'running')

  const cacheKey = buildCacheKey('claude', 'terrain-plan', { prompt, style })
  let terrainPlan = ''
  let planCost = 0

  try {
    const { result: planResult, fromCache } = await withCache(cacheKey, () =>
      anthropicBreaker.execute(() =>
        claudeChat([{ role: 'user', content: `Design terrain for: ${prompt}` }], {
          systemPrompt,
          maxTokens: 2000,
        })
      )
    )
    if (fromCache) {
      cacheHits++
      planStep.status = 'cached'
    }
    terrainPlan = planResult.content
    planCost = planResult.costUsd
    totalCostUsd += planCost
    planStep.costUsd = planCost
    updateProgress('terrain-plan', fromCache ? 'cached' : 'done')
  } catch (err) {
    errors.push(`Terrain plan failed: ${err instanceof Error ? err.message : String(err)}`)
    updateProgress('terrain-plan', 'failed')
    planStep.error = errors[errors.length - 1]
  }

  // Step 2: Fal texture generation (parallel — doesn't depend on terrain plan content)
  const textureStep: PipelineStep = { id: 'terrain-texture', name: 'Generate terrain texture', provider: 'fal', status: 'pending' }
  steps.push(textureStep)
  updateProgress('terrain-texture', 'running')

  let textures: { albedo: string; normal: string; roughness: string } | undefined

  const textureCacheKey = buildCacheKey('fal', 'texture-pbr', { prompt, style })
  try {
    const { result: textureResult, fromCache: textureCached } = await withCache(textureCacheKey, () =>
      falBreaker.execute(() =>
        generateTextures({ prompt: `${style} terrain texture: ${prompt}`, resolution: 1024 })
      )
    )
    if (textureCached) {
      cacheHits++
      textureStep.status = 'cached'
    }
    textures = {
      albedo: textureResult.albedo,
      normal: textureResult.normal,
      roughness: textureResult.roughness,
    }
    totalCostUsd += textureResult.costUsd
    textureStep.costUsd = textureResult.costUsd
    updateProgress('terrain-texture', textureCached ? 'cached' : 'done')
  } catch (err) {
    errors.push(`Texture generation failed: ${err instanceof Error ? err.message : String(err)}`)
    updateProgress('terrain-texture', 'failed')
    textureStep.error = errors[errors.length - 1]
    // Fallback: continue without texture
  }

  // Parse layout from Claude response
  let layout: unknown = null
  try {
    layout = JSON.parse(terrainPlan)
  } catch {
    const match = terrainPlan.match(/```(?:json)?\s*([\s\S]+?)```/)
    if (match) {
      try { layout = JSON.parse(match[1]) } catch { layout = { raw: terrainPlan } }
    } else {
      layout = { raw: terrainPlan }
    }
  }

  return {
    success: errors.length < steps.length, // partial success ok
    data: { layout, terrainPlan, textures },
    steps,
    totalCostUsd,
    totalTokens: Math.ceil(totalCostUsd * 10_000),
    durationMs: Date.now() - start,
    errors,
    cacheHits,
  }
}

/**
 * City generation pipeline
 * Claude city plan → Meshy buildings + Fal textures in parallel
 */
export async function cityPipeline(params: {
  prompt: string
  zones?: string[]
  buildingCount?: number
  onProgress?: ProgressCallback
}): Promise<PipelineResult<{
  cityPlan: unknown
  buildings: Array<{ jobId: string; modelUrls?: Record<string, string | undefined> }>
  textures: string[]
}>> {
  const start = Date.now()
  const steps: PipelineStep[] = []
  const errors: string[] = []
  let cacheHits = 0
  let totalCostUsd = 0

  const { prompt, buildingCount = 3, onProgress } = params

  const updateProgress = (stepId: string, status: PipelineStepStatus) => {
    const step = steps.find((s) => s.id === stepId)
    if (step) {
      step.status = status
      if (status === 'running') step.startedAt = Date.now()
      if (['done', 'failed', 'cached', 'skipped'].includes(status)) {
        step.completedAt = Date.now()
        step.durationMs = step.startedAt ? step.completedAt - step.startedAt : 0
      }
    }
    const completed = steps.filter((s) => ['done', 'failed', 'cached', 'skipped'].includes(s.status)).length
    onProgress?.({
      totalSteps: steps.length,
      completedSteps: completed,
      failedSteps: steps.filter((s) => s.status === 'failed').length,
      cachedSteps: steps.filter((s) => s.status === 'cached').length,
      percentComplete: steps.length > 0 ? Math.round((completed / steps.length) * 100) : 0,
      currentStep: stepId,
      steps: [...steps],
    })
  }

  // Step 1: Claude city plan
  const planStep: PipelineStep = { id: 'city-plan', name: 'Generate city plan', provider: 'claude', status: 'pending' }
  steps.push(planStep)
  updateProgress('city-plan', 'running')

  const cacheKey = buildCacheKey('claude', 'city-plan', { prompt, buildingCount })
  let cityPlan: unknown = null

  try {
    const { result, fromCache } = await withCache(cacheKey, () =>
      anthropicBreaker.execute(() =>
        claudeChat(
          [{ role: 'user', content: `Design a city layout for a Roblox game: ${prompt}` }],
          {
            systemPrompt: `You are a Roblox city designer. Generate a JSON layout with:
- zones: [{name, type, x, z, width, height}]
- roads: [{from, to, width}]
- landmarks: [{name, type, x, z, description}]
- buildings: [{name, type, floors, style, x, z}]
Respond ONLY with valid JSON.`,
            maxTokens: 3000,
          }
        )
      )
    )
    if (fromCache) { cacheHits++; planStep.status = 'cached' }
    try { cityPlan = JSON.parse(result.content) } catch { cityPlan = { raw: result.content } }
    totalCostUsd += result.costUsd
    planStep.costUsd = result.costUsd
    updateProgress('city-plan', fromCache ? 'cached' : 'done')
  } catch (err) {
    errors.push(`City plan failed: ${err instanceof Error ? err.message : String(err)}`)
    updateProgress('city-plan', 'failed')
    planStep.error = errors[errors.length - 1]
  }

  // Step 2: Parallel — Meshy buildings + Fal textures
  const buildingPromises: Promise<{ jobId: string; modelUrls?: Record<string, string | undefined> }>[] = []
  for (let i = 0; i < buildingCount; i++) {
    const buildStep: PipelineStep = {
      id: `building-${i}`,
      name: `Generate building ${i + 1}`,
      provider: 'meshy',
      status: 'pending',
    }
    steps.push(buildStep)
    updateProgress(`building-${i}`, 'running')

    buildingPromises.push(
      withFallback(
        () =>
          meshyBreaker.execute(() =>
            textTo3DComplete({
              prompt: `${prompt} building ${i + 1}, Roblox style, low poly`,
              artStyle: 'realistic',
              targetPolycount: 20000,
            })
          ).then((r) => ({ jobId: r.jobId, modelUrls: r.modelUrls as Record<string, string | undefined> | undefined })),
        () => ({ jobId: `template-building-${i}`, modelUrls: undefined })
      ).then(({ result, usedFallback }) => {
        totalCostUsd += usedFallback ? 0 : 0.2
        updateProgress(`building-${i}`, 'done')
        return result
      }).catch((err) => {
        errors.push(`Building ${i + 1} failed: ${err instanceof Error ? err.message : String(err)}`)
        updateProgress(`building-${i}`, 'failed')
        return { jobId: `failed-building-${i}`, modelUrls: undefined }
      })
    )
  }

  const textureStep: PipelineStep = { id: 'city-textures', name: 'Generate city textures', provider: 'fal', status: 'pending' }
  steps.push(textureStep)
  updateProgress('city-textures', 'running')

  const texturePromise = falBreaker
    .execute(() =>
      generateImages({
        prompt: `Roblox city texture, ${prompt}, top-down view, architectural`,
        numImages: 2,
        model: 'flux-pro',
      })
    )
    .then((r) => {
      totalCostUsd += r.costUsd
      textureStep.costUsd = r.costUsd
      updateProgress('city-textures', 'done')
      return r.images.map((img) => img.url)
    })
    .catch((err) => {
      errors.push(`City textures failed: ${err instanceof Error ? err.message : String(err)}`)
      updateProgress('city-textures', 'failed')
      return [] as string[]
    })

  // Await all in parallel
  const [buildings, textures] = await Promise.all([
    Promise.all(buildingPromises),
    texturePromise,
  ])

  return {
    success: errors.length < steps.length,
    data: { cityPlan, buildings, textures },
    steps,
    totalCostUsd,
    totalTokens: Math.ceil(totalCostUsd * 10_000),
    durationMs: Date.now() - start,
    errors,
    cacheHits,
  }
}

/**
 * Asset generation pipeline
 * Claude asset list → parallel Meshy models
 */
export async function assetsPipeline(params: {
  prompt: string
  assetTypes?: string[]
  count?: number
  onProgress?: ProgressCallback
}): Promise<PipelineResult<Array<{ name: string; jobId: string; modelUrls?: Record<string, string | undefined> }>>> {
  const start = Date.now()
  const { prompt, count = 3, onProgress } = params
  const steps: PipelineStep[] = []
  const errors: string[] = []
  let cacheHits = 0
  let totalCostUsd = 0

  const updateStep = (id: string, status: PipelineStepStatus, cost?: number) => {
    let step = steps.find((s) => s.id === id)
    if (!step) {
      step = { id, name: id, provider: 'meshy', status: 'pending' }
      steps.push(step)
    }
    step.status = status
    if (cost) step.costUsd = cost
    const completed = steps.filter((s) => ['done', 'failed', 'cached', 'skipped'].includes(s.status)).length
    onProgress?.({
      totalSteps: steps.length,
      completedSteps: completed,
      failedSteps: steps.filter((s) => s.status === 'failed').length,
      cachedSteps: steps.filter((s) => s.status === 'cached').length,
      percentComplete: steps.length > 0 ? Math.round((completed / steps.length) * 100) : 0,
      currentStep: id,
      steps: [...steps],
    })
  }

  const assetNames = params.assetTypes ?? Array.from({ length: count }, (_, i) => `asset-${i + 1}`)

  const assetResults = await Promise.allSettled(
    assetNames.map(async (assetName) => {
      updateStep(assetName, 'running')
      const result = await meshyBreaker.execute(() =>
        textTo3DComplete({
          prompt: `${assetName} for ${prompt}, Roblox game asset, low poly, ${assetName}`,
          artStyle: 'realistic',
          targetPolycount: 15000,
        })
      )
      totalCostUsd += 0.2
      updateStep(assetName, 'done', 0.2)
      return { name: assetName, jobId: result.jobId, modelUrls: result.modelUrls as Record<string, string | undefined> | undefined }
    })
  )

  const assets: Array<{ name: string; jobId: string; modelUrls?: Record<string, string | undefined> }> = []
  assetResults.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      assets.push(r.value)
    } else {
      errors.push(`Asset ${assetNames[i]} failed: ${r.reason}`)
      updateStep(assetNames[i], 'failed')
      assets.push({ name: assetNames[i], jobId: `failed-${i}`, modelUrls: undefined })
    }
  })

  return {
    success: assets.some((a) => !a.jobId.startsWith('failed')),
    data: assets,
    steps,
    totalCostUsd,
    totalTokens: Math.ceil(totalCostUsd * 10_000),
    durationMs: Date.now() - start,
    errors,
    cacheHits,
  }
}

/**
 * Get cost estimate for a pipeline type
 */
export function estimatePipelineCost(type: GenerationType): TotalCostEstimate {
  return estimateCost(type)
}
