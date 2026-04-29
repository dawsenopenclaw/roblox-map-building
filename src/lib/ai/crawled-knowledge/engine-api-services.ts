// Roblox Engine API — Services
// Crawled from create.roblox.com/docs/reference/engine — Apr 29 2026
// Contains: DataStoreService, TweenService, RemoteEvent, RemoteFunction,
//           UserInputService, MarketplaceService, PathfindingService, SoundService

export const ENGINE_API_SERVICES = `
=== DataStoreService ===
Provides persistent data storage across game sessions. Server-side only.
Accessed as game:GetService("DataStoreService").

METHODS:
  DataStoreService:GetDataStore(name, scope?) → DataStore
  DataStoreService:GetGlobalDataStore() → DataStore
  DataStoreService:GetOrderedDataStore(name, scope?) → OrderedDataStore
  DataStoreService:GetRequestBudgetForRequestType(requestType) → number
  DataStoreService:ListDataStoresAsync(prefix?, pageSize?, cursor?) → DataStoreListingPages

DataStore METHODS (returned from GetDataStore):
  dataStore:GetAsync(key: string) → any           -- yields
  dataStore:SetAsync(key: string, value, userIds?, options?) → DataStoreKeyInfo  -- yields
  dataStore:UpdateAsync(key: string, transformFunc: (old, keyInfo) → any) → (any, DataStoreKeyInfo)  -- yields
  dataStore:RemoveAsync(key: string) → (any, DataStoreKeyInfo)  -- yields
  dataStore:IncrementAsync(key: string, delta?: number, userIds?, options?) → number  -- yields
  dataStore:ListKeysAsync(prefix?, pageSize?, cursor?, excludeDeleted?) → DataStoreKeyPages  -- yields
  dataStore:GetVersionAsync(key, version) → (any, DataStoreKeyInfo)  -- yields

OrderedDataStore METHODS:
  orderedDS:GetSortedAsync(ascending, pageSize, minValue?, maxValue?) → DataStorePages

COMMON PATTERNS:
  local DS = game:GetService("DataStoreService")
  local playerData = DS:GetDataStore("PlayerData")

  -- Save data
  local success, err = pcall(function()
    playerData:SetAsync(tostring(player.UserId), {
      coins = 100, level = 5
    })
  end)

  -- Load data with default
  local data
  local success, err = pcall(function()
    data = playerData:GetAsync(tostring(player.UserId))
  end)
  data = data or { coins = 0, level = 1 }

  -- UpdateAsync (safe for concurrent updates)
  playerData:UpdateAsync(tostring(userId), function(oldData)
    oldData = oldData or { coins = 0 }
    oldData.coins += 50
    return oldData
  end)

  -- Save on PlayerRemoving
  game:GetService("Players").PlayerRemoving:Connect(function(player)
    local success, err = pcall(function()
      playerData:SetAsync(tostring(player.UserId), getPlayerData(player))
    end)
    if not success then warn("Save failed:", err) end
  end)

  -- Leaderboard with OrderedDataStore
  local leaderboard = DS:GetOrderedDataStore("Coins")
  leaderboard:SetAsync(tostring(userId), coins)
  local pages = leaderboard:GetSortedAsync(false, 10)  -- top 10 descending
  local entries = pages:GetCurrentPage()
  for rank, entry in ipairs(entries) do
    print(rank, entry.key, entry.value)
  end

=== TweenService ===
Creates smooth property animations. Supports numbers, Vector3, CFrame, Color3, UDim2, etc.
Accessed as game:GetService("TweenService").

TweenInfo CONSTRUCTOR:
  TweenInfo.new(
    duration: number,                           -- seconds
    easingStyle: Enum.EasingStyle,              -- Linear|Quad|Cubic|Quart|Quint|Bounce|Elastic|Exponential|Sine|Back|Circular
    easingDirection: Enum.EasingDirection,      -- In|Out|InOut
    repeatCount: number,                        -- 0=once, -1=infinite
    reverses: boolean,                          -- ping-pong
    delayTime: number                           -- start delay
  )

METHODS:
  TweenService:Create(instance, tweenInfo, propertyTable) → Tween
  TweenService:GetValue(alpha, easingStyle, easingDirection) → number
  TweenService:SmoothDamp(current, target, velocity, smoothTime, maxSpeed?, dt?) → (result, newVelocity)

Tween METHODS:
  tween:Play()
  tween:Pause()
  tween:Cancel()

Tween EVENTS:
  tween.Completed:Connect(function(playbackState) end)

COMMON PATTERNS:
  local TS = game:GetService("TweenService")

  -- Move part to position
  local info = TweenInfo.new(2, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
  local tween = TS:Create(part, info, { Position = Vector3.new(0, 20, 0) })
  tween:Play()
  tween.Completed:Wait()

  -- Color change
  TS:Create(part, TweenInfo.new(1), { Color = Color3.fromRGB(255, 0, 0) }):Play()

  -- Door open (rotate)
  TS:Create(door, TweenInfo.new(0.5, Enum.EasingStyle.Sine), {
    CFrame = door.CFrame * CFrame.Angles(0, math.rad(90), 0)
  }):Play()

  -- UI fade in
  TS:Create(frame, TweenInfo.new(0.3), { BackgroundTransparency = 0 }):Play()

  -- Loop animation
  local loopInfo = TweenInfo.new(1, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true)
  TS:Create(light, loopInfo, { Brightness = 0 }):Play()

  -- Lighting time of day
  TS:Create(game:GetService("Lighting"), TweenInfo.new(10), { ClockTime = 18 }):Play()

=== RemoteEvent ===
Asynchronous, one-way client↔server communication. Does not yield.
Store in ReplicatedStorage so both sides can access.

FIRING (from client → server):
  remoteEvent:FireServer(arg1, arg2, ...)
  -- Server receives: OnServerEvent(player, arg1, arg2, ...)

FIRING (from server → client):
  remoteEvent:FireClient(player, arg1, ...)      -- one player
  remoteEvent:FireAllClients(arg1, ...)           -- all players

LISTENING:
  -- Server Script:
  remoteEvent.OnServerEvent:Connect(function(player, ...) end)
  -- Client LocalScript:
  remoteEvent.OnClientEvent:Connect(function(...) end)

COMMON PATTERNS:
  -- Setup (in both server Script and client LocalScript):
  local RS = game:GetService("ReplicatedStorage")
  local Events = RS:WaitForChild("Events")

  -- Damage event (client tells server they hit something)
  -- Client:
  local DamageEvent = Events:WaitForChild("DamageEnemy")
  DamageEvent:FireServer(enemyId, 25)
  -- Server:
  DamageEvent.OnServerEvent:Connect(function(player, enemyId, damage)
    -- validate then apply
    applyDamage(enemyId, damage)
  end)

  -- UI update event (server tells client)
  -- Server:
  local UIUpdate = Events.UpdateUI
  UIUpdate:FireClient(player, { coins = 100, level = 5 })
  -- Client:
  UIUpdate.OnClientEvent:Connect(function(data)
    updateHUD(data)
  end)

  -- Broadcast to all (e.g. kill feed)
  Events.KillFeed:FireAllClients(killer.Name, victim.Name)

=== RemoteFunction ===
Synchronous, two-way client↔server communication. Caller yields until response.
Store in ReplicatedStorage.

INVOKE (client → server, yields):
  local result = remoteFunction:InvokeServer(arg1, arg2)
  -- Server OnServerInvoke(player, arg1, arg2) must return a value

INVOKE (server → client, yields — use sparingly):
  local result = remoteFunction:InvokeClient(player, arg1)
  -- Client OnClientInvoke(arg1) must return a value

CALLBACKS:
  -- Server Script:
  remoteFunction.OnServerInvoke = function(player, ...) return ... end
  -- Client LocalScript:
  remoteFunction.OnClientInvoke = function(...) return ... end

COMMON PATTERNS:
  -- Get server data (client requests)
  local GetData = RS:WaitForChild("GetPlayerData")
  -- Server:
  GetData.OnServerInvoke = function(player)
    return getPlayerData(player.UserId)
  end
  -- Client:
  local data = GetData:InvokeServer()
  print(data.coins, data.level)

  -- Purchase validation
  local PurchaseCheck = RS:WaitForChild("CanPurchase")
  PurchaseCheck.OnServerInvoke = function(player, itemId)
    local data = getPlayerData(player.UserId)
    local item = getItemCost(itemId)
    return data.coins >= item.cost
  end

  -- NOTE: Avoid InvokeClient — if client disconnects, server yields forever
  -- Prefer RemoteEvent for server→client communication

=== UserInputService ===
Detects device input (keyboard, mouse, touch, gamepad). Client-side only.
Accessed as game:GetService("UserInputService").

PROPERTIES:
  UIS.KeyboardEnabled: boolean   -- Has physical keyboard
  UIS.MouseEnabled: boolean      -- Has mouse
  UIS.TouchEnabled: boolean      -- Has touchscreen
  UIS.GamepadEnabled: boolean    -- Has gamepad
  UIS.VREnabled: boolean         -- In VR headset
  UIS.MouseBehavior: Enum.MouseBehavior  -- Default|LockCenter|LockCurrentPosition
  UIS.MouseIcon: string          -- Custom cursor asset ID
  UIS.MouseIconEnabled: boolean  -- Show/hide cursor
  UIS.MouseDeltaSensitivity: number  -- 0-10

METHODS:
  UIS:IsKeyDown(keyCode: Enum.KeyCode) → boolean
  UIS:IsMouseButtonPressed(button: Enum.UserInputType) → boolean
  UIS:GetMouseLocation() → Vector2
  UIS:GetMouseDelta() → Vector2   -- requires LockCenter
  UIS:GetKeysPressed() → InputObject[]
  UIS:GetLastInputType() → Enum.UserInputType
  UIS:IsGamepadButtonDown(pad, keyCode) → boolean
  UIS:GetConnectedGamepads() → UserInputType[]
  UIS:GetFocusedTextBox() → TextBox?

EVENTS:
  UIS.InputBegan:Connect(function(input: InputObject, gameProcessed: boolean) end)
  UIS.InputChanged:Connect(function(input: InputObject, gameProcessed: boolean) end)
  UIS.InputEnded:Connect(function(input: InputObject, gameProcessed: boolean) end)
  UIS.GamepadConnected:Connect(function(gamepadNum) end)
  UIS.GamepadDisconnected:Connect(function(gamepadNum) end)
  UIS.TouchStarted:Connect(function(touch, gameProcessed) end)
  UIS.TouchMoved:Connect(function(touch, gameProcessed) end)
  UIS.TouchEnded:Connect(function(touch, gameProcessed) end)
  UIS.JumpRequest:Connect(function() end)
  UIS.LastInputTypeChanged:Connect(function(inputType) end)

InputObject PROPERTIES:
  input.KeyCode: Enum.KeyCode       -- Key pressed (Enum.KeyCode.W, etc.)
  input.UserInputType: Enum.UserInputType  -- Mouse1|Mouse2|Keyboard|Touch|Gamepad1
  input.Position: Vector3           -- Mouse: screen pos X,Y; Gamepad: axis
  input.Delta: Vector3              -- Change since last frame

COMMON PATTERNS:
  local UIS = game:GetService("UserInputService")

  -- Key press detection
  UIS.InputBegan:Connect(function(input, gameProcessed)
    if gameProcessed then return end  -- don't fire if typing in chat
    if input.KeyCode == Enum.KeyCode.E then
      interactWithNearestObject()
    end
  end)

  -- Polling (in render loop)
  RS.RenderStepped:Connect(function()
    if UIS:IsKeyDown(Enum.KeyCode.W) then moveForward() end
  end)

  -- Mouse lock for FPS
  UIS.MouseBehavior = Enum.MouseBehavior.LockCenter
  local delta = UIS:GetMouseDelta()

  -- Detect device type for UI
  if UIS.TouchEnabled and not UIS.MouseEnabled then
    showMobileUI()
  end

=== MarketplaceService ===
Handles Robux transactions: developer products, game passes, subscriptions.
Server-side only for processing; prompts can be called from client.
Accessed as game:GetService("MarketplaceService").

METHODS:
  MPS:GetProductInfoAsync(assetId, infoType?) → Dictionary       -- yields
  MPS:UserOwnsGamePassAsync(userId, gamePassId) → boolean        -- yields
  MPS:PlayerOwnsAssetAsync(player, assetId) → boolean            -- yields
  MPS:PlayerOwnsBundleAsync(player, bundleId) → boolean          -- yields
  MPS:PromptGamePassPurchase(player, gamePassId)
  MPS:PromptProductPurchase(player, productId, equipIfPurchased?, currencyType?)
  MPS:PromptSubscriptionPurchase(player, subscriptionId)
  MPS:GetDeveloperProductsAsync() → Pages                        -- yields
  MPS:GetUserSubscriptionStatusAsync(player, subscriptionId) → Dictionary  -- yields

CALLBACK (required for dev products):
  MPS.ProcessReceipt = function(receiptInfo)
    -- receiptInfo: PlayerId, ProductId, PurchaseId, CurrencyType, CurrencySpent, PlaceIdWherePurchased
    -- Must return Enum.ProductPurchaseDecision.PurchaseGranted or NotProcessedYet
    local player = Players:GetPlayerByUserId(receiptInfo.PlayerId)
    if player then
      grantProduct(player, receiptInfo.ProductId)
      return Enum.ProductPurchaseDecision.PurchaseGranted
    end
    return Enum.ProductPurchaseDecision.NotProcessedYet
  end

EVENTS:
  MPS.PromptGamePassPurchaseFinished:Connect(function(player, passId, purchased) end)
  MPS.PromptProductPurchaseFinished:Connect(function(userId, productId, purchased) end)
  -- NOTE: These events are informational only; use ProcessReceipt for granting products

COMMON PATTERNS:
  local MPS = game:GetService("MarketplaceService")
  local Players = game:GetService("Players")

  -- Check game pass ownership (cache result)
  local VIPPASSID = 123456
  local function hasVIP(player)
    local success, owns = pcall(MPS.UserOwnsGamePassAsync, MPS, player.UserId, VIPPASSID)
    return success and owns
  end

  -- Prompt purchase on touch
  part.Touched:Connect(function(hit)
    local player = Players:GetPlayerFromCharacter(hit.Parent)
    if player then
      MPS:PromptGamePassPurchase(player, VIPPASSID)
    end
  end)

  -- Developer product receipt handler (Server Script)
  local PRODUCT_FUNCTIONS = {
    [987654] = function(player) giveCoins(player, 1000) end,
    [987655] = function(player) giveBoost(player) end,
  }
  MPS.ProcessReceipt = function(info)
    local player = Players:GetPlayerByUserId(info.PlayerId)
    if not player then return Enum.ProductPurchaseDecision.NotProcessedYet end
    local fn = PRODUCT_FUNCTIONS[info.ProductId]
    if fn then
      local ok, err = pcall(fn, player)
      if ok then return Enum.ProductPurchaseDecision.PurchaseGranted end
    end
    return Enum.ProductPurchaseDecision.NotProcessedYet
  end

=== PathfindingService ===
Computes navigation paths for NPCs/agents to navigate around obstacles.
Accessed as game:GetService("PathfindingService").

METHODS:
  PathfindingService:CreatePath(agentParams?) → Path
  PathfindingService:FindPathAsync(start, finish) → Path   -- yields (deprecated simple form)

AgentParameters TABLE:
  {
    AgentRadius = 2,        -- half-width clearance needed
    AgentHeight = 5,        -- vertical clearance needed
    AgentCanJump = true,    -- can jump over obstacles
    AgentCanClimb = false,  -- can climb TrussParts
    WaypointSpacing = 4,    -- distance between waypoints
    Costs = {               -- avoid certain materials (higher = costlier)
      Water = 20,
      Grass = 1,
    }
  }

Path METHODS:
  path:ComputeAsync(start: Vector3, finish: Vector3)  -- yields, computes waypoints
  path:GetWaypoints() → PathWaypoint[]
    -- PathWaypoint has: .Position (Vector3), .Action (Enum.PathWaypointAction: Walk|Jump)

Path EVENTS:
  path.Blocked:Connect(function(blockedWaypointIndex) end)
  path.Unblocked:Connect(function(unblockedWaypointIndex) end)

Path STATUS:
  path.Status  -- Enum.PathStatus: Success|NoPath|ClosestNoPath|ClosestOutOfRange

COMMON PATTERNS:
  local PFS = game:GetService("PathfindingService")

  local function moveNPCTo(npc, target)
    local humanoid = npc:FindFirstChildOfClass("Humanoid")
    local rootPart = npc:FindFirstChild("HumanoidRootPart")
    if not humanoid or not rootPart then return end

    local path = PFS:CreatePath({
      AgentRadius = 2,
      AgentHeight = 5,
      AgentCanJump = true,
    })

    local success, err = pcall(function()
      path:ComputeAsync(rootPart.Position, target)
    end)
    if not success or path.Status ~= Enum.PathStatus.Success then return end

    local waypoints = path:GetWaypoints()
    for _, wp in ipairs(waypoints) do
      if wp.Action == Enum.PathWaypointAction.Jump then
        humanoid:ChangeState(Enum.HumanoidStateType.Jumping)
      end
      humanoid:MoveTo(wp.Position)
      humanoid.MoveToFinished:Wait()
    end
  end

  -- Re-compute on blocked
  path.Blocked:Connect(function(idx)
    moveNPCTo(npc, targetPosition)  -- recompute
  end)

=== SoundService ===
Controls global audio settings and listener behavior.
Accessed as game:GetService("SoundService").

PROPERTIES:
  SoundService.AmbientReverb: Enum.ReverbType     -- Global reverb (NoReverb|SmallRoom|etc.)
  SoundService.DistanceFactor: number             -- Studs-to-meter conversion for 3D sound
  SoundService.DopplerScale: number               -- Doppler effect strength
  SoundService.RolloffScale: number               -- Volume distance falloff rate
  SoundService.VolumetricAudio: Enum.VolumetricAudio

METHODS:
  SoundService:PlayLocalSound(sound: Sound)        -- play for local client only
  SoundService:SetListener(listenerType, listener)
  SoundService:GetListener() → (ListenerType, listener)
  SoundService:GetMixerTime() → number

COMMON PATTERNS:
  local SS = game:GetService("SoundService")
  SS.AmbientReverb = Enum.ReverbType.Cave   -- cave reverb effect
  SS.RolloffScale = 1.5                     -- sounds fade faster with distance

  -- Play 2D sound (UI click, etc.)
  local clickSound = Instance.new("Sound")
  clickSound.SoundId = "rbxassetid://12345678"
  clickSound.Volume = 0.5
  SS:PlayLocalSound(clickSound)

  -- 3D spatial audio (parented to a part)
  local music = Instance.new("Sound")
  music.SoundId = "rbxassetid://87654321"
  music.RollOffMode = Enum.RollOffMode.Linear
  music.RollOffMinDistance = 10
  music.RollOffMaxDistance = 80
  music.Parent = speakerPart
  music:Play()

  -- Ambient reverb presets:
  -- Enum.ReverbType.NoReverb       — dry, no echo
  -- Enum.ReverbType.GenericReverb  — general indoor
  -- Enum.ReverbType.PaddedCell     — very dampened
  -- Enum.ReverbType.Room           — small room
  -- Enum.ReverbType.Bathroom       — hard tiles
  -- Enum.ReverbType.LivingRoom     — soft furnishings
  -- Enum.ReverbType.StoneRoom      — stone walls
  -- Enum.ReverbType.Auditorium     — large hall
  -- Enum.ReverbType.ConcertHall    — concert hall
  -- Enum.ReverbType.Cave           — underground cave
  -- Enum.ReverbType.Arena          — massive open arena
  -- Enum.ReverbType.Hangar         — aircraft hangar
  -- Enum.ReverbType.CarpetedHallway — hallway with carpet
  -- Enum.ReverbType.Hallway        — bare hallway
  -- Enum.ReverbType.StoneCorridor  — stone passage
  -- Enum.ReverbType.Alley          — outdoor alley
  -- Enum.ReverbType.Forest         — outdoor forest
  -- Enum.ReverbType.City           — outdoor city
  -- Enum.ReverbType.Mountains      — large open outdoors
  -- Enum.ReverbType.Quarry         — rocky open space
  -- Enum.ReverbType.Plain          — flat open ground
  -- Enum.ReverbType.ParkingLot     — outdoor concrete
  -- Enum.ReverbType.SewerPipe      — narrow tube
  -- Enum.ReverbType.Underwater     — submerged

=== RunService ===
Frame/physics loop bindings. Core timing service for gameplay loops.
Accessed as game:GetService("RunService").

PROPERTIES:
  RunService.Heartbeat   -- fires every frame, after physics (server + client)
  RunService.Stepped     -- fires every frame, before physics (server + client)
  RunService.RenderStepped -- fires before rendering (client LocalScript ONLY)
  RunService.IsRunMode: boolean
  RunService.IsStudio: boolean

EVENTS (all pass deltaTime in seconds):
  RunService.Heartbeat:Connect(function(dt: number) end)
  RunService.Stepped:Connect(function(time: number, dt: number) end)
  RunService.RenderStepped:Connect(function(dt: number) end)

BindToRenderStep (client-side ordering):
  RunService:BindToRenderStep(name: string, priority: number, callback: (dt) -> void)
  RunService:UnbindFromRenderStep(name: string)

  -- Priority constants (lower = runs earlier):
  Enum.RenderPriority.First.Value     = 100   -- before camera, before character
  Enum.RenderPriority.Input.Value     = 200   -- read input here
  Enum.RenderPriority.Camera.Value    = 300   -- camera updates
  Enum.RenderPriority.Character.Value = 400   -- character animations
  Enum.RenderPriority.Last.Value      = 2000  -- after everything

WHEN TO USE WHICH:
  RenderStepped  -> Client visuals, camera smoothing, UI that must be in sync with
                    the render frame. Blocks rendering until callback returns — keep it fast.
  Heartbeat      -> General per-frame logic on server or client, NOT camera-sensitive.
                    Runs after physics simulation. Good for moving NPCs, checking conditions.
  Stepped        -> Runs before physics. Use when you need to set forces/velocities
                    that must be resolved this frame (e.g. custom character controllers).
  BindToRenderStep -> When you need precise ordering relative to camera/input/character
                      on the client. Preferred over RenderStepped for custom camera work.

COMMON PATTERNS:
  local RunService = game:GetService("RunService")

  -- Server: NPC tick (Heartbeat, runs after physics)
  RunService.Heartbeat:Connect(function(dt)
    for _, npc in ipairs(activeNPCs) do
      npc:Tick(dt)
    end
  end)

  -- Client: smooth camera (BindToRenderStep, Camera priority)
  RunService:BindToRenderStep("CustomCamera", Enum.RenderPriority.Camera.Value, function(dt)
    updateCameraPosition(dt)
  end)

  -- Client: custom character controller (Stepped, before physics)
  RunService.Stepped:Connect(function(_, dt)
    applyMovementForces(character, dt)
  end)

  -- Cleanup on script destroy
  local conn = RunService.Heartbeat:Connect(myFunc)
  script.Destroying:Connect(function() conn:Disconnect() end)

  -- Wait for next frame
  RunService.Heartbeat:Wait()      -- yields until next Heartbeat
  RunService.RenderStepped:Wait()  -- yields until next RenderStepped (client only)

  -- IsRunning check (useful in Studio)
  if RunService:IsRunning() then
    -- game is live, not edit mode
  end

=== UserInputService — Extended Patterns ===
(See base UserInputService section above for properties/methods.)

InputBegan / InputEnded SIGNATURES:
  UIS.InputBegan:Connect(function(input: InputObject, gameProcessed: boolean)
    -- gameProcessed = true if Roblox UI consumed the input (chat box, CoreGui button)
    -- ALWAYS check: if gameProcessed then return end
    -- input.UserInputType values:
    --   Enum.UserInputType.Keyboard       -- key press
    --   Enum.UserInputType.MouseButton1   -- left click
    --   Enum.UserInputType.MouseButton2   -- right click
    --   Enum.UserInputType.MouseButton3   -- middle click
    --   Enum.UserInputType.MouseWheel     -- scroll
    --   Enum.UserInputType.MouseMovement  -- mouse moved
    --   Enum.UserInputType.Touch          -- touch screen
    --   Enum.UserInputType.Gamepad1..8    -- controller
  end)

TOUCH EVENTS:
  UIS.TouchTap:Connect(function(touchPositions: {Vector2}, gameProcessed: boolean)
    -- touchPositions[1] is the tap location on screen
    local pos = touchPositions[1]
    -- Use ViewportPointToRay to raycast from touch position
  end)

  UIS.TouchPinch:Connect(function(touchPositions: {Vector2}, scale: number,
                                   velocity: number, state: Enum.UserInputState,
                                   gameProcessed: boolean)
    -- scale: relative scale (1 = no change, >1 = pinch out / zoom in)
    -- velocity: rate of scale change
    -- state: Begin | Change | End | Cancel
    if state == Enum.UserInputState.Change then
      camera.FieldOfView = math.clamp(fov / scale, 30, 90)
    end
  end)

  UIS.TouchRotate:Connect(function(touchPositions, rotation, velocity, state, gameProcessed) end)
  UIS.TouchSwipe:Connect(function(swipeDir: Enum.SwipeDirection, numberOfTouches, gameProcessed) end)
    -- Enum.SwipeDirection: Up | Down | Left | Right

GetMouseLocation:
  local screenPos: Vector2 = UIS:GetMouseLocation()
  -- Returns absolute screen pixel position (no inset applied)
  -- For UI, use: gui:GetRelativeMousePosition() instead
  -- For 3D raycasting from mouse:
  local camera = workspace.CurrentCamera
  local unitRay = camera:ViewportPointToRay(screenPos.X, screenPos.Y)
  local result = workspace:Raycast(unitRay.Origin, unitRay.Direction * 500)

GAMEPAD PATTERNS:
  -- Check if any gamepad connected
  if UIS.GamepadEnabled then
    local pads = UIS:GetConnectedGamepads()
    -- pads: { Enum.UserInputType.Gamepad1, ... }
  end

  -- Read thumbstick axis (polling)
  local thumbstick = UIS:GetGamepadState(Enum.UserInputType.Gamepad1)
  for _, input in ipairs(thumbstick) do
    if input.KeyCode == Enum.KeyCode.Thumbstick1 then
      local x, y = input.Position.X, input.Position.Y  -- -1 to 1
    end
  end

  -- Button press event
  UIS.InputBegan:Connect(function(input, gameProcessed)
    if input.UserInputType == Enum.UserInputType.Gamepad1 then
      if input.KeyCode == Enum.KeyCode.ButtonA then jumpPlayer() end
    end
  end)

=== MarketplaceService — Extended Patterns ===
(See base MarketplaceService section above for core methods.)

PromptGamePassPurchase CALLBACK PATTERN:
  local MPS = game:GetService("MarketplaceService")
  local Players = game:GetService("Players")
  local PASS_ID = 123456

  -- Trigger from server (or client via LocalScript)
  MPS:PromptGamePassPurchase(player, PASS_ID)

  -- Listen for result (fires on both purchase AND cancel)
  MPS.PromptGamePassPurchaseFinished:Connect(function(player, passId, purchased)
    if purchased and passId == PASS_ID then
      grantVIP(player)
    end
  end)

  -- Also re-check on join (player may have bought elsewhere / on another server)
  Players.PlayerAdded:Connect(function(player)
    local ok, owns = pcall(MPS.UserOwnsGamePassAsync, MPS, player.UserId, PASS_ID)
    if ok and owns then grantVIP(player) end
  end)

PromptProductPurchase (developer products — consumables):
  -- Client LocalScript triggers the prompt:
  MPS:PromptProductPurchase(player, productId)
  -- NEVER grant rewards in PromptProductPurchaseFinished
  -- ProcessReceipt is the ONLY safe place to grant developer products

GetProductInfo:
  -- Fetch metadata about any asset / pass / product
  local info = MPS:GetProductInfoAsync(assetId, Enum.InfoType.Asset)
  -- Enum.InfoType: Asset | GamePass | Product | Bundle
  -- Returns: { Name, Description, PriceInRobux, Creator = { Name, Id }, ... }
  local passInfo = MPS:GetProductInfoAsync(passId, Enum.InfoType.GamePass)
  print(passInfo.Name, passInfo.PriceInRobux)

PromptPremiumPurchase:
  -- Prompt a non-Premium player to subscribe to Roblox Premium
  MPS:PromptPremiumPurchase(player)

  -- Check Premium membership:
  if player.MembershipType == Enum.MembershipType.Premium then
    grantPremiumPerks(player)
  end

  -- Event fires when prompt closes:
  MPS.PromptPremiumPurchaseFinished:Connect(function(player)
    if player.MembershipType == Enum.MembershipType.Premium then
      grantPremiumPerks(player)
    end
  end)

=== DataStoreService — Extended Patterns ===
(See base DataStoreService section above for core methods.)

GlobalDataStore vs OrderedDataStore:
  -- GlobalDataStore (from GetDataStore / GetGlobalDataStore):
  --   Stores any JSON-serializable value (table, number, string, bool)
  --   Keyed by arbitrary string (usually tostring(userId))
  --   No sorting — use for per-player saves, game config
  --   Supports versioning (GetVersionAsync, ListVersionsAsync)

  -- OrderedDataStore (from GetOrderedDataStore):
  --   Stores INTEGER values only
  --   Supports GetSortedAsync -> ranked leaderboards
  --   No versioning, no ListKeysAsync
  --   Use for coins leaderboards, XP rankings, playtime rankings

ListDataStoresAsync (enumerate all datastores in game):
  local DS = game:GetService("DataStoreService")
  local pages = DS:ListDataStoresAsync("", 50)  -- prefix="", pageSize=50
  while true do
    local items = pages:GetCurrentPage()
    for _, item in ipairs(items) do
      print(item.Name)  -- DataStore name
    end
    if pages.IsFinished then break end
    pages:AdvanceToNextPageAsync()
  end

ListKeysAsync (enumerate all keys in a datastore):
  local store = DS:GetDataStore("PlayerData")
  local keyPages = store:ListKeysAsync("", 50)  -- prefix, pageSize
  while true do
    local keys = keyPages:GetCurrentPage()
    for _, keyInfo in ipairs(keys) do
      print(keyInfo.KeyName)
    end
    if keyPages.IsFinished then break end
    keyPages:AdvanceToNextPageAsync()
  end

GetVersionAsync (data versioning / rollback):
  -- Every SetAsync creates a new version automatically
  -- List versions of a key:
  local versionPages = store:ListVersionsAsync(key, Enum.SortDirection.Descending, nil, nil, 10)
  local versions = versionPages:GetCurrentPage()
  -- versions[i]: { Version, CreatedTime, ObjectCreatedTime, IsDeleted }

  -- Read a specific version:
  local data, keyInfo = store:GetVersionAsync(key, versions[1].Version)
  -- Rollback by re-writing that data:
  store:SetAsync(key, data)

  -- NOTE: Versioning only available on GlobalDataStore, not OrderedDataStore
  -- Versions retained for 30 days

=== TweenService — EasingStyle and EasingDirection Reference ===
(See base TweenService section above for core usage.)

EasingStyle VALUES with visual character:
  Enum.EasingStyle.Linear        -- constant speed, robotic, no acceleration
  Enum.EasingStyle.Sine          -- gentle S-curve, smooth natural feel
  Enum.EasingStyle.Quad          -- slight acceleration/deceleration (quadratic)
  Enum.EasingStyle.Cubic         -- moderate acceleration (cubic)
  Enum.EasingStyle.Quart         -- stronger acceleration (^4 power)
  Enum.EasingStyle.Quint         -- very strong acceleration (^5 power)
  Enum.EasingStyle.Exponential   -- extreme snap: barely moves then rockets
  Enum.EasingStyle.Circular      -- arc-based, softer than Exponential
  Enum.EasingStyle.Back          -- overshoots target then snaps back (springy)
  Enum.EasingStyle.Bounce        -- physically bounces at end like a rubber ball
  Enum.EasingStyle.Elastic       -- snaps past target and oscillates (rubber band)

EasingDirection VALUES:
  Enum.EasingDirection.In        -- easing at the START (slow start, fast end)
  Enum.EasingDirection.Out       -- easing at the END (fast start, slow end)
  Enum.EasingDirection.InOut     -- easing at BOTH ends (slow->fast->slow, most natural)

RECOMMENDED COMBINATIONS:
  UI fade in/out          -> Sine, InOut
  Door opening            -> Sine or Quad, Out    (snappy end)
  NPC approach            -> Quad, In             (builds speed)
  Projectile launch       -> Exponential, In      (rockets out)
  Coin pop / reward       -> Bounce, Out          (bounces on arrival)
  Button press feedback   -> Back, Out            (slight overshoot = satisfying)
  Health bar drain        -> Linear               (steady depletion looks right)
  Camera zoom             -> Circular, InOut      (smooth arc)
  Elastic spring door     -> Elastic, Out         (spring physics feel)
  Looping float/breathe   -> Sine, InOut, repeats=-1, reverses=true

QUICK EXAMPLES:
  -- Satisfying door open
  TweenInfo.new(0.4, Enum.EasingStyle.Back, Enum.EasingDirection.Out)

  -- Smooth UI slide
  TweenInfo.new(0.25, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut)

  -- Coin bounce collect
  TweenInfo.new(0.6, Enum.EasingStyle.Bounce, Enum.EasingDirection.Out)

  -- Infinite float (hovering object)
  TweenInfo.new(2, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true, 0)

  -- Delayed spring pop
  TweenInfo.new(0.5, Enum.EasingStyle.Elastic, Enum.EasingDirection.Out, 0, false, 0.2)

=== PathfindingService — Extended Patterns ===
(See base PathfindingService section above for core usage.)

PathfindingModifier (mark zones as costly or impassable):
  -- Create a PathfindingModifier on a part to influence pathfinding in that region
  local modifier = Instance.new("PathfindingModifier")
  modifier.Label = "Water"        -- matches Costs table key in AgentParameters
  modifier.PassThrough = false    -- false = impassable; true = passable with cost
  modifier.Parent = waterPart

  -- In AgentParameters:
  local path = PFS:CreatePath({
    AgentRadius = 2,
    AgentHeight = 5,
    AgentCanJump = true,
    Costs = {
      Water = 100,         -- expensive to walk through water zones
      Lava  = math.huge,   -- never walk through lava
    }
  })

AgentParameters full reference:
  {
    AgentRadius = 2,         -- (studs) agent half-width; increase for large NPCs
    AgentHeight = 5,         -- (studs) vertical clearance; match humanoid height
    AgentCanJump = true,     -- can jump over low obstacles / gaps
    AgentCanClimb = false,   -- can climb TrussType ladder parts
    WaypointSpacing = 4,     -- distance between path waypoints (smaller = more accurate)
    Costs = {                -- label -> number cost (higher = less preferred)
      ["MyLabel"] = 10,
    }
  }

  -- NOTE: AgentRadius and AgentHeight must match actual character size or paths fail
  -- near walls (agent can't fit through the computed gap).
  -- Typical R15 humanoid: AgentRadius=2, AgentHeight=5

WaypointSpacing guidance:
  WaypointSpacing = 2   -- precise, many waypoints, more CPU
  WaypointSpacing = 4   -- default balance (recommended)
  WaypointSpacing = 8   -- coarse, fast compute, may clip corners

Dynamic obstacle recompute pattern:
  local path = PFS:CreatePath(agentParams)
  local currentWaypointIndex = 1
  local waypoints = {}

  local function followPath(destination)
    local ok = pcall(path.ComputeAsync, path, rootPart.Position, destination)
    if not ok or path.Status ~= Enum.PathStatus.Success then return end
    waypoints = path:GetWaypoints()
    currentWaypointIndex = 1
    humanoid:MoveTo(waypoints[1].Position)
  end

  path.Blocked:Connect(function(blockedIdx)
    if blockedIdx >= currentWaypointIndex then
      followPath(targetPosition)  -- recompute around new obstacle
    end
  end)

  humanoid.MoveToFinished:Connect(function(reached)
    if reached and currentWaypointIndex < #waypoints then
      currentWaypointIndex += 1
      local wp = waypoints[currentWaypointIndex]
      if wp.Action == Enum.PathWaypointAction.Jump then
        humanoid:ChangeState(Enum.HumanoidStateType.Jumping)
      end
      humanoid:MoveTo(wp.Position)
    end
  end)

=== Service Initialization Order and Yielding Patterns ===

WHY ORDER MATTERS:
  When a Script/LocalScript runs, not all instances are in the DataModel yet.
  Using Instance directly without waiting can return nil and cause silent failures.
  Server Scripts load before LocalScripts, but ReplicatedStorage/Workspace children
  may still be streaming in. Always GetService at the top (instant), then
  WaitForChild for dynamic content.

SAFE INITIALIZATION:
  -- WRONG (may return nil on first frame):
  local tool = workspace.Tools.Sword

  -- CORRECT (waits up to timeout, default ~5s):
  local tool = workspace:WaitForChild("Tools"):WaitForChild("Sword")

  -- With explicit timeout and nil check:
  local folder = workspace:WaitForChild("GameFolder", 5)
  if not folder then
    warn("GameFolder never appeared!")
    return
  end

YIELDING vs NON-YIELDING METHODS:

  Non-yielding (instant, safe anywhere):
    Instance:FindFirstChild(name, recursive?)
    Instance:FindFirstChildOfClass(className)
    Instance:FindFirstChildWhichIsA(className)
    Instance:GetChildren()
    Instance:GetDescendants()
    UIS:IsKeyDown(keyCode)
    UIS:GetMouseLocation()
    workspace:Raycast(origin, direction, params)
    Players:GetPlayerByUserId(userId)           -- does NOT yield

  Yielding (blocks current thread — wrap in task.spawn if non-blocking needed):
    Instance:WaitForChild(name, timeout?)
    dataStore:GetAsync(key)
    dataStore:SetAsync(key, value)
    dataStore:UpdateAsync(key, func)
    path:ComputeAsync(start, finish)
    MPS:GetProductInfoAsync(id, infoType)
    MPS:UserOwnsGamePassAsync(userId, passId)
    HttpService:GetAsync(url)
    HttpService:PostAsync(url, body)
    Players:GetUserThumbnailAsync(userId, type, size)

TASK LIBRARY (modern replacement for deprecated spawn/delay/wait):
  task.spawn(func, ...)          -- run immediately in new thread (no yield)
  task.defer(func, ...)          -- run after current frame, deferred
  task.delay(seconds, func, ...) -- run after N seconds
  task.wait(seconds?)            -- yield N seconds (or next frame if nil)
  task.cancel(thread)            -- cancel a task.delay thread

  -- Preferred over deprecated:
  --   spawn()  -> use task.spawn()     (spawn() was 30fps throttled)
  --   wait()   -> use task.wait()      (wait() was framerate dependent)
  --   delay()  -> use task.delay()

SERVICE INITIALIZATION BEST PRACTICE:
  -- Get all services at top of script (instant, no yielding)
  local Players       = game:GetService("Players")
  local RunService    = game:GetService("RunService")
  local TweenService  = game:GetService("TweenService")
  local UIS           = game:GetService("UserInputService")
  local SoundService  = game:GetService("SoundService")
  local DataStores    = game:GetService("DataStoreService")
  local MPS           = game:GetService("MarketplaceService")
  local PFS           = game:GetService("PathfindingService")
  local RepStorage    = game:GetService("ReplicatedStorage")
  local ServerStorage = game:GetService("ServerStorage")

  -- Then wait for dynamic children (may yield):
  local Remotes = RepStorage:WaitForChild("Remotes")
  local Assets  = RepStorage:WaitForChild("Assets")

  -- Use task.spawn for async initialization that should not block the script:
  task.spawn(function()
    local data = playerStore:GetAsync(tostring(userId))  -- yields inside task
    initPlayer(data)
  end)
`;
