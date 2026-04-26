/**
 * shared-session.ts — Multi-user Studio sessions for team collaboration
 *
 * Allows team members to connect to the same Roblox Studio instance.
 * One person hosts (connects their Studio), team members join the session
 * and can send builds to the same Studio.
 *
 * Architecture:
 *   - Host connects Studio normally (6-char code → session)
 *   - Host "shares" their session with their team
 *   - Team members in the editor see the shared session
 *   - When a team member sends a build, it goes to the host's session
 *   - Zone locking prevents conflicts (via Redis)
 *
 * Redis keys:
 *   fj:shared:{teamId}         → JSON {hostUserId, sessionId, hostName, sharedAt}
 *   fj:shared:user:{userId}    → teamId (reverse lookup: which team is this user sharing to?)
 */

import 'server-only'

export interface SharedSession {
  teamId: string
  hostUserId: string
  hostName: string
  sessionId: string
  sharedAt: number
}

const SHARED_TTL_SECS = 3600 // 1 hour — auto-expire if host disconnects

function getRedis() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('./redis') as { getRedis?: () => import('ioredis').Redis | null }
    return mod.getRedis ? mod.getRedis() : null
  } catch {
    return null
  }
}

/**
 * Host shares their Studio session with their team.
 * Only one shared session per team at a time.
 */
export async function shareSession(
  teamId: string,
  hostUserId: string,
  hostName: string,
  sessionId: string,
): Promise<boolean> {
  const r = getRedis()
  if (!r) return false

  const data: SharedSession = {
    teamId,
    hostUserId,
    hostName,
    sessionId,
    sharedAt: Date.now(),
  }

  try {
    // Set the shared session for the team
    await r.set(`fj:shared:${teamId}`, JSON.stringify(data), 'EX', SHARED_TTL_SECS)
    // Reverse lookup: user → team they're sharing to
    await r.set(`fj:shared:user:${hostUserId}`, teamId, 'EX', SHARED_TTL_SECS)
    console.log(`[SharedSession] ${hostName} shared session ${sessionId} with team ${teamId}`)
    return true
  } catch (err) {
    console.error('[SharedSession] Failed to share:', err)
    return false
  }
}

/**
 * Get the active shared session for a team.
 * Returns null if no one is sharing.
 */
export async function getSharedSession(teamId: string): Promise<SharedSession | null> {
  const r = getRedis()
  if (!r) return null

  try {
    const raw = await r.get(`fj:shared:${teamId}`)
    if (!raw) return null
    return JSON.parse(raw) as SharedSession
  } catch {
    return null
  }
}

/**
 * Stop sharing a session (host disconnects or manually unshares).
 */
export async function unshareSession(teamId: string, userId: string): Promise<boolean> {
  const r = getRedis()
  if (!r) return false

  try {
    // Verify this user is the host
    const raw = await r.get(`fj:shared:${teamId}`)
    if (!raw) return false
    const session = JSON.parse(raw) as SharedSession
    if (session.hostUserId !== userId) return false

    await r.del(`fj:shared:${teamId}`)
    await r.del(`fj:shared:user:${userId}`)
    console.log(`[SharedSession] Unshared session for team ${teamId}`)
    return true
  } catch {
    return false
  }
}

/**
 * Refresh the TTL on a shared session (called on host heartbeat).
 */
export async function refreshSharedSession(userId: string): Promise<void> {
  const r = getRedis()
  if (!r) return

  try {
    const teamId = await r.get(`fj:shared:user:${userId}`)
    if (teamId) {
      await r.expire(`fj:shared:${teamId}`, SHARED_TTL_SECS)
      await r.expire(`fj:shared:user:${userId}`, SHARED_TTL_SECS)
    }
  } catch { /* non-fatal */ }
}

/**
 * Get the session ID a team member should send builds to.
 * If the team has a shared session, returns the host's session.
 * Otherwise returns null (user should use their own session).
 */
export async function getTeamSessionId(teamId: string, userId: string): Promise<string | null> {
  const shared = await getSharedSession(teamId)
  if (!shared) return null
  // Don't redirect the host to themselves
  if (shared.hostUserId === userId) return null
  return shared.sessionId
}

/**
 * List all users currently connected to a shared session (via Redis).
 * Includes the host + any team members who have active editor sessions.
 */
export async function getSharedSessionMembers(teamId: string): Promise<Array<{
  userId: string
  isHost: boolean
}>> {
  const r = getRedis()
  if (!r) return []

  try {
    const shared = await getSharedSession(teamId)
    if (!shared) return []

    // Get all team member keys that indicate online status
    const keys = await r.keys(`fj:shared:${teamId}:member:*`)
    const members: Array<{ userId: string; isHost: boolean }> = [
      { userId: shared.hostUserId, isHost: true },
    ]

    for (const key of keys) {
      const userId = key.split(':').pop()
      if (userId && userId !== shared.hostUserId) {
        members.push({ userId, isHost: false })
      }
    }

    return members
  } catch {
    return []
  }
}

/**
 * Mark a team member as online in the shared session.
 * Called when a team member opens the editor for a team project.
 */
export async function joinSharedSession(teamId: string, userId: string): Promise<void> {
  const r = getRedis()
  if (!r) return

  try {
    // Set presence key with 5-min TTL (refreshed on activity)
    await r.set(`fj:shared:${teamId}:member:${userId}`, '1', 'EX', 300)
  } catch { /* non-fatal */ }
}

/**
 * Remove a team member's presence from the shared session.
 */
export async function leaveSharedSession(teamId: string, userId: string): Promise<void> {
  const r = getRedis()
  if (!r) return

  try {
    await r.del(`fj:shared:${teamId}:member:${userId}`)
  } catch { /* non-fatal */ }
}
