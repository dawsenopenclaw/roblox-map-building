/**
 * POST /api/ai/feedback
 * Accept user feedback on AI responses and apply it to the prompt optimizer.
 *
 * Body: { messageId: string, rating?: 1|2|3|4|5, thumbsUp?: boolean, comment?: string }
 * Returns: { success: boolean, updatedQuality: number | null, stats: QualityStats }
 *
 * Demo mode (DEMO_MODE=true or no DB): stores nothing, returns mock success.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { feedbackBodySchema } from '@/lib/validations'
import { applyFeedback, getOptimizerStats, type FeedbackInput } from '@/lib/ai/prompt-optimizer'
import { getQualityStats, getDegradingIntents } from '@/lib/ai/response-quality'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FeedbackResponse {
  success: boolean
  updatedQuality: number | null
  optimizerStats: Record<string, unknown>
  degradingIntents: string[]
  demo: boolean
  error?: string
}

type FeedbackBody = z.infer<typeof feedbackBodySchema>

// ---------------------------------------------------------------------------
// Demo mode quality stats (static, returned when no records exist)
// ---------------------------------------------------------------------------

function buildDemoStats(): Record<string, unknown> {
  return {
    totalRecords: 0,
    intentCounts: {},
    variantStats: {},
    activeAbTests: [],
    note: 'Demo mode — no records stored',
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse<FeedbackResponse>> {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json(
      { success: false, updatedQuality: null, optimizerStats: {}, degradingIntents: [], demo: false, error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const parsed = feedbackBodySchema.safeParse(raw)
  if (!parsed.success) {
    const message = parsed.error.errors
      .map((e) => `${e.path.join('.') || 'body'}: ${e.message}`)
      .join(', ')
    return NextResponse.json(
      {
        success: false,
        updatedQuality: null,
        optimizerStats: {},
        degradingIntents: [],
        demo: false,
        error: message,
      },
      { status: 422 }
    )
  }

  const { messageId, rating, thumbsUp } = parsed.data
  const isDemo = process.env.DEMO_MODE === 'true' || !process.env.DATABASE_URL

  if (isDemo) {
    // Demo mode: return mock success without touching any store
    return NextResponse.json({
      success: true,
      updatedQuality: rating ? (rating - 1) / 4 : thumbsUp ? 0.85 : 0.25,
      optimizerStats: buildDemoStats(),
      degradingIntents: [],
      demo: true,
    })
  }

  // Build feedback input
  let feedback: FeedbackInput
  if (rating !== undefined) {
    feedback = { type: 'rating', value: rating }
  } else {
    feedback = { type: 'thumbs', value: thumbsUp! }
  }

  // Apply to in-process optimizer
  const applied = applyFeedback(messageId, feedback)

  // Gather updated stats
  const optimizerStats = getOptimizerStats()
  const qualityStats = getQualityStats()
  const degradingIntents = getDegradingIntents()

  // Compute a normalized quality number for the response
  let updatedQuality: number | null = null
  if (applied) {
    if (rating !== undefined) {
      updatedQuality = parseFloat(((rating - 1) / 4).toFixed(2))
    } else if (thumbsUp !== undefined) {
      updatedQuality = thumbsUp ? 0.85 : 0.2
    }
  }

  return NextResponse.json({
    success: applied,
    updatedQuality,
    optimizerStats: {
      ...optimizerStats,
      qualitySampleCount: qualityStats.reduce((s, qs) => s + qs.sampleCount, 0),
    },
    degradingIntents,
    demo: false,
  })
}

// ---------------------------------------------------------------------------
// GET — return current quality metrics (no auth required for dev, add auth for prod)
// ---------------------------------------------------------------------------

export async function GET(): Promise<NextResponse> {
  const optimizerStats = getOptimizerStats()
  const qualityStats = getQualityStats()
  const degradingIntents = getDegradingIntents()

  return NextResponse.json({
    optimizerStats,
    qualityStats: qualityStats.map(s => ({
      intent: s.intent,
      sampleCount: s.sampleCount,
      averageTotal: parseFloat(s.averageTotal.toFixed(3)),
      averageSpecificity: parseFloat(s.averageSpecificity.toFixed(3)),
      averageActionability: parseFloat(s.averageActionability.toFixed(3)),
      trend: s.trend,
    })),
    degradingIntents,
  })
}
