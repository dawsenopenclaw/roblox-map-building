import Redis from 'ioredis'

const globalForRedis = global as unknown as { redis: Redis }

function createRedisClient(): Redis {
  const url = process.env.REDIS_URL
  if (!url) {
    // Return a no-op Redis-shaped object so cache misses gracefully when Redis
    // is not configured (dev/test without Redis). All operations resolve to
    // null / 0 / empty so callers treat every request as a cache miss.
    console.warn('[redis] REDIS_URL not set — caching disabled, all reads will miss')
    const noop = new Proxy({} as Redis, {
      get(_target, prop) {
        if (prop === 'status') return 'ready'
        if (prop === 'on' || prop === 'once') return () => noop
        // Return a function that resolves to a safe default for any Redis command
        return (..._args: unknown[]) => Promise.resolve(null)
      },
    })
    return noop
  }

  const client = new Redis(url, {
    maxRetriesPerRequest: 3,
    // lazyConnect: true lets the server start even if Redis is temporarily down.
    // The first actual command will trigger the connection.
    lazyConnect: true,
    enableOfflineQueue: false, // fail fast when disconnected rather than queueing indefinitely
  })

  client.on('error', (err) => {
    // Log but don't crash — cache failures are non-fatal (see cache.ts try/catch)
    console.error('[redis] connection error:', err.message)
  })

  return client
}

export const redis = globalForRedis.redis || createRedisClient()

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis
