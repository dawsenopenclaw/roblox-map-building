/**
 * POST /api/ai/playtest
 *
 * Runs the autonomous agentic playtest loop:
 * Generate → Execute in Studio → Start Playtest → Screenshot → Get Errors → Fix → Repeat
 *
 * Streams progress updates as Server-Sent Events (SSE).
 * No human intervention needed — fully autonomous.
 *
 * Body:
 *   { code: string, sessionId: string, maxIterations?: number }
 *
 * Response: SSE stream with events:
 *   data: { action, details, timestamp, data? }
 *   ...
 *   data: { action: "complete"|"failed", ... result }
 */

import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { runAgenticPlaytest } from '@/lib/ai/agentic-playtest'

export const maxDuration = 300 // 5 minutes max for full playtest cycle

export async function POST(req: NextRequest) {
  // Auth
  const { userId, getToken } = await auth()
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Parse body
  let body: { code?: string; sessionId?: string; maxIterations?: number }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const code = body.code?.trim()
  const sessionId = body.sessionId?.trim()
  const maxIterations = Math.min(body.maxIterations ?? 3, 5)

  if (!code) {
    return new Response(JSON.stringify({ error: 'code is required' }), {
      status: 422,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'sessionId is required (Studio session)' }), {
      status: 422,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Get auth token for API calls
  let token: string
  try {
    token = (await getToken()) || ''
  } catch {
    token = ''
  }

  // Stream playtest progress as SSE
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await runAgenticPlaytest(
          code,
          sessionId,
          token,
          maxIterations,
          (step) => {
            // Stream each step as an SSE event
            const data = JSON.stringify(step)
            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
          },
        )

        // Send final result
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ ...result, action: result.success ? 'complete' : 'failed' })}\n\n`),
        )
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ action: 'failed', details: err instanceof Error ? err.message : 'Unknown error', timestamp: Date.now() })}\n\n`,
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
      'X-Accel-Buffering': 'no',
    },
  })
}
