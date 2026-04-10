'use client'

/**
 * Skeleton — premium loading placeholder with shimmer animation.
 *
 * Uses the `.skeleton` class from globals.css for the shimmer effect.
 * Variants give you sensible defaults for common patterns.
 */

import React from 'react'

type SkeletonVariant = 'text' | 'card' | 'image' | 'button' | 'avatar' | 'pill'

interface SkeletonProps {
  variant?: SkeletonVariant
  width?: string | number
  height?: string | number
  className?: string
  count?: number
  /** Spacing between repeated skeletons (only used when count > 1) */
  gap?: number
}

const VARIANT_STYLES: Record<SkeletonVariant, React.CSSProperties> = {
  text:   { width: '100%', height: 14, borderRadius: 4 },
  card:   { width: '100%', height: 180, borderRadius: 12 },
  image:  { width: '100%', height: 240, borderRadius: 12 },
  button: { width: 120, height: 36, borderRadius: 8 },
  avatar: { width: 40, height: 40, borderRadius: '50%' },
  pill:   { width: 80, height: 24, borderRadius: 9999 },
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
  count = 1,
  gap = 8,
}: SkeletonProps) {
  const baseStyle = VARIANT_STYLES[variant]
  const style: React.CSSProperties = {
    ...baseStyle,
    ...(width !== undefined ? { width } : {}),
    ...(height !== undefined ? { height } : {}),
  }

  if (count === 1) {
    return <div className={`skeleton ${className}`} style={style} aria-hidden="true" />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`skeleton ${className}`}
          style={{
            ...style,
            // Last item is a bit shorter so it looks like a paragraph
            ...(variant === 'text' && i === count - 1 ? { width: '70%' } : {}),
          }}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

/**
 * SkeletonCard — pre-built skeleton for a typical content card
 * (avatar + title + 2 lines of text)
 */
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={className}
      style={{
        background: 'rgba(10, 14, 32, 0.5)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Skeleton variant="avatar" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" height={10} />
        </div>
      </div>
      <Skeleton variant="text" count={2} />
    </div>
  )
}

/**
 * SkeletonGrid — grid of skeleton cards for marketplace/gallery loading states
 */
export function SkeletonGrid({ count = 6, columns = 3 }: { count?: number; columns?: number }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap: 16,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
