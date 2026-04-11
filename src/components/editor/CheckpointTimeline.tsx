'use client'

import React, { useState, useRef, useEffect } from 'react'
import type { Checkpoint } from '@/lib/checkpoints'

interface CheckpointTimelineProps {
  checkpoints: Checkpoint[]
  currentMessageCount: number
  onRestore: (checkpointId: string) => void
  onDelete: (checkpointId: string) => void
  loading?: boolean
}

export function CheckpointTimeline({
  checkpoints,
  currentMessageCount,
  onRestore,
  onDelete,
  loading = false,
}: CheckpointTimelineProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to rightmost dot when new checkpoints appear
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
    }
  }, [checkpoints.length])

  // Clear confirm state after 3s
  useEffect(() => {
    if (!confirmRestoreId) return
    const t = setTimeout(() => setConfirmRestoreId(null), 3000)
    return () => clearTimeout(t)
  }, [confirmRestoreId])

  if (checkpoints.length === 0) return null

  /** Find which checkpoint is "current" — the one whose messageIndex matches or is closest to current count */
  const currentCpId = (() => {
    let best: Checkpoint | null = null
    for (const cp of checkpoints) {
      if (cp.messageIndex <= currentMessageCount) {
        if (!best || cp.messageIndex > best.messageIndex) best = cp
      }
    }
    return best?.id ?? null
  })()

  const formatTime = (d: Date) => {
    const date = d instanceof Date ? d : new Date(d as unknown as string)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const truncLabel = (label: string, max = 28) =>
    label.length > max ? label.slice(0, max) + '...' : label

  return (
    <div style={{
      height: 40,
      display: 'flex',
      alignItems: 'center',
      background: 'rgba(10, 10, 15, 0.6)',
      borderTop: '1px solid rgba(212, 175, 55, 0.1)',
      borderBottom: '1px solid rgba(212, 175, 55, 0.1)',
      padding: '0 10px',
      gap: 6,
      flexShrink: 0,
      overflow: 'hidden',
    }}>
      {/* Label */}
      <span style={{
        fontSize: 9,
        fontWeight: 600,
        color: 'rgba(212, 175, 55, 0.5)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        fontFamily: 'Inter, sans-serif',
        flexShrink: 0,
        userSelect: 'none',
      }}>
        History
      </span>

      {/* Scrollable timeline */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          overflowX: 'auto',
          overflowY: 'hidden',
          gap: 0,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {checkpoints.map((cp, i) => {
          const isCurrent = cp.id === currentCpId
          const isHovered = cp.id === hoveredId
          const isConfirming = cp.id === confirmRestoreId

          return (
            <React.Fragment key={cp.id}>
              {/* Connecting line segment */}
              {i > 0 && (
                <div style={{
                  width: 20,
                  height: 2,
                  background: 'rgba(212, 175, 55, 0.15)',
                  flexShrink: 0,
                }} />
              )}

              {/* Dot + tooltip container */}
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
                onMouseEnter={() => setHoveredId(cp.id)}
                onMouseLeave={() => { setHoveredId(null); if (!isConfirming) setConfirmRestoreId(null) }}
              >
                {/* The dot */}
                <button
                  onClick={() => {
                    if (loading) return
                    if (isConfirming) {
                      onRestore(cp.id)
                      setConfirmRestoreId(null)
                    } else {
                      setConfirmRestoreId(cp.id)
                    }
                  }}
                  disabled={loading}
                  style={{
                    width: isCurrent ? 14 : 10,
                    height: isCurrent ? 14 : 10,
                    borderRadius: '50%',
                    border: `2px solid ${isCurrent ? '#D4AF37' : 'rgba(212, 175, 55, 0.35)'}`,
                    background: isCurrent
                      ? 'rgba(212, 175, 55, 0.3)'
                      : isHovered
                        ? 'rgba(212, 175, 55, 0.15)'
                        : 'rgba(212, 175, 55, 0.06)',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    padding: 0,
                    transition: 'all 0.2s ease',
                    boxShadow: isCurrent
                      ? '0 0 8px rgba(212, 175, 55, 0.4), 0 0 16px rgba(212, 175, 55, 0.15)'
                      : 'none',
                    flexShrink: 0,
                  }}
                  title={cp.label}
                />

                {/* Delete button on hover */}
                {isHovered && !isConfirming && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(cp.id)
                    }}
                    style={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: 'rgba(239, 68, 68, 0.8)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: 8,
                      lineHeight: 1,
                      fontFamily: 'Inter, sans-serif',
                      transition: 'all 0.15s',
                    }}
                    title="Delete checkpoint"
                  >
                    <svg width="6" height="6" viewBox="0 0 6 6" fill="none">
                      <path d="M1 1l4 4M5 1L1 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  </button>
                )}

                {/* Tooltip / confirm popup */}
                {(isHovered || isConfirming) && (
                  <div style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginBottom: 6,
                    padding: '5px 8px',
                    borderRadius: 6,
                    background: isConfirming ? 'rgba(212, 175, 55, 0.95)' : 'rgba(20, 20, 28, 0.95)',
                    border: `1px solid ${isConfirming ? 'rgba(212, 175, 55, 0.6)' : 'rgba(255, 255, 255, 0.08)'}`,
                    whiteSpace: 'nowrap',
                    pointerEvents: isConfirming ? 'auto' : 'none',
                    zIndex: 50,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                    animation: 'msgFadeUp 0.12s ease-out forwards',
                  }}>
                    {isConfirming ? (
                      <span style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: '#0a0a0f',
                        fontFamily: 'Inter, sans-serif',
                      }}>
                        Click again to restore
                      </span>
                    ) : (
                      <>
                        <div style={{
                          fontSize: 10,
                          fontWeight: 500,
                          color: 'rgba(255, 255, 255, 0.85)',
                          fontFamily: 'Inter, sans-serif',
                          marginBottom: 2,
                        }}>
                          {truncLabel(cp.label)}
                        </div>
                        <div style={{
                          fontSize: 9,
                          color: 'rgba(255, 255, 255, 0.35)',
                          fontFamily: 'Inter, sans-serif',
                          display: 'flex',
                          gap: 6,
                        }}>
                          <span>{formatTime(cp.timestamp)}</span>
                          <span>{cp.messageIndex} msgs</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
