'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

interface SpotlightProps {
  children: React.ReactNode
  className?: string
  /** Spotlight radius in px. Default 400. */
  radius?: number
  /** Spotlight opacity (0-1). Default 0.06. */
  opacity?: number
  /** Spotlight color in hex/rgb. Default white. */
  color?: string
}

/**
 * Wraps children in a div with a radial spotlight that follows the cursor.
 * Very subtle by design — brightens where the cursor is via overlay blend.
 * Respects prefers-reduced-motion by disabling the effect entirely.
 */
export function Spotlight({
  children,
  className = '',
  radius = 400,
  opacity = 0.06,
  color = 'rgba(255,255,255,1)',
}: SpotlightProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  const [prefersReduced, setPrefersReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!containerRef.current || !overlayRef.current || prefersReduced) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      overlayRef.current.style.background = `radial-gradient(${radius}px circle at ${x}px ${y}px, ${color} 0%, transparent 70%)`
      overlayRef.current.style.opacity = String(opacity)
    },
    [color, opacity, prefersReduced, radius]
  )

  const handleMouseEnter = useCallback(() => {
    if (!overlayRef.current || prefersReduced) return
    overlayRef.current.style.transition = 'opacity 0.2s ease'
    overlayRef.current.style.opacity = String(opacity)
  }, [opacity, prefersReduced])

  const handleMouseLeave = useCallback(() => {
    if (!overlayRef.current) return
    overlayRef.current.style.transition = 'opacity 0.5s ease'
    overlayRef.current.style.opacity = '0'
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el || prefersReduced) return
    el.addEventListener('mousemove', handleMouseMove)
    el.addEventListener('mouseenter', handleMouseEnter)
    el.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      el.removeEventListener('mousemove', handleMouseMove)
      el.removeEventListener('mouseenter', handleMouseEnter)
      el.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [handleMouseMove, handleMouseEnter, handleMouseLeave, prefersReduced])

  return (
    <div ref={containerRef} className={`relative ${className}`} style={{ isolation: 'isolate' }}>
      {/* Spotlight overlay — uses 'overlay' blend mode to brighten without washing out */}
      <div
        ref={overlayRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 rounded-[inherit]"
        style={{ opacity: 0, mixBlendMode: 'overlay' }}
      />
      {children}
    </div>
  )
}
