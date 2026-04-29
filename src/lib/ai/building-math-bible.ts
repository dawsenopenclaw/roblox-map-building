// building-math-bible.ts — CFrame math, positioning, procedural generation
// Real Roblox API. Every formula battle-tested.

export const MATH_CFRAME: string = `
=== CFRAME MASTERY ===

--- BASICS ---
CFrame = position + orientation (4x4 matrix, but simplified in Luau)
CFrame.new(x, y, z) — position only, default orientation
CFrame.new(x, y, z) * CFrame.Angles(rx, ry, rz) — position + rotation
  rx, ry, rz are in RADIANS. Convert: radians = math.rad(degrees)
CFrame.Angles(0, math.rad(90), 0) — rotate 90 degrees around Y axis

--- KEY CFRAME CONSTRUCTORS ---
CFrame.new(pos) — at position, default facing -Z
CFrame.new(pos, lookAtPos) — DEPRECATED but still works. Position, facing target.
CFrame.lookAt(pos, target) — PREFERRED. At pos, looking at target.
CFrame.lookAt(pos, target, upVector) — with custom up direction
CFrame.fromAxisAngle(axis, angle) — rotate around arbitrary axis
CFrame.fromEulerAnglesYXZ(ry, rx, rz) — Euler angles in YXZ order (matches Orientation property)
CFrame.fromMatrix(pos, rightVector, upVector, lookVector) — from orthonormal vectors
CFrame.identity — zero position, zero rotation (identity matrix)

--- CFRAME OPERATIONS ---
Multiply: cf1 * cf2 — compose transformations (apply cf2 in cf1 local space)
Inverse: cf:Inverse() — reverse the transformation
Lerp: cf1:Lerp(cf2, alpha) — interpolate between two CFrames (alpha 0-1)
ToWorldSpace: cf:ToWorldSpace(localCF) — convert local offset to world
ToObjectSpace: cf:ToObjectSpace(worldCF) — convert world to local offset
PointToWorldSpace: cf:PointToWorldSpace(localPoint) — transform a Vector3 to world
PointToObjectSpace: cf:PointToObjectSpace(worldPoint) — transform world Vector3 to local

--- CFRAME PROPERTIES ---
cf.Position — Vector3 world position
cf.LookVector — Vector3 forward direction (where -Z faces)
cf.RightVector — Vector3 right direction (+X)
cf.UpVector — Vector3 up direction (+Y)
cf.X, cf.Y, cf.Z — position components
cf:GetComponents() — returns 12 numbers (position + rotation matrix)

--- COMMON PATTERNS ---

Place part on top of another (NO GAP):
  topPart.CFrame = bottomPart.CFrame * CFrame.new(0, bottomPart.Size.Y/2 + topPart.Size.Y/2, 0)

Place part to the right:
  rightPart.CFrame = leftPart.CFrame * CFrame.new(leftPart.Size.X/2 + rightPart.Size.X/2, 0, 0)

Place part in front:
  frontPart.CFrame = backPart.CFrame * CFrame.new(0, 0, -(backPart.Size.Z/2 + frontPart.Size.Z/2))

Rotate part around another parts center:
  orbiter.CFrame = center.CFrame * CFrame.Angles(0, math.rad(angle), 0) * CFrame.new(radius, 0, 0)

Face part toward a target:
  part.CFrame = CFrame.lookAt(part.Position, target.Position)

Tilt part on a slope:
  part.CFrame = CFrame.new(pos) * CFrame.Angles(math.rad(slopeAngle), 0, 0)
`

export const MATH_POSITIONING: string = `
=== NO-GAP POSITIONING ===

THE GOLDEN RULE: adjacent parts touch when:
  partB.CFrame = partA.CFrame * CFrame.new(offsetX, offsetY, offsetZ)
  where offset = (sizeA/2 + sizeB/2) along the connection axis

--- STACKING VERTICALLY (Y axis) ---
floor.CFrame = CFrame.new(0, floorThickness/2, 0)
wall.CFrame = floor.CFrame * CFrame.new(0, floor.Size.Y/2 + wall.Size.Y/2, 0)
roof.CFrame = wall.CFrame * CFrame.new(0, wall.Size.Y/2 + roof.Size.Y/2, 0)

--- PLACING SIDE BY SIDE (X axis) ---
wallLeft.CFrame = CFrame.new(-roomWidth/2 + wallThickness/2, wallHeight/2, 0)
wallRight.CFrame = CFrame.new(roomWidth/2 - wallThickness/2, wallHeight/2, 0)

--- PLACING FRONT/BACK (Z axis) ---
wallFront.CFrame = CFrame.new(0, wallHeight/2, -roomDepth/2 + wallThickness/2)
wallBack.CFrame = CFrame.new(0, wallHeight/2, roomDepth/2 - wallThickness/2)

--- AVOIDING Z-FIGHTING ---
Z-fighting = two surfaces at exact same position (flickers)
Fix: offset by 0.01-0.05 studs along the surface normal
  decal.CFrame = wall.CFrame * CFrame.new(0, 0, -wall.Size.Z/2 - 0.02)
  Or use Decal/Texture objects on surfaces instead of overlapping parts

--- WELD EVERYTHING ---
After positioning, weld parts together:
  local weld = Instance.new("WeldConstraint")
  weld.Part0 = parentPart
  weld.Part1 = childPart
  weld.Parent = parentPart
WeldConstraints maintain relative position. No need to set C0/C1.
`

