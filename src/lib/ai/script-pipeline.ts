/**
 * Multi-Step Script Pipeline — the core of ForjeGames' AI engine.
 *
 * Routes requests through appropriate complexity levels:
 *   SIMPLE  → single callAI, direct deploy
 *   MODERATE → single script with full context
 *   COMPLEX → multi-file pipeline (plan → generate → verify → fix → deploy)
 *
 * DO NOT add templates here. This pipeline generates quality code dynamically
 * using the knowledge base, verification, and learning loop.
 */

import 'server-only'
import { callAI } from './provider'
import { verifyLuauCode } from './luau-verifier'
import { buildRobloxContext } from './roblox-knowledge'

// ─── Types ───────────────────────────────────────────────────────────────────

export type ScriptComplexity = 'simple' | 'moderate' | 'complex'

export interface ScriptPlan {
  scripts: Array<{
    name: string
    scriptType: 'Script' | 'LocalScript' | 'ModuleScript'
    parent: string // e.g. "ServerScriptService", "StarterPlayerScripts", "ReplicatedStorage"
    purpose: string
    dependencies: string[] // module names this script requires
  }>
  generationOrder: string[] // names in the order they should be generated
  systemDescription: string
}

export interface GeneratedScript {
  name: string
  scriptType: 'Script' | 'LocalScript' | 'ModuleScript'
  parent: string
  code: string
  verified: boolean
  verificationErrors: string[]
}

export interface PipelineResult {
  success: boolean
  complexity: ScriptComplexity
  scripts: GeneratedScript[]
  plan?: ScriptPlan
  error?: string
}

export interface PipelineProgress {
  stage: 'classify' | 'plan' | 'generate' | 'verify' | 'fix' | 'deploy'
  current: number
  total: number
  scriptName?: string
  message: string
}

// ─── Stage 1: CLASSIFY ──────────────────────────────────────────────────────

const COMPLEX_KEYWORDS = [
  'inventory system', 'shop system', 'combat system', 'quest system',
  'npc system', 'vehicle system', 'pet system', 'crafting system',
  'trading system', 'economy', 'progression', 'leaderboard system',
  'matchmaking', 'lobby system', 'class system', 'ability system',
  'dialogue system', 'cutscene', 'tutorial system', 'achievement system',
  'build complete game', 'full game', 'multiplayer game',
]

const MODERATE_KEYWORDS = [
  'sprint', 'dash', 'double jump', 'ability', 'cooldown',
  'data save', 'datastore', 'remote event', 'tool', 'weapon',
  'door', 'elevator', 'teleporter', 'round system', 'timer',
  'shop', 'purchase', 'currency', 'health bar', 'damage',
]

export function classifyComplexity(prompt: string): ScriptComplexity {
  const lower = prompt.toLowerCase()

  // Check for multi-system requests
  const complexMatches = COMPLEX_KEYWORDS.filter(kw => lower.includes(kw))
  if (complexMatches.length >= 1) return 'complex'

  // Check for multi-script indicators
  if (lower.includes(' and ') && MODERATE_KEYWORDS.filter(kw => lower.includes(kw)).length >= 2) {
    return 'complex'
  }

  // Check for moderate complexity
  const moderateMatches = MODERATE_KEYWORDS.filter(kw => lower.includes(kw))
  if (moderateMatches.length >= 1) return 'moderate'

  // Simple: single actions, explanations, small changes
  return 'simple'
}

// ─── Stage 2: PLAN (complex only) ───────────────────────────────────────────

export async function planScripts(
  prompt: string,
  gameTree: string,
  existingScripts: string[],
): Promise<ScriptPlan | null> {
  const planPrompt = `You are a Roblox Luau architect. Plan the scripts needed for this request.

USER REQUEST: ${prompt}

EXISTING GAME STRUCTURE:
${gameTree || '(empty project)'}

EXISTING SCRIPTS: ${existingScripts.length > 0 ? existingScripts.join(', ') : '(none)'}

Return a JSON object with this exact structure:
{
  "scripts": [
    {
      "name": "ScriptName",
      "scriptType": "Script" | "LocalScript" | "ModuleScript",
      "parent": "ServerScriptService" | "StarterPlayerScripts" | "ReplicatedStorage" | etc,
      "purpose": "What this script does",
      "dependencies": ["ModuleName1"]
    }
  ],
  "generationOrder": ["ModuleName1", "ScriptName"],
  "systemDescription": "Brief description of the system"
}

Rules:
- ModuleScripts go in ReplicatedStorage (shared) or ServerScriptService (server-only)
- Server Scripts go in ServerScriptService
- LocalScripts go in StarterPlayerScripts or StarterGui
- Generate modules BEFORE scripts that require() them
- Name scripts clearly (e.g. "InventoryManager", "ShopUI", "CombatHandler")
- Don't duplicate existing scripts — extend or require them instead`

  try {
    const result = await callAI(planPrompt, [{ role: 'user', content: prompt }], {
      jsonMode: true,
      codeMode: true,
      maxTokens: 2048,
      temperature: 0.3,
    })

    if (!result) return null
    const parsed = JSON.parse(result)
    return parsed as ScriptPlan
  } catch (err) {
    console.error('[ScriptPipeline] Planning failed:', err)
    return null
  }
}

