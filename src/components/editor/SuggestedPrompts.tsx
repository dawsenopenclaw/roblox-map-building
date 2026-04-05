'use client'

import { useState, useEffect } from 'react'

// ─── Prompt card definitions ──────────────────────────────────────────────────

interface PromptCard {
  icon: React.ReactNode
  title: string
  description: string
  prompt: string
  accentColor: string
  accentBg: string
  accentBorder: string
}

const PROMPT_CARDS: PromptCard[] = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="3" y="8" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M6 8V6a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <rect x="1" y="3" width="3" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
        <rect x="14" y="3" width="3" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M6 2h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Build a medieval castle',
    description: 'Stone towers, portcullis & moat',
    prompt: 'Build a medieval castle with stone towers, iron portcullis, and a water moat with drawbridge',
    accentColor: '#C084FC',
    accentBg: 'rgba(192,132,252,0.07)',
    accentBorder: 'rgba(192,132,252,0.2)',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="5" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M2 9h14" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M6 2h2v3H6zM10 2h2v3h-2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
        <path d="M6 12h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Create a shop with UI',
    description: 'NPC vendor with buy menu',
    prompt: 'Create a shop building with an NPC vendor, shop GUI with items to buy, and working purchase buttons',
    accentColor: '#D4AF37',
    accentBg: 'rgba(212,175,55,0.07)',
    accentBorder: 'rgba(212,175,55,0.22)',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M2 14c2-4 4-7 5-7s2 3 3 3 2-2 3-2 2 2 3 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="4" cy="7" r="2" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M9 5c0-1 .5-2 1.5-2S12 4 12 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        <path d="M3 16h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Generate a forest biome',
    description: 'Trees, river & terrain',
    prompt: 'Generate a forest biome with tall trees, a winding river, mossy rocks, and rolling terrain',
    accentColor: '#4ADE80',
    accentBg: 'rgba(74,222,128,0.07)',
    accentBorder: 'rgba(74,222,128,0.2)',
  },
]

// ─── Individual card ──────────────────────────────────────────────────────────

function PromptCardItem({
  card,
  onClick,
  delay,
}: {
  card: PromptCard
  onClick: (prompt: string) => void
  delay: number
}) {
  const [hovered, setHovered] = useState(false)
  const [visible, setVisible] = useState(false)
  const [pressed, setPressed] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <button
      onClick={() => { setPressed(true); onClick(card.prompt) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={pressed}
      style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '14px 16px',
        borderRadius: 12,
        border: `1px solid ${hovered ? card.accentBorder : 'rgba(255,255,255,0.07)'}`,
        background: hovered ? card.accentBg : 'rgba(255,255,255,0.03)',
        cursor: pressed ? 'not-allowed' : 'pointer',
        textAlign: 'left',
        opacity: visible ? (pressed ? 0.5 : 1) : 0,
        transform: visible
          ? hovered
            ? 'translateY(-3px)'
            : 'translateY(0)'
          : 'translateY(10px)',
        transition: `
          opacity 0.35s ease-out ${delay}ms,
          transform 0.35s cubic-bezier(0.16,1,0.3,1) ${delay}ms,
          border-color 0.15s,
          background 0.15s,
          box-shadow 0.15s
        `,
        boxShadow: hovered ? `0 4px 20px ${card.accentColor}18` : 'none',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Icon + title row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            background: `${card.accentColor}12`,
            border: `1px solid ${card.accentColor}25`,
            color: card.accentColor,
            transition: 'background 0.15s, border-color 0.15s',
          }}
        >
          {card.icon}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: hovered ? 'white' : 'rgba(255,255,255,0.85)', lineHeight: 1.2 }}>
            {card.title}
          </div>
        </div>
      </div>

      {/* Description */}
      <p
        style={{
          margin: 0,
          fontSize: 11,
          color: hovered ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.35)',
          lineHeight: 1.5,
          transition: 'color 0.15s',
          paddingLeft: 2,
        }}
      >
        {card.description}
      </p>

      {/* Send arrow — appears on hover */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 11,
          fontWeight: 600,
          color: card.accentColor,
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'translateX(0)' : 'translateX(-6px)',
          transition: 'opacity 0.2s, transform 0.2s',
          paddingLeft: 2,
        }}
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path d="M1 5.5h9M6 1.5l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Send prompt
      </div>
    </button>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

interface SuggestedPromptsProps {
  onSend: (prompt: string) => void
  /** If true, component fades out instead of rendering */
  hidden?: boolean
}

export function SuggestedPrompts({ onSend, hidden = false }: SuggestedPromptsProps) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    if (hidden) setExiting(true)
  }, [hidden])

  if (hidden && exiting) return null

  return (
    <div
      style={{
        padding: '0 0 16px',
        opacity: exiting ? 0 : 1,
        transform: exiting ? 'translateY(-8px)' : 'translateY(0)',
        transition: 'opacity 0.25s ease-out, transform 0.25s ease-out',
        pointerEvents: exiting ? 'none' : undefined,
      }}
    >
      {/* Label */}
      <p
        style={{
          margin: '0 0 10px',
          fontSize: 11,
          color: 'rgba(255,255,255,0.3)',
          fontWeight: 500,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        Try one of these
      </p>

      {/* Cards — stack on mobile, row on md+ */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        {PROMPT_CARDS.map((card, i) => (
          <PromptCardItem
            key={card.title}
            card={card}
            onClick={onSend}
            delay={i * 70}
          />
        ))}
      </div>
    </div>
  )
}
