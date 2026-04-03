'use client'

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { SpaceBackground } from '@/components/editor/SpaceBackground'
import { ChatPanel } from '@/components/editor/ChatPanel'
import { Viewport3D } from '@/components/editor/Viewport3D'
import { CommandPalette } from '@/components/editor/CommandPalette'
import { AIContextPanel } from '@/components/editor/AIContextPanel'
import { parseLuauCode } from '@/lib/luau-parser'
import { useChat } from './hooks/useChat'
import { useStudioConnection, type StudioActivity } from './hooks/useStudioConnection'
import { OnboardingOverlay, useOnboardingOverlay } from './components/OnboardingOverlay'
import { useEditorKeyboard } from './hooks/useEditorKeyboard'
import { ToastProvider, useToast } from '@/components/editor/EditorToasts'
import { ShortcutsHelp } from '@/components/editor/ShortcutsHelp'

// ─── Icons ───────────────────────────────────────────────────────────────────

function IconStore() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="6" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M2 8h14" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M6 2h6l2 4H4l2-4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      <path d="M7 11h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M9 2v2M9 14v2M2 9h2M14 9h2M4.2 4.2l1.4 1.4M12.4 12.4l1.4 1.4M4.2 13.8l1.4-1.4M12.4 5.6l1.4-1.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

function IconHistory() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M9 5.5V9l2.5 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconContext() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 2v14M2 9h14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.3"/>
      <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.3" strokeDasharray="3 3"/>
    </svg>
  )
}

function IconHelp() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M7 7a2 2 0 013.5 1.5c0 1-1.5 1.5-1.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <circle cx="9" cy="12.5" r="0.6" fill="currentColor"/>
    </svg>
  )
}

function IconMaximize() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 5V2h3M9 2h3v3M12 9v3H9M5 14H2v-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconMinimize() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M5 2v3H2M9 2v3h3M2 9h3v3M12 9H9v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ─── Shared styles ───────────────────────────────────────────────────────────

const kbdStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '1px 5px',
  borderRadius: 4,
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  fontSize: 10,
  fontFamily: "'JetBrains Mono', monospace",
  marginRight: 6,
  color: 'rgba(255,255,255,0.5)',
}

// ─── Sidebar Button ──────────────────────────────────────────────────────────

function SidebarButton({
  icon,
  label,
  active,
  onClick,
  badge,
  shortcut,
}: {
  icon: React.ReactNode
  label: string
  active?: boolean
  onClick: () => void
  badge?: string
  shortcut?: string
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div style={{ position: 'relative' }}>
      {hovered && (
        <div style={{ position: 'absolute', right: 'calc(100% + 10px)', top: '50%',
          transform: 'translateY(-50%)', background: 'rgba(10,14,30,0.96)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '5px 10px',
          display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap',
          pointerEvents: 'none', zIndex: 30, backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{label}</span>
          {shortcut && (
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)',
              fontFamily: "'JetBrains Mono', monospace",
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 4, padding: '1px 5px' }}>{shortcut}</span>
          )}
        </div>
      )}
      {active && (
        <div style={{ position: 'absolute', left: -8, top: '50%', transform: 'translateY(-50%)',
          width: 3, height: 18, borderRadius: 2,
          background: 'linear-gradient(180deg, #FFB81C 0%, #D4AF37 100%)',
          boxShadow: '0 0 6px rgba(255,184,28,0.5)' }} />
      )}
      <button onClick={onClick} onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)} title={label}
        style={{ position: 'relative', width: 40, height: 40, borderRadius: 10, border: 'none',
          background: active
            ? 'rgba(212,175,55,0.12)'
            : hovered
              ? 'rgba(255,255,255,0.06)'
              : 'transparent',
          color: active ? '#FFB81C' : hovered ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.15s ease-out' }}>
        {icon}
        {badge && (
          <div style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8,
            borderRadius: '50%', background: '#4ADE80',
            boxShadow: '0 0 4px rgba(74,222,128,0.6)' }} />
        )}
      </button>
    </div>
  )
}

// ─── Agent Activity Strip ────────────────────────────────────────────────────

const AGENT_DISPLAY: Record<string, { label: string; color: string; icon: string }> = {
  'terrain-forge':    { label: 'Terrain Forge',    color: '#4ADE80', icon: '🌍' },
  'city-architect':   { label: 'City Architect',   color: '#60A5FA', icon: '🏙️' },
  'asset-alchemist':  { label: 'Asset Alchemist',  color: '#C084FC', icon: '✨' },
}

