import React from 'react'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { AdminShell } from '@/components/admin/AdminShell'

export const metadata = {
  title: 'Admin — ForjeGames',
  robots: { index: false, follow: false },
}

// Owner bypass: set ADMIN_EMAIL in .env.local to always grant access regardless of DB role.
const OWNER_EMAIL = process.env.ADMIN_EMAIL ?? 'dawsenm@gmail.com'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Step 1: Verify Clerk session — this is always required.
  let clerkUserId: string | null = null
  try {
    const session = await auth()
    clerkUserId = session.userId ?? null
  } catch {
    redirect('/sign-in')
  }
  if (!clerkUserId) redirect('/sign-in')

  // Step 2: Try to load DB user record. If DB is unavailable, fall back to Clerk data.
  let dbUser: { id: string; email: string; role: string } | null = null
  try {
    const { db } = await import('@/lib/db')
    dbUser = await db.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true, email: true, role: true },
    })
  } catch {
    // DB unavailable — owner bypass handled below
  }

  // Step 3: If we got a DB record, enforce ADMIN role normally.
  if (dbUser) {
    if (dbUser.role !== 'ADMIN' && dbUser.email !== OWNER_EMAIL) redirect('/dashboard')
    return (
      <AdminShell user={{ id: dbUser.id, email: dbUser.email, role: dbUser.role }}>
        {children}
      </AdminShell>
    )
  }

  // Step 4: No DB record (DB down or user not yet synced). Allow only the owner through.
  // We use Clerk's primary email for this check.
  let clerkEmail: string | null = null
  try {
    const { clerkClient } = await import('@clerk/nextjs/server')
    const client = await clerkClient()
    const clerkUser = await client.users.getUser(clerkUserId)
    clerkEmail = clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ?? null
  } catch {
    // Clerk SDK unavailable — deny access to be safe
  }

  if (clerkEmail === OWNER_EMAIL) {
    return (
      <AdminShell user={{ id: clerkUserId, email: clerkEmail, role: 'ADMIN' }}>
        {children}
      </AdminShell>
    )
  }

  redirect('/dashboard')
}
