import type { Context, Next } from 'hono'
import { redis } from '../lib/redis'

export function rateLimit(limit: number, windowSec: number) {
  return async (c: Context, next: Next) => {
    const userId = (c.get('userId') as string) || c.req.header('x-forwarded-for') || 'anonymous'
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
      return c.json({ error: 'Rate limit exceeded' }, 429)
    }
    c.header('X-RateLimit-Limit', String(limit))
    c.header('X-RateLimit-Remaining', String(Math.max(0, limit - count)))
    await next()
  }
}
