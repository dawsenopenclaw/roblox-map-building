'use client'

import * as React from 'react'

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right'

export interface TooltipProps {
  /** Tooltip content. */
  content: React.ReactNode
  /** Child element to anchor the tooltip to. Must accept a ref. */
  children: React.ReactElement
  /** Preferred placement. Will flip to the opposite side if not enough room. */
  placement?: TooltipPlacement
  /** Delay in ms before showing on hover/focus. Defaults to 250ms. */
  delayMs?: number
  /** Render only when `open` is true (controlled mode). */
  open?: boolean
  /** Optional className for the tooltip bubble. */
  className?: string
  /** Disable the tooltip entirely. */
  disabled?: boolean
}

interface Position {
  top: number
  left: number
  placement: TooltipPlacement
}

/**
 * Accessible tooltip with smart positioning. No external deps.
 *
 * Accessibility:
 * - Child gets aria-describedby pointing at the tooltip.
 * - Tooltip has role="tooltip".
 * - Shows on hover AND focus. Hides on blur, mouseleave, or Escape.
 * - Respects prefers-reduced-motion (no fade).
 *
 * Placement is a hint. If the preferred side would be clipped by the viewport
 * the tooltip flips to the opposite side.
 */
export function Tooltip({
  content,
  children,
  placement = 'top',
  delayMs = 250,
  open: controlledOpen,
  className,
  disabled = false,
}: TooltipProps): React.ReactElement {
  const [uncontrolledOpen, setOpen] = React.useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const [position, setPosition] = React.useState<Position | null>(null)
  const tooltipId = React.useId()
  const triggerRef = React.useRef<HTMLElement | null>(null)
  const tooltipRef = React.useRef<HTMLDivElement | null>(null)
  const showTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = React.useCallback(() => {
    if (disabled || controlledOpen !== undefined) return
    if (showTimer.current) clearTimeout(showTimer.current)
    showTimer.current = setTimeout(() => setOpen(true), delayMs)
  }, [delayMs, disabled, controlledOpen])

  const hide = React.useCallback(() => {
    if (controlledOpen !== undefined) return
    if (showTimer.current) {
      clearTimeout(showTimer.current)
      showTimer.current = null
    }
    setOpen(false)
  }, [controlledOpen])

  React.useEffect(() => {
    if (!open) {
      setPosition(null)
      return
    }
    const trigger = triggerRef.current
    const tip = tooltipRef.current
    if (!trigger || !tip) return
    const tRect = trigger.getBoundingClientRect()
    const tipRect = tip.getBoundingClientRect()
    setPosition(smartPlace(tRect, tipRect, placement))
  }, [open, placement, content])

  React.useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hide()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, hide])

  React.useEffect(() => {
    return () => {
      if (showTimer.current) clearTimeout(showTimer.current)
    }
  }, [])

  const child = children as React.ReactElement<Record<string, unknown>> & {
    ref?: React.Ref<HTMLElement>
  }

  const childProps = child.props as Record<string, unknown>

  const composedRef = (node: HTMLElement | null) => {
    triggerRef.current = node
    const originalRef = (child as unknown as { ref?: React.Ref<HTMLElement> }).ref
    if (typeof originalRef === 'function') originalRef(node)
    else if (originalRef && typeof originalRef === 'object') {
      ;(originalRef as React.MutableRefObject<HTMLElement | null>).current = node
    }
  }

  const mergedProps: Record<string, unknown> = {
    ref: composedRef,
    'aria-describedby': open ? tooltipId : (childProps['aria-describedby'] as string | undefined),
    onMouseEnter: (e: React.MouseEvent) => {
      show()
      const orig = childProps.onMouseEnter as ((e: React.MouseEvent) => void) | undefined
      orig?.(e)
    },
    onMouseLeave: (e: React.MouseEvent) => {
      hide()
      const orig = childProps.onMouseLeave as ((e: React.MouseEvent) => void) | undefined
      orig?.(e)
    },
    onFocus: (e: React.FocusEvent) => {
      show()
      const orig = childProps.onFocus as ((e: React.FocusEvent) => void) | undefined
      orig?.(e)
    },
    onBlur: (e: React.FocusEvent) => {
      hide()
      const orig = childProps.onBlur as ((e: React.FocusEvent) => void) | undefined
      orig?.(e)
    },
  }

  return (
    <>
      {React.cloneElement(child, mergedProps)}
      {open && (
        <div
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          className={`pointer-events-none fixed z-[10003] max-w-xs rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background shadow-lg motion-safe:animate-in motion-safe:fade-in-0 ${className ?? ''}`}
          style={
            position
              ? { top: position.top, left: position.left }
              : { opacity: 0, top: -9999, left: -9999 }
          }
        >
          {content}
        </div>
      )}
    </>
  )
}

function smartPlace(
  trigger: DOMRect,
  tip: DOMRect,
  preferred: TooltipPlacement,
): Position {
  const gap = 8
  const vw = window.innerWidth
  const vh = window.innerHeight

  const candidates: Record<TooltipPlacement, Position> = {
    top: {
      top: trigger.top - tip.height - gap,
      left: trigger.left + trigger.width / 2 - tip.width / 2,
      placement: 'top',
    },
    bottom: {
      top: trigger.bottom + gap,
      left: trigger.left + trigger.width / 2 - tip.width / 2,
      placement: 'bottom',
    },
    left: {
      top: trigger.top + trigger.height / 2 - tip.height / 2,
      left: trigger.left - tip.width - gap,
      placement: 'left',
    },
    right: {
      top: trigger.top + trigger.height / 2 - tip.height / 2,
      left: trigger.right + gap,
      placement: 'right',
    },
  }

  const fits = (p: Position) =>
    p.top >= 0 &&
    p.left >= 0 &&
    p.top + tip.height <= vh &&
    p.left + tip.width <= vw

  const opposite: Record<TooltipPlacement, TooltipPlacement> = {
    top: 'bottom',
    bottom: 'top',
    left: 'right',
    right: 'left',
  }

  const chosen =
    (fits(candidates[preferred]) && candidates[preferred]) ||
    (fits(candidates[opposite[preferred]]) && candidates[opposite[preferred]]) ||
    candidates[preferred]

  // Clamp to viewport
  const clampedLeft = Math.max(4, Math.min(chosen.left, vw - tip.width - 4))
  const clampedTop = Math.max(4, Math.min(chosen.top, vh - tip.height - 4))
  return { ...chosen, top: clampedTop, left: clampedLeft }
}

export default Tooltip
