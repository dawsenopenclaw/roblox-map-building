/**
 * POST /api/ai/mesh/generate
 *
 * Full prompt → 3D mesh → Roblox assetId pipeline.
 *
 * Unlike the legacy /api/ai/mesh route (which returns a raw GLB URL plus Luau
 * code), this endpoint runs the entire pipeline server-side and returns a real
 * rbxassetid that the Studio plugin can LoadAsset() directly. When the caller
 * provides `autoInsert: true` + `sessionId` the command is queued automatically
 * onto the plugin's command queue.
 *
 * Body:
 *   {
 *     prompt:      string   (3..500 chars)
 *     style?:      "realistic"|"cartoon"|"low-poly"  (default "realistic")
 *     refImageUrl?: string                           — if set, uses image-to-3d
 *     sessionId?:  string                            — required when autoInsert = true
 *     autoInsert?: boolean                           — default false
 *   }
 *
 * Response 200:
 *   {
 *     assetId:           string    — numeric Roblox asset ID
 *     generatedAssetId:  string    — DB row id (poll via /api/ai/mesh/status/[id])
 *     status:            "completed"
 *     creditsRemaining:  number
 *     inserted:          boolean   — true if the insert_asset command was queued
 *   }
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import {
  generateMeshFromPrompt,
  MESH_GENERATION_COST,
} from '@/lib/mesh-pipeline'
import { queueCommand, getSession } from '@/lib/studio-session'
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// The pipeline needs up to 5 minutes of wall-clock time for Meshy + Open Cloud.
// Vercel Pro allows up to 300s for Node runtime routes.
export const maxDuration = 300

// ---------------------------------------------------------------------------
// Rate limiter — 10 mesh generations per hour per user
// ---------------------------------------------------------------------------

const upstashConfigured = !!(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
)

const meshGenerateLimiter = upstashConfigured
  ? new Ratelimit({
      redis: new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      }),
      limiter: Ratelimit.slidingWindow(10, '1 h'),
      prefix: 'ratelimit:ai:mesh-generate',
    })
  : null

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const bodySchema = z.object({
  prompt: z.string().min(3).max(500),
  style: z.enum(['realistic', 'cartoon', 'low-poly']).optional(),
  refImageUrl: z.string().url().optional(),
  sessionId: z.string().optional(),
  autoInsert: z.boolean().optional(),
})

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Rate limit (10 / hr / user) ───────────────────────────────────────────
  const rl = await checkRateLimit(meshGenerateLimiter, clerkId, 10, 3_600)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded — try again later.' },
      { status: 429, headers: rateLimitHeaders(rl) },
    )
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Validation failed' },
      { status: 400 },
    )
  }

  const body = parsed.data

  // ── Resolve internal user id + balance check ─────────────────────────────
  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const balance = await db.tokenBalance.findUnique({
    where: { userId: user.id },
    select: { balance: true },
  })

  const currentBalance = balance?.balance ?? 0
  if (currentBalance < MESH_GENERATION_COST) {
    return NextResponse.json(
      {
        error: 'Insufficient credits',
        required: MESH_GENERATION_COST,
        available: currentBalance,
      },
      { status: 402 },
    )
  }

  // ── If autoInsert is requested, verify the session exists *before* we
  //    spend any time on generation so we can surface a clean 404 early.
  if (body.autoInsert && body.sessionId) {
    const session = await getSession(body.sessionId)
    if (!session) {
      return NextResponse.json(
        { error: 'session_not_found' },
        { status: 404 },
      )
    }
  }

  // ── Run the pipeline ──────────────────────────────────────────────────────
  let result: Awaited<ReturnType<typeof generateMeshFromPrompt>>
  try {
    result = await generateMeshFromPrompt({
      prompt: body.prompt,
      userId: user.id,
      sessionId: body.sessionId,
      style: body.style,
      refImageUrl: body.refImageUrl,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown pipeline error'
    console.error('[mesh/generate] pipeline failed:', message)
    return NextResponse.json(
      { error: message },
      { status: 502 },
    )
  }

  // ── Optional auto-insert into Studio ──────────────────────────────────────
  let inserted = false
  if (body.autoInsert && body.sessionId) {
    try {
      const queueResult = await queueCommand(body.sessionId, {
        type: 'insert_asset',
        data: {
          assetId: result.generatedAssetId,
          robloxAssetId: result.assetId,
          name: body.prompt.slice(0, 50),
          position: { x: 0, y: 5, z: 0 },
        },
      })
      inserted = queueResult.ok
      if (!queueResult.ok) {
        console.warn('[mesh/generate] queueCommand failed:', queueResult.error)
      }
    } catch (err) {
      console.warn(
        '[mesh/generate] queueCommand threw:',
        err instanceof Error ? err.message : err,
      )
    }
  }

  // ── Fetch the fresh balance to include in the response ────────────────────
  const updatedBalance = await db.tokenBalance.findUnique({
    where: { userId: user.id },
    select: { balance: true },
  })

  return NextResponse.json(
    {
      assetId: result.assetId,
      generatedAssetId: result.generatedAssetId,
      status: result.status,
      creditsRemaining: updatedBalance?.balance ?? currentBalance - MESH_GENERATION_COST,
      inserted,
    },
    { status: 200, headers: rateLimitHeaders(rl) },
  )
}
