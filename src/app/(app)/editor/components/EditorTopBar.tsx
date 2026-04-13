'use client'

import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { useState } from 'react'
import { TokenBalanceWidget } from '@/components/TokenBalanceWidget'

interface EditorTopBarProps {
  onOpenDrawer: () => void
  onOpenApiKeys: () => void
}

export function EditorTopBar({ onOpenDrawer, onOpenApiKeys }: EditorTopBarProps) {
  const { user } = useUser()

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 16px',
        height: 48,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(5,8,16,0.8)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        flexShrink: 0,
        fontFamily: 'Inter, sans-serif',
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
          fontSize: 15,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <span style={{ color: '#D4AF37' }}>Forje</span>
        <span style={{ color: '#FAFAFA' }}>Games</span>
      </Link>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* BYOK button */}
      <button
        onClick={onOpenApiKeys}
        title="Bring your own API keys"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '5px 10px',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.03)',
          color: '#A1A1AA',
          fontSize: 11,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s',
          fontFamily: 'Inter, sans-serif',
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
        API Keys
      </button>

      {/* Token balance */}
      <TokenBalanceWidget />

      {/* Profile avatar */}
      {user?.imageUrl && (
        <Link href="/settings" title="Settings">
          <img
            src={user.imageUrl}
            alt=""
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          />
        </Link>
      )}
    </div>
  )
}
