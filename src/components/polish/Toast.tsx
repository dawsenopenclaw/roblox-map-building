'use client'

import * as React from 'react'

export type ToastSeverity = 'info' | 'success' | 'warning' | 'error'
export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface Toast {
  id: string
  title?: string
  description?: string
  severity: ToastSeverity
  durationMs: number
  action?: ToastAction
  createdAt: number
}

export interface ToastOptions {
  title?: string
  description?: string
  severity?: ToastSeverity
  durationMs?: number
  action?: ToastAction
}

export interface ToastContextValue {
  toasts: ReadonlyArray<Toast>
  toast: (opts: ToastOptions) => string
  dismiss: (id: string) => void
  clear: () => void
  position: ToastPosition
  setPosition: (p: ToastPosition) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

export interface ToastProviderProps {
  children: React.ReactNode
  defaultPosition?: ToastPosition
  defaultDurationMs?: number
  /** Maximum number of toasts visible at once. Older ones are auto-dismissed. */
  max?: number
}

/**
 * ToastProvider — global toast store, headless. Render <ToastCenter /> once in
 * your app shell to see toasts.
 *
 * Accessibility:
 * - ToastCenter renders an aria-live region (polite for info/success, assertive
 *   for warning/error) so screen readers announce toasts.
 * - Dismiss buttons are keyboard focusable with aria-labels.
 */
export function ToastProvider({
  children,
  defaultPosition = 'bottom-right',
  defaultDurationMs = 5000,
  max = 5,
}: ToastProviderProps): React.ReactElement {
  const [toasts, setToasts] = React.useState<Toast[]>([])
  const [position, setPosition] = React.useState<ToastPosition>(defaultPosition)
  const timers = React.useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const dismiss = React.useCallback((id: string) => {
    const t = timers.current.get(id)
    if (t) {
      clearTimeout(t)
      timers.current.delete(id)
    }
    setToasts((curr) => curr.filter((x) => x.id !== id))
  }, [])

  const toast = React.useCallback(
    (opts: ToastOptions): string => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      const entry: Toast = {
        id,
        title: opts.title,
        description: opts.description,
        severity: opts.severity ?? 'info',
        durationMs: opts.durationMs ?? defaultDurationMs,
        action: opts.action,
        createdAt: Date.now(),
      }
      setToasts((curr) => {
        const next = [...curr, entry]
        while (next.length > max) {
          const popped = next.shift()
          if (popped) {
            const t = timers.current.get(popped.id)
            if (t) clearTimeout(t)
            timers.current.delete(popped.id)
          }
        }
        return next
      })
      if (entry.durationMs > 0) {
        const t = setTimeout(() => dismiss(id), entry.durationMs)
        timers.current.set(id, t)
      }
      return id
    },
    [defaultDurationMs, dismiss, max],
  )

  const clear = React.useCallback(() => {
    for (const t of timers.current.values()) clearTimeout(t)
    timers.current.clear()
    setToasts([])
  }, [])

  React.useEffect(() => {
    return () => {
      for (const t of timers.current.values()) clearTimeout(t)
      timers.current.clear()
    }
  }, [])

  const value = React.useMemo<ToastContextValue>(
    () => ({ toasts, toast, dismiss, clear, position, setPosition }),
    [toasts, toast, dismiss, clear, position],
  )

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

/** Hook to access the toast API. Must be used within <ToastProvider>. */
export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within <ToastProvider>')
  }
  return ctx
}

/** Single toast view — rendered by ToastCenter. Exposed for custom layouts. */
export function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast
  onDismiss: (id: string) => void
}): React.ReactElement {
  const palette = SEVERITY_STYLES[toast.severity]
  return (
    <div
      role={toast.severity === 'error' || toast.severity === 'warning' ? 'alert' : 'status'}
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border p-4 shadow-lg transition-all ${palette.bg} ${palette.border}`}
    >
      <div className={`mt-0.5 h-2 w-2 flex-shrink-0 rounded-full ${palette.dot}`} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className={`text-sm font-semibold ${palette.text}`}>{toast.title}</p>
        )}
        {toast.description && (
          <p className={`text-sm ${palette.textMuted}`}>{toast.description}</p>
        )}
        {toast.action && (
          <button
            type="button"
            onClick={() => {
              toast.action?.onClick()
              onDismiss(toast.id)
            }}
            className={`mt-2 text-sm font-medium underline-offset-2 hover:underline ${palette.text}`}
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className={`flex-shrink-0 rounded p-1 transition-colors hover:bg-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${palette.text}`}
      >
        <svg
          aria-hidden="true"
          width="14"
          height="14"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="4" y1="4" x2="16" y2="16" />
          <line x1="16" y1="4" x2="4" y2="16" />
        </svg>
      </button>
    </div>
  )
}

interface SeverityStyles {
  bg: string
  border: string
  text: string
  textMuted: string
  dot: string
}

const SEVERITY_STYLES: Record<ToastSeverity, SeverityStyles> = {
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    border: 'border-blue-200 dark:border-blue-900',
    text: 'text-blue-900 dark:text-blue-100',
    textMuted: 'text-blue-800/80 dark:text-blue-200/80',
    dot: 'bg-blue-500',
  },
  success: {
    bg: 'bg-green-50 dark:bg-green-950/40',
    border: 'border-green-200 dark:border-green-900',
    text: 'text-green-900 dark:text-green-100',
    textMuted: 'text-green-800/80 dark:text-green-200/80',
    dot: 'bg-green-500',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-900',
    text: 'text-amber-900 dark:text-amber-100',
    textMuted: 'text-amber-800/80 dark:text-amber-200/80',
    dot: 'bg-amber-500',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-950/40',
    border: 'border-red-200 dark:border-red-900',
    text: 'text-red-900 dark:text-red-100',
    textMuted: 'text-red-800/80 dark:text-red-200/80',
    dot: 'bg-red-500',
  },
}
