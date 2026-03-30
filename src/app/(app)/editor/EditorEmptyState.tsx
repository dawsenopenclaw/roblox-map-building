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
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-left transition-colors active:scale-95 flex-shrink-0"
      style={{
        background: hovered ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)'}`,
        color: hovered ? '#fafafa' : '#a1a1aa',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(6px)',
        transition: `opacity 0.25s ease-out ${delay}ms, transform 0.25s ease-out ${delay}ms, background 0.15s, border-color 0.15s, color 0.15s`,
        fontSize: '12px',
        fontWeight: 400,
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
      className="group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-left w-full transition-colors active:scale-[0.98]"
      style={{
        background: hovered ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)'}`,
        transition: 'background 0.15s, border-color 0.15s',
      }}
    >
      <span className="text-xl select-none flex-shrink-0">{template.icon}</span>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-zinc-200">{template.title}</p>
        <p className="text-[11px] text-zinc-600 leading-relaxed truncate">{template.description}</p>
      </div>

      <span
        className="text-[10px] font-medium px-1.5 py-0.5 rounded flex-shrink-0"
        style={{ background: diff.bg, color: diff.text }}
      >
        {template.difficulty}
      </span>
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
        <div className="pb-1">
          <h3 className="text-sm font-medium text-zinc-200 mb-1">
            {firstName ? `Welcome, ${firstName}` : 'ForjeAI'}
          </h3>
          <p className="text-xs text-zinc-500 leading-relaxed mb-4">
            Describe your game in plain English — ForjeAI writes the Luau, places the assets, connects to Studio.
          </p>

          {/* Typewriter example */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <span className="text-[10px] text-zinc-600 flex-shrink-0 uppercase tracking-widest">Try:</span>
            <span className="text-xs">
              <TypewriterExample />
            </span>
          </div>
        </div>

        {/* Suggestion chips */}
        <div>
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-2">
            Quick starts
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTION_CHIPS.map((chip, i) => (
              <SuggestionPill
                key={chip.label}
                chip={chip}
                onSelect={onSelectPrompt}
                delay={i * 50}
              />
            ))}
          </div>
        </div>

        {/* Template section header */}
        <div className="flex items-center gap-2 pt-1">
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest flex-shrink-0">
            Templates
          </p>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
        </div>

        {/* Template cards */}
        <div className="space-y-1">
          {TEMPLATES.map((t) => (
            <GlowBorderCard
              key={t.id}
              template={t}
              onSelect={onSelectPrompt}
            />
          ))}
        </div>

        {/* Footer hint */}
        <p className="text-[10px] text-zinc-700 text-center pb-2">
          First 1,000 tokens free — no card needed
        </p>
      </div>
    </>
  )
}
