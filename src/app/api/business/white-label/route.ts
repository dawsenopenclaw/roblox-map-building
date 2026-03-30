import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

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

type BrandingUpdatePayload = Partial<WhiteLabelBranding>

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

const HEX_RE = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/

function validateBrandingUpdate(body: unknown): body is BrandingUpdatePayload {
  if (!body || typeof body !== 'object') return false
  const b = body as Record<string, unknown>
  if (b.primaryColor !== undefined && (typeof b.primaryColor !== 'string' || !HEX_RE.test(b.primaryColor))) return false
  if (b.accentColor  !== undefined && (typeof b.accentColor  !== 'string' || !HEX_RE.test(b.accentColor)))  return false
  if (b.companyName  !== undefined && (typeof b.companyName  !== 'string' || b.companyName.trim().length < 2)) return false
  return true
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

    let body: unknown
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    if (!validateBrandingUpdate(body)) {
      return NextResponse.json(
        { error: 'Invalid branding fields. Colors must be hex strings (e.g. #D4AF37).' },
        { status: 422 },
      )
    }

    const updated: WhiteLabelBranding = { ...DEMO_BRANDING, ...body }
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

    let body: unknown
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const b = body as Record<string, unknown>
    if (!b.agentId || typeof b.agentId !== 'string') {
      return NextResponse.json({ error: 'agentId required' }, { status: 422 })
    }

    const agent = DEMO_AGENTS.find((a) => a.id === b.agentId)
    if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

    const updated: AgentConfig = {
      ...agent,
      enabled:      typeof b.enabled === 'boolean'     ? b.enabled      : agent.enabled,
      systemPrompt: typeof b.systemPrompt === 'string' ? b.systemPrompt : agent.systemPrompt,
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

    let body: unknown
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const b = body as Record<string, unknown>
    if (!b.domain || typeof b.domain !== 'string') {
      return NextResponse.json({ error: 'domain required' }, { status: 422 })
    }

    // Real impl: check DNS TXT record for _forjegames-verify=<token>
    return NextResponse.json({
      domain:      b.domain,
      verified:    false,
      txtRecord:   `_forjegames-verify.${b.domain}`,
      txtValue:    `fj-verify=demo_token_${Date.now()}`,
      instructions: 'Add the TXT record to your DNS provider and re-verify in 10 minutes.',
      demo:        true,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
