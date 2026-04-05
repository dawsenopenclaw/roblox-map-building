'use client'

import { useEffect, useRef, createContext, useContext, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastVariant = 'success' | 'error' | 'info' | 'warning' | 'achievement' | 'building'

export interface Toast {
  id: string
  variant: ToastVariant
  title: string
  description?: string
  duration?: number
  /** Show a spinning loader instead of the static icon */
  loading?: boolean
  /** Optional action button */
  action?: { label: string; onClick: () => void }
}

// ─── Sound effects ────────────────────────────────────────────────────────────
//
// Synthesised tones via Web Audio API — no external files, no network requests.
// Sounds respect the user's preference stored in localStorage.

const SOUND_PREF_KEY = 'fg_toast_sounds'

export function getToastSoundsEnabled(): boolean {
  if (typeof window === 'undefined') return false
  try { return localStorage.getItem(SOUND_PREF_KEY) !== '0' } catch { return true }
}

export function setToastSoundsEnabled(on: boolean): void {
  try { localStorage.setItem(SOUND_PREF_KEY, on ? '1' : '0') } catch { /* ignore */ }
}

function playTone(type: 'success' | 'error' | 'info'): void {
  if (!getToastSoundsEnabled()) return
  if (typeof window === 'undefined') return
  const win = window as typeof window & {
    AudioContext?: typeof AudioContext
    webkitAudioContext?: typeof AudioContext
  }
  const AC = win.AudioContext ?? win.webkitAudioContext
  if (!AC) return
  try {
    const ctx = new AC()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    if (type === 'success') {
      // Two ascending notes: E5 then G5
      osc.type = 'sine'
      osc.frequency.setValueAtTime(659, ctx.currentTime)
      osc.frequency.setValueAtTime(784, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.18, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.35)
    } else if (type === 'error') {
      // Low descending buzz: A4 then E4
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(440, ctx.currentTime)
      osc.frequency.setValueAtTime(330, ctx.currentTime + 0.12)
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.3)
    } else {
      // Soft neutral blip: C5
      osc.type = 'sine'
      osc.frequency.setValueAtTime(523, ctx.currentTime)
      gain.gain.setValueAtTime(0.1, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.2)
    }

    osc.onended = () => { void ctx.close() }
  } catch { /* AudioContext may be blocked by browser policy */ }
}

// Map variants to sound type — building/warning play no entry sound
const VARIANT_SOUND: Partial<Record<ToastVariant, 'success' | 'error' | 'info'>> = {
  success:     'success',
  error:       'error',
  info:        'info',
  achievement: 'success',
}

// ─── Config ───────────────────────────────────────────────────────────────────

// Left-border accent colors per variant
const BORDER_ACCENT: Record<ToastVariant, string> = {
  success:     '#4ADE80',   // green
  error:       '#F87171',   // red
  info:        '#D4AF37',   // gold
  warning:     '#FB923C',   // orange
  achievement: '#D4AF37',   // gold
  building:    '#D4AF37',   // gold
}

const ICON_SVG: Record<ToastVariant, React.ReactNode> = {
  success: (
    // Checkmark
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="w-4 h-4">
      <path d="M3 8.5l3.5 3.5 6.5-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  error: (
    // X
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="w-4 h-4">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  info: (
    // Info circle
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="w-4 h-4">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 7.5v4M8 5.5v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  warning: (
    // Warning triangle
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="w-4 h-4">
      <path d="M8 2.5L14.5 13.5H1.5L8 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 6.5v3M8 11v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  achievement: (
    // Star
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className="w-4 h-4">
      <path d="M8 1l1.85 3.8L14 5.6l-3 2.9.7 4.1L8 10.5l-3.7 2.1.7-4.1L2 5.6l4.15-.8L8 1z" />
    </svg>
  ),
  building: (
    // Spinner — rendered as spinning SVG
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
}

const ICON_COLOR: Record<ToastVariant, string> = {
  success:     '#4ADE80',
  error:       '#F87171',
  info:        '#D4AF37',
  warning:     '#FB923C',
  achievement: '#D4AF37',
  building:    '#D4AF37',
}

const PROGRESS_COLOR: Record<ToastVariant, string> = {
  success:     '#4ADE80',
  error:       '#F87171',
  info:        '#D4AF37',
  warning:     '#FB923C',
  achievement: '#D4AF37',
  building:    '#D4AF37',
}

// ─── Confetti (achievement only) ─────────────────────────────────────────────

const CONFETTI_PARTICLES = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  color: i % 2 === 0 ? '#D4AF37' : '#ffffff',
  x: (i / 8) * 100 - 50,
  rotation: i * 45,
}))

