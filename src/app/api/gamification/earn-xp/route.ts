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

// Types that may be called from the public API.
// ACHIEVEMENT, STREAK_BONUS, and SALE are server-internal only — they must be
// triggered by server-side logic (achievement unlock, streak calculation, Stripe
// webhook) and never accepted directly from a client request.
const PUBLIC_API_ALLOWED_TYPES = new Set([
  'BUILD',
  'PUBLISH',
  'REVIEW_GIVEN',
  'DAILY_LOGIN',
  'DAILY_CHALLENGE',
])

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

    const { type } = body as { type?: string }
    if (!type || !(type in XPEventType)) {
      return NextResponse.json({ error: 'Invalid XP event type' }, { status: 400 })
    }

    // Block server-internal types from direct API calls
    if (!PUBLIC_API_ALLOWED_TYPES.has(type)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Never trust client-supplied metadata — use no metadata for public API calls.
    // Variable-XP types like ACHIEVEMENT and SALE are blocked above, so all
    // remaining allowed types have fixed XP amounts in XP_AMOUNTS.
    const result = await grantXp(user.id, type as typeof XPEventType[keyof typeof XPEventType])
    return NextResponse.json(result)
  } catch {
    return NextResponse.json(DEMO_XP_RESULT)
  }
}
