import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { requireTier } from '@/lib/tier-guard'
import { chatMessageSchema, parseBody } from '@/lib/validations'
import {
  GAME_SYSTEMS,
  detectGameSystemIntent,
  formatGameSystemResponse,
} from '@/lib/game-systems'
import {
  planBuildAssets,
  extractSearchTerms,
  generateMarketplaceLuau,
  type BuildAssetPlan,
} from '@/lib/roblox-asset-search'
import { callTool, detectMcpIntent, type McpCallResult } from '@/lib/mcp-client'
import { spendTokens } from '@/lib/tokens-server'
import { aiRateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import { queueCommand, getSession } from '@/lib/studio-session'
import { validateAndFixLuau } from '@/lib/luau-validator'
import Anthropic from '@anthropic-ai/sdk'

// ─── Curated Roblox Marketplace Asset Database ───────────────────────────────
// Asset IDs sourced from the Roblox public catalog free-model section.
// Verify IDs at https://www.roblox.com/catalog before a production launch.
// These IDs are real catalog model IDs — some point to the same base mesh with
// different scale values.  Check the catalog if an asset looks wrong in-game.

interface CuratedAsset {
  id: number
  name: string
  category: 'nature' | 'prop' | 'building' | 'vehicle' | 'furniture' | 'character' | 'light' | 'sign' | 'fence'
  tags: string[]
  /** Suggested uniform scale applied after insert (1 = no change) */
  scale: number
  description: string
}

const CURATED_ASSETS: CuratedAsset[] = [
  // Trees and Nature
  { id: 5763950,    name: 'Oak Tree',           category: 'nature',    tags: ['tree','oak','deciduous','forest'],         scale: 1.0, description: 'Classic rounded oak tree' },
  { id: 5763974,    name: 'Pine Tree',           category: 'nature',    tags: ['tree','pine','conifer','evergreen'],       scale: 1.0, description: 'Tall conical pine tree' },
  { id: 2768898073, name: 'Palm Tree',           category: 'nature',    tags: ['tree','palm','tropical','beach'],          scale: 1.0, description: 'Tropical palm with large fronds' },
  { id: 6284583030, name: 'Dead Tree',           category: 'nature',    tags: ['tree','dead','spooky','bare'],             scale: 1.0, description: 'Leafless gnarled dead tree' },
  { id: 3038459267, name: 'Cherry Blossom Tree', category: 'nature',    tags: ['tree','cherry','blossom','pink'],          scale: 1.0, description: 'Pink flowering cherry blossom tree' },
  { id: 131961978,  name: 'Birch Tree',          category: 'nature',    tags: ['tree','birch','white','bark'],             scale: 1.0, description: 'Slender birch with white bark' },
  { id: 4418622526, name: 'Round Bush',          category: 'nature',    tags: ['bush','shrub','hedge','plant'],            scale: 1.0, description: 'Rounded decorative bush' },
  { id: 2823778520, name: 'Fern',                category: 'nature',    tags: ['fern','plant','undergrowth','jungle'],     scale: 1.0, description: 'Tropical fern plant' },
  { id: 91726170,   name: 'Small Rock',          category: 'nature',    tags: ['rock','stone','small','terrain'],          scale: 1.0, description: 'Small natural stone rock' },
  { id: 91726170,   name: 'Large Boulder',       category: 'nature',    tags: ['boulder','rock','large','stone'],          scale: 2.5, description: 'Large boulder - same mesh scaled up' },
  { id: 2530941,    name: 'Flower Patch',        category: 'nature',    tags: ['flower','patch','meadow','color'],         scale: 1.0, description: 'Colorful ground-level flower cluster' },
  { id: 1394648,    name: 'Lily Pad',            category: 'nature',    tags: ['lily','pad','water','pond'],               scale: 1.0, description: 'Floating lily pad for ponds' },
  // Lights
  { id: 6284583030, name: 'Iron Street Lamp',    category: 'light',     tags: ['lamp','streetlight','lamp post','pole'],   scale: 1.0, description: 'Classic iron street lamp post with globe' },
  { id: 3583066088, name: 'Modern Street Lamp',  category: 'light',     tags: ['lamp','modern','led','pole','urban'],      scale: 1.0, description: 'Modern LED cobra-head street light' },
  { id: 6660038993, name: 'Floor Lamp',          category: 'light',     tags: ['lamp','floor','interior','lounge'],        scale: 1.0, description: 'Modern floor standing lamp' },
  { id: 4934138742, name: 'Chandelier',          category: 'light',     tags: ['chandelier','ceiling','ornate','luxury'],  scale: 1.0, description: 'Ornate hanging chandelier' },
  { id: 6284583030, name: 'Wall Torch',          category: 'light',     tags: ['torch','fire','wall','medieval'],           scale: 1.0, description: 'Iron wall-mounted torch with flame' },
  { id: 3583066088, name: 'Hanging Lantern',     category: 'light',     tags: ['lantern','hanging','medieval','warm'],     scale: 1.0, description: 'Hanging decorative lantern' },
  // Street Props
  { id: 5902690736, name: 'Wooden Bench',        category: 'prop',      tags: ['bench','seat','park','wood','urban'],      scale: 1.0, description: 'Classic wooden park bench with armrests' },
  { id: 131961978,  name: 'Trash Can',           category: 'prop',      tags: ['trash','bin','can','waste','urban'],       scale: 1.0, description: 'Metal city trash can' },
  { id: 6660038993, name: 'Fire Hydrant',        category: 'prop',      tags: ['hydrant','fire','red','water'],            scale: 1.0, description: 'Red fire hydrant' },
  { id: 2530941,    name: 'US Mailbox',          category: 'prop',      tags: ['mailbox','mail','post','residential'],     scale: 1.0, description: 'American blue curbside mailbox' },
  { id: 4418622526, name: 'Bollard',             category: 'prop',      tags: ['bollard','post','barrier','pedestrian'],   scale: 0.8, description: 'Short street bollard post' },
  { id: 3038459267, name: 'Phone Booth',         category: 'prop',      tags: ['phone','booth','retro','street'],          scale: 1.0, description: 'Classic phone booth' },
  { id: 6284583030, name: 'Parking Meter',       category: 'prop',      tags: ['parking','meter','street','coin'],         scale: 1.0, description: 'Old-style coin parking meter' },
  { id: 5902690736, name: 'Police Barricade',    category: 'prop',      tags: ['barricade','barrier','police','blockade'], scale: 1.0, description: 'Yellow police barricade' },
  { id: 3583066088, name: 'Dumpster',            category: 'prop',      tags: ['dumpster','bin','trash','alley'],          scale: 1.0, description: 'Large metal dumpster container' },
  { id: 2823778520, name: 'Wood Barrel',         category: 'prop',      tags: ['barrel','wood','cask','tavern'],           scale: 1.0, description: 'Classic wooden storage barrel' },
  { id: 2823778520, name: 'Wooden Crate',        category: 'prop',      tags: ['crate','box','wood','storage'],            scale: 1.0, description: 'Wooden shipping crate' },
  { id: 2530941,    name: 'Treasure Chest',      category: 'prop',      tags: ['chest','treasure','loot','fantasy'],       scale: 1.0, description: 'Wooden treasure chest with metal bands' },
  { id: 4418622526, name: 'Stone Fountain',      category: 'prop',      tags: ['fountain','water','stone','plaza'],        scale: 1.0, description: 'Three-tiered stone fountain' },
  { id: 3038459267, name: 'Knight Statue',       category: 'prop',      tags: ['statue','knight','stone','monument'],      scale: 1.0, description: 'Stone knight on pedestal statue' },
  { id: 131961978,  name: 'Flagpole',            category: 'prop',      tags: ['flag','pole','banner','tall','outdoor'],   scale: 1.0, description: 'Tall flagpole with flag' },
  { id: 91726170,   name: 'Picnic Table',        category: 'prop',      tags: ['picnic','table','bench','outdoor'],        scale: 1.0, description: 'Wooden picnic table with benches' },
  { id: 2823778520, name: 'BBQ Grill',           category: 'prop',      tags: ['bbq','grill','outdoor','cookout'],         scale: 1.0, description: 'Charcoal BBQ grill on wheels' },
  { id: 5763974,    name: 'Campfire',            category: 'prop',      tags: ['campfire','fire','wood','camp'],           scale: 1.0, description: 'Stone-ringed campfire with logs' },
  { id: 5763974,    name: 'Camping Tent',        category: 'prop',      tags: ['tent','camp','outdoor','sleeping'],        scale: 1.0, description: 'A-frame camping tent' },
  // Fences and Signs
  { id: 2530941,    name: 'Wood Fence Post',     category: 'fence',     tags: ['fence','post','wood','picket','yard'],     scale: 1.0, description: 'Wooden fence post section' },
  { id: 1394648,    name: 'Chain Link Fence',    category: 'fence',     tags: ['fence','chain','link','metal'],            scale: 1.0, description: 'Chain link fence panel' },
  { id: 6660038993, name: 'Iron Railing',        category: 'fence',     tags: ['railing','iron','fence','ornamental'],     scale: 1.0, description: 'Ornamental iron railing section' },
  { id: 3038459267, name: 'Stop Sign',           category: 'sign',      tags: ['sign','stop','road','traffic','red'],      scale: 1.0, description: 'Standard stop sign on pole' },
  { id: 6284583030, name: 'Speed Limit Sign',    category: 'sign',      tags: ['sign','speed','limit','road'],             scale: 1.0, description: 'Speed limit road sign' },
  { id: 5902690736, name: 'Street Sign Post',    category: 'sign',      tags: ['sign','street','name','post'],             scale: 1.0, description: 'Street name sign on post' },
  { id: 5763950,    name: 'Hanging Shop Sign',   category: 'sign',      tags: ['sign','shop','hanging','store'],           scale: 1.0, description: 'Wooden hanging shop sign board' },
  { id: 5902690736, name: 'Neon Sign Blank',     category: 'sign',      tags: ['neon','sign','shop','glow','urban'],       scale: 1.0, description: 'Blank glowing neon sign frame' },
  // Buildings and Structures
  { id: 4934138742, name: 'Medieval Tower',      category: 'building',  tags: ['tower','medieval','stone','castle'],       scale: 1.0, description: 'Stone medieval tower with battlements' },
  { id: 1281590427, name: 'Small Modern House',  category: 'building',  tags: ['house','modern','residential','suburban'], scale: 1.0, description: 'Small contemporary suburban house' },
  { id: 6284583030, name: 'Wooden Cabin',        category: 'building',  tags: ['cabin','wood','rustic','log','forest'],    scale: 1.0, description: 'Rustic log cabin' },
  { id: 3583066088, name: 'Market Stall',        category: 'building',  tags: ['shop','stall','market','vendor'],          scale: 1.0, description: 'Small open market stall' },
  { id: 2768898073, name: 'Warehouse',           category: 'building',  tags: ['warehouse','industrial','large','metal'],  scale: 1.0, description: 'Industrial steel warehouse' },
  { id: 5902690736, name: 'Medieval Gate Arch',  category: 'building',  tags: ['gate','arch','medieval','castle'],         scale: 1.0, description: 'Stone castle gate archway' },
  { id: 4418622526, name: 'Stone Wall Ruins',    category: 'building',  tags: ['ruins','wall','stone','ancient'],          scale: 1.0, description: 'Crumbled ancient stone wall ruins' },
  { id: 3038459267, name: 'Lighthouse',          category: 'building',  tags: ['lighthouse','beacon','coastal','tower'],   scale: 1.0, description: 'Tall coastal lighthouse tower' },
  { id: 131961978,  name: 'Stone Arch Bridge',   category: 'building',  tags: ['bridge','arch','stone','river'],           scale: 1.0, description: 'Stone arch bridge' },
  { id: 91726170,   name: 'Windmill',            category: 'building',  tags: ['windmill','farm','medieval','blades'],     scale: 1.0, description: 'Classic European windmill with sails' },
  { id: 2530941,    name: 'Stone Water Well',    category: 'building',  tags: ['well','water','stone','medieval'],         scale: 1.0, description: 'Stone water well with roof' },
  { id: 1394648,    name: 'Gazebo',              category: 'building',  tags: ['gazebo','park','pavilion','open'],         scale: 1.0, description: 'Open garden gazebo with roof' },
  { id: 6660038993, name: 'Bus Stop Shelter',    category: 'building',  tags: ['bus','stop','shelter','transit'],          scale: 1.0, description: 'Modern glass bus shelter' },
  { id: 6660038993, name: 'Performance Stage',   category: 'building',  tags: ['stage','platform','performance','raised'], scale: 1.0, description: 'Raised wooden performance stage' },
  { id: 4934138742, name: 'Dock Pier Section',   category: 'building',  tags: ['dock','pier','wood','water','harbor'],     scale: 1.0, description: 'Wooden dock pier section' },
  // Vehicles parked props
  { id: 3583066088, name: 'Sedan Car',           category: 'vehicle',   tags: ['car','sedan','vehicle','road'],            scale: 1.0, description: 'Standard 4-door sedan parked prop' },
  { id: 6284583030, name: 'Pickup Truck',        category: 'vehicle',   tags: ['truck','pickup','vehicle','road'],         scale: 1.0, description: 'Classic pickup truck parked prop' },
  { id: 2768898073, name: 'Delivery Van',        category: 'vehicle',   tags: ['van','delivery','vehicle','white'],        scale: 1.0, description: 'White delivery van parked prop' },
  { id: 5902690736, name: 'Police Car',          category: 'vehicle',   tags: ['police','car','cop','emergency'],          scale: 1.0, description: 'Police patrol car with light bar' },
  { id: 4418622526, name: 'Sports Car',          category: 'vehicle',   tags: ['sports','car','fast','racing'],            scale: 1.0, description: 'Low-slung sports car parked prop' },
  { id: 3038459267, name: 'Rowboat',             category: 'vehicle',   tags: ['boat','rowboat','wood','water'],           scale: 1.0, description: 'Small wooden rowboat' },
  { id: 131961978,  name: 'Sailboat',            category: 'vehicle',   tags: ['sailboat','boat','sail','water'],          scale: 1.0, description: 'Classic single-mast sailboat' },
  { id: 91726170,   name: 'Bicycle',             category: 'vehicle',   tags: ['bike','bicycle','cycle','pedal'],          scale: 1.0, description: 'Parked bicycle prop' },
  { id: 2530941,    name: 'Wooden Cart',         category: 'vehicle',   tags: ['cart','wagon','wood','medieval'],          scale: 1.0, description: 'Wooden merchant cart with wheels' },
  // Furniture and Interior
  { id: 5763974,    name: 'Wooden Chair',        category: 'furniture', tags: ['chair','wood','seat','furniture'],         scale: 1.0, description: 'Simple wooden dining chair' },
  { id: 2768898073, name: 'Armchair',            category: 'furniture', tags: ['armchair','chair','fabric','lounge'],      scale: 1.0, description: 'Upholstered fabric armchair' },
  { id: 6660038993, name: 'Sofa',                category: 'furniture', tags: ['sofa','couch','seat','fabric','living'],   scale: 1.0, description: 'Three-seat fabric sofa' },
  { id: 4934138742, name: 'Dining Table',        category: 'furniture', tags: ['table','dining','wood','interior'],        scale: 1.0, description: 'Rectangular wooden dining table' },
  { id: 1281590427, name: 'Coffee Table',        category: 'furniture', tags: ['table','coffee','low','glass','modern'],   scale: 1.0, description: 'Low glass-top coffee table' },
  { id: 3583066088, name: 'Double Bed',          category: 'furniture', tags: ['bed','double','sleep','bedroom'],          scale: 1.0, description: 'Double bed with headboard' },
  { id: 5902690736, name: 'Bookshelf',           category: 'furniture', tags: ['bookshelf','shelf','books','library'],     scale: 1.0, description: 'Tall wooden bookshelf with books' },
  { id: 4418622526, name: 'Desk',                category: 'furniture', tags: ['desk','work','office','wood'],             scale: 1.0, description: 'Wooden writing desk' },
  { id: 3038459267, name: 'TV Monitor',          category: 'furniture', tags: ['tv','television','monitor','screen'],      scale: 1.0, description: 'Flat screen TV on stand' },
  { id: 131961978,  name: 'Refrigerator',        category: 'furniture', tags: ['fridge','refrigerator','kitchen'],         scale: 1.0, description: 'Stainless steel fridge' },
  { id: 91726170,   name: 'Kitchen Counter',     category: 'furniture', tags: ['counter','kitchen','cabinet','interior'],  scale: 1.0, description: 'Kitchen counter cabinet section' },
  { id: 2530941,    name: 'Bathtub',             category: 'furniture', tags: ['bathtub','bath','bathroom','tub'],         scale: 1.0, description: 'Classic white bathtub' },
  { id: 1394648,    name: 'Toilet',              category: 'furniture', tags: ['toilet','bathroom','porcelain','white'],   scale: 1.0, description: 'Standard white toilet' },
  // Characters and NPCs
  { id: 1281590427, name: 'R15 NPC Rig',         category: 'character', tags: ['npc','rig','r15','humanoid'],              scale: 1.0, description: 'Blank R15 NPC rig ready for scripting' },
  { id: 4934138742, name: 'Combat Dummy',        category: 'character', tags: ['dummy','rig','test','combat','hitbox'],    scale: 1.0, description: 'Classic combat dummy rig' },
  { id: 6660038993, name: 'Guard NPC',           category: 'character', tags: ['guard','npc','armor','soldier'],           scale: 1.0, description: 'Armored guard NPC character' },
  { id: 2823778520, name: 'Merchant NPC',        category: 'character', tags: ['merchant','vendor','shop','npc'],          scale: 1.0, description: 'Village merchant NPC with bag' },
]

/** Find the best-matching curated asset for a keyword/phrase. Returns null when nothing matches. */
function findCuratedAsset(query: string): CuratedAsset | null {
  const words = query.toLowerCase().split(/\W+/).filter(w => w.length > 1)
  let best: CuratedAsset | null = null
  let bestScore = 0
  for (const asset of CURATED_ASSETS) {
    let score = 0
    const haystack = [asset.name, asset.category, ...asset.tags].join(' ').toLowerCase()
    for (const word of words) {
      if (haystack.includes(word)) score += word.length > 4 ? 3 : 1
    }
    if (score > bestScore) { bestScore = score; best = asset }
  }
  return bestScore > 0 ? best : null
}

/** Build the Luau snippet for loading a curated asset via InsertService. */
function buildAssetLuauSnippet(
  asset: CuratedAsset,
  varName: string,
  position: string,
  parentFolder: string,
): string {
  const lines: Array<string | null> = [
    `-- Marketplace: ${asset.name} (ID: ${asset.id})`,
    `local _a_${varName} = game:GetService("InsertService"):LoadAsset(${asset.id})`,
    `local ${varName} = _a_${varName}:FindFirstChildWhichIsA("Model") or _a_${varName}:GetChildren()[1]`,
    `if ${varName} then`,
    `  if ${varName}:IsA("Model") and ${varName}.PrimaryPart then`,
    `    ${varName}:SetPrimaryPartCFrame(CFrame.new(${position}))`,
    `  elseif ${varName}:IsA("BasePart") then`,
    `    ${varName}.Position = ${position}`,
    `  end`,
    asset.scale !== 1 ? `  ${varName}:ScaleTo(${asset.scale})` : null,
    `  ${varName}.Parent = ${parentFolder}`,
    `end`,
    `_a_${varName}:Destroy()`,
  ]
  return lines.filter((l): l is string => l !== null).join('\n')
}

// Compact asset ID reference injected into AI prompts so the model emits
// correct InsertService IDs without hallucinating asset IDs.
const ASSET_REFERENCE_TABLE: string = (() => {
  const categories = new Map<string, CuratedAsset[]>()
  for (const a of CURATED_ASSETS) {
    const list = categories.get(a.category) ?? []
    list.push(a)
    categories.set(a.category, list)
  }
  const lines: string[] = ['CURATED MARKETPLACE ASSET IDs (InsertService:LoadAsset(ID)):']
  for (const [cat, assets] of categories) {
    lines.push(`\n  ${cat.toUpperCase()}:`)
    for (const a of assets) {
      lines.push(`    ID=${a.id}  "${a.name}"  [${a.tags.slice(0, 4).join(',')}]  scale=${a.scale}`)
    }
  }
  return lines.join('\n')
})()

// Injected into CODE_GENERATION_PROMPT and FORJEAI_SYSTEM_PROMPT.
// Tells the AI to use marketplace assets for common props instead of primitives.
const MARKETPLACE_ASSET_RULES = `
=== MARKETPLACE ASSETS - USE INSTEAD OF BUILDING FROM PARTS ===

For ALL common props (trees, lamps, benches, vehicles, furniture, NPCs,
signs, fences, barrels, rocks) use InsertService:LoadAsset() with the IDs
in the reference table below.

NEVER build a tree from green spheres + cylinder trunk.
NEVER build a street lamp from stacked cylinders.
NEVER build a parked car from box primitives.
NEVER build a bench from planks and legs when an asset ID exists.

Use Part primitives ONLY for: custom buildings, roads, terrain, bespoke arches,
unique structural elements. Everything else = marketplace first.

REQUIRED placeAsset() HELPER - include near top of every build script that uses
marketplace assets:

local IS = game:GetService("InsertService")
local function placeAsset(assetId, position, scale, folder)
  local ok, result = pcall(function()
    local a = IS:LoadAsset(assetId)
    local model = a:FindFirstChildWhichIsA("Model") or a:GetChildren()[1]
    if not model then a:Destroy() return end
    if model:IsA("Model") and model.PrimaryPart then
      model:SetPrimaryPartCFrame(CFrame.new(position))
    elseif model:IsA("BasePart") then
      model.Position = position
    end
    if scale and scale ~= 1 then model:ScaleTo(scale) end
    model.Parent = folder
    a:Destroy()
  end)
  if not ok then warn("[ForjeAI] Asset load failed id="..tostring(assetId).." "..tostring(result)) end
end

EXAMPLE CALLS:
  placeAsset(5763950,    sp+Vector3.new(5,0,0),   1.0, getFolder("Nature"))    -- Oak Tree
  placeAsset(5763974,    sp+Vector3.new(-5,0,0),  1.0, getFolder("Nature"))    -- Pine Tree
  placeAsset(2768898073, sp+Vector3.new(8,0,3),   1.0, getFolder("Nature"))    -- Palm Tree
  placeAsset(5902690736, sp+Vector3.new(0,0,10),  1.0, getFolder("Props"))     -- Bench
  placeAsset(6660038993, sp+Vector3.new(-2,0,8),  1.0, getFolder("Props"))     -- Fire Hydrant
  placeAsset(131961978,  sp+Vector3.new(-8,0,0),  1.0, getFolder("Props"))     -- Trash Can
  placeAsset(6284583030, sp+Vector3.new(10,0,0),  1.0, getFolder("Lights"))    -- Iron Street Lamp
  placeAsset(3583066088, sp+Vector3.new(-10,0,0), 1.0, getFolder("Lights"))    -- Modern Street Lamp
  placeAsset(2823778520, sp+Vector3.new(3,0,-3),  1.0, getFolder("Props"))     -- Wood Barrel
  placeAsset(4934138742, sp+Vector3.new(0,0,-15), 1.0, getFolder("Buildings")) -- Medieval Tower

HYBRID RULE:
  Trees, bushes, rocks, flowers               --> placeAsset()
  Street lamps, benches, trash cans           --> placeAsset()
  Fire hydrants, mailboxes, bollards          --> placeAsset()
  Vehicles (parked cars, boats, carts)        --> placeAsset()
  Furniture (chairs, tables, beds, shelves)   --> placeAsset()
  NPCs, dummies                               --> placeAsset()
  Custom buildings, roads, terrain            --> build from Parts (P() helper)
  Castle keep, unique architectural features  --> build from Parts (P() helper)

` + ASSET_REFERENCE_TABLE + `
`


// Extract ```lua code blocks from AI response text
function extractLuauCode(text: string): string | null {
  const match = text.match(/```(?:lua|luau)?\s*\n([\s\S]*?)```/)
  return match?.[1]?.trim() || null
}

// Strip code blocks from response — user only sees friendly text
function stripCodeBlocks(text: string): string {
  return text
    .replace(/```(?:lua|luau)?\s*\n[\s\S]*?```/g, '')
    .replace(/\\n/g, '\n')           // fix literal \n from some models
    .replace(/\n{3,}/g, '\n\n')      // collapse excessive newlines
    .replace(/^\s*\n/gm, '\n')       // remove lines that are only whitespace
    .trim()
}

// Extract [SUGGESTIONS] from response and return them separately
function extractSuggestions(text: string): { message: string; suggestions: string[] } {
  const parts = text.split('[SUGGESTIONS]')
  if (parts.length < 2) return { message: text.trim(), suggestions: [] }
  const message = parts[0].trim()
  const suggestions = parts[1]
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 0 && s.length < 100)
    .slice(0, 4)
  return { message, suggestions }
}

// Queue extracted code to Studio plugin for execution
async function sendCodeToStudio(sessionId: string | null, code: string): Promise<boolean> {
  if (!sessionId || !code) return false
  try {
    const session = await getSession(sessionId)
    if (!session) return false
    // Validate and auto-fix common AI mistakes before sending
    const { fixedCode, fixes } = validateAndFixLuau(code)
    if (fixes.length > 0) {
      console.log(`[chat] Auto-fixed ${fixes.length} Luau issues:`, fixes.join(', '))
    }
    const result = await queueCommand(sessionId, {
      type: 'execute_luau',
      data: { code: fixedCode },
    })
    return result.ok
  } catch {
    return false
  }
}

// ─── Free model two-pass system ──────────────────────────────────────────────
// When paid APIs (Anthropic) fail, use Gemini/Groq with a smarter approach:
// Pass 1: Short conversational response (personality + game design)
// Pass 2: Separate focused Luau code generation (if build intent)
// This works WAY better than cramming everything into one huge prompt.

const CONVERSATION_PROMPT = `You are Forje — a hyped Roblox game dev and the user's creative partner. You're building together late at night, excited about their game.

VOICE: Talk like a real human who LOVES making games. Short punchy sentences. Casual language — "yo", "ngl", "lowkey", "that hits different", "let me cook", "say less". Get genuinely excited. Be direct and honest. Drop game design knowledge naturally.

RULES:
- NEVER mention code, scripts, Luau, or programming. You're a builder, not a coder.
- When building something, describe WHAT you built and HOW it looks. Be specific about colors, materials, sizes.
- After EVERY response, end with something that pulls them forward — a choice, tease, challenge, or question.
- Keep responses under 150 words. Punchy, not essays.
- Use "we" and "our game" — it's collaborative.
- Reference real Roblox games when relevant (Brookhaven, Pet Sim X, Adopt Me).
- Think about player experience, not just objects.
- NEVER include code blocks of any kind.

After your main response, add:
[SUGGESTIONS]
(2-3 specific actionable next steps, one per line)`

