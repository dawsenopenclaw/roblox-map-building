// Roblox Architectural Styles Bible
// Every dimension in studs. Every color as RGB. No SmoothPlastic ever.
// No backticks inside template literals — single quotes used for inline code.

export const ARCH_MEDIEVAL: string = `
=== MEDIEVAL ARCHITECTURAL BIBLE ===

--- MEDIEVAL CASTLE ---
Wall: Material=Cobblestone, RGB(105,105,105), thickness=6-8 studs, height=40-80 studs
Battlements: crenellations every 4 studs, merlon=4wx6hx4d, crenel=4wx4h gap, Material=Cobblestone RGB(90,90,90)
Towers: circular preferred, diameter=16-24 studs, height=60-100 studs, slightly darker than walls
Tower caps: conical roof, Material=Slate, RGB(60,60,70), pitch 45 degrees
Gatehouse: 20w x 30h arch opening, portcullis=vertical bars 1 stud diameter every 3 studs, Material=Metal RGB(80,80,80)
Drawbridge: 12w x 20l planks, Material=Wood RGB(101,67,33), drops at 90 degrees over moat
Moat: 10-16 studs wide, 6-8 deep, water Material=Neon RGB(28,100,120) at 0.3 transparency
Interior keep: central tower 20x20 footprint, 4-6 inner floors at 12 studs each
Arrow slits: 1w x 6h, recessed 2 studs into wall, every 8-12 studs along outer walls
Buttresses: 3w x 3d x wall-height, spaced every 20 studs on exterior

Roof: Conical on towers (45 deg pitch), flat with crenellations on curtain walls
Windows: Arrow slits primary, great hall gets 4w x 8h pointed arch, Material=Neon RGB(200,180,100) for lit effect
Doors: 6w x 12h pointed arch, 2-plank Wood RGB(80,50,20), Iron hinges=Metal RGB(60,60,60)

Color Palette:
  Stone wall: RGB(105,105,105)
  Dark stone accent: RGB(70,70,75)
  Roof slate: RGB(55,55,65)
  Wood beam: RGB(101,67,33)
  Iron hardware: RGB(60,60,60)

Scale: Small fort 80x80, Medium castle 200x200, Large fortress 400x400
Key elements:
  1. Flag poles on towers: 2 stud cylinder, height 12, banner=SurfaceAppearance or neon panel
  2. Torch sconces: Neon RGB(255,140,0) small block at 1 stud intervals along interior walls
  3. Wooden scaffolding on 1 tower always (construction detail, adds life)
  4. Stone steps spiral up towers — 1.5w x 0.5h x 1.5d wedge parts, 16 per floor
  5. Murder holes in gatehouse ceiling: 2x2 openings every 4 studs
  6. Well in courtyard: 8 diameter cylinder base, Material=Cobblestone, rope=thin cylinder
  7. Dungeons underground: -8 to -20 studs depth, iron bar doors

AI mistakes to avoid:
  - Do NOT make flat box towers — always add crenellations or conical caps
  - Do NOT skip the gatehouse — it is the most important visual anchor
  - Do NOT make walls thinner than 4 studs — they look paper-thin
  - Do NOT use SmoothPlastic for any surface
  - Do NOT make all walls same height — vary 40-80 studs for visual interest
  - Do NOT forget interior — empty courtyards look unfinished

--- GOTHIC CATHEDRAL ---
Wall: Material=Cobblestone RGB(120,115,110), thickness=5-7 studs, height=60-100 studs
Flying buttresses: arched support arms angling from wall to outer pier, width=2 studs
Nave: central hall 20-30w, flanked by aisles 10w each, total width 40-50 studs
Length: 150-300 studs
Interior columns: 2 stud diameter pillars every 12 studs, height matches nave, Material=Marble RGB(200,195,185)
Ribbed vaulting: diagonal wedge parts forming X pattern on ceiling, Material=Marble RGB(210,205,195)
Rose window: circular frame 10-14 diameter, stained glass=Neon RGB(180,80,200) or RGB(255,100,50)
Pointed arches: all openings use 2 angled wedge parts at top — never rounded
Twin towers: 20x20 base, 80-120 studs tall, octagonal above 60 studs
Spire: narrow pyramid 4x4 base, 30-50 studs tall, Material=Metal RGB(80,85,90)
Gargoyles: small ornamental water spout blocks at buttress ends, Material=Cobblestone RGB(90,90,85)

Roof: Steep pitch 60+ degrees, Material=Slate RGB(55,60,68), lead flashing at ridges=Metal RGB(100,100,100)
Windows: 3w x 12h pointed lancets in pairs, Neon interior light RGB(200,200,150)
Doors: 8w x 18h pointed triple portal, 6 recessed rings of arch molding, Wood RGB(60,40,20)

Color Palette:
  Main stone: RGB(120,115,110)
  Light interior stone: RGB(190,185,175)
  Roof slate: RGB(55,60,68)
  Stained glass warm: RGB(255,160,50)
  Stained glass cool: RGB(80,130,220)

Scale: Parish 60x120, Cathedral 80x250, Mega-cathedral 100x400

Key elements:
  1. Choir stalls: rows of Wood RGB(80,50,20) benches inside, 8 studs long each
  2. Altar: raised platform 3 studs, central table 10x4x4, Marble RGB(220,215,205)
  3. Nave lighting: chandelier cylinders with Neon RGB(255,220,150) hanging every 20 studs
  4. Confessional booths: 4x4x8 wooden boxes along side aisles
  5. Bell tower interior: visible rope, bell=Metal RGB(180,150,50) cylinder at top
  6. Crypt entrance: stairs descend at nave end, iron gate, Neon ambient RGB(30,30,50)
  7. Clerestory windows: second level windows flood nave with colored light

AI mistakes to avoid:
  - Do NOT make rounded arches — Gothic uses pointed arches exclusively
  - Do NOT forget flying buttresses — they define the exterior silhouette
  - Do NOT make interior empty — pews, altar, columns are essential
  - Do NOT make towers same height as nave — they must soar above

--- TUDOR ARCHITECTURE ---
Wall: Half-timber frame — Brick fill RGB(175,90,65), Wood frame RGB(80,50,20), frame members=3 stud wide
Frame pattern: vertical studs every 8 studs, diagonal braces in corners, horizontal rail at midheight
Overhang (jetty): upper floors project 2-3 studs beyond lower, creates shadow line
Jettying: each floor overhangs previous by 2 studs outward
Plaster panels: Material=SandWall RGB(220,210,185) between timber frame members
Chimney stacks: clustered octagonal chimneys, 3-4 per group, Material=Brick RGB(160,80,55), height 6-10 studs above ridge

Roof: Steeply pitched 45-55 degrees, Material=Slate RGB(70,65,60) or thatch=SandWall RGB(160,140,90)
Gables: decorative gable ends with timber detailing, ornamental bargeboards=Wood RGB(60,40,15)
Dormers: small gabled windows projecting from roof slope, 4w x 6h
Windows: leaded diamond panes — 6w x 8h grouped in threes, Material=Glass, thin Metal frame
Casement windows swing outward on hinges

Doors: Heavy plank-and-batten 4w x 8h, Wood RGB(70,45,15), large iron ring handle

Color Palette:
  Oak timber: RGB(80,50,20)
  Plaster: RGB(220,210,185)
  Brick fill: RGB(175,90,65)
  Roof slate: RGB(70,65,60)
  Iron hardware: RGB(50,50,50)

Scale: Cottage 30x40, Manor 80x120, Great House 150x200

Key elements:
  1. Wattle-and-daub infill: alternating Brick and SandWall panels
  2. Ornate chimney stacks always clustered, never single
  3. Great hall with hammer-beam roof: exposed Wood trusses every 10 studs
  4. Oriel bay window: 3-sided projecting window on upper floor, 10w x 10h x 4d
  5. Stone base course: first 4 studs of wall is Cobblestone RGB(120,115,110)
  6. Herb garden with low hedges adjacent
  7. Wooden gate in stone archway at property entrance

AI mistakes to avoid:
  - Do NOT make flat facades — the jettying overhangs define Tudor character
  - Do NOT use regular brick pattern for the frame panels — alternate materials
  - Do NOT skip clustered chimneys — single chimney looks wrong

--- VIKING LONGHOUSE ---
Wall: Material=Wood RGB(90,60,30), horizontal planks 1 stud thick, length 40-100 studs, width 12-18 studs
Roof: Curved ridge — arch-shaped cross section, Material=SandWall RGB(120,110,70) for turf or Wood for thatch
Roof overhang: 3 studs beyond walls on long sides
Entry: each short end has 4w x 7h door, no frame decoration
Dragon posts: carved vertical posts flanking entrance, 1 stud diameter, height 8, Material=Wood RGB(70,45,20)
Interior posts: two rows of internal supports 1.5 diameter, every 8 studs along length
Central hearth: 6x6 area in floor center, no chimney (smoke hole in ridge instead)
Sleeping platforms: raised 2-stud benches along both long walls, 4 studs wide
Smoke hole: 3x6 opening at ridge peak, Material=Neon RGB(40,30,20) inside for glow effect

Roof: Whale-back curved arch, Material=SandWall RGB(130,115,75) for living turf
Ridge poles: Wood RGB(80,55,25) running full length
Gable end decoration: carved dragon/serpent head at peak, Material=Wood

Color Palette:
  Dark oak: RGB(90,60,30)
  Lighter wood: RGB(120,85,45)
  Turf roof: RGB(80,100,60)
  Iron/bronze: RGB(100,85,50)
  Smoke black: RGB(30,25,20)

Scale: Small 40x12, Hall 80x18, Chieftain hall 120x20

Key elements:
  1. Shield wall along exterior: round shields hung every 3 studs, Material=Wood + Metal
  2. Longship beached nearby: distinctive curved prow, 60+ studs long
  3. Weapon racks inside: spears and axes on wall mounts
  4. Animal pens in attached side structure
  5. Smoking meat on hooks above central fire
  6. Carved runestones at entrance, Material=Cobblestone with Neon text highlights
  7. Mead barrels stacked near entrance wall

AI mistakes to avoid:
  - Do NOT make rectangular box roof — the curved longhouse roof is the defining feature
  - Do NOT add windows — longhouses had none, only smoke hole and door
  - Do NOT forget the dragon posts at entrance
  - Do NOT make it shorter than 40 studs — longhouses are long by definition
`;

