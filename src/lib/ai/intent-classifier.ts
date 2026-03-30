/**
 * intent-classifier.ts
 * Keyword + pattern scoring classifier for ForjeGames AI chat.
 * No external dependencies. No AI calls. Pure in-process, zero latency.
 *
 * Supports 20 intents plus a 'general' fallback.
 * Returns a confidence score (0-1) and any detected sub-intents.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Intent =
  | 'terrain'
  | 'building'
  | 'npc'
  | 'script'
  | 'ui'
  | 'audio'
  | 'lighting'
  | 'economy'
  | 'quest'
  | 'combat'
  | 'vehicle'
  | 'particle'
  | 'mesh'
  | 'texture'
  | 'animation'
  | 'analytics'
  | 'marketplace'
  | 'team'
  | 'optimization'
  | 'general'

export interface ClassificationResult {
  intent: Intent
  confidence: number       // 0.0 – 1.0
  subIntents: Intent[]     // other intents that also scored, in score order
  matchedKeywords: string[]
}

// ---------------------------------------------------------------------------
// Keyword/pattern definitions
// Each entry has:
//   patterns  — regexes that fire for this intent
//   weight    — how much each pattern match adds to raw score
//   keywords  — plain lower-case words that each add 1 to raw score (fast path)
// ---------------------------------------------------------------------------

interface IntentDefinition {
  intent: Intent
  patterns: RegExp[]
  keywords: string[]
  weight: number
}

const INTENT_DEFINITIONS: IntentDefinition[] = [
  {
    intent: 'terrain',
    weight: 2,
    patterns: [
      /\b(generate|create|make|build|fill|raise|lower|flatten|sculpt)\b.{0,30}\b(terrain|land|map|world|biome)\b/i,
      /\b(mountain|hill|valley|cliff|cave|island|ocean|river|lake|waterfall|beach|desert|tundra|forest|jungle)\b/i,
      /\b(terrain:fill|writevoxels|fillball|fillblock)\b/i,
    ],
    keywords: ['terrain', 'land', 'biome', 'grass', 'water', 'lake', 'river', 'mountain', 'hill', 'valley', 'forest', 'desert', 'island', 'flatten', 'raise', 'lower', 'sculpt', 'voxel', 'erosion'],
  },
  {
    intent: 'building',
    weight: 2,
    patterns: [
      /\b(build|place|create|make|generate)\b.{0,25}\b(castle|house|tower|wall|bridge|shop|dungeon|arena|city|town|village|structure|building|base)\b/i,
      /\b(exterior|interior|facade|floor plan|room|roof|door|window|staircase|corridor)\b/i,
    ],
    keywords: ['castle', 'house', 'tower', 'wall', 'bridge', 'shop', 'building', 'structure', 'arena', 'dungeon', 'base', 'interior', 'exterior', 'room', 'roof'],
  },
  {
    intent: 'npc',
    weight: 2,
    patterns: [
      /\b(npc|character|enemy|mob|boss|guard|villager|merchant|shopkeeper|quest.?giver|creature|monster)\b/i,
      /\b(ai|pathfinding|patrol|follow|attack|idle|behavior)\b.{0,20}\b(npc|character|enemy)\b/i,
    ],
    keywords: ['npc', 'character', 'enemy', 'mob', 'boss', 'guard', 'villager', 'merchant', 'shopkeeper', 'monster', 'creature', 'pathfinding', 'patrol'],
  },
  {
    intent: 'script',
    weight: 2,
    patterns: [
      /\b(write|create|generate|make|fix|debug)\b.{0,20}\b(script|code|function|module|system|handler)\b/i,
      /\b(luau|lua|serverscript|localscript|modulescript|remoteevent|remotefunction|bindableevent)\b/i,
      /\b(datastore|profilestore|datastoreservice|players\.getplayerbyname)\b/i,
    ],
    keywords: ['script', 'code', 'luau', 'lua', 'function', 'module', 'event', 'server', 'client', 'system', 'serverscript', 'localscript', 'modulescript', 'remoteevent', 'datastore', 'pcall', 'coroutine'],
  },
  {
    intent: 'ui',
    weight: 2,
    patterns: [
      /\b(ui|gui|hud|menu|screen|button|label|frame|panel|overlay|interface|leaderboard)\b/i,
      /\b(screengui|surfacegui|billboardgui|textlabel|textbutton|imagebutton|imagelabel|frame|scrollingframe)\b/i,
      /\b(tweenservice|tween).{0,20}\b(ui|gui|button|frame|label)\b/i,
    ],
    keywords: ['ui', 'gui', 'hud', 'menu', 'button', 'label', 'frame', 'screen', 'panel', 'overlay', 'leaderboard', 'screengui', 'billboard', 'interface'],
  },
  {
    intent: 'audio',
    weight: 2,
    patterns: [
      /\b(add|play|create|loop|fade|trigger)\b.{0,20}\b(sound|music|audio|sfx|ambience|song|track)\b/i,
      /\b(soundservice|sound\.playing|sound\.volume|soundgroup)\b/i,
    ],
    keywords: ['sound', 'music', 'audio', 'sfx', 'ambience', 'song', 'track', 'volume', 'loop', 'fade', 'soundservice'],
  },
  {
    intent: 'lighting',
    weight: 2,
    patterns: [
      /\b(lighting|atmosphere|fog|sky|ambient|sun|moon|shadow|bloom|blur|colorgrade|dof|depth.?of.?field)\b/i,
      /\b(time.?of.?day|sunrise|sunset|night|dusk|dawn)\b/i,
      /\b(game\.lighting|lighting\.ambient|atmosphere\.density|pointlight|spotlight|surfacelight)\b/i,
    ],
    keywords: ['lighting', 'atmosphere', 'fog', 'sky', 'ambient', 'sun', 'shadow', 'bloom', 'light', 'sunrise', 'sunset', 'dusk', 'dawn', 'glow'],
  },
  {
    intent: 'economy',
    weight: 2,
    patterns: [
      /\b(economy|shop|store|marketplace|currency|coin|token|robux|purchase|buy|sell|trade|price|reward|drop.?rate)\b/i,
      /\b(balance|wallet|inventory|loot|drop|chest|spin|gacha|premium)\b/i,
    ],
    keywords: ['economy', 'shop', 'store', 'currency', 'coin', 'token', 'buy', 'sell', 'price', 'reward', 'loot', 'chest', 'gacha', 'premium', 'balance', 'wallet', 'inventory'],
  },
  {
    intent: 'quest',
    weight: 2,
    patterns: [
      /\b(quest|mission|objective|task|goal|story|narrative|dialogue|cutscene)\b/i,
      /\b(quest.?giver|quest.?system|quest.?tracker|journal|npc.?dialogue)\b/i,
    ],
    keywords: ['quest', 'mission', 'objective', 'task', 'goal', 'story', 'narrative', 'dialogue', 'journal', 'tracker'],
  },
  {
    intent: 'combat',
    weight: 2,
    patterns: [
      /\b(combat|fight|battle|attack|weapon|sword|gun|damage|health|hitbox|pvp|pve|kill|die|respawn)\b/i,
      /\b(ability|skill|cooldown|combo|block|dodge|parry|stamina)\b/i,
    ],
    keywords: ['combat', 'fight', 'battle', 'attack', 'weapon', 'sword', 'gun', 'damage', 'health', 'hitbox', 'pvp', 'kill', 'ability', 'skill', 'cooldown', 'combo'],
  },
  {
    intent: 'vehicle',
    weight: 2,
    patterns: [
      /\b(vehicle|car|truck|boat|plane|helicopter|motorcycle|kart|seat|vehicleseat|chassis|suspension)\b/i,
      /\b(drive|steer|throttle|brake|spawn.?car|vehicle.?physics)\b/i,
    ],
    keywords: ['vehicle', 'car', 'truck', 'boat', 'plane', 'drive', 'steer', 'kart', 'seat', 'chassis', 'throttle', 'brake'],
  },
  {
    intent: 'particle',
    weight: 2,
    patterns: [
      /\b(particle|vfx|effect|explosion|fire|smoke|sparkle|confetti|beam|trail|aura|emitter)\b/i,
      /\b(particleemitter|beam\.attachment|trail\.attachment|attachment)\b/i,
    ],
    keywords: ['particle', 'vfx', 'effect', 'explosion', 'fire', 'smoke', 'sparkle', 'confetti', 'beam', 'trail', 'aura', 'emitter'],
  },
  {
    intent: 'mesh',
    weight: 3,
    patterns: [
      /\b(generate|create|make|model|sculpt)\b.{0,30}\b(3d|mesh|model|object|asset|prop)\b/i,
      /\b(3d model|3d mesh|3d object|fbx|obj|blender|lowpoly|high.?poly|polygon)\b/i,
      /\b(meshy|fal\.ai|generate model)\b/i,
    ],
    keywords: ['mesh', '3d', 'model', 'fbx', 'obj', 'blender', 'lowpoly', 'polygon', 'sculpt', 'prop'],
  },
  {
    intent: 'texture',
    weight: 3,
    patterns: [
      /\b(generate|create|make|apply)\b.{0,20}\b(texture|material|surface|decal|skin)\b/i,
      /\b(pbr|albedo|normal.?map|roughness|metallic|uv.?map|tiling)\b/i,
      /\b(stone texture|wood texture|metal texture|grass texture|brick texture)\b/i,
    ],
    keywords: ['texture', 'material', 'surface', 'decal', 'skin', 'pbr', 'albedo', 'roughness', 'metallic', 'uv', 'tiling'],
  },
  {
    intent: 'animation',
    weight: 2,
    patterns: [
      /\b(animate|animation|rig|keyframe|idle|walk|run|jump|attack.?anim|emote|tween)\b/i,
      /\b(animationtrack|animator|humanoid|animationid|r15|r6)\b/i,
    ],
    keywords: ['animate', 'animation', 'rig', 'keyframe', 'idle', 'walk', 'run', 'jump', 'emote', 'tween', 'animator'],
  },
  {
    intent: 'analytics',
    weight: 2,
    patterns: [
      /\b(analytics|metrics|stats|performance|report|dashboard|track|monitor|dau|mau|retention|funnel)\b/i,
      /\b(posthog|sentry|how many players|session length|conversion)\b/i,
    ],
    keywords: ['analytics', 'metrics', 'stats', 'report', 'dashboard', 'retention', 'funnel', 'dau', 'mau', 'conversion', 'monitor'],
  },
  {
    intent: 'marketplace',
    weight: 3,
    patterns: [
      /\b(search|find|browse|get|download)\b.{0,20}\b(marketplace|asset|model|pack|plugin)\b/i,
      /\b(toolbox|free model|asset id|creator marketplace)\b/i,
    ],
    keywords: ['marketplace', 'toolbox', 'asset', 'free model', 'plugin', 'assetid'],
  },
  {
    intent: 'team',
    weight: 2,
    patterns: [
      /\b(team|collaborate|collab|invite|permission|role|access|share|workspace|teammate)\b/i,
      /\b(team create|group|studio access)\b/i,
    ],
    keywords: ['team', 'collaborate', 'invite', 'permission', 'role', 'access', 'share', 'workspace', 'teammate'],
  },
  {
    intent: 'optimization',
    weight: 2,
    patterns: [
      /\b(optimize|performance|lag|fps|framerate|part.?count|reduce|speed.?up|efficient|memory|gc)\b/i,
      /\b(unionoperation|level.?of.?detail|lod|streaming|instance count|batch|pool)\b/i,
    ],
    keywords: ['optimize', 'performance', 'lag', 'fps', 'framerate', 'reduce', 'efficient', 'memory', 'lod', 'streaming', 'batch', 'pool'],
  },
]

// ---------------------------------------------------------------------------
// Classifier implementation
// ---------------------------------------------------------------------------

/**
 * Score a single message against one intent definition.
 * Returns a raw score (0+) and the matched keyword/pattern strings.
 */
