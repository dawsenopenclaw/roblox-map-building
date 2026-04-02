/**
 * Studio Auth — stateless code system that works on Vercel serverless.
 *
 * Instead of storing codes in memory (breaks across Lambda invocations),
 * we generate a signed token that encodes the code + expiry. The claim
 * endpoint verifies the signature without needing shared state.
 *
 * GET  ?action=generate         → { code, token, expiresAt }
 * GET  ?action=status&code=X    → { status, claimed } (checks session store)
 * POST { code, token, placeId } → { token, sessionId }
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const CODE_TTL_MS = 5 * 60 * 1000 // 5 minutes
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
// STUDIO_AUTH_SECRET must be set in .env. If missing, a per-process random
// secret is generated — tokens issued in a previous process will be invalid
// after a restart, which is the safe failure mode.
const SECRET: string = (() => {
  const s = process.env.STUDIO_AUTH_SECRET ?? process.env.CLERK_SECRET_KEY
  if (!s) {
    const fallback = crypto.randomBytes(32).toString('hex')
    console.warn('[studio/auth] WARNING: STUDIO_AUTH_SECRET is not set. Using a per-process random secret — any tokens from a previous process will be rejected. Set STUDIO_AUTH_SECRET in your environment.')
    return fallback
  }
  return s
})()

// ── Claimed code store (Redis-backed for serverless, in-memory fallback) ────
// Key: code → { sessionId, placeName, placeId, claimedAt }
const claimedCodes = new Map<string, { sessionId: string; placeName: string; placeId: string; claimedAt: number; jwt?: string }>()

async function markCodeClaimed(code: string, data: { sessionId: string; placeName: string; placeId: string; jwt?: string }) {
  claimedCodes.set(code, { ...data, claimedAt: Date.now() })
  // Also persist to Redis so other Lambdas can see it
  try {
    const { redis } = await import('@/lib/redis') as { redis: { set: (k: string, v: string, m: string, t: number) => Promise<unknown> } | null }
    if (redis) await redis.set(`fj:studio:code:${code}`, JSON.stringify({ ...data, claimedAt: Date.now() }), 'EX', 600)
  } catch { /* ignore */ }
}

async function getCodeClaim(code: string): Promise<{ sessionId: string; placeName: string; placeId: string; claimedAt: number; jwt?: string } | null> {
  // Check memory first
  const mem = claimedCodes.get(code)
  if (mem) return mem
  // Check Redis
  try {
    const { redis } = await import('@/lib/redis') as { redis: { get: (k: string) => Promise<string | null> } }
    if (redis) {
      const raw = await redis.get(`fj:studio:code:${code}`)
      if (raw) {
        const data = JSON.parse(raw)
        claimedCodes.set(code, data) // hydrate memory
        return data
      }
    }
  } catch { /* ignore */ }
  return null
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

function generateCode(): string {
  let code = ''
  const bytes = crypto.randomBytes(6)
  for (const byte of bytes) {
    code += CHARS[byte % CHARS.length]
  }
  return code
}

function signCode(code: string, expiresAt: number): string {
  const payload = `${code}:${expiresAt}`
  const hmac = crypto.createHmac('sha256', SECRET).update(payload).digest('hex').slice(0, 16)
  // Encode as base64url: code:expiry:hmac
  return Buffer.from(`${payload}:${hmac}`).toString('base64url')
}

function verifyCodeToken(token: string): { code: string; expiresAt: number } | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8')
    const parts = decoded.split(':')
    if (parts.length !== 3) return null

    const [code, expiresAtStr, hmac] = parts
    const expiresAt = parseInt(expiresAtStr, 10)

    // Verify HMAC
    const expectedHmac = crypto.createHmac('sha256', SECRET).update(`${code}:${expiresAt}`).digest('hex').slice(0, 16)
    if (hmac !== expectedHmac) return null

    // Check expiry
    if (Date.now() > expiresAt) return null

    return { code, expiresAt }
  } catch {
    return null
  }
}

