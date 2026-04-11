'use client'

import * as React from 'react'

export type ShimmerVariant = 'text' | 'card' | 'image' | 'list' | 'avatar' | 'button'

export interface LoadingShimmerProps {
  variant?: ShimmerVariant
  /** Number of skeleton lines (text variant) or list items (list variant). */
  count?: number
  /** Extra className for outer wrapper. */
  className?: string
  /** Override width — accepts any CSS value. */
  width?: string
  /** Override height — accepts any CSS value. */
  height?: string
  /** Reduce motion override — disables the shimmer animation. */
  disableAnimation?: boolean
}

/**
 * Content-aware skeleton loaders. Pure CSS — no JS animations, no canvas.
 *
 * Accessibility:
 * - Wrapper carries role="status" and aria-busy="true" so screen readers know
 *   content is loading. A visually hidden label announces "Loading" once.
 * - Respects `prefers-reduced-motion` via the CSS class below; can be forced off
 *   with `disableAnimation`.
 *
 * Variants:
 * - text: multiple lines of varying width
 * - card: image placeholder + 2 text lines
 * - image: single rectangular block
 * - list: repeating row of avatar + 2 text lines
 * - avatar: round circle
 * - button: pill shape
 */
export function LoadingShimmer({
  variant = 'text',
  count = 3,
  className,
  width,
  height,
  disableAnimation = false,
}: LoadingShimmerProps): React.ReactElement {
  const shimmerClass = disableAnimation ? 'forje-shimmer-static' : 'forje-shimmer'
  const style: React.CSSProperties = {}
  if (width) style.width = width
  if (height) style.height = height

  return (
    <>
      <style>{SHIMMER_CSS}</style>
      <div
        role="status"
        aria-busy="true"
        aria-live="polite"
        className={className}
      >
        <span className="sr-only">Loading…</span>
        {variant === 'text' && renderText(shimmerClass, count, style)}
        {variant === 'card' && renderCard(shimmerClass)}
        {variant === 'image' && renderImage(shimmerClass, style)}
        {variant === 'list' && renderList(shimmerClass, count)}
        {variant === 'avatar' && renderAvatar(shimmerClass, style)}
        {variant === 'button' && renderButton(shimmerClass, style)}
      </div>
    </>
  )
}

function renderText(cls: string, count: number, style: React.CSSProperties): React.ReactElement {
  return (
    <div className="flex flex-col gap-2" style={style}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${cls} h-4 rounded`}
          style={{ width: i === count - 1 ? '70%' : '100%' }}
        />
      ))}
    </div>
  )
}

function renderCard(cls: string): React.ReactElement {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div className={`${cls} h-40 w-full rounded-md`} />
      <div className={`${cls} h-5 w-3/4 rounded`} />
      <div className={`${cls} h-4 w-1/2 rounded`} />
    </div>
  )
}

function renderImage(cls: string, style: React.CSSProperties): React.ReactElement {
  const defaults: React.CSSProperties = { width: '100%', height: '200px' }
  return <div className={`${cls} rounded-md`} style={{ ...defaults, ...style }} />
}

function renderList(cls: string, count: number): React.ReactElement {
  return (
    <ul className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="flex items-center gap-3">
          <div className={`${cls} h-10 w-10 rounded-full flex-shrink-0`} />
          <div className="flex flex-1 flex-col gap-2">
            <div className={`${cls} h-4 w-1/2 rounded`} />
            <div className={`${cls} h-3 w-2/3 rounded`} />
          </div>
        </li>
      ))}
    </ul>
  )
}

function renderAvatar(cls: string, style: React.CSSProperties): React.ReactElement {
  const defaults: React.CSSProperties = { width: '40px', height: '40px' }
  return <div className={`${cls} rounded-full`} style={{ ...defaults, ...style }} />
}

function renderButton(cls: string, style: React.CSSProperties): React.ReactElement {
  const defaults: React.CSSProperties = { width: '120px', height: '40px' }
  return <div className={`${cls} rounded-full`} style={{ ...defaults, ...style }} />
}

const SHIMMER_CSS = `
.forje-shimmer {
  background: linear-gradient(
    90deg,
    rgba(120, 120, 120, 0.08) 0%,
    rgba(120, 120, 120, 0.18) 50%,
    rgba(120, 120, 120, 0.08) 100%
  );
  background-size: 200% 100%;
  animation: forjeShimmerSlide 1.4s ease-in-out infinite;
}
.forje-shimmer-static {
  background: rgba(120, 120, 120, 0.12);
}
@keyframes forjeShimmerSlide {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
@media (prefers-reduced-motion: reduce) {
  .forje-shimmer {
    animation: none;
    background: rgba(120, 120, 120, 0.12);
  }
}
`

export default LoadingShimmer