export const ARCH_MODERN: string = `
=== MODERN ARCHITECTURAL BIBLE ===

--- MODERN MINIMALIST ---
Wall: Material=Concrete RGB(200,200,200), thickness=4 studs, large flat planes preferred
Large glazing: floor-to-ceiling glass panels 12w x 24h, Material=Glass, thin frame Metal RGB(40,40,40)
Cantilever: upper floors extend 6-12 studs beyond support, creates dramatic floating effect
Flat roof: no pitch, surrounded by parapet 2 studs high, Material=Concrete RGB(190,190,190)
Interior: open plan, no interior walls unless necessary, ceiling height 14-18 studs
Columns: slender 2x2 steel, Material=Metal RGB(50,50,50), widely spaced 16-20 studs
Foundation: visible concrete base 2-4 studs above grade

Roof: Flat, Material=Concrete RGB(185,185,185), white gravel or green roof finish
Windows: Large, frameless or thin-frame, horizontal banding preferred
Doors: Pivot door style — single full-height panel 4w x 10h, Glass or Metal

Color Palette:
  Concrete: RGB(200,200,200)
  Off-white: RGB(240,238,235)
  Charcoal: RGB(45,45,48)
  Glass tint: RGB(140,175,190)
  Steel: RGB(60,65,70)

Scale: House 40x30, Villa 80x60, Compound 150x100

Key elements:
  1. Infinity pool at edge — water extending to horizon, Neon RGB(50,180,220)
  2. Floating staircase: individual tread slabs 8w x 2h x 6d with no visible support
  3. Courtyard: inward-facing open space, mature tree (cylinder trunk + sphere foliage)
  4. Rooftop terrace with glass guardrail 2 studs high
  5. Underground garage: ramp descending at -15 degrees, Metal doors
  6. Wood accent wall: one interior wall Material=Wood RGB(160,120,80) warmth against concrete
  7. Landscaping: geometric — rectangular reflecting pool, trimmed box hedges

AI mistakes to avoid:
  - Do NOT add decorative molding or cornices — minimalism means zero ornament
  - Do NOT vary the roofline — flat is mandatory for minimalist
  - Do NOT make walls too thin (under 3 studs) — looks unreal
  - Do NOT forget shadow gaps between building elements — reveals define minimalism

--- BRUTALIST ---
Wall: Material=Concrete RGB(170,168,165), very thick 8-12 studs, board-formed texture implied
Exposed structure: beams and columns visible on exterior, cast in place appearance
Brise-soleil: horizontal concrete fins projecting 4-6 studs every 6 studs vertically (sun shading)
Massive scale: buildings at minimum 100x100 footprint, tower 80+ studs tall
Raw concrete everywhere: no cladding, no color except concrete grays
Board marks: slight variation in panel shading RGB(165,163,160) vs RGB(178,175,170)
Pilotis: ground floor raised on pillar legs 2x2 studs, freeing ground plane

Roof: Flat with parapets, concrete water towers often visible, Material=Concrete
Windows: Punched openings in thick concrete walls, no frames, 4w x 6h, deeply recessed
Doors: Raw concrete surround, Metal door RGB(60,60,60), no decoration

Color Palette:
  Raw concrete: RGB(170,168,165)
  Shadow concrete: RGB(130,128,125)
  Light concrete: RGB(200,198,195)
  Rust stain: RGB(140,90,60)
  Oxidized metal: RGB(85,90,85)

Scale: Block minimum 100x100, Towers 30x30 plan x 120 height

Key elements:
  1. Walkways between towers: elevated concrete bridges at 30-stud height
  2. Exposed mechanical ducts: large cylinders running exterior walls, Metal RGB(80,80,80)
  3. Service cores with exposed stair towers visible from exterior
  4. Ground-level arcade: covered walkway under pilotis
  5. Water staining on concrete faces — slight RGB variation toward brown
  6. Rooftop plant rooms: smaller concrete boxes on top of main mass
  7. Zig-zag exposed fire stairs on exterior

AI mistakes to avoid:
  - Do NOT add any decorative elements — brutalism is anti-decoration
  - Do NOT make lightweight construction — mass and weight are the aesthetic
  - Do NOT polish the concrete — raw and rough is correct

--- ART DECO ---
Wall: Material=Marble RGB(220,215,200) or SandWall RGB(215,205,175), thickness=5 studs
Setbacks: building steps back at regular intervals creating wedding-cake silhouette
Vertical emphasis: strong vertical lines via pilasters, fins, recessed channels
Gilded ornament: Metal RGB(200,175,50) decorative panels at key zones
Geometric patterns: zigzag, chevron, sunburst motifs at building crown and entry
Lobby: extravagant — terrazzo floors implied by checkered Marble/Granite panels
Sunburst motif: radiating lines from crown, Metal RGB(210,180,55)
Entry canopy: metal and glass marquee projecting 8 studs, Metal frame

Roof: Stepped crown with setbacks, antenna or spire often crowns peak
Windows: Grouped in threes or fives, thin metal mullions, 3w x 10h vertical emphasis
Doors: Revolving or paired swing, Metal RGB(185,160,40) with geometric etched pattern

Color Palette:
  Cream facade: RGB(220,215,200)
  Gold ornament: RGB(200,175,50)
  Black contrast: RGB(30,30,35)
  Turquoise accent: RGB(70,150,145)
  Silver chrome: RGB(180,182,185)

Scale: Commercial 60x60, Tower 30x30 x 100h, Hotel 80x80

Key elements:
  1. Ziggurat crown — top 20 studs steps inward every 6 studs
  2. Neon sign integrated into facade lettering, Neon RGB(200,150,50)
  3. Wrought iron fence at perimeter, Metal RGB(30,30,30) with gold tips
  4. Elevator banks visible through lobby glass
  5. Medallion ornament above main entry: circular relief sculpture
  6. Flagpoles at roof setbacks with pennants
  7. Black-and-gold checkerboard lobby floor, 2x2 alternating panels

AI mistakes to avoid:
  - Do NOT make flat top — setbacks and stepped crown are essential Art Deco
  - Do NOT omit gold/metallic ornament at crown and entry
  - Do NOT spread ornament evenly — concentrate at entry and crown

--- SKYSCRAPER ---
Core: central structural core 20x20, elevator shafts, stairs, mechanical
Floor plate: 60x60 to 100x100, each floor 12 studs tall (floor slab + ceiling)
Curtain wall: Glass panels covering entire exterior, Metal RGB(45,50,55) mullion grid
Grid: 4w x 12h glass panels in repeating mullion grid
Mechanical floors: every 30 floors, opaque concrete band, louvered panels
Crown: distinctive top — setback, antenna, or sculptural element at peak
Lobby: double-height 24 studs, full glass, security desk block
Loading dock: recessed below grade on service side

Typical heights: 200-500 studs for landmark scale in Roblox
Footprint: 60x60 minimum to look proportional at height

Color Palette:
  Dark glass: RGB(50,70,90)
  Reflective glass: RGB(100,140,160)
  Mullion silver: RGB(150,155,160)
  Stone base: RGB(180,175,170)
  Crown accent: RGB(200,180,50)

Key elements:
  1. Stepped setbacks at 1/3 and 2/3 height for pre-war style
  2. Observation deck with glass guardrail at 80% height
  3. Helicopter pad on roof: H marking in contrasting material
  4. Podium base: lower 4-6 story block, wider than tower
  5. Ground floor retail: glass storefronts around perimeter
  6. LED facade lighting along mullions, Neon RGB(100,150,200) at night
  7. Mechanical penthouse house 20 studs above main roof

AI mistakes to avoid:
  - Do NOT make all glass same color — vary slightly between panels for realism
  - Do NOT forget the podium base — towers need ground-level weight
  - Do NOT make mullion grid too fine — 4-stud spacing minimum for visibility
`;

