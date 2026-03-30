// ─── Marketplace Network Effects ─────────────────────────────────────────────
// Tracks supply/demand balance, surfaces supply gaps, guides creator strategy,
// and computes the marketplace health score.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Types ────────────────────────────────────────────────────────────────────

export type AssetCategory =
  | 'GAME_TEMPLATE'
  | 'MAP_TEMPLATE'
  | 'SCRIPT'
  | 'UI_KIT'
  | 'ASSET'
  | 'SOUND'

export type SupplySnapshot = {
  category: AssetCategory
  totalAssets: number
  activeCreators: number
  newAssetsLast7Days: number
  avgRating: number           // 1-5
  avgPrice: number            // tokens
}

export type DemandSnapshot = {
  category: AssetCategory
  searchVolumeLast7Days: number
  purchasesLast7Days: number
  uniqueBuyersLast7Days: number
  avgSearchConversionRate: number // searches → purchase
  trendingKeywords: string[]
}

export type SupplyGap = {
  id: string
  category: AssetCategory
  keyword: string
  demandScore: number          // 0-100 (normalized search volume)
  supplyScore: number          // 0-100 (normalized existing assets)
  opportunityScore: number     // demandScore - supplyScore
  estimatedMonthlyRevenue: number // token revenue if someone fills this gap
  exampleSearches: string[]
}

export type CreatorSuggestion = {
  id: string
  title: string
  rationale: string
  estimatedDemand: 'very high' | 'high' | 'medium'
  estimatedEarnings: string    // e.g. "3,000–8,000 tokens/month"
  difficulty: 'easy' | 'medium' | 'hard'
  category: AssetCategory
  suggestedKeywords: string[]
  competitorCount: number
  urgency: 'now' | 'this week' | 'this month'
}

export type MarketplaceHealthScore = {
  overall: number              // 0-100
  supplyDiversity: number      // variety across categories
  demandSatisfaction: number   // % of searches that find results
  creatorRetention: number     // % of creators active month-over-month
  buyerRetention: number       // % of buyers returning month-over-month
  priceHealth: number          // avg price vs willingness-to-pay
  velocityScore: number        // GMV growth rate
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  trend: 'growing' | 'stable' | 'declining'
  topRisks: string[]
  topOpportunities: string[]
}

export type MarketplaceMetrics = {
  totalAssets: number
  totalCreators: number
  totalBuyers: number
  gmvLast30Days: number       // token units
  avgTransactionSize: number  // tokens
  creatorToConsumerRatio: number
  supply: SupplySnapshot[]
  demand: DemandSnapshot[]
  gaps: SupplyGap[]
  health: MarketplaceHealthScore
}

// ─── Health score calculator ──────────────────────────────────────────────────

