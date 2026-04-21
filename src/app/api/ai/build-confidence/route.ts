/**
 * POST /api/ai/build-confidence
 *
 * Checks historical success rate for a prompt and returns a confidence score.
 * Used by the client to auto-trigger preview mode when confidence is low.
 *
 * Body: { prompt: string, buildType?: string }
 * Returns: { confidence: number, sampleSize: number, suggestion: 'proceed'|'preview'|'warn', reason?: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getConfidence, type BuildType } from '@/lib/ai/experience-memory'

export async function POST(req: NextRequest) {
  let body: { prompt?: string; buildType?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ confidence: 0.5, sampleSize: 0, suggestion: 'proceed' })
  }

  const prompt = body.prompt?.trim()
  if (!prompt) {
    return NextResponse.json({ confidence: 0.5, sampleSize: 0, suggestion: 'proceed' })
  }

  try {
    const result = await getConfidence(prompt, (body.buildType as BuildType) || 'build')
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ confidence: 0.5, sampleSize: 0, suggestion: 'proceed' })
  }
}
