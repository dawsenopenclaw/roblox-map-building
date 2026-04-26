/**
 * /api/team/[id]/members
 *
 * GET    — List team members with roles
 * PATCH  — Update a member's role (owner/admin only)
 * DELETE — Remove a member (owner/admin, or self-leave)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import {
  resolveUserId,
  getTeamRole,
  requireTeamRole,
  logTeamActivity,
  type TeamRole,
} from '@/lib/team-permissions'

type Ctx = { params: Promise<{ id: string }> }

// ---------------------------------------------------------------------------
// GET — list members
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
      return NextResponse.json({ error: 'Not a member' }, { status: 403 })
    }

    const members = await db.teamMember.findMany({
      where: { teamId },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            username: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    })

    return NextResponse.json({
      members: members.map((m) => ({
        id: m.id,
        userId: m.user.id,
        displayName: m.user.displayName || m.user.username || m.user.email,
        email: m.user.email,
        avatarUrl: m.user.avatarUrl,
        role: m.role,
        joinedAt: m.joinedAt.toISOString(),
      })),
    })
  } catch (err) {
    console.error('[team/:id/members GET]', err)
    return NextResponse.json({ error: 'Failed to list members' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// PATCH — update member role
// ---------------------------------------------------------------------------

const VALID_ROLES = ['OWNER', 'ADMIN', 'EDITOR', 'VIEWER'] as const
const HIERARCHY: TeamRole[] = ['viewer', 'editor', 'admin', 'owner']

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id: teamId } = await ctx.params
    const internalId = await resolveUserId(clerkId)
    const myRole = await requireTeamRole(teamId, internalId, 'admin')

    const body = await req.json()
    const { memberId, role } = body ?? {}

    if (!memberId || typeof memberId !== 'string') {
      return NextResponse.json({ error: 'memberId required' }, { status: 422 })
    }
    const upperRole = typeof role === 'string' ? role.toUpperCase() : ''
    if (!VALID_ROLES.includes(upperRole as (typeof VALID_ROLES)[number])) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` },
        { status: 422 },
      )
    }

    const target = await db.teamMember.findUnique({
      where: { id: memberId, teamId },
      select: { userId: true, role: true },
    })
    if (!target) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Can't change owner's role unless you are the owner
    const targetLower = target.role.toLowerCase() as TeamRole
    if (targetLower === 'owner' && myRole !== 'owner') {
      return NextResponse.json({ error: 'Only the owner can change the owner role' }, { status: 403 })
    }

    // Can't promote someone above your own role
    const newRoleLower = upperRole.toLowerCase() as TeamRole
    if (HIERARCHY.indexOf(newRoleLower) > HIERARCHY.indexOf(myRole)) {
      return NextResponse.json({ error: 'Cannot assign a role higher than your own' }, { status: 403 })
    }

    // If transferring ownership, demote the current owner to admin
    if (upperRole === 'OWNER' && myRole === 'owner') {
      await db.teamMember.update({
        where: { teamId_userId: { teamId, userId: internalId } },
        data: { role: 'ADMIN' },
      })
      await db.team.update({
        where: { id: teamId },
        data: { ownerId: target.userId },
      })
    }

    const updated = await db.teamMember.update({
      where: { id: memberId },
      data: { role: upperRole as (typeof VALID_ROLES)[number] },
    })

    await logTeamActivity(
      teamId,
      internalId,
      'member.role_changed',
      `Changed role to ${upperRole}`,
      { memberId, oldRole: target.role, newRole: upperRole },
    )

    return NextResponse.json({ member: { id: updated.id, role: updated.role } })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update member'
    const status = msg.includes('role') || msg.includes('member') ? 403 : 500
    console.error('[team/:id/members PATCH]', err)
    return NextResponse.json({ error: msg }, { status })
  }
}

// ---------------------------------------------------------------------------
// DELETE — remove member (or self-leave)
// ---------------------------------------------------------------------------

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id: teamId } = await ctx.params
    const internalId = await resolveUserId(clerkId)

    const { searchParams } = new URL(req.url)
    const memberId = searchParams.get('memberId')
    if (!memberId) {
      return NextResponse.json({ error: 'memberId query param required' }, { status: 422 })
    }

    const target = await db.teamMember.findUnique({
      where: { id: memberId, teamId },
      select: { userId: true, role: true },
    })
    if (!target) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    const isSelf = target.userId === internalId
    const isOwner = target.role === 'OWNER'

    // Owner can't leave — must transfer ownership first
    if (isSelf && isOwner) {
      return NextResponse.json(
        { error: 'Owner cannot leave. Transfer ownership first.' },
        { status: 403 },
      )
    }

    // If not self-leave, need admin+ to remove others
    if (!isSelf) {
      const myRole = await requireTeamRole(teamId, internalId, 'admin')
      // Can't remove someone at your own level or above (unless owner)
      const HIERARCHY_MAP: Record<string, number> = {
        VIEWER: 0,
        EDITOR: 1,
        ADMIN: 2,
        OWNER: 3,
      }
      if (
        myRole !== 'owner' &&
        (HIERARCHY_MAP[target.role] ?? 0) >= (HIERARCHY_MAP[myRole.toUpperCase()] ?? 0)
      ) {
        return NextResponse.json(
          { error: 'Cannot remove a member with equal or higher role' },
          { status: 403 },
        )
      }
    }

    await db.teamMember.delete({ where: { id: memberId } })

    await logTeamActivity(
      teamId,
      internalId,
      isSelf ? 'member.left' : 'member.removed',
      isSelf ? 'Left the team' : `Removed member`,
      { memberId, targetUserId: target.userId },
    )

    return NextResponse.json({ deleted: true, memberId })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to remove member'
    const status = msg.includes('role') || msg.includes('member') ? 403 : 500
    console.error('[team/:id/members DELETE]', err)
    return NextResponse.json({ error: msg }, { status })
  }
}
