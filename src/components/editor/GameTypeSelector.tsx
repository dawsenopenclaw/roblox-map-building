'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useResponsiveStandalone } from '@/components/ui/ResponsiveLayout'

// ─── Types ─────────────────────────────────────────────────────────────────────

type GameType = 'tycoon' | 'obby' | 'rpg' | 'simulator' | 'horror' | 'racing' | 'fighting' | 'custom'
type MapSize = 'small' | 'medium' | 'large'

interface GameTypeCard {
  id: GameType
  icon: string
  title: string
  description: string
  tags: string[]
  color: string
}

interface BuildPlanTask {
  id: string
  type: string
  name: string
  estimatedMinutes: number
}

interface BuildPlan {
  planId: string
  title: string
  description: string
  tasks: BuildPlanTask[]
  estimatedMinutes: number
}

export interface GameTypeSelectorProps {
  onBuildStart?: (buildId: string) => void
  onDismiss?: () => void
}

// ─── Game type data ─────────────────────────────────────────────────────────────

const GAME_TYPES: GameTypeCard[] = [
  {
    id: 'tycoon',
    icon: '🏭',
    title: 'Tycoon',
    description: 'Build and expand your empire. Droppers, conveyors, cash pads.',
    tags: ['Droppers', 'Conveyors', 'Upgrades'],
    color: '#F59E0B',
  },
  {
    id: 'obby',
    icon: '🏃',
    title: 'Obby',
    description: 'Obstacle courses with stages, checkpoints, and rewards.',
    tags: ['Stages', 'Checkpoints', 'Leaderboard'],
    color: '#22C55E',
  },
  {
    id: 'rpg',
    icon: '⚔️',
    title: 'RPG',
    description: 'Open world adventure with combat, quests, and NPCs.',
    tags: ['Combat', 'Quests', 'NPCs'],
    color: '#A855F7',
  },
  {
    id: 'simulator',
    icon: '⚡',
    title: 'Simulator',
    description: 'Click to collect, hatch pets, upgrade stats, prestige.',
    tags: ['Pets', 'Clicks', 'Rebirths'],
    color: '#3B82F6',
  },
  {
    id: 'horror',
    icon: '👻',
    title: 'Horror',
    description: 'Atmospheric maps, chase mechanics, darkness, jump scares.',
    tags: ['Atmosphere', 'Monsters', 'Escape'],
    color: '#EF4444',
  },
  {
    id: 'racing',
    icon: '🏎️',
    title: 'Racing',
    description: 'Circuits, lap times, vehicle handling, pit lanes.',
    tags: ['Circuits', 'Vehicles', 'Lap Times'],
    color: '#06B6D4',
  },
  {
    id: 'fighting',
    icon: '🥊',
    title: 'Fighting',
    description: 'Combat arenas, hitboxes, combo system, skills.',
    tags: ['Arena', 'Combos', 'Skills'],
    color: '#F97316',
  },
  {
    id: 'custom',
    icon: '✨',
    title: 'Custom',
    description: "Describe anything. No limits — you're the director.",
    tags: ['Anything', 'Freeform', 'AI-driven'],
    color: '#D4AF37',
  },
]

// ─── Config form ────────────────────────────────────────────────────────────────

interface BuildConfig {
  gameType: GameType
  theme: string
  size: MapSize
  style: string
  features: string
  customPrompt: string
}

// ─── Single game type card ──────────────────────────────────────────────────────

