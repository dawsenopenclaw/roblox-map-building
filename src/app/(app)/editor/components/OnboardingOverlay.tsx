'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useSWR from 'swr'

// ─── Constants ─────────────────────────────────────────────────────────────────

const LS_KEY = 'fg_editor_toured'
const LS_DISMISSED_KEY = 'forje_tutorial_dismissed'
const LS_FIRST_BUILD_KEY = 'forje_first_build_complete'

// ─── Template cards ─────────────────────────────────────────────────────────────

interface TemplateCard {
  id: string
  emoji: string
  name: string
  description: string
  prompt: string
}

const FIRST_BUILD_TEMPLATES: TemplateCard[] = [
  {
    id: 'tree',
    emoji: '🌳',
    name: 'Tree',
    description: 'A thick oak with branches and a full canopy',
    prompt: 'Build me a tree',
  },
  {
    id: 'house',
    emoji: '🏠',
    name: 'House',
    description: 'Cozy brick house with windows, door, and a chimney',
    prompt: 'Build me a house',
  },
  {
    id: 'car',
    emoji: '🚗',
    name: 'Car',
    description: 'Red sports car with wheels and headlights',
    prompt: 'Build me a car',
  },
  {
    id: 'sword',
    emoji: '⚔️',
    name: 'Sword',
    description: 'Metal blade with a crossguard and leather grip',
    prompt: 'Build me a sword',
  },
]

// ─── Post-build celebration templates ────────────────────────────────────────

const NEXT_BUILD_OPTIONS = [
  { label: 'Build a Castle', prompt: 'Build me a castle with towers and a drawbridge' },
  { label: 'Build a Spaceship', prompt: 'Build me a spaceship' },
  { label: 'Type anything you want', prompt: null },
]

// ─── Confetti burst ──────────────────────────────────────────────────────────

function ConfettiBurst() {
  const particles = Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * 360
    const dist = 40 + Math.random() * 60
    const rad = (angle * Math.PI) / 180
    const tx = Math.cos(rad) * dist
    const ty = Math.sin(rad) * dist
    const colors = ['#D4AF37', '#FFB81C', '#FFD700', '#FFF4CC', '#B8962E']
    const color = colors[i % colors.length]
    const size = 3 + Math.random() * 4
    const delay = Math.random() * 200
    return { tx, ty, color, size, delay }
  })

  return (
    <>
      <style>{`
        @keyframes confettiBurst {
          0%   { opacity: 1; transform: translate(0, 0) scale(1) rotate(0deg); }
          50%  { opacity: 0.9; }
          100% { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0.3) rotate(var(--rot)); }
        }
      `}</style>
      <div style={{ position: 'absolute', top: '40%', left: '50%', pointerEvents: 'none', zIndex: 10 }}>
        {particles.map((p, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: p.size,
              height: p.size,
              borderRadius: i % 3 === 0 ? '50%' : '2px',
              background: p.color,
              ['--tx' as string]: `${p.tx}px`,
              ['--ty' as string]: `${p.ty}px`,
              ['--rot' as string]: `${Math.random() * 360}deg`,
              animation: `confettiBurst 0.9s cubic-bezier(0.2, 0.8, 0.4, 1) ${p.delay}ms forwards`,
            } as React.CSSProperties}
          />
        ))}
      </div>
    </>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────────

interface OnboardingOverlayProps {
  onDone: () => void
  /** Ref to the chat textarea so we can focus it */
  inputRef?: React.RefObject<HTMLTextAreaElement | null>
  /** Called when a step wants to pre-fill the chat input */
  onPrefill?: (prompt: string) => void
  /** True if the user already has chat messages */
  hasMessages?: boolean
  /** True if Roblox Studio is already connected */
  studioConnected?: boolean
  /** Unused — kept for backwards compat */
  hasUsedSlashCommand?: boolean
  /** Unused — kept for backwards compat */
  hasUsedVoice?: boolean
  /** Send a message directly to the chat (triggers instant template) */
  onSendMessage?: (prompt: string) => void
}

