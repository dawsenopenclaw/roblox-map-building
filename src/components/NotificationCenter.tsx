'use client'

/**
 * NotificationCenter — enhanced with real-time SSE, date grouping,
 * swipe-to-dismiss on mobile, mark-all-read, and notification preferences link.
 *
 * Resilience: wrapped in SilentBoundary so any internal crash renders nothing
 * rather than breaking the nav bar.
 */

import { useState, useRef, useCallback } from 'react'
import { useNotifications, type Notification } from '../hooks/useNotifications'
import { SilentBoundary } from './ErrorBoundary'

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<string, string> = {
  BUILD_COMPLETE: '&#9989;',
  BUILD_FAILED: '&#10060;',
  TOKEN_LOW: '&#9888;&#65039;',
  TOKEN_DEPLETED: '&#128683;',
  SALE: '&#128176;',
  REFERRAL_EARNED: '&#127775;',
  TEAM_INVITE: '&#128101;',
  ACHIEVEMENT_UNLOCKED: '&#127942;',
  SYSTEM: '&#8505;&#65039;',
  WEEKLY_DIGEST: '&#128200;',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

type DateGroup = 'Today' | 'Yesterday' | 'This Week' | 'Older'

function getDateGroup(dateStr: string): DateGroup {
  const now = new Date()
  const date = new Date(dateStr)
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000)
  if (diffDays < 1) return 'Today'
  if (diffDays < 2) return 'Yesterday'
  if (diffDays < 7) return 'This Week'
  return 'Older'
}

function groupNotifications(
  notifications: Notification[]
): Array<{ group: DateGroup; items: Notification[] }> {
  const groups: Record<DateGroup, Notification[]> = {
    Today: [],
    Yesterday: [],
    'This Week': [],
    Older: [],
  }
  for (const n of notifications) {
    groups[getDateGroup(n.createdAt)].push(n)
  }
  const order: DateGroup[] = ['Today', 'Yesterday', 'This Week', 'Older']
  return order
    .filter((g) => groups[g].length > 0)
    .map((g) => ({ group: g, items: groups[g] }))
}

// ─── Swipeable notification row ───────────────────────────────────────────────

