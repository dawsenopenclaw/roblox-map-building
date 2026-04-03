import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { TemplateCategory, TemplateStatus } from '@prisma/client'
import { templateEditSchema, parseBody } from '@/lib/validations'

const VALID_CATEGORIES = Object.values(TemplateCategory)

const EDITABLE_STATUSES: TemplateStatus[] = [
  TemplateStatus.DRAFT,
  TemplateStatus.PENDING_REVIEW,
  TemplateStatus.PUBLISHED,
]

const ALLOWED_URL_HOSTS = [/\.rbxcdn\.com$/, /\.amazonaws\.com$/, /\.cloudflare\.com$/, /\.r2\.dev$/]

function isAllowedUrl(raw: string | null | undefined): boolean {
  if (!raw) return true
  try {
    const host = new URL(raw).hostname.toLowerCase()
    return ALLOWED_URL_HOSTS.some((re) => re.test(host))
  } catch {
    return false
  }
}

// ── PATCH /api/marketplace/templates/[id] — edit own template ─────────────────

export async function PATCH(
  req: NextRequest,
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
    return NextResponse.json({ error: 'Service temporarily unavailable — please try again later' }, { status: 503 })
  }
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const parsed = await parseBody(req, templateEditSchema)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  }

  const { title, description, priceCents, category, tags, thumbnailUrl, fileUrl } = parsed.data

  // Validate category value if provided
  if (category !== undefined && !VALID_CATEGORIES.includes(category as TemplateCategory)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
  }

  // Validate URL hosts if provided
  if (fileUrl && !isAllowedUrl(fileUrl)) {
    return NextResponse.json(
      { error: 'fileUrl must be from an allowed domain (rbxcdn.com, amazonaws.com, cloudflare.com, r2.dev)' },
      { status: 400 },
    )
  }
  if (thumbnailUrl && !isAllowedUrl(thumbnailUrl)) {
    return NextResponse.json(
      { error: 'thumbnailUrl must be from an allowed domain (rbxcdn.com, amazonaws.com, cloudflare.com, r2.dev)' },
      { status: 400 },
    )
  }

  try {
    const template = await db.template.findUnique({
      where: { id: templateId },
      select: { id: true, creatorId: true, status: true },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }
    if (template.creatorId !== user.id) {
      return NextResponse.json({ error: 'Forbidden — you do not own this template' }, { status: 403 })
    }
    if (!EDITABLE_STATUSES.includes(template.status)) {
      return NextResponse.json(
        { error: `Templates with status "${template.status}" cannot be edited` },
        { status: 409 },
      )
    }

    const updated = await db.template.update({
      where: { id: templateId },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(priceCents !== undefined && { priceCents }),
        ...(category !== undefined && { category: category as TemplateCategory }),
        ...(tags !== undefined && { tags }),
        ...(thumbnailUrl !== undefined && { thumbnailUrl: thumbnailUrl ?? null }),
        ...(fileUrl !== undefined && { rbxmFileUrl: fileUrl ?? null }),
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        category: true,
        status: true,
        priceCents: true,
        thumbnailUrl: true,
        rbxmFileUrl: true,
        tags: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ template: updated })
  } catch {
    return NextResponse.json({ error: 'Service temporarily unavailable — please try again later' }, { status: 503 })
  }
}

// ── DELETE /api/marketplace/templates/[id] — archive own template ─────────────

export async function DELETE(
  req: NextRequest,
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
    return NextResponse.json({ error: 'Service temporarily unavailable — please try again later' }, { status: 503 })
  }
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  try {
    const template = await db.template.findUnique({
      where: { id: templateId },
      select: { id: true, creatorId: true, status: true },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }
    if (template.creatorId !== user.id) {
      return NextResponse.json({ error: 'Forbidden — you do not own this template' }, { status: 403 })
    }
    if (template.status === TemplateStatus.ARCHIVED) {
      return NextResponse.json({ error: 'Template is already archived' }, { status: 409 })
    }

    await db.template.update({
      where: { id: templateId },
      data: { status: TemplateStatus.ARCHIVED },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Service temporarily unavailable — please try again later' }, { status: 503 })
  }
}
