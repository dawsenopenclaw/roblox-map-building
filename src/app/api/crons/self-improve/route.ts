/**
 * GET /api/crons/self-improve
 *
 * Runs the AI self-improvement analysis every 4 hours.
 * Analyzes recent builds, extracts failure patterns, and generates
 * new rules that get injected into future prompts.
 *
 * Protected by CRON_SECRET header.
 */

import { NextRequest, NextResponse } from 'next/server'
import { runSelfImprovement } from '@/lib/ai/self-improve'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[Cron:SelfImprove] Starting self-improvement analysis...')
    const result = await runSelfImprovement()
    console.log(`[Cron:SelfImprove] Complete: ${result.rulesAdded} rules added, ${result.rulesStrengthened} strengthened`)

    return NextResponse.json({
      success: true,
      rulesAdded: result.rulesAdded,
      rulesStrengthened: result.rulesStrengthened,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[Cron:SelfImprove] Error:', err instanceof Error ? err.message : err)
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }, { status: 500 })
  }
}
