'use client'

import { forwardRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  /** Color key used for glow: 'gold' | 'blue' | 'green' | 'red' | 'purple' */
  glowColor?: 'gold' | 'blue' | 'green' | 'red' | 'purple'
  children: React.ReactNode
}

const GLOW_MAP: Record<string, string> = {
  gold: '0 0 16px rgba(255,184,28,0.45)',
  blue: '0 0 16px rgba(96,165,250,0.45)',
  green: '0 0 16px rgba(52,211,153,0.45)',
  red: '0 0 16px rgba(248,113,113,0.45)',
  purple: '0 0 16px rgba(167,139,250,0.45)',
}

const Spinner = () => (
  <motion.svg
    key="spinner"
    className="w-4 h-4 animate-spin"
    viewBox="0 0 24 24"
    fill="none"
    initial={{ opacity: 0, scale: 0.7 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.7 }}
    transition={{ duration: 0.15 }}
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </motion.svg>
)

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ loading = false, glowColor = 'gold', children, className = '', disabled, ...props }, ref) => {
    const glowShadow = GLOW_MAP[glowColor] || GLOW_MAP.gold

    return (
      <motion.button
        ref={ref}
        {...(props as React.ComponentProps<typeof motion.button>)}
        disabled={disabled || loading}
        className={className}
        whileHover={
          disabled || loading
            ? {}
            : {
                boxShadow: glowShadow,
                transition: { duration: 0.18 },
              }
        }
        whileTap={
          disabled || loading
            ? {}
            : {
                scale: 0.95,
                transition: { type: 'spring', stiffness: 500, damping: 20 },
              }
        }
        animate={
          disabled || loading
            ? {}
            : {
                scale: 1,
                transition: { type: 'spring', stiffness: 400, damping: 17 },
              }
        }
      >
        <AnimatePresence mode="wait" initial={false}>
          {loading ? (
            <motion.span
              key="loading"
              className="flex items-center justify-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
            >
              <Spinner />
              <span>Loading…</span>
            </motion.span>
          ) : (
            <motion.span
              key="content"
              className="flex items-center justify-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
            >
              {children}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    )
  }
)

AnimatedButton.displayName = 'AnimatedButton'
