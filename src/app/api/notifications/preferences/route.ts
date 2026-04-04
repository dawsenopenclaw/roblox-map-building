import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { parseBody } from '@/lib/validations'
import { db } from '@/lib/db'
import {
  getUserPreferences,
  updatePreference,
  bulkUpdatePreferences,
  updatePhone,
} from '@/lib/notification-preferences'

// ─── Validation ──────────────────────────────────────────────────────────────

const NOTIFICATION_TYPES = [
  'BUILD_COMPLETE', 'BUILD_FAILED', 'TOKEN_LOW', 'TOKEN_DEPLETED',
  'SALE', 'REFERRAL_EARNED', 'TEAM_INVITE', 'ACHIEVEMENT_UNLOCKED',
  'SYSTEM', 'WEEKLY_DIGEST',
] as const

const CHANNELS = ['EMAIL', 'SMS', 'PUSH', 'IN_APP'] as const

const updatePreferenceSchema = z.object({
  type: z.enum(NOTIFICATION_TYPES),
  channel: z.enum(CHANNELS),
  enabled: z.boolean(),
})

const bulkUpdateSchema = z.object({
  preferences: z.array(updatePreferenceSchema).min(1).max(100),
  phone: z.string().regex(/^\+[1-9]\d{6,14}$/, 'Phone must be E.164 format (e.g. +15551234567)').nullish(),
})

// ─── GET /api/notifications/preferences ──────────────────────────────────────

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { clerkId },
      select: { id: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const result = await getUserPreferences(user.id)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[api/notifications/preferences] GET failed:', err)
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
  }
}

// ─── PUT /api/notifications/preferences ──────────────────────────────────────

export async function PUT(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { clerkId },
      select: { id: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const parsed = await parseBody(req, bulkUpdateSchema)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status })
    }

    const { preferences, phone } = parsed.data

    // Update phone if provided
    if (phone !== undefined) {
      await updatePhone(user.id, phone ?? null)
    }

    // Bulk update preferences
    await bulkUpdatePreferences(
      user.id,
      preferences.map((p) => ({
        type: p.type,
        channel: p.channel,
        enabled: p.enabled,
      }))
    )

    // Return fresh state
    const result = await getUserPreferences(user.id)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[api/notifications/preferences] PUT failed:', err)
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
  }
}

// ─── PATCH /api/notifications/preferences — single update ────────────────────

export async function PATCH(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { clerkId },
      select: { id: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const parsed = await parseBody(req, updatePreferenceSchema)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status })
    }

    await updatePreference(user.id, parsed.data.type, parsed.data.channel, parsed.data.enabled)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/notifications/preferences] PATCH failed:', err)
    return NextResponse.json({ error: 'Failed to update preference' }, { status: 500 })
  }
}
