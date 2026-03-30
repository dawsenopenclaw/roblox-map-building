/**
 * GET  /api/studio/auth?action=generate
 *   — Generate a 6-char connection code (5 min TTL).
 *     Called by the forjegames.com/settings/studio page so the user can
 *     see a fresh code to type into the Roblox Studio plugin.
 *
 * GET  /api/studio/auth?action=status&code=XXXXXX
 *   — Poll whether a code has been claimed by the plugin.
 *     The settings page polls this to show "Connected!" once the plugin claims.
 *
 * POST /api/studio/auth  { code }
 *   — Plugin claims a code, exchanges it for { token, sessionId, expiresAt }.
 *     The plugin stores token + sessionId in plugin:SetSetting.
 *     All subsequent plugin requests send `Authorization: Bearer <token>`.
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createSession } from '@/lib/studio-session'
import { studioAuthClaimSchema, parseBody } from '@/lib/validations'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PendingCode {
  code: string
  createdAt: number
  claimed: boolean
  claimedAt: number | null
  /** The bearer token the plugin should use after claiming */
  token: string | null
  /** The session ID created at claim time */
  sessionId: string | null
}

// ---------------------------------------------------------------------------
// In-memory store (survives hot-reloads in dev via module cache)
// ---------------------------------------------------------------------------

const CODE_TTL_MS = 5 * 60 * 1000  // 5 minutes
// Unambiguous chars — no 0/O, 1/I confusion
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

// @ts-expect-error — attach to global to survive Next.js hot-reload in dev
const store: Map<string, PendingCode> = (globalThis.__fjStudioAuthCodes ??= new Map())
// @ts-expect-error
globalThis.__fjStudioAuthCodes = store

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
// CORS — plugin calls come from Roblox Studio's HttpService (not a browser)
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
// GET — generate a fresh code, or poll whether a code was claimed
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  pruneExpired()
  const { searchParams } = req.nextUrl
  const action = searchParams.get('action') ?? 'generate'

  // ── Generate ──────────────────────────────────────────────────────────────
  if (action === 'generate') {
    const code = generateCode()
    store.set(code, {
      code,
      createdAt: Date.now(),
      claimed: false,
      claimedAt: null,
      token: null,
      sessionId: null,
    })

    return NextResponse.json(
      {
        code,
        expiresInSeconds: CODE_TTL_MS / 1000,
        expiresAt: Date.now() + CODE_TTL_MS,
      },
      { status: 200, headers: CORS },
    )
  }

  // ── Status poll ───────────────────────────────────────────────────────────
  if (action === 'status') {
    const code = (searchParams.get('code') ?? '').toUpperCase().replace(/\s/g, '')
    if (!code) {
      return NextResponse.json(
        { error: 'code param is required' },
        { status: 400, headers: CORS },
      )
    }

    const entry = store.get(code)
    if (!entry) {
      return NextResponse.json(
        { status: 'expired', claimed: false },
        { status: 200, headers: CORS },
      )
    }

    const expiresAt = entry.createdAt + CODE_TTL_MS
    return NextResponse.json(
      {
        status: entry.claimed ? 'connected' : 'pending',
        claimed: entry.claimed,
        sessionId: entry.sessionId,
        expiresAt,
        remainingSeconds: Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)),
      },
      { status: 200, headers: CORS },
    )
  }

  return NextResponse.json(
    { error: 'unknown action — use ?action=generate or ?action=status&code=XXXXXX' },
    { status: 400, headers: CORS },
  )
}

// ---------------------------------------------------------------------------
// POST — plugin claims a code
// Plugin sends: { code: string, placeId?: string, pluginVer?: string }
// Plugin expects back: { token, sessionId, expiresAt }
// ---------------------------------------------------------------------------

interface ClaimBody {
  code: string
  placeId?: string | number
  placeName?: string
  pluginVer?: string
}

export async function POST(req: NextRequest) {
  pruneExpired()

  const parsedBody = await parseBody(req, studioAuthClaimSchema)
  if (!parsedBody.ok) {
    return NextResponse.json({ error: parsedBody.error }, { status: parsedBody.status, headers: CORS })
  }
  const body = parsedBody.data

  const code = (body.code ?? '').toUpperCase().replace(/\s/g, '')
  if (code.length < 6) {
    return NextResponse.json(
      { error: 'code is required (6 characters)' },
      { status: 400, headers: CORS },
    )
  }

  const entry = store.get(code)
  if (!entry) {
    return NextResponse.json(
      { error: 'code_expired_or_invalid' },
      { status: 400, headers: CORS },
    )
  }
  if (entry.claimed) {
    return NextResponse.json(
      { error: 'code_already_claimed' },
      { status: 409, headers: CORS },
    )
  }

  // Generate a long-lived bearer token for this plugin session
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days

  // Create a studio session immediately so the plugin can start polling
  const session = createSession({
    placeId: body.placeId ? String(body.placeId) : 'unknown',
    placeName: body.placeName ?? 'Unknown Place',
    pluginVersion: body.pluginVer ?? '1.0.0',
    authToken: token,
  })

  // Mark the code as claimed
  entry.claimed = true
  entry.claimedAt = Date.now()
  entry.token = token
  entry.sessionId = session.sessionId
  store.set(code, entry)

  return NextResponse.json(
    {
      /** Bearer token — plugin stores in plugin:SetSetting("fj_auth_token") */
      token,
      /** Session ID — plugin stores in plugin:SetSetting("fj_session_id") */
      sessionId: session.sessionId,
      /** Unix ms when the token expires (informational) */
      expiresAt,
    },
    { status: 200, headers: CORS },
  )
}
