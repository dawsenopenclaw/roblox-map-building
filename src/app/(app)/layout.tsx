import { auth } from '@clerk/nextjs/server'
import { requireAuthUser } from '@/lib/clerk'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { Suspense } from 'react'
import { AppShell } from '@/components/AppShell'
import { AnalyticsProvider } from '@/components/AnalyticsProvider'
import { AppLoadingFallback } from '@/components/AppLoadingFallback'

// Routes inside the (app) group that are publicly accessible without auth.
// The middleware already marks these public — the layout must not override that.
const PUBLIC_APP_PATHS = new Set(['/editor', '/welcome'])

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
    }
    if (!userId) redirect('/sign-in')
  }

  // 2. DB lookup with graceful fallback (never throws)
  const user = await requireAuthUser().catch(() => null)

  // 3. Parental consent gate — only enforced when we have full DB data
  if (user && 'isUnder13' in user && user.isUnder13 && !user.parentConsentAt) {
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
