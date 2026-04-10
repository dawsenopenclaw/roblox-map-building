'use client'

// ─── WebSocket Message Types ────────────────────────────────────────────────

export type WSMessageType =
  | 'auth_ok'
  | 'auth_error'
  | 'chat-stream'
  | 'chat_chunk'
  | 'chat_done'
  | 'chat_error'
  | 'chat'
  | 'studio-sync'
  | 'playtest-update'
  | 'notification'
  | 'ping'
  | 'pong'
  | 'error'
  | 'close'
  | '*'

export type WSConnectionState =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'reconnecting'

export interface WSMessage {
  type: string
  [key: string]: unknown
}

type WSMessageHandler = (data: WSMessage) => void

// ─── Constants ──────────────────────────────────────────────────────────────

const HEARTBEAT_INTERVAL_MS = 30_000
const BACKOFF_BASE_MS = 1_000
const BACKOFF_MAX_MS = 30_000
const MAX_RECONNECT_ATTEMPTS = Infinity // keep trying indefinitely
const MESSAGE_QUEUE_MAX = 200

// ─── WebSocket Client ───────────────────────────────────────────────────────

export class ForjeWebSocket {
  private ws: WebSocket | null = null
  private url: string
  private handlers = new Map<string, Set<WSMessageHandler>>()
  private reconnectAttempts = 0
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private messageQueue: WSMessage[] = []
  private _connectionState: WSConnectionState = 'disconnected'
  private _stateListeners = new Set<(state: WSConnectionState) => void>()
  private _token: string | null = null
  private intentionalClose = false

  constructor(url: string) {
    this.url = url
  }

  // ── Connection state management ───────────────────────────────────────────

  get connectionState(): WSConnectionState {
    return this._connectionState
  }

  private setConnectionState(state: WSConnectionState): void {
    if (this._connectionState === state) return
    this._connectionState = state
    this._stateListeners.forEach((fn) => {
      try { fn(state) } catch { /* listener error — skip */ }
    })
  }

  /** Subscribe to connection state changes. Returns unsubscribe function. */
  onStateChange(listener: (state: WSConnectionState) => void): () => void {
    this._stateListeners.add(listener)
    return () => { this._stateListeners.delete(listener) }
  }

  // ── Connect ───────────────────────────────────────────────────────────────