export const MATH_GEOMETRY: string = `
=== CIRCULAR AND GEOMETRIC POSITIONING ===

--- CIRCLE OF PARTS ---
for i = 0, count - 1 do
  local angle = (i / count) * math.pi * 2
  local x = math.cos(angle) * radius
  local z = math.sin(angle) * radius
  part.CFrame = center * CFrame.new(x, 0, z)
end

--- CIRCLE FACING CENTER ---
for i = 0, count - 1 do
  local angle = (i / count) * math.pi * 2
  local x = math.cos(angle) * radius
  local z = math.sin(angle) * radius
  local pos = center.Position + Vector3.new(x, 0, z)
  part.CFrame = CFrame.lookAt(pos, center.Position)
end

--- CIRCLE FACING OUTWARD ---
Same as above but: part.CFrame = CFrame.lookAt(pos, center.Position) * CFrame.Angles(0, math.rad(180), 0)

--- SPIRAL ---
for i = 0, count - 1 do
  local angle = (i / count) * math.pi * 2 * spiralTurns
  local currentRadius = startRadius + (i / count) * (endRadius - startRadius)
  local height = (i / count) * totalHeight
  local x = math.cos(angle) * currentRadius
  local z = math.sin(angle) * currentRadius
  part.CFrame = center * CFrame.new(x, height, z)
end

--- ARC (partial circle) ---
for i = 0, count - 1 do
  local angle = startAngle + (i / (count - 1)) * (endAngle - startAngle)
  local x = math.cos(math.rad(angle)) * radius
  local z = math.sin(math.rad(angle)) * radius
  part.CFrame = center * CFrame.new(x, 0, z)
end
startAngle=0, endAngle=180 = semicircle

--- ELLIPSE ---
for i = 0, count - 1 do
  local angle = (i / count) * math.pi * 2
  local x = math.cos(angle) * radiusX
  local z = math.sin(angle) * radiusZ
  part.CFrame = center * CFrame.new(x, 0, z)
end

--- DOME (hemisphere) ---
for ring = 0, ringCount - 1 do
  local phi = (ring / ringCount) * math.pi / 2
  local ringRadius = math.cos(phi) * domeRadius
  local ringHeight = math.sin(phi) * domeRadius
  local partsInRing = math.max(4, math.floor(count * math.cos(phi)))
  for i = 0, partsInRing - 1 do
    local theta = (i / partsInRing) * math.pi * 2
    local x = math.cos(theta) * ringRadius
    local z = math.sin(theta) * ringRadius
    part.CFrame = center * CFrame.new(x, ringHeight, z)
  end
end

--- GRID ---
for row = 0, rows - 1 do
  for col = 0, cols - 1 do
    local x = (col - (cols - 1) / 2) * spacing
    local z = (row - (rows - 1) / 2) * spacing
    part.CFrame = center * CFrame.new(x, 0, z)
  end
end
`

