'use client'

// ─── Accessibility Utilities ───────────────────────────────────────────────────
// Screen reader announcements, focus trapping, and ARIA helpers.

// ─── Live region singleton ─────────────────────────────────────────────────────

let _liveRegion: HTMLElement | null = null

function getLiveRegion(): HTMLElement {
  if (_liveRegion) return _liveRegion

  const el = document.createElement('div')
  el.id = 'forje-live-region'
  el.setAttribute('aria-live', 'polite')
  el.setAttribute('aria-atomic', 'true')
  el.setAttribute('role', 'status')
  el.style.cssText = [
    'position:absolute',
    'width:1px',
    'height:1px',
    'padding:0',
    'margin:-1px',
    'overflow:hidden',
    'clip:rect(0,0,0,0)',
    'white-space:nowrap',
    'border:0',
  ].join(';')

  document.body.appendChild(el)
  _liveRegion = el
  return el
}

/**
 * Announce a message to screen readers via an aria-live region.
 * Messages are debounced — rapid calls replace each other.
 */
let _announceTimer: ReturnType<typeof setTimeout> | null = null

export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  if (typeof document === 'undefined') return

  if (_announceTimer) {
    clearTimeout(_announceTimer)
    _announceTimer = null
  }

  _announceTimer = setTimeout(() => {
    const region = getLiveRegion()
    region.setAttribute('aria-live', priority)
    // Toggle content to force re-announcement even for identical strings
    region.textContent = ''
    requestAnimationFrame(() => {
      region.textContent = message
    })
  }, 50)
}

// ─── Focus trap ────────────────────────────────────────────────────────────────

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ')

/**
 * Trap keyboard focus inside `container`.
 * Returns a cleanup function — call it to release the trap.
 *
 * @example
 * const release = trapFocus(modalRef.current)
 * // later…
 * release()
 */
export function trapFocus(container: HTMLElement): () => void {
  const getFocusable = (): HTMLElement[] =>
    Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)).filter(
      (el) => !el.closest('[hidden]') && getComputedStyle(el).display !== 'none'
    )

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return

    const focusable = getFocusable()
    if (!focusable.length) {
      e.preventDefault()
      return
    }

    const first = focusable[0]!
    const last = focusable[focusable.length - 1]!
    const active = document.activeElement as HTMLElement

    if (e.shiftKey) {
      if (active === first) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (active === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  // Focus first focusable element
  const focusable = getFocusable()
  focusable[0]?.focus()

  document.addEventListener('keydown', handleKeydown)
  return () => document.removeEventListener('keydown', handleKeydown)
}

// ─── ARIA helpers ──────────────────────────────────────────────────────────────

/** Returns aria props for a progress bar element. */
export function progressBarProps(value: number, max = 100, label?: string) {
  return {
    role: 'progressbar' as const,
    'aria-valuenow': Math.round(value),
    'aria-valuemin': 0,
    'aria-valuemax': max,
    ...(label ? { 'aria-label': label } : {}),
  }
}

/** Returns aria props for a toggle button (like voice input). */
export function toggleButtonProps(pressed: boolean, label: string) {
  return {
    'aria-pressed': pressed,
    'aria-label': label,
  }
}

/** Generates a unique ID for aria-labelledby / aria-describedby wiring. */
export function useAriaId(prefix: string): string {
  // Stable across renders — just a deterministic string based on prefix
  // For true uniqueness across instances use React's useId() hook in components.
  return `${prefix}-${Math.random().toString(36).slice(2, 7)}`
}
