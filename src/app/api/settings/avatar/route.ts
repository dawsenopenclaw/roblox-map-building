import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as Sentry from '@sentry/nextjs'

const MAX_SIZE = 2 * 1024 * 1024 // 2 MB
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const contentType = req.headers.get('content-type') ?? ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 })
    }

    const formData = await req.formData()
    const file = formData.get('avatar')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PNG, JPEG, and WebP are allowed.' },
        { status: 422 },
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 2 MB.' },
        { status: 422 },
      )
    }

    const bytes = await file.arrayBuffer()

    // Upload to Clerk so the avatar updates everywhere (nav bar, comments, etc.)
    // Clerk stores the image and returns a hosted URL, which we then save to our DB.
    let avatarUrl: string
    try {
      const client = await clerkClient()
      const clerkUser = await client.users.updateUserProfileImage(clerkId, {
        file: new Blob([bytes], { type: file.type }),
      })
      // Clerk returns the user object with the new imageUrl
      avatarUrl = clerkUser.imageUrl
    } catch (clerkErr) {
      // Fallback: if Clerk upload fails, store as base64 data URL in our DB
      Sentry.captureException(clerkErr, {
        extra: { clerkId, context: 'avatar_clerk_upload_fallback' },
      })
      console.warn('[settings/avatar] Clerk image upload failed, falling back to base64:', clerkErr)
      const base64 = Buffer.from(bytes).toString('base64')
      avatarUrl = `data:${file.type};base64,${base64}`
    }

    const updated = await db.user.update({
      where: { clerkId },
      data: { avatarUrl },
      select: { avatarUrl: true },
    })

    return NextResponse.json({ avatarUrl: updated.avatarUrl })
  } catch (err) {
    Sentry.captureException(err)
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 })
  }
}
