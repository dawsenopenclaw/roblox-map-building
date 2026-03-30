import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// ─── Types ────────────────────────────────────────────────────────────────────

export type RevenueBreakdown = {
  marketplaceSales:    number   // cents
  subscriptions:       number   // cents
  whiteLabelLicenses:  number   // cents
  total:               number   // cents
}

export type TokenMetrics = {
  totalUsedThisMonth: number
  totalUsedAllTime:   number
  usedByMember: {
    memberId:    string
    displayName: string
    used:        number
    percentage:  number
  }[]
}

export type ProjectMetrics = {
  active:    number
  total:     number
  shipped:   number
  avgTokensPerProject: number
  topProjects: {
    id:           string
    name:         string
    tokensUsed:   number
    lastActivity: string
    status:       'active' | 'shipped' | 'archived'
  }[]
}

export type GrowthProjection = {
  period:    string
  actual:    number | null   // cents, null if future
  projected: number          // cents
}

export type RoiMetrics = {
  tokensSpent:          number
  estimatedRevenuePerToken: number
  totalRevenueCents:    number
  roiMultiplier:        number   // revenue / token cost
  gamesShipped:         number
  avgRevenuePerGame:    number   // cents
}

export type BusinessAnalytics = {
  businessId:   string
  period:       string
  revenue:      RevenueBreakdown
  tokens:       TokenMetrics
  projects:     ProjectMetrics
  roi:          RoiMetrics
  growthChart:  GrowthProjection[]
  activityFeed: {
    id:        string
    type:      'sale' | 'project_shipped' | 'member_joined' | 'token_refill' | 'milestone'
    message:   string
    timestamp: string
    valueCents?: number
  }[]
}

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_ANALYTICS: BusinessAnalytics = {
  businessId: 'biz_dawsen_porter_llc',
  period:     'March 2026',
  revenue: {
    marketplaceSales:   185000,   // $1,850
    subscriptions:      49900,    // $499
    whiteLabelLicenses: 10100,    // $101
    total:              245000,   // $2,450
  },
  tokens: {
    totalUsedThisMonth: 450000,
    totalUsedAllTime:   2140000,
    usedByMember: [
      { memberId: 'mem_dawsen', displayName: 'Dawsen Porter', used: 280000, percentage: 62 },
      { memberId: 'mem_alex',   displayName: 'Alex Chen',     used: 120000, percentage: 27 },
      { memberId: 'mem_sam',    displayName: 'Sam Rivera',    used:  50000, percentage: 11 },
    ],
  },
  projects: {
    active:    5,
    total:     17,
    shipped:   12,
    avgTokensPerProject: 125882,
    topProjects: [
      { id: 'proj_1', name: 'Aura Clash Simulator',  tokensUsed: 480000, lastActivity: '2026-03-29T08:00:00.000Z', status: 'active'   },
      { id: 'proj_2', name: 'Flip or Flop Tycoon',   tokensUsed: 320000, lastActivity: '2026-03-28T15:30:00.000Z', status: 'active'   },
      { id: 'proj_3', name: 'Brainrot Empire',        tokensUsed: 210000, lastActivity: '2026-03-25T11:00:00.000Z', status: 'shipped'  },
      { id: 'proj_4', name: 'Obby Rush Classic',      tokensUsed: 140000, lastActivity: '2026-03-20T09:45:00.000Z', status: 'shipped'  },
      { id: 'proj_5', name: 'Pet Collector Ultra',    tokensUsed:  95000, lastActivity: '2026-03-15T14:00:00.000Z', status: 'archived' },
    ],
  },
  roi: {
    tokensSpent:               450000,
    estimatedRevenuePerToken:  0.00054,   // ~$0.054 per 100 tokens
    totalRevenueCents:         245000,
    roiMultiplier:             4.8,
    gamesShipped:              12,
    avgRevenuePerGame:         20416,   // ~$204/game
  },
  growthChart: [
    { period: 'Oct 25', actual:  45000, projected:  45000 },
    { period: 'Nov 25', actual:  72000, projected:  72000 },
    { period: 'Dec 25', actual:  98000, projected:  98000 },
    { period: 'Jan 26', actual: 145000, projected: 145000 },
    { period: 'Feb 26', actual: 198000, projected: 198000 },
    { period: 'Mar 26', actual: 245000, projected: 245000 },
    { period: 'Apr 26', actual:   null, projected: 310000 },
    { period: 'May 26', actual:   null, projected: 385000 },
    { period: 'Jun 26', actual:   null, projected: 470000 },
  ],
  activityFeed: [
    { id: 'act_1', type: 'sale',             message: 'Aura Clash Template sold × 3',         timestamp: '2026-03-29T09:10:00.000Z', valueCents: 8700  },
    { id: 'act_2', type: 'project_shipped',  message: 'Brainrot Empire shipped to production', timestamp: '2026-03-28T16:00:00.000Z' },
    { id: 'act_3', type: 'sale',             message: 'Simulator UI Kit sold',                 timestamp: '2026-03-27T11:30:00.000Z', valueCents: 2900  },
    { id: 'act_4', type: 'token_refill',     message: 'Monthly token pool reset (500K)',       timestamp: '2026-03-01T00:00:00.000Z' },
    { id: 'act_5', type: 'milestone',        message: 'Reached $2,000 monthly revenue',        timestamp: '2026-03-24T14:20:00.000Z' },
    { id: 'act_6', type: 'member_joined',    message: 'Sam Rivera joined as Developer',        timestamp: '2026-02-15T10:00:00.000Z' },
    { id: 'act_7', type: 'sale',             message: 'Premium Combat System sold × 2',        timestamp: '2026-03-22T08:45:00.000Z', valueCents: 5800  },
  ],
}

// ─── GET — business analytics ─────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') ?? 'current_month'

    try {
      const { db } = await import('@/lib/db')
      const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
      if (user) {
        // Real aggregation queries would run here when analytics tables are in schema:
        // - SUM marketplace sales grouped by month
        // - SUM subscription revenue via Stripe
        // - Token usage per member from TokenUsage table
        // - Project counts from Project table
        // Falling through to demo for now.
        void period
      }
    } catch {
      // DB unavailable
    }

    return NextResponse.json({ analytics: DEMO_ANALYTICS, demo: true })
  } catch {
    return NextResponse.json({ analytics: DEMO_ANALYTICS, demo: true })
  }
}
