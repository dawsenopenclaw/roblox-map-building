/**
 * Build Planner — AI-powered game decomposition engine.
 *
 * Takes a freeform user prompt ("build me a tycoon game") and uses Claude
 * to produce a structured BuildPlan: typed tasks, dependency graph,
 * parallel execution waves, and time/token cost estimates.
 *
 * The planner itself is pure — it only calls Claude and returns data.
 * Execution is handled by build-executor.ts.
 */

import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { serverEnv } from '@/lib/env'
import { callAI } from './provider'

// ── Lazy Anthropic client (kept for optional custom-key path only) ────────────
// Primary AI path now uses callAI() → Gemini (primary) + Groq (fallback).

let _anthropic: Anthropic | null = null
function getClient(): Anthropic | null {
  if (process.env.ANTHROPIC_DISABLED === 'true') return null
  if (_anthropic) return _anthropic
  const key = serverEnv.ANTHROPIC_API_KEY
  if (!key) return null
  _anthropic = new Anthropic({ apiKey: key })
  return _anthropic
}

// ── Public types ──────────────────────────────────────────────────────────────

export type BuildTaskType =
  | 'terrain'
  | 'building'
  | 'prop'
  | 'npc'
  | 'script'
  | 'ui'
  | 'economy'
  | 'lighting'
  | 'audio'

export interface BuildTask {
  id: string
  type: BuildTaskType
  name: string
  prompt: string
  /** IDs of tasks that must complete before this one starts */
  dependencies: string[]
  /** Parallel execution group — all tasks in the same wave run concurrently */
  wave: number
  /** Estimated Claude/pipeline token spend for this task */
  estimatedTokens: number
  /** Estimated wall-clock seconds to complete */
  estimatedSeconds: number
  /** Optional parameters passed to Luau template generators */
  templateParams?: Record<string, unknown>
}

export interface BuildPlan {
  id: string
  title: string
  description: string
  gameType: string
  tasks: BuildTask[]
  totalWaves: number
  estimatedTokens: number
  estimatedMinutes: number
  createdAt: string
}

// ── Zod schemas for Claude's JSON output ─────────────────────────────────────

const buildTaskSchema = z.object({
  id: z.string().regex(/^[a-z0-9_-]+$/, 'IDs must be lowercase alphanumeric + _ -'),
  type: z.enum(['terrain', 'building', 'prop', 'npc', 'script', 'ui', 'economy', 'lighting', 'audio']),
  name: z.string().min(1).max(120),
  prompt: z.string().min(10).max(1500),
  dependencies: z.array(z.string()),
  wave: z.number().int().min(0),
  estimatedTokens: z.number().int().min(50).max(5000),
  estimatedSeconds: z.number().int().min(2).max(300),
  templateParams: z.record(z.unknown()).optional(),
})

const buildPlanOutputSchema = z.object({
  title: z.string().min(1).max(80),
  description: z.string().min(10).max(500),
  gameType: z.string().min(1).max(60),
  tasks: z.array(buildTaskSchema).min(3).max(50),
})

type BuildPlanOutput = z.infer<typeof buildPlanOutputSchema>

// ── Complexity detector ──────────────────────────────────────────────────────

/**
 * Detects how complex a build request is and returns a complexity tier.
 * This drives how aggressively the planner chunks structures into sub-tasks.
 *
 * - 'simple'  → 1 task per structure (tree, sword, barrel)
 * - 'medium'  → 2-3 sub-tasks (house with garden, shop with interior)
 * - 'complex' → 4-6 sub-tasks (castle, city, school, stadium)
 */
export type ComplexityTier = 'simple' | 'medium' | 'complex'

const COMPLEX_KEYWORDS = [
  'castle', 'city', 'town', 'mansion', 'school', 'hospital', 'factory',
  'stadium', 'mall', 'village', 'neighborhood', 'airport', 'harbor',
  'base', 'fortress', 'palace', 'cathedral', 'university', 'prison',
  'skyscraper', 'downtown', 'district', 'compound', 'resort', 'theme park',
  'amusement park', 'military base', 'space station', 'pirate ship',
  'shopping center', 'apartment complex', 'office complex',
]

