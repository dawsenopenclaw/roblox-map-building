import { NextResponse } from 'next/server'
import { requireAdmin } from '../../_adminGuard'
import { db } from '@/lib/db'

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const templates = await db.template.findMany({
    where: { status: 'PENDING_REVIEW', deletedAt: null },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      priceCents: true,
      thumbnailUrl: true,
      rbxmFileUrl: true,
      tags: true,
      createdAt: true,
      creator: {
        select: {
          id: true,
          email: true,
          displayName: true,
          username: true,
        },
      },
    },
  })

  return NextResponse.json({
    templates: templates.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
    })),
    total: templates.length,
  })
}
