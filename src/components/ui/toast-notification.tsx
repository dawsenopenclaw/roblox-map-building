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

const VARIANT_STYLES: Record<ToastVariant, { border: string; icon: string; bg: string }> = {
  success: {
    border: 'border-emerald-500/40',
    icon: '✓',
    bg: 'bg-emerald-500/10',
  },
  error: {
    border: 'border-red-500/40',
    icon: '✕',
    bg: 'bg-red-500/10',
  },
  info: {
    border: 'border-blue-500/40',
    icon: 'i',
    bg: 'bg-blue-500/10',
  },
  warning: {
    border: 'border-[#D4AF37]/40',
    icon: '!',
    bg: 'bg-[#D4AF37]/10',
  },
  achievement: {
    border: 'border-[#D4AF37]/50',
    icon: '★',
    bg: 'bg-[#D4AF37]/10',
  },
  building: {
    border: 'border-[#D4AF37]/50',
    icon: '⚙',
    bg: 'bg-[#D4AF37]/10',
  },
}

const ICON_COLOR: Record<ToastVariant, string> = {
  success:     'text-emerald-400',
  error:       'text-red-400',
  info:        'text-blue-400',
  warning:     'text-[#D4AF37]',
  achievement: 'text-[#D4AF37]',
  building:    'text-[#D4AF37]',
}

const PROGRESS_COLOR: Record<ToastVariant, string> = {
  success:     'bg-emerald-500',
  error:       'bg-red-500',
  info:        'bg-blue-500',
  warning:     'bg-[#D4AF37]',
  achievement: 'bg-[#D4AF37]',
  building:    'bg-[#D4AF37]',
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

// ─── Single toast item ────────────────────────────────────────────────────────

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const duration = toast.duration ?? 5000
  const styles = VARIANT_STYLES[toast.variant]
  const progressRef = useRef<HTMLDivElement>(null)
  const isBuilding = toast.variant === 'building'

  // Auto-dismiss timer
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), duration)
    return () => clearTimeout(timer)
  }, [toast.id, duration, onDismiss])

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
      initial={{ opacity: 0, x: 64, y: -8, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 64, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className={`relative w-80 rounded-xl border ${styles.border} bg-[#141414]/95 backdrop-blur-sm shadow-2xl overflow-hidden`}
      onClick={() => onDismiss(toast.id)}
      style={{ cursor: 'pointer' }}
    >
      {/* Pulsing border overlay — building variant only */}
      {isBuilding && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{ border: '1px solid rgba(212,175,55,0.6)' }}
          animate={{ opacity: [0.6, 0.15, 0.6] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden="true"
        />
      )}

      {toast.variant === 'achievement' && <Confetti />}

      <div className="flex items-start gap-3 p-4">
        {/* Icon / spinner */}
        <div
          className={`w-7 h-7 rounded-full ${styles.bg} flex items-center justify-center flex-shrink-0 text-sm font-bold ${ICON_COLOR[toast.variant]}`}
          aria-hidden="true"
        >
          {(toast.loading || isBuilding) ? (
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          ) : (
            styles.icon
          )}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-tight">{toast.title}</p>
          {toast.description && (
            <p className="text-xs text-gray-300 mt-0.5 leading-snug">{toast.description}</p>
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
      </div>

      {/* Shrinking progress bar */}
      <motion.div
        ref={progressRef}
        className={`absolute bottom-0 left-0 h-0.5 ${PROGRESS_COLOR[toast.variant]}`}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
        aria-hidden="true"
      />
    </motion.div>
  )
}

// ─── Context + Provider ───────────────────────────────────────────────────────

interface ToastContextValue {
  show: (toast: Omit<Toast, 'id'>) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const MAX_TOASTS = 5

  const show = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => {
      const next = [...prev, { ...toast, id }]
      // Cap at MAX_TOASTS — drop oldest when limit exceeded
      return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next
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
            className="fixed bottom-4 right-4 z-[9999] flex flex-col-reverse gap-2 items-end"
            aria-label="Notifications"
            role="region"
          >
            <AnimatePresence initial={false}>
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

// ─── Fallback no-op context used when provider is not mounted ─────────────────

const NOOP_CONTEXT: ToastContextValue = {
  show: () => {},
  dismiss: () => {},
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast() {
  const ctx = useContext(ToastContext)
  // Return a no-op implementation instead of throwing so callers outside
  // <ToastProvider> fail silently rather than crashing the component tree.
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
