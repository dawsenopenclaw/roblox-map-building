import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

// POST /api/marketplace/templates/[id]/reviews — verified purchase only
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: templateId } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (templateId.startsWith('demo-')) {
    return NextResponse.json({ error: 'Reviews are not available for demo templates' }, { status: 400 })
  }

  let user: { id: string } | null = null
  try {
    user = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  } catch (err) {
    console.error('[reviews POST] DB error:', err)
    return NextResponse.json({ error: 'Service temporarily unavailable — please try again later' }, { status: 503 })
  }
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  try {
    // Use unique index (templateId + buyerId) for O(1) lookup
    const purchase = await db.templatePurchase.findUnique({
      where: { templateId_buyerId: { templateId, buyerId: user.id } },
      select: { id: true },
    })
    if (!purchase) {
      return NextResponse.json({ error: 'Must purchase template before reviewing' }, { status: 403 })
    }

    // Check no existing review for this purchase
    const existing = await db.templateReview.findUnique({
      where: { purchaseId: purchase.id },
      select: { id: true },
    })
    if (existing) {
      return NextResponse.json({ error: 'You have already reviewed this template' }, { status: 409 })
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { rating, body: reviewBody } = body as { rating?: number; body?: string }

    if (typeof rating !== 'number' || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json({ error: 'Rating must be an integer 1-5' }, { status: 400 })
    }

    const review = await db.templateReview.create({
      data: {
        templateId,
        reviewerId: user.id,
        purchaseId: purchase.id,
        rating,
        body: reviewBody?.trim() || null,
      },
    })

    // Recompute averageRating and reviewCount
    const agg = await db.templateReview.aggregate({
      where: { templateId },
      _avg: { rating: true },
      _count: { rating: true },
    })

    await db.template.update({
      where: { id: templateId },
      data: {
        averageRating: agg._avg.rating ?? 0,
        reviewCount: agg._count.rating,
      },
    })

    return NextResponse.json({ review }, { status: 201 })
  } catch (err) {
    console.error('[reviews POST] DB error creating review:', err)
    return NextResponse.json({ error: 'Service temporarily unavailable — please try again later' }, { status: 503 })
  }
}

// GET /api/marketplace/templates/[id]/reviews — list reviews
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: templateId } = await params

  if (templateId.startsWith('demo-')) {
    return NextResponse.json({ reviews: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } })
  }

  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1', 10))
  const limit = Math.min(50, Math.max(1, parseInt(req.nextUrl.searchParams.get('limit') || '20', 10)))

  try {
    const [reviews, total] = await Promise.all([
      db.templateReview.findMany({
        where: { templateId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          rating: true,
          body: true,
          creatorResponse: true,
          respondedAt: true,
          createdAt: true,
          reviewer: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
        },
      }),
      db.templateReview.count({ where: { templateId } }),
    ])

    return NextResponse.json({
      reviews,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (err) {
    console.error('[reviews GET] DB error:', err)
    return NextResponse.json({ reviews: [], pagination: { page: 1, limit, total: 0, totalPages: 0 } })
  }
}

// PATCH /api/marketplace/templates/[id]/reviews — creator responds
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: templateId } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (templateId.startsWith('demo-')) {
    return NextResponse.json({ error: 'Not available for demo templates' }, { status: 400 })
  }

  let user: { id: string } | null = null
  try {
    user = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  } catch (err) {
    console.error('[reviews PATCH] DB error:', err)
    return NextResponse.json({ error: 'Service temporarily unavailable — please try again later' }, { status: 503 })
  }
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { reviewId, response } = body as { reviewId?: string; response?: string }
  if (!reviewId) return NextResponse.json({ error: 'reviewId required' }, { status: 400 })
  if (!response?.trim()) return NextResponse.json({ error: 'Response text required' }, { status: 400 })

  try {
    // Verify the user is the template creator — select only needed fields
    const template = await db.template.findUnique({ where: { id: templateId }, select: { id: true, creatorId: true } })
    if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    if (template.creatorId !== user.id) {
      return NextResponse.json({ error: 'Only the creator can respond to reviews' }, { status: 403 })
    }

    const updated = await db.templateReview.update({
      where: { id: reviewId },
      data: { creatorResponse: response.trim(), respondedAt: new Date() },
    })

    return NextResponse.json({ review: updated })
  } catch (err) {
    console.error('[reviews PATCH] DB error updating review:', err)
    return NextResponse.json({ error: 'Service temporarily unavailable — please try again later' }, { status: 503 })
  }
}
