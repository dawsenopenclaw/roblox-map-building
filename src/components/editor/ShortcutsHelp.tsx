'use client'

import React from 'react'
import { SHORTCUTS } from '@/app/(app)/editor/hooks/useEditorKeyboard'

interface ShortcutsHelpProps {
  isOpen: boolean
  onClose: () => void
}

const kbdStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 6px',
  borderRadius: 4,
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.12)',
  fontSize: 11,
  fontFamily: "'JetBrains Mono', monospace",
  color: 'rgba(255,255,255,0.6)',
  minWidth: 20,
  textAlign: 'center' as const,
}

export function ShortcutsHelp({ isOpen, onClose }: ShortcutsHelpProps) {
  if (!isOpen) return null

  const categories = [...new Set(SHORTCUTS.map((s) => s.category))]

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 9000,
          animation: 'fadeIn 0.15s ease-out',
        }}
      />
      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9001,
          width: 420,
          maxWidth: '90vw',
          maxHeight: '80vh',
          background: 'rgba(10,14,30,0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
          overflow: 'hidden',
          animation: 'scaleIn 0.2s ease-out',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: 'rgba(212,175,55,0.1)',
                border: '1px solid rgba(212,175,55,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="5" width="12" height="8" rx="1.5" stroke="#FFB81C" strokeWidth="1.3"/>
                <rect x="3" y="7" width="2" height="1.5" rx="0.3" fill="#FFB81C" opacity={0.5}/>
                <rect x="6" y="7" width="2" height="1.5" rx="0.3" fill="#FFB81C" opacity={0.5}/>
                <rect x="9" y="7" width="2" height="1.5" rx="0.3" fill="#FFB81C" opacity={0.5}/>
                <rect x="4" y="10" width="6" height="1.5" rx="0.3" fill="#FFB81C" opacity={0.5}/>
              </svg>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>Keyboard Shortcuts</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.3)',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 3l8 8M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Shortcuts list */}
        <div style={{ padding: '12px 20px 20px', overflowY: 'auto', maxHeight: 'calc(80vh - 60px)' }}>
          {categories.map((cat) => (
            <div key={cat} style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'rgba(212,175,55,0.6)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 8,
                }}
              >
                {cat}
              </div>
              {SHORTCUTS.filter((s) => s.category === cat).map((shortcut, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                  }}
                >
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{shortcut.label}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {shortcut.keys.map((key, j) => (
                      <React.Fragment key={j}>
                        {j > 0 && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', lineHeight: '22px' }}>+</span>}
                        <kbd style={kbdStyle}>{key}</kbd>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Footer hint */}
          <div
            style={{
              marginTop: 8,
              padding: '8px 12px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)',
              fontSize: 11,
              color: 'rgba(255,255,255,0.25)',
              textAlign: 'center',
            }}
          >
            Press <kbd style={{ ...kbdStyle, fontSize: 10 }}>?</kbd> anytime to toggle this panel
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </>
  )
}