// ── GET ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const action = searchParams.get('action') ?? 'generate'

  if (action === 'generate') {
    const code = generateCode()
    const expiresAt = Date.now() + CODE_TTL_MS
    const token = signCode(code, expiresAt)

    return NextResponse.json(
      { code, token, expiresInSeconds: CODE_TTL_MS / 1000, expiresAt },
      { status: 200, headers: CORS },
    )
  }

  if (action === 'status') {
    const code = (searchParams.get('code') ?? '').toUpperCase().replace(/\s/g, '')
    if (!code) {
      return NextResponse.json({ error: 'code param required' }, { status: 400, headers: CORS })
    }

    // Check if this code was claimed by a plugin
    const claim = await getCodeClaim(code)
    if (claim) {
      return NextResponse.json(
        {
          status: 'connected',
          claimed: true,
          code,
          sessionId: claim.sessionId,
          placeName: claim.placeName,
          placeId: claim.placeId,
          jwt: claim.jwt ?? null,
        },
        { status: 200, headers: CORS },
      )
    }
    return NextResponse.json(
      { status: 'pending', claimed: false, code },
      { status: 200, headers: CORS },
    )
  }

  return NextResponse.json(
    { error: 'use ?action=generate or ?action=status&code=X' },
    { status: 400, headers: CORS },
  )
}

// ── POST — claim a code ───────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json() as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400, headers: CORS })
  }

  const code = String(body.code ?? '').toUpperCase().replace(/\s/g, '')
  const codeToken = String(body.token ?? body.codeToken ?? '')
  const placeId = String(body.placeId ?? 'unknown')
  const placeName = String(body.placeName ?? 'Unknown Place')
  const pluginVer = String(body.pluginVer ?? body.pluginVersion ?? '1.0.0')

  // Verify the signed code token — this is the ONLY accepted path.
  // The bare-code fallback was removed: a length-only check is a brute-force
  // bypass. The 6-char code space (~1B combos) is trivially enumerable against
  // a serverless endpoint that has no centralised rate-limit state.
  if (!codeToken) {
    return NextResponse.json(
      { error: 'signed_token_required' },
      { status: 400, headers: CORS },
    )
  }

  const verified = verifyCodeToken(codeToken)
  if (!verified) {
    return NextResponse.json(
      { error: 'code_expired_or_invalid' },
      { status: 400, headers: CORS },
    )
  }
  if (verified.code !== code) {
    return NextResponse.json(
      { error: 'code_mismatch' },
      { status: 400, headers: CORS },
    )
  }

  // Build a self-contained JWT-style signed session token.
  // Format: base64url(payload) + '.' + base64url(hmac_sha256)
  // Every Lambda can verify the signature independently — no shared state needed.
  const sessionId = crypto.randomBytes(8).toString('hex')
  const iat = Date.now()
  const expiresAt = iat + 30 * 24 * 60 * 60 * 1000 // 30 days

  const payloadObj = {
    sid: sessionId,
    pid: placeId,
    pn:  placeName,
    pv:  pluginVer,
    iat,
  }
  const payloadB64 = Buffer.from(JSON.stringify(payloadObj)).toString('base64url')
  const sig = crypto
    .createHmac('sha256', SECRET)
    .update(payloadB64)
    .digest('base64url')
  const jwtToken = `${payloadB64}.${sig}`

  // Also hydrate this Lambda's in-memory session store so the SAME Lambda can
  // immediately serve sync/execute requests without a Redis round-trip.
  // IMPORTANT: pass sessionId so the in-memory session uses the same ID that
  // is encoded in the JWT. Without this pin, createSession() auto-generates a
  // different ID, and the plugin's first /sync poll (which reconstructs the
  // session from the JWT) will never find a matching queue entry.
  try {
    const { createSession } = await import('@/lib/studio-session')
    createSession({
      sessionId,
      placeId,
      placeName,
      pluginVersion: pluginVer,
      authToken: jwtToken,
    })
  } catch (e) {
    console.warn('[studio/auth] Session store unavailable:', (e as Error).message)
  }

  // Mark code as claimed so status endpoint can report it
  // Include JWT so the website can retrieve it when polling status
  await markCodeClaimed(code, { sessionId, placeName, placeId, jwt: jwtToken })

  return NextResponse.json(
    { token: jwtToken, sessionId, expiresAt },
    { status: 200, headers: CORS },
  )
}
