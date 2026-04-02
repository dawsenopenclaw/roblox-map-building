'use client'

import React, { useState, useRef, useEffect } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BuildSnapshot {
  id: string
  timestamp: number
  prompt: string
  /** Full Luau code that was executed */
  code: string
  /** Short description (first ~60 chars of prompt) */
  description: string
  /** Unique model name in workspace: ForjeBuild_<timestamp> */
  modelName: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function truncate(str: string, n: number): string {
  return str.length <= n ? str : str.slice(0, n - 1) + '…'
}

// ─── Build Timeline ───────────────────────────────────────────────────────────

interface BuildTimelineProps {
  history: BuildSnapshot[]
  onJump: (snap: BuildSnapshot) => void
}

export function BuildTimeline({ history, onJump }: BuildTimelineProps) {
  const [hovered, setHovered] = useState<string | null>(null)

  if (history.length === 0) return null

  return (
    <div
      className="flex items-center gap-1.5 px-4 py-2 overflow-x-auto"
      style={{
        background: 'rgba(9,9,11,0.85)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(8px)',
        scrollbarWidth: 'none',
      }}
    >
      <span className="text-[10px] text-zinc-600 flex-shrink-0 mr-1 select-none">Timeline</span>
      {/* Track line */}
      <div className="relative flex items-center gap-1.5 min-w-0">
        {history.map((snap, i) => {
          const isHovered = hovered === snap.id
          return (
            <div
              key={snap.id}
              className="relative flex flex-col items-center flex-shrink-0"
              onMouseEnter={() => setHovered(snap.id)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Tooltip */}
              {isHovered && (
                <div
                  className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
                  style={{
                    animation: 'timestamp-fade 0.15s ease-out',
                  }}
                >
                  <div
                    className="px-2.5 py-1.5 rounded-lg text-[10px] text-zinc-200 whitespace-nowrap"
                    style={{
                      background: 'rgba(20,20,22,0.98)',
                      border: '1px solid rgba(212,175,55,0.25)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                      maxWidth: 180,
                      whiteSpace: 'normal',
                    }}
                  >
                    <div className="text-[#D4AF37] font-medium mb-0.5">Build #{i + 1}</div>
                    <div className="text-zinc-400 leading-relaxed">{truncate(snap.prompt, 80)}</div>
                    <div className="text-zinc-600 mt-0.5">{formatRelativeTime(snap.timestamp)}</div>
                  </div>
                </div>
              )}
              {/* Dot */}
              <button
                onClick={() => onJump(snap)}
                title={`Build ${i + 1}: ${truncate(snap.prompt, 40)}`}
                className="transition-all duration-150"
                style={{
                  width: isHovered ? 10 : 8,
                  height: isHovered ? 10 : 8,
                  borderRadius: '50%',
                  background: isHovered ? '#D4AF37' : 'rgba(212,175,55,0.45)',
                  boxShadow: isHovered ? '0 0 8px rgba(212,175,55,0.6)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              />
              {/* Connector line */}
              {i < history.length - 1 && (
                <div
                  className="absolute left-full top-1/2 -translate-y-1/2"
                  style={{
                    width: 10,
                    height: 1,
                    background: 'rgba(212,175,55,0.18)',
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
      <span className="text-[10px] text-zinc-700 ml-2 flex-shrink-0 select-none">
        {history.length} build{history.length !== 1 ? 's' : ''}
      </span>
    </div>
  )
}

// ─── Build History Panel ──────────────────────────────────────────────────────

interface BuildHistoryPanelProps {
  history: BuildSnapshot[]
  open: boolean
  onToggle: () => void
  onUndo: (snap: BuildSnapshot) => void
  onRerun: (snap: BuildSnapshot) => void
}

export function BuildHistoryPanel({
  history,
  open,
  onToggle,
  onUndo,
  onRerun,
}: BuildHistoryPanelProps) {
  const listRef = useRef<HTMLDivElement>(null)

  // Scroll to top when new item added
  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = 0
    }
  }, [history.length, open])

  return (
    <div
      className="flex-shrink-0"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2 text-left transition-colors hover:bg-white/[0.02]"
        style={{ minHeight: 36 }}
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          {/* Clock icon */}
          <svg className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M8 5v3.5l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">
            Build History
          </span>
          {history.length > 0 && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{
                background: 'rgba(212,175,55,0.12)',
                color: '#D4AF37',
                border: '1px solid rgba(212,175,55,0.2)',
              }}
            >
              {history.length}
            </span>
          )}
        </div>
        {/* Chevron */}
        <svg
          className="w-3.5 h-3.5 text-zinc-600 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          viewBox="0 0 14 14" fill="none"
        >
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* List */}
      {open && (
        <div
          ref={listRef}
          className="overflow-y-auto forge-scroll"
          style={{ maxHeight: 260 }}
        >
          {history.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <svg className="w-6 h-6 text-zinc-700 mx-auto mb-2" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M12 7v5.5l3 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              <p className="text-[11px] text-zinc-600">No builds yet — start chatting to build!</p>
            </div>
          ) : (
            <div className="py-1">
              {[...history].reverse().map((snap, i) => {
                const reverseIndex = history.length - i
                return (
                  <div
                    key={snap.id}
                    className="flex items-start gap-2.5 px-4 py-2.5 group transition-colors hover:bg-white/[0.025]"
                  >
                    {/* Index bubble */}
                    <div
                      className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                      style={{
                        background: 'rgba(212,175,55,0.1)',
                        border: '1px solid rgba(212,175,55,0.2)',
                      }}
                    >
                      <span className="text-[9px] font-bold" style={{ color: '#D4AF37' }}>
                        {reverseIndex}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-zinc-200 leading-snug truncate font-medium">
                        {truncate(snap.prompt, 55)}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-zinc-600">
                          {formatRelativeTime(snap.timestamp)}
                        </span>
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded font-mono"
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            color: '#52525b',
                          }}
                        >
                          {snap.modelName}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Re-run */}
                      <button
                        onClick={() => onRerun(snap)}
                        title="Re-run this build"
                        className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all hover:scale-105 active:scale-95"
                        style={{
                          background: 'rgba(16,185,129,0.1)',
                          border: '1px solid rgba(16,185,129,0.25)',
                          color: '#10B981',
                        }}
                      >
                        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6a4 4 0 014-4 4 4 0 014 4M10 2l2 2-2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Re-run
                      </button>
                      {/* Undo */}
                      <button
                        onClick={() => onUndo(snap)}
                        title="Undo this build (destroy its workspace objects)"
                        className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all hover:scale-105 active:scale-95"
                        style={{
                          background: 'rgba(239,68,68,0.08)',
                          border: '1px solid rgba(239,68,68,0.2)',
                          color: '#EF4444',
                        }}
                      >
                        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                          <path d="M2 4l2-2 2 2M4 2v5a2 2 0 002 2h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Undo
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
