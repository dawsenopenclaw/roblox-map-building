'use client'

import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { TokenBalanceWidget } from '@/components/TokenBalanceWidget'
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
        gap: isMobile ? 4 : 8,
        padding: isMobile ? '0 8px' : '0 12px',
        height: 48,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(5,8,16,0.8)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        flexShrink: 0,
        fontFamily: 'Inter, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* Hamburger + Logo */}
      <button
        onClick={onOpenDrawer}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#71717A',
          cursor: 'pointer',
          padding: 6,
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
        aria-label="Open menu"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <Link
        href="/"
        style={{
          fontSize: isMobile ? 13 : 15,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexShrink: 0,
        }}
      >
        <span style={{ color: '#D4AF37' }}>Forje</span>
        <span style={{ color: '#FAFAFA' }}>Games</span>
      </Link>

      {/* New Chat button */}
      {onNewChat && (
        <button
          onClick={onNewChat}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: isMobile ? '5px 6px' : '5px 10px',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.03)',
            color: '#A1A1AA',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s',
            fontFamily: 'Inter, sans-serif',
            flexShrink: 0,
          }}
          title="Start a new chat"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {!isMobile && 'New'}
        </button>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Studio connection — compact on mobile */}
      {studioConnected ? (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 8px',
            borderRadius: 8,
            background: 'rgba(34,197,94,0.08)',
            border: '1px solid rgba(34,197,94,0.2)',
            fontSize: 11,
            fontWeight: 600,
            color: '#22C55E',
            flexShrink: 0,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
          {isMobile ? 'Studio' : `Studio${studioPlaceName ? ` — ${studioPlaceName}` : ''}`}
        </div>
      ) : (
        <button
          onClick={onConnectStudio}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 8px',
            borderRadius: 8,
            border: '1px solid rgba(212,175,55,0.25)',
            background: 'rgba(212,175,55,0.06)',
            fontSize: 11,
            fontWeight: 700,
            color: '#D4AF37',
            cursor: 'pointer',
            transition: 'all 0.15s',
            fontFamily: 'Inter, sans-serif',
            flexShrink: 0,
          }}
          title={connectCode ? `Pairing code: ${connectCode}` : 'Connect Roblox Studio'}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
          {isMobile ? (connectCode || 'Studio') : (connectCode ? `Code: ${connectCode}` : 'Connect Studio')}
        </button>
      )}

      {/* Publish — hide label on mobile */}
      {onOpenPublish && !isMobile && (
        <button
          onClick={onOpenPublish}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            borderRadius: 8,
            border: '1px solid rgba(212,175,55,0.3)',
            background: 'linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.04))',
            fontSize: 11,
            fontWeight: 700,
            color: '#D4AF37',
            cursor: 'pointer',
            transition: 'all 0.15s',
            fontFamily: 'Inter, sans-serif',
          }}
          title="Publish to Studio"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          Publish
        </button>
      )}

      {/* BYOK — icon only on mobile */}
      <button
        onClick={onOpenApiKeys}
        title="Bring your own API keys"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? 0 : 5,
          padding: isMobile ? '5px 6px' : '5px 10px',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.03)',
          color: '#A1A1AA',
          fontSize: 11,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s',
          fontFamily: 'Inter, sans-serif',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)'
          e.currentTarget.style.color = '#D4AF37'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
          e.currentTarget.style.color = '#A1A1AA'
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
        </svg>
        {!isMobile && 'API Keys'}
      </button>

      {/* Token balance */}
      <TokenBalanceWidget />

      {/* Avatar */}
      {user?.imageUrl && (
        <Link href="/settings" style={{ flexShrink: 0 }}>
          <img
            src={user.imageUrl}
            alt=""
            width={26}
            height={26}
            style={{ borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </Link>
      )}
    </div>
  )
}
