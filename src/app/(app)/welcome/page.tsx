'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'

// ─── Types ─────────────────────────────────────────────────────────────────────

type Genre = 'RPG' | 'Tycoon' | 'Simulator' | 'Obby' | 'Racing' | 'FPS' | 'Roleplay' | 'Custom'
type XPLevel = 'Beginner' | 'Intermediate' | 'Expert'

interface Prefs {
  genre: Genre | null
  xp: XPLevel | null
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

// ─── Step 3 — Studio Connect ───────────────────────────────────────────────────

function StepStudio({
  selected,
  onSelect,
}: {
  selected: 'connect' | 'skip' | null
  onSelect: (v: 'connect' | 'skip') => void
}) {
  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
        Connect Roblox Studio?
      </h2>
      <p className="text-gray-400 text-sm mb-8">
        Linking Studio lets ForjeAI push builds directly into your game — no copy-paste needed.
      </p>

      <div className="space-y-3 mb-8">
        {/* Connect option */}
        <button
          onClick={() => onSelect('connect')}
          className="w-full flex items-center gap-4 p-5 rounded-2xl border text-left transition-all duration-200 active:scale-[0.99]"
          style={{
            background: selected === 'connect' ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.03)',
            borderColor: selected === 'connect' ? 'rgba(212,175,55,0.6)' : 'rgba(255,255,255,0.08)',
            boxShadow: selected === 'connect' ? '0 0 24px rgba(212,175,55,0.15)' : 'none',
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)' }}
          >
            <svg className="w-5 h-5 text-[#D4AF37]" viewBox="0 0 20 20" fill="none">
              <path d="M4 10h12M13 6l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-white mb-0.5">Yes, connect Studio</p>
            <p className="text-[12px] text-gray-500">One-click builds pushed live. Most powerful option.</p>
          </div>
          <div
            className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
            style={{
              borderColor: selected === 'connect' ? '#D4AF37' : 'rgba(255,255,255,0.15)',
              background: selected === 'connect' ? '#D4AF37' : 'transparent',
            }}
          >
            {selected === 'connect' && (
              <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                <path d="M1 3L3 5L7 1" stroke="#000" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </button>

        {/* Skip option */}
        <button
          onClick={() => onSelect('skip')}
          className="w-full flex items-center gap-4 p-5 rounded-2xl border text-left transition-all duration-200 active:scale-[0.99]"
          style={{
            background: selected === 'skip' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
            borderColor: selected === 'skip' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)',
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <svg className="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="none">
              <path d="M6 10h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-300 mb-0.5">Skip for now</p>
            <p className="text-[12px] text-gray-600">You can connect later in Settings.</p>
          </div>
          <div
            className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
            style={{
              borderColor: selected === 'skip' ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.12)',
              background: selected === 'skip' ? 'rgba(255,255,255,0.15)' : 'transparent',
            }}
          >
            {selected === 'skip' && (
              <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                <path d="M1 3L3 5L7 1" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </button>
      </div>

      {selected === 'connect' && (
        <div
          className="flex items-center gap-3 p-4 rounded-xl text-sm"
          style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)' }}
        >
          <svg className="w-4 h-4 text-[#D4AF37] flex-shrink-0" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3" />
            <path d="M8 5v4M8 11v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <span className="text-gray-300 text-xs">
            You'll be taken to the Studio settings page after this wizard completes.
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Step 4 — Done ─────────────────────────────────────────────────────────────

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

const TOTAL_STEPS = 4

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
    studioChoice: null,
  })

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
    if (step === 3) return prefs.studioChoice !== null
    return true
  }, [step, prefs])

  const handleOpenEditor = () => {
    try {
      localStorage.setItem('fg_onboarded', 'true')
    } catch {
      // ignore
    }
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

  const STEP_LABELS = ['Build', 'Experience', 'Studio', 'Done']

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: '#0a0a0a' }}
    >
      {showConfetti && <Confetti />}

      <div className="w-full max-w-lg">
        {/* Step indicator pills */}
        <div className="flex items-center justify-between mb-3 px-0.5">
          <span className="text-xs text-gray-500 font-medium">
            Step {step} of {TOTAL_STEPS}
          </span>
          <div className="flex items-center gap-1.5">
            {STEP_LABELS.map((label, i) => {
              const n = i + 1
              const done = n < step
              const active = n === step
              return (
                <div key={label} className="flex items-center gap-1.5">
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
                      style={{ width: 20, background: n < step ? '#D4AF37' : 'rgba(255,255,255,0.08)' }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Gold progress bar */}
        <ProgressBar step={step - 1} total={TOTAL_STEPS} />

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
            <div className="relative" style={{ minHeight: 340 }}>
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
                <StepStudio
                  selected={prefs.studioChoice}
                  onSelect={(v) => setPrefs((p) => ({ ...p, studioChoice: v }))}
                />
              </div>
              <div className="absolute inset-0" style={slideStyle(step === 4)}>
                <StepDone
                  firstName={firstName}
                  prefs={prefs}
                  onOpenEditor={handleOpenEditor}
                />
              </div>
            </div>

            {/* Navigation — hidden on step 4 */}
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
                  {step === TOTAL_STEPS - 1 ? "Finish Setup" : "Continue →"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Skip link */}
        {step < TOTAL_STEPS && (
          <div className="text-center mt-5">
            <button
              onClick={handleOpenEditor}
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              Skip setup and go to editor
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
