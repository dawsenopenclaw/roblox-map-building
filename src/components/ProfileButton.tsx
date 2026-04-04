'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useAuth, useUser, useClerk } from '@clerk/nextjs'
import { usePathname } from 'next/navigation'
import { useTheme } from '@/components/ThemeProvider'

const HIDDEN_PATHS = ['/sign-in', '/sign-up', '/onboarding', '/editor']
const ADMIN_EMAILS = ['dawsenporter@gmail.com']

export function ProfileButton() {
  const { isSignedIn, isLoaded } = useAuth()
  const { user } = useUser()
  const { signOut } = useClerk()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { theme, themes, setTheme } = useTheme()

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Clamp dropdown inside viewport
  const clampDropdown = useCallback(() => {
    if (!dropdownRef.current) return
    const el = dropdownRef.current
    const rect = el.getBoundingClientRect()
    const viewH = window.innerHeight
    const viewW = window.innerWidth

    // Clamp height so it doesn't overflow bottom
    const maxH = viewH - rect.top - 12
    if (maxH > 0 && maxH < rect.height) {
      el.style.maxHeight = `${maxH}px`
      el.style.overflowY = 'auto'
    }

    // If it overflows left (half screen), shift it
    if (rect.left < 8) {
      el.style.right = 'auto'
      el.style.left = `${-rect.left + 8}px`
    }

    // If it overflows right
    if (rect.right > viewW - 8) {
      el.style.right = '0'
    }
  }, [])

  useEffect(() => {
    if (open) {
      // Clamp after render
      requestAnimationFrame(clampDropdown)
      window.addEventListener('resize', clampDropdown)
      return () => window.removeEventListener('resize', clampDropdown)
    }
  }, [open, clampDropdown])

  if (!isLoaded || !isSignedIn) return null
  if (HIDDEN_PATHS.some((p) => pathname.startsWith(p))) return null

  const name = user?.fullName || user?.firstName || user?.username || 'User'
  const email = user?.primaryEmailAddress?.emailAddress || ''
  const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase())
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  const imageUrl = user?.imageUrl

  const links = [
    { href: '/settings', label: 'Profile & Settings', icon: 'M12 15a3 3 0 100-6 3 3 0 000 6z', adminOnly: false },
    { href: '/settings?tab=appearance', label: 'Appearance', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-1 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-4.96-4.49-9-10-9z', adminOnly: false },
    { href: '/settings?tab=notifications', label: 'Notifications', icon: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9', adminOnly: false },
    { href: '/billing', label: 'Billing', icon: 'M2 5h20v14H2z', adminOnly: false },
    { href: '/admin', label: 'Admin Dashboard', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2z', adminOnly: true },
    { href: '/admin/dev-board', label: 'Dev Board', icon: 'M3 3v18h18', adminOnly: true },
  ].filter((link) => !link.adminOnly || isAdmin)

  return (
    <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-[9999]" ref={ref}>
      {/* Avatar button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="group relative"
        aria-label="Profile menu"
        aria-expanded={open}
      >
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden ring-2 ring-[var(--gold,#D4AF37)]/30 hover:ring-[var(--gold,#D4AF37)]/60 transition-all shadow-lg">
          {imageUrl ? (
            <img src={imageUrl} alt={name} width={40} height={40} className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center font-bold text-xs"
              style={{ background: 'linear-gradient(135deg, var(--gold, #D4AF37) 0%, #B8962E 100%)', color: '#0a0a0a' }}
            >
              {initials}
            </div>
          )}
        </div>
        {/* Online dot */}
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-400 border-2 border-[var(--background,#050810)] rounded-full" />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full mt-2 w-[calc(100vw-1.5rem)] max-w-[260px] sm:w-64 bg-[#111113] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
          style={{
            animation: 'pb-drop-in 0.15s ease',
            maxHeight: 'calc(100vh - 60px)',
            overflowY: 'auto',
          }}
        >
          {/* Profile header */}
          <div className="px-3 py-2.5 sm:px-4 sm:py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden flex-shrink-0">
                {imageUrl ? (
                  <img src={imageUrl} alt={name} width={36} height={36} className="w-full h-full object-cover" />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center font-bold text-xs"
                    style={{ background: 'linear-gradient(135deg, var(--gold, #D4AF37) 0%, #B8962E 100%)', color: '#0a0a0a' }}
                  >
                    {initials}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{name}</p>
                <p className="text-[11px] text-gray-500 truncate">{email}</p>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="py-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-1.5 sm:px-4 sm:py-2 text-sm text-gray-300 hover:text-white hover:bg-white/[0.04] transition-colors"
              >
                <svg className="w-4 h-4 flex-shrink-0 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} />
                </svg>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Quick Theme */}
          <div className="border-t border-white/[0.06] px-3 py-2 sm:px-4">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">Quick Theme</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {themes.slice(0, 8).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  title={t.name}
                  className="w-5 h-5 rounded-full flex-shrink-0 transition-transform hover:scale-110 focus:outline-none"
                  style={{
                    background: t.preview.accent,
                    boxShadow: theme.id === t.id
                      ? '0 0 0 2px #111113, 0 0 0 3.5px #ffffff'
                      : '0 0 0 1px rgba(255,255,255,0.12)',
                  }}
                  aria-label={`Switch to ${t.name} theme`}
                  aria-pressed={theme.id === t.id}
                />
              ))}
            </div>
            <Link
              href="/settings?tab=appearance"
              onClick={() => setOpen(false)}
              className="mt-1.5 inline-block text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
            >
              All themes &rarr;
            </Link>
          </div>

          {/* Sign out */}
          <div className="border-t border-white/[0.06] py-1">
            <button
              onClick={() => { setOpen(false); signOut({ redirectUrl: '/' }) }}
              className="flex items-center gap-2.5 px-3 py-1.5 sm:px-4 sm:py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors w-full text-left"
            >
              <svg className="w-4 h-4 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pb-drop-in {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
      `}</style>
    </div>
  )
}
