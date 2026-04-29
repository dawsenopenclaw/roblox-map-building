// interior-residential-deep.ts — Deep residential interior knowledge
// Every room variant with furniture positions. No SmoothPlastic. Studs + RGB.

export const RESIDENTIAL_BEDROOM_DEEP: string = `
=== BEDROOM VARIANTS ===

--- MASTER MODERN (25x20 stud room) ---
Bed (king): 6 wide x 7 long x 2.2 tall, center of back wall
  Frame: Wood, Color RGB(180,150,100) | Mattress: Fabric, Color RGB(240,235,225)
  Headboard: Part 6x3x0.3, Wood, RGB(180,150,100) — against wall
  Pillows: 2-4x Part 1.2x0.4x1, Fabric, white RGB(245,240,235)
  Blanket: Part 5.8x0.3x6, Fabric, Color RGB(180,190,200)
Nightstands: 2x (1.5x1.5x2), Wood, RGB(180,150,100) — flanking bed
  Lamp on each: Part cylinder 0.3x1.5 base + 0.8x0.8 shade, PointLight Range=8
Dresser: 4x1.5x3, Wood, RGB(180,150,100) — opposite wall
Mirror: 2x3x0.1, Glass, above dresser, Transparency=0.2
Rug: 8x0.1x6, Fabric, RGB(160,150,140) — under bed, extending forward
Curtains: 2x Part 0.1x6x1.5, Fabric, RGB(180,190,200) — flanking window
Ceiling light: flush mount, Part 1.5x0.2x1.5, PointLight Range=15

--- TEEN BEDROOM (18x16 stud room) ---
Bed (twin): 3x7x2, frame Wood RGB(60,60,65), dark modern
Desk: 5x2.5x3, Wood RGB(60,60,65) — under window
  Monitor: Part 3x2x0.15, Material=Glass, Color RGB(20,20,25) on desk
  Keyboard: Part 1.5x0.1x0.5 on desk
  Chair: swivel, seat 1.8 high, Fabric RGB(40,40,45)
Bookshelf: 3x1x7, Wood RGB(60,60,65) — wall-mounted or standing
Posters: 2-3x Part 2x3x0.05, Fabric, various bright colors — on walls
LED strip: thin Neon Part along ceiling edge, Color RGB(120,50,200) or RGB(0,150,255)
Beanbag: Part (Ball-ish) 2.5x1.5x2.5, Fabric, bright color
Laundry pile: 2-3 small Parts, Fabric, various colors — on floor corner (lived-in detail)

--- CHILDS ROOM (16x14 stud room) ---
Bed (toddler): 2.5x5x1.5, Wood RGB(200,180,120), colorful blanket
Toy box: 3x2x2, WoodPlanks RGB(200,50,50) or RGB(50,100,200)
Small table: 3x3x2 (child height), Wood, pastel color
Chairs: 2x tiny, 1x1x1.2 seat height
Stuffed animals: 3-4x Part 0.5-1 size, Fabric, various colors — on bed and shelf
Wall decals: star/moon shapes, Neon material, Color RGB(255,230,100) — on walls
Night light: Part 0.3x0.5x0.3, Neon RGB(255,200,150), PointLight Range=6
Rug: circular 4x0.1x4, Fabric, bright playful color
Growth chart: thin Part 0.5x5x0.05 on wall, Fabric

--- GUEST BEDROOM (16x14 stud room) ---
Bed (queen): 5x7x2, Wood RGB(160,130,80), clean white bedding
Nightstand: 1 only, 1.5x1.5x2 — one side
Lamp: on nightstand, warm PointLight Range=8
Luggage rack: 3x1.5x1.8, Metal RGB(40,40,45) — foot of bed
Dresser: small 3x1.5x2.5 — against wall
Mirror: 1.5x2.5x0.1 above dresser
Minimal decor: 1 plant on dresser, 1 artwork on wall
Extra blanket: folded Part 1.5x0.3x1 on bed foot

--- LUXURY MASTER (30x25 stud room) ---
Bed (king): ornate headboard 6x4x0.4, Wood or Fabric RGB(60,30,60)
  Tufted headboard detail: multiple small Part indentations
Seating area: 2 armchairs + small table near window
Fireplace: 5x5x1.5 against wall, Brick/Cobblestone + Neon fire
Walk-in closet entrance: opening in wall to 10x8 adjacent room
En-suite bathroom entrance: opening to attached bathroom
Chandelier: Metal frame + Glass/Neon crystals, PointLight Range=20
Thick curtains: Floor-length, Fabric RGB(60,30,60), heavy luxury look
Art: large 4x3 framed piece above fireplace

--- DORM ROOM (12x12 stud room) ---
Loft bed: twin bed elevated at 6 studs, desk underneath
  Ladder: 3 rungs, Metal RGB(40,40,45)
Desk under loft: 4x2x3, cramped but functional
Mini fridge: 1.5x1.5x2, Metal RGB(200,200,205)
Bulletin board: 3x2x0.1, Fabric RGB(160,130,80) — cork
Clothes rack: Metal pole 3 wide x 5.5 tall, on wheels
Poster: at least 1, Fabric
Micro space: everything serves double purpose

--- CABIN BEDROOM (18x16 stud room) ---
Log walls visible: Material=Wood, Color RGB(140,90,40)
Bed: rustic frame, thick posts 0.6x0.6, WoodPlanks
  Quilted blanket: patchwork look via 4-6 colored Fabric Parts
Nightstand: tree stump style — Part cylinder 1.5x2, Wood, bark color
Lantern: on nightstand, small Neon + PointLight Range=6 warm
Fur rug: Part 5x0.15x4, Fabric RGB(140,130,115) at bedside
Antler decor: small Part arrangement on wall, Wood brown
Window: smaller, 2x2, with thick Wood frame
`

