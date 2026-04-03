'use client'

import React from 'react'

/**
 * Clean deep-space background. Static gradients + sparse subtle stars.
 * No floating orbs, no complex animations. Just depth.
 */

// Sparse star field — just enough to feel spacious
const STARS = Array.from({ length: 50 }, (_, i) => ({
  id: i,
  left: `${((i * 127 + 31) % 100)}%`,
  top: `${((i * 83 + 17) % 100)}%`,
  size: i % 5 === 0 ? 1.5 : 1,
  opacity: 0.1 + (i % 4) * 0.06,
  duration: 3 + (i % 3) * 2,
  delay: (i * 0.4) % 5,
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
        background: '#050810',
      }}
    >
      {/* Soft nebula wash — very subtle, no animation */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(ellipse 80% 50% at 65% 20%, rgba(79,44,200,0.06) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 20% 70%, rgba(6,182,212,0.04) 0%, transparent 55%),
            radial-gradient(ellipse 40% 30% at 50% 10%, rgba(212,175,55,0.03) 0%, transparent 45%)
          `,
        }}
      />

      {/* Star dots */}
      {STARS.map((star) => (
        <div
          key={star.id}
          style={{
            position: 'absolute',
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            borderRadius: '50%',
            background: 'white',
            opacity: star.opacity,
            animation: `starPulse ${star.duration}s ease-in-out ${star.delay}s infinite alternate`,
          }}
        />
      ))}

      <style>{`
        @keyframes starPulse {
          0%   { opacity: 0.06; }
          100% { opacity: 0.25; }
        }
      `}</style>
    </div>
  )
}
