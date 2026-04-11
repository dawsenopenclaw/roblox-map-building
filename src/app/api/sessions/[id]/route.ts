/**
 * /api/sessions/[id]
 *
 * GET    — load a single session with all messages (Prisma-backed)
 * PUT    — update session fields (title, messages, aiMode)
 * DELETE — delete a session (cascades messages)
 *
 * All endpoints require Clerk authentication.
 * Users can only access their own sessions.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { loadSession, deleteSession, saveSession } from '@/lib/session-persistence'
import { generalRateLimit, rateLimitHeaders } from '@/lib/rate-limit'

// ---------------------------------------------------------------------------
// GET — load a single session with messages
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
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

  const { id: sessionId } = await params

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session id' }, { status: 400 })
  }

  try {
    const session = await loadSession(userId, sessionId)
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    return NextResponse.json({ session })
  } catch (err) {
    console.error('[sessions/:id GET] Error loading session:', err)
    return NextResponse.json({ error: 'Failed to load session' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// PUT — update session fields (title, messages, aiMode)
// ---------------------------------------------------------------------------

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
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

  const { id: sessionId } = await params

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session id' }, { status: 400 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const data = body as Record<string, unknown>

  // At least one updatable field must be present
  if (!data.title && !data.messages && !data.aiMode) {
    return NextResponse.json(
      { error: 'No updatable fields provided (title, messages, aiMode)' },
      { status: 400 },
    )
  }

  // Verify ownership first
  const existing = await loadSession(userId, sessionId)
  if (!existing) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  // Optional optimistic-concurrency check via If-Match. When the client sends
  // the updatedAt timestamp it last observed, we reject stale writes with 409.
  // Legacy clients that don't send the header continue to work unchanged
  // (last-write-wins) for backwards compatibility.
  const ifMatch = req.headers.get('if-match')
  if (ifMatch) {
    const currentTag = existing.updatedAt.toISOString()
    // Accept both raw ISO and quoted ETag forms (e.g. `"2026-..."`).
    const normalized = ifMatch.replace(/^"(.*)"$/, '$1')
    if (normalized !== currentTag) {
      return NextResponse.json(
        {
          error: 'Conflict: session has been modified since you last loaded it.',
          currentUpdatedAt: currentTag,
        },
        { status: 409 },
      )
    }
  }

  try {
    const result = await saveSession(userId, {
      id: sessionId,
      title: typeof data.title === 'string' ? data.title.slice(0, 200) : existing.title,
      aiMode: typeof data.aiMode === 'string' ? data.aiMode : existing.aiMode,
      model: typeof data.model === 'string' ? data.model : existing.model,
      messages: Array.isArray(data.messages)
        ? data.messages
        : existing.messages.map((m: { id: string; role: string; content: string; metadata: unknown; timestamp: Date }) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            metadata: m.metadata as Record<string, unknown> | null,
            timestamp: m.timestamp,
          })),
    })

    return NextResponse.json({ ok: true, sessionId: result.id })
  } catch (err) {
    console.error('[sessions/:id PUT] Error updating session:', err)
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// DELETE — delete a session (cascade-deletes messages)
// ---------------------------------------------------------------------------

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
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

  const { id: sessionId } = await params

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session id' }, { status: 400 })
  }

  try {
    const deleted = await deleteSession(userId, sessionId)
    if (!deleted) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[sessions/:id DELETE] Error deleting session:', err)
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 })
  }
}
