'use client'

import { useState, useEffect, useCallback } from 'react'

// ─── Constants ─────────────────────────────────────────────────────────────────

const LS_KEY = 'fg_editor_toured'
/** Legacy/new dismiss flag — once set, tutorial never auto-shows again */
const LS_DISMISSED_KEY = 'forje_tutorial_dismissed'
/** Remember once the user has used voice input, so the voice step can be skipped */
const LS_VOICE_USED_KEY = 'forje_voice_used'

// ─── Step definitions ──────────────────────────────────────────────────────────

interface OnboardingStep {
  id: StepId
  title: string
  body: string
  /** Which UI zone to highlight */
  zone: 'welcome' | 'input' | 'templates' | 'generating' | 'connect' | 'slash' | 'voice'
  /** Optional CTA label override */
  cta?: string
  /** Auto-focus the input on this step */
  focusInput?: boolean
  /** Pre-fill the input with this prompt */
  prefillPrompt?: string
}

type StepId = 'welcome' | 'input' | 'templates' | 'slash' | 'voice' | 'connect' | 'ready'

const ALL_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to ForjeGames!',
    body: "Let's build something amazing in 30 seconds. The AI does the heavy lifting — you just describe what you want.",
    zone: 'welcome',
    cta: "Let's Go →",
  },
  {
    id: 'input',
    title: 'Try your first build',
    body: 'We\'ve pre-filled a prompt for you. Click "Send" or press Enter to watch the magic happen.',
    zone: 'input',
    cta: 'Got it',
    focusInput: true,
    prefillPrompt: 'Build me a modern house with a garden and driveway',
  },
  {
    id: 'templates',
    title: 'Or pick a quick-start',
    body: 'These cards pre-fill rich prompts for you. One click and you\'re building.',
    zone: 'templates',
  },
  {
    id: 'slash',
    title: 'Try a slash command',
    body: 'Type "/" in the chat to open power commands — save, export, run, checkpoint and more.',
    zone: 'input',
    cta: 'Got it',
  },
  {
    id: 'voice',
    title: 'Speak instead of typing',
    body: 'Tap the mic next to the chat box to dictate prompts hands-free.',
    zone: 'input',
    cta: 'Got it',
  },
  {
    id: 'connect',
    title: 'See it in Roblox Studio',
    body: 'Connect Studio once and every build appears in your place live — no copy-pasting ever.',
    zone: 'connect',
    cta: 'Got it',
  },
  {
    id: 'ready',
    title: "You're all set!",
    body: 'Try asking for anything — a castle, a race track, a tycoon lobby, an obby stage. The AI handles it all.',
    zone: 'welcome',
    cta: 'Start Building →',
    focusInput: true,
  },
]

// ─── Spotlight geometry per zone ───────────────────────────────────────────────
// Coordinates match the NewEditorClient two-panel layout:
//   chat panel  = left ~45%  (left: 12px, width: calc(45% - 18px))
//   studio panel = right ~55% (left: calc(45% + 6px), width: calc(55% - 18px))
// SuggestedPrompts renders just above ChatPanel, roughly 80px tall at bottom of left column.

interface SpotRect {
  top: string
  left: string
  width: string
  height: string
}

