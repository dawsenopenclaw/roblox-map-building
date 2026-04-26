/**
 * DevForum Scripting Patterns Knowledge Base
 *
 * Deep code patterns extracted from 50+ Roblox DevForum threads, official docs,
 * and community resources. Each section contains EXACT code patterns, specific
 * numbers, common mistakes, and best thread URLs.
 *
 * Covers: Terrain Generation, Anti-Cheat, Camera Systems, Weapons/Tools,
 * NPC Systems, Placement Systems, TeleportService, Sound Design,
 * Swimming/Water, Flying/Jetpack, Dungeon Generation, Battle Pass
 *
 * Sources:
 * - devforum.roblox.com/t/ultimate-perlin-noise-terrain-guide/3109400
 * - devforum.roblox.com/t/a-comprehensive-guide-to-airtight-remote-security/3079489
 * - devforum.roblox.com/t/knightmare-server-side-anti-cheat/2223732
 * - devforum.roblox.com/t/raycast-hitbox-401/374482
 * - devforum.roblox.com/t/simplepath-pathfinding-module/1196762
 * - devforum.roblox.com/t/dungeon-generation-procedural-guide/342413
 * - devforum.roblox.com/t/snap-grid-placement-class/2730963
 * - create.roblox.com/docs/characters/pathfinding
 * - And 40+ additional threads
 */

import 'server-only'

