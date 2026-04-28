/**
 * Build Executor — wave-by-wave orchestration engine.
 *
 * Takes a BuildPlan and executes it:
 *  - Wave 0 tasks run immediately in parallel
 *  - Each subsequent wave waits for all tasks in the prior wave to settle
 *  - Per-task handlers route to the right generator (terrain, scripts, meshes, etc.)
 *  - Progress is written to Redis so the status endpoint can poll without WebSockets
 *  - Failed tasks are marked and skipped — remaining tasks still execute
 */

import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { callAI } from './provider'
import { analyzeLuau, autoFixLuau } from './static-analysis'
import { validateBuild } from './build-validator'
import { redis } from '@/lib/redis'
import { queueCommand } from '@/lib/studio-session'
import { startMeshPipeline } from '@/lib/pipeline/mesh-pipeline'
import { spendTokens } from '@/lib/tokens-server'
import { serverEnv } from '@/lib/env'
import type { BuildPlan, BuildTask, BuildTaskType } from './build-planner'
import {
  economySystem,
  tycoonDropper,
  npcDialogSystem,
  leaderboardProgression,
  basicCombat,
  inventorySystem,
  dayNightCycle,
  spawnSystem,
  obbyCheckpoints,
  petFollowSystem,
  professionalBuilding,
  vehicleSystem,
  tradingSystem,
  dailyRewardsSystem,
  particleEffectSystem,
  weatherSystem,
  animationSystem,
} from './luau-templates'

// ── Lazy Anthropic client (kept for optional custom-key path only) ────────────
// Primary AI path now uses callAI() → Gemini (primary) + Groq (fallback).

let _anthropic: Anthropic | null = null
function getClient(): Anthropic | null {
  if (process.env.ANTHROPIC_DISABLED === 'true') return null
  if (_anthropic) return _anthropic
  const key = serverEnv.ANTHROPIC_API_KEY
  if (!key) return null
  _anthropic = new Anthropic({ apiKey: key })
  return _anthropic
}

// ── Redis key schema ──────────────────────────────────────────────────────────

const BUILD_KEY = (buildId: string) => `build:${buildId}`
const BUILD_TTL = 60 * 60 * 4  // 4 hours

// ── Public types ──────────────────────────────────────────────────────────────

export type TaskStatus = 'pending' | 'running' | 'complete' | 'failed' | 'skipped'

export interface TaskProgress {
  id: string
  name: string
  type: BuildTaskType
  wave: number
  status: TaskStatus
  startedAt?: string
  completedAt?: string
  errorMessage?: string
  luauCode?: string
  assetId?: string
}

export interface BuildProgress {
  buildId: string
  planId: string
  status: 'running' | 'complete' | 'failed'
  progress: number
  currentWave: number
  completedTasks: number
  totalTasks: number
  tasks: TaskProgress[]
  startedAt: string
  completedAt?: string
}

// ── ID generator ──────────────────────────────────────────────────────────────

