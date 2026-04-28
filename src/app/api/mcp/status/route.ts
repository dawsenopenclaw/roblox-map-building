import { NextRequest, NextResponse } from 'next/server'
import { extractApiKey, verifyApiKey } from '@/lib/api-key-auth'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

/**
 * GET /api/mcp/status
 * Returns user's Studio connection status, token balance, and tier.
 * Supports both API key auth and Clerk session auth.
 */
export async function GET(req: NextRequest) {
  let userId: string | null = null

  // API key auth
  const rawKey = extractApiKey(req)
  if (rawKey) {
    const keyUser = await verifyApiKey(rawKey)
    if (!keyUser) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }
    userId = keyUser.userId
  }

  // Clerk session fallback
  if (!userId) {
    try {
      const session = await auth()
      if (session?.userId) {
        const dbUser = await db.user.findUnique({
          where: { clerkId: session.userId },
          select: { id: true },
        })
        userId = dbUser?.id ?? null
      }
    } catch {
      // Clerk unavailable
    }
  }

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch user info — wrap in try/catch for resilience
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        tokenBalance: { select: { balance: true } },
        subscription: { select: { tier: true, status: true } },
      },
    })

    return NextResponse.json({
      studioConnected: false,
      placeName: null,
      tokenBalance: user?.tokenBalance?.balance ?? 0,
      tier: user?.subscription?.tier ?? 'FREE',
      subscriptionStatus: user?.subscription?.status ?? 'none',
    })
  } catch (err) {
    console.error('[mcp/status] DB error:', err instanceof Error ? err.message : err)
    return NextResponse.json({
      studioConnected: false,
      placeName: null,
      tokenBalance: 0,
      tier: 'FREE',
      subscriptionStatus: 'unknown',
    })
  }
}
