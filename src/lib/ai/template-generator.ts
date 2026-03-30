/**
 * template-generator.ts
 * Auto-detect repeated request patterns and surface them as reusable templates.
 *
 * How it works:
 *  1. Every recorded prompt is passed through clusterByPattern().
 *  2. When a cluster exceeds CLUSTER_THRESHOLD hits, it graduates to a Template.
 *  3. Templates can also be created manually from a successful conversation.
 *  4. suggestTemplates() ranks by: category match > popularity > recency.
 *
 * No external deps. In-process store. Serialize via exportTemplates().
 */

import type { Intent } from './intent-classifier'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Template {
  id: string
  name: string
  description: string
  intent: Intent
  prompt: string           // the template prompt (may include {placeholders})
  placeholders: string[]   // e.g. ['GAME_TYPE', 'STUD_SIZE', 'COLOR']
  expectedOutputShape: ExpectedOutputShape
  useCount: number
  rating: number           // 0.0 – 1.0 average from all uses
  isAuto: boolean          // true = auto-detected, false = manually created
  createdAt: number
  tags: string[]
}

export interface ExpectedOutputShape {
  hasCode: boolean
  hasDimensions: boolean
  hasPartCount: boolean
  hasTip: boolean
  estimatedLength: 'short' | 'medium' | 'long'
}

export interface TemplateCluster {
  pattern: string          // normalized pattern string
  intent: Intent
  hits: number
  prompts: string[]        // raw prompts that matched
  firstSeen: number
  lastSeen: number
}

// ---------------------------------------------------------------------------
// Demo/seed templates (shown when no data exists)
// ---------------------------------------------------------------------------

