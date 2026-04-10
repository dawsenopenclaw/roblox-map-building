'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { onToast } from '@/lib/notifications'

interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning' | 'achievement'
  title: string
  message?: string
  duration?: number
  action?: { label: string; onClick: () => void }
}

const TYPE_STYLES: Record<Toast['type'], { bg: string; border: string; icon: string }> = {
  success:     { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)',  icon: '\u2713' },
  error:       { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',   icon: '\u2717' },
  info:        { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)',  icon: '\u2139' },
  warning:     { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', icon: '\u26A0' },
  achievement: { bg: 'rgba(212,175,55,0.15)', border: 'rgba(212,175,55,0.4)', icon: '\u2605' },
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const unsubscribe = onToast((toast) => {
      setToasts((prev) => [...prev.slice(-4), toast]) // Keep max 5

      if (toast.duration !== 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toast.id))
        }, toast.duration || 5000)
      }
    })
    return unsubscribe
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  if (toasts.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        maxWidth: 380,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast, i) => {
        const style = TYPE_STYLES[toast.type]
        return (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              background: style.bg,
              backdropFilter: 'blur(16px)',
              border: `1px solid ${style.border}`,
              borderRadius: 12,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              color: '#e5e7eb',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 13,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              animation: 'toastSlideIn 0.25s ease-out forwards',
              opacity: 0,
              transform: 'translateX(40px)',
              animationDelay: `${i * 50}ms`,
              cursor: 'pointer',
            }}
            onClick={() => dismiss(toast.id)}
          >
            <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>
              {style.icon}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: toast.message ? 2 : 0 }}>
                {toast.title}
              </div>
              {toast.message && (
                <div style={{ fontSize: 12, opacity: 0.7, lineHeight: 1.4 }}>
                  {toast.message}
                </div>
              )}
              {toast.action && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toast.action!.onClick()
                    dismiss(toast.id)
                  }}
                  style={{
                    marginTop: 6,
                    padding: '3px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 6,
                    color: '#e5e7eb',
                    cursor: 'pointer',
                  }}
                >
                  {toast.action.label}
                </button>
              )}
            </div>
          </div>
        )
      })}
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