export const DEVFORUM_SCRIPTING_KNOWLEDGE = `
=== DEVFORUM SCRIPTING PATTERNS (extracted from top Roblox developers) ===

TERRAIN GENERATION:
- Core function: math.noise(x, y, z) returns -0.5 to 0.5. Add 0.5 to normalize to 0-1 range.
- Terrain API methods: Terrain:FillBlock(cframe, size, material), Terrain:FillBall(center, radius, material), Terrain:FillCylinder(cframe, height, radius, material), Terrain:FillWedge(cframe, size, material), Terrain:WriteVoxels(region, resolution, materialMap, occupancyMap), Terrain:ReadVoxels(region, resolution).
- FillBall has max radius limit of 812 studs (engine bug).
- FillBlock signature: workspace.Terrain:FillBlock(CFrame.new(x, y, z), Vector3.new(sizeX, sizeY, sizeZ), Enum.Material.Grass)
- WriteVoxels resolution is always 4 (voxel grid size). Region3 must be aligned to 4-stud grid via Region3:ExpandToGrid(4).
- Perlin noise terrain pattern:
  local Scale = 10 -- zoom level
  local Frequency = 0.4 -- hill occurrence rate (0.1-0.4 typical)
  local Amplitude = 10 -- height multiplier
  local Seed = tick()
  local rng = Random.new(Seed)
  local xOff = rng:NextNumber(-100000, 100000)
  local zOff = rng:NextNumber(-100000, 100000)
  for x = 0, MapSize do
    for z = 0, MapSize do
      local sX = x / Scale * Frequency + xOff
      local sZ = z / Scale * Frequency + zOff
      local baseY = math.clamp((math.noise(sX, sZ) + 0.5), 0, 1)
      local y = baseY * Amplitude
      workspace.Terrain:FillBlock(CFrame.new(x * 4, y * 2, z * 4), Vector3.new(4, y * 4 + 4, 4), Enum.Material.Grass)
    end
    task.wait() -- CRITICAL: prevents studio crash
  end
- Terrain materials list: Grass, Sand, Rock, Basalt, Snow, Ice, Mud, Sandstone, Limestone, Pavement, Asphalt, Brick, Cobblestone, Concrete, CrackedLava, WoodPlanks, LeafyGrass, Salt, Ground.
- Water terrain: Enum.Material.Water. Water level is separate from terrain height.
- Biome generation: Use 2nd noise layer with different frequency/offset. Threshold ranges determine biome: noise < 0.3 = desert (Sand), 0.3-0.6 = plains (Grass), 0.6-0.8 = forest (LeafyGrass), 0.8+ = mountain (Rock/Snow).
- Fractal noise (octaves): Sum multiple noise layers. Each octave doubles frequency and halves amplitude. 4-6 octaves is standard for natural terrain.
  local total = 0; local freq = 1; local amp = 1; local maxVal = 0
  for i = 1, octaves do
    total += math.noise(x * freq / scale + xOff, z * freq / scale + zOff) * amp
    maxVal += amp; amp *= 0.5; freq *= 2
  end
  total = total / maxVal -- normalize to -0.5 to 0.5
- Noise modulation: Billowy noise = abs(noise) per octave. Ridged noise = 1 - abs(noise) per octave.
- Chunking: Divide world into 64x64 or 128x128 stud chunks. Generate on-demand as player moves. Use 2D chunking (8 neighbors) for heightmap, 3D cubic chunking (26 neighbors) for caves.
- Elevation-based coloring: Snow at 0.8+, Stone at 0.7+, Grass at 0.5+, Water at 0.25+, Deep water at 0+.
- Common mistake: Offsets beyond +/-100000 cause noise distortion. Always clamp.
- Common mistake: Not using task.wait() in generation loops — freezes studio/server.
- Common mistake: Blocky terrain with WriteVoxels — use occupancy values between 0-1 for smoothing, not just 0 or 1.

ANTI-CHEAT PATTERNS:
- GOLDEN RULE: Never trust the client. All game-critical logic must be server-validated.
- Rate limiting pattern (15 calls/sec threshold):
  local PlayerData = {}
  Players.PlayerAdded:Connect(function(Player)
    PlayerData[Player] = { CallCount = 0, LastCallTime = os.clock() }
  end)
  Remote.OnServerEvent:Connect(function(Player, ...)
    local Data = PlayerData[Player]
    if os.clock() - Data.LastCallTime < 1 then
      Data.CallCount += 1
      if Data.CallCount >= 15 then Player:Kick("Rate limit") return end
    else
      Data.CallCount = 1; Data.LastCallTime = os.clock()
    end
    -- process event
  end)
  Players.PlayerRemoving:Connect(function(Player) PlayerData[Player] = nil end)
- Type validation: Always check typeof() for every remote argument. typeof(value) ~= "Vector3" then kick. typeof(value) ~= "Instance" then kick. typeof(value) ~= "number" then kick. typeof(value) ~= "string" then kick.
- Distance validation for damage: local dist = (attacker.HumanoidRootPart.Position - target.HumanoidRootPart.Position).Magnitude; if dist >= 25 then return end -- 25 studs max melee range
- Damage cap: if damage <= 0 or damage > MAX_DAMAGE then return end -- silent fail, don't kick
- String whitelist: if not table.find(ValidOptions, receivedString) then ban end
- Integer validation: if math.floor(number) ~= number or number < 1 or number > MAX then ban end
- Server-sided speed detection:
  local WalkSpeedLimit = 16 -- default humanoid walkspeed
  local Threshold = 2 -- lag tolerance
  local CheckInterval = 0.5 -- seconds between checks
  local MaxFlags = 6 -- kicks after 6 violations
  task.spawn(function()
    task.wait(3) -- grace period on spawn
    while true do
      local oldPos = root.Position
      task.wait(CheckInterval)
      local newPos = root.Position
      if math.abs(newPos.X - oldPos.X) >= WalkSpeedLimit + Threshold or
         math.abs(newPos.Z - oldPos.Z) >= WalkSpeedLimit + Threshold then
        root.CFrame = CFrame.new(oldPos) -- teleport back
        flags += 1
      end
      if flags >= MaxFlags then player:Kick("Abnormal movement") end
    end
  end)
- Jump height detection: if (newY - oldY) > 0 and math.abs(newY - oldY) >= JumpHeightLimit + 2 then teleport back, flag end. Default JumpHeightLimit = 50 studs.
- Fly detection: Track airtime. If player airborne > maxFreeFallTime (2.0 seconds default) without touching ground, flag. Knightmare anti-cheat "grounds" airborne players repeatedly.
- Noclip detection: Raycast from old position to new position. If ray hits a wall between the two positions, player noclipped through it.
- Common exploits: Speed hack (modify WalkSpeed), fly hack (BodyVelocity injection), noclip (disable collision), teleport (set CFrame), damage hack (fire remote with inflated values), remote spam (fire events rapidly).
- DO NOT rely on client-side anti-cheat alone — exploiters can delete LocalScripts. Server-side is mandatory.
- Lag compensation: Use Player:GetNetworkPing() but limit leeway to max 15% extra.
- RemoteGuard module pattern: Wrap all OnServerEvent handlers with rate limit + type check middleware.
- Common mistake: Kicking on first violation — causes false positives from lag. Use flag accumulation (6+ flags).
- Common mistake: Checking WalkSpeed/JumpPower values — exploiters modify physics directly, not these properties.
- Common mistake: Trusting Instance:IsA() without checking :IsDescendantOf(workspace) — exploiters can pass fake instances.

CAMERA SYSTEMS:
- Camera modes: Set workspace.CurrentCamera.CameraType = Enum.CameraType.Scriptable for full control. Reset to Enum.CameraType.Custom for default behavior.
- Third-person over-shoulder camera:
  local Camera = workspace.CurrentCamera
  local CameraOffset = Vector3.new(1, 3, 9.5) -- right 1, up 3, back 9.5
  local CameraAngleX, CameraAngleY = 0, 0
  RunService.RenderStepped:Connect(function()
    Camera.CameraType = Enum.CameraType.Scriptable
    local StartCFrame = CFrame.new(HumanoidRootPart.Position) * CFrame.Angles(0, math.rad(CameraAngleX), 0) * CFrame.Angles(math.rad(CameraAngleY), 0, 0)
    local CameraCFrame = StartCFrame:ToWorldSpace(CFrame.new(CameraOffset.X, CameraOffset.Y, CameraOffset.Z))
    local CameraFocus = StartCFrame:ToWorldSpace(CFrame.new(CameraOffset.X, CameraOffset.Y, -10000))
    Camera.CFrame = CFrame.new(CameraCFrame.Position, CameraFocus.Position)
  end)
  UserInputService.InputChanged:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseMovement then
      CameraAngleX -= input.Delta.X
      CameraAngleY = math.clamp(CameraAngleY - input.Delta.Y, -75, 75) -- clamp vertical to +/-75 degrees
    end
  end)
  UserInputService.MouseBehavior = Enum.MouseBehavior.LockCenter
- Top-down camera: Camera.CFrame = CFrame.new(character.Position + Vector3.new(0, 50, 0), character.Position). Set CameraType to Scriptable. Update on RenderStepped.
- Isometric camera: Camera.CFrame = CFrame.new(character.Position + Vector3.new(30, 40, 30), character.Position). Fixed angle, follows player XZ position.
- First-person lock: game.StarterPlayer.CameraMode = Enum.CameraMode.LockFirstPerson. Or at runtime: player.CameraMode = Enum.CameraMode.LockFirstPerson.
- Cutscene with TweenService:
  Camera.CameraType = Enum.CameraType.Scriptable
  local waypoints = {workspace.CamPoint1, workspace.CamPoint2, workspace.CamPoint3}
  for i, point in ipairs(waypoints) do
    local tweenInfo = TweenInfo.new(2, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut)
    TweenService:Create(Camera, tweenInfo, {CFrame = point.CFrame}):Play()
    task.wait(2)
  end
  Camera.CameraType = Enum.CameraType.Custom -- return control
- Camera shake (simple random):
  for i = 1, 30 do -- 30 iterations = ~1 second shake
    local x = math.random(-100,100)/1250 -- small random angles
    local y = math.random(-100,100)/1250
    local z = math.random(-100,100)/1250
    Camera.CFrame = Camera.CFrame * CFrame.Angles(x, y, z)
    task.wait(0.033)
  end
- Camera shake (smooth sine wave):
  local intensity = 0.5 -- stud offset
  local frequency = 20 -- oscillations per second
  local duration = 0.5
  local startTime = tick()
  while tick() - startTime < duration do
    local t = tick()
    local offsetX = math.sin(t * frequency) * intensity
    local offsetY = math.sin(t * frequency * 1.3) * intensity * 0.7
    Camera.CFrame = Camera.CFrame * CFrame.new(offsetX, offsetY, 0)
    RunService.RenderStepped:Wait()
  end
- Camera shake modules: RbxUtil Shake module (Shake.new(), shake:Start(), shake:OnSignal()), RbxCameraShaker by Sleitnick, Calculon Ornstein-Uhlenbeck method for realistic decay.
- FOV tween for speed effect: TweenService:Create(Camera, TweenInfo.new(0.5), {FieldOfView = 90}):Play() -- zoom out for speed. Reset to 70 for normal.
- Camera effects module pattern: Server fires RemoteEvent with params (intensity, movements, timeBetween). Client applies shake to current CameraSubject. Shake params: Intensity=10, Movements=40, TimeBetween=0.03 for heavy impact.
- Common mistake: Not resetting CameraType to Custom after cutscene — player loses camera control forever.
- Common mistake: Using TweenService on Camera while also applying shake — they conflict. Apply shake as CFrame multiplication AFTER tween target.
- Common mistake: Camera.CFrame = CFrame.new(pos, lookAt) with identical pos and lookAt — causes NaN error.

TOOL AND WEAPON SYSTEMS:
- Tool events: Tool.Activated (click/tap), Tool.Deactivated (release), Tool.Equipped (put in hand), Tool.Unequipped (put away).
- Tool properties: RequiresHandle (bool), CanBeDropped (bool), ToolTip (string shown on hover).
- Basic sword pattern:
  Tool.Activated:Connect(function()
    if debounce then return end; debounce = true
    -- play swing animation
    local anim = humanoid:LoadAnimation(swingAnim)
    anim:Play()
    -- enable hitbox for 0.3 seconds
    hitboxPart.CanTouch = true
    task.delay(0.3, function() hitboxPart.CanTouch = false end)
    task.wait(cooldown) -- 0.5-1.0 second cooldown
    debounce = false
  end)
- Raycast Hitbox system (community standard for melee):
  1. Add Attachment instances along weapon blade, spaced ~1 stud apart (7-15 total).
  2. Module fires rays between sequential attachment pairs each frame.
  3. Rays detect parts between where hitbox WAS and where it IS now (prevents frame-skip misses).
  4. API: local hitbox = RaycastHitbox.new(weaponModel); hitbox.OnHit:Connect(function(hit, humanoid, result) end); hitbox:HitStart(0.3); hitbox:HitStop()
  5. MUST call HitStop() between attacks — otherwise targets won't re-register (dedup cache).
  6. Successor module: ShapecastHitbox (uses shapecasts instead of raycasts for wider detection).
- Gun/Raycast weapon pattern:
  -- Client: fire remote with mouse hit position
  Tool.Activated:Connect(function()
    local mousePos = mouse.Hit.Position
    ShootRemote:FireServer(mousePos)
  end)
  -- Server: validate and raycast
  ShootRemote.OnServerEvent:Connect(function(player, targetPos)
    local origin = player.Character.Head.Position
    local direction = (targetPos - origin).Unit * 300 -- 300 stud max range
    local params = RaycastParams.new()
    params.FilterType = Enum.RaycastFilterType.Exclude
    params.FilterDescendantsInstances = {player.Character}
    local result = workspace:Raycast(origin, direction, params)
    if result and result.Instance then
      local humanoid = result.Instance.Parent:FindFirstChildOfClass("Humanoid")
      if humanoid then
        local damage = 25 -- base damage
        if result.Instance.Name == "Head" then damage *= 2 end -- headshot
        humanoid:TakeDamage(damage)
      end
    end
  end)
- Projectile system: Create part at gun muzzle. Apply BodyVelocity or set AssemblyLinearVelocity = lookVector * speed. Use Touched event or raycast on Heartbeat for hit detection. Destroy after 5 seconds (Debris:AddItem). Speed: 100-300 studs/s for bullets, 30-60 for arrows.
- Reload mechanics: local MaxAmmo = 30; local CurrentAmmo = 30; local ReloadTime = 2.5. On shoot: CurrentAmmo -= 1. On R key: if CurrentAmmo < MaxAmmo then isReloading = true; task.wait(ReloadTime); CurrentAmmo = MaxAmmo; isReloading = false end.
- Ammo HUD: TextLabel showing "CurrentAmmo / MaxAmmo". Update on shoot and reload events.
- Common mistake: Doing damage on client — exploiters can fire kill-all. ALWAYS validate damage on server.
- Common mistake: Not filtering raycasts to exclude shooter's character — bullets hit self.
- Common mistake: Using Touched for melee — unreliable, fires multiple times, misses fast swings. Use raycast hitbox instead.

NPC SYSTEMS:
- PathfindingService basics:
  local PathfindingService = game:GetService("PathfindingService")
  local path = PathfindingService:CreatePath({
    AgentRadius = 3, -- separation from obstacles (default 2)
    AgentHeight = 6, -- vertical clearance (default 5)
    AgentCanJump = true, -- allow jumping (default true)
    AgentCanClimb = false, -- traverse TrussParts (default false)
    WaypointSpacing = 4, -- distance between waypoints (default 4)
    Costs = { Water = 20, Neon = math.huge } -- material costs (math.huge = impassable)
  })
  path:ComputeAsync(startPos, goalPos)
  if path.Status == Enum.PathStatus.Success then
    local waypoints = path:GetWaypoints()
    for _, wp in ipairs(waypoints) do
      humanoid:MoveTo(wp.Position)
      humanoid.MoveToFinished:Wait()
    end
  end
- PathfindingLink: Custom actions at waypoints. Place PathfindingLink instances between two Attachments. Set Label (e.g. "UseBoat"). Check waypoint.Label in movement loop to trigger custom behavior.
- Path blocked handling:
  path.Blocked:Connect(function(blockedIdx)
    if blockedIdx >= nextWaypointIndex then
      path:ComputeAsync(npc.Position, destination) -- recompute
    end
  end)
- Limits: Max line-of-sight distance 3000 studs. Y-coordinate bounds +/-65536 studs.
- NPC patrol waypoints:
  local waypoints = {workspace.Waypoints.W1, workspace.Waypoints.W2, workspace.Waypoints.W3}
  local currentWP = 1
  while true do
    path:ComputeAsync(npc.PrimaryPart.Position, waypoints[currentWP].Position)
    if path.Status == Enum.PathStatus.Success then
      for _, wp in ipairs(path:GetWaypoints()) do
        humanoid:MoveTo(wp.Position)
        humanoid.MoveToFinished:Wait()
      end
    end
    currentWP = currentWP % #waypoints + 1 -- cycle
    task.wait(math.random(2, 5)) -- idle at waypoint 2-5 seconds
  end
- NPC wander within zone:
  local zone = workspace.WanderZone -- Part defining boundaries
  local function getRandomPointInZone()
    local halfSize = zone.Size / 2
    local randomX = math.random(-halfSize.X, halfSize.X)
    local randomZ = math.random(-halfSize.Z, halfSize.Z)
    return zone.Position + Vector3.new(randomX, 0, randomZ)
  end
  while true do
    local target = getRandomPointInZone()
    path:ComputeAsync(npc.PrimaryPart.Position, target)
    -- walk to target...
    task.wait(math.random(3, 8)) -- idle 3-8 seconds
  end
- Zone boundary validation:
  local function isInZone(pos, zonePart)
    local half = zonePart.Size / 2
    return math.abs(pos.X - zonePart.Position.X) <= half.X
       and math.abs(pos.Z - zonePart.Position.Z) <= half.Z
  end
- NPC chase player (detection + pursuit):
  local DETECT_RANGE = 50 -- studs
  local CHASE_RANGE = 80 -- give up distance
  while true do
    local nearest = nil; local nearestDist = DETECT_RANGE
    for _, player in ipairs(Players:GetPlayers()) do
      local char = player.Character
      if char and char.PrimaryPart then
        local dist = (npc.PrimaryPart.Position - char.PrimaryPart.Position).Magnitude
        if dist < nearestDist then nearest = char; nearestDist = dist end
      end
    end
    if nearest then
      path:ComputeAsync(npc.PrimaryPart.Position, nearest.PrimaryPart.Position)
      -- follow waypoints, recompute every 0.5-1s
    else
      -- return to patrol
    end
    task.wait(0.5)
  end
- Shopkeeper NPC: ProximityPrompt on NPC (MaxActivationDistance = 8, HoldDuration = 0). On Triggered: open shop ScreenGui via RemoteEvent. Server validates purchases.
- SimplePath module: local path = SimplePath.new(npcModel, {AgentRadius=3}). path:Run(targetPosition). path.Completed:Connect(function(status) end). path:Stop(). path:Destroy().
- NPC pathfinding performance: Recalculate every 0.5-1.5 seconds, NOT every frame. 10 NPCs pathfinding simultaneously drops server by 20%. Sleep NPCs when no players nearby.
- Common mistake: Computing path every frame — tanks server performance. Use 0.5-1.5s intervals.
- Common mistake: Not handling PathStatus.NoPath — NPC gets stuck forever. Add fallback (walk toward target directly or idle).
- Common mistake: NPC stuck on walls — increase AgentRadius or add PathfindingModifier to obstacles.

BUILDING AND PLACEMENT SYSTEM:
- Grid snap formula: local gridSize = 4; local snappedX = math.round(worldX / gridSize) * gridSize; local snappedZ = math.round(worldZ / gridSize) * gridSize
- Mouse to world position (for placement):
  local mouse = player:GetMouse()
  local raycastParams = RaycastParams.new()
  raycastParams.FilterType = Enum.RaycastFilterType.Exclude
  raycastParams.FilterDescendantsInstances = {ghostModel, character}
  local ray = workspace:Raycast(mouse.UnitRay.Origin, mouse.UnitRay.Direction * 1000, raycastParams)
  if ray then
    local worldPos = ray.Position
    local snappedPos = Vector3.new(
      math.round(worldPos.X / gridSize) * gridSize,
      ray.Position.Y + objectHeight/2,
      math.round(worldPos.Z / gridSize) * gridSize
    )
  end
- Ghost preview (transparent model following mouse):
  local ghost = model:Clone()
  for _, part in ipairs(ghost:GetDescendants()) do
    if part:IsA("BasePart") then
      part.Transparency = 0.5
      part.CanCollide = false
      part.Anchored = true
      part.Material = Enum.Material.Neon
      part.BrickColor = BrickColor.new("Bright green") -- valid placement
    end
  end
  ghost.Parent = workspace
  -- On RenderStepped: update ghost.PrimaryPart.CFrame = CFrame.new(snappedPos)
- Collision checking:
  local overlapParams = OverlapParams.new()
  overlapParams.FilterType = Enum.RaycastFilterType.Exclude
  overlapParams.FilterDescendantsInstances = {ghost}
  local touching = workspace:GetPartBoundsInBox(CFrame.new(snappedPos), objectSize, overlapParams)
  local canPlace = #touching == 0
  -- Update ghost color: green if canPlace, red if not
- Rotation: local rotation = 0. On R key press: rotation = (rotation + 90) % 360. Apply: ghost.CFrame = CFrame.new(snappedPos) * CFrame.Angles(0, math.rad(rotation), 0)
- Placement validation (server):
  PlaceRemote.OnServerEvent:Connect(function(player, itemName, position, rotation)
    -- validate item exists in player inventory
    -- validate position is within plot boundaries
    -- validate no collision at position
    -- spawn item, deduct from inventory
    local item = ReplicatedStorage.Items[itemName]:Clone()
    item:PivotTo(CFrame.new(position) * CFrame.Angles(0, math.rad(rotation), 0))
    item.Parent = workspace.PlacedItems
  end)
- Snap module (community): Snap.init({plotSize=16, gridSize=4, buildingPieces=folder}). local plot = Snap.new({plot=part}). plot:SetOwner(player). Client: Snap.EnterBuildMode(), Snap.Rotate(), Snap.Place().
- GridPlacer module: Handles surface-aware placement. Supports wall/ceiling placement. Aligns part orientation to surface normal.
- Common mistake: Only snapping X/Z but not Y — objects float or clip through floor.
- Common mistake: Collision check on client only — exploiters bypass to overlap objects.
- Common mistake: Not anchoring placed objects — physics sends them flying.

TELEPORTSERVICE:
- Basic teleport: TeleportService:TeleportAsync(placeId, {player})
- Max 50 players per TeleportAsync call.
- TeleportOptions setup:
  local teleportOptions = Instance.new("TeleportOptions")
  teleportOptions.ShouldReserveServer = true -- creates new private server
  TeleportService:TeleportAsync(placeId, {player1, player2}, teleportOptions)
- Reserved server (existing):
  local code = TeleportService:ReserveServer(placeId)
  local teleportOptions = Instance.new("TeleportOptions")
  teleportOptions.ReservedServerAccessCode = code
  TeleportService:TeleportAsync(placeId, players, teleportOptions)
- Passing data between places:
  local options = Instance.new("TeleportOptions")
  options:SetTeleportData({level = 5, score = 1000, team = "Red"})
  TeleportService:TeleportAsync(placeId, {player}, options)
  -- On destination: local data = player:GetJoinData().TeleportData
  -- Or: local data = TeleportService:GetLocalPlayerTeleportData() (client)
- TeleportToPrivateServer is essentially deprecated. Use TeleportAsync with TeleportOptions instead.
- Conflicting options (will error): ReservedServerAccessCode + ServerInstanceId, ShouldReserveServer + ServerInstanceId, ShouldReserveServer + ReservedServerAccessCode.
- Error handling:
  local success, result = pcall(function()
    return TeleportService:TeleportAsync(placeId, players, options)
  end)
  if not success then
    warn("Teleport failed:", result)
    task.wait(5)
    -- retry logic (max 3 attempts)
  end
- TeleportService.TeleportInitFailed event fires when teleport fails on client. Use for retry UI.
- Common mistake: Not using pcall — teleport can fail due to network issues, crashing the script.
- Common mistake: Teleporting to same place without ShouldReserveServer — sends to random public server instead of same server.
- Common mistake: Exceeding 50 player limit — silently fails for excess players.

SOUND DESIGN PATTERNS:
- SoundService: Global sound container. Sounds parented here play globally (no spatial).
- SoundGroup: Group sounds for volume control. Sound.SoundGroup = soundGroup. Adjust SoundGroup.Volume (0-1).
- Spatial audio: Parent Sound to a Part in workspace. Set RollOffMode, RollOffMinDistance, RollOffMaxDistance.
  sound.RollOffMode = Enum.RollOffMode.Linear -- linear falloff (most common)
  sound.RollOffMinDistance = 7 -- full volume within 7 studs
  sound.RollOffMaxDistance = 50 -- silent beyond 50 studs
  -- Inverse mode: more realistic falloff, InverseTapered for blend
- Music crossfade:
  local function crossfade(currentSound, nextSound, duration)
    local tweenOut = TweenService:Create(currentSound, TweenInfo.new(duration), {Volume = 0})
    local tweenIn = TweenService:Create(nextSound, TweenInfo.new(duration), {Volume = 0.5})
    nextSound:Play()
    tweenOut:Play()
    tweenIn:Play()
    tweenOut.Completed:Connect(function() currentSound:Stop() end)
  end
- Material-based footstep sounds:
  local MaterialSounds = {
    [Enum.Material.Grass] = {"rbxassetid://123", "rbxassetid://124"},
    [Enum.Material.Concrete] = {"rbxassetid://125", "rbxassetid://126"},
    [Enum.Material.Wood] = {"rbxassetid://127", "rbxassetid://128"},
    [Enum.Material.Sand] = {"rbxassetid://129", "rbxassetid://130"},
    [Enum.Material.Metal] = {"rbxassetid://131", "rbxassetid://132"},
    [Enum.Material.Ice] = {"rbxassetid://133", "rbxassetid://134"},
  }
  -- Detection: use Humanoid.FloorMaterial property (updates automatically)
  while true do
    if walking then
      local speed = HumanoidRootPart.AssemblyLinearVelocity.Magnitude
      local waitTime = speed > 1 and (500 / speed / 100) or 0.3
      local sounds = MaterialSounds[Humanoid.FloorMaterial]
      if sounds then
        local s = Instance.new("Sound")
        s.Parent = HumanoidRootPart
        s.SoundId = sounds[math.random(1, #sounds)]
        s.Volume = 0.03 * (0.9 + math.random() * 0.2) -- slight volume variation
        s.PlaybackSpeed = 1.0 + (math.random() - 0.5) * 0.1 -- pitch variation
        s.RollOffMode = Enum.RollOffMode.Linear
        s.RollOffMinDistance = 7; s.RollOffMaxDistance = 13
        s:Play()
        Debris:AddItem(s, 0.5)
      end
    end
    task.wait(waitTime)
  end
- Walking detection: Humanoid.Running:Connect(function(speed) walking = speed > Humanoid.WalkSpeed / 2 end)
- Ambient sounds: Loop Sound in SoundService with Looped = true. Volume 0.3-0.5. Crossfade between day/night ambiance using Lighting.TimeOfDay changes.
- Common mistake: Creating new Sound instances every footstep without cleanup — memory leak. Use Debris:AddItem(sound, duration).
- Common mistake: Not varying pitch/volume — sounds robotic. Add +/- 10% random variation.
- Common mistake: Footstep sounds stacking when walking fast — use debounce or speed-based wait time.

SWIMMING AND WATER MECHANICS:
- Water detection (terrain voxel method):
  local function isUnderwater(headPos)
    local offset = Vector3.new(1, 1, 1)
    local region = Region3.new(headPos - offset, headPos + offset):ExpandToGrid(4)
    local materials = workspace.Terrain:ReadVoxels(region, 4)
    for _, row in pairs(materials) do
      for _, col in pairs(row) do
        for _, mat in pairs(col) do
          if mat == Enum.Material.Water then return true end
        end
      end
    end
    return false
  end
- Water detection (part-based): Tag water parts with CollectionService. Use GetPartBoundsInBox or Touched event to detect when character enters water zone.
- Buoyancy formula: Buoyant Force = fluid density * submerged volume * gravity. In Roblox: VectorForce.Force = Vector3.new(0, character mass * workspace.Gravity, 0) when submerged. Apply to HumanoidRootPart via VectorForce attached to Attachment.
- Simple buoyancy pattern:
  local waterSurfaceY = waterPart.Position.Y + waterPart.Size.Y / 2
  local charY = HumanoidRootPart.Position.Y
  if charY < waterSurfaceY then
    -- apply upward force proportional to depth
    local depthPercent = math.clamp((waterSurfaceY - charY) / 10, 0, 1)
    vectorForce.Force = Vector3.new(0, characterMass * workspace.Gravity * depthPercent, 0)
  end
- Swim state: humanoid:SetStateEnabled(Enum.HumanoidStateType.Swimming, true). Disable conflicting states (Jumping, Freefall) while in water.
- Oxygen system (server-side):
  local maxOxygen = 1000
  local decreaseRate = 2 -- per tick
  local increaseRate = 3 -- per tick when above water
  while true do
    task.wait()
    if isUnderwater(character.Head.Position) then
      oxygenValue.Value = math.clamp(oxygenValue.Value - decreaseRate, 0, maxOxygen)
      if oxygenValue.Value <= 0 then
        humanoid:TakeDamage(5) -- drowning damage
      end
    else
      oxygenValue.Value = math.clamp(oxygenValue.Value + increaseRate, 0, maxOxygen)
    end
  end
- Oxygen bar GUI: TweenSize the bar frame: Bar:TweenSize(UDim2.new(oxygenValue.Value / maxOxygen, 0, 1, 0)). Show text: "750/1000".
- Swimmable water module pattern: Use CollectionService tags on water parts. Client detects entry/exit. Apply VectorForce for buoyancy. Override humanoid states. Disable jumping (replace with swim-up on Spacebar/ButtonA).
- Common mistake: Using BodyForce (deprecated) — use VectorForce or AlignPosition instead.
- Common mistake: Checking if player is IN water vs UNDER water — players floating on surface need different behavior than fully submerged.
- Common mistake: Not handling mobile/console inputs — swim-up needs Spacebar AND touch/gamepad alternatives.

FLYING AND JETPACK SYSTEMS:
- Modern approach: Use LinearVelocity (NOT deprecated BodyVelocity).
  local linearVelocity = Instance.new("LinearVelocity")
  linearVelocity.Attachment0 = HumanoidRootPart:FindFirstChild("RootAttachment")
  linearVelocity.MaxForce = math.huge
  linearVelocity.VelocityConstraintMode = Enum.VelocityConstraintMode.Vector
  linearVelocity.RelativeTo = Enum.ActuatorRelativeTo.World
  linearVelocity.Parent = HumanoidRootPart
- Legacy BodyVelocity approach (still common in tutorials):
  local bv = Instance.new("BodyVelocity")
  bv.MaxForce = Vector3.new(math.huge, math.huge, math.huge)
  bv.Velocity = lookVector * 60 -- 60 studs/s
  bv.Parent = HumanoidRootPart
- Glider pattern:
  Tool.Activated:Connect(function()
    Humanoid.PlatformStand = true -- CRITICAL: prevents jitter
    local bv = BodyVelocity:Clone()
    bv.Parent = Torso
    while flying do
      bv.Velocity = Mouse.Hit.lookVector * 60
      Root.CFrame = CFrame.new(Root.Position, Root.Position + Mouse.Hit.LookVector)
      task.wait()
    end
    bv:Destroy()
    Humanoid.PlatformStand = false
  end)
- Jetpack with AlignPosition:
  local jetpackHeight = 20
  local alignPosition = Instance.new("AlignPosition")
  alignPosition.Mode = Enum.PositionAlignmentMode.OneAttachment
  alignPosition.Attachment0 = RootAttachment
  alignPosition.Position = HumanoidRootPart.Position + Vector3.new(0, jetpackHeight, 0)
  alignPosition.Parent = HumanoidRootPart
  -- For axis locking: add PlaneConstraint to restrict to Y-axis movement
- Fuel system:
  local maxFuel = 100
  local fuel = maxFuel
  local fuelDrainRate = 1 -- per 0.1 seconds
  Tool.Activated:Connect(function()
    flying = true
    thrustForce.Force = Vector3.new(0, 7000, 0) -- upward thrust
    while flying and fuel > 0 do
      task.wait(0.1)
      fuel -= fuelDrainRate
      fuelBar.Size = UDim2.new(fuel / maxFuel, 0, 1, 0)
    end
    if fuel <= 0 then flying = false end
  end)
  Tool.Deactivated:Connect(function()
    flying = false
    thrustForce.Force = Vector3.new(0, 0, 0)
  end)
- Hover mechanics: Raycast downward from character. If ground distance < targetHeight, apply upward force. If > targetHeight, reduce force. Lerp smoothly.
- Common mistake: Not setting PlatformStand = true during flight — humanoid auto-corrects orientation causing jitter.
- Common mistake: BodyVelocity MaxForce too low — character barely moves. Use math.huge for all axes.
- Common mistake: Not destroying physics objects on unequip — player keeps flying after removing jetpack.
- Common mistake: Client-only flight — server doesn't know player is flying, anti-cheat flags them.

PROCEDURAL DUNGEON GENERATION:
- Room-based generation (most common approach):
  1. Create 2D grid of cells (e.g., 50x50).
  2. Place rooms randomly with overlap rejection.
  3. Connect rooms with corridors.
  4. Add doors at room-corridor junctions.
  5. Clean up dead-end corridors.
- Cell data structure:
  Cell = { x, y, Visited = false, isRoom = false, availDirs = {N=true, E=true, S=true, W=true}, Door = false, isPath = false }
- Room placement (brute force):
  local MAX_ROOM_TRIES = 300
  local MAX_ROOMS = 3
  local MIN_ROOM_SIZE = {x=3, y=3}
  local MAX_ROOM_SIZE = {x=8, y=8}
  local ROOM_BORDER_LENIANCY = 3 -- minimum spacing between rooms
  for i = 1, MAX_ROOM_TRIES do
    local w = math.random(MIN_ROOM_SIZE.x, MAX_ROOM_SIZE.x)
    local h = math.random(MIN_ROOM_SIZE.y, MAX_ROOM_SIZE.y)
    local x = math.random(1, gridWidth - w)
    local y = math.random(1, gridHeight - h)
    if not overlapsExistingRoom(x, y, w, h, ROOM_BORDER_LENIANCY) then
      placeRoom(x, y, w, h)
      roomCount += 1
      if roomCount >= MAX_ROOMS then break end
    end
  end
- Corridor generation (Recursive Backtracker / DFS maze):
  Start from random unvisited cell. Mark visited. Pick random unvisited neighbor. Remove wall between them. Push to stack. If no unvisited neighbors, backtrack (pop stack). Repeat until stack empty.
- Advanced: Delaunay + MST + A* approach:
  1. Scatter rooms on 3D grid using rejection sampling (2-tile buffer zone).
  2. Run Delaunay triangulation on room centers (creates full connection graph).
  3. Extract MST using Prim's algorithm (minimum connections to reach all rooms).
  4. Add random non-MST edges for loops (prevents "one long chain" feel).
  5. A* pathfind each corridor through voxel grid (supports stairs for multi-floor).
  6. Place walls, doors, stairs.
- Door placement: For each room, select 2 "outsider" cells (cells on room boundary adjacent to corridor). Remove wall between outsider and corridor cell. Mark as Door.
- GRIDS module: All-in-one generator supporting Caves, Dungeons, and Mazes. Modular and customizable.
- Roblox implementation: Pre-build room Models in Studio. Clone and position at grid coordinates. Connect with corridor parts. Use Folder hierarchy: Dungeon > Rooms > Room1, Room2... > Corridors.
- Common mistake: Rooms generating outside grid bounds — always clamp coordinates.
- Common mistake: Corridors not connecting all rooms — validate connectivity with flood fill.
- Common mistake: Not enough room spacing — ROOM_BORDER_LENIANCY of 3+ prevents cramped layouts.
- Common mistake: Performance on large grids — generate during loading screen, not at runtime.

SEASON PASS AND BATTLE PASS:
- Roblox official Season Pass Feature Package (Beta, March 2025):
  Uses standard DataStore (key "BloxKitStore"). Dual tracks: Free + Premium. Customizable: pricing, UI, season duration, mission availability, XP per level, reward types.
  Requires Feature Package Core dependency. Reward via callback: register function that runs when player earns reward (custom implementation for tools, currency, cosmetics).
- Custom battle pass data structure:
  local BattlePassData = {
    tier = 1, -- current tier (1-50 typical)
    xp = 0, -- current XP in tier
    isPremium = false, -- bought premium track
    claimedFree = {}, -- {[tier] = true}
    claimedPremium = {}, -- {[tier] = true}
  }
- XP curve (exponential): local xpRequired = 100 * tier^1.2 -- tier 1 = 100 XP, tier 10 = 1585 XP, tier 50 = 13182 XP
- XP curve (linear): local xpRequired = 100 + (tier - 1) * 50 -- tier 1 = 100, tier 10 = 550, tier 50 = 2550
- Tier structure (typical):
  50 tiers total. Free track: reward every 5 tiers (10 free rewards). Premium track: reward every tier (50 rewards).
  Reward types: Currency, Cosmetics, Emotes, Tool skins, Title badges, Loot crates.
- XP sources: Match completion (100 XP), Win bonus (50 XP), Daily challenges (200-500 XP), Weekly challenges (1000-2000 XP), First game of day (300 XP).
- Daily/Weekly challenge system:
  Daily: 3 challenges, refresh every 24 hours. Simple tasks (play 3 games, deal 500 damage, collect 100 coins).
  Weekly: 3 challenges, refresh every 7 days. Harder tasks (win 10 games, reach wave 20, trade 5 times).
  Store challenge completion in DataStore. Reset on timer using os.time() checks.
- Season duration: 30-90 days typical. 60 days is most common. Store season end time in DataStore. Check on join if season expired.
- Premium purchase: MarketplaceService:PromptProductPurchase for DevProduct. On purchase: set isPremium = true in player data. Unlock all previously-earned premium tier rewards retroactively.
- GUI: Horizontal ScrollingFrame with tier boxes. Each box shows: tier number, free reward icon (top), premium reward icon (bottom, locked/golden border). Progress bar between tiers. XP text: "450/700 XP". Claim button per tier.
- Common mistake: Not saving XP on PlayerRemoving — player loses progress.
- Common mistake: XP curve too steep — players feel stuck after tier 20. Playtest the curve.
- Common mistake: Too few free rewards — F2P players lose interest. Give meaningful free rewards every 3-5 tiers.
- Common mistake: Season too short — 30 days pressures casual players. 60 days is the sweet spot.

MOBILE OPTIMIZATION:
- Part count limits: 15-20K parts safe for low-end mobile. 20-30K runs but may lag. 500K triangle budget, 500 draw call budget.
- Per-zone budget: allocate 40,000 triangles and 40 draw calls per zone.
- Memory: keep under 1.3GB client memory (2GB phones exist). 400-600MB ideal.
- Draw call killers: each ParticleEmitter = 1 draw call regardless of particle count. Transparent parts = extra draws. Unique TextureIds create separate draws. SurfaceGuis/BillboardGuis eat draws fast.
- ScreenGui.ScreenInsets: CoreUISafeInsets (default, excludes notch + Roblox top bar), DeviceSafeInsets (excludes hardware cutouts only), None (full screen for backgrounds).
- StreamingEnabled: StreamingMinRadius=64-128 for mobile. StreamingTargetRadius=128-192 for mobile (default 256). Lower = less memory.
- Key techniques:
  1. Mesh Instancing: reuse identical MeshIds + materials = engine batches into single draw call.
  2. Distance Culling: tag small details via CollectionService, remove beyond 300 studs, limit 50 checks/frame.
  3. Zone Visibility: hide non-visible zones by setting Part.Parent = nil.
  4. Client-Side VFX: create coins/effects exclusively on client via RemoteEvents (zero server replication).
  5. Spatial Hashing: divide world into 10-stud cells, check only 9 nearby cells for collision.
- CollisionFidelity: Box for small objects, Hull for medium, Precise ONLY for large complex meshes. Precise = memory hog.
- Transparent parts still consume full performance (transparency does NOT help).

ADVANCED CFRAME MATH:
- Constructors: CFrame.new(x,y,z) position only. CFrame.lookAt(pos, target) position+direction. CFrame.Angles(rx,ry,rz) rotation in RADIANS. CFrame.fromAxisAngle(axis, angle).
- CRITICAL: CFrame.Angles uses RADIANS not degrees. Use math.rad(90) for 90 degrees.
- Key operations: cf + Vector3 shifts position. parent * child combines CFrames. cf:Lerp(cf2, alpha) interpolates. cf:Inverse() inverts. cf:PointToWorldSpace(v) local→world. cf:PointToObjectSpace(v) world→local.
- CFrame.new(pos, lookAt) is DEPRECATED — use CFrame.lookAt(pos, target) instead.
- Circular placement:
  local center, radius, count = Vector3.new(0,0,0), 20, 12
  for i = 0, count-1 do
    local angle = (i/count) * math.pi * 2
    local x = center.X + radius * math.cos(angle)
    local z = center.Z + radius * math.sin(angle)
    part.CFrame = CFrame.lookAt(Vector3.new(x, center.Y, z), center)
  end
- Spiral placement: increment radius and Y per step along with angle.
- Multiply order matters: parent * child (NOT child * parent).
- Edge case: 180-degree rotation (dot < -0.99999) needs special handling with axis fallback.

CONSTRAINT PHYSICS:
- 13 constraint types:
  BallSocketConstraint: same position, free rotation on all axes (ragdoll shoulders/hips).
  HingeConstraint: rotation on ONE axis only, optional motor/servo (doors, rotating platforms).
  PrismaticConstraint: sliding along one axis, no rotation (elevators, sliding doors).
  CylindricalConstraint: slide + rotate on different axes (complex machinery).
  SpringConstraint: force based on spring/damper (suspension, elastic connections).
  TorsionSpringConstraint: torque based on relative angle (rotational resistance).
  UniversalConstraint: keeps two axes perpendicular (vehicle drive shafts).
  RopeConstraint: max distance limit, optional winch (tethers, grappling).
  RodConstraint: fixed distance between attachments (rigid linkages).
  PlaneConstraint: movement along a plane (2D gameplay).
  WeldConstraint: fixed relative position/orientation between BaseParts.
  RigidConstraint: fixed relative position between Attachments/Bones.
  NoCollisionConstraint: disable collision between two specific parts.
- All constraints need Attachment0 and Attachment1 (except WeldConstraint/NoCollisionConstraint which use Part0/Part1).
- Ragdoll: replace Motor6D joints with BallSocketConstraints. Set LimitsEnabled=true, UpperAngle=45, TwistLowerAngle=-45.
- CRITICAL: use NoCollisionConstraints between adjacent ragdoll limbs (they collide and explode without it).
- Disable HumanoidStateType or use AnimationController instead of Humanoid with ragdoll.

BEAM TRAIL AND PARTICLE EFFECTS:
- ParticleEmitter: Rate max 400/sec desktop, 100/sec mobile. Each emitter = 1 draw call.
- Key properties: Texture, Color(ColorSequence), Size(NumberSequence), Transparency(NumberSequence), Rotation, RotSpeed, LightEmission(0=normal,1=additive glow), Speed, Lifetime, Acceleration, Drag.
- Shape options: Box, Sphere, Cylinder, Disc. ShapeStyle: Volume or Surface.
- Flipbook: FlipbookLayout(Grid2x2/4x4/8x8), FlipbookFramerate(max 30fps), FlipbookMode(Loop/OneShot/PingPong).
- Beam setup: requires Attachment0 on part1 and Attachment1 on part2. Properties: Width0, Width1, Color, LightEmission, Texture, TextureSpeed, FaceCamera. Parent to part1.
- Trail setup: requires 2 Attachments on same moving part (one offset up, one down). Properties: Lifetime, MinLength, Color, Transparency. Part must MOVE to display trail.
- Common mistake: ParticleEmitter Rate capped at 100/sec on mobile — plan effects accordingly.
- Common mistake: Beams without FaceCamera look flat from certain angles.

PROXIMITYPROMPT BEST PRACTICES:
- Key properties: ActionText, ObjectText, KeyboardKeyCode(E), HoldDuration(0.5s), MaxActivationDistance(10 studs), RequiresLineOfSight(true), Exclusivity, Style.
- Custom UI: set Style=Enum.ProximityPromptStyle.Custom to hide default UI. Listen to PromptShown, PromptHidden, PromptButtonHoldBegan, PromptButtonHoldEnded events.
- Exclusivity modes: OnePerButton (one prompt per key), OneGlobally (one prompt total), AlwaysShow (all visible).
- HoldDuration=0 means instant trigger on key press. Use > 0 for interactive holds.
- Always handle gamepad/touch input types in custom UI.

DATA MIGRATION AND VERSIONING:
- Session locking: use UpdateAsync to atomically set SessionJobId = game.JobId. Check if already locked by another server. Stale lock timeout: 30 min (os.time() - timestamp > 1800).
- Schema versioning: store Version number in saved data. Define migration functions per version. On load: run all migrations from saved version to current version sequentially.
  local CURRENT_VERSION = 3
  local migrations = { [2] = function(data) data.Settings = {}; return data end, [3] = function(data) data.Achievements = {}; return data end }
- ProfileStore (successor to ProfileService): StartSessionAsync for session locking, :Reconcile() fills missing keys from template, auto-save every 300 seconds. The current community standard.
- NEVER use GetAsync/SetAsync separately — use UpdateAsync for atomic operations.
- Returning nil from UpdateAsync = no changes (does NOT erase data).
- DataStore v2.0 has built-in versioning and tagging via API headers.

ADMIN COMMAND SYSTEM:
- Chat parsing: listen to player.Chatted, check for prefix (! or /), split by space, first word = command name, rest = args.
- Command registry: ModuleScript with command table. Each command: { Level, Execute(admin, args) }.
- Permission levels: 0=all players (fun cmds), 1=moderators (tp, spectate, mute), 2=admins (kick, ban, give), 3=owner (shutdown, wipe).
- Common commands: kick, ban, tp, give, speed, fly, announce, shutdown, unban.
- Target player resolution: match partial name case-insensitive. Handle "me" and "all" as special targets.
- Existing systems: Adonis Admin (feature-rich), Basic Admin Essentials (common), custom preferred for production.

ACHIEVEMENT AND BADGE SYSTEM:
- BadgeService API: AwardBadge(userId, badgeId), UserHasBadgeAsync(userId, badgeId), GetBadgeInfoAsync(badgeId).
- ALWAYS pcall all BadgeService calls (network calls fail).
- SERVER-SIDE ONLY — never award from client.
- Limit: 5 free badges per 24 hours (GMT), additional cost 100 Robux each.
- Badge icon: 512x512px, content within circular bounds.
- Achievement tracking pattern: define achievements as table with check functions. On data change, iterate achievements and award unclaimed ones.
  local ACHIEVEMENTS = { {id=123, name="Rich", check=function(data) return data.Coins >= 1000 end} }
  function checkAchievements(player, data) for _,a in ACHIEVEMENTS do if a.check(data) then awardBadge(player, a.id) end end end

INVENTORY DRAG AND DROP:
- Use UserInputService for drag detection: InputBegan (start drag if over slot), InputChanged (move drag frame to cursor), InputEnded (drop on target slot or cancel).
- DragFrame pattern: clone the slot visual as a separate frame that follows cursor. NOT inside UIGridLayout (layouts prevent direct position manipulation). Actual slot stays in place.
- Grid snapping: swap LayoutOrder values. UIGridLayout automatically repositions based on LayoutOrder.
- Hit detection: use GuiObject.AbsolutePosition and AbsoluteSize to check cursor over slot.
- Handle BOTH mouse AND touch input (mobile players exist).
- Common mistake: trying to set Position on elements inside UIGridLayout (won't work — use LayoutOrder swap).

CUTSCENE AND CINEMATIC SYSTEM:
- Camera waypoints: place invisible Parts as waypoints numbered sequentially (CP_1, CP_2, etc).
- Bezier interpolation: quadratic(3 points) or cubic(4 points) for smooth camera paths.
  local function bezier4(t, p0, p1, p2, p3) return (1-t)^3*p0 + 3*(1-t)^2*t*p1 + 3*(1-t)*t^2*p2 + t^3*p3 end
- Camera path: each RenderStepped frame, calculate t = elapsed/duration, interpolate position, use CFrame.lookAt for target.
- CutsceneService module: :Create(waypointFolder, duration, easingStyle), supports queue, loop, freeze character, disable controls.
- ALWAYS provide skip button on cutscenes (TextButton → cutscene:Cancel() → restore camera.CameraType = Custom).
- Use EasingStyle.Sine or Quad for natural camera movement (not Linear — feels robotic).

WEATHER SYSTEM ADVANCED:
- Rain: invisible Part above player head (client-side), attach ParticleEmitter pointing down. Rate=200-400, Speed=50-80, Lifetime=1-2s, Texture=rain streak. Move rain part with player each frame.
- Snow: same as rain but slower Speed(5-15), larger Size, add RotSpeed for tumbling effect.
- Lightning: thin stretched cylinder bolt from sky. Flash: set Lighting.Brightness=3, wait 0.05, =0.5, wait 0.1, =2, wait 0.05, =1 (restore). Optional fire at strike point.
- Weather transition: tween FogEnd, Brightness, Ambient, FogColor over duration. Tween rain particle Rate from 0 to target.
- Wind: Workspace.GlobalWind = Vector3 value. ParticleEmitter.WindAffectsDrag=true when Drag>0. Animate tree meshes with sine wave.
- Snow accumulation: slowly paint white terrain or lower terrain snow parts over time.

MATCHMAKING SYSTEM:
- Cross-server: use MemoryStoreService:GetSortedMap("MatchQueue") for queue. SetAsync to join, GetRangeAsync to check for enough players, RemoveAsync on match found.
- Match flow: player joins queue → host server polls queue → when enough players found → TeleportService:ReserveServer(placeId) → MessagingService:PublishAsync to notify each server → each server teleports their player to reserved server.
- ELO matching: BASE_ELO_RANGE = 100, expands by 50 per 30 seconds waiting. isEloMatch = math.abs(elo1 - elo2) <= BASE + (waitTime/30)*50.
- MemoryStore entries auto-expire (set 300s TTL) — handles disconnected players.
- MessagingService for cross-server communication (1KB message limit, 150 messages/min).

PERFORMANCE OPTIMIZATION:
- Frame time budget: 16.67ms per frame for 60 FPS. Target 15-20ms CPU, 15-20ms GPU.
- Debug tools: Ctrl+F2 (scene stats), Ctrl+F6 (MicroProfiler), Ctrl+F7 (memory/bandwidth), Shift+F2 (draw calls), F9 (console).
- Object pooling: pre-create N instances, hide at CFrame(0,-1000,0), Get = table.remove(pool), Return = CFrame below world + table.insert. NEVER Destroy pooled objects.
- Optimization priority: 1.Enable StreamingEnabled 2.Reduce draw calls via mesh instancing 3.Anchor/simplify physics 4.Throttle RunService callbacks 5.Clean up connections 6.Run NPC anims client-side 7.Reduce shadow/light complexity 8.Minimize network traffic.
- Humanoid optimization: disable unused HumanoidStateTypes. Use AnimationController for static NPCs. Play NPC animations on client only. Pool NPC models.
- Network: 30 TPS transfer rate. ~50kbps per player (~1706 bytes per transfer). Never fire RemoteEvents every frame. Send only state changes.
- Texture memory = pixel count (NOT disk size). 512x512 max for large textures. 256x256 or less for minor images.
- Physics: use adaptive stepping (default). Anchor static parts. CollisionFidelity Box for small, Hull for medium, Precise only large complex.
- Server tick: Roblox targets 30 Hz. 10 NPCs pathfinding simultaneously = 20% degradation. Sleep AI when no player nearby. Run pathfinding every 0.5-1.5s, NOT every frame.

TOP GAME ARCHITECTURES:
- Core principle: "The bigger the vision, the smaller the simulation must become." Worlds appear massive while servers simulate only a tiny active region.
- Spatial partitioning: divide world into 100x100 stud chunks. Activate nearby chunks, deactivate distant. Reduces server load 40-70%.
- Combat (Blox Fruits style): Client detects input → plays animation locally → sends to server. Server validates → performs hitbox/raycast → applies damage → broadcasts results to all clients. Never trust client for damage.
- Pet system (Adopt Me style): Pets as server-side DATA only (no Humanoids). Zero movement replication. Client calculates positions with raycasts + PivotTo(). Supports 30 pets/player.
- ECS pattern: CollectionService tags as components. Systems iterate over tagged entities. Hybrid: Humanoid physics + ECS tags for game logic.
- Network architecture: 30 TPS, ~50kbps per player. Only send state changes. Batch instance creation across frames. Use object registry (IDs not full objects).
- Scale numbers: Adopt Me peak 1.6M concurrent. Roblox supports 30M+ concurrent overall.
`

