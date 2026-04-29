// example-builds-bible.ts — Concrete Luau output examples showing what GOOD AI builds look like
// These are REFERENCE OUTPUTS the AI should study and emulate
// Every example: real Roblox API, no SmoothPlastic, multi-part detail, proper positioning

export const EXAMPLE_HOUSE: string = `
=== EXAMPLE: SUBURBAN HOUSE (45 parts) ===
This is what your Luau output should look like for "build me a house":

local model = Instance.new("Model")
model.Name = "SuburbanHouse"

-- Foundation (2 parts)
local foundation = Instance.new("Part")
foundation.Size = Vector3.new(32, 1.5, 24)
foundation.CFrame = CFrame.new(0, 0.75, 0)
foundation.Material = Enum.Material.Concrete
foundation.Color = Color3.fromRGB(140, 135, 130)
foundation.Anchored = true
foundation.Parent = model

local foundationTrim = Instance.new("Part")
foundationTrim.Size = Vector3.new(32.4, 0.3, 24.4)
foundationTrim.CFrame = CFrame.new(0, 1.65, 0)
foundationTrim.Material = Enum.Material.Concrete
foundationTrim.Color = Color3.fromRGB(160, 155, 150)
foundationTrim.Anchored = true
foundationTrim.Parent = model

-- Walls (4 main + 4 upper story)
local wallFront = Instance.new("Part")
wallFront.Size = Vector3.new(32, 10, 1)
wallFront.CFrame = CFrame.new(0, 6.5, -11.5)
wallFront.Material = Enum.Material.Brick
wallFront.Color = Color3.fromRGB(200, 185, 165)
wallFront.Anchored = true
wallFront.Parent = model

local wallBack = Instance.new("Part")
wallBack.Size = Vector3.new(32, 10, 1)
wallBack.CFrame = CFrame.new(0, 6.5, 11.5)
wallBack.Material = Enum.Material.Brick
wallBack.Color = Color3.fromRGB(200, 185, 165)
wallBack.Anchored = true
wallBack.Parent = model

local wallLeft = Instance.new("Part")
wallLeft.Size = Vector3.new(1, 10, 24)
wallLeft.CFrame = CFrame.new(-15.5, 6.5, 0)
wallLeft.Material = Enum.Material.Brick
wallLeft.Color = Color3.fromRGB(195, 180, 160)
wallLeft.Anchored = true
wallLeft.Parent = model

local wallRight = Instance.new("Part")
wallRight.Size = Vector3.new(1, 10, 24)
wallRight.CFrame = CFrame.new(15.5, 6.5, 0)
wallRight.Material = Enum.Material.Brick
wallRight.Color = Color3.fromRGB(195, 180, 160)
wallRight.Anchored = true
wallRight.Parent = model

-- Floor slab (separates stories)
local floor2 = Instance.new("Part")
floor2.Size = Vector3.new(30, 0.5, 22)
floor2.CFrame = CFrame.new(0, 11.75, 0)
floor2.Material = Enum.Material.Wood
floor2.Color = Color3.fromRGB(160, 120, 70)
floor2.Anchored = true
floor2.Parent = model

-- Roof (gable — 2 slopes + ridge)
local roofLeft = Instance.new("Part")
roofLeft.Size = Vector3.new(18, 0.4, 26)
roofLeft.CFrame = CFrame.new(-7, 16, 0) * CFrame.Angles(0, 0, math.rad(-30))
roofLeft.Material = Enum.Material.Slate
roofLeft.Color = Color3.fromRGB(70, 65, 60)
roofLeft.Anchored = true
roofLeft.Parent = model

local roofRight = Instance.new("Part")
roofRight.Size = Vector3.new(18, 0.4, 26)
roofRight.CFrame = CFrame.new(7, 16, 0) * CFrame.Angles(0, 0, math.rad(30))
roofRight.Material = Enum.Material.Slate
roofRight.Color = Color3.fromRGB(70, 65, 60)
roofRight.Anchored = true
roofRight.Parent = model

local ridge = Instance.new("Part")
ridge.Size = Vector3.new(1, 0.5, 26)
ridge.CFrame = CFrame.new(0, 19.5, 0)
ridge.Material = Enum.Material.Slate
ridge.Color = Color3.fromRGB(60, 55, 50)
ridge.Anchored = true
ridge.Parent = model

-- Front door (4 parts: frame, door, knob, threshold)
local doorFrame = Instance.new("Part")
doorFrame.Size = Vector3.new(4, 7, 0.5)
doorFrame.CFrame = CFrame.new(-4, 5, -12)
doorFrame.Material = Enum.Material.Wood
doorFrame.Color = Color3.fromRGB(230, 225, 215)
doorFrame.Anchored = true
doorFrame.Parent = model

local door = Instance.new("Part")
door.Size = Vector3.new(3, 6.5, 0.2)
door.CFrame = CFrame.new(-4, 4.75, -12.2)
door.Material = Enum.Material.Wood
door.Color = Color3.fromRGB(140, 30, 25)
door.Anchored = true
door.Parent = model

local knob = Instance.new("Part")
knob.Shape = Enum.PartType.Ball
knob.Size = Vector3.new(0.3, 0.3, 0.3)
knob.CFrame = CFrame.new(-3, 4.5, -12.35)
knob.Material = Enum.Material.Metal
knob.Color = Color3.fromRGB(180, 160, 50)
knob.Anchored = true
knob.Parent = model

local threshold = Instance.new("Part")
threshold.Size = Vector3.new(3.5, 0.1, 0.6)
threshold.CFrame = CFrame.new(-4, 1.55, -12)
threshold.Material = Enum.Material.Metal
threshold.Color = Color3.fromRGB(120, 115, 110)
threshold.Anchored = true
threshold.Parent = model

-- Windows (3 downstairs front — each: frame + glass + sill)
for i = 0, 2 do
  local xPos = -10 + i * 8
  if i == 1 then xPos = 4 end -- skip door area

  local winFrame = Instance.new("Part")
  winFrame.Size = Vector3.new(3, 4, 0.3)
  winFrame.CFrame = CFrame.new(xPos, 6, -12)
  winFrame.Material = Enum.Material.Wood
  winFrame.Color = Color3.fromRGB(230, 225, 215)
  winFrame.Anchored = true
  winFrame.Parent = model

  local glass = Instance.new("Part")
  glass.Size = Vector3.new(2.5, 3.5, 0.1)
  glass.CFrame = CFrame.new(xPos, 6, -12.15)
  glass.Material = Enum.Material.Glass
  glass.Color = Color3.fromRGB(180, 210, 240)
  glass.Transparency = 0.3
  glass.Anchored = true
  glass.Parent = model

  local sill = Instance.new("Part")
  sill.Size = Vector3.new(3.5, 0.15, 0.5)
  sill.CFrame = CFrame.new(xPos, 3.8, -12.1)
  sill.Material = Enum.Material.Concrete
  sill.Color = Color3.fromRGB(200, 195, 185)
  sill.Anchored = true
  sill.Parent = model
end

-- Porch (floor + 2 posts + railing + steps)
local porchFloor = Instance.new("Part")
porchFloor.Size = Vector3.new(14, 0.3, 5)
porchFloor.CFrame = CFrame.new(-4, 1.65, -14.5)
porchFloor.Material = Enum.Material.WoodPlanks
porchFloor.Color = Color3.fromRGB(120, 80, 35)
porchFloor.Anchored = true
porchFloor.Parent = model

local postL = Instance.new("Part")
postL.Size = Vector3.new(0.5, 8, 0.5)
postL.CFrame = CFrame.new(-10.5, 5.8, -16.5)
postL.Material = Enum.Material.Wood
postL.Color = Color3.fromRGB(230, 225, 215)
postL.Anchored = true
postL.Parent = model

local postR = Instance.new("Part")
postR.Size = Vector3.new(0.5, 8, 0.5)
postR.CFrame = CFrame.new(2.5, 5.8, -16.5)
postR.Material = Enum.Material.Wood
postR.Color = Color3.fromRGB(230, 225, 215)
postR.Anchored = true
postR.Parent = model

local railing = Instance.new("Part")
railing.Size = Vector3.new(13, 0.15, 0.15)
railing.CFrame = CFrame.new(-4, 4.5, -16.5)
railing.Material = Enum.Material.Wood
railing.Color = Color3.fromRGB(230, 225, 215)
railing.Anchored = true
railing.Parent = model

-- 3 porch steps
for step = 0, 2 do
  local s = Instance.new("Part")
  s.Size = Vector3.new(6, 0.5, 1)
  s.CFrame = CFrame.new(-4, 0.25 + step * 0.5, -17.5 + step * 1)
  s.Material = Enum.Material.Concrete
  s.Color = Color3.fromRGB(160, 155, 150)
  s.Anchored = true
  s.Parent = model
end

-- Chimney (3 parts)
local chimneyBase = Instance.new("Part")
chimneyBase.Size = Vector3.new(2, 8, 2)
chimneyBase.CFrame = CFrame.new(12, 16, 6)
chimneyBase.Material = Enum.Material.Brick
chimneyBase.Color = Color3.fromRGB(140, 60, 40)
chimneyBase.Anchored = true
chimneyBase.Parent = model

local chimneyCap = Instance.new("Part")
chimneyCap.Size = Vector3.new(2.5, 0.3, 2.5)
chimneyCap.CFrame = CFrame.new(12, 20.15, 6)
chimneyCap.Material = Enum.Material.Concrete
chimneyCap.Color = Color3.fromRGB(160, 155, 145)
chimneyCap.Anchored = true
chimneyCap.Parent = model

local chimneyCrown = Instance.new("Part")
chimneyCrown.Size = Vector3.new(2.3, 0.5, 2.3)
chimneyCrown.CFrame = CFrame.new(12, 20.55, 6)
chimneyCrown.Material = Enum.Material.Concrete
chimneyCrown.Color = Color3.fromRGB(165, 160, 150)
chimneyCrown.Anchored = true
chimneyCrown.Parent = model

-- Ground plane + walkway
local ground = Instance.new("Part")
ground.Size = Vector3.new(60, 0.2, 50)
ground.CFrame = CFrame.new(0, -0.1, 0)
ground.Material = Enum.Material.Grass
ground.Color = Color3.fromRGB(60, 130, 40)
ground.Anchored = true
ground.Parent = model

local walkway = Instance.new("Part")
walkway.Size = Vector3.new(4, 0.15, 8)
walkway.CFrame = CFrame.new(-4, 0.05, -21)
walkway.Material = Enum.Material.Concrete
walkway.Color = Color3.fromRGB(175, 170, 165)
walkway.Anchored = true
walkway.Parent = model

-- Exterior lighting
local porchLight = Instance.new("PointLight")
porchLight.Range = 15
porchLight.Brightness = 1.2
porchLight.Color = Color3.fromRGB(255, 200, 150)
porchLight.Parent = postL

model.Parent = workspace
model:PivotTo(CFrame.new(0, 0, 0))

KEY PATTERNS IN THIS EXAMPLE:
1. Every part is Anchored = true
2. CFrame.new() for precise positioning — NO gaps between parts
3. Walls meet foundation: wall Y = foundation top + wall height/2
4. Roof angled with CFrame.Angles(0, 0, math.rad(angle))
5. Multiple materials: Brick walls, Concrete foundation, Wood floors, Slate roof, Glass windows
6. Multiple colors: 8+ distinct RGB values
7. Loops for repeated elements (windows, steps)
8. Details: door knob, window sills, chimney cap, threshold, walkway
9. Ground plane under the build
10. Lighting attached to a part
`

