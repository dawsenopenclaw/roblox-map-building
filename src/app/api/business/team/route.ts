import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// ─── Types ────────────────────────────────────────────────────────────────────

export type TeamRole = 'OWNER' | 'ADMIN' | 'DEVELOPER' | 'VIEWER'

export type TeamMember = {
  id: string
  email: string
  displayName: string
  role: TeamRole
  avatarUrl: string | null
  joinedAt: string
  lastActiveAt: string | null
  tokensUsedThisMonth: number
  tokensAllotment: number | null  // null = unlimited
  projectsCount: number
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED'
}

export type TeamTokenPool = {
  totalMonthly: number
  usedThisMonth: number
  remaining: number
  resetAt: string
  perMemberLimits: boolean
}

export type TeamData = {
  businessId: string
  members: TeamMember[]
  tokenPool: TeamTokenPool
  seats: { used: number; max: number }
}

type InvitePayload = {
  email: string
  role: TeamRole
  tokensAllotment?: number
}

type UpdateMemberPayload = {
  memberId: string
  role?: TeamRole
  tokensAllotment?: number
  status?: 'ACTIVE' | 'SUSPENDED'
}

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_MEMBERS: TeamMember[] = [
  {
    id:                  'mem_dawsen',
    email:               'dawsen@forjegames.com',
    displayName:         'Dawsen Porter',
    role:                'OWNER',
    avatarUrl:           null,
    joinedAt:            '2026-01-15T00:00:00.000Z',
    lastActiveAt:        '2026-03-29T10:00:00.000Z',
    tokensUsedThisMonth: 280000,
    tokensAllotment:     null,
    projectsCount:       12,
    status:              'ACTIVE',
  },
  {
    id:                  'mem_alex',
    email:               'alex@forjegames.com',
    displayName:         'Alex Chen',
    role:                'DEVELOPER',
    avatarUrl:           null,
    joinedAt:            '2026-02-01T00:00:00.000Z',
    lastActiveAt:        '2026-03-28T18:30:00.000Z',
    tokensUsedThisMonth: 120000,
    tokensAllotment:     150000,
    projectsCount:       7,
    status:              'ACTIVE',
  },
  {
    id:                  'mem_sam',
    email:               'sam@forjegames.com',
    displayName:         'Sam Rivera',
    role:                'DEVELOPER',
    avatarUrl:           null,
    joinedAt:            '2026-02-15T00:00:00.000Z',
    lastActiveAt:        '2026-03-27T09:15:00.000Z',
    tokensUsedThisMonth: 50000,
    tokensAllotment:     100000,
    projectsCount:       3,
    status:              'ACTIVE',
  },
]

const DEMO_TOKEN_POOL: TeamTokenPool = {
  totalMonthly:    500000,
  usedThisMonth:   450000,
  remaining:       50000,
  resetAt:         '2026-04-01T00:00:00.000Z',
  perMemberLimits: true,
}

const DEMO_TEAM: TeamData = {
  businessId: 'biz_dawsen_porter_llc',
  members:    DEMO_MEMBERS,
  tokenPool:  DEMO_TOKEN_POOL,
  seats:      { used: 3, max: 10 },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const VALID_ROLES: TeamRole[] = ['OWNER', 'ADMIN', 'DEVELOPER', 'VIEWER']

function validateInvite(body: unknown): body is InvitePayload {
  if (!body || typeof body !== 'object') return false
  const b = body as Record<string, unknown>
  if (typeof b.email !== 'string' || !b.email.includes('@')) return false
  if (!VALID_ROLES.includes(b.role as TeamRole)) return false
  if (b.tokensAllotment !== undefined && typeof b.tokensAllotment !== 'number') return false
  return true
}

function validateUpdate(body: unknown): body is UpdateMemberPayload {
  if (!body || typeof body !== 'object') return false
  const b = body as Record<string, unknown>
  if (typeof b.memberId !== 'string') return false
  if (b.role !== undefined && !VALID_ROLES.includes(b.role as TeamRole)) return false
  if (b.tokensAllotment !== undefined && typeof b.tokensAllotment !== 'number') return false
  if (b.status !== undefined && !['ACTIVE', 'SUSPENDED'].includes(b.status as string)) return false
  return true
}

// ─── GET — fetch team roster + token pool ────────────────────────────────────

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
      const { db } = await import('@/lib/db')
      const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
      if (user) {
        // Real DB lookup when TeamMember model is in schema
        // Fall through to demo for now
      }
    } catch {
      // DB unavailable
    }

    return NextResponse.json({ ...DEMO_TEAM, demo: true })
  } catch {
    return NextResponse.json({ ...DEMO_TEAM, demo: true })
  }
}

// ─── POST — invite a team member ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: unknown
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    if (!validateInvite(body)) {
      return NextResponse.json(
        { error: 'Required: email (string), role (OWNER|ADMIN|DEVELOPER|VIEWER)' },
        { status: 422 },
      )
    }

    const { email, role, tokensAllotment } = body

    // Real impl: send invite email via Resend, create pending TeamMember row
    const invited: TeamMember = {
      id:                  `mem_${Date.now()}`,
      email,
      displayName:         email.split('@')[0],
      role,
      avatarUrl:           null,
      joinedAt:            new Date().toISOString(),
      lastActiveAt:        null,
      tokensUsedThisMonth: 0,
      tokensAllotment:     tokensAllotment ?? null,
      projectsCount:       0,
      status:              'INVITED',
    }

    return NextResponse.json({ member: invited, demo: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── PATCH — update member role / allotment / status ─────────────────────────

export async function PATCH(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: unknown
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    if (!validateUpdate(body)) {
      return NextResponse.json({ error: 'Required: memberId (string)' }, { status: 422 })
    }

    const { memberId, role, tokensAllotment, status } = body

    // Find member in demo data and apply patch
    const member = DEMO_MEMBERS.find((m) => m.id === memberId)
    if (!member) {
      // In real DB this would throw a 404 if the row doesn't exist
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    const updated: TeamMember = {
      ...member,
      role:            role ?? member.role,
      tokensAllotment: tokensAllotment !== undefined ? tokensAllotment : member.tokensAllotment,
      status:          status ?? member.status,
    }

    return NextResponse.json({ member: updated, demo: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── DELETE — remove a member ────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const memberId = searchParams.get('memberId')
    if (!memberId) return NextResponse.json({ error: 'memberId query param required' }, { status: 422 })

    const member = DEMO_MEMBERS.find((m) => m.id === memberId)
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    if (member.role === 'OWNER') {
      return NextResponse.json({ error: 'Cannot remove the team Owner' }, { status: 403 })
    }

    return NextResponse.json({ deleted: true, memberId, demo: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
