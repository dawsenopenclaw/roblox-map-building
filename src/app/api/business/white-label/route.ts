import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { whiteLabelBrandingSchema, whiteLabelAgentSchema, whiteLabelDomainSchema, parseBody } from '@/lib/validations'

// ─── Types ────────────────────────────────────────────────────────────────────

export type WhiteLabelBranding = {
  logoUrl:       string | null
  faviconUrl:    string | null
  primaryColor:  string
  accentColor:   string
  companyName:   string
  tagline:       string | null
  customDomain:  string | null
  domainVerified: boolean
}

export type AgentConfig = {
  id:          string
  name:        string
  description: string
  model:       'haiku' | 'sonnet' | 'opus'
  systemPrompt: string
  enabled:     boolean
  costMultiplier: number
}

export type MarketplaceStorefront = {
  slug:          string
  displayName:   string
  description:   string | null
  bannerUrl:     string | null
  featuredAssets: string[]
  totalListings:  number
  totalSales:     number
}

export type RateLimitConfig = {
  requestsPerMinute:  number
  requestsPerHour:    number
  requestsPerDay:     number
  tokensPerMonth:     number
}

export type WhiteLabelConfig = {
  businessId:   string
  branding:     WhiteLabelBranding
  agents:       AgentConfig[]
  storefront:   MarketplaceStorefront
  rateLimits:   RateLimitConfig
  apiVersion:   string
  updatedAt:    string
}

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_BRANDING: WhiteLabelBranding = {
  logoUrl:       null,
  faviconUrl:    null,
  primaryColor:  '#D4AF37',
  accentColor:   '#FFB81C',
  companyName:   'Dawsen Porter LLC',
  tagline:       'Professional Roblox Game Development',
  customDomain:  null,
  domainVerified: false,
}

const DEMO_AGENTS: AgentConfig[] = [
  {
    id:             'agent_roblox_builder',
    name:           'Roblox Builder',
    description:    'Luau scripting and game systems specialist',
    model:          'sonnet',
    systemPrompt:   'You are an elite Roblox game developer...',
    enabled:        true,
    costMultiplier: 1.0,
  },
  {
    id:             'agent_ui_builder',
    name:           'UI Designer',
    description:    'ScreenGui and HUD specialist',
    model:          'sonnet',
    systemPrompt:   'You specialize in Roblox UI/UX design...',
    enabled:        true,
    costMultiplier: 1.0,
  },
  {
    id:             'agent_architect',
    name:           'Architect',
    description:    'Complex system design and planning',
    model:          'opus',
    systemPrompt:   'You design complex game architectures...',
    enabled:        false,
    costMultiplier: 3.0,
  },
]

const DEMO_STOREFRONT: MarketplaceStorefront = {
  slug:          'dawsen-porter-llc',
  displayName:   'Dawsen Porter LLC',
  description:   'Premium Roblox game templates and assets',
  bannerUrl:     null,
  featuredAssets: [],
  totalListings:  8,
  totalSales:     47,
}

const DEMO_RATE_LIMITS: RateLimitConfig = {
  requestsPerMinute: 120,
  requestsPerHour:   2000,
  requestsPerDay:    20000,
  tokensPerMonth:    2000000,
}

const DEMO_CONFIG: WhiteLabelConfig = {
  businessId:  'biz_dawsen_porter_llc',
  branding:    DEMO_BRANDING,
  agents:      DEMO_AGENTS,
  storefront:  DEMO_STOREFRONT,
  rateLimits:  DEMO_RATE_LIMITS,
  apiVersion:  'v1',
  updatedAt:   '2026-03-01T00:00:00.000Z',
}

// ─── GET — fetch white-label config ──────────────────────────────────────────

export async function GET() {
  try {
    let clerkId: string | null = null
    try {
      const session = await auth()
      clerkId = session?.userId ?? null
    } catch { /* demo mode */ }
    if (!clerkId) return NextResponse.json({ config: DEMO_CONFIG, demo: true })

    try {
      const { db } = await import('@/lib/db')
      const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
      if (user) {
        // Real DB lookup when WhiteLabelConfig model is in schema
      }
    } catch {
      // DB unavailable
    }

    return NextResponse.json({ config: DEMO_CONFIG, demo: true })
  } catch {
    return NextResponse.json({ config: DEMO_CONFIG, demo: true })
  }
}

// ─── PATCH — update branding ──────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  try {
    let clerkId: string | null = null
    try {
      const session = await auth()
      clerkId = session?.userId ?? null
    } catch { /* demo mode */ }
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = await parseBody(req, whiteLabelBrandingSchema)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status })
    }

    const updated: WhiteLabelBranding = { ...DEMO_BRANDING, ...parsed.data }
    return NextResponse.json({
      branding:  updated,
      updatedAt: new Date().toISOString(),
      demo:      true,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── PUT — toggle / reconfigure an agent ─────────────────────────────────────

export async function PUT(req: NextRequest) {
  try {
    let clerkId: string | null = null
    try {
      const session = await auth()
      clerkId = session?.userId ?? null
    } catch { /* demo mode */ }
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = await parseBody(req, whiteLabelAgentSchema)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status })
    }
    const { agentId, enabled, systemPrompt } = parsed.data

    const agent = DEMO_AGENTS.find((a) => a.id === agentId)
    if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

    const updated: AgentConfig = {
      ...agent,
      enabled:      enabled      !== undefined ? enabled      : agent.enabled,
      systemPrompt: systemPrompt !== undefined ? systemPrompt : agent.systemPrompt,
    }

    return NextResponse.json({ agent: updated, demo: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── POST — verify custom domain ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    let clerkId: string | null = null
    try {
      const session = await auth()
      clerkId = session?.userId ?? null
    } catch { /* demo mode */ }
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = await parseBody(req, whiteLabelDomainSchema)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status })
    }
    const { domain } = parsed.data

    // Real impl: check DNS TXT record for _forjegames-verify=<token>
    return NextResponse.json({
      domain,
      verified:    false,
      txtRecord:   `_forjegames-verify.${domain}`,
      txtValue:    `fj-verify=demo_token_${Date.now()}`,
      instructions: 'Add the TXT record to your DNS provider and re-verify in 10 minutes.',
      demo:        true,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
