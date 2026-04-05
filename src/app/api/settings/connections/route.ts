import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'

type Platform = 'roblox' | 'github'

const ConnectSchema = z.object({
  platform: z.enum(['roblox', 'github']),
  username: z.string().min(1).max(100).trim(),
})

const DisconnectSchema = z.object({
  platform: z.enum(['roblox', 'github']),
})

function platformToField(platform: Platform): 'robloxHandle' | 'githubHandle' {
  return platform === 'roblox' ? 'robloxHandle' : 'githubHandle'
}

// ─── GET /api/settings/connections ───────────────────────────────────────────

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({
      where: { clerkId },
      select: { robloxHandle: true, githubHandle: true, updatedAt: true },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    return NextResponse.json({
      roblox: {
        connected: !!user.robloxHandle,
        username: user.robloxHandle ?? null,
        connectedAt: user.robloxHandle
          ? user.updatedAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          : null,
      },
      github: {
        connected: !!user.githubHandle,
        username: user.githubHandle ?? null,
        connectedAt: user.githubHandle
          ? user.updatedAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          : null,
      },
    })
  } catch (err) {
    Sentry.captureException(err)
    return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 })
  }
}

// ─── POST /api/settings/connections — save a username ────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body: unknown = await req.json()
    const parsed = ConnectSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 422 },
      )
    }

    const { platform, username } = parsed.data
    const field = platformToField(platform)

    await db.user.update({
      where: { clerkId },
      data: { [field]: username },
    })

    return NextResponse.json({
      connected: true,
      platform,
      username,
    })
  } catch (err) {
    Sentry.captureException(err)
    return NextResponse.json({ error: 'Failed to save connection' }, { status: 500 })
  }
}

// ─── DELETE /api/settings/connections — disconnect ───────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body: unknown = await req.json()
    const parsed = DisconnectSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 422 },
      )
    }

    const field = platformToField(parsed.data.platform)

    await db.user.update({
      where: { clerkId },
      data: { [field]: null },
    })

    return NextResponse.json({ disconnected: true, platform: parsed.data.platform })
  } catch (err) {
    Sentry.captureException(err)
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
  }
}
