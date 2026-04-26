/**
 * /api/team
 *
 * GET  — List teams the current user belongs to
 * POST — Create a new team
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { resolveUserId, logTeamActivity } from '@/lib/team-permissions'

// ---------------------------------------------------------------------------
// GET — list teams for the current user
// ---------------------------------------------------------------------------

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const internalId = await resolveUserId(clerkId)

    const memberships = await db.teamMember.findMany({
      where: { userId: internalId },
      include: {
        team: {
          include: {
            _count: { select: { members: true, projects: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    })

    // Filter out soft-deleted teams
    const teams = memberships
      .filter((m) => m.team.deletedAt === null)
      .map((m) => ({
        id: m.team.id,
        name: m.team.name,
        slug: m.team.slug,
        description: m.team.description,
        myRole: m.role,
        memberCount: m.team._count.members,
        projectCount: m.team._count.projects,
        joinedAt: m.joinedAt.toISOString(),
        createdAt: m.team.createdAt.toISOString(),
      }))

    return NextResponse.json({ teams })
  } catch (err) {
    console.error('[team GET]', err)
    return NextResponse.json(
      { error: 'Failed to load teams' },
      { status: 500 },
    )
  }
}

// ---------------------------------------------------------------------------
// POST — create a new team
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    if (!name || name.length > 100) {
      return NextResponse.json(
        { error: 'Name is required (max 100 chars)' },
        { status: 422 },
      )
    }

    const internalId = await resolveUserId(clerkId)

    // Generate a url-safe slug from the name + random suffix
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40)
    const suffix = Math.random().toString(36).slice(2, 8)
    const slug = `${baseSlug}-${suffix}`

    const team = await db.team.create({
      data: {
        name,
        slug,
        ownerId: internalId,
        members: {
          create: {
            userId: internalId,
            role: 'OWNER',
          },
        },
      },
      include: {
        _count: { select: { members: true } },
      },
    })

    // Create initial invite token for sharing
    const invite = await db.teamInvite.create({
      data: {
        teamId: team.id,
        invitedBy: internalId,
        role: 'EDITOR',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    })

    await logTeamActivity(team.id, internalId, 'team.created', `Created team "${name}"`)

    return NextResponse.json(
      {
        team: {
          id: team.id,
          name: team.name,
          slug: team.slug,
          description: team.description,
          myRole: 'OWNER',
          memberCount: team._count.members,
          inviteCode: invite.token,
          createdAt: team.createdAt.toISOString(),
        },
      },
      { status: 201 },
    )
  } catch (err) {
    console.error('[team POST]', err)
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 },
    )
  }
}
