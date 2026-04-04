'use client'

import React from 'react'
import { useEditorSettings } from '@/app/(app)/editor/hooks/useEditorSettings'
import { getThemeById } from '@/lib/themes'

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

// Floating orbs — slowly drifting glass spheres that give the background life
const FLOATING_ORBS = [
  { id: 0, size: 280, left: '8%',  top: '15%',  color: 'rgba(212,175,55,0.55)',  blur: 70, opacity: 0.055, duration: 42, delay: 0,    dx: 120,  dy: 80 },
  { id: 1, size: 180, left: '78%', top: '8%',   color: 'rgba(6,182,212,0.7)',    blur: 55, opacity: 0.05,  duration: 55, delay: 8,    dx: -100, dy: 140 },
  { id: 2, size: 230, left: '60%', top: '65%',  color: 'rgba(124,58,237,0.65)',  blur: 65, opacity: 0.05,  duration: 48, delay: 15,   dx: 80,   dy: -120 },
  { id: 3, size: 140, left: '25%', top: '72%',  color: 'rgba(255,255,255,0.5)',  blur: 45, opacity: 0.04,  duration: 38, delay: 5,    dx: -160, dy: 60 },
  { id: 4, size: 200, left: '88%', top: '42%',  color: 'rgba(212,175,55,0.6)',   blur: 60, opacity: 0.045, duration: 62, delay: 22,   dx: -90,  dy: 110 },
  { id: 5, size: 120, left: '42%', top: '22%',  color: 'rgba(6,182,212,0.6)',    blur: 40, opacity: 0.04,  duration: 34, delay: 11,   dx: 70,   dy: -100 },
  { id: 6, size: 260, left: '5%',  top: '55%',  color: 'rgba(124,58,237,0.5)',   blur: 75, opacity: 0.038, duration: 58, delay: 30,   dx: 150,  dy: -80 },
  { id: 7, size: 160, left: '52%', top: '85%',  color: 'rgba(212,175,55,0.55)',  blur: 50, opacity: 0.04,  duration: 45, delay: 18,   dx: -130, dy: 90 },
  { id: 8, size: 100, left: '72%', top: '28%',  color: 'rgba(255,255,255,0.45)', blur: 35, opacity: 0.035, duration: 32, delay: 7,    dx: 60,   dy: 170 },
  { id: 9, size: 190, left: '32%', top: '45%',  color: 'rgba(212,175,55,0.5)',   blur: 58, opacity: 0.042, duration: 52, delay: 25,   dx: -110, dy: -90 },
]

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
  const { settings } = useEditorSettings()
  const theme = getThemeById(settings.theme)
  const isLight = settings.theme === 'light'

  // Orb opacity scaling for light theme
  const orbOpacityMul = isLight ? 0.4 : 1

  // Derive accent color from theme vars
  const accentRaw = theme.preview.accent

  // Build orbs with theme-aware colors
  const themedOrbs = FLOATING_ORBS.map((orb) => {
    let color = orb.color
    // Replace gold orbs (ids 0, 4, 7, 9) with theme accent
    if ([0, 4, 7, 9].includes(orb.id)) {
      // Parse accent hex to rgba
      const hex = accentRaw.replace('#', '')
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      color = `rgba(${r},${g},${b},0.55)`
    }
    return { ...orb, color, opacity: orb.opacity * orbOpacityMul }
  })

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

      {/* Floating orbs — slowly drifting glass spheres */}
      {themedOrbs.map((orb) => {
        const breatheDuration = orb.duration * 0.7
        return (
          <div
            key={`orb-${orb.id}`}
            style={{
              position: 'absolute',
              left: orb.left,
              top: orb.top,
              width: orb.size,
              height: orb.size,
              borderRadius: '50%',
              background: `radial-gradient(circle at 35% 35%, ${orb.color}, transparent 70%)`,
              filter: `blur(${orb.blur}px)`,
              willChange: 'transform, opacity',
              pointerEvents: 'none',
              '--orb-dx': `${orb.dx}px`,
              '--orb-dy': `${orb.dy}px`,
              '--orb-opacity': orb.opacity,
              animation: [
                `orbDrift ${orb.duration}s ease-in-out ${orb.delay}s infinite`,
                `orbBreathe ${breatheDuration}s ease-in-out ${orb.delay}s infinite`,
              ].join(', '),
            } as React.CSSProperties}
          />
        )
      })}

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
        /* ── Floating orbs: drift (transform only) + separate breathe (opacity only) */
        @keyframes orbDrift {
          0%, 100% { transform: translate(0px, 0px); }
          50%      { transform: translate(var(--orb-dx, 80px), var(--orb-dy, 60px)); }
        }
        @keyframes orbBreathe {
          0%, 100% { opacity: var(--orb-opacity, 0.04); }
          50%      { opacity: calc(var(--orb-opacity, 0.04) * 2.5); }
        }

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
