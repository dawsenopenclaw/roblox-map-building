// server-only removed — breaks prerender
import Redis from 'ioredis'
import { serverEnv } from './env'

const globalForRedis = global as unknown as { redis: Redis | null }

let _redis: Redis | null = null

export function getRedis(): Redis {
  if (_redis) return _redis
  const existing = globalForRedis.redis
  if (existing) {
    _redis = existing
    return _redis
  }
  const redisUrl = serverEnv.REDIS_URL
  if (!redisUrl) throw new Error('REDIS_URL is not configured')
  const instance = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  })
  if (serverEnv.NODE_ENV !== 'production') globalForRedis.redis = instance
  _redis = instance
  return _redis
}

// Proxy so existing `redis.get(...)` call-sites keep working unchanged
export const redis = new Proxy({} as Redis, {
  get: (_, prop) => {
    const r = getRedis()
    const val = (r as unknown as Record<string, unknown>)[prop as string]
    return typeof val === 'function' ? val.bind(r) : val
  },
})
