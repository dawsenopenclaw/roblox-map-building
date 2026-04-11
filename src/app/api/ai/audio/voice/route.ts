/**
 * POST /api/ai/audio/voice
 *
 * Generates a TTS voice line via FAL (ElevenLabs / PlayHT), uploads to
 * Roblox Open Cloud, and optionally queues a `create_sound` command for
 * the Studio plugin.
 *
 * Body:
 *   {
 *     text:        string (1..500)
 *     voice?:      string         // default "Adam"
 *     sessionId?:  string
 *     autoInsert?: boolean
 *     parent?:     string
 *     volume?:     number
 *     name?:       string
 *     autoPlay?:   boolean
 *   }
 *
 * Cost: 15 credits. Rate-limited to 20 / hour / user.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDbUserOrUnauthorized } from '@/lib/auth/get-db-user'
import { z } from 'zod'
import { requireTier } from '@/lib/tier-guard'
import { parseBody } from '@/lib/validations'
import { audioVoiceRateLimit } from '@/lib/audio-rate-limit'
import { rateLimitHeaders } from '@/lib/rate-limit'
import { spendTokens } from '@/lib/tokens-server'
import { generateVoice } from '@/lib/audio-pipeline'
import { queueCommand, getSession } from '@/lib/studio-session'

export const maxDuration = 90

const VOICE_CREDIT_COST = 15

const voiceSchema = z.object({
  text: z.string().min(1).max(500),
  voice: z.string().max(64).optional(),
  sessionId: z.string().optional(),
  autoInsert: z.boolean().optional(),
  parent: z.string().optional(),
  volume: z.number().min(0).max(10).optional(),
  name: z.string().max(64).optional(),
  autoPlay: z.boolean().optional(),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authResult = await getDbUserOrUnauthorized()
  if ('response' in authResult) return authResult.response
  const { user, clerkId: userId } = authResult

  const tierDenied = await requireTier(userId, 'FREE')
  if (tierDenied) return tierDenied

  try {
    const rl = await audioVoiceRateLimit(userId)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many voice requests. Please wait before generating again.' },
        { status: 429, headers: rateLimitHeaders(rl) },
      )
    }
  } catch {
    // Redis unavailable — allow through
  }

  const parsed = await parseBody(req, voiceSchema)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  }
  const body = parsed.data
  const text = body.text.trim()

  try {
    await spendTokens(user.id, VOICE_CREDIT_COST, 'ai.audio.voice', {
      text: text.slice(0, 120),
      voice: body.voice ?? 'Adam',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Credit charge failed'
    return NextResponse.json({ error: message }, { status: 402 })
  }

  const result = await generateVoice({
    text,
    voice: body.voice,
    userId,
    sessionId: body.sessionId,
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
          name: body.name ?? 'ForjeAI_Voice',
          autoPlay: body.autoPlay ?? false,
          playbackSpeed: 1,
          kind: 'voice',
        },
      })
      insertQueued = queueResult.ok
      if (!queueResult.ok) insertError = queueResult.error
    }
  }

  return NextResponse.json({
    kind: 'voice',
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
    credits: { charged: VOICE_CREDIT_COST },
  })
}
