import 'server-only'
import Redis from 'ioredis'
import { serverEnv } from './env'

const globalForRedis = global as unknown as { redis: Redis | null }

let _redis: Redis | null = null

export function getRedis(): Redis | null {
  if (_redis) return _redis
  const existing = globalForRedis.redis
  if (existing) {
    _redis = existing
    return _redis
  }
  const redisUrl = serverEnv.REDIS_URL
  if (!redisUrl || redisUrl.trim().length < 10) return null
  const isTls = redisUrl.startsWith('rediss://')
  const instance = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => (times > 2 ? null : Math.min(times * 200, 1000)),
    lazyConnect: true,
    ...(isTls ? { tls: { rejectUnauthorized: false } } : {}),
    enableReadyCheck: false,
    connectTimeout: 3000,
    reconnectOnError: () => false,
  })
  // Swallow connection errors — endpoints fail-open when Redis is down
  instance.on('error', () => { /* Redis unavailable — endpoints use in-memory fallback */ })
  if (serverEnv.NODE_ENV !== 'production') globalForRedis.redis = instance
  _redis = instance
  return _redis
}

// Proxy so existing `redis.get(...)` call-sites keep working unchanged.
// Returns no-op functions when Redis is not configured (no REDIS_URL).
export const redis = new Proxy({} as Redis, {
  get: (_, prop) => {
    const r = getRedis()
    if (!r) {
      // Redis not configured — return no-op for method calls, undefined for props
      return typeof prop === 'string' && ['get', 'set', 'del', 'expire', 'exists', 'incr', 'decr', 'hget', 'hset', 'keys', 'scan', 'pipeline', 'multi'].includes(prop)
        ? () => Promise.resolve(null)
        : undefined
    }
    const val = (r as unknown as Record<string, unknown>)[prop as string]
    return typeof val === 'function' ? val.bind(r) : val
  },
})
