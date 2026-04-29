/**
 * Full Game Orchestrator — production implementation.
 *
 * Multi-stage pipeline: Plan → Amplify → Theme → Mechanics → UI → Build
 * Uses CodeGraph intelligence for spatial layout, callAI for code generation,
 * and the 7 mechanic generators for game systems.
 */

import type {
  GameOrchestrationResult,
  GamePlan,
  GameMechanic,
  GameUIScreen,
  GameDevProduct,
  GameGamePass,
  GameNPC,
  MeshIntent,
  AudioIntent,
  OrchestratorTheme,
  ProgressCallback,
  MechanicType,
} from './types'
import { DEFAULT_THEME } from './types'

import { callAI } from '@/lib/ai/provider'
import { formatGraphPrompt, detectCategory } from '@/lib/eli/codegraph'

import { generateCurrencyMechanic } from '../mechanics/generators/currency'
import { generateInventoryMechanic } from '../mechanics/generators/inventory'
import { generateShopMechanic } from '../mechanics/generators/shop'
import { generateLeaderboardMechanic } from '../mechanics/generators/leaderboard'
import { generateDataStoreMechanic } from '../mechanics/generators/datastore'
import { generateCombatMechanic } from '../mechanics/generators/combat'
import { generateCollectionMechanic } from '../mechanics/generators/collection'

// ── Types ───────────────────────────────────────────────────────────────────

export interface GameSpec {
  plan: GamePlan
  theme?: OrchestratorTheme
  projectId?: string
  userId?: string
  onProgress?: ProgressCallback
}

export type BuildResult = GameOrchestrationResult

// ── Mechanic Generator Registry ─────────────────────────────────────────────

export const MECHANIC_GENERATORS = {
  currency: generateCurrencyMechanic,
  inventory: generateInventoryMechanic,
  shop: generateShopMechanic,
  leaderboard: generateLeaderboardMechanic,
  datastore: generateDataStoreMechanic,
  combat: generateCombatMechanic,
  collection: generateCollectionMechanic,
} as const

type KnownMechanicType = keyof typeof MECHANIC_GENERATORS

// ── Helpers ─────────────────────────────────────────────────────────────────

function progress(cb: ProgressCallback | undefined, stage: string, message: string, pct: number, detail?: Record<string, unknown>) {
  cb?.({ stage: stage as any, message, progress: Math.min(100, Math.max(0, Math.round(pct))), detail })
}

function countLines(code: string): number {
  return code.split('\n').length
}

/**
 * Call a single mechanic generator with params extracted from the plan.
 * Each generator has a different signature, so we dispatch by type.
 */
function invokeMechanicGenerator(
  mechType: MechanicType,
  params: Record<string, unknown> | undefined,
  name: string,
): GameMechanic | null {
  const p = params ?? {}

  switch (mechType) {
    case 'currency':
      return generateCurrencyMechanic((name || p.currencyName as string) ?? 'Coins')

    case 'inventory':
      return generateInventoryMechanic(
        (name || p.name as string) ?? 'PlayerInventory',
        { maxSlots: (p.maxSlots as number) ?? 40, defaultStackSize: (p.stackSize as number) ?? 64 },
      )

    case 'shop':
      return generateShopMechanic(
        (name || p.name as string) ?? 'MainShop',
        (p.items as any[]) ?? [],
        { currencyModule: p.currencyModule as string, inventoryModule: p.inventoryModule as string },
      )

    case 'leaderboard':
      return generateLeaderboardMechanic(
        (p.stat as string) ?? 'Coins',
        { top: (p.top as number) ?? 10 },
      )

    case 'datastore':
      return generateDataStoreMechanic(
        (p.schema as Record<string, unknown>) ?? { level: 1, xp: 0, lastLogin: 0, unlocks: {} },
        (name || p.name as string) ?? 'PlayerProfile',
      )

    case 'combat':
      return generateCombatMechanic((p.weapons as any[]) ?? [])

    case 'collection':
      return generateCollectionMechanic(
        (p.items as any[]) ?? [],
        { currencyModule: p.currencyModule as string, folder: p.folder as string },
      )

    default:
      // Unknown mechanic type — not in our registry yet
      return null
  }
}

