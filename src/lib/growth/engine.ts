// ─── Growth Engine ────────────────────────────────────────────────────────────
// Core autonomous growth system: engagement tracking, onboarding generation,
// power-user identification, viral coefficient, and pricing optimization.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Types ────────────────────────────────────────────────────────────────────

export type FeatureUsage = {
  featureId: string
  featureName: string
  usageCount: number
  lastUsed: Date
  avgSessionDuration: number // seconds
}

export type EngagementPattern = {
  userId: string
  tier: 'DORMANT' | 'CASUAL' | 'ENGAGED' | 'POWER'
  sessionsLast30Days: number
  avgDailyTokens: number
  topFeatures: FeatureUsage[]
  churnRisk: number // 0-1
  daysSinceLastSession: number
  onboardingCompleted: boolean
  firstSessionDate: Date
}

export type OnboardingStep = {
  id: string
  title: string
  description: string
  ctaLabel: string
  ctaHref: string
  completionTrigger: string // event name that marks this done
  estimatedMinutes: number
  order: number
}

export type OnboardingFlow = {
  userId: string
  variant: 'creator' | 'consumer' | 'developer' | 'studio'
  steps: OnboardingStep[]
  currentStep: number
  completedSteps: string[]
}

export type PowerUserSignal = {
  userId: string
  username: string
  score: number // 0-100
  signals: string[]
  suggestedAction: 'invite_to_creator' | 'offer_team_plan' | 'featured_badge' | 'beta_access'
  estimatedLTV: number // USD cents
}

export type KFactorData = {
  k: number
  invitesSentPerUser: number
  conversionRate: number
  cycleTime: number // days
  trend: 'growing' | 'stable' | 'declining'
  historicalK: { week: string; k: number }[]
}

export type PricingOptimization = {
  currentTier: string
  suggestedUpsellTier: string
  upsellProbability: number // 0-1
  featureGaps: string[] // features they'd need that their current tier lacks
  priceElasticity: 'high' | 'medium' | 'low'
  recommendedTrigger: string // when to show the upsell
  estimatedRevenueLift: number // USD cents per month
}

// ─── Engagement classifier ────────────────────────────────────────────────────

export function classifyEngagement(
  sessionsLast30Days: number,
  avgDailyTokens: number,
): EngagementPattern['tier'] {
  if (sessionsLast30Days === 0) return 'DORMANT'
  if (sessionsLast30Days <= 4 || avgDailyTokens < 50) return 'CASUAL'
  if (sessionsLast30Days <= 15 || avgDailyTokens < 300) return 'ENGAGED'
  return 'POWER'
}

export function calculateChurnRisk(
  daysSinceLastSession: number,
  sessionsLast30Days: number,
  onboardingCompleted: boolean,
): number {
  let risk = 0

  // Recency — biggest factor
  if (daysSinceLastSession > 30) risk += 0.45
  else if (daysSinceLastSession > 14) risk += 0.30
  else if (daysSinceLastSession > 7) risk += 0.15
  else risk += 0.02

  // Frequency
  if (sessionsLast30Days === 0) risk += 0.35
  else if (sessionsLast30Days < 3) risk += 0.20
  else if (sessionsLast30Days < 8) risk += 0.10
  else risk += 0

  // Onboarding incomplete is a strong churn predictor
  if (!onboardingCompleted) risk += 0.15

  return Math.min(1, risk)
}

// ─── Personalized onboarding flow generator ──────────────────────────────────

