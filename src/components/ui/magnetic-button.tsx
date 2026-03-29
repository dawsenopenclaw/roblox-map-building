'use client'

import { useRef, useState, useCallback } from 'react'
import { motion, useSpring } from 'framer-motion'
import Link from 'next/link'

interface MagneticButtonProps {
  children: React.ReactNode
  className?: string
  /** Max pixel displacement toward cursor. Default 5. */
  strength?: number
  onClick?: () => void
  /** When provided the button renders as a Next.js Link instead of a <button>. */
  href?: string
  'aria-label'?: string
}

/**
 * Button that subtly follows the cursor when hovering nearby (magnetic effect).
 * Max displacement is `strength` pixels. Respects prefers-reduced-motion.
 */
export function MagneticButton({
  children,
  className = '',
  strength = 5,
  onClick,
  href,
  'aria-label': ariaLabel,
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isNear, setIsNear] = useState(false)

  const prefersReduced =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false

  const x = useSpring(0, { stiffness: 300, damping: 25 })
  const y = useSpring(0, { stiffness: 300, damping: 25 })

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (prefersReduced || !ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      // Scale displacement: max `strength` px
      const dist = Math.sqrt(dx * dx + dy * dy)
      const maxDist = Math.max(rect.width, rect.height)
      const scale = Math.min(dist / maxDist, 1)
      x.set((dx / dist) * strength * scale)
      y.set((dy / dist) * strength * scale)
      setIsNear(true)
    },
    [prefersReduced, strength, x, y]
  )

  const handleMouseLeave = useCallback(() => {
    x.set(0)
    y.set(0)
    setIsNear(false)
  }, [x, y])

  if (href) {
    return (
      <motion.div
        ref={ref}
        style={{ x: prefersReduced ? 0 : x, y: prefersReduced ? 0 : y }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="inline-block"
      >
        <motion.div whileTap={prefersReduced ? {} : { scale: 0.96 }} className="inline-block">
          <Link href={href} aria-label={ariaLabel} className={className}>
            {children}
          </Link>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div
      ref={ref}
      style={{ x: prefersReduced ? 0 : x, y: prefersReduced ? 0 : y }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="inline-block"
    >
      <motion.button
        onClick={onClick}
        aria-label={ariaLabel}
        whileTap={prefersReduced ? {} : { scale: 0.96 }}
        className={className}
        style={{
          transform: isNear && !prefersReduced ? undefined : undefined,
        }}
      >
        {children}
      </motion.button>
    </motion.div>
  )
}