// ── Stage 1: Amplify ────────────────────────────────────────────────────────

async function amplifyPlan(plan: GamePlan): Promise<string> {
  const codeGraphContext = formatGraphPrompt(plan.concept)
  const category = detectCategory(plan.concept)

  const systemPrompt = `You are a Roblox game design amplifier. Take a high-level game plan and expand it into a rich, detailed game design document. Include specific gameplay details, progression hooks, moment-to-moment fun loops, and visual identity.

${codeGraphContext}

Rules:
- Focus on what makes this game FUN for kids age 8-16
- Include specific numbers (damage values, prices, spawn rates)
- Describe the first 30 seconds of gameplay (the hook)
- Describe the core loop in concrete terms
- Keep it under 800 words — dense and actionable, not fluffy`

  const userMsg = `Amplify this game plan:

Genre: ${plan.genre}
Concept: ${plan.concept}
Core Loop: ${plan.coreLoop}
Progression: ${plan.progression}
Mechanics: ${plan.mechanics.map(m => m.name).join(', ')}
Player Flow: ${plan.playerFlow}
Estimated Playtime: ${plan.estimatedPlaytime}
${category ? `Detected category: ${category}` : ''}`

  return callAI(systemPrompt, [{ role: 'user', content: userMsg }], {
    maxTokens: 2048,
    temperature: 0.7,
  })
}

// ── Stage 2: Spatial Layout ─────────────────────────────────────────────────

interface SpatialResult {
  summary: string
  commands: Array<Record<string, unknown>>
  partCount: number
}

async function generateSpatialLayout(plan: GamePlan, amplifiedPrompt: string, theme: OrchestratorTheme): Promise<SpatialResult> {
  const codeGraphContext = formatGraphPrompt(plan.concept)

  const systemPrompt = `You are a Roblox spatial layout architect. Generate a JSON array of structured build commands that create the game's physical world.

${codeGraphContext}

Each command is an object with:
{
  "action": "CreatePart" | "CreateModel" | "SetProperty" | "CreateScript",
  "name": string,
  "parent": string (path like "Workspace/Map/Buildings"),
  "properties": { Size: [x,y,z], Position: [x,y,z], Material: string, Color: [r,g,b], ... },
  "children": [ ...nested commands ]
}

Rules:
- Generate 30-200 parts depending on complexity
- NEVER use SmoothPlastic — use Concrete, Wood, Brick, Metal, Neon, Granite, Marble, Sand
- Include proper lighting (ColorCorrection, Bloom, Atmosphere)
- Create a spawn area near 0,5,0
- Use realistic proportions (doors 3x7, walls 1x10, floors 0.5 thick)
- Group parts into Models (e.g. "SpawnArea", "MainBuilding", "Arena")
- Include terrain features and decorations
- Color palette: primary=${theme.palette.primary}, secondary=${theme.palette.secondary}, accent=${theme.palette.accent}

Return ONLY a valid JSON array of commands. No markdown, no explanation.`

  const userMsg = `Build the physical world for:

${amplifiedPrompt}

Genre: ${plan.genre}
Core Loop: ${plan.coreLoop}
NPCs needed at: ${plan.npcs.map(n => n.name + (n.position ? ` (${n.position.join(',')})` : '')).join(', ') || 'auto-place'}
UI screens: ${plan.ui.join(', ')}
Mechanic zones needed: ${plan.mechanics.map(m => m.name).join(', ')}`

  const raw = await callAI(systemPrompt, [{ role: 'user', content: userMsg }], {
    maxTokens: 8192,
    temperature: 0.4,
  })

  // Parse the JSON commands from the AI response
  let commands: Array<Record<string, unknown>> = []
  try {
    // Strip markdown fences if present
    const cleaned = raw.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '').trim()
    const parsed = JSON.parse(cleaned)
    commands = Array.isArray(parsed) ? parsed : [parsed]
  } catch {
    // If JSON parsing fails, wrap the raw output as a single script command
    console.error('[orchestrator] Failed to parse spatial layout JSON, using fallback')
    commands = [{
      action: 'CreateScript',
      name: 'MapBuilder',
      parent: 'ServerScriptService',
      properties: { Source: raw },
    }]
  }

  // Count parts recursively
  function countParts(cmds: Array<Record<string, unknown>>): number {
    let count = 0
    for (const cmd of cmds) {
      if (cmd.action === 'CreatePart' || cmd.action === 'CreateModel') count++
      if (Array.isArray(cmd.children)) count += countParts(cmd.children as Array<Record<string, unknown>>)
    }
    return count
  }

  const partCount = countParts(commands)

  return {
    summary: `Generated ${commands.length} top-level commands, ~${partCount} parts for ${plan.genre} game`,
    commands,
    partCount: Math.max(partCount, commands.length),
  }
}

