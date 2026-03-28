/**
 * Socket.io real-time presence layer
 *
 * Events emitted TO clients:
 *   presence:update    — who is online in a team room
 *   activity:new       — new activity feed event
 *   zone:locked        — a zone was claimed
 *   zone:unlocked      — a zone was released
 *   cursor:move        — teammate cursor position update
 *
 * Events received FROM clients:
 *   room:join          — join a team room
 *   room:leave         — leave a team room
 *   cursor:move        — broadcast cursor position
 *   activity:emit      — user action to broadcast
 *
 * NOTE: socket.io is not bundled in the API package yet.
 * This module exports a factory to attach Socket.io to an existing HTTP server.
 * Install: npm install socket.io --workspace=apps/api
 *
 * Until socket.io is installed, the module exports a no-op factory so
 * the rest of the codebase can import without crashing.
 */

export interface PresenceUser {
  userId: string
  displayName: string
  avatarUrl?: string
  editingZone?: string
  color: string
  lastSeen: number
}

export interface RoomPresence {
  teamId: string
  users: PresenceUser[]
}

// In-memory presence store (room -> userId -> PresenceUser)
const roomPresence = new Map<string, Map<string, PresenceUser>>()

const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9',
]

function getColor(userId: string): string {
  const idx = userId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return USER_COLORS[idx % USER_COLORS.length]
}

export function getRoomPresence(teamId: string): PresenceUser[] {
  const room = roomPresence.get(teamId)
  if (!room) return []
  return Array.from(room.values())
}

export function upsertPresence(teamId: string, user: Omit<PresenceUser, 'color' | 'lastSeen'> & { color?: string }): PresenceUser {
  if (!roomPresence.has(teamId)) {
    roomPresence.set(teamId, new Map())
  }
  const room = roomPresence.get(teamId)!
  const entry: PresenceUser = {
    ...user,
    color: user.color ?? getColor(user.userId),
    lastSeen: Date.now(),
  }
  room.set(user.userId, entry)
  return entry
}

export function removePresence(teamId: string, userId: string): void {
  roomPresence.get(teamId)?.delete(userId)
  if (roomPresence.get(teamId)?.size === 0) {
    roomPresence.delete(teamId)
  }
}

// ---------------------------------------------------------------------------
// Socket.io factory — attach to any HTTP server
// Gracefully degrades if socket.io is not installed
// ---------------------------------------------------------------------------

type AnyServer = { httpServer?: unknown }

export function attachSocketServer(server: AnyServer): unknown {
  try {
    // Dynamic require so build doesn't fail if socket.io isn't installed
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Server } = require('socket.io') as typeof import('socket.io')

    const io = new Server(server as Parameters<typeof Server>[0], {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    })

    io.on('connection', (socket) => {
      let currentTeamId: string | null = null
      let currentUserId: string | null = null

      socket.on('room:join', (data: { teamId: string; userId: string; displayName: string; avatarUrl?: string }) => {
        const { teamId, userId, displayName, avatarUrl } = data

        // Leave previous room if any
        if (currentTeamId && currentUserId) {
          socket.leave(`team:${currentTeamId}`)
          removePresence(currentTeamId, currentUserId)
          io.to(`team:${currentTeamId}`).emit('presence:update', {
            teamId: currentTeamId,
            users: getRoomPresence(currentTeamId),
          })
        }

        currentTeamId = teamId
        currentUserId = userId
        socket.join(`team:${teamId}`)

        const presence = upsertPresence(teamId, { userId, displayName, avatarUrl })

        io.to(`team:${teamId}`).emit('presence:update', {
          teamId,
          users: getRoomPresence(teamId),
        })

        console.log(`[socket] ${displayName} joined team:${teamId} (color: ${presence.color})`)
      })

      socket.on('room:leave', () => {
        if (currentTeamId && currentUserId) {
          socket.leave(`team:${currentTeamId}`)
          removePresence(currentTeamId, currentUserId)
          io.to(`team:${currentTeamId}`).emit('presence:update', {
            teamId: currentTeamId,
            users: getRoomPresence(currentTeamId),
          })
          currentTeamId = null
          currentUserId = null
        }
      })

      socket.on('cursor:move', (data: { x: number; y: number; zone?: string }) => {
        if (!currentTeamId || !currentUserId) return

        // Update presence with current zone
        if (data.zone) {
          upsertPresence(currentTeamId, {
            userId: currentUserId,
            displayName: '',
            editingZone: data.zone,
          })
        }

        socket.to(`team:${currentTeamId}`).emit('cursor:move', {
          userId: currentUserId,
          x: data.x,
          y: data.y,
          zone: data.zone,
        })
      })

      socket.on('activity:emit', (data: { action: string; description: string; metadata?: unknown }) => {
        if (!currentTeamId || !currentUserId) return

        io.to(`team:${currentTeamId}`).emit('activity:new', {
          userId: currentUserId,
          teamId: currentTeamId,
          action: data.action,
          description: data.description,
          metadata: data.metadata,
          timestamp: Date.now(),
        })
      })

      socket.on('disconnect', () => {
        if (currentTeamId && currentUserId) {
          removePresence(currentTeamId, currentUserId)
          io.to(`team:${currentTeamId}`).emit('presence:update', {
            teamId: currentTeamId,
            users: getRoomPresence(currentTeamId),
          })
        }
      })
    })

    console.log('[socket] Socket.io server attached')
    return io
  } catch (err) {
    console.warn('[socket] socket.io not available — real-time presence disabled. Install socket.io to enable.', err)
    return null
  }
}
