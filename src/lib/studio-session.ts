/**
 * Studio session management — in-memory store for Roblox Studio plugin connections.
 * Each session represents one active Studio instance connected to the web editor.
 */

export type ChangeType =
  | 'insert_model'
  | 'delete_model'
  | 'update_property'
  | 'execute_luau'
  | 'insert_asset'

export interface PendingCommand {
  id: string
  type: ChangeType
  data: Record<string, unknown>
  timestamp: number
}

export interface StudioSession {
  sessionId: string
  /** Roblox place ID reported by the plugin */
  placeId: string
  /** Human-readable place name reported by the plugin */
  placeName: string
  /** Unix ms of the most recent heartbeat (poll or update) */
  lastHeartbeat: number
  /** Whether the session is considered live (heartbeat within 60 s) */
  connected: boolean
  /** Semver string sent by the plugin at connect time */
  pluginVersion: string
  /** Auth token provided at connect — validated once, stored for reference */
  authToken: string
  /** Latest state snapshot pushed by the plugin */
  latestState: Record<string, unknown> | null
  /** Latest viewport screenshot (base64 PNG), keyed per session */
  latestScreenshot: string | null
  /** Pending commands waiting for the plugin to drain */
  commandQueue: PendingCommand[]
  /** Unix ms of the last poll — used to enforce the 1 poll/s rate limit */
  lastPollAt: number
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const sessions = new Map<string, StudioSession>()

// Session TTL: 60 seconds without a heartbeat = stale
const SESSION_TTL_MS = 60_000
// Maximum pending commands per session
const COMMAND_QUEUE_MAX = 50
// Rate-limit: minimum ms between polls from the same session
const MIN_POLL_INTERVAL_MS = 1_000

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
}

/** Remove sessions whose heartbeat is older than SESSION_TTL_MS */
function pruneStale(): void {
  const cutoff = Date.now() - SESSION_TTL_MS
  for (const [id, session] of sessions) {
    if (session.lastHeartbeat < cutoff) {
      sessions.delete(id)
    }
  }
}

/** Mark a session as connected and update its heartbeat timestamp */
function touchHeartbeat(session: StudioSession): void {
  session.lastHeartbeat = Date.now()
  session.connected = true
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Look up a session by its ID.
 * Also marks stale sessions as disconnected without deleting them immediately
 * so callers can still inspect last-known state.
 */
export function getSession(sessionId: string): StudioSession | undefined {
  pruneStale()
  const session = sessions.get(sessionId)
  if (!session) return undefined

  // Mark disconnected if heartbeat is stale but keep the record
  if (Date.now() - session.lastHeartbeat > SESSION_TTL_MS) {
    session.connected = false
  }
  return session
}

/**
 * Create a new session from a plugin connection handshake.
 * Returns the new session object.
 */
export function createSession(opts: {
  placeId: string
  placeName: string
  pluginVersion: string
  authToken: string
}): StudioSession {
  pruneStale()

  const session: StudioSession = {
    sessionId: generateId(),
    placeId: opts.placeId,
    placeName: opts.placeName,
    pluginVersion: opts.pluginVersion,
    authToken: opts.authToken,
    lastHeartbeat: Date.now(),
    connected: true,
    latestState: null,
    latestScreenshot: null,
    commandQueue: [],
    lastPollAt: 0,
  }

  sessions.set(session.sessionId, session)
  return session
}

/**
 * Update the heartbeat and latest state for a session.
 * Called when the plugin POSTs a state update.
 */
export function updateSessionState(
  sessionId: string,
  state: Record<string, unknown>,
): StudioSession | undefined {
  const session = sessions.get(sessionId)
  if (!session) return undefined
  touchHeartbeat(session)
  session.latestState = state
  return session
}

/**
 * Store a screenshot for a session.
 */
export function storeScreenshot(
  sessionId: string,
  base64Png: string,
): boolean {
  const session = sessions.get(sessionId)
  if (!session) return false
  touchHeartbeat(session)
  session.latestScreenshot = base64Png
  return true
}

/**
 * Add a command to a session's queue.
 * Returns false if the queue is full or the session doesn't exist.
 */
export function queueCommand(
  sessionId: string,
  command: Omit<PendingCommand, 'id' | 'timestamp'>,
): { ok: boolean; commandId?: string; error?: string } {
  const session = sessions.get(sessionId)
  if (!session) {
    return { ok: false, error: 'session_not_found' }
  }
  if (!session.connected) {
    return { ok: false, error: 'session_disconnected' }
  }
  if (session.commandQueue.length >= COMMAND_QUEUE_MAX) {
    return { ok: false, error: 'queue_full' }
  }

  const entry: PendingCommand = {
    id: generateId(),
    type: command.type,
    data: command.data,
    timestamp: Date.now(),
  }
  session.commandQueue.push(entry)
  return { ok: true, commandId: entry.id }
}

/**
 * Drain all commands from the queue that were enqueued since `since` (Unix ms).
 * Enforces the 1-poll-per-second rate limit.
 * Returns `null` when rate-limited.
 */
export function drainCommands(
  sessionId: string,
  since: number,
): PendingCommand[] | null {
  const session = sessions.get(sessionId)
  if (!session) return []

  const now = Date.now()

  // Rate limit: one poll per second per session
  if (now - session.lastPollAt < MIN_POLL_INTERVAL_MS) {
    return null
  }

  touchHeartbeat(session)
  session.lastPollAt = now

  // Return commands newer than the lastSync timestamp
  const pending = session.commandQueue.filter((c) => c.timestamp > since)

  // Remove from queue only commands that were returned
  const returnedIds = new Set(pending.map((c) => c.id))
  session.commandQueue = session.commandQueue.filter(
    (c) => !returnedIds.has(c.id),
  )

  return pending
}

/**
 * Find the most recently active session for a given placeId.
 * Used by the web editor to resolve sessions without knowing the sessionId.
 */
export function getSessionByPlaceId(
  placeId: string,
): StudioSession | undefined {
  pruneStale()
  let best: StudioSession | undefined
  for (const session of sessions.values()) {
    if (session.placeId === placeId) {
      if (!best || session.lastHeartbeat > best.lastHeartbeat) {
        best = session
      }
    }
  }
  return best
}

/**
 * Find a session by its auth token.
 * The plugin stores the bearer token from /api/studio/auth and uses it
 * to identify itself on sync/update calls.
 */
export function getSessionByToken(token: string): StudioSession | undefined {
  pruneStale()
  for (const session of sessions.values()) {
    if (session.authToken === token) return session
  }
  return undefined
}

/**
 * Return a lightweight summary of all live sessions (for admin/debug use).
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
    sessionId: s.sessionId,
    placeId: s.placeId,
    placeName: s.placeName,
    connected: s.connected,
    lastHeartbeat: s.lastHeartbeat,
    pluginVersion: s.pluginVersion,
    queueDepth: s.commandQueue.length,
  }))
}

export { SESSION_TTL_MS, COMMAND_QUEUE_MAX, MIN_POLL_INTERVAL_MS }
