/**
 * Staged Build Pipeline — Plan → Build → Verify → Enhance → Ship
 *
 * Instead of cramming everything into one massive AI call, this splits
 * the generation into focused stages where each AI call has ONE job:
 *
 * Stage 1 — PLAN: Decompose the request into a component list with sizes/materials
 * Stage 2 — BUILD: Generate the Luau code focused only on the plan (no fluff)
 * Stage 3 — VERIFY: Run through luau-verifier + quality scorer
 * Stage 4 — ENHANCE: Fix issues found in verification, add missing detail
 * Stage 5 — SHIP: Final quality check, auto-fix, deliver
 *
 * This produces dramatically better output because:
 * - Each stage gets the full token budget for ONE focused task
 * - The plan constrains the build so nothing gets forgotten
 * - Verification feedback loops into enhancement
 * - Quality is enforced at every stage, not just at the end
 */

import 'server-only'
import { callAI } from './provider'
import { verifyLuauCode } from './luau-verifier'
import { scoreOutput, type QualityScore } from './quality-scorer'
import { recordToEli } from '../eli/build-intelligence'
import { detectCategory, detectBuildType } from './experience-memory'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface BuildPlanComponent {
  name: string
  type: 'Part' | 'WedgePart' | 'Cylinder' | 'Ball' | 'Model' | 'Light' | 'Effect' | 'Script' | 'GUI'
  material?: string
  color?: string
  size?: string
  notes?: string
}

export interface StagedBuildPlan {
  summary: string
  components: BuildPlanComponent[]
  lightingPreset: string
  interactiveElements: string[]
  estimatedParts: number
}

export interface StagedPipelineResult {
  code: string | null
  plan: StagedBuildPlan | null
  conversationText: string
  score: number
  stages: StageResult[]
  totalLatencyMs: number
}

export interface StageResult {
  name: string
  success: boolean
  durationMs: number
  details?: string
}

// ─── Stage 1: PLAN ─────────────────────────────────────────────────────────

const PLAN_PROMPT = `You are a Roblox build architect. Given a user request, output a JSON build plan.
Return ONLY valid JSON, no markdown fences.

JSON shape:
{
  "summary": "2-sentence description of what to build",
  "components": [{"name": "WallFront", "type": "Part", "material": "Concrete", "color": "160,160,160", "size": "20x10x0.5", "notes": "front wall with window cutout"}],
  "lightingPreset": "DAYTIME|SPOOKY|SUNSET|NEON_CITY|COZY",
  "interactiveElements": ["door with ProximityPrompt", "PointLights on lamps"],
  "estimatedParts": 30
}

RULES:
- Minimum 15 components for any build, 25+ for buildings
- Include foundation, walls, roof, doors, windows, interior, lighting
- Each component is a separate physical part with specific material + color
- Materials: Wood, WoodPlanks, Brick, Concrete, Granite, Metal, Glass, Slate, Cobblestone, Fabric, etc. NEVER SmoothPlastic.
- Colors as R,G,B integers matching the material (brown for wood, gray for concrete, etc.)
- Include PointLight/SpotLight components for any light source
- Include interactive elements (ProximityPrompt, TweenService, SurfaceGui) where appropriate`

async function stagePlan(prompt: string): Promise<{ plan: StagedBuildPlan | null; durationMs: number }> {
  const start = Date.now()
  try {
    const raw = await callAI(PLAN_PROMPT, [{ role: 'user', content: `Build request: "${prompt}"` }], {
      jsonMode: true,
      maxTokens: 2048,
      temperature: 0.3,
    })

    const parsed = JSON.parse(raw.replace(/```json?\s*/gi, '').replace(/```/g, '').trim())
    return {
      plan: {
        summary: parsed.summary || prompt,
        components: Array.isArray(parsed.components) ? parsed.components : [],
        lightingPreset: parsed.lightingPreset || 'DAYTIME',
        interactiveElements: Array.isArray(parsed.interactiveElements) ? parsed.interactiveElements : [],
        estimatedParts: parsed.estimatedParts || 25,
      },
      durationMs: Date.now() - start,
    }
  } catch (err) {
    console.warn('[StagedPipeline/Plan] Failed:', err instanceof Error ? err.message : err)
    return { plan: null, durationMs: Date.now() - start }
  }
}

