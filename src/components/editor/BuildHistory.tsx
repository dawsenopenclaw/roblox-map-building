'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { GlassPanel } from './GlassPanel'

// ─── Types ────────────────────────────────────────────────────────────────────

export type BuildStatus = 'active' | 'undone' | 'failed'

export type BuildIntent =
  | 'map'
  | 'building'
  | 'system'
  | 'npc'
  | 'terrain'
  | 'lighting'
  | 'ui'
  | 'script'
  | 'asset'
  | 'other'

export interface BuildEntry {
  id: string
  title: string
  description: string
  intent: BuildIntent
  luauCode: string
  tokensUsed: number
  timestamp: Date
  status: BuildStatus
  model?: string
}

// ─── Intent icon map ──────────────────────────────────────────────────────────

const INTENT_ICONS: Record<BuildIntent, string> = {
  map:      '🗺️',
  building: '🏗️',
  system:   '⚙️',
  npc:      '🤖',
  terrain:  '🌄',
  lighting: '💡',
  ui:       '🖥️',
  script:   '📜',
  asset:    '📦',
  other:    '✨',
}

const INTENT_COLORS: Record<BuildIntent, string> = {
  map:      '#4ADE80',
  building: '#F97316',
  system:   '#8B5CF6',
  npc:      '#06B6D4',
  terrain:  '#22C55E',
  lighting: '#FFB81C',
  ui:       '#EC4899',
  script:   '#D4AF37',
  asset:    '#A78BFA',
  other:    'rgba(255,255,255,0.5)',
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 11)
}

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return 'just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return `${Math.floor(diffHr / 24)}d ago`
}

function formatTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

// ─── useBuildHistory hook ─────────────────────────────────────────────────────

interface BuildHistoryState {
  entries: BuildEntry[]
  sessionStart: Date
}

interface UseBuildHistoryReturn {
  entries: BuildEntry[]
  addBuild: (build: Omit<BuildEntry, 'id' | 'timestamp' | 'status'>) => BuildEntry
  undoBuild: (id: string) => void
  redoBuild: (id: string) => void
  clearAll: () => void
  getBuildHistory: () => BuildEntry[]
  canUndo: boolean
  canRedo: boolean
  undoLast: () => void
  redoLast: () => void
  sessionStart: Date
}

// Module-level store so the hook shares state across instances
let _state: BuildHistoryState = {
  entries: [],
  sessionStart: new Date(),
}
const _listeners = new Set<() => void>()

function notifyListeners() {
  _listeners.forEach(fn => fn())
}

export function useBuildHistory(): UseBuildHistoryReturn {
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    const update = () => forceUpdate(n => n + 1)
    _listeners.add(update)
    return () => { _listeners.delete(update) }
  }, [])

  const addBuild = useCallback(
    (build: Omit<BuildEntry, 'id' | 'timestamp' | 'status'>): BuildEntry => {
      const entry: BuildEntry = {
        ...build,
        id: uid(),
        timestamp: new Date(),
        status: 'active',
      }
      _state = { ..._state, entries: [entry, ..._state.entries] }
      notifyListeners()
      return entry
    },
    [],
  )

  const undoBuild = useCallback((id: string) => {
    _state = {
      ..._state,
      entries: _state.entries.map(e =>
        e.id === id ? { ...e, status: 'undone' } : e,
      ),
    }
    notifyListeners()
  }, [])

  const redoBuild = useCallback((id: string) => {
    _state = {
      ..._state,
      entries: _state.entries.map(e =>
        e.id === id && e.status === 'undone' ? { ...e, status: 'active' } : e,
      ),
    }
    notifyListeners()
  }, [])

  const clearAll = useCallback(() => {
    _state = { ..._state, entries: [] }
    notifyListeners()
  }, [])

  const getBuildHistory = useCallback(() => _state.entries, [])

  const activeEntries = _state.entries.filter(e => e.status === 'active')
  const undoneEntries = _state.entries.filter(e => e.status === 'undone')

  const undoLast = useCallback(() => {
    const last = _state.entries.find(e => e.status === 'active')
    if (last) undoBuild(last.id)
  }, [undoBuild])

  const redoLast = useCallback(() => {
    // Entries are newest-first, so undone[0] is the most recently undone entry (LIFO)
    const undone = _state.entries.filter(e => e.status === 'undone')
    const mostRecent = undone[0]
    if (mostRecent) redoBuild(mostRecent.id)
  }, [redoBuild])

  return {
    entries: _state.entries,
    addBuild,
    undoBuild,
    redoBuild,
    clearAll,
    getBuildHistory,
    canUndo: activeEntries.length > 0,
    canRedo: undoneEntries.length > 0,
    undoLast,
    redoLast,
    sessionStart: _state.sessionStart,
  }
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: BuildStatus }) {
  const config: Record<BuildStatus, { label: string; bg: string; color: string }> = {
    active: { label: 'Active',  bg: 'rgba(74,222,128,0.12)',  color: '#4ADE80' },
    undone: { label: 'Undone',  bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' },
    failed: { label: 'Failed',  bg: 'rgba(239,68,68,0.12)',   color: '#EF4444' },
  }
  const { label, bg, color } = config[status]
  return (
    <span
      style={{
        fontSize: '10px',
        fontWeight: 600,
        letterSpacing: '0.05em',
        padding: '2px 7px',
        borderRadius: '20px',
        background: bg,
        color,
        textTransform: 'uppercase',
        fontFamily: 'Inter, sans-serif',
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  )
}

// ─── Code preview ─────────────────────────────────────────────────────────────

function CodePreview({ code }: { code: string }) {
  const lines = code.split('\n').slice(0, 5)
  return (
    <div
      style={{
        background: 'rgba(0,0,0,0.35)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '10px',
        padding: '10px 12px',
        marginTop: '10px',
        overflowX: 'hidden',
      }}
    >
      {lines.map((line, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: '12px',
            fontFamily: '"Fira Code", "Cascadia Code", monospace',
            fontSize: '11px',
            lineHeight: '1.6',
          }}
        >
          <span style={{ color: 'rgba(255,255,255,0.2)', minWidth: '16px', textAlign: 'right', userSelect: 'none' }}>
            {i + 1}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.65)', whiteSpace: 'pre', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {line || '\u00A0'}
          </span>
        </div>
      ))}
      {code.split('\n').length > 5 && (
        <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px', marginTop: '4px', fontFamily: 'monospace' }}>
          +{code.split('\n').length - 5} more lines
        </div>
      )}
    </div>
  )
}

