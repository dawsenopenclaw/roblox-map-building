'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

// ─── Types ─────────────────────────────────────────────────────────────────────

type Genre = 'RPG' | 'Tycoon' | 'Simulator' | 'Obby' | 'Racing' | 'FPS' | 'Roleplay' | 'Custom'
type XPLevel = 'Beginner' | 'Intermediate' | 'Expert'

interface Prefs {
  genre: Genre | null
  xp: XPLevel | null
  goal: string | null
  helpAreas: string[]
  firstProject: string
  studioChoice: 'connect' | 'skip' | null
}

// ─── Confetti ─────────────────────────────────────────────────────────────────

interface Particle {
  id: number; x: number; y: number; vx: number; vy: number
  color: string; size: number; rotation: number; vr: number; opacity: number
  shape: 'rect' | 'circle'
}

const CONFETTI_COLORS = [
  '#D4AF37', '#F5D060', '#FFE27A',
  '#FFFFFF', '#E0E0E0',
  '#4FC3F7', '#81D4FA', '#A5D6A7',
]

function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const frameRef = useRef<number>(0)
  const startedRef = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || startedRef.current) return
    startedRef.current = true
    const ctx = canvas.getContext('2d')!
    let width = window.innerWidth
    let height = window.innerHeight

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
    }
    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < 200; i++) {
      particlesRef.current.push({
        id: i,
        x: Math.random() * width,
        y: -20 - Math.random() * 300,
        vx: (Math.random() - 0.5) * 3.5,
        vy: 2.5 + Math.random() * 3.5,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 6 + Math.random() * 9,
        rotation: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.18,
        opacity: 1,
        shape: Math.random() > 0.4 ? 'rect' : 'circle',
      })
    }

    const loop = () => {
      ctx.clearRect(0, 0, width, height)
      particlesRef.current = particlesRef.current
        .map((p) => ({
          ...p,
          y: p.y + p.vy,
          x: p.x + p.vx,
          rotation: p.rotation + p.vr,
          opacity: p.y > height * 0.72 ? Math.max(0, p.opacity - 0.02) : p.opacity,
        }))
        .filter((p) => p.opacity > 0)

      for (const p of particlesRef.current) {
        ctx.save()
        ctx.globalAlpha = p.opacity
        ctx.fillStyle = p.color
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        } else {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      }

      if (particlesRef.current.length > 0) {
        frameRef.current = requestAnimationFrame(loop)
      }
    }

    frameRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(frameRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-50" />
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = ((step) / total) * 100
  return (
    <div className="w-full h-1 bg-white/8 rounded-full overflow-hidden mb-10">
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{
          width: `${pct}%`,
          background: 'linear-gradient(90deg, #D4AF37 0%, #F5D060 100%)',
          boxShadow: '0 0 12px rgba(212,175,55,0.6)',
        }}
      />
    </div>
  )
}

// ─── Step 1 — Genre ────────────────────────────────────────────────────────────

const GENRES: { id: Genre; icon: string; desc: string }[] = [
  { id: 'RPG',       icon: '⚔️',  desc: 'Quests & combat'    },
  { id: 'Tycoon',    icon: '🏭',  desc: 'Build & earn'       },
  { id: 'Simulator', icon: '🎮',  desc: 'Grind & upgrade'    },
  { id: 'Obby',      icon: '🏃',  desc: 'Parkour & puzzles'  },
  { id: 'Racing',    icon: '🏎️',  desc: 'Tracks & speed'     },
  { id: 'FPS',       icon: '🔫',  desc: 'Shooters & battles' },
  { id: 'Roleplay',  icon: '🎭',  desc: 'Social & stories'   },
  { id: 'Custom',    icon: '✨',  desc: 'Something unique'   },
]

