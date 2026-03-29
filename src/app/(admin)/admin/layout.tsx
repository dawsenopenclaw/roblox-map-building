import React from 'react'
import { AdminShell } from '@/components/admin/AdminShell'

export const metadata = {
  title: 'Admin — ForjeGames',
  robots: { index: false, follow: false },
}

// Owner bypass: set ADMIN_EMAIL in .env.local to always grant access regardless of DB role.
const OWNER_EMAIL = process.env.ADMIN_EMAIL ?? ''

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Try to get Clerk session — if unavailable or unconfigured, fall through to demo mode.
  let clerkUserId: string | null = null
  try {
    const { auth } = await import('@clerk/nextjs/server')
    const session = await auth()
    clerkUserId = session.userId ?? null
  } catch {
    // Clerk not configured or unavailable — render in demo mode.
  }

  // No session → demo mode (unauthenticated access, for local dev / demo)
  if (!clerkUserId) {
    return (
      <AdminShell user={{ id: 'demo', email: 'demo@forjegames.com', role: 'ADMIN' }} isDemo>
        {children}
      </AdminShell>
    )
  }

  // Try DB user lookup
  let dbUser: { id: string; email: string; role: string } | null = null
  try {
    const { db } = await import('@/lib/db')
    dbUser = await db.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true, email: true, role: true },
    })
  } catch {
    // DB unavailable — fall through to Clerk email check
  }

  // DB user found — enforce ADMIN role
  if (dbUser) {
    if (dbUser.role !== 'ADMIN' && dbUser.email !== OWNER_EMAIL) {
      // Non-admin logged-in user: show demo mode rather than crashing
      return (
        <AdminShell user={{ id: dbUser.id, email: dbUser.email, role: dbUser.role }} isDemo>
          {children}
        </AdminShell>
      )
    }
    return (
      <AdminShell user={{ id: dbUser.id, email: dbUser.email, role: dbUser.role }}>
        {children}
      </AdminShell>
    )
  }

  // No DB record — try owner bypass via Clerk email
  let clerkEmail: string | null = null
  try {
    const { clerkClient } = await import('@clerk/nextjs/server')
    const client = await clerkClient()
    const clerkUser = await client.users.getUser(clerkUserId)
    clerkEmail =
      clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
        ?.emailAddress ?? null
  } catch {
    // Clerk SDK unavailable
  }

  if (clerkEmail === OWNER_EMAIL) {
    return (
      <AdminShell user={{ id: clerkUserId, email: clerkEmail, role: 'ADMIN' }}>
        {children}
      </AdminShell>
    )
  }

  // Authenticated but not admin and no DB record — render demo mode
  return (
    <AdminShell user={{ id: clerkUserId, email: clerkEmail ?? 'unknown@forjegames.com', role: 'USER' }} isDemo>
      {children}
    </AdminShell>
  )
}
