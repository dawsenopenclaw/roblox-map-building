import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { enhancePrompt, type EnhancedPrompt } from '@/lib/ai/prompt-enhancer'

/**
 * POST /api/ai/enhance
 *
 * FREE pre-processing endpoint that analyzes a raw user prompt and returns
 * a structured build plan. This uses Groq (Llama) which is fast and cheap,
 * so it does NOT deduct any user credits.
 *
 * Auth: Required (Clerk) — but no credit check.
 *
 * Body: { prompt: string, context?: string }
 * Response: EnhancedPrompt JSON
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const isDemo = process.env.DEMO_MODE === 'true'

  if (!isDemo) {
    let userId: string | null = null
    try {
      const session = await auth()
      userId = session?.userId ?? null
    } catch {
      // Clerk unavailable — allow through for dev
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in.' },
        { status: 401 },
      )
    }
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  let body: { prompt?: string; context?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
  if (!prompt) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 422 })
  }
  if (prompt.length > 4000) {
    return NextResponse.json({ error: 'prompt exceeds 4000 characters' }, { status: 422 })
  }

  const context = typeof body.context === 'string' ? body.context.trim() : undefined

  // ── Enhance ────────────────────────────────────────────────────────────────
  try {
    const enhanced: EnhancedPrompt = await enhancePrompt(prompt, context)
    return NextResponse.json(enhanced)
  } catch (err) {
    console.error('[api/ai/enhance] Unexpected error:', err)
    return NextResponse.json(
      { error: 'Enhancement failed. Please try again.' },
      { status: 500 },
    )
  }
}