const ONBOARDING_FLOWS: Record<OnboardingFlow['variant'], OnboardingStep[]> = {
  creator: [
    {
      id: 'publish_first_asset',
      title: 'Publish your first asset',
      description: 'Upload a Roblox template or script — start earning passive income from the marketplace.',
      ctaLabel: 'Go to Upload',
      ctaHref: '/marketplace?upload=1',
      completionTrigger: 'asset.published',
      estimatedMinutes: 5,
      order: 1,
    },
    {
      id: 'set_pricing',
      title: 'Set your pricing strategy',
      description: 'Assets priced between 200-800 tokens convert at 3x the rate of extremes.',
      ctaLabel: 'Edit Pricing',
      ctaHref: '/marketplace?tab=my-assets',
      completionTrigger: 'asset.priced',
      estimatedMinutes: 2,
      order: 2,
    },
    {
      id: 'share_to_community',
      title: 'Share with the community',
      description: 'Post your asset link in the community feed to get your first buyers.',
      ctaLabel: 'Open Community',
      ctaHref: '/community',
      completionTrigger: 'community.posted',
      estimatedMinutes: 3,
      order: 3,
    },
    {
      id: 'enable_referrals',
      title: 'Turn on referral rewards',
      description: 'Earn 20% lifetime commission on every creator you bring to ForjeGames.',
      ctaLabel: 'Get Referral Link',
      ctaHref: '/referrals',
      completionTrigger: 'referral.link_copied',
      estimatedMinutes: 1,
      order: 4,
    },
  ],
  consumer: [
    {
      id: 'buy_first_asset',
      title: 'Grab a free starter template',
      description: 'Browse 200+ free templates — get your first Roblox game running in minutes.',
      ctaLabel: 'Browse Free Assets',
      ctaHref: '/marketplace?filter=free',
      completionTrigger: 'asset.purchased',
      estimatedMinutes: 3,
      order: 1,
    },
    {
      id: 'try_ai_builder',
      title: 'Try the AI game builder',
      description: 'Describe your game in plain English — the AI writes the Luau scripts for you.',
      ctaLabel: 'Open AI Editor',
      ctaHref: '/editor',
      completionTrigger: 'editor.first_prompt',
      estimatedMinutes: 5,
      order: 2,
    },
    {
      id: 'follow_creator',
      title: 'Follow a top creator',
      description: 'Stay updated when they drop new assets or templates.',
      ctaLabel: 'Discover Creators',
      ctaHref: '/marketplace?tab=creators',
      completionTrigger: 'creator.followed',
      estimatedMinutes: 2,
      order: 3,
    },
  ],
  developer: [
    {
      id: 'connect_studio',
      title: 'Connect Roblox Studio',
      description: 'Install the ForjeGames Studio plugin to push scripts directly from the AI editor.',
      ctaLabel: 'Install Plugin',
      ctaHref: '/settings/integrations',
      completionTrigger: 'studio.connected',
      estimatedMinutes: 4,
      order: 1,
    },
    {
      id: 'first_ai_script',
      title: 'Generate your first script',
      description: 'Ask the AI for a DataStore leaderboard — see production-grade Luau in seconds.',
      ctaLabel: 'Open Editor',
      ctaHref: '/editor',
      completionTrigger: 'editor.script_generated',
      estimatedMinutes: 3,
      order: 2,
    },
    {
      id: 'explore_game_dna',
      title: 'Analyze a competitor game',
      description: 'Paste a Roblox game URL — Game DNA reverse-engineers its mechanics.',
      ctaLabel: 'Open Game DNA',
      ctaHref: '/game-dna',
      completionTrigger: 'game_dna.first_scan',
      estimatedMinutes: 5,
      order: 3,
    },
  ],
  studio: [
    {
      id: 'invite_team',
      title: 'Invite your team',
      description: 'Add teammates with shared token budgets and role-based access.',
      ctaLabel: 'Invite Members',
      ctaHref: '/team',
      completionTrigger: 'team.member_invited',
      estimatedMinutes: 3,
      order: 1,
    },
    {
      id: 'create_project',
      title: 'Create a shared project',
      description: 'Organize all assets, scripts, and AI builds under one project.',
      ctaLabel: 'New Project',
      ctaHref: '/editor?new=1',
      completionTrigger: 'project.created',
      estimatedMinutes: 2,
      order: 2,
    },
    {
      id: 'set_token_budget',
      title: 'Set team token budgets',
      description: 'Prevent runaway AI costs by capping per-member daily token spend.',
      ctaLabel: 'Manage Billing',
      ctaHref: '/billing',
      completionTrigger: 'team.budget_set',
      estimatedMinutes: 2,
      order: 3,
    },
  ],
}

export function generateOnboardingFlow(
  userId: string,
  variant: OnboardingFlow['variant'],
  completedSteps: string[] = [],
): OnboardingFlow {
  const steps = ONBOARDING_FLOWS[variant]
  const currentStep = steps.findIndex(
    (s) => !completedSteps.includes(s.completionTrigger),
  )

  return {
    userId,
    variant,
    steps,
    currentStep: currentStep === -1 ? steps.length : currentStep,
    completedSteps,
  }
}

export function detectOnboardingVariant(
  jobTitle?: string,
  intendedUse?: string,
): OnboardingFlow['variant'] {
  const combined = `${jobTitle ?? ''} ${intendedUse ?? ''}`.toLowerCase()
  if (combined.includes('team') || combined.includes('studio') || combined.includes('company')) return 'studio'
  if (combined.includes('sell') || combined.includes('creator') || combined.includes('publish')) return 'creator'
  if (combined.includes('script') || combined.includes('dev') || combined.includes('code')) return 'developer'
  return 'consumer'
}

