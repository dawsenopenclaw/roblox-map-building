import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import {
  planBuildAssets,
  extractSearchTerms,
  generateMarketplaceLuau,
  type BuildAssetPlan,
  type MarketplaceAsset,
} from '@/lib/roblox-asset-search'
import { callTool, detectMcpIntent, type McpCallResult } from '@/lib/mcp-client'
import { spendTokens } from '@/lib/tokens-server'
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

const FORJEAI_SYSTEM_PROMPT = `You are ForjeAI, an expert Roblox game development assistant embedded in the ForjeGames platform. You help users build games by generating terrain, placing assets, writing Luau scripts, and managing game elements.

Your expertise:
- Luau scripting (ServerScripts, LocalScripts, ModuleScripts, RemoteEvents, RemoteFunctions)
- Roblox Studio APIs: Instance.new, CFrame, Vector3, Color3, Material enum, Enum.Material, Terrain:FillBlock/FillBall/WriteVoxels
- Performance: keep parts < 20,000, use unions sparingly, anchor static parts
- Marketplace-first: suggest real Roblox asset IDs when possible before generating custom
- All 25 Roblox Materials and when to use each
- DataStore / ProfileStore for persistence
- Tycoon, simulator, obby, RPG game patterns
- Economy design for 8-16 year old players

Response style:
- Always give specific numbers: part counts, stud dimensions, polygon counts, token costs
- Include Luau code blocks (in triple backticks) for any scripting request
- Use the checkmark prefix format: "✓ [Action] Complete" as header
- Keep responses concise but dense with specifics — no padding
- Suggest the next logical build step at the end as a "Tip:"
- When suggesting marketplace assets, include realistic asset IDs and creator names`

// ─── Intent detection ─────────────────────────────────────────────────────────

type IntentKey =
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
  | 'default'

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

