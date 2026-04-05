import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
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

// ─── Map DB types to UI types ────────────────────────────────────────────────

const DB_TYPE_TO_UI: Record<string, NotificationType> = {
  BUILD_COMPLETE: 'build',
  BUILD_FAILED: 'build',
  TOKEN_LOW: 'system',
  TOKEN_DEPLETED: 'system',
  SALE: 'sale',
  REFERRAL_EARNED: 'sale',
  TEMPLATE_PURCHASED: 'sale',
  PAYOUT_COMPLETED: 'sale',
  PAYOUT_FAILED: 'sale',
  TEAM_INVITE: 'team',
  ACHIEVEMENT_UNLOCKED: 'achievement',
  SYSTEM: 'system',
  WEEKLY_DIGEST: 'system',
  REVIEW_RECEIVED: 'system',
}

// ─── Demo data (fallback for unauthenticated / demo mode) ────────────────────

const now = Date.now()
const mins = (n: number) => new Date(now - n * 60_000).toISOString()

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

// In-memory state for demo mode
const readSet = new Set<string>()
const deletedSet = new Set<string>()

// ─── GET /api/notifications ───────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    const demoMode = process.env.DEMO_MODE === 'true' || !clerkId

    if (demoMode) {
      const notifications = DEMO_NOTIFICATIONS.filter((n) => !deletedSet.has(n.id)).map((n) => ({
        ...n,
        read: n.read || readSet.has(n.id),
      }))
      return NextResponse.json({ notifications, total: notifications.length, demo: true })
    }

    // Real DB path
    const user = await db.user.findUnique({
      where: { clerkId },
      select: { id: true },
    })
    if (!user) {
      return NextResponse.json({ notifications: [], total: 0 })
    }

    const url = new URL(req.url)
    const limit = Math.min(Number(url.searchParams.get('limit')) || 20, 50)
    const cursor = url.searchParams.get('cursor') || undefined
    const unreadOnly = url.searchParams.get('unread') === 'true'

    const dbNotifications = await db.notification.findMany({
      where: {
        userId: user.id,
        ...(unreadOnly ? { read: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })

    const hasMore = dbNotifications.length > limit
    const items = dbNotifications.slice(0, limit)

    const notifications: Notification[] = items.map((n) => ({
      id: n.id,
      type: DB_TYPE_TO_UI[n.type] || 'system',
      title: n.title,
      description: n.body,
      timestamp: n.createdAt.toISOString(),
      read: n.read,
      href: n.actionUrl || undefined,
    }))

    const unreadCount = await db.notification.count({
      where: { userId: user.id, read: false },
    })

    return NextResponse.json({
      notifications,
      total: notifications.length,
      unreadCount,
      hasMore,
      nextCursor: hasMore ? items[items.length - 1].id : undefined,
    })
  } catch (err) {
    console.error('[api/notifications] GET failed:', err)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

// ─── PATCH /api/notifications — mark as read ─────────────────────────────────

export async function PATCH(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    const demoMode = process.env.DEMO_MODE === 'true' || !clerkId

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

    // Real DB path
    const user = await db.user.findUnique({
      where: { clerkId },
      select: { id: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const now = new Date()
    if (markAll) {
      await db.notification.updateMany({
        where: { userId: user.id, read: false },
        data: { read: true, readAt: now },
      })
    } else if (ids && ids.length > 0) {
      await db.notification.updateMany({
        where: { id: { in: ids }, userId: user.id },
        data: { read: true, readAt: now },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/notifications] PATCH failed:', err)
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
}

// ─── DELETE /api/notifications ────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    const demoMode = process.env.DEMO_MODE === 'true' || !clerkId

    const parsed = await parseBody(req, notificationDeleteSchema)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status })
    }
    const { id } = parsed.data

    if (demoMode) {
      deletedSet.add(id)
      return NextResponse.json({ ok: true })
    }

    // Real DB path
    const user = await db.user.findUnique({
      where: { clerkId },
      select: { id: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    await db.notification.deleteMany({
      where: { id, userId: user.id },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/notifications] DELETE failed:', err)
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 })
  }
}
