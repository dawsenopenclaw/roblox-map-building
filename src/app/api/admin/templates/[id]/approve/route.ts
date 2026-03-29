import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../../../../_adminGuard'
import { db } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

export async function PUT(_req: NextRequest, { params }: Params) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params

  try {
    await db.template.update({
      where: { id },
      data: { status: 'PUBLISHED' },
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Template approve error:', e)
    return NextResponse.json({ error: 'Failed to approve template' }, { status: 500 })
  }
}
