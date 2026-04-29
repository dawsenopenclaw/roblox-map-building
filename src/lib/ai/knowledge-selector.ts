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
import { EXAMPLE_BUILDS_BIBLE } from './example-builds-bible'
import { LOWPOLY_STYLE_BIBLE, LOWPOLY_STYLE_GUIDE, LOWPOLY_MAP_EXAMPLE, LOWPOLY_OBJECTS, LOWPOLY_ITEMS, LOWPOLY_COLOR_DEPTH } from './lowpoly-style-bible'

// ── Crawled Roblox Creator Hub Knowledge (Apr 2026) ─────────────────────────
import { SCRIPTING_FUNDAMENTALS } from './crawled-knowledge/scripting-fundamentals'
import { NETWORKING_SECURITY } from './crawled-knowledge/networking-security'
import { PHYSICS_UI_DATA } from './crawled-knowledge/physics-ui-data'
import { ENGINE_API_CORE } from './crawled-knowledge/engine-api-core'
import { ENGINE_API_SERVICES } from './crawled-knowledge/engine-api-services'
import { ENGINE_API_VISUALS } from './crawled-knowledge/engine-api-visuals'
// ── GitHub Open-Source Game Patterns (Apr 2026) ─────────────────────────────
import { GITHUB_GAME_ARCHITECTURES } from './crawled-knowledge/github-game-architectures'
import { GITHUB_SYSTEM_PATTERNS } from './crawled-knowledge/github-system-patterns'
// ── DevForum Community Knowledge (Apr 2026) ─────────────────────────────────
import { DEVFORUM_GAME_SYSTEMS } from './crawled-knowledge/devforum-game-systems'
import { DEVFORUM_SCRIPTING_PATTERNS } from './crawled-knowledge/devforum-scripting-patterns'
import { DEVFORUM_UI_BUILDING } from './crawled-knowledge/devforum-ui-building'
// ── Official Roblox Creator Hub: Parts, CFrames, Materials, Constraints (Apr 2026) ──
import { BUILDING_PARTS_CFRAME } from './crawled-knowledge/building-parts-cframe'
// ── Official Roblox Creator Hub: Terrain, Lighting, Atmosphere (Apr 2026) ────────
import { ENVIRONMENT_TERRAIN_LIGHTING } from './crawled-knowledge/environment-terrain-lighting'
// ── Official Roblox Creator Hub: Characters, Animation (Apr 2026) ──────────────
import { CHARACTERS_ANIMATION } from './crawled-knowledge/characters-animation'
// ── Official Roblox Creator Hub: Monetization, Performance, Streaming, Chat (Apr 2026) ──
import { MONETIZATION_PERFORMANCE } from './crawled-knowledge/monetization-performance'

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
  // ── Crawled Creator Hub Knowledge ──────────────────────────────────────────
  {
    id: 'scripting-fundamentals-crawled',
    keywords: ['luau', 'script', 'localscript', 'modulescript', 'pcall', 'task.wait', 'coroutine', 'type checking', 'type annotation', 'metatables', 'scope', 'ipairs', 'pairs', 'generalized iteration', 'events', 'connect', 'disconnect', 'runservice', 'heartbeat', 'starterplayerscripts', 'serverscriptservice', 'replicatedstorage'],
    getter: () => SCRIPTING_FUNDAMENTALS,
    maxChars: 8000,
  },
  {
    id: 'networking-security-crawled',
    keywords: ['remoteevent', 'remotefunction', 'fireserver', 'fireclient', 'onserverevent', 'onclientevent', 'invokeserver', 'unreliableremoteevent', 'anti-exploit', 'exploit prevention', 'security', 'server authority', 'rate limit', 'validate', 'trust client', 'client-server boundary', 'replication', 'network ownership', 'setnetworkowner', 'bindableevent'],
    getter: () => NETWORKING_SECURITY,
    maxChars: 7000,
  },
  {
    id: 'physics-ui-data-crawled',
    keywords: ['physics', 'constraint', 'hingeconstraint', 'springconstraint', 'ropeconstraint', 'weldconstraint', 'assembly', 'touched', 'collision group', 'raycasting', 'udim2', 'screengui', 'frame', 'textlabel', 'textbutton', 'imagelabel', 'anchorpoint', 'zindex', 'uilistlayout', 'uigridlayout', 'uicorner', 'proximityprompt', 'billboardgui', 'surfacegui', 'datastoreservice', 'setasync', 'getasync', 'updateasync', 'incrementasync', 'orderedatastore', 'particleemitter', 'bloom', 'sound', 'soundservice', 'tween'],
    getter: () => PHYSICS_UI_DATA,
    maxChars: 8000,
  },
  {
    id: 'engine-api-core-crawled',
    keywords: ['basepart', 'part', 'model', 'workspace', 'lighting', 'players', 'humanoid', 'collectionservice', 'runservice', 'debris', 'anchored', 'cancollide', 'cframe', 'size', 'material', 'transparency', 'touched', 'touchended', 'playeradded', 'playerremoving', 'characteradded', 'health', 'maxhealth', 'walkspeed', 'jumpheight', 'died', 'movedirection', 'gravity', 'raycast', 'getpartsboundsinradius', 'clocktime', 'brightness', 'globalwind', 'heartbeat', 'renderstep', 'bindtorenderste', 'addtag', 'gettag', 'additem'],
    getter: () => ENGINE_API_CORE,
    maxChars: 8000,
  },
  {
    id: 'engine-api-services-crawled',
    keywords: ['datastoreservice', 'getdatastore', 'getasync', 'setasync', 'updateasync', 'removeasync', 'incrementasync', 'orderedatastore', 'tweenservice', 'tweeninfo', 'easingstyle', 'easing', 'tween', 'remoteevent', 'remotefunction', 'fireserver', 'fireclient', 'fireallclients', 'onserverevent', 'onclientevent', 'invokeserver', 'invokeclient', 'userinputservice', 'iskeydown', 'inputbegan', 'inputended', 'keycode', 'mousedelta', 'touchenabled', 'marketplaceservice', 'promptproductpurchase', 'processreceipt', 'userownsgamepassasync', 'pathfindingservice', 'createpath', 'computeasync', 'getwaypoints', 'pathblocked', 'soundservice', 'ambientreverb'],
    getter: () => ENGINE_API_SERVICES,
    maxChars: 8000,
  },
  {
    id: 'engine-api-visuals-crawled',
    keywords: ['proximityprompt', 'actiontext', 'triggered', 'holdduration', 'particleemitter', 'emit', 'rate', 'lifetime', 'pointlight', 'spotlight', 'surfacelight', 'range', 'shadows', 'atmosphere', 'density', 'haze', 'glare', 'vehicleseat', 'occupant', 'throttle', 'steer', 'uicorner', 'cornerradius', 'uistroke', 'thickness', 'uilistlayout', 'filldirection', 'padding', 'sortorder', 'sound', 'soundid', 'volume', 'looped', 'play', 'beam', 'attachment0', 'attachment1', 'trail', 'linearvelocity', 'alignposition', 'responsiveness'],
    getter: () => ENGINE_API_VISUALS,
    maxChars: 9000,
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
  {
    id: 'example-builds',
    keywords: ['build', 'house', 'tree', 'sword', 'car', 'vehicle', 'weapon', 'make', 'create', 'generate', 'place', 'construct', 'example', 'show me', 'how to'],
    getter: () => EXAMPLE_BUILDS_BIBLE,
    maxChars: 8000,
  },
  {
    id: 'lowpoly-style',
    keywords: ['low poly', 'lowpoly', 'stylized', 'cartoon', 'cute', 'colorful', 'vibrant', 'modern', 'clean', 'smooth', 'adopt me', 'pet sim', 'blox fruits', 'style', 'aesthetic', 'pretty', 'nice looking', 'good looking'],
    getter: () => LOWPOLY_STYLE_GUIDE + '\n' + LOWPOLY_COLOR_DEPTH,
    maxChars: 6000,
  },
  {
    id: 'lowpoly-map',
    keywords: ['map', 'world', 'scene', 'environment', 'forest', 'island', 'landscape', 'nature', 'outdoor', 'terrain', 'scattered', 'populate', 'fill', 'area', 'zone', 'spawn', 'lobby'],
    getter: () => LOWPOLY_MAP_EXAMPLE,
    maxChars: 8000,
  },
  {
    id: 'lowpoly-objects',
    keywords: ['tree', 'rock', 'flower', 'mushroom', 'bush', 'fence', 'bridge', 'campfire', 'lantern', 'barrel', 'crate', 'bench', 'sign', 'path', 'pond', 'waterfall', 'prop', 'decoration', 'detail'],
    getter: () => LOWPOLY_OBJECTS + '\n' + LOWPOLY_ITEMS,
    maxChars: 6000,
  },
  // ── GitHub Real-Game Architecture Patterns (Apr 2026) ───────────────────────
  {
    id: 'github-game-architectures',
    keywords: ['knit', 'framework', 'service', 'controller', 'architecture', 'game structure', 'folder organization', 'module pattern', 'service pattern', 'arena', 'round', 'match', 'queue', 'team', 'lobby', 'battle', 'tournament', 'melee', 'pad', 'state machine', 'player state', 'attribute', 'leaderstats', 'surface gui', 'scoreboard', 'in-world ui', 'kill log', 'notification', 'announcement', 'spawn point', 'respawn', 'teleport', 'checkpoint', 'forcefield', 'creator tag', 'kill attribution'],
    getter: () => GITHUB_GAME_ARCHITECTURES,
    maxChars: 9000,
  },
  {
    id: 'github-system-patterns',
    keywords: ['datastore2', 'data store wrapper', 'save load', 'safe datastore', 'pcall retry', 'combat pattern', 'hitbox', 'sword', 'damage', 'area damage', 'aoe', 'round loop', 'intermission', 'economy', 'currency', 'shop', 'purchase', 'game pass', 'developer product', 'receipt', 'matchmaking queue', 'physical queue', 'npc ai', 'pathfinding npc', 'mob controller', 'tycoon', 'dropper', 'collector', 'conveyor', 'inventory system', 'item system', 'equip', 'pet follow', 'orbit', 'progress bar', 'tween helper', 'ui animation', 'pop in', 'obby', 'checkpoint system', 'kill block', 'remote rate limit', 'unreliable remote'],
    getter: () => GITHUB_SYSTEM_PATTERNS,
    maxChars: 9000,
  },
  // ── DevForum Community Knowledge (Apr 2026) ──────────────────────────────────
  {
    id: 'devforum-game-systems',
    keywords: ['tycoon', 'simulator', 'inventory', 'pet system', 'trading', 'quest', 'purchase button', 'plot', 'tycoon ownership', 'income rate', 'leaderstats', 'rebirth', 'click tool', 'orbit', 'pet follow', 'trade state', 'accept trade', 'offer', 'quest objective', 'quest reward', 'collect', 'dropper', 'idle game', 'auto collect', 'sell zone'],
    getter: () => DEVFORUM_GAME_SYSTEMS,
    maxChars: 9000,
  },
  {
    id: 'devforum-scripting-patterns',
    keywords: ['datastore best practices', 'session lock', 'updateasync', 'save load', 'retry', 'exponential backoff', 'bind to close', 'autosave', 'combat damage', 'stat manager', 'take damage', 'status effect', 'hitbox', 'sphere hitbox', 'box hitbox', 'raycast hitbox', 'pathfinding', 'waypoint', 'wander', 'npc state', 'customer npc', 'anti exploit', 'rate limit', 'validate', 'honeypot', 'luau optimize', 'table preallocation', 'instance pooling', 'delay parent', 'dupclosure', 'local cache'],
    getter: () => DEVFORUM_SCRIPTING_PATTERNS,
    maxChars: 9000,
  },
  {
    id: 'devforum-ui-building',
    keywords: ['screengui', 'modern ui', 'button hover', 'tween button', 'panel animation', 'slide in', 'slide out', 'notification', 'health bar', 'damage number', 'floating damage', 'viewport frame', 'item preview', 'obby checkpoint', 'kill brick', 'moving platform', 'spinner', 'obstacle', 'color system', 'dark theme', 'uicorner', 'uistroke', 'uilistlayout', 'responsive ui', 'mobile ui', 'lighting setup', 'bloom', 'atmosphere', 'color correction', 'material guide'],
    getter: () => DEVFORUM_UI_BUILDING,
    maxChars: 9000,
  },
  // ── Characters & Animation (Apr 2026) ──────────────────────────────────────
  {
    id: 'characters-animation-crawled',
    keywords: ['animation', 'animator', 'animationtrack', 'loadanimation', 'play animation', 'stop animation', 'animationpriority', 'animationcontroller', 'getmarkerreachedsignal', 'marker', 'animation event', 'humanoiddescription', 'applydescription', 'loadcharacterwithhumanoiddescription', 'gethumanoiddescriptionfromuserid', 'gethumanoiddescriptionfromoutfitid', 'r6', 'r15', 'rig type', 'character appearance', 'character customization', 'avatar', 'bodycolor', 'hat accessory', 'hair accessory', 'face accessory', 'body parts', 'character scale', 'heightscale', 'widthscale', 'npc animation', 'npc rig', 'animationcontroller', 'ik', 'ikcontrol', 'inverse kinematics', 'facecontrols', 'facial expression', 'looat', 'sprint', 'walk animation', 'run animation', 'idle animation', 'jump animation', 'custom animation', 'wrapLayer', 'wrapTarget', 'layered clothing', 'humanoid state', 'walkspeed', 'jumpheight'],
    getter: () => CHARACTERS_ANIMATION,
    maxChars: 9000,
  },
  // ── Monetization, Performance, Streaming, Teleporting, TextChat (Apr 2026) ──
  {
    id: 'monetization-performance-crawled',
    keywords: ['gamepass', 'game pass', 'developer product', 'devproduct', 'processreceipt', 'promptproductpurchase', 'promptgamepasspurchase', 'userownsgamepassasync', 'purchasegranted', 'notprocessedyet', 'receiptinfo', 'purchaseid', 'playerid', 'productid', 'subscription', 'issubscribed', 'getusersubscriptionstatus', 'promptsubscription', 'monetize', 'robux', 'marketplace', 'vip', 'premium', 'shop', 'store purchase', 'rankproductsasync', 'recommendtopproductsasync', 'streaming', 'streamingenabled', 'streamingminradius', 'streamingtargetradius', 'streamoutbehavior', 'modelstreamingmode', 'persistent model', 'atomic model', 'requeststreamaroundasync', 'teleport', 'teleportasync', 'teleportpartyasync', 'teleportoptions', 'seteleportdata', 'getjoindata', 'teleportdata', 'reserveserver', 'teleportinitfailed', 'between places', 'textchatservice', 'textchannel', 'textsource', 'textchatcommand', 'sendasyc', 'shoulddelivercallback', 'onincomingmessage', 'chat filter', 'chat command', 'proximity chat', 'performance', 'fps', 'optimize', 'anchor', 'castShadow', 'renderfidelity', 'draw call', 'contentprovider', 'preloadasync', 'memory leak', 'connection disconnect', 'runservice throttle', 'task.wait', 'native code', 'collision fidelity', 'canCollide', 'canTouch', 'canQuery'],
    getter: () => MONETIZATION_PERFORMANCE,
    maxChars: 9000,
  },
  // ── Official Roblox Creator Hub: Parts, CFrame, Materials, Constraints ─────
  {
    id: 'building-parts-cframe-crawled',
    keywords: ['cframe', 'part', 'block', 'sphere', 'cylinder', 'wedge', 'size', 'position', 'anchored', 'cancollide', 'material', 'color3', 'transparency', 'reflectance', 'meshpart', 'meshid', 'textureid', 'specialmesh', 'surfaceappearance', 'texture', 'decal', 'face', 'weldconstraint', 'hingeconstraint', 'prismaticconstraint', 'springconstraint', 'ropeconstraint', 'ballsocketconstraint', 'attachment', 'primarypart', 'pivotto', 'moveto', 'getboundingbox', 'lookvector', 'rightvector', 'upvector', 'toworldspace', 'lerp', 'fromeuleraxyz', 'angles', 'lookat', 'grid of parts', 'circle arrangement', 'ring of parts', 'stack parts', 'row of parts', 'neon', 'enum material', 'woodplanks', 'concrete', 'brick material', 'basalt', 'granite', 'marble', 'asphalt', 'cobblestone', 'glass', 'fabric', 'carpet', 'cardboard', 'plaster', 'rubber', 'clonerow', 'buildwall', 'renderfidelity', 'collisionfidelity'],
    getter: () => BUILDING_PARTS_CFRAME,
    maxChars: 9000,
  },
  // ── Official Roblox Creator Hub: Terrain, Lighting, Atmosphere, Wind ────────
  {
    id: 'environment-terrain-lighting-crawled',
    keywords: ['terrain', 'fillblock', 'fillball', 'fillcylinder', 'fillwedge', 'readvoxels', 'writevoxels', 'replacematerial', 'voxel', 'terrain material', 'terrain clear', 'lighting', 'ambient', 'brightness', 'clocktime', 'timeof day', 'outdoorambient', 'globalwind', 'wind', 'fog', 'fogcolor', 'fogend', 'fogstart', 'shadowsoftness', 'globalshadows', 'colorshift', 'exposurecompensation', 'technology', 'future lighting', 'atmosphere', 'density', 'haze', 'glare', 'decay', 'sky', 'skybox', 'celestialbodiesshown', 'starcount', 'suntextureid', 'bloom', 'blur', 'colorcorrection', 'sunrays', 'depthoffield', 'colorgrading', 'tonemapper', 'bloomeffect', 'blureffect', 'post processing', 'pointlight', 'spotlight', 'surfacelight', 'neon glow', 'day night cycle', 'golden hour', 'horror lighting', 'sci-fi lighting', 'underwater lighting', 'forest vibe', 'alien atmosphere', 'generate terrain', 'flat island', 'mountainous terrain', 'noise terrain', 'math.noise terrain'],
    getter: () => ENVIRONMENT_TERRAIN_LIGHTING,
    maxChars: 9000,
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
    // Crawled Creator Hub knowledge boosts
    if (taskType === 'script' && ['scripting-fundamentals-crawled', 'networking-security-crawled', 'physics-ui-data-crawled'].includes(section.id)) score += 3
    if (taskType === 'ui' && section.id === 'physics-ui-data-crawled') score += 3
    if (taskType === 'building' && section.id === 'physics-ui-data-crawled') score += 1
    // Engine API crawled boosts
    if (taskType === 'script' && ['engine-api-core-crawled', 'engine-api-services-crawled'].includes(section.id)) score += 3
    if (taskType === 'ui' && section.id === 'engine-api-visuals-crawled') score += 3
    if (taskType === 'building' && section.id === 'engine-api-core-crawled') score += 1
    if (taskType === 'lighting' && section.id === 'engine-api-visuals-crawled') score += 2
    if (taskType === 'npc' && ['engine-api-services-crawled', 'engine-api-core-crawled'].includes(section.id)) score += 3
    if (taskType === 'building' && ['architectural-styles-bible', 'exterior-construction-bible', 'building-math-bible', 'color-material-bible'].includes(section.id)) score += 2
    if (taskType === 'lighting' && section.id === 'lighting-atmosphere-bible') score += 3
    if (taskType === 'prop' && ['weapon-tool-bible', 'interior-residential-deep', 'commercial-interiors-bible'].includes(section.id)) score += 2
    if (taskType === 'terrain' && section.id === 'world-design-bible') score += 1
    if (taskType === 'economy' && section.id === 'game-progression-bible') score += 2
    // GitHub real-game architecture + system boosts
    if (taskType === 'script' && ['github-game-architectures', 'github-system-patterns'].includes(section.id)) score += 4
    if (taskType === 'npc' && section.id === 'github-system-patterns') score += 3
    if (taskType === 'economy' && section.id === 'github-system-patterns') score += 4
    if (taskType === 'ui' && section.id === 'github-game-architectures') score += 2
    // Example builds always relevant for any building/prop task
    if (['building', 'prop', 'terrain'].includes(taskType) && section.id === 'example-builds') score += 3
    // Low-poly style ALWAYS injected for visual builds — this is the default look
    if (['building', 'prop', 'terrain'].includes(taskType) && section.id === 'lowpoly-style') score += 4
    if (taskType === 'terrain' && section.id === 'lowpoly-map') score += 4
    if (taskType === 'prop' && section.id === 'lowpoly-objects') score += 3
    // Characters & animation crawled boosts
    if (taskType === 'npc' && section.id === 'characters-animation-crawled') score += 5
    if (taskType === 'script' && section.id === 'characters-animation-crawled') score += 2
    // Monetization, performance, streaming, teleport, chat crawled boosts
    if (taskType === 'economy' && section.id === 'monetization-performance-crawled') score += 5
    if (taskType === 'script' && section.id === 'monetization-performance-crawled') score += 3
    if (taskType === 'npc' && section.id === 'monetization-performance-crawled') score += 1
    // Building parts, CFrame, materials, constraints crawled boosts
    if (taskType === 'building' && section.id === 'building-parts-cframe-crawled') score += 5
    if (taskType === 'prop' && section.id === 'building-parts-cframe-crawled') score += 4
    if (taskType === 'terrain' && section.id === 'building-parts-cframe-crawled') score += 2
    if (taskType === 'script' && section.id === 'building-parts-cframe-crawled') score += 2
    // Environment, terrain, lighting, atmosphere crawled boosts
    if (taskType === 'terrain' && section.id === 'environment-terrain-lighting-crawled') score += 5
    if (taskType === 'lighting' && section.id === 'environment-terrain-lighting-crawled') score += 5
    if (taskType === 'building' && section.id === 'environment-terrain-lighting-crawled') score += 2
    if (taskType === 'script' && section.id === 'environment-terrain-lighting-crawled') score += 1

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
