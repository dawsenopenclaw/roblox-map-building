/**
 * src/lib/ai/index.ts
 * Barrel export for the ForjeGames AI optimization suite.
 *
 * Usage:
 *   import { classifyIntent, getOptimizedPrompt, scoreResponse, suggestTemplates } from '@/lib/ai'
 */

// Intent classifier
export {
  classifyIntent,
  type Intent,
  type ClassificationResult,
} from './intent-classifier'

// Prompt optimizer
export {
  getOptimizedPrompt,
  recordExchange,
  applyFeedback,
  addChallengerVariant,
  getOptimizerStats,
  exportState as exportOptimizerState,
  importState as importOptimizerState,
  type PromptRecord,
  type SystemPromptVariant,
  type OptimizationContext,
  type FeedbackInput,
  type OptimizerState,
} from './prompt-optimizer'

// Response quality scorer
export {
  scoreResponse,
  getQualityStats,
  getDegradingIntents,
  type QualityScore,
  type QualityFlag,
  type AgentQualityStats,
} from './response-quality'

// Template generator
export {
  suggestTemplates,
  getTemplatesByCategory,
  getPopularTemplates,
  createTemplateFromConversation,
  trackPromptForClustering,
  recordTemplateUse,
  getTemplateById,
  exportTemplates,
  importTemplates,
  getClusterStats,
  type Template,
  type ExpectedOutputShape,
  type TemplateCluster,
} from './template-generator'
