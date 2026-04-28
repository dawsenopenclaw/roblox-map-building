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
 *
 * BUG FIX (Apr 27 2026): The old implementation looked up tokens in a
 * globalThis store (`__fjStudioAuthCodes`) that was never populated by any
 * route — the auth route uses `__fjClaimedCodes` and `__fjPendingCodes`
 * with different data structures. This meant validate ALWAYS returned 401,
 * forcing re-auth on every Studio restart and breaking reconnection for
 * users with saved tokens.
 *
 * Fix: verify the JWT signature using the same HMAC secret as auth/sync/
 * connect routes. The token IS a self-contained JWT — no shared state
 * needed. This works across all Lambda instances and survives cold starts.
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getStudioAuthSecret } from '@/lib/studio-auth-secret'

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
// JWT verification — same logic as connect/route.ts and sync/route.ts
// ---------------------------------------------------------------------------

interface JwtPayload {
  sid: string   // sessionId
  pid: string   // placeId
  pn:  string   // placeName
  pv:  string   // pluginVersion
  iat: number   // issued-at (ms)
}

function verifyJwt(token: string): JwtPayload | null {
  try {
    const dot = token.lastIndexOf('.')
    if (dot < 1) return null
    const payloadB64 = token.slice(0, dot)
    const sig = token.slice(dot + 1)

    const expectedSig = crypto
      .createHmac('sha256', getStudioAuthSecret())
      .update(payloadB64)
      .digest('base64url')
    const sigBuf = Buffer.from(sig)
    const expBuf = Buffer.from(expectedSig)
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8')) as JwtPayload
    if (!payload.sid || !payload.pid) return null
    // Reject tokens older than 30 days
    if (payload.iat && Date.now() - payload.iat > 30 * 24 * 60 * 60 * 1000) return null
    return payload
  } catch {
    return null
  }
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

  // Verify the JWT signature — stateless, works on any Lambda instance,
  // survives cold starts and deploys. No shared globalThis store needed.
  const payload = verifyJwt(token)
  if (!payload) {
    return NextResponse.json(
      { valid: false, error: 'token_invalid_or_expired' },
      { status: 401, headers: CORS },
    )
  }

  // Token is valid — return session info from the JWT payload.
  // The session may or may not still exist in memory/Redis, but the token
  // itself is valid and the sync route will recreate the session on demand.
  return NextResponse.json(
    {
      valid: true,
      sessionId: payload.sid,
      placeId: payload.pid,
      placeName: payload.pn,
    },
    { status: 200, headers: CORS },
  )
}
