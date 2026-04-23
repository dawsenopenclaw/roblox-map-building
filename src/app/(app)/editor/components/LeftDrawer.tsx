'use client'

import { useState } from 'react'
import type { ChatSession, ChatSessionMeta } from '../hooks/useChat'

interface LeftDrawerProps {
  open: boolean
  onClose: () => void
  sessions: ChatSession[] | ChatSessionMeta[]
  currentSessionId: string | null
  onLoadSession: (id: string) => void
  onDeleteSession: (id: string) => void
  onNewChat: () => void
}

export function LeftDrawer({
  open,
  onClose,
  sessions,
  currentSessionId,
  onLoadSession,
  onDeleteSession,
  onNewChat,
}: LeftDrawerProps) {
  const [tab, setTab] = useState<'history' | 'settings'>('history')
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  if (!open) return null

  const safeLoadSession = (id: string) => {
    try { onLoadSession(id) } catch (e) { console.error('[LeftDrawer] Load session error:', e) }
    onClose()
  }
  const safeDeleteSession = (id: string) => {
    try { onDeleteSession(id) } catch (e) { console.error('[LeftDrawer] Delete session error:', e) }
  }
  const safeNewChat = () => {
    try { onNewChat() } catch (e) { console.error('[LeftDrawer] New chat error:', e) }
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 100,
          animation: 'drawerFadeIn 0.2s ease-out',
        }}
      />

      {/* Drawer — cyberglass */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: 320,
          maxWidth: '85vw',
          background: 'linear-gradient(180deg, rgba(8,10,22,0.95) 0%, rgba(5,8,16,0.98) 100%)',
          borderRight: '1px solid rgba(212,175,55,0.06)',
          backdropFilter: 'blur(24px) saturate(1.2)',
          zIndex: 101,
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Inter, sans-serif',
          animation: 'slideInLeft 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '8px 0 40px rgba(0,0,0,0.5), 0 0 60px rgba(212,175,55,0.02)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['history', 'settings'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 10,
                  border: tab === t ? '1px solid rgba(212,175,55,0.15)' : '1px solid transparent',
                  background: tab === t ? 'rgba(212,175,55,0.08)' : 'transparent',
                  color: tab === t ? '#D4AF37' : '#52525B',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  transition: 'all 0.15s',
                  boxShadow: tab === t ? '0 0 12px rgba(212,175,55,0.04)' : 'none',
                }}
                onMouseEnter={e => { if (tab !== t) e.currentTarget.style.color = '#A1A1AA' }}
                onMouseLeave={e => { if (tab !== t) e.currentTarget.style.color = '#52525B' }}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.04)',
              color: '#52525B',
              cursor: 'pointer',
              width: 32, height: 32, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#A1A1AA'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#52525B'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
            aria-label="Close drawer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px', scrollbarWidth: 'none' }}>
          {tab === 'history' && (
            <>
              <button
                onClick={safeNewChat}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 12,
                  border: '1px solid rgba(212,175,55,0.18)',
                  background: 'linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(212,175,55,0.03) 100%)',
                  color: '#D4AF37',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginBottom: 14,
                  fontFamily: 'Inter, sans-serif',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(212,175,55,0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(212,175,55,0.14) 0%, rgba(212,175,55,0.06) 100%)'
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(212,175,55,0.08)'
                  e.currentTarget.style.borderColor = 'rgba(212,175,55,0.30)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(212,175,55,0.03) 100%)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(212,175,55,0.04)'
                  e.currentTarget.style.borderColor = 'rgba(212,175,55,0.18)'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                New Chat
              </button>

              {sessions.length === 0 && (
                <div style={{ textAlign: 'center', marginTop: 40 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14, margin: '0 auto 12px',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3F3F46" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                  </div>
                  <p style={{ fontSize: 13, color: '#3F3F46' }}>No chat history yet</p>
                  <p style={{ fontSize: 11, color: '#27272A', marginTop: 4 }}>Start building to see your sessions here</p>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {sessions.map((s) => {
                  const isActive = s.id === currentSessionId
                  const isHov = hoveredId === s.id
                  return (
                    <div
                      key={s.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 12px',
                        borderRadius: 12,
                        background: isActive
                          ? 'rgba(212,175,55,0.06)'
                          : isHov ? 'rgba(255,255,255,0.03)' : 'transparent',
                        border: isActive
                          ? '1px solid rgba(212,175,55,0.12)'
                          : '1px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onClick={() => safeLoadSession(s.id)}
                      onMouseEnter={() => setHoveredId(s.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                        background: isActive ? '#D4AF37' : 'rgba(255,255,255,0.08)',
                        boxShadow: isActive ? '0 0 8px rgba(212,175,55,0.4)' : 'none',
                        transition: 'all 0.15s',
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: 13,
                          fontWeight: isActive ? 600 : 500,
                          color: isActive ? '#D4AF37' : isHov ? '#E4E4E7' : '#A1A1AA',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          margin: 0,
                          transition: 'color 0.15s',
                        }}>
                          {s.title || 'Untitled chat'}
                        </p>
                        <p style={{ fontSize: 10, color: '#52525B', margin: '3px 0 0' }}>
                          {'messages' in s ? (s.messages?.length ?? 0) : ('messageCount' in s ? (s as ChatSessionMeta).messageCount : 0)} messages
                        </p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); safeDeleteSession(s.id) }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#3F3F46',
                          cursor: 'pointer',
                          padding: '4px 6px',
                          borderRadius: 6,
                          opacity: isHov || isActive ? 1 : 0,
                          transition: 'all 0.15s',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#3F3F46'; e.currentTarget.style.background = 'transparent' }}
                        aria-label="Delete chat"
                        title="Delete"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {tab === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { href: '/settings', label: 'Account Settings', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg> },
                { href: '/dashboard', label: 'Dashboard', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></svg> },
                { href: '/download', label: 'Studio Plugin', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>, external: true },
                { href: '/docs', label: 'Documentation', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20V2H6.5A2.5 2.5 0 004 4.5v15z" /></svg>, external: true },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  target={item.external ? '_blank' : undefined}
                  rel={item.external ? 'noopener noreferrer' : undefined}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.04)',
                    background: 'rgba(255,255,255,0.02)',
                    color: '#A1A1AA',
                    fontSize: 13,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    transition: 'all 0.15s',
                    fontWeight: 500,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(212,175,55,0.04)'
                    e.currentTarget.style.borderColor = 'rgba(212,175,55,0.10)'
                    e.currentTarget.style.color = '#E4E4E7'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)'
                    e.currentTarget.style.color = '#A1A1AA'
                  }}
                >
                  {item.icon}
                  {item.label}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Footer branding */}
        <div style={{
          padding: '12px 18px',
          borderTop: '1px solid rgba(255,255,255,0.03)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '-0.02em' }}>
            <span style={{ color: '#D4AF37' }}>Forje</span>
            <span style={{ color: '#52525B' }}>Games</span>
          </span>
          <span style={{ fontSize: 10, color: '#27272A', marginLeft: 'auto' }}>v1.0 Beta</span>
        </div>
      </div>

      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); opacity: 0.8; }
          to   { transform: translateX(0); opacity: 1; }
        }
        @keyframes drawerFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </>
  )
}
