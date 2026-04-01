/**
 * Agent Training Engine — skill levels, practice scenarios, and few-shot example storage.
 *
 * Design rules:
 *  - Pure data + logic module: no API calls, no side-effects at import time
 *  - Skill levels persist in-process; back with Redis/Postgres in production
 *  - Practice scenarios map directly to agent IDs in registry.ts
 *  - bestOutputs acts as a few-shot library injected into the system prompt
 *  - All skill mutations are fire-and-forget safe (no throws)
 */

import { getAllAgents, getAgent } from './registry'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TrainingExample {
  prompt: string
  output: string
  score: number          // 0–100, hand-scored or auto-scored via scoreLuauOutput
  tags: string[]         // e.g. ["forest", "terrain", "biome"]
  addedAt: Date
}

export interface AgentSkill {
  agentId: string
  skill: string          // e.g. "castle_building", "terrain_hills", "npc_dialogue"
  level: number          // 0–100
  practiceCount: number
  bestOutputs: TrainingExample[]   // capped at 5, sorted by score desc
  commonMistakes: string[]         // patterns to warn the LLM to avoid
  improvedPrompts: string[]        // system prompt additions learned from practice
  lastPracticedAt: Date | null
}

export interface PracticeScenario {
  agentId: string
  skill: string
  prompt: string
  idealOutputKey: string   // key into IDEAL_OUTPUTS map
  scoringRubric: ScoringRubric
  tags: string[]
}

export interface ScoringRubric {
  mustContain: string[]    // strings/patterns the output must include to pass
  mustNotContain: string[] // strings that trigger a score penalty
  bonusPatterns: string[]  // patterns worth extra score points
  weightings: {
    syntax: number         // 0–1 fraction of overall score
    completeness: number
    performance: number
    bestPractices: number
  }
}

// ─── In-process skill store ───────────────────────────────────────────────────

const _skillStore = new Map<string, AgentSkill>()  // key: `${agentId}::${skill}`

function skillKey(agentId: string, skill: string): string {
  return `${agentId}::${skill}`
}

// ─── Skill CRUD ───────────────────────────────────────────────────────────────

export function getSkill(agentId: string, skill: string): AgentSkill | null {
  return _skillStore.get(skillKey(agentId, skill)) ?? null
}

export function getAllSkillsForAgent(agentId: string): AgentSkill[] {
  return [..._skillStore.values()].filter((s) => s.agentId === agentId)
}

/**
 * Returns the average skill level across all skills for an agent.
 * Returns 0 if the agent has no skills tracked yet.
 */
export function getAgentOverallLevel(agentId: string): number {
  const skills = getAllSkillsForAgent(agentId)
  if (skills.length === 0) return 0
  return Math.round(skills.reduce((acc, s) => acc + s.level, 0) / skills.length)
}

/**
 * Records a practice result and updates the skill level.
 * Level increases by: +3 if score >= 90, +2 if >= 75, +1 if >= 50, −1 if < 30.
 * Level is clamped 0–100.
 */
export function recordPracticeResult(
  agentId: string,
  skill: string,
  example: Omit<TrainingExample, 'addedAt'>
): void {
  try {
    const key = skillKey(agentId, skill)
    const existing = _skillStore.get(key) ?? createDefaultSkill(agentId, skill)

    // Determine level delta
    let delta = 0
    if (example.score >= 90) delta = 3
    else if (example.score >= 75) delta = 2
    else if (example.score >= 50) delta = 1
    else if (example.score < 30) delta = -1

    // Update best outputs — keep top 5 by score
    const allOutputs: TrainingExample[] = [
      ...existing.bestOutputs,
      { ...example, addedAt: new Date() },
    ]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)

    _skillStore.set(key, {
      ...existing,
      level: Math.min(100, Math.max(0, existing.level + delta)),
      practiceCount: existing.practiceCount + 1,
      bestOutputs: allOutputs,
      lastPracticedAt: new Date(),
    })
  } catch {
    // Never throw from training analytics
  }
}

/**
 * Adds a common mistake pattern to a skill — used to warn the LLM.
 */
export function addCommonMistake(agentId: string, skill: string, mistake: string): void {
  try {
    const key = skillKey(agentId, skill)
    const existing = _skillStore.get(key) ?? createDefaultSkill(agentId, skill)
    if (!existing.commonMistakes.includes(mistake)) {
      existing.commonMistakes = [...existing.commonMistakes, mistake].slice(0, 20)
      _skillStore.set(key, existing)
    }
  } catch {
    // Never throw
  }
}

/**
 * Adds a system prompt improvement learned from practice data.
 */
export function addImprovedPrompt(agentId: string, skill: string, promptAddition: string): void {
  try {
    const key = skillKey(agentId, skill)
    const existing = _skillStore.get(key) ?? createDefaultSkill(agentId, skill)
    if (!existing.improvedPrompts.includes(promptAddition)) {
      existing.improvedPrompts = [...existing.improvedPrompts, promptAddition].slice(0, 10)
      _skillStore.set(key, existing)
    }
  } catch {
    // Never throw
  }
}

function createDefaultSkill(agentId: string, skill: string): AgentSkill {
  return {
    agentId,
    skill,
    level: 0,
    practiceCount: 0,
    bestOutputs: [],
    commonMistakes: [],
    improvedPrompts: [],
    lastPracticedAt: null,
  }
}

// ─── Few-shot prompt injection ────────────────────────────────────────────────

/**
 * Builds a few-shot preamble from the top 3 best outputs for a skill.
 * Inject this into the system prompt to boost output quality.
 */
