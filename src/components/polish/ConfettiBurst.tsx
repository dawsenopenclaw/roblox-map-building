'use client'

import * as React from 'react'

export interface ConfettiBurstProps {
  /** When true, the burst animates. Reset to false after the duration to fire again. */
  active: boolean
  /** Number of particles. Defaults to 40. */
  particleCount?: number
  /** Total animation duration in ms. Defaults to 1400. */
  durationMs?: number
  /** Color palette. */
  colors?: string[]
  /** Optional callback when the burst finishes. */
  onComplete?: () => void
  /** ARIA announcement for screen readers — what success are we celebrating? */
  announcement?: string
}

const DEFAULT_COLORS = [
  '#FF6B6B',
  '#FFD93D',
  '#6BCB77',
  '#4D96FF',
  '#C780FA',
  '#FF9671',
]

/**
 * Pure-CSS confetti burst. No canvas, no external libs. Each particle is a
 * <span> with CSS custom properties driving its end position and rotation.
 *
 * Accessibility:
 * - Decorative confetti is aria-hidden.
 * - If `announcement` is provided, it's rendered in a visually hidden live region
 *   so screen readers hear the success ("First build complete!").
 * - Respects prefers-reduced-motion — particles do not animate.
 *
 * Usage:
 *   const [fire, setFire] = useState(false)
 *   <ConfettiBurst active={fire} onComplete={() => setFire(false)} announcement="First build complete!" />
 *   <button onClick={() => setFire(true)}>Celebrate</button>
 */
export function ConfettiBurst({
  active,
  particleCount = 40,
  durationMs = 1400,
  colors = DEFAULT_COLORS,
  onComplete,
  announcement,
}: ConfettiBurstProps): React.ReactElement | null {
  const particles = React.useMemo(() => {
    return Array.from({ length: particleCount }).map((_, i) => {
      const angle = Math.random() * Math.PI * 2
      const distance = 80 + Math.random() * 140
      return {
        id: i,
        color: colors[i % colors.length],
        tx: Math.cos(angle) * distance,
        ty: Math.sin(angle) * distance - 40, // bias upward so it arcs up
        rot: Math.random() * 720 - 360,
        delay: Math.random() * 80,
        size: 6 + Math.random() * 6,
      }
    })
  }, [particleCount, colors, active]) // regen on each active toggle

  React.useEffect(() => {
    if (!active) return
    const t = setTimeout(() => onComplete?.(), durationMs)
    return () => clearTimeout(t)
  }, [active, durationMs, onComplete])

  if (!active) {
    return announcement ? (
      <span className="sr-only" aria-live="polite">
        {/* intentionally empty — active controls the live announcement */}
      </span>
    ) : null
  }

  return (
    <>
      <style>{CONFETTI_CSS}</style>
      {announcement && (
        <span role="status" aria-live="polite" className="sr-only">
          {announcement}
        </span>
      )}
      <div
        aria-hidden="true"
        className="forje-confetti-root pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
      >
        <div className="forje-confetti-origin absolute left-1/2 top-1/2">
          {particles.map((p) => (
            <span
              key={p.id}
              className="forje-confetti-particle"
              style={
                {
                  backgroundColor: p.color,
                  width: `${p.size}px`,
                  height: `${p.size * 0.4}px`,
                  animationDuration: `${durationMs}ms`,
                  animationDelay: `${p.delay}ms`,
                  ['--tx' as string]: `${p.tx}px`,
                  ['--ty' as string]: `${p.ty}px`,
                  ['--rot' as string]: `${p.rot}deg`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      </div>
    </>
  )
}

const CONFETTI_CSS = `
.forje-confetti-particle {
  position: absolute;
  left: 0;
  top: 0;
  border-radius: 1px;
  transform: translate(0, 0) rotate(0deg);
  opacity: 1;
  animation-name: forjeConfettiFly;
  animation-timing-function: cubic-bezier(0.2, 0.8, 0.3, 1);
  animation-fill-mode: forwards;
}
@keyframes forjeConfettiFly {
  0% {
    transform: translate(0, 0) rotate(0deg);
    opacity: 1;
  }
  70% {
    opacity: 1;
  }
  100% {
    transform: translate(var(--tx), var(--ty)) rotate(var(--rot));
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .forje-confetti-particle {
    animation: none;
    display: none;
  }
}
`

export default ConfettiBurst
