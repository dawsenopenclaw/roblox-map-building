import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

/**
 * Verifies the request is from an ADMIN user.
 * Returns the user record on success, or a 401/403 NextResponse on failure.
 */
export async function requireAdmin() {
  const { userId } = await auth()
  if (!userId) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), user: null }
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, email: true, role: true },
  })

  if (!user || user.role !== 'ADMIN') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), user: null }
  }

  return { error: null, user }
}
