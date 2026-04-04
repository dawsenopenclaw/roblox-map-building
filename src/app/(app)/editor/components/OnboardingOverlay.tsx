'use client'

import { useState, useEffect, useCallback } from 'react'

// ─── Constants ─────────────────────────────────────────────────────────────────

const LS_KEY = 'fg_onboarding_v2_done'

// ─── Step definitions ──────────────────────────────────────────────────────────

interface OnboardingStep {
  id: string
  title: string
  body: string
  /** Which UI zone to highlight */
  zone: 'chat' | 'input' | 'code' | 'connect' | 'try'
  /** Optional CTA label override */
  cta?: string
  /** Auto-focus the input on this step */
  focusInput?: boolean
}

const STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'This is ForjeAI',
    body: 'Your Roblox building assistant. Describe anything in plain English and watch it come to life in Studio.',
    zone: 'chat',
  },
  {
    id: 'input',
    title: 'Type what you want to build',
    body: 'Natural language works. "Build me a castle", "add fog", "make the towers taller" — ForjeAI understands context.',
    zone: 'input',
  },
  {
    id: 'code',
    title: 'AI generates the code',
    body: 'ForjeAI writes Luau scripts, places assets, sculpts terrain. Hit Import to push the build directly into Studio.',
    zone: 'code',
  },
  {
    id: 'connect',
    title: 'Connect Studio for real-time builds',
    body: 'Link Roblox Studio so ForjeAI builds inside your place live — no copy-pasting required.',
    zone: 'connect',
  },
  {
    id: 'try',
    title: 'Try it now',
    body: 'Type "build me a castle" to generate your first build. The chat input is ready and waiting.',
    zone: 'try',
    cta: 'Start building',
    focusInput: true,
  },
]

// ─── Spotlight geometry per zone ───────────────────────────────────────────────
// Coordinates expressed as viewport percentages / fixed values to match
// the NewEditorClient two-panel layout (chat = left 45%, studio = right 55%).

interface SpotRect {
  top: string
  left: string
  width: string
  height: string
}

function getSpotRect(zone: OnboardingStep['zone']): SpotRect {
  switch (zone) {
    case 'chat':
      // Full chat panel (left 45% excluding padding)
      return { top: '68px', left: '12px', width: 'calc(45% - 18px)', height: 'calc(100dvh - 92px)' }
    case 'input':
      // Bottom input bar of chat panel
      return { top: 'calc(100dvh - 130px)', left: '12px', width: 'calc(45% - 18px)', height: '106px' }
    case 'code':
      // Right studio panel
      return { top: '68px', left: 'calc(45% + 6px)', width: 'calc(55% - 18px)', height: 'calc(100dvh - 92px)' }
    case 'connect':
      // Studio panel header / connect button area (top portion of right panel)
      return { top: '68px', left: 'calc(45% + 6px)', width: 'calc(55% - 18px)', height: '220px' }
    case 'try':
      // Input bar again
      return { top: 'calc(100dvh - 130px)', left: '12px', width: 'calc(45% - 18px)', height: '106px' }
  }
}

// ─── Tooltip position per zone ─────────────────────────────────────────────────

interface TooltipPos {
  top?: string
  bottom?: string
  left?: string
  right?: string
  transform?: string
}

function getTooltipPos(zone: OnboardingStep['zone']): TooltipPos {
  switch (zone) {
    case 'chat':
      return { top: '50%', left: 'calc(45% + 20px)', transform: 'translateY(-50%)' }
    case 'input':
      return { bottom: '148px', left: '12px' }
    case 'code':
      return { top: '50%', right: 'calc(55% + 20px)', transform: 'translateY(-50%)' }
    case 'connect':
      return { top: '68px', right: 'calc(55% + 20px)' }
    case 'try':
      return { bottom: '148px', left: '12px' }
  }
}

// ─── Arrow nub direction ───────────────────────────────────────────────────────

type ArrowDir = 'left' | 'right' | 'down' | 'up' | 'none'

function getArrowDir(zone: OnboardingStep['zone']): ArrowDir {
  switch (zone) {
    case 'chat':    return 'left'
    case 'input':   return 'down'
    case 'code':    return 'right'
    case 'connect': return 'right'
    case 'try':     return 'down'
  }
}

// ─── Arrow nub component ───────────────────────────────────────────────────────

