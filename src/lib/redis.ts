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

// No-op pipeline stub — all command methods return the stub itself for chaining,
// exec() resolves to an empty array so callers can destructure results safely.
const noopPipeline: Record<string, unknown> = {}
const pipelineChainable = new Proxy(noopPipeline, {
  get: (_, prop) => {
    if (prop === 'exec') return () => Promise.resolve([])
    // Every other method (incr, expire, get, set, …) returns the stub for chaining
    return () => pipelineChainable
  },
})

// Proxy so existing `redis.get(...)` call-sites keep working unchanged.
// Returns no-op functions when Redis is not configured (no REDIS_URL).
export const redis = new Proxy({} as Redis, {
  get: (_, prop) => {
    const r = getRedis()
    if (!r) {
      // Redis not configured — return no-op for method calls, undefined for props
      if (typeof prop !== 'string') return undefined
      // pipeline/multi need a chainable stub so callers can do .incr(k).exec()
      if (prop === 'pipeline' || prop === 'multi') return () => pipelineChainable
      if (['get', 'set', 'del', 'expire', 'ttl', 'exists', 'incr', 'decr',
           'mget', 'mset', 'msetnx',
           'hget', 'hset', 'hdel', 'hgetall', 'hmget', 'hmset', 'hincrby', 'hkeys', 'hvals', 'hlen',
           'keys', 'scan', 'type', 'rename',
           'lpush', 'rpush', 'lrange', 'llen', 'lpop', 'rpop', 'lrem', 'lindex', 'lset',
           'sadd', 'srem', 'smembers', 'sismember', 'scard', 'sunion', 'sinter', 'sdiff',
           'zadd', 'zrange', 'zrangebyscore', 'zrangebylex', 'zrem', 'zscore', 'zrank', 'zrevrank',
           'zcount', 'zcard', 'zincrby', 'zrevrange', 'zrevrangebyscore',
           'publish', 'subscribe', 'unsubscribe', 'psubscribe', 'punsubscribe',
           'pexpire', 'pttl', 'persist', 'dump', 'restore', 'object',
           'bitcount', 'bitop', 'bitpos', 'getbit', 'setbit',
           'geoadd', 'geodist', 'geopos', 'georadius', 'geosearch'].includes(prop))
        return () => Promise.resolve(null)
      return undefined
    }
    const val = (r as unknown as Record<string, unknown>)[prop as string]
    return typeof val === 'function' ? val.bind(r) : val
  },
})
