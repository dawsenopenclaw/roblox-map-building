'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useStudioSSE, type SSEReconnectPhase } from './useStudioSSE'

export type ConnectFlowState = 'idle' | 'generating' | 'code' | 'connected'

// ─── Actionable error message mapping ─────────────────────────────────────────

function mapConnectionError(raw: string): string {
  if (/HttpService.*not enabled|HttpEnabled/i.test(raw)) {
    return 'Open Game Settings → Security → Enable "Allow HTTP Requests"'
  }
  if (/code_expired|code_invalid|invalid_code|expired/i.test(raw)) {
    return 'Code expired. Click "Generate New Code" to get a fresh one'
  }
  if (/rate_limit|too many/i.test(raw)) {
    return 'Too many attempts. Wait 60 seconds, then try again'
  }
  if (/timeout|ETIMEDOUT|ECONNREFUSED|network/i.test(raw)) {
    return "Can't reach ForjeGames servers. Check your internet connection"
  }
  return raw
}

export interface StudioActivity {
  id: string
  message: string
  timestamp: Date
}

export interface StudioCamera {
  posX: number; posY: number; posZ: number
  lookX: number; lookY: number; lookZ: number
}

export interface StudioContext {
  camera: StudioCamera | null
  partCount: number
  nearbyParts: { name: string; className: string; position: string; size: string; material: string }[]
}

export interface StudioConnectionState {
  isConnected: boolean
  sessionId: string | null
  /** JWT for authenticating execute/sync calls */
  jwt: string | null
  placeName: string
  placeId: number | null
  screenshotUrl: string | null
  /** Unix ms timestamp of when the latest screenshot arrived */
  screenshotTimestamp: number | null
  /** Base64 PNG captured before the last build command — for before/after comparison */
  beforeScreenshotUrl: string | null
  connectFlow: ConnectFlowState
  connectCode: string
  connectTimer: number
  activity: StudioActivity[]
  commandsSent: number
  studioContext: StudioContext
  connectionError: string | null
  /** SSE reconnect phase — drives the reconnect banner in the editor */
  sseReconnectPhase: SSEReconnectPhase
  /** How many reconnect attempts have been made since last clean connect */
  sseReconnectAttempt: number
  /** Round-trip latency in ms (null when using live SSE, measured during poll fallback) */
  latencyMs: number | null
}

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

