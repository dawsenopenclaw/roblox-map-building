'use client'

import React from 'react'

/**
 * Immersive deep-space background.
 * Layer 1: 50 small pulsing stars (existing)
 * Layer 2: 20 larger drifting stars (parallax depth)
 * Shooting stars: 3 on staggered long intervals (CSS only)
 * Nebula: slow opacity breathe (CSS only)
 * All animations: transform/opacity only — GPU composited, zero JS frames.
 */

// Layer 1 — 50 small stars, subtle pulse
const STARS_L1 = Array.from({ length: 50 }, (_, i) => ({
  id: i,
  left: `${(i * 127 + 31) % 100}%`,
  top: `${(i * 83 + 17) % 100}%`,
  size: i % 5 === 0 ? 1.5 : 1,
  opacity: 0.1 + (i % 4) * 0.06,
  pulseDuration: 3 + (i % 3) * 2,
  pulseDelay: (i * 0.4) % 5,
}))

// Layer 2 — 20 larger drifting stars (parallax feel)
const STARS_L2 = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: `${(i * 173 + 53) % 100}%`,
  top: `${(i * 97 + 41) % 100}%`,
  size: 2 + ((i * 3) % 10) / 20,   // 2.0 – 2.45px
  opacity: 0.12 + (i % 5) * 0.04,
  driftDuration: 18 + (i % 5) * 2, // 18 – 26s
  driftDelay: (i * 1.3) % 8,
  pulseDuration: 4 + (i % 4) * 1.5,
  pulseDelay: (i * 0.7) % 6,
}))

// 3 shooting stars — deterministic start positions, different intervals
const SHOOTING_STARS: Array<{
  id: number
  left: string
  top: string
  rotate: number
  totalDuration: number // interval — streak occupies first ~10% of this
  initialDelay: number
}> = [
  {
    id: 0,
    left: `${(0 * 157 + 23) % 55}%`,       // ~23%
    top: `${(0 * 89 + 11) % 30}%`,          // ~11%
    rotate: 35,
    totalDuration: 15,
    initialDelay: 4,
  },
  {
    id: 1,
    left: `${((1 * 157 + 23) % 35) + 20}%`, // ~40%
    top: `${((1 * 89 + 11) % 25) + 3}%`,    // ~14%
    rotate: 28,
    totalDuration: 23,
    initialDelay: 11,
  },
  {
    id: 2,
    left: `${((2 * 157 + 23) % 30) + 45}%`, // ~52%
    top: `${((2 * 89 + 11) % 20) + 5}%`,    // ~16%
    rotate: 42,
    totalDuration: 31,
    initialDelay: 19,
  },
]

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
      {/* Nebula wash — breathes slowly via CSS animation */}
      <div
        className="nebula-breathe"
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

      {/* Layer 1 — small pulsing stars */}
      {STARS_L1.map((star) => (
        <div
          key={`l1-${star.id}`}
          style={{
            position: 'absolute',
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            borderRadius: '50%',
            background: 'white',
            '--star-min': Math.max(0.04, star.opacity - 0.08),
            '--star-max': star.opacity,
            animation: `starPulse ${star.pulseDuration}s ease-in-out ${star.pulseDelay}s infinite alternate`,
          } as React.CSSProperties}
        />
      ))}

      {/* Layer 2 — larger drifting stars */}
      {STARS_L2.map((star) => (
        <div
          key={`l2-${star.id}`}
          style={{
            position: 'absolute',
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            borderRadius: '50%',
            background: 'rgba(220, 230, 255, 0.95)',
            '--star-min': Math.max(0.06, star.opacity - 0.06),
            '--star-max': star.opacity,
            animation: [
              `starPulse ${star.pulseDuration}s ease-in-out ${star.pulseDelay}s infinite alternate`,
              `starDrift ${star.driftDuration}s ease-in-out ${star.driftDelay}s infinite alternate`,
            ].join(', '),
          } as React.CSSProperties}
        />
      ))}

      {/* Shooting stars — each has its own total duration as its animation-duration */}
      {SHOOTING_STARS.map((s) => (
        <div
          key={`shoot-${s.id}`}
          style={{
            position: 'absolute',
            left: s.left,
            top: s.top,
            // The element is a thin 80px bar; rotation applied here stays constant.
            // The keyframe only moves translateX along the rotated axis.
            width: 80,
            height: 1,
            background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 40%, rgba(255,255,255,0) 100%)',
            borderRadius: 1,
            transformOrigin: 'left center',
            opacity: 0,
            // animation-duration = totalDuration so it fires once per interval
            animation: `shootingStar ${s.totalDuration}s linear ${s.initialDelay}s infinite`,
            // Encode rotation as CSS var so the keyframe can reference it
            '--shoot-rotate': `${s.rotate}deg`,
          } as React.CSSProperties}
        />
      ))}

      <style>{`
        /* ── Layer 1: pulse ─────────────────────────────────────────── */
        @keyframes starPulse {
          0%   { opacity: var(--star-min, 0.06); }
          100% { opacity: var(--star-max, 0.20); }
        }

        /* ── Layer 2: slow drift (3px translate over duration) ──────── */
        @keyframes starDrift {
          0%   { transform: translate(0px, 0px); }
          100% { transform: translate(3px, -2px); }
        }

        /* ── Nebula breathe (opacity 0.7 → 1.0 → 0.7 over 32s) ──────── */
        @keyframes nebulaBreathe {
          0%, 100% { opacity: 0.7; }
          50%       { opacity: 1.0; }
        }
        .nebula-breathe {
          animation: nebulaBreathe 32s ease-in-out infinite;
        }

        /*
         * Shooting star:
         *   animation-duration = totalDuration (15 / 23 / 31s)
         *   The visible streak fires in the first ~10% of the cycle, then
         *   stays invisible for the remaining ~90% — giving the long interval.
         *
         *   transform must include the rotation at every keyframe step because
         *   we can't compose with a static transform when the keyframe overrides
         *   the transform property. We use a CSS custom property fallback of 35deg.
         */
        @keyframes shootingStar {
          0%   {
            opacity: 0;
            transform: rotate(var(--shoot-rotate, 35deg)) translateX(0px);
          }
          2%   {
            opacity: 0.3;
            transform: rotate(var(--shoot-rotate, 35deg)) translateX(20px);
          }
          8%   {
            opacity: 0.25;
            transform: rotate(var(--shoot-rotate, 35deg)) translateX(160px);
          }
          11%  {
            opacity: 0;
            transform: rotate(var(--shoot-rotate, 35deg)) translateX(220px);
          }
          100% {
            opacity: 0;
            transform: rotate(var(--shoot-rotate, 35deg)) translateX(220px);
          }
        }
      `}</style>
    </div>
  )
}
