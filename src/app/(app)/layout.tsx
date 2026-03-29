import { requireAuthUser } from '@/lib/clerk'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { AnalyticsProvider } from '@/components/AnalyticsProvider'

/**
 * Server component layout — handles auth guard.
 * Client-side shell (AppShell) handles sidebar toggle state.
 * AnalyticsProvider identifies the user in PostHog and forwards
 * user context (tier, role, streak) to all child components.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuthUser().catch(() => null)
  if (!user) redirect('/sign-in')
  if (user.isUnder13 && !user.parentConsentAt) redirect('/onboarding/parental-consent')

  const tier = user.subscription?.tier ?? 'FREE'

  return (
    <AnalyticsProvider
      userId={user.clerkId}
      tier={tier}
      email={user.email ?? undefined}
      isUnder13={user.isUnder13 ?? undefined}
      createdAt={user.createdAt?.toISOString()}
      displayName={user.displayName ?? undefined}
    >
      <AppShell>{children}</AppShell>
    </AnalyticsProvider>
  )
}
