import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseBody } from '@/lib/validations'
import { z } from 'zod'

const waitlistSchema = z.object({
  email: z.string().email('Please provide a valid email address.').max(254),
})

/**
 * POST /api/waitlist
 * Body: { email: string }
 *
 * Accepts a waitlist signup for the desktop app.
 * Persists email to Prisma Waitlist table.
 */
export async function POST(req: NextRequest) {
  const parsed = await parseBody(req, waitlistSchema)
  if (!parsed.ok) {
    return NextResponse.json(
      { success: false, message: parsed.error },
      { status: parsed.status }
    )
  }

  const { email } = parsed.data

  try {
    await db.waitlist.upsert({
      where: { email },
      create: { email, source: 'download_page' },
      update: {},
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to save to waitlist.' },
      { status: 500 }
    )
  }

  return NextResponse.json(
    { success: true, message: "You'll be notified when the desktop app launches." },
    { status: 200 }
  )
}