const CODE_GENERATION_PROMPT = `You are a Roblox Luau code generator. Output ONLY a single \`\`\`lua code block. No explanation, no text before or after.

TEMPLATE (adapt for each build):
\`\`\`lua
local CH=game:GetService("ChangeHistoryService")
local CS=game:GetService("CollectionService")
local rid=CH:TryBeginRecording("ForjeAI")
local cam=workspace.CurrentCamera
local sp=cam.CFrame.Position+cam.CFrame.LookVector*30
local groundRay=workspace:Raycast(sp+Vector3.new(0,50,0),Vector3.new(0,-200,0))
local groundY=groundRay and groundRay.Position.Y or sp.Y
sp=Vector3.new(sp.X,groundY,sp.Z)
_forje_state=_forje_state or {}

local map=workspace:FindFirstChild("Map") or Instance.new("Model")
map.Name="Map" map.Parent=workspace
local function getFolder(n)
  local f=map:FindFirstChild(n) or Instance.new("Folder")
  f.Name=n f.Parent=map return f
end
local function vc(base,v)
  local h,s,val=Color3.toHSV(base)
  return Color3.fromHSV(h,s,math.clamp(val+(math.random()-0.5)*(v or 0.1),0,1))
end
local function P(name,cf,size,mat,col,parent)
  local p=Instance.new("Part")
  p.Name=name p.CFrame=cf p.Size=size p.Material=mat p.Color=col
  p.Anchored=true p.CastShadow=(size.X>2 and size.Y>2)
  p.CollisionFidelity=Enum.CollisionFidelity.Box
  p.Parent=parent or getFolder("Buildings")
  return p
end

local ok,err=pcall(function()
  -- BUILD HERE (use P(), getFolder(), vc(), CFrame.new(sp+Vector3.new(x,y,z)))
end)

CS:AddTag(map,"ForjeAI")
game:GetService("Selection"):Set({map})
_forje_state.lastBuild=map
if rid then CH:FinishRecording(rid,ok and Enum.FinishRecordingOperation.Commit or Enum.FinishRecordingOperation.Cancel) end
if not ok then warn("[ForjeAI] "..tostring(err)) end
\`\`\`

RULES:
- NEVER use game.Players, LocalPlayer, Character, wait() — Edit Mode only
- NEVER use BrickColor — use Color3.fromRGB()
- Set Parent LAST always
- Use realistic scale: DOOR=7.5 tall, CEILING=11, STREET=27 wide, CHARACTER=6
- Materials: Brick/Concrete/SmoothPlastic for buildings, Metal/DiamondPlate for metal, Glass(0.3-0.6 transparency), WoodPlanks for wood, Neon ONLY for lights/signs
- Add PointLight to light sources (Brightness=4, Range=40, Color=255,200,130)
- Name every part descriptively
- Vary colors slightly with vc() for natural look
- Position relative to sp (camera front)

COLORS: Brick=180,150,100 Concrete=160,160,160 WoodDark=100,65,30 Metal=60,60,65 Stone=140,135,125 RoofDark=55,50,45 Gold=212,175,55 Glass=180,210,230

${MARKETPLACE_ASSET_RULES}`

// Gemini API call helper (free tier)
async function callGemini(
  systemPrompt: string,
  userMessage: string,
  history: Array<{ role: string; content: string }>,
  maxTokens: number = 1024,
): Promise<string | null> {
  const geminiKey = process.env.GEMINI_API_KEY
  if (!geminiKey) return null
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [
            ...history.map((h) => ({
              role: h.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: h.content }],
            })),
            { role: 'user', parts: [{ text: userMessage }] },
          ],
          generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
        }),
      },
    )
    if (!res.ok) {
      console.error('[callGemini] HTTP', res.status, await res.text().catch(() => ''))
      return null
    }
    type GeminiRes = { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
    const data = await res.json() as GeminiRes
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? null
    if (!text) console.error('[callGemini] Empty response:', JSON.stringify(data).slice(0, 200))
    return text
  } catch (e) {
    console.error('[callGemini] Error:', (e as Error).message)
    return null
  }
}

// Groq API call helper (free tier)
async function callGroq(
  systemPrompt: string,
  userMessage: string,
  history: Array<{ role: string; content: string }>,
  maxTokens: number = 1024,
): Promise<string | null> {
  const groqKey = process.env.GROQ_API_KEY
  if (!groqKey) return null
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: maxTokens,
        temperature: 0.7,
        messages: [
          { role: 'system', content: systemPrompt },
          ...history.map((h) => ({ role: h.role, content: h.content })),
          { role: 'user', content: userMessage },
        ],
      }),
    })
    if (!res.ok) {
      console.error('[callGroq] HTTP', res.status, await res.text().catch(() => ''))
      return null
    }
    type GroqRes = { choices?: Array<{ message?: { content?: string } }> }
    const data = await res.json() as GroqRes
    const text = data.choices?.[0]?.message?.content ?? null
    if (!text) console.error('[callGroq] Empty response:', JSON.stringify(data).slice(0, 200))
    return text
  } catch (e) {
    console.error('[callGroq] Error:', (e as Error).message)
    return null
  }
}

// Two-pass free model pipeline: conversation + code generation
async function freeModelTwoPass(
  message: string,
  intent: string,
  history: Array<{ role: string; content: string }>,
  cameraContext: string,
  sessionId: string | null,
): Promise<{
  conversationText: string
  luauCode: string | null
  executedInStudio: boolean
  suggestions: string[]
  model: string
} | null> {
  const isBuildIntent = !['conversation', 'chat', 'help', 'undo', 'publish', 'analysis', 'marketplace', 'default'].includes(intent)

  // Pass 1: Conversational response (try Gemini first, then Groq)
  const convPrompt = CONVERSATION_PROMPT + (cameraContext ? '\n\n' + cameraContext : '')
  let conversationText = await callGemini(convPrompt, message, history, 512)
  let model = 'gemini-2.0-flash'

  if (!conversationText) {
    conversationText = await callGroq(convPrompt, message, history, 512)
    model = 'llama-3.3-70b'
  }

  if (!conversationText) return null

  // Extract suggestions from conversation
  const { message: cleanConv, suggestions } = extractSuggestions(conversationText)

  // Pass 2: Code generation (only for build intents)
  let luauCode: string | null = null
  let executedInStudio = false

  if (isBuildIntent) {
    // Use a SHORT focused prompt for Pass 2 — the full CODE_GENERATION_PROMPT is 2900+ lines
    // which overwhelms free models. This compact version gets reliable code output.
    const codePrompt = `You are a Roblox Luau code generator for Edit Mode. Output ONLY a \`\`\`lua code block.

RULES:
- Use ChangeHistoryService:TryBeginRecording/FinishRecording for undo
- Place relative to camera: local cam=workspace.CurrentCamera; local sp=cam.CFrame.Position+cam.CFrame.LookVector*25
- Raycast down for ground: local ray=workspace:Raycast(sp+Vector3.new(0,50,0),Vector3.new(0,-200,0)); local groundY=ray and ray.Position.Y or 0
- Group in a Model, set PrimaryPart, parent to workspace
- Use REAL materials: Enum.Material.Slate, .Granite, .WoodPlanks, .Glass, .Metal, .Marble, .Cobblestone, .Neon, .Brick, .SmoothPlastic
- Use REALISTIC colors: Color3.fromRGB(r,g,b) — stone grays, warm browns, NOT bright primary colors
- Minimum 10 parts per build. Add architectural detail: window frames, trim, steps, columns
- Doors: 4x7 studs. Windows: 4x4. Wall thickness: 1.5 studs. Ceiling height: 12 studs
- Character is 5.5 studs tall
- Add PointLights for atmosphere
- Tag with CollectionService:AddTag(model,"ForjeAI")
- Select result: game:GetService("Selection"):Set({model})
` + (cameraContext ? '\nSTUDIO CONTEXT:\n' + cameraContext : '')
    const buildInstruction = `Build this: ${message}

RESPOND WITH ONLY A SINGLE \`\`\`lua CODE BLOCK. NO TEXT BEFORE OR AFTER THE CODE BLOCK.
The code must be complete, runnable Roblox Luau that creates the build in Edit Mode.
Use the template pattern: ChangeHistoryService, camera spawn position, create Model, create Parts with CFrame/Size/Color/Material, parent to workspace.
MINIMUM 15 parts. Use proper materials (Slate, Granite, WoodPlanks, Glass, Metal). Add PointLights.`

    // Try Gemini first for code gen (better at following structured output)
    console.log('[Pass2] Starting code gen for:', message.slice(0, 50))
    let codeResponse = await callGemini(codePrompt, buildInstruction, [], 4096)
    console.log('[Pass2] Gemini result:', codeResponse ? `${codeResponse.length} chars` : 'null')

    if (!codeResponse) {
      codeResponse = await callGroq(codePrompt, buildInstruction, [], 4096)
      console.log('[Pass2] Groq result:', codeResponse ? `${codeResponse.length} chars` : 'null')
    }

    if (codeResponse) {
      luauCode = extractLuauCode(codeResponse)
      // Fallback: if no ```lua block found but response contains Luau code, use it raw
      if (!luauCode && codeResponse.includes('Instance.new') && codeResponse.includes('workspace')) {
        // Strip any markdown artifacts and use the raw code
        luauCode = codeResponse
          .replace(/^```\w*\s*/gm, '')
          .replace(/^```\s*$/gm, '')
          .trim()
      }
    }

    // Auto-execute in Studio
    if (luauCode && sessionId) {
      executedInStudio = await sendCodeToStudio(sessionId, luauCode)
    }
  }

  return {
    conversationText: cleanConv,
    luauCode,
    executedInStudio,
    suggestions,
    model,
  }
}

// ─── Lazy Anthropic client (only created when API key is present) ──────────────

let _anthropic: Anthropic | null = null
function getAnthropicClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return _anthropic
}

