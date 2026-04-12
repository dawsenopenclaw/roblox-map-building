'use client'

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { SpaceBackground } from '@/components/editor/SpaceBackground'
import { StudioPreviewPanel } from './panels/StudioPreviewPanel'
import { ChatPanel } from '@/components/editor/ChatPanel'
import { Viewport3D } from '@/components/editor/Viewport3D'
import { CommandPalette } from '@/components/editor/CommandPalette'
import { AIContextPanel } from '@/components/editor/AIContextPanel'
import { parseLuauCode } from '@/lib/luau-parser'
import { useChat, loadSessions, type ChatSessionMeta, type ChatMessage } from './hooks/useChat'
import { useStudioConnection, type StudioActivity } from './hooks/useStudioConnection'
import { OnboardingOverlay, useOnboardingOverlay, hasUsedVoiceInput, markVoiceInputUsed } from './components/OnboardingOverlay'
import { useEditorKeyboard } from './hooks/useEditorKeyboard'
import { ToastProvider, useToast } from '@/components/editor/EditorToasts'
import { ShortcutsHelp } from '@/components/editor/ShortcutsHelp'
import { ThemeProvider, useTheme } from '@/components/ThemeProvider'
import { THEMES } from '@/lib/themes'
import SettingsPanel from './panels/SettingsPanel'
import { FirstRunExperience } from '@/components/editor/FirstRunExperience'
import { SuggestedPrompts } from '@/components/editor/SuggestedPrompts'
import { AssetGenerator } from '@/components/editor/AssetGenerator'
import { ProjectsSidebarPanel } from './panels/ProjectsSidebarPanel'
import { saveProject, loadProject, type ProjectData } from '@/hooks/useProject'
import { useAutoPlaytest } from '@/hooks/useAutoPlaytest'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { MobileBottomSheet } from '@/components/editor/MobileBottomSheet'

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

function IconPreview() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M6 15h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M9 13v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <circle cx="9" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  )
}

function IconGenerate() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 2L10.8 6.2L15 8l-4.2 1.8L9 14l-1.8-4.2L3 8l4.2-1.8L9 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      <path d="M14 13l1 2M15 13l-1 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}

function IconBuildHistory() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M5 7h8M5 10h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <circle cx="13" cy="12.5" r="2.5" fill="rgba(212,175,55,0)" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M13 11.5v1.5l1 0.8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconProjects() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="5" width="6" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
      <rect x="10" y="3" width="6" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M4 8h2M4 11h2M12 6h2M12 9h2M12 12h2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
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

function IconDropUser() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M1.5 12.5c0-3 2-4.5 5.5-4.5s5.5 1.5 5.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

function IconDropPalette() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
      <circle cx="4.5" cy="6" r="1" fill="currentColor"/>
      <circle cx="7" cy="4.5" r="1" fill="currentColor"/>
      <circle cx="9.5" cy="6" r="1" fill="currentColor"/>
      <path d="M7 11.5c1.5 0 2.5-.8 2.5-2s-1-1.5-2.5-1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

function IconDropCreditCard() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="1.5" y="3" width="11" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M1.5 6h11" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M4 9h2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
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

// ─── Editor Profile Dropdown (inline, not fixed) ─────────────────────────────

