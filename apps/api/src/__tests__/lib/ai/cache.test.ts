import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock redis before importing cache module
const mockGet = vi.fn()
const mockSet = vi.fn()
const mockDel = vi.fn()
const mockKeys = vi.fn()
const mockTtl = vi.fn()

vi.mock('../../../lib/redis', () => ({
  redis: {
    get: mockGet,
    set: mockSet,
    del: mockDel,
    keys: mockKeys,
    ttl: mockTtl,
  },
}))

import { buildCacheKey, getCached, setCached, withCache, invalidateCache, getCacheTtl } from '../../../lib/ai/cache'

describe('buildCacheKey', () => {
  it('produces a deterministic key for the same inputs', () => {
    const k1 = buildCacheKey('anthropic', 'generate', 'hello world')
    const k2 = buildCacheKey('anthropic', 'generate', 'hello world')
    expect(k1).toBe(k2)
  })

  it('includes the ai:cache: prefix', () => {
    const key = buildCacheKey('anthropic', 'generate', 'prompt')
    expect(key).toMatch(/^ai:cache:/)
  })

  it('different providers produce different keys for same input', () => {
    const k1 = buildCacheKey('anthropic', 'generate', 'test prompt')
    const k2 = buildCacheKey('deepgram', 'generate', 'test prompt')
    expect(k1).not.toBe(k2)
  })

  it('different operations produce different keys', () => {
    const k1 = buildCacheKey('anthropic', 'generate', 'same input')
    const k2 = buildCacheKey('anthropic', 'describe', 'same input')
    expect(k1).not.toBe(k2)
  })

  it('different prompts produce different keys', () => {
    const k1 = buildCacheKey('anthropic', 'generate', 'prompt A')
    const k2 = buildCacheKey('anthropic', 'generate', 'prompt B')
    expect(k1).not.toBe(k2)
  })

  it('accepts object inputs and serializes them stably', () => {
    const k1 = buildCacheKey('anthropic', 'generate', { a: 1, b: 2 })
    const k2 = buildCacheKey('anthropic', 'generate', { a: 1, b: 2 })
    expect(k1).toBe(k2)
  })
})

describe('getCached', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns hit: false when key is not in Redis', async () => {
    mockGet.mockResolvedValue(null)

    const result = await getCached('ai:cache:test:key')

    expect(result.hit).toBe(false)
    expect(result.data).toBeUndefined()
    expect(result.key).toBe('ai:cache:test:key')
  })

  it('returns hit: true and data when key exists in Redis', async () => {
    const entry = { data: { text: 'AI response' }, cachedAt: Date.now(), hits: 0 }
    mockGet.mockResolvedValue(JSON.stringify(entry))
    mockSet.mockResolvedValue('OK')

    const result = await getCached<{ text: string }>('ai:cache:test:key')

    expect(result.hit).toBe(true)
    expect(result.data).toEqual({ text: 'AI response' })
  })

  it('returns hit: false when Redis throws (cache errors are non-fatal)', async () => {
    mockGet.mockRejectedValue(new Error('Redis connection lost'))

    const result = await getCached('ai:cache:bad:key')

    expect(result.hit).toBe(false)
    expect(result.data).toBeUndefined()
  })
})

describe('setCached', () => {
  beforeEach(() => vi.clearAllMocks())

  it('stores entry in Redis with EX TTL', async () => {
    mockSet.mockResolvedValue('OK')

    await setCached('ai:cache:test', { result: 'data' }, 3600)

    expect(mockSet).toHaveBeenCalledWith(
      'ai:cache:test',
      expect.stringContaining('"data"'),
      'EX',
      3600
    )
  })

  it('uses 24-hour default TTL when none provided', async () => {
    mockSet.mockResolvedValue('OK')

    await setCached('ai:cache:test', 'value')

    const callArgs = mockSet.mock.calls[0]
    expect(callArgs[3]).toBe(24 * 60 * 60)
  })

  it('does not throw when Redis fails (cache writes are non-fatal)', async () => {
    mockSet.mockRejectedValue(new Error('Redis write error'))

    await expect(setCached('key', 'data')).resolves.toBeUndefined()
  })
})

describe('withCache', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns cached result on cache hit without calling fn', async () => {
    const cachedEntry = { data: 'cached response', cachedAt: Date.now(), hits: 2 }
    mockGet.mockResolvedValue(JSON.stringify(cachedEntry))
    mockSet.mockResolvedValue('OK')

    const fn = vi.fn().mockResolvedValue('fresh response')
    const { result, fromCache } = await withCache('ai:cache:key', fn)

    expect(result).toBe('cached response')
    expect(fromCache).toBe(true)
    expect(fn).not.toHaveBeenCalled()
  })

  it('calls fn and stores result on cache miss', async () => {
    mockGet.mockResolvedValue(null)
    mockSet.mockResolvedValue('OK')

    const fn = vi.fn().mockResolvedValue('fresh AI result')
    const { result, fromCache } = await withCache('ai:cache:miss', fn)

    expect(result).toBe('fresh AI result')
    expect(fromCache).toBe(false)
    expect(fn).toHaveBeenCalledOnce()
    expect(mockSet).toHaveBeenCalledWith(
      'ai:cache:miss',
      expect.stringContaining('fresh AI result'),
      'EX',
      expect.any(Number)
    )
  })

  it('different cache keys are isolated', async () => {
    // First key has a cached value
    const entry = { data: 'key-a data', cachedAt: Date.now(), hits: 0 }
    mockGet
      .mockResolvedValueOnce(JSON.stringify(entry))  // key-a: hit
      .mockResolvedValueOnce(null)                    // key-b: miss

    mockSet.mockResolvedValue('OK')

    const fnA = vi.fn().mockResolvedValue('key-a fresh')
    const fnB = vi.fn().mockResolvedValue('key-b fresh')

    const resA = await withCache('ai:cache:key-a', fnA)
    const resB = await withCache('ai:cache:key-b', fnB)

    expect(resA.result).toBe('key-a data')
    expect(resA.fromCache).toBe(true)
    expect(fnA).not.toHaveBeenCalled()

    expect(resB.result).toBe('key-b fresh')
    expect(resB.fromCache).toBe(false)
    expect(fnB).toHaveBeenCalledOnce()
  })
})

describe('invalidateCache', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns true when key was deleted', async () => {
    mockDel.mockResolvedValue(1)

    const result = await invalidateCache('ai:cache:test')

    expect(result).toBe(true)
    expect(mockDel).toHaveBeenCalledWith('ai:cache:test')
  })

  it('returns false when key did not exist', async () => {
    mockDel.mockResolvedValue(0)

    const result = await invalidateCache('ai:cache:nonexistent')

    expect(result).toBe(false)
  })
})

describe('getCacheTtl', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns remaining TTL in seconds', async () => {
    mockTtl.mockResolvedValue(3600)

    const ttl = await getCacheTtl('ai:cache:key')

    expect(ttl).toBe(3600)
  })

  it('returns -1 when TTL lookup fails', async () => {
    mockTtl.mockRejectedValue(new Error('Redis error'))

    const ttl = await getCacheTtl('ai:cache:key')

    expect(ttl).toBe(-1)
  })

  it('returns -2 when key does not exist (Redis convention)', async () => {
    mockTtl.mockResolvedValue(-2)

    const ttl = await getCacheTtl('ai:cache:nonexistent')

    expect(ttl).toBe(-2)
  })
})