const SEED_TEMPLATES: Template[] = [
  {
    id: 'tpl_terrain_biome',
    name: 'Biome Terrain Generator',
    description: 'Generate a full biome with Terrain:FillBlock calls, materials, and hills',
    intent: 'terrain',
    prompt: 'Generate a {BIOME_TYPE} biome terrain, {STUD_SIZE} studs wide, with realistic elevation changes and correct Roblox material enums',
    placeholders: ['BIOME_TYPE', 'STUD_SIZE'],
    expectedOutputShape: { hasCode: true, hasDimensions: true, hasPartCount: false, hasTip: true, estimatedLength: 'medium' },
    useCount: 247,
    rating: 0.91,
    isAuto: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
    tags: ['terrain', 'biome', 'starter'],
  },
  {
    id: 'tpl_npc_patrol',
    name: 'Patrol NPC',
    description: 'Enemy NPC that patrols waypoints, detects players, and attacks',
    intent: 'npc',
    prompt: 'Create a patrol NPC with {DETECTION_RADIUS} stud detection range, {DAMAGE} damage per attack, and waypoint patrol using PathfindingService',
    placeholders: ['DETECTION_RADIUS', 'DAMAGE'],
    expectedOutputShape: { hasCode: true, hasDimensions: true, hasPartCount: false, hasTip: true, estimatedLength: 'long' },
    useCount: 189,
    rating: 0.88,
    isAuto: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 20,
    tags: ['npc', 'combat', 'ai', 'starter'],
  },
  {
    id: 'tpl_shop_gui',
    name: 'Shop GUI',
    description: 'In-game shop with items, prices, and purchase handling',
    intent: 'ui',
    prompt: 'Build a Roblox shop GUI with {ITEM_COUNT} item slots, currency display, buy button with RemoteEvent, and server-side validation',
    placeholders: ['ITEM_COUNT'],
    expectedOutputShape: { hasCode: true, hasDimensions: false, hasPartCount: false, hasTip: true, estimatedLength: 'long' },
    useCount: 312,
    rating: 0.93,
    isAuto: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 45,
    tags: ['ui', 'economy', 'shop', 'starter'],
  },
  {
    id: 'tpl_datastore_profile',
    name: 'Player Data Save/Load',
    description: 'ProfileStore/DataStore setup for saving player stats and inventory',
    intent: 'script',
    prompt: 'Write a Luau DataStore system for saving player {DATA_FIELDS} with pcall error handling, session locking, and auto-save every {SAVE_INTERVAL} seconds',
    placeholders: ['DATA_FIELDS', 'SAVE_INTERVAL'],
    expectedOutputShape: { hasCode: true, hasDimensions: false, hasPartCount: false, hasTip: true, estimatedLength: 'long' },
    useCount: 428,
    rating: 0.95,
    isAuto: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 60,
    tags: ['script', 'datastore', 'persistence', 'starter'],
  },
  {
    id: 'tpl_combat_hitbox',
    name: 'Sword Combat System',
    description: 'Melee hitbox with animation, damage, cooldown, and RemoteEvent security',
    intent: 'combat',
    prompt: 'Create a sword combat system with {DAMAGE} damage, {COOLDOWN}s cooldown, Region3 hitbox, server-side validation, and combo multiplier up to {MAX_COMBO}x',
    placeholders: ['DAMAGE', 'COOLDOWN', 'MAX_COMBO'],
    expectedOutputShape: { hasCode: true, hasDimensions: true, hasPartCount: false, hasTip: true, estimatedLength: 'long' },
    useCount: 201,
    rating: 0.87,
    isAuto: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 15,
    tags: ['combat', 'sword', 'hitbox', 'starter'],
  },
  {
    id: 'tpl_economy_currency',
    name: 'Currency & Reward System',
    description: 'Earn rate, double-currency game pass, and leaderstat setup',
    intent: 'economy',
    prompt: 'Design a currency system with base earn rate of {BASE_RATE} per second, {PREMIUM_MULTIPLIER}x premium multiplier, leaderstat display, and anti-exploit server authority',
    placeholders: ['BASE_RATE', 'PREMIUM_MULTIPLIER'],
    expectedOutputShape: { hasCode: true, hasDimensions: false, hasPartCount: false, hasTip: true, estimatedLength: 'medium' },
    useCount: 176,
    rating: 0.89,
    isAuto: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 25,
    tags: ['economy', 'currency', 'gamepass', 'starter'],
  },
  {
    id: 'tpl_particle_explosion',
    name: 'Explosion Particle Effect',
    description: 'Server-replicated explosion VFX with debris and shockwave ring',
    intent: 'particle',
    prompt: 'Create an explosion VFX at {POSITION} with {RADIUS} stud radius, flying debris parts, shockwave ring tween, and screen shake for nearby players',
    placeholders: ['POSITION', 'RADIUS'],
    expectedOutputShape: { hasCode: true, hasDimensions: true, hasPartCount: true, hasTip: true, estimatedLength: 'medium' },
    useCount: 134,
    rating: 0.85,
    isAuto: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
    tags: ['particle', 'vfx', 'explosion', 'starter'],
  },
  {
    id: 'tpl_lighting_atmosphere',
    name: 'Dramatic Atmosphere Setup',
    description: 'Sunset/night/fog lighting with Atmosphere density and color correction',
    intent: 'lighting',
    prompt: 'Set up a {TIME_OF_DAY} atmosphere with fog density {FOG_DENSITY}, ambient color {AMBIENT_COLOR}, and post-processing effects for dramatic visuals',
    placeholders: ['TIME_OF_DAY', 'FOG_DENSITY', 'AMBIENT_COLOR'],
    expectedOutputShape: { hasCode: true, hasDimensions: false, hasPartCount: false, hasTip: true, estimatedLength: 'medium' },
    useCount: 158,
    rating: 0.86,
    isAuto: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 18,
    tags: ['lighting', 'atmosphere', 'vibe', 'starter'],
  },
]

// ---------------------------------------------------------------------------
// In-process store
// ---------------------------------------------------------------------------

const _templates = new Map<string, Template>(
  SEED_TEMPLATES.map(t => [t.id, t])
)

const _clusters = new Map<string, TemplateCluster>()

const CLUSTER_THRESHOLD = 8       // auto-promote cluster to template at this many hits
const MAX_CLUSTER_PROMPTS = 20    // max prompts stored per cluster

let _tplCounter = 0
function nextTplId(): string {
  return `tpl_auto_${Date.now()}_${++_tplCounter}`
}

// ---------------------------------------------------------------------------
// Pattern normalization (for clustering)
// ---------------------------------------------------------------------------

