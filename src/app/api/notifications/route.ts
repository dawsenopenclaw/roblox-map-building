import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { notificationMarkReadSchema, notificationDeleteSchema, parseBody } from '@/lib/validations'

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType = 'build' | 'achievement' | 'sale' | 'team' | 'system'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  description: string
  timestamp: string
  read: boolean
  href?: string
}

// ─── Demo data ────────────────────────────────────────────────────────────────

const now = Date.now()
const mins = (n: number) => new Date(now - n * 60_000).toISOString()
const hrs  = (n: number) => new Date(now - n * 3_600_000).toISOString()
const days = (n: number) => new Date(now - n * 86_400_000).toISOString()

const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif_1',
    type: 'achievement',
    title: 'Welcome to ForjeGames!',
    description: 'You have 1,000 free tokens. Start building your first Roblox map today.',
    timestamp: mins(1),
    read: false,
    href: '/editor',
  },
  {
    id: 'notif_2',
    type: 'sale',
    title: 'New marketplace templates available',
    description: 'Fresh templates added across 6 categories — maps, scripts, UI kits and more.',
    timestamp: mins(5),
    read: false,
    href: '/marketplace',
  },
  {
    id: 'notif_3',
    type: 'build',
    title: 'Your build is ready to import',
    description: 'The Luau code for your last build is ready. Copy it and paste into Roblox Studio.',
    timestamp: mins(10),
    read: false,
    href: '/editor',
  },
]

// In-memory read state for demo mode (resets on server restart — acceptable for demo)
const readSet = new Set<string>()
const deletedSet = new Set<string>()

// ─── GET /api/notifications ───────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    const demoMode = process.env.DEMO_MODE === 'true' || !userId

    if (demoMode) {
      const notifications = DEMO_NOTIFICATIONS.filter((n) => !deletedSet.has(n.id)).map((n) => ({
        ...n,
        read: n.read || readSet.has(n.id),
      }))
      return NextResponse.json({ notifications, total: notifications.length, demo: true })
    }

    // Production path — swap with real DB query when schema is ready
    const notifications = DEMO_NOTIFICATIONS.filter((n) => !deletedSet.has(n.id)).map((n) => ({
      ...n,
      read: n.read || readSet.has(n.id),
    }))
    return NextResponse.json({ notifications, total: notifications.length })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

// ─── PATCH /api/notifications — mark as read ─────────────────────────────────

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth()
    const demoMode = process.env.DEMO_MODE === 'true' || !userId

    const parsed = await parseBody(req, notificationMarkReadSchema)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status })
    }
    const { ids, markAll } = parsed.data

    if (demoMode) {
      if (markAll) {
        DEMO_NOTIFICATIONS.forEach((n) => readSet.add(n.id))
      } else if (ids) {
        ids.forEach((id) => readSet.add(id))
      }
      return NextResponse.json({ ok: true })
    }

    // Production path
    if (markAll) {
      DEMO_NOTIFICATIONS.forEach((n) => readSet.add(n.id))
    } else if (ids) {
      ids.forEach((id) => readSet.add(id))
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
}

// ─── DELETE /api/notifications ────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth()
    const demoMode = process.env.DEMO_MODE === 'true' || !userId

    const parsed = await parseBody(req, notificationDeleteSchema)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status })
    }
    const { id } = parsed.data

    if (demoMode) {
      deletedSet.add(id)
      return NextResponse.json({ ok: true })
    }

    deletedSet.add(id)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 })
  }
}
