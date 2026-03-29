import { auth, clerkClient } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

const OWNER_EMAIL = process.env.ADMIN_EMAIL ?? ''

/**
 * Verifies the request is from an ADMIN user.
 * Returns the user record on success, or a 401/403 NextResponse on failure.
 * Falls back to owner-email bypass when the DB is unavailable.
 */
export async function requireAdmin() {
  // Verify Clerk session
  let userId: string | null = null
  try {
    const session = await auth()
    userId = session.userId ?? null
  } catch {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), user: null }
  }
  if (!userId) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), user: null }
  }

  // Try DB lookup
  try {
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, email: true, role: true },
    })
    if (user && (user.role === 'ADMIN' || user.email === OWNER_EMAIL)) {
      return { error: null, user }
    }
    if (user) {
      return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), user: null }
    }
    // user not found in DB — fall through to owner bypass
  } catch {
    // DB unavailable — fall through to owner bypass
  }

  // Owner bypass: check Clerk email directly
  try {
    const client = await clerkClient()
    const clerkUser = await client.users.getUser(userId)
    const email =
      clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ?? null
    if (email === OWNER_EMAIL) {
      return { error: null, user: { id: userId, email, role: 'ADMIN' } }
    }
  } catch {
    // Clerk SDK unavailable
  }

  return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), user: null }
}
