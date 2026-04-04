// Server Component — no interactivity
export type Tier = 'NOVICE' | 'APPRENTICE' | 'BUILDER' | 'MASTER' | 'LEGEND' | 'MYTHIC'

const TIER_CONFIG: Record<Tier, { label: string; color: string; bg: string; border: string; icon: string }> = {
  NOVICE: {
    label: 'Novice',
    color: '#B0B0B0',
    bg: '#B0B0B015',
    border: '#B0B0B030',
    icon: '🌱',
  },
  APPRENTICE: {
    label: 'Apprentice',
    color: '#60A5FA',
    bg: '#60A5FA15',
    border: '#60A5FA30',
    icon: '🎓',
  },
  BUILDER: {
    label: 'Builder',
    color: '#34D399',
    bg: '#34D39915',
    border: '#34D39930',
    icon: '🔨',
  },
  MASTER: {
    label: 'Master',
    color: '#D4AF37',
    bg: '#D4AF3715',
    border: '#D4AF3730',
    icon: '⚡',
  },
  LEGEND: {
    label: 'Legend',
    color: '#F43F5E',
    bg: '#F43F5E15',
    border: '#F43F5E30',
    icon: '🏅',
  },
  MYTHIC: {
    label: 'Mythic',
    color: '#A78BFA',
    bg: '#A78BFA15',
    border: '#A78BFA30',
    icon: '💎',
  },
}

interface TierBadgeProps {
  tier: Tier | string
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

export function TierBadge({ tier, size = 'md', showIcon = true }: TierBadgeProps) {
  const config = TIER_CONFIG[tier as Tier] ?? TIER_CONFIG.NOVICE

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${sizeClasses[size]}`}
      style={{
        color: config.color,
        background: config.bg,
        border: `1px solid ${config.border}`,
      }}
    >
      {showIcon && <span>{config.icon}</span>}
      {config.label}
    </span>
  )
}

export function TierProgressBar({
  totalXp,
  tier,
}: {
  totalXp: number
  tier: Tier | string
}) {
  const TIER_THRESHOLDS: Record<Tier, number> = {
    NOVICE: 0,
    APPRENTICE: 500,
    BUILDER: 2000,
    MASTER: 5000,
    LEGEND: 15000,
    MYTHIC: 50000,
  }

  const TIER_ORDER: Tier[] = ['NOVICE', 'APPRENTICE', 'BUILDER', 'MASTER', 'LEGEND', 'MYTHIC']
  const currentIndex = TIER_ORDER.indexOf(tier as Tier)
  const nextTier = TIER_ORDER[currentIndex + 1] as Tier | undefined
  const config = TIER_CONFIG[tier as Tier] ?? TIER_CONFIG.NOVICE

  if (!nextTier) {
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-400">
          <span>Mythic — Max tier reached</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full rounded-full w-full" style={{ background: config.color }} />
        </div>
      </div>
    )
  }

  const currentMin = TIER_THRESHOLDS[tier as Tier] ?? 0
  const nextMin = TIER_THRESHOLDS[nextTier]
  const progress = Math.min(100, ((totalXp - currentMin) / (nextMin - currentMin)) * 100)

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-400">
        <span>{config.label}</span>
        <span>{nextTier.charAt(0) + nextTier.slice(1).toLowerCase()} at {nextMin.toLocaleString()} XP</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${progress}%`, background: config.color }}
        />
      </div>
    </div>
  )
}
