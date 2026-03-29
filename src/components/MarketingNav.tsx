'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

const NAV_LINKS = [
  { href: '/#features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/docs', label: 'Docs' },
  { href: '/blog', label: 'Blog' },
]

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  // Close on Escape
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [menuOpen])

  return (
    <header
      className={[
        'fixed top-0 inset-x-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-[#0A0E27]/95 backdrop-blur-md border-b border-white/10 shadow-lg shadow-black/30'
          : 'bg-transparent',
      ].join(' ')}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link
          href="/"
          className="flex-shrink-0 font-extrabold text-xl tracking-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] rounded"
          aria-label="ForjeGames home"
        >
          <span style={{ color: '#D4AF37' }}>Forje</span>
          <span className="text-white">Games</span>
        </Link>

        {/* Desktop nav links */}
        <nav
          className="hidden md:flex items-center gap-1"
          aria-label="Site navigation"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-2 text-sm text-gray-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3 flex-shrink-0">
          <Link
            href="/sign-in"
            className="text-sm text-gray-300 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37]"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="text-sm font-bold px-4 py-2 rounded-lg transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37]"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #F5CC5A 50%, #D4AF37 100%)',
              color: '#0A0E27',
            }}
          >
            Get Started Free
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="md:hidden p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37]"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
        >
          {menuOpen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          id="mobile-menu"
          ref={menuRef}
          className="md:hidden bg-[#0A0E27]/98 backdrop-blur-md border-b border-white/10"
          role="navigation"
          aria-label="Mobile navigation"
        >
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="px-3 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-white/10 mt-2 pt-3 flex flex-col gap-2">
              <Link
                href="/sign-in"
                onClick={() => setMenuOpen(false)}
                className="px-3 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                onClick={() => setMenuOpen(false)}
                className="text-center text-sm font-bold px-4 py-3 rounded-lg transition-colors"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #F5CC5A 50%, #D4AF37 100%)',
                  color: '#0A0E27',
                }}
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default MarketingNav
