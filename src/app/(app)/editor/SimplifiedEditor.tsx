'use client'

/**
 * SimplifiedEditor — chat-first Roblox AI builder.
 *
 * Layout:
 *   TopBar (48px)
 *   ├─ Mode Switcher (pill bar — inside ChatPanel when messages exist)
 *   ├─ Main area: WelcomeHero (empty) or ChatPanel (active)
 *   └─ Right Sidebar (AI Context — when Studio connected)
 *
 * All heavy lifting stays in hooks — this file is pure layout.
 */

import React, { useState, useCallback, useEffect } from 'react'
import { useSWRConfig } from 'swr'
import { useUser } from '@clerk/nextjs'
import { ChatPanel } from '@/components/editor/ChatPanel'
import { CommandPalette } from '@/components/editor/CommandPalette'
import { PublishPanel } from '@/components/editor/PublishPanel'
import { useChat, loadSessions, type ChatSession, type ChatSessionMeta } from './hooks/useChat'
import { useStudioConnection } from './hooks/useStudioConnection'
import { useEditorKeyboard } from './hooks/useEditorKeyboard'
import { ToastProvider, useToast } from '@/components/editor/EditorToasts'
import { ThemeProvider } from '@/components/ThemeProvider'
import { EditorTopBar } from './components/EditorTopBar'
import { WelcomeHero } from './components/WelcomeHero'
import { LeftDrawer } from './components/LeftDrawer'
import { OnboardingOverlay, useOnboardingOverlay } from './components/OnboardingOverlay'
import ApiKeysModal from './panels/ApiKeysModal'
import { BuildProgressDashboard } from '@/components/editor/BuildProgressDashboard'
import { FirstBuildModal } from '@/components/editor/FirstBuildModal'
import { PostBuildShare } from '@/components/editor/PostBuildShare'
import { UpgradeNudge } from '@/components/editor/UpgradeNudge'
import ConsolePanel from '@/components/editor/ConsolePanel'
import { SystemComposer } from '@/components/editor/SystemComposer'

// ─── Right Sidebar — AI Context Panel ────────────────────────────────────

import type { StudioContext } from './hooks/useStudioConnection'

