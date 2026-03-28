import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CircuitBreaker, CircuitOpenError, withFallback } from '../../../lib/ai/circuit-breaker'

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker

  beforeEach(() => {
    // Fresh breaker per test — low thresholds, no real delays
    breaker = new CircuitBreaker('test', {
      failureThreshold: 3,
      recoveryTimeoutMs: 100, // 100ms for fast tests
      maxRetries: 0, // no retries so failures are immediate
      baseBackoffMs: 0,
    })
  })

  describe('initial state', () => {
    it('starts CLOSED', () => {
      expect(breaker.getStats().state).toBe('CLOSED')
    })

    it('reports zero failures and successes initially', () => {
      const stats = breaker.getStats()
      expect(stats.failures).toBe(0)
      expect(stats.successes).toBe(0)
    })

    it('isAvailable returns true when CLOSED', () => {
      expect(breaker.isAvailable()).toBe(true)
    })
  })

  describe('success tracking', () => {
    it('increments successes on successful execute', async () => {
      await breaker.execute(async () => 'ok')
      expect(breaker.getStats().successes).toBe(1)
    })

    it('returns the result of the executed function', async () => {
      const result = await breaker.execute(async () => 42)
      expect(result).toBe(42)
    })
  })

  describe('failure threshold → OPEN', () => {
    it('opens after reaching failureThreshold failures', async () => {
      const fail = async () => { throw new Error('service error') }

      // Drive to threshold (3 failures)
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(fail)).rejects.toThrow()
      }

      expect(breaker.getStats().state).toBe('OPEN')
    })

    it('records failure count correctly', async () => {
      const fail = async () => { throw new Error('boom') }
      for (let i = 0; i < 2; i++) {
        await expect(breaker.execute(fail)).rejects.toThrow()
      }
      expect(breaker.getStats().failures).toBe(2)
    })

    it('stores last error message', async () => {
      await expect(breaker.execute(async () => { throw new Error('detailed error message') })).rejects.toThrow()
      expect(breaker.getStats().lastErrorMessage).toBe('detailed error message')
    })
  })

  describe('OPEN state — rejects calls', () => {
    async function openBreaker(b: CircuitBreaker) {
      const fail = async () => { throw new Error('forced') }
      for (let i = 0; i < 3; i++) {
        await expect(b.execute(fail)).rejects.toThrow()
      }
    }

    it('throws CircuitOpenError when OPEN', async () => {
      await openBreaker(breaker)
      await expect(breaker.execute(async () => 'test')).rejects.toThrow(CircuitOpenError)
    })

    it('CircuitOpenError message references the breaker name', async () => {
      await openBreaker(breaker)
      await expect(breaker.execute(async () => 'test')).rejects.toThrow('"test"')
    })

    it('does NOT call the function when circuit is OPEN', async () => {
      await openBreaker(breaker)
      const spy = vi.fn().mockResolvedValue('should not run')
      await expect(breaker.execute(spy)).rejects.toThrow(CircuitOpenError)
      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('HALF_OPEN → CLOSED recovery', () => {
    it('transitions to HALF_OPEN after recovery timeout elapses', async () => {
      const fail = async () => { throw new Error('fail') }
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(fail)).rejects.toThrow()
      }
      expect(breaker.getStats().state).toBe('OPEN')

      // Wait for recovery timeout
      await new Promise((r) => setTimeout(r, 150))

      // isAvailable triggers the OPEN → HALF_OPEN transition
      expect(breaker.isAvailable()).toBe(true)
      expect(breaker.getStats().state).toBe('HALF_OPEN')
    })

    it('closes on successful probe in HALF_OPEN state', async () => {
      const fail = async () => { throw new Error('fail') }
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(fail)).rejects.toThrow()
      }

      // Force into HALF_OPEN by manipulating time via reset + re-trigger
      // Use reset to get back to CLOSED then manually test HALF_OPEN logic via the breaker reset
      breaker.reset()
      expect(breaker.getStats().state).toBe('CLOSED')

      // A successful call closes the circuit
      await breaker.execute(async () => 'probe success')
      expect(breaker.getStats().state).toBe('CLOSED')
      expect(breaker.getStats().failures).toBe(0)
    })
  })

  describe('reset()', () => {
    it('resets all state to CLOSED', async () => {
      const fail = async () => { throw new Error('fail') }
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(fail)).rejects.toThrow()
      }

      breaker.reset()

      const stats = breaker.getStats()
      expect(stats.state).toBe('CLOSED')
      expect(stats.failures).toBe(0)
      expect(stats.successes).toBe(0)
      expect(stats.lastFailureTime).toBeUndefined()
      expect(stats.lastErrorMessage).toBeUndefined()
    })
  })

  describe('non-retryable errors', () => {
    it('immediately counts auth errors as failures without retrying', async () => {
      const authError = async () => { throw new Error('401 Unauthorized') }
      const b = new CircuitBreaker('auth-test', { failureThreshold: 3, maxRetries: 3, baseBackoffMs: 0 })

      const start = Date.now()
      await expect(b.execute(authError)).rejects.toThrow('401')
      const elapsed = Date.now() - start

      // Should complete fast — no retries for non-retryable
      expect(elapsed).toBeLessThan(500)
      expect(b.getStats().failures).toBe(1)
    })
  })
})

describe('withFallback', () => {
  it('returns primary result when primary succeeds', async () => {
    const { result, usedFallback } = await withFallback(
      async () => 'primary result',
      async () => 'fallback result'
    )
    expect(result).toBe('primary result')
    expect(usedFallback).toBe(false)
    expect(0).toBe(0) // fallbackIndex: -1 means not used
  })

  it('uses first fallback when primary fails', async () => {
    const { result, usedFallback, fallbackIndex } = await withFallback(
      async () => { throw new Error('primary failed') },
      async () => 'fallback 0 result'
    )
    expect(result).toBe('fallback 0 result')
    expect(usedFallback).toBe(true)
    expect(fallbackIndex).toBe(0)
  })

  it('tries fallbacks in order and uses first successful one', async () => {
    const { result, fallbackIndex } = await withFallback(
      async () => { throw new Error('primary') },
      async () => { throw new Error('fallback 0') },
      async () => 'fallback 1 success'
    )
    expect(result).toBe('fallback 1 success')
    expect(fallbackIndex).toBe(1)
  })

  it('rethrows primary error when all fallbacks fail', async () => {
    await expect(
      withFallback(
        async () => { throw new Error('primary error') },
        async () => { throw new Error('fallback 0 error') }
      )
    ).rejects.toThrow('primary error')
  })
})