export const ARCH_ASIAN: string = `
=== ASIAN ARCHITECTURAL BIBLE ===

--- JAPANESE TRADITIONAL (WASHITSU / MINKA) ---
Wall: Material=Wood RGB(100,70,40) for structural posts, SandWall RGB(200,190,170) for plaster infill
Post-and-beam: exposed wood columns 2x2 studs at 8-stud intervals, no load-bearing walls
Shoji screens: 4w x 8h sliding panels, Material=Wood frame RGB(140,100,60) with translucent fill Neon RGB(240,230,200) at 0.8 transparency
Engawa: 4-stud wide wooden veranda/porch running full perimeter, Material=Wood RGB(90,65,35)
Raised floor: entire structure elevated 3 studs on stone piers, Material=Cobblestone RGB(130,125,120)
Tokonoma: decorative alcove 4w x 6h x 3d in main room, artwork display niche

Roof: Irimoya (hip-and-gable) or kirizuma (gabled), pitch 45-55 degrees
Material=Tile RGB(45,45,50) — dark gray-blue ceramic tile
Ridge: raised ridge beam, decorated ends called onigawara, Material=Tile RGB(40,40,45)
Eaves: deep overhang 6-10 studs, rafters visible underneath as parallel cylinders
Eave undersides: painted white or natural wood
Upcurved corners: roof corners sweep upward 2-4 studs (chidori hafu detail)

Windows: Shoji panels with lattice, 4x8, no glass, just wood grid
Doors: Fusuma (opaque sliding panels) interior, Genkan entry 4w x 7h sliding, Wood

Color Palette:
  Natural wood: RGB(100,70,40)
  White plaster: RGB(230,225,215)
  Dark roof tile: RGB(45,45,50)
  Red-brown lacquer: RGB(160,50,30)
  Stone gray: RGB(130,125,120)

Scale: Tea house 20x20, Farmhouse 40x50, Manor 80x100

Key elements:
  1. Torii gate at property entrance: 2 vertical red posts RGB(200,40,30) + 2 horizontal beams
  2. Raked gravel garden: SandWall RGB(215,205,180) flat plane with stone islands
  3. Koi pond: irregular shape, Neon RGB(30,100,120) water, stepping stones
  4. Stone lantern: stacked geometric blocks, Material=Cobblestone, 8 studs tall
  5. Bamboo fence: 1 stud cylinders spaced 0.5 studs apart, height 8, Material=Wood RGB(160,155,80)
  6. Maple tree: sphere foliage RGB(180,40,20) for autumn, on cylinder trunk
  7. Genkan entryway: lower floor level at entrance for shoe removal

AI mistakes to avoid:
  - Do NOT make walls load-bearing — post and beam is structural, walls are screens
  - Do NOT skip the deep eaves — shallow eaves look wrong for Japanese style
  - Do NOT use Western-style windows — only shoji screens and fusuma
  - Do NOT make roof ridge flat — the upswept corners define Japanese rooflines

--- CHINESE PAGODA ---
Each floor: octagonal plan preferred, side length 8-12 studs
Total floors: 3, 5, 7, or 9 (always odd number)
Floor height: 8-12 studs each including roof layer
Wall: Material=Brick RGB(180,80,60) or painted Wood RGB(160,50,35) red lacquer
Columns: round, deep red, 1.5 stud diameter, height per floor, Material=Wood RGB(170,45,25)
Intermediate floors: each floor has its own mini-roof projecting 4-6 studs

Roof per floor: hip roof, Material=Tile RGB(35,90,50) green glazed or RGB(200,160,30) gold glazed
Corners sweep sharply upward, exaggerated curve compared to Japanese style
Ridge ornaments: dragon figures at ridge ends, wind chimes hanging at corners
Final cap: metal finial or small ball at very peak, Material=Metal RGB(200,175,50)

Windows: 3w x 5h arched openings, no glass, decorative lattice of Brick RGB(160,50,30)
Doors: Ground floor only, 5w x 10h double-leaf, red lacquer Wood, round brass handles

Color Palette:
  Red wall: RGB(180,60,40)
  Green glazed tile: RGB(40,100,55)
  Gold accent: RGB(200,170,40)
  White trim: RGB(240,235,225)
  Dark wood: RGB(80,40,20)

Scale: Garden pagoda 24x24 x 5 floors, Temple pagoda 48x48 x 7 floors

Key elements:
  1. Surrounding wall with moon gate: circular opening 8 diameter in straight wall
  2. Stone lion pairs flanking entrance, Material=Cobblestone RGB(160,155,148)
  3. Incense burner: large bronze urn on plinth, Metal RGB(100,85,45)
  4. Cloud collar molding at each floor transition
  5. Hanging lanterns: cylinder shape, Neon RGB(255,80,20) red at each floor corner
  6. Paved courtyard with geometric stone pattern, alternating Cobblestone colors
  7. Bell tower companion structure 30 studs away, mirror layout

AI mistakes to avoid:
  - Do NOT use even number of floors — 3/5/7/9 only
  - Do NOT make a square pagoda — octagonal is authentic, square is acceptable, avoid rectangle
  - Do NOT skip the individual roof per floor — stacked box without roofs is wrong
  - Do NOT make the upswept eaves subtle — they must be pronounced

--- JAPANESE TEMPLE (JINJA / TERA) ---
Honden (main hall): 30x30 footprint, raised on 3-stud plinth
Haiden (worship hall): in front, connected by covered passage
Approach path (sando): 6w gravel path, SandWall RGB(210,200,180), lined with stone lanterns
Torii series: multiple gates at diminishing scale leading to honden

Wall: Material=Wood RGB(170,45,25) deep red, or unpainted hinoki cypress RGB(190,160,110)
Interior: dim, gold altar objects, Neon RGB(220,180,50) accent lighting
Gold leaf details: Metal RGB(200,175,50) on altar fixtures, bracket capitals
Bracket sets (tokyou): complex interlocking brackets under eave, 2-stud complex blocks every 4 studs

Roof: Thatched or tile, very steep 60+ degrees, curved profile
Material: SandWall RGB(160,145,90) for thatched or Tile RGB(40,42,48) for ceramic
Ridge: pronounced ridge with decorative chigi (crossed timbers) at gable ends

Color Palette:
  Vermillion red: RGB(195,50,30)
  Unpainted wood: RGB(190,165,115)
  White plastered walls: RGB(238,233,222)
  Copper green: RGB(70,110,80)
  Gold: RGB(200,175,50)

Scale: Small shrine 30x40, Medium temple 80x120, Complex 200x300

Key elements:
  1. Shimenawa: thick rope hung between posts marking sacred boundary
  2. Ema boards: small wooden boards hanging on rack near honden
  3. Omikuji rack: fortune strips tied to wire rack near entrance
  4. Temizuya (purification fountain): stone basin with bamboo ladle, water Neon RGB(30,100,120)
  5. Sacred tree (shimboku): large tree with rope and white paper streamers
  6. Misoka-do: treasure house small building with locked Wood doors
  7. Cemetery or moss garden adjacent to main complex

AI mistakes to avoid:
  - Do NOT omit the torii gate at approach — it signals the sacred boundary
  - Do NOT skip the temizuya — purification basin is required feature
  - Do NOT use modern materials — all Roblox materials should be Wood, Stone, Tile only
`;