function getSpotRect(zone: OnboardingStep['zone']): SpotRect {
  // Updated for single-column chat-first layout (SimplifiedEditor)
  switch (zone) {
    case 'welcome':
      // Full content area below top bar
      return { top: '56px', left: '5%', width: '90%', height: 'calc(100dvh - 140px)' }
    case 'input':
    case 'slash':
    case 'voice':
      // Chat input bar at the bottom, centered
      return { top: 'calc(100dvh - 110px)', left: '10%', width: '80%', height: '72px' }
    case 'templates':
      // Suggestion chips in the middle of the welcome screen
      return { top: 'calc(50% + 40px)', left: '15%', width: '70%', height: '80px' }
    case 'generating':
      // Chat message area
      return { top: '56px', left: '5%', width: '90%', height: 'calc(100dvh - 140px)' }
    case 'connect':
      // Top-right area where Studio connect button is in the top bar
      return { top: '4px', left: '50%', width: '48%', height: '48px' }
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
  // Updated for single-column chat-first layout
  switch (zone) {
    case 'welcome':
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    case 'input':
    case 'slash':
    case 'voice':
      return { bottom: '130px', left: '50%', transform: 'translateX(-50%)' }
    case 'templates':
      return { top: 'calc(50% - 60px)', left: '50%', transform: 'translateX(-50%)' }
    case 'generating':
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    case 'connect':
      return { top: '60px', right: '20px' }
  }
}

// ─── Arrow nub direction ───────────────────────────────────────────────────────

type ArrowDir = 'left' | 'right' | 'down' | 'up' | 'none'

function getArrowDir(zone: OnboardingStep['zone']): ArrowDir {
  switch (zone) {
    case 'welcome':    return 'none'
    case 'input':      return 'down'
    case 'slash':      return 'down'
    case 'voice':      return 'down'
    case 'templates':  return 'down'
    case 'generating': return 'none'
    case 'connect':    return 'right'
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
  /** Ref to the chat textarea so steps can auto-focus and pre-fill it */
  inputRef?: React.RefObject<HTMLTextAreaElement | null>
  /** Called when a step wants to pre-fill the chat input */
  onPrefill?: (prompt: string) => void
  /** True if the user already has chat messages — skip the "type first prompt" step */
  hasMessages?: boolean
  /** True if Roblox Studio is already connected — skip the "connect Studio" step */
  studioConnected?: boolean
  /** True if any prior user message started with a slash command */
  hasUsedSlashCommand?: boolean
  /** True if the user has used voice input before */
  hasUsedVoice?: boolean
}

export function OnboardingOverlay({
  onDone,
  inputRef,
  onPrefill,
  hasMessages = false,
  studioConnected = false,
  hasUsedSlashCommand = false,
  hasUsedVoice = false,
}: OnboardingOverlayProps) {
  // Build the filtered step list based on current editor state.
  // Welcome + Ready always shown; middle steps are conditional.
  const steps = ALL_STEPS.filter((s) => {
    switch (s.id) {
      case 'welcome':
      case 'ready':
        return true
      case 'input':
      case 'templates':
        // Skip first-prompt steps if user has already chatted
        return !hasMessages
      case 'connect':
        return !studioConnected
      case 'slash':
        return !hasUsedSlashCommand
      case 'voice':
        return !hasUsedVoice
      default:
        return true
    }
  })

  const [stepIdx, setStepIdx] = useState(0)
  const [overlayVisible, setOverlayVisible] = useState(false)
  const [cardVisible, setCardVisible] = useState(false)

  // Fade in on mount
  useEffect(() => {
    const t1 = setTimeout(() => setOverlayVisible(true), 200)
    const t2 = setTimeout(() => setCardVisible(true), 380)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const step = steps[stepIdx] ?? steps[0]
  const isLast = stepIdx >= steps.length - 1

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(LS_KEY, 'true')
      localStorage.setItem(LS_DISMISSED_KEY, '1')
    } catch { /* ignore */ }
    setCardVisible(false)
    setTimeout(() => setOverlayVisible(false), 180)
    setTimeout(onDone, 360)
  }, [onDone])

  const advance = useCallback(() => {
    if (isLast) {
      if (inputRef?.current) inputRef.current.focus()
      dismiss()
    } else {
      setCardVisible(false)
      setTimeout(() => {
        const nextStep = steps[stepIdx + 1]
        setStepIdx((i) => i + 1)
        // Pre-fill input if the next step requests it
        if (nextStep?.prefillPrompt && inputRef?.current) {
          inputRef.current.value = nextStep.prefillPrompt
          inputRef.current.dispatchEvent(new Event('input', { bubbles: true }))
          if (onPrefill) onPrefill(nextStep.prefillPrompt)
        }
        setCardVisible(true)
      }, 140)
    }
  }, [isLast, dismiss, inputRef, onPrefill, stepIdx, steps])

  // Focus input on steps that request it
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
      aria-label={`Onboarding step ${stepIdx + 1} of ${steps.length}`}
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
              {steps.map((_, i) => (
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
              {stepIdx + 1} / {steps.length}
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
              {step.cta ?? (isLast ? 'Start Building' : 'Next →')}
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
      // Sparkle / wand icon
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 2L10.5 6.5L15 8l-4.5 1.5L9 14l-1.5-4.5L3 8l4.5-1.5L9 2z" stroke="#D4AF37" strokeWidth="1.4" strokeLinejoin="round"/>
          <circle cx="14" cy="13" r="1" fill="#D4AF37" opacity="0.6"/>
          <circle cx="4" cy="4" r="0.8" fill="#D4AF37" opacity="0.6"/>
        </svg>
      )
    case 'input':
      // Send arrow icon
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M2 9h14M11 4l5 5-5 5" stroke="#D4AF37" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    case 'templates':
      // Grid / card icon
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="2" y="2" width="6" height="6" rx="1.5" stroke="#D4AF37" strokeWidth="1.4"/>
          <rect x="10" y="2" width="6" height="6" rx="1.5" stroke="#D4AF37" strokeWidth="1.4"/>
          <rect x="2" y="10" width="6" height="6" rx="1.5" stroke="#D4AF37" strokeWidth="1.4"/>
          <rect x="10" y="10" width="6" height="6" rx="1.5" stroke="#D4AF37" strokeWidth="1.4"/>
        </svg>
      )
    case 'generating':
      // Sparkle / AI icon
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="6.5" stroke="#D4AF37" strokeWidth="1.4" strokeDasharray="3 2"/>
          <circle cx="9" cy="9" r="2.5" fill="#D4AF37" opacity="0.5"/>
          <circle cx="9" cy="9" r="1" fill="#D4AF37"/>
        </svg>
      )
    case 'connect':
      // Plug / link icon
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="4" cy="9" r="2.5" stroke="#D4AF37" strokeWidth="1.4"/>
          <circle cx="14" cy="9" r="2.5" stroke="#D4AF37" strokeWidth="1.4"/>
          <path d="M6.5 9h5" stroke="#D4AF37" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      )
    case 'slash':
      // Slash / command icon
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M12 3L6 15" stroke="#D4AF37" strokeWidth="1.6" strokeLinecap="round"/>
          <rect x="2" y="2" width="14" height="14" rx="3" stroke="#D4AF37" strokeWidth="1.2" opacity="0.5"/>
        </svg>
      )
    case 'voice':
      // Microphone icon
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="7" y="2" width="4" height="8" rx="2" stroke="#D4AF37" strokeWidth="1.4"/>
          <path d="M4 9a5 5 0 0010 0M9 14v2" stroke="#D4AF37" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      )
    case 'ready':
      // Checkmark icon
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="6.5" stroke="#D4AF37" strokeWidth="1.4"/>
          <path d="M5.5 9L8 11.5L12.5 6.5" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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

