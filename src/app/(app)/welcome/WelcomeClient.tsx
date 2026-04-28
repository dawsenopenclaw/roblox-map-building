'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { ForjeLogo } from '@/components/ForjeLogo'

// ─── Types ─────────────────────────────────────────────────────────────────────

type Interest =
  | 'Tycoon Games'
  | 'Simulators'
  | 'Obbies'
  | 'RPGs'
  | 'Racing'
  | 'Roleplay'
  | 'Custom'

type XPLevel = 'Beginner' | 'Intermediate' | 'Expert'

interface Prefs {
  interests: Interest[]
  xp: XPLevel | null
}

// ─── Confetti ─────────────────────────────────────────────────────────────────

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  rotation: number
  vr: number
  opacity: number
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

    for (let i = 0; i < 120; i++) {
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

// ─── Progress Dots ─────────────────────────────────────────────────────────────

function ProgressDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1
        const done = n < step
        const active = n === step
        return (
          <div
            key={n}
            className="rounded-full transition-all duration-400"
            style={{
              width: active ? 24 : 8,
              height: 8,
              background: done
                ? '#D4AF37'
                : active
                  ? 'linear-gradient(90deg, #D4AF37, #F5D060)'
                  : 'rgba(255,255,255,0.12)',
              boxShadow: active ? '0 0 10px rgba(212,175,55,0.5)' : 'none',
            }}
          />
        )
      })}
    </div>
  )
}

// ─── Logo Mark (uses ForjeLogo image) ──────────────────────────────────────────

function LogoMark({ size = 64 }: { size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-2xl mx-auto"
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(135deg, rgba(212,175,55,0.18) 0%, rgba(245,208,96,0.08) 100%)',
        border: '1px solid rgba(212,175,55,0.35)',
        boxShadow: '0 0 32px rgba(212,175,55,0.2), inset 0 1px 0 rgba(212,175,55,0.15)',
      }}
    >
      <ForjeLogo size={size * 0.5} useImage />
    </div>
  )
}

// ─── Step 1 — Welcome ──────────────────────────────────────────────────────────

function StepWelcome({ firstName }: { firstName: string }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className="text-center py-4"
      style={{
        transition: 'opacity 0.45s ease-out, transform 0.45s ease-out',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(14px)',
      }}
    >
      <LogoMark size={72} />

      <div className="mt-7 mb-3">
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
          Welcome to ForjeGames
          {firstName ? (
            <span style={{ color: '#D4AF37' }}>, {firstName}</span>
          ) : null}
        </h1>
      </div>

      <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto mb-8">
        Let's set up your workspace in 30 seconds so the AI knows exactly how to help you.
      </p>

      {/* Feature pills */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {[
          { icon: '⚡', label: 'AI game builder' },
          { icon: '🎮', label: 'Roblox Studio sync' },
          { icon: '🚀', label: 'Ship faster' },
        ].map(({ icon, label }) => (
          <span
            key={label}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.09)',
              color: '#9CA3AF',
            }}
          >
            <span>{icon}</span>
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Step 2 — Interests ────────────────────────────────────────────────────────

const INTERESTS: { id: Interest; icon: string; desc: string }[] = [
  { id: 'Tycoon Games', icon: '🏭', desc: 'Build & earn'       },
  { id: 'Simulators',   icon: '🎮', desc: 'Grind & upgrade'    },
  { id: 'Obbies',       icon: '🏃', desc: 'Parkour & puzzles'  },
  { id: 'RPGs',         icon: '⚔️', desc: 'Quests & combat'    },
  { id: 'Racing',       icon: '🏎️', desc: 'Tracks & speed'     },
  { id: 'Roleplay',     icon: '🎭', desc: 'Social & stories'   },
  { id: 'Custom',       icon: '✨', desc: 'Something unique'   },
]

function StepInterests({
  selected,
  onToggle,
}: {
  selected: Interest[]
  onToggle: (id: Interest) => void
}) {
  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1.5">
        What do you build?
      </h2>
      <p className="text-gray-400 text-sm mb-7">
        Select all that apply — we'll tailor suggestions for your genres.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {INTERESTS.map(({ id, icon, desc }) => {
          const active = selected.includes(id)
          return (
            <button
              key={id}
              onClick={() => onToggle(id)}
              className="group flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200 active:scale-[0.96] text-center"
              style={{
                background: active ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.03)',
                borderColor: active ? 'rgba(212,175,55,0.7)' : 'rgba(255,255,255,0.08)',
                boxShadow: active ? '0 0 22px rgba(212,175,55,0.22)' : 'none',
              }}
            >
              <span className="text-2xl select-none">{icon}</span>
              <span
                className="text-[13px] font-semibold leading-tight"
                style={{ color: active ? '#D4AF37' : '#E5E7EB' }}
              >
                {id}
              </span>
              <span className="text-[11px] text-gray-500 leading-tight">{desc}</span>
              {active && (
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center mt-0.5"
                  style={{ background: '#D4AF37' }}
                >
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                    <path d="M1 3L3 5L7 1" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </button>
          )
        })}
      </div>
      {selected.length > 0 && (
        <p className="text-[11px] text-center mt-4" style={{ color: '#D4AF37' }}>
          {selected.length} selected
        </p>
      )}
    </div>
  )
}

