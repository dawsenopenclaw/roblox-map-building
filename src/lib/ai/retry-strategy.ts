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
 *
 * A lightweight in-process `ModelFailureTracker` keeps per-model success
 * rates so `withSmartRetry` can prefer models that are currently healthy.
 * All state is in-process (fine for a single Vercel function instance);
 * swap to Redis if we ever need cross-instance aggregation.
 */

import 'server-only'
import { scoreOutput, isObviouslyBroken, type QualityMode, type QualityScore } from './quality-scorer'

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

export function resetModelStatsForTest(): void {
  _modelStats.clear()
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
}

export interface FallbackChainResult {
  response: string
  model: ModelId
  quality: QualityScore
  attempts: number
  totalMs: number
  history: Array<{ model: ModelId; total: number; shouldRetry: boolean }>
}

/**
 * Walk a fallback chain, calling `fn(model)` for each model, scoring the
 * output with the LLM judge, and continuing until either:
 *   (a) the quality total >= minQuality, or
 *   (b) the chain is exhausted (returns the best-scoring response so far).
 *
 * This is the "quality > availability" strategy — even if Sonnet succeeds
 * we'll switch to Haiku if Sonnet's output scores below the threshold.
 */
export async function withFallbackChain(
  fn: (model: ModelId) => Promise<string>,
  opts: FallbackChainOptions,
): Promise<FallbackChainResult> {
  const models = opts.models && opts.models.length > 0 ? opts.models : DEFAULT_FALLBACK_CHAIN
  const maxAttempts = opts.maxAttempts ?? models.length
  const minQuality = opts.minQuality ?? 70
  const start = Date.now()

  const history: Array<{ model: ModelId; total: number; shouldRetry: boolean }> = []
  let best: {
    response: string
    model: ModelId
    quality: QualityScore
  } | null = null

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const model = models[attempt % models.length]
    if (!model) continue
    let response: string
    try {
      response = await fn(model)
      recordModelOutcome(model, true)
    } catch (e) {
      recordModelOutcome(model, false, e as Error)
      history.push({ model, total: 0, shouldRetry: true })
      continue
    }

    if (isObviouslyBroken(response)) {
      history.push({ model, total: 0, shouldRetry: true })
      continue
    }

    const quality = await scoreOutput({
      prompt: opts.prompt,
      response,
      mode: opts.mode,
      theme: opts.theme,
    })
    history.push({ model, total: quality.total, shouldRetry: quality.shouldRetry })

    if (!best || quality.total > best.quality.total) {
      best = { response, model, quality }
    }

    if (quality.total >= minQuality) {
      return {
        response,
        model,
        quality,
        attempts: attempt + 1,
        totalMs: Date.now() - start,
        history,
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
  }
}