// ─── Power user identification ────────────────────────────────────────────────

export function scorePowerUser(pattern: EngagementPattern): PowerUserSignal {
  let score = 0
  const signals: string[] = []

  if (pattern.sessionsLast30Days >= 20) { score += 25; signals.push('20+ sessions this month') }
  else if (pattern.sessionsLast30Days >= 10) { score += 15; signals.push('10+ sessions this month') }

  if (pattern.avgDailyTokens >= 500) { score += 25; signals.push('500+ tokens/day avg') }
  else if (pattern.avgDailyTokens >= 200) { score += 12; signals.push('200+ tokens/day avg') }

  if (pattern.churnRisk < 0.1) { score += 15; signals.push('Very low churn risk') }

  const topFeature = pattern.topFeatures[0]
  if (topFeature?.featureId === 'editor') { score += 10; signals.push('Heavy AI editor user') }
  if (topFeature?.featureId === 'marketplace_publish') { score += 20; signals.push('Active marketplace seller') }
  if (topFeature?.featureId === 'game_dna') { score += 10; signals.push('Game DNA power user') }

  if (pattern.topFeatures.length >= 4) { score += 5; signals.push('Broad feature adoption') }

  let suggestedAction: PowerUserSignal['suggestedAction'] = 'beta_access'
  if (score >= 70 && !pattern.topFeatures.find((f) => f.featureId === 'marketplace_publish')) {
    suggestedAction = 'invite_to_creator'
  } else if (score >= 60) {
    suggestedAction = 'offer_team_plan'
  } else if (score >= 40) {
    suggestedAction = 'featured_badge'
  }

  const estimatedLTV = Math.round(
    (pattern.avgDailyTokens * 0.001 * 30 * 12 * 100) + // annual token spend in cents
    (pattern.sessionsLast30Days * 50),                   // engagement premium
  )

  return {
    userId: pattern.userId,
    username: `user_${pattern.userId.slice(-6)}`,
    score,
    signals,
    suggestedAction,
    estimatedLTV,
  }
}

// ─── Viral coefficient (K-factor) ────────────────────────────────────────────

export function calculateKFactor(
  totalUsers: number,
  invitesSentLast30Days: number,
  newSignupsFromInvites: number,
): KFactorData {
  const invitesSentPerUser = totalUsers > 0 ? invitesSentLast30Days / totalUsers : 0
  const conversionRate = invitesSentLast30Days > 0
    ? newSignupsFromInvites / invitesSentLast30Days
    : 0
  const k = invitesSentPerUser * conversionRate

  // Synthetic historical trend for demo
  const historicalK: { week: string; k: number }[] = [
    { week: 'Feb W1', k: +(k * 0.72).toFixed(2) },
    { week: 'Feb W2', k: +(k * 0.81).toFixed(2) },
    { week: 'Feb W3', k: +(k * 0.88).toFixed(2) },
    { week: 'Feb W4', k: +(k * 0.95).toFixed(2) },
    { week: 'Mar W1', k: +(k * 0.98).toFixed(2) },
    { week: 'Mar W2', k: +(k * 1.02).toFixed(2) },
    { week: 'Mar W3', k: +(k * 1.00).toFixed(2) },
    { week: 'Mar W4', k: +k.toFixed(2) },
  ]

  const trend: KFactorData['trend'] =
    historicalK[7].k > historicalK[4].k * 1.05 ? 'growing'
    : historicalK[7].k < historicalK[4].k * 0.95 ? 'declining'
    : 'stable'

  return {
    k: +k.toFixed(3),
    invitesSentPerUser: +invitesSentPerUser.toFixed(2),
    conversionRate: +conversionRate.toFixed(3),
    cycleTime: 7, // days avg from invite to signup
    trend,
    historicalK,
  }
}

// ─── Pricing optimization suggestions ────────────────────────────────────────

const TIER_FEATURE_MAP: Record<string, string[]> = {
  FREE:    ['basic_editor', 'marketplace_browse'],
  STARTER: ['basic_editor', 'marketplace_browse', 'ai_scripts_limited', 'marketplace_publish'],
  PRO:     ['basic_editor', 'marketplace_browse', 'ai_scripts_unlimited', 'marketplace_publish', 'game_dna', 'image_to_map'],
  TEAM:    ['basic_editor', 'marketplace_browse', 'ai_scripts_unlimited', 'marketplace_publish', 'game_dna', 'image_to_map', 'team_workspace', 'priority_support'],
}

const NEXT_TIER: Record<string, string> = {
  FREE: 'STARTER',
  STARTER: 'PRO',
  PRO: 'TEAM',
  TEAM: 'TEAM',
}