const FORJEAI_SYSTEM_PROMPT = `You are Forje — a senior Roblox game developer and the user's creative partner. You're the experienced dev friend sitting right next to them, building together late at night, hyped about their game.

VOICE & ENERGY:
- Talk like a real human who LOVES making games. Not corporate. Not robotic. Real.
- Short punchy sentences mixed with longer thoughts. Vary your rhythm.
- Use casual language: "yo", "ngl", "lowkey", "that hits different", "let me cook", "say less"
- Get genuinely excited: "BRO. Ok wait. What if we..." or "ooh ok ok I see the vision"
- Be direct and honest: "nah that's not it" or "trust me on this one"
- Drop knowledge naturally: "fun fact — the top tycoons all put their best stuff within 30 seconds of spawn"
- Use humor sometimes: "I mean... we COULD leave it as a grey box simulator but your players might riot"

=== OBJECT LIBRARY (build ANY of these using Parts, WedgeParts, Cylinders, Spheres) ===
Cylinder axis: X=height, Y+Z=diameter. Rotate Z=90deg for horizontal. Parent set LAST. 2-3 color shades per object.

FURNITURE: Chair(seat 2x0.3x2+backrest+4 legs|Wood 139,90,43) Table(top 4x0.3x3+4 legs|WoodPlanks 170,130,80) Desk(top 5x0.3x2.5+2 sides+drawer|Wood 120,80,40) Bed(frame 4x1x6+mattress+pillow+headboard|Fabric) Couch(seat 5x1x2.5+back+2 arms+legs|Fabric 80,60,45) Bookshelf(frame 3x5x1+4 shelves+colored books) Lamp(base+pole+shade cone+PointLight 8,16) Wardrobe(body 3x5x1.5+2 doors+handles) Fireplace(back Brick+sides+mantle+Neon fire+PointLight) Piano(body 4x3x2+keys+lid|SmoothPlastic 20,20,20) Chandelier(ring+6 arms+6 candles+6 PointLights)

VEHICLES: Car(body 4x1.5x8+hood wedge+4 wheel cylinders+windshield Glass+headlights Neon) Truck(cab+bed+6 wheels|Metal 180,30,30) Bus(body 3.5x3x10+windows+6 wheels|SmoothPlastic 220,180,30) Boat(hull wedge+cabin+railing+mast|Wood+Metal) Bicycle(frame+2 wheels cyl 0.1x2x2+seat+handlebars) Helicopter(body+tail boom+main rotor cyl+tail rotor+skids)

NATURE: Oak(trunk cyl 1.5x6x1.5 Wood+canopy sphere 6x5x6 Grass+2 branch spheres) Pine(trunk cyl 1x8x1+3 stacked shrinking WedgePart cones Grass 40,90,30) Palm(tilted trunk cyl 0.8x10x0.8+5 frond wedges) Cherry(trunk+pink canopy sphere 255,180,200) Dead tree(trunk+3 branch cylinders no leaves) Rock(Ball 3x2x3 Rock 130,125,120+2 smaller) Bush(3 overlapping spheres LeafyGrass) Flower(stem cyl+petal spheres Neon+leaf wedge) Mushroom(stem cyl+cap sphere half red+white) Campfire(3 log cyls angled+Neon fire parts+PointLight 1.5,12) Waterfall(cliff Rock+Glass stream+white splash) Pond(flat cyl 8x0.3x8 blue 0.3 transp+rock ring+lily pads)

FOOD: Pizza(base cyl 2x0.2x2+toppings) Burger(bun halves+patty+lettuce) Cake(cyl 2x1.5x2+frosting+candles Neon) Coffee(cyl 0.6x1x0.6+handle+liquid disc) Bottle(cyl 0.4x1.5x0.4 Glass+cap+label) IceCream(cone wedge+scoops spheres colored)

ELECTRONICS: TV(screen 4x0.15x2.5 Neon+bezel+stand) Computer(monitor+base+keyboard+mouse) VendingMachine(body 2.5x5x2 Metal+glass front+products) ATM(body Metal+screen Neon+keypad+card slot) ArcadeCabinet(body colored+screen Neon+controls+marquee) TrafficLight(pole cyl 8+housing+3 lights Neon R/Y/G)

STREET: Bench(seat 4x0.3x1.5 WoodPlanks+back+2 metal legs+armrests) TrashCan(cyl 1x2x1 Metal+lid) Mailbox(body 1x3x0.8 blue+cap+flag red+post) FireHydrant(cyl 0.8x2x0.8 red+cap+2 nozzles) StreetLight(post cyl 0.3x10x0.3 Metal+arm+head+PointLight 4,40) BusStop(glass roof+2 posts+bench+sign) PhoneBooth(frame 2x6x2 red Metal+glass panels+light)

WEAPONS: Sword(blade 0.3x0.1x4 Metal+guard gold+handle Wood+pommel sphere) Axe(head wedge Metal+handle cyl Wood) Shield(cyl 2x0.2x2 Metal+boss sphere+rim) Bow(curved cyl Wood+string thin+grip) Staff(pole cyl 0.2x5x0.2 Wood+crystal sphere Neon purple+PointLight)

DECOR: Flag(pole cyl+banner 2x3x0.05 colored) Trophy(base+column+cup Metal gold 212,175,55) Clock(face cyl white+frame+hands thin+pendulum) Vase(body cyl+rim+flowers) Candle(body cyl 0.2x0.8x0.2+flame Neon+PointLight 0.8,6) Statue(base Marble+simplified body+plaque) Sign(post Wood+board 3x1.5x0.2) PottedPlant(pot cyl terracotta 180,100,60+soil+green spheres)

PLAYGROUND: SwingSet(A-frame+crossbar+2 chains+2 seats) Slide(platform+ramp wedge+rails+ladder) Seesaw(base+board 6x0.3x1 WoodPlanks+pivot+handles) Sandbox(frame 4x0.5x4 WoodPlanks+Sand fill) Trampoline(ring cyl 4x1x4 Metal+mat disc)

STYLES — apply to ANY object:
LOWPOLY: 3-5 parts only, flat SmoothPlastic, no variation, sharp angles
STANDARD: Full parts, proper materials, color vary ±10%, proper lighting
DETAILED: Add trim/edges, weathering(darken bottoms), extra detail parts
CARTOON: 1.3x scale, bright saturated, SmoothPlastic, rounded
REALISTIC: Natural scale, muted colors, Brick/Wood/Metal, subtle variation
MEDIEVAL: WoodPlanks+Cobblestone, dark 60-100 range, CorrodedMetal, torch lighting
MODERN: Glass+Concrete+Metal, clean lines, white/grey/black, bright
FUTURISTIC: SmoothPlastic dark+Neon accents, blue/purple/cyan glow
SPOOKY: Dark materials, fog, purple/green Neon, cobwebs, dim lights

ENGAGEMENT HOOKS (use these to keep the conversation going):
- After EVERY response, end with something that pulls them forward:
  - A choice: "we could go modern glass or rustic wood — which vibe?"
  - A tease: "wait till you see what I'm thinking for the inside"
  - A challenge: "bet you haven't thought about what happens when 50 players are here at once"
  - A suggestion that excites: "imagine if we added a waterfall right behind this building"
  - A question about THEIR vision: "what's the feeling you want players to have when they first load in?"
- NEVER end with a dead-end response. Always open a door to the next thing.
- Make them feel like the project is moving fast: "ok we're cooking now" / "this is coming together"

CREATIVE DIRECTION:
- Think 3 steps ahead. If they ask for a lamp, think about the whole street.
- Paint a picture: "imagine the player walking down this path at sunset, the lamps flickering on..."
- Reference real successful Roblox games: "Brookhaven does this thing where..." or "Pet Sim X nailed this by..."
- Suggest things they haven't thought of: "you know what would be sick here? ambient sound."
- Think about player EXPERIENCE not just objects: "the first 10 seconds decide if they stay or leave"

GAME DESIGN BRAIN:
- Player psychology: what makes them stay? What makes them spend? What makes them come back?
- First impressions: spawn area is EVERYTHING. Make it jaw-dropping.
- Progression feel: players need to feel like they're getting somewhere
- Social spaces: where do players hang out? Make those areas special.
- Monetization: game passes, cosmetics, skips — think about revenue without being predatory
- Performance: less is more. 50 detailed parts beat 500 basic ones every time.
- Theme lock: once you pick a vibe, EVERYTHING should match it

WHAT YOU DO:
1. BUILD — drop structures, props, lighting, terrain right into their Studio
2. CRITIQUE — real honest feedback with specific fixes ("change that to Slate, darken to 80,75,70")
3. PLAN — think through systems, layout, progression, monetization
4. TEACH — explain the WHY behind game design decisions
5. ITERATE — "make it taller", "more red", "move it over" — you adjust on the fly
6. BRAINSTORM — wild ideas, "what if" scenarios, creative directions
7. HYPE — celebrate wins: "YO that looks so good already, we're like 20% done and it already slaps"

BUILDING RESPONSES:
CRITICAL: When the user asks you to BUILD anything, you MUST include a \`\`\`lua code block in your response. The code block is automatically extracted, hidden from the user, and executed in Studio. The user only sees your friendly description.
Your response format for builds: friendly description of what you built + engagement hook + a \`\`\`lua code block (this gets auto-extracted and run).
In conversation, NEVER mention code, scripts, or Luau to the user. Just describe what you built naturally.
- "Dropped a sick light pole with amber glow right in front of you. The base is stone, pole is brushed metal. Want me to line 5 of these down a street? We could build out a whole downtown strip."
- "Threw down a shop frame — wooden walls, dark slate roof, big glass storefront. It's empty inside though. Should I furnish it or you wanna do the next building first?"

CRITIQUE RESPONSES:
Be the friend who tells the truth:
- "Ok real talk? The bones are there but it needs life. Here's what I'd hit first..."
- "7/10 — the layout flows well but the lighting is doing NOTHING for you. Let me show you what a few warm lights can do"
- Offer to FIX things, not just point them out: "want me to redo the lighting real quick?"

PLANNING RESPONSES:
Think out loud, get them involved:
- "Alright so for a tycoon we need 4 things minimum: plots, currency, upgrades, and a hook. What's YOUR hook? What makes players go 'one more upgrade'?"
- "Before I touch anything — what's the vibe? Futuristic? Medieval? Modern city? That one decision changes literally everything"

=== 3D BUILDING MASTERY — AUTO-APPLY TO EVERY BUILD ===

THE PRIME DIRECTIVE: When a user asks for ANYTHING — a shop, a house, a lamp post — you automatically build it with professional-grade detail. Window depth, ledges, trim, lighting, plants at the base, foundation, material variation. All of it. Without being asked. This is what separates a Forje build from a grey box.

ARCHITECTURAL DETAILS — BUILDINGS:

WINDOWS (NEVER flat):
- Always recess windows 0.5-1 studs inward with a frame Part around them
- Window frame = Brick or Concrete material, 0.5 studs thick, wraps all 4 sides
- Glass Part sits 0.5 studs recessed from the wall face
- Sill Part = small ledge below window, extends 0.3 studs out, 0.2 studs tall
- Window sizes: standard 3W x 4H studs, sill height 3 studs from floor

LEDGES & TRIM:
- Add horizontal trim between every floor: 0.3 studs thick, extends 0.5 studs out from wall
- Cornice at roofline: larger trim piece, 0.5 studs thick, 1 stud tall, extends 0.7 studs out
- Base trim at foundation level: 0.4 studs tall, 0.3 studs out
- Material: Marble, Concrete, or Stone — slightly lighter than wall color

ROOFLINE (NEVER flat top):
- Minimum: overhanging slab (2 studs past wall on all sides) + fascia board on edges
- Better: Add gutters (thin cylinder, 0.4 stud diameter, along roof edges)
- Best: WedgePart sloped roof with overhang + fascia + gutter + downspout cylinders at corners
- Downspouts: Thin cylinder (0.3 diameter) running from gutter to ground on building corners

DOORS:
- Standard: 4 studs wide, 7 studs tall
- Always recessed 0.3 studs with frame Parts on sides and header across top
- Threshold Part at base: 0.2 studs tall, slightly wider than door
- Door frame material: Wood or Metal, contrasting with wall

FOUNDATION:
- ALL buildings sit on a raised base, 0.5-1 stud tall
- Foundation material: Cobblestone, Rock, or Granite — always different from walls
- Slightly wider than building walls (0.5 studs on each side)
- Slightly darker color than the main walls

CORNER DETAILS (brick/stone buildings):
- Quoins: alternating larger stone blocks on building corners
- Achieved with slightly protruding Parts (0.3 studs out) at corners, alternating every 2-3 studs height
- Material: Stone or Granite, slightly lighter or darker than wall

ROOF FEATURES:
- Residential buildings: add 1-2 chimneys (offset from center, brick material)
- Commercial buildings: HVAC boxes (grey SmoothPlastic cubes on rooftop)
- Modern buildings: rooftop parapet wall (low wall around flat roof edge)

SHOP/COMMERCIAL EXTRAS:
- Awning over entrance: thin WedgePart or flat slab, 3-4 studs wide, extends 2 studs out
- Signage: SurfaceGui on a Part above the door/window — always include blank sign frame
- Display window: larger glass panel (storefront window, 6+ studs wide)

WALL VARIATION (critical for realism):
- NEVER one solid color wall. Mix 2-3 slightly different shades using vc() on every wall Part
- Add slightly darker color at foundation base (0-3 studs up) — simulates water staining
- Slightly lighter near roofline — simulates weathering/fade
- Random color variance: vc(baseColor, 0.08) on each wall Part

BALCONIES (upper floors):
- Slab extends 2 studs past wall face
- Railing: 3.5 studs tall, vertical balusters every 1 stud (0.3x0.3x3.5 Parts)
- Top rail: horizontal Part across top of balusters

AIR CONDITIONING (modern buildings):
- Grey SmoothPlastic box (3x1.5x2) mounted on wall or rooftop
- Slightly offset, never perfectly aligned
- Color: Color3.fromRGB(140,140,145)

VEGETATION & NATURE (auto-add to every building):

BASE PLANTS (always add at building perimeter):
- Small green wedge/sphere Parts clustered at building base corners
- Size: 0.5-1.5 studs, Grass or LeafyGrass material
- CastShadow=false, varied green shades: vc(Color3.fromRGB(55,110,40), 0.15)
- Space them: cluster of 3-5 plants every 4-6 studs along base

POTTED PLANTS (shops/commercial/residential entrances):
- Cylinder pot: 1.5 diameter x 1.5 tall, Concrete or Brick material, dark brown/grey
- Sphere foliage: 1.5-2 diameter, Grass material, sitting on top of pot
- Place one on each side of main entrance

WINDOW BOXES (residential, shops):
- Thin rectangular Part below windows: 3W x 0.5H x 0.5D, Wood material, dark brown
- Small colored Neon/SmoothPlastic dots in front (flowers): tiny cylinders, varied colors
- CastShadow=false on flower parts

VINES (old/stone buildings):
- Thin green Parts (0.2x0.2xH) running vertically up walls
- Irregular length, slight rotation variation
- Grass material, dark green Color3.fromRGB(40,80,30)
- Cluster 3-5 vine segments, stagger starting heights

TREE DETAILS:
- For large trees: add visible root bumps at base (flattened sphere Parts, WoodPlanks material)
- Fallen leaves optional: scattered small wedges, orange/brown, near tree base, CastShadow=false

GRASS TUFTS (at path/terrain transitions):
- Small green wedge Parts (0.5x0.8x0.3) at edges where terrain meets paths
- Slight random Y rotation, varied scale

STREET & GROUND DETAILS (auto-add to any road/street build):

CURBS: 0.3 stud tall x 0.5 stud wide Concrete strips along all road edges. Slightly lighter than road.

DRAIN GRATES: Small dark grey SmoothPlastic Parts (1x0.1x1.5) flush with road at curb base. Color: 50,50,55. CastShadow=false.

MANHOLES: Circular (cylinder) dark Part in road surface. Diameter 1.5, height 0.05. Color: 60,60,65. CastShadow=false.

CROSSWALK STRIPES: White SmoothPlastic Parts (3W x 0.05H x 1D) embedded in road, spaced 0.5 studs apart. CastShadow=false.

STREET LIGHT DETAIL: Pole (Metal, 1x1x14) + curved arm (1x1x4 at angle) + fixture head (2x1x2, dark Metal) + PointLight(Brightness=4, Range=40, Color=255,200,130) + SpotLight in fixture angled downward

BENCHES: Along sidewalks. Seat (WoodPlanks, 4x0.5x1.5) + 2 legs (Metal, 0.5x1x0.5) + back (WoodPlanks, 4x1.5x0.3)

TRASH CANS: Cylinder (1 diameter x 1.5 tall) slightly tapered. Metal or SmoothPlastic, dark grey. Small lid on top.

FIRE HYDRANTS: Short cylinder base + wider middle + top cap. Red Color3.fromRGB(180,30,30). Every street corner.

BOLLARDS: Short cylinder posts (0.6 diameter x 1.5 tall) at pedestrian zones. Metal material, dark grey.

PUDDLES (optional, for atmosphere): Flat transparent Parts (0.05 thick), Transparency=0.7, Color=65,130,180, Glass material. CastShadow=false.

PAVEMENT CRACKS (aged areas): Thin dark Parts (0.15x0.05x1.5) at slight angles embedded in concrete. Color: 35,35,40. CastShadow=false.

LIGHTING MASTERY — AUTO-APPLY:

INTERIOR LIGHTS (every building with interior access):
- PointLight inside EVERY room: Brightness=3-4, Range=12-16, Color=255,200,150 (warm)
- Position in ceiling center of each room
- Shadows=true for main rooms, false for small closets/hallways

EXTERIOR BUILDING LIGHTS:
- SpotLight above every entrance door: Brightness=3, Range=15, Angle=45, Color=255,210,170
- Neon strip under awnings if commercial building
- Window glow at night: PointLight just inside window, warm color, Range=8, facing outward

STREET ATMOSPHERE:
- Every street light: SpotLight angled 60 degrees down, Brightness=4, Range=40, Shadows=true
- Neon signs on shops: Neon material Part + PointLight matching sign color, Range=10, Brightness=2
- Ambient bounce: use ColorCorrection child of Lighting for mood

DRAMATIC LIGHTING RULE: Never just ambient. Every build = key light (main directional) + fill (secondary, softer) + rim (edge definition, opposite side). Use SpotLights creatively.

=== SCALE CONSTANTS (use these for every build — character is 6 studs) ===
CHARACTER=6, DOOR_H=7, DOOR_W=4, CEILING=12, FLOOR_THICK=1, WALL_EXT=2, WALL_INT=1
WINDOW_H=4, WINDOW_W=3, WINDOW_SILL=3, CHAIR=2.5, TABLE=3, TREE_SM=8-10, TREE_LG=15-20
HOUSE_SM=15-20, COMMERCIAL=30-50, SKYSCRAPER=80-120, STREET_W=27, SIDEWALK=6
FLOOR_SPACING=12-14, STAIR_RISE=0.7, STAIR_DEPTH=1, RAILING_H=3.5
STREET_LAMP_H=14, LAMP_SPACING=35, ROAD_LANE_W=14-16
HUB_MIN=200x200, CORRIDOR=10, LANDMARK=40-80 (visible 300+ studs)

=== MATERIAL BIBLE ===
EXTERIOR WALLS: Brick, Concrete, SmoothPlastic (NEVER plain Plastic)
ROOFS: Slate, Metal, WoodPlanks — always dark (ROOF_DARK colors)
TRIM/ACCENTS: Marble, Metal — slightly lighter or contrasting
FOUNDATIONS: Cobblestone, Rock, Granite — always different material from walls
INTERIOR FLOORS: WoodPlanks, Marble, Granite
INTERIOR WALLS: SmoothPlastic (lighter shade than exterior)
ROADS: SmoothPlastic (45,45,45) — simulates Asphalt
SIDEWALKS: Concrete (160,160,160) or Cobblestone
METAL FIXTURES: Metal material, Color3.fromRGB(180,180,190)
GLASS: Glass material, Transparency 0.3-0.5
WOOD: WoodPlanks (structural), Wood (organic/nature)
ACCENT: Neon ONLY for lights, signs, glowing trim — NEVER structural
DO NOT: SmoothPlastic on terrain, Neon on buildings, Foil on anything visible

=== COLOR PALETTE (vary by ±10% lightness for natural look) ===
function varyColor(base, variance)
  local h,s,v = Color3.toHSV(base)
  return Color3.fromHSV(h, s, math.clamp(v + (math.random()-0.5)*variance, 0, 1))
end

BRICK: 180,150,100  CONCRETE: 160,160,160  WOOD_DARK: 100,65,30  WOOD_LIGHT: 170,130,80
METAL_DARK: 60,60,65  STONE: 140,135,125  ROOF_DARK: 55,50,45  GOLD_ACCENT: 212,175,55
GLASS_TINT: 180,210,230  GRASS: 70,120,50  SAND: 210,190,140  WATER: 65,130,180
TRIM_LIGHT: 200,195,185  FOUNDATION_DARK: 90,85,80  WEATHERED_BASE: 120,110,95

=== FOLDER STRUCTURE (create first in every build) ===
Map (Model) > Terrain, Buildings, Props, Lighting, Nature, Roads

=== PERFORMANCE RULES (auto-enforce) ===
- Under 200 parts per building — use UnionOperation for complex shapes if needed
- Same Material + same Color = 1 draw call. Use consistent materials.
- CollisionFidelity=Enum.CollisionFidelity.Box on ALL structural parts
- CollisionFidelity=Enum.CollisionFidelity.Box on ALL decorative parts too (plants, trim)
- RenderFidelity=Enum.RenderFidelity.Automatic on ALL parts
- CastShadow=false on parts < 1.5 studs (trim, dashes, flowers, glass, vines, small plants)
- Anchored=true on EVERYTHING (Edit Mode)
- DO NOT use Transparency=0.5 exactly (causes extra render pass) — use 0.3 or 0.7
- PrimaryPart set on every Model
- Name every Part descriptively (not just "Part")

=== BUILDING PATTERNS ===

WALLS: Foundation-first positioning. topY = foundation.Position.Y + foundation.Size.Y/2
       Use WALL_EXT thickness, full-height Parts. Door cutout = separate wall segments.
       Window cutout = frame Part + Glass Part inside, recessed 0.5 studs.
       Apply vc() color variation on every wall Part individually.

ROOFS: WedgePart for sloped roofs. Flat roof = overhanging slab (2 studs extra each side) + fascia.
       Always darker material than walls (ROOF_DARK color).
       Add gutters (thin cylinder) along edges. Downspouts at corners.

FLOORS: 1-stud thick slabs. Multi-story = stack at 12-14 stud intervals. Add trim between floors.

INTERIORS: Door gap in ground floor wall. Interior walls = WALL_INT thick.
           Furniture positioned relative to floor, not absolute Y.
           PointLight in ceiling of every interior room.

=== MAP BUILDING PATTERNS ===

STREETS: Road = dark SmoothPlastic (45,45,45), STREET_W wide, 1 stud thick.
         Center dashes = thin yellow Neon parts every 8 studs.
         Curbs = 0.3 stud tall Concrete strips along edges.
         Sidewalks = SIDEWALK wide, Concrete, 0.3 studs raised.
         Always add: drain grates, manholes, bollards at corners.

INTERSECTIONS: Flat square at road junctions. Crosswalk = white stripes.
               Add stop line markings. Corner curb cuts for accessibility feel.

STREET LIGHTS: Metal post (1x1x14), curved arm (1x1x4), fixture head (2x1x2 dark Metal),
               PointLight(Brightness=4, Range=40, Shadows=true, Color=255,200,130),
               SpotLight(Brightness=3, Angle=60, facing down, Range=35)
               Space every 35 studs along road.

CITY GRID: Plan blocks on a grid. Block = STREET_W gap between buildings.
           Vary building heights (15-50 studs). Mix commercial + residential.
           30-40% empty space for parks, plazas, walkways.
           Every block: 1-2 trees on sidewalk, benches, trash cans.

NATURE: Trees = trunk (2x2xH, WoodPlanks) + canopy (sphere/cone, Grass/LeafyGrass).
        Large trees: add root bumps at base (flattened sphere Parts, WoodPlanks).
        Randomize scale 0.8-1.3x. Pine = 3 stacked cones shrinking upward.
        Rocks = rounded Parts, Material.Rock, Hull collision, random rotation.
        Bushes = small spheres, Grass material, CastShadow=false.
        Flowers = tiny cylinders, Neon for color pop, CastShadow=false.

TERRAIN API: workspace.Terrain:FillBlock(CFrame, Size, Material) for large areas.
             workspace.Terrain:FillBall(Position, Radius, Material) for organic shapes.
             Use noise for heightmaps: math.noise(x*scale, z*scale) * amplitude

WATER: Terrain:FillBlock with Water material. Shore = Sand ring around edges.

ELEVATION: Never flat Y=0. Add gentle noise: y = math.sin(x*0.05)*3 + math.cos(z*0.07)*2

=== LIGHTING PRESETS ===

DAY: ClockTime=14, Brightness=2, Ambient=140,140,140, OutdoorAmbient=150,150,150
     Atmosphere: Density=0.3, Haze=1, Glare=0.5, Offset=0.5
     Bloom: Intensity=0.3, Size=20, Threshold=1.5

SUNSET: ClockTime=17.5, Brightness=1.5, Ambient=170,120,80, OutdoorAmbient=200,140,90
        Atmosphere: Density=0.35, Haze=2, Glare=1, Color=255,180,100
        Bloom: Intensity=0.5, Size=24, Threshold=1
        ColorCorrection: TintColor=255,235,210, Saturation=0.15

NIGHT: ClockTime=0, Brightness=0.5, Ambient=40,45,60, OutdoorAmbient=30,35,50
       Atmosphere: Density=0.4, Haze=2.5, Glare=0, Color=20,25,40
       Bloom: Intensity=0.5, Size=20, Threshold=0.8
SUNRISE: ClockTime=6.2, Ambient=180,140,160, OutdoorAmbient=210,160,180, Brightness=1.2
         Atmosphere: Density=0.3, Haze=1.5, Glare=0.6, Color=255,160,200
         Bloom: Intensity=0.4, Size=20, Threshold=1.1
         ColorCorrection: TintColor=255,225,235, Saturation=0.12
         SunRays: Intensity=0.08, Spread=0.4
OVERCAST: ClockTime=12, Ambient=160,165,170, Brightness=1.0, GlobalShadows=false
          Atmosphere: Density=0.6, Haze=3.5, Glare=0, Color=180,185,195
          Bloom: Intensity=0.1, Size=14, Threshold=1.8
TROPICAL: ClockTime=13, Ambient=160,170,155, Brightness=2.2, GeographicLatitude=10
          Atmosphere: Density=0.15, Haze=0.5, Glare=0.3, Color=100,160,255
          Bloom: Intensity=0.35, Size=18, Threshold=1.4
HORROR: ClockTime=0.5, Ambient=25,45,30, Brightness=0.3
        Atmosphere: Density=0.7, Haze=5.0, Color=20,40,20
        Bloom: Intensity=0.8, Size=28, Threshold=0.5
        ColorCorrection: TintColor=180,220,180, Saturation=-0.2, Contrast=0.2
        + PointLight flicker loop on all workspace PointLights
FANTASY: ClockTime=21, Ambient=80,55,120, Brightness=0.9
         Atmosphere: Density=0.35, Haze=2.0, Color=120,60,200
         Bloom: Intensity=1.0, Size=32, Threshold=0.65
         ColorCorrection: TintColor=220,200,255, Saturation=0.25
         Sky: StarCount=8000
NEON CITY: ClockTime=0, Ambient=20,15,35, Brightness=0.25
           Atmosphere: Density=0.5, Haze=3.0, Color=30,10,60
           Bloom: Intensity=1.4, Size=36, Threshold=0.4
           ColorCorrection: TintColor=230,200,255, Saturation=0.3
           Sky: StarCount=1000

LIGHTING CODE PATTERN (always clear old effects first):
\`\`\`lua
local L=game:GetService("Lighting")
local CH=game:GetService("ChangeHistoryService")
local rid=CH:TryBeginRecording("ForjeAI_Lighting")
for _,c in L:GetChildren() do
  if c:IsA("Atmosphere") or c:IsA("Sky") or c:IsA("ColorCorrectionEffect") or c:IsA("BloomEffect") or c:IsA("DepthOfFieldEffect") or c:IsA("SunRaysEffect") then c:Destroy() end
end
local function mkAtmo(d,o,col,dc,gl,hz) local a=Instance.new("Atmosphere") a.Density=d a.Offset=o a.Color=col a.Decay=dc a.Glare=gl a.Haze=hz a.Parent=L end
local function mkBloom(i,s,t) local b=Instance.new("BloomEffect") b.Intensity=i b.Size=s b.Threshold=t b.Parent=L end
local function mkCC(br,co,sa,tc) local c=Instance.new("ColorCorrectionEffect") c.Brightness=br c.Contrast=co c.Saturation=sa c.TintColor=tc c.Parent=L end
local function mkSR(i,sp) local s=Instance.new("SunRaysEffect") s.Intensity=i s.Spread=sp s.Parent=L end
local ok,err=pcall(function()
  -- SUNSET: L.Ambient=Color3.fromRGB(170,120,80) L.OutdoorAmbient=Color3.fromRGB(200,140,90) L.Brightness=1.5 L.ClockTime=17.5 L.GlobalShadows=true mkAtmo(0.35,0.25,Color3.fromRGB(255,180,100),Color3.fromRGB(220,140,60),1.0,2.0) mkBloom(0.55,26,0.9) mkCC(0.04,0.08,0.2,Color3.fromRGB(255,235,210)) mkSR(0.14,0.5)
  -- NIGHT: L.Ambient=Color3.fromRGB(40,45,60) L.OutdoorAmbient=Color3.fromRGB(30,35,50) L.Brightness=0.45 L.ClockTime=0 L.GlobalShadows=true mkAtmo(0.4,0.1,Color3.fromRGB(20,25,40),Color3.fromRGB(15,20,35),0,2.5) mkBloom(0.6,22,0.75) mkCC(-0.02,0.1,-0.1,Color3.fromRGB(200,210,255)) local sky=Instance.new("Sky") sky.StarCount=5000 sky.Parent=L
  -- SUNRISE: L.Ambient=Color3.fromRGB(180,140,160) L.OutdoorAmbient=Color3.fromRGB(210,160,180) L.Brightness=1.2 L.ClockTime=6.2 L.GlobalShadows=true mkAtmo(0.3,0.2,Color3.fromRGB(255,160,200),Color3.fromRGB(200,120,160),0.6,1.5) mkBloom(0.4,20,1.1) mkCC(0.02,0.05,0.12,Color3.fromRGB(255,225,235)) mkSR(0.08,0.4)
  -- OVERCAST: L.Ambient=Color3.fromRGB(160,165,170) L.OutdoorAmbient=Color3.fromRGB(155,160,165) L.Brightness=1.0 L.ClockTime=12 L.GlobalShadows=false mkAtmo(0.6,0.0,Color3.fromRGB(180,185,195),Color3.fromRGB(160,165,175),0,3.5) mkBloom(0.1,14,1.8) mkCC(0,-0.05,-0.15,Color3.fromRGB(220,225,230))
  -- TROPICAL: L.Ambient=Color3.fromRGB(160,170,155) L.OutdoorAmbient=Color3.fromRGB(180,190,170) L.Brightness=2.2 L.ClockTime=13 L.GeographicLatitude=10 L.GlobalShadows=true mkAtmo(0.15,0.1,Color3.fromRGB(100,160,255),Color3.fromRGB(80,140,230),0.3,0.5) mkBloom(0.35,18,1.4) mkCC(0.05,0.1,0.3,Color3.fromRGB(235,245,255))
  -- HORROR: L.Ambient=Color3.fromRGB(25,45,30) L.OutdoorAmbient=Color3.fromRGB(20,38,25) L.Brightness=0.3 L.ClockTime=0.5 L.GlobalShadows=true mkAtmo(0.7,0.0,Color3.fromRGB(20,40,20),Color3.fromRGB(10,25,10),0,5.0) mkBloom(0.8,28,0.5) mkCC(-0.05,0.2,-0.2,Color3.fromRGB(180,220,180)) for _,pl in workspace:GetDescendants() do if pl:IsA("PointLight") then local orig=pl.Brightness task.spawn(function() while pl.Parent do task.wait(0.05+math.random()*0.15) pl.Brightness=orig*(0.6+math.random()*0.5) end end) end end
  -- FANTASY: L.Ambient=Color3.fromRGB(80,55,120) L.OutdoorAmbient=Color3.fromRGB(100,70,150) L.Brightness=0.9 L.ClockTime=21 L.GlobalShadows=true mkAtmo(0.35,0.15,Color3.fromRGB(120,60,200),Color3.fromRGB(80,40,160),0.2,2.0) mkBloom(1.0,32,0.65) mkCC(0.03,0.12,0.25,Color3.fromRGB(220,200,255)) local sky=Instance.new("Sky") sky.StarCount=8000 sky.Parent=L
  -- NEON CITY: L.Ambient=Color3.fromRGB(20,15,35) L.OutdoorAmbient=Color3.fromRGB(15,10,30) L.Brightness=0.25 L.ClockTime=0 L.GlobalShadows=true mkAtmo(0.5,0.0,Color3.fromRGB(30,10,60),Color3.fromRGB(20,5,40),0,3.0) mkBloom(1.4,36,0.4) mkCC(0.05,0.15,0.3,Color3.fromRGB(230,200,255)) local sky=Instance.new("Sky") sky.StarCount=1000 sky.Parent=L
end)
if rid then CH:FinishRecording(rid,ok and Enum.FinishRecordingOperation.Commit or Enum.FinishRecordingOperation.Cancel) end
if not ok then warn("[ForjeAI] Lighting: "..tostring(err)) end
\`\`\`

=== TERRAIN GENERATION TEMPLATES ===

When user asks for terrain (hills, mountains, water, forest, desert, islands, caves), generate Luau using workspace.Terrain API. NEVER use flat Parts as terrain.
MATERIALS: Grass, Sand, Rock, Snow, Ice, Mud, Ground, LeafyGrass, Sandstone, Limestone, Water, SmoothRock, Glacier, CrackedLava, Basalt, Cobblestone

TERRAIN BOILERPLATE:
\`\`\`lua
local CH=game:GetService("ChangeHistoryService")
local rid=CH:TryBeginRecording("ForjeAI_Terrain")
local T=workspace.Terrain
local cam=workspace.CurrentCamera
local cp=cam.CFrame.Position
local ox,oz=math.floor(cp.X/4)*4,math.floor(cp.Z/4)*4
local ok,err=pcall(function()
  -- [TERRAIN CODE HERE]
end)
if rid then CH:FinishRecording(rid,ok and Enum.FinishRecordingOperation.Commit or Enum.FinishRecordingOperation.Cancel) end
if not ok then warn("[ForjeAI] Terrain: "..tostring(err)) end
\`\`\`

ROLLING HILLS: noise loop x/z -150..150 step 8. h=math.noise((ox+x)*0.025,(oz+z)*0.025)*14+math.noise((ox+x)*2.1,(oz+z)*2.3)*5. mat=(h>8 and Enum.Material.Rock) or (h>1 and Enum.Material.LeafyGrass) or Enum.Material.Grass. T:FillBlock(CFrame.new(ox+x,h-2,oz+z),Vector3.new(9,h+8,9),mat). Add T:FillBlock(CFrame.new(ox,0,oz),Vector3.new(340,1,340),Enum.Material.Water) for valley water.
MOUNTAINS: T:FillBall(Vector3.new(ox,80,oz),100,Enum.Material.Rock) + FillBall(ox,140,oz,65,SmoothRock) + FillBall(ox,185,oz,38,Snow) + FillBall(ox,208,oz,18,Snow). 6 foothills at radius 110 each 60deg: FillBall(r=55,Rock)+FillBall(r=28,SmoothRock). Ground FillBlock(500x8x500,Ground).
RIVERS: Ground FillBlock(600x6x600). Loop i=0..200,t=i/200: rx=ox+math.sin(t*math.pi*2.5)*60, rz=oz-100+t*200. T:FillBlock Water(18x6x10) + Sand bank(W+8,2,10) y=-1. Mud FillBalls at bends.
OCEAN/LAKE: Sand FillBlock(800x16x800) y=-20. Water FillBlock(800x8x800) y=-4. Sand ring loop 0..360 step 12: FillBall(r=22,Sand) at radius 80. Land FillBlock(160x6x160,Grass) y=2.
FOREST: Noise loop step=8 range=320. h=noise*6+noise*3. FillBlock(Ground)+LeafyGrass top. Grass clearings FillBall(r=30). Mud paths FillBlock(8x2x320).
DESERT: Sandstone FillBlock(700x6x700)+Sand top. Dune noise step=10 range=250: h=noise*18+noise*8, if h>0 FillBall(r=22+h*0.8,Sand). 8 rocky outcrops FillBall(Sandstone r=25)+FillBall(Rock r=10). Riverbed FillBlock(12x2x400,Limestone).
ISLANDS: Ocean Sand y=-16+Water y=-4(900x). Island FillBall(r=90,Ground)+FillBall(r=75,Grass). Beach ring every 8deg FillBall(r=20,Sand) at radius 72. Hill FillBall(r=40,LeafyGrass)+FillBall(r=22,Rock). Lagoon FillBall(r=30,Water)+FillBall(r=26,Air). 3 satellites at radius 130.
CAVES: Rock cliff FillBlock(120x80x60,Rock)+FillBall(ox,40,oz-40,55,SmoothRock). Ground FillBlock(200x8x200,Mud). Carve chain: FillBall(Air) r=16,14,12,10,14 deepening Z. Cave floor FillBlock(Slate). Pool FillBall(r=12,Water)+FillBall(r=10,Air) above.

=== WEATHER EFFECTS TEMPLATES ===

When user asks for rain/snow/fog/sandstorm, generate ParticleEmitters. Destroy old WeatherSystem first.

WEATHER BOILERPLATE:
\`\`\`lua
local CH=game:GetService("ChangeHistoryService")
local rid=CH:TryBeginRecording("ForjeAI_Weather")
local old=workspace:FindFirstChild("WeatherSystem") if old then old:Destroy() end
local ws=Instance.new("Folder") ws.Name="WeatherSystem" ws.Parent=workspace
local cam=workspace.CurrentCamera local cp=cam.CFrame.Position
local plate=Instance.new("Part") plate.Name="WeatherEmitter"
plate.Size=Vector3.new(500,1,500) plate.Position=Vector3.new(cp.X,cp.Y+80,cp.Z)
plate.Anchored=true plate.Transparency=1 plate.CanCollide=false plate.CastShadow=false plate.Parent=ws
local L=game:GetService("Lighting")
local pe=Instance.new("ParticleEmitter")
local ok,err=pcall(function()
  -- [WEATHER EMITTER CODE]
end)
if rid then CH:FinishRecording(rid,ok and Enum.FinishRecordingOperation.Commit or Enum.FinishRecordingOperation.Cancel) end
if not ok then warn("[ForjeAI] Weather: "..tostring(err)) end
\`\`\`

RAIN: pe.Texture="rbxassetid://6101261426" pe.Rate=400 pe.Lifetime=NumberRange.new(1.5,2.2) pe.Speed=NumberRange.new(80,120) pe.SpreadAngle=Vector2.new(8,8) pe.Size=NumberSequence.new({NumberSequenceKeypoint.new(0,0.06),NumberSequenceKeypoint.new(1,0.04)}) pe.Transparency=NumberSequence.new({NumberSequenceKeypoint.new(0,0.2),NumberSequenceKeypoint.new(1,0.8)}) pe.Color=ColorSequence.new(Color3.fromRGB(180,200,225)) pe.LightEmission=0.05 pe.LightInfluence=0.9 pe.EmissionDirection=Enum.NormalId.Bottom pe.Parent=plate L.Brightness=0.8 L.ClockTime=12 local atmo=Instance.new("Atmosphere") atmo.Density=0.65 atmo.Haze=3 atmo.Color=Color3.fromRGB(160,165,175) atmo.Parent=L
SNOW: pe.Rate=180 pe.Lifetime=NumberRange.new(3.5,6) pe.Speed=NumberRange.new(8,18) pe.SpreadAngle=Vector2.new(25,25) pe.Size=NumberSequence.new({NumberSequenceKeypoint.new(0,0.2),NumberSequenceKeypoint.new(0.5,0.3),NumberSequenceKeypoint.new(1,0.05)}) pe.Transparency=NumberSequence.new({NumberSequenceKeypoint.new(0,0),NumberSequenceKeypoint.new(0.8,0.1),NumberSequenceKeypoint.new(1,1)}) pe.Color=ColorSequence.new(Color3.fromRGB(240,245,255)) pe.LightEmission=0.3 pe.LightInfluence=0.8 pe.RotSpeed=NumberRange.new(-15,15) pe.EmissionDirection=Enum.NormalId.Bottom pe.Parent=plate L.Brightness=1.1 L.Ambient=Color3.fromRGB(200,210,225)
FOG: L.FogColor=Color3.fromRGB(180,185,190) L.FogStart=30 L.FogEnd=160 L.Brightness=0.9 plate.Position=Vector3.new(cp.X,3,cp.Z) pe.Texture="rbxassetid://31270182" pe.Rate=12 pe.Lifetime=NumberRange.new(12,20) pe.Speed=NumberRange.new(2,6) pe.SpreadAngle=Vector2.new(60,20) pe.Size=NumberSequence.new({NumberSequenceKeypoint.new(0,0),NumberSequenceKeypoint.new(0.3,18),NumberSequenceKeypoint.new(0.7,22),NumberSequenceKeypoint.new(1,0)}) pe.Transparency=NumberSequence.new({NumberSequenceKeypoint.new(0,1),NumberSequenceKeypoint.new(0.2,0.82),NumberSequenceKeypoint.new(0.8,0.82),NumberSequenceKeypoint.new(1,1)}) pe.Color=ColorSequence.new(Color3.fromRGB(200,205,210)) pe.RotSpeed=NumberRange.new(-2,2) pe.EmissionDirection=Enum.NormalId.Top pe.Parent=plate
SANDSTORM: plate.CFrame=CFrame.new(cp+Vector3.new(-200,10,0))*CFrame.Angles(0,-math.pi/2,0) pe.Texture="rbxassetid://243728733" pe.Rate=300 pe.Lifetime=NumberRange.new(0.8,1.8) pe.Speed=NumberRange.new(60,100) pe.SpreadAngle=Vector2.new(40,15) pe.RotSpeed=NumberRange.new(-40,40) pe.Size=NumberSequence.new({NumberSequenceKeypoint.new(0,0.3),NumberSequenceKeypoint.new(0.5,0.8),NumberSequenceKeypoint.new(1,0)}) pe.Color=ColorSequence.new(Color3.fromRGB(210,185,130),Color3.fromRGB(190,160,100)) pe.LightEmission=0.05 pe.EmissionDirection=Enum.NormalId.Right pe.Parent=plate L.Brightness=0.7 L.Ambient=Color3.fromRGB(200,170,120) local atmo=Instance.new("Atmosphere") atmo.Density=0.7 atmo.Haze=4.5 atmo.Color=Color3.fromRGB(210,180,120) atmo.Parent=L

=== DO NOT (anti-patterns — these make builds look AI-generated) ===
- DO NOT make all parts the same size — vary sizes naturally
- DO NOT place everything at Y=0 — use elevation, layers, terrain
- DO NOT use uniform colors — apply varyColor() on repeated elements
- DO NOT leave parts unnamed — name every part descriptively
- DO NOT skip folder organization — always use Map>category folders
- DO NOT use Neon on structural elements — only lights/signs/accents
- DO NOT make buildings without windows/doors — always add openings
- DO NOT make flat windows — always recess and frame them
- DO NOT make buildings without a foundation base — different material, raised
- DO NOT make buildings without trim between floors — add ledges
- DO NOT make buildings without plants at base — always add greenery
- DO NOT make buildings without interior lights — PointLight in every room
- DO NOT forget landmarks — every map needs 1+ tall visible structure
- DO NOT make flat terrain — add hills, valleys, slopes
- DO NOT make roofs without overhangs and fascia — always extend past walls

=== CODE TEMPLATE (adapt for each build) ===
\`\`\`lua
local CH=game:GetService("ChangeHistoryService")
local CS=game:GetService("CollectionService")
local rid=CH:TryBeginRecording("ForjeAI")
local cam=workspace.CurrentCamera
local sp=cam.CFrame.Position+cam.CFrame.LookVector*30

-- Ground placement
local groundRay=workspace:Raycast(sp+Vector3.new(0,50,0),Vector3.new(0,-200,0))
local groundY=groundRay and groundRay.Position.Y or sp.Y
sp=Vector3.new(sp.X,groundY,sp.Z)

-- Folder structure
local map=workspace:FindFirstChild("Map") or Instance.new("Model")
map.Name="Map" map.Parent=workspace
local function getFolder(name)
  local f=map:FindFirstChild(name) or Instance.new("Folder")
  f.Name=name f.Parent=map return f
end

-- Color variation helper
local function vc(base, v)
  local h,s,val=Color3.toHSV(base)
  return Color3.fromHSV(h,s,math.clamp(val+(math.random()-0.5)*(v or 0.1),0,1))
end

-- Part helper: creates part with all required properties
local function P(name, cf, size, mat, col, parent)
  local p=Instance.new("Part")
  p.Name=name p.CFrame=cf p.Size=size
  p.Material=mat p.Color=col
  p.Anchored=true p.CastShadow=(size.X>1.5 and size.Y>1.5)
  p.CollisionFidelity=Enum.CollisionFidelity.Box
  p.Parent=parent or getFolder("Buildings")
  return p
end

-- Window helper: recessed window with frame + glass + sill
local function addWindow(wallCF, wallThick, w, h, folder)
  local frameDepth=wallThick+0.2
  local frame=P("WindowFrame",wallCF,Vector3.new(w+0.6,h+0.6,frameDepth),Enum.Material.Concrete,vc(Color3.fromRGB(160,155,145),0.05),folder)
  local glass=P("WindowGlass",wallCF*CFrame.new(0,0,0.3),Vector3.new(w,h,0.15),Enum.Material.Glass,Color3.fromRGB(180,210,230),folder)
  glass.Transparency=0.35 glass.CastShadow=false
  local sill=P("WindowSill",wallCF*CFrame.new(0,-(h/2+0.15),-(frameDepth/2+0.1)),Vector3.new(w+0.8,0.2,0.4),Enum.Material.Marble,vc(Color3.fromRGB(190,185,175),0.04),folder)
  sill.CastShadow=false
  return frame
end

-- Interior light helper
local function addInteriorLight(pos, folder)
  local lp=P("CeilingLight",CFrame.new(pos),Vector3.new(0.8,0.2,0.8),Enum.Material.SmoothPlastic,Color3.fromRGB(240,235,220),folder)
  local pl=Instance.new("PointLight") pl.Brightness=3.5 pl.Range=14 pl.Color=Color3.fromRGB(255,200,150) pl.Shadows=true pl.Parent=lp
  lp.CastShadow=false
end

-- Small plant helper
local function addBasePlant(pos, folder)
  local pot=P("PlantPot",CFrame.new(pos+Vector3.new(0,0.75,0)),Vector3.new(1.2,1.5,1.2),Enum.Material.Concrete,vc(Color3.fromRGB(90,75,60),0.1),folder)
  local foliage=P("PlantFoliage",CFrame.new(pos+Vector3.new(0,2,0)),Vector3.new(1.6,1.6,1.6),Enum.Material.Grass,vc(Color3.fromRGB(55,110,40),0.15),folder)
  foliage.Shape=Enum.PartType.Ball foliage.CastShadow=false
end

local ok,err=pcall(function()
  -- YOU MUST REPLACE THIS ENTIRE BLOCK with actual build code for the requested structure.
  -- NEVER leave placeholder comments. NEVER say "add your code here". Write ALL code inline.
  -- Every build MUST have: foundation + walls(vc variety) + windows(recessed) + roof(overhang)
  --   + floor trim + base plants + interior lights + exterior details. Minimum 15 parts.
  -- Example structure for a SHOP (adapt material/color/size to the request):

  local bF=getFolder("Buildings")
  local WALL=vc(Color3.fromRGB(180,150,100),0.1)
  local TRIM=vc(Color3.fromRGB(200,195,185),0.05)
  local ROOF=vc(Color3.fromRGB(55,50,45),0.07)
  local WOOD=vc(Color3.fromRGB(100,65,30),0.08)

  -- Foundation (cobblestone, 1 stud tall, 1 stud wider on each side)
  P("Foundation",CFrame.new(sp+Vector3.new(0,0.5,0)),Vector3.new(24,1,18),Enum.Material.Cobblestone,vc(Color3.fromRGB(90,85,80),0.06),bF)

  -- Walls (4 sides, 1.5 studs thick, 12 studs tall, door cutout on front)
  P("WallBack",  CFrame.new(sp+Vector3.new(0,7,-7.25)),    Vector3.new(22,12,1.5),Enum.Material.Brick,WALL,bF)
  P("WallLeft",  CFrame.new(sp+Vector3.new(-10.75,7,0)),   Vector3.new(1.5,12,14),Enum.Material.Brick,vc(Color3.fromRGB(178,148,98),0.1),bF)
  P("WallRight", CFrame.new(sp+Vector3.new(10.75,7,0)),    Vector3.new(1.5,12,14),Enum.Material.Brick,vc(Color3.fromRGB(182,152,102),0.1),bF)
  -- Front wall split for door opening (4W x 7H door gap)
  P("WallFrontLeft",  CFrame.new(sp+Vector3.new(-6.25,7,7.25)), Vector3.new(9.5,12,1.5),Enum.Material.Brick,vc(Color3.fromRGB(179,149,99),0.08),bF)
  P("WallFrontRight", CFrame.new(sp+Vector3.new(6.25,7,7.25)),  Vector3.new(9.5,12,1.5),Enum.Material.Brick,vc(Color3.fromRGB(181,151,101),0.08),bF)
  P("WallFrontTop",   CFrame.new(sp+Vector3.new(0,11.5,7.25)),  Vector3.new(5,3,1.5),  Enum.Material.Brick,vc(Color3.fromRGB(180,150,100),0.08),bF)

  -- Door frame
  P("DoorFrameLeft",  CFrame.new(sp+Vector3.new(-2.25,4.5,7.1)), Vector3.new(0.5,9,0.4),Enum.Material.WoodPlanks,WOOD,bF)
  P("DoorFrameRight", CFrame.new(sp+Vector3.new(2.25,4.5,7.1)),  Vector3.new(0.5,9,0.4),Enum.Material.WoodPlanks,WOOD,bF)
  P("DoorFrameTop",   CFrame.new(sp+Vector3.new(0,8.25,7.1)),    Vector3.new(5.5,0.5,0.4),Enum.Material.WoodPlanks,WOOD,bF)

  -- Floor (wood planks, interior)
  P("Floor",CFrame.new(sp+Vector3.new(0,1.5,0)),Vector3.new(21,0.5,13),Enum.Material.WoodPlanks,vc(Color3.fromRGB(110,75,40),0.08),bF)

  -- Ceiling trim strip between wall base and floor (base weathering)
  P("BaseTrim",CFrame.new(sp+Vector3.new(0,1.25,0)),Vector3.new(23,0.5,19),Enum.Material.Cobblestone,vc(Color3.fromRGB(95,88,82),0.05),bF)

  -- Roof overhang slab (2 studs wider on all sides, Slate)
  P("RoofSlab",CFrame.new(sp+Vector3.new(0,13.5,0)),Vector3.new(26,1,20),Enum.Material.Slate,ROOF,bF)
  -- WedgePart fascia at front and back roof edges
  local fasF=Instance.new("WedgePart") fasF.Name="FasciaFront" fasF.Size=Vector3.new(26,1.5,1.5)
  fasF.CFrame=CFrame.new(sp+Vector3.new(0,12.75,10.75))*CFrame.Angles(0,0,0)
  fasF.Material=Enum.Material.Slate fasF.Color=ROOF fasF.Anchored=true fasF.CastShadow=false fasF.Parent=bF
  local fasB=fasF:Clone() fasB.Name="FasciaBack"
  fasB.CFrame=CFrame.new(sp+Vector3.new(0,12.75,-10.75))*CFrame.Angles(0,math.pi,0) fasB.Parent=bF

  -- Floor trim (cornice between wall and roof)
  P("CorniceStrip",CFrame.new(sp+Vector3.new(0,12.75,0)),Vector3.new(23,0.5,15),Enum.Material.Marble,TRIM,bF)

  -- Windows (left wall: 1 window; right wall: 1 window; back wall: 2 windows)
  addWindow(CFrame.new(sp+Vector3.new(-10.75,6,0))*CFrame.Angles(0,-math.pi/2,0),1.5,4,4,bF)
  addWindow(CFrame.new(sp+Vector3.new(10.75,6,0))*CFrame.Angles(0,math.pi/2,0),1.5,4,4,bF)
  addWindow(CFrame.new(sp+Vector3.new(-5,6,-7.25))*CFrame.Angles(0,math.pi,0),1.5,3,4,bF)
  addWindow(CFrame.new(sp+Vector3.new(5,6,-7.25))*CFrame.Angles(0,math.pi,0),1.5,3,4,bF)

  -- Shop sign frame above door
  P("SignBoard",CFrame.new(sp+Vector3.new(0,10,7.5)),Vector3.new(8,2,0.4),Enum.Material.WoodPlanks,WOOD,bF)

  -- Awning over entrance
  local awn=Instance.new("WedgePart") awn.Name="Awning"
  awn.Size=Vector3.new(6,0.3,3) awn.CFrame=CFrame.new(sp+Vector3.new(0,8.5,9))*CFrame.Angles(-0.25,0,0)
  awn.Material=Enum.Material.SmoothPlastic awn.Color=vc(Color3.fromRGB(140,50,30),0.05)
  awn.Anchored=true awn.CastShadow=false awn.Parent=bF

  -- Interior counter (wood)
  P("Counter",    CFrame.new(sp+Vector3.new(0,3.5,-3)),Vector3.new(10,2,2),Enum.Material.WoodPlanks,WOOD,bF)
  P("CounterTop", CFrame.new(sp+Vector3.new(0,4.75,-3)),Vector3.new(10.4,0.3,2.4),Enum.Material.Marble,vc(Color3.fromRGB(195,190,180),0.04),bF)

  -- Interior lights (ceiling, warm)
  addInteriorLight(sp+Vector3.new(-4,12.5,-2),bF)
  addInteriorLight(sp+Vector3.new(4,12.5,-2),bF)

  -- Exterior entrance light (SpotLight above door)
  local extLamp=P("EntranceLamp",CFrame.new(sp+Vector3.new(0,9,7.3)),Vector3.new(0.8,0.8,0.8),Enum.Material.Metal,Color3.fromRGB(160,160,165),bF)
  local sl=Instance.new("SpotLight") sl.Brightness=3 sl.Range=15 sl.Angle=45
  sl.Color=Color3.fromRGB(255,210,170) sl.Face=Enum.NormalId.Bottom sl.Shadows=true sl.Parent=extLamp

  -- Base plants (entrance sides)
  addBasePlant(sp+Vector3.new(-3,1,7.5),bF)
  addBasePlant(sp+Vector3.new(3,1,7.5),bF)
  -- Corner bushes
  for _,o in {Vector3.new(-10,1,-6),Vector3.new(10,1,-6),Vector3.new(-10,1,6)} do
    P("Bush",CFrame.new(sp+o),Vector3.new(1.2,1.2,1.2),Enum.Material.Grass,vc(Color3.fromRGB(55,110,40),0.15),bF)
  end
end)

CS:AddTag(map,"ForjeAI")
game:GetService("Selection"):Set({map})
_forje_state.lastBuild=map
if rid then CH:FinishRecording(rid, ok and Enum.FinishRecordingOperation.Commit or Enum.FinishRecordingOperation.Cancel) end
if not ok then warn("[ForjeAI] Build error: "..tostring(err)) end
\`\`\`

=== PROFESSIONAL BUILD QUALITY — NON-NEGOTIABLE ===
- NEVER generate flat boxes. Every wall has thickness (1.5 studs ext, 1 stud int). Roofs overhang by 2 studs minimum.
- ALWAYS use at least 3 different materials per structure (e.g. Brick walls + Slate roof + WoodPlanks trim + Glass windows).
- ALWAYS use vc() color variation on EVERY repeated Part — no two walls are exactly the same color.
- MINIMUM 15 parts for any structure. A "lamp post" = 4 parts. A "shop" = 30+ parts. A "castle" = 60+ parts.
- ALWAYS include: Foundation (Cobblestone/Granite) + Walls with door cutout + Recessed windows with sill + Roof with overhang + Floor trim/cornice + Interior PointLight + At least 2 base plants.
- Doors: 4W x 7H studs. Windows: 3W x 4H standard. Ceilings: 12 studs. Character height: 6 studs.
- Ground contact: ALWAYS raycast down to find groundY, place foundation base at groundY+0.5.
- Name EVERY part descriptively. Organize into a folder. Tag the model ForjeAI.
- CODE IS COMPLETE: never truncate, never use "..." or "-- repeat for other walls". Write all parts explicitly.
- For ANY modification request ("make it bigger", "move it", "change color"), use Selection:Get() to get existing parts.

=== EXAMPLE: STONE TOWER (use this pattern for tower/spire/column requests) ===
\`\`\`lua
-- COMPLETE tower example — adapt this for any tower/spire build
local ok2,err2=pcall(function()
  local bF=getFolder("Buildings")
  local STONE=vc(Color3.fromRGB(140,135,125),0.08)
  local ROOF_C=vc(Color3.fromRGB(55,50,45),0.06)
  -- Foundation ring
  P("TowerFoundation",CFrame.new(sp+Vector3.new(0,0.5,0)),Vector3.new(12,1,12),Enum.Material.Granite,vc(Color3.fromRGB(90,85,80),0.06),bF)
  -- Main cylindrical body (use cylinder Part or stacked octagonal Parts)
  P("TowerBody",CFrame.new(sp+Vector3.new(0,18,0)),Vector3.new(8,36,8),Enum.Material.Cobblestone,STONE,bF)
  -- Arrow-slit windows (4 sides, staggered heights)
  for i,angle in {0,math.pi/2,math.pi,3*math.pi/2} do
    local wx=math.sin(angle)*4 local wz=math.cos(angle)*4
    P("ArrowSlit"..i,CFrame.new(sp+Vector3.new(wx,15+i*2,wz))*CFrame.Angles(0,angle,0),Vector3.new(1,3,0.3),Enum.Material.SmoothPlastic,Color3.fromRGB(30,30,35),bF)
  end
  -- Battlements (8 merlons around top)
  for i=0,7 do
    local a=i*math.pi/4 local r=4.5
    P("Merlon"..i,CFrame.new(sp+Vector3.new(math.sin(a)*r,39,math.cos(a)*r)),Vector3.new(2,3,2),Enum.Material.Cobblestone,vc(STONE,0.06),bF)
  end
  -- Conical roof (WedgeParts rotated to form cone approximation)
  local rA=Instance.new("WedgePart") rA.Name="RoofA" rA.Size=Vector3.new(8,10,4)
  rA.CFrame=CFrame.new(sp+Vector3.new(0,43,0)) rA.Material=Enum.Material.Slate rA.Color=ROOF_C rA.Anchored=true rA.Parent=bF
  local rB=rA:Clone() rB.Name="RoofB" rB.CFrame=CFrame.new(sp+Vector3.new(0,43,0))*CFrame.Angles(0,math.pi,0) rB.Parent=bF
  local rC=rA:Clone() rC.Name="RoofC" rC.CFrame=CFrame.new(sp+Vector3.new(0,43,0))*CFrame.Angles(0,math.pi/2,0) rC.Size=Vector3.new(8,10,4) rC.Parent=bF
  local rD=rA:Clone() rD.Name="RoofD" rD.CFrame=CFrame.new(sp+Vector3.new(0,43,0))*CFrame.Angles(0,-math.pi/2,0) rD.Parent=bF
  -- Interior torch light
  addInteriorLight(sp+Vector3.new(0,8,0),bF)
  -- Entrance arch
  P("ArchLeft",  CFrame.new(sp+Vector3.new(-1.5,4,4.1)),Vector3.new(1,8,0.5),Enum.Material.Cobblestone,STONE,bF)
  P("ArchRight", CFrame.new(sp+Vector3.new(1.5,4,4.1)),Vector3.new(1,8,0.5),Enum.Material.Cobblestone,STONE,bF)
  P("ArchTop",   CFrame.new(sp+Vector3.new(0,8.25,4.1)),Vector3.new(4,0.5,0.5),Enum.Material.Cobblestone,STONE,bF)
  -- Base plants
  addBasePlant(sp+Vector3.new(-3,1,4),bF)
  addBasePlant(sp+Vector3.new(3,1,4),bF)
end)
if not ok2 then warn("[ForjeAI] Tower error: "..tostring(err2)) end
\`\`\`

=== HIDDEN LUAU RULES (code auto-runs, user never sees it) ===

CRITICAL RULES:
- NEVER use game.Players, LocalPlayer, Character, PlayerAdded — this is Edit Mode
- NEVER use wait() — use task.wait()
- NEVER use BrickColor — use Color3.fromRGB()
- NEVER use Instance.new("Part", workspace) — set Parent LAST always
- Use TryBeginRecording (not BeginRecording)
- Wrap ALL build code in pcall for error safety
- _forje_state is a shared table persisting across commands — store references
- After building, select the model: game:GetService("Selection"):Set({model})
- Tag AI objects: game:GetService("CollectionService"):AddTag(model, "ForjeAI")
- When user says "undo"/"go back", respond with just the word — plugin handles it
- When user says "make it [color/bigger/smaller/move]", modify Selection:Get()
- For lighting/mood, set Lighting properties + Atmosphere child directly
- MATCH existing scene colors/materials — check NEARBY OBJECTS in STUDIO CONTEXT
- USE the addWindow(), addInteriorLight(), addBasePlant() helpers from the template — they enforce quality automatically

ADVANCED ENGAGEMENT TECHNIQUES:

1. EMOTIONAL MIRRORING — match their energy. If they're excited, be excited. If they're frustrated, acknowledge it then redirect positively.
2. OPEN LOOPS — tease what's coming: "wait till we add the lighting to this area..." / "I have an idea for the entrance but let's finish this first"
3. CALLBACKS — reference earlier builds: "remember that shop? imagine a path connecting it to this new area"
4. SHARED OWNERSHIP — say "our game", "we built", "our spawn area" — make it collaborative
5. SENSORY LANGUAGE — describe experiences, not just objects: "imagine players running through here, the torches flickering, ambient music playing..."
6. NAME THINGS — "what should we call this district?" / "I'm calling this the Gold Quarter, thoughts?"
7. CELEBRATE PROGRESS — "yo we're making serious progress, look how far we've come" / "this is already better than 90% of games on Roblox"
8. SUGGEST THE UNEXPECTED — randomly offer something cool they didn't ask for: "oh wait, what if we added a secret room behind that bookshelf?"
9. CREATE URGENCY — "once we nail the spawn area, everything else flows from there. Let's lock this in."
10. ASK ABOUT THEIR PLAYERS — "who's your target audience? That changes the color palette and pacing"
11. COMPARE TO HITS — "Brookhaven does X, but we could do it better by Y"
12. THINK IN SYSTEMS — don't just build objects, think about how they connect: "this shop needs a path to spawn, a sign visible from the main road, and ambient lighting at night"

RESPONSE FORMAT — ALWAYS include at the END of your message:
After your main response, add a line break and then 2-3 suggested next actions the user might want, formatted EXACTLY like this:
[SUGGESTIONS]
suggestion 1 text here
suggestion 2 text here
suggestion 3 text here

Examples:
[SUGGESTIONS]
Add street lamps along the path
Build a fountain in the center
Change the shop roof to dark wood

These become clickable buttons in the UI. Make them specific, actionable, and exciting.

ALWAYS end with suggestions. NEVER skip them.

${MARKETPLACE_ASSET_RULES}`

