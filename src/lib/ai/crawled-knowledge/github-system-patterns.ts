// Pattern from github.com/Kampfkarren/Roblox (DataStore2),
// github.com/Sleitnick/Knit, github.com/ykrimhy/roblox-arena-system,
// github.com/ethangtkt/Outrageous-Blades
// Crawled April 2026 — reusable system implementations from real games

export const GITHUB_SYSTEM_PATTERNS = `
==============================================================
REUSABLE ROBLOX SYSTEM PATTERNS (from open-source games)
==============================================================

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SYSTEM 1: DATASTORE2 — CACHING WRAPPER (industry standard)
Source: github.com/Kampfkarren/Roblox/DataStore2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DataStore2 solves: data loss on crash, throttle errors, Studio/live parity.
Key features: in-memory cache, auto-save on player leave, retry logic,
BeforeSave/AfterSave hooks, backup values, combine multiple keys.

BASIC USAGE:
  local DataStore2 = require(ServerStorage.DataStore2)

  -- IMPORTANT: Combine keys to save only 1 DataStore request per player:
  DataStore2.Combine("PlayerData", "Coins", "Level", "Inventory", "Settings")

  Players.PlayerAdded:Connect(function(player)
    local coinStore = DataStore2("Coins", player)

    -- Get with default value:
    local coins = coinStore:Get(0)

    -- Set:
    coinStore:Set(100)

    -- Increment:
    coinStore:Increment(50)    -- adds 50 to current value

    -- React to changes (fires on Set/Increment/Update):
    coinStore:OnUpdate(function(newValue)
      -- update leaderstats or fire remote
      local ls = player:FindFirstChild("leaderstats")
      if ls and ls:FindFirstChild("Coins") then
        ls.Coins.Value = newValue
      end
    end)

    -- Backup: if Get fails 3 times, return 0 instead of erroring:
    coinStore:SetBackup(3, 0)
  end)

  -- Auto-saves when player leaves (via BindToClose + PlayerRemoving).
  -- Manual save:
  coinStore:Save()
  -- or async:
  coinStore:SaveAsync():andThen(function() print("saved") end)

BEFORE SAVE HOOK (transform data before writing):
  inventoryStore:BeforeSave(function(inventory)
    -- Convert to compact format for storage:
    local compact = {}
    for itemId, count in pairs(inventory) do
      table.insert(compact, itemId..":"..count)
    end
    return table.concat(compact, ",")
  end)

BEFORE INITIAL GET HOOK (transform data after first load):
  inventoryStore:BeforeInitialGet(function(saved)
    -- Convert back from compact format:
    local inventory = {}
    for _, entry in pairs(saved:split(",")) do
      local parts = entry:split(":")
      inventory[parts[1]] = tonumber(parts[2])
    end
    return inventory
  end)

TABLE STORE PATTERN (store complex data):
  local playerStore = DataStore2("PlayerData", player)

  -- GetTable fills in missing keys from default:
  local data = playerStore:GetTable({
    level = 1,
    xp = 0,
    coins = 0,
    inventory = {},
    settings = { music = true, sfx = true }
  })
  -- If stored data missing "settings", it gets filled from default

COMBINE PATTERN (1 DataStore request instead of N):
  -- Call ONCE at script start, before any DataStore2() calls:
  DataStore2.Combine("MainData",
    "Coins", "Gems", "Level", "XP",
    "Inventory", "Equipped", "Settings",
    "Wins", "Losses", "PlayTime"
  )
  -- Now all these are stored in ONE DataStore key "MainData"
  -- Reads/writes still work exactly the same via DataStore2("Coins", player)

SAVE ALL ON SHUTDOWN:
  game:BindToClose(function()
    for _, player in pairs(Players:GetPlayers()) do
      DataStore2.SaveAll(player)
    end
  end)

STUDIO SAFETY:
  -- DataStore2 checks RunService:IsStudio() automatically
  -- Create ServerStorage/SaveInStudio BoolValue = true to enable saving in Studio

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SYSTEM 2: SAFE DATASTORE (vanilla, with retry + pcall)
Source: github.com/ethangtkt/Outrageous-Blades
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When not using DataStore2, always wrap in pcall with retry loop:

  local DataStoreService = game:GetService("DataStoreService")
  local REQUEST_WAIT = 1.5  -- seconds between retries
  local FETCH_LIMIT = 5     -- max attempts

  local function SafeGet(storeName, key, default)
    local store = DataStoreService:GetDataStore(storeName)
    for attempt = 1, FETCH_LIMIT do
      local success, value = pcall(function()
        return store:GetAsync(key)
      end)
      if success then
        return value ~= nil and value or default
      end
      warn("DataStore get failed attempt "..attempt..": "..tostring(value))
      task.wait(REQUEST_WAIT)
    end
    return default  -- all retries failed, return default
  end

  local function SafeSet(storeName, key, value)
    local store = DataStoreService:GetDataStore(storeName)
    for attempt = 1, FETCH_LIMIT do
      local success, err = pcall(function()
        store:SetAsync(key, value)
      end)
      if success then return true end
      warn("DataStore set failed attempt "..attempt..": "..tostring(err))
      task.wait(REQUEST_WAIT)
    end
    return false
  end

  -- CRITICAL SAVE GUARD: only save if data was loaded successfully
  -- Prevents wiping data on load failure:
  local function LoadAndSavePlayer(player)
    local key = "User_" .. player.UserId
    local loaded = false

    local coins = SafeGet("Coins", key, 0)
    local level = SafeGet("Level", key, 1)
    loaded = true  -- mark as loaded

    player:FindFirstChild("leaderstats").Coins.Value = coins

    Players.PlayerRemoving:Connect(function(p)
      if p == player and loaded then  -- ONLY save if loaded
        SafeSet("Coins", key, p.leaderstats.Coins.Value)
      end
    end)
  end

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SYSTEM 3: COMBAT / HITBOX PATTERNS
Source: general Roblox combat patterns
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SWORD/MELEE TOOL PATTERN (Touched-based):
  local tool = script.Parent
  local blade = tool.Blade  -- the hitbox part
  local debounce = {}
  local damage = 20
  local COOLDOWN = 0.5

  local function Activate()
    local hitParts = {}
    local connection = blade.Touched:Connect(function(hit)
      -- Get humanoid from hit:
      local humanoid = hit.Parent:FindFirstChild("Humanoid")
        or hit.Parent.Parent:FindFirstChild("Humanoid")
      if not humanoid then return end

      local player = Players:GetPlayerFromCharacter(humanoid.Parent)
      if player == tool.Parent.Parent then return end  -- don't hit self

      -- Debounce per character:
      local charKey = humanoid.Parent.Name
      if debounce[charKey] then return end
      debounce[charKey] = true
      task.delay(COOLDOWN, function() debounce[charKey] = nil end)

      -- Tag the humanoid with killer:
      local tag = Instance.new("ObjectValue")
      tag.Name = "creator"
      tag.Value = tool.Parent.Parent  -- the wielding player
      tag.Parent = humanoid
      game:GetService("Debris"):AddItem(tag, 2)

      -- Deal damage:
      humanoid:TakeDamage(damage)
    end)

    task.delay(0.3, function()  -- swing duration
      connection:Disconnect()
      debounce = {}
    end)
  end

  tool.Activated:Connect(Activate)

RANGED RAYCAST PATTERN:
  local function FireRaycast(origin, direction, player)
    local params = RaycastParams.new()
    params.FilterDescendantsInstances = {player.Character}
    params.FilterType = Enum.RaycastFilterType.Exclude

    local result = workspace:Raycast(origin, direction * MAX_RANGE, params)
    if result then
      local humanoid = result.Instance.Parent:FindFirstChild("Humanoid")
        or result.Instance.Parent.Parent:FindFirstChild("Humanoid")
      if humanoid then
        local distance = (origin - result.Position).Magnitude
        local damage = math.max(MIN_DAMAGE, MAX_DAMAGE - distance * FALLOFF)
        humanoid:TakeDamage(damage)
        return result.Position
      end
    end
    return origin + direction * MAX_RANGE  -- missed
  end

AREA DAMAGE (explosion, AoE):
  local function DealAreaDamage(center, radius, damage, ignorePlayer)
    for _, obj in pairs(workspace:GetPartBoundsInRadius(center, radius, OverlapParams.new())) do
      local humanoid = obj.Parent:FindFirstChild("Humanoid")
        or obj.Parent.Parent:FindFirstChild("Humanoid")
      if humanoid and humanoid.Parent ~= ignorePlayer.Character then
        local distance = (center - obj.Position).Magnitude
        local falloff = 1 - (distance / radius)  -- 0 to 1
        humanoid:TakeDamage(damage * falloff)
      end
    end
  end

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SYSTEM 4: ROUND-BASED GAME LOOP
Source: distilled from arena + Outrageous-Blades
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STATE MACHINE for round-based games:
  local GameState = {
    LOBBY = "Lobby",
    INTERMISSION = "Intermission",
    PLAYING = "Playing",
    ENDING = "Ending"
  }

  local currentState = GameState.LOBBY
  local roundTimer = 0

  local function SetState(newState)
    currentState = newState
    -- fire remote to sync all clients:
    StateChangedEvent:FireAllClients(newState)
  end

  -- Main game loop:
  task.spawn(function()
    while true do
      -- INTERMISSION (wait for players):
      SetState(GameState.INTERMISSION)
      local countdown = INTERMISSION_TIME
      while countdown > 0 and #Players:GetPlayers() < MIN_PLAYERS do
        task.wait(1)
        countdown -= 1
        CountdownEvent:FireAllClients(countdown)
      end

      if #Players:GetPlayers() < MIN_PLAYERS then
        task.wait(5)
        continue  -- restart loop
      end

      -- START ROUND:
      SetState(GameState.PLAYING)
      local alivePlayers = {}
      for _, p in pairs(Players:GetPlayers()) do
        table.insert(alivePlayers, p)
        TeleportToMap(p)
      end

      -- Wait for round to end (last player alive or timer):
      local roundTime = ROUND_DURATION
      while #alivePlayers > 1 and roundTime > 0 do
        task.wait(1)
        roundTime -= 1
        -- Update alive count
        for i = #alivePlayers, 1, -1 do
          local p = alivePlayers[i]
          if not p.Character or not p.Character:FindFirstChild("Humanoid")
            or p.Character.Humanoid.Health <= 0 then
            table.remove(alivePlayers, i)
          end
        end
      end

      -- ENDING:
      SetState(GameState.ENDING)
      local winner = alivePlayers[1]
      if winner then
        AwardWin(winner)
        WinnerEvent:FireAllClients(winner.Name)
      end
      task.wait(ENDING_DURATION)

      -- Reset all players to lobby:
      for _, p in pairs(Players:GetPlayers()) do
        TeleportToLobby(p)
      end
    end
  end)

INTERMISSION COUNTDOWN UI (client):
  StateChangedEvent.OnClientEvent:Connect(function(state)
    if state == "Intermission" then
      countdownLabel.Visible = true
    elseif state == "Playing" then
      countdownLabel.Visible = false
    end
  end)

  CountdownEvent.OnClientEvent:Connect(function(seconds)
    countdownLabel.Text = "Game starts in: " .. seconds
  end)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SYSTEM 5: ECONOMY / CURRENCY SYSTEM
Source: arena system + general patterns
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SERVER-SIDE ECONOMY (never trust client):
  local EconomyService = {}

  -- All currency changes go through server RemoteFunction:
  local PurchaseFunction = Instance.new("RemoteFunction")
  PurchaseFunction.Name = "PurchaseItem"
  PurchaseFunction.Parent = ReplicatedStorage

  PurchaseFunction.OnServerInvoke = function(player, itemId, itemType)
    local store = DataStore2("Coins", player)
    local coins = store:Get(0)
    local price = ItemPrices[itemId]

    if not price then return false, "Item not found" end
    if coins < price then return false, "Not enough coins" end

    -- Deduct coins:
    store:Increment(-price)

    -- Give item:
    local inventoryStore = DataStore2("Inventory", player)
    local inventory = inventoryStore:GetTable({})
    inventory[itemId] = (inventory[itemId] or 0) + 1
    inventoryStore:Set(inventory)

    return true, "Purchase successful"
  end

COIN REWARD PATTERNS (from arena):
  -- Kill reward:     +10 coins per kill
  -- Win reward:      +100 coins per match win
  -- Loss consolation: +10 coins per match loss
  -- Participation:   +1 coin per round survived

SHOP UI PATTERN (client):
  local function TryPurchase(itemId)
    local success, message = PurchaseFunction:InvokeServer(itemId, "weapon")
    if success then
      -- Update local UI
      notification.Text = "Purchased!"
    else
      notification.Text = "Failed: " .. message
    end
  end

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SYSTEM 6: MATCHMAKING / QUEUE SYSTEM
Source: github.com/ykrimhy/roblox-arena-system
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Physical queue pads in workspace (no UI needed — stand on pad to queue):
  -- Advantages: intuitive, no complex UI, immediate visual feedback

  -- Queue data structure:
  local Queue = {}  -- {Player, PadIndex, Team}

  -- Team assignment by pad range:
  local team = (padIndex <= 5) and 1 or 2

  -- Sequential fill check (must fill from pad 1/6 forward):
  function CanJoinPad(padIndex)
    local startPad = (padIndex <= 5) and 1 or 6
    if padIndex == startPad then return true end  -- first pad always open
    -- Check previous pad is occupied:
    for _, q in pairs(Queue) do
      if q.PadIndex == padIndex - 1 then return true end
    end
    return false
  end

  -- Match can start when equal non-zero teams:
  function CheckCanStart()
    local t1, t2 = 0, 0
    for _, q in pairs(Queue) do
      if q.Team == 1 then t1 += 1 else t2 += 1 end
    end
    return t1 > 0 and t2 > 0 and t1 == t2
  end

TELEPORT-BASED QUEUE (alternative, scale-independent):
  -- Good for large games where physical pads don't work
  local queuedPlayers = {}
  local QueueEvent = ReplicatedStorage.QueueEvent

  QueueEvent.OnServerEvent:Connect(function(player, action)
    if action == "join" then
      if not table.find(queuedPlayers, player) then
        table.insert(queuedPlayers, player)
        -- Teleport to waiting area
        TeleportToWaitingRoom(player)
        CheckMatchReady()
      end
    elseif action == "leave" then
      local index = table.find(queuedPlayers, player)
      if index then
        table.remove(queuedPlayers, index)
        TeleportToLobby(player)
      end
    end
  end)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SYSTEM 7: NPC / MOB CONTROLLER PATTERN
Source: general patterns from Roblox NPC docs + community
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BASIC NPC AI LOOP:
  local PathfindingService = game:GetService("PathfindingService")
  local RunService = game:GetService("RunService")

  local NPC = {}
  NPC.__index = NPC

  function NPC.new(model, target)
    local self = setmetatable({}, NPC)
    self.Model = model
    self.Humanoid = model:FindFirstChild("Humanoid")
    self.HRP = model:FindFirstChild("HumanoidRootPart")
    self.Target = target
    self.State = "Idle"  -- Idle | Chasing | Attacking | Dead
    self.AggroRange = 30
    self.AttackRange = 5
    self.Damage = 15
    self.AttackCooldown = false
    return self
  end

  function NPC:FindNearestPlayer()
    local nearest, nearestDist = nil, math.huge
    for _, player in pairs(Players:GetPlayers()) do
      if player.Character and player.Character:FindFirstChild("Humanoid") then
        if player.Character.Humanoid.Health > 0 then
          local dist = (self.HRP.Position - player.Character.HumanoidRootPart.Position).Magnitude
          if dist < nearestDist then
            nearest = player.Character
            nearestDist = dist
          end
        end
      end
    end
    return nearest, nearestDist
  end

  function NPC:Update()
    if self.Humanoid.Health <= 0 then
      self.State = "Dead"
      return
    end

    local target, dist = self:FindNearestPlayer()
    if not target then
      self.State = "Idle"
      self.Humanoid:MoveTo(self.HRP.Position)  -- stop
      return
    end

    if dist < self.AttackRange then
      self.State = "Attacking"
      self:Attack(target)
    elseif dist < self.AggroRange then
      self.State = "Chasing"
      self:PathTo(target.HumanoidRootPart.Position)
    else
      self.State = "Idle"
    end
  end

  function NPC:PathTo(destination)
    local path = PathfindingService:CreatePath({
      AgentRadius = 2,
      AgentHeight = 5,
      AgentCanJump = true,
    })
    path:ComputeAsync(self.HRP.Position, destination)
    if path.Status == Enum.PathStatus.Success then
      local waypoints = path:GetWaypoints()
      for _, wp in pairs(waypoints) do
        if wp.Action == Enum.PathWaypointAction.Jump then
          self.Humanoid.Jump = true
        end
        self.Humanoid:MoveTo(wp.Position)
        -- Wait for near enough or timeout:
        local reached = self.Humanoid.MoveToFinished:Wait(1)
        if not reached then break end  -- timeout, recompute next update
      end
    end
  end

  function NPC:Attack(targetChar)
    if self.AttackCooldown then return end
    self.AttackCooldown = true
    local targetHum = targetChar:FindFirstChild("Humanoid")
    if targetHum and targetHum.Health > 0 then
      targetHum:TakeDamage(self.Damage)
    end
    task.delay(1.5, function() self.AttackCooldown = false end)
  end

  -- Run update loop:
  function NPC:Start()
    task.spawn(function()
      while self.Model.Parent and self.State ~= "Dead" do
        self:Update()
        task.wait(0.1)  -- 10 times per second
      end
    end)
  end

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SYSTEM 8: TYCOON / DROPPER ECONOMY PATTERN
Source: common Roblox tycoon architecture
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TYCOON OWNERSHIP:
  -- Each tycoon is a Model in workspace with Owner (ObjectValue) inside
  local tycoon = workspace.Tycoons.Tycoon1
  local ownerValue = tycoon:FindFirstChild("Owner")  -- ObjectValue

  Players.PlayerAdded:Connect(function(player)
    -- Assign unclaimed tycoon:
    for _, t in pairs(workspace.Tycoons:GetChildren()) do
      if t:FindFirstChild("Owner") and t.Owner.Value == nil then
        t.Owner.Value = player
        TeleportToTycoon(player, t)
        break
      end
    end
  end)

  Players.PlayerRemoving:Connect(function(player)
    for _, t in pairs(workspace.Tycoons:GetChildren()) do
      if t:FindFirstChild("Owner") and t.Owner.Value == player then
        t.Owner.Value = nil  -- free tycoon
        -- Reset tycoon buildings
        ResetTycoon(t)
        break
      end
    end
  end)

DROPPER LOOP:
  local dropperModel = tycoon.Dropper
  local collectPart = tycoon.Collector
  local dropInterval = 2  -- seconds
  local dropValue = 10

  task.spawn(function()
    while tycoon.Owner.Value ~= nil do
      -- Spawn cash part:
      local cash = Instance.new("Part")
      cash.Size = Vector3.new(1, 0.5, 1)
      cash.BrickColor = BrickColor.new("Bright yellow")
      cash.Position = dropperModel.Position + Vector3.new(0, 2, 0)
      cash.Parent = workspace

      -- Auto-collect touch:
      cash.Touched:Connect(function(hit)
        if hit == collectPart then
          local owner = tycoon.Owner.Value
          if owner then
            local coinStore = DataStore2("Coins", owner)
            coinStore:Increment(dropValue)
          end
          cash:Destroy()
        end
      end)

      Debris:AddItem(cash, 10)  -- cleanup if missed
      task.wait(dropInterval)
    end
  end)

PURCHASABLE BUTTONS:
  local button = tycoon.Buttons.SomePurchase
  local price = button:GetAttribute("Price") or 100
  local purchased = button:GetAttribute("Purchased") or false

  button.Touched:Connect(function(hit)
    if purchased then return end
    local player = Players:GetPlayerFromCharacter(hit.Parent)
    if not player then return end
    if tycoon.Owner.Value ~= player then return end  -- must be owner

    local coins = DataStore2("Coins", player):Get(0)
    if coins >= price then
      DataStore2("Coins", player):Increment(-price)
      purchased = true
      button:SetAttribute("Purchased", true)
      button.Parent = nil  -- hide button

      -- Reveal the purchased item:
      local item = tycoon:FindFirstChild(button.Name .. "Item")
      if item then
        item.Transparency = 0
        item.CanCollide = true
      end
    end
  end)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SYSTEM 9: INVENTORY / ITEM SYSTEM
Source: general Roblox patterns
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SERVER INVENTORY MODULE:
  local InventoryModule = {}

  -- Inventory stored as {[itemId] = count} table in DataStore2
  local function GetInventory(player)
    return DataStore2("Inventory", player):GetTable({})
  end

  function InventoryModule:AddItem(player, itemId, quantity)
    quantity = quantity or 1
    local store = DataStore2("Inventory", player)
    local inv = store:GetTable({})
    inv[itemId] = (inv[itemId] or 0) + quantity
    store:Set(inv)
    -- Fire update to client:
    InventoryUpdated:FireClient(player, inv)
  end

  function InventoryModule:RemoveItem(player, itemId, quantity)
    quantity = quantity or 1
    local store = DataStore2("Inventory", player)
    local inv = store:GetTable({})
    if (inv[itemId] or 0) < quantity then
      return false, "Not enough items"
    end
    inv[itemId] = inv[itemId] - quantity
    if inv[itemId] <= 0 then inv[itemId] = nil end  -- clean empty slots
    store:Set(inv)
    InventoryUpdated:FireClient(player, inv)
    return true
  end

  function InventoryModule:HasItem(player, itemId, quantity)
    quantity = quantity or 1
    local inv = GetInventory(player)
    return (inv[itemId] or 0) >= quantity
  end

  return InventoryModule

EQUIP SYSTEM:
  -- Equipped item stored in player Attribute for easy replication:
  local function EquipItem(player, itemId)
    if not InventoryModule:HasItem(player, itemId) then return end
    player:SetAttribute("EquippedItem", itemId)
    DataStore2("Equipped", player):Set(itemId)
    -- Give the tool:
    local template = ReplicatedStorage.Items:FindFirstChild(itemId)
    if template then
      local tool = template:Clone()
      tool.Parent = player.Backpack
    end
  end

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SYSTEM 10: PET SYSTEM
Source: common Roblox pet game pattern
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  -- Pets follow players with a smooth lerp:
  local Pet = {}
  Pet.__index = Pet

  function Pet.new(petModel, owner)
    local self = setmetatable({}, Pet)
    self.Model = petModel
    self.Owner = owner
    self.Offset = Vector3.new(3, 0, 2)  -- follow offset
    self.Speed = 0.1  -- lerp speed
    return self
  end

  function Pet:Start()
    task.spawn(function()
      while self.Model.Parent do
        if self.Owner.Character and self.Owner.Character:FindFirstChild("HumanoidRootPart") then
          local ownerHRP = self.Owner.Character.HumanoidRootPart
          local targetPos = ownerHRP.CFrame * CFrame.new(self.Offset)

          -- Smooth follow with lerp:
          local petHRP = self.Model:FindFirstChild("HumanoidRootPart")
          if petHRP then
            petHRP.CFrame = petHRP.CFrame:Lerp(targetPos, self.Speed)
          end
        end
        RunService.Heartbeat:Wait()
      end
    end)
  end

  -- Multiple pets in orbit:
  local function GetOrbitOffset(index, total, radius)
    local angle = (index / total) * math.pi * 2
    return Vector3.new(
      math.cos(angle) * radius,
      0,
      math.sin(angle) * radius
    )
  end

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SYSTEM 11: UI FRAMEWORK PATTERNS (Screen GUIs)
Source: github.com/ykrimhy/roblox-arena-system + general
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SCREEN GUI CREATION FROM SERVER:
  -- Server can create UI in PlayerGui:
  local pGui = player:WaitForChild("PlayerGui", 5)
  local sg = Instance.new("ScreenGui")
  sg.Name = "MyGui"
  sg.ResetOnSpawn = false  -- persist through death
  sg.Parent = pGui

  -- Auto-destroy after time:
  Debris:AddItem(sg, 5)  -- gone in 5 seconds

STANDARD UI FRAME TEMPLATE:
  local frame = Instance.new("Frame")
  frame.Size = UDim2.new(0, 300, 0, 200)
  frame.AnchorPoint = Vector2.new(0.5, 0.5)
  frame.Position = UDim2.new(0.5, 0, 0.5, 0)  -- centered
  frame.BackgroundColor3 = Color3.fromRGB(20, 5, 5)
  frame.BackgroundTransparency = 0.1
  frame.BorderSizePixel = 0
  frame.Parent = sg

  -- Rounded corners (always do this):
  local corner = Instance.new("UICorner")
  corner.CornerRadius = UDim.new(0, 10)
  corner.Parent = frame

  -- Colored border:
  local stroke = Instance.new("UIStroke")
  stroke.Color = Color3.fromRGB(170, 0, 255)
  stroke.Thickness = 3
  stroke.Parent = frame

ANIMATED BUTTON PATTERN:
  local btn = Instance.new("TextButton")
  -- ... setup ...

  -- Hover effects:
  btn.MouseEnter:Connect(function()
    TweenService:Create(btn, TweenInfo.new(0.1),
      {BackgroundColor3 = btn.BackgroundColor3:Lerp(Color3.new(1,1,1), 0.2)}
    ):Play()
  end)
  btn.MouseLeave:Connect(function()
    TweenService:Create(btn, TweenInfo.new(0.1),
      {BackgroundColor3 = originalColor}
    ):Play()
  end)

  -- Click press effect:
  btn.MouseButton1Down:Connect(function()
    TweenService:Create(btn, TweenInfo.new(0.05),
      {Size = btn.Size - UDim2.new(0, 4, 0, 4),
       Position = btn.Position + UDim2.new(0, 2, 0, 2)}
    ):Play()
  end)
  btn.MouseButton1Up:Connect(function()
    TweenService:Create(btn, TweenInfo.new(0.1),
      {Size = originalSize, Position = originalPosition}
    ):Play()
  end)

TOP HUD PATTERN (score bar):
  -- Centered at top of screen, shows team scores + player avatars
  local topBar = Instance.new("Frame")
  topBar.AnchorPoint = Vector2.new(0.5, 0)
  topBar.Position = UDim2.new(0.5, 0, 0, 48)  -- 48px from top
  topBar.Size = UDim2.new(0, 420, 0, 50)
  topBar.BackgroundColor3 = DARK_BG
  topBar.Parent = sg

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SYSTEM 12: GAME PASS / MONETIZATION PATTERNS
Source: github.com/Kampfkarren/Roblox/Modules/GamePasses.lua
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  local MarketplaceService = game:GetService("MarketplaceService")

  -- Check game pass safely:
  local function PlayerHasGamePass(player, gamePassId)
    local success, result = pcall(function()
      return MarketplaceService:UserOwnsGamePassAsync(player.UserId, gamePassId)
    end)
    return success and result
  end

  -- Prompt purchase:
  local function PromptGamePass(player, gamePassId)
    MarketplaceService:PromptGamePassPurchase(player, gamePassId)
  end

  -- Handle purchase completion:
  MarketplaceService.PromptGamePassPurchaseFinished:Connect(function(player, gamePassId, purchased)
    if purchased then
      if gamePassId == VIP_PASS_ID then
        -- Give VIP benefits
        player:SetAttribute("IsVIP", true)
        DataStore2("VIP", player):Set(true)
        ApplyVIPBenefits(player)
      end
    end
  end)

  -- Check on join (player might already own it):
  Players.PlayerAdded:Connect(function(player)
    if PlayerHasGamePass(player, VIP_PASS_ID) then
      ApplyVIPBenefits(player)
    end
    if PlayerHasGamePass(player, DOUBLE_COINS_ID) then
      player:SetAttribute("DoubleCoins", true)
    end
  end)

DEVELOPER PRODUCT (consumable):
  MarketplaceService.ProcessReceipt = function(receiptInfo)
    local player = Players:GetPlayerByUserId(receiptInfo.PlayerId)
    if not player then return Enum.ProductPurchaseDecision.NotProcessedYet end

    local productId = receiptInfo.ProductId
    local success = pcall(function()
      if productId == COIN_PACK_1000 then
        DataStore2("Coins", player):Increment(1000)
      elseif productId == COIN_PACK_5000 then
        DataStore2("Coins", player):Increment(5000)
      end
    end)

    return success
      and Enum.ProductPurchaseDecision.PurchaseGranted
      or Enum.ProductPurchaseDecision.NotProcessedYet
  end

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SYSTEM 13: REMOTE EVENT / FUNCTION PATTERNS
Source: multiple repos
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE REMOTES AT RUNTIME (if not pre-placed in Explorer):
  local function GetOrCreate(name, className)
    local existing = ReplicatedStorage:FindFirstChild(name)
    if existing then return existing end
    local remote = Instance.new(className)
    remote.Name = name
    remote.Parent = ReplicatedStorage
    return remote
  end

  local CombatEvent = GetOrCreate("CombatEvent", "RemoteEvent")
  local GetDataFunction = GetOrCreate("GetDataFunction", "RemoteFunction")

SAFE REMOTE FUNCTION (never trust client, always pcall):
  GetDataFunction.OnServerInvoke = function(player, requestType)
    -- Validate input:
    if type(requestType) ~= "string" then return nil end
    -- Rate limit check:
    if IsRateLimited(player) then return nil, "Rate limited" end

    if requestType == "inventory" then
      return DataStore2("Inventory", player):GetTable({})
    end
    return nil
  end

UNRELIABLE REMOTE EVENT (for frequent, non-critical updates like hit effects):
  -- Use UnreliableRemoteEvent for things that are OK to drop:
  local HitEffect = Instance.new("UnreliableRemoteEvent")
  HitEffect.Name = "HitEffect"
  HitEffect.Parent = ReplicatedStorage

  -- Fire frequently without network congestion:
  HitEffect:FireAllClients(hitPosition, hitNormal)

REMOTE RATE LIMITING:
  local requestCounts = {}  -- {[userId] = {count, resetTime}}

  local function IsRateLimited(player)
    local userId = player.UserId
    local now = tick()

    if not requestCounts[userId] or now > requestCounts[userId].resetTime then
      requestCounts[userId] = {count = 1, resetTime = now + 1}
      return false
    end

    requestCounts[userId].count += 1
    if requestCounts[userId].count > 10 then  -- max 10 requests/second
      return true
    end
    return false
  end

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SYSTEM 14: TWEEN ANIMATION HELPERS
Source: general + arena system
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMMON TWEEN PRESETS:
  local TweenService = game:GetService("TweenService")

  local TWEEN_QUICK = TweenInfo.new(0.15, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
  local TWEEN_SMOOTH = TweenInfo.new(0.4, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
  local TWEEN_BOUNCE = TweenInfo.new(0.5, Enum.EasingStyle.Bounce, Enum.EasingDirection.Out)
  local TWEEN_ELASTIC = TweenInfo.new(0.6, Enum.EasingStyle.Elastic, Enum.EasingDirection.Out)
  local TWEEN_SPRING = TweenInfo.new(0.4, Enum.EasingStyle.Back, Enum.EasingDirection.Out)

PART HIGHLIGHT (hover effect):
  -- Pad glow on queue join:
  TweenService:Create(pad, TWEEN_SMOOTH, {
    Transparency = 0.3,
    Color = Color3.fromRGB(170, 0, 255)
  }):Play()
  pad.Material = Enum.Material.Neon

  -- Reset:
  TweenService:Create(pad, TWEEN_SMOOTH, {
    Color = Color3.fromRGB(163, 162, 165),
    Transparency = 1
  }):Play()
  task.delay(0.3, function() pad.Material = Enum.Material.Plastic end)

POP-IN ANIMATION (UI elements appearing):
  local function PopIn(frame)
    frame.Size = UDim2.fromScale(0, 0)
    frame.Position = UDim2.fromScale(0.5, 0.5)
    frame.Visible = true
    TweenService:Create(frame, TWEEN_SPRING, {
      Size = UDim2.fromScale(1, 1),
      Position = UDim2.fromScale(0, 0)
    }):Play()
  end

  local function PopOut(frame, callback)
    TweenService:Create(frame, TWEEN_QUICK, {
      Size = UDim2.fromScale(0, 0),
      Position = UDim2.fromScale(0.5, 0.5)
    }):Play()
    task.delay(0.15, function()
      frame.Visible = false
      if callback then callback() end
    end)
  end

PROGRESS BAR:
  local function SetProgress(bar, pct)  -- pct: 0 to 1
    TweenService:Create(bar, TWEEN_SMOOTH, {
      Size = UDim2.new(pct, 0, 1, 0)
    }):Play()
    -- Color shift (green to red for health):
    local color = Color3.fromHSV(pct * 0.33, 1, 1)  -- red=0, green=0.33
    TweenService:Create(bar, TWEEN_SMOOTH, {BackgroundColor3 = color}):Play()
  end

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SYSTEM 15: CHECKPOINT / OBBY SYSTEM
Source: general Roblox obby pattern
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  -- Checkpoints as Parts with stage numbers as Attributes
  -- Player touches → saves stage → respawns there on death

  local checkpointDebounce = {}

  for _, checkpoint in pairs(workspace.Checkpoints:GetChildren()) do
    local stage = checkpoint:GetAttribute("Stage") or 1

    checkpoint.Touched:Connect(function(hit)
      local player = Players:GetPlayerFromCharacter(hit.Parent)
      if not player then return end
      if checkpointDebounce[player.UserId] then return end

      -- Only advance, never go back:
      local currentStage = DataStore2("Stage", player):Get(1)
      if stage <= currentStage then return end

      checkpointDebounce[player.UserId] = true
      task.delay(1, function() checkpointDebounce[player.UserId] = nil end)

      DataStore2("Stage", player):Set(stage)
      -- Visual feedback:
      checkpoint.BrickColor = BrickColor.new("Bright green")
      -- Notification:
      StageReachedEvent:FireClient(player, stage)
    end)
  end

  -- Respawn at checkpoint:
  Players.PlayerAdded:Connect(function(player)
    player.CharacterAdded:Connect(function(char)
      task.wait(0.1)  -- brief wait for character to load
      local stage = DataStore2("Stage", player):Get(1)
      local checkpoint = workspace.Checkpoints:FindFirstChild("Stage"..stage)
      if checkpoint then
        char.HumanoidRootPart.CFrame = checkpoint.CFrame + Vector3.new(0, 5, 0)
      end
    end)
  end)

  -- Kill parts / lava:
  for _, killPart in pairs(workspace.KillParts:GetChildren()) do
    killPart.Touched:Connect(function(hit)
      local humanoid = hit.Parent:FindFirstChild("Humanoid")
      if humanoid then humanoid.Health = 0 end  -- instant kill triggers respawn
    end)
  end
`;
