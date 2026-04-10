/**
 * prompt-enhancer.ts
 * FREE pre-processing step that uses a fast/cheap AI model (Groq + Llama)
 * to analyze a raw user prompt and produce a structured build plan.
 *
 * This runs BEFORE the expensive Anthropic generation and does NOT cost
 * any user credits. The structured plan dramatically improves the quality
 * of the main AI generation by giving it clear, detailed instructions.
 *
 * Usage:
 *   const plan = await enhancePrompt("make a simulator game")
 *   // plan.enhancedPrompt → detailed rewritten prompt
 *   // plan.steps → ordered build steps
 *   // plan.assets → list of assets to create
 */

import Groq from 'groq-sdk'

// ─── Types ───────────────────────────────────────────────────────────────────

export type PromptIntent =
  | 'build'
  | 'script'
  | 'terrain'
  | 'ui'
  | 'npc'
  | 'vehicle'
  | 'particle'
  | 'image'
  | 'mesh'
  | 'idea'

export type AssetType =
  | 'Part'
  | 'Model'
  | 'Script'
  | 'LocalScript'
  | 'ModuleScript'
  | 'Sound'
  | 'ParticleEmitter'
  | 'UI'

export type Complexity = 'simple' | 'medium' | 'complex' | 'epic'

export interface EnhancedPromptStep {
  stepNumber: number
  action: string
  service: string // ServerScriptService, Workspace, ReplicatedStorage, etc.
  scriptName?: string
  description: string
}

export interface EnhancedPromptAsset {
  name: string
  type: AssetType
  description: string
}

export interface EnhancedPrompt {
  originalPrompt: string
  intent: PromptIntent
  planSummary: string
  steps: EnhancedPromptStep[]
  assetCount: number
  assets: EnhancedPromptAsset[]
  styleDirective: string
  estimatedComplexity: Complexity
  estimatedCredits: number
  enhancedPrompt: string // The rewritten, more detailed prompt
}

// ─── Defaults & validation ──────────────────────────────────────────────────

const VALID_INTENTS: Set<string> = new Set([
  'build', 'script', 'terrain', 'ui', 'npc', 'vehicle',
  'particle', 'image', 'mesh', 'idea',
])

const VALID_ASSET_TYPES: Set<string> = new Set([
  'Part', 'Model', 'Script', 'LocalScript', 'ModuleScript',
  'Sound', 'ParticleEmitter', 'UI',
])

const VALID_COMPLEXITIES: Set<string> = new Set([
  'simple', 'medium', 'complex', 'epic',
])

const COMPLEXITY_CREDIT_MAP: Record<Complexity, number> = {
  simple: 1,
  medium: 2,
  complex: 5,
  epic: 10,
}

function sanitizeIntent(raw: unknown): PromptIntent {
  if (typeof raw === 'string' && VALID_INTENTS.has(raw)) return raw as PromptIntent
  return 'build'
}

function sanitizeAssetType(raw: unknown): AssetType {
  if (typeof raw === 'string' && VALID_ASSET_TYPES.has(raw)) return raw as AssetType
  return 'Part'
}

function sanitizeComplexity(raw: unknown): Complexity {
  if (typeof raw === 'string' && VALID_COMPLEXITIES.has(raw)) return raw as Complexity
  return 'medium'
}

function sanitizeStep(raw: Record<string, unknown>, index: number): EnhancedPromptStep {
  return {
    stepNumber: typeof raw.stepNumber === 'number' ? raw.stepNumber : index + 1,
    action: typeof raw.action === 'string' ? raw.action : 'Build component',
    service: typeof raw.service === 'string' ? raw.service : 'Workspace',
    scriptName: typeof raw.scriptName === 'string' ? raw.scriptName : undefined,
    description: typeof raw.description === 'string' ? raw.description : '',
  }
}

function sanitizeAsset(raw: Record<string, unknown>): EnhancedPromptAsset {
  return {
    name: typeof raw.name === 'string' ? raw.name : 'Unnamed',
    type: sanitizeAssetType(raw.type),
    description: typeof raw.description === 'string' ? raw.description : '',
  }
}

// ─── System prompt for the planner ──────────────────────────────────────────

const PLANNER_SYSTEM_PROMPT = `You are a Roblox game development planner. Given a user's build request, create a detailed build plan.

You know Roblox Studio inside and out: Workspace, ServerScriptService, ReplicatedStorage, StarterGui, StarterPlayer, Lighting, SoundService, and all their APIs.

Respond ONLY with valid JSON matching this exact schema:
{
  "intent": "build|script|terrain|ui|npc|vehicle|particle|image|mesh|idea",
  "planSummary": "1-2 sentence summary of what will be built",
  "steps": [
    {
      "stepNumber": 1,
      "action": "Create the spawn platform and base terrain",
      "service": "Workspace",
      "scriptName": "SetupScript",
      "description": "A 200x200 baseplate with grass material and a spawn location"
    }
  ],
  "assetCount": 5,
  "assets": [
    {
      "name": "SpawnPlatform",
      "type": "Part|Model|Script|LocalScript|ModuleScript|Sound|ParticleEmitter|UI",
      "description": "Large flat part serving as the game baseplate"
    }
  ],
  "styleDirective": "Use bright colors, low-poly aesthetic with smooth plastic materials...",
  "estimatedComplexity": "simple|medium|complex|epic",
  "estimatedCredits": 2,
  "enhancedPrompt": "Build a complete Roblox simulator game with a spawn area, collection mechanics, a shop GUI, leaderboard, and progression system. Use bright low-poly aesthetics with smooth plastic materials. Include particle effects for collection feedback and a clean modern UI."
}

Guidelines:
- "intent" should match the primary action the user wants
- "steps" should be ordered logically (setup first, then core mechanics, then polish)
- "assets" should list every distinct object/script that needs to be created
- "styleDirective" should describe the visual style, materials, and color palette
- "estimatedComplexity": simple (1-3 assets, basic), medium (4-10 assets), complex (11-25 assets), epic (25+ assets, full game systems)
- "estimatedCredits": simple=1, medium=2, complex=5, epic=10
- "enhancedPrompt" should be a richly detailed rewrite that a code-generating AI can follow precisely
- Keep the JSON clean, no markdown, no extra text`

