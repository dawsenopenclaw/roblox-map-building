import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { teamInviteSchema, teamUpdateMemberSchema, parseBody } from '@/lib/validations'

// ─── Types ────────────────────────────────────────────────────────────────────

export type TeamRole = 'OWNER' | 'ADMIN' | 'DEVELOPER' | 'VIEWER'

type TeamMember = {
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

type TeamTokenPool = {
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

// ─── GET — fetch team roster + token pool ────────────────────────────────────

export async function GET() {
  try {
    let clerkId: string | null = null
    try {
      const session = await auth()
      clerkId = session?.userId ?? null
    } catch { /* demo mode */ }
    if (!clerkId) return NextResponse.json({ ...DEMO_TEAM, demo: true })

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
    let clerkId: string | null = null
    try {
      const session = await auth()
      clerkId = session?.userId ?? null
    } catch { /* demo mode */ }
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = await parseBody(req, teamInviteSchema)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status })
    }
    const { email, role, tokensAllotment } = parsed.data

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
    let clerkId: string | null = null
    try {
      const session = await auth()
      clerkId = session?.userId ?? null
    } catch { /* demo mode */ }
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = await parseBody(req, teamUpdateMemberSchema)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status })
    }
    const { memberId, role, tokensAllotment, status } = parsed.data

    // Real DB not yet wired — return 501 so callers know the mutation was not persisted
    return NextResponse.json({ error: 'Not implemented — database not connected' }, { status: 501 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── DELETE — remove a member ────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    let clerkId: string | null = null
    try {
      const session = await auth()
      clerkId = session?.userId ?? null
    } catch { /* demo mode */ }
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