export const EXAMPLE_TREE: string = `
=== EXAMPLE: DETAILED TREE (12 parts) ===
This is what "make a tree" output should look like — NOT a single Part:

local tree = Instance.new("Model")
tree.Name = "OakTree"

-- Trunk (3 parts: base, mid, narrowing top)
local trunkBase = Instance.new("Part")
trunkBase.Shape = Enum.PartType.Cylinder
trunkBase.Size = Vector3.new(8, 2.5, 2.5)
trunkBase.CFrame = CFrame.new(0, 4, 0) * CFrame.Angles(0, 0, math.rad(90))
trunkBase.Material = Enum.Material.Wood
trunkBase.Color = Color3.fromRGB(85, 55, 25)
trunkBase.Anchored = true
trunkBase.Parent = tree

local trunkMid = Instance.new("Part")
trunkMid.Shape = Enum.PartType.Cylinder
trunkMid.Size = Vector3.new(6, 2, 2)
trunkMid.CFrame = CFrame.new(0, 11, 0) * CFrame.Angles(0, 0, math.rad(90))
trunkMid.Material = Enum.Material.Wood
trunkMid.Color = Color3.fromRGB(80, 50, 22)
trunkMid.Anchored = true
trunkMid.Parent = tree

local trunkTop = Instance.new("Part")
trunkTop.Shape = Enum.PartType.Cylinder
trunkTop.Size = Vector3.new(4, 1.5, 1.5)
trunkTop.CFrame = CFrame.new(0, 16, 0) * CFrame.Angles(0, 0, math.rad(90))
trunkTop.Material = Enum.Material.Wood
trunkTop.Color = Color3.fromRGB(75, 45, 20)
trunkTop.Anchored = true
trunkTop.Parent = tree

-- Roots (2 visible surface roots)
local root1 = Instance.new("Part")
root1.Size = Vector3.new(0.6, 0.4, 3)
root1.CFrame = CFrame.new(1, 0.2, 1.5) * CFrame.Angles(0, math.rad(30), math.rad(10))
root1.Material = Enum.Material.Wood
root1.Color = Color3.fromRGB(70, 40, 18)
root1.Anchored = true
root1.Parent = tree

local root2 = Instance.new("Part")
root2.Size = Vector3.new(0.5, 0.35, 2.5)
root2.CFrame = CFrame.new(-0.8, 0.18, -1.2) * CFrame.Angles(0, math.rad(-50), math.rad(-8))
root2.Material = Enum.Material.Wood
root2.Color = Color3.fromRGB(72, 42, 19)
root2.Anchored = true
root2.Parent = tree

-- Canopy (4 overlapping sphere-ish parts for organic shape)
local canopyColors = {
  Color3.fromRGB(45, 110, 35),
  Color3.fromRGB(55, 125, 40),
  Color3.fromRGB(40, 100, 30),
  Color3.fromRGB(50, 115, 38),
}
local canopyPositions = {
  CFrame.new(0, 20, 0),
  CFrame.new(3, 18, 2),
  CFrame.new(-2, 19, -1.5),
  CFrame.new(1, 17, -2),
}
local canopySizes = {
  Vector3.new(12, 10, 12),
  Vector3.new(9, 8, 9),
  Vector3.new(10, 9, 10),
  Vector3.new(8, 7, 8),
}
for i = 1, 4 do
  local leaf = Instance.new("Part")
  leaf.Shape = Enum.PartType.Ball
  leaf.Size = canopySizes[i]
  leaf.CFrame = canopyPositions[i]
  leaf.Material = Enum.Material.Grass
  leaf.Color = canopyColors[i]
  leaf.Anchored = true
  leaf.Parent = tree
end

-- Branch (1 visible extending branch)
local branch = Instance.new("Part")
branch.Shape = Enum.PartType.Cylinder
branch.Size = Vector3.new(5, 0.6, 0.6)
branch.CFrame = CFrame.new(4, 14, 0) * CFrame.Angles(0, 0, math.rad(25))
branch.Material = Enum.Material.Wood
branch.Color = Color3.fromRGB(78, 48, 21)
branch.Anchored = true
branch.Parent = tree

tree.Parent = workspace

KEY PATTERNS:
1. Trunk tapers (2.5 → 2 → 1.5 stud diameter)
2. Canopy is 4 overlapping spheres, NOT one ball — organic shape
3. Each canopy sphere is slightly different green
4. Visible roots at ground level for realism
5. At least one visible branch
6. All Wood material for trunk/roots, Grass for canopy
7. 12 parts total — NOT just 2 parts (trunk + ball)
`

