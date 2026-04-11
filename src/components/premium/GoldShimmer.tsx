'use client'

import * as React from 'react'

export interface GoldShimmerProps {
  /** Children to render with the gold shimmer effect. Usually text. */
  children: React.ReactNode
  /** Apply the shimmer as a background gradient on the container rather than clipping to text. */
  asBackground?: boolean
  /** Speed of the shimmer animation in seconds. Defaults to 3. */
  speedSeconds?: number
  /** Extra className for the wrapper. */
  className?: string
  /** Disable the animation entirely. */
  disabled?: boolean
}

/**
 * Gold shimmer effect for premium plans / pro features. Pure CSS — clips a
 * moving gradient to text via background-clip: text.
 *
 * Accessibility:
 * - The shimmer is decorative and does not affect screen reader output.
 * - Respects prefers-reduced-motion (no animation — static gold gradient shown).
 *
 * Usage:
 *   <GoldShimmer>PRO</GoldShimmer>
 *   <GoldShimmer asBackground className="rounded-md px-4 py-1 text-white">Upgrade</GoldShimmer>
 */
export function GoldShimmer({
  children,
  asBackground = false,
  speedSeconds = 3,
  className,
  disabled = false,
}: GoldShimmerProps): React.ReactElement {
  const animClass = disabled ? '' : 'forje-gold-shimmer'
  const style: React.CSSProperties = {
    animationDuration: `${speedSeconds}s`,
  }

  return (
    <>
      <style>{GOLD_CSS}</style>
      <span
        className={`${asBackground ? 'forje-gold-bg' : 'forje-gold-text'} ${animClass} ${className ?? ''}`}
        style={style}
      >
        {children}
      </span>
    </>
  )
}

const GOLD_CSS = `
.forje-gold-text {
  background: linear-gradient(
    90deg,
    #b8860b 0%,
    #ffd700 25%,
    #fffbe6 50%,
    #ffd700 75%,
    #b8860b 100%
  );
  background-size: 200% auto;
  color: transparent;
  -webkit-background-clip: text;
  background-clip: text;
  font-weight: 700;
  display: inline-block;
}
.forje-gold-bg {
  background: linear-gradient(
    90deg,
    #b8860b 0%,
    #ffd700 25%,
    #fffbe6 50%,
    #ffd700 75%,
    #b8860b 100%
  );
  background-size: 200% auto;
  display: inline-block;
}
.forje-gold-shimmer {
  animation-name: forjeGoldSlide;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}
@keyframes forjeGoldSlide {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
@media (prefers-reduced-motion: reduce) {
  .forje-gold-shimmer { animation: none; }
}
`

export default GoldShimmer