export const ARCH_FANTASY: string = `
=== FANTASY ARCHITECTURAL BIBLE ===

--- HAUNTED MANSION ---
Wall: Material=Cobblestone RGB(80,78,75), crumbling edges implied by varied block sizes
Victorian silhouette: asymmetrical, multiple turrets, dormers, gables at different heights
Towers: 2-4 turrets 14-20 studs diameter, height 60-100 studs, conical roofs
Conical roof: Material=Slate RGB(35,35,42), very steep 70+ degrees pitch
Widow's walk: narrow railed platform at very top, 4 studs wide, iron fence
Porch: full-width front porch 6 studs deep, carved wood posts RGB(60,40,20)
Dormers: 6-8 dormers projecting from main roof, each with its own peaked roof
Bay windows: 3-sided projecting bays 8w x 2d, triple panes

Windows: Tall narrow 3w x 12h with pointed arch top, boarded OR Neon RGB(255,200,50) glowing interior
Broken shutters: 1 stud thick angled slightly off-plumb, Material=Wood RGB(50,35,18)
Doors: 6w x 14h double, heavy plank, iron hinges, knocker, Material=Wood RGB(40,25,10)

Color Palette:
  Dark stone: RGB(80,78,75)
  Dead wood: RGB(50,35,18)
  Roof black: RGB(30,30,38)
  Ghost glow: RGB(180,220,200)
  Rust: RGB(120,65,30)

Scale: Small haunted house 50x50 x 60h, Mansion 100x80 x 100h

Key elements:
  1. Iron fence perimeter: thin vertical bars 0.5 stud diameter, height 8, rusty Metal RGB(100,60,30)
  2. Dead trees: bare branch structure using thin cylinders at angles, no leaves
  3. Graveyard: stone slabs Material=Cobblestone tilted at angles, Neon fog RGB(180,220,180)
  4. Broken clock tower: frozen at midnight, face=flat disk, Metal hands
  5. Bats: small triangular wing shapes, Material=Concrete RGB(30,25,35) near rooftop
  6. Cellar door: slanted double doors in ground, Material=Wood RGB(45,28,12)
  7. Mysterious light in single upper window: Neon RGB(255,220,100) cone shining outward

AI mistakes to avoid:
  - Do NOT make it symmetrical — asymmetry creates unease
  - Do NOT use bright colors — everything is dark and desaturated
  - Do NOT make it too neat — some broken/tilted elements are essential
  - Do NOT forget the dead landscaping — no live plants around a haunted mansion

--- TREEHOUSE ---
Platform base: irregular polygon 30-60 studs across, 1 stud thick, Material=Wood RGB(110,75,40)
Platform height: 20-50 studs above ground
Main tree trunk: 8-14 diameter cylinder, Material=Wood RGB(80,55,25), slight taper
Branch platforms: smaller platforms 15-25 studs at varying heights connected by rope bridges
Rope bridge: 3w planks 1 stud thick every 2 studs, rope sides=thin cylinder RGB(120,90,50)
Walls: rough plank construction, gaps between boards, Material=Wood RGB(100,68,35)
Roof: 40-50 degree pitch, wood shingles=Material=Wood RGB(75,50,22), irregular edge

Entry: rope ladder or spiral ramp around trunk, or zip line from neighboring tree
Zip line: thin cylinder, Metal RGB(100,100,100), angled 15-20 degrees

Color Palette:
  Oak bark: RGB(80,55,25)
  Plank wood: RGB(110,75,40)
  Rope: RGB(160,130,80)
  Leaves: RGB(50,110,40)
  Rusted nails: RGB(120,75,45)

Scale: Single platform 30x30, Multi-level 50x50, Treehouse village 200x200

Key elements:
  1. Multiple tree species at different heights — variety of trunk diameters
  2. Leaf canopy: sphere clusters Material=Grass RGB(50,110,40) around upper branches
  3. Firefly lanterns: Neon RGB(255,240,100) small glowing spheres hanging from branches
  4. Lookout crow's nest: 4x4 platform at highest point with 360 view
  5. Water slide: curved half-pipe descending from platform to pond below
  6. Hidden rooms: platforms partially concealed by dense foliage
  7. Tire swing: torus shape (round ring) hanging from branch

AI mistakes to avoid:
  - Do NOT make the tree trunk too thin — 8 stud minimum diameter to look structural
  - Do NOT make platforms perfectly level — slight variation is natural
  - Do NOT use straight ladders — rope ladders or ramps are more interesting

--- UNDERWATER BASE ---
Main hull: large oval or sphere sections, Material=Metal RGB(50,80,100), slightly blue-tinted
Observation dome: hemisphere radius 15-20, Material=Glass, Neon interior RGB(30,150,200)
Connecting tubes: 8-10 diameter cylinders between modules, Material=Metal RGB(55,75,90)
Airlock: cylindrical chamber 10 diameter at all exterior connections
Pressure doors: round hatch style, Metal RGB(70,90,110), with turning wheel handle
Depth: 20-60 studs below water surface, water=Neon RGB(20,80,120) around structure
Interior lighting: bioluminescent strips Neon RGB(50,200,180) running along corridor floors
Porthole windows: round, 3 diameter, recessed 1 stud, Glass with Metal frame

Exterior: algae/coral growth on older sections — Neon RGB(80,200,120) accent blocks
Reactor core room: central glowing column Neon RGB(100,200,80) or RGB(200,80,200)
Emergency escape pod: small teardrop shape detachable at each module

Color Palette:
  Hull metal: RGB(50,80,100)
  Interior panels: RGB(70,90,110)
  Water ambient: RGB(20,60,100)
  Bio-glow: RGB(50,200,180)
  Warning red: RGB(200,60,50)

Scale: Small base 3 modules, Medium 8 modules, Megabase 20+ modules

Key elements:
  1. Sonar room: circular room with rotating antenna visible outside
  2. Moon pool: flooded interior docking bay, water surface inside base
  3. Fish swimming past portholes: decorative fish shapes outside
  4. Pressure gauge displays: small panel boards every 10 studs in corridors
  5. Emergency lighting strips Neon RGB(200,60,50) at corridor floor edges
  6. Gardens dome: separate dome growing food, green lighting Neon RGB(80,200,80)
  7. Power conduits: thick cylinder bundles running outside hull, Material=Metal

AI mistakes to avoid:
  - Do NOT make rectangular rooms — curves and spheres define underwater aesthetics
  - Do NOT forget the water medium — the base must look submerged
  - Do NOT skip airlocks at all exterior connections

--- SPACE STATION ---
Core module: 20x20x80 cylinder central spine, Material=Metal RGB(150,155,160)
Habitation ring: torus shape radius 60, cross-section 12 diameter, rotates (decorative)
Solar arrays: large flat panels 40x20 each, Material=Neon RGB(30,80,180) on Metal frame
Docking ports: 8 diameter cylinders projecting from core, 6-8 ports total
Communication dish: parabolic dish 20 diameter, Material=Metal RGB(160,165,170)
Observation cupola: 10x10 dome with 360 glass panels, Neon interior RGB(20,120,200)
Thruster clusters: 4 groups at rear, each 3 thrusters, Neon RGB(100,180,255) exhaust effect

Material emphasis: Metal for structure, Glass for viewports, Neon for lights and engines
Color: predominantly neutral Metal grays with high-contrast color for systems

Color Palette:
  Hull: RGB(150,155,160)
  Solar panel: RGB(20,40,120)
  Viewport glass: RGB(100,180,220)
  Engine glow: RGB(100,200,255)
  Warning stripe: RGB(220,160,30)

Scale: Small outpost 5 modules, Station 15 modules, Megastructure 50+ modules

Key elements:
  1. Danger stripe markings: alternating RGB(220,160,30) and RGB(30,30,35) panels
  2. Airlock chamber with decompression warning lights Neon RGB(200,50,50)
  3. Zero-g storage: objects appear floating (suspended by thin parts)
  4. Engine bell array: large conical exhausts at rear with Neon glow
  5. Pressurized greenhouse: transparent dome with plant life inside
  6. Emergency escape pods: streamlined bullet shapes in bays
  7. Hull damage section: dented metal, exposed wiring Neon RGB(200,200,50)

--- STEAMPUNK ---
Wall: Material=Brick RGB(140,90,55) or Metal RGB(100,85,65), riveted plates implied
Rivets: 0.5 stud sphere every 3 studs on metal panels, Material=Metal RGB(130,110,70)
Copper pipes: 1-2 stud diameter cylinders running exterior, Material=Metal RGB(180,120,50) copper color
Steam vents: cylinder stacks 2-3 diameter, 10-20 tall, emitting particles (Neon RGB(200,200,200) spheres)
Clock tower: always present, large gear shapes visible, Material=Metal RGB(120,100,55)
Gears: large torus or disk shapes with teeth, Material=Metal RGB(110,95,50)
Leather and brass accents: Material=SandWall for leather, Metal for brass

Roof: Copper pitched roof Material=Metal RGB(70,130,90) oxidized green, or glass barrel vault
Glass barrel vault: arched greenhouse-style, Metal ribs every 4 studs, Glass panels

Color Palette:
  Brass: RGB(180,150,60)
  Copper: RGB(180,120,50)
  Oxidized copper: RGB(70,130,90)
  Dark iron: RGB(60,55,50)
  Mahogany: RGB(120,60,30)

Scale: Workshop 40x40, Factory 100x80, Airship dock 200x150

Key elements:
  1. Airship docked overhead: elongated balloon envelope + gondola beneath
  2. Tesla coil: tall metal spike with Neon RGB(180,100,255) lightning arcs
  3. Pneumatic tube network: glass tubes 2 diameter throughout complex
  4. Engine room: massive piston assembly, reciprocating crank parts
  5. Observatory dome: glass hemisphere with telescope visible inside
  6. Control room: analog gauge wall, lever banks, Material=Metal + Wood
  7. Coal bunker adjacent, Material=Brick, dark coal=Granite RGB(40,40,40)

--- CYBERPUNK ---
Wall: Material=Concrete RGB(60,60,65) or Metal RGB(45,50,55), weathered and grimy
Neon signs: Neon RGB(255,30,100) pink, RGB(30,200,255) cyan, RGB(100,50,255) purple — everywhere
Advertisement panels: large flat surfaces 20x30, layered on building faces
Rain effect: streaks on all horizontal surfaces, RGB slightly darker than base
Density: buildings packed tight, 2-4 stud gaps between structures maximum
Street level: dark, narrow, puddle reflections Neon RGB(30,150,200) on flat surfaces
Upper levels: elevated walkways, RGB(50,55,60) metal grating, Neon-lit underside

Color Palette:
  Dark concrete: RGB(55,57,62)
  Neon pink: RGB(255,30,100)
  Neon cyan: RGB(30,200,255)
  Grime brown: RGB(80,70,55)
  Warning orange: RGB(255,130,20)

Scale: Block 80x80, District 300x300

Key elements:
  1. Holographic display panels: Neon RGB(50,200,255) translucent flat parts
  2. Fire escapes zigzag on every building face, Metal RGB(80,85,90)
  3. Street food stalls at ground level: small Brick + Metal structures
  4. Drone delivery ports at every building roof, 4x4 landing pads
  5. Corporate logo towers piercing skyline — tall thin Metal spires, logo on top
  6. Underground market: descent into lit cavern below street grid
  7. Rain channels and drainage infrastructure visible everywhere

AI mistakes to avoid:
  - Do NOT make buildings sparse — cyberpunk is ultra-dense
  - Do NOT use one neon color — at minimum 3 different neon colors
  - Do NOT make street level bright — it must feel oppressive and dark
`;

