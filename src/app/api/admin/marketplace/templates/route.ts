import { NextResponse } from 'next/server'
import { requireAdmin } from '../../_adminGuard'
import { db } from '@/lib/db'

// GET /api/admin/marketplace/templates — list all templates pending review
export async function GET() {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const templates = await db.template.findMany({
      where: { status: 'PENDING_REVIEW', deletedAt: null },
      orderBy: { createdAt: 'asc' },
      take: 100,
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
  } catch {
    return NextResponse.json(
      { error: 'Service temporarily unavailable', details: 'Database not connected' },
      { status: 503 }
    )
  }
}
