/**
 * Smart Knowledge Selector — analyzes task prompt and injects ONLY relevant knowledge.
 * Replaces the old "dump everything" approach that caused rate limits and timeouts.
 *
 * Budget: 20K chars MAX total injection per prompt.
 * Strategy: keyword-match the prompt against knowledge sections, pick top 3-4 sections.
 */

import { DEEP_BUILDING_KNOWLEDGE } from './deep-building-knowledge'
import { BUILDING_BIBLE } from './building-bible'
import {
  getAdvancedBuildingKnowledge,
  getAdvancedScriptingKnowledge,
  getExploitPreventionKnowledge,
  getPerformanceKnowledge,
  getVisualEffectsKnowledge,
  getSoundDesignKnowledge,
  getMonetizationKnowledge,
} from './advanced-roblox-knowledge'
import { getEncyclopediaForTaskType } from './roblox-encyclopedia'
import {
  getSystemDesignsForTaskType,
  getDataArchitecture,
  getClientServerPatterns,
  getUIPatterns,
  getEffectRecipes,
  getPerformanceBible,
} from './scripting-bible'
import { getKnowledgeForTaskType } from './deep-game-knowledge'
import type { BuildTaskType } from './build-planner'

// ── Knowledge Section Registry ───────────────────────────────────────────────

interface KnowledgeSection {
  id: string
  keywords: string[]
  getter: () => string
  maxChars: number
}

const SECTIONS: KnowledgeSection[] = [
  {
    id: 'building-anatomy',
    keywords: ['house', 'building', 'castle', 'tower', 'wall', 'roof', 'door', 'window', 'floor', 'room', 'interior', 'exterior', 'architecture', 'medieval', 'modern', 'cabin', 'mansion', 'apartment', 'skyscraper', 'bridge', 'warehouse', 'barn', 'church', 'temple', 'palace', 'fortress', 'cottage', 'villa', 'hut', 'shed', 'garage', 'shop', 'store', 'restaurant', 'hotel', 'hospital', 'school', 'library', 'museum', 'prison', 'station', 'airport', 'dock', 'pier', 'lighthouse'],
    getter: () => DEEP_BUILDING_KNOWLEDGE,
    maxChars: 6000,
  },
  {
    id: 'building-techniques',
    keywords: ['detail', 'realistic', 'professional', 'quality', 'multi-part', 'trim', 'molding', 'texture', 'material', 'brick', 'concrete', 'wood', 'metal', 'glass', 'stone', 'marble', 'granite', 'plaster', 'drywall', 'tile', 'shingle', 'beam', 'column', 'arch', 'stair', 'railing', 'fence', 'chimney', 'gutter', 'pipe', 'vent', 'awning', 'balcony', 'porch', 'deck'],
    getter: () => BUILDING_BIBLE,
    maxChars: 6000,
  },
  {
    id: 'advanced-building',
    keywords: ['complex', 'advanced', 'pro', 'technique', 'z-fighting', 'gap', 'rotation', 'alignment', 'precision', 'weld', 'constraint', 'union', 'mesh', 'cframe', 'orientation', 'snap', 'grid'],
    getter: getAdvancedBuildingKnowledge,
    maxChars: 4000,
  },
  {
    id: 'terrain-landscape',
    keywords: ['terrain', 'landscape', 'hill', 'mountain', 'cliff', 'valley', 'canyon', 'river', 'lake', 'ocean', 'waterfall', 'island', 'forest', 'tree', 'grass', 'sand', 'snow', 'desert', 'swamp', 'jungle', 'meadow', 'biome', 'path', 'road', 'cave', 'crater', 'volcano'],
    getter: () => DEEP_BUILDING_KNOWLEDGE.slice(DEEP_BUILDING_KNOWLEDGE.indexOf('TERRAIN') > -1 ? DEEP_BUILDING_KNOWLEDGE.indexOf('TERRAIN') : 0),
    maxChars: 5000,
  },
  {
    id: 'scripting-systems',
    keywords: ['script', 'system', 'code', 'luau', 'datastore', 'remote', 'event', 'server', 'client', 'module', 'service', 'player', 'leaderstats', 'data', 'save', 'load'],
    getter: () => getSystemDesignsForTaskType('script'),
    maxChars: 5000,
  },
  {
    id: 'game-economy',
    keywords: ['economy', 'currency', 'coin', 'gem', 'shop', 'buy', 'sell', 'price', 'cost', 'upgrade', 'rebirth', 'prestige', 'multiplier', 'tycoon', 'dropper', 'conveyor', 'collector', 'idle', 'clicker', 'income', 'earning'],
    getter: () => getKnowledgeForTaskType('economy'),
    maxChars: 5000,
  },
  {
    id: 'combat-system',
    keywords: ['combat', 'fight', 'attack', 'damage', 'health', 'weapon', 'sword', 'gun', 'spell', 'ability', 'cooldown', 'hitbox', 'knockback', 'stun', 'dodge', 'block', 'parry', 'pvp', 'pve', 'boss', 'enemy'],
    getter: () => getSystemDesignsForTaskType('combat'),
    maxChars: 5000,
  },
  {
    id: 'npc-behavior',
    keywords: ['npc', 'character', 'enemy', 'mob', 'patrol', 'pathfind', 'waypoint', 'dialog', 'quest', 'merchant', 'guard', 'follower', 'pet', 'spawn', 'wave', 'aggro', 'ai', 'behavior', 'humanoid', 'rig', 'r6', 'r15', 'animate'],
    getter: () => getSystemDesignsForTaskType('npc'),
    maxChars: 5000,
  },
  {
    id: 'ui-design',
    keywords: ['ui', 'gui', 'interface', 'hud', 'menu', 'button', 'frame', 'screen', 'panel', 'inventory', 'hotbar', 'health bar', 'dialog box', 'settings', 'modal', 'popup', 'notification', 'toast', 'textlabel', 'imagelabel', 'textbutton', 'scrolling', 'tween'],
    getter: getUIPatterns,
    maxChars: 5000,
  },
  {
    id: 'visual-effects',
    keywords: ['particle', 'effect', 'fire', 'smoke', 'explosion', 'magic', 'sparkle', 'glow', 'beam', 'trail', 'light', 'lighting', 'atmosphere', 'fog', 'bloom', 'sunray', 'shadow', 'neon', 'emission'],
    getter: getVisualEffectsKnowledge,
    maxChars: 4000,
  },
  {
    id: 'sound-design',
    keywords: ['sound', 'audio', 'music', 'sfx', 'ambient', 'footstep', 'volume', 'fade', 'loop', 'soundtrack', 'jingle'],
    getter: getSoundDesignKnowledge,
    maxChars: 4000,
  },
  {
    id: 'performance',
    keywords: ['performance', 'optimize', 'lag', 'fps', 'streaming', 'lod', 'instance', 'memory', 'network', 'replication', 'debounce', 'throttle', 'batch', 'pool'],
    getter: getPerformanceKnowledge,
    maxChars: 3000,
  },
  {
    id: 'data-architecture',
    keywords: ['datastore', 'save', 'load', 'profile', 'session', 'lock', 'cache', 'serialize', 'ordered', 'global', 'key', 'budget'],
    getter: getDataArchitecture,
    maxChars: 4000,
  },
  {
    id: 'client-server',
    keywords: ['remote', 'event', 'function', 'client', 'server', 'replicate', 'network', 'sanity', 'validate', 'exploit', 'anti-cheat', 'rate limit', 'firewall'],
    getter: getClientServerPatterns,
    maxChars: 4000,
  },
  {
    id: 'exploit-prevention',
    keywords: ['exploit', 'hack', 'cheat', 'secure', 'validate', 'sanity', 'anti-cheat', 'speed hack', 'teleport hack', 'noclip'],
    getter: getExploitPreventionKnowledge,
    maxChars: 3000,
  },
  {
    id: 'monetization',
    keywords: ['gamepass', 'devproduct', 'robux', 'premium', 'donate', 'vip', 'monetize', 'marketplace', 'receipt'],
    getter: getMonetizationKnowledge,
    maxChars: 3000,
  },
  {
    id: 'effect-recipes',
    keywords: ['effect', 'recipe', 'particle', 'beam', 'trail', 'tween', 'animate', 'flash', 'dissolve', 'burst', 'aura'],
    getter: getEffectRecipes,
    maxChars: 4000,
  },
]

