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
  /** Unix ms timestamp of when the latest screenshot arrived */
  screenshotTimestamp: number | null
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
  /** Base64 PNG without data-URI prefix — matches what stream/route.ts pushes as { image } */
  image: string
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
const BACKOFF_MAX_MS = 30_000   // was 10 s — raised to match UX spec
const POLL_FALLBACK_INTERVAL_MS = 2000

// ─── Reconnect phase exposed to consumers ─────────────────────────────────────

export type SSEReconnectPhase = 'connected' | 'lost' | 'reconnecting' | 'failed'

const INITIAL_STATE: StudioLiveState = {
  camera: null,
  partCount: 0,
  nearbyParts: [],
  selection: [],
  screenshotUrl: null,
  screenshotTimestamp: null,
  lastHeartbeat: 0,
  commandResults: [],
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStudioSSE(sessionId: string | null) {
  const [studioLive, setStudioLive] = useState<StudioLiveState>(INITIAL_STATE)
  const [isSSEConnected, setIsSSEConnected] = useState(false)
  const [reconnectPhase, setReconnectPhase] = useState<SSEReconnectPhase>('connected')
  const [reconnectAttempt, setReconnectAttempt] = useState(0)
  /** Round-trip latency in ms measured from the polling fallback, or null when SSE is active */
  const [latencyMs, setLatencyMs] = useState<number | null>(null)

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
    if (!payload.image) return
    // Normalise: accept bare base64 or an existing data-URI
    const dataUri = payload.image.startsWith('data:')
      ? payload.image
      : `data:image/png;base64,${payload.image}`
    setStudioLive((prev) => ({
      ...prev,
      screenshotUrl: dataUri,
      screenshotTimestamp: Date.now(),
    }))
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
      const t0 = Date.now()
      try {
        const res = await fetch(`/api/studio/status?sessionId=${sid}`)
        if (!res.ok) return
        const rtt = Date.now() - t0
        setLatencyMs(rtt)
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
          screenshotTimestamp: data.screenshotUrl ? Date.now() : prev.screenshotTimestamp,
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
      setReconnectPhase('connected')
      setReconnectAttempt(0)
      setLatencyMs(null)
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
      // When the server returns 4xx/5xx or the network is unavailable the
      // EventSource may stay CONNECTING and fire onerror repeatedly without
      // ever reaching CLOSED. We close and schedule reconnect for both
      // CONNECTING and CLOSED states — OPEN errors are non-fatal (e.g. a
      // server-sent error event) so we leave those to the server to handle.
      if (es.readyState !== EventSource.OPEN) {
        closeSSE()
        scheduleReconnect(sid)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyContext, applyScreenshot, applyCommandResult, applyHeartbeat, closeSSE, stopPollingFallback])

  // scheduleReconnect uses ref-based indirection to break the circular dependency
  // between connect (which calls scheduleReconnect on error) and scheduleReconnect
  // (which calls connect to retry). The ref is initialised with a real implementation
  // immediately so it works even on the very first SSE error — before any useEffect
  // has had a chance to run. The implementation reads connectRef/startPollingFallbackRef
  // via stable refs so it never goes stale despite being set once.
  const connectRef = useRef<(sid: string) => void>(() => undefined)
  const startPollingFallbackRef = useRef<(sid: string) => void>(() => undefined)

  const scheduleReconnectRef = useRef<(sid: string) => void>((sid: string) => {
    attemptRef.current += 1
    const attempt = attemptRef.current

    // Signal "lost" on first drop, "reconnecting" on subsequent attempts
    if (attempt === 1) {
      setReconnectPhase('lost')
    } else {
      setReconnectPhase('reconnecting')
    }
    setReconnectAttempt(attempt)

    if (attempt > MAX_RECONNECT_ATTEMPTS) {
      setReconnectPhase('failed')
      startPollingFallbackRef.current(sid)
      return
    }

    const delay = Math.min(
      BACKOFF_BASE_MS * Math.pow(2, attempt - 1),
      BACKOFF_MAX_MS,
    )

    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
    reconnectTimerRef.current = setTimeout(() => {
      if (sessionIdRef.current === sid) {
        setReconnectPhase('reconnecting')
        connectRef.current(sid)
      }
    }, delay)
  })

  const scheduleReconnect = useCallback((sid: string) => {
    scheduleReconnectRef.current(sid)
  }, [])

  // Keep the stable-ref proxies current so scheduleReconnectRef's inline
  // implementation always calls the latest versions of connect and
  // startPollingFallback (they are useCallback-stable but may change if their
  // own deps change).
  useEffect(() => { connectRef.current = connect }, [connect])
  useEffect(() => { startPollingFallbackRef.current = startPollingFallback }, [startPollingFallback])

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

  return {
    studioLive,
    isSSEConnected,
    reconnectPhase,
    reconnectAttempt,
    latencyMs,
    /** Convenience alias — the latest base64 PNG from Studio (no data-URI prefix) */
    latestScreenshot: studioLive.screenshotUrl,
    /** Unix ms timestamp of when the latest screenshot arrived, or null if none yet */
    screenshotTimestamp: studioLive.screenshotTimestamp,
  }
}
