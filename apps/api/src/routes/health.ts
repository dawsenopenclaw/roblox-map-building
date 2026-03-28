import { Hono } from 'hono'
import { db } from '../lib/db'
import { redis } from '../lib/redis'

export const healthRoute = new Hono()

healthRoute.get('/', async (c) => {
  const checks = await Promise.allSettled([db.$queryRaw`SELECT 1`, redis.ping()])
  const postgres = checks[0].status === 'fulfilled' ? 'ok' : 'down'
  const redisStatus = checks[1].status === 'fulfilled' ? 'ok' : 'down'
  const healthy = postgres === 'ok' && redisStatus === 'ok'
  return c.json(
    {
      status: healthy ? 'ok' : 'degraded',
      postgres,
      redis: redisStatus,
      version: '1.0.0',
    },
    healthy ? 200 : 503
  )
})