export const ARCH_INDUSTRIAL: string = `
=== INDUSTRIAL ARCHITECTURAL BIBLE ===

--- WAREHOUSE ---
Wall: Material=Metal RGB(130,125,120) corrugated sheet, large flat bays
Corrugated profile: thin fins 0.5 stud deep every 1 stud horizontally across wall face
Structure: exposed steel frame, columns 2x2 every 20 studs, beams at 20-stud height
Column caps: beam connection plates, wider block at column top, Metal RGB(100,100,100)
Floor: Concrete RGB(180,178,175), large slab with grid joint lines every 20 studs
Loading dock: raised 2-stud platform on one long wall, 6 dock doors per 100 studs
Dock doors: 12w x 14h roll-up, Metal RGB(110,105,100), horizontal slat pattern
Personnel doors: 4w x 8h, Metal RGB(100,100,100), with small vision panel Glass

Roof: Low pitch 5-10 degrees, Material=Metal RGB(120,118,115), ridge ventilators every 30 studs
Skylights: 8x4 translucent panels Glass in roof every 20 studs (north-facing ideal)
Gutters: L-profile Metal at eaves, downspouts at every corner and every 40 studs
Windows: Ribbon windows at 15-stud height, 40w x 4h continuous band, industrial Metal frame

Color Palette:
  Corrugated metal: RGB(130,125,120)
  Painted steel: RGB(80,90,80) safety green on structural elements
  Concrete floor: RGB(180,178,175)
  Warning yellow: RGB(220,180,30)
  Dock yellow stripe: RGB(240,200,20)

Scale: Small 60x40, Distribution center 200x100, Mega-warehouse 500x200

Key elements:
  1. Dock levelers: hinged metal plates in each dock bay, flush with floor
  2. Forklift charging station: 4 units parked in row, Neon RGB(50,150,50) charging light
  3. Sprinkler pipes: 0.5 stud cylinder grid on ceiling, 10-stud intervals, red heads RGB(200,50,50)
  4. Overhead crane rail: I-beam running length of building 2 studs below roof
  5. Mezzanine: 20-stud high second level on one end for offices
  6. Security booth: 8x8 glazed guard house at main vehicle entry
  7. Truck court: 120-stud deep paved area in front of loading dock

AI mistakes to avoid:
  - Do NOT forget the loading dock — a warehouse without a dock is incomplete
  - Do NOT make interior empty — racking, pallets, aisles are the content
  - Do NOT skip the corrugated cladding detail

--- FACTORY ---
Wall: Brick RGB(165,90,60) lower 20 studs, Metal RGB(120,118,115) upper, or all Brick
Sawtooth roof: series of north-facing skylights, each bay 20 studs wide with 45-degree glass face
Chimney stacks: 6-8 diameter circular, 40-60 studs tall, slight taper, Material=Brick RGB(150,80,55)
Smoke effect: Neon RGB(150,150,150) billowing at chimney tops
Heavy structure: columns 3x3 every 12 studs, major trusses 3 studs deep at roof
Crane beams: 2 overhead crane rails running full factory floor length
Process tanks: large cylinders 10-16 diameter, 15-25 tall, Material=Metal RGB(110,115,110)

Roof: Sawtooth or barrel vault, Metal RGB(110,112,108)
Windows: Industrial steel frame, 6w x 10h, wire glass implied, Metal RGB(70,75,70)
Doors: Large sliding barn-style 16w x 16h, Metal RGB(100,100,100), on overhead rail

Color Palette:
  Old brick: RGB(165,90,60)
  Industrial metal: RGB(110,115,110)
  Safety green: RGB(60,140,60)
  Danger red: RGB(190,50,40)
  Oil stain black: RGB(30,28,25)

Scale: Small plant 60x60, Full factory 200x100, Industrial complex 500x300

Key elements:
  1. Rail spur entering through large ground-floor opening
  2. Boiler room visible through windows — large cylinder boilers Metal RGB(100,95,90)
  3. Tool crib: 20x20 mesh-enclosed storage area on factory floor
  4. Break room: separate brick enclosure in corner, vending machines visible
  5. Quality control station: brightly lit booth on production line
  6. Exhaust fans: large circular fans in wall, Metal RGB(80,85,80), 6-8 diameter
  7. Transformer yard: fenced area outside with electrical equipment

--- BARN ---
Wall: Wood vertical board-and-batten siding RGB(130,60,30) barn red
Batten strips: 1 stud wide every 4 studs covering board joints, slightly lighter Wood
Frame: heavy timber post-and-beam, Wood RGB(100,75,40), exposed on interior
Gambrel roof: double-pitch — steeper lower (60 deg) meets shallower upper (30 deg)
Material: Corrugated Metal RGB(140,138,130) or Wood shake RGB(90,70,45)
Hay loft: door in gable end 8w x 8h at 20-stud height, hay fork track overhead
Cupola: ventilation tower 6x6 at roof peak, louvered sides, simple pyramid roof
Foundation: rough stone Cobblestone RGB(120,115,108), 4 studs exposed above grade

Color Palette:
  Barn red: RGB(130,55,28)
  Weathered wood: RGB(100,80,55)
  Stone foundation: RGB(120,115,108)
  Tin roof: RGB(135,132,128)
  Hay yellow: RGB(200,180,80)

Scale: Small barn 40x30, Farmstead barn 80x40, Ranch complex 200x100

Key elements:
  1. Silo: 12 diameter cylinder 50 tall, Material=Metal RGB(140,138,130), conical cap
  2. Animal pens inside: low partition walls Wood RGB(100,75,40) dividing floor
  3. Hay bales: 4x2x2 stacks, Material=SandWall RGB(195,175,80)
  4. Tractor shed: lean-to addition on one side, open front
  5. Lightning rod at roof peak: thin Metal spike with conductor cable
  6. Rusted metal rooster weathervane at cupola
  7. Fence line: wood rail fence radiating from barn to define paddocks

--- PRISON ---
Perimeter wall: 12 studs thick, 30 studs tall, Material=Concrete RGB(180,178,172)
Corner towers: 16x16, 40 studs tall, overhang 2 studs on all sides
Guard rails at tower top: Metal RGB(80,80,80), 2 studs high
Razor wire: implied by jagged Metal elements along wall top
Cell block: 4-stud wide cells, 8 studs deep, 10 studs tall, bars on door
Cell bars: vertical Metal RGB(60,60,60) cylinders 0.5 diameter every 1 stud, 2-rail horizontal
Corridor: 8 studs wide between facing cell rows, 40+ cells per tier
Tiers: 3-4 levels of cells, open walkways with metal railings, Gantry above

Roof: Flat, Concrete RGB(170,168,165), skylights in cell block ceiling
Windows: High narrow slits in outer wall 1w x 6h, deeply recessed, barred
Doors: Heavy metal 4w x 8h, Material=Metal RGB(55,55,55), small observation window

Color Palette:
  Institutional gray: RGB(180,178,172)
  Cell bar black: RGB(50,50,52)
  Warning stripe: RGB(220,160,30)
  Linoleum floor: RGB(160,158,155)
  Rust stain: RGB(130,80,50)

Scale: County jail 80x80, State prison 300x200, Supermax 500x400

Key elements:
  1. Exercise yard: open concrete area enclosed by inner fence + outer wall
  2. Control room: glass-enclosed central hub overlooking multiple cell blocks
  3. Visitation room: divided by glass partition, chairs on both sides
  4. Medical wing: separate building with red cross marking
  5. Solitary: windowless cells, door only slot opening
  6. Guard stations: elevated booth every 40 studs in main corridors
  7. Entrance processing: sally port double-gate airlock entry
`;

