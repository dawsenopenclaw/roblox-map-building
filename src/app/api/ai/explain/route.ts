/**
 * Code Explanation API — Returns instant static analysis explanation
 * of Luau code without an AI call (fast, free, deterministic).
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { explainCode, formatExplanation } from '@/lib/ai/code-explainer'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const code = body.code as string

    if (!code || code.length < 10) {
      return NextResponse.json({ error: 'No code provided' }, { status: 400 })
    }

    const explanation = explainCode(code)
    const formatted = formatExplanation(explanation)

    return NextResponse.json({
      explanation,
      formatted,
    })
  } catch (err) {
    console.error('[Explain] Error:', err)
    return NextResponse.json({ error: 'Failed to explain code' }, { status: 500 })
  }
}
