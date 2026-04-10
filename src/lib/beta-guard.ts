/**
 * Beta program access guard.
 *
 * When `BETA_REQUIRED=true` is set, /editor and other gated surfaces require
 * the user to have redeemed a valid invite code (User.betaAccess = true).
 *
 * `withBetaGuard()` is a thin helper that wraps a Server Component / action
 * body and redirects to `/beta/invite` when the current user lacks access.
 * Admins always bypass the check so they can still QA the site.
 */

import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

/** True when the beta flag is enabled in env. */
export function isBetaRequired(): boolean {
  return process.env.BETA_REQUIRED === 'true'
}

/**
 * Resolve whether a given Clerk user currently has beta access.
 * Admins and users with `betaAccess=true` are allowed. DB unavailability is
 * treated as "no access" to avoid silently bypassing the gate.
 */
export async function hasBetaAccess(clerkId: string | null | undefined): Promise<boolean> {
  if (!clerkId) return false
  if (!isBetaRequired()) return true
  try {
    const user = await db.user.findUnique({
      where: { clerkId },
      select: { betaAccess: true, role: true },
    })
    if (!user) return false
    return user.betaAccess || user.role === 'ADMIN'
  } catch {
    return false
  }
}

/**
 * Server-side guard for pages that require beta access.
 * Redirects to `/beta/invite` when the user does not have access.
 * Use at the top of a server component:
 *
 *   export default async function Page() {
 *     await withBetaGuard()
 *     // ...
 *   }
 */
export async function withBetaGuard(redirectTo: string = '/beta/invite'): Promise<void> {
  if (!isBetaRequired()) return
  let clerkId: string | null = null
  try {
    const session = await auth()
    clerkId = session.userId ?? null
  } catch {
    clerkId = null
  }
  if (!clerkId) {
    // No session yet — let the auth layer handle the redirect.
    return
  }
  const allowed = await hasBetaAccess(clerkId)
  if (!allowed) redirect(redirectTo)
}
