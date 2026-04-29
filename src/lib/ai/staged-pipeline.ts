/**
 * Staged Build Pipeline v2 — BEAST MODE
 *
 * For simple builds: Plan → Build → Verify → Enhance → Ship (5 stages)
 * For full games: 10-system pipeline where each system gets its own AI call
 *   with full token budget, producing a COMPLETE working game:
 *
 *   1. WORLD    — Map, terrain, spawn points, zones, decorations
 *   2. GAMELOOP — Core loop, round system, state machine, win/lose
 *   3. ECONOMY  — Currency, shop, pricing, earning, spending
 *   4. COMBAT   — Damage, abilities, hitboxes, health, death/respawn
 *   5. UI/HUD   — Health bars, currency display, menus, shop UI
 *   6. DATA     — DataStore save/load, migration, session locking
 *   7. NPCS     — AI, pathfinding, spawners, dialogue, enemies
 *   8. EFFECTS  — Particles, sounds, camera, lighting, atmosphere
 *   9. PROGRESS — XP, levels, achievements, unlocks, rebirth
 *  10. MULTI    — Teams, matchmaking, leaderboards, chat, lobbies
 *
 * Each system generates a complete, standalone Script/LocalScript that
 * integrates with others via shared RemoteEvents in ReplicatedStorage.
 */

import 'server-only'
import { callAI as _callAI } from './provider'
import { enqueueAIRequest } from './request-queue'
import { verifyLuauCode } from './luau-verifier'

// Wrap callAI with queue to prevent flooding during multi-stage builds
import type { AIMessage, AICallOptions } from './provider'
const callAI = (system: string, messages: AIMessage[], opts?: AICallOptions) =>
  enqueueAIRequest(() => _callAI(system, messages, opts), { priority: 'high', label: 'staged-pipeline' })
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
  /** For full game pipeline: individual system scripts */
  systemScripts?: GameSystemScript[]
}

export interface StageResult {
  name: string
  success: boolean
  durationMs: number
  details?: string
}

/** Individual game system script output */
export interface GameSystemScript {
  systemName: string
  scriptType: 'ServerScript' | 'LocalScript' | 'ModuleScript'
  parent: string // e.g. "ServerScriptService", "StarterGui", "ReplicatedStorage"
  code: string
  lineCount: number
}

// ─── Game System Definitions ────────────────────────────────────────────────

interface GameSystemDef {
  id: string
  name: string
  scriptType: 'ServerScript' | 'LocalScript' | 'ModuleScript'
  parent: string
  prompt: string
  /** Systems this depends on (for context injection) */
  dependsOn: string[]
  /** Minimum lines expected */
  minLines: number
}

