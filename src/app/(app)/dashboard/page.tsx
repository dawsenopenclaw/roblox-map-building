import { requireAuthUser } from '@/lib/clerk'
import { getTokenBalance } from '@/lib/tokens-server'
import { DashboardHomeClient } from '@/components/DashboardHomeClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Dashboard — ForjeGames',
  description: 'Your ForjeGames dashboard. Track token usage, recent builds, and project activity.',
  robots: { index: false, follow: false },
}

export default async function DashboardPage() {
  // Graceful fallback — never throws
  const user = await requireAuthUser().catch(() => null)

  const firstName =
    (user as { firstName?: string | null } | null)?.firstName ??
    (user as { displayName?: string | null } | null)?.displayName ??
    'Builder'

  const subscription =
    (user as { subscription?: { tier?: string } | null } | null)?.subscription?.tier ?? 'FREE'

  let tokenBalance = 0
  let lifetimeSpent = 0
  if (user?.id) {
    try {
      const tb = await getTokenBalance(user.id)
      tokenBalance = tb?.balance ?? 0
      lifetimeSpent = tb?.lifetimeSpent ?? 0
    } catch {
      // DB unavailable — use defaults
    }
  }

  return (
    <DashboardHomeClient
      firstName={firstName}
      subscription={subscription}
      tokenBalance={tokenBalance}
      lifetimeSpent={lifetimeSpent}
    />
  )
}
