/**
 * GET /api/roblox/my-places
 *
 * Returns the authenticated user's Roblox places/games.
 * Requires the user to have linked their Roblox account.
 */

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getRobloxPlaces, getRobloxUser, getRobloxAvatar } from '@/lib/roblox-identity'

export async function GET() {
  let userId: string | null = null
  try {
    const session = await auth()
    userId = session?.userId ?? null
  } catch {
    return NextResponse.json({ error: 'Auth unavailable' }, { status: 401 })
  }

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: {
      robloxUserId: true,
      robloxUsername: true,
      robloxDisplayName: true,
      robloxAvatarUrl: true,
    },
  })

  if (!user?.robloxUserId) {
    return NextResponse.json({
      error: 'No Roblox account linked. Sign in with Roblox to link your account.',
      linked: false,
    }, { status: 404 })
  }

  const places = await getRobloxPlaces(user.robloxUserId)

  return NextResponse.json({
    linked: true,
    roblox: {
      userId: user.robloxUserId,
      username: user.robloxUsername,
      displayName: user.robloxDisplayName,
      avatarUrl: user.robloxAvatarUrl,
    },
    places: places.map((p) => ({
      id: p.id,
      rootPlaceId: p.rootPlaceId,
      name: p.name,
      playing: p.playing,
      visits: p.visits,
      maxPlayers: p.maxPlayers,
      updated: p.updated,
      genre: p.genre,
    })),
  })
}