const GAME_SYSTEMS: GameSystemDef[] = [
  {
    id: 'world',
    name: 'World & Map Builder',
    scriptType: 'ServerScript',
    parent: 'ServerScriptService',
    dependsOn: [],
    minLines: 200,
    prompt: `Generate a COMPLETE world/map building script. This creates the physical game world.

MUST INCLUDE:
- Terrain generation (workspace.Terrain:FillBlock for ground, hills, water)
- Spawn area with SpawnLocation
- At least 3 distinct zones/areas with different themes and terrain
- Zone markers (invisible Parts with CollectionService tags for zone detection)
- Decorative props in each zone (trees, rocks, structures using Part/WedgePart/Cylinder)
- Lighting setup (Lighting.Technology = Future, Atmosphere, BloomEffect, ColorCorrectionEffect)
- Zone boundaries or paths connecting areas
- Environmental details (particle emitters for atmosphere, ambient sounds)

Use ChangeHistoryService wrapping. All parts anchored. Use P(), W(), Cyl(), Ball() helpers.
Minimum 100 parts across all zones. Make it visually impressive.`,
  },
  {
    id: 'gameloop',
    name: 'Core Game Loop',
    scriptType: 'ServerScript',
    parent: 'ServerScriptService',
    dependsOn: ['world'],
    minLines: 300,
    prompt: `Generate a COMPLETE core game loop server script. This manages the main game state.

MUST INCLUDE:
- Game state machine (Waiting → Countdown → Playing → Intermission → repeat)
- Round system with configurable round duration
- Player join/leave handling (add to active players, clean up on leave)
- Win/lose condition checking (runs every heartbeat during Playing state)
- Score tracking per player per round
- Round results announcement via RemoteEvent "GameState" to all clients
- Intermission with countdown timer
- Map/round selection (if applicable)
- Player spawn management (teleport to spawn on round start)
- Anti-idle kick (warn at 2min, kick at 3min of no input)

Create RemoteEvents in ReplicatedStorage: "GameState", "RoundUpdate", "PlayerScore", "GameNotification"
Create a Configuration folder in ServerStorage with IntValue children for settings.
Use task.spawn for the main loop. pcall everything. No wait(), use task.wait().`,
  },
  {
    id: 'economy',
    name: 'Economy System',
    scriptType: 'ServerScript',
    parent: 'ServerScriptService',
    dependsOn: ['gameloop'],
    minLines: 400,
    prompt: `Generate a COMPLETE economy/currency server script. Server-authoritative, no client trust.

MUST INCLUDE:
- Multiple currencies (primary: Coins, premium: Gems)
- In-memory wallet per player with DataStore persistence
- Earning methods: kill rewards, round completion bonus, passive income timer
- Shop system with item catalog (at least 15 items across categories)
- Purchase validation (server checks balance, deducts, grants item)
- RemoteFunction "GetBalance", "PurchaseItem", "GetShopItems"
- RemoteEvent "BalanceUpdate" (fires to client on any change)
- Leaderstats (IntValue for each currency under player.leaderstats)
- Price scaling (optional: items cost more after purchase, rebirth resets prices)
- Transaction logging (print to output for debugging)
- Anti-exploit: rate limiting (max 10 purchases/second), sanity checks on amounts
- Daily login bonus (track last login date, award scaling bonus)

All currency operations go through helper functions: addCurrency(), removeCurrency(), getBalance(), canAfford().
Use UpdateAsync for DataStore (not SetAsync) with retry on failure.`,
  },
  {
    id: 'combat',
    name: 'Combat & Interaction',
    scriptType: 'ServerScript',
    parent: 'ServerScriptService',
    dependsOn: ['economy', 'gameloop'],
    minLines: 400,
    prompt: `Generate a COMPLETE combat system server script. All damage server-authoritative.

MUST INCLUDE:
- Melee attack system: client fires RemoteEvent "Attack" with target info
- Server validates: distance check (max 8 studs), cooldown (0.5s), line of sight raycast
- Damage calculation: baseDamage * multiplier * critChance(10%, 2x)
- Health system: custom health attribute (not Humanoid.Health) for more control
- Death handling: drop loot, award kill reward, respawn after 5s
- Knockback on hit (BodyVelocity, 0.3s duration)
- Damage numbers: fire RemoteEvent "DamageNumber" to nearby clients
- Status effects: Burning (DoT 3s), Frozen (slow 50% 2s), Poisoned (DoT 5s)
- Combo system: hits within 0.8s window increase combo, 3-hit combo = bonus damage
- Invincibility frames: 0.5s after taking damage
- Hit validation: server does its own raycast/spatial check, never trust client hit detection
- Ability system: at least 3 abilities with cooldowns (Slash, Dash, AoE Slam)

Create RemoteEvents: "Attack", "UseAbility", "DamageNumber", "StatusEffect", "PlayerDied", "PlayerRespawned"
Create a "CombatConfig" ModuleScript in ReplicatedStorage with all damage/cooldown values.`,
  },
  {
    id: 'ui',
    name: 'UI & HUD',
    scriptType: 'LocalScript',
    parent: 'StarterGui',
    dependsOn: ['economy', 'combat', 'gameloop'],
    minLines: 500,
    prompt: `Generate a COMPLETE client-side UI/HUD LocalScript. Creates ALL game UI from code.

MUST INCLUDE:
- Main HUD (always visible):
  * Health bar (gradient red→green, smooth tween on change, flash on damage)
  * Currency display (coin icon + amount, gem icon + amount, tween on change)
  * Level/XP bar (progress bar with level number)
  * Minimap placeholder (Frame with map dots for nearby players)
  * Round timer (countdown, flashes red under 10s)
  * Kill feed (scrolling list, fades after 5s)

- Shop UI (toggle with button or key):
  * Category tabs (Weapons, Abilities, Cosmetics, Upgrades)
  * Item grid with icons, names, prices, owned indicators
  * Purchase button with confirmation popup
  * Balance display at top
  * Close button

- Inventory UI:
  * Grid of owned items with rarity borders (Common=gray, Rare=blue, Epic=purple, Legendary=gold)
  * Equip/unequip buttons
  * Item details panel on hover

- Settings menu:
  * Music volume slider
  * SFX volume slider
  * Graphics quality dropdown
  * Sensitivity slider
  * Save preferences to DataStore

- Game state overlays:
  * "Waiting for players" with player count
  * Countdown (3, 2, 1, GO! with scaling text)
  * Round results screen (winner, your stats, XP earned)
  * Death screen with respawn countdown

- Notification system:
  * Toast notifications that slide in from top-right, auto-dismiss after 4s
  * Achievement popup with icon and description
  * Level up celebration (particles + sound + screen flash)

All UI built with Instance.new("ScreenGui"/"Frame"/"TextLabel"/etc).
Use TweenService for ALL animations. Dark theme (30,30,35 backgrounds, white text).
UICorner on everything (8px radius). UIStroke for borders (1px, 40,40,45).
Connect to RemoteEvents from other systems: "BalanceUpdate", "DamageNumber", "GameState", "RoundUpdate".`,
  },
  {
    id: 'data',
    name: 'Data Persistence',
    scriptType: 'ServerScript',
    parent: 'ServerScriptService',
    dependsOn: ['economy', 'combat'],
    minLines: 300,
    prompt: `Generate a COMPLETE data persistence server script. Handles ALL player data saving.

MUST INCLUDE:
- PlayerDataStore with versioned key ("PlayerData_v3")
- Data schema/template with defaults:
  * coins, gems (currency)
  * level, xp, totalXP
  * kills, deaths, wins
  * inventory (array of item IDs)
  * equipped (dictionary of slot→itemID)
  * settings (dictionary)
  * dailyLoginDate, loginStreak
  * achievements (dictionary of id→boolean)
  * playTime (total seconds)
  * rebirthCount
- Session locking: store session GUID, check on load, force-save on leave
- Auto-save every 120 seconds (task.spawn loop)
- Save on PlayerRemoving + game:BindToClose
- UpdateAsync with retry (3 attempts, exponential backoff)
- Data migration: check data.version, upgrade old schemas automatically
- In-memory cache: playerData[userId] for fast access
- Public API module (ModuleScript in ReplicatedStorage):
  * getData(player), setData(player, key, value)
  * increment(player, key, amount)
  * getInventory(player), addToInventory(player, itemId)
- OrderedDataStore for global leaderboards (top 100, refresh every 60s)
- Error handling: if load fails, give player defaults + flag for re-save
- Telemetry: track save success/failure rates`,
  },
  {
    id: 'npcs',
    name: 'NPCs & Enemies',
    scriptType: 'ServerScript',
    parent: 'ServerScriptService',
    dependsOn: ['combat', 'world'],
    minLines: 350,
    prompt: `Generate a COMPLETE NPC/enemy AI server script. Handles spawning, behavior, combat AI.

MUST INCLUDE:
- Enemy types defined in a config table:
  * Goblin: HP=50, Speed=14, Damage=10, XP=15, Range=6
  * Skeleton: HP=80, Speed=12, Damage=15, XP=25, Range=8
  * Orc: HP=150, Speed=10, Damage=25, XP=50, Range=7
  * Dragon (Boss): HP=500, Speed=16, Damage=40, XP=200, Range=12
- Spawn system: spawn points (Parts with "EnemySpawn" tag), max per zone, respawn timer
- AI State Machine per enemy: Idle → Patrol → Detect → Chase → Attack → Retreat → Dead
- Pathfinding: PathfindingService with retry on blocked, recompute every 2s during chase
- Detection: sphere check (aggro range), line of sight raycast
- Attack patterns: melee swing (animation), ranged projectile (Part + BodyVelocity)
- Boss mechanics: phase transitions at 75%/50%/25% HP, different attacks per phase
- Loot table: each enemy type has weighted loot drops (Items, Currency, XP)
- Drop spawning: glowing Part with ProximityPrompt "Collect", auto-despawn 30s
- NPC shopkeepers: static NPCs with ProximityPrompt "Talk", fire RemoteEvent for dialog
- Quest givers: NPCs with "!" indicator, track quest progress, fire events on completion
- Death animation: ragdoll or fade out, destroy after 3s
- Performance: max 50 active enemies, furthest from any player despawn first`,
  },
  {
    id: 'effects',
    name: 'Effects & Polish',
    scriptType: 'LocalScript',
    parent: 'StarterGui',
    dependsOn: ['combat', 'world'],
    minLines: 250,
    prompt: `Generate a COMPLETE visual/audio effects LocalScript. Makes the game feel polished.

MUST INCLUDE:
- Camera effects:
  * Screen shake on damage (random offset, decay over 0.3s)
  * Screen shake on explosion (larger, slower decay)
  * Zoom on death (camera pulls back slowly)
  * FOV change on sprint (65→75 smoothly)
  * Camera bob while walking (subtle sine wave)

- Damage numbers:
  * Floating text at hit position, rises and fades over 1s
  * Color: white=normal, yellow=crit, red=self-damage
  * Scale: bigger for bigger hits
  * BillboardGui on invisible Part, tween up + fade

- Particle effects:
  * Hit impact: burst of 10 particles at contact point, 0.3s lifetime
  * Death: soul-like particles rising, 2s
  * Level up: ring of particles expanding outward + golden shower
  * Heal: green crosses rising
  * Dash: speed lines (Beam trail)

- Sound manager:
  * Background music playlist (crossfade between tracks)
  * SFX: hit, crit, death, purchase, levelup, notification
  * 3D spatial sound for nearby events
  * Volume control from settings

- Screen effects:
  * Damage vignette (red edges, fade 0.5s)
  * Heal flash (green tint, 0.3s)
  * Speed lines during dash
  * Low health heartbeat overlay (pulsing red vignette)

- Atmosphere:
  * Ambient particles (dust motes, fireflies at night)
  * Weather particles (rain, snow) synced with server weather state
  * Footstep sounds based on material (Grass=soft, Metal=clank, Wood=thud)

Connect to RemoteEvents: "DamageNumber", "StatusEffect", "PlayerDied", "GameState".
Use TweenService for all visual transitions. Cache Sound objects, don't create new ones.`,
  },
  {
    id: 'progression',
    name: 'Progression & Achievements',
    scriptType: 'ServerScript',
    parent: 'ServerScriptService',
    dependsOn: ['data', 'economy', 'combat'],
    minLines: 300,
    prompt: `Generate a COMPLETE progression/achievement server script.

MUST INCLUDE:
- XP system:
  * XP sources: kills, quest completion, round wins, daily login, exploration
  * Level curve: XP needed = 100 * level^1.5 (level 10 = 3162 XP, level 50 = 35355 XP)
  * Max level: 100
  * Level up rewards: coins per level, unlock new zones, unlock abilities

- Achievement system (at least 20 achievements):
  * First Blood (first kill)
  * Wealthy (earn 10K coins)
  * Explorer (visit all zones)
  * Survivor (survive 5 rounds)
  * Shopaholic (buy 10 items)
  * Untouchable (win round with no deaths)
  * Boss Slayer (defeat a boss)
  * Streak Master (10 kill streak)
  * Social Butterfly (play with 5 different players)
  * Dedicated (play 10 hours total)
  * + 10 more game-specific achievements

- Achievement tracking: listen to events, check conditions, award on completion
- Achievement rewards: coins, gems, titles, exclusive items
- Fire RemoteEvent "AchievementUnlocked" to client for popup

- Rebirth/Prestige system:
  * Cost: level 50 + 50K coins
  * Resets: level, coins (keeps gems, achievements, cosmetics)
  * Reward: permanent multiplier (+25% per rebirth, stacks)
  * Rebirth count on leaderboard
  * Visual indicator (name color, aura particle)

- Daily/Weekly challenges:
  * 3 daily challenges (kill 10 enemies, earn 500 coins, play 3 rounds)
  * 1 weekly challenge (harder, better reward)
  * Track progress, award on completion
  * Reset at midnight UTC / Monday midnight

- Battle Pass style tier system (optional):
  * 50 tiers, XP-based progression
  * Free rewards every 5 tiers
  * Premium rewards every tier (cosmetics, currency)`,
  },
  {
    id: 'multiplayer',
    name: 'Multiplayer & Social',
    scriptType: 'ServerScript',
    parent: 'ServerScriptService',
    dependsOn: ['gameloop', 'data'],
    minLines: 250,
    prompt: `Generate a COMPLETE multiplayer/social server script.

MUST INCLUDE:
- Team system:
  * Auto-balance teams on round start
  * Team colors and spawn points
  * Team score tracking
  * Team chat prefix

- Matchmaking:
  * Lobby system: players wait in lobby until enough players (min 2, max 16)
  * Ready-up system: RemoteEvent "ToggleReady"
  * Auto-start when 75% ready or all ready
  * Late join handling (add to smallest team)

- Leaderboard:
  * In-game leaderboard (SurfaceGui on Part in lobby)
  * Categories: Kills, Wins, Level, Coins
  * Update every 30 seconds from OrderedDataStore
  * Top 3 get crown/effects

- Chat system:
  * Chat commands: /team, /all, /whisper [player] [msg]
  * Chat filter (TextService:FilterStringAsync)
  * System messages (player join/leave, round events)

- Party/Group system:
  * Invite friends to party (RemoteEvent "PartyInvite")
  * Party members join same team
  * Party leader can start matchmaking

- Spectator mode:
  * On death, option to spectate other players
  * Camera follows spectated player
  * Cycle through alive players with Q/E
  * RemoteEvent "SpectatePlayer"

- Vote system:
  * Map voting between rounds (3 options)
  * Mode voting (FFA vs Teams)
  * Kick vote (majority required)

Create all RemoteEvents needed. Use Players.PlayerAdded/Removing for lifecycle.
Rate limit all remote calls (max 10/second per player).`,
  },
]

