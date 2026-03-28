import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock redis pipeline before importing middleware
const mockExec = vi.fn()
const mockPipeline = vi.fn(() => ({
  zremrangebyscore: vi.fn().mockReturnThis(),
  zadd: vi.fn().mockReturnThis(),
  zcard: vi.fn().mockReturnThis(),
  expire: vi.fn().mockReturnThis(),
  exec: mockExec,
}))

vi.mock('../../lib/redis', () => ({
  redis: {
    pipeline: mockPipeline,
  },
}))

import { rateLimit } from '../../middleware/rateLimit'

/**
 * Build a minimal Hono-like Context for testing the rate limiter.
 */
function buildContext({
  path = '/api/test',
  userId = undefined as string | undefined,
  forwardedFor = undefined as string | undefined,
} = {}) {
  const headers: Record<string, string> = {}
  return {
    req: {
      path,
      header: vi.fn((name: string) => {
        if (name === 'x-forwarded-for') return forwardedFor
        return undefined
      }),
    },
    get: vi.fn((key: string) => (key === 'userId' ? userId : undefined)),
    header: vi.fn((key: string, value: string) => {
      headers[key] = value
    }),
    json: vi.fn((body: unknown, status: number) => ({ body, status })),
    _headers: headers,
  }
}

describe('rateLimit middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('requests under the limit', () => {
    it('calls next() and sets rate limit headers', async () => {
      // Pipeline exec returns: [zremrangebyscore, zadd, zcard(count=3), expire]
      mockExec.mockResolvedValue([[null, 1], [null, 1], [null, 3], [null, 1]])

      const middleware = rateLimit(10, 60)
      const ctx = buildContext({ userId: 'user_1' })
      const next = vi.fn().mockResolvedValue(undefined)

      await middleware(ctx as never, next)

      expect(next).toHaveBeenCalledOnce()
      expect(ctx.json).not.toHaveBeenCalled()
      expect(ctx.header).toHaveBeenCalledWith('X-RateLimit-Limit', '10')
      expect(ctx.header).toHaveBeenCalledWith('X-RateLimit-Remaining', '7') // 10 - 3
    })

    it('X-RateLimit-Remaining is 0 when exactly at limit', async () => {
      mockExec.mockResolvedValue([[null, 1], [null, 1], [null, 10], [null, 1]])

      const middleware = rateLimit(10, 60)
      const ctx = buildContext({ userId: 'user_1' })
      const next = vi.fn()

      await middleware(ctx as never, next)

      expect(next).toHaveBeenCalled()
      expect(ctx.header).toHaveBeenCalledWith('X-RateLimit-Remaining', '0')
    })
  })

  describe('requests over the limit', () => {
    it('returns 429 and does not call next when limit exceeded', async () => {
      // count = 11, limit = 10
      mockExec.mockResolvedValue([[null, 1], [null, 1], [null, 11], [null, 1]])

      const middleware = rateLimit(10, 60)
      const ctx = buildContext({ userId: 'user_1' })
      const next = vi.fn()

      await middleware(ctx as never, next)

      expect(next).not.toHaveBeenCalled()
      expect(ctx.json).toHaveBeenCalledWith({ error: 'Rate limit exceeded' }, 429)
    })

    it('blocks when count is well over limit', async () => {
      mockExec.mockResolvedValue([[null, 1], [null, 1], [null, 999], [null, 1]])

      const middleware = rateLimit(5, 60)
      const ctx = buildContext()
      const next = vi.fn()

      await middleware(ctx as never, next)

      expect(ctx.json).toHaveBeenCalledWith({ error: 'Rate limit exceeded' }, 429)
    })
  })

  describe('key scoping', () => {
    it('uses userId when available for the Redis key', async () => {
      mockExec.mockResolvedValue([[null, 1], [null, 1], [null, 1], [null, 1]])

      const pipeline = {
        zremrangebyscore: vi.fn().mockReturnThis(),
        zadd: vi.fn().mockReturnThis(),
        zcard: vi.fn().mockReturnThis(),
        expire: vi.fn().mockReturnThis(),
        exec: mockExec,
      }
      mockPipeline.mockReturnValue(pipeline)

      const middleware = rateLimit(10, 60)
      const ctx = buildContext({ path: '/api/generate', userId: 'user_abc' })
      const next = vi.fn()

      await middleware(ctx as never, next)

      // zremrangebyscore first arg should include the userId in the key
      const firstZremCall = pipeline.zremrangebyscore.mock.calls[0]
      expect(firstZremCall[0]).toContain('user_abc')
      expect(firstZremCall[0]).toContain('/api/generate')
    })

    it('falls back to x-forwarded-for when no userId', async () => {
      mockExec.mockResolvedValue([[null, 1], [null, 1], [null, 1], [null, 1]])

      const pipeline = {
        zremrangebyscore: vi.fn().mockReturnThis(),
        zadd: vi.fn().mockReturnThis(),
        zcard: vi.fn().mockReturnThis(),
        expire: vi.fn().mockReturnThis(),
        exec: mockExec,
      }
      mockPipeline.mockReturnValue(pipeline)

      const middleware = rateLimit(10, 60)
      const ctx = buildContext({ path: '/api/test', forwardedFor: '1.2.3.4' })
      const next = vi.fn()

      await middleware(ctx as never, next)

      const firstZremCall = pipeline.zremrangebyscore.mock.calls[0]
      expect(firstZremCall[0]).toContain('1.2.3.4')
    })

    it('falls back to "anonymous" when no userId or IP', async () => {
      mockExec.mockResolvedValue([[null, 1], [null, 1], [null, 1], [null, 1]])

      const pipeline = {
        zremrangebyscore: vi.fn().mockReturnThis(),
        zadd: vi.fn().mockReturnThis(),
        zcard: vi.fn().mockReturnThis(),
        expire: vi.fn().mockReturnThis(),
        exec: mockExec,
      }
      mockPipeline.mockReturnValue(pipeline)

      const middleware = rateLimit(10, 60)
      const ctx = buildContext()
      const next = vi.fn()

      await middleware(ctx as never, next)

      const firstZremCall = pipeline.zremrangebyscore.mock.calls[0]
      expect(firstZremCall[0]).toContain('anonymous')
    })
  })

  describe('window expiry simulation', () => {
    it('allows requests after window resets (count back to 0)', async () => {
      // Simulate post-reset: zcard returns 1 (just the new request added in this window)
      mockExec.mockResolvedValue([[null, 3], [null, 1], [null, 1], [null, 1]])

      const middleware = rateLimit(5, 60)
      const ctx = buildContext({ userId: 'user_reset' })
      const next = vi.fn()

      await middleware(ctx as never, next)

      expect(next).toHaveBeenCalledOnce()
    })

    it('sets expire on the sliding window key each request', async () => {
      mockExec.mockResolvedValue([[null, 1], [null, 1], [null, 1], [null, 1]])

      const pipeline = {
        zremrangebyscore: vi.fn().mockReturnThis(),
        zadd: vi.fn().mockReturnThis(),
        zcard: vi.fn().mockReturnThis(),
        expire: vi.fn().mockReturnThis(),
        exec: mockExec,
      }
      mockPipeline.mockReturnValue(pipeline)

      const middleware = rateLimit(10, 120)
      const ctx = buildContext()
      const next = vi.fn()

      await middleware(ctx as never, next)

      // expire should be called with the windowSec value (120)
      expect(pipeline.expire).toHaveBeenCalledWith(expect.any(String), 120)
    })
  })
})
