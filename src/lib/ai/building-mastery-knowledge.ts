// =============================================================================
// BUILDING MASTERY KNOWLEDGE — Extracted from 50+ DevForum tutorials & guides
// Comprehensive construction reference for AI-generated Roblox builds
// =============================================================================

export const BUILDING_MASTERY_KNOWLEDGE = {
  // ===========================================================================
  // SECTION 1: HOUSE CONSTRUCTION
  // ===========================================================================
  HOUSE_CONSTRUCTION: `
## HOUSE CONSTRUCTION — Complete Step-by-Step Guide

### FOUNDATION
- Start with a Part (Block shape), Size: 40, 1, 30 (width, height, depth)
- Material: Concrete or Slate
- Color: RGB(120, 120, 120) — medium gray
- Anchor: true
- This is the floor slab. Elevate 0.5 studs above ground for realism

### EXTERIOR WALLS
- Wall thickness: 0.7 studs (realistic proportion per DevForum standard)
- Wall height: 12–14 studs (fits Roblox character ~5.5 studs tall, gives headroom)
- Material: Concrete, Brick, or SmoothPlastic (for painted look)
- Use character scale as reference: belly button = ~3 studs, head top = ~5.5 studs
- Doorway height: 8 studs (1.5x character height)
- Doorway width: 4 studs
- Window bottom: 3 studs from floor
- Window height: 4 studs
- Window width: 3–5 studs

### WALL CONSTRUCTION TECHNIQUE
1. Place main wall Part, Size: 0.7, 12, 30
2. Use Negate parts to cut out window and door openings
3. Or build walls as segments around openings (more performant)
4. Offset interior walls 0.7 studs from exterior for room separation

### WALL DETAIL — SIDING
- Modern vinyl siding: Long strip Parts, Size: 0.1, 0.5, [wall length]
- Material: SmoothPlastic
- Color: White RGB(245, 245, 245) or Light Gray RGB(200, 200, 200)
- Apply single rotation for contemporary appearance
- Stack strips vertically with 0.5-stud spacing

### WALL DETAIL — BASEBOARDS
- Interior thin Parts along floor-wall junction
- Size: 0.2, 0.8, [wall length]
- Material: Wood
- Color: White RGB(255, 255, 255) or matching trim color
- Optional top board: 0.1 stud thick at ceiling line

### WINDOWS
- Frame: 4 Parts forming rectangle, thickness 0.3 studs
- Material for frame: Wood or Metal
- Color: White RGB(255, 255, 255), Brown RGB(100, 70, 40), or Black RGB(30, 30, 30)
- Glass pane: Part with Material = Glass
- BrickColor: "Fog" or "Institutional white"
- Transparency: 0.3–0.5 (0.3 for more reflective, 0.5 for clearer)
- Glass material naturally reflects skybox light like real windows
- Add windowsill: Part Size 0.3, 0.3, [window width + 0.6]
- Extend sill 0.3 studs outward from wall face
- Interior window: ensure there is a room/backdrop behind it for depth

### DOORS
- Door panel: Part Size 0.3, 8, 4
- Material: Wood
- Color: Brown RGB(120, 80, 40) or painted color
- Door frame: 4 Parts, 0.3 thick, surrounding opening
- Add handle: Small cylinder Part, Size 0.3, 0.3, 0.3
- Offset handle 0.3 studs from door face
- Place at 4 studs height (waist level)

### ROOF CONSTRUCTION
- Method 1 — Wedge Parts: Two WedgeParts meeting at ridge
  - Size each: [house width / 2], [desired pitch height], [house depth]
  - Common pitch: 4–6 studs rise over half-width
  - Material: Slate (shingle look) or Concrete
  - Color: Dark gray RGB(80, 80, 80), Brown RGB(120, 80, 50), or Red RGB(150, 50, 40)

- Method 2 — Layered Shingles (high detail):
  - Small overlapping Parts, each slightly offset
  - Main overhang: 1–2 studs beyond wall face
  - Shingle layer: another 1 stud over that
  - Add "small rotation on each one" for handmade look
  - Color variation between shingles for realism
  - Wood shake pattern with varied sizes and offsets

- Method 3 — Corner Wedges: Two CornerWedgeParts combined for peaked roof
  - Use ResizeAlign + GapFill plugins for clean connections
  - Avoid unions for roofs (results are sloppy)
  - Extrude side roofs, add end tiles, use 4 unions to trim excess

### ROOF DETAIL
- Ridge cap: Thin Part along peak, Size 0.5, 0.3, [roof length]
- Fascia board: Part along roof edge, Size 0.3, 0.5, [edge length]
- Gutters: Thin cylinder or Part along roof bottom edge
- Soffit: Flat Part under overhang

### FLOOR CONSTRUCTION
- Thin Parts per room: Size [room width], 0.3, [room depth]
- Different materials per room:
  - Kitchen: Slate or Marble (tile look)
  - Living room: Wood (hardwood)
  - Bathroom: Marble or DiamondPlate (tile)
  - Bedroom: Fabric (carpet look) or Wood
- Individual room coloring for personality

### PORCH / DECK
- Platform: Part Size 8, 0.5, 6
- Material: Wood
- Color: Brown RGB(140, 100, 60) or Gray RGB(160, 160, 160)
- Railings: Vertical posts (cylinders, Size 0.3, 3, 0.3) spaced 2 studs apart
- Horizontal rail: Part Size 0.3, 0.3, [railing length]
- Steps: 3 Parts, each 0.5 studs tall, 2 studs deep, decreasing height
`,

  // ===========================================================================
  // SECTION 2: TREE AND PLANT CONSTRUCTION
  // ===========================================================================
  TREE_PLANT_CONSTRUCTION: `
## TREE & PLANT CONSTRUCTION — Multiple Techniques

### LOW-POLY TREE (Most Common Style)
**Trunk:**
- Part with CylinderMesh (SpecialMesh Type = Cylinder)
- Material: Wood
- BrickColor: Brown tones — RGB(100, 70, 40) or "Brown"
- Size: 2, 8, 2 (thin and tall but not excessively thin)
- Branches should stick out to sides "just a little bit" — not extreme angles

**Canopy Method 1 — Sphere Clusters:**
- 3–5 Ball/Sphere Parts overlapping
- Material: Grass
- Color: Green tones — RGB(75, 151, 75) or "Bright green"
- Enable UsePartColor: true
- Vary sizes: main sphere 8x8x8, supporting 5x5x5 to 7x7x7
- Rotate and offset each sphere slightly for organic look
- Resize some randomly for variation

**Canopy Method 2 — CSG Carved Blob:**
1. Start with a Block Part (cube shape)
2. Position multiple Negate parts around edges to carve corners
3. Copy negate parts and rotate them around the part
4. Union everything simultaneously
5. Result: organic blob shape from carved cube
6. Copy blob multiple times
7. Rotate, resize, randomize each copy
8. Cluster them above trunk in big organic shape

### BRANCH SYSTEM (Detailed Trees)
1. Add SpecialMesh sphere atop trunk (equal width and height)
2. Attach cylinder Parts with CylinderMesh extending outward from sphere
3. Cap each branch end with sphere mesh
4. Subdivide: add more branches from branch tips
5. TAPER: each branch level reduces scale by 0.1 in X/Z
6. Sphere mesh scales match parent cylinder X/Z across all 3 dimensions
7. Keep branch angles shallow — trees branch "to the sides just a little"

### ROOT SYSTEM
- Duplicate trunk part, flatten Y-axis "as thin as possible"
- Rotate on Y-axis, then slight X or Z rotation
- Extend downward from trunk base
- Repeat 4–8 times around base
- Optional: use Negate part at ground level to trim flush, union together

### PINE / CONIFER TREE
- Trunk: Cylinder, Material: Wood, Color: Dark Brown RGB(80, 55, 30)
- Size: 1.5, 12, 1.5 (taller, thinner)
- Canopy: 3–4 stacked cone shapes (WedgeParts or cone meshes)
- Largest at bottom: 10x4x10, mid: 7x4x7, top: 4x4x4
- Material: Grass, Color: Dark Green RGB(40, 100, 40)

### BUSH / SHRUB
- 2–3 overlapping sphere Parts
- Material: Grass
- Color: RGB(60, 130, 60) — slightly darker than tree canopy
- Size: 3x3x3 to 5x3x5 (wider than tall)
- Place at ground level, half-buried

### FLOWER
- Stem: Thin cylinder, Size 0.2, 2, 0.2, Material: Grass, Color: Green
- Petals: 4–6 small Parts or spheres arranged in circle
- Size 0.5x0.2x0.5 each
- Material: SmoothPlastic
- Colors: Red RGB(200, 50, 50), Yellow RGB(240, 220, 50), Purple RGB(150, 50, 180)
- Center: Small sphere, Color: Yellow RGB(240, 200, 50)

### GRASS TUFTS
- Small thin wedge Parts in clusters of 3–5
- Material: Grass
- Color: slightly varied greens
- Size: 0.2, 1.5, 0.2 each
- Rotate randomly, cluster at ground level

### BILLBOARD FOLIAGE (Advanced)
- Use Part as canopy center
- Generate Attachments in sphere distribution
- Each Attachment holds BillboardGui with leaf texture image
- Creates volume without heavy part count
- Best for distant trees

### VARIATION TECHNIQUE (Critical)
- Use only 3 tree variants, then manipulate through:
  - Color tone adjustments (shift green hue)
  - Rotational changes (Y-axis rotation)
  - Size modifications (scale 0.8x to 1.2x)
- "In real life nothing is identical to another"
- Even manufactured items have variation
`,

  // ===========================================================================
  // SECTION 3: FURNITURE CONSTRUCTION
  // ===========================================================================
  FURNITURE_CONSTRUCTION: `
## FURNITURE CONSTRUCTION — Chairs, Tables, Beds, Shelves

### BASIC CHAIR
- Seat: Part Size 3, 0.5, 3
  - Material: Wood
  - Color: Brown RGB(140, 100, 60) or fabric colors
- Legs (4x): Part Size 0.4, 3, 0.4
  - Material: Wood
  - Color: matching or darker brown
  - Position at each corner, offset 0.3 studs inward
- Back: Part Size 3, 4, 0.4
  - Position at rear edge, extending upward from seat
  - Same material as seat
- Total height with legs: ~7 studs (seat at 3 studs = waist level)
- Check proportions: "look at them in a real life perspective — can the chair stay upright?"

### DINING CHAIR (Detailed)
- Same as basic + add:
- Back slats: 2–3 vertical Parts Size 0.3, 3, 0.3
- Slightly curved back (rotate back part ~5 degrees backward)
- Seat cushion: Part Size 2.6, 0.3, 2.6 on top of seat
  - Material: Fabric
  - Color: Accent color

### OFFICE / ROLLING CHAIR
- Base: 5 small cylinders radiating from center (star shape)
  - Each: Size 0.3, 0.3, 2
- Center post: Cylinder Size 0.5, 3, 0.5
- Seat: Part Size 3, 0.5, 3, Material: Fabric
- Back: Part Size 3, 4, 0.3, slight backward tilt
- Armrests: 2 Parts Size 0.3, 0.3, 2

### TABLE (Dining)
- Top: Part Size 8, 0.5, 4
  - Material: Wood
  - Color: Brown RGB(140, 100, 60)
- Legs (4x): Part Size 0.5, 4, 0.5
  - Position at corners, offset 0.5 studs inward
  - Material: Wood, Color: matching top
- Table height: 4.5 studs total (matches chair seat + arm height)

### COFFEE TABLE
- Top: Part Size 5, 0.4, 3
- Legs: Size 0.4, 2, 0.4
- Height: 2.4 studs (knee height when seated)

### DESK
- Top: Part Size 6, 0.5, 3
- Legs: Size 0.5, 4, 0.5
- Drawers (side panel): Part Size 0.3, 3, 2.5
  - 2–3 horizontal Parts for drawer faces
  - Small cylinder handles: Size 0.1, 0.1, 0.5 per drawer

### BED (Single)
- Frame: 4 Parts forming rectangle
  - Head: Size 4, 4, 0.5 (headboard)
  - Foot: Size 4, 2.5, 0.5
  - Sides: Size 0.5, 2, 7
- Mattress: Part Size 3.6, 1, 6.5
  - Material: Fabric
  - Color: White RGB(240, 240, 240)
- Pillow: Part Size 2, 0.5, 1.5
  - Material: Fabric
  - Color: White or accent
- Blanket: Part Size 3.4, 0.3, 4
  - Material: Fabric
  - Color: Theme color, placed over lower 2/3 of mattress
- Frame Material: Wood
- Frame Color: Dark Brown RGB(80, 55, 35) or painted

### BED (Double/Queen)
- Same as single but width 6 studs instead of 4
- 2 pillows side by side
- Headboard height: 5 studs

### BOOKSHELF
- Back panel: Part Size 0.3, 8, 4
- Shelves (4–5): Part Size 0.5, 0.3, 4 — evenly spaced
- Side panels (2): Part Size 0.5, 8, 0.3
- Books: Small colored Parts, Size 0.3, 1, 0.8
  - Various colors: Red, Blue, Green, Brown, Black
  - Slightly varied heights
  - Lean some at angles

### COUCH / SOFA
- Base: Part Size 6, 1.5, 3
  - Material: Fabric
- Seat cushions: 2–3 Parts on top, Size 2, 0.5, 2.5
- Back: Part Size 6, 3, 0.5
  - Material: Fabric
- Armrests: 2 Parts Size 0.5, 2, 3
- Legs (hidden or visible): Size 0.3, 0.5, 0.3
- Color: Neutral tones — Beige RGB(180, 160, 130), Gray RGB(140, 140, 140)

### TV
- Screen: Part Size 0.2, 4, 7
  - Material: Glass or SmoothPlastic
  - Color: Black RGB(20, 20, 20) or very dark gray
- Stand: Small Part Size 2, 0.3, 1
- Base: Part Size 3, 0.3, 1.5
- TV stand furniture: Part Size 0.5, 2, 6 with shelves

### LAMP (Table Lamp)
- Base: Cylinder Size 1.5, 0.3, 1.5
- Pole: Cylinder Size 0.3, 3, 0.3
- Shade: Truncated cone or cylinder, Size 2, 2, 2
  - Material: SmoothPlastic
  - Color: Beige RGB(220, 200, 170) or white
- PointLight inside shade: Brightness 1, Range 15, Color warm white

### LAMP (Floor Lamp)
- Base: Cylinder Size 2, 0.3, 2
- Pole: Cylinder Size 0.3, 6, 0.3
- Shade: Size 3, 2.5, 3
- Material: Metal for pole, SmoothPlastic for shade

### KITCHEN COUNTER
- Base: Part Size 0.5, 4, 8
  - Material: Wood or SmoothPlastic
  - Color: White RGB(240, 240, 240) or wood tones
- Countertop: Part Size 0.6, 0.3, 8.4
  - Material: Marble or Granite
  - Color: Gray RGB(180, 180, 180) or Beige
- Cabinet doors: Parts on front face, Size 0.1, 2, 1.5
  - Spaced with 0.1 gap between
  - Small handle cylinders

### MATERIAL GUIDE FOR FURNITURE
- Wood furniture: Material = Wood, colors in brown family
- Metal furniture: Material = Metal or DiamondPlate
- Upholstered: Material = Fabric
- Glass surfaces: Material = Glass, Transparency 0.3
- Stone/marble: Material = Marble
- "Lessen the lively colors" for realistic look
- Apply "realistic textures" via SurfaceAppearance for premium feel
`,

  // ===========================================================================
  // SECTION 4: VEHICLE CONSTRUCTION
  // ===========================================================================
  VEHICLE_CONSTRUCTION: `
## VEHICLE CONSTRUCTION — Cars, Trucks, Basic Vehicles

### SIMPLE CAR (Part-Based)
**Chassis/Body:**
- Base Part: Size 6, 1, 11 studs
- Material: Metal or SmoothPlastic
- Color: Any car color — Red RGB(200, 40, 40), Blue RGB(40, 80, 200), etc.

**Wheels (4x):**
- Part Type: Cylinder
- Size: 1, 3, 3 studs each
- Material: SmoothPlastic (dark)
- Color: Black RGB(20, 20, 20) or Dark Gray
- Attachment: Hinge surface joints facing inward toward chassis
- Position: At each corner, moved inward to chassis edges
- Custom Physical Properties: Enable
  - Friction: Rear wheels = 2.0, Front wheels = 0.2
  - Elasticity: 0

**Steering:**
- VehicleSeat placed on top of base
- Rotated to face forward
- Welded to base via Model > Create > Weld

**Assembly Steps:**
1. Create rectangular base Part (6, 1, 11)
2. Add 4 cylinder wheels at corners
3. Set inward-facing HingeConstraints on wheels
4. Place VehicleSeat on top, orient forward
5. Weld seat to base
6. Group entire model
7. Run MakeJoints() in Command Bar

### DETAILED CAR (Multi-Part)
**Body Shell:**
- Lower body: Part Size 6, 2, 11 — main body
- Hood: Part Size 5.5, 0.3, 4 — slightly angled down using rotation
- Roof: Part Size 5, 0.3, 4 — positioned above cabin
- Trunk: Part Size 5.5, 0.3, 3 — rear section
- Use WedgeParts for windshield angles and rear window slopes

**Windshield:**
- WedgePart angled ~30 degrees
- Material: Glass
- Transparency: 0.4
- Color: Light blue tint RGB(200, 220, 240)

**Side Windows:**
- Parts inset into body, Material: Glass
- Transparency: 0.4
- Slightly smaller than body panel openings

**Headlights:**
- 2 Cylinder Parts at front, Size 0.3, 1.5, 1.5
- Material: Neon or SmoothPlastic
- Color: White RGB(255, 255, 240) or Yellow RGB(255, 230, 150)
- Add SpotLight inside each: Brightness 2, Range 30, Angle 45

**Taillights:**
- 2 Parts at rear, Size 0.2, 1, 1.5
- Material: Neon
- Color: Red RGB(200, 30, 30)

**Bumpers:**
- Front/Rear: Part Size 6.2, 0.8, 0.5
- Material: Metal
- Color: Silver RGB(180, 180, 180) or body color

**Side Mirrors:**
- Small Parts, Size 0.3, 0.5, 0.3
- Mounted on thin arms extending from body

**Wheel Wells:**
- Use Negate cylinders to carve semicircular cutouts in body
- Or build body panels around wheel positions with gaps

### TRUCK
- Same principles as car but scaled up:
- Body: Size 8, 3, 16
- Wheels: Size 1.5, 4, 4 (larger)
- Cab separate from bed
- Bed: Open top Part, 3 walls, Size 7.5, 2, 8
- Add tailgate: Part at rear, Size 7.5, 2, 0.3

### TIPS FROM DEVFORUM
- "Start with an image for the design, then replicate each part"
- Use GapFill and ResizeAlign plugins for precision
- Label and organize unions in named folders
- Keep unions clean — "triangles a bit cleaner and more perfect"
- Add wind mirrors and lights last as detail pass
- Weld everything to chassis before testing
`,

  // ===========================================================================
  // SECTION 5: ENVIRONMENT BUILDING
  // ===========================================================================
  ENVIRONMENT_BUILDING: `
## ENVIRONMENT BUILDING — Roads, Fences, Walls, Paths, Terrain

### ROAD CONSTRUCTION
**Basic Road:**
- Surface: Part Size 0.3, [length], 24 (2-lane road, 12 studs per lane)
- Material: Slate or Concrete (asphalt look)
- Color: Dark Gray RGB(60, 60, 60)
- Anchor: true

**Lane Markings:**
- Center line: Part Size 0.05, [length], 0.5
  - Color: Yellow RGB(240, 200, 50) for center divider
- Edge lines: Part Size 0.05, [length], 0.3
  - Color: White RGB(240, 240, 240)
- Dashed lines: Multiple Parts Size 0.05, 4, 0.3 spaced 4 studs apart
  - Color: White

**Sidewalk:**
- Part alongside road, Size 0.5, [length], 6
- Material: Concrete
- Color: Light Gray RGB(190, 190, 190)
- Raise 0.3 studs above road surface for curb

**Curb:**
- Part Size 0.3, [length], 0.3 at road-sidewalk junction
- Material: Concrete
- Color: Gray RGB(160, 160, 160)

**Curved Roads:**
- Use Archimedes plugin: set axis, input angle (15-degree increments)
- 1-stud height increase per curved segment for slopes
- Apply GapFill between curved segments for smooth surface
- Lane markings follow same rotation pattern as road base

**Intersection:**
- Flat Part for crossing area, Size 24, 0.3, 24
- Same material/color as road
- Add crosswalk stripes: White Parts, Size 0.05, 0.5, 6 spaced 1 stud apart

### SCALING GUIDELINES (Character-Driven)
- Use Roblox character as baseline reference (~5.5 studs tall)
- Road lane: 10–12 studs wide (fits vehicle + margin)
- Sidewalk: 4–6 studs wide (2 characters side by side)
- Building spacing: 2–4 studs between structures minimum
- Street width total (2 lanes + sidewalks): ~36 studs
- "Start with a dummy. Make the vehicle big enough for your dummy. Then make road big enough for your vehicle."

### FENCE CONSTRUCTION
**Wooden Fence:**
- Posts: Part Size 0.5, 4, 0.5, spaced 4 studs apart
  - Material: Wood
  - Color: Brown RGB(130, 90, 50) or White RGB(240, 240, 240)
- Horizontal rails (2): Part Size 0.3, 4, 0.3 connecting posts
  - At 1 stud and 3 studs height
- Pickets: Vertical Parts Size 0.2, 3.5, 0.5 between posts
  - Spaced 0.5 studs apart, between lower and upper rail

**Metal Fence / Railing:**
- Posts: Cylinder Size 0.3, 4, 0.3, spaced 3 studs apart
  - Material: Metal
  - Color: Black RGB(30, 30, 30) or Iron RGB(100, 100, 100)
- Top rail: Cylinder Size 0.2, [length], 0.2
- Balusters: Thin cylinders Size 0.15, 3.5, 0.15 spaced 0.8 studs apart

**Stone Wall:**
- Main body: Part Size 1.5, 4, [length]
  - Material: Brick or Cobblestone
  - Color: Gray RGB(140, 140, 140) or Tan RGB(180, 170, 150)
- Cap: Part Size 1.8, 0.3, [length] on top
  - Material: Slate
- For performance: use Wall Creator or Wall Builder plugins
- "Complex railing details" can lag — keep balance between detail and performance

### PATH CONSTRUCTION
**Stone Path:**
- Irregular Parts scattered in line, Size 1-2, 0.2, 1-2
- Material: Cobblestone or Slate
- Color: Gray tones with slight variation
- Rotate each stone randomly
- Sink 0.1 studs into terrain/ground

**Wooden Boardwalk:**
- Planks: Parts Size 0.3, [width], 4, placed perpendicular to path direction
- Material: Wood
- Color: Brown with slight variation
- Gap 0.2 studs between planks
- Support beams underneath: Parts running parallel to path direction

### TERRAIN TECHNIQUES
**Painting Tips:**
- Use Terrain tools Paint mode with brush sizes 2-6
- Layer materials: Grass base, then patches of Ground/Mud near paths
- Add Sand near water edges
- Rock material on cliff faces and elevated areas
- Snow on mountain peaks
- Use Perlin noise painting (TerrainPainter2 plugin) for natural variation
- "Some materials need blending/diffusion when transitioning"

**Terrain Materials Available:**
Grass, Sand, Rock, Water, Ground, Mud, Slate, Concrete, Brick,
Cobblestone, Ice, Glacier, Snow, Sandstone, Limestone, Basalt,
Pavement, Asphalt, LeafyGrass, Salt, CrackedLava

**Terrain Color Customization:**
- Adjust terrain material colors in Workspace.Terrain.MaterialColors
- Match design aesthetic — warmer greens for tropical, cooler for temperate

**Water Effects:**
- Place water terrain beneath elevated structures for reflections
- Terrain water provides natural wave animation

**Grass on Parts:**
- Convert parts to terrain using "Part to Terrain" plugin
- Elevate structures above ground level for natural landscaping
`,

  // ===========================================================================
  // SECTION 6: INTERIOR DESIGN
  // ===========================================================================
  INTERIOR_DESIGN: `
## INTERIOR DESIGN — Rooms, Decoration, Lighting

### ROOM PROPORTIONS
- Standard room: 12x12 to 16x16 studs
- Bedroom: 12x14 studs
- Living room: 16x20 studs
- Kitchen: 12x16 studs
- Bathroom: 8x10 studs
- Hallway width: 4–6 studs
- Ceiling height: 12–14 studs
- Wall thickness: 0.7 studs

### ROOM-BY-ROOM GUIDE

**Living Room:**
- Couch facing TV area
- Coffee table in center
- Side tables with lamps
- Bookshelf or display shelf against wall
- Rug: Thin Part Size 0.1, 8, 6, Material: Fabric, under coffee table
- Curtains: Thin Parts beside windows, Material: Fabric
- Floor: Wood material

**Kitchen:**
- Counter along walls (L-shape or U-shape)
- Counter height: 4 studs (waist level)
- Sink: Small recessed Part in counter, Material: Metal
- Stove/Oven: Box Part with 4 small cylinder burners on top
  - Material: Metal, Color: Silver or Black
- Fridge: Tall Part Size 3, 7, 2.5, Material: Metal, Color: Silver
- Cabinets: Upper wall-mounted boxes at 7 studs height
- Floor: Slate or Marble (tile look)

**Bedroom:**
- Bed against wall (not centered)
- Nightstand: Small table beside bed, Size 2, 3, 2
- Dresser: Part Size 4, 4, 2 with drawer faces
- Closet: Recessed area or wardrobe Part
- Mirror: Thin Part, Material: Glass, Transparency: 0.2, on wall
- Floor: Wood or Fabric (carpet)

**Bathroom:**
- Toilet: White block + cylinder tank, Size ~2x3x2 total
- Sink: Wall-mounted or pedestal, Material: Marble
- Bathtub/Shower: Recessed area with Negate or glass partition
- Mirror above sink: Glass Part
- Floor: Marble or Slate (tile)
- Towel rack: Thin cylinder on wall

### DECORATION TECHNIQUES
- "Add clutter strategically": barrels, boxes, plants, small objects
- Use transparent decals on invisible parts for dust/wear at low opacity
- "AVOID overcrowding" — eye strain vs intentional industrial decay
- Cables, pipes, vents on walls for industrial/sci-fi feel
- Posters/paintings: Thin Parts with decals on walls
- Potted plants: Small pot (cylinder) + sphere bush on top

### INTERIOR LIGHTING
**General Rules:**
- Use "a few PointLights with large range rather than many small-range ones"
- PointLight typical: Brightness 0.5-1, Range 20-30
- Yellow-orange tones with dim brightness for classic/warm furniture
- White light = "clinical feeling" — match light color to room purpose
- Place lights in invisible/intangible Parts in hallways and ceilings
- Reduce brightness to prevent light bleeding through walls

**Room-Specific Lighting:**
- Kitchen: Bright white, Brightness 1, Color RGB(255, 250, 240)
- Living room: Warm, Brightness 0.7, Color RGB(255, 220, 180)
- Bedroom: Dim warm, Brightness 0.4, Color RGB(255, 200, 150)
- Bathroom: Bright cool, Brightness 0.8, Color RGB(240, 250, 255)
- Industrial/maintenance: Orange, Color RGB(255, 180, 100)

**Light Types:**
- PointLight: Omnidirectional, good for rooms
- SpotLight: Directional cone, good for task lighting
- SurfaceLight: Emits from a face, good for ceiling panels
- Use SpotLights "which reflect light on the ground" for accent
- SurfaceLights "create light on ground" for overhead panels

### MAKING INTERIORS APPEALING
- Define room function FIRST, then furnish to purpose
- Add signage, control panels, posters for narrative detail
- Apply deterioration effects (dust, wear) for authenticity
- "Large empty rooms need purposeful design elements like pillars"
- Balance detail density — too sparse = lifeless, too dense = cluttered
- Maintain thematic consistency between rooms
`,

  // ===========================================================================
  // SECTION 7: CASTLE / MEDIEVAL CONSTRUCTION
  // ===========================================================================
  CASTLE_MEDIEVAL: `
## CASTLE / MEDIEVAL CONSTRUCTION — Walls, Towers, Gates

### CASTLE WALL
- Main wall: Part Size 4, 16, [length]
  - Material: Cobblestone or Brick
  - Color: Gray RGB(140, 140, 140) or Tan RGB(180, 170, 150)
- Thickness: 3–4 studs (thick for defensibility look)
- Height: 16–20 studs (imposing)

### BATTLEMENTS (Crenellations)
- Merlons: Parts Size 4, 3, 3 spaced along wall top
  - Same material as wall
  - Space: 3 studs between each (creating embrasures)
- Walkway: Part behind merlons, Size 2, 0.5, [length]

### TOWER (Round)
- Cylinder Part, Size 10, 24, 10
  - Material: Cobblestone
  - Color: matching wall
- Conical roof: Cone mesh or WedgeParts arranged in circle
  - Material: Slate
  - Color: Dark gray or dark blue RGB(50, 50, 80)
- Windows: Thin tall Parts (arrow slits), Size 0.5, 3, 0.3
  - Cut into tower walls

### TOWER (Square)
- 4 Wall Parts forming square, Size 2, 24, 10 each
- Battlements on top (same as wall)
- Corner reinforcement: Small Parts at corners

### GATEHOUSE
- Two towers flanking opening
- Arch over gate: Use curved Parts (Archimedes plugin) or WedgeParts
- Gate door: Part Size 0.5, 8, 6
  - Material: Wood
  - Color: Dark Brown RGB(70, 45, 25)
  - Add iron bands: Thin Parts across door face
    - Material: Metal
    - Color: Dark Iron RGB(60, 60, 60)
- Portcullis: Grid of thin Parts
  - Material: Metal
  - Color: Iron gray

### MEDIEVAL DETAILS
- Torches on walls: Small Part + Particle fire effect
  - PointLight: Brightness 1, Range 15, Color RGB(255, 180, 80)
- Flags/Banners: Thin fabric Parts hanging from poles
  - Material: Fabric
  - Color: Kingdom colors (Red + Gold, Blue + White, etc.)
- Stone steps: Wedge Parts ascending wall interior
- Wooden scaffolding: Thin wood Parts in grid pattern
- Well: Cylinder in courtyard + small roof structure

### MEDIEVAL HOUSE (Village)
- Walls: Part, Material: Brick or SmoothPlastic
  - Color: White/cream RGB(230, 220, 200) (plaster)
- Timber framing: Wood Parts on exterior face
  - Size: 0.3, [height], 0.3 vertical
  - Size: 0.3, 0.3, [width] horizontal
  - Color: Dark Brown RGB(70, 50, 30)
  - Creates Tudor half-timber look
- Roof: WedgeParts with steep pitch
  - Material: Slate
  - Color: Brown or dark gray
- Door: Arched or rectangular, Material: Wood
- Windows: Small, with wooden shutters (hinged Parts)

### BRIDGE
- Deck: Part Size 6, 0.5, [length]
  - Material: Wood or Cobblestone
- Supports: Vertical Parts or arches underneath
  - Material: Cobblestone
  - Arches via Archimedes plugin
- Side walls: Low Parts, Size 0.5, 2, [length]
  - Material: matching support material
`,

  // ===========================================================================
  // SECTION 8: MODERN BUILDING
  // ===========================================================================
  MODERN_BUILDING: `
## MODERN BUILDING — Glass, Concrete, Clean Lines

### MODERN EXTERIOR
**Walls:**
- Material: Concrete or SmoothPlastic
- Color: White RGB(245, 245, 245), Light Gray RGB(220, 220, 220), or Charcoal RGB(50, 50, 50)
- Clean flat surfaces, minimal ornamentation
- Sharp 90-degree edges

**Glass Facades:**
- Large window Parts covering significant wall area
- Material: Glass
- Transparency: 0.3–0.4
- Color: Light blue tint RGB(200, 220, 240) or neutral
- Reflectance: 0.1–0.2 for subtle reflection

**Flat Roof:**
- Part extending slightly beyond walls (0.5–1 stud overhang)
- Material: Concrete
- Roof edge trim: Thin Part along perimeter
- Optional parapet: Low wall around roof edge, 2 studs tall

**Balconies:**
- Floor: Part extending 4 studs from building face
- Glass railing: Thin Parts, Material: Glass, Transparency: 0.2
- Metal frame: Thin cylinder or Parts around glass
- Color: Metal elements = Silver or Black

**Columns:**
- Cylinder or square Parts
- Material: Concrete or Metal
- Size: 1x[height]x1 to 2x[height]x2
- Support overhangs and covered areas

### MODERN DETAILS
- Clean window frames: Thin Parts (0.1 thick) framing glass
  - Material: Metal
  - Color: Black RGB(30, 30, 30) or Silver
- Minimalist door: Part Size 0.2, 8, 4
  - Material: Glass or SmoothPlastic
  - Handle: Small horizontal bar
- House numbers: Small Parts or TextLabels
- Outdoor lighting: Cylinder fixtures with SpotLights pointing down
- Planter boxes: Rectangle Parts, Material: Concrete, with bush spheres

### SKYSCRAPER
- Repeat floor modules: Glass + steel frame pattern
- Each floor: ~14 studs height
- Window grid: Alternating glass panels and steel mullions
- Steel frame: Thin Parts forming grid
  - Material: Metal
  - Color: Dark silver RGB(80, 80, 90)
- Ground floor: Larger glass panels (lobby entrance)
- Setbacks: Upper floors narrower than lower
- Roof: Mechanical penthouse (box with vent details) or flat

### OFFICE INTERIOR (Modern)
- Open plan: Minimal walls, glass partitions
- Desks: Clean rectangular tops on metal legs
- Ceiling: Drop ceiling panels (grid of Parts)
  - Size: 4x0.1x4 each
  - SurfaceLight underneath for even illumination
- Floor: SmoothPlastic (polished concrete look) or Wood
- Reception desk: Curved Part using cylinder segments
- Elevator: Niche in wall with metal doors

### HIGH-RISE OPTIMIZATION
- 10-story building with 800-part window frames was optimized to 68 parts
- Technique: Redesign wall structures as "#" shapes instead of individual frames
- "12x reduction in original part count"
- Buildings without interiors: 100–600 parts maximum
- Keep under 5,000 parts within 300-stud render distance
- Enable Workspace streaming (default 1024 studs) for progressive loading
`,

  // ===========================================================================
  // SECTION 9: PROP DETAILS
  // ===========================================================================
  PROP_DETAILS: `
## PROP DETAILS — Handles, Sills, Trim, Molding, Small Details

### DOOR HANDLES
- Lever handle: Small cylinder Size 0.2, 0.2, 0.8 + bent section
  - Material: Metal
  - Color: Silver RGB(180, 180, 180) or Gold RGB(200, 180, 100)
  - Position: 4 studs from floor, 0.3 studs from door edge
- Round knob: Sphere Size 0.5, 0.5, 0.5
  - Material: Metal
  - Extend 0.3 from door face

### WINDOW SILLS
- Exterior sill: Part Size 0.3, 0.3, [window width + 0.6]
  - Extends 0.3 studs outward from wall face
  - Material: Concrete or Wood
  - Color: White or matching trim
- Interior sill: Part Size 0.3, 0.2, [window width]
  - Flat on interior wall face

### CROWN MOLDING
- Part at ceiling-wall junction
- Size: 0.3, 0.3, [wall length]
- Rotate 45 degrees for beveled look
- Material: Wood or SmoothPlastic
- Color: White RGB(255, 255, 255)

### BASEBOARDS
- Part at floor-wall junction
- Size: 0.2, 0.8, [wall length]
- Material: Wood
- Color: White or wood tone

### TRIM / FRAMING
- Around windows: 4 Parts forming rectangle, 0.3 thick, 0.5 wide
- Around doors: 3 Parts (top + 2 sides), same dimensions
- Color contrast: White trim on colored walls or dark trim on light walls
- "Multi-part construction — avoid single-piece walls, doors, windows"

### LIGHT SWITCHES / OUTLETS
- Small Part on wall, Size 0.1, 0.4, 0.3
- Material: SmoothPlastic
- Color: White or Ivory
- Position: 4 studs from floor (switch), 1 stud from floor (outlet)

### PICTURE FRAMES
- Thin Part for frame border, 0.1 thick
- Material: Wood or Metal
- Inner area: Part with decal image
- Size: 2x3 to 4x5 studs

### CEILING FAN
- Center hub: Cylinder Size 0.5, 0.3, 0.5
- Blades: 3–4 thin Parts extending outward, Size 0.1, 0.1, 3
- Mount rod: Thin cylinder from ceiling to hub
- Material: Wood (blades), Metal (mount)
- Optional: PointLight underneath

### FLOWER POT
- Pot: Cylinder Part, Size 1.5, 1.5, 1.5
  - Material: Brick or Concrete
  - Color: Terracotta RGB(180, 100, 60) or Gray
- Soil: Dark cylinder on top, Size 1.2, 0.1, 1.2
  - Color: Dark Brown RGB(60, 40, 20)
- Plant: Small sphere bush or thin wedge leaves
  - Material: Grass
  - Color: Green

### FIRE HYDRANT
- Body: Cylinder Size 1.5, 3, 1.5
  - Material: SmoothPlastic
  - Color: Red RGB(200, 40, 40) or Yellow
- Cap: Cylinder on top, Size 1, 0.3, 1
- Side outlets: Small cylinders extending from body
- Bolts: Tiny cylinders on cap

### STREET LAMP
- Pole: Cylinder Size 0.5, 12, 0.5
  - Material: Metal
  - Color: Dark Gray or Black
- Arm: Cylinder extending to side at top, 0.3 diameter
- Lamp housing: Cylinder or box at arm end
  - SpotLight inside: Brightness 1.5, Range 30, Angle 60
  - Color: Warm white RGB(255, 240, 200)

### TRASH CAN
- Body: Cylinder Size 2, 3, 2
  - Material: Metal
  - Color: Gray RGB(120, 120, 120) or Green RGB(60, 120, 60)
- Lid: Cylinder Size 2.2, 0.2, 2.2 on top
- Handles: Small Parts on sides

### MAILBOX
- Box: Part Size 1.5, 2, 1
  - Material: Metal
  - Color: Blue RGB(40, 60, 150) or Red
- Flag: Small thin Part on side
  - Color: Red
- Post: Part Size 0.4, 4, 0.4
  - Material: Wood

### BENCH (Park)
- Seat: Part Size 6, 0.4, 2
  - Material: Wood
  - Color: Brown RGB(130, 90, 50)
- Back: Part Size 6, 2, 0.4, angled slightly backward
- Legs: 2–3 metal frames (inverted U shapes from 3 Parts each)
  - Material: Metal
  - Color: Black or Dark Gray
- Armrests: Parts at each end

### BARREL
- Body: Cylinder Size 2, 3, 2
  - Material: Wood
  - Color: Brown RGB(120, 80, 45)
- Bands: Thin cylinders (torus-like) around body
  - Material: Metal
  - Color: Dark Iron RGB(70, 70, 70)
  - Position at 25% and 75% height

### CRATE / BOX
- Part Size 3, 3, 3
  - Material: Wood
  - Color: Light Brown RGB(170, 130, 80)
- Lid: Slightly larger Part on top, Size 3.2, 0.2, 3.2
- Planks: Thin Parts on faces for texture detail
- Stack multiple crates at slight rotations for organic look
`,

  // ===========================================================================
  // SECTION 10: SPAWN / LOBBY DESIGN
  // ===========================================================================
  SPAWN_LOBBY_DESIGN: `
## SPAWN / LOBBY DESIGN — First Impressions & Player Flow

### SIZE GUIDELINES
- Small game (< 20 players): 130x130 studs (~1/4 baseplate)
- Medium game (20-50 players): 170x170 studs (~1/3 baseplate)
- Large game (50+ players): 250x250+ studs
- Scale based on expected concurrent player count

### LAYOUT PRINCIPLES
- Clear visual focal point upon spawn (statue, sign, portal)
- Intuitive flow from spawn to gameplay entry
- "Hook players" with visual interest immediately
- Don't over-perfect before launch — iterate post-release

### SPAWN POINT SETUP
- SpawnLocation Part at center or distributed points
- Remove default spawn pad decals for cleaner look
- Position below visible map level if using teleport system
- Separate LobbySpawn and GameSpawn names for different phases
- Randomized spawn using spawn tables for variety

### ESSENTIAL ELEMENTS
**Welcome Area:**
- Open space around spawn (6+ studs clearance in all directions)
- Welcome sign or game title display
- Material: matching game theme
- Clear sightlines to key destinations

**Navigation:**
- Visible pathways to game areas, shop, settings
- Color-coded or material-differentiated paths
- Signs/arrows pointing to key locations
- NPC guides (optional)

**Interactive Features:**
- Small obby/parkour section for entertainment while waiting
- Leaderboard displays (SurfaceGui on Parts)
- Daily rewards area
- Settings/loadout customization zone
- Donation board or top player display

### LOBBY TYPES

**Hub Lobby (Central):**
- Central open area with themed decoration
- Portals/doors to different game modes around perimeter
- Central statue or feature piece
- Benches, fountains, vegetation

**Linear Lobby:**
- Corridor leading from spawn to game start
- Progressive reveal of game themes along path
- Interactive elements along walls
- Culminates in "ready" area or teleporter

**Island/Floating Lobby:**
- Platform in sky or water
- Dramatic views in all directions
- Bridge or teleporter to game area
- Strong visual identity

### DECORATION IDEAS FROM DEVFORUM
- Potted plants and organized trees (not random placement)
- Benches and glass tables
- Pond or fountain features
- Beach accessories for tropical themes
- Informational boards (Top 10 players, etc.)
- Hot air balloons, unique vehicles as decoration
- "Floating island concept arts" for inspiration

### LIGHTING FOR LOBBIES
- Bright and welcoming — TimeOfDay: 14:00 (afternoon sun)
- Sky: Custom appealing skybox
- Atmosphere: Light haze for depth
- Warm ambient lighting
- Feature lighting on focal points (SpotLights on statues/signs)
- Avoid nighttime for new player first impression

### PERFORMANCE
- Lobby should load fast — keep under 2,000 parts
- Use streaming for large lobbies
- Anchor everything
- Avoid excessive neon (causes lag)
- "Movement of parts causes lag" — anchor all decorations

### FIRST IMPRESSION CHECKLIST
1. Player spawns and immediately sees game identity
2. Clear where to go (visual hierarchy)
3. Something interactive within 5 seconds of spawning
4. Game title visible
5. No confusion about how to start playing
6. Visually polished (lighting, colors, coherent theme)
7. Runs smooth on mobile (critical for Roblox audience)
`,

  // ===========================================================================
  // SECTION 11: LIGHTING & ATMOSPHERE
  // ===========================================================================
  LIGHTING_ATMOSPHERE: `
## LIGHTING & ATMOSPHERE — Complete Setup Guide

### LIGHTING SERVICE PROPERTIES
**Daytime (Default Good Look):**
- ClockTime: 14 (2 PM — warm afternoon)
- Brightness: 2–3
- Ambient: RGB(50, 50, 60) — slight cool tint
- OutdoorAmbient: RGB(120, 120, 130)
- Technology: ShadowMap (performance) or Future (quality)
- EnvironmentDiffuseScale: 0.5–1.0
- EnvironmentSpecularScale: 0.5

**Sunset / Golden Hour:**
- ClockTime: 17.5–18.5
- Brightness: 4–5 for sunny effect
- Ambient: match sky color tones
- ColorShift_Top: Yellow/orange tint RGB(255, 200, 100)
- Apply SunRays effect for godrays

**Night:**
- ClockTime: 0–5
- OutdoorAmbient: RGB(0, 0, 0) for "extra dark"
- Ambient: RGB(0, 0, 0)
- Apply blue color tint
- Rely on placed light sources (PointLight, SpotLight)
- Moon brightness: moderate, don't overdo

**Horror:**
- Dim lighting with selective bright areas
- Low Brightness: 0.5–1
- Dark Ambient: RGB(10, 10, 20)
- Strategic SpotLights for emphasis

### ATMOSPHERE INSTANCE
- Density: 0.3–0.5 (light fog), 0.7+ (heavy fog/mist)
- Offset: 0 (fog starts at camera), 0.5+ (fog starts further away)
- Color: RGB(200, 210, 230) for daylight haze, darker for night
- Decay: RGB(180, 190, 210) — color at max distance
- Glare: 0 (none) to 1 (strong lens glare)
- Haze: 0 (clear) to 10 (very hazy)
- "Atmosphere blends everything together" vs fog which "keeps builds sharper"
- Haze can reduce rendering load (3.5/5 benefit)

### POST-PROCESSING EFFECTS
**Bloom:**
- Intensity: 0.1–0.3 (subtle), 0.5+ (strong glow)
- Size: 12–24
- Threshold: 0.8–1.0
- "Use sparingly to avoid oversaturation"
- Makes Neon material parts glow outward

**ColorCorrection:**
- Brightness: 0 (default)
- Contrast: 0.1–0.2 (slight enhancement)
- Saturation: 0 (default), -0.2 (muted), 0.3 (vivid)
- TintColor: RGB(255, 255, 255) default
- Color Shift Top: yellows/oranges for warm daytime

**DepthOfField:**
- "Apply lightly rather than heavily blurred"
- FarIntensity: 0.1–0.3
- FocusDistance: 20–50
- InFocusRadius: 50–100
- NearIntensity: 0

**SunRays:**
- Intensity: 0.1–0.3
- Spread: 0.5–1.0
- Best for daytime outdoor scenes

### INDOOR vs OUTDOOR BALANCE
- Problem: "OutdoorAmbient affecting the corners of rooms"
- Solution: Place PointLights/SpotLights in rooms to compensate
- Use invisible Parts with lights in hallways and rooms
- Reduce outdoor brightness if indoor light is too dim
- ShadowMap: suitable for all devices, easier indoor lighting
- Future: better shadows and reflections, more demanding
- "Light bleeding typically indicates excessive brightness"

### NEON GLOW EFFECTS
- Part Material: Neon (emits light appearance)
- Neon performance: 3/5 lag rating — use sparingly
- For signs: SurfaceGui on Part
  - LightInfluence: 0 (self-illuminated, ignores scene lighting)
  - Brightness: 2–5+ (higher = more bloom glow)
- "The higher the Brightness value, the more bloom effect will glow around the edges"
- Use white text/images for optimal neon appearance
- Use Bloom post-processing to enhance neon glow
- Neon glows less in dark atmospheres — increase Bloom or lower Atmosphere density
- PNG with transparent background for image-based signs
- UIStroke for enhanced text sign edges

### SKY SETUP
- Add custom Sky object in Lighting
- Customize skybox faces for mood
- Enlarge moon, increase star count for night scenes
- Cloud effects during day cycles
- Dynamic clouds: 4.5/5 lag rating — use cautiously
`,

  // ===========================================================================
  // SECTION 12: BUILDING TECHNIQUES & TIPS
  // ===========================================================================
  BUILDING_TECHNIQUES: `
## ADVANCED BUILDING TECHNIQUES

### CURVATURE (Archimedes Method — Primary)
1. Select base part
2. Open Archimedes plugin
3. Choose axis direction (which face generates new parts)
4. Input angle: 90° for quarter-circle, 180° for semi-circle, 360° for full circle
5. Set segment count (more = smoother curve)
6. Render to generate curved segments
- Inner arc segments are shorter, outer are longer
- Use ResizeAlign to fix misaligned segments
- "Dummy segments technique": generate temporary segments to fix measurements, delete before continuing

### CURVATURE (Cylinder/Sphere Method)
1. Create base Part
2. Duplicate and convert to Cylinder shape
3. Duplicate cylinder and convert to Sphere (matching width)
4. Use sphere as pivot point to rotate segments at any angle
5. Result: "near-seamless connections" with adjustable angles

### CURVATURE (Wedge Method — Limited)
- Duplicate wedges with decreasing width and increasing height
- Example: 5x5, 6x4, 7x3
- Only useful when construction ends at the curve
- Wedge hypotenuse angles are "unclean" unless length equals height

### THE GOLDEN INCREMENT
- Use 0.25-stud increments: "0.25 adds up to 0.5, which adds up to 1"
- Prevents z-fighting and gaps between parts
- All part sizes and positions should align to 0.25 grid

### SPIRAL STAIRCASE
1. Generate circle with Archimedes
2. Create central pivot with GapFill
3. Keep 2 adjacent steps, move second up by step height
4. GapFill underside for smooth bottom
5. Duplicate and rotate around center at consistent angles

### OPTIMIZATION RULES
- Under 5,000 parts within 300-stud render distance
- Buildings without interiors: 100–600 parts
- Enable Workspace.StreamingEnabled (default 1024 studs)
- Anchor everything: "movement of parts causes lag"
- Neon material: 3/5 lag rating
- SmoothPlastic: lowest lag
- Dynamic clouds: 4.5/5 lag rating
- Convert unions to MeshParts (export/import OBJ) for better performance
- Group multiple parts to minimize overhead

### VARIATION STRATEGY
- Create 3 variants per model type
- Manipulate each through: color shift, rotation, size scale
- "The secret is colour, rotation and size variation"
- "If you go up, you must go down" — natural flow

### ESSENTIAL PLUGINS
- F3X Building Tools: Individual part scaling within models
- Archimedes 2/3: Axis-based copying for curves and circles
- Brush Tool 2.1: Organic environment creation with randomized placement
- Stravant GapFill: Automatic precise block connections
- Stravant ResizeAlign: Part alignment and sizing
- Model Reflect: Symmetrical construction mirroring
- TerrainPainter2: Fast Perlin noise-based terrain painting
- Wall Creator: Wall placement between posts
- Wall Builder: Seamless terrain walls and paths
- Part to Terrain: Convert parts to terrain material
- Texture Library: Surface decoration

### DETAILING PHILOSOPHY
- "There is more to building than putting two parts together"
- Add visual life through colors, lighting, terrain, particles, atmosphere
- Reference real-world photos: "look at every detail, focus on the smallest things"
- Use textures and decals to bring surfaces to life
- Layer components for depth — never single-piece walls, doors, windows
- "Add windowsills and plants or other details"
- PBR textures from polyhaven.com and c4dcenter.com for premium surfaces
- Maximum texture resolution: 1024x1024 pixels, must be seamless

### MATERIAL PERFORMANCE RANKING (Best to Worst)
1. SmoothPlastic — least lag
2. Wood, Concrete, Brick, Metal — standard performance
3. Glass — moderate (transparency calculations)
4. Fabric — moderate
5. Marble, Granite — moderate-heavy
6. Neon — heavy (3/5 lag)
7. ForceField — heaviest

### COLOR THEORY FOR BUILDS
- Bright colors = happiness, energy (games for kids)
- Darker tones = mystery, horror, mature themes
- Earth tones = natural, realistic environments
- Monochrome + accent = modern/sleek
- Complementary colors for visual interest
- "Lessen lively colors" for realistic look
- Use 2-3 main colors + 1 accent per build
`
};

