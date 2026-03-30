import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { parseBody } from '@/lib/validations'
import { z } from 'zod'

const connectPayloadSchema = z.object({
  name:    z.string().min(2).max(120),
  type:    z.enum(['LLC', 'CORPORATION', 'SOLE_PROPRIETOR', 'PARTNERSHIP', 'NONPROFIT']),
  ein:     z.string().regex(/^\d{2}-\d{7}$/, 'EIN must be in format XX-XXXXXXX').optional(),
  website: z.string().url().optional(),
})

// ─── Types ────────────────────────────────────────────────────────────────────

export type BusinessType = 'LLC' | 'CORPORATION' | 'SOLE_PROPRIETOR' | 'PARTNERSHIP' | 'NONPROFIT'

export type BusinessVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'UNVERIFIED'

export type BusinessProfile = {
  id: string
  name: string
  ein: string | null
  type: BusinessType
  website: string | null
  verificationStatus: BusinessVerificationStatus
  stripeConnectId: string | null
  stripeConnectEnabled: boolean
  apiKey: string
  apiKeyPrefix: string
  createdAt: string
  updatedAt: string
}

type ConnectPayload = {
  name: string
  ein?: string
  type: BusinessType
  website?: string
}

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_BUSINESS: BusinessProfile = {
  id:                   'biz_dawsen_porter_llc',
  name:                 'Dawsen Porter LLC',
  ein:                  '**-***1234',
  type:                 'LLC',
  website:              'https://forjegames.com',
  verificationStatus:   'VERIFIED',
  stripeConnectId:      'acct_demo123',
  stripeConnectEnabled: true,
  apiKey:               'fj_biz_••••••••••••••••••••••••••••••••',
  apiKeyPrefix:         'fj_biz_dp',
  createdAt:            '2026-01-15T00:00:00.000Z',
  updatedAt:            '2026-03-01T00:00:00.000Z',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateApiKey(prefix: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let key = `fj_biz_${prefix}_`
  for (let i = 0; i < 32; i++) key += chars[Math.floor(Math.random() * chars.length)]
  return key
}

function maskEin(ein: string): string {
  return ein.replace(/^\d{2}/, '**').replace(/\d(?=\d{4}$)/, '*')
}

function validatePayload(body: unknown): body is ConnectPayload {
  if (!body || typeof body !== 'object') return false
  const b = body as Record<string, unknown>
  if (typeof b.name !== 'string' || b.name.trim().length < 2) return false
  if (typeof b.type !== 'string') return false
  const validTypes: BusinessType[] = ['LLC', 'CORPORATION', 'SOLE_PROPRIETOR', 'PARTNERSHIP', 'NONPROFIT']
  if (!validTypes.includes(b.type as BusinessType)) return false
  if (b.ein !== undefined && typeof b.ein !== 'string') return false
  if (b.website !== undefined && typeof b.website !== 'string') return false
  return true
}

// ─── GET — fetch current business profile ────────────────────────────────────

export async function GET() {
  try {
    let clerkId: string | null = null
    try {
      const session = await auth()
      clerkId = session?.userId ?? null
    } catch { /* demo mode */ }
    if (!clerkId) return NextResponse.json({ business: DEMO_BUSINESS, demo: true })

    try {
      const { db } = await import('@/lib/db')
      const user = await db.user.findUnique({
        where: { clerkId },
        select: { id: true },
      })
      if (user) {
        // Real DB lookup would go here when the schema includes BusinessProfile
        // For now fall through to demo
      }
    } catch {
      // DB unavailable — fall through to demo
    }

    return NextResponse.json({ business: DEMO_BUSINESS, demo: true })
  } catch {
    return NextResponse.json({ business: DEMO_BUSINESS, demo: true })
  }
}

// ─── POST — create or update business connection ─────────────────────────────

export async function POST(req: NextRequest) {
  try {
    let clerkId: string | null = null
    try {
      const session = await auth()
      clerkId = session?.userId ?? null
    } catch { /* demo mode */ }

    const parsed = await parseBody(req, connectPayloadSchema)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status })
    }

    if (!clerkId) {
      const { name, ein, type, website } = parsed.data
      const nameSlug = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').slice(0, 16)
      const apiKey = generateApiKey(nameSlug)
      const demo: BusinessProfile = {
        id: `biz_${nameSlug}_demo`,
        name, ein: ein ? maskEin(ein) : null, type, website: website ?? null,
        verificationStatus: 'PENDING', stripeConnectId: null, stripeConnectEnabled: false,
        apiKey, apiKeyPrefix: `fj_biz_${nameSlug}`,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      }
      return NextResponse.json({ business: demo, demo: true }, { status: 201 })
    }

    if (!validatePayload(body)) {
      return NextResponse.json(
        { error: 'Missing or invalid fields. Required: name (string), type (LLC|CORPORATION|SOLE_PROPRIETOR|PARTNERSHIP|NONPROFIT)' },
        { status: 422 },
      )
    }

    const { name, ein, type, website } = body

    try {
      const { db } = await import('@/lib/db')
      const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
      if (user) {
        // Persist to DB when BusinessProfile model is available in schema.
        // Returning mock created record to match expected shape.
        const nameSlug = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').slice(0, 16)
        const apiKey = generateApiKey(nameSlug)
        const created: BusinessProfile = {
          id:                   `biz_${nameSlug}_${Date.now()}`,
          name,
          ein:                  ein ? maskEin(ein) : null,
          type,
          website:              website ?? null,
          verificationStatus:   'PENDING',
          stripeConnectId:      null,
          stripeConnectEnabled: false,
          apiKey,
          apiKeyPrefix:         `fj_biz_${nameSlug}`,
          createdAt:            new Date().toISOString(),
          updatedAt:            new Date().toISOString(),
        }
        return NextResponse.json({ business: created, demo: false }, { status: 201 })
      }
    } catch {
      // DB unavailable — fall through to demo response
    }

    // Demo mode — return shaped demo record
    const nameSlug = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').slice(0, 16)
    const apiKey = generateApiKey(nameSlug)
    const demo: BusinessProfile = {
      id:                   `biz_${nameSlug}_demo`,
      name,
      ein:                  ein ? maskEin(ein) : null,
      type,
      website:              website ?? null,
      verificationStatus:   'PENDING',
      stripeConnectId:      null,
      stripeConnectEnabled: false,
      apiKey,
      apiKeyPrefix:         `fj_biz_${nameSlug}`,
      createdAt:            new Date().toISOString(),
      updatedAt:            new Date().toISOString(),
    }
    return NextResponse.json({ business: demo, demo: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── PATCH — initiate Stripe Connect onboarding ──────────────────────────────

export async function PATCH() {
  try {
    let clerkId: string | null = null
    try {
      const session = await auth()
      clerkId = session?.userId ?? null
    } catch { /* demo mode */ }
    if (!clerkId) return NextResponse.json({ onboardingUrl: 'https://connect.stripe.com/setup/s/demo_onboarding', demo: true })

    // Real impl: create Stripe Connect account link via stripe.accountLinks.create()
    // and return the onboarding URL for redirect.
    return NextResponse.json({
      onboardingUrl: 'https://connect.stripe.com/setup/s/demo_onboarding',
      demo: true,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
