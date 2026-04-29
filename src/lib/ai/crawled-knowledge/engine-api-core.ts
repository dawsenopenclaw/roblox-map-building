// Roblox Engine API — Core Classes
// Crawled from create.roblox.com/docs/reference/engine — Apr 29 2026
// Contains: BasePart, Part, Model, Workspace, Lighting, Players, Humanoid, CollectionService, RunService, Debris

export const ENGINE_API_CORE = `
=== BasePart ===
Abstract base class for all in-world objects that render and physically interact in Workspace.
Implemented by: Part, MeshPart, WedgePart, SpecialMesh, UnionOperation, etc.

PROPERTIES:
  Anchored: boolean          -- If true, physics cannot move this part
  CanCollide: boolean        -- Physical collision with other parts
  CanTouch: boolean          -- Enables Touched/TouchEnded events
  CFrame: CFrame             -- World position + orientation
  Position: Vector3          -- World coordinates
  Size: Vector3              -- Dimensions in studs
  Color: Color3              -- Surface color
  BrickColor: BrickColor     -- Named color (legacy)
  Material: Enum.Material    -- Surface texture + physics defaults
  Transparency: number       -- 0=opaque, 1=invisible
  Reflectance: number        -- Surface reflectivity (0-1)
  CastShadow: boolean        -- Whether part casts shadows
  Mass: number               -- Read-only; density × volume
  AssemblyMass: number       -- Total mass of the assembly
  AssemblyLinearVelocity: Vector3   -- Linear velocity of assembly
  AssemblyAngularVelocity: Vector3  -- Angular velocity of assembly
  RootPart: BasePart         -- Root part of the assembly (read-only)
  CollisionGroup: string     -- Physics collision group name
  CustomPhysicalProperties: PhysicalProperties  -- Override material physics

METHODS:
  part:GetMass() → number
  part:ApplyImpulse(impulse: Vector3) → void
  part:ApplyAngularImpulse(impulse: Vector3) → void
  part:GetVelocityAtPosition(position: Vector3) → Vector3
  part:PivotTo(cframe: CFrame) → void
  part:GetPivot() → CFrame

EVENTS:
  part.Touched:Connect(function(otherPart: BasePart) end)
  part.TouchEnded:Connect(function(otherPart: BasePart) end)

COMMON PATTERNS:
  -- Anchor a part
  part.Anchored = true

  -- Set CFrame with position + orientation
  part.CFrame = CFrame.new(0, 10, 0) * CFrame.Angles(0, math.rad(45), 0)

  -- Detect touch
  part.Touched:Connect(function(hit)
    local humanoid = hit.Parent:FindFirstChild("Humanoid")
    if humanoid then humanoid:TakeDamage(10) end
  end)

  -- Weld two parts
  local weld = Instance.new("WeldConstraint")
  weld.Part0 = partA
  weld.Part1 = partB
  weld.Parent = partA

=== Part ===
Standard BasePart with primitive geometry. Five shapes available via Part.Shape.

PROPERTIES (unique):
  Shape: Enum.PartType  -- Ball | Block | Cylinder | Wedge | CornerWedge

COMMON PATTERNS:
  local part = Instance.new("Part")
  part.Shape = Enum.PartType.Ball
  part.Size = Vector3.new(4, 4, 4)
  part.Material = Enum.Material.Neon
  part.Color = Color3.fromRGB(255, 100, 0)
  part.Anchored = true
  part.Parent = workspace

  -- MeshPart for custom shapes (import from toolbox or asset ID)
  local mesh = Instance.new("SpecialMesh")
  mesh.MeshType = Enum.MeshType.Sphere
  mesh.Parent = part

=== Model ===
Container that groups BaseParts. Supports bounding boxes, pivot manipulation, scaling.

PROPERTIES:
  PrimaryPart: BasePart      -- Reference point for MoveTo/PivotTo
  WorldPivot: CFrame         -- Pivot when no PrimaryPart set
  LevelOfDetail: Enum.ModelLevelOfDetail  -- Streaming LOD
  ModelStreamingMode: Enum.ModelStreamingMode
  Scale: number              -- Editor-only scale factor

METHODS:
  model:GetBoundingBox() → (CFrame, Vector3)   -- center CFrame + size
  model:GetExtentsSize() → Vector3             -- bounding box size
  model:MoveTo(position: Vector3)              -- moves PrimaryPart to position
  model:TranslateBy(delta: Vector3)            -- shift by offset
  model:PivotTo(cframe: CFrame)               -- moves entire model
  model:GetPivot() → CFrame                   -- current pivot
  model:ScaleTo(factor: number)               -- scale relative to original
  model:GetScale() → number
  model:BreakJoints()                          -- break all joints (deprecated)
  model:FindFirstChild(name, recursive?)       -- find child by name
  model:GetDescendants() → Instance[]          -- all descendants
  model:GetChildren() → Instance[]             -- direct children

COMMON PATTERNS:
  -- Create model from parts
  local model = Instance.new("Model")
  model.Name = "House"
  part.Parent = model
  model.PrimaryPart = basePart
  model.Parent = workspace

  -- Move model
  model:PivotTo(CFrame.new(50, 0, 50))

  -- Bounding box
  local cf, size = model:GetBoundingBox()

  -- Find humanoid in character
  local hum = character:FindFirstChildOfClass("Humanoid")

=== Workspace ===
Service that contains all 3D objects. Accessed as game:GetService("Workspace") or workspace.

PROPERTIES:
  Gravity: number                  -- Stud/s² (default 196.2)
  CurrentCamera: Camera            -- LocalPlayer's camera (client-side)
  Terrain: Terrain                 -- The terrain object
  DistributedGameTime: number      -- Seconds since game started
  FallenPartsDestroyHeight: number -- Parts below this Y are destroyed
  GlobalWind: Vector3              -- Wind affecting particles/terrain/clouds
  StreamingEnabled: boolean        -- Instance streaming on/off

METHODS:
  workspace:Raycast(origin, direction, params?) → RaycastResult?
  workspace:Blockcast(cframe, size, direction, params?) → RaycastResult?
  workspace:Spherecast(position, radius, direction, params?) → RaycastResult?
  workspace:GetPartsInPart(part, params?) → BasePart[]
  workspace:GetPartBoundsInBox(cframe, size, params?) → BasePart[]
  workspace:GetPartBoundsInRadius(position, radius, params?) → BasePart[]
  workspace:GetRealPhysicsFPS() → number
  workspace:GetNumAwakeParts() → number

COMMON PATTERNS:
  -- Raycast (e.g. gun shot, floor detection)
  local params = RaycastParams.new()
  params.FilterDescendantsInstances = {character}
  params.FilterType = Enum.RaycastFilterType.Exclude
  local result = workspace:Raycast(origin, direction * 500, params)
  if result then
    print(result.Instance, result.Position, result.Normal)
  end

  -- Parts in radius
  local overlapParams = OverlapParams.new()
  overlapParams.FilterType = Enum.RaycastFilterType.Include
  local parts = workspace:GetPartBoundsInRadius(Vector3.new(0,0,0), 20, overlapParams)

  -- Set gravity
  workspace.Gravity = 75  -- moon gravity

=== Lighting ===
Service controlling global lighting. Contains Atmosphere, Sky, ColorCorrectionEffect, etc.
Accessed as game:GetService("Lighting") or Lighting.

PROPERTIES:
  Ambient: Color3              -- Hue for occluded areas
  OutdoorAmbient: Color3       -- Hue for outdoor areas (default 127,127,127)
  Brightness: number           -- Sun/moon intensity
  ClockTime: number            -- 0-24 hours (not replicated)
  TimeOfDay: string            -- "HH:MM:SS" format
  ColorShift_Top: Color3       -- Surfaces facing sun/moon
  ColorShift_Bottom: Color3    -- Surfaces away from sun/moon
  GlobalShadows: boolean       -- Dynamic shadows
  FogColor: Color3             -- Fog hue
  FogStart: number             -- Fog start distance (studs)
  FogEnd: number               -- Fog end distance (studs)
  ShadowSoftness: number       -- Shadow blur 0-1 (default 0.2)
  GeographicLatitude: number   -- Degrees latitude
  EnvironmentDiffuseScale: number   -- Ambient from environment
  EnvironmentSpecularScale: number  -- Specular from environment
  ExposureCompensation: number      -- -5 to 5
  LightingStyle: Enum.LightingStyle

METHODS:
  Lighting:GetSunDirection() → Vector3
  Lighting:GetMoonDirection() → Vector3
  Lighting:GetMinutesAfterMidnight() → number
  Lighting:SetMinutesAfterMidnight(minutes: number)
  Lighting:GetMoonPhase() → number

EVENTS:
  Lighting.LightingChanged:Connect(function(skyChanged: boolean) end)

COMMON PATTERNS:
  -- Day/night cycle
  local Lighting = game:GetService("Lighting")
  Lighting.ClockTime = 14  -- 2pm
  Lighting.Brightness = 2
  Lighting.GlobalShadows = true

  -- Animate time
  game:GetService("RunService").Heartbeat:Connect(function(dt)
    Lighting.ClockTime = (Lighting.ClockTime + dt * 0.1) % 24
  end)

  -- Fog effect
  Lighting.FogStart = 0
  Lighting.FogEnd = 200
  Lighting.FogColor = Color3.fromRGB(200, 200, 220)

=== Players ===
Service managing connected players. Accessed as game:GetService("Players").

PROPERTIES:
  LocalPlayer: Player          -- Only on client; the local user
  MaxPlayers: number           -- Server player limit
  RespawnTime: number          -- Seconds until character respawn
  CharacterAutoLoads: boolean  -- Auto-respawn characters
  BubbleChat: boolean
  ClassicChat: boolean

METHODS:
  Players:GetPlayers() → Player[]
  Players:GetPlayerByUserId(userId) → Player?
  Players:GetPlayerFromCharacter(character: Model) → Player?
  Players:GetNameFromUserIdAsync(userId) → string   -- yields
  Players:GetUserIdFromNameAsync(name) → number     -- yields
  Players:GetUserThumbnailAsync(userId, thumbType, thumbSize) → (url, isReady)
  Players:GetCharacterAppearanceAsync(userId) → Model  -- yields
  Players:GetFriendsAsync(userId) → FriendPages    -- yields

EVENTS:
  Players.PlayerAdded:Connect(function(player: Player) end)
  Players.PlayerRemoving:Connect(function(player: Player, reason) end)
  Players.PlayerMembershipChanged:Connect(function(player) end)

COMMON PATTERNS:
  local Players = game:GetService("Players")

  -- Handle all players including ones already in game
  local function onPlayerAdded(player)
    player.CharacterAdded:Connect(function(character)
      local humanoid = character:WaitForChild("Humanoid")
      humanoid.Died:Connect(function()
        print(player.Name, "died")
      end)
    end)
  end
  Players.PlayerAdded:Connect(onPlayerAdded)
  for _, p in Players:GetPlayers() do onPlayerAdded(p) end

  -- Get all players
  for _, player in Players:GetPlayers() do
    print(player.Name, player.UserId)
  end

  -- LocalPlayer (client only)
  local player = Players.LocalPlayer
  local character = player.Character or player.CharacterAdded:Wait()

=== Humanoid ===
Special object inside character Models that enables movement, health, and state.

PROPERTIES:
  Health: number               -- Current HP
  MaxHealth: number            -- Max HP (default 100)
  WalkSpeed: number            -- Movement speed (default 16)
  JumpHeight: number           -- Jump height in studs
  JumpPower: number            -- Jump impulse (legacy RigType R6)
  HipHeight: number            -- Distance hip is above floor
  RootPart: BasePart           -- HumanoidRootPart (read-only)
  MoveDirection: Vector3       -- Current movement direction (read-only)
  AutoRotate: boolean          -- Auto-rotate toward movement direction
  PlatformStand: boolean       -- Disable movement input
  Sit: boolean                 -- Force sitting state
  DisplayName: string          -- Name shown above character
  RigType: Enum.HumanoidRigType  -- R6 or R15
  CameraOffset: Vector3        -- Camera position offset
  FloorMaterial: Enum.Material  -- Material currently standing on (read-only)
  HealthDisplayDistance: number
  NameDisplayDistance: number

METHODS:
  humanoid:Move(direction: Vector3, relativeToCamera?: boolean)
  humanoid:MoveTo(location: Vector3, part?: BasePart)
  humanoid:ChangeState(state: Enum.HumanoidStateType)
  humanoid:GetState() → Enum.HumanoidStateType
  humanoid:SetStateEnabled(state, enabled: boolean)
  humanoid:GetStateEnabled(state) → boolean
  humanoid:TakeDamage(amount: number)
  humanoid:AddAccessory(accessory: Accessory)
  humanoid:GetAccessories() → Accessory[]
  humanoid:EquipTool(tool: Tool)
  humanoid:UnequipTools()
  humanoid:ApplyDescriptionAsync(desc: HumanoidDescription)
  humanoid:BuildRigFromAttachments()
  humanoid:GetAppliedDescription() → HumanoidDescription

EVENTS:
  humanoid.Died:Connect(function() end)
  humanoid.HealthChanged:Connect(function(health: number) end)
  humanoid.StateChanged:Connect(function(old, new: Enum.HumanoidStateType) end)
  humanoid.MoveToFinished:Connect(function(reached: boolean) end)
  humanoid.Seated:Connect(function(active, seat) end)
  humanoid.Running:Connect(function(speed: number) end)

COMMON PATTERNS:
  -- Deal damage on touch
  part.Touched:Connect(function(hit)
    local hum = hit.Parent:FindFirstChildOfClass("Humanoid")
    if hum then hum:TakeDamage(25) end
  end)

  -- Heal player
  humanoid.Health = math.min(humanoid.Health + 50, humanoid.MaxHealth)

  -- Speed boost
  humanoid.WalkSpeed = 32

  -- Ragdoll
  humanoid:ChangeState(Enum.HumanoidStateType.Ragdoll)

  -- NPC walk to point
  humanoid:MoveTo(targetPosition)
  humanoid.MoveToFinished:Wait()

=== CollectionService ===
Tags instances with string labels for grouping and querying. Replicated server→client.
Accessed as game:GetService("CollectionService").

METHODS:
  CollectionService:AddTag(instance, tag: string)
  CollectionService:RemoveTag(instance, tag: string)
  CollectionService:HasTag(instance, tag: string) → boolean
  CollectionService:GetTags(instance) → string[]
  CollectionService:GetTagged(tag: string) → Instance[]
  CollectionService:GetAllTags() → string[]
  CollectionService:GetInstanceAddedSignal(tag) → RBXScriptSignal
  CollectionService:GetInstanceRemovedSignal(tag) → RBXScriptSignal

COMMON PATTERNS:
  local CS = game:GetService("CollectionService")

  -- Tag parts as interactable
  CS:AddTag(part, "Interactable")

  -- Process all tagged instances (including future ones)
  for _, inst in CS:GetTagged("Interactable") do
    setupInteractable(inst)
  end
  CS:GetInstanceAddedSignal("Interactable"):Connect(setupInteractable)
  CS:GetInstanceRemovedSignal("Interactable"):Connect(cleanupInteractable)

  -- Check tag
  if CS:HasTag(part, "Dangerous") then
    part.Material = Enum.Material.Neon
  end

=== RunService ===
Manages runtime execution and game loop events.
Accessed as game:GetService("RunService").

PROPERTIES:
  RunState: Enum.RunState

METHODS:
  RunService:IsClient() → boolean
  RunService:IsServer() → boolean
  RunService:IsStudio() → boolean
  RunService:IsRunning() → boolean
  RunService:BindToRenderStep(name: string, priority: number, fn: (dt) → void)
  RunService:UnbindFromRenderStep(name: string)

EVENTS (use :Connect on each):
  RunService.Heartbeat   -- deltaTime: number  [every physics step, server+client]
  RunService.Stepped     -- time, deltaTime    [before physics, server+client]
  RunService.PreSimulation    -- deltaTime     [before physics sim]
  RunService.PostSimulation   -- deltaTime     [after physics sim]
  RunService.PreRender        -- deltaTime     [client, before render]
  RunService.RenderStepped    -- deltaTime     [client, after render prep]
  RunService.PreAnimation     -- deltaTime     [before animations processed]

PRIORITY CONSTANTS for BindToRenderStep:
  Enum.RenderPriority.First  = 0
  Enum.RenderPriority.Input  = 100
  Enum.RenderPriority.Character = 200
  Enum.RenderPriority.Camera = 300
  Enum.RenderPriority.Last   = 1000

COMMON PATTERNS:
  local RS = game:GetService("RunService")

  -- Game loop (server)
  RS.Heartbeat:Connect(function(dt)
    -- update per frame
  end)

  -- Client render loop (animations, camera)
  RS:BindToRenderStep("CameraUpdate", Enum.RenderPriority.Camera.Value, function(dt)
    -- camera logic
  end)

  -- Context check
  if RS:IsServer() then
    -- server-only code
  end

  -- Spin part
  RS.Heartbeat:Connect(function(dt)
    part.CFrame = part.CFrame * CFrame.Angles(0, dt * 2, 0)
  end)

=== Debris ===
Schedules automatic destruction of instances without yielding.
Accessed as game:GetService("Debris").

PROPERTIES:
  MaxItems: number  -- Max concurrent items (capped at 1000, deprecated)

METHODS:
  Debris:AddItem(instance: Instance, lifetime?: number)  -- default 10 seconds

COMMON PATTERNS:
  local Debris = game:GetService("Debris")

  -- Auto-destroy projectile after 5 seconds
  local bullet = Instance.new("Part")
  bullet.Parent = workspace
  Debris:AddItem(bullet, 5)

  -- Cleanup effect
  local effect = createExplosionEffect()
  effect.Parent = workspace
  Debris:AddItem(effect, 3)

  -- Prefer task.delay for complex cleanup
  task.delay(5, function()
    if part and part.Parent then
      part:Destroy()
    end
  end)
`;
