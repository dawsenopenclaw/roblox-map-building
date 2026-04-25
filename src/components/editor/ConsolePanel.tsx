'use client'

/**
 * ConsolePanel — Live Studio console output in the editor.
 *
 * Polls /api/studio/console every 3 seconds to show real-time
 * LogService output from the connected Roblox Studio instance.
 * Color-coded: white=output, yellow=warning, red=error.
 *
 * Matches Lemonade.gg's console mirroring feature.
 */

import { useEffect, useRef, useState, useCallback } from 'react'

interface ConsoleEntry {
  message: string
  type: string // Output, Warning, Error
  timestamp: number
}

interface ConsolePanelProps {
  sessionId: string | null
  isConnected: boolean
  /** If true, panel is visible and should poll */
  active?: boolean
}

export default function ConsolePanel({ sessionId, isConnected, active = true }: ConsolePanelProps) {
  const [logs, setLogs] = useState<ConsoleEntry[]>([])
  const [filter, setFilter] = useState<'all' | 'errors' | 'warnings'>('all')
  const [autoScroll, setAutoScroll] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastCountRef = useRef(0)

  const fetchLogs = useCallback(async () => {
    if (!sessionId || !isConnected || !active) return
    try {
      const res = await fetch(`/api/studio/console?sessionId=${sessionId}&limit=100`)
      if (!res.ok) return
      const data = await res.json() as { logs: ConsoleEntry[] }
      if (data.logs && data.logs.length > 0) {
        setLogs(data.logs)
        // Auto-scroll if new entries
        if (data.logs.length !== lastCountRef.current && autoScroll) {
          lastCountRef.current = data.logs.length
          requestAnimationFrame(() => {
            scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
          })
        }
      }
    } catch { /* silent */ }
  }, [sessionId, isConnected, active, autoScroll])

  useEffect(() => {
    if (!active) return
    fetchLogs()
    const interval = setInterval(fetchLogs, 3000)
    return () => clearInterval(interval)
  }, [fetchLogs, active])

  const filtered = filter === 'all'
    ? logs
    : filter === 'errors'
      ? logs.filter(l => l.type === 'MessageError' || l.type === 'Error')
      : logs.filter(l => l.type === 'MessageWarning' || l.type === 'Warning')

  const getColor = (type: string) => {
    if (type === 'MessageError' || type === 'Error') return '#ef4444'
    if (type === 'MessageWarning' || type === 'Warning') return '#f59e0b'
    if (type === 'MessageInfo' || type === 'Info') return '#60a5fa'
    return '#a1a1aa'
  }

  const getPrefix = (type: string) => {
    if (type === 'MessageError' || type === 'Error') return '[ERR]'
    if (type === 'MessageWarning' || type === 'Warning') return '[WARN]'
    if (type === 'MessageInfo' || type === 'Info') return '[INFO]'
    return '[OUT]'
  }

  if (!isConnected) {
    return (
      <div style={{
        padding: '16px',
        color: '#71717a',
        fontSize: '13px',
        textAlign: 'center',
        fontFamily: 'monospace',
      }}>
        Connect to Studio to see console output
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0a0a0a' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 10px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        fontSize: '12px',
      }}>
        <span style={{ color: '#D4AF37', fontWeight: 600 }}>Console</span>
        <span style={{ color: '#3f3f46', fontSize: '11px' }}>
          {filtered.length} {filter === 'all' ? 'entries' : filter}
        </span>
        <div style={{ flex: 1 }} />

        {/* Filter buttons */}
        {(['all', 'errors', 'warnings'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              border: 'none',
              fontSize: '11px',
              cursor: 'pointer',
              background: filter === f ? 'rgba(212,175,55,0.15)' : 'transparent',
              color: filter === f ? '#D4AF37' : '#71717a',
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}

        <button
          onClick={() => setLogs([])}
          style={{
            padding: '2px 8px',
            borderRadius: '4px',
            border: 'none',
            fontSize: '11px',
            cursor: 'pointer',
            background: 'transparent',
            color: '#71717a',
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
          padding: '4px 8px',
          fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
          fontSize: '11px',
          lineHeight: '18px',
        }}
      >
        {filtered.length === 0 ? (
          <div style={{ color: '#3f3f46', padding: '12px 0', textAlign: 'center' }}>
            {logs.length === 0 ? 'No console output yet' : `No ${filter} to show`}
          </div>
        ) : (
          filtered.map((entry, i) => (
            <div
              key={`${entry.timestamp}-${i}`}
              style={{
                padding: '1px 0',
                color: getColor(entry.type),
                wordBreak: 'break-all',
                borderBottom: '1px solid rgba(255,255,255,0.02)',
              }}
            >
              <span style={{ color: '#3f3f46', marginRight: '6px' }}>
                {getPrefix(entry.type)}
              </span>
              {entry.message}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
