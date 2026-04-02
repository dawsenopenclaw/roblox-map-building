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
  const glowStyle: React.CSSProperties = glow
    ? { boxShadow: `0 0 0 1px rgba(255,255,255,0.06), 0 0 32px ${glowColor}22, inset 0 0 32px rgba(255,255,255,0.01)` }
    : { boxShadow: '0 0 0 1px rgba(255,255,255,0.05), inset 0 0 24px rgba(255,255,255,0.01)' }

  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        background: 'rgba(255, 255, 255, 0.025)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255, 255, 255, 0.07)',
        borderRadius: '20px',
        padding: PADDING_MAP[padding],
        ...glowStyle,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
