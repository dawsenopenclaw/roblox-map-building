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
import {
  queueCommand,
  listSessions,
  getSession,
  getSessionSync,
  createSession,
  type ChangeType,
  type PendingCommand,
} from '@/lib/studio-session'
import { parseBody } from '@/lib/validations'

// ── JWT verification (same logic as sync/route.ts) ────────────────────────────
// IMPORTANT: STUDIO_AUTH_SECRET must be set in production. The fallback is only
// for local dev. Never rely on CLERK_SECRET_KEY for HMAC — it is a Clerk API key,
// not a symmetric signing secret, and sharing it broadens the blast radius of
// any credential leak. Set STUDIO_AUTH_SECRET to an independent 32-byte random value.
const SECRET = process.env.STUDIO_AUTH_SECRET || process.env.CLERK_SECRET_KEY || 'forjegames-studio-default-secret'

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
      .createHmac('sha256', SECRET)
      .update(payloadB64)
      .digest('base64url')
    if (sig !== expectedSig) return null
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8')) as JwtPayload
    if (!payload.sid || !payload.pid) return null
    return payload
  } catch {
    return null
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

  if (!jwtPayload) {
    // No valid JWT — reject. We cannot trust the request.
    return NextResponse.json(
      { ok: false, error: 'missing_or_invalid_token' },
      { status: 401, headers: CORS_HEADERS },
    )
  }

  // JWT is valid — use the session ID it contains.
  // If the caller also passed an explicit sessionId it must match the JWT claim.
  const sessionId = jwtPayload.sid
  if (body.sessionId && body.sessionId !== sessionId) {
    return NextResponse.json(
      { ok: false, error: 'session_id_mismatch' },
      { status: 403, headers: CORS_HEADERS },
    )
  }

  // Ensure session exists in this Lambda's memory for queueCommand.
  // Must use the resolved sessionId so the plugin finds the same session.
  let session = getSessionSync(sessionId)
  if (!session) {
    // Recreate from JWT, pinning the correct sessionId so commands land in the
    // right queue when the plugin polls /sync on any Lambda invocation.
    session = createSession({
      sessionId:     sessionId,
      placeId:       jwtPayload?.pid ?? 'unknown',
      placeName:     jwtPayload?.pn ?? 'Studio',
      pluginVersion: jwtPayload?.pv ?? '4.0.0',
      authToken:     bearerToken ?? sessionId,
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
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: result.error === 'queue_full' ? 429 : 503, headers: CORS_HEADERS },
      )
    }

    // Re-read queue depth from the session after the push (session mutated in place)
    const queueDepth = getSessionSync(session.sessionId)?.commandQueue.length ?? 0
    return NextResponse.json(
      { ok: true, commandId: result.commandId, queueDepth },
      { status: 200, headers: CORS_HEADERS },
    )
  } catch (e) {
    console.error('[studio/execute] Queue error:', (e as Error).message)
    return NextResponse.json(
      { ok: false, error: 'queue_error', message: 'Failed to enqueue command' },
      { status: 503, headers: CORS_HEADERS },
    )
  }
}