export function OnboardingOverlay({
  onDone,
  inputRef,
  onPrefill,
  hasMessages = false,
  studioConnected = false,
  onSendMessage,
}: OnboardingOverlayProps) {
  const [visible, setVisible] = useState(false)
  const [phase, setPhase] = useState<'pick' | 'celebrate'>('pick')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  // Check if first build already done
  const firstBuildDone = typeof window !== 'undefined' &&
    localStorage.getItem(LS_FIRST_BUILD_KEY) === 'true'

  // Fade in on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 150)
    return () => clearTimeout(t)
  }, [])

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(LS_KEY, 'true')
      localStorage.setItem(LS_DISMISSED_KEY, '1')
    } catch { /* ignore */ }
    setVisible(false)
    setTimeout(onDone, 300)
  }, [onDone])

  const handlePickTemplate = useCallback((template: TemplateCard) => {
    setSelectedTemplate(template.id)

    // Dismiss overlay, then send the message
    try {
      localStorage.setItem(LS_KEY, 'true')
      localStorage.setItem(LS_DISMISSED_KEY, '1')
    } catch { /* ignore */ }

    // Small delay for the card click animation to register
    setTimeout(() => {
      setVisible(false)
      setTimeout(() => {
        if (onSendMessage) {
          onSendMessage(template.prompt)
        } else if (onPrefill) {
          onPrefill(template.prompt)
        }
        onDone()
      }, 250)
    }, 200)
  }, [onDone, onSendMessage, onPrefill])

  const handleNextBuild = useCallback((prompt: string | null) => {
    dismiss()
    if (prompt) {
      setTimeout(() => {
        if (onSendMessage) {
          onSendMessage(prompt)
        } else if (onPrefill) {
          onPrefill(prompt)
        }
      }, 400)
    } else {
      // "Type anything" — just focus input
      setTimeout(() => inputRef?.current?.focus(), 400)
    }
  }, [dismiss, onSendMessage, onPrefill, inputRef])

  if (!visible && phase === 'pick' && !selectedTemplate) return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="onboarding-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="dialog"
          aria-modal="true"
          aria-label="First build guide"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            padding: 20,
          }}
        >
          {phase === 'pick' && (
            <motion.div
              key="pick-phase"
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: 520,
                background: '#0f0f0f',
                border: '1px solid rgba(212, 175, 55, 0.25)',
                borderRadius: 20,
                padding: '36px 32px 28px',
                boxShadow: '0 0 60px rgba(212, 175, 55, 0.08), 0 24px 48px rgba(0, 0, 0, 0.6)',
              }}
            >
              {/* Gold accent line */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '50%',
                height: 2,
                background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)',
                borderRadius: '0 0 2px 2px',
              }} />

              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                >
                  <h2 style={{
                    margin: '0 0 8px',
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#FAFAFA',
                    letterSpacing: '-0.01em',
                    fontFamily: 'Inter, sans-serif',
                  }}>
                    Let&apos;s build something right now
                  </h2>
                  <p style={{
                    margin: 0,
                    fontSize: 14,
                    color: '#71717A',
                    lineHeight: 1.5,
                    fontFamily: 'Inter, sans-serif',
                  }}>
                    Pick one. It builds instantly — no waiting, no AI lag.
                    {!studioConnected && ' Code shows in chat with a copy button.'}
                  </p>
                </motion.div>
              </div>

              {/* Template cards grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 12,
                marginBottom: 20,
              }}>
                {FIRST_BUILD_TEMPLATES.map((template, i) => (
                  <motion.button
                    key={template.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.07, duration: 0.35 }}
                    onClick={() => handlePickTemplate(template)}
                    disabled={selectedTemplate !== null}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '20px 12px 16px',
                      borderRadius: 14,
                      border: selectedTemplate === template.id
                        ? '1px solid #D4AF37'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                      background: selectedTemplate === template.id
                        ? 'rgba(212, 175, 55, 0.1)'
                        : 'rgba(255, 255, 255, 0.03)',
                      cursor: selectedTemplate ? 'default' : 'pointer',
                      transition: 'all 0.2s',
                      opacity: selectedTemplate && selectedTemplate !== template.id ? 0.4 : 1,
                      fontFamily: 'Inter, sans-serif',
                    }}
                    onMouseEnter={(e) => {
                      if (!selectedTemplate) {
                        e.currentTarget.style.background = 'rgba(212, 175, 55, 0.08)'
                        e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.4)'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(212, 175, 55, 0.1)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selectedTemplate) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                      }
                    }}
                  >
                    {/* Emoji */}
                    <span style={{ fontSize: 32, marginBottom: 8, lineHeight: 1 }}>
                      {template.emoji}
                    </span>

                    {/* Name */}
                    <span style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: '#FAFAFA',
                      marginBottom: 4,
                    }}>
                      {template.name}
                    </span>

                    {/* Description */}
                    <span style={{
                      fontSize: 11,
                      color: '#71717A',
                      lineHeight: 1.4,
                      textAlign: 'center',
                    }}>
                      {template.description}
                    </span>

                    {/* Hover glow */}
                    {selectedTemplate === template.id && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                          position: 'absolute',
                          inset: -1,
                          borderRadius: 14,
                          border: '2px solid #D4AF37',
                          boxShadow: '0 0 20px rgba(212, 175, 55, 0.2)',
                          pointerEvents: 'none',
                        }}
                      />
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Skip */}
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={dismiss}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#52525B',
                    fontSize: 12,
                    cursor: 'pointer',
                    padding: '4px 12px',
                    fontFamily: 'Inter, sans-serif',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#A1A1AA' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#52525B' }}
                >
                  I know what I&apos;m doing — skip
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Celebration upgrade nudge (free tier only) ──────────────────────────────

const nudgeFetcher = (url: string) => fetch(url).then(r => r.ok ? r.json() : null)