// ── Stage 3: UI Screens ─────────────────────────────────────────────────────

async function generateUIScreens(plan: GamePlan, theme: OrchestratorTheme): Promise<GameUIScreen[]> {
  if (plan.ui.length === 0) return []

  const systemPrompt = `You are a Roblox UI engineer. Generate Luau code for ScreenGui UI screens.

Rules:
- Use UICorner, UIStroke, UIGradient, UIListLayout for polish
- Font: ${theme.font}
- Colors: primary=${theme.palette.primary}, accent=${theme.palette.accent}, bg=${theme.palette.background}, text=${theme.palette.text}
- NEVER use default gray — always use themed colors
- Each screen should be a complete ScreenGui with proper hierarchy
- Include open/close toggle logic via RemoteEvent or ProximityPrompt
- Use TweenService for smooth transitions
- Mobile-friendly (use Scale not Offset for sizing)

For each screen, return a JSON object:
{ "id": string, "name": string, "parent": "PlayerGui", "luauCode": "..." }

Return a JSON array of screen objects. No markdown fences.`

  const userMsg = `Generate these UI screens for a ${plan.genre} game:

${plan.ui.map((screen, i) => `${i + 1}. ${screen}`).join('\n')}

Game concept: ${plan.concept}
Mechanics present: ${plan.mechanics.map(m => m.name).join(', ')}`

  const raw = await callAI(systemPrompt, [{ role: 'user', content: userMsg }], {
    maxTokens: 6144,
    temperature: 0.3,
  })

  try {
    const cleaned = raw.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '').trim()
    const parsed = JSON.parse(cleaned)
    const screens: GameUIScreen[] = (Array.isArray(parsed) ? parsed : [parsed]).map((s: any, i: number) => ({
      id: s.id ?? `ui-screen-${i}`,
      name: s.name ?? plan.ui[i] ?? `Screen${i}`,
      parent: s.parent ?? 'PlayerGui',
      luauCode: s.luauCode ?? '',
    }))
    return screens.filter(s => s.luauCode.length > 0)
  } catch {
    console.error('[orchestrator] Failed to parse UI screens JSON')
    // Fallback: generate one placeholder screen per requested UI
    return plan.ui.map((screenName, i) => ({
      id: `ui-screen-${i}`,
      name: screenName,
      parent: 'PlayerGui',
      luauCode: `-- ${screenName} UI (generation failed, placeholder)\nlocal sg = Instance.new("ScreenGui")\nsg.Name = "${screenName}"\nsg.Parent = game.Players.LocalPlayer:WaitForChild("PlayerGui")\n`,
    }))
  }
}

// ── Stage 4: NPC Generation ─────────────────────────────────────────────────

