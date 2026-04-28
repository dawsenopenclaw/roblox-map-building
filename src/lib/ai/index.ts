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

// Prompt enhancer (Groq/Llama pre-processing)
export {
  enhancePrompt,
  formatEnhancedPlanContext,
  extractStyleModifiers,
  formatStyleModifiersBlock,
  type EnhancedPrompt,
  type EnhancedPromptStep,
  type EnhancedPromptAsset,
  type PromptIntent,
  type Complexity,
  type StyleModifiers,
  type MoodModifier,
  type EnvironmentModifier,
  type TimeModifier,
} from './prompt-enhancer'

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

// Agentic self-healing loop
export {
  runAgenticLoop,
  type AgenticStep,
  type AgenticPhase,
  type AgenticStatus,
  type AgenticLoopResult,
  type AgenticLoopOptions,
} from './agentic-loop'
