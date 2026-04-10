/**
 * /api/payments/robux/link
 *
 * POST — Link a Roblox account to the current ForjeGames user.
 *   Body: { robloxUserId: number, verificationCode: string }
 *   The verification code is displayed in the ForjeGames Roblox experience
 *   and must match the one stored server-side for that robloxUserId.
 *
 * GET — Returns the linked Roblox account info for the current user.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'

// ── Validation ──────────────────────────────────────────────────────────────

const linkSchema = z.object({
  robloxUserId: z.number().int().positive(),
  verificationCode: z.string().min(4).max(10),
})

// ── In-memory verification code store ───────────────────────────────────────
// In production, these would be stored in Redis or the database with TTL.
// The Roblox game generates a code, sends it to /api/payments/robux/link/code
// (or stores it server-side), and the user enters it here.

// For now, we validate against a simple HMAC-based code derivation:
// code = first 6 chars of HMAC(ROBUX_WEBHOOK_SECRET, robloxUserId).toUpperCase()
// This way both the Lua script and this endpoint can derive the same code
// without needing a shared store.

import { createHmac } from 'crypto'

function deriveVerificationCode(robloxUserId: number): string {
  const secret = process.env.ROBUX_WEBHOOK_SECRET ?? 'dev-secret'
  const hmac = createHmac('sha256', secret)
    .update(`link:${robloxUserId}`)
    .digest('hex')
  return hmac.substring(0, 6).toUpperCase()
}

// ── GET — Return linked Roblox account info ─────────────────────────────────

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { db } = await import('@/lib/db')
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

    if (!user.robloxUserId) {
      return NextResponse.json({ linked: false })
    }

    return NextResponse.json({
      linked: true,
      robloxUserId: user.robloxUserId,
      robloxUsername: user.robloxUsername,
      robloxDisplayName: user.robloxDisplayName,
      robloxAvatarUrl: user.robloxAvatarUrl,
      linkedAt: user.robloxVerifiedAt,
    })
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'payments/robux/link' } })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── POST — Link Roblox account ──────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const raw = await req.json().catch(() => ({}))
    const parsed = linkSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { robloxUserId, verificationCode } = parsed.data

    // Verify the code
    const expectedCode = deriveVerificationCode(robloxUserId)
    if (verificationCode.toUpperCase() !== expectedCode) {
      return NextResponse.json(
        { error: 'Invalid verification code. Make sure you copied it from the ForjeGames Roblox experience.' },
        { status: 400 },
      )
    }

    const { db } = await import('@/lib/db')

    // Check if this Roblox account is already linked to another user
    const existingLink = await db.user.findFirst({
      where: {
        robloxUserId: String(robloxUserId),
        NOT: { clerkId },
      },
      select: { id: true },
    })

    if (existingLink) {
      return NextResponse.json(
        { error: 'This Roblox account is already linked to another ForjeGames account.' },
        { status: 409 },
      )
    }

    // Link the account
    const user = await db.user.update({
      where: { clerkId },
      data: {
        robloxUserId: String(robloxUserId),
        robloxVerifiedAt: new Date(),
      },
      select: {
        robloxUserId: true,
        robloxUsername: true,
        robloxDisplayName: true,
        robloxAvatarUrl: true,
        robloxVerifiedAt: true,
      },
    })

    // After linking, check if there are any unclaimed Robux purchases for this user
    const { earnTokens } = await import('@/lib/tokens-server')
    const unclaimed = await db.auditLog.findMany({
      where: {
        action: 'ROBUX_PURCHASE_UNCLAIMED',
        metadata: { path: ['robloxUserId'], equals: robloxUserId },
      },
    })

    let creditsClaimed = 0
    for (const entry of unclaimed) {
      const meta = entry.metadata as Record<string, unknown> | null
      const credits = (meta?.credits as number) ?? 0
      if (credits > 0) {
        await earnTokens(
          (await db.user.findUnique({ where: { clerkId }, select: { id: true } }))!.id,
          credits,
          'PURCHASE',
          `Claimed Robux purchase: ${meta?.productId ?? meta?.tier ?? 'unknown'} (${credits} credits)`,
          { source: 'robux_claim', originalAuditId: entry.id, ...meta },
        )
        creditsClaimed += credits
      }

      // Mark as claimed
      await db.auditLog.update({
        where: { id: entry.id },
        data: {
          action: 'ROBUX_PURCHASE_COMPLETED',
          userId: (await db.user.findUnique({ where: { clerkId }, select: { id: true } }))!.id,
          metadata: {
            ...(meta ?? {}),
            status: 'claimed_after_link',
            claimedAt: new Date().toISOString(),
          },
        },
      })
    }

    // Audit log
    const linkedUser = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
    await db.auditLog.create({
      data: {
        action: 'ROBLOX_ACCOUNT_LINKED',
        resource: 'user',
        resourceId: linkedUser!.id,
        userId: linkedUser!.id,
        metadata: {
          robloxUserId,
          creditsClaimed,
          unclaimedPurchases: unclaimed.length,
        },
      },
    })

    return NextResponse.json({
      success: true,
      linked: true,
      robloxUserId: user.robloxUserId,
      robloxUsername: user.robloxUsername,
      robloxDisplayName: user.robloxDisplayName,
      linkedAt: user.robloxVerifiedAt,
      creditsClaimed,
    })
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'payments/robux/link' } })
    console.error('[payments/robux/link] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
