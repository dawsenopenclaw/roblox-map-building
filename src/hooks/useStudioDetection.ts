'use client'
/**
 * useStudioDetection — polls /api/studio/status every 3 seconds to track
 * whether the Studio plugin is connected.
 *
 * Returns:
 *   isConnected  — true when the session heartbeat is fresh
 *   placeName    — human-readable place name reported by the plugin
 *   placeId      — Roblox place ID
 *   lastHeartbeat — Unix ms of the most recent plugin ping, or null
 *   sessionId    — active session ID (needed to queue commands)
 *
 * Auto-reconnects by continuing to poll after a drop — no manual retry needed.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StudioDetectionState {
  isConnected: boolean
  placeName: string | null
  placeId: string | null
  lastHeartbeat: number | null
  sessionId: string | null
}

interface StatusApiResponse {
  connected: boolean
  placeName: string | null
  placeId: string | null
  lastHeartbeat: number | null
  sessionId: string | null
  serverTime: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const POLL_INTERVAL_MS = 3_000

const INITIAL_STATE: StudioDetectionState = {
  isConnected: false,
  placeName: null,
  placeId: null,
  lastHeartbeat: null,
  sessionId: null,
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useStudioDetection(
  /** Provide a session ID to poll a specific session, or leave undefined to
   *  poll the most-recently-active session (when the editor stores it). */
  sessionId?: string | null,
): StudioDetectionState {
  const [state, setState] = useState<StudioDetectionState>(INITIAL_STATE)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Track the latest sessionId across renders without re-running the effect
  const sessionIdRef = useRef(sessionId)

  useEffect(() => {
    sessionIdRef.current = sessionId
  }, [sessionId])

  const poll = useCallback(async () => {
    const sid = sessionIdRef.current
    const url = sid
      ? `/api/studio/status?sessionId=${encodeURIComponent(sid)}`
      : '/api/studio/status'

    try {
      const res = await fetch(url, { credentials: 'include' })
      if (!res.ok) {
        setState((prev) => ({ ...prev, isConnected: false }))
        return
      }

      const data = (await res.json()) as StatusApiResponse

      setState({
        isConnected: data.connected,
        placeName: data.placeName ?? null,
        placeId: data.placeId ? String(data.placeId) : null,
        lastHeartbeat: data.lastHeartbeat ?? null,
        sessionId: data.sessionId ?? null,
      })
    } catch (err) {
      console.error('[StudioDetection] Status poll failed:', err instanceof Error ? err.message : err)
      setState((prev) => ({ ...prev, isConnected: false }))
    }
  }, [])

  useEffect(() => {
    // Immediate poll so the UI reflects reality before the first interval fires
    void poll()
    intervalRef.current = setInterval(() => void poll(), POLL_INTERVAL_MS)

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [poll])

  return state
}
