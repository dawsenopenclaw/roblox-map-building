// exterior-construction-bible.ts — Roof, facade, porch, outdoor structure knowledge
// Dimensions in studs. No SmoothPlastic. RGB colors.

export const EXT_ROOFS: string = `
=== ROOF TYPES — CONSTRUCTION DETAILS ===

--- GABLE ROOF (most common) ---
Two sloping planes meeting at a ridge.
Ridge beam: Part, Size(buildingWidth+2, 0.5, 0.5), Material=Wood, Color RGB(90,55,20)
  Position: centered on top of building, at peak height
Left slope: Part, Size(roofRunLength, 0.3, buildingDepth+2), Material=Slate, Color RGB(80,70,65)
  Rotation: CFrame.Angles(0, 0, math.rad(-roofPitch))
  Position: from ridge to left eave
Right slope: mirror of left slope
Pitch angle: 30-45 degrees for residential, 20-30 for commercial
Overhang: 1-2 studs beyond wall on all sides
Fascia board: Part, Size(0.5, 0.8, buildingDepth+2), Material=Wood — along lower edge of each slope
Soffit: Part, Size(overhang, 0.2, buildingDepth+2) — horizontal under overhang
Gable end triangle: WedgePart to fill the triangular wall at each end

--- HIP ROOF ---
All four sides slope down. No exposed gable ends.
Four trapezoidal roof planes, meeting at ridge (shorter than building length).
Ridge: shorter than building length by 2 * (building width / 2 / tan(pitch))
Each side: Part angled to meet ridge and walls
Corner hips: WedgePart along each corner diagonal
More complex but looks more polished.

--- FLAT ROOF ---
Single horizontal plane with slight slope (1-2 degrees for drainage).
Roof slab: Part, Size(buildingWidth+1, 0.5, buildingDepth+1), Material=Concrete
Parapet wall: Part, Size(0.5, 2, sideLength) around perimeter
Coping: Part, Size(0.8, 0.2, sideLength) on top of parapet, Material=Concrete
For modern/commercial buildings.

--- MANSARD ROOF ---
Four-sided, each side has two slopes: steep lower, gentle upper.
Lower slope: 70-80 degrees from horizontal (nearly vertical)
Upper slope: 20-30 degrees
Creates usable attic space. French/Victorian aesthetic.
Lower section: Part per side, steep angle, Material=Slate, Color RGB(60,55,50)
Upper section: flatter Part connecting lower sections to ridge
Dormers: often added in lower slope

--- GAMBREL ROOF (barn style) ---
Like mansard but only on two sides (like a gable with double slope).
Lower slope: 60-70 degrees, Material=Wood or WoodPlanks, Color RGB(140,35,30)
Upper slope: 25-35 degrees
End walls: vertical, often with loft door/window
Classic barn red: RGB(140,35,30)

--- SHED ROOF (mono-pitch) ---
Single sloping plane. One wall higher than opposite.
Slope: 10-25 degrees
Roof Part: angled from high wall to low wall
Simple, modern aesthetic. Good for additions/extensions.

--- DOME ---
Built from ring segments (see building-math circle pattern).
8-12 rings of decreasing radius from base to peak.
Each ring: 8-16 Parts arranged in circle.
Material: Metal for observatory, Concrete for cathedral, Glass for greenhouse.
Top cap: Part (Ball) at apex.

--- PYRAMID ---
Four triangular faces meeting at point.
Each face: WedgePart, Size(baseLength, peakHeight, baseLength/2)
Material: Concrete or Cobblestone for Egyptian, Metal for modern.

--- SAW-TOOTH (industrial) ---
Repeating pattern of one vertical and one sloped surface.
Vertical face: Glass (windows for light), Size(0.2, sawHeight, buildingDepth)
Sloped face: Concrete or Metal, angled 30-40 degrees
Repeat every 8-12 studs across building width.

--- THATCH ---
Rounded, thick appearance using multiple layers.
Base: Part, angled like gable, Material=Grass, Color RGB(170,150,90)
Ridge: Part (cylinder-like), Material=Grass, Color RGB(160,140,80)
Thickness: 1-2 studs (thicker than normal roof)
Overhang: 2-3 studs (more than standard for rain protection)
`

