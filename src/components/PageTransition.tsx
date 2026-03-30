'use client'

/**
 * PageTransition — pure CSS, zero dependencies.
 *
 * Strategy:
 *  - First render (initial page load): content is instantly visible — no animation,
 *    no flash. The `data-loading` attribute on <html> already suppresses all
 *    transitions during hydration, but we add an extra guard here.
 *  - Subsequent navigations: 200ms fade-in + 8px slide-up using GPU-accelerated
 *    opacity and transform only. No layout shifts.
 *
 * Works with Next.js App Router template.tsx — the component unmounts/remounts on
 * every navigation, so `useRef(true)` reliably detects first render per route.
 */

import { useRef, useEffect, useCallback } from 'react'

interface PageTransitionProps {
  children: React.ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isFirstRender = useRef(true)

  const runEnter = useCallback(() => {
    const el = containerRef.current
    if (!el) return

    // Force a reflow so the browser registers the starting state before
    // we remove the class that triggers the transition.
    void el.offsetHeight

    el.style.transition = 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1), transform 200ms cubic-bezier(0.4, 0, 0.2, 1)'
    el.style.opacity = '1'
    el.style.transform = 'translateY(0)'
  }, [])

  useEffect(() => {
    if (isFirstRender.current) {
      // First render: skip animation entirely — content is already visible
      isFirstRender.current = false
      return
    }
    // Subsequent navigation: RAF ensures paint happens before transition fires
    const raf = requestAnimationFrame(runEnter)
    return () => cancelAnimationFrame(raf)
  }, [runEnter])

  // On first render: fully visible, no transition
  // On subsequent navigations: start invisible/translated, animate to final state
  const isFirst = isFirstRender.current

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        willChange: 'transform, opacity',
        // First render: visible immediately, no transition queued
        opacity: isFirst ? 1 : 0,
        transform: isFirst ? 'translateY(0)' : 'translateY(8px)',
        transition: isFirst ? 'none' : undefined,
      }}
    >
      {children}
    </div>
  )
}

/**
 * Utility: attach this CSS variable to any direct child you want to stagger in.
 * Usage (inside a page, with a regular CSS class or inline style):
 *
 *   <div className="page-stagger-child" style={{ '--stagger-i': 0 } as React.CSSProperties}>
 *
 * Pair with the `.page-stagger-child` class defined in globals.css.
 */
export type StaggerIndex = 0 | 1 | 2 | 3 | 4 | 5