export const RESIDENTIAL_KITCHEN_DEEP: string = `
=== KITCHEN VARIANTS ===

--- MODERN KITCHEN (20x16 stud room) ---
Counters: L-shaped, 3.5 studs tall, 2 deep
  Base cabinet: Part 2x3x2, Wood RGB(240,235,225) — white shaker
  Counter top: Part 2.2x0.15x2.2, Granite RGB(40,40,45) — dark stone
  8-10 base cabinets along two walls
Upper cabinets: Part 2x2.5x1, same color as base — mounted at 5.5 studs
Sink: Part 2x0.5x1.5, Metal RGB(180,180,185) — recessed into counter
Faucet: small Part assembly, Metal chrome
Stove/Range: Part 2.5x3.5x2, Metal RGB(50,50,55) — 4 burner circles on top
  Burner circles: 4x Part (cylinder) 0.5x0.05, Metal dark
Refrigerator: Part 3x6x2.5, Metal RGB(190,190,195)
Island: 6x3.5x2, Wood base + Granite top, 2-3 bar stools
Bar stool: Metal legs + Fabric seat, 3.5 studs tall
Microwave: Part 1.5x1x1, Metal — on counter or in upper cabinet space
Pendant lights: 2-3 hanging over island, PointLight Range=10

--- FARMHOUSE KITCHEN (22x18 stud room) ---
Cabinets: Wood RGB(230,225,210) — cream/off-white, open shelving upper
Counter: Wood butcher block, Color RGB(160,120,70)
Apron sink: wider, Part 2.5x0.6x2, white porcelain look (Concrete white)
Range: vintage look, Part with 6 burners, Material=Metal
Pot rack: hanging Metal frame above island with hook Parts
Open shelving: no upper cabinet doors, Wood shelves with displayed items
  Plates, mugs, jars as small Props on shelves
Farm table: 8x3x3, Wood, seats 6 — instead of island
Mason jar vases: tiny Parts on counter, Fabric + Glass
Herb pots: 3x on windowsill, small Grass-material Parts

--- GALLEY KITCHEN (16x8 stud room) ---
Two parallel counter runs, 3.5 stud aisle between
Efficient layout: sink → prep → cook → serve in line
No island (no room)
Narrow: emphasize good lighting — under-cabinet lights (SpotLight)
Upper cabinets on both sides
End: window or pass-through to dining

--- COMMERCIAL KITCHEN (30x20 stud room) ---
All stainless: Metal RGB(190,190,195) everything
Center prep island: 10x3x3, Metal top
Walk-in cooler door: 4x7 heavy Metal door on back wall
Hood vent: large Part 8x1x4, Metal, above cooking line
Cooking line: 12 studs of continuous range/grill/fryer
Floor: DiamondPlate, Color RGB(150,150,155) — anti-slip
Shelving: Metal wire racks along walls, 4 studs deep
Dish station: double sink + drying rack area
Fire suppression: red cylinder Part mounted to wall
`