export const EXT_FACADES: string = `
=== FACADE AND SIDING TYPES ===

--- LAP SIDING (horizontal boards) ---
Horizontal Part strips across wall face, each 0.8-1 stud tall.
Each board: Part, Size(wallWidth, 0.8, 0.15), Material=WoodPlanks
Overlap: each board overlaps the one below by 0.1 studs
Color: white RGB(235,230,220), gray RGB(160,160,165), blue RGB(100,130,160), green RGB(110,130,100)

--- BRICK FACADE ---
Wall: Part with Material=Brick
Window surrounds: Part frame around each window, Material=Concrete, Color RGB(200,195,185)
Quoins (corner stones): alternating sized Parts at building corners, Material=Concrete
Soldier course: horizontal brick row above windows (accent)

--- STUCCO ---
Wall: Part with Material=Concrete, slightly warm color RGB(220,210,190)
Texture: smooth, Mediterranean feel
Accent: exposed Wood beam ends (vigas) protruding from wall

--- STONE FACING ---
Wall: Material=Cobblestone or Granite
Random stone look: vary Part sizes slightly (2-4 stud widths, 1-2 stud heights)
Mortar lines: slightly recessed, darker color between stones

--- BOARD AND BATTEN ---
Wide boards with narrow strips covering joints.
Board: Part, Size(wallWidth, 3, 0.12), Material=Wood — vertical
Batten: Part, Size(wallWidth, 0.6, 0.15), Material=Wood — narrow strip over joints
Spacing: battens every 3-4 studs

--- HALF TIMBER (Tudor) ---
White plaster infill: Part, Material=Concrete, Color RGB(235,225,200)
Dark timber frame: Part, Material=Wood, Color RGB(50,35,20)
Exposed beams: vertical, horizontal, and diagonal patterns
Frame thickness: 0.3-0.5 studs proud of wall surface
`

export const EXT_PORCHES: string = `
=== PORCH, DECK, AND BALCONY CONSTRUCTION ===

--- FRONT PORCH ---
Floor: Part, Size(porchWidth, 0.3, porchDepth), Material=WoodPlanks, Color RGB(120,80,35)
  Typical: 20 wide x 6 deep, height matches door threshold
Posts: Part, Size(0.6, porchHeight, 0.6), Material=Wood, Color RGB(230,225,215)
  4-6 posts evenly spaced, height 8-9 studs
Railing: Part, Size(spanBetweenPosts, 0.15, 0.15), Material=Wood — top rail at 3 studs
  Bottom rail at 0.5 studs
Balusters: Part, Size(0.12, 2.5, 0.12), Material=Wood — every 0.5 studs between posts
Steps: 3-4 steps, each 5 wide x 0.75 high x 1 deep, Material=Wood
Ceiling: Part, Size(porchWidth, 0.2, porchDepth), Material=WoodPlanks (painted white)

--- DECK (backyard) ---
Floor: WoodPlanks, elevated 2-4 studs above ground
Joists: Part, Size(0.3, 0.5, deckDepth) every 2 studs underneath — hidden but adds depth
Railing: same as porch, 3 studs high
No roof — open air
Size: 20x16 to 40x20 studs typical
Stair access: 4-8 steps on one or two sides

--- BALCONY ---
Floor: Part, Size(balconyWidth, 0.3, 4), Material=Concrete or Metal
  Extends 3-4 studs from wall face
Railing: Metal bars, Part Size(0.1, 3, 0.1), Material=Metal, Color RGB(40,40,45)
  Every 0.4 studs
Top rail: Part, Size(balconyWidth, 0.15, 0.15), Material=Metal
Support brackets: 2-4 angled Parts from wall to underside of balcony floor
French doors: 2x Part, Size(1.5, 6.5, 0.2), Material=Glass — open onto balcony

--- WRAPAROUND PORCH ---
L-shaped or U-shaped porch around 2-3 sides of building.
Same construction as front porch but continuous.
Corner posts: thicker (0.8x0.8) at direction changes.
Total length: 40-80 studs. Depth: 6-8 studs.
`

