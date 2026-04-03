'use client'

import React from 'react'

type PaddingSize = 'none' | 'sm' | 'md' | 'lg'

interface GlassPanelProps {
  children: React.ReactNode
  className?: string
  padding?: PaddingSize
  glow?: boolean
  glowColor?: string
  style?: React.CSSProperties
  onClick?: () => void
}

const PADDING_MAP: Record<PaddingSize, string> = {
  none: '0px',
  sm:   '12px',
  md:   '16px',
  lg:   '24px',
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export function GlassPanel({
  children,
  className = '',
  padding = 'md',
  glow = false,
  glowColor = '#FFB81C',
  style,
  onClick,
}: GlassPanelProps) {
  const interactive = !!onClick
  return (
    <div
      className={className}
      onClick={onClick}
      onKeyDown={interactive ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.() } } : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      style={{
        position: 'relative',
        background: 'rgba(8, 12, 28, 0.65)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16,
        overflow: 'hidden',
        padding: PADDING_MAP[padding],
        cursor: interactive ? 'pointer' : undefined,
        boxShadow: glow
          ? `0 0 40px ${hexToRgba(glowColor, 0.08)}, 0 1px 0 rgba(255,255,255,0.04) inset`
          : '0 1px 0 rgba(255,255,255,0.03) inset',
        ...style,
      }}
    >
      {/* Subtle top edge highlight */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: '15%',
          right: '15%',
          height: 1,
          borderRadius: '16px 16px 0 0',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>
        {children}
      </div>
    </div>
  )
}
