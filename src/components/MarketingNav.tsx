'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth, SignInButton, SignUpButton } from '@clerk/nextjs'
import { Sparkles, Layout, CreditCard, Download as DownloadIcon, LifeBuoy, BookOpen, Activity, Rocket, LayoutDashboard, Settings } from 'lucide-react'
import { ForjeLogo } from '@/components/ForjeLogo'
import type { LucideIcon } from 'lucide-react'

// Language switcher removed until translations are complete
// import { LanguageSwitcher } from './LanguageSwitcher'

interface NavLink {
  href: string
  label: string
  scroll: boolean
  Icon: LucideIcon
  /** Optional pulsing "New" badge next to the label. */
  badge?: 'New'
  /**
   * Hide this link at the md breakpoint (768-1023px) to prevent the nav
   * from crowding into the logo + CTA at tablet widths. Showcased at lg
   * (>=1024px) where there's room. The top 5 links stay visible at md.
   */
  lgOnly?: boolean
}

/**
 * BUG 1: when we're NOT on the homepage, anchor-style links like `#features`
 * don't resolve because those sections only exist on `/`. We rewrite them to
 * absolute homepage anchors (`/#features`) and disable the smooth-scroll
 * interception so Next.js does a full navigation. `#pricing` gets rewritten to
 * the dedicated `/pricing` page so the CTA keeps working.
 *
 * Some links are marked lgOnly: at the md breakpoint (768-1023px) showing all
 * 8 links caused the nav row to overflow its flex container and visually
 * collide with the logo + right-side Sign-in button ("ForjeGamess" and
 * "atus Sign in" text overlap reported by automated browser test). Hiding the
 * less-critical items (What's New, Download, Help, Status) until >=1024px
 * keeps tablet nav readable; users on tablet can reach those routes through
 * the mobile hamburger anyway.
 */
function buildNavLinks(pathname: string | null): NavLink[] {
  const onHome = pathname === '/' || pathname === ''
  return [
    { href: onHome ? '#features' : '/#features',  label: 'Features',  scroll: onHome,  Icon: Sparkles     },
    { href: onHome ? '#showcase' : '/showcase',   label: 'Showcase',  scroll: onHome,  Icon: Layout       },
    { href: onHome ? '#pricing'  : '/pricing',    label: 'Pricing',   scroll: onHome,  Icon: CreditCard   },
    { href: '/docs',      label: 'Docs',      scroll: false, Icon: BookOpen     },
    { href: '/whats-new', label: "What's New", scroll: false, Icon: Rocket,      badge: 'New', lgOnly: true },
    { href: '/download',  label: 'Download',  scroll: false, Icon: DownloadIcon, lgOnly: true },
    { href: '/help',      label: 'Help',      scroll: false, Icon: LifeBuoy,     lgOnly: true },
    { href: '/status',    label: 'Status',    scroll: false, Icon: Activity,     lgOnly: true },
  ]
}