const MEDIUM_KEYWORDS = [
  'house', 'shop', 'store', 'restaurant', 'cafe', 'church', 'temple',
  'barn', 'garage', 'library', 'tavern', 'inn', 'cottage', 'cabin',
  'tower', 'bridge', 'dock', 'pier', 'market', 'plaza', 'park',
  'garden', 'courtyard', 'warehouse', 'workshop', 'studio',
  'with interior', 'with rooms', 'with furniture', 'multi-story',
  'two story', 'three story', 'multi-floor', '2 story', '3 story',
]

export function detectComplexity(prompt: string): ComplexityTier {
  const lower = prompt.toLowerCase()

  // Check for explicit multi-structure requests
  const multiStructurePatterns = [
    /\b\d+\s*(buildings?|houses?|towers?|shops?|stores?)\b/,
    /\bseveral\s/,
    /\bmultiple\s/,
    /\bcity\s*block\b/,
    /\brow\s*of\b/,
    /\bstreet\s*with\b/,
    /\bneighborhood\b/,
  ]
  for (const pat of multiStructurePatterns) {
    if (pat.test(lower)) return 'complex'
  }

  // Check complex keywords
  for (const kw of COMPLEX_KEYWORDS) {
    if (lower.includes(kw)) return 'complex'
  }

  // Check medium keywords
  for (const kw of MEDIUM_KEYWORDS) {
    if (lower.includes(kw)) return 'medium'
  }

  // Check for "large" / "big" / "huge" / "massive" + any structure word
  if (/\b(large|big|huge|massive|giant|enormous|grand)\b/.test(lower)) {
    if (/\b(building|structure|house|tower|ship|boat|vehicle|tree|wall)\b/.test(lower)) {
      return 'medium'
    }
  }

  return 'simple'
}

/**
 * Returns a chunking instruction to inject into the planner prompt based on
 * detected complexity. For simple builds this returns an empty string.
 */
function getChunkingInstructions(complexity: ComplexityTier, prompt: string): string {
  if (complexity === 'simple') return ''

  const shared = `
CHUNKED BUILDING — CRITICAL INSTRUCTIONS:
- For complex structures, break into 3-6 sub-tasks. Each sub-task should be a self-contained build that references the same parent model.
- Never try to build more than 80 parts in a single task. Split into chunks.
- Each chunk MUST set templateParams.parentName to a shared root model name (e.g., "MyCastle" or "CityBlock1") so all chunks end up under one parent Model in Studio.
- Each chunk should use templateParams.chunkIndex (0, 1, 2, ...) so the executor can order them.
- Each chunk's prompt MUST specify a CFrame offset so parts don't overlap between chunks.
- Each chunk uses parentName to attach to the same root model.`

  if (complexity === 'medium') {
    return `${shared}

This is a MEDIUM complexity build. Break each major structure into 2-3 sub-tasks:
- Task A: The main shell — foundation, walls, roof, exterior details
- Task B: Interior — rooms, furniture, lighting
- Task C (if applicable): Surrounding area — garden, path, fence, props

Example for "build a house with garden":
  1. "House exterior — foundation, walls, roof, windows, door" (building, parentName: "House", chunkIndex: 0)
  2. "House interior — rooms, furniture, lighting" (building, parentName: "House", chunkIndex: 1)
  3. "Garden — fence, path, flowers, trees, bench" (prop, parentName: "House", chunkIndex: 2)`
  }

  // complex
  return `${shared}

This is a COMPLEX build. Break it into 4-6 self-contained sub-tasks:

Example for "build a large castle":
  1. "Castle foundation and outer walls — 80x60 stud base, 15-stud tall perimeter walls, main gate with portcullis" (building, parentName: "Castle", chunkIndex: 0)
  2. "Castle towers and battlements — 4 corner towers (12x12x25 studs each), crenellations along walls, arrow slits" (building, parentName: "Castle", chunkIndex: 1)
  3. "Castle interior — great hall (40x30), throne room, dining hall, stone floors, chandeliers" (building, parentName: "Castle", chunkIndex: 2)
  4. "Castle courtyard — cobblestone ground, well, training dummies, stable structure, hay bales" (building, parentName: "Castle", chunkIndex: 3)
  5. "Castle props — banners, torches, weapon racks, barrels, crates, suits of armor" (prop, parentName: "Castle", chunkIndex: 4)

Example for "build a modern city block":
  1. "City streets and sidewalks — road grid, crosswalks, curbs, lane markings" (terrain, parentName: "CityBlock", chunkIndex: 0)
  2. "Office tower — 3-story glass and steel building, 24x20 footprint, lobby interior" (building, parentName: "CityBlock", chunkIndex: 1)
  3. "Apartment building — 4-story brick building, 20x16 footprint, fire escapes" (building, parentName: "CityBlock", chunkIndex: 2)
  4. "Shops and storefronts — row of 3 connected shops, awnings, display windows" (building, parentName: "CityBlock", chunkIndex: 3)
  5. "Street props — lampposts, benches, trees, trash cans, mailbox, bus stop" (prop, parentName: "CityBlock", chunkIndex: 4)

For the user prompt "${prompt.slice(0, 200)}", generate 4-6 building/prop sub-tasks that together form the complete structure. Each sub-task is self-contained but references the same parentName.`
}