export const RESIDENTIAL_BATHROOM_DEEP: string = `
=== BATHROOM VARIANTS ===

--- MODERN BATHROOM (12x10 stud room) ---
Vanity: Part 4x3.5x2, Wood RGB(200,195,185) — wall-mounted look
  Counter: Part 4.2x0.1x2.2, Marble RGB(240,235,225)
  Sink basin: Part 1.5x0.3x1, Concrete white — recessed
  Mirror: Part 3.5x3x0.1, Glass, Transparency=0.1 — above vanity
  Faucet: small Metal parts
Toilet: seat Part 1.5x1.8x1, Concrete white + tank Part 1.5x2.5x0.5
  Position: 1 stud from wall
Shower: glass enclosure 4x4 area
  Glass walls: 2x Part 4x7x0.1, Glass Transparency=0.3
  Showerhead: Metal Part on wall at 7 studs
  Drain: small Part in floor, Metal
  Tile walls: Concrete RGB(230,230,235)
Floor tile: Marble or Concrete, light gray
Towel bar: Part 2x0.1x0.1, Metal — on wall
Bath mat: Part 2x0.08x1.5, Fabric RGB(240,235,225)

--- LUXURY BATHROOM (20x16 stud room) ---
Freestanding tub: oval Part 5x2x2.5, Concrete white
  Claw feet: 4x small Metal Parts underneath
Double vanity: 8x3.5x2 — his and hers sinks
Rain shower: 6x6 walk-in, no door, bench inside
  Rain head: 1x0.1x1 flat Part overhead
Heated floor: subtle warm PointLight from below
Chandelier: yes, even in bathroom, small elegant
`

export const RESIDENTIAL_LIVING_DEEP: string = `
=== LIVING ROOM VARIANTS ===

--- MODERN LIVING ROOM (24x20 stud room) ---
Sectional sofa: L-shaped, 8x3x3 + 5x3x3, Fabric RGB(160,160,165)
  Throw pillows: 3-4x Part 0.8x0.8x0.3, Fabric accent colors
Coffee table: 4x1.5x2.5, Metal legs + Glass top
TV: Part 5x0.15x3, Glass RGB(15,15,20) — mounted on wall at 4 studs
TV console: 6x2x1.5, Wood RGB(60,55,50) — below TV
Rug: 8x0.08x6, Fabric — under coffee table area
Floor lamp: slim Metal pole + shade, PointLight Range=12
Plant: corner, 1x1 pot + 2x3 Grass arrangement
Bookshelf: 3x1x7, Wood — display shelf with books and objects
Side table: 1.5x1.5x2, Metal + Wood top — next to sofa arm
Window: large 6x5, sheer curtains Fabric RGB(245,240,235)

--- COZY CABIN LIVING (22x18 stud room) ---
Stone fireplace: 6x8x2, Cobblestone RGB(120,115,105)
  Mantel: Wood plank 6.5x0.5x1, RGB(130,85,35)
  Fire: Neon + ParticleEmitter inside
  Log stack: small Wood Parts beside fireplace
Leather sofa: 7x3x3, Fabric RGB(80,50,25) — facing fire
Rocking chair: Wood frame, Fabric seat — beside fire
Braided rug: circular 6x0.08x6, Fabric warm colors
Mounted fish/antlers: on wall above fireplace
Heavy curtains: thick Fabric RGB(100,60,30)
Log walls: visible Wood grain, RGB(140,90,40)
Warm lighting: all PointLights warm RGB(255,200,120)
`

