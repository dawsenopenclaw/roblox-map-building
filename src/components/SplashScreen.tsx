'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

// ─── Constants ────────────────────────────────────────────────────────────────

const TARGET_TEXT = 'FORJEGAMES'
const LETTERS = TARGET_TEXT.split('')

// Phase timing (ms from animation start)
// Total duration: ~1500ms (first visit) — returning users skip via sessionStorage
const PHASE1_END        = 120    // void w/ ember
const PHASE2_START      = 120    // scan line + letter burn-in
const PHASE2_END        = 480    // all letters revealed
const PHASE3_START      = 480    // holographic pulse
const PHASE3_END        = 700
const PHASE4_START      = 700    // progress forge
const PHASE4_END        = 1050
const PHASE5_START      = 1050   // ignition exit
const PHASE5_QUENCH     = 1110   // white flash done
const EXIT_COMPLETE     = 1280   // total exit duration

const STAGE_LABELS = [
  { threshold: 0,   label: 'Heating the forge...' },
  { threshold: 25,  label: 'Smelting AI cores...' },
  { threshold: 55,  label: 'Tempering game engine...' },
  { threshold: 80,  label: 'Quenching systems...' },
  { threshold: 98,  label: 'Ready.' },
]

const PARTICLE_COUNT = 30

// 6 shatter fragments (clip-path polygons covering screen thirds)
const SHATTER_FRAGMENTS = [
  'polygon(0% 0%, 33% 0%, 28% 50%, 0% 45%)',
  'polygon(33% 0%, 67% 0%, 62% 48%, 30% 52%)',
  'polygon(67% 0%, 100% 0%, 100% 48%, 64% 46%)',
  'polygon(0% 45%, 30% 50%, 25% 100%, 0% 100%)',
  'polygon(30% 52%, 65% 48%, 62% 100%, 27% 100%)',
  'polygon(65% 46%, 100% 48%, 100% 100%, 60% 100%)',
]

// Shatter transform destinations — each fragment flies outward
const SHATTER_TRANSFORMS = [
  'translate(-120px, -100px) rotate(-15deg) scale(0.75)',
  'translate(0px, -140px) rotate(8deg) scale(0.8)',
  'translate(140px, -90px) rotate(18deg) scale(0.72)',
  'translate(-130px, 110px) rotate(-20deg) scale(0.78)',
  'translate(10px, 130px) rotate(-10deg) scale(0.82)',
  'translate(150px, 100px) rotate(22deg) scale(0.74)',
]

// Stable random particle data — generated once at module level, never regenerated
const PARTICLE_DATA = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  const angle = (i / PARTICLE_COUNT) * 360
  const radius = 40 + Math.random() * 180
  const dx = Math.cos((angle * Math.PI) / 180) * radius * (0.5 + Math.random() * 0.5)
  const dy = -(30 + Math.random() * 120)
  const size = 1.5 + Math.random() * 3
  const delay = Math.random() * 3
  const duration = 1.5 + Math.random() * 2.5
  const opacity = 0.3 + Math.random() * 0.7
  const left = 30 + Math.random() * 40
  const top = 40 + Math.random() * 20
  return { i, dx, dy, size, delay, duration, opacity, left, top }
})

// Stable random spark data — generated once at module level
const SPARK_DATA = Array.from({ length: 8 }, (_, i) => ({
  i,
  width: 2 + Math.random() * 2,
  height: 2 + Math.random() * 2,
  color: i % 3 === 0 ? '#FFFFFF' : i % 3 === 1 ? '#D4AF37' : '#D4AF37',
  dx: (Math.random() - 0.5) * 20,
  duration: 0.4 + Math.random() * 0.6,
}))

