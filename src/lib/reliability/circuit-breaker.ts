/**
 * Generic circuit breaker for outbound API calls.
 *
 * States:
 *   - closed:    requests flow normally, failures are tracked
 *   - open:      requests fail fast with CircuitOpenError until recoveryMs elapses
 *   - half-open: a single trial request is allowed; success -> closed, failure -> open
 *
 * State is persisted in Redis so that multiple Vercel serverless functions
 * share the same breaker. When Redis is unavailable the breaker falls back
 * to an in-memory state (per-instance).
 */

import 'server-only'
import {
  loadBreakerStateFromRedis,
  saveBreakerStateToRedis,
  type BreakerRedisState,
} from './circuit-breaker-redis'

export type CircuitState = 'closed' | 'open' | 'half-open'

export interface CircuitBreakerConfig {
  /** Unique service identifier (e.g. "anthropic", "fal", "meshy"). */
  service: string
  /** Failures in rolling window before tripping. Default: 5. */
  failureThreshold: number
  /** Time (ms) the breaker stays open before transitioning to half-open. Default: 30_000. */
  recoveryMs: number
  /** Rolling window size for failure counting (ms). Default: 60_000. */
  rollingWindowMs: number
  /** Successful half-open trials required to close the breaker. Default: 1. */
  halfOpenSuccessThreshold: number
  /** Optional predicate: return false to not count an error as a failure. */
  isFailure?: (err: unknown) => boolean
}

export interface BreakerSnapshot {
  state: CircuitState
  failures: number
  lastFailureAt: number
  openedAt: number
  halfOpenSuccesses: number
  updatedAt: number
}

export class CircuitOpenError extends Error {
  public readonly service: string
  public readonly retryAfterMs: number
  constructor(service: string, retryAfterMs: number) {
    super(`Circuit breaker open for service "${service}"; retry in ${retryAfterMs}ms`)
    this.name = 'CircuitOpenError'
    this.service = service
    this.retryAfterMs = retryAfterMs
  }
}

const DEFAULT_CONFIG: Omit<CircuitBreakerConfig, 'service'> = {
  failureThreshold: 5,
  recoveryMs: 30_000,
  rollingWindowMs: 60_000,
  halfOpenSuccessThreshold: 1,
}

/**
 * A single breaker instance for one logical service.
 * Reuse across calls — do not create a breaker per request.
 */
export class CircuitBreaker {
  public readonly config: CircuitBreakerConfig
  private mem: BreakerSnapshot

  constructor(config: Partial<CircuitBreakerConfig> & Pick<CircuitBreakerConfig, 'service'>) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    }
    this.mem = freshSnapshot()
  }

  /** Executes `fn` through the breaker, applying state transitions. */
  public async execute<T>(fn: () => Promise<T>): Promise<T> {
    const snap = await this.load()
    const now = Date.now()

    if (snap.state === 'open') {
      const retryAfter = Math.max(0, this.config.recoveryMs - (now - snap.openedAt))
      if (retryAfter > 0) {
        throw new CircuitOpenError(this.config.service, retryAfter)
      }
      snap.state = 'half-open'
      snap.halfOpenSuccesses = 0
      await this.save(snap)
    }

    try {
      const result = await fn()
      await this.onSuccess(snap)
      return result
    } catch (err) {
      const countAsFailure = this.config.isFailure ? this.config.isFailure(err) : true
      if (countAsFailure) {
        await this.onFailure(snap)
      }
      throw err
    }
  }

  public async snapshot(): Promise<BreakerSnapshot> {
    return { ...(await this.load()) }
  }

  public async reset(): Promise<void> {
    this.mem = freshSnapshot()
    await this.save(this.mem)
  }

  private async onSuccess(prev: BreakerSnapshot): Promise<void> {
    if (prev.state === 'half-open') {
      prev.halfOpenSuccesses += 1
      if (prev.halfOpenSuccesses >= this.config.halfOpenSuccessThreshold) {
        Object.assign(prev, freshSnapshot())
      }
      await this.save(prev)
      return
    }
    // closed: reset failures if the window elapsed
    if (prev.failures > 0 && Date.now() - prev.lastFailureAt > this.config.rollingWindowMs) {
      prev.failures = 0
      await this.save(prev)
    }
  }

  private async onFailure(prev: BreakerSnapshot): Promise<void> {
    const now = Date.now()
    if (now - prev.lastFailureAt > this.config.rollingWindowMs) {
      prev.failures = 0
    }
    prev.failures += 1
    prev.lastFailureAt = now

    if (prev.state === 'half-open' || prev.failures >= this.config.failureThreshold) {
      prev.state = 'open'
      prev.openedAt = now
      prev.halfOpenSuccesses = 0
    }
    await this.save(prev)
  }

  private async load(): Promise<BreakerSnapshot> {
    const remote = await loadBreakerStateFromRedis(this.config.service)
    if (remote) {
      this.mem = fromRedis(remote)
    }
    return this.mem
  }

  private async save(snap: BreakerSnapshot): Promise<void> {
    snap.updatedAt = Date.now()
    this.mem = { ...snap }
    await saveBreakerStateToRedis(this.config.service, toRedis(snap), this.config.recoveryMs)
  }
}

function freshSnapshot(): BreakerSnapshot {
  return {
    state: 'closed',
    failures: 0,
    lastFailureAt: 0,
    openedAt: 0,
    halfOpenSuccesses: 0,
    updatedAt: Date.now(),
  }
}

function toRedis(snap: BreakerSnapshot): BreakerRedisState {
  return {
    s: snap.state,
    f: snap.failures,
    lf: snap.lastFailureAt,
    oa: snap.openedAt,
    hs: snap.halfOpenSuccesses,
    u: snap.updatedAt,
  }
}

function fromRedis(r: BreakerRedisState): BreakerSnapshot {
  return {
    state: r.s,
    failures: r.f,
    lastFailureAt: r.lf,
    openedAt: r.oa,
    halfOpenSuccesses: r.hs,
    updatedAt: r.u,
  }
}

// ---------- registry of long-lived breakers for known services ----------

const registry = new Map<string, CircuitBreaker>()

export function getBreaker(
  config: Partial<CircuitBreakerConfig> & Pick<CircuitBreakerConfig, 'service'>,
): CircuitBreaker {
  const existing = registry.get(config.service)
  if (existing) return existing
  const created = new CircuitBreaker(config)
  registry.set(config.service, created)
  return created
}

export const breakers = {
  anthropic: (): CircuitBreaker =>
    getBreaker({ service: 'anthropic', failureThreshold: 6, recoveryMs: 20_000 }),
  fal: (): CircuitBreaker =>
    getBreaker({ service: 'fal', failureThreshold: 5, recoveryMs: 30_000 }),
  meshy: (): CircuitBreaker =>
    getBreaker({ service: 'meshy', failureThreshold: 4, recoveryMs: 45_000 }),
  roblox: (): CircuitBreaker =>
    getBreaker({ service: 'roblox-open-cloud', failureThreshold: 5, recoveryMs: 30_000 }),
  stripe: (): CircuitBreaker =>
    getBreaker({ service: 'stripe', failureThreshold: 4, recoveryMs: 20_000 }),
}
