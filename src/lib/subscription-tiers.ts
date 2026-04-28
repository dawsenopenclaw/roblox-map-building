import { serverEnv } from './env'

export const SUBSCRIPTION_TIERS = {
  FREE: {
    name: 'Free',
    priceMonthly: 0,
    priceYearly: 0,
    tokensPerMonth: 1000,
    features: ['1,000 tokens (one-time grant)', '10 builds per day', 'Basic terrain', 'Single builds only', 'Community support'],
    stripePriceIdMonthly: serverEnv.STRIPE_FREE_PRICE_ID || '',
    stripePriceIdYearly: '',
  },
  STARTER: {
    name: 'Starter',
    priceMonthly: 1000, // $10
    priceYearly: 9600, // $96/yr ($8/mo)
    tokensPerMonth: 5000,
    features: ['5,000 tokens/month', '30 builds per day', 'Voice-to-game', 'Image-to-map', '3D asset gen', 'Step-by-step game builder (basic)', 'Email support'],
    stripePriceIdMonthly: serverEnv.STRIPE_HOBBY_PRICE_ID || '',
    stripePriceIdYearly: serverEnv.STRIPE_HOBBY_YEARLY_PRICE_ID || '',
  },
  BUILDER: {
    name: 'Builder',
    priceMonthly: 2500, // $25
    priceYearly: 24000, // $240/yr ($20/mo)
    tokensPerMonth: 15000,
    features: ['15,000 tokens/month', '75 builds per day', 'All Starter features', 'UI builder', 'Game system templates', 'Full game builder', 'Script generation', 'Priority support'],
    stripePriceIdMonthly: serverEnv.STRIPE_BUILDER_PRICE_ID || '',
    stripePriceIdYearly: serverEnv.STRIPE_BUILDER_YEARLY_PRICE_ID || '',
  },
  CREATOR: {
    name: 'Creator',
    priceMonthly: 5000, // $50
    priceYearly: 48000, // $480/yr ($40/mo)
    tokensPerMonth: 40000,
    features: ['40,000 tokens/month', 'Unlimited builds', 'All Builder features', 'Marketplace access', 'Unlimited game builds', 'Game DNA scanner', 'Team collab (3 members)', 'Full game orchestrator'],
    stripePriceIdMonthly: serverEnv.STRIPE_CREATOR_PRICE_ID || '',
    stripePriceIdYearly: serverEnv.STRIPE_CREATOR_YEARLY_PRICE_ID || '',
  },
  PRO: {
    name: 'Pro',
    priceMonthly: 15000, // $150
    priceYearly: 144000, // $1440/yr ($120/mo)
    tokensPerMonth: 100000,
    features: ['100,000 tokens/month', 'Unlimited everything', 'All Creator features', 'Bulk 3D generation', 'Advanced analytics', 'Team collab (10 members)', 'Priority queue', 'Custom AI training'],
    stripePriceIdMonthly: serverEnv.STRIPE_PRO_PRICE_ID || '',
    stripePriceIdYearly: serverEnv.STRIPE_PRO_YEARLY_PRICE_ID || '',
  },
  STUDIO: {
    name: 'Studio',
    priceMonthly: 20000, // $200
    priceYearly: 192000, // $1920/yr ($160/mo)
    tokensPerMonth: 200000,
    features: ['200,000 tokens/month', 'Unlimited everything', 'All Pro features', 'API access', 'White-label builds', 'Team collab (50 members)', 'Dedicated support', 'Custom integrations', 'SLA guarantee'],
    stripePriceIdMonthly: serverEnv.STRIPE_STUDIO_PRICE_ID || '',
    stripePriceIdYearly: serverEnv.STRIPE_STUDIO_YEARLY_PRICE_ID || '',
  },
} as const

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS

// Backward compat — map old HOBBY tier to STARTER
export function normalizeTier(tier: string): SubscriptionTier {
  if (tier === 'HOBBY') return 'STARTER'
  if (tier in SUBSCRIPTION_TIERS) return tier as SubscriptionTier
  return 'FREE'
}

export function getTierTokenAllowance(tier: SubscriptionTier | string): number {
  const normalized = normalizeTier(tier)
  return SUBSCRIPTION_TIERS[normalized].tokensPerMonth
}

export const TOKEN_PACKS = [
  { slug: 'starter', name: 'Starter Pack', tokens: 1000, priceCents: 1000, stripePriceId: serverEnv.STRIPE_TOKEN_STARTER_PRICE_ID || '' },
  { slug: 'creator', name: 'Creator Pack', tokens: 5000, priceCents: 4500, stripePriceId: serverEnv.STRIPE_TOKEN_CREATOR_PRICE_ID || '' },
  { slug: 'pro', name: 'Pro Pack', tokens: 15000, priceCents: 12000, stripePriceId: serverEnv.STRIPE_TOKEN_PRO_PRICE_ID || '' },
] as const

export function getTokenPackBySlug(slug: string) {
  return TOKEN_PACKS.find(p => p.slug === slug) || null
}
