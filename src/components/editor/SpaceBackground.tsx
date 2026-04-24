'use client'

import React from 'react'

/**
 * Deep space background — hundreds of stars at varying sizes and brightness,
 * a subtle blue/purple nebula haze, and a few brighter "landmark" stars.
 * Feels like floating in space. No orbs, no distracting shapes.
 */

// 200 small stars scattered across the viewport
const SMALL_STARS = Array.from({ length: 200 }, (_, i) => ({
  id: i,
  left: `${(i * 73 + 19) % 100}%`,
  top: `${(i * 97 + 41) % 100}%`,
  size: 0.8 + (i % 5) * 0.3,
  opacity: 0.15 + (i % 7) * 0.08,
  pulseDuration: 3 + (i % 5) * 1.5,
  pulseDelay: (i * 0.3) % 8,
}))

// 40 medium stars — slightly bigger and brighter
const MEDIUM_STARS = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  left: `${(i * 131 + 53) % 100}%`,
  top: `${(i * 89 + 7) % 100}%`,
  size: 1.5 + (i % 4) * 0.5,
  opacity: 0.3 + (i % 5) * 0.1,
  pulseDuration: 4 + (i % 3) * 2,
  pulseDelay: (i * 0.7) % 6,
}))

// 12 bright landmark stars — clearly visible, some with glow
const BRIGHT_STARS = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  left: `${(i * 157 + 37) % 100}%`,
  top: `${(i * 113 + 23) % 100}%`,
  size: 2.5 + (i % 3),
  opacity: 0.5 + (i % 4) * 0.12,
  glowSize: 6 + (i % 3) * 4,
  pulseDuration: 5 + (i % 4) * 1.5,
  pulseDelay: (i * 1.2) % 8,
  color: i % 5 === 0 ? 'rgba(147,197,253,0.9)' // blue tint
    : i % 5 === 1 ? 'rgba(253,224,147,0.9)' // warm yellow
    : i % 5 === 2 ? 'rgba(200,180,255,0.8)' // purple tint
    : 'rgba(255,255,255,0.85)', // pure white
}))

export function SpaceBackground() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        background: '#050510',
      }}
    >
      {/* Deep space gradient base */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `
          radial-gradient(ellipse 120% 80% at 50% 50%, rgba(8,10,30,1) 0%, rgba(3,3,12,1) 100%)
        `,
      }} />

      {/* Blue/purple nebula haze — subtle but visible */}
      <div
        className="nebula-breathe"
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(ellipse 60% 45% at 25% 35%, rgba(59,130,246,0.06) 0%, transparent 70%),
            radial-gradient(ellipse 50% 40% at 75% 60%, rgba(124,58,237,0.05) 0%, transparent 65%),
            radial-gradient(ellipse 70% 50% at 50% 80%, rgba(30,64,175,0.04) 0%, transparent 60%),
            radial-gradient(ellipse 40% 30% at 80% 20%, rgba(147,51,234,0.035) 0%, transparent 55%)
          `,
        }}
      />

      {/* Star field layer 1 — small distant stars */}
      {SMALL_STARS.map((star) => (
        <div
          key={`s-${star.id}`}
          style={{
            position: 'absolute',
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            borderRadius: '50%',
            background: 'white',
            '--star-min': Math.max(0.05, star.opacity * 0.4),
            '--star-max': star.opacity,
            animation: `starTwinkle ${star.pulseDuration}s ease-in-out ${star.pulseDelay}s infinite alternate`,
          } as React.CSSProperties}
        />
      ))}

      {/* Star field layer 2 — medium stars */}
      {MEDIUM_STARS.map((star) => (
        <div
          key={`m-${star.id}`}
          style={{
            position: 'absolute',
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            borderRadius: '50%',
            background: 'white',
            '--star-min': star.opacity * 0.5,
            '--star-max': star.opacity,
            animation: `starTwinkle ${star.pulseDuration}s ease-in-out ${star.pulseDelay}s infinite alternate`,
          } as React.CSSProperties}
        />
      ))}

      {/* Star field layer 3 — bright landmark stars with glow */}
      {BRIGHT_STARS.map((star) => (
        <div
          key={`b-${star.id}`}
          style={{
            position: 'absolute',
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            borderRadius: '50%',
            background: star.color,
            boxShadow: `0 0 ${star.glowSize}px ${star.glowSize / 2}px ${star.color.replace(/[\d.]+\)$/, '0.3)')}`,
            '--star-min': star.opacity * 0.6,
            '--star-max': star.opacity,
            animation: `starTwinkle ${star.pulseDuration}s ease-in-out ${star.pulseDelay}s infinite alternate`,
          } as React.CSSProperties}
        />
      ))}

      <style>{`
        @keyframes starTwinkle {
          0%   { opacity: var(--star-min, 0.1); transform: scale(0.9); }
          100% { opacity: var(--star-max, 0.5); transform: scale(1.1); }
        }
        @keyframes nebulaBreathe {
          0%, 100% { opacity: 0.6; }
          50%      { opacity: 1.0; }
        }
        .nebula-breathe {
          animation: nebulaBreathe 30s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
