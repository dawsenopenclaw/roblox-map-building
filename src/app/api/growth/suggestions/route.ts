// ─── Growth Suggestions API ───────────────────────────────────────────────────
// AI-powered (or demo) suggestions: what to build, who to target, how to price,
// when to engage. Falls back to pre-computed demo suggestions when no AI key.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import {
  getDemoMarketplaceMetrics,
  generateCreatorSuggestions,
} from '@/lib/growth/marketplace-network'
import {
  getDemoEngagementPatterns,
  scorePowerUser,
  suggestPricingOptimization,
} from '@/lib/growth/engine'

// ─── Types ────────────────────────────────────────────────────────────────────

export type BuildSuggestion = {
  id: string
  title: string
  rationale: string
  category: string
  estimatedEarnings: string
  urgency: 'now' | 'this week' | 'this month'
  difficulty: 'easy' | 'medium' | 'hard'
  keywords: string[]
}

export type TargetingSuggestion = {
  id: string
  segmentName: string
  description: string
  estimatedSize: number
  suggestedMessage: string
  channel: 'email' | 'in-app' | 'push' | 'discord'
  expectedConversionRate: number
}

export type PricingSuggestion = {
  id: string
  title: string
  rationale: string
  currentState: string
  recommendedAction: string
  estimatedRevenueLift: string
  confidence: 'high' | 'medium' | 'low'
}

export type EngagementTiming = {
  id: string
  trigger: string
  timing: string
  message: string
  channel: 'email' | 'in-app' | 'push'
  estimatedCTR: number
}

export type GrowthSuggestionsResponse = {
  build: BuildSuggestion[]
  targeting: TargetingSuggestion[]
  pricing: PricingSuggestion[]
  engagement: EngagementTiming[]
  powerUserAlerts: {
    userId: string
    username: string
    score: number
    suggestedAction: string
    reason: string
  }[]
  generatedAt: string
  demo: boolean
}

// ─── Demo suggestions ─────────────────────────────────────────────────────────