// =============================================================================
// PROMPT MATCHER — Returns relevant knowledge sections for a given prompt
// =============================================================================

const SECTION_KEYWORDS: Record<string, { key: keyof typeof BUILDING_MASTERY_KNOWLEDGE; keywords: string[] }[]> = {
  house: [
    { key: 'HOUSE_CONSTRUCTION', keywords: ['house', 'home', 'cabin', 'cottage', 'bungalow', 'apartment', 'residential', 'villa', 'mansion', 'building', 'shelter', 'hut', 'shack', 'dwelling'] },
  ],
  tree: [
    { key: 'TREE_PLANT_CONSTRUCTION', keywords: ['tree', 'plant', 'bush', 'shrub', 'flower', 'garden', 'forest', 'jungle', 'vegetation', 'grass', 'hedge', 'vine', 'leaf', 'foliage', 'palm', 'oak', 'pine', 'nature', 'botanical'] },
  ],
  furniture: [
    { key: 'FURNITURE_CONSTRUCTION', keywords: ['furniture', 'chair', 'table', 'bed', 'desk', 'couch', 'sofa', 'shelf', 'bookshelf', 'lamp', 'cabinet', 'dresser', 'wardrobe', 'closet', 'nightstand', 'counter', 'stool', 'bench', 'tv', 'television', 'kitchen'] },
  ],
  vehicle: [
    { key: 'VEHICLE_CONSTRUCTION', keywords: ['car', 'truck', 'vehicle', 'bus', 'van', 'motorcycle', 'bike', 'boat', 'ship', 'airplane', 'plane', 'helicopter', 'taxi', 'ambulance', 'fire truck', 'police car', 'race car', 'sports car', 'jeep', 'suv'] },
  ],
  environment: [
    { key: 'ENVIRONMENT_BUILDING', keywords: ['road', 'street', 'path', 'sidewalk', 'fence', 'wall', 'railing', 'terrain', 'landscape', 'town', 'city', 'village', 'bridge', 'park', 'playground', 'parking', 'highway', 'intersection', 'curb'] },
  ],
  interior: [
    { key: 'INTERIOR_DESIGN', keywords: ['interior', 'room', 'indoor', 'decoration', 'decorate', 'living room', 'bedroom', 'bathroom', 'kitchen', 'hallway', 'corridor', 'office', 'inside'] },
  ],
  castle: [
    { key: 'CASTLE_MEDIEVAL', keywords: ['castle', 'medieval', 'fortress', 'tower', 'dungeon', 'kingdom', 'knight', 'throne', 'battlement', 'moat', 'drawbridge', 'portcullis', 'keep', 'rampart', 'fantasy', 'ancient', 'ruins', 'temple'] },
  ],
  modern: [
    { key: 'MODERN_BUILDING', keywords: ['modern', 'skyscraper', 'office building', 'glass', 'contemporary', 'minimalist', 'high-rise', 'penthouse', 'luxury', 'corporate', 'downtown', 'urban', 'mall', 'store', 'shop', 'retail', 'commercial'] },
  ],
  prop: [
    { key: 'PROP_DETAILS', keywords: ['handle', 'sill', 'trim', 'molding', 'detail', 'prop', 'decoration', 'accessory', 'lamp post', 'street lamp', 'fire hydrant', 'mailbox', 'trash', 'barrel', 'crate', 'sign', 'bench', 'picture frame', 'ceiling fan'] },
  ],
  spawn: [
    { key: 'SPAWN_LOBBY_DESIGN', keywords: ['spawn', 'lobby', 'hub', 'menu', 'start', 'welcome', 'portal', 'teleport', 'waiting', 'queue'] },
  ],
  lighting: [
    { key: 'LIGHTING_ATMOSPHERE', keywords: ['light', 'lighting', 'atmosphere', 'glow', 'neon', 'bloom', 'fog', 'shadow', 'sun', 'moon', 'night', 'day', 'sunset', 'sunrise', 'dark', 'bright', 'ambient', 'sky', 'weather', 'rain', 'storm'] },
  ],
  technique: [
    { key: 'BUILDING_TECHNIQUES', keywords: ['curve', 'arch', 'dome', 'spiral', 'staircase', 'optimize', 'performance', 'plugin', 'technique', 'advanced', 'wedge', 'union', 'csg', 'detail', 'how to build', 'tips', 'tricks', 'guide'] },
  ],
};

