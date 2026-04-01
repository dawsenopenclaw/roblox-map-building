/**
 * POST /api/studio/push-asset
 *
 * Queues an "insert_asset" command for the active Studio plugin session.
 * The plugin drains this command on its next sync poll and calls
 * InsertService:LoadAsset(robloxAssetId) to place the mesh in workspace.
 *
 * Request body:
 * {
 *   sessionId:     string               — target session
 *   assetId:       string               — internal ForjeGames asset ID (for tracking)
 *   robloxAssetId: string               — numeric Roblox asset ID (e.g. "123456789")
 *   name?:         string               — display name for the inserted instance
 *   position?:     { x: number, y: number, z: number }
 * }
 *
 * Response:
 * {
 *   ok:        boolean
 *   commandId: string   — ID of the queued command (for status tracking)
 * }
 *
 * Errors:
 *   400 — validation failure
 *   404 — session not found
 *   409 — session disconnected
 *   429 — command queue full
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession, getSessionByToken, queueCommand } from '@/lib/studio-session'

// ---------------------------------------------------------------------------
// CORS — editor calls this from the browser
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
// Validation
// ---------------------------------------------------------------------------

const pushAssetSchema = z.object({
  /** The session to target.  Either sessionId OR token must be supplied. */
  sessionId: z.string().optional(),
  /** Bearer token — alternative to sessionId for callers that store the token */
  token: z.string().optional(),
  /** Internal asset ID (UUID from the mesh pipeline) */
  assetId: z.string().min(1, 'assetId is required'),
  /**
   * The Roblox-side asset ID that InsertService:LoadAsset() accepts.
   * This is the numeric ID Roblox assigns when the mesh is uploaded via Open Cloud.
   */
  robloxAssetId: z.string().min(1, 'robloxAssetId is required'),
  /** Human-readable name for the inserted instance */
  name: z.string().max(128).optional(),
  /** World-space position to place the asset (Y is up in Roblox) */
  position: z
    .object({
      x: z.number(),
      y: z.number(),
      z: z.number(),
    })
    .optional(),
})

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  // ── Parse body ────────────────────────────────────────────────────────────
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: 'invalid_json' },
      { status: 400, headers: CORS_HEADERS },
    )
  }

  const parsed = pushAssetSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? 'validation_error' },
      { status: 400, headers: CORS_HEADERS },
    )
  }

  const body = parsed.data

  // ── Resolve session ───────────────────────────────────────────────────────
  let session = body.sessionId ? getSession(body.sessionId) : undefined

  if (!session && body.token) {
    session = getSessionByToken(body.token)
  }

  if (!session) {
    return NextResponse.json(
      { ok: false, error: 'session_not_found' },
      { status: 404, headers: CORS_HEADERS },
    )
  }

  // ── Queue the command ─────────────────────────────────────────────────────
  const result = queueCommand(session.sessionId, {
    type: 'insert_asset',
    data: {
      assetId:       body.assetId,
      robloxAssetId: body.robloxAssetId,
      name:          body.name ?? null,
      position:      body.position ?? null,
    },
  })

  if (!result.ok) {
    const status = result.error === 'queue_full' ? 429
                 : result.error === 'session_disconnected' ? 409
                 : 404

    return NextResponse.json(
      { ok: false, error: result.error },
      { status, headers: CORS_HEADERS },
    )
  }

  return NextResponse.json(
    {
      ok: true,
      commandId: result.commandId,
      sessionId: session.sessionId,
      message: `insert_asset queued for session ${session.sessionId}`,
    },
    { status: 200, headers: CORS_HEADERS },
  )
}
