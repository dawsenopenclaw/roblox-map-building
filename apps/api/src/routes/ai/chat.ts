/**
 * POST /api/ai/chat
 * Main chat endpoint — streams agent progress via SSE, returns final result.
 *
 * Request body:
 *   { message: string, gameId?: string, conversationId: string }
 *
 * Response:
 *   text/event-stream  — real-time progress events
 *   Each event: data: <JSON>\n\n
 *   Final event type: "orchestrator_complete"
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requireAuth } from '../../middleware/auth'
import { aiRateLimit } from '../../middleware/security'
import { orchestrateFromRaw } from '../../lib/agents/orchestrator'
import { estimateIntentCost } from '../../lib/agents/cost-calculator'
import { parseIntent } from '../../lib/agents/intent-parser'
import { db } from '../../lib/db'
import { createLogger } from '../../lib/logger'
import { incrementCounter, recordDuration } from '../../lib/metrics'
import { dispatchWebhookEvent } from '../../lib/webhook-delivery'
import type { StreamEvent } from '../../lib/agents/types'

// ---------------------------------------------------------------------------
// Demo mode — active when ANTHROPIC_API_KEY is absent.
// Auth and token checks are bypassed; all agents use their built-in fallbacks.
// ---------------------------------------------------------------------------
const DEMO_MODE = !process.env.ANTHROPIC_API_KEY
const DEMO_USER_ID = 'demo-user'

const log = createLogger('ai:chat')

// ---------------------------------------------------------------------------
// Input schema
// ---------------------------------------------------------------------------

const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  gameId: z.string().optional(),
  conversationId: z.string().min(1).max(100),
})

export type ChatInput = z.infer<typeof chatSchema>

// ---------------------------------------------------------------------------
// Token helpers (shared pattern with generate.ts)
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
    // Log but don't crash the request — the generation already happened
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
// SSE helpers
// ---------------------------------------------------------------------------

function sseData(event: StreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`
}

function sseError(message: string): string {
  return `data: ${JSON.stringify({ type: 'error', data: { message }, timestamp: new Date().toISOString() })}\n\n`
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export const chatRoutes = new Hono()

// In demo mode skip Clerk auth — any request is allowed with a synthetic userId.
if (!DEMO_MODE) {
  chatRoutes.use('*', requireAuth)
}
chatRoutes.use('*', aiRateLimit)

/**
 * POST /api/ai/chat
 * Streams SSE events, then closes the stream with the final result.
 */
