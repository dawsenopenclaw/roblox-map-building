'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'

interface GlowCardProps {
  children: React.ReactNode
  className?: string
  /** Rotation speed in degrees-per-second. Default 90 (one full rotation per 4s). */
  speed?: number
  /** Whether to show the animated border glow. Default true. */
  glow?: boolean
}

/**
 * Card with an animated conic-gradient gold border glow on hover.
 * Design system colors: #D4AF37 / #FFD700 / #FFB81C.
 * Respects prefers-reduced-motion — falls back to a static gold border glow.
 */
export function GlowCard({ children, className = '', speed = 90, glow = true }: GlowCardProps) {
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
        setAngle((a) => (a + (delta / 1000) * speed) % 360)
      }
      lastRef.current = timestamp
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [prefersReduced, speed])

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

  return (
    <motion.div
      onHoverStart={handleHoverStart}
      onHoverEnd={handleHoverEnd}
      className={`relative rounded-2xl ${className}`}
      style={{ isolation: 'isolate' }}
      whileHover={{
        transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
      }}
    >
      {/* Rotating conic gradient border — gold design system colors */}
      {glow && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{
            padding: '1.5px',
            background: isHovered
              ? prefersReduced
                ? `conic-gradient(#D4AF37, #FFD700, #FFB81C, #D4AF37)`
                : `conic-gradient(from ${angle}deg at 50% 50%, #D4AF37 0deg, #FFD700 72deg, #FFB81C 144deg, #D4AF37 216deg, transparent 270deg, transparent 360deg)`
              : 'transparent',
            WebkitMask:
              'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            transition: isHovered ? 'none' : 'background 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      )}

      {/* Outer ambient glow */}
      {glow && isHovered && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
          style={{
            boxShadow: prefersReduced
              ? `0 0 20px 4px rgba(212,175,55,0.28)`
              : `0 0 36px 6px rgba(212,175,55,0.16), 0 0 72px 12px rgba(212,175,55,0.06)`,
            opacity: isHovered ? 1 : 0,
          }}
        />
      )}

      {children}
    </motion.div>
  )
}