// ─── Stage 1: PLAN ─────────────────────────────────────────────────────────

const PLAN_PROMPT = `You are a Roblox build architect. Given a user request, output a JSON build plan.
Return ONLY valid JSON, no markdown fences.

JSON shape:
{
  "summary": "2-sentence description of what to build",
  "components": [{"name": "WallFront", "type": "Part", "material": "Concrete", "color": "160,160,160", "size": "20x10x0.5", "notes": "front wall with window cutout"}],
  "lightingPreset": "DAYTIME|SPOOKY|SUNSET|NEON_CITY|COZY",
  "interactiveElements": ["door with ProximityPrompt", "PointLights on lamps"],
  "estimatedParts": 30,
  "gameType": "tycoon|obby|simulator|rpg|horror|td|battle_royale|racing|fighting|survival|sandbox|sports|puzzle|social|null",
  "systemsNeeded": ["world","gameloop","economy","combat","ui","data","npcs","effects","progression","multiplayer"]
}

RULES:
- Minimum 15 components for any build, 25+ for buildings
- Include foundation, walls, roof, doors, windows, interior, lighting
- Each component is a separate physical part with specific material + color
- Materials: Wood, WoodPlanks, Brick, Concrete, Granite, Metal, Glass, Slate, Cobblestone, Fabric, etc. NEVER SmoothPlastic.
- Colors as R,G,B integers matching the material (brown for wood, gray for concrete, etc.)
- Include PointLight/SpotLight components for any light source
- Include interactive elements (ProximityPrompt, TweenService, SurfaceGui) where appropriate
- For FULL GAME requests: list ALL systems needed in systemsNeeded array
- For simple builds: systemsNeeded should be empty or just ["world"]`