// ─── Step 3 — Experience ───────────────────────────────────────────────────────

const XP_LEVELS: { id: XPLevel; icon: string; title: string; desc: string }[] = [
  {
    id: 'Beginner',
    icon: '🌱',
    title: 'Beginner',
    desc: "Never coded — keep explanations friendly and step-by-step.",
  },
  {
    id: 'Intermediate',
    icon: '🔧',
    title: 'Intermediate',
    desc: 'Know some Luau. Want smarter builds and better systems.',
  },
  {
    id: 'Expert',
    icon: '🔥',
    title: 'Expert',
    desc: 'Ship games regularly. Give me raw code, no hand-holding.',
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
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1.5">
        Your experience level?
      </h2>
      <p className="text-gray-400 text-sm mb-7">
        We'll adjust how ForjeAI talks to you and the default model complexity.
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
                boxShadow: active ? '0 0 26px rgba(212,175,55,0.18)' : 'none',
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

// ─── Step 4 — Ready ────────────────────────────────────────────────────────────

function StepReady({
  firstName,
  onOpenEditor,
  onDashboard,
}: {
  firstName: string
  onOpenEditor: () => void
  onDashboard: () => void
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className="text-center py-4"
      style={{
        transition: 'opacity 0.45s ease-out, transform 0.45s ease-out',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(14px)',
      }}
    >
      {/* Animated gold check */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-7"
        style={{
          background: 'linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(245,208,96,0.08) 100%)',
          border: '1px solid rgba(212,175,55,0.4)',
          boxShadow: '0 0 40px rgba(212,175,55,0.25)',
        }}
      >
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path
            d="M5 14L11 20L23 8"
            stroke="#D4AF37"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
        You're all set{firstName ? `, ${firstName}` : ''}!
      </h2>
      <p className="text-gray-400 text-sm mb-10 max-w-xs mx-auto leading-relaxed">
        Start building your first game. ForjeAI is calibrated and ready for your first prompt.
      </p>

      {/* Primary CTA */}
      <button
        onClick={onOpenEditor}
        className="px-10 py-3.5 rounded-xl text-sm font-bold text-black transition-all duration-200 hover:scale-[1.04] active:scale-[0.97] mb-4"
        style={{
          background: 'linear-gradient(135deg, #D4AF37 0%, #F5D060 100%)',
          boxShadow: '0 0 36px rgba(212,175,55,0.45), 0 4px 14px rgba(0,0,0,0.35)',
        }}
      >
        Open Editor →
      </button>

      {/* Secondary link */}
      <div>
        <button
          onClick={onDashboard}
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors underline underline-offset-4 decoration-gray-700 hover:decoration-gray-400"
        >
          or explore the dashboard
        </button>
      </div>
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
  const [prevStep, setPrevStep] = useState<number | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)

  const [prefs, setPrefs] = useState<Prefs>({
    interests: [],
    xp: null,
  })

  // Skip if already onboarded
  useEffect(() => {
    try {
      if (localStorage.getItem('fg_onboarding_done') === 'true') {
        router.replace('/editor')
      }
    } catch { /* ignore */ }
  }, [router])

  // Load saved prefs
  useEffect(() => {
    try {
      const saved = localStorage.getItem('fg_onboarding_prefs')
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<Prefs>
        setPrefs((p) => ({ ...p, ...parsed }))
      }
    } catch { /* ignore */ }
  }, [])

  // Auto-save prefs on change
  useEffect(() => {
    try {
      localStorage.setItem('fg_onboarding_prefs', JSON.stringify(prefs))
    } catch { /* ignore */ }
  }, [prefs])

  const firstName =
    user?.firstName ||
    user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ||
    ''

  const markDone = useCallback(() => {
    try {
      localStorage.setItem('fg_onboarding_done', 'true')
      localStorage.setItem('fg_onboarding_prefs', JSON.stringify(prefs))
    } catch { /* ignore */ }
  }, [prefs])

  const handleOpenEditor = useCallback(() => {
    markDone()
    router.push('/editor')
  }, [markDone, router])

  const handleDashboard = useCallback(() => {
    markDone()
    router.push('/dashboard')
  }, [markDone, router])

  const goTo = useCallback(
    (target: number, dir: 'forward' | 'back') => {
      if (animating) return
      setAnimating(true)
      setDirection(dir)
      setPrevStep(step)
      // Phase 1 (0–160ms): outgoing step slides out (CSS transition runs)
      // Phase 2 (160ms): swap step index — incoming step is pre-positioned off-screen
      // Phase 3 (next frame): clear animating so incoming step transitions to center
      setTimeout(() => {
        setStep(target)
        // Use rAF so the browser commits the pre-position before starting transition
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setAnimating(false)
            setPrevStep(null)
            if (target === TOTAL_STEPS) {
              setTimeout(() => setShowConfetti(true), 200)
            }
          })
        })
      }, 160)
    },
    [animating, step],
  )

  const next = useCallback(() => {
    if (step < TOTAL_STEPS) goTo(step + 1, 'forward')
  }, [step, goTo])

  const back = useCallback(() => {
    if (step > 1) goTo(step - 1, 'back')
  }, [step, goTo])

  const canAdvance = useCallback((): boolean => {
    if (step === 1) return true
    if (step === 2) return prefs.interests.length > 0
    if (step === 3) return prefs.xp !== null
    return true
  }, [step, prefs])

  const toggleInterest = useCallback((id: Interest) => {
    setPrefs((p) => ({
      ...p,
      interests: p.interests.includes(id)
        ? p.interests.filter((i) => i !== id)
        : [...p.interests, id],
    }))
  }, [])

  const slideStyle = (n: number): React.CSSProperties => {
    const isActive = n === step
    const isLeaving = n === prevStep && animating

    // Leaving step: slides out in the exit direction (no transition needed —
    // it was already visible and now gets pushed away over 160ms).
    if (isLeaving) {
      return {
        transition: 'opacity 0.16s ease-in, transform 0.16s ease-in',
        opacity: 0,
        transform: direction === 'forward' ? 'translateX(-20px)' : 'translateX(20px)',
        pointerEvents: 'none',
      }
    }

    // Incoming active step while animating: pre-position off-screen (no transition),
    // then on the next double-rAF animating flips false and it slides to center.
    if (isActive && animating) {
      return {
        transition: 'none',
        opacity: 0,
        transform: direction === 'forward' ? 'translateX(20px)' : 'translateX(-20px)',
        pointerEvents: 'none',
      }
    }

    // Active step at rest: fully visible.
    if (isActive) {
      return {
        transition: 'opacity 0.28s ease-out, transform 0.28s ease-out',
        opacity: 1,
        transform: 'translateX(0)',
        pointerEvents: 'auto',
      }
    }

    // All other inactive steps: hidden, no transition.
    return {
      transition: 'none',
      opacity: 0,
      transform: 'translateX(0)',
      pointerEvents: 'none',
    }
  }

  const getMinHeight = () => {
    if (step === 1) return 300
    if (step === 2) return 440
    if (step === 3) return 320
    if (step === 4) return 340
    return 300
  }

  const isDone = step === TOTAL_STEPS

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12 font-inter"
      style={{ background: '#050810' }}
    >
      {/* Ambient gold glow — matches auth layout */}
      <div
        className="pointer-events-none fixed inset-0"
        aria-hidden
        style={{ background: 'radial-gradient(ellipse 700px 500px at 50% 30%, rgba(212,175,55,0.05) 0%, transparent 70%)' }}
      />

      {showConfetti && <Confetti />}

      <div className="relative z-10 w-full max-w-lg">
        {/* Progress dots */}
        <ProgressDots step={step} total={TOTAL_STEPS} />

        {/* Card */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 80px rgba(212,175,55,0.04)',
          }}
        >
          {/* Top edge glow */}
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.4) 50%, transparent 100%)',
            }}
          />

          <div className="p-6 sm:p-8">
            {/* Step content */}
            <div className="relative" style={{ minHeight: getMinHeight() }}>
              <div className="absolute inset-0" style={slideStyle(1)}>
                <StepWelcome firstName={firstName} />
              </div>
              <div className="absolute inset-0" style={slideStyle(2)}>
                <StepInterests
                  selected={prefs.interests}
                  onToggle={toggleInterest}
                />
              </div>
              <div className="absolute inset-0" style={slideStyle(3)}>
                <StepExperience
                  selected={prefs.xp}
                  onSelect={(x) => setPrefs((p) => ({ ...p, xp: x }))}
                />
              </div>
              <div className="absolute inset-0" style={slideStyle(4)}>
                <StepReady
                  firstName={firstName}
                  onOpenEditor={handleOpenEditor}
                  onDashboard={handleDashboard}
                />
              </div>
            </div>

            {/* Navigation — hidden on final step */}
            {!isDone && (
              <div
                className="flex items-center justify-between mt-8 pt-6"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
              >
                {/* Back button — hidden on step 1 */}
                {step > 1 ? (
                  <button
                    onClick={back}
                    className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:text-white transition-colors"
                  >
                    ← Back
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
                    boxShadow: canAdvance() ? '0 0 18px rgba(212,175,55,0.35)' : 'none',
                  }}
                >
                  {step === TOTAL_STEPS - 1 ? 'Finish →' : 'Continue →'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Skip link — all steps except final */}
        {!isDone && (
          <div className="text-center mt-5">
            <button
              onClick={handleOpenEditor}
              className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-400 transition-colors"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Skip setup — go straight to the editor
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
