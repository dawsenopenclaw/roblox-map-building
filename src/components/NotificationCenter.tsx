'use client'
import { useState, useEffect, useRef } from 'react'

type Notification = {
  id: string
  type: string
  title: string
  body: string
  read: boolean
  actionUrl: string | null
  createdAt: string
}

const TYPE_ICONS: Record<string, string> = {
  BUILD_COMPLETE: '&#9989;',
  BUILD_FAILED: '&#10060;',
  TOKEN_LOW: '&#9888;',
  SALE: '&#128176;',
  REFERRAL_EARNED: '&#127775;',
  SYSTEM: '&#8505;',
  WEEKLY_DIGEST: '&#128200;',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

  useEffect(() => {
    fetchNotifications()
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  async function fetchNotifications() {
    try {
      const res = await fetch(`${API_BASE}/api/notifications?limit=20`, {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch {
      // Silent fail — notification center is non-critical
    }
  }

  async function markRead(id: string) {
    const notification = notifications.find((n) => n.id === id)
    if (!notification || notification.read) return

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    setUnreadCount((c) => Math.max(0, c - 1))

    await fetch(`${API_BASE}/api/notifications/${id}/read`, {
      method: 'PUT',
      credentials: 'include',
    }).catch(() => {})
  }

  async function markAllRead() {
    setLoading(true)
    try {
      await fetch(`${API_BASE}/api/notifications/read-all`, {
        method: 'PUT',
        credentials: 'include',
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }

  function handleNotificationClick(notification: Notification) {
    markRead(notification.id)
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[#FFB81C] text-black text-[10px] font-bold rounded-full flex items-center justify-center px-1"
            aria-hidden="true"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#0D1231] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
          role="region"
          aria-label="Notifications"
          aria-live="polite"
          aria-atomic="false"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <h3 className="text-white font-semibold text-sm" id="notif-center-heading">Notifications</h3>
              {unreadCount > 0 && (
                <span
                  className="text-xs bg-[#FFB81C]/10 text-[#FFB81C] border border-[#FFB81C]/20 px-1.5 py-0.5 rounded-full"
                  aria-label={`${unreadCount} unread`}
                >
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={loading}
                className="text-xs text-gray-400 hover:text-white transition-colors"
                aria-label="Mark all notifications as read"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-96 overflow-y-auto" role="list" aria-labelledby="notif-center-heading">
            {notifications.length === 0 ? (
              <div className="py-12 text-center" role="listitem">
                <div className="text-3xl mb-3" aria-hidden="true">&#128276;</div>
                <p className="text-gray-500 text-sm">All caught up!</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  role="listitem"
                  aria-label={`${n.read ? '' : 'Unread: '}${n.title}. ${n.body}. ${timeAgo(n.createdAt)}`}
                  className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors ${
                    !n.read ? 'bg-[#FFB81C]/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="text-lg flex-shrink-0 mt-0.5"
                      aria-hidden="true"
                      dangerouslySetInnerHTML={{ __html: TYPE_ICONS[n.type] ?? '&#8505;' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium truncate ${n.read ? 'text-gray-300' : 'text-white'}`}>
                          {n.title}
                        </p>
                        {!n.read && (
                          // Dot is decorative — status is conveyed by aria-label above
                          <div className="w-2 h-2 rounded-full bg-[#FFB81C] flex-shrink-0 mt-1" aria-hidden="true" />
                        )}
                      </div>
                      <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-gray-600 text-xs mt-1">
                        <time dateTime={new Date(n.createdAt).toISOString()}>{timeAgo(n.createdAt)}</time>
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-white/10">
            <a
              href="/settings"
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Notification preferences
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