function RightSidebar({
  studioContext,
  open,
  onToggle,
  isMobile,
}: {
  studioContext: StudioContext
  open: boolean
  onToggle: () => void
  isMobile: boolean
}) {
  if (isMobile && !open) return null

  const cameraStr = studioContext.camera
    ? `${studioContext.camera.posX.toFixed(1)}, ${studioContext.camera.posY.toFixed(1)}, ${studioContext.camera.posZ.toFixed(1)}`
    : null

  return (
    <>
      {/* Toggle button on the edge */}
      <button
        onClick={onToggle}
        style={{
          position: 'absolute',
          right: open ? (isMobile ? 'auto' : 320) : 0,
          left: isMobile && open ? 0 : 'auto',
          top: '50%',
          transform: 'translateY(-50%)',
          width: isMobile ? 44 : 20,
          height: 48,
          borderRadius: open ? '6px 0 0 6px' : '0 6px 6px 0',
          background: 'rgba(15,18,30,0.9)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRight: open ? '1px solid rgba(255,255,255,0.06)' : 'none',
          borderLeft: open ? 'none' : '1px solid rgba(255,255,255,0.06)',
          color: '#52525B',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 15,
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#A1A1AA'}
        onMouseLeave={e => e.currentTarget.style.color = '#52525B'}
      >
        <svg width="8" height="12" viewBox="0 0 8 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d={open ? 'M6 1l-5 5 5 5' : 'M2 1l5 5-5 5'} />
        </svg>
      </button>

      {/* Mobile backdrop — closes sidebar on tap */}
      {open && isMobile && (
        <div
          onClick={onToggle}
          style={{
            position: 'fixed', inset: 0, zIndex: 49,
            background: 'rgba(0,0,0,0.5)',
          }}
        />
      )}

      {/* Sidebar panel */}
      {open && (
        <div
          style={{
            width: isMobile ? '100%' : 320,
            height: isMobile ? '100%' : 'auto',
            position: isMobile ? 'fixed' : 'relative',
            top: isMobile ? 0 : 'auto',
            right: isMobile ? 0 : 'auto',
            zIndex: isMobile ? 50 : 1,
            flexShrink: 0,
            borderLeft: isMobile ? 'none' : '1px solid rgba(255,255,255,0.05)',
            background: isMobile ? 'rgba(5,8,16,0.98)' : 'rgba(8,10,22,0.6)',
            backdropFilter: 'blur(20px)',
            overflowY: 'auto',
            scrollbarWidth: 'none',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            animation: 'sidebarSlideIn 0.2s ease-out',
          }}
        >
          {isMobile && (
            <button
              onClick={onToggle}
              style={{
                alignSelf: 'flex-end',
                width: 32, height: 32, borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                color: '#71717A', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}

          <h3 style={{
            fontSize: 12, fontWeight: 700, color: '#D4AF37',
            letterSpacing: '0.05em', textTransform: 'uppercase',
            margin: 0,
          }}>
            AI Context
          </h3>

          {/* Camera position */}
          {cameraStr && (
            <SidebarSection title="Camera" value={cameraStr} />
          )}

          {/* Part count */}
          <div style={{ display: 'flex', gap: 8 }}>
            <StatBadge label="Parts" value={studioContext.partCount} />
            <StatBadge label="Nearby" value={studioContext.nearbyParts.length} />
          </div>

          {/* Nearby parts */}
          {studioContext.nearbyParts.length > 0 && (
            <SidebarSection title={`Nearby Parts (${studioContext.nearbyParts.length})`}>
              {studioContext.nearbyParts.slice(0, 12).map((part, i) => (
                <div key={i} style={{
                  fontSize: 11, color: '#71717A',
                  padding: '3px 6px', marginBottom: 2,
                  borderRadius: 4, background: 'rgba(255,255,255,0.02)',
                  fontFamily: "'JetBrains Mono', monospace",
                  display: 'flex', justifyContent: 'space-between',
                }}>
                  <span style={{ color: '#A1A1AA' }}>{part.name}</span>
                  <span style={{ color: '#3F3F46', fontSize: 10 }}>{part.className}</span>
                </div>
              ))}
            </SidebarSection>
          )}

          {studioContext.partCount === 0 && !cameraStr && (
            <p style={{
              fontSize: 12, color: '#3F3F46', lineHeight: 1.6,
              margin: 0,
            }}>
              Scene data will appear here once Studio syncs context.
            </p>
          )}
        </div>
      )}

      <style>{`
        @keyframes sidebarSlideIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </>
  )
}

function SidebarSection({ title, value, children }: { title: string; value?: string; children?: React.ReactNode }) {
  return (
    <div>
      <div style={{
        fontSize: 10, fontWeight: 600, color: '#52525B',
        letterSpacing: '0.04em', textTransform: 'uppercase',
        marginBottom: 4,
      }}>
        {title}
      </div>
      {value && (
        <div style={{
          fontSize: 11, color: '#A1A1AA',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {value}
        </div>
      )}
      {children}
    </div>
  )
}

function StatBadge({ label, value }: { label: string; value: number }) {
  return (
    <div style={{
      flex: 1,
      padding: '8px 10px',
      borderRadius: 8,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.05)',
      textAlign: 'center',
    }}>
      <div style={{
        fontSize: 16, fontWeight: 700, color: '#FAFAFA',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value.toLocaleString()}
      </div>
      <div style={{ fontSize: 10, color: '#52525B', marginTop: 2 }}>{label}</div>
    </div>
  )
}

// ─── Inner component (needs toast + theme providers above) ────────────────

function EditorInner() {
  const { isSignedIn } = useUser()
  const { toast } = useToast()
  const { mutate } = useSWRConfig()

  // ── State ──
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [apiKeysOpen, setApiKeysOpen] = useState(false)
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)
  const [activeBuildId, setActiveBuildId] = useState<string | null>(null)
  const [sessions, setSessions] = useState<ChatSession[] | ChatSessionMeta[]>([])
  const [buildJustSucceeded, setBuildJustSucceeded] = useState(false)
  const [showShareBar, setShowShareBar] = useState(false)
  const [lastBuildPrompt, setLastBuildPrompt] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [consoleOpen, setConsoleOpen] = useState(false)
  const [consoleErrors, setConsoleErrors] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // ── Studio connection ──
  const studio = useStudioConnection()

  React.useEffect(() => {
    if (isSignedIn && !studio.isConnected && studio.connectFlow === 'idle') {
      studio.generateCode()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, studio.isConnected, studio.connectFlow])

  // Auto-show sidebar when Studio connects (desktop only)
  useEffect(() => {
    if (studio.isConnected && !isMobile) {
      setSidebarOpen(true)
    }
  }, [studio.isConnected, isMobile])

  // ── Chat hook ──
  const chat = useChat({
    studioSessionId: studio.sessionId,
    studioConnected: studio.isConnected,
    studioContext: studio.studioContext,
    onBuildComplete: useCallback(
      async (luauCode: string, prompt: string, sessionId: string | null) => {
        if (!sessionId) return
        try {
          await fetch('/api/studio/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: luauCode, prompt, sessionId }),
          })
          studio.addActivity(`Build sent: ${prompt.slice(0, 60)}`)
          mutate('/api/usage/daily')
          setBuildJustSucceeded(true)
          setLastBuildPrompt(prompt)
          setShowShareBar(true)
          fetch('/api/gamification/achievements/check', { method: 'POST' }).catch(() => {})
          fetch('/api/gamification/streak', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'build' }),
          }).catch(() => {})
        } catch {
          // Non-fatal
        }
      },
      [studio, mutate],
    ),
  })

  // ── Onboarding ──
  const { shouldShow: showOnboarding, dismiss: dismissOnboarding } = useOnboardingOverlay({
    hasMessages: chat.messages.length > 0,
  })

  // ── Auto-clear chat on ?new=1 and auto-send ?prompt= ──
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      if (params.has('new')) chat.newChat()
      const promptParam = params.get('prompt')
      if (promptParam && promptParam.trim()) {
        setTimeout(() => chat.sendMessage(promptParam.trim()), 300)
      }
      if (params.has('new') || params.has('prompt')) {
        const url = new URL(window.location.href)
        url.searchParams.delete('new')
        url.searchParams.delete('prompt')
        window.history.replaceState({}, '', url.toString())
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Load session list for drawer ──
  useEffect(() => {
    const merged = chat.listSessions()
    if (merged.length > 0) {
      setSessions(merged)
    } else {
      setSessions(loadSessions())
    }
  }, [chat.currentSessionId, chat.cloudSessions])

  // ── Keyboard shortcuts ──
  useEditorKeyboard({
    openCommandPalette: () => setCmdPaletteOpen(true),
    toggleViewport: () => {},
    closeSidebar: () => setDrawerOpen(false),
    toggleSidebar: () => setDrawerOpen(v => !v),
    toggleShortcutsHelp: () => {},
    focusChatInput: () => chat.textareaRef?.current?.focus(),
    newChat: () => chat.newChat(),
  })

  // ── Quick action handler ──
  const handleQuickAction = useCallback(
    (prompt: string, autoSend: boolean) => {
      if (autoSend) {
        chat.sendMessage(prompt)
      } else {
        chat.setInput(prompt)
        chat.textareaRef?.current?.focus()
      }
    },
    [chat],
  )

  // ── Send to Studio handler ──
  const handleSendToStudio = useCallback(
    (luauCode: string) => {
      if (!studio.sessionId || !studio.isConnected) {
        toast('Studio not connected — open the Publish panel to pair', 'warning')
        setPublishOpen(true)
        return
      }
      fetch('/api/studio/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: luauCode, sessionId: studio.sessionId }),
      })
        .then(async (res) => {
          if (res.ok) {
            studio.addActivity('Code sent to Studio')
            toast('Deployed to Studio', 'success')
          } else {
            const body = await res.text().catch(() => '')
            console.error('[SendToStudio] Failed:', res.status, body)
            if (res.status === 404 || res.status === 410) {
              toast('Studio session expired — reconnect from the top bar', 'error')
            } else {
              toast(`Failed to send to Studio (${res.status})`, 'error')
            }
          }
        })
        .catch(() => toast('Failed to send to Studio — check your connection', 'error'))
    },
    [studio, toast],
  )

  const hasMessages = chat.messages.length > 0

  return (
    <div
      style={{
        width: '100%',
        height: isMobile ? '100dvh' : '100vh',
        overflow: 'hidden',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        background: 'linear-gradient(180deg, #050810 0%, #070B1A 50%, #050810 100%)',
        color: '#FAFAFA',
        fontFamily: 'var(--font-geist-sans, Inter, -apple-system, BlinkMacSystemFont, sans-serif)',
        position: 'relative',
        letterSpacing: '-0.01em',
      }}
    >
      {/* ── Floating background orbs — visible everywhere ── */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        {/* Large gold orb — top left */}
        <div style={{
          position: 'absolute', top: '5%', left: '2%',
          width: 350, height: 350, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.10) 0%, rgba(212,175,55,0.03) 40%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'editorOrbDrift1 28s ease-in-out infinite, editorOrbPulse 9s ease-in-out infinite',
        }} />
        {/* Blue orb — top right */}
        <div style={{
          position: 'absolute', top: '0%', right: '5%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(96,165,250,0.07) 0%, rgba(96,165,250,0.02) 40%, transparent 70%)',
          filter: 'blur(70px)',
          animation: 'editorOrbDrift2 35s ease-in-out infinite, editorOrbPulse 11s ease-in-out 3s infinite',
        }} />
        {/* Purple orb — center */}
        <div style={{
          position: 'absolute', top: '35%', left: '30%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, rgba(124,58,237,0.015) 40%, transparent 70%)',
          filter: 'blur(65px)',
          animation: 'editorOrbDrift3 22s ease-in-out infinite, editorOrbPulse 8s ease-in-out 1.5s infinite',
        }} />
        {/* Gold orb — bottom right */}
        <div style={{
          position: 'absolute', bottom: '5%', right: '10%',
          width: 380, height: 380, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, rgba(212,175,55,0.02) 40%, transparent 70%)',
          filter: 'blur(65px)',
          animation: 'editorOrbDrift1 32s ease-in-out infinite reverse, editorOrbPulse 10s ease-in-out 5s infinite',
        }} />
        {/* Cyan orb — bottom left */}
        <div style={{
          position: 'absolute', bottom: '10%', left: '8%',
          width: 280, height: 280, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, rgba(6,182,212,0.015) 40%, transparent 70%)',
          filter: 'blur(55px)',
          animation: 'editorOrbDrift2 26s ease-in-out infinite reverse, editorOrbPulse 7s ease-in-out 2s infinite',
        }} />
        {/* Small warm orb — mid right */}
        <div style={{
          position: 'absolute', top: '55%', right: '25%',
          width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.05) 0%, transparent 60%)',
          filter: 'blur(45px)',
          animation: 'editorOrbDrift3 18s ease-in-out infinite reverse, editorOrbPulse 6s ease-in-out 4s infinite',
        }} />
      </div>
      <style>{`
        @keyframes editorOrbDrift1 {
          0%   { transform: translate(0, 0) scale(1); }
          25%  { transform: translate(90px, -45px) scale(1.08); }
          50%  { transform: translate(170px, 25px) scale(0.94); }
          75%  { transform: translate(65px, 65px) scale(1.05); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes editorOrbDrift2 {
          0%   { transform: translate(0, 0) scale(1); }
          25%  { transform: translate(-70px, 55px) scale(1.06); }
          50%  { transform: translate(-140px, -25px) scale(0.93); }
          75%  { transform: translate(-45px, -55px) scale(1.03); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes editorOrbDrift3 {
          0%   { transform: translate(0, 0) scale(1); }
          33%  { transform: translate(110px, 55px) scale(1.07); }
          66%  { transform: translate(-55px, -35px) scale(0.95); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes editorOrbPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
        @keyframes welcomeGlassShimmer {
          0%   { background-position: 200% center; }
          50%  { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      <UpgradeNudge />

      {/* Top bar — slim 48px */}
      <EditorTopBar
        onOpenDrawer={() => setDrawerOpen(true)}
        onOpenApiKeys={() => setApiKeysOpen(true)}
        onNewChat={() => chat.newChat()}
        studioConnected={studio.isConnected}
        studioPlaceName={studio.placeName}
        onConnectStudio={() => {
          if (studio.connectFlow === 'idle' || studio.connectFlow === 'code') {
            setPublishOpen(true)
          }
          if (studio.connectFlow === 'idle') studio.generateCode()
        }}
        connectCode={studio.connectCode}
        onOpenPublish={() => setPublishOpen(true)}
        selectedModel={chat.selectedModel}
        onModelChange={chat.setSelectedModel}
      />

      {/* Main content area with optional sidebar */}
      <div style={{
        flex: '1 1 0%',
        display: 'flex',
        minHeight: 0,
        position: 'relative',
        zIndex: 1,
        overflowX: 'hidden',
      }}>
        {/* Chat / Welcome area — full-width on mobile (<768px) */}
        <div style={{ flex: '1 1 0%', display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0, width: isMobile ? '100%' : 'auto' }}>
          {!hasMessages ? (
            <>
              <WelcomeHero
                visible={!hasMessages}
                onQuickAction={handleQuickAction}
                onBuildGame={(prompt) => {
                  if (studio.isConnected && studio.sessionId) {
                    chat.triggerStepByStepBuild(prompt, studio.sessionId)
                  } else {
                    chat.sendMessage(prompt)
                  }
                }}
              />
              {/* Floating input bar on welcome screen — cyberglass */}
              <div style={{ padding: isMobile ? '0 12px 16px' : '0 20px 24px', background: 'transparent', position: 'relative', zIndex: 2 }}>
                <div style={{ maxWidth: 680, margin: '0 auto' }}>
                  <div
                    style={{
                      display: 'flex', gap: 8, alignItems: 'flex-end',
                      background: 'linear-gradient(135deg, rgba(15,20,40,0.65) 0%, rgba(20,25,50,0.55) 50%, rgba(15,20,40,0.65) 100%)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      borderRadius: 24, padding: '14px 16px 14px 22px',
                      transition: 'border-color 0.3s ease-out, box-shadow 0.3s ease-out',
                      backdropFilter: 'blur(30px) saturate(1.4)',
                      WebkitBackdropFilter: 'blur(30px) saturate(1.4)',
                      boxShadow: '0 8px 40px rgba(0,0,0,0.4), 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(255,255,255,0.03)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    onFocusCapture={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(212,175,55,0.30)'
                      e.currentTarget.style.boxShadow = '0 8px 48px rgba(0,0,0,0.45), 0 0 0 1px rgba(212,175,55,0.10), 0 0 80px rgba(212,175,55,0.06), inset 0 1px 0 rgba(255,230,160,0.12), inset 0 -1px 0 rgba(255,255,255,0.04)'
                    }}
                    onBlurCapture={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'
                      e.currentTarget.style.boxShadow = '0 8px 40px rgba(0,0,0,0.4), 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(255,255,255,0.03)'
                    }}
                  >
                    {/* Animated glass shimmer */}
                    <div aria-hidden style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.03) 40%, rgba(212,175,55,0.04) 50%, rgba(255,255,255,0.03) 60%, transparent 80%)',
                      backgroundSize: '200% 100%',
                      animation: 'welcomeGlassShimmer 6s ease-in-out infinite',
                      pointerEvents: 'none', borderRadius: 'inherit',
                    }} />
                    {/* Top highlight edge */}
                    <div aria-hidden style={{
                      position: 'absolute', top: 0, left: '10%', right: '10%', height: 1,
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
                      pointerEvents: 'none',
                    }} />
                    {/* Attach */}
                    <label
                      style={{
                        width: isMobile ? 44 : 36, height: isMobile ? 44 : 36, borderRadius: 10,
                        border: 'none', background: 'rgba(255,255,255,0.04)',
                        color: '#52525B', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#A1A1AA' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#52525B' }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                      </svg>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) chat.setImageFile(file)
                        }}
                      />
                    </label>

                    <textarea
                      ref={chat.textareaRef}
                      value={chat.input}
                      onChange={(e) => chat.setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          if (chat.input.trim()) chat.sendMessage(chat.input)
                        }
                      }}
                      placeholder="Message Forje..."
                      rows={1}
                      style={{
                        flex: 1, background: 'transparent', border: 'none',
                        padding: '8px 0', color: '#FAFAFA', fontSize: 15,
                        fontFamily: 'inherit', resize: 'none', outline: 'none',
                        lineHeight: 1.5, fontWeight: 400,
                      }}
                    />

                    {/* Send */}
                    <button
                      onClick={() => { if (chat.input.trim()) chat.sendMessage(chat.input) }}
                      disabled={chat.loading || !chat.input.trim()}
                      style={{
                        width: isMobile ? 44 : 36, height: isMobile ? 44 : 36, borderRadius: 10,
                        border: 'none',
                        background: chat.input.trim() ? '#D4AF37' : 'rgba(255,255,255,0.04)',
                        color: chat.input.trim() ? '#09090b' : '#3F3F46',
                        cursor: chat.input.trim() ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, transition: 'all 0.15s',
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="19" x2="12" y2="5" />
                        <polyline points="5 12 12 5 19 12" />
                      </svg>
                    </button>
                  </div>
                  <p style={{ textAlign: 'center', fontSize: 11, color: '#27272A', marginTop: 8 }}>
                    Forje can make mistakes. Verify builds in Studio.
                  </p>
                </div>
              </div>

              {/* System Composer — visual game system picker */}
              <div style={{ padding: '0 20px 24px', maxWidth: 680, margin: '0 auto', width: '100%' }}>
                <SystemComposer
                  onGenerate={(prompt) => {
                    if (studio.isConnected && studio.sessionId) {
                      chat.triggerStepByStepBuild(prompt, studio.sessionId)
                    } else {
                      chat.sendMessage(prompt)
                    }
                  }}
                  loading={chat.loading}
                />
              </div>
            </>
          ) : (
            <ChatPanel
              simplified
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
              onRetry={chat.resetRetryCount}
              onDismiss={chat.dismissMessage}
              onEditAndResend={chat.editAndResend}
              onSendToStudio={handleSendToStudio}
              studioConnected={studio.isConnected}
              savedAt={chat.savedAt}
              imageFile={chat.imageFile}
              onImageFile={chat.setImageFile}
              aiMode={chat.aiMode}
              onAIModeChange={chat.setAIMode}
              thinkingText={chat.thinkingText}
              isThinking={chat.isThinking}
              planText={chat.planText}
              onApprovePlan={chat.approvePlan}
              onEditPlan={chat.editPlan}
              onCancelPlan={chat.cancelPlan}
              autoEnhanceEnabled={chat.enhancePrompts}
              onAutoEnhanceToggle={chat.setEnhancePrompts}
              sessionId={chat.currentSessionId ?? undefined}
              checkpoints={chat.checkpoints}
              onSaveCheckpoint={chat.saveCheckpoint}
              onRestoreToCheckpoint={chat.restoreToCheckpoint}
              onDeleteCheckpoint={chat.removeCheckpoint}
              imageOptions={chat.imageOptions}
              onImageOptionsChange={chat.setImageOptions}
              buildDirection={chat.buildDirection}
              onBuildDirectionChange={chat.setBuildDirection}
              onBuildGame={(prompt) => {
                if (studio.isConnected && studio.sessionId) {
                  chat.triggerStepByStepBuild(prompt, studio.sessionId)
                } else {
                  chat.sendMessage(prompt)
                }
              }}
            />
          )}
        </div>

        {/* Right sidebar — AI Context */}
        {studio.isConnected && (
          <RightSidebar
            studioContext={studio.studioContext}
            open={sidebarOpen}
            onToggle={() => setSidebarOpen(v => !v)}
            isMobile={isMobile}
          />
        )}
      </div>

      {/* Console panel — collapsible bottom strip when Studio connected */}
      {studio.isConnected && (
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(10,10,10,0.95)',
          position: 'relative',
          zIndex: 2,
        }}>
          {/* Console toggle bar */}
          <button
            onClick={() => setConsoleOpen(v => !v)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 16px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: '#71717A',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="4,17 10,11 4,5" />
              <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
            <span>Console</span>
            {consoleErrors > 0 && (
              <span style={{
                background: 'rgba(239,68,68,0.2)',
                color: '#ef4444',
                fontSize: 10,
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: 8,
                minWidth: 18,
                textAlign: 'center',
              }}>
                {consoleErrors}
              </span>
            )}
            <span style={{ flex: 1 }} />
            <svg
              width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ transform: consoleOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
            >
              <polyline points="6,9 12,15 18,9" />
            </svg>
          </button>

          {/* Console content */}
          {consoleOpen && (
            <div style={{ height: 200, overflow: 'hidden' }}>
              <ConsolePanel
                sessionId={studio.sessionId}
                isConnected={studio.isConnected}
                active={consoleOpen}
              />
            </div>
          )}
        </div>
      )}

      {/* Build progress dashboard — shows for orchestrated builds (activeBuildId) or SSE step builds */}
      {(activeBuildId || (chat.stepBuildProgress?.active)) && (
        <div style={{
          position: 'fixed',
          bottom: 80,
          right: 20,
          width: isMobile ? 'calc(100% - 40px)' : 360,
          zIndex: 50,
          filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.4))',
        }}>
          <BuildProgressDashboard
            buildId={activeBuildId ?? undefined}
            directStatus={chat.stepBuildProgress}
            onComplete={(summary) => {
              setActiveBuildId(null)
              toast(summary ?? 'Build complete', 'success')
            }}
            onCancel={() => {
              setActiveBuildId(null)
              toast('Build cancelled', 'warning')
            }}
          />
        </div>
      )}

      {/* Left drawer */}
      <LeftDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sessions={sessions}
        currentSessionId={chat.currentSessionId}
        onLoadSession={chat.loadSession}
        onDeleteSession={chat.deleteSession}
        onNewChat={() => chat.newChat()}
      />

      {/* Command palette (Ctrl+K) */}
      <CommandPalette
        isOpen={cmdPaletteOpen}
        onClose={() => setCmdPaletteOpen(false)}
        onCommand={(cmd) => {
          setCmdPaletteOpen(false)
          if (cmd === 'new-chat') chat.newChat()
          else if (cmd.startsWith('load:')) chat.loadSession(cmd.slice(5))
          else chat.sendMessage(cmd)
        }}
      />

      {apiKeysOpen && <ApiKeysModal onClose={() => setApiKeysOpen(false)} />}

      <PublishPanel
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        studioConnected={studio.isConnected}
        studioPlaceName={studio.placeName}
        connectCode={studio.connectCode}
        connectFlow={studio.connectFlow}
        onGenerateCode={() => {
          if (studio.connectFlow === 'idle' || (studio.connectFlow === 'code' && studio.connectTimer <= 0)) {
            studio.generateCode()
          }
        }}
        activeBuildId={activeBuildId}
        onBuildComplete={() => {
          setActiveBuildId(null)
          toast('Build deployed to Studio', 'success')
        }}
        sessionId={studio.sessionId}
      />

      {showOnboarding && (
        <OnboardingOverlay
          onDone={dismissOnboarding}
          inputRef={chat.textareaRef}
          onPrefill={(prompt) => chat.setInput(prompt)}
          hasMessages={chat.messages.length > 0}
          studioConnected={studio.isConnected}
        />
      )}

      <PostBuildShare
        visible={showShareBar}
        prompt={lastBuildPrompt}
        onDismiss={() => setShowShareBar(false)}
      />

      <FirstBuildModal
        buildJustSucceeded={buildJustSucceeded}
        onDismiss={() => setBuildJustSucceeded(false)}
      />
    </div>
  )
}

// ─── Exported wrapper with providers ─────────────────────────────────────

export default function SimplifiedEditor() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <EditorInner />
      </ToastProvider>
    </ThemeProvider>
  )
}
