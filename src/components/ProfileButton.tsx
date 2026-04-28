'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useAuth, useUser, useClerk } from '@clerk/nextjs'
import { usePathname } from 'next/navigation'
import useSWR from 'swr'

const HIDDEN_PATHS = ['/sign-in', '/sign-up', '/onboarding']
const ADMIN_EMAILS = ['dawsenporter@gmail.com']

const fetcher = (url: string) => fetch(url).then(r => r.ok ? r.json() : null)

export function ProfileButton() {
  const { isSignedIn, isLoaded } = useAuth()
  const { user } = useUser()
  const { signOut } = useClerk()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const { data: tokenData } = useSWR(isSignedIn ? '/api/tokens/balance' : null, fetcher, { refreshInterval: 30000 })

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  if (!isLoaded || !isSignedIn) return null
  if (HIDDEN_PATHS.some((p) => pathname.startsWith(p))) return null

  const name = user?.fullName || user?.firstName || user?.username || 'User'
  const email = user?.primaryEmailAddress?.emailAddress || ''
  const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase())
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  const imageUrl = user?.imageUrl
  const balance = tokenData?.balance ?? tokenData?.tokens ?? null
  const tier = tokenData?.tier || tokenData?.subscription?.tier || 'FREE'

  const tierLabel = tier === 'FREE' ? 'Test Drive' : tier.charAt(0) + tier.slice(1).toLowerCase()
  const tierColor = tier === 'FREE' ? '#71717A' : '#D4AF37'

  const sections = [
    {
      label: 'Account',
      items: [
        { href: '/editor', label: 'Editor', icon: '✦' },
        { href: '/dashboard', label: 'Dashboard', icon: '▦' },
        { href: '/settings', label: 'Settings', icon: '⚙' },
        { href: '/billing', label: 'Billing & Plan', icon: '▣' },
      ],
    },
    {
      label: 'Tokens',
      items: [
        { href: '/tokens', label: 'Buy Tokens', icon: '◆' },
        { href: '/settings?tab=api-keys', label: 'API Keys', icon: '⚷' },
      ],
    },
    {
      label: 'Resources',
      items: [
        { href: '/download', label: 'Studio Plugin', icon: '↓' },
        { href: '/docs', label: 'Documentation', icon: '📖' },
        { href: '/help', label: 'Help', icon: '?' },
      ],
    },
    ...(isAdmin ? [{
      label: 'Admin',
      items: [
        { href: '/admin', label: 'Admin Panel', icon: '⊞' },
        { href: '/admin/dev-board', label: 'Dev Board', icon: '⊟' },
      ],
    }] : []),
  ]

  return (
    <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-[9999]" ref={ref}>
      {/* Avatar button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="group relative"
        aria-label="Profile menu"
        aria-expanded={open}
      >
        <div
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden transition-all"
          style={{
            boxShadow: open
              ? '0 0 0 2px #050810, 0 0 0 3.5px #D4AF37'
              : '0 0 0 2px rgba(212,175,55,0.2)',
          }}
        >
          {imageUrl ? (
            <img src={imageUrl} alt={name} width={40} height={40} className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center font-bold text-xs"
              style={{ background: 'linear-gradient(135deg, #D4AF37, #B8962E)', color: '#0a0a0a' }}
            >
              {initials}
            </div>
          )}
        </div>
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#050810] rounded-full" />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2"
          style={{
            width: 280,
            maxWidth: 'calc(100vw - 24px)',
            background: 'rgba(8,10,22,0.92)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16,
            boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)',
            animation: 'pb-drop-in 0.15s ease-out',
            overflow: 'hidden',
          }}
        >
          {/* User header */}
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                {imageUrl ? (
                  <img src={imageUrl} alt={name} width={36} height={36} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, background: 'linear-gradient(135deg, #D4AF37, #B8962E)', color: '#0a0a0a' }}>
                    {initials}
                  </div>
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#FAFAFA', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</p>
                <p style={{ fontSize: 11, color: '#52525B', margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</p>
              </div>
            </div>

            {/* Token balance + tier */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 12px', borderRadius: 10,
              background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.12)',
            }}>
              <div>
                <p style={{ fontSize: 10, color: '#71717A', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Tokens</p>
                <p style={{ fontSize: 18, fontWeight: 800, color: '#D4AF37', margin: '2px 0 0', fontVariantNumeric: 'tabular-nums' }}>
                  {balance !== null ? balance.toLocaleString() : '—'}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, color: tierColor,
                  padding: '3px 8px', borderRadius: 6,
                  background: tier === 'FREE' ? 'rgba(255,255,255,0.04)' : 'rgba(212,175,55,0.1)',
                  border: `1px solid ${tier === 'FREE' ? 'rgba(255,255,255,0.06)' : 'rgba(212,175,55,0.15)'}`,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  {tierLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Menu sections */}
          <div style={{ padding: '6px 0', maxHeight: 320, overflowY: 'auto' }}>
            {sections.map((section, si) => (
              <div key={section.label}>
                {si > 0 && <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '4px 12px' }} />}
                <p style={{ fontSize: 9, fontWeight: 700, color: '#3F3F46', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '8px 16px 4px', margin: 0 }}>
                  {section.label}
                </p>
                {section.items.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 16px', fontSize: 13, fontWeight: 500,
                      color: '#A1A1AA', textDecoration: 'none',
                      transition: 'all 0.12s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#E4E4E7' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#A1A1AA' }}
                  >
                    <span style={{ width: 16, textAlign: 'center', fontSize: 12, color: '#52525B', flexShrink: 0 }}>{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>

          {/* Sign out */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', padding: '4px 0' }}>
            <button
              onClick={() => { setOpen(false); signOut({ redirectUrl: '/' }) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '10px 16px', fontSize: 13, fontWeight: 500,
                color: '#EF4444', background: 'transparent', border: 'none',
                cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ width: 16, textAlign: 'center', fontSize: 12, flexShrink: 0 }}>↪</span>
              Sign out
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pb-drop-in {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}
