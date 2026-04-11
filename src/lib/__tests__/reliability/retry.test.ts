/**
 * Unit tests for retry.ts — backoff, timeout, and combined helpers.
 */

import { describe, it, expect, vi } from 'vitest'

vi.mock('../../redis', () => ({ getRedis: () => null }))
vi.mock('../../env', () => ({ serverEnv: { NODE_ENV: 'test' } }))

import {
  withRetry,
  withTimeout,
  withRetryAndTimeout,
  TimeoutError,
  defaultRetryable,
  RetryAbortedError,
} from '../../reliability/retry'

describe('withRetry', () => {
  it('returns immediately on first success', async () => {
    let calls = 0
    const { result, attempts } = await withRetry(async () => {
      calls += 1
      return 'ok'
    })
    expect(result).toBe('ok')
    expect(calls).toBe(1)
    expect(attempts).toBe(1)
  })

  it('retries until success and reports correct attempt count', async () => {
    let calls = 0
    const { result, attempts } = await withRetry(
      async () => {
        calls += 1
        if (calls < 3) {
          const err = new Error('transient') as Error & { status: number }
          err.status = 503
          throw err
        }
        return 'done'
      },
      { baseDelayMs: 1, maxDelayMs: 5, factor: 2, maxAttempts: 5 },
    )
    expect(result).toBe('done')
    expect(attempts).toBe(3)
  })

  it('stops retrying when the predicate says not to', async () => {
    let calls = 0
    await expect(
      withRetry(
        async () => {
          calls += 1
          const err = new Error('bad') as Error & { status: number }
          err.status = 400
          throw err
        },
        { baseDelayMs: 1, maxAttempts: 5 },
      ),
    ).rejects.toThrow('bad')
    expect(calls).toBe(1)
  })

  it('throws after exhausting max attempts', async () => {
    let calls = 0
    await expect(
      withRetry(
        async () => {
          calls += 1
          const err = new Error('boom') as Error & { status: number }
          err.status = 500
          throw err
        },
        { baseDelayMs: 1, maxDelayMs: 2, maxAttempts: 3, factor: 2 },
      ),
    ).rejects.toThrow('boom')
    expect(calls).toBe(3)
  })

  it('calls onRetry between attempts', async () => {
    const onRetry = vi.fn()
    let calls = 0
    await withRetry(
      async () => {
        calls += 1
        if (calls < 2) {
          const err = new Error('once') as Error & { status: number }
          err.status = 500
          throw err
        }
        return 'ok'
      },
      { baseDelayMs: 1, maxAttempts: 3, onRetry },
    )
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('aborts when signal fires', async () => {
    const controller = new AbortController()
    controller.abort()
    await expect(
      withRetry(async () => 'never', { signal: controller.signal, maxAttempts: 3 }),
    ).rejects.toBeInstanceOf(RetryAbortedError)
  })
})

describe('withTimeout', () => {
  it('resolves when the operation completes in time', async () => {
    const result = await withTimeout(async () => 'fast', 100)
    expect(result).toBe('fast')
  })

  it('throws TimeoutError when the operation exceeds the deadline', async () => {
    await expect(
      withTimeout(
        (signal) =>
          new Promise((_, reject) => {
            signal.addEventListener('abort', () => reject(signal.reason))
          }),
        20,
      ),
    ).rejects.toBeInstanceOf(TimeoutError)
  })

  it('passes an abort signal to the underlying operation', async () => {
    let sawAbort = false
    await expect(
      withTimeout(
        (signal) =>
          new Promise((_, reject) => {
            signal.addEventListener('abort', () => {
              sawAbort = true
              reject(signal.reason)
            })
          }),
        10,
      ),
    ).rejects.toBeInstanceOf(TimeoutError)
    expect(sawAbort).toBe(true)
  })
})

describe('withRetryAndTimeout', () => {
  it('retries timeouts until one succeeds', async () => {
    let calls = 0
    const { result, attempts } = await withRetryAndTimeout(
      async (signal) => {
        calls += 1
        if (calls < 2) {
          await new Promise((resolve, reject) => {
            const t = setTimeout(resolve, 200)
            signal.addEventListener('abort', () => {
              clearTimeout(t)
              reject(signal.reason)
            })
          })
        }
        return 'done'
      },
      { perAttemptTimeoutMs: 20, baseDelayMs: 1, maxAttempts: 3, retryable: () => true },
    )
    expect(result).toBe('done')
    expect(attempts).toBe(2)
  })
})

describe('defaultRetryable', () => {
  it('retries on 5xx and known transient statuses', () => {
    expect(defaultRetryable({ status: 500 })).toBe(true)
    expect(defaultRetryable({ status: 502 })).toBe(true)
    expect(defaultRetryable({ status: 429 })).toBe(true)
    expect(defaultRetryable({ status: 408 })).toBe(true)
  })

  it('does not retry on 4xx client errors', () => {
    expect(defaultRetryable({ status: 400 })).toBe(false)
    expect(defaultRetryable({ status: 401 })).toBe(false)
    expect(defaultRetryable({ status: 404 })).toBe(false)
  })

  it('retries on known network error codes', () => {
    expect(defaultRetryable({ code: 'ECONNRESET' })).toBe(true)
    expect(defaultRetryable({ code: 'ETIMEDOUT' })).toBe(true)
    expect(defaultRetryable({ code: 'UNKNOWN' })).toBe(false)
  })

  it('does not retry abort errors', () => {
    expect(defaultRetryable({ name: 'AbortError' })).toBe(false)
  })
})
