// Crawled from Roblox Creator Docs — Apr 29 2026
// Constraints: HingeConstraint, SpringConstraint, BallSocketConstraint,
//              PrismaticConstraint, RopeConstraint, WeldConstraint
// Rigging: Motor6D, Attachment
// GUI: ScreenGui, BillboardGui, SurfaceGui, Folder
// Focus: REAL-WORLD practical examples with working Luau code

export const CONSTRAINTS_RIGGING_GUI = `
=== ATTACHMENTS — THE FOUNDATION OF ALL CONSTRAINTS ===

Attachments are anchor points. Every constraint needs TWO attachments —
one on each part being connected. Position them where the joint should be.

\`\`\`lua
-- Create an attachment at a specific position on a part
local function makeAttachment(part, offset)
    local att = Instance.new("Attachment")
    att.Position = offset  -- local offset from part center
    att.Parent = part
    return att
end

-- Example: door hinge attachments
local doorFrame = workspace.DoorFrame.HingePart  -- the fixed post
local door = workspace.Door.DoorPart             -- the swinging door

-- Hinge at the left edge of the door
local att0 = makeAttachment(doorFrame, Vector3.new(0, 0, 0))
local att1 = makeAttachment(door, Vector3.new(-2.5, 0, 0))  -- door edge
\`\`\`

=== HINGECONSTRAINT — SWINGING DOORS, WHEELS, LEVERS ===

HingeConstraint makes two parts rotate around a shared axis.
Perfect for: doors, wheels, flip traps, levers, windmills.

KEY PROPERTIES:
  ActuatorType         -- None | Motor | Servo
  LimitsEnabled        -- bool, clamp rotation angle
  LowerAngle           -- min angle (degrees) when LimitsEnabled
  UpperAngle           -- max angle (degrees) when LimitsEnabled
  MotorMaxTorque       -- force of motor
  AngularVelocity      -- target speed (radians/sec) for Motor mode
  TargetAngle          -- target angle for Servo mode
  ServoMaxTorque       -- force of servo

PATTERN 1 — Swinging door (opens when player touches):
\`\`\`lua
-- Script (can be a Script inside the door model)
local door = script.Parent          -- the door Part
local doorFrame = door.Parent.Frame -- the fixed frame

-- Create attachments at hinge position (left edge of door)
local att0 = Instance.new("Attachment")
att0.Position = Vector3.new(0, 0, 0)
att0.Parent = doorFrame

local att1 = Instance.new("Attachment")
att1.Position = Vector3.new(-2.5, 0, 0)  -- half-width of door
att1.Parent = door

-- Create hinge
local hinge = Instance.new("HingeConstraint")
hinge.Attachment0 = att0
hinge.Attachment1 = att1
hinge.ActuatorType = Enum.ActuatorType.Servo
hinge.LimitsEnabled = true
hinge.LowerAngle = 0      -- closed position
hinge.UpperAngle = 90     -- fully open
hinge.TargetAngle = 0     -- start closed
hinge.ServoMaxTorque = 5000
hinge.Parent = door

local isOpen = false

-- Toggle on ProximityPrompt trigger
local prompt = Instance.new("ProximityPrompt")
prompt.ActionText = "Open Door"
prompt.Parent = door

prompt.Triggered:Connect(function(player)
    isOpen = not isOpen
    hinge.TargetAngle = isOpen and 90 or 0
    prompt.ActionText = isOpen and "Close Door" or "Open Door"
end)
\`\`\`

PATTERN 2 — Spinning wheel / windmill (constant rotation):
\`\`\`lua
local blade = workspace.Windmill.Blade
local hub   = workspace.Windmill.Hub

local att0 = Instance.new("Attachment")
att0.Parent = hub

local att1 = Instance.new("Attachment")
att1.Parent = blade

local hinge = Instance.new("HingeConstraint")
hinge.Attachment0 = att0
hinge.Attachment1 = att1
hinge.ActuatorType = Enum.ActuatorType.Motor
hinge.MotorMaxTorque = 10000
hinge.AngularVelocity = 2  -- radians/sec (about 115 RPM)
hinge.Parent = blade
\`\`\`

PATTERN 3 — Lever/button that resets:
\`\`\`lua
local lever = workspace.Lever.Handle
local base  = workspace.Lever.Base

local att0 = Instance.new("Attachment")
att0.Parent = base
local att1 = Instance.new("Attachment")
att1.Parent = lever

local hinge = Instance.new("HingeConstraint")
hinge.Attachment0 = att0
hinge.Attachment1 = att1
hinge.ActuatorType = Enum.ActuatorType.Servo
hinge.LimitsEnabled = true
hinge.LowerAngle = -30
hinge.UpperAngle = 30
hinge.TargetAngle = 0
hinge.ServoMaxTorque = 3000
hinge.Parent = lever

-- Pull lever on touch
lever.Touched:Connect(function(hit)
    if game:GetService("Players"):GetPlayerFromCharacter(hit.Parent) then
        hinge.TargetAngle = 30  -- pull forward
        task.delay(1, function()
            hinge.TargetAngle = 0  -- spring back
        end)
        -- Fire event, open gate, etc.
    end
end)
\`\`\`

=== SPRINGCONSTRAINT — SUSPENSION, BOUNCY FLOORS, SHOCK ABSORBERS ===

SpringConstraint connects two parts with a spring force.
Perfect for: car suspension, trampolines, bouncy platforms, drawbridges.

KEY PROPERTIES:
  Stiffness      -- spring force (higher = stiffer, default 50)
  Damping        -- energy loss (higher = less bouncy, default 0)
  FreeLength     -- rest length of spring (studs)
  MinLength      -- minimum allowed length
  MaxLength      -- maximum allowed length
  LimitsEnabled  -- enforce min/max length

PATTERN 1 — Bouncy trampoline floor:
\`\`\`lua
local trampoline = workspace.Trampoline.Surface
local anchor     = workspace.Trampoline.Base

local att0 = Instance.new("Attachment")
att0.Parent = anchor
local att1 = Instance.new("Attachment")
att1.Parent = trampoline

local spring = Instance.new("SpringConstraint")
spring.Attachment0 = att0
spring.Attachment1 = att1
spring.Stiffness = 200     -- strong spring
spring.Damping = 5         -- a little damping so it doesn't bounce forever
spring.FreeLength = 0.5    -- rest at nearly touching
spring.LimitsEnabled = true
spring.MinLength = 0.1
spring.MaxLength = 3       -- how far it can stretch
spring.Parent = trampoline

-- The trampoline naturally bounces characters that land on it
\`\`\`

PATTERN 2 — Vehicle suspension (4 corner springs):
\`\`\`lua
local chassis = workspace.Car.Chassis
local wheels  = {
    workspace.Car.WheelFL,
    workspace.Car.WheelFR,
    workspace.Car.WheelBL,
    workspace.Car.WheelBR,
}
local offsets = {
    Vector3.new(-3, -1, 3),   -- front left
    Vector3.new( 3, -1, 3),   -- front right
    Vector3.new(-3, -1, -3),  -- back left
    Vector3.new( 3, -1, -3),  -- back right
}

for i, wheel in ipairs(wheels) do
    local att0 = Instance.new("Attachment")
    att0.Position = offsets[i]
    att0.Parent = chassis

    local att1 = Instance.new("Attachment")
    att1.Position = Vector3.new(0, 0.5, 0)
    att1.Parent = wheel

    local spring = Instance.new("SpringConstraint")
    spring.Attachment0 = att0
    spring.Attachment1 = att1
    spring.Stiffness = 500
    spring.Damping = 30
    spring.FreeLength = 1.5
    spring.LimitsEnabled = true
    spring.MinLength = 0.5
    spring.MaxLength = 2.5
    spring.Parent = wheel
end
\`\`\`

=== BALLSOCKETCONSTRAINT — RAGDOLLS, SHOULDER JOINTS ===

BallSocketConstraint allows rotation in all directions (like a ball in a socket).
Used for: ragdoll physics, loose rope ends, organic joint movement.

KEY PROPERTIES:
  LimitsEnabled    -- restrict how far it can swing
  UpperAngle       -- max cone angle (degrees, 0-180)
  TwistLimitsEnabled -- restrict twisting
  TwistUpperAngle  -- max twist
  TwistLowerAngle  -- min twist

PATTERN — Ragdoll on death:
\`\`\`lua
-- Script in ServerScriptService
local Players = game:GetService("Players")

local JOINT_LIMITS = {
    ["Left Shoulder"]  = 120,
    ["Right Shoulder"] = 120,
    ["Left Hip"]       = 120,
    ["Right Hip"]      = 120,
    ["Neck"]           = 45,
}

local function ragdollCharacter(character)
    local humanoid = character:FindFirstChildOfClass("Humanoid")
    if not humanoid then return end

    humanoid.PlatformStand = true  -- disable movement control
    humanoid:ChangeState(Enum.HumanoidStateType.Physics)

    -- Replace Motor6Ds with BallSocketConstraints
    for _, motor in ipairs(character:GetDescendants()) do
        if motor:IsA("Motor6D") then
            local part0 = motor.Part0
            local part1 = motor.Part1

            if not part0 or not part1 then continue end

            -- Create attachments at the motor positions
            local att0 = Instance.new("Attachment")
            att0.CFrame = motor.C0
            att0.Parent = part0

            local att1 = Instance.new("Attachment")
            att1.CFrame = motor.C1
            att1.Parent = part1

            -- Create BallSocket
            local bsc = Instance.new("BallSocketConstraint")
            bsc.Attachment0 = att0
            bsc.Attachment1 = att1
            bsc.LimitsEnabled = true
            bsc.UpperAngle = JOINT_LIMITS[motor.Name] or 90
            bsc.Parent = part1

            -- Disable the Motor6D (don't destroy — need it for re-animation)
            motor.Enabled = false

            -- Make parts loose
            if part1:IsA("BasePart") then
                part1.CanCollide = true
            end
        end
    end
end

local function unragdollCharacter(character)
    -- Re-enable all motors
    for _, motor in ipairs(character:GetDescendants()) do
        if motor:IsA("Motor6D") then
            motor.Enabled = true
        end
    end
    -- Remove ragdoll constraints
    for _, bsc in ipairs(character:GetDescendants()) do
        if bsc:IsA("BallSocketConstraint") then
            bsc.Parent.Parent = nil  -- remove the attachment pair
            bsc:Destroy()
        end
    end
    local humanoid = character:FindFirstChildOfClass("Humanoid")
    if humanoid then
        humanoid.PlatformStand = false
    end
end

Players.PlayerAdded:Connect(function(player)
    player.CharacterAdded:Connect(function(character)
        local humanoid = character:WaitForChild("Humanoid")
        humanoid.Died:Connect(function()
            task.wait(0.1)
            ragdollCharacter(character)
        end)
    end)
end)
\`\`\`

=== PRISMATICCONSTRAINT — SLIDING DOORS, ELEVATORS, DRAWERS ===

PrismaticConstraint slides one part along an axis relative to another.
Perfect for: sliding doors, elevator platforms, drawers, pistons.

KEY PROPERTIES:
  LimitsEnabled    -- restrict sliding range
  LowerLimit       -- min position (studs)
  UpperLimit       -- max position (studs)
  ActuatorType     -- None | Motor | Servo
  MotorMaxForce    -- force for Motor
  Velocity         -- target speed for Motor mode (studs/sec)
  ServoMaxForce    -- force for Servo
  TargetPosition   -- target position for Servo

PATTERN — Sliding door:
\`\`\`lua
local slideDoor = workspace.SlidingDoor.Door
local doorTrack  = workspace.SlidingDoor.Track

local att0 = Instance.new("Attachment")
att0.Parent = doorTrack

local att1 = Instance.new("Attachment")
att1.Parent = slideDoor

-- Orient attachment so axis = X direction (sliding left/right)
att0.CFrame = CFrame.new(0, 0, 0) * CFrame.fromEulerAnglesXYZ(0, math.rad(90), 0)
att1.CFrame = CFrame.new(0, 0, 0) * CFrame.fromEulerAnglesXYZ(0, math.rad(90), 0)

local prismatic = Instance.new("PrismaticConstraint")
prismatic.Attachment0 = att0
prismatic.Attachment1 = att1
prismatic.LimitsEnabled = true
prismatic.LowerLimit = 0     -- closed
prismatic.UpperLimit = 5     -- fully open (5 studs)
prismatic.ActuatorType = Enum.ActuatorType.Servo
prismatic.TargetPosition = 0
prismatic.ServoMaxForce = 8000
prismatic.Speed = 3
prismatic.Parent = slideDoor

local isOpen = false

local prompt = Instance.new("ProximityPrompt")
prompt.ActionText = "Open"
prompt.Parent = slideDoor

prompt.Triggered:Connect(function()
    isOpen = not isOpen
    prismatic.TargetPosition = isOpen and 5 or 0
    prompt.ActionText = isOpen and "Close" or "Open"
end)
\`\`\`

=== ROPECONSTRAINT — ROPE BRIDGES, HANGING OBJECTS, CHANDELIERS ===

RopeConstraint keeps two parts within a max distance (like a rope).
Parts can swing freely — use multiple ropes for a rope bridge.

KEY PROPERTIES:
  Length          -- max rope length (studs)
  Thickness       -- visual rope thickness
  Restitution     -- bounciness at full extension (0-1)
  WinchEnabled    -- enable winch (reels in/out)
  WinchTarget     -- target length for winch
  WinchSpeed      -- reeling speed

PATTERN 1 — Hanging chandelier:
\`\`\`lua
local ceiling    = workspace.Room.Ceiling
local chandelier = workspace.Room.Chandelier

local att0 = Instance.new("Attachment")
att0.Position = Vector3.new(0, 0, 0)  -- center of ceiling
att0.Parent = ceiling

local att1 = Instance.new("Attachment")
att1.Position = Vector3.new(0, 1, 0)  -- top of chandelier
att1.Parent = chandelier

local rope = Instance.new("RopeConstraint")
rope.Attachment0 = att0
rope.Attachment1 = att1
rope.Length = 8        -- hangs 8 studs down
rope.Thickness = 0.2   -- visual rope width
rope.Parent = chandelier

-- Make chandelier anchored=false so it swings
chandelier.Anchored = false
\`\`\`

PATTERN 2 — Rope bridge (multiple ropes + boards):
\`\`\`lua
local startPost = workspace.Bridge.PostA
local endPost   = workspace.Bridge.PostB

local BOARD_COUNT = 10
local BRIDGE_LENGTH = 40  -- studs between posts
local BOARD_WIDTH = 6

-- Create boards
local boards = {}
for i = 1, BOARD_COUNT do
    local board = Instance.new("Part")
    board.Name = "Board" .. i
    board.Size = Vector3.new(BOARD_WIDTH, 0.5, 3)
    board.Material = Enum.Material.Wood
    board.BrickColor = BrickColor.new("Reddish brown")
    board.CFrame = CFrame.new(
        startPost.Position + Vector3.new(0, -2, (i / (BOARD_COUNT + 1)) * BRIDGE_LENGTH)
    )
    board.Anchored = false
    board.Parent = workspace.Bridge
    table.insert(boards, board)
end

-- Connect each board to the next with short ropes
-- Connect first/last to posts

local function connectRope(partA, partB, offsetA, offsetB, length)
    local att0 = Instance.new("Attachment")
    att0.Position = offsetA
    att0.Parent = partA

    local att1 = Instance.new("Attachment")
    att1.Position = offsetB
    att1.Parent = partB

    local rope = Instance.new("RopeConstraint")
    rope.Attachment0 = att0
    rope.Attachment1 = att1
    rope.Length = length
    rope.Thickness = 0.15
    rope.Parent = partB
end

-- Connect post → first board
connectRope(startPost, boards[1], Vector3.new(0, 0, 0), Vector3.new(0, 0, -1.5), 2.5)

-- Connect boards to each other
for i = 1, #boards - 1 do
    connectRope(boards[i], boards[i+1], Vector3.new(0, 0, 1.5), Vector3.new(0, 0, -1.5), 3.5)
end

-- Connect last board → end post
connectRope(boards[#boards], endPost, Vector3.new(0, 0, 1.5), Vector3.new(0, 0, 0), 2.5)

print("Rope bridge created with", BOARD_COUNT, "boards")
\`\`\`

=== WELDCONSTRAINT — RIGID CONNECTIONS ===

WeldConstraint rigidly locks two parts together. No CFrame offsets needed.
Simpler than WeldConstraint (Motor6D) — just drag and drop style.

\`\`\`lua
-- Weld a hat to a character's head
local function weldToHead(character, hat)
    local head = character:FindFirstChild("Head")
    if not head then return end

    local weld = Instance.new("WeldConstraint")
    weld.Part0 = head
    weld.Part1 = hat
    weld.Parent = hat
    hat.Anchored = false
end

-- Weld multiple parts together to make a rigid model
local function weldModel(model)
    local primaryPart = model.PrimaryPart
    if not primaryPart then return end

    for _, part in ipairs(model:GetDescendants()) do
        if part:IsA("BasePart") and part ~= primaryPart then
            local weld = Instance.new("WeldConstraint")
            weld.Part0 = primaryPart
            weld.Part1 = part
            weld.Parent = part
        end
    end
end
\`\`\`

=== MOTOR6D — CUSTOM RIGS AND ANIMATED JOINTS ===

Motor6D is the joint type used for animated characters (R15, R6).
It transforms Part1 relative to Part0 using C0 and C1 CFrame offsets.
Use Motor6D when you need joints that can be animated by AnimationControllers.

KEY PROPERTIES:
  Part0         -- the parent part (e.g. UpperTorso)
  Part1         -- the child part (e.g. UpperArm)
  C0            -- CFrame offset from Part0 center
  C1            -- CFrame offset from Part1 center
  CurrentAngle  -- current rotation (if only rotating on one axis)
  MaxVelocity   -- how fast the joint can rotate
  Transform     -- current transform applied by animation system

PATTERN 1 — Custom NPC rig (robot arm):
\`\`\`lua
local function buildRobotArm(parent, origin)
    -- Upper arm
    local upperArm = Instance.new("Part")
    upperArm.Name = "UpperArm"
    upperArm.Size = Vector3.new(1, 4, 1)
    upperArm.Material = Enum.Material.Metal
    upperArm.Anchored = false
    upperArm.Parent = parent

    -- Lower arm
    local lowerArm = Instance.new("Part")
    lowerArm.Name = "LowerArm"
    lowerArm.Size = Vector3.new(1, 3, 1)
    lowerArm.Material = Enum.Material.Metal
    lowerArm.Anchored = false
    lowerArm.Parent = parent

    -- Shoulder joint (elbow between base and upper arm)
    local shoulder = Instance.new("Motor6D")
    shoulder.Name = "Shoulder"
    shoulder.Part0 = origin         -- the torso/base
    shoulder.Part1 = upperArm
    shoulder.C0 = CFrame.new(0, 0, 0)         -- offset from torso
    shoulder.C1 = CFrame.new(0, 2, 0)         -- offset from top of upper arm
    shoulder.Parent = upperArm

    -- Elbow joint
    local elbow = Instance.new("Motor6D")
    elbow.Name = "Elbow"
    elbow.Part0 = upperArm
    elbow.Part1 = lowerArm
    elbow.C0 = CFrame.new(0, -2, 0)           -- bottom of upper arm
    elbow.C1 = CFrame.new(0, 1.5, 0)          -- top of lower arm
    elbow.Parent = lowerArm

    return shoulder, elbow
end
\`\`\`

PATTERN 2 — Animate a Motor6D via script (no keyframes):
\`\`\`lua
local RunService = game:GetService("RunService")

local elbow = workspace.Robot.LowerArm.Elbow  -- Motor6D

-- Swing the elbow back and forth
local t = 0
RunService.Heartbeat:Connect(function(dt)
    t = t + dt
    local angle = math.sin(t * 2) * math.rad(45)  -- ±45 degrees
    elbow.Transform = CFrame.Angles(angle, 0, 0)
end)
\`\`\`

=== SCREENGUI — PLAYER HUD AND MENUS ===

ScreenGui lives in PlayerGui (client only). It renders flat UI on screen.

KEY PROPERTIES:
  ResetOnSpawn        -- bool, destroy/recreate on respawn (usually false for HUD)
  ZIndexBehavior      -- Sibling or Global (Sibling recommended)
  IgnoreGuiInset      -- bool, true = fullscreen (no topbar offset)
  DisplayOrder        -- layering between multiple ScreenGuis

PATTERN — Health bar HUD:
\`\`\`lua
-- LocalScript in StarterPlayerScripts
local Players = game:GetService("Players")
local player = Players.LocalPlayer

local screenGui = Instance.new("ScreenGui")
screenGui.Name = "HealthHUD"
screenGui.ResetOnSpawn = false
screenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
screenGui.Parent = player.PlayerGui

-- Background bar
local bgBar = Instance.new("Frame")
bgBar.Size = UDim2.new(0.3, 0, 0, 20)
bgBar.Position = UDim2.new(0.35, 0, 0.9, 0)
bgBar.BackgroundColor3 = Color3.fromRGB(50, 50, 50)
bgBar.BorderSizePixel = 0
bgBar.Parent = screenGui

-- Health fill
local healthBar = Instance.new("Frame")
healthBar.Size = UDim2.fromScale(1, 1)
healthBar.BackgroundColor3 = Color3.fromRGB(50, 220, 50)
healthBar.BorderSizePixel = 0
healthBar.Parent = bgBar

-- Label
local label = Instance.new("TextLabel")
label.Size = UDim2.fromScale(1, 1)
label.BackgroundTransparency = 1
label.TextColor3 = Color3.new(1, 1, 1)
label.Text = "100 / 100"
label.Font = Enum.Font.GothamBold
label.TextScaled = true
label.Parent = bgBar

-- Update when character spawns
player.CharacterAdded:Connect(function(character)
    local humanoid = character:WaitForChild("Humanoid")

    local function updateHealth()
        local pct = humanoid.Health / humanoid.MaxHealth
        healthBar.Size = UDim2.fromScale(math.clamp(pct, 0, 1), 1)
        healthBar.BackgroundColor3 = Color3.fromRGB(
            math.floor((1 - pct) * 220),
            math.floor(pct * 220),
            50
        )
        label.Text = string.format("%d / %d", math.floor(humanoid.Health), humanoid.MaxHealth)
    end

    humanoid.HealthChanged:Connect(updateHealth)
    updateHealth()
end)
\`\`\`

=== BILLBOARDGUI — FLOATING 3D LABELS (health bars, nametags) ===

BillboardGui parents to a Part (or Attachment) and always faces the camera.
Perfect for: floating health bars over NPCs, nametag labels, waypoint markers.

KEY PROPERTIES:
  Adornee           -- the Part/Attachment it's positioned on
  Size              -- UDim2 in studs (not pixels!)
  StudsOffset       -- Vector3 offset from adornee in world space
  AlwaysOnTop       -- bool, render through walls
  MaxDistance       -- hide beyond this distance (0 = infinite)
  LightInfluence    -- 0-1 how much lighting affects it

PATTERN 1 — Floating health bar over NPC:
\`\`\`lua
local function addHealthBar(character)
    local humanoid = character:FindFirstChildOfClass("Humanoid")
    local hrp = character:FindFirstChild("HumanoidRootPart")
    if not humanoid or not hrp then return end

    local billboard = Instance.new("BillboardGui")
    billboard.Size = UDim2.new(4, 0, 0.5, 0)  -- 4 studs wide, 0.5 studs tall
    billboard.StudsOffset = Vector3.new(0, 3, 0)  -- float 3 studs above HRP
    billboard.AlwaysOnTop = false
    billboard.MaxDistance = 50
    billboard.Adornee = hrp
    billboard.Parent = character

    -- Background
    local bg = Instance.new("Frame")
    bg.Size = UDim2.fromScale(1, 1)
    bg.BackgroundColor3 = Color3.fromRGB(20, 20, 20)
    bg.BackgroundTransparency = 0.3
    bg.BorderSizePixel = 0
    bg.Parent = billboard

    -- Fill
    local fill = Instance.new("Frame")
    fill.Size = UDim2.fromScale(1, 1)
    fill.BackgroundColor3 = Color3.fromRGB(255, 80, 80)
    fill.BorderSizePixel = 0
    fill.Parent = bg

    -- Name label
    local name = Instance.new("TextLabel")
    name.Size = UDim2.new(1, 0, 0, 0)
    name.Position = UDim2.new(0, 0, -1.5, 0)
    name.BackgroundTransparency = 1
    name.TextColor3 = Color3.new(1, 1, 1)
    name.Text = character.Name
    name.Font = Enum.Font.GothamBold
    name.TextScaled = true
    name.Parent = billboard

    humanoid.HealthChanged:Connect(function(health)
        local pct = math.clamp(health / humanoid.MaxHealth, 0, 1)
        fill.Size = UDim2.fromScale(pct, 1)
    end)
end
\`\`\`

PATTERN 2 — Waypoint marker floating above a part:
\`\`\`lua
local function createWaypoint(part, labelText)
    local billboard = Instance.new("BillboardGui")
    billboard.Size = UDim2.new(3, 0, 1, 0)
    billboard.StudsOffset = Vector3.new(0, 5, 0)
    billboard.AlwaysOnTop = true
    billboard.MaxDistance = 100
    billboard.Adornee = part
    billboard.Parent = part

    -- Arrow icon
    local arrow = Instance.new("ImageLabel")
    arrow.Size = UDim2.new(0, 40, 0, 40)
    arrow.Position = UDim2.new(0.5, -20, 0, -45)
    arrow.BackgroundTransparency = 1
    arrow.Image = "rbxassetid://6026568247"  -- arrow icon
    arrow.Parent = billboard

    local label = Instance.new("TextLabel")
    label.Size = UDim2.fromScale(1, 1)
    label.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
    label.BackgroundTransparency = 0.2
    label.TextColor3 = Color3.fromRGB(255, 215, 0)
    label.Text = labelText
    label.Font = Enum.Font.GothamBold
    label.TextScaled = true
    label.Parent = billboard

    return billboard
end

createWaypoint(workspace.QuestGiver, "Quest Giver")
createWaypoint(workspace.Shop, "Shop")
\`\`\`

=== SURFACEGUI — IN-WORLD SIGNS AND SCREENS ===

SurfaceGui renders on the flat face of a Part. Like stickers on parts.
Perfect for: shop signs, information boards, computer screens, scoreboards.

KEY PROPERTIES:
  Adornee       -- the Part it's on
  Face          -- which face: Front, Back, Top, etc.
  SizingMode    -- PixelsPerStud or Fixed
  PixelsPerStud -- resolution (default 50)
  AlwaysOnTop   -- bool

PATTERN 1 — Shop sign on a wall:
\`\`\`lua
local signPart = workspace.Shop.SignBoard  -- flat part as sign

local surfaceGui = Instance.new("SurfaceGui")
surfaceGui.Adornee = signPart
surfaceGui.Face = Enum.NormalId.Front
surfaceGui.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
surfaceGui.PixelsPerStud = 50
surfaceGui.Parent = signPart

-- Background
local bg = Instance.new("Frame")
bg.Size = UDim2.fromScale(1, 1)
bg.BackgroundColor3 = Color3.fromRGB(15, 15, 30)
bg.Parent = surfaceGui

-- Title
local title = Instance.new("TextLabel")
title.Size = UDim2.new(1, 0, 0.4, 0)
title.BackgroundTransparency = 1
title.TextColor3 = Color3.fromRGB(212, 175, 55)
title.Text = "WEAPON SHOP"
title.Font = Enum.Font.GothamBlack
title.TextScaled = true
title.Parent = bg

-- Subtitle
local sub = Instance.new("TextLabel")
sub.Size = UDim2.new(1, 0, 0.3, 0)
sub.Position = UDim2.fromScale(0, 0.45)
sub.BackgroundTransparency = 1
sub.TextColor3 = Color3.new(1, 1, 1)
sub.Text = "Best prices in the land!"
sub.Font = Enum.Font.Gotham
sub.TextScaled = true
sub.Parent = bg
\`\`\`

PATTERN 2 — Live scoreboard on a wall part:
\`\`\`lua
-- Script (server updates SurfaceGui which replicates to clients)
local Players = game:GetService("Players")

local board = workspace.Arena.Scoreboard
local surfaceGui = Instance.new("SurfaceGui")
surfaceGui.Adornee = board
surfaceGui.Face = Enum.NormalId.Front
surfaceGui.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
surfaceGui.PixelsPerStud = 25
surfaceGui.Parent = board

local listFrame = Instance.new("Frame")
listFrame.Size = UDim2.fromScale(1, 1)
listFrame.BackgroundColor3 = Color3.fromRGB(10, 10, 20)
listFrame.Parent = surfaceGui

local layout = Instance.new("UIListLayout")
layout.SortOrder = Enum.SortOrder.LayoutOrder
layout.Parent = listFrame

local function updateScoreboard()
    -- Clear old entries
    for _, child in ipairs(listFrame:GetChildren()) do
        if child:IsA("TextLabel") then child:Destroy() end
    end

    -- Sort players by kills
    local sorted = Players:GetPlayers()
    table.sort(sorted, function(a, b)
        local ak = a.leaderstats and a.leaderstats.Kills and a.leaderstats.Kills.Value or 0
        local bk = b.leaderstats and b.leaderstats.Kills and b.leaderstats.Kills.Value or 0
        return ak > bk
    end)

    for i, player in ipairs(sorted) do
        local kills = player.leaderstats and player.leaderstats.Kills and player.leaderstats.Kills.Value or 0
        local row = Instance.new("TextLabel")
        row.Size = UDim2.new(1, 0, 0, 40)
        row.BackgroundTransparency = i % 2 == 0 and 0.8 or 0.6
        row.BackgroundColor3 = Color3.fromRGB(20, 20, 40)
        row.TextColor3 = Color3.new(1, 1, 1)
        row.Text = string.format("#%d  %s  —  %d kills", i, player.Name, kills)
        row.Font = Enum.Font.Gotham
        row.TextScaled = true
        row.LayoutOrder = i
        row.Parent = listFrame
    end
end

-- Update every 10 seconds
task.spawn(function()
    while true do
        updateScoreboard()
        task.wait(10)
    end
end)
\`\`\`

=== FOLDER — ORGANIZATION CONTAINER ===

Folder is a lightweight container. No physics, no rendering — just organization.
Use inside Workspace, ServerStorage, ReplicatedStorage for clean hierarchies.

\`\`\`lua
-- Organize game objects into folders
local function organizeWorkspace()
    local folders = {"Enemies", "Props", "Checkpoints", "Spawns", "Zones"}
    local created = {}

    for _, name in ipairs(folders) do
        local existing = workspace:FindFirstChild(name)
        if existing and existing:IsA("Folder") then
            created[name] = existing
        else
            local folder = Instance.new("Folder")
            folder.Name = name
            folder.Parent = workspace
            created[name] = folder
        end
    end

    return created
end

local folders = organizeWorkspace()

-- Use folders to scope CollectionService searches faster
local function getEnemiesInFolder()
    return folders.Enemies:GetChildren()
end

-- Store RemoteEvents in ReplicatedStorage/Remotes folder
local function getOrCreateFolder(parent, name)
    return parent:FindFirstChild(name) or (function()
        local f = Instance.new("Folder")
        f.Name = name
        f.Parent = parent
        return f
    end)()
end

local remotes = getOrCreateFolder(game.ReplicatedStorage, "Remotes")
\`\`\`
`;
