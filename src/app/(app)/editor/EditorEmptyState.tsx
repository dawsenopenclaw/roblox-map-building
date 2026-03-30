'use client'

import { useState, useEffect, useRef } from 'react'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Template {
  id: string
  icon: string
  title: string
  genre: string
  prompt: string
  description: string
  difficulty: 'Easy' | 'Medium' | 'Advanced'
}

// ─── Suggestion chips ─────────────────────────────────────────────────────────

interface SuggestionChip {
  icon: string
  label: string
  prompt: string
}

const SUGGESTION_CHIPS: SuggestionChip[] = [
  { icon: '🏰', label: 'Build a castle',    prompt: 'Build a medieval castle with stone towers, iron portcullis, and a water moat with drawbridge' },
  { icon: '🏎️', label: 'Create a race track', prompt: 'Create a race track with banked corners, pit lane, grandstand seating, and timing boards' },
  { icon: '🏙️', label: 'Design a city',     prompt: 'Design a city district with roads, buildings, street lights, and pocket parks' },
  { icon: '⚔️', label: 'Make a dungeon',    prompt: 'Generate a dungeon with interconnected rooms, spike traps, locked doors, and torch lighting' },
  { icon: '🌲', label: 'Generate a forest', prompt: 'Generate a dense forest biome with trees, boulders, fallen logs, and fog density' },
  { icon: '🛍️', label: 'Build a shop',      prompt: 'Build a medieval market shop with a canopy stall, shelves, interactive items, and a merchant NPC' },
]

// ─── Featured templates ────────────────────────────────────────────────────────

const TEMPLATES: Template[] = [
  {
    id: 'castle',
    icon: '🏰',
    title: 'Medieval Castle',
    genre: 'RPG',
    prompt: 'Build a medieval castle with stone towers, a great hall, iron portcullis, and a water moat with drawbridge',
    description: 'Stone towers, great hall, drawbridge moat',
    difficulty: 'Easy',
  },
  {
    id: 'tycoon',
    icon: '🏭',
    title: 'Factory Tycoon',
    genre: 'Tycoon',
    prompt: 'Create a factory tycoon starter kit with a conveyor belt, droppers, upgraders, and a cash collector pad',
    description: 'Conveyor belt, droppers, cash pad, upgrades',
    difficulty: 'Medium',
  },
  {
    id: 'dungeon',
    icon: '⚔️',
    title: 'Dungeon Crawler',
    genre: 'RPG',
    prompt: 'Generate a procedural dungeon with 10 interconnected rooms, spike traps, locked doors, torches, and a boss chamber',
    description: '10 rooms, spike traps, boss chamber',
    difficulty: 'Advanced',
  },
]

const DIFFICULTY_COLOR: Record<Template['difficulty'], { bg: string; text: string }> = {
  Easy:     { bg: 'rgba(16,185,129,0.1)',  text: '#10B981' },
  Medium:   { bg: 'rgba(245,158,11,0.1)',  text: '#F59E0B' },
  Advanced: { bg: 'rgba(239,68,68,0.1)',   text: '#EF4444' },
}

// ─── Suggestion chip ──────────────────────────────────────────────────────────

function SuggestionPill({
  chip,
  onSelect,
  delay,
}: {
  chip: SuggestionChip
  onSelect: (prompt: string) => void
  delay: number
}) {
  const [hovered, setHovered] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(chip.prompt)}
      className="flex items-center gap-2 px-3 py-2 rounded-full text-left transition-all duration-200 active:scale-95 flex-shrink-0"
      style={{
        background: hovered ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${hovered ? 'rgba(212,175,55,0.6)' : 'rgba(212,175,55,0.2)'}`,
        boxShadow: hovered ? '0 0 12px rgba(212,175,55,0.2)' : 'none',
        color: hovered ? '#FFD700' : '#D4AF37',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: `opacity 0.3s ease-out ${delay}ms, transform 0.3s ease-out ${delay}ms, background 0.2s, border-color 0.2s, box-shadow 0.2s`,
        fontSize: '12px',
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
    >
      <span className="text-sm leading-none select-none">{chip.icon}</span>
      <span>{chip.label}</span>
    </button>
  )
}

// ─── Animated border glow ─────────────────────────────────────────────────────

function GlowBorderCard({
  template,
  onSelect,
}: {
  template: Template
  onSelect: (prompt: string) => void
}) {
  const [hovered, setHovered] = useState(false)
  const diff = DIFFICULTY_COLOR[template.difficulty]

  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(template.prompt)}
      className="group relative flex flex-col gap-3 p-4 rounded-xl text-left w-full transition-all duration-300 active:scale-[0.97]"
      style={{
        background: hovered ? 'rgba(212,175,55,0.06)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${hovered ? 'rgba(212,175,55,0.45)' : 'rgba(255,255,255,0.07)'}`,
        boxShadow: hovered ? '0 0 24px rgba(212,175,55,0.15), inset 0 0 20px rgba(212,175,55,0.03)' : 'none',
        transition: 'all 0.3s ease-out',
      }}
    >
      {/* Animated glow sweep on hover */}
      {hovered && (
        <div
          className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden"
          aria-hidden
        >
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.6) 50%, transparent 100%)',
              animation: 'fg-shimmer 2s ease-in-out infinite',
            }}
          />
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <span className="text-2xl select-none">{template.icon}</span>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5"
          style={{ background: diff.bg, color: diff.text }}
        >
          {template.difficulty}
        </span>
      </div>

      <div>
        <p className="text-sm font-semibold text-white mb-0.5">{template.title}</p>
        <p className="text-[11px] text-gray-500 leading-relaxed">{template.description}</p>
      </div>

      <div
        className="flex items-center gap-1 text-[11px] font-semibold mt-auto transition-colors"
        style={{ color: hovered ? '#D4AF37' : '#6B7280' }}
      >
        <span
          className="inline-block w-3.5 h-3.5 rounded-full flex-shrink-0 flex items-center justify-center"
          style={{ background: hovered ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)' }}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="ml-[1px]">
            <path d="M2 1.5l3.5 2.5L2 6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        Build this
      </div>
    </button>
  )
}

