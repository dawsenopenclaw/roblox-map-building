/**
 * Cloud session persistence — save / load / delete chat sessions via Prisma.
 *
 * All functions accept a `userId` (Clerk user id) so the caller can pass it
 * from the authenticated context.  The Prisma `db` proxy from `@/lib/db` is
 * used so we share the singleton connection pool.
 */

import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface SessionMessage {
  id: string
  role: string
  content: string
  metadata?: Record<string, unknown> | null
  timestamp: Date | string
}

export interface SessionPayload {
  id: string
  title: string
  aiMode?: string
  model?: string
  messages: SessionMessage[]
}

// ─── Save (upsert) ─────────────────────────────────────────────────────────────

/**
 * Upsert a session and its messages to the database.
 * Deletes old messages and replaces them with the new set (simplest approach,
 * avoids diff logic).
 */
export async function saveSession(
  userId: string,
  session: SessionPayload,
): Promise<{ id: string }> {
  const result = await db.$transaction(async (tx) => {
    // Upsert the session header
    const upserted = await tx.chatSession.upsert({
      where: { id: session.id },
      update: {
        title: session.title,
        aiMode: session.aiMode ?? 'build',
        model: session.model ?? 'claude-3-5-sonnet',
        updatedAt: new Date(),
      },
      create: {
        id: session.id,
        userId,
        title: session.title,
        aiMode: session.aiMode ?? 'build',
        model: session.model ?? 'claude-3-5-sonnet',
      },
    })

    // Verify ownership (prevents overwriting another user's session)
    if (upserted.userId !== userId) {
      throw new Error('Forbidden')
    }

    // Replace messages: delete existing then bulk-create
    await tx.chatMessage.deleteMany({ where: { sessionId: session.id } })

    if (session.messages.length > 0) {
      await tx.chatMessage.createMany({
        data: session.messages.map((m) => ({
          id: m.id,
          sessionId: session.id,
          role: m.role,
          content: m.content,
          metadata: (m.metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          timestamp: new Date(m.timestamp),
        })),
      })
    }

    return upserted
  })

  return { id: result.id }
}

// ─── List sessions ──────────────────────────────────────────────────────────────

/**
 * Return the most recent 50 sessions for a user (metadata only, no messages).
 */
export async function loadSessions(userId: string) {
  return db.chatSession.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: 50,
    select: {
      id: true,
      title: true,
      aiMode: true,
      model: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { messages: true } },
    },
  })
}

// ─── Load single session ────────────────────────────────────────────────────────

/**
 * Load one session with all its messages.  Returns `null` if not found or
 * if the session doesn't belong to the requesting user.
 */
export async function loadSession(userId: string, sessionId: string) {
  const session = await db.chatSession.findUnique({
    where: { id: sessionId },
    include: {
      messages: { orderBy: { timestamp: 'asc' } },
    },
  })

  if (!session || session.userId !== userId) return null
  return session
}

// ─── Delete session ─────────────────────────────────────────────────────────────

/**
 * Delete a session (and cascade-delete its messages).
 * Returns `true` if deleted, `false` if not found / not owned.
 */
export async function deleteSession(
  userId: string,
  sessionId: string,
): Promise<boolean> {
  const session = await db.chatSession.findUnique({
    where: { id: sessionId },
    select: { userId: true },
  })

  if (!session || session.userId !== userId) return false

  await db.chatSession.delete({ where: { id: sessionId } })
  return true
}
