'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { SpaceBackground } from '@/components/editor/SpaceBackground'
import { ChatPanel } from '@/components/editor/ChatPanel'
import { StudioPanel } from '@/components/editor/StudioPanel'
import { useChat } from './hooks/useChat'
import { useStudioConnection, type StudioActivity } from './hooks/useStudioConnection'
import { OnboardingOverlay, useOnboardingOverlay } from './components/OnboardingOverlay'

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

// ─── Sidebar Button ──────────────────────────────────────────────────────────

function SidebarButton({
  icon,
  label,
  active,
  onClick,
  badge,
}: {
  icon: React.ReactNode
  label: string
  active?: boolean
  onClick: () => void
  badge?: string
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={label}
      style={{
        position: 'relative',
        width: 40,
        height: 40,
        borderRadius: 10,
        border: 'none',
        background: active
          ? 'rgba(212,175,55,0.12)'
          : hovered
            ? 'rgba(255,255,255,0.06)'
            : 'transparent',
        color: active ? '#FFB81C' : hovered ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.15s ease-out',
      }}
    >
      {icon}
      {badge && (
        <div
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#4ADE80',
            boxShadow: '0 0 4px rgba(74,222,128,0.6)',
          }}
        />
      )}
    </button>
  )
}

// ─── Agent Activity Strip ────────────────────────────────────────────────────

function AgentStrip({ loading }: { loading: boolean }) {
  if (!loading) return null

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 16px',
        background: 'rgba(8,12,28,0.6)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#FFB81C',
          animation: 'agentPulse 1.5s ease-in-out infinite',
        }}
      />
      <span
        style={{
          fontSize: 11,
          color: 'rgba(255,184,28,0.8)',
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 500,
          letterSpacing: '0.02em',
        }}
      >
        Forje is building...
      </span>
      <style>{`
        @keyframes agentPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
      `}</style>
    </div>
  )
}