export const EXT_DETAILS: string = `
=== EXTERIOR DETAIL ELEMENTS ===

--- WINDOW COMPONENTS ---
Frame: 4x Part (top, bottom, left, right), Material=Wood or Metal, Color RGB(230,225,215)
  Frame width: 0.3 studs, depth: 0.15
Glass: Part, Material=Glass, Transparency=0.3, Color RGB(180,210,240)
Sill: Part, Size(windowWidth+0.6, 0.15, 0.4), Material=Concrete — below window, extends outward
Lintel: Part, Size(windowWidth+0.6, 0.3, 0.15) — above window, structural
Shutters: 2x Part, Size(0.1, windowHeight, windowWidth/2), Material=Wood
  Flanking the window, painted color matching/contrasting house

--- DOOR COMPONENTS ---
Frame: 3x Part (top + 2 sides), Material=Wood, Color RGB(230,225,215)
Door panel: Part, Size(3, 6.5, 0.2), Material=Wood, Color varied
  Common door colors: red RGB(140,30,25), blue RGB(40,60,120), black RGB(30,30,35), natural RGB(120,80,35)
Doorknob: Part (Ball), Size(0.25, 0.25, 0.25), Material=Metal, Color RGB(180,160,50)
  Position: 3 studs up, 0.3 from edge
Threshold: Part, Size(3.4, 0.1, 0.3), Material=Metal
Transom window: Part, Size(2.5, 1, 0.1), Material=Glass — above door

--- CHIMNEY ---
Stack: Part, Size(2, 6, 2), Material=Brick, Color RGB(140,60,40)
  Extends from roof to 3 studs above ridge line
Cap: Part, Size(2.5, 0.3, 2.5), Material=Concrete, Color RGB(160,155,145)
Crown: Part, Size(2.3, 0.5, 2.3), Material=Concrete — above cap
Flue liner: Part, Size(0.8, 1, 0.8), Material=Metal — inside top

--- GUTTERS AND DOWNSPOUTS ---
Gutter: Part, Size(roofEdgeLength, 0.3, 0.3), Material=Metal, Color RGB(220,220,225)
  Attached along lower roof edge, slight slope toward downspout
Downspout: Part, Size(0.25, wallHeight, 0.25), Material=Metal
  Vertical, at corner of building, connects gutter to ground
Elbow: Part connecting gutter to downspout at angle

--- FOUNDATION ---
Visible foundation: 1-2 studs tall above grade
Material: Concrete, Color RGB(140,135,130) or Cobblestone
Slightly wider than wall above (0.5 stud each side)
Water table (trim): Part, Size(wallLength, 0.3, 0.15) — horizontal line at top of foundation

--- CORNER BOARDS ---
Vertical trim at building corners: Part, Size(0.15, wallHeight, 0.6), Material=Wood
Covers joint between two wall surfaces. Painted white or matching trim.

--- FASCIA AND SOFFIT ---
Fascia: vertical board at roof edge, covers rafter ends
  Part, Size(roofEdgeLength, 0.8, 0.15), Material=Wood
Soffit: horizontal panel under roof overhang
  Part, Size(overhangDepth, 0.15, roofEdgeLength), Material=Wood
Usually painted white or matching trim color.
`

