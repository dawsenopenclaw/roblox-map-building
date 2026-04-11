import 'server-only'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

/**
 * Comma-separated admin email list from env. Case-insensitive matching.
 */
function isOwnerEmail(email: string | null): boolean {
  if (!email) return false
  const list = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  return list.includes(email.toLowerCase())
}

/**
 * Verifies the current request is from an admin user.
 *
 * Checks in order:
 *   1. Clerk session exists (userId)
 *   2. DB user has role === 'ADMIN' or email in ADMIN_EMAILS
 *   3. Fallback: Clerk primary email in ADMIN_EMAILS (for pre-DB-sync users)
 *
 * @returns The authenticated user's ID.
 * @throws {AdminGuardError} with statusCode 401 or 403 if not authorized.
 */
export async function requireAdmin(): Promise<string> {
  // 1. Verify Clerk session
  let userId: string | null = null
  try {
    const session = await auth()
    userId = session.userId ?? null
  } catch {
    throw new AdminGuardError('Unauthorized', 401)
  }
  if (!userId) {
    throw new AdminGuardError('Unauthorized', 401)
  }

  // 2. Try DB lookup
  try {
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, email: true, role: true },
    })
    if (user && (user.role === 'ADMIN' || isOwnerEmail(user.email))) {
      return user.id
    }
    if (user) {
      throw new AdminGuardError('Forbidden', 403)
    }
    // user not found in DB -- fall through to owner bypass
  } catch (e) {
    if (e instanceof AdminGuardError) throw e
    // DB unavailable -- fall through to owner bypass
  }

  // 3. Owner bypass via Clerk email
  try {
    const client = await clerkClient()
    const clerkUser = await client.users.getUser(userId)
    const email =
      clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
        ?.emailAddress ?? null
    if (isOwnerEmail(email)) {
      return userId
    }
  } catch {
    // Clerk SDK unavailable
  }

  throw new AdminGuardError('Forbidden', 403)
}

/**
 * Typed error thrown by requireAdmin() so callers can inspect the status code.
 */
export class AdminGuardError extends Error {
  readonly statusCode: number

  constructor(message: string, statusCode: number) {
    super(message)
    this.name = 'AdminGuardError'
    this.statusCode = statusCode
  }
}
