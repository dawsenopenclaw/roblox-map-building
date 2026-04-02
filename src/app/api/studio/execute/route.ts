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
const SECRET = process.env.CLERK_SECRET_KEY || process.env.STUDIO_AUTH_SECRET || 'forjegames-studio-default-secret'

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
    (b) => b.code !== undefined || b.payload !== undefined,
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

  let sessionId = body.sessionId ?? jwtPayload?.sid

  if (!sessionId) {
    // Fall back to the most recently active connected session (memory-only).
    const live = listSessions()
      .filter((s) => s.connected)
      .sort((a, b) => b.lastHeartbeat - a.lastHeartbeat)

    if (live.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'no_active_session' },
        { status: 404, headers: CORS_HEADERS },
      )
    }
    sessionId = live[0].sessionId
  }

  // If JWT is valid, trust it — no session lookup needed (works cross-Lambda)
  if (!sessionId && !jwtPayload) {
    return NextResponse.json(
      { ok: false, error: 'no_session_or_token' },
      { status: 404, headers: CORS_HEADERS },
    )
  }

  // Ensure session exists in this Lambda's memory for queueCommand
  let session = getSessionSync(sessionId)
  if (!session) {
    // Recreate from JWT or create a new one
    const sid = sessionId || crypto.randomBytes(8).toString('hex')
    session = createSession({
      placeId:       jwtPayload?.pid ?? 'unknown',
      placeName:     jwtPayload?.pn ?? 'Studio',
      pluginVersion: jwtPayload?.pv ?? '4.0.0',
      authToken:     bearerToken ?? sid,
    })
  }

  // ── Build the command ────────────────────────────────────────────────────

  const commandType: ChangeType = body.command ?? 'execute_luau'

  // Merge editor shorthand (code/prompt) into the payload.
  const commandData: Record<string, unknown> = { ...(body.payload ?? {}) }
  if (body.code    !== undefined) commandData.code   = body.code
  if (body.prompt  !== undefined) commandData.prompt = body.prompt

  // ── Enqueue ──────────────────────────────────────────────────────────────

  const result = await queueCommand(sessionId, { type: commandType, data: commandData })

  if (!result.ok) {
    const status = result.error === 'queue_full' ? 429 : 503
    return NextResponse.json(
      { ok: false, error: result.error },
      { status, headers: CORS_HEADERS },
    )
  }

  // Re-read queue depth for the response.
  const updated = await getSession(sessionId)
  const queueDepth = updated?.commandQueue.length ?? 0

  return NextResponse.json(
    { ok: true, commandId: result.commandId, queueDepth },
    { status: 200, headers: CORS_HEADERS },
  )
}