function getStageLabel(pct: number): string {
  let label = STAGE_LABELS[0].label
  for (const s of STAGE_LABELS) {
    if (pct >= s.threshold) label = s.label
  }
  return label
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

// ─── Keyframes injected once ──────────────────────────────────────────────────

const KEYFRAMES = `
@keyframes fj-ember-pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.9; }
  50%       { transform: translate(-50%, -50%) scale(1.6); opacity: 0.5; }
}
@keyframes fj-ember-ring {
  0%   { transform: translate(-50%, -50%) scale(0.5); opacity: 0.6; }
  100% { transform: translate(-50%, -50%) scale(3.5); opacity: 0; }
}
@keyframes fj-particle-rise {
  0%   { transform: translateY(0) translateX(0) scale(1); opacity: var(--p-opacity); }
  100% { transform: translateY(calc(var(--p-dy) * 1px)) translateX(calc(var(--p-dx) * 1px)) scale(0.1); opacity: 0; }
}
@keyframes fj-letter-flash {
  0%   { color: #FFFFFF; text-shadow: 0 0 40px #FFFFFF, 0 0 80px #FFD700, 0 0 120px #FF6B2B; }
  100% { color: transparent; text-shadow: none; }
}
@keyframes fj-holo-gradient {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes fj-holo-glow {
  0%, 100% { text-shadow: 0 0 30px rgba(212,175,55,0.8), 0 0 60px rgba(212,175,55,0.4), 0 0 100px rgba(96,165,250,0.3); }
  33%       { text-shadow: 0 0 30px rgba(255,107,157,0.8), 0 0 60px rgba(255,107,157,0.4), 0 0 100px rgba(45,212,191,0.3); }
  66%       { text-shadow: 0 0 30px rgba(96,165,250,0.8), 0 0 60px rgba(96,165,250,0.4), 0 0 100px rgba(212,175,55,0.3); }
}
@keyframes fj-scanline-sweep {
  0%   { top: -2px; opacity: 1; }
  95%  { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}
@keyframes fj-scanline-glow-trail {
  0%   { top: -20px; opacity: 0.3; height: 20px; }
  100% { top: calc(100% - 20px); opacity: 0; height: 60px; }
}
@keyframes fj-bar-ember {
  0%   { transform: translateY(0) scale(1); opacity: 0.9; }
  100% { transform: translateY(-24px) translateX(calc(var(--spark-dx) * 1px)) scale(0); opacity: 0; }
}
@keyframes fj-skip-pulse {
  0%, 100% { opacity: 0.2; }
  50%       { opacity: 0.4; }
}
@keyframes fj-corner-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes fj-tagline-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fj-forge-flicker {
  0%, 100% { opacity: 1; }
  45%       { opacity: 0.85; }
  50%       { opacity: 1; }
  70%       { opacity: 0.9; }
}
`

// ─── Sub-components ───────────────────────────────────────────────────────────

function Particles({ active }: { active: boolean }) {
  if (!active) return null

  return (
    <div
      aria-hidden
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}
    >
      {PARTICLE_DATA.map((p) => (
        <div
          key={p.i}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            backgroundColor: '#D4AF37',
            '--p-dy': p.dy,
            '--p-dx': p.dx,
            '--p-opacity': p.opacity,
            animation: `fj-particle-rise ${p.duration}s ease-out ${p.delay}s infinite`,
            willChange: 'transform, opacity',
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

function BarSparks({ active }: { active: boolean }) {
  if (!active) return null
  return (
    <div
      aria-hidden
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}
    >
      {SPARK_DATA.map((s) => (
        <div
          key={s.i}
          style={{
            position: 'absolute',
            right: 0,
            top: '50%',
            width: s.width,
            height: s.height,
            borderRadius: '50%',
            backgroundColor: s.color,
            '--spark-dx': s.dx,
            animation: `fj-bar-ember ${s.duration}s ease-out ${s.i * 0.08}s infinite`,
            willChange: 'transform, opacity',
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SplashScreen({ children }: { children: React.ReactNode }) {
  // SSR guard — render nothing until client hydration
  const [isMounted, setIsMounted] = useState(false)
  const [splashState, setSplashState] = useState<'pending' | 'active' | 'done'>('pending')
  const [phase, setPhase] = useState(0) // 0=void, 1=scanline, 2=holo, 3=progress, 4=exit
  const [revealedCount, setRevealedCount] = useState(0)
  const [showScanLine, setShowScanLine] = useState(false)
  const [showShatter, setShowShatter] = useState(false)
  const [shatterActive, setShatterActive] = useState(false)
  const [quench, setQuench] = useState(false)

  // DOM refs for GPU-only writes (no React re-renders in tight loops)
  const overlayRef       = useRef<HTMLDivElement>(null)
  const childrenWrapRef  = useRef<HTMLDivElement>(null)
  const barFillRef       = useRef<HTMLDivElement>(null)
  const barLeadRef       = useRef<HTMLDivElement>(null)
  const pctLabelRef      = useRef<HTMLSpanElement>(null)
  const stageLabelRef    = useRef<HTMLSpanElement>(null)
  const letterRefs       = useRef<(HTMLSpanElement | null)[]>([])
  const holoTextRef      = useRef<HTMLDivElement>(null)

  const rafRef             = useRef<number>(0)
  const startTimeRef       = useRef<number>(-1)
  const exitStartedRef     = useRef(false)
  const lastPctIntRef      = useRef(-1)
  const lastStageRef       = useRef('')
  const stageFadingRef     = useRef(false)
  const lettersRevealedRef = useRef(0)
  // Track phase in a ref so the rAF loop always reads the current value
  const phaseRef           = useRef(0)
  // Pending timeout handles for cleanup on unmount
  const pendingTimersRef   = useRef<ReturnType<typeof setTimeout>[]>([])

  // Helper to register a timeout that is auto-cancelled on unmount
  const safeTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      pendingTimersRef.current = pendingTimersRef.current.filter((t) => t !== id)
      fn()
    }, ms)
    pendingTimersRef.current.push(id)
    return id
  }, [])

  // ── Inject CSS keyframes once ────────────────────────────────────────────
  useEffect(() => {
    if (document.getElementById('fj-df-kf')) return
    const el = document.createElement('style')
    el.id = 'fj-df-kf'
    el.textContent = KEYFRAMES
    document.head.appendChild(el)
  }, [])

  // ── Mount flag + remove data-loading attribute ────────────────────────────
  useEffect(() => {
    setIsMounted(true)
    // Remove the data-loading attribute set by the inline script in layout.tsx
    // so the animation-suppression style rule no longer applies.
    document.documentElement.removeAttribute('data-loading')
  }, [])

  // ── Session gate + reduced-motion ────────────────────────────────────────
  useEffect(() => {
    if (!isMounted) return

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const rm = mq.matches

    // Listen for OS-level preference changes during the session
    const handleMqChange = (e: MediaQueryListEvent) => {
      if (e.matches && splashState === 'active') {
        // User turned on reduced-motion mid-splash — bail immediately
        setSplashState('done')
      }
    }
    mq.addEventListener('change', handleMqChange)

    const seen = sessionStorage.getItem('fj_df_splash')
    if (seen || rm) {
      setSplashState('done')
    } else {
      sessionStorage.setItem('fj_df_splash', '1')
      setSplashState('active')
    }

    return () => mq.removeEventListener('change', handleMqChange)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted])

  // ── Cleanup all pending timers on unmount ────────────────────────────────
  useEffect(() => {
    return () => {
      for (const id of pendingTimersRef.current) clearTimeout(id)
      pendingTimersRef.current = []
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // ── Letter reveal: stamp each revealed letter's visibility ───────────────
  useEffect(() => {
    if (splashState !== 'active') return
    letterRefs.current.forEach((el, i) => {
      if (!el) return
      if (i < revealedCount) {
        el.style.opacity = '1'
        el.style.pointerEvents = ''
      } else {
        el.style.opacity = '0'
        el.style.pointerEvents = 'none'
      }
    })
  }, [revealedCount, splashState])

  // ── Exit trigger ─────────────────────────────────────────────────────────
  const triggerExit = useCallback(() => {
    if (exitStartedRef.current) return
    exitStartedRef.current = true

    // Phase 5: white quench flash
    setQuench(true)
    safeTimeout(() => setQuench(false), 80)

    // Shatter — two rAF frames ensure CSS transition detects the state change
    safeTimeout(() => {
      setShowShatter(true)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setShatterActive(true))
      })
    }, 100)

    // Reveal children behind the shatter
    if (childrenWrapRef.current) {
      childrenWrapRef.current.style.opacity = '1'
      childrenWrapRef.current.style.pointerEvents = ''
    }

    safeTimeout(() => setSplashState('done'), EXIT_COMPLETE - PHASE5_START + 50)
  }, [safeTimeout])

  // ── Click to skip ─────────────────────────────────────────────────────────
  const handleSkip = useCallback(() => {
    if (splashState !== 'active' || exitStartedRef.current) return
    cancelAnimationFrame(rafRef.current)
    // Cancel any pending stage-label fade timeout by clearing stageFadingRef
    stageFadingRef.current = false
    triggerExit()
  }, [splashState, triggerExit])

  // ── Main rAF loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (splashState !== 'active') return

    const animate = (ts: number) => {
      if (startTimeRef.current < 0) startTimeRef.current = ts
      const elapsed = ts - startTimeRef.current

      // Phase 0 → 1: activate scan line
      if (elapsed >= PHASE2_START && phaseRef.current === 0) {
        phaseRef.current = 1
        setPhase(1)
        setShowScanLine(true)
      }

      // Phase 1: reveal letters as scan line sweeps (500ms → 1800ms)
      if (elapsed >= PHASE2_START && elapsed < PHASE2_END) {
        const scanT = (elapsed - PHASE2_START) / (PHASE2_END - PHASE2_START)
        const targetRevealed = Math.min(
          Math.floor(scanT * (LETTERS.length + 1)),
          LETTERS.length
        )
        if (targetRevealed > lettersRevealedRef.current) {
          lettersRevealedRef.current = targetRevealed
          setRevealedCount(targetRevealed)
        }
      }

      // Phase 2: holographic pulse (550ms → 800ms)
      if (elapsed >= PHASE3_START && phaseRef.current < 2) {
        phaseRef.current = 2
        setPhase(2)
        setShowScanLine(false)
        setRevealedCount(LETTERS.length)
        lettersRevealedRef.current = LETTERS.length
      }

      // Phase 3: progress forge (800ms → 1200ms)
      if (elapsed >= PHASE4_START && phaseRef.current < 3) {
        phaseRef.current = 3
        setPhase(3)
      }

      if (elapsed >= PHASE4_START && elapsed < PHASE4_END) {
        const rawT = (elapsed - PHASE4_START) / (PHASE4_END - PHASE4_START)
        const eased = easeInOutCubic(rawT)
        const pct = eased * 100

        // GPU-only bar fill
        if (barFillRef.current) {
          barFillRef.current.style.transform = `scaleX(${eased})`
        }
        if (barLeadRef.current) {
          barLeadRef.current.style.opacity = pct > 1 && pct < 99.5 ? '1' : '0'
        }

        const pctInt = Math.floor(pct)
        if (pctLabelRef.current && pctInt !== lastPctIntRef.current) {
          lastPctIntRef.current = pctInt
          pctLabelRef.current.textContent = pctInt + '%'
        }

        const label = getStageLabel(pct)
        if (label !== lastStageRef.current && !stageFadingRef.current) {
          lastStageRef.current = label
          stageFadingRef.current = true
          const el = stageLabelRef.current
          if (el) {
            el.style.opacity = '0'
            safeTimeout(() => {
              if (!stageFadingRef.current) return // skip was triggered
              if (el) { el.textContent = label; el.style.opacity = '1' }
              stageFadingRef.current = false
            }, 200)
          }
        }
      }

      // Phase 4 end → exit
      if (elapsed >= PHASE4_END && !exitStartedRef.current) {
        cancelAnimationFrame(rafRef.current)
        phaseRef.current = 4
        setPhase(4)
        triggerExit()
        return
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [splashState])

  // ── Guard renders ─────────────────────────────────────────────────────────
  // Before mount (SSR and first paint) render children directly so there is
  // no blank frame — the inline script in layout.tsx already set the dark bg.
  if (!isMounted || splashState === 'pending') return <>{children}</>
  if (splashState === 'done') return <>{children}</>

  const isHolo = phase >= 2

  // ── JSX ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Children behind splash — hidden until exit begins */}
      <div
        ref={childrenWrapRef}
        aria-hidden
        style={{
          opacity: 0,
          pointerEvents: 'none',
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          transition: 'opacity 350ms cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'opacity',
        }}
      >
        {children}
      </div>

      {/* ── Splash overlay ────────────────────────────────────────────────── */}
      <div
        ref={overlayRef}
        role="status"
        aria-label="Loading ForjeGames"
        aria-live="polite"
        onClick={handleSkip}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          backgroundColor: quench ? '#FFFFFF' : '#0a0a0a',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          userSelect: 'none',
          overflow: 'hidden',
          transition: quench ? 'background-color 0ms' : 'background-color 120ms ease-out',
        }}
      >
        {/* Shatter fragments */}
        {showShatter && SHATTER_FRAGMENTS.map((clip, i) => (
          <div
            key={i}
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: '#0a0a0a',
              clipPath: clip,
              transform: shatterActive ? SHATTER_TRANSFORMS[i] : 'none',
              opacity: shatterActive ? 0 : 1,
              transition: `transform ${300 + i * 40}ms cubic-bezier(0.55, 0, 1, 0.45) ${i * 35}ms, opacity ${280 + i * 30}ms ease-out ${i * 35}ms`,
              zIndex: 10,
              willChange: 'transform, opacity',
            }}
          />
        ))}

        {/* Radial vignette */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: 'radial-gradient(ellipse 70% 60% at center, transparent 30%, rgba(0,0,0,0.85) 100%)',
            zIndex: 1,
          }}
        />

        {/* CRT scanlines texture */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.012) 2px, rgba(255,255,255,0.012) 4px)',
            zIndex: 1,
          }}
        />

        {/* Ambient forge glow — center bloom */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 600,
            height: 300,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background: isHolo
              ? 'radial-gradient(ellipse at center, rgba(212,175,55,0.12) 0%, rgba(96,165,250,0.06) 50%, transparent 70%)'
              : 'radial-gradient(ellipse at center, rgba(212,175,55,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
            zIndex: 1,
            transition: 'background 800ms ease',
          }}
        />

        {/* Phase 1: Single gold ember at center (visible in void phase) */}
        {phase === 0 && (
          <div aria-hidden style={{ position: 'absolute', left: '50%', top: '50%', zIndex: 3, pointerEvents: 'none' }}>
            {/* Pulsing core ember */}
            <div
              style={{
                position: 'absolute',
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#D4AF37',
                boxShadow: '0 0 16px 6px rgba(212,175,55,0.8), 0 0 32px 12px rgba(255,107,43,0.4)',
                animation: 'fj-ember-pulse 800ms ease-in-out infinite',
                willChange: 'transform, opacity',
              }}
            />
            {/* Expanding ring */}
            <div
              style={{
                position: 'absolute',
                width: 8,
                height: 8,
                borderRadius: '50%',
                border: '1px solid rgba(212,175,55,0.6)',
                animation: 'fj-ember-ring 1.2s ease-out infinite',
                willChange: 'transform, opacity',
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: 8,
                height: 8,
                borderRadius: '50%',
                border: '1px solid rgba(212,175,55,0.3)',
                animation: 'fj-ember-ring 1.2s ease-out 0.4s infinite',
                willChange: 'transform, opacity',
              }}
            />
          </div>
        )}

        {/* Floating particles — always active */}
        <Particles active={splashState === 'active'} />

        {/* Scan line sweep */}
        {showScanLine && (
          <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 4 }}>
            {/* Main laser line */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: 2,
                background: 'linear-gradient(90deg, transparent, #D4AF37 10%, #FFFFFF 50%, #D4AF37 90%, transparent)',
                boxShadow: '0 0 12px 4px rgba(212,175,55,0.9), 0 0 24px 8px rgba(255,255,255,0.5)',
                animation: `fj-scanline-sweep ${PHASE2_END - PHASE2_START}ms linear forwards`,
                willChange: 'top, opacity',
              }}
            />
            {/* Glow trail behind laser */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: 20,
                background: 'linear-gradient(180deg, transparent, rgba(212,175,55,0.15))',
                animation: `fj-scanline-glow-trail ${PHASE2_END - PHASE2_START}ms linear forwards`,
                willChange: 'top, opacity, height',
              }}
            />
          </div>
        )}

        {/* ── Main content ──────────────────────────────────────────────────── */}
        <div
          style={{
            position: 'relative',
            zIndex: 5,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.75rem',
            padding: '2rem',
            width: '100%',
            maxWidth: '800px',
          }}
        >
          {/* Logo text block */}
          <div
            ref={holoTextRef}
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {/* Individual letters for burn-in effect */}
            <div
              style={{
                display: 'flex',
                gap: '0.08em',
                position: 'relative',
              }}
            >
              {LETTERS.map((letter, i) => {
                const isRevealed = i < revealedCount
                return (
                  <span
                    key={i}
                    ref={(el) => { letterRefs.current[i] = el }}
                    style={{
                      display: 'inline-block',
                      fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif',
                      fontWeight: 900,
                      fontSize: 'clamp(3rem, 10vw, 6rem)',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      lineHeight: 1,
                      // Holographic gradient text
                      background: 'linear-gradient(90deg, #D4AF37, #FF6B9D, #60A5FA, #2DD4BF, #D4AF37)',
                      backgroundSize: '300% 100%',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      // Animations
                      animation: isRevealed && phase >= 2
                        ? 'fj-holo-gradient 2s linear infinite, fj-holo-glow 2s ease-in-out infinite, fj-forge-flicker 4s ease-in-out infinite'
                        : isRevealed
                        ? 'fj-holo-gradient 3s linear infinite'
                        : 'none',
                      opacity: isRevealed ? 1 : 0,
                      pointerEvents: isRevealed ? 'auto' : 'none',
                      willChange: 'background-position, opacity',
                      // Stagger gradient offset per letter for wave effect
                      animationDelay: isRevealed ? `${i * -0.15}s, ${i * -0.2}s, ${i * 0.3}s` : '0s',
                    }}
                  >
                    {letter}
                  </span>
                )
              })}
            </div>

            {/* Tagline — fades in at phase >= 2 */}
            <p
              style={{
                margin: 0,
                color: '#B0B0B0',
                fontSize: '0.85rem',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
                opacity: phase >= 2 ? 1 : 0,
                transform: phase >= 2 ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 600ms ease, transform 600ms ease',
                willChange: 'opacity, transform',
              }}
            >
              AI-Powered Game Development
            </p>
          </div>

          {/* ── Progress Forge Bar (Phase 3+) ───────────────────────────────── */}
          <div
            style={{
              width: '56%',
              minWidth: '300px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              gap: '0.5rem',
              opacity: phase >= 3 ? 1 : 0,
              transform: phase >= 3 ? 'translateY(0)' : 'translateY(10px)',
              transition: 'opacity 400ms ease, transform 400ms ease',
              willChange: 'opacity, transform',
            }}
          >
            {/* Pct counter */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <span
                ref={pctLabelRef}
                style={{
                  fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
                  fontSize: '0.72rem',
                  color: '#D4AF37',
                  letterSpacing: '0.08em',
                }}
              >
                0%
              </span>
            </div>

            {/* Track */}
            <div
              style={{
                width: '100%',
                height: '4px',
                backgroundColor: 'rgba(212,175,55,0.12)',
                borderRadius: '9999px',
                position: 'relative',
                overflow: 'visible',
                border: '1px solid rgba(212,175,55,0.15)',
              }}
            >
              {/* Molten fill — dark red → orange → gold → white tip */}
              <div
                ref={barFillRef}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '9999px',
                  background: 'linear-gradient(90deg, #5C0000 0%, #CC3300 20%, #FF6B2B 50%, #D4AF37 75%, #D4AF37 90%, #FFFFFF 100%)',
                  boxShadow: '0 0 8px 2px rgba(212,175,55,0.5), 0 0 16px 4px rgba(255,107,43,0.3)',
                  transform: 'scaleX(0)',
                  transformOrigin: 'left center',
                  willChange: 'transform',
                }}
              />

              {/* White-hot leading edge glow */}
              <div
                ref={barLeadRef}
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: 0,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 0 12px 5px rgba(255,255,255,0.9), 0 0 24px 8px rgba(255,180,50,0.6)',
                  transform: 'translate(50%, -50%)',
                  opacity: 0,
                  pointerEvents: 'none',
                  willChange: 'opacity',
                }}
              />

              {/* Spark particles off leading edge */}
              <BarSparks active={phase >= 3} />
            </div>

            {/* Stage label */}
            <span
              ref={stageLabelRef}
              style={{
                fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
                fontSize: '0.7rem',
                color: 'rgba(212,175,55,0.65)',
                letterSpacing: '0.06em',
                transition: 'opacity 200ms ease',
              }}
            >
              Heating the forge...
            </span>
          </div>

          {/* Skip hint */}
          <p
            style={{
              margin: 0,
              color: 'rgba(255,255,255,0.2)',
              fontSize: '0.62rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
              animation: 'fj-skip-pulse 2.5s ease-in-out infinite',
            }}
          >
            Click anywhere to skip
          </p>
        </div>

        {/* Corner bracket decorations */}
        {(['tl', 'tr', 'bl', 'br'] as const).map((pos) => {
          const isTop  = pos === 'tl' || pos === 'tr'
          const isLeft = pos === 'tl' || pos === 'bl'
          return (
            <div
              key={pos}
              aria-hidden
              style={{
                position: 'absolute',
                width: 20,
                height: 20,
                zIndex: 6,
                ...(isTop  ? { top: 24 }    : { bottom: 24 }),
                ...(isLeft ? { left: 24 }   : { right: 24 }),
                borderTopWidth:    isTop  ? '1.5px' : '0',
                borderBottomWidth: !isTop  ? '1.5px' : '0',
                borderLeftWidth:   isLeft  ? '1.5px' : '0',
                borderRightWidth:  !isLeft ? '1.5px' : '0',
                borderStyle: 'solid',
                borderColor: 'rgba(212,175,55,0.4)',
                animation: 'fj-corner-in 600ms ease-out 200ms both',
              }}
            />
          )
        })}

        {/* Forge floor — subtle horizontal light line at bottom of text */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            bottom: '30%',
            left: '20%',
            right: '20%',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.2) 20%, rgba(212,175,55,0.4) 50%, rgba(212,175,55,0.2) 80%, transparent)',
            zIndex: 2,
            opacity: phase >= 1 ? 1 : 0,
            transition: 'opacity 800ms ease',
          }}
        />
      </div>
    </>
  )
}
