'use client'

// ─── Browser Compatibility Utilities ──────────────────────────────────────────
// Feature detection + fallbacks for all new editor features.
// Safe to call SSR (all checks guard typeof window).

// ─── Feature detection ─────────────────────────────────────────────────────────

function detectSpeechRecognition(): boolean {
  if (typeof window === 'undefined') return false
  const win = window as typeof window & {
    SpeechRecognition?: unknown
    webkitSpeechRecognition?: unknown
  }
  return Boolean(win.SpeechRecognition ?? win.webkitSpeechRecognition)
}

function detectClipboard(): boolean {
  if (typeof window === 'undefined') return false
  return Boolean(navigator.clipboard?.writeText)
}

function detectWebGL(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return Boolean(
      canvas.getContext('webgl') ?? canvas.getContext('experimental-webgl')
    )
  } catch {
    return false
  }
}

function detectServiceWorker(): boolean {
  if (typeof window === 'undefined') return false
  return 'serviceWorker' in navigator
}

function detectBackdropFilter(): boolean {
  if (typeof window === 'undefined') return false
  return CSS.supports('backdrop-filter', 'blur(1px)') ||
    CSS.supports('-webkit-backdrop-filter', 'blur(1px)')
}

function detectAbortController(): boolean {
  if (typeof window === 'undefined') return true // Node/SSR always has it
  return typeof AbortController !== 'undefined'
}

// ─── Exported support map ──────────────────────────────────────────────────────

export interface BrowserSupport {
  speechRecognition: boolean
  clipboard: boolean
  webGL: boolean
  serviceWorker: boolean
  backdropFilter: boolean
  abortController: boolean
}

// Cached lazily — computed once per page load
let _cache: BrowserSupport | null = null

export function getBrowserSupport(): BrowserSupport {
  if (_cache) return _cache
  _cache = {
    speechRecognition: detectSpeechRecognition(),
    clipboard: detectClipboard(),
    webGL: detectWebGL(),
    serviceWorker: detectServiceWorker(),
    backdropFilter: detectBackdropFilter(),
    abortController: detectAbortController(),
  }
  return _cache
}

// Convenience re-export for common checks
export const browserSupport = {
  get speechRecognition() { return detectSpeechRecognition() },
  get clipboard()         { return detectClipboard() },
  get webGL()             { return detectWebGL() },
  get serviceWorker()     { return detectServiceWorker() },
}

// ─── Clipboard fallback ────────────────────────────────────────────────────────
// Uses modern Clipboard API with execCommand fallback for older browsers.

export async function writeToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined') return false

  // Modern path
  if (detectClipboard()) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Fall through to legacy
    }
  }

  // Legacy execCommand fallback
  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    return ok
  } catch {
    return false
  }
}

// ─── Unsupported browser detection ────────────────────────────────────────────
// Returns a warning string when the browser lacks critical editor features,
// or null when everything looks fine.

export function getCompatibilityWarning(): string | null {
  if (typeof window === 'undefined') return null

  const ua = navigator.userAgent

  // IE 11
  if (ua.includes('Trident/')) {
    return 'Internet Explorer is not supported. Please use Chrome, Edge, Firefox, or Safari.'
  }

  // Very old Safari (< 14) — lacks many modern APIs
  const safariMatch = ua.match(/Version\/(\d+).*Safari/)
  if (safariMatch) {
    const version = parseInt(safariMatch[1] ?? '0', 10)
    if (version < 14) {
      return 'Safari 13 and older have limited support. Please update to Safari 14+ for the best experience.'
    }
  }

  return null
}

// ─── Media query helpers ───────────────────────────────────────────────────────

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
