'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import { Sparkles, Layout, CreditCard, Download as DownloadIcon, LifeBuoy } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const NAV_LINKS: { href: string; label: string; scroll: boolean; Icon: LucideIcon }[] = [
  { href: '#features',  label: 'Features',  scroll: true,  Icon: Sparkles     },
  { href: '#showcase',  label: 'Showcase',  scroll: true,  Icon: Layout       },
  { href: '#pricing',   label: 'Pricing',   scroll: true,  Icon: CreditCard   },
  { href: '/download',  label: 'Download',  scroll: false, Icon: DownloadIcon },
  { href: '/help',      label: 'Help',      scroll: false, Icon: LifeBuoy     },
]

function MarketingNav() {
  const [scrolled, setScrolled]   = useState(false)
  const [menuOpen, setMenuOpen]   = useState(false)
  const { isSignedIn, isLoaded }  = useAuth()
  const navRef                    = useRef<HTMLElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* Close mobile menu on outside click */
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  /* Close mobile menu on Escape */
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [menuOpen])

  /* Smooth-scroll handler for anchor links */
  function handleAnchorClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    if (!href.startsWith('#')) return
    e.preventDefault()
    const target = document.getElementById(href.slice(1))
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    setMenuOpen(false)
  }

  return (
    <header
      ref={navRef}
      className={[
        'fixed top-0 inset-x-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-[#050810]/90 backdrop-blur-md border-b border-white/[0.06]'
          : 'bg-transparent',
      ].join(' ')}
      style={scrolled ? { boxShadow: '0 1px 0 rgba(255,255,255,0.03)' } : undefined}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">

        {/* Logo — left */}
        <Link
          href="/"
          className="flex-shrink-0 font-extrabold text-xl tracking-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] rounded"
          aria-label="ForjeGames home"
        >
          <span style={{ color: '#D4AF37' }}>Forje</span>
          <span className="text-white">Games</span>
        </Link>

        {/* Desktop nav — center */}
        <nav
          className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2"
          aria-label="Site navigation"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={link.scroll ? (e) => handleAnchorClick(e, link.href) : undefined}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37]"
            >
              <link.Icon size={14} aria-hidden="true" />
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA — right. Fixed width prevents layout shift while Clerk loads. */}
        <div className="hidden md:flex items-center flex-shrink-0 w-[138px] justify-end">
          {isLoaded ? (
            <Link
              href="/editor"
              className="text-sm font-semibold px-5 py-2 rounded-lg transition-all duration-150 text-black"
              style={{
                background: '#D4AF37',
                boxShadow: `0 0 16px rgba(212,175,55,${isSignedIn ? '0.35' : '0.30'})`,
              }}
            >
              {isSignedIn ? 'Open Editor' : 'Start Building'}
            </Link>
          ) : (
            /* Skeleton placeholder — same dimensions as the button, invisible */
            <div className="w-[130px] h-[36px] rounded-lg bg-transparent" aria-hidden="true" />
          )}
        </div>

        {/* Mobile hamburger */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="p-2 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
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
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          id="mobile-menu"
          className="md:hidden bg-[#050810]/95 backdrop-blur-md border-b border-white/[0.06]"
          role="navigation"
          aria-label="Mobile navigation"
        >
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={link.scroll ? (e) => handleAnchorClick(e, link.href) : () => setMenuOpen(false)}
                className="inline-flex items-center gap-2 px-3 py-3 text-sm text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <link.Icon size={14} aria-hidden="true" />
                {link.label}
              </Link>
            ))}
            <div className="border-t border-white/[0.06] mt-2 pt-3">
              {isLoaded ? (
                <Link
                  href="/editor"
                  onClick={() => setMenuOpen(false)}
                  className="block text-center text-sm font-semibold px-4 py-3 rounded-lg transition-all text-black"
                  style={{ background: '#D4AF37' }}
                >
                  {isSignedIn ? 'Open Editor' : 'Start Building'}
                </Link>
              ) : (
                <div className="h-[46px] rounded-lg bg-transparent" aria-hidden="true" />
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default MarketingNav
