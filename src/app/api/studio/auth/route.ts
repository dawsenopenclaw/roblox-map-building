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
import { getStudioAuthSecret } from '@/lib/studio-auth-secret'

const CODE_TTL_MS   = 5 * 60 * 1000   // 5 minutes
const CODE_TTL_SECS = 5 * 60           // Redis EX arg

// Rate limit: max 10 code generations per IP per hour
const RATE_LIMIT_MAX      = 10
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000  // 1 hour

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

// Shared secret resolution lives in `src/lib/studio-auth-secret.ts`.
// `sync` and `execute` import the same helper so all three routes
// always agree on the HMAC secret — previously each route had its own
// resolution logic and they could silently disagree in production.

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

// ── Rate limit store ──────────────────────────────────────────────────────────
// Tracks code generation counts per IP within a rolling window.
interface RateEntry { count: number; windowStart: number }
// @ts-expect-error
const rateLimitMap: Map<string, RateEntry> = (globalThis.__fjRateLimit ??= new Map())
// @ts-expect-error
globalThis.__fjRateLimit = rateLimitMap

/** Returns true when the caller is within the rate limit, false when they are over it. */
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now })
    return true
  }
  if (entry.count >= RATE_LIMIT_MAX) return false
  entry.count++
  return true
}

// ── Periodic cleanup of expired in-memory codes ───────────────────────────────
// Runs at most once every 60 s per Lambda instance to purge stale entries and
// prevent unbounded memory growth under heavy traffic.
// @ts-expect-error
const lastCleanup: { t: number } = (globalThis.__fjLastCleanup ??= { t: 0 })
// @ts-expect-error
globalThis.__fjLastCleanup = lastCleanup

function maybeCleanup(): void {
  const now = Date.now()
  if (now - lastCleanup.t < 60_000) return
  lastCleanup.t = now

  // Purge expired pending codes
  for (const [code, entry] of pendingCodes) {
    if (now > entry.expiresAt) pendingCodes.delete(code)
  }
  // Purge claimed codes older than CODE_TTL_MS (already seen by both sides)
  for (const [code, entry] of claimedCodes) {
    if (now - entry.claimedAt > CODE_TTL_MS) claimedCodes.delete(code)
  }
  // Purge stale rate-limit buckets
  for (const [ip, entry] of rateLimitMap) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) rateLimitMap.delete(ip)
  }
}

// ── Database helpers (replaces Redis for auth codes) ──────────────────────────
// Auth codes MUST be shared across all Vercel Lambda instances. Redis was used
// for this but the Upstash free tier (500K req/month) is exhausted, causing
// the code claim to fail silently when generate and claim hit different Lambdas.
//
// Fix: use the Postgres database (Neon) which is always available, free, and
// shared. No migration needed — we create the table on first use via raw SQL.
// Competitors (Rebirth, Lemonade, Metain) all use their database for this.

async function getDb() {
  try {
    const { db } = await import('@/lib/db')
    return db
  } catch {
    return null
  }
}

let _tableEnsured = false
async function ensureAuthCodeTable(): Promise<void> {
  if (_tableEnsured) return
  const prisma = await getDb()
  if (!prisma) return
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "StudioAuthCode" (
        "code" TEXT PRIMARY KEY,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "expiresAt" BIGINT NOT NULL,
        "claimedData" TEXT,
        "claimedAt" BIGINT,
        "createdAt" TIMESTAMP DEFAULT NOW()
      )
    `)
    // Clean up old codes (older than 10 min)
    await prisma.$executeRawUnsafe(`
      DELETE FROM "StudioAuthCode" WHERE "expiresAt" < ${Date.now() - 600000}
    `)
    _tableEnsured = true
  } catch {
    // Table might already exist or DB unavailable — fall through to memory
  }
}

async function dbSavePending(code: string, expiresAt: number): Promise<void> {
  await ensureAuthCodeTable()
  const prisma = await getDb()
  if (!prisma) return
  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "StudioAuthCode" ("code", "status", "expiresAt") VALUES ($1, 'pending', $2) ON CONFLICT ("code") DO UPDATE SET "status" = 'pending', "expiresAt" = $2`,
      code, expiresAt
    )
  } catch { /* ignore — memory fallback still works */ }
}

