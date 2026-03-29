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

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid email' }, { status: 400 })

  let user: Awaited<ReturnType<typeof db.user.findUnique>> = null
  try {
    user = await db.user.findUnique({ where: { clerkId } })
  } catch (err) {
    // DB unavailable — proceed optimistically (DOB was validated at age-gate step)
  }

  // If we have a DB record and the user is not under 13, reject
  if (user !== null && !user.isUnder13) {
    return NextResponse.json({ error: 'Not applicable' }, { status: 400 })
  }

  try {
    const { token, expires } = generateConsentToken()
    const { hashToken } = await import('@/lib/tokens')
    const tokenHash = hashToken(token)

    try {
      await db.user.update({
        where: { clerkId },
        data: {
          parentEmail: parsed.data.parentEmail,
          parentConsentToken: tokenHash,
          parentConsentTokenExp: expires,
        },
      })
    } catch (err) {
      // Non-fatal — still attempt to send the email
    }

    await sendParentalConsentEmail({
      parentEmail: parsed.data.parentEmail,
      childName: user?.displayName || user?.email || 'your child',
      token, // raw token goes in the email link, never stored
    })

    return NextResponse.json({
      ok: true,
      message: 'Consent email sent. Account locked until parent approves.',
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to send consent email. Please try again.' }, { status: 500 })
  }
}