function ArrowNub({ dir }: { dir: ArrowDir }) {
  const base: React.CSSProperties = { position: 'absolute', width: 0, height: 0 }

  if (dir === 'left') return (
    <div style={{ ...base, left: -7, top: '50%', marginTop: -7,
      borderTop: '7px solid transparent', borderBottom: '7px solid transparent',
      borderRight: '7px solid #141414' }} />
  )
  if (dir === 'right') return (
    <div style={{ ...base, right: -7, top: '50%', marginTop: -7,
      borderTop: '7px solid transparent', borderBottom: '7px solid transparent',
      borderLeft: '7px solid #141414' }} />
  )
  if (dir === 'down') return (
    <div style={{ ...base, bottom: -7, left: '50%', marginLeft: -7,
      borderLeft: '7px solid transparent', borderRight: '7px solid transparent',
      borderTop: '7px solid #141414' }} />
  )
  if (dir === 'up') return (
    <div style={{ ...base, top: -7, left: '50%', marginLeft: -7,
      borderLeft: '7px solid transparent', borderRight: '7px solid transparent',
      borderBottom: '7px solid #141414' }} />
  )
  return null
}

// ─── Main component ─────────────────────────────────────────────────────────────

interface OnboardingOverlayProps {
  onDone: () => void
  /** Ref to the chat textarea so step 5 can auto-focus it */
  inputRef?: React.RefObject<HTMLTextAreaElement | null>
}

