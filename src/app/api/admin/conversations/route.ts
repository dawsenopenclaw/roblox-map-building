/**
 * /api/admin/conversations
 *
 * GET — List all chat sessions across all users (admin only)
 *   ?userId=xxx  — filter by user
 *   ?limit=50    — pagination
 *   ?offset=0    — pagination offset
 *
 * Returns sessions with message previews for beta tester review.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../_adminGuard'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const url = new URL(req.url)
  const filterUserId = url.searchParams.get('userId')
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 50), 200)
  const offset = Number(url.searchParams.get('offset') ?? 0)

  try {
    const where = filterUserId ? { userId: filterUserId } : {}

    const [sessions, total] = await Promise.all([
      db.chatSession.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          messages: {
            orderBy: { timestamp: 'asc' },
            select: {
              id: true,
              role: true,
              content: true,
              metadata: true,
              timestamp: true,
            },
          },
        },
      }),
      db.chatSession.count({ where }),
    ])

    // Enrich with user info
    const userIds = [...new Set(sessions.map((s) => s.userId))]
    const users = await db.user.findMany({
      where: { clerkId: { in: userIds } },
      select: { clerkId: true, email: true, username: true, displayName: true },
    })
    const userMap = new Map(users.map((u) => [u.clerkId, u]))

    const enriched = sessions.map((s) => {
      const user = userMap.get(s.userId)
      return {
        id: s.id,
        userId: s.userId,
        user: user ? { email: user.email, username: user.username, displayName: user.displayName } : null,
        title: s.title,
        aiMode: s.aiMode,
        model: s.model,
        messageCount: s.messages.length,
        messages: s.messages,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }
    })

    return NextResponse.json({ conversations: enriched, total, limit, offset })
  } catch (e) {
    console.error('[admin/conversations]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to fetch conversations' },
      { status: 500 },
    )
  }
}