async function dbGetPending(code: string): Promise<PendingCode | null> {
  await ensureAuthCodeTable()
  const prisma = await getDb()
  if (!prisma) return null
  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ expiresAt: bigint }>>(
      `SELECT "expiresAt" FROM "StudioAuthCode" WHERE "code" = $1 AND "status" = 'pending'`,
      code
    )
    if (!rows || rows.length === 0) return null
    return { expiresAt: Number(rows[0].expiresAt) }
  } catch {
    return null
  }
}

async function dbDeletePending(code: string): Promise<void> {
  const prisma = await getDb()
  if (!prisma) return
  try {
    await prisma.$executeRawUnsafe(`DELETE FROM "StudioAuthCode" WHERE "code" = $1`, code)
  } catch { /* ignore */ }
}

async function dbSaveClaimed(code: string, data: ClaimedCode): Promise<void> {
  await ensureAuthCodeTable()
  const prisma = await getDb()
  if (!prisma) return
  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "StudioAuthCode" ("code", "status", "expiresAt", "claimedData", "claimedAt") VALUES ($1, 'claimed', $2, $3, $4) ON CONFLICT ("code") DO UPDATE SET "status" = 'claimed', "claimedData" = $3, "claimedAt" = $4`,
      code, Date.now() + CODE_TTL_MS, JSON.stringify(data), Date.now()
    )
  } catch { /* ignore */ }
}

async function dbGetClaimed(code: string): Promise<ClaimedCode | null> {
  await ensureAuthCodeTable()
  const prisma = await getDb()
  if (!prisma) return null
  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ claimedData: string }>>(
      `SELECT "claimedData" FROM "StudioAuthCode" WHERE "code" = $1 AND "status" = 'claimed'`,
      code
    )
    if (!rows || rows.length === 0) return null
    return JSON.parse(rows[0].claimedData) as ClaimedCode
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
  // Database fallback (works across ALL Lambda instances, no Redis needed)
  const fromDb = await dbGetPending(code)
  if (!fromDb) return null
  if (Date.now() > fromDb.expiresAt) return null
  pendingCodes.set(code, fromDb) // hydrate L1 cache
  return fromDb
}

async function markCodeClaimed(code: string, data: ClaimedCode): Promise<void> {
  claimedCodes.set(code, data)
  pendingCodes.delete(code) // no longer pending
  // Persist to database so other Lambdas can see the claim
  await dbSaveClaimed(code, data)
  await dbDeletePending(code)
}

async function getCodeClaim(code: string): Promise<ClaimedCode | null> {
  const mem = claimedCodes.get(code)
  if (mem) return mem
  // Database fallback
  const fromDb = await dbGetClaimed(code)
  if (!fromDb) return null
  claimedCodes.set(code, fromDb) // hydrate L1 cache
  return fromDb
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
    .createHmac('sha256', getStudioAuthSecret())
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
    maybeCleanup()

    // Rate limit by IP — max 10 generations per hour
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? req.headers.get('x-real-ip')
      ?? 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'rate_limited', message: 'Too many code requests. Try again in an hour.' },
        { status: 429, headers: { ...CORS, 'Retry-After': '3600' } },
      )
    }

    const code      = generateCode()
    const expiresAt = Date.now() + CODE_TTL_MS

    // Sign the code so the client can use it for claim verification
    const hmac = crypto.createHmac('sha256', getStudioAuthSecret()).update(`${code}:${expiresAt}`).digest('hex').slice(0, 16)
    const token = Buffer.from(`${code}:${expiresAt}:${hmac}`).toString('base64url')

    // Store in memory (same Lambda) and Redis (cross-Lambda)
    pendingCodes.set(code, { expiresAt })
    await dbSavePending(code, expiresAt)

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
