import Redis from 'ioredis'
import { serverEnv } from './env'

const globalForRedis = global as unknown as { redis: Redis }

export const redis =
  globalForRedis.redis ||
  new Redis(serverEnv.REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: false,
  })

if (serverEnv.NODE_ENV !== 'production') globalForRedis.redis = redis
