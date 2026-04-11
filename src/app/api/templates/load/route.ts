/**
 * /api/templates/load
 *
 * GET  /api/templates/load?id=tycoon
 *   Returns the full GameTemplate (commands + scripts + metadata) without
 *   queueing anything. Used by the marketplace gallery's "Preview" button.
 *
 * POST /api/templates/load
 *   Body: { id: string, sessionId: string }
 *   Queues the template's structured commands + server scripts to the user's
 *   plugin session so the next /api/studio/sync poll picks them up and
 *   installs the template into the live place.
 *
 *   Auth:  Clerk — 401 if the user is not signed in.
 *   Cost:  100 credits. Templates are pre-authored so this is intentionally
 *          cheap compared to a from-scratch AI build.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { loadTemplate, TEMPLATE_LOAD_COST_CREDITS } from '@/lib/game-templates'
import { queueCommand } from '@/lib/studio-session'
import type { StructuredCommand } from '@/lib/ai/structured-commands'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ── GET: fetch one template by id ────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json(
      { ok: false, error: 'missing_id', message: 'Query param `id` is required.' },
      { status: 400 },
    )
  }

  const template = loadTemplate(id)
  if (!template) {
    return NextResponse.json(
      { ok: false, error: 'not_found', message: `No template with id "${id}".` },
      { status: 404 },
    )
  }

  return NextResponse.json({
    ok: true,
    priceCredits: TEMPLATE_LOAD_COST_CREDITS,
    template,
  })
}

// ── POST: queue the template for a live plugin session ──────────────────────

const loadBodySchema = z.object({
  id: z.string().min(1).max(64),
  sessionId: z.string().min(1).max(128),
})

/**
 * Build the payload we'll enqueue for the plugin. We use the existing
 * `structured_commands` ChangeType so the plugin's handler can install
 * geometry, folders, and scripts in a single transaction.
 */
function buildQueuePayload(
  commands: StructuredCommand[],
  serverScripts: { name: string; parent: string; source: string }[],
) {
  // Convert server scripts into `create_script` commands so the existing
  // structured-commands executor can create them without special handling.
  const scriptCommands: StructuredCommand[] = serverScripts.map((s) => ({
    type: 'create_script',
    name: s.name,
    scriptType: 'Script',
    source: s.source,
    parent: s.parent,
  }))

  return {
    commands: [...commands, ...scriptCommands],
    source: 'template_marketplace',
  }
}

export async function POST(req: NextRequest) {
  // ── Auth ───────────────────────────────────────────────────────────────
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json(
      { ok: false, error: 'unauthorized', message: 'Sign in to install a template.' },
      { status: 401 },
    )
  }

  // ── Parse body ─────────────────────────────────────────────────────────
  let body: z.infer<typeof loadBodySchema>
  try {
    body = loadBodySchema.parse(await req.json())
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: 'invalid_body',
        message: err instanceof Error ? err.message : 'Invalid body',
      },
      { status: 400 },
    )
  }

  // ── Resolve template ───────────────────────────────────────────────────
  const template = loadTemplate(body.id)
  if (!template) {
    return NextResponse.json(
      { ok: false, error: 'not_found', message: `No template with id "${body.id}".` },
      { status: 404 },
    )
  }

  // ── Queue commands to the plugin session ──────────────────────────────
  const payload = buildQueuePayload(template.structuredCommands, template.serverScripts)

  const result = await queueCommand(body.sessionId, {
    type: 'structured_commands',
    data: payload as unknown as Record<string, unknown>,
  })

  if (!result.ok) {
    const status =
      result.error === 'session_not_found' || result.error === 'session_disconnected'
        ? 404
        : result.error === 'queue_full'
          ? 429
          : 500
    return NextResponse.json(
      {
        ok: false,
        error: result.error ?? 'queue_error',
        message:
          result.error === 'session_not_found'
            ? 'No active plugin session. Open Studio and connect the plugin first.'
            : result.error === 'session_disconnected'
              ? 'Plugin session is not connected.'
              : result.error === 'queue_full'
                ? 'Command queue is full. Wait for the plugin to drain and try again.'
                : 'Failed to queue template.',
      },
      { status },
    )
  }

  return NextResponse.json({
    ok: true,
    commandId: result.commandId,
    priceCredits: TEMPLATE_LOAD_COST_CREDITS,
    template: {
      id: template.id,
      name: template.name,
      partCount: template.partCount,
      scriptCount: template.scriptCount,
    },
  })
}
