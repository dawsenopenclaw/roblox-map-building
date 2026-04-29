/**
 * Interior Design Bible — teaches AI to build realistic room interiors in Roblox.
 * 100+ room types with exact furniture layouts, dimensions, materials, and positioning.
 */

export const INTERIOR_DESIGN_BIBLE: string = `
===========================================================================
INTERIOR DESIGN BIBLE — FORJEGAMES AI KNOWLEDGE BASE
===========================================================================
SCALE REFERENCE: 1 stud = ~0.28m (~11 inches). Average room height = 14-16 studs.
Average door = 8 studs tall x 4 studs wide. Average human = 5-6 studs tall.
All positions are [X, Y, Z] offsets from room origin at floor-level corner [0,0,0].
Y axis = vertical (up). Parts placed at Y = half their height to sit on floor.

===========================================================================
SECTION 1: RESIDENTIAL INTERIORS
===========================================================================

--- ROOM: MASTER BEDROOM ---
Dimensions: 40L x 32W x 14H studs
Floor: Material=WoodPlanks, Color=[180,140,100] (warm oak)
Walls: Material=Concrete, Color=[235,228,218] (off-white plaster)
Ceiling: Material=Concrete, Color=[245,242,238], Height=14
Color Palette: Warm neutrals — [235,228,218] [180,140,100] [90,70,50] [210,190,170] [60,55,50]

FURNITURE LIST:
King Bed Frame:
  Size: 28x3x20 studs (L x H x W)
  Material: Wood, Color=[90,70,50]
  Position: [14, 1.5, 10] -- centered on back wall, 2 studs from wall
  Parts: headboard 28x10x2 at [14,6,1], footboard 28x4x2 at [14,3,19], side rails 2x2x20 at [1,2,10] and [27,2,10]
  WeldConstraint: headboard+footboard+siderails all welded to frame base

Mattress:
  Size: 26x3x18 studs
  Material: Fabric, Color=[245,245,245]
  Position: [14, 4.5, 10]
  Anchored: true

Pillows (x4):
  Size: 6x2x5 studs each
  Material: Fabric, Color=[255,255,255]
  Positions: [5,6.5,3], [11,6.5,3], [17,6.5,3], [23,6.5,3]

Duvet/Blanket:
  Size: 24x1x14 studs (thin, covers lower 2/3 of bed)
  Material: Fabric, Color=[200,185,170]
  Position: [14, 6.2, 12]

Nightstand Left:
  Size: 6x8x5 studs
  Material: Wood, Color=[90,70,50]
  Position: [3, 4, 10]
  Drawer face: 5x3x1 at [3, 5, 5.5], Material=Wood, Color=[80,62,44]
  Drawer handle: 2x0.5x0.5 at [3, 5, 6], Material=Metal, Color=[180,160,120]

Nightstand Right:
  Size: 6x8x5 studs
  Material: Wood, Color=[90,70,50]
  Position: [25, 4, 10]

Table Lamp Left:
  Base: 1.5x5x1.5 studs, Material=Ceramic (use Marble), Color=[220,210,195]
  Position: [3, 9.5, 10]
  Shade: 4x3x4 studs (wedge/cylinder), Material=Fabric, Color=[240,230,215]
  Position: [3, 12, 10]
  Light: PointLight, Brightness=0.8, Range=16, Color=[255,240,210]

Wardrobe/Armoire:
  Size: 16x18x6 studs
  Material: Wood, Color=[100,78,56]
  Position: [36, 9, 16] -- against right wall
  Doors (x2): 7x16x1 at [33.5,9,16] and [38.5,9,16], Material=Wood, Color=[90,70,50]
  Handles: 0.5x2x0.5 at each door center, Material=Metal, Color=[180,160,120]
  Crown molding: 17x1x1 at [36,18.5,16], Material=Wood, Color=[80,62,44]

Dresser:
  Size: 14x10x6 studs
  Material: Wood, Color=[100,78,56]
  Position: [7, 5, 30] -- against side wall
  Drawers (x3 rows): Each 13x2.5x1, spaced 3 studs apart vertically
  Mirror above dresser: 10x12x0.5 at [7,17,30.5], Material=Glass, Color=[200,220,230]
  Mirror frame: Wood, Color=[90,70,50]

Vanity Chair:
  Seat: 4x2x4 studs, Material=Fabric, Color=[210,190,170]
  Legs (x4): 0.5x4x0.5 each, Material=Wood, Color=[90,70,50]
  Position: [7, 3, 24]

Rug:
  Size: 30x1x20 studs (thin, under bed area)
  Material: Fabric, Color=[160,130,100]
  Position: [14, 0.3, 12] -- slightly raised from floor

Window (back wall):
  Frame: 12x10x1, Material=Wood, Color=[235,228,218]
  Glass: 10x8x0.3, Material=Glass, Color=[180,210,230], Transparency=0.7
  Position: [14, 8, 0.5]
  Curtain Left: 3x12x1, Material=Fabric, Color=[195,180,165]
  Curtain Right: 3x12x1, Material=Fabric, Color=[195,180,165]

Ceiling Light (flush mount):
  Plate: 6x1x6, Material=Concrete, Color=[245,242,238]
  Position: [14, 13.5, 16]
  Light: PointLight, Brightness=1.2, Range=28, Color=[255,245,225]

DETAIL PROPS (make it feel lived-in):
1. Book stack on nightstand: 3 parts, each 4x1x3, Material=Fabric, Colors=[180,60,40],[60,100,160],[200,180,40]
2. Charging cable: thin 0.3x0.3x6 part, Material=Plastic(SmoothPlastic ok for cables), Color=[50,50,50], draping off nightstand
3. Glass of water: cylinder 1x3x1, Material=Glass, Color=[180,220,240], Transparency=0.6
4. Throw blanket folded at foot of bed: 16x3x4, Material=Fabric, Color=[140,110,90]
5. Framed photo on dresser: 3x4x0.5, Material=Wood frame, Color=[80,60,40]

LIGHTING SETUP:
Primary: PointLight at ceiling center, Brightness=1.2, Range=28, Color=[255,245,225]
Secondary: 2x PointLight from lamps, Brightness=0.6 each, Range=14, Color=[255,240,200]
Ambient feel: warm 3000K temperature

MISTAKES TO AVOID:
- Do NOT make the bed a single flat part — it needs frame, mattress, pillows, duvet as separate parts
- Do NOT use SmoothPlastic for wood furniture — use Wood or WoodPlanks
- Do NOT forget the rug — bare floor bedrooms look unfinished
- Do NOT place furniture floating — every piece must sit exactly on floor or on another surface
- Do NOT make the room box with nothing on walls — add at least 1 mirror, 1 window, 1 light fixture

--- ROOM: STANDARD BEDROOM (CHILD/TEEN) ---
Dimensions: 28L x 24W x 12H studs
Floor: Material=WoodPlanks, Color=[200,170,130]
Walls: Material=Concrete, Color=[230,235,245] (light blue-white)
Ceiling: Material=Concrete, Color=[245,245,248]
Color Palette: [230,235,245] [200,170,130] [80,130,200] [240,200,80] [220,80,80]

FURNITURE LIST:
Twin Bed Frame:
  Size: 20x3x12 studs
  Material: Wood, Color=[80,130,200]
  Position: [10, 1.5, 6] -- back-left corner
  Headboard: 20x8x2 at [10,5,1], Material=Wood, Color=[70,120,190]
  Mattress: 18x3x10, Material=Fabric, Color=[250,250,255]
  Pillow: 8x2x5, Material=Fabric, Color=[255,255,255]

Desk:
  Top: 16x1.5x8 studs, Material=WoodPlanks, Color=[200,170,130]
  Position: [22, 8, 4] -- right wall
  Legs (x4): 1x8x1, Material=Wood, Color=[170,140,110]
  Monitor: 8x6x1 at [22,12,3], Material=Concrete, Color=[30,30,30]
  Monitor stand: 3x1x2 at [22,10,3], Material=Concrete, Color=[40,40,40]
  Keyboard: 7x0.5x3 at [22,9.5,5], Material=Concrete, Color=[50,50,50]

Desk Chair:
  Seat: 5x2x5, Material=Fabric, Color=[80,130,200]
  Back: 5x6x1 at backside, Material=Fabric, Color=[80,130,200]
  Base (5-star): use 5x1x5 disc, Material=Metal, Color=[80,80,80]
  Stem: 1x5x1, Material=Metal, Color=[80,80,80]
  Position: [22, 4, 8]

Bookshelf:
  Size: 10x18x4 studs
  Material: Wood, Color=[170,140,110]
  Position: [4, 9, 22] -- back wall
  Shelves (x4): 9x1x4 at Y=3,7,11,15 inside
  Books (fill shelves): groups of 2x5x3 parts in varied colors

Toy Chest:
  Size: 10x6x6 studs
  Material: Wood, Color=[220,80,80]
  Lid: 10x1x6 at top, Material=Wood, Color=[200,70,70]
  Position: [4, 3, 4]

Rug:
  Size: 18x1x14, Material=Fabric, Color=[100,160,220]
  Position: [10, 0.3, 10]

Window:
  Frame: 10x10x1, Material=Wood, Color=[230,235,245]
  Glass: 8x8x0.3, Material=Glass, Transparency=0.7
  Position: [10, 6, 0.5]

Ceiling Light:
  Globe: 4x4x4 sphere-ish (use 4x4x4 block), Material=Glass, Color=[255,255,230], Transparency=0.4
  Chain: 0.5x3x0.5, Material=Metal, Color=[150,150,150]
  Position: [14, 11.5, 12]

DETAIL PROPS:
1. Backpack on floor: 4x6x3 parts, Material=Fabric, Color=[80,130,200]
2. Poster on wall: 6x8x0.2 part, Material=Fabric, Color=[80,180,240] (represents poster)
3. Stuffed animal on bed: 3x4x3, Material=Fabric, Color=[220,180,140]
4. Sneakers by door: 2 small 3x2x5 parts, Material=Fabric, Color=[255,255,255]
5. Sports trophy on shelf: 1x5x1 base + 2x2x2 figure, Material=Metal, Color=[200,170,40]

MISTAKES TO AVOID:
- Do NOT make child bedroom look like adult bedroom — brighter colors, toys, playful shapes
- Do NOT forget desk/study area — even children need it
- Do NOT skip detail props — empty rooms feel like demo builds

--- ROOM: KITCHEN ---
Dimensions: 36L x 28W x 14H studs
Floor: Material=Granite, Color=[80,75,72] (dark slate)
Walls: Material=Concrete, Color=[240,238,235] (light gray)
Backsplash (lower 4 studs behind counters): Material=Marble, Color=[220,215,208]
Ceiling: Material=Concrete, Color=[248,247,245]
Color Palette: [240,238,235] [80,75,72] [200,195,190] [30,30,30] [160,130,100]

FURNITURE LIST:
Base Cabinets (L-shaped layout):
  Long run (back wall): 30x12x7 studs
  Material: Wood, Color=[200,195,190]
  Position: [15, 6, 3] -- against back wall
  Cabinet doors (every 6 studs): 5x9x1, Material=Wood, Color=[195,190,185]
  Door handles: 3x0.5x0.5, Material=Metal, Color=[160,160,160]

Counter Top (back wall):
  Size: 30x1.5x7 studs
  Material: Marble, Color=[220,215,208]
  Position: [15, 12.5, 3]

Side Cabinets (right wall):
  Size: 8x12x7 studs
  Material: Wood, Color=[200,195,190]
  Position: [33, 6, 14]

Counter Top (right wall):
  Size: 8x1.5x7 studs
  Material: Marble, Color=[220,215,208]
  Position: [33, 12.5, 14]

Upper Cabinets (back wall, above counter):
  Size: 28x10x5 studs
  Material: Wood, Color=[200,195,190]
  Position: [14, 19, 2.5] -- 5 studs above counter
  Doors same style as base

Kitchen Island:
  Base: 16x12x7 studs, Material=Wood, Color=[160,130,100]
  Position: [18, 6, 16]
  Counter top: 17x1.5x8, Material=Granite, Color=[50,48,46]
  Position: [18, 12.5, 16]

Sink (in counter):
  Basin: 6x3x5 studs recessed into counter
  Material: Metal, Color=[160,165,170]
  Position: [10, 11, 3]
  Faucet: 1x5x4 studs (L-shape), Material=Metal, Color=[180,185,190]

Range/Stove:
  Body: 8x12x7 studs, Material=Metal, Color=[40,40,42]
  Position: [26, 6, 3]
  Burners (x4): 2x0.5x2 each, Material=Metal, Color=[30,30,30]
  Knobs (x4): 0.8x0.8x0.8 cylinders, Material=Metal, Color=[80,80,80]

Range Hood:
  Size: 10x6x6 studs
  Material: Metal, Color=[160,165,170]
  Position: [26, 20, 3]
  Underlight: SurfaceLight, Brightness=0.8, Color=[255,240,220]

Refrigerator:
  Size: 10x22x7 studs
  Material: Metal, Color=[200,200,202]
  Position: [4, 11, 3]
  Door handle: 1x14x1, Material=Metal, Color=[160,160,160]
  Freezer drawer bottom: line at Y=6

Dishwasher:
  Size: 8x12x7 studs
  Material: Metal, Color=[195,195,197]
  Position: [18, 6, 3]
  Control panel: 7x2x1, Material=Concrete, Color=[30,30,30]
  Position at top of front face

Bar Stools (x3 at island):
  Seat: 4x1.5x4, Material=Fabric, Color=[50,48,46]
  Legs (x4): 0.5x10x0.5, Material=Metal, Color=[120,120,120]
  Footrest: 4x0.5x0.5, Material=Metal, Color=[120,120,120]
  Positions: [14,12,20], [18,12,20], [22,12,20]

Pendant Lights over Island (x3):
  Shade: 3x3x3, Material=Metal, Color=[30,30,30]
  Cord: 0.3x6x0.3, Material=Concrete, Color=[30,30,30]
  Positions hanging from ceiling: [14,10,16], [18,10,16], [22,10,16]
  Each: PointLight, Brightness=0.9, Range=12, Color=[255,240,210]

DETAIL PROPS:
1. Fruit bowl on island: bowl 5x2x5 Material=Ceramic(Marble) Color=[220,215,208], fruit pieces (spheres 1.5x1.5x1.5) in red/yellow/green
2. Cutting board: 6x0.5x4, Material=WoodPlanks, Color=[200,170,120]
3. Knife block: 3x6x2, Material=WoodPlanks, Color=[120,90,60] with thin 0.3x5x0.5 knife handles
4. Dish towel over oven handle: 2x4x0.5 folded, Material=Fabric, Color=[200,200,200]
5. Coffee maker: 4x8x4, Material=Concrete, Color=[30,30,30] with glass carafe part

LIGHTING:
Primary ceiling: 2x PointLight at [12,13.5,14] and [26,13.5,14], Brightness=1.1, Range=20
Under-cabinet: SurfaceLight on underside of upper cabinets, Brightness=0.6, Color=[255,245,230]
Island pendants: 3x PointLight, Brightness=0.9 each

MISTAKES TO AVOID:
- Do NOT build a single counter top slab — break it into sections matching cabinet layout
- Do NOT forget the backsplash — kitchen walls behind counters need tile material
- Do NOT use Wood material for metal appliances — use Metal or CorrodedMetal for worn look
- Do NOT place all appliances on one wall — L or U-shaped layouts look realistic
- Do NOT skip the range hood — it's visually prominent and gives the kitchen purpose

--- ROOM: BATHROOM (STANDARD) ---
Dimensions: 18L x 16W x 12H studs
Floor: Material=Granite, Color=[120,115,110]
Walls: Material=Marble, Color=[230,228,225]
Ceiling: Material=Concrete, Color=[245,244,242]
Color Palette: [230,228,225] [120,115,110] [255,255,255] [160,160,165] [80,80,85]

FURNITURE LIST:
Bathtub:
  Tub body: 18x6x10 studs
  Material: Marble, Color=[248,246,244]
  Position: [9, 3, 5] -- along back wall
  Interior basin: 16x4x8, Material=Marble, Color=[240,238,236], slightly recessed
  Faucet: 1x4x3, Material=Metal, Color=[180,185,190]
  Drain: 1x0.5x1, Material=Metal, Color=[140,140,140]

Shower (separate corner):
  Base: 8x1x8, Material=Slate, Color=[80,78,76]
  Walls (3 sides): 8x12x0.5, Material=Glass, Color=[180,210,225], Transparency=0.5
  Shower head: 2x2x2, Material=Metal, Color=[180,185,190]
  Arm: 1x4x1, Material=Metal, Color=[180,185,190]
  Drain tile: 1x0.2x1, Material=Metal, Color=[120,120,120]
  Position: [13, 1, 12] -- corner

Toilet:
  Base/tank: 5x10x4, Material=Marble, Color=[248,246,244]
  Seat: 4x1x5, Material=Marble, Color=[245,244,242]
  Position: [3, 5, 14]
  Tank lid: 5x2x3, Material=Marble, Color=[248,246,244]

Vanity (sink cabinet):
  Cabinet: 10x10x6, Material=Wood, Color=[160,140,120]
  Position: [9, 5, 1] -- front wall
  Sink basin: 7x3x5 recessed in top, Material=Marble, Color=[248,246,244]
  Counter top: 10x1x6, Material=Marble, Color=[235,232,228]
  Faucet: 1x4x3, Material=Metal, Color=[180,185,190]
  Mirror above: 10x12x0.5, Material=Glass, Color=[180,210,230], Transparency=0.3
  Mirror frame: 11x13x1, Material=Wood, Color=[140,120,100]

Medicine Cabinet (in mirror):
  Box behind mirror: 9x11x4, Material=Concrete, Color=[220,220,220]

Towel Bar:
  Bar: 8x0.5x0.5, Material=Metal, Color=[180,185,190]
  Brackets (x2): 1x2x1 each, Material=Metal, Color=[180,185,190]
  Position: [9, 9, 0.5]
  Towel hanging: 7x5x0.3, Material=Fabric, Color=[240,235,230]

Toilet Paper Holder:
  Arm: 2x0.5x2, Material=Metal, Color=[180,185,190]
  Roll: 2x2x2 cylinder, Material=Fabric, Color=[250,250,250]
  Position: [1, 7, 14]

DETAIL PROPS:
1. Soap dispenser on vanity: 2x4x2, Material=Glass, Color=[200,220,210], Transparency=0.4
2. Toothbrush holder: 2x3x2, Material=Marble, Color=[240,238,234] with 2x thin toothbrush parts
3. Shampoo bottles in shower: 2x5x2 parts x3, Material=SmoothPlastic ok for bottles, varied colors [20,120,80][140,60,160][40,80,200]
4. Bath mat: 8x0.5x6, Material=Fabric, Color=[220,215,210] in front of tub
5. Toilet tank item (small plant or candle): 2x3x2, Material=Grass (succulent), Color=[60,140,60]

LIGHTING:
Vanity light bar: 3x SpotLight above mirror, Color=[255,245,230], Brightness=1.0
Ceiling: PointLight, Brightness=0.8, Range=18, Color=[255,250,240]
No windows recommended (or frosted glass 4x4 high on wall)

MISTAKES TO AVOID:
- Do NOT make toilet a single rectangle — needs tank, bowl, seat as separate parts
- Do NOT forget grout lines texture — use Granite or Slate for floor (not SmoothPlastic)
- Do NOT skip towel bar and accessories — these make bathroom feel real
- Do NOT make shower walls solid — they should be Glass with transparency

--- ROOM: LIVING ROOM ---
Dimensions: 44L x 36W x 14H studs
Floor: Material=WoodPlanks, Color=[175,145,110]
Walls: Material=Concrete, Color=[235,230,225]
Accent wall (back): Material=Brick, Color=[160,120,90]
Ceiling: Material=Concrete, Color=[245,242,238]
Color Palette: [235,230,225] [175,145,110] [60,55,50] [200,180,160] [30,60,100]

FURNITURE LIST:
Sofa (3-seater):
  Body: 22x8x10 studs
  Material: Fabric, Color=[80,90,100] (slate blue-gray)
  Position: [18, 4, 12] -- facing TV wall
  Cushions (x3): 6x3x8 each on seat, Material=Fabric, Color=[85,95,105]
  Back cushions (x3): 6x7x3, Material=Fabric, Color=[75,85,95]
  Armrests (x2): 3x8x10 at each end, Material=Fabric, Color=[78,88,98]
  Legs (x4): 1x3x1, Material=Wood, Color=[80,65,50]

Loveseat (2-seater):
  Body: 15x8x10 studs
  Material: Fabric, Color=[80,90,100]
  Position: [34, 4, 22] -- perpendicular to sofa
  Cushions (x2): 6x3x8, same as sofa

Coffee Table:
  Top: 16x2x10, Material=Wood, Color=[100,80,60]
  Position: [18, 2, 20]
  Legs (x4): 1x4x1, Material=Metal, Color=[80,80,80]
  Lower shelf: 14x1x8, Material=Wood, Color=[90,72,54]

TV Stand/Media Console:
  Body: 24x8x7 studs
  Material: Wood, Color=[60,55,50]
  Position: [22, 4, 2]
  Doors (x4): 5x6x1, Material=Wood, Color=[55,50,46]
  Legs (x6): 1x3x1, Material=Metal, Color=[60,60,60]

Television:
  Screen: 22x14x1, Material=Glass, Color=[10,10,15], Transparency=0.1
  Frame: 23x15x1.5, Material=Concrete, Color=[20,20,22]
  Position: [22, 15, 1.5]
  Stand leg: 4x4x2, Material=Concrete, Color=[20,20,22]

Armchair:
  Body: 10x8x10, Material=Fabric, Color=[160,130,100]
  Position: [6, 4, 22]
  Cushion: 8x3x8, Material=Fabric, Color=[165,135,105]
  Armrests (x2): 2x8x10, Material=Fabric, Color=[155,125,98]

Area Rug:
  Size: 30x0.5x22, Material=Fabric, Color=[140,120,100]
  Position: [20, 0.2, 14]
  Pattern detail: add 2x0.3x22 strips at edges, Color=[100,80,60]

Floor Lamp:
  Base: 3x2x3, Material=Metal, Color=[60,60,60]
  Pole: 1x20x1, Material=Metal, Color=[60,60,60]
  Shade: 5x4x5, Material=Fabric, Color=[220,200,170]
  Position: [4, 10, 10]
  Light: PointLight, Brightness=0.9, Range=18, Color=[255,240,210]

Bookshelf (tall):
  Size: 10x22x5, Material=Wood, Color=[90,72,54]
  Position: [38, 11, 6]
  Shelves (x5): 9x1x5 at Y=4,8,12,16,20
  Books: groups of colored 2x4x3 blocks on each shelf

Side Table:
  Top: 5x1x5, Material=Wood, Color=[100,80,60]
  Legs (x3): 0.5x8x0.5, Material=Metal, Color=[80,80,80]
  Position: [32, 5, 14]
  Table Lamp: base 1.5x5x1.5 + shade 4x3x4

Window (large, front wall):
  Frame: 18x12x1.5, Material=Wood, Color=[235,230,225]
  Glass: 16x10x0.3, Material=Glass, Transparency=0.7
  Position: [22, 8, 35.5]
  Curtains (x2): 4x14x1 each, Material=Fabric, Color=[210,195,180]

Fireplace (brick accent wall):
  Surround: 16x14x4, Material=Brick, Color=[150,110,85]
  Position: [22, 7, 0.5]
  Opening: 10x8x3 recess, Material=Basalt, Color=[30,28,26]
  Mantle: 17x2x5, Material=Wood, Color=[80,65,50]
  Fire glow: PointLight inside, Brightness=1.2, Range=12, Color=[255,140,40]
  Ash/ember detail: flat 8x0.3x6, Material=Basalt, Color=[50,48,45]

DETAIL PROPS:
1. Remote control on coffee table: 4x0.5x1.5, Material=Concrete, Color=[30,30,30]
2. Coffee mug: 2x3x2, Material=Marble, Color=[220,215,210]
3. Throw pillows on sofa (decorative): 4x4x2, Material=Fabric, Colors=[160,100,80][80,120,160]
4. Plant (corner): pot 4x4x4 Material=Granite Color=[80,75,70] + stem 1x8x1 + leaves (flat 6x1x6) Material=Grass Color=[60,140,50]
5. Picture frames on mantle: 3x4x0.3 x2, Material=Wood, Color=[80,65,50]

LIGHTING:
Ceiling: 2x PointLight at [14,13.5,18] and [30,13.5,18], Brightness=1.1, Range=22
Floor lamp: PointLight, Brightness=0.9, Range=18
Fireplace: PointLight inside, Brightness=1.2, Color=[255,140,40]
TV: SurfaceLight on screen face (subtle, Brightness=0.3, Color=[30,50,80])

MISTAKES TO AVOID:
- Do NOT align all furniture against walls — float sofa into room center, it's more realistic
- Do NOT make TV a flat part on the wall with no stand/console
- Do NOT skip the rug — it anchors the seating arrangement visually
- Do NOT use a single light source — layer ceiling + lamp + fireplace
- Do NOT make fireplace just a hole in wall — needs surround, mantle, inner material

--- ROOM: DINING ROOM ---
Dimensions: 34L x 28W x 13H studs
Floor: Material=WoodPlanks, Color=[170,138,105]
Walls: Material=Concrete, Color=[232,228,222]
Ceiling: Material=Concrete, Color=[244,241,238]
Color Palette: [232,228,222] [170,138,105] [70,56,44] [210,195,175] [30,30,30]

FURNITURE LIST:
Dining Table:
  Top: 24x2x14, Material=Wood, Color=[90,70,52]
  Position: [17, 7.5, 14]
  Legs (x4): 1.5x12x1.5, Material=Wood, Color=[80,62,46]
  Apron (x4 sides): 22x3x1 and 12x3x1, Material=Wood, Color=[82,64,48]

Dining Chairs (x6):
  Seat: 5x1.5x5, Material=Fabric, Color=[195,180,162]
  Back: 5x8x1, Material=Wood, Color=[80,62,46]
  Legs (x4): 0.5x8x0.5, Material=Wood, Color=[80,62,46]
  Positions (3 each side):
    [9,5,11], [17,5,11], [25,5,11] (front side)
    [9,5,17], [17,5,17], [25,5,17] (back side)
  Head chairs: [5,5,14] and [29,5,14]

Buffet/Sideboard:
  Body: 18x10x6, Material=Wood, Color=[80,62,46]
  Position: [17, 5, 2]
  Drawers (top row x3): 5x3x1, Material=Wood, Color=[75,58,43]
  Cabinet doors (bottom x2): 8x6x1, Material=Wood, Color=[75,58,43]
  Handles: 0.5x2x0.5, Material=Metal, Color=[160,148,120]
  Top surface: 18x1x6, Material=Marble, Color=[225,220,212]

China Cabinet (glass front):
  Body: 12x20x5, Material=Wood, Color=[80,62,46]
  Position: [4, 10, 26]
  Glass doors: 10x16x0.3, Material=Glass, Color=[180,210,225], Transparency=0.4
  Shelves (x3): 10x0.5x4, Material=Wood, Color=[90,70,52]
  Interior lighting: SurfaceLight, Brightness=0.5, Color=[255,245,225]

Chandelier:
  Chain: 1x6x1, Material=Metal, Color=[160,148,120]
  Position: [17, 11, 14]
  Arms (x4): 8x0.5x0.5 at 90° angles, Material=Metal, Color=[155,143,115]
  Candle holders (x4): 1x3x1 at arm tips, Material=Metal
  Bulbs: 1.5x2x1.5, Material=Neon, Color=[255,245,215]
  Light: PointLight, Brightness=1.3, Range=26, Color=[255,240,200]

Table Setting (x6 place settings):
  Plate: 4x0.3x4 per seat, Material=Marble, Color=[248,246,244]
  Fork: 0.3x0.3x4, Material=Metal, Color=[180,185,190]
  Knife: 0.3x0.3x4, Material=Metal, Color=[180,185,190]
  Wine glass: 1x5x1, Material=Glass, Color=[200,220,240], Transparency=0.5

Table Centerpiece:
  Vase: 3x6x3, Material=Marble, Color=[220,215,208]
  Flowers (x3): 1x3x1 + 2x2x2 top each, Material=Fabric, Colors=[220,80,80][240,220,80][255,255,255]
  Position: [17, 9, 14]

DETAIL PROPS:
1. Candles on sideboard: 1x4x1 x3, Material=Fabric, Color=[240,235,220] with tiny Neon flame tip
2. Wine bottle: 2x8x2, Material=Glass, Color=[40,80,40], Transparency=0.3
3. Bread basket: 5x2x4, Material=WoodPlanks, Color=[160,130,80]
4. Linen napkins on plates: 3x0.5x3, Material=Fabric, Color=[235,230,225]
5. Wall art (large painting): 16x12x0.5 on wall, Material=Fabric, Color=[80,100,120]

MISTAKES TO AVOID:
- Do NOT use identical chair heights — slight variation looks hand-crafted
- Do NOT make chandelier a single part — chain + arms + holders = 3+ parts
- Do NOT skip place settings — bare table in dining room looks abandoned
- Do NOT forget sideboard/buffet — every formal dining room has one

--- ROOM: HOME OFFICE ---
Dimensions: 26L x 22W x 12H studs
Floor: Material=WoodPlanks, Color=[165,135,105]
Walls: Material=Concrete, Color=[228,224,218]
Accent wall (behind desk): Material=Concrete, Color=[195,188,178]
Ceiling: Material=Concrete, Color=[242,240,236]
Color Palette: [228,224,218] [165,135,105] [40,40,45] [160,130,100] [80,90,100]

FURNITURE LIST:
Executive Desk (L-shaped):
  Main surface: 22x2x10, Material=WoodPlanks, Color=[100,80,60]
  Position: [11, 8, 5]
  Return (side): 10x2x8, Material=WoodPlanks, Color=[100,80,60]
  Position: [21, 8, 9]
  Pedestal (drawers): 6x14x8, Material=Wood, Color=[90,72,54]
  Position: [19, 7, 3]
  Drawers (x3): 5x3x1, Material=Wood, Color=[85,68,51]

Office Chair:
  Seat: 6x2x6, Material=Fabric, Color=[30,35,40]
  Back: 6x10x2, Material=Fabric, Color=[30,35,40]
  Armrests (x2): 1x4x4, Material=Concrete, Color=[40,40,45]
  Base (5-star): 8x1x8, Material=Metal, Color=[60,60,65]
  Pneumatic stem: 1.5x6x1.5, Material=Metal, Color=[80,80,85]
  Position: [11, 5, 9]

Monitor Setup (dual):
  Monitor 1: 12x8x1, Material=Glass, Color=[10,10,15], Transparency=0.1
  Frame 1: 12.5x8.5x1.5, Material=Concrete, Color=[25,25,28]
  Monitor 2: 12x8x1, same
  Stand/arm: 2x8x2, Material=Metal, Color=[50,50,55]
  Positions: [8,15,4] and [17,15,4]

Keyboard and Mouse:
  Keyboard: 9x0.5x4, Material=Concrete, Color=[40,40,45]
  Mouse: 2x1x3, Material=Concrete, Color=[35,35,40]
  Mouse pad: 8x0.3x6, Material=Fabric, Color=[25,25,30]
  Position: [11, 10.5, 8]

Bookcase (wall-to-ceiling):
  Size: 16x18x5, Material=Wood, Color=[90,72,54]
  Position: [4, 9, 22]
  Shelves (x6): 15x1x5, Material=Wood, Color=[85,68,51]
  Books: rows of 2x4x3 parts, varied colors

Filing Cabinet:
  Size: 5x16x6, Material=Metal, Color=[140,140,145]
  Position: [23, 8, 20]
  Drawer fronts (x4): 4x3x0.5, Material=Metal, Color=[130,130,135]
  Handles: 2x0.5x0.5, Material=Metal, Color=[100,100,105]

Desk Lamp (articulating arm):
  Base: 3x1x3, Material=Metal, Color=[50,50,55]
  Arm: 1x8x1, Material=Metal, Color=[50,50,55]
  Head: 3x2x3, Material=Metal, Color=[40,40,45]
  Position: [20, 12, 4]
  Light: SpotLight, Brightness=1.2, Range=10, Color=[255,245,230]

Whiteboard:
  Board: 16x10x0.5, Material=Concrete, Color=[248,247,245]
  Frame: 17x11x1, Material=Metal, Color=[120,120,125]
  Position: [13, 9, 0.5]
  Marker tray: 16x1x2, Material=Metal, Color=[100,100,105]

DETAIL PROPS:
1. Coffee mug on desk: 2x3x2, Material=Granite, Color=[40,40,45]
2. Sticky notes on monitor: 2x2x0.2 x3, Material=Fabric, Colors=[255,220,80][80,200,255][255,160,80]
3. Cable management: thin 0.3x0.3x10 parts routing from monitors to back of desk
4. Potted plant: 3x3x3 pot Material=Granite Color=[60,55,50] + 1x6x1 stem + 4x4x4 foliage Material=Grass
5. Notepad: 4x0.5x5, Material=Fabric, Color=[240,235,228]

MISTAKES TO AVOID:
- Do NOT make a single flat desk — real desks have legs, aprons, pedestals, drawers
- Do NOT place monitors directly on desk surface — they need stands
- Do NOT forget cable clutter (detail prop) — offices without wires look too clean
- Do NOT use same color for all furniture — desk top, pedestal, bookcase can vary slightly

--- ROOM: LAUNDRY ROOM ---
Dimensions: 20L x 16W x 11H studs
Floor: Material=Granite, Color=[100,96,92]
Walls: Material=Concrete, Color=[228,226,224]
Ceiling: Material=Concrete, Color=[240,239,237]
Color Palette: [228,226,224] [100,96,92] [240,240,245] [160,160,165] [60,60,65]

Washing Machine:
  Body: 8x12x8, Material=Metal, Color=[240,240,245]
  Position: [4, 6, 4]
  Door: 5x5x1 circle-ish (use 5x5x1 with rounded visual), Material=Glass, Color=[180,210,230], Transparency=0.5
  Control panel top: 7x2x1, Material=Concrete, Color=[50,55,60]
  Door handle: 1x1x3, Material=Metal, Color=[160,160,165]

Dryer:
  Body: 8x12x8, Material=Metal, Color=[240,240,245]
  Position: [12, 6, 4]
  Door: 5x5x1, Material=Metal, Color=[235,235,240]
  Lint trap: 2x1x1, Material=Concrete, Color=[50,50,55]
  Control panel: 7x2x1, Material=Concrete, Color=[50,55,60]

Counter Above (folding surface):
  Size: 16x2x8, Material=Marble, Color=[220,218,214]
  Position: [8, 13, 4]

Cabinets Above Counter:
  Size: 16x8x5, Material=Wood, Color=[195,190,185]
  Position: [8, 19, 3.5]
  Doors (x3): 4x6x1, Material=Wood, Color=[190,185,180]

Utility Sink:
  Cabinet: 6x10x6, Material=Wood, Color=[195,190,185]
  Basin: 5x3x5, Material=Concrete, Color=[200,200,205]
  Faucet: 1x4x2, Material=Metal, Color=[160,165,170]
  Position: [17, 5, 10]

Laundry Basket:
  Body: 6x8x6, Material=Fabric, Color=[200,185,170]
  Handles (x2): 1x2x6 loops, Material=Fabric, Color=[180,165,150]
  Position: [18, 4, 4]

Ironing Board:
  Surface: 12x1x5, Material=Fabric, Color=[200,195,190]
  Legs (x2 X-cross): 0.5x14x0.5, Material=Metal, Color=[120,120,125]
  Position: [10, 7, 14] -- folded against wall or in use

Iron:
  Body: 4x3x3, Material=Metal, Color=[200,200,205]
  Handle: 3x4x1, Material=Concrete, Color=[40,40,45]
  Position on ironing board: [10, 8.5, 14]

DETAIL PROPS:
1. Detergent bottles on counter: 3x6x3 x2, Material=SmoothPlastic ok for bottles, Colors=[40,80,180][20,160,80]
2. Folded towels stack: 6x2x5 per towel x3, Material=Fabric, Colors=[240,235,230][200,190,185][180,200,220]
3. Dryer sheets box: 4x4x2, Material=Fabric, Color=[200,220,240]
4. Wall-mounted lint roller: 1x8x2, Material=Concrete, Color=[180,180,185]
5. Wire shelf for supplies: 14x1x4, Material=Metal, Color=[160,160,165]

--- ROOM: NURSERY / BABY ROOM ---
Dimensions: 24L x 20W x 11H studs
Floor: Material=WoodPlanks, Color=[210,190,165]
Walls: Material=Concrete, Color=[230,240,250] (soft blue)
Ceiling: Material=Concrete, Color=[245,248,252]
Color Palette: [230,240,250] [210,190,165] [255,220,180] [180,220,255] [255,200,200]

Crib:
  Base: 14x4x10, Material=Wood, Color=[240,235,228]
  Position: [7, 2, 5]
  Slats (x20): 0.5x12x0.5 spaced 1 stud apart, Material=Wood, Color=[238,233,226]
  Mattress: 12x2x8, Material=Fabric, Color=[255,255,255]
  Bumper pads: 12x3x1 on each side, Material=Fabric, Color=[200,225,245]
  Mobile arm: 1x8x1 from top corner, Material=Wood, Color=[200,180,160]
  Mobile figures (x3): 2x2x2 hanging 1x3x1 strings, Material=Fabric, Colors=[255,180,180][180,220,255][255,220,150]

Changing Table:
  Surface: 12x2x7, Material=Wood, Color=[235,230,222]
  Position: [20, 11, 7]
  Pad: 11x2x6, Material=Fabric, Color=[200,225,245]
  Storage below (x2 shelves): 11x1x6, Material=Wood, Color=[230,225,218]
  Legs (x4): 1x10x1, Material=Wood, Color=[220,215,208]

Rocking Chair:
  Seat: 7x2x7, Material=Wood, Color=[200,180,155]
  Back: 7x10x2, Material=Wood, Color=[200,180,155]
  Armrests (x2): 2x6x5, Material=Wood, Color=[195,175,150]
  Rockers (x2): 10x1x2 curved (angled), Material=Wood, Color=[195,175,150]
  Cushion: 6x2x6, Material=Fabric, Color=[220,240,255]
  Position: [14, 5, 16]

Dresser (low, 3 drawers):
  Body: 12x8x6, Material=Wood, Color=[235,230,222]
  Position: [6, 4, 18]
  Drawers (x3): 11x2x1, Material=Wood, Color=[230,225,216]
  Handles (mushroom style): 1x1x1 rounded, Material=Wood, Color=[200,180,155]

Bookshelf (low, open):
  Size: 16x10x4, Material=Wood, Color=[235,230,222]
  Position: [8, 5, 1]
  Shelves (x2): 15x1x4

Toy Box:
  Body: 8x6x6, Material=Wood, Color=[255,200,150]
  Lid: 8x1x6, Material=Wood, Color=[245,190,140]
  Position: [20, 3, 16]

Night Light:
  Body: 3x4x2, Material=Concrete, Color=[240,238,235]
  Position: [2, 3, 4]
  Light: PointLight, Brightness=0.3, Range=10, Color=[255,230,190]

DETAIL PROPS:
1. Stuffed animals (x3): 3x4x3 each, Material=Fabric, Colors=[255,200,180][180,220,255][220,255,180]
2. Baby monitor: 3x4x3, Material=Concrete, Color=[240,238,235]
3. Diaper stack on changing table: 4x3x6, Material=Fabric, Color=[240,240,245]
4. Wall decals: flat 0.1 thick parts on wall (stars, moon shapes), Material=Fabric, Color=[200,220,255]
5. Humidifier: 4x6x4, Material=Concrete, Color=[240,238,235]

--- ROOM: GARAGE ---
Dimensions: 48L x 36W x 16H studs
Floor: Material=Concrete, Color=[140,136,130]
Walls: Material=Concrete, Color=[190,185,180]
Ceiling: Material=Concrete, Color=[175,170,165]
Color Palette: [190,185,180] [140,136,130] [60,60,65] [160,130,80] [80,80,85]

Garage Door (front):
  Panels (x5 horizontal): 40x4x2 each, Material=Metal, Color=[185,180,175]
  Positions: stacked from Y=2 to Y=22
  Tracks: 2x16x2 on each side, Material=Metal, Color=[100,100,105]

Workbench:
  Surface: 24x2x8, Material=WoodPlanks, Color=[150,120,90]
  Position: [24, 13, 32]
  Legs (x4): 2x13x2, Material=Wood, Color=[130,105,80]
  Pegboard above: 24x12x1, Material=WoodPlanks, Color=[180,155,125]
  Tool hooks (x12): 0.5x2x0.5 on pegboard, Material=Metal, Color=[120,120,125]

Tool Cabinet (rolling):
  Body: 8x16x6, Material=Metal, Color=[200,80,40] (classic red)
  Position: [44, 8, 30]
  Drawers (x5): 7x2.5x1, Material=Metal, Color=[180,70,35]
  Top box: 8x8x6, Material=Metal, Color=[200,80,40]
  Casters (x4): 1x2x1, Material=Metal, Color=[60,60,65]

Car Lift / Vehicle Space:
  Floor markings: 24x0.3x36, Material=Concrete, Color=[120,116,110]
  Oil stain detail: 6x0.2x6, Material=Asphalt, Color=[40,38,36]
  Position: [14, 0.1, 18]

Shelving Units (x2 wall-mounted):
  Frame: 12x18x3, Material=Metal, Color=[120,120,125]
  Shelves (x4): 11x1x3, Material=WoodPlanks, Color=[160,130,100]
  Position: [4, 9, 32] and [4, 9, 20]

Ceiling Storage:
  Platform: 20x2x10, Material=Wood, Color=[150,120,90]
  Position: [24, 14, 6] -- suspended near ceiling
  Support brackets (x4): 2x4x2, Material=Metal, Color=[100,100,105]

DETAIL PROPS:
1. Car jack: 6x4x8, Material=Metal, Color=[60,60,65]
2. Oil cans on shelf: 2x4x2 x3, Material=Metal, Colors=[200,80,40][80,80,85][160,160,165]
3. Tire leaning against wall: torus-like 8x8x2, Material=Rubber (use Asphalt), Color=[30,28,26]
4. Extension cord reel: 6x6x4, Material=SmoothPlastic ok, Color=[255,160,40]
5. Fire extinguisher: 2x8x2, Material=Metal, Color=[200,40,40]

--- ROOM: HOME THEATER ---
Dimensions: 40L x 30W x 14H studs
Floor: Material=Carpet (use Fabric), Color=[30,28,26] (near black)
Walls: Material=Concrete, Color=[35,32,30] (very dark)
Ceiling: Material=Concrete, Color=[28,26,24]
Accent lighting: Neon strips along floor edges
Color Palette: [35,32,30] [30,28,26] [200,40,40] [255,220,80] [60,55,50]

Screen:
  Frame: 32x20x1, Material=Concrete, Color=[15,14,12]
  Screen surface: 30x18x0.5, Material=Glass, Color=[20,20,25], Transparency=0.1
  Position: [20, 11, 1]

Projector:
  Body: 6x3x4, Material=Concrete, Color=[40,40,45]
  Lens: 2x2x2, Material=Glass, Color=[120,160,200]
  Mount: 2x4x2, Material=Metal, Color=[80,80,85]
  Position: [20, 13, 28] -- ceiling mounted
  Light: SpotLight pointing at screen, Brightness=0.3

Theater Seating Row 1 (x4 recliners):
  Each recliner body: 7x12x8, Material=Fabric, Color=[40,35,30]
  Armrests: 1.5x10x6 each side, Material=Fabric, Color=[38,33,28]
  Footrest extended: 5x2x8 (hinged look), Material=Fabric, Color=[38,33,28]
  Cup holder: 2x2x2, Material=Metal, Color=[60,60,65]
  Positions: [5,6,22], [13,6,22], [21,6,22], [29,6,22]

Theater Seating Row 2 (x4 recliners, elevated):
  Platform for row 2: 36x3x10, Material=Concrete, Color=[30,28,26]
  Position: [18, 1, 10]
  Seats at: [5,9,10], [13,9,10], [21,9,10], [29,9,10] (elevated by platform)

Floor LED strips:
  Strip along back wall: 38x0.3x0.5, Material=Neon, Color=[200,40,40]
  Strips along aisles: 30x0.3x0.5 x2, Material=Neon, Color=[80,40,200]

Acoustic Panels (side walls):
  Panels (x6 per side): 6x8x1, Material=Fabric, Color=[45,40,38]
  Arranged in grid pattern on side walls

Speakers (surround):
  Floor standing (x2): 4x18x4, Material=Fabric, Color=[20,20,22]
  Position flanking screen: [4,9,2] and [36,9,2]
  Surround (x4 wall-mounted): 4x6x3, Material=Fabric, Color=[20,20,22]
  Subwoofer: 8x10x8, Material=Fabric, Color=[15,14,12]

Snack Bar (back wall):
  Counter: 16x2x6, Material=Granite, Color=[40,38,36]
  Mini fridge: 6x12x5, Material=Metal, Color=[195,195,200]
  Popcorn machine: 6x12x6, Material=Glass, Color=[180,210,230], Transparency=0.4

MISTAKES TO AVOID:
- Do NOT use light colors in home theater — everything should be dark to prevent glare
- Do NOT skip tiered seating — flat floor theaters look cheap
- Do NOT forget acoustic panels — gives the room purpose
- Do NOT use a single flat screen — it needs a proper frame
`