// ── Token cost estimate per task type ────────────────────────────────────────

const TOKEN_COST_BY_TYPE: Record<BuildTaskType, number> = {
  terrain:  800,
  building: 1500,
  prop:     600,
  npc:      700,
  script:   1200,
  ui:       900,
  economy:  1100,
  lighting: 400,
  audio:    300,
}

const SECONDS_BY_TYPE: Record<BuildTaskType, number> = {
  terrain:  25,
  building: 30,
  prop:     18,
  npc:      22,
  script:   35,
  ui:       28,
  economy:  32,
  lighting: 10,
  audio:    8,
}

// ── System prompt ─────────────────────────────────────────────────────────────

const PLANNER_SYSTEM_PROMPT = `You are an expert Roblox game architect and producer. Your job is to decompose a user's game idea into a detailed, executable build plan.

ROBLOX GAME DESIGN RULES:
- Character scale: 5 studs tall. All structures scale from this baseline.
- Door: 4w × 7h studs. Ceiling height: 12 studs min. Wall thickness: 0.5-1 studs.
- Materials: Cobblestone (castle), WoodPlanks (floors), Slate (roofs), Glass (windows), Metal (gates/fences), Neon (signage/effects), SmoothPlastic (modern), Granite (paths).
- Always Anchor static parts. Add PointLights to torches (Brightness=1.5, Range=16).
- Wrap all Studio mutations in ChangeHistoryService for undo support.
- Use Terrain:FillBlock for ground, Terrain:FillBall for organic terrain shapes.
- Scripts must be in ServerScriptService (server logic) or StarterPlayerScripts (client logic).
- Economy systems must be server-authoritative — never trust clients.
- UI goes in StarterGui with ScreenGui.ResetOnSpawn = false.

CRITICAL — TASK PROMPT DETAIL RULES:
When writing the "prompt" field for each task, you MUST include SPECIFIC architectural details. NEVER write vague prompts like "build a house" or "create a shop". Instead, specify:

For BUILDING tasks, the prompt MUST include:
- Exact dimensions (e.g., "24 studs wide, 20 studs deep, 2 floors")
- Style (e.g., "medieval stone", "modern glass", "victorian brick")
- Specific Color3.fromRGB values for walls, trim, and roof
- Required features: foundation, recessed windows with frames, door with frame, roof type (pitched/flat with parapet), corner trim, floor ledges between stories, interior floors, PointLights in windows
- Position: CFrame offset from origin so buildings don't overlap

For PROP tasks, the prompt MUST include:
- What the prop looks like (multiple Parts, not a single box)
- Dimensions in studs
- Material and Color3.fromRGB values
- Position relative to the building it belongs to
- Example: "A wooden market stall: 8x3x6 stud frame using WoodPlanks (Color3.fromRGB(139,90,43)), with a sloped canvas roof using Fabric (Color3.fromRGB(180,30,30)), counter slab in front, 2 support posts"

For TERRAIN tasks, the prompt MUST include:
- Map size in studs (e.g., "256x256")
- Multiple terrain layers: ground material, hills (positions + heights), paths/roads, water features, rock formations
- Biome type and specific materials to use

For NPC tasks, the prompt MUST describe:
- Visual appearance (body colors, clothing colors, accessories)
- Behavior type (patrol, idle, dialog, combat)
- Position in the world

TASK DECOMPOSITION RULES:
1. terrain tasks always go in wave 0 (they have no dependencies)
2. lighting tasks go in wave 0 (no dependencies, just Lighting service config)
3. building tasks depend on terrain (wave 1+)
4. prop tasks depend on at least one building task (wave 2+) — ALWAYS create separate prop tasks for interior furniture if a building has interiors
5. npc tasks depend on prop tasks being placed (wave 3+)
6. economy/script tasks can often run in parallel with building tasks (wave 1+)
7. ui tasks depend on economy/script (wave 2+)
8. audio tasks can run in wave 1 (no spatial dependencies)
9. Never create circular dependencies
10. For building tasks, set templateParams to include: style, withInterior (true for any building players enter), withWallDetail (always true), roomsPerFloor (2-4 for houses, 1 for shops, 0 for simple structures)
11. ALWAYS create at least one separate "prop" task per building for its interior furniture (tables, chairs, shelves, beds, etc.) — do NOT try to cram furniture into the building task

GAME TYPE BLUEPRINTS:

TYCOON: terrain(baseplate+terrain), building(factory/dropper/collectors x3-5), prop(machines/conveyors), economy(currency+dropper+upgrader+shop), script(server game loop+leaderboard), npc(optional), ui(hud+shop gui+upgrade panel), lighting(daytime industrial), audio(ambient factory sounds)

SIMULATOR: terrain(themed world), building(area1+area2+area3+hub), prop(collectibles+obstacles+decorations), economy(currency+multiplier+rebirth), script(click collecting+auto-collect+rebirth system), npc(merchant+tutorial), ui(hud+rebirth gui+inventory), lighting(bright cheerful), audio(collect sfx+ambient)

RPG: terrain(world map+dungeons), building(town+castle+dungeon1+dungeon2), prop(chests+npcs+obstacles), npc(questgivers+merchants+enemies), script(combat+inventory+quest tracker+saves), economy(gold+shop+equipment pricing), ui(health bar+inventory+quest log+dialog), lighting(epic dramatic), audio(battle music+ambient)

OBBY: terrain(void+platforms), building(checkpoint1+checkpoint2+checkpoint3+finish), prop(spinning obstacles+moving platforms+bouncy parts), script(checkpoint saving+timer+lives system), ui(timer+lives counter+completion screen), lighting(colorful fun), audio(level music)

ROLEPLAY: terrain(city map+interiors), building(houses+shops+school+park+police), prop(furniture+vehicles+decorations), npc(ambient pedestrians), script(job system+money+car spawn), economy(salary+shops+house prices), ui(phone gui+job hud+money display), lighting(realistic day-night cycle), audio(city ambience)

TOWER DEFENSE: terrain(path+base+enemy spawn), building(tower slots+base structure+path markers), prop(tower models+enemy models), script(wave spawner+tower placement+enemy pathfinding+lives), economy(gold+tower costs+upgrades), ui(wave counter+health bar+tower shop), lighting(strategic map lighting), audio(tower sfx+wave music)

OUTPUT FORMAT:
You must respond with ONLY a valid JSON object matching this exact structure. No markdown, no explanation, no code fences — just raw JSON:

{
  "title": "Short catchy name for the game",
  "description": "2-3 sentence description of what will be built",
  "gameType": "tycoon|simulator|rpg|obby|roleplay|tower_defense|custom",
  "tasks": [
    {
      "id": "unique_snake_case_id",
      "type": "terrain|building|prop|npc|script|ui|economy|lighting|audio",
      "name": "Human readable task name",
      "prompt": "Detailed Luau/Roblox Studio generation prompt for this specific task. Include exact dimensions, materials, colors (Color3.fromRGB values), structure names, and expected output.",
      "dependencies": ["id_of_task_1", "id_of_task_2"],
      "wave": 0,
      "estimatedTokens": 400,
      "estimatedSeconds": 25,
      "templateParams": { "key": "value" }
    }
  ]
}

Always produce 10–30 tasks for a full game. More complex games deserve more tasks. Ensure all dependency IDs reference real task IDs in your plan.`

