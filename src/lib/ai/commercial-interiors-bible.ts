// commercial-interiors-bible.ts — Retail, restaurant, office, hotel, medical, entertainment
// No SmoothPlastic. Dimensions in studs. RGB colors.

export const COMMERCIAL_RETAIL: string = `
=== RETAIL STORE INTERIORS ===

--- CONVENIENCE STORE (30x20 stud room) ---
Entry: glass double door 6 wide, auto-open sensor above
Counter/checkout: 6x3.5x2, Concrete top + Wood front — near entry
  Cash register: Part 1x1x0.8, Metal
  Card reader: tiny Part on counter
  Bag holder: Metal frame
Shelving aisles: 3 rows of double-sided shelves
  Each shelf unit: 4x1x6 tall, Metal RGB(200,200,205) — gray industrial
  5 shelf levels per unit
  Products: colored Part blocks on shelves (variety of sizes/colors)
Refrigerated wall: back wall, 20 wide x 6 tall x 2 deep
  Glass doors: Material=Glass, frame Metal
  Interior light: PointLight per section, cool white
Drink cooler: separate 8x6x2 unit, Glass front
Floor: Concrete, light gray RGB(200,195,190) — tile look
Ceiling: Concrete white + fluorescent light fixtures (SurfaceLight)
ATM: 1.5x5x1, Metal — near entrance
Security camera: tiny Part on ceiling corner, dark Material

--- CLOTHING BOUTIQUE (25x20 stud room) ---
Display tables: 4x2.5x3, Wood — folded clothes on top
Clothing racks: Metal bar 5 wide x 5 tall, on wheeled base
  Hangers: small Part hooks along bar
  Clothes: colored Fabric Parts hanging
Mannequins: R15-proportioned Part assembly on stand
  3-4 in display window, 2-3 inside
Fitting rooms: 2-3 enclosed 4x4 stalls
  Curtain or door, mirror inside, hook on wall, bench
Full-length mirror: 2x5x0.1, Glass — multiple locations
Checkout counter: 5x3.5x2, Wood/Marble top
  Wrapped items, tissue paper props
Chandelier or track lighting: accent lights on displays
Seating: small bench or ottoman for waiting
Floor: Wood or polished Concrete

--- GROCERY STORE (50x40 stud room) ---
Produce section: open bins at entry, Wood bins with Grass-material produce
Meat counter: 8x3.5x1, Glass display front + Metal top
Bakery: glass display case 6x3.5x1.5, bread/cake props inside
12-15 aisles: double-sided shelving, aisle width 5-6 studs
Freezer section: back wall and one aisle, Glass-door units
Checkout lanes: 4-6 lanes, conveyor belt Part + dividers
Shopping carts: small Metal frame assemblies near entry
Deli counter: staffed counter with glass display
Floral section: near entry, colorful Fabric flower props
Customer service desk: 6x3.5x3.5, elevated
Floor: polished Concrete, aisle markers on floor (colored line Parts)
Ceiling: high 15-18 studs, industrial exposed

--- BOOKSTORE (30x25 stud room) ---
Bookshelves: 8-12 units, 4x1x7, Wood RGB(120,80,35) — wall and freestanding
  Books: thin colored Part strips (0.3 x varying height x 0.8)
Reading nooks: 2-3 armchairs + floor lamp in corners
  Armchair: 2.5x2.5x3, Fabric, cozy colors
Central display table: 5x3x2.5 — new releases, face-out
Kids section: lower shelves (4 tall), bright rug, tiny chairs
Cafe corner: small counter, 3 cafe tables, espresso machine prop
Checkout: 4x3.5x2, Wood — near exit
Floor: Wood, warm lighting throughout
Ambient: warm PointLights RGB(255,210,160), cozy feel

--- PET STORE (30x20 stud room) ---
Dog/cat kennels: Part enclosures 3x3x3, Metal bars front
Aquarium wall: 8x5x1.5, Glass with blue-tinted water inside
Bird section: large cage 6x6x7, Metal mesh
Shelving: pet food, toys, supplies — standard retail shelving
Grooming area: back room, tub Part 3x2x2, Metal
Checkout: standard, 5x3.5x2
Floor: easy-clean Concrete, slightly textured
`