export const EXAMPLE_WEAPON: string = `
=== EXAMPLE: SWORD TOOL (8 parts) ===
Correct Tool setup with GripCFrame:

local tool = Instance.new("Tool")
tool.Name = "IronSword"
tool.RequiresHandle = true
tool.CanBeDropped = true
tool.ToolTip = "Iron Sword"
tool.Grip = CFrame.new(0, -0.5, 0) * CFrame.Angles(0, 0, math.rad(90))

local handle = Instance.new("Part")
handle.Name = "Handle"
handle.Size = Vector3.new(0.25, 1.5, 0.35)
handle.Material = Enum.Material.Fabric
handle.Color = Color3.fromRGB(60, 40, 20)
handle.Anchored = false
handle.CanCollide = false
handle.Parent = tool

local guard = Instance.new("Part")
guard.Size = Vector3.new(0.3, 0.3, 2)
guard.CFrame = handle.CFrame * CFrame.new(0, handle.Size.Y/2 + guard.Size.Y/2, 0)
guard.Material = Enum.Material.Metal
guard.Color = Color3.fromRGB(140, 120, 60)
guard.Anchored = false
guard.CanCollide = false
guard.Parent = tool
local w1 = Instance.new("WeldConstraint")
w1.Part0 = handle
w1.Part1 = guard
w1.Parent = handle

local blade = Instance.new("Part")
blade.Size = Vector3.new(0.2, 4.5, 0.8)
blade.CFrame = guard.CFrame * CFrame.new(0, guard.Size.Y/2 + blade.Size.Y/2, 0)
blade.Material = Enum.Material.Metal
blade.Color = Color3.fromRGB(180, 180, 195)
blade.Anchored = false
blade.CanCollide = false
blade.Parent = tool
local w2 = Instance.new("WeldConstraint")
w2.Part0 = guard
w2.Part1 = blade
w2.Parent = guard

local bladeEdge = Instance.new("Part")
bladeEdge.Size = Vector3.new(0.05, 4.2, 0.15)
bladeEdge.CFrame = blade.CFrame * CFrame.new(0, 0, blade.Size.Z/2)
bladeEdge.Material = Enum.Material.Metal
bladeEdge.Color = Color3.fromRGB(220, 220, 230)
bladeEdge.Anchored = false
bladeEdge.CanCollide = false
bladeEdge.Parent = tool
local w3 = Instance.new("WeldConstraint")
w3.Part0 = blade
w3.Part1 = bladeEdge
w3.Parent = blade

local pommel = Instance.new("Part")
pommel.Shape = Enum.PartType.Ball
pommel.Size = Vector3.new(0.4, 0.4, 0.4)
pommel.CFrame = handle.CFrame * CFrame.new(0, -handle.Size.Y/2 - 0.15, 0)
pommel.Material = Enum.Material.Metal
pommel.Color = Color3.fromRGB(140, 120, 60)
pommel.Anchored = false
pommel.CanCollide = false
pommel.Parent = tool
local w4 = Instance.new("WeldConstraint")
w4.Part0 = handle
w4.Part1 = pommel
w4.Parent = handle

local tip = Instance.new("WedgePart")
tip.Size = Vector3.new(0.2, 0.8, 0.8)
tip.CFrame = blade.CFrame * CFrame.new(0, blade.Size.Y/2 + tip.Size.Y/2, 0)
tip.Material = Enum.Material.Metal
tip.Color = Color3.fromRGB(200, 200, 210)
tip.Anchored = false
tip.CanCollide = false
tip.Parent = tool
local w5 = Instance.new("WeldConstraint")
w5.Part0 = blade
w5.Part1 = tip
w5.Parent = blade

local fuller = Instance.new("Part")
fuller.Size = Vector3.new(0.05, 3.5, 0.2)
fuller.CFrame = blade.CFrame
fuller.Material = Enum.Material.Metal
fuller.Color = Color3.fromRGB(150, 150, 165)
fuller.Anchored = false
fuller.CanCollide = false
fuller.Parent = tool
local w6 = Instance.new("WeldConstraint")
w6.Part0 = blade
w6.Part1 = fuller
w6.Parent = blade

tool.Parent = game.StarterPack

KEY PATTERNS:
1. Tool with Handle (required name) as first child
2. Tool.Grip for hand positioning
3. ALL parts Anchored=false, CanCollide=false (tool parts move with character)
4. WeldConstraint connecting each part to adjacent part
5. Positioned relative to each other using CFrame math
6. Multiple distinct materials (Metal blade, Fabric grip, Metal guard)
7. Color variation (blade vs guard vs pommel)
8. WedgePart for pointed tip
`

