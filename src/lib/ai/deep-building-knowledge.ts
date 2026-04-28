/**
 * Deep Building Knowledge — comprehensive reference injected into AI system prompts.
 *
 * This is NOT templates or pre-written Luau. This is UNDERSTANDING — proportions,
 * ratios, material choices, design principles, variation techniques — so the AI
 * generates UNIQUE builds every time from first principles.
 *
 * Sections:
 *   1. Part Anatomy — how real objects decompose into Parts
 *   2. Architectural Styles — 20 complete style guides
 *   3. Game Design Patterns — system design knowledge
 *   4. Roblox-Specific Building Rules
 *   5. Variation Techniques — how to make every build unique
 */

export const DEEP_BUILDING_KNOWLEDGE: string = `
═══════════════════════════════════════════════════════════════════════════════
 SECTION 1: PART ANATOMY — How Real Objects Decompose Into Roblox Parts
═══════════════════════════════════════════════════════════════════════════════

Every real-world object can be broken into primitive geometric shapes. Your job is
to identify those shapes, assign correct proportions, pick materials, and position
them precisely. NEVER use a single Part for anything recognizable.

Reference scale: Roblox character = 5 studs tall, 2 studs wide, 1 stud deep.
Door = 4 wide x 7 tall. Window = 3 wide x 4 tall. Ceiling height = 12 studs.

────────────────────────────────────────────────────────────────────────────────
1.1 TREES
────────────────────────────────────────────────────────────────────────────────
Part count: minimum 8, ideal 15-20, showcase 25-35

TRUNK:
- Shape: Cylinder (Part with SpecialMesh type Cylinder, or a tall Part)
- Height: 6-14 studs depending on tree type
- Diameter: height / 6 to height / 4 (taller trees are proportionally thinner)
- Taper: top diameter = 60-70% of base diameter. Use two stacked cylinders or
  a slight scale trick to simulate taper
- Material: WoodPlanks or Wood
- Color: Dark brown base (RGB 80,55,35), lighter brown mid (RGB 100,70,45)

ROOT SPREAD:
- 2-4 root bumps at base, each a flattened cylinder or wedge
- Extend 1-2 studs outward from trunk base
- Slight upward angle (10-15 degrees from ground)
- Color: same as trunk base, slightly darker
- Material: Wood

BRANCHES:
- Start at 55-70% of trunk height
- 2-4 main branches, each an angled cylinder
- Branch angle from trunk: 30-60 degrees from vertical
- Branch diameter: 25-40% of trunk diameter at that height
- Length: 2-5 studs
- Material: Wood, slightly lighter than trunk

CANOPY:
- 3-6 overlapping spheres (SpecialMesh type Sphere) at varying heights
- Bottom of canopy starts where branches begin
- Canopy width: 1.5x to 2.5x trunk height
- Height variation between clusters: 1-3 studs
- Color variation: use 2-3 shades of green per tree
  - Deep forest: RGB(30,80,30), (40,95,40), (50,110,45)
  - Bright/spring: RGB(60,140,50), (75,160,60), (90,175,70)
  - Autumn: mix oranges RGB(180,100,30) with remaining greens
  - Dead/winter: no canopy spheres, add bare branch stubs instead
- Material: Grass or Fabric for soft look

GROUND DETAIL:
- Shadow disk: dark semi-transparent Part (0.3 transparency) flat on ground beneath
- Leaf scatter: 2-4 tiny flat Parts around base, slight tilt, green/brown
- Mushrooms or flowers at base: 1-2 tiny colored Parts for interest

TREE TYPE VARIATIONS:
- Oak: wide canopy (2x height), thick trunk, rounded top
- Pine/Conifer: narrow tall canopy, use cone shape (stacked disks decreasing in size), trunk visible higher
- Palm: thin tall trunk (height/8 diameter), no branches, 4-6 long drooping leaf Parts at very top
- Willow: normal trunk, canopy replaced with many thin hanging Parts (vines/leaves) from branch tips
- Cherry blossom: medium trunk, pink canopy spheres RGB(240,180,190), scatter petal Parts
- Dead tree: trunk only, 3-5 bare branches, no canopy, Slate material, gray-brown

────────────────────────────────────────────────────────────────────────────────
1.2 HOUSES / RESIDENTIAL BUILDINGS
────────────────────────────────────────────────────────────────────────────────
Part count: minimum 40, ideal 80-120, showcase 150-250

FOUNDATION:
- 2-3 layers. Bottom widest, each layer 0.5-1 stud narrower per side
- Bottom layer: Concrete material, gray RGB(120,115,110), height 1-1.5 studs
- Middle layer: Brick or Concrete, slightly lighter, height 0.5-0.8 studs
- Top cap: thin trim strip (0.15 studs tall), different color
- Foundation extends 0.5-1.5 studs beyond wall face on all sides

WALLS:
- Thickness: 0.5-1 stud (exterior walls), 0.3-0.5 studs (interior dividers)
- Height per floor: 12 studs (gives 2.4x character height — feels spacious)
- Material options: Brick, Concrete, WoodPlanks, SmoothPlastic-alternative (use Concrete with light color)
- Multi-layer: outer shell + inner layer with 0.05 stud gap or color break

WALL-TO-ROOF TRANSITION:
- Cornice: horizontal band at top of wall, 0.3 studs tall, protruding 0.2-0.4 studs
- Frieze: decorative strip just below cornice, different material/color
- Soffit: horizontal underside of roof overhang, lighter color
- Fascia: vertical board at edge of roof overhang, matches trim

WINDOW RECESSING:
- Glass sits 0.05-0.1 studs behind outer frame
- Outer frame protrudes 0.05-0.1 studs from wall face
- Sill extends 0.3-0.5 studs outward from wall, slopes slightly downward
- Header/lintel above window extends 0.2-0.3 studs outward
- Deep-set windows (Mediterranean, Tudor): glass 0.3-0.5 studs behind wall face

ROOF TYPES AND GEOMETRY:
- Gabled: two rectangular slopes meeting at ridge. Pitch angle 25-45 degrees. Overhang 1-2 studs past wall.
- Hip: four slopes meeting at ridge or peak. Front/back slopes = triangles, sides = trapezoids.
- Gambrel (barn): each side has two slopes — steep lower section (60-70 deg) and shallow upper (20-30 deg).
- Mansard: like gambrel but on all four sides. Lower section nearly vertical.
- Flat: slight parapet wall (1-2 studs above roof plane) with coping cap.
- Shed: single slope, one wall taller than opposite.
- Roof material: varies by style. Concrete for shingles, Slate for stone, WoodPlanks for wood shingle, Metal for metal roofs.

CHIMNEY:
- Position: offset from center, on one slope of roof
- Size: 2x2 to 3x3 stud base, extends 3-5 studs above ridge
- Material: Brick (traditional) or Stone (rustic)
- Cap: thin slab on top, slightly wider than chimney shaft
- Pot: optional cylinder on cap

PORCH / VERANDA:
- Floor: extends 4-6 studs from house face, raised 1-2 studs
- Support columns: 0.4-0.6 stud diameter, spaced 4-6 studs apart
- Railing: horizontal rail at 3 studs height, vertical balusters every 0.5-0.8 studs
- Overhang: roof extends over porch, same material as main roof

DOOR:
- Opening: 4 studs wide, 7 studs tall
- Frame: three pieces (two sides + header), each 0.3-0.5 studs wide, protruding 0.08-0.12 studs
- Panel: 0.08 studs thick, fills frame interior
- Handle: small cylinder or box, 0.15 studs from door face, at 3.5 studs height from threshold
- Threshold: step Part 0.15 studs tall at base
- Transom: optional glass strip above door panel

COMMON MISTAKES TO AVOID:
- Walls meeting at corners with visible gaps — offset one wall by wall thickness
- Roof not overhanging walls — ALWAYS overhang 1-2 studs minimum
- Flat featureless walls — add bands, pilasters, quoins
- Windows all the same size on every floor — vary by floor (taller on ground, shorter on upper)
- No interior — every building should have rooms, floors, and at least basic furniture
- Foundation flush with walls — foundation MUST be wider than walls

────────────────────────────────────────────────────────────────────────────────
1.3 CARS / VEHICLES
────────────────────────────────────────────────────────────────────────────────
Part count: minimum 15, ideal 25-35, showcase 40-60

BODY PROPORTIONS (sedan):
- Length: 12-15 studs (3x character width)
- Width: 5-6 studs (character width + clearance each side)
- Height to roof: 4-5 studs (just under character height)
- Hood: 25% of length, slight downward slope (5-10 degrees)
- Cabin: 35% of length, tallest section
- Trunk: 20% of length, lower than cabin by 1-1.5 studs
- Front/rear overhang past wheels: 1.5-2 studs

WHEEL WELLS:
- Clearance above wheel: 0.3-0.5 studs
- Well shape: arch cut from fender (use negative space — the body Part has a gap)
- Or simulate with a darker inset Part behind the wheel

WHEELS:
- Diameter: 2-2.5 studs
- Width: 0.8-1 stud
- Shape: Cylinder (SpecialMesh type Cylinder)
- Tire color: very dark gray RGB(30,30,30), Material: Concrete or Fabric
- Hubcap: slightly smaller cylinder, lighter gray or chrome RGB(180,180,190), Material: Metal
- Wheelbase (front to rear axle): 55-65% of total length

WINDSHIELD:
- Angle: 30-45 degrees from horizontal (more upright = more boxy/truck-like)
- Material: Glass, Transparency 0.4-0.6
- Color: light blue-gray tint RGB(180,200,220)
- Rear window: similar but steeper angle (40-55 degrees)

HEADLIGHTS:
- Position: front face, upper third
- Shape: small flat Part (0.2 x 0.8 x 0.4) or cylinder
- Color: white or light yellow RGB(255,250,220)
- Include PointLight: Brightness 1.5, Range 15, warm white

TAILLIGHTS:
- Position: rear face, lower third
- Shape: small flat Part
- Color: red RGB(200,20,20)
- Include PointLight: Brightness 0.8, Range 6, red color

MIRRORS:
- Position: either side at A-pillar base, extending 0.5-0.8 studs outward
- Shape: thin Part (0.1 x 0.4 x 0.3)
- Support arm: tiny cylinder connecting to body
- Material: Metal face, body-color arm

BUMPERS:
- Height: 0.6-0.8 studs
- Depth: extends 0.3-0.5 studs beyond body face
- Material: Metal (chrome) or body-colored Concrete
- License plate: small Part centered on rear bumper, white with SurfaceGui

VEHICLE TYPE VARIATIONS:
- Truck/Pickup: taller (6 studs to roof), open bed behind cabin, bigger wheels (3 studs)
- Sports car: lower (3.5 studs), wider, longer hood (35% of length), smaller trunk
- SUV: tallest (6-7 studs), boxy shape, roof rack (horizontal bars on top)
- Bus: very long (25-30 studs), tall (8 studs), many windows, flat front
- Motorcycle: no body shell — exposed frame tubes, seat, handlebars, two wheels inline

────────────────────────────────────────────────────────────────────────────────
1.4 FURNITURE
────────────────────────────────────────────────────────────────────────────────

TABLE:
Part count: minimum 8, ideal 12-15
- Top slab: overhangs legs by 0.5-1 stud on each side
- Thickness: 0.3-0.5 studs
- Legs: slight taper (wider at top where they meet table)
  - Leg size: 0.4 x height x 0.4 at top, 0.3 x height x 0.3 at bottom
  - Height: 3-3.5 studs (so surface is at ~3.5 studs, comfortable for seated character)
- Cross braces: thin horizontal bars connecting legs, at 30-40% of leg height
- Edge trim: thin strip around perimeter of tabletop, 0.1 studs tall, slightly darker
- Material: WoodPlanks (top), Wood (legs), Metal (braces for modern)
- Items on surface: 2-3 small props (plate, cup, book, vase)

CHAIR:
Part count: minimum 8, ideal 12
- Seat: 2x0.3x2 studs, height 2-2.5 studs from floor
- Backrest: 2x2.5x0.25 studs, angled back 5-10 degrees from vertical
- Legs: 4 pieces, 0.3x seat-height x0.3
- Armrests (optional): thin horizontal bars at 1 stud above seat, extending from backrest to front leg
- Cushion: slightly smaller than seat, 0.15 studs thick, Fabric material, different color
- Backrest detail: 2-3 vertical slats instead of solid panel for visual interest
- Foot caps: tiny cylinder at bottom of each leg, darker color

SOFA / COUCH:
Part count: minimum 10, ideal 15-20
- Base frame: 6x1.5x3 studs (long, low, deep)
- Seat cushions: 2-3 separate Parts across width, Fabric material, 0.4 studs thick
- Back cushions: same count, taller (1.5 studs), angled back 10-15 degrees
- Armrests: 0.8x1.8x3 studs at each end, same height as back
- Feet/legs: 4-6 short cylindrical legs beneath, 0.3 studs tall
- Throw pillows: 1-2 small tilted Parts at ends, accent color
- Material: Fabric (cushions), WoodPlanks (frame/legs)

BED:
Part count: minimum 10, ideal 15-18
- Frame: rectangular box, slightly raised (0.3 studs) from floor
- Headboard: vertical panel at head end, extends 2-3 studs above mattress
  - Width: matches bed width
  - Thickness: 0.3-0.5 studs
  - Detail: horizontal or vertical groove lines (thin inset Parts)
- Footboard: shorter panel at foot end, 1-1.5 studs above mattress
- Mattress: fills frame interior, 0.8-1 stud thick, Fabric material, white or cream
- Pillows: 2 ellipsoid or flattened box shapes at head, white
- Blanket: thin Part covering lower 70% of mattress, different color, slight CFrame.Angles tilt for rumpled look
- Side rails: thin horizontal bars connecting head and foot boards
- Under-bed: optional dark Part for shadow effect

BOOKSHELF:
Part count: minimum 12, ideal 18-25
- Back panel: 0.1 stud thick, full height and width
- Side panels: 0.3 studs thick each, full height
- Shelves: 4-5 horizontal slabs, spaced 1.5-2 studs apart
- Top cap: slightly wider than body (0.2 stud overhang)
- Bottom base: thicker slab (0.4 studs), slightly wider than body
- Books: 8-15 thin upright Parts on shelves
  - Varying heights (0.8-1.5 studs), depths (0.6-0.9), widths (0.1-0.2)
  - Different colors per book: reds, blues, greens, browns, cream
  - Slight random tilt (CFrame.Angles 0, 0, ±3 degrees) for organic look
  - Group 2-3 books leaning against each other
- Decorative items between books: 1-2 small objects (globe, clock, plant pot)

DESK:
Part count: minimum 10, ideal 15
- Top surface: 5x0.3x2.5 studs, WoodPlanks material
- Legs: 2 side panels (0.3 x 3 x 2.5) instead of 4 legs, for pedestal style
  Or traditional 4 legs with cross-braces
- Drawer unit: box shape built into one side, with 2-3 drawer face Parts (thin slabs with tiny handle dots)
- Items on surface: monitor (3-part: base, stand, screen), keyboard (flat part), mouse (tiny part), desk lamp, pen holder
- Cable management: thin dark cylinder from back of monitor down behind desk

KITCHEN COUNTER:
Part count: minimum 10, ideal 15-20
- Base cabinets: continuous box, 2 studs deep, 3 studs tall, variable width
- Cabinet faces: individual panel Parts with tiny handle Parts, spaced along front
- Countertop: 0.3 studs thick, overhangs base by 0.2 studs on front, Granite material
- Backsplash: 0.1 stud thick panel on wall behind counter, 1.5 studs tall, tile-colored
- Sink: negative space (darker recessed Part in counter), with faucet (small cylinder + arch)
- Upper cabinets: mounted on wall above, same style but smaller (1.5 studs tall)
- Gap between base and upper cabinets: 2 studs (workspace area)

TOILET:
Part count: minimum 6, ideal 8-10
- Bowl: cylinder base (1.5 diameter, 1.5 tall) with SpecialMesh Sphere slightly squished
- Tank: box behind bowl (1.2 x 1.5 x 0.6), sits against wall
- Lid: thin oval Part on top of bowl, slightly tilted open (CFrame.Angles small x-rotation)
- Seat: ring shape (or two C-shaped parts) on bowl rim
- Handle: tiny cylinder on tank side
- Base trim: thin ring at floor where bowl meets ground
- Material: everything white/cream Concrete, handle Metal

BATHTUB:
Part count: minimum 8, ideal 12
- Outer shell: elongated box (5 x 2 x 2.5)
- Inner basin: slightly smaller box (4.5 x 1.5 x 2.2), inverted, creates rim
- Rim: the visible edge between outer and inner
- Faucet: small cylinder + handles (2 tiny cylinders on cross-bar)
- Drain: tiny dark circle Part at one end of basin floor
- Feet: 4 decorative feet (claw-foot style: small curved Parts) or flat base
- Tile surround: if built-in, 3 wall panels around tub in tile-colored material

────────────────────────────────────────────────────────────────────────────────
1.5 WEAPONS
────────────────────────────────────────────────────────────────────────────────

SWORD:
Part count: minimum 6, ideal 10-14
- Blade: long thin Part, tapered (wider at base, narrower at tip)
  - Full length: 4-5 studs
  - Width at base: 0.5 studs, at tip: 0.15 studs (simulate with two overlapping wedge Parts)
  - Thickness: 0.08-0.1 studs
  - Material: Metal, color: light steel gray RGB(190,195,200) or blue-steel RGB(140,150,170)
  - Edge highlight: thinner Part along blade edge, slightly brighter
  - Fuller (blood groove): thin dark line Part down center of blade
- Guard/Cross-guard: perpendicular bar at blade base
  - Width: 1.5-2 studs (wider than blade)
  - Height: 0.3 studs
  - Depth: 0.15-0.2 studs
  - Curved slightly toward blade (CFrame.Angles slight x-rotation)
  - Material: Metal, gold or dark steel
- Handle/Grip:
  - Length: 1-1.5 studs
  - Diameter: 0.25-0.3 studs (cylinder)
  - Material: Wood or Fabric (leather wrap)
  - Color: dark brown RGB(60,40,25) or black
  - Wrap detail: 3-4 thin ring Parts spaced along handle for grip texture
- Pommel: small sphere or cylinder at handle bottom
  - Size: 0.35-0.4 stud diameter
  - Material: Metal, matches guard color

STAFF / WAND:
Part count: minimum 5, ideal 8-12
- Shaft: tall cylinder, 4-6 studs long, 0.2-0.3 diameter
  - Material: Wood
  - Slight curve or knots: 1-2 small bump Parts along shaft
- Head: the magical/decorative top
  - Crystal option: 3-4 angled transparent Parts forming a rough gem shape, with PointLight inside (mystical glow)
  - Orb option: sphere with Neon material and bright color
  - Skull option: crude skull shape from 3-4 parts (sphere head + jaw wedge)
- Binding: where head meets shaft, decorative wrap (1-2 ring Parts, metal)
- Base tip: small metal cap at bottom

BOW:
Part count: minimum 6, ideal 10-12
- Limbs: two curved Parts (use CFrame.Angles to angle them), mirrored
  - Length: 2.5-3 studs each
  - Width: 0.15 studs
  - Thickness: 0.3 studs
  - Material: Wood
- Grip: center section, slightly thicker (0.2 wide), wrapped material
- String: thin Part connecting limb tips, 0.02-0.03 studs thick
  - Color: white or light tan
- Arrow (nocked): thin cylinder shaft + small wedge tip + tail feather Parts

SHIELD:
Part count: minimum 5, ideal 8-12
- Face: main flat Part, slightly curved if possible
  - Round: use Cylinder mesh, 3-3.5 stud diameter, 0.2 thick
  - Kite: tall diamond/kite shape from Parts
  - Material: Wood (wooden shield) or Metal (metal shield)
- Rim: thin ring Part around edge, metal, different color
- Boss: central raised dome (small hemisphere), metal
- Straps: 2 Parts on back side for arm attachment
- Emblem/Design: contrasting color Parts forming a simple pattern (cross, stripe, chevron)

GUN / BLASTER:
Part count: minimum 8, ideal 15-20
- Barrel: cylinder, length 2-3 studs, diameter 0.2-0.3
  - Muzzle: slightly wider ring at front end
- Body/Receiver: main box shape, 1.5 x 0.8 x 0.4 studs
- Grip: angled Part descending from body, 0.3 wide, angled 15-20 degrees back
- Trigger guard: thin curved Part forming a loop below body
- Trigger: tiny Part inside guard
- Stock: extends backward from body, 1-1.5 studs
- Scope (optional): cylinder on top, 1 stud long, 0.15 diameter, with lens Parts at each end
- Magazine: box protruding below body, 0.2 x 0.8 x 0.3
- For sci-fi blasters: add Neon material glowing strips, energy cell (transparent Part)

────────────────────────────────────────────────────────────────────────────────
1.6 CHARACTERS / CREATURES
────────────────────────────────────────────────────────────────────────────────

HUMANOID NPC (R6-style):
Part count: minimum 8, ideal 14-20
- Head: 1.2 x 1.2 x 1.2, SpecialMesh Sphere or Head type
  - Face: Decal on front surface, or SurfaceGui with features
  - Hair: 2-4 Parts shaped and colored to form hairstyle
  - Hat/Helmet: Part positioned on top of head
- Torso: 2 x 2 x 1
  - Shirt detail: different color top portion vs bottom
  - Belt: thin strip Part at waist
- Arms: 1 x 2 x 1 each
  - Shoulder connection: at torso top corners
  - Hands: optional smaller Part at arm bottom
- Legs: 1 x 2 x 1 each
  - Hip connection: at torso bottom corners
  - Shoes: different color/material on bottom 0.4 studs of each leg
- Accessory attachment points:
  - Back: 0,0.5,-0.6 from torso center (backpack, cape, wings)
  - Right hand: 0.5,-1,0 from right arm (weapon, tool)
  - Head top: 0,0.8,0 from head center (hat, crown, horns)

CREATURE BODY RATIOS:
- Small pet (cat, dog): Head 30% of body, legs 40% of body height, tail = body length
- Large beast (horse, wolf): Head 20% of body length, legs = body height, elongated torso
- Bird: compact oval body, head small (15% of body), wings = 1.5x body length when spread
- Dragon: long neck (50% of body), wings = 2x body length, thick tail = body length
- Spider: spherical abdomen + smaller thorax + 8 legs (each 3-segmented using hinges)
- Slime: single sphere with transparency 0.2-0.3, SpecialMesh Sphere, jiggly look

ZOMBIE / SKELETON VARIANT:
- Same humanoid proportions but: gray-green skin RGB(130,160,110)
- Torn clothing: Parts with irregular shapes (offset, rotated slightly)
- Glowing eyes: two small Neon Parts on face, PointLight attached
- Skeleton: thinner parts (0.3 width instead of 1), bone white color

ROBOT / MECH:
Part count: minimum 15, ideal 25-40
- Body: boxy torso, visible panel lines (thin darker strips)
- Limbs: cylinder joints at connections, rectangular segments
- Head: geometric (cube, cylinder, or dome), visor (transparent strip)
- Exhaust/vents: grid pattern Parts on back
- Lights: multiple small Neon Parts at key points
- Antenna: thin cylinder on head/shoulder
- Material: Metal throughout, with accent Neon strips

────────────────────────────────────────────────────────────────────────────────
1.7 TERRAIN FEATURES
────────────────────────────────────────────────────────────────────────────────

HILLS:
- Shape: use FillBall with varying radii
- Gentle hill: radius 20-40, Y position at 5-15 (only upper portion visible)
- Steep hill: radius 15-25, Y position at 10-20
- Mountain: cluster 3-5 overlapping FillBalls, largest in center
- Material: Grass for gentle, Rock for steep, Snow on tops above Y=50

CLIFFS:
- Vertical or near-vertical face
- Use FillBlock with tall Y dimension, thin X or Z
- Material: Rock, Slate, or Basalt
- Face roughness: multiple overlapping FillBall calls with Rock at cliff face, varying sizes
- Cliff top: transition to Grass with Mud border
- Cliff bottom: scattered boulder Parts, rubble

RIVERS:
- Width: 6-15 studs
- Depth: Y position 2-5 studs below ground level
- Shape: use sequential FillBlock calls at slight angle changes to create curves
- Material: Water
- Banks: Mud material at edges, 2-3 stud transition zone
- Details: rock Parts in shallow areas, bridge crossing points

PATHS / ROADS:
- Walking path: 4-6 studs wide, Cobblestone or Ground material
- Road: 10-14 studs wide, Asphalt material
- Highway: 20+ studs wide, lane markings (thin light-colored terrain strips)
- Curves: use multiple short straight segments at slight angles (15-30 degree turns)
- Edges: Mud or Ground material border, 1-2 studs

CAVES:
- Entrance: arch-shaped opening using FillBall with Air material to carve
- Interior: chain of FillBall Air calls creating connected chambers
- Walls: leave surrounding Rock/Slate intact
- Floor: flatten with FillBlock at consistent Y level, Ground or Sand material
- Stalactites: thin FillBlock calls with Rock pointing downward from ceiling
- Lighting: PointLight Parts placed inside for atmospheric glow

WATER BODIES:
- Pond: FillBall at Y=-3 to -5, radius 10-20, Water material
- Lake: larger FillBlock at Y=-5 to -8, Water material
- Ocean: very large FillBlock extending to map edge, Y=-10, Water material
- Shore transition: Sand at water edge, then Mud, then Grass
- Island: raised terrain in water (FillBall at higher Y)

────────────────────────────────────────────────────────────────────────────────
1.8 STREET INFRASTRUCTURE
────────────────────────────────────────────────────────────────────────────────

STREET LIGHT / LAMP POST:
Part count: minimum 8, ideal 12
- Base: hexagonal or circular slab, 2x0.3x2, Metal material, dark gray
- Pole: cylinder, 0.3 diameter, 12-15 studs tall, Metal, dark gray or black
- Decorative ring: slightly wider cylinder at 60% height, 0.4 diameter, 0.2 tall
- Arm: curved horizontal piece at top, extending 2-3 studs outward
  - Use 2-3 Parts angled to simulate curve
- Lamp housing: box or cylinder at arm tip, 1x1x1 to 1.5x1.5x1
  - Material: Metal frame with Glass panels (Transparency 0.3)
- Light: PointLight inside housing, Brightness 2-3, Range 25-35, warm white RGB(255,240,200)
- Banner (optional): flat Part hanging from arm, decorative color

TRAFFIC LIGHT:
Part count: minimum 8, ideal 12
- Pole: same as lamp post pole
- Signal head: vertical box, 0.6 x 2.4 x 0.6
  - 3 circular lens Parts on front (red top, yellow mid, green bottom)
  - Each lens: cylinder, 0.5 diameter, 0.05 deep
  - One lens has Neon material (the active one), others are dimmer
- Hood/visor: 3 small wedge Parts above each lens
- Mounting arm: horizontal bar from pole to signal head

STOP SIGN:
Part count: minimum 4, ideal 6
- Pole: thin cylinder, 0.15 diameter, 8 studs tall, Metal
- Sign face: octagonal approximation (use a Part with SurfaceGui showing STOP text)
  - Or build octagon from 4 overlapping rotated Parts
  - Size: 2x2 studs
  - Color: red RGB(200,30,30)
- SurfaceGui with "STOP" in white bold text
- Back: flat gray Part behind sign face

FIRE HYDRANT:
Part count: minimum 5, ideal 8
- Body: cylinder, 0.8 diameter, 1.5 tall, red RGB(200,40,40), Metal
- Cap: hemisphere on top, same color
- Nozzle ports: 2 small cylinders protruding from sides at different heights
- Chain: tiny parts linking nozzle caps
- Base: slightly wider flange at bottom

MAILBOX:
Part count: minimum 5, ideal 8
- Post: cylinder, 0.2 diameter, 3.5 studs tall, Wood
- Box: rounded-front box shape (1.5 x 1 x 1), WoodPlanks or Metal
  - Color: blue RGB(40,60,150) or red or classic green
- Flag: thin Part on side, red, angled upward
- Door: thin Part on front, slightly different shade
- Number: SurfaceGui with house number

BENCH:
Part count: minimum 8, ideal 12-15
- Seat slats: 3-4 horizontal planks, spaced 0.1 apart, WoodPlanks, brown
  - Each: 4x0.15x0.5 studs
- Back slats: 3-4 planks, same style, angled back 10 degrees
- Legs: 2 metal frame pieces (L-shaped or ornate), at each end
  - Material: Metal, dark gray or black
- Armrests: 2 pieces, connecting seat and back at each end
- Cross-brace: horizontal bar connecting legs underneath

POWER / TELEPHONE POLE:
Part count: minimum 6, ideal 10
- Pole: cylinder, 0.5-0.7 diameter, 20-25 studs tall, Wood, dark brown
- Cross arm: horizontal bar near top, 4-6 studs wide
- Insulators: 3-4 small white cylinders on cross arm
- Wires: thin Parts connecting between poles (or omit for performance)
- Transformer drum: cylinder mounted at 70% height (optional)
- Base: slightly wider at bottom, or metal brace

────────────────────────────────────────────────────────────────────────────────
1.9 ARCHITECTURAL DETAILS
────────────────────────────────────────────────────────────────────────────────

COLUMNS:
Classical proportions (from Vitruvius):
- Doric: height = 8x diameter, no base, simple capital (flat slab)
- Ionic: height = 9x diameter, molded base, scroll-shaped capital (2 spiral Parts)
- Corinthian: height = 10x diameter, elaborate base, leaf-decorated capital
- For Roblox: column diameter 0.6-1.2 studs, height accordingly
- Entasis: columns are NOT straight cylinders — they're slightly wider at 1/3 height
  - Simulate with 2-3 stacked cylinders, middle one 5% wider
- Fluting: optional vertical grooves (thin dark-line Parts around circumference)
- Material: Concrete (stone look) or Marble (white/cream, Concrete with light color)

ARCHES:
- Semicircular: half circle. Radius = half of opening width.
  - Build with 5-8 WedgeParts or small blocks arranged in curve
  - Keystone: slightly larger center stone at arch top
- Pointed (Gothic): two arcs meeting at a point above center
  - Taller than wide, dramatic
- Segmental: flatter than semicircular, less than half-circle
- Material: Brick or Concrete, same as or slightly different from wall

WINDOW PATTERNS:
- Single: 1 pane, 3x4 studs
- Double-hung: divided horizontally at middle, 2 panes
- Casement: 2 side-by-side panes, each 1.5x4
- Bay: 3 windows angled outward (center flat, sides at 30-45 degrees), extending 1-2 studs from wall
- Rose/circular: decorative circle window, build from arranged Parts
- Mullion pattern: divide panes with thin cross-bars (0.08 stud wide strips)

STAIRS:
- Tread depth: 1 stud (how deep each step is)
- Riser height: 0.75-1 stud (how tall each step is)
- Width: 3-5 studs
- Total treads for one floor (12 studs height): 12-16 steps
- Landing: flat platform halfway up, for L-shaped or U-shaped stairs
- Railing: vertical balusters every 0.8-1 stud, 3 studs tall from tread
  - Handrail: horizontal or sloped Part along tops of balusters
  - Newel post: larger post at top and bottom of railing
- Material: Wood (residential), Concrete (commercial), Metal (industrial)

BALCONY:
- Floor: extends 3-4 studs from building face
- Support: brackets underneath (angled Parts from wall to balcony edge)
  - Or columns from ground level
- Railing: 3 stud tall railing around exposed edges
  - Balusters + handrail, or solid panel with top rail
- Door opening: from interior room to balcony, full-height glass door
- Drain: small gap or hole Part in floor corner

DORMER WINDOWS:
- Small house-shaped protrusion from roof slope
- Own mini-roof (gabled or shed), own walls, own window
- Width: 3-4 studs
- Depth from main roof: 2-3 studs
- Connects into main roof slope — roofing material wraps around

────────────────────────────────────────────────────────────────────────────────
1.10 ADDITIONAL OBJECTS (compact reference)
────────────────────────────────────────────────────────────────────────────────

BARREL: 6+ parts — main cylinder body (1.5 dia, 2 tall) + 2 metal band rings (slightly wider) at 30% and 70% height + top lid circle + bottom disk + stave lines (optional thin darker strips on surface). Material: WoodPlanks body, Metal bands.

CRATE: 6+ parts — main box + 4 corner edge strips + top plank lines. Wood material, brown. Rope or metal band detail optional.

FOUNTAIN: 15+ parts — circular base pool (cylinder, 5 dia, 1 tall, filled with transparent blue Water Part) + center pedestal (cylinder column) + upper bowl (inverted dome shape) + water spray effect (ParticleEmitter or stacked transparent blue spheres decreasing in size) + decorative rim around pool edge.

CAMPFIRE: 8+ parts — ring of rocks (6-8 small irregular gray Parts in circle) + log pile (3-4 brown cylinders crossed) + fire (2-3 orange/yellow Parts with Neon material, stacked, slight rotation) + ParticleEmitter for smoke + PointLight (orange, Brightness 2, Range 15, flickering via script).

TREASURE CHEST: 8+ parts — bottom box (2x1.2x1.5) + lid (curved top using 2-3 Parts) + metal bands (2 arched strips) + latch (small metal Part on front) + hinges (tiny cylinders on back) + gold contents (pile of small yellow Parts inside if open). Material: WoodPlanks body, Metal hardware, Neon for gold glow.

CANNON: 10+ parts — barrel (cylinder, 3 long, 0.6 dia) + mounting frame (2 side panels + cross bars) + wheels (2 cylinders, 1.5 dia) + axle (horizontal cylinder connecting wheels) + fuse hole (tiny dark Part on top near rear) + decorative rings on barrel (2-3 slightly wider cylinder sections). Material: Metal barrel, Wood frame, Metal wheels.

MARKET STALL: 15+ parts — 4 corner poles + horizontal frame bars + canopy (angled flat Part on top, Fabric material, colorful) + counter surface + back wall (optional) + display goods (5-8 small colored Parts representing produce, crafts, etc.) + hanging decorations from canopy edge.

WELL: 10+ parts — circular stone base (short cylinder, 3 dia, 2 tall, Brick) + support frame (2 upright poles + horizontal cross bar) + roof (small 2-sided peaked cover) + bucket (small cylinder hanging from rope) + rope (thin Part from cross bar to bucket) + crank handle (small L-shaped metal Part).

WINDMILL: 18+ parts — tower base (tapered cylinder, wider at bottom) + conical or domed top + rotating hub (disk at front) + 4 blade arms (long thin Parts from hub, equally spaced at 90 degrees) + blade surfaces (flat Parts on each arm, angled for wind catch) + door at base + 2-3 windows up tower + internal floor platforms.

BRIDGE: 12+ parts — deck surface (long flat Part) + support pillars (2-4 vertical blocks into water/ground) + railing on each side (posts + horizontal rail) + arch underneath (curved support from pillar to pillar) + approach ramps at each end. Stone or wood material depending on style.

BOAT: 12+ parts — hull (elongated Part, thinner at bow, wider at stern) + gunwales (raised edge Parts on each side) + seats (2-3 plank Parts across width) + mast (tall cylinder, if sailboat) + sail (flat tilted Part, Fabric) + rudder (flat Part at stern) + oars (2 long thin Parts, optional).

CLOCK TOWER: 20+ parts — square tower base (tall box) + clock face (each side: white circular Part with SurfaceGui showing clock) + decorative molding at each floor + pointed or domed roof at top + bell (sphere inside open section near top) + entrance door at base + buttress supports at corners.

GREENHOUSE: 15+ parts — metal frame skeleton (thin Parts forming rectangular structure) + glass panels (Transparency 0.5-0.6) filling frame sections + door panel + base wall (1-2 studs high, brick) + interior plant benches (long table Parts) + potted plants inside (small colored Parts on benches) + apex roof with ridge beam.

GAZEBO: 12+ parts — octagonal or hexagonal floor platform + 6-8 support columns at perimeter + decorative railing between columns + domed or peaked roof + center post (if peaked) + optional bench inside + step up from ground to platform + hanging light or chandelier.

WAGON: 14+ parts — flat bed (6x3x0.3) + 4 wheels (2 large rear, 2 smaller front) + axles + side rails (low fence walls on bed sides) + front seat bench + tongue/hitch extending forward + optional canvas cover (arched frame + fabric top). Material: Wood body, Metal hardware.

PIANO: 15+ parts — main body (large curved shape from Parts) + keyboard (long thin white Part with black key Parts on top) + legs (3 ornate legs) + lid (propped open at angle) + lid prop stick (thin diagonal Part) + pedals (3 small Parts at base) + music stand (thin upright Part above keys) + bench (separate, 4 Parts). Material: Wood body (dark brown or black), keys white/black Concrete.

TELESCOPE: 8+ parts — tripod legs (3 thin Parts angled outward) + central hub + barrel tube (long cylinder, angled upward) + eyepiece (small cylinder at viewing end) + lens (glass Part at far end) + adjustment knobs (tiny cylinders on barrel side). Material: Metal throughout, brass-colored RGB(180,140,60).

LADDER: 6+ parts — 2 side rails (tall thin Parts) + 6-10 rungs (horizontal bars between rails, spaced 1 stud apart). Material: Wood or Metal. Lean angle: 15-20 degrees from vertical against wall.

FENCE GATE: 8+ parts — frame (rectangle of Parts) + cross brace (diagonal Part for rigidity) + vertical slats or pickets filling frame + hinges (2 small Parts on one side) + latch (small Part on other side) + posts on each side (taller than fence). Width: 3-5 studs. Height: matches attached fence.

────────────────────────────────────────────────────────────────────────────────
1.11 FOOD AND SMALL ITEMS
────────────────────────────────────────────────────────────────────────────────

These add life to any scene. 3-6 parts each, small scale.

PLATE: flat disk (cylinder mesh, 1 dia, 0.05 tall) + rim ring (slightly wider, 0.03 tall)
CUP/MUG: cylinder (0.4 dia, 0.5 tall) + handle (small C-shaped Part on side) + liquid surface (dark colored disk inside at 80% height)
BOTTLE: cylinder body (0.3 dia, 0.8 tall) + narrow neck cylinder on top + cap (tiny disk). Glass material, green or brown.
APPLE/FRUIT: sphere (0.3 dia) + tiny stem Part on top + small leaf Part. Red, green, or orange.
CAKE: short cylinder (1.5 dia, 0.6 tall) + frosting layer (slightly larger disk on top) + candles (tiny cylinders on top). Pink/white with colored accents.
PIZZA: flat cylinder (2 dia, 0.1 tall) + triangle slice cuts (slightly separated wedge Parts) + topping dots (tiny colored Parts on surface).
LANTERN: hexagonal or cylindrical cage (Metal frame) + glass panels (Transparency 0.4) + candle inside (tiny Part + PointLight warm, Brightness 1, Range 8) + handle loop on top.
POTION BOTTLE: shaped similar to bottle but with wider bottom (sphere mesh base + cylinder neck) + cork (tiny brown cylinder) + liquid (colored transparent Part inside). Neon material for magical glow.
SCROLL: cylinder (rolled paper look, 0.3 dia, 1 long) + tie ribbon (thin colored Part around middle). Cream/tan color.
COIN/CURRENCY: very flat cylinder (0.4 dia, 0.03 tall) + face detail (SurfaceGui or tiny embossed Part). Gold RGB(212,175,55) Metal material.


═══════════════════════════════════════════════════════════════════════════════
 SECTION 2: ARCHITECTURAL STYLES — 20 Complete Style Guides
═══════════════════════════════════════════════════════════════════════════════

Each style guide includes: color palette (exact RGB), materials, proportions,
signature elements, and DO/DON'T rules. Mix styles for unique results.

────────────────────────────────────────────────────────────────────────────────
2.1 MODERN MINIMALIST
────────────────────────────────────────────────────────────────────────────────
Era: 2000s-present. Mood: clean, open, expensive.

COLOR PALETTE:
- Primary walls: pure white RGB(245,245,245) or light gray RGB(220,220,220)
- Accent: charcoal black RGB(40,40,40) for frames/trim
- Pop color: one bold accent — orange RGB(230,120,30), teal RGB(0,150,140), or yellow RGB(240,200,0)
- Wood tone: light oak RGB(190,160,120) for warmth contrast
- Metal: brushed steel RGB(180,180,185)

MATERIALS: Concrete (walls — smooth look), Metal (frames), Glass (transparency 0.4-0.5), WoodPlanks (accent areas)

PROPORTIONS:
- Flat roof ONLY — zero pitch
- Floor-to-ceiling windows (window height = 90% of wall height)
- Thin wall frames visible (0.1 stud metal edges around glass)
- Cantilevers: upper floor extends 3-5 studs beyond lower floor on one side
- Open floor plan: minimal interior walls

SIGNATURE ELEMENTS:
- Floor-to-ceiling glass walls (entire wall is glass with thin metal mullions)
- Floating stairs (individual tread Parts mounted to single wall stringer, no risers)
- Infinity edge: flat roof with thin water-feature Part along one edge
- Hidden lighting: recessed light strips (thin Neon Parts in ceiling channels)
- Minimalist landscaping: gravel ground (light gray flat Part), single sculptural tree, concrete planters

DO: Use negative space. Leave walls bare. Let materials speak.
DON'T: Add ornament, curves, or busy patterns. No shutters, no trim, no decorative molding.

────────────────────────────────────────────────────────────────────────────────
2.2 VICTORIAN
────────────────────────────────────────────────────────────────────────────────
Era: 1837-1901. Mood: ornate, colorful, grand.

COLOR PALETTE:
- Body: deep colors — burgundy RGB(120,30,40), forest green RGB(40,80,50), navy RGB(30,40,80), or ochre RGB(180,150,60)
- Trim: cream RGB(240,230,200) or white RGB(245,240,235)
- Accent (doors, shutters): contrasting bold — red RGB(160,40,40), teal RGB(0,110,110), purple RGB(90,40,110)
- Roof: dark slate gray RGB(60,65,70) or dark brown RGB(70,50,35)

MATERIALS: Brick (walls), WoodPlanks (siding), Concrete (stone trim), Slate (roof), Metal (ironwork)

PROPORTIONS:
- Steep roof pitch: 45-60 degrees
- Tall narrow windows: 2.5 wide x 5 tall (height = 2x width)
- High ceilings: 14 studs per floor
- 2-3 stories typical
- Asymmetric facade (different window sizes/positions per side)

SIGNATURE ELEMENTS:
- Bay windows: 3-sided window bumps extending 1.5-2 studs from wall, each floor
- Wrap-around porch: extends across front and one side, turned posts, decorative brackets
- Gingerbread trim: decorative Parts along roof edges, porch brackets (small ornate shapes)
- Turret: cylindrical tower on one corner, conical roof, 1-2 studs wider than main walls
- Fish-scale shingles: decorative panel with scalloped pattern (approximate with alternating-height small Parts)
- Stained glass: window with multiple small colored-glass Parts
- Finials: pointed ornaments at roof peaks and porch post tops
- Iron cresting: decorative metal ridge along roof peak

DO: Layer details. Use 3+ colors. Add trim everywhere. Make it asymmetric.
DON'T: Make it plain. Don't use flat roofs. Don't make it symmetric.

────────────────────────────────────────────────────────────────────────────────
2.3 MEDIEVAL CASTLE
────────────────────────────────────────────────────────────────────────────────
Era: 500-1500 AD. Mood: fortress, imposing, defensive.

COLOR PALETTE:
- Stone: gray RGB(140,135,130), dark gray RGB(100,95,90), warm gray RGB(150,140,130)
- Wood (beams, doors): dark brown RGB(70,50,30)
- Metal (hinges, portcullis): dark iron RGB(60,60,65)
- Banner colors: red/gold, blue/silver, green/white — pick a house color

MATERIALS: Brick (stone walls — use with gray color), Concrete (smoother stone), WoodPlanks (doors, beams), Metal (hardware)

PROPORTIONS:
- Walls: 2-3 studs thick (defensive mass)
- Wall height: 16-20 studs
- Tower height: 25-35 studs (taller than walls by 50-100%)
- Tower diameter: 6-10 studs
- Courtyard: central open area, 30-50% of footprint

SIGNATURE ELEMENTS:
- Battlements/Crenellations: alternating raised (merlon 1.5 tall) and gap (crenel 1 stud wide) along wall top. Spacing: 1.5 stud merlon, 1 stud gap, repeating.
- Arrow slits: very narrow tall openings in walls (0.2 wide x 2 tall)
- Drawbridge: flat Part that can angle down over moat (hinged at castle-side)
- Moat: trench around castle filled with Water material, 4-6 studs wide, 3 studs deep
- Portcullis: grid of vertical and horizontal bars at gate opening, Metal
- Round towers at corners: cylindrical, taller than walls
- Machicolations: overhanging sections at wall top with openings (defensive)
- Great hall: largest interior room, 20+ studs long, long dining table, fireplace at one end, banners on walls
- Spiral staircase in towers: wedge-shaped steps around a central pole

DO: Make it MASSIVE. Thick walls. Tower corners. Defensive features everywhere.
DON'T: Use glass windows (arrow slits only, or small shuttered openings). Don't make it symmetrical — castles grew over time.

────────────────────────────────────────────────────────────────────────────────
2.4 JAPANESE TRADITIONAL
────────────────────────────────────────────────────────────────────────────────
Era: various (Shinto/Buddhist). Mood: serene, precise, natural.

COLOR PALETTE:
- Wood: natural tan RGB(180,150,110), dark beam brown RGB(80,55,35)
- Walls: cream/white shoji screen RGB(240,235,220)
- Roof: dark blue-gray tile RGB(55,60,70) or dark brown thatch RGB(80,65,45)
- Accent: vermillion red RGB(200,50,40) for torii gates, temple trim
- Stone: garden rocks gray RGB(130,125,120)

MATERIALS: WoodPlanks (structure), Concrete (walls — light color simulates plaster), Brick (tile roof), Wood (beams)

PROPORTIONS:
- Wide and low: width > height ratio of 2:1 or 3:1
- Deep overhanging eaves: 2-3 studs past walls
- Raised floor: 1-2 studs above ground on post supports
- Ceiling height: 10-11 studs (slightly lower, intimate)
- Rooms defined by screens, not walls

SIGNATURE ELEMENTS:
- Curved roof: build with multiple Parts — steeper at edges, flatter at center (concave curve). Use 4-6 Parts per roof slope transitioning angle.
- Engawa (veranda): wooden walkway around building perimeter, 2-3 studs wide, covered by eave
- Shoji screens: thin Parts (0.1 thick) with grid pattern SurfaceGui, cream color, semi-transparent
- Torii gate: two vertical posts + two horizontal beams (top one curved upward at ends)
  - Red RGB(200,50,40), scale: 6 studs tall, 5 studs wide
- Zen garden: flat area with raked gravel (light gray flat Part with line pattern SurfaceGui) + arranged rocks (3, 5, or 7 stones — always odd numbers) + moss patches
- Tatami mat interior: tan floor Parts in 2:1 rectangular ratio
- Lantern (ishidoro): stacked stone shapes — base, post, firebox, roof, finial
- Koi pond: irregular-shaped water feature with fish-colored Parts visible
- Bamboo fence: vertical green cylinders side by side with horizontal binding

DO: Embrace asymmetry. Use natural materials. Leave breathing space. Odd numbers for grouped elements.
DON'T: Overcrowd. Don't use bright/artificial colors. Don't make everything grid-aligned.

────────────────────────────────────────────────────────────────────────────────
2.5 ART DECO
────────────────────────────────────────────────────────────────────────────────
Era: 1920s-1930s. Mood: glamorous, geometric, luxurious.

COLOR PALETTE:
- Primary: cream/ivory RGB(235,225,200) or pale pink RGB(235,215,205)
- Trim: gold RGB(200,170,80) or brass RGB(180,150,70)
- Accent: jade green RGB(60,130,100), deep teal RGB(0,100,105), or black RGB(30,30,30)
- Glass: frosted blue RGB(170,195,220)

MATERIALS: Concrete (primary surfaces), Metal (gold trim), Brick (darker panels), WoodPlanks (interior)

PROPORTIONS:
- Vertical emphasis: tall narrow elements
- Stepped/tiered profile: building gets narrower as it goes up (wedding-cake silhouette)
- Each setback: 2-3 studs narrower on each side, 8-12 studs tall
- Flat roof at each tier

SIGNATURE ELEMENTS:
- Geometric patterns: chevrons (V-shapes), sunburst (radiating lines from center), zigzags
  - Build from multiple thin Parts arranged in pattern
- Stepped profile: 3-5 tiers getting narrower
- Fluted pilasters: vertical grooved columns flanking entrance
- Metalwork: ornate gold-colored gate/door with geometric cutout pattern
- Entrance surround: elaborate frame around door with layered geometric trim
- Spire or finial: tall pointed element at building top, stepped or angular
- Speed lines: horizontal trim bands wrapping around building
- Sunburst above door: radiating lines (thin Parts spreading from center point above entrance)
- Interior: terrazzo-pattern floor (mosaic-colored flat Parts), chandeliers, mirrored surfaces

DO: Make it tall and vertical. Use bold geometric patterns. Gold everywhere.
DON'T: Use curves (except sunbursts). Don't make it organic or natural looking.

────────────────────────────────────────────────────────────────────────────────
2.6 RUSTIC / COTTAGE
────────────────────────────────────────────────────────────────────────────────
Era: European countryside, timeless. Mood: cozy, warm, imperfect.

COLOR PALETTE:
- Stone base: warm gray RGB(160,150,140) with variation ±10
- Upper walls: cream plaster RGB(235,225,205) or light yellow RGB(240,230,190)
- Timber beams: dark brown RGB(70,50,30)
- Roof: straw/thatch RGB(170,150,100) or moss-green tile RGB(100,120,80)
- Door: cheerful color — robin egg blue RGB(100,180,190) or barn red RGB(150,50,40)
- Window boxes: terracotta RGB(180,100,60) with green plants

MATERIALS: Brick (stone lower walls), Concrete (plaster upper), WoodPlanks (beams, door), Wood (window frames), Grass (thatch)

PROPORTIONS:
- Low and wide: 1-2 stories, spread horizontally
- Thick walls: 1-1.5 studs (mass and warmth feel)
- Low ceilings: 10-11 studs (cozy)
- Small deep-set windows: 2x3 studs, glass recessed 0.3 studs
- Irregular: nothing perfectly aligned — intentional slight offsets

SIGNATURE ELEMENTS:
- Half-timber: visible beam framework on upper walls (dark wood grid with cream plaster between)
  - Vertical posts, horizontal beams, diagonal braces, all 0.3 studs thick, proud of wall
- Thatched roof: thick roof (1-1.5 studs) with soft rounded edges, grass/straw material and color
- Stone base wall: lower 3-4 studs is stone, upper is plaster/timber
- Cottage garden: wildflower beds (colorful small Parts) lining path to door
- Dutch door: split horizontally so top and bottom are separate Parts
- Window boxes: planter Parts under each window with flower parts
- Winding stone path: irregular stepping-stone Parts leading to door
- Chimney: wide, slightly crooked (0.5 degree lean), stone material
- Climbing ivy: small green Parts scattered up one wall face
- Wishing well or birdbath in garden

DO: Make it imperfect and charming. Mix materials. Add lots of plant life.
DON'T: Make it geometric or perfect. Don't use modern materials. No metal or glass.

────────────────────────────────────────────────────────────────────────────────
2.7 FUTURISTIC / SCI-FI
────────────────────────────────────────────────────────────────────────────────
Era: imagined future. Mood: advanced, alien, high-tech.

COLOR PALETTE:
- Primary hull: dark gray RGB(50,55,60) or white RGB(230,235,240)
- Secondary: medium gray RGB(120,125,130) panels
- Accent glow: cyan RGB(0,200,255), magenta RGB(255,0,180), or green RGB(0,255,100)
- Interior: sterile white RGB(240,240,245) with colored accent lighting

MATERIALS: Metal (primary structure), Concrete (smooth panels), Neon (glowing accents), Glass (transparency 0.3-0.5 for viewports)

PROPORTIONS:
- Unusual angles: walls at 80-85 degrees instead of 90 (slight lean)
- Floating elements: parts that appear disconnected (small gap between)
- Asymmetric: functional asymmetry (antenna on one side, docking on other)
- Massive scale or micro scale — nothing "normal" human proportion

SIGNATURE ELEMENTS:
- Neon accent lines: thin Neon-material Parts along edges of panels, in trim channels
  - Animate with scripts: pulse brightness up and down
- Holographic displays: semi-transparent flat Parts with Neon material, blue/green
- Sliding doors: Parts that tween sideways into wall pockets
- Viewport windows: large circular or hexagonal windows, thick metal frame
- Antenna arrays: clusters of thin cylinders at various angles on roof
- Landing pad: hexagonal platform with edge lights (small Neon Parts around perimeter)
- Panel lines: the hull surface has visible seam lines (thin darker Parts every 3-4 studs)
- Airlock: double-door system with chamber between
- Gravity plates: floor sections with subtle glow underneath
- Vents and greebles: small mechanical detail Parts (boxes, pipes, grilles) on exterior surfaces

DO: Add panel lines everywhere. Use glow effects. Make it feel engineered.
DON'T: Use organic shapes. No wood, no brick, no warm colors. Nothing rustic.

────────────────────────────────────────────────────────────────────────────────
2.8 GOTHIC
────────────────────────────────────────────────────────────────────────────────
Era: 1100-1500 AD. Mood: dramatic, soaring, spiritual.

COLOR PALETTE:
- Stone: dark gray RGB(100,95,90), weathered gray RGB(130,125,120)
- Stained glass: deep colors — ruby red RGB(160,30,40), sapphire blue RGB(30,50,150), emerald RGB(30,120,60), amber RGB(200,150,30)
- Dark wood: very dark brown RGB(50,35,20)
- Lead/metal: dark gray RGB(70,70,75)

MATERIALS: Brick (stone), Concrete (smooth stone), Metal (ironwork), Glass (stained glass — use colored transparent Parts)

PROPORTIONS:
- Extreme vertical: height = 3-4x width
- Pointed arches: every opening ends in a point at top
- Thin walls compensated by buttresses every 4-6 studs
- Soaring interior: 20-30 stud ceiling height

SIGNATURE ELEMENTS:
- Pointed arches: over every window and door. Build with 2 angled Parts meeting at peak.
- Flying buttresses: exterior support arms arching from wall to freestanding pier
  - Arch shape: from wall at 60% height, curving down to pier at ground
  - Pier: freestanding column 3-4 studs from main wall
- Rose window: large circular window on front face, 4-6 stud diameter, divided into segments with colored glass
- Ribbed vault ceiling: interior ceiling with criss-crossing ridge Parts (ribs meeting at center)
- Pinnacles: small pointed spires at tops of buttresses and corners
- Gargoyles: crude creature shapes perched at corners, extending outward
  - Build each from 4-5 parts: body, head, wings, base mount
- Tracery: decorative stone patterns in windows (thin Parts forming curves and points inside window frame)
- Bell tower: tall tower with open arch section near top housing bell Part
- Nave: long central interior hall with rows of columns forming side aisles

DO: Go TALL. Pointed everything. Lots of stone detail. Dark and dramatic.
DON'T: Use round arches (those are Romanesque). Don't make it squat or wide.

────────────────────────────────────────────────────────────────────────────────
2.9 TROPICAL
────────────────────────────────────────────────────────────────────────────────
Era: various (Caribbean, Polynesian). Mood: breezy, colorful, relaxed.

COLOR PALETTE:
- Walls: bright pastel — turquoise RGB(100,200,200), coral RGB(240,140,120), sunny yellow RGB(250,220,100), lime RGB(180,230,130)
- Wood: weathered gray-brown RGB(140,125,110) or natural tan RGB(170,145,110)
- Roof: palm thatch tan RGB(160,140,100) or corrugated metal rust RGB(170,120,90)
- Trim: white RGB(245,245,240)

MATERIALS: WoodPlanks (walls, floors), Wood (structural), Grass (thatch), Metal (corrugated roof), Concrete (white trim)

PROPORTIONS:
- Raised on stilts: floor 3-5 studs above ground (flood/ventilation)
- Open walls: 30-50% of wall area is open (no glass, just openings)
- Wide overhanging roof: 3-4 stud overhang for rain/sun protection
- Single story typical, spread horizontally

SIGNATURE ELEMENTS:
- Stilts/posts: structural columns from ground to floor, 0.5-0.8 diameter
- Open-air walls: large window openings without glass, maybe shutters (hinged panels)
- Thatched roof: thick (1.5 studs), warm tan color, rounded edges
  - Or corrugated metal: thin Part with slight wave pattern
- Wraparound deck: extends 4-6 studs on all sides
- Hammock: two post Parts + hanging curved fabric Part between
- Tiki torches: thin pole + flame Part on top with PointLight
- Palm trees nearby: essential — at least 2-3 palms in scene
- Seashell/driftwood decorations: scattered small organic shapes
- Ceiling fan: 4-blade propeller Part on ceiling (script for rotation)
- Outdoor shower: simple frame with showerhead cylinder

DO: Keep it open and breezy. Bright colors. Lots of tropical plants.
DON'T: Seal it up. Don't use stone or brick. Don't make it heavy/massive.

────────────────────────────────────────────────────────────────────────────────
2.10 INDUSTRIAL
────────────────────────────────────────────────────────────────────────────────
Era: 1850s-present. Mood: raw, functional, urban.

COLOR PALETTE:
- Brick: red-brown RGB(140,70,50) or dark brick RGB(100,55,40)
- Metal: steel gray RGB(150,150,155), rust orange RGB(170,100,60)
- Concrete: medium gray RGB(160,155,150)
- Wood: reclaimed/weathered brown RGB(130,110,85)
- Accent: faded signage colors, safety yellow RGB(240,210,50)

MATERIALS: Brick (walls), Metal (beams, stairs, railings), Concrete (floors, pillars), WoodPlanks (reclaimed details)

PROPORTIONS:
- Large open volumes: high ceilings 16-20 studs, minimal interior walls
- Large windows: multi-pane industrial windows covering 40-60% of wall area
- Exposed structure: beams and columns visible, not hidden inside walls
- Column grid: structural columns every 8-12 studs

SIGNATURE ELEMENTS:
- Exposed brick walls: the brick material IS the finished surface
- Steel I-beams: visible roof trusses (build triangulated truss from thin Parts)
- Multi-pane windows: large window divided into grid of small panes by thin mullions (8-16 panes per window)
- Pipe runs: horizontal and vertical cylinders along walls and ceiling, with elbow bends
- Metal staircase: open-tread stairs with perforated-look treads, pipe railings
- Loading dock: raised platform at one side with roll-up door opening
- Crane/gantry: overhead rail beam with hanging hook Part
- Ductwork: rectangular box channels along ceiling for HVAC
- Concrete floor: industrial gray with painted markings (safety lines)
- Pendant lights: hanging from ceiling on chains/cables, industrial dome shade + bright PointLight

DO: Show the structure. Expose everything. Functional aesthetic.
DON'T: Hide the bones. Don't add decorative trim or ornament.

────────────────────────────────────────────────────────────────────────────────
2.11 CYBERPUNK
────────────────────────────────────────────────────────────────────────────────
Era: near-future dystopia. Mood: dark, neon, gritty.

COLOR PALETTE:
- Base: very dark — near-black RGB(25,25,30), dark gray RGB(45,45,50)
- Neon glow: hot pink RGB(255,20,120), electric blue RGB(20,120,255), acid green RGB(80,255,80), purple RGB(160,40,255)
- Rust/grime: brown-orange RGB(140,80,40) for decay
- Wet surfaces: darker version of base with slight blue tint (rain-slick)

MATERIALS: Metal (dark), Concrete (grime), Neon (signs, lights), Brick (old walls)

SIGNATURE ELEMENTS:
- Neon signs: flat Parts with Neon material, bright colors, SurfaceGui with text (kanji, brand names, advertisements)
  - Mount angled from building faces, extending into alley
  - Multiple competing signs on same building
- Holographic ads: semi-transparent Parts with Neon material floating in air
- Dark alleys: narrow gaps (3-4 studs) between tall buildings
- Rain effects: ParticleEmitter from sky, droplets falling
- Puddles: thin reflective Parts on ground with slight transparency
- Exposed wiring: colored thin Parts (red, yellow, blue) running along walls
- Ventilation units: boxy mechanical Parts on rooftops with spinning fan details
- Street food stall: small counter with neon-lit menu sign, steam ParticleEmitter
- Flying vehicle rail: elevated track structure above street level
- Surveillance cameras: small box + cylinder lens on building corners
- Graffiti: colored Parts arranged as abstract shapes on walls
- Stacked/layered buildings: structures built on top of structures, irregular

DO: Layer it. More signs, more wires, more grime. Contrast darkness with neon.
DON'T: Make it clean. Don't use natural materials. Nothing organic.

────────────────────────────────────────────────────────────────────────────────
2.12 FANTASY
────────────────────────────────────────────────────────────────────────────────
Era: magical realm. Mood: whimsical, mysterious, enchanted.

COLOR PALETTE:
- Mushroom: deep purple RGB(100,50,120), bright cap red RGB(200,60,60), spotted white
- Crystal: amethyst purple RGB(160,80,200), ice blue RGB(140,200,240), emerald RGB(60,180,100)
- Fairy light: warm gold RGB(255,220,130), soft pink RGB(255,180,200)
- Bark/wood: deep browns with green-moss tint RGB(80,70,50)

MATERIALS: Concrete (stone), WoodPlanks (bark), Neon (magical glow), Glass (crystal), Fabric (banners)

SIGNATURE ELEMENTS:
- Giant mushrooms as buildings: thick stem (cylinder) + wide cap (flattened sphere, colorful) + door in stem + windows in cap
- Crystal spires: tall angular transparent Parts, clusters of 3-5 at different heights and angles, Neon or Glass material with color
- Magical glow: PointLights inside crystals, under mushroom caps, in hollow trees
  - Colors: soft purple, gold, blue — Brightness 1-2, Range 10-15
- Floating islands: chunks of land (terrain or Part-based) suspended in air with gaps below
  - Waterfalls cascading off edge: blue transparent Parts + ParticleEmitter
  - Connecting bridges: rope bridges (thin wood planks + rope-colored side rails, sagging in middle)
- Enchanted forest: trees with oversized canopy, bioluminescent patches (small Neon Parts on trunks)
- Fairy houses: tiny structures (1/3 normal scale) built into tree trunks or mushroom stems
- Magical effects: ParticleEmitters for sparkles, floating lights, mist
- Runic stones: standing stone Parts with glowing carved-line Parts on face (Neon material, thin)
- Potion shop: interior with shelves of colorful bottle props, cauldron (large bowl + green bubbling particles)
- Enchanted well/fountain: stone well with glowing water (blue Neon Part), floating sparkle particles

DO: Let imagination go wild. Impossible architecture. Glowing everything. Scale variations.
DON'T: Make it mundane. Don't use realistic proportions. Nothing should look normal.

────────────────────────────────────────────────────────────────────────────────
2.13 WILD WEST
────────────────────────────────────────────────────────────────────────────────
Era: 1860s-1890s American frontier. Mood: dusty, rugged, frontier.

COLOR PALETTE:
- Wood: sun-bleached tan RGB(180,160,130), dark weathered RGB(110,90,65)
- Dust/ground: sandy brown RGB(190,170,130)
- Metal: rusty iron RGB(140,90,60)
- Accent: faded paint — barn red RGB(140,60,45), faded blue RGB(100,120,140)

MATERIALS: WoodPlanks (everything — it's the frontier), Metal (hardware), Concrete (stone foundations)

SIGNATURE ELEMENTS:
- False front: building face is taller than actual roof behind it (facade)
  - Front wall extends 3-5 studs above roof line
  - Sign board on false front with business name (SurfaceGui)
- Saloon doors: half-height swinging doors (2 Parts at 3 stud height, hinged at frame sides)
- Covered boardwalk: raised wooden sidewalk (1 stud above dusty ground) with post-supported roof along building front
- Hitching post: horizontal bar at 3 studs height between 2 posts, outside saloon/store
- Water trough: rectangular box next to hitching post
- Barrel props: scattered wooden barrels (see barrel anatomy)
- Wanted posters: flat Parts on walls with SurfaceGui
- Tumbleweeds: small spherical wireframe-look Parts scattered on ground
- Horse: Part-built horse tied to hitching post (12+ parts)
- General store: shelves visible through large front window, varied goods
- Jail: small building with barred window (grid of thin Parts)
- Clock tower or bell tower over one building

DO: Make it weathered and sun-bleached. Everything wood. Dusty ground.
DON'T: Use modern materials. No glass (windows use shutters or open). Nothing polished.

────────────────────────────────────────────────────────────────────────────────
2.14 ANCIENT EGYPTIAN
────────────────────────────────────────────────────────────────────────────────
Era: ~3000 BC - 30 BC. Mood: monumental, sun-baked, eternal.

COLOR PALETTE:
- Sandstone: warm tan RGB(210,185,140), light sandy RGB(225,200,160)
- Gold: pharaonic gold RGB(212,175,55)
- Lapis lazuli accent: deep blue RGB(40,50,130)
- Turquoise: RGB(70,180,170)
- Red ochre: RGB(180,80,50)

MATERIALS: Concrete (sandstone), Metal (gold accents), Brick (mud brick)

PROPORTIONS:
- Pyramids: square base, 4 triangular faces meeting at apex. Classic angle: 51.8 degrees (or approximate 50-52 degrees for Great Pyramid slope).
- Temples: massive. Column height = 10-12x diameter. Hypostyle hall with forest of columns.
- Pylon gates: trapezoidal flat-topped walls flanking entrance, leaning inward 5-10 degrees.

SIGNATURE ELEMENTS:
- Pyramid: 4 WedgePart faces + base slab. Scale: base 30-60 studs per side.
- Obelisk: tall tapered rectangular shaft (thinner at top, ratio 10:1 height to base width) + small pyramidion cap
- Sphinx: reclining lion body (long box) + human head (sphere + headdress Parts) + forepaws extending forward
- Hypostyle columns: papyrus-style (wider at top with flared capital) or lotus-style
  - Build capital with stacked wider cylinders/disks at top
- Hieroglyphic walls: SurfaceGui with Egyptian-style symbols on wall surfaces
- Anubis statues: seated jackal figure at entrances (crude shape from 6-8 Parts, black)
- Cartouche: rounded rectangular frame on walls containing name symbols
- Scarab: decorative beetle shape at entrance, gold material
- Palm trees lining processional way
- Sand dunes: terrain FillBalls with Sand material
- Torches in wall brackets: interior lighting with warm PointLights

DO: Build BIG. Monumental scale. Lots of columns. Gold accents. Symmetry.
DON'T: Use wood. Don't build small. Nothing organic or curved (except columns).

────────────────────────────────────────────────────────────────────────────────
2.15 ANCIENT GREEK / ROMAN
────────────────────────────────────────────────────────────────────────────────
Era: 800 BC - 500 AD. Mood: classical, ordered, civic.

COLOR PALETTE:
- Marble: white RGB(240,235,225), warm white RGB(235,225,210)
- Stone: golden limestone RGB(210,195,165)
- Terra cotta: roof tile RGB(185,110,70)
- Bronze: RGB(170,130,70)
- Mosaic accent: deep red RGB(160,40,40), cobalt blue RGB(40,60,150)

MATERIALS: Concrete (marble/stone — use light colors), Brick (terra cotta), Metal (bronze fittings)

SIGNATURE ELEMENTS:
- Temple front: row of columns (6-8) supporting triangular pediment (flat triangle on top of column row)
  - Pediment: wide flat triangle, filled with sculptural relief (simplified shapes)
  - Entablature: horizontal band between column tops and pediment (architrave + frieze + cornice layers)
- Column orders: Doric (simple), Ionic (scroll tops), Corinthian (ornate leaf tops) — see column anatomy above
- Amphitheater: semicircular tiered seating (concentric arcs of step Parts, each higher than last)
  - Orchestra: flat semicircular floor at center
  - Stage/Scaenae: rectangular building behind orchestra
- Aqueduct: series of arches on tall pillars, carrying water channel on top
  - Arch span: 4-6 studs, pier width: 1.5-2 studs
  - Multiple tiers for height
- Forum/Agora: open rectangular courtyard with colonnades around edges
- Mosaic floor: interior floors with colored pattern (different colored flat Parts arranged in geometric design)
- Bath house: pools (recessed water Parts), columns around, domed ceiling
- Triumphal arch: large freestanding arch with inscription panel at top

DO: Symmetry. Columns everywhere. Classical proportions. White marble.
DON'T: Use dark colors. Don't make it rough/rustic. No pointed arches (that's Gothic).

────────────────────────────────────────────────────────────────────────────────
2.16 STEAMPUNK
────────────────────────────────────────────────────────────────────────────────
Era: Victorian + mechanical alternate history. Mood: inventive, brass, adventurous.

COLOR PALETTE:
- Brass: RGB(180,140,60)
- Copper: RGB(180,120,70)
- Dark iron: RGB(60,60,65)
- Rich wood: mahogany RGB(100,50,30)
- Leather: tan-brown RGB(160,120,70)
- Steam: white translucent (ParticleEmitter)

MATERIALS: Metal (brass/copper colored), WoodPlanks (mahogany), Brick (industrial stone), Concrete (iron)

SIGNATURE ELEMENTS:
- Exposed gears: circular Parts with teeth cut-outs (or solid circles with dark spots around edge)
  - Multiple gears meshing at different sizes
  - Attach to walls, vehicles, clock faces
- Pipe networks: cylinder Parts running along walls, ceiling, exterior
  - Include elbow bends, T-junctions, valves (small wheel Parts on pipes)
  - Steam vents: ParticleEmitter on pipe joints, white particles
- Clock/gauge faces: circular Parts with SurfaceGui showing dial, brass frame
  - Scatter multiple gauges on control panels and walls
- Riveted panels: metal surfaces with small dot Parts in rows along edges (rivet heads)
- Leather and brass hardware: straps, buckles, goggles as accessory props
- Propeller/fan: 3-4 blade Parts on central hub, can be decorative or functional
- Telescope/periscope: tube with lens Parts, mounted on swivel
- Airship: overhead vehicle with balloon (large elongated sphere) + gondola (boat-shaped cabin below) + propellers + rigging lines
- Coal furnace: brick box with glow inside (orange PointLight), smokestack cylinder above
- Control levers: small angled rod Parts mounted on console panels

DO: Mix Victorian elegance with industrial machinery. Brass everything. Visible mechanics.
DON'T: Use plastic/modern materials. Don't make it digital (that's cyberpunk). No neon.

────────────────────────────────────────────────────────────────────────────────
2.17 UNDERWATER
────────────────────────────────────────────────────────────────────────────────
Era: fantasy/sci-fi. Mood: mysterious, deep, bioluminescent.

COLOR PALETTE:
- Deep blue: ambient RGB(20,40,80)
- Glass dome: light blue RGB(160,200,230), Transparency 0.3
- Coral: pink RGB(240,130,140), orange RGB(240,160,80), purple RGB(160,100,180)
- Bioluminescence: bright cyan RGB(0,240,240), green RGB(100,255,150), soft blue RGB(120,180,255)
- Sand floor: light tan RGB(210,195,160)

MATERIALS: Glass (domes, tunnels), Metal (structure), Neon (bioluminescent), Concrete (coral formations)

SIGNATURE ELEMENTS:
- Glass domes: large hemisphere Parts (Sphere mesh scaled) with Transparency 0.3, housing interior
  - Metal frame ribs: thin arched Parts over dome surface
- Glass tunnel: elongated cylinder section with Transparency 0.3, connecting domes
  - Metal ring frames every 3-4 studs
- Coral formations: irregular stacked Parts in pink/orange/purple, organic shapes
  - Branch coral: thin upward-reaching cylinders
  - Brain coral: rough sphere shapes
  - Fan coral: flat broad Parts, angled
- Bioluminescent plants: Neon material Parts in jellyfish shapes, anemone tubes
  - PointLight attached: blue/cyan, Brightness 1-1.5, Range 8
- Fish schools: clusters of small colored Parts (or use ParticleEmitter with custom texture)
- Bubbles: ascending sphere Parts with Glass material, or ParticleEmitter upward
- Kelp forest: tall thin green Parts reaching upward, slight wave (CFrame.Angles variation)
- Submarine: vehicle prop nearby (cylindrical hull + conning tower + propeller)
- Treasure: scattered coin/chest props on sand floor
- Anchor: large anchor prop resting on seabed

DO: Blue atmosphere. Glass enclosures. Bioluminescent glow everywhere. Coral life.
DON'T: Use land-based elements (fire, wood buildings). Don't forget the water pressure feel.

────────────────────────────────────────────────────────────────────────────────
2.18 SPACE STATION
────────────────────────────────────────────────────────────────────────────────
Era: future. Mood: isolation, engineering, vastness.

COLOR PALETTE:
- Hull exterior: light gray RGB(200,200,205) or white RGB(230,230,235)
- Interior walls: off-white RGB(235,235,230)
- Accent: blue indicator RGB(50,100,200), red emergency RGB(200,50,40), green status RGB(50,180,80)
- Floor: medium gray RGB(150,150,155)
- Window frames: dark charcoal RGB(50,50,55)

MATERIALS: Metal (hull), Concrete (interior walls — smooth), Neon (indicator lights), Glass (viewports)

SIGNATURE ELEMENTS:
- Modular corridors: rectangular cross-section (5x5 studs interior), with visible panel seams every 3 studs
  - Floor grates: Grid-pattern Parts (or solid with dark stripe details)
  - Ceiling lights: recessed strip lights (Neon Parts in ceiling channels)
  - Wall panels: alternating flat and slightly recessed sections
- Airlocks: double-door system with indicator lights (green = safe, red = danger)
  - Heavy frame around doors
  - Emergency signage (SurfaceGui)
- Viewports: circular or rectangular thick-framed windows looking into space
  - Frame: 0.3-0.5 stud thick metal
  - Glass: Transparency 0.2, dark blue-black backing to simulate space
  - Stars: tiny white Parts scattered beyond viewport
- Command bridge: semicircular room with console stations facing large front viewport
  - Consoles: angled panels with SurfaceGui screens (blue UI elements)
  - Captain's chair: central elevated seat
- Life support: visible ductwork and pipe runs in corridors
- Hangar bay: large open chamber with smaller spacecraft prop, magnetic floor markings
- Solar panels: thin rectangular grids extending from hull exterior on arms
- Communication dish: large parabolic shape (scaled dome mesh) on exterior
- Zero-G area: floating objects (Parts not touching surfaces), handrails along walls
- Emergency lighting: red Neon strips along floor edges (can toggle with scripts)

DO: Engineering everywhere. Visible systems. Functional look. Panel seams.
DON'T: Use natural materials. Nothing organic. No decoration for decoration's sake.

────────────────────────────────────────────────────────────────────────────────
2.19 HAUNTED
────────────────────────────────────────────────────────────────────────────────
Era: any era, decayed. Mood: dread, mystery, abandonment.

COLOR PALETTE:
- Walls: sickly gray-green RGB(130,135,120), dirty gray RGB(120,115,110)
- Wood: rotting brown RGB(80,65,50), near-black RGB(45,40,35)
- Accent: blood red RGB(140,20,20), ghostly blue-white RGB(180,190,210)
- Fog: thick gray-white (Atmosphere density 0.5+)
- Eyes/glow: yellow-green RGB(200,230,50) or red RGB(220,40,40)

MATERIALS: WoodPlanks (rotting wood), Brick (crumbling stone), Concrete (dirty plaster), Metal (rusted)

SIGNATURE ELEMENTS:
- Broken windows: glass Parts with missing sections (only partial glass, leaving gaps)
  - Remaining glass: cracked look using thin dark-line Parts over glass surface
- Crooked angles: deliberately offset Parts by 1-3 degrees from straight
  - Tilting walls, sagging floors, leaning door frames
- Cobwebs: thin white semi-transparent Parts stretched between corners (Transparency 0.4)
  - Triangular shapes in upper corners of rooms
- Overgrown: dark green ivy Parts climbing exterior, dead brown vegetation
- Flickering lights: PointLights with scripts that randomly change Brightness between 0 and 1.5
- Fog: Atmosphere instance with high Density (0.4-0.6), gray Color
- Creaky elements: parts that should look unstable — loose boards (slight offset), hanging shutters (one hinge only)
- Graveyard: tombstone Parts (various shapes — cross, rectangle, arch-top) in rows, dead grass, iron fence
- Skull/bone props: crude shapes on shelves, hanging on walls
- Chandelier: hanging from ceiling by chain, dusty, some candles out (unlit)
- Secret door: bookshelf or painting Part that scripts can move to reveal hidden passage
- Blood/stain: dark red-brown flat Parts on floor or walls (Transparency 0.2)
- Raven/bat: small dark bird/bat shapes perched on ledges

DO: Make everything wrong — crooked, broken, dirty. Use fog. Dim lighting.
DON'T: Make it clean or bright. Don't use saturated colors. Nothing welcoming.

────────────────────────────────────────────────────────────────────────────────
2.20 CARTOON / STYLIZED
────────────────────────────────────────────────────────────────────────────────
Era: any. Mood: fun, exaggerated, playful.

COLOR PALETTE:
- Primary: bright saturated — red RGB(230,50,50), blue RGB(50,100,230), green RGB(50,200,80), yellow RGB(255,220,50)
- Secondary: orange RGB(255,160,40), purple RGB(170,70,200), pink RGB(255,120,170)
- Outlines: dark brown RGB(60,40,20) or black RGB(30,30,30) for edge definition
- White: pure white RGB(255,255,255) for highlights

MATERIALS: Concrete (smooth surfaces — cartoon feel), Fabric (soft items), WoodPlanks (wood items)

PROPORTIONS:
- Exaggerated: heads too big, doors too tall, roofs oversized
- Rounded: round every edge you can (use Sphere/Cylinder meshes liberally)
- Scale mismatch: some things bigger, some smaller than realistic
- Bouncy: things that should be rigid look slightly curved or inflated

SIGNATURE ELEMENTS:
- Thick outlines: dark thin Parts along edges of major shapes (0.05-0.1 studs thick, dark color)
  - Place on visible edges of walls, roofs, windows
- Oversized features: door handle as big as the character's head, chimney twice normal size
- Round shapes: spherical bushes, cylindrical buildings, dome roofs
- Bold unshaded colors: one flat color per surface, no subtle gradients
- Minimal detail: fewer parts but more expressive shapes
- Face props: items with eyes and mouth (SurfaceGui) — smiling house, grumpy rock, happy tree
- Bouncing animation: scripts that give objects a slight bob (TweenService Y oscillation)
- Stars and sparkles: decorative star-shaped Parts or ParticleEmitters near magical/special items
- Speech bubbles: BillboardGui with cartoon-style speech balloon shape
- Sound effects: exaggerated boink, sproing, pop sounds attached to interactions
- Candy/food theme: buildings shaped like or colored like sweets

DO: Make it FUN. Bold colors. Exaggerated proportions. Everything has personality.
DON'T: Make it realistic. No subtle colors. No serious or grimdark elements.


═══════════════════════════════════════════════════════════════════════════════
 SECTION 3: GAME DESIGN PATTERNS — System Architecture Knowledge
═══════════════════════════════════════════════════════════════════════════════

When building game systems, these patterns determine how players FEEL. This is not
code — it is DESIGN KNOWLEDGE about how systems should work architecturally.

────────────────────────────────────────────────────────────────────────────────
3.1 ECONOMY LOOPS
────────────────────────────────────────────────────────────────────────────────

The fundamental loop: EARN → SPEND → EARN MORE → PRESTIGE → RESTART WITH BONUS

Earn sources (pick 2-3 per game):
- Time-based: income per second/minute (idle/tycoon games)
- Action-based: reward per kill, per task completion, per collection
- Discovery-based: finding hidden items, exploring new areas
- Social-based: trading, gifting, cooperation bonuses
- Skill-based: harder tasks = more reward

Spend sinks (critical — without sinks, economy inflates):
- Upgrades: improve earn rate, unlock areas, boost stats
- Cosmetics: skins, effects, decorations (non-power items)
- Consumables: one-use boosts, health potions, teleports
- Entry fees: pay to attempt boss fights, tournaments, special events
- Maintenance: equipment durability, building upkeep

Prestige / Rebirth system:
- Player resets progress to gain a permanent multiplier
- Prestige multiplier: 1.1x to 2x per reset (diminishing returns)
- Keep: permanent upgrades, cosmetics, achievements
- Lose: currency, level, temporary items
- Why it works: gives veterans a reason to replay content, compresses progression

Currency tiers:
- Basic currency: easy to earn, used for common items (Coins, Gold)
- Premium currency: harder to earn or purchased, used for special items (Gems, Crystals)
- Event currency: time-limited, creates urgency
- Rule: premium currency should be EARNABLE in-game, just slower

Pricing psychology:
- Price items at numbers ending in 5 or 0 (250, 500, 1000)
- Create "anchor" items: expensive items that make mid-tier seem cheap
- Bundle discounts: "buy 10 for the price of 8"
- First-purchase bonus: double currency on first transaction

────────────────────────────────────────────────────────────────────────────────
3.2 PROGRESSION CURVES
────────────────────────────────────────────────────────────────────────────────

LINEAR: XP_needed = base * level
- Feels fair but can be boring in long games
- Use for: short games (under 20 levels), tutorial sections
- Example: 100, 200, 300, 400, 500...

EXPONENTIAL: XP_needed = base * multiplier^level
- Gets dramatically harder. Creates prestige demand.
- Use for: long-term games, idle/tycoon, MMO-style
- Example (1.5x): 100, 150, 225, 337, 506...
- Typical multiplier: 1.2x (gentle), 1.5x (moderate), 2x (aggressive)

LOGARITHMIC: XP_needed = base * log(level + 1) * level
- Starts hard, then SLOWS the increase (easier to progress once invested)
- Use for: games that want to be welcoming to new players while still having depth
- Feels rewarding because each level gets proportionally cheaper relative to power

STEPPED: Linear within tiers, then jump at tier boundaries
- Example: levels 1-10 need 100 each, 11-20 need 300 each, 21-30 need 800 each
- Tier boundaries feel like "walls" — natural break points for events/prestige
- Use for: games with distinct chapters or zones

SOFT CAP: Progression slows dramatically after a threshold
- Normal rate to level 50, then 10x XP required per level after that
- Prevents runaway power, keeps endgame players engaged without trivializing content
- Use for: PvP games, competitive balance

────────────────────────────────────────────────────────────────────────────────
3.3 REWARD SCHEDULES (Psychology)
────────────────────────────────────────────────────────────────────────────────

VARIABLE RATIO (most addictive):
- Reward after unpredictable number of actions
- Example: loot drop with 5-20% chance per enemy. Player never knows exactly when.
- Creates "one more try" feeling
- Use for: loot drops, gacha/crate systems, fishing, mining

FIXED RATIO:
- Reward after every N actions
- Example: every 5th kill grants a bonus
- Predictable, satisfying, good for explicit goals
- Use for: quest completion ("kill 10 enemies"), collection ("find 5 gems")

FIXED INTERVAL:
- Reward every N minutes/hours regardless of actions
- Example: daily login reward, hourly income
- Creates habitual return behavior
- Use for: daily rewards, timed chests, passive income

VARIABLE INTERVAL:
- Reward at unpredictable times
- Example: random events, surprise bonuses, meteorite impacts
- Keeps players alert and engaged during otherwise idle periods
- Use for: world events, surprise boxes, NPC encounters

ESCALATING (combine with any above):
- Reward increases with consecutive engagement
- Example: day 1 = 100 coins, day 2 = 200, day 7 = 1000
- Streak breaks reset to day 1 (creates loss aversion)
- Use for: daily login streaks, combo bonuses, achievement chains

────────────────────────────────────────────────────────────────────────────────
3.4 PLAYER ENGAGEMENT LOOPS
────────────────────────────────────────────────────────────────────────────────

CORE LOOP (30 seconds to 2 minutes):
The primary activity repeated constantly.
- Obby: jump → land → jump again
- Tycoon: collect → spend on upgrade → collect faster
- Combat: find enemy → fight → loot → find next enemy
- Builder: place part → admire → plan next part → place
Rule: the core loop must be fun ALONE. If it's not fun without rewards, the game fails.

META LOOP (10 minutes to 1 hour):
The larger goal that gives the core loop purpose.
- Complete a quest chain
- Clear a dungeon/floor
- Build an entire room or structure
- Earn enough for a major upgrade
Rule: meta loop completion should feel like an accomplishment. Celebration moment.

SOCIAL LOOP (variable, multi-session):
Why the player comes BACK and interacts with others.
- Show off builds/items/achievements to other players
- Trade for items they can't get solo
- Compete on leaderboards
- Cooperate on team challenges
- Guild/clan activities
Rule: social loops create emotional investment beyond the game mechanics.

SESSION STRUCTURE:
- First 30 seconds: remind player of progress, show what's new
- Minutes 1-5: quick wins (claim daily, easy quest, check progress)
- Minutes 5-20: core gameplay
- Minutes 20-40: meta loop progress
- Before leaving: save state, tease next session ("tomorrow you'll unlock X")

────────────────────────────────────────────────────────────────────────────────
3.5 DIFFICULTY CURVES
────────────────────────────────────────────────────────────────────────────────

THE LEARNING CYCLE: TEACH → CHALLENGE → MASTER → NEW MECHANIC

Step 1 - TEACH: Introduce ONE new mechanic in a safe environment
- First encounter: impossible to fail (wide platform, slow enemy, clear path)
- Explicit or implicit instruction (sign, NPC hint, obvious visual cue)
- Duration: 30-60 seconds

Step 2 - CHALLENGE: Require the mechanic in increasingly difficult scenarios
- Combine with known mechanics
- Increase speed, reduce margin, add distractions
- 3-5 escalating encounters
- Duration: 2-5 minutes

Step 3 - MASTER: Test true understanding with a boss/gauntlet/test
- Must use mechanic at full difficulty
- Include 1-2 twists (combined with other mechanics)
- Satisfying victory payoff
- Duration: 1-3 minutes

Step 4 - NEW MECHANIC: Layer in the next system, repeat cycle
- Never introduce more than 1 new mechanic per cycle
- Old mechanics remain relevant (don't obsolete)

DIFFICULTY RECOVERY (rubber banding):
- After 3 consecutive deaths: quietly reduce enemy speed by 10%
- After 5 consecutive deaths: offer optional hint system
- After 10 consecutive deaths: unlock skip option (with reduced reward)
- When player succeeds: gradually restore normal difficulty
- NEVER tell the player you're adjusting difficulty — it ruins the feeling

BOSS FIGHT STRUCTURE:
- Phase 1 (100%-70% HP): Use 1-2 attack patterns. Teachable, forgiving.
- Phase 2 (70%-30% HP): New attack patterns, faster, combined mechanics
- Phase 3 (30%-0% HP): Most intense. New visual effects, music intensifies, fastest patterns
- Each phase transition: brief pause, visual transformation, restores some player resources

────────────────────────────────────────────────────────────────────────────────
3.6 SOCIAL MECHANICS
────────────────────────────────────────────────────────────────────────────────

What makes players interact:
- Shared spaces: players can see each other building/playing
- Emotes: quick expression tools (wave, dance, thumbs up)
- Trading: item exchange creates natural social interaction
- Team objectives: tasks that REQUIRE multiple players
- Leaderboards: visible ranking creates aspiration and rivalry
- Chat integration: contextual chat (proximity, team, global)
- Player housing/shops: visiting each other's creations

Social friction reducers:
- Auto-party: matchmake players for group content
- Proximity prompts: "Press E to trade" when near another player
- Built-in emotes: no typing needed for basic expression
- Safe trading: escrow system prevents scams

Social retention hooks:
- Friends list with online status
- "Your friend [name] just achieved X" notifications
- Cooperative rewards: bonus for playing with friends
- Guild perks: passive bonuses when guild mates play

────────────────────────────────────────────────────────────────────────────────
3.7 RETENTION MECHANICS
────────────────────────────────────────────────────────────────────────────────

DAILY REWARDS:
- 7-day escalating calendar (higher value each day)
- Day 7 reward = 5-10x day 1 reward
- Missing a day resets streak (loss aversion)
- Monthly calendar with guaranteed premium item at day 30

STREAKS:
- Track consecutive sessions (days played in a row)
- Multiplier grows: 1.1x, 1.2x, 1.5x, 2x at milestones (3, 7, 14, 30 days)
- Visual indicator: flame icon growing larger with streak

FOMO (Fear Of Missing Out):
- Limited-time events: exclusive rewards only available during event
- Seasonal content: holiday themes that rotate out
- Battle pass: time-limited progression with exclusive cosmetics
- Rotating shop: different items available each day/week

INVESTMENT:
- Building/decorating personal space (sunk effort makes leaving costly)
- Collection completion: 95% complete collection drives 100% completion desire
- Social investment: friends, guild, reputation in community
- Skill investment: mastery that took time to develop

COMEBACK MECHANICS (re-engage lapsed players):
- Accumulated offline earnings (welcome back bonus)
- "We missed you" gift (scales with time away)
- New content notifications
- Catch-up mechanics: accelerated progression for returning players

────────────────────────────────────────────────────────────────────────────────
3.8 MONETIZATION DESIGN
────────────────────────────────────────────────────────────────────────────────

For Roblox specifically (Robux):

Acceptable purchases:
- Cosmetic items (skins, effects, decorations)
- Convenience (teleport, inventory expansion, queue skip)
- Time savers (XP boost, currency boost — limited duration)
- Season/Battle pass (time-limited progression track)
- Cosmetic customization packs

The ethical line:
- NEVER gate core gameplay behind purchases
- NEVER sell power advantages that can't be earned through gameplay
- NEVER use deceptive practices (hidden costs, fake "discounts")
- Every paid item should have a free alternative (maybe harder to get)

Purchase placement:
- After a positive experience (just beat a boss = celebrate with cosmetic)
- When player WANTS something (see other players with cool items)
- Never during frustration (don't offer "pay to skip" during difficulty)
- Natural touchpoints (visiting shop, customization menu)

Robux pricing psychology:
- Small items: 25-75 Robux (impulse purchase)
- Medium items: 100-400 Robux (considered purchase)
- Premium items: 500-1500 Robux (investment purchase)
- Bundles: 15-25% discount vs individual items


═══════════════════════════════════════════════════════════════════════════════
 SECTION 4: ROBLOX-SPECIFIC BUILDING RULES
═══════════════════════════════════════════════════════════════════════════════

────────────────────────────────────────────────────────────────────────────────
4.1 CHARACTER SCALE REFERENCE
────────────────────────────────────────────────────────────────────────────────

Character height: 5 studs (total, standing)
Character width: 2 studs (shoulder to shoulder)
Character depth: 1 stud (front to back)
Head size: 1.2 x 1.2 x 1.2 studs
Arm length: 2 studs (shoulder to hand)
Leg length: 2 studs (hip to foot)
Torso: 2 x 2 x 1 studs

Movement values:
- Default walk speed: 16 studs/second
- Sprint speed (typical): 24-32 studs/second
- Jump height: 7.2 studs (default JumpPower 50)
- Jump distance (horizontal): ~12 studs at full speed

Scale implications:
- Doorway: minimum 4 wide x 7 tall (comfortable), 3 wide x 6 tall (tight fit)
- Hallway: minimum 4 studs wide (single-file), 6+ for comfortable two-way
- Ceiling: 10 studs (low/cozy), 12 studs (standard), 15+ studs (grand)
- Stair step: 1 stud rise, 1 stud run (comfortable), 1.5 rise (steep)
- Ladder rung spacing: 1 stud apart
- Chair seat height: 2-2.5 studs from floor
- Table surface height: 3-3.5 studs from floor
- Counter height: 3.5-4 studs from floor
- Window sill height: 2-3 studs from floor (can see out while standing)
- Railing height: 3 studs from walking surface
- Comfortable reach: 3 studs forward, 4 studs upward from ground
- ProximityPrompt range: typically 6-10 studs

────────────────────────────────────────────────────────────────────────────────
4.2 MATERIAL PROPERTIES
────────────────────────────────────────────────────────────────────────────────

Materials with BUILT-IN textures (these have visible surface patterns):
- Brick: visible brick pattern. Good for walls, fireplaces. Warm.
- Cobblestone: irregular stone pattern. Good for paths, old walls.
- Concrete: smooth concrete. Most versatile neutral material.
- CorrodedMetal: rusty, pitted surface. Abandoned/old items.
- DiamondPlate: cross-hatch raised pattern. Industrial floors, metal surfaces.
- Fabric: soft woven texture. Furniture, clothing, awnings.
- Foil: shiny crinkled surface. Decorative, space themes.
- Glass: transparent with reflections. Windows, crystal, ice.
- Granite: speckled stone. Countertops, decorative stone.
- Grass: green grass texture. Ground, thatch roofs.
- Ice: slightly transparent, blue-white. Frozen surfaces.
- Marble: veined stone. Classical, elegant surfaces.
- Metal: brushed/smooth metal. Modern, industrial.
- Neon: GLOWING. Emits colored light. Signs, indicators, magic.
- Pebble: small rounded stone texture. Gravel, beach.
- Sand: sandy texture. Desert, beach, sandy paths.
- Slate: layered stone. Roofs, cliff faces, natural stone.
- Wood: smooth woodgrain. Structural wood.
- WoodPlanks: visible plank lines. Floors, walls, furniture.

NEVER use SmoothPlastic. It looks cheap and beginner-level.

Transparency-compatible materials: Glass, Ice, Neon
- Glass: 0.4-0.6 transparency for windows
- Ice: 0.1-0.3 for frozen look
- Neon: 0-0.3 (still glows even with some transparency)

Reflectance:
- Metal surfaces: 0.1-0.3 reflectance
- Polished stone: 0.05-0.1
- Glass: handled by material itself
- Water surfaces: 0.2-0.4
- Most other materials: 0 (default)

────────────────────────────────────────────────────────────────────────────────
4.3 LIGHTING BEHAVIOR
────────────────────────────────────────────────────────────────────────────────

PointLight:
- Emits in ALL directions from the parent Part
- Brightness: 0.5 (subtle) to 3 (bright)
- Range: how far the light reaches in studs. 8 (small lamp), 16 (room light), 30 (outdoor light)
- Color: warm interior RGB(255,240,210), cool exterior RGB(220,230,255), fire RGB(255,180,100)
- Best for: lamps, candles, overhead lights, ambient glow
- Tip: Place the PointLight inside a translucent Part for visible source

SpotLight:
- Emits in ONE direction (front face of parent Part by default)
- Angle: cone width in degrees. 30 (narrow beam), 60 (flood), 90 (wide)
- Range: same as PointLight
- Face property: which face of the Part the light comes from (Front, Back, Top, etc.)
- Best for: flashlights, stage lights, downlights, focused illumination
- Tip: Combine with a visible cone-shaped Part for dramatic effect

SurfaceLight:
- Emits from ONE FACE of the parent Part, spread flat
- Angle: how wide the light spreads from the surface
- Range: how far from the surface it reaches
- Best for: wall sconces, neon signs, backlit panels, ambient wall wash
- Tip: Great for creating glow-from-behind effects on signs

Atmosphere:
- Density: 0 (clear) to 1 (opaque fog). Typical: 0.2-0.4
- Offset: how far from camera before fog starts. 0 = immediate, 0.5 = mid-range
- Color: fog/haze tint color. Warm sunset, cool blue, gray overcast
- Decay: how light fades with distance. Warm RGB(240,230,210) for sunset
- Glare: bloom around light sources. 0-1. Subtle = 0.1, dramatic = 0.5
- Haze: overall atmospheric haze. 0-3. Subtle = 0.5, dense = 2

Lighting.ClockTime reference:
- 0: midnight (darkest)
- 6: dawn/sunrise (orange-pink sky)
- 12: noon (brightest, overhead sun)
- 14: afternoon (default, warm light)
- 17.5: sunset (golden hour, dramatic shadows)
- 18: dusk (blue-purple sky, lights turn on)
- 21: night (dark, stars visible)

Post-processing effects:
- Bloom: glow around bright areas. Intensity 0.3-1, Size 20-40, Threshold 0.8-1
- ColorCorrection: adjust overall image. TintColor, Brightness, Contrast, Saturation
- SunRays: god rays from sun position. Intensity 0.1-0.3, Spread 0.2-0.5
- DepthOfField: blur near/far objects. FarIntensity, InFocusRadius, NearIntensity
- BlurEffect: overall blur (use sparingly, mainly for UI overlays)

────────────────────────────────────────────────────────────────────────────────
4.4 PART TYPES AND WHEN TO USE EACH
────────────────────────────────────────────────────────────────────────────────

Part (Block):
- Default rectangular box shape
- Use for: walls, floors, roofs, furniture surfaces, crates, buildings
- Most common Part type — 70%+ of all builds use primarily Block Parts

WedgePart:
- Right-triangle cross-section (a ramp shape)
- Use for: roofs (sloped surfaces), ramps, stairs, angled surfaces
- The SLOPE always goes from the Top face down to the Front face
- Orientation matters: rotate with CFrame.Angles to get slope direction right

CornerWedgePart:
- Triangular pyramid — where two slopes meet at a corner
- Use for: hip roof corners, pyramid tips, angled corner pieces
- Tricky to orient: the angled face goes from one corner down to the opposite edge

TrussPart:
- Ladder-like structure with visible X-pattern
- Use for: climbable surfaces, lattice towers, structural trusses
- Players can CLIMB TrussParts automatically (like a ladder)
- Use carefully: players climbing unintended surfaces can break game flow

Cylinder (Part with SpecialMesh):
- Apply SpecialMesh of type Cylinder to a Part
- Use for: poles, pipes, tree trunks, wheels, columns, barrels
- Scale with SpecialMesh.Scale property

Sphere (Part with SpecialMesh):
- Apply SpecialMesh of type Sphere to a Part
- Use for: canopy, boulders, decorative balls, heads, domes
- Scale independently on each axis for egg shapes, flattened domes, etc.

MeshPart:
- Uses uploaded 3D mesh for custom shapes
- Use for: complex organic shapes not achievable with primitives
- Requires AssetId — either uploaded or from Roblox library
- Heavier on performance than primitive Parts

UnionOperation:
- Result of CSG (Constructive Solid Geometry) — merging/subtracting Parts
- Cannot be created via Luau script at runtime
- For AI builds: use primitive Parts instead, union in Studio later if needed

────────────────────────────────────────────────────────────────────────────────
4.5 CFRAME MATH ESSENTIALS
────────────────────────────────────────────────────────────────────────────────

CFrame = position + orientation combined.

Positioning:
- CFrame.new(x, y, z) — position only, no rotation
- Part.CFrame = CFrame.new(10, 5, 0) puts Part CENTER at (10,5,0)
- Part occupies: center ± Size/2 in each axis

Rotation:
- CFrame.Angles(rx, ry, rz) — rotation in radians
- math.rad(degrees) converts degrees to radians
- CFrame.Angles(math.rad(45), 0, 0) rotates 45 degrees around X axis

Combining position + rotation:
- CFrame.new(x, y, z) * CFrame.Angles(rx, ry, rz)
- Order matters: position first, then rotate AT that position

Relative positioning:
- parentPart.CFrame * CFrame.new(offsetX, offsetY, offsetZ)
- This creates a position RELATIVE to the parent Part's orientation
- Critical for attaching details to angled surfaces

LookAt:
- CFrame.lookAt(fromPosition, targetPosition)
- Makes the Part face toward targetPosition
- Useful for: spotlights, signs facing a direction, NPCs facing player

Common rotation patterns:
- Tilt forward: CFrame.Angles(math.rad(5), 0, 0)
- Lean left: CFrame.Angles(0, 0, math.rad(5))
- Face a direction: CFrame.Angles(0, math.rad(angle), 0) where angle is compass bearing
- 45-degree corner: CFrame.Angles(0, math.rad(45), 0)
- Upside down: CFrame.Angles(math.rad(180), 0, 0)

Z-fighting prevention:
- Two Parts at same position with overlapping sizes = visual flicker
- ALWAYS offset decorative parts by at least 0.05 studs from the surface they sit on
- Window glass: recess 0.05-0.1 behind frame
- Wall trim: protrude 0.04-0.08 from wall surface
- Signs on walls: offset 0.05 from wall face

────────────────────────────────────────────────────────────────────────────────
4.6 PERFORMANCE RULES
────────────────────────────────────────────────────────────────────────────────

Part count guidelines:
- Simple prop: 5-15 Parts
- Complex prop: 15-30 Parts
- Small building: 40-80 Parts
- Medium building: 80-150 Parts
- Large building: 150-250 Parts
- Full game map: aim for under 10,000 total Parts for good performance
- Critical threshold: ~25,000 Parts = noticeable lag on mid-range devices
- Emergency limit: 50,000+ Parts = unplayable on mobile

Optimization techniques:
- Merge purely decorative Parts that never move into fewer larger Parts
- Use Decals and Textures instead of separate Parts for surface detail where possible
- Parts that are never visible (inside sealed walls) should be removed
- Set RenderFidelity to "Performance" for distant objects
- Use StreamingEnabled for large maps (Workspace.StreamingEnabled = true)

When to use Unions vs Parts:
- Unions reduce draw calls when combining many small static Parts
- But Unions cannot be easily modified later
- Unions increase memory when complex (many operations)
- Rule: use Unions for finalized decorative clusters, keep interactive elements as separate Parts

LOD (Level of Detail):
- Close objects (< 30 studs from player): full detail
- Medium distance (30-100 studs): reduce small detail Parts
- Far distance (100+ studs): simplified silhouette only
- Roblox handles some LOD automatically, but smart Part counts help

Anchored vs Unanchored:
- Anchor ALL decorative and structural Parts (Part.Anchored = true)
- Only unanchor Parts that need physics: projectiles, dropped items, ragdolls
- Unanchored Parts that touch = physics simulation = performance cost
- Massless property: useful for welded-to-character items (won't affect character physics)

────────────────────────────────────────────────────────────────────────────────
4.7 COLLISION AND PHYSICS
────────────────────────────────────────────────────────────────────────────────

CanCollide:
- true (default): players and objects cannot pass through
- false: players walk through. Use for decorative elements players shouldn't collide with.
- Set to false for: thin trim strips, decorative bands, small detail Parts, particle holders

CanTouch:
- Controls whether .Touched event fires
- Set to false on decorative Parts to reduce touch event overhead
- Keep true on: collectibles, trigger zones, interactive objects

CanQuery:
- Controls whether Part is hit by raycasts
- Set to false on non-interactive decorative Parts
- Keep true on: clickable objects, surfaces the camera should collide with

CollisionGroup:
- Assign Parts to groups that can selectively collide or pass through each other
- Use case: NPCs that walk through each other but collide with walls
- Use case: player projectiles that hit enemies but not other players
- PhysicsService:RegisterCollisionGroup() to create groups
- PhysicsService:CollisionGroupSetCollidable() to configure interactions

WeldConstraint:
- Rigidly connects two Parts so they move as one
- Part0 and Part1 properties
- Use for: multi-part props, character accessories, vehicle assemblies
- Weld to the ROOT part (the one that moves/is anchored)

HingeConstraint:
- Allows rotation around an axis
- Use for: doors, gates, drawbridge, rotating platforms
- Attachment0 on door, Attachment1 on frame
- UpperAngle/LowerAngle to limit rotation range

SpringConstraint:
- Elastic connection between two Parts
- Use for: bouncy platforms, suspension, bungee effects
- FreeLength, Stiffness, Damping properties

────────────────────────────────────────────────────────────────────────────────
4.8 SOUND DESIGN PRINCIPLES
────────────────────────────────────────────────────────────────────────────────

Spatial vs Ambient:
- Spatial (3D) sounds: come from a specific position, volume decreases with distance
  - Parent the Sound to the Part that produces it
  - RollOffMode: InverseTapered (most natural) or Linear
  - RollOffMaxDistance: 50-100 studs for ambient, 20-40 for small sources
- Ambient sounds: same volume everywhere
  - Parent to SoundService or the player's PlayerGui
  - No spatial positioning

Sound categories and when to use:
- Background music: ambient, loop=true, Volume 0.3-0.5 (never overpower)
- Ambient atmosphere: spatial, loop=true, Volume 0.4-0.7 (wind, rain, crowd noise)
- Sound effects: spatial, loop=false, Volume 0.6-1.0 (footsteps, doors, hits)
- UI sounds: ambient, loop=false, Volume 0.5-0.7 (button clicks, notifications)

Volume scaling rules:
- Background music: 0.3-0.5 (always present but never dominant)
- Environment: 0.4-0.7 (adds atmosphere without drowning gameplay)
- Player actions: 0.6-1.0 (most important — direct feedback)
- Other players: 0.3-0.6 (audible but not overwhelming)
- Enemy actions: 0.5-0.8 (important for gameplay awareness)

────────────────────────────────────────────────────────────────────────────────
4.9 PARTICLE EFFECTS
────────────────────────────────────────────────────────────────────────────────

ParticleEmitter properties:
- Rate: particles per second. 5-10 (subtle), 20-50 (moderate), 100+ (intense)
- Lifetime: how long each particle exists. NumberRange: min, max
- Speed: initial particle velocity. NumberRange: min, max
- SpreadAngle: cone of emission. Vector2(x, y) degrees. (0,0)=focused, (180,180)=omnidirectional
- RotSpeed: rotation speed of particles. NumberRange for range
- Size: particle size over lifetime using NumberSequence
- Transparency: fade in/out using NumberSequence
- Color: color over lifetime using ColorSequence
- Texture: Roblox asset ID for particle image
- LightEmission: 0-1, how much particle adds light (1 = additive/glowy)
- LightInfluence: 0-1, how much world lighting affects particle (0 = self-lit)

Common effect recipes:
- Fire: Rate 30, Lifetime 0.5-1.5, Speed 3-8, Size fades from 1 to 0, Color orange→red→dark, LightEmission 0.8, SpreadAngle (10,10)
- Smoke: Rate 15, Lifetime 2-5, Speed 1-3, Size grows from 0.5 to 3, Color gray→transparent, SpreadAngle (15,15), Rotation random
- Sparkle/Magic: Rate 10, Lifetime 0.5-1, Speed 2-5, Size 0.1-0.3, Color bright, LightEmission 1, SpreadAngle (180,180)
- Rain: Rate 100, Lifetime 1-2, Speed 30-50 (fast downward), Size 0.02x0.5 (thin streaks), Color light blue, SpreadAngle (5,5)
- Dust motes: Rate 3, Lifetime 3-6, Speed 0.5-1, Size 0.1, Color tan/gray, SpreadAngle (180,180), very subtle
- Waterfall splash: Rate 50, Lifetime 0.3-0.8, Speed 5-10, SpreadAngle (30,30) aimed upward, Size 0.2-0.5, Color white-blue
- Leaves falling: Rate 5, Lifetime 3-6, Speed 1-3, RotSpeed random, Size 0.3-0.5, Color green/brown

Performance impact:
- Each active ParticleEmitter adds overhead
- Keep total active emitters under 20-30 in any scene
- Use Rate carefully — 100+ particles/sec per emitter is expensive
- For distant effects, reduce Rate or disable entirely (script LOD)

────────────────────────────────────────────────────────────────────────────────
4.10 TERRAIN API SPECIFICS
────────────────────────────────────────────────────────────────────────────────

workspace.Terrain methods:
- FillBlock(CFrame, Size, Material): fills rectangular volume
- FillBall(Center, Radius, Material): fills spherical volume
- FillCylinder(CFrame, Height, Radius, Material): fills cylindrical volume
- FillWedge(CFrame, Size, Material): fills wedge-shaped volume
- Clear(): removes all terrain

Terrain materials:
- Grass, Sand, Rock, Water, Mud, Cobblestone, Asphalt, Brick
- Concrete, Snow, Ice, Glacier, Salt, Limestone, Sandstone, Slate
- Basalt, Ground, LeafyGrass, Pavement, CrackedLava, WoodPlanks

Terrain resolution: 4 studs per voxel. Smallest detail = 4x4x4 block.
- Implication: terrain cannot show details smaller than ~4 studs
- For detailed ground features smaller than 4 studs, use Parts instead

Water terrain:
- Water material creates swimmable water automatically
- Water level = top of the Water terrain volume
- Shore: use Mud adjacent to Water for natural transition
- River depth: FillBlock at Y=-2 to Y=-6 below ground level

────────────────────────────────────────────────────────────────────────────────
4.11 MODEL ORGANIZATION
────────────────────────────────────────────────────────────────────────────────

Every build must be organized into a Model hierarchy:

MainModel (Model)
├── Foundation (Folder) — base/foundation Parts
├── Walls (Folder) — exterior wall Parts
├── WallDetail (Folder) — trim, bands, pilasters, quoins
├── Windows (Folder) — all window assemblies
├── Doors (Folder) — all door assemblies
├── Roof (Folder) — roof slopes, fascia, gutters, chimney
├── Interior (Folder)
│   ├── Floors (Folder)
│   ├── Walls (Folder)
│   └── Rooms (Folder) — per-room sub-folders
│       ├── LivingRoom (Folder)
│       ├── Kitchen (Folder)
│       └── Bedroom (Folder)
├── Furniture (Folder) — all furniture items
├── Exterior (Folder) — landscaping, paths, fences
└── Lights (Folder) — all light fixtures and PointLights

Naming conventions:
- Parts: descriptive names (WallNorth, RoofSlopeLeft, DoorFrame_Left, WindowSill_3)
- Models: PascalCase (VictorianHouse, OakTree, StreetLamp)
- Folders: PascalCase (Foundation, WallDetail, Interior)
- No spaces in names — use underscores for multi-word Part names
- Number suffix for repeated elements (Window_1, Window_2)


═══════════════════════════════════════════════════════════════════════════════
 SECTION 5: VARIATION TECHNIQUES — Making Every Build Unique
═══════════════════════════════════════════════════════════════════════════════

The AI must NEVER produce identical builds. Every generation should feel fresh
and unique, even when building the same type of object. Here are the systematic
techniques for achieving infinite variation.

────────────────────────────────────────────────────────────────────────────────
5.1 COLOR VARIATION
────────────────────────────────────────────────────────────────────────────────

HUE SHIFTING:
- Start with a base color, shift hue ±10-20 for related colors
- Example: base blue RGB(50,100,200) → shift warm: RGB(50,80,200) → shift cool: RGB(80,120,200)
- Apply different shifts to different parts of the same build

SATURATION VARIATION:
- Same hue, different intensity
- Vivid accent walls vs muted main walls
- Desaturated = aged/weathered look. More saturated = new/vibrant.

PER-PART COLOR NOISE:
- For same-material parts (like brick wall sections), vary each part's color by ±5-15 RGB
- This creates natural-looking material variation
- Example: wall Part 1: RGB(140,70,50), Part 2: RGB(145,65,55), Part 3: RGB(135,75,48)

COLOR PALETTE GENERATION RULES:
- Pick ONE dominant hue for the build
- Trim/accent = complementary hue (opposite on color wheel) or analogous (adjacent)
- Dark areas: reduce all RGB values by 30-50%
- Light areas: increase all RGB values by 30-50%
- Never use pure white RGB(255,255,255) or pure black RGB(0,0,0) — always slightly tinted

SEASONAL COLOR ADAPTATION:
- Spring: light greens, pink accents, bright colors, fresh
- Summer: deep greens, warm yellows, vivid colors, sunny
- Autumn: oranges, reds, browns, muted greens, warm
- Winter: white/gray, blue tints, bare branches, cool

TIME-OF-DAY COLOR ADAPTATION:
- Dawn: warm pink-orange tint on east-facing surfaces
- Day: true colors, bright
- Sunset: golden-orange tint, long shadows
- Night: blue-shifted, desaturated, emphasis on light sources

────────────────────────────────────────────────────────────────────────────────
5.2 DIMENSIONAL VARIATION
────────────────────────────────────────────────────────────────────────────────

NON-STRUCTURAL DIMENSION RANDOMIZATION:
- Vary Part dimensions by ±10-20% on axes that don't affect structural integrity
- Wall thickness: base ±10% (0.45 to 0.55 for a 0.5 base)
- Roof overhang: base ±20% (1.2 to 1.8 for a 1.5 base)
- Window width: base ±15% (2.5 to 3.5 for a 3.0 base)
- Trim width: base ±25% (small trim variations are very noticeable and add character)

PROPORTIONAL VARIATION:
- Same building type, different footprint
- Square (1:1), rectangle (1.5:1), deep rectangle (2:1), L-shape, T-shape, U-shape
- Floor count: 1-story, 2-story, 3-story, split-level
- Roof pitch: 20 degrees (low), 35 degrees (medium), 50 degrees (steep), flat

HEIGHT VARIATION IN REPEATED ELEMENTS:
- Fence pickets: alternate heights by 0.1-0.3 studs
- Bookshelf books: random height within 0.8-1.5 stud range
- Roof crenellations: vary merlon heights by ±0.2 studs
- Column spacing: not perfectly even — 4.8, 5.2, 4.9, 5.1 instead of all 5.0

ORGANIC VS GEOMETRIC VARIATION:
- Natural objects (trees, rocks, terrain): HIGH variation (±20-30%)
- Man-made objects (buildings, furniture): LOW variation (±5-10%)
- Fantasy objects: EXTREME variation (±30-50%)

────────────────────────────────────────────────────────────────────────────────
5.3 LAYOUT VARIATION
────────────────────────────────────────────────────────────────────────────────

ROOM LAYOUT PATTERNS:
- Symmetric: matching rooms on either side of central axis (formal)
- Organic: rooms of different sizes growing naturally from core (cottage)
- Grid: regular room grid with corridors (institutional)
- Radial: rooms arranged around central hub (castle keep, space station)
- Linear: rooms in a line (shotgun house, train car, corridor)

FURNITURE PLACEMENT RULES:
- Never center everything — offset groups for natural feel
- Create conversation zones: seating faces each other around a focal point
- Traffic paths: leave 3-4 stud paths between furniture for character movement
- Wall proximity: large furniture against walls, small items on surfaces
- Focal point: every room has one (fireplace, window, TV, bed)

TOWN/CITY LAYOUT:
- Main road: longest, widest, connects key buildings
- Side streets: branch off main road at angles (not always 90 degrees)
- Buildings face the street (front door toward road)
- Town square: central open area with gathering feature (fountain, statue, market)
- Density gradient: dense center → sparse edges
- Landmark: one building taller/larger/different than others (church, castle, tower)

NATURE LAYOUT:
- Cluster plants — 3-5 trees together, then gap, then another cluster
- Vary spacing — NOT evenly distributed grid
- Size gradient: larger elements in back/center, smaller at edges
- Path of least resistance: paths curve around obstacles, not through them
- Water follows low ground: rivers in valleys, ponds in depressions

────────────────────────────────────────────────────────────────────────────────
5.4 MATERIAL SUBSTITUTION
────────────────────────────────────────────────────────────────────────────────

Equivalent materials for different moods:

WARM mood: WoodPlanks, Brick, Fabric, Grass
COOL mood: Concrete, Metal, Glass, Slate
ROUGH mood: Cobblestone, CorrodedMetal, Slate, Granite
SMOOTH mood: Concrete, Metal, Marble, Glass
NATURAL mood: Wood, Grass, Sand, Slate
INDUSTRIAL mood: Metal, DiamondPlate, Concrete, Brick
MAGICAL mood: Neon, Glass, Ice, Foil

Substitution pairs (same role, different feel):
- Stone wall: Brick (warm) OR Concrete (cool) OR Cobblestone (rough)
- Floor: WoodPlanks (warm) OR Concrete (cool) OR Marble (fancy)
- Roof: Slate (traditional) OR Metal (modern) OR WoodPlanks (rustic) OR Grass (thatch)
- Trim: Metal (modern) OR Wood (traditional) OR Concrete (classical)

────────────────────────────────────────────────────────────────────────────────
5.5 DECORATIVE ELEMENT RANDOMIZATION
────────────────────────────────────────────────────────────────────────────────

For each build, randomly include/exclude optional elements. Not every building
needs every feature. This creates natural variation.

EXTERIOR OPTIONAL ELEMENTS (include 3-5 per build, not all):
□ Flower boxes under windows
□ Shutters on windows
□ Chimney
□ Weathervane or antenna
□ Awning over door
□ Lamp post near entrance
□ Bench outside
□ Mailbox
□ Fence/wall around property
□ Garden/landscaping
□ Garage/carport
□ Satellite dish
□ Balcony on second floor
□ Dormer windows
□ Porch swing
□ Flag or banner
□ House numbers on wall or post

INTERIOR OPTIONAL ELEMENTS (include 2-3 per room):
□ Rug on floor
□ Clock on wall
□ Picture frames on walls
□ Plants (potted)
□ Curtains on windows
□ Ceiling fan
□ Bookshelf
□ Vase with flowers
□ Mirror
□ Throw pillows on furniture
□ Pet bed
□ Desk items (computer, papers, pen holder)

────────────────────────────────────────────────────────────────────────────────
5.6 ARCHITECTURAL FEATURE SWAPPING
────────────────────────────────────────────────────────────────────────────────

For the same building TYPE, swap key architectural features:

WINDOW VARIATIONS (pick one per build):
→ Flat window with simple frame
→ Bay window (3-sided protrusion)
→ Arched top window
→ Round/porthole window
→ Floor-to-ceiling glass panel
→ Small square windows in grid
→ Shuttered window
→ Stained glass with colored panes

ROOF VARIATIONS (pick one per build):
→ Gable (simple peaked)
→ Hip (4-sided slope)
→ Gambrel (barn style)
→ Flat with parapet
→ Shed (single slope)
→ Mansard (French style)
→ Multiple gables (complex roofline)
→ Dome or tower element

ENTRANCE VARIATIONS (pick one per build):
→ Simple door with small overhang
→ Grand portico with columns
→ Recessed alcove entrance
→ Double doors with sidelights
→ Arched entrance with decorative surround
→ Dutch door (split horizontal)
→ Sliding barn-style door
→ Gate and courtyard leading to door

CORNER TREATMENTS (pick one per build):
→ Quoins (alternating stone blocks)
→ Smooth (no corner detail)
→ Pilaster (embedded column)
→ Rounded corner
→ Beveled/chamfered corner

────────────────────────────────────────────────────────────────────────────────
5.7 STYLE MIXING
────────────────────────────────────────────────────────────────────────────────

Combining TWO styles creates something unique that feels intentional:

EFFECTIVE COMBINATIONS:
- Victorian + Steampunk = brass-fitted ornate mansion with gears and pipes
- Modern + Industrial = loft-style with exposed brick and clean lines
- Medieval + Fantasy = enchanted castle with crystal spires and magical glow
- Japanese + Modern = zen minimalism with clean lines and natural materials
- Gothic + Haunted = abandoned cathedral with broken windows and fog
- Tropical + Fantasy = magical island with glowing plants and floating platforms
- Art Deco + Sci-Fi = retro-futuristic with gold geometric patterns and holographics
- Rustic + Industrial = farmhouse brewery with reclaimed wood and metal accents
- Egyptian + Space Station = ancient alien temple with high-tech and sandstone
- Cyberpunk + Underwater = neon-lit deep sea habitat with holographic fish

MIXING TECHNIQUE:
1. Pick a PRIMARY style (60-70% of the design language)
2. Pick a SECONDARY style (30-40% of the design language)
3. Primary dictates: overall shape, proportions, layout
4. Secondary contributes: materials, decorative elements, color accents, mood
5. Find a narrative reason: "this is an ancient temple retrofitted with modern tech"

────────────────────────────────────────────────────────────────────────────────
5.8 ENVIRONMENTAL STORYTELLING
────────────────────────────────────────────────────────────────────────────────

Buildings and environments should tell a STORY about who lives/lived there
and what happened. This makes each build feel alive and unique.

WEAR AND AGE:
- New building: clean colors, sharp edges, no damage
- Lived-in: slight color variation, personal items visible, warm lighting
- Old: darker colors (reduce brightness 10-20%), more material variation, moss/vine growth
- Abandoned: broken windows (partial glass), crooked parts, vegetation overgrowth, dark interior
- Ruined: missing wall sections, collapsed roof parts, rubble props at base, nature reclaiming

PERSONALIZATION CLUES:
- Sports equipment outside (active family)
- Many bookshelves (scholar/intellectual)
- Workshop/tools visible (craftsperson)
- Garden with vegetables (self-sufficient)
- Toys scattered (family with children)
- Musical instruments visible (musician)
- Trophies/awards displayed (achiever)
- Maps and travel souvenirs (explorer)

HISTORY INDICATORS:
- Patched wall sections (damage repaired)
- Addition rooms (building grew over time — different materials per era)
- Bricked-up windows (rooms repurposed)
- Layer of materials (stone foundation, wood upper = different building periods)
- Faded signage (former business, now residence)

CONTEXT CLUES:
- Coastal: salt-weathered wood, rope decorations, marine items
- Mountain: heavy stone construction, steep roof (snow shed), wood pile
- Desert: thick walls, small windows (heat), courtyard, water features precious
- Urban: no yard, shared walls, fire escape, garbage bins
- Rural: large property, outbuildings (barn, shed), animals, fields

────────────────────────────────────────────────────────────────────────────────
5.9 SEASONAL AND TIME ADAPTATION
────────────────────────────────────────────────────────────────────────────────

When a user mentions or implies a season or time, adapt the entire build:

SPRING BUILD:
- Light green foliage, cherry blossom trees (pink canopy)
- Flower beds around buildings
- Bright, clear lighting (ClockTime 14)
- Open windows, light curtains
- Fresh paint colors (brighter palette)

SUMMER BUILD:
- Full deep green canopy, lush vegetation
- Swimming pool or water features
- Bright harsh sunlight (ClockTime 12-13)
- Awnings and shade structures
- Outdoor furniture (patio set, grill, hammock)

AUTUMN BUILD:
- Orange/red/brown foliage, some bare branches
- Leaf piles on ground (small orange/brown Parts)
- Warm golden lighting (ClockTime 16-17)
- Pumpkins at doorsteps
- Cozy interior lighting, fireplaces active

WINTER BUILD:
- Bare trees (no canopy, just trunk + branches)
- Snow on rooftops (thin white Parts on top surfaces)
- Cool blue lighting (Atmosphere blue tint)
- Icicles hanging from eaves (thin transparent Parts)
- Warm interior glow visible through windows
- Smoke from chimney (ParticleEmitter)
- Snowman and footprints as props

NIGHT BUILD:
- All exterior lights active (warm PointLights)
- Windows glow from interior lights
- Moonlight (Lighting.ClockTime = 0, blue Atmosphere)
- Stars visible (if outdoor scene)
- Street lamps essential for atmosphere
- Security/motion lights on buildings
- Neon signs more prominent

DAY BUILD:
- Natural sunlight dominant
- Interior lights optional (off or dim)
- Shadows important (Sun position creates them)
- Exterior colors fully visible
- Activity props (people, vehicles, open shops)

────────────────────────────────────────────────────────────────────────────────
5.10 SCALE VARIATION FOR DRAMA
────────────────────────────────────────────────────────────────────────────────

Deliberately playing with scale creates memorable, unique builds:

OVERSIZED ELEMENTS (make something bigger than expected):
- Giant door on normal building (grand entrance)
- Oversized clock face on tower
- Massive tree in a small garden (dominates space)
- Enormous throne in a castle hall
- Giant weapon as a monument/statue

UNDERSIZED ELEMENTS (make something smaller than expected):
- Tiny door on a large building (whimsical/fairy)
- Small windows on thick walls (fortress/bunker feel)
- Miniature buildings as decorative elements (model village)
- Small furniture in a large room (emphasizes room grandeur)

FORCED PERSPECTIVE:
- Background buildings slightly smaller than foreground (creates depth illusion)
- Paths narrowing toward horizon
- Distant mountains at reduced scale
- Towers that taper dramatically (appear taller)

CONTRASTING SCALES IN ONE SCENE:
- Massive castle next to tiny cottage
- Giant ancient ruins with small modern camp inside
- Huge cave entrance with tiny village within
- Enormous robot/creature next to normal-sized buildings

CHILD-FRIENDLY SCALE:
- Exaggerated proportions (head too big, eyes too large)
- Oversized interactive elements (big buttons, large handles)
- Friendly rounded shapes (no sharp dangerous-looking edges)
- Bright colors at interaction points

═══════════════════════════════════════════════════════════════════════════════
 SECTION 6: ADVANCED OBJECT ANATOMY — Complex & Thematic Builds
═══════════════════════════════════════════════════════════════════════════════

────────────────────────────────────────────────────────────────────────────────
6.1 CASTLE INTERIOR ROOMS
────────────────────────────────────────────────────────────────────────────────

THRONE ROOM (30+ parts):
- Great hall: 30-40 studs long, 20 studs wide, 16-20 studs ceiling
- Throne: elevated platform (3 steps up) at far end
  - Chair: high-backed ornate seat (8+ parts — base, seat, back, armrests, top crest)
  - Material: Gold-accented Wood or Stone
- Carpet runner: long red Part from door to throne, Fabric material, RGB(160,30,30)
- Columns: 4-8 along sides, supporting ceiling beams
- Wall tapestries: flat colored Parts hanging from wall (2-3 per side wall)
- Chandelier: central hanging fixture (ring + chains + candle Parts + PointLights)
- Guards: 2 NPC positions flanking throne
- Banners: hanging from ceiling beams, house colors

DUNGEON (20+ parts):
- Below ground level (Y negative or accessible by stairs)
- Cell walls: thick (2 studs), stone/brick material, dark gray
- Iron bars: thin vertical cylinders across cell openings, 0.2 diameter, spaced 0.5 apart
- Shackles: small chain-like Parts on wall
- Torch sconces: bracket + flame Part + PointLight (flickering orange, dim)
- Dripping water: tiny blue Parts or ParticleEmitter on ceiling
- Hay: scattered yellow flat Parts on cell floors
- Rat: tiny dark prop in corner (3 parts: body + tail + head)

KITCHEN / GREAT KITCHEN (25+ parts):
- Large fireplace: stone arch opening, 6 studs wide, 4 tall, with fire inside
- Cooking spit: horizontal bar across fireplace, hanging pot
- Long preparation table: 10+ studs long, wooden
- Hanging utensils: small Parts suspended from ceiling rack
- Barrel storage: 3-5 barrels along one wall
- Herb bundles: small green Parts hanging upside down
- Bread/food props: small colored shapes on table and shelves
- Sink/wash basin: stone basin on wooden stand

ARMORY (20+ parts):
- Weapon racks on walls: horizontal bars with sword/spear shapes hanging
- Armor stands: crude mannequin shapes (cylinder body + sphere head + plate Parts)
- Shield display: mounted on walls between weapon racks
- Workbench: heavy wooden table with tools (hammer, tongs as small props)
- Grindstone: cylinder wheel on frame stand
- Storage chests: 2-3 chest props for arrows, supplies

────────────────────────────────────────────────────────────────────────────────
6.2 SHOP INTERIORS BY TYPE
────────────────────────────────────────────────────────────────────────────────

GENERAL STORE (25+ parts):
- Front counter: L-shaped counter with cash register prop (5 parts)
- Display shelves: 3-4 wall-mounted shelves with varied goods
- Goods: small colored Parts representing produce, tools, supplies
- Hanging scale: two dishes on chains from overhead bar
- Barrel of goods: open barrel with items visible inside
- Signage: SurfaceGui on front window with store name
- Bell above door: tiny Part + SurfaceGui for "ring" text
- Floor: WoodPlanks, creaky-looking (slightly different colored planks)

BLACKSMITH (20+ parts):
- Forge: stone base with fire inside (Neon orange Parts + PointLight)
- Anvil: dark metal T-shaped prop (4 parts)
- Quench bucket: cylinder with dark water surface Part
- Tool rack: wall-mounted with tong/hammer/file shapes
- Weapon display: finished swords/shields on wall or stand
- Bellows: accordion-shaped Part next to forge
- Coal pile: dark rough Parts near forge
- Chimney: extends through roof from forge

POTION SHOP / APOTHECARY (25+ parts):
- Shelves floor to ceiling: packed with bottle props (many small colored Parts)
- Cauldron: large bowl shape on tripod legs, green bubbling ParticleEmitter
- Ingredient jars: larger containers with SurfaceGui labels
- Hanging herbs: dried plant bundles from ceiling
- Crystal ball: transparent sphere on stand, faint PointLight inside
- Mortar and pestle: small bowl + cylinder prop on counter
- Mysterious books: stacked with slight tilts, dark covers
- Smoke/mist: ParticleEmitter low to ground, translucent gray

BAKERY (20+ parts):
- Large oven: brick structure with arch opening, warm PointLight inside
- Display case: glass-fronted counter (Transparency 0.4) with bread/cake props inside
- Flour sacks: soft fabric-looking Parts (3-4) stacked in corner
- Rolling pin: small cylinder on counter
- Dough: cream-colored blob Part on counter surface
- Bread baskets: shallow containers with bread-shaped props
- Hanging price board: wooden Part with SurfaceGui listing items
- Aroma: subtle warm-colored ParticleEmitter near oven (invisible but adds particles)

────────────────────────────────────────────────────────────────────────────────
6.3 NATURE AND BIOME DETAILS
────────────────────────────────────────────────────────────────────────────────

FOREST FLOOR DETAIL:
- Leaf litter: 10-15 tiny flat Parts scattered, brown/orange, slight rotation
- Mushroom clusters: 2-3 groups of tiny mushroom props (stem cylinder + cap disk)
  - Varied colors: brown, red-white spotted, yellow, purple
- Fallen log: horizontal cylinder, dark brown, partially buried, moss patches (green flat Parts on top)
- Tree stump: short wide cylinder with rings visible (SurfaceGui or color rings)
- Fern: 3-4 angled green leaf Parts spreading from central point
- Berry bush: dark green sphere with tiny red/blue dot Parts
- Spider web: thin white Parts in radial pattern between two trees (3-5 radial + spiral lines)
- Wildflowers: tiny colored Parts (yellow, purple, white) scattered in patches

DESERT ENVIRONMENT:
- Sand dunes: terrain FillBall with Sand, or large smooth Parts angled
- Cacti: green cylinder trunk (2-3 studs tall) + branch arms (angled cylinders off sides)
  - Variety: saguaro (branching arms), barrel (short fat cylinder), prickly pear (stacked flat ovals)
- Bleached bones: white Parts arranged as scattered skeleton fragments
- Tumbleweeds: small brown sphere wireframe-look Props
- Desert rock: red-brown angular Parts with Sandstone material
- Oasis: small water pool + 2-3 palm trees + green vegetation patch (sudden color change)
- Cracked ground: flat Part with dark line Parts creating crack pattern
- Mirage effect: thin transparent shimmering Part at horizon (ParticleEmitter heat haze)

SNOW / ARCTIC ENVIRONMENT:
- Snowdrifts: white terrain FillBalls or smooth white Parts with rounded shapes
- Frozen lake: flat Ice material Part with slight blue tint, reflectance 0.3
- Icicles: thin transparent Parts hanging from edges (Glass material, light blue)
- Snow-covered trees: regular trees but with white Parts on top of canopy
- Footprints: small dark indentation Parts in snow (if telling a story)
- Ice cave entrance: arch of Ice material Parts
- Aurora: high above, several transparent colored Parts (green, purple, blue) with slight transparency
- Snowfall: ParticleEmitter from high Part, white particles, slow fall speed

VOLCANIC ENVIRONMENT:
- Lava flows: bright orange-red Parts with Neon material + PointLight
  - Flow path: following terrain downslope, pooling in low areas
- Volcanic rock: dark gray-black Parts with Basalt material, jagged shapes
- Steam vents: small ground holes with white ParticleEmitter (upward puffs)
- Obsidian: very dark, slightly reflective Parts (Glass material, very dark color)
- Dead trees: charred black trunks, no leaves, spindly
- Ash: gray flat terrain, darker than normal ground
- Crater: depression in terrain with lava pool at bottom

UNDERWATER SCENE DETAILS:
- Coral varieties: brain (lumpy sphere), fan (thin broad Part), tube (vertical cylinders), branch (angular upward stems)
- Seaweed: green thin Parts, slight wave (varied heights, lean angles)
- Sea anemone: cluster of thin colorful cylinders with slightly wider tips
- Treasure scatter: gold coin Parts, gem-colored small Parts, open chest prop
- Shipwreck: broken hull Parts (angled, partially buried in sand), torn sail fabric
- Schools of fish: 5-10 tiny colored teardrop Parts in loose formation
- Jellyfish: dome (Glass material, transparency 0.3) + trailing tentacle Parts below + Neon glow
- Clam: two oval shell Parts slightly open + pearl (small white sphere) visible inside

────────────────────────────────────────────────────────────────────────────────
6.4 MECHANICAL AND INDUSTRIAL OBJECTS
────────────────────────────────────────────────────────────────────────────────

GEAR / COG: 8+ parts
- Central hub: cylinder, 0.5 stud diameter
- Tooth ring: build teeth from small rectangular Parts arranged in circle
  - Number of teeth: 8 (small gear), 12 (medium), 16+ (large)
  - Tooth shape: small rectangle (0.2 x 0.3 x gear_thickness)
  - Spacing: 360/tooth_count degrees apart
- Axle hole: visual only (darker center circle Part)
- Material: Metal, brass RGB(180,140,60) or iron gray

CONVEYOR BELT: 10+ parts
- Frame: two parallel rails (long thin Parts)
- Rollers: cylinders spanning between rails, spaced every 1-2 studs
- Belt surface: flat Part on top (slightly wider than frame)
  - Material: Fabric (dark gray) or DiamondPlate
- End drums: larger cylinders at each end
- Support legs: at each end and middle
- Motion script: animate belt surface texture offset or move Parts

CRANE: 15+ parts
- Base platform: heavy flat Part, anchored
- Tower: vertical structure (lattice of thin Parts or solid column)
- Boom arm: long horizontal beam extending from tower top
- Counterweight: heavy block on short end of boom
- Cable: thin Part descending from boom tip
- Hook: curved Part at cable end
- Cab: small enclosed box where operator sits
- Turntable: visible rotation joint at tower-boom connection

GENERATOR / ENGINE: 12+ parts
- Main body: large box or cylinder shape
- Exhaust pipe: cylinder extending upward, slight smoke ParticleEmitter
- Fuel tank: cylinder mounted on side
- Control panel: small flat Part with SurfaceGui gauges
- Cooling fins: several thin parallel Parts along one side
- Vibration: optional script for slight shaking animation
- Sound: mechanical humming Sound object
- Wiring: thin colored Parts connecting to nearby structures

WATER WHEEL: 12+ parts
- Wheel: large circle built from Parts (6-8 spoke Parts from center hub to outer rim)
- Paddles: flat Parts attached to outer rim (6-8 paddles)
- Axle: horizontal cylinder through center hub
- Support frame: A-frame on each side holding axle
- Water channel: U-shaped Part directing water to wheel
- Building connection: axle extends into mill building wall
- Wheel diameter: 6-10 studs

────────────────────────────────────────────────────────────────────────────────
6.5 SPORTS AND RECREATION
────────────────────────────────────────────────────────────────────────────────

BASKETBALL COURT: 15+ parts
- Court floor: flat Part 28x15 studs, WoodPlanks material, polished
- Lines: thin Parts (0.05 tall) inset in floor — center circle, three-point arcs, free-throw lines, boundary
- Hoops: 2 assemblies, each with:
  - Backboard: flat Part 3x2, white with SurfaceGui square
  - Rim: thin ring (build from 4-6 short Parts in a square, or use cylinder mesh)
  - Net: optional hanging mesh (small Parts or omit for simplicity)
  - Pole: cylinder support, 10 studs tall
- Scoreboard: wall-mounted or freestanding with SurfaceGui

SWIMMING POOL: 12+ parts
- Pool basin: recessed Part (dig into ground) filled with Water-colored transparent Part
- Deck: surrounding flat Parts with concrete/tile material
- Ladder: thin metal frame with rungs, at pool edge
- Diving board: horizontal plank extending over pool, on support stand
- Lane dividers: thin colorful Parts floating on water surface
- Pool house: small nearby structure

PLAYGROUND: 20+ parts
- Swing set: A-frame (2 A-shaped supports + top bar) + 2-3 swing seats (flat Part on chain/rope Parts)
- Slide: tall platform + angled smooth Part sliding surface + ladder to climb
- Merry-go-round: flat circular platform on center pole
- Sandbox: low-walled rectangular box filled with Sand-colored Part
- Bench: for parents nearby
- Safety surface: rubber-colored flat Part under equipment (dark red/brown)
- Fence: low fence around playground perimeter

CAMPSITE: 15+ parts
- Tent: triangular prism shape (2 angled flat Parts meeting at ridge) or dome (half-sphere)
  - Material: Fabric, colors: green, blue, orange
  - Ground sheet: slightly larger flat Part underneath
- Campfire: (see campfire anatomy above)
- Cooler: small box Part, blue, with lid
- Camping chairs: folding chair shape (X-legs + seat + back, thin Parts)
- Lantern: hanging from nearby tree branch or on table
- Sleeping bags: long thin Fabric Parts inside tent, different colors
- Log seating: thick short cylinders around campfire
- Fishing rod: leaning against tree (thin Parts)
- Path to water: dirt-colored flat Parts leading to lake/river

────────────────────────────────────────────────────────────────────────────────
6.6 TRANSPORTATION INFRASTRUCTURE
────────────────────────────────────────────────────────────────────────────────

TRAIN STATION: 25+ parts
- Platform: raised concrete slab (0.5-1 stud above track level), 30+ studs long
- Canopy: roof structure over platform (columns + angled roof Parts)
- Tracks: 2 parallel metal rails (thin Parts) on wooden sleepers (cross-ties spaced every 1 stud)
- Station building: small office with ticket window, waiting area
- Benches: along platform
- Clock: mounted on wall or pole
- Signal light: red/green light on pole at platform end
- Name sign: platform-mounted sign with station name (SurfaceGui)
- Luggage cart: small wheeled platform prop

DOCK / PIER: 18+ parts
- Pilings: vertical cylinders driven into water, visible above and below surface
- Deck planks: horizontal WoodPlanks Parts spanning between pilings
- Mooring posts: thick short cylinders at pier edge with rope loops
- Rope coils: circular flat Part stacked to look like coiled rope
- Gangplank: angled plank from pier down to water level
- Lantern: on tall post at pier end, warm PointLight
- Fishing nets: draped fabric-like Parts
- Crab traps: small box frames with grid pattern
- Boat (small): tied to pier

AIRPORT RUNWAY SECTION: 15+ parts
- Runway surface: very long flat Part, Asphalt/Concrete material
- Center line: dashed white Parts down middle
- Threshold markings: parallel white bars at end
- Edge lights: small Parts with PointLight at regular intervals along edges
- Taxiway: branching narrower path, yellow center line
- Windsock: pole with cone-shaped fabric Part
- Control tower: tall building nearby with glass top floor

────────────────────────────────────────────────────────────────────────────────
6.7 FOOD ESTABLISHMENTS
────────────────────────────────────────────────────────────────────────────────

PIZZA SHOP: 25+ parts
- Storefront: large window display, neon "OPEN" sign (Neon material, red)
- Counter: L-shaped with glass display case showing pizza props
- Pizza oven: brick dome shape at back with warm glow inside
- Menu board: wall-mounted Part with SurfaceGui
- Tables: 3-4 small round tables with chairs
- Cash register: prop on counter
- Ingredient station: behind counter with toppings
- Spinning sign: outside, optional rotation script
- Checkered floor: alternating black and white floor Parts

COFFEE SHOP: 25+ parts
- Espresso machine: complex prop (6+ Parts — body, group head, steam wand, cups on top)
- Display case: glass-fronted with pastry/cake props inside
- Menu board: large chalkboard-style (dark green/black Part with SurfaceGui white text)
- Comfy seating: mix of individual chairs, small couches, bar stools at counter
- Bookshelf accent: one wall section with books
- Pendant lights: hanging from ceiling at varied heights, warm glow
- Plant decorations: 2-3 potted plants
- Laptop prop: on one table (player-work atmosphere)
- WiFi sign: small SurfaceGui on counter
- Mugs and cups: small props on tables and behind counter

═══════════════════════════════════════════════════════════════════════════════
 SECTION 7: ADVANCED GAME DESIGN — Player Psychology and Balance
═══════════════════════════════════════════════════════════════════════════════

────────────────────────────────────────────────────────────────────────────────
7.1 PLAYER ARCHETYPES (Bartle's Taxonomy adapted for Roblox)
────────────────────────────────────────────────────────────────────────────────

ACHIEVERS (diamonds) — ~40% of Roblox players:
- Want: progress, completion, high scores, rare items, badges
- Design for them: achievement systems, collection logs, prestige ranks, rare drops
- Keep them with: always one more goal to chase, visible progress bars

EXPLORERS (spades) — ~25% of Roblox players:
- Want: discover secrets, hidden areas, lore, unique experiences
- Design for them: secret rooms, easter eggs, hidden achievements, extensive map
- Keep them with: regular new content, mysteries, hidden mechanics

SOCIALIZERS (hearts) — ~25% of Roblox players:
- Want: interact with others, customize appearance, express themselves
- Design for them: emotes, customization, trading, shared spaces, group activities
- Keep them with: community events, social features, friend bonuses

KILLERS (clubs) — ~10% of Roblox players:
- Want: competition, PvP, leaderboards, domination
- Design for them: arenas, rankings, competitive modes, power progression
- Keep them with: seasons, rank resets, competitive events, bragging rights

BEST PRACTICE: Design for achievers and socializers FIRST (65% of audience),
then add explorer and competitive content for retention.

────────────────────────────────────────────────────────────────────────────────
7.2 ONBOARDING AND TUTORIAL DESIGN
────────────────────────────────────────────────────────────────────────────────

THE FIRST 30 SECONDS (make or break):
1. Player spawns. Immediate visual wow (beautiful environment, particle effects, music).
2. Clear first action: arrow/highlight pointing to first interact. "Press E" or auto-dialog.
3. First reward within 10 seconds of action (coins appear, XP bar fills, item received).
4. NEVER wall of text. Never NPC with 5 paragraphs. One sentence max per dialog step.

THE FIRST 5 MINUTES:
- Teach ONE mechanic per minute (movement, combat, collecting, building, using shop)
- Each mechanic taught by DOING, not reading (guided action, not tutorial text)
- Reward after each mechanic learned
- By minute 5: player understands core loop and has personal investment (items earned, stats gained)

THE FIRST SESSION (15-30 minutes):
- Complete first mini-goal (reach level 5, build first base, defeat first boss)
- Unlock personalization (first cosmetic choice, name their thing, make a decision)
- Show what's coming (glimpse of locked content, preview of next zone, higher-level player passing through)
- End on a hook: "Come back tomorrow for your daily bonus" or "Zone 2 unlocks at level 10"

TUTORIAL ANTI-PATTERNS (never do these):
- Long cutscene before any gameplay
- Force-walking to NPCs who lecture
- Disabling player movement during tutorial
- Teaching advanced mechanics before basics
- Requiring reading to proceed
- Punishing mistakes during tutorial
- Making tutorial unskippable for returning players

────────────────────────────────────────────────────────────────────────────────
7.3 BALANCE NUMBERS AND TUNING
────────────────────────────────────────────────────────────────────────────────

HEALTH AND DAMAGE:
- Player base health: 100 (universal Roblox standard)
- Weapon damage range: 10-30% of health per hit (3-10 hits to kill)
- Healing rate: slower than damage rate (healing 10/sec, damage 25/hit)
- Boss health: 10-50x player health (team fights)
- Trash mob health: 50-150% of player health (quick fights)

ECONOMY NUMBERS:
- First item costs: 10-50 currency (achievable in 1-2 minutes)
- Endgame items cost: 100,000-1,000,000 currency (hours to days of play)
- Inflation check: total currency earned per hour should stay within 2-5x of starting rate even at max level
- Prestige cost: all current progress (reset to 0, gain permanent 1.1-2x multiplier)

SPEED AND TIMING:
- Default walk: 16 studs/sec
- Sprint: 24-32 studs/sec (1.5-2x walk)
- Vehicle: 40-80 studs/sec (faster than sprint)
- Respawn time: 3-5 seconds (never more than 10)
- Ability cooldowns: 1-3 seconds (spammable), 10-30 seconds (powerful), 60+ seconds (ultimate)
- Session time target: 15-30 minutes average (Roblox attention spans)

XP AND LEVELING:
- Level 1-10: tutorial zone, 5-15 minutes per level
- Level 11-25: main game, 15-30 minutes per level
- Level 26-50: endgame, 30-60 minutes per level
- Level 50+: prestige zone, 1-3 hours per level
- Total to max level: 20-40 hours of gameplay (gives sense of accomplishment without being grindy)

DROP RATES:
- Common items: 50-80% drop rate
- Uncommon: 15-30% drop rate
- Rare: 3-8% drop rate
- Epic: 0.5-2% drop rate
- Legendary: 0.1-0.5% drop rate
- Mythic: 0.01-0.05% drop rate (grail items)

────────────────────────────────────────────────────────────────────────────────
7.4 MAP FLOW AND SPATIAL DESIGN
────────────────────────────────────────────────────────────────────────────────

LINEAR MAPS:
- Zones connected end-to-end
- Natural progression: easy zone → medium → hard → boss
- Gating: requires level/key/quest to enter next zone
- Use for: story games, obby courses, dungeon crawlers
- Width: enough for exploration within zone (not just a corridor)

HUB-AND-SPOKE:
- Central hub area with paths leading to different zones
- Each spoke is a self-contained activity area
- Hub contains: spawn, shops, social area, portal to each zone
- Use for: tycoons, simulators, RPGs with varied content
- Players choose their own path

OPEN WORLD:
- Large continuous map with soft zone boundaries
- Difficulty gradient from center (easy) to edges (hard)
- Points of interest scattered across map
- Roads/paths connecting major locations
- Use for: exploration games, survival, open RPGs
- Performance challenge: StreamingEnabled essential

VERTICAL MAPS:
- Tower/dungeon structure going up or down
- Each floor is a challenge or zone
- Elevators/stairs between floors
- Use for: tower defense, dungeon games, vertical obby

SPAWN AREA DESIGN (critical):
- Safe zone: no enemies, no damage, no environmental hazards
- Clear directions: visual cues (signs, paths, lights) pointing to gameplay
- Shop access: basic shop nearby (but not blocking path)
- Social space: area where players naturally congregate (wide, well-lit, seating)
- Beauty: spawn area is the FIRST impression — make it gorgeous
- Performance: keep spawn area under 2000 Parts (loaded for everyone always)

────────────────────────────────────────────────────────────────────────────────
7.5 SOUND AND MUSIC DESIGN PATTERNS
────────────────────────────────────────────────────────────────────────────────

MUSIC ZONES:
- Each major area has its own background music
- Transition: crossfade when entering new zone (fade old out, fade new in over 2 seconds)
- Intensity layers: ambient base layer + action layer that fades in during combat
- Boss music: distinct, dramatic, louder, faster tempo than zone music

AUDIO FEEDBACK PRIORITIES:
1. Player actions: button clicks, footsteps, jumps, attacks — ALWAYS have feedback
2. Rewards: collecting items, leveling up, achievement — SATISFYING sounds
3. Damage: hit taken, health low warning — CLEAR warnings
4. Environment: ambient atmosphere — SUBTLE presence
5. Other players: actions at distance — REDUCED volume

FOOTSTEP SYSTEM:
- Different sound per material walked on (wood creak, stone tap, grass soft, metal clang)
- Detect material under player's feet and play appropriate sound
- Playback rate varies slightly (±5%) each step for natural feel
- Volume scales with movement speed (sprint louder than walk)

────────────────────────────────────────────────────────────────────────────────
7.6 WEATHER AND ATMOSPHERE SYSTEMS
────────────────────────────────────────────────────────────────────────────────

WEATHER TYPES AND THEIR VISUAL COMPONENTS:
- Clear: high sun, bright colors, no particles, Atmosphere density 0.15
- Cloudy: muted lighting, Atmosphere density 0.3, gray Color, reduced SunRays
- Rain: ParticleEmitter rain, Atmosphere density 0.4, puddle Parts on ground, reduced brightness, wet surface look (increase reflectance slightly)
- Heavy rain: more particles, thunder Sound objects (random timing), lightning flash (brief Brightness spike in Lighting), fog at ground
- Snow: white ParticleEmitter (slower, floating fall), Atmosphere density 0.3, white ground accumulation, cool blue tint
- Fog: Atmosphere density 0.5-0.7, very short FogEnd (50-100 studs), mysterious feel
- Sandstorm: tan/brown ParticleEmitter (horizontal movement), Atmosphere density 0.6, warm brown Color, reduced visibility

WEATHER TRANSITION:
- Never instant-switch weather. Transition over 30-60 seconds.
- Gradually adjust: Atmosphere density, color, clock time, particle rates
- TweenService to smoothly interpolate lighting properties

DAY/NIGHT CYCLE IMPACT:
- Daytime (ClockTime 6-18): full visibility, outdoor activities, shops open
- Dusk (18-20): lights turn on, shadows lengthen, atmosphere shifts
- Night (20-6): darkness, monsters spawn, different NPCs, indoor focus
- Dawn (4-6): gradual brightening, roosters/bird sounds, morning mist

────────────────────────────────────────────────────────────────────────────────
7.7 ACCESSIBILITY DESIGN
────────────────────────────────────────────────────────────────────────────────

VISUAL:
- Don't rely solely on color to convey information (colorblind players)
- Use shape + color + text together for critical indicators
- Provide options for increased text size
- Ensure sufficient contrast between text and background (4.5:1 ratio minimum)
- Avoid rapid flashing effects (seizure risk)

MOTOR:
- Provide alternative control schemes (mobile players especially)
- Auto-aim assist for shooting games (optional)
- Adjustable timing for QTE (quick time events)
- Don't require simultaneous precise button presses
- ProximityPrompt range: generous (8-10 studs, not 3)

COGNITIVE:
- Clear visual hierarchy (most important info largest/brightest)
- Consistent UI placement (don't move buttons between menus)
- Quest log/tracker always visible (don't rely on memory)
- Pause/save systems for single-player content
- Difficulty options without shame ("Story Mode" not "Baby Mode")

────────────────────────────────────────────────────────────────────────────────
7.8 ANTI-CHEAT AND EXPLOIT PREVENTION DESIGN
────────────────────────────────────────────────────────────────────────────────

ARCHITECTURAL RULES (prevent exploits by design):
- NEVER trust client values for currency, health, damage, speed, position
- Server validates ALL important state changes
- RemoteEvent rate limiting: max N calls per second per player
- Sanity checks: if player says "I dealt 999999 damage" — reject, kick, or flag
- Teleport validation: if player moves faster than max speed allows — reject position

COMMON EXPLOIT PATTERNS:
- Speed hacking: validate position changes against max speed * delta time
- Currency hacking: all currency changes on server, client only DISPLAYS
- Damage hacking: server calculates damage, not client
- Item duplication: use transactions/atomic operations for trades/transfers
- Flying: check if player is above ground without valid means (no platform, no jump arc)
- Noclip: validate that player path doesn't pass through solid objects

DESIGN-LEVEL PREVENTION:
- Keep critical logic server-side (ServerScriptService)
- Client only handles: input, display, animations, predictions
- Server only handles: economy, health, inventory, progression, score
- Use attributed values that server sets and client reads (not the reverse)

────────────────────────────────────────────────────────────────────────────────
7.9 ENGAGEMENT METRICS AND WHAT THEY MEAN
────────────────────────────────────────────────────────────────────────────────

These metrics tell you if your game design is working:

SESSION LENGTH:
- Healthy: 15-30 minutes average
- Too short (<5 min): boring core loop, bad onboarding, or confusing UI
- Too long (>60 min): potentially addictive design that may cause Roblox moderation issues

DAY-1 RETENTION (players who come back the next day):
- Great: 40%+
- Good: 25-40%
- Bad: <15%
- If low: onboarding fails, or no hook to return (add daily rewards, unfinished quest)

DAY-7 RETENTION:
- Great: 15%+
- Good: 8-15%
- Bad: <5%
- If low: not enough content depth, or progression wall too steep

AVERAGE REVENUE PER USER (ARPU):
- Strong for Roblox: 5-15 Robux per monthly active user
- If low: purchase placement wrong, or items don't feel valuable
- If high but players leaving: may be too pay-to-win

CONCURRENT PLAYERS (CCU):
- Threshold for Roblox algorithm boost: 100+ CCU
- Front page consideration: 1000+ CCU
- Design implication: game must support 30+ players per server smoothly

DESIGN RESPONSE TO METRICS:
- Low session time → improve core loop fun, add variety
- Low retention → add daily hooks, social features, "come back" reasons
- Low monetization → improve cosmetic desirability, add convenience purchases
- High quit rate at specific point → that's a difficulty spike or bug, fix it

This knowledge allows you to build ANYTHING from first principles — never from
templates. Every build is unique because you understand WHY things are shaped,
colored, and proportioned the way they are, not just WHAT to copy.
`

/**
 * Trimmed version for injection into chat system prompts where token budget is tighter.
 * Takes the first N characters of the full knowledge base.
 */
export function getTrimmedBuildingKnowledge(maxChars: number = 8000): string {
  return DEEP_BUILDING_KNOWLEDGE.slice(0, maxChars) + '\n\n[... additional building knowledge available in full context ...]'
}
