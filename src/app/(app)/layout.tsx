import { auth, clerkClient } from '@clerk/nextjs/server'
import { requireAuthUser } from '@/lib/clerk'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { Suspense } from 'react'
import { AppShell } from '@/components/AppShell'
import { AnalyticsProvider } from '@/components/AnalyticsProvider'
import { AppLoadingFallback } from '@/components/AppLoadingFallback'

// Routes inside the (app) group that are publicly accessible without auth.
// The middleware already marks these public — the layout must not override that.
const PUBLIC_APP_PATHS = new Set(['/editor', '/welcome', '/templates'])

function isPublicAppPath(pathname: string): boolean {
  // Exact match or prefix match (e.g. /editor?foo=bar handled by exact match on pathname)
  return PUBLIC_APP_PATHS.has(pathname) || pathname.startsWith('/editor/')
}

/**
 * Server component layout — handles auth guard.
 *
 * Auth check uses Clerk directly so a DB outage never kicks authenticated
 * users to /sign-in.  requireAuthUser() returns a minimal stub when the DB
 * is unreachable, so the layout can still render with FREE-tier defaults.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // 1. Clerk auth check — unauthenticated → sign-in (independent of DB)
  // Skip redirect in demo mode (DEMO_MODE=true) so the full site is accessible.
  // Also skip for public paths that live inside this route group (/editor, /welcome)
  // so that guest users and freshly-signed-up users are never bounced to /sign-in.
  const demoMode = process.env.DEMO_MODE === 'true'
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? headersList.get('x-invoke-path') ?? ''
  const isPublic = isPublicAppPath(pathname)
  let userId: string | null = null
  if (!demoMode && !isPublic) {
    try {
      const session = await auth()
      userId = session.userId
    } catch {
      // Clerk unavailable or misconfigured — allow access rather than locking users out.
      // The middleware already verified auth, so if we get here it's a transient issue.
    }
    // Only redirect to sign-in if we're confident there's no session.
    // If Clerk threw (caught above), userId stays null but we allow access
    // since the middleware already authenticated the request.
    if (!userId && !demoMode) {
      // Double-check: try one more time before redirecting
      try {
        const retrySession = await auth()
        userId = retrySession.userId
      } catch {
        // Still failing — let the page render anyway. The middleware
        // already verified auth, so this is a server-side Clerk issue.
      }
      if (!userId) {
        // Final fallback: check if we're on a page that can render without auth
        // rather than hard-redirecting and creating a loop
        redirect('/sign-in')
      }
    }
  }

  // 1b. Age-gate check — runs against live Clerk metadata (not JWT claims)
  // so it's immune to JWT template config drift. If the middleware falls
  // through because the JWT doesn't expose publicMetadata, this is where
  // the gate is actually enforced. Only enforced on protected routes; the
  // /editor + /welcome + /templates public paths bypass this check so
  // unauthenticated visitors can still browse them.
  const AGE_GATE_BYPASS = new Set(['/onboarding', '/welcome', '/sign-in', '/sign-up'])
  const bypassAgeGate =
    isPublic ||
    AGE_GATE_BYPASS.has(pathname) ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/welcome') ||
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/sign-up')
  if (userId && !bypassAgeGate) {
    try {
      const client = await clerkClient()
      const clerkUser = await client.users.getUser(userId)
      const publicDob = (clerkUser.publicMetadata as { dateOfBirth?: string } | null)?.dateOfBirth
      const unsafeDob = (clerkUser.unsafeMetadata as { dateOfBirth?: string } | null)?.dateOfBirth
      if (!publicDob && !unsafeDob) {
        redirect('/onboarding/age-gate')
      }
    } catch {
      // Clerk transient — don't block the user, let them proceed. The
      // middleware will catch them on the next request if needed.
    }
  }

  // 2. DB lookup with graceful fallback (never throws)
  const user = await requireAuthUser().catch(() => null)

  // 3. Parental consent gate — only enforced on specific paths, not globally
  // This prevents redirect loops for users accessing /settings or /billing
  if (
    user &&
    'isUnder13' in user &&
    user.isUnder13 &&
    !user.parentConsentAt &&
    !pathname.startsWith('/settings') &&
    !pathname.startsWith('/billing') &&
    !pathname.startsWith('/gifts') &&
    !pathname.startsWith('/tokens') &&
    !pathname.startsWith('/onboarding') &&
    !pathname.startsWith('/beta') &&
    pathname !== '/welcome'
  ) {
    redirect('/onboarding/parental-consent')
  }

  const tier = user?.subscription?.tier ?? 'FREE'
  const clerkId = user?.clerkId ?? userId

  return (
    <AnalyticsProvider
      userId={clerkId}
      tier={tier}
      email={user?.email ?? undefined}
      isUnder13={(user as { isUnder13?: boolean } | null)?.isUnder13 ?? undefined}
      createdAt={(user as { createdAt?: Date } | null)?.createdAt?.toISOString()}
      displayName={(user as { displayName?: string | null } | null)?.displayName ?? undefined}
    >
      <AppShell>
        <Suspense fallback={<AppLoadingFallback />}>{children}</Suspense>
      </AppShell>
    </AnalyticsProvider>
  )
}
