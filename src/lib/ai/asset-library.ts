/**
 * asset-library.ts — Curated Roblox MeshPart Asset Library
 *
 * 60+ real Roblox Toolbox model IDs, categorized and keyword-tagged.
 * When a user asks to "add a tree" or "place a car", we use a REAL
 * high-quality model instead of generating a Part-based approximation.
 *
 * Asset IDs sourced from Roblox Catalog API:
 *   catalog.roblox.com/v1/search/items?category=Models&keyword=...
 * All IDs are from the top search results (highest relevance).
 * Marked UNVERIFIED — test in Studio to confirm they load correctly.
 */

import 'server-only'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AssetEntry {
  id: number
  name: string
  category: AssetCategory
  keywords: string[]
  style: 'realistic' | 'low-poly' | 'cartoon' | 'stylized' | 'any'
  partCount: number
  description: string
  tags: string[]
}

export type AssetCategory =
  | 'tree'
  | 'plant'
  | 'vehicle'
  | 'furniture'
  | 'building'
  | 'character'
  | 'weapon'
  | 'decoration'
  | 'effect'
  | 'food'
  | 'tool'
  | 'terrain'
  | 'lighting'

// ─── Curated Asset Library ──────────────────────────────────────────────────
// All IDs from Roblox Catalog API search results (top relevance).
// UNVERIFIED — test in Studio. Some may require AllowInsertFreeAssets.

