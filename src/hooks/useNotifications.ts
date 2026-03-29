'use client'

/**
 * useNotifications — real-time notification state via SSE with polling fallback.
 *
 * Behaviour:
 *  - Opens an SSE connection to /api/notifications/stream
 *  - Falls back to 30s polling when EventSource is unsupported or connection fails
 *  - Manages local notification list + unread count
 *  - Exposes markAsRead, markAllAsRead, dismiss
 *  - Plays a subtle sound on new notification (if user preference allows)
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Notification {
  id: string
  type: string
  title: string
  body: string
  read: boolean
  actionUrl: string | null
  createdAt: string
}

interface NotificationsState {
  notifications: Notification[]
  unreadCount: number
  connected: boolean
  loading: boolean
  error: string | null
}

interface UseNotificationsReturn extends NotificationsState {
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  dismiss: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

// ─── Constants ────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 30_000
const SSE_RECONNECT_DELAY_MS = 3_000
const MAX_RECONNECT_ATTEMPTS = 5

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNotifications(opts?: {
  soundEnabled?: boolean
}): UseNotificationsReturn {
  const { soundEnabled = false } = opts ?? {}
  const { getToken, isSignedIn } = useAuth()

  const [state, setState] = useState<NotificationsState>({
    notifications: [],
    unreadCount: 0,
    connected: false,
    loading: false,
    error: null,
  })

  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

  // Refs to manage lifecycle without triggering re-renders
  const esRef = useRef<EventSource | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const lastEventIdRef = useRef<string | null>(null)
  const mountedRef = useRef(true)

  // ── Audio ──────────────────────────────────────────────────────────────────

  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return
    try {
      // Use Web Audio API for a subtle ping — no external asset needed
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.3)
    } catch {
      // AudioContext unavailable — silently skip
    }
  }, [soundEnabled])

  // ── REST fetch ─────────────────────────────────────────────────────────────

  const fetchNotifications = useCallback(async () => {
    if (!isSignedIn) return
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const token = await getToken()
      const res = await fetch(`${API_BASE}/api/notifications?limit=30`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (mountedRef.current) {
        setState((s) => ({
          ...s,
          notifications: data.notifications ?? [],
          unreadCount: data.unreadCount ?? 0,
          loading: false,
          error: null,
        }))
      }
    } catch (err) {
      if (mountedRef.current) {
        setState((s) => ({
          ...s,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to load notifications',
        }))
      }
    }
  }, [API_BASE, getToken, isSignedIn])

  // ── Polling fallback ───────────────────────────────────────────────────────

  const startPolling = useCallback(() => {
    if (pollRef.current) return
    pollRef.current = setInterval(fetchNotifications, POLL_INTERVAL_MS)
  }, [fetchNotifications])

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  // ── SSE connection ─────────────────────────────────────────────────────────

  const connectSSE = useCallback(async () => {
    if (!isSignedIn || typeof EventSource === 'undefined') {
      startPolling()
      return
    }

    // Tear down existing connection
    if (esRef.current) {
      esRef.current.close()
      esRef.current = null
    }

    try {
      const token = await getToken()
      if (!token) {
        startPolling()
        return
      }

      // SSE with bearer token via URL param (EventSource doesn't support custom headers)
      const url = new URL(`${API_BASE}/api/notifications/stream`)
      // We pass the token as a query param — the SSE route accepts it
      url.searchParams.set('token', token)
      if (lastEventIdRef.current) {
        url.searchParams.set('lastEventId', lastEventIdRef.current)
      }

      const es = new EventSource(url.toString())
      esRef.current = es

      es.addEventListener('connected', () => {
        if (!mountedRef.current) return
        reconnectAttemptsRef.current = 0
        setState((s) => ({ ...s, connected: true, error: null }))
        stopPolling()
      })

      es.addEventListener('notification', (e: MessageEvent) => {
        if (!mountedRef.current) return
        try {
          const notif: Notification = JSON.parse(e.data)
          lastEventIdRef.current = e.lastEventId || null
          setState((s) => {
            // Avoid duplicates
            const exists = s.notifications.some((n) => n.id === notif.id)
            if (exists) return s
            playNotificationSound()
            return {
              ...s,
              notifications: [notif, ...s.notifications].slice(0, 50),
              unreadCount: s.unreadCount + (notif.read ? 0 : 1),
            }
          })
        } catch {
          // Malformed event
        }
      })

      es.addEventListener('ping', () => {
        // Heartbeat received — connection healthy
      })

      es.onerror = () => {
        if (!mountedRef.current) return
        es.close()
        esRef.current = null
        setState((s) => ({ ...s, connected: false }))

        const attempts = reconnectAttemptsRef.current
        if (attempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current += 1
          const delay = SSE_RECONNECT_DELAY_MS * Math.pow(1.5, attempts)
          reconnectTimeoutRef.current = setTimeout(connectSSE, delay)
        } else {
          // Give up on SSE, fall back to polling
          startPolling()
        }
      }
    } catch {
      startPolling()
    }
  }, [API_BASE, getToken, isSignedIn, startPolling, stopPolling, playNotificationSound])

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true
    if (!isSignedIn) return

    fetchNotifications()
    connectSSE()

    return () => {
      mountedRef.current = false
      esRef.current?.close()
      esRef.current = null
      stopPolling()
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn])

  // ── Actions ────────────────────────────────────────────────────────────────

  const markAsRead = useCallback(
    async (id: string) => {
      setState((s) => {
        const notif = s.notifications.find((n) => n.id === id)
        if (!notif || notif.read) return s
        return {
          ...s,
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
          unreadCount: Math.max(0, s.unreadCount - 1),
        }
      })
      try {
        const token = await getToken()
        await fetch(`${API_BASE}/api/notifications/${id}/read`, {
          method: 'PUT',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: 'include',
        })
      } catch {
        // Optimistic update already applied — silently ignore
      }
    },
    [API_BASE, getToken]
  )

  const markAllAsRead = useCallback(async () => {
    setState((s) => ({
      ...s,
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }))
    try {
      const token = await getToken()
      await fetch(`${API_BASE}/api/notifications/read-all`, {
        method: 'PUT',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      })
    } catch {
      // Optimistic update already applied
    }
  }, [API_BASE, getToken])

  const dismiss = useCallback(
    async (id: string) => {
      setState((s) => {
        const notif = s.notifications.find((n) => n.id === id)
        const wasUnread = notif && !notif.read
        return {
          ...s,
          notifications: s.notifications.filter((n) => n.id !== id),
          unreadCount: wasUnread ? Math.max(0, s.unreadCount - 1) : s.unreadCount,
        }
      })
      try {
        const token = await getToken()
        await fetch(`${API_BASE}/api/notifications/${id}`, {
          method: 'DELETE',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: 'include',
        })
      } catch {
        // Optimistic update already applied
      }
    },
    [API_BASE, getToken]
  )

  return {
    ...state,
    markAsRead,
    markAllAsRead,
    dismiss,
    refresh: fetchNotifications,
  }
}
