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
    ? { boxShadow: `0 0 0 1px rgba(255,255,255,0.06), 0 0 48px ${glowColor}28, 0 0 80px ${glowColor}10, inset 0 0 40px rgba(255,255,255,0.015)` }
    : { boxShadow: '0 0 0 1px rgba(255,255,255,0.05), inset 0 0 32px rgba(255,255,255,0.012)' }

  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        position: 'relative',
        background: 'rgba(6, 4, 22, 0.55)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        borderRadius: '20px',
        padding: PADDING_MAP[padding],
        ...glowStyle,
        ...style,
      }}
    >
      {/* Animated border glow — pseudo-border via inset shadow + outline trick */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '20px',
          padding: '1px',
          background: 'linear-gradient(135deg, rgba(56,189,248,0.18), rgba(139,92,246,0.18), rgba(212,175,55,0.14), rgba(56,189,248,0.12))',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          pointerEvents: 'none',
          animation: 'glassBorderShift 8s linear infinite',
        }}
      />
      {/* Inner glow overlay */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '20px',
          background: 'radial-gradient(ellipse 60% 30% at 50% 0%, rgba(56,189,248,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>
        {children}
      </div>
      <style>{`
        @keyframes glassBorderShift {
          0%   { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
