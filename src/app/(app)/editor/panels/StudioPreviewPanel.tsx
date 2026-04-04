'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudioPreviewPanelProps {
  /** Data-URI string (data:image/png;base64,...) or null */
  screenshotUrl: string | null
  /** Unix ms timestamp of the latest screenshot */
  screenshotTimestamp: number | null
  /** Data-URI of the screenshot captured before the last build */
  beforeScreenshotUrl: string | null
  /** Whether Studio is currently connected */
  isConnected: boolean
  /** SSE reconnect phase */
  sseReconnectPhase: 'connected' | 'lost' | 'reconnecting' | 'failed'
  /** Trigger a fresh screenshot request */
  onRequestScreenshot: () => void
  /** Trigger reconnect flow */
  onReconnect: () => void
  /** Session ID — used to POST a scan_workspace command */
  sessionId: string | null
  /** JWT for authenticated execute calls */
  jwt: string | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTimestamp(ts: number): string {
  const date = new Date(ts)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function secondsAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 5) return 'just now'
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return formatTimestamp(ts)
}

// ─── Before/After Slider ─────────────────────────────────────────────────────

function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
}: {
  beforeUrl: string
  afterUrl: string
}) {
  const [sliderX, setSliderX] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const updateSlider = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
    setSliderX(pct)
  }, [])

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragging.current = true
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      updateSlider(e.clientX)
    },
    [updateSlider],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return
      updateSlider(e.clientX)
    },
    [updateSlider],
  )

  const onPointerUp = useCallback(() => {
    dragging.current = false
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        cursor: 'col-resize',
        userSelect: 'none',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* After (full width, clipped on the right) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={afterUrl}
        alt="After build"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          pointerEvents: 'none',
        }}
        draggable={false}
      />

      {/* Before (clipped to left of slider) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          width: `${sliderX}%`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={beforeUrl}
          alt="Before build"
          style={{
            position: 'absolute',
            inset: 0,
            width: containerRef.current?.clientWidth ?? 300,
            height: '100%',
            objectFit: 'cover',
            pointerEvents: 'none',
          }}
          draggable={false}
        />
      </div>

      {/* Divider line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `${sliderX}%`,
          width: 2,
          background: '#D4AF37',
          boxShadow: '0 0 8px rgba(212,175,55,0.6)',
          transform: 'translateX(-1px)',
          pointerEvents: 'none',
        }}
      />

      {/* Handle */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: `${sliderX}%`,
          transform: 'translate(-50%, -50%)',
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: '#D4AF37',
          border: '2px solid rgba(255,255,255,0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
          pointerEvents: 'none',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M4 2L1 6l3 4M8 2l3 4-3 4" stroke="#030712" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Labels */}
      <div style={{
        position: 'absolute', top: 8, left: 8,
        padding: '2px 7px', borderRadius: 5,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
        fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.7)',
        pointerEvents: 'none',
      }}>
        Before
      </div>
      <div style={{
        position: 'absolute', top: 8, right: 8,
        padding: '2px 7px', borderRadius: 5,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
        fontSize: 10, fontWeight: 600, color: 'rgba(74,222,128,0.9)',
        pointerEvents: 'none',
      }}>
        After
      </div>
    </div>
  )
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export function StudioPreviewPanel({
  screenshotUrl,
  screenshotTimestamp,
  beforeScreenshotUrl,
  isConnected,
  sseReconnectPhase,
  onRequestScreenshot,
  onReconnect,
  sessionId,
  jwt,
}: StudioPreviewPanelProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  const [requestingScreenshot, setRequestingScreenshot] = useState(false)
  const [relativeTs, setRelativeTs] = useState('')

  const isDisconnected = !isConnected || sseReconnectPhase === 'failed'
  const isReconnecting = sseReconnectPhase === 'lost' || sseReconnectPhase === 'reconnecting'

  // Tick the "X seconds ago" label every 5 s
  useEffect(() => {
    if (!screenshotTimestamp) return
    const update = () => setRelativeTs(secondsAgo(screenshotTimestamp))
    update()
    const id = setInterval(update, 5000)
    return () => clearInterval(id)
  }, [screenshotTimestamp])

  // Auto-show comparison when beforeScreenshotUrl arrives and we have an after
  useEffect(() => {
    if (beforeScreenshotUrl && screenshotUrl) setShowComparison(true)
  }, [beforeScreenshotUrl, screenshotUrl])

  // Request a fresh screenshot via scan_workspace command
  const handleRefresh = useCallback(async () => {
    if (requestingScreenshot) return
    setRequestingScreenshot(true)

    // First try the dedicated screenshot poll (lightweight)
    onRequestScreenshot()

    // Also trigger a scan_workspace so the plugin captures a fresh viewport frame
    if (sessionId && jwt) {
      try {
        await fetch('/api/studio/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`,
          },
          body: JSON.stringify({
            sessionId,
            command: 'scan_workspace',
            payload: { captureScreenshot: true },
          }),
        })
      } catch {
        // non-critical
      }
    }

    setTimeout(() => setRequestingScreenshot(false), 2000)
  }, [requestingScreenshot, onRequestScreenshot, sessionId, jwt])

  const dotColor = isDisconnected ? '#ef4444'
    : isReconnecting ? '#f59e0b'
    : '#4ADE80'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: '#0a0a0a',
        border: '1px solid #2a2a2a',
        borderRadius: 10,
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 10px',
          borderBottom: collapsed ? 'none' : '1px solid #1e1e1e',
          flexShrink: 0,
          cursor: 'pointer',
        }}
        onClick={() => setCollapsed((v) => !v)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {/* Connection dot */}
          <div style={{ position: 'relative', width: 7, height: 7, flexShrink: 0 }}>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%', background: dotColor,
              animation: isDisconnected ? 'none' : 'previewPing 2s ease-in-out infinite',
              opacity: 0.4,
            }} />
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%', background: dotColor,
            }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>
            Studio Preview
          </span>
          {screenshotTimestamp && !collapsed && (
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: "'JetBrains Mono', monospace" }}>
              {relativeTs}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={(e) => e.stopPropagation()}>
          {/* Comparison toggle — only when we have both images */}
          {screenshotUrl && beforeScreenshotUrl && !collapsed && (
            <button
              onClick={() => setShowComparison((v) => !v)}
              title={showComparison ? 'Show latest' : 'Compare before/after'}
              style={{
                padding: '2px 7px', borderRadius: 5, border: 'none', cursor: 'pointer',
                background: showComparison ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)',
                color: showComparison ? '#D4AF37' : 'rgba(255,255,255,0.4)',
                fontSize: 10, fontWeight: 600,
              }}
            >
              {showComparison ? 'Comparing' : 'Compare'}
            </button>
          )}

          {/* Refresh button */}
          {isConnected && !collapsed && (
            <button
              onClick={handleRefresh}
              disabled={requestingScreenshot}
              title="Request fresh screenshot"
              style={{
                width: 24, height: 24, borderRadius: 6, border: 'none', cursor: requestingScreenshot ? 'default' : 'pointer',
                background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'color 0.15s',
                opacity: requestingScreenshot ? 0.5 : 1,
              }}
            >
              <svg
                width="12" height="12" viewBox="0 0 12 12" fill="none"
                style={{ animation: requestingScreenshot ? 'previewSpin 0.8s linear infinite' : 'none' }}
              >
                <path d="M10 6A4 4 0 112 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                <path d="M10 3v3H7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}

          {/* Collapse chevron */}
          <button
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? 'Expand preview' : 'Collapse preview'}
            style={{
              width: 20, height: 20, borderRadius: 5, border: 'none', cursor: 'pointer',
              background: 'transparent', color: 'rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path
                d={collapsed ? 'M2 3.5l3 3 3-3' : 'M2 6.5l3-3 3 3'}
                stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      {!collapsed && (
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', minHeight: 120 }}>

          {/* Disconnected state */}
          {isDisconnected && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 10, padding: 16,
              background: 'rgba(6,10,20,0.9)',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 2l12 12M8 3a5 5 0 014.5 7.1M5.2 4.3A5 5 0 008 13a5 5 0 003.5-1.4"
                    stroke="rgba(239,68,68,0.7)" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                Studio disconnected
              </p>
              <button
                onClick={onReconnect}
                style={{
                  padding: '6px 14px', borderRadius: 7,
                  border: '1px solid rgba(212,175,55,0.25)', cursor: 'pointer',
                  background: 'rgba(212,175,55,0.12)', color: '#D4AF37',
                  fontSize: 11, fontWeight: 600,
                }}
              >
                Reconnect
              </button>
            </div>
          )}

          {/* Connected but no screenshot yet */}
          {!isDisconnected && !screenshotUrl && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 10, padding: 16,
              background: 'rgba(6,10,20,0.9)',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="2" y="3" width="14" height="10" rx="2" stroke="rgba(74,222,128,0.5)" strokeWidth="1.3"/>
                  <path d="M6 15h6" stroke="rgba(74,222,128,0.4)" strokeWidth="1.3" strokeLinecap="round"/>
                  <path d="M9 13v2" stroke="rgba(74,222,128,0.4)" strokeWidth="1.3" strokeLinecap="round"/>
                  <circle cx="9" cy="8" r="2" stroke="rgba(74,222,128,0.5)" strokeWidth="1.2"/>
                </svg>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 1.5 }}>
                Connect Roblox Studio to see<br />a live preview
              </p>
              {isReconnecting && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, border: '1.5px solid rgba(245,158,11,0.4)',
                    borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'previewSpin 0.8s linear infinite' }} />
                  <span style={{ fontSize: 10, color: 'rgba(245,158,11,0.7)' }}>Reconnecting...</span>
                </div>
              )}
            </div>
          )}

          {/* Screenshot — before/after comparison or latest */}
          {!isDisconnected && screenshotUrl && (
            showComparison && beforeScreenshotUrl ? (
              <BeforeAfterSlider beforeUrl={beforeScreenshotUrl} afterUrl={screenshotUrl} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={screenshotUrl}
                alt="Studio viewport"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            )
          )}

          {/* Reconnecting overlay on top of stale screenshot */}
          {isReconnecting && screenshotUrl && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <div style={{ width: 12, height: 12, border: '1.5px solid rgba(245,158,11,0.4)',
                borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'previewSpin 0.8s linear infinite' }} />
              <span style={{ fontSize: 11, color: 'rgba(245,158,11,0.8)', fontWeight: 500 }}>Reconnecting...</span>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes previewPing {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes previewSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
