'use client'

import { useEffect, useRef } from 'react'
import { useInView, useSpring, useTransform, motion } from 'framer-motion'

interface AnimatedCounterProps {
  value: number
  duration?: number
  /** Locale string to format the number (e.g. 'en-US') */
  locale?: string
  /** Intl.NumberFormat options */
  formatOptions?: Intl.NumberFormatOptions
  className?: string
}

export function AnimatedCounter({
  value,
  duration = 0.8,
  locale = 'en-US',
  formatOptions,
  className = '',
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-20px' })

  const spring = useSpring(0, {
    stiffness: 60,
    damping: 20,
    restDelta: 0.5,
  })

  const display = useTransform(spring, (latest) =>
    new Intl.NumberFormat(locale, formatOptions).format(Math.round(latest))
  )

  useEffect(() => {
    if (isInView) {
      spring.set(value)
    }
  }, [isInView, value, spring])

  return (
    <motion.span ref={ref} className={className}>
      {display}
    </motion.span>
  )
}
