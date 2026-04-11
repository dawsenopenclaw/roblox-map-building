/**
 * Smart retry and timeout helpers.
 *
 * `withRetry`            — exponential backoff + full jitter, retry filter
 * `withTimeout`          — AbortController-based deadline
 * `withRetryAndTimeout`  — combo wrapper applied per-attempt
 *
 * All helpers return structured telemetry (`attempts`, `totalDurationMs`) so
 * callers can feed metrics without re-instrumenting every call site.
 */

import 'server-only'

export interface RetryOptions {
  /** Max attempts including the first. Default: 3. */
  maxAttempts: number
  /** Base delay in ms for exponential backoff. Default: 200. */
  baseDelayMs: number
  /** Upper bound on computed backoff before jitter. Default: 10_000. */
  maxDelayMs: number
  /** Backoff multiplier. Default: 2. */
  factor: number
  /** Predicate: return false to stop retrying on a given error. */
  retryable?: (err: unknown, attempt: number) => boolean
  /** Per-attempt timeout (ms). When omitted no timeout is applied. */
  perAttemptTimeoutMs?: number
  /** Optional callback invoked before each retry sleep. */
  onRetry?: (err: unknown, attempt: number, delayMs: number) => void
  /** Optional AbortSignal that short-circuits the entire retry loop. */
  signal?: AbortSignal
}

export interface RetryResult<T> {
  result: T
  attempts: number
  totalDurationMs: number
}

export class TimeoutError extends Error {
  public readonly timeoutMs: number
  constructor(timeoutMs: number) {
    super(`Operation timed out after ${timeoutMs}ms`)
    this.name = 'TimeoutError'
    this.timeoutMs = timeoutMs
  }
}

export class RetryAbortedError extends Error {
  constructor() {
    super('Retry loop aborted via signal')
    this.name = 'RetryAbortedError'
  }
}

const DEFAULTS: Omit<RetryOptions, 'retryable' | 'onRetry' | 'signal' | 'perAttemptTimeoutMs'> = {
  maxAttempts: 3,
  baseDelayMs: 200,
  maxDelayMs: 10_000,
  factor: 2,
}

/**
 * Default retry filter: retry on network-ish errors, 5xx, 408, 425, 429.
 * Does not retry on 4xx (except those above) or AbortError.
 */
export function defaultRetryable(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const e = err as { name?: string; status?: number; code?: string | number }
  if (e.name === 'AbortError') return false
  if (typeof e.status === 'number') {
    if (e.status >= 500) return true
    if (e.status === 408 || e.status === 425 || e.status === 429) return true
    return false
  }
  const code = typeof e.code === 'string' ? e.code : ''
  return (
    code === 'ECONNRESET' ||
    code === 'ETIMEDOUT' ||
    code === 'EAI_AGAIN' ||
    code === 'ENOTFOUND' ||
    code === 'ECONNREFUSED' ||
    code === 'EPIPE'
  )
}

/** Sleep with cancellation support. */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new RetryAbortedError())
      return
    }
    const t = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = (): void => {
      clearTimeout(t)
      reject(new RetryAbortedError())
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

/** Exponential backoff with full jitter — see AWS architecture blog. */
function computeDelay(attempt: number, opts: RetryOptions): number {
  const capped = Math.min(opts.maxDelayMs, opts.baseDelayMs * Math.pow(opts.factor, attempt - 1))
  return Math.floor(Math.random() * capped)
}

/**
 * Race a promise against an AbortController-based deadline.
 * The underlying operation receives the signal via the callback argument so
 * fetch-like APIs can cancel work when the timeout fires.
 */
export async function withTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  ms: number,
  parentSignal?: AbortSignal,
): Promise<T> {
  const controller = new AbortController()
  const onParentAbort = (): void => controller.abort(parentSignal?.reason)
  if (parentSignal) {
    if (parentSignal.aborted) controller.abort(parentSignal.reason)
    else parentSignal.addEventListener('abort', onParentAbort, { once: true })
  }
  const timer = setTimeout(() => controller.abort(new TimeoutError(ms)), ms)
  try {
    return await fn(controller.signal)
  } catch (err) {
    if (controller.signal.aborted && controller.signal.reason instanceof TimeoutError) {
      throw controller.signal.reason
    }
    throw err
  } finally {
    clearTimeout(timer)
    if (parentSignal) parentSignal.removeEventListener('abort', onParentAbort)
  }
}

/**
 * Retry `fn` with exponential backoff and jitter.
 * `fn` receives the attempt number (1-indexed) and may return any value.
 */
export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  opts: Partial<RetryOptions> = {},
): Promise<RetryResult<T>> {
  const merged: RetryOptions = { ...DEFAULTS, ...opts }
  const retryable = merged.retryable ?? defaultRetryable
  const startedAt = Date.now()
  let lastError: unknown

  for (let attempt = 1; attempt <= merged.maxAttempts; attempt += 1) {
    if (merged.signal?.aborted) throw new RetryAbortedError()
    try {
      const result = await fn(attempt)
      return { result, attempts: attempt, totalDurationMs: Date.now() - startedAt }
    } catch (err) {
      lastError = err
      const isLast = attempt === merged.maxAttempts
      if (isLast || !retryable(err, attempt)) throw err
      const delay = computeDelay(attempt, merged)
      merged.onRetry?.(err, attempt, delay)
      await sleep(delay, merged.signal)
    }
  }
  throw lastError
}

/** Convenience: retry with a per-attempt timeout. */
export async function withRetryAndTimeout<T>(
  fn: (signal: AbortSignal, attempt: number) => Promise<T>,
  opts: Partial<RetryOptions> & { perAttemptTimeoutMs: number },
): Promise<RetryResult<T>> {
  return withRetry(
    (attempt) =>
      withTimeout((signal) => fn(signal, attempt), opts.perAttemptTimeoutMs, opts.signal),
    opts,
  )
}
