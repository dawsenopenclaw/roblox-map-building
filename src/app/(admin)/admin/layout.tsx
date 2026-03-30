import React from 'react'
import { redirect } from 'next/navigation'
import { AdminShell } from '@/components/admin/AdminShell'

export const metadata = {
  title: 'Admin — ForjeGames',
  robots: { index: false, follow: false },
}

// Owner bypass: set ADMIN_EMAILS in .env.local (comma-separated) to always grant access
// regardless of DB role. Matches are case-insensitive.
function isOwnerEmail(email: string | null): boolean {
  if (!email) return false
  const list = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  return list.includes(email.toLowerCase())
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Require a valid Clerk session — no demo fallback for admin routes.
  let clerkUserId: string | null = null
  try {
    const { auth } = await import('@clerk/nextjs/server')
    const session = await auth()
    clerkUserId = session.userId ?? null
  } catch {
    // Clerk unavailable — treat as unauthenticated.
  }

  // No session → redirect to sign-in. Never render admin UI for unauthenticated users.
  if (!clerkUserId) {
    redirect('/sign-in')
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

  // DB user found — enforce ADMIN role strictly.
  if (dbUser) {
    if (dbUser.role !== 'ADMIN' && !isOwnerEmail(dbUser.email)) {
      redirect('/sign-in')
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

  if (isOwnerEmail(clerkEmail)) {
    return (
      <AdminShell user={{ id: clerkUserId, email: clerkEmail, role: 'ADMIN' }}>
        {children}
      </AdminShell>
    )
  }

  // Authenticated but not admin and no DB record — deny access.
  redirect('/sign-in')
}
