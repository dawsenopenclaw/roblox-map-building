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
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-left active:scale-95 flex-shrink-0"
      style={{
        background: hovered ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${hovered ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.07)'}`,
        color: hovered ? '#fafafa' : '#a1a1aa',
        opacity: visible ? 1 : 0,
        transform: visible ? (hovered ? 'translateY(-1px)' : 'translateY(0)') : 'translateY(8px)',
        transition: `opacity 0.3s ease-out ${delay}ms, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), background 0.15s, border-color 0.15s, color 0.15s`,
        fontSize: '13px',
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
    >
      <span className="text-base leading-none select-none">{chip.icon}</span>
      <span>{chip.label}</span>
    </button>
  )
}

// ─── Studio Connect Card ──────────────────────────────────────────────────────

function StudioConnectCard({ onConnect }: { onConnect: () => void }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="px-3 py-3 flex items-center gap-3">
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)' }}
        >
          <svg className="w-3.5 h-3.5 text-[#D4AF37]" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M1 5h12" stroke="currentColor" strokeWidth="1.2" />
            <path d="M5 1v4" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-zinc-300 leading-tight">Connect Roblox Studio</p>
          <p className="text-[10px] text-zinc-600 leading-tight mt-0.5">Push builds directly — no copy-paste</p>
        </div>

        <button
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={onConnect}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-all duration-150 active:scale-[0.97]"
          style={{
            background: hovered ? 'rgba(212,175,55,0.2)' : 'rgba(212,175,55,0.1)',
            color: '#D4AF37',
            border: '1px solid rgba(212,175,55,0.25)',
          }}
        >
          Connect
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
            <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

interface EditorEmptyStateProps {
  firstName?: string
  onSelectPrompt: (prompt: string) => void
  studioConnected?: boolean
  onConnectStudio?: () => void
}

export function EditorEmptyState({ firstName, onSelectPrompt, studioConnected = false, onConnectStudio }: EditorEmptyStateProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      <style>{`
        @keyframes fg-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>

      <div
        className="flex flex-col gap-4 px-1"
        style={{
          transition: 'opacity 0.35s ease-out, transform 0.35s ease-out',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(10px)',
        }}
      >
        {/* Welcome heading */}
        <div className="pb-1">
          <h3 className="text-sm font-semibold text-zinc-100 mb-1">
            {firstName ? `Hey ${firstName} — what do you want to build?` : 'What do you want to build?'}
          </h3>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Describe it in plain English. ForjeAI handles the rest.
          </p>
        </div>

        {/* Quick-start chips */}
        <div>
          <p className="text-[10px] text-zinc-700 uppercase tracking-widest mb-2">Quick starts</p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTION_CHIPS.map((chip, i) => (
              <SuggestionPill
                key={chip.label}
                chip={chip}
                onSelect={onSelectPrompt}
                delay={i * 40}
              />
            ))}
          </div>
        </div>

        {/* Studio connect card — below quick starts, only when not connected */}
        {!studioConnected && onConnectStudio && (
          <StudioConnectCard onConnect={onConnectStudio} />
        )}

        {/* Footer hint */}
        <p className="text-[10px] text-zinc-800 text-center pt-1">
          First 1,000 tokens free — no card needed
        </p>
      </div>
    </>
  )
}
