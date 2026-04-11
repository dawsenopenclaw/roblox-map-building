/**
 * Reusable caching patterns, all backed by Redis with an in-process L1
 * fallback and single-flight stampede protection.
 *
 *   - cacheAside(key, ttl, fn)    read-through: fetch on miss, write on success
 *   - cacheRefresh(key, ttl, fn)  refresh-ahead: serve cached while refreshing
 *                                 in the background before expiry
 *   - cacheBatch(keys, fn)        pipelined batch fetch: loads all hits from
 *                                 Redis in one mget, calls `fn` for misses
 *
 * Stampede protection: concurrent callers for the same key wait on the same
 * in-flight promise rather than all hammering the origin.
 */

import 'server-only'
import { getRedis } from '../redis'
import { metrics } from '../observability/metrics'

export interface CacheEntry<T> {
  value: T
  expiresAt: number
  refreshAt?: number
}

const KEY_PREFIX = 'cache:v1:'
const L1_MAX = 2_000

const l1 = new Map<string, CacheEntry<unknown>>()
const inflight = new Map<string, Promise<unknown>>()

function fullKey(key: string): string {
  return `${KEY_PREFIX}${key}`
}

function l1Set<T>(key: string, entry: CacheEntry<T>): void {
  if (l1.size >= L1_MAX) {
    const firstKey = l1.keys().next().value
    if (firstKey !== undefined) l1.delete(firstKey)
  }
  l1.set(key, entry)
}

function l1Get<T>(key: string): CacheEntry<T> | undefined {
  const e = l1.get(key) as CacheEntry<T> | undefined
  if (!e) return undefined
  if (e.expiresAt < Date.now()) {
    l1.delete(key)
    return undefined
  }
  return e
}

async function redisGet<T>(key: string): Promise<CacheEntry<T> | null> {
  const redis = getRedis()
  if (!redis) return null
  try {
    const raw = await redis.get(fullKey(key))
    if (!raw) return null
    const parsed = JSON.parse(raw) as CacheEntry<T>
    if (parsed.expiresAt < Date.now()) return null
    return parsed
  } catch {
    return null
  }
}

async function redisSet<T>(key: string, entry: CacheEntry<T>): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  try {
    const ttlSec = Math.max(1, Math.ceil((entry.expiresAt - Date.now()) / 1000))
    await redis.set(fullKey(key), JSON.stringify(entry), 'EX', ttlSec)
  } catch {
    // fail-open
  }
}

async function redisMget<T>(
  keys: readonly string[],
): Promise<Array<CacheEntry<T> | null>> {
  const redis = getRedis()
  if (!redis || keys.length === 0) return keys.map(() => null)
  try {
    const raws = await redis.mget(...keys.map(fullKey))
    const now = Date.now()
    return raws.map((raw) => {
      if (!raw) return null
      try {
        const parsed = JSON.parse(raw) as CacheEntry<T>
        if (parsed.expiresAt < now) return null
        return parsed
      } catch {
        return null
      }
    })
  } catch {
    return keys.map(() => null)
  }
}

async function singleFlight<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key) as Promise<T> | undefined
  if (existing) return existing
  const promise = (async () => {
    try {
      return await fn()
    } finally {
      inflight.delete(key)
    }
  })()
  inflight.set(key, promise)
  return promise
}

/**
 * Read-through cache: returns cached value when present, otherwise calls
 * `fn`, writes the result, and returns it.
 */
export async function cacheAside<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
  scope = 'default',
): Promise<T> {
  const l1Hit = l1Get<T>(key)
  if (l1Hit) {
    metrics.cacheHit(scope, true)
    return l1Hit.value
  }
  const remote = await redisGet<T>(key)
  if (remote) {
    l1Set(key, remote)
    metrics.cacheHit(scope, true)
    return remote.value
  }
  metrics.cacheHit(scope, false)
  return singleFlight(key, async () => {
    const value = await fn()
    const entry: CacheEntry<T> = { value, expiresAt: Date.now() + ttlMs }
    l1Set(key, entry)
    await redisSet(key, entry)
    return value
  })
}

/**
 * Refresh-ahead: serves the cached value while kicking off a background
 * refresh once we cross `refreshAt` (75% of ttl by default). Eliminates
 * user-visible latency on expiry.
 */
export async function cacheRefresh<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
  scope = 'default',
): Promise<T> {
  const now = Date.now()
  const refreshFraction = 0.75
  const refreshWindow = ttlMs * refreshFraction

  const load = async (): Promise<T> => {
    const value = await fn()
    const entry: CacheEntry<T> = {
      value,
      expiresAt: Date.now() + ttlMs,
      refreshAt: Date.now() + refreshWindow,
    }
    l1Set(key, entry)
    await redisSet(key, entry)
    return value
  }

  const l1Hit = l1Get<T>(key)
  if (l1Hit) {
    metrics.cacheHit(scope, true)
    if (l1Hit.refreshAt && l1Hit.refreshAt < now) {
      void singleFlight(key, load).catch(() => undefined)
    }
    return l1Hit.value
  }

  const remote = await redisGet<T>(key)
  if (remote) {
    l1Set(key, remote)
    metrics.cacheHit(scope, true)
    if (remote.refreshAt && remote.refreshAt < now) {
      void singleFlight(key, load).catch(() => undefined)
    }
    return remote.value
  }

  metrics.cacheHit(scope, false)
  return singleFlight(key, load)
}

/**
 * Batch fetch: looks up all keys in Redis via pipelined mget, then calls
 * `fn` with only the keys that missed. Results are merged and written back.
 */
export async function cacheBatch<T>(
  keys: readonly string[],
  ttlMs: number,
  fn: (missedKeys: readonly string[]) => Promise<Record<string, T>>,
  scope = 'default',
): Promise<Record<string, T>> {
  const out: Record<string, T> = {}
  const missed: string[] = []

  for (const k of keys) {
    const hit = l1Get<T>(k)
    if (hit) {
      out[k] = hit.value
      metrics.cacheHit(scope, true)
    } else {
      missed.push(k)
    }
  }

  if (missed.length > 0) {
    const remote = await redisMget<T>(missed)
    const stillMissed: string[] = []
    remote.forEach((entry, i) => {
      const k = missed[i]!
      if (entry) {
        out[k] = entry.value
        l1Set(k, entry)
        metrics.cacheHit(scope, true)
      } else {
        stillMissed.push(k)
        metrics.cacheHit(scope, false)
      }
    })

    if (stillMissed.length > 0) {
      const loaded = await fn(stillMissed)
      const expiresAt = Date.now() + ttlMs
      await Promise.all(
        Object.entries(loaded).map(async ([k, v]) => {
          const entry: CacheEntry<T> = { value: v, expiresAt }
          l1Set(k, entry)
          await redisSet(k, entry)
          out[k] = v
        }),
      )
    }
  }

  return out
}

/** Invalidate a single key from both L1 and Redis. */
export async function cacheInvalidate(key: string): Promise<void> {
  l1.delete(key)
  const redis = getRedis()
  if (!redis) return
  try {
    await redis.del(fullKey(key))
  } catch {
    // ignore
  }
}