export const ASSET_LIBRARY: AssetEntry[] = [
  // ═══ TREES (10) ═══
  { id: 11106892023, name: 'Oak Tree', category: 'tree', keywords: ['oak','tree','deciduous','forest','nature','shade','green'], style: 'realistic', partCount: 20, description: 'Full oak tree with green canopy and brown trunk', tags: ['outdoor','park','forest'] },
  { id: 109950729850028, name: 'Pine Tree', category: 'tree', keywords: ['pine','tree','conifer','evergreen','forest','tall'], style: 'realistic', partCount: 15, description: 'Tall pine tree with conifer shape', tags: ['outdoor','forest','mountain'] },
  { id: 135903119178704, name: 'Palm Tree', category: 'tree', keywords: ['palm','tree','tropical','beach','island','fronds'], style: 'realistic', partCount: 12, description: 'Tropical palm tree with fronds', tags: ['outdoor','beach','tropical'] },
  { id: 96873986388831, name: 'Cherry Blossom', category: 'tree', keywords: ['cherry','blossom','sakura','pink','japanese','flower'], style: 'stylized', partCount: 25, description: 'Pink cherry blossom tree, Japanese style', tags: ['outdoor','japanese','garden'] },
  { id: 17095665337, name: 'Birch Tree', category: 'tree', keywords: ['birch','tree','white','bark','yellow','leaves'], style: 'realistic', partCount: 18, description: 'Birch tree with white bark and leaves', tags: ['outdoor','forest','nature'] },
  { id: 93202858052339, name: 'Dead Tree', category: 'tree', keywords: ['dead','tree','leafless','spooky','halloween','gray','bare'], style: 'realistic', partCount: 10, description: 'Leafless dead tree, spooky and gray', tags: ['outdoor','horror','halloween','spooky'] },
  { id: 12483310814, name: 'Willow Tree', category: 'tree', keywords: ['willow','tree','drooping','weeping','branches','green'], style: 'realistic', partCount: 30, description: 'Weeping willow with drooping branches', tags: ['outdoor','garden','nature','pond'] },
  { id: 12314868715, name: 'Forest Tree', category: 'tree', keywords: ['tree','forest','generic','green','nature','shade'], style: 'any', partCount: 15, description: 'Generic forest tree', tags: ['outdoor','forest','nature'] },
  { id: 4932986608, name: 'Autumn Tree', category: 'tree', keywords: ['autumn','fall','tree','orange','red','yellow','seasonal'], style: 'realistic', partCount: 20, description: 'Autumn tree with orange/red/yellow leaves', tags: ['outdoor','fall','seasonal'] },
  { id: 4049634387, name: 'Jungle Tree', category: 'tree', keywords: ['jungle','tree','tropical','thick','vines','rainforest'], style: 'realistic', partCount: 25, description: 'Thick jungle tree with tropical feel', tags: ['outdoor','jungle','tropical'] },

  // ═══ PLANTS (7) ═══
  { id: 92127812770345, name: 'Bush', category: 'plant', keywords: ['bush','shrub','hedge','green','garden'], style: 'any', partCount: 5, description: 'Green bush/shrub', tags: ['outdoor','garden','landscaping'] },
  { id: 125168955355865, name: 'Cactus', category: 'plant', keywords: ['cactus','desert','green','prickly','succulent'], style: 'any', partCount: 5, description: 'Desert cactus', tags: ['outdoor','desert','western'] },
  { id: 13891734160, name: 'Mushroom', category: 'plant', keywords: ['mushroom','fungi','forest','red','spotted'], style: 'cartoon', partCount: 4, description: 'Red mushroom with white spots', tags: ['outdoor','forest','fantasy'] },
  { id: 117300769524235, name: 'Fern', category: 'plant', keywords: ['fern','plant','forest','floor','green','fronds'], style: 'realistic', partCount: 8, description: 'Forest floor fern plant', tags: ['outdoor','forest','nature'] },
  { id: 18112883440, name: 'Small Plant', category: 'plant', keywords: ['plant','small','potted','indoor','decoration'], style: 'any', partCount: 4, description: 'Small decorative plant', tags: ['indoor','decoration'] },
  { id: 14208099227, name: 'Tall Grass', category: 'plant', keywords: ['grass','tall','patch','field','meadow'], style: 'realistic', partCount: 6, description: 'Tall grass cluster for fields', tags: ['outdoor','field','nature'] },
  { id: 18628285330, name: 'Flower Cluster', category: 'plant', keywords: ['flower','flowers','colorful','garden','bouquet'], style: 'any', partCount: 8, description: 'Colorful cluster of flowers', tags: ['outdoor','garden','decoration'] },

  // ═══ VEHICLES (8) ═══
  { id: 18293245052, name: 'Car', category: 'vehicle', keywords: ['car','vehicle','automobile','sedan','drive','road'], style: 'any', partCount: 30, description: 'Standard car/sedan', tags: ['road','city','transport'] },
  { id: 15051105875, name: 'Truck', category: 'vehicle', keywords: ['truck','pickup','vehicle','large','work','hauling'], style: 'any', partCount: 35, description: 'Pickup truck', tags: ['road','work','transport'] },
  { id: 86361859080461, name: 'Helicopter', category: 'vehicle', keywords: ['helicopter','chopper','aircraft','fly','blades','sky'], style: 'any', partCount: 40, description: 'Helicopter with blades and cockpit', tags: ['air','military','transport'] },
  { id: 18826827320, name: 'Sailboat', category: 'vehicle', keywords: ['sailboat','boat','ship','water','sail','ocean','sea'], style: 'any', partCount: 20, description: 'Sailboat with mast and sail', tags: ['water','ocean','transport'] },
  { id: 18828608080, name: 'Bicycle', category: 'vehicle', keywords: ['bicycle','bike','cycle','pedal','two wheels','ride'], style: 'any', partCount: 15, description: 'Bicycle with two wheels', tags: ['road','sport','transport'] },
  { id: 16511601873, name: 'Skateboard', category: 'vehicle', keywords: ['skateboard','skate','board','wheels','ride'], style: 'any', partCount: 8, description: 'Skateboard deck with wheels', tags: ['sport','toy','ride'] },
  { id: 15492252701, name: 'Spaceship', category: 'vehicle', keywords: ['spaceship','spacecraft','rocket','space','sci-fi','ship','fly'], style: 'stylized', partCount: 50, description: 'Sci-fi spaceship with engines', tags: ['space','sci-fi','transport'] },
  { id: 232447687338545, name: 'Horse', category: 'vehicle', keywords: ['horse','mount','ride','animal','medieval','saddle'], style: 'realistic', partCount: 25, description: 'Rideable horse with saddle', tags: ['medieval','nature','mount'] },

  // ═══ FURNITURE (10) ═══
  { id: 13665885040, name: 'Couch', category: 'furniture', keywords: ['couch','sofa','seat','living room','cushion','fabric'], style: 'any', partCount: 10, description: 'Three-seat couch/sofa', tags: ['indoor','living room'] },
  { id: 102253827609019, name: 'Bed', category: 'furniture', keywords: ['bed','mattress','pillow','bedroom','sleep','blanket'], style: 'any', partCount: 12, description: 'Double bed with pillows and blanket', tags: ['indoor','bedroom'] },
  { id: 7671674703, name: 'Office Desk', category: 'furniture', keywords: ['desk','office','table','work','drawers','computer'], style: 'any', partCount: 10, description: 'Office desk with drawers', tags: ['indoor','office'] },
  { id: 13036349837, name: 'Wooden Chair', category: 'furniture', keywords: ['chair','wooden','seat','backrest','dining'], style: 'realistic', partCount: 6, description: 'Simple wooden chair', tags: ['indoor','dining'] },
  { id: 11653625161, name: 'Floor Lamp', category: 'furniture', keywords: ['lamp','floor','light','shade','standing','tall'], style: 'any', partCount: 5, description: 'Tall floor lamp with shade', tags: ['indoor','lighting'] },
  { id: 11892076412, name: 'Bookshelf', category: 'furniture', keywords: ['bookshelf','shelf','books','library','storage','reading'], style: 'any', partCount: 15, description: 'Bookshelf filled with books', tags: ['indoor','library','office'] },
  { id: 18252599759, name: 'Television', category: 'furniture', keywords: ['tv','television','screen','flat screen','entertainment','monitor'], style: 'any', partCount: 5, description: 'Flat screen TV on stand', tags: ['indoor','living room','entertainment'] },
  { id: 137276976071902, name: 'Refrigerator', category: 'furniture', keywords: ['fridge','refrigerator','kitchen','cold','food storage','appliance'], style: 'any', partCount: 8, description: 'Double-door refrigerator', tags: ['indoor','kitchen'] },
  { id: 7389757913, name: 'Torch/Lantern', category: 'furniture', keywords: ['torch','lantern','fire','light','medieval','flame'], style: 'any', partCount: 4, description: 'Wall torch with fire', tags: ['indoor','medieval','lighting','castle'] },
  { id: 116255901406311, name: 'Wall Clock', category: 'furniture', keywords: ['clock','wall','time','round','decoration','numbers'], style: 'any', partCount: 3, description: 'Round wall clock', tags: ['indoor','decoration'] },

  // ═══ BUILDINGS (5) ═══
  { id: 114619368206421, name: 'Small House', category: 'building', keywords: ['house','home','residential','roof','door','window','building'], style: 'any', partCount: 50, description: 'Small residential house with roof', tags: ['residential','outdoor'] },
  { id: 90626534405965, name: 'Shop Front', category: 'building', keywords: ['shop','store','building','retail','awning','door','commercial'], style: 'any', partCount: 40, description: 'Shop/store front with awning', tags: ['commercial','outdoor','town'] },
  { id: 6238658375, name: 'Castle Tower', category: 'building', keywords: ['castle','tower','medieval','stone','fortress','battlement'], style: 'realistic', partCount: 60, description: 'Medieval stone castle tower', tags: ['medieval','outdoor','castle'] },
  { id: 72210812583710, name: 'Wooden Bridge', category: 'building', keywords: ['bridge','wooden','planks','crossing','river','railings'], style: 'realistic', partCount: 20, description: 'Wooden bridge with railings', tags: ['outdoor','crossing','nature'] },
  { id: 75488757008696, name: 'Stone Wall', category: 'building', keywords: ['wall','stone','barrier','fence','medieval','fortification'], style: 'realistic', partCount: 15, description: 'Stone wall segment', tags: ['outdoor','medieval','barrier'] },

  // ═══ CHARACTERS (5) ═══
  { id: 791776130665, name: 'NPC Character', category: 'character', keywords: ['npc','character','person','villager','humanoid'], style: 'any', partCount: 15, description: 'Generic NPC character', tags: ['character','humanoid'] },
  { id: 291, name: 'Zombie', category: 'character', keywords: ['zombie','monster','undead','enemy','horror','scary'], style: 'any', partCount: 12, description: 'Zombie monster enemy', tags: ['enemy','horror','monster'] },
  { id: 11575791721, name: 'Dog', category: 'character', keywords: ['dog','pet','puppy','animal','companion','cute'], style: 'any', partCount: 10, description: 'Pet dog', tags: ['pet','animal','cute'] },
  { id: 7062031692, name: 'Cat', category: 'character', keywords: ['cat','pet','kitten','animal','companion','cute'], style: 'any', partCount: 8, description: 'Pet cat', tags: ['pet','animal','cute'] },
  { id: 88745410040474, name: 'Statue', category: 'character', keywords: ['statue','monument','sculpture','stone','decoration','memorial'], style: 'realistic', partCount: 10, description: 'Stone statue/monument', tags: ['decoration','outdoor','memorial'] },

  // ═══ WEAPONS (5) ═══
  { id: 126031985445607, name: 'Sword', category: 'weapon', keywords: ['sword','blade','iron','weapon','melee','knight','combat'], style: 'any', partCount: 4, description: 'Iron sword with crossguard', tags: ['combat','medieval','melee'] },
  { id: 13855535145, name: 'Bow', category: 'weapon', keywords: ['bow','arrow','archery','ranged','weapon','quiver'], style: 'any', partCount: 5, description: 'Bow and arrow', tags: ['combat','ranged','medieval'] },
  { id: 13032600342, name: 'Shield', category: 'weapon', keywords: ['shield','defense','block','armor','round','metal'], style: 'any', partCount: 3, description: 'Round shield with metal rim', tags: ['combat','defense','medieval'] },
  { id: 83063106594713, name: 'Blaster', category: 'weapon', keywords: ['blaster','gun','laser','sci-fi','ranged','shoot'], style: 'stylized', partCount: 6, description: 'Sci-fi blaster gun', tags: ['combat','sci-fi','ranged'] },
  { id: 123289713198454, name: 'Magic Staff', category: 'weapon', keywords: ['staff','magic','wizard','crystal','wand','mage'], style: 'stylized', partCount: 5, description: 'Magic staff with crystal top', tags: ['combat','magic','fantasy'] },

  // ═══ DECORATIONS (10) ═══
  { id: 110630131740771, name: 'Stone Fountain', category: 'decoration', keywords: ['fountain','water','stone','basin','garden','centerpiece'], style: 'realistic', partCount: 20, description: 'Stone fountain with water basin', tags: ['outdoor','garden','plaza'] },
  { id: 118183738265730, name: 'Street Light', category: 'decoration', keywords: ['streetlight','lamp','post','light','road','urban','city'], style: 'any', partCount: 6, description: 'Street light/lamp post', tags: ['outdoor','road','city'] },
  { id: 115661054277910, name: 'Park Bench', category: 'decoration', keywords: ['bench','park','seat','rest','wooden','outdoor'], style: 'any', partCount: 8, description: 'Wooden park bench', tags: ['outdoor','park','rest'] },
  { id: 4878545452, name: 'Mailbox', category: 'decoration', keywords: ['mailbox','mail','post','letter','residential','delivery'], style: 'any', partCount: 3, description: 'Post-mounted mailbox', tags: ['outdoor','residential'] },
  { id: 82414843910218, name: 'Wooden Sign', category: 'decoration', keywords: ['sign','wooden','post','direction','arrow','board'], style: 'any', partCount: 4, description: 'Wooden direction sign', tags: ['outdoor','direction'] },
  { id: 15947349441, name: 'Barrel', category: 'decoration', keywords: ['barrel','wooden','storage','medieval','wine','tavern'], style: 'any', partCount: 4, description: 'Wooden barrel with metal bands', tags: ['indoor','outdoor','medieval','storage'] },
  { id: 18288449140, name: 'Wooden Crate', category: 'decoration', keywords: ['crate','wooden','box','storage','cargo','shipping'], style: 'any', partCount: 3, description: 'Nailed wooden crate', tags: ['indoor','outdoor','storage'] },
  { id: 134767516942252, name: 'Flag on Pole', category: 'decoration', keywords: ['flag','pole','banner','waving','national','display'], style: 'any', partCount: 5, description: 'Flag on tall pole', tags: ['outdoor','display'] },
  { id: 94635543890032, name: 'Treasure Chest', category: 'decoration', keywords: ['treasure','chest','gold','coins','loot','pirate','reward'], style: 'stylized', partCount: 6, description: 'Treasure chest with gold coins', tags: ['indoor','reward','pirate','adventure'] },
  { id: 16218228, name: 'Apple', category: 'food', keywords: ['apple','fruit','red','food','healthy','snack'], style: 'any', partCount: 2, description: 'Red apple', tags: ['food','collectible'] },

  // ═══ FOOD & ITEMS (5) ═══
  { id: 109465656542766, name: 'Pizza', category: 'food', keywords: ['pizza','slice','cheese','pepperoni','food','italian'], style: 'cartoon', partCount: 3, description: 'Pizza slice with toppings', tags: ['food','collectible'] },
  { id: 98454090962886, name: 'Cake', category: 'food', keywords: ['cake','birthday','candles','layers','dessert','celebration'], style: 'cartoon', partCount: 5, description: 'Birthday cake with candles', tags: ['food','celebration'] },
  { id: 138594877902156, name: 'Potion', category: 'food', keywords: ['potion','bottle','magic','liquid','glass','drink','health'], style: 'stylized', partCount: 3, description: 'Potion bottle with colored liquid', tags: ['magic','collectible','fantasy'] },
  { id: 10145584609, name: 'Asset Pack', category: 'decoration', keywords: ['pack','bundle','campfire','well','wheat','workbench'], style: 'any', partCount: 50, description: 'Multi-asset pack: campfire, flower, well, wheat, statue, bush, lamp, workbench, tree, house', tags: ['outdoor','pack','multiple'] },
]

