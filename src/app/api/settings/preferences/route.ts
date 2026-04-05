import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'

const PreferencesSchema = z.object({
  theme:       z.string().max(64).optional(),
  fontSize:    z.enum(['small', 'medium', 'large']).optional(),
  accentColor: z.string().max(32).optional().nullable(),
})

export type UserPreferences = z.infer<typeof PreferencesSchema>

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({
      where: { clerkId },
      select: { preferences: true },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    return NextResponse.json({ preferences: user.preferences ?? {} })
  } catch (err) {
    Sentry.captureException(err)
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body: unknown = await req.json()
    const parsed = PreferencesSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 422 },
      )
    }

    // Merge with existing preferences so a partial update doesn't wipe other keys
    const existing = await db.user.findUnique({
      where: { clerkId },
      select: { preferences: true },
    })

    const merged = {
      ...(typeof existing?.preferences === 'object' && existing.preferences !== null
        ? (existing.preferences as Record<string, unknown>)
        : {}),
      ...parsed.data,
    }

    await db.user.update({
      where: { clerkId },
      data: { preferences: merged },
    })

    return NextResponse.json({ preferences: merged })
  } catch (err) {
    Sentry.captureException(err)
    return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 })
  }
}
