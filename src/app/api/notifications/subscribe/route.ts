import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

/**
 * POST /api/notifications/subscribe
 * Store a web push subscription for the authenticated user.
 * The subscription is stored in the user's preferences JSON field
 * to match the pattern used by notifications-server.ts.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const subscription = body.subscription

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ error: 'Invalid push subscription' }, { status: 400 })
    }

    // Store in user preferences JSON field
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    })

    const prefs = (user?.preferences as Record<string, unknown>) ?? {}
    prefs.pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    }

    await db.user.update({
      where: { id: userId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { preferences: prefs as any },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[subscribe] Failed to save push subscription:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

/**
 * DELETE /api/notifications/subscribe
 * Remove the push subscription for the authenticated user.
 */
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const endpoint = body.endpoint

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    })

    const prefs = (user?.preferences as Record<string, unknown>) ?? {}
    const stored = prefs.pushSubscription as { endpoint?: string } | undefined

    // Only delete if the endpoint matches (prevent removing someone else's sub)
    if (stored?.endpoint === endpoint || !endpoint) {
      delete prefs.pushSubscription
      await db.user.update({
        where: { id: userId },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { preferences: prefs as any },
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[subscribe] Failed to remove push subscription:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
