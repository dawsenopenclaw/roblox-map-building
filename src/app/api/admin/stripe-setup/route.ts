import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// ─── Price ID configuration map ───────────────────────────────────────────────

type PriceConfig = {
  envKey: string
  label: string
  description: string
  required: boolean
}

const PRICE_CONFIGS: PriceConfig[] = [
  // Subscriptions — monthly
  { envKey: 'STRIPE_HOBBY_PRICE_ID',          label: 'Hobby (monthly)',   description: '$9.99/mo — 2,000 tokens',   required: true },
  { envKey: 'STRIPE_CREATOR_PRICE_ID',        label: 'Creator (monthly)', description: '$24.99/mo — 7,000 tokens',  required: true },
  { envKey: 'STRIPE_STUDIO_PRICE_ID',         label: 'Studio (monthly)',  description: '$49.99/mo — 20,000 tokens', required: true },
  // Subscriptions — yearly
  { envKey: 'STRIPE_HOBBY_YEARLY_PRICE_ID',   label: 'Hobby (yearly)',    description: '$95.90/yr — 20% off',       required: false },
  { envKey: 'STRIPE_CREATOR_YEARLY_PRICE_ID', label: 'Creator (yearly)',  description: '$239.90/yr — 20% off',      required: false },
  { envKey: 'STRIPE_STUDIO_YEARLY_PRICE_ID',  label: 'Studio (yearly)',   description: '$479.90/yr — 20% off',      required: false },
  // Token packs
  { envKey: 'STRIPE_TOKEN_STARTER_PRICE_ID',  label: 'Token Starter pack', description: '$10 — 1,000 tokens',       required: false },
  { envKey: 'STRIPE_TOKEN_CREATOR_PRICE_ID',  label: 'Token Creator pack', description: '$45 — 5,000 tokens',       required: false },
  { envKey: 'STRIPE_TOKEN_PRO_PRICE_ID',      label: 'Token Pro pack',     description: '$120 — 15,000 tokens',     required: false },
]

type PriceStatus = PriceConfig & {
  configured: boolean
  value: string | null // first 8 chars only — safe to expose to admin
}

type SetupStatus = {
  stripeConfigured: boolean
  webhookConfigured: boolean
  prices: PriceStatus[]
  allRequiredConfigured: boolean
  summary: {
    total: number
    configured: number
    missing: number
    requiredMissing: string[]
  }
}

// ─── Admin auth guard ─────────────────────────────────────────────────────────

async function isAdmin(clerkId: string): Promise<boolean> {
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim()).filter(Boolean)
  if (adminEmails.length === 0) return true // no allowlist set — allow any authenticated user in dev

  try {
    const { db } = await import('@/lib/db')
    const user = await db.user.findUnique({ where: { clerkId }, select: { email: true } })
    return user ? adminEmails.includes(user.email) : false
  } catch {
    return false
  }
}

// ─── GET /api/admin/stripe-setup ─────────────────────────────────────────────

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!(await isAdmin(clerkId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const prices: PriceStatus[] = PRICE_CONFIGS.map((cfg) => {
    const raw = process.env[cfg.envKey] ?? ''
    const configured = raw.trim().length > 0
    return {
      ...cfg,
      configured,
      value: configured ? `${raw.slice(0, 8)}...` : null,
    }
  })

  const requiredMissing = prices
    .filter((p) => p.required && !p.configured)
    .map((p) => p.envKey)

  const status: SetupStatus = {
    stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
    webhookConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim()),
    prices,
    allRequiredConfigured: requiredMissing.length === 0,
    summary: {
      total: prices.length,
      configured: prices.filter((p) => p.configured).length,
      missing: prices.filter((p) => !p.configured).length,
      requiredMissing,
    },
  }

  return NextResponse.json(status)
}
