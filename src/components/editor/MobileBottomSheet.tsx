'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'

interface MobileBottomSheetProps {
  /** Whether the sheet is open */
  open: boolean
  /** Called when the user dismisses the sheet (backdrop click, drag-down, close button, Esc) */
  onClose: () => void
  /** Title shown in the sheet header */
  title?: string
  /** Body content */
  children: React.ReactNode
  /** Optional height as vh — defaults to 80 */
  heightVh?: number
}

/**
 * Mobile-only slide-up bottom sheet.
 *
 * - Takes 80% of screen height by default
 * - Drag handle at top to dismiss (pull-down gesture)
 * - Backdrop overlay dismisses on tap
 * - Smooth spring-ish animation via CSS transitions
 * - Locks body scroll while open
 */
export function MobileBottomSheet({
  open,
  onClose,
  title,
  children,
  heightVh = 80,
}: MobileBottomSheetProps) {
  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  // State (not ref) so that toggling dragging triggers a re-render and the
  // inline `transition` style updates in sync with the drag gesture.
  // A ref is invisible to React and left the sheet with its easing
  // transition applied during drag, which made the sheet feel laggy.
  const [isDragging, setIsDragging] = useState(false)
  const dragStartY = useRef<number | null>(null)

  // Mount/unmount with animation
  useEffect(() => {
    if (open) {
      setMounted(true)
      // Next frame → trigger enter transition
      const id = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(id)
    } else {
      setVisible(false)
      // Delay unmount until exit transition completes
      const id = setTimeout(() => setMounted(false), 280)
      return () => clearTimeout(id)
    }
  }, [open])

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  // Esc to close
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragStartY.current = e.clientY
    setIsDragging(true)
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }, [])

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || dragStartY.current == null) return
      const delta = e.clientY - dragStartY.current
      // Only allow drag-down
      setDragOffset(Math.max(0, delta))
    },
    [isDragging],
  )

  const onPointerUp = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)
    const offset = dragOffset
    dragStartY.current = null
    // Dismiss if dragged more than 100px
    if (offset > 100) {
      onClose()
      setDragOffset(0)
    } else {
      // Snap back
      setDragOffset(0)
    }
  }, [dragOffset, isDragging, onClose])

  if (!mounted) return null

  const sheetHeight = `${heightVh}vh`
  const translateY = visible ? `${dragOffset}px` : '100%'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title ?? 'Panel'}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        pointerEvents: 'auto',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.28s ease-out',
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: sheetHeight,
          maxHeight: sheetHeight,
          background: 'rgba(10,14,28,0.98)',
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          borderTop: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 -12px 48px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transform: `translateY(${translateY})`,
          transition: isDragging
            ? 'none'
            : 'transform 0.32s cubic-bezier(0.22, 1, 0.36, 1)',
          touchAction: 'none',
        }}
      >
        {/* Drag handle area */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 10,
            paddingBottom: 6,
            cursor: 'grab',
            touchAction: 'none',
          }}
          aria-label="Drag to dismiss"
          role="button"
        >
          <div
            style={{
              width: 44,
              height: 5,
              borderRadius: 999,
              background: 'rgba(255,255,255,0.25)',
            }}
          />
        </div>

        {/* Title bar */}
        {title && (
          <div
            style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 18px 12px',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.9)',
                letterSpacing: '-0.01em',
              }}
            >
              {title}
            </span>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                width: 44,
                height: 44,
                minWidth: 44,
                minHeight: 44,
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                color: 'rgba(255,255,255,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                marginRight: -10,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}

        {/* Body */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: 16,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
