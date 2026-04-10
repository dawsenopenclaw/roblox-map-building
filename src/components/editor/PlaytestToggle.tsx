'use client'

import React from 'react'

interface PlaytestToggleProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
  studioConnected: boolean
}

/**
 * Toggle for autonomous playtesting — sits next to the send button.
 * When enabled, every AI-generated code block is automatically:
 * 1. Sent to Studio
 * 2. Playtested
 * 3. Errors captured
 * 4. Code fixed
 * 5. Retested (up to 3x)
 *
 * No human needed.
 */
export function PlaytestToggle({ enabled, onToggle, studioConnected }: PlaytestToggleProps) {
  if (!studioConnected) return null

  return (
    <button
      onClick={() => onToggle(!enabled)}
      title={enabled ? 'Auto-playtest ON — AI will test and fix code automatically' : 'Auto-playtest OFF — click to enable autonomous testing'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 10px',
        fontSize: 10,
        fontWeight: 600,
        fontFamily: 'Inter, system-ui, sans-serif',
        background: enabled ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${enabled ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 8,
        color: enabled ? '#10b981' : 'rgba(255,255,255,0.4)',
        cursor: 'pointer',
        transition: 'all 0.15s ease-out',
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      {/* Play icon */}
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path
          d={enabled ? 'M1 1h3v8H1zM6 1h3v8H6z' : 'M2 1l7 4-7 4z'}
          fill="currentColor"
        />
      </svg>
      {enabled ? 'Auto-Test ON' : 'Auto-Test'}
    </button>
  )
}
