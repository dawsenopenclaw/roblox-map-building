'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { useUser } from '@clerk/nextjs'
import { ShortcutHint } from '@/components/ShortcutHint'

const fetcher = (url: string) => fetch(url).then(r => r.json())

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconMenu() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}
function IconSearch() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}
function IconCoin() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" strokeWidth={1.75} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 7v1m0 8v1M9.5 9.5A2.5 2.5 0 0112 8a2.5 2.5 0 010 5 2.5 2.5 0 000 5 2.5 2.5 0 002.5-1.5" />
    </svg>
  )
}
function IconBell() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  )
}
function IconPlus() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  )
}
function IconChevronDown() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}
function IconSettings() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  )
}
function IconBilling() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  )
}
function IconSignOut() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )
}

// ─── Notifications dropdown ───────────────────────────────────────────────────

const NOTIFICATIONS = [
  {
    id: 1,
    text: 'Your voice build completed',
    time: '2m ago',
    unread: true,
  },
  {
    id: 2,
    text: 'Monthly tokens refreshed',
    time: '1d ago',
    unread: false,
  },
  {
    id: 3,
    text: 'New asset pack available in Marketplace',
    time: '2d ago',
    unread: false,
  },
]

function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const unreadCount = NOTIFICATIONS.filter((n) => n.unread).length

  return (
    <div
      className="absolute right-0 top-full mt-2 w-80 bg-[#1A2235] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
      role="region"
      aria-label="Notifications"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
        <p className="text-sm font-semibold text-white">Notifications</p>
        {unreadCount > 0 && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-400/15 text-blue-400 border border-blue-400/20">
            {unreadCount} new
          </span>
        )}
      </div>

      {/* Items */}
      <div className="divide-y divide-white/[0.05]" role="list">
        {NOTIFICATIONS.map((n) => (
          <div
            key={n.id}
            role="listitem"
            className={`flex gap-3 px-4 py-3 text-xs transition-colors hover:bg-white/[0.03] ${n.unread ? 'bg-blue-400/[0.04]' : ''}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${n.unread ? 'bg-blue-400' : 'bg-gray-700'}`} aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className={n.unread ? 'text-white' : 'text-gray-300'}>{n.text}</p>
              <p className="text-gray-500 mt-0.5">{n.time}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-white/[0.07]">
        <button
          onClick={onClose}
          className="w-full text-center text-xs text-[#D4AF37] hover:text-[#D4AF37]/80 transition-colors font-medium py-1"
        >
          Mark all as read
        </button>
      </div>
    </div>
  )
}

// ─── User dropdown ────────────────────────────────────────────────────────────

function UserMenu({ displayName, email }: { displayName: string; email: string }) {
  return (
    <div
      className="absolute right-0 top-full mt-2 w-52 bg-[#1A2235] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
      role="menu"
      aria-label="User menu"
    >
      {/* Identity */}
      <div className="px-4 py-3 border-b border-white/[0.07]">
        <p className="text-sm font-semibold text-white truncate">{displayName}</p>
        <p className="text-xs text-gray-400 truncate">{email}</p>
      </div>

      {/* Links */}
      <div className="py-1">
        <Link
          href="/settings"
          role="menuitem"
          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-blue-400 hover:bg-white/[0.05] transition-colors"
        >
          <span className="text-gray-400 group-hover:text-blue-400"><IconSettings /></span>
          Settings
        </Link>
        <Link
          href="/billing"
          role="menuitem"
          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-blue-400 hover:bg-white/[0.05] transition-colors"
        >
          <span className="text-gray-400 group-hover:text-blue-400"><IconBilling /></span>
          Billing
        </Link>
      </div>

      {/* Divider + sign out */}
      <div className="border-t border-white/[0.07] py-1">
        <Link
          href="/sign-in"
          role="menuitem"
          className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-white/[0.05] transition-colors"
        >
          <span className="text-red-500"><IconSignOut /></span>
          Sign out
        </Link>
      </div>
    </div>
  )
}

// ─── Hook: close on outside click ────────────────────────────────────────────

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

// ─── Main component ───────────────────────────────────────────────────────────

interface AppTopNavProps {
  onMenuOpen: () => void
  onCommandPalette?: () => void
}

export function AppTopNav({ onMenuOpen, onCommandPalette }: AppTopNavProps) {
  const { data } = useSWR('/api/tokens/balance', fetcher, { refreshInterval: 30_000 })
  const { user } = useUser()
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`
    : user?.username ?? 'Demo User'

  const email = user?.emailAddresses?.[0]?.emailAddress ?? 'demo@forjegames.com'

  const initials = user?.firstName
    ? `${user.firstName[0]}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : (user?.username?.[0]?.toUpperCase() ?? 'FG')

  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  useClickOutside(notifRef, () => setNotifOpen(false))
  useClickOutside(profileRef, () => setProfileOpen(false))

  const tokenBalance = data?.balance !== undefined ? data.balance.toLocaleString() : '—'
  const unreadCount = NOTIFICATIONS.filter((n) => n.unread).length

  return (
    <header className="h-14 bg-[#141414] border-b border-white/[0.07] flex items-center px-4 gap-3 sticky top-0 z-30 flex-shrink-0">
      {/* Hamburger (mobile) */}
      <button
        onClick={onMenuOpen}
        className="lg:hidden p-2 -ml-1 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/[0.05]"
        aria-label="Open navigation menu"
      >
        <IconMenu />
      </button>

      {/* Search bar — opens command palette */}
      <div className="flex-1 max-w-md hidden sm:block">
        <button
          onClick={onCommandPalette}
          className="w-full flex items-center gap-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg pl-3 pr-2 py-2 text-sm text-gray-400 hover:border-blue-400/30 hover:bg-white/[0.06] hover:text-gray-300 transition-all duration-150 text-left group"
          aria-label="Search (Ctrl+K)"
        >
          <span className="text-gray-500 group-hover:text-gray-300 transition-colors flex-shrink-0">
            <IconSearch />
          </span>
          <span className="flex-1 text-gray-500">Search anything…</span>
          <ShortcutHint keys="Ctrl+K" className="opacity-60" />
        </button>
      </div>

      {/* Spacer on mobile */}
      <div className="flex-1 sm:hidden" />

      {/* New Project */}
      <Link
        href="/voice"
        className="hidden sm:inline-flex items-center gap-1.5 bg-[#D4AF37] hover:bg-[#D4AF37]/90 active:scale-95 text-[#0a0a0a] text-xs font-bold rounded-lg px-3 py-2 transition-all duration-150 flex-shrink-0"
        aria-label="New project (Ctrl+N)"
      >
        <IconPlus />
        New
        <ShortcutHint keys="Ctrl+N" className="opacity-60" />
      </Link>

      {/* Token balance */}
      <div
        className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 flex-shrink-0"
        role="status"
        aria-label={`Token balance: ${tokenBalance} tokens`}
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="text-blue-400 flex-shrink-0" aria-hidden="true">
          <IconCoin />
        </span>
        <span className="text-blue-400 text-sm font-bold tabular-nums" aria-hidden="true">
          {tokenBalance}
        </span>
        <span className="text-gray-500 text-xs hidden md:block" aria-hidden="true">tokens</span>
      </div>

      {/* Notification bell */}
      <div className="relative flex-shrink-0" ref={notifRef}>
        <button
          onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false) }}
          className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/[0.05]"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
          aria-expanded={notifOpen}
          aria-haspopup="true"
        >
          <IconBell />
          {unreadCount > 0 && (
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border border-[#141414]"
              style={{ background: '#D4AF37' }}
              aria-hidden="true"
            />
          )}
        </button>
        {notifOpen && <NotificationsPanel onClose={() => setNotifOpen(false)} />}
      </div>

      {/* User avatar + dropdown */}
      <div className="relative flex-shrink-0" ref={profileRef}>
        <button
          onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false) }}
          className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-white/[0.05] transition-colors group"
          aria-label="User menu"
          aria-expanded={profileOpen}
          aria-haspopup="menu"
        >
          {/* Avatar circle */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs select-none flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #B8962E 100%)',
              color: '#0a0a0a',
            }}
            aria-hidden="true"
          >
            {initials}
          </div>
          <span className="text-gray-500 group-hover:text-gray-300 transition-colors hidden sm:block">
            <IconChevronDown />
          </span>
        </button>
        {profileOpen && <UserMenu displayName={displayName} email={email} />}
      </div>
    </header>
  )
}
