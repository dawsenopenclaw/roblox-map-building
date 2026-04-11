'use client'

import * as React from 'react'

export interface OnboardingStep {
  /** Unique id for the step. */
  id: string
  /** CSS selector of the element to highlight. Pass null for a center-screen step. */
  target: string | null
  /** Headline shown in the tooltip. */
  title: string
  /** Body copy shown under the headline. */
  body: string
  /** Where to place the tooltip relative to the target. */
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center'
}

export interface OnboardingTourProps {
  open: boolean
  steps: OnboardingStep[]
  onComplete: () => void
  onSkip?: () => void
  /** Starting step index. */
  startIndex?: number
}

interface TargetRect {
  top: number
  left: number
  width: number
  height: number
}

/**
 * Guided tour with overlay highlighting + tooltip + step navigation.
 *
 * Accessibility:
 * - Tooltip is role="dialog" with aria-modal="true".
 * - Arrow keys navigate between steps, Esc skips the tour.
 * - Focus is moved to the tooltip on each step change.
 * - A visually-hidden live region announces "Step X of Y: Title" on each step.
 * - When prefers-reduced-motion is set, the highlight does not animate.
 */
export function OnboardingTour({
  open,
  steps,
  onComplete,
  onSkip,
  startIndex = 0,
}: OnboardingTourProps): React.ReactElement | null {
  const [index, setIndex] = React.useState(startIndex)
  const [rect, setRect] = React.useState<TargetRect | null>(null)
  const tooltipRef = React.useRef<HTMLDivElement | null>(null)

  const step = steps[index]

  React.useEffect(() => {
    if (!open) setIndex(startIndex)
  }, [open, startIndex])

  React.useEffect(() => {
    if (!open || !step) return

    const update = () => {
      if (!step.target) {
        setRect(null)
        return
      }
      const el = document.querySelector(step.target)
      if (!el) {
        setRect(null)
        return
      }
      const r = el.getBoundingClientRect()
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
      // Ensure the highlighted element is visible
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open, step])

  React.useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onSkip?.()
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault()
        next()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        prev()
      }
    }
    document.addEventListener('keydown', handleKey)
    tooltipRef.current?.focus()
    return () => document.removeEventListener('keydown', handleKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index])

  const next = React.useCallback(() => {
    if (index < steps.length - 1) setIndex(index + 1)
    else onComplete()
  }, [index, steps.length, onComplete])

  const prev = React.useCallback(() => {
    if (index > 0) setIndex(index - 1)
  }, [index])

  if (!open || !step) return null

  const tooltipStyle = computeTooltipPosition(rect, step.placement ?? 'bottom')

  return (
    <div className="fixed inset-0 z-[10002]">
      <span role="status" aria-live="polite" className="sr-only">
        Step {index + 1} of {steps.length}: {step.title}
      </span>
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <mask id="forje-tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={rect.left - 8}
                y={rect.top - 8}
                width={rect.width + 16}
                height={rect.height + 16}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.7)"
          mask="url(#forje-tour-mask)"
        />
      </svg>
      {rect && (
        <div
          aria-hidden="true"
          className="absolute rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-transparent transition-all motion-reduce:transition-none"
          style={{
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
          }}
        />
      )}
      <div
        ref={tooltipRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`forje-tour-title-${step.id}`}
        tabIndex={-1}
        className="absolute max-w-sm rounded-xl border border-border bg-background p-5 shadow-2xl focus:outline-none"
        style={tooltipStyle}
      >
        <h3 id={`forje-tour-title-${step.id}`} className="text-base font-semibold">
          {step.title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {index + 1} / {steps.length}
          </span>
          <div className="flex items-center gap-2">
            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Skip
              </button>
            )}
            <button
              type="button"
              onClick={prev}
              disabled={index === 0}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Back
            </button>
            <button
              type="button"
              onClick={next}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {index === steps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function computeTooltipPosition(
  rect: TargetRect | null,
  placement: NonNullable<OnboardingStep['placement']>,
): React.CSSProperties {
  if (!rect || placement === 'center') {
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    }
  }
  const gap = 16
  switch (placement) {
    case 'top':
      return {
        top: rect.top - gap,
        left: rect.left + rect.width / 2,
        transform: 'translate(-50%, -100%)',
      }
    case 'bottom':
      return {
        top: rect.top + rect.height + gap,
        left: rect.left + rect.width / 2,
        transform: 'translate(-50%, 0)',
      }
    case 'left':
      return {
        top: rect.top + rect.height / 2,
        left: rect.left - gap,
        transform: 'translate(-100%, -50%)',
      }
    case 'right':
      return {
        top: rect.top + rect.height / 2,
        left: rect.left + rect.width + gap,
        transform: 'translate(0, -50%)',
      }
  }
}

export default OnboardingTour
