import Redis from 'ioredis'

const globalForRedis = global as unknown as { redis: Redis }

export const redis =
  globalForRedis.redis ||
  new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: 3,
    lazyConnect: false,
  })

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis
