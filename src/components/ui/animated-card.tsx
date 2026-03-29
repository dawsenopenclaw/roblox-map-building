'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

interface AnimatedCardProps {
  children: React.ReactNode
  className?: string
  /** Set to true when rendering in a staggered list — pass index for delay */
  index?: number
  /** Disable glow border on hover */
  noGlow?: boolean
  onClick?: () => void
}

export function AnimatedCard({
  children,
  className = '',
  index = 0,
  noGlow = false,
  onClick,
}: AnimatedCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <motion.div
      ref={ref}
      onClick={onClick}
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      transition={{
        duration: 0.35,
        delay: index * 0.06,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{
        y: -2,
        boxShadow: noGlow
          ? '0 8px 24px rgba(0,0,0,0.3)'
          : '0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,184,28,0.25)',
        transition: { duration: 0.18, ease: 'easeOut' },
      }}
      whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
      className={className}
      style={{ cursor: onClick ? 'pointer' : undefined }}
    >
      {children}
    </motion.div>
  )
}
