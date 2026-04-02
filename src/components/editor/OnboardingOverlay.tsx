'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'

// ─── Constants ────────────────────────────────────────────────────────────────

const LS_KEY = 'fg_onboarding_complete_v1'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OnboardingOverlayProps {
  onComplete: () => void
  onSkip: () => void
}

interface Step {
  id: number
  icon: React.ReactNode
  title: string
  body: React.ReactNode
  cta?: string
  highlight?: string // informational label for which UI element is spotlit
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Check localStorage on mount — only show if never completed
  useEffect(() => {
    try {
      const done = localStorage.getItem(LS_KEY)
      if (!done) setShowOnboarding(true)
    } catch {
      // localStorage unavailable (SSR / private mode) — skip silently
    }
  }, [])

  const dismissOnboarding = useCallback(() => {
    try {
      localStorage.setItem(LS_KEY, '1')
    } catch {
      // ignore
    }
    setShowOnboarding(false)
  }, [])

  const triggerOnboarding = useCallback(() => {
    setShowOnboarding(true)
  }, [])

  return { showOnboarding, triggerOnboarding, dismissOnboarding }
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
      <path
        d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01L12 2z"
        fill="rgba(255,184,28,0.15)"
        stroke="#FFB81C"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
      <path
        d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
        fill="rgba(99,102,241,0.15)"
        stroke="#6366F1"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
      <rect x="9" y="2" width="6" height="12" rx="3" fill="rgba(212,175,55,0.15)" stroke="#D4AF37" strokeWidth="1.5" />
      <path d="M5 10a7 7 0 0 0 14 0" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="17" x2="12" y2="21" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="21" x2="16" y2="21" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function PlugIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
      <path
        d="M14.5 2v5M9.5 2v5M5 7h14l-1.5 9a2 2 0 0 1-2 1.7H8.5a2 2 0 0 1-2-1.7L5 7z"
        fill="rgba(74,222,128,0.12)"
        stroke="#4ADE80"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M12 17.7V22" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function RocketIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
      <path
        d="M12 2C12 2 7 6 7 13l2 1 1 2c3.3.7 5-1 5-1 1-2.5 1-6 1-6l-4-7z"
        fill="rgba(255,184,28,0.15)"
        stroke="#FFB81C"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="11" r="1.5" fill="#FFB81C" />
      <path d="M9 13l-3 3 1 3 3-1M15 13l3 3-1 3-3-1" stroke="#FFB81C" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS: Step[] = [
  {
    id: 1,
    icon: <StarIcon />,
    title: 'Welcome to ForjeAI',
    body: (
      <>
        <p style={{ color: '#a1a1aa', fontSize: 14, lineHeight: '1.6', margin: 0 }}>
          ForjeAI turns plain English into working Roblox builds — instantly.
          Describe what you want and watch it come to life in Studio.
        </p>
        <p style={{ color: '#71717a', fontSize: 13, lineHeight: '1.6', marginTop: 10 }}>
          This quick tour takes about 60 seconds.
        </p>
      </>
    ),
    cta: 'Get started',
  },
  {
    id: 2,
    icon: <ChatIcon />,
    title: 'Try a quick build',
    body: (
      <>
        <p style={{ color: '#a1a1aa', fontSize: 14, lineHeight: '1.6', margin: 0 }}>
          Type your idea into the chat bar at the bottom of the screen. Start
          with something simple — ForjeAI will generate Luau scripts and layout
          instantly.
        </p>
        <div
          style={{
            marginTop: 14,
            padding: '10px 14px',
            borderRadius: 10,
            background: 'rgba(255,184,28,0.06)',
            border: '1px solid rgba(255,184,28,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ fontSize: 18 }}>🏰</span>
          <span style={{ color: '#FFB81C', fontSize: 13, fontFamily: 'monospace' }}>
            "Build a castle with towers and a moat"
          </span>
        </div>
      </>
    ),
    cta: 'Next',
    highlight: 'chat input',
  },
  {
    id: 3,
    icon: <MicIcon />,
    title: 'Use your voice',
    body: (
      <>
        <p style={{ color: '#a1a1aa', fontSize: 14, lineHeight: '1.6', margin: 0 }}>
          Click the{' '}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '1px 7px',
              borderRadius: 6,
              background: 'rgba(212,175,55,0.1)',
              border: '1px solid rgba(212,175,55,0.3)',
              color: '#D4AF37',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            mic
          </span>{' '}
          button next to the chat bar and speak your prompt. ForjeAI
          auto-submits after a 1.5-second pause.
        </p>
        <p style={{ color: '#71717a', fontSize: 13, lineHeight: '1.6', marginTop: 10 }}>
          Hands-free is the fastest way to iterate while building in Studio.
        </p>
      </>
    ),
    cta: 'Next',
    highlight: 'mic button',
  },
  {
    id: 4,
    icon: <PlugIcon />,
    title: 'Connect Roblox Studio',
    body: (
      <>
        <p style={{ color: '#a1a1aa', fontSize: 14, lineHeight: '1.6', margin: 0 }}>
          Install the ForjeAI Studio plugin to push builds directly into your
          open place — no copy-pasting ever. The{' '}
          <span style={{ color: '#4ADE80', fontWeight: 600 }}>green dot</span>{' '}
          in the toolbar means you are live-connected.
        </p>
        <a
          href="https://docs.forjegames.com/studio-plugin"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 14,
            padding: '7px 13px',
            borderRadius: 8,
            background: 'rgba(74,222,128,0.08)',
            border: '1px solid rgba(74,222,128,0.25)',
            color: '#4ADE80',
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
        >
          <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
            <path d="M6 3H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-3" stroke="#4ADE80" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M9 2h5v5M14 2l-7 7" stroke="#4ADE80" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Plugin setup guide
        </a>
      </>
    ),
    cta: 'Next',
    highlight: 'connection status',
  },
  {
    id: 5,
    icon: <RocketIcon />,
    title: "You're ready to build!",
    body: (
      <>
        <p style={{ color: '#a1a1aa', fontSize: 14, lineHeight: '1.6', margin: 0 }}>
          Pick a starting point below or type your own idea. ForjeAI handles
          the Luau, you focus on the vision.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
          {[
            { emoji: '🏰', label: 'Castle' },
            { emoji: '🌆', label: 'City' },
            { emoji: '🔥', label: 'Obby' },
            { emoji: '🚀', label: 'Space station' },
          ].map((chip) => (
            <div
              key={chip.label}
              style={{
                padding: '5px 12px',
                borderRadius: 20,
                background: 'rgba(255,184,28,0.07)',
                border: '1px solid rgba(255,184,28,0.2)',
                color: '#FFB81C',
                fontSize: 13,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <span>{chip.emoji}</span>
              <span>{chip.label}</span>
            </div>
          ))}
        </div>
      </>
    ),
    cta: 'Start building',
  },
]

// ─── Step dots ────────────────────────────────────────────────────────────────

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === current ? 18 : 6,
            height: 6,
            borderRadius: 3,
            background: i === current ? '#FFB81C' : i < current ? 'rgba(255,184,28,0.35)' : 'rgba(255,255,255,0.12)',
            transition: 'width 0.25s ease, background 0.25s ease',
          }}
        />
      ))}
    </div>
  )
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round(((current + 1) / total) * 100)
  return (
    <div
      style={{
        height: 2,
        borderRadius: 1,
        background: 'rgba(255,255,255,0.07)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${pct}%`,
          borderRadius: 1,
          background: 'linear-gradient(90deg, #D4AF37, #FFB81C)',
          transition: 'width 0.35s cubic-bezier(0.4,0,0.2,1)',
        }}
      />
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function OnboardingOverlay({ onComplete, onSkip }: OnboardingOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // Fade-in on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20)
    return () => clearTimeout(t)
  }, [])

  const handleDismiss = useCallback((cb: () => void) => {
    setExiting(true)
    setTimeout(() => {
      setVisible(false)
      cb()
    }, 260)
  }, [])

  const handleSkip = useCallback(() => {
    handleDismiss(onSkip)
  }, [handleDismiss, onSkip])

  const handleNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1)
    } else {
      handleDismiss(onComplete)
    }
  }, [currentStep, handleDismiss, onComplete])

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleSkip()
      if (e.key === 'ArrowRight' || e.key === 'Enter') handleNext()
      if (e.key === 'ArrowLeft' && currentStep > 0) setCurrentStep((s) => s - 1)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleSkip, handleNext, currentStep])

  const step = STEPS[currentStep]
  const isLast = currentStep === STEPS.length - 1

  const overlayOpacity = visible && !exiting ? 1 : 0
  const cardScale = visible && !exiting ? 1 : 0.93
  const cardTranslateY = visible && !exiting ? 0 : 20

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Onboarding step ${currentStep + 1} of ${STEPS.length}: ${step.title}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        opacity: overlayOpacity,
        transition: 'opacity 0.26s ease',
        pointerEvents: visible && !exiting ? 'auto' : 'none',
      }}
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={handleSkip}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(3,3,5,0.82)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          cursor: 'pointer',
        }}
      />

      {/* Card */}
      <div
        ref={cardRef}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 420,
          borderRadius: 20,
          background: 'rgba(18,18,22,0.96)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow:
            '0 0 0 1px rgba(255,184,28,0.08), 0 32px 80px rgba(0,0,0,0.7), 0 0 60px rgba(255,184,28,0.05)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          transform: `translateY(${cardTranslateY}px) scale(${cardScale})`,
          transition: 'transform 0.28s cubic-bezier(0.34,1.56,0.64,1), opacity 0.26s ease',
          overflow: 'hidden',
        }}
      >
        {/* Gold top accent line */}
        <div
          aria-hidden="true"
          style={{
            height: 2,
            background: 'linear-gradient(90deg, transparent, #D4AF37, #FFB81C, transparent)',
          }}
        />

        {/* Progress bar */}
        <div style={{ padding: '16px 20px 0' }}>
          <ProgressBar current={currentStep} total={STEPS.length} />
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px 8px' }}>
          {/* Icon + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {step.icon}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 11, color: '#52525b', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Step {currentStep + 1} of {STEPS.length}
              </p>
              <h2
                style={{
                  margin: '2px 0 0',
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#f4f4f5',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  lineHeight: 1.3,
                }}
              >
                {step.title}
              </h2>
            </div>
          </div>

          {/* Content — wrapped in a keyed div so it re-mounts on step change */}
          <StepContent key={currentStep}>{step.body}</StepContent>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px 20px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            marginTop: 16,
          }}
        >
          {/* Dots */}
          <StepDots total={STEPS.length} current={currentStep} />

          {/* Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {!isLast && (
              <button
                onClick={handleSkip}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'transparent',
                  color: '#71717a',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  transition: 'color 0.15s, border-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#a1a1aa'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#71717a'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                }}
              >
                Skip
              </button>
            )}

            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep((s) => s - 1)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'transparent',
                  color: '#71717a',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  transition: 'color 0.15s, border-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#a1a1aa'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#71717a'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                }}
              >
                Back
              </button>
            )}

            <button
              onClick={handleNext}
              autoFocus
              style={{
                padding: '7px 20px',
                borderRadius: 8,
                border: 'none',
                background: 'linear-gradient(135deg, #D4AF37, #FFB81C)',
                color: '#0a0a0c',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'Inter, system-ui, sans-serif',
                boxShadow: '0 2px 12px rgba(255,184,28,0.3)',
                transition: 'opacity 0.15s, transform 0.1s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1'
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.96)'
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              {step.cta ?? 'Next'}
            </button>
          </div>
        </div>
      </div>

      {/* Keyboard hint */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 12,
          opacity: 0.4,
          pointerEvents: 'none',
        }}
      >
        {[
          { key: '←', label: 'Back' },
          { key: '→', label: 'Next' },
          { key: 'Esc', label: 'Skip' },
        ].map(({ key, label }) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#a1a1aa', fontSize: 11 }}>
            <kbd
              style={{
                padding: '2px 6px',
                borderRadius: 4,
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                fontFamily: 'monospace',
                fontSize: 10,
                color: '#d4d4d8',
              }}
            >
              {key}
            </kbd>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Animated step content wrapper ────────────────────────────────────────────
// Fades in whenever the key (step index) changes — pure CSS, no framer-motion.

function StepContent({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(t)
  }, [])

  return (
    <div
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(6px)',
        transition: 'opacity 0.22s ease, transform 0.22s ease',
      }}
    >
      {children}
    </div>
  )
}