// ─── Viewport (Studio preview / placeholder) ─────────────────────────────────

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
  activity,
  commandsSent,
  expanded,
  onToggleExpand,
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
  activity: StudioActivity[]
  commandsSent: number
  expanded: boolean
  onToggleExpand: () => void
}) {
  if (!isConnected) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <StudioPanel
          isConnected={isConnected}
          connectFlow={connectFlow as 'idle' | 'generating' | 'code' | 'connected'}
          connectCode={connectCode}
          connectTimer={connectTimer}
          screenshotUrl={screenshotUrl}
          placeName={placeName}
          activity={activity}
          commandsSent={commandsSent}
          onGenerateCode={onGenerateCode}
          onConfirmConnected={onConfirmConnected}
          onDisconnect={onDisconnect}
        />
      </div>
    )
  }

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
      {/* Live Studio screenshot */}
      {screenshotUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={screenshotUrl}
          alt="Studio viewport"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'rgba(74,222,128,0.08)',
              border: '1px solid rgba(74,222,128,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M11 2l2.5 5.5H19l-4.5 3 1.5 5.5L11 13l-5 3 1.5-5.5L3 7.5h5.5L11 2z" fill="#4ADE80" opacity={0.8}/>
            </svg>
          </div>
          <span style={{ fontSize: 13, color: 'rgba(74,222,128,0.7)', fontWeight: 600 }}>
            Connected to {placeName || 'Studio'}
          </span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
            {commandsSent} commands sent
          </span>
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 10px',
            borderRadius: 8,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(74,222,128,0.2)',
            pointerEvents: 'auto',
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#4ADE80',
              boxShadow: '0 0 6px rgba(74,222,128,0.5)',
            }}
          />
          <span style={{ fontSize: 11, color: 'rgba(74,222,128,0.9)', fontWeight: 500 }}>
            {placeName || 'Studio'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 6, pointerEvents: 'auto' }}>
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
            }}
            title={expanded ? 'Restore' : 'Expand viewport'}
          >
            {expanded ? <IconMinimize /> : <IconMaximize />}
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

      {/* Activity feed overlay */}
      {activity.length > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            maxWidth: 300,
          }}
        >
          {activity.slice(-3).map((a) => (
            <div
              key={a.id}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                background: 'rgba(0,0,0,0.65)',
                backdropFilter: 'blur(8px)',
                fontSize: 11,
                color: 'rgba(255,255,255,0.5)',
                fontFamily: "'JetBrains Mono', monospace",
                animation: 'fadeUp 0.3s ease-out',
              }}
            >
              {a.message}
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
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
}: {
  isConnected: boolean
  placeName: string
  totalTokens: number
}) {
  const { user } = useUser()

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
        zIndex: 10,
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Left: Logo */}
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

      {/* Center: Connection + project name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {isConnected && placeName && (
          <div
            style={{
              padding: '3px 10px',
              borderRadius: 6,
              background: 'rgba(74,222,128,0.06)',
              border: '1px solid rgba(74,222,128,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <div
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: '#4ADE80',
                boxShadow: '0 0 4px rgba(74,222,128,0.5)',
              }}
            />
            <span style={{ fontSize: 11, color: 'rgba(74,222,128,0.8)', fontWeight: 500 }}>
              {placeName}
            </span>
          </div>
        )}
      </div>

      {/* Right: tokens + avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {totalTokens > 0 && (
          <span
            style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.2)',
              fontVariantNumeric: 'tabular-nums',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {totalTokens.toLocaleString()} tokens
          </span>
        )}

        {!isConnected && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 8px',
              borderRadius: 6,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
              }}
            />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>Offline</span>
          </div>
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
            borderBottom: `2px solid ${activeTab === tab ? '#FFB81C' : 'transparent'}`,
            color: activeTab === tab ? 'white' : 'rgba(255,255,255,0.3)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            transition: 'color 0.15s',
          }}
        >
          {tab === 'studio' && isConnected && (
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ADE80' }} />
          )}
          {tab === 'chat' ? 'Chat' : 'Studio'}
        </button>
      ))}
    </div>
  )
}

// ─── Main Editor ─────────────────────────────────────────────────────────────

export default function NewEditorClient() {
  const [mobileTab, setMobileTab] = useState<'chat' | 'studio'>('chat')
  const [viewportExpanded, setViewportExpanded] = useState(false)
  const [sidebarPanel, setSidebarPanel] = useState<string | null>(null)
  const chatPanelRef = useRef<HTMLDivElement>(null)

  // Onboarding overlay
  const { shouldShow: showOnboarding, dismiss: dismissOnboarding } = useOnboardingOverlay()

  // Studio connection
  const studio = useStudioConnection()

  // Execute Luau in Studio after AI build
  const handleBuildComplete = useCallback(
    async (luauCode: string, prompt: string, sessionId: string | null) => {
      studio.recordCommand(`Executing: ${prompt.slice(0, 60)}${prompt.length > 60 ? '...' : ''}`)
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (studio.jwt) headers['Authorization'] = `Bearer ${studio.jwt}`
        await fetch('/api/studio/execute', {
          method: 'POST',
          headers,
          body: JSON.stringify({ code: luauCode, prompt, sessionId }),
        })
        studio.addActivity('Build executed in Studio')
      } catch {
        studio.addActivity('Studio execution failed')
      }
    },
    [studio],
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

  // Chat panel height calculation
  const chatHeight = viewportExpanded ? 56 : 340

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
              padding: '8px 0 8px 8px',
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
                activity={studio.activity}
                commandsSent={studio.commandsSent}
                expanded={viewportExpanded}
                onToggleExpand={() => setViewportExpanded((v) => !v)}
              />
            </div>

            {/* Agent activity strip */}
            <AgentStrip loading={chat.loading} />

            {/* Chat panel — bottom portion */}
            <div
              ref={chatPanelRef}
              className={mobileTab === 'studio' ? 'hidden md:flex' : 'flex'}
              style={{
                flexShrink: 0,
                height: chatHeight,
                minHeight: 160,
                maxHeight: viewportExpanded ? 56 : 500,
                display: 'flex',
                flexDirection: 'column',
                transition: 'height 0.25s ease-out',
                padding: '8px 0 0',
              }}
            >
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
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                      <p style={{ margin: 0 }}>Your recent builds will appear here.</p>
                    </div>
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
                        }}
                      >
                        Keyboard: Enter to send, Shift+Enter for new line
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Icon rail */}
            <div
              style={{
                width: 56,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                paddingTop: 12,
                gap: 4,
                background: 'rgba(8,12,28,0.5)',
                borderLeft: '1px solid rgba(255,255,255,0.03)',
              }}
            >
              <SidebarButton
                icon={<IconStore />}
                label="Marketplace"
                active={sidebarPanel === 'marketplace'}
                onClick={() => toggleSidebar('marketplace')}
              />
              <SidebarButton
                icon={<IconHistory />}
                label="Build History"
                active={sidebarPanel === 'history'}
                onClick={() => toggleSidebar('history')}
              />
              <SidebarButton
                icon={<IconSettings />}
                label="Settings"
                active={sidebarPanel === 'settings'}
                onClick={() => toggleSidebar('settings')}
              />

              <div style={{ flex: 1 }} />

              <SidebarButton
                icon={<IconHelp />}
                label="Help"
                active={sidebarPanel === 'help'}
                onClick={() => toggleSidebar('help')}
              />
              <div style={{ height: 8 }} />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(12px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
