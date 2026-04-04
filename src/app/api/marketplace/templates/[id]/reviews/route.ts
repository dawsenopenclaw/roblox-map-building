import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { reviewSchema, reviewResponseSchema, parseBody } from '@/lib/validations'
import { dispatchWebhookEvent } from '@/lib/webhook-dispatch'
import { marketplaceWriteRateLimit, rateLimitHeaders } from '@/lib/rate-limit'

// POST /api/marketplace/templates/[id]/reviews — verified purchase only
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: templateId } = await params

  let clerkId: string | null = null
  try {
    const session = await auth()
    clerkId = session?.userId ?? null
  } catch { /* demo mode — Clerk not configured */ }

  if (!clerkId) {
    return NextResponse.json({ demo: true, message: 'Reviews are not available in demo mode' }, { status: 200 })
  }

  const rl = await marketplaceWriteRateLimit(clerkId)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests — please slow down' },
      { status: 429, headers: rateLimitHeaders(rl) },
    )
  }

  if (templateId.startsWith('demo-')) {
    return NextResponse.json({ error: 'Reviews are not available for demo templates' }, { status: 400 })
  }

  let user: { id: string } | null = null
  try {
    user = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  } catch (err) {
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

    const parsed = await parseBody(req, reviewSchema)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status })
    }

    const { rating, body: reviewBody } = parsed.data

    // Wrap review creation and aggregate update in a transaction so a concurrent
    // duplicate request cannot create two reviews or leave aggregate counts stale.
    const review = await db.$transaction(async (tx) => {
      // Re-check inside the transaction to prevent TOCTOU race on duplicate submissions
      const txExisting = await tx.templateReview.findUnique({
        where: { purchaseId: purchase.id },
        select: { id: true },
      })
      if (txExisting) throw Object.assign(new Error('ALREADY_REVIEWED'), { code: 'ALREADY_REVIEWED' })

      const created = await tx.templateReview.create({
        data: {
          templateId,
          reviewerId: user.id,
          purchaseId: purchase.id,
          rating,
          body: reviewBody?.trim() || null,
        },
      })

      // Recompute averageRating and reviewCount within the same transaction
      const agg = await tx.templateReview.aggregate({
        where: { templateId },
        _avg: { rating: true },
        _count: { rating: true },
      })

      await tx.template.update({
        where: { id: templateId },
        data: {
          averageRating: agg._avg.rating ?? 0,
          reviewCount: agg._count.rating,
        },
      })

      return created
    })

    // Notify the template creator and fire outbound webhook — both best-effort
    const template = await db.template.findUnique({
      where: { id: templateId },
      select: { creatorId: true, title: true },
    }).catch(() => null)

    if (template) {
      dispatchWebhookEvent(template.creatorId, 'template.reviewed', {
        templateId,
        templateTitle: template.title,
        reviewerId: user.id,
        rating,
        reviewId: review.id,
        createdAt: review.createdAt.toISOString(),
      }).catch(() => {})
    }

    return NextResponse.json({ review }, { status: 201 })
  } catch (err) {
    if (err instanceof Error && (err as NodeJS.ErrnoException & { code?: string }).code === 'ALREADY_REVIEWED') {
      return NextResponse.json({ error: 'You have already reviewed this template' }, { status: 409 })
    }
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
    return NextResponse.json({ reviews: [], pagination: { page: 1, limit, total: 0, totalPages: 0 } })
  }
}

// PATCH /api/marketplace/templates/[id]/reviews — creator responds
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: templateId } = await params

  let clerkId: string | null = null
  try {
    const session = await auth()
    clerkId = session?.userId ?? null
  } catch { /* demo mode — Clerk not configured */ }

  if (!clerkId) {
    return NextResponse.json({ demo: true, message: 'Creator responses are not available in demo mode' }, { status: 200 })
  }

  const rlPatch = await marketplaceWriteRateLimit(clerkId)
  if (!rlPatch.allowed) {
    return NextResponse.json(
      { error: 'Too many requests — please slow down' },
      { status: 429, headers: rateLimitHeaders(rlPatch) },
    )
  }

  if (templateId.startsWith('demo-')) {
    return NextResponse.json({ error: 'Not available for demo templates' }, { status: 400 })
  }

  let user: { id: string } | null = null
  try {
    user = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  } catch (err) {
    return NextResponse.json({ error: 'Service temporarily unavailable — please try again later' }, { status: 503 })
  }
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const parsed = await parseBody(req, reviewResponseSchema)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  }

  const { reviewId, response } = parsed.data

  try {
    // Verify the user is the template creator — select only needed fields
    const template = await db.template.findUnique({ where: { id: templateId }, select: { id: true, creatorId: true } })
    if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    if (template.creatorId !== user.id) {
      return NextResponse.json({ error: 'Only the creator can respond to reviews' }, { status: 403 })
    }

    const updated = await db.templateReview.update({
      where: { id: reviewId, templateId },
      data: { creatorResponse: response.trim(), respondedAt: new Date() },
    })

    return NextResponse.json({ review: updated })
  } catch (err) {
    return NextResponse.json({ error: 'Service temporarily unavailable — please try again later' }, { status: 503 })
  }
}
