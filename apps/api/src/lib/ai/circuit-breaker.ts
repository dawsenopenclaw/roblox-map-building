/**
 * Circuit breaker pattern for AI providers
 * States: CLOSED (normal) → OPEN (failing) → HALF_OPEN (testing recovery)
 * Retries: 3x with exponential backoff (1s, 2s, 4s)
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

export interface CircuitBreakerOptions {
  /** Number of failures before opening the circuit */
  failureThreshold?: number
  /** Milliseconds to wait in OPEN state before moving to HALF_OPEN */
  recoveryTimeoutMs?: number
  /** Number of retries with exponential backoff before counting as failure */
  maxRetries?: number
  /** Base delay in ms for exponential backoff (1s, 2s, 4s) */
  baseBackoffMs?: number
}

export interface CircuitBreakerStats {
  name: string
  state: CircuitState
  failures: number
  successes: number
  lastFailureTime?: number
  lastErrorMessage?: string
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED'
  private failures = 0
  private successes = 0
  private lastFailureTime?: number
  private lastErrorMessage?: string

  private readonly failureThreshold: number
  private readonly recoveryTimeoutMs: number
  private readonly maxRetries: number
  private readonly baseBackoffMs: number

  constructor(
    public readonly name: string,
    options: CircuitBreakerOptions = {}
  ) {
    this.failureThreshold = options.failureThreshold ?? 5
    this.recoveryTimeoutMs = options.recoveryTimeoutMs ?? 60_000 // 1 minute
    this.maxRetries = options.maxRetries ?? 3
    this.baseBackoffMs = options.baseBackoffMs ?? 1000
  }

  getStats(): CircuitBreakerStats {
    return {
      name: this.name,
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      lastErrorMessage: this.lastErrorMessage,
    }
  }

  isAvailable(): boolean {
    if (this.state === 'CLOSED') return true
    if (this.state === 'OPEN') {
      const elapsed = Date.now() - (this.lastFailureTime ?? 0)
      if (elapsed >= this.recoveryTimeoutMs) {
        this.state = 'HALF_OPEN'
        return true
      }
      return false
    }
    // HALF_OPEN: allow one test request
    return true
  }

  private onSuccess(): void {
    this.successes++
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED'
      this.failures = 0
    }
  }

  private onFailure(error: Error): void {
    this.failures++
    this.lastFailureTime = Date.now()
    this.lastErrorMessage = error.message
    if (this.failures >= this.failureThreshold || this.state === 'HALF_OPEN') {
      this.state = 'OPEN'
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Execute a function through the circuit breaker with retry logic
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.isAvailable()) {
      throw new CircuitOpenError(
        `Circuit breaker "${this.name}" is OPEN — provider unavailable`,
        this.lastErrorMessage
      )
    }

    let lastError: Error = new Error('Unknown error')

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) {
        // Exponential backoff: 1s, 2s, 4s
        const backoffMs = this.baseBackoffMs * Math.pow(2, attempt - 1)
        await this.delay(backoffMs)
      }

      try {
        const result = await fn()
        this.onSuccess()
        return result
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))

        // Don't retry on non-retryable errors (auth, validation)
        if (isNonRetryable(lastError)) {
          this.onFailure(lastError)
          throw lastError
        }
      }
    }

    this.onFailure(lastError)
    throw lastError
  }

  /**
   * Reset the circuit breaker to CLOSED state
   */
  reset(): void {
    this.state = 'CLOSED'
    this.failures = 0
    this.successes = 0
    this.lastFailureTime = undefined
    this.lastErrorMessage = undefined
  }
}

export class CircuitOpenError extends Error {
  constructor(
    message: string,
    public readonly lastError?: string
  ) {
    super(message)
    this.name = 'CircuitOpenError'
  }
}

/**
 * Determine if an error should NOT be retried
 */
function isNonRetryable(error: Error): boolean {
  const msg = error.message.toLowerCase()
  return (
    msg.includes('401') ||
    msg.includes('403') ||
    msg.includes('invalid api key') ||
    msg.includes('not configured') ||
    msg.includes('validation') ||
    msg.includes('400')
  )
}

/**
 * Execute with a fallback chain
 * Tries each function in order; returns first success
 * Fallback values can be static (template, placeholder) or computed
 */
export async function withFallback<T>(
  primary: () => Promise<T>,
  ...fallbacks: Array<() => Promise<T> | T>
): Promise<{ result: T; usedFallback: boolean; fallbackIndex: number }> {
  try {
    const result = await primary()
    return { result, usedFallback: false, fallbackIndex: -1 }
  } catch (primaryErr) {
    for (let i = 0; i < fallbacks.length; i++) {
      try {
        const result = await Promise.resolve(fallbacks[i]())
        return { result, usedFallback: true, fallbackIndex: i }
      } catch {
        // try next fallback
      }
    }
    throw primaryErr
  }
}

// Singleton circuit breakers per provider
const breakers = new Map<string, CircuitBreaker>()

export function getCircuitBreaker(name: string, options?: CircuitBreakerOptions): CircuitBreaker {
  if (!breakers.has(name)) {
    breakers.set(name, new CircuitBreaker(name, options))
  }
  return breakers.get(name)!
}

export function getAllCircuitStats(): CircuitBreakerStats[] {
  return Array.from(breakers.values()).map((b) => b.getStats())
}

// Pre-configured breakers for known providers
export const anthropicBreaker = getCircuitBreaker('anthropic', {
  failureThreshold: 5,
  recoveryTimeoutMs: 60_000,
  maxRetries: 3,
  baseBackoffMs: 1000,
})

export const deepgramBreaker = getCircuitBreaker('deepgram', {
  failureThreshold: 3,
  recoveryTimeoutMs: 30_000,
  maxRetries: 3,
  baseBackoffMs: 1000,
})

export const meshyBreaker = getCircuitBreaker('meshy', {
  failureThreshold: 3,
  recoveryTimeoutMs: 120_000, // 2 min — async jobs take time
  maxRetries: 2,
  baseBackoffMs: 2000,
})

export const falBreaker = getCircuitBreaker('fal', {
  failureThreshold: 3,
  recoveryTimeoutMs: 60_000,
  maxRetries: 3,
  baseBackoffMs: 1000,
})
