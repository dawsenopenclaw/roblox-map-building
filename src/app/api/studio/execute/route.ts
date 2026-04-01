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
import { z } from 'zod'
import {
  queueCommand,
  listSessions,
  getSession,
  type ChangeType,
} from '@/lib/studio-session'
import { parseBody } from '@/lib/validations'

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
// CORS helpers (browser editor calls this from the same origin, but allow
// cross-origin for future use from the Roblox Studio plugin UI).
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

  let sessionId = body.sessionId

  if (!sessionId) {
    // Fall back to the most recently active connected session.
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

  // Verify the session exists and is connected.
  const session = getSession(sessionId)
  if (!session) {
    return NextResponse.json(
      { ok: false, error: 'session_not_found' },
      { status: 404, headers: CORS_HEADERS },
    )
  }
  if (!session.connected) {
    return NextResponse.json(
      { ok: false, error: 'session_disconnected' },
      { status: 409, headers: CORS_HEADERS },
    )
  }

  // ── Build the command ────────────────────────────────────────────────────

  const commandType: ChangeType = body.command ?? 'execute_luau'

  // Merge editor shorthand (code/prompt) into the payload.
  const commandData: Record<string, unknown> = { ...(body.payload ?? {}) }
  if (body.code !== undefined) commandData.code = body.code
  if (body.prompt !== undefined) commandData.prompt = body.prompt

  // ── Enqueue ──────────────────────────────────────────────────────────────

  const result = queueCommand(sessionId, { type: commandType, data: commandData })

  if (!result.ok) {
    const status = result.error === 'queue_full' ? 429 : 503
    return NextResponse.json(
      { ok: false, error: result.error },
      { status, headers: CORS_HEADERS },
    )
  }

  // Re-read queue depth for the response.
  const updated = getSession(sessionId)
  const queueDepth = updated?.commandQueue.length ?? 0

  return NextResponse.json(
    { ok: true, commandId: result.commandId, queueDepth },
    { status: 200, headers: CORS_HEADERS },
  )
}
