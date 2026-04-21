'use client'

import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { TokenBalanceWidget } from '@/components/TokenBalanceWidget'
import { UsageMeter } from '@/components/editor/UsageMeter'
import { useIsMobile } from '@/hooks/useMediaQuery'

interface EditorTopBarProps {
  onOpenDrawer: () => void
  onOpenApiKeys: () => void
  onNewChat?: () => void
  studioConnected: boolean
  studioPlaceName?: string | null
  onConnectStudio: () => void
  connectCode?: string
  onOpenPublish?: () => void
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
}: EditorTopBarProps) {
  const { user } = useUser()
  const isMobile = useIsMobile()

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '0 16px',
        height: 52,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(5,8,16,0.9)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        flexShrink: 0,
        fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
      }}
    >
      {/* Left: Menu + Logo + New Chat */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Hamburger */}
        <button
          onClick={onOpenDrawer}
          style={{
            background: 'transparent', border: 'none',
            color: '#52525B', cursor: 'pointer',
            padding: 6, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#A1A1AA'}
          onMouseLeave={e => e.currentTarget.style.color = '#52525B'}
          aria-label="Open menu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Logo */}
        <Link
          href="/"
          style={{
            fontSize: 16, fontWeight: 800,
            letterSpacing: '-0.02em', textDecoration: 'none',
            display: 'flex', alignItems: 'center',
          }}
        >
          <span style={{ color: '#D4AF37' }}>Forje</span>
          <span style={{ color: '#FAFAFA' }}>Games</span>
        </Link>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.06)', margin: '0 4px' }} />

        {/* New Chat */}
        {onNewChat && (
          <button
            onClick={onNewChat}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '5px 10px', borderRadius: 8,
              border: 'none',
              background: 'rgba(255,255,255,0.04)',
              color: '#71717A', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#A1A1AA' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#71717A' }}
            title="Start a new chat (Ctrl+Shift+N)"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            {!isMobile && 'New'}
          </button>
        )}
      </div>

      {/* Center spacer */}
      <div style={{ flex: 1 }} />

      {/* Right: Studio + Tokens + Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Studio connection */}
        {studioConnected ? (
          <button
            onClick={onOpenPublish}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 8,
              background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.18)',
              fontSize: 12, fontWeight: 600, color: '#22C55E',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <span style={{
              width: 6, height: 6, borderRadius: '50%', background: '#22C55E',
              boxShadow: '0 0 6px rgba(34,197,94,0.5)',
            }} />
            {isMobile ? 'Studio' : (studioPlaceName || 'Studio Connected')}
          </button>
        ) : (
          <button
            onClick={onConnectStudio}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 8,
              border: '1px solid rgba(212,175,55,0.2)',
              background: 'rgba(212,175,55,0.05)',
              fontSize: 12, fontWeight: 600, color: '#D4AF37',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,175,55,0.10)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(212,175,55,0.05)'}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
            {isMobile ? (connectCode || 'Studio') : (connectCode ? `Code: ${connectCode}` : 'Connect Studio')}
          </button>
        )}

        {/* Usage + Tokens — compact */}
        {!isMobile && <UsageMeter />}
        <TokenBalanceWidget />

        {/* More menu (API Keys + Publish) */}
        <button
          onClick={onOpenApiKeys}
          title="Settings & API Keys"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 32, height: 32, borderRadius: 8,
            border: 'none',
            background: 'rgba(255,255,255,0.03)',
            color: '#52525B', cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#A1A1AA' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#52525B' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        </button>

        {/* Avatar */}
        {user?.imageUrl && (
          <Link href="/settings" style={{ flexShrink: 0 }}>
            <img
              src={user.imageUrl}
              alt=""
              width={28}
              height={28}
              style={{
                borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.08)',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
          </Link>
        )}
      </div>
    </div>
  )
}
