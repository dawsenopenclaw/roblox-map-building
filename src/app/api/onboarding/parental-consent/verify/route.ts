import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashToken } from '@/lib/tokens'
import { clerkClient } from '@clerk/nextjs/server'

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')
    const action = req.nextUrl.searchParams.get('action')

    if (!token) return NextResponse.redirect(new URL('/error?reason=missing-token', req.url))

    const tokenHash = hashToken(token)
    const user = await db.user.findUnique({ where: { parentConsentToken: tokenHash } })

    if (!user || !user.parentConsentTokenExp) {
      return NextResponse.redirect(new URL('/error?reason=invalid-token', req.url))
    }

    if (new Date() > user.parentConsentTokenExp) {
      return NextResponse.redirect(new URL('/error?reason=expired-token', req.url))
    }

    // ── Deny path ───────────────────────────────────────────────────────────────
    if (action === 'deny') {
      // Nullify PII and soft-delete the user record
      await db.user.update({
        where: { id: user.id },
        data: {
          displayName: null,
          avatarUrl: null,
          dateOfBirth: null,
          parentEmail: null,
          parentConsentToken: null,
          parentConsentTokenExp: null,
          deletedAt: new Date(),
        },
      })

      // Audit log for COPPA 5-year retention compliance
      await db.auditLog.create({
        data: {
          userId: user.id,
          action: 'PARENTAL_CONSENT_DENIED',
          resource: 'user',
          resourceId: user.id,
          metadata: {},
        },
      })

      // Best-effort Clerk deletion — don't let it block the redirect
      if (user.clerkId) {
        try {
          const client = await clerkClient()
          await client.users.deleteUser(user.clerkId)
        } catch {
          // Non-fatal: Clerk user may already be deleted or clerkId may be stale
        }
      }

      return NextResponse.redirect(new URL('/onboarding/parental-consent/denied', req.url))
    }

    // ── Approve path (default) ───────────────────────────────────────────────
    await db.user.update({
      where: { id: user.id },
      data: {
        parentConsentAt: new Date(),
        parentConsentToken: null,
        parentConsentTokenExp: null,
      },
    })

    // Audit log for COPPA 5-year retention compliance
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'PARENTAL_CONSENT_VERIFIED',
        resource: 'user',
        resourceId: user.id,
        metadata: { parentEmail: user.parentEmail },
      },
    })

    return NextResponse.redirect(new URL('/onboarding/parental-consent/success', req.url))
  } catch (error) {
    return NextResponse.redirect(new URL('/error?reason=service-unavailable', req.url))
  }
}