function generateNPCs(plan: GamePlan): GameNPC[] {
  return plan.npcs.map(npc => ({
    name: npc.name,
    position: npc.position ?? [0, 5, 0],
    dialogue: npc.dialogue.length > 0 ? npc.dialogue : [`Hello! I'm ${npc.name}.`, `Welcome to our ${plan.genre} world!`],
  }))
}

// ── Stage 5: Monetization ───────────────────────────────────────────────────

async function generateMonetization(plan: GamePlan): Promise<{
  devProducts: GameDevProduct[]
  gamePasses: GameGamePass[]
}> {
  const devProducts: GameDevProduct[] = plan.monetization.devProducts.map(dp => ({
    name: dp.name,
    description: dp.description ?? `Purchase ${dp.name}`,
    price: dp.price,
    serverScript: `-- ${dp.name} DevProduct handler
local MarketplaceService = game:GetService("MarketplaceService")

MarketplaceService.ProcessReceipt = function(receiptInfo)
    local player = game.Players:GetPlayerByUserId(receiptInfo.PlayerId)
    if not player then return Enum.ProductPurchaseDecision.NotProcessedYet end
    -- Grant ${dp.name} to player
    print(("[DevProduct] %s purchased %s"):format(player.Name, "${dp.name}"))
    return Enum.ProductPurchaseDecision.PurchaseGranted
end`,
  }))

  const gamePasses: GameGamePass[] = plan.monetization.gamePasses.map(gp => ({
    name: gp.name,
    description: gp.description ?? `Unlock ${gp.name}`,
    price: gp.price,
    serverScript: `-- ${gp.name} GamePass handler
local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")

Players.PlayerAdded:Connect(function(player)
    -- Check if player owns ${gp.name}
    local success, owns = pcall(function()
        return MarketplaceService:UserOwnsGamePassAsync(player.UserId, 0) -- Replace 0 with real GamePass ID
    end)
    if success and owns then
        print(("[GamePass] %s owns %s"):format(player.Name, "${gp.name}"))
        -- Apply ${gp.name} benefits here
    end
end)`,
  }))

  return { devProducts, gamePasses }
}

// ── Stage 6: Mesh + Audio Intents ───────────────────────────────────────────

function extractMeshIntents(plan: GamePlan): MeshIntent[] {
  const intents: MeshIntent[] = []
  // Derive mesh needs from genre and concept
  const concept = plan.concept.toLowerCase()

  if (concept.includes('pet') || concept.includes('animal')) {
    intents.push({ description: 'Collectible pet model', placement: 'Workspace/Pets' })
  }
  if (concept.includes('weapon') || concept.includes('sword') || concept.includes('combat')) {
    intents.push({ description: 'Weapon mesh (sword/bow)', placement: 'ReplicatedStorage/Weapons' })
  }
  if (concept.includes('vehicle') || concept.includes('car') || concept.includes('racing')) {
    intents.push({ description: 'Vehicle mesh', placement: 'ReplicatedStorage/Vehicles' })
  }
  if (plan.npcs.length > 0) {
    intents.push({ description: 'NPC character mesh', placement: 'ReplicatedStorage/NPCs' })
  }

  return intents
}

function extractAudioIntents(plan: GamePlan): AudioIntent[] {
  const intents: AudioIntent[] = []
  const genre = plan.genre.toLowerCase()

  // Every game gets background music
  intents.push({ type: 'music', description: `${plan.genre} background music — loopable, moderate energy` })

  // Genre-specific SFX
  if (genre.includes('combat') || genre.includes('battle') || genre.includes('fighting')) {
    intents.push({ type: 'sfx', description: 'Hit/damage sound effect' })
    intents.push({ type: 'sfx', description: 'Victory fanfare' })
  }
  if (genre.includes('horror') || genre.includes('scary')) {
    intents.push({ type: 'sfx', description: 'Ambient creepy sounds' })
    intents.push({ type: 'music', description: 'Tension/suspense music' })
  }

  // Common SFX
  intents.push({ type: 'sfx', description: 'UI click sound' })
  intents.push({ type: 'sfx', description: 'Coin/reward pickup' })

  return intents
}

