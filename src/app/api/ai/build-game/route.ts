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

export const maxDuration = 300 // 5 min — each step takes ~30-60s

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
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

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await buildGameStepByStep(prompt, sessionId, {
          onStep: (step: BuildStep) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(step)}\n\n`),
            )
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
            })}\n\n`,
          ),
        )
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              action: 'failed',
              error: err instanceof Error ? err.message : 'Unknown error',
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