// ── Main Selector ────────────────────────────────────────────────────────────

const MAX_TOTAL_CHARS = 20000

/**
 * Analyzes the task prompt and returns only the most relevant knowledge sections,
 * capped at MAX_TOTAL_CHARS to prevent rate limits and timeouts.
 */
export function selectRelevantKnowledge(taskPrompt: string, taskType: BuildTaskType): string {
  const lower = taskPrompt.toLowerCase()
  const words = lower.split(/\s+/)

  // Score each section by keyword matches
  const scored = SECTIONS.map(section => {
    let score = 0
    for (const kw of section.keywords) {
      if (lower.includes(kw)) {
        score += kw.includes(' ') ? 3 : 1 // Multi-word keywords are stronger signals
      }
    }
    // Boost sections that match task type
    if (taskType === 'building' && ['building-anatomy', 'building-techniques', 'advanced-building'].includes(section.id)) score += 2
    if (taskType === 'terrain' && section.id === 'terrain-landscape') score += 3
    if (taskType === 'script' && ['scripting-systems', 'data-architecture', 'client-server'].includes(section.id)) score += 2
    if (taskType === 'npc' && ['npc-behavior', 'combat-system'].includes(section.id)) score += 2
    if (taskType === 'ui' && section.id === 'ui-design') score += 3
    if (taskType === 'lighting' && section.id === 'visual-effects') score += 3
    if (taskType === 'audio' && section.id === 'sound-design') score += 3
    if (taskType === 'economy' && section.id === 'game-economy') score += 3
    if (taskType === 'prop' && ['building-anatomy', 'building-techniques'].includes(section.id)) score += 1

    return { section, score }
  })

  // Sort by score descending, take top sections until budget is filled
  scored.sort((a, b) => b.score - a.score)

  let totalChars = 0
  const selected: string[] = []

  for (const { section, score } of scored) {
    if (score <= 0) break // No relevance
    if (totalChars >= MAX_TOTAL_CHARS) break

    const remaining = MAX_TOTAL_CHARS - totalChars
    const budget = Math.min(section.maxChars, remaining)
    if (budget < 500) break // Not worth a tiny fragment

    try {
      const content = section.getter()
      if (!content || content.length < 100) continue
      const trimmed = content.slice(0, budget)
      selected.push(`--- ${section.id.toUpperCase()} ---\n${trimmed}\n--- END ${section.id.toUpperCase()} ---`)
      totalChars += trimmed.length
    } catch {
      // If a getter fails, skip it
      continue
    }
  }

  if (selected.length === 0) {
    // Fallback: always inject a tiny bit of the encyclopedia
    try {
      const enc = getEncyclopediaForTaskType(taskType)
      return `\n\n--- REFERENCE ---\n${enc.slice(0, 4000)}\n--- END REFERENCE ---\n`
    } catch {
      return ''
    }
  }

  return '\n\n' + selected.join('\n\n') + '\n'
}
