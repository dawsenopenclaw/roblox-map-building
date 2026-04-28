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
import { getKnowledgeForTaskType } from './deep-game-knowledge'
import { analyzeLuau, autoFixLuau } from './static-analysis'
import { validateBuild } from './build-validator'
import { redis } from '@/lib/redis'
import { queueCommand } from '@/lib/studio-session'
import { startMeshPipeline } from '@/lib/pipeline/mesh-pipeline'
import { spendTokens } from '@/lib/tokens-server'
import { serverEnv } from '@/lib/env'
import type { BuildPlan, BuildTask, BuildTaskType } from './build-planner'
import { DEEP_BUILDING_KNOWLEDGE } from './deep-building-knowledge'
import { BUILDING_BIBLE } from './building-bible'
import { extractModifiers, modifiersToInstructions } from './prompt-modifiers'
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
import { getSystemDesignsForTaskType, getDataArchitecture, getClientServerPatterns, getUIPatterns, getEffectRecipes, getPerformanceBible } from './scripting-bible'
import { selectRelevantKnowledge } from './knowledge-selector'
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
  terrain: `You are a Roblox terrain generation expert creating IMMERSIVE, natural-looking landscapes. Generate complete, runnable Luau code using workspace.Terrain API.

REQUIRED TERRAIN LAYERS (build ALL of these — a flat grass plane = FAILURE):
1. BASE GROUND: Multiple FillBlock calls with the primary ground material. NOT one giant fill — use 4-6 overlapping fills at slightly different heights for natural variation.
2. ELEVATION: 8-15 hills using FillBall at varying positions and sizes (radius 10-40 studs, Y heights 5-40 studs). Cluster 2-3 hills together for mountain ranges. Leave valleys between groups.
3. PATHS/ROADS: Main road (10-stud wide, Asphalt) + branching side paths (5-stud wide, Cobblestone). Roads should curve — use multiple short FillBlock segments at slight angles, not one straight line.
4. WATER: At least one water feature — river (long narrow FillBlock at Y=-3), lake (large FillBlock at Y=-5), pond (FillBall at Y=-2). Add Mud terrain at water edges for natural shoreline.
5. ROCK FORMATIONS: 6-10 FillBall calls with Rock/Slate/Basalt at various sizes. Cluster 2-3 together for cliff faces. Add small boulders (radius 3-5) scattered randomly.
6. EDGE BLENDING: Mud between Grass and Water. Sand at beach areas. LeafyGrass patches in forests. Ground transitions should be gradual (overlapping fills).
7. DECORATIVE TERRAIN: Snow on hilltops if mountainous. Sand dunes if desert. Glacier ice for frozen areas. Mix 3-4 terrain materials minimum.

SCALE: Character = 5 studs tall. "Small" = 200x200. "Medium" = 400x400. "Large" = 600x600. "Massive" = 1000x1000.

ATMOSPHERE (generate these ALONGSIDE terrain):
- Lighting.ClockTime matching biome (dawn=6, day=14, sunset=17.5, night=0)
- Atmosphere instance (Density 0.3-0.5, Offset 0.2, appropriate Color)
- Bloom (Intensity 0.5, Size 30, Threshold 0.9)
- ColorCorrection (TintColor matching mood, Contrast 0.1, Saturation 0.1)
- SunRays if daytime (Intensity 0.1, Spread 0.3)
- FogEnd based on scale (200 for small, 500 for large)

PART-BASED ENVIRONMENT DETAILS (add these as Parts, not terrain):
- 5-10 rock props (irregular Parts with Slate/Granite material) scattered across the landscape
- 3-6 trees if forested (cylinder trunk + sphere canopy Parts)
- Pathway markers (small stone Posts along paths)
- Water edge details (lily pad Parts on ponds, driftwood on shores)

Always wrap in ChangeHistoryService. Output ONLY the Luau code, no explanation.`,

  building: `You are a Roblox Studio architecture expert creating COMPETITION-QUALITY showcase builds. Generate Luau code that constructs a HYPER-DETAILED building that looks like a professional Roblox front-page game — NOT a blocky beginner build.

THE #1 RULE: NO FLAT SURFACES. Every wall, roof, and floor must have surface detail. A plain flat wall = FAILURE.

MANDATORY STRUCTURAL ELEMENTS:
1. FOUNDATION: 2-3 layer stepped foundation. Bottom layer: Concrete (widest). Middle layer: Brick (slightly narrower). Top layer: decorative trim strip. Total height: 2-3 studs. Extends 1-2 studs beyond walls on all sides.
2. WALLS: Multi-layer walls. Outer shell (0.5 stud) + inner layer (0.3 stud) with a thin air gap or different color between them. Height per floor: 12 studs.
3. FLOOR SLABS: Between each floor, add a visible ledge/band that protrudes 0.5 studs outward with a trim strip underneath (corbel effect).
4. WINDOWS: Each window is 5+ parts: outer frame (trim color), inner frame (accent), glass pane (Transparency 0.5), sill (extends outward 0.4 studs), header/lintel above. Add shutters (thin angled Parts flanking the window) on residential buildings. MINIMUM 3 windows per wall per floor.
5. DOOR: 8+ part door assembly: frame (3 parts — two sides + header), door panel with panel detail lines, threshold step, door handle (small cylinder), transom window above (glass strip), and a porch overhang above the door.
6. ROOF: Complex multi-part roof:
   - Pitched: 4+ WedgeParts for main slopes + ridge cap strip along peak + fascia boards along edges + soffit under overhang + gutter strip at bottom edge + chimney (if residential)
   - Flat: parapet wall + coping cap on top of parapet + drainage scuppers + rooftop details (AC unit box, pipes, antenna)
7. CORNER QUOINS: Alternating-size blocks stacked vertically at each corner (6-8 blocks per corner), slightly protruding, alternating between wide and narrow to simulate dressed stone.
8. WINDOW BOXES: Under at least 2 windows, add flower box (thin Part with green small Parts as plants).
9. DOWNSPOUTS: Vertical thin cylinders (0.15 stud diameter) running from gutter to foundation at 2+ corners.
10. AWNINGS: Over doors/shop windows, add angled fabric-material Part (slight transparency, bright color).

WALL SURFACE DETAIL (CRITICAL — this eliminates the blocky look):
11. HORIZONTAL BANDS: Every 3-4 studs up the wall, add a thin protruding strip (0.08 stud thick, 0.3 stud tall) that runs the full wall width. These break up flat surfaces visually.
12. BRICK COURSING: Use a FOR loop to place thin horizontal lines every 0.8 studs up the wall. Each line: Size(wallWidth, 0.04, 0.04), positioned 0.02 studs proud of surface. Use slightly darker shade than wall.
13. VERTICAL PILASTERS: Every 6-8 studs along the wall, add a vertical strip (0.3 wide x 0.15 deep x full height) as a column/pilaster.
14. WAINSCOTING: Lower 3 studs of exterior walls get a different material/color panel with a chair rail strip at the top.
15. ARCH DETAILS: Above windows and doors, add a thin curved decorative element (use a WedgePart or angled Parts to simulate an arch).

INTERIOR (REQUIRED for every building — players will go inside):
16. ROOMS: 2-4 rooms per floor with 0.3-stud dividing walls. Each room has: floor (distinct material per room), baseboards (0.2 stud strip at wall base), crown molding (0.15 stud strip at ceiling), at least 2 pieces of furniture.
17. FURNITURE PER ROOM TYPE:
    - Living room: Couch (6 parts), coffee table (5 parts), bookshelf (8 parts), rug (flat Part), lamp (4 parts with PointLight)
    - Kitchen: Counter (5 parts), stove (4 parts), fridge (3 parts), sink (3 parts), overhead cabinets (4 parts)
    - Bedroom: Bed (7 parts), nightstand (4 parts), dresser (5 parts), closet door (2 parts), lamp
    - Bathroom: Toilet (4 parts), sink (3 parts), mirror (2 parts), bathtub (5 parts)
    - Office: Desk (6 parts), chair (5 parts), monitor (3 parts), bookshelf (8 parts)
18. STAIRS: If multi-story, add a staircase — 8-12 step Parts with railing (vertical balusters + horizontal rail).
19. CEILING LIGHTS: Each room gets a ceiling-mounted light (fixture Part + PointLight, Brightness 1.2, Range 16, warm white color).

EXTERIOR SURROUNDINGS (add life around the building):
20. PATHWAY: Stone/concrete path from door to edge of build area (4-6 stud wide, Cobblestone material).
21. LANDSCAPING: 2-4 small bushes (green sphere meshes) flanking the entrance + 1-2 trees nearby.
22. FENCE/WALL: Low wall or fence (3 studs tall) around the property with a gate at the path.
23. OUTDOOR PROPS: Mailbox, bench, trash can, lamp post — at least 2 props outside.
24. GROUND PLANE: Grass-colored Part underneath the building extending 20+ studs in each direction.

COLOR PALETTE (minimum 8 distinct colors):
- Wall primary, Wall secondary (slightly different shade for detail bands)
- Trim/frame color (darker than walls)
- Roof color (distinct)
- Door color (accent — bold)
- Interior wall color (warmer/lighter)
- Floor colors (2+ different for different rooms)
- Foundation color (gray/stone tones)

LIGHTING:
- Exterior: PointLights in all windows (warm color, Brightness 1.5, Range 16)
- Interior: PointLight per room (Brightness 1.2, Range 14)
- Entrance: SpotLight above door (Brightness 2, Angle 60, Range 20)
- Path: If lamp post exists, PointLight (Brightness 1, Range 12)

SCALE: Doors 4x7 studs. Windows 3x4 studs. Ceiling height 12 studs. Wall thickness 0.5-1 stud. Character is 5 studs tall.

CRITICAL — 3D POSITIONING MATH (this is what prevents z-fighting and makes builds look real):

Parts are positioned at their CENTER. A wall at X=10 with Size.X=0.5 occupies X=9.75 to X=10.25.
To place something ON a wall's outer surface, you must offset by HALF the wall thickness + HALF the new part's thickness.

WINDOW ASSEMBLY (5+ parts, positioned relative to the wall they're in):
  Given: wallX, wallY, wallZ, wallThickness (0.5), wallHeight (12)
  -- Cut a hole conceptually, then fill it with window parts:
  local windowY = wallY + 2  -- 2 studs above floor level
  local outerSurface = wallX + wallThickness/2  -- outer face of wall
  -- Frame (sits PROUD of wall surface, 0.1 studs out):
  P(m,"WinFrame", Vector3.new(0.15, 4.5, 3.5), CFrame.new(outerSurface + 0.075, windowY, wallZ), trimColor, "Metal")
  -- Glass (recessed 0.1 studs INTO the frame):
  local glass = P(m,"WinGlass", Vector3.new(0.05, 4, 3), CFrame.new(outerSurface - 0.05, windowY, wallZ), Color3.fromRGB(180,210,235), "Glass")
  glass.Transparency = 0.5
  -- Sill (extends OUTWARD 0.4 studs from wall):
  P(m,"WinSill", Vector3.new(0.4, 0.15, 3.8), CFrame.new(outerSurface + 0.2, windowY - 2.1, wallZ), trimColor, "Concrete")
  -- Lintel/header (extends OUTWARD 0.2 studs):
  P(m,"WinLintel", Vector3.new(0.25, 0.3, 3.8), CFrame.new(outerSurface + 0.125, windowY + 2.3, wallZ), trimColor, "Concrete")

DOOR ASSEMBLY (8+ parts):
  local outerSurface = wallX + wallThickness/2
  -- Door frame left post (proud of wall 0.08 studs):
  P(m,"DoorFrameL", Vector3.new(0.12, 7, 0.5), CFrame.new(outerSurface + 0.06, wallY - wallHeight/2 + 3.5, doorZ - 2.25), trimColor, "Wood")
  -- Door frame right post:
  P(m,"DoorFrameR", Vector3.new(0.12, 7, 0.5), CFrame.new(outerSurface + 0.06, wallY - wallHeight/2 + 3.5, doorZ + 2.25), trimColor, "Wood")
  -- Door frame header:
  P(m,"DoorHeader", Vector3.new(0.12, 0.5, 5), CFrame.new(outerSurface + 0.06, wallY - wallHeight/2 + 7.25, doorZ), trimColor, "Wood")
  -- Door panel (recessed 0.05 studs from frame):
  P(m,"DoorPanel", Vector3.new(0.08, 6.8, 4), CFrame.new(outerSurface - 0.02, wallY - wallHeight/2 + 3.4, doorZ), accentColor, "WoodPlanks")
  -- Door handle (0.15 studs proud):
  P(m,"Handle", Vector3.new(0.15, 0.15, 0.5), CFrame.new(outerSurface + 0.15, wallY - wallHeight/2 + 3.5, doorZ + 1.5), Color3.fromRGB(180,160,60), "Metal")

ROOF WITH OVERHANG (the roof MUST extend past walls):
  -- Roof panels overhang walls by 1.5 studs on each side:
  local roofWidth = buildingWidth + 3  -- 1.5 stud overhang each side
  local roofDepth = buildingDepth + 2  -- 1 stud overhang front and back
  -- Fascia board (hangs vertically at the edge of the overhang):
  P(m,"Fascia", Vector3.new(roofWidth, 0.4, 0.15), CFrame.new(cx, roofY - 0.2, cz + roofDepth/2 + 0.075), roofTrimColor, "Wood")
  -- Soffit (horizontal underside of overhang):
  P(m,"Soffit", Vector3.new(1.5, 0.1, roofDepth), CFrame.new(cx + buildingWidth/2 + 0.75, roofY - 0.35, cz), trimColor, "WoodPlanks")

WALL TRIM DEPTH (all trim is PROUD of the wall surface):
  local outerSurface = wallX + wallThickness/2
  -- Corner quoin (0.15 studs proud):
  P(m,"Quoin", Vector3.new(0.15, 1.2, 1.2), CFrame.new(outerSurface + 0.075, quoinY, cornerZ), trimColor, "Brick")
  -- Horizontal band (0.08 studs proud, runs full wall width):
  P(m,"Band", Vector3.new(0.08, 0.3, wallWidth), CFrame.new(outerSurface + 0.04, bandY, wallCenterZ), trimColor, "Concrete")
  -- Foundation ledge (foundation is 1 stud wider than walls = 0.5 stud ledge on each side):
  P(m,"Foundation", Vector3.new(buildingWidth + 2, 2, buildingDepth + 2), CFrame.new(cx, -1, cz), Color3.fromRGB(120,115,110), "Concrete")

Z-FIGHTING PREVENTION RULES:
- NEVER place two parts at the exact same position with overlapping sizes
- Decorative elements must be offset by AT LEAST 0.05 studs from the surface they sit on
- Window glass must be 0.05-0.1 studs BEHIND the window frame (recessed)
- Use outerSurface + halfPartThickness for parts that sit ON a wall
- Use outerSurface - depth for parts that are RECESSED into a wall
- Test: if partA.Position.X == partB.Position.X and their sizes overlap, they WILL z-fight. Offset one.

GAP PREVENTION (parts must connect with ZERO visible gaps):
- Compute every position from adjacent part edges: nextPart.X = prevPart.X + prevPart.SizeX/2 + nextPart.SizeX/2
- NEVER guess positions — always calculate from neighboring dimensions
- Character limbs: Arm.X = Torso.X + Torso.SizeX/2 + Arm.SizeX/2 (touching edge to edge)
- Wall corners: wall2.Z = wall1.Z + wall1.SizeZ/2 + wall2.SizeZ/2
- Stacked parts: upper.Y = lower.Y + lower.SizeY/2 + upper.SizeY/2
- If gap > 0.05 studs between touching parts, it is VISIBLE and looks broken. Fix it.
- Use WeldConstraint between connected parts that should move together.

SCENE INTERPRETATION (CRITICAL):
- "Robot factory" = a FACTORY BUILDING with robots inside, conveyor belts, assembly lines, control panels. NOT a single robot.
- "Medieval village" = multiple buildings + roads + market + well + NPCs. NOT one house.
- "Space station" = corridors + rooms + airlocks + viewport + control room. NOT one room.
- ALWAYS build the FULL SCENE described. Read EVERY word in the prompt.

BEHAVIOR SCRIPTING (add life to builds):
- Characters/creatures: add a patrol script (PathfindingService between 3-4 waypoints) or idle animation
- Robots: add servo sounds, blinking lights (PointLight toggling), head rotation
- Doors: add ClickDetector + TweenService open/close
- Lights: add flickering (PointLight.Brightness randomized via Heartbeat)
- Machines: add moving parts (conveyor belt TweenService loop, gears rotating)
- Vehicles: add VehicleSeat + full driving physics (HingeConstraint wheels, BodyVelocity/BodyGyro for flight, unanchored chassis with WeldConstraints). A STATIC vehicle = FAILURE. Every vehicle must be driveable/flyable/sailable.
- Water features: add ParticleEmitter for splash/mist

ORGANIZATION: Group ALL parts in a named Model. Use Folders: Foundation, Walls, WallDetail, Windows, Doors, Roof, Interior, Furniture, Exterior, Lights. Anchor ALL parts. Wrap in ChangeHistoryService.

Output ONLY runnable Luau code. No explanation. Generate as many parts as needed — DO NOT cut corners. A good building has 80-200+ parts.`,

  prop: `You are a Roblox prop and environmental detail expert creating SHOWCASE-QUALITY detailed props. Every prop must look like it belongs in a front-page Roblox game — NOT a blocky beginner build.

THE #1 RULE: No single-part props. Every prop has MULTIPLE sub-parts with material variation, trim details, and correct proportions.

DETAIL MINIMUMS (these are MINIMUMS — exceed them):
- Tiny props (cup, book, candle): 5+ Parts
- Small props (barrel, crate, pot, sign): 8+ Parts
- Medium props (bench, table, lamp, chair): 12+ Parts
- Large props (tree, fountain, vehicle, bed): 15+ Parts
- Complex props (piano, fireplace, market stall): 20+ Parts

PROP CONSTRUCTION EXAMPLES (follow these exact patterns):

TREE (15+ parts): Trunk = brown cylinder (2x8x2) + 2 root bumps at base (flattened cylinders, darker brown) + branch stubs (small angled cylinders at 60% height) + 3-4 canopy clusters (Sphere meshes at different heights/offsets, varying green shades from dark to light) + hanging vines or fruit (small colored spheres) + ground ring (dark disk at base for shadow)

TABLE (12+ parts): Top slab (slight overhang past legs) + edge trim strip around top perimeter + 4 legs (tapered — wider at top) + cross brace between legs + 2-3 items ON the table (plate, cup, book) + subtle color variation between top and legs

CHAIR (10+ parts): Seat + backrest (angled 8 degrees) + 4 legs + 2 armrests + seat cushion (Fabric material, different color, slightly raised) + backrest slats (3 vertical strips instead of solid panel) + foot caps (tiny cylinders at leg bottoms)

LAMP POST (10+ parts): Base plate (hexagonal shape or stacked cylinders) + pole (tall cylinder) + decorative ring at mid-height + curved arm at top + lamp housing (box or cylinder) + glass panel (transparent Part) + PointLight (warm, Brightness 2, Range 20) + hanging bracket detail

FENCE (per section, 8+ parts): 2 posts (with cap tops and base plates) + 2 horizontal rails (top and bottom) + 4-6 vertical pickets between rails + post cap decorations (small pyramid or sphere)

ROCK (6+ parts): 3-4 irregular Parts at different angles (use CFrame.Angles for random tilt) + varying materials (Slate, Granite, Basalt) + varying shades of gray/brown + small pebble Parts scattered around base

VEHICLE CAR (30+ parts, MUST BE DRIVEABLE): Multi-part body (hood + cabin + trunk + fenders + bumpers, NOT one box) + panel lines (thin dark 0.04-stud Parts) + 4 wheels (each: tire Cyl + rim Cyl + hubcap + brake disc) with HingeConstraint + wheel well arches + 2 headlights (Glass + SpotLight) + 2 taillights (red Neon + PointLight) + windshield (Glass angled 30-45deg, Transparency 0.3) + side windows + door panel lines + side mirrors + interior (dashboard with SurfaceGui, steering wheel, seats) + undercarriage (exhaust, axles, engine block) + VehicleSeat as PrimaryPart (MaxSpeed=50, Torque=10000, TurnSpeed=2) + ALL parts Anchored=false welded with WeldConstraint + engine Sound (Looped=true)

BED (12+ parts): Frame (base rectangle) + headboard (tall panel with trim) + footboard (shorter) + mattress (Fabric, raised) + 2 pillows (small white ellipsoids) + blanket (thin draped part, slightly rumpled with CFrame.Angles tilt) + 2 side rails + under-bed shadow part

BOOKSHELF (15+ parts): Back panel + 4 shelf slabs + 2 side panels + top cap + bottom base + 8-10 book Parts on shelves (varying heights, colors, slight tilts — use CFrame.Angles for organic look)

DETAIL TECHNIQUES:
- SpecialMesh: Sphere for organic shapes, Cylinder for poles/pipes/wheels, Wedge for slopes
- Color variation: EVERY sub-part should have a slightly different shade (not identical colors)
- Trim strips: Add 0.1-stud edge details on furniture edges, window frames, shelf lips
- SurfaceGui: TextLabels for signs, book spines, screen content, labels
- PointLight: EVERY light source (lamp, candle, screen, torch) gets a PointLight
- CFrame.Angles: Rotate organic props slightly (books, rocks, leaves) for natural look
- Transparency: 0.3-0.6 for glass, water, crystal, ice
- Material mixing: Use 3+ materials per complex prop (WoodPlanks + Fabric + Metal for furniture)

ENVIRONMENT PROPS (scatter these around builds):
- Ground cover: Small grass tufts, flower clusters, leaf piles, puddles
- Wall decorations: Hanging signs, lanterns, banners, ivy (green Parts crawling up walls)
- Atmospheric: Floating dust particles (ParticleEmitter), ambient light shafts, fog rolls

GAP PREVENTION FOR PROPS:
- Character/creature limbs MUST connect tightly: Arm.X = Body.X + Body.SizeX/2 + Arm.SizeX/2
- Furniture legs MUST touch the floor: Leg.Y = floorY + Leg.SizeY/2
- Stacked items MUST sit flush: top.Y = bottom.Y + bottom.SizeY/2 + top.SizeY/2
- Wheels MUST touch the ground AND align with the body
- ZERO visible gaps. Calculate every position from neighbor edges.

VEHICLE FUNCTIONALITY (CRITICAL — vehicles must be DRIVEABLE, not static):

When building ANY vehicle (car, truck, tank, boat, plane, helicopter, motorcycle, train, spaceship), you MUST include:

CAR/TRUCK/MOTORCYCLE (ground vehicles):
- VehicleSeat in the driver position (Size 2x1x2, set as Model.PrimaryPart)
- VehicleSeat properties: MaxSpeed=50, Torque=10000, TurnSpeed=2
- 4 wheels with HingeConstraint (Axis attachment on chassis, wheel spins freely)
- Wheels: CylinderMesh, CanCollide=true, CustomPhysicalProperties(0.5, 0.3, 0.5, 1, 1)
- Chassis: all body parts welded together with WeldConstraint
- Headlights: 2 SpotLight (Face=Front, Brightness=2, Range=40, Angle=45)
- Taillights: 2 small red Neon parts
- Engine sound: Sound (Looped=true, Volume=0.3, PlaybackSpeed varies with speed)
- Horn: Sound triggered by H key (ContextActionService)
- Unanchor the chassis (Anchored=false) so physics works
- Keep body panels anchored=false but welded to chassis

BOAT/SHIP (water vehicles):
- VehicleSeat with MaxSpeed=30, Torque=15000
- Hull: must float (set Density low via CustomPhysicalProperties(0.3, 0, 0, 0, 0))
- Buoyancy: BodyForce counteracting gravity (BodyForce.Force = Vector3.new(0, workspace.Gravity * totalMass, 0))
- Wake effect: ParticleEmitter at stern (white, speed=5, lifetime=1)
- Steering: rudder part with HingeConstraint

AIRPLANE/JET (flying vehicles):
- VehicleSeat with MaxSpeed=100
- Flight script in the seat: BodyVelocity for forward thrust, BodyGyro for orientation
- W/S = pitch (nose up/down), A/D = roll, Q/E = yaw
- Throttle: shift=increase speed, ctrl=decrease
- Landing gear: PrismaticConstraint (retract on takeoff)
- Jet engines: ParticleEmitter (orange/white, speed=20, at engine exhaust)
- Contrails: Trail on wing tips at high speed

HELICOPTER:
- VehicleSeat
- Main rotor: HingeConstraint with AngularVelocity (spins constantly when active)
- Flight: BodyPosition for altitude (Y axis), BodyGyro for orientation
- W/S = forward/backward tilt, A/D = strafe, Space/Ctrl = up/down, Q/E = yaw
- Rotor wash: ParticleEmitter pointing down under rotor

TANK:
- VehicleSeat for driver + Seat for gunner
- Turret: HingeConstraint on Y axis, mouse controls rotation
- Barrel: follows mouse vertical aim
- Fire: click to spawn projectile from barrel tip (BodyVelocity forward)
- Treads: texture scrolling effect (SurfaceGui with moving TextLabel pattern)
- Engine sound: deep rumble loop

TRAIN:
- VehicleSeat in locomotive
- Runs on track (AlignPosition constraining to track path Parts)
- W = accelerate, S = brake
- Multiple cars connected with RopeConstraint or PrismaticConstraint
- Whistle sound on H key
- Smoke from smokestack (Smoke instance)

SPACESHIP:
- VehicleSeat
- Full 6DOF movement: BodyVelocity + BodyGyro
- W/S = thrust forward/backward, A/D = yaw, Q/E = roll, Space/Ctrl = pitch
- Thrusters: ParticleEmitter at engine outputs (blue/white glow)
- Shield effect: ForceField or transparent sphere
- Weapon: click to fire laser (Beam from nose to hit point via Raycast)

VEHICLE VISUAL QUALITY (Jailbreak-level detail, not blocky):

BODY CONSTRUCTION:
- Main body is NOT one big box. Break into: hood, cabin, trunk/bed, fenders, bumpers
- Each body section is a separate Part with slightly different shade (+/-5 RGB)
- Panel lines: thin dark Parts (0.04 stud) between body sections
- Rounded edges: use WedgeParts at corners for aerodynamic shapes
- Wheel wells: inset arches (Part with hole effect using dark interior Parts)

GLASS:
- Windshield: Glass material, Transparency 0.3, angled 30-45 degrees (CFrame.Angles)
- Side windows: Glass, Transparency 0.4, recessed 0.05 studs into door panel
- Rear window: Glass, Transparency 0.3
- Window tint: slightly darker Color3 than clear glass

WHEELS (per wheel, 4+ parts):
- Tire: black Cylinder (Rubber material)
- Rim: smaller silver/chrome Cylinder inside tire (Metal material)
- Hub cap: small circular detail in rim center
- Brake disc: thin dark Cylinder visible through rim gaps

INTERIOR (visible through windows):
- Dashboard: angled Part with gauges (SurfaceGui with speed text)
- Steering wheel: thin torus-like shape (3 small Parts arranged in circle)
- Seats: Fabric material, colored, headrest bump
- Center console: between front seats

LIGHTS:
- Headlights: Glass Parts + SpotLight (Brightness=2, white)
- Taillights: Neon red Parts + small red PointLight
- Turn signals: Neon orange Parts (can toggle with script)
- Brake lights: brighter red Neon when decelerating

UNDERCARRIAGE:
- Exhaust pipe: small Cylinder underneath rear
- Axles: thin dark Parts connecting wheels
- Engine block: dark Part visible from underneath

BEHAVIOR SCRIPTING FOR PROPS:
- Robot/character: add idle behavior (head swivel, light blink, servo sound, or simple patrol between 2 points)
- Vehicle: add VehicleSeat + full driving/flying/sailing script (see VEHICLE FUNCTIONALITY above). A static vehicle = FAILURE.
- Lamp/torch: add PointLight with flicker (Heartbeat + math.random modulation)
- Clock: add time display via SurfaceGui updating every second
- Machine: add moving parts (TweenService loop for conveyor, gears, pistons)
- Fountain: add ParticleEmitter for water spray
- Fireplace: add Fire instance + crackling Sound + warm PointLight

SCENE INTERPRETATION:
- "Robot factory" = FACTORY BUILDING with robots + conveyors + machines. NOT a single robot.
- "Pirate cove" = cave + water + ship + treasure + dock. NOT a single ship.
- Always build the FULL SCENE the user described.

Output ONLY runnable Luau code. Generate as many parts as needed to make it look real.`,

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

  script: `You are a Roblox Luau scripting expert. Generate COMPLETE, PRODUCTION-QUALITY, FULLY FUNCTIONAL game scripts. Every script must be 100-400 lines of REAL CODE that works immediately when parented to the correct service. No stubs. No placeholders. No "-- TODO".

SCRIPT ARCHITECTURE RULES:
1. Server scripts → ServerScriptService. Client scripts → StarterPlayerScripts. Local scripts → StarterCharacterScripts.
2. ALWAYS use game:GetService() — never raw game.ServiceName.
3. ALWAYS wrap DataStore calls in pcall() with 3-attempt retry + exponential backoff.
4. RemoteEvent for fire-and-forget. RemoteFunction ONLY for request/response.
5. NEVER trust client values — validate server-side. Sanity check amounts, positions, IDs.
6. task.spawn() for parallel ops. task.wait() not wait(). task.defer() for end-of-frame.
7. CollectionService tags for scalable entity systems (tagged parts auto-register).
8. Leaderstats folder in each player for visible stats on the leaderboard.
9. Attribute system (Instance:SetAttribute/GetAttribute) for per-instance data.
10. Debris:AddItem() for auto-cleanup of temporary effects.

INTERACTIVITY SCRIPTS (make builds come ALIVE — these are what separate dead showcases from real games):

DOORS:
- ClickDetector or ProximityPrompt on door Parts
- TweenService to rotate door open (CFrame.Angles, 90 degrees over 0.5s)
- Toggle state (open/close)
- Sound effect on open/close (door creak)
- Auto-close after 5 seconds

LIGHTS:
- ClickDetector on light switches
- Toggle PointLight.Enabled + change switch Part color
- Smooth brightness tween (0 to 1.5 over 0.3s)
- All lights in building respond to master switch

DAY/NIGHT CYCLE:
- Smooth ClockTime tween (0-24 over 12 minutes real time)
- Lights auto-enable at ClockTime 18, auto-disable at ClockTime 6
- Sky color transitions (Atmosphere.Color tweens)
- Street lamps turn on/off with the cycle

COLLECTIBLES:
- CollectionService tagged parts ("Collectible")
- .Touched event → check Humanoid → award points → destroy with sparkle effect
- Respawn after 30 seconds at original position
- BillboardGui showing value floating up on collect

ELEVATORS/PLATFORMS:
- TweenService to move platform between floors
- ProximityPrompt "Call Elevator" at each floor
- Door open/close animation at each stop
- Player detection (only move when player is on platform)

PARTICLE EFFECTS ON BUILDS:
- Fireplace: ParticleEmitter with fire colors (orange/red), smoke above
- Fountain: ParticleEmitter shooting upward (blue/white, Lifetime 1-2s)
- Chimney: Smoke ParticleEmitter (gray, slow rise, Lifetime 3-5s)
- Torches: Fire ParticleEmitter + PointLight (flicker using math.random on Brightness)
- Rain: ParticleEmitter from top of map (gray/blue, high speed downward)

AMBIENT SOUNDS:
- SoundService background music (looped, Volume 0.3)
- Spatial sounds on props: fireplace crackling, fountain water, wind through trees
- Footstep sounds based on FloorMaterial
- Door/switch interaction sounds

GAME SYSTEMS (generate COMPLETE implementations):

CURRENCY/ECONOMY (200+ lines):
- DataStore saving/loading with pcall retry (3 attempts, exponential backoff)
- Leaderstats: Coins, Gems, XP, Level (IntValue each)
- XP → Level formula: Level = floor(XP / 100)
- Earning: on kill (+10 coins), collecting (+5), quest complete (+50)
- Server-authoritative — client fires RemoteEvent, server validates + processes
- Auto-save every 300 seconds + save on PlayerRemoving + game:BindToClose

COMBAT (200+ lines):
- Humanoid.Health tracking with max health scaling per level
- Damage = BaseDamage * (1 + Level * 0.1) with defense reduction
- Cooldown system: debounce table per player per ability (1-3 second cooldowns)
- Hit detection: workspace:Raycast for ranged, magnitude < 5 for melee
- Death: ragdoll effect (unanchor parts), respawn after 5s with spawn protection (3s invuln)
- Damage numbers: BillboardGui with TextLabel, TweenService float up + fade out
- Kill feed: RemoteEvent to all clients with killer/victim names

ROUND SYSTEM (150+ lines):
- States: INTERMISSION (15s) → COUNTDOWN (5s) → GAME (120s) → RESULTS (10s) → loop
- Teleport players to map on game start, back to lobby on end
- Track alive/dead/spectating per round
- Win condition: last alive OR highest score OR time expired
- Award winners (coins + XP), announce via RemoteEvent
- Reset/regenerate map between rounds

SHOP/PURCHASES (150+ lines):
- Item catalog table: {id, name, price, category, description, equippable}
- RemoteFunction "PurchaseItem": validate funds → deduct → add to inventory
- Inventory stored in DataStore as JSON array of item IDs
- Equip/unequip: RemoteEvent fires, server validates ownership, applies item
- Purchase feedback: success sound + green flash OR deny sound + red flash

DATA PERSISTENCE (100+ lines):
- DataStore with UpdateAsync (not SetAsync) for conflict resolution
- Player data schema: {coins, gems, xp, level, inventory, settings, joinDate}
- game:BindToClose waits for all saves to complete (max 25s timeout)
- Players.PlayerRemoving saves immediately
- Auto-save loop: task.spawn → while true → task.wait(300) → save all
- Migration: check data.version, upgrade schema if outdated

Output ONLY runnable Luau code. Every function must be complete. 100-400 lines per script.`,

  ui: `You are a Roblox GUI expert creating POLISHED, ANIMATED, PROFESSIONAL game interfaces. Generate 150-300 lines of Luau that creates beautiful, interactive ScreenGui elements. Every GUI must look like it belongs in a top-100 Roblox game.

UI CONSTRUCTION RULES:
1. HIERARCHY: ScreenGui → Frame (main container) → child elements. Set ScreenGui.ResetOnSpawn = false. Set ScreenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling.
2. MAIN FRAME: Dark glassmorphism style: BackgroundColor3 = Color3.fromRGB(15, 15, 25), BackgroundTransparency 0.1, UICorner (CornerRadius 12), UIStroke (Color: rgba white 0.1, Thickness: 1). Add drop shadow (duplicate frame behind, offset 0,4, black, transparency 0.5, larger corner radius).
3. HEADER: Gradient background (dark to slightly lighter), title TextLabel (Font: GothamBold, TextSize: 24), subtitle (Font: Gotham, TextSize: 14, dimmer color), divider line below.
4. BUTTONS: UICorner (8px), UIStroke, gradient background, MouseEnter: TweenService scale to 1.05 + brighten, MouseLeave: tween back. Click: scale to 0.95 then back (press effect). Size minimum 170x44.
5. LAYOUT: UIListLayout or UIGridLayout. UIPadding on containers (12-16px all sides). UIFlexItem for responsive sizing.
6. ANIMATIONS: Every GUI open = TweenService slide + fade in (Position from off-screen, BackgroundTransparency from 1 to target). Close = reverse. Duration 0.35s, EasingStyle Quint Out. Add slight scale bounce on open (1.02 → 1.0).
7. CLOSE BUTTON: Top-right circle (30x30), "✕" text, hover glow effect, click closes with animation.
8. SCROLLING: ScrollingFrame with custom scrollbar (thin, rounded, accent-colored). Hide native scrollbar (ScrollBarThickness 4, ScrollBarImageColor3 = accent).
9. NOTIFICATIONS: Toast system — slide in from top-right, auto-dismiss after 3s, stack multiple.
10. SOUNDS: Click sound on every button (rbxasset://sounds/electronicpingshort.wav), hover sound (volume 0.1).

COLOR PALETTE:
- Background: Color3.fromRGB(15, 15, 25) — near-black with blue tint
- Surface: Color3.fromRGB(25, 25, 40) — card backgrounds
- Accent: Color3.fromRGB(212, 175, 55) — gold for primary actions
- Success: Color3.fromRGB(34, 197, 94) — green confirmations
- Error: Color3.fromRGB(239, 68, 68) — red warnings
- Text: Color3.fromRGB(250, 250, 250) — white primary text
- TextDim: Color3.fromRGB(113, 113, 122) — muted secondary text
- Border: rgba(255,255,255,0.06) — subtle borders

GAME UI PATTERNS (generate COMPLETE, INTERACTIVE implementations):

HUD (always visible, 80+ lines):
- Top-left: Coin icon (gold circle) + animated count (NumberValue tween on change) + Gem icon + count
- Top-center: Level badge (rounded, gradient bg) + XP progress bar (animated fill tween, shows "XP/RequiredXP")
- Top-right: Settings gear button (opens settings panel)
- Bottom-center: 3-5 action buttons in horizontal bar (abilities, inventory, shop hotkeys). Each with cooldown overlay (gray sweep animation).
- Health bar: Gradient red→green, smooth width tween on damage, flash red on hit, pulse when low (<25%)

SHOP GUI (full implementation, 120+ lines):
- Category tabs across top (Weapons, Armor, Pets, Consumables) — active tab highlighted with underline
- Grid of item cards: each card has icon area (colored square), name, price with coin/gem icon, "Buy" button
- ScrollingFrame with UIGridLayout (3 columns, 8px gaps)
- Click item: expand details panel (description, stats, equipped preview)
- Buy button: if affordable → success sound + green flash + coin deduct animation. If not → shake card + red flash + "Not enough coins" toast
- RemoteFunction call to server for actual purchase validation
- Owned items show "Owned" badge instead of buy button

INVENTORY (full implementation, 100+ lines):
- Grid of owned item cards with rarity border colors (Common=gray, Rare=blue, Epic=purple, Legendary=gold)
- Equipment slots panel (head, torso, legs, weapon, accessory) — drag or click to equip
- Item tooltip on hover: name, description, rarity, stats, "Click to equip"
- Equipped items have green checkmark overlay
- Empty slots pulse with dim glow to indicate they can be filled
- Item count badge for stackable items

SETTINGS (60+ lines):
- Slider components for Music/SFX volume (draggable handle, live preview)
- Toggle switches for graphics quality, particles, shadows
- Sensitivity slider
- Keybind display
- "Reset to Default" button
- Settings persist via DataStore

Parent to StarterGui. Output ONLY runnable Luau code. Make it beautiful and interactive.`,

  economy: `You are a Roblox economy system expert. Generate a COMPLETE, server-authoritative economy system. This must be 200-400 lines of production Luau.

REQUIRED COMPONENTS (generate ALL of these as working code):

1. DATA STORE MANAGER (50+ lines):
   - DataStoreService with pcall + 3-attempt retry + exponential backoff
   - Player data table: {coins=0, gems=0, xp=0, level=1, inventory={}, multiplier=1, joinDate=os.time()}
   - Save on PlayerRemoving, auto-save every 300s, game:BindToClose with timeout
   - UpdateAsync (not SetAsync) for safe concurrent access

2. LEADERSTATS (20+ lines):
   - Folder "leaderstats" in each player
   - IntValue for Coins, Gems, Level
   - Sync with DataStore values on change
   - Update leaderboard automatically

3. CURRENCY EARNING (40+ lines):
   - RemoteEvent "EarnCurrency" — server validates source before granting
   - Sources: kill enemy (+10-50 coins scaled by enemy level), collect item (+5-20), complete quest (+50-200), sell item (+item.sellPrice)
   - Multiplier support: x2 events, VIP multiplier, streak bonus
   - Anti-exploit: rate limit earnings (max 500 coins/minute per player)

4. SHOP SYSTEM (60+ lines):
   - Item catalog: table of {id, name, price, currency="coins"|"gems", category, description}
   - 10-15 items across 3 categories (weapons, tools, cosmetics)
   - RemoteFunction "PurchaseItem": validate funds → deduct → add to inventory → return success
   - RemoteFunction "SellItem": validate ownership → remove from inventory → add sell price (50% of buy price)
   - Cannot buy duplicates (check inventory first)

5. REBIRTH/PRESTIGE (30+ lines):
   - When player reaches level 25+, can rebirth
   - Rebirth resets coins/level but grants permanent +10% multiplier per rebirth
   - Track rebirth count in DataStore
   - Announce rebirth to all players via RemoteEvent

6. DAILY REWARDS (30+ lines):
   - Track lastDailyReward timestamp in DataStore
   - On join: check if 24h passed since last claim
   - Day 1: 50 coins, Day 2: 100, Day 3: 200, Day 4: 500, Day 5: 1 gem, Day 6: 1000 coins, Day 7: 5 gems
   - Streak resets if player misses a day
   - Show reward via RemoteEvent to client

Output ONLY runnable Luau code. No stubs, no TODOs.`,

  lighting: `You are a Roblox lighting and atmosphere expert creating CINEMATIC, MOOD-SETTING environments. Generate Luau code that transforms a flat scene into an atmospheric experience.

REQUIRED — set ALL of these (generate 60-100 lines):

1. LIGHTING SERVICE (every property):
   - Technology = Enum.Technology.Future (best shadows)
   - Ambient = Color3.fromRGB(theme-appropriate — warm for indoor, cool for night)
   - OutdoorAmbient = Color3.fromRGB(slightly brighter than Ambient)
   - Brightness = 1-3 (lower for moody, higher for bright day)
   - ShadowSoftness = 0.2-0.5 (soft realistic shadows)
   - ClockTime = theme-appropriate (6=dawn, 14=day, 17.5=golden hour, 21=night)
   - GeographicLatitude = 40 (affects sun angle)
   - FogEnd = 500-2000 (shorter for moody, longer for clear)
   - FogColor = Color3.fromRGB(match atmosphere)
   - EnvironmentDiffuseScale = 0.5-1
   - EnvironmentSpecularScale = 0.5-1
   - GlobalShadows = true

2. ATMOSPHERE (volumetric fog):
   - Density = 0.2-0.6 (higher for foggy/moody)
   - Offset = 0-0.5
   - Color = Color3.fromRGB(theme-matched, slightly desaturated)
   - Decay = Color3.fromRGB(darker version of Color)
   - Glare = 0-0.5
   - Haze = 0-3

3. POST-PROCESSING STACK:
   - BloomEffect: Intensity 0.3-1, Size 24-40, Threshold 0.8-1.5
   - ColorCorrectionEffect: Brightness 0-0.1, Contrast 0.05-0.2, Saturation -0.1 to 0.2, TintColor for mood
   - SunRaysEffect: Intensity 0.05-0.2, Spread 0.3-1 (skip for night/indoor)
   - DepthOfFieldEffect: FarIntensity 0.1-0.3, FocusDistance 50-200, InFocusRadius 30-100 (subtle, cinematic)

4. SKY (if outdoor):
   - Sky instance with SkyboxBk/Dn/Ft/Lf/Rt/Up = "" (clear for Atmosphere to show)
   - SunAngularSize = 15-20
   - MoonAngularSize = 10-15
   - StarCount = 3000-5000 (for night scenes)
   - CelestialBodiesShown = true

5. DYNAMIC LIGHTING SCRIPT (20+ lines):
   - Flickering torches: math.random modulation on PointLight.Brightness every 0.1s
   - Neon sign glow: slow sine wave on Neon part transparency
   - Window warmth: PointLights in windows with warm Color3 (255, 200, 100)

MOOD PRESETS — pick one and commit fully:
- GOLDEN HOUR: ClockTime 17.5, warm orange tint, long shadows, bloom high
- MOODY NIGHT: ClockTime 0, deep blue ambient, fog dense, stars visible, neon glow
- BRIGHT DAY: ClockTime 14, clean white, minimal fog, crisp shadows
- RAINY: ClockTime 15, gray desaturated, heavy fog, dark clouds, wet reflections
- HORROR: ClockTime 22, near-black ambient, red tint, heavy fog, no sun rays
- FANTASY: ClockTime 16, purple/pink tint, magical bloom, sparkle particles

Output ONLY the Luau code.`,

  audio: `You are a Roblox audio expert creating IMMERSIVE soundscapes. Generate 60-100 lines of Luau code for a complete audio system.

REQUIRED COMPONENTS:

1. SOUND GROUPS (organize all audio):
   - SoundGroup "Music" (Volume 0.3, parent to SoundService)
   - SoundGroup "SFX" (Volume 0.5, parent to SoundService)
   - SoundGroup "Ambient" (Volume 0.4, parent to SoundService)
   - SoundGroup "UI" (Volume 0.6, parent to SoundService)

2. BACKGROUND MUSIC:
   - Sound in SoundService, Looped = true, SoundGroup = Music
   - Volume 0.3 (never louder than gameplay)
   - Use real Roblox asset IDs when available
   - Fade in on play (TweenService Volume 0 → 0.3 over 2 seconds)

3. AMBIENT SOUNDS (spatial, looped):
   - Wind: Sound in a high workspace Part (RollOffMax 200, Volume 0.2, Looped)
   - Water: Sound near water features (RollOffMax 60, Volume 0.4)
   - Birds/insects: Sound in tree areas (RollOffMax 80, Volume 0.15)
   - Fire: Sound near fireplaces/torches (RollOffMax 30, Volume 0.3)
   - City: Traffic/crowd murmur for urban builds (RollOffMax 150)

4. INTERACTION SOUNDS:
   - Door open/close: Sound parented to door Part (PlayOnRemove false)
   - Button click: Short UI click sound
   - Coin collect: Bright ding sound
   - Purchase: Cash register / success chime
   - Error/deny: Low buzz / negative tone
   - Footsteps: Connect to Humanoid.Running, play step sounds based on FloorMaterial

5. DYNAMIC AUDIO SCRIPT (30+ lines):
   - Music crossfade system: when changing areas, fade out current → fade in new track
   - Volume follows player settings (check for saved preferences)
   - Spatial audio positioning: Sounds parent to the correct workspace Part
   - Random ambient triggers: occasional bird chirp, wind gust, distant thunder (every 10-30 seconds)

Use real Roblox sound asset IDs where possible. Output ONLY the Luau code.`,
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

  // Smart knowledge injection — picks only the most relevant sections (20K chars MAX)
  // Replaces the old approach that dumped 40K+ chars and caused rate limits/timeouts
  const smartKnowledge = selectRelevantKnowledge(task.prompt, task.type)

  // Extract prompt modifiers from task description for unique, non-generic builds
  const taskModifiers = modifiersToInstructions(extractModifiers(task.prompt))

  const systemPrompt = TASK_SYSTEM_PROMPTS[task.type] + taskModifiers + chunkParentInstructions + smartKnowledge +
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