// ── Wave assignment validator/fixer ──────────────────────────────────────────

/**
 * Validates the dependency graph is acyclic and recomputes wave numbers
 * using topological sort. Fixes any wave mismatches Claude produces.
 */
function computeWaves(tasks: BuildPlanOutput['tasks']): BuildPlanOutput['tasks'] {
  const idToTask = new Map(tasks.map((t) => [t.id, t]))
  const waveMap = new Map<string, number>()

  function resolveWave(taskId: string, visited = new Set<string>()): number {
    if (waveMap.has(taskId)) return waveMap.get(taskId)!
    if (visited.has(taskId)) {
      // Circular dependency — break by returning 0
      console.warn(`[build-planner] Circular dependency detected on task: ${taskId}`)
      return 0
    }
    visited.add(taskId)
    const task = idToTask.get(taskId)
    if (!task || task.dependencies.length === 0) {
      waveMap.set(taskId, 0)
      return 0
    }
    const maxDepWave = Math.max(
      ...task.dependencies.map((dep) => resolveWave(dep, new Set(visited)))
    )
    const wave = maxDepWave + 1
    waveMap.set(taskId, wave)
    return wave
  }

  for (const task of tasks) {
    resolveWave(task.id)
  }

  return tasks.map((t) => ({ ...t, wave: waveMap.get(t.id) ?? 0 }))
}

