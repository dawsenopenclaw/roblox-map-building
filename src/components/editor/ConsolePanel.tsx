'use client'

/**
 * ConsolePanel — Live Studio console output in the editor.
 *
 * Polls /api/studio/console every 2 seconds to show real-time
 * LogService output from the connected Roblox Studio instance.
 *
 * Features beyond Lemonade's console:
 * - Color-coded: white=output, amber=warning, red=error, blue=info
 * - Timestamps on every entry
 * - Error count badge with pulsing indicator
 * - "Fix" button on errors → sends to AI for auto-fix
 * - Search/filter text
 * - Auto-scroll with manual override detection
 * - Connection state indicator
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'

interface ConsoleEntry {
  message: string
  type: string // Output, Warning, Error, Info
  timestamp: number
}

interface ConsolePanelProps {
  sessionId: string | null
  isConnected: boolean
  active?: boolean
  onFixError?: (errorMessage: string) => void
}

export default function ConsolePanel({ sessionId, isConnected, active = true, onFixError }: ConsolePanelProps) {
  const [logs, setLogs] = useState<ConsoleEntry[]>([])
  const [filter, setFilter] = useState<'all' | 'errors' | 'warnings'>('all')
  const [search, setSearch] = useState('')
  const [autoScroll, setAutoScroll] = useState(true)
  const [fetchFailed, setFetchFailed] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastCountRef = useRef(0)
  const userScrolledRef = useRef(false)

  const fetchLogs = useCallback(async () => {
    if (!sessionId || !isConnected || !active) return
    try {
      const res = await fetch(`/api/studio/console?sessionId=${sessionId}&limit=100`)
      if (!res.ok) { setFetchFailed(true); return }
      setFetchFailed(false)
      const data = await res.json() as { logs: ConsoleEntry[] }
      if (data.logs) {
        setLogs(data.logs)
        if (data.logs.length !== lastCountRef.current && autoScroll && !userScrolledRef.current) {
          lastCountRef.current = data.logs.length
          requestAnimationFrame(() => {
            scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
          })
        }
      }
    } catch (err) {
      console.error('[ConsolePanel] Failed to fetch logs:', err instanceof Error ? err.message : err)
      setFetchFailed(true)
    }
  }, [sessionId, isConnected, active, autoScroll])

  useEffect(() => {
    if (!active) return
    fetchLogs()
    const interval = setInterval(fetchLogs, 2000)
    return () => clearInterval(interval)
  }, [fetchLogs, active])

  // Detect manual scroll to disable auto-scroll
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handler = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40
      userScrolledRef.current = !atBottom
      if (atBottom) setAutoScroll(true)
    }
    el.addEventListener('scroll', handler, { passive: true })
    return () => el.removeEventListener('scroll', handler)
  }, [])

  const filtered = useMemo(() => {
    let result = logs
    if (filter === 'errors') result = result.filter(l => l.type === 'MessageError' || l.type === 'Error')
    else if (filter === 'warnings') result = result.filter(l => l.type === 'MessageWarning' || l.type === 'Warning')
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(l => l.message.toLowerCase().includes(q))
    }
    return result
  }, [logs, filter, search])

  const errorCount = useMemo(() =>
    logs.filter(l => l.type === 'MessageError' || l.type === 'Error').length
  , [logs])

  const getColor = (type: string) => {
    if (type === 'MessageError' || type === 'Error') return '#ef4444'
    if (type === 'MessageWarning' || type === 'Warning') return '#f59e0b'
    if (type === 'MessageInfo' || type === 'Info') return '#60a5fa'
    return '#a1a1aa'
  }

  const getIcon = (type: string) => {
    if (type === 'MessageError' || type === 'Error') return '●'
    if (type === 'MessageWarning' || type === 'Warning') return '▲'
    if (type === 'MessageInfo' || type === 'Info') return 'ℹ'
    return '›'
  }

  const formatTime = (ts: number) => {
    if (!ts) return ''
    const d = new Date(ts * 1000)
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
  }

  if (!isConnected) {
    return (
      <div style={{
        padding: '16px',
        color: '#71717a',
        fontSize: '12px',
        textAlign: 'center',
        fontFamily: '"JetBrains Mono", monospace',
        display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%',
      }}>
        <span style={{ opacity: 0.5 }}>&#x25CB;</span>&nbsp;Connect to Studio to see console output
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#08080a' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 8px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        fontSize: '11px',
        minHeight: 28,
      }}>
        {/* Live indicator */}
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: fetchFailed ? '#ef4444' : '#22c55e',
          boxShadow: fetchFailed ? '0 0 4px rgba(239,68,68,0.5)' : '0 0 4px rgba(34,197,94,0.5)',
          animation: fetchFailed ? 'none' : 'pulse 2s ease-in-out infinite',
        }} />
        <span style={{ color: '#D4AF37', fontWeight: 600, fontSize: 11 }}>Console</span>

        {/* Error count badge */}
        {errorCount > 0 && (
          <span style={{
            padding: '0 5px',
            borderRadius: 8,
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#ef4444',
            fontSize: 10,
            fontWeight: 600,
            lineHeight: '16px',
          }}>
            {errorCount} {errorCount === 1 ? 'error' : 'errors'}
          </span>
        )}

        <div style={{ flex: 1 }} />

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          style={{
            width: 90,
            padding: '2px 6px',
            borderRadius: 4,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.03)',
            color: '#a1a1aa',
            fontSize: 10,
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />

        {/* Filter buttons */}
        {(['all', 'errors', 'warnings'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '1px 6px',
              borderRadius: 4,
              border: 'none',
              fontSize: 10,
              cursor: 'pointer',
              background: filter === f ? 'rgba(212,175,55,0.15)' : 'transparent',
              color: filter === f ? '#D4AF37' : '#52525b',
              fontWeight: filter === f ? 600 : 400,
            }}
          >
            {f === 'all' ? 'All' : f === 'errors' ? 'Err' : 'Warn'}
          </button>
        ))}

        <button
          onClick={() => { setLogs([]); lastCountRef.current = 0 }}
          style={{
            padding: '1px 6px', borderRadius: 4, border: 'none',
            fontSize: 10, cursor: 'pointer', background: 'transparent', color: '#52525b',
          }}
        >
          Clear
        </button>
      </div>

      {/* Log entries */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '2px 0',
          fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
          fontSize: '10.5px',
          lineHeight: '17px',
        }}
      >
        {filtered.length === 0 ? (
          <div style={{ color: '#27272a', padding: '16px 0', textAlign: 'center', fontSize: 11 }}>
            {fetchFailed ? 'Console disconnected — retrying...'
              : logs.length === 0 ? 'Waiting for Studio output...'
              : `No ${filter === 'all' ? 'matching entries' : filter} found`}
          </div>
        ) : (
          filtered.map((entry, i) => {
            const isError = entry.type === 'MessageError' || entry.type === 'Error'
            return (
              <div
                key={`${entry.timestamp}-${i}`}
                style={{
                  padding: '1px 8px',
                  color: getColor(entry.type),
                  wordBreak: 'break-word',
                  borderBottom: '1px solid rgba(255,255,255,0.015)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '4px',
                  background: isError ? 'rgba(239,68,68,0.03)' : 'transparent',
                }}
              >
                {/* Timestamp */}
                <span style={{ color: '#27272a', fontSize: 9, flexShrink: 0, minWidth: 48, fontVariantNumeric: 'tabular-nums' }}>
                  {formatTime(entry.timestamp)}
                </span>
                {/* Type icon */}
                <span style={{ flexShrink: 0, width: 10, textAlign: 'center', fontSize: 8 }}>
                  {getIcon(entry.type)}
                </span>
                {/* Message */}
                <span style={{ flex: 1, minWidth: 0 }}>
                  {entry.message}
                </span>
                {/* Fix button for errors */}
                {isError && onFixError && (
                  <button
                    onClick={() => onFixError(`Fix this Studio error: ${entry.message}`)}
                    style={{
                      flexShrink: 0,
                      padding: '0 5px',
                      borderRadius: 3,
                      border: '1px solid rgba(212,175,55,0.3)',
                      background: 'rgba(212,175,55,0.08)',
                      color: '#D4AF37',
                      fontSize: 9,
                      cursor: 'pointer',
                      fontWeight: 600,
                      lineHeight: '15px',
                    }}
                  >
                    AI Fix
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Auto-scroll indicator */}
      {!autoScroll && userScrolledRef.current && logs.length > 5 && (
        <button
          onClick={() => {
            setAutoScroll(true)
            userScrolledRef.current = false
            scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
          }}
          style={{
            position: 'absolute', bottom: 4, right: 12,
            padding: '2px 8px', borderRadius: 6,
            background: 'rgba(212,175,55,0.15)',
            border: '1px solid rgba(212,175,55,0.3)',
            color: '#D4AF37', fontSize: 10, cursor: 'pointer',
          }}
        >
          Scroll to bottom
        </button>
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
