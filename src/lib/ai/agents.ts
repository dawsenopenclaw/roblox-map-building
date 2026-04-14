/**
 * ForjeGames Agent Registry — 9 specialized roles that auto-dispatch based on
 * user intent. Each agent wraps the shared `callAI` helper with a tuned system
 * prompt plus a pre/post hook that the orchestrator uses to chain agents.
 *
 * The user's ask was: "make the AI agents for Build Ideas Plan image script
 * terrain 3d debug and think all be able to know what they are working on
 * and do it for the customer on its own please and also make it global that
 * it auto detects upon prompting please."
 *
 * The auto-detect happens in src/lib/ai/orchestrator.ts — it uses the
 * existing intent-classifier.ts plus the `matches(prompt)` helper on each
 * agent to rank which agents to invoke.
 *
 * Sequential flow (typical): Think → Ideas → Plan → {Terrain|Script|Image|
 * ThreeD|Build} → Debug. Simple prompts skip Think/Ideas/Plan entirely.
 */

import 'server-only'
import { callAI, type AIMessage } from './provider'
import { classifyIntent, type Intent } from './intent-classifier'
import { createMeshyTask, pollMeshyTask, downloadMeshyAsset } from './meshy'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AgentName =
  | 'think'
  | 'ideas'
  | 'plan'
  | 'build'
  | 'image'
  | 'script'
  | 'terrain'
  | 'threed'
  | 'debug'

export interface AgentContext {
  /** The original user prompt. Immutable across the chain. */
  userPrompt: string
  /** Session/editor context the caller can pass through. */
  sessionHint?: string
  /** Output from the previously-run agent. First agent in the chain sees ''. */
  priorOutput: string
  /** Full chain so far — agents can read their teammates' output if useful. */
  history: Array<{ agent: AgentName; output: string }>
  /** Language model runtime flags. */
  opts?: { codeMode?: boolean; jsonMode?: boolean; maxTokens?: number }
}

export interface AgentResult {
  agent: AgentName
  output: string
  durationMs: number
  /** Whether this agent considers itself the "final" answer the user should see. */
  isTerminal: boolean
}

export interface AgentDefinition {
  name: AgentName
  title: string
  tagline: string
  /** Free-text system prompt injected for this agent. */
  systemPrompt: string
  /** Intents that strongly suggest invoking this agent. */
  intents: ReadonlyArray<Intent>
  /** Literal keywords that suggest this agent regardless of classifier. */
  keywords: ReadonlyArray<string>
  /** Agents are chained in this order if multiple are selected. */
  priority: number
  /** When true, any agent with a higher priority in the chain runs first. */
  run(ctx: AgentContext): Promise<AgentResult>
}

// ---------------------------------------------------------------------------
// Shared helper — runs callAI with the agent's system prompt + context chain
// ---------------------------------------------------------------------------

async function runWithContext(
  name: AgentName,
  systemPrompt: string,
  ctx: AgentContext,
  opts?: AgentContext['opts'],
): Promise<AgentResult> {
  const started = Date.now()

  const messages: AIMessage[] = []

  // Feed prior agents' output so the current agent knows what its teammates
  // already produced. Keep it short — we don't want to nuke the context window.
  if (ctx.history.length > 0) {
    const priorSummary = ctx.history
      .map((h) => `## ${h.agent.toUpperCase()} said\n${truncate(h.output, 1200)}`)
      .join('\n\n')
    messages.push({
      role: 'system',
      content: `Prior agent chain (for reference — build on this, don't repeat it):\n\n${priorSummary}`,
    })
  }

  if (ctx.sessionHint) {
    messages.push({
      role: 'system',
      content: `Editor/session context: ${ctx.sessionHint}`,
    })
  }

  messages.push({
    role: 'user',
    content: ctx.userPrompt,
  })

  let output = ''
  try {
    output = await callAI(systemPrompt, messages, {
      maxTokens: opts?.maxTokens ?? 2048,
      temperature: opts?.codeMode ? 0.2 : 0.7,
      codeMode: opts?.codeMode,
      jsonMode: opts?.jsonMode,
    })
  } catch (err) {
    output = `⚠ ${name} agent failed: ${err instanceof Error ? err.message : String(err)}`
  }

  return {
    agent: name,
    output,
    durationMs: Date.now() - started,
    isTerminal: false,
  }
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  return s.slice(0, max - 3) + '...'
}

