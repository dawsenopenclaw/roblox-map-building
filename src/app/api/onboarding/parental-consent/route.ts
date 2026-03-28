import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { generateConsentToken } from '@/lib/tokens'
import { sendParentalConsentEmail } from '@/lib/email'
import { z } from 'zod'

const schema = z.object({ parentEmail: z.string().email() })

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user?.isUnder13) return NextResponse.json({ error: 'Not applicable' }, { status: 400 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid email' }, { status: 400 })

  const { token, expires } = generateConsentToken()
  const { hashToken } = await import('@/lib/tokens')
  const tokenHash = hashToken(token)

  await db.user.update({
    where: { clerkId },
    data: {
      parentEmail: parsed.data.parentEmail,
      parentConsentToken: tokenHash,
      parentConsentTokenExp: expires,
    },
  })

  await sendParentalConsentEmail({
    parentEmail: parsed.data.parentEmail,
    childName: user.displayName || user.email,
    token, // raw token goes in the email link, never stored
  })

  return NextResponse.json({
    ok: true,
    message: 'Consent email sent. Account locked until parent approves.',
  })
}
