/**
 * Studio session management.
 *
 * Architecture: Redis-primary, memory-as-L1-cache.
 *
 *   L1 (memory):  zero-latency reads, survives within a single Lambda invocation
 *   L2 (Redis):   source of truth, shared across all Lambda instances on Vercel
 *
 * Read path:   L1 hit → return. L1 miss → Redis → hydrate L1 → return.
 * Write path:  L1 + Redis in parallel (Redis is authoritative).
 * Command queue: Redis list `fj:studio:cmd:<sessionId>` is authoritative.
 *               RPUSH to enqueue, MULTI/EXEC LRANGE+DEL to drain atomically.
 * Indexes:
 *   fj:studio:token:<tokenHash>  → sessionId   (for getSessionByToken)
 *   fj:studio:place:<placeId>    → sessionId   (for getSessionByPlaceId)
 *
 * Graceful degradation: when Redis is unavailable every operation falls back
 * to L1 memory only, preserving functionality for a single-instance deploy.
 *
 * Screenshots are kept in L1 only — too large for Redis.
 */

import 'server-only'

export type ChangeType =
  | 'insert_model'
  | 'delete_model'
  | 'update_property'
  | 'execute_luau'
  | 'insert_asset'
  | 'scan_workspace'

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
  /** Latest viewport screenshot (base64 PNG) — L1 only, never in Redis */
  latestScreenshot: string | null
  /** Unix ms when latestScreenshot was last stored */
  latestScreenshotAt: number | null
  /** Pre-build screenshot for before/after comparison — L1 only */
  beforeScreenshot: string | null
  /** Unix ms when beforeScreenshot was captured */
  beforeScreenshotAt: number | null
  /** Live camera position + look direction from Studio */
  camera: {
    posX: number; posY: number; posZ: number
    lookX: number; lookY: number; lookZ: number
    fov?: number
  } | null
  /** Part count in workspace */
  partCount: number
  /**
   * In-memory command cache.  Redis list `fj:studio:cmd:<sessionId>` is the
   * authoritative queue — this field is only populated when Redis is down.
   */
  commandQueue:    PendingCommand[]
  /** Unix ms of the last poll — enforces rate limit */
  lastPollAt:      number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const SESSION_TTL_MS       = 300_000  // 5 min — connected threshold
export const REDIS_TTL_SECS       = 600      // 10 min Redis key TTL
export const COMMAND_QUEUE_MAX    = 50
export const MIN_POLL_INTERVAL_MS = 800

// ---------------------------------------------------------------------------
// Startup warning — surfaces misconfiguration early in Vercel logs
// ---------------------------------------------------------------------------

if (!process.env.REDIS_URL) {
  console.warn('[studio] REDIS_URL not set — sessions will not persist across Lambda instances')
}

// ---------------------------------------------------------------------------
// In-memory L1 store — survives Next.js hot-reload via globalThis
// ---------------------------------------------------------------------------

// @ts-expect-error — attach to globalThis to survive Next.js hot-reload
const sessions: Map<string, StudioSession> = (globalThis.__fjStudioSessions ??= new Map())
// @ts-expect-error
globalThis.__fjStudioSessions = sessions

// ---------------------------------------------------------------------------
// Redis helpers — all errors are silently swallowed
// ---------------------------------------------------------------------------

function getRedis() {
  try {
    // Dynamic require keeps this from crashing at build time
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('./redis') as { getRedis?: () => import('ioredis').Redis | null }
    return mod.getRedis ? mod.getRedis() : null
  } catch {
    return null
  }
}

// Key namespaces
const REDIS_SESSION_PREFIX    = 'fj:studio:session:'
const REDIS_CMD_PREFIX        = 'fj:studio:cmd:'
const REDIS_TOKEN_PREFIX      = 'fj:studio:token:'
const REDIS_PLACE_PREFIX      = 'fj:studio:place:'
const REDIS_SCREENSHOT_PREFIX = 'fj:studio:screenshot:'
const REDIS_BEFORE_SS_PREFIX  = 'fj:studio:before-screenshot:'