async function stagePlan(prompt: string): Promise<{ plan: StagedBuildPlan & { gameType?: string; systemsNeeded?: string[] } | null; durationMs: number }> {
  const start = Date.now()
  try {
    const raw = await callAI(PLAN_PROMPT, [{ role: 'user', content: `Build request: "${prompt}"` }], {
      jsonMode: true,
      maxTokens: 4096,
      temperature: 0.3,
    })

    let jsonStr = raw.replace(/```json?\s*/gi, '').replace(/```/g, '').trim()
    const firstBrace = jsonStr.indexOf('{')
    const lastBrace = jsonStr.lastIndexOf('}')
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      jsonStr = jsonStr.slice(firstBrace, lastBrace + 1)
    }
    const parsed = JSON.parse(jsonStr)
    return {
      plan: {
        summary: parsed.summary || prompt,
        components: Array.isArray(parsed.components) ? parsed.components : [],
        lightingPreset: parsed.lightingPreset || 'DAYTIME',
        interactiveElements: Array.isArray(parsed.interactiveElements) ? parsed.interactiveElements : [],
        estimatedParts: parsed.estimatedParts || 25,
        gameType: parsed.gameType || null,
        systemsNeeded: Array.isArray(parsed.systemsNeeded) ? parsed.systemsNeeded : [],
      },
      durationMs: Date.now() - start,
    }
  } catch (err) {
    console.warn('[StagedPipeline/Plan] Failed:', err instanceof Error ? err.message : err)
    return { plan: null, durationMs: Date.now() - start }
  }
}

