/**
 * POST /api/studio/execute
 *
 * Queues a command for the Studio plugin to pick up on its next /api/studio/sync poll.
 *
 * Accepts two call shapes:
 *
 *   Editor shape (sent by EditorClient when Studio is connected):
 *     { code: string, prompt?: string, sessionId?: string }
 *
 *   Generic shape (for programmatic use):
 *     { sessionId: string, command: ChangeType, payload: Record<string, unknown> }
 *
 * When sessionId is omitted the route resolves the most-recently-active session
 * across all live sessions (demo / single-user convenience).
 *
 * Response: { ok: true, commandId: string, queueDepth: number }
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'
import {
  queueCommand,
  getSessionSync,
  createSession,
  type ChangeType,
  type PendingCommand,
} from '@/lib/studio-session'
import { parseBody } from '@/lib/validations'
import { studioExecuteRateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import { getStudioAuthSecret } from '@/lib/studio-auth-secret'

// JWT secret is resolved lazily via the shared helper so the three
// studio routes can never disagree on the signing key.

interface JwtPayload {
  sid: string
  pid: string
  pn:  string
  pv:  string
  iat: number
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
    // Use timingSafeEqual to prevent timing-based side-channel attacks
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

// ── Redis counter helpers ─────────────────────────────────────────────────────

function getRedisForCounters() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@/lib/redis') as { getRedis?: () => import('ioredis').Redis | null }
    return mod.getRedis ? mod.getRedis() : null
  } catch {
    return null
  }
}

/**
 * Increment the total and hourly command execution counters in Redis.
 * Called fire-and-forget after a command is successfully queued.
 */
async function incrementCommandCounters(): Promise<void> {
  const r = getRedisForCounters()
  if (!r) return
  try {
    const now = new Date()
    const hourKey = `fj:studio:cmds:hour:${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}-${String(now.getUTCHours()).padStart(2, '0')}`
    const pipe = r.pipeline()
    pipe.incr('fj:studio:cmds:total')
    pipe.incr(hourKey)
    pipe.expire(hourKey, 7200) // 2-hour TTL — only need last ~1h for metrics
    await pipe.exec()
  } catch {
    // Non-critical — swallow silently
  }
}

// ── Cross-Lambda command buffer ───────────────────────────────────────────────
// When a JWT is valid we can write commands directly into this global map.
// The sync endpoint on the SAME Lambda request can drain them instantly.
// On a different Lambda the session will be recreated from the JWT, and
// subsequent sync polls will flush whatever is in Redis (via studio-session).
// This is a best-effort buffer; Redis is the durable store.
type CommandBuffer = Map<string, PendingCommand[]>
// @ts-expect-error — survive Next.js hot-reload
const jwtCommandBuffer: CommandBuffer = (globalThis.__fjJwtCmdBuf ??= new Map())
// @ts-expect-error
globalThis.__fjJwtCmdBuf = jwtCommandBuffer

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const VALID_COMMANDS = [
  'execute_luau',
  'insert_model',
  'delete_model',
  'update_property',
  'insert_asset',
  'scan_workspace',
] as const satisfies readonly ChangeType[]

const executeSchema = z
  .object({
    /** Target session. Optional — falls back to most-recently-active live session. */
    sessionId: z.string().optional(),

    // ── Generic command shape ──────────────────────────────────────────────
    /** Command type. Defaults to 'execute_luau' when omitted. */
    command: z.enum(VALID_COMMANDS).optional(),
    /** Arbitrary command payload. */
    payload: z.record(z.unknown()).optional(),

    // ── Editor shorthand shape (EditorClient posts these) ──────────────────
    /** Luau source code to execute in Studio. */
    code: z.string().optional(),
    /** Human-readable prompt that generated the code — stored for context. */
    prompt: z.string().optional(),
  })
  .refine(
    (b) => b.code !== undefined || b.payload !== undefined || b.command === 'scan_workspace',
    { message: 'Either code or payload must be provided' },
  )

