'use client'

import { useState, useEffect } from 'react'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SuggestionChip {
  icon: string
  label: string
  prompt: string
}

// Quick-access chips — each pre-fills the chat input with a full prompt
const SUGGESTION_CHIPS: SuggestionChip[] = [
  { icon: '🏰', label: 'Castle',        prompt: 'Build me a medieval castle with towers and a moat' },
  { icon: '🏠', label: 'House',         prompt: 'Build me a modern house with interior' },
  { icon: '🚀', label: 'Spaceship',     prompt: 'Build me a spaceship' },
  { icon: '🏃', label: 'Obby',          prompt: 'Make me an obby with checkpoints' },
  { icon: '🏭', label: 'Tycoon',        prompt: 'Plan a tycoon game for me' },
  { icon: '🌲', label: 'Forest',        prompt: 'Build a forest scene with trees and rocks' },
]

// Rich example builds shown in the welcome card grid
interface ExampleBuild {
  emoji: string
  title: string
  subtitle: string
  prompt: string
  color: string
  bg: string
  border: string
}

const EXAMPLE_BUILDS: ExampleBuild[] = [
  {
    emoji: '📋',
    title: 'Plan a Game',
    subtitle: 'AI plans every phase, then builds it',
    prompt: 'Let\'s plan a game together',
    color: '#D4AF37',
    bg: 'rgba(212,175,55,0.08)',
    border: 'rgba(212,175,55,0.25)',
  },
  {
    emoji: '✨',
    title: 'Free Build',
    subtitle: 'Build anything — just describe it',
    prompt: '',
    color: '#22C55E',
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.2)',
  },
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
        padding: '7px 13px',
        borderRadius: '10px',
        background: hovered ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${hovered ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.08)'}`,
        boxShadow: hovered ? '0 0 12px rgba(212,175,55,0.12)' : 'none',
        color: hovered ? '#fafafa' : '#a1a1aa',
        opacity: visible ? 1 : 0,
        transform: visible ? (hovered ? 'translateY(-2px)' : 'translateY(0)') : 'translateY(10px)',
        transition: `opacity 0.3s ease-out ${delay}ms, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, background 0.15s, border-color 0.15s, color 0.15s, box-shadow 0.15s`,
        fontSize: '12px',
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: '15px', lineHeight: 1 }} className="select-none">{chip.icon}</span>
      <span>{chip.label}</span>
    </button>
  )
}

// ─── Example build card ───────────────────────────────────────────────────────

function ExampleCard({
  build,
  onClick,
  delay,
}: {
  build: ExampleBuild
  onClick: (prompt: string) => void
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
      onClick={() => onClick(build.prompt)}
      className="text-left active:scale-[0.97]"
      style={{
        flex: '1 1 calc(50% - 6px)',
        minWidth: 0,
        padding: '12px 14px',
        borderRadius: '12px',
        background: hovered ? build.bg : 'rgba(255,255,255,0.025)',
        border: `1px solid ${hovered ? build.border : 'rgba(255,255,255,0.06)'}`,
        boxShadow: hovered ? `0 4px 16px ${build.color}15` : 'none',
        cursor: 'pointer',
        opacity: visible ? 1 : 0,
        transform: visible
          ? hovered ? 'translateY(-2px)' : 'translateY(0)'
          : 'translateY(8px)',
        transition: `opacity 0.3s ease-out ${delay}ms, transform 0.3s cubic-bezier(0.16,1,0.3,1) ${delay}ms, background 0.15s, border-color 0.15s, box-shadow 0.15s`,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 20, lineHeight: 1 }}>{build.emoji}</span>
        <span style={{
          fontSize: 12,
          fontWeight: 700,
          color: hovered ? '#fafafa' : 'rgba(255,255,255,0.8)',
          transition: 'color 0.15s',
          lineHeight: 1.2,
        }}>
          {build.title}
        </span>
      </div>
      <p style={{
        margin: 0,
        fontSize: 11,
        color: hovered ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.3)',
        lineHeight: 1.4,
        transition: 'color 0.15s',
      }}>
        {build.subtitle}
      </p>
      {hovered && (
        <div style={{
          marginTop: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 10,
          fontWeight: 600,
          color: build.color,
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.2s',
        }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1 5h8M5.5 1.5L9 5l-3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Click to build
        </div>
      )}
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
      {/* Welcome card */}
      <div
        style={{
          padding: '16px 18px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, rgba(212,175,55,0.07) 0%, rgba(255,255,255,0.02) 100%)',
          border: '1px solid rgba(212,175,55,0.18)',
          boxShadow: '0 0 32px rgba(212,175,55,0.06)',
        }}
      >
        {/* Greeting + tagline */}
        <div style={{ marginBottom: 14 }}>
          <h3 style={{
            fontSize: '15px',
            fontWeight: 700,
            color: '#fafafa',
            marginBottom: '5px',
            lineHeight: 1.3,
          }}>
            {firstName
              ? `Hey ${firstName} — what are we building today?`
              : 'What do you want to build?'}
          </h3>
          <p style={{ fontSize: '12px', color: '#52525b', lineHeight: 1.5, margin: 0 }}>
            Describe anything in plain English. ForjeAI handles terrain, scripts, UI, and models.
          </p>
        </div>

        {/* Example builds grid */}
        <div style={{ marginBottom: 6 }}>
          <p style={{
            fontSize: 10,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.25)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}>
            Click any example to get started
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {EXAMPLE_BUILDS.map((build, i) => (
              <ExampleCard
                key={build.title}
                build={build}
                onClick={onSelectPrompt}
                delay={i * 50}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Quick-start chips */}
      <div>
        <p style={{
          fontSize: 10,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.2)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}>
          Quick prompts
        </p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTION_CHIPS.map((chip, i) => (
            <SuggestionPill
              key={chip.label}
              chip={chip}
              onSelect={onSelectPrompt}
              delay={200 + i * 40}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