// ---------------------------------------------------------------------------
// Agent 1 — Think (meta-reasoning, goes first for non-trivial prompts)
// ---------------------------------------------------------------------------

const THINK_PROMPT = `You are the THINK agent for ForjeGames, a Roblox AI game-building platform.

Your only job is to reason out loud about what the user is actually asking for, in 3-6 bullet points. Identify:
- The concrete deliverable (what does "done" look like?)
- Hidden constraints (player count, mobile, team size, time budget)
- Which downstream agents should handle which parts
- The single biggest risk or ambiguity the user should clarify

Be concise. Do NOT write code, do NOT make assets, do NOT answer the prompt directly. You are the strategic frame — the other agents read your output and act on it.

End with one line starting with "HANDOFF: " that names which of these agents should run next: ideas, plan, build, image, script, terrain, threed, debug.`

// ---------------------------------------------------------------------------
// Agent 2 — Ideas (brainstorm, creative concepts)
// ---------------------------------------------------------------------------

const IDEAS_PROMPT = `You are the IDEAS agent for ForjeGames — a viral Roblox game concept generator that rivals BloxToolkit.

Your job is to generate 3-5 concrete, differentiated, VIRAL game concept directions the user can pick from. You think like both a game designer and a growth hacker. For EACH idea, provide:

**Title**: A punchy 2-5 word game name
**Genre**: Simulator | Tycoon | Obby | RPG | Social | Horror | Racing | Combat | Sandbox | Puzzle | Survival | Adventure
**Viral Hook**: The ONE thing that makes players screenshot/stream/share this game
**Core Loop**: Micro-loop (30 seconds), session loop (5-15 min), and meta-loop (days/weeks)
**Unique Selling Point**: What makes this DIFFERENT from every other game in the genre
**Key Mechanics**: 3-4 concrete, specific gameplay mechanics (not vague things like "fun combat")
**Monetization**: 2-3 GamePasses with Robux prices + 1-2 DevProducts
**Target Audience**: Specific demographic (age range, platform, player type)
**Build Complexity**: Easy / Medium / Hard (be honest — simulator reskins are easy, open-world RPGs are hard)
**Trending Score**: X/100 — how aligned with current 2026 Roblox trends
**Similar Games**: 2-3 real Roblox games that prove the market
**Retention Hook**: What brings players back tomorrow

Current Roblox trends (2026):
- Pet/creature collection + merge mechanics remain dominant
- Anime tower defense + gacha is evergreen
- Fashion/dress-up social games are exploding (underserved female 10-16 demo)
- Horror chapter games with ARG lore drive recurring visits
- UGC creation games have infinite replay value
- Idle/AFK layers on active games boost DAU massively
- Mobile-first design is critical (70%+ mobile players)
- Trading economies create their own content ecosystem

Bias toward ideas that are buildable with the ForjeGames AI editor. Show genuine creativity — combine 2-3 proven patterns in unexpected ways. Avoid pure clones.

End with: "RECOMMENDED: <the idea you'd pick>, because <one-sentence strategic reason>".`

// ---------------------------------------------------------------------------
// Agent 3 — Plan (decomposes into a build plan)
// ---------------------------------------------------------------------------

const PLAN_PROMPT = `You are the PLAN agent for ForjeGames.

Take the user's goal (and anything the THINK/IDEAS agents said earlier) and turn it into an ordered build plan the other agents can execute. Structure:

1. Terrain / world layout (what biomes, what scale, what named landmarks)
2. Buildings / structures (list, with sizes)
3. NPCs / enemies / entities
4. Scripts / systems (list of scripts with their responsibilities)
5. UI / HUD elements
6. Audio / music mood
7. Playtest criteria (how we know it's working)

Each step names the agent that should build it (terrain, threed, script, image, build, etc.). Keep the plan lean — at most 12 numbered steps.`

// ---------------------------------------------------------------------------
// Agent 4 — Build (executes a full-game plan end-to-end)
// ---------------------------------------------------------------------------

