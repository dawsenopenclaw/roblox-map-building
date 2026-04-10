/**
 * WebSocket handler for real-time chat streaming.
 *
 * Accepts connections at /api/ws?token=<clerk_jwt>, authenticates via Clerk,
 * then processes chat messages by proxying to the same orchestrator logic
 * used by the HTTP POST /api/ai/chat endpoint.
 *
 * Client message types:
 *   { type: 'ping' }
 *   { type: 'chat', message, conversationId, gameId? }
 *
 * Server message types:
 *   { type: 'pong' }
 *   { type: 'auth_ok',    userId }
 *   { type: 'auth_error', error }
 *   { type: 'chat_chunk', content, ... }   — streamed orchestrator events
 *   { type: 'chat_done',  ... }            — final result
 *   { type: 'chat_error', error }
 */

import { WebSocketServer, WebSocket } from 'ws'
import type { IncomingMessage } from 'http'
import type { ServerType } from '@hono/node-server'
import { createClerkClient } from '@clerk/backend'
import { orchestrateFromRaw } from '../lib/agents/orchestrator'
import { estimateIntentCost } from '../lib/agents/cost-calculator'
import { parseIntent } from '../lib/agents/intent-parser'
import { db } from '../lib/db'
import { createLogger } from '../lib/logger'
import { incrementCounter, recordDuration } from '../lib/metrics'
import type { StreamEvent } from '../lib/agents/types'

const log = createLogger('ws')
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! })

const DEMO_MODE = !process.env.ANTHROPIC_API_KEY
const DEMO_USER_ID = 'demo-user'

// ---------------------------------------------------------------------------
// Token helpers (mirrors chat.ts)
// ---------------------------------------------------------------------------

async function spendTokens(userId: string, amount: number, description: string): Promise<void> {
  if (amount <= 0 || DEMO_MODE) return
  try {
    await db.$transaction(async (tx) => {
      const current = await tx.tokenBalance.findUnique({ where: { userId } })
      if (!current) throw new Error('Token balance not found')
      if (current.balance < amount) throw new Error('Insufficient token balance')
      const balance = await tx.tokenBalance.update({
        where: { userId },
        data: { balance: { decrement: amount }, lifetimeSpent: { increment: amount } },
      })
      await tx.tokenTransaction.create({
        data: {
          balanceId: balance.id,
          type: 'SPEND',
          amount: -amount,
          description,
          metadata: {} as never,
        },
      })
    })
  } catch (err) {
    log.error('token deduction failed', {
      userId,
      amount,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}

async function getTokenBalance(userId: string): Promise<number> {
  const balance = await db.tokenBalance.findUnique({ where: { userId } })
  return balance?.balance ?? 0
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function send(ws: WebSocket, data: Record<string, unknown>): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data))
  }
}

/** Extract query params from an upgrade request URL. */
function getQueryParam(req: IncomingMessage, key: string): string | undefined {
  try {
    const url = new URL(req.url ?? '', `http://${req.headers.host ?? 'localhost'}`)
    return url.searchParams.get(key) ?? undefined
  } catch {
    return undefined
  }
}

// ---------------------------------------------------------------------------
// Authenticate the WebSocket connection via Clerk JWT in the query string.
// ---------------------------------------------------------------------------

async function authenticateConnection(req: IncomingMessage): Promise<string | null> {
  if (DEMO_MODE) return DEMO_USER_ID

  const token = getQueryParam(req, 'token')
  if (!token) return null

  try {
    // Verify the JWT directly using Clerk's verifyToken method
    const verifiedToken = await clerk.verifyToken(token)
    return verifiedToken.sub ?? null
  } catch (err) {
    log.warn('ws auth failed', { error: err instanceof Error ? err.message : String(err) })
    return null
  }
}

// ---------------------------------------------------------------------------
// Chat message handler — mirrors POST /api/ai/chat logic
// ---------------------------------------------------------------------------

