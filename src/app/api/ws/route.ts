/**
 * GET /api/ws — WebSocket upgrade handler
 *
 * Upgrades the HTTP connection to a WebSocket for real-time communication.
 * Supports chat streaming, studio sync, playtest updates, and notifications.
 *
 * Authentication: Clerk JWT passed via ?token= query parameter.
 * The token is verified using Clerk's JWKS endpoint.
 *
 * Architecture:
 *   - Each authenticated user gets a connection stored in a global Map
 *   - Server can push events to any connected user by userId
 *   - Heartbeat pings every 30s keep the connection alive
 *   - When the AI chat API streams a response, it can forward chunks
 *     through the WebSocket for lower-latency delivery
 *
 * This route uses the Edge runtime for WebSocket support in Next.js.
 * Falls back gracefully — if WebSocket upgrade fails, the client
 * uses HTTP streaming (ReadableStream / SSE) instead.
 */

import { type NextRequest } from 'next/server'
import { jwtVerify, createRemoteJWKSet } from 'jose'

export const runtime = 'edge'

// ─── Clerk JWKS (module scope — reused across invocations) ─────────────────
// Clerk publishes its signing keys at this JWKS endpoint. We create the
// remote key set once per isolate so the underlying cache survives across
// connection upgrades.
const CLERK_DOMAIN = 'clerk.forjegames.com'
const CLERK_JWKS = createRemoteJWKSet(
  new URL(`https://${CLERK_DOMAIN}/.well-known/jwks.json`),
)

// ─── Connection Registry ────────────────────────────────────────────────────

interface WSConnection {
  socket: WebSocket
  userId: string
  connectedAt: number
  lastPing: number
}

// Global connection store — keyed by userId for targeted messaging.
// On edge runtime each isolate has its own Map; cross-instance fanout
// would go through Redis (same pattern as studio-sse-bus.ts).
const connections = new Map<string, Set<WSConnection>>()

/** Send a message to all WebSocket connections for a given userId. */
function pushToUser(userId: string, data: Record<string, unknown>): number {
  const userConns = connections.get(userId)
  if (!userConns || userConns.size === 0) return 0

  const payload = JSON.stringify(data)
  let delivered = 0

  for (const conn of userConns) {
    try {
      conn.socket.send(payload)
      delivered++
    } catch {
      // Connection dead — clean up
      userConns.delete(conn)
    }
  }

  if (userConns.size === 0) connections.delete(userId)
  return delivered
}

/** Broadcast a message to ALL connected users. */
function broadcast(data: Record<string, unknown>): number {
  const payload = JSON.stringify(data)
  let delivered = 0

  for (const [, userConns] of connections) {
    for (const conn of userConns) {
      try {
        conn.socket.send(payload)
        delivered++
      } catch {
        userConns.delete(conn)
      }
    }
  }

  return delivered
}

// ─── Token verification ────────────────────────────────────────────────────

/**
 * Verify a Clerk-issued JWT against Clerk's JWKS endpoint.
 *
 * Uses the `jose` library (edge-runtime compatible) to perform full
 * signature verification, issuer validation, and expiry checks. Previously
 * this function only base64-decoded the payload, which let an attacker
 * forge a token with an arbitrary `sub` claim and impersonate any user.
 *
 * Returns the Clerk userId (sub claim) on success, or null on any failure.
 */
async function verifyClerkToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, CLERK_JWKS, {
      issuer: `https://${CLERK_DOMAIN}`,
    })
    const sub = payload.sub
    if (typeof sub !== 'string' || !payload.exp) return null
    return sub
  } catch {
    return null
  }
}

// ─── Heartbeat ──────────────────────────────────────────────────────────────

const HEARTBEAT_INTERVAL_MS = 30_000
const STALE_CONNECTION_MS = 90_000 // 3 missed heartbeats = stale

/** Periodic cleanup of stale connections. */
let cleanupInterval: ReturnType<typeof setInterval> | null = null

function ensureCleanup(): void {
  if (cleanupInterval) return
  cleanupInterval = setInterval(() => {
    const now = Date.now()
    for (const [userId, userConns] of connections) {
      for (const conn of userConns) {
        if (now - conn.lastPing > STALE_CONNECTION_MS) {
          try { conn.socket.close(1000, 'Stale connection') } catch { /* ignore */ }
          userConns.delete(conn)
        }
      }
      if (userConns.size === 0) connections.delete(userId)
    }
    // Stop cleanup when no connections remain
    if (connections.size === 0 && cleanupInterval) {
      clearInterval(cleanupInterval)
      cleanupInterval = null
    }
  }, HEARTBEAT_INTERVAL_MS)
}

// ─── Message handlers ───────────────────────────────────────────────────────

interface IncomingMessage {
  type: string
  [key: string]: unknown
}