export function buildFewShotPreamble(agentId: string, skill: string): string {
  const skillData = getSkill(agentId, skill)
  if (!skillData || skillData.bestOutputs.length === 0) return ''

  const examples = skillData.bestOutputs.slice(0, 3)
  const lines: string[] = [
    `## Learned examples for skill: ${skill} (agent level ${skillData.level}/100)`,
    '',
    ...examples.flatMap((ex, i) => [
      `### Example ${i + 1} (score ${ex.score}/100)`,
      `Prompt: ${ex.prompt}`,
      '```luau',
      ex.output,
      '```',
      '',
    ]),
  ]

  if (skillData.commonMistakes.length > 0) {
    lines.push('## Common mistakes to avoid:')
    skillData.commonMistakes.forEach((m) => lines.push(`- ${m}`))
    lines.push('')
  }

  if (skillData.improvedPrompts.length > 0) {
    lines.push('## Learned improvements:')
    skillData.improvedPrompts.forEach((p) => lines.push(`- ${p}`))
    lines.push('')
  }

  return lines.join('\n')
}

// ─── Seed: initialize all skills from registry ────────────────────────────────

/**
 * Seeds the skill store with default entries for every agent + their practice scenarios.
 * Call once at startup (idempotent — skips already-initialized skills).
 */
export function seedSkillStore(): void {
  for (const scenario of PRACTICE_SCENARIOS) {
    const key = skillKey(scenario.agentId, scenario.skill)
    if (!_skillStore.has(key)) {
      _skillStore.set(key, createDefaultSkill(scenario.agentId, scenario.skill))
    }
  }
}

// ─── Practice Scenario Catalog ────────────────────────────────────────────────

