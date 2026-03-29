import { requireAuthUser } from '@/lib/clerk'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { DashboardClient } from '@/components/DashboardClient'

export default async function DashboardPage() {
  // requireAuthUser never throws — returns a stub when DB is unreachable
  let user: Awaited<ReturnType<typeof requireAuthUser>> | null = null
  try {
    user = await requireAuthUser()
  } catch {
    // Clerk says not authenticated — middleware should have caught this,
    // but redirect defensively just in case.
    redirect('/sign-in')
  }

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
  const userRecord = user as Record<string, unknown> & {
    firstName?: string | null
    email?: string | null
    subscription?: { tier?: string } | null
  }
  const firstName =
    userRecord.firstName ||
    (userRecord.email ? String(userRecord.email).split('@')[0] : 'Builder')

  const subscription = userRecord.subscription?.tier || 'FREE'

  return <DashboardClient firstName={String(firstName)} subscription={subscription} />
}