// ── ID generator ──────────────────────────────────────────────────────────────

function generatePlanId(): string {
  return `plan_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Decomposes a user's game prompt into a structured BuildPlan using Claude.
 *
 * @param userPrompt  Free-form description, e.g. "build me a sci-fi tycoon game"
 * @returns           Fully validated BuildPlan with wave-grouped tasks
 */
export async function generateBuildPlan(userPrompt: string): Promise<BuildPlan> {
  // Use Gemini (primary) → Groq (fallback). jsonMode asks Gemini for raw JSON.
  const rawText = await callAI(
    PLANNER_SYSTEM_PROMPT,
    [
      {
        role: 'user',
        content: `Generate a complete build plan for this Roblox game idea:\n\n"${userPrompt.slice(0, 1000)}"`,
      },
    ],
    {
      maxTokens: 8192,
      temperature: 0.3,
      jsonMode: true,
      useRAG: true,
      // Include 'dev' (game-design wisdom) and 'blender' (3D asset workflow)
      // so the planner has access to the full ingested tutorial corpus,
      // not just Roblox-specific chunks. Apr 16: video-ingest pipeline
      // fills all five categories from curated YouTube channels.
      ragCategories: ['pattern', 'building', 'service', 'dev', 'blender'],
    },
  )

  // Strip any accidental markdown fences free models might add
  const jsonText = rawText
    .replace(/^```(?:json)?\n?/m, '')
    .replace(/\n?```$/m, '')
    .trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch (err) {
    throw new Error(`[build-planner] AI returned invalid JSON: ${String(err)}\nRaw: ${jsonText.slice(0, 200)}`)
  }

  const validated = buildPlanOutputSchema.safeParse(parsed)
  if (!validated.success) {
    const issues = validated.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    throw new Error(`[build-planner] Build plan failed validation: ${issues}`)
  }

  // Recompute waves from actual dependency graph (fixes any Claude errors)
  const tasksWithCorrectWaves = computeWaves(validated.data.tasks)

  const totalWaves = Math.max(...tasksWithCorrectWaves.map((t) => t.wave)) + 1

  // Apply per-type defaults for tokens/seconds if Claude's estimates are off
  const tasks: BuildTask[] = tasksWithCorrectWaves.map((t) => ({
    ...t,
    estimatedTokens: Math.max(t.estimatedTokens, TOKEN_COST_BY_TYPE[t.type]),
    estimatedSeconds: Math.max(t.estimatedSeconds, SECONDS_BY_TYPE[t.type]),
  }))

  // Compute totals — waves run in parallel, so time = sum of slowest task per wave
  const waveMaxSeconds = new Map<number, number>()
  for (const task of tasks) {
    const current = waveMaxSeconds.get(task.wave) ?? 0
    waveMaxSeconds.set(task.wave, Math.max(current, task.estimatedSeconds))
  }
  const totalSeconds = Array.from(waveMaxSeconds.values()).reduce((a, b) => a + b, 0)
  const totalTokens = tasks.reduce((a, t) => a + t.estimatedTokens, 0)

  return {
    id: generatePlanId(),
    title: validated.data.title,
    description: validated.data.description,
    gameType: validated.data.gameType,
    tasks,
    totalWaves,
    estimatedTokens: totalTokens,
    estimatedMinutes: Math.ceil(totalSeconds / 60),
    createdAt: new Date().toISOString(),
  }
}
