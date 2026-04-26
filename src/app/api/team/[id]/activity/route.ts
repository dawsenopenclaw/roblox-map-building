/**
 * /api/team/[id]/activity
 *
 * GET — Paginated activity feed (newest first, limit 20)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { resolveUserId, requireTeamRole } from '@/lib/team-permissions'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, ctx: Ctx) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id: teamId } = await ctx.params
    const internalId = await resolveUserId(clerkId)
    await requireTeamRole(teamId, internalId, 'viewer')

    const { searchParams } = new URL(req.url)
    const cursor = searchParams.get('cursor')
    const limit = Math.min(
      Math.max(parseInt(searchParams.get('limit') || '20', 10) || 20, 1),
      50,
    )

    const activities = await db.teamActivity.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1, // fetch one extra to know if there's a next page
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        actor: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    })

    const hasMore = activities.length > limit
    const items = hasMore ? activities.slice(0, limit) : activities
    const nextCursor = hasMore ? items[items.length - 1].id : null

    return NextResponse.json({
      activities: items.map((a) => ({
        id: a.id,
        action: a.action,
        description: a.description,
        actor: a.actor
          ? {
              id: a.actor.id,
              displayName: a.actor.displayName || a.actor.username,
              avatarUrl: a.actor.avatarUrl,
            }
          : null,
        createdAt: a.createdAt.toISOString(),
        metadata: a.metadata,
      })),
      nextCursor,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to load activity'
    const status = msg.includes('role') || msg.includes('member') ? 403 : 500
    console.error('[team/:id/activity GET]', err)
    return NextResponse.json({ error: msg }, { status })
  }
}
