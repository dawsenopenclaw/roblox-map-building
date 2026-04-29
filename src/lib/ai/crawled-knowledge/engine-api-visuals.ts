// Roblox Engine API — Visuals, Effects & Physics Constraints
// Crawled from create.roblox.com/docs/reference/engine — Apr 29 2026
// Contains: ProximityPrompt, ParticleEmitter, PointLight, Atmosphere,
//           VehicleSeat, UICorner, UIStroke, UIListLayout, Sound,
//           Beam, Trail, LinearVelocity, AlignPosition

export const ENGINE_API_VISUALS = `
=== ProximityPrompt ===
Displays an interaction prompt when a player is near an object.
Parent to BasePart, Attachment, or Model.

PROPERTIES:
  ActionText: string               -- Action label (e.g. "Open", "Pick Up")
  ObjectText: string               -- Object label (optional, e.g. "Chest")
  KeyboardKeyCode: Enum.KeyCode    -- Default: Enum.KeyCode.E
  GamepadKeyCode: Enum.KeyCode     -- Default: Enum.KeyCode.ButtonX
  HoldDuration: number             -- Seconds to hold (0 = instant tap)
  MaxActivationDistance: number    -- Max studs for prompt to show
  Enabled: boolean                 -- Show/hide the prompt
  RequiresLineOfSight: boolean     -- Hide if obstructed
  Style: Enum.ProximityPromptStyle -- Default or Custom
  UIOffset: Vector2                -- Pixel offset for prompt position
  ClickablePrompt: boolean         -- Activate via mouse click/screen tap

EVENTS:
  prompt.Triggered:Connect(function(player) end)        -- action completed
  prompt.TriggerEnded:Connect(function(player) end)     -- input released
  prompt.PromptShown:Connect(function(inputType) end)   -- became visible
  prompt.PromptHidden:Connect(function() end)
  prompt.PromptButtonHoldBegan:Connect(function(player) end)
  prompt.PromptButtonHoldEnded:Connect(function(player) end)

COMMON PATTERNS:
  -- Simple interact (chest, door, NPC)
  local prompt = Instance.new("ProximityPrompt")
  prompt.ActionText = "Open"
  prompt.ObjectText = "Chest"
  prompt.HoldDuration = 0
  prompt.MaxActivationDistance = 10
  prompt.Parent = chestPart

  prompt.Triggered:Connect(function(player)
    openChest(player)
    prompt.Enabled = false
  end)

  -- Hold to interact (e.g. "Hold to Plant")
  local plantPrompt = Instance.new("ProximityPrompt")
  plantPrompt.ActionText = "Plant"
  plantPrompt.HoldDuration = 2
  plantPrompt.Triggered:Connect(function(player)
    plantSeed(player)
  end)
  plantPrompt.Parent = gardenPlot

=== ParticleEmitter ===
Emits customizable 2D particles. Parent to BasePart or Attachment.

PROPERTIES:
  Enabled: boolean               -- Continuous emission on/off
  Rate: number                   -- Particles per second
  Lifetime: NumberRange          -- Min/max particle lifespan (seconds)
  Speed: NumberRange             -- Emission speed range
  Size: NumberSequence           -- Size over particle lifetime
  Color: ColorSequence           -- Color over lifetime
  Transparency: NumberSequence   -- Opacity over lifetime
  Rotation: NumberRange          -- Initial rotation range (degrees)
  RotSpeed: NumberRange          -- Spin speed range (degrees/sec)
  SpreadAngle: Vector2           -- X/Y spread cone (degrees)
  EmissionDirection: Enum.NormalId -- Face direction (Top|Bottom|Front|Back|Left|Right)
  Acceleration: Vector3          -- Force on particles (e.g. gravity Vector3(0,-10,0))
  Drag: number                   -- Air resistance on particles
  LightEmission: number          -- 0-1; how much particle lights surroundings
  LightInfluence: number         -- 0-1; how much scene lighting affects particle
  Texture: string                -- Asset ID for particle image
  LockedToPart: boolean          -- Particles move with parent
  Orientation: Enum.ParticleOrientation  -- FacingCamera|VelocityParallel|etc.
  TimeScale: number              -- Animation speed multiplier
  ZOffset: number                -- Depth sorting offset
  Brightness: number             -- Multiplicative color brightness

METHODS:
  emitter:Emit(count: number)    -- Burst emit N particles instantly
  emitter:Clear()                -- Immediately destroy all existing particles

COMMON PATTERNS:
  -- Fire effect
  local fire = Instance.new("ParticleEmitter")
  fire.Texture = "rbxassetid://0"  -- use a flame texture asset
  fire.Rate = 20
  fire.Lifetime = NumberRange.new(1, 2)
  fire.Speed = NumberRange.new(5, 10)
  fire.Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0, Color3.fromRGB(255, 150, 0)),
    ColorSequenceKeypoint.new(1, Color3.fromRGB(255, 50, 0)),
  })
  fire.LightEmission = 0.8
  fire.Parent = firePart

  -- Burst explosion
  local explosion = Instance.new("ParticleEmitter")
  explosion.Enabled = false
  explosion.Parent = part
  explosion:Emit(50)  -- burst 50 particles
  game:GetService("Debris"):AddItem(explosion, 3)

  -- Sparkle trail on item pickup
  local sparkle = Instance.new("ParticleEmitter")
  sparkle.Rate = 15
  sparkle.Lifetime = NumberRange.new(0.5, 1)
  sparkle.SpreadAngle = Vector2.new(45, 45)
  sparkle.Parent = collectiblePart

=== PointLight ===
Emits light spherically from a point. Parent to BasePart or Attachment.

PROPERTIES:
  Range: number        -- Radius of illumination (studs)
  Brightness: number   -- Intensity (default 1)
  Color: Color3        -- Light color
  Enabled: boolean     -- On/off
  Shadows: boolean     -- Cast shadows (performance cost)

SpotLight PROPERTIES (directional cone light):
  Range: number
  Brightness: number
  Color: Color3
  Angle: number        -- Cone half-angle (0-90 degrees)
  Face: Enum.NormalId  -- Direction face (default Front)
  Enabled: boolean
  Shadows: boolean

SurfaceLight PROPERTIES (illuminates from a surface face):
  Range: number
  Brightness: number
  Color: Color3
  Angle: number        -- Spread angle
  Face: Enum.NormalId  -- Which face emits light
  Enabled: boolean
  Shadows: boolean

COMMON PATTERNS:
  -- Glowing orb
  local light = Instance.new("PointLight")
  light.Color = Color3.fromRGB(100, 200, 255)
  light.Brightness = 3
  light.Range = 20
  light.Shadows = true
  light.Parent = glowPart

  -- Flashlight (SpotLight)
  local spot = Instance.new("SpotLight")
  spot.Angle = 45
  spot.Range = 40
  spot.Brightness = 5
  spot.Face = Enum.NormalId.Front
  spot.Parent = flashlightPart

  -- Flickering light
  local RS = game:GetService("RunService")
  RS.Heartbeat:Connect(function()
    light.Brightness = 2 + math.random() * 0.5
  end)

=== Atmosphere ===
Realistic atmospheric scattering. Child of Lighting service.
Instance.new("Atmosphere").Parent = game:GetService("Lighting")

PROPERTIES:
  Density: number    -- Particle concentration; higher = more fog (0-1)
  Offset: number     -- Light transmission balance (0-1)
  Color: Color3      -- Atmosphere hue
  Decay: Color3      -- Hue away from sun
  Glare: number      -- Sun glow intensity (0-1, needs Haze > 0)
  Haze: number       -- Horizon haziness (0-10)

COMMON PATTERNS:
  local Lighting = game:GetService("Lighting")
  local atmos = Instance.new("Atmosphere")
  atmos.Parent = Lighting

  -- Clear day
  atmos.Density = 0.3
  atmos.Haze = 0
  atmos.Glare = 0
  atmos.Color = Color3.fromRGB(199, 199, 199)

  -- Sunset/desert
  atmos.Density = 0.4
  atmos.Haze = 2
  atmos.Glare = 0.5
  atmos.Color = Color3.fromRGB(255, 150, 80)
  atmos.Decay = Color3.fromRGB(80, 40, 20)

  -- Foggy/spooky
  atmos.Density = 0.8
  atmos.Haze = 5
  atmos.Glare = 0
  atmos.Color = Color3.fromRGB(150, 160, 150)

=== VehicleSeat ===
Welds players to a seat and routes WASD/thumbstick to connected motors.
Inherits from BasePart.

PROPERTIES:
  Disabled: boolean       -- Seat inactive (no one can sit)
  HeadsUpDisplay: boolean -- Show speedometer
  MaxSpeed: number        -- Max vehicle speed (studs/s)
  Occupant: Humanoid      -- Current seated humanoid (read-only, nil if empty)
  Throttle: number        -- -1 (back) | 0 | 1 (forward), deprecated
  ThrottleFloat: number   -- Smooth -1 to 1 throttle input
  Steer: number           -- -1 (left) | 0 | 1 (right), deprecated
  SteerFloat: number      -- Smooth -1 to 1 steer input
  Torque: number          -- Acceleration force
  TurnSpeed: number       -- Turning speed

METHODS:
  vehicleSeat:Sit(humanoid: Humanoid)  -- Force humanoid into seat

COMMON PATTERNS:
  -- Monitor seat input for custom vehicle physics
  game:GetService("RunService").Heartbeat:Connect(function(dt)
    local throttle = vehicleSeat.ThrottleFloat
    local steer = vehicleSeat.SteerFloat
    -- apply forces to wheels/constraints based on throttle/steer
    applyWheelForces(throttle, steer)
  end)

  -- Detect player entering/leaving
  vehicleSeat:GetPropertyChangedSignal("Occupant"):Connect(function()
    if vehicleSeat.Occupant then
      print(vehicleSeat.Occupant.Parent.Name, "entered vehicle")
    else
      print("vehicle empty")
    end
  end)

=== UICorner ===
Rounds the corners of its parent GuiObject.
Cannot apply to ScrollingFrame.

PROPERTIES:
  CornerRadius: UDim   -- UDim.new(scale, offset)
                       -- scale=0.5 → pill shape; offset=8 → 8px radius

COMMON PATTERNS:
  local corner = Instance.new("UICorner")
  corner.CornerRadius = UDim.new(0, 8)   -- 8px radius
  corner.Parent = frame

  -- Pill shape button
  local pill = Instance.new("UICorner")
  pill.CornerRadius = UDim.new(0.5, 0)   -- 50% = pill
  pill.Parent = button

=== UIStroke ===
Adds an outline/border to UI objects or text.

PROPERTIES:
  Color: Color3              -- Stroke color
  Thickness: number          -- Stroke width in pixels
  Transparency: number       -- 0=opaque, 1=invisible
  Enabled: boolean
  ApplyStrokeMode: Enum.ApplyStrokeMode  -- Contextual (text) | Border (frame)
  LineJoinMode: Enum.LineJoinMode        -- Round | Bevel | Miter
  ZIndex: number             -- Render order

COMMON PATTERNS:
  -- Text outline for readability
  local stroke = Instance.new("UIStroke")
  stroke.Color = Color3.fromRGB(0, 0, 0)
  stroke.Thickness = 2
  stroke.ApplyStrokeMode = Enum.ApplyStrokeMode.Contextual
  stroke.Parent = textLabel

  -- Frame border
  local border = Instance.new("UIStroke")
  border.Color = Color3.fromRGB(255, 215, 0)  -- gold
  border.Thickness = 3
  border.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
  border.Parent = frame

=== UIListLayout ===
Auto-arranges sibling UI elements in a list (row or column).

PROPERTIES:
  FillDirection: Enum.FillDirection      -- Horizontal | Vertical
  Padding: UDim                          -- Gap between elements
  SortOrder: Enum.SortOrder              -- Name | LayoutOrder
  HorizontalAlignment: Enum.HorizontalAlignment  -- Left|Center|Right
  VerticalAlignment: Enum.VerticalAlignment      -- Top|Center|Bottom
  Wraps: boolean                         -- Wrap to next line if overflow
  AbsoluteContentSize: Vector2           -- Read-only: total size used

COMMON PATTERNS:
  -- Vertical button list
  local layout = Instance.new("UIListLayout")
  layout.FillDirection = Enum.FillDirection.Vertical
  layout.Padding = UDim.new(0, 8)
  layout.HorizontalAlignment = Enum.HorizontalAlignment.Center
  layout.SortOrder = Enum.SortOrder.LayoutOrder
  layout.Parent = buttonFrame

  -- Horizontal icon bar
  local hLayout = Instance.new("UIListLayout")
  hLayout.FillDirection = Enum.FillDirection.Horizontal
  hLayout.Padding = UDim.new(0, 4)
  hLayout.VerticalAlignment = Enum.VerticalAlignment.Center
  hLayout.Parent = iconBar

  -- Auto-size container to content
  local UIListLayout = layout
  frame.Size = UDim2.new(1, 0, 0, UIListLayout.AbsoluteContentSize.Y)
  UIListLayout:GetPropertyChangedSignal("AbsoluteContentSize"):Connect(function()
    frame.Size = UDim2.new(1, 0, 0, UIListLayout.AbsoluteContentSize.Y)
  end)

=== Sound ===
Audio playback. Parent to BasePart/Attachment for 3D spatial audio, or SoundService/workspace for global.

PROPERTIES:
  SoundId: string          -- Asset ID: "rbxassetid://123456789"
  Volume: number           -- 0-10 (default 0.5)
  Looped: boolean          -- Repeat on end
  Playing: boolean         -- Set true to play, false to stop
  PlaybackSpeed: number    -- 1=normal, 2=double speed, 0.5=half
  TimePosition: number     -- Seek position in seconds (read/write)
  TimeLength: number       -- Total duration (read-only)
  IsPlaying: boolean       -- Current playing state (read-only)
  IsLoaded: boolean        -- Asset loaded (read-only)
  PlaybackLoudness: number -- Current volume amplitude 0-1000 (read-only)
  RollOffMode: Enum.RollOffMode       -- InverseTapered (default) | Inverse | Linear | LinearSquare
  RollOffMinDistance: number          -- Distance where attenuation starts
  RollOffMaxDistance: number          -- Max audible distance

METHODS:
  sound:Play()     -- start from TimePosition
  sound:Stop()     -- stop + reset TimePosition to 0
  sound:Pause()    -- pause (preserves TimePosition)
  sound:Resume()   -- resume from paused position

EVENTS:
  sound.Ended:Connect(function() end)        -- finished playing (non-looped)
  sound.Loaded:Connect(function() end)       -- asset ready
  sound.Played:Connect(function() end)
  sound.Stopped:Connect(function() end)
  sound.DidLoop:Connect(function(id, count) end)

COMMON PATTERNS:
  -- Background music (global)
  local bgm = Instance.new("Sound")
  bgm.SoundId = "rbxassetid://123456789"
  bgm.Looped = true
  bgm.Volume = 0.3
  bgm.Parent = workspace
  bgm:Play()

  -- 3D footstep sound
  local step = Instance.new("Sound")
  step.SoundId = "rbxassetid://987654321"
  step.Volume = 0.8
  step.RollOffMaxDistance = 30
  step.Parent = humanoidRootPart
  step:Play()

  -- Dynamic sound on event
  local clickSfx = Instance.new("Sound")
  clickSfx.SoundId = "rbxassetid://111111111"
  clickSfx.Parent = game:GetService("SoundService")
  button.Activated:Connect(function()
    clickSfx:Play()
  end)

  -- Check loaded before play
  if not sound.IsLoaded then sound.Loaded:Wait() end
  sound:Play()

=== Beam ===
Draws a textured line between two Attachments.
Both Attachment0 and Attachment1 must be set. Parent to Workspace.

PROPERTIES:
  Attachment0: Attachment     -- Start attachment
  Attachment1: Attachment     -- End attachment
  Enabled: boolean
  Texture: string             -- Asset ID for texture
  Color: ColorSequence        -- Color along beam length
  Transparency: NumberSequence -- Opacity along length
  Width0: number              -- Width at Attachment0 (studs)
  Width1: number              -- Width at Attachment1 (studs)
  LightEmission: number       -- 0-1 glow
  LightInfluence: number      -- 0-1 scene lighting influence
  FaceCamera: boolean         -- Always face camera (billboard-like)
  Segments: number            -- Resolution (higher = smoother curves)
  CurveSize0: number          -- Curve tangent at start
  CurveSize1: number          -- Curve tangent at end
  TextureSpeed: number        -- Texture scroll speed
  TextureLength: number       -- Texture repeat length
  TextureMode: Enum.TextureMode  -- Stretch|Wrap|Static
  ZOffset: number
  Brightness: number

METHODS:
  beam:SetTextureOffset(offset: number)  -- manually set texture scroll position

COMMON PATTERNS:
  -- Laser beam
  local a0 = Instance.new("Attachment", gunBarrel)
  local a1 = Instance.new("Attachment", targetPart)
  local beam = Instance.new("Beam")
  beam.Attachment0 = a0
  beam.Attachment1 = a1
  beam.Color = ColorSequence.new(Color3.fromRGB(255, 0, 0))
  beam.Width0 = 0.1
  beam.Width1 = 0.1
  beam.LightEmission = 1
  beam.FaceCamera = true
  beam.Parent = workspace

  -- Chain/rope visual
  local rope = Instance.new("Beam")
  rope.Attachment0 = topAttachment
  rope.Attachment1 = bottomAttachment
  rope.Width0 = 0.3
  rope.Width1 = 0.3
  rope.CurveSize0 = 2
  rope.CurveSize1 = -2
  rope.Segments = 10
  rope.Texture = "rbxassetid://chainTexture"
  rope.Parent = workspace

=== Trail ===
Draws a texture trail behind a moving object (between two Attachments).

PROPERTIES:
  Attachment0: Attachment     -- First edge attachment
  Attachment1: Attachment     -- Second edge attachment
  Enabled: boolean
  Lifetime: number            -- Seconds trail segments persist
  Color: ColorSequence        -- Color over trail lifetime
  Transparency: NumberSequence -- Opacity over trail lifetime
  WidthScale: NumberSequence  -- Width scaling over lifetime
  Texture: string             -- Asset ID
  TextureLength: number       -- UV repeat length
  TextureMode: Enum.TextureMode
  LightEmission: number       -- 0-1 glow
  LightInfluence: number
  MinLength: number           -- Minimum stud distance before new segment
  MaxLength: number           -- Max total trail length (0=unlimited)
  FaceCamera: boolean
  Brightness: number

METHODS:
  trail:Clear()  -- immediately erase all trail segments

COMMON PATTERNS:
  -- Sword swing trail
  local bladeTip = Instance.new("Attachment", blade)
  bladeTip.Position = Vector3.new(0, 2, 0)
  local bladeBase = Instance.new("Attachment", blade)
  bladeBase.Position = Vector3.new(0, 0, 0)

  local trail = Instance.new("Trail")
  trail.Attachment0 = bladeTip
  trail.Attachment1 = bladeBase
  trail.Lifetime = 0.2
  trail.Color = ColorSequence.new(Color3.fromRGB(200, 200, 255))
  trail.WidthScale = NumberSequence.new({
    NumberSequenceKeypoint.new(0, 1),
    NumberSequenceKeypoint.new(1, 0)
  })
  trail.LightEmission = 0.5
  trail.Parent = blade

  -- Enable only during swing
  trail.Enabled = false
  -- on swing start:
  trail.Enabled = true
  -- on swing end:
  task.delay(0.3, function() trail.Enabled = false; trail:Clear() end)

=== LinearVelocity ===
Constraint that applies force to maintain constant linear velocity.
Better than setting AssemblyLinearVelocity directly (physics-based).
Parent to a BasePart alongside Attachment0.

PROPERTIES:
  Attachment0: Attachment            -- Part to apply force to
  Attachment1: Attachment?           -- Optional second attachment (relative mode)
  Enabled: boolean
  VelocityConstraintMode: Enum.VelocityConstraintMode  -- Vector|Line|Plane
  VectorVelocity: Vector3            -- Target velocity (Vector mode)
  LineVelocity: number               -- Target speed along LineDirection
  LineDirection: Vector3             -- Direction for Line mode
  PlaneVelocity: Vector2             -- 2D velocity in Plane mode
  RelativeTo: Enum.ActuatorRelativeTo  -- World|Attachment0|Attachment1
  ForceLimitsEnabled: boolean        -- Cap maximum force
  MaxForce: number                   -- Max force scalar
  MaxAxesForce: Vector3              -- Per-axis force limits
  ReactionForceEnabled: boolean      -- Apply equal/opposite force to Attachment1

METHODS:
  constraint:GetDebugAppliedForce(bodyId) → Vector3
  constraint:GetDebugAppliedTorque(bodyId) → Vector3

COMMON PATTERNS:
  -- Constant upward float
  local att = Instance.new("Attachment")
  att.Parent = floatingPart

  local lv = Instance.new("LinearVelocity")
  lv.Attachment0 = att
  lv.VelocityConstraintMode = Enum.VelocityConstraintMode.Vector
  lv.VectorVelocity = Vector3.new(0, 5, 0)  -- float upward at 5 studs/s
  lv.MaxForce = 1000
  lv.ForceLimitsEnabled = true
  lv.RelativeTo = Enum.ActuatorRelativeTo.World
  lv.Parent = floatingPart

  -- Hovering platform with slight drift
  lv.VectorVelocity = Vector3.new(math.sin(tick()) * 2, 0, 0)

=== AlignPosition ===
Constraint that moves Attachment0 toward a goal position/Attachment1.
Smoother than Tweening CFrame for physics objects.

PROPERTIES:
  Attachment0: Attachment    -- Part being moved
  Attachment1: Attachment?   -- Optional target attachment
  Enabled: boolean
  Active: boolean            -- Whether constraint is applying force (read-only)
  Mode: Enum.PositionAlignmentMode  -- OneAttachment|TwoAttachment
  Position: Vector3          -- Goal position (OneAttachment mode)
  Responsiveness: number     -- How quickly it reaches goal (0-200, default 10)
  MaxForce: number           -- Force cap
  MaxVelocity: number        -- Max speed toward goal
  RigidityEnabled: boolean   -- If true, instantly teleports (no spring)
  ReactionForceEnabled: boolean   -- Apply reaction to Attachment1's part
  ForceLimitMode: Enum.ForceLimitMode
  ApplyAtCenterOfMass: boolean

COMMON PATTERNS:
  -- Smooth follow (e.g. hovering object follows player)
  local goalAtt = Instance.new("Attachment")
  goalAtt.Parent = workspace.Terrain  -- world-space goal
  goalAtt.WorldPosition = targetPosition

  local partAtt = Instance.new("Attachment")
  partAtt.Parent = floater

  local align = Instance.new("AlignPosition")
  align.Attachment0 = partAtt
  align.Attachment1 = goalAtt
  align.Responsiveness = 25
  align.MaxForce = 5000
  align.MaxVelocity = 20
  align.Mode = Enum.PositionAlignmentMode.TwoAttachment
  align.Parent = floater

  -- Update goal position to follow player
  game:GetService("RunService").Heartbeat:Connect(function()
    goalAtt.WorldPosition = player.Character.HumanoidRootPart.Position + Vector3.new(0, 5, 0)
  end)

  -- Magnet / attraction to point
  local magnet = Instance.new("AlignPosition")
  magnet.Attachment0 = metalPartAtt
  magnet.Position = magnetPosition  -- OneAttachment mode
  magnet.Mode = Enum.PositionAlignmentMode.OneAttachment
  magnet.Responsiveness = 50
  magnet.MaxForce = 2000
  magnet.Parent = metalPart
`;
