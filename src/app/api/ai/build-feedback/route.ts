/**
 * POST /api/ai/build-feedback
 * Accept user feedback on AI-generated Luau builds ("this worked" / "this broke").
 *
 * Body: { promptHash, code, worked, errorMessage?, score, model }
 * Returns: 200 { success: true }
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { recordFeedback, type BuildFeedback } from '@/lib/ai/luau-verifier'

// ── Request schema ──────────────────────────────────────────────────────────

const buildFeedbackSchema = z.object({
  promptHash: z.string().min(1).max(256),
  code: z.string().min(1).max(100_000),
  worked: z.boolean(),
  errorMessage: z.string().max(2000).optional(),
  score: z.number().int().min(0).max(100),
  model: z.string().min(1).max(128),
})

// ── POST handler ────────────────────────────────────────────────────────────

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

  const { promptHash, code, worked, errorMessage, score, model } = parsed.data

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

  return NextResponse.json({ success: true })
}
