/**
 * /api/sessions
 *
 * GET  — list the current user's chat sessions (last 50, Prisma-backed)
 * POST — create / update (upsert) a session with messages
 *
 * All endpoints require Clerk authentication.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { saveSession, loadSessions } from '@/lib/session-persistence'
import { generalRateLimit, rateLimitHeaders } from '@/lib/rate-limit'

// ---------------------------------------------------------------------------
// GET — list sessions (most recent first)
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rl = await generalRateLimit(userId)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests.' },
        { status: 429, headers: rateLimitHeaders(rl) },
      )
    }
  } catch {
    // Redis unavailable — allow through
  }

  try {
    const sessions = await loadSessions(userId)
    return NextResponse.json({ sessions })
  } catch (err) {
    console.error('[sessions GET] Error listing sessions:', err)
    return NextResponse.json({ error: 'Failed to list sessions' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// POST — save (create or update) a session
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rl = await generalRateLimit(userId)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests.' },
        { status: 429, headers: rateLimitHeaders(rl) },
      )
    }
  } catch {
    // Redis unavailable — allow through
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const data = body as Record<string, unknown>

  // Validate required fields
  if (!data.id || typeof data.id !== 'string') {
    return NextResponse.json({ error: 'Missing or invalid session id' }, { status: 400 })
  }
  if (!data.title || typeof data.title !== 'string') {
    return NextResponse.json({ error: 'Missing or invalid session title' }, { status: 400 })
  }
  if (!Array.isArray(data.messages)) {
    return NextResponse.json({ error: 'Missing or invalid messages array' }, { status: 400 })
  }

  try {
    const result = await saveSession(userId, {
      id: data.id,
      title: (data.title as string).slice(0, 200),
      aiMode: (data.aiMode as string | undefined) ?? 'build',
      model: (data.model as string | undefined) ?? undefined,
      messages: data.messages,
    })

    return NextResponse.json({ ok: true, sessionId: result.id })
  } catch (err) {
    if (err instanceof Error && err.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('[sessions POST] Error saving session:', err)
    return NextResponse.json({ error: 'Failed to save session' }, { status: 500 })
  }
}
