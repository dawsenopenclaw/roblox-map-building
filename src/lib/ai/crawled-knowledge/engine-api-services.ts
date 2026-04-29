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
`;
