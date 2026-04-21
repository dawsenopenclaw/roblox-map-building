import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// ─── GET /api/reviews ──────────────────────────────────────────────────────
// Returns approved site reviews for the homepage marquee. Public endpoint.
// ────────────────────────────────────────────────────────────────────────────

export async function GET() {
  const reviews = await db.siteReview.findMany({
    where: { approved: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      review: true,
      stars: true,
      createdAt: true,
      user: {
        select: {
          name: true,
          robloxAvatarUrl: true,
          robloxDisplayName: true,
        },
      },
    },
  })

  const mapped = reviews.map(r => ({
    id: r.id,
    name: r.user.robloxDisplayName || r.user.name || 'Builder',
    review: r.review,
    stars: r.stars,
    avatarUrl: r.user.robloxAvatarUrl || null,
    createdAt: r.createdAt.toISOString(),
  }))

  return NextResponse.json(mapped, {
    headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
  })
}

// ─── POST /api/reviews ─────────────────────────────────────────────────────
// Submit a site review. Requires auth. Auto-approved for beta testers.
// ────────────────────────────────────────────────────────────────────────────

const ReviewSchema = z.object({
  review: z.string().min(5).max(200).trim(),
  stars: z.number().int().min(1).max(5),
})

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Sign in to leave a review' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = ReviewSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid review' }, { status: 400 })
  }

  // Check if user already submitted a review
  const existing = await db.siteReview.findFirst({ where: { userId } })
  if (existing) {
    return NextResponse.json({ error: 'You already submitted a review' }, { status: 409 })
  }

  // Look up user to check beta status
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { betaAccess: true },
  })

  const review = await db.siteReview.create({
    data: {
      userId,
      review: parsed.data.review,
      stars: parsed.data.stars,
      approved: user?.betaAccess ?? false, // auto-approve beta testers
    },
  })

  return NextResponse.json({ id: review.id, approved: review.approved }, { status: 201 })
}
