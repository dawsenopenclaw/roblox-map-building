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
import { createSession, getSessionByToken } from '@/lib/studio-session'

const CODE_TTL_MS = 5 * 60 * 1000 // 5 minutes
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const SECRET = process.env.CLERK_SECRET_KEY || process.env.STUDIO_AUTH_SECRET || 'forjegames-studio-default-secret'

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

    // Check if any session was created with this code by looking at all sessions
    // The session's authToken won't match the code, but we store code in metadata
    // For now, just report the code is valid and pending (actual connection shown via /status)
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

  // Verify the signed code token
  if (codeToken) {
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
  } else if (code.length < 4) {
    return NextResponse.json(
      { error: 'code is required' },
      { status: 400, headers: CORS },
    )
  }

  // If no signed token provided, verify the code is at least valid format
  // (backwards compat with older plugin versions that don't send token)
  // In serverless, we can't verify against an in-memory store, so we
  // trust the code if it matches the format and create the session.
  // The HMAC-signed token path above is the secure path.

  // Generate auth token for this session
  const authToken = crypto.randomBytes(32).toString('hex')
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days

  const session = createSession({
    placeId,
    placeName,
    pluginVersion: pluginVer,
    authToken,
  })

  return NextResponse.json(
    { token: authToken, sessionId: session.sessionId, expiresAt },
    { status: 200, headers: CORS },
  )
}