function CelebrationUpgradeNudge() {
  const { data } = useSWR<{ tier?: string }>(
    '/api/billing/status',
    nudgeFetcher,
    { revalidateOnFocus: false }
  )

  // Only show for free tier users (or if we can't determine tier yet, hide)
  if (!data || (data.tier && data.tier !== 'FREE' && data.tier !== 'free')) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.4 }}
      style={{
        marginTop: 16,
        padding: '12px 16px',
        borderRadius: 10,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        textAlign: 'center',
      }}
    >
      <p style={{
        margin: 0,
        fontSize: 12,
        color: '#71717A',
        lineHeight: 1.5,
        fontFamily: 'Inter, sans-serif',
      }}>
        You just built your first game for free. Upgrade for unlimited builds, priority AI, and 3D generation.
      </p>
      <a
        href="/pricing"
        style={{
          display: 'inline-block',
          marginTop: 8,
          fontSize: 12,
          fontWeight: 600,
          color: '#D4AF37',
          textDecoration: 'none',
          fontFamily: 'Inter, sans-serif',
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '0.8' }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
      >
        See plans &rarr;
      </a>
    </motion.div>
  )
}

// ─── Post-first-build celebration overlay ────────────────────────────────────

interface FirstBuildCelebrationProps {
  visible: boolean
  onNextBuild: (prompt: string | null) => void
  onDismiss: () => void
}

export function FirstBuildCelebration({ visible, onNextBuild, onDismiss }: FirstBuildCelebrationProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="celebrate-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onDismiss}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            padding: 20,
          }}
        >
          <motion.div
            key="celebrate-card"
            initial={{ opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 440,
              background: '#0f0f0f',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              borderRadius: 20,
              padding: '40px 32px 28px',
              boxShadow: '0 0 60px rgba(212, 175, 55, 0.12), 0 24px 48px rgba(0, 0, 0, 0.6)',
              textAlign: 'center',
              overflow: 'visible',
            }}
          >
            <ConfettiBurst />

            {/* Gold accent line */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '60%',
              height: 2,
              background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)',
              borderRadius: '0 0 2px 2px',
            }} />

            {/* Trophy */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5, type: 'spring', bounce: 0.5 }}
              style={{ fontSize: 48, marginBottom: 16, lineHeight: 1 }}
            >
              🏆
            </motion.div>

            <h2 style={{
              margin: '0 0 8px',
              fontSize: 22,
              fontWeight: 700,
              color: '#FAFAFA',
              fontFamily: 'Inter, sans-serif',
            }}>
              Your first build!
            </h2>

            <p style={{
              margin: '0 0 24px',
              fontSize: 14,
              color: '#A1A1AA',
              lineHeight: 1.6,
              fontFamily: 'Inter, sans-serif',
            }}>
              {`It's in Studio right now. Want to try something bigger?`}
            </p>

            {/* Next build options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {NEXT_BUILD_OPTIONS.map((opt, i) => (
                <motion.button
                  key={opt.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  onClick={() => onNextBuild(opt.prompt)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 42,
                    borderRadius: 10,
                    border: opt.prompt
                      ? '1px solid rgba(212, 175, 55, 0.3)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    background: opt.prompt
                      ? 'rgba(212, 175, 55, 0.08)'
                      : 'rgba(255, 255, 255, 0.03)',
                    color: opt.prompt ? '#D4AF37' : '#A1A1AA',
                    fontSize: 14,
                    fontWeight: 500,
                    fontFamily: 'Inter, sans-serif',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    if (opt.prompt) {
                      e.currentTarget.style.background = 'rgba(212, 175, 55, 0.15)'
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(212, 175, 55, 0.15)'
                    } else {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                    if (opt.prompt) {
                      e.currentTarget.style.background = 'rgba(212, 175, 55, 0.08)'
                    } else {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                    }
                  }}
                >
                  {opt.label}
                </motion.button>
              ))}
            </div>

            {/* Upgrade nudge — free tier only */}
            <CelebrationUpgradeNudge />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Controls whether the editor onboarding (guided first build) should auto-fire.
 *
 * Suppressed if:
 *   - dismissed before (localStorage), OR
 *   - user already has chat messages
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

/**
 * Tracks first build completion.
 * Call markFirstBuildComplete() after the first successful build.
 * isFirstBuildComplete() checks if already done.
 */
export function markFirstBuildComplete() {
  try { localStorage.setItem(LS_FIRST_BUILD_KEY, 'true') } catch { /* ignore */ }
}

export function isFirstBuildComplete(): boolean {
  if (typeof window === 'undefined') return false
  try { return localStorage.getItem(LS_FIRST_BUILD_KEY) === 'true' } catch { return false }
}

/** Mark voice input as "used" so the tutorial can skip the voice step next time. */
export function markVoiceInputUsed() {
  try { localStorage.setItem('forje_voice_used', '1') } catch { /* ignore */ }
}

/** Read whether the user has used voice input before. SSR-safe. */
export function hasUsedVoiceInput(): boolean {
  if (typeof window === 'undefined') return false
  try { return localStorage.getItem('forje_voice_used') === '1' } catch { return false }
}
