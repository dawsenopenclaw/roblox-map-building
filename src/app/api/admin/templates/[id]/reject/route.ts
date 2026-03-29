import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../../../../_adminGuard'
import { db } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const isDmca = body.reason === 'DMCA_TAKEDOWN'

  try {
    await db.template.update({
      where: { id },
      data: {
        status: isDmca ? 'TAKEDOWN' : 'REJECTED',
      },
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Template reject error:', e)
    return NextResponse.json({ error: 'Failed to reject template' }, { status: 500 })
  }
}