function Confetti() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
      {CONFETTI_PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-1 h-1.5 rounded-sm top-2"
          style={{ left: `${50 + p.x * 0.5}%`, background: p.color, rotate: p.rotation }}
          initial={{ y: 0, opacity: 1 }}
          animate={{ y: -24, opacity: 0 }}
          transition={{ duration: 0.7, delay: p.id * 0.06, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

// ─── Dismiss button ───────────────────────────────────────────────────────────

function DismissButton({ onClick }: { onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center opacity-40 hover:opacity-80 transition-opacity focus:outline-none focus:ring-1 focus:ring-white/30"
      aria-label="Dismiss notification"
    >
      <svg viewBox="0 0 12 12" fill="none" aria-hidden="true" className="w-3 h-3">
        <path d="M2 2l8 8M10 2l-8 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  )
}

// ─── Single toast item ────────────────────────────────────────────────────────

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const duration = toast.duration ?? 4000
  const isBuilding = toast.variant === 'building'
  const accentColor = BORDER_ACCENT[toast.variant]
  const progressRef = useRef<HTMLDivElement>(null)

  // Auto-dismiss timer — building variant stays until manually dismissed
  useEffect(() => {
    if (isBuilding) return
    const timer = setTimeout(() => onDismiss(toast.id), duration)
    return () => clearTimeout(timer)
  }, [toast.id, duration, onDismiss, isBuilding])

  // Play sound once on mount
  useEffect(() => {
    const soundType = VARIANT_SOUND[toast.variant]
    if (soundType) playTone(soundType)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <motion.div
      layout
      role="alert"
      aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      // Slide in from right
      initial={{ opacity: 0, x: 80, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.97, transition: { duration: 0.2, ease: 'easeIn' } }}
      transition={{ type: 'spring', stiffness: 340, damping: 26 }}
      className="relative w-80 rounded-xl bg-[#1a1a1a] shadow-2xl overflow-hidden"
      style={{
        // Colored left border accent
        borderLeft: `3px solid ${accentColor}`,
        border: `1px solid rgba(255,255,255,0.07)`,
        borderLeftColor: accentColor,
        borderLeftWidth: '3px',
      }}
    >
      {/* Pulsing border overlay — building variant only */}
      {isBuilding && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{ border: '1px solid rgba(212,175,55,0.5)' }}
          animate={{ opacity: [0.5, 0.12, 0.5] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden="true"
        />
      )}

      {toast.variant === 'achievement' && <Confetti />}

      <div className="flex items-start gap-3 px-4 py-3.5">
        {/* Icon */}
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ color: ICON_COLOR[toast.variant], background: `${accentColor}18` }}
          aria-hidden="true"
        >
          {ICON_SVG[toast.variant]}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-tight">{toast.title}</p>
          {toast.description && (
            <p className="text-xs text-gray-400 mt-0.5 leading-snug">{toast.description}</p>
          )}
          {toast.action && (
            <button
              onClick={(e) => { e.stopPropagation(); toast.action!.onClick() }}
              className="mt-1.5 text-xs font-semibold underline underline-offset-2 text-white hover:opacity-80 transition-opacity"
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {/* X dismiss button */}
        <DismissButton onClick={(e) => { e.stopPropagation(); onDismiss(toast.id) }} />
      </div>

      {/* Shrinking progress bar — not shown on building variant */}
      {!isBuilding && (
        <motion.div
          ref={progressRef}
          className="absolute bottom-0 left-0 h-[2px]"
          style={{ backgroundColor: accentColor }}
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
          aria-hidden="true"
        />
      )}
    </motion.div>
  )
}

// ─── Context + Provider ───────────────────────────────────────────────────────

interface ToastContextValue {
  show: (toast: Omit<Toast, 'id'>) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

/** Maximum number of toasts visible at once. Oldest is dropped when the 4th arrives. */
const MAX_VISIBLE = 3

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const show = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => {
      const next = [...prev, { ...toast, id }]
      // Drop oldest entries beyond the cap
      return next.length > MAX_VISIBLE ? next.slice(next.length - MAX_VISIBLE) : next
    })
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}
      {mounted &&
        createPortal(
          <div
            className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 items-end"
            aria-label="Notifications"
            role="region"
          >
            <AnimatePresence initial={false} mode="sync">
              {toasts.map((t) => (
                <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
              ))}
            </AnimatePresence>
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  )
}

// ─── Fallback no-op context ───────────────────────────────────────────────────

const NOOP_CONTEXT: ToastContextValue = {
  show: () => {},
  dismiss: () => {},
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast() {
  const ctx = useContext(ToastContext)
  // Return a no-op when called outside <ToastProvider> instead of crashing.
  return ctx ?? NOOP_CONTEXT
}

// ─── Sound toggle hook ────────────────────────────────────────────────────────

export function useToastSounds() {
  const [enabled, setEnabled] = useState<boolean>(() => getToastSoundsEnabled())

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev
      setToastSoundsEnabled(next)
      return next
    })
  }, [])

  return { enabled, toggle }
}
