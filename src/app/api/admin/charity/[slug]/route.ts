import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../../_adminGuard'

type Params = { params: Promise<{ slug: string }> }

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { error } = await requireAdmin()
  if (error) return error

  const { slug } = await params

  // NOTE: In production, remove from DB. For now, log intent.
  return NextResponse.json({
    ok: true,
    message: `Charity '${slug}' removal requested. Update ACTIVE_CHARITIES env var to persist.`,
  })
}
