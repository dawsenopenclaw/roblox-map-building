export const SUBSCRIPTION_TIERS = {
  FREE: {
    name: 'Free',
    priceMonthly: 0,
    priceYearly: 0,
    tokensPerMonth: 500,
    features: ['500 tokens/month', 'Basic terrain generation', 'Community support'],
    stripePriceIdMonthly: process.env.STRIPE_FREE_PRICE_ID || '',
    stripePriceIdYearly: '',
  },
  HOBBY: {
    name: 'Hobby',
    priceMonthly: 999, // cents
    priceYearly: 9590, // cents (20% discount)
    tokensPerMonth: 2000,
    features: ['2,000 tokens/month', 'Voice-to-game', 'Image-to-map', 'Email support'],
    stripePriceIdMonthly: process.env.STRIPE_HOBBY_PRICE_ID || '',
    stripePriceIdYearly: process.env.STRIPE_HOBBY_YEARLY_PRICE_ID || '',
  },
  CREATOR: {
    name: 'Creator',
    priceMonthly: 2499,
    priceYearly: 23990,
    tokensPerMonth: 7000,
    features: ['7,000 tokens/month', 'All Hobby features', 'Game DNA scanner', 'Priority support'],
    stripePriceIdMonthly: process.env.STRIPE_CREATOR_PRICE_ID || '',
    stripePriceIdYearly: process.env.STRIPE_CREATOR_YEARLY_PRICE_ID || '',
  },
  STUDIO: {
    name: 'Studio',
    priceMonthly: 4999,
    priceYearly: 47990,
    tokensPerMonth: 20000,
    features: ['20,000 tokens/month', 'All Creator features', 'Team collaboration', 'API access', 'Dedicated support'],
    stripePriceIdMonthly: process.env.STRIPE_STUDIO_PRICE_ID || '',
    stripePriceIdYearly: process.env.STRIPE_STUDIO_YEARLY_PRICE_ID || '',
  },
} as const

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS

export function getTierTokenAllowance(tier: SubscriptionTier): number {
  return SUBSCRIPTION_TIERS[tier].tokensPerMonth
}

export const TOKEN_PACKS = [
  { slug: 'starter', name: 'Starter Pack', tokens: 1000, priceCents: 1000, stripePriceId: process.env.STRIPE_TOKEN_STARTER_PRICE_ID || '' },
  { slug: 'creator', name: 'Creator Pack', tokens: 5000, priceCents: 4500, stripePriceId: process.env.STRIPE_TOKEN_CREATOR_PRICE_ID || '' },
  { slug: 'pro', name: 'Pro Pack', tokens: 15000, priceCents: 12000, stripePriceId: process.env.STRIPE_TOKEN_PRO_PRICE_ID || '' },
] as const

export function getTokenPackBySlug(slug: string) {
  return TOKEN_PACKS.find(p => p.slug === slug) || null
}
