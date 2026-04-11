'use client'

import * as React from 'react'
import { ToastItem, useToast, type ToastPosition } from './Toast'

export interface ToastCenterProps {
  /** Override container className. */
  className?: string
  /** Override position (defaults to the position from ToastProvider). */
  position?: ToastPosition
}

/**
 * ToastCenter — renders the actual toast stack. Place once in your root layout
 * under <ToastProvider>. Separate from Toast.tsx so headless users can build
 * their own renderer without pulling the default styles.
 *
 * Accessibility:
 * - Wrapper is aria-live="polite" and aria-atomic="false" so screen readers
 *   announce each new toast without re-announcing the whole stack.
 * - Position does not affect reading order — toasts are appended in insertion order.
 */
export function ToastCenter({ className, position }: ToastCenterProps): React.ReactElement | null {
  const { toasts, dismiss, position: ctxPos } = useToast()
  const active = position ?? ctxPos

  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      aria-label="Notifications"
      className={`pointer-events-none fixed z-[10000] flex flex-col gap-2 p-4 ${POSITION_CLASSES[active]} ${className ?? ''}`}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </div>
  )
}

const POSITION_CLASSES: Record<ToastPosition, string> = {
  'top-left': 'top-0 left-0 items-start',
  'top-center': 'top-0 left-1/2 -translate-x-1/2 items-center',
  'top-right': 'top-0 right-0 items-end',
  'bottom-left': 'bottom-0 left-0 items-start',
  'bottom-center': 'bottom-0 left-1/2 -translate-x-1/2 items-center',
  'bottom-right': 'bottom-0 right-0 items-end',
}

export default ToastCenter
