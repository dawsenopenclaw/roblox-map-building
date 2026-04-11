import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

// ── POST /api/marketplace/templates/[id]/favorite — toggle favorite ─────────

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: templateId } = await params

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
    return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
  }
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Verify template exists and is published
  const template = await db.template.findUnique({
    where: { id: templateId },
    select: { id: true, status: true },
  })
  if (!template || template.status !== 'PUBLISHED') {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  // Check if already favorited
  const existing = await db.templateFavorite.findUnique({
    where: { userId_itemId: { userId: user.id, itemId: templateId } },
  })

  if (existing) {
    // Unfavorite
    await db.templateFavorite.delete({ where: { id: existing.id } })
    return NextResponse.json({ favorited: false })
  }

  // Favorite
  await db.templateFavorite.create({
    data: { userId: user.id, itemId: templateId },
  })

  return NextResponse.json({ favorited: true })
}

// ── GET /api/marketplace/templates/[id]/favorite — check favorite status ────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: templateId } = await params

  let clerkId: string | null = null
  try {
    const session = await auth()
    clerkId = session?.userId ?? null
  } catch { /* demo mode */ }
  if (!clerkId) return NextResponse.json({ favorited: false })

  let user: { id: string } | null = null
  try {
    user = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  } catch {
    return NextResponse.json({ favorited: false })
  }
  if (!user) return NextResponse.json({ favorited: false })

  const existing = await db.templateFavorite.findUnique({
    where: { userId_itemId: { userId: user.id, itemId: templateId } },
  })

  return NextResponse.json({ favorited: !!existing })
}
