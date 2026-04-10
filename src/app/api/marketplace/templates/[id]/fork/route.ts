import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

function generateSlug(title: string, suffix: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') +
    '-' +
    suffix
  )
}

// ── POST /api/marketplace/templates/[id]/fork — fork a template ─────────────

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: templateId } = await params

  let clerkId: string | null = null
  try {
    const session = await auth()
    clerkId = session?.userId ?? null
  } catch { /* demo mode — Clerk not configured */ }
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let user: { id: string } | null = null
  try {
    user = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  } catch {
    return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
  }
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Fetch the original template
  const original = await db.template.findUnique({
    where: { id: templateId },
    select: {
      id: true,
      status: true,
      title: true,
      description: true,
      category: true,
      tags: true,
      rbxmFileUrl: true,
      thumbnailUrl: true,
      creatorId: true,
    },
  })

  if (!original || original.status !== 'PUBLISHED') {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  // Cannot fork your own template
  if (original.creatorId === user.id) {
    return NextResponse.json({ error: 'Cannot fork your own template' }, { status: 400 })
  }

  // Create the forked template + fork record in a transaction
  const suffix = Date.now().toString(36)
  const forkedSlug = generateSlug(original.title + ' remix', suffix)

  const result = await db.$transaction(async (tx) => {
    const forkedTemplate = await tx.template.create({
      data: {
        creatorId: user!.id,
        title: `${original.title} (Remix)`,
        slug: forkedSlug,
        description: `Remixed from "${original.title}".\n\n${original.description}`,
        category: original.category,
        tags: [...original.tags, 'remix'],
        rbxmFileUrl: original.rbxmFileUrl,
        thumbnailUrl: original.thumbnailUrl,
        status: 'DRAFT',
        priceCents: 0,
      },
    })

    await tx.templateFork.create({
      data: {
        userId: user!.id,
        originalItemId: original.id,
        forkedItemId: forkedTemplate.id,
      },
    })

    await tx.template.update({
      where: { id: original.id },
      data: { forkCount: { increment: 1 } },
    })

    return forkedTemplate
  })

  return NextResponse.json({
    forked: true,
    templateId: result.id,
    slug: result.slug,
  })
}
