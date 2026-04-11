/**
 * Token-bucket rate limiter for *outbound* calls (e.g. Anthropic, FAL, Meshy).
 *
 * Unlike inbound rate limiting, the goal here is to *not* return 429 to the
 * caller — instead the caller waits (backpressure) until tokens are available.
 * This protects upstream providers from a thundering herd while still letting
 * ForjeGames absorb bursts.
 *
 * Cross-function consistency uses Redis when available; when it's not, buckets
 * fall back to an in-process Map (still correct per-instance).
 */

import 'server-only'
import { getRedis } from '../redis'

export interface BucketConfig {
  /** Bucket identifier — typically the upstream service name. */
  name: string
  /** Steady-state refill rate in tokens per second. */
  refillPerSecond: number
  /** Maximum tokens the bucket can hold (burst capacity). */
  capacity: number
  /** Hard ceiling on wait time when backpressuring. Default: 30_000 ms. */
  maxWaitMs: number
}

export interface AcquireResult {
  acquired: boolean
  waitedMs: number
  tokensRemaining: number
}

interface BucketState {
  tokens: number
  lastRefillMs: number
}

const DEFAULT_MAX_WAIT = 30_000
const KEY_PREFIX = 'rlb:v1:'

const memBuckets = new Map<string, BucketState>()

function key(name: string): string {
  return `${KEY_PREFIX}${name}`
}

function refill(state: BucketState, cfg: BucketConfig, now: number): void {
  const elapsedSec = Math.max(0, (now - state.lastRefillMs) / 1000)
  const added = elapsedSec * cfg.refillPerSecond
  state.tokens = Math.min(cfg.capacity, state.tokens + added)
  state.lastRefillMs = now
}

async function loadState(cfg: BucketConfig): Promise<BucketState> {
  const redis = getRedis()
  if (redis) {
    try {
      const raw = await redis.get(key(cfg.name))
      if (raw) {
        const parsed = JSON.parse(raw) as BucketState
        if (
          typeof parsed.tokens === 'number' &&
          typeof parsed.lastRefillMs === 'number' &&
          Number.isFinite(parsed.tokens) &&
          Number.isFinite(parsed.lastRefillMs)
        ) {
          return { tokens: parsed.tokens, lastRefillMs: parsed.lastRefillMs }
        }
      }
    } catch {
      // fall through to in-memory
    }
  }
  const existing = memBuckets.get(cfg.name)
  if (existing) return existing
  const fresh: BucketState = { tokens: cfg.capacity, lastRefillMs: Date.now() }
  memBuckets.set(cfg.name, fresh)
  return fresh
}

async function saveState(cfg: BucketConfig, state: BucketState): Promise<void> {
  memBuckets.set(cfg.name, state)
  const redis = getRedis()
  if (!redis) return
  try {
    const ttl = Math.max(60, Math.ceil((cfg.capacity / Math.max(0.1, cfg.refillPerSecond)) * 4))
    await redis.set(key(cfg.name), JSON.stringify(state), 'EX', ttl)
  } catch {
    // fail-open
  }
}

/**
 * Attempt to immediately acquire `cost` tokens.
 * Does not wait — callers that want backpressure should use `acquire`.
 */
export async function tryAcquire(cfg: BucketConfig, cost = 1): Promise<AcquireResult> {
  const state = await loadState(cfg)
  const now = Date.now()
  refill(state, cfg, now)
  if (state.tokens >= cost) {
    state.tokens -= cost
    await saveState(cfg, state)
    return { acquired: true, waitedMs: 0, tokensRemaining: state.tokens }
  }
  await saveState(cfg, state)
  return { acquired: false, waitedMs: 0, tokensRemaining: state.tokens }
}

/**
 * Acquire `cost` tokens, blocking (with a bounded wait) until they are
 * available. Throws `RateLimitBackpressureTimeout` when `maxWaitMs` elapses
 * without sufficient tokens.
 */
export async function acquire(cfg: BucketConfig, cost = 1): Promise<AcquireResult> {
  const deadline = Date.now() + (cfg.maxWaitMs ?? DEFAULT_MAX_WAIT)
  let totalWait = 0

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const state = await loadState(cfg)
    const now = Date.now()
    refill(state, cfg, now)
    if (state.tokens >= cost) {
      state.tokens -= cost
      await saveState(cfg, state)
      return { acquired: true, waitedMs: totalWait, tokensRemaining: state.tokens }
    }
    await saveState(cfg, state)

    const deficit = cost - state.tokens
    const waitMs = Math.max(10, Math.ceil((deficit / cfg.refillPerSecond) * 1000))
    const remaining = deadline - now
    if (remaining <= 0) {
      throw new RateLimitBackpressureTimeout(cfg.name, totalWait)
    }
    const sleepMs = Math.min(waitMs, remaining, 500)
    await new Promise((r) => setTimeout(r, sleepMs))
    totalWait += sleepMs
  }
}

/** Wraps an operation: acquires first, then runs `fn`. */
export async function withBurstLimit<T>(
  cfg: BucketConfig,
  fn: () => Promise<T>,
  cost = 1,
): Promise<T> {
  await acquire(cfg, cost)
  return fn()
}

export class RateLimitBackpressureTimeout extends Error {
  public readonly service: string
  public readonly waitedMs: number
  constructor(service: string, waitedMs: number) {
    super(`Backpressure timeout waiting for tokens on "${service}" after ${waitedMs}ms`)
    this.name = 'RateLimitBackpressureTimeout'
    this.service = service
    this.waitedMs = waitedMs
  }
}

// Pre-tuned profiles for known ForjeGames upstream services.
export const BUCKETS = {
  anthropic: {
    name: 'anthropic',
    refillPerSecond: 20,
    capacity: 40,
    maxWaitMs: 15_000,
  } satisfies BucketConfig,
  fal: {
    name: 'fal',
    refillPerSecond: 5,
    capacity: 15,
    maxWaitMs: 20_000,
  } satisfies BucketConfig,
  meshy: {
    name: 'meshy',
    refillPerSecond: 2,
    capacity: 8,
    maxWaitMs: 30_000,
  } satisfies BucketConfig,
  roblox: {
    name: 'roblox-open-cloud',
    refillPerSecond: 10,
    capacity: 30,
    maxWaitMs: 10_000,
  } satisfies BucketConfig,
}
