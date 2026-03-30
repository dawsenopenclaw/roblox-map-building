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
import { applyFeedback, getOptimizerStats, type FeedbackInput } from '@/lib/ai/prompt-optimizer'
import { getQualityStats, getDegradingIntents } from '@/lib/ai/response-quality'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FeedbackBody {
  messageId: string
  rating?: 1 | 2 | 3 | 4 | 5
  thumbsUp?: boolean
  comment?: string
}

interface FeedbackResponse {
  success: boolean
  updatedQuality: number | null
  optimizerStats: Record<string, unknown>
  degradingIntents: string[]
  demo: boolean
  error?: string
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateBody(body: unknown): { valid: true; data: FeedbackBody } | { valid: false; error: string } {
  if (typeof body !== 'object' || body === null) {
    return { valid: false, error: 'Body must be a JSON object' }
  }
  const b = body as Record<string, unknown>

  if (typeof b.messageId !== 'string' || b.messageId.trim().length === 0) {
    return { valid: false, error: 'messageId is required (string)' }
  }

  if (b.rating !== undefined) {
    if (![1, 2, 3, 4, 5].includes(b.rating as number)) {
      return { valid: false, error: 'rating must be 1, 2, 3, 4, or 5' }
    }
  }

  if (b.thumbsUp !== undefined && typeof b.thumbsUp !== 'boolean') {
    return { valid: false, error: 'thumbsUp must be a boolean' }
  }

  if (b.rating === undefined && b.thumbsUp === undefined) {
    return { valid: false, error: 'At least one of rating or thumbsUp is required' }
  }

  if (b.comment !== undefined && typeof b.comment !== 'string') {
    return { valid: false, error: 'comment must be a string' }
  }

  // Sanitize comment length
  if (typeof b.comment === 'string' && b.comment.length > 500) {
    b.comment = b.comment.slice(0, 500)
  }

  return {
    valid: true,
    data: {
      messageId: (b.messageId as string).trim(),
      rating: b.rating as 1 | 2 | 3 | 4 | 5 | undefined,
      thumbsUp: b.thumbsUp as boolean | undefined,
      comment: b.comment as string | undefined,
    },
  }
}

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
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { success: false, updatedQuality: null, optimizerStats: {}, degradingIntents: [], demo: false },
      { status: 400 }
    )
  }

  const validation = validateBody(body)
  if (!validation.valid) {
    return NextResponse.json(
      {
        success: false,
        updatedQuality: null,
        optimizerStats: {},
        degradingIntents: [],
        demo: false,
        error: validation.error,
      },
      { status: 422 }
    )
  }

  const { messageId, rating, thumbsUp } = validation.data
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

  // If comment exists, log it (future: store in DB)
  if (validation.data.comment) {
    // TODO: persist comment to DB when available
    console.log(`[feedback] ${messageId}: "${validation.data.comment}"`)
  }

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
