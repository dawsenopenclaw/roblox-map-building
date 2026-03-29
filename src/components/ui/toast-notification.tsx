'use client'

import { useEffect, useRef, createContext, useContext, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastVariant = 'success' | 'error' | 'info' | 'achievement'

export interface Toast {
  id: string
  variant: ToastVariant
  title: string
  description?: string
  duration?: number
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
  achievement: {
    border: 'border-[#FFB81C]/50',
    icon: '★',
    bg: 'bg-[#FFB81C]/10',
  },
}

const ICON_COLOR: Record<ToastVariant, string> = {
  success: 'text-emerald-400',
  error: 'text-red-400',
  info: 'text-blue-400',
  achievement: 'text-[#FFB81C]',
}

const PROGRESS_COLOR: Record<ToastVariant, string> = {
  success: 'bg-emerald-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  achievement: 'bg-[#FFB81C]',
}

// ─── Confetti (achievement only) ─────────────────────────────────────────────

const CONFETTI_PARTICLES = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  color: i % 2 === 0 ? '#FFB81C' : '#ffffff',
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
  const duration = toast.duration ?? 4000
  const styles = VARIANT_STYLES[toast.variant]
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), duration)
    return () => clearTimeout(timer)
  }, [toast.id, duration, onDismiss])

  return (
    <motion.div
      layout
      role="alert"
      aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      initial={{ opacity: 0, x: 64, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 64, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className={`relative w-80 rounded-xl border ${styles.border} bg-[#242424]/95 backdrop-blur-sm shadow-2xl overflow-hidden`}
      onClick={() => onDismiss(toast.id)}
      style={{ cursor: 'pointer' }}
    >
      {toast.variant === 'achievement' && <Confetti />}

      <div className="flex items-start gap-3 p-4">
        {/* Icon — decorative, meaning conveyed by text */}
        <div
          className={`w-7 h-7 rounded-full ${styles.bg} flex items-center justify-center flex-shrink-0 text-sm font-bold ${ICON_COLOR[toast.variant]}`}
          aria-hidden="true"
        >
          {styles.icon}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-tight">{toast.title}</p>
          {toast.description && (
            <p className="text-xs text-gray-400 mt-0.5 leading-snug">{toast.description}</p>
          )}
        </div>
      </div>

      {/* Shrinking progress bar — decorative */}
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

  const show = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { ...toast, id }])
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

// ─── Fallback no-op context used when provider isn't mounted ─────────────────

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
