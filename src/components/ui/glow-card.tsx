'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'

interface GlowCardProps {
  children: React.ReactNode
  className?: string
  /** Size of the rotating border glow in degrees-per-second. Default 360 (one full rotation per second). */
  speed?: number
  /** Whether to show the animated border glow. Default true. */
  glow?: boolean
}

/**
 * Card with an animated conic-gradient border glow on hover.
 * Respects prefers-reduced-motion — falls back to a static gold border glow.
 */
export function GlowCard({ children, className = '', glow = true }: GlowCardProps) {
  const [angle, setAngle] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [prefersReduced, setPrefersReduced] = useState(false)
  const rafRef = useRef<number | null>(null)
  const lastRef = useRef<number | null>(null)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const startAnimation = useCallback(() => {
    if (prefersReduced) return
    const tick = (timestamp: number) => {
      if (lastRef.current !== null) {
        const delta = timestamp - lastRef.current
        setAngle((a) => (a + (delta / 1000) * 360) % 360)
      }
      lastRef.current = timestamp
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [prefersReduced])

  const stopAnimation = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    lastRef.current = null
  }, [])

  const handleHoverStart = () => {
    setIsHovered(true)
    startAnimation()
  }

  const handleHoverEnd = () => {
    setIsHovered(false)
    stopAnimation()
    setAngle(0)
  }

  const borderGlow = glow && isHovered
    ? prefersReduced
      ? 'rgba(255,184,28,0.6)'
      : undefined
    : 'transparent'

  return (
    <motion.div
      onHoverStart={handleHoverStart}
      onHoverEnd={handleHoverEnd}
      className={`relative rounded-2xl ${className}`}
      style={{ isolation: 'isolate' }}
    >
      {/* Rotating conic gradient border */}
      {glow && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{
            padding: '1.5px',
            background: isHovered
              ? prefersReduced
                ? `0 0 0 1.5px rgba(255,184,28,0.6)`
                : `conic-gradient(from ${angle}deg at 50% 50%, #FFB81C 0deg, #FFD700 60deg, #FFB81C 120deg, transparent 180deg, transparent 360deg)`
              : 'transparent',
            WebkitMask:
              'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            transition: isHovered ? 'none' : 'background 0.4s ease',
          }}
        />
      )}

      {/* Static outer glow */}
      {glow && isHovered && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
          style={{
            boxShadow: prefersReduced
              ? `0 0 20px 4px rgba(255,184,28,0.25)`
              : `0 0 32px 6px rgba(255,184,28,0.18)`,
            opacity: isHovered ? 1 : 0,
          }}
        />
      )}

      {children}
    </motion.div>
  )
}
