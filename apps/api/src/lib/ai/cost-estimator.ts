/**
 * Cost estimation before AI execution
 * Converts $ costs to platform tokens (100 tokens = $0.01)
 */

// Token conversion: 1 platform token = $0.0001
// So $1.00 = 10,000 tokens
const USD_TO_TOKENS = 10_000

export type GenerationType = 'voice-to-game' | 'image-to-map' | 'text-to-3d' | 'image-to-3d' | 'texture' | 'image' | 'full-game' | 'terrain' | 'city' | 'assets'

export interface ProviderCostEstimate {
  provider: string
  operation: string
  estimatedUsd: number
  estimatedTokens: number
  breakdown?: string
}

export interface TotalCostEstimate {
  providers: ProviderCostEstimate[]
  totalUsd: number
  totalTokens: number
  summary: string // e.g. "~50 tokens"
  breakdown: string[]
}

// Per-operation base costs
const BASE_COSTS: Record<GenerationType, ProviderCostEstimate[]> = {
  'voice-to-game': [
    { provider: 'deepgram', operation: 'transcription', estimatedUsd: 0.0043, estimatedTokens: 43, breakdown: '~1 min audio @ $0.0043/min' },
    { provider: 'claude', operation: 'intent-parsing', estimatedUsd: 0.002, estimatedTokens: 20, breakdown: '~1000 tokens @ $0.003/1k' },
  ],
  'image-to-map': [
    { provider: 'claude', operation: 'vision-analysis', estimatedUsd: 0.015, estimatedTokens: 150, breakdown: '~5k tokens (image + response)' },
  ],
  'text-to-3d': [
    { provider: 'meshy', operation: 'text-to-3d', estimatedUsd: 0.20, estimatedTokens: 2000, breakdown: 'Meshy preview + refine' },
  ],
  'image-to-3d': [
    { provider: 'meshy', operation: 'image-to-3d', estimatedUsd: 0.40, estimatedTokens: 4000, breakdown: 'Meshy image-to-3D' },
  ],
  'texture': [
    { provider: 'fal', operation: 'texture-pbr', estimatedUsd: 0.08, estimatedTokens: 800, breakdown: 'Fal PBR texture set' },
  ],
  'image': [
    { provider: 'fal', operation: 'flux-pro', estimatedUsd: 0.055, estimatedTokens: 550, breakdown: 'Flux Pro 1024x1024' },
  ],
  'terrain': [
    { provider: 'claude', operation: 'terrain-plan', estimatedUsd: 0.01, estimatedTokens: 100, breakdown: 'Claude terrain layout generation' },
    { provider: 'fal', operation: 'terrain-texture', estimatedUsd: 0.055, estimatedTokens: 550, breakdown: 'Fal terrain texture' },
  ],
  'city': [
    { provider: 'claude', operation: 'city-plan', estimatedUsd: 0.02, estimatedTokens: 200, breakdown: 'Claude city layout generation' },
    { provider: 'fal', operation: 'city-texture', estimatedUsd: 0.11, estimatedTokens: 1100, breakdown: 'Fal 2x textures' },
    { provider: 'meshy', operation: 'building-models', estimatedUsd: 0.60, estimatedTokens: 6000, breakdown: 'Meshy 3x building models' },
  ],
  'assets': [
    { provider: 'claude', operation: 'asset-plan', estimatedUsd: 0.005, estimatedTokens: 50, breakdown: 'Claude asset list generation' },
    { provider: 'meshy', operation: 'asset-models', estimatedUsd: 0.40, estimatedTokens: 4000, breakdown: 'Meshy 2x asset models' },
  ],
  'full-game': [
    { provider: 'claude', operation: 'game-design', estimatedUsd: 0.03, estimatedTokens: 300, breakdown: 'Claude full game design' },
    { provider: 'meshy', operation: 'all-models', estimatedUsd: 2.00, estimatedTokens: 20000, breakdown: 'Meshy 10x models' },
    { provider: 'fal', operation: 'all-textures', estimatedUsd: 0.55, estimatedTokens: 5500, breakdown: 'Fal 10x textures' },
    { provider: 'deepgram', operation: 'audio', estimatedUsd: 0.01, estimatedTokens: 100, breakdown: 'Deepgram audio processing' },
  ],
}

/**
 * Estimate cost for a generation type
 */
export function estimateCost(type: GenerationType): TotalCostEstimate {
  const providers = BASE_COSTS[type] ?? []
  const totalUsd = providers.reduce((sum, p) => sum + p.estimatedUsd, 0)
  const totalTokens = usdToTokens(totalUsd)

  const breakdown = providers.map(
    (p) => `${p.provider} ${p.operation}: ~${p.estimatedTokens} tokens (${p.breakdown})`
  )

  return {
    providers: providers.map((p) => ({ ...p, estimatedTokens: usdToTokens(p.estimatedUsd) })),
    totalUsd,
    totalTokens,
    summary: `~${totalTokens} tokens`,
    breakdown,
  }
}

/**
 * Estimate Claude-specific cost from a prompt string
 */
export function estimateClaudeCost(
  promptText: string,
  expectedOutputChars = 4000,
  model: 'sonnet' | 'haiku' | 'opus' = 'sonnet'
): ProviderCostEstimate {
  const pricing = {
    sonnet: { inputPerM: 3.0, outputPerM: 15.0 },
    haiku: { inputPerM: 0.8, outputPerM: 4.0 },
    opus: { inputPerM: 15.0, outputPerM: 75.0 },
  }[model]

  const inputTokens = Math.ceil(promptText.length / 4)
  const outputTokens = Math.ceil(expectedOutputChars / 4)
  const estimatedUsd =
    (inputTokens / 1_000_000) * pricing.inputPerM +
    (outputTokens / 1_000_000) * pricing.outputPerM

  return {
    provider: 'claude',
    operation: `chat-${model}`,
    estimatedUsd,
    estimatedTokens: usdToTokens(estimatedUsd),
    breakdown: `${inputTokens} input + ${outputTokens} output tokens`,
  }
}

/**
 * Convert USD to platform tokens
 */
export function usdToTokens(usd: number): number {
  return Math.ceil(usd * USD_TO_TOKENS)
}

/**
 * Convert platform tokens to USD
 */
export function tokensToUsd(tokens: number): number {
  return tokens / USD_TO_TOKENS
}

/**
 * Format cost for display to user
 */
export function formatCostForUser(estimate: TotalCostEstimate): string {
  return `This generation will cost approximately ${estimate.summary} (≈ $${estimate.totalUsd.toFixed(4)})`
}

/**
 * Aggregate multiple cost estimates
 */
export function aggregateCosts(estimates: TotalCostEstimate[]): TotalCostEstimate {
  const allProviders = estimates.flatMap((e) => e.providers)
  const totalUsd = estimates.reduce((sum, e) => sum + e.totalUsd, 0)
  const totalTokens = usdToTokens(totalUsd)

  return {
    providers: allProviders,
    totalUsd,
    totalTokens,
    summary: `~${totalTokens} tokens`,
    breakdown: estimates.flatMap((e) => e.breakdown),
  }
}
