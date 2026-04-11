'use client'

/**
 * BeforeAfterSlider — pure CSS+React reveal slider for comparing two
 * thumbnails or images side by side via a draggable handle.
 *
 * Accessible: keyboard-controllable (arrow keys) and exposes role="slider"
 * with aria-valuenow/min/max so screen readers can describe position.
 */

import { useCallback, useRef, useState, type ReactNode, type KeyboardEvent } from 'react'

export interface BeforeAfterSliderProps {
  /** Left-side (before) content. */
  before: ReactNode
  /** Right-side (after) content. */
  after: ReactNode
  beforeLabel?: string
  afterLabel?: string
  /** Aspect ratio — default 16:9. */
  aspect?: string
}

export default function BeforeAfterSlider({
  before,
  after,
  beforeLabel = 'Before',
  afterLabel = 'After',
  aspect = '16 / 9',
}: BeforeAfterSliderProps) {
  const [pos, setPos] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const next = ((clientX - rect.left) / rect.width) * 100
    setPos(Math.max(0, Math.min(100, next)))
  }, [])

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return
    updateFromClientX(e.clientX)
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    ;(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
    updateFromClientX(e.clientX)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      setPos((p) => Math.max(0, p - 4))
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      setPos((p) => Math.min(100, p + 4))
    } else if (e.key === 'Home') {
      e.preventDefault()
      setPos(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setPos(100)
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full touch-none select-none overflow-hidden rounded-2xl border border-white/10 bg-[#0a0f1a]"
      style={{ aspectRatio: aspect }}
      onPointerMove={onPointerMove}
      onPointerDown={onPointerDown}
    >
      {/* After (background, full) */}
      <div className="absolute inset-0" aria-label={afterLabel}>
        {after}
      </div>
      {/* Before (clipped from the right based on pos) */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        aria-label={beforeLabel}
      >
        {before}
      </div>

      {/* Labels */}
      <span className="absolute left-3 top-3 rounded-md bg-black/70 px-2 py-1 text-xs font-semibold uppercase tracking-wider text-white">
        {beforeLabel}
      </span>
      <span className="absolute right-3 top-3 rounded-md bg-black/70 px-2 py-1 text-xs font-semibold uppercase tracking-wider text-white">
        {afterLabel}
      </span>

      {/* Divider + handle */}
      <div
        role="slider"
        tabIndex={0}
        aria-label={`${beforeLabel} vs ${afterLabel} comparison`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos)}
        onKeyDown={onKeyDown}
        className="absolute inset-y-0 z-10 flex w-1 cursor-ew-resize items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37]"
        style={{
          left: `${pos}%`,
          transform: 'translateX(-50%)',
          background: '#D4AF37',
        }}
      >
        <span
          aria-hidden="true"
          className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#D4AF37] shadow-lg"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2">
            <path d="M9 18l-6-6 6-6" />
            <path d="M15 6l6 6-6 6" />
          </svg>
        </span>
      </div>
    </div>
  )
}