export const ARCH_HISTORICAL: string = `
=== HISTORICAL ARCHITECTURAL BIBLE ===

--- ANCIENT EGYPTIAN ---
Pylon gateway: two massive trapezoidal towers 30w x 10d x 50h each flanking entrance
Pylon slope: walls taper inward — 10 studs wide at top, 14 at base on outer face
Temple axis: strict single axis, all rooms aligned, progressing smaller and darker inward
Hypostyle hall: forest of massive columns 6-10 diameter, 30-40 studs tall
Column capitals: lotus bud or papyrus style — splayed top block 12 diameter
Hieroglyph panels: Neon RGB(200,170,80) gold or RGB(50,120,200) blue painted relief
Obelisks: square pyramid base 6x6, shaft tapers to pyramid point, 40-60 studs tall
Pyramid: massive — base side 100-400 studs, height = base/2 x 0.63 approximately
Sphinx: leonine body 40 studs long, human head, recumbent pose, Sandstone material approximated by SandWall RGB(210,190,150)

Wall: Material=SandWall RGB(210,190,150), 8-12 studs thick, tapered profile
Surface: carved relief decoration bands, rows of figures and hieroglyphs
Roof: flat, accessible, used for astronomical observation

Color Palette:
  Sandstone: RGB(210,190,150)
  Red granite: RGB(170,90,75)
  White limestone: RGB(235,230,215)
  Gold paint: RGB(200,170,50)
  Lapis blue: RGB(30,80,185)

Scale: Small chapel 30x60, Temple 80x200, Mega-temple complex 400x1000

Key elements:
  1. Sacred lake: rectangular pool 30x60, Neon RGB(30,100,130) water
  2. Dromos: sphinx-lined avenue leading to pylon, sphinxes every 8 studs
  3. Obelisk pair at pylon entrance, inscribed with Neon highlights
  4. Naos (inner sanctuary): 8x8 innermost room, gold shrine
  5. Nilometer: stepped shaft descending into water, cubit markings
  6. Flagpoles: tall thin poles at pylon face, banners hanging
  7. Mud brick surrounding walls for administrative buildings

AI mistakes to avoid:
  - Do NOT make walls vertical — Egyptian walls lean inward (battered) slightly
  - Do NOT mix styles — strict axis and progressing enclosure is sacred geometry
  - Do NOT make columns thin — minimum 6 stud diameter for Egyptian columns

--- GREEK / ROMAN TEMPLE ---
Peristyle: colonnade surrounding entire structure
Column order: Doric (plain capital), Ionic (scrolled), or Corinthian (leafy)
Column dimensions: Doric 4 diameter x 24h, Ionic 3 diameter x 30h, Corinthian 3 diameter x 36h
Entasis: columns slightly bulge at 1/3 height (taper at top and bottom)
Stylobate: stepped platform, 3 steps of 2h x 2d each surrounding cella
Cella: inner sanctuary 30x20, plain walls Material=Marble RGB(240,238,232)
Frieze: horizontal band 6 studs deep above columns, alternating triglyphs and metopes
Pediment: triangular gable end filled with sculptural figures
Triglyph: 3-groove vertical panel Material=Marble RGB(220,218,212)
Column spacing: 6 studs center-to-center minimum

Roof: Shallow pitch 15-20 degrees, Material=Marble RGB(235,232,225) or Tile RGB(180,100,80) terracotta
Acroteria: decorative finials at pediment corners, floral palmette shape

Color Palette:
  White marble: RGB(240,238,232)
  Terracotta tile: RGB(190,105,80)
  Gold ornament: RGB(200,175,55)
  Shadow marble: RGB(215,212,205)
  Painted frieze blue: RGB(50,80,180)

Scale: Small temple 40x60, Parthenon-scale 70x180, Temple complex 400x600

Key elements:
  1. Chryselephantine statue inside cella: large figure 20+ studs tall, gold and white
  2. Altar outside east facade: 12x6 block, animal sacrifice implied
  3. Treasury rooms in rear cella section
  4. Opisthodomos: false porch at rear mirroring pronaos
  5. Ramp access rather than steps for processional vehicles
  6. Temenos wall: lower enclosure wall around sacred precinct
  7. Votive offerings: small figurines and panels leaning against column bases

--- COLONIAL AMERICAN ---
Wall: Material=Brick RGB(175,90,65) or Wood clapboard RGB(220,215,205) white-painted
Symmetry: absolute bilateral symmetry, central door flanked by equal windows
Windows: 6-over-6 double-hung, 4w x 8h, evenly spaced, black shutter 1 stud thick
Shutters: Brick or SandWall RGB(30,50,30) dark green or black
Central chimney: 8x8 brick stack, services all rooms, emerges at roof center
Entry: central 4w x 9h door with transom window above, sidelights optional
Fanlight: semi-circular window above door, muntin pattern = fan of thin lines
Dormers: 3 equally spaced in roof, 4w x 5h

Roof: Hip or gable, medium pitch 35-45 degrees, Material=Slate RGB(65,62,60) or Wood shingle RGB(95,75,55)
Cornice: 2-stud wide trim band at eave line, Material=Wood RGB(220,215,205)
Pilasters: flat pilasters flanking entry and corners, Material=Brick or Wood, painted white

Color Palette:
  Brick: RGB(175,90,65)
  White trim: RGB(230,228,222)
  Black shutter: RGB(30,30,32)
  Dark green shutter: RGB(35,60,35)
  Slate roof: RGB(65,62,60)

Scale: Small house 30x30, Plantation manor 80x50, Governor's mansion 100x80

Key elements:
  1. White picket fence surrounding front yard, 4 studs tall
  2. Kitchen garden behind house, rectangular beds
  3. Separate kitchen building (fire risk demanded separation)
  4. Carriage house: 30x20, gambrel roof, horse stalls
  5. Wellhouse: 8x8 with pitched roof over well
  6. Flagstone path from gate to entry door
  7. Lantern flanking front door, Neon RGB(255,200,80)

--- VICTORIAN ---
Wall: Material=Brick RGB(160,85,60) or Wood clapboard, complex multi-plane exterior
Multiple bay windows, oriel windows, wrapped porches
Gingerbread trim: decorative wood lacework at all gable edges, eaves, porch
Spindle work: thin 0.5-stud balusters at all railings, elaborate turned posts at porch
Tower: circular or octagonal corner tower, 14-18 diameter, distinct roof from main
Queen Anne style: asymmetric, multiple textures — shingles, clapboard, patterned brick

Roof: Steeply pitched complex form, multiple gable directions, Material=Slate RGB(55,52,58)
Cresting: iron ridge decoration running along roof peak, Metal RGB(40,40,40)
Colors: body, trim, accent — 3 distinct colors mandatory (Painted Lady style)

Color Palette:
  Body color: RGB(180,130,80) or RGB(100,130,160) (any period color)
  Trim color: RGB(225,200,150) contrasting lighter
  Accent: RGB(180,50,40) or RGB(50,80,160) third color for details

Scale: Row house 20x40, Family home 40x50, Mansion 80x100

Key elements:
  1. Wraparound porch: 6 studs deep on 2-3 sides, decorative posts every 8 studs
  2. Turret room at corner: unique room inside tower projection
  3. Stained glass transom lights Neon RGB(200,100,50) above windows
  4. Widow's walk or belvedere at roof peak
  5. Carriage house converted to garage aesthetic
  6. Cast iron fence panels between brick pilasters at property line
  7. Conservatory glass room addition on side, Metal frame + Glass panels

--- MEDITERRANEAN / SPANISH COLONIAL ---
Wall: Material=SandWall RGB(230,215,185) stucco or Brick RGB(200,150,100) terracotta
Thick walls: 6-8 studs, passive cooling
Arcaded porch (loggia): arched openings 8w x 12h, round arches with keystone
Columns: round 3 diameter, Material=Marble RGB(220,215,200)
Courtyard: central patio with fountain, all rooms face inward
Fountain: circular 12 diameter basin, 3-tier with Neon RGB(30,120,180) water
Roof: low pitch, Material=Tile RGB(185,95,65) terracotta barrel tile
Tile pattern: rows of half-cylinder tiles, alternating ridge/valley
Ironwork: decorative Metal RGB(30,30,30) balconies and window grilles

Color Palette:
  White stucco: RGB(235,228,215)
  Terracotta roof: RGB(185,95,65)
  Warm stone: RGB(215,195,160)
  Ironwork black: RGB(30,30,32)
  Azulejo blue: RGB(50,100,185)

Scale: Villa 50x60, Hacienda 100x100 with courtyard, Palace 300x300

Key elements:
  1. Bell tower: square plan 10x10, open belfry level, mission-style
  2. Arched colonnade: continuous arcaded walkway around courtyard
  3. Azulejo tile accent panels: blue painted tile bands Neon or Cobblestone RGB(50,100,185)
  4. Olive or orange trees in courtyard, cylinder trunk + sphere foliage
  5. Terracotta pot clusters at doorways
  6. Zaguan: deep entry passage through solid wall from street to courtyard
  7. Roof terrace accessible, with view tower element

--- ISLAMIC / MOORISH ---
Wall: Material=SandWall RGB(225,210,180) or Brick RGB(175,145,100) with detailed geometric surface
Muqarnas: honeycomb stalactite vaulting in niches and transition zones — stacked inverted pyramids
Arabesque: geometric or floral carved pattern on all interior surfaces
Horseshoe arch: arch wider than semicircle, springing point above center, 8w x 16h
Pointed arch: slightly pointed version preferred for Mughal/Persian influence
Mihrab: ornamental prayer niche in qibla wall, arched 5w x 10h, deepest decoration
Minaret: tall slender tower 6-8 diameter, 50-80 studs tall, balcony at 2/3 height
Dome: onion dome profile preferred — drum base, swelling then narrowing top, Material=Metal RGB(100,160,80) green or RGB(200,175,50) gold

Roof: Flat with parapet or central dome, Material=Tile RGB(40,100,55) glazed green
Color: exterior white or pale, interior lavishly colored, blue and gold dominant

Color Palette:
  Pale stone: RGB(225,215,185)
  Glazed tile turquoise: RGB(50,150,145)
  Gold ornament: RGB(200,175,50)
  Blue tilework: RGB(40,80,180)
  White plaster: RGB(240,238,230)

Scale: Small mosque 40x40, Friday mosque 100x150, Palace complex 400x400

Key elements:
  1. Hammam (bathhouse): domed rooms with star-shaped skylight oculi
  2. Fountain in forecourt: octagonal or square basin with central jet
  3. Maqsura: screened enclosure for ruler in mosque, Metal lattice screen
  4. Iwan: vaulted open hall facing courtyard, 20w x 30h x 15d
  5. Geometric tilework dado: lower 8 studs of all interior walls tiled in geometric pattern
  6. Stalactite pendentives at dome base transitioning square to circle
  7. Calligraphic frieze bands running at capital height around all rooms

--- LOG CABIN ---
Wall: Material=Wood RGB(110,75,40) horizontal log stacking, each log 2-3 studs diameter
Log courses: alternating round cylinders, each log slightly different diameter for natural look
Corner notching: logs extend 2-3 studs past corner, half-cylinder cutout for interlocking
Chinking: 0.5 stud gray material SandWall RGB(200,195,185) between log courses
Foundation: rough Cobblestone RGB(125,120,110) perimeter 3 studs high
Chimney: rough stone Cobblestone RGB(130,125,118), 6x8 exterior chimney on gable end

Roof: Steep gable 40-50 degrees, Material=Wood shingle RGB(85,65,42) or Metal RGB(120,118,115)
Rafter tails: log rafters project 2 studs past wall at eave
Porch: full-width front, 5 studs deep, log posts 1.5 diameter at corners
Screen door: thin Material=Wood RGB(140,100,55) with wire mesh panel

Color Palette:
  Log brown: RGB(110,75,40)
  Chinking gray: RGB(200,195,185)
  Bark texture: RGB(90,58,28)
  Stone chimney: RGB(130,125,118)
  Metal roof: RGB(120,118,115)

Scale: Trapper cabin 20x16, Family cabin 40x30, Hunting lodge 60x50

Key elements:
  1. Antler mount above door, Material=SandWall RGB(200,185,155)
  2. Rocking chairs on porch
  3. Chopped wood stack against side wall, neat rows
  4. Outhouse: 5x5 single-door plank structure 30 studs from main
  5. Root cellar: slanted door in ground near cabin
  6. Bear trap or animal pelts hanging on exterior wall (atmosphere)
  7. Smoke from chimney: Neon RGB(160,155,150) sphere particles rising

--- DESERT PUEBLO ---
Wall: Material=SandWall RGB(215,185,150) adobe, rounded top edges, no sharp corners
Terraced structure: each level steps back 8-10 studs from lower level
Level height: 10-12 studs per floor, 3-5 levels typical
Entry: ladder access to each level, no exterior stairs (for defense)
Ladders: 2 thin Wood cylinders with horizontal rungs, retractable
Kiva: circular underground ceremonial room, 10-16 diameter, partially sunken
Vigas: round log rafters protruding 2-3 studs from wall face at ceiling level
Color: warm earth tones, slight variation between buildings for organic feel

Roof: Flat, accessible terrace, vigas supporting split-wood decking
Color: same as walls RGB(215,185,150) or darker shadow RGB(185,158,120)

Color Palette:
  Adobe warm: RGB(215,185,150)
  Adobe shadow: RGB(185,158,120)
  Turquoise accent: RGB(65,155,150)
  Red ochre: RGB(180,80,50)
  White slip: RGB(235,228,210)

Scale: Small dwelling 30x30, Pueblo village 200x200, Cliff dwelling 400x200

Key elements:
  1. Kiva ladder extending above ground level, visible from distance
  2. Outdoor ovens (hornos): igloo-shaped clay domes 4 diameter
  3. Drying racks: meat and chilis hanging on pole frame outside
  4. Water jars stacked at entry, large ceramic shapes Material=SandWall
  5. Painted wall murals: geometric Neon RGB(180,80,50) red ochre bands
  6. Communal grinding area: flat stone metates in exterior alcove
  7. Prayer sticks: thin colored cylinders planted in ground near kiva

--- ARCTIC OUTPOST ---
Wall: Material=Metal RGB(140,145,150) insulated panel, thick 8+ studs for thermal mass
Elevated: entire structure on stilts 4 studs above ground (permafrost protection)
Stilts: 2x2 Metal RGB(120,125,130) columns every 8 studs
Airlock double: two doors in series, 2-stud dead space between, critical for thermal
Heating units: visible duct runs exterior, large cylinder unit on roof, Metal RGB(130,135,140)
Snow loading: roof slopes 35+ degrees to shed snow, Metal RGB(135,138,142)
Windows: small and triple-paned, 3w x 3h maximum, deeply recessed in wall thickness

Color Palette:
  White-gray metal: RGB(200,202,205)
  Insulation panel: RGB(140,145,150)
  Safety orange: RGB(220,120,30)
  Ice blue accent: RGB(120,170,210)
  Dark utility: RGB(60,65,70)

Scale: Small station 30x30, Research base 100x60, Military outpost 200x150

Key elements:
  1. Generator building: separate 20x15 structure with fuel tank adjacent
  2. Antenna array on roof: multiple dish and pole antennas, Metal
  3. Equipment storage tubes: horizontal cylindrical pods on stilts beside main building
  4. Emergency supplies depot: painted orange Metal RGB(220,120,30) building
  5. Snow crawler parking bay: heated shelter for vehicles
  6. Observation dome: Glass hemisphere on roof for aurora viewing
  7. Flags and marker poles to locate buildings in whiteout conditions

--- CHURCH / CHAPEL ---
Wall: Material=Brick RGB(170,90,62) or Cobblestone RGB(115,110,105), 5-7 stud thickness
Nave: simple rectangle 15-20w x 40-80l, height 20-30 studs
Bell tower: square plan 10x10, at entry end, 40-60 studs tall
Buttresses: simple rectangular 3x3, spaced every 12 studs on exterior
Vestibule: small entry room 10x8 inside main door, separates nave from exterior
Choir loft: raised platform 3 studs at rear of nave, organ pipes visible (vertical cylinders)

Roof: Steeply pitched 45-55 degrees, Material=Slate RGB(58,55,62) or Metal RGB(115,112,108)
Steeple: tapered octagonal pyramid on tower top, 20-30 studs height
Cross: Metal RGB(180,178,175) cross at peak, 4 studs tall

Color Palette:
  Red brick: RGB(170,90,62)
  Stone: RGB(115,110,105)
  White interior plaster: RGB(238,235,228)
  Stained glass warm: RGB(220,130,50)
  Roof slate: RGB(58,55,62)

Scale: Chapel 20x50, Parish church 30x80, Cathedral-scale 50x200

Key elements:
  1. Stained glass east window: large colored glass Neon panels behind altar
  2. Pews: rows of Wood RGB(90,60,30) benches in nave, 8 studs long each
  3. Altar rail: low 1-stud high barrier separating sanctuary from nave
  4. Pulpit: raised octagonal platform on one side, Wood, 3 steps
  5. Font: carved stone basin near entry, Cobblestone RGB(160,155,148)
  6. Graveyard adjacent with tilted stones, iron fence perimeter
  7. Vestry: small room attached to sanctuary, robing room for clergy

--- CASINO ---
Exterior: Grand, over-scaled, maximum visual impact, Material=Marble RGB(225,220,210)
Sign: massive Neon sign array on facade — multiple colors RGB(255,30,100), RGB(30,200,255), RGB(255,200,30)
Entry: monumental, covered porte-cochere 30 studs wide, 15 studs tall, cascading chandelier
Chandelier exterior: Neon RGB(255,230,150) cylinder cluster hanging from porte-cochere
Facade lighting: thousands of LED points — tiny Neon RGB(255,255,200) spheres covering entire facade
Roof: flat or complex modern, rooftop sign tower 30+ studs above main roof

Color Palette:
  White marble: RGB(225,220,210)
  Gold trim: RGB(210,180,55)
  Neon pink: RGB(255,30,100)
  Neon yellow: RGB(255,220,30)
  Deep red carpet: RGB(160,20,30)

Scale: Small casino 100x80, Strip casino 300x200, Mega-resort 800x500

Interior zones:
  Gaming floor: open 200x100, ceiling 20 studs, columns every 30 studs
  Slot corridors: 12-stud wide paths, Neon machines 2x2x6 every 4 studs
  High-limit room: enclosed with 6w x 10h glass panels, separate color scheme
  Restaurant: 30x40 elevated 3 studs, different flooring material
  Hotel tower: separate structure 30x30 footprint x 200h, curtain wall Glass

Key elements:
  1. Valet stand at porte-cochere: small booth, rope stanchions
  2. Water feature fountain at entry: illuminated jets Neon RGB(30,150,220)
  3. Security cameras: visible dome shapes on ceiling every 10 studs
  4. Cashier cage: metal mesh enclosure 20x10
  5. Show stage: raised 3 studs, 30x15, curtain rigging visible above
  6. Parking structure: multi-level 200x200, connected by enclosed walkway
  7. Pool area: outdoor resort pool Neon RGB(30,180,220), cabanas surrounding

AI mistakes to avoid:
  - Do NOT make the facade understated — casinos compete for visual attention
  - Do NOT use a single neon color — variety is essential
  - Do NOT forget the signage — the sign IS the architecture for a casino
`;