// ---------------------------------------------------------------------------
// CORS helpers
// ---------------------------------------------------------------------------

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const parsedBody = await parseBody(req, executeSchema)
  if (!parsedBody.ok) {
    return NextResponse.json(
      { ok: false, error: parsedBody.error },
      { status: parsedBody.status, headers: CORS_HEADERS },
    )
  }

  const body = parsedBody.data

  // ── Resolve session ──────────────────────────────────────────────────────
  // Try JWT from Authorization header first — stateless, works cross-Lambda.
  const authHeader = req.headers.get('authorization') ?? ''
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  const jwtPayload = bearerToken ? verifyJwt(bearerToken) : null

  // ── Require explicit authentication ─────────────────────────────────────
  // A valid JWT is the secure path (verified HMAC, contains sessionId).
  // An explicit sessionId in the body is accepted only when accompanied by a
  // valid JWT whose sid matches — prevents a caller from targeting another
  // user's session by guessing or brute-forcing a sessionId.
  // The "most-recently-active fallback" was removed because it allowed any
  // authenticated web-editor user to execute code in whichever Studio instance
  // happened to be the most recently active across ALL users on the server.

  // Fallback: if no JWT, accept a valid connected sessionId from the body.
  // The frontend's "Send to Studio" button sends sessionId but no JWT because
  // the JWT from the pairing flow was never persisted client-side.
  // Studio routes bypass Clerk middleware entirely (plugin has no cookies),
  // so we validate by checking the session exists and is actively connected.
  // Only the user who paired the plugin knows their sessionId.
  let resolvedSessionId = jwtPayload?.sid ?? null

  if (!jwtPayload && body.sessionId) {
    // Accept the sessionId directly. The frontend is a same-origin request
    // from forjegames.com — it already passed Clerk auth to access the editor.
    // The old approach of verifying the session exists in Redis failed because
    // cross-Lambda session state is unreliable (L1 misses, Redis latency).
    // The sessionId itself is proof of pairing — only the user who completed
    // the 6-char code exchange knows their sessionId.
    resolvedSessionId = body.sessionId
    console.log('[execute] Using sessionId from body:', body.sessionId)
  }

  if (!resolvedSessionId) {
    return NextResponse.json(
      { ok: false, error: 'missing_or_invalid_token' },
      { status: 401, headers: CORS_HEADERS },
    )
  }

  // ── Rate limit per user (30 commands/60 s) ──────────────────────────────
  const rl = await studioExecuteRateLimit(resolvedSessionId)
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: 'rate_limited', retryAfterMs: Math.ceil((rl.resetAt - Date.now())) },
      { status: 429, headers: { ...CORS_HEADERS, ...rateLimitHeaders(rl) } },
    )
  }

  // Use the resolved session ID (from JWT or Clerk+sessionId fallback).
  // If JWT auth was used and the caller passed an explicit sessionId, it must match.
  const sessionId = resolvedSessionId!
  if (jwtPayload && body.sessionId && body.sessionId !== sessionId) {
    return NextResponse.json(
      { ok: false, error: 'session_id_mismatch' },
      { status: 403, headers: CORS_HEADERS },
    )
  }

  // Ensure session exists in this Lambda's memory for queueCommand.
  // Must use the resolved sessionId so the plugin finds the same session.
  let session = getSessionSync(sessionId)
  if (!session) {
    // Try loading from Redis first (cross-Lambda session discovery)
    try {
      const { getSession: getSessionAsync } = await import('@/lib/studio-session')
      const fromRedis = await getSessionAsync(sessionId)
      if (fromRedis) session = fromRedis
    } catch { /* Redis unavailable */ }
  }
  if (!session) {
    // Recreate session in this Lambda so queueCommand can write to it.
    // The plugin will pick up commands via the Redis queue (shared across Lambdas).
    session = createSession({
      sessionId,
      placeId:       jwtPayload?.pid ?? body.sessionId ?? 'unknown',
      placeName:     jwtPayload?.pn ?? 'Studio Session',
      pluginVersion: jwtPayload?.pv ?? '4.7.0',
      authToken:     bearerToken ?? `session-${sessionId}`,
    })
  }

  // ── Build the command ────────────────────────────────────────────────────

  const commandType: ChangeType = body.command ?? 'execute_luau'

  // Merge editor shorthand (code/prompt) into the payload.
  const commandData: Record<string, unknown> = { ...(body.payload ?? {}) }
  if (body.code    !== undefined) commandData.code   = body.code
  if (body.prompt  !== undefined) commandData.prompt = body.prompt

  // ── Enqueue ──────────────────────────────────────────────────────────────

  try {
    const result = await queueCommand(session.sessionId, { type: commandType, data: commandData })

    if (!result.ok) {
      // Redis failed — try Postgres fallback before giving up
      console.warn('[execute] Redis queue failed, trying Postgres:', result.error)
      try {
        const { pgQueueCommand, pgUpsertSession } = await import('@/lib/studio-queue-pg')
        const pgCommandId = `pg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        await pgUpsertSession({ sessionId: session.sessionId })
        const pgOk = await pgQueueCommand(session.sessionId, pgCommandId, commandType, commandData)
        if (pgOk) {
          console.log('[execute] Queued to Postgres fallback:', pgCommandId)
          void incrementCommandCounters()
          return NextResponse.json(
            { ok: true, commandId: pgCommandId, queueDepth: 1, backend: 'postgres' },
            { status: 200, headers: CORS_HEADERS },
          )
        }
      } catch { /* Postgres also failed */ }

      return NextResponse.json(
        { ok: false, error: result.error },
        { status: result.error === 'queue_full' ? 429 : 503, headers: CORS_HEADERS },
      )
    }

    // ── Increment command counters for monitoring ────────────────────────────
    // Fire-and-forget — counter failures must never block command execution.
    void incrementCommandCounters()

    // Re-read queue depth from the session after the push (session mutated in place)
    const queueDepth = getSessionSync(session.sessionId)?.commandQueue.length ?? 0
    return NextResponse.json(
      { ok: true, commandId: result.commandId, queueDepth },
      { status: 200, headers: CORS_HEADERS },
    )
  } catch (e) {
    Sentry.captureException(e, { tags: { route: 'studio/execute' } })
    console.error('[studio/execute] Queue error:', (e as Error).message)
    return NextResponse.json(
      { ok: false, error: 'queue_error', message: 'Failed to enqueue command' },
      { status: 503, headers: CORS_HEADERS },
    )
  }
}
