'use client'

import { useEffect, useState, useMemo } from 'react'
import { createPortal } from 'react-dom'

/**
 * Starfield ambient layer — small white & gold dots that drift slowly across
 * the viewport like stars in deep space, with a twinkle (opacity pulse).
 *
 * Each star gets its OWN named keyframe with hard-coded translate values so
 * we don't rely on CSS variables inside @keyframes (which has spotty support).
 * Stars also have a faster drift duration (15-50s) so motion is visible.
 */

interface Star {
  id: number
  size: number
  color: string
  glow: string
  startX: number      // % of viewport
  startY: number      // % of viewport
  endX: number        // px offset (negative = left, positive = right)
  endY: number        // px offset
  driftDur: number    // seconds for one full drift cycle
  twinkleDur: number
  twinkleDelay: number
  driftDelay: number
  baseOpacity: number
  blur: number
}

function makeStar(layer: 'far' | 'mid' | 'near', i: number, total: number, idOffset: number): Star {
  const isGold = i % 4 === 0
  // Distribute via grid to avoid clustering
  const cols = Math.ceil(Math.sqrt(total))
  const rows = Math.ceil(total / cols)
  const col = i % cols
  const row = Math.floor(i / cols)
  const cellW = 100 / cols
  const cellH = 100 / rows
  const jitterX = (Math.random() - 0.5) * cellW * 0.7
  const jitterY = (Math.random() - 0.5) * cellH * 0.7

  // Layer-specific properties — near layer drifts more visibly + faster
  const sizeMap     = { far: [1, 1.6],   mid: [1.6, 2.6], near: [2.6, 4.2] }
  const driftDurMap = { far: [40, 60],   mid: [25, 40],   near: [15, 25] }    // seconds
  const driftDistMap = { far: [40, 80],  mid: [70, 120],  near: [120, 200] }  // px
  const opacityMap  = { far: [0.3, 0.5], mid: [0.45, 0.7], near: [0.6, 0.95] }
  const blurMap     = { far: [0.5, 1.1], mid: [0.3, 0.7],  near: [0.0, 0.3] }

  const sizeRange = sizeMap[layer]
  const durRange = driftDurMap[layer]
  const distRange = driftDistMap[layer]
  const opacityRange = opacityMap[layer]
  const blurRange = blurMap[layer]

  // Random direction for drift (uniform around a circle)
  const angle = Math.random() * Math.PI * 2
  const distance = distRange[0] + Math.random() * (distRange[1] - distRange[0])

  return {
    id: i + idOffset,
    size: sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]),
    color: isGold ? '#D4AF37' : '#FFFFFF',
    glow: isGold ? 'rgba(212,175,55,0.55)' : 'rgba(255,255,255,0.4)',
    startX: cellW * (col + 0.5) + jitterX,
    startY: cellH * (row + 0.5) + jitterY,
    endX: Math.cos(angle) * distance,
    endY: Math.sin(angle) * distance,
    driftDur: durRange[0] + Math.random() * (durRange[1] - durRange[0]),
    twinkleDur: 2.5 + Math.random() * 4,
    twinkleDelay: -(Math.random() * 6),
    driftDelay: -(Math.random() * 30),
    baseOpacity: opacityRange[0] + Math.random() * (opacityRange[1] - opacityRange[0]),
    blur: blurRange[0] + Math.random() * (blurRange[1] - blurRange[0]),
  }
}

function Starfield() {
  // Generate stars once on mount (random values stay stable)
  const stars = useMemo(() => {
    const far  = Array.from({ length: 32 }, (_, i) => makeStar('far',  i, 32, 0))
    const mid  = Array.from({ length: 18 }, (_, i) => makeStar('mid',  i, 18, 100))
    const near = Array.from({ length: 10 }, (_, i) => makeStar('near', i, 10, 200))
    return [...far, ...mid, ...near]
  }, [])

  // Build a single <style> block with one named keyframe per star
  // This guarantees the animation actually runs (no CSS variable issues)
  const keyframeCSS = useMemo(
    () =>
      stars
        .map(
          (s) => `
      @keyframes star-drift-${s.id} {
        0%   { transform: translate(0, 0); }
        100% { transform: translate(${s.endX}px, ${s.endY}px); }
      }
    `,
        )
        .join('\n') +
      `
      @keyframes star-twinkle-pulse {
        0%, 100% { opacity: 1; }
        50%      { opacity: 0.35; }
      }
    `,
    [stars],
  )

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: keyframeCSS }} />

      {stars.map((s) => (
        <div
          key={`star-${s.id}`}
          style={{
            position: 'absolute',
            left: `${s.startX}%`,
            top: `${s.startY}%`,
            // Drift back and forth with `alternate` so it loops cleanly
            animation: `star-drift-${s.id} ${s.driftDur}s ease-in-out ${s.driftDelay}s infinite alternate`,
            willChange: 'transform',
          }}
        >
          <div
            style={{
              width: s.size,
              height: s.size,
              borderRadius: '50%',
              backgroundColor: s.color,
              boxShadow: `0 0 ${s.size + 4}px ${s.size}px ${s.glow}`,
              filter: `blur(${s.blur}px)`,
              opacity: s.baseOpacity,
              animation: `star-twinkle-pulse ${s.twinkleDur}s ease-in-out ${s.twinkleDelay}s infinite`,
            }}
          />
        </div>
      ))}
    </div>
  )
}

export function GlassOrbEffect() {
  const [ready, setReady] = useState(false)
  const [pathname, setPathname] = useState('')
  useEffect(() => {
    setReady(true)
    setPathname(window.location.pathname)
  }, [])
  // Hide on /editor — the simplified editor has its own solid background
  // and the stars render on top of it, hiding the UI
  if (!ready || pathname.startsWith('/editor')) return null
  return createPortal(<Starfield />, document.body)
}
