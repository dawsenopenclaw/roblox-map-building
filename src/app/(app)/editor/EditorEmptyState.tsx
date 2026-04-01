'use client'

import { useState, useEffect } from 'react'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SuggestionChip {
  icon: string
  label: string
  prompt: string
}

const SUGGESTION_CHIPS: SuggestionChip[] = [
  { icon: '🏰', label: 'Castle',      prompt: 'Build a medieval castle with stone towers, iron portcullis, and a water moat with drawbridge' },
  { icon: '🏙️', label: 'City',        prompt: 'Design a city district with roads, buildings, street lights, and pocket parks' },
  { icon: '🏎️', label: 'Racing Game', prompt: 'Create a race track with banked corners, pit lane, grandstand seating, and timing boards' },
  { icon: '⚔️', label: 'Dungeon',     prompt: 'Generate a dungeon with interconnected rooms, spike traps, locked doors, and torch lighting' },
  { icon: '🏭', label: 'Tycoon',      prompt: 'Create a factory tycoon starter kit with a conveyor belt, droppers, upgraders, and a cash collector pad' },
  { icon: '✨', label: 'Custom...',   prompt: '' },
]

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
      className="flex items-center gap-2 text-left active:scale-95 flex-shrink-0"
      style={{
        padding: '8px 14px',
        borderRadius: '10px',
        background: hovered ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${hovered ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.08)'}`,
        boxShadow: hovered ? '0 0 12px rgba(212,175,55,0.12)' : 'none',
        color: hovered ? '#fafafa' : '#a1a1aa',
        opacity: visible ? 1 : 0,
        transform: visible ? (hovered ? 'translateY(-2px)' : 'translateY(0)') : 'translateY(10px)',
        transition: `opacity 0.3s ease-out ${delay}ms, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, background 0.15s, border-color 0.15s, color 0.15s, box-shadow 0.15s`,
        fontSize: '13px',
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: '16px', lineHeight: 1 }} className="select-none">{chip.icon}</span>
      <span>{chip.label}</span>
    </button>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

interface EditorEmptyStateProps {
  firstName?: string
  onSelectPrompt: (prompt: string) => void
}

export function EditorEmptyState({ firstName, onSelectPrompt }: EditorEmptyStateProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className="flex flex-col gap-5 px-1"
      style={{
        transition: 'opacity 0.35s ease-out, transform 0.35s ease-out',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
      }}
    >
      {/* Welcome heading */}
      <div>
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#fafafa', marginBottom: '6px', lineHeight: 1.3 }}>
          {firstName ? `Hey ${firstName} — what do you want to build?` : 'What do you want to build?'}
        </h3>
        <p style={{ fontSize: '12px', color: '#52525b', lineHeight: 1.5 }}>
          Describe it in plain English. ForjeAI handles the rest.
        </p>
      </div>

      {/* Quick-start chips */}
      <div className="flex flex-wrap gap-2">
        {SUGGESTION_CHIPS.map((chip, i) => (
          <SuggestionPill
            key={chip.label}
            chip={chip}
            onSelect={onSelectPrompt}
            delay={i * 45}
          />
        ))}
      </div>
    </div>
  )
}
