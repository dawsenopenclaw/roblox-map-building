/**
 * Studio connection analytics helpers.
 *
 * Tracks per-hour connection counts and plugin version distribution in Redis.
 * All writes are fire-and-forget — never throws.
 */

import 'server-only'

function getRedis() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('./redis') as { getRedis?: () => import('ioredis').Redis | null }
    return mod.getRedis ? mod.getRedis() : null
  } catch {
    return null
  }
}

/** Returns the Redis key for hourly connection count at the given UTC time. */
export function hourKey(date: Date = new Date()): string {
  const y  = date.getUTCFullYear()
  const mo = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d  = String(date.getUTCDate()).padStart(2, '0')
  const h  = String(date.getUTCHours()).padStart(2, '0')
  return `fj:studio:connections:hour:${y}-${mo}-${d}-${h}`
}

/**
 * Record a new plugin connection.
 * - Increments the hourly bucket counter (24-hour TTL).
 * - Increments the version distribution counter.
 * - Increments the total-downloads counter.
 */
export function trackConnect(pluginVersion: string): void {
  const r = getRedis()
  if (!r) return

  const key = hourKey()
  const verKey = `fj:studio:versions:${pluginVersion}`

  Promise.all([
    r.incr(key).then(() => r.expire(key, 25 * 3600)),         // 25h TTL — covers DST edge
    r.incr(verKey).then(() => r.expire(verKey, 7 * 86400)),   // 7-day TTL
    r.incr('fj:studio:downloads'),
  ]).catch(() => { /* fire-and-forget */ })
}

/**
 * Record a plugin disconnect / session cleanup.
 * Decrements the version counter (clamped at 0).
 */
export function trackDisconnect(pluginVersion: string): void {
  const r = getRedis()
  if (!r) return

  const verKey = `fj:studio:versions:${pluginVersion}`
  r.decr(verKey).catch(() => { /* fire-and-forget */ })
}

/**
 * Fetch connection-by-hour data for the last 24 UTC hours.
 * Returns array from oldest → newest, each with { hour, count }.
 */
export async function getConnectionsByHour(): Promise<{ hour: string; count: number }[]> {
  const r = getRedis()
  const now = new Date()
  const hours: { hour: string; count: number }[] = []

  if (!r) {
    // Return zeros when Redis is unavailable
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 3600_000)
      hours.push({ hour: hourKey(d), count: 0 })
    }
    return hours
  }

  const keys: string[] = []
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 3600_000)
    keys.push(hourKey(d))
  }

  try {
    const values = await r.mget(...keys)
    for (let i = 0; i < keys.length; i++) {
      hours.push({
        hour:  keys[i]!.replace('fj:studio:connections:hour:', ''),
        count: parseInt(values[i] ?? '0', 10) || 0,
      })
    }
  } catch {
    for (const key of keys) {
      hours.push({ hour: key.replace('fj:studio:connections:hour:', ''), count: 0 })
    }
  }

  return hours
}

/**
 * Fetch plugin version distribution from Redis.
 * Returns a map of version → active-session count.
 */
export async function getVersionDistribution(): Promise<Record<string, number>> {
  const r = getRedis()
  if (!r) return {}

  try {
    const keys: string[] = []
    let cursor = '0'
    do {
      const [nextCursor, found] = await r.scan(cursor, 'MATCH', 'fj:studio:versions:*', 'COUNT', '50')
      cursor = nextCursor
      keys.push(...found)
    } while (cursor !== '0')

    if (keys.length === 0) return {}

    const values = await r.mget(...keys)
    const dist: Record<string, number> = {}
    for (let i = 0; i < keys.length; i++) {
      const ver = keys[i]!.replace('fj:studio:versions:', '')
      const count = parseInt(values[i] ?? '0', 10) || 0
      if (count > 0) dist[ver] = count
    }
    return dist
  } catch {
    return {}
  }
}

