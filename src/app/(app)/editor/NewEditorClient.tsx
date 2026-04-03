'use client'

import React, { useState, useCallback } from 'react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { SpaceBackground } from '@/components/editor/SpaceBackground'
import { ChatPanel } from '@/components/editor/ChatPanel'
import { StudioPanel } from '@/components/editor/StudioPanel'
import { useChat } from './hooks/useChat'
import { useStudioConnection } from './hooks/useStudioConnection'
import { OnboardingOverlay, useOnboardingOverlay } from './components/OnboardingOverlay'
// ↑ Onboarding: 5-step first-visit walkthrough with spotlight highlighting

// ─── Top Bar ──────────────────────────────────────────────────────────────────

interface TopBarProps {
  isConnected: boolean
  placeName: string
  totalTokens: number
}

function TopBar({ isConnected, placeName, totalTokens }: TopBarProps) {
  const { user } = useUser()

  return (
    <div
      style={{
        flexShrink: 0,
        height: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        background: 'rgba(8,12,28,0.8)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        zIndex: 10,
      }}
    >
      {/* Left: Logo */}
      <Link href="/editor" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#FFB81C', letterSpacing: '-0.02em' }}>Forje</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'white', letterSpacing: '-0.02em' }}>Games</span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginLeft: 6 }}>Editor</span>
      </Link>

      {/* Right: status indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {totalTokens > 0 && (
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontVariantNumeric: 'tabular-nums' }}>
            {totalTokens.toLocaleString()} tokens
          </span>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{
            width: 5, height: 5, borderRadius: '50%',
            background: isConnected ? '#4ADE80' : 'rgba(255,255,255,0.15)',
            boxShadow: isConnected ? '0 0 6px rgba(74,222,128,0.5)' : 'none',
          }} />
          <span style={{ fontSize: 11, color: isConnected ? 'rgba(74,222,128,0.8)' : 'rgba(255,255,255,0.25)' }}>
            {isConnected ? (placeName || 'Connected') : 'Offline'}
          </span>
        </div>

        {user && (
          <Link href="/settings" style={{ textDecoration: 'none' }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}>
              {user.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.imageUrl} alt={user.fullName ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>
                  {(user.firstName?.[0] ?? user.emailAddresses?.[0]?.emailAddress?.[0] ?? '?').toUpperCase()}
                </span>
              )}
            </div>
          </Link>
        )}
      </div>
    </div>
  )
}

// ─── Mobile Tab Switcher ──────────────────────────────────────────────────────

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
    <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
      {(['chat', 'studio'] as const).map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          style={{
            flex: 1, padding: '10px 0', border: 'none', background: 'transparent',
            borderBottom: `2px solid ${activeTab === tab ? '#FFB81C' : 'transparent'}`,
            color: activeTab === tab ? 'white' : 'rgba(255,255,255,0.3)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
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

// ─── Main Editor ──────────────────────────────────────────────────────────────

export default function NewEditorClient() {
  const [mobileTab, setMobileTab] = useState<'chat' | 'studio'>('chat')

  // Onboarding overlay — only shows once (localStorage flag)
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
        studio.addActivity(`Build executed in Studio`)
      } catch {
        studio.addActivity(`Studio execution failed`)
      }
    },
    [studio],
  )

  // Chat — pass Studio context so AI knows camera position + nearby objects
  const chat = useChat({
    onBuildComplete: handleBuildComplete,
    studioSessionId: studio.sessionId,
    studioConnected: studio.isConnected,
    studioContext: studio.studioContext,
  })

  // ── Build-error action handlers ────────────────────────────────────────────

  /** "Try again" — resets the retry counter then re-sends the last build prompt */
  const handleRetry = useCallback(() => {
    chat.resetRetryCount()
    // Re-send the input (user can edit first, or we pull from the last user message)
    const lastUserMsg = [...chat.messages].reverse().find((m) => m.role === 'user')
    if (lastUserMsg) {
      void chat.sendMessage(lastUserMsg.content)
    }
  }, [chat])

  /** "Build it differently" — clears the input field so user can rephrase */
  const handleBuildDifferently = useCallback(() => {
    chat.resetRetryCount()
    chat.setInput('')
    setTimeout(() => chat.textareaRef.current?.focus(), 50)
  }, [chat])

  /** "Skip this" — removes the error card from the message list */
  const handleDismissError = useCallback((id: string) => {
    chat.dismissMessage(id)
    chat.resetRetryCount()
    setTimeout(() => chat.textareaRef.current?.focus(), 50)
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
      {/* Onboarding — 5-step spotlight walkthrough, first visit only */}
      {showOnboarding && (
        <OnboardingOverlay onDone={dismissOnboarding} inputRef={chat.textareaRef} />
      )}

      {/* Animated space background */}
      <SpaceBackground />

      {/* Content layer */}
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

        {/* Mobile tab bar (hidden on desktop) */}
        <div className="flex md:hidden">
          <MobileTabBar
            activeTab={mobileTab}
            onChange={setMobileTab}
            isConnected={studio.isConnected}
          />
        </div>

        {/* Two-panel layout */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            overflow: 'hidden',
            padding: 10,
            gap: 10,
          }}
        >
          {/* LEFT: Chat panel — 45% on desktop, full on mobile chat tab */}
          <div
            className={mobileTab === 'studio' ? 'hidden md:flex' : 'flex'}
            style={{
              flex: '0 0 45%',
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
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
            />
          </div>

          {/* RIGHT: Studio panel — 55% on desktop, full on mobile studio tab */}
          <div
            className={mobileTab === 'chat' ? 'hidden md:flex' : 'flex'}
            style={{
              flex: '1 1 0%',
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <StudioPanel
              isConnected={studio.isConnected}
              connectFlow={studio.connectFlow}
              connectCode={studio.connectCode}
              connectTimer={studio.connectTimer}
              screenshotUrl={studio.screenshotUrl}
              placeName={studio.placeName}
              activity={studio.activity}
              commandsSent={studio.commandsSent}
              onGenerateCode={studio.generateCode}
              onConfirmConnected={studio.confirmConnected}
              onDisconnect={studio.disconnect}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