function AgentStrip({
  loading,
  mcpResult,
}: {
  loading: boolean
  mcpResult: { server: string; tool: string; success: boolean; demo: boolean } | null
}) {
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    if (loading) {
      startRef.current = Date.now()
      setElapsed(0)
      const id = setInterval(() => {
        setElapsed(Math.floor((Date.now() - (startRef.current ?? Date.now())) / 1000))
      }, 1000)
      return () => clearInterval(id)
    } else {
      startRef.current = null
    }
  }, [loading])

  if (!loading && !mcpResult) return null

  const agent = mcpResult ? AGENT_DISPLAY[mcpResult.server] : null

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '6px 16px',
        background: 'rgba(8,12,28,0.6)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        flexShrink: 0,
        animation: 'stripFade 0.2s ease-out',
      }}
    >
      {/* General building indicator */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFB81C',
              animation: 'agentPulse 1.5s ease-in-out infinite', flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'rgba(255,184,28,0.8)',
              fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>
              Forje is building...
            </span>
            <span style={{ fontSize: 10, color: 'rgba(255,184,28,0.4)',
              fontFamily: "'JetBrains Mono', monospace", marginLeft: 'auto' }}>
              {elapsed}s
            </span>
          </div>
          <div style={{ position: 'relative', height: 2, borderRadius: 1,
            background: 'rgba(212,175,55,0.12)', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '40%',
              background: 'linear-gradient(90deg, transparent, #FFB81C, #D4AF37, transparent)',
              animation: 'progressSlide 1.4s ease-in-out infinite' }} />
          </div>
        </div>
      )}

      {/* Active MCP agent badge */}
      {mcpResult && agent && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '2px 8px',
            borderRadius: 6,
            background: `${agent.color}10`,
            border: `1px solid ${agent.color}25`,
          }}
        >
          <span style={{ fontSize: 12 }}>{agent.icon}</span>
          <span
            style={{
              fontSize: 11,
              color: agent.color,
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 500,
            }}
          >
            {agent.label}
          </span>
          {mcpResult.success && !mcpResult.demo && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5.5l2 2 4-4.5" stroke={agent.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
          {mcpResult.demo && (
            <span style={{ fontSize: 9, color: `${agent.color}80` }}>demo</span>
          )}
        </div>
      )}

      <style>{`
        @keyframes agentPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
        @keyframes stripFade {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes progressSlide {
          0% { transform: translateX(-200%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  )
}

// ─── Viewport (Studio preview / placeholder) ─────────────────────────────────

// CSS monitor illustration with animated radar rings
function MonitorIllustration() {
  return (
    <div style={{ position: 'relative', width: 96, height: 76, margin: '0 auto 4px' }}>
      <svg width="96" height="76" viewBox="0 0 96 76" fill="none">
        {/* Radar rings behind monitor */}
        <circle cx="48" cy="32" r="12" stroke="rgba(212,175,55,0.22)" strokeWidth="1" fill="none"
          style={{ animation: 'radarRing 2.4s ease-out infinite' }}/>
        <circle cx="48" cy="32" r="22" stroke="rgba(212,175,55,0.11)" strokeWidth="1" fill="none"
          style={{ animation: 'radarRing 2.4s ease-out 0.6s infinite' }}/>
        <circle cx="48" cy="32" r="33" stroke="rgba(212,175,55,0.05)" strokeWidth="1" fill="none"
          style={{ animation: 'radarRing 2.4s ease-out 1.2s infinite' }}/>
        {/* Bezel */}
        <rect x="10" y="5" width="76" height="50" rx="5" stroke="rgba(212,175,55,0.3)" strokeWidth="1.5" fill="rgba(6,10,20,0.9)"/>
        {/* Screen face */}
        <rect x="15" y="10" width="66" height="40" rx="3" fill="rgba(212,175,55,0.04)" stroke="rgba(212,175,55,0.1)" strokeWidth="1"/>
        {/* Stand */}
        <rect x="44" y="55" width="8" height="8" rx="1" fill="rgba(212,175,55,0.18)"/>
        <rect x="32" y="63" width="32" height="4" rx="2" fill="rgba(212,175,55,0.18)"/>
        {/* Power LED */}
        <circle cx="48" cy="53" r="1.5" fill="#4ADE80"
          style={{ animation: 'monitorBlink 2.8s ease-in-out infinite' }}/>
        {/* Center dot + crosshair */}
        <circle cx="48" cy="32" r="3" fill="#FFB81C" opacity={0.85}/>
        <line x1="48" y1="22" x2="48" y2="28" stroke="#FFB81C" strokeWidth="1" opacity={0.4}/>
        <line x1="48" y1="36" x2="48" y2="42" stroke="#FFB81C" strokeWidth="1" opacity={0.4}/>
        <line x1="38" y1="32" x2="44" y2="32" stroke="#FFB81C" strokeWidth="1" opacity={0.4}/>
        <line x1="52" y1="32" x2="58" y2="32" stroke="#FFB81C" strokeWidth="1" opacity={0.4}/>
      </svg>
    </div>
  )
}

function ViewportArea({
  isConnected,
  screenshotUrl,
  placeName,
  connectFlow,
  connectCode,
  connectTimer,
  onGenerateCode,
  onConfirmConnected,
  onDisconnect,
  onRequestScreenshot,
  activity,
  commandsSent,
  expanded,
  onToggleExpand,
  previewParts,
}: {
  isConnected: boolean
  screenshotUrl: string | null
  placeName: string
  connectFlow: string
  connectCode: string
  connectTimer: number
  onGenerateCode: () => void
  onConfirmConnected: () => void
  onDisconnect: () => void
  onRequestScreenshot?: () => void
  activity: StudioActivity[]
  commandsSent: number
  expanded: boolean
  onToggleExpand: () => void
  previewParts: import('@/lib/luau-parser').ParsedPart[]
}) {
  // Animated command count — smoothly counts up to target
  const [displayedCommands, setDisplayedCommands] = useState(0)
  useEffect(() => {
    if (!isConnected) return
    if (commandsSent === displayedCommands) return
    const diff = commandsSent - displayedCommands
    const step = diff > 10 ? Math.ceil(diff / 8) : 1
    const timer = setTimeout(() => {
      setDisplayedCommands((prev) => Math.min(prev + step, commandsSent))
    }, 40)
    return () => clearTimeout(timer)
  }, [commandsSent, displayedCommands, isConnected])

  useEffect(() => {
    if (!isConnected) setDisplayedCommands(0)
  }, [isConnected])

  if (!isConnected) {
    const hasCode = connectFlow === 'code' && connectCode.length > 0
    const isGenerating = connectFlow === 'generating'
    // Steps complete progressively as user advances the flow
    const steps = [
      { step: 1, text: 'Install the ForjeGames plugin in Roblox Studio', done: connectFlow === 'code' || connectFlow === 'generating' },
      { step: 2, text: 'Open Studio and load your place', done: connectFlow === 'code' },
      { step: 3, text: 'Click Connect below to link', done: false },
    ]

    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(6,10,20,0.5)',
          borderRadius: 12,
          position: 'relative',
          border: '1px solid rgba(255,255,255,0.04)',
          padding: 32,
          gap: 20,
          overflow: 'hidden',
        }}
      >
        {/* Grid pattern + radar sweep background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 12,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }}
          />
          {/* Very subtle gradient sweep */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(110deg, transparent 25%, rgba(212,175,55,0.03) 50%, transparent 75%)',
              animation: 'radarSweep 5s linear infinite',
            }}
          />
        </div>

        {/* Monitor illustration */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <MonitorIllustration />
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'white' }}>
            Connect Roblox Studio
          </h3>
          <p style={{ margin: '5px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.35)', maxWidth: 300 }}>
            Your builds will appear here in real-time
          </p>
        </div>

        {/* Connection flow */}
        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 360 }}>
          {!hasCode && !isGenerating && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Steps with checkmark animations */}
              {steps.map((s) => (
                <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: s.done ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.04)',
                      border: s.done ? '1px solid rgba(74,222,128,0.35)' : '1px solid rgba(255,255,255,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.3s ease-out',
                    }}
                  >
                    {s.done ? (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        style={{ animation: 'checkPop 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
                      >
                        <path
                          d="M2 6.5l2.5 2.5 5.5-5.5"
                          stroke="#4ADE80"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>
                        {s.step}
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      color: s.done ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.4)',
                      transition: 'color 0.3s ease-out',
                      textDecoration: s.done ? 'line-through' : 'none',
                    }}
                  >
                    {s.text}
                  </span>
                </div>
              ))}

              <button
                onClick={onGenerateCode}
                style={{
                  marginTop: 10,
                  padding: '11px 24px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'linear-gradient(135deg, #FFB81C 0%, #D4AF37 100%)',
                  color: '#030712',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 0 24px rgba(212,175,55,0.25)',
                  transition: 'all 0.15s',
                }}
              >
                Connect Studio
              </button>

              {/* Skip — more visible but clearly secondary */}
              <button
                onClick={onConfirmConnected}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  letterSpacing: '0.01em',
                }}
              >
                Skip — use without Studio
              </button>
            </div>
          )}

          {isGenerating && (
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  margin: '0 auto 12px',
                  border: '2px solid rgba(212,175,55,0.3)',
                  borderTopColor: '#FFB81C',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Generating connection code...</p>
            </div>
          )}

          {hasCode && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>
                Enter this code in the Studio plugin:
              </p>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 12 }}>
                {connectCode.split('').map((char, i) => (
                  <div
                    key={i}
                    style={{
                      width: 48,
                      height: 56,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid rgba(212,175,55,0.3)',
                      borderRadius: 10,
                      fontSize: 24,
                      fontWeight: 700,
                      color: '#FFB81C',
                      fontFamily: "'JetBrains Mono', monospace",
                      textShadow: '0 0 16px rgba(255,184,28,0.5)',
                    }}
                  >
                    {char}
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(connectCode)
                  const btn = document.getElementById('copy-code-btn')
                  if (btn) {
                    btn.textContent = 'Copied!'
                    setTimeout(() => {
                      btn.textContent = 'Copy code'
                    }, 1500)
                  }
                }}
                id="copy-code-btn"
                style={{
                  fontSize: 12,
                  color: '#FFB81C',
                  background: 'rgba(212,175,55,0.1)',
                  border: '1px solid rgba(212,175,55,0.2)',
                  borderRadius: 8,
                  padding: '6px 16px',
                  cursor: 'pointer',
                  marginBottom: 8,
                  transition: 'background 150ms ease',
                }}
              >
                Copy code
              </button>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
                Expires in {Math.floor(connectTimer / 60)}:{String(connectTimer % 60).padStart(2, '0')}
              </p>
            </div>
          )}
        </div>

        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes radarSweep { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
          @keyframes radarRing { 0% { opacity: 0.9; transform: scale(0.7); } 100% { opacity: 0; transform: scale(1.5); } }
          @keyframes monitorBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
          @keyframes checkPop {
            0%   { transform: scale(0) rotate(-10deg); opacity: 0; }
            60%  { transform: scale(1.2) rotate(4deg); opacity: 1; }
            100% { transform: scale(1) rotate(0deg); opacity: 1; }
          }
        `}</style>

        {/* 3D preview behind connection UI */}
        {previewParts.length > 0 && (
          <div style={{ position: 'absolute', inset: 0, borderRadius: 12, overflow: 'hidden', opacity: 0.3, pointerEvents: 'none', zIndex: 0 }}>
            <Viewport3D parts={previewParts} showGrid />
          </div>
        )}
      </div>
    )
  }

  // ── Connected viewport ──────────────────────────────────────────────────────

  return (
    <div
      style={{
        flex: 1,
        position: 'relative',
        background: '#060a14',
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      {/* Live Studio screenshot or 3D preview */}
      {screenshotUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={screenshotUrl}
          alt="Studio viewport"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : previewParts.length > 0 ? (
        <Viewport3D parts={previewParts} showGrid />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {/* Roblox-style icon */}
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'rgba(74,222,128,0.08)',
              border: '1px solid rgba(74,222,128,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <rect x="4" y="4" width="18" height="18" rx="4" fill="rgba(74,222,128,0.15)" stroke="rgba(74,222,128,0.4)" strokeWidth="1.2"/>
              <path d="M9 8h5.5a3 3 0 010 6H9V8z" fill="#4ADE80" opacity={0.9}/>
              <path d="M9 14h4l3 4" stroke="#4ADE80" strokeWidth="1.8" strokeLinecap="round" opacity={0.9}/>
            </svg>
          </div>
          {/* Place name prominently */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{ fontSize: 14, fontWeight: 700, color: 'rgba(74,222,128,0.85)', letterSpacing: '-0.01em' }}
            >
              {placeName || 'Studio'}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>
              Waiting for screenshot...
            </div>
          </div>
          {/* Commands sent counter */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              borderRadius: 6,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path
                d="M1.5 5h7M5.5 2l3 3-3 3"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.3)',
                fontFamily: "'JetBrains Mono', monospace",
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {displayedCommands} commands sent
            </span>
          </div>
        </div>
      )}

      {/* Floating status bar */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          right: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pointerEvents: 'none',
        }}
      >
        {/* Left: place name + connection quality */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 10px',
              borderRadius: 8,
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(74,222,128,0.2)',
            }}
          >
            {/* Inline R icon */}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect
                x="1"
                y="1"
                width="10"
                height="10"
                rx="2.5"
                fill="rgba(74,222,128,0.2)"
                stroke="rgba(74,222,128,0.5)"
                strokeWidth="0.8"
              />
              <path d="M3.5 3.5h3a1.5 1.5 0 010 3H3.5V3.5z" fill="#4ADE80" opacity={0.9}/>
              <path d="M3.5 6.5h2l1.5 2" stroke="#4ADE80" strokeWidth="1" strokeLinecap="round"/>
            </svg>
            <span
              style={{ fontSize: 11, color: 'rgba(74,222,128,0.95)', fontWeight: 600, letterSpacing: '-0.01em' }}
            >
              {placeName || 'Studio'}
            </span>
          </div>

          {/* Connection quality — 4 bars + label */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              padding: '4px 8px',
              borderRadius: 6,
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {[4, 6, 8, 10].map((h, i) => (
              <div
                key={i}
                style={{
                  width: 3,
                  height: h,
                  borderRadius: 1.5,
                  background: '#4ADE80',
                  opacity: 0.5 + i * 0.15,
                }}
              />
            ))}
            <span style={{ fontSize: 10, color: 'rgba(74,222,128,0.75)', fontWeight: 500, marginLeft: 3 }}>
              Excellent
            </span>
          </div>
        </div>

        {/* Right: screenshot refresh + expand + disconnect */}
        <div style={{ display: 'flex', gap: 5, pointerEvents: 'auto' }}>
          {onRequestScreenshot && (
            <button
              onClick={onRequestScreenshot}
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                border: 'none',
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(12px)',
                color: 'rgba(255,255,255,0.55)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'color 0.15s',
              }}
              title="Refresh screenshot"
            >
              {/* Camera icon */}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M5 2.5h4l1 1.5h1.5a1 1 0 011 1v5a1 1 0 01-1 1h-9a1 1 0 01-1-1V5a1 1 0 011-1H3L4 2.5z"
                  stroke="currentColor"
                  strokeWidth="1.1"
                  strokeLinejoin="round"
                />
                <circle cx="7" cy="7" r="1.75" stroke="currentColor" strokeWidth="1.1"/>
              </svg>
            </button>
          )}

          {/* Expand / collapse — icon wrapper rotates smoothly */}
          <button
            onClick={onToggleExpand}
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              border: 'none',
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(12px)',
              color: 'rgba(255,255,255,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'color 0.15s',
            }}
            title={expanded ? 'Restore' : 'Expand viewport'}
          >
            <span
              style={{
                display: 'flex',
                transition: 'transform 0.25s ease-out',
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            >
              {expanded ? <IconMinimize /> : <IconMaximize />}
            </span>
          </button>

          <button
            onClick={onDisconnect}
            style={{
              padding: '4px 10px',
              borderRadius: 7,
              border: 'none',
              background: 'rgba(239,68,68,0.15)',
              color: 'rgba(239,68,68,0.8)',
              fontSize: 11,
              fontWeight: 500,
              cursor: 'pointer',
              backdropFilter: 'blur(12px)',
            }}
          >
            Disconnect
          </button>
        </div>
      </div>

      {/* Activity feed overlay — slide-in per item + command counter */}
      {activity.length > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            maxWidth: 320,
            pointerEvents: 'none',
          }}
        >
          {activity.slice(-3).map((a, idx) => (
            <div
              key={a.id}
              style={{
                padding: '5px 10px',
                borderRadius: 6,
                background: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.06)',
                fontSize: 11,
                color: 'rgba(255,255,255,0.55)',
                fontFamily: "'JetBrains Mono', monospace",
                animation: 'activitySlide 0.25s ease-out both',
                animationDelay: `${idx * 0.04}s`,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <div
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: '#4ADE80',
                  flexShrink: 0,
                  opacity: 0.7,
                }}
              />
              {a.message}
            </div>
          ))}
          {/* Animated commands counter strip */}
          <div
            style={{
              marginTop: 2,
              padding: '4px 10px',
              borderRadius: 6,
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.05)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              alignSelf: 'flex-start',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path
                d="M1.5 5h7M5.5 2l3 3-3 3"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span
              style={{
                fontSize: 10,
                color: 'rgba(255,255,255,0.3)',
                fontFamily: "'JetBrains Mono', monospace",
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {displayedCommands} commands sent
            </span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes activitySlide {
          from { opacity: 0; transform: translateX(-10px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}

// ─── Top Bar ─────────────────────────────────────────────────────────────────

function TopBar({
  isConnected,
  placeName,
  totalTokens,
  onNewChat,
  onConnect,
  onShowShortcuts,
}: {
  isConnected: boolean
  placeName: string
  totalTokens: number
  onNewChat?: () => void
  onConnect?: () => void
  onShowShortcuts?: () => void
}) {
  const { user } = useUser()
  const [newChatHovered, setNewChatHovered] = useState(false)

  return (
    <div
      style={{
        flexShrink: 0,
        height: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 14px',
        background: 'rgba(8,12,28,0.85)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        zIndex: 20,
        backdropFilter: 'blur(12px)',
        position: 'relative',
      }}
    >
      {/* Gradient glow bottom border */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.18) 25%, rgba(255,184,28,0.35) 50%, rgba(212,175,55,0.18) 75%, transparent 100%)',
        pointerEvents: 'none', zIndex: 1 }} />

      {/* Left: Logo + breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            textDecoration: 'none',
          }}
        >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 7,
            background: 'linear-gradient(135deg, #FFB81C 0%, #D4AF37 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="#030712">
            <path d="M6 1L7.5 4.5H11L8 6.5l1 3.5L6 8l-3 2 1-3.5-3-2h3.5L6 1z"/>
          </svg>
        </div>
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '-0.02em',
          }}
        >
          <span style={{ color: '#FFB81C' }}>Forje</span>
          <span style={{ color: 'white' }}>Games</span>
        </span>
        </Link>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, opacity: 0.2 }}>
          <path d="M4 2l4 4-4 4" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>Editor</span>
      </div>

      {/* Center: Connection + project name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {isConnected && placeName && (
          <div style={{ padding: '3px 10px', borderRadius: 6, background: 'rgba(74,222,128,0.06)',
            border: '1px solid rgba(74,222,128,0.15)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ position: 'relative', width: 5, height: 5, flexShrink: 0 }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#4ADE80',
                animation: 'connectedPing 2s ease-in-out infinite' }} />
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#4ADE80',
                boxShadow: '0 0 4px rgba(74,222,128,0.5)' }} />
            </div>
            <span style={{ fontSize: 11, color: 'rgba(74,222,128,0.8)', fontWeight: 500 }}>{placeName}</span>
          </div>
        )}
      </div>

      {/* Right: new chat + token pill + offline + avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={onNewChat} onMouseEnter={() => setNewChatHovered(true)}
          onMouseLeave={() => setNewChatHovered(false)} title="New Chat"
          style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(255,255,255,0.07)',
            background: newChatHovered ? 'rgba(255,255,255,0.07)' : 'transparent',
            color: newChatHovered ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.15s ease-out', flexShrink: 0 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
        {totalTokens > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px',
            borderRadius: 20, background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.22)' }}>
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
              <circle cx="5" cy="5" r="4" stroke="#D4AF37" strokeWidth="1.2"/>
              <path d="M3.5 5h3M5 3.5v3" stroke="#D4AF37" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: 10, color: '#D4AF37', fontVariantNumeric: 'tabular-nums',
              fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
              {totalTokens.toLocaleString()}
            </span>
          </div>
        )}

        {!isConnected && onConnect && (
          <button
            onClick={onConnect}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              borderRadius: 6,
              background: 'rgba(212,175,55,0.08)',
              border: '1px solid rgba(212,175,55,0.2)',
              color: 'rgba(212,175,55,0.8)',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M5 1v3M5 6v3M1 5h3M6 5h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            Connect Studio
          </button>
        )}

        {/* Shortcuts hint */}
        {onShowShortcuts && (
          <button
            onClick={onShowShortcuts}
            title="Keyboard shortcuts (?)"
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.02)',
              color: 'rgba(255,255,255,0.2)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            ?
          </button>
        )}

        {user && (
          <Link href="/settings" style={{ textDecoration: 'none' }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                transition: 'border-color 0.15s',
              }}
            >
              {user.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.imageUrl}
                  alt={user.fullName ?? ''}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.5)',
                  }}
                >
                  {(user.firstName?.[0] ?? '?').toUpperCase()}
                </span>
              )}
            </div>
          </Link>
        )}
      </div>

      <style>{`
        @keyframes connectedPing {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0; transform: scale(2.8); }
        }
      `}</style>
    </div>
  )
}

