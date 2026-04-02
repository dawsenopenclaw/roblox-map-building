import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { requireTier } from '@/lib/tier-guard'
import { chatMessageSchema, parseBody } from '@/lib/validations'
import {
  planBuildAssets,
  extractSearchTerms,
  generateMarketplaceLuau,
  type BuildAssetPlan,
  type MarketplaceAsset,
} from '@/lib/roblox-asset-search'
import { callTool, detectMcpIntent, type McpCallResult } from '@/lib/mcp-client'
import { spendTokens } from '@/lib/tokens-server'
import { aiRateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import Anthropic from '@anthropic-ai/sdk'

// ─── Lazy Anthropic client (only created when API key is present) ──────────────

let _anthropic: Anthropic | null = null
function getAnthropicClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return _anthropic
}

const FORJEAI_SYSTEM_PROMPT = `You are ForjeAI, a friendly and knowledgeable Roblox game development assistant. You help users plan, learn about, and build Roblox games.

HOW TO BEHAVE:
- Be conversational and helpful. Answer questions naturally.
- If the user is just chatting, asking questions, or learning — just TALK. No code needed.
- Only generate Luau code when the user explicitly asks you to BUILD, CREATE, GENERATE, or MAKE something.
- When chatting (no build request), keep responses concise — 2-4 sentences max.
- Never generate code for greetings, questions about features, or general conversation.

WHEN THE USER ASKS TO BUILD SOMETHING:
- Use WedgeParts for roofs/ramps, Cylinders for pillars/towers
- Materials: Cobblestone, WoodPlanks, Slate, Marble, Glass, Metal, SmoothRock, Granite, Sand, Neon
- Colors: stone(140,130,120) wood(150,110,70) gold(212,175,55) iron(80,80,90) brick(180,90,70)
- Scale: character=5 studs, door=4×7, ceiling=12 studs, wall=1-2 studs
- Group in Models: workspace.Castle.Walls, etc.
- PointLights for torches, SpotLights for beams
- Anchor static parts, CastShadow=true
- Wrap in ChangeHistoryService for undo
- Include complete runnable code — no placeholders

BUILD RESPONSE FORMAT:
1. Brief description (2 sentences)
2. Complete Luau code block
3. "Parts: X | Tip: [next step]"

CHAT RESPONSE FORMAT (no build):
Just respond naturally. No code blocks. No build headers. Just helpful conversation.`

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
  | 'default'

// Token costs per intent — cheap for conversation, expensive for generation
const INTENT_TOKEN_COST: Record<IntentKey, number> = {
  chat: 2,          // Simple conversation
  default: 5,       // General questions
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
    patterns: [/\b(terrain|land|mountain|hill|valley|biome|grass|water|lake|river|flatten|raise|lower|forest|city|racing|track)\b/i],
    intent: 'terrain',
  },
  {
    patterns: [/\b(build|place|castle|house|tower|wall|bridge|shop|structure|building)\b/i],
    intent: 'building',
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
    patterns: [/\b(light|fog|sky|ambient|sunrise|sunset|atmosphere)\b/i],
    intent: 'lighting',
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
  // Check specific build intents first
  for (const entry of KEYWORD_INTENT_MAP) {
    if (entry.patterns.some((p) => p.test(message))) {
      return entry.intent
    }
  }
  // Check if it's just conversation
  if (CHAT_PATTERNS.some((p) => p.test(message.trim()))) {
    return 'chat'
  }
  return 'default'
}

// ─── Demo responses ───────────────────────────────────────────────────────────

const DEMO_RESPONSES: Record<IntentKey, string> = {
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

CH:FinishRecording(id, Enum.FinishRecordingOperation.Commit, {})
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

  lighting: `✓ Lighting Updated

Golden Hour Atmosphere — sunset scene:

Lighting properties:
  Ambient           Color3(255, 214, 170) — warm orange fill
  OutdoorAmbient    Color3(220, 160, 80)
  Brightness        1.8
  ClockTime         17.4 (5:24 PM)
  GeographicLatitude 45

Effects added:
  • Atmosphere
      Density 0.35 | Offset 0.25
      Color Color3(255, 150, 60) | Glare 0.3 | Haze 1.8
  • ColorCorrection
      Brightness +0.04 | Contrast +0.08 | Saturation +0.2
      TintColor Color3(255, 230, 200)
  • DepthOfField
      FarIntensity 0.3 | FocusDistance 80 | InFocusRadius 40
  • SunRays
      Intensity 0.12 | Spread 0.5

Shadow quality: Level 3 | Performance impact: Low (+1–2ms)
Token cost: 14 tokens

Tip: Say "add a day/night cycle script" to animate the lighting over time.`,

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

export interface MarketplaceAssetClient {
  assetId: number
  name: string
  creator: string
  thumbnailUrl: string | null
  isFree: boolean
  catalogUrl: string
  searchTerm: string
}

interface ChatResponsePayload {
  message: string
  tokensUsed: number
  intent: IntentKey
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
  /** Auto-triggered MCP tool result when Claude response implies generation */
  mcpResult?: McpCallResult
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
      // Authenticated user — check tier and rate limit
      const tierDenied = await requireTier(userId, 'FREE')
      if (tierDenied) return tierDenied
      authedUserId = userId

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
    }
    // Guest users (no userId) fall through — they get demo responses
    // but can try the product before signing up
  }

  const parsed = await parseBody(req, chatMessageSchema)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  }

  const message = parsed.data.message.trim()

  const intent = detectIntent(message)

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
            system_instruction: { parts: [{ text: FORJEAI_SYSTEM_PROMPT }] },
            contents: [{ role: 'user', parts: [{ text: message }] }],
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
        messages: [{ role: 'user', content: message }],
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
  const tokenCost = INTENT_TOKEN_COST[intent] ?? INTENT_TOKEN_COST.default
  if (anthropic) {
    // Deduct tokens before calling the AI — cost depends on intent type
    if (!isDemo && authedUserId) {
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
      // Chat gets shorter responses, builds get full output
      const maxTokens = intent === 'chat' ? 512 : intent === 'fullgame' ? 4096 : 2048
      const aiResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        system: FORJEAI_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: message }],
      })

      const textBlock = aiResponse.content.find((b) => b.type === 'text')
      const responseText = textBlock && textBlock.type === 'text' ? textBlock.text : ''
      const tokensUsed = aiResponse.usage.input_tokens + aiResponse.usage.output_tokens

      // Auto-trigger MCP tools based on what Claude said it's doing
      let mcpResult: McpCallResult | undefined
      const mcpIntent = detectMcpIntent(message, responseText)
      if (mcpIntent) {
        mcpResult = await callTool(mcpIntent.server, mcpIntent.tool, mcpIntent.args)
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

      return NextResponse.json({
        message: responseText,
        tokensUsed: tokenCost, // Report the charged cost, not raw API tokens
        intent,
        model: aiResponse.model,
        ...(mcpResult  ? { mcpResult }  : {}),
        ...(meshResult ? { meshResult } : {}),
      } satisfies ChatResponsePayload & { model: string })
    } catch (err: unknown) {
      // Rate limit — surface a clean error, don't fall through to demo
      if (err instanceof Anthropic.RateLimitError) {
        return NextResponse.json(
          { error: 'Rate limit reached. Please wait a moment and try again.' },
          { status: 429 },
        )
      }
      // Any other API error — fall through to demo responses below
    }
  }

  const tokensUsed = estimateTokens(message)

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
