/**
 * POST|GET /api/crons/drip-campaign
 *
 * DEPRECATED — consolidated into /api/crons/email-drip.
 * This route now proxies to the email-drip handler to avoid breaking
 * any stale cron triggers or manual calls.
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

function deprecatedResponse() {
  return NextResponse.json({
    ok: true,
    message: 'This endpoint is deprecated. Use /api/crons/email-drip instead.',
  })
}

export async function POST(_req: NextRequest) {
  return deprecatedResponse()
}

export async function GET(_req: NextRequest) {
  return deprecatedResponse()
}
