import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../../../../_adminGuard'
import { db } from '@/lib/db'
import { dispatchWebhookEvent } from '@/lib/webhook-dispatch'
import { auth } from '@clerk/nextjs/server'

type Params = { params: Promise<{ id: string }> }

// POST /api/admin/marketplace/templates/[id]/approve
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { error, user: adminUser } = await requireAdmin()
    if (error) return error

    const { id } = await params

    // Verify template exists and is in PENDING_REVIEW state
    const existing = await db.template.findUnique({
      where: { id },
      select: { id: true, status: true, title: true, creatorId: true },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }
    if (existing.status !== 'PENDING_REVIEW') {
      return NextResponse.json(
        { error: `Template is not pending review (current status: ${existing.status})` },
        { status: 409 }
      )
    }

    const template = await db.template.update({
      where: { id },
      data: { status: 'PUBLISHED' },
      select: { id: true, title: true, creatorId: true, status: true },
    })

    // Resolve reviewer DB id (best-effort — falls back to Clerk id)
    let reviewerDbId: string | null = adminUser?.id ?? null
    try {
      if (!reviewerDbId) {
        const session = await auth()
        if (session?.userId) {
          const admin = await db.user.findUnique({ where: { clerkId: session.userId }, select: { id: true } })
          if (admin) reviewerDbId = admin.id
        }
      }
    } catch { /* auth not available in all environments */ }

    // Write audit log (best-effort)
    db.auditLog.create({
      data: {
        userId: reviewerDbId ?? undefined,
        action: 'template.approved',
        resource: 'Template',
        resourceId: template.id,
        metadata: { templateTitle: template.title, creatorId: template.creatorId },
      },
    }).catch(() => {})

    // Dispatch webhook to creator (best-effort)
    dispatchWebhookEvent(template.creatorId, 'template.reviewed', {
      templateId: template.id,
      templateName: template.title,
      reviewerId: reviewerDbId ?? 'admin',
      decision: 'approved',
    }).catch(() => {})

    return NextResponse.json({
      ok: true,
      template: { id: template.id, status: template.status, title: template.title },
    })
  } catch {
    return NextResponse.json(
      { error: 'Service temporarily unavailable', details: 'Database not connected' },
      { status: 503 }
    )
  }
}
