import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

// GET /api/marketplace/templates/mine — list the authenticated creator's own templates

export async function GET() {
  let clerkId: string | null = null
  try {
    const session = await auth()
    clerkId = session?.userId ?? null
  } catch { /* demo mode — Clerk not configured */ }
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let user: { id: string } | null = null
  try {
    user = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  } catch {
    return NextResponse.json({ error: 'Service temporarily unavailable — please try again later' }, { status: 503 })
  }
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  try {
    const templates = await db.template.findMany({
      where: { creatorId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        status: true,
        priceCents: true,
        thumbnailUrl: true,
        averageRating: true,
        reviewCount: true,
        downloads: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ templates })
  } catch {
    return NextResponse.json({ error: 'Service temporarily unavailable — please try again later' }, { status: 503 })
  }
}
