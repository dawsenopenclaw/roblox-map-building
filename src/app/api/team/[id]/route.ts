/**
 * /api/team/[id]
 *
 * GET    — Team detail with members, projects, recent activity
 * PATCH  — Update team name/description (owner/admin only)
 * DELETE — Soft-delete team (owner only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import {
  resolveUserId,
  getTeamRole,
  requireTeamRole,
  logTeamActivity,
} from '@/lib/team-permissions'

type Ctx = { params: Promise<{ id: string }> }

// ---------------------------------------------------------------------------
// GET — team detail
// ---------------------------------------------------------------------------

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id: teamId } = await ctx.params
    const internalId = await resolveUserId(clerkId)
    const role = await getTeamRole(teamId, internalId)
    if (!role) {
      return NextResponse.json({ error: 'Not a member of this team' }, { status: 403 })
    }

    const team = await db.team.findUnique({
      where: { id: teamId, deletedAt: null },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                clerkId: true,
                displayName: true,
                username: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        projects: {
          where: { archived: false },
          select: { id: true, name: true, createdAt: true, updatedAt: true },
          orderBy: { updatedAt: 'desc' },
          take: 20,
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            actor: {
              select: { id: true, displayName: true, username: true, avatarUrl: true },
            },
          },
        },
      },
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const members = team.members.map((m) => ({
      id: m.id,
      userId: m.user.id,
      displayName: m.user.displayName || m.user.username || m.user.email,
      email: m.user.email,
      avatarUrl: m.user.avatarUrl,
      role: m.role,
      joinedAt: m.joinedAt.toISOString(),
    }))

    const activity = team.activities.map((a) => ({
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
    }))

    return NextResponse.json({
      team: {
        id: team.id,
        name: team.name,
        slug: team.slug,
        description: team.description,
        ownerId: team.ownerId,
        myRole: role,
        members,
        projects: team.projects,
        recentActivity: activity,
        createdAt: team.createdAt.toISOString(),
        updatedAt: team.updatedAt.toISOString(),
      },
    })
  } catch (err) {
    console.error('[team/:id GET]', err)
    return NextResponse.json({ error: 'Failed to load team' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// PATCH — update team info
// ---------------------------------------------------------------------------

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id: teamId } = await ctx.params
    const internalId = await resolveUserId(clerkId)
    await requireTeamRole(teamId, internalId, 'admin')

    const body = await req.json()
    const data: Record<string, string> = {}

    if (typeof body?.name === 'string' && body.name.trim()) {
      data.name = body.name.trim().slice(0, 100)
    }
    if (typeof body?.description === 'string') {
      data.description = body.description.trim().slice(0, 500)
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 422 })
    }

    const updated = await db.team.update({
      where: { id: teamId, deletedAt: null },
      data,
    })

    await logTeamActivity(
      teamId,
      internalId,
      'team.updated',
      `Updated team: ${Object.keys(data).join(', ')}`,
    )

    return NextResponse.json({
      team: {
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
        description: updated.description,
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update team'
    const status = msg.includes('role') || msg.includes('member') ? 403 : 500
    console.error('[team/:id PATCH]', err)
    return NextResponse.json({ error: msg }, { status })
  }
}

// ---------------------------------------------------------------------------
// DELETE — soft-delete team (owner only)
// ---------------------------------------------------------------------------

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id: teamId } = await ctx.params
    const internalId = await resolveUserId(clerkId)
    await requireTeamRole(teamId, internalId, 'owner')

    await db.team.update({
      where: { id: teamId },
      data: { deletedAt: new Date() },
    })

    await logTeamActivity(teamId, internalId, 'team.deleted', 'Team was deleted')

    return NextResponse.json({ deleted: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete team'
    const status = msg.includes('role') || msg.includes('member') ? 403 : 500
    console.error('[team/:id DELETE]', err)
    return NextResponse.json({ error: msg }, { status })
  }
}