export const COMMERCIAL_RESTAURANT: string = `
=== RESTAURANT INTERIORS ===

--- FAST FOOD (35x25 stud room) ---
Counter: 12x3.5x4, Concrete top + branded front panel
  Menu boards: 3x Part 4x2.5x0.1 above counter, Neon backlit
  Registers: 3 stations, Metal parts
  Tray slides: Metal rail along counter front
Kitchen visible: open behind counter, Metal equipment
Seating: 15-20 seats
  Booth: Part bench 5x2x3 + table 4x3x3, seats 4
  Fixed table+chairs: Metal pedestal table 3x3x3, plastic chairs
Drink station: 4x3.5x2, drink dispenser Part 2x2x3
Trash/tray return: 2x2x3.5, Metal — near exit
Restroom: 2 rooms off side hallway
Floor: tile Concrete, easy-clean
Lighting: bright, fluorescent — SurfaceLight on ceiling panels

--- FINE DINING (30x25 stud room) ---
Tables: round 3x3x3 or square 4x4x3, white tablecloth (Fabric over Wood)
  Each table: 2-4 chairs, upholstered Fabric seats
  Table setting: tiny plate, glass, utensil Parts per seat
  Candle centerpiece: small Neon flame + PointLight Range=4
Host stand: 2x3.5x1.5, Wood — at entrance
Bar area: 10x4x4, Wood/Granite top, bar stools, back-bar shelving
  Bottles: colored Glass Part array on back-bar
  Pendant lights: 3-4 hanging, PointLight Range=6 warm
Wine rack: 4x6x1, Wood — glass bottle Parts
Dividers: low walls 4 tall, Fabric panels — between sections
Floor: Wood, dark stained RGB(60,40,20)
Lighting: dim, warm — PointLight Range=8-12, Color RGB(255,190,130)
Music: no visible speakers (ambient)
Kitchen door: swinging, no window — back wall

--- COFFEE SHOP (25x18 stud room) ---
Counter: 8x3.5x4, Wood front + Granite top
  Espresso machine: Part 1.5x2x1, Metal chrome
  Pastry display: Glass case 3x3.5x1.5
  Menu: chalkboard Part 4x3x0.1, Fabric dark — behind counter
Seating variety:
  2-top tables: 2.5x3x3, Wood — 4-6 of them
  Counter bar: window-facing ledge 8x3.5x1, with bar stools
  Cozy corner: 1-2 armchairs + coffee table
  Communal table: 8x3x3, Wood — seating 6-8
Condiment station: small shelf 2x3.5x0.8
Outlet/USB: detail on walls near seating
Floor: Concrete polished or Wood
Lighting: mix of pendant (over counter), recessed, and warm ambient
Decor: exposed brick accent wall (Brick material), plants, art

--- PIZZA RESTAURANT (30x22 stud room) ---
Pizza oven: 4x4x4, Brick RGB(160,80,50) — visible from dining
  Dome shape, Neon fire inside, PointLight warm
Counter: 6x3.5x3.5, Glass display for slices
Dining: 8-10 tables, red checkered tablecloths (Fabric red/white)
  Booth seating along walls: red Fabric benches
Pepper/cheese shakers: tiny Props on tables
Ceiling: exposed duct work (industrial charm), Metal pipes
Floor: tile Concrete, black and white checkerboard pattern

--- BAR / PUB (30x20 stud room) ---
Bar: 12-16x4x4, Wood dark RGB(50,30,15) — central feature
  Bar top: polished Wood
  Bar stools: 8-12, Metal + Fabric seats, 3.5-4 studs tall
  Taps: 6-8 Metal handles on Part 2x2x0.5
  Back-bar: full wall shelving, bottles, mirror
Pool table: 5x3x3, Wood frame + Fabric green top
Dart board: circular 1.5x1.5x0.1 on wall
TVs: 2-3x Part 4x0.1x2.5, Glass — mounted high
Booth seating: dark Wood + Fabric, intimate
Floor: Wood, worn-looking
Lighting: dim, PointLight warm, neon beer signs (Neon material)
Jukebox: 2x4x1.5, Metal + Neon
`