export const RESIDENTIAL_SPECIAL_DEEP: string = `
=== SPECIAL RESIDENTIAL ROOMS ===

--- HOME GYM (20x16 stud room) ---
Rubber floor: Material=Fabric, Color RGB(40,40,45) — dark matte
Treadmill: 3x5x5, Metal frame + Fabric belt
Weight rack: 5x3x4, Metal RGB(50,50,55) — wall-mounted
Bench press: 5x2x4, Metal frame + Fabric pad
Mirror wall: one full wall, Glass Transparency=0.1
Fan: ceiling mount, Part blades
Speaker: small Part on shelf
Water cooler: 1x1x4, Metal + Glass

--- HOME THEATER (24x18 stud room) ---
Screen: Part 10x0.1x6, Concrete RGB(240,240,245) or actual Glass/Neon
Projector: small Part on ceiling, SpotLight aimed at screen
Tiered seating: 3 rows, each 2 studs higher than previous
  Recliners: wide Fabric chairs, 3 per row
Carpet: thick Fabric RGB(30,25,35) — dark
Acoustic panels: Part 3x4x0.2, Fabric dark — on side walls
Popcorn machine: novelty 1.5x1.5x4 — corner
LED strip: Neon along stair edges for navigation

--- LAUNDRY ROOM (10x8 stud room) ---
Washer: 2.5x3x2.5, Metal RGB(235,235,240)
Dryer: 2.5x3x2.5, Metal RGB(235,235,240) — next to washer
Folding counter: 4x3x3, Wood + Concrete top
Hanging rod: Metal bar above counter for drip-dry
Shelf above machines: 5x1x0.5, Wood — detergent, supplies
Laundry basket: 1.5x2x1.5, Fabric — on floor
Utility sink: small Metal 1.5x3x1

--- STUDY / HOME OFFICE (16x14 stud room) ---
Desk: 6x3x3, Wood RGB(120,80,35)
  Monitor: Part 3x2.2x0.1, Glass
  Keyboard + mouse: tiny Parts
  Desk lamp: Metal arm + shade, SpotLight Range=6
Office chair: swivel, Fabric RGB(50,50,55), wheels
Bookcase: 4x1x7, Wood — floor to near ceiling, full of books
  Books: colored Part strips 0.3x0.8x various heights
Filing cabinet: 1.5x2.5x1.5, Metal RGB(80,80,85)
Rug: 5x0.08x4, Fabric muted color
Window: behind desk for natural light
`

export const RESIDENTIAL_DETAILS: string = `
=== LIVED-IN DETAIL PROPS ===

--- CLUTTER THAT TELLS STORIES ---
Reading corner: open book (Part 1x0.1x0.8, Fabric white) face-down on armrest
  Reading glasses: tiny Part 0.5x0.1x0.2, Glass
Remote control: Part 0.5x0.05x0.15 on coffee table
Coffee mug: tiny cylinder 0.3x0.4, ring stain Part 0.4x0.01x0.4 on table
Shoes by door: 2 pairs small Parts, Fabric — messy arrangement
Keys: tiny Part 0.2x0.05x0.1, Metal — on entry table or hook
Mail pile: 3-4 thin Part stack on counter
Pet bowl: 0.8x0.3x0.8 cylinder, Metal — by kitchen
Charging phone: tiny Part on nightstand with thin cord Part to wall

--- WEAR AND AGE INDICATORS ---
Slightly different wall color near switches: lighter rectangle where hands touch
Worn rug edges: slightly different shade at high-traffic paths
Scratches on floor near furniture: subtle darker lines
Faded curtain sections: where sun hits, slightly lighter color
Water stain on ceiling: one Part slightly darker, Concrete

--- SEASONAL INDICATORS ---
Summer: fan spinning, windows open (no glass Part), bright light
Winter: blankets on sofa, fire in fireplace, warm lights
Holiday: wreath on door (green Fabric ring + red Fabric bow)
Autumn: warm-toned throw blanket, candle on table

--- PERSONALITY INDICATORS ---
Reader: stacked books everywhere, reading nook
Musician: instrument on stand (guitar = Wood frame + Fabric strings)
Gamer: multiple monitors, RGB LED strips, headset on desk
Chef: cookbooks, herb garden, fancy utensils displayed
Artist: easel in corner, paint-splattered cloth, colorful chaos
Minimalist: very few items, clean surfaces, monochrome
`

export const INTERIOR_RESIDENTIAL_DEEP: string = RESIDENTIAL_BEDROOM_DEEP + '\n\n' + RESIDENTIAL_KITCHEN_DEEP + '\n\n' + RESIDENTIAL_BATHROOM_DEEP + '\n\n' + RESIDENTIAL_LIVING_DEEP + '\n\n' + RESIDENTIAL_SPECIAL_DEEP + '\n\n' + RESIDENTIAL_DETAILS
