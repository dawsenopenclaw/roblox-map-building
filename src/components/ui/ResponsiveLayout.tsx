'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

// ─── Types ──────────────────────────────────────────────────────────────────────

export type Breakpoint = 'mobile' | 'tablet' | 'desktop'

export interface ResponsiveState {
  breakpoint: Breakpoint
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  /** Raw window.innerWidth — 0 during SSR */
  width: number
}

// ─── Breakpoints (mirrors Tailwind config) ─────────────────────────────────────
// mobile  < 768px
// tablet  768px – 1023px
// desktop ≥ 1024px

function getBreakpoint(width: number): Breakpoint {
  if (width < 768)  return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

function buildState(width: number): ResponsiveState {
  const breakpoint = getBreakpoint(width)
  return {
    breakpoint,
    isMobile:  breakpoint === 'mobile',
    isTablet:  breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    width,
  }
}

// ─── Context ────────────────────────────────────────────────────────────────────

const ResponsiveContext = createContext<ResponsiveState>(buildState(1280))

// ─── Provider ──────────────────────────────────────────────────────────────────

export function ResponsiveProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ResponsiveState>(() => {
    // SSR-safe: default to desktop until client mounts
    if (typeof window === 'undefined') return buildState(1280)
    return buildState(window.innerWidth)
  })

  useEffect(() => {
    // Sync immediately on mount (avoids hydration mismatch)
    setState(buildState(window.innerWidth))

    let rafId: number
    const handleResize = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        setState(buildState(window.innerWidth))
      })
    }

    window.addEventListener('resize', handleResize, { passive: true })
    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <ResponsiveContext.Provider value={state}>
      {children}
    </ResponsiveContext.Provider>
  )
}

// ─── Hook ───────────────────────────────────────────────────────────────────────

/**
 * Returns the current responsive breakpoint state.
 *
 * @example
 * const { isMobile, isDesktop } = useResponsive()
 */
export function useResponsive(): ResponsiveState {
  return useContext(ResponsiveContext)
}

// ─── Standalone hook (no provider needed — uses ResizeObserver directly) ────────

/**
 * Lightweight version that doesn't need a provider.
 * Use inside leaf components when you don't control the tree.
 */
export function useResponsiveStandalone(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() =>
    typeof window === 'undefined' ? buildState(1280) : buildState(window.innerWidth)
  )

  useEffect(() => {
    setState(buildState(window.innerWidth))

    let rafId: number
    const handleResize = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => setState(buildState(window.innerWidth)))
    }

    window.addEventListener('resize', handleResize, { passive: true })
    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return state
}

// ─── Utility components ─────────────────────────────────────────────────────────

/** Only renders children on mobile (< 768px). */
export function MobileOnly({ children }: { children: ReactNode }) {
  const { isMobile } = useResponsive()
  return isMobile ? <>{children}</> : null
}

/** Only renders children on tablet or wider (≥ 768px). */
export function TabletUp({ children }: { children: ReactNode }) {
  const { isMobile } = useResponsive()
  return !isMobile ? <>{children}</> : null
}

/** Only renders children on desktop (≥ 1024px). */
export function DesktopOnly({ children }: { children: ReactNode }) {
  const { isDesktop } = useResponsive()
  return isDesktop ? <>{children}</> : null
}
