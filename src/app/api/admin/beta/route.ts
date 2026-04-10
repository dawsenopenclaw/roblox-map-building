import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAdmin } from '@/app/api/admin/_adminGuard'

// ─── Admin: Beta invite management ──────────────────────────────────────────
// POST   /api/admin/beta  — generate a batch of invite codes
// GET    /api/admin/beta  — list all invite codes with redemption status
// DELETE /api/admin/beta  — revoke a single invite code
// ────────────────────────────────────────────────────────────────────────────

const GenerateSchema = z.object({
  count: z.number().int().min(1).max(500),
  cohort: z.string().min(1).max(64).optional(),
  bonusCredits: z.number().int().min(0).max(100_000).optional(),
  expiresAt: z.string().datetime().optional(),
  maxUses: z.number().int().min(1).max(10_000).optional(),
})

const DeleteSchema = z.object({
  code: z.string().min(1).max(64),
})

/** Generate a human-readable uppercase code (e.g. "FORJ-8K3N-PQRZ"). */
function generateCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I
  const bytes = randomBytes(8)
  let out = ''
  for (let i = 0; i < 8; i++) {
    out += alphabet[bytes[i] % alphabet.length]
  }
  return `FORJ-${out.slice(0, 4)}-${out.slice(4)}`
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard.error) return guard.error

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = GenerateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 422 },
    )
  }

  const { count, cohort, bonusCredits, expiresAt, maxUses } = parsed.data
  const expires = expiresAt ? new Date(expiresAt) : null
  // requireAdmin may return a clerk-id fallback (owner email bypass) rather
  // than a real DB user id. Only record createdById when we can resolve the
  // admin to a real User row; otherwise leave null (system-generated).
  let createdById: string | null = null
  if (guard.user?.id) {
    const adminUser = await db.user
      .findFirst({
        where: { OR: [{ id: guard.user.id }, { clerkId: guard.user.id }] },
        select: { id: true },
      })
      .catch(() => null)
    createdById = adminUser?.id ?? null
  }

  // Generate codes, retrying on the rare collision with an existing code.
  const created: Array<{ code: string; cohort: string | null; bonusCredits: number }> = []
  const attemptsPerCode = 5
  for (let i = 0; i < count; i++) {
    let saved = false
    for (let attempt = 0; attempt < attemptsPerCode && !saved; attempt++) {
      const code = generateCode()
      try {
        const invite = await db.betaInvite.create({
          data: {
            code,
            createdById,
            cohort: cohort ?? null,
            bonusCredits: bonusCredits ?? 0,
            expiresAt: expires,
            maxUses: maxUses ?? 1,
          },
          select: { code: true, cohort: true, bonusCredits: true },
        })
        created.push(invite)
        saved = true
      } catch (err) {
        // Unique constraint violation → retry with a new code.
        if (!(err instanceof Error && err.message.includes('Unique constraint'))) {
          console.error('[admin/beta] create failed:', err)
          break
        }
      }
    }
  }

  return NextResponse.json({
    success: true,
    generated: created.length,
    codes: created,
  })
}

export async function GET() {
  const guard = await requireAdmin()
  if (guard.error) return guard.error

  const invites = await db.betaInvite.findMany({
    orderBy: { createdAt: 'desc' },
    take: 1000,
    select: {
      id: true,
      code: true,
      cohort: true,
      bonusCredits: true,
      maxUses: true,
      useCount: true,
      expiresAt: true,
      createdAt: true,
      usedAt: true,
      usedBy: {
        select: { id: true, email: true, username: true },
      },
    },
  })

  return NextResponse.json({ invites })
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard.error) return guard.error

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const parsed = DeleteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 422 },
    )
  }

  const deleted = await db.betaInvite.deleteMany({ where: { code: parsed.data.code } })
  if (deleted.count === 0) {
    return NextResponse.json({ error: 'Invite code not found' }, { status: 404 })
  }
  return NextResponse.json({ success: true, revoked: parsed.data.code })
}
