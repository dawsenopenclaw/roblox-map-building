'use client'

import * as React from 'react'

export interface CreditCounterProps {
  /** Current credit balance. */
  credits: number
  /** Optional plan total — used to render a progress ring/bar. */
  max?: number
  /** Threshold below which the "low balance" warning shows. Defaults to 10. */
  lowThreshold?: number
  /** Animate on mount from 0 → credits. Defaults to true. */
  animateOnMount?: boolean
  /** Duration of the count-up animation in ms. Defaults to 800. */
  animationDurationMs?: number
  /** Called when the user clicks the counter — usually to open a top-up modal. */
  onClick?: () => void
  /** Called when credits drop from non-low to low. */
  onLowBalance?: () => void
  className?: string
  /** Compact one-line variant. */
  compact?: boolean
}

/**
 * Animated credit counter with low-balance warning.
 *
 * Accessibility:
 * - Renders as role="status" with aria-live="polite" so screen readers
 *   announce balance changes.
 * - The aria-label reads as "Credits: N remaining" or "Low credits: N remaining".
 * - Count-up animation respects prefers-reduced-motion.
 */
export function CreditCounter({
  credits,
  max,
  lowThreshold = 10,
  animateOnMount = true,
  animationDurationMs = 800,
  onClick,
  onLowBalance,
  className,
  compact = false,
}: CreditCounterProps): React.ReactElement {
  const [displayed, setDisplayed] = React.useState<number>(animateOnMount ? 0 : credits)
  const previousCreditsRef = React.useRef<number>(credits)
  const prefersReducedMotion = useReducedMotion()

  // Count-up animation
  React.useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayed(credits)
      return
    }
    const start = displayed
    const delta = credits - start
    if (delta === 0) return
    const startTime = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / animationDurationMs)
      const eased = easeOutCubic(t)
      setDisplayed(Math.round(start + delta * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [credits, prefersReducedMotion])

  // Low balance callback
  React.useEffect(() => {
    const prev = previousCreditsRef.current
    if (prev > lowThreshold && credits <= lowThreshold) {
      onLowBalance?.()
    }
    previousCreditsRef.current = credits
  }, [credits, lowThreshold, onLowBalance])

  const isLow = credits <= lowThreshold
  const pct = max && max > 0 ? Math.max(0, Math.min(1, credits / max)) : null
  const ariaLabel = isLow
    ? `Low credits: ${credits} remaining`
    : `Credits: ${credits}${max ? ` of ${max}` : ''} remaining`

  const Wrapper: React.ElementType = onClick ? 'button' : 'div'
  const wrapperProps = onClick
    ? {
        type: 'button' as const,
        onClick,
        className: `focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-full`,
      }
    : {}

  if (compact) {
    return (
      <Wrapper
        role="status"
        aria-live="polite"
        aria-label={ariaLabel}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
          isLow
            ? 'border-red-300 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100'
            : 'border-border bg-muted/50 text-foreground'
        } ${className ?? ''}`}
        {...wrapperProps}
      >
        <svg
          aria-hidden="true"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M13 2L3 14h7l-1 8 11-14h-7l1-6z" />
        </svg>
        <span className="font-mono tabular-nums">{displayed.toLocaleString()}</span>
      </Wrapper>
    )
  }

  return (
    <Wrapper
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
      className={`inline-flex items-center gap-3 rounded-2xl border p-4 transition-colors ${
        isLow
          ? 'border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/30'
          : 'border-border bg-background'
      } ${className ?? ''}`}
      {...wrapperProps}
    >
      <div
        aria-hidden="true"
        className={`flex h-10 w-10 items-center justify-center rounded-full ${
          isLow
            ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
            : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200'
        }`}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M13 2L3 14h7l-1 8 11-14h-7l1-6z" />
        </svg>
      </div>
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          {isLow ? 'Low credits' : 'Credits'}
        </div>
        <div className="text-xl font-bold font-mono tabular-nums">
          {displayed.toLocaleString()}
          {max && (
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              / {max.toLocaleString()}
            </span>
          )}
        </div>
        {pct != null && (
          <div
            className="mt-1.5 h-1.5 w-32 overflow-hidden rounded-full bg-muted"
            role="presentation"
          >
            <div
              className={`h-full transition-all duration-500 ${
                isLow ? 'bg-red-500' : 'bg-amber-500'
              }`}
              style={{ width: `${pct * 100}%` }}
            />
          </div>
        )}
      </div>
    </Wrapper>
  )
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function useReducedMotion(): boolean {
  const [prefers, setPrefers] = React.useState(false)
  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setPrefers(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return prefers
}

export default CreditCounter
