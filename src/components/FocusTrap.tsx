'use client'

import { useEffect, useRef, type ReactNode } from 'react'

interface FocusTrapProps {
  /** Whether the trap is active. */
  active: boolean
  /** Called when Escape is pressed or focus trap requests close. */
  onClose: () => void
  children: ReactNode
  /** Element ref to return focus to when the trap deactivates. */
  returnFocusRef?: React.RefObject<HTMLElement | null>
}

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'details > summary',
].join(', ')

/**
 * FocusTrap — keeps keyboard focus contained within its children.
 * Use for modals, dialogs, and drawers.
 *
 * - Tab cycles forward through focusable descendants only.
 * - Shift+Tab cycles backward.
 * - Escape calls onClose.
 * - When deactivated, focus returns to returnFocusRef (or the previously active element).
 *
 * @example
 * const triggerRef = useRef<HTMLButtonElement>(null)
 * <button ref={triggerRef} onClick={() => setOpen(true)}>Open</button>
 * <FocusTrap active={open} onClose={() => setOpen(false)} returnFocusRef={triggerRef}>
 *   <dialog>...</dialog>
 * </FocusTrap>
 */
export function FocusTrap({ active, onClose, children, returnFocusRef }: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  // Capture the element that had focus before the trap activated
  const previouslyFocused = useRef<Element | null>(null)

  // Save previously focused element when trap activates; restore on deactivate
  useEffect(() => {
    if (active) {
      previouslyFocused.current = document.activeElement

      // Move focus into the trap on the next tick so the DOM is ready
      const frame = requestAnimationFrame(() => {
        const container = containerRef.current
        if (!container) return
        const first = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)[0]
        first?.focus()
      })
      return () => cancelAnimationFrame(frame)
    } else {
      // Return focus when trap closes
      const target = returnFocusRef?.current ?? (previouslyFocused.current as HTMLElement | null)
      target?.focus()
    }
  }, [active, returnFocusRef])

  // Handle Tab cycling and Escape
  useEffect(() => {
    if (!active) return

    function onKeyDown(e: KeyboardEvent) {
      const container = containerRef.current
      if (!container) return

      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }

      if (e.key !== 'Tab') return

      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
      ).filter((el) => !el.closest('[aria-hidden="true"]'))

      if (focusable.length === 0) {
        e.preventDefault()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (e.shiftKey) {
        // Shift+Tab — wrap from first to last
        if (active === first || !container.contains(active)) {
          e.preventDefault()
          last.focus()
        }
      } else {
        // Tab — wrap from last to first
        if (active === last || !container.contains(active)) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [active, onClose])

  return (
    <div ref={containerRef} style={{ display: 'contents' }}>
      {children}
    </div>
  )
}
