/**
 * Unit tests for the token-bucket outbound rate limiter.
 * Uses a mocked Redis so bucket state can be shared across "function invocations".
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

const store = new Map<string, string>()

vi.mock('../../redis', () => ({
  getRedis: () => ({
    get: async (key: string) => store.get(key) ?? null,
    set: async (key: string, value: string) => {
      store.set(key, value)
      return 'OK'
    },
    del: async (key: string) => (store.delete(key) ? 1 : 0),
  }),
}))

vi.mock('../../env', () => ({
  serverEnv: { NODE_ENV: 'test', REDIS_URL: 'redis://mock' },
}))

import {
  tryAcquire,
  acquire,
  withBurstLimit,
  RateLimitBackpressureTimeout,
  type BucketConfig,
} from '../../reliability/rate-limit-burst'

describe('tryAcquire', () => {
  beforeEach(() => {
    store.clear()
  })

  it('acquires tokens up to capacity then refuses', async () => {
    const cfg: BucketConfig = {
      name: 'burst-immediate',
      refillPerSecond: 0.0001,
      capacity: 3,
      maxWaitMs: 5_000,
    }
    expect((await tryAcquire(cfg)).acquired).toBe(true)
    expect((await tryAcquire(cfg)).acquired).toBe(true)
    expect((await tryAcquire(cfg)).acquired).toBe(true)
    const fourth = await tryAcquire(cfg)
    expect(fourth.acquired).toBe(false)
  })

  it('supports fractional cost and reports remaining tokens', async () => {
    const cfg: BucketConfig = {
      name: 'burst-cost',
      refillPerSecond: 0.0001,
      capacity: 10,
      maxWaitMs: 5_000,
    }
    const first = await tryAcquire(cfg, 4)
    expect(first.acquired).toBe(true)
    expect(first.tokensRemaining).toBeCloseTo(6, 1)
  })
})

describe('acquire (backpressure)', () => {
  beforeEach(() => {
    store.clear()
  })

  it('waits until tokens refill when bucket is empty', async () => {
    const cfg: BucketConfig = {
      name: 'burst-wait',
      refillPerSecond: 50,
      capacity: 1,
      maxWaitMs: 2_000,
    }
    await acquire(cfg)
    const started = Date.now()
    const result = await acquire(cfg)
    const elapsed = Date.now() - started
    expect(result.acquired).toBe(true)
    expect(elapsed).toBeGreaterThanOrEqual(10)
  }, 5_000)

  it('throws RateLimitBackpressureTimeout when wait exceeds maxWaitMs', async () => {
    const cfg: BucketConfig = {
      name: 'burst-timeout',
      refillPerSecond: 0.01,
      capacity: 1,
      maxWaitMs: 50,
    }
    await acquire(cfg)
    await expect(acquire(cfg)).rejects.toBeInstanceOf(RateLimitBackpressureTimeout)
  })
})

describe('withBurstLimit', () => {
  beforeEach(() => {
    store.clear()
  })

  it('runs the wrapped function after acquiring tokens', async () => {
    const cfg: BucketConfig = {
      name: 'burst-wrap',
      refillPerSecond: 100,
      capacity: 5,
      maxWaitMs: 1_000,
    }
    const spy = vi.fn(async () => 'result')
    const out = await withBurstLimit(cfg, spy, 1)
    expect(out).toBe('result')
    expect(spy).toHaveBeenCalledOnce()
  })

  it('does not run wrapped fn if backpressure times out', async () => {
    const cfg: BucketConfig = {
      name: 'burst-wrap-timeout',
      refillPerSecond: 0.01,
      capacity: 1,
      maxWaitMs: 30,
    }
    await acquire(cfg)
    const spy = vi.fn(async () => 'should-not-run')
    await expect(withBurstLimit(cfg, spy, 1)).rejects.toBeInstanceOf(
      RateLimitBackpressureTimeout,
    )
    expect(spy).not.toHaveBeenCalled()
  })
})