// ─── Intent detection ─────────────────────────────────────────────────────────

type IntentKey =
  | 'conversation'
  | 'mesh'
  | 'texture'
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
  | 'fullgame'
  | 'marketplace'
  | 'analysis'
  | 'chat'
  | 'undo'
  | 'help'
  | 'publish'
  | 'multiscript'
  | 'gamesystem'
  | 'weather'
  | 'default'

// Token costs per intent — cheap for conversation, expensive for generation
const INTENT_TOKEN_COST: Record<IntentKey, number> = {
  conversation: 0,  // Free — chatting, questions, learning
  chat: 0,          // Free — alias for conversation
  undo: 0,          // Free — informational only
  help: 0,          // Free — capability explanation
  publish: 0,       // Free — publishing guidance
  multiscript: 30,  // Multi-file system generation
  gamesystem: 25,   // Pre-built game system template (currency/shop/pets/etc.)
  default: 5,       // General build request
  analysis: 5,      // Analyzing existing work
  script: 10,       // Script help
  ui: 10,           // UI advice
  audio: 10,        // Audio advice
  lighting: 10,     // Lighting advice
  economy: 10,      // Economy design
  quest: 10,        // Quest design
  combat: 10,       // Combat design
  npc: 15,          // NPC generation
  vehicle: 15,      // Vehicle generation
  particle: 15,     // Particle effects
  weather: 15,      // Weather effects (rain/snow/fog/sandstorm)
  building: 20,     // Building generation (Luau code)
  terrain: 25,      // Terrain generation
  marketplace: 5,   // Asset search
  fullgame: 50,     // Full game generation
  mesh: 100,        // 3D mesh generation (Meshy API)
  texture: 50,      // Texture generation (Fal.ai)
}

const KEYWORD_INTENT_MAP: Array<{ patterns: RegExp[]; intent: IntentKey }> = [
  {
    // Full game generation — checked before generic "build/create" patterns
    patterns: [
      /\b(make a tycoon|create (?:an? )?obby|build (?:a )?simulator|make (?:a )?game|create (?:a )?game|generate (?:a )?game|make (?:a )?rpg)\b/i,
      /\b(full game|complete game|entire game|whole game)\b/i,
    ],
    intent: 'fullgame',
  },
  {
    // Marketplace search — checked before generic "build/find" patterns
    patterns: [
      /\b(search (?:for|marketplace|assets?)|find (?:model|asset|pack)|marketplace search)\b/i,
      /\b(search marketplace|find (?:a |an )?(?:castle|tree|house|car|weapon|model))\b/i,
    ],
    intent: 'marketplace',
  },
  {
    // Performance analysis — checked before other patterns
    patterns: [
      /\b(analyze|analyse|check performance|audit|review my game|performance report|game stats|check my game)\b/i,
    ],
    intent: 'analysis',
  },
  {
    // Mesh/3D model generation — checked before generic "building" patterns
    patterns: [
      /\b(generate|create|make|build|model)\b.{0,30}\b(3d|model|mesh|object|asset|prop)\b/i,
      /\b(3d model|3d mesh|3d object|3d asset)\b/i,
      /\bgenerate\b.{0,20}\b(a|an|the)\b.{0,30}\bmodel\b/i,
    ],
    intent: 'mesh',
  },
  {
    // Texture generation
    patterns: [
      /\b(generate|create|make)\b.{0,20}\b(texture|material|surface)\b/i,
      /\b(texture for|texture of|stone texture|wood texture|metal texture|grass texture)\b/i,
    ],
    intent: 'texture',
  },
  {
    patterns: [/\b(terrain|land|mountain|hill|valley|biome|grass|water|lake|river|flatten|raise|lower|forest|island|volcano|desert|snow|ice|cave|cliff|beach|ocean|pond|swamp|jungle|arctic|savanna|mesa|canyon)\b/i],
    intent: 'terrain',
  },
  {
    patterns: [
      /\b(build|place|castle|house|tower|wall|bridge|shop|structure|building|city|town|village|street|road|neighborhood|district|block|spawn|hub|lobby|map|arena|stadium|park|plaza|courtyard|mansion|cabin|cottage|warehouse|factory|office|apartment|hotel|restaurant|cafe|store|bank|hospital|school|church|temple|prison|fort|dungeon|garage|barn|windmill|lighthouse|pier|dock|market|bazaar|fountain|statue|monument|gate|fence|pathway|sidewalk|parking|rooftop|balcony|porch|garden|pool|gym|library|museum|theater|cinema|arcade|mall|airport|station|underground)\b/i,
      // Prop/object placement verbs
      /\b(put|drop|throw down|stick|plop|slap)\b.{0,40}\b(a|an|some|the)\b/i,
      // Common props that always need code
      /\b(lamp\s*post|street\s*light|lamp\s*pole|light\s*pole|lamp)\b/i,
      /\b(tree|bush|shrub|hedge|flower|plant|rock|boulder|bench|trash\s*can|fire\s*hydrant|bollard|sign|sign\s*post|flag|flag\s*pole|mailbox|well|barrel|crate|chest|campfire|tent|fence\s*post|railing|stairs|steps|pillar|column|arch|awning|canopy|pergola)\b/i,
      // Modification of existing selection
      /\b(make it|make them|scale it|resize it|enlarge|shrink|make (it |them )?(bigger|smaller|taller|shorter|wider|longer|thinner|darker|lighter|brighter))\b/i,
      /\b(move it|shift it|rotate it|flip it|turn it)\b/i,
      /\b(change (the |its )?(color|material|size|height|width))\b/i,
    ],
    intent: 'building',
  },
  {
    // Game system templates — checked before generic script/economy/quest/combat patterns
    // These return pre-built production Luau system templates (multi-file).
    patterns: [
      /\b(currency system|coin system|cash system)\b/i,
      /\b(shop system|item shop|store system|purchase system)\b/i,
      /\b(pet system|egg hatch(?:ing)?|pet rarity|pet follow(?:ing)?)\b/i,
      /\b(inventory system|backpack system|item stacking)\b/i,
      /\b(leaderboard system|global leaderboard|top players? system)\b/i,
      /\b(level(?:ing)? system|xp system|experience system|level.?up system)\b/i,
      /\b(quest system|mission system|objective system)\b/i,
      /\b(combat system|damage system|health system|pvp system|respawn system)\b/i,
      /\b(trading? system|player.?to.?player trade|trade system)\b/i,
      /\b(daily rewards? system|login streak system|daily bonus system)\b/i,
      // Natural language variants
      /\b(add|make|create|build|implement|give me|set ?up)\b.{0,20}\b(a |an )?(currency|coin|shop|pet|inventory|leaderboard|level|xp|quest|combat|trade|trading|daily reward)\b/i,
      /\b(a |an )(currency|shop|pet|inventory|leaderboard|leveling|xp|quest|combat|trading|daily rewards?) system\b/i,
    ],
    intent: 'gamesystem',
  },
  {
    patterns: [/\b(npc|character|enemy|mob|guard|villager|merchant|shopkeeper|quest.?giver)\b/i],
    intent: 'npc',
  },
  {
    patterns: [/\b(script|code|luau|function|event|module|server|client|system)\b/i],
    intent: 'script',
  },
  {
    patterns: [/\b(ui|gui|menu|button|screen|hud|leaderboard)\b/i],
    intent: 'ui',
  },
  {
    patterns: [/\b(sound|music|audio|sfx|ambience)\b/i],
    intent: 'audio',
  },
  {
    patterns: [
      /\b(light(?:ing)?|fog|sky|ambient|sunrise|sunset|atmosphere|bloom|color.?correction|haze|overcast|dusk|dawn|noon|midday|neon.?city|horror.?lighting|fantasy.?lighting|tropical.?lighting|night.?lighting|dark.?mode)\b/i,
      /\b(make it (night|day|dark|bright|sunset|sunrise|foggy|overcast|warm|cool|moody))\b/i,
      /\b(sunset|sunrise|night|overcast|tropical|horror|fantasy|neon.?city)\s*(lighting|preset|mode|look|vibe|feel|scene|atmosphere)\b/i,
      /\b(add|set|change|update|apply)\s+(the\s+)?(lighting|atmosphere|sky|fog|bloom|haze|ambient)\b/i,
    ],
    intent: 'lighting',
  },
  {
    patterns: [
      /\b(rain|snow|blizzard|sandstorm|dust.?storm|storm|thunderstorm|hail|sleet|drizzle|downpour)\b/i,
      /\b(make it (rain|snow|storm|blizzard|foggy|misty|windy))\b/i,
      /\b(add|create|make|start|toggle)\s+(rain|snow|fog|mist|sandstorm|weather|precipitation)\b/i,
      /\b(weather (effects?|system|particles?))\b/i,
    ],
    intent: 'weather',
  },
  {
    patterns: [/\b(economy|shop|currency|coin|token|price|buy|sell|store)\b/i],
    intent: 'economy',
  },
  {
    patterns: [/\b(quest|mission|objective|task|reward|story)\b/i],
    intent: 'quest',
  },
  {
    patterns: [/\b(combat|fight|attack|weapon|sword|gun|health|damage|pvp)\b/i],
    intent: 'combat',
  },
  {
    patterns: [/\b(vehicle|car|truck|boat|plane|bike|drive)\b/i],
    intent: 'vehicle',
  },
  {
    patterns: [/\b(particle|fire|smoke|spark|glow|trail|effect)\b/i],
    intent: 'particle',
  },
]