function EditorProfileDropdown({ user }: { user: { imageUrl?: string; firstName?: string | null; lastName?: string | null; fullName?: string | null; emailAddresses?: { emailAddress: string }[] } }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    function escHandler(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', escHandler)
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', escHandler) }
  }, [open])

  const name = user.fullName ?? user.firstName ?? 'User'
  const email = user.emailAddresses?.[0]?.emailAddress ?? ''
  const initial = (user.firstName?.[0] ?? '?').toUpperCase()

  return (
    <div ref={wrapRef} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        title={name}
        style={{
          width: 28, height: 28, borderRadius: '50%', border: 'none',
          padding: 0, cursor: 'pointer', overflow: 'hidden',
          outline: open ? '2px solid rgba(212,175,55,0.5)' : '2px solid transparent',
          outlineOffset: 1, transition: 'outline-color 0.15s', flexShrink: 0,
          background: 'rgba(255,255,255,0.06)',
        }}
      >
        {user.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.imageUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: 11, fontWeight: 700, color: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
            {initial}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 9999,
          width: 220, background: '#111113', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
          overflow: 'hidden', maxHeight: 'calc(100vh - 60px)', overflowY: 'auto',
        }}>
          {/* Identity */}
          <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'white' }}>{name}</p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{email}</p>
          </div>
          {/* Links */}
          {[
            { href: '/settings',              label: 'Profile & Settings', Icon: IconDropUser },
            { href: '/settings?tab=appearance', label: 'Appearance',       Icon: IconDropPalette },
            { href: '/billing',               label: 'Billing',            Icon: IconDropCreditCard },
          ].map(({ href, label, Icon }) => (
            <a
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', fontSize: 12, color: 'rgba(255,255,255,0.7)', textDecoration: 'none', transition: 'background 0.1s' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'white' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
            >
              <Icon />
              {label}
            </a>
          ))}
          {/* Sign out */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <a
              href="/sign-out"
              onClick={(e) => { e.preventDefault(); setOpen(false); window.location.href = '/sign-out' }}
              style={{ display: 'block', padding: '8px 14px', fontSize: 12, color: 'rgba(239,68,68,0.8)', textDecoration: 'none', transition: 'background 0.1s' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.06)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Sign out
            </a>
          </div>
        </div>
      )}
    </div>
  )
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
          background: 'linear-gradient(180deg, #D4AF37 0%, #D4AF37 100%)',
          boxShadow: '0 0 6px rgba(212,175,55,0.5)' }} />
      )}
      <button onClick={onClick} onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)} title={label}
        style={{ position: 'relative', width: 40, height: 40, borderRadius: 10, border: 'none',
          background: active
            ? 'rgba(212,175,55,0.12)'
            : hovered
              ? 'rgba(255,255,255,0.06)'
              : 'transparent',
          color: active ? '#D4AF37' : hovered ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)',
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
        background: 'rgba(8,12,28,0.3)',
        flexShrink: 0,
        animation: 'stripFade 0.2s ease-out',
      }}
    >
      {/* General building indicator */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#D4AF37',
              animation: 'agentPulse 1.5s ease-in-out infinite', flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'rgba(212,175,55,0.8)',
              fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>
              Forje is building...
            </span>
            <span style={{ fontSize: 10, color: 'rgba(212,175,55,0.4)',
              fontFamily: "'JetBrains Mono', monospace", marginLeft: 'auto' }}>
              {elapsed}s
            </span>
          </div>
          <div style={{ position: 'relative', height: 2, borderRadius: 1,
            background: 'rgba(212,175,55,0.12)', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '40%',
              background: 'linear-gradient(90deg, transparent, #D4AF37, #D4AF37, transparent)',
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
        <circle cx="48" cy="32" r="12" stroke="rgba(212,175,55,0.08)" strokeWidth="1" fill="none"
          style={{ animation: 'radarRing 2.4s ease-out infinite' }}/>
        <circle cx="48" cy="32" r="22" stroke="rgba(212,175,55,0.04)" strokeWidth="1" fill="none"
          style={{ animation: 'radarRing 2.4s ease-out 0.6s infinite' }}/>
        <circle cx="48" cy="32" r="33" stroke="rgba(212,175,55,0.02)" strokeWidth="1" fill="none"
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
        <circle cx="48" cy="32" r="3" fill="#D4AF37" opacity={0.85}/>
        <line x1="48" y1="22" x2="48" y2="28" stroke="#D4AF37" strokeWidth="1" opacity={0.4}/>
        <line x1="48" y1="36" x2="48" y2="42" stroke="#D4AF37" strokeWidth="1" opacity={0.4}/>
        <line x1="38" y1="32" x2="44" y2="32" stroke="#D4AF37" strokeWidth="1" opacity={0.4}/>
        <line x1="52" y1="32" x2="58" y2="32" stroke="#D4AF37" strokeWidth="1" opacity={0.4}/>
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

    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(6,10,20,0.5)',
          borderRadius: 12,
          position: 'relative',
          border: '1px solid rgba(255,255,255,0.04)',
          padding: '24px 28px',
          overflow: 'hidden',
        }}
      >
        {/* Grid bg */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: 12, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ width: '100%', height: '100%', backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        {/* Scrollable content */}
        <div style={{ position: 'relative', zIndex: 1, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Skip banner — prominent, at top */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 14px', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 10 }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontFamily: 'Inter, sans-serif' }}>
              Just want to chat?
            </span>
            <button
              onClick={onConfirmConnected}
              style={{
                padding: '7px 16px', borderRadius: 8, border: 'none',
                background: '#D4AF37',
                color: '#030712', fontSize: 13, fontWeight: 700,
                fontFamily: 'Inter, sans-serif', cursor: 'pointer',
                boxShadow: '0 0 16px rgba(212,175,55,0.35)',
                whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              Skip — chat without Studio
            </button>
          </div>

          {/* Header */}
          <div style={{ textAlign: 'center', paddingTop: 4 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'white' }}>
              Connect to Roblox Studio
            </h3>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
              Follow these steps to link your Studio — builds will appear in real-time
            </p>
          </div>

          {/* ── Progress Steps (matches /download page) ────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 4 }}>
            {['Download', 'Install', 'Restart Studio', 'Connect'].map((label, i) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                    background: i === 0 ? '#D4AF37' : '#1A2550',
                    color: i === 0 ? '#000' : '#8B95B0',
                  }}>{i + 1}</div>
                  <span style={{ fontSize: 10, fontWeight: 500, color: i === 0 ? '#D4AF37' : '#8B95B0' }}>{label}</span>
                </div>
                {i < 3 && <div style={{ width: 24, height: 1, background: 'rgba(255,255,255,0.08)', margin: '0 4px', marginBottom: 16 }} />}
              </div>
            ))}
          </div>

          {/* ── STEP 1: Download Plugin ────────────────────────── */}
          <div style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.06) 0%, rgba(255,255,255,0.02) 100%)', borderRadius: 12, padding: '16px 18px', border: '1px solid rgba(212,175,55,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(212,175,55,0.15)', border: '1.5px solid rgba(212,175,55,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#D4AF37' }}>1</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>Download the Plugin</span>
            </div>
            <div style={{ paddingLeft: 38, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a
                href="/plugin/ForjeGames.rbxmx"
                download="ForjeGames.rbxmx"
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '10px 22px', borderRadius: 10,
                  background: '#D4AF37',
                  color: '#030712', fontSize: 13, fontWeight: 800, textDecoration: 'none',
                  boxShadow: '0 4px 20px rgba(212,175,55,0.25)',
                  transition: 'all 0.2s', width: 'fit-content',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1v10m0 0L4.5 7.5M8 11l3.5-3.5M2 13h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Download ForjeGames.rbxmx
              </a>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>96 KB &bull; .rbxmx &bull; Works with Studio 2024+</span>
            </div>
          </div>

          {/* ── STEP 2: Install (copy to Plugins folder) ──────────────── */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '16px 18px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(212,175,55,0.12)', border: '1.5px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#D4AF37' }}>2</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>Copy to Plugins Folder</span>
            </div>
            <div style={{ paddingLeft: 38, fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
              In Studio: <strong style={{ color: 'rgba(255,255,255,0.6)' }}>Plugins</strong> tab → <strong style={{ color: 'rgba(255,255,255,0.6)' }}>Plugins Folder</strong> → drag <span style={{ color: '#D4AF37', fontFamily: 'monospace', fontWeight: 600 }}>ForjeGames.rbxmx</span> in
              <br /><br />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                Or copy manually to:<br />
                <span style={{ fontFamily: 'monospace', color: 'rgba(212,175,55,0.6)' }}>%LOCALAPPDATA%\Roblox\Plugins\</span>
              </span>
            </div>
          </div>

          {/* ── STEP 3: Restart Studio + Enable HTTP ──────────────────── */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '16px 18px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(212,175,55,0.12)', border: '1.5px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#D4AF37' }}>3</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>Restart Studio &amp; Enable HTTP</span>
            </div>
            <div style={{ paddingLeft: 38, fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
              <span style={{ display: 'inline-block', width: 18, color: '#D4AF37', fontWeight: 600 }}>1.</span> <strong style={{ color: 'rgba(255,255,255,0.6)' }}>Fully close</strong> and reopen Roblox Studio
              <br />
              <span style={{ display: 'inline-block', width: 18, color: '#D4AF37', fontWeight: 600 }}>2.</span> Open any place (Baseplate works)
              <br />
              <span style={{ display: 'inline-block', width: 18, color: '#D4AF37', fontWeight: 600 }}>3.</span> <strong style={{ color: 'rgba(255,255,255,0.6)' }}>Home</strong> → <strong style={{ color: 'rgba(255,255,255,0.6)' }}>Game Settings</strong> → <strong style={{ color: 'rgba(255,255,255,0.6)' }}>Security</strong> → Enable <strong style={{ color: '#D4AF37' }}>Allow HTTP Requests</strong>
            </div>
          </div>

          {/* ── STEP 4: Connect with Code ────────────────────────── */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '16px 18px', border: hasCode ? '1px solid rgba(212,175,55,0.3)' : '1px solid rgba(255,255,255,0.06)', transition: 'border-color 0.3s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: hasCode ? 'rgba(212,175,55,0.2)' : 'rgba(212,175,55,0.12)', border: '1.5px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.3s' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#D4AF37' }}>4</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>Connect with Code</span>
            </div>

            <div style={{ paddingLeft: 38 }}>
              {!hasCode && !isGenerating && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0, lineHeight: 1.5 }}>
                    Click below to generate a 6-character code. Enter it in the ForjeGames plugin inside Studio to connect.
                  </p>
                  <button
                    onClick={onGenerateCode}
                    style={{
                      padding: '10px 22px', borderRadius: 8, border: 'none',
                      background: 'linear-gradient(135deg, #D4AF37 0%, #D4AF37 100%)',
                      color: '#030712', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      boxShadow: '0 0 20px rgba(212,175,55,0.2)', transition: 'all 0.15s',
                      width: 'fit-content',
                    }}
                  >
                    Generate Connection Code
                  </button>
                </div>
              )}

              {isGenerating && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 20, height: 20, border: '2px solid rgba(212,175,55,0.3)', borderTopColor: '#D4AF37', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Generating code...</span>
                </div>
              )}

              {hasCode && (
                <div>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '0 0 10px' }}>
                    Enter this code in the ForjeGames plugin dialog in Studio:
                  </p>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                    {connectCode.split('').map((char, i) => (
                      <div
                        key={i}
                        style={{
                          width: 44, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'rgba(0,0,0,0.4)', border: '2px solid rgba(212,175,55,0.4)', borderRadius: 8,
                          fontSize: 22, fontWeight: 700, color: '#D4AF37', fontFamily: "'JetBrains Mono', monospace",
                          textShadow: '0 0 12px rgba(212,175,55,0.4)',
                        }}
                      >
                        {char}
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(connectCode).catch(() => {})
                        const el = document.getElementById('vp-copy-btn')
                        if (el) { el.textContent = 'Copied!'; setTimeout(() => { el.textContent = 'Copy' }, 1500) }
                      }}
                      id="vp-copy-btn"
                      style={{
                        fontSize: 11, fontWeight: 600, color: '#D4AF37', background: 'rgba(212,175,55,0.1)',
                        border: '1px solid rgba(212,175,55,0.25)', borderRadius: 8, padding: '6px 12px',
                        cursor: 'pointer', alignSelf: 'center', marginLeft: 4, transition: 'background 150ms',
                      }}
                    >
                      Copy
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#D4AF37', animation: 'monitorBlink 1.5s ease-in-out infinite' }} />
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                      Waiting for Studio to connect... ({Math.floor(connectTimer / 60)}:{String(connectTimer % 60).padStart(2, '0')})
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Troubleshooting ────────────────────────── */}
          <details style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '12px 18px', border: '1px solid rgba(255,255,255,0.04)' }}>
            <summary style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontWeight: 500 }}>
              Having trouble connecting?
            </summary>
            <div style={{ paddingTop: 10, fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.7 }}>
              <strong style={{ color: 'rgba(255,255,255,0.45)' }}>Plugin not showing up?</strong>
              <br />• Make sure you put the <strong style={{ color: 'rgba(255,255,255,0.45)' }}>.rbxmx</strong> file in the <strong style={{ color: 'rgba(255,255,255,0.45)' }}>Plugins</strong> folder (not Models, not Workspace)
              <br />• <strong style={{ color: 'rgba(255,255,255,0.45)' }}>Fully close and reopen</strong> Studio after adding the file
              <br />• The ForjeGames panel should open automatically — if not, check the Plugins tab for a &quot;ForjeGames&quot; button
              <br />• The panel has a text box where you type the 6-character code
              <br /><br />
              <strong style={{ color: 'rgba(255,255,255,0.45)' }}>Code not working?</strong>
              <br />• Make sure Studio has internet access (not behind a firewall blocking outbound)
              <br />• The code expires after 5 minutes — generate a new one if it times out
              <br />• Make sure you&apos;re entering the code in the ForjeGames plugin dialog, not the command bar
              <br /><br />
              <strong style={{ color: 'rgba(255,255,255,0.45)' }}>Plugin folder location:</strong>
              <br />• Windows: <span style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)' }}>%LOCALAPPDATA%\Roblox\Plugins</span>
              <br />• Mac: <span style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)' }}>~/Documents/Roblox/Plugins</span>
              <br />• Or in Studio: Plugins tab → Plugins Folder button opens it directly
            </div>
          </details>

          {/* Skip option — removed, now shown at top */}
          <div style={{ paddingBottom: 4, display: 'none' }}>
            <button
              onClick={onConfirmConnected}
              style={{ display: 'none' }}
            >
              Skip for now — chat without Studio
            </button>
          </div>
        </div>

        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes monitorBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
          @keyframes checkPop {
            0%   { transform: scale(0) rotate(-10deg); opacity: 0; }
            60%  { transform: scale(1.2) rotate(4deg); opacity: 1; }
            100% { transform: scale(1) rotate(0deg); opacity: 1; }
          }
        `}</style>

        {/* 3D preview behind */}
        {previewParts.length > 0 && (
          <div style={{ position: 'absolute', inset: 0, borderRadius: 12, overflow: 'hidden', opacity: 0.15, pointerEvents: 'none', zIndex: 0 }}>
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

// ─── Layout Types ─────────────────────────────────────────────────────────────

type EditorLayout = 'default' | 'chat-focus' | 'split' | 'minimal' | 'cinematic'

const LAYOUT_LABELS: Record<EditorLayout, string> = {
  default: 'Default',
  'chat-focus': 'Chat Focus',
  split: 'Split',
  minimal: 'Minimal',
  cinematic: 'Cinematic',
}

// ─── Layout Switcher ──────────────────────────────────────────────────────────

function LayoutSwitcher({
  layout,
  onChange,
}: {
  layout: EditorLayout
  onChange: (l: EditorLayout) => void
}) {
  const layouts: { id: EditorLayout; icon: React.ReactNode }[] = [
    {
      id: 'default',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="1" y="1" width="11" height="7" rx="1" fill="currentColor" opacity={0.5}/>
          <rect x="1" y="10" width="11" height="5" rx="1" fill="currentColor" opacity={0.35}/>
          <rect x="13" y="1" width="2" height="14" rx="1" fill="currentColor" opacity={0.25}/>
        </svg>
      ),
    },
    {
      id: 'chat-focus',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="1" y="1" width="9" height="14" rx="1" fill="currentColor" opacity={0.5}/>
          <rect x="11" y="1" width="4" height="6" rx="1" fill="currentColor" opacity={0.3}/>
          <rect x="11" y="9" width="4" height="6" rx="1" fill="currentColor" opacity={0.15}/>
        </svg>
      ),
    },
    {
      id: 'split',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="1" y="1" width="6" height="14" rx="1" fill="currentColor" opacity={0.5}/>
          <rect x="9" y="1" width="6" height="14" rx="1" fill="currentColor" opacity={0.35}/>
        </svg>
      ),
    },
    {
      id: 'minimal',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="1" y="1" width="14" height="14" rx="1" fill="currentColor" opacity={0.5}/>
        </svg>
      ),
    },
    {
      id: 'cinematic',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="1" y="1" width="14" height="14" rx="1" fill="currentColor" opacity={0.4}/>
          <rect x="9" y="9" width="5" height="5" rx="1" fill="currentColor" opacity={0.85}/>
        </svg>
      ),
    },
  ]

  return (
    <div
      role="toolbar"
      aria-label="Layout switcher"
      style={{ display: 'flex', alignItems: 'center', gap: 2 }}
    >
      {layouts.map(({ id, icon }) => {
        const active = layout === id
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            aria-label={`Switch to ${LAYOUT_LABELS[id]} layout`}
            aria-pressed={active}
            title={LAYOUT_LABELS[id]}
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              border: active
                ? '1px solid rgba(212,175,55,0.3)'
                : '1px solid rgba(255,255,255,0.06)',
              background: active
                ? 'rgba(212,175,55,0.12)'
                : 'rgba(255,255,255,0.05)',
              color: active ? '#D4AF37' : 'rgba(255,255,255,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease-out',
              flexShrink: 0,
            }}
          >
            {icon}
          </button>
        )
      })}
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
  editorLayout,
  onLayoutChange,
  latencyMs,
  sseReconnectPhase,
  isMobile = false,
  onMobileMenuOpen,
}: {
  isConnected: boolean
  placeName: string
  totalTokens: number
  onNewChat?: () => void
  onConnect?: () => void
  onShowShortcuts?: () => void
  editorLayout: EditorLayout
  onLayoutChange: (l: EditorLayout) => void
  latencyMs?: number | null
  sseReconnectPhase?: import('./hooks/useStudioSSE').SSEReconnectPhase
  isMobile?: boolean
  onMobileMenuOpen?: () => void
}) {
  const { user } = useUser()
  const [newChatHovered, setNewChatHovered] = useState(false)
  const [guestTokensUsed, setGuestTokensUsed] = useState(0)

  // Read guest token usage from localStorage; re-sync whenever a new message arrives
  // (totalTokens increments after each AI response, so it acts as a dependency proxy)
  useEffect(() => {
    if (!user) {
      const stored = Number(localStorage.getItem('fg_guest_tokens') ?? '0')
      setGuestTokensUsed(stored)
    }
  }, [user, totalTokens])

  if (isMobile) {
    return (
      <div
        style={{
          flexShrink: 0,
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          background: 'rgba(8,12,28,0.85)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          zIndex: 20,
          backdropFilter: 'blur(12px)',
          position: 'relative',
        }}
      >
        {/* Gradient glow bottom border */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.04) 25%, rgba(212,175,55,0.06) 50%, rgba(212,175,55,0.04) 75%, transparent 100%)',
          pointerEvents: 'none', zIndex: 1 }} />

        {/* Left: Just the logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #D4AF37 0%, #D4AF37 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 12 12" fill="#030712">
              <path d="M6 1L7.5 4.5H11L8 6.5l1 3.5L6 8l-3 2 1-3.5-3-2h3.5L6 1z"/>
            </svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em' }}>
            <span style={{ color: '#D4AF37' }}>Forje</span>
            <span style={{ color: 'white' }}>Games</span>
          </span>
        </Link>

        {/* Right: connection dot + menu button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isConnected && (
            <div title={placeName || 'Connected'} style={{
              width: 8, height: 8, borderRadius: '50%', background: '#4ADE80',
              boxShadow: '0 0 6px rgba(74,222,128,0.6)', flexShrink: 0,
            }} />
          )}
          {onNewChat && (
            <button
              onClick={onNewChat}
              aria-label="New chat"
              style={{
                width: 44, height: 44, minWidth: 44, minHeight: 44,
                borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)',
                background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 12 12" fill="none">
                <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </button>
          )}
          <button
            onClick={onMobileMenuOpen}
            aria-label="Open menu"
            style={{
              width: 44, height: 44, minWidth: 44, minHeight: 44,
              borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.75)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M3 5h12M3 9h12M3 13h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>
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
        background: 'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.04) 25%, rgba(212,175,55,0.06) 50%, rgba(212,175,55,0.04) 75%, transparent 100%)',
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
            background: 'linear-gradient(135deg, #D4AF37 0%, #D4AF37 100%)',
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
          <span style={{ color: '#D4AF37' }}>Forje</span>
          <span style={{ color: 'white' }}>Games</span>
        </span>
        </Link>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, opacity: 0.2 }}>
          <path d="M4 2l4 4-4 4" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>Editor</span>
      </div>

      {/* Center: Layout switcher + connection pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <LayoutSwitcher layout={editorLayout} onChange={onLayoutChange} />
        {/*
          Not-connected indicator — click to open the connect-studio flow.
          This is the "manual mode" signal: the user is told up-front that
          builds will fall back to copy/paste + .rbxmx until a plugin
          session exists. Studio building is ForjeGames' core feature and
          we never silently hide that state.
        */}
        {!isConnected && onConnect && (
          <button
            type="button"
            onClick={onConnect}
            title="Click to connect Roblox Studio — until then, builds show as copy/paste"
            style={{
              padding: '3px 10px',
              borderRadius: 6,
              background: 'rgba(250,204,21,0.06)',
              border: '1px solid rgba(250,204,21,0.22)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <div style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: '#FACC15',
              boxShadow: '0 0 4px rgba(250,204,21,0.55)',
              flexShrink: 0,
            }} />
            <span style={{ fontSize: 11, color: 'rgba(250,204,21,0.85)', fontWeight: 500 }}>
              No Studio — manual mode
            </span>
          </button>
        )}
        {isConnected && placeName && (() => {
          const isReconnecting = sseReconnectPhase === 'reconnecting' || sseReconnectPhase === 'lost'
          const isFailed = sseReconnectPhase === 'failed'
          const isHighLatency = typeof latencyMs === 'number' && latencyMs > 100
          const dotColor = isFailed || isReconnecting ? '#f59e0b' : isHighLatency ? '#facc15' : '#4ADE80'
          const pillBg = isFailed || isReconnecting ? 'rgba(245,158,11,0.06)' : 'rgba(74,222,128,0.06)'
          const pillBorder = isFailed || isReconnecting ? '1px solid rgba(245,158,11,0.2)' : '1px solid rgba(74,222,128,0.15)'
          const textColor = isFailed || isReconnecting ? 'rgba(245,158,11,0.85)' : 'rgba(74,222,128,0.8)'
          return (
            <div style={{ padding: '3px 10px', borderRadius: 6, background: pillBg,
              border: pillBorder, display: 'flex', alignItems: 'center', gap: 6 }}
              title={latencyMs != null ? `${latencyMs}ms latency` : undefined}>
              <div style={{ position: 'relative', width: 5, height: 5, flexShrink: 0 }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: dotColor,
                  animation: 'connectedPing 2s ease-in-out infinite' }} />
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: dotColor,
                  boxShadow: `0 0 4px ${dotColor}80` }} />
              </div>
              <span style={{ fontSize: 11, color: textColor, fontWeight: 500 }}>
                {isReconnecting ? 'Reconnecting…' : isFailed ? 'Connection lost' : placeName}
              </span>
              {latencyMs != null && !isReconnecting && !isFailed && (
                <span style={{ fontSize: 10, color: isHighLatency ? 'rgba(250,204,21,0.6)' : 'rgba(74,222,128,0.45)',
                  fontFamily: "'JetBrains Mono', monospace" }}>
                  {latencyMs}ms
                </span>
              )}
            </div>
          )
        })()}
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
        {!user && guestTokensUsed > 0 && (
          <div title={`${guestTokensUsed}/100 free tokens used`} style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '3px 9px',
            borderRadius: 20, background: 'rgba(212,175,55,0.10)', border: '1px solid rgba(212,175,55,0.28)',
          }}>
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
              <circle cx="5" cy="5" r="4" stroke="#D4AF37" strokeWidth="1.2"/>
              <path d="M3.5 5h3M5 3.5v3" stroke="#D4AF37" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: 10, color: '#D4AF37', fontVariantNumeric: 'tabular-nums',
              fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
              {Math.max(0, 100 - guestTokensUsed)}/100 free
            </span>
          </div>
        )}
        {user && totalTokens > 0 && (
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

        {user && <EditorProfileDropdown user={user} />}
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
              background: 'linear-gradient(90deg, #D4AF37, #D4AF37, #D4AF37)',
              boxShadow: '0 0 6px rgba(212,175,55,0.4)' }} />
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
          background: dragging ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.03)',
          transition: dragging ? 'none' : 'background 0.15s',
        }}
      />
    </div>
  )
}

// ─── Build History (localStorage) ────────────────────────────────────────────

const LS_BUILD_HISTORY_KEY = 'fg_build_history_v1'
const MAX_BUILD_HISTORY = 50

export interface BuildHistoryEntry {
  id: string
  timestamp: number
  prompt: string
  code: string
  model: string
  success: boolean
}

function loadBuildHistory(): BuildHistoryEntry[] {
  try {
    const raw = localStorage.getItem(LS_BUILD_HISTORY_KEY)
    if (!raw) return []
    return JSON.parse(raw) as BuildHistoryEntry[]
  } catch {
    return []
  }
}

function saveBuildHistory(entries: BuildHistoryEntry[]): void {
  try {
    localStorage.setItem(LS_BUILD_HISTORY_KEY, JSON.stringify(entries))
  } catch { /* ignore quota errors */ }
}

function useBuildHistory() {
  const [entries, setEntries] = useState<BuildHistoryEntry[]>(() => {
    if (typeof window === 'undefined') return []
    return loadBuildHistory()
  })

  const addEntry = useCallback((entry: Omit<BuildHistoryEntry, 'id'>) => {
    setEntries((prev) => {
      const next: BuildHistoryEntry[] = [
        { ...entry, id: Math.random().toString(36).slice(2, 9) },
        ...prev,
      ].slice(0, MAX_BUILD_HISTORY)
      saveBuildHistory(next)
      return next
    })
  }, [])

  const clearAll = useCallback(() => {
    setEntries([])
    try { localStorage.removeItem(LS_BUILD_HISTORY_KEY) } catch { /* ignore */ }
  }, [])

  return { entries, addEntry, clearAll }
}

// ─── Build History Panel (sidebar) ───────────────────────────────────────────

function BuildHistorySidebarPanel({
  entries,
  onRerun,
  onClear,
}: {
  entries: BuildHistoryEntry[]
  onRerun: (entry: BuildHistoryEntry) => void
  onClear: () => void
}) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  function handleCopy(entry: BuildHistoryEntry) {
    navigator.clipboard.writeText(entry.code).then(() => {
      setCopied(entry.id)
      setTimeout(() => setCopied(null), 1800)
    }).catch(() => { /* ignore */ })
  }

  if (entries.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '48px 16px', gap: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.35 }}>
          <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M7 9h10M7 12h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          <circle cx="17" cy="16" r="3" fill="rgba(0,0,0,0)" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M17 14.8v1.5l1 0.8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5 }}>Your builds will appear here.</p>
        <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.12)' }}>Start chatting to generate Luau code.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Header count + clear */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 0 12px', marginBottom: 2 }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>
          {entries.length} build{entries.length !== 1 ? 's' : ''} saved
        </span>
        <button
          onClick={onClear}
          style={{ background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 10, color: 'rgba(239,68,68,0.5)', padding: '2px 4px',
            borderRadius: 4, transition: 'color 0.15s' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(239,68,68,0.8)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(239,68,68,0.5)' }}
        >
          Clear all
        </button>
      </div>

      {entries.map((entry, i) => {
        const isOpen = expanded === entry.id
        const codePreview = entry.code.split('\n').slice(0, 2).join('\n')
        const timeStr = (() => {
          const diff = Date.now() - entry.timestamp
          if (diff < 60_000) return 'just now'
          if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
          if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
          return new Date(entry.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        })()

        return (
          <div
            key={entry.id}
            style={{
              borderRadius: 10,
              border: isOpen
                ? '1px solid rgba(212,175,55,0.25)'
                : '1px solid rgba(255,255,255,0.05)',
              background: isOpen ? 'rgba(212,175,55,0.04)' : 'rgba(255,255,255,0.02)',
              marginBottom: 6,
              overflow: 'hidden',
              transition: 'border-color 0.15s, background 0.15s',
            }}
          >
            {/* Row header */}
            <button
              onClick={() => setExpanded(isOpen ? null : entry.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '10px 12px', background: 'none', border: 'none', cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {/* Index bubble */}
              <div style={{
                flexShrink: 0, width: 20, height: 20, borderRadius: '50%',
                background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
              }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: '#D4AF37' }}>
                  {entries.length - i}
                </span>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.75)',
                  fontWeight: 500, lineHeight: 1.4,
                  overflow: 'hidden', textOverflow: 'ellipsis',
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>
                  {entry.prompt.replace(/^\[AUTO-RETRY attempt \d+\/\d+\]\s*/, '').replace(/^\[FORJE_STEP:\d+\/\d+\]\s*/, '')}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{timeStr}</span>
                  <span style={{
                    fontSize: 9, padding: '1px 5px', borderRadius: 4,
                    background: entry.success ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    color: entry.success ? 'rgba(16,185,129,0.8)' : 'rgba(239,68,68,0.7)',
                    border: `1px solid ${entry.success ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                  }}>
                    {entry.success ? 'Sent' : 'Draft'}
                  </span>
                  {entry.model && (
                    <span style={{
                      fontSize: 9, padding: '1px 5px', borderRadius: 4,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      color: 'rgba(255,255,255,0.25)',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {entry.model}
                    </span>
                  )}
                </div>
              </div>

              {/* Chevron */}
              <svg
                width="12" height="12" viewBox="0 0 12 12" fill="none"
                style={{
                  flexShrink: 0, marginTop: 4,
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                  color: 'rgba(255,255,255,0.2)',
                }}
              >
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Expanded: code preview + actions */}
            {isOpen && (
              <div style={{ padding: '0 12px 12px' }}>
                {/* Code preview */}
                <div style={{
                  borderRadius: 8, background: 'rgba(0,0,0,0.35)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  padding: '10px 12px', marginBottom: 10, overflow: 'hidden',
                }}>
                  <pre style={{
                    margin: 0, fontSize: 10.5,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    color: 'rgba(255,255,255,0.55)', lineHeight: 1.6,
                    whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                    maxHeight: 120, overflow: 'hidden',
                  }}>
                    {codePreview}
                    {entry.code.split('\n').length > 2 && (
                      <span style={{ color: 'rgba(212,175,55,0.4)' }}>
                        {'\n'}…{entry.code.split('\n').length - 2} more lines
                      </span>
                    )}
                  </pre>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => onRerun(entry)}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                      padding: '6px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                      background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
                      color: '#10B981', transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(16,185,129,0.18)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(16,185,129,0.1)' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6a4 4 0 014-4 4 4 0 014 4M10 2l2 2-2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Re-run
                  </button>
                  <button
                    onClick={() => handleCopy(entry)}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                      padding: '6px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                      background: copied === entry.id ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)',
                      border: copied === entry.id ? '1px solid rgba(212,175,55,0.35)' : '1px solid rgba(255,255,255,0.08)',
                      color: copied === entry.id ? '#D4AF37' : 'rgba(255,255,255,0.5)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {copied === entry.id ? (
                      <>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Copied
                      </>
                    ) : (
                      <>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <rect x="4" y="4" width="6" height="7" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                          <path d="M2 8V2h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
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

// ─── Quick Theme Picker (sidebar settings panel) ─────────────────────────────

function SettingsSidebarPanel() {
  const { theme, setTheme } = useTheme()

  return (
    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
      <p style={{ margin: '0 0 16px' }}>Editor preferences and API keys.</p>

      {/* Quick Theme */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)' }}>Quick Theme</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              title={t.name}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: t.preview.accent,
                border: theme.id === t.id
                  ? `2px solid ${t.preview.accent}`
                  : '2px solid rgba(255,255,255,0.08)',
                outline: theme.id === t.id ? `2px solid rgba(255,255,255,0.4)` : 'none',
                outlineOffset: 2,
                cursor: 'pointer',
                position: 'relative',
                flexShrink: 0,
                transition: 'transform 0.15s',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.15)')}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)')}
              aria-label={t.name}
              aria-pressed={theme.id === t.id}
            >
              {theme.id === t.id && (
                <svg
                  width="12" height="12" viewBox="0 0 12 12" fill="none"
                  style={{ position: 'absolute', inset: 0, margin: 'auto' }}
                >
                  <path d="M2.5 6l2.5 2.5 4.5-5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          ))}
        </div>
        <p style={{ margin: '8px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
          {THEMES.find(t => t.id === theme.id)?.name ?? 'Custom'}
        </p>
      </div>

      <div style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)', fontSize: 12 }}>
        <Link href="/settings" style={{ color: 'var(--gold, #D4AF37)', textDecoration: 'none', fontWeight: 500 }}>
          Open full settings
        </Link>
      </div>
    </div>
  )
}

// ─── Chat History Panel ───────────────────────────────────────────────────────

interface ChatHistoryPanelProps {
  currentSessionId: string
  listSessions: () => ChatSessionMeta[]
  onLoadSession: (id: string) => void
  onDeleteSession: (id: string) => void
  onClearAll: () => void
  onNewChat: () => void
}

// Keyframe injection for slide-out and pulse animations (injected once)
const HISTORY_ANIM_ID = 'chat-history-animations'
if (typeof document !== 'undefined' && !document.getElementById(HISTORY_ANIM_ID)) {
  const style = document.createElement('style')
  style.id = HISTORY_ANIM_ID
  style.textContent = `
    @keyframes slideOutLeft {
      from { transform: translateX(0); opacity: 1; max-height: 80px; margin-bottom: 0; }
      to   { transform: translateX(-110%); opacity: 0; max-height: 0; margin-bottom: -4px; }
    }
    .chat-session-item { animation: none; overflow: hidden; }
    .chat-session-item.deleting {
      animation: slideOutLeft 0.2s cubic-bezier(0.4,0,0.2,1) forwards;
      pointer-events: none;
    }
  `
  document.head.appendChild(style)
}

function groupSessionsByDate(sessions: ChatSessionMeta[]): { label: string; items: ChatSessionMeta[] }[] {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const yesterdayStart = todayStart - 86400000
  const weekStart = todayStart - 6 * 86400000

  const groups: Record<string, ChatSessionMeta[]> = { Today: [], Yesterday: [], 'This Week': [], Older: [] }
  for (const s of sessions) {
    const t = new Date(s.updatedAt).getTime()
    if (t >= todayStart) groups['Today'].push(s)
    else if (t >= yesterdayStart) groups['Yesterday'].push(s)
    else if (t >= weekStart) groups['This Week'].push(s)
    else groups['Older'].push(s)
  }
  return (['Today', 'Yesterday', 'This Week', 'Older'] as const)
    .filter((k) => groups[k].length > 0)
    .map((k) => ({ label: k, items: groups[k] }))
}

function exportSessionToClipboard(id: string): void {
  const session = loadSessions().find((s) => s.id === id)
  if (!session) return
  const lines: string[] = [`# ${session.title}`, `Date: ${new Date(session.createdAt).toLocaleString()}`, '']
  for (const m of session.messages) {
    if (m.role === 'user') lines.push(`You: ${m.content}`, '')
    else if (m.role === 'assistant') lines.push(`AI: ${m.content}`, '')
  }
  void navigator.clipboard.writeText(lines.join('\n'))
}

function ChatHistoryPanel({ currentSessionId, listSessions, onLoadSession, onDeleteSession, onClearAll, onNewChat }: ChatHistoryPanelProps) {
  const [sessions, setSessions] = React.useState<ChatSessionMeta[]>(() => listSessions())
  const [hoveredId, setHoveredId] = React.useState<string | null>(null)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [search, setSearch] = React.useState('')
  const [confirmClearAll, setConfirmClearAll] = React.useState(false)
  const [copiedId, setCopiedId] = React.useState<string | null>(null)

  // Refresh list whenever panel renders (sessions may have changed)
  React.useEffect(() => {
    setSessions(listSessions())
  }, [listSessions])

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setDeletingId(id)
    // Wait for slide-out animation before actually removing
    setTimeout(() => {
      onDeleteSession(id)
      setSessions(listSessions())
      setDeletingId(null)
    }, 200)
  }

  const handleClearAll = () => {
    if (!confirmClearAll) { setConfirmClearAll(true); return }
    onClearAll()
    setSessions([])
    setConfirmClearAll(false)
  }

  const handleExport = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    exportSessionToClipboard(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const filtered = search.trim()
    ? sessions.filter((s) => s.title.toLowerCase().includes(search.toLowerCase()))
    : sessions

  const groups = groupSessionsByDate(filtered)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* New Chat button */}
      <button
        onClick={onNewChat}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 10px', borderRadius: 8, marginBottom: 4,
          background: 'rgba(212,175,55,0.10)', border: '1px solid rgba(212,175,55,0.25)',
          color: '#D4AF37', fontSize: 12, fontWeight: 600,
          fontFamily: 'Inter, sans-serif', cursor: 'pointer', width: '100%',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(212,175,55,0.18)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(212,175,55,0.10)' }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 1v10M1 6h10" stroke="#D4AF37" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
        New Chat
      </button>

      {/* Search input */}
      {sessions.length > 0 && (
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <svg
            width="11" height="11" viewBox="0 0 11 11" fill="none"
            style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          >
            <circle cx="4.5" cy="4.5" r="3.5" stroke="rgba(255,255,255,0.25)" strokeWidth="1.3"/>
            <path d="M7.5 7.5l2 2" stroke="rgba(255,255,255,0.25)" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search chats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '6px 10px 6px 26px', borderRadius: 7,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.75)', fontSize: 11, fontFamily: 'Inter, sans-serif',
              outline: 'none', transition: 'border-color 0.15s',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.35)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
                fontSize: 11, cursor: 'pointer', padding: 0, lineHeight: 1,
              }}
            >✕</button>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, margin: 0, padding: '4px 2px' }}>
          {search ? 'No chats match your search.' : 'No saved chats yet. Start a conversation to see history here.'}
        </p>
      ) : (
        groups.map(({ label, items }) => (
          <div key={label}>
            {/* Date group label */}
            <div style={{
              fontSize: 10, fontWeight: 600, fontFamily: 'Inter, sans-serif',
              color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.07em',
              padding: '6px 2px 4px',
            }}>
              {label}
            </div>

            {items.map((s) => {
              const isActive = s.id === currentSessionId
              const isHovered = hoveredId === s.id
              const isDeleting = deletingId === s.id
              const isCopied = copiedId === s.id

              return (
                <div
                  key={s.id}
                  className={`chat-session-item${isDeleting ? ' deleting' : ''}`}
                  onClick={() => !isDeleting && onLoadSession(s.id)}
                  onMouseEnter={() => setHoveredId(s.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    position: 'relative', display: 'flex', flexDirection: 'column', gap: 2,
                    padding: '8px 10px', borderRadius: 8, cursor: 'pointer', marginBottom: 2,
                    background: isActive
                      ? 'rgba(212,175,55,0.12)'
                      : isHovered ? 'rgba(255,255,255,0.04)' : 'transparent',
                    border: isActive
                      ? '1px solid rgba(212,175,55,0.28)'
                      : '1px solid transparent',
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                >
                  {/* Title row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                    <span style={{
                      fontSize: 12, fontWeight: 500, fontFamily: 'Inter, sans-serif',
                      color: isActive ? '#D4AF37' : 'rgba(255,255,255,0.75)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      flex: 1, minWidth: 0,
                    }}>
                      {s.title}
                    </span>

                    {/* Action buttons — only on hover */}
                    {isHovered && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                        {/* Export / copy button */}
                        <button
                          onClick={(e) => handleExport(e, s.id)}
                          title="Copy chat to clipboard"
                          style={{
                            width: 18, height: 18, borderRadius: 4, padding: 0,
                            background: isCopied ? 'rgba(100,200,100,0.15)' : 'rgba(255,255,255,0.07)',
                            border: `1px solid ${isCopied ? 'rgba(100,200,100,0.3)' : 'rgba(255,255,255,0.12)'}`,
                            color: isCopied ? 'rgba(100,220,100,0.9)' : 'rgba(255,255,255,0.45)',
                            fontSize: 9, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
                            transition: 'background 0.15s, border-color 0.15s, color 0.15s',
                          }}
                        >
                          {isCopied ? '✓' : (
                            <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                              <rect x="2.5" y="0.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1"/>
                              <path d="M0.5 2.5v6h6" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                            </svg>
                          )}
                        </button>
                        {/* Delete button */}
                        <button
                          onClick={(e) => handleDelete(e, s.id)}
                          title="Delete chat"
                          style={{
                            width: 18, height: 18, borderRadius: 4, padding: 0,
                            background: 'rgba(255,80,80,0.12)', border: '1px solid rgba(255,80,80,0.2)',
                            color: 'rgba(255,100,100,0.8)', fontSize: 10, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,80,80,0.25)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,80,80,0.12)' }}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>

                  {/* AI preview */}
                  {s.firstAiPreview && (
                    <span style={{
                      fontSize: 10, fontFamily: 'Inter, sans-serif',
                      color: 'rgba(255,255,255,0.28)', lineHeight: 1.4,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {s.firstAiPreview}
                    </span>
                  )}

                  {/* Meta row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', fontFamily: 'Inter, sans-serif' }}>
                      {s.messageCount} {s.messageCount === 1 ? 'msg' : 'msgs'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ))
      )}

      {/* Clear All button */}
      {sessions.length > 0 && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={handleClearAll}
            onBlur={() => setConfirmClearAll(false)}
            style={{
              width: '100%', padding: '7px 10px', borderRadius: 7,
              background: confirmClearAll ? 'rgba(255,60,60,0.15)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${confirmClearAll ? 'rgba(255,60,60,0.35)' : 'rgba(255,255,255,0.07)'}`,
              color: confirmClearAll ? 'rgba(255,100,100,0.9)' : 'rgba(255,255,255,0.3)',
              fontSize: 11, fontFamily: 'Inter, sans-serif', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!confirmClearAll) e.currentTarget.style.background = 'rgba(255,80,80,0.08)'
            }}
            onMouseLeave={(e) => {
              if (!confirmClearAll) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
            }}
          >
            {confirmClearAll ? 'Click again to confirm — this cannot be undone' : 'Clear All History'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function NewEditorClient() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <EditorInner />
      </ToastProvider>
    </ThemeProvider>
  )
}

function EditorInner() {
  const isMobile = useIsMobile()
  const { isSignedIn, isLoaded: authLoaded } = useUser()
  // BUG 3: Show a one-time signup prompt to guest users after their first
  // successful message lands. Flag is persisted in localStorage so we never
  // annoy them twice.
  const [showGuestSignupPrompt, setShowGuestSignupPrompt] = useState(false)
  const guestPromptHandledRef = useRef(false)
  const [mobileTab, setMobileTab] = useState<'chat' | 'studio'>('chat')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [viewportExpanded, setViewportExpanded] = useState(false)
  const [sidebarPanel, setSidebarPanel] = useState<string | null>(null)
  // Project save/load state
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [activeProjectName, setActiveProjectName] = useState('Untitled Project')
  const [pendingNewChat, setPendingNewChat] = useState(false)
  const [chatHeight, setChatHeight] = useState<number>(() => {
    if (typeof window === 'undefined') return CHAT_DEFAULT_HEIGHT
    return loadChatHeight()
  })
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [cinematicChatCollapsed, setCinematicChatCollapsed] = useState(false)
  const [showMinimalPreview, setShowMinimalPreview] = useState(false)
  // First-run: persisted skip so it doesn't re-appear after the user dismisses it
  const [firstRunSkipped, setFirstRunSkipped] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('fg_first_run_skipped') === 'true'
  })
  // studioWizardOpen — true only when user explicitly clicks "Connect Studio" in top bar.
  // On first visit (no hasConnectedBefore flag) the wizard is never auto-shown.
  const [studioWizardOpen, setStudioWizardOpen] = useState(false)
  const chatPanelRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Build history — persisted to localStorage
  const buildHistory = useBuildHistory()

  // Layout state — persisted to localStorage
  const [editorLayout, setEditorLayout] = useState<EditorLayout>(() => {
    if (typeof window === 'undefined') return 'minimal'
    // Force minimal as default — clean UI. Users can switch via layout buttons.
    const saved = localStorage.getItem('fg_editor_layout') as EditorLayout | null
    if (saved === 'default') {
      localStorage.setItem('fg_editor_layout', 'minimal')
      return 'minimal'
    }
    return saved || 'minimal'
  })

  useEffect(() => {
    try { localStorage.setItem('fg_editor_layout', editorLayout) } catch { /* ignore */ }
  }, [editorLayout])

  // On mobile, override the editor layout so the chat takes the full screen.
  // The user's desktop layout preference is preserved in localStorage; this
  // override is purely presentational while the viewport is mobile-sized.
  const effectiveLayout: EditorLayout = isMobile ? 'chat-focus' : editorLayout

  // On mobile we always show the chat tab — there is no side viewport
  // rendered in chat-focus mode, so the mobile tab switcher is not needed.
  useEffect(() => {
    if (isMobile && mobileTab !== 'chat') setMobileTab('chat')
  }, [isMobile, mobileTab])

  // Close the mobile menu bottom-sheet whenever the viewport becomes desktop,
  // and close any open sidebar panel to avoid orphaned state.
  useEffect(() => {
    if (!isMobile) {
      setMobileMenuOpen(false)
    }
  }, [isMobile])

  // Studio connection
  const studio = useStudioConnection((phase) => {
    if (phase === 'lost') toast('Connection lost. Reconnecting…', 'warning')
    else if (phase === 'reconnecting') toast('Reconnecting to Studio…', 'warning')
    else if (phase === 'connected') toast('Reconnected!', 'success')
    else if (phase === 'failed') toast('Connection lost. Reload the page to reconnect.', 'error')
  })

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

  // One-time "What's New" announcement for the ForjeGames 2.0 release.
  // Shown once per user, gated by a localStorage flag so returning users
  // never see it again after dismissal.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const FLAG = 'forje_seen_whats_new_2026_04'
    try {
      if (localStorage.getItem(FLAG) === 'true') return
    } catch {
      return
    }
    // Delay slightly so the toast does not collide with editor hydration.
    const t = setTimeout(() => {
      toast('✨ 28 new features available! See them at /whats-new', 'info', 8000)
      try { localStorage.setItem(FLAG, 'true') } catch { /* ignore quota */ }
    }, 1500)
    return () => clearTimeout(t)
  }, [toast])

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
        buildHistory.addEntry({
          timestamp: Date.now(),
          prompt,
          code: luauCode,
          model: 'studio',
          success: true,
        })
        // Fire-and-forget: trigger email + push via the server endpoint
        // (BUG 2 — notifyBuildComplete was previously dead code). We
        // deliberately do NOT await so a slow Resend / VAPID call can't
        // stall the UI, and we swallow any error so users with
        // notifications disabled see no console noise.
        try {
          fetch('/api/notifications/build-complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              buildId: sessionId ?? `build-${Date.now()}`,
              summary: {
                buildName: prompt.slice(0, 60) || 'Untitled Build',
                buildType: 'build',
                success: true,
              },
            }),
          }).catch(() => { /* best-effort — ignore */ })
        } catch { /* best-effort — ignore */ }
      } catch {
        studio.addActivity('Studio execution failed — check your connection.')
        toast('Studio execution failed', 'error')
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [studio, toast, buildHistory.addEntry],
  )

  // Chat
  const chat = useChat({
    onBuildComplete: handleBuildComplete,
    studioSessionId: studio.sessionId,
    studioConnected: studio.isConnected,
    studioContext: studio.studioContext,
  })

  // BUG 3: Detect the first completed exchange for a guest user and show
  // the signup prompt. Fires after a user message has received an assistant
  // response AND the user is definitely not signed in. Uses a one-time flag
  // in localStorage so each guest only sees it once per browser.
  useEffect(() => {
    if (!authLoaded || isSignedIn || guestPromptHandledRef.current) return
    if (typeof window === 'undefined') return
    try {
      if (localStorage.getItem('forje_guest_signup_prompted') === '1') {
        guestPromptHandledRef.current = true
        return
      }
    } catch { /* ignore */ }

    const msgs = chat.messages
    const hasUser = msgs.some((m) => m.role === 'user')
    const hasAssistant = msgs.some((m) => m.role === 'assistant' && !m.streaming)
    if (hasUser && hasAssistant && !chat.loading && !chat.streaming) {
      guestPromptHandledRef.current = true
      // Defer so the user actually sees the response land first
      const t = setTimeout(() => setShowGuestSignupPrompt(true), 900)
      return () => clearTimeout(t)
    }
  }, [authLoaded, isSignedIn, chat.messages, chat.loading, chat.streaming])

  const dismissGuestSignupPrompt = useCallback(() => {
    setShowGuestSignupPrompt(false)
    try { localStorage.setItem('forje_guest_signup_prompted', '1') } catch { /* ignore */ }
  }, [])

  // Onboarding overlay — page-aware: skips steps that don't apply to current state.
  // Suppressed entirely if the user already has chat history or has dismissed before.
  const onboardingHasMessages = chat.messages.length > 0
  const { shouldShow: showOnboarding, dismiss: dismissOnboarding } = useOnboardingOverlay({
    hasMessages: onboardingHasMessages,
  })
  const onboardingHasUsedSlash = useMemo(
    () => chat.messages.some(
      (m) => m.role === 'user' && typeof m.content === 'string' && m.content.trim().startsWith('/'),
    ),
    [chat.messages],
  )
  const [onboardingHasUsedVoice, setOnboardingHasUsedVoice] = useState(false)
  useEffect(() => {
    setOnboardingHasUsedVoice(hasUsedVoiceInput())
  }, [])

  // Auto-playtest hook — runs autonomous test loop after AI generates code
  const [autoPlaytestEnabled, setAutoPlaytestEnabled] = useState(true)
  const [autoEnhanceEnabled, setAutoEnhanceEnabled] = useState(true)
  const playtest = useAutoPlaytest({
    studioSessionId: studio.sessionId ?? undefined,
    enabled: autoPlaytestEnabled && studio.isConnected,
    onCodeFixed: (fixedCode) => {
      // Replace last assistant message with the fixed code
      chat.editAndResend?.(chat.messages[chat.messages.length - 1]?.id || '', fixedCode)
    },
  })

  // Shared AI mode props for all ChatPanel instances
  const aiModeProps = {
    aiMode: chat.aiMode,
    onAIModeChange: chat.setAIMode,
    isThinking: chat.isThinking,
    thinkingText: chat.thinkingText,
    planText: chat.planText,
    onApprovePlan: chat.approvePlan,
    onEditPlan: chat.editPlan,
    onCancelPlan: chat.cancelPlan,
    sessionId: chat.currentSessionId,
    onRestoreCheckpoint: chat.restoreToMessageIndex,
    checkpoints: chat.checkpoints,
    onSaveCheckpoint: chat.saveCheckpoint,
    onRestoreToCheckpoint: chat.restoreToCheckpoint,
    onDeleteCheckpoint: chat.removeCheckpoint,
    // Auto-playtest
    autoPlaytestEnabled,
    onAutoPlaytestToggle: setAutoPlaytestEnabled,
    playtestState: playtest,
    onCancelPlaytest: playtest.cancelPlaytest,
    // Auto-enhance
    autoEnhanceEnabled,
    onAutoEnhanceToggle: setAutoEnhanceEnabled,
    // Image mode options (BUG 9)
    imageOptions: chat.imageOptions,
    onImageOptionsChange: chat.setImageOptions,
    // BUG 2: Build direction picker
    buildDirection: chat.buildDirection,
    onBuildDirectionChange: chat.setBuildDirection,
  } as const

  // Auto-send ?prompt= / ?voice= / ?imageprompt= params — fires once on first mount only
  const autoPromptFiredRef = useRef(false)
  useEffect(() => {
    if (autoPromptFiredRef.current) return
    try {
      const params = new URLSearchParams(window.location.search)
      // Priority: imageprompt > voice > prompt
      const initialPrompt =
        params.get('imageprompt') ?? params.get('voice') ?? params.get('prompt')

      if (initialPrompt && initialPrompt.trim().length > 0) {
        autoPromptFiredRef.current = true

        // Remember voice usage so the tutorial can skip the "try voice" step next time
        if (params.has('voice')) {
          markVoiceInputUsed()
        }

        // Image-to-Map: restore the image file from sessionStorage so it travels
        // with the prompt into the chat body for Gemini Vision
        if (params.has('imageprompt')) {
          try {
            const dataUrl = sessionStorage.getItem('fg_itm_image')
            const name = sessionStorage.getItem('fg_itm_name') ?? 'image.jpg'
            if (dataUrl) {
              // Convert data URL → File and store in chat state before sending
              fetch(dataUrl)
                .then((r) => r.blob())
                .then((blob) => {
                  const file = new File([blob], name, { type: blob.type || 'image/jpeg' })
                  chat.setImageFile(file)
                  sessionStorage.removeItem('fg_itm_image')
                  sessionStorage.removeItem('fg_itm_name')
                  sessionStorage.removeItem('fg_itm_prompt')
                })
                .catch(() => { /* proceed without image */ })
            }
          } catch { /* sessionStorage unavailable */ }
        }

        // Small delay so chat + imageFile state is settled before sending
        setTimeout(() => {
          const trimmedPrompt = initialPrompt.trim()

          // Game preset detection: if the prompt is > 500 chars AND Studio is
          // connected, it's a full-game blueprint from the onboarding genre
          // picker. Use the step-by-step builder for dramatically better
          // results — 5 focused Luau blocks instead of one giant one.
          const isGamePreset = trimmedPrompt.length > 500 && trimmedPrompt.includes('fj_generated')
          if (isGamePreset && studio.isConnected && studio.sessionId) {
            void chat.triggerStepByStepBuild(trimmedPrompt, studio.sessionId)
          } else {
            void chat.sendMessage(trimmedPrompt)
          }

          // Clean all known query params so refresh doesn't re-fire
          const url = new URL(window.location.href)
          url.searchParams.delete('prompt')
          url.searchParams.delete('voice')
          url.searchParams.delete('imageprompt')
          window.history.replaceState({}, '', url.toString())
        }, 500)
      }
    } catch {
      // ignore — URL parsing failures are non-fatal
    }
  // Only on mount — chat.sendMessage intentionally omitted
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load ?project=<id> from URL on first mount
  const autoProjectFiredRef = useRef(false)
  useEffect(() => {
    if (autoProjectFiredRef.current) return
    try {
      const params = new URLSearchParams(window.location.search)
      const projectId = params.get('project')
      if (projectId) {
        autoProjectFiredRef.current = true
        const data = loadProject(projectId)
        if (data) {
          setActiveProjectId(data.id)
          setActiveProjectName(data.name)
          // Hydrate messages via loadSession-style injection
          const rehydrated = data.messages.map((m) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })) as ChatMessage[]
          chat.injectMessages?.(rehydrated)
          // Clean URL
          const url = new URL(window.location.href)
          url.searchParams.delete('project')
          window.history.replaceState({}, '', url.toString())
        }
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Save current editor state as a named project
  const handleSaveProject = useCallback((name: string) => {
    const serializedMessages = chat.messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      tokensUsed: m.tokensUsed,
      timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : String(m.timestamp),
      model: m.model,
    }))
    const saved = saveProject(name, serializedMessages, [], activeProjectId ?? undefined)
    setActiveProjectId(saved.id)
    setActiveProjectName(saved.name)
    toast(`Project "${saved.name}" saved`, 'success')
  }, [chat.messages, activeProjectId, toast])

  // Load a project into the editor
  const handleLoadProject = useCallback((project: ProjectData) => {
    const hasUnsaved = chat.messages.filter((m) => m.role === 'user').length > 0
    if (hasUnsaved && project.id !== activeProjectId) {
      if (!window.confirm(`Load "${project.name}"? Your current unsaved work will be lost.`)) return
    }
    const rehydrated = project.messages.map((m) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    })) as ChatMessage[]
    chat.injectMessages?.(rehydrated)
    setActiveProjectId(project.id)
    setActiveProjectName(project.name)
    setSidebarPanel(null)
    toast(`Loaded "${project.name}"`, 'success')
  }, [chat, activeProjectId, toast])

  // New Chat — prompt to save if there is unsaved work
  const handleNewChat = useCallback(() => {
    const hasWork = chat.messages.filter((m) => m.role === 'user').length > 0
    if (hasWork && !activeProjectId) {
      setPendingNewChat(true)
      return
    }
    setActiveProjectId(null)
    setActiveProjectName('Untitled Project')
    chat.newChat()
  }, [chat, activeProjectId])

  // Save build history entry for every new AI message that contains Luau code.
  // Covers the case where Studio isn't connected (entry.success = false / "Draft").
  const lastKnownCodeMsgId = useRef<string | null>(null)
  useEffect(() => {
    const lastCodeMsg = [...chat.messages].reverse().find(
      (m) => m.role === 'assistant' && m.luauCode && m.luauCode.trim().length > 0,
    )
    if (!lastCodeMsg || lastCodeMsg.id === lastKnownCodeMsgId.current) return
    lastKnownCodeMsgId.current = lastCodeMsg.id
    // Find the user prompt that preceded this assistant message
    const msgIndex = chat.messages.findIndex((m) => m.id === lastCodeMsg.id)
    const userMsg = msgIndex > 0
      ? [...chat.messages].slice(0, msgIndex).reverse().find((m) => m.role === 'user')
      : undefined
    buildHistory.addEntry({
      timestamp: lastCodeMsg.timestamp instanceof Date
        ? lastCodeMsg.timestamp.getTime()
        : Date.now(),
      prompt: userMsg?.content ?? '',
      code: lastCodeMsg.luauCode!,
      model: lastCodeMsg.model ?? chat.selectedModel,
      success: false, // will be upgraded to true in handleBuildComplete on Studio send
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.messages])

  // Auto-skip Studio wizard on first visit (no prior connection).
  // Sets fg_first_run_skipped so the wizard never auto-shows again.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const hasConnectedBefore = localStorage.getItem('fg_has_connected_before') === 'true'
    if (!hasConnectedBefore && !studio.isConnected) {
      try { localStorage.setItem('fg_first_run_skipped', 'true') } catch { /* ignore */ }
      setFirstRunSkipped(true)
    }
  // Only run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-start the Studio connect flow for ANY signed-in user who isn't
  // already connected. Previously the connect code was only generated when
  // the user explicitly clicked "Connect Studio" in the top bar — most
  // first-time users never found that button, typed build prompts anyway,
  // and wondered why nothing appeared in Studio. Starting the flow on mount
  // means the top connect banner is populated from the moment they land in
  // the editor, so installing + pairing the plugin is the obvious next
  // action. Safe to call repeatedly — useStudioConnection's generateCode()
  // is idempotent when a code is already in-flight.
  useEffect(() => {
    if (!isSignedIn || !authLoaded) return
    if (studio.isConnected) return
    if (studio.connectFlow !== 'idle') return
    void studio.generateCode()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, authLoaded, studio.isConnected, studio.connectFlow])

  // Persistent "Studio not connected" banner — dismissible per session so
  // users who are working without a plugin (e.g., browsing the chat UI
  // before installing) don't get nagged, but it comes back on next visit.
  const [studioBannerDismissed, setStudioBannerDismissed] = useState(false)

  // When Studio actually connects, record that the user has connected before
  useEffect(() => {
    if (studio.isConnected) {
      try { localStorage.setItem('fg_has_connected_before', 'true') } catch { /* ignore */ }
      setStudioWizardOpen(false)
    }
  }, [studio.isConnected])

  // First-run skip handler — persists to localStorage
  const handleSkipFirstRun = useCallback(() => {
    try { localStorage.setItem('fg_first_run_skipped', 'true') } catch { /* ignore */ }
    setFirstRunSkipped(true)
    setStudioWizardOpen(false)
    studio.confirmConnected()
  }, [studio])

  // Send generated asset Luau to Studio
  // BUG 10: When a `robloxAssetId` is available (meaning the mesh was already
  // uploaded to Roblox via Open Cloud), prefer the insert_asset command path
  // — the plugin uses InsertService:LoadAsset(assetId) which is faster,
  // cleaner, and doesn't require streaming the raw model file. Falls back to
  // the Luau push path when no assetId is available (demo mode,
  // ROBLOX_OPEN_CLOUD_API_KEY not configured, etc.).
  const handleAssetSendToStudio = useCallback(
    (
      luauCode: string,
      assetPrompt: string,
      meta?: { robloxAssetId?: string | null; name?: string },
    ) => {
      if (meta?.robloxAssetId && studio.sessionId && studio.isConnected) {
        fetch('/api/studio/push-asset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: studio.sessionId,
            assetId: meta.robloxAssetId,
            robloxAssetId: meta.robloxAssetId,
            name: meta.name ?? (assetPrompt.slice(0, 64) || 'Generated Asset'),
          }),
        })
          .then(async (res) => {
            if (!res.ok) {
              const errText = await res.text().catch(() => '')
              console.warn('[handleAssetSendToStudio] push-asset failed, falling back to luau:', errText)
              void handleBuildComplete(luauCode, assetPrompt, studio.sessionId)
              return
            }
            studio.addActivity(`Inserted asset ${meta.robloxAssetId} via InsertService`)
            toast('Asset sent to Studio', 'success')
          })
          .catch((err: unknown) => {
            console.warn('[handleAssetSendToStudio] push-asset error, falling back to luau:', err)
            void handleBuildComplete(luauCode, assetPrompt, studio.sessionId)
          })
        return
      }
      // Fallback: no assetId available → push raw Luau code as before
      void handleBuildComplete(luauCode, assetPrompt, studio.sessionId)
    },
    [handleBuildComplete, studio, toast],
  )

  // PERF: Stable curried variant — passing an inline `(luau) => handleAssetSendToStudio(luau, 'mesh')`
  // lambda to ChatPanel creates a fresh function on every render of NewEditorClient,
  // which defeats React.memo on MessageBubble (every bubble would re-render on every
  // keystroke in the textarea). A useCallback-bound closure lets MessageBubble's
  // memo actually skip work.
  const handleMeshSendToStudio = useCallback(
    (
      luau: string,
      prompt?: string,
      meta?: { robloxAssetId?: string | null; name?: string },
    ) => handleAssetSendToStudio(luau, prompt || 'mesh', meta),
    [handleAssetSendToStudio],
  )

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

  // Auto-focus chat input on mount
  useEffect(() => {
    const id = setTimeout(() => chat.textareaRef.current?.focus(), 120)
    return () => clearTimeout(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keyboard shortcuts
  useEditorKeyboard({
    openCommandPalette: () => setCmdPaletteOpen(true),
    focusChatInput: () => chat.textareaRef.current?.focus(),
    toggleViewport: () => setViewportExpanded((v) => !v),
    toggleSidebar: () => setSidebarPanel((prev) => prev ? null : 'history'),
    toggleShortcutsHelp: () => setShortcutsOpen((v) => !v),
    newChat: () => handleNewChat(),
    closeSidebar: () => {
      if (cmdPaletteOpen) { setCmdPaletteOpen(false); return }
      if (shortcutsOpen) { setShortcutsOpen(false); return }
      setSidebarPanel(null)
    },
  })

  // Chat-derived build list (used by BuildHistoryItem in sidebar — legacy, kept for reference)
  const chatBuildList = chat.messages
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
      className="page-fade-in"
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
      {/* Persistent Studio-not-connected banner — visible on every editor
          load until the user either connects the plugin or dismisses it.
          Renders the 6-char pairing code inline so users don't have to
          hunt for the "Connect Studio" button in the top bar. First-time
          users see this within milliseconds of the editor mounting. */}
      {!studio.isConnected && !studioBannerDismissed && (
        <div
          style={{
            flex: '0 0 auto',
            background: 'linear-gradient(180deg, rgba(212,175,55,0.12) 0%, rgba(15,20,45,0.92) 100%)',
            borderBottom: '1px solid rgba(212,175,55,0.25)',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 12,
            color: '#FAFAFA',
            flexWrap: 'wrap',
          }}
          role="status"
          aria-label="Roblox Studio not connected"
        >
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontWeight: 700, color: '#D4AF37', whiteSpace: 'nowrap',
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#D4AF37', boxShadow: '0 0 8px rgba(212,175,55,0.6)',
            }} />
            Studio not connected
          </span>
          <span style={{ color: '#A1A1AA' }}>
            — build code will queue instead of appearing in Studio.
          </span>
          <div style={{ flex: 1, minWidth: 12 }} />
          <a
            href="/download"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontWeight: 600, color: '#D4AF37',
              textDecoration: 'underline', textUnderlineOffset: 3,
              whiteSpace: 'nowrap',
            }}
            title="Opens the full install walkthrough in a new tab — includes a one-line PowerShell / curl command that installs the plugin automatically"
          >
            1. Install plugin
          </a>
          {studio.connectFlow === 'code' && studio.connectCode ? (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 10px', borderRadius: 6,
              background: 'rgba(212,175,55,0.1)',
              border: '1px solid rgba(212,175,55,0.3)',
              fontFamily: '"JetBrains Mono", ui-monospace, monospace',
              fontWeight: 800, fontSize: 13,
              color: '#FFD966', letterSpacing: '0.1em',
              whiteSpace: 'nowrap',
            }}>
              2. Code:&nbsp;
              <button
                onClick={() => {
                  if (studio.connectCode) {
                    navigator.clipboard.writeText(studio.connectCode).catch(() => {})
                    toast('Code copied')
                  }
                }}
                style={{
                  background: 'transparent', border: 'none',
                  color: 'inherit', font: 'inherit', cursor: 'pointer',
                  padding: 0,
                }}
                title="Click to copy"
              >
                {studio.connectCode}
              </button>
            </span>
          ) : (
            <button
              onClick={() => { void studio.generateCode() }}
              style={{
                padding: '4px 10px', borderRadius: 6,
                background: 'rgba(212,175,55,0.1)',
                border: '1px solid rgba(212,175,55,0.3)',
                color: '#D4AF37', fontWeight: 700, fontSize: 12,
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              2. Get pairing code
            </button>
          )}
          <button
            onClick={() => setStudioBannerDismissed(true)}
            style={{
              background: 'transparent', border: 'none',
              color: '#71717A', cursor: 'pointer', padding: '4px 6px',
              fontSize: 14, lineHeight: 1,
            }}
            aria-label="Dismiss Studio connection banner"
            title="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* Onboarding — page-aware: adapts steps to the user's current editor state */}
      {showOnboarding && (
        <OnboardingOverlay
          onDone={dismissOnboarding}
          inputRef={chat.textareaRef}
          onPrefill={(prompt) => chat.setInput(prompt)}
          hasMessages={onboardingHasMessages}
          studioConnected={studio.isConnected}
          hasUsedSlashCommand={onboardingHasUsedSlash}
          hasUsedVoice={onboardingHasUsedVoice}
        />
      )}

      {/* Save-before-new-chat confirmation dialog */}
      {pendingNewChat && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 200,
          background: 'rgba(5,8,20,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}>
          <div style={{
            width: '100%', maxWidth: 320,
            background: '#0d1020', border: '1px solid rgba(212,175,55,0.3)',
            borderRadius: 14, padding: 20,
            boxShadow: '0 12px 48px rgba(0,0,0,0.7)',
          }}>
            <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
              Save before starting new chat?
            </p>
            <p style={{ margin: '0 0 16px', fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
              Your current conversation will be lost unless you save it as a project first.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => {
                  setPendingNewChat(false)
                  setActiveProjectId(null)
                  setActiveProjectName('Untitled Project')
                  chat.newChat()
                }}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 8,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.5)', fontSize: 12,
                  fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                }}
              >
                Discard
              </button>
              <button
                onClick={() => {
                  setPendingNewChat(false)
                  setSidebarPanel('projects')
                }}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 8,
                  background: 'linear-gradient(135deg, #D4AF37 0%, #E6A519 100%)',
                  border: 'none', color: '#09090b', fontSize: 12,
                  fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                }}
              >
                Save Project
              </button>
            </div>
            <button
              onClick={() => setPendingNewChat(false)}
              style={{
                display: 'block', width: '100%', marginTop: 8,
                padding: '6px 0', borderRadius: 8, background: 'none',
                border: 'none', color: 'rgba(255,255,255,0.25)', fontSize: 11,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
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
          onNewChat={() => handleNewChat()}
          onConnect={() => { setStudioWizardOpen(true); studio.generateCode() }}
          onShowShortcuts={() => setShortcutsOpen(true)}
          editorLayout={editorLayout}
          onLayoutChange={setEditorLayout}
          latencyMs={studio.latencyMs}
          sseReconnectPhase={studio.sseReconnectPhase}
          isMobile={isMobile}
          onMobileMenuOpen={() => setMobileMenuOpen(true)}
        />

        {/* Mobile tab bar — legacy; hidden in the mobile chat-focus flow since
            the viewport doesn't render as a tab anymore. Kept for any
            desktop-narrow fallback (< md but not matched by useIsMobile). */}
        {!isMobile && (
          <div className="flex md:hidden">
            <MobileTabBar
              activeTab={mobileTab}
              onChange={setMobileTab}
              isConnected={studio.isConnected}
            />
          </div>
        )}

        {/* Main workspace: layout-conditional */}
        {effectiveLayout === 'minimal' ? (
          /* ── Minimal: clean full-screen chat ─────────────────────────────── */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, padding: '0 6px 6px' }}>
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
              onEditAndResend={chat.editAndResend}
              onSendToStudio={handleMeshSendToStudio}
              studioConnected={studio.isConnected}
              savedAt={chat.savedAt}
              imageFile={chat.imageFile}
              onImageFile={chat.setImageFile}
              compact={false}
              {...aiModeProps}
            />
          </div>
        ) : effectiveLayout === 'cinematic' ? (
          /* ── Cinematic: fullscreen viewport + floating chat ───────────────── */
          <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden', padding: 6 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, borderRadius: 12, overflow: 'hidden' }}>
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
                expanded={false}
                onToggleExpand={() => {}}
                previewParts={previewParts}
              />
            </div>
            {/* Floating chat overlay */}
            <div style={{
              position: 'absolute', bottom: 12, right: 12,
              width: 360,
              height: cinematicChatCollapsed ? 44 : 420,
              minHeight: cinematicChatCollapsed ? 44 : 200,
              maxHeight: '70vh',
              zIndex: 15,
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.06)',
              transition: 'height 0.25s ease-out',
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(8,12,28,0.92)',
              backdropFilter: 'blur(16px)',
            }}>
              {/* Cinematic chat header with collapse toggle */}
              <div style={{ height: 44, flexShrink: 0, display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', padding: '0 12px',
                borderBottom: cinematicChatCollapsed ? 'none' : '1px solid rgba(255,255,255,0.06)',
                cursor: 'pointer' }} onClick={() => setCinematicChatCollapsed((v) => !v)}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
                  AI Chat
                </span>
                <button aria-label={cinematicChatCollapsed ? 'Expand chat' : 'Collapse chat'}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 24, height: 24 }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d={cinematicChatCollapsed ? 'M2 4l4 4 4-4' : 'M2 8l4-4 4 4'}
                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              {!cinematicChatCollapsed && (
                <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                  <AgentStrip loading={chat.loading} mcpResult={chat.lastMcpResult} />
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
                    onEditAndResend={chat.editAndResend}
                    onSendToStudio={handleMeshSendToStudio}
                    studioConnected={studio.isConnected}
                    savedAt={chat.savedAt}
              imageFile={chat.imageFile}
              onImageFile={chat.setImageFile}
                    compact={true}
                    {...aiModeProps}
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── Default / Chat-focus / Split: shared sidebar structure ─────── */
          <div
            style={{
              flex: 1,
              display: 'flex',
              overflow: 'hidden',
            }}
          >
            {/* Center column */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: effectiveLayout === 'chat-focus' || effectiveLayout === 'split' ? 'row' : 'column',
                minWidth: 0,
                padding: isMobile ? 0 : '6px 0 6px 6px',
                gap: effectiveLayout === 'chat-focus' || effectiveLayout === 'split' ? 2 : 0,
              }}
            >
              {effectiveLayout === 'default' ? (
                /* ── Default: viewport top, chat bottom ───────────────────── */
                <>
                  <div
                    className={mobileTab === 'chat' ? 'hidden md:flex' : 'flex'}
                    style={{ flex: 1, minHeight: 0, flexDirection: 'column', borderRadius: 12, overflow: 'hidden' }}
                  >
                    {/* Studio wizard — only shown when user explicitly clicks "Connect Studio" */}
                    {!studio.isConnected && studioWizardOpen ? (
                      <div style={{ flex: 1, background: 'rgba(6,10,20,0.5)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', position: 'relative' }}>
                        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />
                        <div style={{ position: 'relative', zIndex: 1, height: '100%', overflowY: 'auto' }}>
                          <FirstRunExperience
                            connectFlow={studio.connectFlow}
                            connectCode={studio.connectCode}
                            connectTimer={studio.connectTimer}
                            onGenerateCode={studio.generateCode}
                            onConfirmConnected={studio.confirmConnected}
                            onSkip={handleSkipFirstRun}
                          />
                        </div>
                      </div>
                    ) : (
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
                    )}
                  </div>
                  <AgentStrip loading={chat.loading} mcpResult={chat.lastMcpResult} />
                  {!viewportExpanded && (
                    <div className="hidden md:block">
                      <ResizeHandle onDrag={handleResizeDrag} />
                    </div>
                  )}
                  <div
                    ref={chatPanelRef}
                    className={mobileTab === 'studio' ? 'hidden md:flex' : 'flex'}
                    style={{
                      flexShrink: 0,
                      height: effectiveChatHeight,
                      minHeight: CHAT_MIN_HEIGHT,
                      maxHeight: viewportExpanded ? 56 : CHAT_MAX_HEIGHT,
                      flexDirection: 'column',
                      transition: 'height 0.25s ease-out',
                      padding: '6px 0 0',
                      position: 'relative',
                    }}
                  >
                    {viewportExpanded && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)',
                        backdropFilter: 'blur(2px)', borderRadius: 12, zIndex: 15,
                        pointerEvents: 'none', transition: 'opacity 0.25s ease-out' }} />
                    )}
                    {/* Suggested prompts — only shown when chat is empty and not compact */}
                    {!viewportExpanded && chat.messages.length === 0 && (
                      <div style={{ padding: '8px 12px 0', flexShrink: 0 }}>
                        <SuggestedPrompts
                          onSend={(prompt) => { void chat.sendMessage(prompt) }}
                          hidden={chat.messages.length > 0}
                        />
                      </div>
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
                      onEditAndResend={chat.editAndResend}
                      onSendToStudio={handleMeshSendToStudio}
                      studioConnected={studio.isConnected}
                      savedAt={chat.savedAt}
              imageFile={chat.imageFile}
              onImageFile={chat.setImageFile}
                      compact={viewportExpanded}
                      {...aiModeProps}
                    />
                  </div>
                </>
              ) : effectiveLayout === 'chat-focus' ? (
                /* ── Chat-focus: chat left (60%), viewport right (40%) on desktop;
                     full-screen chat on mobile ──────────────────────────────── */
                <>
                  <div style={{ flex: 3, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                    <AgentStrip loading={chat.loading} mcpResult={chat.lastMcpResult} />
                    <div style={{ flex: 1, minHeight: 0 }}>
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
                        onEditAndResend={chat.editAndResend}
                        onSendToStudio={handleMeshSendToStudio}
                        studioConnected={studio.isConnected}
                        savedAt={chat.savedAt}
              imageFile={chat.imageFile}
              onImageFile={chat.setImageFile}
                        compact={false}
                        {...aiModeProps}
                      />
                    </div>
                  </div>
                  {/* Viewport column is hidden on mobile so the chat takes the full screen */}
                  {!isMobile && (
                    <div style={{ flex: 2, minWidth: 0, display: 'flex', flexDirection: 'column',
                      borderRadius: 12, overflow: 'hidden' }}>
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
                        expanded={false}
                        onToggleExpand={() => {}}
                        previewParts={previewParts}
                      />
                    </div>
                  )}
                </>
              ) : (
                /* ── Split: 50/50 chat left, viewport right ──────────────── */
                <>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                    <AgentStrip loading={chat.loading} mcpResult={chat.lastMcpResult} />
                    <div style={{ flex: 1, minHeight: 0 }}>
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
                        onEditAndResend={chat.editAndResend}
                        onSendToStudio={handleMeshSendToStudio}
                        studioConnected={studio.isConnected}
                        savedAt={chat.savedAt}
              imageFile={chat.imageFile}
              onImageFile={chat.setImageFile}
                        compact={false}
                        {...aiModeProps}
                      />
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column',
                    borderRadius: 12, overflow: 'hidden' }}>
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
                      expanded={false}
                      onToggleExpand={() => {}}
                      previewParts={previewParts}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Right sidebar — hidden in chat-focus and split */}
            {effectiveLayout === 'default' && (
              <div
                className="hidden md:flex"
                style={{ flexShrink: 0, display: 'flex', flexDirection: 'row' }}
              >
                {sidebarPanel && (
                  <div style={{ width: 280, background: 'rgba(5,8,16,0.95)',
                    borderLeft: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'slideIn 0.2s ease-out' }}>
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
                        {sidebarPanel === 'marketplace' && 'Marketplace'}
                        {sidebarPanel === 'generate' && 'Generate Asset'}
                        {sidebarPanel === 'settings' && 'Settings'}
                        {sidebarPanel === 'history' && 'Chat History'}
                        {sidebarPanel === 'builds' && 'Build History'}
                        {sidebarPanel === 'context' && 'AI Context'}
                        {sidebarPanel === 'help' && 'Help'}
                        {sidebarPanel === 'preview' && 'Studio Preview'}
                        {sidebarPanel === 'projects' && 'Projects'}
                      </span>
                      <button onClick={() => setSidebarPanel(null)}
                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 4 }}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                    <div style={{ flex: 1, overflowY: sidebarPanel === 'generate' ? 'hidden' : 'auto', padding: sidebarPanel === 'generate' ? 0 : 16 }}>
                      {sidebarPanel === 'generate' && (
                        <AssetGenerator
                          onSendToStudio={handleMeshSendToStudio}
                        />
                      )}
                      {sidebarPanel === 'marketplace' && (
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                          <p style={{ margin: '0 0 12px' }}>Browse community templates and assets.</p>
                          <div style={{ padding: 12, borderRadius: 10, background: 'rgba(212,175,55,0.06)',
                            border: '1px solid rgba(212,175,55,0.15)', fontSize: 12, color: 'rgba(212,175,55,0.8)' }}>
                            Type &quot;show marketplace&quot; in chat to browse assets
                          </div>
                        </div>
                      )}
                      {sidebarPanel === 'settings' && (
                        <SettingsPanel
                          studioStatus={{
                            connected: studio.isConnected,
                            placeName: studio.placeName || undefined,
                            placeId: studio.placeId ? Number(studio.placeId) : undefined,
                            sessionId: studio.sessionId ?? undefined,
                          }}
                          totalTokens={0}
                          tokensRemaining={null}
                          onDisconnect={studio.disconnect}
                          onRescanWorkspace={studio.isConnected ? studio.requestScreenshot : undefined}
                        />
                      )}
                      {sidebarPanel === 'history' && (
                        <ChatHistoryPanel
                          currentSessionId={chat.currentSessionId}
                          listSessions={chat.listSessions}
                          onLoadSession={(id) => { chat.loadSession(id); setSidebarPanel(null) }}
                          onDeleteSession={chat.deleteSession}
                          onClearAll={() => { chat.clearAllSessions(); setSidebarPanel(null) }}
                          onNewChat={() => { handleNewChat(); setSidebarPanel(null) }}
                        />
                      )}
                      {sidebarPanel === 'builds' && (
                        <BuildHistorySidebarPanel
                          entries={buildHistory.entries}
                          onRerun={(entry) => {
                            chat.sendMessage(entry.prompt)
                            setSidebarPanel(null)
                          }}
                          onClear={buildHistory.clearAll}
                        />
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
                      {sidebarPanel === 'preview' && (
                        <StudioPreviewPanel
                          screenshotUrl={studio.screenshotUrl}
                          screenshotTimestamp={studio.screenshotTimestamp}
                          beforeScreenshotUrl={studio.beforeScreenshotUrl}
                          isConnected={studio.isConnected}
                          sseReconnectPhase={studio.sseReconnectPhase}
                          onRequestScreenshot={studio.requestScreenshot}
                          onReconnect={studio.generateCode}
                          sessionId={studio.sessionId}
                          jwt={studio.jwt}
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
                          <div style={{ marginTop: 16, padding: 12, borderRadius: 10,
                            background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)',
                            fontSize: 12, color: 'rgba(212,175,55,0.8)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <span style={{ fontWeight: 600, marginBottom: 2 }}>Keyboard Shortcuts</span>
                            <span><kbd style={kbdStyle}>Enter</kbd> Send message</span>
                            <span><kbd style={kbdStyle}>Shift+Enter</kbd> New line</span>
                            <span><kbd style={kbdStyle}>Ctrl+K</kbd> Focus chat</span>
                            <span><kbd style={kbdStyle}>Ctrl+\</kbd> Expand viewport</span>
                            <span><kbd style={kbdStyle}>Esc</kbd> Close panel</span>
                          </div>
                          {/* Discord CTA */}
                          <a
                            href="https://discord.gg/forjegames"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              marginTop: 12,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '10px 14px',
                              borderRadius: 10,
                              background: 'rgba(88,101,242,0.08)',
                              border: '1px solid rgba(88,101,242,0.2)',
                              color: 'rgba(88,101,242,0.9)',
                              fontSize: 12,
                              fontWeight: 600,
                              textDecoration: 'none',
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(88,101,242,0.14)'
                              e.currentTarget.style.borderColor = 'rgba(88,101,242,0.35)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(88,101,242,0.08)'
                              e.currentTarget.style.borderColor = 'rgba(88,101,242,0.2)'
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                            </svg>
                            Join our Discord
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Icon rail */}
                <div style={{ width: 52, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  paddingTop: 8, gap: 2, background: 'rgba(5,8,16,0.95)',
                  borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
                  <SidebarButton icon={<IconStore />} label="Marketplace" shortcut="⌘M"
                    active={sidebarPanel === 'marketplace'} onClick={() => toggleSidebar('marketplace')} />
                  <SidebarButton icon={<IconGenerate />} label="Generate Asset"
                    active={sidebarPanel === 'generate'} onClick={() => toggleSidebar('generate')} />
                  <SidebarButton icon={<IconHistory />} label="Chat History" shortcut="⌘H"
                    active={sidebarPanel === 'history'} onClick={() => toggleSidebar('history')} />
                  <SidebarButton icon={<IconBuildHistory />} label="Build History"
                    active={sidebarPanel === 'builds'} onClick={() => toggleSidebar('builds')}
                    badge={buildHistory.entries.length > 0 ? 'active' : undefined} />
                  <SidebarButton icon={<IconSettings />} label="Settings" shortcut="⌘,"
                    active={sidebarPanel === 'settings'} onClick={() => toggleSidebar('settings')} />
                  <SidebarButton icon={<IconContext />} label="AI Context" shortcut="⌘A"
                    active={sidebarPanel === 'context'} onClick={() => toggleSidebar('context')}
                    badge={studio.isConnected ? 'active' : undefined} />
                  <SidebarButton icon={<IconPreview />} label="Studio Preview" shortcut="⌘P"
                    active={sidebarPanel === 'preview'} onClick={() => toggleSidebar('preview')}
                    badge={studio.screenshotUrl ? 'active' : undefined} />
                  <div style={{ width: 24, height: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 1, margin: '4px 0' }} />
                  <div style={{ flex: 1 }} />
                  <SidebarButton icon={<IconHelp />} label="Help" shortcut="⌘/"
                    active={sidebarPanel === 'help'} onClick={() => toggleSidebar('help')} />
                  <div style={{ height: 8 }} />
                </div>
              </div>
            )}

            {/* Split/chat-focus: icon-rail only (no panel) — hidden on mobile */}
            {!isMobile && (effectiveLayout === 'split' || effectiveLayout === 'chat-focus') && (
              <div
                className="hidden md:flex"
                style={{ flexShrink: 0, display: 'flex', flexDirection: 'row' }}
              >
                <div style={{ width: 52, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  paddingTop: 8, gap: 2, background: 'rgba(5,8,16,0.95)',
                  borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
                  <SidebarButton icon={<IconStore />} label="Marketplace" shortcut="⌘M"
                    active={false} onClick={() => { setEditorLayout('default'); toggleSidebar('marketplace') }} />
                  <SidebarButton icon={<IconGenerate />} label="Generate Asset"
                    active={false} onClick={() => { setEditorLayout('default'); toggleSidebar('generate') }} />
                  <SidebarButton icon={<IconHistory />} label="Chat History" shortcut="⌘H"
                    active={false} onClick={() => { setEditorLayout('default'); toggleSidebar('history') }} />
                  <SidebarButton icon={<IconBuildHistory />} label="Build History"
                    active={false} onClick={() => { setEditorLayout('default'); toggleSidebar('builds') }}
                    badge={buildHistory.entries.length > 0 ? 'active' : undefined} />
                  <SidebarButton icon={<IconSettings />} label="Settings" shortcut="⌘,"
                    active={false} onClick={() => { setEditorLayout('default'); toggleSidebar('settings') }} />
                  <SidebarButton icon={<IconContext />} label="AI Context" shortcut="⌘A"
                    active={false} onClick={() => { setEditorLayout('default'); toggleSidebar('context') }}
                    badge={studio.isConnected ? 'active' : undefined} />
                  <div style={{ width: 24, height: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 1, margin: '4px 0' }} />
                  <div style={{ flex: 1 }} />
                  <SidebarButton icon={<IconHelp />} label="Help" shortcut="⌘/"
                    active={false} onClick={() => { setEditorLayout('default'); toggleSidebar('help') }} />
                  <div style={{ height: 8 }} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Command Palette overlay */}
      <CommandPalette
        isOpen={cmdPaletteOpen}
        onClose={() => setCmdPaletteOpen(false)}
        onCommand={handleCommand}
      />

      {/* Shortcuts Help overlay */}
      <ShortcutsHelp isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      {/* BUG 3: Guest signup prompt — one-time modal after first AI response */}
      {showGuestSignupPrompt && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="fg-guest-signup-title"
          onClick={dismissGuestSignupPrompt}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(5,8,16,0.72)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            animation: 'msgFadeUp 0.25s ease-out forwards',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 420,
              width: '100%',
              padding: 28,
              borderRadius: 18,
              background: 'linear-gradient(180deg, rgba(20,26,48,0.95) 0%, rgba(12,16,32,0.95) 100%)',
              border: '1px solid rgba(212,175,55,0.25)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.55), 0 0 40px rgba(212,175,55,0.12)',
              fontFamily: 'Inter, sans-serif',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 10 }}>✨</div>
            <h2
              id="fg-guest-signup-title"
              style={{
                margin: '0 0 8px',
                fontSize: 20,
                fontWeight: 700,
                color: '#fafafa',
                letterSpacing: '-0.01em',
              }}
            >
              Loved that build?
            </h2>
            <p style={{ margin: '0 0 22px', fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
              Sign up to save it forever, sync across devices, and unlock premium models.
            </p>
            <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
              <Link
                href="/sign-up"
                onClick={() => {
                  try { localStorage.setItem('forje_guest_signup_prompted', '1') } catch { /* ignore */ }
                }}
                style={{
                  display: 'block',
                  padding: '12px 18px',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #D4AF37 0%, #C8962A 100%)',
                  color: '#030712',
                  fontSize: 14,
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 0 20px rgba(212,175,55,0.35)',
                }}
              >
                Sign up free
              </Link>
              <button
                type="button"
                onClick={dismissGuestSignupPrompt}
                style={{
                  padding: '10px 18px',
                  borderRadius: 12,
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                Continue as guest
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom-sheet drawer: houses the marketplace / history / settings etc.
          that would normally live in the desktop right-side panel. */}
      {isMobile && (
        <MobileBottomSheet
          open={mobileMenuOpen || (!!sidebarPanel)}
          onClose={() => { setMobileMenuOpen(false); setSidebarPanel(null) }}
          title={
            sidebarPanel === 'marketplace' ? 'Marketplace' :
            sidebarPanel === 'generate' ? 'Generate Asset' :
            sidebarPanel === 'settings' ? 'Settings' :
            sidebarPanel === 'history' ? 'Chat History' :
            sidebarPanel === 'builds' ? 'Build History' :
            sidebarPanel === 'context' ? 'AI Context' :
            sidebarPanel === 'help' ? 'Help' :
            sidebarPanel === 'preview' ? 'Studio Preview' :
            sidebarPanel === 'projects' ? 'Projects' :
            'Menu'
          }
        >
          {/* No panel selected → show the menu list */}
          {!sidebarPanel && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { id: 'marketplace', label: 'Marketplace', icon: <IconStore /> },
                { id: 'generate', label: 'Generate Asset', icon: <IconGenerate /> },
                { id: 'history', label: 'Chat History', icon: <IconHistory /> },
                { id: 'builds', label: 'Build History', icon: <IconBuildHistory /> },
                { id: 'preview', label: 'Studio Preview', icon: <IconPreview /> },
                { id: 'context', label: 'AI Context', icon: <IconContext /> },
                { id: 'settings', label: 'Settings', icon: <IconSettings /> },
                { id: 'help', label: 'Help', icon: <IconHelp /> },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setSidebarPanel(item.id); setMobileMenuOpen(false) }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    width: '100%',
                    minHeight: 52,
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(255,255,255,0.03)',
                    color: 'rgba(255,255,255,0.85)',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  <span style={{ color: 'rgba(212,175,55,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24 }}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {/* Panel body content — mirrors the desktop side panel */}
          {sidebarPanel === 'generate' && (
            <AssetGenerator
              onSendToStudio={handleMeshSendToStudio}
            />
          )}
          {sidebarPanel === 'marketplace' && (
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
              <p style={{ margin: '0 0 12px' }}>Browse community templates and assets.</p>
              <div style={{ padding: 12, borderRadius: 10, background: 'rgba(212,175,55,0.06)',
                border: '1px solid rgba(212,175,55,0.15)', fontSize: 12, color: 'rgba(212,175,55,0.8)' }}>
                Type &quot;show marketplace&quot; in chat to browse assets
              </div>
            </div>
          )}
          {sidebarPanel === 'settings' && (
            <SettingsPanel
              studioStatus={{
                connected: studio.isConnected,
                placeName: studio.placeName || undefined,
                placeId: studio.placeId ? Number(studio.placeId) : undefined,
                sessionId: studio.sessionId ?? undefined,
              }}
              totalTokens={0}
              tokensRemaining={null}
              onDisconnect={studio.disconnect}
              onRescanWorkspace={studio.isConnected ? studio.requestScreenshot : undefined}
            />
          )}
          {sidebarPanel === 'history' && (
            <ChatHistoryPanel
              currentSessionId={chat.currentSessionId}
              listSessions={chat.listSessions}
              onLoadSession={(id) => { chat.loadSession(id); setSidebarPanel(null); setMobileMenuOpen(false) }}
              onDeleteSession={chat.deleteSession}
              onClearAll={() => { chat.clearAllSessions(); setSidebarPanel(null); setMobileMenuOpen(false) }}
              onNewChat={() => { handleNewChat(); setSidebarPanel(null); setMobileMenuOpen(false) }}
            />
          )}
          {sidebarPanel === 'builds' && (
            <BuildHistorySidebarPanel
              entries={buildHistory.entries}
              onRerun={(entry) => {
                chat.sendMessage(entry.prompt)
                setSidebarPanel(null)
                setMobileMenuOpen(false)
              }}
              onClear={buildHistory.clearAll}
            />
          )}
          {sidebarPanel === 'context' && (
            <AIContextPanel
              studioConnected={studio.isConnected}
              studioContext={studio.studioContext}
              onSendToChat={(msg) => { chat.sendMessage(msg); setSidebarPanel(null); setMobileMenuOpen(false) }}
              buildCount={chat.messages.filter((m) => m.hasCode).length}
              tokenCount={chat.totalTokens}
            />
          )}
          {sidebarPanel === 'preview' && (
            <StudioPreviewPanel
              screenshotUrl={studio.screenshotUrl}
              screenshotTimestamp={studio.screenshotTimestamp}
              beforeScreenshotUrl={studio.beforeScreenshotUrl}
              isConnected={studio.isConnected}
              sseReconnectPhase={studio.sseReconnectPhase}
              onRequestScreenshot={studio.requestScreenshot}
              onReconnect={studio.generateCode}
              sessionId={studio.sessionId}
              jwt={studio.jwt}
            />
          )}
          {sidebarPanel === 'help' && (
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.6 }}>
              <p style={{ margin: '0 0 12px', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
                Quick Start
              </p>
              <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <li>Type what you want to build in the chat</li>
                <li>Connect Roblox Studio with the plugin</li>
                <li>Builds execute automatically in Studio</li>
                <li>Iterate — &quot;make it bigger&quot;, &quot;add lighting&quot;</li>
              </ol>
            </div>
          )}
        </MobileBottomSheet>
      )}

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(12px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
