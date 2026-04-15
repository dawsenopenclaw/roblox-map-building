/**
 * retry-strategy.ts
 *
 * Smart retry primitives for AI calls.
 *
 * The existing `provider.ts` already has a Gemini → Groq fallback, but it
 * only retries on HARD failures (HTTP error, empty body). This module adds:
 *
 *   1. `withSmartRetry`       — exponential backoff + per-attempt model swap.
 *   2. `withParallelRace`     — race N generators, return the first success.
 *   3. `withFallbackChain`    — Sonnet → Haiku → GPT-4o → Gemini, driven by
 *                               a quality score, NOT just HTTP errors.
 *   4. Error-context injection — when retrying, previous errors are fed back
 *                               so the next model knows what to avoid.
 *   5. Model-quality tracking — rolling average quality scores per model.
 *   6. Fast retry path        — `isObviouslyBroken` skips the LLM judge.
 *   7. Template fallback      — after 2 failed retries for known game types,
 *                               falls back to pre-built templates from
 *                               `luau-templates.ts`.
 *   8. Retry metrics          — `getRetryMetrics()` for /api/health.
 *
 * A lightweight in-process `ModelFailureTracker` keeps per-model success
 * rates so `withSmartRetry` can prefer models that are currently healthy.
 * All state is in-process (fine for a single Vercel function instance);
 * swap to Redis if we ever need cross-instance aggregation.
 */

import 'server-only'
import { scoreOutput, isObviouslyBroken, type QualityMode, type QualityScore } from './quality-scorer'
import {
  tycoonGame,
  obbyGame,
  simulatorGame,
  type TycoonGameParams,
  type ObbyGameParams,
  type SimulatorGameParams,
} from './luau-templates'

// ───────────────────────────────────────────────────────────────────────────
// Model identifiers
// ───────────────────────────────────────────────────────────────────────────

export type ModelId =
  | 'claude-sonnet-4'
  | 'claude-haiku-4'
  | 'gpt-4o'
  | 'gemini-2-flash'
  | 'groq-llama-3.3-70b'

export const DEFAULT_FALLBACK_CHAIN: ModelId[] = [
  'claude-sonnet-4',
  'claude-haiku-4',
  'gpt-4o',
  'gemini-2-flash',
  'groq-llama-3.3-70b',
]

// ───────────────────────────────────────────────────────────────────────────
// ModelFailureTracker — in-process rolling success rate
// ───────────────────────────────────────────────────────────────────────────

interface ModelStats {
  attempts: number
  successes: number
  recentOutcomes: Array<0 | 1> // last 50, 1 = success
  lastErrorMessage: string | null
  lastErrorAt: number | null
  /** Rolling quality scores (last 50) for model-quality tracking. */
  recentQualityScores: number[]
}

const _modelStats = new Map<ModelId, ModelStats>()

function getStats(model: ModelId): ModelStats {
  let s = _modelStats.get(model)
  if (!s) {
    s = {
      attempts: 0,
      successes: 0,
      recentOutcomes: [],
      lastErrorMessage: null,
      lastErrorAt: null,
      recentQualityScores: [],
    }
    _modelStats.set(model, s)
  }
  return s
}

export function recordModelOutcome(model: ModelId, success: boolean, error?: Error): void {
  const s = getStats(model)
  s.attempts += 1
  if (success) s.successes += 1
  s.recentOutcomes.push(success ? 1 : 0)
  if (s.recentOutcomes.length > 50) s.recentOutcomes.shift()
  if (!success && error) {
    s.lastErrorMessage = error.message
    s.lastErrorAt = Date.now()
  }
}

export function getModelSuccessRate(model: ModelId): number {
  const s = getStats(model)
  if (s.recentOutcomes.length === 0) return 1.0
  const sum = s.recentOutcomes.reduce((a, b) => a + b, 0)
  return sum / s.recentOutcomes.length
}

export function getModelStatsSnapshot(): Record<ModelId, { rate: number; attempts: number; lastError: string | null }> {
  const out: Partial<Record<ModelId, { rate: number; attempts: number; lastError: string | null }>> = {}
  for (const [model, stats] of _modelStats) {
    out[model] = {
      rate: getModelSuccessRate(model),
      attempts: stats.attempts,
      lastError: stats.lastErrorMessage,
    }
  }
  return out as Record<ModelId, { rate: number; attempts: number; lastError: string | null }>
}

