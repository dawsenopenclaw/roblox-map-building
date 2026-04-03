'use client'

import React, { useState, useCallback, useEffect, useRef, createContext, useContext } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  message: string
  type: ToastType
  duration: number
}

interface ToastContext {
  toast: (message: string, type?: ToastType, duration?: number) => void
}

const ToastCtx = createContext<ToastContext>({ toast: () => {} })

export function useToast() {
  return useContext(ToastCtx)
}

// ─── Toast Item ──────────────────────────────────────────────────────────────

const TYPE_STYLES: Record<ToastType, { bg: string; border: string; color: string; icon: string }> = {
  success: { bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.2)', color: '#4ADE80', icon: '✓' },
  error:   { bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)',  color: '#F87171', icon: '✕' },
  info:    { bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.2)', color: '#60A5FA', icon: 'ℹ' },
  warning: { bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)', color: '#FBBF24', icon: '⚠' },
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [exiting, setExiting] = useState(false)
  const s = TYPE_STYLES[toast.type]

  useEffect(() => {
    const t = setTimeout(() => setExiting(true), toast.duration - 300)
    const t2 = setTimeout(() => onDismiss(toast.id), toast.duration)
    return () => { clearTimeout(t); clearTimeout(t2) }
  }, [toast, onDismiss])

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        borderRadius: 10,
        background: s.bg,
        border: `1px solid ${s.border}`,
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        maxWidth: 360,
        animation: exiting ? 'toastOut 0.3s ease-in forwards' : 'toastIn 0.3s ease-out forwards',
        cursor: 'pointer',
      }}
      onClick={() => onDismiss(toast.id)}
    >
      <span style={{ fontSize: 14, color: s.color, fontWeight: 700, flexShrink: 0, width: 18, textAlign: 'center' }}>
        {s.icon}
      </span>
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontFamily: 'Inter, sans-serif', lineHeight: 1.4 }}>
        {toast.message}
      </span>
    </div>
  )
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counterRef = useRef(0)

  const addToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    const id = `toast-${++counterRef.current}`
    setToasts((prev) => [...prev.slice(-4), { id, message, type, duration }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastCtx.Provider value={{ toast: addToast }}>
      {children}
      {/* Toast container */}
      {toasts.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            pointerEvents: 'auto',
          }}
        >
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={removeToast} />
          ))}
        </div>
      )}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(20px) scale(0.95); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes toastOut {
          from { opacity: 1; transform: translateX(0) scale(1); }
          to { opacity: 0; transform: translateX(20px) scale(0.95); }
        }
      `}</style>
    </ToastCtx.Provider>
  )
}
