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
        duration: 0.4,
        delay: index * 0.06,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{
        y: -3,
        boxShadow: noGlow
          ? '0 12px 32px rgba(0,0,0,0.4)'
          : '0 12px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(212,175,55,0.28), 0 0 24px rgba(212,175,55,0.08)',
        transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
      }}
      whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
      className={className}
      style={{ cursor: onClick ? 'pointer' : undefined }}
    >
      {children}
    </motion.div>
  )
}