export const PRACTICE_SCENARIOS: PracticeScenario[] = [

  // ── terrain-gen (10 biomes) ──────────────────────────────────────────────

  {
    agentId: 'terrain-gen', skill: 'biome_forest',
    prompt: 'Generate a dense forest biome with rolling hills, tall trees, and a small pond.',
    idealOutputKey: 'terrain_forest',
    tags: ['forest', 'biome', 'trees', 'water'],
    scoringRubric: {
      mustContain: ['FillBlock', 'FillBall', 'Enum.Material.Grass', 'Enum.Material.LeafyGrass', 'Wood'],
      mustNotContain: ['wait()', 'spawn()', 'game.Workspace'],
      bonusPatterns: ['math.random', 'for i =', 'Anchored = true'],
      weightings: { syntax: 0.3, completeness: 0.3, performance: 0.2, bestPractices: 0.2 },
    },
  },
  {
    agentId: 'terrain-gen', skill: 'biome_desert',
    prompt: 'Generate an arid desert biome with sand dunes, rocky outcrops, and a dry riverbed.',
    idealOutputKey: 'terrain_desert',
    tags: ['desert', 'biome', 'sand', 'dunes'],
    scoringRubric: {
      mustContain: ['FillBlock', 'FillBall', 'Sand', 'Rock', 'SandRed'],
      mustNotContain: ['wait()', 'spawn()'],
      bonusPatterns: ['math.random', 'CFrame.new', 'Anchored = true'],
      weightings: { syntax: 0.3, completeness: 0.3, performance: 0.2, bestPractices: 0.2 },
    },
  },
  {
    agentId: 'terrain-gen', skill: 'biome_arctic',
    prompt: 'Generate an arctic tundra biome with snow-covered plains, ice sheets, and frozen rivers.',
    idealOutputKey: 'terrain_arctic',
    tags: ['arctic', 'snow', 'ice', 'tundra'],
    scoringRubric: {
      mustContain: ['FillBlock', 'Snow', 'Glacier', 'Ice'],
      mustNotContain: ['wait()', 'spawn()'],
      bonusPatterns: ['math.random', 'Anchored = true'],
      weightings: { syntax: 0.3, completeness: 0.3, performance: 0.2, bestPractices: 0.2 },
    },
  },
  {
    agentId: 'terrain-gen', skill: 'biome_volcanic',
    prompt: 'Generate a volcanic biome with lava flows, obsidian rock, ash plains, and a central caldera.',
    idealOutputKey: 'terrain_volcanic',
    tags: ['volcanic', 'lava', 'obsidian', 'ash'],
    scoringRubric: {
      mustContain: ['FillBlock', 'Basalt', 'CrackedLava', 'Neon'],
      mustNotContain: ['wait()', 'spawn()'],
      bonusPatterns: ['math.random', 'Anchored = true'],
      weightings: { syntax: 0.3, completeness: 0.3, performance: 0.2, bestPractices: 0.2 },
    },
  },
  {
    agentId: 'terrain-gen', skill: 'biome_ocean',
    prompt: 'Generate an ocean floor biome with underwater terrain, coral formations, and sandy seabed.',
    idealOutputKey: 'terrain_ocean',
    tags: ['ocean', 'water', 'coral', 'seabed'],
    scoringRubric: {
      mustContain: ['FillBlock', 'Sand', 'Water', 'Sandstone'],
      mustNotContain: ['wait()', 'spawn()'],
      bonusPatterns: ['math.random', 'Anchored = true'],
      weightings: { syntax: 0.3, completeness: 0.3, performance: 0.2, bestPractices: 0.2 },
    },
  },
  {
    agentId: 'terrain-gen', skill: 'biome_swamp',
    prompt: 'Generate a swamp biome with muddy terrain, shallow water pools, twisted trees, and fog.',
    idealOutputKey: 'terrain_swamp',
    tags: ['swamp', 'mud', 'water', 'trees'],
    scoringRubric: {
      mustContain: ['FillBlock', 'Mud', 'Water', 'LeafyGrass'],
      mustNotContain: ['wait()', 'spawn()'],
      bonusPatterns: ['math.random', 'Anchored = true'],
      weightings: { syntax: 0.3, completeness: 0.3, performance: 0.2, bestPractices: 0.2 },
    },
  },
  {
    agentId: 'terrain-gen', skill: 'biome_mountains',
    prompt: 'Generate a mountain range biome with jagged peaks, cliff faces, snow caps, and alpine meadows.',
    idealOutputKey: 'terrain_mountains',
    tags: ['mountains', 'peaks', 'snow', 'cliffs'],
    scoringRubric: {
      mustContain: ['FillBlock', 'FillBall', 'Rock', 'Snow', 'Grass'],
      mustNotContain: ['wait()', 'spawn()'],
      bonusPatterns: ['math.random', 'CFrame.Angles', 'Anchored = true'],
      weightings: { syntax: 0.3, completeness: 0.3, performance: 0.2, bestPractices: 0.2 },
    },
  },
  {
    agentId: 'terrain-gen', skill: 'biome_plains',
    prompt: 'Generate a grassy plains biome with gentle rolling hills, wildflowers, and scattered rocks.',
    idealOutputKey: 'terrain_plains',
    tags: ['plains', 'grass', 'flowers', 'flat'],
    scoringRubric: {
      mustContain: ['FillBlock', 'Grass', 'LeafyGrass'],
      mustNotContain: ['wait()', 'spawn()'],
      bonusPatterns: ['math.random', 'Anchored = true'],
      weightings: { syntax: 0.3, completeness: 0.3, performance: 0.2, bestPractices: 0.2 },
    },
  },
  {
    agentId: 'terrain-gen', skill: 'biome_jungle',
    prompt: 'Generate a tropical jungle biome with dense canopy, rivers, waterfalls, and vines.',
    idealOutputKey: 'terrain_jungle',
    tags: ['jungle', 'tropical', 'rivers', 'canopy'],
    scoringRubric: {
      mustContain: ['FillBlock', 'LeafyGrass', 'Grass', 'Water'],
      mustNotContain: ['wait()', 'spawn()'],
      bonusPatterns: ['math.random', 'Anchored = true'],
      weightings: { syntax: 0.3, completeness: 0.3, performance: 0.2, bestPractices: 0.2 },
    },
  },
  {
    agentId: 'terrain-gen', skill: 'biome_cave',
    prompt: 'Generate an underground cave biome with stalactites, stalagmites, underground rivers, and crystal formations.',
    idealOutputKey: 'terrain_cave',
    tags: ['cave', 'underground', 'stalactites', 'crystals'],
    scoringRubric: {
      mustContain: ['FillBlock', 'FillBall', 'Rock', 'Limestone', 'CFrame'],
      mustNotContain: ['wait()', 'spawn()'],
      bonusPatterns: ['math.random', 'Anchored = true', 'Neon'],
      weightings: { syntax: 0.3, completeness: 0.3, performance: 0.2, bestPractices: 0.2 },
    },
  },

  // ── script-writer (20 scripts) ───────────────────────────────────────────

  {
    agentId: 'script-writer', skill: 'datastore_save_load',
    prompt: 'Write a DataStore save/load system using ProfileStore pattern with pcall error handling.',
    idealOutputKey: 'script_datastore',
    tags: ['datastore', 'save', 'load', 'pcall'],
    scoringRubric: {
      mustContain: ['DataStoreService', 'pcall', 'task.wait', 'GetAsync', 'SetAsync'],
      mustNotContain: ['wait()', 'spawn()', 'game.Players.LocalPlayer'],
      bonusPatterns: ['UpdateAsync', 'retry', 'table.clone'],
      weightings: { syntax: 0.25, completeness: 0.35, performance: 0.2, bestPractices: 0.2 },
    },
  },
  {
    agentId: 'script-writer', skill: 'leaderboard_system',
    prompt: 'Write a leaderboard system using OrderedDataStore for top 10 players by score.',
    idealOutputKey: 'script_leaderboard',
    tags: ['leaderboard', 'orderedDataStore', 'top10'],
    scoringRubric: {
      mustContain: ['OrderedDataStore', 'GetSortedAsync', 'pcall', 'task.wait'],
      mustNotContain: ['wait()', 'spawn()'],
      bonusPatterns: ['Pages', 'GetCurrentPage', 'task.spawn'],
      weightings: { syntax: 0.25, completeness: 0.35, performance: 0.2, bestPractices: 0.2 },
    },
  },
  {
    agentId: 'script-writer', skill: 'shop_purchase_system',
    prompt: 'Write a server-authoritative shop/purchase system with Developer Products and Robux purchases.',
    idealOutputKey: 'script_shop',
    tags: ['shop', 'purchase', 'developer product', 'robux'],
    scoringRubric: {
      mustContain: ['MarketplaceService', 'ProcessReceipt', 'pcall', 'PurchaseGranted'],
      mustNotContain: ['wait()', 'spawn()', 'FireClient'],
      bonusPatterns: ['ReceiptInfo', 'PlayerProductOwnership', 'task.spawn'],
      weightings: { syntax: 0.25, completeness: 0.35, performance: 0.2, bestPractices: 0.2 },
    },
  },
  {
    agentId: 'script-writer', skill: 'damage_health_system',
    prompt: 'Write a server-authoritative damage and health system with Humanoid, damage events, and death handling.',
    idealOutputKey: 'script_damage',
    tags: ['damage', 'health', 'humanoid', 'combat'],
    scoringRubric: {
      mustContain: ['Humanoid', 'TakeDamage', 'RemoteEvent', 'FireServer'],
      mustNotContain: ['wait()', 'spawn()', 'LocalPlayer.Character.Humanoid.Health'],
      bonusPatterns: ['pcall', 'Died:Connect', 'task.delay'],
      weightings: { syntax: 0.25, completeness: 0.35, performance: 0.2, bestPractices: 0.2 },
    },
  },
  {
    agentId: 'script-writer', skill: 'sprint_stamina_system',
    prompt: 'Write a sprint/stamina system with client prediction and server validation.',
    idealOutputKey: 'script_sprint',
    tags: ['sprint', 'stamina', 'movement', 'client'],
    scoringRubric: {
      mustContain: ['UserInputService', 'Humanoid', 'WalkSpeed', 'task.wait'],
      mustNotContain: ['wait()', 'spawn()'],
      bonusPatterns: ['RunService', 'Heartbeat', 'task.spawn'],
      weightings: { syntax: 0.25, completeness: 0.35, performance: 0.2, bestPractices: 0.2 },
    },
  },
  {
    agentId: 'script-writer', skill: 'inventory_system',
    prompt: 'Write a modular inventory system with add/remove/stack item functions and DataStore persistence.',
    idealOutputKey: 'script_inventory',
    tags: ['inventory', 'items', 'datastore', 'module'],
    scoringRubric: {
      mustContain: ['ModuleScript', 'pcall', 'DataStoreService', 'table'],
      mustNotContain: ['wait()', 'spawn()'],
      bonusPatterns: ['ipairs', 'table.remove', 'task.spawn'],
      weightings: { syntax: 0.25, completeness: 0.35, performance: 0.2, bestPractices: 0.2 },
    },
  },
  {
    agentId: 'script-writer', skill: 'quest_system',
    prompt: 'Write a quest system with objectives, progress tracking, completion rewards, and UI events.',
    idealOutputKey: 'script_quest',
    tags: ['quest', 'objective', 'reward', 'progress'],
    scoringRubric: {
      mustContain: ['RemoteEvent', 'table', 'pcall', 'task.wait'],
      mustNotContain: ['wait()', 'spawn()'],
      bonusPatterns: ['FireClient', 'BindableEvent', 'task.spawn'],
      weightings: { syntax: 0.25, completeness: 0.35, performance: 0.2, bestPractices: 0.2 },
    },
  },
  {
    agentId: 'script-writer', skill: 'pet_follow_system',
    prompt: 'Write a pet follow system where a Part follows the player with smooth lerp movement.',
    idealOutputKey: 'script_pet_follow',
    tags: ['pet', 'follow', 'lerp', 'movement'],
    scoringRubric: {
      mustContain: ['RunService', 'Heartbeat', 'CFrame', 'Lerp'],
      mustNotContain: ['wait()', 'spawn()', 'BodyPosition'],
      bonusPatterns: ['task.spawn', 'math.clamp', 'Vector3.new'],
      weightings: { syntax: 0.25, completeness: 0.35, performance: 0.2, bestPractices: 0.2 },
    },
  },
  {
    agentId: 'script-writer', skill: 'tycoon_dropper',
    prompt: 'Write a tycoon dropper/collector system that spawns parts, moves them, and collects currency on touch.',
    idealOutputKey: 'script_tycoon',
    tags: ['tycoon', 'dropper', 'collector', 'currency'],
    scoringRubric: {
      mustContain: ['Instance.new', 'Touched', 'Debris', 'task.wait'],
      mustNotContain: ['wait()', 'spawn()'],
      bonusPatterns: ['pcall', 'BodyVelocity', 'task.delay'],
      weightings: { syntax: 0.25, completeness: 0.35, performance: 0.2, bestPractices: 0.2 },
    },
  },
  {
    agentId: 'script-writer', skill: 'obby_checkpoint',
    prompt: 'Write an obby checkpoint system that saves the last reached stage and respawns players there.',
    idealOutputKey: 'script_checkpoint',
    tags: ['obby', 'checkpoint', 'respawn', 'stage'],
    scoringRubric: {
      mustContain: ['Touched', 'CharacterAdded', 'CFrame', 'Humanoid'],
      mustNotContain: ['wait()', 'spawn()'],
      bonusPatterns: ['pcall', 'task.wait', 'DataStoreService'],
      weightings: { syntax: 0.25, completeness: 0.35, performance: 0.2, bestPractices: 0.2 },
    },
  },
  {
    agentId: 'script-writer', skill: 'vehicle_seat_system',
    prompt: 'Write a VehicleSeat system with enter/exit detection and speed control.',
    idealOutputKey: 'script_vehicle',
    tags: ['vehicle', 'seat', 'enter', 'exit'],
    scoringRubric: {
      mustContain: ['VehicleSeat', 'Occupant', 'BodyVelocity', 'task.wait'],
      mustNotContain: ['wait()', 'spawn()'],
      bonusPatterns: ['pcall', 'Changed:Connect', 'task.spawn'],
      weightings: { syntax: 0.25, completeness: 0.35, performance: 0.2, bestPractices: 0.2 },
    },
  },
  {
    agentId: 'script-writer', skill: 'tool_equip_system',
    prompt: 'Write a tool equip/unequip system with cooldown tracking and animation.',
    idealOutputKey: 'script_tool',
    tags: ['tool', 'equip', 'cooldown', 'animation'],
    scoringRubric: {
      mustContain: ['Tool', 'Equipped', 'Unequipped', 'Activated'],
      mustNotContain: ['wait()', 'spawn()'],
      bonusPatterns: ['AnimationTrack', 'task.wait', 'pcall'],
      weightings: { syntax: 0.25, completeness: 0.35, performance: 0.2, bestPractices: 0.2 },
    },
  },
  {
    agentId: 'script-writer', skill: 'chat_commands',
    prompt: 'Write a chat command system that listens for /commands and executes server-side actions.',
    idealOutputKey: 'script_chat_commands',
    tags: ['chat', 'commands', 'server', 'moderation'],
    scoringRubric: {
      mustContain: ['Players', 'Chatted', 'string.lower', 'string.split'],
      mustNotContain: ['wait()', 'spawn()', 'FireClient("admin"'],
      bonusPatterns: ['pcall', 'task.spawn', 'table'],
      weightings: { syntax: 0.25, completeness: 0.35, performance: 0.2, bestPractices: 0.2 },
    },
  },
  {
    agentId: 'script-writer', skill: 'admin_commands',
    prompt: 'Write an admin command system with permission levels, kick, ban, and teleport commands.',
    idealOutputKey: 'script_admin',
    tags: ['admin', 'kick', 'ban', 'teleport'],
    scoringRubric: {
      mustContain: ['Players', 'Chatted', 'Kick', 'table'],
      mustNotContain: ['wait()', 'spawn()', 'game.Players.LocalPlayer'],
      bonusPatterns: ['pcall', 'task.spawn', 'string.find'],
      weightings: { syntax: 0.25, completeness: 0.35, performance: 0.2, bestPractices: 0.2 },
    },
  },
  {
    agentId: 'script-writer', skill: 'teleport_system',
    prompt: 'Write a multi-place TeleportService system with party teleport and loading screens.',
    idealOutputKey: 'script_teleport',
    tags: ['teleport', 'TeleportService', 'party', 'loading'],
    scoringRubric: {
      mustContain: ['TeleportService', 'TeleportAsync', 'pcall', 'task.wait'],
      mustNotContain: ['wait()', 'spawn()'],
      bonusPatterns: ['TeleportOptions', 'SetTeleportGui', 'task.spawn'],
      weightings: { syntax: 0.25, completeness: 0.35, performance: 0.2, bestPractices: 0.2 },
    },
  },
  {
    agentId: 'script-writer', skill: 'trading_system',
    prompt: 'Write a server-authoritative item trading system with offer/accept/decline states.',
    idealOutputKey: 'script_trade',
    tags: ['trade', 'server', 'offer', 'accept'],
    scoringRubric: {
      mustContain: ['RemoteEvent', 'table', 'pcall', 'FireClient'],
      mustNotContain: ['wait()', 'spawn()', 'LocalPlayer'],
      bonusPatterns: ['task.spawn', 'task.delay', 'assert'],
      weightings: { syntax: 0.25, completeness: 0.35, performance: 0.2, bestPractices: 0.2 },
    },
  },
  {
    agentId: 'script-writer', skill: 'daily_rewards',
    prompt: 'Write a daily reward system with a 7-day streak calendar and DataStore tracking.',
    idealOutputKey: 'script_daily_reward',
    tags: ['daily', 'reward', 'streak', 'calendar'],
    scoringRubric: {
      mustContain: ['DataStoreService', 'pcall', 'os.time', 'task.wait'],
      mustNotContain: ['wait()', 'spawn()'],
      bonusPatterns: ['table', 'FireClient', 'task.spawn'],
      weightings: { syntax: 0.25, completeness: 0.35, performance: 0.2, bestPractices: 0.2 },
    },
  },
  {
    agentId: 'script-writer', skill: 'loot_drop_system',
    prompt: 'Write a loot drop system with weighted rarity tables (Common/Rare/Epic/Legendary).',
    idealOutputKey: 'script_loot',
    tags: ['loot', 'rarity', 'drop', 'weighted'],
    scoringRubric: {
      mustContain: ['math.random', 'table', 'Instance.new', 'task.delay'],
      mustNotContain: ['wait()', 'spawn()'],
      bonusPatterns: ['Debris', 'pcall', 'task.spawn'],
      weightings: { syntax: 0.25, completeness: 0.35, performance: 0.2, bestPractices: 0.2 },
    },
  },
  {
    agentId: 'script-writer', skill: 'animation_controller',
    prompt: 'Write an animation controller that handles idle, walk, run, jump, and attack animations.',
    idealOutputKey: 'script_animation',
    tags: ['animation', 'idle', 'walk', 'run'],
    scoringRubric: {
      mustContain: ['Animator', 'AnimationTrack', 'LoadAnimation', 'Play'],
      mustNotContain: ['wait()', 'spawn()'],
      bonusPatterns: ['AdjustSpeed', 'task.wait', 'Stopped:Wait'],
      weightings: { syntax: 0.25, completeness: 0.35, performance: 0.2, bestPractices: 0.2 },
    },
  },
  {
    agentId: 'script-writer', skill: 'sound_manager',
    prompt: 'Write a sound manager module with play/stop/fade functions and spatial audio support.',
    idealOutputKey: 'script_sound_manager',
    tags: ['sound', 'audio', 'fade', 'spatial'],
    scoringRubric: {
      mustContain: ['Sound', 'Volume', 'TweenService', 'Play'],
      mustNotContain: ['wait()', 'spawn()'],
      bonusPatterns: ['task.spawn', 'pcall', 'TweenInfo'],
      weightings: { syntax: 0.25, completeness: 0.35, performance: 0.2, bestPractices: 0.2 },
    },
  },

  // ── ui-designer (10 screens) ─────────────────────────────────────────────

  {
    agentId: 'ui-designer', skill: 'main_menu',
    prompt: 'Build a main menu ScreenGui with Play, Shop, Settings, and Credits buttons.',
    idealOutputKey: 'ui_main_menu',
    tags: ['menu', 'buttons', 'screenGui', 'main'],
    scoringRubric: {
      mustContain: ['ScreenGui', 'Frame', 'TextButton', 'UDim2', 'TweenService'],
      mustNotContain: ['wait()', 'spawn()'],
      bonusPatterns: ['UICorner', 'UIStroke', 'MouseEnter', 'task.spawn'],
      weightings: { syntax: 0.25, completeness: 0.35, performance: 0.2, bestPractices: 0.2 },
    },
  },
  {
    agentId: 'ui-designer', skill: 'shop_ui',
    prompt: 'Build a shop ScreenGui with item cards, price labels, and a buy button that fires a RemoteEvent.',
    idealOutputKey: 'ui_shop',
    tags: ['shop', 'items', 'buy', 'remoteEvent'],
    scoringRubric: {
      mustContain: ['ScreenGui', 'ScrollingFrame', 'TextButton', 'RemoteEvent', 'UDim2'],
      mustNotContain: ['wait()', 'spawn()'],
      bonusPatterns: ['UIGridLayout', 'UICorner', 'TweenService', 'task.spawn'],
      weightings: { syntax: 0.25, completeness: 0.35, performance: 0.2, bestPractices: 0.2 },
    },
  },
  {
    agentId: 'ui-designer', skill: 'inventory_ui',
    prompt: 'Build an inventory ScreenGui with a scrollable grid of item slots and an item detail panel.',
    idealOutputKey: 'ui_inventory',
    tags: ['inventory', 'grid', 'slots', 'items'],
    scoringRubric: {
      mustContain: ['ScreenGui', 'ScrollingFrame', 'UIGridLayout', 'ImageButton', 'UDim2'],
      mustNotContain: ['wait()', 'spawn()'],
      bonusPatterns: ['UICorner', 'TweenService', 'task.spawn'],
      weightings: { syntax: 0.25, completeness: 0.35, performance: 0.2, bestPractices: 0.2 },
    },
  },
  {
    agentId: 'ui-designer', skill: 'health_bar',
    prompt: 'Build a health bar HUD element that updates in real-time with TweenService animations.',
    idealOutputKey: 'ui_health_bar',
    tags: ['health', 'hud', 'tween', 'bar'],
    scoringRubric: {
      mustContain: ['ScreenGui', 'Frame', 'TweenService', 'Humanoid', 'HealthChanged'],
      mustNotContain: ['wait()', 'spawn()'],
      bonusPatterns: ['TweenInfo', 'Color3', 'task.spawn'],
      weightings: { syntax: 0.25, completeness: 0.35, performance: 0.2, bestPractices: 0.2 },
    },
  },
  {
    agentId: 'ui-designer', skill: 'settings_ui',
    prompt: 'Build a settings ScreenGui with toggle switches for Music, SFX, and Graphics quality.',
    idealOutputKey: 'ui_settings',
    tags: ['settings', 'toggles', 'music', 'graphics'],
    scoringRubric: {
      mustContain: ['ScreenGui', 'Frame', 'TextButton', 'TweenService', 'UDim2'],
      mustNotContain: ['wait()', 'spawn()'],
      bonusPatterns: ['UICorner', 'task.spawn', 'RemoteEvent'],
      weightings: { syntax: 0.25, completeness: 0.35, performance: 0.2, bestPractices: 0.2 },
    },
  },
  {
    agentId: 'ui-designer', skill: 'minimap_ui',
    prompt: 'Build a minimap HUD element using a ViewportFrame that updates the camera position.',
    idealOutputKey: 'ui_minimap',
    tags: ['minimap', 'viewport', 'camera', 'hud'],
    scoringRubric: {
      mustContain: ['ViewportFrame', 'Camera', 'RunService', 'Heartbeat'],
      mustNotContain: ['wait()', 'spawn()'],
      bonusPatterns: ['task.spawn', 'CFrame', 'RenderStepped'],
      weightings: { syntax: 0.25, completeness: 0.35, performance: 0.2, bestPractices: 0.2 },
    },
  },
  {
    agentId: 'ui-designer', skill: 'dialogue_box',
    prompt: 'Build an NPC dialogue box ScreenGui with typewriter text effect and choice buttons.',
    idealOutputKey: 'ui_dialogue',
    tags: ['dialogue', 'typewriter', 'npc', 'choices'],
    scoringRubric: {
      mustContain: ['ScreenGui', 'TextLabel', 'task.wait', 'string.sub'],
      mustNotContain: ['wait()', 'spawn()'],
      bonusPatterns: ['TweenService', 'UICorner', 'task.spawn'],
      weightings: { syntax: 0.25, completeness: 0.35, performance: 0.2, bestPractices: 0.2 },
    },
  },
  {
    agentId: 'ui-designer', skill: 'leaderboard_ui',
    prompt: 'Build a leaderboard ScreenGui showing top 10 players with rank, name, and score.',
    idealOutputKey: 'ui_leaderboard',
    tags: ['leaderboard', 'rank', 'score', 'players'],
    scoringRubric: {
      mustContain: ['ScreenGui', 'ScrollingFrame', 'UIListLayout', 'TextLabel'],
      mustNotContain: ['wait()', 'spawn()'],
      bonusPatterns: ['UICorner', 'task.spawn', 'RemoteEvent'],
      weightings: { syntax: 0.25, completeness: 0.35, performance: 0.2, bestPractices: 0.2 },
    },
  },
  {
    agentId: 'ui-designer', skill: 'loading_screen',
    prompt: 'Build a loading screen ScreenGui with a progress bar and animated text.',
    idealOutputKey: 'ui_loading',
    tags: ['loading', 'progress', 'animation', 'screen'],
    scoringRubric: {
      mustContain: ['ScreenGui', 'Frame', 'TweenService', 'ContentProvider'],
      mustNotContain: ['wait()', 'spawn()'],
      bonusPatterns: ['PreloadAsync', 'task.spawn', 'UICorner'],
      weightings: { syntax: 0.25, completeness: 0.35, performance: 0.2, bestPractices: 0.2 },
    },
  },
  {
    agentId: 'ui-designer', skill: 'notification_ui',
    prompt: 'Build a notification system that shows slide-in toast messages with auto-dismiss after 3 seconds.',
    idealOutputKey: 'ui_notification',
    tags: ['notification', 'toast', 'slide', 'auto-dismiss'],
    scoringRubric: {
      mustContain: ['ScreenGui', 'Frame', 'TweenService', 'task.delay'],
      mustNotContain: ['wait()', 'spawn()'],
      bonusPatterns: ['UICorner', 'task.spawn', 'UIListLayout'],
      weightings: { syntax: 0.25, completeness: 0.35, performance: 0.2, bestPractices: 0.2 },
    },
  },

  // ── npc-creator (10 NPC types) ───────────────────────────────────────────

  {
    agentId: 'npc-creator', skill: 'shopkeeper_npc',
    prompt: 'Create a shopkeeper NPC with idle animation, proximity prompt, and shop GUI trigger.',
    idealOutputKey: 'npc_shopkeeper',
    tags: ['shopkeeper', 'npc', 'shop', 'proximity'],
    scoringRubric: {
      mustContain: ['ProximityPrompt', 'Triggered', 'task.wait', 'Humanoid'],
      mustNotContain: ['wait()', 'spawn()'],
      bonusPatterns: ['AnimationTrack', 'pcall', 'task.spawn'],
      weightings: { syntax: 0.25, completeness: 0.35, performance: 0.2, bestPractices: 0.2 },
    },
  },
  {
    agentId: 'npc-creator', skill: 'guard_npc',
    prompt: 'Create a guard NPC that patrols between waypoints and alerts when a player gets too close.',
    idealOutputKey: 'npc_guard',
    tags: ['guard', 'patrol', 'waypoints', 'alert'],
    scoringRubric: {
      mustContain: ['PathfindingService', 'MoveTo', 'task.wait', 'Humanoid'],
      mustNotContain: ['wait()', 'spawn()'],
      bonusPatterns: ['MoveToFinished', 'FindPartOnRay', 'task.spawn'],
      weightings: { syntax: 0.25, completeness: 0.35, performance: 0.2, bestPractices: 0.2 },
    },
  },
  {
    agentId: 'npc-creator', skill: 'quest_giver_npc',
    prompt: 'Create a quest giver NPC with dialogue tree and quest assignment on interaction.',
    idealOutputKey: 'npc_quest_giver',
    tags: ['quest', 'giver', 'dialogue', 'interaction'],
    scoringRubric: {
      mustContain: ['ProximityPrompt', 'RemoteEvent', 'table', 'task.wait'],
      mustNotContain: ['wait()', 'spawn()'],
      bonusPatterns: ['FireClient', 'pcall', 'task.spawn'],
      weightings: { syntax: 0.25, completeness: 0.35, performance: 0.2, bestPractices: 0.2 },
    },
  },
  {
    agentId: 'npc-creator', skill: 'enemy_npc',
    prompt: 'Create an enemy NPC with aggro range detection, pathfinding chase, and melee attack.',
    idealOutputKey: 'npc_enemy',
    tags: ['enemy', 'aggro', 'chase', 'attack'],
    scoringRubric: {
      mustContain: ['PathfindingService', 'TakeDamage', 'task.wait', 'Humanoid'],
      mustNotContain: ['wait()', 'spawn()'],
      bonusPatterns: ['ComputeAsync', 'MoveToFinished', 'task.spawn'],
      weightings: { syntax: 0.25, completeness: 0.35, performance: 0.2, bestPractices: 0.2 },
    },
  },
  {
    agentId: 'npc-creator', skill: 'boss_npc',
    prompt: 'Create a boss NPC with multiple attack phases, health gates, and special ability triggers.',
    idealOutputKey: 'npc_boss',
    tags: ['boss', 'phases', 'special', 'health gate'],
    scoringRubric: {
      mustContain: ['Humanoid', 'TakeDamage', 'task.wait', 'table'],
      mustNotContain: ['wait()', 'spawn()'],
      bonusPatterns: ['HealthChanged', 'task.spawn', 'pcall'],
      weightings: { syntax: 0.25, completeness: 0.35, performance: 0.2, bestPractices: 0.2 },
    },
  },

  // ── lighting-expert ──────────────────────────────────────────────────────

  {
    agentId: 'lighting-expert', skill: 'day_night_cycle',
    prompt: 'Write a smooth day/night cycle that rotates the sun over 24 minutes with proper lighting transitions.',
    idealOutputKey: 'lighting_day_night',
    tags: ['day', 'night', 'cycle', 'sun'],
    scoringRubric: {
      mustContain: ['Lighting', 'ClockTime', 'task.wait', 'TweenService'],
      mustNotContain: ['wait()', 'spawn()'],
      bonusPatterns: ['Atmosphere', 'ColorCorrection', 'task.spawn'],
      weightings: { syntax: 0.3, completeness: 0.3, performance: 0.2, bestPractices: 0.2 },
    },
  },
  {
    agentId: 'lighting-expert', skill: 'cinematic_lighting',
    prompt: 'Configure cinematic lighting with Bloom, DepthOfField, ColorCorrection, and SunRays.',
    idealOutputKey: 'lighting_cinematic',
    tags: ['cinematic', 'bloom', 'dof', 'colorcorrection'],
    scoringRubric: {
      mustContain: ['Lighting', 'BloomEffect', 'ColorCorrectionEffect', 'DepthOfFieldEffect'],
      mustNotContain: ['wait()', 'spawn()'],
      bonusPatterns: ['SunRaysEffect', 'Atmosphere', 'pcall'],
      weightings: { syntax: 0.3, completeness: 0.3, performance: 0.2, bestPractices: 0.2 },
    },
  },

  // ── particle-fx ──────────────────────────────────────────────────────────

  {
    agentId: 'particle-fx', skill: 'explosion_vfx',
    prompt: 'Create an explosion VFX with shockwave ring, debris particles, and light flash.',
    idealOutputKey: 'particle_explosion',
    tags: ['explosion', 'shockwave', 'debris', 'flash'],
    scoringRubric: {
      mustContain: ['ParticleEmitter', 'PointLight', 'task.delay', 'Emit'],
      mustNotContain: ['wait()', 'spawn()'],
      bonusPatterns: ['TweenService', 'Debris', 'task.spawn'],
      weightings: { syntax: 0.3, completeness: 0.3, performance: 0.2, bestPractices: 0.2 },
    },
  },
  {
    agentId: 'particle-fx', skill: 'magic_aura_vfx',
    prompt: 'Create a magic aura VFX around a character with swirling particles and glow effect.',
    idealOutputKey: 'particle_aura',
    tags: ['aura', 'magic', 'particles', 'glow'],
    scoringRubric: {
      mustContain: ['ParticleEmitter', 'PointLight', 'Attachment', 'Enabled'],
      mustNotContain: ['wait()', 'spawn()'],
      bonusPatterns: ['ColorSequence', 'NumberSequence', 'task.spawn'],
      weightings: { syntax: 0.3, completeness: 0.3, performance: 0.2, bestPractices: 0.2 },
    },
  },

  // ── combat-system ────────────────────────────────────────────────────────

  {
    agentId: 'combat-system', skill: 'melee_hitbox',
    prompt: 'Write a server-authoritative melee hitbox system with combo tracking and anti-exploit guards.',
    idealOutputKey: 'combat_melee',
    tags: ['melee', 'hitbox', 'combo', 'server'],
    scoringRubric: {
      mustContain: ['RemoteEvent', 'TakeDamage', 'pcall', 'task.wait'],
      mustNotContain: ['wait()', 'spawn()', 'LocalPlayer.Character.Humanoid.TakeDamage'],
      bonusPatterns: ['GetPartsBoundInBox', 'task.spawn', 'assert'],
      weightings: { syntax: 0.25, completeness: 0.35, performance: 0.2, bestPractices: 0.2 },
    },
  },

  // ── economy-designer ─────────────────────────────────────────────────────

  {
    agentId: 'economy-designer', skill: 'currency_system',
    prompt: 'Write a multi-currency system (Coins, Gems, Tokens) with DataStore persistence and anti-exploit server authority.',
    idealOutputKey: 'economy_currency',
    tags: ['currency', 'coins', 'gems', 'datastore'],
    scoringRubric: {
      mustContain: ['DataStoreService', 'pcall', 'RemoteEvent', 'task.wait'],
      mustNotContain: ['wait()', 'spawn()', 'LocalPlayer'],
      bonusPatterns: ['UpdateAsync', 'task.spawn', 'assert'],
      weightings: { syntax: 0.25, completeness: 0.35, performance: 0.2, bestPractices: 0.2 },
    },
  },

  // ── vehicle-builder ──────────────────────────────────────────────────────

  {
    agentId: 'vehicle-builder', skill: 'car_vehicle',
    prompt: 'Build a driveable car using VehicleSeat with steering, throttle, and brake controls.',
    idealOutputKey: 'vehicle_car',
    tags: ['car', 'vehicle', 'steering', 'drive'],
    scoringRubric: {
      mustContain: ['VehicleSeat', 'BodyVelocity', 'BodyAngularVelocity', 'task.wait'],
      mustNotContain: ['wait()', 'spawn()'],
      bonusPatterns: ['Steer', 'Throttle', 'pcall', 'task.spawn'],
      weightings: { syntax: 0.3, completeness: 0.3, performance: 0.2, bestPractices: 0.2 },
    },
  },

  // ── quest-writer ─────────────────────────────────────────────────────────

  {
    agentId: 'quest-writer', skill: 'chain_quest',
    prompt: 'Write a 3-part quest chain with branching dialogue, kill/collect objectives, and escalating rewards.',
    idealOutputKey: 'quest_chain',
    tags: ['quest', 'chain', 'branching', 'objectives'],
    scoringRubric: {
      mustContain: ['table', 'RemoteEvent', 'task.wait', 'FireClient'],
      mustNotContain: ['wait()', 'spawn()'],
      bonusPatterns: ['pcall', 'task.spawn', 'assert'],
      weightings: { syntax: 0.25, completeness: 0.35, performance: 0.2, bestPractices: 0.2 },
    },
  },

  // ── weapon-smith ─────────────────────────────────────────────────────────

  {
    agentId: 'weapon-smith', skill: 'sword_tool',
    prompt: 'Write a sword tool script with server-authoritative damage, combo system, and block mechanic.',
    idealOutputKey: 'weapon_sword',
    tags: ['sword', 'tool', 'damage', 'combo'],
    scoringRubric: {
      mustContain: ['Tool', 'Activated', 'RemoteEvent', 'pcall'],
      mustNotContain: ['wait()', 'spawn()', 'LocalPlayer.Character.Humanoid.TakeDamage'],
      bonusPatterns: ['AnimationTrack', 'task.wait', 'GetPartsBoundInBox'],
      weightings: { syntax: 0.25, completeness: 0.35, performance: 0.2, bestPractices: 0.2 },
    },
  },
]