const BUILD_PROMPT = `You are the BUILD agent for ForjeGames.

You are an autonomous game builder. Given a plan (from the PLAN agent) or a direct user goal, output Luau code that, when executed in Roblox Studio via the ForjeGames plugin's execute_luau command, constructs the described game.

Hard constraints:
- Use game:GetService("Workspace"), CollectionService, etc. — never global service shortcuts.
- Wrap risky operations in pcall.
- Anchor parts unless physics is intended.
- Add the CollectionService tag "forje_ai_generated" to every created instance so the plugin can track them.
- Return a single Luau code block, no prose, no markdown fences.`

// ---------------------------------------------------------------------------
// Agent 5 — Image (visual asset prompts)
// ---------------------------------------------------------------------------

const IMAGE_PROMPT = `You are the IMAGE agent for ForjeGames.

Your job is to produce high-quality image generation prompts suitable for Fal, Meshy image-to-3D, or Roblox decal uploads. Output format:

Subject: <what the image is>
Style: <art direction — "low-poly PBR", "stylized handpainted", "realistic PBR", etc.>
Composition: <camera angle + framing>
Lighting: <key light + mood>
Negative: <what to avoid>

Give 3 variants per request unless the user asks for a specific count. Never write code, never describe building steps — you are purely the image-prompt specialist.`

// ---------------------------------------------------------------------------
// Agent 6 — Script (Luau code specialist)
// ---------------------------------------------------------------------------

const SCRIPT_PROMPT = `You are the SCRIPT agent for ForjeGames.

You write production-quality Luau for Roblox. Rules:
- Always use typed Luau with --!strict at the top when writing ModuleScripts
- Use game:GetService, never workspace.Terrain (use game:GetService("Workspace").Terrain)
- Handle all RemoteEvent/RemoteFunction cases with pcall
- Prefer task.spawn over coroutine.create
- Use CollectionService tags instead of Instance.new attribute soup
- Use TweenService instead of hand-rolled loops where possible
- Comment non-obvious sections

Return ONLY the Luau code in a single code block. No explanations, no markdown prose.`

// ---------------------------------------------------------------------------
// Agent 7 — Terrain
// ---------------------------------------------------------------------------

const TERRAIN_PROMPT = `You are the TERRAIN agent for ForjeGames.

You output Luau code that operates on game:GetService("Workspace").Terrain using WriteVoxels, FillBlock, FillBall, FillRegion, or FillWedge. Rules:
- All terrain calls must be wrapped in pcall
- Use Enum.Material constants, never string names
- Keep regions under 2048x2048x2048 studs to avoid memory spikes
- Comment the biome/feature each block is building (rivers, mountains, caves, etc.)

Return a single Luau code block, nothing else.`

// ---------------------------------------------------------------------------
// Agent 8 — ThreeD (mesh + model generation)
// ---------------------------------------------------------------------------

const THREED_PROMPT = `You are the THREED agent for ForjeGames.

Your job is to produce a JSON specification for the Meshy 3D generation pipeline. You MUST output valid JSON and nothing else — no markdown, no explanation, no code fences.

Output this exact JSON structure:
{
  "models": [
    {
      "prompt": "<clear subject description optimized for 3D generation, max 30 words, be specific about shape/material/detail>",
      "artStyle": "low-poly",
      "polyTarget": 5000,
      "type": "prop"
    }
  ]
}

Rules for the prompt field:
- Be specific about physical appearance: materials, colors, proportions, surface detail
- Include the object type and context (e.g. "medieval stone castle tower with crenellated battlements" not just "tower")
- Never use abstract or emotional language — describe what the camera would see

Valid artStyle values: "low-poly", "realistic", "cartoon"
Valid type values: "building", "character", "vehicle", "weapon", "furniture", "terrain", "prop", "effect", "custom"
polyTarget: 3000 for simple props, 5000 for mid, 8000 for detailed, 15000 for complex characters/buildings

If the user asks for multiple models, include multiple objects in the models array.`