// ── Section Tags for Matching ───────────────────────────────────────────────

interface ScriptingSection {
  name: string
  keywords: string[]
  startMarker: string
  endMarker: string
}

const SCRIPTING_SECTIONS: ScriptingSection[] = [
  {
    name: 'terrain_generation',
    keywords: [
      'terrain', 'generate terrain', 'procedural', 'perlin', 'noise', 'biome',
      'fillblock', 'fillball', 'writevoxels', 'heightmap', 'voxel', 'chunk',
      'island', 'mountain', 'world generation', 'map generation',
    ],
    startMarker: 'TERRAIN GENERATION:',
    endMarker: 'ANTI-CHEAT PATTERNS:',
  },
  {
    name: 'anti_cheat',
    keywords: [
      'anti cheat', 'anti-cheat', 'anticheat', 'exploit', 'hack', 'cheat',
      'speed hack', 'fly hack', 'noclip', 'validation', 'server authority',
      'rate limit', 'remote security', 'sanity check', 'kick', 'ban',
    ],
    startMarker: 'ANTI-CHEAT PATTERNS:',
    endMarker: 'CAMERA SYSTEMS:',
  },
  {
    name: 'camera',
    keywords: [
      'camera', 'cutscene', 'cinematic', 'third person', 'first person',
      'top down', 'isometric', 'camera shake', 'zoom', 'fov', 'field of view',
      'scriptable camera', 'camera manipulation', 'over shoulder', 'ots',
    ],
    startMarker: 'CAMERA SYSTEMS:',
    endMarker: 'TOOL AND WEAPON SYSTEMS:',
  },
  {
    name: 'weapons',
    keywords: [
      'weapon', 'tool', 'sword', 'gun', 'melee', 'ranged', 'hitbox',
      'raycast', 'damage', 'combat', 'shoot', 'projectile', 'ammo',
      'reload', 'equip', 'backpack', 'inventory weapon',
    ],
    startMarker: 'TOOL AND WEAPON SYSTEMS:',
    endMarker: 'NPC SYSTEMS:',
  },
  {
    name: 'npc',
    keywords: [
      'npc', 'pathfinding', 'pathfind', 'patrol', 'wander', 'chase',
      'enemy ai', 'guard', 'shopkeeper', 'quest giver', 'proximity prompt',
      'waypoint', 'simplepath', 'mob', 'monster', 'villager',
    ],
    startMarker: 'NPC SYSTEMS:',
    endMarker: 'BUILDING AND PLACEMENT SYSTEM:',
  },
  {
    name: 'placement',
    keywords: [
      'placement', 'building system', 'grid', 'snap', 'place', 'furniture',
      'plot', 'tycoon', 'build mode', 'ghost preview', 'blueprint',
      'player build', 'block place', 'destroy block',
    ],
    startMarker: 'BUILDING AND PLACEMENT SYSTEM:',
    endMarker: 'TELEPORTSERVICE:',
  },
  {
    name: 'teleport',
    keywords: [
      'teleport', 'teleportservice', 'teleportasync', 'reserved server',
      'private server', 'place to place', 'lobby', 'matchmaking',
      'teleport data', 'join data',
    ],
    startMarker: 'TELEPORTSERVICE:',
    endMarker: 'SOUND DESIGN PATTERNS:',
  },
  {
    name: 'sound',
    keywords: [
      'sound', 'music', 'audio', 'footstep', 'ambient', 'sfx',
      'sound effect', 'spatial audio', 'soundservice', 'soundgroup',
      'volume', 'crossfade', 'soundtrack', 'noise',
    ],
    startMarker: 'SOUND DESIGN PATTERNS:',
    endMarker: 'SWIMMING AND WATER MECHANICS:',
  },
  {
    name: 'swimming',
    keywords: [
      'swim', 'swimming', 'water', 'underwater', 'buoyancy', 'float',
      'oxygen', 'drowning', 'dive', 'aquatic', 'ocean mechanic',
    ],
    startMarker: 'SWIMMING AND WATER MECHANICS:',
    endMarker: 'FLYING AND JETPACK SYSTEMS:',
  },
  {
    name: 'flying',
    keywords: [
      'fly', 'flying', 'flight', 'jetpack', 'glider', 'hover', 'wing',
      'paraglider', 'rocket', 'thrust', 'fuel', 'airborne', 'soar',
    ],
    startMarker: 'FLYING AND JETPACK SYSTEMS:',
    endMarker: 'PROCEDURAL DUNGEON GENERATION:',
  },
  {
    name: 'dungeon',
    keywords: [
      'dungeon', 'procedural generation', 'random map', 'roguelike',
      'random rooms', 'corridor', 'maze', 'backrooms', 'cave system',
      'room generation', 'dungeon crawler',
    ],
    startMarker: 'PROCEDURAL DUNGEON GENERATION:',
    endMarker: 'SEASON PASS AND BATTLE PASS:',
  },
  {
    name: 'battlepass',
    keywords: [
      'battle pass', 'battlepass', 'season pass', 'tier', 'xp progression',
      'season', 'premium track', 'free track', 'daily challenge',
      'weekly challenge', 'rewards', 'season rewards',
    ],
    startMarker: 'SEASON PASS AND BATTLE PASS:',
    endMarker: 'MOBILE OPTIMIZATION:',
  },
  {
    name: 'mobile_optimization',
    keywords: [
      'mobile', 'optimization', 'performance', 'lag', 'fps', 'streaming',
      'streamingenabled', 'draw call', 'low end', 'phone', 'tablet',
      'touch', 'safe area', 'screen insets',
    ],
    startMarker: 'MOBILE OPTIMIZATION:',
    endMarker: 'ADVANCED CFRAME MATH:',
  },
  {
    name: 'cframe_math',
    keywords: [
      'cframe', 'rotation', 'position', 'lookat', 'angles', 'radians',
      'circular', 'spiral', 'lerp', 'interpolate', 'orient', 'transform',
      'axis angle', 'quaternion',
    ],
    startMarker: 'ADVANCED CFRAME MATH:',
    endMarker: 'CONSTRAINT PHYSICS:',
  },
  {
    name: 'constraints',
    keywords: [
      'constraint', 'rope', 'spring', 'hinge', 'ball socket', 'prismatic',
      'weld', 'ragdoll', 'physics', 'joint', 'motor6d', 'attachment',
      'rod', 'cylindrical', 'universal',
    ],
    startMarker: 'CONSTRAINT PHYSICS:',
    endMarker: 'BEAM TRAIL AND PARTICLE EFFECTS:',
  },
  {
    name: 'effects',
    keywords: [
      'beam', 'trail', 'particle', 'emitter', 'effect', 'vfx',
      'sparkle', 'aura', 'glow', 'explosion', 'confetti', 'fire',
      'smoke', 'light emission', 'flipbook',
    ],
    startMarker: 'BEAM TRAIL AND PARTICLE EFFECTS:',
    endMarker: 'PROXIMITYPROMPT BEST PRACTICES:',
  },
  {
    name: 'proximity_prompt',
    keywords: [
      'proximity', 'prompt', 'interact', 'press e', 'hold',
      'proximityprompt', 'action text', 'custom prompt',
    ],
    startMarker: 'PROXIMITYPROMPT BEST PRACTICES:',
    endMarker: 'DATA MIGRATION AND VERSIONING:',
  },
  {
    name: 'data_migration',
    keywords: [
      'migration', 'version', 'schema', 'session lock', 'profileservice',
      'profilestore', 'data update', 'data version', 'reconcile',
    ],
    startMarker: 'DATA MIGRATION AND VERSIONING:',
    endMarker: 'ADMIN COMMAND SYSTEM:',
  },
  {
    name: 'admin_commands',
    keywords: [
      'admin', 'command', 'kick', 'ban', 'chat command', 'prefix',
      'permission', 'moderator', 'admin system', 'adonis',
    ],
    startMarker: 'ADMIN COMMAND SYSTEM:',
    endMarker: 'ACHIEVEMENT AND BADGE SYSTEM:',
  },
  {
    name: 'achievements',
    keywords: [
      'achievement', 'badge', 'badgeservice', 'award', 'trophy',
      'milestone', 'unlock', 'progress badge',
    ],
    startMarker: 'ACHIEVEMENT AND BADGE SYSTEM:',
    endMarker: 'INVENTORY DRAG AND DROP:',
  },
  {
    name: 'drag_drop_inventory',
    keywords: [
      'drag', 'drop', 'drag and drop', 'inventory drag', 'slot swap',
      'grid inventory', 'item drag', 'layout order',
    ],
    startMarker: 'INVENTORY DRAG AND DROP:',
    endMarker: 'CUTSCENE AND CINEMATIC SYSTEM:',
  },
  {
    name: 'cutscene',
    keywords: [
      'cutscene', 'cinematic', 'camera path', 'bezier', 'camera animation',
      'intro', 'outro', 'scripted camera', 'waypoint camera',
    ],
    startMarker: 'CUTSCENE AND CINEMATIC SYSTEM:',
    endMarker: 'WEATHER SYSTEM ADVANCED:',
  },
  {
    name: 'weather',
    keywords: [
      'weather', 'rain', 'snow', 'storm', 'lightning', 'fog',
      'wind', 'dynamic weather', 'thunder', 'blizzard',
    ],
    startMarker: 'WEATHER SYSTEM ADVANCED:',
    endMarker: 'MATCHMAKING SYSTEM:',
  },
  {
    name: 'matchmaking',
    keywords: [
      'matchmaking', 'queue', 'elo', 'mmr', 'ranked', 'skill based',
      'match', 'cross server', 'reserved server', 'lobby queue',
    ],
    startMarker: 'MATCHMAKING SYSTEM:',
    endMarker: 'PERFORMANCE OPTIMIZATION:',
  },
  {
    name: 'performance',
    keywords: [
      'performance', 'optimize', 'lag', 'fps', 'microprofiler',
      'memory', 'pool', 'object pool', 'draw call', 'heartbeat',
      'frame time', 'budget', 'instance count',
    ],
    startMarker: 'PERFORMANCE OPTIMIZATION:',
    endMarker: 'TOP GAME ARCHITECTURES:',
  },
  {
    name: 'game_architectures',
    keywords: [
      'architecture', 'scale', 'chunk', 'spatial', 'ecs', 'adopt me',
      'blox fruits', 'large scale', 'open world', 'network architecture',
      'server design', 'game design pattern',
    ],
    startMarker: 'TOP GAME ARCHITECTURES:',
    endMarker: '(END)',
  },
]