/**
 * Controls whether the editor tutorial should auto-fire.
 *
 * The tutorial is suppressed if:
 *   - it has been dismissed before (either legacy `fg_editor_toured`
 *     or the new `forje_tutorial_dismissed` key), OR
 *   - the user already has chat messages (they clearly don't need a first-run tour).
 */
export function useOnboardingOverlay(opts?: { hasMessages?: boolean }) {
  const hasMessages = opts?.hasMessages ?? false
  const [shouldShow, setShouldShow] = useState(false)

  useEffect(() => {
    try {
      const dismissed =
        localStorage.getItem(LS_DISMISSED_KEY) === '1' ||
        localStorage.getItem(LS_KEY) === 'true'
      if (!dismissed && !hasMessages) setShouldShow(true)
    } catch {
      // ignore
    }
  }, [hasMessages])

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(LS_KEY, 'true')
      localStorage.setItem(LS_DISMISSED_KEY, '1')
    } catch { /* ignore */ }
    setShouldShow(false)
  }, [])

  return { shouldShow, dismiss }
}

/** Mark voice input as "used" so the tutorial can skip the voice step next time. */
export function markVoiceInputUsed() {
  try { localStorage.setItem(LS_VOICE_USED_KEY, '1') } catch { /* ignore */ }
}

/** Read whether the user has used voice input before. SSR-safe. */
export function hasUsedVoiceInput(): boolean {
  if (typeof window === 'undefined') return false
  try { return localStorage.getItem(LS_VOICE_USED_KEY) === '1' } catch { return false }
}
