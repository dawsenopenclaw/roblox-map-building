/**
 * GET /api/studio/auth/validate
 *
 * Called by the Studio plugin on startup to confirm a saved token is still
 * valid. The plugin sends `Authorization: Bearer <token>`.
 *
 * Returns 200 { valid: true, sessionId? } if the token is recognised.
 * Returns 401 if the token is expired or unknown.
 *
 * Auth.lua calls this before starting the sync loop so a stale token
 * triggers a re-auth prompt instead of silent poll failures.
 */

import { NextRequest, NextResponse } from 'next/server'

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()

  if (!token) {
    return NextResponse.json(
      { valid: false, error: 'Authorization header missing' },
      { status: 401, headers: CORS },
    )
  }

  // Look through the auth-code store for a matching token.
  // We use the same in-memory global set in auth/route.ts.
  // @ts-expect-error
  const store: Map<string, { token: string | null; sessionId: string | null; createdAt: number }> =
    // @ts-expect-error
    globalThis.__fjStudioAuthCodes ?? new Map()

  let matchedSessionId: string | null = null
  for (const entry of store.values()) {
    if (entry.token === token) {
      matchedSessionId = entry.sessionId
      break
    }
  }

  if (!matchedSessionId) {
    // Token not found in code store — could be a fresh deploy (store cleared).
    // Return 401 so the plugin prompts re-auth.
    return NextResponse.json(
      { valid: false, error: 'token_not_found' },
      { status: 401, headers: CORS },
    )
  }

  return NextResponse.json(
    { valid: true, sessionId: matchedSessionId },
    { status: 200, headers: CORS },
  )
}
