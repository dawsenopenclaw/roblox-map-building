'use client'

import React from 'react'

interface EnhanceToggleProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
}

/**
 * Toggle for automatic prompt enhancement.
 * When enabled, every prompt is first sent to /api/ai/enhance (free, uses Groq)
 * to be improved before the expensive AI call.
 * Like ForgeGUI's free planning step.
 */
export function EnhanceToggle({ enabled, onToggle }: EnhanceToggleProps) {
  return (
    <button
      onClick={() => onToggle(!enabled)}
      title={enabled ? 'Auto-enhance ON — prompts are improved before generation (free)' : 'Auto-enhance OFF — prompts sent as-is'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 8px',
        fontSize: 10,
        fontWeight: 600,
        fontFamily: 'Inter, system-ui, sans-serif',
        background: enabled ? 'rgba(168,85,247,0.12)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${enabled ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 8,
        color: enabled ? '#a855f7' : 'rgba(255,255,255,0.4)',
        cursor: 'pointer',
        transition: 'all 0.15s ease-out',
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      {/* Sparkle icon */}
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M5 0L6 4L10 5L6 6L5 10L4 6L0 5L4 4Z" fill="currentColor" />
      </svg>
      {enabled ? 'Enhance' : 'Enhance'}
    </button>
  )
}
