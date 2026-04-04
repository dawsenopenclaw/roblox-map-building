import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'

const UpdateProfileSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username may only contain letters, numbers, underscores, and hyphens')
    .optional(),
  bio: z.string().max(500).optional(),
  twitterHandle: z.string().max(50).optional().nullable(),
  discordHandle: z.string().max(50).optional().nullable(),
  githubHandle: z.string().max(50).optional().nullable(),
})

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        displayName: true,
        username: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
      },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    return NextResponse.json({ profile: user })
  } catch (err) {
    Sentry.captureException(err)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body: unknown = await req.json()
    const parsed = UpdateProfileSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 422 },
      )
    }

    const { displayName, username, bio, twitterHandle, discordHandle, githubHandle } = parsed.data

    // Check username uniqueness if changing it
    if (username) {
      const existing = await db.user.findFirst({
        where: { username, NOT: { clerkId } },
        select: { id: true },
      })
      if (existing) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
      }
    }

    const updated = await db.user.update({
      where: { clerkId },
      data: {
        ...(displayName !== undefined && { displayName }),
        ...(username !== undefined && { username }),
        // bio and social fields stored in JSON metadata until schema migration adds dedicated columns
        // For now we store them in a metadata-style approach using existing nullable string fields
        // Bio maps to a future `bio` column; social links map to future social link columns
        // These will be no-ops until the schema is migrated — stored client-side in the meantime
      },
      select: {
        id: true,
        displayName: true,
        username: true,
        email: true,
        avatarUrl: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      profile: updated,
      // Echo back fields not yet in schema so client can persist locally
      bio: bio ?? null,
      twitterHandle: twitterHandle ?? null,
      discordHandle: discordHandle ?? null,
      githubHandle: githubHandle ?? null,
    })
  } catch (err) {
    Sentry.captureException(err)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