// Words to strip before comparing (stop words + Roblox-specific noise)
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'i', 'my', 'me', 'for', 'with', 'that', 'this', 'to', 'of',
  'in', 'on', 'at', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been',
  'can', 'will', 'would', 'should', 'please', 'help', 'make', 'create', 'build',
  'add', 'set', 'get', 'write', 'give', 'show', 'how', 'what', 'do', 'need', 'want',
])

function normalizePattern(prompt: string): string {
  return prompt
    .toLowerCase()
    .replace(/\b\d+\b/g, 'NUM')         // replace numbers
    .replace(/["'`]/g, '')
    .split(/\W+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w))
    .sort()
    .join('_')
}

// ---------------------------------------------------------------------------
// Cluster tracking and auto-promotion
// ---------------------------------------------------------------------------

function trackCluster(intent: Intent, userPrompt: string): void {
  const pattern = normalizePattern(userPrompt)
  if (!pattern) return

  const existing = _clusters.get(pattern)
  if (existing) {
    existing.hits++
    existing.lastSeen = Date.now()
    if (existing.prompts.length < MAX_CLUSTER_PROMPTS) {
      existing.prompts.push(userPrompt)
    }
    // Auto-promote if threshold reached and no template yet
    if (existing.hits >= CLUSTER_THRESHOLD && !Array.from(_templates.values()).some(t => t.isAuto && t.prompt.includes(pattern.slice(0, 20)))) {
      autoPromoteCluster(existing)
    }
  } else {
    _clusters.set(pattern, {
      pattern,
      intent,
      hits: 1,
      prompts: [userPrompt],
      firstSeen: Date.now(),
      lastSeen: Date.now(),
    })
  }
}

function autoPromoteCluster(cluster: TemplateCluster): void {
  // Pick the shortest/cleanest representative prompt
  const representative = cluster.prompts
    .sort((a, b) => a.length - b.length)[0] ?? ''

  // Extract potential placeholder tokens (words in ALL_CAPS or quoted numbers)
  const placeholderCandidates = Array.from(
    new Set(representative.match(/\b[A-Z]{2,}\b|\b\d+\b/g) ?? [])
  ).slice(0, 4)

  const generatedPrompt = representative.replace(
    /\b(\d+)\b/g,
    (_, n) => `{VALUE_${n}}`
  )

  const tpl: Template = {
    id: nextTplId(),
    name: `Auto: ${cluster.intent} template`,
    description: `Auto-detected pattern from ${cluster.hits} similar requests`,
    intent: cluster.intent,
    prompt: generatedPrompt,
    placeholders: placeholderCandidates,
    expectedOutputShape: {
      hasCode: ['script', 'ui', 'combat', 'npc', 'economy', 'terrain', 'building'].includes(cluster.intent),
      hasDimensions: ['terrain', 'building', 'combat', 'particle'].includes(cluster.intent),
      hasPartCount: ['terrain', 'building', 'optimization'].includes(cluster.intent),
      hasTip: true,
      estimatedLength: 'medium',
    },
    useCount: cluster.hits,
    rating: 0.7,   // default until real feedback arrives
    isAuto: true,
    createdAt: Date.now(),
    tags: [cluster.intent, 'auto'],
  }

  _templates.set(tpl.id, tpl)
}

// ---------------------------------------------------------------------------
// Core exports
// ---------------------------------------------------------------------------

/**
 * Track a user prompt for auto-template detection.
 * Call this every time a prompt is processed.
 */
export function trackPromptForClustering(intent: Intent, userPrompt: string): void {
  trackCluster(intent, userPrompt)
}

/**
 * Suggest templates for a given intent, sorted by relevance and popularity.
 * Returns up to `limit` results (default 5).
 */
export function suggestTemplates(intent: Intent, limit = 5): Template[] {
  const all = Array.from(_templates.values())

  // Primary match: exact intent
  const primary = all
    .filter(t => t.intent === intent)
    .sort((a, b) => {
      // Sort by: rating * log(useCount + 1) — balances quality vs popularity
      const scoreA = a.rating * Math.log(a.useCount + 1)
      const scoreB = b.rating * Math.log(b.useCount + 1)
      return scoreB - scoreA
    })
    .slice(0, limit)

  if (primary.length >= limit) return primary

  // Fill remaining slots with related intents
  const RELATED: Partial<Record<Intent, Intent[]>> = {
    terrain: ['building', 'lighting'],
    building: ['terrain', 'npc'],
    combat: ['npc', 'script'],
    economy: ['ui', 'script'],
    script: ['ui', 'economy'],
    ui: ['script', 'economy'],
    npc: ['combat', 'animation'],
    particle: ['combat', 'lighting'],
    lighting: ['terrain', 'particle'],
  }
  const related = RELATED[intent] ?? []
  const secondary = all
    .filter(t => related.includes(t.intent) && !primary.some(p => p.id === t.id))
    .sort((a, b) => b.useCount - a.useCount)
    .slice(0, limit - primary.length)

  return [...primary, ...secondary]
}

/**
 * Get all templates for a given category, sorted by rating.
 */
export function getTemplatesByCategory(intent: Intent): Template[] {
  return Array.from(_templates.values())
    .filter(t => t.intent === intent)
    .sort((a, b) => b.rating - a.rating)
}

/**
 * Get popular templates across all categories.
 * Useful for a "Trending" or "New User" suggestions panel.
 */
export function getPopularTemplates(limit = 10): Template[] {
  return Array.from(_templates.values())
    .sort((a, b) => {
      const scoreA = a.rating * Math.log(a.useCount + 1)
      const scoreB = b.rating * Math.log(b.useCount + 1)
      return scoreB - scoreA
    })
    .slice(0, limit)
}

/**
 * Create a template manually from a successful conversation.
 * @param name         Short display name
 * @param description  One-sentence description
 * @param intent       Classified intent
 * @param prompt       The prompt text (may contain {PLACEHOLDERS})
 * @param quality      Quality score of the original exchange (0-1)
 */
export function createTemplateFromConversation(
  name: string,
  description: string,
  intent: Intent,
  prompt: string,
  quality: number
): Template {
  const placeholders = Array.from(new Set(prompt.match(/\{[A-Z_]+\}/g) ?? []))
    .map(p => p.slice(1, -1))

  const tpl: Template = {
    id: nextTplId(),
    name,
    description,
    intent,
    prompt,
    placeholders,
    expectedOutputShape: {
      hasCode: quality > 0.6,
      hasDimensions: intent === 'terrain' || intent === 'building',
      hasPartCount: intent === 'terrain' || intent === 'optimization',
      hasTip: true,
      estimatedLength: prompt.length > 200 ? 'long' : 'medium',
    },
    useCount: 1,
    rating: quality,
    isAuto: false,
    createdAt: Date.now(),
    tags: [intent, 'community'],
  }

  _templates.set(tpl.id, tpl)
  return tpl
}

/**
 * Record a template use and update its rating.
 */
export function recordTemplateUse(templateId: string, quality: number): void {
  const tpl = _templates.get(templateId)
  if (!tpl) return
  tpl.rating = (tpl.rating * tpl.useCount + quality) / (tpl.useCount + 1)
  tpl.useCount++
}

/**
 * Get a single template by ID.
 */
export function getTemplateById(id: string): Template | undefined {
  return _templates.get(id)
}

/**
 * Export all templates (for persistence).
 */
export function exportTemplates(): Template[] {
  return Array.from(_templates.values())
}

/**
 * Import templates (on server restart / DB hydration).
 * Does NOT overwrite seed templates — only adds user-created / auto ones.
 */
export function importTemplates(templates: Template[]): void {
  const seedIds = new Set(SEED_TEMPLATES.map(t => t.id))
  for (const t of templates) {
    if (!seedIds.has(t.id)) {
      _templates.set(t.id, t)
    }
  }
}

/**
 * Return cluster stats (for debugging / admin panel).
 */
export function getClusterStats(): { pattern: string; intent: Intent; hits: number }[] {
  return Array.from(_clusters.values())
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 50)
    .map(c => ({ pattern: c.pattern, intent: c.intent, hits: c.hits }))
}
