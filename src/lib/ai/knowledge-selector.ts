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

// ── Bible Imports (9 existing) ──────────────────────────────────────────────
import { VFX_FIRE, VFX_WATER, VFX_MAGIC, VFX_COMBAT, VFX_NATURE, VFX_MECHANICAL, VFX_UI_FEEDBACK, VFX_BEAMS_TRAILS } from './vfx-particle-bible'
import { UI_UX_BIBLE } from './ui-ux-bible'
import { SOUND_MUSIC_BIBLE } from './sound-music-bible'
import { TERRAIN_LANDSCAPE_BIBLE } from './terrain-landscape-bible'
import { GAME_ECONOMY_BIBLE } from './game-economy-bible'
import { NPC_CHARACTER_BIBLE } from './npc-character-bible'
import { INTERIOR_DESIGN_BIBLE } from './interior-design-bible'
import { FURNITURE_LIVING } from './furniture-props-bible'
import { ANIM_TWEEN_RECIPES, ANIM_EASING } from './animation-bible'

// ── Bible Imports (15 new) ──────────────────────────────────────────────────
import { MULTIPLAYER_BIBLE } from './multiplayer-bible'
import { OPTIMIZATION_BIBLE } from './optimization-bible'
import { ARCHITECTURAL_STYLES_BIBLE } from './architectural-styles-bible'
import { LIGHTING_ATMOSPHERE_BIBLE } from './lighting-atmosphere-bible'
import { VEHICLE_TRANSPORT_BIBLE } from './vehicle-transport-bible'
import { WEAPON_TOOL_BIBLE } from './weapon-tool-bible'
import { COLOR_MATERIAL_BIBLE } from './color-material-bible'
import { WORLD_DESIGN_BIBLE } from './world-design-bible'
import { GAME_PROGRESSION_BIBLE } from './game-progression-bible'
import { BUILDING_MATH_BIBLE } from './building-math-bible'
import { TEMPLATE_TYCOON, TEMPLATE_SIMULATOR, TEMPLATE_RPG, TEMPLATE_OBBY, TEMPLATE_HORROR, TEMPLATE_FIGHTING, TEMPLATE_SURVIVAL, TEMPLATE_RACING, TEMPLATE_TD, TEMPLATE_SOCIAL } from './game-templates-expanded'
import { EXTERIOR_CONSTRUCTION_BIBLE } from './exterior-construction-bible'
import { SCRIPTING_PATTERNS_EXPANDED } from './scripting-patterns-expanded'
import { INTERIOR_RESIDENTIAL_DEEP } from './interior-residential-deep'
import { COMMERCIAL_INTERIORS_BIBLE } from './commercial-interiors-bible'

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

  // ── Bible Knowledge Sections ────────────────────────────────────────────────
  {
    id: 'vfx-particle-bible',
    keywords: ['fire', 'water', 'magic', 'combat', 'vfx', 'particle', 'emitter', 'beam', 'trail', 'nature', 'mechanical', 'sparkle', 'explosion', 'flame', 'smoke', 'rain', 'snow', 'lightning', 'spell', 'aura', 'glow', 'muzzle flash', 'impact'],
    getter: () => VFX_FIRE + '\n' + VFX_WATER + '\n' + VFX_MAGIC + '\n' + VFX_COMBAT + '\n' + VFX_NATURE + '\n' + VFX_MECHANICAL + '\n' + VFX_UI_FEEDBACK + '\n' + VFX_BEAMS_TRAILS,
    maxChars: 6000,
  },
  {
    id: 'ui-ux-bible',
    keywords: ['gui', 'menu', 'button', 'hud', 'screen gui', 'frame', 'udim2', 'textlabel', 'imagelabel', 'scrollingframe', 'layout', 'shop menu', 'inventory ui', 'health bar', 'hotbar', 'dialog', 'modal', 'settings menu', 'leaderboard', 'notification'],
    getter: () => UI_UX_BIBLE,
    maxChars: 6000,
  },
  {
    id: 'sound-music-bible',
    keywords: ['sound', 'audio', 'music', 'sfx', 'ambient', 'footstep', 'soundtrack', 'spatial audio', '3d sound', 'reverb', 'equalizer', 'volume', 'fade', 'loop', 'jingle', 'background music', 'sound effect', 'audio group'],
    getter: () => SOUND_MUSIC_BIBLE,
    maxChars: 5000,
  },
  {
    id: 'terrain-landscape-bible',
    keywords: ['terrain', 'biome', 'landscape', 'voxel', 'grass', 'sand', 'rock', 'water terrain', 'mountain', 'valley', 'cliff', 'river', 'lake', 'ocean', 'forest', 'desert', 'snow', 'jungle', 'swamp', 'volcano', 'island', 'cave', 'path', 'road', 'waterfall', 'creek'],
    getter: () => TERRAIN_LANDSCAPE_BIBLE,
    maxChars: 5000,
  },
  {
    id: 'game-economy-bible',
    keywords: ['economy', 'currency', 'coin', 'gem', 'gold', 'shop', 'store', 'buy', 'sell', 'price', 'upgrade', 'rebirth', 'prestige', 'multiplier', 'income', 'earning', 'loot', 'drop rate', 'rarity', 'gacha', 'crate', 'reward', 'daily reward'],
    getter: () => GAME_ECONOMY_BIBLE,
    maxChars: 5000,
  },
  {
    id: 'npc-character-bible',
    keywords: ['npc', 'character', 'enemy', 'mob', 'boss', 'pet', 'companion', 'merchant', 'guard', 'villager', 'humanoid', 'rig', 'r15', 'r6', 'pathfinding', 'patrol', 'waypoint', 'dialog', 'quest giver', 'spawn', 'wave', 'aggro', 'behavior tree'],
    getter: () => NPC_CHARACTER_BIBLE,
    maxChars: 5000,
  },
  {
    id: 'interior-design-bible',
    keywords: ['interior', 'room', 'furniture', 'bedroom', 'kitchen', 'bathroom', 'living room', 'office', 'restaurant', 'hospital', 'school', 'library', 'hotel', 'apartment', 'indoor', 'ceiling', 'floor tile', 'wall decor', 'carpet', 'curtain', 'lamp', 'couch', 'table', 'chair', 'shelf'],
    getter: () => INTERIOR_DESIGN_BIBLE,
    maxChars: 5000,
  },
  {
    id: 'furniture-props-bible',
    keywords: ['furniture', 'chair', 'table', 'bed', 'desk', 'sofa', 'bookshelf', 'lamp', 'dresser', 'cabinet', 'counter', 'stool', 'bench', 'couch', 'nightstand', 'wardrobe', 'tv', 'refrigerator', 'stove', 'prop', 'decoration'],
    getter: () => FURNITURE_LIVING,
    maxChars: 4000,
  },
  {
    id: 'animation-bible',
    keywords: ['animation', 'tween', 'tweenservice', 'easing', 'lerp', 'motion', 'camera animation', 'door animation', 'ui animation', 'bounce', 'slide', 'fade', 'spin', 'shake', 'typewriter', 'countdown'],
    getter: () => ANIM_TWEEN_RECIPES + '\n' + ANIM_EASING,
    maxChars: 4000,
  },

  // ── New Bible Sections (15) ─────────────────────────────────────────────────
  {
    id: 'multiplayer-bible',
    keywords: ['multiplayer', 'remote', 'server', 'client', 'networking', 'anti-cheat', 'exploit', 'replication', 'session', 'matchmaking', 'elo', 'mmr', 'queue', 'reserved server', 'messaging', 'cross-server', 'datastore', 'session lock', 'network owner', 'streaming'],
    getter: () => MULTIPLAYER_BIBLE,
    maxChars: 5000,
  },
  {
    id: 'optimization-bible',
    keywords: ['optimize', 'performance', 'lag', 'fps', 'part count', 'draw call', 'lod', 'memory', 'garbage', 'pool', 'streaming', 'mobile', 'render', 'parallel luau', 'actor', 'microprofiler', 'preload', 'content provider'],
    getter: () => OPTIMIZATION_BIBLE,
    maxChars: 5000,
  },
  {
    id: 'architectural-styles-bible',
    keywords: ['medieval', 'castle', 'gothic', 'tudor', 'victorian', 'colonial', 'art deco', 'modern', 'brutalist', 'japanese', 'chinese', 'pagoda', 'mediterranean', 'islamic', 'log cabin', 'futuristic', 'sci-fi', 'steampunk', 'cyberpunk', 'egyptian', 'greek', 'roman', 'viking', 'haunted', 'underwater', 'treehouse', 'pueblo', 'arctic', 'space station', 'architecture style'],
    getter: () => ARCHITECTURAL_STYLES_BIBLE,
    maxChars: 6000,
  },
  {
    id: 'lighting-atmosphere-bible',
    keywords: ['lighting', 'atmosphere', 'ambient', 'brightness', 'clocktime', 'time of day', 'dawn', 'sunset', 'night', 'mood', 'horror lighting', 'bloom', 'blur', 'depth of field', 'sun rays', 'color correction', 'fog', 'haze', 'sky', 'skybox', 'post processing', 'indoor light', 'point light', 'spot light'],
    getter: () => LIGHTING_ATMOSPHERE_BIBLE,
    maxChars: 5000,
  },
  {
    id: 'vehicle-transport-bible',
    keywords: ['car', 'vehicle', 'drive', 'boat', 'ship', 'airplane', 'helicopter', 'train', 'motorcycle', 'truck', 'bus', 'racing', 'wheel', 'engine', 'speed', 'steering', 'suspension', 'vehicle seat', 'throttle', 'brake', 'fuel', 'nitro', 'flight', 'submarine', 'rocket', 'spaceship'],
    getter: () => VEHICLE_TRANSPORT_BIBLE,
    maxChars: 5000,
  },
  {
    id: 'weapon-tool-bible',
    keywords: ['weapon', 'sword', 'gun', 'bow', 'axe', 'staff', 'wand', 'dagger', 'spear', 'hammer', 'mace', 'scythe', 'pistol', 'rifle', 'shotgun', 'rocket launcher', 'magic staff', 'tool', 'pickaxe', 'fishing rod', 'shovel', 'torch', 'combat system', 'hitbox', 'damage', 'combo', 'parry', 'projectile', 'ammo'],
    getter: () => WEAPON_TOOL_BIBLE,
    maxChars: 5000,
  },
  {
    id: 'color-material-bible',
    keywords: ['color', 'palette', 'material', 'rgb', 'brick', 'concrete', 'metal', 'wood', 'glass', 'neon', 'fabric', 'granite', 'marble', 'ice', 'grass', 'sand', 'slate', 'theme', 'color theory', 'complementary', 'warm', 'cool', 'saturation', 'contrast'],
    getter: () => COLOR_MATERIAL_BIBLE,
    maxChars: 5000,
  },
  {
    id: 'world-design-bible',
    keywords: ['map', 'layout', 'level design', 'world', 'zone', 'biome', 'sight line', 'landmark', 'breadcrumb', 'gating', 'pacing', 'scale', 'door size', 'ceiling height', 'road width', 'tree height', 'navigation', 'signage', 'minimap', 'dead end', 'storytelling', 'environmental'],
    getter: () => WORLD_DESIGN_BIBLE,
    maxChars: 5000,
  },
  {
    id: 'game-progression-bible',
    keywords: ['xp', 'level', 'progression', 'unlock', 'achievement', 'badge', 'retention', 'daily login', 'streak', 'battle pass', 'season', 'quest', 'daily quest', 'prestige', 'rebirth', 'ascension', 'skill tree', 'comeback', 'event'],
    getter: () => GAME_PROGRESSION_BIBLE,
    maxChars: 5000,
  },
  {
    id: 'building-math-bible',
    keywords: ['cframe', 'position', 'rotation', 'angle', 'radian', 'circle', 'spiral', 'arc', 'dome', 'grid', 'snap', 'align', 'no gap', 'stacking', 'procedural', 'noise', 'perlin', 'random', 'scatter', 'maze', 'dungeon', 'staircase', 'fence', 'arch', 'column', 'weld'],
    getter: () => BUILDING_MATH_BIBLE,
    maxChars: 5000,
  },
  {
    id: 'game-templates-expanded',
    keywords: ['tycoon', 'simulator', 'rpg', 'obby', 'horror game', 'fighting game', 'survival game', 'racing game', 'tower defense', 'roleplay', 'game template', 'core loop', 'game design', 'game type', 'genre'],
    getter: () => TEMPLATE_TYCOON + '\n' + TEMPLATE_SIMULATOR + '\n' + TEMPLATE_RPG + '\n' + TEMPLATE_OBBY + '\n' + TEMPLATE_HORROR + '\n' + TEMPLATE_FIGHTING + '\n' + TEMPLATE_SURVIVAL + '\n' + TEMPLATE_RACING + '\n' + TEMPLATE_TD + '\n' + TEMPLATE_SOCIAL,
    maxChars: 6000,
  },
  {
    id: 'exterior-construction-bible',
    keywords: ['roof', 'gable', 'hip', 'mansard', 'dome', 'facade', 'siding', 'porch', 'deck', 'balcony', 'pergola', 'gazebo', 'fence', 'garage', 'shed', 'chimney', 'gutter', 'window frame', 'door frame', 'shutter', 'foundation', 'retaining wall', 'pool'],
    getter: () => EXTERIOR_CONSTRUCTION_BIBLE,
    maxChars: 5000,
  },
  {
    id: 'scripting-patterns-expanded',
    keywords: ['singleton', 'observer', 'state machine', 'object pool', 'factory', 'datastore pattern', 'inventory system', 'quest system', 'combat system', 'pet system', 'trading system', 'service pattern', 'pathfinding', 'collection service', 'marketplace', 'receipt', 'memory leak', 'race condition', 'throttle'],
    getter: () => SCRIPTING_PATTERNS_EXPANDED,
    maxChars: 5000,
  },
  {
    id: 'interior-residential-deep',
    keywords: ['bedroom', 'master bedroom', 'teen room', 'child room', 'kitchen', 'bathroom', 'living room', 'home gym', 'home theater', 'laundry', 'study', 'home office', 'cabin', 'dorm', 'luxury', 'farmhouse kitchen', 'modern kitchen', 'residential'],
    getter: () => INTERIOR_RESIDENTIAL_DEEP,
    maxChars: 5000,
  },
  {
    id: 'commercial-interiors-bible',
    keywords: ['store', 'shop', 'retail', 'grocery', 'boutique', 'restaurant', 'cafe', 'coffee shop', 'bar', 'pub', 'pizza', 'fast food', 'fine dining', 'office', 'hotel', 'lobby', 'hospital', 'clinic', 'arcade', 'theater', 'bowling', 'commercial', 'bookstore', 'pet store'],
    getter: () => COMMERCIAL_INTERIORS_BIBLE,
    maxChars: 5000,
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
    if (taskType === 'prop' && ['building-anatomy', 'building-techniques', 'furniture-props-bible'].includes(section.id)) score += 1
    if (taskType === 'lighting' && section.id === 'vfx-particle-bible') score += 2
    if (taskType === 'audio' && section.id === 'sound-music-bible') score += 2
    if (taskType === 'terrain' && section.id === 'terrain-landscape-bible') score += 2
    if (taskType === 'economy' && section.id === 'game-economy-bible') score += 2
    if (taskType === 'npc' && section.id === 'npc-character-bible') score += 2
    if (taskType === 'building' && ['interior-design-bible', 'furniture-props-bible'].includes(section.id)) score += 1
    if (taskType === 'ui' && section.id === 'ui-ux-bible') score += 2
    // New bible boosts
    if (taskType === 'script' && ['multiplayer-bible', 'scripting-patterns-expanded'].includes(section.id)) score += 2
    if (taskType === 'building' && ['architectural-styles-bible', 'exterior-construction-bible', 'building-math-bible', 'color-material-bible'].includes(section.id)) score += 2
    if (taskType === 'lighting' && section.id === 'lighting-atmosphere-bible') score += 3
    if (taskType === 'prop' && ['weapon-tool-bible', 'interior-residential-deep', 'commercial-interiors-bible'].includes(section.id)) score += 2
    if (taskType === 'terrain' && section.id === 'world-design-bible') score += 1
    if (taskType === 'economy' && section.id === 'game-progression-bible') score += 2

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
