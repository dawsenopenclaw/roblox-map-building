/**
 * Studio session management.
 *
 * Architecture: write-through dual store.
 *   - Primary:   in-memory Map  (zero-latency reads/writes)
 *   - Secondary: Redis          (survives server restarts, shared across instances)
 *
 * Read path:  memory first → Redis fallback (hydrate memory on miss)
 * Write path: memory + Redis in parallel (fire-and-forget Redis, never blocks)
 * TTL:        60 s in memory, 120 s in Redis (double so we can recover from a
 *             brief pod restart without the user seeing a disconnect)
 */

import 'server-only'

export type ChangeType =
  | 'insert_model'
  | 'delete_model'
  | 'update_property'
  | 'execute_luau'
  | 'insert_asset'

export interface PendingCommand {
  id:        string
  type:      ChangeType
  data:      Record<string, unknown>
  timestamp: number
}

export interface StudioSession {
  sessionId:       string
  /** Roblox place ID reported by the plugin */
  placeId:         string
  /** Human-readable place name reported by the plugin */
  placeName:       string
  /** Unix ms of the most recent heartbeat */
  lastHeartbeat:   number
  /** Whether the session is considered live (heartbeat within SESSION_TTL_MS) */
  connected:       boolean
  /** Semver string sent by the plugin at connect time */
  pluginVersion:   string
  /** Auth bearer token — validated once at connect, stored for lookup */
  authToken:       string
  /** Latest state snapshot pushed by the plugin */
  latestState:     Record<string, unknown> | null
  /** Latest viewport screenshot (base64 PNG) */
  latestScreenshot: string | null
  /** Pending commands waiting for the plugin to drain */
  commandQueue:    PendingCommand[]
  /** Unix ms of the last poll — enforces rate limit */
  lastPollAt:      number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const SESSION_TTL_MS      = 60_000   // 60 s — in-memory / connected threshold
export const REDIS_TTL_SECS      = 120      // Redis key TTL
export const COMMAND_QUEUE_MAX   = 50
export const MIN_POLL_INTERVAL_MS = 1_000

// ---------------------------------------------------------------------------
// In-memory store (primary)
// ---------------------------------------------------------------------------

const sessions = new Map<string, StudioSession>()

// ---------------------------------------------------------------------------
// Redis helpers (secondary — all errors are silently swallowed)
// ---------------------------------------------------------------------------

function getRedis() {
  try {
    // Dynamic require keeps this from crashing at build time
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { redis } = require('./redis') as { redis: import('ioredis').Redis }
    return redis
  } catch {
    return null
  }
}

const REDIS_PREFIX = 'fj:studio:session:'

function redisKey(id: string): string {
  return `${REDIS_PREFIX}${id}`
}

/** Serialize a session for Redis. Screenshots are excluded — too large. */
function serialize(session: StudioSession): string {
  const { latestScreenshot: _, ...rest } = session
  return JSON.stringify(rest)
}

function deserialize(raw: string): StudioSession | null {
  try {
    const obj = JSON.parse(raw) as StudioSession
    obj.latestScreenshot = null  // never stored in Redis
    return obj
  } catch {
    return null
  }
}

/** Write session to Redis (non-blocking). */
function redisPersist(session: StudioSession): void {
  const r = getRedis()
  if (!r) return
  Promise.resolve(
    r.set(redisKey(session.sessionId), serialize(session), 'EX', REDIS_TTL_SECS),
  ).catch(() => { /* ignore */ })
}

/** Load a session from Redis and hydrate memory. Returns null on any error. */
async function redisLoad(sessionId: string): Promise<StudioSession | null> {
  const r = getRedis()
  if (!r) return null
  try {
    const raw = await r.get(redisKey(sessionId))
    if (!raw) return null
    const session = deserialize(raw)
    if (!session) return null
    sessions.set(sessionId, session)
    return session
  } catch {
    return null
  }
}

/** Delete a session from Redis. */
function redisDelete(sessionId: string): void {
  const r = getRedis()
  if (!r) return
  Promise.resolve(r.del(redisKey(sessionId))).catch(() => { /* ignore */ })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
}

function pruneStale(): void {
  const cutoff = Date.now() - SESSION_TTL_MS
  for (const [id, session] of sessions) {
    if (session.lastHeartbeat < cutoff) {
      sessions.delete(id)
      // Don't delete from Redis — Redis TTL handles that
    }
  }
}

function touchHeartbeat(session: StudioSession): void {
  session.lastHeartbeat = Date.now()
  session.connected     = true
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Look up a session. Memory-first; falls back to Redis on miss.
 * Returns undefined when the session does not exist anywhere.
 */
export async function getSession(
  sessionId: string,
): Promise<StudioSession | undefined> {
  pruneStale()

  // Memory hit
  const mem = sessions.get(sessionId)
  if (mem) {
    if (Date.now() - mem.lastHeartbeat > SESSION_TTL_MS) {
      mem.connected = false
    }
    return mem
  }

  // Redis fallback — hydrates memory
  const fromRedis = await redisLoad(sessionId)
  if (!fromRedis) return undefined

  if (Date.now() - fromRedis.lastHeartbeat > SESSION_TTL_MS) {
    fromRedis.connected = false
  }
  return fromRedis
}

/**
 * Synchronous memory-only lookup (for hot paths that cannot await).
 * Returns undefined when not in memory (use getSession() to also check Redis).
 */
export function getSessionSync(sessionId: string): StudioSession | undefined {
  pruneStale()
  return sessions.get(sessionId)
}

/**
 * Create a new session from a plugin connection handshake.
 */
export function createSession(opts: {
  placeId:       string
  placeName:     string
  pluginVersion: string
  authToken:     string
}): StudioSession {
  pruneStale()

  const session: StudioSession = {
    sessionId:        generateId(),
    placeId:          opts.placeId,
    placeName:        opts.placeName,
    pluginVersion:    opts.pluginVersion,
    authToken:        opts.authToken,
    lastHeartbeat:    Date.now(),
    connected:        true,
    latestState:      null,
    latestScreenshot: null,
    commandQueue:     [],
    lastPollAt:       0,
  }

  sessions.set(session.sessionId, session)
  redisPersist(session)
  return session
}

/**
 * Update the heartbeat and latest state for a session.
 * Returns undefined when the session doesn't exist in memory or Redis.
 */
export async function updateSessionState(
  sessionId: string,
  state: Record<string, unknown>,
): Promise<StudioSession | undefined> {
  let session = sessions.get(sessionId) ?? await redisLoad(sessionId)
  if (!session) return undefined
  touchHeartbeat(session)
  session.latestState = state
  sessions.set(sessionId, session)
  redisPersist(session)
  return session
}

/**
 * Touch the heartbeat for a session (used by standalone heartbeat events).
 */
export async function touchSession(
  sessionId: string,
): Promise<StudioSession | undefined> {
  let session = sessions.get(sessionId) ?? await redisLoad(sessionId)
  if (!session) return undefined
  touchHeartbeat(session)
  sessions.set(sessionId, session)
  redisPersist(session)
  return session
}

/**
 * Store a screenshot for a session. Screenshots are kept in memory only
 * (too large to store in Redis efficiently).
 */
export async function storeScreenshot(
  sessionId: string,
  base64Png: string,
): Promise<boolean> {
  let session = sessions.get(sessionId) ?? await redisLoad(sessionId)
  if (!session) return false
  touchHeartbeat(session)
  session.latestScreenshot = base64Png
  sessions.set(sessionId, session)
  // Persist everything except the screenshot
  redisPersist(session)
  return true
}

/**
 * Add a command to a session's queue.
 */
export async function queueCommand(
  sessionId: string,
  command: Omit<PendingCommand, 'id' | 'timestamp'>,
): Promise<{ ok: boolean; commandId?: string; error?: string }> {
  let session = sessions.get(sessionId) ?? await redisLoad(sessionId)
  if (!session) return { ok: false, error: 'session_not_found' }
  if (!session.connected) return { ok: false, error: 'session_disconnected' }
  if (session.commandQueue.length >= COMMAND_QUEUE_MAX) {
    return { ok: false, error: 'queue_full' }
  }

  const entry: PendingCommand = {
    id:        generateId(),
    type:      command.type,
    data:      command.data,
    timestamp: Date.now(),
  }
  session.commandQueue.push(entry)
  sessions.set(sessionId, session)
  redisPersist(session)
  return { ok: true, commandId: entry.id }
}

/**
 * Drain commands from the queue that were enqueued since `since`.
 * Returns null when rate-limited.
 */
export async function drainCommands(
  sessionId: string,
  since:     number,
): Promise<PendingCommand[] | null> {
  let session = sessions.get(sessionId) ?? await redisLoad(sessionId)
  if (!session) return []

  const now = Date.now()
  if (now - session.lastPollAt < MIN_POLL_INTERVAL_MS) return null

  touchHeartbeat(session)
  session.lastPollAt = now

  const pending    = session.commandQueue.filter((c) => c.timestamp > since)
  const returnedIds = new Set(pending.map((c) => c.id))
  session.commandQueue = session.commandQueue.filter((c) => !returnedIds.has(c.id))

  sessions.set(sessionId, session)
  redisPersist(session)
  return pending
}

/**
 * Find the most recently active session for a given placeId.
 * Memory-only — for cross-instance lookups use Redis directly.
 */
export function getSessionByPlaceId(placeId: string): StudioSession | undefined {
  pruneStale()
  let best: StudioSession | undefined
  for (const session of sessions.values()) {
    if (session.placeId === placeId) {
      if (!best || session.lastHeartbeat > best.lastHeartbeat) best = session
    }
  }
  return best
}

/**
 * Find a session by its auth token (memory-only for speed).
 * Called on every poll — Redis fallback would be too slow here.
 */
export function getSessionByToken(token: string): StudioSession | undefined {
  pruneStale()
  for (const session of sessions.values()) {
    if (session.authToken === token) return session
  }
  return undefined
}

/**
 * Lightweight session summary for admin/debug endpoints.
 */
export function listSessions(): Array<
  Pick<
    StudioSession,
    | 'sessionId'
    | 'placeId'
    | 'placeName'
    | 'connected'
    | 'lastHeartbeat'
    | 'pluginVersion'
  > & { queueDepth: number }
> {
  pruneStale()
  return [...sessions.values()].map((s) => ({
    sessionId:     s.sessionId,
    placeId:       s.placeId,
    placeName:     s.placeName,
    connected:     s.connected,
    lastHeartbeat: s.lastHeartbeat,
    pluginVersion: s.pluginVersion,
    queueDepth:    s.commandQueue.length,
  }))
}

// Backwards-compat alias
export { SESSION_TTL_MS as SESSION_TTL }