function SwipeableNotification({
  notification,
  onClick,
  onDismiss,
}: {
  notification: Notification
  onClick: () => void
  onDismiss: () => void
}) {
  const startXRef = useRef<number | null>(null)
  const [translateX, setTranslateX] = useState(0)
  const [dismissing, setDismissing] = useState(false)

  const SWIPE_THRESHOLD = 80 // px to trigger dismiss

  const onTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (startXRef.current === null) return
    const delta = e.touches[0].clientX - startXRef.current
    // Only allow swipe left
    if (delta < 0) setTranslateX(delta)
  }

  const onTouchEnd = () => {
    if (translateX < -SWIPE_THRESHOLD) {
      setDismissing(true)
      setTranslateX(-400)
      setTimeout(onDismiss, 250)
    } else {
      setTranslateX(0)
    }
    startXRef.current = null
  }

  const n = notification

  return (
    <div
      className="relative overflow-hidden"
      style={{ opacity: dismissing ? 0 : 1, transition: 'opacity 0.25s' }}
    >
      {/* Dismiss hint shown on swipe */}
      <div className="absolute inset-y-0 right-0 flex items-center px-4 bg-red-500/20 text-red-400 text-xs pointer-events-none">
        Dismiss
      </div>

      <button
        onClick={onClick}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        role="listitem"
        aria-label={`${n.read ? '' : 'Unread: '}${n.title}. ${n.body}. ${timeAgo(n.createdAt)}`}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: translateX === 0 || dismissing ? 'transform 0.2s' : 'none',
        }}
        className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors ${
          !n.read ? 'bg-[#FFB81C]/5' : ''
        }`}
      >
        <div className="flex items-start gap-3">
          <span
            className="text-lg flex-shrink-0 mt-0.5"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: TYPE_ICONS[n.type] ?? '&#8505;&#65039;' }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className={`text-sm font-medium truncate ${n.read ? 'text-gray-300' : 'text-white'}`}>
                {n.title}
              </p>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {!n.read && (
                  <div
                    className="w-2 h-2 rounded-full bg-[#FFB81C]"
                    aria-hidden="true"
                  />
                )}
                {/* Desktop dismiss button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDismiss()
                  }}
                  className="hidden sm:flex w-5 h-5 items-center justify-center rounded text-gray-500 hover:text-gray-300 hover:bg-white/10 transition-colors"
                  aria-label={`Dismiss: ${n.title}`}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <line x1="1" y1="1" x2="9" y2="9" />
                    <line x1="9" y1="1" x2="1" y2="9" />
                  </svg>
                </button>
              </div>
            </div>
            <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{n.body}</p>
            <p className="text-gray-500 text-xs mt-1">
              <time dateTime={new Date(n.createdAt).toISOString()}>
                {timeAgo(n.createdAt)}
              </time>
            </p>
          </div>
        </div>
      </button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

function NotificationCenterInner() {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const {
    notifications,
    unreadCount,
    connected,
    loading,
    markAsRead,
    markAllAsRead,
    dismiss,
  } = useNotifications({ soundEnabled: false })

  const handleNotificationClick = useCallback(
    (n: Notification) => {
      markAsRead(n.id)
      if (n.actionUrl) {
        window.location.href = n.actionUrl
      }
    },
    [markAsRead]
  )

  const grouped = groupNotifications(notifications)

  // Close on outside click
  const handlePanelRef = (el: HTMLDivElement | null) => {
    ;(panelRef as React.MutableRefObject<HTMLDivElement | null>).current = el
  }

  return (
    <div className="relative" ref={handlePanelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center text-gray-300 hover:text-blue-400 hover:bg-white/5 transition-colors"
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : 'Notifications'
        }
        aria-expanded={open}
        aria-haspopup="true"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Live indicator dot when SSE connected */}
        {connected && (
          <span
            className="absolute top-1 right-1 w-1.5 h-1.5 bg-green-500 rounded-full"
            aria-hidden="true"
            title="Real-time connected"
          />
        )}

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
        <>
          {/* Overlay to catch outside clicks */}
          <div
            className="fixed inset-0 z-40"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />

          <div
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#141414] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
            role="region"
            aria-label="Notifications"
            aria-live="polite"
            aria-atomic="false"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <h3
                  className="text-white font-semibold text-sm"
                  id="notif-center-heading"
                >
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span
                    className="text-xs bg-[#FFB81C]/10 text-[#FFB81C] border border-[#FFB81C]/20 px-1.5 py-0.5 rounded-full"
                    aria-label={`${unreadCount} unread`}
                  >
                    {unreadCount}
                  </span>
                )}
                {loading && (
                  <span className="w-3 h-3 border border-white/20 border-t-white/60 rounded-full animate-spin" aria-hidden="true" />
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-gray-300 hover:text-blue-400 transition-colors"
                  aria-label="Mark all notifications as read"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notification list */}
            <div
              className="max-h-[440px] overflow-y-auto overscroll-contain"
              role="list"
              aria-labelledby="notif-center-heading"
            >
              {notifications.length === 0 ? (
                <div className="py-12 text-center" role="listitem">
                  <div className="text-3xl mb-3" aria-hidden="true">
                    &#128276;
                  </div>
                  <p className="text-gray-400 text-sm">All caught up!</p>
                </div>
              ) : (
                grouped.map(({ group, items }) => (
                  <div key={group}>
                    {/* Date group label */}
                    <div className="px-4 py-1.5 bg-white/3 border-b border-white/5">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                        {group}
                      </span>
                    </div>

                    {items.map((n) => (
                      <SwipeableNotification
                        key={n.id}
                        notification={n}
                        onClick={() => handleNotificationClick(n)}
                        onDismiss={() => dismiss(n.id)}
                      />
                    ))}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between">
              <a
                href="/settings"
                className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
              >
                Notification preferences
              </a>
              {connected ? (
                <span className="flex items-center gap-1 text-[10px] text-green-500/70">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" aria-hidden="true" />
                  Live
                </span>
              ) : (
                <span className="text-[10px] text-gray-500">Polling</span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Exported wrapper with silent error boundary ───────────────────────────────

export function NotificationCenter() {
  return (
    <SilentBoundary>
      <NotificationCenterInner />
    </SilentBoundary>
  )
}
