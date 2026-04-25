/**
 * POST /api/ai/build-world
 *
 * SSE endpoint that builds an entire game world zone by zone.
 * Streams progress events so the client shows real-time updates.
 *
 * Body: { prompt: string, sessionId: string }
 * Stream: SSE events with WorldBuildProgress objects
 */

import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { generateZonePlan, buildWorld } from '@/lib/ai/world-planner'

export const maxDuration = 300 // 5 min max

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  let body: { prompt?: string; sessionId?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }

  const { prompt, sessionId } = body
  if (!prompt || !sessionId) {
    return new Response(JSON.stringify({ error: 'prompt and sessionId required' }), { status: 400 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: unknown) {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch { /* stream closed */ }
      }

      try {
        // Phase 1: Plan
        send({ phase: 'planning', message: `Planning world for: "${prompt.slice(0, 60)}"...` })
        const plan = generateZonePlan(prompt)
        send({
          phase: 'planned',
          title: plan.title,
          gameType: plan.gameType,
          zones: plan.zones.map(z => ({ name: z.name, type: z.type, estimatedParts: z.estimatedParts })),
          totalEstimatedParts: plan.totalEstimatedParts,
        })

        // Phase 2: Build zones
        const result = await buildWorld(plan, sessionId, (progress) => {
          send({
            phase: progress.status,
            currentZone: progress.currentZone,
            completedZones: progress.completedZones,
            totalZones: progress.totalZones,
            totalParts: progress.totalParts,
            progress: progress.progress,
            errors: progress.errors,
          })
        })

        // Phase 3: Complete
        send({
          phase: 'complete',
          totalParts: result.totalParts,
          totalZones: result.completedZones,
          zones: result.zoneResults.map(z => ({
            id: z.zoneId,
            partCount: z.partCount,
            score: z.antiUglyScore,
          })),
          errors: result.errors,
        })
      } catch (err) {
        send({ phase: 'failed', error: err instanceof Error ? err.message : String(err) })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
      Connection: 'keep-alive',
    },
  })
}