/**
 * Fetch command-type breakdown for a given period key pattern.
 * Keys are stored as: fj:studio:cmds:type:<type>:<YYYY-MM-DD>
 */
export async function getCommandsByType(): Promise<Record<string, number>> {
  const r = getRedis()
  if (!r) return {}

  try {
    const keys: string[] = []
    let cursor = '0'
    do {
      const [nextCursor, found] = await r.scan(cursor, 'MATCH', 'fj:studio:cmds:type:*', 'COUNT', '100')
      cursor = nextCursor
      keys.push(...found)
    } while (cursor !== '0')

    if (keys.length === 0) return {}

    const values = await r.mget(...keys)
    const byType: Record<string, number> = {}
    for (let i = 0; i < keys.length; i++) {
      // key format: fj:studio:cmds:type:<cmdType>:<date>
      const parts = keys[i]!.split(':')
      const cmdType = parts[4] ?? 'unknown'
      byType[cmdType] = (byType[cmdType] ?? 0) + (parseInt(values[i] ?? '0', 10) || 0)
    }
    return byType
  } catch {
    return {}
  }
}

/**
 * Track a command execution by type.
 * Increments both the hourly bucket and the per-type daily counter.
 */
export function trackCommand(cmdType: string): void {
  const r = getRedis()
  if (!r) return

  const now = new Date()
  const y  = now.getUTCFullYear()
  const mo = String(now.getUTCMonth() + 1).padStart(2, '0')
  const d  = String(now.getUTCDate()).padStart(2, '0')
  const h  = String(now.getUTCHours()).padStart(2, '0')

  const hourCmdKey = `fj:studio:cmds:hour:${y}-${mo}-${d}-${h}`
  const typeKey    = `fj:studio:cmds:type:${cmdType}:${y}-${mo}-${d}`
  const errorKey   = `fj:studio:cmds:errors:${y}-${mo}-${d}`
  const totalKey   = `fj:studio:cmds:total:${y}-${mo}-${d}`

  Promise.all([
    r.incr(hourCmdKey).then(() => r.expire(hourCmdKey, 25 * 3600)),
    r.incr(typeKey).then(() => r.expire(typeKey, 32 * 86400)),
    r.incr(totalKey).then(() => r.expire(totalKey, 32 * 86400)),
  ]).catch(() => { /* fire-and-forget */ })

  void errorKey // referenced below in trackCommandError
}

/**
 * Track a failed command execution.
 */
export function trackCommandError(): void {
  const r = getRedis()
  if (!r) return

  const now = new Date()
  const y  = now.getUTCFullYear()
  const mo = String(now.getUTCMonth() + 1).padStart(2, '0')
  const d  = String(now.getUTCDate()).padStart(2, '0')
  const errorKey = `fj:studio:cmds:errors:${y}-${mo}-${d}`
  const totalKey = `fj:studio:cmds:total:${y}-${mo}-${d}`

  Promise.all([
    r.incr(errorKey).then(() => r.expire(errorKey, 32 * 86400)),
    r.incr(totalKey).then(() => r.expire(totalKey, 32 * 86400)),
  ]).catch(() => { /* fire-and-forget */ })
}

/** Fetch error rate (0–1) for today. */
export async function getErrorRate(): Promise<number> {
  const r = getRedis()
  if (!r) return 0

  const now = new Date()
  const y  = now.getUTCFullYear()
  const mo = String(now.getUTCMonth() + 1).padStart(2, '0')
  const d  = String(now.getUTCDate()).padStart(2, '0')

  try {
    const [errors, total] = await r.mget(
      `fj:studio:cmds:errors:${y}-${mo}-${d}`,
      `fj:studio:cmds:total:${y}-${mo}-${d}`,
    )
    const e = parseInt(errors ?? '0', 10) || 0
    const t = parseInt(total  ?? '0', 10) || 0
    return t > 0 ? e / t : 0
  } catch {
    return 0
  }
}
