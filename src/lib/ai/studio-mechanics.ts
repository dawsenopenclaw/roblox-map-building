import 'server-only'

/**
 * Studio Building Mechanics Knowledge
 *
 * Injected into EVERY build prompt to teach the AI how to
 * correctly place, size, and orient parts in Roblox Studio.
 */
export function getStudioMechanicsKnowledge(): string {
  return `
=== STUDIO BUILDING MECHANICS (follow these EXACTLY) ===

COORDINATE SYSTEM:
- Y = Up, X = Right, -Z = Forward (LookVector)
- CFrame.new(x, y, z) = position with no rotation
- CFrame.Angles() uses RADIANS not degrees — use math.rad()
- Part.Size: X=width, Y=height, Z=depth for Block
- Cylinder: Size.X = length/height (runs along X axis), radius = min(Y,Z)/2
- WedgePart: slope angle = atan2(Size.Y, Size.Z)

EDGE-TO-EDGE PLACEMENT:
- Part center is at its CFrame position
- Edges are at +/-Size/2 from center in each axis
- To place B on TOP of A: B.y = A.y + A.Size.Y/2 + B.Size.Y/2
- To place B to RIGHT of A: B.x = A.x + A.Size.X/2 + B.Size.X/2
- To place B at BACK edge of A: B.z = A.z + A.Size.Z/2 - B.Size.Z/2

WALL CONSTRUCTION (correct way):
- Wall thickness: 0.8-1.0 studs
- Room height: 10-12 studs
- Four walls around floor (20x1x20):
  North wall: CFrame.new(0, floorY + 0.5 + wallH/2, 10 - 0.4)
  South wall: CFrame.new(0, floorY + 0.5 + wallH/2, -10 + 0.4)
  East wall: CFrame.new(10 - 0.4, floorY + 0.5 + wallH/2, 0), rotated 90 deg
  West wall: CFrame.new(-10 + 0.4, floorY + 0.5 + wallH/2, 0), rotated 90 deg
- Corner overlap: one wall extends full length, perpendicular butts against it

DOOR OPENING (split wall into 3 parts):
- Left wall section: from wall left edge to door left edge
- Right wall section: from door right edge to wall right edge
- Header above door: door width x (wallHeight - doorHeight)
- Door: 4W x 7H studs. Frame: 0.3 thick pieces around opening

WINDOW OPENING (split wall into 5 parts):
- Left, Right, Header above, Sill below, Glass pane
- Window: 3W x 3-4H studs, sill at 3-4 studs from floor
- Frame: 0.2-0.3 thick pieces. Glass: Transparency=0.5, Material=Glass

ROOF CONSTRUCTION:
- WedgePart left slope + WedgePart right slope (rotated 180 deg Y)
- Pitch: 30-45 degrees. Height = halfWidth x tan(pitchAngle)
- Overhang: extend 1.5-2 studs past walls on ALL sides
- Ridge beam: 0.5x0.5 along peak (optional)

STAIRS (for loop):
- Riser height: 1 stud, tread depth: 1.5 studs, width: 5 studs
- for i = 0, numSteps-1: position = (0, i*riserH + riserH/2, i*treadD)
- Spiral: x = radius*cos(i*anglePerStep), z = radius*sin(i*anglePerStep), y = i*heightPerStep

TREE CONSTRUCTION:
- Trunk: Cylinder (Wood, brown 105,64,40), Size 2x8x2, rotated so axis is vertical
- Canopy: 3 overlapping Ball parts (Grass, green with vc() variation)
  Main: 10x10x10 at top of trunk
  Two secondary: 7x7x7 offset to sides
- Roots: 2-3 small wedge parts at base

FURNITURE SCALE (character = 5 studs):
- Table top: 3 studs from floor. Size: 4x0.3x3 + 4 legs 0.3x2.5x0.3
- Chair seat: 2.5 studs. Size: 2x0.3x2 + back 2x2x0.3 + 4 legs
- Bed: frame 4x0.5x6 + mattress 3.6x0.8x5.5 + headboard + pillow
- Bookshelf: 4Wx6Hx1.2D, shelves every 1.5 studs

LIGHTING RULES:
- PointLight MUST be child of a Part (never standalone)
- NEVER set CFrame on lights — they inherit parent position
- Warm indoor: Color3.fromRGB(255,220,180), Brightness=1.5, Range=16
- Cold outdoor: Color3.fromRGB(200,220,255), Brightness=1, Range=20
- Candle: Brightness=0.7, Range=8, Color(255,202,156)
- Neon material is self-illuminating (no PointLight needed)

INSTANCE.NEW RULES:
- Set Parent LAST (40x performance difference)
- Order: Name -> Anchored=true -> Size -> CFrame -> Material -> Color -> Parent
- For Cylinder: rotate with CFrame.Angles(0,0,math.rad(90)) to make vertical

MATERIALS BY USE:
- Walls: Concrete, Brick, Plaster, Limestone
- Floors: WoodPlanks, CeramicTiles, Marble, Carpet
- Roofs: ClayRoofTiles, RoofShingles, Slate
- Metal: Metal, DiamondPlate, CorrodedMetal
- Windows: Glass (Transparency 0.5-0.7)
- Organic: Grass, Ground, Sand
- Glow: Neon (self-lit, use for accent lights)
- NEVER: SmoothPlastic (looks cheap)

COLOR PALETTES (RGB):
Medieval: Stone(163,162,165) + DarkWood(105,64,40) + Rust(160,95,53)
Modern: White(242,243,243) + Black(27,42,53) + Blue(110,153,202)
Tropical: Sand(241,231,199) + Green(39,70,45) + Cyan(4,175,236)
Horror: DarkGray(99,95,98) + Blood(86,36,36) + Fog(175,148,131)
Cottage: Cream(254,243,187) + Wood(124,92,70) + Terra(190,104,98)

TOP MISTAKES TO AVOID:
1. Single-part walls (always add baseboard + crown molding + corner trim)
2. No roof overhang (extend 1.5-2 studs past walls)
3. Floating buildings (add foundation 0.5-1 stud thick)
4. Empty rooms (add furniture appropriate to room function)
5. One flat color (vary +/-10-15 RGB per section)
6. Wrong scale (table at 3 studs, chair at 2.5, door 4x7)
7. No lighting (PointLight in EVERY enclosed room)
8. Glass without frames (4-piece frame around every window)
9. SmoothPlastic material (use Concrete, Wood, Brick instead)
10. Bare door rectangle (add frame + handle + threshold)

=== END STUDIO MECHANICS ===
`
}