export const INTERIOR_COMMERCIAL: string = `
===========================================================================
SECTION 2: COMMERCIAL INTERIORS
===========================================================================

--- ROOM: OPEN PLAN OFFICE ---
Dimensions: 80L x 60W x 14H studs
Floor: Material=Concrete, Color=[160,158,155] (polished concrete)
Walls: Material=Concrete, Color=[238,236,233]
Ceiling: Material=Concrete, Color=[232,230,228] (exposed ceiling with utilities)
Color Palette: [238,236,233] [160,158,155] [255,255,255] [40,80,160] [80,80,85]

Workstation Clusters (x6 pods of 4 desks):
  Each pod desk: 10x1.5x6, Material=Concrete, Color=[240,238,235]
  Partition between desks: 10x8x0.5, Material=Fabric, Color=[160,155,150]
  Monitor per desk: 8x5x1, Material=Glass, Color=[10,10,15], Transparency=0.1
  Chair per desk: seat 5x1.5x5 Material=Fabric Color=[50,50,55], back 5x8x1.5
  Pod layout: 4 desks in 2x2 grid with 2-stud gap between
  Pod positions (cluster centers): [15,7,15], [15,7,35], [15,7,55], [45,7,15], [45,7,35], [45,7,55]

Reception Desk (entrance):
  Counter: 20x5x5, Material=Concrete, Color=[255,255,255]
  Position: [40, 3.5, 6]
  Back panel: 22x10x1, Material=Concrete, Color=[40,80,160]
  Company logo on panel: flat 14x6x0.3, Material=Neon, Color=[255,255,255]
  Chair behind: ergonomic office chair
  Visitor chairs (x2): 5x6x5 Material=Fabric Color=[255,255,255]

Meeting Room (glass-walled, corner):
  Walls: 4x Glass panels 20x12x0.5 each, Material=Glass, Transparency=0.3
  Table: 20x2x10, Material=Wood, Color=[80,75,70]
  Chairs (x8): same as workstation chairs
  Whiteboard: 14x8x0.5, Material=Concrete, Color=[248,247,245]

Ceiling Grid (exposed):
  Beams (x4 across): 80x2x2, Material=Metal, Color=[100,100,105]
  Ductwork: 10x4x4 runs, Material=Metal, Color=[120,120,125]
  Pendant lights (x12): 3x2x3 Material=Metal Color=[30,30,35] + PointLight each

Breakout Area:
  Couches: 16x6x8, Material=Fabric, Color=[80,90,100]
  Coffee tables: 10x2x6, Material=Wood, Color=[80,75,70]
  Rug: 24x0.5x16, Material=Fabric, Color=[120,118,115]
  Position: [68, 4, 48]

Copier/Printer Station:
  Printer: 10x8x8, Material=Concrete, Color=[240,238,235]
  Paper trays: 8x1x6, Material=Concrete, Color=[180,175,170]
  Position: [74, 4, 6]

LIGHTING (open office):
  LED panel lights in grid: 36 panels, each 4x0.5x2, Material=Neon, Color=[255,252,245]
  Grid spacing: 10 studs apart in 6x6 grid across ceiling
  Each: SurfaceLight, Brightness=0.8, Color=[255,250,240]

DETAIL PROPS:
1. Water cooler: 4x14x4, Material=Concrete/SmoothPlastic, Color=[240,238,235]
2. Recycling bins x3: 4x6x4, Material=SmoothPlastic, Colors=[40,180,80][40,80,200][220,180,40]
3. Potted plants x4: terracotta pot 4x4x4 + foliage 6x6x6, Material=Grass
4. Cable conduits on floor: 1x0.5x30, Material=Metal, Color=[80,80,85]
5. Fire exit signs: 4x2x0.3, Material=Neon, Color=[40,200,40]

--- ROOM: CONFERENCE ROOM ---
Dimensions: 36L x 24W x 12H studs
Floor: Material=WoodPlanks, Color=[140,115,90]
Walls: Material=Concrete, Color=[236,234,231]
Ceiling: Material=Concrete, Color=[244,242,240]
Accent wall (presentation end): Material=Concrete, Color=[40,80,160]
Color Palette: [236,234,231] [140,115,90] [255,255,255] [40,80,160] [30,30,35]

Conference Table:
  Top: 28x2x12, Material=Wood, Color=[100,82,64]
  Position: [18, 7, 12]
  Pedestal bases (x2): 6x6x4, Material=Metal, Color=[60,60,65]
  Wire management channel: 26x1x2 under table center
  Power/data ports in table: 2x1x1 x6, Material=Metal, Color=[40,40,45]

Conference Chairs (x12):
  Each: seat 5x1.5x5 Fabric [50,55,60], back 5x10x1.5 Fabric [48,53,58]
  High back with headrest: extra 5x4x1 Fabric [48,53,58]
  5-star base + pneumatic stem
  6 chairs per side, 2 studs apart

Presentation Display (wall-mounted):
  Screen: 20x12x1, Material=Glass, Color=[10,10,15]
  Frame: 21x13x1.5, Material=Metal, Color=[25,25,28]
  Position: [18, 9, 1]
  HDMI panel below: 4x3x0.5, Material=Concrete, Color=[30,30,35]

Credenza (side wall):
  Body: 20x8x6, Material=Wood, Color=[80,65,50]
  Position: [18, 4, 23]
  Doors (x4): 4x6x1, Material=Wood, Color=[75,60,46]
  AV equipment inside: visible through crack: 6x4x4, Material=Concrete, Color=[20,20,25]

Whiteboard (side wall):
  Board: 18x10x0.5, Material=Concrete, Color=[248,247,245]
  Frame: 19x11x1, Material=Metal, Color=[120,120,125]
  Marker tray: 18x1x2, Material=Metal, Color=[110,110,115]
  Dry erase markings: thin color lines on surface

Video Conferencing Camera:
  Unit: 4x2x2, Material=Concrete, Color=[20,20,25]
  Mounted above display: position [18, 14, 1]

Ceiling Lights (linear):
  Pendant strips (x3): 20x1x2, Material=Metal, Color=[40,40,45]
  Hanging 4 studs from ceiling, evenly spaced
  SurfaceLight on underside, Brightness=1.0, Color=[255,248,235]

DETAIL PROPS:
1. Water pitcher + glasses: 3x6x3 pitcher Material=Glass Transparency=0.5, 1.5x3x1.5 x6 glasses
2. Notepad and pen at each seat: 4x0.3x3 Material=Fabric Color=[248,247,245]
3. Speakerphone in table center: 6x2x6 octagon, Material=Metal, Color=[50,50,55]
4. Laptop at head seat: 8x1x6, Material=Concrete, Color=[30,30,35]
5. Printed agenda papers: 4x0.1x3 x3, Material=Fabric, Color=[248,247,245]

--- ROOM: LOBBY / RECEPTION ---
Dimensions: 50L x 40W x 18H studs
Floor: Material=Marble, Color=[220,215,208] (polished marble)
Walls: Material=Marble, Color=[235,230,225] (lower half) + Concrete [240,238,235] (upper)
Ceiling: Material=Concrete, Color=[245,243,240] (high, coffered)
Color Palette: [220,215,208] [235,230,225] [30,30,35] [200,160,80] [255,255,255]

Reception Desk (freestanding, curved):
  Main counter: 24x6x6, Material=Marble, Color=[248,246,243]
  Position: [25, 3, 12]
  Front fascia: 24x5x1, Material=Concrete, Color=[30,30,35]
  Backlit logo on fascia: 18x3x0.3, Material=Neon, Color=[200,160,80]
  Work surface (behind counter): 22x2x5, Material=Marble, Color=[240,238,234]
  Computer monitor (behind desk): 8x5x1, Material=Glass
  Reception chair: tall task chair

Seating Area (x2 arrangements):
  Sofa: 18x6x8, Material=Fabric, Color=[60,58,55]
  Coffee table: 12x2x6, Material=Marble, Color=[220,215,208]
  Chairs (x2): 6x6x6, Material=Fabric, Color=[55,53,50]
  Side tables: 4x8x4, Material=Metal, Color=[120,120,125]
  Area rug: 22x0.5x16, Material=Fabric, Color=[80,78,74]

Feature Wall (behind reception):
  Stone cladding: 30x14x2, Material=Limestone, Color=[200,195,188]
  Waterfall feature: Glass panel 6x12x0.5 Material=Glass Transparency=0.3, Water (use Neon) Color=[80,160,220]

Statement Art (lobby):
  Sculpture base: 5x5x5, Material=Marble, Color=[230,225,220]
  Sculpture: abstract 4x12x4, Material=Metal, Color=[160,148,120]
  Position: [40, 6, 30]

Elevator Bank (back wall):
  Elevator doors x2: each 8x12x1, Material=Metal, Color=[160,160,165]
  Door gap (center): 0.5x12x1, Material=Metal, Color=[80,80,85]
  Call button panel: 2x4x0.5, Material=Metal, Color=[100,100,105]
  Indicator light: 2x1x0.3, Material=Neon, Color=[200,160,80]

Planters (x4 corners):
  Large: 8x8x8, Material=Concrete, Color=[60,58,55]
  Large plant foliage: 12x14x12, Material=Grass, Color=[40,120,40]

Ceiling Feature (coffered):
  Coffer frame: grid of 2x2x2 beams
  Inset panel: 6x0.5x6, Material=Concrete, Color=[238,235,232]
  Downlight in each coffer: PointLight, Brightness=0.6, Range=10, Color=[255,245,225]

Security Desk:
  Counter: 10x6x5, Material=Concrete, Color=[50,50,55]
  Monitor (security cam feeds): 8x6x1 x2, Material=Glass
  Visitor log tablet: 4x4x0.5, Material=Glass
  Position: [8, 3, 8]

DETAIL PROPS:
1. Floral arrangement on coffee tables: vase 3x6x3 + stems + flowers
2. Company brochures in rack: 3x8x2 rack Material=Metal + 4x0.3x6 brochures Material=Fabric
3. Umbrella stand: 3x10x3, Material=Metal, Color=[80,80,85]
4. Welcome mat: 8x0.5x6, Material=Fabric, Color=[30,30,35]
5. Visitor badges on reception desk: 2x3x0.2 cards, Material=Fabric, Color=[248,246,240]

--- ROOM: BREAK ROOM / STAFF KITCHEN ---
Dimensions: 28L x 20W x 11H studs
Floor: Material=Concrete, Color=[155,152,148]
Walls: Material=Concrete, Color=[235,233,230]
Ceiling: Material=Concrete, Color=[242,240,237]
Color Palette: [235,233,230] [155,152,148] [255,255,255] [40,120,80] [30,30,35]

Kitchen Area:
  Counters: 20x2x6, Material=Granite, Color=[60,58,55]
  Position: [10, 8, 2]
  Upper cabinets: 18x8x5, Material=Wood, Color=[200,195,190]
  Lower cabinets: 18x10x6, Material=Wood, Color=[200,195,190]
  Sink: 6x3x5 recessed, Material=Metal, Color=[165,170,175]
  Faucet: 1x5x3, Material=Metal, Color=[175,180,185]

Appliances:
  Commercial coffee machine: 8x12x8, Material=Metal, Color=[30,30,35]
  Position: [24, 6, 2]
  Microwave: 8x5x6, Material=Metal, Color=[30,30,35]
  Position: [6, 15, 2] -- on counter
  Toaster: 5x4x3, Material=Metal, Color=[40,40,45]
  Refrigerator (stainless): 8x20x6, Material=Metal, Color=[195,195,200]
  Position: [2, 10, 2]

Dining Area:
  Table: 14x2x10, Material=Wood, Color=[120,100,80]
  Position: [18, 6, 14]
  Chairs (x4): plastic/metal stack chairs — seat 5x1.5x5 Material=SmoothPlastic ok Color=[200,195,190], metal legs
  Positions: [13,4,11], [23,4,11], [13,4,17], [23,4,17]

Bulletin Board:
  Board: 14x8x0.5, Material=Fabric, Color=[100,80,60]
  Frame: 15x9x1, Material=Wood, Color=[120,100,80]
  Papers pinned: 4x5x0.2 x6, Material=Fabric, Colors=[255,220,80][200,230,255][255,200,200]
  Position: [14, 8, 0.5]

Recycling Station:
  3-bin divider: 12x10x6, Material=Concrete, Color=[50,50,55]
  Bins: trash (grey), recycling (blue), compost (green)
  Labels: 3x2x0.2, Material=Neon, Colors=[80,80,85][40,80,200][40,160,40]

DETAIL PROPS:
1. Coffee mugs on drying rack: 2x3x2 x4, Material=Granite, varied colors
2. Calendar on wall: 6x8x0.2, Material=Fabric, Color=[248,247,245]
3. Dish soap and sponge at sink: 2x4x2 bottle + 2x1x3 sponge, Material=Fabric, Color=[240,220,80]
4. Paper towel dispenser: 3x6x3, Material=Metal, Color=[160,160,165]
5. Candy/snack bowl: 4x2x4, Material=Marble, Color=[230,225,220]

--- ROOM: RETAIL STORE ---
Dimensions: 60L x 40W x 14H studs
Floor: Material=Concrete, Color=[180,175,170] (polished)
Walls: Material=Concrete, Color=[242,240,237]
Ceiling: Material=Concrete, Color=[238,235,232]
Color Palette: [242,240,237] [180,175,170] [255,255,255] [40,80,200] [200,160,40]

Display Shelving (grid layout):
  Gondola shelves: each 14x16x3, Material=Metal, Color=[200,198,195]
  Shelves per unit (x4): 13x1x3, Material=Metal, Color=[195,193,190]
  Price tag rail at each shelf: 13x0.5x0.5, Material=Concrete, Color=[240,238,235]
  Arrange in 4 parallel rows with 8-stud aisles between
  Row positions: [12,8,20], [26,8,20], [40,8,20], [54,8,20]

Wall Shelving (perimeter):
  Back wall units: 3 sections x 16W each = 48 total
  Each: 16x20x4, Material=Metal, Color=[200,198,195]
  Shelves every 4 studs: products represented by colored 4x3x2 boxes

Checkout Counter:
  Counter: 20x5x5, Material=Wood, Color=[80,70,60]
  Position: [30, 3, 4] -- near entrance
  Cash register: 6x8x5, Material=Concrete, Color=[30,30,35]
  Conveyor belt: 14x1x4, Material=Concrete, Color=[50,50,55]
  Dividers: 2x3x0.5 x3, Material=SmoothPlastic ok, Color=[200,195,190]
  Bagging area: 8x2x4, Material=Metal, Color=[180,175,170]

Shopping Cart Corral (entrance):
  Carts (x4): 8x6x5, Material=Metal, Color=[120,120,125]
  Corral enclosure: 10x2x6 frame, Material=Metal, Color=[200,160,40]
  Position: [4, 3, 4]

Fitting Rooms (clothing store):
  Booth x3: each 8x12x8, Material=Concrete, Color=[235,232,228]
  Curtain: 7x10x0.5, Material=Fabric, Color=[40,40,45]
  Hook on wall: 1x1x2, Material=Metal, Color=[160,160,165]
  Position: [50, 6, 32]

Product Display Tables (featured items):
  Table: 10x4x8, Material=Wood, Color=[100,88,76]
  Position: [30, 2, 20]
  Items on top: boxes and products at various heights using risers

Entrance Mats + Signage:
  Mat: 8x0.5x8, Material=Fabric, Color=[30,30,35]
  Entrance sign (overhead): 24x6x1, Material=Concrete, Color=[40,80,200]
  Store name Neon lettering on sign

DETAIL PROPS:
1. Sale tags on shelves: 2x2x0.1 x12, Material=Fabric, Color=[200,40,40]
2. Shopping baskets stack: 6x12x5, Material=SmoothPlastic ok, Color=[200,40,40]
3. Mannequin: cylinder 2x10x2 body + 2x4x3 head, Material=Concrete, Color=[220,215,210]
4. Security camera (ceiling): 3x3x4, Material=Metal, Color=[30,30,35]
5. Exit sign: 6x3x0.3, Material=Neon, Color=[40,200,40]

--- ROOM: RESTAURANT ---
Dimensions: 52L x 40W x 14H studs
Floor: Material=WoodPlanks, Color=[160,128,95]
Walls: Material=Brick, Color=[170,120,90] (one wall), Concrete [235,230,224] (others)
Ceiling: Material=Concrete, Color=[240,237,233] with exposed beams
Color Palette: [235,230,224] [160,128,95] [80,60,44] [200,170,130] [60,40,28]

Dining Tables (mix of sizes):
  2-top tables (x4): 8x2x8, Material=Wood, Color=[100,80,60]
  4-top tables (x6): 12x2x10, Material=Wood, Color=[100,80,60]
  6-top tables (x2): 16x2x12, Material=Wood, Color=[100,80,60]
  All positions spread through dining room with 6-stud clearance between

Dining Chairs:
  Each: seat 4x1.5x4 Material=Wood Color=[80,64,48], back 4x8x1.5 Material=Wood, legs 0.5x8x0.5
  Cushion (optional): 3x1x3 Material=Fabric Color=[180,160,140]
  4 chairs per 4-top, 2 per 2-top

Banquette Seating (along wall):
  Bench back: 40x14x2, Material=Fabric, Color=[100,80,60]
  Bench seat: 40x3x8, Material=Fabric, Color=[110,88,66]
  Position: [20, 3, 38]
  Tables alongside: 8x2x8 every 12 studs

Bar Area:
  Bar counter: 24x6x5, Material=Wood, Color=[80,60,44]
  Position: [12, 3, 6]
  Bar stools (x6): seat 3x1.5x3 Material=Wood Color=[80,60,44], legs 0.5x10x0.5 Material=Metal Color=[80,80,85]
  Back bar shelves: 24x16x4, Material=Wood, Color=[60,46,34]
  Bottles on shelves: 2x6x2 x16, Material=Glass, Color=[40,80,40] Transparency=0.3
  Beer taps: 1x6x1 x4, Material=Metal, Color=[175,180,185]
  Under-bar refrigerator: 8x12x5, Material=Metal, Color=[195,195,200]

Pass-Through Window (to kitchen):
  Opening: 12x6x1, Material=Concrete, Color=[235,230,224]
  Counter ledge: 12x2x4, Material=Wood, Color=[100,80,60]
  Heat lamp above: 8x3x3, Material=Metal, Color=[30,30,35]
  Heat lamp light: PointLight, Brightness=0.8, Color=[255,160,40]

Host Stand (entrance):
  Pedestal: 4x12x4, Material=Wood, Color=[80,60,44]
  Position: [4, 6, 4]
  Top: 5x2x5, Material=Wood, Color=[90,70,52]
  Reservation book: 4x1x5, Material=Fabric, Color=[30,30,35]

Table Settings:
  Per table: plates 4x0.3x4 Material=Marble x(seats), wine glasses 1x4x1 Material=Glass Transparency=0.5, candle 1x3x1 Material=Fabric Color=[240,235,220]
  White tablecloth on 6-tops: 17x0.3x13, Material=Fabric, Color=[248,247,245]
  Napkin folded: 3x2x1, Material=Fabric, Color=[248,247,245]

Exposed Ceiling Beams:
  Beams (x3 across): 52x3x3, Material=Wood, Color=[80,60,44]
  Pendant lights from beams: 2x2x2 shade Material=Metal Color=[30,30,35] + PointLight each

DETAIL PROPS:
1. Chalkboard specials board: 10x14x0.5 Material=Basalt Color=[30,28,26] + Neon text
2. Potted herb (on bar): 3x4x3, Material=Grass, Color=[50,130,50]
3. Wine rack (decorative): 8x14x4, Material=Wood, Color=[80,60,44] with bottles
4. Coat hooks by entrance (x6): 1x2x1, Material=Metal, Color=[120,120,125]
5. Tableside pepper grinder: 1.5x6x1.5, Material=Wood, Color=[30,30,35]

--- ROOM: CAFE / COFFEE SHOP ---
Dimensions: 40L x 30W x 12H studs
Floor: Material=WoodPlanks, Color=[175,145,115]
Walls: Material=Brick, Color=[180,140,105] (exposed brick aesthetic)
Ceiling: Material=Wood, Color=[140,112,86] (wood plank ceiling)
Color Palette: [180,140,105] [175,145,115] [255,245,220] [60,40,28] [220,200,160]

Service Counter:
  Counter top: 20x2x6, Material=Marble, Color=[230,225,218]
  Position: [10, 8, 3]
  Counter front: 20x6x1, Material=Wood, Color=[100,78,56]
  Espresso machine: 10x12x8, Material=Metal, Color=[160,165,170]
  Position: [8, 11, 2]
  Grinder: 4x10x4, Material=Metal, Color=[30,30,35]
  Pastry case: 12x10x6, Material=Glass, Color=[180,210,230], Transparency=0.4
  Position: [18, 6, 2]
  Inside pastry case: colored 3x2x2 parts (croissants brown, muffins tan, etc.)

Menu Board (chalkboard):
  Board: 20x10x0.5, Material=Basalt, Color=[25,23,22]
  Frame: 21x11x1, Material=Wood, Color=[80,60,44]
  Chalk text (Neon parts): 1x0.3x6 lines, Color=[240,238,235]
  Position: [10, 11, 0.5]

Cafe Tables (small):
  Round table x6: 6x2x6, Material=Wood, Color=[100,78,56]
  Chairs x12 (2 per): 4x6x4, Material=Wood, Color=[90,70,52]
  Cushion: 3x1x3, Material=Fabric, Color=[180,140,100]

Bar Counter Seating (window side):
  Long bar: 28x2x3, Material=Wood, Color=[100,78,56]
  Position: [14, 8, 28]
  Stools (x6): 2x10x2 Material=Wood Color=[90,70,52] + round seat 3x1x3 Material=Fabric Color=[100,78,56]

Couch Nook:
  Loveseat: 14x6x8, Material=Fabric, Color=[100,78,56]
  Coffee table: 8x2x5, Material=Wood, Color=[80,60,44]
  Position: [34, 3, 22]
  Side lamp: floor lamp in corner

Shelving Decor (walls):
  Floating shelves (x4): 8x1x2 each, Material=Wood, Color=[100,78,56]
  Items: coffee bags 3x4x2, books 2x4x3, plants, mugs

Pendant Lights (industrial style):
  Caged bulb pendants (x8): cage 3x4x3 Material=Metal Color=[60,60,65], bulb 2x2x2 Material=Neon Color=[255,220,140]
  Positions distributed across ceiling at Y=11

DETAIL PROPS:
1. Coffee cup on each table: 1.5x2x1.5 Material=Marble Color=[220,215,210]
2. Sugar dispenser: 2x5x2, Material=Glass, Transparency=0.5
3. Receipt printer on counter: 4x6x3, Material=Concrete, Color=[240,238,235]
4. Barista aprons hanging: 2x8x0.5 Material=Fabric Color=[30,30,35]
5. Coffee bean sacks: 8x10x6, Material=Fabric, Color=[100,78,56]

--- ROOM: BAR / PUB ---
Dimensions: 50L x 36W x 14H studs
Floor: Material=WoodPlanks, Color=[100,80,60] (dark, worn oak)
Walls: Material=Brick, Color=[140,105,80] (exposed brick)
Ceiling: Material=Wood, Color=[80,62,46]
Color Palette: [140,105,80] [100,80,60] [200,160,80] [30,28,26] [220,180,100]

Main Bar:
  Counter: 32x6x5, Material=Wood, Color=[80,62,46]
  Position: [16, 3, 4]
  Counter top: 32x2x5, Material=Marble, Color=[50,48,45] (dark marble)
  Counter front: ornate 32x5x2, Material=Wood, Color=[70,54,40]
  Foot rail: 32x1x1 at base, Material=Metal, Color=[160,140,80]
  Bar stools (x8): 3x1.5x3 seat Material=Wood Color=[80,62,46], 0.5x12x0.5 legs x3 Material=Metal

Back Bar:
  Lower cabinet: 30x10x6, Material=Wood, Color=[80,62,46]
  Upper shelves (x4 tiers): 30x1x4 each, Material=Wood, Color=[70,54,40]
  Spirits bottles (x30+): 2x6x2 each, Material=Glass, Colors=[40,80,40][80,60,40][200,160,40] Transparency=0.3
  Back mirror: 28x16x0.5, Material=Glass, Color=[150,140,130], Transparency=0.15
  Position: behind bar at [16,8,2]
  Ambient bar light: SurfaceLight along top shelf, Brightness=0.6, Color=[255,200,100]

Beer Taps (on counter):
  Tap handles (x6): 1x8x1, Material=Wood, Color=[80,62,46]
  Tap bodies: 1x4x1, Material=Metal, Color=[160,160,165]
  Drip tray: 8x1x4, Material=Metal, Color=[140,140,145]
  Position: [16, 9, 4]

Pub Tables (x4 high tops):
  Round top: 8x2x8, Material=Wood, Color=[80,62,46]
  Single pedestal: 2x18x2, Material=Metal, Color=[80,80,85]
  High bar stools (x3 per): 3x1.5x3 seat at height 15, legs 0.5x14x0.5

Booth Seating (x4):
  Bench back: 12x14x3, Material=Fabric, Color=[100,80,60]
  Bench seat: 12x3x6, Material=Fabric, Color=[90,72,54]
  Table: 10x2x8, Material=Wood, Color=[80,62,46]
  Divider between booths: 12x14x1, Material=Wood, Color=[80,62,46]

Pool Table:
  Body: 18x5x10, Material=Fabric, Color=[40,120,60] (green felt)
  Frame: 19x6x11, Material=Wood, Color=[80,62,46]
  Pockets (x6): 1x1x1 spheres, Material=Metal, Color=[30,30,35]
  Balls: 1x1x1 spheres x16, Material=SmoothPlastic ok, various colors
  Position: [38, 3, 24]
  Overhead light: 16x4x4, Material=Metal, Color=[30,30,35] + PointLight Brightness=1.2

Dartboard:
  Board: 4x4x0.5, Material=Fabric, Color=[30,30,35]
  Outer ring: 4.5x4.5x0.3, Material=Wood, Color=[80,62,46]
  Position on wall: [49, 8, 20]
  Throw line on floor: 0.5x0.3x0.5, Material=Neon, Color=[255,200,40]

Neon Signs:
  Bar sign: 12x6x1, Material=Neon, Color=[200,40,40]
  Beer brand: 10x5x1, Material=Neon, Color=[255,180,40]
  Mounted on wall at height 11-12

DETAIL PROPS:
1. Pint glasses on bar: 2x4x2 Material=Glass Transparency=0.4 x6, partially filled with Neon [160,200,80]
2. Bar nuts bowl: 4x2x4, Material=Marble, Color=[230,225,218]
3. Cocktail napkins: stack 3x1x3, Material=Fabric, Color=[248,247,245]
4. TV above bar (sports): 12x8x1 Material=Glass + frame
5. Vintage photos on wall: 4x5x0.2 framed x6, Material=Wood frames

--- ROOM: HAIR SALON ---
Dimensions: 36L x 28W x 12H studs
Floor: Material=Concrete, Color=[240,238,235] (white polished)
Walls: Material=Concrete, Color=[245,243,240]
Accent wall: Material=Concrete, Color=[220,40,80] (bold salon pink)
Color Palette: [245,243,240] [240,238,235] [220,40,80] [30,30,35] [200,195,190]

Styling Stations (x4):
  Each station:
  Mirror: 8x14x0.5, Material=Glass, Color=[180,210,230], Transparency=0.2
  Mirror frame: 9x15x1, Material=Concrete, Color=[30,30,35]
  Station counter: 8x3x4, Material=Marble, Color=[240,238,235]
  Position at: [6,9,4], [14,9,4], [22,9,4], [30,9,4]
  Tools on counter: combs 3x0.5x1, scissors 2x0.5x4, spray bottles 2x4x2 (Glass)
  Drawer: 7x3x3, Material=Concrete, Color=[30,30,35]
  Styling chair: wide seat 6x2x6 Material=Fabric Color=[30,30,35] + padded back 6x12x2 + chrome footrest bar + hydraulic cylinder

Shampoo Bowls (x2):
  Chair: reclined shape — seat 6x2x8, back 6x8x2 (reclined to 130°), Material=Fabric Color=[30,30,35]
  Shampoo bowl: 8x4x6, Material=Marble, Color=[240,238,235]
  Faucet: 1x4x3, Material=Metal, Color=[175,180,185]
  Position: [6, 5, 22] and [14, 5, 22]

Reception/Front Desk:
  Counter: 14x6x5, Material=Marble, Color=[245,243,240]
  Position: [7, 3, 2]
  Computer monitor: 6x5x1, Material=Glass
  Product display: 3 tiers of 10x1x4, Material=Concrete, Color=[240,238,235]
  Waiting chairs (x3): 5x6x5, Material=Fabric, Color=[200,195,190]

Product Shelves:
  Unit: 12x20x3, Material=Concrete, Color=[245,243,240]
  Position: [32, 10, 14]
  Shelves x5: product bottles 2x5x2 in rows, Material=SmoothPlastic ok, varied colors

DETAIL PROPS:
1. Hair color swatches on wall: 8x12x0.3, Material=Fabric, varied gradient colors
2. Towels rolled in basket: 3x3x3 x4, Material=Fabric, Color=[240,238,235]
3. Cape on styling chair: 10x12x0.3 draped, Material=Fabric, Color=[30,30,35]
4. Magazine rack: 4x10x2, Material=Metal, Color=[180,175,170] with 3x6x0.3 magazines
5. Certificate frames on wall: 6x8x0.3 x3, Material=Wood, Color=[150,120,90]

--- ROOM: HOTEL ROOM (STANDARD) ---
Dimensions: 32L x 26W x 12H studs
Floor: Material=Fabric, Color=[100,95,88] (carpet)
Walls: Material=Concrete, Color=[232,228,222]
Ceiling: Material=Concrete, Color=[240,238,234]
Color Palette: [232,228,222] [100,95,88] [255,255,255] [40,60,80] [180,160,140]

King Bed:
  Frame: 24x4x18, Material=Wood, Color=[60,55,50]
  Headboard: 24x12x3, Material=Fabric, Color=[60,55,50] (tufted)
  Mattress: 22x4x16, Material=Fabric, Color=[248,248,250]
  Duvet: 22x2x16, Material=Fabric, Color=[255,255,255]
  Decorative pillows (x4): 6x3x5 each, Material=Fabric, Color=[40,60,80]
  Bed skirt: 23x1x17, Material=Fabric, Color=[248,248,250]
  Position: [16, 4, 9]

Nightstands (x2):
  Each: 5x8x4, Material=Wood, Color=[60,55,50]
  Lamp: base 1.5x5x1.5 + shade 4x3x4, Material=Fabric Color=[220,210,195]
  Phone: 4x1x5, Material=Concrete, Color=[30,30,35]
  Alarm clock: 3x2x2, Material=Concrete, Color=[30,30,35]

Desk (work area):
  Top: 14x2x6, Material=Wood, Color=[60,55,50]
  Position: [26, 8, 6]
  Chair: ergonomic, Fabric Color=[60,55,50]
  Mirror above desk: 12x10x0.5, Material=Glass
  Desk lamp: 2x8x2, Material=Metal, Color=[60,55,50]

TV Console:
  Unit: 20x6x5, Material=Wood, Color=[60,55,50]
  Position: [16, 3, 2]
  TV: 18x11x1, Material=Glass + frame

Wardrobe/Closet:
  Size: 10x16x5, Material=Wood, Color=[60,55,50]
  Position: [3, 8, 6]
  Sliding doors: 4x14x0.5 x2, Material=Glass, Transparency=0.2
  Hangers: 6x1x6, Material=Metal, Color=[120,120,125]

Luggage Rack:
  Frame: 10x4x5, Material=Metal, Color=[120,120,125]
  Straps (x2): 9x0.5x0.5, Material=Fabric, Color=[80,70,60]
  Position: [4, 3, 20]

Entry Area:
  Coat hook: 1x2x1, Material=Metal, Color=[120,120,125]
  Key card slot (wall panel): 2x4x0.5, Material=Concrete, Color=[30,30,35]
  Mirror (full length): 4x16x0.5, Material=Glass

DETAIL PROPS:
1. Minibar: 8x10x6, Material=Metal, Color=[195,195,200] + tiny bottles inside
2. Hotel directory binder: 5x1x7, Material=Fabric, Color=[30,30,35]
3. Toiletries on desk: small 1.5x3x1.5 x3, Material=SmoothPlastic ok, Color=[248,247,245]
4. Do Not Disturb sign on door handle: 2x4x0.1, Material=Fabric, Color=[40,60,80]
5. Window with curtains: blackout curtains 4x12x0.5 Material=Fabric Color=[30,30,35] + sheer inner 4x12x0.3 Material=Fabric Color=[240,238,235]

`

