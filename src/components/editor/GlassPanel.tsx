'use client'

import React from 'react'

type PaddingSize = 'none' | 'sm' | 'md' | 'lg'
type PanelVariant = 'default' | 'elevated' | 'sunken'

interface GlassPanelProps {
  children: React.ReactNode
  className?: string
  padding?: PaddingSize
  glow?: boolean
  glowColor?: string
  variant?: PanelVariant
  style?: React.CSSProperties
  onClick?: () => void
}

const PADDING_MAP: Record<PaddingSize, string> = {
  none: '0px',
  sm:   '12px',
  md:   '16px',
  lg:   '24px',
}

const VARIANT_BG: Record<PanelVariant, string> = {
  default:  'rgba(8, 12, 28, 0.65)',
  elevated: 'rgba(12, 18, 36, 0.65)',
  sunken:   'rgba(4, 6, 18, 0.75)',
}

const VARIANT_BORDER: Record<PanelVariant, string> = {
  default:  'rgba(255,255,255,0.06)',
  elevated: 'rgba(255,255,255,0.10)',
  sunken:   'rgba(255,255,255,0.04)',
}

// Tiny SVG noise pattern as a data URL — single-tile, tileable, opacity applied via CSS
const NOISE_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E"

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

// Keyframes injected once via a stable <style> tag
const PULSE_KEYFRAMES = `
@keyframes glassPanelGlowPulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.55; }
}
`

let keyframesInjected = false
function ensureKeyframes() {
  if (keyframesInjected || typeof document === 'undefined') return
  const el = document.createElement('style')
  el.textContent = PULSE_KEYFRAMES
  document.head.appendChild(el)
  keyframesInjected = true
}

export function GlassPanel({
  children,
  className = '',
  padding = 'md',
  glow = false,
  glowColor = '#FFB81C',
  variant = 'default',
  style,
  onClick,
}: GlassPanelProps) {
  const interactive = !!onClick

  // Inject keyframes on first render (client only)
  React.useEffect(() => { ensureKeyframes() }, [])

  const bg     = VARIANT_BG[variant]
  const border = VARIANT_BORDER[variant]

  // Hover state for interactive border tint
  const [hovered, setHovered] = React.useState(false)
  const activeBorder = interactive && hovered
    ? 'rgba(212,175,55,0.12)'
    : border

  // Box shadow layers
  const baseInner  = 'inset 0 1px 0 rgba(255,255,255,0.06)'
  const baseBottom = '0 -1px 0 rgba(0,0,0,0.25) inset'
  const baseShadow = `${baseInner}, ${baseBottom}`

  const glowNear = `0 0 40px ${hexToRgba(glowColor, 0.12)}`
  const glowFar  = `0 0 80px ${hexToRgba(glowColor, 0.05)}`
  const glowShadow = `${glowNear}, ${glowFar}, ${baseInner}, ${baseBottom}`

  return (
    <div
      className={className}
      onClick={onClick}
      onMouseEnter={interactive ? () => setHovered(true)  : undefined}
      onMouseLeave={interactive ? () => setHovered(false) : undefined}
      onKeyDown={interactive ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.() } } : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      style={{
        position: 'relative',
        background: bg,
        backdropFilter: 'blur(20px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
        border: `1px solid ${activeBorder}`,
        borderRadius: 16,
        overflow: 'hidden',
        padding: PADDING_MAP[padding],
        cursor: interactive ? 'pointer' : undefined,
        boxShadow: glow ? glowShadow : baseShadow,
        transition: interactive ? 'border-color 0.2s ease, box-shadow 0.2s ease' : undefined,
        ...style,
      }}
    >
      {/* Noise texture overlay */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("${NOISE_SVG}")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 200px',
          opacity: 0.02,
          pointerEvents: 'none',
          borderRadius: 'inherit',
          zIndex: 0,
        }}
      />

      {/* Top edge highlight */}
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
          zIndex: 0,
        }}
      />

      {/* Bottom edge shadow line */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: 0,
          left: '20%',
          right: '20%',
          height: 1,
          borderRadius: '0 0 16px 16px',
          background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.35), transparent)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Glow pulse layer — only rendered when glow is active */}
      {glow && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: -1,
            borderRadius: 'inherit',
            boxShadow: `0 0 60px ${hexToRgba(glowColor, 0.10)}, 0 0 120px ${hexToRgba(glowColor, 0.04)}`,
            animation: 'glassPanelGlowPulse 4s ease-in-out infinite',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}

      <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>
        {children}
      </div>
    </div>
  )
}
