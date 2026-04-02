import { NextResponse } from 'next/server'

interface RobloxGameDetails {
  id: string
  name: string
  description: string
  places: Array<{ id: string; name: string; isRootPlace: boolean }>
  stats: {
    visits: number
    favorites: number
    playing: number
    likes: number
    dislikes: number
  }
  settings: {
    isPublished: boolean
    isFriendsOnly: boolean
    genre: string
    maxPlayers: number
  }
}

const DEMO_DETAILS: Record<string, RobloxGameDetails> = {
  'demo-1': {
    id: 'demo-1',
    name: 'Medieval Kingdom',
    description: 'An epic RPG set in a medieval kingdom. Explore castles, fight dragons, and complete quests.',
    places: [
      { id: 'place-101', name: 'Medieval Kingdom', isRootPlace: true },
      { id: 'place-102', name: 'Dungeon Level', isRootPlace: false },
    ],
    stats: { visits: 15200, favorites: 1240, playing: 43, likes: 890, dislikes: 45 },
    settings: { isPublished: true, isFriendsOnly: false, genre: 'RPG', maxPlayers: 20 },
  },
  'demo-2': {
    id: 'demo-2',
    name: 'Speed Racing',
    description: 'High-speed racing game with multiple tracks and vehicle customization.',
    places: [{ id: 'place-201', name: 'Speed Racing', isRootPlace: true }],
    stats: { visits: 8700, favorites: 560, playing: 18, likes: 420, dislikes: 30 },
    settings: { isPublished: true, isFriendsOnly: false, genre: 'Racing', maxPlayers: 12 },
  },
  'demo-3': {
    id: 'demo-3',
    name: 'Tycoon Master',
    description: 'Build and manage your business empire in this tycoon simulator.',
    places: [{ id: 'place-301', name: 'Tycoon Master', isRootPlace: true }],
    stats: { visits: 42100, favorites: 3800, playing: 112, likes: 2100, dislikes: 98 },
    settings: { isPublished: true, isFriendsOnly: false, genre: 'Tycoon', maxPlayers: 6 },
  },
  'demo-4': {
    id: 'demo-4',
    name: 'Obby Challenge',
    description: 'A challenging obstacle course with 50+ levels of increasing difficulty.',
    places: [{ id: 'place-401', name: 'Obby Challenge', isRootPlace: true }],
    stats: { visits: 3200, favorites: 210, playing: 7, likes: 180, dislikes: 22 },
    settings: { isPublished: true, isFriendsOnly: false, genre: 'Obby', maxPlayers: 15 },
  },
  'demo-5': {
    id: 'demo-5',
    name: 'My First Game',
    description: 'A sandbox game I am still working on.',
    places: [{ id: 'place-501', name: 'My First Game', isRootPlace: true }],
    stats: { visits: 156, favorites: 8, playing: 1, likes: 12, dislikes: 2 },
    settings: { isPublished: false, isFriendsOnly: true, genre: 'Sandbox', maxPlayers: 4 },
  },
}

// GET /api/roblox/games/[id]
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const apiKey = process.env.ROBLOX_OPEN_CLOUD_API_KEY

  if (!apiKey) {
    // Demo mode
    const details = DEMO_DETAILS[id]
    if (!details) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }
    return NextResponse.json(details)
  }

  // Real mode — Open Cloud API
  try {
    const res = await fetch(`https://apis.roblox.com/cloud/v2/universes/${id}`, {
      headers: { 'x-api-key': apiKey },
    })

    if (res.status === 404) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    if (!res.ok) {
      return NextResponse.json({ error: 'Roblox API error', status: res.status }, { status: 502 })
    }

    const u = await res.json() as {
      path: string
      displayName: string
      description: string
      activePrivacyStatus: string
      updateTime: string
    }

    const details: RobloxGameDetails = {
      id,
      name: u.displayName,
      description: u.description ?? '',
      places: [{ id, name: u.displayName, isRootPlace: true }],
      stats: { visits: 0, favorites: 0, playing: 0, likes: 0, dislikes: 0 },
      settings: {
        isPublished: u.activePrivacyStatus === 'Public',
        isFriendsOnly: false,
        genre: 'Unknown',
        maxPlayers: 10,
      },
    }

    return NextResponse.json(details)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: 'Failed to fetch game details from Roblox API', detail: message }, { status: 502 })
  }
}