  connect(token: string): Promise<void> {
    this._token = token
    this.intentionalClose = false

    return new Promise((resolve, reject) => {
      try {
        this.cleanupConnection()
        this.setConnectionState(
          this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting',
        )

        const sep = this.url.includes('?') ? '&' : '?'
        this.ws = new WebSocket(`${this.url}${sep}token=${encodeURIComponent(token)}`)

        this.ws.onopen = () => {
          this.reconnectAttempts = 0
          this.setConnectionState('connected')

          // Flush queued messages
          while (this.messageQueue.length > 0) {
            const msg = this.messageQueue.shift()
            if (msg) this.sendRaw(msg)
          }

          // Start heartbeat
          this.startHeartbeat()
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data as string) as WSMessage

            // Handle server pong — reset heartbeat miss counter
            if (data.type === 'pong') return

            // Dispatch to type-specific handlers
            const typeHandlers = this.handlers.get(data.type)
            if (typeHandlers) {
              typeHandlers.forEach((h) => {
                try { h(data) } catch { /* handler error — skip */ }
              })
            }

            // Dispatch to wildcard handlers
            const allHandlers = this.handlers.get('*')
            if (allHandlers) {
              allHandlers.forEach((h) => {
                try { h(data) } catch { /* handler error — skip */ }
              })
            }
          } catch {
            // Malformed JSON — skip
          }
        }

        this.ws.onclose = (event) => {
          this.stopHeartbeat()

          // Notify close handlers
          const closeHandlers = this.handlers.get('close')
          if (closeHandlers) {
            closeHandlers.forEach((h) => {
              try { h({ type: 'close', code: event.code, reason: event.reason }) } catch { /* skip */ }
            })
          }

          if (this.intentionalClose) {
            this.setConnectionState('disconnected')
            return
          }

          // Auto-reconnect on unclean close
          if (!event.wasClean || event.code !== 1000) {
            this.scheduleReconnect()
          } else {
            this.setConnectionState('disconnected')
          }
        }

        this.ws.onerror = () => {
          // Only reject the initial connect promise — reconnects are handled internally
          if (this._connectionState === 'connecting') {
            reject(new Error('WebSocket connection failed'))
          }
        }
      } catch (e) {
        this.setConnectionState('disconnected')
        reject(e)
      }
    })
  }

  // ── Reconnection with exponential backoff ─────────────────────────────────

  private scheduleReconnect(): void {
    if (this.intentionalClose) return
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      this.setConnectionState('disconnected')
      return
    }

    this.reconnectAttempts++
    this.setConnectionState('reconnecting')

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (capped)
    const delay = Math.min(
      BACKOFF_BASE_MS * Math.pow(2, this.reconnectAttempts - 1),
      BACKOFF_MAX_MS,
    )

    // Add jitter (0-25% of delay) to prevent thundering herd
    const jitter = Math.random() * delay * 0.25
    const totalDelay = delay + jitter

    this.reconnectTimer = setTimeout(() => {
      if (this._token && !this.intentionalClose) {
        this.connect(this._token).catch(() => {
          // connect() failure triggers onclose which calls scheduleReconnect again
        })
      }
    }, totalDelay)
  }

  // ── Send ──────────────────────────────────────────────────────────────────

  send(data: WSMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendRaw(data)
    } else {
      // Queue messages when not connected
      if (this.messageQueue.length < MESSAGE_QUEUE_MAX) {
        this.messageQueue.push(data)
      }
    }
  }

  private sendRaw(data: WSMessage): void {
    try {
      this.ws?.send(JSON.stringify(data))
    } catch {
      // Send failed — queue for retry
      if (this.messageQueue.length < MESSAGE_QUEUE_MAX) {
        this.messageQueue.push(data)
      }
    }
  }

  // ── Event handlers ────────────────────────────────────────────────────────

  on(type: string, handler: WSMessageHandler): () => void {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set())
    this.handlers.get(type)!.add(handler)
    return () => this.off(type, handler)
  }

  off(type: string, handler: WSMessageHandler): void {
    this.handlers.get(type)?.delete(handler)
  }

  // ── Heartbeat ─────────────────────────────────────────────────────────────

  private startHeartbeat(): void {
    this.stopHeartbeat()
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.sendRaw({ type: 'ping' })
      }
    }, HEARTBEAT_INTERVAL_MS)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  // ── Disconnect ────────────────────────────────────────────────────────────

  disconnect(): void {
    this.intentionalClose = true
    this.stopHeartbeat()

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    this.ws?.close(1000, 'Client disconnect')
    this.ws = null
    this.setConnectionState('disconnected')
  }

  // ── Cleanup (internal — before reconnect) ─────────────────────────────────

  private cleanupConnection(): void {
    this.stopHeartbeat()
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      // Remove event handlers to prevent double-fire during reconnect
      this.ws.onopen = null
      this.ws.onmessage = null
      this.ws.onclose = null
      this.ws.onerror = null
      try { this.ws.close() } catch { /* already closed */ }
      this.ws = null
    }
  }

  // ── Convenience getters ───────────────────────────────────────────────────

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  get queuedMessageCount(): number {
    return this.messageQueue.length
  }
}

// ─── Singleton ──────────────────────────────────────────────────────────────

let wsInstance: ForjeWebSocket | null = null

export function getWebSocket(): ForjeWebSocket {
  if (!wsInstance) {
    // WebSocket connections go directly to the Hono API server because
    // Next.js App Router does not support WebSocket upgrade. In production
    // the API is at api.forjegames.com; locally it runs on :3001.
    const apiUrl =
      typeof window !== 'undefined'
        ? process.env.NEXT_PUBLIC_API_URL || (
            window.location.hostname === 'localhost'
              ? 'http://localhost:3001'
              : window.location.origin
          )
        : 'http://localhost:3001'
    const wsUrl = apiUrl
      .replace(/^https:/, 'wss:')
      .replace(/^http:/, 'ws:')
    wsInstance = new ForjeWebSocket(`${wsUrl}/api/ws`)
  }
  return wsInstance
}

/**
 * Reset the singleton — useful for testing or when switching environments.
 */
export function resetWebSocket(): void {
  if (wsInstance) {
    wsInstance.disconnect()
    wsInstance = null
  }
}