// ─── Keyword synonyms for better matching ───────────────────────────────────

const SYNONYMS: Record<string, string[]> = {
  sofa: ['couch'], couch: ['sofa'],
  automobile: ['car'], auto: ['car'],
  bike: ['bicycle'], cycle: ['bicycle'],
  chopper: ['helicopter'],
  boat: ['sailboat'], ship: ['sailboat'],
  tv: ['television'], telly: ['television'],
  fridge: ['refrigerator'],
  shrub: ['bush'], hedge: ['bush'],
  lantern: ['torch'], light: ['lamp', 'streetlight', 'torch'],
  monster: ['zombie'], enemy: ['zombie'],
  puppy: ['dog'], kitty: ['cat'], kitten: ['cat'],
  blade: ['sword'], bow: ['bow'],
  chest: ['treasure chest', 'crate'],
  rock: ['stone'], rocks: ['stone'],
}

// ─── Asset Matching ─────────────────────────────────────────────────────────

export function findMatchingAssets(
  query: string,
  category?: AssetCategory,
  style?: string,
  limit: number = 5
): AssetEntry[] {
  const queryLower = query.toLowerCase()
  let queryWords = queryLower.split(/\s+/).filter(w => w.length > 1)

  // Expand synonyms
  const expanded: string[] = [...queryWords]
  for (const word of queryWords) {
    const syns = SYNONYMS[word]
    if (syns) expanded.push(...syns)
  }
  queryWords = Array.from(new Set(expanded))

  let candidates = ASSET_LIBRARY
  if (category) candidates = candidates.filter(a => a.category === category)
  if (style) candidates = candidates.filter(a => a.style === style || a.style === 'any')

  const scored = candidates.map(asset => {
    let score = 0
    const searchable = [asset.name, asset.description, ...asset.keywords, ...asset.tags, asset.category].join(' ').toLowerCase()

    for (const word of queryWords) {
      if (searchable.includes(word)) score += 10
      if (asset.name.toLowerCase().includes(word)) score += 20
      if (asset.keywords.some(k => k === word)) score += 15
      if (asset.category === word) score += 25
    }

    if (asset.name.toLowerCase() === queryLower) score += 50
    return { asset, score }
  })

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.asset)
}

