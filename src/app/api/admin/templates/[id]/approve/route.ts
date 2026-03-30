import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../../../_adminGuard'
import { db } from '@/lib/db'
import { dispatchWebhookEvent } from '@/lib/webhook-dispatch'
import { auth } from '@clerk/nextjs/server'

type Params = { params: Promise<{ id: string }> }

export async function PUT(_req: NextRequest, { params }: Params) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params

    const template = await db.template.update({
      where: { id },
      data: { status: 'PUBLISHED' },
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
      decision: 'approved',
    }).catch(() => {})

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Service temporarily unavailable', details: 'Database not connected' },
      { status: 503 }
    )
  }
}