export function calculateHealthScore(
  supply: SupplySnapshot[],
  demand: DemandSnapshot[],
  gmvGrowthRate: number,       // month-over-month decimal, e.g. 0.12 = 12%
  creatorRetentionRate: number,
  buyerRetentionRate: number,
): MarketplaceHealthScore {
  // Supply diversity: penalize if one category dominates > 60%
  const totalAssets = supply.reduce((s, c) => s + c.totalAssets, 0)
  const maxCategoryShare = totalAssets > 0
    ? Math.max(...supply.map((c) => c.totalAssets / totalAssets))
    : 1
  const supplyDiversity = Math.round((1 - Math.max(0, maxCategoryShare - 0.6) / 0.4) * 100)

  // Demand satisfaction: avg conversion rate across categories
  const avgConversion = demand.length > 0
    ? demand.reduce((s, d) => s + d.avgSearchConversionRate, 0) / demand.length
    : 0
  const demandSatisfaction = Math.round(Math.min(1, avgConversion / 0.08) * 100)

  const creatorRetention = Math.round(creatorRetentionRate * 100)
  const buyerRetention = Math.round(buyerRetentionRate * 100)

  // Price health: are average prices reasonable? Score 100 if avg is 200-600 tokens
  const avgPriceAcrossCategories = supply.length > 0
    ? supply.reduce((s, c) => s + c.avgPrice, 0) / supply.length
    : 400
  const priceHealth = avgPriceAcrossCategories >= 200 && avgPriceAcrossCategories <= 600
    ? 90
    : avgPriceAcrossCategories < 200
    ? Math.round(50 + avgPriceAcrossCategories / 8)
    : Math.round(90 - (avgPriceAcrossCategories - 600) / 20)

  const velocityScore = Math.round(Math.min(100, Math.max(0, 50 + gmvGrowthRate * 200)))

  const overall = Math.round(
    supplyDiversity * 0.20 +
    demandSatisfaction * 0.25 +
    creatorRetention * 0.20 +
    buyerRetention * 0.15 +
    priceHealth * 0.10 +
    velocityScore * 0.10,
  )

  const grade: MarketplaceHealthScore['grade'] =
    overall >= 85 ? 'A'
    : overall >= 70 ? 'B'
    : overall >= 55 ? 'C'
    : overall >= 40 ? 'D'
    : 'F'

  const trend: MarketplaceHealthScore['trend'] =
    gmvGrowthRate >= 0.05 ? 'growing'
    : gmvGrowthRate <= -0.05 ? 'declining'
    : 'stable'

  const topRisks: string[] = []
  if (supplyDiversity < 50) topRisks.push('One category is dominating supply — creators are not diversifying')
  if (creatorRetentionRate < 0.6) topRisks.push('Creator churn is high — fewer than 60% return month-over-month')
  if (demandSatisfaction < 50) topRisks.push('Buyers are not finding what they search for — major supply gaps exist')
  if (gmvGrowthRate < 0) topRisks.push('GMV is contracting — transaction velocity is falling')

  const topOpportunities: string[] = []
  if (supplyDiversity < 70) topOpportunities.push('Incentivize creators in underserved categories with token bonuses')
  if (demandSatisfaction < 70) topOpportunities.push('Surface supply gaps to active creators — show trending search terms')
  if (buyerRetentionRate < 0.5) topOpportunities.push('Add wishlists and collection features to drive repeat visits')
  if (gmvGrowthRate > 0.10) topOpportunities.push('Marketplace is growing fast — expand creator onboarding campaign')

  return {
    overall,
    supplyDiversity,
    demandSatisfaction,
    creatorRetention,
    buyerRetention,
    priceHealth,
    velocityScore,
    grade,
    trend,
    topRisks,
    topOpportunities,
  }
}

// ─── Supply gap detector ──────────────────────────────────────────────────────

export function detectSupplyGaps(
  supply: SupplySnapshot[],
  demand: DemandSnapshot[],
): SupplyGap[] {
  const maxSearch = Math.max(...demand.map((d) => d.searchVolumeLast7Days), 1)
  const maxAssets = Math.max(...supply.map((s) => s.totalAssets), 1)

  const gaps: SupplyGap[] = []

  for (const d of demand) {
    const s = supply.find((sup) => sup.category === d.category)
    const demandScore = Math.round((d.searchVolumeLast7Days / maxSearch) * 100)
    const supplyScore = s ? Math.round((s.totalAssets / maxAssets) * 100) : 0
    const opportunityScore = Math.max(0, demandScore - supplyScore)

    if (opportunityScore < 15) continue

    const keyword = d.trendingKeywords[0] ?? d.category.toLowerCase().replace('_', ' ')
    const estimatedMonthlyRevenue = Math.round(
      d.purchasesLast7Days * 4 * (s?.avgPrice ?? 400),
    )

    gaps.push({
      id: `gap_${d.category.toLowerCase()}`,
      category: d.category,
      keyword,
      demandScore,
      supplyScore,
      opportunityScore,
      estimatedMonthlyRevenue,
      exampleSearches: d.trendingKeywords.slice(0, 3),
    })
  }

  return gaps.sort((a, b) => b.opportunityScore - a.opportunityScore)
}

// ─── Creator suggestions ──────────────────────────────────────────────────────

export function generateCreatorSuggestions(gaps: SupplyGap[]): CreatorSuggestion[] {
  return gaps.slice(0, 5).map((gap, i) => {
    const estimatedLow = Math.round(gap.estimatedMonthlyRevenue * 0.3)
    const estimatedHigh = Math.round(gap.estimatedMonthlyRevenue * 0.8)

    const difficultyMap: Record<AssetCategory, CreatorSuggestion['difficulty']> = {
      GAME_TEMPLATE: 'hard',
      MAP_TEMPLATE: 'medium',
      SCRIPT: 'medium',
      UI_KIT: 'easy',
      ASSET: 'easy',
      SOUND: 'easy',
    }

    const urgencyMap: CreatorSuggestion['urgency'][] = ['now', 'now', 'this week', 'this week', 'this month']

    return {
      id: `suggestion_${gap.id}`,
      title: `Build a ${gap.keyword} ${gap.category.toLowerCase().replace('_', ' ')}`,
      rationale: `${gap.demandScore} demand score vs only ${gap.supplyScore} supply score — ${gap.opportunityScore} point gap. ${gap.estimatedMonthlyRevenue.toLocaleString()} tokens/month untapped.`,
      estimatedDemand: gap.demandScore >= 70 ? 'very high' : gap.demandScore >= 40 ? 'high' : 'medium',
      estimatedEarnings: `${estimatedLow.toLocaleString()}–${estimatedHigh.toLocaleString()} tokens/month`,
      difficulty: difficultyMap[gap.category],
      category: gap.category,
      suggestedKeywords: gap.exampleSearches,
      competitorCount: Math.max(0, gap.supplyScore - 5),
      urgency: urgencyMap[i] ?? 'this month',
    }
  })
}