// ─── Typewriter effect ────────────────────────────────────────────────────────

const EXAMPLE_PROMPT = 'Build a medieval castle with a moat'

function TypewriterExample() {
  const [displayed, setDisplayed] = useState('')
  const idxRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const type = () => {
      if (idxRef.current < EXAMPLE_PROMPT.length) {
        idxRef.current += 1
        setDisplayed(EXAMPLE_PROMPT.slice(0, idxRef.current))
        timerRef.current = setTimeout(type, 48)
      }
    }
    timerRef.current = setTimeout(type, 900)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  return (
    <span className="font-mono text-[#D4AF37]">
      {displayed}
      <span
        className="inline-block w-[2px] h-[1em] bg-[#D4AF37] ml-[1px] align-middle"
        style={{ animation: 'fg-blink 1s step-start infinite' }}
      />
    </span>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

interface EditorEmptyStateProps {
  /** User's first name — pulled from Clerk */
  firstName?: string
  /** Called when user clicks a template to start building */
  onSelectPrompt: (prompt: string) => void
}

export function EditorEmptyState({ firstName, onSelectPrompt }: EditorEmptyStateProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      {/* Keyframes injected once */}
      <style>{`
        @keyframes fg-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes fg-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes fg-pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(212,175,55,0.35); }
          70% { box-shadow: 0 0 0 8px rgba(212,175,55,0); }
          100% { box-shadow: 0 0 0 0 rgba(212,175,55,0); }
        }
      `}</style>

      <div
        className="flex flex-col gap-5 px-1"
        style={{
          transition: 'opacity 0.4s ease-out, transform 0.4s ease-out',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(10px)',
        }}
      >
        {/* Hero card */}
        <div
          className="rounded-xl p-5"
          style={{
            background: 'linear-gradient(135deg, rgba(212,175,55,0.06) 0%, rgba(255,255,255,0.02) 100%)',
            border: '1px solid rgba(212,175,55,0.2)',
            boxShadow: '0 0 30px rgba(212,175,55,0.06)',
          }}
        >
          {/* Logo mark */}
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #F5D060 100%)',
              boxShadow: '0 0 16px rgba(212,175,55,0.4)',
              animation: 'fg-pulse-ring 2.5s ease-out infinite',
            }}
          >
            <svg className="w-4 h-4 text-black" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1L10.47 5.53L15.51 6.38L11.76 10.03L12.71 15.06L8 12.47L3.29 15.06L4.24 10.03L0.49 6.38L5.53 5.53L8 1Z" />
            </svg>
          </div>

          <h3 className="text-base font-bold text-white mb-1">
            Welcome to ForjeGames{firstName ? `, ${firstName}` : ''}
          </h3>
          <p className="text-[12px] text-gray-500 leading-relaxed mb-3">
            Describe your Roblox game in plain English — ForjeAI writes the Luau code,
            places the assets, and connects to Studio in one shot.
          </p>

          {/* Try saying prompt */}
          <div
            className="flex items-center gap-2 p-3 rounded-lg"
            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <span className="text-[10px] text-gray-600 flex-shrink-0 uppercase tracking-widest font-semibold">
              Try:
            </span>
            <span className="text-[12px]">
              <TypewriterExample />
            </span>
          </div>
        </div>

        {/* Suggestion chips */}
        <div>
          <p className="text-[10px] text-[#6B7280] uppercase tracking-widest font-semibold mb-2.5">
            Try one of these to get started:
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTION_CHIPS.map((chip, i) => (
              <SuggestionPill
                key={chip.label}
                chip={chip}
                onSelect={onSelectPrompt}
                delay={i * 60}
              />
            ))}
          </div>
        </div>

        {/* Template section header */}
        <div className="flex items-center gap-2">
          <p className="text-[10px] text-[#6B7280] uppercase tracking-widest font-semibold">
            Featured templates
          </p>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
        </div>

        {/* Template cards */}
        <div className="space-y-2">
          {TEMPLATES.map((t) => (
            <GlowBorderCard
              key={t.id}
              template={t}
              onSelect={onSelectPrompt}
            />
          ))}
        </div>

        {/* Footer hint */}
        <p className="text-[10px] text-gray-700 text-center pb-2">
          Your first 1,000 tokens are free — no credit card needed
        </p>
      </div>
    </>
  )
}
