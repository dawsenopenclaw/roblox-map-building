'use client'

/**
 * PublishPanel — THE control center for deploying builds to Roblox Studio.
 *
 * This is what makes ForjeGames the known publishing tool. One panel shows:
 *   1. Studio connection status + pairing flow
 *   2. Active build progress (wave-by-wave)
 *   3. Recent build history with re-deploy
 *   4. Pre-flight checks before big builds
 *   5. Success celebration when builds land in Studio
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { BuildProgressDashboard } from './BuildProgressDashboard'

// ─── Types ──────────────────────────────────────────────────────────────────────

interface RecentBuild {
  id: string
  prompt: string
  timestamp: number
  status: 'complete' | 'failed' | 'partial'
  taskCount: number
}

interface PublishPanelProps {
  open: boolean
  onClose: () => void
  // Studio connection
  studioConnected: boolean
  studioPlaceName: string
  connectCode: string
  connectFlow: 'idle' | 'generating' | 'code' | 'connected'
  onGenerateCode: () => void
  // Active build
  activeBuildId: string | null
  onBuildComplete?: (summary?: string) => void
  // Send to Studio
  onSendToStudio?: (code: string) => void
  // Session ID for re-deploys
  sessionId: string | null
}

// ─── Persistence ────────────────────────────────────────────────────────────────

const LS_BUILDS_KEY = 'fg_recent_builds'
const MAX_BUILDS = 10

function loadRecentBuilds(): RecentBuild[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(LS_BUILDS_KEY)
    return raw ? (JSON.parse(raw) as RecentBuild[]) : []
  } catch { return [] }
}

export function saveRecentBuild(build: RecentBuild) {
  if (typeof window === 'undefined') return
  try {
    const builds = loadRecentBuilds()
    const updated = [build, ...builds.filter(b => b.id !== build.id)].slice(0, MAX_BUILDS)
    localStorage.setItem(LS_BUILDS_KEY, JSON.stringify(updated))
  } catch { /* localStorage full */ }
}

// ─── Time formatter ─────────────────────────────────────────────────────────────

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// ─── Pre-flight Check ───────────────────────────────────────────────────────────

interface PreflightResult {
  ready: boolean
  checks: { label: string; pass: boolean; detail?: string }[]
}

function runPreflight(studioConnected: boolean, connectFlow: string): PreflightResult {
  const checks = [
    {
      label: 'Studio connected',
      pass: studioConnected,
      detail: studioConnected ? 'Plugin is polling' : 'Open Studio and pair with your code',
    },
    {
      label: 'Session active',
      pass: connectFlow === 'connected' || studioConnected,
      detail: studioConnected ? 'Ready to receive commands' : 'Generate a pairing code first',
    },
  ]
  return { ready: checks.every(c => c.pass), checks }
}

// ─── Success Celebration ────────────────────────────────────────────────────────