export function useStudioConnection(onReconnectToast?: (phase: SSEReconnectPhase) => void) {
  const [state, setState] = useState<StudioConnectionState>({
    isConnected: false,
    sessionId: null,
    jwt: null,
    placeName: '',
    placeId: null,
    screenshotUrl: null,
    screenshotTimestamp: null,
    beforeScreenshotUrl: null,
    connectFlow: 'idle',
    connectCode: '',
    connectTimer: 300,
    activity: [],
    commandsSent: 0,
    studioContext: { camera: null, partCount: 0, nearbyParts: [] },
    connectionError: null,
    sseReconnectPhase: 'connected',
    sseReconnectAttempt: 0,
    latencyMs: null,
  })

  // ── SSE for the active session ─────────────────────────────────────────────
  const { studioLive, reconnectPhase, reconnectAttempt, latencyMs } = useStudioSSE(state.sessionId)

  // Mirror SSE screenshot + timestamp into the main state — this is the live path.
  // Polling (pollScreenshot every 8 s) is the fallback; SSE is real-time.
  useEffect(() => {
    if (!studioLive.screenshotUrl) return
    setState((prev) => {
      if (prev.screenshotUrl === studioLive.screenshotUrl) return prev
      return {
        ...prev,
        screenshotUrl: studioLive.screenshotUrl,
        screenshotTimestamp: studioLive.screenshotTimestamp,
      }
    })
  }, [studioLive.screenshotUrl, studioLive.screenshotTimestamp])

  // Stable ref so the effect below doesn't re-run when caller passes a new arrow fn each render
  const onReconnectToastRef = useRef(onReconnectToast)
  useEffect(() => { onReconnectToastRef.current = onReconnectToast }, [onReconnectToast])

  // Mirror SSE reconnect state into the main state object and fire toasts
  const prevPhaseRef = useRef<SSEReconnectPhase>('connected')
  useEffect(() => {
    if (reconnectPhase === prevPhaseRef.current) return
    prevPhaseRef.current = reconnectPhase
    setState((prev) => ({ ...prev, sseReconnectPhase: reconnectPhase, sseReconnectAttempt: reconnectAttempt }))
    onReconnectToastRef.current?.(reconnectPhase)
  }, [reconnectPhase, reconnectAttempt])

  // Mirror latency
  useEffect(() => {
    setState((prev) => ({ ...prev, latencyMs }))
  }, [latencyMs])

  const codeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const claimPollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const statusPollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const screenshotPollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Store the pending code + token so claim polling can use them
  const pendingCodeRef = useRef<string>('')
  const pendingTokenRef = useRef<string>('')

  const stopAllPolling = useCallback(() => {
    if (codeTimerRef.current) { clearInterval(codeTimerRef.current); codeTimerRef.current = null }
    if (claimPollRef.current) { clearInterval(claimPollRef.current); claimPollRef.current = null }
    if (statusPollRef.current) { clearInterval(statusPollRef.current); statusPollRef.current = null }
    if (screenshotPollRef.current) { clearInterval(screenshotPollRef.current); screenshotPollRef.current = null }
  }, [])

  const addActivity = useCallback((message: string) => {
    setState((prev) => ({
      ...prev,
      activity: [
        { id: uid(), message, timestamp: new Date() },
        ...prev.activity.slice(0, 19),
      ],
    }))
  }, [])

  const pollStatus = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch(`/api/studio/status?sessionId=${sessionId}`)
      if (!res.ok) return
      const data = await res.json() as {
        connected?: boolean
        placeName?: string
        placeId?: number
        screenshotUrl?: string
        sessionId?: string
        camera?: StudioCamera
        partCount?: number
        nearbyParts?: StudioContext['nearbyParts']
      }
      setState((prev) => {
        const ctx: StudioContext = {
          camera: data.camera ?? prev.studioContext.camera,
          partCount: data.partCount ?? prev.studioContext.partCount,
          nearbyParts: data.nearbyParts ?? prev.studioContext.nearbyParts,
        }
        if (prev.isConnected) {
          return {
            ...prev,
            placeName: data.placeName ?? prev.placeName,
            placeId: data.placeId ?? prev.placeId,
            screenshotUrl: data.screenshotUrl ?? prev.screenshotUrl,
            studioContext: ctx,
          }
        }
        // Only flip isConnected to true if the API also returned a valid sessionId.
        // Without a sessionId the connection state would be isConnected=true but
        // sessionId=null — an invalid combination that breaks all subsequent calls.
        const canConnect = data.connected === true && !!data.sessionId
        return {
          ...prev,
          isConnected: canConnect ? true : (data.connected ?? false),
          placeName: data.placeName ?? prev.placeName,
          placeId: data.placeId ?? prev.placeId,
          screenshotUrl: data.screenshotUrl ?? prev.screenshotUrl,
          sessionId: data.sessionId ?? prev.sessionId,
          studioContext: ctx,
        }
      })
    } catch {
      setState((prev) => ({ ...prev, connectionError: mapConnectionError('network') }))
    }
  }, [])

  const pollScreenshot = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch(`/api/studio/screenshot?sessionId=${sessionId}`)
      if (!res.ok) return
      const data = await res.json() as {
        image?: string | null
        beforeImage?: string | null
        capturedAt?: number
      }
      setState((prev) => {
        const next = { ...prev }
        if (data.image) {
          next.screenshotUrl = `data:image/png;base64,${data.image}`
          next.screenshotTimestamp = data.capturedAt ?? Date.now()
        }
        if (data.beforeImage) {
          next.beforeScreenshotUrl = `data:image/png;base64,${data.beforeImage}`
        }
        return next
      })
    } catch {
      // Screenshot poll failures are non-critical — don't surface to UI
    }
  }, [])

  const generateCode = useCallback(async () => {
    setState((prev) => ({ ...prev, connectFlow: 'generating' }))
    try {
      const res = await fetch('/api/studio/auth?action=generate')
      if (!res.ok) throw new Error('Failed to generate code')
      const data = await res.json() as { code: string; expiresAt?: number }
      const code = data.code.toUpperCase()

      // Store pending code so claim polling can use it
      pendingCodeRef.current = code
      pendingTokenRef.current = '' // server no longer issues a token at generate time

      setState((prev) => ({
        ...prev,
        connectFlow: 'code',
        connectCode: code,
        connectTimer: 300,
      }))

      // Countdown timer — resets flow to idle when expired
      if (codeTimerRef.current) clearInterval(codeTimerRef.current)
      codeTimerRef.current = setInterval(() => {
        setState((prev) => {
          if (prev.connectTimer <= 1) {
            return { ...prev, connectFlow: 'idle', connectTimer: 300, connectCode: '' }
          }
          return { ...prev, connectTimer: prev.connectTimer - 1 }
        })
      }, 1000)

      // Poll for plugin claiming the code (every 2 s until claimed or timer expires)
      if (claimPollRef.current) clearInterval(claimPollRef.current)
      claimPollRef.current = setInterval(async () => {
        const currentCode = pendingCodeRef.current
        if (!currentCode) return
        try {
          const pollRes = await fetch(`/api/studio/auth?action=status&code=${encodeURIComponent(currentCode)}`)
          if (!pollRes.ok) return
          const pollData = await pollRes.json() as {
            status: string
            claimed: boolean
            sessionId?: string
            placeName?: string
            placeId?: string
            jwt?: string
          }
          if (pollData.claimed && pollData.status === 'connected') {
            // Plugin has claimed the code — auto-connect
            if (claimPollRef.current) { clearInterval(claimPollRef.current); claimPollRef.current = null }
            if (codeTimerRef.current) { clearInterval(codeTimerRef.current); codeTimerRef.current = null }
            pendingCodeRef.current = ''
            pendingTokenRef.current = ''
            const realSessionId = pollData.sessionId ?? ('session-' + Date.now())
            setState((prev) => ({
              ...prev,
              isConnected: true,
              connectFlow: 'connected',
              connectionError: null,
              sessionId: realSessionId,
              jwt: pollData.jwt ?? null,
              placeName: pollData.placeName ?? prev.placeName ?? 'Roblox Studio',
              placeId: pollData.placeId ? Number(pollData.placeId) : prev.placeId,
              connectCode: '',
              connectTimer: 300,
            }))
            addActivity('Connected to Roblox Studio')
            // Start status + screenshot polling with real sessionId
            if (statusPollRef.current) clearInterval(statusPollRef.current)
            if (screenshotPollRef.current) clearInterval(screenshotPollRef.current)
            statusPollRef.current = setInterval(() => pollStatus(realSessionId), 2000)
            screenshotPollRef.current = setInterval(() => pollScreenshot(realSessionId), 8000)
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'network'
          setState((prev) => ({ ...prev, connectionError: mapConnectionError(msg) }))
        }
      }, 2000)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate connection code'
      setState((prev) => ({ ...prev, connectFlow: 'idle', connectionError: mapConnectionError(msg) }))
    }
  }, [addActivity, pollStatus, pollScreenshot])

  // When the countdown timer expires (code→idle), regenerate automatically.
  // Guard: do NOT regenerate if the user disconnected (isConnected would be false
  // but the transition could also come from disconnect() resetting the flow).
  // We use a separate ref to distinguish timer-expiry from a manual disconnect —
  // timer expiry resets flow to idle while keeping isConnected=false AND
  // connectCode becomes ''. After disconnect() the state is fully reset so
  // state.connectFlow was already 'idle' — flowRef will already equal 'idle'
  // so the condition `flowRef.current === 'code'` won't match.
  const flowRef = useRef<ConnectFlowState>('idle')
  useEffect(() => {
    if (state.connectFlow === 'idle' && flowRef.current === 'code' && !state.isConnected) {
      // Timer expired while showing a code — auto-regenerate
      generateCode()
    }
    flowRef.current = state.connectFlow
  }, [state.connectFlow, state.isConnected, generateCode])

  const confirmConnected = useCallback((overrideSessionId?: string, overrideJwt?: string) => {
    // Stop claim polling — auto-detect already resolved or user manually confirmed
    if (claimPollRef.current) { clearInterval(claimPollRef.current); claimPollRef.current = null }
    if (codeTimerRef.current) { clearInterval(codeTimerRef.current); codeTimerRef.current = null }
    if (statusPollRef.current) { clearInterval(statusPollRef.current); statusPollRef.current = null }
    if (screenshotPollRef.current) { clearInterval(screenshotPollRef.current); screenshotPollRef.current = null }
    pendingCodeRef.current = ''
    pendingTokenRef.current = ''
    const sessionId = overrideSessionId ?? ('manual-' + Date.now())
    setState((prev) => ({
      ...prev,
      isConnected: true,
      connectFlow: 'connected',
      sessionId,
      jwt: overrideJwt ?? null,
      placeName: prev.placeName || 'Roblox Studio',
      connectCode: '',
      connectTimer: 300,
    }))
    addActivity('Connected to Roblox Studio')

    // Status + context every 2s, screenshots every 8s
    statusPollRef.current = setInterval(() => pollStatus(sessionId), 2000)
    screenshotPollRef.current = setInterval(() => pollScreenshot(sessionId), 8000)
  }, [addActivity, pollStatus, pollScreenshot])

  const disconnect = useCallback(() => {
    stopAllPolling()
    pendingCodeRef.current = ''
    pendingTokenRef.current = ''
    setState({
      isConnected: false,
      sessionId: null,
      jwt: null,
      placeName: '',
      placeId: null,
      screenshotUrl: null,
      screenshotTimestamp: null,
      beforeScreenshotUrl: null,
      connectFlow: 'idle',
      connectCode: '',
      connectTimer: 300,
      activity: [],
      commandsSent: 0,
      studioContext: { camera: null, partCount: 0, nearbyParts: [] },
      connectionError: null,
      sseReconnectPhase: 'connected',
      sseReconnectAttempt: 0,
      latencyMs: null,
    })
  }, [stopAllPolling])

  const recordCommand = useCallback((message: string) => {
    setState((prev) => ({
      ...prev,
      commandsSent: prev.commandsSent + 1,
      activity: [
        { id: uid(), message, timestamp: new Date() },
        ...prev.activity.slice(0, 19),
      ],
    }))
  }, [])

  // Cleanup on unmount
  useEffect(() => () => stopAllPolling(), [stopAllPolling])

  // Clear stale localStorage on mount
  useEffect(() => {
    try { localStorage.removeItem('fg_studio_connection') } catch { /* noop */ }
  }, [])

  const requestScreenshot = useCallback(() => {
    if (state.sessionId) void pollScreenshot(state.sessionId)
  }, [state.sessionId, pollScreenshot])

  return {
    ...state,
    generateCode,
    confirmConnected,
    disconnect,
    recordCommand,
    addActivity,
    requestScreenshot,
  }
}
