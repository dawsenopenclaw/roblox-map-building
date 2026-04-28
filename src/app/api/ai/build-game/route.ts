/**
 * POST /api/ai/build-game
 *
 * Step-by-step game builder. Takes a game prompt and breaks it into 5
 * discrete phases, executing each as a separate Luau block in Studio:
 *
 *   Step 1: World layout (terrain, structures, lighting)
 *   Step 2: Player systems (leaderstats, attributes)
 *   Step 3: Core mechanics (game loop scripts, events)
 *   Step 4: UI + client scripts (HUD, ScreenGui)
 *   Step 5: Polish (sounds, particles, animations)
 *
 * Streams progress as Server-Sent Events so the chat UI can show
 * real-time "Step 2/5: Adding player systems... ✅" updates.
 *
 * Body:
 *   { prompt: string, sessionId: string }
 *
 * Response: text/event-stream
 *   data: { index, total, title, status, error? }
 *   ...
 *   data: { action: "complete"|"failed", success, steps, errors }
 */

import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { buildGameStepByStep, type BuildStep } from '@/lib/ai/game-builder'
import { spendTokens, getTokenBalance } from '@/lib/tokens-server'
import { db } from '@/lib/db'

export const maxDuration = 300 // 5 min — each step takes ~30-60s

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── Resolve internal user ID from Clerk ──────────────────────────────────
  let internalUserId: string | null = null
  let userTier = 'FREE'
  try {
    const dbUser = await db.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    })
    if (dbUser) {
      internalUserId = dbUser.id
      const sub = await db.subscription.findUnique({
        where: { userId: dbUser.id },
        select: { tier: true, status: true },
      })
      const isActive = sub?.status === 'ACTIVE' || sub?.status === 'TRIALING'
      userTier = isActive ? (sub?.tier ?? 'FREE') : 'FREE'
    }
  } catch {
    // DB unavailable — fall through, will fail on token check below
  }

  if (!internalUserId) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── Tier gate: FREE users cannot use full game builder ──────────────────
  const normalizedTier = userTier === 'HOBBY' ? 'STARTER' : userTier
  if (normalizedTier === 'FREE') {
    return new Response(
      JSON.stringify({
        error: 'Full game builder requires a paid plan. Upgrade to Builder ($25/mo) or higher for step-by-step game building.',
        code: 'tier_required',
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // ── Token balance check: need at least 50 tokens upfront ────────────────
  const TOKENS_PER_STEP = 5
  const MIN_TOKENS_REQUIRED = 50
  try {
    const balance = await getTokenBalance(internalUserId)
    if (balance < MIN_TOKENS_REQUIRED) {
      return new Response(
        JSON.stringify({
          error: `Insufficient tokens. Full game build requires ~${MIN_TOKENS_REQUIRED} tokens. You have ${balance}.`,
          code: 'insufficient_tokens',
          balance,
          required: MIN_TOKENS_REQUIRED,
        }),
        { status: 402, headers: { 'Content-Type': 'application/json' } },
      )
    }
  } catch {
    // If token check fails, allow through (fail open) — spend will catch issues
  }

  let body: { prompt?: string; sessionId?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const prompt = body.prompt?.trim()
  const sessionId = body.sessionId?.trim()

  if (!prompt) {
    return new Response(JSON.stringify({ error: 'prompt is required' }), {
      status: 422,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'sessionId is required (Studio must be paired)' }), {
      status: 422,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Add tier warning for STARTER users
  const tierWarning = normalizedTier === 'STARTER'
    ? 'Note: Complex games may require Builder ($25/mo) or higher for best results.'
    : undefined

  const encoder = new TextEncoder()
  const capturedInternalUserId = internalUserId // capture for closure
  const stream = new ReadableStream({
    async start(controller) {
      let completedSteps = 0

      // Send tier warning if applicable
      if (tierWarning) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ warning: tierWarning })}\n\n`),
        )
      }

      try {
        const result = await buildGameStepByStep(prompt, sessionId, {
          onStep: async (step: BuildStep) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(step)}\n\n`),
            )

            // Spend tokens per completed step
            if (step.status === 'done') {
              completedSteps++
              try {
                await spendTokens(
                  capturedInternalUserId,
                  TOKENS_PER_STEP,
                  `Game build step ${step.index}/${step.total}: ${step.title}`,
                  { prompt: prompt.slice(0, 100), step: step.index, total: step.total },
                )
              } catch {
                // Token spend failed — continue building, don't break the flow
              }
            }
          },
        })

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              action: result.success ? 'complete' : 'failed',
              success: result.success,
              steps: result.steps.map((s) => ({
                index: s.index,
                title: s.title,
                status: s.status,
                error: s.error,
                durationMs: s.durationMs,
              })),
              totalDurationMs: result.totalDurationMs,
              errors: result.errors,
              tokensSpent: completedSteps * TOKENS_PER_STEP,
            })}\n\n`,
          ),
        )
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              action: 'failed',
              error: err instanceof Error ? err.message : 'Unknown error',
              tokensSpent: completedSteps * TOKENS_PER_STEP,
            })}\n\n`,
          ),
        )
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
    },
  })
}