export const MATH_PROCEDURAL: string = `
=== PROCEDURAL GENERATION ===

--- RANDOM SCATTER WITH RAYCAST ---
Place objects on terrain surface:
for i = 1, objectCount do
  local x = centerX + (math.random() - 0.5) * areaWidth
  local z = centerZ + (math.random() - 0.5) * areaDepth
  local origin = Vector3.new(x, 500, z) -- high up
  local result = workspace:Raycast(origin, Vector3.new(0, -1000, 0), rayParams)
  if result then
    local surfaceY = result.Position.Y
    object.CFrame = CFrame.new(x, surfaceY + object.Size.Y/2, z)
    -- Random rotation for natural look:
    object.CFrame = object.CFrame * CFrame.Angles(0, math.rad(math.random(0, 360)), 0)
  end
end

--- PERLIN NOISE TERRAIN ---
for x = 0, sizeX - 1 do
  for z = 0, sizeZ - 1 do
    local height = 0
    -- Octave 1 (large hills): amplitude 40, frequency 0.01
    height = height + math.noise(x * 0.01, z * 0.01, seed1) * 40
    -- Octave 2 (medium bumps): amplitude 15, frequency 0.03
    height = height + math.noise(x * 0.03, z * 0.03, seed2) * 15
    -- Octave 3 (small detail): amplitude 5, frequency 0.08
    height = height + math.noise(x * 0.08, z * 0.08, seed3) * 5
    -- math.noise returns -0.5 to 0.5, so height range: -30 to 30
    terrain:FillBlock(CFrame.new(x * 4, height, z * 4), Vector3.new(4, 4, 4), Enum.Material.Grass)
  end
end

--- CITY BLOCK GENERATOR ---
blockSize = 60 -- studs per city block
roadWidth = 16
for bx = 0, blocksX - 1 do
  for bz = 0, blocksZ - 1 do
    local baseX = bx * (blockSize + roadWidth)
    local baseZ = bz * (blockSize + roadWidth)
    -- Place road around block
    -- Place 1-4 buildings inside block
    local buildingCount = math.random(1, 4)
    -- Subdivide block into quadrants for building placement
  end
end

--- MAZE GENERATOR (Recursive Backtracker) ---
Grid of cells, each with 4 walls (north, south, east, west)
1. Start at random cell, mark visited
2. Check neighbors — if unvisited neighbor exists, remove wall between, move there
3. If no unvisited neighbors, backtrack
4. Repeat until all cells visited
Cell size: 8x8 studs, wall thickness: 1 stud, wall height: 8 studs

--- DUNGEON ROOM GENERATOR ---
1. Place N random rooms (15x15 to 40x40 studs, no overlap)
2. Find nearest room pairs (Delaunay triangulation or simple nearest-neighbor)
3. Connect with L-shaped corridors (6 studs wide)
4. Random room types: combat (empty center), treasure (chest in middle), trap (floor hazards), puzzle (mechanism), boss (2x size)
5. Place door Parts at corridor-room intersections

--- FRACTAL TREE ---
function branch(origin, direction, length, thickness, depth)
  if depth <= 0 then return end
  local endPos = origin + direction * length
  -- Create trunk part from origin to endPos
  local trunk = Part, Size(thickness, length, thickness), Material=Wood
  trunk.CFrame = CFrame.lookAt(origin, endPos) * CFrame.new(0, 0, -length/2)
  trunk.CFrame = trunk.CFrame * CFrame.Angles(math.rad(90), 0, 0) -- align Y with direction
  -- Branch into 2-3 sub-branches
  for b = 1, math.random(2, 3) do
    local newDir = (direction + Vector3.new(random(-0.5,0.5), random(0,0.3), random(-0.5,0.5))).Unit
    branch(endPos, newDir, length * 0.7, thickness * 0.65, depth - 1)
  end
end
branch(trunkBase, Vector3.yAxis, 15, 2, 5)
`

export const MATH_ALIGNMENT: string = `
=== ALIGNMENT AND SNAPPING ===

--- GRID SNAP ---
function snapToGrid(position, gridSize)
  return Vector3.new(
    math.round(position.X / gridSize) * gridSize,
    math.round(position.Y / gridSize) * gridSize,
    math.round(position.Z / gridSize) * gridSize
  )
end
Common grid sizes: 0.5, 1, 2, 4 studs

--- SURFACE SNAP ---
Place part flush against a surface:
function snapToSurface(part, surfaceResult)
  local normal = surfaceResult.Normal
  local position = surfaceResult.Position
  -- Offset by half size along normal
  local offset = 0
  if math.abs(normal.Y) > 0.5 then offset = part.Size.Y / 2
  elseif math.abs(normal.X) > 0.5 then offset = part.Size.X / 2
  else offset = part.Size.Z / 2 end
  part.CFrame = CFrame.new(position + normal * offset)
end

--- EDGE ALIGNMENT ---
Align two parts edge-to-edge (no overlap, no gap):
-- Left edge of B touches right edge of A
partB.Position = Vector3.new(
  partA.Position.X + partA.Size.X/2 + partB.Size.X/2,
  partA.Position.Y,
  partA.Position.Z
)

--- ROTATION SNAP ---
function snapRotation(angle, snapDegrees)
  return math.round(angle / snapDegrees) * snapDegrees
end
Common: snap to 15, 30, 45, or 90 degrees
`