// ─── Skill leaderboard ────────────────────────────────────────────────────────

export interface SkillLeaderboardEntry {
  agentId: string
  agentName: string
  topSkill: string
  topSkillLevel: number
  overallLevel: number
  totalPracticeCount: number
}

/**
 * Returns a ranked leaderboard of agents by overall skill level.
 */
export function getSkillLeaderboard(): SkillLeaderboardEntry[] {
  const agentIds = [...new Set(PRACTICE_SCENARIOS.map((s) => s.agentId))]

  return agentIds
    .map((agentId) => {
      const agentDef = getAgent(agentId)
      const skills = getAllSkillsForAgent(agentId)
      const topSkill = skills.sort((a, b) => b.level - a.level)[0]
      return {
        agentId,
        agentName: agentDef?.name ?? agentId,
        topSkill: topSkill?.skill ?? 'none',
        topSkillLevel: topSkill?.level ?? 0,
        overallLevel: getAgentOverallLevel(agentId),
        totalPracticeCount: skills.reduce((acc, s) => acc + s.practiceCount, 0),
      }
    })
    .sort((a, b) => b.overallLevel - a.overallLevel)
}

/**
 * Returns all practice scenarios for a given agent, sorted by skill name.
 */
export function getScenariosForAgent(agentId: string): PracticeScenario[] {
  return PRACTICE_SCENARIOS.filter((s) => s.agentId === agentId).sort((a, b) =>
    a.skill.localeCompare(b.skill)
  )
}

/**
 * Returns the count of practice scenarios per agent — useful for admin dashboards.
 */
export function getPracticeScenarioCounts(): Record<string, number> {
  return PRACTICE_SCENARIOS.reduce(
    (acc, s) => {
      acc[s.agentId] = (acc[s.agentId] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  )
}

// ─── Auto-initialization ──────────────────────────────────────────────────────

// Seed on import so the skill store is always ready
seedSkillStore()
