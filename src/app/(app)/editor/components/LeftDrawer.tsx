'use client'

import { useState } from 'react'
import type { ChatSession, ChatSessionMeta } from '../hooks/useChat'

interface LeftDrawerProps {
  open: boolean
  onClose: () => void
  // Chat history — accepts either full sessions or lightweight metadata
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

  if (!open) return null

  // Safe wrappers to prevent crashes from bubbling up
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
          background: 'rgba(0,0,0,0.6)',
          zIndex: 100,
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: 300,
          maxWidth: '85vw',
          background: '#0A0E1A',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          zIndex: 101,
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Inter, sans-serif',
          animation: 'slideInLeft 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => setTab('history')}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: 'none',
                background: tab === 'history' ? 'rgba(212,175,55,0.1)' : 'transparent',
                color: tab === 'history' ? '#D4AF37' : '#71717A',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              History
            </button>
            <button
              onClick={() => setTab('settings')}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: 'none',
                background: tab === 'settings' ? 'rgba(212,175,55,0.1)' : 'transparent',
                color: tab === 'settings' ? '#D4AF37' : '#71717A',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Settings
            </button>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#71717A',
              cursor: 'pointer',
              fontSize: 18,
              padding: '4px 8px',
            }}
            aria-label="Close drawer"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>
          {tab === 'history' && (
            <>
              <button
                onClick={safeNewChat}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(212,175,55,0.25)',
                  background: 'rgba(212,175,55,0.06)',
                  color: '#D4AF37',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginBottom: 12,
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                + New Chat
              </button>

              {sessions.length === 0 && (
                <p style={{ fontSize: 12, color: '#52525B', textAlign: 'center', marginTop: 24 }}>
                  No chat history yet
                </p>
              )}

              {sessions.map((s) => (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 10px',
                    borderRadius: 8,
                    marginBottom: 4,
                    background: s.id === currentSessionId ? 'rgba(212,175,55,0.08)' : 'transparent',
                    border: s.id === currentSessionId ? '1px solid rgba(212,175,55,0.15)' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onClick={() => safeLoadSession(s.id)}
                  onMouseEnter={(e) => {
                    if (s.id !== currentSessionId) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                  }}
                  onMouseLeave={(e) => {
                    if (s.id !== currentSessionId) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: s.id === currentSessionId ? '#D4AF37' : '#D4D4D8',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      margin: 0,
                    }}>
                      {s.title || 'Untitled chat'}
                    </p>
                    <p style={{ fontSize: 10, color: '#52525B', margin: '2px 0 0' }}>
                      {'messages' in s ? (s.messages?.length ?? 0) : ('messageCount' in s ? (s as ChatSessionMeta).messageCount : 0)} messages
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); safeDeleteSession(s.id) }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#52525B',
                      cursor: 'pointer',
                      fontSize: 14,
                      padding: '2px 6px',
                      borderRadius: 4,
                    }}
                    aria-label="Delete chat"
                    title="Delete"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </>
          )}

          {tab === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <a
                href="/settings"
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.02)',
                  color: '#D4D4D8',
                  fontSize: 12,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
                Account Settings
              </a>
              <a
                href="/dashboard"
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.02)',
                  color: '#D4D4D8',
                  fontSize: 12,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                </svg>
                Dashboard
              </a>
              <a
                href="/download"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.02)',
                  color: '#D4D4D8',
                  fontSize: 12,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
                Studio Plugin
              </a>
              <a
                href="/docs"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.02)',
                  color: '#D4D4D8',
                  fontSize: 12,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z" />
                </svg>
                Documentation
              </a>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  )
}
