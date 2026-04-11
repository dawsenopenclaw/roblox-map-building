/**
 * Unit tests for CircuitBreaker with a mocked Redis adapter so the state
 * machine can be exercised deterministically without a live Redis instance.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock the Redis module BEFORE importing the breaker so its imports resolve
// to the stub. We keep a per-service store in memory to simulate cross-
// function state sharing without hitting the network.
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

// env is imported transitively; stub the bits we rely on.
vi.mock('../../env', () => ({
  serverEnv: { NODE_ENV: 'test', REDIS_URL: 'redis://mock' },
}))

import { CircuitBreaker, CircuitOpenError } from '../../reliability/circuit-breaker'

describe('CircuitBreaker', () => {
  beforeEach(() => {
    store.clear()
  })

  const makeBreaker = (svc: string): CircuitBreaker =>
    new CircuitBreaker({
      service: svc,
      failureThreshold: 3,
      recoveryMs: 100,
      rollingWindowMs: 1_000,
      halfOpenSuccessThreshold: 1,
    })

  it('lets successful calls through in closed state', async () => {
    const cb = makeBreaker('test-success')
    const result = await cb.execute(async () => 42)
    expect(result).toBe(42)
    const snap = await cb.snapshot()
    expect(snap.state).toBe('closed')
    expect(snap.failures).toBe(0)
  })

  it('opens after the failure threshold is reached', async () => {
    const cb = makeBreaker('test-open')
    const boom = async (): Promise<never> => {
      throw new Error('upstream-fail')
    }
    for (let i = 0; i < 3; i += 1) {
      await expect(cb.execute(boom)).rejects.toThrow('upstream-fail')
    }
    expect((await cb.snapshot()).state).toBe('open')
  })

  it('fails fast with CircuitOpenError while open', async () => {
    const cb = makeBreaker('test-fast-fail')
    const boom = async (): Promise<never> => {
      throw new Error('bad')
    }
    for (let i = 0; i < 3; i += 1) {
      await expect(cb.execute(boom)).rejects.toThrow()
    }
    await expect(cb.execute(async () => 'wont run')).rejects.toBeInstanceOf(CircuitOpenError)
  })

  it('transitions open -> half-open -> closed on recovery', async () => {
    const cb = makeBreaker('test-recover')
    const boom = async (): Promise<never> => {
      throw new Error('bad')
    }
    for (let i = 0; i < 3; i += 1) {
      await expect(cb.execute(boom)).rejects.toThrow()
    }
    expect((await cb.snapshot()).state).toBe('open')

    await new Promise((r) => setTimeout(r, 110))

    const ok = await cb.execute(async () => 'ok')
    expect(ok).toBe('ok')
    expect((await cb.snapshot()).state).toBe('closed')
  })

  it('returns to open if the half-open probe fails', async () => {
    const cb = makeBreaker('test-probe-fail')
    const boom = async (): Promise<never> => {
      throw new Error('bad')
    }
    for (let i = 0; i < 3; i += 1) {
      await expect(cb.execute(boom)).rejects.toThrow()
    }
    await new Promise((r) => setTimeout(r, 110))

    await expect(cb.execute(boom)).rejects.toThrow('bad')
    expect((await cb.snapshot()).state).toBe('open')
  })

  it('persists state through Redis so a second breaker instance sees it', async () => {
    const cb1 = makeBreaker('shared-service')
    const boom = async (): Promise<never> => {
      throw new Error('bad')
    }
    for (let i = 0; i < 3; i += 1) {
      await expect(cb1.execute(boom)).rejects.toThrow()
    }

    const cb2 = makeBreaker('shared-service')
    await expect(cb2.execute(async () => 'blocked')).rejects.toBeInstanceOf(CircuitOpenError)
  })

  it('does not count non-failure errors when isFailure returns false', async () => {
    const cb = new CircuitBreaker({
      service: 'test-filter',
      failureThreshold: 2,
      recoveryMs: 100,
      rollingWindowMs: 1_000,
      halfOpenSuccessThreshold: 1,
      isFailure: (err) => !(err instanceof RangeError),
    })
    const ignored = async (): Promise<never> => {
      throw new RangeError('ignored')
    }
    for (let i = 0; i < 5; i += 1) {
      await expect(cb.execute(ignored)).rejects.toBeInstanceOf(RangeError)
    }
    expect((await cb.snapshot()).state).toBe('closed')
  })
})
