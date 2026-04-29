/**
 * Knowledge Metrics — tracks which knowledge sections were injected and whether they helped.
 * Logs to console for now, can be wired to DB later.
 */

interface KnowledgeMetric {
  timestamp: number
  prompt: string
  intent: string
  complexity: string
  sectionsInjected: string[]
  charBudgetUsed: number
  charBudgetTotal: number
  outputPartCount: number
  outputScore: number
  apisUsed: string[]
  relevanceScore: number // 0-1: how much of injected knowledge was actually used
}

// Rolling buffer of recent metrics (keep last 100 in memory)
const recentMetrics: KnowledgeMetric[] = []
const MAX_METRICS = 100

// Common Roblox API patterns to detect in generated code
const API_PATTERNS: Record<string, RegExp> = {
  Part: /Instance\.new\(["']Part["']\)/,
  WedgePart: /Instance\.new\(["']WedgePart["']\)/,
  Model: /Instance\.new\(["']Model["']\)/,
  PointLight: /Instance\.new\(["']PointLight["']\)/,
  SpotLight: /Instance\.new\(["']SpotLight["']\)/,
  SurfaceLight: /Instance\.new\(["']SurfaceLight["']\)/,
  ParticleEmitter: /Instance\.new\(["']ParticleEmitter["']\)/,
  Beam: /Instance\.new\(["']Beam["']\)/,
  Trail: /Instance\.new\(["']Trail["']\)/,
  VehicleSeat: /Instance\.new\(["']VehicleSeat["']\)/,
  Tool: /Instance\.new\(["']Tool["']\)/,
  WeldConstraint: /Instance\.new\(["']WeldConstraint["']\)/,
  HingeConstraint: /Instance\.new\(["']HingeConstraint["']\)/,
  SpringConstraint: /Instance\.new\(["']SpringConstraint["']\)/,
  Attachment: /Instance\.new\(["']Attachment["']\)/,
  RemoteEvent: /Instance\.new\(["']RemoteEvent["']\)/,
  RemoteFunction: /Instance\.new\(["']RemoteFunction["']\)/,
  ScreenGui: /Instance\.new\(["']ScreenGui["']\)/,
  Frame: /Instance\.new\(["']Frame["']\)/,
  TextLabel: /Instance\.new\(["']TextLabel["']\)/,
  Sound: /Instance\.new\(["']Sound["']\)/,
  Atmosphere: /Instance\.new\(["']Atmosphere["']\)/,
  BloomEffect: /Instance\.new\(["']BloomEffect["']\)/,
  ColorCorrectionEffect: /Instance\.new\(["']ColorCorrectionEffect["']\)/,
  Terrain: /workspace:?\.?Terrain/,
  TweenService: /TweenService/,
  PathfindingService: /PathfindingService/,
  DataStoreService: /DataStoreService/,
  Glass: /Enum\.Material\.Glass/,
  Neon: /Enum\.Material\.Neon/,
  CFrame_Angles: /CFrame\.Angles/,
  Color3_fromRGB: /Color3\.fromRGB/,
  Cylinder: /Enum\.PartType\.Cylinder/,
  Ball: /Enum\.PartType\.Ball/,
}

// Map knowledge sections to expected API patterns
const SECTION_TO_APIS: Record<string, string[]> = {
  'building-anatomy': ['Part', 'WedgePart', 'Model', 'Glass', 'CFrame_Angles', 'Color3_fromRGB'],
  'building-techniques': ['Part', 'WedgePart', 'Model', 'Glass', 'Color3_fromRGB'],
  'vfx-particle-bible': ['ParticleEmitter', 'Beam', 'Trail', 'PointLight', 'Neon'],
  'ui-ux-bible': ['ScreenGui', 'Frame', 'TextLabel'],
  'sound-music-bible': ['Sound'],
  'lighting-atmosphere-bible': ['PointLight', 'SpotLight', 'Atmosphere', 'BloomEffect', 'ColorCorrectionEffect'],
  'vehicle-transport-bible': ['VehicleSeat', 'HingeConstraint', 'SpringConstraint', 'Attachment', 'Cylinder'],
  'weapon-tool-bible': ['Tool', 'WeldConstraint', 'Part'],
  'multiplayer-bible': ['RemoteEvent', 'RemoteFunction', 'DataStoreService'],
  'scripting-patterns-expanded': ['RemoteEvent', 'DataStoreService', 'TweenService', 'PathfindingService'],
  'npc-character-bible': ['PathfindingService', 'Part'],
  'example-builds': ['Part', 'Model', 'CFrame_Angles', 'Color3_fromRGB', 'WeldConstraint'],
  'color-material-bible': ['Color3_fromRGB'],
  'building-math-bible': ['CFrame_Angles', 'Part'],
  'exterior-construction-bible': ['Part', 'WedgePart', 'Glass'],
  'interior-residential-deep': ['Part', 'PointLight'],
  'commercial-interiors-bible': ['Part', 'PointLight', 'Glass'],
  'architectural-styles-bible': ['Part', 'WedgePart', 'Color3_fromRGB'],
  'world-design-bible': ['Part', 'Terrain'],
  'game-progression-bible': ['DataStoreService'],
  'optimization-bible': ['Part'],
  'game-templates-expanded': ['Part', 'Model'],
  'animation-bible': ['TweenService'],
  'terrain-landscape-bible': ['Terrain'],
  'game-economy-bible': ['DataStoreService'],
}

function detectApisInCode(code: string): string[] {
  const found: string[] = []
  for (const [name, pattern] of Object.entries(API_PATTERNS)) {
    if (pattern.test(code)) found.push(name)
  }
  return found
}

function computeRelevanceScore(sectionsInjected: string[], apisUsed: string[]): number {
  if (sectionsInjected.length === 0 || apisUsed.length === 0) return 0

  // For each injected section, check if its expected APIs appeared in output
  let totalExpected = 0
  let totalFound = 0
  for (const section of sectionsInjected) {
    const expected = SECTION_TO_APIS[section] || []
    for (const api of expected) {
      totalExpected++
      if (apisUsed.includes(api)) totalFound++
    }
  }

  return totalExpected > 0 ? totalFound / totalExpected : 0
}

/**
 * Record knowledge injection metrics after a build is generated.
 * Call this after AI generates code to track knowledge effectiveness.
 */
export function recordKnowledgeMetrics(params: {
  prompt: string
  intent: string
  complexity: string
  sectionsInjected: string[]
  charBudgetUsed: number
  charBudgetTotal: number
  generatedCode: string
  outputScore: number
}) {
  const apisUsed = detectApisInCode(params.generatedCode)
  const partCount = (params.generatedCode.match(/Instance\.new\(/g) || []).length
  const relevanceScore = computeRelevanceScore(params.sectionsInjected, apisUsed)

  const metric: KnowledgeMetric = {
    timestamp: Date.now(),
    prompt: params.prompt.slice(0, 100),
    intent: params.intent,
    complexity: params.complexity,
    sectionsInjected: params.sectionsInjected,
    charBudgetUsed: params.charBudgetUsed,
    charBudgetTotal: params.charBudgetTotal,
    outputPartCount: partCount,
    outputScore: params.outputScore,
    apisUsed,
    relevanceScore,
  }

  recentMetrics.push(metric)
  if (recentMetrics.length > MAX_METRICS) recentMetrics.shift()

  // Log summary
  console.log(
    `[knowledge-metrics] complexity=${params.complexity} ` +
    `sections=${params.sectionsInjected.length} ` +
    `budget=${params.charBudgetUsed}/${params.charBudgetTotal} ` +
    `parts=${partCount} score=${params.outputScore} ` +
    `relevance=${(relevanceScore * 100).toFixed(0)}% ` +
    `apis=[${apisUsed.slice(0, 5).join(',')}${apisUsed.length > 5 ? '...' : ''}]`
  )

  return metric
}

/**
 * Get aggregate metrics for the last N builds.
 * Useful for admin dashboard or debugging.
 */
export function getKnowledgeMetricsSummary(): {
  totalBuilds: number
  avgRelevance: number
  avgPartCount: number
  avgScore: number
  topSections: Array<{ section: string; count: number }>
  complexityBreakdown: Record<string, number>
} {
  if (recentMetrics.length === 0) {
    return { totalBuilds: 0, avgRelevance: 0, avgPartCount: 0, avgScore: 0, topSections: [], complexityBreakdown: {} }
  }

  const avgRelevance = recentMetrics.reduce((s, m) => s + m.relevanceScore, 0) / recentMetrics.length
  const avgPartCount = recentMetrics.reduce((s, m) => s + m.outputPartCount, 0) / recentMetrics.length
  const avgScore = recentMetrics.reduce((s, m) => s + m.outputScore, 0) / recentMetrics.length

  // Count section usage
  const sectionCounts: Record<string, number> = {}
  for (const m of recentMetrics) {
    for (const s of m.sectionsInjected) {
      sectionCounts[s] = (sectionCounts[s] || 0) + 1
    }
  }
  const topSections = Object.entries(sectionCounts)
    .map(([section, count]) => ({ section, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Complexity breakdown
  const complexityBreakdown: Record<string, number> = {}
  for (const m of recentMetrics) {
    complexityBreakdown[m.complexity] = (complexityBreakdown[m.complexity] || 0) + 1
  }

  return { totalBuilds: recentMetrics.length, avgRelevance, avgPartCount, avgScore, topSections, complexityBreakdown }
}

/**
 * Extract which knowledge sections were actually injected (call during knowledge brain injection).
 * Returns section names that were added to the prompt.
 */
export function trackInjectedSections(): { sections: string[]; totalChars: number } {
  // This is a lightweight tracker — set by the injection loop, read after generation
  return { sections: _trackedSections, totalChars: _trackedChars }
}

// Module-level state for tracking (set during injection, read after generation)
let _trackedSections: string[] = []
let _trackedChars = 0

export function startTracking() {
  _trackedSections = []
  _trackedChars = 0
}

export function trackSection(name: string, chars: number) {
  _trackedSections.push(name)
  _trackedChars += chars
}
