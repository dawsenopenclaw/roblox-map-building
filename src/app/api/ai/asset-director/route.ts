/**
 * POST /api/ai/asset-director
 *
 * Runs the Asset Director orchestration layer: detects asset intents from a
 * user prompt, fans out generation jobs to the mesh/audio/texture pipelines
 * in parallel, and streams per-job progress back to the client as SSE.
 *
 * Body:
 *   { prompt: string, sessionId: string, model?: string }
 *
 * Response: Server-Sent Events stream with these event types in the `event` field:
 *   - `intent`   → JSON: { intents: AssetIntent[] }              (once, after detection)
 *   - `progress` → JSON: AssetDirectorProgressEvent              (per job transition)
 *   - `complete` → JSON: AssetDirectorResult                     (once, at the end)
 *   - `error`    → JSON: { message: string }                     (fatal errors only)
 *
 * Rate limit: 5 requests / hour per user. This is the most expensive endpoint
 * in the app — each call can fan out up to 8 generations.
 *
 * Auth: Clerk — 401 if no user.
 */

import { NextRequest } from 'next/server'
import { getDbUserOrUnauthorized } from '@/lib/auth/get-db-user'
import { z } from 'zod'
import {
  directBuildAssets,
  detectAssetIntents,
  gateIntentsByCredits,
  ASSET_DIRECTOR_COSTS,
  type AssetDirectorProgressEvent,
  type AssetDirectorResult,
  type AssetIntent,
  type AssetResult,
} from '@/lib/asset-director'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Up to 10 minutes for the full fan-out — Meshy tasks can run 3-5 minutes
// each and we don't want the Vercel function to time out mid-pipeline.
export const maxDuration = 600

// ── Rate limiter: 5/hour per user (local to this route) ──────────────────────

const upstashConfigured = !!(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
)

const assetDirectorLimiter = upstashConfigured
  ? new Ratelimit({
      redis: new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      }),
      limiter: Ratelimit.slidingWindow(5, '1 h'),
      prefix: 'ratelimit:ai:asset-director',
    })
  : null

// ── Request body schema ──────────────────────────────────────────────────────

const bodySchema = z.object({
  prompt: z.string().trim().min(4).max(4000),
  sessionId: z.string().trim().min(1).max(200),
  model: z.string().trim().max(100).optional(),
})

// ── SSE helper ───────────────────────────────────────────────────────────────

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

// ── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Auth — resolve Clerk session into the internal DB User row because
  // gateIntentsByCredits / directBuildAssets key token spend off User.id (cuid).
  const authResult = await getDbUserOrUnauthorized()
  if ('response' in authResult) return authResult.response
  const { user, clerkId } = authResult
  const userId = user.id

  // Rate limit (5 per hour, per user) — keyed by Clerk id
  const rl = await checkRateLimit(assetDirectorLimiter, clerkId, 5, 3600)
  if (!rl.allowed) return rateLimitResponse(rl)

  // Body parse + validate
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        error: 'Invalid request body',
        details: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
      }),
      { status: 422, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const { prompt, sessionId, model } = parsed.data

  // Wire the request's abort signal through to the director so if the client
  // hangs up mid-stream we cancel the downstream pipelines too.
  const abortController = new AbortController()
  req.signal.addEventListener('abort', () => abortController.abort(), { once: true })

  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk))
        } catch {
          // Controller might already be closed if the client went away.
        }
      }

      try {
        // We stream the intent list as soon as detection finishes so the UI
        // can render placeholder rows while generations are still running.
        // To do that cleanly we hand-roll the director flow instead of
        // calling directBuildAssets — we still re-use its helpers for the
        // actual work so there's no duplicated logic.

        // Step 1 — detect intents
        let intents: AssetIntent[]
        try {
          intents = await detectAssetIntents(prompt)
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          write(sseEvent('error', { message: `Intent detection failed: ${msg}` }))
          controller.close()
          return
        }

        write(sseEvent('intent', { intents }))

        if (intents.length === 0) {
          const empty: AssetDirectorResult = {
            intents: [],
            results: [],
            totalCreditsUsed: 0,
            durationMs: 0,
            earlyExitReason: 'No asset intents detected for this prompt.',
          }
          write(sseEvent('complete', empty))
          controller.close()
          return
        }

        // Step 2 — credit gating preview (so the UI can show which got dropped)
        const gate = await gateIntentsByCredits(userId, intents)
        if (gate.insufficientForCritical) {
          const result: AssetDirectorResult = {
            intents,
            results: intents.map<AssetResult>((i) => ({
              ...i,
              status: 'failed',
              error: `Insufficient credits (have ${gate.balance}, need ${gate.totalCost}).`,
            })),
            totalCreditsUsed: 0,
            durationMs: 0,
            earlyExitReason:
              `Insufficient credits. Have ${gate.balance}, need ${gate.totalCost}.`,
          }
          write(sseEvent('complete', result))
          controller.close()
          return
        }

        // Step 3 — run the full director with a progress callback that
        // streams each transition. We pass the abort signal so the client
        // disconnecting kills the fan-out.
        const onProgress = (event: AssetDirectorProgressEvent) => {
          write(sseEvent('progress', event))
        }

        const result = await directBuildAssets({
          prompt,
          userId,
          sessionId,
          model,
          signal: abortController.signal,
          onProgress,
        })

        write(sseEvent('complete', result))
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        write(sseEvent('error', { message: msg }))
      } finally {
        try {
          controller.close()
        } catch {
          // already closed
        }
      }
    },
    cancel() {
      abortController.abort()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

// Expose the cost matrix on a GET so the UI can render a pre-call estimate
// without duplicating the constants client-side. Cheap, public, no auth.
export async function GET() {
  return new Response(JSON.stringify({ costs: ASSET_DIRECTOR_COSTS }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
