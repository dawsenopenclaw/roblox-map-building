import { requireAuthUser } from '@/lib/clerk'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/AppShell'

/**
 * Server component layout — handles auth guard.
 * Client-side shell (AppShell) handles sidebar toggle state.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuthUser().catch(() => null)
  if (!user) redirect('/sign-in')
  if (user.isUnder13 && !user.parentConsentAt) redirect('/onboarding/parental-consent')

  return <AppShell>{children}</AppShell>
}