// ─── Stage 2: BUILD ────────────────────────────────────────────────────────

function buildStagePrompt(plan: StagedBuildPlan): string {
  const componentList = plan.components
    .map((c, i) => `  ${i + 1}. ${c.name} (${c.type}, ${c.material || 'Concrete'}, RGB ${c.color || '160,160,160'}, Size ${c.size || 'auto'})${c.notes ? ` — ${c.notes}` : ''}`)
    .join('\n')

  return `You are a Roblox Luau code generator. Output ONLY a \`\`\`lua code block.

BUILD PLAN — implement EVERY component listed below:
${plan.summary}

COMPONENTS (${plan.components.length} total — build ALL of them):
${componentList}

LIGHTING: ${plan.lightingPreset}
INTERACTIVE: ${plan.interactiveElements.join(', ') || 'none specified'}

Use the standard ForjeAI template with P(), Cyl(), Ball(), vc() helpers.
Include ChangeHistoryService, camera-relative placement (sp), and pcall error handling.
MINIMUM ${plan.estimatedParts} parts. Build EVERY listed component — missing parts = failure.`
}

async function stageBuild(plan: StagedBuildPlan, codePrompt: string): Promise<{ code: string | null; durationMs: number }> {
  const start = Date.now()
  try {
    const instruction = buildStagePrompt(plan)
    const raw = await callAI(codePrompt, [{ role: 'user', content: instruction }], {
      maxTokens: 32768,
      temperature: 0.2,
      codeMode: true,
    })

    // Extract lua code
    const luaMatch = raw.match(/```lua\s*([\s\S]*?)```/)
    const code = luaMatch?.[1]?.trim() || (raw.includes('Instance.new') ? raw.trim() : null)

    return { code, durationMs: Date.now() - start }
  } catch (err) {
    console.warn('[StagedPipeline/Build] Failed:', err instanceof Error ? err.message : err)
    return { code: null, durationMs: Date.now() - start }
  }
}

// ─── Stage 3: VERIFY ───────────────────────────────────────────────────────

async function stageVerify(code: string): Promise<{
  passed: boolean
  score: number
  errors: string[]
  fixedCode: string | null
  durationMs: number
}> {
  const start = Date.now()
  const verification = await verifyLuauCode(code)

  return {
    passed: verification.valid,
    score: verification.score,
    errors: verification.errors.map(e => e.message),
    fixedCode: verification.fixedCode,
    durationMs: Date.now() - start,
  }
}

// ─── Stage 4: ENHANCE ──────────────────────────────────────────────────────

async function stageEnhance(
  code: string,
  plan: StagedBuildPlan,
  errors: string[],
  codePrompt: string,
): Promise<{ code: string | null; durationMs: number }> {
  const start = Date.now()

  // Check which planned components are missing from the code
  const missingComponents = plan.components.filter(c =>
    !code.toLowerCase().includes(c.name.toLowerCase().replace(/\s+/g, ''))
  )

  if (errors.length === 0 && missingComponents.length === 0) {
    return { code, durationMs: Date.now() - start } // Already good
  }

  const enhanceInstruction = `ENHANCE this Roblox Luau code. Keep ALL existing code, ADD what's missing.

${errors.length > 0 ? `FIX THESE ERRORS:\n${errors.map(e => `- ${e}`).join('\n')}\n` : ''}
${missingComponents.length > 0 ? `ADD MISSING COMPONENTS:\n${missingComponents.map(c => `- ${c.name} (${c.type}, ${c.material})`).join('\n')}\n` : ''}

EXISTING CODE:
\`\`\`lua
${code}
\`\`\`

Output the COMPLETE enhanced code in a \`\`\`lua block. Keep everything that works, fix what's broken, add what's missing.`

  try {
    const raw = await callAI(codePrompt, [{ role: 'user', content: enhanceInstruction }], {
      maxTokens: 32768,
      temperature: 0.2,
      codeMode: true,
    })

    const luaMatch = raw.match(/```lua\s*([\s\S]*?)```/)
    const enhanced = luaMatch?.[1]?.trim()

    if (enhanced && enhanced.length > code.length * 0.8) {
      return { code: enhanced, durationMs: Date.now() - start }
    }
    return { code, durationMs: Date.now() - start } // Enhancement didn't improve
  } catch {
    return { code, durationMs: Date.now() - start }
  }
}

