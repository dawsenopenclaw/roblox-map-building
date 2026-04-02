/**
 * Studio Auth — code-based handshake that works on Vercel serverless.
 *
 * Flow:
 *   1. GET ?action=generate   → { code, expiresAt }
 *      Server stores the pending code in globalThis + Redis (TTL 5 min).
 *   2. Plugin POSTs { code, placeId, placeName, pluginVer }
 *      Server validates code from globalThis/Redis, creates session, returns { token, sessionId }.
 *   3. GET ?action=status&code=X
 *      Frontend polls until claimed=true, then transitions to "connected".
 *
 * Why not signed tokens (the previous approach):
 *   The plugin receives the code from the user manually — it never sees the
 *   signed token that the frontend holds. Token-only validation therefore
 *   always returns `signed_token_required` and the connection never works.
 *
 * Cross-Lambda state (Vercel serverless):
 *   Pending codes  → globalThis Map + Redis (write on generate, read on claim)
 *   Claimed codes  → globalThis Map + Redis (write on claim, read on status poll)
 *   Sessions       → handled by studio-session.ts (same dual-store pattern)
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const CODE_TTL_MS   = 5 * 60 * 1000   // 5 minutes
const CODE_TTL_SECS = 5 * 60           // Redis EX arg

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

// ── Shared secret ────────────────────────────────────────────────────────────
// STUDIO_AUTH_SECRET MUST be set in Vercel environment variables.
// If it is missing each Lambda cold-start gets a different secret, so session
// JWTs issued by one Lambda are rejected by every other Lambda.
const SECRET: string = (() => {
  const s = process.env.STUDIO_AUTH_SECRET ?? process.env.CLERK_SECRET_KEY
  if (!s) {
    const fallback = crypto.randomBytes(32).toString('hex')
    console.warn(
      '[studio/auth] WARNING: STUDIO_AUTH_SECRET is not set. ' +
      'Using a per-process random secret — tokens from other Lambda instances ' +
      'will be rejected. Set STUDIO_AUTH_SECRET in Vercel environment variables.',
    )
    return fallback
  }
  return s
})()

// ── Pending code store ────────────────────────────────────────────────────────
// Survives Next.js hot-reloads via globalThis. Shared across invocations on
// the same Lambda instance; Redis bridges across instances.
interface PendingCode {
  expiresAt: number
}

// @ts-expect-error — globalThis attachment for hot-reload survival
const pendingCodes: Map<string, PendingCode> = (globalThis.__fjPendingCodes ??= new Map())
// @ts-expect-error
globalThis.__fjPendingCodes = pendingCodes

// ── Claimed code store ────────────────────────────────────────────────────────
interface ClaimedCode {
  sessionId:  string
  placeName:  string
  placeId:    string
  claimedAt:  number
  jwt?:       string
}

// @ts-expect-error
const claimedCodes: Map<string, ClaimedCode> = (globalThis.__fjClaimedCodes ??= new Map())
// @ts-expect-error
globalThis.__fjClaimedCodes = claimedCodes

// ── Redis helpers ─────────────────────────────────────────────────────────────

function getRedisInstance() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@/lib/redis') as { getRedis?: () => import('ioredis').Redis | null }
    return mod.getRedis ? mod.getRedis() : null
  } catch {
    return null
  }
}

async function redisSavePending(code: string, expiresAt: number): Promise<void> {
  const r = getRedisInstance()
  if (!r) return
  try {
    await r.set(`fj:studio:pending:${code}`, String(expiresAt), 'EX', CODE_TTL_SECS)
  } catch { /* ignore */ }
}

async function redisGetPending(code: string): Promise<PendingCode | null> {
  const r = getRedisInstance()
  if (!r) return null
  try {
    const raw = await r.get(`fj:studio:pending:${code}`)
    if (!raw) return null
    return { expiresAt: parseInt(raw, 10) }
  } catch {
    return null
  }
}

async function redisDeletePending(code: string): Promise<void> {
  const r = getRedisInstance()
  if (!r) return
  try { await r.del(`fj:studio:pending:${code}`) } catch { /* ignore */ }
}

async function redisSaveClaimed(code: string, data: ClaimedCode): Promise<void> {
  const r = getRedisInstance()
  if (!r) return
  try {
    await r.set(`fj:studio:claimed:${code}`, JSON.stringify(data), 'EX', CODE_TTL_SECS)
  } catch { /* ignore */ }
}

async function redisGetClaimed(code: string): Promise<ClaimedCode | null> {
  const r = getRedisInstance()
  if (!r) return null
  try {
    const raw = await r.get(`fj:studio:claimed:${code}`)
    if (!raw) return null
    return JSON.parse(raw) as ClaimedCode
  } catch {
    return null
  }
}

// ── Higher-level accessors ────────────────────────────────────────────────────

async function getPendingCode(code: string): Promise<PendingCode | null> {
  // Memory first (same Lambda instance)
  const mem = pendingCodes.get(code)
  if (mem) {
    if (Date.now() > mem.expiresAt) { pendingCodes.delete(code); return null }
    return mem
  }
  // Redis fallback (different Lambda instance)
  const fromRedis = await redisGetPending(code)
  if (!fromRedis) return null
  if (Date.now() > fromRedis.expiresAt) return null
  pendingCodes.set(code, fromRedis) // hydrate
  return fromRedis
}