// Custom run function for ThreeD that actually calls Meshy
async function runThreeD(ctx: AgentContext): Promise<AgentResult> {
  const started = Date.now()

  // Step 1: Use AI to generate structured mesh specs from the user's prompt
  const messages: AIMessage[] = []

  if (ctx.history.length > 0) {
    const priorSummary = ctx.history
      .map((h) => `## ${h.agent.toUpperCase()} said\n${truncate(h.output, 1200)}`)
      .join('\n\n')
    messages.push({
      role: 'system',
      content: `Prior agent chain (for reference):\n\n${priorSummary}`,
    })
  }

  messages.push({ role: 'user', content: ctx.userPrompt })

  let specOutput = ''
  try {
    specOutput = await callAI(THREED_PROMPT, messages, {
      maxTokens: 1024,
      temperature: 0.3,
      jsonMode: true,
    })
  } catch (err) {
    return {
      agent: 'threed',
      output: `⚠ ThreeD agent failed to generate specs: ${err instanceof Error ? err.message : String(err)}`,
      durationMs: Date.now() - started,
      isTerminal: false,
    }
  }

  // Step 2: Parse the specs and call Meshy for each model
  const apiKey = process.env.MESHY_API_KEY
  if (!apiKey) {
    return {
      agent: 'threed',
      output: `## 3D Model Specs (Demo Mode)\n\nMESHY_API_KEY is not configured — showing specs only.\n\n\`\`\`json\n${specOutput}\n\`\`\`\n\nSet MESHY_API_KEY in your environment to generate real 3D models.`,
      durationMs: Date.now() - started,
      isTerminal: false,
    }
  }

  let specs: { models: Array<{ prompt: string; artStyle: string; polyTarget: number; type: string }> }
  try {
    specs = JSON.parse(specOutput)
    if (!specs.models || !Array.isArray(specs.models)) {
      specs = { models: [{ prompt: ctx.userPrompt, artStyle: 'low-poly', polyTarget: 5000, type: 'prop' }] }
    }
  } catch {
    specs = { models: [{ prompt: ctx.userPrompt, artStyle: 'low-poly', polyTarget: 5000, type: 'prop' }] }
  }

  const results: string[] = []

  for (const model of specs.models.slice(0, 3)) {
    try {
      // Map artStyle to Meshy format
      const meshyStyle = model.artStyle === 'realistic' ? 'pbr'
        : model.artStyle === 'cartoon' ? 'cartoon'
        : 'low-poly'

      const taskId = await createMeshyTask({
        prompt: model.prompt,
        polyTarget: model.polyTarget || 5000,
        artStyle: meshyStyle,
        apiKey,
      })

      // Poll for completion (up to ~2 min)
      const task = await pollMeshyTask({ taskId, apiKey, maxAttempts: 30, intervalMs: 4000 })

      if (task.status === 'SUCCEEDED' && task.model_urls?.glb) {
        const dims = model.type === 'building' ? '20, 20, 20'
          : model.type === 'character' ? '4, 6, 4'
          : model.type === 'vehicle' ? '12, 6, 20'
          : model.type === 'weapon' ? '1, 8, 1'
          : '6, 6, 6'

        results.push(
          `### ✅ ${model.prompt}\n` +
          `- **Status:** Generated successfully\n` +
          `- **GLB URL:** ${task.model_urls.glb}\n` +
          `- **Polygons:** ${task.polygon_count?.toLocaleString() ?? 'unknown'}\n` +
          `- **Thumbnail:** ${task.thumbnail_url ?? 'none'}\n` +
          `- **Task ID:** ${taskId}\n\n` +
          `\`\`\`lua\n` +
          `-- Insert this 3D model into your game\n` +
          `local meshPart = Instance.new("MeshPart")\n` +
          `meshPart.Name = "${model.prompt.slice(0, 40).replace(/"/g, '')}"\n` +
          `-- Upload the GLB to Roblox and replace YOUR_ASSET_ID\n` +
          `meshPart.MeshId = "rbxassetid://YOUR_ASSET_ID"\n` +
          `meshPart.Size = Vector3.new(${dims})\n` +
          `meshPart.Anchored = true\n` +
          `meshPart.Parent = workspace\n` +
          `\`\`\``
        )
      } else if (task.status === 'IN_PROGRESS') {
        results.push(
          `### ⏳ ${model.prompt}\n` +
          `- **Status:** Still generating (task ${taskId})\n` +
          `- Poll GET /api/ai/mesh/status/${taskId} for updates`
        )
      } else {
        results.push(`### ❌ ${model.prompt}\n- **Status:** ${task.status}`)
      }
    } catch (err) {
      results.push(
        `### ❌ ${model.prompt}\n` +
        `- **Error:** ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

  const output = `## 3D Model Generation Results\n\n${results.join('\n\n')}`

  return {
    agent: 'threed',
    output,
    durationMs: Date.now() - started,
    isTerminal: false,
  }
}

// ---------------------------------------------------------------------------
// Agent 9 — Debug (error diagnosis + fix)
// ---------------------------------------------------------------------------

const DEBUG_PROMPT = `You are the DEBUG agent for ForjeGames.

You read Luau error messages, stack traces, and plugin pendingError reports, then return:

1. Root cause in one sentence
2. The minimal code change that fixes it (in a code block)
3. A regression check — one line the user should run to verify the fix

If the error is an unknown command type from the Studio plugin, remember the plugin only implements: execute_luau, insert_asset, update_property, delete_model, scan_workspace. Any other command type is the server's fault — recommend rewriting the server call, not the plugin.

Be terse. Never pad with "I understand" / "great question" / etc.`

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const AGENTS: Record<AgentName, AgentDefinition> = {
  think: {
    name: 'think',
    title: 'Think',
    tagline: 'Strategic framing and decomposition',
    systemPrompt: THINK_PROMPT,
    intents: ['general'],
    keywords: ['think', 'analyze', 'understand', 'figure out', 'should i', 'best way', 'strategy'],
    priority: 1,
    run(ctx) { return runWithContext('think', THINK_PROMPT, ctx, { maxTokens: 1024 }) },
  },
  ideas: {
    name: 'ideas',
    title: 'Ideas',
    tagline: 'Concept brainstorming and direction',
    systemPrompt: IDEAS_PROMPT,
    intents: ['fullgame', 'tycoon', 'obby', 'general'],
    keywords: ['idea', 'concept', 'brainstorm', 'suggest', 'what should', 'inspiration', 'theme', 'viral', 'trending', 'game idea', 'monetiz', 'gamepass'],
    priority: 2,
    run(ctx) { return runWithContext('ideas', IDEAS_PROMPT, ctx, { maxTokens: 3072 }) },
  },
  plan: {
    name: 'plan',
    title: 'Plan',
    tagline: 'Ordered build plan by agent',
    systemPrompt: PLAN_PROMPT,
    intents: ['fullgame', 'tycoon', 'obby', 'building', 'terrain'],
    keywords: ['plan', 'roadmap', 'steps', 'order', 'how do i build'],
    priority: 3,
    run(ctx) { return runWithContext('plan', PLAN_PROMPT, ctx, { maxTokens: 1536 }) },
  },
  image: {
    name: 'image',
    title: 'Image',
    tagline: 'Image generation prompts for Fal / Meshy',
    systemPrompt: IMAGE_PROMPT,
    intents: ['texture', 'mesh'],
    keywords: ['image', 'texture', 'decal', 'thumbnail', 'icon', 'picture', 'artwork', 'concept art'],
    priority: 5,
    run(ctx) { return runWithContext('image', IMAGE_PROMPT, ctx, { maxTokens: 1024 }) },
  },
  script: {
    name: 'script',
    title: 'Script',
    tagline: 'Typed Luau code generation',
    systemPrompt: SCRIPT_PROMPT,
    intents: ['script', 'combat', 'economy', 'quest', 'npc'],
    keywords: ['script', 'luau', 'lua', 'code', 'function', 'module', 'system', 'handler', 'event', 'remoteevent'],
    priority: 5,
    run(ctx) { return runWithContext('script', SCRIPT_PROMPT, ctx, { codeMode: true, maxTokens: 3072 }) },
  },
  terrain: {
    name: 'terrain',
    title: 'Terrain',
    tagline: 'Biome, heightmap, and terrain voxel ops',
    systemPrompt: TERRAIN_PROMPT,
    intents: ['terrain'],
    keywords: ['terrain', 'biome', 'mountain', 'river', 'lake', 'forest', 'desert', 'voxel', 'heightmap', 'sculpt'],
    priority: 5,
    run(ctx) { return runWithContext('terrain', TERRAIN_PROMPT, ctx, { codeMode: true, maxTokens: 2048 }) },
  },
  threed: {
    name: 'threed',
    title: '3D',
    tagline: 'Real 3D mesh generation via Meshy AI',
    systemPrompt: THREED_PROMPT,
    intents: ['mesh'],
    keywords: ['3d', 'mesh', 'model', 'meshy', 'sculpt', 'asset', 'part', 'prop', 'weapon', 'vehicle'],
    priority: 5,
    run: runThreeD,
  },
  build: {
    name: 'build',
    title: 'Build',
    tagline: 'Autonomous full-game builder',
    systemPrompt: BUILD_PROMPT,
    intents: ['fullgame', 'tycoon', 'obby', 'building'],
    keywords: ['build', 'make me', 'generate', 'create a game', 'construct', 'assemble', 'tycoon', 'obby', 'simulator'],
    priority: 6,
    run(ctx) { return runWithContext('build', BUILD_PROMPT, ctx, { codeMode: true, maxTokens: 4096 }) },
  },
  debug: {
    name: 'debug',
    title: 'Debug',
    tagline: 'Error analysis + minimal fix',
    systemPrompt: DEBUG_PROMPT,
    intents: ['script'],
    keywords: ['error', 'fix', 'debug', 'broken', 'crash', 'not working', 'exception', 'traceback', 'bug'],
    priority: 9,
    run(ctx) { return runWithContext('debug', DEBUG_PROMPT, ctx, { codeMode: true, maxTokens: 1536 }) },
  },
}

// ---------------------------------------------------------------------------
// Auto-select: given a prompt, return the agents that should run (ordered)
// ---------------------------------------------------------------------------

export interface DispatchPlan {
  agents: AgentName[]
  reasoning: string
  classifiedIntent: Intent
  confidence: number
}

export function selectAgentsForPrompt(prompt: string): DispatchPlan {
  const promptLower = prompt.toLowerCase()
  const classification = classifyIntent(prompt)

  const scores = new Map<AgentName, number>()

  // Score 1: intent match from the existing classifier
  for (const agent of Object.values(AGENTS)) {
    if (agent.intents.includes(classification.intent)) {
      scores.set(agent.name, (scores.get(agent.name) ?? 0) + classification.confidence * 3)
    }
    // Sub-intents contribute half weight
    for (const sub of classification.subIntents) {
      if (agent.intents.includes(sub)) {
        scores.set(agent.name, (scores.get(agent.name) ?? 0) + 0.5)
      }
    }
  }

  // Score 2: direct keyword match on the agent's own keyword list
  for (const agent of Object.values(AGENTS)) {
    for (const kw of agent.keywords) {
      if (promptLower.includes(kw)) {
        scores.set(agent.name, (scores.get(agent.name) ?? 0) + 1.2)
      }
    }
  }

  // Score 3: prompt length heuristic — long / ambitious prompts get think + plan
  const wordCount = prompt.split(/\s+/).length
  const isAmbitious = wordCount > 30 || /\b(full game|complete|entire|everything)\b/i.test(prompt)

  if (isAmbitious) {
    scores.set('think', (scores.get('think') ?? 0) + 1.5)
    scores.set('plan', (scores.get('plan') ?? 0) + 1.5)
  }

  // Always include debug if the prompt mentions an error
  if (/\b(error|fix|broken|crash|traceback|not working|undefined|nil)\b/i.test(prompt)) {
    scores.set('debug', (scores.get('debug') ?? 0) + 2.5)
  }

  // Pick the top scorers (threshold 0.8), sorted by agent priority so the chain
  // runs in a sensible order regardless of score.
  const selected = Array.from(scores.entries())
    .filter(([, score]) => score >= 0.8)
    .map(([name]) => name)
    .sort((a, b) => AGENTS[a].priority - AGENTS[b].priority)

  // Fallback: if nothing scored high enough, route short prompts to script
  // (the most common case) and long prompts to think → plan → build.
  let agents: AgentName[] = selected
  if (agents.length === 0) {
    agents = isAmbitious ? ['think', 'plan', 'build'] : ['script']
  }

  // Cap at 4 agents so a single chain completes in reasonable time.
  agents = agents.slice(0, 4)

  const reasoning = isAmbitious
    ? `Ambitious prompt (${wordCount} words) → strategic chain: ${agents.join(' → ')}`
    : `Classified as "${classification.intent}" (confidence ${classification.confidence.toFixed(2)}) → ${agents.join(' → ')}`

  return {
    agents,
    reasoning,
    classifiedIntent: classification.intent,
    confidence: classification.confidence,
  }
}