// ── Main Pipeline ───────────────────────────────────────────────────────────

export async function orchestrateGameBuild(spec: GameSpec): Promise<BuildResult> {
  const started = Date.now()
  const theme = spec.theme ?? DEFAULT_THEME
  const { plan, onProgress } = spec
  let creditsUsed = 0

  // ─── Stage 1: Planning ───────────────────────────────────────────
  progress(onProgress, 'planning', 'Analyzing game plan and detecting category...', 2)

  const category = detectCategory(plan.concept)
  progress(onProgress, 'planning', `Category detected: ${category ?? 'general'}. Preparing pipeline.`, 5)

  // ─── Stage 2: Amplify ────────────────────────────────────────────
  progress(onProgress, 'amplifying', 'Expanding game design with CodeGraph intelligence...', 8)

  let amplifiedPrompt: string
  try {
    amplifiedPrompt = await amplifyPlan(plan)
    creditsUsed += 1
  } catch (err) {
    console.error('[orchestrator] Amplify stage failed, using raw concept:', err)
    amplifiedPrompt = `${plan.concept}\n\nGenre: ${plan.genre}\nCore Loop: ${plan.coreLoop}\nProgression: ${plan.progression}`
  }

  progress(onProgress, 'amplifying', 'Game design amplified. Starting parallel generation...', 15)

  // ─── Stage 3: Parallel — Mechanics + Spatial + UI + NPCs ────────
  progress(onProgress, 'mechanics', `Generating ${plan.mechanics.length} game mechanics in parallel...`, 18)

  // Run mechanics generators in parallel — each one is sync but we wrap to catch errors
  const mechanicPromises = plan.mechanics.map(async (mechDef) => {
    try {
      const result = invokeMechanicGenerator(mechDef.type, mechDef.params, mechDef.name)
      if (result) return result

      // If no built-in generator, use AI to generate a custom mechanic
      const customMechanic = await generateCustomMechanic(mechDef, plan)
      creditsUsed += 1
      return customMechanic
    } catch (err) {
      console.error(`[orchestrator] Mechanic "${mechDef.name}" (${mechDef.type}) failed:`, err)
      return null
    }
  })

  // Run spatial layout, UI, and mechanics all in parallel
  const [mechanicResults, spatialResult, uiScreens, monetization] = await Promise.all([
    Promise.all(mechanicPromises),
    generateSpatialLayout(plan, amplifiedPrompt, theme)
      .then(r => { creditsUsed += 1; return r })
      .catch(err => {
        console.error('[orchestrator] Spatial layout failed:', err)
        return { summary: 'Spatial generation failed', commands: [], partCount: 0 } as SpatialResult
      }),
    generateUIScreens(plan, theme)
      .then(screens => { creditsUsed += 1; return screens })
      .catch(err => {
        console.error('[orchestrator] UI generation failed:', err)
        return [] as GameUIScreen[]
      }),
    generateMonetization(plan)
      .catch(err => {
        console.error('[orchestrator] Monetization generation failed:', err)
        return { devProducts: [] as GameDevProduct[], gamePasses: [] as GameGamePass[] }
      }),
  ])

  progress(onProgress, 'mechanics', `Mechanics generated: ${mechanicResults.filter(Boolean).length}/${plan.mechanics.length} succeeded.`, 50)

  // Filter out failed mechanics
  const mechanics: GameMechanic[] = mechanicResults.filter((m): m is GameMechanic => m !== null)

  // ─── Stage 4: Theming ────────────────────────────────────────────
  progress(onProgress, 'theming', `Applied theme: ${theme.name} (${theme.id})`, 55)

  // ─── Stage 5: NPCs + Intents ─────────────────────────────────────
  progress(onProgress, 'spatial', 'Generating NPCs, mesh intents, and audio intents...', 60)

  const npcs = generateNPCs(plan)
  const meshIntents = extractMeshIntents(plan)
  const audioIntents = extractAudioIntents(plan)

  progress(onProgress, 'spatial', `${spatialResult.summary}. ${npcs.length} NPCs placed.`, 70)

  // ─── Stage 6: Build — Final Assembly ─────────────────────────────
  progress(onProgress, 'build', 'Assembling final build output...', 75)

  // Count total script lines across all outputs
  let totalScriptLines = 0
  for (const m of mechanics) totalScriptLines += countLines(m.luauCode)
  for (const s of uiScreens) totalScriptLines += countLines(s.luauCode)
  for (const dp of monetization.devProducts) totalScriptLines += countLines(dp.serverScript)
  for (const gp of monetization.gamePasses) totalScriptLines += countLines(gp.serverScript)

  progress(onProgress, 'build', `Build complete: ${spatialResult.partCount} parts, ${totalScriptLines} script lines, ${mechanics.length} mechanics.`, 90)

  // ─── Stage 7: Finalize ───────────────────────────────────────────
  progress(onProgress, 'queueing', 'Queuing mesh and audio intents for async generation...', 95)

  const result: BuildResult = {
    amplifiedPrompt,
    themeId: theme.id,
    spatialPlanSummary: spatialResult.summary,
    structuredCommands: spatialResult.commands,
    mechanics,
    uiScreens,
    npcs,
    monetization,
    meshIntents,
    audioIntents,
    estimatedPlaytime: plan.estimatedPlaytime,
    totalPartCount: spatialResult.partCount,
    totalScriptLines,
    durationMs: Date.now() - started,
    creditsUsed,
    plan,
  }

  progress(onProgress, 'done', `Game build complete in ${((Date.now() - started) / 1000).toFixed(1)}s — ${mechanics.length} mechanics, ${uiScreens.length} UI screens, ${spatialResult.partCount} parts.`, 100)

  return result
}

