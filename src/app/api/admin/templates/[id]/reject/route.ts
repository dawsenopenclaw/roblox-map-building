import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../../../_adminGuard'
import { db } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const isDmca = body.reason === 'DMCA_TAKEDOWN'

    await db.template.update({
      where: { id },
      data: {
        status: isDmca ? 'TAKEDOWN' : 'REJECTED',
      },
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Template reject error:', error)
    return NextResponse.json(
      { error: 'Service temporarily unavailable', details: 'Database not connected' },
      { status: 503 }
    )
  }
}
