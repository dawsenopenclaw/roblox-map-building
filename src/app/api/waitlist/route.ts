import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Basic email validation — no external dependency needed
function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

/**
 * POST /api/waitlist
 * Body: { email: string }
 *
 * Accepts a waitlist signup for the desktop app.
 * Persists email to Prisma Waitlist table.
 */
export async function POST(req: NextRequest) {
  let body: unknown

  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid JSON body.' },
      { status: 400 }
    )
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    !('email' in body) ||
    typeof (body as Record<string, unknown>).email !== 'string'
  ) {
    return NextResponse.json(
      { success: false, message: 'email is required.' },
      { status: 400 }
    )
  }

  const email = ((body as Record<string, unknown>).email as string).trim()

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { success: false, message: 'Please provide a valid email address.' },
      { status: 422 }
    )
  }

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
