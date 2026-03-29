'use client'

import { useEffect, useRef, useState } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ConnectionState = 'connected' | 'connecting' | 'disconnected'

interface StatusResponse {
  connected: boolean
  lastSeenAgo: number | null
  pluginVersion: string | null
  queueDepth: number
}

interface ConnectionStatusProps {
  /** Show a condensed single-line badge instead of the full panel */
  compact?: boolean
  /** Override the auto-detected state (for storybook/demo) */
  overrideState?: ConnectionState
  className?: string
}

// ---------------------------------------------------------------------------
// Dot colours
// ---------------------------------------------------------------------------
const DOT_CLASSES: Record<ConnectionState, string> = {
  connected:    'bg-green-400',
  connecting:   'bg-yellow-400 animate-pulse',
  disconnected: 'bg-gray-500',
}

const LABEL_CLASSES: Record<ConnectionState, string> = {
  connected:    'text-green-400',
  connecting:   'text-yellow-400',
  disconnected: 'text-gray-500',
}

const LABELS: Record<ConnectionState, string> = {
  connected:    'Connected to Roblox Studio',
  connecting:   'Connecting...',
  disconnected: 'Not connected — install plugin',
}

// ---------------------------------------------------------------------------
// ConnectionStatus component
// ---------------------------------------------------------------------------
export function ConnectionStatus({ compact = false, overrideState, className = '' }: ConnectionStatusProps) {
  const [state, setState]       = useState<ConnectionState>('connecting')
  const [status, setStatus]     = useState<StatusResponse | null>(null)
  const [showHelp, setShowHelp] = useState(false)
  const intervalRef             = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (overrideState !== undefined) {
      setState(overrideState)
      return
    }

    async function poll() {
      try {
        const res = await fetch('/api/studio/status', { credentials: 'include' })
        if (!res.ok) {
          setState('disconnected')
          return
        }
        const data = (await res.json()) as StatusResponse
        setStatus(data)
        setState(data.connected ? 'connected' : 'disconnected')
      } catch {
        setState('disconnected')
      }
    }

    void poll()
    intervalRef.current = setInterval(() => void poll(), 5000)

    // After 8 seconds with no response, give up on "connecting"
    const timeout = setTimeout(() => {
      setState((s) => (s === 'connecting' ? 'disconnected' : s))
    }, 8000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      clearTimeout(timeout)
    }
  }, [overrideState])

  // ---------------------------------------------------------------------------
  // Compact badge (used in toolbars)
  // ---------------------------------------------------------------------------
  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 text-xs select-none ${className}`}>
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${DOT_CLASSES[state]}`} />
        <span className={LABEL_CLASSES[state]}>{LABELS[state]}</span>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Full panel
  // ---------------------------------------------------------------------------
  return (
    <div className={`bg-[#0D1020] border border-white/8 rounded-xl p-4 select-none ${className}`}>
      {/* Status row */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${DOT_CLASSES[state]}`} />
        <span className={`text-sm font-medium ${LABEL_CLASSES[state]}`}>
          {LABELS[state]}
        </span>

        {state === 'disconnected' && (
          <button
            onClick={() => setShowHelp((v) => !v)}
            className="ml-auto text-xs text-gray-600 hover:text-gray-400 transition-colors underline underline-offset-2"
          >
            {showHelp ? 'Hide' : 'How to connect'}
          </button>
        )}
      </div>

      {/* Connected details */}
      {state === 'connected' && status && (
        <div className="space-y-1.5 text-xs text-gray-500">
          {status.pluginVersion && (
            <div className="flex justify-between">
              <span>Plugin version</span>
              <span className="text-gray-400 font-mono">{status.pluginVersion}</span>
            </div>
          )}
          {status.lastSeenAgo !== null && (
            <div className="flex justify-between">
              <span>Last ping</span>
              <span className="text-gray-400 font-mono">
                {status.lastSeenAgo < 5 ? 'just now' : `${status.lastSeenAgo}s ago`}
              </span>
            </div>
          )}
          {status.queueDepth > 0 && (
            <div className="flex justify-between">
              <span>Pending commands</span>
              <span className="text-[#FFB81C] font-mono">{status.queueDepth}</span>
            </div>
          )}
        </div>
      )}

      {/* Help panel */}
      {showHelp && state === 'disconnected' && (
        <div className="mt-3 pt-3 border-t border-white/8 space-y-2.5">
          <p className="text-xs font-medium text-gray-400">Setup instructions:</p>
          {[
            'Open Roblox Studio',
            'Go to Plugins tab → Manage Plugins',
            'Search for "ForjeGames" and install',
            'Click "Connect" in the ForjeGames toolbar',
          ].map((step, i) => (
            <div key={step} className="flex items-start gap-2 text-xs text-gray-500">
              <span className="text-[#FFB81C] font-mono flex-shrink-0">{i + 1}.</span>
              <span>{step}</span>
            </div>
          ))}
          <a
            href="/docs/studio-plugin"
            className="inline-flex items-center gap-1 text-xs text-[#FFB81C]/70 hover:text-[#FFB81C] transition-colors mt-1"
          >
            Plugin download &amp; docs
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}
    </div>
  )
}
