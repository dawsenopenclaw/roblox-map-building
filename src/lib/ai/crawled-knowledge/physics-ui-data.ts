// Crawled from Roblox Creator Hub — Apr 29 2026
// Sources: /docs/physics, /docs/physics/mechanical-constraints,
//          /docs/ui, /docs/ui/position-and-size,
//          /docs/cloud-services/data-stores

export const PHYSICS_UI_DATA = `
=== PHYSICS ===

Roblox uses a rigid body physics engine.
BaseParts are physical unless Anchored = true.

--- ASSEMBLIES ---
An assembly = one or more BaseParts connected by rigid joints/constraints.
The whole assembly moves as one physical unit.
Parts connected by WeldConstraint or Motor6D are the same assembly.

Setting initial velocity (server Script):
  local part = workspace.MyPart
  part.AssemblyLinearVelocity = Vector3.new(0, 50, 0)
  part.AssemblyAngularVelocity = Vector3.new(0, math.pi, 0)

--- MECHANICAL CONSTRAINTS ---
All require Attachment points on parts, except WeldConstraint & NoCollisionConstraint.
Add Attachments: Insert Attachment into Part, position it.

CONSTRAINT TYPES:
  WeldConstraint        → locks two parts together (no Attachments needed)
                          part1.WeldConstraint or use WeldConstraint directly

  HingeConstraint       → rotate around one axis (doors, wheels)
                          Properties: LimitsEnabled, LowerAngle, UpperAngle
                          Motor mode: ActuatorType = Motor, MotorMaxTorque, AngularVelocity

  SpringConstraint      → spring force between two Attachments
                          Properties: FreeLength, Stiffness, Damping, MinLength, MaxLength

  RopeConstraint        → prevents separation beyond Length, optional winch
                          Properties: Length, WinchEnabled, WinchSpeed, WinchTarget

  RodConstraint         → fixed distance between two Attachments

  PrismaticConstraint   → slide along one axis (elevator, sliding door)
                          Properties: LimitsEnabled, LowerLimit, UpperLimit
                          Motor: ActuatorType = Motor, Velocity, MotorMaxForce

  BallSocketConstraint  → free rotation in socket (shoulder joint)
                          Properties: TwistLimitsEnabled, UpperAngle

  CylindricalConstraint → slide + rotate (steering column)

  TorsionSpringConstraint → torque spring

  RigidConstraint       → lock two Attachments/Bones together

  PlaneConstraint       → confine to plane

  NoCollisionConstraint → prevent two specific parts from colliding
                          (they still collide with everything else)

  UniversalConstraint   → keep two axes perpendicular (driveshaft)

Code — create WeldConstraint:
  local weld = Instance.new("WeldConstraint")
  weld.Part0 = partA
  weld.Part1 = partB
  weld.Parent = partA

Code — create HingeConstraint for door:
  local hinge = Instance.new("HingeConstraint")
  hinge.Attachment0 = doorFrame:FindFirstChild("HingeAttach")
  hinge.Attachment1 = door:FindFirstChild("HingeAttach")
  hinge.LimitsEnabled = true
  hinge.LowerAngle = -90
  hinge.UpperAngle = 0
  hinge.Parent = doorFrame

--- COLLISIONS ---

Detect collisions:
  part.Touched:Connect(function(otherPart)
    print("Touched by:", otherPart.Name)
  end)
  part.TouchEnded:Connect(function(otherPart)
    print("No longer touching:", otherPart.Name)
  end)

NOTE: Touched fires even if CanCollide = false (it's a proximity event).
      CanCollide only controls physical collision response.

Collision filtering (PhysicsService):
  local PS = game:GetService("PhysicsService")
  PS:RegisterCollisionGroup("Players")
  PS:RegisterCollisionGroup("Enemies")
  PS:CollisionGroupSetCollidable("Players", "Players", false)  -- players don't collide with each other

  -- Assign part to group:
  part.CollisionGroup = "Players"

Part-to-part filtering:
  local nc = Instance.new("NoCollisionConstraint")
  nc.Part0 = partA
  nc.Part1 = partB
  nc.Parent = partA

--- NETWORK OWNERSHIP ---
Server owns anchored parts and parts with no nearby players.
Client owns unanchored parts near their character.

Manually assign:
  part:SetNetworkOwner(player)    -- assign to specific player
  part:SetNetworkOwner(nil)       -- assign to server
  part:SetNetworkOwnershipAuto()  -- let engine decide

Use SetNetworkOwner(driverPlayer) for vehicles.
Use SetNetworkOwner(nil) for important server-controlled objects.

--- PHYSICS PROPERTIES ---
  part.Anchored = true/false
  part.CanCollide = true/false
  part.CanTouch = true/false        -- disable Touched event for performance
  part.CanQuery = true/false        -- disable raycasts hitting this part
  part.Massless = true/false        -- zero mass (attached accessories)
  part.Mass                          -- read-only
  part.CustomPhysicalProperties = PhysicalProperties.new(density, friction, elasticity)

Raycasting:
  local raycastParams = RaycastParams.new()
  raycastParams.FilterType = Enum.RaycastFilterType.Exclude
  raycastParams.FilterDescendantsInstances = {character}

  local result = workspace:Raycast(origin, direction * 100, raycastParams)
  if result then
    print("Hit:", result.Instance.Name)
    print("Position:", result.Position)
    print("Normal:", result.Normal)
    print("Distance:", result.Distance)
  end

=== USER INTERFACE ===

--- CONTAINERS ---

ScreenGui (on-screen, stores in StarterGui or PlayerGui):
  - All child GuiObjects render on screen
  - Use for HUD, menus, inventory, shop

SurfaceGui (in-world, parented to a BasePart):
  - Renders on a face of a 3D part
  - Good for in-world screens, signs, noticeboards

BillboardGui (in-world, always faces camera):
  - Good for name tags, health bars above NPCs
  - Properties: Size (UDim2), StudsOffset (Vector3), AlwaysOnTop

--- CORE OBJECTS ---

Frame          → container, background rectangle
TextLabel      → display text (non-interactive)
TextButton     → clickable text
ImageLabel     → display image
ImageButton    → clickable image
TextBox        → text input
ScrollingFrame → scrollable container

--- UDIM2 POSITIONING (critical concept) ---

UDim2 = {Scale_X, Offset_X, Scale_Y, Offset_Y}
  Scale: 0.0-1.0, relative to parent size (0.5 = 50% of parent)
  Offset: pixels, absolute pixel offset

Creating UDim2:
  UDim2.new(scaleX, offsetX, scaleY, offsetY)
  UDim2.fromScale(scaleX, scaleY)    -- shorthand, offset = 0
  UDim2.fromOffset(offsetX, offsetY) -- shorthand, scale = 0

Common positions:
  UDim2.fromScale(0.5, 0.5)    -- center of parent
  UDim2.fromScale(0, 0)        -- top-left
  UDim2.fromScale(1, 0)        -- top-right (with AnchorPoint)
  UDim2.fromScale(0, 1)        -- bottom-left
  UDim2.fromScale(1, 1)        -- bottom-right

AnchorPoint (Vector2, 0-1):
  Vector2.new(0, 0)    -- top-left corner of object (default)
  Vector2.new(0.5, 0.5) -- center of object
  Vector2.new(1, 0)    -- top-right corner of object
  Vector2.new(0.5, 1)  -- bottom-center

Example — center a button:
  button.AnchorPoint = Vector2.new(0.5, 0.5)
  button.Position = UDim2.fromScale(0.5, 0.5)
  button.Size = UDim2.new(0, 200, 0, 50)  -- 200x50 pixels

ZIndex: higher = renders on top. Children always above parents by default.

--- CREATING UI FROM SCRIPT ---

  local screenGui = Instance.new("ScreenGui")
  screenGui.Name = "MyUI"
  screenGui.ResetOnSpawn = false
  screenGui.Parent = game.Players.LocalPlayer:WaitForChild("PlayerGui")

  local frame = Instance.new("Frame")
  frame.Size = UDim2.new(0, 300, 0, 200)
  frame.Position = UDim2.fromScale(0.5, 0.5)
  frame.AnchorPoint = Vector2.new(0.5, 0.5)
  frame.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
  frame.BackgroundTransparency = 0.2
  frame.Parent = screenGui

  local label = Instance.new("TextLabel")
  label.Size = UDim2.new(1, 0, 0, 40)
  label.Position = UDim2.fromScale(0, 0)
  label.Text = "Hello World"
  label.TextColor3 = Color3.fromRGB(255, 255, 255)
  label.BackgroundTransparency = 1
  label.Font = Enum.Font.GothamBold
  label.TextScaled = true
  label.Parent = frame

  local btn = Instance.new("TextButton")
  btn.Size = UDim2.new(0, 120, 0, 40)
  btn.Position = UDim2.fromScale(0.5, 0.8)
  btn.AnchorPoint = Vector2.new(0.5, 0.5)
  btn.Text = "Click Me"
  btn.TextColor3 = Color3.fromRGB(255, 255, 255)
  btn.BackgroundColor3 = Color3.fromRGB(0, 120, 255)
  btn.Parent = frame

  btn.MouseButton1Click:Connect(function()
    print("Button clicked!")
  end)

--- LAYOUT STRUCTURES ---

UIListLayout (horizontal/vertical list):
  local list = Instance.new("UIListLayout")
  list.FillDirection = Enum.FillDirection.Vertical
  list.HorizontalAlignment = Enum.HorizontalAlignment.Center
  list.Padding = UDim.new(0, 8)  -- 8px between items
  list.Parent = frame

UIGridLayout (grid of equal cells):
  local grid = Instance.new("UIGridLayout")
  grid.CellSize = UDim2.new(0, 100, 0, 100)
  grid.CellPadding = UDim2.new(0, 8, 0, 8)
  grid.Parent = frame

UIPadding (inner padding):
  local pad = Instance.new("UIPadding")
  pad.PaddingTop = UDim.new(0, 10)
  pad.PaddingBottom = UDim.new(0, 10)
  pad.PaddingLeft = UDim.new(0, 10)
  pad.PaddingRight = UDim.new(0, 10)
  pad.Parent = frame

UICorner (rounded corners):
  local corner = Instance.new("UICorner")
  corner.CornerRadius = UDim.new(0, 8)  -- 8px radius
  corner.Parent = frame

UIStroke (border/outline):
  local stroke = Instance.new("UIStroke")
  stroke.Thickness = 2
  stroke.Color = Color3.fromRGB(255, 255, 255)
  stroke.Parent = frame

UIAspectRatioConstraint (maintain aspect ratio):
  local arc = Instance.new("UIAspectRatioConstraint")
  arc.AspectRatio = 16/9
  arc.Parent = frame

UISizeConstraint (min/max size):
  local sc = Instance.new("UISizeConstraint")
  sc.MinSize = Vector2.new(100, 50)
  sc.MaxSize = Vector2.new(400, 200)
  sc.Parent = frame

UIGradient (color gradient):
  local grad = Instance.new("UIGradient")
  grad.Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0, Color3.fromRGB(255, 0, 0)),
    ColorSequenceKeypoint.new(1, Color3.fromRGB(0, 0, 255)),
  })
  grad.Rotation = 45
  grad.Parent = frame

--- TWEENING UI ---

  local TweenService = game:GetService("TweenService")
  local info = TweenInfo.new(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
  local tween = TweenService:Create(frame, info, {
    Position = UDim2.fromScale(0.5, 0.5),
    BackgroundTransparency = 0
  })
  tween:Play()
  tween.Completed:Connect(function() print("done") end)

TweenInfo params: (time, EasingStyle, EasingDirection, repeatCount, reverses, delayTime)
EasingStyles: Linear, Quad, Cubic, Quart, Quint, Bounce, Elastic, Back, Sine, Exponential, Circular

--- PROXIMITY PROMPTS ---

  local prompt = Instance.new("ProximityPrompt")
  prompt.ActionText = "Open"
  prompt.ObjectText = "Chest"
  prompt.KeyboardKeyCode = Enum.KeyCode.E
  prompt.HoldDuration = 0  -- 0 = instant, >0 = hold-to-activate
  prompt.MaxActivationDistance = 10
  prompt.Parent = part

  prompt.Triggered:Connect(function(player)
    print(player.Name, "activated prompt")
  end)

--- BILLBOARD GUI (health bar above NPC) ---

  local billGui = Instance.new("BillboardGui")
  billGui.Size = UDim2.new(0, 100, 0, 20)
  billGui.StudsOffset = Vector3.new(0, 3, 0)
  billGui.AlwaysOnTop = false
  billGui.Parent = npcRootPart

  local bar = Instance.new("Frame")
  bar.Size = UDim2.fromScale(1, 1)
  bar.BackgroundColor3 = Color3.fromRGB(255, 0, 0)
  bar.Parent = billGui

--- MOBILE / CROSS-PLATFORM TIPS ---
- Avoid placing UI in bottom corners (reserved for joystick + jump)
- Keep interactive buttons near bottom corners for thumb reach
- Use UserInputService.TouchEnabled to detect mobile
- Avoid text under 14pt (ScaledMinTextSize)
- Use TextScaled = true with UISizeConstraint to avoid overflow
- Test with Studio's device emulator

=== DATA STORES ===

DataStoreService lets you persist data between sessions.
SERVER-ONLY — LocalScripts cannot access DataStore.
ALWAYS wrap in pcall.

--- BASIC SETUP ---

  local DataStoreService = game:GetService("DataStoreService")
  local playerStore = DataStoreService:GetDataStore("PlayerData")

--- CRUD OPERATIONS ---

Create/Update (SetAsync):
  local ok, err = pcall(function()
    playerStore:SetAsync("player_" .. userId, { coins = 100, level = 1 })
  end)
  if not ok then warn("SetAsync failed:", err) end

Read (GetAsync):
  local ok, data = pcall(function()
    return playerStore:GetAsync("player_" .. userId)
  end)
  if ok and data then
    print("Coins:", data.coins)
  end

Atomic update (UpdateAsync — preferred for concurrent writes):
  local ok, newData = pcall(function()
    return playerStore:UpdateAsync("player_" .. userId, function(currentData)
      if currentData == nil then
        return { coins = 10, level = 1 }  -- first time
      end
      currentData.coins += 10
      return currentData
      -- return nil to CANCEL the update
    end)
  end)

Increment integer (IncrementAsync):
  local ok, newVal = pcall(function()
    return playerStore:IncrementAsync("player_" .. userId .. "_playtime", 1)
  end)

Remove (RemoveAsync):
  local ok, removedVal = pcall(function()
    return playerStore:RemoveAsync("player_" .. userId)
  end)

--- SET vs UPDATE ---
SetAsync: fast, simple, risk of race condition if two servers write simultaneously
UpdateAsync: reads current value first, then writes — safe for concurrent servers
             callback must be pure (no yields, no task.wait)

--- STANDARD PLAYER DATA PATTERN ---

  local DataStoreService = game:GetService("DataStoreService")
  local Players = game:GetService("Players")
  local store = DataStoreService:GetDataStore("PlayerData_v1")

  local DEFAULT_DATA = { coins = 0, level = 1, xp = 0 }

  local playerData = {}  -- cache in memory

  local function loadData(player)
    local key = "p_" .. player.UserId
    local ok, data = pcall(function()
      return store:GetAsync(key)
    end)
    if ok then
      playerData[player.UserId] = data or table.clone(DEFAULT_DATA)
    else
      warn("Failed to load data for", player.Name, data)
      playerData[player.UserId] = table.clone(DEFAULT_DATA)
    end
  end

  local function saveData(player)
    local key = "p_" .. player.UserId
    local data = playerData[player.UserId]
    if not data then return end
    local ok, err = pcall(function()
      store:SetAsync(key, data)
    end)
    if not ok then warn("Failed to save data for", player.Name, err) end
  end

  Players.PlayerAdded:Connect(loadData)
  Players.PlayerRemoving:Connect(function(player)
    saveData(player)
    playerData[player.UserId] = nil  -- cleanup
  end)

  -- Also save on server close (important!)
  game:BindToClose(function()
    for _, player in Players:GetPlayers() do
      saveData(player)
    end
  end)

--- ORDERED DATA STORE (leaderboards) ---

  local leaderStore = DataStoreService:GetOrderedDataStore("GlobalCoins")

  -- Save score
  pcall(function()
    leaderStore:SetAsync("p_" .. userId, score)
  end)

  -- Get top 10 (descending)
  local ok, pages = pcall(function()
    return leaderStore:GetSortedAsync(false, 10)
  end)
  if ok then
    local entries = pages:GetCurrentPage()
    for rank, entry in ipairs(entries) do
      print(rank, entry.key, entry.value)
    end
  end

--- METADATA ---

  local options = Instance.new("DataStoreSetOptions")
  options:SetMetadata({ ["LastSaved"] = os.time() })

  store:SetAsync(key, data, { userId }, options)

  local val, info = store:GetAsync(key)
  if info then
    print("Version:", info.Version)
    print("Created:", info.CreatedTime)
    print("Updated:", info.UpdatedTime)
    print("UserIds:", info:GetUserIds())
    print("Metadata:", info:GetMetadata())
  end

--- DATASTORE LIMITS & BEST PRACTICES ---

Limits:
  - Max value size: 4MB (compressed)
  - Key length: max 50 chars
  - Request budget: 60 + (numPlayers * 10) per minute per type
  - Metadata per key: max 300 bytes

Best practices:
  [x] ALWAYS use pcall
  [x] Use player.UserId as key prefix (not username — names can change)
  [x] Save on PlayerRemoving AND game:BindToClose
  [x] Use UpdateAsync for anything that could race (currency, inventory)
  [x] Version your data store name (PlayerData_v2) when schema changes
  [x] Cache data in a server table — don't read/write on every action
  [x] Use GetDataStore("Name", "Scope") for separate namespaces
  [x] Never store sensitive data client can read (put in ServerStorage)

GOTCHA: GetAsync can return stale data due to caching (up to 4s cache).
        Use :GetAsync with DataStoreGetOptions for force-refresh if needed.

--- SOUND / AUDIO ---

Create sound:
  local sound = Instance.new("Sound")
  sound.SoundId = "rbxassetid://12345678"
  sound.Volume = 0.5
  sound.Looped = false
  sound.RollOffMaxDistance = 50  -- 3D audio range
  sound.Parent = workspace  -- 3D positional if parented to part; global if in SoundService

Play/Stop:
  sound:Play()
  sound:Stop()
  sound:Pause()
  sound:Resume()

Events:
  sound.Ended:Connect(function() print("done") end)
  sound.Loaded:Connect(function() print("loaded") end)

SoundGroup for mixing:
  local SoundService = game:GetService("SoundService")
  -- Groups: Master, Music, SFX, Ambient
  sound.SoundGroup = SoundService:FindFirstChild("SFX")

--- EFFECTS (Particles, Beams, etc.) ---

ParticleEmitter (parent to a Part):
  local pe = Instance.new("ParticleEmitter")
  pe.Texture = "rbxassetid://12345"
  pe.Rate = 20
  pe.Lifetime = NumberRange.new(1, 3)
  pe.Speed = NumberRange.new(5, 10)
  pe.SpreadAngle = Vector2.new(20, 20)
  pe.Color = ColorSequence.new(Color3.fromRGB(255, 100, 0))
  pe.Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0, 0),
    NumberSequenceKeypoint.new(1, 1),
  })
  pe.Parent = part

  pe:Emit(10)  -- burst emit N particles
  pe.Enabled = false  -- stop emitting

Beam (connects two Attachments):
  local beam = Instance.new("Beam")
  beam.Attachment0 = attach0
  beam.Attachment1 = attach1
  beam.Width0 = 0.2
  beam.Width1 = 0.05
  beam.Color = ColorSequence.new(Color3.fromRGB(0, 200, 255))
  beam.Parent = workspace

Lighting effects (add to Lighting service):
  Atmosphere: Density, Offset, Color, Glare, Haze
  Bloom: Intensity, Size, Threshold
  ColorCorrection: Brightness, Contrast, Saturation, TintColor
  DepthOfField: FarIntensity, FocusDistance, InFocusRadius, NearIntensity
  SunRays: Intensity, Spread

  local bloom = Instance.new("Bloom")
  bloom.Intensity = 0.5
  bloom.Size = 24
  bloom.Threshold = 0.95
  bloom.Parent = game:GetService("Lighting")
`;
