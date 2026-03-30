'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

// ─── Constants ───────────────────────────────────────────────────────────────

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%'
const TARGET_TEXT = 'FORJEGAMES'
const LETTER_RESOLVE_INTERVAL = 80 // ms between each letter resolving

// Phase timing (ms from animation start)
const PHASE1_END    = 300   // black -> grid fade-in
const PHASE2_START  = 300   // scramble begins
const PHASE2_END    = 1500  // scramble ends
const TAGLINE_FADE  = 1200  // tagline appears
const PHASE3_START  = 1500  // glitch burst
const PHASE3_END    = 2000
const PHASE4_START  = 1800  // progress bar
const PHASE4_END    = 3200
const PHASE5_HOLD   = 200   // hold before exit
const EXIT_DURATION = 400   // fade-out ms

const STAGE_LABELS = [
  { threshold: 0,  label: 'Initializing systems...' },
  { threshold: 25, label: 'Loading AI models...' },
  { threshold: 50, label: 'Connecting services...' },
  { threshold: 75, label: 'Ready.' },
]

const GLITCH_FRAMES = [
  { inset: 'inset(15% 0 72% 0)', offsetX: 3 },
  { inset: 'inset(48% 0 40% 0)', offsetX: -2 },
  { inset: 'inset(71% 0 18% 0)', offsetX: 4 },
]

// CSS keyframes injected once into <head> — no runtime overhead per render
const KEYFRAMES = [
  '@keyframes fj-grid-in {',
  '  from { opacity: 0; }',
  '  to   { opacity: 0.15; }',
  '}',
  '@keyframes fj-skip-pulse {',
  '  0%, 100% { opacity: 0.18; }',
  '  50%       { opacity: 0.32; }',
  '}',
  '@keyframes fj-corner-in {',
  '  from { opacity: 0; }',
  '  to   { opacity: 1; }',
  '}',
].join('\n')

// ─── Helpers ─────────────────────────────────────────────────────────────────

function randomChar(): string {
  return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
}

function getStageLabel(pct: number): string {
  let label = STAGE_LABELS[0].label
  for (const s of STAGE_LABELS) {
    if (pct >= s.threshold) label = s.label
  }
  return label
}