async function markCodeClaimed(code: string, data: ClaimedCode): Promise<void> {
  claimedCodes.set(code, data)
  pendingCodes.delete(code) // no longer pending
  // Persist so other Lambdas can see the claim
  await redisSaveClaimed(code, data)
  await redisDeletePending(code)
}

async function getCodeClaim(code: string): Promise<ClaimedCode | null> {
  const mem = claimedCodes.get(code)
  if (mem) return mem
  const fromRedis = await redisGetClaimed(code)
  if (!fromRedis) return null
  claimedCodes.set(code, fromRedis) // hydrate
  return fromRedis
}

// ── Misc helpers ──────────────────────────────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin':  '*',
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

/** Build a self-contained signed session JWT. Every Lambda can verify independently. */
function buildSessionJwt(opts: {
  sessionId:    string
  placeId:      string
  placeName:    string
  pluginVer:    string
}): string {
  const payloadObj = {
    sid: opts.sessionId,
    pid: opts.placeId,
    pn:  opts.placeName,
    pv:  opts.pluginVer,
    iat: Date.now(),
  }
  const payloadB64 = Buffer.from(JSON.stringify(payloadObj)).toString('base64url')
  const sig = crypto
    .createHmac('sha256', SECRET)
    .update(payloadB64)
    .digest('base64url')
  return `${payloadB64}.${sig}`
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const action = searchParams.get('action') ?? 'generate'

  // ── generate ─────────────────────────────────────────────────────────────
  if (action === 'generate') {
    const code      = generateCode()
    const expiresAt = Date.now() + CODE_TTL_MS

    // Sign the code so the client can use it for claim verification
    const hmac = crypto.createHmac('sha256', SECRET).update(`${code}:${expiresAt}`).digest('hex').slice(0, 16)
    const token = Buffer.from(`${code}:${expiresAt}:${hmac}`).toString('base64url')

    // Store in memory (same Lambda) and Redis (cross-Lambda)
    pendingCodes.set(code, { expiresAt })
    await redisSavePending(code, expiresAt)

    return NextResponse.json(
      { code, token, expiresInSeconds: CODE_TTL_MS / 1000, expiresAt },
      { status: 200, headers: CORS },
    )
  }

  // ── status ────────────────────────────────────────────────────────────────
  if (action === 'status') {
    const code = (searchParams.get('code') ?? '').toUpperCase().replace(/\s/g, '')
    if (!code) {
      return NextResponse.json(
        { error: 'code param required' },
        { status: 400, headers: CORS },
      )
    }

    const claim = await getCodeClaim(code)
    if (claim) {
      return NextResponse.json(
        {
          status:    'connected',
          claimed:   true,
          code,
          sessionId: claim.sessionId,
          placeName: claim.placeName,
          placeId:   claim.placeId,
          jwt:       claim.jwt ?? null,
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

// ── POST — plugin claims a code ───────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json() as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400, headers: CORS })
  }

  const code      = String(body.code ?? '').toUpperCase().replace(/\s/g, '')
  const placeId   = String(body.placeId   ?? 'unknown')
  const placeName = String(body.placeName ?? 'Unknown Place')
  const pluginVer = String(body.pluginVer  ?? body.pluginVersion ?? '1.0.0')

  // ── Validate code ─────────────────────────────────────────────────────────
  if (!code || code.length < 4) {
    return NextResponse.json(
      { error: 'code_required', message: 'A connection code is required.' },
      { status: 400, headers: CORS },
    )
  }

  // Look up pending code — checks memory then Redis
  const pending = await getPendingCode(code)
  if (!pending) {
    // Check if it was already claimed (double-submit from plugin)
    const alreadyClaimed = await getCodeClaim(code)
    if (alreadyClaimed) {
      // Idempotent: return the existing session info so the plugin can reconnect
      return NextResponse.json(
        {
          token:     alreadyClaimed.jwt ?? '',
          sessionId: alreadyClaimed.sessionId,
          message:   'already_claimed',
        },
        { status: 200, headers: CORS },
      )
    }
    return NextResponse.json(
      { error: 'code_expired_or_invalid', message: 'Code not found or expired. Generate a new one at forjegames.com/editor.' },
      { status: 400, headers: CORS },
    )
  }

  // ── Build session ─────────────────────────────────────────────────────────
  const sessionId = crypto.randomBytes(8).toString('hex')
  const jwtToken  = buildSessionJwt({ sessionId, placeId, placeName, pluginVer })

  // Hydrate this Lambda's in-memory session store so sync/status requests on
  // the SAME Lambda work immediately (no Redis round-trip).
  try {
    const { createSession } = await import('@/lib/studio-session')
    createSession({ sessionId, placeId, placeName, pluginVersion: pluginVer, authToken: jwtToken })
  } catch (e) {
    console.warn('[studio/auth] Session store unavailable:', (e as Error).message)
  }

  // Mark code as claimed (memory + Redis) — status poll on ANY Lambda can now detect it
  await markCodeClaimed(code, { sessionId, placeName, placeId, claimedAt: Date.now(), jwt: jwtToken })

  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days

  return NextResponse.json(
    { token: jwtToken, sessionId, expiresAt },
    { status: 200, headers: CORS },
  )
}
