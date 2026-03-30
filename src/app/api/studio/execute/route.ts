/**
 * POST /api/studio/execute
 *
 * Queues a command for the Studio plugin to execute.
 * Commands are stored on the session's commandQueue and drained by the plugin
 * when it polls GET /api/studio/sync.
 *
 * Body:
 * {
 *   sessionId: string,
 *   command: 'execute_luau' | 'insert_model' | 'delete_model' | 'update_property' | 'insert_asset',
 *   data: Record<string, unknown>,   // command-specific payload
 *   // Legacy fields (kept for backwards compat with old callers)
 *   assetId?: number,
 *   assetName?: string,
 *   parameters?: Record<string, unknown>,
 * }
 *
 * Response: { queued: true, commandId: string } | { error: string }
 *
 * GET /api/studio/execute  (legacy — kept for callers that pre-date sessions)
 * Returns all items across every session's queue (admin/debug only).
 */

import { NextRequest, NextResponse } from 'next/server'
import { queueCommand, listSessions } from '@/lib/studio-session'
import type { ChangeType } from '@/lib/studio-session'

const VALID_COMMAND_TYPES: ChangeType[] = [
  'execute_luau',
  'insert_model',
  'delete_model',
  'update_property',
  'insert_asset',
]

interface ExecuteBody {
  sessionId: string
  command: ChangeType
  data?: Record<string, unknown>
  // Legacy fields
  assetId?: number
  assetName?: string
  parameters?: Record<string, unknown>
}

export async function POST(req: NextRequest) {
  let body: ExecuteBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.sessionId) {
    return NextResponse.json(
      { error: 'sessionId is required' },
      { status: 400 },
    )
  }

  if (!body.command) {
    return NextResponse.json({ error: 'command is required' }, { status: 400 })
  }

  const commandType = body.command as ChangeType
  if (!VALID_COMMAND_TYPES.includes(commandType)) {
    return NextResponse.json(
      {
        error: `Invalid command type. Must be one of: ${VALID_COMMAND_TYPES.join(', ')}`,
      },
      { status: 400 },
    )
  }

  // Merge legacy fields into data payload
  const data: Record<string, unknown> = {
    ...(body.data ?? {}),
    ...(body.parameters ?? {}),
  }
  if (body.assetId !== undefined) data.assetId = body.assetId
  if (body.assetName !== undefined) data.assetName = body.assetName

  const result = queueCommand(body.sessionId, { type: commandType, data })

  if (!result.ok) {
    const statusMap: Record<string, number> = {
      session_not_found: 404,
      session_disconnected: 503,
      queue_full: 429,
    }
    return NextResponse.json(
      {
        error: result.error,
        message:
          result.error === 'queue_full'
            ? 'Command queue is full (50 pending). Wait for the plugin to drain the queue.'
            : result.error === 'session_disconnected'
              ? 'Studio plugin is not connected. Open Roblox Studio and activate the ForjeGames plugin.'
              : 'Session not found. Re-connect the Studio plugin.',
      },
      { status: statusMap[result.error ?? ''] ?? 500 },
    )
  }

  return NextResponse.json({
    queued: true,
    commandId: result.commandId,
    message: `Command "${commandType}" queued for Studio. Plugin will execute it on next poll.`,
  })
}

export async function GET(_req: NextRequest) {
  // Legacy + admin: summarise all active sessions and their queue depth
  const sessions = listSessions()
  return NextResponse.json({
    sessions,
    totalQueued: sessions.reduce((acc, s) => acc + s.queueDepth, 0),
  })
}