async function handleMessage(
  conn: WSConnection,
  message: IncomingMessage,
): Promise<void> {
  switch (message.type) {
    case 'ping':
      conn.lastPing = Date.now()
      conn.socket.send(JSON.stringify({ type: 'pong', serverTime: Date.now() }))
      break

    case 'chat': {
      // Forward chat request to the AI chat API via internal fetch and stream
      // the response back over WebSocket as chat_chunk / chat_done messages.
      //
      // This gives us lower latency than the client making a separate HTTP
      // request, because the server-to-server fetch avoids an extra TLS
      // handshake and we can push chunks immediately.
      try {
        const chatBody: Record<string, unknown> = {
          message: message.message,
          model: message.model || 'gemini-2',
          stream: true,
          aiMode: message.aiMode || 'build',
        }
        if (message.studioContext) chatBody.studioContext = message.studioContext
        if (message.lastError) {
          chatBody.lastError = message.lastError
          chatBody.retryAttempt = message.retryAttempt
          chatBody.previousCode = message.previousCode
        }

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        }
        if (message.studioSessionId) {
          headers['x-studio-session'] = String(message.studioSessionId)
        }

        // Determine the base URL for internal API calls.
        // On edge runtime we don't have req.nextUrl easily here, so we
        // use the origin from the upgrade request stored on the connection.
        const origin = (conn as WSConnection & { origin?: string }).origin || ''
        const chatUrl = origin ? `${origin}/api/ai/chat` : '/api/ai/chat'

        const res = await fetch(chatUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(chatBody),
        })

        if (!res.ok || !res.body) {
          conn.socket.send(JSON.stringify({
            type: 'chat_error',
            error: `AI API returned ${res.status}`,
          }))
          return
        }

        // Stream the response body back as chat_chunk messages
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let fullContent = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          // Parse SSE lines from the buffer
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const raw = line.slice(6).trim()
            if (raw === '[DONE]') continue

            try {
              const event = JSON.parse(raw) as Record<string, unknown>

              if (event.content || event.text || event.delta) {
                const chunk = String(event.content || event.text || event.delta || '')
                fullContent += chunk
                conn.socket.send(JSON.stringify({
                  type: 'chat_chunk',
                  content: chunk,
                }))
              }

              // Forward metadata/completion events
              if (event.done || event.finished) {
                conn.socket.send(JSON.stringify({
                  type: 'chat_done',
                  fullContent,
                  suggestions: event.suggestions,
                  intent: event.intent,
                  hasCode: event.hasCode,
                  tokensUsed: event.tokensUsed,
                  executedInStudio: event.executedInStudio,
                  model: event.model,
                  mcpResult: event.mcpResult,
                  meshResult: event.meshResult,
                }))
              }
            } catch {
              // Malformed SSE data — try sending as raw text chunk
              if (raw && raw !== '[DONE]') {
                fullContent += raw
                conn.socket.send(JSON.stringify({
                  type: 'chat_chunk',
                  content: raw,
                }))
              }
            }
          }
        }

        // If we never sent a chat_done, send one now
        if (fullContent) {
          conn.socket.send(JSON.stringify({
            type: 'chat_done',
            fullContent,
          }))
        }
      } catch (err) {
        conn.socket.send(JSON.stringify({
          type: 'chat_error',
          error: (err as Error)?.message || 'Chat streaming failed',
        }))
      }
      break
    }

    case 'studio-sync': {
      // Forward studio sync data to any other connections for this user
      // (e.g. if they have multiple browser tabs open)
      const userConns = connections.get(conn.userId)
      if (userConns) {
        const payload = JSON.stringify({
          ...message,
          type: 'studio-sync',
        })
        for (const other of userConns) {
          if (other !== conn) {
            try { other.socket.send(payload) } catch { /* skip dead conn */ }
          }
        }
      }
      break
    }

    default:
      // Unknown message type — ignore
      break
  }
}

// ─── GET handler — WebSocket upgrade ────────────────────────────────────────

export async function GET(req: NextRequest): Promise<Response> {
  // Check for WebSocket upgrade header
  const upgradeHeader = req.headers.get('upgrade')
  if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
    return new Response(
      JSON.stringify({
        error: 'WebSocket upgrade required',
        hint: 'Send a WebSocket upgrade request to this endpoint',
      }),
      {
        status: 426,
        headers: {
          'Content-Type': 'application/json',
          'Upgrade': 'websocket',
        },
      },
    )
  }

  // Extract and verify auth token
  const { searchParams } = req.nextUrl
  const token = searchParams.get('token')

  if (!token) {
    return new Response(
      JSON.stringify({ error: 'Authentication required — pass token as query param' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const userId = await verifyClerkToken(token)
  if (!userId) {
    return new Response(
      JSON.stringify({ error: 'Invalid or expired token' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // Upgrade to WebSocket using the Web API WebSocketPair
  // (available in edge runtimes like Cloudflare Workers / Vercel Edge)
  const pair = new (globalThis as unknown as {
    WebSocketPair: new () => { 0: WebSocket; 1: WebSocket }
  }).WebSocketPair()

  const [client, server] = [pair[0], pair[1]]

  // Accept the server side of the socket
  ;(server as unknown as { accept: () => void }).accept()

  // Derive the origin for internal API calls
  const origin = req.nextUrl.origin

  // Create connection record
  const conn: WSConnection & { origin: string } = {
    socket: server,
    userId,
    connectedAt: Date.now(),
    lastPing: Date.now(),
    origin,
  }

  // Register connection
  if (!connections.has(userId)) {
    connections.set(userId, new Set())
  }
  connections.get(userId)!.add(conn)

  // Start cleanup timer if not already running
  ensureCleanup()

  // Send welcome message
  server.send(JSON.stringify({
    type: 'connected',
    userId,
    serverTime: Date.now(),
  }))

  // Handle incoming messages
  server.addEventListener('message', (event: MessageEvent) => {
    try {
      const data = JSON.parse(String(event.data)) as IncomingMessage
      handleMessage(conn, data).catch(() => {
        // Async handler error — logged but not fatal
      })
    } catch {
      // Malformed message — ignore
    }
  })

  // Handle disconnect
  server.addEventListener('close', () => {
    const userConns = connections.get(userId)
    if (userConns) {
      userConns.delete(conn)
      if (userConns.size === 0) connections.delete(userId)
    }
  })

  // Return the upgrade response with the client socket
  return new Response(null, {
    status: 101,
    // @ts-expect-error — webSocket property is required by the edge runtime for upgrade responses
    webSocket: client,
  })
}
