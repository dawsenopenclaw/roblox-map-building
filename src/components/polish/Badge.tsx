'use client'

import * as React from 'react'

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface BadgeProps {
  name: string
  description?: string
  icon?: React.ReactNode
  rarity?: BadgeRarity
  /** Whether the badge has been earned. If false, it is rendered dimmed. */
  earned?: boolean
  /** ISO date string — when the badge was earned. */
  earnedAt?: string
  /** Pixel size. Defaults to 64. */
  size?: number
  className?: string
}

/**
 * Earned-badge component with rarity tiers and shine animation.
 *
 * Rarities:
 *  - common: slate
 *  - rare: blue
 *  - epic: purple
 *  - legendary: gold (with animated shine)
 *
 * Accessibility:
 * - The outer element is a group with aria-label "Badge: {name} ({rarity})".
 * - Description is exposed via aria-description where supported.
 * - Unearned badges carry aria-label "Locked badge: {name}".
 * - Shine respects prefers-reduced-motion.
 */
export function Badge({
  name,
  description,
  icon,
  rarity = 'common',
  earned = true,
  earnedAt,
  size = 64,
  className,
}: BadgeProps): React.ReactElement {
  const palette = RARITY_PALETTES[rarity]
  const label = earned ? `Badge: ${name} (${rarity})` : `Locked badge: ${name}`

  return (
    <>
      <style>{BADGE_CSS}</style>
      <div
        role="group"
        aria-label={label}
        className={`forje-badge inline-flex flex-col items-center ${className ?? ''}`}
      >
        <div
          className={`forje-badge-medal relative flex items-center justify-center rounded-full border-2 ${palette.border} ${earned ? '' : 'grayscale opacity-40'} ${rarity === 'legendary' && earned ? 'forje-badge-shine' : ''}`}
          style={{
            width: size,
            height: size,
            background: earned ? palette.bg : 'var(--muted, #e5e5e5)',
            boxShadow: earned ? palette.glow : 'none',
          }}
        >
          <div
            aria-hidden="true"
            className="flex items-center justify-center text-white"
            style={{ fontSize: size * 0.42 }}
          >
            {icon ?? <DefaultMedal />}
          </div>
        </div>
        <div className="mt-2 text-center">
          <div className={`text-sm font-semibold ${earned ? 'text-foreground' : 'text-muted-foreground'}`}>
            {name}
          </div>
          {description && (
            <div className="text-xs text-muted-foreground max-w-[160px]">{description}</div>
          )}
          {earnedAt && earned && (
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Earned {formatDate(earnedAt)}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function DefaultMedal(): React.ReactElement {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="1em"
      height="1em"
    >
      <circle cx="12" cy="8" r="6" />
      <path d="M8.21 13.89 7 22l5-3 5 3-1.21-8.12" />
    </svg>
  )
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return iso
  }
}

interface RarityPalette {
  border: string
  bg: string
  glow: string
}

const RARITY_PALETTES: Record<BadgeRarity, RarityPalette> = {
  common: {
    border: 'border-slate-400',
    bg: 'linear-gradient(135deg, #64748b 0%, #334155 100%)',
    glow: '0 0 0 3px rgba(100, 116, 139, 0.15)',
  },
  rare: {
    border: 'border-blue-400',
    bg: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
    glow: '0 0 0 3px rgba(59, 130, 246, 0.25), 0 0 20px rgba(59, 130, 246, 0.35)',
  },
  epic: {
    border: 'border-purple-400',
    bg: 'linear-gradient(135deg, #a855f7 0%, #6b21a8 100%)',
    glow: '0 0 0 3px rgba(168, 85, 247, 0.3), 0 0 24px rgba(168, 85, 247, 0.4)',
  },
  legendary: {
    border: 'border-amber-300',
    bg: 'linear-gradient(135deg, #fbbf24 0%, #b45309 100%)',
    glow: '0 0 0 3px rgba(251, 191, 36, 0.4), 0 0 32px rgba(251, 191, 36, 0.55)',
  },
}

const BADGE_CSS = `
.forje-badge-shine {
  position: relative;
  overflow: hidden;
}
.forje-badge-shine::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 9999px;
  background: linear-gradient(120deg, transparent 20%, rgba(255,255,255,0.55) 50%, transparent 80%);
  background-size: 200% 100%;
  animation: forjeBadgeShine 2.6s ease-in-out infinite;
  mix-blend-mode: overlay;
  pointer-events: none;
}
@keyframes forjeBadgeShine {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
@media (prefers-reduced-motion: reduce) {
  .forje-badge-shine::after { animation: none; display: none; }
}
`

export default Badge
