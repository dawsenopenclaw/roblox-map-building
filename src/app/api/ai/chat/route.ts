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
import { queueCommand, getSession, getSessionByToken } from '@/lib/studio-session'
import Anthropic from '@anthropic-ai/sdk'

// Extract ```lua code blocks from AI response text
function extractLuauCode(text: string): string | null {
  const match = text.match(/```(?:lua|luau)?\s*\n([\s\S]*?)```/)
  return match?.[1]?.trim() || null
}

// Strip code blocks from response — user only sees friendly text
function stripCodeBlocks(text: string): string {
  return text.replace(/```(?:lua|luau)?\s*\n[\s\S]*?```/g, '').replace(/\n{3,}/g, '\n\n').trim()
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
    const result = await queueCommand(sessionId, {
      type: 'execute_luau',
      data: { code },
    })
    return result.ok
  } catch {
    return false
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

=== HIDDEN LUAU RULES (code auto-runs, user never sees it) ===
- NEVER use game.Players, LocalPlayer, Character — this is Edit Mode
- Use TryBeginRecording (not BeginRecording)
- Camera positioning: local cam=workspace.CurrentCamera; local sp=cam.CFrame.Position+cam.CFrame.LookVector*25
- ALL parts use CFrame.new(sp+Vector3.new(x,y,z)), Anchored=true, CastShadow=true
- Group in Models, set PrimaryPart, use good materials (Slate, Metal, WoodPlanks, Marble, Glass, Cobblestone, Granite, Neon)
- PointLights: Brightness=1.5, Range=16, Color=Color3.fromRGB(255,180,80)
- _forje_state is a shared table that persists across commands — store references like _forje_state.lastBuild = model
- After building, select the model: game:GetService("Selection"):Set({model})
- Tag AI-created objects: game:GetService("CollectionService"):AddTag(model, "ForjeAI")
- For ground placement, raycast down: local ray=workspace:Raycast(spawnPos+Vector3.new(0,50,0),Vector3.new(0,-200,0)); local groundY=ray and ray.Position.Y or 0
- When user says "undo" or "go back", respond with just the word and the plugin handles it
- When user says "make it [color/bigger/smaller/move]" about selected objects, generate code that modifies Selection:Get()
- For lighting/mood changes, set Lighting properties + Atmosphere child directly
- MATCH existing scene colors/materials — check NEARBY OBJECTS in STUDIO CONTEXT

Code template:
\`\`\`lua
local CH=game:GetService("ChangeHistoryService")
local CS=game:GetService("CollectionService")
local rid=CH:TryBeginRecording("ForjeAI")
local cam=workspace.CurrentCamera
local sp=cam.CFrame.Position+cam.CFrame.LookVector*25
-- Raycast for ground
local groundRay=workspace:Raycast(sp+Vector3.new(0,50,0),Vector3.new(0,-200,0))
local groundY=groundRay and groundRay.Position.Y or sp.Y
sp=Vector3.new(sp.X,groundY,sp.Z)
local m=Instance.new("Model") m.Name="Build"
-- parts using CFrame.new(sp+Vector3.new(x,y,z))
-- m.PrimaryPart=firstPart
m.Parent=workspace
CS:AddTag(m,"ForjeAI")
game:GetService("Selection"):Set({m})
_forje_state.lastBuild=m
if rid then CH:FinishRecording(rid,Enum.FinishRecordingOperation.Commit) end
\`\`\`

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

ALWAYS end with suggestions. NEVER skip them.`

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
  | 'default'

// Token costs per intent — cheap for conversation, expensive for generation
const INTENT_TOKEN_COST: Record<IntentKey, number> = {
  conversation: 0,  // Free — chatting, questions, learning
  chat: 0,          // Free — alias for conversation
  undo: 0,          // Free — informational only
  help: 0,          // Free — capability explanation
  publish: 0,       // Free — publishing guidance
  multiscript: 30,  // Multi-file system generation
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
  const trimmed = message.trim()

  // 1. Check conversation patterns FIRST — greetings, questions, etc. are never builds
  if (CHAT_PATTERNS.some((p) => p.test(trimmed))) {
    return 'conversation'
  }

  // 2. Check if user has an explicit build verb (build, create, generate, make, add, place, etc.)
  const hasBuildVerb = /\b(build|create|generate|make|add|place|spawn|insert|construct|set up|design)\b/i.test(trimmed)
  if (!hasBuildVerb) {
    return 'conversation' // No build verb = just chatting
  }

  // 3. Match specific build intents
  for (const entry of KEYWORD_INTENT_MAP) {
    if (entry.patterns.some((p) => p.test(trimmed))) {
      return entry.intent
    }
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

  undo: `To undo your last build in Roblox Studio, press **Ctrl+Z**. ForjeAI uses ChangeHistoryService, so everything is undoable.\n\n[SUGGESTIONS]\nBuild something different instead\nUndo multiple times to go back further\nTry again with more specific instructions`,

  help: `I'm ForjeAI — your Roblox game dev partner. I can build maps, write scripts, generate 3D models, search the marketplace, and design game systems. Just tell me what you want.\n\n[SUGGESTIONS]\nBuild me a medieval castle\nCreate a coin collection script\nSearch marketplace for tree assets`,

  publish: `To publish: File → Publish to Roblox (Ctrl+P). Set your game name, description, thumbnail, and privacy. Check Output for errors before going public.\n\n[SUGGESTIONS]\nHelp me set up a game pass\nCreate a welcome screen\nBuild an admin commands script`,

  multiscript: `For full game systems I generate multiple scripts with clear separation. Say "build me a [system] system" and I'll output all the files with labels.\n\n[SUGGESTIONS]\nBuild me a pet system\nCreate a trading system\nMake a leaderboard system with DataStore`,

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
  /** Whether the AI response contained a Luau code block */
  hasCode?: boolean
  /** Clickable next-action suggestions parsed from [SUGGESTIONS] block */
  suggestions?: string[]
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
      const buildMatch = msg.content.match(/✓s+(.{0,60})/)
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
    }
    // Guest users (no userId) fall through — they get demo responses
    // but can try the product before signing up
  }

  const parsed = await parseBody(req, chatMessageSchema)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  }

  const message = parsed.data.message.trim()
  const wantsStream = (parsed.data as Record<string, unknown>).stream === true

  // Merge history sources: `messages` is the frontend alias, `history` is legacy.
  // Accept up to the last 20 turns from whichever field the client sends.
  const rawHistory: HistoryMessage[] = (
    ((parsed.data as Record<string, unknown>).messages ??
      parsed.data.history ??
      []) as HistoryMessage[]
  ).slice(-20)

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
            system_instruction: { parts: [{ text: FORJEAI_SYSTEM_PROMPT + cameraContext }] },
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
              system: FORJEAI_SYSTEM_PROMPT + cameraContext,
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
        system: FORJEAI_SYSTEM_PROMPT + cameraContext,
        messages: claudeMessages,
      })

      const textBlock = aiResponse.content.find((b) => b.type === 'text')
      const responseText = textBlock && textBlock.type === 'text' ? textBlock.text : ''
      const tokensUsed = aiResponse.usage.input_tokens + aiResponse.usage.output_tokens

      // Auto-trigger MCP tools based on what Claude said it's doing
      let mcpResult: McpCallResult | undefined
      const mcpIntentVal = detectMcpIntent(message, responseText)
      if (mcpIntentVal) {
        mcpResult = await callTool(mcpIntentVal.server, mcpIntentVal.tool, mcpIntentVal.args)
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

      return NextResponse.json({
        message: cleanMessage || (executedInStudio ? 'Done! Built and placed in your Studio.' : responseText),
        tokensUsed,
        intent,
        hasCode,
        model: aiResponse.model,
        executedInStudio,
        suggestions,
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

  // ── Gemini Flash fallback (free tier — works when Anthropic has no credits) ──
  const geminiKey = process.env.GEMINI_API_KEY
  if (geminiKey) {
    try {
      const maxTokens = intent === 'chat' || intent === 'conversation' ? 512 : intent === 'fullgame' ? 4096 : 2048
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: FORJEAI_SYSTEM_PROMPT + cameraContext }] },
            contents: [
              ...history.map((h: HistoryMessage) => ({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.content }] })),
              { role: 'user', parts: [{ text: message }] },
            ],
            generationConfig: { maxOutputTokens: maxTokens },
          }),
        },
      )
      if (geminiRes.ok) {
        type GeminiResponse = {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
          usageMetadata?: { totalTokenCount?: number }
        }
        const geminiData = await geminiRes.json() as GeminiResponse
        const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
        if (text) {
          return NextResponse.json({
            message: text,
            tokensUsed: tokenCost,
            intent,
            model: 'gemini-2.0-flash',
          } satisfies ChatResponsePayload & { model: string })
        }
      }
    } catch (err) {
      console.error('[chat] Gemini fallback error:', err instanceof Error ? err.message : String(err))
    }
  }

  // ── Groq fallback (Llama 3.3 70B — free, fast, intelligent) ───────────────
  const groqKey = process.env.GROQ_API_KEY
  if (groqKey) {
    try {
      const maxTokens = intent === 'chat' || intent === 'conversation' ? 512 : intent === 'fullgame' ? 4096 : 2048
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: maxTokens,
          messages: [
            { role: 'system', content: FORJEAI_SYSTEM_PROMPT + cameraContext },
            ...history.map(h => ({ role: h.role, content: h.content })),
            { role: 'user', content: message },
          ],
        }),
      })
      if (groqRes.ok) {
        type GroqResponse = {
          choices?: Array<{ message?: { content?: string } }>
          usage?: { total_tokens?: number }
        }
        const groqData = await groqRes.json() as GroqResponse
        const text = groqData.choices?.[0]?.message?.content ?? ''
        if (text) {
          // Auto-execute any Luau code in Studio, strip it from response
          const luau = extractLuauCode(text)
          let executedInStudio = false
          if (luau && sessionId) {
            executedInStudio = await sendCodeToStudio(sessionId, luau)
          }
          const stripped = luau ? stripCodeBlocks(text) : text
          const { message: cleanMessage, suggestions } = extractSuggestions(stripped)
          return NextResponse.json({
            message: cleanMessage || (executedInStudio ? 'Done! Built and placed in your Studio.' : text),
            tokensUsed: tokenCost,
            intent,
            hasCode: luau !== null,
            model: 'llama-3.3-70b',
            executedInStudio,
            suggestions,
          })
        }
      }
    } catch (err) {
      console.error('[chat] Groq fallback error:', err instanceof Error ? err.message : String(err))
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