function MarketingNav() {
  const [scrolled, setScrolled]   = useState(false)
  const [menuOpen, setMenuOpen]   = useState(false)
  const { isSignedIn, isLoaded }  = useAuth()
  const navRef                    = useRef<HTMLElement>(null)
  const pathname                  = usePathname()
  const NAV_LINKS                 = buildNavLinks(pathname)

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
          ? 'bg-[#050810]/85 backdrop-blur-xl border-b border-white/[0.06]'
          : 'bg-transparent',
      ].join(' ')}
      style={scrolled ? { boxShadow: '0 1px 0 rgba(255,255,255,0.03)' } : undefined}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3 sm:gap-4">

        {/* Logo — left */}
        <Link
          href="/"
          className="flex-shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] rounded"
          aria-label="ForjeGames home"
        >
          <ForjeLogo size={20} useImage />
        </Link>

        {/* Desktop nav — center, sharing space with logo + CTA via flex-1 */}
        <nav
          className="hidden md:flex flex-1 items-center justify-center gap-0.5 lg:gap-1 min-w-0"
          aria-label="Site navigation"
        >
          {NAV_LINKS.map((link) => {
            const isActive = !link.href.startsWith('#') && pathname === link.href
            return (
            <Link
              key={link.href}
              href={link.href}
              onClick={link.scroll ? (e) => handleAnchorClick(e, link.href) : undefined}
              className={`relative inline-flex items-center gap-1.5 px-2.5 lg:px-3 py-2 text-[13px] lg:text-sm rounded-lg transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] whitespace-nowrap${link.lgOnly ? ' hidden lg:inline-flex' : ''} ${isActive ? 'text-[#D4AF37] bg-[#D4AF37]/[0.08]' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
            >
              <link.Icon size={14} aria-hidden="true" />
              {link.label}
              {link.badge && (
                <span
                  className="ml-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider fg-nav-pulse"
                  style={{
                    background: 'rgba(212,175,55,0.18)',
                    color: '#D4AF37',
                    border: '1px solid rgba(212,175,55,0.4)',
                  }}
                >
                  {link.badge}
                </span>
              )}
            </Link>
            )
          })}
        </nav>

        {/* Desktop CTA — right. Language switcher + auth controls.
             The unauthed buttons are the SSR/loading default so the
             server-rendered HTML has real text for marketing visitors
             (LCP win + no button flash). Once Clerk's client session
             hydrates (isLoaded && isSignedIn), we swap to the authed
             view with UserButton + "Open Editor". Signed-in users see
             a ~100ms flash of "Sign in" → their avatar on first load,
             which is the right tradeoff since the vast majority of
             home-page traffic is logged out. */}
        <div className="hidden md:flex items-center flex-shrink-0 gap-3 justify-end">
          {/* Language switcher removed until translations complete */}
          {!(isLoaded && isSignedIn) && (
            <>
              <SignInButton mode="redirect">
                <button
                  type="button"
                  className="text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-150 text-zinc-300 hover:text-white hover:bg-white/5"
                >
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="redirect">
                <button
                  type="button"
                  className="text-sm font-semibold px-5 py-2 rounded-lg transition-all duration-150 text-black hover:brightness-110 active:scale-[0.97]"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #C8962A 100%)',
                    boxShadow: '0 0 20px rgba(212,175,55,0.35)',
                  }}
                >
                  Start Building
                </button>
              </SignUpButton>
            </>
          )}
          {isLoaded && isSignedIn && (
            <>
              <Link
                href="/editor"
                className="text-sm font-semibold px-5 py-2 rounded-lg transition-all duration-150 text-black hover:brightness-110 active:scale-[0.97] whitespace-nowrap"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #C8962A 100%)',
                  boxShadow: '0 0 20px rgba(212,175,55,0.35)',
                }}
              >
                Open Editor
              </Link>
              {/* Profile button handled by global ProfileButton in root layout */}
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="p-2.5 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-white/5 min-w-[44px] min-h-[44px] flex items-center justify-center"
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
          className="md:hidden border-b border-white/[0.06]"
          style={{
            background: 'rgba(5,8,16,0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
          role="navigation"
          aria-label="Mobile navigation"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={link.scroll ? (e) => handleAnchorClick(e, link.href) : () => setMenuOpen(false)}
                className="inline-flex items-center gap-2 px-3 py-3 text-sm text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <link.Icon size={14} aria-hidden="true" />
                <span>{link.label}</span>
                {link.badge && (
                  <span
                    className="ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider fg-nav-pulse"
                    style={{
                      background: 'rgba(212,175,55,0.18)',
                      color: '#D4AF37',
                      border: '1px solid rgba(212,175,55,0.4)',
                    }}
                  >
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
            <div className="border-t border-white/[0.06] mt-2 pt-3 flex flex-col gap-3">
              {/* Language switcher removed until translations complete */}
              {!(isLoaded && isSignedIn) && (
                <>
                  <SignInButton mode="redirect">
                    <button
                      type="button"
                      onClick={() => setMenuOpen(false)}
                      className="block text-center text-sm font-semibold px-4 py-3 rounded-lg transition-all duration-150 text-zinc-300 hover:text-white border border-white/10 hover:bg-white/5 w-full"
                    >
                      Sign in
                    </button>
                  </SignInButton>
                  <SignUpButton mode="redirect">
                    <button
                      type="button"
                      onClick={() => setMenuOpen(false)}
                      className="block text-center text-sm font-semibold px-4 py-3 rounded-lg transition-all duration-150 text-black hover:brightness-110 active:scale-[0.97] w-full"
                      style={{
                        background: 'linear-gradient(135deg, #D4AF37 0%, #C8962A 100%)',
                        boxShadow: '0 0 20px rgba(212,175,55,0.25)',
                      }}
                    >
                      Start Building
                    </button>
                  </SignUpButton>
                </>
              )}
              {isLoaded && isSignedIn && (
                <>
                  <Link
                    href="/editor"
                    onClick={() => setMenuOpen(false)}
                    className="block text-center text-sm font-semibold px-4 py-3 rounded-lg transition-all duration-150 text-black hover:brightness-110 active:scale-[0.97]"
                    style={{
                      background: 'linear-gradient(135deg, #D4AF37 0%, #C8962A 100%)',
                      boxShadow: '0 0 20px rgba(212,175,55,0.25)',
                    }}
                  >
                    Open Editor
                  </Link>
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="inline-flex items-center justify-center gap-2 text-sm font-medium px-4 py-3 rounded-lg border border-white/10 text-zinc-300 hover:text-white hover:bg-white/5"
                  >
                    <LayoutDashboard size={14} />
                    Dashboard
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="inline-flex items-center justify-center gap-2 text-sm font-medium px-4 py-3 rounded-lg border border-white/10 text-zinc-300 hover:text-white hover:bg-white/5"
                  >
                    <Settings size={14} />
                    Settings
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pulsing "New" badge animation */}
      <style jsx global>{`
        @keyframes fgNavPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(212,175,55,0.55); }
          50%      { box-shadow: 0 0 0 4px rgba(212,175,55,0); }
        }
        .fg-nav-pulse {
          animation: fgNavPulse 2s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .fg-nav-pulse { animation: none; }
        }
      `}</style>
    </header>
  )
}

export default MarketingNav