export const COMMERCIAL_OFFICE: string = `
=== OFFICE INTERIORS ===

--- OPEN OFFICE (50x40 stud room) ---
Workstations: 4-person pods, each desk 5x2.5x3
  Desk dividers: Part 5x1.5x0.1, Fabric — low privacy panels
  Each desk: monitor, keyboard, mouse, cup, small plant
  Task chair: Fabric + Metal, per desk
Collaboration area: 2 sofas + whiteboard, no desks
Meeting rooms: 2-3 glass-walled rooms 10x10 along perimeter
  Glass walls: Material=Glass, Transparency=0.2
  Conference table: 8x4x3, Wood
  6-8 chairs around
  TV/screen: mounted on wall
Kitchen/break room: along one wall, 12x6
  Counter, microwave, coffee machine, sink, refrigerator
  Small table with 4 chairs
Reception: front area, desk 6x3.5x3.5, company logo on wall (SurfaceGui or Part)
Floor: Concrete or low Carpet (Fabric) throughout
Ceiling: 12-15 studs, grid ceiling tiles (Concrete white)
Lighting: recessed panel lights (SurfaceLight) even distribution

--- EXECUTIVE OFFICE (16x14 stud room) ---
Desk: 7x3x3, Wood dark RGB(60,35,15) — imposing
  Leather chair: large, Fabric RGB(40,30,20)
2 guest chairs: Fabric, facing desk
Bookcase: floor-to-ceiling, 6x1x8, Wood — behind desk
Credenza: 6x3x2, Wood — behind desk below bookcase
Window: large, floor-to-ceiling
Rug: 8x0.08x6, Fabric rich color — under seating area
Art: framed pieces on walls
Plants: 1-2 potted, corner placement
`

export const COMMERCIAL_HOTEL: string = `
=== HOTEL INTERIORS ===

--- HOTEL LOBBY (40x30 stud room, 20+ tall) ---
Front desk: 12x3.5x4, Marble or Granite top
  Computer stations: 3 monitor setups
  Key card machine: small Metal Part
Seating clusters: 3-4 groups of 2 armchairs + side table
  Fabric upholstery, coordinated colors
Luggage cart: Metal frame 3x3x4 on wheels
Elevator bank: 2-3 elevator doors, 4 wide x 8 tall, Metal
  Up/down buttons: small Neon Part beside each
Chandelier: grand, center of lobby, Metal + Glass, PointLight Range=25
Marble floor: Marble material, pattern of light and dark tiles
Columns: 2-4 decorative, 1.5 diameter x lobby height, Marble
Concierge desk: smaller 4x3.5x3.5 — separate from front desk
Bell cart: Metal 1x1.5x3, shiny

--- HOTEL ROOM (20x16 stud room) ---
Bed: queen or king, white bedding, decorative runner across foot
  Headboard: padded Fabric, mounted to wall
Nightstands: 2x matching, with lamp + alarm clock
TV: mounted opposite bed, 4 wide
Desk/vanity: 4x2.5x3, Wood — with mirror
Luggage rack: 3x1.5x1.5, Metal — collapsible look
Mini bar: 2x3x1.5 cabinet, Wood — under TV
Bathroom: attached, visible through doorway
  Standard: vanity + toilet + shower/tub combo
Closet: sliding door, 4 wide — hangers, safe prop
Curtains: blackout, heavy Fabric — floor to ceiling
Art: 1-2 framed above bed
Lighting: bedside lamps + desk lamp + overhead
Card key slot: tiny Part by door (powers room lights)
`

