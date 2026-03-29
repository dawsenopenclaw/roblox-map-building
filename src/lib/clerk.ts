import { auth } from '@clerk/nextjs/server'
import { db } from './db'

export async function getAuthUser() {
  const { userId } = await auth()
  if (!userId) return null
  try {
    return await db.user.findUnique({
      where: { clerkId: userId },
      include: { subscription: true, tokenBalance: true },
    })
  } catch {
    // DB unreachable — return a minimal stub so the app can still render.
    // Pages should treat a null subscription/tokenBalance as the FREE tier.
    return null
  }
}

/**
 * Returns the DB user record, or a minimal Clerk-only stub when the DB is
 * unavailable.  Never throws — callers should treat missing fields as FREE tier.
 */
export async function requireAuthUser() {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  try {
    const dbUser = await db.user.findUnique({
      where: { clerkId: userId },
      include: { subscription: true, tokenBalance: true },
    })
    if (dbUser) return dbUser
    // Row doesn't exist yet (race with webhook) — return stub
  } catch {
    // DB unreachable — fall through to stub
  }

  // Minimal stub: authenticated via Clerk but no DB row available.
  // Shape matches the Prisma User select enough for dashboard/layout usage.
  // id is set to clerkId so admin/app layouts that reference user.id don't crash.
  // role defaults to 'USER' so admin gate redirects safely instead of crashing.
  return {
    id: userId,
    clerkId: userId,
    email: null,
    displayName: null,
    firstName: null,
    role: 'USER' as const,
    isUnder13: false,
    parentConsentAt: null,
    createdAt: new Date(),
    subscription: null,
    tokenBalance: null,
  } as const
}