// Screenshots refresh every few seconds — 60 s TTL is plenty
const SCREENSHOT_TTL_SECS = 60

function sessionKey(id: string)        { return `${REDIS_SESSION_PREFIX}${id}` }
function cmdKey(id: string)            { return `${REDIS_CMD_PREFIX}${id}` }
function tokenKey(tok: string)         { return `${REDIS_TOKEN_PREFIX}${tok}` }
function placeKey(pid: string)         { return `${REDIS_PLACE_PREFIX}${pid}` }
function screenshotKey(id: string)     { return `${REDIS_SCREENSHOT_PREFIX}${id}` }
function beforeScreenshotKey(id: string) { return `${REDIS_BEFORE_SS_PREFIX}${id}` }

/** Serialize a session for Redis. Screenshots are stored in separate keys. */
function serialize(session: StudioSession): string {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { latestScreenshot: _ls, beforeScreenshot: _bs, commandQueue: _cq, ...rest } = session
  // commandQueue is authoritative in Redis list; don't duplicate it in the hash
  return JSON.stringify({ ...rest, commandQueue: [] })
}

function deserialize(raw: string): StudioSession | null {
  try {
    const obj = JSON.parse(raw) as StudioSession
    // Screenshots are stored in dedicated Redis keys — hydrated separately
    obj.latestScreenshot     = null
    obj.latestScreenshotAt ??= null
    obj.beforeScreenshot     = null
    obj.beforeScreenshotAt ??= null
    obj.commandQueue       ??= []
    return obj
  } catch {
    return null
  }
}

/**
 * Write a screenshot to its dedicated Redis key (fire-and-forget).
 * Stored separately from the session blob so the main session key stays small.
 */
function redisPersistScreenshot(sessionId: string, base64Png: string, isBefore: boolean): void {
  const r = getRedis()
  if (!r) return
  const key = isBefore ? beforeScreenshotKey(sessionId) : screenshotKey(sessionId)
  Promise.resolve(
    r.set(key, base64Png, 'EX', SCREENSHOT_TTL_SECS),
  ).catch(() => { /* ignore */ })
}

/**
 * Load a screenshot from Redis. Returns null on miss or error.
 */
async function redisLoadScreenshot(sessionId: string, isBefore: boolean): Promise<string | null> {
  const r = getRedis()
  if (!r) return null
  const key = isBefore ? beforeScreenshotKey(sessionId) : screenshotKey(sessionId)
  try {
    return await r.get(key)
  } catch {
    return null
  }
}

/** Write session to Redis (non-blocking, fire-and-forget). */
function redisPersist(session: StudioSession): void {
  const r = getRedis()
  if (!r) return
  Promise.resolve(
    r.set(sessionKey(session.sessionId), serialize(session), 'EX', REDIS_TTL_SECS),
  ).catch(() => { /* ignore */ })
}

/**
 * Write the secondary indexes for token and placeId.
 * Called once at session creation and after any field change that alters them.
 */
function redisWriteIndexes(session: StudioSession): void {
  const r = getRedis()
  if (!r) return
  Promise.all([
    r.set(tokenKey(session.authToken), session.sessionId, 'EX', REDIS_TTL_SECS),
    r.set(placeKey(session.placeId),   session.sessionId, 'EX', REDIS_TTL_SECS),
  ]).catch(() => { /* ignore */ })
}

/** Load a session from Redis and hydrate L1. Returns null on any error or miss. */
async function redisLoad(sessionId: string): Promise<StudioSession | null> {
  const r = getRedis()
  if (!r) return null
  try {
    const raw = await r.get(sessionKey(sessionId))
    if (!raw) return null
    const session = deserialize(raw)
    if (!session) return null
    sessions.set(sessionId, session)
    return session
  } catch {
    return null
  }
}

