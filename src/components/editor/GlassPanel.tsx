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

export function GlassPanel({
  children,
  className = '',
  padding = 'md',
  glow = false,
  glowColor = '#FFB81C',
  style,
  onClick,
}: GlassPanelProps) {
  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        position: 'relative',
        background: 'rgba(8, 12, 28, 0.65)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: PADDING_MAP[padding],
        boxShadow: glow
          ? `0 0 40px ${glowColor}15, 0 1px 0 rgba(255,255,255,0.04) inset`
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