/** Record a quality score for a model (called after LLM judge scoring). */
export function recordModelQuality(model: ModelId, qualityTotal: number): void {
  const s = getStats(model)
  s.recentQualityScores.push(qualityTotal)
  if (s.recentQualityScores.length > 50) s.recentQualityScores.shift()
}

/** Get the rolling average quality score for a model (0-100). Returns -1 if no data. */
export function getModelAverageQuality(model: ModelId): number {
  const s = getStats(model)
  if (s.recentQualityScores.length === 0) return -1
  const sum = s.recentQualityScores.reduce((a, b) => a + b, 0)
  return Math.round(sum / s.recentQualityScores.length)
}

// ───────────────────────────────────────────────────────────────────────────
// Retry metrics — aggregated stats for /api/health
// ───────────────────────────────────────────────────────────────────────────

interface RetryMetrics {
  totalRetries: number
  totalAttempts: number
  successAfterRetry: number
  templateFallbacks: number
  fastRetrySkips: number
  retriesByModel: Record<string, number>
}

const _retryMetrics: RetryMetrics = {
  totalRetries: 0,
  totalAttempts: 0,
  successAfterRetry: 0,
  templateFallbacks: 0,
  fastRetrySkips: 0,
  retriesByModel: {},
}

function trackRetry(model: ModelId): void {
  _retryMetrics.totalRetries += 1
  _retryMetrics.retriesByModel[model] = (_retryMetrics.retriesByModel[model] ?? 0) + 1
}

function trackAttempt(): void {
  _retryMetrics.totalAttempts += 1
}

function trackSuccessAfterRetry(): void {
  _retryMetrics.successAfterRetry += 1
}

function trackTemplateFallback(): void {
  _retryMetrics.templateFallbacks += 1
}

function trackFastRetrySkip(): void {
  _retryMetrics.fastRetrySkips += 1
}

/** Get current retry metrics snapshot. Useful for /api/health. */
export function getRetryMetrics(): RetryMetrics & {
  successAfterRetryRate: number
  modelQuality: Record<string, number>
} {
  const rate = _retryMetrics.totalRetries > 0
    ? _retryMetrics.successAfterRetry / _retryMetrics.totalRetries
    : 0
  const modelQuality: Record<string, number> = {}
  for (const model of _modelStats.keys()) {
    modelQuality[model] = getModelAverageQuality(model)
  }
  return {
    ..._retryMetrics,
    successAfterRetryRate: Math.round(rate * 1000) / 1000,
    modelQuality,
  }
}

export function resetModelStatsForTest(): void {
  _modelStats.clear()
  _retryMetrics.totalRetries = 0
  _retryMetrics.totalAttempts = 0
  _retryMetrics.successAfterRetry = 0
  _retryMetrics.templateFallbacks = 0
  _retryMetrics.fastRetrySkips = 0
  _retryMetrics.retriesByModel = {}
}

// ───────────────────────────────────────────────────────────────────────────
// Error-context injection — build a system prompt addendum from prior errors
// ───────────────────────────────────────────────────────────────────────────

interface PriorAttemptError {
  model: ModelId
  error: string
  qualityIssues?: string[]
}

function buildErrorContext(priorErrors: PriorAttemptError[]): string {
  if (priorErrors.length === 0) return ''
  const lines = [
    '\n\n--- RETRY CONTEXT (previous attempts failed) ---',
    'The following issues were found in prior attempts. AVOID repeating these mistakes:',
  ]
  for (const pe of priorErrors) {
    lines.push(`  Model ${pe.model}: ${pe.error}`)
    if (pe.qualityIssues && pe.qualityIssues.length > 0) {
      for (const issue of pe.qualityIssues) {
        lines.push(`    - ${issue}`)
      }
    }
  }
  lines.push('--- END RETRY CONTEXT ---')
  return lines.join('\n')
}

// ───────────────────────────────────────────────────────────────────────────
// Template fallback — detect known game types and use pre-built templates
// ───────────────────────────────────────────────────────────────────────────

type KnownTemplate = 'tycoon' | 'obby' | 'simulator'

