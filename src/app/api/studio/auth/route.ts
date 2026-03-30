/**
 * GET  /api/studio/auth?action=generate   — generate a 6-char connection code (5 min TTL)
 * GET  /api/studio/auth?action=status&code=XXXXXX — poll whether code was claimed
 * POST /api/studio/auth                   — plugin claims a code, exchanging it for a session token
 *
 * Codes live in an in-memory map. This is intentionally simple — the code is
 * short-lived and only used to bootstrap a plugin session, not to authenticate
 * sensitive operations.
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PendingCode {
  code: string
  userId: string | null
  createdAt: number
  claimed: boolean
  claimedAt: number | null
  sessionToken: string | null
}

// ---------------------------------------------------------------------------
// In-memory store (survives hot-reloads in dev via module cache)
// ---------------------------------------------------------------------------

const CODE_TTL_MS = 5 * 60 * 1000 // 5 minutes
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no confusable chars (0/O, 1/I)

// @ts-expect-error — attach to global to survive Next.js hot-reload in dev
const store: Map<string, PendingCode> = (globalThis.__studioAuthCodes ??= new Map())
// @ts-expect-error
globalThis.__studioAuthCodes = store

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateCode(): string {
  let code = ''
  const bytes = crypto.randomBytes(6)
  for (const byte of bytes) {
    code += CHARS[byte % CHARS.length]
  }
  return code
}

function pruneExpired() {
  const cutoff = Date.now() - CODE_TTL_MS
  for (const [key, entry] of store.entries()) {
    if (entry.createdAt < cutoff) store.delete(key)
  }
}

// ---------------------------------------------------------------------------
// CORS headers (plugin calls from Roblox Studio's HttpService)
// ---------------------------------------------------------------------------

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

// ---------------------------------------------------------------------------
// GET — generate code OR poll status
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  pruneExpired()
  const { searchParams } = req.nextUrl
  const action = searchParams.get('action') ?? 'generate'

  // ── Generate ──────────────────────────────────────────────────────────────
  if (action === 'generate') {
    const code = generateCode()
    const entry: PendingCode = {
      code,
      userId: null, // would be auth'd user id in production
      createdAt: Date.now(),
      claimed: false,
      claimedAt: null,
      sessionToken: null,
    }
    store.set(code, entry)

    return NextResponse.json(
      { code, expiresInSeconds: CODE_TTL_MS / 1000 },
      { status: 200, headers: CORS },
    )
  }

  // ── Status poll ───────────────────────────────────────────────────────────
  if (action === 'status') {
    const code = (searchParams.get('code') ?? '').toUpperCase()
    if (!code) {
      return NextResponse.json({ error: 'code param required' }, { status: 400, headers: CORS })
    }

    const entry = store.get(code)
    if (!entry) {
      return NextResponse.json(
        { status: 'expired', claimed: false },
        { status: 200, headers: CORS },
      )
    }

    const expiredAt = entry.createdAt + CODE_TTL_MS
    return NextResponse.json(
      {
        status: entry.claimed ? 'connected' : 'pending',
        claimed: entry.claimed,
        sessionToken: entry.sessionToken,
        expiresAt: expiredAt,
        remainingSeconds: Math.max(0, Math.floor((expiredAt - Date.now()) / 1000)),
      },
      { status: 200, headers: CORS },
    )
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400, headers: CORS })
}

// ---------------------------------------------------------------------------
// POST — plugin claims a code
// ---------------------------------------------------------------------------

interface ClaimBody {
  code: string
  placeId?: string | number
  placeName?: string
  pluginVersion?: string
}

export async function POST(req: NextRequest) {
  pruneExpired()

  let body: ClaimBody
  try {
    body = await req.json() as ClaimBody
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400, headers: CORS })
  }

  const code = (body.code ?? '').toUpperCase()
  if (!code) {
    return NextResponse.json({ error: 'code is required' }, { status: 400, headers: CORS })
  }

  const entry = store.get(code)
  if (!entry) {
    return NextResponse.json({ error: 'code_expired_or_invalid' }, { status: 404, headers: CORS })
  }
  if (entry.claimed) {
    return NextResponse.json({ error: 'code_already_claimed' }, { status: 409, headers: CORS })
  }

  // Mark the code as claimed and generate a session token
  const sessionToken = crypto.randomBytes(32).toString('hex')
  entry.claimed = true
  entry.claimedAt = Date.now()
  entry.sessionToken = sessionToken
  store.set(code, entry)

  return NextResponse.json(
    {
      sessionToken,
      placeId: body.placeId ?? null,
      placeName: body.placeName ?? null,
      pluginVersion: body.pluginVersion ?? null,
    },
    { status: 200, headers: CORS },
  )
}