// ─── Stage 3: GENERATE (per script) ─────────────────────────────────────────

async function generateScript(
  scriptInfo: ScriptPlan['scripts'][0],
  prompt: string,
  plan: ScriptPlan,
  gameTree: string,
  generatedSoFar: GeneratedScript[],
): Promise<string | null> {
  // Build context from already-generated scripts
  const priorScripts = generatedSoFar
    .map(s => `-- ${s.name} (${s.scriptType} in ${s.parent}):\n${s.code.slice(0, 1000)}`)
    .join('\n\n')

  // Get relevant Roblox API snippets
  const robloxContext = buildRobloxContext(`${prompt} ${scriptInfo.purpose}`)

  const genPrompt = `You are a Roblox Luau expert. Generate a SINGLE script for the following:

SYSTEM OVERVIEW: ${plan.systemDescription}

SCRIPT TO GENERATE:
- Name: ${scriptInfo.name}
- Type: ${scriptInfo.scriptType}
- Parent: ${scriptInfo.parent}
- Purpose: ${scriptInfo.purpose}
- Dependencies: ${scriptInfo.dependencies.length > 0 ? scriptInfo.dependencies.join(', ') : 'none'}

${priorScripts ? `ALREADY GENERATED SCRIPTS (reference these, don't duplicate):\n${priorScripts}\n` : ''}
${gameTree ? `GAME TREE:\n${gameTree}\n` : ''}
${robloxContext}

USER REQUEST: ${prompt}

Rules:
- Output ONLY the Luau code in a \`\`\`lua block
- Use modern Luau: task.wait(), task.spawn(), task.delay() (NOT wait/spawn/delay)
- Wrap any DataStore/HTTP calls in pcall()
- Add type annotations for function parameters
- Use :: Type for variables where helpful
- If this script requires() other modules, use the EXACT names from the plan
- require() path format: require(game.ReplicatedStorage.ModuleName)
- Never use deprecated APIs
- Add meaningful comments for complex logic`

  try {
    const result = await callAI(genPrompt, [{ role: 'user', content: `Generate ${scriptInfo.name}: ${scriptInfo.purpose}` }], {
      codeMode: true,
      maxTokens: 8192,
      useRAG: true,
    })

    if (!result) return null

    const luaMatch = result.match(/```lua\s*([\s\S]*?)```/)
    return luaMatch?.[1]?.trim() || null
  } catch (err) {
    console.error(`[ScriptPipeline] Generation failed for ${scriptInfo.name}:`, err)
    return null
  }
}

// ─── Stage 4+5: VERIFY & FIX ────────────────────────────────────────────────

async function verifyAndFix(
  code: string,
  scriptName: string,
  prompt: string,
  maxRetries: number = 2,
): Promise<{ code: string; verified: boolean; errors: string[] }> {
  const result = await verifyLuauCode(code)
  if (result.valid) {
    return { code, verified: true, errors: [] }
  }

  const errors = result.errors.map(i => i.message)
  if (maxRetries <= 0) {
    return { code, verified: false, errors }
  }

  // Attempt fix
  const fixPrompt = `Fix these Luau verification errors in the script "${scriptName}":

ERRORS:
${errors.map(e => `- ${e}`).join('\n')}

ORIGINAL CODE:
\`\`\`lua
${code}
\`\`\`

Return the COMPLETE fixed script in a \`\`\`lua block. Fix every error. Keep working code intact.`

  try {
    const fixResult = await callAI(fixPrompt, [{ role: 'user', content: `Fix ${scriptName}` }], {
      codeMode: true,
      maxTokens: 8192,
    })

    if (fixResult) {
      const luaMatch = fixResult.match(/```lua\s*([\s\S]*?)```/)
      const fixedCode = luaMatch?.[1]?.trim()
      if (fixedCode) {
        return verifyAndFix(fixedCode, scriptName, prompt, maxRetries - 1)
      }
    }
  } catch { /* fall through */ }

  return { code, verified: false, errors }
}

// ─── Main Pipeline ──────────────────────────────────────────────────────────

export async function runScriptPipeline(
  prompt: string,
  gameTree: string,
  existingScripts: string[],
  onProgress?: (progress: PipelineProgress) => void,
): Promise<PipelineResult> {
  // Stage 1: CLASSIFY
  onProgress?.({ stage: 'classify', current: 0, total: 1, message: 'Analyzing request...' })
  const complexity = classifyComplexity(prompt)
  console.log(`[ScriptPipeline] Classified as: ${complexity}`)

  if (complexity === 'simple') {
    // Simple: just generate one script directly
    onProgress?.({ stage: 'generate', current: 0, total: 1, message: 'Generating script...' })
    const robloxContext = buildRobloxContext(prompt)
    const result = await callAI(
      `You are a Roblox Luau expert. Generate the requested script.\n${robloxContext}\nOutput ONLY a \`\`\`lua code block. Use modern Luau (task.wait, not wait). Add type annotations.`,
      [{ role: 'user', content: prompt }],
      { codeMode: true, maxTokens: 4096, useRAG: true },
    )

    if (!result) return { success: false, complexity, scripts: [], error: 'AI generation failed' }

    const luaMatch = result.match(/```lua\s*([\s\S]*?)```/)
    const code = luaMatch?.[1]?.trim()
    if (!code) return { success: false, complexity, scripts: [], error: 'No code block in response' }

    const verified = await verifyLuauCode(code)
    return {
      success: true,
      complexity,
      scripts: [{
        name: 'Script',
        scriptType: 'Script',
        parent: 'ServerScriptService',
        code,
        verified: verified.valid,
        verificationErrors: verified.errors.map(i => i.message),
      }],
    }
  }

  // Stage 2: PLAN (moderate + complex)
  onProgress?.({ stage: 'plan', current: 0, total: 1, message: 'Planning scripts...' })
  const plan = await planScripts(prompt, gameTree, existingScripts)

  if (!plan || plan.scripts.length === 0) {
    return { success: false, complexity, scripts: [], error: 'Failed to create script plan' }
  }

  console.log(`[ScriptPipeline] Plan: ${plan.scripts.length} scripts in order: ${plan.generationOrder.join(' → ')}`)

  // Stage 3+4+5: GENERATE + VERIFY + FIX for each script
  const generatedScripts: GeneratedScript[] = []
  const total = plan.generationOrder.length

  for (let i = 0; i < plan.generationOrder.length; i++) {
    const scriptName = plan.generationOrder[i]
    const scriptInfo = plan.scripts.find(s => s.name === scriptName)
    if (!scriptInfo) continue

    onProgress?.({
      stage: 'generate',
      current: i + 1,
      total,
      scriptName,
      message: `Generating ${scriptName}...`,
    })

    const code = await generateScript(scriptInfo, prompt, plan, gameTree, generatedScripts)
    if (!code) {
      generatedScripts.push({
        name: scriptInfo.name,
        scriptType: scriptInfo.scriptType,
        parent: scriptInfo.parent,
        code: `-- Failed to generate ${scriptInfo.name}`,
        verified: false,
        verificationErrors: ['Generation failed'],
      })
      continue
    }

    // Verify and fix
    onProgress?.({
      stage: 'verify',
      current: i + 1,
      total,
      scriptName,
      message: `Verifying ${scriptName}...`,
    })

    const { code: finalCode, verified, errors } = await verifyAndFix(code, scriptName, prompt)

    generatedScripts.push({
      name: scriptInfo.name,
      scriptType: scriptInfo.scriptType,
      parent: scriptInfo.parent,
      code: finalCode,
      verified,
      verificationErrors: errors,
    })
  }

  onProgress?.({ stage: 'deploy', current: total, total, message: 'Ready to deploy' })

  return {
    success: generatedScripts.some(s => s.verified || s.verificationErrors.length === 0),
    complexity,
    scripts: generatedScripts,
    plan,
  }
}

/**
 * Convert pipeline result into a BATCH_CREATE Luau command for the plugin.
 */
export function pipelineToLuau(result: PipelineResult): string {
  if (result.scripts.length === 0) return '-- No scripts generated'

  if (result.scripts.length === 1) {
    return result.scripts[0].code
  }

  // Multi-script: generate batch creation code
  const lines = [
    '-- Generated by ForjeGames Script Pipeline',
    `-- System: ${result.plan?.systemDescription || 'Multi-script system'}`,
    `-- Scripts: ${result.scripts.length}`,
    '',
  ]

  for (const script of result.scripts) {
    lines.push(`-- ═══ ${script.name} (${script.scriptType} → ${script.parent}) ═══`)
    lines.push('')
    lines.push(script.code)
    lines.push('')
  }

  return lines.join('\n')
}