// ─── Mobile Tab Switcher ─────────────────────────────────────────────────────

function MobileTabBar({
  activeTab,
  onChange,
  isConnected,
}: {
  activeTab: 'chat' | 'studio'
  onChange: (tab: 'chat' | 'studio') => void
  isConnected: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        flexShrink: 0,
        background: 'rgba(8,12,28,0.6)',
      }}
    >
      {(['chat', 'studio'] as const).map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          style={{
            flex: 1,
            padding: '10px 0',
            border: 'none',
            background: 'transparent',
            borderBottom: '2px solid transparent',
            color: activeTab === tab ? 'white' : 'rgba(255,255,255,0.3)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'color 0.15s',
            position: 'relative',
          }}
        >
          {activeTab === tab && (
            <div style={{ position: 'absolute', bottom: 0, left: '10%', right: '10%',
              height: 2, borderRadius: '1px 1px 0 0',
              background: 'linear-gradient(90deg, #D4AF37, #FFB81C, #D4AF37)',
              boxShadow: '0 0 6px rgba(255,184,28,0.4)' }} />
          )}
          {tab === 'chat' ? (
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M2 2h10a1 1 0 011 1v6a1 1 0 01-1 1H5l-3 2V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="2" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M5 13h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              <path d="M7 11v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          )}
          {tab === 'chat' ? 'Chat' : 'Studio'}
          {tab === 'studio' && isConnected && (
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ADE80', flexShrink: 0 }} />
          )}
        </button>
      ))}
    </div>
  )
}