export const COMMERCIAL_MEDICAL: string = `
=== MEDICAL FACILITY INTERIORS ===

--- DOCTOR WAITING ROOM (25x20 stud room) ---
Reception: 8x3.5x4, Concrete/Laminate top, glass partition (upper)
  Sliding window: Glass Part that opens
  Computer, phone, files behind
Seating: 12-16 chairs in rows
  Fabric seats, Metal frames, RGB(140,160,180) calming blue
  End tables: 2x1.5x1.5 with magazines (flat Part stacks)
TV: mounted high 4x0.1x2.5 — showing health content
Fish tank: 3x2x4, Glass + blue lighting — calming
Floor: Concrete, light color — easy clean
Check-in kiosk: 1.5x4x1, Metal — touchscreen prop
Pamphlet rack: 2x4x0.5, Metal wire — on wall
Restroom: off hallway, accessible

--- EXAM ROOM (12x10 stud room) ---
Exam table: 3x2.5x3, Metal frame + Fabric pad, paper roll on top
  Part for paper roll: thin white Part over pad
Doctor stool: rolling, Metal + Fabric, low
Cabinet: 3x3.5x1.5, Concrete white — medical supplies
Sink: small Metal, wall-mounted
Blood pressure cuff: tiny Part on wall bracket
Sharps container: small red Part 0.5x0.8x0.3 on wall
Light: overhead adjustable (SpotLight on arm)
Computer: on small desk, for records
Curtain divider: Fabric on track — for privacy
`

export const COMMERCIAL_ENTERTAINMENT: string = `
=== ENTERTAINMENT VENUE INTERIORS ===

--- ARCADE (35x25 stud room) ---
Arcade cabinets: 2.5x5x1.5 each, Wood sides + Glass/Neon front
  Screen: Neon colored display
  15-20 cabinets arranged in rows
Claw machine: 3x5x3, Glass + Metal frame, stuffed animals inside
Air hockey: 5x3x3, Metal top + Neon puck slot
Skee-ball: 2.5x8x4, WoodPlanks lanes, 3-4 side by side
Prize counter: 8x3.5x4, Glass display of prizes
  Stuffed animals, toys: colored Fabric/Plastic Parts
Carpet: wild pattern, Fabric bright colors RGB(120,30,120)
Lighting: dim with neon accents, each game has PointLight
Token machine: 1.5x4x1.5, Metal — exchanges coins for tokens
Party room: separate 15x15, table and chairs for 8

--- MOVIE THEATER AUDITORIUM (40x50 stud room) ---
Screen: 30x0.1x15, Concrete white — front wall
Seating: tiered rows, 10-15 rows, 12-20 seats per row
  Seat: fold-down Fabric, 2 wide x 3 tall, armrest between
  Row spacing: 3.5 studs (legroom)
  Tier rise: 1.5 studs per row
Aisle: 4 studs wide, center and both sides
Aisle lighting: Neon strips along floor, dim
Cup holders: detail on armrests
Emergency exit: illuminated signs (Neon green)
Floor: slight slope (if not tiered), Fabric dark
Speaker grills: dark Fabric Parts on side walls
Projection booth: small window at back, high up

--- BOWLING ALLEY (per lane: 6x60 stud) ---
Lane: 4 wide x 50 long, Wood polished, very smooth
  Gutters: 0.5 wide x 50 long, channels on each side
  Pins: 10x small white Parts in triangle at end
  Pin machine: Metal structure behind pins
Ball return: 2x1.5x1 unit at bowler end, curved Part
  Bowling balls: 0.8 diameter spheres, various colors
Seating area: behind bowler position, 6x4 per lane
  Scoring screen: Part 2x1.5x0.1, overhead
  Bench: 5x1.8x2, Fabric
Shoe rental counter: near entrance, 8x3.5x4
Snack bar: adjacent, fast food counter style
`

export const COMMERCIAL_INTERIORS_BIBLE: string = COMMERCIAL_RETAIL + '\n\n' + COMMERCIAL_RESTAURANT + '\n\n' + COMMERCIAL_OFFICE + '\n\n' + COMMERCIAL_HOTEL + '\n\n' + COMMERCIAL_MEDICAL + '\n\n' + COMMERCIAL_ENTERTAINMENT
