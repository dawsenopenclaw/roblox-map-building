'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

export type ConnectFlowState = 'idle' | 'generating' | 'code' | 'connected'

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
  placeName: string
  placeId: number | null
  screenshotUrl: string | null
  connectFlow: ConnectFlowState
  connectCode: string
  connectTimer: number
  activity: StudioActivity[]
  commandsSent: number
  studioContext: StudioContext
}

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

export function useStudioConnection() {
  const [state, setState] = useState<StudioConnectionState>({
    isConnected: false,
    sessionId: null,
    placeName: '',
    placeId: null,
    screenshotUrl: null,
    connectFlow: 'idle',
    connectCode: '',
    connectTimer: 300,
    activity: [],
    commandsSent: 0,
    studioContext: { camera: null, partCount: 0, nearbyParts: [] },
  })

  const codeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const statusPollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const screenshotPollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopAllPolling = useCallback(() => {
    if (codeTimerRef.current) { clearInterval(codeTimerRef.current); codeTimerRef.current = null }
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
        return {
          ...prev,
          isConnected: data.connected ?? false,
          placeName: data.placeName ?? prev.placeName,
          placeId: data.placeId ?? prev.placeId,
          screenshotUrl: data.screenshotUrl ?? prev.screenshotUrl,
          sessionId: data.sessionId ?? prev.sessionId,
          studioContext: ctx,
        }
      })
    } catch {
      // network error — stay silent
    }
  }, [])

  const pollScreenshot = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch(`/api/studio/screenshot?sessionId=${sessionId}`)
      if (!res.ok) return
      const data = await res.json() as { screenshotUrl?: string }
      if (data.screenshotUrl) {
        setState((prev) => ({ ...prev, screenshotUrl: data.screenshotUrl! }))
      }
    } catch {
      // silent
    }
  }, [])

  const generateCode = useCallback(async () => {
    setState((prev) => ({ ...prev, connectFlow: 'generating' }))
    try {
      const res = await fetch('/api/studio/auth?action=generate')
      if (!res.ok) throw new Error('Failed to generate code')
      const data = await res.json() as { code: string }
      const code = data.code.toUpperCase()

      setState((prev) => ({
        ...prev,
        connectFlow: 'code',
        connectCode: code,
        connectTimer: 300,
      }))

      // Countdown
      if (codeTimerRef.current) clearInterval(codeTimerRef.current)
      codeTimerRef.current = setInterval(() => {
        setState((prev) => {
          if (prev.connectTimer <= 1) {
            // Auto-refresh code — will re-trigger via flow reset
            return { ...prev, connectFlow: 'idle', connectTimer: 300, connectCode: '' }
          }
          return { ...prev, connectTimer: prev.connectTimer - 1 }
        })
      }, 1000)
    } catch {
      setState((prev) => ({ ...prev, connectFlow: 'idle' }))
    }
  }, [])

  // When code resets to idle (timer expired), regenerate automatically
  const flowRef = useRef<ConnectFlowState>('idle')
  useEffect(() => {
    if (state.connectFlow === 'idle' && flowRef.current === 'code') {
      // Timer expired — auto-regenerate
      generateCode()
    }
    flowRef.current = state.connectFlow
  }, [state.connectFlow, generateCode])

  const confirmConnected = useCallback(() => {
    stopAllPolling()
    const sessionId = 'manual-' + Date.now()
    setState((prev) => ({
      ...prev,
      isConnected: true,
      connectFlow: 'connected',
      sessionId,
      placeName: prev.placeName || 'Roblox Studio',
    }))
    addActivity('Connected to Roblox Studio')

    // Single fast poll — status + context every 2s, screenshots every 8s
    statusPollRef.current = setInterval(() => pollStatus(sessionId), 2000)
    screenshotPollRef.current = setInterval(() => pollScreenshot(sessionId), 8000)
  }, [stopAllPolling, addActivity, pollStatus, pollScreenshot])

  const disconnect = useCallback(() => {
    stopAllPolling()
    setState({
      isConnected: false,
      sessionId: null,
      placeName: '',
      placeId: null,
      screenshotUrl: null,
      connectFlow: 'idle',
      connectCode: '',
      connectTimer: 300,
      activity: [],
      commandsSent: 0,
      studioContext: { camera: null, partCount: 0, nearbyParts: [] },
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

  return {
    ...state,
    generateCode,
    confirmConnected,
    disconnect,
    recordCommand,
    addActivity,
  }
}
