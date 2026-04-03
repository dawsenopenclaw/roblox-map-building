import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { isUnder13 } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  // Must be a past date — future dates would falsely pass the isUnder13 check
  // (a future DOB is always > thirteenYearsAgo, so isUnder13 returns false).
  dateOfBirth: z
    .string()
    .datetime()
    .refine((val) => new Date(val) < new Date(), {
      message: 'Date of birth must be in the past',
    })
    .refine((val) => new Date(val).getUTCFullYear() >= 1900, {
      message: 'Date of birth must be 1900 or later',
    }),
})

export async function POST(req: NextRequest) {
  let clerkId: string | null = null
  try {
    const session = await auth()
    clerkId = session?.userId ?? null
  } catch { /* demo mode — Clerk not configured */ }

  if (!clerkId) {
    return NextResponse.json({ demo: true, redirectUrl: '/editor' })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid date' }, { status: 400 })

  const dob = new Date(parsed.data.dateOfBirth)
  const under13 = isUnder13(dob)

  // Always store DOB in Clerk metadata so the middleware age-gate check passes.
  // This works even without a database (local dev without PostgreSQL).
  try {
    const client = await clerkClient()
    const clerkUser = await client.users.getUser(clerkId)
    const existing = (clerkUser.publicMetadata ?? {}) as Record<string, unknown>
    await client.users.updateUserMetadata(clerkId, {
      publicMetadata: {
        ...existing,
        dateOfBirth: dob.toISOString(),
        isUnder13: under13,
      },
    })
  } catch (clerkErr) {
    console.error('[onboarding] Clerk metadata update failed:', clerkErr)
    return NextResponse.json({ error: 'Failed to save. Please try again.' }, { status: 500 })
  }

  // Persist to DB if available (production + local with PostgreSQL running)
  try {
    const existingUser = await db.user.findUnique({ where: { clerkId } })

    if (existingUser) {
      await db.user.update({
        where: { clerkId },
        data: { dateOfBirth: dob, isUnder13: under13 },
      })
    } else {
      // Webhook hasn't created the user yet — create inline
      let email = `${clerkId}@placeholder.local`
      let displayName: string | null = null
      let avatarUrl: string | null = null
      try {
        const client = await clerkClient()
        const clerkUser = await client.users.getUser(clerkId)
        const primary = clerkUser.emailAddresses.find(
          (e) => e.id === clerkUser.primaryEmailAddressId
        )
        if (primary) email = primary.emailAddress
        displayName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null
        avatarUrl = clerkUser.imageUrl
      } catch { /* use placeholder */ }

      await db.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: { clerkId, email, displayName, avatarUrl, dateOfBirth: dob, isUnder13: under13 },
        })
        await tx.subscription.create({
          data: { userId: user.id, stripeCustomerId: `pending_${user.id}`, tier: 'FREE', status: 'ACTIVE' },
        })
        await tx.tokenBalance.upsert({
          where: { userId: user.id },
          create: { userId: user.id, balance: 100, lifetimeEarned: 100 },
          update: {}, // already exists — first writer wins, leave balance untouched
        })
      })
    }
  } catch (dbErr) {
    // DB unavailable (no PostgreSQL in local dev) — not fatal since
    // Clerk metadata was already saved above. Log and continue.
    console.warn('[onboarding] DB write skipped (DB unavailable):', (dbErr as Error).message)
  }

  return NextResponse.json({
    isUnder13: under13,
    redirect: under13 ? '/onboarding/parental-consent' : '/editor',
  })
}
