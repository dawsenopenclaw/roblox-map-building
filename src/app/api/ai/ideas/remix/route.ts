/**
 * POST /api/ai/ideas/remix
 *
 * Takes an existing idea id + a twist prompt and returns a hybrid concept.
 * Cost: 10 credits. Same dbUserId-resolution pattern as /generate so we
 * never regress the TokenBalance lookup bug surfaced by the deep audit.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { spendTokens } from '@/lib/tokens-server'
import { remixIdea, type GameIdea } from '@/lib/idea-generator/idea-pipeline'

export const runtime = 'nodejs'
export const maxDuration = 60

const COST_PER_REMIX = 10

const bodySchema = z.object({
  ideaId: z.string().min(1).max(200),
  twist: z.string().min(3).max(500),
  baseIdea: z
    .object({
      name: z.string().optional(),
      tagline: z.string().optional(),
      pitch: z.string().optional(),
      genre: z.string().optional(),
      uniqueSellingPoint: z.string().optional(),
      coreGameplayLoop: z.string().optional(),
      mechanics: z.array(z.string()).optional(),
      monetization: z.array(z.string()).optional(),
      gamePasses: z.array(z.object({
        name: z.string(),
        price: z.number(),
        description: z.string(),
      })).optional(),
      devProducts: z.array(z.object({
        name: z.string(),
        price: z.number(),
        description: z.string(),
      })).optional(),
      viralHooks: z.array(z.string()).optional(),
      targetAudience: z.string().optional(),
      targetAgeRange: z.string().optional(),
      targetPlatform: z.string().optional(),
      trendingScore: z.number().optional(),
      trendAlignment: z.array(z.string()).optional(),
      similarSuccessfulGames: z.array(z.string()).optional(),
      retentionMechanics: z.array(z.string()).optional(),
      socialFeatures: z.array(z.string()).optional(),
      developmentMilestones: z.array(z.string()).optional(),
    })
    .partial()
    .optional(),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // CRITICAL: resolve dbUserId from clerkId before spendTokens.
  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true, clerkId: true },
  })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  let body: z.infer<typeof bodySchema>
  try {
    const raw = await req.json()
    const parsed = bodySchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors.map((e) => e.message).join(', ') },
        { status: 422 },
      )
    }
    body = parsed.data
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    await spendTokens(
      user.clerkId,
      COST_PER_REMIX,
      `Idea Generator: remix ${body.ideaId}`,
      { feature: 'idea-generator-remix', ideaId: body.ideaId },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Token spend failed'
    return NextResponse.json(
      { error: message, code: 'INSUFFICIENT_CREDITS' },
      { status: 402 },
    )
  }

  try {
    const idea: GameIdea = await remixIdea(
      body.ideaId,
      body.twist,
      body.baseIdea as Partial<GameIdea> | undefined,
    )
    return NextResponse.json({ idea, cost: COST_PER_REMIX })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Remix failed'
    console.error('[ideas/remix] failed:', message)
    return NextResponse.json(
      { error: 'Remix failed', detail: message },
      { status: 502 },
    )
  }
}
