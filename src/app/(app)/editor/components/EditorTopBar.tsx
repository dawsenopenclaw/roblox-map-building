'use client'

import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { TokenBalanceWidget } from '@/components/TokenBalanceWidget'
import { ForjeLogo } from '@/components/ForjeLogo'
import { useIsMobile } from '@/hooks/useMediaQuery'
import type { ModelId } from '@/app/(app)/editor/hooks/useChat'
import { MODELS } from '@/app/(app)/editor/hooks/useChat'
import { useState, useRef, useEffect } from 'react'

interface EditorTopBarProps {
  onOpenDrawer: () => void
  onOpenApiKeys: () => void
  onNewChat?: () => void
  studioConnected: boolean
  studioPlaceName?: string | null
  onConnectStudio: () => void
  connectCode?: string
  onOpenPublish?: () => void
  selectedModel?: ModelId
  onModelChange?: (id: ModelId) => void
}

export function EditorTopBar({
  onOpenDrawer,
  onOpenApiKeys,
  onNewChat,
  studioConnected,
  studioPlaceName,
  onConnectStudio,
  connectCode,
  onOpenPublish,
  selectedModel,
  onModelChange,
}: EditorTopBarProps) {
  const { user } = useUser()
  const isMobile = useIsMobile()
  const [modelOpen, setModelOpen] = useState(false)
  const modelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!modelOpen) return
    const handler = (e: MouseEvent) => {
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) {
        setModelOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [modelOpen])

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 20px',
        height: 52,
        borderBottom: '1px solid rgba(212,175,55,0.06)',
        background: 'rgba(5,8,16,0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        flexShrink: 0,
        fontFamily: 'var(--font-geist-sans, Inter, -apple-system, BlinkMacSystemFont, sans-serif)',
        zIndex: 20,
        boxShadow: '0 1px 20px rgba(212,175,55,0.03), 0 4px 40px rgba(0,0,0,0.4)',
        position: 'relative',
      }}
    >
      {/* Subtle top-bar glow line */}
      <div aria-hidden style={{
        position: 'absolute',
        bottom: -1,
        left: '10%',
        right: '10%',
        height: 1,
        background: 'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.15) 30%, rgba(212,175,55,0.25) 50%, rgba(212,175,55,0.15) 70%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      {/* ── Left: Hamburger + Logo ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={onOpenDrawer}
          style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)',
            color: '#71717A', cursor: 'pointer',
            padding: 6, borderRadius: 10, width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#D4AF37'
            e.currentTarget.style.background = 'rgba(212,175,55,0.06)'
            e.currentTarget.style.borderColor = 'rgba(212,175,55,0.15)'
            e.currentTarget.style.boxShadow = '0 0 12px rgba(212,175,55,0.08)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = '#71717A'
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)'
            e.currentTarget.style.boxShadow = 'none'
          }}
          aria-label="Open session history"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <Link
          href="/"
          style={{
            fontSize: 17, fontWeight: 800,
            letterSpacing: '-0.02em', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 1,
          }}
        >
          <ForjeLogo size={17} style={{ textShadow: '0 0 20px rgba(212,175,55,0.3)' }} />
        </Link>
      </div>

      {/* ── Center: Studio Connection Status ── */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        {studioConnected ? (
          <button
            onClick={onOpenPublish}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 18px', borderRadius: 20,
              background: 'rgba(34,197,94,0.06)',
              border: '1px solid rgba(34,197,94,0.15)',
              fontSize: 13, fontWeight: 600, color: '#22C55E',
              cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: '0 0 16px rgba(34,197,94,0.06)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(34,197,94,0.12)'
              e.currentTarget.style.boxShadow = '0 0 24px rgba(34,197,94,0.12)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(34,197,94,0.06)'
              e.currentTarget.style.boxShadow = '0 0 16px rgba(34,197,94,0.06)'
            }}
          >
            <span style={{
              width: 8, height: 8, borderRadius: '50%', background: '#22C55E',
              boxShadow: '0 0 8px rgba(34,197,94,0.6), 0 0 20px rgba(34,197,94,0.3)',
              animation: 'studioGlow 2s ease-in-out infinite',
            }} />
            {isMobile ? 'Studio' : (studioPlaceName || 'Studio Connected')}
          </button>
        ) : (
          <button
            onClick={onConnectStudio}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 18px', borderRadius: 20,
              border: '1px solid rgba(212,175,55,0.15)',
              background: 'rgba(212,175,55,0.04)',
              fontSize: 13, fontWeight: 600, color: '#D4AF37',
              cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: '0 0 12px rgba(212,175,55,0.04)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(212,175,55,0.10)'
              e.currentTarget.style.boxShadow = '0 0 20px rgba(212,175,55,0.10)'
              e.currentTarget.style.borderColor = 'rgba(212,175,55,0.30)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(212,175,55,0.04)'
              e.currentTarget.style.boxShadow = '0 0 12px rgba(212,175,55,0.04)'
              e.currentTarget.style.borderColor = 'rgba(212,175,55,0.15)'
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
            {isMobile ? (connectCode || 'Studio') : (connectCode ? `Code: ${connectCode}` : 'Connect Studio')}
          </button>
        )}
      </div>

      {/* ── Right: Tokens + Model + Settings + New Chat ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <TokenBalanceWidget compact />

        {/* Model selector */}
        {selectedModel && onModelChange && (
          <div ref={modelRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setModelOpen(v => !v)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '5px 12px', borderRadius: 10,
                border: modelOpen ? '1px solid rgba(212,175,55,0.25)' : '1px solid rgba(255,255,255,0.06)',
                background: modelOpen ? 'rgba(212,175,55,0.06)' : 'rgba(255,255,255,0.03)',
                color: modelOpen ? '#D4AF37' : '#8B8B9E',
                fontSize: 12, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s',
                fontFamily: 'inherit',
                boxShadow: modelOpen ? '0 0 16px rgba(212,175,55,0.06)' : 'none',
              }}
              onMouseEnter={e => { if (!modelOpen) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#C4C4D4' } }}
              onMouseLeave={e => { if (!modelOpen) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#8B8B9E' } }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              {!isMobile && (
                <span>{MODELS.find(m => m.id === selectedModel)?.label?.split(' ')[0] || 'Gemini'}</span>
              )}
              <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 5l3 3 3-3" />
              </svg>
            </button>

            {modelOpen && (
              <div
                style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 8,
                  background: 'rgba(8,10,22,0.95)',
                  backdropFilter: 'blur(24px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 14, padding: 6,
                  minWidth: 200, zIndex: 50,
                  boxShadow: '0 12px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,175,55,0.04)',
                  animation: 'dropdownIn 0.15s ease-out',
                }}
              >
                {MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => { onModelChange(model.id); setModelOpen(false) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      width: '100%', padding: '9px 14px', borderRadius: 10,
                      border: 'none', cursor: 'pointer',
                      background: selectedModel === model.id ? 'rgba(212,175,55,0.10)' : 'transparent',
                      color: selectedModel === model.id ? '#D4AF37' : '#A1A1AA',
                      fontSize: 13, fontWeight: 500, textAlign: 'left',
                      transition: 'all 0.15s', fontFamily: 'inherit',
                    }}
                    onMouseEnter={e => { if (selectedModel !== model.id) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#E4E4E7' } }}
                    onMouseLeave={e => { if (selectedModel !== model.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#A1A1AA' } }}
                  >
                    <span style={{ flex: 1 }}>{model.label}</span>
                    {selectedModel === model.id && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings */}
        <button
          onClick={onOpenApiKeys}
          title="Settings & API Keys"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 36, height: 36, borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.04)',
            background: 'rgba(255,255,255,0.03)',
            color: '#52525B', cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(212,175,55,0.06)'
            e.currentTarget.style.color = '#D4AF37'
            e.currentTarget.style.borderColor = 'rgba(212,175,55,0.15)'
            e.currentTarget.style.boxShadow = '0 0 12px rgba(212,175,55,0.06)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
            e.currentTarget.style.color = '#52525B'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.32 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        </button>

        {/* New chat */}
        {onNewChat && (
          <button
            onClick={onNewChat}
            title="New chat (Ctrl+Shift+N)"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: 10,
              border: '1px solid rgba(212,175,55,0.12)',
              background: 'rgba(212,175,55,0.06)',
              color: '#D4AF37', cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 0 8px rgba(212,175,55,0.04)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(212,175,55,0.14)'
              e.currentTarget.style.boxShadow = '0 0 20px rgba(212,175,55,0.12)'
              e.currentTarget.style.borderColor = 'rgba(212,175,55,0.30)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(212,175,55,0.06)'
              e.currentTarget.style.boxShadow = '0 0 8px rgba(212,175,55,0.04)'
              e.currentTarget.style.borderColor = 'rgba(212,175,55,0.12)'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        )}

        {/* Avatar */}
        {user?.imageUrl && (
          <Link href="/settings" style={{ flexShrink: 0, marginLeft: 2 }}>
            <img
              src={user.imageUrl}
              alt=""
              width={30}
              height={30}
              style={{
                borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.06)',
                transition: 'all 0.2s',
                boxShadow: '0 0 0 0 rgba(212,175,55,0)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)'
                e.currentTarget.style.boxShadow = '0 0 16px rgba(212,175,55,0.15)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                e.currentTarget.style.boxShadow = '0 0 0 0 rgba(212,175,55,0)'
              }}
            />
          </Link>
        )}
      </div>

      <style>{`
        @keyframes studioGlow {
          0%, 100% { box-shadow: 0 0 6px rgba(34,197,94,0.3), 0 0 16px rgba(34,197,94,0.15); }
          50% { box-shadow: 0 0 12px rgba(34,197,94,0.6), 0 0 28px rgba(34,197,94,0.3); }
        }
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}
