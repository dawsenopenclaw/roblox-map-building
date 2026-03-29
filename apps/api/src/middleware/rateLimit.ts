import type { Context, Next } from 'hono'
import { redis } from '../lib/redis'
import { createLogger } from '../lib/logger'
import { incrementCounter } from '../lib/metrics'

const log = createLogger('middleware:rateLimit')

export function rateLimit(limit: number, windowSec: number) {
  return async (c: Context, next: Next) => {
    const userId = (c.get('userId') as string) || c.req.header('x-forwarded-for') || 'anonymous'
    const requestId = c.get('requestId') as string | undefined
    const key = `rl:${c.req.path}:${userId}`
    const now = Date.now()
    const windowMs = windowSec * 1000
    const pipe = redis.pipeline()
    pipe.zremrangebyscore(key, 0, now - windowMs)
    pipe.zadd(key, now, `${now}-${Math.random()}`)
    pipe.zcard(key)
    pipe.expire(key, windowSec)
    const results = await pipe.exec()
    const count = results?.[2]?.[1] as number
    if (count > limit) {
      log.warn('rate limit exceeded', {
        requestId,
        userId,
        path: c.req.path,
        count,
        limit,
      })
      incrementCounter('rate_limit_hits_total', { path: c.req.path })
      return c.json({ error: 'Rate limit exceeded' }, 429)
    }
    c.header('X-RateLimit-Limit', String(limit))
    c.header('X-RateLimit-Remaining', String(Math.max(0, limit - count)))
    await next()
  }
}