export function OnboardingOverlay({ onDone, inputRef }: OnboardingOverlayProps) {
  const [stepIdx, setStepIdx] = useState(0)
  const [overlayVisible, setOverlayVisible] = useState(false)
  const [cardVisible, setCardVisible] = useState(false)

  // Fade in on mount
  useEffect(() => {
    const t1 = setTimeout(() => setOverlayVisible(true), 200)
    const t2 = setTimeout(() => setCardVisible(true), 380)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const step = STEPS[stepIdx]
  const isLast = stepIdx === STEPS.length - 1

  const dismiss = useCallback(() => {
    try { localStorage.setItem(LS_KEY, 'true') } catch { /* ignore */ }
    setCardVisible(false)
    setTimeout(() => setOverlayVisible(false), 180)
    setTimeout(onDone, 360)
  }, [onDone])

  const advance = useCallback(() => {
    if (isLast) {
      // Auto-focus input before dismissing
      if (inputRef?.current) {
        inputRef.current.focus()
      }
      dismiss()
    } else {
      setCardVisible(false)
      setTimeout(() => {
        setStepIdx((i) => i + 1)
        setCardVisible(true)
      }, 140)
    }
  }, [isLast, dismiss, inputRef])

  // Focus input on "try" step
  useEffect(() => {
    if (step.focusInput && inputRef?.current) {
      const t = setTimeout(() => inputRef.current?.focus(), 300)
      return () => clearTimeout(t)
    }
  }, [step, inputRef])

  if (!overlayVisible && !cardVisible) return null

  const spotRect = getSpotRect(step.zone)
  const tooltipPos = getTooltipPos(step.zone)
  const arrowDir = getArrowDir(step.zone)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Onboarding step ${stepIdx + 1} of ${STEPS.length}`}
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 500,
        transition: 'opacity 0.3s ease-out',
        opacity: overlayVisible ? 1 : 0,
      }}
    >
      {/* Dark overlay */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.65)' }}
      />

      {/* Spotlight cut-out — gold border box that "highlights" the target zone */}
      <div
        className="absolute rounded-2xl"
        style={{
          ...spotRect,
          border: '2px solid rgba(212,175,55,0.75)',
          boxShadow: '0 0 0 9999px rgba(0,0,0,0), 0 0 32px rgba(212,175,55,0.25)',
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 501,
          pointerEvents: 'none',
        }}
      />

      {/* Animated corner accents on spotlight */}
      <div
        className="absolute"
        style={{
          ...spotRect,
          zIndex: 502,
          pointerEvents: 'none',
        }}
      >
        {/* Top-left */}
        <div style={{ position: 'absolute', top: -1, left: -1, width: 14, height: 14,
          borderTop: '2px solid #D4AF37', borderLeft: '2px solid #D4AF37', borderRadius: '12px 0 0 0' }} />
        {/* Top-right */}
        <div style={{ position: 'absolute', top: -1, right: -1, width: 14, height: 14,
          borderTop: '2px solid #D4AF37', borderRight: '2px solid #D4AF37', borderRadius: '0 12px 0 0' }} />
        {/* Bottom-left */}
        <div style={{ position: 'absolute', bottom: -1, left: -1, width: 14, height: 14,
          borderBottom: '2px solid #D4AF37', borderLeft: '2px solid #D4AF37', borderRadius: '0 0 0 12px' }} />
        {/* Bottom-right */}
        <div style={{ position: 'absolute', bottom: -1, right: -1, width: 14, height: 14,
          borderBottom: '2px solid #D4AF37', borderRight: '2px solid #D4AF37', borderRadius: '0 0 12px 0' }} />
      </div>

      {/* Tooltip card */}
      <div
        className="absolute pointer-events-auto"
        style={{
          ...tooltipPos,
          zIndex: 503,
          width: 300,
          transition: 'opacity 0.22s ease-out, transform 0.22s ease-out',
          opacity: cardVisible ? 1 : 0,
          transform: [
            tooltipPos.transform ?? '',
            cardVisible ? '' : 'translateY(10px)',
          ].join(' ').trim(),
        }}
      >
        <div
          className="rounded-2xl p-5"
          style={{
            background: '#141414',
            border: '1px solid rgba(212,175,55,0.3)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.85), 0 0 40px rgba(212,175,55,0.1)',
          }}
        >
          {/* Progress dots */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-300"
                  style={{
                    height: 4,
                    width: i === stepIdx ? 20 : 6,
                    background: i === stepIdx
                      ? '#D4AF37'
                      : i < stepIdx
                        ? 'rgba(212,175,55,0.4)'
                        : 'rgba(255,255,255,0.1)',
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: 10, color: '#52525b', marginLeft: 2, fontFamily: 'Inter, sans-serif' }}>
              {stepIdx + 1} / {STEPS.length}
            </span>
          </div>

          {/* Step icon */}
          <div
            className="flex items-center justify-center rounded-xl mb-3"
            style={{
              width: 40,
              height: 40,
              background: 'linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.08) 100%)',
              border: '1px solid rgba(212,175,55,0.2)',
            }}
          >
            <StepIcon step={step.id} />
          </div>

          <h3
            className="font-bold"
            style={{ fontSize: 14, color: '#fafafa', marginBottom: 6, fontFamily: 'Inter, sans-serif' }}
          >
            {step.title}
          </h3>
          <p
            style={{
              fontSize: 12,
              color: '#71717a',
              lineHeight: 1.6,
              marginBottom: 18,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {step.body}
          </p>

          <div className="flex items-center justify-between">
            <button
              onClick={dismiss}
              style={{
                fontSize: 11,
                color: '#52525b',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                padding: 0,
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#a1a1aa' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#52525b' }}
            >
              Skip tour
            </button>

            <button
              onClick={advance}
              className="font-bold"
              style={{
                padding: '7px 18px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #D4AF37 0%, #D4AF37 100%)',
                color: '#030712',
                fontSize: 12,
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
                boxShadow: '0 0 16px rgba(212,175,55,0.35)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.04)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              {isLast ? (step.cta ?? 'Start building') : 'Next →'}
            </button>
          </div>
        </div>

        <ArrowNub dir={arrowDir} />
      </div>
    </div>
  )
}

// ─── Step icons ────────────────────────────────────────────────────────────────

function StepIcon({ step }: { step: string }) {
  switch (step) {
    case 'welcome':
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 1.5L11 7H16.5L12 10.5l1.5 5L9 13l-4.5 2.5 1.5-5L1.5 7H7L9 1.5z" fill="#D4AF37" opacity={0.9}/>
        </svg>
      )
    case 'input':
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="2" y="5" width="14" height="8" rx="3" stroke="#D4AF37" strokeWidth="1.4"/>
          <path d="M5 9h4M11 7v4" stroke="#D4AF37" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      )
    case 'code':
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M6 6L2 9l4 3M12 6l4 3-4 3M10 5l-2 8" stroke="#D4AF37" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    case 'connect':
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="4" cy="9" r="2.5" stroke="#D4AF37" strokeWidth="1.4"/>
          <circle cx="14" cy="9" r="2.5" stroke="#D4AF37" strokeWidth="1.4"/>
          <path d="M6.5 9h5" stroke="#D4AF37" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      )
    case 'try':
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M5 3l10 6-10 6V3z" fill="#D4AF37" opacity={0.9}/>
        </svg>
      )
    default:
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="6" stroke="#D4AF37" strokeWidth="1.4"/>
        </svg>
      )
  }
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useOnboardingOverlay() {
  const [shouldShow, setShouldShow] = useState(false)

  useEffect(() => {
    try {
      const done = localStorage.getItem(LS_KEY)
      if (!done) setShouldShow(true)
    } catch {
      // ignore
    }
  }, [])

  const dismiss = useCallback(() => setShouldShow(false), [])

  return { shouldShow, dismiss }
}