function StepGenre({
  selected,
  onSelect,
}: {
  selected: Genre | null
  onSelect: (g: Genre) => void
}) {
  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
        What do you want to build?
      </h2>
      <p className="text-gray-400 text-sm mb-8">
        Pick the genre that best describes your game — we'll tailor suggestions for you.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {GENRES.map(({ id, icon, desc }) => {
          const active = selected === id
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className="group flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200 active:scale-[0.97] text-center"
              style={{
                background: active ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.03)',
                borderColor: active ? 'rgba(212,175,55,0.7)' : 'rgba(255,255,255,0.08)',
                boxShadow: active ? '0 0 20px rgba(212,175,55,0.2)' : 'none',
              }}
            >
              <span className="text-2xl select-none">{icon}</span>
              <span
                className="text-sm font-semibold"
                style={{ color: active ? '#D4AF37' : '#E5E7EB' }}
              >
                {id}
              </span>
              <span className="text-[11px] text-gray-500 leading-tight">{desc}</span>
              {active && (
                <div className="w-4 h-4 rounded-full bg-[#D4AF37] flex items-center justify-center mt-1">
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                    <path d="M1 3L3 5L7 1" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 2 — Experience ───────────────────────────────────────────────────────

const XP_LEVELS: { id: XPLevel; icon: string; title: string; desc: string }[] = [
  {
    id: 'Beginner',
    icon: '🌱',
    title: 'Beginner',
    desc: "I'm new to Roblox dev — keep explanations friendly and step-by-step.",
  },
  {
    id: 'Intermediate',
    icon: '🔧',
    title: 'Intermediate',
    desc: 'I know the basics. I want to level up with smarter builds and systems.',
  },
  {
    id: 'Expert',
    icon: '🔥',
    title: 'Expert',
    desc: 'I ship games for real. Give me raw code, no hand-holding needed.',
  },
]

function StepExperience({
  selected,
  onSelect,
}: {
  selected: XPLevel | null
  onSelect: (x: XPLevel) => void
}) {
  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
        How experienced are you?
      </h2>
      <p className="text-gray-400 text-sm mb-8">
        We'll adjust how ForjeAI talks to you — more guidance or more raw power.
      </p>
      <div className="space-y-3">
        {XP_LEVELS.map(({ id, icon, title, desc }) => {
          const active = selected === id
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-200 active:scale-[0.99]"
              style={{
                background: active ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.03)',
                borderColor: active ? 'rgba(212,175,55,0.6)' : 'rgba(255,255,255,0.08)',
                boxShadow: active ? '0 0 24px rgba(212,175,55,0.15)' : 'none',
              }}
            >
              <span className="text-2xl select-none flex-shrink-0">{icon}</span>
              <div className="flex-1 min-w-0">
                <p
                  className="font-semibold text-sm mb-0.5"
                  style={{ color: active ? '#D4AF37' : '#E5E7EB' }}
                >
                  {title}
                </p>
                <p className="text-[12px] text-gray-500 leading-relaxed">{desc}</p>
              </div>
              <div
                className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all"
                style={{
                  borderColor: active ? '#D4AF37' : 'rgba(255,255,255,0.15)',
                  background: active ? '#D4AF37' : 'transparent',
                }}
              >
                {active && (
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                    <path d="M1 3L3 5L7 1" stroke="#000" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 3 — Goal ─────────────────────────────────────────────────────────────

const GOALS: { id: string; icon: string; label: string; desc: string }[] = [
  { id: 'first-game',   icon: '🚀', label: 'Ship my first game',    desc: 'I want to publish a real Roblox game that people can play' },
  { id: 'grow-players', icon: '📈', label: 'Grow my player count',  desc: 'I have a game but need more visits, retention, and monetization' },
  { id: 'learn-dev',    icon: '📚', label: 'Learn game development', desc: 'I want to understand Luau, Studio, and how Roblox games work' },
  { id: 'speed-up',     icon: '⚡', label: 'Build faster',           desc: 'I already know what I\'m doing — I want AI to 10x my speed' },
  { id: 'make-money',   icon: '💰', label: 'Earn Robux',             desc: 'I want to build games that generate real revenue' },
  { id: 'portfolio',    icon: '🎨', label: 'Build a portfolio',      desc: 'I\'m building a showcase of game projects for my career' },
]

function StepGoal({
  selected,
  onSelect,
}: {
  selected: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
        What are you trying to achieve?
      </h2>
      <p className="text-gray-400 text-sm mb-8">
        Pick one — we'll prioritize features that get you there fastest.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {GOALS.map(({ id, icon, label, desc }) => {
          const active = selected === id
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className="flex items-start gap-3 p-4 rounded-2xl border text-left transition-all duration-200 active:scale-[0.98]"
              style={{
                background: active ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.03)',
                borderColor: active ? 'rgba(212,175,55,0.7)' : 'rgba(255,255,255,0.08)',
                boxShadow: active ? '0 0 20px rgba(212,175,55,0.2)' : 'none',
              }}
            >
              <span className="text-xl select-none flex-shrink-0 mt-0.5">{icon}</span>
              <div className="flex-1 min-w-0">
                <p
                  className="font-semibold text-sm mb-0.5 leading-tight"
                  style={{ color: active ? '#D4AF37' : '#E5E7EB' }}
                >
                  {label}
                </p>
                <p className="text-[11px] text-gray-500 leading-relaxed">{desc}</p>
              </div>
              {active && (
                <div className="w-4 h-4 rounded-full bg-[#D4AF37] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                    <path d="M1 3L3 5L7 1" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 4 — Help Areas ───────────────────────────────────────────────────────

const HELP_AREAS: { id: string; icon: React.ReactNode; label: string; desc: string }[] = [
  {
    id: 'scripting',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
        <path d="M5 5L2 8l3 3M11 5l3 3-3 3M9 3l-2 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    label: 'Luau scripting',
    desc: 'Writing game logic, events, data stores',
  },
  {
    id: 'building',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
        <path d="M8 2L14 5v6L8 14 2 11V5L8 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M8 2v12M2 5l6 3 6-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    label: 'Map building',
    desc: 'Terrain, buildings, decorating game worlds',
  },
  {
    id: 'ui-design',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M2 6h12" stroke="currentColor" strokeWidth="1.4" />
        <path d="M6 9h4M6 11h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
    label: 'UI / menus',
    desc: 'Health bars, shops, inventory screens',
  },
  {
    id: 'monetization',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 5v1m0 4v1m-1.5-4.5A1.5 1.5 0 018 5.5a1.5 1.5 0 011.5 1.5c0 .8-.6 1.3-1.5 1.5s-1.5.7-1.5 1.5A1.5 1.5 0 008 11.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
    label: 'Monetization',
    desc: 'Game passes, dev products, premium',
  },
  {
    id: 'optimization',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
        <path d="M8 14A6 6 0 108 2a6 6 0 000 12z" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 8L11 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="8" cy="8" r="1.2" fill="currentColor" />
        <path d="M4 13.5l8-11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
      </svg>
    ),
    label: 'Performance',
    desc: 'Lag, mobile optimization, streaming',
  },
  {
    id: 'marketing',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
        <path d="M3 6h2v5H3zM5 7.5l5-4v9L5 9" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M12 6c.8.5 1.3 1.4 1.3 2.5S12.8 10.5 12 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
    label: 'Getting players',
    desc: 'Thumbnails, descriptions, discovery',
  },
  {
    id: 'animation',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
        <path d="M4 8l3 3 5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
    label: 'Animation',
    desc: 'Character animations, cutscenes, effects',
  },
  {
    id: 'sound',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
        <path d="M3 6h2v4H3zM5 7l4-3v8L5 9" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M11 5a4 4 0 010 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M12.5 3.5a6.5 6.5 0 010 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.5" />
      </svg>
    ),
    label: 'Audio / music',
    desc: 'Sound effects, ambient audio, music',
  },
]

const MAX_HELP = 3

function StepHelp({
  selected,
  onToggle,
}: {
  selected: string[]
  onToggle: (id: string) => void
}) {
  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
        Where do you struggle most?
      </h2>
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-400 text-sm">
          Pick up to 3 — ForjeAI will focus on these areas first.
        </p>
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ml-3"
          style={{
            background: selected.length >= MAX_HELP ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)',
            color: selected.length >= MAX_HELP ? '#D4AF37' : '#6B7280',
            border: `1px solid ${selected.length >= MAX_HELP ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.08)'}`,
          }}
        >
          {selected.length}/{MAX_HELP} selected
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {HELP_AREAS.map(({ id, icon, label, desc }) => {
          const active = selected.includes(id)
          const maxed = selected.length >= MAX_HELP && !active
          return (
            <button
              key={id}
              onClick={() => !maxed && onToggle(id)}
              disabled={maxed}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200 active:scale-[0.97] text-center"
              style={{
                background: active ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.03)',
                borderColor: active ? 'rgba(212,175,55,0.7)' : 'rgba(255,255,255,0.08)',
                boxShadow: active ? '0 0 20px rgba(212,175,55,0.2)' : 'none',
                opacity: maxed ? 0.35 : 1,
                cursor: maxed ? 'not-allowed' : 'pointer',
              }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{
                  background: active ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)',
                  color: active ? '#D4AF37' : '#9CA3AF',
                }}
              >
                {icon}
              </div>
              <span
                className="text-xs font-semibold leading-tight"
                style={{ color: active ? '#D4AF37' : '#E5E7EB' }}
              >
                {label}
              </span>
              <span className="text-[10px] text-gray-500 leading-tight">{desc}</span>
              {active && (
                <div className="w-4 h-4 rounded-full bg-[#D4AF37] flex items-center justify-center">
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                    <path d="M1 3L3 5L7 1" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 5 — First Project ────────────────────────────────────────────────────

const GENRE_CHIPS: Record<Genre, string[]> = {
  RPG:       ['Fantasy Quest', 'Dungeon Crawler', 'Dragon Age RPG', 'Hero Adventure'],
  Tycoon:    ['Pizza Tycoon', 'Car Wash Empire', 'Mining Simulator', 'Pet Shop'],
  Simulator: ['Pet Simulator', 'Mining Tycoon', 'Fishing Simulator', 'Farm World'],
  Obby:      ['Rainbow Obby', 'Impossible Parkour', 'Tower Escape', 'Sky Jump'],
  Racing:    ['Street Racer', 'Drift City', 'Off-Road Arena', 'Formula Roblox'],
  FPS:       ['Zombie Survival', 'Team Deathmatch', 'Sniper Arena', 'Base Defense'],
  Roleplay:  ['High School RP', 'City Life', 'Hospital RP', 'Police & Robbers'],
  Custom:    ['Unique World', 'Sandbox Game', 'Creative Space', 'Experimental'],
}

function StepFirstProject({
  value,
  genre,
  onChange,
}: {
  value: string
  genre: Genre | null
  onChange: (v: string) => void
}) {
  const chips = genre ? GENRE_CHIPS[genre] : ['Tycoon Game', 'Adventure RPG', 'Fun Obby', 'Simulator']

  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
        What do you want to build first?
      </h2>
      <p className="text-gray-400 text-sm mb-6">
        Type a short description and ForjeAI will have a plan ready in the editor.
      </p>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. A tycoon game where you build a pizza restaurant"
        rows={3}
        className="w-full resize-none text-sm leading-relaxed placeholder-gray-600 outline-none focus:ring-0 rounded-xl px-4 py-3.5 transition-all duration-200"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: value ? '1px solid rgba(212,175,55,0.4)' : '1px solid rgba(255,255,255,0.1)',
          color: '#E5E7EB',
          boxShadow: value ? '0 0 16px rgba(212,175,55,0.08)' : 'none',
        }}
      />

      <p className="text-[11px] text-gray-600 mt-2 mb-4">
        Optional — you can always describe your project later in the editor.
      </p>

      {/* Quick-pick chips */}
      <div>
        <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-2.5">Quick picks</p>
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => {
            const active = value === chip
            return (
              <button
                key={chip}
                onClick={() => onChange(active ? '' : chip)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 active:scale-[0.97]"
                style={{
                  background: active ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${active ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  color: active ? '#D4AF37' : '#9CA3AF',
                }}
              >
                {chip}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Step 6 — Studio Connect ───────────────────────────────────────────────────

const STUDIO_BENEFITS = [
  {
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
        <path d="M2 8h12M9 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'One-click deploy',
    desc: 'AI builds appear directly in your Studio scene — zero copy-paste.',
  },
  {
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3" />
        <path d="M5 8h6M8 5v6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
    title: 'Live viewport',
    desc: 'See your game update in real-time as the AI places parts.',
  },
  {
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
        <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
    title: 'Build 10x faster',
    desc: 'No switching windows. Prompt → build → play in seconds.',
  },
]

// Visual showing the ForjeAI → Plugin → Studio flow
function PluginFlowDiagram() {
  return (
    <div
      className="rounded-xl p-4 mb-6"
      style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.12)' }}
    >
      <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-3 text-center">How it works</p>
      <div className="flex items-center justify-between gap-2">
        {/* ForjeAI node */}
        <div className="flex flex-col items-center gap-1.5 flex-1">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)' }}
          >
            <svg className="w-5 h-5 text-[#D4AF37]" viewBox="0 0 20 20" fill="none">
              <path d="M10 3L12 8.5H18L13 11.5L15 17L10 14L5 17L7 11.5L2 8.5H8L10 3Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-[10px] text-gray-400 font-medium">ForjeAI</span>
        </div>

        {/* Arrow 1 */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <div className="flex items-center gap-0.5">
            <div className="w-6 h-px" style={{ background: 'linear-gradient(90deg, rgba(212,175,55,0.3), rgba(212,175,55,0.8))' }} />
            <svg className="w-2 h-2 text-[#D4AF37]" viewBox="0 0 8 8" fill="currentColor">
              <path d="M0 0L8 4L0 8z" />
            </svg>
          </div>
          <span className="text-[9px] text-gray-700">Luau</span>
        </div>

        {/* Plugin node */}
        <div className="flex flex-col items-center gap-1.5 flex-1">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <svg className="w-5 h-5 text-gray-300" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.3" />
              <path d="M3 8h14" stroke="currentColor" strokeWidth="1.3" />
              <path d="M7 12h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-[10px] text-gray-400 font-medium">Plugin</span>
        </div>

        {/* Arrow 2 */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <div className="flex items-center gap-0.5">
            <div className="w-6 h-px" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.15), rgba(255,255,255,0.4))' }} />
            <svg className="w-2 h-2 text-gray-500" viewBox="0 0 8 8" fill="currentColor">
              <path d="M0 0L8 4L0 8z" />
            </svg>
          </div>
          <span className="text-[9px] text-gray-700">places</span>
        </div>

        {/* Studio node */}
        <div className="flex flex-col items-center gap-1.5 flex-1">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <svg className="w-5 h-5 text-gray-300" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="2" width="16" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M2 7h16" stroke="currentColor" strokeWidth="1.3" />
              <path d="M7 2v5" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          </div>
          <span className="text-[10px] text-gray-400 font-medium">Studio</span>
        </div>
      </div>
    </div>
  )
}

function StepStudio({
  selected,
  onSelect,
}: {
  selected: 'connect' | 'skip' | null
  onSelect: (v: 'connect' | 'skip') => void
}) {
  return (
    <div>
      {/* Header */}
      <div className="flex items-start gap-3 mb-2">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)' }}
        >
          <svg className="w-4.5 h-4.5 text-[#D4AF37]" width="18" height="18" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="2" width="16" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M2 7h16" stroke="currentColor" strokeWidth="1.4" />
            <path d="M7 2v5" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
            Connect Roblox Studio
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            This is what makes ForjeAI genuinely powerful.
          </p>
        </div>
      </div>

      {/* Plugin flow diagram */}
      <div className="mt-5">
        <PluginFlowDiagram />
      </div>

      {/* Benefits */}
      <div className="space-y-2 mb-6">
        {STUDIO_BENEFITS.map((b) => (
          <div
            key={b.title}
            className="flex items-start gap-3 px-3.5 py-2.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 text-[#D4AF37]"
              style={{ background: 'rgba(212,175,55,0.1)' }}
            >
              {b.icon}
            </div>
            <div>
              <p className="text-xs font-semibold text-white">{b.title}</p>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{b.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Primary CTA — Connect */}
      <button
        onClick={() => onSelect('connect')}
        className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 active:scale-[0.98] mb-3"
        style={{
          background: selected === 'connect'
            ? 'linear-gradient(135deg, #D4AF37 0%, #F5D060 100%)'
            : 'linear-gradient(135deg, #D4AF37 0%, #F5D060 100%)',
          color: '#030712',
          boxShadow: '0 0 28px rgba(212,175,55,0.45), 0 4px 12px rgba(0,0,0,0.3)',
          border: selected === 'connect' ? '2px solid #F5D060' : '2px solid transparent',
        }}
      >
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M2 6h12" stroke="currentColor" strokeWidth="1.5" />
          <path d="M6 2v4" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        Connect Roblox Studio
        {selected === 'connect' && (
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
            <path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {selected === 'connect' && (
        <div
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl mb-3"
          style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)' }}
        >
          <svg className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
            <path d="M7 4.5v3M7 9.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span className="text-xs text-gray-300">
            You'll get a 6-character connection code on the next screen — paste it into the ForjeGames plugin in Studio.
          </span>
        </div>
      )}

      {/* Skip */}
      <button
        onClick={() => onSelect('skip')}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm transition-all duration-200 active:scale-[0.98]"
        style={{
          background: selected === 'skip' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
          border: `1px solid ${selected === 'skip' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.07)'}`,
          color: selected === 'skip' ? '#9CA3AF' : '#6B7280',
        }}
      >
        {selected === 'skip' && (
          <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
            <path d="M3 7l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        Skip for now — I'll connect in Settings later
      </button>
    </div>
  )
}

// ─── Step 7 — Done ─────────────────────────────────────────────────────────────

function StepDone({
  firstName,
  prefs,
  onOpenEditor,
}: {
  firstName: string
  prefs: Prefs
  onOpenEditor: () => void
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className="text-center"
      style={{ transition: 'opacity 0.4s ease-out, transform 0.4s ease-out', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)' }}
    >
      <div className="text-5xl mb-5 select-none">🎉</div>
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
        You're ready{firstName ? `, ${firstName}` : ''}!
      </h2>
      <p className="text-gray-400 text-sm mb-8 max-w-xs mx-auto">
        Your preferences are saved. ForjeAI is calibrated and waiting for your first prompt.
      </p>

      {/* Summary chips */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
        {prefs.genre && (
          <span
            className="px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: 'rgba(212,175,55,0.12)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)' }}
          >
            {prefs.genre}
          </span>
        )}
        {prefs.xp && (
          <span
            className="px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#E5E7EB', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            {prefs.xp}
          </span>
        )}
        {prefs.goal && (
          <span
            className="px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#E5E7EB', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            {GOALS.find((g) => g.id === prefs.goal)?.label ?? prefs.goal}
          </span>
        )}
        {prefs.helpAreas.length > 0 && (
          <span
            className="px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#9CA3AF', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {prefs.helpAreas.length} focus area{prefs.helpAreas.length > 1 ? 's' : ''}
          </span>
        )}
        {prefs.studioChoice === 'connect' ? (
          <span
            className="px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: 'rgba(16,185,129,0.08)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}
          >
            Studio connecting
          </span>
        ) : (
          <span
            className="px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: 'rgba(255,255,255,0.03)', color: '#6B7280', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            Studio: skipped
          </span>
        )}
      </div>

      {/* Primary CTA */}
      <button
        onClick={onOpenEditor}
        className="px-10 py-3.5 rounded-xl text-sm font-bold text-black transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
        style={{
          background: 'linear-gradient(135deg, #D4AF37 0%, #F5D060 100%)',
          boxShadow: '0 0 32px rgba(212,175,55,0.4)',
        }}
      >
        Open Editor →
      </button>
      <p className="text-gray-600 text-xs mt-4">1,000 free tokens are loaded and ready.</p>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 7
const STEP_LABELS = ['Build', 'Level', 'Goal', 'Help', 'Project', 'Studio', 'Done']

export default function WelcomePage() {
  const router = useRouter()
  const { user } = useUser()
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const [animating, setAnimating] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const [prefs, setPrefs] = useState<Prefs>({
    genre: null,
    xp: null,
    goal: null,
    helpAreas: [],
    firstProject: '',
    studioChoice: null,
  })

  // Skip if already onboarded (only show once)
  useEffect(() => {
    try {
      if (localStorage.getItem('fg_onboarded') === 'true') {
        router.replace('/editor')
      }
    } catch { /* ignore */ }
  }, [router])

  const firstName =
    user?.firstName ||
    user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ||
    ''

  // Load saved prefs from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('fg_onboarding_prefs')
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<Prefs>
        setPrefs((p) => ({ ...p, ...parsed }))
      }
    } catch {
      // ignore
    }
  }, [])

  // Save prefs whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('fg_onboarding_prefs', JSON.stringify(prefs))
    } catch {
      // ignore
    }
  }, [prefs])

  const goTo = useCallback(
    (target: number, dir: 'forward' | 'back') => {
      if (animating) return
      setAnimating(true)
      setDirection(dir)
      setTimeout(() => {
        setStep(target)
        setAnimating(false)
        if (target === TOTAL_STEPS) {
          setTimeout(() => setShowConfetti(true), 200)
        }
      }, 160)
    },
    [animating],
  )

  const next = useCallback(() => {
    if (step < TOTAL_STEPS) goTo(step + 1, 'forward')
  }, [step, goTo])

  const back = useCallback(() => {
    if (step > 1) goTo(step - 1, 'back')
  }, [step, goTo])

  const canAdvance = useCallback(() => {
    if (step === 1) return prefs.genre !== null
    if (step === 2) return prefs.xp !== null
    if (step === 3) return prefs.goal !== null
    if (step === 4) return prefs.helpAreas.length >= 1
    if (step === 5) return true  // optional
    if (step === 6) return prefs.studioChoice !== null
    return true
  }, [step, prefs])

  const handleOpenEditor = () => {
    try {
      localStorage.setItem('fg_onboarded', 'true')
    } catch {
      // ignore
    }
    // Fire-and-forget to API
    fetch('/api/onboarding/wizard-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prefs),
    }).catch(() => {})

    if (prefs.studioChoice === 'connect') {
      router.push('/settings/studio')
    } else {
      router.push('/editor')
    }
  }

  const slideStyle = (active: boolean): React.CSSProperties => ({
    transition: animating ? 'none' : 'opacity 0.3s ease-out, transform 0.3s ease-out',
    opacity: active && !animating ? 1 : 0,
    transform: active && !animating
      ? 'translateX(0)'
      : direction === 'forward'
        ? 'translateX(18px)'
        : 'translateX(-18px)',
    pointerEvents: active ? 'auto' : 'none',
  })

  // Dynamic minHeight based on step
  const getMinHeight = () => {
    if (step === 3) return 480   // Goal — 6 cards 2-col
    if (step === 4) return 500   // Help — 8 cards 4-col
    if (step === 5) return 360   // Project — textarea + chips
    if (step === 6) return 520   // Studio
    if (step === 7) return 380   // Done
    return 340
  }

  return (
    <div
      className="flex flex-col items-center justify-center px-4 py-12"
      style={{ background: '#0a0a0a' }}
    >
      {showConfetti && <Confetti />}

      <div className="w-full max-w-lg">
        {/* Profile avatar — manage account */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-zinc-500">
            {firstName ? `Hey ${firstName}` : 'Welcome'} — let&apos;s set things up
          </p>
          {/* Profile handled by global ProfileButton in root layout */}
        </div>

        {/* Step indicator pills */}
        <div className="flex items-center justify-between mb-3 px-0.5">
          <span className="text-xs text-gray-500 font-medium">
            Step {step} of {TOTAL_STEPS}
          </span>
          <div className="flex items-center gap-1">
            {STEP_LABELS.map((label, i) => {
              const n = i + 1
              const done = n < step
              const active = n === step
              return (
                <div key={label} className="flex items-center gap-1">
                  <div
                    className="flex items-center justify-center rounded-full text-[9px] font-bold transition-all duration-300"
                    style={{
                      width: 18,
                      height: 18,
                      background: done
                        ? '#D4AF37'
                        : active
                          ? 'rgba(212,175,55,0.15)'
                          : 'rgba(255,255,255,0.05)',
                      border: active
                        ? '1px solid rgba(212,175,55,0.6)'
                        : done
                          ? '1px solid #D4AF37'
                          : '1px solid rgba(255,255,255,0.08)',
                      color: done ? '#000' : active ? '#D4AF37' : '#4B5563',
                    }}
                  >
                    {done ? (
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path d="M1 3L3 5L7 1" stroke="#000" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      n
                    )}
                  </div>
                  {i < STEP_LABELS.length - 1 && (
                    <div
                      className="h-px transition-all duration-300"
                      style={{ width: 14, background: n < step ? '#D4AF37' : 'rgba(255,255,255,0.08)' }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Gold progress bar */}
        <ProgressBar step={step} total={TOTAL_STEPS} />

        {/* Card */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: '#111111',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 40px rgba(212,175,55,0.04)',
          }}
        >
          {/* Inner glow top edge */}
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.4) 50%, transparent 100%)' }}
          />

          <div className="p-6 sm:p-8">
            {/* Steps */}
            <div className="relative" style={{ minHeight: getMinHeight() }}>
              <div className="absolute inset-0" style={slideStyle(step === 1)}>
                <StepGenre
                  selected={prefs.genre}
                  onSelect={(g) => setPrefs((p) => ({ ...p, genre: g }))}
                />
              </div>
              <div className="absolute inset-0" style={slideStyle(step === 2)}>
                <StepExperience
                  selected={prefs.xp}
                  onSelect={(x) => setPrefs((p) => ({ ...p, xp: x }))}
                />
              </div>
              <div className="absolute inset-0" style={slideStyle(step === 3)}>
                <StepGoal
                  selected={prefs.goal}
                  onSelect={(id) => setPrefs((p) => ({ ...p, goal: id }))}
                />
              </div>
              <div className="absolute inset-0" style={slideStyle(step === 4)}>
                <StepHelp
                  selected={prefs.helpAreas}
                  onToggle={(id) =>
                    setPrefs((p) => ({
                      ...p,
                      helpAreas: p.helpAreas.includes(id)
                        ? p.helpAreas.filter((a) => a !== id)
                        : p.helpAreas.length < MAX_HELP
                          ? [...p.helpAreas, id]
                          : p.helpAreas,
                    }))
                  }
                />
              </div>
              <div className="absolute inset-0" style={slideStyle(step === 5)}>
                <StepFirstProject
                  value={prefs.firstProject}
                  genre={prefs.genre}
                  onChange={(v) => setPrefs((p) => ({ ...p, firstProject: v }))}
                />
              </div>
              <div className="absolute inset-0" style={slideStyle(step === 6)}>
                <StepStudio
                  selected={prefs.studioChoice}
                  onSelect={(v) => setPrefs((p) => ({ ...p, studioChoice: v }))}
                />
              </div>
              <div className="absolute inset-0" style={slideStyle(step === 7)}>
                <StepDone
                  firstName={firstName}
                  prefs={prefs}
                  onOpenEditor={handleOpenEditor}
                />
              </div>
            </div>

            {/* Navigation — hidden on step 7 */}
            {step < TOTAL_STEPS && (
              <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {step > 1 ? (
                  <button
                    onClick={back}
                    className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Back
                  </button>
                ) : (
                  <div />
                )}

                <button
                  onClick={next}
                  disabled={!canAdvance()}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.97]"
                  style={{
                    background: canAdvance()
                      ? 'linear-gradient(135deg, #D4AF37 0%, #F5D060 100%)'
                      : 'rgba(255,255,255,0.08)',
                    color: canAdvance() ? '#000' : '#6B7280',
                    boxShadow: canAdvance() ? '0 0 16px rgba(212,175,55,0.3)' : 'none',
                  }}
                >
                  {step === TOTAL_STEPS - 1 ? 'Finish Setup' : 'Continue →'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Skip link — visible and easy to tap */}
        {step < TOTAL_STEPS && (
          <div className="text-center mt-5">
            <button
              onClick={handleOpenEditor}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors group"
            >
              <svg className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Skip setup — go straight to the editor
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
