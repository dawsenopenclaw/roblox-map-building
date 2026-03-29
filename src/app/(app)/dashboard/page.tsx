import { requireAuthUser } from '@/lib/clerk'
import { DashboardClient } from '@/components/DashboardClient'

export default async function DashboardPage() {
  const user = await requireAuthUser()

  // Derive a friendly first name: prefer firstName field, else split email
  const firstName =
    (user as Record<string, unknown> & { firstName?: string }).firstName ||
    (user.email ? user.email.split('@')[0] : 'Builder')

  const subscription = user.subscription?.tier || 'FREE'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-0">
      <DashboardClient firstName={firstName} subscription={subscription} />
    </div>
  )
}