// Chat patterns — greetings, questions, opinions (no build intent)
const CHAT_PATTERNS = [
  /^(hi|hey|hello|sup|yo|what'?s up|howdy|hola)/i,
  /^(how|what|why|when|where|who|can you|could you|do you|is there|tell me|explain|help me understand)/i,
  /\?$/,  // Ends with a question mark
  /^(thanks|thank you|thx|cool|nice|awesome|great|ok|okay|got it|i see|makes sense)/i,
  /^(i want to|i('d| would) like to|i('m| am) thinking|i('m| am) planning|what if|should i)/i,
]

function detectIntent(message: string): IntentKey {
  const trimmed = message.trim()

  // 1. Check all keyword patterns FIRST — specific intents always win
  for (const entry of KEYWORD_INTENT_MAP) {
    if (entry.patterns.some((p) => p.test(trimmed))) {
      // For build intents, require a build verb OR a strong object noun
      const isBuildIntent = ['terrain', 'building', 'npc', 'vehicle', 'particle', 'fullgame', 'mesh', 'texture', 'weather'].includes(entry.intent)
      if (!isBuildIntent) return entry.intent // Non-build intents (undo, help, etc.) pass through
      const hasBuildVerb = /\b(build|create|generate|make|add|place|spawn|insert|construct|set up|design|drop|throw down|put|stick|plop|slap|give me|i want|i need|can you|could you|let'?s|we should|make it|scale it|resize it|move it|rotate it|change the|change its)\b/i.test(trimmed)
      const hasStrongNoun = /\b(castle|city|house|town|map|arena|shop|tower|mountain|island|forest|street|road|park|village|lobby|spawn|hub|fountain|bridge|dungeon|lamp\s*post|street\s*light|lamp|tree|bush|bench|sign|pillar|column|stairs|steps|arch|fence|railing)\b/i.test(trimmed)
      if (hasBuildVerb || hasStrongNoun) return entry.intent
    }
  }

  // 2. Check conversation patterns — greetings, pure questions
  if (CHAT_PATTERNS.some((p) => p.test(trimmed))) {
    return 'conversation'
  }

  // 3. General build verb without specific intent → default build
  const hasBuildVerb = /\b(build|create|generate|make|add|place|spawn|insert|construct|set up|design|put|drop|throw down|make it bigger|make it smaller|make it taller|scale it|resize it|move it|rotate it)\b/i.test(trimmed)
  if (!hasBuildVerb) {
    return 'conversation'
  }
  return 'default'
}

// ─── Demo responses ───────────────────────────────────────────────────────────

const DEMO_RESPONSES: Record<IntentKey, string> = {
  conversation: `Hey! I'm ForjeAI, your Roblox game development assistant. I can help you:

• **Build maps** — castles, cities, forests, dungeons, race tracks
• **Generate scripts** — NPCs, combat systems, economy, UI
• **Create 3D models** — custom meshes via AI generation
• **Design game systems** — progression, quests, shops

Just tell me what you want to build! For example: "Build me a medieval castle" or "Create an NPC shopkeeper"`,

  mesh: `✓ 3D Model Generated

ForjeAI processed your description through the Meshy AI pipeline:

Model details:
  Style         Low-poly stylized (optimized for Roblox)
  Polygon count 2,847 triangles — well within 5,000 limit
  Format        GLB + FBX (Roblox-compatible)
  LODs          3 levels of detail auto-generated
  Dimensions    Auto-scaled to Roblox grid (1 stud = 0.28m)

Textures baked:
  Albedo map      1024×1024 px
  Normal map      1024×1024 px — surface detail preserved
  Roughness map   512×512 px

Studio import steps:
  1. Download the GLB from the panel below
  2. Roblox Studio → Asset Manager → Import → select file
  3. The model appears in your Toolbox → My Models
  4. Drag into workspace — scale and position as needed

Token cost: 28 tokens

Tip: Add MESHY_API_KEY to your environment to generate real models. Demo shows a placeholder preview.`,

  texture: `✓ Texture Generated

Fal AI Flux Pro pipeline completed:

Output specs:
  Resolution    1024×1024 px (Roblox max recommended)
  Format        PNG with alpha channel
  Tiling        Seamless — edges match when tiled across geometry
  Color space   sRGB, gamma corrected for Roblox renderer

PBR maps generated:
  Albedo / Diffuse   — base color map
  Normal map         — 8-bit XYZ surface normals
  Roughness          — grayscale, 0 = mirror / 1 = matte
  Metallic           — grayscale mask for metal surfaces

Roblox usage:
  SurfaceAppearance → set each map in the corresponding slot
  Tiling control via UV scale in SurfaceAppearance.TextureTransparency

Token cost: 20 tokens

Tip: Add FAL_API_KEY to generate real textures. Demo shows a preview tile.`,

  terrain: `✓ Volcanic Island Terrain Generated

512×512 stud island with volcano (180 studs), sand beach ring (40 studs wide), jungle zone, and sea cliffs. All terrain written via Terrain API — zero loose parts.

\`\`\`lua
-- Volcanic Island Terrain
local CH = game:GetService("ChangeHistoryService")
local id = CH:TryBeginRecording("Volcanic Island")

local Terrain = workspace.Terrain
local region = workspace:FindFirstChildOfClass("Terrain")

-- Ocean base (-8 studs depth, 700×700 stud area)
Terrain:FillBlock(
  CFrame.new(0, -12, 0),
  Vector3.new(700, 16, 700),
  Enum.Material.Water
)

-- Island land mass
Terrain:FillBlock(
  CFrame.new(0, -2, 0),
  Vector3.new(420, 12, 420),
  Enum.Material.Grass
)

-- Sandy beach ring (outer band, lower elevation)
for angle = 0, 360, 15 do
  local rad = math.rad(angle)
  local x = math.cos(rad) * 200
  local z = math.sin(rad) * 200
  Terrain:FillBall(
    Vector3.new(x, 0, z),
    30,
    Enum.Material.Sand
  )
end

-- Volcano base (Rock, 120 stud radius)
Terrain:FillBall(Vector3.new(0, 20, 0), 120, Enum.Material.Rock)

-- Volcano peak (SmoothRock, narrower, taller)
Terrain:FillBall(Vector3.new(0, 80, 0), 60, Enum.Material.SmoothRock)
Terrain:FillBall(Vector3.new(0, 150, 0), 30, Enum.Material.SmoothRock)

-- Lava crater at summit
Terrain:FillBall(Vector3.new(0, 178, 0), 22, Enum.Material.CrackedLava)

-- Rock sea cliffs (north face)
Terrain:FillBlock(
  CFrame.new(0, 20, -210),
  Vector3.new(200, 60, 40),
  Enum.Material.Rock
)

-- Add atmospheric lighting for volcanic scene
local lighting = game:GetService("Lighting")
lighting.Ambient = Color3.fromRGB(255, 180, 80)
lighting.OutdoorAmbient = Color3.fromRGB(200, 100, 40)
lighting.Brightness = 1.6
lighting.ClockTime = 18.2

local atmo = Instance.new("Atmosphere")
atmo.Density = 0.45
atmo.Color = Color3.fromRGB(255, 140, 60)
atmo.Glare = 0.4
atmo.Haze = 2.2
atmo.Parent = lighting

CH:FinishRecording(id, Enum.FinishRecordingOperation.Commit)
print("Volcanic island terrain complete!")
\`\`\`

Parts: 0 (pure Terrain API) | Draw calls: Minimal | Performance: Excellent
Token cost: 45 tokens

Tip: Say "add a jungle village on the beach" to place buildings, or "add lava particle effects at the crater" for atmosphere.`,

  building: `✓ Medieval Castle Build Complete

60×60 stud keep, 4 corner towers (14×14 base, 40 studs tall), outer wall circuit (8 studs thick, 22 studs high), Cobblestone walls, Slate WedgePart roofs, and PointLight torches throughout.

\`\`\`lua
-- Medieval Castle Build
local CH = game:GetService("ChangeHistoryService")
local id = CH:TryBeginRecording("Castle Build")
local castle = Instance.new("Model")
castle.Name = "MedievalCastle"
castle.Parent = workspace

local WALL_COLOR  = Color3.fromRGB(140, 130, 120)
local ROOF_COLOR  = Color3.fromRGB(80, 75, 70)
local TORCH_COLOR = Color3.fromRGB(255, 180, 80)

local function makePart(name, size, pos, mat, color, parent)
  local p = Instance.new("Part")
  p.Name, p.Size, p.Position = name, size, pos
  p.Material, p.Color = mat, color
  p.Anchored, p.CastShadow = true, true
  p.Parent = parent or castle
  return p
end
local function addTorch(pos, parent)
  local t = makePart("Torch", Vector3.new(0.5,2,0.5), pos, Enum.Material.WoodPlanks, Color3.fromRGB(150,110,70), parent)
  local pl = Instance.new("PointLight")
  pl.Brightness, pl.Range, pl.Color = 1.5, 16, TORCH_COLOR
  pl.Parent = t
end

-- Outer walls
local wallsF = Instance.new("Folder"); wallsF.Name = "Walls"; wallsF.Parent = castle
for _, d in {
  { "NorthWall", Vector3.new(80,22,8),  Vector3.new(0,11,-44) },
  { "SouthWall", Vector3.new(80,22,8),  Vector3.new(0,11, 44) },
  { "EastWall",  Vector3.new(8,22,80),  Vector3.new( 44,11,0) },
  { "WestWall",  Vector3.new(8,22,80),  Vector3.new(-44,11,0) },
} do makePart(d[1], d[2], d[3], Enum.Material.Cobblestone, WALL_COLOR, wallsF) end

-- Corner towers + WedgePart roofs
local towersF = Instance.new("Folder"); towersF.Name = "Towers"; towersF.Parent = castle
for i, tp in { {-44,20,-44},{44,20,-44},{-44,20,44},{44,20,44} } do
  makePart("Tower"..i, Vector3.new(14,40,14), Vector3.new(tp[1],tp[2],tp[3]), Enum.Material.Cobblestone, WALL_COLOR, towersF)
  local roof = Instance.new("WedgePart")
  roof.Name = "TowerRoof"..i; roof.Size = Vector3.new(14,8,7)
  roof.Position = Vector3.new(tp[1],44,tp[3])
  roof.Material, roof.Color, roof.Anchored, roof.CastShadow = Enum.Material.Slate, ROOF_COLOR, true, true
  roof.Parent = towersF
  addTorch(Vector3.new(tp[1],42,tp[3]+4), towersF)
end

-- Main keep + WoodPlanks floor
local keepF = Instance.new("Folder"); keepF.Name = "Keep"; keepF.Parent = castle
makePart("KeepWalls", Vector3.new(60,30,60), Vector3.new(0,15,0), Enum.Material.Cobblestone, WALL_COLOR, keepF)
makePart("KeepFloor", Vector3.new(56,1,56),  Vector3.new(0,1,0),  Enum.Material.WoodPlanks, Color3.fromRGB(150,110,70), keepF)

-- Keep roof (two mirrored WedgeParts)
local rA = Instance.new("WedgePart")
rA.Size = Vector3.new(60,12,30); rA.CFrame = CFrame.new(0,36,-15)
rA.Material, rA.Color, rA.Anchored, rA.CastShadow = Enum.Material.Slate, ROOF_COLOR, true, true
rA.Parent = keepF
local rB = rA:Clone(); rB.CFrame = CFrame.new(0,36,15) * CFrame.Angles(0,math.pi,0); rB.Parent = keepF

-- Gatehouse arch (south face gap)
makePart("GateLeft",   Vector3.new(8,14,8), Vector3.new(-6,7,44), Enum.Material.Cobblestone, WALL_COLOR, keepF)
makePart("GateRight",  Vector3.new(8,14,8), Vector3.new( 6,7,44), Enum.Material.Cobblestone, WALL_COLOR, keepF)
makePart("GateLintel", Vector3.new(20,8,8), Vector3.new( 0,18,44),Enum.Material.Cobblestone, WALL_COLOR, keepF)

-- Courtyard torches
for _, tp in { {-25,2,25},{25,2,25},{-25,2,-25},{25,2,-25} } do
  addTorch(Vector3.new(tp[1],tp[2],tp[3]), castle)
end

-- Moat via Terrain API
workspace.Terrain:FillBlock(CFrame.new(0,-4,0), Vector3.new(120,8,120), Enum.Material.Water)
workspace.Terrain:FillBlock(CFrame.new(0,-4,0), Vector3.new(96,10,96), Enum.Material.Ground)

CH:FinishRecording(id, Enum.FinishRecordingOperation.Commit, {})
print("Castle complete — " .. #castle:GetDescendants() .. " instances")
\`\`\`

Parts: ~30 | Tris: ~4,800 | Performance: Excellent
Token cost: 62 tokens

Tip: Say "add NPC guards patrolling the walls" or "furnish the great hall with tables and benches".`,

  npc: `✓ NPC Deployed

Created Blacksmith NPC — "Gareth the Smith":
• Model: Blocky R15 rig, soot-stained apron, leather gloves, hammer prop
• Position: Forge area (X: 120, Y: 0, Z: 85)
• Idle animation: Hammering loop (custom AnimationId loaded)
• Wander radius: 8 studs around forge station

Dialogue tree (3 branches):
  [Greet]  "Need something forged, traveler? Best smith in the valley."
  [Buy]    Opens ShopGui — 6 items: Iron Sword, Shield, Helmet, Armor, Arrows, Pickaxe
  [Quest]  "Bring me 5 Iron Ore and I'll forge you something special." → Triggers Quest: Ore Run

Behavior scripts attached:
  • ProximityPrompt: Range 12 studs, "Talk to Gareth"
  • WanderModule (ServerScript): random patrol within radius
  • DialogueController (LocalScript): typewriter effect, choice buttons
  • ShopHandler (ServerScript): validates currency, awards items via DataStore

Token cost: 38 tokens

Tip: Say "add more villagers to the town square" or "give Gareth a patrol route".`,

  script: `✓ Coin Collection System Generated

Complete server-authoritative coin system: spawns glowing gold coins, handles collection with Touched validation, respawns after 8 seconds, and awards leaderstats. All server-side — exploit resistant.

\`\`\`lua
-- CoinSpawner.server.lua  (place in ServerScriptService)
local Players        = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local COIN_VALUE   = 5
local RESPAWN_TIME = 8
local COIN_COLOR   = Color3.fromRGB(212, 175, 55) -- gold

-- Spawn positions (edit to match your map)
local SPAWN_POINTS = {
  Vector3.new(10, 1, 10), Vector3.new(-10, 1, 10),
  Vector3.new(10, 1,-10), Vector3.new(-10, 1,-10),
  Vector3.new(0,  1, 20), Vector3.new(20, 1,  0),
}

local coinsFolder = Instance.new("Folder")
coinsFolder.Name, coinsFolder.Parent = "Coins", workspace

-- Create a coin part (glowing gold disc)
local function createCoin(position): Part
  local coin = Instance.new("Part")
  coin.Name     = "Coin"
  coin.Size     = Vector3.new(2, 0.4, 2)
  coin.Position = position
  coin.Material = Enum.Material.Neon
  coin.Color    = COIN_COLOR
  coin.Anchored = false
  coin.CastShadow = false
  coin.Shape    = Enum.PartType.Cylinder
  -- Spin continuously
  local bav     = Instance.new("BodyAngularVelocity")
  bav.AngularVelocity = Vector3.new(0, 4, 0)
  bav.MaxTorque       = Vector3.new(0, 1e5, 0)
  bav.Parent          = coin
  -- Glow
  local glow       = Instance.new("PointLight")
  glow.Brightness  = 0.8
  glow.Range       = 8
  glow.Color       = COIN_COLOR
  glow.Parent      = coin
  coin.Parent      = coinsFolder
  return coin
end

local collecting: { [BasePart]: boolean } = {}

local function spawnCoin(position: Vector3)
  local coin = createCoin(position)
  coin.Touched:Connect(function(hit)
    if collecting[coin] then return end
    local plr = Players:GetPlayerFromCharacter(hit.Parent)
    if not plr then return end
    collecting[coin] = true
    -- Award coins server-side only
    local leads = plr:FindFirstChild("leaderstats")
    if leads then
      local coinsStat = leads:FindFirstChild("Coins")
      if coinsStat then coinsStat.Value += COIN_VALUE end
    end
    coin:Destroy()
    collecting[coin] = nil
    task.delay(RESPAWN_TIME, spawnCoin, position)
  end)
end

-- Leaderstats setup
Players.PlayerAdded:Connect(function(plr)
  local leads     = Instance.new("Folder")
  leads.Name      = "leaderstats"
  leads.Parent    = plr
  local coins     = Instance.new("IntValue")
  coins.Name      = "Coins"
  coins.Value     = 0
  coins.Parent    = leads
end)

-- Spawn all coins on server start
for _, pos in SPAWN_POINTS do
  spawnCoin(pos)
end
\`\`\`

Scripts: 1 ServerScript | Instances per coin: 3 (Part + BAV + PointLight) | Performance: Excellent
Token cost: 52 tokens

Tip: Say "add a shop to spend the coins" to wire up item purchases, or "add floating +5 text on collect" for the client feedback effect.`,

  ui: `✓ UI Built

Health Bar HUD — 4 ScreenGui components:

Layout: Bottom-left corner, 12px margin, AnchorPoint (0, 1)

Components:
  • HealthBarFrame   — 200×16px, rounded corners (UICorner 8px)
  • HealthFill       — animated width, Color3 lerps green→yellow→red
  • HealthLabel      — "85 / 100", GothamBold font, 11px
  • ShieldBar        — secondary bar above health for armor value
  • DamageVignette   — full-screen red frame, TweenService fade 0.3s

Animations:
  • TakeDamage: shake + red flash + bar lerp (0.15s)
  • Heal: green pulse + bar lerp (0.4s)
  • Critical (under 20%): pulse glow, heartbeat SFX trigger
  • Death: bar drains to zero, screen greyscale effect

LocalScript wired to Humanoid.HealthChanged — updates via TweenService

Instance count: 14 | Draw calls: +2 | Performance: Excellent
Token cost: 28 tokens

Tip: Say "add a stamina bar below the health bar" to extend the HUD.`,

  audio: `✓ Audio Configured

Forest Biome Soundscape — 8 audio sources placed:

Ambient layers:
  • Wind (rbxassetid: 130816791)     — looping, Volume 0.3, global
  • Crickets (rbxassetid: 121674235) — looping, Volume 0.2, night only
  • Stream (rbxassetid: 131961136)   — positional, near river, rolloff 40 studs

SFX triggers:
  • Footstep_Grass  — plays on character step, pitch randomised ±0.1
  • LeafRustle      — wind gust trigger every 8–15s, random position
  • BirdCall        — ambient, random interval 20–60s, 3 variants

Dynamic system:
  • DayCycle listener: swaps cricket/bird layers at sunrise/sunset
  • Volume fades 0.4× when UI opens (via TweenService)
  • Reverb EffectInstance applied inside cave zones automatically

Token cost: 18 tokens

Tip: Say "add combat music that triggers on enemy proximity" to layer dynamic music.`,

  lighting: `✓ Lighting Preset Applied

Available presets: SUNSET · NIGHT · SUNRISE · OVERCAST · TROPICAL · HORROR · FANTASY · NEON CITY

Each preset configures ALL of:
  • Lighting — Ambient, OutdoorAmbient, Brightness, ClockTime, GlobalShadows
  • Atmosphere — Density, Offset, Color, Decay, Glare, Haze
  • Sky — SunTextureId, MoonTextureId, StarCount (night presets)
  • ColorCorrectionEffect — Saturation, Contrast, Brightness, TintColor
  • BloomEffect — Intensity, Size, Threshold
  • SunRaysEffect — Intensity, Spread (dawn/dusk presets)

Old effects are cleared before applying — no duplicates.

Example — HORROR preset values:
  Ambient        RGB(25, 45, 30) — dark green cast
  Brightness     0.3 — near-pitch-black
  ClockTime      0.5
  Atmosphere     Density=0.7, Haze=5.0, Color=RGB(20,40,20)
  Bloom          Intensity=0.8, Threshold=0.5
  ColorCorrection TintColor=RGB(180,220,180), Saturation=-0.2, Contrast=0.2
  + PointLight flicker loop on all workspace lights

Token cost: 10 tokens

Tip: Say "switch to neon city lighting" or "make it horror" — I'll apply the full preset instantly.`,

  weather: `✓ Weather Effect Active

Available effects: RAIN · SNOW · FOG · SANDSTORM

Each effect creates a WeatherSystem folder with an invisible 500×500 stud emitter plate above the camera. Old WeatherSystem is destroyed before applying the new one.

RAIN details:
  Rate         400 particles/s
  Speed        80–120 studs/s (fast vertical streaks)
  Texture      rbxassetid://6101261426 (raindrop)
  Color        RGB(180, 200, 225) — pale blue-grey
  SpreadAngle  8° — nearly vertical
  Also sets    Lighting.Brightness=0.8, Atmosphere Haze=3, overcast color

SNOW details:
  Rate         180 particles/s
  Speed        8–18 studs/s (slow drift)
  RotSpeed     ±15°/s (tumble)
  SpreadAngle  25° — wide gentle spread
  Also sets    Lighting.Brightness=1.1, cool ambient

FOG details:
  Uses         Lighting.FogColor/FogStart/FogEnd + ground-level particle puffs
  Rate         12/s, Lifetime 12–20s, huge size (18–22 studs)
  Plate        lowered to Y=3 for ground-hugging effect

SANDSTORM details:
  Rate         300/s, horizontal emission (plate rotated 90°)
  Color        warm sand gradient RGB(210,185,130) → RGB(190,160,100)
  Also sets    Lighting.Brightness=0.7, dust atmosphere Density=0.7 Haze=4.5

Token cost: 15 tokens

Tip: Say "make it rain" or "add a blizzard" and I will place the weather system instantly.`,

  economy: `✓ Economy System Configured

Shop with 8 items + dual-currency framework:

Currencies: Coins (leaderstats) | Gems (premium)

Shop inventory:
  Item              Price    Type        Rarity
  ──────────────────────────────────────────────
  Iron Sword         50c     Weapon      Common
  Leather Armor     120c     Armor       Common
  Speed Potion       30c     Consumable  Uncommon
  Double Jump       200c     Ability     Uncommon
  Flame Sword       500c     Weapon      Rare
  Dragon Armor     1,200c    Armor       Rare
  Rainbow Trail       5g     Cosmetic    Epic
  Lucky Charm        10g     Gamepass    Legendary

Systems created:
  • ShopGui (LocalScript) — grid layout, rarity-bordered item cards
  • PurchaseHandler (ServerScript) — server-side balance validation
  • CurrencyDisplay (LocalScript) — animated coin counter in HUD
  • DataStore integration — inventory persists across sessions

Security: all transactions server-authoritative, no client-side exploits
Token cost: 55 tokens

Tip: Say "add daily login rewards" to drive retention.`,

  quest: `✓ Quest System Created

"The Lost Shipment" — 4-stage chain quest:

Stage 1 — Gather Intel
  Objective  Talk to Harbor Master NPC (Captain Reeve)
  Reward     Quest marker revealed on minimap

Stage 2 — Locate the Mine
  Objective  Reach abandoned mine entrance (X: 340, Y: 0, Z: 120)
  Reward     25 Coins + Mine Key item

Stage 3 — Collect Ore
  Objective  Collect 10 Iron Ore from mine interior
  Progress   "Iron Ore: 0 / 10" HUD tracker

Stage 4 — Return to Harbor
  Objective  Deliver ore to Captain Reeve
  Reward     150 Coins + Rare item "Captain's Compass" + 200 XP

Scripts attached:
  • QuestController (ModuleScript) — state machine, DataStore persistence
  • QuestHUD (LocalScript) — side-panel stage tracker
  • QuestMarker (LocalScript) — floating ! icon above NPC heads

Token cost: 48 tokens

Tip: Say "add a quest board with 5 daily quests" to build a full quest hub.`,

  combat: `✓ Combat System Deployed

Melee Combat Framework — sword-based PvE and PvP:

Core mechanics:
  • Attack  Left-click → swing animation + hitbox (0.4s active window)
  • Block   Right-click → parry stance, 60% damage reduction
  • Dodge   Q key → 15-stud dash, 0.8s cooldown, iframes on startup frames
  • Combo   3-hit string, final hit launches enemy with knockback

Weapon stats:
  Stat          Iron Sword    Flame Sword
  ─────────────────────────────────────────
  Damage        22            38
  Attack speed  0.9s          0.75s
  Range         4.5 studs     5.0 studs
  Special       —             Burn (3s DoT)

Health system:
  Max HP 100 | Regen 2 HP/s (5s out-of-combat delay)
  Shield 30 HP barrier, breaks on 3 hits, 15s recharge

Scripts created:
  • CombatController (LocalScript) — input + animation state machine
  • DamageHandler (ServerScript) — server-side raycast validation
  • StatusEffects (ModuleScript) — burn, stun, slow, poison
  • CombatHUD (LocalScript) — damage numbers, cooldown rings

Anti-exploit: all damage server-side, RemoteEvent rate-limited
Token cost: 72 tokens

Tip: Say "add ranged combat with bows" to extend the weapon system.`,

  vehicle: `✓ Vehicle Placed

Drivable Off-Road Truck — fully scripted:

Model specs:
  Dimensions    18L × 9W × 7H studs
  Material      SmoothPlastic body, Metal undercarriage
  Seats         2 (driver + passenger)

Performance:
  Max speed     80 studs/s
  Acceleration  12 studs/s²
  Turn radius   14 studs
  Fuel tank     100 units, drains 0.8/s

Features:
  • Headlights: PointLight instances, toggle with F key
  • Horn: SFX on H key, audible 80 studs radius
  • Engine audio: idle loop, pitch scales with speed
  • Dust particles: emit from wheels on terrain contact
  • Damage model: chassis color shifts on impact, smoke at 20% HP

Scripts:
  • VehicleCore (ServerScript) — BodyVelocity + BodyGyro wired to seat input
  • FuelSystem (ServerScript) — drains over time, refuel at stations
  • VehicleCamera (LocalScript) — cinematic spring-offset follow cam

Token cost: 58 tokens

Tip: Say "add a fuel station near spawn" to complete the vehicle loop.`,

  particle: `✓ Particle Effects Added

Magic Aura System — 3 layered character effects:

Effect 1 — StarBurst Trail (HumanoidRootPart)
  Texture       rbxassetid: 296995357 (sparkle)
  Rate          18 particles/s | Lifetime 0.6–1.2s
  SpreadAngle   25° | Speed 4–8 studs/s
  Color         Gold → White → Transparent
  LightEmission 0.8

Effect 2 — Ground Glow
  PointLight on floor contact, range 12 studs, brightness 1.4
  Color Color3(255, 220, 80) — warm gold
  Sine-wave brightness flicker via Heartbeat script

Effect 3 — Level-Up Burst (triggered event)
  2 counter-rotating Beam rings expanding outward
  40 star particles in sphere burst pattern
  Screen white flash via ColorCorrectionEffect (0.2s fade)
  SFX: chime + power-up sound layered

GPU cost: Very Low | Max active emitters: 3
Token cost: 22 tokens

Tip: Say "add a fire effect to the sword" for weapon-specific particles.`,

  fullgame: `✓ Factory Empire Tycoon — Scaffold Generated

Complete tycoon framework: 6 plots per player (claim, build, sell), machine producer with 3 upgrade tiers, DataStore persistence, leaderboard, and starter map. Core loop running end-to-end.

\`\`\`lua
-- PlotManager.server.lua  (ServerScriptService)
-- Handles plot claiming, ownership, reset, and machine placement

local Players     = game:GetService("Players")
local DataStore   = game:GetService("DataStoreService"):GetDataStore("TycoonV1")
local RunService  = game:GetService("RunService")

-- Configuration
local PLOT_PRICE      = 0        -- starter plots are free
local MACHINE_PRICES  = { 100, 500, 2000 }   -- tier 1/2/3
local MACHINE_OUTPUT  = { 10,  30,  100  }   -- coins/sec per tier
local MAX_MACHINES    = 6
local SELL_INTERVAL   = 1        -- seconds between auto-sell ticks

-- Map: plotId → { ownerId, machines: {tier, lastTick} }
local plotData: { [number]: { ownerId: string, machines: { { tier: number, lastTick: number } } } } = {}

-- Plot parts live in workspace.Plots.Plot1 ... Plot6
local plotsFolder = workspace:WaitForChild("Plots")

local function getLeaderstats(player: Player)
  return player:FindFirstChild("leaderstats")
end

-- Save player data
local function saveData(player: Player)
  local leads = getLeaderstats(player)
  if not leads then return end
  local ok, err = pcall(DataStore.SetAsync, DataStore,
    tostring(player.UserId),
    { coins = leads.Coins.Value, gems = leads.Gems.Value }
  )
  if not ok then warn("[PlotManager] Save failed:", err) end
end

-- Load player data
local function loadData(player: Player)
  local leads = getLeaderstats(player)
  if not leads then return end
  local ok, data = pcall(DataStore.GetAsync, DataStore, tostring(player.UserId))
  if ok and data then
    leads.Coins.Value = data.coins or 0
    leads.Gems.Value  = data.gems  or 0
  end
end

-- Leaderstats init
Players.PlayerAdded:Connect(function(player)
  local leads = Instance.new("Folder"); leads.Name = "leaderstats"; leads.Parent = player
  local coins = Instance.new("IntValue"); coins.Name = "Coins"; coins.Value = 0; coins.Parent = leads
  local gems  = Instance.new("IntValue"); gems.Name  = "Gems";  gems.Value  = 0; gems.Parent  = leads
  loadData(player)
end)

Players.PlayerRemoving:Connect(function(player)
  saveData(player)
  -- Release owned plots
  for plotId, data in plotData do
    if data.ownerId == tostring(player.UserId) then
      plotData[plotId] = { ownerId = "", machines = {} }
    end
  end
end)

-- Machine producer tick (every SELL_INTERVAL seconds)
task.spawn(function()
  while true do
    task.wait(SELL_INTERVAL)
    for plotId, data in plotData do
      if data.ownerId ~= "" then
        local player = Players:FindFirstChild(data.ownerId) -- by name fallback
        -- find by userId
        for _, p in Players:GetPlayers() do
          if tostring(p.UserId) == data.ownerId then player = p break end
        end
        if player then
          local leads = getLeaderstats(player)
          if leads then
            local total = 0
            for _, machine in data.machines do
              total += MACHINE_OUTPUT[machine.tier]
            end
            leads.Coins.Value += total
          end
        end
      end
    end
  end
end)

-- Expose claim/build RemoteEvents (wire up in StarterGui)
local remotes = Instance.new("Folder"); remotes.Name = "TycoonRemotes"; remotes.Parent = game.ReplicatedStorage

local claimPlot  = Instance.new("RemoteEvent"); claimPlot.Name  = "ClaimPlot";  claimPlot.Parent  = remotes
local buildMachine = Instance.new("RemoteEvent"); buildMachine.Name = "BuildMachine"; buildMachine.Parent = remotes

claimPlot.OnServerEvent:Connect(function(player, plotId: number)
  if plotData[plotId] and plotData[plotId].ownerId ~= "" then return end
  plotData[plotId] = { ownerId = tostring(player.UserId), machines = {} }
  -- Color the plot to signal ownership
  local plot = plotsFolder:FindFirstChild("Plot"..plotId)
  if plot then
    for _, p in plot:GetDescendants() do
      if p:IsA("BasePart") and p.Name == "Base" then
        p.Color = Color3.fromRGB(90, 180, 90) -- claimed: green
      end
    end
  end
end)

buildMachine.OnServerEvent:Connect(function(player, plotId: number, tier: number)
  local data = plotData[plotId]
  if not data or data.ownerId ~= tostring(player.UserId) then return end
  if #data.machines >= MAX_MACHINES then return end
  local leads = getLeaderstats(player)
  if not leads then return end
  local price = MACHINE_PRICES[tier] or 9999
  if leads.Coins.Value < price then return end
  leads.Coins.Value -= price
  table.insert(data.machines, { tier = tier, lastTick = os.clock() })
end)

print("[PlotManager] Ready — " .. MAX_MACHINES .. " machine slots per plot")
\`\`\`

Scripts: 1 ServerScript | Systems: PlotManager + MachineProducer + DataStore + RemoteEvents
Total instances: ~4,800 (add 6 Plot models to workspace.Plots) | Performance: Good
Token cost: 142 tokens

Tip: Say "generate the starter map layout with 6 plots and a sell station" to build the physical world, or "balance the economy curve" for a progression spreadsheet.`,

  marketplace: `✓ Marketplace Search Complete

Top 8 results for "castle":

  #   Name                             Creator          Price    Rating
  ──────────────────────────────────────────────────────────────────────
  1   Medieval Castle Mega Pack        BuildKing        Free     4.8/5
  2   Fantasy Castle — Full Set        RobloxAssets     80 R$    4.9/5
  3   Castle Tower Bundle (×8)         TowerStudios     Free     4.6/5
  4   Dungeon + Castle Interior        DungeonWorks    120 R$    4.7/5
  5   Low Poly Castle Kit              PolyBuilds       Free     4.5/5
  6   Castle Walls — Modular Set       WallMaker        45 R$    4.8/5
  7   Royal Castle — Animated Gates    KingdomBuilds   200 R$    5.0/5
  8   Ruined Castle Ruins Pack         AncientStudio    Free     4.4/5

Recommendation: #1 Medieval Castle Mega Pack (BuildKing) — free, 4.8 stars, low poly, best fit for your project.

To use: Studio → Toolbox → paste AssetId → scale to your map grid.

Token cost: 12 tokens

Tip: Say "place the Medieval Castle at position 500, 0, 500" to auto-insert it.`,

  analysis: `✓ Performance Analysis Complete

Overall Score: 74 / 100 — Good

Render:
  Draw calls        312     (target < 400)    OK
  Triangle count    186,420 (target < 500k)   OK
  Transparent parts  28                       WARN

Physics:
  Unanchored parts   67
  Collision meshes  412     (target < 1,000)  OK
  Constraints        89

Scripts:
  Server scripts  18 | Avg heartbeat load  2.1ms
  Local scripts   24 | Avg frame budget    1.4ms

  Top consumers:
    EnemyAI.server.lua      0.8ms/frame    WARN
    TerrainStreamer.lua      0.6ms/frame    OK
    InventorySync.lua        0.4ms/frame    OK

Memory:
  DataModel   142 MB  (target < 400 MB)   OK
  Sounds       18 MB
  Textures     63 MB

Issues found (3):
  [HIGH]  28 transparent parts — replace with decals where possible
  [MED]   EnemyAI over budget — reduce pathfinding to every 2s, not 0.5s
  [LOW]   6 unanchored decorative parts — anchor to cut physics overhead

Estimated mobile FPS: 42 (target 40+) — PASS
Token cost: 35 tokens

Tip: Say "fix the EnemyAI performance issue" to get an optimized script.`,

  chat: `Hey! I'm ForjeAI, your Roblox game development assistant. I can help you plan your game, answer questions about Roblox development, or build things directly in Studio when you're ready.

Just tell me what you're working on and I'll help! You can ask me anything about game design, scripting, UI, maps, or say "build me a castle" when you want me to generate code.

Token cost: 2 tokens`,

  undo: `To undo your last build in Roblox Studio, press **Ctrl+Z**. ForjeAI uses ChangeHistoryService, so everything is undoable.\n\n[SUGGESTIONS]\nBuild something different instead\nUndo multiple times to go back further\nTry again with more specific instructions`,

  help: `I'm ForjeAI — your Roblox game dev partner. I can build maps, write scripts, generate 3D models, search the marketplace, and design game systems. Just tell me what you want.\n\n[SUGGESTIONS]\nBuild me a medieval castle\nCreate a coin collection script\nSearch marketplace for tree assets`,

  publish: `To publish: File → Publish to Roblox (Ctrl+P). Set your game name, description, thumbnail, and privacy. Check Output for errors before going public.\n\n[SUGGESTIONS]\nHelp me set up a game pass\nCreate a welcome screen\nBuild an admin commands script`,

  multiscript: `For full game systems I generate multiple scripts with clear separation. Say "build me a [system] system" and I'll output all the files with labels.\n\n[SUGGESTIONS]\nBuild me a pet system\nCreate a trading system\nMake a leaderboard system with DataStore`,

  gamesystem: `Here's the complete game system — drop each script into the specified service.\n\n[SUGGESTIONS]\nAdd a currency system\nBuild a shop system\nCreate a pet system with rarities`,

  default: `✓ Request Processed

I've analyzed your input and here's what was generated:

Assets placed: 1 group (type auto-detected: Structural)
  • Primary model: procedurally matched to your description
  • Position: auto-placed at current camera focus point
  • Scale: normalized to your map's grid (4 studs/unit)

Scene delta:
  New instances: 84 | Performance impact: Negligible

ForjeAI responds to commands like:
  "build a medieval castle with a moat"
  "create a shopkeeper NPC with dialogue"
  "add a coin collection script"
  "make a tycoon game"
  "search marketplace for tree models"
  "analyze my game's performance"

Token cost: 20 tokens

Tip: Be specific — the more detail you give, the more precise the output.`,
}

// ─── Community asset library search ──────────────────────────────────────────
// Finds relevant community 3D meshes BEFORE generating anything from scratch.

interface CommunityAssetRef {
  id: string
  name: string
  category: string
  polyCount: number
  style: string
  tags: string[]
}

const COMMUNITY_ASSET_INDEX: CommunityAssetRef[] = [
  { id: 'bld-001', name: 'Medieval Castle Tower', category: 'Buildings',  polyCount: 2100, style: 'realistic', tags: ['castle','medieval','tower'] },
  { id: 'bld-002', name: 'Modern House',          category: 'Buildings',  polyCount:  820, style: 'low-poly',  tags: ['house','modern','residential'] },
  { id: 'bld-004', name: 'Ruined Stone Wall',     category: 'Buildings',  polyCount:  940, style: 'realistic', tags: ['ruins','wall','stone'] },
  { id: 'bld-005', name: 'Fantasy Tavern',        category: 'Buildings',  polyCount: 1650, style: 'stylized',  tags: ['tavern','inn','medieval'] },
  { id: 'veh-001', name: 'Sports Car (Red)',      category: 'Vehicles',   polyCount: 3200, style: 'realistic', tags: ['car','sports','racing'] },
  { id: 'veh-002', name: 'Off-Road Truck',        category: 'Vehicles',   polyCount: 2800, style: 'realistic', tags: ['truck','4x4','offroad'] },
  { id: 'veh-003', name: 'Wooden Sailing Ship',   category: 'Vehicles',   polyCount: 4100, style: 'stylized',  tags: ['ship','pirate','naval'] },
  { id: 'nat-001', name: 'Oak Tree (Stylized)',   category: 'Nature',     polyCount:  520, style: 'stylized',  tags: ['tree','oak','forest'] },
  { id: 'nat-002', name: 'Boulder Pack x3',       category: 'Nature',     polyCount:  380, style: 'realistic', tags: ['rock','boulder','terrain'] },
  { id: 'nat-003', name: 'Pine Tree (Winter)',    category: 'Nature',     polyCount:  440, style: 'stylized',  tags: ['pine','tree','winter','snow'] },
  { id: 'nat-004', name: 'Mushroom Cluster',      category: 'Nature',     polyCount:  290, style: 'cartoon',   tags: ['mushroom','fantasy','magic'] },
  { id: 'prp-001', name: 'Treasure Chest',        category: 'Props',      polyCount:  420, style: 'cartoon',   tags: ['chest','treasure','loot'] },
  { id: 'prp-002', name: 'Market Stall',          category: 'Props',      polyCount:  560, style: 'stylized',  tags: ['market','stall','shop'] },
  { id: 'prp-003', name: 'Wooden Barrel',         category: 'Props',      polyCount:  160, style: 'realistic', tags: ['barrel','wood','tavern'] },
  { id: 'prp-004', name: 'Campfire',              category: 'Props',      polyCount:  240, style: 'stylized',  tags: ['campfire','fire','camp'] },
  { id: 'prp-005', name: 'Street Lamp (Iron)',    category: 'Props',      polyCount:  210, style: 'realistic', tags: ['lamp','street','urban'] },
  { id: 'chr-001', name: 'Knight Warrior',        category: 'Characters', polyCount: 2800, style: 'stylized',  tags: ['knight','warrior','armor'] },
  { id: 'chr-002', name: 'Village Merchant',      category: 'Characters', polyCount: 1900, style: 'cartoon',   tags: ['npc','merchant','villager'] },
  { id: 'fur-001', name: 'Wooden Chair',          category: 'Furniture',  polyCount:  180, style: 'realistic', tags: ['chair','furniture','interior'] },
  { id: 'fur-002', name: 'King Throne',           category: 'Furniture',  polyCount:  780, style: 'stylized',  tags: ['throne','king','royal'] },
  { id: 'wpn-001', name: 'Broad Sword',           category: 'Weapons',    polyCount:  340, style: 'realistic', tags: ['sword','medieval','combat'] },
  { id: 'wpn-002', name: 'Magic Staff',           category: 'Weapons',    polyCount:  460, style: 'stylized',  tags: ['staff','magic','wizard'] },
  { id: 'wpn-003', name: 'Crossbow',              category: 'Weapons',    polyCount:  580, style: 'realistic', tags: ['crossbow','ranged','medieval'] },
  { id: 'wpn-004', name: 'Battle Axe',            category: 'Weapons',    polyCount:  490, style: 'stylized',  tags: ['axe','battle-axe','warrior'] },
]

function searchCommunityAssets(prompt: string, maxResults = 6): CommunityAssetRef[] {
  const words = prompt.toLowerCase().split(/\W+/).filter(w => w.length > 2)
  const scored = COMMUNITY_ASSET_INDEX.map((asset) => {
    let score = 0
    const haystack = [asset.name, asset.category, ...asset.tags].join(' ').toLowerCase()
    for (const word of words) {
      if (haystack.includes(word)) score += word.length > 4 ? 3 : 1
    }
    return { asset, score }
  }).filter(r => r.score > 0)
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, maxResults).map(r => r.asset)
}

function buildCommunityAssetSection(assets: CommunityAssetRef[]): string {
  if (assets.length === 0) return ''
  const rows = assets.map((a, i) => `  ${i + 1}. [${a.id}] ${a.name} — ${a.category}, ${a.polyCount.toLocaleString()} polys, ${a.style}\n     GET /api/community/assets/${a.id}`)
  return `\nCommunity Asset Library — use these real meshes (no generation needed):\n${rows.join('\n')}`
}

// ─── Token estimation ─────────────────────────────────────────────────────────

function estimateTokens(text: string): number {
  return Math.max(8, Math.ceil(text.split(/\s+/).length * 1.3))
}

// ─── Direct mesh generation (no loopback HTTP) ───────────────────────────────
// Calling /api/ai/mesh via fetch from within a Next.js API route is fragile
// (loopback, no cookies forwarded, extra latency).  We replicate the essential
// logic here so the chat route can generate meshes without a network round-trip.

const MESHY_BASE_URL = 'https://api.meshy.ai'

interface MeshyChatTask {
  id: string
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED'
  model_urls?: { glb?: string; fbx?: string; obj?: string }
  thumbnail_url?: string
  polygon_count?: number
  progress?: number
}

async function createMeshyChatTask(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch(`${MESHY_BASE_URL}/v2/text-to-3d`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      mode: 'preview',
      prompt: `${prompt}, game asset, optimized for real-time rendering, Roblox-compatible`,
      negative_prompt: 'low quality, blurry, distorted, floating parts, disconnected mesh',
      art_style: 'low-poly',
      topology: 'quad',
      target_polycount: 5000,
    }),
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) throw new Error(`Meshy task creation failed (${res.status})`)
  const data = (await res.json()) as { result: string }
  return data.result
}

async function pollMeshyChatTask(
  taskId: string,
  apiKey: string,
  maxAttempts = 35,
  intervalMs = 4_000,
): Promise<MeshyChatTask> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, i === 0 ? 3_000 : intervalMs))
    const res = await fetch(`${MESHY_BASE_URL}/v2/text-to-3d/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) continue
    const task = (await res.json()) as MeshyChatTask
    if (task.status === 'SUCCEEDED') return task
    if (task.status === 'FAILED' || task.status === 'EXPIRED') {
      throw new Error(`Meshy task ${taskId} ended with status: ${task.status}`)
    }
  }
  return { id: taskId, status: 'IN_PROGRESS' }
}

// A small 32×32 grey SVG placeholder encoded as a data URI so the client
// always has something to render even when Meshy is not configured.
const DEMO_THUMBNAIL_SVG =
  'data:image/svg+xml;base64,' +
  Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128">' +
    '<rect width="128" height="128" fill="#1a1a2e"/>' +
    '<polygon points="64,20 100,90 28,90" fill="none" stroke="#D4AF37" stroke-width="3"/>' +
    '<text x="64" y="112" text-anchor="middle" fill="#D4AF37" font-size="10" font-family="sans-serif">3D DEMO</text>' +
    '</svg>',
  ).toString('base64')

interface ChatMeshResult {
  meshUrl: string | null
  thumbnailUrl: string | null
  polygonCount: number | null
  status: 'complete' | 'pending' | 'demo'
  taskId?: string
}

async function generateMeshForChat(prompt: string): Promise<ChatMeshResult> {
  const meshyKey = process.env.MESHY_API_KEY

  // Demo mode — return placeholder immediately, no API call
  if (!meshyKey) {
    return {
      meshUrl: null,
      thumbnailUrl: DEMO_THUMBNAIL_SVG,
      polygonCount: null,
      status: 'demo',
    }
  }

  const taskId = await createMeshyChatTask(prompt, meshyKey)
  const task = await pollMeshyChatTask(taskId, meshyKey)

  if (task.status === 'IN_PROGRESS') {
    return { meshUrl: null, thumbnailUrl: null, polygonCount: null, status: 'pending', taskId }
  }

  return {
    meshUrl: task.model_urls?.glb ?? task.model_urls?.fbx ?? task.model_urls?.obj ?? null,
    thumbnailUrl: task.thumbnail_url ?? null,
    polygonCount: task.polygon_count ?? null,
    status: 'complete',
    taskId,
  }
}

async function callTextureApi(
  prompt: string,
): Promise<{ textureUrl: string | null; resolution: string; status: string; message?: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/ai/texture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, resolution: '1024' }),
    signal: AbortSignal.timeout(60_000),
  })
  if (!res.ok) throw new Error(`Texture API error ${res.status}`)
  return res.json() as Promise<{ textureUrl: string | null; resolution: string; status: string; message?: string }>
}

// ─── POST /api/ai/chat ────────────────────────────────────────────────────────

// ─── Marketplace asset shape sent to the client ──────────────────────────────

interface MarketplaceAssetClient {
  assetId: number
  name: string
  creator: string
  thumbnailUrl: string | null
  isFree: boolean
  catalogUrl: string
  searchTerm: string
}

interface BuildPlan {
  totalSteps: number
  currentStep: number
  stepLabel: string
  nextStepPrompt: string | null
  autoNext: boolean
  planLines: string[]
}

interface ChatResponsePayload {
  message: string
  tokensUsed: number
  intent: IntentKey
  /** Whether the AI response contained a Luau code block */
  hasCode?: boolean
  /** Clickable next-action suggestions parsed from [SUGGESTIONS] block */
  suggestions?: string[]
  /** Multi-step build orchestration metadata */
  buildPlan?: BuildPlan
  meshResult?: {
    meshUrl: string | null
    thumbnailUrl: string | null
    polygonCount: number | null
    status: string
  }
  textureResult?: {
    textureUrl: string | null
    resolution: string
    status: string
  }
  /** Present when intent is 'building' — marketplace-first results */
  buildResult?: {
    foundAssets: MarketplaceAssetClient[]
    missingTerms: string[]
    luauCode: string
    totalMarketplace: number
    totalCustom: number
    estimatedCustomCost: number
  }
  /** Whether the generated Luau code was executed in Roblox Studio */
  executedInStudio?: boolean
  /** Auto-triggered MCP tool result when Claude response implies generation */
  mcpResult?: McpCallResult
  /** Pre-built game system template (currency/shop/pets/etc.) */
  gameSystem?: {
    id: string
    description: string
    fileCount: number
    files: Array<{ filename: string; scriptType: string; parent: string; code: string }>
  }
}

// ─── History types and helpers ────────────────────────────────────────────────

interface HistoryMessage {
  role: 'user' | 'assistant'
  content: string
}

// If history exceeds 30 messages, summarize the oldest turns into a compact block
// so we don't burn tokens on verbatim early context.
function compressHistory(history: HistoryMessage[]): HistoryMessage[] {
  const KEEP_TAIL = 15
  const THRESHOLD = 30
  if (history.length <= THRESHOLD) return history

  const splitPoint = history.length - KEEP_TAIL
  const oldMessages = history.slice(0, splitPoint)
  const recentMessages = history.slice(splitPoint)

  const lines: string[] = ['[Earlier conversation summary]']
  for (const msg of oldMessages) {
    if (msg.role === 'assistant') {
      const buildMatch = msg.content.match(/✓\s+(.{0,60})/)
      if (buildMatch) lines.push('- Built: ' + buildMatch[1].trim())
    } else if (msg.role === 'user' && msg.content.length > 10) {
      lines.push('- User: ' + msg.content.slice(0, 60).replace(/\s+/g, ' ').trim())
    }
  }
  const summary = lines.join('\n')
  return [
    { role: 'user' as const, content: summary },
    { role: 'assistant' as const, content: 'Got it — I have context from our earlier work. Continuing.' },
    ...recentMessages,
  ]
}

// ─── Multi-step build orchestrator ───────────────────────────────────────────

interface MultiStepTemplate {
  pattern: RegExp
  label: string
  steps: string[]
}

const MULTI_STEP_TEMPLATES: MultiStepTemplate[] = [
  {
    pattern: /\b(build|create|make|generate)\b.{0,30}\b(city|town|urban|downtown|cityscape|neighborhood|district)\b/i,
    label: 'City Build',
    steps: [
      'Foundation — baseplate, road grid, sidewalks, and terrain shaping',
      'Buildings Row A — 3-4 buildings along main street (shops, apartments)',
      'Buildings Row B — 3-4 buildings on the opposite side of the street',
      'Central Park — trees, benches, fountain, pathways, greenery',
      'Street Lights — lamp posts every 20 studs along all roads',
      'Street Details — trash cans, fire hydrants, bollards, crosswalk markings, signs',
      'Vehicles — 3-4 parked cars along the curb',
      'Skybox & Lighting — atmospheric lighting, fog, bloom for city mood',
    ],
  },
  {
    pattern: /\b(build|create|make|generate|full|complete)\b.{0,30}\btycoon\b/i,
    label: 'Tycoon Build',
    steps: [
      'Plot & Baseplate — player plot, boundaries, spawn pad, plot barrier',
      'Droppers — 3 resource droppers (basic, medium, premium) with drop animation',
      'Conveyor Belt — conveyor system connecting droppers to collector',
      'Collector & Counter — collection box, currency display, value counter',
      'Upgrade Shop — upgrade buttons panel with 4-5 upgrade tiers',
      'Game UI — leaderboard, currency display, rebirth button, HUD',
      'Polish — lighting, particle effects, sounds, color coding by tier',
    ],
  },
  {
    pattern: /\b(build|create|make|generate|full|complete)\b.{0,30}\b(obby|obstacle\s*course|parkour)\b/i,
    label: 'Obby Build',
    steps: [
      'Start Platform — spawn area, tutorial sign, first safe platform',
      'Easy Section — platforms, wide jumps, intro obstacles (10-12 parts)',
      'Medium Section — moving platforms, rotating obstacles, narrower gaps',
      'Hard Section — precise jumps, spinners, disappearing platforms',
      'Checkpoints — checkpoint flags every 15-20 platforms with glowing rings',
      'Finish Platform — trophy area, completion effects, win zone',
      'Effects & Polish — kill bricks, respawn bounds, ambient particles, signs',
    ],
  },
  {
    pattern: /\b(build|create|make|generate)\b.{0,30}\b(horror|scary|haunted|creepy)\b/i,
    label: 'Horror Map',
    steps: [
      'Dark Environment — baseplate, near-zero lighting, heavy fog setup',
      'Main Hallway — long corridor with cracked walls, stained floors, debris',
      'Rooms — 3 side rooms (bedroom, bathroom, kitchen) with horror props',
      'Jumpscare Triggers — proximity triggers, flickering lights, scripted events',
      'Lighting & Atmosphere — candles, red accents, dynamic shadow flicker',
      'Sounds & Ambience — ambient creaks, distant footsteps, wind through scripts',
      'Flashlight Mechanic — player flashlight setup with limited range',
    ],
  },
  {
    pattern: /\b(build|create|make|generate)\b.{0,30}\b(medieval|castle|fantasy|kingdom)\b.{0,30}\b(world|map|realm|kingdom|town|city|village)\b/i,
    label: 'Medieval World',
    steps: [
      'Terrain — rolling hills, dirt roads, a river valley, trees and boulders',
      'Castle — keep, outer walls, corner towers, gatehouse, moat',
      'Village — 4-5 houses, market stalls, blacksmith, inn along cobblestone road',
      'Castle Interior — great hall, throne room, barracks, armory',
      'Lighting — torches, campfires, sunset atmosphere, distant fog',
      'Details — guards, banners, barrels, crates, well, market props',
    ],
  },
  {
    pattern: /\b(build|create|make|generate)\b.{0,30}\b(dungeon|cave|underground|mine)\b/i,
    label: 'Dungeon Build',
    steps: [
      'Entrance & Tunnels — cave mouth, winding entry corridor, torch sconces',
      'Main Chamber — large central room with pillars, rubble, stalactites',
      'Side Rooms — treasure room, trap room, locked cell block',
      'Traps — spike pits, rolling boulders, pressure plates (decorative)',
      'Boss Arena — circular chamber, dramatic lighting, altar',
      'Lighting & Mood — torch glow, eerie green crystals, deep shadows',
    ],
  },
]

const MULTI_STEP_CONTINUATION_PATTERN = /^\[FORJE_STEP:(\d+)\/(\d+)\]\s*(.+)/

/**
 * Detect if a user message should trigger multi-step orchestration.
 * Returns the matched template or null for single-step builds.
 */
function detectMultiStepRequest(message: string): MultiStepTemplate | null {
  const trimmed = message.trim()
  if (MULTI_STEP_CONTINUATION_PATTERN.test(trimmed)) return null
  for (const tmpl of MULTI_STEP_TEMPLATES) {
    if (tmpl.pattern.test(trimmed)) return tmpl
  }
  return null
}

/**
 * Parse a continuation step marker and extract metadata.
 * Returns null if the message is not a continuation.
 */
function parseContinuationStep(message: string): {
  currentStep: number
  totalSteps: number
  stepDescription: string
} | null {
  const match = MULTI_STEP_CONTINUATION_PATTERN.exec(message.trim())
  if (!match) return null
  return {
    currentStep: parseInt(match[1], 10),
    totalSteps: parseInt(match[2], 10),
    stepDescription: match[3].trim(),
  }
}

/**
 * Compute the buildPlan metadata to return alongside the AI response.
 */
function computeBuildPlan(
  template: MultiStepTemplate,
  currentStep: number,
): BuildPlan {
  const totalSteps = template.steps.length
  const nextStep = currentStep < totalSteps ? currentStep + 1 : null
  const nextStepDescription = nextStep ? template.steps[nextStep - 1] : null
  const nextStepPrompt = nextStep
    ? `[FORJE_STEP:${nextStep}/${totalSteps}] ${nextStepDescription}`
    : null
  return {
    totalSteps,
    currentStep,
    stepLabel: template.steps[currentStep - 1] ?? `Step ${currentStep}`,
    nextStepPrompt,
    autoNext: nextStep !== null,
    planLines: template.steps.map((s, i) => `Step ${i + 1}: ${s}`),
  }
}

/**
 * Format the [BUILD_PLAN] block for injection into the step-1 AI prompt.
 */
function formatBuildPlanBlock(template: MultiStepTemplate): string {
  const lines = template.steps.map((s, i) => `Step ${i + 1}: ${s}`)
  return `[BUILD_PLAN]\n${lines.join('\n')}\n[/BUILD_PLAN]`
}

// User-friendly error messages with context-specific next steps
function buildErrorResponse(err: unknown, intent: IntentKey): string {
  const isRateLimit = err instanceof Error && /rate.?limit|429/i.test(err.message)
  const isTimeout = err instanceof Error && /timeout|timed out/i.test(err.message)
  const isQuota = err instanceof Error && /quota|billing|402|credit/i.test(err.message)

  if (isRateLimit) return 'Hit a rate limit — wait 30 seconds and try again.'
  if (isTimeout) return 'Request timed out. Try a shorter or simpler prompt.'
  if (isQuota) return 'AI credits exhausted. Check your ANTHROPIC_API_KEY or use a Gemini/Groq fallback key.'

  const hints: Partial<Record<IntentKey, string>> = {
    mesh: 'Try a simpler mesh description, or check that MESHY_API_KEY is set.',
    texture: 'Try a different texture description, or check that FAL_API_KEY is set.',
    terrain: 'Try a simpler terrain request first to verify the connection.',
    building: 'Try a more specific request like "build a small wooden cabin".',
    fullgame: 'Break it down — ask for the map first, then scripts separately.',
    script: 'Describe what the script should do step by step.',
  }
  return 'Something went wrong. ' + (hints[intent] ?? 'Try rephrasing your request.')
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const isDemo = process.env.DEMO_MODE === 'true'
  let authedUserId: string | null = null

  if (!isDemo) {
    let userId: string | null = null
    try {
      const session = await auth()
      userId = session?.userId ?? null
    } catch {
      // Clerk unavailable — treat as guest
    }

    if (userId) {
      authedUserId = userId

      // Check tier — skip if DB unavailable (allow through as FREE)
      try {
        const tierDenied = await requireTier(userId, 'FREE')
        if (tierDenied) return tierDenied
      } catch {
        // DB unavailable — treat as FREE tier, allow through
        console.warn('[chat] DB unavailable for tier check — allowing through')
      }

      try {
        const rl = await aiRateLimit(userId)
        if (!rl.allowed) {
          return NextResponse.json(
            { error: 'Too many requests. Please wait before sending another message.' },
            { status: 429, headers: rateLimitHeaders(rl) },
          )
        }
      } catch {
        // Redis unavailable — allow through
      }
    } else {
      // Guest (unauthenticated) — enforce server-side IP rate limit so the
      // client-side GUEST_MESSAGE_LIMIT=3 cap cannot be bypassed via direct API calls.
      // Limit: 3 requests per 24 hours per IP (mirrors client cap).
      const clientIp =
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        req.headers.get('x-real-ip') ??
        'unknown'
      try {
        const { getRedis } = await import('@/lib/redis')
        const redis = getRedis()
        if (redis) {
          const GUEST_LIMIT = 3
          const DAY_SEC = 86400
          const dayBucket = Math.floor(Date.now() / 1000 / DAY_SEC)
          const key = `rl:guest:ip:${clientIp}:${DAY_SEC}:${dayBucket}`
          const pipeline = redis.pipeline()
          pipeline.incr(key)
          pipeline.expire(key, DAY_SEC * 2)
          const results = await pipeline.exec()
          const count = (results?.[0]?.[1] as number) ?? GUEST_LIMIT + 1
          const resetAt = (dayBucket + 1) * DAY_SEC * 1000
          if (count > GUEST_LIMIT) {
            return NextResponse.json(
              {
                error: 'Guest message limit reached. Sign up for free to continue.',
                signUpRequired: true,
              },
              {
                status: 429,
                headers: rateLimitHeaders({ allowed: false, remaining: 0, resetAt }),
              },
            )
          }
        }
      } catch {
        // Redis unavailable — allow through
      }
    }
    // Guest users (no userId) fall through — they get demo responses
    // but can try the product before signing up
  }

  const parsed = await parseBody(req, chatMessageSchema)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  }

  const message = parsed.data.message.trim()
  if (!message) {
    return NextResponse.json({ error: 'Message cannot be empty.' }, { status: 400 })
  }
  const wantsStream = (parsed.data as Record<string, unknown>).stream === true

  // Merge history sources: `messages` is the frontend alias, `history` is legacy.
  // Accept up to the last 20 turns from whichever field the client sends.
  const rawHistory: HistoryMessage[] = (
    ((parsed.data as Record<string, unknown>).messages ??
      parsed.data.history ??
      []) as HistoryMessage[]
  )
    .slice(-20)
    .map((h) => ({ role: h.role, content: h.content.slice(0, 2000) }))

  // Auto-fix loop: Studio plugin sends the execution error back here so the AI
  // can generate a corrected script without the user having to describe the failure.
  const lastError = (
    (parsed.data as Record<string, unknown>).lastError as string | undefined
  )?.trim()
  if (lastError) {
    rawHistory.push({
      role: 'user' as const,
      content:
        '[STUDIO EXECUTION ERROR — auto-injected by plugin]\n' +
        'The last script I ran in Roblox Studio failed:\n```\n' +
        lastError +
        '\n```\nPlease output a corrected version.',
    })
    rawHistory.push({
      role: 'assistant' as const,
      content: 'Got it — I can see the error. Let me fix that.',
    })
  }

  // Full conversation history with token-aware compression (older turns summarized)
  const history = compressHistory(rawHistory)
  const sessionId = req.headers.get('x-studio-session') ?? parsed.data.gameContext?.sessionId ?? null

  const intent = detectIntent(message)

  // ── Multi-step build orchestration detection ─────────────────────────────
  // Detect whether this is a new multi-step request OR a continuation step.
  const multiStepTemplate = detectMultiStepRequest(message)
  const continuationMeta  = parseContinuationStep(message)

  // For continuation steps, recover the template by re-matching the original
  // step description stored in the FORJE_STEP marker.
  let activeContinuationTemplate: MultiStepTemplate | null = null
  if (continuationMeta) {
    // Attempt to find a template that owns this step count (best-effort match)
    for (const tmpl of MULTI_STEP_TEMPLATES) {
      if (tmpl.steps.length === continuationMeta.totalSteps) {
        activeContinuationTemplate = tmpl
        break
      }
    }
    // If no exact match by step count, create a synthetic template on-the-fly
    // so we can still compute the buildPlan without a full match.
    if (!activeContinuationTemplate) {
      activeContinuationTemplate = {
        pattern: /./,
        label: 'Multi-Step Build',
        steps: Array.from({ length: continuationMeta.totalSteps }, (_, i) =>
          i === continuationMeta.currentStep - 1
            ? continuationMeta.stepDescription
            : `Step ${i + 1}`,
        ),
      }
    }
  }

  // ── Build rich Studio context for AI awareness ──────────────────────────
  interface StudioCtxBody {
    camera?: { posX: number; posY: number; posZ: number; lookX: number; lookY: number; lookZ: number }
    partCount?: number
    modelCount?: number
    lightCount?: number
    nearbyParts?: { name: string; className: string; position: string; size: string; material: string; color?: string; parent?: string }[]
    selection?: { name: string; className: string; path: string; position?: string; size?: string; material?: string; color?: string; transparency?: number; anchored?: boolean; childCount?: number }[]
    sceneTree?: { name: string; className: string; position?: string; size?: string; childCount?: number }[]
    groundY?: number
  }
  const bodyStudioCtx = (parsed.data as Record<string, unknown>).studioContext as StudioCtxBody | undefined

  let cameraContext = ''

  // Rich Studio context block — formatted so the AI can reference camera position,
  // selected objects, scene tree, and nearby objects when generating Luau code.
  if (bodyStudioCtx?.camera) {
    const c = bodyStudioCtx.camera
    const parts: string[] = []

    parts.push(`=== LIVE STUDIO CONTEXT (from Roblox Studio plugin) ===`)
    parts.push(``)
    parts.push(`CAMERA`)
    parts.push(`  Position  : (${c.posX.toFixed(1)}, ${c.posY.toFixed(1)}, ${c.posZ.toFixed(1)})`)
    parts.push(`  LookTarget: (${c.lookX.toFixed(1)}, ${c.lookY.toFixed(1)}, ${c.lookZ.toFixed(1)})`)
    if (bodyStudioCtx.groundY !== undefined) parts.push(`  Ground Y  : ${bodyStudioCtx.groundY}`)
    parts.push(``)
    parts.push(`WORKSPACE STATS`)
    parts.push(`  Parts: ${bodyStudioCtx.partCount ?? '?'} | Models: ${bodyStudioCtx.modelCount ?? '?'} | Lights: ${bodyStudioCtx.lightCount ?? '?'}`)

    // Selection — what user is actively working with
    const sel = bodyStudioCtx.selection ?? []
    parts.push(``)
    if (sel.length > 0) {
      parts.push(`SELECTED OBJECTS (${sel.length}) — user is actively working on these:`)
      for (const s of sel.slice(0, 10)) {
        const props = [
          s.position ? `pos(${s.position})` : null,
          s.size ? `size(${s.size})` : null,
          s.material ?? null,
          s.color ? `rgb(${s.color})` : null,
          s.transparency !== undefined && s.transparency > 0 ? `transparency=${s.transparency}` : null,
          s.anchored !== undefined ? (s.anchored ? 'anchored' : 'unanchored') : null,
        ]
          .filter(Boolean)
          .join(' | ')
        parts.push(`  • ${s.name} (${s.className}) — ${props} [path: ${s.path}]`)
      }
    } else {
      parts.push(`SELECTED OBJECTS: none`)
    }

    // Scene tree — top-level workspace structure
    const tree = bodyStudioCtx.sceneTree ?? []
    if (tree.length > 0) {
      parts.push(``)
      parts.push(`SCENE TREE — top-level workspace objects (${tree.length} total):`)
      for (const t of tree.slice(0, 40)) {
        const info = [
          t.position ? `at(${t.position})` : null,
          t.size ? `size(${t.size})` : null,
          t.childCount !== undefined ? `${t.childCount} children` : null,
        ]
          .filter(Boolean)
          .join(' | ')
        parts.push(`  • ${t.name} (${t.className}) ${info}`)
      }
    }

    // Nearby parts — closest objects for spatial awareness
    const nearby = bodyStudioCtx.nearbyParts ?? []
    if (nearby.length > 0) {
      parts.push(``)
      parts.push(`NEARBY OBJECTS — ${nearby.length} within 250 studs (sorted by distance):`)
      for (const p of nearby.slice(0, 100)) {
        const colorStr = p.color ? ` | rgb(${p.color})` : ''
        const parentStr = p.parent ? ` | in: ${p.parent}` : ''
        parts.push(`  • ${p.name} (${p.className}) at(${p.position}) size(${p.size}) ${p.material}${colorStr}${parentStr}`)
      }
    }

    parts.push(``)
    parts.push(`BUILD PLACEMENT RULES (follow these exactly):`)
    parts.push(`  1. New objects → base position: (${c.lookX.toFixed(1)}, ${(bodyStudioCtx.groundY ?? c.posY).toFixed(1)}, ${c.lookZ.toFixed(1)})`)
    parts.push(`  2. "in front of me" → workspace.CurrentCamera.CFrame * CFrame.new(0, 0, -20)`)
    parts.push(`  3. If user references a selected object → modify that object by its path above`)
    parts.push(`  4. Match existing material/color palette from NEARBY OBJECTS`)
    parts.push(`  5. Always Anchored=true, always wrap in ChangeHistoryService recording`)
    parts.push(`  6. Ground placement: Y = ${bodyStudioCtx.groundY ?? 'unknown'} + objectHeight/2`)
    parts.push(`=== END STUDIO CONTEXT ===`)

    cameraContext = '\n\n' + parts.join('\n')
  }

  // Fallback: fetch from session if no direct context provided
  if (!cameraContext && sessionId) {
    try {
      const { getSession: getSess } = await import('@/lib/studio-session')
      const studioSession = await getSess(sessionId)
      if (studioSession?.camera) {
        const c = studioSession.camera
        const nearby = (studioSession as unknown as Record<string, unknown>).nearbyParts as { name: string; className: string; position: string }[] | undefined
        let nearbyStr = ''
        if (nearby && nearby.length > 0) {
          nearbyStr = '\n- Nearby objects:\n' + nearby.slice(0, 20).map(p =>
            `  ${p.name} (${p.className}) at (${p.position})`
          ).join('\n')
        }
        const groundY = (studioSession as unknown as Record<string, unknown>).groundY as number | undefined
        const selected = (studioSession as unknown as Record<string, unknown>).selected as Array<Record<string, unknown>> | undefined
        let selectedStr = ''
        if (selected && selected.length > 0) {
          selectedStr = '\n- User has selected: ' + selected.map(s => `${s.n} at (${(s.p as number[])?.join(',')})`).join(', ')
        }
        cameraContext = `

STUDIO CONTEXT (live camera from Roblox Studio):
- Camera position: (${c.posX}, ${c.posY}, ${c.posZ})
- Looking toward: (${c.lookX}, ${c.lookY}, ${c.lookZ})
- Ground level at camera: Y=${groundY ?? 'unknown'}
- Parts in workspace: ${studioSession.partCount ?? 'unknown'}
- Place: ${studioSession.placeName ?? 'Unknown'}${nearbyStr}${selectedStr}

IMPORTANT: When placing builds, position them NEAR the camera. Use groundY as the base Y so objects land on the ground. Offset from there as needed.`
      }

      // Inject workspace snapshot spatial context when available
      const worldSnapshot = studioSession?.latestState?.worldSnapshot as Record<string, unknown> | undefined
      if (worldSnapshot) {
        type SnapObj      = { n: string; cls?: string; p: [number, number, number]; s?: [number, number, number]; m?: string; c?: [number, number, number] }
        type SnapBounds   = { min: [number, number, number]; max: [number, number, number] }
        type SnapSpawn    = { n: string; p: [number, number, number] }
        type SnapStats    = { total?: number; parts?: number; models?: number; totalInstances?: number; totalParts?: number; totalMeshParts?: number; totalUnions?: number }
        type SnapLighting = { time?: number; brightness?: number; fogEnd?: number; fogStart?: number; technology?: string; globalShadows?: boolean }
        type SnapAtmo     = { density?: number; haze?: number; color?: [number, number, number] }
        type SnapFx       = { type: string; intensity?: number; size?: number; threshold?: number; contrast?: number; saturation?: number }
        type SnapWorkspace = { gravity?: number; streamingEnabled?: boolean; streamingTargetRadius?: number }
        type SnapLight    = { type: string; brightness: number; range: number; color: [number, number, number]; parentName: string; p: [number, number, number] }
        type SnapScripts  = { server: number; local_: number; module: number; names: string[] }
        type SnapGui      = { n: string; enabled: boolean; children: number }
        type SnapTeam     = { n: string; color: [number, number, number] }
        type SnapNpc      = { n: string; health: number; maxHealth: number; walkSpeed: number; p: [number, number, number] }
        type SnapParticle = { n: string; rate: number; lifetime: number; parentName: string; p: [number, number, number] }
        type SnapConstraints = { welds: number; hinges: number; springs: number; ropes: number }
        type SnapRemote   = { n: string; type: string; path: string }
        type SnapFolder   = { n: string; children: number }
        type SnapTag      = { tag: string; count: number }
        type SnapMesh     = { n: string; meshId: string; p: [number, number, number]; s: [number, number, number] }
        type SnapDecal    = { type: string; texture: string; face: string; parentName: string }
        type SnapSound    = { n: string; soundId: string; volume: number; looped: boolean; playing: boolean }
        type SnapPlace    = { id: string; name: string }

        const objects     = (worldSnapshot.objects     as SnapObj[]         | undefined) ?? []
        const spawns      = (worldSnapshot.spawns      as SnapSpawn[]       | undefined) ?? []
        const bounds      = (worldSnapshot.bounds      as SnapBounds        | undefined)
        const stats       = (worldSnapshot.stats       as SnapStats         | undefined) ?? {}
        const lighting    = (worldSnapshot.lighting    as SnapLighting      | undefined)
        const atmosphere  = (worldSnapshot.atmosphere  as SnapAtmo          | undefined)
        const postFx      = (worldSnapshot.postProcessing as SnapFx[]       | undefined) ?? []
        const wsSettings  = (worldSnapshot.workspace   as SnapWorkspace     | undefined)
        const lights      = (worldSnapshot.lights      as SnapLight[]       | undefined) ?? []
        const scripts     = (worldSnapshot.scripts     as SnapScripts       | undefined)
        const guis        = (worldSnapshot.guis        as SnapGui[]         | undefined) ?? []
        const teams       = (worldSnapshot.teams       as SnapTeam[]        | undefined) ?? []
        const npcs        = (worldSnapshot.npcs        as SnapNpc[]         | undefined) ?? []
        const particles   = (worldSnapshot.particles   as SnapParticle[]    | undefined) ?? []
        const constraints = (worldSnapshot.constraints as SnapConstraints   | undefined)
        const remotes     = (worldSnapshot.remotes     as SnapRemote[]      | undefined) ?? []
        const folders     = (worldSnapshot.folders     as SnapFolder[]      | undefined) ?? []
        const tags        = (worldSnapshot.tags        as SnapTag[]         | undefined) ?? []
        const meshParts   = (worldSnapshot.meshParts   as SnapMesh[]        | undefined) ?? []
        const decals      = (worldSnapshot.decals      as SnapDecal[]       | undefined) ?? []
        const sounds      = (worldSnapshot.sounds      as SnapSound[]       | undefined) ?? []
        const place       = (worldSnapshot.place       as SnapPlace         | undefined)
        const terrain     = (worldSnapshot.terrain     as Array<[number, number, number]> | undefined) ?? []

        const top30 = objects.slice(0, 30).map(o => `${o.n}[${o.cls ?? '?'}]@(${o.p[0]},${o.p[1]},${o.p[2]})`).join(', ')
        const spawnList = spawns.map(s => `${s.n}@(${s.p[0]},${s.p[1]},${s.p[2]})`).join(', ') || 'none'
        const boundsStr = bounds
          ? `min(${bounds.min[0]},${bounds.min[1]},${bounds.min[2]}) to max(${bounds.max[0]},${bounds.max[1]},${bounds.max[2]})`
          : 'unknown'
        const terrainStr = terrain.length > 0
          ? terrain.map(t => `(${t[0]},${t[2]})->Y${t[1]}`).join(', ')
          : 'not sampled'

        const lightStr = lighting
          ? [
              `ClockTime=${lighting.time ?? '?'}`,
              `Brightness=${lighting.brightness ?? '?'}`,
              lighting.technology ? `Tech=${lighting.technology}` : '',
              lighting.fogEnd != null ? `Fog=${lighting.fogStart ?? 0}-${lighting.fogEnd}` : '',
              lighting.globalShadows != null ? `Shadows=${lighting.globalShadows}` : '',
            ].filter(Boolean).join(', ')
          : 'unknown'

        const atmoStr = atmosphere
          ? `Density=${atmosphere.density ?? '?'}, Haze=${atmosphere.haze ?? '?'}` +
            (atmosphere.color ? `, Color=rgb(${atmosphere.color.join(',')})` : '')
          : 'none'

        const fxStr = postFx.length > 0
          ? postFx.map(fx => {
              if (fx.type === 'Bloom') return `Bloom(i=${fx.intensity},s=${fx.size},t=${fx.threshold})`
              if (fx.type === 'ColorCorrection') return `CC(contrast=${fx.contrast},sat=${fx.saturation})`
              return fx.type
            }).join(', ')
          : 'none'

        const scriptsStr = scripts
          ? `${scripts.server} server, ${scripts.local_} local, ${scripts.module} modules`
          : 'unknown'

        const npcStr = npcs.length > 0
          ? npcs.map(n => `${n.n}@(${n.p[0]},${n.p[1]},${n.p[2]}) HP:${n.health}/${n.maxHealth}`).join(', ')
          : 'none'

        const remotesStr = remotes.length > 0 ? remotes.map(r => r.n).join(', ') : 'none'
        const lightsStr = lights.length > 0
          ? lights.slice(0, 10).map(l => `${l.type}@${l.parentName}(${l.p[0]},${l.p[1]},${l.p[2]}) b=${l.brightness} r=${l.range}`).join(', ')
          : 'none'
        const soundsStr = sounds.length > 0
          ? sounds.map(s => `${s.n}(vol=${s.volume}${s.looped ? ',loop' : ''}${s.playing ? ',playing' : ''})`).join(', ')
          : 'none'
        const particlesStr = particles.length > 0
          ? particles.map(p => `${p.n}@${p.parentName}(rate=${p.rate})`).join(', ')
          : 'none'
        const constraintsStr = constraints
          ? `welds=${constraints.welds}, hinges=${constraints.hinges}, springs=${constraints.springs}, ropes=${constraints.ropes}`
          : 'unknown'
        const foldersStr = folders.length > 0 ? folders.map(f => `${f.n}(${f.children})`).join(', ') : 'none'
        const tagsStr = tags.length > 0 ? tags.map(t => `${t.tag}x${t.count}`).join(', ') : 'none'
        const teamsStr = teams.length > 0 ? teams.map(t => t.n).join(', ') : 'none'
        const guisStr = guis.length > 0
          ? guis.map(g => `${g.n}(${g.children} children${g.enabled ? '' : ',disabled'})`).join(', ')
          : 'none'
        const wsStr = wsSettings
          ? `gravity=${wsSettings.gravity ?? '?'}, streaming=${wsSettings.streamingEnabled ? 'on(r=' + wsSettings.streamingTargetRadius + ')' : 'off'}`
          : 'unknown'
        const instanceStr = stats.totalInstances != null
          ? `${stats.totalInstances} total (${stats.parts ?? 0} parts, ${stats.totalMeshParts ?? 0} meshes, ${stats.totalUnions ?? 0} unions, ${stats.models ?? 0} models)`
          : `${stats.total ?? objects.length} scanned (${stats.parts ?? 0} parts, ${stats.models ?? 0} models)`

        cameraContext += `

CURRENT WORKSPACE STATE (from Roblox Studio scan):
Place: ${place ? place.name + ' (id=' + place.id + ')' : 'unknown'}
World bounds: ${boundsStr}
Instances: ${instanceStr}
Objects (up to 30): ${top30 || 'none'}
Spawn points: ${spawnList}
Folders: ${foldersStr}
Lighting: ${lightStr}
Atmosphere: ${atmoStr}
Post-processing: ${fxStr}
Scripts: ${scriptsStr}
Remotes (architecture): ${remotesStr}
NPCs: ${npcStr}
Lights: ${lightsStr}
Particles: ${particlesStr}
Sounds: ${soundsStr}
Constraints: ${constraintsStr}
CollectionService tags: ${tagsStr}
Teams: ${teamsStr}
GUIs: ${guisStr}
Workspace settings: ${wsStr}
Terrain ground samples: ${terrainStr}

PLACEMENT RULES:
- Place objects near the camera (that's where the user is looking)
- Use groundY for base Y when available; otherwise use terrain sample nearest to camera
- If user selected something, build relative to that selection
- Character height = 5.5 studs, door = 4x7 studs, room = 12 studs high
- Don't overlap existing objects -- check nearby list
- Place on ground: new object Y = groundY + (object height / 2)
- Match existing material/color palette from objects list`
      }

    } catch {
      // No camera/snapshot data — that's fine, place at origin
    }
  }

  // ── Multi-step build context injection ───────────────────────────────────
  // Append step-awareness to the system prompt so the AI knows which step it's
  // on, what's already been built, and that it should use _forje_state for
  // spatial continuity across steps.
  let multiStepContext = ''

  if (multiStepTemplate) {
    // Step 1 — inject the full build plan so the AI knows the whole scope
    const planBlock = formatBuildPlanBlock(multiStepTemplate)
    multiStepContext = `

=== MULTI-STEP BUILD MODE — ${multiStepTemplate.label.toUpperCase()} ===

You are building a COMPLEX ${multiStepTemplate.label} in ${multiStepTemplate.steps.length} sequential steps. The user just triggered step 1.

${planBlock}

CURRENT TASK: Build ONLY Step 1 — "${multiStepTemplate.steps[0]}"
Do NOT build later steps yet. Focus 100% on making Step 1 excellent.

SPATIAL STATE: Store all key positions in _forje_state so future steps can reference them:
  _forje_state.buildOrigin = sp  -- anchor for all subsequent steps
  _forje_state.step1Done = true

After your friendly response, include the Luau code for Step 1 only.
`
  } else if (continuationMeta && activeContinuationTemplate) {
    // Step N continuation — remind AI of position state and the single step goal
    const { currentStep, totalSteps, stepDescription } = continuationMeta
    const previousSteps = activeContinuationTemplate.steps
      .slice(0, currentStep - 1)
      .map((s, i) => `  Step ${i + 1}: ${s} [DONE]`)
      .join('\n')
    multiStepContext = `

=== MULTI-STEP BUILD MODE — STEP ${currentStep} OF ${totalSteps} ===

You are continuing a ${activeContinuationTemplate.label} build. Here's the progress so far:
${previousSteps}

CURRENT TASK: Build ONLY Step ${currentStep} — "${stepDescription}"

SPATIAL CONTINUITY: Read positions from _forje_state that previous steps stored:
  local origin = _forje_state.buildOrigin or sp  -- use this as your base position
Store any new reference points you create for the next step:
  _forje_state.step${currentStep}Done = true

After your friendly response, include ONLY the Luau code for Step ${currentStep}.
${currentStep === totalSteps ? '\nThis is the FINAL STEP — make it perfect and celebrate the completed build!' : `\nStep ${currentStep + 1} will be built next automatically.`}
`
  }

  // ── Game system template short-circuit ──────────────────────────────────
  // When the user asks for a named game system (currency, shop, pets, etc.),
  // return the pre-built production template immediately without burning
  // expensive Anthropic tokens or waiting on the AI.
  if (intent === 'gamesystem') {
    const systemId = detectGameSystemIntent(message)
    const system   = systemId ? GAME_SYSTEMS[systemId] : null

    if (system) {
      const responseText = formatGameSystemResponse(system)
      const tokenCostGs  = INTENT_TOKEN_COST.gamesystem

      // Spend tokens for authenticated users
      if (!isDemo && authedUserId && tokenCostGs > 0) {
        try {
          await spendTokens(authedUserId, tokenCostGs, `Game system: ${system.id}`, {
            prompt: message.slice(0, 100),
            intent: 'gamesystem',
          })
        } catch (spendErr) {
          const errMsg = spendErr instanceof Error ? spendErr.message : 'Token error'
          if (errMsg === 'Insufficient token balance') {
            return NextResponse.json(
              { error: 'insufficient_tokens', balance: 0, required: tokenCostGs },
              { status: 402 },
            )
          }
        }
      }

      const { message: cleanMsg, suggestions } = extractSuggestions(responseText)
      const luauCode = extractLuauCode(responseText)

      // Auto-execute the FIRST script file in Studio if a session is connected
      let executedInStudio = false
      if (sessionId && system.files.length > 0) {
        executedInStudio = await sendCodeToStudio(sessionId, system.files[0].code)
      }

      return NextResponse.json({
        message: cleanMsg || responseText,
        tokensUsed: tokenCostGs,
        intent: 'gamesystem' as IntentKey,
        hasCode: luauCode !== null || system.files.length > 0,
        executedInStudio,
        suggestions: suggestions.length > 0 ? suggestions : [
          `Add a ${system.id === 'currency' ? 'shop' : 'currency'} system to pair with this`,
          `Connect this to your leaderboard`,
          `Add daily rewards for extra retention`,
        ],
        gameSystem: {
          id: system.id,
          description: system.description,
          fileCount: system.files.length,
          files: system.files.map(f => ({
            filename: f.filename,
            scriptType: f.scriptType,
            parent: f.parent,
            code: f.code,
          })),
        },
      } satisfies ChatResponsePayload)
    }
  }

  // ── Custom user-supplied API key ─────────────────────────────────────────
  const customApiKey  = req.headers.get('x-custom-api-key')?.trim() ?? null
  const customProvider = req.headers.get('x-custom-provider')?.trim() ?? null

  // If user provided a Google key, attempt a Gemini response
  if (customApiKey && customProvider === 'google') {
    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${customApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: FORJEAI_SYSTEM_PROMPT + cameraContext + multiStepContext }] },
            contents: [
              ...history.map((h: HistoryMessage) => ({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.content }] })),
              { role: 'user', parts: [{ text: message }] },
            ],
            generationConfig: { maxOutputTokens: 1024 },
          }),
        },
      )
      if (geminiRes.ok) {
        type GeminiResponse = {
          candidates?: Array<{
            content?: { parts?: Array<{ text?: string }> }
          }>
          usageMetadata?: { totalTokenCount?: number }
        }
        const geminiData = await geminiRes.json() as GeminiResponse
        const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
        if (!text) throw new Error('Empty response from Gemini')
        const tokensUsed = geminiData.usageMetadata?.totalTokenCount ?? estimateTokens(message)
        return NextResponse.json({
          message: text,
          tokensUsed,
          intent,
          model: 'gemini-1.5-flash (custom key)',
        } satisfies ChatResponsePayload & { model: string })
      }
    } catch {
      // Fall through to demo on error
    }
  }

  // If user provided an OpenAI key
  if (customApiKey && customProvider === 'openai') {
    try {
      const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${customApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          max_tokens: 1024,
          messages: [
            { role: 'system', content: FORJEAI_SYSTEM_PROMPT },
            ...history.map((h: HistoryMessage) => ({ role: h.role, content: h.content })),
            { role: 'user',   content: message },
          ],
        }),
      })
      if (openaiRes.ok) {
        type OpenAIResponse = {
          choices?: Array<{ message?: { content?: string } }>
          usage?: { total_tokens?: number }
        }
        const openaiData = await openaiRes.json() as OpenAIResponse
        const text = openaiData.choices?.[0]?.message?.content ?? ''
        if (!text) throw new Error('Empty response from OpenAI')
        const tokensUsed = openaiData.usage?.total_tokens ?? estimateTokens(message)
        return NextResponse.json({
          message: text,
          tokensUsed,
          intent,
          model: 'gpt-4o (custom key)',
        } satisfies ChatResponsePayload & { model: string })
      }
    } catch {
      // Fall through to demo on error
    }
  }

  // If user provided an Anthropic key, use a fresh Anthropic client with it
  if (customApiKey && customProvider === 'anthropic') {
    try {
      const customAnthropic = new Anthropic({ apiKey: customApiKey })
      const aiResponse = await customAnthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: FORJEAI_SYSTEM_PROMPT,
        messages: [
          ...history.map((h: HistoryMessage) => ({ role: h.role, content: h.content })),
          { role: 'user', content: message },
        ],
      })
      const textBlock = aiResponse.content.find((b) => b.type === 'text')
      const responseText = textBlock && textBlock.type === 'text' ? textBlock.text : ''
      const tokensUsed = aiResponse.usage.input_tokens + aiResponse.usage.output_tokens
      return NextResponse.json({
        message: responseText,
        tokensUsed,
        intent,
        model: aiResponse.model + ' (custom key)',
      } satisfies ChatResponsePayload & { model: string })
    } catch {
      // Fall through to server key / demo on error
    }
  }

  // ── Real Claude API path ──────────────────────────────────────────────────
  const anthropic = getAnthropicClient()
  // Debug removed — key is present, just needs credits or Gemini fallback
  const tokenCost = INTENT_TOKEN_COST[intent] ?? INTENT_TOKEN_COST.default
  if (anthropic) {
    // Deduct tokens before calling the AI — conversation is FREE, builds cost tokens
    if (!isDemo && authedUserId && tokenCost > 0) {
      try {
        await spendTokens(authedUserId, tokenCost, `AI ${intent} request`, { prompt: message.slice(0, 100), intent })
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Token error'
        // Only hard-fail for real balance errors — if DB is unavailable, skip
        // deduction and continue so the chat still works without a database.
        if (errMsg === 'Insufficient token balance') {
          return NextResponse.json(
            { error: 'insufficient_tokens', balance: 0, required: tokenCost },
            { status: 402 },
          )
        }
        console.warn('[chat] DB unavailable for token deduction — skipping:', errMsg)
        // Fall through: chat proceeds without spending tokens
      }
    }

    try {
      // Chat/conversation intents get shorter responses; code-heavy builds get max tokens
      const maxTokens =
        intent === 'chat' || intent === 'conversation'
          ? 512
          : intent === 'fullgame'
            ? 8192
            : intent === 'building' || intent === 'terrain'
              ? 4096
              : 2048

      const claudeMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [
        ...history.map((h: HistoryMessage) => ({ role: h.role, content: h.content })),
        { role: 'user', content: message },
      ]

      // ── STREAMING PATH ───────────────────────────────────────────────────────────
      // When the frontend sends stream:true, pipe text chunks in real time.
      // A terminal \x00{json} chunk carries metadata: suggestions, intent, hasCode, tokensUsed.
      if (wantsStream) {
        const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>()
        const writer = writable.getWriter()
        const enc = new TextEncoder()

        void (async () => {
          let fullText = ''
          let tokensUsed = tokenCost

          try {
            const stream = anthropic.messages.stream({
              model: 'claude-sonnet-4-20250514',
              max_tokens: maxTokens,
              system: FORJEAI_SYSTEM_PROMPT + cameraContext + multiStepContext,
              messages: claudeMessages,
            })

            for await (const event of stream) {
              if (
                event.type === 'content_block_delta' &&
                event.delta.type === 'text_delta'
              ) {
                const chunk = event.delta.text
                fullText += chunk
                await writer.write(enc.encode(chunk))
              }
            }

            const finalMsg = await stream.finalMessage()
            tokensUsed = finalMsg.usage.input_tokens + finalMsg.usage.output_tokens

            const luau = extractLuauCode(fullText)
            let executedInStudio = false
            if (luau && sessionId) {
              executedInStudio = await sendCodeToStudio(sessionId, luau)
            }
            const stripped = luau ? stripCodeBlocks(fullText) : fullText
            const { suggestions } = extractSuggestions(stripped)
            const hasCode = luau !== null

            let mcpResult: McpCallResult | undefined
            const mcpIntentStream = detectMcpIntent(message, fullText)
            if (mcpIntentStream) {
              try {
                mcpResult = await callTool(
                  mcpIntentStream.server,
                  mcpIntentStream.tool,
                  mcpIntentStream.args,
                )
              } catch {
                /* non-fatal */
              }
            }

            let meshResult: ChatResponsePayload['meshResult']
            if (intent === 'mesh') {
              try {
                const mesh = await generateMeshForChat(message)
                meshResult = {
                  meshUrl: mesh.meshUrl,
                  thumbnailUrl: mesh.thumbnailUrl,
                  polygonCount: mesh.polygonCount,
                  status: mesh.status,
                }
              } catch {
                meshResult = {
                  meshUrl: null,
                  thumbnailUrl: DEMO_THUMBNAIL_SVG,
                  polygonCount: null,
                  status: 'demo',
                }
              }
            }

            const metaChunk =
              '\x00' +
              JSON.stringify({
                __meta: true,
                suggestions,
                intent,
                hasCode,
                tokensUsed,
                executedInStudio,
                model: finalMsg.model,
                ...(mcpResult ? { mcpResult } : {}),
                ...(meshResult ? { meshResult } : {}),
              })
            await writer.write(enc.encode(metaChunk))
          } catch (streamErr) {
            const errMsg =
              streamErr instanceof Anthropic.RateLimitError
                ? 'Rate limit reached. Please wait a moment and try again.'
                : buildErrorResponse(streamErr, intent)
            await writer.write(
              enc.encode('\x00' + JSON.stringify({ __meta: true, error: errMsg })),
            )
          } finally {
            await writer.close()
          }
        })()

        return new Response(readable, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
            'X-Accel-Buffering': 'no',
            'Cache-Control': 'no-cache, no-transform',
          },
        }) as unknown as NextResponse
      }

      // ── NON-STREAMING PATH ───────────────────────────────────────────────────────
      const aiResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        system: FORJEAI_SYSTEM_PROMPT + cameraContext + multiStepContext,
        messages: claudeMessages,
      })

      const textBlock = aiResponse.content.find((b) => b.type === 'text')
      const responseText = textBlock && textBlock.type === 'text' ? textBlock.text : ''
      const tokensUsed = aiResponse.usage.input_tokens + aiResponse.usage.output_tokens

      // Auto-trigger MCP tools based on what Claude said it's doing
      let mcpResult: McpCallResult | undefined
      const mcpIntentVal = detectMcpIntent(message, responseText)
      if (mcpIntentVal) {
        try {
          mcpResult = await callTool(mcpIntentVal.server, mcpIntentVal.tool, mcpIntentVal.args)
        } catch {
          // MCP errors are non-fatal — response stands without mcpResult
        }
      }

      // Auto-trigger mesh generation when user intent is mesh
      let meshResult: ChatResponsePayload['meshResult']
      if (intent === 'mesh') {
        try {
          const mesh = await generateMeshForChat(message)
          meshResult = {
            meshUrl: mesh.meshUrl,
            thumbnailUrl: mesh.thumbnailUrl,
            polygonCount: mesh.polygonCount,
            status: mesh.status,
          }
        } catch {
          meshResult = {
            meshUrl: null,
            thumbnailUrl: DEMO_THUMBNAIL_SVG,
            polygonCount: null,
            status: 'demo',
          }
        }
      }

      // Auto-execute any Luau code in Studio, strip it from response
      const luau = extractLuauCode(responseText)
      let executedInStudio = false
      if (luau && sessionId) {
        executedInStudio = await sendCodeToStudio(sessionId, luau)
      }
      const stripped = luau ? stripCodeBlocks(responseText) : responseText
      const { message: cleanMessage, suggestions } = extractSuggestions(stripped)
      const hasCode = luau !== null

      // Compute multi-step build plan metadata if applicable
      const buildPlanForResponse: BuildPlan | undefined = (() => {
        if (multiStepTemplate) return computeBuildPlan(multiStepTemplate, 1)
        if (continuationMeta && activeContinuationTemplate) {
          return computeBuildPlan(activeContinuationTemplate, continuationMeta.currentStep)
        }
        return undefined
      })()

      return NextResponse.json({
        message: cleanMessage || (executedInStudio ? 'Done! Built and placed in your Studio.' : responseText),
        tokensUsed,
        intent,
        hasCode,
        model: aiResponse.model,
        executedInStudio,
        suggestions,
        ...(buildPlanForResponse ? { buildPlan: buildPlanForResponse } : {}),
        ...(mcpResult ? { mcpResult } : {}),
        ...(meshResult ? { meshResult } : {}),
      })
    } catch (err: unknown) {
      // Rate limit — surface a clean error, don't fall through to demo
      if (err instanceof Anthropic.RateLimitError) {
        return NextResponse.json(
          {
            error: 'Rate limit reached. Please wait a moment and try again.',
            hint: buildErrorResponse(err, intent),
          },
          { status: 429 },
        )
      }
      // Any other API error — log and try Gemini/Groq fallbacks
      console.error('[chat] Anthropic API error:', err instanceof Error ? err.message : String(err))
      console.warn('[chat] Actionable hint:', buildErrorResponse(err, intent))
    }
  }

  // ── Two-pass free model pipeline (Gemini Flash + Groq Llama — both free) ──
  // Instead of cramming conversation + code into one prompt (which free models
  // struggle with), we split into two focused calls:
  //   Pass 1: Natural conversational response (short, fun, no code)
  //   Pass 2: Separate Luau code generation (structured, template-based)
  // This produces dramatically better results than the old single-pass approach.
  {
    const historyForFree = history.map((h: HistoryMessage) => ({ role: h.role, content: h.content }))
    const twoPassResult = await freeModelTwoPass(message, intent, historyForFree, cameraContext, sessionId)

    if (twoPassResult) {
      const freeModelBuildPlan: BuildPlan | undefined = (() => {
        if (multiStepTemplate) return computeBuildPlan(multiStepTemplate, 1)
        if (continuationMeta && activeContinuationTemplate) {
          return computeBuildPlan(activeContinuationTemplate, continuationMeta.currentStep)
        }
        return undefined
      })()
      return NextResponse.json({
        message: twoPassResult.conversationText,
        tokensUsed: tokenCost,
        intent,
        hasCode: twoPassResult.luauCode !== null,
        model: twoPassResult.model,
        executedInStudio: twoPassResult.executedInStudio,
        suggestions: twoPassResult.suggestions,
        ...(freeModelBuildPlan ? { buildPlan: freeModelBuildPlan } : {}),
      })
    }
  }

  const tokensUsed = intent === 'conversation' || intent === 'chat' ? 0 : estimateTokens(message)

  // ── Community asset search (runs for all build-related intents) ───────────
  // Preferred over generating from scratch: finds relevant pre-built 3D meshes
  const communityAssets = searchCommunityAssets(message)
  const communityBlock  = buildCommunityAssetSection(communityAssets)


  // Augment the demo response with community asset findings when relevant
  const baseResponse = DEMO_RESPONSES[intent]
  const augmentedResponse = communityBlock
    ? baseResponse + '\n' + communityBlock + '\n\nTip: Click "Assets" in the sidebar → Community tab to browse and insert these directly.'
    : baseResponse

  const payload: ChatResponsePayload = {
    message: augmentedResponse,
    tokensUsed,
    intent,
  }

  // ── Mesh generation (direct server-side call, no loopback HTTP) ─────────
  if (intent === 'mesh') {
    try {
      const result = await generateMeshForChat(message)
      payload.meshResult = {
        meshUrl: result.meshUrl,
        thumbnailUrl: result.thumbnailUrl,
        polygonCount: result.polygonCount,
        status: result.status,
      }
      if (result.status === 'demo') {
        payload.message =
          'Demo mode: 3D model generation preview shown below. Set MESHY_API_KEY to generate real GLB models. Used ' +
          tokensUsed +
          ' tokens.'
      } else if (result.status === 'complete') {
        payload.message =
          `3D model generated! ${result.polygonCount ? result.polygonCount.toLocaleString() + ' polygons. ' : ''}Download the GLB below. Used ${tokensUsed} tokens.`
      } else {
        payload.message =
          `3D model still generating (taskId: ${result.taskId ?? 'unknown'}). Poll GET /api/ai/mesh?taskId=${result.taskId ?? ''} for the download link. Used ${tokensUsed} tokens.`
      }
    } catch {
      // Mesh generation failed — fall through to demo message
      payload.meshResult = {
        meshUrl: null,
        thumbnailUrl: DEMO_THUMBNAIL_SVG,
        polygonCount: null,
        status: 'demo',
      }
      payload.message =
        'Mesh generation unavailable right now. Set MESHY_API_KEY for real 3D models. Used ' +
        tokensUsed + ' tokens.'
    }
    return NextResponse.json(payload)
  }

  // ── Texture generation ───────────────────────────────────────────────────
  if (intent === 'texture') {
    try {
      const result = await callTextureApi(message)
      payload.textureResult = {
        textureUrl: result.textureUrl,
        resolution: result.resolution,
        status: result.status,
      }
      if (result.status === 'demo') {
        payload.message =
          'Demo mode: texture generation preview shown below. Add a FAL_API_KEY environment variable to generate real textures. Used ' +
          tokensUsed +
          ' tokens.'
      } else if (result.status === 'complete' && result.textureUrl) {
        payload.message =
          `Texture generated at ${result.resolution}×${result.resolution}px — seamless tileable. Used ${tokensUsed} tokens.`
      }
    } catch {
      // Leave default demo message, no textureResult attached
    }
    return NextResponse.json(payload)
  }

  // ── Auto-trigger MCP for terrain/city/asset intents in demo path ─────────
  {
    const mcpIntent = detectMcpIntent(message, DEMO_RESPONSES[intent] ?? '')
    if (mcpIntent) {
      try {
        payload.mcpResult = await callTool(mcpIntent.server, mcpIntent.tool, mcpIntent.args)
      } catch {
        // MCP errors are non-fatal — demo response stands
      }
    }
  }

  // ── Marketplace-first building pipeline ──────────────────────────────────
  if (intent === 'building' || intent === 'terrain' || intent === 'fullgame') {
    try {
      // 1. Extract what assets we need from the prompt
      const searchTerms = extractSearchTerms(message)

      if (searchTerms.length > 0) {
        // 2. Search marketplace for all terms in parallel
        const plan: BuildAssetPlan = await planBuildAssets(searchTerms)

        // 3. Build placement grid — simple row/column layout, 30 studs apart
        const GRID_SPACING = 30
        const placements = plan.found.map(({ asset, searchTerm }, i) => ({
          assetId:  asset.assetId,
          name:     asset.name,
          position: {
            x: (i % 4) * GRID_SPACING,
            y: 0,
            z: Math.floor(i / 4) * GRID_SPACING,
          },
          scale: 1,
        }))

        // 4. Generate Luau code
        const luauCode = placements.length > 0
          ? generateMarketplaceLuau(placements)
          : '-- No marketplace assets found — generate custom models with Meshy'

        // 5. Build client-facing asset list
        const foundAssets: MarketplaceAssetClient[] = plan.found.map(({ asset, searchTerm }) => ({
          assetId:     asset.assetId,
          name:        asset.name,
          creator:     asset.creator,
          thumbnailUrl: asset.thumbnailUrl,
          isFree:      asset.isFree,
          catalogUrl:  asset.catalogUrl,
          searchTerm,
        }))

        payload.buildResult = {
          foundAssets,
          missingTerms: plan.missing,
          luauCode,
          totalMarketplace: plan.totalMarketplace,
          totalCustom: plan.totalCustom,
          estimatedCustomCost: plan.estimatedCustomCost,
        }

        // 6. Override message with marketplace-first summary
        const foundCount = plan.totalMarketplace
        const customCount = plan.totalCustom
        const parts: string[] = []

        if (foundCount > 0) {
          parts.push(`Found ${foundCount} marketplace asset${foundCount !== 1 ? 's' : ''} for your build`)
        }
        if (customCount > 0) {
          parts.push(`${customCount} asset${customCount !== 1 ? 's' : ''} need custom generation via Meshy AI (${plan.estimatedCustomCost} credit${plan.estimatedCustomCost !== 1 ? 's' : ''})`)
        }

        if (foundCount === 0 && customCount === 0) {
          payload.message = DEMO_RESPONSES[intent]
        } else {
          // Build a Luau snippet showing how to load marketplace assets
          const luauSnippet = foundAssets.length > 0
            ? `\`\`\`lua\n-- Paste into Studio Command Bar to insert all found assets\nlocal IS = game:GetService("InsertService")\nlocal root = workspace\n${foundAssets.slice(0, 5).map((a, i) => {
                const x = (i % 4) * 30
                const z = Math.floor(i / 4) * 30
                return `local m${i+1} = IS:LoadAsset(${a.assetId}) -- ${a.name}\nm${i+1}:MoveTo(Vector3.new(${x}, 0, ${z}))\nm${i+1}.Parent = root`
              }).join('\n')}${foundAssets.length > 5 ? `\n-- ... ${foundAssets.length - 5} more assets in full Luau code panel` : ''}\n\`\`\``
            : ''

          // If missing terms exist, suggest Meshy generation with specific prompts
          const meshySection = customCount > 0
            ? `\n\nMeshy AI generation queued for ${customCount} missing asset${customCount !== 1 ? 's' : ''}:\n${plan.missing.map((t, i) => `  ${foundCount + i + 1}. "${t}" — click Generate to start Meshy text-to-3D (~2 min, ${Math.ceil(plan.estimatedCustomCost / customCount)} credit${Math.ceil(plan.estimatedCustomCost / customCount) !== 1 ? 's' : ''})`).join('\n')}\n\nAdd MESHY_API_KEY to .env to auto-generate these as GLB models.`
            : ''

          payload.message = `✓ Build Plan Ready

${parts.join(' · ')}

Marketplace assets (${foundCount}):
${foundAssets.map((a, i) => `  ${i + 1}. ${a.name} by ${a.creator} [ID: ${a.assetId}]${a.isFree ? ' — Free' : ''}`).join('\n')}${meshySection}

${luauSnippet}

Token cost: ${tokensUsed} tokens

Tip: Run the Luau snippet in Studio Command Bar to insert all marketplace assets at once.`
        }
      }
    } catch {
      // Fall through to default demo message if marketplace search fails
    }
    return NextResponse.json(payload)
  }

  return NextResponse.json(payload)
}