export const INTERIOR_RESIDENTIAL: string = `
===========================================================================
RESIDENTIAL QUICK-REFERENCE
===========================================================================
Master Bedroom: 40x32x14, WoodPlanks floor [180,140,100], Concrete walls [235,228,218]
Child Bedroom: 28x24x12, WoodPlanks [200,170,130], Concrete [230,235,245]
Kitchen: 36x28x14, Granite floor [80,75,72], Concrete walls [240,238,235]
Bathroom: 18x16x12, Granite [120,115,110], Marble walls [230,228,225]
Living Room: 44x36x14, WoodPlanks [175,145,110], Concrete [235,230,225]
Dining Room: 34x28x13, WoodPlanks [170,138,105], Concrete [232,228,222]
Home Office: 26x22x12, WoodPlanks [165,135,105], Concrete [228,224,218]
Laundry: 20x16x11, Granite [100,96,92], Concrete [228,226,224]
Nursery: 24x20x11, WoodPlanks [210,190,165], Concrete [230,240,250]
Garage: 48x36x16, Concrete [140,136,130], Concrete [190,185,180]
Home Theater: 40x30x14, Fabric/Carpet [30,28,26], Concrete [35,32,30]

STANDARD DOOR: 4Wx8H studs, Material=Wood, Color matches wall trim
STANDARD WINDOW: 10Wx10H studs, Material=Glass, Transparency=0.7
CEILING HEIGHT RULES: Standard=12-14, Garage/Theater=16-20, Bathroom=10-12
STUD-TO-FEET RATIO: 1 stud = ~1 foot. Queen bed = 5x6.5 feet = ~20x26 studs. Door = 3x7 feet = ~12x28 studs.
FLOOR THICKNESS: 2 studs standard (prevents floating parts)
WALL THICKNESS: 1-2 studs (interior walls can be 1, exterior 2)
`
