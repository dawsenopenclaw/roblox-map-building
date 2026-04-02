'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NearbyPart {
  name: string
  className: string
  position: string
  size: string
  material: string
}

export interface SelectedObject {
  name: string
  className: string
  path: string
  position?: string
  size?: string
  material?: string
}

export interface CommandResult {
  id: string
  success: boolean
  error?: string
  timestamp: number
}

export interface StudioLiveState {
  camera: {
    posX: number
    posY: number
    posZ: number
    lookX: number
    lookY: number
    lookZ: number
  } | null
  partCount: number
  nearbyParts: NearbyPart[]
  selection: SelectedObject[]
  screenshotUrl: string | null
  lastHeartbeat: number
  commandResults: CommandResult[]
}

// ─── SSE event payloads ───────────────────────────────────────────────────────

interface ContextPayload {
  camera?: StudioLiveState['camera']
  partCount?: number
  nearbyParts?: NearbyPart[]
  selection?: SelectedObject[]
}

interface ScreenshotPayload {
  url: string
}

interface CommandResultPayload {
  id: string
  success: boolean
  error?: string
}

interface HeartbeatPayload {
  ts?: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_COMMAND_RESULTS = 20
const MAX_RECONNECT_ATTEMPTS = 3
const BACKOFF_BASE_MS = 1000
const BACKOFF_MAX_MS = 10_000
const POLL_FALLBACK_INTERVAL_MS = 2000

const INITIAL_STATE: StudioLiveState = {
  camera: null,
  partCount: 0,
  nearbyParts: [],
  selection: [],
  screenshotUrl: null,
  lastHeartbeat: 0,
  commandResults: [],
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStudioSSE(sessionId: string | null) {
  const [studioLive, setStudioLive] = useState<StudioLiveState>(INITIAL_STATE)
  const [isSSEConnected, setIsSSEConnected] = useState(false)

  // Internal refs — survive re-renders without causing them
  const esRef = useRef<EventSource | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const attemptRef = useRef(0)
  const isPollingFallbackRef = useRef(false)
  const sessionIdRef = useRef(sessionId)

  // Keep sessionId ref in sync
  useEffect(() => {
    sessionIdRef.current = sessionId
  }, [sessionId])

  // ── State updaters ──────────────────────────────────────────────────────────

  const applyContext = useCallback((payload: ContextPayload) => {
    setStudioLive((prev) => ({
      ...prev,
      camera: payload.camera ?? prev.camera,
      partCount: payload.partCount ?? prev.partCount,
      nearbyParts: payload.nearbyParts ?? prev.nearbyParts,
      selection: payload.selection ?? prev.selection,
    }))
  }, [])

  const applyScreenshot = useCallback((payload: ScreenshotPayload) => {
    setStudioLive((prev) => ({ ...prev, screenshotUrl: payload.url }))
  }, [])

  const applyCommandResult = useCallback((payload: CommandResultPayload) => {
    const result: CommandResult = {
      id: payload.id,
      success: payload.success,
      error: payload.error,
      timestamp: Date.now(),
    }
    setStudioLive((prev) => ({
      ...prev,
      commandResults: [result, ...prev.commandResults].slice(0, MAX_COMMAND_RESULTS),
    }))
  }, [])

  const applyHeartbeat = useCallback((payload: HeartbeatPayload) => {
    setStudioLive((prev) => ({
      ...prev,
      lastHeartbeat: payload.ts ?? Date.now(),
    }))
  }, [])

  // ── Polling fallback ────────────────────────────────────────────────────────

  const stopPollingFallback = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
    isPollingFallbackRef.current = false
  }, [])

  const startPollingFallback = useCallback((sid: string) => {
    if (isPollingFallbackRef.current) return
    isPollingFallbackRef.current = true

    const poll = async () => {
      try {
        const res = await fetch(`/api/studio/status?sessionId=${sid}`)
        if (!res.ok) return
        const data = await res.json() as {
          camera?: StudioLiveState['camera']
          partCount?: number
          nearbyParts?: NearbyPart[]
          selection?: SelectedObject[]
          screenshotUrl?: string
        }
        setStudioLive((prev) => ({
          ...prev,
          camera: data.camera ?? prev.camera,
          partCount: data.partCount ?? prev.partCount,
          nearbyParts: data.nearbyParts ?? prev.nearbyParts,
          selection: data.selection ?? prev.selection,
          screenshotUrl: data.screenshotUrl ?? prev.screenshotUrl,
          lastHeartbeat: Date.now(),
        }))
      } catch {
        // silent — polling will retry next interval
      }
    }

    void poll()
    pollTimerRef.current = setInterval(poll, POLL_FALLBACK_INTERVAL_MS)
  }, [])

