import { requireAuthUser } from '@/lib/clerk'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { DashboardClient } from '@/components/DashboardClient'

export default async function DashboardPage() {
  const user = await requireAuthUser()

  // ── Onboarding redirect for brand-new users ──────────────────────────────
  // Check Clerk public metadata. If the wizard has never been completed and the
  // account is freshly created (< 10 min old), send the user through the wizard.
  try {
    const { userId } = await auth()
    if (userId) {
      const client = await clerkClient()
      const clerkUser = await client.users.getUser(userId)
      const meta = (clerkUser.publicMetadata ?? {}) as Record<string, unknown>
      const onboarding = meta.onboarding as { completed?: boolean } | undefined
      const accountAgeMs = Date.now() - new Date(clerkUser.createdAt).getTime()
      const isNew = accountAgeMs < 10 * 60 * 1000 // 10 minutes
      if (!onboarding?.completed && isNew) {
        redirect('/welcome')
      }
    }
  } catch {
    // Non-fatal — proceed to dashboard
  }

  // Derive a friendly first name: prefer firstName field, else split email
  const firstName =
    (user as Record<string, unknown> & { firstName?: string }).firstName ||
    (user.email ? user.email.split('@')[0] : 'Builder')

  const subscription = user.subscription?.tier || 'FREE'

  return <DashboardClient firstName={firstName} subscription={subscription} />
}
