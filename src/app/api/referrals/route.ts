import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// ─── Types ────────────────────────────────────────────────────────────────────

type ReferralRow = {
  id: string
  user: string
  joinedAt: string
  status: 'Signed Up' | 'Pending'
  tokensAwarded: number
}

// ─── Demo data (shown when DB is unavailable) ─────────────────────────────────

const DEMO_REFERRALS: ReferralRow[] = [
  { id: 'r1', user: 'alex_builds',    joinedAt: 'Mar 20, 2026', status: 'Signed Up', tokensAwarded: 500 },
  { id: 'r2', user: 'gamesdev99',     joinedAt: 'Mar 14, 2026', status: 'Signed Up', tokensAwarded: 500 },
  { id: 'r3', user: 'robloxstudio_x', joinedAt: 'Feb 28, 2026', status: 'Signed Up', tokensAwarded: 500 },
  { id: 'r4', user: 'mapmaker_z',     joinedAt: 'Feb 10, 2026', status: 'Pending',   tokensAwarded: 0   },
  { id: 'r5', user: 'studio_pro7',    joinedAt: 'Jan 22, 2026', status: 'Signed Up', tokensAwarded: 500 },
]

const DEMO_SIGNED_UP = DEMO_REFERRALS.filter((r) => r.status === 'Signed Up').length
const DEMO_TOKENS    = DEMO_REFERRALS.reduce((sum, r) => sum + r.tokensAwarded, 0)

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Try real database first
    try {
      const { db } = await import('@/lib/db')

      const user = await db.user.findUnique({
        where: { clerkId },
        select: {
          referrals: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              referee: { select: { username: true } },
              createdAt: true,
              tokensAwarded: true,
              status: true,
            },
          },
        },
      })

      if (user) {
        const rows: ReferralRow[] = (user.referrals ?? []).map((r) => ({
          id: r.id,
          user: r.referee?.username ?? 'unknown',
          joinedAt: new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          status: r.status === 'SIGNED_UP' ? 'Signed Up' : 'Pending',
          tokensAwarded: r.tokensAwarded ?? 0,
        }))

        const signups     = rows.filter((r) => r.status === 'Signed Up').length
        const tokensEarned = rows.reduce((s, r) => s + r.tokensAwarded, 0)

        return NextResponse.json({
          invitesSent:  rows.length,
          signups,
          tokensEarned,
          referrals: rows,
          demo: false,
        })
      }
    } catch {
      // DB not connected — fall through to demo mode
    }

    // Demo mode
    return NextResponse.json({
      invitesSent:  DEMO_REFERRALS.length,
      signups:      DEMO_SIGNED_UP,
      tokensEarned: DEMO_TOKENS,
      referrals:    DEMO_REFERRALS,
      demo:         true,
    })
  } catch (error) {
    return NextResponse.json({
      invitesSent:  0,
      signups:      0,
      tokensEarned: 0,
      referrals:    [],
      demo:         true,
    })
  }
}