// ─── Stage 5: SHIP (final quality gate) ────────────────────────────────────

async function stageShip(code: string, prompt: string): Promise<{
  finalCode: string
  score: number
  qualityScore: QualityScore | null
  durationMs: number
}> {
  const start = Date.now()

  // Final verification pass
  const verification = await verifyLuauCode(code)
  const finalCode = verification.fixedCode || code

  // LLM quality scoring
  let qualityScore: QualityScore | null = null
  try {
    qualityScore = await scoreOutput({
      prompt,
      response: finalCode,
      mode: 'build',
    })
  } catch {}

  return {
    finalCode,
    score: Math.max(verification.score, qualityScore?.total || 0),
    qualityScore,
    durationMs: Date.now() - start,
  }
}

// ─── Main Pipeline ─────────────────────────────────────────────────────────

export async function runStagedPipeline(
  prompt: string,
  codePrompt: string,
): Promise<StagedPipelineResult> {
  const pipelineStart = Date.now()
  const stages: StageResult[] = []

  // Stage 1: Plan
  const { plan, durationMs: planMs } = await stagePlan(prompt)
  stages.push({
    name: 'plan',
    success: plan !== null && plan.components.length >= 5,
    durationMs: planMs,
    details: plan ? `${plan.components.length} components, ${plan.estimatedParts} est. parts` : 'Failed',
  })

  if (!plan || plan.components.length < 3) {
    return {
      code: null,
      plan: null,
      conversationText: '',
      score: 0,
      stages,
      totalLatencyMs: Date.now() - pipelineStart,
    }
  }

  // Stage 2: Build
  const { code: rawCode, durationMs: buildMs } = await stageBuild(plan, codePrompt)
  stages.push({
    name: 'build',
    success: rawCode !== null,
    durationMs: buildMs,
    details: rawCode ? `${rawCode.length} chars` : 'No code generated',
  })

  if (!rawCode) {
    return {
      code: null,
      plan,
      conversationText: plan.summary,
      score: 0,
      stages,
      totalLatencyMs: Date.now() - pipelineStart,
    }
  }

  // Stage 3: Verify
  const verifyResult = await stageVerify(rawCode)
  const verifiedCode = verifyResult.fixedCode || rawCode
  stages.push({
    name: 'verify',
    success: verifyResult.passed,
    durationMs: verifyResult.durationMs,
    details: `Score: ${verifyResult.score}/100, ${verifyResult.errors.length} errors`,
  })

  // Stage 4: Enhance (only if verification found issues or missing components)
  let enhancedCode = verifiedCode
  if (!verifyResult.passed || verifyResult.score < 75) {
    const enhanceResult = await stageEnhance(verifiedCode, plan, verifyResult.errors, codePrompt)
    enhancedCode = enhanceResult.code || verifiedCode
    stages.push({
      name: 'enhance',
      success: enhanceResult.code !== null,
      durationMs: enhanceResult.durationMs,
      details: enhanceResult.code ? `Enhanced to ${enhanceResult.code.length} chars` : 'No improvement',
    })
  } else {
    stages.push({ name: 'enhance', success: true, durationMs: 0, details: 'Skipped (already good)' })
  }

  // Stage 5: Ship
  const shipResult = await stageShip(enhancedCode, prompt)
  stages.push({
    name: 'ship',
    success: shipResult.score >= 50,
    durationMs: shipResult.durationMs,
    details: `Final score: ${shipResult.score}/100`,
  })

  // Fire-and-forget: record to ELI
  const category = detectCategory(prompt)
  void recordToEli({
    prompt,
    score: shipResult.score,
    model: 'staged-pipeline',
    buildType: detectBuildType(prompt) as 'build' | 'script' | 'terrain' | 'image' | 'mesh',
    category,
    partCount: (shipResult.finalCode.match(/Instance\.new\(/g) || []).length,
    passed: shipResult.score >= 60,
    retryCount: stages.filter(s => !s.success).length,
  }).catch(() => {})

  return {
    code: shipResult.finalCode,
    plan,
    conversationText: plan.summary,
    score: shipResult.score,
    stages,
    totalLatencyMs: Date.now() - pipelineStart,
  }
}
