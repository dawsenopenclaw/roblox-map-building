import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as Sentry from '@sentry/nextjs'

export async function DELETE() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Create audit log before deletion
    await db.auditLog.create({
      data: { userId: user.id, action: 'USER_DELETION_REQUESTED', resource: 'user', resourceId: user.id },
    })

    // Soft delete: nullify PII, set deletedAt
    await db.user.update({
      where: { id: user.id },
      data: {
        email: `deleted_${clerkId}@deleted.invalid`,
        displayName: null,
        avatarUrl: null,
        dateOfBirth: null,
        parentEmail: null,
        parentConsentToken: null,
        parentConsentTokenExp: null,
        deletedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, message: 'Account scheduled for deletion. Data will be fully removed within 30 days.' })
  } catch (err) {
    Sentry.captureException(err)
    return NextResponse.json({ error: 'Failed to process deletion' }, { status: 500 })
  }
}
