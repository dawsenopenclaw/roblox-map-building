'use client'

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  createContext,
  useContext,
  type ReactNode,
} from 'react'
import {
  ForjeWebSocket,
  getWebSocket,
  type WSConnectionState,
  type WSMessage,
} from '@/lib/ws-client'
import { useAuth } from '@clerk/nextjs'
import React from 'react'

// ─── Types ──────────────────────────────────────────────────────────────────

type WSMessageHandler = (data: WSMessage) => void

interface WebSocketContextValue {
  /** Whether the WebSocket is currently open */
  connected: boolean
  /** Detailed connection state: connecting | connected | disconnected | reconnecting */
  connectionState: WSConnectionState
  /** Send a typed message over WebSocket. Queues if not connected. */
  send: (data: WSMessage) => void
  /** Subscribe to a message type. Returns unsubscribe function. */
  on: (type: string, handler: WSMessageHandler) => () => void
  /** Unsubscribe a handler from a message type */
  off: (type: string, handler: WSMessageHandler) => void
  /** The raw ForjeWebSocket instance (escape hatch) */
  ws: ForjeWebSocket | null
}

// ─── Context ────────────────────────────────────────────────────────────────

const WebSocketContext = createContext<WebSocketContextValue | null>(null)

// ─── Provider ───────────────────────────────────────────────────────────────

/**
 * Wrap your app (or a subtree) with this provider to share a single WebSocket
 * connection across all consumers. Automatically connects on mount using the
 * current Clerk auth token and disconnects on unmount.
 *
 * Usage:
 *   <WebSocketProvider>
 *     <App />
 *   </WebSocketProvider>
 */
export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { getToken } = useAuth()
  const wsRef = useRef<ForjeWebSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const [connectionState, setConnectionState] = useState<WSConnectionState>('disconnected')

  useEffect(() => {
    const ws = getWebSocket()
    wsRef.current = ws

    // Sync state from the WS client
    const unsubState = ws.onStateChange((state) => {
      setConnectionState(state)
      setConnected(state === 'connected')
    })

    const connectWS = async () => {
      try {
        const token = await getToken()
        if (token) {
          await ws.connect(token)
        }
      } catch {
        // Connection failed — will auto-retry via exponential backoff
      }
    }

    connectWS()

    return () => {
      unsubState()
      // Don't disconnect on provider unmount — the singleton persists
      // so other parts of the app can still use the connection.
      // Call resetWebSocket() explicitly if you need to tear down.
    }
  }, [getToken])

  const send = useCallback((data: WSMessage) => {
    wsRef.current?.send(data)
  }, [])

  const on = useCallback((type: string, handler: WSMessageHandler) => {
    return wsRef.current?.on(type, handler) || (() => {})
  }, [])

  const off = useCallback((type: string, handler: WSMessageHandler) => {
    wsRef.current?.off(type, handler)
  }, [])

  const value: WebSocketContextValue = {
    connected,
    connectionState,
    send,
    on,
    off,
    ws: wsRef.current,
  }

  return React.createElement(WebSocketContext.Provider, { value }, children)
}

// ─── Hook ───────────────────────────────────────────────────────────────────

/**
 * Access the shared WebSocket connection.
 *
 * If used inside a <WebSocketProvider>, returns the shared context.
 * If used standalone (no provider), creates and manages its own connection.
 *
 * Returns: { connected, connectionState, send, on, off, ws }
 */
export function useWebSocket(): WebSocketContextValue {
  // Try context first — preferred path when provider is mounted
  const ctx = useContext(WebSocketContext)

  // Standalone fallback state — only used when no provider is present
  const { getToken } = useAuth()
  const wsRef = useRef<ForjeWebSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const [connectionState, setConnectionState] = useState<WSConnectionState>('disconnected')

  useEffect(() => {
    // If we have a provider, skip standalone setup
    if (ctx) return

    const ws = getWebSocket()
    wsRef.current = ws

    const unsubState = ws.onStateChange((state) => {
      setConnectionState(state)
      setConnected(state === 'connected')
    })

    const connectWS = async () => {
      try {
        const token = await getToken()
        if (token) {
          await ws.connect(token)
        }
      } catch {
        // Connection failed — auto-retry handles reconnection
      }
    }

    // Only connect if not already connected (singleton may be reused)
    if (!ws.connected) {
      connectWS()
    } else {
      setConnected(true)
      setConnectionState('connected')
    }

    return () => {
      unsubState()
    }
  }, [getToken, ctx])

  const send = useCallback((data: WSMessage) => {
    wsRef.current?.send(data)
  }, [])

  const on = useCallback((type: string, handler: WSMessageHandler) => {
    return wsRef.current?.on(type, handler) || (() => {})
  }, [])

  const off = useCallback((type: string, handler: WSMessageHandler) => {
    wsRef.current?.off(type, handler)
  }, [])

  // Return context if available, otherwise standalone values
  if (ctx) return ctx

  return {
    connected,
    connectionState,
    send,
    on,
    off,
    ws: wsRef.current,
  }
}