function scoreMessage(msg: string, def: IntentDefinition): { score: number; matched: string[] } {
  const lower = msg.toLowerCase()
  let score = 0
  const matched: string[] = []

  // Pattern matching (weighted)
  for (const rx of def.patterns) {
    const m = msg.match(rx)
    if (m) {
      score += def.weight
      matched.push(m[0].trim().toLowerCase())
    }
  }

  // Keyword fast path (1 point each)
  for (const kw of def.keywords) {
    if (lower.includes(kw)) {
      score += 1
      if (!matched.includes(kw)) matched.push(kw)
    }
  }

  return { score, matched }
}

/**
 * Classify a user message into a primary intent and sub-intents.
 * Pure keyword/pattern scoring — no AI call, no network, < 1 ms.
 */
export function classifyIntent(message: string): ClassificationResult {
  if (!message || message.trim().length === 0) {
    return { intent: 'general', confidence: 1, subIntents: [], matchedKeywords: [] }
  }

  type Scored = { intent: Intent; score: number; matched: string[] }
  const scores: Scored[] = []

  for (const def of INTENT_DEFINITIONS) {
    const { score, matched } = scoreMessage(message, def)
    if (score > 0) scores.push({ intent: def.intent, score, matched })
  }

  if (scores.length === 0) {
    return { intent: 'general', confidence: 0.4, subIntents: [], matchedKeywords: [] }
  }

  // Sort descending by score
  scores.sort((a, b) => b.score - a.score)

  const top = scores[0]
  const totalScore = scores.reduce((s, x) => s + x.score, 0)

  // Normalise confidence: primary share of total signal, clamped 0.3–1.0
  const rawConf = totalScore > 0 ? top.score / totalScore : 0
  const confidence = Math.min(1, Math.max(0.3, rawConf))

  const subIntents = scores
    .slice(1, 4)
    .filter(s => s.score > 0)
    .map(s => s.intent)

  return {
    intent: top.intent,
    confidence: parseFloat(confidence.toFixed(2)),
    subIntents,
    matchedKeywords: top.matched,
  }
}