function buildDemoSuggestions(): GrowthSuggestionsResponse {
  const marketplace = getDemoMarketplaceMetrics()
  const creatorSuggestions = generateCreatorSuggestions(marketplace.gaps)
  const patterns = getDemoEngagementPatterns()

  const build: BuildSuggestion[] = creatorSuggestions.map((s) => ({
    id: s.id,
    title: s.title,
    rationale: s.rationale,
    category: s.category,
    estimatedEarnings: s.estimatedEarnings,
    urgency: s.urgency,
    difficulty: s.difficulty,
    keywords: s.suggestedKeywords,
  }))

  const targeting: TargetingSuggestion[] = [
    {
      id: 'target_power_dormant',
      segmentName: 'Power users who went dormant',
      description: 'Users with 20+ sessions/month who haven\'t logged in for 8+ days.',
      estimatedSize: 87,
      suggestedMessage: 'Your builds are waiting — new AI features dropped since your last visit.',
      channel: 'email',
      expectedConversionRate: 0.34,
    },
    {
      id: 'target_incomplete_onboarding',
      segmentName: 'Incomplete onboarding',
      description: 'Users who signed up but never completed step 2 of onboarding.',
      estimatedSize: 342,
      suggestedMessage: 'You\'re one step away from your first AI-generated script.',
      channel: 'in-app',
      expectedConversionRate: 0.28,
    },
    {
      id: 'target_free_heavy',
      segmentName: 'Free-tier power consumers',
      description: 'Free users who hit their token limit 3+ times in the last 30 days.',
      estimatedSize: 156,
      suggestedMessage: 'You\'ve hit your limit again — unlock unlimited AI builds for $9.99/mo.',
      channel: 'in-app',
      expectedConversionRate: 0.41,
    },
    {
      id: 'target_marketplace_lurkers',
      segmentName: 'Marketplace lurkers',
      description: 'Users with 10+ marketplace searches but 0 purchases in 30 days.',
      estimatedSize: 428,
      suggestedMessage: 'Still looking? Here are 3 top-rated scripts matching your searches.',
      channel: 'email',
      expectedConversionRate: 0.19,
    },
  ]

  const pricing: PricingSuggestion[] = [
    {
      id: 'price_annual_discount',
      title: 'Introduce annual billing discount',
      rationale: 'Users with 6+ months tenure have near-zero churn. An annual plan at 20% off converts ~22% of monthly Pro users and locks in 12-month revenue.',
      currentState: 'Monthly-only billing on all tiers',
      recommendedAction: 'Add annual toggle on /billing page — show "Save 20%" badge prominently',
      estimatedRevenueLift: '$2,400/month in locked ARR',
      confidence: 'high',
    },
    {
      id: 'price_token_bundles',
      title: 'Add token bundle top-ups',
      rationale: '312 users hit their token limit last month. A $4.99 "Token Burst" (5,000 tokens, no subscription required) converts at ~38% for limit-hit users.',
      currentState: 'Tokens only flow via subscription tier',
      recommendedAction: 'Add token purchase panel on /tokens page with 3 bundle sizes: 2k / 5k / 15k',
      estimatedRevenueLift: '$1,820/month incremental',
      confidence: 'high',
    },
    {
      id: 'price_creator_revenue_share',
      title: 'Increase creator revenue share from 70% to 80%',
      rationale: 'Top marketplace creators on competing platforms get 80-85%. Raising to 80% would attract 40+ established Roblox creators, increasing total supply by ~25%.',
      currentState: '70/30 creator/platform split',
      recommendedAction: 'Apply 80% rate to creators with 10+ published assets or 4.5+ avg rating',
      estimatedRevenueLift: '+25% GMV = +$18,400/month at current scale',
      confidence: 'medium',
    },
  ]

  const engagement: EngagementTiming[] = [
    {
      id: 'engage_day3_nudge',
      trigger: 'User completes onboarding but hasn\'t used editor for 3 days',
      timing: 'Day 3 post-signup, 10am user local time',
      message: 'You built your profile — now build your first game. The AI editor takes 2 minutes.',
      channel: 'email',
      estimatedCTR: 0.31,
    },
    {
      id: 'engage_token_refill',
      trigger: 'User\'s token balance drops below 200',
      timing: 'Immediate in-app banner on next session',
      message: 'Running low on tokens. Upgrade to Pro for unlimited builds — or grab a token pack.',
      channel: 'in-app',
      estimatedCTR: 0.45,
    },
    {
      id: 'engage_creator_birthday',
      trigger: 'Creator\'s first asset hits 30 days on marketplace',
      timing: '30-day anniversary of first publish',
      message: 'Your first asset has been live for 30 days. Here\'s what\'s selling right now — build your next one.',
      channel: 'email',
      estimatedCTR: 0.42,
    },
    {
      id: 'engage_weekend_builder',
      trigger: 'User\'s activity peaks on weekends based on 4-week pattern',
      timing: 'Friday 6pm user local time',
      message: 'Weekend builder spotted. New scripts dropped this week — check out what\'s trending.',
      channel: 'push',
      estimatedCTR: 0.22,
    },
  ]

  const powerUserAlerts = patterns
    .map((p) => scorePowerUser(p))
    .filter((s) => s.score >= 40)
    .map((s) => {
      const actionLabels: Record<typeof s.suggestedAction, string> = {
        invite_to_creator: 'Invite to publish on marketplace',
        offer_team_plan: 'Offer Team plan upgrade',
        featured_badge: 'Grant Featured Creator badge',
        beta_access: 'Grant early beta access',
      }
      return {
        userId: s.userId,
        username: s.username,
        score: s.score,
        suggestedAction: actionLabels[s.suggestedAction],
        reason: s.signals.slice(0, 2).join(', '),
      }
    })

  // Supplement with static demo power users for richer demo
  powerUserAlerts.push(
    { userId: 'demo_pw_1', username: 'BloxStudio_Pro',  score: 94, suggestedAction: 'Invite to publish on marketplace', reason: '24 sessions this month, 500+ tokens/day avg' },
    { userId: 'demo_pw_2', username: 'DevMaster_Z',     score: 81, suggestedAction: 'Offer Team plan upgrade',          reason: '18 sessions this month, broad feature adoption' },
    { userId: 'demo_pw_3', username: 'MapBuilder99',    score: 73, suggestedAction: 'Grant Featured Creator badge',     reason: 'Active marketplace seller, very low churn risk' },
  )

  return {
    build,
    targeting,
    pricing,
    engagement,
    powerUserAlerts,
    generatedAt: new Date().toISOString(),
    demo: true,
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    let clerkId: string | null = null
    try {
      const session = await auth()
      clerkId = session?.userId ?? null
    } catch { /* demo mode */ }
    if (!clerkId) {
      return NextResponse.json(buildDemoSuggestions())
    }

    // Future: query DB for real engagement patterns + call AI for personalized suggestions
    // For now, always return demo suggestions (realistic and immediately useful)
    return NextResponse.json(buildDemoSuggestions())
  } catch {
    return NextResponse.json(buildDemoSuggestions())
  }
}