/** Delete a session and its indexes from Redis. */
function redisDelete(session: StudioSession): void {
  const r = getRedis()
  if (!r) return
  Promise.all([
    r.del(sessionKey(session.sessionId)),
    r.del(cmdKey(session.sessionId)),
    r.del(tokenKey(session.authToken)),
    r.del(placeKey(session.placeId)),
  ]).catch(() => { /* ignore */ })
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
      // Redis TTL handles expiry there — no explicit delete needed
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
 * Look up a session. L1-first; falls back to Redis on miss.
 * Returns undefined when the session does not exist anywhere.
 *
 * Screenshots are always hydrated from Redis when not present in L1 so that
 * Lambda instances that did not receive the POST can still serve the GET.
 */
export async function getSession(
  sessionId: string,
): Promise<StudioSession | undefined> {
  pruneStale()

  // L1 hit
  const mem = sessions.get(sessionId)
  if (mem) {
    if (Date.now() - mem.lastHeartbeat > SESSION_TTL_MS) mem.connected = false
    // Hydrate screenshots from Redis if L1 is missing them (cross-Lambda case)
    if (!mem.latestScreenshot) {
      const redisShot = await redisLoadScreenshot(sessionId, false)
      if (redisShot) {
        mem.latestScreenshot   = redisShot
        mem.latestScreenshotAt = mem.latestScreenshotAt ?? Date.now()
      }
    }
    if (!mem.beforeScreenshot) {
      const redisBefore = await redisLoadScreenshot(sessionId, true)
      if (redisBefore) {
        mem.beforeScreenshot   = redisBefore
        mem.beforeScreenshotAt = mem.beforeScreenshotAt ?? Date.now()
      }
    }
    return mem
  }

  // Redis fallback — hydrates L1
  const fromRedis = await redisLoad(sessionId)
  if (!fromRedis) return undefined

  if (Date.now() - fromRedis.lastHeartbeat > SESSION_TTL_MS) {
    fromRedis.connected = false
  }

  // Hydrate screenshots into the session loaded from Redis
  const [redisShot, redisBefore] = await Promise.all([
    redisLoadScreenshot(sessionId, false),
    redisLoadScreenshot(sessionId, true),
  ])
  if (redisShot) {
    fromRedis.latestScreenshot   = redisShot
    fromRedis.latestScreenshotAt = fromRedis.latestScreenshotAt ?? Date.now()
  }
  if (redisBefore) {
    fromRedis.beforeScreenshot   = redisBefore
    fromRedis.beforeScreenshotAt = fromRedis.beforeScreenshotAt ?? Date.now()
  }

  return fromRedis
}

/**
 * Synchronous L1-only lookup (for hot paths that cannot await).
 * Use getSession() to also check Redis.
 */
export function getSessionSync(sessionId: string): StudioSession | undefined {
  pruneStale()
  return sessions.get(sessionId)
}

/**
 * Create a new session from a plugin connection handshake.
 * Writes session data + both secondary indexes to Redis.
 */
export function createSession(opts: {
  placeId:       string
  placeName:     string
  pluginVersion: string
  authToken:     string
  /** Optional: force a specific session ID (e.g. when recreating from a JWT). */
  sessionId?:    string
}): StudioSession {
  pruneStale()

  const session: StudioSession = {
    sessionId:            opts.sessionId ?? generateId(),
    placeId:              opts.placeId,
    placeName:            opts.placeName,
    pluginVersion:        opts.pluginVersion,
    authToken:            opts.authToken,
    lastHeartbeat:        Date.now(),
    connected:            true,
    latestState:          null,
    latestScreenshot:     null,
    latestScreenshotAt:   null,
    beforeScreenshot:     null,
    beforeScreenshotAt:   null,
    camera:               null,
    partCount:            0,
    commandQueue:         [],
    lastPollAt:           0,
  }

  sessions.set(session.sessionId, session)
  redisPersist(session)
  redisWriteIndexes(session)
  return session
}

/**
 * Update the heartbeat and latest state for a session.
 * Returns undefined when the session doesn't exist in L1 or Redis.
 */
export async function updateSessionState(
  sessionId: string,
  state: Record<string, unknown>,
): Promise<StudioSession | undefined> {
  const session = sessions.get(sessionId) ?? await redisLoad(sessionId)
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
  const session = sessions.get(sessionId) ?? await redisLoad(sessionId)
  if (!session) return undefined
  touchHeartbeat(session)
  sessions.set(sessionId, session)
  redisPersist(session)
  return session
}

/**
 * Store a screenshot for a session.
 * Written to L1 and to a dedicated Redis key so all Lambda instances can read it.
 */
export async function storeScreenshot(
  sessionId: string,
  base64Png: string,
): Promise<boolean> {
  const session = sessions.get(sessionId) ?? await redisLoad(sessionId)
  if (!session) return false
  touchHeartbeat(session)
  session.latestScreenshot   = base64Png
  session.latestScreenshotAt = Date.now()
  sessions.set(sessionId, session)
  redisPersist(session)
  // Also write to the dedicated screenshot key so other Lambda instances can read it
  redisPersistScreenshot(sessionId, base64Png, false)
  return true
}

/**
 * Promote the current latestScreenshot to beforeScreenshot.
 * If latestScreenshot is null, base64Png is stored directly.
 */
export async function storeBeforeScreenshot(
  sessionId: string,
  base64Png: string,
): Promise<boolean> {
  const session = sessions.get(sessionId) ?? await redisLoad(sessionId)
  if (!session) return false
  touchHeartbeat(session)
  session.beforeScreenshot   = base64Png
  session.beforeScreenshotAt = Date.now()
  sessions.set(sessionId, session)
  redisPersist(session)
  // Also write to the dedicated before-screenshot key
  redisPersistScreenshot(sessionId, base64Png, true)
  return true
}

/**
 * Add a command to a session's queue.
 *
 * Redis-primary: the command is RPUSH-ed to `fj:studio:cmd:<sessionId>`.
 * L1 commandQueue is updated as a cache for the Redis-down fallback path.
 */
export async function queueCommand(
  sessionId: string,
  command: Omit<PendingCommand, 'id' | 'timestamp'>,
): Promise<{ ok: boolean; commandId?: string; error?: string }> {
  const session = sessions.get(sessionId) ?? await redisLoad(sessionId)
  if (!session) return { ok: false, error: 'session_not_found' }
  if (!session.connected) return { ok: false, error: 'session_disconnected' }

  const entry: PendingCommand = {
    id:        generateId(),
    type:      command.type,
    data:      command.data,
    timestamp: Date.now(),
  }

  const r = getRedis()
  if (r) {
    try {
      // Check queue depth atomically via the Redis list length
      const depth = await r.llen(cmdKey(sessionId))
      if (depth >= COMMAND_QUEUE_MAX) {
        return { ok: false, error: 'queue_full' }
      }

      // RPUSH + reset TTL in a pipeline
      const pipe = r.pipeline()
      pipe.rpush(cmdKey(sessionId), JSON.stringify(entry))
      pipe.expire(cmdKey(sessionId), REDIS_TTL_SECS)
      await pipe.exec()

      // Keep L1 in sync so getSessionSync callers see a non-zero queue depth
      session.commandQueue = [...session.commandQueue, entry].slice(-COMMAND_QUEUE_MAX)
      sessions.set(sessionId, session)
      redisPersist(session)
      return { ok: true, commandId: entry.id }
    } catch {
      // Redis error — fall through to L1 path
    }
  }

  // ---- L1 fallback (Redis unavailable) ----
  if (session.commandQueue.length >= COMMAND_QUEUE_MAX) {
    return { ok: false, error: 'queue_full' }
  }
  session.commandQueue.push(entry)
  sessions.set(sessionId, session)
  return { ok: true, commandId: entry.id }
}

/**
 * Drain all pending commands from the queue.
 * Returns null when rate-limited.
 *
 * Redis-primary: uses MULTI/EXEC to atomically read and clear the Redis list.
 * Falls back to L1 commandQueue when Redis is unavailable.
 *
 * The `since` parameter is intentionally ignored on the Redis path — the list
 * holds only undelivered commands; there is no reason to filter by timestamp
 * when every item in the list is by definition newer than the last drain.
 * (The L1 fallback path preserves the `since` filter for compatibility.)
 */
export async function drainCommands(
  sessionId: string,
  since:     number,
): Promise<PendingCommand[] | null> {
  const session = sessions.get(sessionId) ?? await redisLoad(sessionId)
  if (!session) return []

  const now = Date.now()

  // Always touch heartbeat, even when rate-limited
  touchHeartbeat(session)

  // Rate-limit check — use L1 lastPollAt as fast gate
  if (now - session.lastPollAt < MIN_POLL_INTERVAL_MS) {
    sessions.set(sessionId, session)
    // Persist heartbeat so other Lambdas see the session as live
    redisPersist(session)
    return null
  }

  session.lastPollAt = now
  sessions.set(sessionId, session)

  const r = getRedis()
  if (r) {
    try {
      // Atomic drain: read everything then delete in a MULTI/EXEC block
      const multi = r.multi()
      multi.lrange(cmdKey(sessionId), 0, -1)
      multi.del(cmdKey(sessionId))
      const results = await multi.exec()

      // exec() returns null if the transaction was aborted (WATCH conflict)
      if (!results) {
        // Retry once with a simple non-atomic read+del
        const raw = await r.lrange(cmdKey(sessionId), 0, -1)
        await r.del(cmdKey(sessionId))
        const commands = parseRedisCmds(raw)
        // Clear L1 queue since Redis list is now authoritative and drained
        session.commandQueue = []
        sessions.set(sessionId, session)
        redisPersist(session)
        return commands
      }

      // results[0] is the LRANGE result tuple [err, value]; results[1] is the DEL count tuple
      const lrangeResult = results[0]
      const lrangeValue = Array.isArray(lrangeResult) ? lrangeResult[1] : null
      const rawEntries = Array.isArray(lrangeValue) ? lrangeValue : []
      const commands = parseRedisCmds(rawEntries as string[])

      // Clear L1 queue — Redis list is now drained
      session.commandQueue = []
      sessions.set(sessionId, session)
      redisPersist(session)
      return commands
    } catch {
      // Redis error — fall through to L1 path
    }
  }

  // ---- L1 fallback (Redis unavailable) ----
  const pending     = session.commandQueue.filter((c) => c.timestamp > since)
  const returnedIds = new Set(pending.map((c) => c.id))
  session.commandQueue = session.commandQueue.filter((c) => !returnedIds.has(c.id))
  sessions.set(sessionId, session)
  return pending
}

/** Parse raw JSON strings from a Redis LRANGE result into PendingCommand[]. */
function parseRedisCmds(raw: string[]): PendingCommand[] {
  const out: PendingCommand[] = []
  for (const item of raw) {
    try {
      out.push(JSON.parse(item) as PendingCommand)
    } catch {
      // Corrupt entry — skip
    }
  }
  return out
}

/**
 * Find a session by its auth token.
 *
 * Checks L1 first; on miss, queries the Redis token index to get the sessionId,
 * then loads the full session.
 */
export async function getSessionByToken(
  token: string,
): Promise<StudioSession | undefined> {
  pruneStale()

  // L1 scan
  for (const session of sessions.values()) {
    if (session.authToken === token) return session
  }

  // Redis token index fallback
  const r = getRedis()
  if (!r) return undefined

  try {
    const sessionId = await r.get(tokenKey(token))
    if (!sessionId) return undefined
    return (await redisLoad(sessionId)) ?? undefined
  } catch {
    return undefined
  }
}

/**
 * Find the most recently active session for a given placeId.
 *
 * Checks L1 first; on miss, queries the Redis place index.
 */
export async function getSessionByPlaceId(
  placeId: string,
): Promise<StudioSession | undefined> {
  pruneStale()

  // L1 scan — pick the freshest match
  let best: StudioSession | undefined
  for (const session of sessions.values()) {
    if (session.placeId === placeId) {
      if (!best || session.lastHeartbeat > best.lastHeartbeat) best = session
    }
  }
  if (best) return best

  // Redis place index fallback
  const r = getRedis()
  if (!r) return undefined

  try {
    const sessionId = await r.get(placeKey(placeId))
    if (!sessionId) return undefined
    return (await redisLoad(sessionId)) ?? undefined
  } catch {
    return undefined
  }
}

/**
 * Lightweight session summary for admin/debug endpoints.
 *
 * Merges L1 sessions with any Redis sessions not already in L1.
 * Queue depth for Redis-backed sessions reflects the Redis list length.
 */
export async function listSessions(): Promise<Array<
  Pick<
    StudioSession,
    | 'sessionId'
    | 'placeId'
    | 'placeName'
    | 'connected'
    | 'lastHeartbeat'
    | 'pluginVersion'
  > & { queueDepth: number }
>> {
  pruneStale()

  // Start with everything in L1
  const seen = new Set<string>()
  const rows: Array<Awaited<ReturnType<typeof listSessions>>[number]> = []

  const r = getRedis()

  // Helper: get queue depth — prefer Redis list length when available
  async function queueDepth(s: StudioSession): Promise<number> {
    if (r) {
      try {
        const len = await r.llen(cmdKey(s.sessionId))
        return len
      } catch { /* fall through */ }
    }
    return s.commandQueue.length
  }

  // Build rows from L1
  const l1Rows = await Promise.all(
    [...sessions.values()].map(async (s) => {
      seen.add(s.sessionId)
      return {
        sessionId:     s.sessionId,
        placeId:       s.placeId,
        placeName:     s.placeName,
        connected:     s.connected,
        lastHeartbeat: s.lastHeartbeat,
        pluginVersion: s.pluginVersion,
        queueDepth:    await queueDepth(s),
      }
    }),
  )
  rows.push(...l1Rows)

  // Merge in Redis sessions not already in L1
  if (r) {
    try {
      let cursor = '0'
      do {
        const [nextCursor, keys] = await r.scan(
          cursor,
          'MATCH', `${REDIS_SESSION_PREFIX}*`,
          'COUNT', '100',
        )
        cursor = nextCursor

        await Promise.all(
          keys.map(async (key) => {
            const id = key.slice(REDIS_SESSION_PREFIX.length)
            if (seen.has(id)) return
            seen.add(id)

            try {
              const raw = await r.get(key)
              if (!raw) return
              const s = deserialize(raw)
              if (!s) return

              const depth = await r.llen(cmdKey(id)).catch(() => 0)
              rows.push({
                sessionId:     s.sessionId,
                placeId:       s.placeId,
                placeName:     s.placeName,
                connected:     Date.now() - s.lastHeartbeat <= SESSION_TTL_MS && s.connected,
                lastHeartbeat: s.lastHeartbeat,
                pluginVersion: s.pluginVersion,
                queueDepth:    depth,
              })
            } catch { /* skip corrupt entry */ }
          }),
        )
      } while (cursor !== '0')
    } catch { /* Redis scan failed — return L1-only results */ }
  }

  return rows
}

// ---------------------------------------------------------------------------
// Backwards-compat shims
// ---------------------------------------------------------------------------

/**
 * Synchronous memory-only version of getSessionByToken.
 * Kept for callers that cannot await (hot poll paths).
 * On a cold Lambda this will miss — use the async version when possible.
 */
export function getSessionByTokenSync(token: string): StudioSession | undefined {
  pruneStale()
  for (const session of sessions.values()) {
    if (session.authToken === token) return session
  }
  return undefined
}

/**
 * Synchronous memory-only version of getSessionByPlaceId.
 */
export function getSessionByPlaceIdSync(placeId: string): StudioSession | undefined {
  pruneStale()
  let best: StudioSession | undefined
  for (const session of sessions.values()) {
    if (session.placeId === placeId) {
      if (!best || session.lastHeartbeat > best.lastHeartbeat) best = session
    }
  }
  return best
}

// Backwards-compat alias
export { SESSION_TTL_MS as SESSION_TTL }