// ── Custom Mechanic Generation (AI-powered fallback) ────────────────────────

async function generateCustomMechanic(
  mechDef: { type: MechanicType; name: string; params?: Record<string, unknown> },
  plan: GamePlan,
): Promise<GameMechanic> {
  const systemPrompt = `You are a Roblox Luau systems engineer. Generate a complete, production-ready server script for a game mechanic.

Rules:
- Use --!strict type annotations
- Use proper Roblox services (DataStoreService, Players, ReplicatedStorage, etc.)
- Include error handling with pcall
- Use RemoteEvents for client-server communication
- Add clear comments explaining each section
- The script must work standalone — no external dependencies except Roblox services
- Include initialization, player lifecycle hooks (PlayerAdded/Removing), and cleanup

Return ONLY the Luau code. No markdown fences, no explanation.`

  const userMsg = `Generate a "${mechDef.name}" mechanic (type: ${mechDef.type}) for a ${plan.genre} game.

Game concept: ${plan.concept}
Core loop: ${plan.coreLoop}
${mechDef.params ? `Parameters: ${JSON.stringify(mechDef.params)}` : ''}

This script should be placed at ServerScriptService/Mechanics/${mechDef.name.replace(/\s+/g, '')}.server.lua`

  const luauCode = await callAI(systemPrompt, [{ role: 'user', content: userMsg }], {
    maxTokens: 4096,
    temperature: 0.3,
  })

  // Strip any markdown fences the model might have added
  const cleanCode = luauCode
    .replace(/^```(?:lua|luau)?\s*\n?/gm, '')
    .replace(/\n?```\s*$/gm, '')
    .trim()

  const safeName = mechDef.name.replace(/\s+/g, '')

  return {
    id: `${mechDef.type}-${safeName.toLowerCase()}`,
    type: mechDef.type,
    name: mechDef.name,
    scriptPath: `ServerScriptService/Mechanics/${safeName}.server.lua`,
    luauCode: cleanCode,
    dependencies: [],
  }
}

export type { GameOrchestrationResult, GamePlan, OrchestratorTheme } from './types'