// ── Relevance Matching Function ─────────────────────────────────────────────

/**
 * Returns only the scripting knowledge sections relevant to the user's prompt.
 * Matches keywords against the lowercased prompt. Returns max 3 sections.
 */
export function getRelevantScriptingKnowledge(prompt: string): string {
  const lower = prompt.toLowerCase()

  const scored = SCRIPTING_SECTIONS.map((section) => {
    let score = 0
    for (const kw of section.keywords) {
      if (lower.includes(kw)) {
        score += kw.includes(' ') ? 3 : 1
      }
    }
    return { section, score }
  })

  scored.sort((a, b) => b.score - a.score)

  const selected = scored.filter((s) => s.score > 0).slice(0, 3)

  if (selected.length === 0) {
    return '' // no match — don't inject scripting knowledge
  }

  return extractScriptingSections(selected.map((s) => s.section))
}

function extractScriptingSections(sections: ScriptingSection[]): string {
  const fullText = DEVFORUM_SCRIPTING_KNOWLEDGE
  const parts: string[] = [
    '=== SCRIPTING KNOWLEDGE (matched to your request) ===\n',
  ]

  for (const section of sections) {
    const startIdx = fullText.indexOf(section.startMarker)
    if (startIdx === -1) continue

    let endIdx: number
    if (section.endMarker === '(END)') {
      endIdx = fullText.length
    } else {
      endIdx = fullText.indexOf(section.endMarker, startIdx)
      if (endIdx === -1) endIdx = fullText.length
    }

    parts.push(fullText.slice(startIdx, endIdx).trim())
    parts.push('')
  }

  return parts.join('\n')
}
