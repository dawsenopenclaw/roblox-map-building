'use client'

import { useEffect, useRef, useState } from 'react'

export interface PresenceUser {
  userId: string
  displayName: string
  avatarUrl?: string
  editingZone?: string
  color: string
  lastSeen: number
}

interface PresenceIndicatorProps {
  teamId: string
  currentUserId: string
  currentUserName: string
  currentUserAvatar?: string
  maxVisible?: number
}

// Lightweight polling-based presence (Socket.io progressive enhancement)
export function PresenceIndicator({
  teamId,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  maxVisible = 5,
}: PresenceIndicatorProps) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([])
  const [socketReady, setSocketReady] = useState(false)
  const socketRef = useRef<unknown>(null)

  useEffect(() => {
    // Try to connect via Socket.io if available
    let mounted = true

    async function connectSocket() {
      try {
        const { io } = await import('socket.io-client')
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.forjegames.com'
        const socket = io(apiUrl, {
          transports: ['websocket', 'polling'],
          autoConnect: true,
        })

        socket.on('connect', () => {
          if (!mounted) return
          setSocketReady(true)
          socket.emit('room:join', {
            teamId,
            userId: currentUserId,
            displayName: currentUserName,
            avatarUrl: currentUserAvatar,
          })
        })

        socket.on('presence:update', (data: { teamId: string; users: PresenceUser[] }) => {
          if (!mounted || data.teamId !== teamId) return
          setOnlineUsers(data.users.filter((u) => u.userId !== currentUserId))
        })

        socket.on('disconnect', () => {
          if (mounted) setSocketReady(false)
        })

        socketRef.current = socket

        return () => {
          socket.emit('room:leave')
          socket.disconnect()
        }
      } catch {
        // socket.io-client not installed — show static indicator
        console.info('[PresenceIndicator] socket.io-client not available')
        return () => {}
      }
    }

    const cleanup = connectSocket()

    return () => {
      mounted = false
      cleanup.then((fn) => fn?.())
    }
  }, [teamId, currentUserId, currentUserName, currentUserAvatar])

  const visible = onlineUsers.slice(0, maxVisible)
  const overflow = onlineUsers.length - maxVisible

  return (
    <div className="flex items-center gap-2">
      {/* Connection status dot */}
      <div className="flex items-center gap-1.5">
        <span
          className={`w-2 h-2 rounded-full ${socketReady ? 'bg-green-400' : 'bg-gray-500'}`}
          title={socketReady ? 'Live sync active' : 'Offline'}
        />
        <span className="text-xs text-gray-400 hidden sm:inline">
          {socketReady ? 'Live' : 'Offline'}
        </span>
      </div>

      {/* Presence avatars */}
      {visible.length > 0 && (
        <div className="flex items-center -space-x-2">
          {visible.map((user) => (
            <div
              key={user.userId}
              className="relative group"
              title={`${user.displayName}${user.editingZone ? ` — editing ${user.editingZone}` : ''}`}
            >
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt={user.displayName}
                  className="w-7 h-7 rounded-full border-2"
                  style={{ borderColor: user.color }}
                />
              ) : (
                <div
                  className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: user.color, borderColor: user.color }}
                >
                  {user.displayName.slice(0, 1).toUpperCase()}
                </div>
              )}
              {/* Online pulse */}
              <span
                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[#0A0E2A]"
              />
              {/* Tooltip */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                {user.displayName}
                {user.editingZone && (
                  <span className="text-gray-300"> ({user.editingZone})</span>
                )}
              </div>
            </div>
          ))}

          {overflow > 0 && (
            <div className="w-7 h-7 rounded-full bg-[#1A2050] border-2 border-white/10 flex items-center justify-center text-xs text-gray-300">
              +{overflow}
            </div>
          )}
        </div>
      )}

      {visible.length === 0 && (
        <span className="text-xs text-gray-500">Just you</span>
      )}
    </div>
  )
}
