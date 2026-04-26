/**
 * Team Shared Session API
 *
 * Lets team members share a single Roblox Studio session.
 * One host connects their Studio, then shares it with the team.
 * All team members' builds go to the same Studio instance.
 *
 * GET  — Get current shared session status (who's hosting, who's online)
 * POST — Share your Studio session with the team (become host)
 * DELETE — Stop sharing (host only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import {
  shareSession,
  getSharedSession,
  unshareSession,
  getSharedSessionMembers,
  joinSharedSession,
} from '@/lib/shared-session'
import { getSession } from '@/lib/studio-session'

// GET — Get shared session status for this team
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: teamId } = await params

  // Check team membership
  let role: string | null = null
  try {
    const { db } = await import('@/lib/db')
    const member = await db.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
      select: { role: true },
    })
    role = member?.role?.toLowerCase() ?? null
  } catch { /* DB unavailable — allow through for now */ }

  if (!role) {
    return NextResponse.json({ error: 'Not a team member' }, { status: 403 })
  }

  const shared = await getSharedSession(teamId)
  if (!shared) {
    return NextResponse.json({
      active: false,
      host: null,
      members: [],
      message: 'No one is sharing their Studio right now. Connect your Studio and share it with the team!',
    })
  }

  // Mark this user as online in the shared session
  await joinSharedSession(teamId, userId)

  const members = await getSharedSessionMembers(teamId)

  return NextResponse.json({
    active: true,
    host: {
      userId: shared.hostUserId,
      name: shared.hostName,
      sessionId: shared.sessionId,
      sharedAt: shared.sharedAt,
    },
    members,
    message: `${shared.hostName} is hosting. Builds will be sent to their Studio.`,
  })
}

// POST — Share your Studio session with the team
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: teamId } = await params

  // Check team membership (must be editor+)
  let role: string | null = null
  try {
    const { db } = await import('@/lib/db')
    const member = await db.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
      select: { role: true },
    })
    role = member?.role?.toLowerCase() ?? null
  } catch { /* DB unavailable */ }

  if (!role || role === 'viewer') {
    return NextResponse.json({ error: 'Must be editor or above to share' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({})) as { sessionId?: string; displayName?: string }
  const { sessionId, displayName } = body

  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId required — connect your Studio first' }, { status: 400 })
  }

  // Verify the session exists and belongs to this user
  const session = await getSession(sessionId)
  if (!session || !session.connected) {
    return NextResponse.json({ error: 'Studio session not found or disconnected. Connect your Studio first.' }, { status: 404 })
  }

  const hostName = displayName || 'Team Member'
  const success = await shareSession(teamId, userId, hostName, sessionId)

  if (!success) {
    return NextResponse.json({ error: 'Failed to share session — Redis may be unavailable' }, { status: 500 })
  }

  // Log activity
  try {
    const { db } = await import('@/lib/db')
    await db.teamActivity.create({
      data: {
        teamId,
        userId,
        action: 'shared_studio',
        details: `${hostName} shared their Studio with the team`,
      },
    })
  } catch { /* non-fatal */ }

  return NextResponse.json({
    success: true,
    message: `Your Studio is now shared with the team! Team members will see their builds in your Studio.`,
  })
}

// DELETE — Stop sharing your session
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: teamId } = await params

  const success = await unshareSession(teamId, userId)
  if (!success) {
    return NextResponse.json({ error: 'You are not the session host or no active session' }, { status: 400 })
  }

  return NextResponse.json({ success: true, message: 'Studio session is no longer shared.' })
}
