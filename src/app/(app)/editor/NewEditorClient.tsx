'use client'

import React, { useState, useCallback } from 'react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { SpaceBackground } from '@/components/editor/SpaceBackground'
import { ChatPanel } from '@/components/editor/ChatPanel'
import { StudioPanel } from '@/components/editor/StudioPanel'
import { useChat } from './hooks/useChat'
import { useStudioConnection } from './hooks/useStudioConnection'

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
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        background: 'rgba(255,255,255,0.02)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        zIndex: 10,
      }}
    >
      {/* Left: Logo + project name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Link
          href="/dashboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              background: 'linear-gradient(135deg, #D4AF37 0%, #FFB81C 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(212,175,55,0.25)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="#030712">
              <path d="M8 1.5L10 6H14.5L11 8.5l1.5 4.5L8 10.5l-4.5 2.5L5 8.5 1.5 6H6L8 1.5z"/>
            </svg>
          </div>
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: 'white',
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '-0.02em',
            }}
          >
            ForjeGames
          </span>
        </Link>

        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)' }} />

        <span
          style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.45)',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Editor
        </span>
      </div>

      {/* Right: connection status + token counter + user */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Token counter */}
        {totalTokens > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <circle cx="5" cy="5" r="4" stroke="rgba(255,184,28,0.6)" strokeWidth="1.2"/>
              <path d="M5 3v2l1.5 1" stroke="rgba(255,184,28,0.6)" strokeWidth="1.1" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'Inter, sans-serif' }}>
              {totalTokens.toLocaleString()}
            </span>
          </div>
        )}

        {/* Connection status dot */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 8,
            background: isConnected ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${isConnected ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.06)'}`,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: isConnected ? '#4ADE80' : 'rgba(255,255,255,0.2)',
              boxShadow: isConnected ? '0 0 6px #4ADE80' : 'none',
            }}
          />
          <span style={{ fontSize: 11, color: isConnected ? 'rgba(74,222,128,0.9)' : 'rgba(255,255,255,0.3)', fontFamily: 'Inter, sans-serif' }}>
            {isConnected ? (placeName || 'Studio Connected') : 'Studio Offline'}
          </span>
        </div>

        {/* User avatar */}
        {user && (
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {user.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.imageUrl} alt={user.fullName ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 12, fontWeight: 700, color: 'white', fontFamily: 'Inter, sans-serif' }}>
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
    <div
      style={{
        display: 'flex',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)',
        flexShrink: 0,
      }}
    >
      {(['chat', 'studio'] as const).map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          style={{
            flex: 1,
            padding: '12px 0',
            border: 'none',
            background: 'transparent',
            borderBottom: `2px solid ${activeTab === tab ? '#FFB81C' : 'transparent'}`,
            color: activeTab === tab ? '#FFB81C' : 'rgba(255,255,255,0.35)',
            fontSize: 13,
            fontWeight: activeTab === tab ? 700 : 500,
            fontFamily: 'Inter, sans-serif',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'all 0.15s',
          }}
        >
          {tab === 'studio' && isConnected && (
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80', boxShadow: '0 0 6px #4ADE80' }} />
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

  // Studio connection
  const studio = useStudioConnection()

  // Execute Luau in Studio after AI build
  const handleBuildComplete = useCallback(
    async (luauCode: string, prompt: string, sessionId: string | null) => {
      studio.recordCommand(`Executing: ${prompt.slice(0, 60)}${prompt.length > 60 ? '...' : ''}`)
      try {
        await fetch('/api/studio/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
            padding: '12px',
            gap: '12px',
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
