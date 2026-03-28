'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@clerk/nextjs'

export interface ActivityEvent {
  id?: string
  userId: string
  teamId: string
  action: string
  description: string
  metadata?: Record<string, unknown>
  timestamp: number
  createdAt?: string
}

interface ActivityFeedProps {
  teamId: string
  initialActivities?: ActivityEvent[]
  maxItems?: number
  className?: string
}

const ACTION_ICONS: Record<string, string> = {
  member_joined: '👋',
  member_left: '🚪',
  role_changed: '🔑',
  version_created: '💾',
  version_rollback: '↩️',
  zone_locked: '🔒',
  zone_unlocked: '🔓',
  default: '⚡',
}

function timeAgo(ts: number | string): string {
  const now = Date.now()
  const time = typeof ts === 'string' ? new Date(ts).getTime() : ts
  const diff = Math.floor((now - time) / 1000)

  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export function ActivityFeed({
  teamId,
  initialActivities = [],
  maxItems = 50,
  className = '',
}: ActivityFeedProps) {
  const { getToken } = useAuth()
  const [activities, setActivities] = useState<ActivityEvent[]>(initialActivities)
  const [, forceUpdate] = useState(0)
  const socketRef = useRef<unknown>(null)

  // Refresh time display every 30s
  useEffect(() => {
    const interval = setInterval(() => forceUpdate((n) => n + 1), 30_000)
    return () => clearInterval(interval)
  }, [])

  // Socket.io live feed
  useEffect(() => {
    let mounted = true

    async function connectSocket() {
      try {
        const { io } = await import('socket.io-client')
        const token = await getToken()
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

        const socket = io(apiUrl, {
          auth: { token },
          transports: ['websocket', 'polling'],
        })

        socket.on('connect', () => {
          socket.emit('room:join', { teamId, userId: 'viewer', displayName: 'viewer' })
        })

        socket.on('activity:new', (event: ActivityEvent) => {
          if (!mounted || event.teamId !== teamId) return
          setActivities((prev) => [event, ...prev].slice(0, maxItems))
        })

        socketRef.current = socket

        return () => {
          socket.disconnect()
        }
      } catch {
        return () => {}
      }
    }

    const cleanup = connectSocket()
    return () => {
      mounted = false
      cleanup.then((fn) => fn?.())
    }
  }, [teamId, getToken, maxItems])

  // Poll DB for latest activities (fallback + initial load)
  useEffect(() => {
    let mounted = true

    async function poll() {
      try {
        const token = await getToken()
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
        const res = await fetch(`${apiUrl}/api/teams/${teamId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok || !mounted) return
        const data = await res.json() as { team?: { activities: ActivityEvent[] } }
        if (data.team?.activities && mounted) {
          setActivities(data.team.activities.map((a) => ({
            ...a,
            timestamp: new Date(a.createdAt!).getTime(),
          })))
        }
      } catch {
        // ignore
      }
    }

    poll()
    const interval = setInterval(poll, 15_000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [teamId, getToken])

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {activities.length === 0 ? (
        <p className="text-gray-500 text-sm py-4 text-center">No activity yet</p>
      ) : (
        activities.map((event, idx) => {
          const icon = ACTION_ICONS[event.action] ?? ACTION_ICONS.default
          const time = event.timestamp || (event.createdAt ? new Date(event.createdAt).getTime() : Date.now())

          return (
            <div
              key={event.id ?? `${event.userId}-${idx}`}
              className="flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors group"
            >
              <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-300 leading-snug truncate">
                  {event.description}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">{timeAgo(time)}</p>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
