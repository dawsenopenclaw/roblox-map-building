/**
 * POST /api/ai/build-feedback
 * Accept user feedback on AI-generated Luau builds ("this worked" / "this broke").
 * Also handles automatic build outcome recording from the chat route.
 *
 * Body: { promptHash, code, worked, errorMessage?, score, model, prompt?, category?, partCount?, userVote?, playtestPass? }
 * Returns: 200 { success: true }
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { recordFeedback, type BuildFeedback } from '@/lib/ai/luau-verifier'
import { db } from '@/lib/db'
import { learnFromFeedback } from '@/lib/ai/self-improve'

// ── Request schema ────────────────────────────��─────────────────────────────

const buildFeedbackSchema = z.object({
  promptHash: z.string().min(1).max(256),
  code: z.string().min(1).max(100_000),
  worked: z.boolean(),
  errorMessage: z.string().max(2000).optional(),
  score: z.number().int().min(0).max(100),
  model: z.string().min(1).max(128),
  // Learning system fields
  prompt: z.string().max(2000).optional(),
  category: z.string().max(128).optional(),
  partCount: z.number().int().min(0).optional(),
  userVote: z.boolean().optional(),
  playtestPass: z.boolean().optional(),
})

// ── POST handler ─────────��──────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 },
    )
  }

  const parsed = buildFeedbackSchema.safeParse(raw)
  if (!parsed.success) {
    const message = parsed.error.errors
      .map((e) => `${e.path.join('.') || 'body'}: ${e.message}`)
      .join(', ')
    return NextResponse.json(
      { success: false, error: message },
      { status: 422 },
    )
  }

  const { promptHash, code, worked, errorMessage, score, model, prompt, category, partCount, userVote, playtestPass } = parsed.data

  // Record to in-memory verifier feedback (L1 cache)
  const feedback: BuildFeedback = {
    promptHash,
    code,
    worked,
    errorMessage,
    score,
    model,
    timestamp: Date.now(),
  }
  recordFeedback(feedback)

  // Feed user votes into self-improvement engine (strongest learning signal)
  if (userVote !== undefined) {
    void learnFromFeedback(
      prompt || '',
      code,
      userVote,
      category || null,
    ).catch((e) => console.warn('[BuildFeedback] learnFromFeedback error:', e instanceof Error ? e.message : e))
  }

  // Persist to DB with learning fields (fire-and-forget for speed)
  try {
    // If this is a user vote on an existing build, try to update the most recent matching record
    if (model === 'user-vote') {
      const existing = await db.buildFeedback.findFirst({
        where: { promptHash },
        orderBy: { createdAt: 'desc' },
      })
      if (existing) {
        await db.buildFeedback.update({
          where: { id: existing.id },
          data: { userVote: worked },
        })
        return NextResponse.json({ success: true })
      }
    }

    await db.buildFeedback.create({
      data: {
        promptHash,
        code,
        worked,
        errorMessage,
        score,
        model,
        prompt: prompt || null,
        category: category || null,
        partCount: partCount || null,
        userVote: userVote ?? null,
        playtestPass: playtestPass ?? null,
      },
    })
  } catch (err) {
    // DB write is best-effort — don't fail the response
    console.warn('[BuildFeedback] DB write failed:', err instanceof Error ? err.message : err)
  }

  return NextResponse.json({ success: true })
}
