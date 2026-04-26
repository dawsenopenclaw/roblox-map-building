/**
 * /api/team/[id]/zones
 *
 * Redis-backed zone locking with 5-minute auto-expiry.
 *
 * GET    — List all locked zones for this team
 * POST   — Lock a zone (editor+ only)
 * DELETE — Unlock a zone (locker, or owner/admin)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { redis } from '@/lib/redis'
import {
  resolveUserId,
  getTeamRole,
  canLockZone,
  canManageMembers,
} from '@/lib/team-permissions'

const ZONE_TTL = 300 // 5 minutes

type RouteContext = { params: Promise<{ id: string }> }

// ---------------------------------------------------------------------------
// GET — list all locked zones
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  context: RouteContext,
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: teamId } = await context.params

  try {
    const internalId = await resolveUserId(clerkId)
    const role = await getTeamRole(teamId, internalId)
    if (!role) {
      return NextResponse.json({ error: 'Not a team member' }, { status: 403 })
    }

    const pattern = `team:${teamId}:zone:*`
    const keys = await redis.keys(pattern)

    if (!keys || keys.length === 0) {
      return NextResponse.json({ zones: [] })
    }

    const values = await redis.mget(...keys)
    const zones = keys.map((key, i) => {
      const zoneName = key.replace(`team:${teamId}:zone:`, '')
      const raw = values?.[i]
      let data: { userId?: string; userName?: string; lockedAt?: string } = {}
      try {
        data = raw ? JSON.parse(raw) : {}
      } catch {
        // malformed value — skip
      }
      return {
        zone: zoneName,
        userId: data.userId ?? null,
        userName: data.userName ?? null,
        lockedAt: data.lockedAt ?? null,
        isMe: data.userId === internalId,
      }
    })

    return NextResponse.json({ zones })
  } catch (err) {
    console.error('[team zones GET]', err)
    return NextResponse.json(
      { error: 'Failed to load zone locks' },
      { status: 500 },
    )
  }
}

// ---------------------------------------------------------------------------
// POST — lock a zone
// ---------------------------------------------------------------------------

export async function POST(
  req: NextRequest,
  context: RouteContext,
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: teamId } = await context.params

  try {
    const body = await req.json()
    const zone = body?.zone as string | undefined
    if (!zone || typeof zone !== 'string') {
      return NextResponse.json({ error: 'Missing zone name' }, { status: 400 })
    }

    const internalId = await resolveUserId(clerkId)
    const role = await getTeamRole(teamId, internalId)
    if (!role || !canLockZone(role)) {
      return NextResponse.json(
        { error: 'Requires editor role or above' },
        { status: 403 },
      )
    }

    const key = `team:${teamId}:zone:${zone}`

    // Check if already locked by someone else
    const existing = await redis.get(key)
    if (existing) {
      try {
        const data = JSON.parse(existing)
        if (data.userId !== internalId) {
          return NextResponse.json(
            {
              error: 'Zone already locked',
              lockedBy: data.userName ?? data.userId,
            },
            { status: 409 },
          )
        }
        // Already locked by this user — refresh TTL
      } catch {
        // malformed — overwrite
      }
    }

    const lockData = JSON.stringify({
      userId: internalId,
      userName: clerkId, // Clerk ID as fallback name
      lockedAt: new Date().toISOString(),
    })

    await redis.set(key, lockData, 'EX', ZONE_TTL)

    return NextResponse.json({ locked: true, zone, ttl: ZONE_TTL })
  } catch (err) {
    console.error('[team zones POST]', err)
    return NextResponse.json(
      { error: 'Failed to lock zone' },
      { status: 500 },
    )
  }
}

// ---------------------------------------------------------------------------
// DELETE — unlock a zone
// ---------------------------------------------------------------------------

export async function DELETE(
  req: NextRequest,
  context: RouteContext,
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: teamId } = await context.params

  try {
    const body = await req.json()
    const zone = body?.zone as string | undefined
    if (!zone || typeof zone !== 'string') {
      return NextResponse.json({ error: 'Missing zone name' }, { status: 400 })
    }

    const internalId = await resolveUserId(clerkId)
    const role = await getTeamRole(teamId, internalId)
    if (!role) {
      return NextResponse.json({ error: 'Not a team member' }, { status: 403 })
    }

    const key = `team:${teamId}:zone:${zone}`
    const existing = await redis.get(key)

    if (!existing) {
      return NextResponse.json({ unlocked: true, zone })
    }

    // Only the locker or an admin/owner can unlock
    try {
      const data = JSON.parse(existing)
      if (data.userId !== internalId && !canManageMembers(role)) {
        return NextResponse.json(
          { error: 'Only the locker or an admin/owner can unlock' },
          { status: 403 },
        )
      }
    } catch {
      // malformed — allow delete
    }

    await redis.del(key)

    return NextResponse.json({ unlocked: true, zone })
  } catch (err) {
    console.error('[team zones DELETE]', err)
    return NextResponse.json(
      { error: 'Failed to unlock zone' },
      { status: 500 },
    )
  }
}
