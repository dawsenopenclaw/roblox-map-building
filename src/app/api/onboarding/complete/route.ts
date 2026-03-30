import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { isUnder13 } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  // Must be a past date — future dates would falsely pass the isUnder13 check
  // (a future DOB is always > thirteenYearsAgo, so isUnder13 returns false).
  dateOfBirth: z
    .string()
    .datetime()
    .refine((val) => new Date(val) < new Date(), {
      message: 'Date of birth must be in the past',
    }),
})

export async function POST(req: NextRequest) {
  let clerkId: string | null = null
  try {
    const session = await auth()
    clerkId = session?.userId ?? null
  } catch { /* demo mode — Clerk not configured */ }

  if (!clerkId) {
    return NextResponse.json({ demo: true, redirectUrl: '/editor' })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid date' }, { status: 400 })

  const dob = new Date(parsed.data.dateOfBirth)
  const under13 = isUnder13(dob)

  try {
    await db.user.update({
      where: { clerkId },
      data: { dateOfBirth: dob, isUnder13: under13 },
    })
  } catch (err) {
    // DB unavailable — still return the routing decision so the flow can continue
    return NextResponse.json({
      isUnder13: under13,
      redirect: under13 ? '/onboarding/parental-consent' : '/onboarding',
      dbError: true,
    })
  }

  return NextResponse.json({
    isUnder13: under13,
    redirect: under13 ? '/onboarding/parental-consent' : '/onboarding',
  })
}
