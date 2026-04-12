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
  //
  // We write to BOTH publicMetadata and unsafeMetadata. Clerk's default JWT
  // template includes unsafeMetadata but not publicMetadata, so writing to
  // unsafeMetadata guarantees the middleware sees the dateOfBirth claim even
  // on deployments that haven't set up a custom JWT template with
  // publicMetadata exposed. Without this, the user completes the age gate
  // -> metadata saved on Clerk's server -> middleware JWT has no
  // publicMetadata claim -> user is redirected back to the age gate in an
  // infinite loop.
  //
  // We also read `externalAccounts` off the Clerk user and extract the
  // Roblox user ID + username if the user signed in via the Roblox custom
  // OAuth provider. Those fields then flow to the DB below so the Studio
  // plugin can connect the player to their ForjeGames account automatically.
  let robloxUserIdFromClerk: string | null = null
  let robloxUsernameFromClerk: string | null = null
  try {
    const client = await clerkClient()
    const clerkUser = await client.users.getUser(clerkId)
    const existingPublic = (clerkUser.publicMetadata ?? {}) as Record<string, unknown>
    const existingUnsafe = (clerkUser.unsafeMetadata ?? {}) as Record<string, unknown>

    // Find the Roblox external account. Clerk custom OAuth providers appear
    // with `provider: 'oauth_custom_<slug>'` so we match any slug containing
    // 'roblox' to be tolerant of slug rename.
    const robloxAccount = clerkUser.externalAccounts?.find((acc) => {
      const provider = (acc as { provider?: string }).provider ?? ''
      return provider.toLowerCase().includes('roblox')
    })
    if (robloxAccount) {
      // providerUserId is the OAuth subject — for Roblox this is the numeric
      // Roblox user ID. username is the Roblox username.
      robloxUserIdFromClerk =
        (robloxAccount as { providerUserId?: string; externalId?: string }).providerUserId ??
        (robloxAccount as { externalId?: string }).externalId ??
        null
      robloxUsernameFromClerk =
        (robloxAccount as { username?: string | null }).username ?? null
    }

    await client.users.updateUserMetadata(clerkId, {
      publicMetadata: {
        ...existingPublic,
        dateOfBirth: dob.toISOString(),
        isUnder13: under13,
        ...(robloxUserIdFromClerk ? { robloxUserId: robloxUserIdFromClerk } : {}),
        ...(robloxUsernameFromClerk ? { robloxUsername: robloxUsernameFromClerk } : {}),
      },
      unsafeMetadata: {
        ...existingUnsafe,
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

    // Only set robloxUserId/username on the existing user if we actually
    // read them from Clerk this turn — otherwise we'd clobber a manually
    // linked account (e.g. via /api/payments/robux/link).
    const robloxUpdate: { robloxUserId?: string; robloxUsername?: string } = {}
    if (robloxUserIdFromClerk) robloxUpdate.robloxUserId = robloxUserIdFromClerk
    if (robloxUsernameFromClerk) robloxUpdate.robloxUsername = robloxUsernameFromClerk

    if (existingUser) {
      await db.user.update({
        where: { clerkId },
        data: {
          dateOfBirth: dob,
          isUnder13: under13,
          ...robloxUpdate,
        },
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
          data: {
            clerkId,
            email,
            displayName,
            avatarUrl,
            dateOfBirth: dob,
            isUnder13: under13,
            ...robloxUpdate,
          },
        })
        await tx.subscription.create({
          data: { userId: user.id, stripeCustomerId: `pending_${user.id}`, tier: 'FREE', status: 'ACTIVE' },
        })
        await tx.tokenBalance.upsert({
          where: { userId: user.id },
          create: { userId: user.id, balance: 1000, lifetimeEarned: 1000 },
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
    // Under-13: collect parental consent before proceeding.
    // 13+: proceed through the onboarding wizard (profile, template, first build).
    redirect: under13 ? '/onboarding/parental-consent' : '/onboarding',
  })
}