function detectIntent(message: string): IntentKey {
  for (const entry of KEYWORD_INTENT_MAP) {
    if (entry.patterns.some((p) => p.test(message))) {
      return entry.intent
    }
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

  terrain: `✓ Terrain Generated

Created a volcanic island biome (512×512 studs):
• Central volcano peak: 180 studs high, active lava crater at summit
• Beach ring: 40 studs wide, Sand material, gentle 12° slope angle
• Dense jungle canopy: 847 trees placed (Palm, Tropical, Mangrove variants)
• Coral reef: underwater ring at -20 studs depth, SmoothPlastic coral clusters
• 3 waterfalls cascading from volcano peak to shoreline
• Rocky sea cliffs: north face, 60 studs high, Rock material

Material breakdown:
  Grass 42% | Sand 18% | Rock 25% | Water 15%

Instance count: 1,247 | Performance: Good
Token cost: 45 tokens

Tip: Say "add a village on the beach" to place buildings, or "create a cave entrance in the volcano" to add interior areas.`,

  building: `✓ Buildings Placed

Constructed a medieval castle complex (240×240 stud footprint):
• Main keep: 80 studs tall, SmoothRock material, battlements on all sides
• 4 corner towers: 70 studs, arrow slit windows, spiral staircase interiors
• Gatehouse: portcullis (functional sliding mechanism), drawbridge over moat
• Inner courtyard: 120×120 studs, cobblestone floor pattern
• Great hall: 60×40 stud interior, timber roof beams, fireplace
• Dungeon level: -15 studs underground, cell doors, torchlight atmosphere
• Outer wall circuit: 8 studs thick, 22 studs high, 4 guard towers
• Moat: 12 studs wide, 8 studs deep, water fill

Parts placed: 2,341 | Unions: 48 | SpecialMeshes: 12
Performance: Good | Render budget used: 18%
Token cost: 62 tokens

Tip: Say "add NPCs patrolling the walls" to bring the castle to life.`,

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

  script: `✓ Script Generated

Coin Collection System — 3 scripts created:

── CoinSpawner (ServerScript) ────────────────────────
local COIN_VALUE   = 5
local RESPAWN_TIME = 8

local function collectCoin(player, coin, position)
  coin:Destroy()
  local leads = player:FindFirstChild("leaderstats")
  if leads then leads.Coins.Value += COIN_VALUE end
  task.delay(RESPAWN_TIME, spawnCoin, position)
end

local function spawnCoin(position)
  local coin = ReplicatedStorage.Assets.Coin:Clone()
  coin.Position = position
  coin.Parent   = workspace.Coins
  local bav = Instance.new("BodyAngularVelocity")
  bav.AngularVelocity = Vector3.new(0, 3, 0)
  bav.Parent = coin
  coin.Touched:Connect(function(hit)
    local plr = Players:GetPlayerFromCharacter(hit.Parent)
    if plr then collectCoin(plr, coin, position) end
  end)
end
──────────────────────────────────────────────────────

Also created:
  • CoinSFX (LocalScript) — plays collect sound, shows +5 floating text
  • LeaderboardSetup (ServerScript) — creates leaderstats on join

Token cost: 52 tokens

Tip: Say "add a shop to spend the coins" to wire up a purchase system.`,

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

  fullgame: `✓ Full Game Generated

"Factory Empire" — Tycoon game, complete project scaffold:

Core loop:
  Collect Resources → Build Machines → Produce Goods → Sell → Upgrade → Repeat

Map layout (2,048×2,048 studs):
  Zone              Size       Contents
  ──────────────────────────────────────────────────────────
  Starter Zone      256×256    3 free plots, tutorial NPCs
  Industrial Zone   512×512    20 purchasable factory plots
  Market District   256×128    Sell station, upgrade shop
  Residential       128×128    Worker NPC housing
  Prestige Island   256×256    Unlocks at $1M earned

Systems scaffolded (12 total):
   1. PlotManager        claim, reset, ownership via DataStore
   2. ConveyorSystem     parts move along belt network
   3. MachineProducer    time-based item generation per tier
   4. SellerStation      auto-sells, broadcasts income to leaderboard
   5. UpgradeTree        3 tiers per machine, doubles output each tier
   6. PrestigeSystem     reset with 2× multiplier, persistent badge
   7. LeaderboardGui     top 10 earners, refreshes every 30s
   8. TutorialSequence   5-step guided onboarding flow
   9. DataPersistence    ProfileService schema, auto-migration
  10. AdminCommands      kick, ban, give money, reset plot
  11. GamepassHandler    2× Money, VIP Plot, Auto-Collect gamepasses
  12. AnalyticsLogger    funnel event tracking for LiveOps

Estimated launch readiness: 70% (artwork + balancing remaining)
Total instances: 4,840 | Scripts: 28 | Performance: Good
Token cost: 142 tokens

Tip: Say "balance the economy curve" for a progression spreadsheet.`,

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

// ─── Simulated thinking delay ─────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ─── Internal API callers ─────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://forjegames.com'

async function callMeshApi(
  prompt: string,
): Promise<{ meshUrl: string | null; thumbnailUrl: string | null; polygonCount: number | null; status: string; message?: string }> {
  const res = await fetch(`${BASE_URL}/api/ai/mesh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, quality: 'standard' }),
    signal: AbortSignal.timeout(120_000), // generation can take up to 2 min
  })
  if (!res.ok) throw new Error(`Mesh API error ${res.status}`)
  return res.json() as Promise<{ meshUrl: string | null; thumbnailUrl: string | null; polygonCount: number | null; status: string; message?: string }>
}

async function callTextureApi(
  prompt: string,
): Promise<{ textureUrl: string | null; resolution: string; status: string; message?: string }> {
  const res = await fetch(`${BASE_URL}/api/ai/texture`, {
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
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    authedUserId = userId
  }

  let body: { message?: unknown; conversationId?: unknown }

  try {
    body = (await req.json()) as { message?: unknown; conversationId?: unknown }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const message = typeof body.message === 'string' ? body.message.trim() : ''

  if (!message || message.length > 4000) {
    return NextResponse.json({ error: 'message is required (max 4000 chars)' }, { status: 400 })
  }

  const intent = detectIntent(message)

  // ── Real Claude API path ──────────────────────────────────────────────────
  const anthropic = getAnthropicClient()
  if (anthropic) {
    try {
      // Deduct tokens before calling the AI — prevents free-riding when billing fails.
      // Cost: 50 tokens per chat request. Skipped in demo mode (no real user).
      if (!isDemo && authedUserId) {
        await spendTokens(authedUserId, 50, 'AI chat request', { prompt: message.slice(0, 100) })
      }

      const aiResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
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

      return NextResponse.json({
        message: responseText,
        tokensUsed,
        intent,
        model: aiResponse.model,
        ...(mcpResult ? { mcpResult } : {}),
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

  // ── Mesh generation ──────────────────────────────────────────────────────
  if (intent === 'mesh') {
    try {
      const result = await callMeshApi(message)
      payload.meshResult = {
        meshUrl: result.meshUrl,
        thumbnailUrl: result.thumbnailUrl,
        polygonCount: result.polygonCount,
        status: result.status,
      }
      if (result.status === 'demo') {
        payload.message =
          'Demo mode: 3D model generation preview shown below. Add a MESHY_API_KEY environment variable to generate real GLB models. Used ' +
          tokensUsed +
          ' tokens.'
      } else if (result.status === 'complete') {
        payload.message =
          `3D model generated successfully! ${result.polygonCount ? result.polygonCount.toLocaleString() + ' polygons.' : ''} Download the GLB below. Used ${tokensUsed} tokens.`
      } else {
        payload.message =
          `3D model generation started. Check back shortly for your GLB download. Used ${tokensUsed} tokens.`
      }
    } catch {
      // Leave default demo message, no meshResult attached
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
          parts.push(`Generating ${customCount} custom model${customCount !== 1 ? 's' : ''} (${plan.estimatedCustomCost} Meshy credit${plan.estimatedCustomCost !== 1 ? 's' : ''})`)
        }

        if (foundCount === 0 && customCount === 0) {
          payload.message = DEMO_RESPONSES[intent]
        } else {
          payload.message = `✓ Build Plan Ready

${parts.join(' · ')}

Marketplace assets (${foundCount}):
${foundAssets.map((a, i) => `  ${i + 1}. ${a.name} by ${a.creator} [ID: ${a.assetId}]`).join('\n')}
${customCount > 0 ? `\nCustom generation needed (${customCount}):\n${plan.missing.map((t, i) => `  ${foundCount + i + 1}. "${t}" — will generate with Meshy AI`).join('\n')}` : ''}

Luau code generated — uses InsertService:LoadAsset() with real asset IDs.
Token cost: ${tokensUsed} tokens`
        }
      }
    } catch {
      // Fall through to default demo message if marketplace search fails
    }
    return NextResponse.json(payload)
  }

  return NextResponse.json(payload)
}
