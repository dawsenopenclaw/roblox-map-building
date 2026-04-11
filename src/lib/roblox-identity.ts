/**
 * Roblox Identity — Fetch user info, avatar, and places from Roblox API.
 *
 * Called after Roblox OAuth sign-in to populate the user's Roblox profile
 * and discover their published games/places.
 */

import 'server-only'

// ── Types ───────────────────────────────────────────────────────────────────

export interface RobloxUserInfo {
  id: number
  name: string            // username
  displayName: string
  description: string
  created: string
  isBanned: boolean
  hasVerifiedBadge: boolean
}

export interface RobloxPlace {
  id: number
  rootPlaceId: number
  name: string
  description: string
  creator: { id: number; name: string; type: string }
  playing: number
  visits: number
  maxPlayers: number
  created: string
  updated: string
  favoritedCount: number
  genre: string
}

export interface RobloxAvatar {
  imageUrl: string
}

// ── API Calls ───────────────────────────────────────────────────────────────

/**
 * Fetch Roblox user info by user ID.
 */
export async function getRobloxUser(robloxUserId: string): Promise<RobloxUserInfo | null> {
  try {
    const res = await fetch(`https://users.roblox.com/v1/users/${robloxUserId}`, {
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    return (await res.json()) as RobloxUserInfo
  } catch {
    return null
  }
}

/**
 * Fetch Roblox user info by username.
 */
export async function getRobloxUserByName(username: string): Promise<RobloxUserInfo | null> {
  try {
    const res = await fetch('https://users.roblox.com/v1/usernames/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { data: Array<{ id: number }> }
    if (!data.data?.[0]) return null
    return getRobloxUser(String(data.data[0].id))
  } catch {
    return null
  }
}

/**
 * Fetch Roblox avatar thumbnail URL.
 */
export async function getRobloxAvatar(robloxUserId: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxUserId}&size=150x150&format=Png&isCircular=false`,
      { signal: AbortSignal.timeout(8000) },
    )
    if (!res.ok) return null
    const data = (await res.json()) as { data: Array<{ imageUrl: string }> }
    return data.data?.[0]?.imageUrl ?? null
  } catch {
    return null
  }
}

/**
 * Fetch all games/universes created by a Roblox user.
 * Returns their published places (games visible on their profile).
 */
export async function getRobloxPlaces(robloxUserId: string): Promise<RobloxPlace[]> {
  try {
    const res = await fetch(
      `https://games.roblox.com/v2/users/${robloxUserId}/games?sortOrder=Desc&limit=50`,
      { signal: AbortSignal.timeout(10000) },
    )
    if (!res.ok) return []
    const data = (await res.json()) as { data: RobloxPlace[] }
    return data.data ?? []
  } catch {
    return []
  }
}

/**
 * Fetch full Roblox identity: user info + avatar + places.
 * One call to populate everything after OAuth sign-in.
 */
export async function fetchFullRobloxIdentity(robloxUserId: string) {
  const [user, avatarUrl, places] = await Promise.all([
    getRobloxUser(robloxUserId),
    getRobloxAvatar(robloxUserId),
    getRobloxPlaces(robloxUserId),
  ])

  return {
    user,
    avatarUrl,
    places,
  }
}