function detectTemplate(prompt: string): KnownTemplate | null {
  const lower = prompt.toLowerCase()
  // Match common phrasing for each template type
  if (/\btycoon\b/.test(lower)) return 'tycoon'
  if (/\bobby\b|\bobstacle\s*course\b|\bparkour\b/.test(lower)) return 'obby'
  if (/\bsimulator\b|\bsim\s*game\b|\bclick.*collect\b/.test(lower)) return 'simulator'
  return null
}

function getTemplateFallbackCode(template: KnownTemplate): string {
  switch (template) {
    case 'tycoon':
      return tycoonGame({
        plotSize: 60,
        dropperInterval: 2,
        baseIncome: 5,
        upgradeCosts: [100, 500, 2000, 10000],
      } satisfies TycoonGameParams)
    case 'obby':
      return obbyGame({
        checkpointCount: 10,
        difficulty: 'medium',
        includeTimer: true,
      } satisfies ObbyGameParams)
    case 'simulator':
      return simulatorGame({
        collectibleName: 'Gems',
        sellMultiplier: 2,
        rebirthCost: 1000,
        backpackSize: 50,
      } satisfies SimulatorGameParams)
  }
}

// ───────────────────────────────────────────────────────────────────────────
// Shared utilities
// ───────────────────────────────────────────────────────────────────────────

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

function backoffMs(attempt: number, base: number, cap: number): number {
  // Full-jitter exponential backoff.
  const exp = Math.min(cap, base * 2 ** attempt)
  return Math.floor(Math.random() * exp)
}

// ───────────────────────────────────────────────────────────────────────────
// withSmartRetry
// ───────────────────────────────────────────────────────────────────────────

export interface SmartRetryOptions<T> {
  /** Ordered list of models to try on successive retries. */
  models: ModelId[]
  /** Max attempts across all models (default: models.length). */
  maxAttempts?: number
  /** Base backoff in ms (default 250). */
  baseBackoffMs?: number
  /** Max backoff in ms (default 4000). */
  capBackoffMs?: number
  /** Optional validator — if this returns false the call is treated as a failure. */
  validate?: (result: T) => boolean
  /** Optional logger hook. */
  onAttempt?: (info: { attempt: number; model: ModelId; error?: Error }) => void
}

export interface SmartRetryResult<T> {
  value: T
  model: ModelId
  attempts: number
  totalMs: number
}

/**
 * Run `fn(model)` against a sequence of models with exponential backoff,
 * swapping to the next model on each failure. Throws if every attempt fails.
 */
export async function withSmartRetry<T>(
  fn: (model: ModelId) => Promise<T>,
  opts: SmartRetryOptions<T>,
): Promise<SmartRetryResult<T>> {
  const {
    models,
    maxAttempts = models.length,
    baseBackoffMs = 250,
    capBackoffMs = 4000,
    validate,
    onAttempt,
  } = opts

  if (models.length === 0) {
    throw new Error('[retry-strategy] withSmartRetry: models array is empty')
  }

  const start = Date.now()
  const errors: string[] = []

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const model = models[attempt % models.length]
    if (!model) continue
    onAttempt?.({ attempt, model })
    try {
      const value = await fn(model)
      if (validate && !validate(value)) {
        recordModelOutcome(model, false, new Error('validation failed'))
        errors.push(`${model}: validation failed`)
        if (attempt < maxAttempts - 1) await sleep(backoffMs(attempt, baseBackoffMs, capBackoffMs))
        continue
      }
      recordModelOutcome(model, true)
      return { value, model, attempts: attempt + 1, totalMs: Date.now() - start }
    } catch (e) {
      const err = e as Error
      recordModelOutcome(model, false, err)
      onAttempt?.({ attempt, model, error: err })
      errors.push(`${model}: ${err.message}`)
      if (attempt < maxAttempts - 1) await sleep(backoffMs(attempt, baseBackoffMs, capBackoffMs))
    }
  }

  throw new Error(`[retry-strategy] All ${maxAttempts} attempts failed:\n  ${errors.join('\n  ')}`)
}

// ───────────────────────────────────────────────────────────────────────────
// withParallelRace
// ───────────────────────────────────────────────────────────────────────────

