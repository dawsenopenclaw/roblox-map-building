'use client'

import { useEffect, useState } from 'react'

/**
 * React hook that tracks whether a CSS media query matches.
 *
 * SSR-safe: returns `false` on the server and during the first client render,
 * then updates synchronously in a layout-effect-adjacent manner once mounted.
 * This avoids hydration mismatches while still reflecting the real viewport
 * before the first paint on the client.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const mql = window.matchMedia(query)

    // Initialize with the current value on mount
    setMatches(mql.matches)

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Modern browsers
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', handler)
      return () => mql.removeEventListener('change', handler)
    }

    // Safari < 14 / legacy fallback
    mql.addListener(handler)
    return () => mql.removeListener(handler)
  }, [query])

  return matches
}

/**
 * Convenience hook: true when the viewport is at or below the mobile breakpoint.
 * Breakpoint matches Tailwind's `md` (768px).
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 768px)')
}