  // ── SSE lifecycle ───────────────────────────────────────────────────────────

  const closeSSE = useCallback(() => {
    if (esRef.current) {
      esRef.current.close()
      esRef.current = null
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
    setIsSSEConnected(false)
  }, [])

  const connect = useCallback((sid: string) => {
    // Tear down any existing connection first
    if (esRef.current) {
      esRef.current.close()
      esRef.current = null
    }

    const url = `/api/studio/stream?sessionId=${encodeURIComponent(sid)}`
    const es = new EventSource(url)
    esRef.current = es

    es.onopen = () => {
      attemptRef.current = 0
      setIsSSEConnected(true)
      stopPollingFallback()
    }

    es.addEventListener('context', (e: MessageEvent<string>) => {
      try {
        const payload = JSON.parse(e.data) as ContextPayload
        applyContext(payload)
      } catch { /* malformed — skip */ }
    })

    es.addEventListener('screenshot', (e: MessageEvent<string>) => {
      try {
        const payload = JSON.parse(e.data) as ScreenshotPayload
        applyScreenshot(payload)
      } catch { /* malformed — skip */ }
    })

    es.addEventListener('command_result', (e: MessageEvent<string>) => {
      try {
        const payload = JSON.parse(e.data) as CommandResultPayload
        applyCommandResult(payload)
      } catch { /* malformed — skip */ }
    })

    es.addEventListener('heartbeat', (e: MessageEvent<string>) => {
      try {
        const payload = (e.data ? JSON.parse(e.data) : {}) as HeartbeatPayload
        applyHeartbeat(payload)
      } catch { /* malformed — skip */ }
    })

    es.addEventListener('disconnect', () => {
      closeSSE()
      scheduleReconnect(sid)
    })

    es.onerror = () => {
      // onerror fires for both connection failures and server-sent errors.
      // EventSource readyState: 0=CONNECTING, 1=OPEN, 2=CLOSED
      if (es.readyState === EventSource.CLOSED) {
        closeSSE()
        scheduleReconnect(sid)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyContext, applyScreenshot, applyCommandResult, applyHeartbeat, closeSSE, stopPollingFallback])

  // Defined after connect to avoid circular ref — use ref-based indirection
  const scheduleReconnectRef = useRef<(sid: string) => void>(() => undefined)

  const scheduleReconnect = useCallback((sid: string) => {
    scheduleReconnectRef.current(sid)
  }, [])

  // Wire up the actual implementation into the ref after both are defined
  useEffect(() => {
    scheduleReconnectRef.current = (sid: string) => {
      attemptRef.current += 1

      if (attemptRef.current > MAX_RECONNECT_ATTEMPTS) {
        // Give up on SSE — fall back to polling
        startPollingFallback(sid)
        return
      }

      const delay = Math.min(
        BACKOFF_BASE_MS * Math.pow(2, attemptRef.current - 1),
        BACKOFF_MAX_MS,
      )

      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = setTimeout(() => {
        if (sessionIdRef.current === sid) {
          connect(sid)
        }
      }, delay)
    }
  }, [connect, startPollingFallback])

  // ── Effect: open/close SSE when sessionId changes ──────────────────────────

  useEffect(() => {
    if (!sessionId) {
      closeSSE()
      stopPollingFallback()
      setStudioLive(INITIAL_STATE)
      attemptRef.current = 0
      return
    }

    // New session — reset attempt counter and connect fresh
    attemptRef.current = 0
    connect(sessionId)

    return () => {
      closeSSE()
      stopPollingFallback()
    }
  // connect and closeSSE are stable callbacks; sessionId is the only real dep
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  return { studioLive, isSSEConnected }
}
