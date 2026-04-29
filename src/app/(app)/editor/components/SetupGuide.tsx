'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Download, Shield, Key, Plug, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react'

// ─── Constants ──────────────────────────────────────────────────────────────

const LS_SETUP_COMPLETE = 'forje_setup_complete'

// ─── Step data ──────────────────────────────────────────────────────────────

interface SetupStep {
  icon: typeof Download
  title: string
  description: string
  detail: string
  action?: { label: string; href: string }
}

const STEPS: SetupStep[] = [
  {
    icon: Download,
    title: 'Download the Plugin',
    description: 'Install the ForjeGames plugin for Roblox Studio.',
    detail: 'Head to the download page and grab the latest version. It installs in one click — no manual file moves needed.',
    action: { label: 'Go to Downloads', href: '/download' },
  },
  {
    icon: Shield,
    title: 'Enable HTTP Requests',
    description: 'Allow Studio to communicate with ForjeGames.',
    detail: 'In Roblox Studio, go to Game Settings → Security → Allow HTTP Requests → toggle ON. This lets the plugin receive build commands from our AI.',
  },
  {
    icon: Key,
    title: 'Get Your Code',
    description: 'Copy your 6-digit pairing code.',
    detail: 'Go to Settings → Studio tab in ForjeGames. You\'ll see a 6-digit code. Copy it — you\'ll paste it into the plugin next.',
    action: { label: 'Open Settings', href: '/settings?tab=studio' },
  },
  {
    icon: Plug,
    title: 'Paste in Plugin',
    description: 'Connect the plugin to your account.',
    detail: 'Open the ForjeGames plugin window in Roblox Studio. Paste your 6-digit code and click Connect. The status should turn green.',
  },
  {
    icon: Sparkles,
    title: 'Start Building!',
    description: 'Type a prompt and watch it appear in Studio.',
    detail: 'Go to the editor, type something like "Build me a house with a garden" and hit send. The AI will generate it and push it straight into your Studio viewport.',
  },
]

// ─── Exports ────────────────────────────────────────────────────────────────

export function isSetupComplete(): boolean {
  try {
    return localStorage.getItem(LS_SETUP_COMPLETE) === 'true'
  } catch {
    return false
  }
}

export function markSetupComplete(): void {
  try {
    localStorage.setItem(LS_SETUP_COMPLETE, 'true')
  } catch { /* ignore */ }
}

// ─── Hook to auto-show for first-time users ─────────────────────────────────

export function useSetupGuide(isStudioConnected: boolean) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Don't auto-show if Studio is already connected or if user dismissed before
    if (isStudioConnected) return
    if (isSetupComplete()) return
    // Small delay so it doesn't fight with other modals
    const timer = setTimeout(() => setOpen(true), 1500)
    return () => clearTimeout(timer)
  }, [isStudioConnected])

  // Auto-close if Studio connects while guide is open
  useEffect(() => {
    if (isStudioConnected && open) {
      markSetupComplete()
      setOpen(false)
    }
  }, [isStudioConnected, open])

  return { open, setOpen }
}

// ─── Component ──────────────────────────────────────────────────────────────

