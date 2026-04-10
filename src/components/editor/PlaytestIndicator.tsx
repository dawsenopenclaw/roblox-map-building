'use client'

import React from 'react'

interface PlaytestStep {
  action: string
  details: string
  timestamp: number
}

interface PlaytestIndicatorProps {
  running: boolean
  currentStep: string
  iteration: number
  result: 'idle' | 'running' | 'passed' | 'failed'
  steps: PlaytestStep[]
  onCancel?: () => void
}

const STEP_ICONS: Record<string, string> = {
  generate: '\u2699',   // gear
  execute: '\u25B6',    // play
  playtest: '\uD83C\uDFAE', // gamepad
  screenshot: '\uD83D\uDCF7', // camera
  analyze: '\uD83D\uDD0D',   // magnifier
  fix: '\uD83D\uDD27',       // wrench
  complete: '\u2705',         // check
  failed: '\u274C',           // cross
}

const RESULT_COLORS: Record<string, string> = {
  idle: 'rgba(255,255,255,0.3)',
  running: '#3b82f6',
  passed: '#10b981',
  failed: '#ef4444',
}

export function PlaytestIndicator({
  running,
  currentStep,
  iteration,
  result,
  steps,
  onCancel,
}: PlaytestIndicatorProps) {
  if (result === 'idle' && !running) return null

  return (
    <div
      style={{
        background: 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${RESULT_COLORS[result]}40`,
        borderRadius: 12,
        padding: '10px 14px',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 12,
        color: '#e5e7eb',
        animation: 'msgFadeUp 0.2s ease-out forwards',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {running && (
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: RESULT_COLORS[result],
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          )}
          <span style={{ fontWeight: 600, color: RESULT_COLORS[result] }}>
            {result === 'running' ? `Autonomous Playtest (${iteration}/3)` :
             result === 'passed' ? 'Playtest Passed' :
             result === 'failed' ? 'Playtest Failed' : 'Playtest'}
          </span>
        </div>
        {running && onCancel && (
          <button
            onClick={onCancel}
            style={{
              padding: '2px 8px',
              fontSize: 10,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
              color: '#9ca3af',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        )}
      </div>

      {/* Current step */}
      <div style={{ fontSize: 11, opacity: 0.8, marginBottom: steps.length > 0 ? 8 : 0 }}>
        {currentStep}
      </div>

      {/* Step timeline */}
      {steps.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {steps.slice(-5).map((step, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 10,
                opacity: i === steps.slice(-5).length - 1 ? 1 : 0.5,
              }}
            >
              <span style={{ width: 14, textAlign: 'center' }}>
                {STEP_ICONS[step.action] || '\u2022'}
              </span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {step.details}
              </span>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
