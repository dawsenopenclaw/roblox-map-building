import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

const DEMO_XP_RESULT = {
  demo: true,
  xpAwarded: 50,
  totalXp: 1250,
  level: 3,
  leveledUp: false,
  newAchievements: [],
}

// POST /api/gamification/earn-xp
export async function POST(req: NextRequest) {
  let clerkId: string | null = null
  try {
    const session = await auth()
    clerkId = session?.userId ?? null
  } catch { /* demo mode */ }

  if (!clerkId) return NextResponse.json(DEMO_XP_RESULT)

  try {
    const { db } = await import('@/lib/db')
    const { XPEventType } = await import('@prisma/client')
    const { grantXp } = await import('@/lib/xp-server')

    const user = await db.user.findUnique({
      where: { clerkId },
      select: { id: true },
    })
    if (!user) return NextResponse.json(DEMO_XP_RESULT)

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { type, metadata } = body as { type?: string; metadata?: Record<string, unknown> }
    if (!type || !(type in XPEventType)) {
      return NextResponse.json({ error: 'Invalid XP event type' }, { status: 400 })
    }

    const result = await grantXp(user.id, type as XPEventType, metadata)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json(DEMO_XP_RESULT)
  }
}