// ─── Main enhancer function ─────────────────────────────────────────────────

export async function enhancePrompt(
  rawPrompt: string,
  context?: string,
): Promise<EnhancedPrompt> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    // Graceful fallback when Groq is not configured — return a minimal plan
    // so the rest of the pipeline still works.
    return buildFallbackPlan(rawPrompt)
  }

  const groq = new Groq({ apiKey })

  const userContent = context
    ? `Context: ${context}\n\nUser request: ${rawPrompt}`
    : rawPrompt

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: PLANNER_SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    })

    const raw = response.choices[0]?.message?.content
    if (!raw) {
      console.warn('[prompt-enhancer] Empty response from Groq, using fallback')
      return buildFallbackPlan(rawPrompt)
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>
    return buildEnhancedPrompt(rawPrompt, parsed)
  } catch (err) {
    console.error('[prompt-enhancer] Groq API error, using fallback:', err instanceof Error ? err.message : err)
    return buildFallbackPlan(rawPrompt)
  }
}

// ─── Parse & sanitize the Groq response ─────────────────────────────────────

function buildEnhancedPrompt(
  originalPrompt: string,
  parsed: Record<string, unknown>,
): EnhancedPrompt {
  const intent = sanitizeIntent(parsed.intent)
  const complexity = sanitizeComplexity(parsed.estimatedComplexity)

  const rawSteps = Array.isArray(parsed.steps) ? parsed.steps : []
  const steps = rawSteps.map((s: unknown, i: number) =>
    sanitizeStep((s && typeof s === 'object' ? s : {}) as Record<string, unknown>, i),
  )

  const rawAssets = Array.isArray(parsed.assets) ? parsed.assets : []
  const assets = rawAssets.map((a: unknown) =>
    sanitizeAsset((a && typeof a === 'object' ? a : {}) as Record<string, unknown>),
  )

  return {
    originalPrompt,
    intent,
    planSummary: typeof parsed.planSummary === 'string' ? parsed.planSummary : `Build: ${originalPrompt}`,
    steps,
    assetCount: typeof parsed.assetCount === 'number' ? parsed.assetCount : assets.length,
    assets,
    styleDirective: typeof parsed.styleDirective === 'string'
      ? parsed.styleDirective
      : 'Use clean Roblox aesthetics with SmoothPlastic materials and bright colors.',
    estimatedComplexity: complexity,
    estimatedCredits: typeof parsed.estimatedCredits === 'number'
      ? parsed.estimatedCredits
      : COMPLEXITY_CREDIT_MAP[complexity],
    enhancedPrompt: typeof parsed.enhancedPrompt === 'string'
      ? parsed.enhancedPrompt
      : originalPrompt,
  }
}

// ─── Fallback when Groq is unavailable ──────────────────────────────────────

function buildFallbackPlan(rawPrompt: string): EnhancedPrompt {
  return {
    originalPrompt: rawPrompt,
    intent: 'build',
    planSummary: rawPrompt,
    steps: [
      {
        stepNumber: 1,
        action: 'Build the requested content',
        service: 'Workspace',
        description: rawPrompt,
      },
    ],
    assetCount: 1,
    assets: [],
    styleDirective: 'Use clean Roblox aesthetics with SmoothPlastic materials.',
    estimatedComplexity: 'medium',
    estimatedCredits: 2,
    enhancedPrompt: rawPrompt,
  }
}

// ─── Helper: format enhanced plan as context for the main AI ────────────────

/**
 * Formats an EnhancedPrompt into a system-prompt-injectable context block.
 * Include this in the main AI's system prompt to give it a structured plan
 * to follow, resulting in higher quality output.
 */
export function formatEnhancedPlanContext(plan: EnhancedPrompt): string {
  const stepLines = plan.steps
    .map((s) => `  ${s.stepNumber}. [${s.service}] ${s.action} — ${s.description}${s.scriptName ? ` (${s.scriptName})` : ''}`)
    .join('\n')

  const assetLines = plan.assets
    .map((a) => `  - ${a.name} (${a.type}): ${a.description}`)
    .join('\n')

  return [
    '[ENHANCED_BUILD_PLAN]',
    `Summary: ${plan.planSummary}`,
    `Intent: ${plan.intent} | Complexity: ${plan.estimatedComplexity}`,
    `Style: ${plan.styleDirective}`,
    '',
    'Build Steps:',
    stepLines,
    '',
    `Assets (${plan.assetCount}):`,
    assetLines,
    '',
    'Enhanced Prompt:',
    plan.enhancedPrompt,
    '[/ENHANCED_BUILD_PLAN]',
  ].join('\n')
}
