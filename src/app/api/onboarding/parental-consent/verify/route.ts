import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashToken } from '@/lib/tokens'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.redirect(new URL('/error?reason=missing-token', req.url))

  const tokenHash = hashToken(token)
  const user = await db.user.findUnique({ where: { parentConsentToken: tokenHash } })

  if (!user || !user.parentConsentTokenExp) {
    return NextResponse.redirect(new URL('/error?reason=invalid-token', req.url))
  }

  if (new Date() > user.parentConsentTokenExp) {
    return NextResponse.redirect(new URL('/error?reason=expired-token', req.url))
  }

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
}
