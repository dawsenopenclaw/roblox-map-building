'use client'

import * as React from 'react'

export interface ShortcutEntry {
  /** Human-readable name. */
  label: string
  /** Array of key tokens to render as <kbd>. E.g. ['Ctrl', 'K']. */
  keys: string[]
  /** Optional longer description, shown as tooltip/caption. */
  description?: string
}

export interface ShortcutGroup {
  category: string
  shortcuts: ShortcutEntry[]
}

export interface KeyboardShortcutsModalProps {
  open: boolean
  onClose: () => void
  groups: ShortcutGroup[]
  /** Optional title override. */
  title?: string
}

/**
 * Pretty modal showing all keyboard shortcuts grouped by category.
 *
 * Accessibility:
 * - Rendered as role="dialog" with aria-modal="true" and an aria-labelledby
 *   pointing at the heading.
 * - ESC key closes the modal.
 * - Focus is trapped within the modal while open. Focus returns to the previously
 *   focused element on close.
 * - Backdrop click closes the dialog.
 * - <kbd> elements have descriptive aria-labels for screen readers.
 */
export function KeyboardShortcutsModal({
  open,
  onClose,
  groups,
  title = 'Keyboard shortcuts',
}: KeyboardShortcutsModalProps): React.ReactElement | null {
  const headingId = React.useId()
  const dialogRef = React.useRef<HTMLDivElement | null>(null)
  const previousFocusRef = React.useRef<HTMLElement | null>(null)

  React.useEffect(() => {
    if (!open) return

    previousFocusRef.current = (document.activeElement as HTMLElement | null) ?? null

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'Tab') {
        // Simple focus trap
        const root = dialogRef.current
        if (!root) return
        const focusables = root.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', handleKey)

    // Focus first focusable inside the dialog
    const t = setTimeout(() => {
      const root = dialogRef.current
      const focusable = root?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      focusable?.focus()
    }, 0)

    return () => {
      document.removeEventListener('keydown', handleKey)
      clearTimeout(t)
      previousFocusRef.current?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="relative z-10 w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-background shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 id={headingId} className="text-lg font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close keyboard shortcuts"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <svg
              aria-hidden="true"
              width="18"
              height="18"
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
        <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
          {groups.map((group) => (
            <section key={group.category} className="mb-6 last:mb-0">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.category}
              </h3>
              <ul className="flex flex-col gap-2">
                {group.shortcuts.map((s) => (
                  <li
                    key={s.label}
                    className="flex items-center justify-between gap-4 rounded-md px-3 py-2 text-sm hover:bg-muted/40"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{s.label}</div>
                      {s.description && (
                        <div className="text-xs text-muted-foreground">{s.description}</div>
                      )}
                    </div>
                    <div
                      className="flex items-center gap-1"
                      aria-label={`Shortcut: ${s.keys.join(' plus ')}`}
                    >
                      {s.keys.map((k, i) => (
                        <React.Fragment key={i}>
                          {i > 0 && (
                            <span className="text-xs text-muted-foreground" aria-hidden="true">
                              +
                            </span>
                          )}
                          <kbd className="rounded border border-border bg-muted px-2 py-0.5 text-xs font-mono font-semibold">
                            {k}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

export default KeyboardShortcutsModal