export function SetupGuide({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [step, setStep] = useState(0)
  const [dontShow, setDontShow] = useState(false)

  const handleClose = useCallback(() => {
    if (dontShow) {
      markSetupComplete()
    }
    setStep(0)
    onClose()
  }, [dontShow, onClose])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, handleClose])

  if (!open) return null

  const current = STEPS[step]
  const Icon = current.icon
  const isLast = step === STEPS.length - 1
  const isFirst = step === 0

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: 'setupGuideBackdropIn 0.25s ease-out',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div
        style={{
          width: '100%', maxWidth: 520, margin: '0 16px',
          background: 'linear-gradient(135deg, rgba(12,16,32,0.92) 0%, rgba(18,22,44,0.88) 100%)',
          backdropFilter: 'blur(40px) saturate(1.3)',
          WebkitBackdropFilter: 'blur(40px) saturate(1.3)',
          border: '1px solid rgba(212,175,55,0.15)',
          borderRadius: 20,
          boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.06)',
          overflow: 'hidden',
          animation: 'setupGuideModalIn 0.3s ease-out',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(212,175,55,0.7)', fontFamily: 'monospace', marginBottom: 4 }}>
              Setup Guide
            </p>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#FAFAFA', margin: 0 }}>
              Connect Roblox Studio
            </h2>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close setup guide"
            style={{
              width: 32, height: 32, borderRadius: 8, border: 'none',
              background: 'rgba(255,255,255,0.05)', color: '#71717A',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.color = '#A1A1AA' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#71717A' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Setup video — self-hosted MP4 */}
        {/* Drop your file at: public/videos/setup-guide.mp4 */}
        <div style={{ padding: '16px 24px 0' }}>
          <div style={{ borderRadius: 12, overflow: 'hidden', aspectRatio: '16/9', background: 'rgba(0,0,0,0.3)' }}>
            <video
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              src="/videos/setup-guide.mp4"
              controls
              playsInline
              preload="metadata"
              poster="/videos/setup-guide-poster.jpg"
            />
          </div>
        </div>

        {/* Step indicator dots */}
        <div style={{ padding: '16px 24px 0', display: 'flex', gap: 6, alignItems: 'center' }}>
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              aria-label={`Go to step ${i + 1}`}
              style={{
                width: i === step ? 24 : 8, height: 8,
                borderRadius: 4, border: 'none', cursor: 'pointer',
                background: i === step
                  ? 'linear-gradient(135deg, #D4AF37, #FFD966)'
                  : i < step
                    ? 'rgba(212,175,55,0.3)'
                    : 'rgba(255,255,255,0.08)',
                transition: 'all 0.3s ease-out',
              }}
            />
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#71717A', fontFamily: 'monospace' }}>
            {step + 1}/{STEPS.length}
          </span>
        </div>

        {/* Step content */}
        <div style={{ padding: '24px 24px 20px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: 'rgba(212,175,55,0.10)',
              border: '1px solid rgba(212,175,55,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={22} style={{ color: '#D4AF37' }} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#FAFAFA', margin: '0 0 2px' }}>
                {current.title}
              </h3>
              <p style={{ fontSize: 13, color: '#A1A1AA', margin: 0 }}>
                {current.description}
              </p>
            </div>
          </div>

          <p style={{
            fontSize: 14, lineHeight: 1.65, color: '#71717A', margin: '0 0 16px',
            padding: '14px 16px', borderRadius: 12,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            {current.detail}
          </p>

          {current.action && (
            <a
              href={current.action.href}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 10,
                fontSize: 13, fontWeight: 600,
                color: '#D4AF37',
                background: 'rgba(212,175,55,0.10)',
                border: '1px solid rgba(212,175,55,0.20)',
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(212,175,55,0.18)'
                e.currentTarget.style.borderColor = 'rgba(212,175,55,0.35)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(212,175,55,0.10)'
                e.currentTarget.style.borderColor = 'rgba(212,175,55,0.20)'
              }}
            >
              {current.action.label}
            </a>
          )}
        </div>

        {/* Footer: nav + dont show again */}
        <div style={{
          padding: '16px 24px 20px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12,
        }}>
          {/* Don't show again checkbox */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: '#52525B' }}>
            <input
              type="checkbox"
              checked={dontShow}
              onChange={e => setDontShow(e.target.checked)}
              style={{
                width: 14, height: 14, borderRadius: 4, cursor: 'pointer',
                accentColor: '#D4AF37',
              }}
            />
            Don&apos;t show again
          </label>

          {/* Nav buttons */}
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            {!isFirst && (
              <button
                onClick={() => setStep(s => s - 1)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.10)',
                  background: 'rgba(255,255,255,0.04)', color: '#A1A1AA',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
              >
                <ChevronLeft size={14} />
                Back
              </button>
            )}
            {!isLast ? (
              <button
                onClick={() => setStep(s => s + 1)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '8px 16px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg, #D4AF37, #FFD966)',
                  color: '#050810', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
                onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
              >
                Next
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleClose}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '8px 20px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg, #D4AF37, #FFD966)',
                  color: '#050810', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
                onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
              >
                <Sparkles size={14} />
                Done
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes setupGuideBackdropIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes setupGuideModalIn {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}
