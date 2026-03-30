'use client'

import { useEffect, useRef, useState } from 'react'

const STAGES = [
  { threshold: 0,  label: 'Initializing ForjeGames...' },
  { threshold: 20, label: 'Loading AI models...' },
  { threshold: 40, label: 'Connecting to Roblox...' },
  { threshold: 60, label: 'Preparing editor...' },
  { threshold: 80, label: 'Ready.' },
]

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*!'
const TARGET_TEXT = 'ForjeGames'
const TOTAL_DURATION = 3200 // ms

function getStageLabel(progress: number): string {
  let label = STAGES[0].label
  for (const stage of STAGES) {
    if (progress >= stage.threshold) label = stage.label
  }
  return label
}

function scrambleChar(final: string, progress: number, index: number): string {
  // Each character resolves at different times, staggered left-to-right
  const resolveAt = (index / TARGET_TEXT.length) * 0.7 + 0.1 // 0.1 → 0.8 normalized progress
  const norm = Math.min(progress / TOTAL_DURATION, 1)
  if (norm >= resolveAt) return final
  // Still scrambling
  return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
}

export function SplashScreen({ children }: { children: React.ReactNode }) {
  // Start as null — stays null until useEffect resolves sessionStorage check.
  // null = undecided (show nothing), false = show splash, true = skip splash.
  const [splashState, setSplashState] = useState<'pending' | 'showing' | 'done'>('pending')
  const [progress, setProgress] = useState(0)
  const [displayText, setDisplayText] = useState(TARGET_TEXT)
  const [exiting, setExiting] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const startTimeRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const scrambleRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Derived booleans for readability
  const visible = splashState === 'showing'
  const done = splashState === 'done'

  useEffect(() => {
    // Remove data-loading to re-enable transitions now that React has hydrated
    document.documentElement.removeAttribute('data-loading')

    // Check reduced motion preference
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)

    // sessionStorage gate — only show once per session
    const seen = sessionStorage.getItem('fj_splash_seen')
    if (seen) {
      setSplashState('done')
      return
    }
    sessionStorage.setItem('fj_splash_seen', '1')
    setSplashState('showing')
  }, [])

  useEffect(() => {
    if (!visible) return

    // Text scramble loop
    scrambleRef.current = setInterval(() => {
      if (!startTimeRef.current) return
      const elapsed = performance.now() - startTimeRef.current
      const scrambled = TARGET_TEXT.split('').map((char, i) =>
        scrambleChar(char, elapsed, i)
      ).join('')
      setDisplayText(scrambled)
      if (scrambled === TARGET_TEXT && scrambleRef.current) {
        clearInterval(scrambleRef.current)
      }
    }, 60)

    // Progress animation loop
    const animate = (ts: number) => {
      if (!startTimeRef.current) startTimeRef.current = ts
      const elapsed = ts - startTimeRef.current
      const pct = Math.min((elapsed / TOTAL_DURATION) * 100, 100)
      setProgress(pct)

      if (pct < 100) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        // Done — trigger exit glitch then fade
        setProgress(100)
        setDisplayText(TARGET_TEXT)
        setTimeout(() => setExiting(true), 200)
        setTimeout(() => setSplashState('done'), 900)
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (scrambleRef.current) clearInterval(scrambleRef.current)
    }
  }, [visible])

  const handleSkip = () => {
    if (!visible || exiting) return
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (scrambleRef.current) clearInterval(scrambleRef.current)
    setProgress(100)
    setDisplayText(TARGET_TEXT)
    setExiting(true)
    setTimeout(() => setSplashState('done'), 600)
  }

  const stageLabel = splashState === 'pending' ? STAGES[0].label : getStageLabel(progress)

  return (
    <>
      {/*
        Children ALWAYS stay mounted in the same wrapper — no remounting.
        Clerk, PostHog, and other providers initialize in the background
        while the splash plays.

        'pending'  → invisible, inert, height-clipped (sessionStorage check in flight)
        'showing'  → invisible, inert, height-clipped (splash animating)
        'done'     → visible, interactive, full height
      */}
      <div
        style={
          done
            ? undefined // no wrapper styles needed — fully natural layout
            : {
                visibility: 'hidden',
                pointerEvents: 'none',
                overflow: 'hidden',
                height: '100vh',
              }
        }
      >
        {children}
      </div>

      {/* During 'pending' cover the screen while sessionStorage check runs */}
      {splashState === 'pending' && (
        <div
          aria-hidden
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: '#0a0a0a',
          }}
        />
      )}

      {/* Animated splash overlay — only during 'showing' */}
      {splashState === 'showing' && <div
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
          transition: reducedMotion
            ? 'opacity 0.4s ease'
            : 'opacity 0.5s ease, transform 0.5s ease',
          opacity: exiting ? 0 : 1,
          transform: exiting && !reducedMotion ? 'scale(1.04)' : 'scale(1)',
          userSelect: 'none',
        }}
      >
        {/* Scanline overlay */}
        {!reducedMotion && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.018) 2px, rgba(255,255,255,0.018) 4px)',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
        )}

        {/* Noise / vignette */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.65) 100%)',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />

        {/* Content wrapper */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2rem',
            padding: '2rem',
            width: '100%',
            maxWidth: '600px',
          }}
        >
          {/* Glitch logo */}
          <div
            className={reducedMotion ? '' : 'splash-glitch-wrapper'}
            style={{ position: 'relative' }}
          >
            {/* Red aberration layer */}
            {!reducedMotion && (
              <span
                aria-hidden
                className="splash-glitch-layer splash-glitch-red"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  color: '#EF4444',
                  opacity: 0.75,
                  fontFamily: 'var(--font-inter), sans-serif',
                  fontWeight: 900,
                  fontSize: 'clamp(3rem, 10vw, 6rem)',
                  letterSpacing: '-0.02em',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                }}
              >
                {displayText}
              </span>
            )}

            {/* Blue aberration layer */}
            {!reducedMotion && (
              <span
                aria-hidden
                className="splash-glitch-layer splash-glitch-blue"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  color: '#60A5FA',
                  opacity: 0.75,
                  fontFamily: 'var(--font-inter), sans-serif',
                  fontWeight: 900,
                  fontSize: 'clamp(3rem, 10vw, 6rem)',
                  letterSpacing: '-0.02em',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                }}
              >
                {displayText}
              </span>
            )}

            {/* Main gold text */}
            <span
              className={reducedMotion ? '' : 'splash-glitch-main'}
              style={{
                display: 'block',
                position: 'relative',
                fontFamily: 'var(--font-inter), sans-serif',
                fontWeight: 900,
                fontSize: 'clamp(3rem, 10vw, 6rem)',
                letterSpacing: '-0.02em',
                whiteSpace: 'nowrap',
                color: '#D4AF37',
                textShadow:
                  '0 0 40px rgba(212,175,55,0.5), 0 0 80px rgba(212,175,55,0.2)',
              }}
            >
              {displayText}
            </span>
          </div>

          {/* Tagline */}
          <p
            style={{
              color: 'rgba(255,255,255,0.35)',
              fontSize: '0.75rem',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              marginTop: '-1.25rem',
            }}
          >
            AI-Powered Roblox Game Development
          </p>

          {/* Progress bar container */}
          <div style={{ width: '100%', maxWidth: '420px' }}>
            <div
              style={{
                height: '3px',
                width: '100%',
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderRadius: '9999px',
                overflow: 'visible',
                position: 'relative',
              }}
            >
              {/* Fill */}
              <div
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  borderRadius: '9999px',
                  background: 'linear-gradient(90deg, #D4AF37, #FFB81C)',
                  transition: reducedMotion ? 'none' : 'width 0.08s linear',
                  position: 'relative',
                  boxShadow:
                    '0 0 8px rgba(212,175,55,0.8), 0 0 20px rgba(212,175,55,0.4), 0 0 40px rgba(212,175,55,0.15)',
                }}
              >
                {/* Leading glow dot */}
                {!reducedMotion && progress > 2 && progress < 100 && (
                  <div
                    style={{
                      position: 'absolute',
                      right: '-1px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#FFD700',
                      boxShadow: '0 0 8px 4px rgba(255,215,0,0.6)',
                    }}
                  />
                )}
              </div>
            </div>

            {/* Stage label */}
            <div
              style={{
                marginTop: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  fontSize: '0.7rem',
                  color: 'rgba(255,255,255,0.45)',
                  letterSpacing: '0.05em',
                  transition: 'opacity 0.3s ease',
                }}
              >
                {stageLabel}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  fontSize: '0.7rem',
                  color: 'rgba(212,175,55,0.6)',
                  letterSpacing: '0.05em',
                }}
              >
                {Math.round(progress)}%
              </span>
            </div>
          </div>

          {/* Skip hint */}
          <p
            style={{
              color: 'rgba(255,255,255,0.18)',
              fontSize: '0.65rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              marginTop: '-0.75rem',
            }}
          >
            Click anywhere to skip
          </p>
        </div>

        {/* Corner decorations */}
        {!reducedMotion && (
          <>
            <div aria-hidden style={{ position: 'absolute', top: '24px', left: '24px', width: '20px', height: '20px', borderTop: '1.5px solid rgba(212,175,55,0.4)', borderLeft: '1.5px solid rgba(212,175,55,0.4)' }} />
            <div aria-hidden style={{ position: 'absolute', top: '24px', right: '24px', width: '20px', height: '20px', borderTop: '1.5px solid rgba(212,175,55,0.4)', borderRight: '1.5px solid rgba(212,175,55,0.4)' }} />
            <div aria-hidden style={{ position: 'absolute', bottom: '24px', left: '24px', width: '20px', height: '20px', borderBottom: '1.5px solid rgba(212,175,55,0.4)', borderLeft: '1.5px solid rgba(212,175,55,0.4)' }} />
            <div aria-hidden style={{ position: 'absolute', bottom: '24px', right: '24px', width: '20px', height: '20px', borderBottom: '1.5px solid rgba(212,175,55,0.4)', borderRight: '1.5px solid rgba(212,175,55,0.4)' }} />
          </>
        )}
      </div>}
    </>
  )
}
