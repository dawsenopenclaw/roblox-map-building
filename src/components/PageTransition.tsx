'use client'

/**
 * PageTransition — pure CSS, zero Framer Motion.
 *
 * How it works:
 *  - A module-level flag tracks whether the app has been navigated at least once.
 *    On the very first page load the flag is false → component renders fully visible
 *    and useEffect marks the app as "navigated". No animation, no flash.
 *  - On every subsequent navigation (remount): component renders invisible/translated,
 *    useEffect fires a RAF → transition to opacity:1 / translateY(0) in 200ms.
 *
 * Using a module-level variable (not useRef) is critical: useRef resets to its
 * initial value on every remount. We need a value that persists across remounts
 * but resets on full page reload — module scope is exactly that.
 *
 * GPU path: only opacity + transform. will-change declared upfront.
 * Easing: cubic-bezier(0.4, 0, 0.2, 1) — Material Design "standard" curve.
 */

import { useRef, useEffect } from 'react'

// Persists across remounts, resets on full page reload.
let hasNavigated = false

interface PageTransitionProps {
  children: React.ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  // Capture at render time before useEffect flips the flag
  const shouldAnimate = hasNavigated

  useEffect(() => {
    if (!hasNavigated) {
      // First page load: mark as navigated, skip animation
      hasNavigated = true
      return
    }

    const el = containerRef.current
    if (!el) return

    // RAF: ensures the browser has painted opacity:0 before we start the transition
    const raf = requestAnimationFrame(() => {
      if (!containerRef.current) return
      el.style.transition =
        'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1), transform 200ms cubic-bezier(0.4, 0, 0.2, 1)'
      el.style.opacity = '1'
      el.style.transform = 'translateY(0)'
    })

    return () => cancelAnimationFrame(raf)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        willChange: 'transform, opacity',
        opacity: shouldAnimate ? 0 : 1,
        transform: shouldAnimate ? 'translateY(8px)' : 'translateY(0)',
        transition: 'none',
      }}
    >
      {children}
    </div>
  )
}

/**
 * Opt-in stagger for page children.
 * Usage:
 *   <div className="page-stagger-child" style={{ '--stagger-i': 0 } as React.CSSProperties}>
 *
 * CSS is defined in globals.css under .page-stagger-child.
 * Stagger index 0–5, each step adds 40ms delay after the 200ms page enter.
 */
export type StaggerIndex = 0 | 1 | 2 | 3 | 4 | 5
