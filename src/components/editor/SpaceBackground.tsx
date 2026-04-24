'use client'

import React from 'react'

/**
 * Clean space background — tiny star dots + subtle blue/purple haze.
 * No orbs, no shooting stars. Minimal and non-distracting.
 * All animations: transform/opacity only — GPU composited, zero JS frames.
 */

// 80 tiny white star dots scattered randomly
const STARS = Array.from({ length: 80 }, (_, i) => ({
  id: i,
  left: `${(i * 127 + 31) % 100}%`,
  top: `${(i * 83 + 17) % 100}%`,
  size: i % 7 === 0 ? 1.5 : i % 3 === 0 ? 1.2 : 0.8,
  opacity: 0.08 + (i % 5) * 0.04,
  pulseDuration: 4 + (i % 4) * 2,
  pulseDelay: (i * 0.5) % 6,
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
        background: 'var(--background)',
      }}
    >
      {/* Subtle blue/purple radial haze */}
      <div
        className="nebula-breathe"
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(ellipse 70% 50% at 50% 40%, rgba(59,130,246,0.04) 0%, transparent 70%),
            radial-gradient(ellipse 50% 40% at 30% 70%, rgba(124,58,237,0.03) 0%, transparent 60%),
            radial-gradient(ellipse 40% 35% at 70% 25%, rgba(79,44,200,0.025) 0%, transparent 55%)
          `,
        }}
      />

      {/* Tiny white star dots */}
      {STARS.map((star) => (
        <div
          key={`star-${star.id}`}
          style={{
            position: 'absolute',
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            borderRadius: '50%',
            background: 'white',
            '--star-min': Math.max(0.03, star.opacity - 0.05),
            '--star-max': star.opacity,
            animation: `starPulse ${star.pulseDuration}s ease-in-out ${star.pulseDelay}s infinite alternate`,
          } as React.CSSProperties}
        />
      ))}

      <style>{`
        @keyframes starPulse {
          0%   { opacity: var(--star-min, 0.04); }
          100% { opacity: var(--star-max, 0.15); }
        }

        @keyframes nebulaBreathe {
          0%, 100% { opacity: 0.7; }
          50%       { opacity: 1.0; }
        }
        .nebula-breathe {
          animation: nebulaBreathe 40s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