chatRoutes.post('/', zValidator('json', chatSchema), async (c) => {
  const start = Date.now()
  // In demo mode there is no Clerk session, so fall back to the demo userId.
  const userId = (c.get('userId') as string | undefined) ?? (DEMO_MODE ? DEMO_USER_ID : undefined)
  const requestId = c.get('requestId') as string | undefined
  const reqLog = log.child({ requestId, userId })

  if (!userId) return c.json({ error: 'Unauthorized' }, 401)

  const body = c.req.valid('json')
  const { message, gameId, conversationId } = body

  reqLog.info('chat request received', { conversationId, messageLength: message.length, demo: DEMO_MODE })

  // -------------------------------------------------------------------------
  // Pre-flight: parse intent + check balance before opening the stream.
  // In demo mode skip the DB balance check — no API calls will be billed.
  // -------------------------------------------------------------------------
  const intent = await parseIntent(message)
  const costEstimate = estimateIntentCost(intent.intent)

  if (!DEMO_MODE) {
    const balance = await getTokenBalance(userId)
    if (balance < costEstimate.tokens) {
      reqLog.warn('chat rejected: insufficient tokens', {
        required: costEstimate.tokens,
        available: balance,
      })
      incrementCounter('ai_chat_rejected_total', { reason: 'insufficient_tokens' })
      return c.json({
        error: 'Insufficient tokens',
        required: costEstimate.tokens,
        available: balance,
        estimate: costEstimate.breakdown,
      }, 402)
    }
  }

  // -------------------------------------------------------------------------
  // Stream response via SSE
  // -------------------------------------------------------------------------
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk))
        } catch {
          // Client disconnected — ignore
        }
      }

      // Stream intent parsed event immediately
      enqueue(sseData({
        type: 'intent_parsed',
        data: {
          intent: intent.intent,
          label: intent.label,
          confidence: intent.confidence,
          agents: intent.agents,
        },
        timestamp: new Date().toISOString(),
      }))

      // Stream cost estimate
      enqueue(sseData({
        type: 'cost_estimate',
        data: {
          tokens: costEstimate.tokens,
          usd: costEstimate.usd,
          breakdown: costEstimate.breakdown,
        },
        timestamp: new Date().toISOString(),
      }))

      let tokensUsed = 0

      try {
        const result = await orchestrateFromRaw(
          message,
          userId,
          conversationId,
          gameId,
          (event) => {
            // Forward all orchestrator events to the SSE stream
            // Skip intent_parsed and cost_estimate since we already sent them
            if (event.type !== 'intent_parsed' && event.type !== 'cost_estimate') {
              enqueue(sseData(event))
            }
          }
        )

        tokensUsed = result.tokensUsed

        // Deduct tokens after successful execution
        if (tokensUsed > 0) {
          await spendTokens(
            userId,
            tokensUsed,
            `chat: "${message.slice(0, 60)}" [${intent.intent}]`
          )
        }

        // Dispatch build.completed webhook and check token thresholds (best-effort, non-blocking)
        if (!DEMO_MODE) {
          dispatchWebhookEvent(userId, 'build.completed', {
            buildId: conversationId,
            projectId: gameId ?? conversationId,
            userId,
            durationMs: Date.now() - start,
            tokensUsed,
          }).catch(() => {})

          db.tokenBalance.findUnique({ where: { userId }, select: { balance: true } })
            .then(async (bal) => {
              if (!bal) return
              const sub = await db.subscription.findUnique({ where: { userId }, select: { tier: true } })
              const TIER_QUOTAS: Record<string, number> = { FREE: 1000, HOBBY: 2000, CREATOR: 7000, STUDIO: 20000 }
              const planQuota = TIER_QUOTAS[sub?.tier ?? 'FREE'] ?? 1000
              const percentRemaining = Math.round((bal.balance / planQuota) * 100)

              if (bal.balance === 0) {
                dispatchWebhookEvent(userId, 'token.depleted', {
                  userId,
                  planQuota,
                  depletedAt: new Date().toISOString(),
                }).catch(() => {})
              } else if (percentRemaining < 20) {
                dispatchWebhookEvent(userId, 'token.low', {
                  userId,
                  remainingTokens: bal.balance,
                  planQuota,
                  percentRemaining,
                }).catch(() => {})
              }
            })
            .catch(() => {})
        }

        // Final completion event with full result
        const finalEvent: StreamEvent = {
          type: 'orchestrator_complete',
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
        }
        enqueue(sseData(finalEvent))

        const durationMs = Date.now() - start
        reqLog.info('chat completed', {
          conversationId,
          intent: intent.intent,
          tokensUsed,
          agentCount: result.agentResults.length,
          changesCount: result.changes.length,
          durationMs,
        })
        incrementCounter('ai_chat_total', { intent: intent.intent, status: result.success ? 'success' : 'partial' })
        recordDuration('ai_chat_duration_ms', durationMs, { intent: intent.intent })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        reqLog.error('chat orchestration failed', { conversationId, error: errorMessage })
        enqueue(sseError(`Orchestration failed: ${errorMessage}`))
        incrementCounter('ai_chat_total', { intent: intent.intent, status: 'error' })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering for SSE
    },
  })
})

/**
 * GET /api/ai/chat/intents
 * Returns the full intent → agent routing table (useful for the UI to display
 * what operations are possible).
 */
chatRoutes.get('/intents', async (c) => {
  const { getAllOperationCosts } = await import('../../lib/agents/cost-calculator')
  const costs = getAllOperationCosts()
  return c.json({ intents: costs, count: costs.length })
})

/**
 * GET /api/ai/chat/estimate
 * Quick cost estimate without sending a message.
 * Query: ?message=build+a+castle
 */
chatRoutes.get('/estimate', async (c) => {
  const message = c.req.query('message')
  if (!message) return c.json({ error: 'message query param required' }, 400)

  const intent = await parseIntent(message)
  const cost = estimateIntentCost(intent.intent)

  return c.json({
    intent: intent.intent,
    label: intent.label,
    confidence: intent.confidence,
    agents: intent.agents,
    cost: {
      tokens: cost.tokens,
      usd: cost.usd,
      breakdown: cost.breakdown,
    },
  })
})