/**
 * Check if a simple prompt should use a library asset instead of AI generation.
 * Returns null for complex/custom requests — those need AI.
 */
export function shouldUseAsset(prompt: string): AssetEntry | null {
  // Skip if user wants something custom/unique
  if (/\b(custom|unique|special|my own|magical|enchanted|glowing|futuristic|steampunk|alien|crystal|neon|animated)\b/i.test(prompt)) {
    return null
  }
  // Skip if prompt is complex (long or has multiple objects)
  if (prompt.split(/\s+/).length > 12) return null
  if (/\b(and|with|that has|including|plus)\b/i.test(prompt)) return null

  // Simple placement patterns
  const isPlacement = /\b(add|place|put|insert|spawn|drop|set down)\s+(a|an|the|some|my)?\s/i.test(prompt)
  const isSingleObject = /\b(tree|car|truck|chair|table|lamp|bush|couch|bed|desk|sword|bow|shield|bench|fountain|sign|barrel|crate|flag|chest|apple|pizza|cake|potion|dog|cat|horse|bike|bicycle|skateboard|helicopter|boat|bookshelf|tv|fridge|mailbox|clock|torch|cactus|mushroom|fern|statue)\b/i.test(prompt)

  if (!isPlacement && !isSingleObject) return null

  const matches = findMatchingAssets(prompt, undefined, undefined, 1)
  return matches.length > 0 ? matches[0] : null
}

/**
 * Get all categories and their asset counts.
 */
export function getAssetCategories(): Array<{ category: string; count: number }> {
  const counts: Record<string, number> = {}
  for (const asset of ASSET_LIBRARY) {
    counts[asset.category] = (counts[asset.category] || 0) + 1
  }
  return Object.entries(counts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
}