export const EXAMPLE_VEHICLE: string = `
=== EXAMPLE: DRIVEABLE CAR (key parts shown) ===
VehicleSeat + constraint-based wheels:

local car = Instance.new("Model")
car.Name = "Sedan"

local body = Instance.new("Part")
body.Size = Vector3.new(6, 2, 14)
body.CFrame = CFrame.new(0, 3, 0)
body.Material = Enum.Material.Metal
body.Color = Color3.fromRGB(180, 30, 30)
body.Anchored = false
body.Parent = car

local seat = Instance.new("VehicleSeat")
seat.Size = Vector3.new(4, 0.5, 2)
seat.CFrame = CFrame.new(0, 3, -1)
seat.Material = Enum.Material.Fabric
seat.Color = Color3.fromRGB(30, 30, 35)
seat.MaxSpeed = 80
seat.Torque = 40
seat.TurnSpeed = 4
seat.Anchored = false
seat.Parent = car
local seatWeld = Instance.new("WeldConstraint")
seatWeld.Part0 = body
seatWeld.Part1 = seat
seatWeld.Parent = body

-- One wheel example (repeat for all 4)
local wheelFL = Instance.new("Part")
wheelFL.Shape = Enum.PartType.Cylinder
wheelFL.Size = Vector3.new(1, 2.5, 2.5)
wheelFL.CFrame = CFrame.new(-3.5, 1.25, -4) * CFrame.Angles(0, 0, math.rad(90))
wheelFL.Material = Enum.Material.Fabric
wheelFL.Color = Color3.fromRGB(25, 25, 30)
wheelFL.Anchored = false
wheelFL.CustomPhysicalProperties = PhysicalProperties.new(1, 1.5, 0, 1, 1)
wheelFL.Parent = car

-- Axle attachment on body
local bodyAttach = Instance.new("Attachment")
bodyAttach.CFrame = CFrame.new(-3.5, -0.5, -4)
bodyAttach.Parent = body

-- Axle attachment on wheel
local wheelAttach = Instance.new("Attachment")
wheelAttach.CFrame = CFrame.new(0, 0, 0)
wheelAttach.Parent = wheelFL

-- Suspension spring
local spring = Instance.new("SpringConstraint")
spring.Attachment0 = bodyAttach
spring.Attachment1 = wheelAttach
spring.FreeLength = 2
spring.Stiffness = 5000
spring.Damping = 200
spring.LimitsEnabled = true
spring.MinLength = 1
spring.MaxLength = 3
spring.Parent = wheelFL

-- Wheel spin constraint
local hinge = Instance.new("HingeConstraint")
hinge.Attachment0 = bodyAttach
hinge.Attachment1 = wheelAttach
hinge.ActuatorType = Enum.ActuatorType.Motor
hinge.MotorMaxAcceleration = 500
hinge.MotorMaxTorque = 1000
hinge.Parent = wheelFL

-- Headlights
local headlightL = Instance.new("Part")
headlightL.Size = Vector3.new(1, 0.8, 0.2)
headlightL.CFrame = CFrame.new(-2, 3, -7.1)
headlightL.Material = Enum.Material.Neon
headlightL.Color = Color3.fromRGB(255, 250, 220)
headlightL.Anchored = false
headlightL.Parent = car
local hlWeld = Instance.new("WeldConstraint")
hlWeld.Part0 = body
hlWeld.Part1 = headlightL
hlWeld.Parent = body

local hlSpot = Instance.new("SpotLight")
hlSpot.Range = 60
hlSpot.Brightness = 2
hlSpot.Angle = 45
hlSpot.Face = Enum.NormalId.Front
hlSpot.Color = Color3.fromRGB(255, 250, 230)
hlSpot.Parent = headlightL

car.PrimaryPart = body
car.Parent = workspace

KEY PATTERNS:
1. VehicleSeat (not regular Seat) — has MaxSpeed, Torque, TurnSpeed
2. Wheels are Cylinders with CustomPhysicalProperties for grip
3. SpringConstraint for suspension (stiffness, damping, limits)
4. HingeConstraint with Motor ActuatorType for wheel spin
5. Attachments connect body to wheels
6. Neon material for headlights + SpotLight inside
7. WeldConstraint for non-physics parts (headlights, panels)
8. PrimaryPart set on model
9. Nothing Anchored (physics car needs to move)
`

export const EXAMPLE_BUILDS_BIBLE: string = EXAMPLE_HOUSE + '\n\n' + EXAMPLE_TREE + '\n\n' + EXAMPLE_WEAPON + '\n\n' + EXAMPLE_VEHICLE
