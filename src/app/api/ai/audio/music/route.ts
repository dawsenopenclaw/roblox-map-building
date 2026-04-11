/**
 * POST /api/ai/audio/music
 *
 * Generates custom music from a text prompt via FAL (stable-audio / musicgen),
 * uploads the resulting audio to Roblox Open Cloud, and — when the caller
 * passes a live `sessionId` — queues a `create_sound` command for the Studio
 * plugin so the Sound instance is inserted automatically.
 *
 * Body:
 *   {
 *     prompt:          string
 *     durationSeconds? number              // 5..120, default 30
 *     sessionId?:      string              // live Studio session to auto-insert into
 *     autoInsert?:     boolean             // default true when sessionId is present
 *     parent?:         string              // workspace path or instance name
 *     looped?:         boolean
 *     volume?:         number
 *     name?:           string
 *     autoPlay?:       boolean
 *   }
 *
 * Cost: 30 credits. Rate-limited to 10 requests / hour / user.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { requireTier } from '@/lib/tier-guard'
import { parseBody } from '@/lib/validations'
import { audioMusicRateLimit } from '@/lib/audio-rate-limit'
import { rateLimitHeaders } from '@/lib/rate-limit'
import { spendTokens } from '@/lib/tokens-server'
import { generateMusic } from '@/lib/audio-pipeline'
import { queueCommand, getSession } from '@/lib/studio-session'

export const maxDuration = 120

const MUSIC_CREDIT_COST = 30

const musicSchema = z.object({
  prompt: z.string().min(3).max(500),
  durationSeconds: z.number().int().min(5).max(120).optional(),
  sessionId: z.string().optional(),
  autoInsert: z.boolean().optional(),
  parent: z.string().optional(),
  looped: z.boolean().optional(),
  volume: z.number().min(0).max(10).optional(),
  name: z.string().max(64).optional(),
  autoPlay: z.boolean().optional(),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Auth
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tierDenied = await requireTier(userId, 'FREE')
  if (tierDenied) return tierDenied

  // Rate limit — 10 / hour
  try {
    const rl = await audioMusicRateLimit(userId)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many music requests. Please wait before generating again.' },
        { status: 429, headers: rateLimitHeaders(rl) },
      )
    }
  } catch {
    // Redis unavailable — allow through
  }

  // Body validation
  const parsed = await parseBody(req, musicSchema)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  }
  const body = parsed.data
  const prompt = body.prompt.trim()

  // Credits: charge up front — if generation fails we log it but don't auto-refund
  // (matches the mesh pipeline's behaviour). Users retry expensive jobs rarely.
  try {
    await spendTokens(userId, MUSIC_CREDIT_COST, 'ai.audio.music', {
      prompt: prompt.slice(0, 120),
      durationSeconds: body.durationSeconds ?? 30,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Credit charge failed'
    return NextResponse.json({ error: message }, { status: 402 })
  }

  // Run pipeline
  const result = await generateMusic({
    prompt,
    userId,
    sessionId: body.sessionId,
    durationSeconds: body.durationSeconds,
  })

  // Optional: auto-insert into live Studio session
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
          looped: body.looped ?? true,
          volume: body.volume ?? 0.5,
          name: body.name ?? 'ForjeAI_Music',
          autoPlay: body.autoPlay ?? false,
          playbackSpeed: 1,
          kind: 'music',
        },
      })
      insertQueued = queueResult.ok
      if (!queueResult.ok) insertError = queueResult.error
    }
  }

  return NextResponse.json({
    kind: 'music',
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
    credits: { charged: MUSIC_CREDIT_COST },
  })
}