export const EXT_STRUCTURES: string = `
=== OUTDOOR STRUCTURES ===

--- GARAGE (single car) ---
Footprint: 14 wide x 22 deep x 10 tall
Walls: Concrete or matching house siding
Roof: matches house (gable or hip)
Garage door: Part, Size(10, 8, 0.3), Material=Metal, Color RGB(200,195,185)
  Segmented: 4 horizontal panels
Side door: standard 3x6.5
Floor: Concrete, Color RGB(150,145,140)
Interior: bare walls, ceiling joists visible

--- SHED (garden/tool) ---
Footprint: 8 wide x 10 deep x 8 tall
Walls: WoodPlanks, Color RGB(140,35,30) or RGB(110,75,35)
Roof: shed roof (single slope), Material=Metal
Door: double barn style, 5 wide x 6 tall
Window: single, 2x2, on side wall
Floor: WoodPlanks, slightly raised
Interior: shelves, hooks for tools

--- PERGOLA ---
Footprint: 12 wide x 12 deep x 9 tall
4 corner posts: Part, Size(0.6, 9, 0.6), Material=Wood
2 header beams: Part, Size(0.4, 0.8, 14), Material=Wood — across top, front-back
8 cross rafters: Part, Size(14, 0.3, 0.15), Material=Wood — across headers
Optional lattice on sides for climbing plants
No solid roof — open or vine-covered

--- GAZEBO (octagonal) ---
Footprint: 12 stud diameter, 10 tall to roof peak
8 posts arranged in circle (radius 6), each 0.4x8x0.4, Material=Wood
Floor: octagonal platform, WoodPlanks, raised 1-2 studs
Railing between posts: 3 studs high, balusters
Roof: octagonal pyramid, Material=Slate
Center peak: decorative finial Part on top

--- FENCE TYPES ---
Picket: posts every 6 studs, pickets (pointed top) every 0.5, height 3.5
  Material=Wood, Color white RGB(235,230,220)
Chain link: posts every 8 studs, mesh fill (Part with Transparency 0.5)
  Material=Metal, Color RGB(140,145,150)
Privacy: solid boards, 6 tall, no gaps
  Material=WoodPlanks, Color RGB(140,110,65)
Split rail: posts every 8 studs, 2-3 horizontal rails
  Material=Wood, Color natural RGB(120,80,35)
Wrought iron: posts every 6 studs, decorative Metal bars
  Material=Metal, Color RGB(30,30,35)
Stone wall: Cobblestone, 3-4 studs tall, 1-1.5 wide

--- RETAINING WALL ---
Material: Cobblestone or Concrete
Height: 2-6 studs (holding back terrain)
Thickness: 1.5-2 studs at base, 1 at top (tapered)
Cap: flat Concrete piece on top

--- POOL ---
Shape: rectangular 20x10 or kidney-shaped
Depth: 4-6 studs below deck level
Walls: Concrete, Color light blue RGB(140,180,210)
Water: Part with Material=Glass, Color RGB(60,150,200), Transparency=0.4
Coping: Concrete lip around edge, 0.3 tall
Deck: Concrete surround, 4 studs wide

--- BASKETBALL HOOP ---
Pole: Part, Size(0.4, 10, 0.4), Material=Metal, Color RGB(120,120,130)
Backboard: Part, Size(0.15, 3, 4), Material=Concrete, Color RGB(240,240,245)
Rim: Part (torus-like ring of small Parts), Material=Metal, Color RGB(200,80,20)
Net: mesh-like Part arrangement or ForceField material
Court: Concrete, 30x25 studs, painted lines
`

export const EXT_BUILDING_TYPES: string = `
=== COMPLETE EXTERIOR BUILDS (part-by-part summary) ===

--- SUBURBAN HOUSE (45 parts minimum) ---
Foundation: Concrete, 30x22 footprint, 1.5 tall
Main walls: 4x Concrete, height 10 studs, painted RGB(220,215,200)
Gable roof: 2 slopes Slate + 2 gable triangles + ridge beam
Front porch: floor + 4 posts + railing + 3 steps + ceiling
Windows: 6x (frame + glass + sill) — 2 downstairs front, 1 door side, 3 upstairs
Front door: frame + panel + doorknob + threshold
Garage: extension with 1 garage door
Chimney: brick stack through roof + cap
Gutters: 4 edges + 2 downspouts
Siding detail: lap boards or brick
Trim: corner boards, fascia, soffit
Landscaping: 2 bushes, 1 tree, walkway path

--- MEDIEVAL TOWER (35 parts minimum) ---
Base: Cobblestone, circular or square, 12x12, walls 2 studs thick
Walls: 3 levels, each 12 studs tall, slight taper
Arrow slits: thin windows 0.3x2 every 90 degrees per level
Battlements: crenellations at top — alternating 1.5x2x1 blocks
Door: arched, Wood with Metal bands, 4 wide x 7 tall
Spiral stair inside: 16 steps per revolution
Conical roof: Parts arranged in cone, Material=Slate
Flag: Fabric Part on pole at peak
Torch sconces: 4 per level, Wood + Neon fire

--- MODERN GLASS OFFICE (30 parts minimum) ---
Structure: concrete core + steel frame
Floors: stacked 12-stud-high levels, 3-5 floors
Curtain wall: Glass panels filling between floor slabs
Concrete floor slabs: visible at edges, Material=Concrete
Entrance: double-height lobby (24 studs), revolving door
Roof: flat with parapet + mechanical penthouse
Ground level: retail frontage (larger glass panels)
Signage: building name on facade, Neon or SurfaceGui
`

export const EXTERIOR_CONSTRUCTION_BIBLE: string = EXT_ROOFS + '\n\n' + EXT_FACADES + '\n\n' + EXT_PORCHES + '\n\n' + EXT_DETAILS + '\n\n' + EXT_STRUCTURES + '\n\n' + EXT_BUILDING_TYPES
