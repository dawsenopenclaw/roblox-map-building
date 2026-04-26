/**
 * /api/team/join/[code]
 *
 * POST — Join a team via invite code. Max 10 members. Joins as the invite's default role (usually EDITOR).
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { resolveUserId, logTeamActivity } from '@/lib/team-permissions'

const MAX_MEMBERS = 10

type Ctx = { params: Promise<{ code: string }> }

export async function POST(_req: NextRequest, ctx: Ctx) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { code } = await ctx.params
    const internalId = await resolveUserId(clerkId)

    // Find valid invite
    const invite = await db.teamInvite.findUnique({
      where: { token: code },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            deletedAt: true,
            _count: { select: { members: true } },
          },
        },
      },
    })

    if (!invite) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })
    }

    if (invite.status !== 'PENDING') {
      return NextResponse.json({ error: 'Invite is no longer valid' }, { status: 410 })
    }

    if (invite.expiresAt < new Date()) {
      // Mark as expired
      await db.teamInvite.update({
        where: { id: invite.id },
        data: { status: 'EXPIRED' },
      })
      return NextResponse.json({ error: 'Invite has expired' }, { status: 410 })
    }

    if (invite.team.deletedAt !== null) {
      return NextResponse.json({ error: 'Team no longer exists' }, { status: 404 })
    }

    // Check max members
    if (invite.team._count.members >= MAX_MEMBERS) {
      return NextResponse.json(
        { error: `Team is full (max ${MAX_MEMBERS} members)` },
        { status: 409 },
      )
    }

    // Check if already a member
    const existing = await db.teamMember.findUnique({
      where: { teamId_userId: { teamId: invite.teamId, userId: internalId } },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'You are already a member of this team' },
        { status: 409 },
      )
    }

    // Determine join role — use invite's role, but never OWNER via invite
    const joinRole = invite.role === 'OWNER' ? 'EDITOR' : invite.role

    // Add member
    await db.teamMember.create({
      data: {
        teamId: invite.teamId,
        userId: internalId,
        role: joinRole,
      },
    })

    // If invite has maxUses, track usage
    const newUseCount = invite.useCount + 1
    await db.teamInvite.update({
      where: { id: invite.id },
      data: {
        useCount: newUseCount,
        acceptedAt: new Date(),
        ...(invite.maxUses > 0 && newUseCount >= invite.maxUses
          ? { status: 'ACCEPTED' }
          : {}),
      },
    })

    await logTeamActivity(
      invite.teamId,
      internalId,
      'member.joined',
      `Joined the team via invite`,
      { inviteId: invite.id, role: joinRole },
    )

    return NextResponse.json(
      {
        joined: true,
        team: {
          id: invite.team.id,
          name: invite.team.name,
        },
        role: joinRole,
      },
      { status: 201 },
    )
  } catch (err) {
    console.error('[team/join/:code POST]', err)
    return NextResponse.json({ error: 'Failed to join team' }, { status: 500 })
  }
}