function generateBuildId(): string {
  return `build_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

// ── Progress persistence ──────────────────────────────────────────────────────

async function writeProgress(progress: BuildProgress): Promise<void> {
  await redis.set(BUILD_KEY(progress.buildId), JSON.stringify(progress), 'EX', BUILD_TTL)
}

async function readProgress(buildId: string): Promise<BuildProgress | null> {
  const raw = await redis.get(BUILD_KEY(buildId))
  if (!raw) return null
  try {
    return JSON.parse(raw) as BuildProgress
  } catch {
    return null
  }
}

// ── Task type system prompt fragments ────────────────────────────────────────

const TASK_SYSTEM_PROMPTS: Record<BuildTaskType, string> = {
  terrain: `You are a Roblox terrain generation expert. Generate complete, runnable Luau code using workspace.Terrain API.

REQUIRED TERRAIN LAYERS (build ALL of these, not just one flat fill):
1. BASE GROUND: Terrain:FillBlock for the main ground plane. Use Grass, Sand, or Snow depending on biome.
2. ELEVATION: Add hills using multiple Terrain:FillBall calls at varying heights (Y = 5-30 studs). Use 3-8 hills minimum for natural terrain.
3. PATHS/ROADS: Carve flat paths using Terrain:FillBlock with Concrete, Asphalt, or Cobblestone at ground level. Width: 8-12 studs for roads, 4-6 for paths.
4. WATER: If appropriate, add water bodies using Terrain:FillBlock with Enum.Material.Water. Set Y below ground level for natural look.
5. ROCK FORMATIONS: Add Terrain:FillBall with Rock or Slate material for boulders and cliffs. Vary sizes (8-20 stud radius).
6. EDGE BLENDING: Add transition zones between materials (e.g., Mud between Grass and Water).

SCALE REFERENCE: Character = 5 studs tall. A "small area" = 128x128 studs. A "medium map" = 256x256. "Large" = 512x512.
Always wrap in ChangeHistoryService. Include Lighting and Atmosphere setup matching the biome. Output ONLY the Luau code, no explanation.

IMPORTANT: If the RELEVANT ROBLOX DOCUMENTATION section below contains a BUILD TEMPLATE for a terrain or landscape scene, reference its coordinate patterns and material choices. Templates have verified geometry and scale.`,

  building: `You are a Roblox Studio architecture expert. Generate Luau code that constructs a DETAILED, realistic building — NOT a flat box with walls.

MANDATORY STRUCTURAL ELEMENTS (you MUST include ALL of these):
1. FOUNDATION: A slightly wider concrete/stone base (1-2 studs tall) extending 0.5-1 studs beyond walls. Every building sits on a foundation.
2. WALLS: 4 walls per floor using Parts. Wall thickness: 0.5-1 stud. Height per floor: 12 studs (to fit 5-stud characters with headroom).
3. FLOOR SLABS: Horizontal Part between each floor. Thickness: 0.5 studs. Slightly wider than walls for a ledge effect.
4. WINDOWS: Recessed glass panes (Transparency 0.5, Material Glass) with frames. Minimum 2 windows per wall per floor. Recess windows 0.3-0.5 studs into the wall. Add a window header (0.25 studs) and sill (0.2 studs, extends 0.3 studs outward).
5. DOOR: Front entrance — 4 stud wide x 7 stud tall opening. Include door frame (trim color) and door panel (WoodPlanks). ONE door minimum.
6. ROOF: NOT just a flat top. Use either:
   - Pitched roof: Two WedgeParts angled to form a peak, with 1-stud overhang past walls
   - Flat roof with parapet: 1.5-stud wall around the edge, slightly darker than main walls
7. CORNER DETAILS: Pilaster strips (0.5-0.8 stud wide vertical trim) at each corner, slightly different color than walls.
8. INTERIOR FLOOR: A Part inside at each floor level. Use WoodPlanks or Marble material.
9. LIGHTING: PointLight inside windows (Brightness 1, Range 12-16) for warm interior glow.

LOW-POLY WALL DETAIL (REQUIRED — this is what makes builds look real, not blocky):
10. BRICK/PANEL LINES: Add thin Parts (0.05 stud thick) on wall surfaces to simulate brick coursing or siding:
    - Horizontal mortar lines every ~1 stud up the wall (Size: wallWidth x 0.05 x 0.05, positioned 0.03 studs proud of wall surface)
    - Vertical lines in a staggered brick pattern (every other row offset by half a brick width)
    - For wooden buildings, use vertical board lines instead of brick pattern
11. WAINSCOTING: Lower 1/3 of each wall gets a slightly raised panel (0.08 studs thick) using WoodPlanks or SmoothPlastic in the trim color. Add a thin chair rail strip (0.12x0.12 stud) at the top of the wainscoting.
12. CROWN MOLDING: Thin trim strip (0.2x0.12 stud) running along the top of interior walls where wall meets ceiling.
13. BASEBOARDS: Thin trim strip (0.3x0.15 stud) running along the bottom of interior walls.
14. KEYSTONE: A decorative block (1.0x0.6x0.3) centered above the door frame.
15. SIGN/PLAQUE: A thin Part with SurfaceGui and TextLabel showing the building name, mounted above the door.

INTERIOR ROOMS (when the building has rooms):
16. DIVIDING WALLS: Interior walls (0.3 studs thick, slightly shorter than ceiling height) that split the floor into rooms. Leave doorway gaps (3.5 studs wide) in dividing walls. Each room should have its own floor material if types differ (e.g., kitchen = Marble, bedroom = WoodPlanks).
17. INTERIOR WALL DETAIL: Interior dividing walls also get baseboards and crown molding.

COLOR RULES: Use Color3.fromRGB with SPECIFIC values, not white/gray. Every building needs at minimum:
- Wall color (the main body)
- Trim color (darker shade of wall color, for frames/corners/ledges/brick lines)
- Roof color (distinct from walls)
- Accent color (doors, shutters, signs)
- Interior wall color (lighter/warmer than exterior)

SCALE: Doors 4x7 studs. Windows 2x2 studs. Ceiling height 12 studs. Wall thickness 0.5-1 stud. Character is 5 studs tall.

Group ALL parts in a named Model with organized Folders (Walls, Roof, Details, Lights, WallTexture, Interior). Anchor ALL parts. Wrap in ChangeHistoryService. Output ONLY the Luau code.

IMPORTANT: If the RELEVANT ROBLOX DOCUMENTATION section below contains a BUILD TEMPLATE with WORKING CODE for a similar object, USE IT as your reference. Copy the coordinate math, adapt the dimensions and colors to fit the request. These templates have been geometrically verified — parts don't float, walls connect at corners, furniture sits on floors. Do NOT ignore them and guess your own coordinates.`,

  prop: `You are a Roblox prop and environmental detail expert. Generate Luau code that creates DETAILED, recognizable props — NOT just colored boxes.

PROP CONSTRUCTION RULES:
1. Every prop is a Model containing MULTIPLE Parts arranged to form a recognizable shape.
2. A "table" is NOT one flat Part. It's a top slab + 4 leg Parts. A "chair" has a seat + backrest + 4 legs.
3. A "tree" is a brown cylinder trunk (2x6x2 studs) + 2-3 green sphere-shaped Parts (use SpecialMesh with MeshType Sphere) for the canopy at different heights.
4. A "lamp post" is a tall cylinder (1x12x1) + a horizontal arm Part + a sphere/cylinder light head + PointLight.
5. A "fence" is repeated post Parts (1x3x1) connected by rail Parts (0.3x0.3xSpan).
6. A "barrel" is a cylinder Part with SpecialMesh (MeshType Cylinder).
7. A "crate" is a Part with WoodPlanks material + darker trim Parts as bands.
8. A "bench" is a seat slab + backrest slab (angled slightly) + 2 side supports.
9. A "rock" is 2-3 Parts at slight random angles with Slate or Granite material, scaled irregularly (not perfect cubes).
10. A "sign" is a thin Part with SurfaceGui containing a TextLabel.

DETAIL MINIMUMS:
- Small props (barrel, crate, pot): minimum 3 Parts
- Medium props (bench, table, lamp): minimum 5 Parts
- Large props (tree, fountain, vehicle): minimum 8 Parts
- Interior furniture (bed, desk, shelf): minimum 6 Parts

LOW-POLY DETAIL TECHNIQUES (use these to make props look detailed, not blocky):
- Use SpecialMesh with MeshType Sphere/Cylinder/Wedge on Parts to get rounded shapes without high poly count
- Add thin trim Parts (0.1-0.2 studs) as edge details on furniture (table edge rim, shelf lip, drawer handles)
- Use Color3 variation: slightly different shade per sub-part (e.g., table top vs legs) to add visual depth
- Add SurfaceGui with TextLabel for signs, labels, book spines, screen displays
- Use Transparency (0.3-0.5) on glass/crystal/water props
- Add PointLight to lanterns, candles, screens, glowing objects
- Rotate Parts slightly with CFrame.Angles for organic-looking arrangements (not everything perfectly aligned)

INTERIOR FURNITURE EXAMPLES:
- BED: Headboard (WoodPlanks) + mattress (Fabric, slight color) + pillow (small white ball Part) + blanket (thin draped Part)
- SHELF: Back panel + 3-4 horizontal shelf slabs + side panels + small box/book Parts on shelves
- DESK: Top slab + 4 legs + drawer face Part (with small handle cylinder) + lamp prop on top
- KITCHEN COUNTER: Base cabinet (door front Parts) + countertop (Marble) + backsplash strip + sink basin (Part with dark interior)
- CHAIR: Seat + backrest (angled 5-10 degrees back) + 4 legs + optional armrests

Apply correct materials and specific Color3.fromRGB values. Group in named Models. Anchor static props. Output ONLY the Luau code.

IMPORTANT: If the RELEVANT ROBLOX DOCUMENTATION section below contains a BUILD TEMPLATE with WORKING CODE for a similar prop, USE IT as your starting point. These templates have verified geometry — correct Y positions, proper proportions, parts that actually connect. Adapt them to fit the specific request rather than guessing coordinates from scratch.`,

  npc: `You are a Roblox NPC creation expert. Generate complete Luau code that creates NPC characters.

NPC CONSTRUCTION (you MUST include):
1. BODY: Build an R6-style rig using Parts: Head (sphere mesh, 1.2x1.2x1.2), Torso (2x2x1), Left/Right Arms (1x2x1), Left/Right Legs (1x2x1). Use specific skin Color3 and clothing Color3 values.
2. FACE: Add a Decal to the Head front face with a face texture, or use SurfaceGui with emoji/text.
3. HUMANOID: Insert a Humanoid with DisplayName, Health, WalkSpeed, and a configured NameTag.
4. BEHAVIOR: Include at least ONE of: PathfindingService patrol between waypoints, idle animation (Animator + Animation), or ProximityPrompt dialog trigger.
5. ACCESSORIES: At least one visual detail — a hat (Part on head), weapon (Part in hand), or cape (Part behind torso).
6. COLLISION: Set HumanoidRootPart, use proper welds (WeldConstraint) between body parts.

NPC BEHAVIOR PATTERNS:

PATROL: Use PathfindingService to walk between 3-5 waypoint Parts. Wait 2-3 seconds at each point. Face movement direction. Play walk animation.

MERCHANT: Stand at fixed position. ProximityPrompt "Talk to [Name]". Opens shop RemoteEvent. Has dialog lines. Turns to face interacting player.

QUEST GIVER: ProximityPrompt with quest icon overhead (BillboardGui with "!"). Dialog tree with accept/decline. Tracks quest state per player. Changes icon to "?" when quest completable.

ENEMY: Follows nearest player within aggro range (30-50 studs). Attacks when in melee range (5 studs). Has health bar (BillboardGui). Drops loot on death. Respawns after 30 seconds.

AMBIENT: Randomly walks within a radius. Plays idle animations. Has ambient dialog lines overhead. Reacts to nearby players (waves, looks at them).

Output ONLY the Luau code.`,

  script: `You are a Roblox Luau scripting expert. Generate COMPLETE, PRODUCTION-QUALITY game system scripts.

SCRIPT ARCHITECTURE RULES:
1. Server scripts go in ServerScriptService. Client scripts go in StarterPlayerScripts.
2. ALWAYS use game:GetService() — never raw game.ServiceName access.
3. ALWAYS wrap DataStore calls in pcall() with retry logic.
4. Use RemoteEvent for one-way client→server and server→client communication.
5. Use RemoteFunction ONLY for request/response patterns (never for frequent updates).
6. NEVER trust client values — validate everything server-side.
7. Use task.spawn() for parallel operations, task.wait() instead of wait().
8. Use CollectionService tags for scalable entity systems.
9. Create leaderstats folder in player for visible stats.
10. Use BindableEvent for server-to-server module communication.

COMMON GAME SYSTEMS (generate COMPLETE implementations, not stubs):

CURRENCY/ECONOMY:
- DataStore saving/loading with pcall retry
- Leaderstats display (Coins, Gems, XP, Level)
- Earning on kill, collecting, completing objectives
- Server-authoritative — client can only REQUEST purchases

COMBAT:
- Humanoid.Health tracking, damage calculation
- Cooldown system (debounce per player per ability)
- Hit detection (raycasting or .Touched with magnitude check)
- Death/respawn handling with spawn protection
- Damage numbers (BillboardGui floating text)

ROUND SYSTEM:
- Intermission → countdown → teleport → game → results → loop
- Player tracking (alive/dead/spectating)
- Win condition checking
- Award winners, reset map

SHOP/PURCHASES:
- Shop GUI with items, prices, descriptions
- Server-side validation of purchases
- Inventory system (table or DataStore)
- Equip/unequip mechanics

NPC DIALOG:
- ProximityPrompt trigger
- Dialog tree with choices
- Quest assignment and tracking
- Reward granting on completion

DATA PERSISTENCE:
- ProfileService or raw DataStore pattern
- Save on leave (game:BindToClose + Players.PlayerRemoving)
- Auto-save every 5 minutes
- Data versioning for migrations

Output ONLY runnable Luau code. Include proper error handling. No placeholder comments like "-- TODO" or "-- implement later".`,

  ui: `You are a Roblox GUI expert. Generate Luau code that creates ScreenGui elements via Instance.new().

UI CONSTRUCTION RULES:
1. HIERARCHY: ScreenGui → Frame (main container) → child elements. Set ScreenGui.ResetOnSpawn = false.
2. MAIN FRAME: Use BackgroundColor3 with specific dark color (e.g., Color3.fromRGB(20,20,30)), add UICorner (CornerRadius 8px), UIStroke (Color: accent color, Thickness: 1-2).
3. HEADER: Top section with title TextLabel (Font: GothamBold, TextSize: 22-28, TextColor3: white or gold).
4. BUTTONS: Each button gets UICorner, UIStroke, hover color change via MouseEnter/MouseLeave. Size: UDim2.new(0, 180, 0, 45) minimum for clickability.
5. LAYOUT: Use UIListLayout or UIGridLayout for automatic spacing. Padding: UDim.new(0, 8-12).
6. ANIMATIONS: TweenService for show/hide. Slide in from edge or scale from 0 to 1. Duration: 0.3-0.5 seconds, EasingStyle: Quint, EasingDirection: Out.
7. CLOSE BUTTON: Top-right "X" button that tweens the GUI closed.
8. COLORS: Use a consistent palette. Gold accents: Color3.fromRGB(212,175,55). Dark backgrounds: Color3.fromRGB(20,20,30). Success green: Color3.fromRGB(0,180,80). Error red: Color3.fromRGB(220,50,50).

GAME UI PATTERNS:

HUD (Heads-Up Display):
- Top bar: coins icon + count, gems icon + count, level/XP bar
- Health bar (red/green gradient, smooth tween on damage)
- Mini-map frame (top-right corner)
- Action buttons (bottom-center, 44px+ touch targets)

SHOP GUI:
- Grid of item cards with icon, name, price, "Buy" button
- Scrolling frame with UIGridLayout
- Category tabs (Weapons, Armor, Items, Pets)
- Insufficient funds feedback (shake + red flash)
- Purchase confirmation popup

INVENTORY:
- Grid of owned items with drag-and-drop feel
- Equipment slots (head, torso, weapon, accessory)
- Item tooltip on hover (BillboardGui or Frame)
- Stack count for consumables

SETTINGS:
- Music volume slider
- SFX volume slider
- Graphics quality dropdown
- Sensitivity slider
- Keybind display

Parent to StarterGui. Output ONLY the Luau code.`,

  economy: `You are a Roblox economy system expert. Generate a complete, server-authoritative economy script. Never trust client values. Use DataStore for persistence. Include currency tracking, shop system, and leaderstat sync. Output ONLY the Luau code.`,

  lighting: `You are a Roblox lighting and atmosphere expert. Generate Luau code that configures game:GetService("Lighting").

REQUIRED SETTINGS (set ALL of these, not just a few):
1. Lighting: Ambient, OutdoorAmbient, Brightness, ShadowSoftness, ClockTime, GeographicLatitude, FogEnd, FogColor, EnvironmentDiffuseScale, EnvironmentSpecularScale
2. Atmosphere instance: Density (0.3-0.5), Offset (0-0.5), Color, Decay, Glare, Haze
3. Bloom instance: Intensity (0.3-0.8), Size (24-40), Threshold (0.8-1.2)
4. ColorCorrection instance: Brightness, Contrast, Saturation, TintColor
5. SunRaysEffect: Intensity (0.05-0.15), Spread (0.5-1)

Match all values to the game's mood/theme. Output ONLY the Luau code, no explanation.`,

  audio: `You are a Roblox audio/sound expert. Generate Luau code that inserts Sound objects into appropriate locations (SoundService for music, workspace Parts for spatial audio). Configure Volume, PlaybackSpeed, RollOffMaxDistance, RollOffMinDistance. Use real Roblox sound asset IDs where appropriate (e.g. 9125402735 for ambient wind). Add SoundGroup management. Output ONLY the Luau code.`,
}