// ─── Demo data ────────────────────────────────────────────────────────────────

export function getDemoMarketplaceMetrics(): MarketplaceMetrics {
  const supply: SupplySnapshot[] = [
    { category: 'SCRIPT',        totalAssets: 412, activeCreators: 87,  newAssetsLast7Days: 34, avgRating: 4.3, avgPrice: 380 },
    { category: 'GAME_TEMPLATE', totalAssets: 156, activeCreators: 41,  newAssetsLast7Days: 9,  avgRating: 4.5, avgPrice: 890 },
    { category: 'MAP_TEMPLATE',  totalAssets: 203, activeCreators: 58,  newAssetsLast7Days: 18, avgRating: 4.2, avgPrice: 560 },
    { category: 'UI_KIT',        totalAssets: 94,  activeCreators: 29,  newAssetsLast7Days: 11, avgRating: 4.4, avgPrice: 290 },
    { category: 'ASSET',         totalAssets: 287, activeCreators: 73,  newAssetsLast7Days: 28, avgRating: 4.1, avgPrice: 180 },
    { category: 'SOUND',         totalAssets: 71,  activeCreators: 18,  newAssetsLast7Days: 5,  avgRating: 3.9, avgPrice: 120 },
  ]

  const demand: DemandSnapshot[] = [
    { category: 'SCRIPT',        searchVolumeLast7Days: 1840, purchasesLast7Days: 312, uniqueBuyersLast7Days: 218, avgSearchConversionRate: 0.169, trendingKeywords: ['datastore leaderboard', 'combat system', 'admin commands'] },
    { category: 'GAME_TEMPLATE', searchVolumeLast7Days: 2210, purchasesLast7Days: 148, uniqueBuyersLast7Days: 139, avgSearchConversionRate: 0.067, trendingKeywords: ['simulator template', 'tycoon starter kit', 'battle royale template'] },
    { category: 'MAP_TEMPLATE',  searchVolumeLast7Days: 1590, purchasesLast7Days: 201, uniqueBuyersLast7Days: 175, avgSearchConversionRate: 0.126, trendingKeywords: ['city map', 'fantasy dungeon', 'obby course'] },
    { category: 'UI_KIT',        searchVolumeLast7Days: 980,  purchasesLast7Days: 143, uniqueBuyersLast7Days: 128, avgSearchConversionRate: 0.145, trendingKeywords: ['inventory ui', 'shop gui', 'hud template'] },
    { category: 'ASSET',         searchVolumeLast7Days: 760,  purchasesLast7Days: 287, uniqueBuyersLast7Days: 241, avgSearchConversionRate: 0.377, trendingKeywords: ['tree pack', 'character model', 'building kit'] },
    { category: 'SOUND',         searchVolumeLast7Days: 430,  purchasesLast7Days: 89,  uniqueBuyersLast7Days: 78,  avgSearchConversionRate: 0.207, trendingKeywords: ['ambient music', 'ui click sounds', 'battle sfx'] },
  ]

  const gaps = detectSupplyGaps(supply, demand)
  const health = calculateHealthScore(supply, demand, 0.14, 0.72, 0.58)

  const totalAssets = supply.reduce((s, c) => s + c.totalAssets, 0)
  const totalCreators = supply.reduce((s, c) => s + c.activeCreators, 0)
  const gmvLast30Days = demand.reduce((s, d) => s + d.purchasesLast7Days * 4 * 400, 0)

  return {
    totalAssets,
    totalCreators,
    totalBuyers: 4820,
    gmvLast30Days,
    avgTransactionSize: 385,
    creatorToConsumerRatio: +(totalCreators / 4820).toFixed(3),
    supply,
    demand,
    gaps,
    health,
  }
}