async function handleChatMessage(
  ws: WebSocket,
  userId: string,
  payload: { message: string; conversationId: string; gameId?: string }
): Promise<void> {
  const { message, conversationId, gameId } = payload
  const start = Date.now()

  log.info('ws chat request', { userId, conversationId, messageLength: message.length })

  // Parse intent
  const intent = await parseIntent(message)
  const costEstimate = estimateIntentCost(intent.intent)

  // Check balance (skip in demo mode)
  if (!DEMO_MODE) {
    const balance = await getTokenBalance(userId)
    if (balance < costEstimate.tokens) {
      send(ws, {
        type: 'chat_error',
        error: 'Insufficient tokens',
        required: costEstimate.tokens,
        available: balance,
      })
      incrementCounter('ai_chat_rejected_total', { reason: 'insufficient_tokens' })
      return
    }
  }

  // Stream intent + cost estimate
  send(ws, {
    type: 'chat_chunk',
    event: 'intent_parsed',
    data: {
      intent: intent.intent,
      label: intent.label,
      confidence: intent.confidence,
      agents: intent.agents,
    },
    timestamp: new Date().toISOString(),
  })

  send(ws, {
    type: 'chat_chunk',
    event: 'cost_estimate',
    data: {
      tokens: costEstimate.tokens,
      usd: costEstimate.usd,
      breakdown: costEstimate.breakdown,
    },
    timestamp: new Date().toISOString(),
  })

  try {
    const result = await orchestrateFromRaw(
      message,
      userId,
      conversationId,
      gameId,
      (event: StreamEvent) => {
        // Forward orchestrator events as chat_chunk messages
        if (event.type !== 'intent_parsed' && event.type !== 'cost_estimate') {
          send(ws, {
            type: 'chat_chunk',
            event: event.type,
            data: event.data,
            timestamp: event.timestamp,
          })
        }
      }
    )

    // Deduct tokens
    if (result.tokensUsed > 0) {
      await spendTokens(
        userId,
        result.tokensUsed,
        `chat: "${message.slice(0, 60)}" [${intent.intent}]`
      )
    }

    // Send final completion
    send(ws, {
      type: 'chat_done',
      data: {
        success: result.success,
        message: result.message,
        tokensUsed: result.tokensUsed,
        changes: result.changes,
        agentLog: result.agentResults.map((r) => ({
          agent: r.agent,
          success: r.success,
          message: r.message,
          tokensUsed: r.tokensUsed,
          duration: r.duration,
          error: r.error,
        })),
        intent: {
          type: result.intent.intent,
          label: result.intent.label,
          confidence: result.intent.confidence,
        },
        costEstimate: result.costEstimate,
        duration: result.duration,
      },
      timestamp: new Date().toISOString(),
    })

    const durationMs = Date.now() - start
    log.info('ws chat completed', {
      conversationId,
      intent: intent.intent,
      tokensUsed: result.tokensUsed,
      durationMs,
    })
    incrementCounter('ai_chat_total', { intent: intent.intent, status: result.success ? 'success' : 'partial' })
    recordDuration('ai_chat_duration_ms', durationMs, { intent: intent.intent })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    log.error('ws chat orchestration failed', { conversationId, error: errorMessage })
    send(ws, {
      type: 'chat_error',
      error: `Orchestration failed: ${errorMessage}`,
      timestamp: new Date().toISOString(),
    })
    incrementCounter('ai_chat_total', { intent: intent.intent, status: 'error' })
  }
}

// ---------------------------------------------------------------------------
// Setup — attach WebSocketServer to the existing HTTP server
// ---------------------------------------------------------------------------

export function attachWebSocketServer(server: ServerType): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true })

  // Handle upgrade requests only for /api/ws
  server.on('upgrade', async (req, socket, head) => {
    const pathname = new URL(req.url ?? '', `http://${req.headers.host ?? 'localhost'}`).pathname

    if (pathname !== '/api/ws') {
      // Not our route — destroy the socket so other upgrade handlers can work
      socket.destroy()
      return
    }

    log.debug('ws upgrade request', { url: req.url })

    const userId = await authenticateConnection(req)
    if (!userId) {
      log.warn('ws upgrade rejected: auth failed')
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
      socket.destroy()
      incrementCounter('ws_connections_total', { status: 'rejected' })
      return
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req, userId)
    })
  })

  // Handle new connections
  wss.on('connection', (ws: WebSocket, _req: IncomingMessage, userId: string) => {
    log.info('ws connected', { userId })
    incrementCounter('ws_connections_total', { status: 'connected' })

    // Send auth confirmation
    send(ws, { type: 'auth_ok', userId })

    // Track active chat to prevent concurrent requests per connection
    let chatInProgress = false

    ws.on('message', async (raw) => {
      let data: Record<string, unknown>
      try {
        data = JSON.parse(raw.toString())
      } catch {
        send(ws, { type: 'error', error: 'Invalid JSON' })
        return
      }

      const { type } = data

      // Keepalive
      if (type === 'ping') {
        send(ws, { type: 'pong' })
        return
      }

      // Chat message
      if (type === 'chat') {
        if (chatInProgress) {
          send(ws, { type: 'chat_error', error: 'A chat request is already in progress' })
          return
        }

        const message = typeof data.message === 'string' ? data.message : ''
        const conversationId = typeof data.conversationId === 'string' ? data.conversationId : ''

        if (!message || !conversationId) {
          send(ws, { type: 'chat_error', error: 'message and conversationId are required' })
          return
        }

        chatInProgress = true
        try {
          await handleChatMessage(ws, userId, {
            message,
            conversationId,
            gameId: typeof data.gameId === 'string' ? data.gameId : undefined,
          })
        } finally {
          chatInProgress = false
        }
        return
      }

      // Unknown message type
      send(ws, { type: 'error', error: `Unknown message type: ${type}` })
    })

    ws.on('close', (code, reason) => {
      log.info('ws disconnected', { userId, code, reason: reason?.toString() })
      incrementCounter('ws_disconnections_total', {})
    })

    ws.on('error', (err) => {
      log.error('ws error', { userId, error: err.message })
    })
  })

  log.info('WebSocket server attached at /api/ws')

  return wss
}