// ─── Stage 2: BUILD (for simple builds) ───────────────────────────────────

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

  const codeLower = code.toLowerCase()
  const missingComponents = plan.components.filter(c => {
    const words = c.name.toLowerCase().split(/[\s_-]+/).filter(w => w.length >= 3)
    if (words.length === 0) return false
    const found = words.filter(w => codeLower.includes(w)).length
    return found < Math.ceil(words.length / 2)
  })

  if (errors.length === 0 && missingComponents.length === 0) {
    return { code, durationMs: Date.now() - start }
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
    return { code, durationMs: Date.now() - start }
  } catch (err) {
    console.error('[StagedPipeline/ENHANCE] Enhancement stage failed, using original code:', err instanceof Error ? err.message : err)
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

  const verification = await verifyLuauCode(code)
  const finalCode = verification.fixedCode || code

  let qualityScore: QualityScore | null = null
  try {
    qualityScore = await scoreOutput({
      prompt,
      response: finalCode,
      mode: 'build',
    })
  } catch (err) {
    console.error('[StagedPipeline/SHIP] Quality scoring failed:', err instanceof Error ? err.message : err)
  }

  return {
    finalCode,
    score: Math.max(verification.score, qualityScore?.total || 0),
    qualityScore,
    durationMs: Date.now() - start,
  }
}

// ─── Full Game System Generator ─────────────────────────────────────────────

const SYSTEM_HEADER = `-- ═══════════════════════════════════════════════════
-- Generated by ForjeGames BEAST MODE Pipeline
-- ═══════════════════════════════════════════════════`

