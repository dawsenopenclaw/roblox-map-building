import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../../../_adminGuard'
import { db } from '@/lib/db'
import { dispatchWebhookEvent } from '@/lib/webhook-dispatch'
import { auth } from '@clerk/nextjs/server'
import { adminTemplateRejectSchema, parseBody } from '@/lib/validations'

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params
    const parsed = await parseBody(req, adminTemplateRejectSchema)
    const reason = parsed.ok ? parsed.data.reason : undefined
    const isDmca = reason === 'DMCA_TAKEDOWN'

    const template = await db.template.update({
      where: { id },
      data: {
        status: isDmca ? 'TAKEDOWN' : 'REJECTED',
      },
      select: { id: true, title: true, creatorId: true },
    })

    // Dispatch template.reviewed webhook to the template creator (best-effort)
    let reviewerId = 'admin'
    try {
      const session = await auth()
      if (session?.userId) {
        const admin = await db.user.findUnique({ where: { clerkId: session.userId }, select: { id: true } })
        if (admin) reviewerId = admin.id
      }
    } catch { /* auth not available in all environments */ }

    dispatchWebhookEvent(template.creatorId, 'template.reviewed', {
      templateId: template.id,
      templateName: template.title,
      reviewerId,
      decision: 'rejected',
      feedback: reason ?? undefined,
    }).catch(() => {})

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Service temporarily unavailable', details: 'Database not connected' },
      { status: 503 }
    )
  }
}
