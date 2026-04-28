'use client'

import React, { useState, useEffect } from 'react'

// ─── Build Progress Indicator ────────────────────────────────────────────────
// Time-based progress UI shown during AI generation. Cycles through phases
// with a gold gradient progress bar, rotating tips, and estimated time.

const BUILD_PHASES = [
  { label: 'Understanding your vision...', start: 0, end: 15 },
  { label: 'Consulting specialist AI...', start: 15, end: 30 },
  { label: 'Planning build structure...', start: 30, end: 45 },
  { label: 'Generating code...', start: 45, end: 70 },
  { label: 'Quality checking...', start: 70, end: 85 },
  { label: 'Sending to Studio...', start: 85, end: 100 },
] as const

const TIPS = [
  'Tip: Be specific about materials for better builds',
  'Tip: Mention "detailed" for 2-3x more parts',
  'Tip: Try "plan a game" for full game creation',
  'Tip: Say "add lighting" to improve atmosphere',
] as const

const TOTAL_DURATION = 25 // seconds to reach ~95%

export function BuildProgressIndicator() {
  const [elapsed, setElapsed] = useState(0)
  const [tipIdx, setTipIdx] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setElapsed(e => e + 0.1), 100)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const tipTimer = setInterval(() => setTipIdx(i => (i + 1) % TIPS.length), 5000)
    return () => clearInterval(tipTimer)
  }, [])

  // Ease-out progress: fast start, slows near 95%
  const rawProgress = Math.min(elapsed / TOTAL_DURATION, 1)
  const progress = Math.min(rawProgress * (2 - rawProgress) * 100, 96)

  // Find active phase
  let phaseIdx = 0
  for (let i = BUILD_PHASES.length - 1; i >= 0; i--) {
    if (progress >= BUILD_PHASES[i].start) { phaseIdx = i; break }
  }

  // Estimated time remaining
  const remainingSec = Math.max(0, Math.round(TOTAL_DURATION - elapsed))
  const timeLabel = remainingSec > 0 ? `~${remainingSec}s remaining` : 'Almost done...'

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      padding: '14px 18px',
      borderRadius: 14,
      background: 'linear-gradient(135deg, rgba(15,18,30,0.90) 0%, rgba(12,14,26,0.95) 100%)',
      border: '1px solid rgba(212,175,55,0.20)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
      animation: 'bpiReveal 0.3s ease-out forwards',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Ambient glow */}
      <div aria-hidden style={{
        position: 'absolute', top: -40, left: '30%',
        width: 180, height: 80,
        background: 'radial-gradient(ellipse, rgba(212,175,55,0.12) 0%, transparent 70%)',
        filter: 'blur(30px)',
        pointerEvents: 'none',
      }} />

      {/* Phase label + elapsed time */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, position: 'relative', zIndex: 1 }}>
        <span style={{
          fontSize: 13,
          fontWeight: 600,
          color: '#D4AF37',
          fontFamily: 'Inter, sans-serif',
          letterSpacing: '-0.01em',
          animation: 'bpiFadeSwitch 0.4s ease-out',
        }}
        key={phaseIdx}
        >
          {BUILD_PHASES[phaseIdx].label}
        </span>
        <span style={{
          fontSize: 10,
          color: 'rgba(255,255,255,0.30)',
          fontFamily: "'JetBrains Mono', monospace",
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
        }}>
          {Math.round(elapsed)}s
        </span>
      </div>

      {/* Progress bar */}
      <div style={{
        height: 6,
        borderRadius: 3,
        background: 'rgba(255,255,255,0.04)',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          borderRadius: 3,
          background: 'linear-gradient(90deg, #B8941F, #D4AF37, #FFD966, #D4AF37)',
          backgroundSize: '200% 100%',
          animation: 'bpiBarShimmer 2s linear infinite, bpiBarPulse 3s ease-in-out infinite',
          transition: 'width 0.3s ease-out',
          boxShadow: '0 0 12px rgba(212,175,55,0.4)',
        }} />
      </div>

      {/* Phase step indicators */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        padding: '2px 0',
        position: 'relative',
        zIndex: 1,
      }}>
        {BUILD_PHASES.map((phase, idx) => {
          const isDone = idx < phaseIdx
          const isActive = idx === phaseIdx
          const dotColor = isDone
            ? '#22C55E'
            : isActive
              ? '#D4AF37'
              : 'rgba(255,255,255,0.10)'
          return (
            <React.Fragment key={idx}>
              {/* Dot */}
              <div style={{
                width: isActive ? 10 : 6,
                height: isActive ? 10 : 6,
                borderRadius: '50%',
                background: dotColor,
                boxShadow: isActive ? '0 0 10px rgba(212,175,55,0.5)' : isDone ? '0 0 6px rgba(34,197,94,0.3)' : 'none',
                transition: 'all 0.4s ease',
                flexShrink: 0,
                animation: isActive ? 'bpiDotPulse 1.5s ease-in-out infinite' : 'none',
              }} />
              {/* Connector */}
              {idx < BUILD_PHASES.length - 1 && (
                <div style={{
                  flex: 1,
                  height: 2,
                  background: isDone
                    ? 'rgba(34,197,94,0.35)'
                    : 'rgba(255,255,255,0.05)',
                  transition: 'background 0.4s ease',
                  flexShrink: 0,
                  minWidth: 8,
                }} />
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Time remaining + tip */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        position: 'relative',
        zIndex: 1,
      }}>
        <span style={{
          fontSize: 10,
          color: 'rgba(255,255,255,0.35)',
          fontFamily: "'JetBrains Mono', monospace",
          fontVariantNumeric: 'tabular-nums',
        }}>
          {timeLabel}
        </span>
        <span
          key={tipIdx}
          style={{
            fontSize: 11,
            color: 'rgba(212,175,55,0.50)',
            fontFamily: 'Inter, sans-serif',
            fontStyle: 'italic',
            lineHeight: 1.4,
            animation: 'bpiTipFade 0.5s ease-in-out',
          }}
        >
          {TIPS[tipIdx]}
        </span>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes bpiReveal {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bpiBarShimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        @keyframes bpiBarPulse {
          0%, 100% { opacity: 0.9; }
          50%      { opacity: 1; }
        }
        @keyframes bpiDotPulse {
          0%, 100% { box-shadow: 0 0 6px rgba(212,175,55,0.3); }
          50%      { box-shadow: 0 0 14px rgba(212,175,55,0.6); }
        }
        @keyframes bpiFadeSwitch {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bpiTipFade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
