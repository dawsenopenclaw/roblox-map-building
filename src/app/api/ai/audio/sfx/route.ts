/**
 * POST /api/ai/audio/sfx
 *
 * Generates a short sound effect from a text prompt via FAL, uploads to
 * Roblox Open Cloud, and optionally queues a `create_sound` command for
 * the Studio plugin.
 *
 * Body:
 *   {
 *     prompt:          string
 *     durationSeconds? number          // 1..30, default 5
 *     sessionId?:      string
 *     autoInsert?:     boolean
 *     parent?:         string
 *     volume?:         number
 *     name?:           string
 *     autoPlay?:       boolean
 *   }
 *
 * Cost: 10 credits. Rate-limited to 30 / hour / user.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { requireTier } from '@/lib/tier-guard'
import { parseBody } from '@/lib/validations'
import { audioSfxRateLimit } from '@/lib/audio-rate-limit'
import { rateLimitHeaders } from '@/lib/rate-limit'
import { spendTokens } from '@/lib/tokens-server'
import { generateSFX } from '@/lib/audio-pipeline'
import { queueCommand, getSession } from '@/lib/studio-session'

export const maxDuration = 90

const SFX_CREDIT_COST = 10

const sfxSchema = z.object({
  prompt: z.string().min(3).max(300),
  durationSeconds: z.number().int().min(1).max(30).optional(),
  sessionId: z.string().optional(),
  autoInsert: z.boolean().optional(),
  parent: z.string().optional(),
  volume: z.number().min(0).max(10).optional(),
  name: z.string().max(64).optional(),
  autoPlay: z.boolean().optional(),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tierDenied = await requireTier(userId, 'FREE')
  if (tierDenied) return tierDenied

  try {
    const rl = await audioSfxRateLimit(userId)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many SFX requests. Please wait before generating again.' },
        { status: 429, headers: rateLimitHeaders(rl) },
      )
    }
  } catch {
    // Redis unavailable — allow through
  }

  const parsed = await parseBody(req, sfxSchema)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  }
  const body = parsed.data
  const prompt = body.prompt.trim()

  try {
    await spendTokens(userId, SFX_CREDIT_COST, 'ai.audio.sfx', {
      prompt: prompt.slice(0, 120),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Credit charge failed'
    return NextResponse.json({ error: message }, { status: 402 })
  }

  const result = await generateSFX({
    prompt,
    userId,
    sessionId: body.sessionId,
    durationSeconds: body.durationSeconds,
  })

  const autoInsert = body.autoInsert ?? !!body.sessionId
  let insertQueued = false
  let insertError: string | undefined

  if (autoInsert && body.sessionId && result.assetId) {
    const session = await getSession(body.sessionId)
    if (!session) {
      insertError = 'session_not_found'
    } else {
      const queueResult = await queueCommand(body.sessionId, {
        type: 'create_sound',
        data: {
          assetId: result.assetId,
          parent: body.parent,
          looped: false,
          volume: body.volume ?? 1,
          name: body.name ?? 'ForjeAI_SFX',
          autoPlay: body.autoPlay ?? false,
          playbackSpeed: 1,
          kind: 'sfx',
        },
      })
      insertQueued = queueResult.ok
      if (!queueResult.ok) insertError = queueResult.error
    }
  }

  return NextResponse.json({
    kind: 'sfx',
    assetId: result.assetId,
    rbxAssetId: result.assetId ? `rbxassetid://${result.assetId}` : null,
    generatedAssetId: result.generatedAssetId,
    status: result.status,
    externalTaskId: result.externalTaskId,
    sourceUrl: result.sourceUrl,
    moderationState: result.moderationState,
    message:
      result.message ??
      (result.status === 'pending_moderation'
        ? 'Audio uploading & being moderated by Roblox...'
        : undefined),
    autoInsert: {
      requested: autoInsert,
      queued: insertQueued,
      error: insertError,
    },
    credits: { charged: SFX_CREDIT_COST },
  })
}
