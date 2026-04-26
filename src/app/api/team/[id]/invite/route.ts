/**
 * /api/team/[id]/invite
 *
 * GET  — Get the current (active, non-expired) invite code
 * POST — Regenerate invite code (owner/admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import {
  resolveUserId,
  requireTeamRole,
  logTeamActivity,
} from '@/lib/team-permissions'

type Ctx = { params: Promise<{ id: string }> }

// ---------------------------------------------------------------------------
// GET — get active invite code
// ---------------------------------------------------------------------------

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id: teamId } = await ctx.params
    const internalId = await resolveUserId(clerkId)
    await requireTeamRole(teamId, internalId, 'viewer')

    // Find the most recent non-expired, non-revoked invite
    const invite = await db.teamInvite.findFirst({
      where: {
        teamId,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
        email: null, // General invite link (not email-targeted)
      },
      orderBy: { createdAt: 'desc' },
      select: { token: true, expiresAt: true, role: true },
    })

    if (!invite) {
      return NextResponse.json({ inviteCode: null })
    }

    return NextResponse.json({
      inviteCode: invite.token,
      expiresAt: invite.expiresAt.toISOString(),
      defaultRole: invite.role,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to get invite'
    const status = msg.includes('role') || msg.includes('member') ? 403 : 500
    console.error('[team/:id/invite GET]', err)
    return NextResponse.json({ error: msg }, { status })
  }
}

// ---------------------------------------------------------------------------
// POST — regenerate invite code (revokes old one)
// ---------------------------------------------------------------------------

export async function POST(_req: NextRequest, ctx: Ctx) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id: teamId } = await ctx.params
    const internalId = await resolveUserId(clerkId)
    await requireTeamRole(teamId, internalId, 'admin')

    // Revoke all existing general invites
    await db.teamInvite.updateMany({
      where: {
        teamId,
        status: 'PENDING',
        email: null,
      },
      data: { status: 'REVOKED' },
    })

    // Create fresh invite
    const invite = await db.teamInvite.create({
      data: {
        teamId,
        invitedBy: internalId,
        role: 'EDITOR',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    })

    await logTeamActivity(
      teamId,
      internalId,
      'invite.regenerated',
      'Regenerated invite link',
    )

    return NextResponse.json(
      {
        inviteCode: invite.token,
        expiresAt: invite.expiresAt.toISOString(),
        defaultRole: invite.role,
      },
      { status: 201 },
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to regenerate invite'
    const status = msg.includes('role') || msg.includes('member') ? 403 : 500
    console.error('[team/:id/invite POST]', err)
    return NextResponse.json({ error: msg }, { status })
  }
}
