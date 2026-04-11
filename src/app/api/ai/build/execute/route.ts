/**
 * POST /api/ai/build/execute
 *
 * Accepts a pre-generated planId (from POST /api/ai/build), starts
 * async wave-by-wave execution, and returns a buildId for status polling.
 *
 * The user approves the plan in the UI before calling this endpoint.
 */

import { NextRequest, NextResponse, after } from 'next/server'
import { getDbUserOrUnauthorized } from '@/lib/auth/get-db-user'
import { z } from 'zod'
import { requireTier } from '@/lib/tier-guard'
import { parseBody } from '@/lib/validations'
import { aiRateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import { executeBuildPlan, retrievePlan } from '@/lib/ai/build-executor'

// 300s is the Vercel Pro/Enterprise ceiling. The wave loop typically
// finishes in well under 60s for small plans, but multi-wave builds
// with terrain gen can legitimately run 2–4 minutes.
export const maxDuration = 300

const executeRequestSchema = z.object({
  planId: z.string().min(1, 'planId is required'),
  /** Studio session ID — Luau commands are pushed here if provided */
  sessionId: z.string().optional().default(''),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Resolve Clerk session -> DB User row. executeBuildPlan ultimately calls
  // spendTokens, which keys off User.id (cuid) rather than the Clerk session id.
  const authResult = await getDbUserOrUnauthorized()
  if ('response' in authResult) return authResult.response
  const { user, clerkId } = authResult

  // HOBBY+ required — tier guard keys off the Clerk id
  const tierBlock = await requireTier(clerkId, 'HOBBY')
  if (tierBlock) return tierBlock

  // Rate limit: shared AI bucket — 20 req/min
  const rl = await aiRateLimit(clerkId)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many active builds. Please wait for current build to finish.' },
      { status: 429, headers: rateLimitHeaders(rl) }
    )
  }

  const parsed = await parseBody(req, executeRequestSchema)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  }

  const { planId, sessionId } = parsed.data

  // Retrieve the previously generated plan from Redis
  const plan = await retrievePlan(planId)
  if (!plan) {
    return NextResponse.json(
      { error: 'Plan not found or expired. Regenerate the plan and try again.' },
      { status: 404 }
    )
  }

  let buildId: string
  try {
    // `executeBuildPlan` writes the initial progress record and hands back a
    // thunk that performs the actual wave-by-wave execution. We hand that
    // thunk to `after()` so Vercel keeps the lambda alive for the work
    // *after* the HTTP response is flushed. Previously the wave loop was
    // fire-and-forget (`void (async () => ...)()`) and died with the lambda
    // mid-build, leaving users with partial Luau output in Studio.
    const { buildId: id, runInBackground } = await executeBuildPlan(
      plan,
      user.id,
      sessionId,
    )
    buildId = id
    after(runInBackground)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Build execution failed to start'
    console.error('[api/ai/build/execute] executeBuildPlan error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json(
    {
      buildId,
      planId,
      totalTasks: plan.tasks.length,
      totalWaves: plan.totalWaves,
      estimatedMinutes: plan.estimatedMinutes,
      message: `Build started. Poll /api/ai/build/status?buildId=${buildId} for progress.`,
    },
    { headers: rateLimitHeaders(rl) }
  )
}