export const ARCHITECTURAL_STYLES_BIBLE: string = `
=== FORJE GAMES ARCHITECTURAL STYLES MASTER BIBLE ===
Version: 1.0 | Every dimension in studs | Every color as RGB triplet | No SmoothPlastic ever

QUICK REFERENCE — MATERIAL ASSIGNMENTS BY STYLE:
  Medieval/Gothic: Cobblestone, Slate, Wood, Metal
  Tudor/Victorian: Brick, Wood, Slate, Metal
  Japanese/Asian: Wood, Tile, Marble, Cobblestone
  Modern/Brutalist: Concrete, Glass, Metal
  Art Deco/Skyscraper: Marble, SandWall, Glass, Metal
  Fantasy: Mix freely — Neon essential for all fantasy styles
  Industrial: Metal, Concrete, Brick, Wood
  Historical: SandWall, Cobblestone, Marble, Brick, Wood, Tile

UNIVERSAL RULES FOR ALL STYLES:
  1. NEVER use SmoothPlastic — always use Concrete, Brick, Cobblestone, Marble, Wood, Metal, Slate, SandWall, Tile, Glass, Neon, Granite, or Grass
  2. Minimum 30 distinct parts per build
  3. All dimensions in studs
  4. All colors as RGB triplets
  5. Every exterior needs ground contact — no floating structures
  6. Every building needs: walls, roof, door(s), at least 4 windows, interior visible through openings
  7. Color variation: similar materials should vary RGB by 10-20 points for organic look
  8. Scale context: all buildings should have human-scale reference (door 4-5w x 9-10h typical)

COMMON AI MISTAKES ACROSS ALL STYLES:
  - Making all walls the same height (vary 15-25% within same structure)
  - Forgetting interior detail visible through windows and doors
  - Using only one material for entire structure
  - Making roofs too thin (minimum 2 studs thickness)
  - Forgetting foundation/base — all buildings need visible ground anchor
  - Ignoring landscaping — every structure needs ground-level context
  - Making buildings perfectly symmetrical when asymmetry would look better
  - Skipping transition zones between different building sections

${ARCH_MEDIEVAL}

${ARCH_MODERN}

${ARCH_ASIAN}

${ARCH_FANTASY}

${ARCH_INDUSTRIAL}

${ARCH_HISTORICAL}

=== END ARCHITECTURAL STYLES BIBLE ===
`;
