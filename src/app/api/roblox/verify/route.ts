import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getRobloxUser, getRobloxUserByName } from '@/lib/roblox-identity'
import { z } from 'zod'

// ─── POST /api/roblox/verify ─────────────────────────────────────────────────
// Checks whether a Roblox user's profile description contains the expected
// verification code. Accepts either robloxUserId or robloxUsername.
// Called by the frontend to confirm ownership before linking.
// ─────────────────────────────────────────────────────────────────────────────

const VerifySchema = z
  .object({
    robloxUserId: z.string().min(1).max(20).trim().optional(),
    robloxUsername: z.string().min(1).max(50).trim().optional(),
    verificationCode: z.string().min(1).max(100).trim().optional(),
  })
  .refine((d) => !!d.robloxUserId || !!d.robloxUsername, {
    message: 'robloxUserId or robloxUsername is required',
  })

/**
 * Generate a deterministic verification code from the clerk user ID.
 * This ensures each ForjeGames user has a unique, reproducible code.
 */
function generateVerificationCode(clerkId: string): string {
  // Simple hash-based code — deterministic so user can always find their code
  let hash = 0
  for (const ch of clerkId) {
    hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')
  return `FORJE-${hex}`
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: unknown = await req.json()
    const parsed = VerifySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 422 },
      )
    }

    const { robloxUserId, robloxUsername } = parsed.data
    const verificationCode = parsed.data.verificationCode ?? generateVerificationCode(clerkId)

    // Fetch the Roblox user's profile to check their description — by id or username
    const robloxUser = robloxUserId
      ? await getRobloxUser(robloxUserId)
      : await getRobloxUserByName(robloxUsername!)

    if (!robloxUser) {
      return NextResponse.json(
        { error: 'Could not find that Roblox user.', verified: false },
        { status: 404 },
      )
    }

    const description = (robloxUser.description ?? '').toLowerCase()
    const verified = description.includes(verificationCode.toLowerCase())

    return NextResponse.json({
      success: true,
      verified,
      robloxUserId: String(robloxUser.id),
      robloxUsername: robloxUser.name,
      robloxDisplayName: robloxUser.displayName,
      verificationCode,
    })
  } catch (error) {
    console.error('[roblox/verify] Error:', error)
    return NextResponse.json(
      { error: 'Verification check failed. Please try again.', verified: false },
      { status: 500 },
    )
  }
}
