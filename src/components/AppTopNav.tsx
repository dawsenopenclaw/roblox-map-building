'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { useUser } from '@clerk/nextjs'
import { ShortcutHint } from '@/components/ShortcutHint'
import { NotificationBell } from '@/components/NotificationBell'
import { useTheme } from '@/components/ThemeProvider'

const fetcher = (url: string) => fetch(url).then(r => r.json())

// ─── Keyframes ────────────────────────────────────────────────────────────────

const NAV_KEYFRAMES = `
  @keyframes fj-btn-pulse {
    0%, 100% { box-shadow: 0 0 10px rgba(212,175,55,0.20), 0 0 0px rgba(212,175,55,0); }
    50%       { box-shadow: 0 0 18px rgba(212,175,55,0.40), 0 0 6px rgba(212,175,55,0.15); }
  }
  @keyframes fj-spark-orbit {
    0%   { transform: rotate(0deg)   translateX(5px) scale(1);   opacity: 0.9; }
    50%  { transform: rotate(180deg) translateX(5px) scale(1.2); opacity: 1; }
    100% { transform: rotate(360deg) translateX(5px) scale(1);   opacity: 0.9; }
  }
  @media (prefers-reduced-motion: reduce) {
    .fj-btn-pulse { animation: none !important; }
    .fj-spark     { animation: none !important; }
  }
`

function useNavKeyframesOnce() {
  useEffect(() => {
    if (typeof document === 'undefined') return
    const id = 'fj-topnav-keyframes'
    if (document.getElementById(id)) return
    const style = document.createElement('style')
    style.id = id
    style.textContent = NAV_KEYFRAMES
    document.head.appendChild(style)
  }, [])
}

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

// Gold spark icon for token balance
function IconSpark() {
  return (
    <svg
      className="fj-spark w-3 h-3 flex-shrink-0"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      style={{ animation: 'fj-spark-orbit 3s linear infinite' }}
    >
      <path
        d="M6 1L7.2 4.8H11L7.9 7.1L9.1 11L6 8.7L2.9 11L4.1 7.1L1 4.8H4.8L6 1Z"
        fill="#D4AF37"
        fillOpacity="0.9"
      />
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
function IconSun() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" strokeWidth={1.75} />
      <path strokeLinecap="round" strokeWidth={1.75} d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  )
}
function IconMoon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
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

// ─── User dropdown ────────────────────────────────────────────────────────────

function UserMenu({ displayName, email, onSignOut }: { displayName: string; email: string; onSignOut: () => void }) {
  return (
    <div
      className="absolute right-0 top-full mt-2 w-52 rounded-xl shadow-2xl z-50 overflow-hidden border"
      style={{ background: 'var(--surface)', borderColor: 'var(--border-subtle)' }}
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
          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-[#D4AF37] hover:bg-white/[0.05] transition-colors"
        >
          <span className="text-gray-400"><IconSettings /></span>
          Account
        </Link>
        <Link
          href="/settings?tab=billing"
          role="menuitem"
          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-[#D4AF37] hover:bg-white/[0.05] transition-colors"
        >
          <span className="text-gray-400"><IconBilling /></span>
          Billing
        </Link>
      </div>

      {/* Divider + sign out */}
      <div className="border-t border-white/[0.07] py-1">
        <button
          onClick={onSignOut}
          role="menuitem"
          className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-white/[0.05] transition-colors w-full"
        >
          <span className="text-red-500"><IconSignOut /></span>
          Sign out
        </button>
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
  useNavKeyframesOnce()

  const { data } = useSWR('/api/tokens/balance', fetcher, { refreshInterval: 30_000 })
  const { user } = useUser()
  const [searchFocused, setSearchFocused] = useState(false)

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`
    : user?.username ?? 'Demo User'

  const email = user?.emailAddresses?.[0]?.emailAddress ?? 'demo@forjegames.com'

  const initials = user?.firstName
    ? `${user.firstName[0]}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : (user?.username?.[0]?.toUpperCase() ?? 'FG')

  const { theme, setTheme } = useTheme()
  const isLight = theme.id === 'light' || theme.id === 'paper'

  const tokenBalance = data?.balance !== undefined ? data.balance.toLocaleString() : '—'

  return (
    <header
      className="h-14 border-b flex items-center px-4 gap-3 sticky top-0 z-30 flex-shrink-0"
      style={{ background: 'var(--surface)', borderColor: 'var(--border-subtle)' }}
    >
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
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="w-full flex items-center gap-2.5 bg-white/[0.04] border rounded-lg pl-3 pr-2 py-2 text-sm text-gray-400 hover:bg-white/[0.06] hover:text-gray-300 transition-all duration-200 text-left group"
          style={{
            borderColor: searchFocused ? 'rgba(212,175,55,0.45)' : 'rgba(255,255,255,0.08)',
            boxShadow: searchFocused ? '0 0 0 2px rgba(212,175,55,0.12), 0 0 12px rgba(212,175,55,0.08)' : 'none',
          }}
          aria-label="Search (Ctrl+K)"
        >
          <span
            className="flex-shrink-0 transition-colors"
            style={{ color: searchFocused ? '#D4AF37' : undefined }}
          >
            <IconSearch />
          </span>
          <span className="flex-1 text-gray-500">Search anything…</span>
          <ShortcutHint keys="Ctrl+K" className="opacity-60" />
        </button>
      </div>

      {/* Spacer on mobile */}
      <div className="flex-1 sm:hidden" />

      {/* Build CTA — subtle pulse glow to stay "alive" */}
      <Link
        href="/editor"
        className="fj-btn-pulse hidden sm:inline-flex items-center gap-1.5 nav-cta-gold active:scale-95 text-[#0a0a0a] text-xs font-bold rounded-lg px-3 py-2 flex-shrink-0 hover:-translate-y-0.5"
        style={{
          background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%)',
          animation: 'fj-btn-pulse 3s ease-in-out infinite',
          transition: 'transform 150ms ease',
        }}
        aria-label="Open editor (Ctrl+N)"
      >
        <IconPlus />
        Build
        <ShortcutHint keys="Ctrl+N" className="opacity-60" />
      </Link>

      {/* Token balance + upgrade CTA */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div
          className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2"
          role="status"
          aria-label={`Token balance: ${tokenBalance} tokens`}
          aria-live="polite"
          aria-atomic="true"
        >
          {/* Animated gold spark icon instead of plain coin */}
          <span className="flex-shrink-0 relative" aria-hidden="true">
            <IconSpark />
          </span>
          <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--gold)' }} aria-hidden="true">
            {tokenBalance}
          </span>
          <span className="text-gray-500 text-xs hidden md:block" aria-hidden="true">tokens</span>
        </div>

        {/* Show upgrade pill when balance is low */}
        {data?.balance !== undefined && data.balance < 100 && (
          <Link
            href="/billing"
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#D4AF37] transition-colors"
          >
            Upgrade
          </Link>
        )}
      </div>

      {/* Notification bell */}
      <NotificationBell />

      {/* Theme toggle — Sun = switch to light, Moon = switch to dark */}
      <button
        onClick={() => setTheme(isLight ? 'default' : 'light')}
        className="p-2 rounded-lg transition-colors flex-shrink-0"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
        title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      >
        {isLight ? <IconMoon /> : <IconSun />}
      </button>

      {/* Profile handled by global ProfileButton in root layout */}
      {/* Spacer to keep right padding consistent */}
      <div className="w-10 flex-shrink-0" />
    </header>
  )
}
