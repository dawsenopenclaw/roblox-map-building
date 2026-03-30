'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { Notification, NotificationType } from '@/app/api/notifications/route'

// ─── Re-export types so consumers can import from this file ──────────────────
export type { Notification, NotificationType }

// ─── Relative time helper ─────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Type config ──────────────────────────────────────────────────────────────

const TYPE_ICON: Record<NotificationType, React.ReactNode> = {
  build: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  achievement: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  sale: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  team: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  system: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

const TYPE_COLOR: Record<NotificationType, string> = {
  build:       'text-blue-400 bg-blue-400/10',
  achievement: 'text-[#D4AF37] bg-[#D4AF37]/10',
  sale:        'text-emerald-400 bg-emerald-400/10',
  team:        'text-purple-400 bg-purple-400/10',
  system:      'text-gray-400 bg-gray-400/10',
}

const UNREAD_DOT: Record<NotificationType, string> = {
  build:       'bg-blue-400',
  achievement: 'bg-[#D4AF37]',
  sale:        'bg-emerald-400',
  team:        'bg-purple-400',
  system:      'bg-gray-400',
}

// ─── Bell icon ────────────────────────────────────────────────────────────────

function IconBell() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  )
}

// ─── Outside click hook ───────────────────────────────────────────────────────

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    function listener(e: MouseEvent) {
      if (!ref.current || ref.current.contains(e.target as Node)) return
      handler()
    }
    document.addEventListener('mousedown', listener)
    return () => document.removeEventListener('mousedown', listener)
  }, [ref, handler])
}

// ─── Dropdown panel ───────────────────────────────────────────────────────────

interface PanelProps {
  notifications: Notification[]
  onMarkAllRead: () => void
  onMarkRead: (id: string) => void
  onDelete: (id: string) => void
  onClose: () => void
}

function NotificationPanel({ notifications, onMarkAllRead, onMarkRead, onDelete, onClose }: PanelProps) {
  const unread = notifications.filter((n) => !n.read)

  return (
    <div
      className="absolute right-0 top-full mt-2 w-[360px] bg-[#111827] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
      style={{
        animation: 'notif-drop-in 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      role="region"
      aria-label="Notifications"
    >
      <style>{`
        @keyframes notif-drop-in {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">Notifications</span>
          {unread.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/20">
              {unread.length} new
            </span>
          )}
        </div>
        {unread.length > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-[11px] text-gray-400 hover:text-[#D4AF37] transition-colors font-medium"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Items */}
      {notifications.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <p className="text-gray-500 text-sm">No notifications</p>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.05] max-h-[400px] overflow-y-auto" role="list">
          {notifications.map((n) => {
            const iconClasses = TYPE_COLOR[n.type]
            const dotClass    = UNREAD_DOT[n.type]

            const inner = (
              <div
                key={n.id}
                role="listitem"
                className={`group relative flex gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.03] ${!n.read ? 'bg-white/[0.02]' : ''}`}
              >
                {/* Type icon */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${iconClasses}`}>
                  {TYPE_ICON[n.type]}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0 pr-5">
                  <div className="flex items-start gap-2">
                    <p className={`text-xs font-semibold leading-tight ${n.read ? 'text-gray-300' : 'text-white'}`}>
                      {n.title}
                    </p>
                    {!n.read && (
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1 ${dotClass}`} aria-label="Unread" />
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{n.description}</p>
                  <p className="text-[10px] text-gray-600 mt-1">{relativeTime(n.timestamp)}</p>
                </div>

                {/* Delete button — shows on hover */}
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(n.id) }}
                  className="absolute top-2.5 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-600 hover:text-red-400 rounded"
                  aria-label="Delete notification"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )

            if (n.href) {
              return (
                <a
                  key={n.id}
                  href={n.href}
                  className="block no-underline"
                  onClick={() => { onMarkRead(n.id); onClose() }}
                >
                  {inner}
                </a>
              )
            }
            return (
              <button
                key={n.id}
                onClick={() => onMarkRead(n.id)}
                className="w-full text-left"
              >
                {inner}
              </button>
            )
          })}
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-white/[0.07] flex items-center justify-between">
        <Link
          href="/settings?tab=notifications"
          onClick={onClose}
          className="text-xs text-[#D4AF37] hover:text-[#D4AF37]/80 transition-colors font-medium py-1"
        >
          View all
        </Link>
        {unread.length > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-xs text-gray-400 hover:text-white transition-colors font-medium py-1"
          >
            Mark all as read
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface NotificationBellProps {
  className?: string
}

export function NotificationBell({ className = '' }: NotificationBellProps) {
  const [open, setOpen]   = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const wrapRef = useRef<HTMLDivElement>(null)

  useClickOutside(wrapRef, () => setOpen(false))

  // Poll every 30 seconds
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications ?? [])
    } catch {
      // Silently fail — nav should not crash over a missed poll
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30_000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleMarkAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      })
    } catch { /* silent */ }
  }, [])

  const handleMarkRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      })
    } catch { /* silent */ }
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    try {
      await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
    } catch { /* silent */ }
  }, [])

  return (
    <div className={`relative flex-shrink-0 ${className}`} ref={wrapRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/[0.05]"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <IconBell />
        {unreadCount > 0 && (
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border border-[#141414]"
            style={{ background: '#D4AF37' }}
            aria-label={`${unreadCount} unread`}
          />
        )}
      </button>

      {open && (
        <NotificationPanel
          notifications={notifications}
          onMarkAllRead={handleMarkAllRead}
          onMarkRead={handleMarkRead}
          onDelete={handleDelete}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}
