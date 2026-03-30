import { NextResponse } from 'next/server'

export interface RobloxGame {
  id: string
  name: string
  thumbnailUrl: string
  visits: number
  updated: string
  isPublished: boolean
  genre: string
}

const DEMO_GAMES: RobloxGame[] = [
  {
    id: 'demo-1',
    name: 'Medieval Kingdom',
    thumbnailUrl: '',
    visits: 15200,
    updated: '2h ago',
    isPublished: true,
    genre: 'RPG',
  },
  {
    id: 'demo-2',
    name: 'Speed Racing',
    thumbnailUrl: '',
    visits: 8700,
    updated: 'Yesterday',
    isPublished: true,
    genre: 'Racing',
  },
  {
    id: 'demo-3',
    name: 'Tycoon Master',
    thumbnailUrl: '',
    visits: 42100,
    updated: '3 days ago',
    isPublished: true,
    genre: 'Tycoon',
  },
  {
    id: 'demo-4',
    name: 'Obby Challenge',
    thumbnailUrl: '',
    visits: 3200,
    updated: '1 week ago',
    isPublished: true,
    genre: 'Obby',
  },
  {
    id: 'demo-5',
    name: 'My First Game',
    thumbnailUrl: '',
    visits: 156,
    updated: '2 weeks ago',
    isPublished: false,
    genre: 'Sandbox',
  },
]

// GET /api/roblox/games
// DEMO mode: returns 5 demo games
// REAL mode (ROBLOX_OPEN_CLOUD_API_KEY set): calls Open Cloud API
export async function GET() {
  const apiKey = process.env.ROBLOX_OPEN_CLOUD_API_KEY

  if (!apiKey) {
    // Demo mode
    return NextResponse.json(DEMO_GAMES)
  }

  // Real mode — Open Cloud API
  try {
    const res = await fetch('https://apis.roblox.com/cloud/v2/universes?maxPageSize=50', {
      headers: {
        'x-api-key': apiKey,
      },
      next: { revalidate: 60 },
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Roblox API error', status: res.status },
        { status: 502 },
      )
    }

    const data = await res.json() as {
      universes?: Array<{
        path: string
        displayName: string
        description: string
        activePrivacyStatus: string
        createTime: string
        updateTime: string
        user?: string
      }>
    }

    const games: RobloxGame[] = (data.universes ?? []).map((u) => {
      const id = u.path.replace('universes/', '')
      return {
        id,
        name: u.displayName,
        thumbnailUrl: `https://thumbnails.roblox.com/v1/games/icons?universeIds=${id}&returnPolicy=PlaceHolder&size=150x150&format=Png&isCircular=false`,
        visits: 0,
        updated: new Date(u.updateTime).toLocaleDateString(),
        isPublished: u.activePrivacyStatus === 'Public',
        genre: 'Unknown',
      }
    })

    return NextResponse.json(games)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: 'Failed to fetch games from Roblox API', detail: message }, { status: 502 })
  }
}