export const MATH_PATTERNS: string = `
=== COMMON BUILDING PATTERNS ===

--- STAIRCASE ---
for step = 0, stepCount - 1 do
  local part = Part, Size(stepWidth, stepHeight, stepDepth)
  part.CFrame = baseCFrame * CFrame.new(0, step * stepHeight, -step * stepDepth)
end
Typical values: stepHeight=0.75, stepDepth=1, stepWidth=5, stepCount=12

--- SPIRAL STAIRCASE ---
for step = 0, stepCount - 1 do
  local angle = (step / stepsPerRevolution) * math.pi * 2
  local height = step * stepHeight
  local x = math.cos(angle) * radius
  local z = math.sin(angle) * radius
  local part = Part, Size(stepWidth, stepHeight, stepDepth)
  part.CFrame = CFrame.new(centerX + x, baseY + height, centerZ + z)
    * CFrame.Angles(0, -angle, 0)
end
Typical: stepsPerRevolution=16, radius=4, stepHeight=0.6

--- COLUMN ROW ---
for i = 0, columnCount - 1 do
  local x = startX + i * spacing
  local column = Part, Size(columnWidth, columnHeight, columnWidth)
  column.CFrame = CFrame.new(x, columnHeight/2, z)
end
Typical: spacing=8, columnWidth=1.5, columnHeight=12

--- ARCH ---
for i = 0, segmentCount - 1 do
  local angle = (i / segmentCount) * math.pi -- 0 to 180 degrees
  local x = math.cos(angle) * archRadius
  local y = math.sin(angle) * archRadius
  local segment = Part, Size(archThickness, archDepth, segmentLength)
  segment.CFrame = CFrame.new(centerX + x, baseY + y, centerZ)
    * CFrame.Angles(0, 0, angle - math.pi/2)
end
Typical: segmentCount=12, archRadius=5, archThickness=1

--- FENCE ---
for i = 0, postCount - 1 do
  local x = startX + i * postSpacing
  -- Post
  local post = Part, Size(0.4, fenceHeight, 0.4), Material=Wood
  post.CFrame = CFrame.new(x, fenceHeight/2, z)
  -- Rail between posts (except last)
  if i < postCount - 1 then
    local rail = Part, Size(postSpacing, 0.2, 0.2), Material=Wood
    rail.CFrame = CFrame.new(x + postSpacing/2, fenceHeight * 0.75, z)
    local rail2 = Part, Size(postSpacing, 0.2, 0.2), Material=Wood
    rail2.CFrame = CFrame.new(x + postSpacing/2, fenceHeight * 0.4, z)
  end
end
Typical: postSpacing=6, fenceHeight=4

--- WINDOW GRID ---
for row = 0, windowRows - 1 do
  for col = 0, windowCols - 1 do
    local x = wallLeft + margin + col * (windowWidth + gap)
    local y = floorLevel + sillHeight + row * (windowHeight + vertGap)
    local window = Part, Size(windowWidth, windowHeight, 0.1), Material=Glass
    window.CFrame = wallCFrame * CFrame.new(x, y, 0)
  end
end

--- ROOF TRUSS ---
-- A-frame: two angled beams meeting at peak
local leftBeam = Part, Size(beamThickness, roofSpan/2 / math.cos(pitch), beamThickness)
leftBeam.CFrame = CFrame.new(centerX - roofSpan/4, peakY/2, z) * CFrame.Angles(0, 0, pitch)
local rightBeam = mirror of left
local tieBeam = Part, Size(roofSpan, beamThickness, beamThickness) -- horizontal base
tieBeam.CFrame = CFrame.new(centerX, baseY, z)

--- COLLISION PREVENTION ---
Before placing a part, check for overlaps:
local overlapParams = OverlapParams.new()
overlapParams.FilterDescendantsInstances = {existingModel}
overlapParams.FilterType = Enum.RaycastFilterType.Include
local touching = workspace:GetPartsInPart(newPart, overlapParams)
if #touching > 0 then
  -- Adjust position or skip placement
end
`

export const BUILDING_MATH_BIBLE: string = MATH_CFRAME + '\n\n' + MATH_POSITIONING + '\n\n' + MATH_GEOMETRY + '\n\n' + MATH_PROCEDURAL + '\n\n' + MATH_ALIGNMENT + '\n\n' + MATH_PATTERNS
