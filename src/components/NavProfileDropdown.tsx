'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAuth, useUser, useClerk } from '@clerk/nextjs'
import { User, Settings, Palette, LogOut, LogIn } from 'lucide-react'

/**
 * NavProfileDropdown — inline (not fixed-position) profile button for headers.
 *
 * Renders:
 *  - Signed in: avatar circle + chevron → dropdown with Profile, Settings,
 *    Appearance, and Sign Out.
 *  - Signed out: "Sign In" link button.
 *
 * Designed to slot into any header's flex row at whatever size the parent
 * dictates. Does NOT use `position: fixed` — it positions relative to the
 * nearest positioned ancestor, which should be the header container.
 */

function useClickOutside(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) cb()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [ref, cb])
}

function useEscapeKey(cb: () => void) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') cb()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [cb])
}

interface NavProfileDropdownProps {
  /** Extra class on the root wrapper — use to push it right in a flex row */
  className?: string
}

export function NavProfileDropdown({ className = '' }: NavProfileDropdownProps) {
  const { isSignedIn, isLoaded } = useAuth()
  const { user } = useUser()
  const { signOut } = useClerk()
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const close = () => setOpen(false)
  useClickOutside(wrapperRef, close)
  useEscapeKey(close)

  // Not loaded yet — render nothing to avoid flash
  if (!isLoaded) return null

  // Signed out state
  if (!isSignedIn) {
    return (
      <Link
        href="/sign-in"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-colors ${className}`}
      >
        <LogIn className="w-3.5 h-3.5" />
        Sign In
      </Link>
    )
  }

  const name = user?.fullName ?? user?.firstName ?? user?.username ?? 'User'
  const email = user?.primaryEmailAddress?.emailAddress ?? ''
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const imageUrl = user?.imageUrl

  return (
    <div className={`relative flex-shrink-0 ${className}`} ref={wrapperRef}>
      {/* Avatar trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Profile menu"
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-white/[0.06] transition-colors group"
      >
        <div
          className="w-8 h-8 rounded-full overflow-hidden transition-all"
          style={{
            boxShadow: `0 0 0 2px ${open ? 'rgba(212,175,55,0.6)' : 'rgba(212,175,55,0.25)'}`,
          }}
        >
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-xs font-bold select-none"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #B8962E 100%)',
                color: '#0a0a0a',
              }}
            >
              {initials}
            </div>
          )}
        </div>
        {/* Chevron */}
        <svg
          className={`w-3 h-3 text-zinc-500 group-hover:text-zinc-300 transition-all duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          role="menu"
          aria-label="User menu"
          className="absolute right-0 top-full mt-2 w-56 bg-[#111113] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
          style={{ animation: 'ndp-drop-in 0.15s cubic-bezier(0.16,1,0.3,1)' }}
        >
          {/* Identity header */}
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
                {imageUrl ? (
                  <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-xs font-bold select-none"
                    style={{
                      background: 'linear-gradient(135deg, #D4AF37 0%, #B8962E 100%)',
                      color: '#0a0a0a',
                    }}
                  >
                    {initials}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{name}</p>
                {email && <p className="text-[11px] text-zinc-500 truncate">{email}</p>}
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <Link
              href="/settings"
              role="menuitem"
              onClick={close}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:text-[#D4AF37] hover:bg-white/[0.04] transition-colors"
            >
              <User className="w-4 h-4 text-zinc-500" />
              Profile
            </Link>
            <Link
              href="/settings"
              role="menuitem"
              onClick={close}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:text-[#D4AF37] hover:bg-white/[0.04] transition-colors"
            >
              <Settings className="w-4 h-4 text-zinc-500" />
              Settings
            </Link>
            <Link
              href="/settings?tab=appearance"
              role="menuitem"
              onClick={close}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:text-[#D4AF37] hover:bg-white/[0.04] transition-colors"
            >
              <Palette className="w-4 h-4 text-zinc-500" />
              Theme
            </Link>
          </div>

          {/* Sign out */}
          <div className="border-t border-white/[0.06] py-1">
            <button
              role="menuitem"
              onClick={() => { close(); signOut({ redirectUrl: '/' }) }}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/[0.06] transition-colors w-full text-left"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              Sign out
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes ndp-drop-in {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .ndp-drop-in { animation: none !important; }
        }
      `}</style>
    </div>
  )
}