const REVENUE_LIFT: Record<string, number> = {
  FREE_to_STARTER: 999,      // $9.99/mo in cents
  STARTER_to_PRO: 2000,      // $20/mo uplift
  PRO_to_TEAM: 5000,         // $50/mo uplift
}

export function suggestPricingOptimization(
  pattern: EngagementPattern,
  currentTier: string,
): PricingOptimization {
  const currentFeatures = TIER_FEATURE_MAP[currentTier] ?? TIER_FEATURE_MAP.FREE
  const nextTier = NEXT_TIER[currentTier] ?? currentTier
  const nextFeatures = TIER_FEATURE_MAP[nextTier] ?? currentFeatures

  const featureGaps = nextFeatures.filter((f) => !currentFeatures.includes(f)).map((f) => {
    const labels: Record<string, string> = {
      ai_scripts_unlimited: 'Unlimited AI script generation',
      game_dna: 'Game DNA competitor scanner',
      image_to_map: 'Image-to-map conversion',
      team_workspace: 'Shared team workspace',
      priority_support: 'Priority support',
    }
    return labels[f] ?? f
  })

  // Estimate upsell probability from engagement signals
  let probability = 0.1
  if (pattern.tier === 'POWER') probability = 0.72
  else if (pattern.tier === 'ENGAGED') probability = 0.41
  else if (pattern.tier === 'CASUAL') probability = 0.18

  const priceElasticity: PricingOptimization['priceElasticity'] =
    pattern.avgDailyTokens >= 400 ? 'low'
    : pattern.avgDailyTokens >= 150 ? 'medium'
    : 'high'

  let recommendedTrigger = 'After 3rd AI generation this week'
  if (currentTier === 'FREE') recommendedTrigger = 'When hitting free token limit'
  if (currentTier === 'STARTER') recommendedTrigger = 'When accessing a locked feature'
  if (currentTier === 'PRO') recommendedTrigger = 'When inviting a second team member'

  const liftKey = `${currentTier}_to_${nextTier}` as keyof typeof REVENUE_LIFT
  const estimatedRevenueLift = REVENUE_LIFT[liftKey] ?? 0

  return {
    currentTier,
    suggestedUpsellTier: nextTier,
    upsellProbability: probability,
    featureGaps,
    priceElasticity,
    recommendedTrigger,
    estimatedRevenueLift,
  }
}

// ─── Demo data ────────────────────────────────────────────────────────────────

export function getDemoEngagementPatterns(): EngagementPattern[] {
  return [
    {
      userId: 'demo_001',
      tier: 'POWER',
      sessionsLast30Days: 24,
      avgDailyTokens: 620,
      topFeatures: [
        { featureId: 'editor', featureName: 'AI Editor', usageCount: 187, lastUsed: new Date(), avgSessionDuration: 840 },
        { featureId: 'game_dna', featureName: 'Game DNA', usageCount: 43, lastUsed: new Date(), avgSessionDuration: 300 },
        { featureId: 'marketplace_publish', featureName: 'Publish Assets', usageCount: 12, lastUsed: new Date(), avgSessionDuration: 120 },
        { featureId: 'image_to_map', featureName: 'Image to Map', usageCount: 8, lastUsed: new Date(), avgSessionDuration: 240 },
      ],
      churnRisk: 0.04,
      daysSinceLastSession: 0,
      onboardingCompleted: true,
      firstSessionDate: new Date('2026-01-15'),
    },
    {
      userId: 'demo_002',
      tier: 'ENGAGED',
      sessionsLast30Days: 11,
      avgDailyTokens: 210,
      topFeatures: [
        { featureId: 'editor', featureName: 'AI Editor', usageCount: 52, lastUsed: new Date(), avgSessionDuration: 600 },
        { featureId: 'marketplace_browse', featureName: 'Marketplace', usageCount: 28, lastUsed: new Date(), avgSessionDuration: 180 },
      ],
      churnRisk: 0.17,
      daysSinceLastSession: 2,
      onboardingCompleted: true,
      firstSessionDate: new Date('2026-02-08'),
    },
    {
      userId: 'demo_003',
      tier: 'CASUAL',
      sessionsLast30Days: 3,
      avgDailyTokens: 40,
      topFeatures: [
        { featureId: 'marketplace_browse', featureName: 'Marketplace', usageCount: 9, lastUsed: new Date(), avgSessionDuration: 120 },
      ],
      churnRisk: 0.58,
      daysSinceLastSession: 9,
      onboardingCompleted: false,
      firstSessionDate: new Date('2026-03-01'),
    },
  ]
}