// ─── Resize Handle ───────────────────────────────────────────────────────────

function ResizeHandle({
  onDrag,
}: {
  onDrag: (deltaY: number) => void
}) {
  const [dragging, setDragging] = useState(false)
  const startY = useRef(0)

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      startY.current = e.clientY
      setDragging(true)
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return
      const delta = startY.current - e.clientY
      startY.current = e.clientY
      onDrag(delta)
    },
    [dragging, onDrag],
  )

  const onPointerUp = useCallback(() => {
    setDragging(false)
  }, [])

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        height: 4,
        cursor: 'row-resize',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        position: 'relative',
        zIndex: 5,
      }}
    >
      <div
        style={{
          width: 40,
          height: 3,
          borderRadius: 2,
          background: dragging ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.08)',
          transition: dragging ? 'none' : 'background 0.15s',
        }}
      />
    </div>
  )
}

// ─── Build History Item ──────────────────────────────────────────────────────

function BuildHistoryItem({
  prompt,
  timestamp,
  hasCode,
  onRerun,
}: {
  prompt: string
  timestamp: Date
  hasCode: boolean
  onRerun: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const timeStr = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '10px 12px',
        borderRadius: 10,
        background: hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
        border: '1px solid rgba(255,255,255,0.04)',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
      onClick={onRerun}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: "'JetBrains Mono', monospace" }}>
          {timeStr}
        </span>
        {hasCode && (
          <span
            style={{
              fontSize: 9,
              padding: '1px 5px',
              borderRadius: 4,
              background: 'rgba(74,222,128,0.1)',
              color: 'rgba(74,222,128,0.7)',
            }}
          >
            Built
          </span>
        )}
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 12,
          color: 'rgba(255,255,255,0.6)',
          lineHeight: 1.4,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {prompt}
      </p>
    </div>
  )
}

