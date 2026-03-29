/**
 * AI result caching via Redis
 * Hash prompt → stable key → 24hr TTL
 */

import { createHash } from 'crypto'
import { redis } from '../redis'

const CACHE_TTL_SECONDS = 24 * 60 * 60 // 24 hours
const CACHE_PREFIX = 'ai:cache:'

export interface CacheEntry<T = unknown> {
  data: T
  cachedAt: number
  hits: number
}

export interface CacheResult<T = unknown> {
  hit: boolean
  data?: T
  key: string
}

/**
 * Generate a stable cache key from a prompt and optional parameters
 */
export function buildCacheKey(
  provider: string,
  operation: string,
  input: string | Record<string, unknown>
): string {
  const raw = typeof input === 'string' ? input : JSON.stringify(input)
  const hash = createHash('sha256')
    .update(`${provider}:${operation}:${raw}`)
    .digest('hex')
    .slice(0, 40)
  return `${CACHE_PREFIX}${provider}:${operation}:${hash}`
}

/**
 * Get a cached result
 */
export async function getCached<T>(key: string): Promise<CacheResult<T>> {
  try {
    const raw = await redis.get(key)
    if (!raw) {
      return { hit: false, key }
    }

    const entry = JSON.parse(raw) as CacheEntry<T>
    // Increment hit counter (fire-and-forget)
    const updated: CacheEntry<T> = { ...entry, hits: entry.hits + 1 }
    redis.set(key, JSON.stringify(updated), 'KEEPTTL').catch(() => {})

    console.info(`[ai:cache] HIT key=${key} hits=${updated.hits}`)
    return { hit: true, data: entry.data, key }
  } catch (err) {
    console.warn(`[ai:cache] GET error key=${key}:`, err)
    return { hit: false, key }
  }
}

/**
 * Store a result in cache
 */
export async function setCached<T>(
  key: string,
  data: T,
  ttlSeconds = CACHE_TTL_SECONDS
): Promise<void> {
  try {
    const entry: CacheEntry<T> = {
      data,
      cachedAt: Date.now(),
      hits: 0,
    }
    await redis.set(key, JSON.stringify(entry), 'EX', ttlSeconds)
    console.info(`[ai:cache] SET key=${key} ttl=${ttlSeconds}s`)
  } catch (err) {
    console.warn(`[ai:cache] SET error key=${key}:`, err)
    // Cache failures are non-fatal — continue without cache
  }
}

/**
 * Invalidate a specific cache key
 */
export async function invalidateCache(key: string): Promise<boolean> {
  try {
    const deleted = await redis.del(key)
    console.info(`[ai:cache] INVALIDATE key=${key} deleted=${deleted}`)
    return deleted > 0
  } catch (err) {
    console.warn(`[ai:cache] INVALIDATE error key=${key}:`, err)
    return false
  }
}

/**
 * Invalidate all cache entries for a provider
 */
export async function invalidateProviderCache(provider: string): Promise<number> {
  try {
    const pattern = `${CACHE_PREFIX}${provider}:*`
    const keys = await redis.keys(pattern)
    if (keys.length === 0) return 0
    // Pass keys as an array — spread of large arrays can exceed call stack limits
    const deleted = await redis.del(keys as [string, ...string[]])
    console.info(`[ai:cache] INVALIDATE_PROVIDER provider=${provider} deleted=${deleted}`)
    return deleted
  } catch (err) {
    console.warn(`[ai:cache] INVALIDATE_PROVIDER error provider=${provider}:`, err)
    return 0
  }
}

/**
 * Wrap a function with caching
 * If cache hit → return cached. Otherwise execute fn, cache result, return.
 */
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds = CACHE_TTL_SECONDS
): Promise<{ result: T; fromCache: boolean }> {
  const cached = await getCached<T>(key)
  if (cached.hit && cached.data !== undefined) {
    return { result: cached.data, fromCache: true }
  }

  const result = await fn()
  await setCached(key, result, ttlSeconds)
  return { result, fromCache: false }
}

/**
 * Get TTL remaining for a cache key (in seconds)
 */
export async function getCacheTtl(key: string): Promise<number> {
  try {
    return await redis.ttl(key)
  } catch {
    return -1
  }
}