// ── Luau validation — catches broken output before it hits Studio ────────────

interface LuauValidation {
  valid: boolean
  errors: string[]
}

function validateLuau(code: string): LuauValidation {
  const errors: string[] = []

  // Must contain actual code, not just comments
  const codeLines = code.split('\n').filter(l => l.trim() && !l.trim().startsWith('--'))
  if (codeLines.length < 3) {
    errors.push('Code is too short — fewer than 3 non-comment lines')
  }

  // Check balanced blocks (if/then/end, do/end, function/end)
  const openers = (code.match(/\b(function|if|do|for|while)\b/g) || []).length
  const ends = (code.match(/\bend\b/g) || []).length
  if (Math.abs(openers - ends) > 1) {
    errors.push(`Unbalanced blocks: ${openers} openers vs ${ends} 'end' statements`)
  }

  // Check for JavaScript/Python leaking in (common LLM mistake)
  if (/\bconst\s+\w+\s*=/.test(code)) errors.push('Contains JavaScript "const" — not valid Luau')
  if (/\blet\s+\w+\s*=/.test(code)) errors.push('Contains JavaScript "let" — not valid Luau')
  if (/\bvar\s+\w+\s*=/.test(code)) errors.push('Contains JavaScript "var" — not valid Luau')
  if (/\bdef\s+\w+\s*\(/.test(code)) errors.push('Contains Python "def" — not valid Luau')
  if (/\bimport\s+/.test(code)) errors.push('Contains "import" statement — not valid Luau')
  if (/\bconsole\.log\b/.test(code)) errors.push('Contains "console.log" — use print() in Luau')
  if (/===/.test(code)) errors.push('Contains "===" — Luau uses "=="')
  if (/!==/.test(code)) errors.push('Contains "!==" — Luau uses "~="')
  if (/!=/.test(code) && !/~=/.test(code)) errors.push('Contains "!=" — Luau uses "~="')

  // Must use game:GetService() not game.ServiceName for services
  const directServiceAccess = code.match(/game\.(Workspace|Lighting|ReplicatedStorage|ServerScriptService|StarterGui|Players|SoundService)\b/g)
  if (directServiceAccess && directServiceAccess.length > 0) {
    errors.push(`Use game:GetService() instead of direct access: ${directServiceAccess[0]}`)
  }

  // Check for deprecated Roblox APIs
  if (/\bwait\s*\(/.test(code) && !/task\.wait/.test(code)) {
    errors.push('Uses deprecated wait() — use task.wait()')
  }
  if (/\bspawn\s*\(/.test(code) && !/task\.spawn/.test(code)) {
    errors.push('Uses deprecated spawn() — use task.spawn()')
  }
  if (/\bdelay\s*\(/.test(code) && !/task\.delay/.test(code)) {
    errors.push('Uses deprecated delay() — use task.delay()')
  }

  return { valid: errors.length === 0, errors }
}

// ── Luau code generator for a single task ────────────────────────────────────

async function generateLuauForTask(task: BuildTask): Promise<string> {
  // Check if the task has templateParams that match a known template
  const params = task.templateParams
  if (params) {
    const templateName = params['template'] as string | undefined

    if (templateName === 'economy_system' && params['currencies']) {
      return economySystem({
        currencies: params['currencies'] as string[],
        startingCash: (params['startingCash'] as number) ?? 100,
        shopItems: params['shopItems'] as { name: string; price: number }[] | undefined,
      })
    }
    if (templateName === 'tycoon_dropper') {
      return tycoonDropper({
        resourceName: (params['resourceName'] as string) ?? 'Resource',
        value: (params['value'] as number) ?? 10,
        interval: (params['interval'] as number) ?? 5,
        currency: params['currency'] as string | undefined,
      })
    }
    if (templateName === 'leaderboard') {
      return leaderboardProgression({
        stats: (params['stats'] as { name: string; startValue: number; isXP?: boolean }[]) ?? [
          { name: 'Cash', startValue: 0 },
        ],
        xpToLevelCurve: params['xpToLevelCurve'] as 'linear' | 'quadratic' | 'exponential' | undefined,
        maxLevel: params['maxLevel'] as number | undefined,
      })
    }
    if (templateName === 'basic_combat') {
      return basicCombat({
        clickDamage: (params['clickDamage'] as number) ?? 25,
        attackRange: (params['attackRange'] as number) ?? 15,
        attackCooldown: (params['attackCooldown'] as number) ?? 0.5,
        enemyTag: params['enemyTag'] as string | undefined,
      })
    }
    if (templateName === 'inventory') {
      return inventorySystem({
        maxSlots: (params['maxSlots'] as number) ?? 20,
        categories: (params['categories'] as string[]) ?? ['Weapon', 'Tool', 'Consumable'],
        stackable: params['stackable'] as boolean | undefined,
      })
    }
    if (templateName === 'day_night_cycle') {
      return dayNightCycle({
        cycleDurationMinutes: (params['cycleDurationMinutes'] as number) ?? 15,
        sunriseHour: params['sunriseHour'] as number | undefined,
        sunsetHour: params['sunsetHour'] as number | undefined,
      })
    }
    if (templateName === 'spawn_system') {
      return spawnSystem({
        spawnPoints: (params['spawnPoints'] as number) ?? 4,
        respawnDelay: (params['respawnDelay'] as number) ?? 5,
        teamBased: params['teamBased'] as boolean | undefined,
      })
    }
    if (templateName === 'obby_checkpoints') {
      return obbyCheckpoints({
        totalCheckpoints: (params['totalCheckpoints'] as number) ?? 10,
        completionReward: params['completionReward'] as { currency: string; amount: number } | undefined,
      })
    }
    if (templateName === 'pet_follow') {
      return petFollowSystem({
        petName: (params['petName'] as string) ?? 'Buddy',
        followSpeed: (params['followSpeed'] as number) ?? 8,
        followDistance: (params['followDistance'] as number) ?? 5,
        petModelId: params['petModelId'] as string | undefined,
        bonusMultiplier: params['bonusMultiplier'] as number | undefined,
      })
    }
    if (templateName === 'npc_dialog') {
      return npcDialogSystem({
        npcName: (params['npcName'] as string) ?? 'Guide',
        dialogLines: (params['dialogLines'] as string[]) ?? ['Welcome, adventurer!'],
        questName: params['questName'] as string | undefined,
        questRewardCurrency: params['questRewardCurrency'] as string | undefined,
        questRewardAmount: params['questRewardAmount'] as number | undefined,
      })
    }
    if (templateName === 'professional_building') {
      return professionalBuilding({
        name: (params['name'] as string) ?? task.name,
        type: (params['buildingType'] as 'shop' | 'house' | 'office' | 'warehouse' | 'apartment' | 'restaurant' | 'bank') ?? 'house',
        floors: (params['floors'] as number) ?? 1,
        width: (params['width'] as number) ?? 20,
        depth: (params['depth'] as number) ?? 16,
        style: (params['style'] as 'modern' | 'victorian' | 'industrial' | 'medieval' | 'futuristic') ?? 'modern',
        withInterior: (params['withInterior'] as boolean) ?? true,
        withLighting: (params['withLighting'] as boolean) ?? true,
        withVegetation: (params['withVegetation'] as boolean) ?? true,
        roomsPerFloor: (params['roomsPerFloor'] as number) ?? 0,
        withWallDetail: (params['withWallDetail'] as boolean) ?? true,
      })
    }
    if (templateName === 'vehicle_system') {
      return vehicleSystem({
        vehicleName: (params['vehicleName'] as string) ?? 'Car',
        speed: (params['speed'] as number) ?? 50,
        turnSpeed: (params['turnSpeed'] as number) ?? 2,
        seatCount: (params['seatCount'] as number) ?? 1,
      })
    }
    if (templateName === 'trading_system') {
      return tradingSystem({
        tradingEnabled: (params['tradingEnabled'] as boolean) ?? true,
        maxTradeSlots: (params['maxTradeSlots'] as number) ?? 6,
        tradeRange: (params['tradeRange'] as number) ?? 15,
      })
    }
    if (templateName === 'daily_rewards') {
      return dailyRewardsSystem({
        rewards: (params['rewards'] as Array<{ day: number; currency: string; amount: number }>) ?? [
          { day: 1, currency: 'Cash', amount: 100 },
          { day: 2, currency: 'Cash', amount: 200 },
          { day: 3, currency: 'Cash', amount: 350 },
          { day: 4, currency: 'Cash', amount: 500 },
          { day: 5, currency: 'Cash', amount: 750 },
          { day: 6, currency: 'Cash', amount: 1000 },
          { day: 7, currency: 'Cash', amount: 2000 },
        ],
        resetHours: (params['resetHours'] as number) ?? 24,
      })
    }
    if (templateName === 'particle_effect') {
      return particleEffectSystem({
        effectName: (params['effectName'] as string) ?? 'Effect',
        type: (params['type'] as 'fire' | 'smoke' | 'sparkle' | 'rain' | 'snow' | 'magic') ?? 'magic',
        duration: (params['duration'] as number) ?? 10,
        attachTo: (params['attachTo'] as string) ?? 'Workspace',
      })
    }
    if (templateName === 'weather_system') {
      return weatherSystem({
        weatherType: (params['weatherType'] as 'rain' | 'snow' | 'fog' | 'storm' | 'clear') ?? 'rain',
        transitionTime: (params['transitionTime'] as number) ?? 5,
        intensity: (params['intensity'] as number) ?? 0.7,
      })
    }
    if (templateName === 'animation_system') {
      return animationSystem({
        animationName: (params['animationName'] as string) ?? 'Dance',
        animId: (params['animId'] as string) ?? 'rbxassetid://507771019',
        speed: (params['speed'] as number) ?? 1,
        looping: (params['looping'] as boolean) ?? true,
        priority: (params['priority'] as 'Idle' | 'Movement' | 'Action') ?? 'Action',
      })
    }
  }

  // Fall through to AI generation — Gemini primary, Groq fallback
  // ── Chunked build support: if the task has a parentName, inject instructions
  // to parent all parts under a shared root Model so chunks assemble correctly.
  let chunkParentInstructions = ''
  if (params) {
    const parentName = params['parentName'] as string | undefined
    const chunkIndex = params['chunkIndex'] as number | undefined
    if (parentName) {
      chunkParentInstructions = `

CHUNKED BUILD — PARENT MODEL INSTRUCTIONS:
This task is chunk ${chunkIndex ?? 0} of a larger build called "${parentName}".
- At the TOP of your code, find or create a root Model named "${parentName}" in workspace:
    local rootModel = workspace:FindFirstChild("${parentName}")
    if not rootModel then
        rootModel = Instance.new("Model")
        rootModel.Name = "${parentName}"
        rootModel.Parent = workspace
    end
- Create a sub-Model for THIS chunk (e.g., "${parentName}_chunk${chunkIndex ?? 0}") and parent it to rootModel.
- ALL parts you create in this task go inside that sub-Model, NOT directly in workspace.
- This ensures all chunks of the build end up organized under one parent Model in Studio.`
    }
  }

  const systemPrompt = TASK_SYSTEM_PROMPTS[task.type] + chunkParentInstructions +
    `\n\nCRITICAL RULES:
- Output ONLY valid Luau code. No JavaScript, no Python, no TypeScript.
- Use game:GetService("ServiceName") not game.ServiceName
- Use task.wait() not wait(), task.spawn() not spawn(), task.delay() not delay()
- Use ~= for not-equal, not != or !==
- Use == for equality, not ===
- Every if needs then/end, every function needs end, every for/while needs do/end
- Use local for variable declarations
- Wrap DataStore calls in pcall()
- Do NOT include markdown fences or explanations — raw Luau only`

  const MAX_RETRIES = 2
  let lastCode = ''
  let lastErrors: string[] = []

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const messages: { role: 'user' | 'assistant'; content: string }[] = []

    if (attempt === 0) {
      messages.push({ role: 'user', content: task.prompt })
    } else {
      // Retry with error feedback
      messages.push({ role: 'user', content: task.prompt })
      messages.push({ role: 'assistant', content: lastCode })
      messages.push({
        role: 'user',
        content: `The code above has these errors — fix them and output the COMPLETE corrected Luau code:\n${lastErrors.map(e => `- ${e}`).join('\n')}`,
      })
    }

    const text = await callAI(systemPrompt, messages, {
      maxTokens: 32768,
      codeMode: true,
      useRAG: true,
      // Include 'service' + 'dev' + 'blender' alongside the task-specific
      // hint so the executor can pull from the full ingested tutorial
      // library — patterns, services, asset workflows, design wisdom.
      ragCategories: [task.type, 'api', 'luau', 'service', 'building', 'pattern', 'dev', 'blender'],
    })

    // Strip any accidental markdown fences
    const cleaned = text
      .replace(/^```(?:lua|luau)?\n?/m, '')
      .replace(/\n?```$/m, '')
      .trim()

    // Layer 1: Static analysis auto-fix (instant, no AI cost)
    // Catches deprecated APIs, JS/Python syntax, direct service access — and fixes them
    const staticResult = analyzeLuau(cleaned)
    const autoFixed = staticResult.fixedCode ?? cleaned

    if (staticResult.issues.length > 0) {
      const errorCount = staticResult.issues.filter(i => i.severity === 'error').length
      const warnCount = staticResult.issues.filter(i => i.severity === 'warning').length
      console.log(`[build-executor] Task ${task.id} static analysis: ${errorCount} errors, ${warnCount} warnings auto-fixed (score: ${staticResult.score}/100)`)
    }

    // Layer 2: Build quality validation (materials, placement, part count)
    const buildVal = validateBuild(autoFixed)
    let qualityFixed = autoFixed
    if (buildVal.fixedCode) {
      qualityFixed = buildVal.fixedCode
      console.log(`[build-executor] Task ${task.id} build validator: score ${buildVal.score}/100, ${buildVal.issues.filter(i => i.autoFixed).length} auto-fixed`)
    }

    // Layer 3: Structural validation (balanced blocks, remaining unfixable issues)
    const validation = validateLuau(qualityFixed)
    if (validation.valid || attempt === MAX_RETRIES) {
      if (!validation.valid) {
        console.warn(`[build-executor] Task ${task.id} has validation warnings after ${MAX_RETRIES} retries:`, validation.errors)
      }
      if (buildVal.retryPrompt && attempt < MAX_RETRIES) {
        // Build validator found unfixable issues — retry with fix instructions
        console.log(`[build-executor] Task ${task.id} build validator requesting retry: ${buildVal.retryPrompt.slice(0, 100)}...`)
        lastCode = qualityFixed
        lastErrors = [...validation.errors, ...buildVal.issues.filter(i => !i.autoFixed && i.severity === 'error').map(i => i.message)]
        continue
      }
      return `-- Generated by Forje AI (forjegames.com)\n${qualityFixed}`
    }

    console.log(`[build-executor] Task ${task.id} attempt ${attempt + 1} failed validation:`, validation.errors)
    lastCode = autoFixed
    lastErrors = validation.errors
  }

  // Unreachable but TypeScript needs it
  return `-- Generated by Forje AI (forjegames.com)\n${lastCode}`
}

// ── Studio command push ───────────────────────────────────────────────────────

/**
 * Queue a Luau execute command for the Studio session.
 *
 * Returns a Promise so the caller can `await` it — previously this was
 * fire-and-forget (`pushToStudio(...)` returned void, the promise chain
 * was orphaned), which meant on Vercel serverless the lambda could exit
 * mid-queue and the command would silently drop. Awaiting the returned
 * promise from inside `executeTask` (which runs under `Promise.allSettled`
 * in `executeWave`) keeps the lambda alive until every push completes.
 */
async function pushToStudio(sessionId: string, taskId: string, luauCode: string): Promise<void> {
  try {
    const result = await queueCommand(sessionId, {
      type: 'execute_luau',
      data: {
        source: luauCode,
        taskId,
        origin: 'build_executor',
      },
    })
    if (!result.ok) {
      console.warn(`[build-executor] Failed to push task ${taskId} to Studio: ${result.error}`)
    }
  } catch (err: unknown) {
    console.warn(`[build-executor] queueCommand threw for task ${taskId}:`, err)
  }
}

// ── Single task executor ──────────────────────────────────────────────────────

async function executeTask(
  task: BuildTask,
  userId: string,
  sessionId: string,
  progress: BuildProgress,
): Promise<void> {
  // Mark running
  const taskProgress = progress.tasks.find((t) => t.id === task.id)
  if (!taskProgress) return
  taskProgress.status = 'running'
  taskProgress.startedAt = new Date().toISOString()
  await writeProgress(progress)

  try {
    if (task.type === 'building' || task.type === 'prop') {
      // 3D mesh tasks — start the async mesh pipeline then push a placeholder
      const pipelineResult = await startMeshPipeline({
        userId,
        prompt: task.prompt,
        type: task.type === 'building' ? 'building' : 'prop',
        style: 'roblox',
        polyTarget: task.type === 'building' ? 8000 : 3000,
        textured: true,
        tokensCost: task.estimatedTokens,
      })

      taskProgress.assetId = pipelineResult.assetId
      taskProgress.status = 'complete'
      taskProgress.completedAt = new Date().toISOString()
    } else {
      // Script/terrain/ui/economy/npc/lighting/audio — generate Luau directly
      const luauCode = await generateLuauForTask(task)

      // Deduct tokens for this task
      await spendTokens(userId, task.estimatedTokens, `Build task: ${task.name}`, {
        buildId: progress.buildId,
        taskId: task.id,
        taskType: task.type,
      }).catch((err) => {
        console.warn(`[build-executor] Token spend failed for task ${task.id}:`, err)
      })

      // Push to Studio if session is connected. Awaited so Vercel keeps
      // the lambda alive until the command is actually enqueued.
      if (sessionId && luauCode.length > 0) {
        await pushToStudio(sessionId, task.id, luauCode)
      }

      taskProgress.luauCode = luauCode
      taskProgress.status = 'complete'
      taskProgress.completedAt = new Date().toISOString()
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[build-executor] Task ${task.id} failed: ${message}`)
    taskProgress.status = 'failed'
    taskProgress.errorMessage = message
    taskProgress.completedAt = new Date().toISOString()
  }

  await writeProgress(progress)
}

// ── Wave executor ─────────────────────────────────────────────────────────────

async function executeWave(
  wave: number,
  tasks: BuildTask[],
  userId: string,
  sessionId: string,
  progress: BuildProgress,
): Promise<void> {
  const waveTasks = tasks.filter((t) => t.wave === wave)
  if (waveTasks.length === 0) return

  progress.currentWave = wave
  await writeProgress(progress)

  // Run all tasks in this wave concurrently
  await Promise.allSettled(
    waveTasks.map((task) => executeTask(task, userId, sessionId, progress))
  )

  // Count completions
  progress.completedTasks = progress.tasks.filter(
    (t) => t.status === 'complete' || t.status === 'failed' || t.status === 'skipped'
  ).length
  progress.progress = Math.round((progress.completedTasks / progress.totalTasks) * 100)
  await writeProgress(progress)
}

// ── Main executor ─────────────────────────────────────────────────────────────

/**
 * Prepares a BuildPlan for execution: writes the initial progress record
 * and returns a `buildId` plus a `runInBackground` thunk. The caller route
 * should hand `runInBackground()` to `after()` from `next/server` so the
 * Vercel lambda keeps executing the wave loop after the HTTP response has
 * been sent. Callers on long-running hosts can `await` the thunk directly.
 *
 * Splitting the thunk from the caller keeps the Redis-backed progress
 * contract unchanged (client still polls `/api/ai/build/status?buildId=...`).
 */
export async function executeBuildPlan(
  plan: BuildPlan,
  userId: string,
  sessionId: string,
): Promise<{ buildId: string; runInBackground: () => Promise<void> }> {
  const buildId = generateBuildId()

  const initialProgress: BuildProgress = {
    buildId,
    planId: plan.id,
    status: 'running',
    progress: 0,
    currentWave: 0,
    completedTasks: 0,
    totalTasks: plan.tasks.length,
    startedAt: new Date().toISOString(),
    tasks: plan.tasks.map((t) => ({
      id: t.id,
      name: t.name,
      type: t.type,
      wave: t.wave,
      status: 'pending' as TaskStatus,
    })),
  }

  await writeProgress(initialProgress)

  const runInBackground = async (): Promise<void> => {
    try {
      for (let wave = 0; wave <= plan.totalWaves - 1; wave++) {
        const progress = await readProgress(buildId)
        if (!progress) break
        await executeWave(wave, plan.tasks, userId, sessionId, progress)
      }

      const finalProgress = await readProgress(buildId)
      if (finalProgress) {
        // 'failed' if ANY task failed (not just all tasks) — partial failure
        // should not be reported as 'complete' to the client.
        const anyFailed = finalProgress.tasks.some((t) => t.status === 'failed')
        finalProgress.status = anyFailed ? 'failed' : 'complete'
        finalProgress.completedAt = new Date().toISOString()
        finalProgress.progress = 100
        await writeProgress(finalProgress)
      }
    } catch (err) {
      const progress = await readProgress(buildId)
      if (progress) {
        progress.status = 'failed'
        progress.completedAt = new Date().toISOString()
        await writeProgress(progress)
      }
      console.error(`[build-executor] Build ${buildId} crashed:`, err)
    }
  }

  return { buildId, runInBackground }
}

// ── Status poller ─────────────────────────────────────────────────────────────

/**
 * Fetch the current execution status of a build by ID.
 * Safe to call at any frequency — reads from Redis.
 */
export async function getBuildProgress(buildId: string): Promise<BuildProgress | null> {
  return readProgress(buildId)
}

// ── Plan storage (pre-execution approval flow) ────────────────────────────────

const PLAN_KEY = (planId: string) => `plan:${planId}`
const PLAN_TTL = 60 * 30  // 30 minutes to approve

export async function storePlan(plan: BuildPlan): Promise<void> {
  await redis.set(PLAN_KEY(plan.id), JSON.stringify(plan), 'EX', PLAN_TTL)
}

export async function retrievePlan(planId: string): Promise<BuildPlan | null> {
  const raw = await redis.get(PLAN_KEY(planId))
  if (!raw) return null
  try {
    return JSON.parse(raw) as BuildPlan
  } catch {
    return null
  }
}
