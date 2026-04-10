import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getRobloxUser, getRobloxAvatar } from '@/lib/roblox-identity'
import { z } from 'zod'

// ─── GET /api/roblox/link — link status ─────────────────────────────────────
// Returns the current Roblox link status for the authenticated user.
// ─────────────────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { clerkId },
      select: {
        robloxUserId: true,
        robloxUsername: true,
        robloxDisplayName: true,
        robloxAvatarUrl: true,
        robloxVerifiedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      linked: !!user.robloxUserId,
      robloxUserId: user.robloxUserId,
      robloxUsername: user.robloxUsername,
      robloxDisplayName: user.robloxDisplayName,
      robloxAvatarUrl: user.robloxAvatarUrl,
      robloxVerifiedAt: user.robloxVerifiedAt,
    })
  } catch (error) {
    console.error('[roblox/link] Status error:', error)
    return NextResponse.json(
      { error: 'Failed to load Roblox link status.' },
      { status: 500 },
    )
  }
}

// ─── POST /api/roblox/link ───────────────────────────────────────────────────
// Links a Roblox account to the current user.
// Verification: the user's Roblox profile description must contain the
// provided verification code, OR the user can be verified via the
// /api/roblox/verify endpoint first.
// ─────────────────────────────────────────────────────────────────────────────

const LinkSchema = z.object({
  robloxUserId: z.string().min(1).max(20).trim(),
  robloxUsername: z.string().min(1).max(50).trim(),
  verificationCode: z.string().min(1).max(100).trim(),
})

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: unknown = await req.json()
    const parsed = LinkSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 422 },
      )
    }

    const { robloxUserId, robloxUsername, verificationCode } = parsed.data

    // Check that this Roblox account isn't already linked to another ForjeGames user
    const existingLink = await db.user.findFirst({
      where: { robloxUserId, NOT: { clerkId } },
      select: { id: true },
    })
    if (existingLink) {
      return NextResponse.json(
        { error: 'This Roblox account is already linked to another ForjeGames account.' },
        { status: 409 },
      )
    }

    // Verify the Roblox account exists and fetch profile description
    const robloxUser = await getRobloxUser(robloxUserId)
    if (!robloxUser) {
      return NextResponse.json(
        { error: 'Could not find that Roblox account. Please check the user ID.' },
        { status: 404 },
      )
    }

    // Verify ownership: the user's Roblox profile description must contain the code
    const description = (robloxUser.description ?? '').toLowerCase()
    if (!description.includes(verificationCode.toLowerCase())) {
      return NextResponse.json(
        {
          error: 'Verification failed. Please add the verification code to your Roblox profile description and try again.',
          hint: `Add "${verificationCode}" to your Roblox profile "About" section.`,
        },
        { status: 403 },
      )
    }

    // Fetch avatar thumbnail
    const avatarUrl = await getRobloxAvatar(robloxUserId)

    // Update the user record with verified Roblox identity
    await db.user.update({
      where: { clerkId },
      data: {
        robloxUserId,
        robloxUsername: robloxUser.name, // Use the canonical name from Roblox API
        robloxDisplayName: robloxUser.displayName,
        robloxAvatarUrl: avatarUrl,
        robloxVerifiedAt: new Date(),
      },
    })

    return NextResponse.json({
      linked: true,
      robloxUserId,
      robloxUsername: robloxUser.name,
      robloxDisplayName: robloxUser.displayName,
      robloxAvatarUrl: avatarUrl,
    })
  } catch (error) {
    console.error('[roblox/link] Error:', error)
    return NextResponse.json(
      { error: 'Failed to link Roblox account. Please try again.' },
      { status: 500 },
    )
  }
}

// ─── DELETE /api/roblox/link — unlink ────────────────────────────────────────

export async function DELETE() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await db.user.update({
      where: { clerkId },
      data: {
        robloxUserId: null,
        robloxUsername: null,
        robloxDisplayName: null,
        robloxAvatarUrl: null,
        robloxVerifiedAt: null,
      },
    })

    return NextResponse.json({ unlinked: true })
  } catch (error) {
    console.error('[roblox/link] Unlink error:', error)
    return NextResponse.json(
      { error: 'Failed to unlink Roblox account.' },
      { status: 500 },
    )
  }
}
