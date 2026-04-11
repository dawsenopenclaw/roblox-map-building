import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { earnTokens } from '@/lib/tokens-server'

// ─── POST /api/beta/invite ──────────────────────────────────────────────────
// Redeem an invite code. Grants betaAccess=true on the user and optionally
// credits bonus tokens. Validates:
//   - code exists
//   - not expired
//   - useCount < maxUses
//   - caller has not already redeemed a code (betaAccess still false)
// ────────────────────────────────────────────────────────────────────────────

const RedeemSchema = z.object({
  code: z.string().min(1).max(64).trim(),
})

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: unknown = await req.json().catch(() => ({}))
    const parsed = RedeemSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 422 },
      )
    }

    const code = parsed.data.code.toUpperCase()

    const user = await db.user.findUnique({
      where: { clerkId },
      select: { id: true, betaAccess: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.betaAccess) {
      return NextResponse.json(
        { error: 'You have already redeemed a beta invite code.' },
        { status: 409 },
      )
    }

    // Look up invite and validate in a single transaction so that concurrent
    // redemptions cannot race past the useCount limit.
    const result = await db.$transaction(async (tx) => {
      const invite = await tx.betaInvite.findUnique({ where: { code } })
      if (!invite) return { kind: 'not_found' as const }

      if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
        return { kind: 'expired' as const }
      }
      if (invite.useCount >= invite.maxUses) {
        return { kind: 'exhausted' as const }
      }

      // Atomic increment with a maxUses guard to prevent race conditions.
      const updated = await tx.betaInvite.updateMany({
        where: { code, useCount: { lt: invite.maxUses } },
        data: { useCount: { increment: 1 } },
      })
      if (updated.count === 0) {
        return { kind: 'exhausted' as const }
      }

      // Record the first redeemer separately — only set usedBy/usedAt if still
      // unset so we don't clobber the first-redeemer record on subsequent uses.
      if (!invite.usedById) {
        await tx.betaInvite.updateMany({
          where: { code, usedById: null },
          data: { usedById: user.id, usedAt: new Date() },
        })
      }

      await tx.user.update({
        where: { id: user.id },
        data: { betaAccess: true },
      })

      return { kind: 'ok' as const, bonusCredits: invite.bonusCredits, cohort: invite.cohort }
    })

    if (result.kind === 'not_found') {
      return NextResponse.json(
        { error: 'Invalid invite code. Please check and try again.' },
        { status: 404 },
      )
    }
    if (result.kind === 'expired') {
      return NextResponse.json(
        { error: 'This invite code has expired.' },
        { status: 410 },
      )
    }
    if (result.kind === 'exhausted') {
      return NextResponse.json(
        { error: 'This invite code has already been fully redeemed.' },
        { status: 409 },
      )
    }

    // Credit bonus tokens outside the transaction for cleaner error isolation.
    if (result.bonusCredits > 0) {
      try {
        await earnTokens(
          user.id,
          result.bonusCredits,
          'BONUS',
          `Beta invite bonus (${result.cohort ?? 'beta'})`,
          { betaCode: code, cohort: result.cohort },
        )
      } catch (err) {
        console.error('[beta/invite] Failed to credit bonus tokens:', err)
        // Continue — beta access was already granted, and the bonus can be
        // re-issued manually if needed. We do not unwind the redemption.
      }
    }

    return NextResponse.json({
      success: true,
      betaAccess: true,
      bonusCredits: result.bonusCredits,
      cohort: result.cohort,
      message:
        result.bonusCredits > 0
          ? `You're in! ${result.bonusCredits} bonus credits added to your balance.`
          : `You're in! Beta access granted.`,
    })
  } catch (err) {
    console.error('[beta/invite] Error:', err)
    return NextResponse.json(
      { error: 'Failed to redeem invite code. Please try again.' },
      { status: 500 },
    )
  }
}
