import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../../../../_adminGuard'
import { db } from '@/lib/db'
import { dispatchWebhookEvent } from '@/lib/webhook-dispatch'
import { auth } from '@clerk/nextjs/server'
import { adminTemplateRejectSchema, parseBody } from '@/lib/validations'

type Params = { params: Promise<{ id: string }> }

// POST /api/admin/marketplace/templates/[id]/reject
// Body: { reason?: string }  — pass "DMCA_TAKEDOWN" to trigger TAKEDOWN status
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { error, user: adminUser } = await requireAdmin()
    if (error) return error

    const { id } = await params
    const parsed = await parseBody(req, adminTemplateRejectSchema)
    const reason = parsed.ok ? parsed.data.reason : undefined
    const isDmca = reason === 'DMCA_TAKEDOWN'
    const newStatus = isDmca ? 'TAKEDOWN' : 'REJECTED'

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
      data: { status: newStatus },
      select: { id: true, title: true, creatorId: true, status: true },
    })

    // Resolve reviewer DB id (best-effort)
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
        action: isDmca ? 'template.dmca_takedown' : 'template.rejected',
        resource: 'Template',
        resourceId: template.id,
        metadata: {
          templateTitle: template.title,
          creatorId: template.creatorId,
          reason: reason ?? null,
          newStatus,
        },
      },
    }).catch(() => {})

    // Dispatch webhook to creator (best-effort)
    dispatchWebhookEvent(template.creatorId, 'template.reviewed', {
      templateId: template.id,
      templateName: template.title,
      reviewerId: reviewerDbId ?? 'admin',
      decision: 'rejected',
      feedback: reason ?? undefined,
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