function DeploySuccess({ summary, onDismiss }: { summary?: string; onDismiss: () => void }) {
  const [particles, setParticles] = useState<{ id: number; x: number; delay: number; color: string }[]>([])

  useEffect(() => {
    const colors = ['#D4AF37', '#22C55E', '#60A5FA', '#F59E0B', '#EC4899']
    const p = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: 10 + Math.random() * 80,
      delay: Math.random() * 0.4,
      color: colors[i % colors.length],
    }))
    setParticles(p)
  }, [])

  return (
    <div style={{
      position: 'relative',
      padding: '32px 20px',
      textAlign: 'center',
      overflow: 'hidden',
    }}>
      {/* Particle burst */}
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: '50%',
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: p.color,
            opacity: 0,
            animation: `publish-particle 1.2s ease-out ${p.delay}s forwards`,
          }}
        />
      ))}

      {/* Success icon */}
      <div style={{
        width: 56,
        height: 56,
        borderRadius: '50%',
        margin: '0 auto 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.05))',
        border: '2px solid rgba(34,197,94,0.4)',
        boxShadow: '0 0 32px rgba(34,197,94,0.3)',
        animation: 'publish-pop 0.4s ease-out',
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>

      <h3 style={{
        fontSize: 16,
        fontWeight: 800,
        color: '#FAFAFA',
        marginBottom: 4,
        letterSpacing: '-0.02em',
      }}>
        Deployed to Studio
      </h3>
      <p style={{
        fontSize: 12,
        color: '#71717A',
        marginBottom: 20,
        lineHeight: 1.5,
      }}>
        {summary || 'Your build is live in Roblox Studio. Check your viewport.'}
      </p>

      <button
        onClick={onDismiss}
        style={{
          padding: '8px 20px',
          borderRadius: 8,
          border: '1px solid rgba(34,197,94,0.3)',
          background: 'rgba(34,197,94,0.1)',
          color: '#22C55E',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
      >
        Continue Building
      </button>

      {/* Keyframes */}
      <style>{`
        @keyframes publish-particle {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-60px) scale(0); }
        }
        @keyframes publish-pop {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// ─── Preflight Card ─────────────────────────────────────────────────────────────

function PreflightCard({
  preflight,
  onGenerateCode,
  connectCode,
}: {
  preflight: PreflightResult
  onGenerateCode: () => void
  connectCode: string
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!connectCode) return
    await navigator.clipboard.writeText(connectCode).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      padding: 16,
      borderRadius: 12,
      background: preflight.ready
        ? 'rgba(34,197,94,0.04)'
        : 'rgba(212,175,55,0.04)',
      border: `1px solid ${preflight.ready ? 'rgba(34,197,94,0.15)' : 'rgba(212,175,55,0.15)'}`,
    }}>
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        color: preflight.ready ? '#22C55E' : '#D4AF37',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        {preflight.ready ? 'Ready to Deploy' : 'Pre-flight Check'}
      </div>

      {preflight.checks.map((check, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 0',
          }}
        >
          {check.pass ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          )}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: check.pass ? '#A1A1AA' : '#FAFAFA' }}>
              {check.label}
            </div>
            {check.detail && (
              <div style={{ fontSize: 10, color: '#52525B', marginTop: 1 }}>
                {check.detail}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Show pairing code or generate button when not connected */}
      {!preflight.ready && (
        <div style={{ marginTop: 12 }}>
          {connectCode ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                display: 'flex',
                gap: 4,
              }}>
                {connectCode.split('').map((char, i) => (
                  <div
                    key={i}
                    style={{
                      width: 32,
                      height: 38,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid rgba(212,175,55,0.25)',
                      borderRadius: 6,
                      fontSize: 16,
                      fontWeight: 800,
                      fontFamily: "'JetBrains Mono', monospace",
                      color: '#D4AF37',
                    }}
                  >
                    {char}
                  </div>
                ))}
              </div>
              <button
                onClick={() => void handleCopy()}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.03)',
                  color: copied ? '#22C55E' : '#A1A1AA',
                  fontSize: 10,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          ) : (
            <button
              onClick={onGenerateCode}
              style={{
                width: '100%',
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid rgba(212,175,55,0.3)',
                background: 'rgba(212,175,55,0.08)',
                color: '#D4AF37',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Generate Pairing Code
            </button>
          )}
          <p style={{ fontSize: 10, color: '#52525B', marginTop: 8, lineHeight: 1.4 }}>
            Paste this code in the ForjeGames plugin inside Roblox Studio
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Main Panel ─────────────────────────────────────────────────────────────────

export function PublishPanel({
  open,
  onClose,
  studioConnected,
  studioPlaceName,
  connectCode,
  connectFlow,
  onGenerateCode,
  activeBuildId,
  onBuildComplete,
  sessionId,
}: PublishPanelProps) {
  const [recentBuilds, setRecentBuilds] = useState<RecentBuild[]>([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [successSummary, setSuccessSummary] = useState<string | undefined>()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setRecentBuilds(loadRecentBuilds())
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  const handleBuildComplete = useCallback((summary?: string) => {
    setShowSuccess(true)
    setSuccessSummary(summary)
    onBuildComplete?.(summary)
  }, [onBuildComplete])

  const preflight = runPreflight(studioConnected, connectFlow)

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 99,
          animation: 'publish-fadeIn 0.2s ease-out',
        }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 380,
          maxWidth: '90vw',
          background: 'linear-gradient(180deg, rgba(10,14,32,0.98) 0%, rgba(6,8,22,0.99) 100%)',
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'publish-slideIn 0.25s ease-out',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#FAFAFA', letterSpacing: '-0.02em' }}>
              Publish to Studio
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#52525B',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6,
              display: 'flex',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}>
          {/* Success state */}
          {showSuccess && (
            <DeploySuccess
              summary={successSummary}
              onDismiss={() => setShowSuccess(false)}
            />
          )}

          {/* Pre-flight / connection status */}
          {!showSuccess && (
            <PreflightCard
              preflight={preflight}
              onGenerateCode={onGenerateCode}
              connectCode={connectCode}
            />
          )}

          {/* Connected info */}
          {studioConnected && !showSuccess && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 10,
              background: 'rgba(34,197,94,0.05)',
              border: '1px solid rgba(34,197,94,0.12)',
            }}>
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#22C55E',
                boxShadow: '0 0 8px rgba(34,197,94,0.5)',
                flexShrink: 0,
              }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#22C55E' }}>
                  Connected
                </div>
                {studioPlaceName && (
                  <div style={{ fontSize: 10, color: '#52525B', marginTop: 1 }}>
                    {studioPlaceName}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Active build progress */}
          {activeBuildId && !showSuccess && (
            <div>
              <div style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#D4AF37',
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Active Build
              </div>
              <BuildProgressDashboard
                buildId={activeBuildId}
                onComplete={handleBuildComplete}
              />
            </div>
          )}

          {/* How it works — shown when no builds */}
          {!activeBuildId && !showSuccess && recentBuilds.length === 0 && (
            <div style={{
              padding: 16,
              borderRadius: 12,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#A1A1AA',
                marginBottom: 12,
              }}>
                How ForjeGames Publishing Works
              </div>
              {[
                { step: '1', label: 'Describe your game in chat', detail: '"Build me a medieval RPG village"' },
                { step: '2', label: 'AI generates terrain, buildings, scripts, UI', detail: 'Wave-by-wave orchestration' },
                { step: '3', label: 'Builds deploy directly to Studio', detail: 'No export, no manual steps' },
              ].map(({ step, label, detail }) => (
                <div key={step} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <div style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: 'rgba(212,175,55,0.1)',
                    border: '1px solid rgba(212,175,55,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 800,
                    color: '#D4AF37',
                    flexShrink: 0,
                  }}>
                    {step}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#D4D4D8' }}>{label}</div>
                    <div style={{ fontSize: 10, color: '#52525B', marginTop: 1 }}>{detail}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recent builds */}
          {recentBuilds.length > 0 && !showSuccess && (
            <div>
              <div style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#71717A',
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Recent Builds
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {recentBuilds.map(build => (
                  <div
                    key={build.id}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    {/* Status dot */}
                    <span style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: build.status === 'complete' ? '#22C55E'
                        : build.status === 'failed' ? '#EF4444'
                        : '#D4AF37',
                      flexShrink: 0,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#D4D4D8',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {build.prompt.length > 50 ? build.prompt.slice(0, 50) + '...' : build.prompt}
                      </div>
                      <div style={{ fontSize: 10, color: '#52525B', marginTop: 1 }}>
                        {build.taskCount} tasks · {timeAgo(build.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            justifyContent: 'center',
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#52525B" strokeWidth="2" strokeLinecap="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
            </svg>
            <span style={{ fontSize: 10, color: '#3F3F46' }}>
              ForjeGames — Direct-to-Studio publishing
            </span>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes publish-fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes publish-slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  )
}