// ─── Main Editor ─────────────────────────────────────────────────────────────

const CHAT_MIN_HEIGHT = 120
const CHAT_MAX_HEIGHT = 600
const CHAT_DEFAULT_HEIGHT = 340
const LS_CHAT_HEIGHT_KEY = 'fg_editor_chat_height'

function loadChatHeight(): number {
  try {
    const stored = localStorage.getItem(LS_CHAT_HEIGHT_KEY)
    if (stored) {
      const val = parseInt(stored, 10)
      if (val >= CHAT_MIN_HEIGHT && val <= CHAT_MAX_HEIGHT) return val
    }
  } catch { /* ignore */ }
  return CHAT_DEFAULT_HEIGHT
}

export default function NewEditorClient() {
  return (
    <ToastProvider>
      <EditorInner />
    </ToastProvider>
  )
}

function EditorInner() {
  const [mobileTab, setMobileTab] = useState<'chat' | 'studio'>('chat')
  const [viewportExpanded, setViewportExpanded] = useState(false)
  const [sidebarPanel, setSidebarPanel] = useState<string | null>(null)
  const [chatHeight, setChatHeight] = useState(CHAT_DEFAULT_HEIGHT)
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const chatPanelRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Load persisted chat height
  useEffect(() => {
    setChatHeight(loadChatHeight())
  }, [])

  // Onboarding overlay
  const { shouldShow: showOnboarding, dismiss: dismissOnboarding } = useOnboardingOverlay()

  // Studio connection
  const studio = useStudioConnection()

  // Toast on Studio connection changes
  const prevConnected = useRef(false)
  useEffect(() => {
    if (studio.isConnected && !prevConnected.current) {
      toast(`Connected to ${studio.placeName || 'Studio'}`, 'success')
    } else if (!studio.isConnected && prevConnected.current) {
      toast('Disconnected from Studio', 'warning')
    }
    prevConnected.current = studio.isConnected
  }, [studio.isConnected, studio.placeName, toast])

  // Execute Luau in Studio after AI build
  const handleBuildComplete = useCallback(
    async (luauCode: string, prompt: string, sessionId: string | null) => {
      if (!studio.jwt) {
        studio.addActivity('Cannot execute — Studio not authenticated. Reconnect the plugin.')
        return
      }
      studio.recordCommand(`Executing: ${prompt.slice(0, 60)}${prompt.length > 60 ? '...' : ''}`)
      try {
        const res = await fetch('/api/studio/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${studio.jwt}`,
          },
          body: JSON.stringify({ code: luauCode, prompt, sessionId }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: 'unknown' }))
          if (res.status === 401) {
            studio.addActivity('Studio session expired — reconnect the plugin to continue.')
          } else {
            studio.addActivity(`Execution failed: ${data.error || res.statusText}`)
          }
          return
        }
        studio.addActivity('Build sent to Studio — check your viewport!')
        toast('Build executed in Studio', 'success')
      } catch {
        studio.addActivity('Studio execution failed — check your connection.')
        toast('Studio execution failed', 'error')
      }
    },
    [studio, toast],
  )

  // Chat
  const chat = useChat({
    onBuildComplete: handleBuildComplete,
    studioSessionId: studio.sessionId,
    studioConnected: studio.isConnected,
    studioContext: studio.studioContext,
  })

  // Build-error action handlers
  const handleRetry = useCallback(() => {
    chat.resetRetryCount()
    const lastUserMsg = [...chat.messages].reverse().find((m) => m.role === 'user')
    if (lastUserMsg) void chat.sendMessage(lastUserMsg.content)
  }, [chat])

  const handleBuildDifferently = useCallback(() => {
    chat.resetRetryCount()
    chat.setInput('')
    setTimeout(() => chat.textareaRef.current?.focus(), 50)
  }, [chat])

  const handleDismissError = useCallback(
    (id: string) => {
      chat.dismissMessage(id)
      chat.resetRetryCount()
      setTimeout(() => chat.textareaRef.current?.focus(), 50)
    },
    [chat],
  )

  const toggleSidebar = (panel: string) => {
    setSidebarPanel((prev) => (prev === panel ? null : panel))
  }

  // Resize drag handler
  const handleResizeDrag = useCallback((deltaY: number) => {
    setChatHeight((prev) => {
      const next = Math.min(CHAT_MAX_HEIGHT, Math.max(CHAT_MIN_HEIGHT, prev + deltaY))
      try { localStorage.setItem(LS_CHAT_HEIGHT_KEY, String(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  // Keyboard shortcuts
  useEditorKeyboard({
    openCommandPalette: () => setCmdPaletteOpen(true),
    focusChatInput: () => chat.textareaRef.current?.focus(),
    toggleViewport: () => setViewportExpanded((v) => !v),
    toggleSidebar: () => setSidebarPanel((prev) => prev ? null : 'history'),
    toggleShortcutsHelp: () => setShortcutsOpen((v) => !v),
    closeSidebar: () => {
      if (cmdPaletteOpen) { setCmdPaletteOpen(false); return }
      if (shortcutsOpen) { setShortcutsOpen(false); return }
      setSidebarPanel(null)
    },
  })

  // Build history from chat messages
  const buildHistory = chat.messages
    .filter((m) => m.role === 'user')
    .map((m) => ({
      id: m.id,
      prompt: m.content
        .replace(/^\[AUTO-RETRY attempt \d+\/\d+\]\s*/, '')
        .replace(/^\[FORJE_STEP:\d+\/\d+\]\s*/, ''),
      timestamp: m.timestamp,
      hasCode: chat.messages.some(
        (a) => a.role === 'assistant' && a.hasCode && a.timestamp > m.timestamp,
      ),
    }))
    .reverse()

  // Effective chat height
  const effectiveChatHeight = viewportExpanded ? 56 : chatHeight

  // Parse Luau from latest assistant message for 3D preview
  const previewParts = useMemo(() => {
    const lastAssistant = [...chat.messages].reverse().find((m) => m.role === 'assistant' && m.luauCode)
    if (!lastAssistant?.luauCode) return []
    try {
      return parseLuauCode(lastAssistant.luauCode)
    } catch {
      return []
    }
  }, [chat.messages])

  // Command palette handler
  const handleCommand = useCallback((prompt: string) => {
    setCmdPaletteOpen(false)
    if (prompt.startsWith('__action:')) {
      // Handle special actions
      return
    }
    chat.sendMessage(prompt)
  }, [chat])

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100dvh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Onboarding */}
      {showOnboarding && (
        <OnboardingOverlay onDone={dismissOnboarding} inputRef={chat.textareaRef} />
      )}

      {/* Background */}
      <SpaceBackground />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        {/* Top bar */}
        <TopBar
          isConnected={studio.isConnected}
          placeName={studio.placeName}
          totalTokens={chat.totalTokens}
          onNewChat={() => window.location.reload()}
          onConnect={() => studio.generateCode()}
          onShowShortcuts={() => setShortcutsOpen(true)}
        />

        {/* Mobile tab bar */}
        <div className="flex md:hidden">
          <MobileTabBar
            activeTab={mobileTab}
            onChange={setMobileTab}
            isConnected={studio.isConnected}
          />
        </div>

        {/* Main workspace: Viewport + Chat + Sidebar */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            overflow: 'hidden',
          }}
        >
          {/* Center column: Viewport (top) + Agent strip + Chat (bottom) */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
              padding: '4px 0 4px 4px',
              gap: 0,
            }}
          >
            {/* Viewport — fills remaining space */}
            <div
              className={mobileTab === 'chat' ? 'hidden md:flex' : 'flex'}
              style={{
                flex: 1,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              <ViewportArea
                isConnected={studio.isConnected}
                screenshotUrl={studio.screenshotUrl}
                placeName={studio.placeName}
                connectFlow={studio.connectFlow}
                connectCode={studio.connectCode}
                connectTimer={studio.connectTimer}
                onGenerateCode={studio.generateCode}
                onConfirmConnected={studio.confirmConnected}
                onDisconnect={studio.disconnect}
                onRequestScreenshot={studio.isConnected ? studio.requestScreenshot : undefined}
                activity={studio.activity}
                commandsSent={studio.commandsSent}
                expanded={viewportExpanded}
                onToggleExpand={() => setViewportExpanded((v) => !v)}
                previewParts={previewParts}
              />
            </div>

            {/* Agent activity strip */}
            <AgentStrip loading={chat.loading} mcpResult={chat.lastMcpResult} />

            {/* Resize handle — drag to resize chat/viewport split */}
            {!viewportExpanded && (
              <div className="hidden md:block">
                <ResizeHandle onDrag={handleResizeDrag} />
              </div>
            )}

            {/* Chat panel — bottom portion */}
            <div
              ref={chatPanelRef}
              className={mobileTab === 'studio' ? 'hidden md:flex' : 'flex'}
              style={{
                flexShrink: 0,
                height: effectiveChatHeight,
                minHeight: CHAT_MIN_HEIGHT,
                maxHeight: viewportExpanded ? 56 : CHAT_MAX_HEIGHT,
                display: 'flex',
                flexDirection: 'column',
                transition: 'height 0.25s ease-out',
                padding: '4px 0 0',
                position: 'relative',
              }}
            >
              {/* Dim overlay when viewport is expanded */}
              {viewportExpanded && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.55)',
                    backdropFilter: 'blur(2px)',
                    borderRadius: 12,
                    zIndex: 15,
                    pointerEvents: 'none',
                    transition: 'opacity 0.25s ease-out',
                  }}
                />
              )}
              <ChatPanel
                messages={chat.messages}
                input={chat.input}
                setInput={chat.setInput}
                loading={chat.loading}
                onSend={chat.sendMessage}
                selectedModel={chat.selectedModel}
                setSelectedModel={chat.setSelectedModel}
                totalTokens={chat.totalTokens}
                textareaRef={chat.textareaRef}
                suggestions={chat.suggestions}
                onRetry={handleRetry}
                onBuildDifferently={handleBuildDifferently}
                onDismiss={handleDismissError}
                compact={viewportExpanded}
              />
            </div>
          </div>

          {/* Right sidebar — icon rail + panel */}
          <div
            className="hidden md:flex"
            style={{
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'row',
            }}
          >
            {/* Expanded panel */}
            {sidebarPanel && (
              <div
                style={{
                  width: 280,
                  background: 'rgba(8,12,28,0.85)',
                  borderLeft: '1px solid rgba(255,255,255,0.04)',
                  backdropFilter: 'blur(12px)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  animation: 'slideIn 0.2s ease-out',
                }}
              >
                <div
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
                    {sidebarPanel === 'marketplace' && 'Marketplace'}
                    {sidebarPanel === 'settings' && 'Settings'}
                    {sidebarPanel === 'history' && 'Build History'}
                    {sidebarPanel === 'context' && 'AI Context'}
                    {sidebarPanel === 'help' && 'Help'}
                  </span>
                  <button
                    onClick={() => setSidebarPanel(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255,255,255,0.3)',
                      cursor: 'pointer',
                      padding: 4,
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                  {sidebarPanel === 'marketplace' && (
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                      <p style={{ margin: '0 0 12px' }}>Browse community templates and assets.</p>
                      <div
                        style={{
                          padding: 12,
                          borderRadius: 10,
                          background: 'rgba(212,175,55,0.06)',
                          border: '1px solid rgba(212,175,55,0.15)',
                          fontSize: 12,
                          color: 'rgba(212,175,55,0.8)',
                        }}
                      >
                        Type &quot;show marketplace&quot; in chat to browse assets
                      </div>
                    </div>
                  )}
                  {sidebarPanel === 'settings' && (
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                      <p style={{ margin: '0 0 12px' }}>Editor preferences and API keys.</p>
                      <div
                        style={{
                          padding: 12,
                          borderRadius: 10,
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          fontSize: 12,
                        }}
                      >
                        <Link
                          href="/settings"
                          style={{
                            color: '#FFB81C',
                            textDecoration: 'none',
                            fontWeight: 500,
                          }}
                        >
                          Open full settings
                        </Link>
                      </div>
                    </div>
                  )}
                  {sidebarPanel === 'history' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {buildHistory.length === 0 ? (
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, margin: 0 }}>
                          Your builds will appear here as you create.
                        </p>
                      ) : (
                        buildHistory.slice(0, 20).map((item) => (
                          <BuildHistoryItem
                            key={item.id}
                            prompt={item.prompt}
                            timestamp={item.timestamp}
                            hasCode={item.hasCode}
                            onRerun={() => chat.sendMessage(item.prompt)}
                          />
                        ))
                      )}
                    </div>
                  )}
                  {sidebarPanel === 'context' && (
                    <AIContextPanel
                      studioConnected={studio.isConnected}
                      studioContext={studio.studioContext}
                      onSendToChat={(msg) => chat.sendMessage(msg)}
                      buildCount={chat.messages.filter((m) => m.hasCode).length}
                      tokenCount={chat.totalTokens}
                    />
                  )}
                  {sidebarPanel === 'help' && (
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.6 }}>
                      <p style={{ margin: '0 0 12px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                        Quick Start
                      </p>
                      <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <li>Type what you want to build in the chat</li>
                        <li>Connect Roblox Studio with the plugin</li>
                        <li>Builds execute automatically in Studio</li>
                        <li>Iterate — &quot;make it bigger&quot;, &quot;add lighting&quot;</li>
                      </ol>
                      <div
                        style={{
                          marginTop: 16,
                          padding: 12,
                          borderRadius: 10,
                          background: 'rgba(212,175,55,0.06)',
                          border: '1px solid rgba(212,175,55,0.15)',
                          fontSize: 12,
                          color: 'rgba(212,175,55,0.8)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                        }}
                      >
                        <span style={{ fontWeight: 600, marginBottom: 2 }}>Keyboard Shortcuts</span>
                        <span><kbd style={kbdStyle}>Enter</kbd> Send message</span>
                        <span><kbd style={kbdStyle}>Shift+Enter</kbd> New line</span>
                        <span><kbd style={kbdStyle}>Ctrl+K</kbd> Focus chat</span>
                        <span><kbd style={kbdStyle}>Ctrl+\</kbd> Expand viewport</span>
                        <span><kbd style={kbdStyle}>Esc</kbd> Close panel</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Icon rail */}
            <div
              style={{
                width: 52,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                paddingTop: 8,
                gap: 2,
                background: 'rgba(8,12,28,0.5)',
                borderLeft: '1px solid rgba(255,255,255,0.03)',
              }}
            >
              <SidebarButton
                icon={<IconStore />}
                label="Marketplace"
                shortcut="⌘M"
                active={sidebarPanel === 'marketplace'}
                onClick={() => toggleSidebar('marketplace')}
              />
              <SidebarButton
                icon={<IconHistory />}
                label="Build History"
                shortcut="⌘H"
                active={sidebarPanel === 'history'}
                onClick={() => toggleSidebar('history')}
              />
              <SidebarButton
                icon={<IconSettings />}
                label="Settings"
                shortcut="⌘,"
                active={sidebarPanel === 'settings'}
                onClick={() => toggleSidebar('settings')}
              />
              <SidebarButton
                icon={<IconContext />}
                label="AI Context"
                shortcut="⌘A"
                active={sidebarPanel === 'context'}
                onClick={() => toggleSidebar('context')}
                badge={studio.isConnected ? 'active' : undefined}
              />

              {/* Separator */}
              <div
                style={{
                  width: 24,
                  height: 1,
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: 1,
                  margin: '4px 0',
                }}
              />

              <div style={{ flex: 1 }} />

              <SidebarButton
                icon={<IconHelp />}
                label="Help"
                shortcut="⌘/"
                active={sidebarPanel === 'help'}
                onClick={() => toggleSidebar('help')}
              />
              <div style={{ height: 8 }} />
            </div>
          </div>
        </div>
      </div>

      {/* Command Palette overlay */}
      <CommandPalette
        isOpen={cmdPaletteOpen}
        onClose={() => setCmdPaletteOpen(false)}
        onCommand={handleCommand}
      />

      {/* Shortcuts Help overlay */}
      <ShortcutsHelp isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(12px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