// ─── Single build entry row ───────────────────────────────────────────────────

interface BuildEntryRowProps {
  entry: BuildEntry
  isSelected: boolean
  isExpanded: boolean
  onSelect: () => void
  onExpand: () => void
  onUndoTo: () => void
  onRedo: () => void
}

function BuildEntryRow({
  entry,
  isSelected,
  isExpanded,
  onSelect,
  onExpand,
  onUndoTo,
  onRedo,
}: BuildEntryRowProps) {
  const intentColor = INTENT_COLORS[entry.intent]
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        borderRadius: '12px',
        border: isSelected
          ? `1px solid ${intentColor}55`
          : '1px solid rgba(255,255,255,0.05)',
        background: isSelected
          ? `linear-gradient(135deg, ${intentColor}08 0%, rgba(255,255,255,0.015) 100%)`
          : hovered
          ? 'rgba(255,255,255,0.03)'
          : 'transparent',
        transition: 'background 0.15s, border-color 0.15s',
        overflow: 'hidden',
        opacity: entry.status === 'undone' ? 0.55 : 1,
      }}
    >
      {/* Timeline connector dot */}
      <div
        style={{
          position: 'absolute',
          left: '14px',
          top: '16px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: entry.status === 'active' ? intentColor : 'rgba(255,255,255,0.15)',
          boxShadow: entry.status === 'active' ? `0 0 8px ${intentColor}88` : 'none',
          flexShrink: 0,
          zIndex: 1,
        }}
      />

      {/* Main row — click to select, double-click to undo/redo */}
      <div
        onClick={onSelect}
        onDoubleClick={entry.status === 'undone' ? onRedo : onUndoTo}
        title={entry.status === 'undone' ? 'Double-click to redo' : 'Double-click to undo back to here'}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          padding: '11px 12px 11px 32px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        {/* Intent icon */}
        <span style={{ fontSize: '15px', lineHeight: 1, flexShrink: 0, marginTop: '1px' }}>
          {INTENT_ICONS[entry.intent]}
        </span>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: entry.status === 'undone' ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.9)',
                fontFamily: 'Inter, sans-serif',
                textDecoration: entry.status === 'undone' ? 'line-through' : 'none',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '140px',
              }}
            >
              {entry.title}
            </span>
            <StatusBadge status={entry.status} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontFamily: 'Inter, sans-serif' }}>
              {formatRelativeTime(entry.timestamp)}
            </span>
            <span style={{ fontSize: '11px', color: 'rgba(212,175,55,0.7)', fontFamily: 'Inter, sans-serif' }}>
              {formatTokens(entry.tokensUsed)} tok
            </span>
            {entry.model && (
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', fontFamily: 'Inter, sans-serif' }}>
                {entry.model}
              </span>
            )}
          </div>
        </div>

        {/* Expand toggle */}
        <button
          onClick={e => { e.stopPropagation(); onExpand() }}
          title={isExpanded ? 'Collapse' : 'Expand details'}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.3)',
            fontSize: '11px',
            padding: '2px 4px',
            borderRadius: '4px',
            flexShrink: 0,
            marginTop: '2px',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
        >
          {isExpanded ? '▲' : '▼'}
        </button>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div
          style={{
            padding: '0 12px 12px 32px',
            borderTop: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          {/* Description */}
          <p
            style={{
              margin: '8px 0 0',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.5)',
              lineHeight: '1.5',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {entry.description}
          </p>

          {/* Meta pills */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '10px',
                padding: '2px 8px',
                borderRadius: '20px',
                background: `${intentColor}18`,
                color: intentColor,
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                textTransform: 'capitalize',
              }}
            >
              {entry.intent}
            </span>
            {entry.model && (
              <span
                style={{
                  fontSize: '10px',
                  padding: '2px 8px',
                  borderRadius: '20px',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.4)',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {entry.model}
              </span>
            )}
          </div>

          {/* Luau code preview */}
          {entry.luauCode && <CodePreview code={entry.luauCode} />}

          {/* Action buttons */}
          {entry.status !== 'failed' && (
            <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
              {entry.status === 'active' ? (
                <button
                  onClick={onUndoTo}
                  style={{
                    fontSize: '11px',
                    padding: '4px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(239,68,68,0.3)',
                    background: 'rgba(239,68,68,0.08)',
                    color: '#EF4444',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.15)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                >
                  Undo this build
                </button>
              ) : (
                <button
                  onClick={onRedo}
                  style={{
                    fontSize: '11px',
                    padding: '4px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(74,222,128,0.3)',
                    background: 'rgba(74,222,128,0.08)',
                    color: '#4ADE80',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(74,222,128,0.15)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(74,222,128,0.08)')}
                >
                  Re-apply
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Control button ───────────────────────────────────────────────────────────

interface CtrlBtnProps {
  label: string
  shortcut?: string
  onClick: () => void
  disabled?: boolean
  variant?: 'default' | 'danger'
  title?: string
}

function CtrlBtn({ label, shortcut, onClick, disabled = false, variant = 'default', title }: CtrlBtnProps) {
  const [hovered, setHovered] = useState(false)

  const baseColor = variant === 'danger' ? '#EF4444' : '#D4AF37'
  const bgBase   = variant === 'danger' ? 'rgba(239,68,68,0.08)'   : 'rgba(212,175,55,0.08)'
  const bgHover  = variant === 'danger' ? 'rgba(239,68,68,0.14)'   : 'rgba(212,175,55,0.14)'
  const border   = variant === 'danger' ? 'rgba(239,68,68,0.25)'   : 'rgba(212,175,55,0.25)'

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: '11px',
        fontWeight: 600,
        padding: '5px 10px',
        borderRadius: '8px',
        border: `1px solid ${disabled ? 'rgba(255,255,255,0.07)' : border}`,
        background: disabled ? 'rgba(255,255,255,0.03)' : hovered ? bgHover : bgBase,
        color: disabled ? 'rgba(255,255,255,0.2)' : baseColor,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'Inter, sans-serif',
        transition: 'background 0.15s, border-color 0.15s',
        userSelect: 'none',
      }}
    >
      {label}
      {shortcut && !disabled && (
        <span
          style={{
            fontSize: '9px',
            padding: '1px 4px',
            borderRadius: '4px',
            background: 'rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.3)',
            fontWeight: 400,
          }}
        >
          {shortcut}
        </span>
      )}
    </button>
  )
}

// ─── Stats bar ────────────────────────────────────────────────────────────────

interface StatsBarProps {
  entries: BuildEntry[]
  sessionStart: Date
}

function StatsBar({ entries, sessionStart }: StatsBarProps) {
  const totalBuilds = entries.length
  const totalTokens = entries.reduce((sum, e) => sum + e.tokensUsed, 0)
  const elapsed = Date.now() - sessionStart.getTime()

  const stats = [
    { label: 'Builds', value: String(totalBuilds) },
    { label: 'Tokens', value: formatTokens(totalTokens) },
    { label: 'Session', value: formatDuration(elapsed) },
  ]

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-around',
        padding: '10px 4px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        marginTop: '4px',
      }}
    >
      {stats.map(({ label, value }) => (
        <div key={label} style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: '#D4AF37',
              fontFamily: 'Inter, sans-serif',
              lineHeight: 1.1,
            }}
          >
            {value}
          </div>
          <div
            style={{
              fontSize: '10px',
              color: 'rgba(255,255,255,0.3)',
              fontFamily: 'Inter, sans-serif',
              marginTop: '2px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {label}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Clear confirmation dialog ────────────────────────────────────────────────

interface ClearConfirmProps {
  onConfirm: () => void
  onCancel: () => void
}

function ClearConfirm({ onConfirm, onCancel }: ClearConfirmProps) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        borderRadius: '20px',
      }}
    >
      <div
        style={{
          background: 'rgba(20,20,25,0.98)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '14px',
          padding: '20px',
          width: '220px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '22px', marginBottom: '8px' }}>🗑️</div>
        <div
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.9)',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Clear all history?
        </div>
        <div
          style={{
            fontSize: '11px',
            color: 'rgba(255,255,255,0.4)',
            fontFamily: 'Inter, sans-serif',
            marginTop: '6px',
            lineHeight: '1.4',
          }}
        >
          This cannot be undone. All build records will be removed.
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'center' }}>
          <button
            onClick={onCancel}
            style={{
              fontSize: '12px',
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              fontSize: '12px',
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(239,68,68,0.4)',
              background: 'rgba(239,68,68,0.15)',
              color: '#EF4444',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
            }}
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── BuildHistory panel ───────────────────────────────────────────────────────

interface BuildHistoryProps {
  className?: string
  style?: React.CSSProperties
}

export function BuildHistory({ className, style }: BuildHistoryProps) {
  const {
    entries,
    undoBuild,
    redoBuild,
    clearAll,
    canUndo,
    canRedo,
    undoLast,
    redoLast,
    sessionStart,
  } = useBuildHistory()

  const [selectedId, setSelectedId]     = useState<string | null>(null)
  const [expandedId, setExpandedId]     = useState<string | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  // ─── Keyboard shortcuts ─────────────────────────────────────────────
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      if (e.ctrlKey && !e.shiftKey && e.key === 'z') {
        e.preventDefault()
        undoLast()
      } else if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault()
        redoLast()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [undoLast, redoLast])

  // ─── Live clock for relative timestamps ─────────────────────────────
  const [, tick] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => tick(n => n + 1), 30_000)
    return () => clearInterval(interval)
  }, [])

  function handleSelect(id: string) {
    setSelectedId(prev => (prev === id ? null : id))
  }

  function handleExpand(id: string) {
    setExpandedId(prev => (prev === id ? null : id))
  }

  function handleUndoTo(id: string) {
    undoBuild(id)
    if (selectedId === id) setSelectedId(null)
  }

  function handleRedo(id: string) {
    redoBuild(id)
  }

  return (
    <GlassPanel
      className={className}
      padding="none"
      style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        ...style,
      }}
    >
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '14px 16px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          flexShrink: 0,
        }}
      >
        {/* Title row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <span style={{ fontSize: '14px' }}>🕐</span>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: 'rgba(255,255,255,0.85)',
                fontFamily: 'Inter, sans-serif',
                letterSpacing: '-0.01em',
              }}
            >
              Build History
            </span>
            {entries.length > 0 && (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '1px 7px',
                  borderRadius: '20px',
                  background: 'rgba(212,175,55,0.15)',
                  color: '#D4AF37',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {entries.length}
              </span>
            )}
          </div>
          <CtrlBtn
            label="Clear"
            onClick={() => setShowClearConfirm(true)}
            disabled={entries.length === 0}
            variant="danger"
            title="Clear all history"
          />
        </div>

        {/* Undo / Redo row */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <CtrlBtn
            label="↩ Undo"
            shortcut="Ctrl+Z"
            onClick={undoLast}
            disabled={!canUndo}
            title="Undo last build"
          />
          <CtrlBtn
            label="↪ Redo"
            shortcut="Ctrl+Y"
            onClick={redoLast}
            disabled={!canRedo}
            title="Redo last undone build"
          />
        </div>
      </div>

      {/* ── Timeline list ─────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '8px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.1) transparent',
        }}
      >
        {entries.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '120px',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '28px', opacity: 0.3 }}>📭</span>
            <span
              style={{
                fontSize: '12px',
                color: 'rgba(255,255,255,0.25)',
                fontFamily: 'Inter, sans-serif',
                textAlign: 'center',
              }}
            >
              No builds yet.
              <br />
              Start prompting to see history.
            </span>
          </div>
        ) : (
          entries.map(entry => (
            <BuildEntryRow
              key={entry.id}
              entry={entry}
              isSelected={selectedId === entry.id}
              isExpanded={expandedId === entry.id}
              onSelect={() => handleSelect(entry.id)}
              onExpand={() => handleExpand(entry.id)}
              onUndoTo={() => handleUndoTo(entry.id)}
              onRedo={() => handleRedo(entry.id)}
            />
          ))
        )}
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <div style={{ flexShrink: 0, padding: '0 10px' }}>
        <StatsBar entries={entries} sessionStart={sessionStart} />
      </div>

      {/* ── Clear confirmation overlay ─────────────────────────────────── */}
      {showClearConfirm && (
        <ClearConfirm
          onConfirm={() => { clearAll(); setShowClearConfirm(false) }}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}
    </GlassPanel>
  )
}