/**
 * Returns relevant building mastery knowledge sections for a given prompt.
 * Analyzes the prompt for keywords and returns matching construction guides.
 */
export function getRelevantBuildingMastery(prompt: string): string {
  const lower = prompt.toLowerCase();
  const matched = new Set<keyof typeof BUILDING_MASTERY_KNOWLEDGE>();

  // Check each section's keywords against the prompt
  for (const sectionGroup of Object.values(SECTION_KEYWORDS)) {
    for (const { key, keywords } of sectionGroup) {
      for (const keyword of keywords) {
        if (lower.includes(keyword)) {
          matched.add(key);
          break;
        }
      }
    }
  }

  // If nothing matched, return general building techniques + house construction as defaults
  if (matched.size === 0) {
    matched.add('BUILDING_TECHNIQUES');
    matched.add('HOUSE_CONSTRUCTION');
    matched.add('LIGHTING_ATMOSPHERE');
  }

  // Always include building techniques if more than 2 sections matched (complex build)
  if (matched.size >= 2) {
    matched.add('BUILDING_TECHNIQUES');
  }

  // Always include lighting for any environment/building request
  if (matched.has('HOUSE_CONSTRUCTION') || matched.has('MODERN_BUILDING') ||
      matched.has('CASTLE_MEDIEVAL') || matched.has('ENVIRONMENT_BUILDING') ||
      matched.has('SPAWN_LOBBY_DESIGN')) {
    matched.add('LIGHTING_ATMOSPHERE');
  }

  // Always include props for interior or house builds
  if (matched.has('INTERIOR_DESIGN') || matched.has('HOUSE_CONSTRUCTION')) {
    matched.add('PROP_DETAILS');
  }

  // Always include furniture for interior builds
  if (matched.has('INTERIOR_DESIGN')) {
    matched.add('FURNITURE_CONSTRUCTION');
  }

  // Always include trees/plants for environment builds
  if (matched.has('ENVIRONMENT_BUILDING')) {
    matched.add('TREE_PLANT_CONSTRUCTION');
  }

  // Cap at 5 sections to avoid token overload
  const sections = Array.from(matched).slice(0, 5);

  return sections
    .map(key => BUILDING_MASTERY_KNOWLEDGE[key])
    .join('\n\n---\n\n');
}

/**
 * Returns ALL building mastery knowledge. Use sparingly — this is large.
 */
export function getAllBuildingMastery(): string {
  return Object.values(BUILDING_MASTERY_KNOWLEDGE).join('\n\n---\n\n');
}

/**
 * Returns a specific section by name.
 */
export function getBuildingMasterySection(section: keyof typeof BUILDING_MASTERY_KNOWLEDGE): string {
  return BUILDING_MASTERY_KNOWLEDGE[section] || '';
}
