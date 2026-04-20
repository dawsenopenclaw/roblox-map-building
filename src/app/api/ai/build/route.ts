/**
 * AI Build Orchestration API
 *
 * POST /api/ai/build
 *   Body: { prompt: string, gameType?: string }
 *   Returns: BuildPlan (for user approval before execution)
 *
 * POST /api/ai/build/execute
 *   Body: { planId: string, sessionId?: string }
 *   Returns: { buildId: string }
 *
 * GET /api/ai/build/status?buildId=xxx
 *   Returns: BuildProgress (polling endpoint)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { requireTier } from '@/lib/tier-guard'
import { parseBody } from '@/lib/validations'
import { aiRateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import { generateBuildPlan } from '@/lib/ai/build-planner'
import { storePlan } from '@/lib/ai/build-executor'

export const maxDuration = 60

// ── Request schemas ───────────────────────────────────────────────────────────

const buildRequestSchema = z.object({
  prompt: z
    .string()
    .min(5, 'Prompt must be at least 5 characters')
    .max(1000, 'Prompt must be under 1000 characters'),
  gameType: z
    .enum(['tycoon', 'simulator', 'rpg', 'obby', 'roleplay', 'tower_defense', 'custom'])
    .optional(),
})

// ── POST /api/ai/build — generate plan ───────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // HOBBY+ required to use full build orchestration
  const tierBlock = await requireTier(userId, 'FREE') // Beta: all testers get full access
  if (tierBlock) return tierBlock

  // Rate limit: shared AI bucket — 20 req/min
  // Wrap in try/catch so a Redis outage does not hard-fail the endpoint.
  let rl: Awaited<ReturnType<typeof aiRateLimit>>
  try {
    rl = await aiRateLimit(userId)
  } catch {
    // Redis unavailable — allow through rather than hard-failing the user
    rl = { allowed: true, limit: 20, remaining: 0, resetAt: Date.now() + 60000 }
  }
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again in 60 seconds.' },
      { status: 429, headers: rateLimitHeaders(rl) }
    )
  }

  const parsed = await parseBody(req, buildRequestSchema)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  }

  const { prompt, gameType } = parsed.data

  // Enrich prompt with gameType hint if provided
  const enrichedPrompt = gameType
    ? `${prompt} (game type: ${gameType})`
    : prompt

  let plan
  try {
    plan = await generateBuildPlan(enrichedPrompt)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Build plan generation failed'
    console.error('[api/ai/build] generateBuildPlan error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }

  // Store plan in Redis for 30 minutes (user must approve before executing)
  await storePlan(plan)

  return NextResponse.json(
    {
      plan,
      message: `Plan generated: ${plan.tasks.length} tasks across ${plan.totalWaves} waves. Estimated ${plan.estimatedMinutes} minutes.`,
    },
    { headers: rateLimitHeaders(rl) }
  )
}