// Approximates cubic-bezier(0.4, 0, 0.2, 1) — starts fast, eases into end
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SplashScreen({ children }: { children: React.ReactNode }) {
  // 'pending' = sessionStorage not yet checked (render nothing — prevents flash)
  // 'active'  = splash is running
  // 'done'    = render children normally
  const [splashState, setSplashState] = useState<'pending' | 'active' | 'done'>('pending')
  const [reducedMotion, setReducedMotion] = useState(false)

  // DOM refs — all per-frame writes go directly to the DOM.
  // Zero React state updates per rAF tick = true compositor-thread 60fps.
  const overlayRef      = useRef<HTMLDivElement>(null)
  const scrambleRef     = useRef<HTMLSpanElement>(null)
  const glitchGoldRef   = useRef<HTMLSpanElement>(null)
  const glitchBlueRef   = useRef<HTMLSpanElement>(null)
  const glitchWrapRef   = useRef<HTMLDivElement>(null)
  const taglineRef      = useRef<HTMLParagraphElement>(null)
  const barFillRef      = useRef<HTMLDivElement>(null)
  const barDotRef       = useRef<HTMLDivElement>(null)
  const pctLabelRef     = useRef<HTMLSpanElement>(null)
  const stageLabelRef   = useRef<HTMLSpanElement>(null)
  const childrenWrapRef = useRef<HTMLDivElement>(null)

  // rAF loop state
  const rafRef         = useRef<number>(0)
  const startTimeRef   = useRef<number>(-1)
  const exitStartedRef = useRef(false)
  const lastPctIntRef  = useRef(-1)
  const lastStageRef   = useRef('')
  const stageFadingRef = useRef(false)

  // ── Inject CSS keyframes once ────────────────────────────────────────────
  useEffect(() => {
    if (document.getElementById('fj-splash-kf')) return
    const el = document.createElement('style')
    el.id = 'fj-splash-kf'
    el.textContent = KEYFRAMES
    document.head.appendChild(el)
  }, [])

  // ── Session gate + reduced-motion detection ──────────────────────────────
  useEffect(() => {
    document.documentElement.removeAttribute('data-loading')
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const seen = sessionStorage.getItem('fj_splash_seen')
    if (seen) { setSplashState('done'); return }
    sessionStorage.setItem('fj_splash_seen', '1')
    setSplashState('active')
  }, [])

  // ── Exit sequence: glitch flash → fade → scale ───────────────────────────
  const triggerExit = useCallback((rm: boolean) => {
    if (exitStartedRef.current) return
    exitStartedRef.current = true
    const overlay = overlayRef.current
    if (!overlay) return
    // Brief brightness flash before fade
    if (!rm) {
      overlay.style.filter = 'brightness(1.5)'
      setTimeout(() => { if (overlay) overlay.style.filter = '' }, 80)
    }
    overlay.style.transition = [
      'opacity ' + EXIT_DURATION + 'ms cubic-bezier(0.4,0,1,1)',
      'transform ' + EXIT_DURATION + 'ms cubic-bezier(0.4,0,1,1)',
    ].join(', ')
    overlay.style.opacity = '0'
    overlay.style.transform = 'scale(1.02)'
    if (childrenWrapRef.current) childrenWrapRef.current.style.visibility = 'visible'
    setTimeout(() => setSplashState('done'), EXIT_DURATION + 60)
  }, [])

  // ── Click to skip ────────────────────────────────────────────────────────
  const handleSkip = useCallback(() => {
    if (splashState !== 'active' || exitStartedRef.current) return
    cancelAnimationFrame(rafRef.current)
    triggerExit(reducedMotion)
  }, [splashState, reducedMotion, triggerExit])

  // ── Main rAF animation loop ──────────────────────────────────────────────
  useEffect(() => {
    if (splashState !== 'active') return
    const rm = reducedMotion // capture in closure — avoids stale ref reads

    const animate = (ts: number) => {
      if (startTimeRef.current < 0) startTimeRef.current = ts
      const elapsed = ts - startTimeRef.current

      // ── Phase 2: Letter scramble, left-to-right (300ms–1500ms) ───────────
      if (!rm && elapsed >= PHASE2_START && elapsed < PHASE2_END) {
        const phaseT = elapsed - PHASE2_START
        const resolved = Math.min(
          Math.floor(phaseT / LETTER_RESOLVE_INTERVAL),
          TARGET_TEXT.length
        )
        let display = ''
        for (let i = 0; i < TARGET_TEXT.length; i++) {
          display += i < resolved ? TARGET_TEXT[i] : randomChar()
        }
        if (scrambleRef.current)   scrambleRef.current.textContent   = display
        if (glitchGoldRef.current) glitchGoldRef.current.textContent = display
        if (glitchBlueRef.current) glitchBlueRef.current.textContent = display
      }

      // Lock text when scramble ends
      if (elapsed >= PHASE2_END) {
        const scr = scrambleRef.current
        if (scr && scr.textContent !== TARGET_TEXT) {
          scr.textContent = TARGET_TEXT
          if (glitchGoldRef.current) glitchGoldRef.current.textContent = TARGET_TEXT
          if (glitchBlueRef.current) glitchBlueRef.current.textContent = TARGET_TEXT
        }
      }

      // ── Tagline fade-in at 1200ms ─────────────────────────────────────────
      if (elapsed >= TAGLINE_FADE) {
        const t = taglineRef.current
        if (t && t.style.opacity !== '1') {
          t.style.opacity = '1'
          t.style.transform = 'translateY(0)'
        }
      }

      // ── Phase 3: Glitch burst — 3 clip-path frames + shake (1500ms–2000ms) ─
      if (!rm && elapsed >= PHASE3_START && elapsed < PHASE3_END) {
        const phaseT = elapsed - PHASE3_START
        const phaseDur = PHASE3_END - PHASE3_START
        const fi = Math.min(
          Math.floor((phaseT / phaseDur) * GLITCH_FRAMES.length),
          GLITCH_FRAMES.length - 1
        )
        const frame = GLITCH_FRAMES[fi]
        const gold = glitchGoldRef.current
        const blue = glitchBlueRef.current
        if (gold) {
          gold.style.clipPath = frame.inset
          gold.style.transform = 'translateX(' + frame.offsetX + 'px)'
          gold.style.opacity = '0.9'
        }
        if (blue) {
          blue.style.clipPath = frame.inset
          blue.style.transform = 'translateX(' + (-frame.offsetX) + 'px)'
          blue.style.opacity = '0.9'
        }
        if (glitchWrapRef.current) {
          glitchWrapRef.current.style.transform = 'translateX(' + (fi % 2 === 0 ? -2 : 2) + 'px)'
        }
      }

      // Settle aberration layers after glitch burst
      if (elapsed >= PHASE3_END) {
        const gold = glitchGoldRef.current
        const blue = glitchBlueRef.current
        if (gold && gold.style.clipPath !== '') {
          gold.style.clipPath = ''
          gold.style.transform = 'translateX(-2px)'
          gold.style.opacity = '0.4'
        }
        if (blue && blue.style.clipPath !== '') {
          blue.style.clipPath = ''
          blue.style.transform = 'translateX(2px)'
          blue.style.opacity = '0.4'
        }
        if (glitchWrapRef.current && glitchWrapRef.current.style.transform !== '') {
          glitchWrapRef.current.style.transform = ''
        }
      }

      // ── Phase 4: Progress bar with easing (1800ms–3200ms) ────────────────
      if (elapsed >= PHASE4_START) {
        const rawT = Math.min((elapsed - PHASE4_START) / (PHASE4_END - PHASE4_START), 1)
        const eased = easeInOutCubic(rawT)
        const pct = eased * 100
        const pctInt = Math.floor(pct)

        // scaleX is compositor-only — zero layout thrash
        if (barFillRef.current) {
          barFillRef.current.style.transform = 'scaleX(' + eased + ')'
        }
        if (barDotRef.current) {
          barDotRef.current.style.opacity = (pct > 1 && pct < 99.5) ? '1' : '0'
        }
        // Only update pct label on integer change
        if (pctLabelRef.current && pctInt !== lastPctIntRef.current) {
          lastPctIntRef.current = pctInt
          pctLabelRef.current.textContent = pctInt + '%'
        }
        // Stage label with 200ms opacity cross-fade
        const label = getStageLabel(pct)
        if (label !== lastStageRef.current && !stageFadingRef.current) {
          lastStageRef.current = label
          stageFadingRef.current = true
          const el = stageLabelRef.current
          if (el) {
            el.style.opacity = '0'
            setTimeout(() => {
              if (el) { el.textContent = label; el.style.opacity = '1' }
              stageFadingRef.current = false
            }, 200)
          }
        }
      }

      // ── Phase 5: trigger exit after bar + hold ────────────────────────────
      if (elapsed >= PHASE4_END + PHASE5_HOLD && !exitStartedRef.current) {
        cancelAnimationFrame(rafRef.current)
        triggerExit(rm)
        return
      }
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [splashState, reducedMotion, triggerExit])

  // Reduced motion: skip to static visible state immediately
  useEffect(() => {
    if (splashState !== 'active' || !reducedMotion) return
    if (scrambleRef.current) scrambleRef.current.textContent = TARGET_TEXT
    const t = taglineRef.current
    if (t) { t.style.opacity = '1'; t.style.transform = 'translateY(0)' }
  }, [splashState, reducedMotion])

  // ── Guard renders ────────────────────────────────────────────────────────
  if (splashState === 'pending') return null
  if (splashState === 'done') return <>{children}</>

  // ── JSX ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Children rendered behind splash — visibility:hidden prevents layout shift */}
      <div
        ref={childrenWrapRef}
        aria-hidden
        style={{ visibility: 'hidden', position: 'fixed', inset: 0, zIndex: 0 }}
      >
        {children}
      </div>

      {/* ── Splash overlay ───────────────────────────────────────────────── */}
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
          backgroundColor: '#0a0a0a',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          userSelect: 'none',
          willChange: 'opacity, transform',
          overflow: 'hidden',
        }}
      >
        {/* Grid pattern — CSS animation, own compositor layer */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            backgroundImage: [
              'linear-gradient(rgba(255,255,255,0.055) 1px, transparent 1px)',
              'linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px)',
            ].join(', '),
            backgroundSize: '40px 40px',
            opacity: 0,
            animation: reducedMotion
              ? 'none'
              : 'fj-grid-in 600ms ease-out ' + PHASE1_END + 'ms forwards',
          }}
        />

        {/* Radial vignette */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.72) 100%)',
          }}
        />

        {/* CRT scanlines */}
        {!reducedMotion && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.014) 2px, rgba(255,255,255,0.014) 4px)',
            }}
          />
        )}

        {/* ── Main content ────────────────────────────────────────────────── */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.5rem',
            padding: '2rem',
            width: '100%',
            maxWidth: '640px',
          }}
        >
          {/* Logo + glitch wrapper — this div is the screen-shake target */}
          <div ref={glitchWrapRef} style={{ position: 'relative', willChange: 'transform' }}>

            {/* Gold chromatic aberration layer */}
            {!reducedMotion && (
              <span
                ref={glitchGoldRef}
                aria-hidden
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  pointerEvents: 'none',
                  fontFamily: 'var(--font-inter), Inter, sans-serif',
                  fontWeight: 900,
                  fontSize: '5rem',
                  letterSpacing: '0.15em',
                  whiteSpace: 'nowrap',
                  color: '#D4AF37',
                  opacity: 0.4,
                  transform: 'translateX(-2px)',
                  willChange: 'transform, clip-path, opacity',
                }}
              >
                {TARGET_TEXT}
              </span>
            )}

            {/* Blue chromatic aberration layer */}
            {!reducedMotion && (
              <span
                ref={glitchBlueRef}
                aria-hidden
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  pointerEvents: 'none',
                  fontFamily: 'var(--font-inter), Inter, sans-serif',
                  fontWeight: 900,
                  fontSize: '5rem',
                  letterSpacing: '0.15em',
                  whiteSpace: 'nowrap',
                  color: '#60A5FA',
                  opacity: 0.4,
                  transform: 'translateX(2px)',
                  willChange: 'transform, clip-path, opacity',
                }}
              >
                {TARGET_TEXT}
              </span>
            )}

            {/* Main logo — white text, gold glow */}
            <span
              ref={scrambleRef}
              style={{
                display: 'block',
                position: 'relative',
                fontFamily: 'var(--font-inter), Inter, sans-serif',
                fontWeight: 900,
                fontSize: '5rem',
                letterSpacing: '0.15em',
                whiteSpace: 'nowrap',
                color: '#FFFFFF',
                textShadow: '0 0 30px rgba(212,175,55,0.55), 0 0 60px rgba(212,175,55,0.22)',
              }}
            >
              {/* rAF populates this each frame; reduced-motion pre-fills it */}
              {reducedMotion ? TARGET_TEXT : ''}
            </span>
          </div>

          {/* Tagline */}
          <p
            ref={taglineRef}
            style={{
              margin: 0,
              marginTop: '-0.75rem',
              color: 'rgba(255,255,255,0.42)',
              fontSize: '0.75rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
              opacity: reducedMotion ? 1 : 0,
              transform: reducedMotion ? 'none' : 'translateY(6px)',
              transition: 'opacity 400ms ease, transform 400ms ease',
              willChange: 'opacity, transform',
            }}
          >
            AI-Powered Game Development
          </p>

          {/* ── Progress bar ────────────────────────────────────────────────── */}
          <div
            style={{
              width: '60%',
              minWidth: '280px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              gap: '0.45rem',
            }}
          >
            {/* Percentage counter — right aligned */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <span
                ref={pctLabelRef}
                style={{
                  fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
                  fontSize: '0.7rem',
                  color: '#D4AF37',
                  letterSpacing: '0.06em',
                }}
              >
                0%
              </span>
            </div>

            {/* Bar track */}
            <div
              style={{
                width: '100%',
                height: '3px',
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderRadius: '9999px',
                position: 'relative',
                overflow: 'visible',
              }}
            >
              {/* Gold fill — scaleX only, compositor-thread, no layout */}
              <div
                ref={barFillRef}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '9999px',
                  background: 'linear-gradient(90deg, #D4AF37, #FFB81C, #D4AF37)',
                  boxShadow: '0 0 20px rgba(212,175,55,0.4)',
                  transform: 'scaleX(0)',
                  transformOrigin: 'left center',
                  willChange: 'transform',
                }}
              />
              {/* Leading glow dot */}
              <div
                ref={barDotRef}
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: 0,
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#FFD700',
                  boxShadow: '0 0 8px 3px rgba(255,215,0,0.65)',
                  transform: 'translate(50%, -50%)',
                  opacity: 0,
                  pointerEvents: 'none',
                  willChange: 'opacity',
                }}
              />
            </div>

            {/* Stage text */}
            <span
              ref={stageLabelRef}
              style={{
                fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
                fontSize: '0.68rem',
                color: 'rgba(255,255,255,0.38)',
                letterSpacing: '0.05em',
                transition: 'opacity 200ms ease',
              }}
            >
              Initializing systems...
            </span>
          </div>

          {/* Skip hint */}
          <p
            style={{
              margin: 0,
              marginTop: '-0.25rem',
              color: 'rgba(255,255,255,0.18)',
              fontSize: '0.62rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
              animation: reducedMotion
                ? 'none'
                : 'fj-skip-pulse 2.5s ease-in-out infinite',
            }}
          >
            Click anywhere to skip
          </p>
        </div>

        {/* Corner bracket decorations */}
        {!reducedMotion && (['tl', 'tr', 'bl', 'br'] as const).map((pos) => {
          const isTop  = pos === 'tl' || pos === 'tr'
          const isLeft = pos === 'tl' || pos === 'bl'
          return (
            <div
              key={pos}
              aria-hidden
              style={{
                position: 'absolute',
                width: '18px',
                height: '18px',
                ...(isTop  ? { top: 20 }    : { bottom: 20 }),
                ...(isLeft ? { left: 20 }   : { right: 20 }),
                borderTopWidth:    isTop    ? '1.5px' : '0',
                borderBottomWidth: !isTop   ? '1.5px' : '0',
                borderLeftWidth:   isLeft   ? '1.5px' : '0',
                borderRightWidth:  !isLeft  ? '1.5px' : '0',
                borderStyle: 'solid',
                borderColor: 'rgba(212,175,55,0.35)',
                animation: 'fj-corner-in 400ms ease-out ' + (PHASE1_END + 100) + 'ms both',
              }}
            />
          )
        })}
      </div>
    </>
  )
}