function GameCard({
  card,
  selected,
  onSelect,
  index,
}: {
  card: GameTypeCard
  selected: boolean
  onSelect: () => void
  index: number
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className="relative w-full text-left rounded-xl p-4 transition-all"
      style={{
        background: selected
          ? `rgba(${hexToRgb(card.color)}, 0.1)`
          : 'rgba(255,255,255,0.025)',
        border: `1px solid ${selected ? card.color + '55' : 'rgba(255,255,255,0.07)'}`,
        boxShadow: selected ? `0 0 16px ${card.color}22` : 'none',
      }}
    >
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: card.color }}
        >
          <svg viewBox="0 0 12 12" fill="none" stroke="black" strokeWidth="2" className="w-3 h-3">
            <path d="M2 6l2.5 2.5L10 3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      )}

      <div className="text-2xl mb-2 leading-none">{card.icon}</div>
      <div className="text-sm font-bold text-white mb-1">{card.title}</div>
      <div className="text-[11px] leading-relaxed mb-2.5" style={{ color: '#71717a' }}>
        {card.description}
      </div>
      <div className="flex flex-wrap gap-1">
        {card.tags.map((tag) => (
          <span
            key={tag}
            className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide"
            style={{
              background: `rgba(${hexToRgb(card.color)}, 0.1)`,
              color: card.color,
              border: `1px solid rgba(${hexToRgb(card.color)}, 0.2)`,
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </motion.button>
  )
}

// ─── Plan approval dialog ───────────────────────────────────────────────────────

function PlanApprovalDialog({
  plan,
  onApprove,
  onBack,
  loading,
}: {
  plan: BuildPlan
  onApprove: () => void
  onBack: () => void
  loading: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex flex-col gap-4"
    >
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}>
            Build Plan
          </span>
        </div>
        <h3 className="text-base font-bold text-white">{plan.title}</h3>
        <p className="text-xs mt-1" style={{ color: '#71717a' }}>{plan.description}</p>
      </div>

      {/* Task list */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        {plan.tasks.map((task, i) => (
          <div
            key={task.id}
            className="flex items-center justify-between px-3 py-2.5"
            style={{
              borderBottom: i < plan.tasks.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
            }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-md flex items-center justify-center text-[10px]"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {i + 1}
              </div>
              <span className="text-xs font-medium text-zinc-300">{task.name}</span>
            </div>
            <span className="text-[10px] font-mono" style={{ color: '#52525b' }}>~{task.estimatedMinutes}m</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-[11px]" style={{ color: '#52525b' }}>
        <span>{plan.tasks.length} tasks</span>
        <span>Est. ~{plan.estimatedMinutes} min</span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onBack}
          disabled={loading}
          className="flex-1 py-2.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#a1a1aa' }}
        >
          Back
        </button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onApprove}
          disabled={loading}
          className="flex-[2] py-2.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #D4AF37, #D4AF37)', color: '#000' }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="inline-block"
              >
                ↻
              </motion.span>
              Starting…
            </span>
          ) : (
            'Start Build →'
          )}
        </motion.button>
      </div>
    </motion.div>
  )
}

// ─── Config dialog ──────────────────────────────────────────────────────────────

function ConfigDialog({
  card,
  config,
  onChange,
  onGenerate,
  onBack,
  loading,
}: {
  card: GameTypeCard
  config: BuildConfig
  onChange: (patch: Partial<BuildConfig>) => void
  onGenerate: () => void
  onBack: () => void
  loading: boolean
}) {
  const sizes: { id: MapSize; label: string; description: string }[] = [
    { id: 'small',  label: 'Small',  description: '~15 min' },
    { id: 'medium', label: 'Medium', description: '~30 min' },
    { id: 'large',  label: 'Large',  description: '~1 hr' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.22 }}
      className="flex flex-col gap-4"
    >
      {/* Title */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">{card.icon}</span>
        <div>
          <h3 className="text-sm font-bold text-white">{card.title}</h3>
          <p className="text-[11px]" style={{ color: '#71717a' }}>Customize your build</p>
        </div>
      </div>

      {/* Theme */}
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: '#a1a1aa' }}>Theme</label>
        <input
          type="text"
          value={config.theme}
          onChange={(e) => onChange({ theme: e.target.value })}
          placeholder={`e.g. Medieval, Sci-Fi, Modern…`}
          className="w-full rounded-lg px-3 py-2 text-xs outline-none transition-colors"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fafafa',
          }}
        />
      </div>

      {/* Size */}
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: '#a1a1aa' }}>Map Size</label>
        <div className="grid grid-cols-3 gap-2">
          {sizes.map((s) => (
            <button
              key={s.id}
              onClick={() => onChange({ size: s.id })}
              className="py-2 rounded-lg flex flex-col items-center gap-0.5 transition-all"
              style={{
                background: config.size === s.id ? `rgba(${hexToRgb(card.color)}, 0.12)` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${config.size === s.id ? card.color + '50' : 'rgba(255,255,255,0.07)'}`,
                color: config.size === s.id ? card.color : '#71717a',
              }}
            >
              <span className="text-xs font-bold">{s.label}</span>
              <span className="text-[10px]">{s.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Style */}
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: '#a1a1aa' }}>Visual Style</label>
        <input
          type="text"
          value={config.style}
          onChange={(e) => onChange({ style: e.target.value })}
          placeholder="e.g. Cartoony, Realistic, Low-poly…"
          className="w-full rounded-lg px-3 py-2 text-xs outline-none transition-colors"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fafafa',
          }}
        />
      </div>

      {/* Features */}
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: '#a1a1aa' }}>Extra Features</label>
        <input
          type="text"
          value={config.features}
          onChange={(e) => onChange({ features: e.target.value })}
          placeholder="e.g. Leaderboard, Mobile support, Day/night cycle…"
          className="w-full rounded-lg px-3 py-2 text-xs outline-none transition-colors"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fafafa',
          }}
        />
      </div>

      {card.id === 'custom' && (
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#a1a1aa' }}>Describe your game</label>
          <textarea
            rows={3}
            value={config.customPrompt}
            onChange={(e) => onChange({ customPrompt: e.target.value })}
            placeholder="Describe exactly what you want to build…"
            className="w-full rounded-lg px-3 py-2 text-xs outline-none resize-none transition-colors"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fafafa',
            }}
          />
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onBack}
          className="flex-1 py-2.5 rounded-lg text-xs font-semibold transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#a1a1aa' }}
        >
          Back
        </button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onGenerate}
          disabled={loading}
          className="flex-[2] py-2.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #D4AF37, #D4AF37)', color: '#000' }}
        >
          {loading ? 'Generating plan…' : 'Generate Build Plan →'}
        </motion.button>
      </div>
    </motion.div>
  )
}

// ─── Hex helper ────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `${r},${g},${b}`
}

// ─── Main Component ─────────────────────────────────────────────────────────────

type DialogStep = 'grid' | 'config' | 'plan'

export function GameTypeSelector({ onBuildStart, onDismiss }: GameTypeSelectorProps) {
  const { isMobile } = useResponsiveStandalone()
  const [step, setStep] = useState<DialogStep>('grid')
  const [selectedCard, setSelectedCard] = useState<GameTypeCard | null>(null)
  const [config, setConfig] = useState<BuildConfig>({
    gameType: 'tycoon',
    theme: '',
    size: 'medium',
    style: '',
    features: '',
    customPrompt: '',
  })
  const [plan, setPlan] = useState<BuildPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCardSelect = useCallback((card: GameTypeCard) => {
    setSelectedCard(card)
    setConfig((prev) => ({ ...prev, gameType: card.id }))
    setStep('config')
  }, [])

  const handleGeneratePlan = useCallback(async () => {
    if (!selectedCard) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/build/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (!res.ok) throw new Error("Couldn't generate a plan — AI may be busy. Try again in a moment.")
      const data = (await res.json()) as BuildPlan
      setPlan(data)
      setStep('plan')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed — check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [config, selectedCard])

  const handleApprove = useCallback(async () => {
    if (!plan) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.planId, config }),
      })
      if (!res.ok) throw new Error("Couldn't start the build. Check your token balance and try again.")
      const data = (await res.json()) as { buildId: string }
      onBuildStart?.(data.buildId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed — check your connection and try again.')
      setLoading(false)
    }
  }, [plan, config, onBuildStart])

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">
            {step === 'grid' ? "What kind of game?" : step === 'config' ? "Customize your build" : "Review build plan"}
          </h3>
          <p className="text-[11px] mt-0.5" style={{ color: '#52525b' }}>
            {step === 'grid' ? 'ForjeAI will build the whole thing for you' : step === 'config' ? 'Tune the details — AI handles the rest' : 'Approve to start building'}
          </p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/8"
            style={{ color: '#52525b' }}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
              <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {step === 'grid' && (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`grid gap-2 ${isMobile ? 'grid-cols-2' : 'grid-cols-2'}`}
          >
            {GAME_TYPES.map((card, i) => (
              <GameCard
                key={card.id}
                card={card}
                selected={selectedCard?.id === card.id}
                onSelect={() => handleCardSelect(card)}
                index={i}
              />
            ))}
          </motion.div>
        )}

        {step === 'config' && selectedCard && (
          <motion.div key="config">
            <ConfigDialog
              card={selectedCard}
              config={config}
              onChange={(patch) => setConfig((prev) => ({ ...prev, ...patch }))}
              onGenerate={() => void handleGeneratePlan()}
              onBack={() => setStep('grid')}
              loading={loading}
            />
          </motion.div>
        )}

        {step === 'plan' && plan && (
          <motion.div key="plan">
            <PlanApprovalDialog
              plan={plan}
              onApprove={() => void handleApprove()}
              onBack={() => setStep('config')}
              loading={loading}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs px-3 py-2 rounded-lg"
            style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