export interface ParallelRaceOptions<T> {
  models: ModelId[]
  /** Optional validator — only results that pass are considered a "win". */
  validate?: (result: T) => boolean
  /** Overall timeout ms; rejects if no runner wins by then. Default 30000. */
  timeoutMs?: number
}

export interface ParallelRaceResult<T> {
  value: T
  model: ModelId
  totalMs: number
}

/**
 * Launch `fn(model)` once per model in parallel. Return as soon as the FIRST
 * runner produces a valid result. Losers are still awaited so their stats
 * get recorded, but their results are discarded.
 */
export function withParallelRace<T>(
  fn: (model: ModelId) => Promise<T>,
  opts: ParallelRaceOptions<T>,
): Promise<ParallelRaceResult<T>> {
  const { models, validate, timeoutMs = 30_000 } = opts
  if (models.length === 0) {
    return Promise.reject(new Error('[retry-strategy] withParallelRace: models array is empty'))
  }

  const start = Date.now()

  return new Promise<ParallelRaceResult<T>>((resolve, reject) => {
    let settled = false
    let remaining = models.length
    const errors: string[] = []

    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      reject(new Error(`[retry-strategy] withParallelRace: timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    for (const model of models) {
      fn(model)
        .then((value) => {
          if (settled) {
            // Still record the win for stats.
            recordModelOutcome(model, true)
            return
          }
          if (validate && !validate(value)) {
            recordModelOutcome(model, false, new Error('validation failed'))
            errors.push(`${model}: validation failed`)
            return
          }
          recordModelOutcome(model, true)
          settled = true
          clearTimeout(timer)
          resolve({ value, model, totalMs: Date.now() - start })
        })
        .catch((e: unknown) => {
          const err = e instanceof Error ? e : new Error(String(e))
          recordModelOutcome(model, false, err)
          errors.push(`${model}: ${err.message}`)
        })
        .finally(() => {
          remaining -= 1
          if (remaining === 0 && !settled) {
            settled = true
            clearTimeout(timer)
            reject(new Error(`[retry-strategy] All parallel runners failed:\n  ${errors.join('\n  ')}`))
          }
        })
    }
  })
}

// ───────────────────────────────────────────────────────────────────────────
// withFallbackChain — quality-driven
// ───────────────────────────────────────────────────────────────────────────

export interface FallbackChainOptions {
  models?: ModelId[]
  prompt: string
  mode: QualityMode
  theme?: string
  /** Minimum acceptable quality total 0-100 (default 70). */
  minQuality?: number
  /** Max attempts across the chain (default models.length). */
  maxAttempts?: number
  /**
   * If true, inject error context from previous failed attempts into
   * the system prompt so the next model can avoid the same mistakes.
   * Default: true.
   */
  injectErrorContext?: boolean
  /**
   * If true, allow falling back to pre-built templates for known game
   * types (tycoon, obby, simulator) after 2 consecutive failures.
   * Only applies when mode is 'build' or 'script'. Default: true.
   */
  allowTemplateFallback?: boolean
}

export interface FallbackChainResult {
  response: string
  model: ModelId
  quality: QualityScore
  attempts: number
  totalMs: number
  history: Array<{ model: ModelId; total: number; shouldRetry: boolean }>
  /** Set to true if the response came from a pre-built template fallback. */
  usedTemplateFallback?: boolean
  /** Error context that was injected into retry prompts, if any. */
  errorContextInjected?: string
}

/**
 * Walk a fallback chain, calling `fn(model)` for each model, scoring the
 * output with the LLM judge, and continuing until either:
 *   (a) the quality total >= minQuality, or
 *   (b) the chain is exhausted (returns the best-scoring response so far).
 *
 * Enhanced with:
 * - Fast retry: if `isObviouslyBroken`, skips LLM judge and retries immediately
 * - Error-context injection: previous errors/suggestions fed to next model
 * - Template fallback: known game types fall back to pre-built templates after 2 failures
 * - Model-quality tracking: quality scores recorded per model
 * - Retry metrics: all retry activity tracked for /api/health
 */
export async function withFallbackChain(
  fn: (model: ModelId, errorContext?: string) => Promise<string>,
  opts: FallbackChainOptions,
): Promise<FallbackChainResult> {
  const models = opts.models && opts.models.length > 0 ? opts.models : DEFAULT_FALLBACK_CHAIN
  const maxAttempts = opts.maxAttempts ?? models.length
  const minQuality = opts.minQuality ?? 70
  const injectErrorContext = opts.injectErrorContext ?? true
  const allowTemplateFallback = opts.allowTemplateFallback ?? true
  const start = Date.now()

  const history: Array<{ model: ModelId; total: number; shouldRetry: boolean }> = []
  const priorErrors: PriorAttemptError[] = []
  let best: {
    response: string
    model: ModelId
    quality: QualityScore
  } | null = null
  let lastErrorContext = ''
  let consecutiveFailures = 0

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const model = models[attempt % models.length]
    if (!model) continue

    trackAttempt()

    // Build error context from prior failures for this attempt
    const errorContext = injectErrorContext ? buildErrorContext(priorErrors) : ''
    if (errorContext) lastErrorContext = errorContext

    let response: string
    try {
      response = await fn(model, errorContext || undefined)
      recordModelOutcome(model, true)
    } catch (e) {
      const err = e as Error
      recordModelOutcome(model, false, err)
      history.push({ model, total: 0, shouldRetry: true })
      consecutiveFailures += 1
      if (attempt > 0) trackRetry(model)
      priorErrors.push({ model, error: err.message })
      continue
    }

    // Fast retry path: if obviously broken, skip the LLM judge entirely
    if (isObviouslyBroken(response)) {
      history.push({ model, total: 0, shouldRetry: true })
      consecutiveFailures += 1
      if (attempt > 0) trackRetry(model)
      trackFastRetrySkip()
      priorErrors.push({
        model,
        error: 'Output was obviously broken (empty, too short, or error string)',
      })
      continue
    }

    const quality = await scoreOutput({
      prompt: opts.prompt,
      response,
      mode: opts.mode,
      theme: opts.theme,
    })
    history.push({ model, total: quality.total, shouldRetry: quality.shouldRetry })

    // Record quality for model-quality tracking
    recordModelQuality(model, quality.total)

    if (!best || quality.total > best.quality.total) {
      best = { response, model, quality }
    }

    if (quality.total >= minQuality) {
      if (attempt > 0) trackSuccessAfterRetry()
      return {
        response,
        model,
        quality,
        attempts: attempt + 1,
        totalMs: Date.now() - start,
        history,
        errorContextInjected: lastErrorContext || undefined,
      }
    }

    // Quality was below threshold — record as a retry-worthy failure
    consecutiveFailures += 1
    if (attempt > 0) trackRetry(model)
    priorErrors.push({
      model,
      error: `Quality score ${quality.total} below threshold ${minQuality}`,
      qualityIssues: quality.suggestions,
    })

    // Template fallback: after 2 consecutive failures on a known game type
    if (
      allowTemplateFallback &&
      consecutiveFailures >= 2 &&
      (opts.mode === 'build' || opts.mode === 'script')
    ) {
      const templateType = detectTemplate(opts.prompt)
      if (templateType) {
        const templateCode = getTemplateFallbackCode(templateType)
        trackTemplateFallback()

        // Score the template so the caller gets a real quality object
        const templateQuality = await scoreOutput({
          prompt: opts.prompt,
          response: templateCode,
          mode: opts.mode,
          theme: opts.theme,
        })

        history.push({ model, total: templateQuality.total, shouldRetry: false })
        recordModelQuality(model, templateQuality.total)

        return {
          response: templateCode,
          model,
          quality: templateQuality,
          attempts: attempt + 1,
          totalMs: Date.now() - start,
          history,
          usedTemplateFallback: true,
          errorContextInjected: lastErrorContext || undefined,
        }
      }
    }
  }

  if (!best) {
    throw new Error(`[retry-strategy] withFallbackChain: every model failed.\n${history.map(h => `  ${h.model}: ${h.total}`).join('\n')}`)
  }

  // Return the best candidate even if below the quality bar — the caller
  // can decide whether to surface a warning to the user.
  return {
    response: best.response,
    model: best.model,
    quality: best.quality,
    attempts: history.length,
    totalMs: Date.now() - start,
    history,
    errorContextInjected: lastErrorContext || undefined,
  }
}