function buildSystemPrompt(
  system: GameSystemDef,
  gameType: string,
  userPrompt: string,
  previousSystems: GameSystemScript[],
): string {
  // Build context from previously generated systems
  const contextLines: string[] = []
  for (const prev of previousSystems) {
    // Extract RemoteEvent names and key function signatures from previous code
    const remotes = (prev.code.match(/Instance\.new\("Remote(?:Event|Function)"\)\s*[\s\S]*?\.Name\s*=\s*"([^"]+)"/g) || [])
      .map(m => m.match(/\.Name\s*=\s*"([^"]+)"/)?.[1])
      .filter(Boolean)
    const functions = (prev.code.match(/(?:local )?function (\w+)\(/g) || [])
      .map(m => m.match(/function (\w+)\(/)?.[1])
      .filter(Boolean)
      .slice(0, 10)

    contextLines.push(`-- ${prev.systemName} (${prev.scriptType} in ${prev.parent}):`)
    if (remotes.length > 0) contextLines.push(`--   RemoteEvents: ${remotes.join(', ')}`)
    if (functions.length > 0) contextLines.push(`--   Functions: ${functions.join(', ')}`)
  }

  const previousContext = contextLines.length > 0
    ? `\n\nPREVIOUSLY GENERATED SYSTEMS (reference these, do NOT redefine their RemoteEvents):\n${contextLines.join('\n')}\n`
    : ''

  return `You are a Roblox game systems expert. Generate a COMPLETE, PRODUCTION-READY ${system.scriptType} for a ${gameType} game.

USER REQUEST: "${userPrompt}"

SYSTEM: ${system.name}
SCRIPT TYPE: ${system.scriptType}
PARENT: ${system.parent}
${previousContext}

${system.prompt}

CRITICAL RULES:
- Output ONLY Luau code in a \`\`\`lua block. No explanation before or after.
- Start with: ${SYSTEM_HEADER}
- Include "-- [${system.parent}/${system.name.replace(/\s+/g, '')}]" as the first comment after header
- Use pcall for ALL DataStore/network operations
- Use task.wait() never wait(), task.spawn() never spawn()
- Use game:GetService() for all services
- Target MINIMUM ${system.minLines} lines of actual code (not comments)
- Make it COMPLETE — a user should be able to paste this into Studio and it works
- Reference RemoteEvents created by previous systems, don't recreate them
- If creating new RemoteEvents, create them in ReplicatedStorage with clear names
- Add thorough error handling and edge case coverage
- Use type annotations where helpful: function foo(player: Player, amount: number)
- End with print("[${system.id}] System loaded successfully")`
}

async function generateGameSystem(
  system: GameSystemDef,
  gameType: string,
  userPrompt: string,
  previousSystems: GameSystemScript[],
  codePrompt: string,
): Promise<GameSystemScript | null> {
  const prompt = buildSystemPrompt(system, gameType, userPrompt, previousSystems)

  try {
    const raw = await callAI(codePrompt, [{ role: 'user', content: prompt }], {
      maxTokens: 32768,
      temperature: 0.15,
      codeMode: true,
    })

    // Extract code
    const luaMatch = raw.match(/```lua\s*([\s\S]*?)```/)
    let code = luaMatch?.[1]?.trim()

    // Fallback: check for truncated block
    if (!code) {
      const truncated = raw.match(/```lua\s*([\s\S]+)$/)
      if (truncated?.[1]?.includes('GetService')) {
        code = truncated[1].trim()
      }
    }

    if (!code || code.length < 100) {
      console.warn(`[FullGamePipeline] System ${system.id} generated insufficient code (${code?.length || 0} chars)`)
      return null
    }

    // Auto-fix common issues
    const verification = await verifyLuauCode(code)
    const fixedCode = verification.fixedCode || code

    const lineCount = fixedCode.split('\n').length

    return {
      systemName: system.name,
      scriptType: system.scriptType,
      parent: system.parent,
      code: fixedCode,
      lineCount,
    }
  } catch (err) {
    console.warn(`[FullGamePipeline] System ${system.id} failed:`, err instanceof Error ? err.message : err)
    return null
  }
}

// ─── Full Game Pipeline Orchestrator ────────────────────────────────────────

async function runFullGamePipeline(
  prompt: string,
  codePrompt: string,
  systemsNeeded: string[],
  gameType: string,
): Promise<{
  systemScripts: GameSystemScript[]
  combinedCode: string
  stages: StageResult[]
  totalLines: number
}> {
  const stages: StageResult[] = []
  const systemScripts: GameSystemScript[] = []

  // Filter to only the systems needed for this game type
  const systemsToGenerate = systemsNeeded.length > 0
    ? GAME_SYSTEMS.filter(s => systemsNeeded.includes(s.id))
    : GAME_SYSTEMS // Generate ALL systems if none specified

  console.log(`[FullGamePipeline] Generating ${systemsToGenerate.length} systems for ${gameType} game`)

  // Generate systems sequentially (each depends on previous for context)
  for (const system of systemsToGenerate) {
    const start = Date.now()
    console.log(`[FullGamePipeline] Generating: ${system.name}...`)

    const script = await generateGameSystem(system, gameType, prompt, systemScripts, codePrompt)

    if (script) {
      systemScripts.push(script)
      stages.push({
        name: `system:${system.id}`,
        success: true,
        durationMs: Date.now() - start,
        details: `${script.lineCount} lines, ${script.scriptType} in ${script.parent}`,
      })
      console.log(`[FullGamePipeline] ✓ ${system.name}: ${script.lineCount} lines`)
    } else {
      stages.push({
        name: `system:${system.id}`,
        success: false,
        durationMs: Date.now() - start,
        details: 'Generation failed',
      })
      console.warn(`[FullGamePipeline] ✗ ${system.name}: FAILED`)
    }
  }

  // Combine all scripts into one mega-script that creates Script instances
  const totalLines = systemScripts.reduce((sum, s) => sum + s.lineCount, 0)
  const combinedCode = buildCombinedInstaller(systemScripts, gameType, prompt)

  return { systemScripts, combinedCode, stages, totalLines }
}

/**
 * Builds a single installer script that creates all game system scripts
 * in the correct locations in the Explorer tree. This is what gets sent
 * to Studio — it creates Script/LocalScript instances with .Source set
 * to the generated code.
 */
function buildCombinedInstaller(scripts: GameSystemScript[], gameType: string, prompt: string): string {
  const scriptBlocks = scripts.map(s => {
    // Escape the code for embedding in a Lua string
    const escaped = s.code
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '')
    // Use [=[ ]=] long string delimiters instead to avoid escape issues
    const safeCode = s.code.replace(/\]=\]/g, ']\\]=]')

    return `
  -- ═══ ${s.systemName} (${s.scriptType} → ${s.parent}) ═══
  do
    local parent = game:GetService("${s.parent}")
    local scriptName = "Forje_${s.systemName.replace(/[^a-zA-Z0-9]/g, '')}"

    -- Remove old version if exists
    local old = parent:FindFirstChild(scriptName)
    if old then old:Destroy() end

    local script = Instance.new("${s.scriptType === 'LocalScript' ? 'LocalScript' : s.scriptType === 'ModuleScript' ? 'ModuleScript' : 'Script'}")
    script.Name = scriptName
    script.Source = [=[
${s.code}
]=]
    script.Parent = parent
    print("[ForjeInstaller] Created " .. scriptName .. " in ${s.parent}")
  end
`
  }).join('\n')

  return `-- ═══════════════════════════════════════════════════════════════
-- ForjeGames FULL GAME INSTALLER — ${gameType.toUpperCase()}
-- "${prompt.slice(0, 80)}"
-- Generated ${scripts.length} game systems, ${scripts.reduce((s, sc) => s + sc.lineCount, 0)} total lines
-- ═══════════════════════════════════════════════════════════════

local CH = game:GetService("ChangeHistoryService")
local rid = CH:TryBeginRecording("ForjeAI Full Game: ${gameType}")

local success, err = pcall(function()
  -- Create shared RemoteEvents folder
  local RS = game:GetService("ReplicatedStorage")
  local remotes = RS:FindFirstChild("ForjeRemotes")
  if not remotes then
    remotes = Instance.new("Folder")
    remotes.Name = "ForjeRemotes"
    remotes.Parent = RS
  end

  -- Create shared modules folder
  local modules = RS:FindFirstChild("ForjeModules")
  if not modules then
    modules = Instance.new("Folder")
    modules.Name = "ForjeModules"
    modules.Parent = RS
  end

${scriptBlocks}

  print("═══════════════════════════════════════════════════")
  print("ForjeGames ${gameType.toUpperCase()} — ${scripts.length} systems installed!")
  print("Systems: ${scripts.map(s => s.systemName).join(', ')}")
  print("Total: ${scripts.reduce((s, sc) => s + sc.lineCount, 0)} lines of game code")
  print("═══════════════════════════════════════════════════")
end)

if not success then
  warn("[ForjeInstaller] Error: " .. tostring(err))
end

if rid then CH:FinishRecording(rid, Enum.FinishRecordingOperation.Commit) end
`
}

// ─── Detect if request is a full game ───────────────────────────────────────

function isFullGameRequest(prompt: string, intent?: string): boolean {
  if (intent === 'fullgame') return true
  const lower = prompt.toLowerCase()
  return /\b(full game|complete game|make me a .+ game|build me a .+ game|create a .+ game|entire game|whole game|game from scratch)\b/.test(lower)
}

/** Detect which systems the user's request needs */
function detectNeededSystems(prompt: string, gameType: string): string[] {
  const lower = prompt.toLowerCase()

  // All full games need these core systems
  const needed = new Set(['world', 'gameloop', 'ui', 'data'])

  // Game-type specific systems
  const typeMap: Record<string, string[]> = {
    tycoon: ['economy', 'progression'],
    obby: ['progression'],
    simulator: ['economy', 'progression', 'npcs'],
    rpg: ['combat', 'economy', 'npcs', 'effects', 'progression'],
    horror: ['npcs', 'effects'],
    td: ['combat', 'economy', 'npcs', 'effects', 'progression'],
    tower_defense: ['combat', 'economy', 'npcs', 'effects', 'progression'],
    battle_royale: ['combat', 'effects', 'multiplayer'],
    racing: ['effects', 'progression', 'multiplayer'],
    fighting: ['combat', 'effects', 'progression', 'multiplayer'],
    survival: ['combat', 'economy', 'npcs', 'effects', 'progression'],
    sandbox: ['economy', 'effects'],
    sports: ['effects', 'progression', 'multiplayer'],
    puzzle: ['progression', 'effects'],
    social: ['economy', 'effects'],
  }

  for (const sys of typeMap[gameType] || []) {
    needed.add(sys)
  }

  // Keyword-based detection
  if (/\b(combat|fight|damage|weapon|sword|gun|pvp|attack)\b/.test(lower)) needed.add('combat')
  if (/\b(shop|currency|coins?|buy|sell|economy|trade|money)\b/.test(lower)) needed.add('economy')
  if (/\b(npc|enemy|enemies|monster|mob|boss|creature)\b/.test(lower)) needed.add('npcs')
  if (/\b(effect|particle|camera|sound|music|visual|polish)\b/.test(lower)) needed.add('effects')
  if (/\b(level|xp|experience|achievement|unlock|progress|rebirth|prestige)\b/.test(lower)) needed.add('progression')
  if (/\b(team|multiplayer|matchmak|lobby|pvp|versus|coop|co-op)\b/.test(lower)) needed.add('multiplayer')

  return Array.from(needed)
}

// ─── Main Pipeline (public API) ─────────────────────────────────────────────

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
    details: plan ? `${plan.components.length} components, ${plan.estimatedParts} est. parts, game=${plan.gameType || 'none'}` : 'Failed',
  })

  if (!plan || plan.components.length < 5) {
    return {
      code: null,
      plan: null,
      conversationText: '',
      score: 0,
      stages,
      totalLatencyMs: Date.now() - pipelineStart,
    }
  }

  // ── FULL GAME PATH: 10-system pipeline ──
  const fullGame = isFullGameRequest(prompt) || (plan.systemsNeeded && plan.systemsNeeded.length >= 3)
  const gameType = plan.gameType || 'adventure'

  if (fullGame) {
    const neededSystems = plan.systemsNeeded?.length
      ? plan.systemsNeeded
      : detectNeededSystems(prompt, gameType)

    console.log(`[StagedPipeline] FULL GAME MODE: ${gameType}, systems: ${neededSystems.join(', ')}`)

    const gameResult = await runFullGamePipeline(prompt, codePrompt, neededSystems, gameType)

    stages.push(...gameResult.stages)

    const successCount = gameResult.systemScripts.length
    const totalSystems = neededSystems.length

    // Final verify on combined code
    const verifyStart = Date.now()
    // Skip full verify on the installer (it's just creating scripts), verify individual systems instead
    stages.push({
      name: 'verify',
      success: successCount >= Math.ceil(totalSystems * 0.6),
      durationMs: Date.now() - verifyStart,
      details: `${successCount}/${totalSystems} systems generated, ${gameResult.totalLines} total lines`,
    })

    // Record to ELI
    const category = detectCategory(prompt)
    void recordToEli({
      prompt,
      score: Math.round((successCount / totalSystems) * 100),
      model: 'staged-pipeline-fullgame',
      buildType: 'script',
      category,
      partCount: 0,
      passed: successCount >= Math.ceil(totalSystems * 0.6),
      retryCount: totalSystems - successCount,
    }).catch(() => {})

    return {
      code: gameResult.combinedCode,
      plan,
      conversationText: `Building a complete ${gameType} game with ${successCount} systems (${gameResult.totalLines} lines of code). Systems: ${gameResult.systemScripts.map(s => s.systemName).join(', ')}.`,
      score: Math.round((successCount / totalSystems) * 100),
      stages,
      totalLatencyMs: Date.now() - pipelineStart,
      systemScripts: gameResult.systemScripts,
    }
  }

  // ── SIMPLE BUILD PATH: Plan → Build → Verify → Enhance → Ship ──

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
