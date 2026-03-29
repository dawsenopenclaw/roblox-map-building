import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { XPEventType } from '@prisma/client'
import { grantXp } from '@/lib/xp-server'

// POST /api/gamification/earn-xp
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({
      where: { clerkId },
      select: { id: true },
    })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

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
  } catch (error) {
    console.error('Earn XP error:', error)
    return NextResponse.json(
      { error: 'Service temporarily unavailable', details: 'Database not connected' },
      { status: 503 }
    )
  }
}
