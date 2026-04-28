/**
 * Building Bible — 150+ exhaustive object build guides for Roblox Part construction.
 *
 * Each entry describes exact Part decomposition, dimensions, materials, Color3 values,
 * positioning, and pro tips. This is injected into AI prompts for building/prop/furniture
 * tasks so the AI knows how to construct ANY common object from primitives.
 *
 * Categories: Houses, Vehicles, Furniture, Weapons, Nature, Characters,
 *             Structures, Props, Food, Game Elements
 *
 * Scale reference: Roblox character = 5 studs tall, 2 studs wide, 1 stud deep.
 * Door = 4×7 studs. Ceiling = 12 studs. Floor thickness = 1 stud.
 */

export const BUILDING_BIBLE: string = `
╔═══════════════════════════════════════════════════════════════════════════════╗
║                    THE BUILDING BIBLE — 150+ OBJECT GUIDES                  ║
║          Exact Part decomposition for professional Roblox builds            ║
╚═══════════════════════════════════════════════════════════════════════════════╝

GLOBAL RULES:
- NEVER use SmoothPlastic material. Use Concrete, Brick, Wood, Metal, Glass, etc.
- NEVER build anything from a single Part. Minimum 3 parts for smallest objects.
- All Color3 values are Color3.fromRGB(r,g,b) format.
- Sizes are in studs (X = width, Y = height, Z = depth).
- Position parts relative to a central anchor point.
- Use WeldConstraints to join parts, not anchoring everything.
- Add small detail parts (trim, handles, rivets) — they make or break realism.

════════════════════════════════════════════════════════════════════════════════
 SECTION 1: HOUSES (15 Types)
════════════════════════════════════════════════════════════════════════════════

────────────────────────────────────────────────────────────────────────────────
1.01 MODERN HOUSE
────────────────────────────────────────────────────────────────────────────────
Part count: 45-70 | Difficulty: Medium-High

FOUNDATION (3 parts):
- Main slab: Part 40×1×30, Concrete, Color3.fromRGB(180,180,180)
- Edge trim: 4 thin Parts 0.5 studs tall around perimeter, Concrete, Color3.fromRGB(160,160,160)
- Step platform: Part 8×0.5×4 in front of door, Concrete, Color3.fromRGB(190,190,190)

WALLS (8-12 parts):
- Use flat box Parts: 0.5 thick (Z or X depending on orientation)
- Front wall: 40×12×0.5, Concrete, Color3.fromRGB(245,245,245) — white
- Side walls: 30×12×0.5, same color
- Back wall: 40×12×0.5, same
- Cut window holes by using multiple wall segments with gaps
- Accent wall section: 10×12×0.5, Wood, Color3.fromRGB(140,90,50) — warm wood panel
- Interior divider walls: 0.3 thick, Color3.fromRGB(240,240,235)

ROOF (4-6 parts):
- Modern houses use FLAT roofs. Part 42×0.8×32 overhanging 1 stud each side
- Roof color: Concrete, Color3.fromRGB(70,70,70) — dark gray
- Roof edge fascia: thin Part 0.3 thick around roof perimeter, Metal, Color3.fromRGB(50,50,50)
- Optional: slight 2-3 degree tilt for drainage (rotate Part slightly)

WINDOWS (6-10 parts):
- Large floor-to-ceiling windows: Part 8×10×0.2, Glass, Color3.fromRGB(200,220,240) with Transparency 0.6
- Window frames: thin Parts 0.3×0.3 around each window, Metal, Color3.fromRGB(40,40,40)
- Modern = big windows, minimal frames, clean lines

DOOR (3 parts):
- Door panel: Part 4×7×0.3, Wood, Color3.fromRGB(60,45,30) — dark wood
- Door frame: 3 thin Parts (top + 2 sides), Metal, Color3.fromRGB(50,50,50)
- Handle: small cylinder 0.2×0.8×0.2, Metal, Color3.fromRGB(180,180,180)

FLOOR (2-3 parts):
- Interior floor: Part 39×0.3×29, Wood, Color3.fromRGB(180,140,100)
- Kitchen area: Part 15×0.3×12, Concrete, Color3.fromRGB(200,200,200) — tile look
- Bathroom: Part 8×0.3×8, Concrete, Color3.fromRGB(220,220,220)

DETAILS (8-15 parts):
- Garage door: Part 10×8×0.3, Metal, Color3.fromRGB(90,90,90)
- Garage door lines: 3 thin Parts across it horizontally, Metal, Color3.fromRGB(70,70,70)
- Exterior light fixtures: small Parts near door, Metal, Color3.fromRGB(200,180,100)
- Planter boxes: Part 6×2×1.5, Concrete, Color3.fromRGB(100,100,100) with green Part inside
- Chimney (optional): Part 3×4×3 on roof, Brick, Color3.fromRGB(120,60,40)
- Railing on upper balcony: thin vertical + horizontal Parts, Metal, Color3.fromRGB(40,40,40)

PRO vs AMATEUR:
- PRO: Wall thickness variation, window mullions, subtle material changes, trim pieces
- AMATEUR: Flat colored boxes, no trim, windows as just transparent walls, no overhang

────────────────────────────────────────────────────────────────────────────────
1.02 VICTORIAN HOUSE
────────────────────────────────────────────────────────────────────────────────
Part count: 60-90 | Difficulty: High

FOUNDATION (4 parts):
- Raised foundation: Part 30×3×25, Brick, Color3.fromRGB(140,100,70) — stone look
- Foundation trim: Part 31×0.5×26, Concrete, Color3.fromRGB(180,170,160)
- Front porch base: Part 12×3×6, Wood, Color3.fromRGB(160,130,90)
- Steps: 3 stacked Parts decreasing size, Wood, Color3.fromRGB(150,120,85)

FIRST FLOOR WALLS (8 parts):
- Clapboard siding look: WoodPlanks material, Color3.fromRGB(200,180,140) — cream/yellow
- Wall thickness: 0.8 studs (thicker than modern)
- Bay window bump-out: 3 angled wall parts forming a trapezoid, 6 wide×10 tall
- Each wall section 0.8 thick, same material

SECOND FLOOR WALLS (8 parts):
- Same material but can be slightly different shade: Color3.fromRGB(190,175,135)
- Belt course divider between floors: Part 30×0.5×0.3 horizontal trim
- Smaller windows than first floor

ROOF (8-12 parts):
- Steep gabled roof: 2 large Parts angled at 45 degrees meeting at ridge
- Roof material: WoodPlanks, Color3.fromRGB(80,50,40) — dark shingle look
- Gable trim (vergeboard): ornate thin Parts along roof edges
- Ridge cap: thin Part along the peak
- Dormer window: small gabled roof structure on main roof (3-4 parts)
- Tower/turret: optional cylindrical section at corner with conical roof

PORCH (10-15 parts):
- Floor: Part 12×0.5×6, Wood, Color3.fromRGB(160,130,90)
- 4-6 turned columns: Cylinders 1×8×1, Wood, Color3.fromRGB(230,220,200)
- Porch roof: Part 13×0.3×7, matching main roof
- Decorative brackets between columns: small triangular Parts
- Railing: horizontal Part 0.3×0.3 between columns with vertical balusters

WINDOWS (8-12 parts):
- Tall narrow windows: Part 3×6×0.2, Glass, Color3.fromRGB(180,210,230) Transparency 0.5
- Each window has thick frame: 4 Parts forming rectangle, Wood, Color3.fromRGB(230,220,200)
- Window sill: Part 3.5×0.3×1, extending outward
- Window hood/pediment: small triangular or arched Part above window

DETAILS (10-20 parts):
- Fish-scale shingles on gable: textured Part, Color3.fromRGB(120,90,70)
- Decorative trim at every edge and corner
- Chimney: tall Part 3×6×3, Brick, Color3.fromRGB(150,70,50)
- Lightning rod on peak: thin cylinder, Metal
- Front door with transom window above

PRO vs AMATEUR:
- PRO: Ornate trim everywhere, multiple roof layers, porch details, varied window sizes
- AMATEUR: Just a box with a triangle roof, no porch, no trim, wrong proportions

────────────────────────────────────────────────────────────────────────────────
1.03 LOG CABIN
────────────────────────────────────────────────────────────────────────────────
Part count: 35-55 | Difficulty: Medium

FOUNDATION (3 parts):
- Stone base: Part 20×2×16, Concrete, Color3.fromRGB(120,110,100) — fieldstone gray
- Corner stones: 4 slightly larger Parts at corners, same material
- Front step: single flat Part, same stone

WALLS (12-16 parts):
- Log walls built from horizontal cylinders stacked:
  Each "log" = Part (cylinder shape) 20×1.5×1.5, WoodPlanks, Color3.fromRGB(140,95,55)
- Stack 8 logs per wall = 12 stud height
- Alternate colors slightly: RGB(140,95,55), RGB(130,85,50), RGB(150,100,60)
- Logs extend past corners by 1-2 studs (interlocking cabin look)
- Corner notching: small cube Parts where logs cross at corners

ROOF (4-6 parts):
- A-frame steep pitch: 2 Parts angled at 40 degrees
- Material: WoodPlanks, Color3.fromRGB(90,60,35) — dark wood
- Roof overhang: 2-3 studs past walls
- Ridge beam: exposed cylinder along peak, same wood color
- Purlins: 3-4 horizontal beams visible under roof on gable ends

CHIMNEY (5-7 parts):
- Stone chimney is ESSENTIAL for log cabins
- Main stack: Part 4×10×4, Concrete, Color3.fromRGB(100,90,80)
- Chimney cap: Part 5×0.5×5, Concrete, Color3.fromRGB(80,70,65)
- Fireplace opening inside: Part 3×4×2 negative space (dark Part)
- Hearth: flat Part in front of fireplace, Concrete, Color3.fromRGB(90,80,70)

PORCH (5-8 parts):
- Simple covered porch: 2 log posts (cylinders) + beam + roof extension
- Porch floor: Part 20×0.5×6, WoodPlanks, Color3.fromRGB(130,90,50)
- Rocking chair area (see furniture section)

WINDOWS (4-6 parts):
- Small windows: Part 2.5×3×0.2, Glass, Color3.fromRGB(200,215,225) Transparency 0.4
- Heavy wood frames: thick Parts 0.5×0.5, WoodPlanks, Color3.fromRGB(100,65,35)
- Window shutters: 2 Parts flanking each window, WoodPlanks, Color3.fromRGB(70,50,30)

PRO vs AMATEUR:
- PRO: Logs interlock at corners, chimney stone variation, visible roof structure
- AMATEUR: Brown boxes, flat walls with wood texture, no chimney, no overhang

────────────────────────────────────────────────────────────────────────────────
1.04 BEACH HOUSE
────────────────────────────────────────────────────────────────────────────────
Part count: 40-60 | Difficulty: Medium

STILTS/FOUNDATION (6-8 parts):
- 6-8 cylindrical stilts: each 1.5×8×1.5, Concrete, Color3.fromRGB(190,185,175)
- Cross-bracing between stilts: thin diagonal Parts, Wood, Color3.fromRGB(170,160,140)
- Platform: Part 28×1×22, Wood, Color3.fromRGB(180,165,140) — weathered wood
- Staircase from ground: 8-10 step Parts ascending at angle

WALLS (6-8 parts):
- Light colored siding: WoodPlanks, Color3.fromRGB(220,225,230) — pale blue/white
- Walls thinner: 0.5 studs
- Large openings for sliding doors
- Bottom 3 studs of some walls = open lattice (crisscross thin Parts)

ROOF (3-5 parts):
- Hip roof (all 4 sides slope): 4 triangular Parts meeting at center
- Metal roof material: Metal, Color3.fromRGB(160,170,175) — light gray/blue
- Deep overhang: 3+ studs for shade
- Exposed rafters visible at eaves: thin Parts poking out

DECK (5-8 parts):
- Wraparound deck: L-shaped platform extending from house
- Deck boards: WoodPlanks, Color3.fromRGB(175,155,130) — sun-bleached
- Railing: horizontal + vertical thin Parts, Wood, Color3.fromRGB(230,230,225) — white
- Built-in bench: simple Part along railing

WINDOWS/DOORS (6-8 parts):
- Sliding glass doors: Part 8×7×0.15, Glass, Transparency 0.7
- Louvered shutters: Parts with small horizontal gaps, Color3.fromRGB(100,160,190) — coastal blue
- Round porthole window (optional): Cylinder with glass center

DETAILS (5-10 parts):
- Outdoor shower: small enclosure of 3 Parts + cylinder pipe
- Surfboard leaning on wall: thin curved Part, Color3.fromRGB(255,200,50)
- Rope railing on stair: thin cylinder Parts
- Weather vane on roof peak
- Ceiling fans on porch (simple cross shape)

PRO vs AMATEUR:
- PRO: Weathered color palette, stilts with bracing, open airy feel, coastal colors
- AMATEUR: Regular house painted blue, no stilts, no deck, no weathering

────────────────────────────────────────────────────────────────────────────────
1.05 TREEHOUSE
────────────────────────────────────────────────────────────────────────────────
Part count: 50-75 | Difficulty: High

HOST TREE (10-15 parts):
- Massive trunk: Cylinder 4×20×4, Wood, Color3.fromRGB(85,60,35)
- 4-6 large branches radiating out at 60-70% height
- Branch diameter: 1-2 studs, length 6-10 studs
- Canopy: 5-8 overlapping sphere meshes, Color3.fromRGB(50,120,40) LeafyGrass material
- Exposed roots at base: 3-4 wedge Parts

PLATFORM (4-6 parts):
- Main floor: Part 16×0.8×14 centered on trunk at branch level (~14 studs up)
- Support beams: 4 diagonal Parts from trunk to platform corners
- Trunk passes through hole in platform (leave gap)
- Edge boards: thin trim Parts around platform perimeter

WALLS (6-8 parts):
- Half-walls (waist height): Part sections 16×4×0.5, WoodPlanks, Color3.fromRGB(150,110,65)
- Upper half: open or canvas (Part with Fabric material, Color3.fromRGB(200,180,140))
- One wall fully open (the view side)
- Crooked/organic feel: slight random rotations on wall parts

ROOF (3-5 parts):
- Pitched thatch/wood roof: 2 angled Parts, WoodPlanks, Color3.fromRGB(110,80,45)
- Not perfectly aligned — organic feel
- Branch poking through roof: one trunk branch intersects roof
- Leaf clusters on roof edges

ACCESS (6-10 parts):
- Rope ladder: 2 vertical thin cylinders (rope) + 8-10 horizontal rungs
- Rung spacing: 1.5 studs apart
- Rope color: Color3.fromRGB(180,160,120) — hemp
- Rung color: WoodPlanks, Color3.fromRGB(140,100,60)
- Alternative: spiral staircase wrapping trunk (8-12 wedge Parts)

DETAILS (8-12 parts):
- Tire swing hanging from branch: Torus + rope (cylinder)
- Pulley bucket: small Part with cylinder above
- Window: simple square opening (no glass)
- Lantern: small glowing Part with PointLight
- Wooden sign: flat Part with SurfaceGui text
- Bird's nest on nearby branch: small bowl-shaped Part cluster

PRO vs AMATEUR:
- PRO: Organic imperfect shapes, tree integrated with structure, rope details, leafy canopy
- AMATEUR: Box on top of a cylinder, perfectly straight, no tree integration

────────────────────────────────────────────────────────────────────────────────
1.06 MEDIEVAL COTTAGE
────────────────────────────────────────────────────────────────────────────────
Part count: 40-60 | Difficulty: Medium

FOUNDATION (2-3 parts):
- Cobblestone base: Part 18×1.5×14, Cobblestone, Color3.fromRGB(130,120,110)
- Irregular edge stones: 2-3 slightly offset Parts at base

WALLS (8-10 parts):
- White-washed plaster walls: Concrete, Color3.fromRGB(235,225,210) — warm cream
- Half-timber framing: exposed wood beams on exterior
  - Vertical beams: Part 0.5×10×0.5 at each corner and every 4 studs
  - Diagonal braces: Part 0.5×6×0.5 rotated 45 degrees
  - Horizontal beam at mid-height: Part 18×0.5×0.5
  - All timber: WoodPlanks, Color3.fromRGB(90,60,35) — dark oak
- Walls slightly bowed/uneven — rotate 1-2 degrees for organic feel

ROOF (5-8 parts):
- Steep thatch roof: 2 Parts at 50 degrees, WoodPlanks, Color3.fromRGB(140,120,70) — straw color
- Thick roof (1.5 stud height for thatch bulk)
- Ridge roll: cylinder along peak, same color
- Roof overhangs significantly (2-3 studs) on all sides
- Optional: slight sag in middle (rotate roof Parts very slightly)

DOOR (3-4 parts):
- Arched door: Part 3×6×0.4, Wood, Color3.fromRGB(80,50,30)
- Arch top: half-cylinder or wedge Part at top
- Iron strap hinges: 2 thin flat Parts across door, Metal, Color3.fromRGB(50,50,50)
- Handle: small ring Part, Metal

WINDOWS (4-6 parts):
- Small leaded windows: Part 2×2.5×0.2, Glass, Color3.fromRGB(190,200,170) Transparency 0.4
- Diamond lattice: thin crossed Parts over glass, Metal, Color3.fromRGB(60,60,60)
- Deep window reveal: window recessed 0.5 studs into wall
- Flower box under window: Part 2.5×1×1, Wood + small colored Parts for flowers

CHIMNEY (3-4 parts):
- Stone chimney: Part 3×5×3, Cobblestone, Color3.fromRGB(110,100,90)
- Chimney pot: small cylinder on top, Concrete, Color3.fromRGB(140,80,50)
- Smoke: optional ParticleEmitter

DETAILS (6-10 parts):
- Barrel by door: cylinder Part, WoodPlanks, Color3.fromRGB(120,80,45)
- Woodpile: cluster of small brown Parts stacked against wall
- Lantern by door: small metal frame with glowing center
- Cobblestone path: flat Part leading to door
- Small garden fence: picket-style thin Parts

PRO vs AMATEUR:
- PRO: Half-timber framing visible, thick thatch roof, arched door, slightly crooked
- AMATEUR: White box with brown lines painted on, thin roof, perfectly straight

────────────────────────────────────────────────────────────────────────────────
1.07 JAPANESE HOUSE (TRADITIONAL)
────────────────────────────────────────────────────────────────────────────────
Part count: 45-65 | Difficulty: Medium-High

FOUNDATION (4-5 parts):
- Raised stone platform: Part 24×2×20, Concrete, Color3.fromRGB(150,145,135)
- Stone steps at entrance: 3 flat Parts, Concrete, Color3.fromRGB(140,135,125)
- Wooden posts supporting house: 6-8 small square Parts 0.8×2×0.8 visible under platform

WALLS (10-12 parts):
- Shoji screen sliding panels: Part 4×8×0.15, Color3.fromRGB(240,235,220) — rice paper cream
- Transparency 0.15 on shoji panels (slightly translucent)
- Dark wood framing: Parts 0.4×0.4, WoodPlanks, Color3.fromRGB(55,35,20) — very dark
- Grid pattern on shoji: thin Parts forming 3×4 grid over each panel
- Some wall sections solid: WoodPlanks, Color3.fromRGB(70,50,30)
- Engawa (veranda): extends 3 studs from house, Wood floor

ROOF (6-10 parts):
- Curved sweeping roof: multiple Parts at slightly different angles to simulate curve
- Deep overhang: 4+ studs past walls
- Roof material: Concrete, Color3.fromRGB(55,55,60) — dark charcoal tile look
- Ridge tiles: cylinder Parts along peak and hips
- Upturned eaves: end Parts rotated slightly upward
- Gable end decoration: triangular Part with ornamental detail

INTERIOR FEATURES (5-8 parts):
- Tatami mats: Part sections on floor, Color3.fromRGB(190,180,130) — woven straw
- Tatami border strips: thin dark Parts between mat sections
- Tokonoma alcove: recessed section in wall with raised floor
- Fusuma sliding doors for interior: opaque panels

GARDEN ELEMENTS (6-10 parts):
- Stone lantern (tōrō): stacked Parts — base, pillar, fire box, roof
- Stepping stones: 4-6 flat irregular Parts in ground
- Bamboo fence: vertical green cylinders with horizontal ties
- Small bridge over dry stream: curved Part, WoodPlanks, Color3.fromRGB(160,60,50) — red
- Gravel/sand area: flat Part, Concrete, Color3.fromRGB(210,200,180)

PRO vs AMATEUR:
- PRO: Curved roof lines, shoji grid detail, proper proportions, garden elements
- AMATEUR: Box with black triangle roof, no veranda, no garden, wrong scale

────────────────────────────────────────────────────────────────────────────────
1.08 APARTMENT BUILDING
────────────────────────────────────────────────────────────────────────────────
Part count: 50-80 | Difficulty: Medium

STRUCTURE (6-8 parts):
- Main block: Part 40×48×20 (4 floors × 12 studs each)
- Material: Concrete, Color3.fromRGB(200,195,185) — urban beige
- Floor plates visible: horizontal line Parts every 12 studs
- Core/stairwell bump: Part 8×48×8 extending from back

BALCONIES (12-20 parts):
- Each unit gets a balcony: Part 6×0.3×3 extending from face
- Balcony railing: 3 Parts (2 vertical + 1 horizontal), Metal, Color3.fromRGB(70,70,70)
- Balcony dividers between units: Part 0.2×3×3
- Arrange in grid: 4 across × 4 floors = 16 balconies

WINDOWS (12-16 parts):
- Regular grid of windows: each Part 3×4×0.15, Glass, Color3.fromRGB(160,190,210) Transparency 0.5
- Window frames: Metal, Color3.fromRGB(80,80,85)
- Some windows with curtains visible: reduce Transparency to 0.2, warmer color
- Ground floor = larger commercial windows

ENTRANCE (5-8 parts):
- Lobby entrance: Part 6×10×0.3, Glass with metal frame
- Awning/canopy over entrance: Part 8×0.3×4, Metal, Color3.fromRGB(60,60,60)
- Address numbers: small SurfaceGui on wall
- Intercom panel: small Part beside door
- Steps: 2-3 wide shallow Parts

ROOF (4-6 parts):
- Flat roof with parapet: wall Parts 2 studs tall around perimeter
- AC units: 2-3 box Parts, Metal, Color3.fromRGB(170,170,170)
- Water tank: cylinder on roof, Metal, Color3.fromRGB(150,150,150)
- Satellite dishes: small circle Parts angled

DETAILS (6-10 parts):
- Drainpipes: thin cylinders running down walls, Metal, Color3.fromRGB(100,100,100)
- Fire escape: ladder-like structure on side (thin Parts in zigzag)
- Ground floor shop signage: colored Part 8×2×0.2 with SurfaceGui
- Dumpster in back: box Part (see Props section)
- Street-level planter: Part 4×2×2, Concrete with green tops

PRO vs AMATEUR:
- PRO: Consistent window grid, balcony details, ground floor differentiated, roof equipment
- AMATEUR: Giant box with blue rectangles for windows, no depth, no ground floor detail

────────────────────────────────────────────────────────────────────────────────
1.09 FARMHOUSE
────────────────────────────────────────────────────────────────────────────────
Part count: 45-65 | Difficulty: Medium

FOUNDATION (2-3 parts):
- Low stone foundation: Part 28×1×20, Cobblestone, Color3.fromRGB(140,130,115)
- Foundation slightly wider than walls (0.5 stud overhang)

WALLS (8-10 parts):
- White clapboard: WoodPlanks, Color3.fromRGB(245,240,230) — off-white
- Wall height: 10 studs per floor, 2 floors
- Walls 0.6 thick
- Corner boards: vertical trim Parts at each corner, Color3.fromRGB(240,235,220)

ROOF (4-6 parts):
- Classic gable roof: 2 Parts at 35 degrees
- Dark shingles: WoodPlanks, Color3.fromRGB(50,45,40) — near black
- Wide overhang: 2 studs
- Dormers on upper floor: 2-3 small gabled window structures

PORCH (6-10 parts):
- Full-width front porch: Part 28×0.5×8 at first floor
- 4-6 white columns: cylinder Parts 1×9×1, Wood, Color3.fromRGB(240,235,225)
- Porch roof: Part 29×0.3×9
- Porch railing: thin Parts between columns
- Porch swing: suspended Part with chain cylinders (see Furniture)

BARN ATTACHMENT (optional, 8-12 parts):
- Connected barn section: Part 20×16×18, WoodPlanks, Color3.fromRGB(150,45,35) — red barn
- Large barn door: Part 10×12×0.4, same color but darker
- X-brace on door: 2 diagonal Parts, slightly darker wood
- Hay loft opening above door: Part 4×4 opening with small roof peak above
- Weathervane on barn peak: thin Parts forming rooster silhouette

WINDOWS (6-8 parts):
- Classic double-hung: Part 3×5×0.2, Glass, Transparency 0.5
- Window mullion (center cross): thin Parts dividing each window into 4 panes
- Green shutters: Color3.fromRGB(60,90,50)

DETAILS (6-10 parts):
- Stone chimney: Part 3×6×3, Cobblestone
- Picket fence: series of thin vertical Parts with horizontal rails
- Mailbox at road: post + box (see Props)
- Flower garden along foundation: colored small Parts
- Windmill in yard (see Structures)

PRO vs AMATEUR:
- PRO: Wrap-around porch, barn attachment, dormers, picket fence, lived-in details
- AMATEUR: White box, no porch, no farm elements, generic windows

────────────────────────────────────────────────────────────────────────────────
1.10 CASTLE KEEP
────────────────────────────────────────────────────────────────────────────────
Part count: 60-100 | Difficulty: High

WALLS (12-16 parts):
- Thick stone walls: 2-3 studs thick, Cobblestone, Color3.fromRGB(130,125,115)
- Wall height: 20-25 studs
- Batter (slight inward taper): bottom 3 studs slightly wider
- Wall sections between towers: straight Parts

TOWERS (16-24 parts, 4 towers):
- 4 corner towers, each cylinder 6×25×6
- Material: Cobblestone, Color3.fromRGB(125,120,110)
- Tower top: slightly wider cylinder cap Part
- Conical roof on each tower: Cone mesh or wedge Parts, Color3.fromRGB(70,60,55) — dark slate
- Arrow slits: thin vertical Parts cut into tower walls, 0.3×2 openings
- 3-4 arrow slits per tower

BATTLEMENTS/CRENELLATIONS (12-20 parts):
- Merlons: rectangular Parts 1.5×2×1 spaced evenly along wall top
- Crenels (gaps): 1.5 stud gaps between merlons
- Material: same as walls
- These go on ALL wall sections and tower tops

GATEHOUSE (8-12 parts):
- Larger front structure: Part 12×20×8
- Arched gateway: Part opening 6×10, with arch Part above
- Portcullis: grid of thin Parts (vertical + horizontal), Metal, Color3.fromRGB(80,75,70)
- Murder holes above gate passage (dark Parts in ceiling)
- Two flanking towers slightly larger than corner towers

COURTYARD (4-6 parts):
- Interior ground: Part 30×0.5×30, Cobblestone, Color3.fromRGB(150,145,135)
- Well in center: cylindrical wall + roof structure (see Structures)
- Stable lean-to against inner wall
- Stairs to wall walk: stepped Parts along one wall

KEEP BUILDING (6-10 parts):
- Central tallest structure: Part 15×30×15, Cobblestone, Color3.fromRGB(135,130,120)
- Smaller windows, thicker walls
- Flat roof with battlements
- Royal banner: thin Part with color, attached to pole

DETAILS (8-12 parts):
- Torch sconces on walls: bracket Part + flame Part (orange with PointLight)
- Guard posts at each tower top
- Drawbridge: flat Part over moat gap, WoodPlanks, Color3.fromRGB(100,70,40)
- Moat: blue transparent Part around castle perimeter
- Chains for drawbridge: thin cylinder Parts

PRO vs AMATEUR:
- PRO: Crenellations on EVERYTHING, arrow slits, battered walls, portcullis detail
- AMATEUR: Gray box with rectangles on top, no towers, paper-thin walls

────────────────────────────────────────────────────────────────────────────────
1.11 WAREHOUSE
────────────────────────────────────────────────────────────────────────────────
Part count: 30-45 | Difficulty: Low-Medium

STRUCTURE (6-8 parts):
- Large rectangular box: Part 50×16×30
- Material: Metal (corrugated), Color3.fromRGB(160,155,145) — industrial gray
- Ribbed walls: thin vertical Parts every 5 studs, Metal, Color3.fromRGB(140,135,130)
- Wall thickness: 0.3 studs (thin metal sheeting feel)

ROOF (3-5 parts):
- Shallow gable or barrel vault: Parts at low angle or slightly curved
- Material: Metal, Color3.fromRGB(140,140,135)
- Skylights: 2-3 rectangular Glass Parts in roof, Transparency 0.6
- Ridge ventilator: thin raised Part along peak

DOORS (4-6 parts):
- Large roll-up doors (2): Part 10×12×0.3, Metal, Color3.fromRGB(100,100,95)
- Horizontal lines on roll-up: 5-6 thin Parts across each door
- Personnel door: standard 4×7 metal door
- Loading dock: raised platform Part 12×3×6 outside main doors

WINDOWS (2-4 parts):
- High clerestory windows: narrow horizontal Part 15×3×0.2 near roof
- Wire mesh over windows: very faint grid pattern Part
- Minimal windows — warehouses are mostly solid walls

DETAILS (5-8 parts):
- Loading dock bumpers: 2 black rubber Parts at dock edge
- Forklift (simplified): 4-5 Parts — body + mast + forks
- Stacked pallets: layered Parts, WoodPlanks, Color3.fromRGB(170,140,90)
- External staircase to roof: zigzag stair Parts with railing
- Gutters and downspouts: thin Parts along roofline
- Security light: Part on bracket near door

PRO vs AMATEUR:
- PRO: Corrugated texture, loading dock, industrial details, varied wall sections
- AMATEUR: Gray box, no doors, no dock, no equipment

────────────────────────────────────────────────────────────────────────────────
1.12 CHURCH
────────────────────────────────────────────────────────────────────────────────
Part count: 55-80 | Difficulty: High

NAVE (8-10 parts):
- Main rectangular body: Part 20×16×40 (long axis is depth)
- Material: Brick, Color3.fromRGB(180,160,130) — sandstone
- Buttresses along sides: 4-6 protruding Parts 2×14×1 per side
- Wall thickness: 1.5 studs (stone construction feel)

TOWER/STEEPLE (8-12 parts):
- Square tower base: Part 8×24×8 at front, Brick, same color
- Belfry level: open arches (Parts with gaps) at tower top
- Spire: 4 triangular Parts meeting at point, or pyramid Part
- Spire material: Metal, Color3.fromRGB(90,95,85) — weathered copper/lead
- Cross on top: 2 thin Parts forming cross, Metal, Color3.fromRGB(200,180,50) — gold

ROOF (4-6 parts):
- Steep gable: 2 Parts at 45 degrees over nave
- Material: Concrete, Color3.fromRGB(80,75,70) — slate
- Ridge cross at east end

ENTRANCE (4-6 parts):
- Large double doors: 2 Parts each 3×8×0.4, Wood, Color3.fromRGB(70,45,25)
- Pointed arch above door: wedge Part
- Tympanum (semicircle above door): decorative Part
- Steps: 5 wide shallow Parts, Concrete

WINDOWS (8-12 parts):
- Pointed arch (Gothic) windows: tall narrow Parts 2×6 with pointed top
- Stained glass: Glass material, varied bright colors, Transparency 0.3
- Rose window on front: large circular Part 6×6, Glass, Color3.fromRGB(180,50,50) Transparency 0.4
- Stone tracery: thin Parts dividing windows, matching wall stone

DETAILS (6-10 parts):
- Bell in tower: sphere Part, Metal, Color3.fromRGB(170,140,50)
- Graveyard: collection of thin upright slabs in yard
- Stone wall around property: low Part 1×3×0.5 perimeter
- Gate: metal Parts at entrance to grounds
- Noticeboard: small Part on wooden posts near gate

PRO vs AMATEUR:
- PRO: Buttresses, pointed arches, rose window, steeple with cross, proper proportions
- AMATEUR: Box with triangle roof, no tower, rectangular windows, no arch details

────────────────────────────────────────────────────────────────────────────────
1.13 DINER (1950s STYLE)
────────────────────────────────────────────────────────────────────────────────
Part count: 40-55 | Difficulty: Medium

STRUCTURE (6-8 parts):
- Rounded barrel roof shape: curved top (use multiple angled Parts) or flat with curved front
- Body: Part 30×10×15, Metal, Color3.fromRGB(220,220,215) — chrome silver
- Lower half: Part 30×5×15, Brick, Color3.fromRGB(180,50,50) — red brick or red panel
- Horizontal chrome strip dividing upper/lower: Part 30×0.3×0.2, Metal, Color3.fromRGB(200,200,200)

WINDOWS (6-8 parts):
- Long continuous window bands: Part 20×5×0.15, Glass, Color3.fromRGB(200,220,235) Transparency 0.5
- Chrome window frames: thin Parts, Metal, Color3.fromRGB(190,190,190)
- Neon signs visible through window (colored Parts with glow)

ENTRANCE (3-4 parts):
- Glass door: Part 4×7×0.15, Glass, Transparency 0.6
- Chrome door handle: cylinder Part
- "OPEN" sign: small glowing Part, Color3.fromRGB(255,50,50)
- Welcome mat: flat Part

ROOF SIGN (4-6 parts):
- Large neon sign on roof: flat Part 15×4×0.3
- Sign text via SurfaceGui: "DINER" or custom name
- Neon glow: colored Parts with PointLight, Color3.fromRGB(255,100,100) — red neon
- Arrow sign: triangular Parts pointing at entrance

EXTERIOR DETAILS (6-10 parts):
- Outdoor tables: simple Part + 4 leg Parts (see Furniture)
- Parking lot: flat dark Part 40×0.1×30, Concrete, Color3.fromRGB(60,60,60)
- Parking lines: thin yellow Parts on lot
- Jukebox visible through window (see Props)
- AC unit on roof: box Part, Metal
- Trash cans by back door: cylinder Parts

INTERIOR HINTS (4-6 parts):
- Counter: long Part inside visible through window
- Bar stools: small cylinder + seat Parts
- Checkered floor: alternating colored floor Parts (black/white)
- Booth seats: red Parts visible through windows, Color3.fromRGB(180,30,30)

PRO vs AMATEUR:
- PRO: Chrome strips, neon signage, checkered floor, period-correct colors, round forms
- AMATEUR: Rectangular box, no chrome, no neon, wrong era styling

────────────────────────────────────────────────────────────────────────────────
1.14 SCHOOL
────────────────────────────────────────────────────────────────────────────────
Part count: 50-70 | Difficulty: Medium

MAIN BUILDING (8-10 parts):
- 2-story rectangular block: Part 50×24×25
- Material: Brick, Color3.fromRGB(170,90,60) — red brick
- Horizontal concrete band between floors: Part 50×1×0.3, Concrete, Color3.fromRGB(190,185,175)
- Corner quoins: slightly different brick color at building corners

ENTRANCE (5-8 parts):
- Central entrance projection: Part 10×26×4 extending from front
- Double doors: 2 Parts, Wood or Metal, Color3.fromRGB(60,80,100) — school blue
- Pediment above entrance: triangular Part, Concrete
- "SCHOOL" lettering: SurfaceGui on facade
- Flagpole: tall thin cylinder with small colored Part (flag)
- Wide steps: 4 full-width shallow Parts

WINDOWS (10-15 parts):
- Regular grid: tall classroom windows Part 4×6×0.15, Glass, Transparency 0.5
- Concrete sills: Part 4.5×0.3×0.8 under each window
- 6-8 windows per floor per side = lots of windows
- Each window divided into 2 panes by thin vertical mullion

ROOF (3-5 parts):
- Flat institutional roof with parapet
- Parapet: Part 0.5×2×0.5 around perimeter
- HVAC equipment: 2-3 box Parts, Metal
- Flagpole base on roof

PLAYGROUND (8-12 parts):
- Asphalt area: Part 30×0.1×20, Concrete, Color3.fromRGB(70,70,70)
- Basketball hoop: post + backboard + rim Parts
- Swing set: A-frame Parts + chain cylinders + seat Parts
- Slide: angled Part with sides, Metal, Color3.fromRGB(220,50,50) — red
- Monkey bars: horizontal ladder structure
- Painted lines on ground: thin colored Parts

DETAILS (5-8 parts):
- Bicycle rack: zigzag metal Parts near entrance
- School bus parked nearby (see Vehicles)
- Dumpster enclosure: 3 wall Parts + dumpster
- Clock on facade: circular Part with hands
- Notice board near entrance

PRO vs AMATEUR:
- PRO: Regular window grid, playground equipment, flagpole, institutional proportions
- AMATEUR: Generic building, no playground, no school-specific elements

────────────────────────────────────────────────────────────────────────────────
1.15 HOSPITAL
────────────────────────────────────────────────────────────────────────────────
Part count: 50-75 | Difficulty: Medium-High

MAIN BUILDING (8-10 parts):
- Large multi-story block: Part 50×48×30 (4 floors)
- Material: Concrete, Color3.fromRGB(230,228,222) — clean white/cream
- Floor bands: horizontal Parts every 12 studs, slightly recessed
- Central taller section (6 floors) for core areas

EMERGENCY ENTRANCE (6-8 parts):
- Large portico/canopy: Part 15×6×10, Concrete with red cross detail
- Wide automatic doors: Part 8×7×0.15, Glass, Transparency 0.6
- "EMERGENCY" sign: Part with red glow, Color3.fromRGB(255,0,0)
- Ambulance bay: covered drive-through area
- Ramp access: angled Part instead of steps

WINDOWS (10-15 parts):
- Ribbon windows (long horizontal bands): Part 40×3×0.15 per floor
- Tinted glass: Color3.fromRGB(120,150,170) Transparency 0.4
- Concrete spandrel panels between window bands

HELIPAD (4-6 parts):
- Flat circle on roof: Cylinder 12×0.3×12, Concrete, Color3.fromRGB(180,180,180)
- Large H marking: 2 Parts forming H, Color3.fromRGB(255,255,255)
- Circle border: ring of Parts, Color3.fromRGB(255,50,50)
- Landing lights: small glowing Parts at perimeter

ENTRANCE (5-7 parts):
- Main entrance separate from ER: glass revolving door area
- Large canopy/awning: flat Part extending out
- Drop-off circle drive: curved path Parts
- Information desk visible through glass: Part inside
- Wheelchair ramp: long gradual angled Part with railings

DETAILS (8-12 parts):
- Red cross on building: 2 red Parts forming plus sign
- Ambulances parked at ER (simplified vehicle shapes)
- Exhaust stacks on roof: cylinders
- Satellite/communication dishes: circle Parts
- Garden area: green Parts with bench
- Parking garage attached: multi-level ramp structure

PRO vs AMATEUR:
- PRO: Separate ER entrance, helipad, institutional scale, proper signage, clean materials
- AMATEUR: White box with red cross, no ER area, no helipad, residential scale


════════════════════════════════════════════════════════════════════════════════
 SECTION 2: VEHICLES (15 Types)
════════════════════════════════════════════════════════════════════════════════

────────────────────────────────────────────────────────────────────────────────
2.01 SEDAN
────────────────────────────────────────────────────────────────────────────────
Part count: 20-30 | Difficulty: Medium

BODY (5-7 parts):
- Lower body: Part 10×2.5×4.5, Metal, Color3.fromRGB(40,60,120) — dark blue
- Cabin/greenhouse: Part 6×2×4, Glass structure
- Hood: Part 3×0.3×4.3 angled slightly downward at front
- Trunk: Part 2.5×0.3×4.3, same as body color
- Front bumper: Part 4.6×0.8×0.4, Metal, Color3.fromRGB(30,30,30)
- Rear bumper: same dimensions

WHEELS (8 parts):
- 4 tires: Cylinder 0.8×1.2×1.2, Concrete, Color3.fromRGB(35,35,35) — rubber black
- 4 wheel rims: Cylinder 0.3×1×1 centered in tire, Metal, Color3.fromRGB(180,180,180)
- Wheels positioned at corners: offset 0.3 studs from body sides
- Front wheels at X offset -3.5 from center, rear at +3.5

GLASS (3-4 parts):
- Windshield: Part 4×2×0.15 angled 30 degrees from vertical, Glass, Transparency 0.6
- Rear window: similar but less angled
- Side windows: Part 3×1.5×0.15, Glass, Transparency 0.5

LIGHTS (4 parts):
- Headlights: 2 small Parts 0.8×0.6×0.15, Color3.fromRGB(255,255,220) — warm white
- Taillights: 2 small Parts 0.6×0.4×0.15, Color3.fromRGB(200,30,30) — red

DETAILS (4-6 parts):
- Side mirrors: 2 small Parts on stalks
- Door lines: thin Parts indicating door seams
- Grille: Part 2×1×0.2 with dark color, Metal
- License plate: tiny flat Part, Color3.fromRGB(240,240,240)
- Exhaust pipe: small cylinder underneath rear

PRO vs AMATEUR:
- PRO: Proper wheel placement, angled windshield, door seams, bumper detail
- AMATEUR: Rectangular box on cylinders, flat windshield, no details

────────────────────────────────────────────────────────────────────────────────
2.02 SPORTS CAR
────────────────────────────────────────────────────────────────────────────────
Part count: 25-35 | Difficulty: Medium-High

BODY (6-8 parts):
- Lower body: Part 11×1.8×5, Metal, Color3.fromRGB(200,30,30) — Ferrari red
- Body is WIDER and LOWER than sedan
- Cabin: Part 4×1.5×4.5 — compact, set back further
- Hood: long Part 5×0.5×4.8 with very gradual slope
- Rear deck: Part 3×0.8×4.8 — slight spoiler angle
- Side air intakes: 2 recessed Parts, Color3.fromRGB(30,30,30)
- Front splitter: thin Part 5.2×0.2×0.3, Carbon Fiber look (Metal, dark)

WHEELS (8 parts):
- Wider tires than sedan: Cylinder 1×1.4×1.4
- Larger rims: Cylinder 0.4×1.2×1.2, Metal, Color3.fromRGB(60,60,60) — dark alloy
- Rear wheels slightly wider than front

SPOILER (2-3 parts):
- Wing: Part 0.3×0.5×4.5, Metal, same as body color
- Wing supports: 2 thin vertical Parts connecting wing to trunk
- Subtle — not too large unless going for race car look

GLASS (2-3 parts):
- Windshield: Part 4×1.3×0.15, very steeply angled (nearly flat), Glass
- Rear window: small, also steeply angled
- No side rear windows (C-pillar is solid)

DETAILS (5-8 parts):
- Dual exhaust: 2 cylinder Parts at rear, Metal, Color3.fromRGB(100,100,100)
- Hood vents: 2 thin dark Parts on hood
- Side skirts: thin Parts along bottom edge
- Headlights: aggressive angular shapes, Color3.fromRGB(255,255,240)
- Taillights: thin horizontal strip, Color3.fromRGB(200,20,20)
- Diffuser: ribbed Part under rear bumper

PRO vs AMATEUR:
- PRO: Low wide stance, aggressive angles, proper proportions (long hood, short cabin)
- AMATEUR: Sedan painted red, too tall, wrong proportions

────────────────────────────────────────────────────────────────────────────────
2.03 PICKUP TRUCK
────────────────────────────────────────────────────────────────────────────────
Part count: 22-32 | Difficulty: Medium

BODY (5-7 parts):
- Cab: Part 5×4×5, Metal, Color3.fromRGB(50,50,55) — dark gray/black
- Bed: 5 Parts forming open box — floor + 2 sides + tailgate + front wall
- Bed floor: Part 6×0.3×4.8, Metal, Color3.fromRGB(70,70,70)
- Bed sides: Part 6×1.5×0.3 (2), same color
- Tailgate: Part 0.3×1.5×4.8
- Hood: Part 3×1.5×4.8 with slight downward angle

FRAME (2-3 parts):
- Higher ground clearance than sedan: 1.5 studs under body
- Frame rails: 2 long Parts running underneath, Metal, Color3.fromRGB(40,40,40)
- Step bars: 2 Parts along cab sides, Metal, Color3.fromRGB(100,100,100)

WHEELS (8 parts):
- Larger tires: Cylinder 1×1.8×1.8 — bigger than sedan
- Chunkier tread look: Concrete material, Color3.fromRGB(40,40,40)
- Rims: Metal, Color3.fromRGB(160,160,160)
- Visible wheel wells (fender flares): curved Parts over each wheel

GLASS (3 parts):
- Windshield: upright angle (less sloped than sedan), Glass
- Rear window: Part 4.5×2×0.15
- Side windows: Part 2×2×0.15

DETAILS (4-6 parts):
- Grille: Part 2.5×1.5×0.3, Metal with chrome look
- Bull bar (optional): thick metal bar across front
- Roof rack or light bar: horizontal Part on cab roof
- Tow hitch: small Part at rear under tailgate
- Mud flaps: thin Parts behind rear wheels

PRO vs AMATEUR:
- PRO: Open bed with visible floor, proper ride height, fender flares, rugged details
- AMATEUR: Van shape, closed bed, too low, no truck character

────────────────────────────────────────────────────────────────────────────────
2.04 BUS
────────────────────────────────────────────────────────────────────────────────
Part count: 25-35 | Difficulty: Medium

BODY (4-6 parts):
- Main body: Part 24×6×5, Metal, Color3.fromRGB(220,180,30) — school bus yellow
- For city bus: Color3.fromRGB(230,230,230) white with colored stripe
- Roof: Part 24×0.5×5.2 slightly wider, Metal, Color3.fromRGB(235,195,45)
- Front face: Part 0.5×6×5 with flat front
- Rear face: Part 0.5×6×5

WINDOWS (6-10 parts):
- Long rows of identical windows: Part 2×2.5×0.15 repeated along sides
- 8-10 windows per side, evenly spaced
- Glass, Color3.fromRGB(180,210,230) Transparency 0.5
- Window pillars between: thin Parts 0.3 wide, body color

WHEELS (8 parts):
- 4 large wheels (or 6 for realistic rear dual): Cylinder 1×2×2
- Dual rear wheels: 2 tires side by side at each rear position
- Wheel wells: dark recessed areas in body

DOORS (2-3 parts):
- Front folding door: Part 3×5×0.2, Glass in upper half
- Rear emergency door: Part 3×5×0.3, same body color
- Step well: recessed area at front door

DETAILS (5-8 parts):
- Stop sign arm (school bus): thin Part that folds out
- Headlights: 2 round-ish Parts, front
- Taillights: 2 red Parts, rear
- Front and rear bumpers: thick Parts, Metal, Color3.fromRGB(50,50,50)
- Destination sign: Part above windshield with SurfaceGui
- Mirrors: 2 large Parts on stalks from front
- Interior seats visible: rows of Parts through windows

PRO vs AMATEUR:
- PRO: Even window spacing, proper length-to-height ratio, dual rear wheels, mirrors
- AMATEUR: Yellow box, random windows, wrong proportions

────────────────────────────────────────────────────────────────────────────────
2.05 MOTORCYCLE
────────────────────────────────────────────────────────────────────────────────
Part count: 18-28 | Difficulty: High

FRAME (4-5 parts):
- Main frame: thin Parts forming triangle/diamond shape, Metal, Color3.fromRGB(30,30,30)
- Fork tubes: 2 thin cylinders angling from handlebars to front wheel
- Swingarm: Part connecting rear wheel to frame
- Frame tube diameter: 0.3-0.4 studs

ENGINE (3-4 parts):
- Engine block: Part 1.5×1.5×2, Metal, Color3.fromRGB(60,60,60)
- Exhaust pipes: 2 cylinders running from engine to rear, Metal, Color3.fromRGB(180,180,180) — chrome
- Exhaust tip: slightly wider cylinder at end

WHEELS (4 parts):
- 2 tires: Cylinder 0.6×2.5×2.5, Concrete, Color3.fromRGB(30,30,30)
- 2 rims: Cylinder 0.3×2.2×2.2 centered in tires, Metal
- Front wheel slightly thinner than rear

BODY (3-5 parts):
- Fuel tank: Part 2×1×1.2 on top of frame, Metal, Color3.fromRGB(180,20,20) — red
- Seat: Part 2.5×0.5×1, Concrete, Color3.fromRGB(25,25,25) — black leather
- Front fender: curved thin Part over front wheel
- Rear fender: similar over rear wheel
- Fairing (sport bike): larger shell Part around front, streamlined

CONTROLS (3-4 parts):
- Handlebars: Part 0.3×0.3×2.5, Metal, Color3.fromRGB(50,50,50)
- Grips: 2 small cylinders on handlebar ends
- Headlight: small Part 0.5×0.5, Color3.fromRGB(255,255,220)
- Taillight: tiny red Part

PRO vs AMATEUR:
- PRO: Visible frame structure, proper wheel size ratio, exhaust pipes, lean stance
- AMATEUR: Bicycle with a box engine, no frame visible, flat tires

────────────────────────────────────────────────────────────────────────────────
2.06 SAILBOAT
────────────────────────────────────────────────────────────────────────────────
Part count: 20-30 | Difficulty: Medium

HULL (4-6 parts):
- Main hull: Part 16×3×5 with wedge Parts at bow for pointed front
- Hull color: Metal, Color3.fromRGB(240,240,235) — white fiberglass
- Keel: thin Part 0.3×3×1 extending downward from center bottom
- Waterline stripe: thin colored Part at water level, Color3.fromRGB(30,60,120) — navy
- Bow wedge: 2 Parts angled inward meeting at front point
- Transom (flat rear): Part 0.3×3×5

DECK (3-4 parts):
- Deck surface: Part 14×0.3×4.5, Wood, Color3.fromRGB(180,155,110) — teak
- Cabin house: Part 6×2.5×3 centered on deck, same white as hull
- Cabin windows: small Glass Parts along cabin sides
- Cockpit: recessed area at stern (lower deck section)

MAST & RIGGING (4-6 parts):
- Main mast: thin cylinder 0.3×18×0.3, Metal, Color3.fromRGB(200,200,200) — aluminum
- Boom: cylinder 0.2×6×0.2 horizontal from mast, same material
- Main sail: thin Part 6×15×0.1 triangular (use wedge), Color3.fromRGB(250,248,240) — white canvas
- Jib sail: smaller triangular Part from bow to mast top
- Shrouds: very thin Parts (0.1) from mast top to deck sides

DETAILS (4-6 parts):
- Tiller/wheel: small Part at stern
- Winch drums: 2 small cylinders on deck
- Cleats: tiny Parts on deck edges
- Navigation light: small red/green Parts at bow
- Rudder: thin Part extending down from stern

PRO vs AMATEUR:
- PRO: Pointed bow, proper sail shape, visible rigging, teak deck, waterline stripe
- AMATEUR: Flat-bottomed box with rectangle sticking up, no bow shape

────────────────────────────────────────────────────────────────────────────────
2.07 SPEEDBOAT
────────────────────────────────────────────────────────────────────────────────
Part count: 18-25 | Difficulty: Medium

HULL (4-5 parts):
- V-hull: 2 angled Parts meeting at keel line, Metal, Color3.fromRGB(200,30,30) — red
- Sides: 2 Parts rising from hull edges, Color3.fromRGB(240,240,235) — white
- Bow: pointed wedge Part
- Transom: flat rear Part, Metal

DECK (3-4 parts):
- Forward deck: Part 5×0.3×4, Metal, Color3.fromRGB(240,240,235)
- Cockpit floor: recessed Part lower than deck
- Dashboard: angled Part in front of driver position, Metal, Color3.fromRGB(40,40,40)
- Windshield: curved-ish Part, Glass, Transparency 0.6

SEATING (2-3 parts):
- Captain's chair: Part 1.5×2×1.5 with back, Concrete, Color3.fromRGB(240,235,225)
- Passenger seat: same beside captain
- Rear bench: Part 4×1.5×1.5 across stern

ENGINE (3-4 parts):
- Outboard motor: box Part 1.5×2×1, Metal, Color3.fromRGB(40,40,45)
- Motor leg: thin Part extending down into water
- Propeller: small cross-shaped Part at bottom
- Or inboard with engine hump in cockpit

DETAILS (3-5 parts):
- Swim platform: Part 4×0.3×2 at stern, Wood
- Navigation lights: small colored Parts
- Grab handles: thin curved Parts, Metal, Color3.fromRGB(190,190,190)
- Cleat: small Part on bow deck
- Wake: optional white transparent Part behind boat

PRO vs AMATEUR:
- PRO: V-hull shape, proper bow point, windshield, engine detail
- AMATEUR: Flat rectangle floating on water, no hull shape

────────────────────────────────────────────────────────────────────────────────
2.08 HELICOPTER
────────────────────────────────────────────────────────────────────────────────
Part count: 22-32 | Difficulty: High

FUSELAGE (5-7 parts):
- Main body: Part 8×4×4, Metal, Color3.fromRGB(50,80,50) — military green (or red for rescue)
- Nose: wedge Part tapering forward and down, Glass cockpit
- Tail boom: Part 8×1.5×1.5 tapering rearward, same color
- Engine cowling: Part 3×2×3 on top behind rotor mast
- Cockpit glass: Part 3×2×3.5 wrap-around, Glass, Transparency 0.5

MAIN ROTOR (3-4 parts):
- Rotor hub: small cylinder 0.5×0.5 on top of mast
- Rotor mast: cylinder 0.3×1.5 from fuselage top
- Rotor blades: 2-4 long thin Parts 0.1×0.3×8, Metal, Color3.fromRGB(60,60,60)
- Blades droop slightly when stationary

TAIL ROTOR (2-3 parts):
- Vertical fin: Part 0.2×2×1.5, same as fuselage
- Tail rotor: small cross shape, Metal
- Horizontal stabilizer: Part 0.2×0.5×3, same color

LANDING SKIDS (4 parts):
- 2 skid tubes: long thin cylinder Parts 0.2×0.2×6, Metal, Color3.fromRGB(40,40,40)
- 2 cross tubes: connecting skids to fuselage, same material
- Skids sit below fuselage with 1.5 stud clearance

DETAILS (4-6 parts):
- Door: Part section that could slide open
- Step: small Part on skid cross tube
- Antenna: thin vertical Part on tail
- Searchlight: small Part under nose
- Exhaust: dark Part at rear of engine cowling
- Pitot tube: tiny Part on nose side

PRO vs AMATEUR:
- PRO: Tapered tail boom, proper skid landing gear, glass cockpit bubble, engine detail
- AMATEUR: Box with propeller on top, no tail rotor, no skids

────────────────────────────────────────────────────────────────────────────────
2.09 JET FIGHTER
────────────────────────────────────────────────────────────────────────────────
Part count: 25-35 | Difficulty: High

FUSELAGE (5-7 parts):
- Main body: Part 18×2.5×3, Metal, Color3.fromRGB(140,145,145) — military gray
- Nose cone: wedge Part tapering to point, same color
- Rear fuselage: slightly narrower Part leading to engine nozzle
- Spine (top ridge): thin Part 12×0.3×0.5 along top
- Intake ducts: 2 recessed Parts on sides or under nose, Color3.fromRGB(50,50,50)

WINGS (4-6 parts):
- 2 main wings: thin swept Parts 0.2×1×7 each, Metal, same gray
- Wing sweep angle: 30-40 degrees back from perpendicular
- Leading edge slats: thin Parts along wing front edge
- Wingtip missiles (optional): small cylinder Parts

TAIL (3-4 parts):
- Vertical stabilizer(s): Part 0.15×3×2 angled back, same gray
- For twin-tail: 2 stabilizers angled outward 15 degrees
- Horizontal stabilizers: 2 small swept Parts at tail

ENGINE (3-4 parts):
- Engine nozzle: cylinder Part 1.5×1.5 at rear, Metal, Color3.fromRGB(80,80,85)
- Afterburner ring: thin cylinder slightly larger, Metal, Color3.fromRGB(60,60,60)
- For twin engine: 2 nozzles side by side

COCKPIT (2-3 parts):
- Canopy: Part 3×1.5×2, Glass, Color3.fromRGB(180,200,220) Transparency 0.4
- Canopy frame: thin Parts along canopy edges
- HUD frame: tiny Part inside visible through canopy

DETAILS (4-6 parts):
- Hardpoints under wings: small pylon Parts
- Drop tanks: elongated cylinder Parts under wings
- Navigation lights: small colored Parts on wingtips
- Pitot tube: tiny Part extending from nose
- National insignia: colored SurfaceGui on fuselage/wings
- Landing gear (deployed): thin strut + wheel Parts folding down

PRO vs AMATEUR:
- PRO: Swept wings, twin tails, intake ducts, proper taper, weapon pylons
- AMATEUR: Tube with flat rectangles for wings, no taper, no cockpit canopy

────────────────────────────────────────────────────────────────────────────────
2.10 TRAIN (LOCOMOTIVE)
────────────────────────────────────────────────────────────────────────────────
Part count: 30-40 | Difficulty: Medium-High

BODY (6-8 parts):
- Long rectangular body: Part 30×6×5, Metal, Color3.fromRGB(45,45,120) — dark blue
- Nose section: wedge Part at front, angled and streamlined
- Cab/engineer section: rear Part 6×7×5 slightly taller
- Cab windows: Part 5×2×0.15, Glass, Transparency 0.5
- Roof: Part 30×0.5×5.2, Metal, slightly lighter

UNDERFRAME (4-6 parts):
- Frame: Part 30×1×4, Metal, Color3.fromRGB(40,40,40)
- Fuel tank: Part 8×1.5×3 under center, Metal, same dark
- Battery boxes: 2 box Parts under frame
- Coupler at each end: small protruding Part

WHEELS/TRUCKS (6-8 parts):
- 2 bogies (wheel trucks): Part 5×1×4 each
- Each bogie has 4-6 wheels: small cylinder Parts
- Wheels: Cylinder 0.4×1.5×1.5, Metal, Color3.fromRGB(80,80,80)
- Truck frames visible between wheels

DETAILS (6-10 parts):
- Headlights: 2-3 bright Parts on nose, Color3.fromRGB(255,255,200)
- Ditch lights: 2 Parts low on front
- Horn: 2 small cylinders on roof
- Exhaust stack: cylinder on top near rear
- Number boards: small Parts with SurfaceGui
- Handrails: thin Parts along body sides
- Dynamic brakes: grille Part on roof
- Warning stripes: yellow/black Parts on nose

TRACK (optional, 6-8 parts):
- 2 rails: thin long Parts, Metal, Color3.fromRGB(120,115,110)
- Ties/sleepers: repeated short Parts perpendicular to rails, WoodPlanks
- Ballast: flat Part under ties, Concrete, Color3.fromRGB(130,125,120)

PRO vs AMATEUR:
- PRO: Detailed underframe, proper bogies, horn, headlights, number boards
- AMATEUR: Blue rectangle on wheels, no underframe, no cab detail

────────────────────────────────────────────────────────────────────────────────
2.11 HOT AIR BALLOON
────────────────────────────────────────────────────────────────────────────────
Part count: 15-22 | Difficulty: Medium

ENVELOPE (5-8 parts):
- Main balloon: large sphere mesh Part 16×20×16
- Material: Fabric or Neon for colorful look
- Use 4-8 vertical stripe Parts (each a sphere section) for color panels
- Colors: alternating bright — Color3.fromRGB(220,50,50), Color3.fromRGB(255,200,30),
  Color3.fromRGB(50,130,200), Color3.fromRGB(50,180,50)
- Crown (top): slightly darker circular Part
- Throat (bottom opening): dark circle Part, Color3.fromRGB(40,30,20)

BASKET (4-6 parts):
- Wicker basket: Part 4×3×4, WoodPlanks, Color3.fromRGB(170,130,70) — wicker brown
- Basket rim: thin Part around top edge, slightly lighter
- Basket floor: Part 3.8×0.3×3.8
- Padded bumper rail: Part around outside top edge

RIGGING (3-4 parts):
- 4 suspension cables: thin Parts from basket corners to envelope equator
- Cable color: Metal, Color3.fromRGB(150,150,150)
- Burner frame: small Part structure above basket
- Burner: small Part with orange glow (optional PointLight)

DETAILS (2-3 parts):
- Sandbags: small Parts hanging from basket sides
- Banner/flag trailing from basket
- Propane tanks: 2 small cylinders in basket

PRO vs AMATEUR:
- PRO: Multi-colored panels, visible rigging, wicker texture basket, proper proportions
- AMATEUR: Sphere on top of box, no rigging, single color, wrong scale

────────────────────────────────────────────────────────────────────────────────
2.12 SPACESHIP
────────────────────────────────────────────────────────────────────────────────
Part count: 30-45 | Difficulty: High

HULL (6-8 parts):
- Main fuselage: Part 20×4×6, Metal, Color3.fromRGB(180,185,190) — sleek silver
- Nose: wedge or cone Part tapering forward
- Cockpit section: glass bubble Part, Glass, Color3.fromRGB(150,190,220) Transparency 0.4
- Hull plating: slightly offset panels for detail (0.1 stud gaps between sections)
- Belly: Part slightly darker, Color3.fromRGB(120,125,130)

WINGS/FINS (4-6 parts):
- 2 swept wings: Part 0.15×1.5×8 each, angled back
- Wing material: Metal, matching hull
- 2 vertical stabilizers: Parts angled outward, Color3.fromRGB(160,165,170)
- Wing-mounted engines: cylinder Parts at wing tips

ENGINES (4-6 parts):
- Main engine nozzles: 2-3 cylinders at rear, Metal, Color3.fromRGB(90,90,95)
- Engine glow: inner Part with Neon material, Color3.fromRGB(50,150,255) — blue thrust
- Engine housing: slightly larger cylinder around each nozzle
- Thrust vectoring fins: small Parts around nozzle openings

DETAILS (8-12 parts):
- Landing gear: 3 strut + pad assemblies
- Antenna array: thin Parts on top
- Running lights: small colored Parts (red port, green starboard)
- Hull panel lines: very thin Parts creating seam details
- Weapon hardpoints (optional): small Parts under wings
- Shield emitter (sci-fi): dome Part on hull
- Cargo bay doors: Part seams visible on belly
- Registration number: SurfaceGui on hull side

PRO vs AMATEUR:
- PRO: Panel line detail, engine glow, proper aerodynamic shaping, landing gear
- AMATEUR: Simple rocket shape, no detail, no panel lines, no engine glow

────────────────────────────────────────────────────────────────────────────────
2.13 MONSTER TRUCK
────────────────────────────────────────────────────────────────────────────────
Part count: 22-30 | Difficulty: Medium

BODY (4-5 parts):
- Pickup truck body (lifted): Part 8×3×5, Metal, Color3.fromRGB(255,140,0) — orange/flame
- Body sits HIGH — 4+ studs off ground on suspension
- Hood: Part 3×0.5×4.8 with aggressive scoop (raised Part on hood)
- Cab: Part 4×3×4.5

SUSPENSION (4-6 parts):
- 4 long-travel shocks: Parts angled from axle to body, Metal, Color3.fromRGB(190,190,190)
- Front axle beam: Part 0.5×0.5×5.5, Metal
- Rear axle beam: same
- Suspension links: thin Parts connecting axles to body

WHEELS (8 parts):
- MASSIVE tires: Cylinder 1.5×4×4 — key feature is they're enormous
- Material: Concrete, Color3.fromRGB(35,35,35)
- Deep tread look: slightly smaller cylinder inside for tread depth
- Rims: Cylinder 0.8×3×3, Metal, Color3.fromRGB(200,200,200) — chrome
- Tires are nearly as tall as the body

DETAILS (4-6 parts):
- Roll cage: visible bar structure inside cab, Metal, Color3.fromRGB(200,200,200)
- Exhaust stacks: 2 vertical cylinders behind cab
- Light bar on roof: Part with multiple bright small Parts
- Bumper guard: thick tube Part at front
- Flame decals: colored Parts on body sides (red/orange gradient)
- Flag on antenna: thin Part on whip antenna

PRO vs AMATEUR:
- PRO: Tires proportionally massive, high suspension travel, roll cage, exhaust stacks
- AMATEUR: Normal truck with slightly bigger wheels, no suspension visible

────────────────────────────────────────────────────────────────────────────────
2.14 FIRE TRUCK
────────────────────────────────────────────────────────────────────────────────
Part count: 30-40 | Difficulty: Medium-High

CAB (5-6 parts):
- Cab body: Part 6×5×5, Metal, Color3.fromRGB(200,25,25) — fire engine red
- Windshield: Part 5×3×0.15, Glass, Transparency 0.5
- Cab roof: Part with light bar on top
- Chrome bumper: Part 5.2×1×0.5, Metal, Color3.fromRGB(200,200,200)
- Grille: Part 2.5×1.5×0.3, Metal, Color3.fromRGB(190,190,190)

BODY (5-7 parts):
- Equipment bay: Part 12×4×5, same red
- Compartment doors: 4-6 Parts with handle details, slightly darker red
- Diamond plate steps: Part 0.5×0.3×5, Metal, Color3.fromRGB(170,170,170)
- Pump panel: Part 0.3×3×3 on side, Metal with gauges

LADDER (4-6 parts):
- Ladder bed/turntable: Part 10×1×3 on top of body
- Extended ladder: 2 long side Parts + many rungs, Metal, Color3.fromRGB(190,190,190)
- Ladder tilt mechanism: Part at base of ladder
- Ladder stored flat on top, can be shown extended at angle

LIGHTS (4-6 parts):
- Light bar: Part 4×1×2 on cab roof with red/blue Parts
- Warning lights: red Parts along body sides
- Headlights: white Parts
- Scene lights: Parts on upper body sides, Color3.fromRGB(255,255,240)

DETAILS (6-8 parts):
- Hose reel: cylinder Part on rear, Color3.fromRGB(200,180,30) — yellow hose
- Water cannon on top (optional): small turret Part
- Siren: small Part on cab roof
- Axes mounted on sides: small Parts in brackets
- Warning stripes: diagonal yellow/red Parts on rear
- FIRE DEPT lettering: SurfaceGui on doors

PRO vs AMATEUR:
- PRO: Equipment compartments, ladder detail, light bar, chrome bumper, proper red
- AMATEUR: Red truck, no ladder, no equipment detail

────────────────────────────────────────────────────────────────────────────────
2.15 POLICE CAR
────────────────────────────────────────────────────────────────────────────────
Part count: 22-30 | Difficulty: Medium

BODY (5-7 parts):
- Sedan body base: Part 10×2.5×4.5, Metal, Color3.fromRGB(20,20,25) — black and white scheme
- Upper body (above beltline): Color3.fromRGB(240,240,240) — white
- Lower body: Color3.fromRGB(25,25,30) — black
- Hood/trunk: matching two-tone
- Door panels: Parts showing black/white boundary

LIGHT BAR (4-5 parts):
- Bar housing: Part 3×0.8×1.5 on roof, Metal, Color3.fromRGB(40,40,40)
- Red lights: 2 Parts, Color3.fromRGB(255,20,20) with Neon material
- Blue lights: 2 Parts, Color3.fromRGB(30,30,255) with Neon material
- Clear center light: Part, Color3.fromRGB(255,255,240)

PUSH BAR (2-3 parts):
- Front push bumper: thick tube Part, Metal, Color3.fromRGB(40,40,40)
- Brush guard: slightly wider frame around front
- Mounted to front bumper

DETAILS (6-8 parts):
- Spotlight on driver A-pillar: small cylinder Part, Color3.fromRGB(200,200,200)
- Antenna: thin vertical Part on trunk
- POLICE lettering: SurfaceGui on doors and trunk
- Badge/shield: small colored Part on doors
- Steel wheels (not alloy): simple Metal cylinders
- Partition visible through rear window: dark Part inside
- Shotgun rack hint visible inside (dark Part)
- Rear window cage: dark grid Part

PRO vs AMATEUR:
- PRO: Two-tone paint, light bar with correct colors, push bar, spotlight, lettering
- AMATEUR: Black car with blue box on top, no two-tone, no push bar


════════════════════════════════════════════════════════════════════════════════
 SECTION 3: FURNITURE (20 Types)
════════════════════════════════════════════════════════════════════════════════

────────────────────────────────────────────────────────────────────────────────
3.01 DINING TABLE
────────────────────────────────────────────────────────────────────────────────
Part count: 8-12 | Size: 8×3×4 studs

TABLE TOP: Part 8×0.4×4, Wood, Color3.fromRGB(150,100,55) — medium brown
LEGS: 4 Parts each 0.5×2.5×0.5, Wood, Color3.fromRGB(130,85,45) — darker
Legs inset 0.5 studs from edges. Height from ground to top surface = 3 studs.
APRON (frame under top): 4 thin Parts connecting legs under tabletop, 0.3 tall
Optional: table runner Part 6×0.05×1.5 on top, Fabric, Color3.fromRGB(140,30,30)
Optional: place settings — small flat Parts for plates, tiny Parts for utensils
PRO TIP: Real tables have an apron (the frame between legs). Without it, looks like a board on sticks.

────────────────────────────────────────────────────────────────────────────────
3.02 OFFICE DESK
────────────────────────────────────────────────────────────────────────────────
Part count: 10-15 | Size: 6×3×3 studs

DESKTOP: Part 6×0.3×3, Wood, Color3.fromRGB(170,140,100) — light oak
PANEL LEGS: 2 Parts each 0.3×2.5×2.8 (solid side panels, not stick legs)
Color: same wood or Metal, Color3.fromRGB(80,80,85)
MODESTY PANEL: Part 5×2×0.2 across back between legs (hides legs from front)
DRAWER UNIT: Part 1.5×2×2.5 on one side, slightly inset. 3 drawer faces (thin Parts).
Drawer handles: 3 tiny Parts 0.5×0.1×0.1, Metal, Color3.fromRGB(160,160,160)
CABLE GROMMET: small cylinder Part in desktop corner, Color3.fromRGB(50,50,50)
MONITOR: thin Part 3×2×0.15 on desktop + small stand Part (see Props)
KEYBOARD: flat Part 2×0.1×0.8 in front of monitor
PRO TIP: Office desks have panel legs or pedestals, not stick legs. Add a keyboard tray Part.

────────────────────────────────────────────────────────────────────────────────
3.03 KING BED
────────────────────────────────────────────────────────────────────────────────
Part count: 10-16 | Size: 7×3.5×8 studs

FRAME: Part 7×1×8, Wood, Color3.fromRGB(100,65,35) — dark wood
MATTRESS: Part 6.5×1.2×7.5 sitting on frame, Fabric, Color3.fromRGB(240,235,225) — white
HEADBOARD: Part 7×3×0.5, Wood, Color3.fromRGB(90,58,30) — matches frame
Headboard can be ornate: add panel detail Parts or curved top
FOOTBOARD: Part 7×1.5×0.5, same wood, shorter than headboard
PILLOWS: 2-3 Parts 2×1×1.5, Fabric, Color3.fromRGB(245,240,230)
DUVET/COMFORTER: Part 6.3×0.5×5 covering lower 2/3 of mattress
Duvet color: Color3.fromRGB(70,90,120) — navy blue or any accent color
SHEET FOLD: thin Part visible at duvet edge, white
LEGS: 4 small Parts 0.5×0.5×0.5 under corners, Wood
PRO TIP: Bedding layers (sheet, duvet, pillows) are what make beds look real. A mattress alone looks bare.

────────────────────────────────────────────────────────────────────────────────
3.04 BUNK BED
────────────────────────────────────────────────────────────────────────────────
Part count: 14-20 | Size: 4×7×8 studs

FRAME: 4 vertical posts Part 0.5×7×0.5, Wood, Color3.fromRGB(160,130,80)
LOWER BED: Part 3.5×0.3×7 at 1.5 studs height, Wood
UPPER BED: Part 3.5×0.3×7 at 4.5 studs height, Wood
SIDE RAILS: horizontal Parts connecting posts at bed levels, 0.3×0.3
UPPER GUARD RAIL: Part 0.3×1×7 along open side of upper bed
LADDER: 2 vertical thin Parts + 4 horizontal rungs on one end, Wood
LOWER MATTRESS: Part 3.3×0.8×6.8, Fabric, Color3.fromRGB(240,235,225)
UPPER MATTRESS: same dimensions
PILLOWS: 2 Parts, one per bed
BLANKETS: 2 thin Parts covering each mattress
PRO TIP: Guard rail on upper bunk is essential. Ladder can be at end or side.

────────────────────────────────────────────────────────────────────────────────
3.05 SOFA
────────────────────────────────────────────────────────────────────────────────
Part count: 8-12 | Size: 8×3.5×3.5 studs

SEAT CUSHIONS: 3 Parts each 2.5×0.8×2.5, Fabric, Color3.fromRGB(80,90,110) — blue-gray
BACK CUSHIONS: 3 Parts each 2.5×1.5×0.8 behind seat, same color
FRAME BASE: Part 8×1×3.5, Wood or hidden, Color3.fromRGB(60,50,40) — dark
ARMRESTS: 2 Parts each 0.8×2×3, same fabric as cushions
FEET: 4-6 small Parts 0.4×0.5×0.4, Wood, Color3.fromRGB(80,55,30)
Optional THROW PILLOW: 1 Part 1.2×1.2×0.5 in accent color, Color3.fromRGB(200,160,50)
Optional THROW BLANKET: thin draped Part over armrest
PRO TIP: Individual cushion segments (not one flat slab) make sofas look real. Slightly different depths per cushion.

────────────────────────────────────────────────────────────────────────────────
3.06 ARMCHAIR
────────────────────────────────────────────────────────────────────────────────
Part count: 7-10 | Size: 3.5×3.5×3 studs

SEAT: Part 3×0.8×2.5, Fabric, Color3.fromRGB(120,50,30) — leather brown
BACK: Part 3×2×0.8 angled slightly backward (5-10 degrees), same color
ARMS: 2 Parts each 0.6×1.5×2.5, same fabric
LEGS: 4 Parts 0.3×0.5×0.3, Wood, Color3.fromRGB(60,40,25)
SEAT CUSHION: Part 2.8×0.4×2.3, slightly lighter shade
BACK CUSHION: Part 2.5×1.5×0.4, same lighter shade
Optional BUTTON TUFTING: tiny Parts on back for Chesterfield look
PRO TIP: Armchair back should angle backward slightly. Arms should be lower than back top.

────────────────────────────────────────────────────────────────────────────────
3.07 BAR STOOL
────────────────────────────────────────────────────────────────────────────────
Part count: 5-8 | Size: 1.5×4×1.5 studs

SEAT: Cylinder 0.6×1.5×1.5, Fabric or Metal, Color3.fromRGB(40,40,40) — black
STEM: Cylinder 0.3×3×0.3, Metal, Color3.fromRGB(180,180,180) — chrome
BASE: Cylinder 0.3×1.5×1.5, Metal, Color3.fromRGB(160,160,160) — flat disc
FOOTREST RING: Torus or thin cylinder at 1.5 studs height, Metal
Optional BACK REST: small curved Part 1.5×1×0.2 behind seat
Optional PADDING: slightly wider Part on seat top, Fabric
PRO TIP: The single stem + disc base is the modern look. For rustic, use 4 angled legs.

────────────────────────────────────────────────────────────────────────────────
3.08 BOOKSHELF
────────────────────────────────────────────────────────────────────────────────
Part count: 12-20 | Size: 5×7×1.5 studs

FRAME: 2 side panels Part 0.3×7×1.5, Wood, Color3.fromRGB(130,85,45)
TOP: Part 5×0.3×1.5, same wood
BACK PANEL: Part 4.4×7×0.15, slightly darker wood
SHELVES: 4 Parts each 4.4×0.3×1.3 at 1.5-stud intervals
BOOKS: clusters of thin Parts varying in height (1-1.5 studs tall) and color
  - Part 0.2×1.2×1, various colors: blues, reds, greens, browns
  - Group 3-5 books leaning together per shelf section
  - Some books laid flat, some standing
  - Leave some gaps (not fully packed)
Optional BOOKEND: small L-shaped Part at end of a row
Optional DECORATIVE ITEM: small vase or frame Part on one shelf
PRO TIP: Books should be various heights and colors, with some gaps. A fully uniform bookshelf looks fake.

────────────────────────────────────────────────────────────────────────────────
3.09 WARDROBE
────────────────────────────────────────────────────────────────────────────────
Part count: 10-14 | Size: 5×8×2 studs

BODY: Part 5×8×2, Wood, Color3.fromRGB(145,100,55)
DOORS: 2 Parts each 2.4×7.5×0.2 on front face, slightly lighter wood
Door handles: 2 thin Parts 0.1×0.8×0.1, Metal, Color3.fromRGB(170,140,50) — brass
CROWN MOLDING: Part 5.3×0.5×2.3 on top, slightly ornate, same wood
BASE MOLDING: Part 5.2×0.5×2.2 at bottom
FEET: 4 small ball Parts or bracket shapes, Wood
INTERIOR (if doors open): hanging rod (cylinder) + shelf Part
Optional MIRROR: Part 1.5×4×0.1 on one door, Glass, Transparency 0.3
PRO TIP: Crown and base molding transform a box into furniture. Door handles should be at 3.5 studs height.

────────────────────────────────────────────────────────────────────────────────
3.10 DRESSER
────────────────────────────────────────────────────────────────────────────────
Part count: 10-16 | Size: 5×4×2 studs

BODY: Part 5×3.5×2, Wood, Color3.fromRGB(180,145,100) — light oak
DRAWER FRONTS: 4 rows of Parts stacked vertically, each 4.6×0.7×0.15, slightly lighter
DRAWER HANDLES: 8 small Parts (2 per drawer), Metal, Color3.fromRGB(160,160,160)
TOP: Part 5.2×0.3×2.2 — slightly overhangs body
LEGS: 4 small Parts, Wood
BACK PANEL: Part 4.8×3.3×0.15, thin plywood, darker
Optional ITEMS ON TOP: mirror Part, small box Parts, lamp
PRO TIP: Each drawer front should be a separate Part with tiny gap between drawers.

────────────────────────────────────────────────────────────────────────────────
3.11 TV STAND
────────────────────────────────────────────────────────────────────────────────
Part count: 8-12 | Size: 8×2.5×2 studs

TOP SURFACE: Part 8×0.3×2, Wood, Color3.fromRGB(50,45,40) — dark walnut
LEGS/SUPPORTS: either 4 angled legs (mid-century) or panel sides
For mid-century: 4 Parts angled outward, Wood, Color3.fromRGB(120,80,40)
SHELF: Part 7×0.3×1.8 at 0.8 studs height, same dark wood
BACK PANEL: Part 7.5×2×0.15
TV ON TOP: Part 6×3.5×0.2 standing on thin stand Part, Color3.fromRGB(20,20,20)
TV screen: SurfaceGui or Glass front, Color3.fromRGB(30,30,35)
CABLE BOX/CONSOLE: small Part on shelf
REMOTE: tiny flat Part on top surface
PRO TIP: TV should be proportionally correct — wider than tall, very thin, on a small stand or mount.

────────────────────────────────────────────────────────────────────────────────
3.12 PIANO (UPRIGHT)
────────────────────────────────────────────────────────────────────────────────
Part count: 12-18 | Size: 5×5×2 studs

BODY: Part 5×4.5×2, Wood, Color3.fromRGB(25,20,15) — glossy black
TOP LID: Part 5×0.2×2 — can be shown open (angled) or closed
KEYBOARD AREA: Part 4.5×0.3×1 at 3 stud height, Color3.fromRGB(240,235,225) — ivory white
BLACK KEYS: thin Part 3×0.2×0.5 behind white keys, Color3.fromRGB(15,15,15)
MUSIC STAND: thin Part 4×1.5×0.15 angled above keyboard, Wood, matching body
FALLBOARD (key cover): thin Part that covers keys when closed
PEDALS: 2-3 small Parts at base, Metal, Color3.fromRGB(170,140,50) — brass
LEGS: 2 thick Parts on sides, or 4 legs, matching body
BENCH: separate piece — Part 3×1.8×1, with padded top Part, Fabric, Color3.fromRGB(25,25,25)
PRO TIP: The keyboard should be recessed slightly into the body, not flush with the front face.

────────────────────────────────────────────────────────────────────────────────
3.13 POOL TABLE
────────────────────────────────────────────────────────────────────────────────
Part count: 12-18 | Size: 9×3.5×5 studs

BED (playing surface): Part 8×0.3×4, Fabric, Color3.fromRGB(30,100,50) — green felt
RAILS (cushions): 4 Parts forming frame around bed, 0.5 stud wide, 0.3 tall
Rail material: Wood, Color3.fromRGB(80,45,25) — dark mahogany
POCKETS: 6 dark circle Parts (4 corners + 2 midway on long sides)
Color3.fromRGB(20,20,20), recessed slightly
LEGS: 6 thick Parts (4 corners + 2 center support), Wood, Color3.fromRGB(70,40,20)
Leg height: 2.5 studs
BALL RETURN: thin Part channel under table connecting pockets
BALLS: 16 small sphere Parts on table surface, various colors
CUE RACK: wall-mounted Part holding 4 thin cylinder Parts (cues)
Triangle rack: triangular frame Part near balls
LIGHT: overhead rectangular Part with downward light, hanging from ceiling
PRO TIP: Rails must be visible above the playing surface. Without raised rails, it's just a green table.

────────────────────────────────────────────────────────────────────────────────
3.14 BATHTUB
────────────────────────────────────────────────────────────────────────────────
Part count: 8-12 | Size: 6×2.5×3 studs

TUB BODY: Part 6×2×3, Concrete, Color3.fromRGB(245,242,235) — porcelain white
TUB INTERIOR: Part 5.5×1.8×2.5, same but recessed (or just darken slightly)
RIM: thin Part around top edge, 0.2 stud wide, same white
FEET (clawfoot style): 4 ornate small Parts, Metal, Color3.fromRGB(170,140,50) — brass
Or BUILT-IN: no feet, sits flush with floor
FAUCET: small assembly of Parts — 2 handles + spout
  Spout: curved Part or cylinder, Metal, Color3.fromRGB(190,190,190) — chrome
  Handles: 2 small cross-shaped Parts
DRAIN: tiny dark circle Part at bottom
BATH MAT: flat Part beside tub, Fabric, Color3.fromRGB(200,200,200)
Optional SHOWER CURTAIN: thin tall Part on rod (cylinder), Fabric, Color3.fromRGB(230,230,225)
PRO TIP: Clawfoot tubs are more visually interesting than built-in. Faucet assembly is the key detail.

────────────────────────────────────────────────────────────────────────────────
3.15 TOILET
────────────────────────────────────────────────────────────────────────────────
Part count: 6-9 | Size: 2×3×2.5 studs

BOWL: Part 2×1.5×2 with rounded front (use sphere mesh or just box), Concrete, Color3.fromRGB(245,242,235)
TANK: Part 1.5×2×0.8 at rear, sitting higher than bowl, same white
LID: Part 1.8×0.1×1.8 on top of bowl, same white
SEAT: Part 1.8×0.1×1.5 under lid, same white (or show slightly darker ring)
FLUSH HANDLE: tiny Part on tank side, Metal, Color3.fromRGB(190,190,190)
BASE: Part 2×0.5×2.2 flared at floor, same white
SUPPLY LINE: thin Part from wall to tank, Metal
TOILET PAPER HOLDER: small bracket Part on nearby wall + cylinder roll Part
PRO TIP: Tank sits higher than bowl. The base flares slightly where it meets the floor.

────────────────────────────────────────────────────────────────────────────────
3.16 KITCHEN SINK
────────────────────────────────────────────────────────────────────────────────
Part count: 8-12 | Size: 4×3.5×2.5 studs

COUNTER: Part 4×0.4×2.5, Concrete, Color3.fromRGB(200,195,185) — granite look
BASIN: Part 3×1×2, recessed into counter, Metal, Color3.fromRGB(190,190,195) — stainless
For double basin: 2 Parts side by side with divider
CABINET BELOW: Part 3.8×2.5×2.3, Wood, Color3.fromRGB(240,235,225) — white painted
Cabinet doors: 2 Parts with small handle Parts
FAUCET: tall curved Part (gooseneck), Metal, Color3.fromRGB(195,195,195)
HANDLES: 2 small Parts flanking faucet base
BACKSPLASH: Part 4×1.5×0.2 behind sink, Concrete, Color3.fromRGB(235,230,220) — tile
DISH RACK: small wire-frame Part beside sink (optional)
PRO TIP: Gooseneck faucet (tall curved) is modern. Two-handle is traditional. The backsplash ties it to the wall.

────────────────────────────────────────────────────────────────────────────────
3.17 FRIDGE (REFRIGERATOR)
────────────────────────────────────────────────────────────────────────────────
Part count: 8-12 | Size: 3×7×3 studs

BODY: Part 3×7×3, Metal, Color3.fromRGB(230,230,235) — white or stainless
UPPER DOOR (freezer): Part 2.8×2.5×0.2, same color, subtle seam line
LOWER DOOR (fridge): Part 2.8×4×0.2, same color
HANDLES: 2 vertical Parts 0.1×1.5×0.2, Metal, Color3.fromRGB(190,190,190) — matching
DOOR SEAM: thin dark line Part between upper and lower doors
TOP: Part 3.1×0.2×3.1, slightly overhangs
FEET: 2 thin Parts at front bottom for leveling
HINGE SIDE: thin Parts on one side representing hinges
Optional ICE DISPENSER: small recessed Part on upper door, Color3.fromRGB(40,40,45)
Optional MAGNETS/NOTES: tiny colored Parts on door face
PRO TIP: French door (2 narrow doors) is trendy. Side-by-side split is also an option. Handle style defines the era.

────────────────────────────────────────────────────────────────────────────────
3.18 WASHING MACHINE
────────────────────────────────────────────────────────────────────────────────
Part count: 7-10 | Size: 2.5×3.5×2.5 studs

BODY: Part 2.5×3.5×2.5, Metal, Color3.fromRGB(235,235,240) — white
FRONT DOOR: Cylinder 0.2×2×2 centered on front face, Glass frame
DOOR GLASS: Cylinder 0.1×1.5×1.5 inside door frame, Glass, Transparency 0.5, tinted gray
CONTROL PANEL: Part 2.3×0.8×0.3 at top-front, Color3.fromRGB(200,200,205)
KNOB: small cylinder on control panel, Color3.fromRGB(180,180,180)
BUTTONS: 2-3 tiny Parts on panel
FEET: 4 small Parts at corners, Concrete, Color3.fromRGB(50,50,50) — rubber
LID (top-loader alternative): Part 2.3×0.15×2.3 on top with hinge detail
PRO TIP: Front-loader has a circular glass door. Top-loader has a lift-up lid. The control panel placement differs.

────────────────────────────────────────────────────────────────────────────────
3.19 GRANDFATHER CLOCK
────────────────────────────────────────────────────────────────────────────────
Part count: 12-18 | Size: 2.5×8×1.5 studs

BODY COLUMN: Part 2×5×1.2, Wood, Color3.fromRGB(100,60,30) — rich dark wood
HOOD (top): Part 2.5×2×1.5 wider than column, ornate, same wood
HOOD CROWN: decorative Part on top (arched or triangular pediment)
CLOCK FACE: Cylinder 0.1×1.5×1.5 on hood front, Color3.fromRGB(240,235,210) — cream
CLOCK HANDS: 2 thin Parts (hour shorter, minute longer), Color3.fromRGB(20,20,20)
GLASS DOOR: Part 1.5×3×0.1 on column front, Glass, Transparency 0.5
PENDULUM: visible through glass — thin vertical Part + disc Part at bottom
  Pendulum disc: Cylinder, Metal, Color3.fromRGB(170,140,50) — brass
BASE: Part 2.5×1.5×1.5 wider section at bottom, same wood
DECORATIVE TRIM: Parts at transitions between sections (column caps)
FINIALS: 3 small turned Parts on top (spheres or spires)
PRO TIP: Three sections (hood, column, base) with transitions between them. Pendulum visible through glass is essential.

────────────────────────────────────────────────────────────────────────────────
3.20 ROCKING CHAIR
────────────────────────────────────────────────────────────────────────────────
Part count: 8-12 | Size: 2.5×4×3 studs

SEAT: Part 2.5×0.3×2.5, Wood, Color3.fromRGB(140,95,50)
BACK: Part 2.5×2.5×0.3, same wood — can be solid or slatted (3-5 vertical thin Parts)
ARMS: 2 Parts each 0.3×0.5×2.5, curving from back to front
ROCKERS: 2 curved Parts (arc shape) on bottom — Part 0.3×0.5×3.5 with slight curve
  If no mesh: use 3 small Parts per rocker arranged in a slight arc
  Color: slightly darker wood, Color3.fromRGB(120,80,40)
LEGS: 4 vertical Parts 0.3×1.5×0.3 connecting seat to rockers
BACK SLATS (if slatted): 3-5 thin vertical Parts in back area
OPTIONAL CUSHION: Part on seat, Fabric, Color3.fromRGB(180,50,50) — red accent
PRO TIP: Rockers curve front and back equally. Chair tips back about 5 degrees from vertical when at rest.


════════════════════════════════════════════════════════════════════════════════
 SECTION 4: WEAPONS (10 Types)
════════════════════════════════════════════════════════════════════════════════

────────────────────────────────────────────────────────────────────────────────
4.01 LONGSWORD
────────────────────────────────────────────────────────────────────────────────
Part count: 5-8 | Total length: 5 studs

BLADE: Part 0.2×3.5×0.6, Metal, Color3.fromRGB(200,200,205) — polished steel
  Blade tapers: tip section slightly narrower (second Part 0.15×1×0.4)
FULLER (blood groove): thin Part 0.05×2.5×0.15 centered on blade, slightly darker
CROSSGUARD: Part 2×0.3×0.2, Metal, Color3.fromRGB(170,140,50) — brass/gold
GRIP: Part 0.3×1.2×0.3, Wood or Fabric, Color3.fromRGB(60,35,20) — leather brown
POMMEL: small sphere or cylinder Part at grip end, Metal, Color3.fromRGB(170,140,50)
EDGE HIGHLIGHT: very thin Parts along blade edges, slightly brighter metal
PRO TIP: Crossguard width should be roughly blade-length / 1.5. Pommel balances the blade.

────────────────────────────────────────────────────────────────────────────────
4.02 KATANA
────────────────────────────────────────────────────────────────────────────────
Part count: 5-8 | Total length: 5 studs

BLADE: Part 0.15×3.5×0.5, Metal, Color3.fromRGB(210,210,215) — bright steel
  Slight curve: rotate blade Part 3-5 degrees
  Hamon line (temper line): thin Part along lower blade edge, slightly different shade
TSUBA (guard): flat disc Part 0.1×1×1, Metal, Color3.fromRGB(50,45,40) — iron
  Tsuba is round or square, NOT straight bar like European
TSUKA (handle): Part 0.4×1.5×0.4, Fabric, Color3.fromRGB(30,25,20) — dark wrapping
WRAPPING: thin angled Parts crossing over handle (diamond pattern)
KASHIRA (end cap): small Part at handle end, same metal as tsuba
SAYA (scabbard, optional): Part matching blade curve, WoodPlanks, Color3.fromRGB(20,15,15)
PRO TIP: Katana blades curve GENTLY. The tsuba is smaller than European crossguard. Handle is long (1/3 of total).

────────────────────────────────────────────────────────────────────────────────
4.03 BATTLE AXE
────────────────────────────────────────────────────────────────────────────────
Part count: 4-7 | Total length: 5 studs

HAFT (handle): Cylinder 0.3×4×0.3, Wood, Color3.fromRGB(110,75,40)
AXE HEAD: Part 0.2×2×1.5, Metal, Color3.fromRGB(160,160,165)
  Head shape: wider at cutting edge, narrower at haft attachment
  For double-headed: mirror head on both sides
BLADE EDGE: very thin Part along curved edge, Metal, Color3.fromRGB(200,200,205) — sharpened
SOCKET: small Part where head meets haft, Metal, Color3.fromRGB(100,100,105)
LEATHER WRAP: Part section on lower haft for grip, Fabric, Color3.fromRGB(70,45,25)
POMMEL: small ball Part at haft bottom, Metal
PRO TIP: Axe head attaches at the side of the haft, not centered. Blade edge should flare outward.

────────────────────────────────────────────────────────────────────────────────
4.04 WAR HAMMER
────────────────────────────────────────────────────────────────────────────────
Part count: 5-8 | Total length: 5 studs

HAFT: Cylinder 0.35×3.5×0.35, Wood, Color3.fromRGB(100,70,35)
HAMMER HEAD: Part 1×1×1.5, Metal, Color3.fromRGB(140,140,145) — dark steel
  Flat striking face on one side
SPIKE (back side): wedge Part 0.3×0.3×1 on opposite side from striking face
  For crow's beak style: curved spike
TOP SPIKE: small pointed Part extending upward from head
SOCKET/LANGETS: metal strips running down from head onto haft, Metal
GRIP WRAP: lower section of haft, Fabric, Color3.fromRGB(60,35,20)
POMMEL: heavy sphere Part for counterweight
PRO TIP: War hammers are NOT like claw hammers. The head is compact and heavy with a spike on the reverse.

────────────────────────────────────────────────────────────────────────────────
4.05 LONGBOW
────────────────────────────────────────────────────────────────────────────────
Part count: 4-7 | Total height: 6 studs

BOW STAVE: curved Part (or 3 Parts arranged in arc) 0.3×6×0.3
  Material: Wood, Color3.fromRGB(130,85,45)
  Curve is gentle, nearly straight when unstrung
STRING: very thin Part 0.05×5.5×0.05, connecting bow tips
  Color3.fromRGB(200,180,140) — natural fiber
BOW TIPS (nocks): 2 small Parts where string attaches, slightly reinforced
GRIP (handle section): Part 0.5×1×0.5 at center, Fabric wrap, Color3.fromRGB(50,30,18)
ARROW (if equipped): thin cylinder 0.1×4×0.1
  Arrowhead: tiny wedge Part, Metal, Color3.fromRGB(160,160,160)
  Fletching: 3 tiny fin Parts at back, Color3.fromRGB(200,200,195) — feather white
PRO TIP: The bow is approximately character height (5-6 studs). String should look taut.

────────────────────────────────────────────────────────────────────────────────
4.06 MAGIC STAFF
────────────────────────────────────────────────────────────────────────────────
Part count: 6-10 | Total height: 6 studs

SHAFT: Cylinder 0.3×5×0.3, Wood, Color3.fromRGB(80,50,25) — dark gnarled wood
  Shaft can twist: use 2-3 slightly offset cylinders for organic look
HEAD PIECE: ornate structure at top — fork, spiral, or claw holding orb
  Prongs: 3-4 curved thin Parts reaching upward, Wood, Color3.fromRGB(70,45,20)
CRYSTAL/ORB: sphere Part 0.8×0.8×0.8 held in prongs
  Material: Neon or Glass, Color3.fromRGB(100,50,200) — purple magic glow
  Add PointLight with same color
WRAPPING: spiral thin Part around mid-shaft, Fabric, Color3.fromRGB(120,90,160)
RUNES: optional small glowing Parts embedded in shaft
FOOT: small metal cap at bottom, Metal, Color3.fromRGB(140,140,145)
PRO TIP: The glowing orb/crystal is the focal point. It should emit light. Staff should look old and organic, not manufactured.

────────────────────────────────────────────────────────────────────────────────
4.07 SHIELD
────────────────────────────────────────────────────────────────────────────────
Part count: 5-9 | Size: 3×4×0.5 studs

FACE: Part 3×4×0.3 (kite shape, heater shape, or round)
  For kite: use wedge Parts forming pointed bottom
  Material: Metal, Color3.fromRGB(180,30,30) — red with heraldic design
RIM: thin Part border around face edge, Metal, Color3.fromRGB(170,140,50) — brass
BOSS (center dome): small hemisphere Part, Metal, Color3.fromRGB(180,180,185)
RIVETS: 4-8 tiny sphere Parts along rim, Metal
BACK: Part 2.8×3.8×0.1, Wood, Color3.fromRGB(130,90,50)
ARM STRAPS: 2 curved thin Parts on back, Fabric, Color3.fromRGB(60,35,20) — leather
HERALDIC DESIGN: colored Parts on face (cross, lion, chevron, etc.)
PRO TIP: Shield boss (center bump) is essential for medieval shields. Heraldic design using 3-5 colored Parts adds character.

────────────────────────────────────────────────────────────────────────────────
4.08 TRIDENT
────────────────────────────────────────────────────────────────────────────────
Part count: 5-8 | Total height: 6 studs

SHAFT: Cylinder 0.3×5×0.3, Metal or Wood, Color3.fromRGB(170,140,50) — gold/brass
CENTER PRONG: Part 0.15×1.5×0.15, Metal, Color3.fromRGB(190,160,60) — extends from shaft
SIDE PRONGS: 2 Parts angled outward 15 degrees from center, same color
  Prong tips: pointed (taper each Part)
  Side prongs slightly shorter than center (1.2 studs)
CROSS PIECE: Part connecting all 3 prong bases, same metal
GRIP: Part section on shaft, Fabric wrap or textured
BUTT CAP: small pointed Part at shaft bottom
PRO TIP: Prongs should curve slightly outward, not be perfectly straight parallel lines. Center prong is longest.

────────────────────────────────────────────────────────────────────────────────
4.09 CROSSBOW
────────────────────────────────────────────────────────────────────────────────
Part count: 7-11 | Size: 3×2.5×3 studs (width × height × depth)

TILLER (stock): Part 0.5×0.8×3, Wood, Color3.fromRGB(100,65,35)
PROD (bow part): curved Part 0.2×0.3×3 mounted perpendicular at front
  Wood, Color3.fromRGB(120,80,45) or Metal for steel crossbow
STRING: thin Part connecting prod tips, Color3.fromRGB(190,170,130)
NUT/TRIGGER: small metal Part at center top of tiller
TRIGGER GUARD: thin Part under tiller, Metal, Color3.fromRGB(80,80,85)
STIRRUP: small ring Part at front for foot bracing, Metal
BOLT (if loaded): thin cylinder Part 0.1×2×0.1 in channel on top
  Bolt head: tiny pointed Part, Metal
CHANNEL: slight groove in tiller top (thin recessed Part)
PRO TIP: The prod (bow) is perpendicular to the stock. Crossbow bolts are shorter than arrows.

────────────────────────────────────────────────────────────────────────────────
4.10 DAGGER
────────────────────────────────────────────────────────────────────────────────
Part count: 4-6 | Total length: 2 studs

BLADE: Part 0.1×1.2×0.3, Metal, Color3.fromRGB(200,200,205) — steel
  Double-edged: both edges sharp (tapers to point)
CROSSGUARD: Part 1×0.15×0.1, Metal, Color3.fromRGB(160,140,50) — brass
  Crossguard is minimal — dagger guards are small
GRIP: Part 0.25×0.7×0.25, Fabric, Color3.fromRGB(50,30,15) — dark leather
POMMEL: tiny sphere Part, Metal, matching crossguard
FULLER: optional very thin line Part on blade
SHEATH: optional Part matching blade length, Fabric, Color3.fromRGB(40,25,15) — leather
PRO TIP: Daggers are proportionally thick for their length compared to swords. The blade is roughly the same length as the handle.


════════════════════════════════════════════════════════════════════════════════
 SECTION 5: NATURE (15 Types)
════════════════════════════════════════════════════════════════════════════════

────────────────────────────────────────────────────────────────────────────────
5.01 OAK TREE
────────────────────────────────────────────────────────────────────────────────
Part count: 15-25 | Height: 14-18 studs

TRUNK: Cylinder 2×10×2, Wood, Color3.fromRGB(85,60,35) — bark brown
  Use 2 cylinders stacked with slight taper (top narrower)
ROOTS: 3-4 wedge Parts at base spreading outward, Wood, Color3.fromRGB(75,50,30)
MAIN BRANCHES: 4-6 cylinders, diameter 0.5-1 stud, length 3-6 studs
  Branch at 60-70% trunk height, angled 30-50 degrees from vertical
  Color: Color3.fromRGB(90,65,38) — slightly different from trunk
SUB-BRANCHES: 4-8 thinner cylinders extending from main branches
CANOPY: 5-8 overlapping spheres, Grass or LeafyGrass material
  Color: Color3.fromRGB(50,110,40) main green, some Color3.fromRGB(60,120,45) variation
  Largest sphere 6-8 studs diameter, smaller ones 3-5 studs
  Canopy width = roughly trunk height
FALLEN LEAVES (optional): 3-5 small flat Parts around base, slightly browner green
PRO TIP: Oak canopy is WIDE and rounded. Multiple overlapping spheres at different heights create depth.

────────────────────────────────────────────────────────────────────────────────
5.02 PINE TREE
────────────────────────────────────────────────────────────────────────────────
Part count: 10-18 | Height: 16-22 studs

TRUNK: Cylinder 1.5×16×1.5, Wood, Color3.fromRGB(95,65,40) — reddish bark
  Tall and straight, slight taper
CANOPY LAYERS: 4-6 cone-shaped Parts stacked, each smaller going up
  Bottom cone: 8 wide × 3 tall
  Each layer 1.5 studs narrower and 2-3 studs higher
  Material: LeafyGrass, Color3.fromRGB(30,80,35) — dark evergreen
  Slight overlap between layers (cones overlap 0.5-1 stud)
TOP: small cone or spike Part, same color
BARE TRUNK SECTION: bottom 30% of trunk has no branches (just bark)
PINE CONES (optional): 2-3 small brown sphere Parts hanging from lower branches
GROUND NEEDLES: flat slightly-brown-green Part around base
PRO TIP: Pine trees are CONICAL (triangular profile). Layers should get progressively smaller toward the top. Never spherical.

────────────────────────────────────────────────────────────────────────────────
5.03 PALM TREE
────────────────────────────────────────────────────────────────────────────────
Part count: 8-14 | Height: 12-16 studs

TRUNK: 3-4 cylinder Parts with slight lean/curve
  Not perfectly vertical — palms lean!
  Diameter: 1-1.5 studs, thicker at base
  Material: WoodPlanks, Color3.fromRGB(145,115,75) — sandy brown
  Ring marks: thin disc Parts every 2 studs along trunk, Color3.fromRGB(120,95,60)
FRONDS: 6-8 elongated diamond or oval Parts radiating from crown
  Size: each 0.1×1×5, angled outward and down
  Material: LeafyGrass, Color3.fromRGB(55,130,45) — tropical green
  Fronds droop: angle 20-40 degrees below horizontal
  Some fronds more droopy (dead/old), slightly yellower
COCONUTS: 2-3 small sphere Parts at trunk top, Color3.fromRGB(120,80,40)
TRUNK BASE: slightly wider section with exposed roots
PRO TIP: Palm trunks LEAN and CURVE — never perfectly straight. Fronds droop naturally from weight.

────────────────────────────────────────────────────────────────────────────────
5.04 WILLOW TREE
────────────────────────────────────────────────────────────────────────────────
Part count: 15-30 | Height: 12-16 studs

TRUNK: Cylinder 2.5×8×2.5, short and thick, Wood, Color3.fromRGB(80,65,40)
  Often leans to one side
  Trunk splits into 3-4 major branches at 50% height
MAJOR BRANCHES: 3-4 cylinders spreading wide and upward, same wood
  Branch angle: nearly horizontal (60-80 degrees from vertical)
DROOPING BRANCHES: THE defining feature — 15-25 thin cylinder Parts
  Hang straight down from major branches
  Length: 6-10 studs (reaching nearly to ground)
  Diameter: 0.1-0.2 studs
  Material: LeafyGrass or Grass, Color3.fromRGB(70,130,50) — yellow-green
  Slight sway: vary angle slightly per branch
CANOPY: few sphere Parts above for upper foliage, Color3.fromRGB(60,120,45)
WATER NEARBY: willows are always near water — add flat blue Part
PRO TIP: The cascading drooping branches are EVERYTHING. Without them it's just a tree. 15+ drooping parts minimum.

────────────────────────────────────────────────────────────────────────────────
5.05 CHERRY BLOSSOM TREE
────────────────────────────────────────────────────────────────────────────────
Part count: 12-20 | Height: 10-14 studs

TRUNK: Cylinder 1.5×8×1.5, Wood, Color3.fromRGB(100,60,40) — dark reddish bark
  Slightly gnarled: rotate sections 2-3 degrees
  Bark has horizontal lines (lenticels): thin disc Parts
BRANCHES: 5-7 cylinders spreading wide
  Branches are thin and elegant, not heavy
  Color: Color3.fromRGB(85,50,35)
BLOSSOMS: 8-12 sphere Parts clustered along branches
  Small spheres: 2-3 studs diameter
  Material: Fabric or just Part
  Color: Color3.fromRGB(255,180,200) — soft pink
  Mix with Color3.fromRGB(255,200,210) — lighter pink
  Some clusters: Color3.fromRGB(255,240,245) — nearly white
FALLEN PETALS: 5-8 tiny flat Parts scattered on ground below
  Same pink colors, very thin (0.05 tall)
TRUNK KNOTS: 2-3 small bump Parts on trunk for character
PRO TIP: Cherry blossoms are PINK, not red. Use 2-3 shades of pink for variation. Fallen petals on the ground complete the scene.

────────────────────────────────────────────────────────────────────────────────
5.06 BUSH
────────────────────────────────────────────────────────────────────────────────
Part count: 4-8 | Size: 3×2.5×3 studs

MAIN BODY: 2-3 overlapping sphere Parts, LeafyGrass, Color3.fromRGB(45,100,35)
  Sizes: 2.5, 2, 1.5 stud diameters, overlapping
  Not perfectly centered — offset for organic shape
SECONDARY COLORING: 1-2 spheres in slightly different green
  Color3.fromRGB(55,115,40) — highlights
INNER STRUCTURE: small dark Part barely visible, Color3.fromRGB(50,35,20) — hidden branches
GROUND CONNECTION: small Part at base anchoring to ground
OPTIONAL FLOWERS: 3-5 tiny colored Parts dotting the surface
  Color3.fromRGB(200,50,100), Color3.fromRGB(255,200,50), or Color3.fromRGB(230,230,230)
PRO TIP: Overlapping spheres of different sizes — never a single sphere. Offset them to look organic.

────────────────────────────────────────────────────────────────────────────────
5.07 FLOWER BED
────────────────────────────────────────────────────────────────────────────────
Part count: 12-20 | Size: 6×1.5×3 studs

SOIL BED: Part 6×0.5×3, Concrete, Color3.fromRGB(80,55,35) — dark soil
BORDER: 4 Parts forming rectangle frame, Wood or Brick
  Color3.fromRGB(120,80,40) for wood border
  Or Color3.fromRGB(150,75,50) for brick border
STEMS: 8-12 thin cylinder Parts 0.1×1×0.1 rising from soil, Color3.fromRGB(50,100,30) — green
FLOWER HEADS: 8-12 small Parts (spheres, discs, or clusters) atop stems
  Mix colors: Color3.fromRGB(220,50,50), Color3.fromRGB(255,220,50),
  Color3.fromRGB(200,100,200), Color3.fromRGB(240,240,240)
  Each flower 0.3-0.5 studs
LEAVES: thin flat Parts at mid-stem, green
MULCH: optional — Part 5.5×0.1×2.5 on top of soil, Color3.fromRGB(100,70,40)
PRO TIP: Variety is key — different flower heights, colors, and stem angles. Never line them up in perfect rows.

────────────────────────────────────────────────────────────────────────────────
5.08 CACTUS
────────────────────────────────────────────────────────────────────────────────
Part count: 5-8 | Height: 4-8 studs

MAIN BODY: Cylinder 1.5×5×1.5, Grass, Color3.fromRGB(50,110,50) — desert green
  Or use Part (more angular saguaro look)
ARMS (saguaro style): 2 cylinder Parts branching upward from main body
  Start at 50-60% height, angle up
  Diameter: 60% of main body
  One arm higher than the other for asymmetry
RIBS: optional vertical line Parts along body, slightly darker green
SPINES: tiny thin Parts poking out (optional, most noticeable close-up)
FLOWER (optional): small colored Part on top, Color3.fromRGB(255,200,50) — yellow cactus flower
BASE: small mound Part, Concrete, Color3.fromRGB(200,180,140) — sandy soil
PRO TIP: Saguaro style (arms going up) is most recognizable. Barrel cactus is just a fat short cylinder. Use Grass material, not Neon.

────────────────────────────────────────────────────────────────────────────────
5.09 ROCK FORMATION
────────────────────────────────────────────────────────────────────────────────
Part count: 5-12 | Size varies: 4-15 studs across

MAIN BOULDER: Part 5×3×4, Concrete, Color3.fromRGB(130,125,115) — gray granite
  Rotate 10-30 degrees for organic look
SECONDARY ROCKS: 3-6 Parts of varying sizes (2-4 studs)
  Slightly different shades: Color3.fromRGB(140,135,125), Color3.fromRGB(120,115,105)
  Different rotations (no two parallel)
SMALL SCATTERED ROCKS: 3-5 tiny Parts around base, same material range
MOSS (optional): thin Parts on top surfaces, Color3.fromRGB(60,90,40)
CRACK DETAILS: thin dark Parts in crevices between rocks
EMBEDDED ROCKS: some rocks partially buried (half below ground level)
PRO TIP: Every rock should be rotated differently. No two rocks same size. Partially buried rocks look natural. Avoid perfect gray — use warm or cool tint.

────────────────────────────────────────────────────────────────────────────────
5.10 WATERFALL
────────────────────────────────────────────────────────────────────────────────
Part count: 12-20 | Height: 10-20 studs

CLIFF FACE: Part 10×15×3, Concrete, Color3.fromRGB(110,105,95) — dark rock
WATER STREAM: Part 4×14×0.5, Glass, Color3.fromRGB(140,190,220) Transparency 0.4
  Positioned against cliff face, flowing down
  Can use Neon material for glowing water effect
MIST/SPRAY: 2-3 Parts at base, Glass, Color3.fromRGB(220,235,245) Transparency 0.7
  ParticleEmitter for realistic mist
POOL AT BASE: flat Part 12×0.3×8, Glass, Color3.fromRGB(80,140,180) Transparency 0.3
POOL ROCKS: 5-8 Parts around pool edge, Concrete, various gray shades
OVERFLOW STREAM: narrow Part leading away from pool
WET ROCKS: rocks near waterfall are darker (reduce RGB by 20-30)
MOSS ON CLIFF: green Parts on cliff face near water
LEDGE: horizontal Part where water flows over, creating the fall edge
PRO TIP: Water transparency increases with distance from fall. Mist at the base is essential. Wet rocks are darker than dry ones.

────────────────────────────────────────────────────────────────────────────────
5.11 POND
────────────────────────────────────────────────────────────────────────────────
Part count: 8-15 | Size: 10×1×8 studs

WATER SURFACE: Part 10×0.2×8, Glass, Color3.fromRGB(60,120,160) Transparency 0.35
  Slightly below ground level (sunken)
BANK/EDGE: 8-12 irregular Parts forming shoreline, Concrete, Color3.fromRGB(110,100,80) — earth tones
  Different sizes and heights for natural edge
MUD/SAND: thin Part at water edge, Color3.fromRGB(160,140,100) — sand
ROCKS: 4-6 scattered around edge, Concrete, Color3.fromRGB(130,125,115)
LILY PADS: 2-3 flat green disc Parts floating on surface, Color3.fromRGB(40,100,40)
REEDS/CATTAILS: 4-6 thin vertical Parts at one edge, Color3.fromRGB(120,130,60) — marshland
FISH (optional): tiny colored Parts visible through water
BOTTOM: Part 9.5×0.2×7.5 below water, darker, Color3.fromRGB(60,50,35) — muddy
PRO TIP: Pond edges should be irregular, not circular or rectangular. Lily pads and reeds sell the scene.

────────────────────────────────────────────────────────────────────────────────
5.12 CAMPFIRE
────────────────────────────────────────────────────────────────────────────────
Part count: 10-16 | Size: 3×3×3 studs

FIRE RING: 8-10 small rock Parts arranged in circle, Concrete, Color3.fromRGB(100,95,85)
  Each rock 0.5-0.8 studs, slightly different sizes and rotations
LOG PILE: 3-4 cylinder Parts 0.3×2×0.3 arranged teepee or log-cabin style
  Wood, Color3.fromRGB(60,40,20) — charred wood
  Some logs crossing others
FIRE: 3-4 overlapping Parts in center
  Inner flame: Part 0.5×1.5×0.5, Neon, Color3.fromRGB(255,200,50) — yellow
  Outer flame: Part 1×2×1, Neon, Color3.fromRGB(255,100,20) — orange
  Top flame: small Part, Neon, Color3.fromRGB(255,60,20) — red tip
  Add PointLight: Range 20, Color warm orange, Brightness 2
EMBERS: 2-3 tiny Parts at base, Neon, Color3.fromRGB(255,50,10)
ASH: flat circular Part under everything, Color3.fromRGB(60,55,50)
SMOKE: ParticleEmitter on fire, gray, rising
PRO TIP: Fire needs 3 colors (yellow core, orange middle, red tips). PointLight is MANDATORY or it doesn't read as fire.

────────────────────────────────────────────────────────────────────────────────
5.13 MUSHROOM CLUSTER
────────────────────────────────────────────────────────────────────────────────
Part count: 8-14 | Size: 3×2×3 studs

LARGE MUSHROOM: stem Cylinder 0.3×1.5×0.3 + cap Cylinder 0.2×1.5×1.5
  Stem: Color3.fromRGB(230,220,200) — off-white
  Cap: Color3.fromRGB(180,40,40) — red (or brown: Color3.fromRGB(140,100,60))
  White spots on red cap: 3-4 tiny white Parts, Color3.fromRGB(245,240,235)
MEDIUM MUSHROOM: smaller version 60% scale, slightly offset
SMALL MUSHROOMS: 2-3 tiny mushrooms around base, 30-40% scale
  Can be different color: Color3.fromRGB(200,170,100) — tan
GRASS TUFTS: 2-3 small green Parts at base
ROTTING LOG (optional): cylinder Part nearby, Color3.fromRGB(70,55,35)
PRO TIP: Always a CLUSTER — never a single mushroom. Vary sizes. The classic fairy-tale look is red cap with white spots.

────────────────────────────────────────────────────────────────────────────────
5.14 DEAD TREE
────────────────────────────────────────────────────────────────────────────────
Part count: 8-14 | Height: 10-14 studs

TRUNK: Cylinder 1.5×10×1.5, Wood, Color3.fromRGB(70,55,35) — ashy gray-brown
  Twisted: rotate sections, possibly leaning
  Bark peeling: thin offset Parts on trunk surface
BRANCHES: 5-8 bare branch Parts (cylinders), NO LEAVES
  Angles: aggressive, pointing in various directions, some upward, some out
  Thinner branches further from trunk: 0.1-0.3 stud diameter
  Color: Color3.fromRGB(80,65,45) — lighter gray-brown
BROKEN BRANCHES: 1-2 branches that end abruptly (snapped)
HOLLOW: optional dark Part in trunk indicating rot hole
FALLEN BARK: 2-3 thin Parts on ground near base
EXPOSED ROOTS: Parts at base, partially above ground
PRO TIP: Dead trees have NO foliage. Branches are bare, angular, and some are broken. The trunk should look weathered and gray.

────────────────────────────────────────────────────────────────────────────────
5.15 TREE STUMP
────────────────────────────────────────────────────────────────────────────────
Part count: 5-8 | Size: 3×2×3 studs

MAIN STUMP: Cylinder 1.5×2×1.5, Wood, Color3.fromRGB(100,75,45)
  Top surface: Part or disc, Color3.fromRGB(140,110,70) — exposed heartwood
  Ring marks: thin concentric circle Parts on top surface (optional)
BARK RIM: slightly larger cylinder around outside, 0.1 thick
  Color3.fromRGB(70,50,30) — rough bark
EXPOSED ROOTS: 3-4 Parts radiating outward at base, same bark color
MOSS: green Parts on top and north side, Color3.fromRGB(50,90,35)
MUSHROOMS: 2-3 tiny Parts on side of stump (shelf fungi)
  Color3.fromRGB(160,130,80) — bracket fungus tan
AXE MARKS: optional angular cut marks on sides
PRO TIP: The top of the stump should show the cut pattern (flat or angled). Add moss/fungi for age. Roots exposed.


════════════════════════════════════════════════════════════════════════════════
 SECTION 6: CHARACTERS (10 Types)
════════════════════════════════════════════════════════════════════════════════

────────────────────────────────────────────────────────────────────────────────
6.01 KNIGHT
────────────────────────────────────────────────────────────────────────────────
Part count: 18-25 | Height: 6 studs (slightly taller than default character)

HELMET: Part 2×2×2, Metal, Color3.fromRGB(170,170,175) — polished steel
  Visor: thin Part across face area, slightly darker, Color3.fromRGB(100,100,105)
  Plume/crest: thin Part on top, Color3.fromRGB(180,30,30) — red feather
TORSO: Part 2.5×2.5×1.5, Metal, Color3.fromRGB(160,160,165) — plate armor
  Chest plate detail: slightly raised Part on front
  Belt: thin Part at waist, Fabric, Color3.fromRGB(60,35,20)
SHOULDERS: 2 rounded Parts (pauldrons), Metal, same steel
ARMS: 2 Parts each, upper and lower arm, Metal
  Gauntlets (hands): Metal, slightly darker
LEGS: 2 Parts upper + 2 lower, Metal, with knee cops (small round Parts)
BOOTS (sabatons): Parts covering feet, Metal
TABARD: thin Part over chest, Fabric, Color3.fromRGB(180,30,30) with heraldic design
CAPE: thin Part from shoulders down back, Fabric, Color3.fromRGB(160,25,25)
SHIELD (in hand): see Weapons section
SWORD (in hand): see Weapons section
PRO TIP: Armor has layers — pauldrons over upper arm, tasset over upper leg. Tabard adds color and identity.

────────────────────────────────────────────────────────────────────────────────
6.02 WIZARD
────────────────────────────────────────────────────────────────────────────────
Part count: 14-20 | Height: 6 studs

HEAD: Part 1.5×1.5×1.5, Color3.fromRGB(230,200,170) — skin
WIZARD HAT: tall cone Part 2×3×2, Fabric, Color3.fromRGB(50,30,100) — deep purple
  Hat brim: flat disc Part 3×0.2×3 at hat base
  Star/moon detail: tiny colored Part on hat, Color3.fromRGB(255,220,50)
ROBE: Part 3×4×2, Fabric, Color3.fromRGB(60,35,110) — purple
  Robe flows wider at bottom (slightly larger base Part)
  Rope belt: thin cylinder around waist, Color3.fromRGB(170,140,80)
BEARD: Part 1×1.5×0.5 from chin, Fabric, Color3.fromRGB(220,215,200) — white/gray
SLEEVES: 2 Parts, wide and flowing, same robe color
HANDS: 2 small Parts visible at sleeve ends, skin color
STAFF (in hand): see Weapons section — magic staff
SPELL BOOK (optional): Part in other hand, leather brown
BOOTS: barely visible under robe, Color3.fromRGB(50,35,20)
PRO TIP: Flowing robes wider at bottom, long beard, and pointed hat are the three essentials. Staff with glowing orb completes the look.

────────────────────────────────────────────────────────────────────────────────
6.03 PIRATE
────────────────────────────────────────────────────────────────────────────────
Part count: 14-20 | Height: 5.5 studs

HEAD: Part 1.5×1.5×1.5, Color3.fromRGB(215,180,140) — tanned skin
TRICORN HAT: 3 angled Parts forming three-cornered hat, Fabric, Color3.fromRGB(30,25,20)
  Skull and crossbones: tiny white Parts on front
BANDANNA (alternative to hat): thin Part wrapped around head, Color3.fromRGB(180,30,30)
EYE PATCH: tiny dark Part over one eye
BEARD: scruffy Part, Fabric, Color3.fromRGB(40,30,20) — dark
COAT: Part 2.5×3×1.5, Fabric, Color3.fromRGB(140,30,30) — red or blue
  Open front showing vest/shirt
  Gold buttons: tiny Parts, Color3.fromRGB(200,170,50)
SHIRT: Part visible under coat, Fabric, Color3.fromRGB(230,225,210) — cream
BELT: Part with large buckle, Fabric + Metal
SASH: diagonal thin Part across chest, Color3.fromRGB(180,30,30)
PANTS: Part, Fabric, Color3.fromRGB(50,45,35) — dark
BOOTS: tall Parts reaching to knee, Fabric, Color3.fromRGB(50,35,20)
  Folded top on boots
CUTLASS: in one hand (curved blade version of longsword)
PEG LEG (optional): one boot replaced with wooden cylinder
HOOK HAND (optional): small curved metal Part
PRO TIP: Layer the outfit — shirt under vest under coat. Accessories (eye patch, sash, belt) add pirate identity.

────────────────────────────────────────────────────────────────────────────────
6.04 NINJA
────────────────────────────────────────────────────────────────────────────────
Part count: 12-18 | Height: 5 studs

HEAD WRAP: Part 1.5×1.5×1.5, Fabric, Color3.fromRGB(20,20,25) — near black
  Only eyes visible: thin Part 1×0.3 as eye slit, Color3.fromRGB(200,195,180) — skin
  Headband with knot at back: thin Part with tail pieces
TORSO: Part 2×2×1, Fabric, Color3.fromRGB(25,25,30) — dark ninja garb
  Wrapped style: thin diagonal Part across chest
ARMS: 2 Parts, same dark fabric
  Arm wraps: thin Parts spiraling around forearms
LEGS: 2 Parts, same dark fabric
  Leg wraps at shin level
FEET (tabi boots): split-toe Parts, Color3.fromRGB(25,25,25)
BELT/SASH: Part around waist, Color3.fromRGB(50,45,40)
WEAPONS: katana on back (thin Part angled over shoulder)
  Shuriken: small star-shaped Part at belt, Metal
SMOKE BOMB (optional): small sphere Part at belt, Color3.fromRGB(60,60,65)
PRO TIP: Everything is dark/black. The wrapping details (arm/leg wraps, belt) add texture to an otherwise monochrome build.

────────────────────────────────────────────────────────────────────────────────
6.05 ROBOT
────────────────────────────────────────────────────────────────────────────────
Part count: 16-24 | Height: 6 studs

HEAD: Part 2×2×2, Metal, Color3.fromRGB(180,185,190) — brushed metal
  Eyes: 2 glowing Parts, Neon, Color3.fromRGB(50,200,255) — cyan
  Antenna: thin vertical Part on top, Metal
  Mouth: horizontal line Part or grille, Color3.fromRGB(60,60,65)
TORSO: Part 3×3×2, Metal, Color3.fromRGB(170,175,180)
  Chest panel: contrasting Part with "buttons" or displays
  Power core: glowing Part in center, Neon, Color3.fromRGB(50,200,255)
  Vents/grilles: horizontal line Parts on sides
ARMS: 2 cylindrical assemblies, each with upper arm + forearm + hand
  Joints visible: cylinder Parts at shoulder and elbow
  Hands: clamp Parts (2 pieces), Metal
LEGS: 2 assemblies with thigh + shin + foot
  Piston details: thin Parts alongside legs, Color3.fromRGB(160,160,165)
  Feet: flat wide Parts for stability
DETAILS:
  Rivets: tiny sphere Parts at panel seams
  Warning stripes: small yellow/black Parts on shoulders
  Serial number: SurfaceGui on torso
PRO TIP: Visible joints, panel seams, and glowing elements define a robot. Use the same accent glow color throughout.

────────────────────────────────────────────────────────────────────────────────
6.06 ALIEN
────────────────────────────────────────────────────────────────────────────────
Part count: 12-18 | Height: 5-7 studs

HEAD: large Part 2.5×3×2 (oversized relative to body), Color3.fromRGB(140,200,150) — pale green
  Large eyes: 2 sphere Parts, Neon, Color3.fromRGB(20,20,20) — black almond-shaped
  No visible nose or mouth (or very small slit)
  Skull elongated upward: head taller than wide
BODY: thin Part 1.5×2×1, Color3.fromRGB(130,190,140) — matching green
  Slender build — thinner than human proportions
  Possibly wearing jumpsuit: Color3.fromRGB(100,100,110) — metallic gray
ARMS: 2 thin Parts, long relative to body (3+ studs each)
  Long fingers: 3-4 thin Parts per hand
LEGS: 2 thin Parts, normal length
  Feet: small Parts, minimal
TECH (optional):
  Communicator device on wrist: small glowing Part
  Belt with tools: thin Part with attached small Parts
  Helmet (if in suit): glass dome Part over head, Transparency 0.5
PRO TIP: Big head, big eyes, thin body. The classic "gray alien" proportions work best for readability.

────────────────────────────────────────────────────────────────────────────────
6.07 ZOMBIE
────────────────────────────────────────────────────────────────────────────────
Part count: 12-18 | Height: 5 studs (slightly hunched)

HEAD: Part 1.5×1.5×1.5, Color3.fromRGB(130,155,100) — sickly green
  Jaw: slightly offset Part, darker, suggesting slack jaw
  Eyes: glowing Parts, Neon, Color3.fromRGB(200,200,50) — yellow-green
  Wound marks: small dark Parts on face
TORSO: Part 2×2.5×1.2, Fabric, Color3.fromRGB(80,70,60) — torn clothes
  Exposed ribs: thin Parts through torn shirt area
  Shirt tears: irregular Part edges (multiple overlapping Parts)
ARMS: 2 Parts, one raised forward (classic zombie pose)
  Skin color: same sickly green
  Exposed bone: white Part at elbow or wrist
  Missing fingers: hand Part irregular
LEGS: 2 Parts, one may be dragging (rotated oddly)
  Pants torn: shorter Part on one leg
DETAILS:
  Blood stains: small Parts, Color3.fromRGB(100,20,20) — dark red
  Dirt: darker Parts on lower body
  Chain/shackle: optional metal Part on ankle
PRO TIP: Zombies are defined by decay and asymmetry. One arm up, hunched posture, torn clothes, wounds. Nothing should look clean or symmetric.

────────────────────────────────────────────────────────────────────────────────
6.08 SKELETON
────────────────────────────────────────────────────────────────────────────────
Part count: 16-22 | Height: 5 studs

SKULL: Part 1.5×1.8×1.5, Concrete, Color3.fromRGB(235,230,215) — bone white
  Eye sockets: 2 dark Parts recessed, Color3.fromRGB(20,15,10)
  Jaw: separate Part, slightly detached/dropped for menacing look
  Nose cavity: small dark triangle Part
RIBCAGE: 6-8 thin curved Parts forming rib structure
  Color3.fromRGB(230,225,210) — bone
  Spine: thin vertical Part behind ribs
PELVIS: Part 2×1×1, same bone color
ARMS: each arm = upper arm + forearm + hand
  Thin Parts 0.2-0.3 studs wide, bone color
  Joints visible as small sphere Parts
HANDS: small Parts with finger suggestions
LEGS: same structure as arms — femur + tibia + foot
  Femur 0.3×2.5×0.3, Tibia 0.3×2.5×0.3
  Feet: small flat Parts
WEAPON: often holds a sword or bow
ARMOR (optional): partial armor pieces over bones
PRO TIP: Skeletons are thin — every Part should be narrow. Visible gaps between ribs and joints make it read as skeletal, not just a white humanoid.

────────────────────────────────────────────────────────────────────────────────
6.09 GHOST
────────────────────────────────────────────────────────────────────────────────
Part count: 8-12 | Height: 5-6 studs

BODY SHAPE: large flowing Part 3×4×2, Color3.fromRGB(220,225,240) — pale blue-white
  Transparency: 0.4 (semi-transparent is essential)
  Material: Neon for slight glow, or Glass
  Bottom edge: wavy/ragged — use 3-4 Parts of different heights
HEAD: sphere Part 2×2×2 on top, same color and transparency
  Eyes: 2 Parts, Color3.fromRGB(30,30,40) — dark hollow eyes
  Mouth: oval Part, Color3.fromRGB(40,40,50) — dark "O" shape
ARMS (optional): 2 thin Parts extending from body, same transparency
  Trailing wisps at ends — thin Parts tapering
TAIL: bottom of body tapers to nothing — smallest Part at bottom has highest transparency (0.7)
GLOW: PointLight inside body, Color3.fromRGB(180,200,240), Range 10
CHAIN (optional): thin Parts dangling from wrists, Metal, with Transparency 0.2
FLOATING: position ghost ABOVE ground, not touching — key visual
PRO TIP: Transparency is NON-NEGOTIABLE. A ghost must be semi-transparent with inner glow. Floating above ground.

────────────────────────────────────────────────────────────────────────────────
6.10 FAIRY
────────────────────────────────────────────────────────────────────────────────
Part count: 12-18 | Height: 2.5 studs (smaller than human characters)

BODY: tiny Part 0.8×1.2×0.5, Fabric, Color3.fromRGB(200,230,200) — light green dress
HEAD: Part 0.8×0.8×0.8, Color3.fromRGB(240,220,200) — fair skin
HAIR: Part flowing behind head, Color3.fromRGB(255,220,120) — golden blonde
WINGS: 4 thin Parts (2 per side, upper + lower), Glass
  Color3.fromRGB(200,230,255) Transparency 0.5 — iridescent blue
  Upper wings: Part 0.05×1.5×1 angled 20 degrees back
  Lower wings: Part 0.05×1×0.7 smaller, angled further back
  Wings extend higher than head and wider than body
ARMS: 2 tiny Parts, skin color
LEGS: 2 tiny Parts with small shoes, Color3.fromRGB(100,180,100)
GLOW: PointLight, Color3.fromRGB(200,255,200) — green sparkle, Range 8
SPARKLE TRAIL: ParticleEmitter with small gold/green sparkles
WAND (optional): tiny thin Part with star at tip
  Star: small Part, Neon, Color3.fromRGB(255,255,100)
PRO TIP: Fairies are SMALL (half character height) with LARGE wings relative to body. Glow and sparkle particles are mandatory.


════════════════════════════════════════════════════════════════════════════════
 SECTION 7: STRUCTURES (15 Types)
════════════════════════════════════════════════════════════════════════════════

────────────────────────────────────────────────────────────────────────────────
7.01 BRIDGE (STONE ARCH)
────────────────────────────────────────────────────────────────────────────────
Part count: 15-25 | Length: 20 studs, Width: 6 studs

ARCH: 5-7 Parts arranged in semicircle under bridge deck
  Cobblestone, Color3.fromRGB(140,135,125) — aged stone
  Each Part angled to form the curve (like a Roman arch)
  Keystone at top: slightly larger Part
DECK: Part 20×0.5×6, Cobblestone, Color3.fromRGB(150,145,135)
WALLS/PARAPETS: 2 Parts 20×2×0.5 along each side, same stone
WALL CAPS: thin Parts on top of parapets, slightly wider
ABUTMENTS: 2 solid Parts at each end where bridge meets ground
  Part 4×5×6, same stone, thicker at base
PILASTERS: vertical raised Parts on outside of arch face (decorative)
APPROACH RAMPS: angled Parts leading up to bridge at each end
DETAILS:
  Drain holes: small dark circles in parapet
  Moss: green Parts on lower stones near water
  Water underneath: blue transparent Part
PRO TIP: The arch should be a proper semicircle, not a pointed triangle. Keystones and voussoirs make it architecturally correct.

────────────────────────────────────────────────────────────────────────────────
7.02 LIGHTHOUSE
────────────────────────────────────────────────────────────────────────────────
Part count: 18-28 | Height: 25-35 studs

BASE: Cylinder 6×4×6, Brick, Color3.fromRGB(240,235,225) — white with red stripe
TOWER: Cylinder 4×20×4 tapering to 3 at top, same white
  Red stripe bands: thin cylinder Parts every 5 studs, Color3.fromRGB(200,40,40)
  Or spiral stripe: multiple angled Parts
LANTERN ROOM: Cylinder 4×4×4 at tower top, Glass sides
  Glass panels: Transparency 0.5, Color3.fromRGB(200,215,230)
  Metal frame: dark Parts between glass panels
GALLERY (walkway): flat disc Part extending around lantern room
  Railing: thin Parts around gallery edge
LIGHT: central sphere Part, Neon, Color3.fromRGB(255,255,200), with PointLight Range 50+
CUPOLA: small dome or cone Part on top of lantern room
DOOR: Part 3×6×0.3 at base, Wood
WINDOWS: 3-4 small Parts spiraling up tower
KEEPER'S HOUSE (optional): small attached building at base
ROCKS AT BASE: cluster of rock Parts around foundation
PRO TIP: Lighthouse must have the gallery walkway around the lantern room. The light should be BRIGHT with long range PointLight.

────────────────────────────────────────────────────────────────────────────────
7.03 WINDMILL
────────────────────────────────────────────────────────────────────────────────
Part count: 15-22 | Height: 18-22 studs

TOWER: Cylinder (or octagonal) 5×15×5, Brick or Concrete
  Color3.fromRGB(230,225,210) — white-washed stone
  Tapers: wider at base (6), narrower at top (4)
  Traditional Dutch: Part body with thatch/wood upper section
CAP: dome or cone Part on top, WoodPlanks, Color3.fromRGB(70,55,35)
  Cap can rotate (in concept) to face the wind
SAILS/BLADES: 4 arms radiating from hub
  Each arm: thin Part 0.3×10×0.5, Wood, Color3.fromRGB(150,130,90)
  Sail cloth: thin Parts between arm frames, Fabric, Color3.fromRGB(235,230,215)
  Sails arranged in cross pattern (+)
HUB: cylinder Part at cap front where blades attach
PLATFORM/GALLERY: if traditional, a walkway around the cap
DOOR: Part at ground level, Wood, Color3.fromRGB(80,55,30)
WINDOWS: 2-3 small Parts up the tower
TAIL FAN (wind vane): thin Parts at back of cap
STONES (base): larger stone Parts at foundation
PRO TIP: Sails should be large (span greater than tower height). The tower tapers — wider at base is critical.

────────────────────────────────────────────────────────────────────────────────
7.04 WELL
────────────────────────────────────────────────────────────────────────────────
Part count: 10-16 | Size: 4×5×4 studs

WELL WALL: Cylinder 3×3×3, Cobblestone, Color3.fromRGB(130,125,115)
  Or square: 4 Parts forming square wall, same material
CAPSTONE: thin cylinder or square Part on top of wall, Concrete
ROOF: 2 angled Parts forming small A-frame over well
  Material: WoodPlanks, Color3.fromRGB(100,70,40)
SUPPORT POSTS: 2 Parts from capstone to roof peak, Wood
CROSSBEAM: horizontal Part at top between posts (holds rope mechanism)
ROPE: thin cylinder Part from crossbeam down into well, Color3.fromRGB(170,150,110)
BUCKET: small Part at rope end or sitting on capstone
  Wood, Color3.fromRGB(130,90,50) with metal band Parts
WINCH/CRANK: small L-shaped Part on crossbeam, Metal
WATER (inside): dark blue Part deep inside well, Glass, Transparency 0.5
GROUND AROUND: cobblestone or dirt flat Parts
PRO TIP: The A-frame roof over the well is what makes it recognizable. Without it, it's just a cylinder.

────────────────────────────────────────────────────────────────────────────────
7.05 MARKET STALL
────────────────────────────────────────────────────────────────────────────────
Part count: 12-18 | Size: 8×8×5 studs

COUNTER: Part 8×3×1.5, Wood, Color3.fromRGB(150,110,65)
BACK WALL: Part 8×8×0.3, Wood, Color3.fromRGB(140,100,55)
POSTS: 4 vertical Parts 0.5×8×0.5 at corners, Wood
ROOF: Part 9×0.3×6 angled slightly forward (front lower than back)
  Canvas material: Fabric, Color3.fromRGB(200,50,50) — red
  Or striped: alternating colored Parts
SHELVING: 2-3 horizontal Parts on back wall for display
GOODS ON DISPLAY: various small Parts representing wares
  Fruit: small sphere Parts, various colors
  Bread: small brown Parts
  Fabric rolls: cylinder Parts
  Potions: small colored bottle Parts
SIGNS: hanging Part from roof edge with SurfaceGui
CRATE/BARREL: storage behind counter
CANOPY FRINGE: thin Parts along roof edge (scalloped)
PRO TIP: The goods on display are what tell the story. A food stall needs food Parts. A potion stall needs bottle Parts. The canopy color defines the character.

────────────────────────────────────────────────────────────────────────────────
7.06 GAZEBO
────────────────────────────────────────────────────────────────────────────────
Part count: 14-20 | Size: 8×8×8 studs (octagonal or round)

FLOOR: octagonal platform (8 Parts forming octagon) or Cylinder 0.5×8×8
  Wood, Color3.fromRGB(155,125,80) — warm wood
  Raised 1-2 studs off ground on stepped base
POSTS: 6-8 vertical Parts at platform edges, 0.5×6×0.5
  Wood, Color3.fromRGB(240,235,225) — painted white
  Optionally turned/decorative shape
RAILING: horizontal Parts between posts at 2.5 stud height
  Balusters: thin vertical Parts between rails
ROOF: cone or pyramid shape — multiple triangular Parts meeting at center peak
  Material: WoodPlanks or Metal, Color3.fromRGB(80,75,70)
ROOF FINIAL: decorative Part at peak (sphere or spire)
CEILING: underside of roof visible (can be flat Part or rafters)
STEPS: 2-3 step Parts at entrance side
BENCH (built-in, optional): Part along inside railing
VINE GROWTH (optional): green Parts climbing posts
PRO TIP: Gazebos are open-air — no walls, just railings. The roof shape (usually octagonal or round) defines the structure.

────────────────────────────────────────────────────────────────────────────────
7.07 WATCHTOWER
────────────────────────────────────────────────────────────────────────────────
Part count: 16-24 | Height: 20-25 studs

BASE: Part 6×3×6, Cobblestone, Color3.fromRGB(130,125,115) — stone
TOWER SHAFT: Part 4×15×4, WoodPlanks, Color3.fromRGB(130,95,55) — timber
  Or stone: same as base
  X-bracing on exterior: diagonal Parts on each face
PLATFORMS: 2-3 horizontal Parts at intervals (observation levels)
  Partial floor at each level with ladder hole
TOP PLATFORM: Part 6×0.5×6 extending past tower (overhanging), Wood
CRENELLATIONS: merlons on top platform edge (see Castle)
ROOF: optional cone or pyramid Part, WoodPlanks
LADDER: thin Parts with rungs inside tower
ARROW SLITS: thin dark Parts in tower walls (narrow openings)
TORCH BRACKET: small Parts on exterior with fire Part
FLAG: thin Part on pole at top
STRUCTURAL FRAMING (if wood): visible beam Parts on exterior
PRO TIP: Watchtowers overhang at the top (wider platform than shaft). This is for defense (machiculations) and it looks distinctive.

────────────────────────────────────────────────────────────────────────────────
7.08 DOCK/PIER
────────────────────────────────────────────────────────────────────────────────
Part count: 15-25 | Size: 4 wide × 30+ long studs

PILINGS: 8-12 cylinder Parts extending into water, 0.5×6×0.5
  Wood, Color3.fromRGB(100,75,45) — weathered dark wood
  Spaced every 4 studs along dock length
  Some barnacles: small Parts near waterline
DECK PLANKS: Part 4×0.3×30 (or multiple shorter Parts for plank gaps)
  WoodPlanks, Color3.fromRGB(150,130,100) — sun-bleached
  Plank gaps: thin dark lines between sections (0.05 stud gaps)
SUPPORT BEAMS: horizontal Parts under deck connecting pilings
CLEATS: 4-6 small metal Parts along dock edges for tying boats
ROPE: thin Parts coiled on cleats
POSTS: 2-3 taller pilings at edges, taller than deck
BUMPERS: thick Parts hanging on sides, Concrete, Color3.fromRGB(40,40,40) — rubber
LADDER: thin Parts at dock edge going down to water
LIGHT: lamp post Part at end of dock (see Props)
BOAT TIE-UP: space alongside dock for boat
PRO TIP: Pilings should be visible both above and below deck level. Weathered wood color (gray-brown) is key for docks.

────────────────────────────────────────────────────────────────────────────────
7.09 GREENHOUSE
────────────────────────────────────────────────────────────────────────────────
Part count: 16-24 | Size: 12×8×8 studs

FRAME: Metal structure — thin Parts forming rectangular frame
  Color3.fromRGB(240,235,225) — white painted metal (or green: Color3.fromRGB(50,80,50))
  Vertical frame members: 0.2×8×0.2 every 3 studs
  Horizontal frame members: 0.2×0.2 connecting verticals
GLASS PANELS: Parts between frame members, Glass, Transparency 0.6
  Color3.fromRGB(200,220,235) — slight blue tint
  Walls, roof, and gable ends all glass
ROOF: A-frame glass — 2 angled glass Parts + frame
  Ridge: horizontal frame Part along peak
  Optional: some panels open (vents)
BASE WALL: Part 0.5 stud tall, Brick, Color3.fromRGB(170,95,60) — brick knee wall
DOOR: Part 3×7×0.15, Glass in metal frame
INTERIOR:
  Plant tables: 2 long Parts along sides, Wood
  Plants: various green Parts on tables
  Pots: small Parts of various colors
  Watering system: thin tube Parts overhead
GROUND: gravel Part inside, Concrete, Color3.fromRGB(180,170,150)
PRO TIP: The glass transparency and metal frame contrast define a greenhouse. Every panel should show the frame grid. Plants visible inside add life.

────────────────────────────────────────────────────────────────────────────────
7.10 CLOCK TOWER
────────────────────────────────────────────────────────────────────────────────
Part count: 20-30 | Height: 30-40 studs

BASE: Part 8×6×8, Brick, Color3.fromRGB(160,120,80) — warm stone
SHAFT: Part 6×20×6, same brick, tapering slightly
CLOCK LEVEL: Part 7×6×7 slightly wider, Brick or Concrete
  Clock faces: 4 Cylinder Parts 0.2×4×4, one on each side
  Face color: Color3.fromRGB(240,235,210) — cream
  Hour markers: 12 small Parts around each face
  Hands: 2 thin dark Parts per face (hour + minute)
  Hour hand shorter and wider, minute hand longer and thinner
BELFRY (above clock): open arches on each side
  Arch openings with thin frame Parts
  Bell: sphere Part inside, Metal, Color3.fromRGB(170,140,50)
SPIRE: pyramid or cone Part on top, Metal or Concrete, dark
PINNACLES: 4 small spire Parts at corners of belfry
ENTRANCE: arched door at base with steps
BUTTRESSES: 4 Parts at base corners for support
PRO TIP: Clock must have faces on ALL FOUR sides. The belfry above the clock is open (visible through arches). The spire caps the composition.

────────────────────────────────────────────────────────────────────────────────
7.11 AMPHITHEATER
────────────────────────────────────────────────────────────────────────────────
Part count: 20-30 | Size: 30×8×30 studs (semicircular)

SEATING TIERS: 5-8 concentric semicircular step Parts
  Each tier: 0.8 studs tall, 1.5 studs deep
  Material: Concrete, Color3.fromRGB(190,185,175) — light stone
  Arranged in expanding semicircle (theater seating)
STAGE: flat Part at the focus point, 10×0.3×8
  Material: Wood, Color3.fromRGB(140,105,65) — warm wood
  Or Concrete, Color3.fromRGB(210,205,195) — stone
ORCHESTRA PIT: slightly lower area between stage and first tier
BACKSTAGE WALL (scaenae frons): tall Part behind stage
  Columns: 4-6 cylinder Parts on wall face
  Arched niches: 3 dark recessed Parts between columns
AISLES: 2-3 radial gaps in seating (narrow passages between sections)
ENTRY TUNNELS (vomitoria): 2 dark tunnel openings at sides
COLUMNS: decorative columns along top tier edge
CANOPY/AWNING (velarium): optional colored Parts overhead
PRO TIP: Semicircular layout with rising tiers is essential. Stage is at the bottom/focus. The scaenae frons wall gives it Roman authenticity.

────────────────────────────────────────────────────────────────────────────────
7.12 ELEVATOR
────────────────────────────────────────────────────────────────────────────────
Part count: 10-15 | Size: 4×8×4 studs (shaft)

SHAFT: 4 wall Parts forming vertical box, Metal, Color3.fromRGB(170,170,175)
  One side open or glass for visibility
CAR: Part 3.5×7.5×3.5 inside shaft, Metal, Color3.fromRGB(190,185,175)
  Interior walls: lighter color, Color3.fromRGB(210,205,195)
DOORS: 2 sliding Parts at each floor level
  Color3.fromRGB(180,180,185) — brushed metal
  Slight gap between doors (center-opening)
FLOOR INDICATOR: small Part above doors with numbers (SurfaceGui)
BUTTONS: column of small Parts inside car, Metal
HANDRAIL: thin Part around car interior at waist height
CEILING LIGHT: flat Part with glow on car ceiling
CABLES: thin Parts above car going to top of shaft
COUNTERWEIGHT: Part in shaft visible through open side
CALL BUTTONS: small Parts on wall at each floor level
PRO TIP: Visible shaft structure (open side or glass) makes elevators interesting. Otherwise it's just a closet.

────────────────────────────────────────────────────────────────────────────────
7.13 CRANE (CONSTRUCTION)
────────────────────────────────────────────────────────────────────────────────
Part count: 16-24 | Height: 30+ studs

BASE: Part 6×2×6, Concrete, Color3.fromRGB(170,165,155) — concrete pad
TOWER (mast): lattice structure of thin Parts forming square tower
  Main verticals: 4 Parts 0.3×30×0.3, Metal, Color3.fromRGB(220,180,30) — crane yellow
  Cross bracing: X-shaped thin Parts between verticals at intervals
  Extremely tall (30+ studs)
SLEWING UNIT: Part at tower top where arm attaches, can rotate
JIB (horizontal arm): long horizontal lattice (same style as tower)
  Length: 20+ studs forward
COUNTER-JIB: shorter arm extending backward (8 studs)
  Counterweight: heavy Part at end, Concrete, Color3.fromRGB(160,155,145)
TROLLEY: small Part that moves along jib
HOOK: assembly hanging from trolley
  Cable: thin Part from trolley down
  Hook: small C-shaped Part, Metal
CAB: small Part at slewing unit, Glass/Metal
CLIMBER'S LADDER: thin Parts up one side of tower
WARNING LIGHTS: red Parts at top of tower and jib tip
PRO TIP: The lattice/truss structure of the tower and jib is what makes it look like a crane, not a solid beam. Yellow is the standard color.

────────────────────────────────────────────────────────────────────────────────
7.14 WATER TOWER
────────────────────────────────────────────────────────────────────────────────
Part count: 12-18 | Height: 20-25 studs

TANK: Cylinder 8×6×8, Metal, Color3.fromRGB(150,150,155) — galvanized steel
  Or wooden tank: WoodPlanks, Color3.fromRGB(120,85,50) with band Parts
  Tank has cone or dome roof: Part on top
LEGS: 4-6 angled Parts from tank bottom to ground
  Metal, Color3.fromRGB(90,90,95)
  Cross bracing between legs: X-shaped thin Parts
LADDER: thin Parts up one leg to tank, Metal
CATWALK: thin platform around tank middle (maintenance walkway)
  Railing around catwalk
PIPE: cylinder running down from tank bottom to ground, Metal
OVERFLOW PIPE: smaller pipe from tank top curving down
FOUNDATION: small concrete pads under each leg
LOGO/TEXT: SurfaceGui on tank side (town name or company)
PRO TIP: Elevated tanks need visible structural legs with cross-bracing. The tank itself is less interesting than the support structure.

────────────────────────────────────────────────────────────────────────────────
7.15 RADIO TOWER
────────────────────────────────────────────────────────────────────────────────
Part count: 14-22 | Height: 40+ studs

TOWER: lattice structure — 3 or 4 main vertical Parts with cross-bracing
  Metal, Color3.fromRGB(200,50,50) — FAA red (alternating with white)
  White sections: Color3.fromRGB(240,240,240)
  Cross bracing: thin X-Parts between verticals
  Tower tapers: wider at base (6 studs), narrower at top (2 studs)
GUY WIRES: 3 thin Parts from tower at 2/3 height to ground anchors
  Metal, Color3.fromRGB(160,160,160)
ANTENNA: thin vertical Part extending above tower top
DISHES: 1-2 cylinder Parts mounted on tower face (microwave dishes)
  Color3.fromRGB(230,230,230) — white
WARNING LIGHTS: red Parts (Neon) at top and every 50' equivalent
EQUIPMENT SHELTER: small building at base (see Warehouse but tiny)
FENCE: chain-link around base (thin grid Parts)
FOUNDATION: 3-4 concrete pad Parts at leg bases
CABLE TRAY: thin Parts running down tower face
PRO TIP: The red/white alternating paint is the defining visual. The lattice tapers from wide base to narrow top. Guy wires anchor it.


════════════════════════════════════════════════════════════════════════════════
 SECTION 8: PROPS (20 Types)
════════════════════════════════════════════════════════════════════════════════

────────────────────────────────────────────────────────────────────────────────
8.01 LAMP POST
────────────────────────────────────────────────────────────────────────────────
Part count: 5-8 | Height: 10 studs

POLE: Cylinder 0.4×9×0.4, Metal, Color3.fromRGB(50,55,50) — dark iron
BASE: wider Part 1×1×1 at ground, Metal, decorative
LAMP HEAD: Part 1.5×1×1.5 at top, Metal, Color3.fromRGB(55,60,55)
LIGHT GLOBE: sphere Part 0.8×0.8×0.8 inside lamp head
  Neon material, Color3.fromRGB(255,240,200) — warm glow
  Add PointLight: Range 15, Brightness 1.5, warm Color
ARM (curved): Part connecting pole top to lamp head, curved outward
DETAIL: decorative rings on pole at 1/3 and 2/3 height
PRO TIP: PointLight is essential — without it, the lamp doesn't read as a light source. Warm color temperature.

────────────────────────────────────────────────────────────────────────────────
8.02 TRAFFIC LIGHT
────────────────────────────────────────────────────────────────────────────────
Part count: 8-12 | Height: 10 studs

POLE: Cylinder 0.4×8×0.4, Metal, Color3.fromRGB(80,80,85) — dark gray
ARM: horizontal Part 0.4×0.4×4 extending from pole top
HOUSING: Part 1.2×3×1, Metal, Color3.fromRGB(40,40,45) — dark housing
RED LIGHT: Cylinder 0.1×0.8×0.8, Color3.fromRGB(200,30,30), top position
YELLOW LIGHT: same, Color3.fromRGB(220,200,30), middle
GREEN LIGHT: same, Color3.fromRGB(30,180,40), bottom
VISORS: 3 small half-cylinder Parts (hoods) over each light
BACK PLATE: Part 1.4×3.5×0.1 behind housing
WALK SIGNAL (optional): smaller housing with walk/don't walk

PRO TIP: The three lights should be clearly visible as separate circles. Visor hoods above each light prevent sun glare (and look realistic).

────────────────────────────────────────────────────────────────────────────────
8.03 STOP SIGN
────────────────────────────────────────────────────────────────────────────────
Part count: 3-5 | Height: 8 studs

POLE: Cylinder 0.3×7×0.3, Metal, Color3.fromRGB(170,170,170) — galvanized
SIGN: octagonal Part (use 8-sided shape or approximate with Part)
  2×0.1×2, Color3.fromRGB(200,30,30) — red
  SurfaceGui with "STOP" text in white
BACK: same shape, Metal, Color3.fromRGB(170,170,170)
BOLT DETAIL: 2 tiny Parts connecting sign to pole
REFLECTIVE BORDER: thin white edge around sign

PRO TIP: Octagonal shape is what makes it a stop sign. If using a square Part, it still needs to read as a stop sign via color and text.

────────────────────────────────────────────────────────────────────────────────
8.04 FIRE HYDRANT
────────────────────────────────────────────────────────────────────────────────
Part count: 5-8 | Height: 2.5 studs

BODY: Cylinder 1×2×1, Metal, Color3.fromRGB(200,40,40) — classic red
  Or: Color3.fromRGB(220,200,30) — yellow (varies by city)
BONNET (top): dome Part on top, same color
OPERATING NUT: small pentagon Part on top of bonnet
NOZZLE CAPS: 2 small cylinder Parts on sides (outlet caps)
  Color3.fromRGB(180,180,180) — silver
CHAINS: tiny Parts connecting caps to body
BASE FLANGE: wider flat Part at bottom, same color
GROUND CONNECTION: small Part where hydrant meets ground

PRO TIP: Fire hydrants are CHUNKY — wider than expected for their height. The two side outlet caps are the recognizable feature.

────────────────────────────────────────────────────────────────────────────────
8.05 MAILBOX
────────────────────────────────────────────────────────────────────────────────
Part count: 4-6 | Size: 1.5×4×1 studs (on post)

POST: Part 0.3×3.5×0.3, Wood, Color3.fromRGB(140,105,60) — or Metal
BOX: Part 1.5×1×1 on top of post
  Metal, Color3.fromRGB(30,60,150) — USPS blue
  Or: Color3.fromRGB(200,40,40) — red (UK style)
DOOR/SLOT: thin Part on front face, slightly different shade
FLAG (US style): thin Part on side, Metal, Color3.fromRGB(200,40,40) — red arm
PULL HANDLE: tiny Part on door
ADDRESS NUMBERS: SurfaceGui on side

PRO TIP: US vs UK style matters — US has the rounded top box on a post with flag, UK has the tall red pillar box. Pick one and commit.

────────────────────────────────────────────────────────────────────────────────
8.06 BENCH (PARK)
────────────────────────────────────────────────────────────────────────────────
Part count: 7-10 | Size: 6×3×2 studs

SEAT SLATS: 3-4 horizontal Parts 6×0.2×0.5, WoodPlanks, Color3.fromRGB(130,90,50)
  Slight gaps between slats (0.1 studs)
BACK SLATS: 3 horizontal Parts 6×0.2×0.4, same wood, angled 10 degrees back
ARMRESTS: 2 Parts at ends, Metal, Color3.fromRGB(50,55,50) — wrought iron
LEGS: 2 decorative end frames, Metal, same dark iron
  Each frame: L-shaped or curved Parts supporting seat and back
BACK SUPPORT: 2 vertical Parts connecting seat frame to back frame
BOLTS: optional tiny Parts at connection points

PRO TIP: The contrast between wood slats and metal frame is classic park bench. Slats must have gaps between them.

────────────────────────────────────────────────────────────────────────────────
8.07 BUS STOP
────────────────────────────────────────────────────────────────────────────────
Part count: 8-12 | Size: 6×8×3 studs

ROOF: Part 6×0.3×3, Metal or Glass, Color3.fromRGB(180,180,185)
SUPPORT POLES: 2 vertical Parts 0.3×7.5×0.3, Metal, Color3.fromRGB(170,170,175)
BACK PANEL: Part 5.5×6×0.15, Glass, Color3.fromRGB(190,210,220) Transparency 0.3
SIDE PANEL: Part 0.15×6×2.5, Glass, same
BENCH: Part 4×0.3×1 attached to back panel at seat height, Metal
SCHEDULE DISPLAY: Part 2×3×0.1 on back panel, with SurfaceGui
ROUTE SIGN: Part 1.5×0.5×0.1 at roof edge, colored
LIGHTING: Part under roof, glow
TRASH CAN: small cylinder Part beside shelter

PRO TIP: The glass panels and metal frame define the modern bus shelter. A schedule/route map adds realism.

────────────────────────────────────────────────────────────────────────────────
8.08 PHONE BOOTH (BRITISH RED)
────────────────────────────────────────────────────────────────────────────────
Part count: 10-14 | Size: 3×8×3 studs

FRAME: 4 corner pillar Parts 0.3×7×0.3, Metal, Color3.fromRGB(200,30,30) — iconic red
WALLS: 4 Part panels between pillars, same red
GLASS PANELS: 8 Parts (2 per side in upper section), Glass, Transparency 0.5
  Divided by horizontal bar at mid-height
CROWN: decorative top Part, domed, same red
PHONE: small box Part on interior wall with handset (small cylinder)
FLOOR: Part 2.5×0.2×2.5, Concrete, Color3.fromRGB(80,80,85)
DOOR: one wall section with hinge detail
VENTILATION: small Parts at top of each side wall
SIGNAGE: "TELEPHONE" text on crown via SurfaceGui

PRO TIP: The crown shape at the top and the specific British red are what make this iconic. Glass panels should be divided into panes.

────────────────────────────────────────────────────────────────────────────────
8.09 DUMPSTER
────────────────────────────────────────────────────────────────────────────────
Part count: 6-9 | Size: 5×4×3 studs

BODY: Part 5×3.5×3, Metal, Color3.fromRGB(40,80,50) — dark green (or blue)
LID: 2 Parts (split lid) 2.4×0.2×3 each, hinged at top, same color
  Can be shown partially open (one lid angled)
SIDE POCKETS: 2 recessed Parts on short ends for fork lift slots
WHEELS: 4 small cylinders at bottom corners, Concrete, Color3.fromRGB(35,35,35)
DRAIN PLUG: small Part on one side at bottom
LABEL: SurfaceGui with waste company name
RUST SPOTS: 1-2 small Parts in darker color, Color3.fromRGB(100,60,30)

PRO TIP: Split lids (2 that open independently) and forklift pockets on the sides are the details that sell it.

────────────────────────────────────────────────────────────────────────────────
8.10 TRASH CAN
────────────────────────────────────────────────────────────────────────────────
Part count: 3-5 | Size: 1.5×3×1.5 studs

BODY: Cylinder 1.5×2.5×1.5, Metal, Color3.fromRGB(90,95,90) — gray-green
LID: Cylinder 0.3×1.6×1.6 slightly wider than body, same color
LINER BAG: visible top edge, thin Part, Color3.fromRGB(20,20,20) — black
FOOT PEDAL: small Part at base front (for step-open cans)
HANDLE: thin Part on lid top (for pull-open cans)

PRO TIP: A slightly open lid with visible liner bag (black Part peeking out) makes it instantly recognizable.

────────────────────────────────────────────────────────────────────────────────
8.11 BOLLARD
────────────────────────────────────────────────────────────────────────────────
Part count: 2-3 | Size: 0.8×3×0.8 studs

POST: Cylinder 0.8×3×0.8, Metal or Concrete
  Color3.fromRGB(60,60,65) — dark metal or Color3.fromRGB(180,175,165) — concrete
CAP: slightly wider dome Part on top
REFLECTIVE STRIP: thin band Part at 2/3 height, Color3.fromRGB(255,200,50) — yellow
  Or reflective red: Color3.fromRGB(200,30,30)

PRO TIP: Bollards come in groups. Place 3-5 in a row, evenly spaced. They define boundaries.

────────────────────────────────────────────────────────────────────────────────
8.12 BIKE RACK
────────────────────────────────────────────────────────────────────────────────
Part count: 5-10 | Size: 8×3×2 studs

INVERTED U-HOOPS: 3-4 U-shaped metal structures in a row
  Each U: 2 vertical Parts + 1 curved/horizontal Part connecting at top
  Metal, Color3.fromRGB(170,170,175) — galvanized steel
BASE RAIL: horizontal Part connecting all U-hoops at ground level
GROUND BOLTS: small Parts at each leg base
BIKE (optional): simplified bike shape locked to one hoop

PRO TIP: The inverted-U (staple) style is most common. Space hoops 2 studs apart. Usually mounted to ground or on a base rail.

────────────────────────────────────────────────────────────────────────────────
8.13 STATUE (ON PEDESTAL)
────────────────────────────────────────────────────────────────────────────────
Part count: 10-16 | Height: 10-15 studs

PEDESTAL BASE: Part 5×1×5, Concrete, Color3.fromRGB(190,185,175)
PEDESTAL SHAFT: Part 3×4×3, Concrete, Color3.fromRGB(195,190,180)
PEDESTAL CAP: Part 4×0.5×4 — transition between shaft and figure
FIGURE: 8-12 Parts forming humanoid shape
  Material: Concrete, Color3.fromRGB(140,160,150) — bronze-green patina
  Or Metal, Color3.fromRGB(120,90,50) — bronze
  Head, torso, arms (one raised), legs, base
  Flowing cape or robes: thin curved Part behind figure
PLAQUE: flat Part on pedestal front, Metal, Color3.fromRGB(170,140,50)
  SurfaceGui with name/date
FENCE (optional): 4 low post + chain Parts around pedestal

PRO TIP: The pedestal is often taller than the figure. Bronze patina (green-tinted metal) looks more realistic than solid gray.

────────────────────────────────────────────────────────────────────────────────
8.14 FOUNTAIN
────────────────────────────────────────────────────────────────────────────────
Part count: 12-20 | Size: 10×6×10 studs

BASIN (lowest tier): large Cylinder 0.8×10×10, Concrete, Color3.fromRGB(190,185,175)
WATER IN BASIN: Cylinder 0.2×9.5×9.5, Glass, Color3.fromRGB(80,150,200) Transparency 0.3
MIDDLE TIER: smaller Cylinder 0.6×5×5, Concrete, raised on pedestal Part
UPPER TIER: smallest Cylinder 0.5×3×3, Concrete, on another pedestal
CENTERPIECE: figure or ornament at top — sphere, animal, or abstract shape
  Metal or Concrete, Color3.fromRGB(130,145,135)
WATER SPOUTS: 4 small nozzle Parts on middle tier, pointing outward
FALLING WATER: thin Parts from each tier edge down, Glass, Transparency 0.5
  ParticleEmitter for spray
CENTRAL JET: thin vertical Part from centerpiece going up
PEDESTAL COLUMNS: Parts supporting each tier
POOL EDGE: decorative rim around base basin (wider edge Part)
DRAIN: small Part in basin floor

PRO TIP: Multiple tiers with water cascading between them. The centerpiece/sculpture on top gives it personality. ParticleEmitter for spray.

────────────────────────────────────────────────────────────────────────────────
8.15 FLAGPOLE
────────────────────────────────────────────────────────────────────────────────
Part count: 4-6 | Height: 15 studs

POLE: Cylinder 0.3×15×0.3, Metal, Color3.fromRGB(200,200,200) — aluminum
FINIAL: small sphere or eagle Part at top, Metal, Color3.fromRGB(200,170,50) — gold
FLAG: thin Part 4×2.5×0.05, Fabric, colored (country/team colors)
  Angled slightly as if in wind (rotate 10-20 degrees)
HALYARD (rope): thin Part running down pole side
CLEAT: small Part at eye level on pole for tying halyard
BASE: wider Part at ground level, Concrete, Color3.fromRGB(180,175,165)

PRO TIP: Flag should be angled as if there's wind, not hanging limp. The finial (ball/eagle) on top is a must.

────────────────────────────────────────────────────────────────────────────────
8.16 VENDING MACHINE
────────────────────────────────────────────────────────────────────────────────
Part count: 7-10 | Size: 3×6×2 studs

BODY: Part 3×6×2, Metal, Color3.fromRGB(30,50,150) — brand blue (or red)
DISPLAY WINDOW: Part 2.5×3×0.15, Glass, Transparency 0.4
  Shows product silhouettes inside (small colored Parts visible through glass)
PRODUCT EXAMPLES: 3-4 tiny Parts behind glass
COIN SLOT: small Part at mid-right, Metal, Color3.fromRGB(160,160,160)
DISPENSING SLOT: dark Part at bottom, Color3.fromRGB(20,20,20)
  Flap: thin Part over slot
BRAND PANEL: colored Part at top above window, with SurfaceGui logo
LIGHT: Part inside machine glowing (backlit display feel)
CORD: thin Part from back to wall/ground (power)

PRO TIP: The backlit display window with products visible inside is what sells it. Dark dispensing slot at the bottom.

────────────────────────────────────────────────────────────────────────────────
8.17 PARKING METER
────────────────────────────────────────────────────────────────────────────────
Part count: 4-6 | Height: 4 studs

POLE: Cylinder 0.3×3×0.3, Metal, Color3.fromRGB(100,100,105)
HEAD: Part 1×1.2×0.8, Metal, Color3.fromRGB(120,120,125) — gray
DISPLAY WINDOW: small Part on front face, Glass
  Time display: SurfaceGui with numbers
COIN SLOT: tiny Part on top edge
MOUNTING: small Part connecting head to pole

PRO TIP: Small and simple — the distinctive head shape on a thin pole is all you need. Often in rows along a street.

────────────────────────────────────────────────────────────────────────────────
8.18 NEWSPAPER BOX
────────────────────────────────────────────────────────────────────────────────
Part count: 5-7 | Size: 1.5×4×1.5 studs

BODY: Part 1.5×3×1.5, Metal, Color3.fromRGB(30,50,180) — blue or yellow
COIN MECHANISM: small Part on upper front, Metal
WINDOW: small Glass Part showing newspaper inside
DOOR: Part 1.3×2×0.15 front panel, handle at top
HANDLE: thin Part across top of door
LEGS: 4 short Parts at bottom, Metal
NEWSPAPER VISIBLE: flat white/gray Part through window

PRO TIP: The boxy shape with window showing papers inside is distinctive. Usually found in groups on sidewalks.

────────────────────────────────────────────────────────────────────────────────
8.19 PLANTER BOX
────────────────────────────────────────────────────────────────────────────────
Part count: 5-10 | Size: 4×2.5×2 studs

BOX: 5 Parts forming open-top box (4 sides + bottom)
  Material: Concrete or Wood
  Concrete: Color3.fromRGB(170,165,155) — urban planter
  Wood: WoodPlanks, Color3.fromRGB(130,90,50) — garden planter
SOIL: Part 3.6×0.3×1.6 inside, Concrete, Color3.fromRGB(70,50,30)
PLANTS: 3-5 green sphere/bush Parts rising from soil
  Color3.fromRGB(50,110,40) — greenery
FLOWERS: optional small colored Parts among plants
DRAINAGE HOLES: tiny Parts on bottom (optional)
TRIM: edge Parts along top rim

PRO TIP: The plants/flowers rising above the box edge sell the prop. An empty planter box is boring.

────────────────────────────────────────────────────────────────────────────────
8.20 MANHOLE COVER
────────────────────────────────────────────────────────────────────────────────
Part count: 2-4 | Size: 3×0.2×3 studs (flush with ground)

COVER: Cylinder 0.15×3×3, Metal, Color3.fromRGB(80,80,85) — cast iron
  Slightly recessed into ground (0.05 studs below surface)
PATTERN: SurfaceGui or thin Parts forming grid/text pattern on top
  Utility name text, diamond grip pattern, or city seal
RIM: Cylinder 0.1×3.3×3.3 slightly larger, same metal, slightly lighter
  This is the frame in the street
KEYHOLE: tiny Part for pry-bar opening

PRO TIP: Manhole covers sit flush with or slightly below the surrounding ground. The textured pattern on top prevents slipping.


════════════════════════════════════════════════════════════════════════════════
 SECTION 9: FOOD & CONTAINERS (10 Types)
════════════════════════════════════════════════════════════════════════════════

────────────────────────────────────────────────────────────────────────────────
9.01 PIZZA
────────────────────────────────────────────────────────────────────────────────
Part count: 6-10 | Size: 4×0.5×4 studs

CRUST BASE: Cylinder 0.3×4×4, Concrete, Color3.fromRGB(210,170,100) — golden crust
SAUCE LAYER: Cylinder 0.05×3.5×3.5 on top, Color3.fromRGB(180,50,30) — red sauce
CHEESE LAYER: Cylinder 0.05×3.4×3.4 on top, Color3.fromRGB(240,210,100) — melted cheese
TOPPINGS: 6-8 small Parts scattered:
  Pepperoni: small red discs, Color3.fromRGB(160,40,30)
  Olive: tiny dark circles, Color3.fromRGB(30,25,20)
  Mushroom: small tan Parts, Color3.fromRGB(200,180,140)
CRUST EDGE: slightly taller ring around the edge (0.1 stud taller)
MISSING SLICE: can cut a triangular section out for realism
PLATE/BOX: flat Part or box Parts underneath

PRO TIP: Layered construction (base → sauce → cheese → toppings) is key. A few missing slices make it look real and lived-in.

────────────────────────────────────────────────────────────────────────────────
9.02 BURGER
────────────────────────────────────────────────────────────────────────────────
Part count: 7-10 | Size: 2×2.5×2 studs

BOTTOM BUN: half-sphere Part 2×0.6×2, Color3.fromRGB(210,170,90) — golden
PATTY: Cylinder 0.4×1.8×1.8, Color3.fromRGB(100,60,30) — brown meat
CHEESE: slightly larger thin Part 0.1×2×2, draped (angled), Color3.fromRGB(240,200,50)
LETTUCE: thin wavy Part extending slightly past edges, Color3.fromRGB(70,140,40)
TOMATO: thin red disc Part 0.1×1.5×1.5, Color3.fromRGB(200,50,40)
TOP BUN: half-sphere Part 2×0.8×2, Color3.fromRGB(200,160,80)
SESAME SEEDS: tiny white Parts on top bun, Color3.fromRGB(240,235,210)
WRAPPER/PLATE: flat Part underneath

PRO TIP: Stack with visible layers — each ingredient should extend slightly past the ones below it. The cheese should drape over the edge of the patty.

────────────────────────────────────────────────────────────────────────────────
9.03 CAKE
────────────────────────────────────────────────────────────────────────────────
Part count: 8-14 | Size: 3×3×3 studs (tiered wedding) or 3×2×3 (birthday)

BOTTOM TIER: Cylinder 0.8×3×3, Concrete, Color3.fromRGB(245,240,235) — white frosting
MIDDLE TIER: Cylinder 0.7×2.3×2.3, same color
TOP TIER: Cylinder 0.6×1.5×1.5, same
FROSTING DRIPS: small Parts on tier edges, slightly off-white
DECORATIONS: small colored Parts (flowers, beads, etc.)
  Color3.fromRGB(200,100,150) — pink flowers
  Color3.fromRGB(255,220,50) — gold accents
CANDLES (birthday): 5-8 thin cylinder Parts on top, various colors
  Flame: tiny Neon Parts on candle tips, Color3.fromRGB(255,200,50)
TOPPER: small figurine or star Part on very top
CAKE STAND: Cylinder pedestal Part, Metal, Color3.fromRGB(200,200,205)
SLICE CUT (optional): wedge removed showing interior layers

PRO TIP: Tiered cakes need visible tiers of decreasing size. Birthday cakes need candles. The decoration style defines the occasion.

────────────────────────────────────────────────────────────────────────────────
9.04 SUSHI PLATTER
────────────────────────────────────────────────────────────────────────────────
Part count: 10-16 | Size: 6×1×3 studs

PLATTER: Part 6×0.2×3, Wood, Color3.fromRGB(50,35,20) — dark lacquer
NIGIRI (3 pieces): each = rice Part 0.5×0.4×1 (white) + fish Part 0.6×0.1×1.2 on top
  Salmon: Color3.fromRGB(230,120,80) — orange
  Tuna: Color3.fromRGB(180,50,60) — red
  Shrimp: Color3.fromRGB(230,160,120) — pink
MAKI ROLLS (4 pieces): each = Cylinder 0.6×0.6×0.6
  Exterior: Color3.fromRGB(20,30,15) — nori/seaweed dark green
  Interior: Color3.fromRGB(240,235,225) — rice white with center color
WASABI: small mound Part, Color3.fromRGB(120,180,70) — green
GINGER: small flat Part, Color3.fromRGB(230,180,160) — pink
SOY SAUCE: small dish Part 0.8×0.2×0.8 with dark liquid Part inside
CHOPSTICKS: 2 very thin Parts 0.05×0.05×3, Wood, Color3.fromRGB(140,100,55)

PRO TIP: Variety of sushi types on one platter — nigiri, maki, and garnishes (wasabi, ginger). The dark wooden platter contrasts with colorful fish.

────────────────────────────────────────────────────────────────────────────────
9.05 ICE CREAM (CONE)
────────────────────────────────────────────────────────────────────────────────
Part count: 4-7 | Height: 3 studs

CONE: cone/pyramid Part 1×1.5×1, Color3.fromRGB(210,170,90) — waffle cone
  Waffle pattern: SurfaceGui or thin crossed Parts
SCOOP 1 (bottom): sphere Part 1.2×1.2×1.2
  Color3.fromRGB(230,190,140) — vanilla
SCOOP 2 (top): sphere Part 1×1×1
  Color3.fromRGB(160,80,60) — chocolate
  Or: Color3.fromRGB(230,150,170) — strawberry
DRIP: small Part running down cone side, same as top scoop color
SPRINKLES: tiny colored Parts on scoops (optional)
CHERRY: small red sphere on top (optional)

PRO TIP: Multiple scoops of different colors stacked. Slight melt/drip detail makes it look delicious.

────────────────────────────────────────────────────────────────────────────────
9.06 POTION BOTTLE
────────────────────────────────────────────────────────────────────────────────
Part count: 4-7 | Height: 2 studs

BOTTLE BODY: sphere or Part 1.2×1.2×1.2, Glass, Transparency 0.3
  Color depends on potion type:
  Health: Color3.fromRGB(200,30,30) — red
  Mana: Color3.fromRGB(50,50,200) — blue
  Poison: Color3.fromRGB(50,180,50) — green
  Strength: Color3.fromRGB(200,150,30) — gold
NECK: Cylinder 0.3×0.5×0.3, Glass, same color
CORK: small Part 0.4×0.3×0.4, Wood, Color3.fromRGB(160,130,80)
LIQUID GLOW: inner Part with Neon material, same base color
  Add PointLight with matching color, Range 5
LABEL: tiny Part on bottle front (optional)
BUBBLES: 2-3 tiny sphere Parts inside, slightly lighter color

PRO TIP: Glass transparency with inner glow makes potions magical. The cork and round body are classic fantasy style.

────────────────────────────────────────────────────────────────────────────────
9.07 TREASURE CHEST
────────────────────────────────────────────────────────────────────────────────
Part count: 8-12 | Size: 3×2.5×2 studs

BASE: Part 3×1.5×2, Wood, Color3.fromRGB(110,70,35) — dark wood
LID: Part 3×1×2 with rounded top (half cylinder for barrel lid)
  Same wood color, or use Part + half-cylinder on top
METAL BANDS: 3 thin Parts across front and lid, Metal, Color3.fromRGB(160,140,50) — brass
LOCK: small Part at front center, Metal, Color3.fromRGB(170,145,55)
  Keyhole: tiny dark Part in lock
HINGES: 2 small Parts at back where lid meets base, Metal
LID shown slightly open: rotate lid Part 20-30 degrees back
GOLD GLOW: from inside when open — Part with Neon material, Color3.fromRGB(255,220,80)
  PointLight, warm gold color
COINS: small gold Parts visible inside, scattered
JEWELS: tiny colored Parts (ruby red, sapphire blue, emerald green)

PRO TIP: A slightly open lid with golden glow spilling out is the iconic treasure chest look. Metal banding on the wood is essential.

────────────────────────────────────────────────────────────────────────────────
9.08 BARREL
────────────────────────────────────────────────────────────────────────────────
Part count: 4-6 | Size: 2×3×2 studs

BODY: Cylinder 2×3×2, WoodPlanks, Color3.fromRGB(130,85,45) — barrel wood
  Slight bulge at middle: middle section cylinder slightly wider (2.2)
METAL BANDS: 3 thin cylinder Parts (rings) around barrel
  At top, middle, and bottom
  Metal, Color3.fromRGB(80,80,85) — iron
TOP: Cylinder disc 0.1×2×2, WoodPlanks, Color3.fromRGB(140,95,50)
BUNG HOLE: tiny dark circle Part on side
STAVE LINES: very thin vertical lines on body (optional SurfaceGui)

PRO TIP: The metal bands (hoops) are what make a barrel vs just a cylinder. The slight bulge in the middle adds realism.

────────────────────────────────────────────────────────────────────────────────
9.09 CRATE (WOODEN)
────────────────────────────────────────────────────────────────────────────────
Part count: 6-10 | Size: 3×3×3 studs

SIDES: 6 Parts (or 5 if open-top), WoodPlanks, Color3.fromRGB(170,140,90)
  Each side 0.3 studs thick
SLAT PATTERN: 2-3 horizontal boards per side with thin gaps
  Alternatively: solid sides with cross-brace Parts
CORNER REINFORCEMENT: thin Parts at each corner edge
  Slightly darker wood: Color3.fromRGB(140,110,70)
STENCIL: SurfaceGui on one side (shipping marks, arrows, "FRAGILE")
NAILS: tiny dark dots at board intersections (optional)
LID: separate Part on top, can be shown removed

PRO TIP: Wooden slat pattern with visible gaps between boards. Corner reinforcement and stencil markings add detail. Stack multiple crates.

────────────────────────────────────────────────────────────────────────────────
9.10 SACK OF GOLD
────────────────────────────────────────────────────────────────────────────────
Part count: 5-8 | Size: 2×2×1.5 studs

BAG: Part 2×1.5×1.5 with rounded/soft shape (or sphere-ish), Fabric
  Color3.fromRGB(180,150,80) — burlap tan
  Slightly lumpy — multiple Parts for organic shape
OPENING: top of bag open — dark interior Part visible
TIE: thin cylinder Part cinching the opening
  Color3.fromRGB(130,100,50) — rope
COINS SPILLING: 4-6 small disc Parts, Metal, Color3.fromRGB(220,190,50) — gold
  Some on top of bag, some fallen beside it
COIN STACK: small stack of 3-4 discs beside bag
DOLLAR SIGN: optional SurfaceGui or shaped Part on bag face

PRO TIP: Gold coins visibly spilling from the open top. The burlap texture and rope tie complete the fantasy treasure look.


════════════════════════════════════════════════════════════════════════════════
 SECTION 10: GAME ELEMENTS (15 Types)
════════════════════════════════════════════════════════════════════════════════

────────────────────────────────────────────────────────────────────────────────
10.01 SPAWN PAD
────────────────────────────────────────────────────────────────────────────────
Part count: 4-7 | Size: 6×0.5×6 studs

BASE: SpawnLocation Part 6×1×6, Concrete, Color3.fromRGB(50,150,50) — team color or green
  Property: AllowTeamChangeOnTouch, Neutral, Duration
PLATFORM: Part 6.5×0.3×6.5 slightly larger, under SpawnLocation
  Color3.fromRGB(40,40,45) — dark frame
GLOW RING: thin Part frame around base, Neon, team color
ARROWS/CHEVRON: 4 directional thin Parts or SurfaceGui showing spawn direction
PARTICLE: ParticleEmitter on base for spawn effect (sparkles, teleport look)
BEAM LIGHT: vertical thin Part going upward (location beacon)

PRO TIP: The SpawnLocation Part is functional — all decoration builds around it. Add visual beacon so players can find it. Team color coding is important.

────────────────────────────────────────────────────────────────────────────────
10.02 CHECKPOINT
────────────────────────────────────────────────────────────────────────────────
Part count: 5-10 | Size: 6×8×1 studs (archway)

POSTS: 2 vertical Parts 0.8×7×0.8, Metal, Color3.fromRGB(240,200,30) — yellow
  Or use team color
CROSSBAR: Part 5×0.8×0.8 connecting post tops, same color
BANNER: thin Part 4×2×0.1 hanging from crossbar, Fabric, team color
  SurfaceGui with checkpoint number
FLAG ELEMENTS: 2 small flag Parts on post tops
TOUCH DETECTOR: transparent Part (Transparency 1) between posts
  Script fires on Touched to save progress
BASE: thin Parts at post bottoms, Concrete
LIGHT: glowing Part on crossbar with PointLight
ACTIVATED STATE: changes color when touched (e.g., red to green)

PRO TIP: Checkpoints should be visually prominent — players need to see them from a distance. Color change on activation gives feedback.

────────────────────────────────────────────────────────────────────────────────
10.03 FINISH LINE
────────────────────────────────────────────────────────────────────────────────
Part count: 6-10 | Size: 10×8×1 studs

POSTS: 2 tall Parts 1×8×1, Metal, Color3.fromRGB(30,30,35)
CHECKERED BANNER: Part 8×3×0.15 between posts
  Black and white checkered pattern: SurfaceGui or alternating small Parts
  Color3.fromRGB(240,240,240) and Color3.fromRGB(20,20,20)
GROUND LINE: Part 10×0.1×1 on ground, same checkered pattern
CONFETTI EMITTER: ParticleEmitter that fires when player crosses
TIMER DISPLAY: Part above banner with SurfaceGui showing time
CELEBRATION LIGHTS: colored Parts along posts
DETECTOR: transparent Part for finishing trigger

PRO TIP: The checkered pattern is universal for finish lines. Confetti/celebration effect on crossing makes it feel rewarding.

────────────────────────────────────────────────────────────────────────────────
10.04 COIN PICKUP
────────────────────────────────────────────────────────────────────────────────
Part count: 3-5 | Size: 1.5×1.5×0.3 studs

COIN: Cylinder 0.2×1.5×1.5, Metal, Color3.fromRGB(240,210,50) — gold
  Can be rotated (spinning animation via script)
INNER DETAIL: slightly smaller disc with embossed design or $ symbol
  SurfaceGui on both faces
GLOW: Neon material on coin OR PointLight around it
  Color warm gold, Range 5
SPARKLE: ParticleEmitter with small gold sparkles
SHADOW: small dark transparent Part on ground below
SOUND: collect sound effect on Touched
RESPAWN: destroy on touch, respawn after delay (script)

PRO TIP: Spinning animation + sparkle particles + collection sound = satisfying pickup. Gold color with warm glow. Float slightly above ground.

────────────────────────────────────────────────────────────────────────────────
10.05 HEALTH PICKUP
────────────────────────────────────────────────────────────────────────────────
Part count: 4-6 | Size: 2×2×2 studs

CROSS SHAPE: 2 Parts forming plus sign (+), 2×0.5×0.5 each
  Neon material, Color3.fromRGB(255,50,50) — red cross
  Or Color3.fromRGB(50,255,50) — green health
CONTAINER: transparent sphere Part around cross, Glass, Transparency 0.5
  Color3.fromRGB(255,200,200) slight red tint
GLOW: PointLight, Color matching pickup type, Range 8
FLOAT ANIMATION: script to bob up and down gently
SPARKLE: ParticleEmitter, same color
HEAL AMOUNT: configurable via attribute or NumberValue

PRO TIP: The red/green cross inside a translucent sphere is instantly recognizable. Bobbing animation draws the eye.

────────────────────────────────────────────────────────────────────────────────
10.06 SPEED BOOST
────────────────────────────────────────────────────────────────────────────────
Part count: 4-7 | Size: 6×0.3×4 studs (floor pad)

PAD: Part 6×0.3×4, Neon, Color3.fromRGB(50,150,255) — electric blue
ARROWS: 3 chevron-shaped Parts pointing forward on pad surface
  Color3.fromRGB(100,200,255) — lighter blue
  Each arrow: 2 thin Parts forming > shape
SIDE RAILS: thin glowing Parts along pad edges, Neon
PARTICLE TRAIL: ParticleEmitter shooting forward (wind/speed lines)
SOUND: woosh sound effect when activated
SPEED MULTIPLIER: WalkSpeed boost for 3-5 seconds (script)

PRO TIP: Directional arrows show which way the boost goes. Blue is the universal color for speed. The whoosh particles reinforce the feeling.

────────────────────────────────────────────────────────────────────────────────
10.07 JUMP PAD
────────────────────────────────────────────────────────────────────────────────
Part count: 4-7 | Size: 4×0.5×4 studs

PAD: Part 4×0.5×4, Neon, Color3.fromRGB(50,255,100) — green
  Or Cylinder for round pad
SPRING VISUAL: Part 1×0.3×1 on top showing coil/spring
  Color3.fromRGB(200,200,50) — yellow
UP ARROW: vertical arrow Part or SurfaceGui pointing up
BOUNCE EFFECT: brief compress then expand animation (TweenService)
PARTICLES: upward-shooting ParticleEmitter on bounce
SOUND: spring/bounce sound effect
FORCE: VectorForce or BodyVelocity applied upward (script)

PRO TIP: Visual feedback is critical — the pad should animate (compress) when used. Upward particles show the trajectory. Green = go/jump universally.

────────────────────────────────────────────────────────────────────────────────
10.08 TELEPORTER
────────────────────────────────────────────────────────────────────────────────
Part count: 6-10 | Size: 4×6×4 studs (portal)

FRAME: ring of Parts forming oval/circle, Metal, Color3.fromRGB(100,100,110)
  Or 2 vertical posts + arch top
PORTAL SURFACE: Part filling frame interior, Neon
  Color3.fromRGB(120,50,200) — purple teleport energy
  Transparency 0.3, with swirling ParticleEmitter
BASE: platform Part 4×0.5×4, Concrete
GLOW: PointLight, purple, Range 12
PARTICLES: swirl effect using ParticleEmitter with SpreadAngle
DESTINATION INDICATOR: SurfaceGui or floating text showing where it goes
PAIRED TELEPORTER: must have matching teleporter at destination
SOUND: sci-fi teleport sound on use
COOLDOWN VISUAL: brief color change after use

PRO TIP: The swirling particle effect inside the frame is what makes it look like a portal. Purple is the classic teleport color. Must show destination.

────────────────────────────────────────────────────────────────────────────────
10.09 LAVA FLOOR
────────────────────────────────────────────────────────────────────────────────
Part count: 5-10 | Size: varies (floor segments)

LAVA SURFACE: Part (any size), Neon, Color3.fromRGB(255,80,20) — bright orange-red
  Alternatively use multiple Parts with varying shades:
  Color3.fromRGB(255,100,20), Color3.fromRGB(255,60,10), Color3.fromRGB(200,40,5)
CRUST: darker Parts floating on surface, Concrete, Color3.fromRGB(40,30,25)
  Irregular shapes, some with glowing cracks between them
GLOW: strong PointLight beneath/on surface, orange, Range 15
HEAT SHIMMER: ParticleEmitter with wavy transparent particles
DAMAGE SCRIPT: Touched event applies damage (Humanoid:TakeDamage)
  kill on contact or damage-over-time
BUBBLES: small Parts that briefly appear and disappear (TweenService)
EDGE ROCKS: dark rock Parts along lava boundaries

PRO TIP: Multiple shades of orange/red with dark crust pieces floating on top. The Neon material provides self-illumination. MUST damage on touch.

────────────────────────────────────────────────────────────────────────────────
10.10 SPIKE TRAP
────────────────────────────────────────────────────────────────────────────────
Part count: 8-15 | Size: 4×2×4 studs

BASE: Part 4×0.5×4, Metal, Color3.fromRGB(80,80,85) — dark metal
SPIKES: 9-16 thin cone Parts in grid pattern, each 0.2×1.5×0.2
  Metal, Color3.fromRGB(160,160,165) — steel
  Tips: slightly brighter, Color3.fromRGB(200,200,205)
  Spaced evenly in 3×3 or 4×4 grid
MECHANISM (visible): gear or spring Parts under base (shown if trap is exposed)
  Color3.fromRGB(100,100,105)
BLOOD DETAIL (optional): small red Parts on some spike tips
  Color3.fromRGB(150,20,20)
TRIGGER: pressure plate in front (slightly raised Part, different color)
ANIMATION: spikes rise from base using TweenService (initially hidden)
SOUND: metallic slam when triggered
DAMAGE: same as lava — Humanoid damage on contact

PRO TIP: Spikes should be SHARP (thin cones, not cylinders). The pressure plate trigger should be subtly visible. Animation of spikes rising up is scariest.

────────────────────────────────────────────────────────────────────────────────
10.11 PRESSURE PLATE
────────────────────────────────────────────────────────────────────────────────
Part count: 3-5 | Size: 3×0.3×3 studs

PLATE: Part 3×0.2×3, Metal or Concrete, Color3.fromRGB(150,145,135) — stone
  Slightly lighter than surrounding floor to be visible
  Slightly raised (0.1 studs above floor)
FRAME: thin Part border around plate, same material but darker
MECHANISM: click sound when stepped on
VISUAL FEEDBACK: plate sinks 0.1 studs and changes color slightly when activated
CONNECTION: script that triggers connected mechanism (door, trap, bridge)
INDICATOR: optional small gem/light Part on frame showing state

PRO TIP: Should be BARELY visible — the fun is discovering it. Slight color/height difference from surrounding floor. Click sound confirms activation.

────────────────────────────────────────────────────────────────────────────────
10.12 LEVER
────────────────────────────────────────────────────────────────────────────────
Part count: 4-6 | Size: 1×3×1 studs

BASE PLATE: Part 1.5×0.3×1, Metal or Concrete, Color3.fromRGB(100,95,85)
  Mounted on wall or floor
SLOT: thin Part with groove for lever to move through
HANDLE: cylinder or Part 0.2×2×0.2, Metal, Color3.fromRGB(80,80,85)
KNOB: sphere Part at handle end, Metal, Color3.fromRGB(180,40,40) — red
  Or: Color3.fromRGB(50,50,55) — dark
MOUNT: Part connecting lever base to wall/floor
ANIMATION: lever rotates between up/down positions (HingeConstraint or TweenService)
SOUND: clunk sound on toggle
STATE INDICATOR: optional light that changes (red = off, green = on)

PRO TIP: The knob/ball at the end of the handle makes it grabbable-looking. Satisfying clunk sound and visual state change on toggle.

────────────────────────────────────────────────────────────────────────────────
10.13 LADDER
────────────────────────────────────────────────────────────────────────────────
Part count: 8-15 | Size: 2×variable×0.3 studs

SIDE RAILS: 2 vertical Parts 0.2×height×0.2, Metal, Color3.fromRGB(160,160,165)
  Spacing: 1.8 studs apart
RUNGS: horizontal Parts every 1.5 studs, 0.15×0.15×1.8
  Same metal, or Wood for rustic: Color3.fromRGB(140,100,55)
  For a 10-stud ladder: ~7 rungs
WALL MOUNT: 2-3 bracket Parts connecting top to wall
ANTI-SLIP: very thin Parts on rungs for grip texture (optional)
CLIMBING: use TrussConstraint or custom climbing script
  Player attaches to ladder and can move up/down

PRO TIP: Even rung spacing is critical. The ladder must be FUNCTIONAL (climbing works). Metal for industrial, wood for rustic/medieval.

────────────────────────────────────────────────────────────────────────────────
10.14 ZIPLINE
────────────────────────────────────────────────────────────────────────────────
Part count: 6-10 | Length: varies (20+ studs typically)

START PLATFORM: Part 4×0.5×4 at high point, Wood, Color3.fromRGB(140,100,55)
END PLATFORM: same at low point
CABLE: thin Part 0.1×0.1×length, Metal, Color3.fromRGB(130,130,135)
  Angled from high to low point with slight sag
HANDLE/TROLLEY: Part 1.5×0.5×0.5 that slides along cable
  Metal, Color3.fromRGB(200,200,205)
  T-bar handle: 2 Parts forming T-shape for gripping
SUPPORT POSTS: at each end — tall Parts, Wood or Metal
  Start post taller than end post (creates slope)
SAFETY NET (optional): mesh Part under landing area
LAUNCH PAD: trigger Part at start to begin ride
SCRIPT: BodyVelocity or TweenService moving player from start to end

PRO TIP: Cable must visually connect the two platforms with proper slope. The trolley handle is what the player "grabs." Landing area should be forgiving.

────────────────────────────────────────────────────────────────────────────────
10.15 TRAMPOLINE
────────────────────────────────────────────────────────────────────────────────
Part count: 6-10 | Size: 5×2×5 studs

FRAME: circular or octagonal frame, 5×0.5×5
  Metal, Color3.fromRGB(50,50,55) — black metal
LEGS: 6 short Parts from frame to ground, Metal
  Angled slightly outward for stability
SPRINGS: thin Parts connecting frame to mat edge (8-12)
  Metal, Color3.fromRGB(170,170,175)
MAT: Cylinder 0.1×4×4, Fabric, Color3.fromRGB(30,30,35) — black mat
  Slightly lower than frame (springs stretch down)
PADDING: colored Part on frame edge covering springs
  Color3.fromRGB(50,100,200) — blue safety pad
BOUNCE SCRIPT: Touched event applies upward BodyVelocity
  Force proportional to fall speed
ANIMATION: mat stretches down and rebounds (TweenService)
SOUND: spring bounce sound effect

PRO TIP: The mat is lower than the frame (suspended by springs). Safety padding covers the frame and springs. Bounce force should feel proportional.


════════════════════════════════════════════════════════════════════════════════
 UNIVERSAL BUILD QUALITY CHECKLIST
════════════════════════════════════════════════════════════════════════════════

Before completing ANY build, verify:

1. PART COUNT: Is it above the minimum listed? Under-parted builds look amateur.
2. MATERIALS: No SmoothPlastic. Every Part has an intentional material choice.
3. COLORS: Using specific RGB values, not default gray. Related parts share palettes.
4. SCALE: Does it match Roblox character proportions? (Character = 5 tall, 2 wide)
5. DETAIL: Are there trim pieces, handles, seams, or decorative elements?
6. DEPTH: Do surfaces have visible thickness? Walls should be 0.3-2 studs thick.
7. VARIETY: In groups, are there slight variations? (Trees aren't all identical)
8. ANCHORING: Are WeldConstraints used? Is only the root Part anchored?
9. LIGHTING: Do light sources have actual PointLight/SpotLight instances?
10. FUNCTIONALITY: Do interactive elements (doors, buttons, pickups) have scripts?

COMMON MISTAKES TO AVOID:
- Single-part anything (except tiny detail parts like bolts/screws)
- Perfectly flat, featureless surfaces
- Default gray color on visible Parts
- All Parts exactly the same shade of a color (need variation)
- Floating objects (no visible support/connection to ground)
- Paper-thin walls with no visible edge thickness
- Perfectly symmetrical organic objects (trees, rocks)
- Missing functional elements (doors that don't open, lights that don't glow)
- Ignoring the underside/back of objects (visible from certain angles)
- Scale errors (furniture sized for giants, vehicles too small for characters)
`
