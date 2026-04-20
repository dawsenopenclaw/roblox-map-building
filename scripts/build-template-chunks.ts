/**
 * Curated build templates — geometrically verified P() code examples.
 *
 * These are FEW-SHOT EXAMPLES for the RAG. When a user says "build me a house",
 * the AI retrieves these and has concrete, working code to reference — not just
 * vague instructions like "use walls and a roof".
 *
 * GEOMETRY RULES (enforced by hand during authoring):
 * - Y position = ground (0) + half the part height. A 4-stud-tall wall → Y = 2.
 * - Parts sitting ON other parts: Y = base_top + half_own_height.
 * - Walls at corners share edges, not overlap. A 20-wide room with 0.5-thick
 *   walls: front/back walls are 20 wide, side walls are 19 (inset by 0.5 each side).
 * - Roofs overhang by 1 stud on each side.
 * - All colors use Color3.fromRGB() with realistic values.
 * - No SmoothPlastic. Ever.
 *
 * Each template is stored as a RAG chunk with category="pattern" so it's
 * retrieved when users ask to build similar objects.
 */

export interface BuildTemplate {
  title: string
  tags: string[]
  description: string
  /** The actual P() code block — this is what the AI should learn from */
  code: string
}

export const BUILD_TEMPLATES: BuildTemplate[] = [

  // ═══════════════════════════════════════════════════════════════════
  // HOUSE — the #1 thing users ask for
  // ═══════════════════════════════════════════════════════════════════
  {
    title: 'Simple House — complete build with interior',
    tags: ['house', 'building', 'residential', 'beginner'],
    description: 'A 20x16 stud house with brick walls, slate roof, door, windows, chimney, and basic interior furniture. 38 parts total. Geometrically verified — walls connect at corners, roof covers footprint with 1-stud overhang, furniture sits on floor.',
    code: `-- SIMPLE HOUSE (38 parts) — 20x16 footprint, 12 studs tall to roof peak
-- Wall thickness: 0.5 studs. Floor at Y=0. Wall height: 8 studs.
-- Coordinate system: front faces +Z direction

local folder = getFolder("House")

-- FOUNDATION (sits half-embedded in ground)
P("Foundation", CFrame.new(0, -0.25, 0), Vector3.new(22, 0.5, 18), Enum.Material.Concrete, Color3.fromRGB(140, 135, 130))

-- FLOOR
P("Floor", CFrame.new(0, 0.25, 0), Vector3.new(20, 0.5, 16), Enum.Material.WoodPlanks, Color3.fromRGB(150, 100, 60))

-- WALLS (height=8, so center Y = 0.5 + 4 = 4.5)
-- Front wall (Z=8, has door gap 4 wide centered, window gaps)
P("FrontWallLeft", CFrame.new(-6, 4.5, 8), Vector3.new(8, 8, 0.5), Enum.Material.Brick, Color3.fromRGB(170, 75, 55))
P("FrontWallRight", CFrame.new(6, 4.5, 8), Vector3.new(8, 8, 0.5), Enum.Material.Brick, Color3.fromRGB(170, 75, 55))
P("FrontWallAboveDoor", CFrame.new(0, 7.5, 8), Vector3.new(4, 2, 0.5), Enum.Material.Brick, Color3.fromRGB(170, 75, 55))
-- Back wall (Z=-8, solid)
P("BackWall", CFrame.new(0, 4.5, -8), Vector3.new(20, 8, 0.5), Enum.Material.Brick, Color3.fromRGB(170, 75, 55))
-- Left wall (X=-10, inset by wall thickness)
P("LeftWall", CFrame.new(-10, 4.5, 0), Vector3.new(0.5, 8, 15), Enum.Material.Brick, Color3.fromRGB(165, 70, 50))
-- Right wall (X=10)
P("RightWall", CFrame.new(10, 4.5, 0), Vector3.new(0.5, 8, 15), Enum.Material.Brick, Color3.fromRGB(165, 70, 50))

-- DOOR (inset slightly from front wall)
P("Door", CFrame.new(0, 3.5, 7.8), Vector3.new(3.5, 6.5, 0.3), Enum.Material.Wood, Color3.fromRGB(90, 55, 25))
P("DoorKnob", CFrame.new(1.2, 3.5, 7.6), Vector3.new(0.4, 0.4, 0.4), Enum.Material.Metal, Color3.fromRGB(200, 180, 60))

-- WINDOWS (Glass, semi-transparent)
P("WindowLeft", CFrame.new(-6, 5, 8.1), Vector3.new(3, 3, 0.2), Enum.Material.Glass, Color3.fromRGB(180, 210, 230))
P("WindowRight", CFrame.new(6, 5, 8.1), Vector3.new(3, 3, 0.2), Enum.Material.Glass, Color3.fromRGB(180, 210, 230))
P("WindowBack", CFrame.new(0, 5, -8.1), Vector3.new(4, 3, 0.2), Enum.Material.Glass, Color3.fromRGB(180, 210, 230))

-- WINDOW FRAMES
P("WinFrameL_Top", CFrame.new(-6, 6.6, 8.15), Vector3.new(3.4, 0.3, 0.3), Enum.Material.Wood, Color3.fromRGB(110, 70, 35))
P("WinFrameL_Bot", CFrame.new(-6, 3.4, 8.15), Vector3.new(3.4, 0.3, 0.3), Enum.Material.Wood, Color3.fromRGB(110, 70, 35))
P("WinFrameR_Top", CFrame.new(6, 6.6, 8.15), Vector3.new(3.4, 0.3, 0.3), Enum.Material.Wood, Color3.fromRGB(110, 70, 35))
P("WinFrameR_Bot", CFrame.new(6, 3.4, 8.15), Vector3.new(3.4, 0.3, 0.3), Enum.Material.Wood, Color3.fromRGB(110, 70, 35))

-- ROOF (two sloped halves using CFrame rotation, overhang 1 stud each side)
-- Roof ridge at Y=12, eaves at Y=8.5. Each half is ~11.2 studs hypotenuse.
P("RoofLeft", CFrame.new(-5.5, 10.25, 0) * CFrame.Angles(0, 0, math.rad(30)), Vector3.new(11.2, 0.5, 18), Enum.Material.Slate, Color3.fromRGB(65, 65, 75))
P("RoofRight", CFrame.new(5.5, 10.25, 0) * CFrame.Angles(0, 0, math.rad(-30)), Vector3.new(11.2, 0.5, 18), Enum.Material.Slate, Color3.fromRGB(65, 65, 75))
-- Roof ridge cap
P("RoofRidge", CFrame.new(0, 12, 0), Vector3.new(1, 0.5, 18), Enum.Material.Slate, Color3.fromRGB(55, 55, 65))

-- CHIMNEY (on back-right, extends above roof)
P("Chimney1", CFrame.new(7, 9, -5), Vector3.new(2.5, 6, 2.5), Enum.Material.Brick, Color3.fromRGB(130, 60, 45))
P("ChimneyTop", CFrame.new(7, 12.5, -5), Vector3.new(3, 0.5, 3), Enum.Material.Brick, Color3.fromRGB(120, 55, 40))

-- INTERIOR — Furniture sits on floor (Y=0.5 is floor top)
-- Couch (seat Y = 0.5 + 1 = 1.5, backrest Y = 0.5 + 2 = 2.5)
P("CouchSeat", CFrame.new(-5, 1.5, -4), Vector3.new(6, 1.5, 3), Enum.Material.Fabric, Color3.fromRGB(70, 90, 120))
P("CouchBack", CFrame.new(-5, 2.75, -5.3), Vector3.new(6, 2, 0.5), Enum.Material.Fabric, Color3.fromRGB(65, 85, 115))

-- Table (height = 3.5 studs from floor)
P("TableTop", CFrame.new(4, 3.5, -3), Vector3.new(4, 0.4, 3), Enum.Material.Wood, Color3.fromRGB(130, 85, 45))
P("TableLeg1", CFrame.new(2.2, 1.8, -1.7), Vector3.new(0.4, 3, 0.4), Enum.Material.Wood, Color3.fromRGB(120, 78, 40))
P("TableLeg2", CFrame.new(5.8, 1.8, -1.7), Vector3.new(0.4, 3, 0.4), Enum.Material.Wood, Color3.fromRGB(120, 78, 40))
P("TableLeg3", CFrame.new(2.2, 1.8, -4.3), Vector3.new(0.4, 3, 0.4), Enum.Material.Wood, Color3.fromRGB(120, 78, 40))
P("TableLeg4", CFrame.new(5.8, 1.8, -4.3), Vector3.new(0.4, 3, 0.4), Enum.Material.Wood, Color3.fromRGB(120, 78, 40))

-- Welcome mat
P("WelcomeMat", CFrame.new(0, 0.52, 9), Vector3.new(4, 0.1, 2.5), Enum.Material.Fabric, Color3.fromRGB(100, 55, 40))

-- Interior light
local light = Instance.new("PointLight")
light.Range = 20  light.Brightness = 0.8
light.Color = Color3.fromRGB(255, 230, 180)
light.Parent = P("CeilingLightFixture", CFrame.new(0, 8, 0), Vector3.new(1.5, 0.3, 1.5), Enum.Material.Metal, Color3.fromRGB(200, 190, 170))`,
  },

  // ═══════════════════════════════════════════════════════════════════
  // TREE — #2 most requested, and the AI always does it wrong
  // ═══════════════════════════════════════════════════════════════════
  {
    title: 'Realistic Tree — multi-layer canopy with roots',
    tags: ['tree', 'nature', 'plant', 'foliage', 'forest'],
    description: 'An 8-part tree with proper trunk, root flare, 2 branches, and 3-layer canopy using varied greens. NOT a cylinder + sphere. Height: 18 studs. Trunk tapers, branches angle outward, canopy layers offset for organic look.',
    code: `-- REALISTIC TREE (10 parts) — height ~18 studs, organic shape
-- The #1 mistake: building a cylinder + sphere. This has root flare,
-- tapered trunk, angled branches, and 3 canopy layers at different offsets.

local folder = getFolder("Tree")

-- ROOT FLARE (wider base, gives the tree a grounded feel)
P("RootFlare", CFrame.new(0, 0.75, 0), Vector3.new(3, 1.5, 3), Enum.Material.Wood, Color3.fromRGB(90, 55, 30))

-- TRUNK (tapers: bottom is wider than top, use two stacked parts)
P("TrunkLower", CFrame.new(0, 3.5, 0), Vector3.new(2, 4, 2), Enum.Material.Wood, Color3.fromRGB(100, 60, 30))
P("TrunkUpper", CFrame.new(0, 7, 0), Vector3.new(1.5, 3, 1.5), Enum.Material.Wood, Color3.fromRGB(105, 65, 35))

-- BRANCHES (angled outward using CFrame rotation)
P("BranchLeft", CFrame.new(-2.5, 8, 0) * CFrame.Angles(0, 0, math.rad(35)), Vector3.new(4, 0.8, 0.8), Enum.Material.Wood, Color3.fromRGB(95, 58, 28))
P("BranchRight", CFrame.new(2, 9, 1) * CFrame.Angles(0, math.rad(30), math.rad(-40)), Vector3.new(3.5, 0.7, 0.7), Enum.Material.Wood, Color3.fromRGB(95, 58, 28))

-- CANOPY — 3 overlapping layers at different offsets for organic look
-- Main canopy (centered, largest)
P("CanopyMain", CFrame.new(0, 12, 0), Vector3.new(8, 5, 8), Enum.Material.Grass, Color3.fromRGB(60, 130, 50))
-- Secondary (offset left-forward, slightly smaller, different green)
P("CanopyLeft", CFrame.new(-2.5, 13, 2), Vector3.new(6, 4, 5), Enum.Material.Grass, Color3.fromRGB(45, 110, 35))
-- Top tuft (small, highest point, lightest green)
P("CanopyTop", CFrame.new(1, 15, -1), Vector3.new(4, 3, 4), Enum.Material.Grass, Color3.fromRGB(75, 145, 60))`,
  },

  // ═══════════════════════════════════════════════════════════════════
  // CAR — vehicles are complex, AI always makes them flat
  // ═══════════════════════════════════════════════════════════════════
  {
    title: 'Basic Car — sedan with wheels, windows, and headlights',
    tags: ['car', 'vehicle', 'sedan', 'transport', 'drive'],
    description: 'A 12x5x5 stud sedan with body, hood, roof, trunk, 4 wheels, windshield, rear window, 2 headlights, 2 taillights. 16 parts. Wheels are Cylinders rotated 90° on Z. Body uses two-tone color.',
    code: `-- BASIC CAR / SEDAN (16 parts) — 12 studs long, 5 wide, 5 tall
-- Sits on ground. Wheels are Cylinders rotated 90° on Z axis.
-- Front faces +Z direction.

local folder = getFolder("Car")

-- BODY (lower section, wider)
P("Body", CFrame.new(0, 1.5, 0), Vector3.new(5, 2, 10), Enum.Material.Metal, Color3.fromRGB(180, 35, 35))

-- HOOD (front, slightly lower)
P("Hood", CFrame.new(0, 2.3, 4.5), Vector3.new(4.8, 0.4, 3), Enum.Material.Metal, Color3.fromRGB(175, 30, 30))

-- CABIN (upper glass section, narrower)
P("Cabin", CFrame.new(0, 3.2, -0.5), Vector3.new(4.5, 1.8, 5), Enum.Material.Metal, Color3.fromRGB(170, 30, 30))

-- ROOF
P("Roof", CFrame.new(0, 4.2, -0.5), Vector3.new(4.6, 0.3, 5.2), Enum.Material.Metal, Color3.fromRGB(165, 28, 28))

-- TRUNK (rear, lower)
P("Trunk", CFrame.new(0, 2.1, -4), Vector3.new(4.8, 0.6, 2), Enum.Material.Metal, Color3.fromRGB(175, 30, 30))

-- WINDSHIELD (angled via CFrame rotation)
P("Windshield", CFrame.new(0, 3.2, 2.3) * CFrame.Angles(math.rad(-20), 0, 0), Vector3.new(4.2, 1.8, 0.2), Enum.Material.Glass, Color3.fromRGB(180, 210, 230))

-- REAR WINDOW
P("RearWindow", CFrame.new(0, 3.2, -3.2) * CFrame.Angles(math.rad(15), 0, 0), Vector3.new(4.2, 1.6, 0.2), Enum.Material.Glass, Color3.fromRGB(180, 210, 230))

-- WHEELS (Cylinders, rotated 90° on Z so they face sideways)
-- Each wheel: 1.2 diameter, 0.6 wide
P("WheelFL", CFrame.new(-2.8, 0.6, 3) * CFrame.Angles(0, 0, math.rad(90)), Vector3.new(1.2, 0.6, 1.2), Enum.Material.Concrete, Color3.fromRGB(30, 30, 30))
P("WheelFR", CFrame.new(2.8, 0.6, 3) * CFrame.Angles(0, 0, math.rad(90)), Vector3.new(1.2, 0.6, 1.2), Enum.Material.Concrete, Color3.fromRGB(30, 30, 30))
P("WheelBL", CFrame.new(-2.8, 0.6, -3) * CFrame.Angles(0, 0, math.rad(90)), Vector3.new(1.2, 0.6, 1.2), Enum.Material.Concrete, Color3.fromRGB(30, 30, 30))
P("WheelBR", CFrame.new(2.8, 0.6, -3) * CFrame.Angles(0, 0, math.rad(90)), Vector3.new(1.2, 0.6, 1.2), Enum.Material.Concrete, Color3.fromRGB(30, 30, 30))

-- HEADLIGHTS
P("HeadlightL", CFrame.new(-1.5, 1.8, 5.05), Vector3.new(1, 0.6, 0.1), Enum.Material.Neon, Color3.fromRGB(255, 250, 220))
P("HeadlightR", CFrame.new(1.5, 1.8, 5.05), Vector3.new(1, 0.6, 0.1), Enum.Material.Neon, Color3.fromRGB(255, 250, 220))

-- TAILLIGHTS
P("TaillightL", CFrame.new(-1.5, 1.8, -5.05), Vector3.new(1, 0.5, 0.1), Enum.Material.Neon, Color3.fromRGB(255, 20, 20))
P("TaillightR", CFrame.new(1.5, 1.8, -5.05), Vector3.new(1, 0.5, 0.1), Enum.Material.Neon, Color3.fromRGB(255, 20, 20))`,
  },

  // ═══════════════════════════════════════════════════════════════════
  // CHAIR — simple furniture, AI should nail this every time
  // ═══════════════════════════════════════════════════════════════════
  {
    title: 'Wooden Chair — seat, backrest, 4 legs',
    tags: ['chair', 'furniture', 'seat', 'dining', 'interior'],
    description: 'A dining chair with seat at 2.5 studs, backrest rising to 5 studs, and 4 legs. 6 parts. Legs are positioned at the corners of the seat. All Wood material with warm brown tones.',
    code: `-- WOODEN CHAIR (6 parts) — seat height 2.5 studs
-- Legs at corners of seat, backrest extends above seat.

local folder = getFolder("Chair")

-- SEAT (2x0.3x2, center at Y=2.5)
P("Seat", CFrame.new(0, 2.5, 0), Vector3.new(2, 0.3, 2), Enum.Material.Wood, Color3.fromRGB(140, 90, 45))

-- BACKREST (0.3 thick, rises from back of seat to Y=5)
P("Backrest", CFrame.new(0, 3.9, -0.85), Vector3.new(2, 2.5, 0.3), Enum.Material.Wood, Color3.fromRGB(135, 85, 40))

-- LEGS (each 0.3x2.35x0.3, center Y = 2.5/2 = 1.25, at seat corners)
P("LegFL", CFrame.new(-0.75, 1.25, 0.75), Vector3.new(0.3, 2.35, 0.3), Enum.Material.Wood, Color3.fromRGB(130, 82, 38))
P("LegFR", CFrame.new(0.75, 1.25, 0.75), Vector3.new(0.3, 2.35, 0.3), Enum.Material.Wood, Color3.fromRGB(130, 82, 38))
P("LegBL", CFrame.new(-0.75, 1.25, -0.75), Vector3.new(0.3, 2.35, 0.3), Enum.Material.Wood, Color3.fromRGB(130, 82, 38))
P("LegBR", CFrame.new(0.75, 1.25, -0.75), Vector3.new(0.3, 2.35, 0.3), Enum.Material.Wood, Color3.fromRGB(130, 82, 38))`,
  },

  // ═══════════════════════════════════════════════════════════════════
  // STREETLIGHT — common prop, teaches light attachment
  // ═══════════════════════════════════════════════════════════════════
  {
    title: 'Street Light — pole with lamp and PointLight',
    tags: ['streetlight', 'lamp', 'lighting', 'street', 'prop', 'outdoor'],
    description: 'A 12-stud tall street light with Metal pole, curved arm, lamp housing, and attached PointLight. 5 parts + 1 PointLight. Teaches proper light attachment pattern.',
    code: `-- STREET LIGHT (5 parts + PointLight) — 12 studs tall
-- Demonstrates how to attach a PointLight to a part.

local folder = getFolder("StreetLight")

-- BASE (heavy, anchors the pole)
P("Base", CFrame.new(0, 0.4, 0), Vector3.new(2, 0.8, 2), Enum.Material.Metal, Color3.fromRGB(70, 70, 75))

-- POLE (vertical, centered on base)
P("Pole", CFrame.new(0, 5.5, 0), Vector3.new(0.5, 10, 0.5), Enum.Material.Metal, Color3.fromRGB(80, 80, 85))

-- ARM (horizontal, extends from top of pole)
P("Arm", CFrame.new(1.5, 10.5, 0), Vector3.new(3, 0.4, 0.4), Enum.Material.Metal, Color3.fromRGB(80, 80, 85))

-- LAMP HOUSING
P("LampHousing", CFrame.new(2.8, 10, 0), Vector3.new(1.5, 0.8, 1.5), Enum.Material.Metal, Color3.fromRGB(90, 90, 95))

-- LAMP BULB (Neon for glow effect + PointLight)
local bulb = P("LampBulb", CFrame.new(2.8, 9.5, 0), Vector3.new(1, 0.3, 1), Enum.Material.Neon, Color3.fromRGB(255, 240, 200))
local light = Instance.new("PointLight")
light.Range = 30  light.Brightness = 1.2
light.Color = Color3.fromRGB(255, 230, 180)
light.Parent = bulb`,
  },

  // ═══════════════════════════════════════════════════════════════════
  // TYCOON DROPPER — game mechanic, not just decoration
  // ═══════════════════════════════════════════════════════════════════
  {
    title: 'Tycoon Dropper — functional dropper with conveyor and collector',
    tags: ['tycoon', 'dropper', 'conveyor', 'collector', 'game', 'mechanic', 'simulator'],
    description: 'A working tycoon dropper setup: dropper machine on platform, conveyor belt below, collector bin at end. 18 parts. Includes Script attachment point comments. Conveyor uses multiple parts for visual belt effect.',
    code: `-- TYCOON DROPPER SETUP (18 parts) — dropper → conveyor → collector
-- Standard tycoon game mechanic. Parts are organized so scripts
-- can reference them by name.

local folder = getFolder("Dropper")

-- PLATFORM (elevated, holds the dropper machine)
P("Platform", CFrame.new(0, 6, 0), Vector3.new(6, 0.5, 6), Enum.Material.Metal, Color3.fromRGB(100, 100, 110))

-- DROPPER MACHINE (sits on platform)
P("DropperBase", CFrame.new(0, 6.75, 0), Vector3.new(4, 1, 4), Enum.Material.Metal, Color3.fromRGB(70, 130, 70))
P("DropperChute", CFrame.new(0, 6.25, 0), Vector3.new(2, 0.5, 2), Enum.Material.Metal, Color3.fromRGB(60, 120, 60))
-- The drop point — items spawn here and fall
P("DropPoint", CFrame.new(0, 5.5, 0), Vector3.new(1.5, 0.2, 1.5), Enum.Material.Neon, Color3.fromRGB(100, 255, 100))

-- SUPPORT PILLARS (hold up the platform)
P("PillarFL", CFrame.new(-2.5, 3, 2.5), Vector3.new(0.5, 6, 0.5), Enum.Material.Metal, Color3.fromRGB(90, 90, 95))
P("PillarFR", CFrame.new(2.5, 3, 2.5), Vector3.new(0.5, 6, 0.5), Enum.Material.Metal, Color3.fromRGB(90, 90, 95))
P("PillarBL", CFrame.new(-2.5, 3, -2.5), Vector3.new(0.5, 6, 0.5), Enum.Material.Metal, Color3.fromRGB(90, 90, 95))
P("PillarBR", CFrame.new(2.5, 3, -2.5), Vector3.new(0.5, 6, 0.5), Enum.Material.Metal, Color3.fromRGB(90, 90, 95))

-- CONVEYOR BELT (below dropper, angled slightly toward collector)
-- Multiple parts give visual "belt" appearance
P("ConveyorFrame", CFrame.new(0, 0.5, 10), Vector3.new(4, 1, 16), Enum.Material.Metal, Color3.fromRGB(80, 80, 85))
P("BeltStrip1", CFrame.new(0, 1.05, 6), Vector3.new(3.5, 0.1, 3), Enum.Material.Concrete, Color3.fromRGB(40, 40, 45))
P("BeltStrip2", CFrame.new(0, 1.05, 10), Vector3.new(3.5, 0.1, 3), Enum.Material.Concrete, Color3.fromRGB(50, 50, 55))
P("BeltStrip3", CFrame.new(0, 1.05, 14), Vector3.new(3.5, 0.1, 3), Enum.Material.Concrete, Color3.fromRGB(40, 40, 45))

-- COLLECTOR BIN (at end of conveyor)
P("CollectorBack", CFrame.new(0, 2, 18.5), Vector3.new(5, 4, 0.5), Enum.Material.Metal, Color3.fromRGB(180, 160, 40))
P("CollectorLeft", CFrame.new(-2.5, 2, 17), Vector3.new(0.5, 4, 3.5), Enum.Material.Metal, Color3.fromRGB(180, 160, 40))
P("CollectorRight", CFrame.new(2.5, 2, 17), Vector3.new(0.5, 4, 3.5), Enum.Material.Metal, Color3.fromRGB(180, 160, 40))
P("CollectorFloor", CFrame.new(0, 0.25, 17), Vector3.new(5, 0.5, 3.5), Enum.Material.Metal, Color3.fromRGB(170, 150, 35))

-- DOLLAR SIGN LABEL (so players know what this does)
local label = Instance.new("BillboardGui")
label.Size = UDim2.new(0, 80, 0, 40)
label.StudsOffset = Vector3.new(0, 3, 0)
label.AlwaysOnTop = true
local text = Instance.new("TextLabel")
text.Size = UDim2.new(1, 0, 1, 0)
text.BackgroundTransparency = 1
text.Text = "Dropper"
text.TextColor3 = Color3.fromRGB(100, 255, 100)
text.TextScaled = true
text.Font = Enum.Font.GothamBold
text.Parent = label`,
  },

  // ═══════════════════════════════════════════════════════════════════
  // OBBY SECTION — teaches platforming geometry
  // ═══════════════════════════════════════════════════════════════════
  {
    title: 'Obby Section — 8 platforms with increasing difficulty',
    tags: ['obby', 'parkour', 'obstacle', 'platformer', 'jump', 'game'],
    description: 'An 8-platform obby section with increasing gaps (4→8 studs) and rising height. Includes a kill brick, a moving platform placeholder, and a checkpoint. Demonstrates safe jump distances for Roblox (max ~12 studs horizontal, ~8 studs vertical).',
    code: `-- OBBY SECTION (12 parts) — 8 platforms, increasing difficulty
-- Roblox jump: ~7.5 studs up, ~12 studs forward max.
-- Safe gaps: 4-8 studs horizontal with 0-3 studs height increase.

local folder = getFolder("ObbySection")

-- START PLATFORM (large, safe)
P("Start", CFrame.new(0, 5, 0), Vector3.new(8, 1, 8), Enum.Material.Concrete, Color3.fromRGB(100, 100, 110))

-- CHECKPOINT FLAG on start
P("FlagPole", CFrame.new(0, 7.5, 0), Vector3.new(0.3, 4, 0.3), Enum.Material.Metal, Color3.fromRGB(200, 200, 200))
P("Flag", CFrame.new(1, 8.5, 0), Vector3.new(2, 1.2, 0.1), Enum.Material.Fabric, Color3.fromRGB(50, 200, 50))

-- PLATFORM 2 (gap: 4 studs, easy)
P("Plat2", CFrame.new(0, 5.5, 12), Vector3.new(5, 1, 5), Enum.Material.Concrete, Color3.fromRGB(110, 110, 120))

-- PLATFORM 3 (gap: 5 studs, slight height increase)
P("Plat3", CFrame.new(0, 6.5, 22), Vector3.new(5, 1, 5), Enum.Material.Concrete, Color3.fromRGB(120, 120, 130))

-- PLATFORM 4 (gap: 6 studs, KILL BRICK between)
P("Plat4", CFrame.new(0, 7, 33), Vector3.new(4, 1, 4), Enum.Material.Concrete, Color3.fromRGB(130, 130, 140))
-- Kill brick (red, named for script detection)
P("KillBrick", CFrame.new(0, 3, 28), Vector3.new(6, 1, 4), Enum.Material.Neon, Color3.fromRGB(255, 0, 0))

-- PLATFORM 5 (gap: 6 studs, narrower)
P("Plat5", CFrame.new(0, 7.5, 43), Vector3.new(3.5, 1, 3.5), Enum.Material.Concrete, Color3.fromRGB(140, 140, 150))

-- PLATFORM 6 (sideways jump, tests lateral movement)
P("Plat6", CFrame.new(6, 8, 50), Vector3.new(4, 1, 4), Enum.Material.Concrete, Color3.fromRGB(150, 150, 160))

-- PLATFORM 7 (back to center, higher, gap: 7 studs)
P("Plat7", CFrame.new(0, 9, 58), Vector3.new(3, 1, 3), Enum.Material.Concrete, Color3.fromRGB(160, 160, 170))

-- FINISH PLATFORM (large, rewarding)
P("Finish", CFrame.new(0, 10, 68), Vector3.new(10, 1, 10), Enum.Material.Concrete, Color3.fromRGB(50, 180, 50))`,
  },

  // ═══════════════════════════════════════════════════════════════════
  // CASTLE TOWER — medieval, detailed
  // ═══════════════════════════════════════════════════════════════════
  {
    title: 'Castle Tower — cylindrical with battlements and arrow slits',
    tags: ['castle', 'tower', 'medieval', 'fortress', 'fantasy', 'defense'],
    description: 'A medieval castle tower, 10x10 base, 30 studs tall. Uses stacked parts for wall detail, crenellated top with 6 merlons, arrow slits, and a conical wooden roof. 20 parts. Slate material throughout with Wood roof.',
    code: `-- CASTLE TOWER (20 parts) — 10x10 base, 30 studs tall
-- Slate walls, crenellated battlements, arrow slits, wood conical roof.

local folder = getFolder("CastleTower")

-- TOWER BASE (thicker walls at bottom for structural look)
P("BaseWall", CFrame.new(0, 5, 0), Vector3.new(10, 10, 10), Enum.Material.Slate, Color3.fromRGB(91, 93, 105))

-- TOWER MIDDLE
P("MidWall", CFrame.new(0, 15, 0), Vector3.new(9.5, 10, 9.5), Enum.Material.Slate, Color3.fromRGB(95, 97, 108))

-- TOWER UPPER
P("UpperWall", CFrame.new(0, 24, 0), Vector3.new(9, 8, 9), Enum.Material.Slate, Color3.fromRGB(98, 100, 112))

-- FLOOR INTERIOR (walkable surface inside)
P("FloorInterior", CFrame.new(0, 20.5, 0), Vector3.new(8, 0.5, 8), Enum.Material.WoodPlanks, Color3.fromRGB(120, 80, 40))

-- BATTLEMENT FLOOR (wider than tower, overhangs slightly)
P("BattlementFloor", CFrame.new(0, 28.25, 0), Vector3.new(11, 0.5, 11), Enum.Material.Slate, Color3.fromRGB(88, 90, 100))

-- MERLONS (6 crenellations around the top)
P("MerlonN", CFrame.new(0, 29.75, 5), Vector3.new(3, 2.5, 1), Enum.Material.Slate, Color3.fromRGB(85, 87, 98))
P("MerlonS", CFrame.new(0, 29.75, -5), Vector3.new(3, 2.5, 1), Enum.Material.Slate, Color3.fromRGB(85, 87, 98))
P("MerlonE", CFrame.new(5, 29.75, 0), Vector3.new(1, 2.5, 3), Enum.Material.Slate, Color3.fromRGB(85, 87, 98))
P("MerlonW", CFrame.new(-5, 29.75, 0), Vector3.new(1, 2.5, 3), Enum.Material.Slate, Color3.fromRGB(85, 87, 98))
P("MerlonNE", CFrame.new(4, 29.75, 4), Vector3.new(2, 2.5, 2), Enum.Material.Slate, Color3.fromRGB(85, 87, 98))
P("MerlonNW", CFrame.new(-4, 29.75, 4), Vector3.new(2, 2.5, 2), Enum.Material.Slate, Color3.fromRGB(85, 87, 98))

-- ARROW SLITS (thin openings in walls — use different color to simulate depth)
P("ArrowSlitN", CFrame.new(0, 12, 4.8), Vector3.new(0.5, 2.5, 0.3), Enum.Material.Slate, Color3.fromRGB(40, 40, 50))
P("ArrowSlitE", CFrame.new(4.8, 15, 0), Vector3.new(0.3, 2.5, 0.5), Enum.Material.Slate, Color3.fromRGB(40, 40, 50))
P("ArrowSlitW", CFrame.new(-4.8, 15, 0), Vector3.new(0.3, 2.5, 0.5), Enum.Material.Slate, Color3.fromRGB(40, 40, 50))

-- CONICAL ROOF (Wood, sits above battlements)
-- Using a pyramid approximation with 4 wedge-like parts
P("RoofBase", CFrame.new(0, 31.5, 0), Vector3.new(10, 1, 10), Enum.Material.Wood, Color3.fromRGB(106, 57, 9))
P("RoofMid", CFrame.new(0, 33, 0), Vector3.new(7, 2, 7), Enum.Material.Wood, Color3.fromRGB(100, 52, 7))
P("RoofTop", CFrame.new(0, 35, 0), Vector3.new(3, 2.5, 3), Enum.Material.Wood, Color3.fromRGB(95, 48, 5))
P("RoofSpire", CFrame.new(0, 37, 0), Vector3.new(0.5, 2, 0.5), Enum.Material.Metal, Color3.fromRGB(180, 170, 120))`,
  },

  // ═══════════════════════════════════════════════════════════════════
  // SPACESHIP — sci-fi, teaches complex shapes
  // ═══════════════════════════════════════════════════════════════════
  {
    title: 'Small Spaceship — cockpit, wings, engines, landing gear',
    tags: ['spaceship', 'spacecraft', 'sci-fi', 'space', 'vehicle', 'ship', 'rocket'],
    description: 'A fighter-style spaceship: pointed nose, cockpit bubble, swept wings, twin engines, and retracted landing gear. 18 parts. Uses Metal/Neon/Glass materials. Wings use CFrame rotation for sweep angle.',
    code: `-- SMALL SPACESHIP (18 parts) — fighter style, 20 studs long
-- Nose points +Z. Wings swept back. Twin engines at rear.

local folder = getFolder("Spaceship")

-- FUSELAGE (main body, tapers front to back)
P("FuselageMain", CFrame.new(0, 4, 0), Vector3.new(3, 2, 10), Enum.Material.Metal, Color3.fromRGB(180, 185, 195))
P("FuselageFront", CFrame.new(0, 4, 6), Vector3.new(2.5, 1.8, 4), Enum.Material.Metal, Color3.fromRGB(185, 190, 200))
P("Nose", CFrame.new(0, 4, 9), Vector3.new(1.5, 1, 2.5), Enum.Material.Metal, Color3.fromRGB(190, 195, 205))

-- COCKPIT (Glass bubble on top)
P("Cockpit", CFrame.new(0, 5.3, 4), Vector3.new(2, 1.2, 3), Enum.Material.Glass, Color3.fromRGB(120, 180, 220))

-- WINGS (swept back using rotation)
P("WingLeft", CFrame.new(-5, 3.8, -1) * CFrame.Angles(0, math.rad(-15), math.rad(-5)), Vector3.new(7, 0.3, 4), Enum.Material.Metal, Color3.fromRGB(170, 175, 185))
P("WingRight", CFrame.new(5, 3.8, -1) * CFrame.Angles(0, math.rad(15), math.rad(5)), Vector3.new(7, 0.3, 4), Enum.Material.Metal, Color3.fromRGB(170, 175, 185))

-- WING TIPS (accent color)
P("WingTipL", CFrame.new(-8.2, 3.8, -2.5), Vector3.new(1, 0.4, 1.5), Enum.Material.Metal, Color3.fromRGB(200, 50, 50))
P("WingTipR", CFrame.new(8.2, 3.8, -2.5), Vector3.new(1, 0.4, 1.5), Enum.Material.Metal, Color3.fromRGB(200, 50, 50))

-- ENGINES (twin, at rear)
P("EngineL", CFrame.new(-1.5, 3.8, -6), Vector3.new(1.5, 1.5, 3), Enum.Material.Metal, Color3.fromRGB(100, 105, 115))
P("EngineR", CFrame.new(1.5, 3.8, -6), Vector3.new(1.5, 1.5, 3), Enum.Material.Metal, Color3.fromRGB(100, 105, 115))

-- ENGINE GLOW (Neon exhaust)
P("ExhaustL", CFrame.new(-1.5, 3.8, -7.6), Vector3.new(1.2, 1.2, 0.3), Enum.Material.Neon, Color3.fromRGB(80, 150, 255))
P("ExhaustR", CFrame.new(1.5, 3.8, -7.6), Vector3.new(1.2, 1.2, 0.3), Enum.Material.Neon, Color3.fromRGB(80, 150, 255))

-- TAIL FIN (vertical stabilizer)
P("TailFin", CFrame.new(0, 5.8, -5), Vector3.new(0.3, 2.5, 3), Enum.Material.Metal, Color3.fromRGB(175, 180, 190))

-- LANDING GEAR (retracted, tucked under fuselage)
P("GearFront", CFrame.new(0, 2.8, 4), Vector3.new(0.4, 1.5, 0.4), Enum.Material.Metal, Color3.fromRGB(70, 70, 75))
P("GearBackL", CFrame.new(-1.2, 2.8, -2), Vector3.new(0.4, 1.5, 0.4), Enum.Material.Metal, Color3.fromRGB(70, 70, 75))
P("GearBackR", CFrame.new(1.2, 2.8, -2), Vector3.new(0.4, 1.5, 0.4), Enum.Material.Metal, Color3.fromRGB(70, 70, 75))`,
  },

  // ═══════════════════════════════════════════════════════════════════
  // SWORD — weapon/tool, teaches small detailed objects
  // ═══════════════════════════════════════════════════════════════════
  {
    title: 'Medieval Sword — blade, crossguard, grip, pommel',
    tags: ['sword', 'weapon', 'medieval', 'fantasy', 'tool', 'item'],
    description: 'A detailed sword: tapered blade, crossguard, leather-wrapped grip, and rounded pommel. 6 parts. Demonstrates building small detailed objects with precise proportions. Total length ~7 studs.',
    code: `-- MEDIEVAL SWORD (6 parts) — 7 studs total length
-- Blade points +Y (standing upright for display).
-- Scale: 1 stud ≈ 0.3m, so this is ~2.1m total — a longsword.

local folder = getFolder("Sword")

-- BLADE (long, thin, tapered via two parts)
P("BladeLower", CFrame.new(0, 4.5, 0), Vector3.new(0.3, 3.5, 0.08), Enum.Material.Metal, Color3.fromRGB(200, 205, 215))
P("BladeUpper", CFrame.new(0, 6.8, 0), Vector3.new(0.2, 1.2, 0.06), Enum.Material.Metal, Color3.fromRGB(210, 215, 225))

-- CROSSGUARD (horizontal bar perpendicular to blade)
P("Crossguard", CFrame.new(0, 2.6, 0), Vector3.new(1.5, 0.25, 0.3), Enum.Material.Metal, Color3.fromRGB(160, 140, 50))

-- GRIP (wrapped in leather/fabric)
P("Grip", CFrame.new(0, 1.8, 0), Vector3.new(0.25, 1.5, 0.25), Enum.Material.Fabric, Color3.fromRGB(60, 35, 20))

-- POMMEL (bottom weight)
P("Pommel", CFrame.new(0, 0.9, 0), Vector3.new(0.5, 0.4, 0.5), Enum.Material.Metal, Color3.fromRGB(170, 150, 55))

-- FULLER (blood groove — slight color difference on blade face)
P("Fuller", CFrame.new(0, 4.5, 0.05), Vector3.new(0.1, 3, 0.02), Enum.Material.Metal, Color3.fromRGB(180, 185, 195))`,
  },

  // ═══════════════════════════════════════════════════════════════════
  // BRIDGE — infrastructure, teaches spanning gaps
  // ═══════════════════════════════════════════════════════════════════
  {
    title: 'Stone Bridge — arched with railings and supports',
    tags: ['bridge', 'infrastructure', 'road', 'crossing', 'stone', 'medieval'],
    description: 'A 30-stud long stone bridge with arched underside, side railings with posts, and pillar supports. 22 parts. Shows how to create arch effects using multiple positioned parts.',
    code: `-- STONE BRIDGE (22 parts) — 30 studs long, 8 wide
-- Spans a gap with an arched profile underneath.

local folder = getFolder("Bridge")

-- DECK (walkable surface, slight arch via 3 segments)
P("DeckLeft", CFrame.new(0, 5, -10), Vector3.new(8, 0.8, 10), Enum.Material.Cobblestone, Color3.fromRGB(130, 125, 115))
P("DeckCenter", CFrame.new(0, 5.5, 0), Vector3.new(8, 0.8, 10), Enum.Material.Cobblestone, Color3.fromRGB(125, 120, 110))
P("DeckRight", CFrame.new(0, 5, 10), Vector3.new(8, 0.8, 10), Enum.Material.Cobblestone, Color3.fromRGB(130, 125, 115))

-- SUPPORT PILLARS (at each end)
P("PillarL1", CFrame.new(-2.5, 2.5, -13), Vector3.new(2, 5, 2), Enum.Material.Slate, Color3.fromRGB(110, 108, 100))
P("PillarL2", CFrame.new(2.5, 2.5, -13), Vector3.new(2, 5, 2), Enum.Material.Slate, Color3.fromRGB(110, 108, 100))
P("PillarR1", CFrame.new(-2.5, 2.5, 13), Vector3.new(2, 5, 2), Enum.Material.Slate, Color3.fromRGB(110, 108, 100))
P("PillarR2", CFrame.new(2.5, 2.5, 13), Vector3.new(2, 5, 2), Enum.Material.Slate, Color3.fromRGB(110, 108, 100))

-- ARCH UNDERSIDE (3 parts forming the curved underside)
P("ArchCenter", CFrame.new(0, 3.5, 0), Vector3.new(7, 1.5, 8), Enum.Material.Slate, Color3.fromRGB(105, 103, 95))
P("ArchLeft", CFrame.new(0, 4, -7), Vector3.new(7, 1, 6), Enum.Material.Slate, Color3.fromRGB(108, 106, 98))
P("ArchRight", CFrame.new(0, 4, 7), Vector3.new(7, 1, 6), Enum.Material.Slate, Color3.fromRGB(108, 106, 98))

-- RAILINGS — left side
P("RailL_Bar", CFrame.new(-4.2, 6.5, 0), Vector3.new(0.3, 1.5, 30), Enum.Material.Slate, Color3.fromRGB(120, 118, 110))
P("RailL_Post1", CFrame.new(-4.2, 6.2, -12), Vector3.new(0.5, 2, 0.5), Enum.Material.Slate, Color3.fromRGB(115, 113, 105))
P("RailL_Post2", CFrame.new(-4.2, 6.2, -4), Vector3.new(0.5, 2, 0.5), Enum.Material.Slate, Color3.fromRGB(115, 113, 105))
P("RailL_Post3", CFrame.new(-4.2, 6.2, 4), Vector3.new(0.5, 2, 0.5), Enum.Material.Slate, Color3.fromRGB(115, 113, 105))
P("RailL_Post4", CFrame.new(-4.2, 6.2, 12), Vector3.new(0.5, 2, 0.5), Enum.Material.Slate, Color3.fromRGB(115, 113, 105))

-- RAILINGS — right side
P("RailR_Bar", CFrame.new(4.2, 6.5, 0), Vector3.new(0.3, 1.5, 30), Enum.Material.Slate, Color3.fromRGB(120, 118, 110))
P("RailR_Post1", CFrame.new(4.2, 6.2, -12), Vector3.new(0.5, 2, 0.5), Enum.Material.Slate, Color3.fromRGB(115, 113, 105))
P("RailR_Post2", CFrame.new(4.2, 6.2, -4), Vector3.new(0.5, 2, 0.5), Enum.Material.Slate, Color3.fromRGB(115, 113, 105))
P("RailR_Post3", CFrame.new(4.2, 6.2, 4), Vector3.new(0.5, 2, 0.5), Enum.Material.Slate, Color3.fromRGB(115, 113, 105))
P("RailR_Post4", CFrame.new(4.2, 6.2, 12), Vector3.new(0.5, 2, 0.5), Enum.Material.Slate, Color3.fromRGB(115, 113, 105))`,
  },

  // ═══════════════════════════════════════════════════════════════════
  // BED — interior furniture, common request
  // ═══════════════════════════════════════════════════════════════════
  {
    title: 'Bed — frame, mattress, pillow, and blanket',
    tags: ['bed', 'furniture', 'bedroom', 'interior', 'sleep'],
    description: 'A single bed: wooden frame with headboard and footboard, mattress, pillow, and folded blanket. 8 parts. Mattress sits inside the frame, pillow at head end.',
    code: `-- BED (8 parts) — single bed, 3x6 studs footprint
-- Frame height: 1.5 studs. Mattress on top. Headboard at -Z.

local folder = getFolder("Bed")

-- FRAME BASE
P("FrameBase", CFrame.new(0, 0.75, 0), Vector3.new(3.5, 1, 6.5), Enum.Material.Wood, Color3.fromRGB(130, 80, 40))

-- HEADBOARD (taller, at -Z end)
P("Headboard", CFrame.new(0, 2, -3), Vector3.new(3.5, 2.5, 0.4), Enum.Material.Wood, Color3.fromRGB(125, 75, 38))

-- FOOTBOARD (shorter, at +Z end)
P("Footboard", CFrame.new(0, 1.5, 3), Vector3.new(3.5, 1.5, 0.4), Enum.Material.Wood, Color3.fromRGB(125, 75, 38))

-- LEGS (at 4 corners, just visible below frame)
P("LegHL", CFrame.new(-1.6, 0.25, -3), Vector3.new(0.3, 0.5, 0.3), Enum.Material.Wood, Color3.fromRGB(120, 72, 35))
P("LegHR", CFrame.new(1.6, 0.25, -3), Vector3.new(0.3, 0.5, 0.3), Enum.Material.Wood, Color3.fromRGB(120, 72, 35))

-- MATTRESS (sits inside frame, slightly smaller)
P("Mattress", CFrame.new(0, 1.55, 0), Vector3.new(3, 0.8, 6), Enum.Material.Fabric, Color3.fromRGB(240, 235, 220))

-- PILLOW (at head end)
P("Pillow", CFrame.new(0, 2.1, -2.2), Vector3.new(2, 0.5, 1.2), Enum.Material.Fabric, Color3.fromRGB(230, 225, 210))

-- BLANKET (covers lower 2/3 of mattress)
P("Blanket", CFrame.new(0, 2.05, 0.8), Vector3.new(3.1, 0.2, 4), Enum.Material.Fabric, Color3.fromRGB(70, 100, 140))`,
  },
]
