import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../../../_adminGuard'
import { db } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

export async function PUT(_req: NextRequest, { params }: Params) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params

    await db.template.update({
      where: { id },
      data: { status: 'PUBLISHED' },
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Template approve error:', error)
    return NextResponse.json(
      { error: 'Service temporarily unavailable', details: 'Database not connected' },
      { status: 503 }
    )
  }
}
