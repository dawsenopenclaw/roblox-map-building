import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../_adminGuard'
import { db } from '@/lib/db'
import { adminCustomOfferSchema, parseBody } from '@/lib/validations'

// GET /api/admin/offers — list all custom offers from AuditLog
export async function GET(req: NextRequest) {
  try {
    const adminResult = await requireAdmin()
    if (adminResult.error) return adminResult.error

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') // PENDING | SENT | PURCHASED | EXPIRED
    const limit = Math.min(Number(searchParams.get('limit') ?? '50'), 100)

    const where: Record<string, unknown> = {
      action: 'admin.create_custom_offer',
    }

    const logs = await db.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { email: true, displayName: true } },
      },
    })

    // Filter by status in-memory (stored in metadata JSON)
    const offers = logs
      .map((log) => {
        const meta = log.metadata as Record<string, unknown> | null
        return {
          id: log.id,
          offerId: (meta?.offerId as string) ?? log.id,
          name: (meta?.name as string) ?? '',
          priceCents: (meta?.priceCents as number) ?? 0,
          tokenAmount: (meta?.tokenAmount as number) ?? 0,
          description: (meta?.description as string) ?? '',
          targetUserId: (meta?.targetUserId as string) ?? log.resourceId,
          status: (meta?.status as string) ?? 'PENDING',
          createdAt: log.createdAt,
          createdBy: log.user?.email ?? null,
        }
      })
      .filter((o) => !status || o.status === status)

    return NextResponse.json({ offers, total: offers.length })
  } catch {
    return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
  }
}

// POST /api/admin/offers — create custom offer for one or more users
export async function POST(req: NextRequest) {
  try {
    const adminResult = await requireAdmin()
    if (adminResult.error) return adminResult.error

    const parsed = await parseBody(req, adminCustomOfferSchema)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status })
    }
    const { name, priceCents, tokenAmount, description, targetUserIds, expiresInDays } = parsed.data

    const expiresAt = new Date(Date.now() + expiresInDays * 86_400_000).toISOString()

    const created = await db.$transaction(
      targetUserIds.map((uid) =>
        db.auditLog.create({
          data: {
            userId: adminResult.user?.id ?? null,
            action: 'admin.create_custom_offer',
            resource: 'user',
            resourceId: uid,
            metadata: {
              offerId: `offer_${Date.now()}_${uid.slice(0, 8)}`,
              name,
              priceCents,
              tokenAmount,
              description: description ?? '',
              targetUserId: uid,
              expiresAt,
              status: 'PENDING',
              createdAt: new Date().toISOString(),
            },
          },
        })
      )
    )

    return NextResponse.json({ ok: true, count: created.length, expiresAt })
  } catch {
    return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
  }
}

// PATCH /api/admin/offers — update offer status (e.g. mark as SENT)
export async function PATCH(req: NextRequest) {
  try {
    const adminResult = await requireAdmin()
    if (adminResult.error) return adminResult.error

    let body: { logId: string; status: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
    if (!body.logId || !body.status) {
      return NextResponse.json({ error: 'logId and status required' }, { status: 422 })
    }

    const log = await db.auditLog.findUnique({ where: { id: body.logId } })
    if (!log || log.action !== 'admin.create_custom_offer') {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }

    const existing = (log.metadata as Record<string, unknown>) ?? {}
    await db.auditLog.update({
      where: { id: body.logId },
      data: {
        metadata: { ...existing, status: body.status, updatedAt: new Date().toISOString() },
      },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
  }
}
