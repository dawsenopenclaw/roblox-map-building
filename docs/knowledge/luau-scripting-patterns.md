# Modern Luau Scripting Patterns for Roblox (2026)

Comprehensive reference for writing production-quality Luau code on the Roblox platform.

## Typed Luau

Roblox uses **Typed Luau** — a gradually typed dialect of Lua 5.1 with type annotations, generics, and strict mode.

### Strict Mode

Every script should start with `--!strict` to enable full type checking:

```lua
--!strict
local Players = game:GetService("Players")
```

### Type Annotations

```lua
-- Variable annotations
local health: number = 100
local name: string = "ForjePlayer"
local alive: boolean = true

-- Function annotations
local function damage(target: Humanoid, amount: number): boolean
  if target.Health <= 0 then return false end
  target.Health = math.max(0, target.Health - amount)
  return true
end

-- Optional types
local function findPlayer(name: string): Player?
  return Players:FindFirstChild(name) :: Player?
end
```

### Type Aliases and Generics

```lua
-- Custom type alias
type WeightedItem = {
  item: string,
  weight: number,
  rarity: "Common" | "Rare" | "Epic" | "Legendary",
}

-- Table types
type Inventory = { [string]: number }
type PlayerData = {
  coins: number,
  level: number,
  inventory: Inventory,
}

-- Generic function
local function pickRandom<T>(list: { T }): T
  return list[math.random(1, #list)]
end
```

### Union and Intersection Types

```lua
type DamageSource = "melee" | "ranged" | "fall" | "environment"
type Result = { success: true, data: string } | { success: false, error: string }
```

## Modern API Patterns

### Service Access

Always use `GetService` — never index `game` directly:

```lua
--!strict
local Players = game:GetService("Players")
local RS = game:GetService("ReplicatedStorage")
local SSS = game:GetService("ServerScriptService")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local CollectionService = game:GetService("CollectionService")
local DataStoreService = game:GetService("DataStoreService")
local MarketplaceService = game:GetService("MarketplaceService")
local HttpService = game:GetService("HttpService")
```

### Task Library (replaces deprecated functions)

```lua
-- CORRECT (modern):
task.wait(1)                    -- replaces wait(1)
task.spawn(function() end)      -- replaces spawn()
task.delay(5, function() end)   -- replaces delay()
task.defer(function() end)      -- runs next resumption cycle
task.cancel(thread)             -- cancel a spawned thread

-- WRONG (deprecated):
-- wait(1)    -- NEVER use
-- spawn(fn)  -- NEVER use
-- delay(n, fn) -- NEVER use
```

### WaitForChild (safe instance resolution)

```lua
-- With timeout (recommended for production)
local gui = player.PlayerGui:WaitForChild("MainGui", 10)
if not gui then
  warn("MainGui did not load in time")
  return
end

-- Without timeout (blocks indefinitely — avoid in production)
local tool = backpack:WaitForChild("Sword")
```

### Attributes (modern key-value storage on instances)

```lua
-- Set attributes
part:SetAttribute("DamageMultiplier", 2.5)
part:SetAttribute("OwnerId", player.UserId)
part:SetAttribute("IsActive", true)

-- Get attributes
local mult: number = part:GetAttribute("DamageMultiplier") or 1
local owner: number? = part:GetAttribute("OwnerId")

-- Listen for changes
part:GetAttributeChangedSignal("IsActive"):Connect(function()
  local active = part:GetAttribute("IsActive")
  print("Active changed to:", active)
end)
```

### Generalized Iteration (modern — no pairs/ipairs)

```lua
-- CORRECT (modern Luau):
for i, v in myTable do
  print(i, v)
end

-- WRONG (deprecated):
-- for i, v in pairs(t) do ... end
-- for i, v in ipairs(t) do ... end
```

## DataStore v2 Patterns

### Basic Read/Write with Error Handling

```lua
--!strict
local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")

local playerStore = DataStoreService:GetDataStore("PlayerData_v2")

type PlayerData = {
  coins: number,
  level: number,
  xp: number,
  inventory: { string },
}

local DEFAULT_DATA: PlayerData = table.freeze({
  coins = 0,
  level = 1,
  xp = 0,
  inventory = {},
})

local activeSessions: { [number]: PlayerData } = {}

local function loadData(player: Player): PlayerData?
  local key = "player_" .. player.UserId
  local success, result = pcall(function()
    return playerStore:GetAsync(key)
  end)
  if success and type(result) == "table" then
    -- Merge with defaults to handle schema migration
    local data = table.clone(DEFAULT_DATA)
    for k, v in result :: any do
      (data :: any)[k] = v
    end
    return data
  elseif not success then
    warn("[DataStore] Load failed for", player.Name, ":", result)
  end
  return table.clone(DEFAULT_DATA)
end

local function saveData(player: Player)
  local data = activeSessions[player.UserId]
  if not data then return end
  local key = "player_" .. player.UserId
  local success, err = pcall(function()
    playerStore:SetAsync(key, data)
  end)
  if not success then
    warn("[DataStore] Save failed for", player.Name, ":", err)
  end
end
```

### Session Locking

```lua
--!strict
local MemoryStoreService = game:GetService("MemoryStoreService")

local sessionMap = MemoryStoreService:GetSortedMap("ActiveSessions")
local JOB_ID = game.JobId

local function acquireLock(userId: number): boolean
  local key = "session_" .. userId
  local success, existing = pcall(function()
    return sessionMap:GetAsync(key)
  end)
  if success and existing and existing ~= JOB_ID then
    return false -- another server has the lock
  end
  local ok = pcall(function()
    sessionMap:SetAsync(key, JOB_ID, 3600) -- 1 hour expiry
  end)
  return ok
end

local function releaseLock(userId: number)
  pcall(function()
    sessionMap:RemoveAsync("session_" .. userId)
  end)
end
```

### Retry Logic with Exponential Backoff

```lua
local function retryAsync<T>(fn: () -> T, maxRetries: number?): (boolean, T?)
  local retries = maxRetries or 3
  for attempt = 1, retries do
    local success, result = pcall(fn)
    if success then
      return true, result
    end
    if attempt < retries then
      task.wait(2 ^ attempt) -- exponential backoff: 2s, 4s, 8s
    else
      warn("[Retry] All attempts failed:", result)
    end
  end
  return false, nil
end

-- Usage:
local ok, data = retryAsync(function()
  return playerStore:GetAsync("player_123")
end, 3)
```

## RemoteEvent / RemoteFunction Patterns

### Server-Authoritative Communication

```lua
-- ReplicatedStorage/Remotes (ModuleScript)
--!strict
local RS = game:GetService("ReplicatedStorage")

local Remotes = {}

function Remotes.getOrCreate(name: string, className: string): Instance
  local existing = RS:FindFirstChild(name)
  if existing then return existing end
  local remote = Instance.new(className)
  remote.Name = name
  remote.Parent = RS
  return remote
end

return Remotes
```

**Server Script:**

```lua
--!strict
local RS = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

local buyEvent = Instance.new("RemoteEvent")
buyEvent.Name = "BuyItem"
buyEvent.Parent = RS

local PRICES: { [string]: number } = {
  ["SpeedBoost"] = 100,
  ["DoubleJump"] = 250,
  ["Shield"] = 500,
}

buyEvent.OnServerEvent:Connect(function(player: Player, itemName: string)
  -- ALWAYS validate on server — never trust client
  if type(itemName) ~= "string" then return end
  local price = PRICES[itemName]
  if not price then return end

  local leaderstats = player:FindFirstChild("leaderstats")
  local coins = leaderstats and leaderstats:FindFirstChild("Coins") :: IntValue
  if not coins or coins.Value < price then return end

  coins.Value -= price
  -- Grant the item...
  print(player.Name, "bought", itemName)
end)
```

**Client Script:**

```lua
--!strict
local RS = game:GetService("ReplicatedStorage")
local buyEvent = RS:WaitForChild("BuyItem") :: RemoteEvent

-- Fire to server when player clicks buy
buyEvent:FireServer("SpeedBoost")
```

### RemoteFunction (request/response)

```lua
-- Server
local getInventory = Instance.new("RemoteFunction")
getInventory.Name = "GetInventory"
getInventory.Parent = RS

getInventory.OnServerInvoke = function(player: Player): { string }
  local data = activeSessions[player.UserId]
  return data and data.inventory or {}
end
```

## Common Script Templates

### NPC Patrol System

```lua
--!strict
local PathfindingService = game:GetService("PathfindingService")
local RunService = game:GetService("RunService")

type PatrolPoint = {
  position: Vector3,
  waitTime: number,
}

local function createPatrolNPC(npcModel: Model, points: { PatrolPoint })
  local humanoid = npcModel:FindFirstChildOfClass("Humanoid")
  if not humanoid then return end

  task.spawn(function()
    local idx = 1
    while humanoid.Health > 0 do
      local target = points[idx]
      humanoid:MoveTo(target.position)
      humanoid.MoveToFinished:Wait()
      task.wait(target.waitTime)
      idx = idx % #points + 1
    end
  end)
end
```

### Leaderboard System

```lua
--!strict
local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local coinStore = DataStoreService:GetDataStore("CoinStore_v1")

Players.PlayerAdded:Connect(function(player: Player)
  local leaderstats = Instance.new("Folder")
  leaderstats.Name = "leaderstats"
  leaderstats.Parent = player

  local coins = Instance.new("IntValue")
  coins.Name = "Coins"
  coins.Parent = leaderstats

  local success, saved = pcall(function()
    return coinStore:GetAsync("coins_" .. player.UserId)
  end)
  if success and type(saved) == "number" then
    coins.Value = saved
  end
end)

Players.PlayerRemoving:Connect(function(player: Player)
  local coins = player:FindFirstChild("leaderstats")
    and player.leaderstats:FindFirstChild("Coins") :: IntValue
  if coins then
    pcall(function()
      coinStore:SetAsync("coins_" .. player.UserId, coins.Value)
    end)
  end
end)
```

### Shop GUI System

```lua
--!strict
local Players = game:GetService("Players")
local RS = game:GetService("ReplicatedStorage")

local buyRemote = RS:WaitForChild("BuyItem") :: RemoteEvent

local player = Players.LocalPlayer
local gui = player.PlayerGui:WaitForChild("ShopGui") :: ScreenGui
local frame = gui:WaitForChild("MainFrame") :: Frame
local itemList = frame:WaitForChild("ItemList") :: ScrollingFrame
local closeBtn = frame:WaitForChild("CloseButton") :: TextButton

type ShopItem = { name: string, price: number, icon: string }

local ITEMS: { ShopItem } = {
  { name = "Speed Boost", price = 100, icon = "rbxassetid://123" },
  { name = "Double Jump", price = 250, icon = "rbxassetid://456" },
  { name = "Shield", price = 500, icon = "rbxassetid://789" },
}

local function createItemRow(item: ShopItem): Frame
  local row = Instance.new("Frame")
  row.Size = UDim2.new(1, 0, 0, 60)
  row.BackgroundColor3 = Color3.fromRGB(40, 40, 50)

  local corner = Instance.new("UICorner")
  corner.CornerRadius = UDim.new(0, 8)
  corner.Parent = row

  local nameLabel = Instance.new("TextLabel")
  nameLabel.Text = item.name
  nameLabel.Size = UDim2.new(0.5, 0, 1, 0)
  nameLabel.Position = UDim2.new(0.05, 0, 0, 0)
  nameLabel.TextColor3 = Color3.new(1, 1, 1)
  nameLabel.Font = Enum.Font.GothamBold
  nameLabel.TextSize = 16
  nameLabel.BackgroundTransparency = 1
  nameLabel.TextXAlignment = Enum.TextXAlignment.Left
  nameLabel.Parent = row

  local buyBtn = Instance.new("TextButton")
  buyBtn.Text = "$" .. item.price
  buyBtn.Size = UDim2.new(0.25, 0, 0.6, 0)
  buyBtn.Position = UDim2.new(0.7, 0, 0.2, 0)
  buyBtn.BackgroundColor3 = Color3.fromRGB(0, 170, 80)
  buyBtn.TextColor3 = Color3.new(1, 1, 1)
  buyBtn.Font = Enum.Font.GothamBold
  buyBtn.TextSize = 14
  buyBtn.Parent = row

  local btnCorner = Instance.new("UICorner")
  btnCorner.CornerRadius = UDim.new(0, 6)
  btnCorner.Parent = buyBtn

  buyBtn.Activated:Connect(function()
    buyRemote:FireServer(item.name)
  end)

  return row
end

for _, item in ITEMS do
  local row = createItemRow(item)
  row.Parent = itemList
end

closeBtn.Activated:Connect(function()
  frame.Visible = false
end)
```

### Teleporter System

```lua
--!strict
local TweenService = game:GetService("TweenService")

type TeleporterPair = {
  padA: Part,
  padB: Part,
  cooldown: number,
}

local activeCooldowns: { [Player]: boolean } = {}

local function setupTeleporter(pair: TeleporterPair)
  local function teleport(pad: Part, destination: Part)
    pad.Touched:Connect(function(hit: BasePart)
      local character = hit.Parent :: Model
      local humanoid = character:FindFirstChildOfClass("Humanoid")
      local player = game:GetService("Players"):GetPlayerFromCharacter(character)
      if not humanoid or not player then return end
      if activeCooldowns[player] then return end

      activeCooldowns[player] = true

      -- Flash effect
      local flash = Instance.new("PointLight")
      flash.Brightness = 8
      flash.Range = 20
      flash.Color = Color3.fromRGB(100, 200, 255)
      flash.Parent = pad

      -- Teleport
      local rootPart = character:FindFirstChild("HumanoidRootPart") :: BasePart
      if rootPart then
        rootPart.CFrame = destination.CFrame + Vector3.new(0, 5, 0)
      end

      task.delay(0.3, function()
        flash:Destroy()
      end)
      task.delay(pair.cooldown, function()
        activeCooldowns[player] = nil
      end)
    end)
  end

  teleport(pair.padA, pair.padB)
  teleport(pair.padB, pair.padA)
end
```

### Damage System

```lua
--!strict
local Players = game:GetService("Players")
local RS = game:GetService("ReplicatedStorage")

type DamageInfo = {
  amount: number,
  source: Player?,
  damageType: "melee" | "ranged" | "fall" | "environment",
  knockback: Vector3?,
}

local damageRemote = Instance.new("RemoteEvent")
damageRemote.Name = "DamageEvent"
damageRemote.Parent = RS

local DAMAGE_COOLDOWN = 0.5
local lastDamageTime: { [Player]: number } = {}

local function applyDamage(target: Model, info: DamageInfo): boolean
  local humanoid = target:FindFirstChildOfClass("Humanoid")
  if not humanoid or humanoid.Health <= 0 then return false end

  -- Apply damage
  humanoid:TakeDamage(info.amount)

  -- Knockback
  if info.knockback then
    local rootPart = target:FindFirstChild("HumanoidRootPart") :: BasePart
    if rootPart then
      local bv = Instance.new("BodyVelocity")
      bv.Velocity = info.knockback
      bv.MaxForce = Vector3.new(1e5, 1e5, 1e5)
      bv.Parent = rootPart
      task.delay(0.15, function()
        bv:Destroy()
      end)
    end
  end

  -- Notify clients for hit indicator
  if info.source then
    damageRemote:FireClient(info.source, {
      target = target.Name,
      damage = info.amount,
      killed = humanoid.Health <= 0,
    })
  end

  return true
end

-- Public API for other scripts
local DamageModule = {}
DamageModule.applyDamage = applyDamage
return DamageModule
```

### Daily Reward System

```lua
--!strict
local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local rewardStore = DataStoreService:GetDataStore("DailyReward_v1")

local REWARDS: { number } = { 50, 75, 100, 150, 200, 300, 500 } -- day 1-7
local DAY_SECONDS = 86400

type RewardData = {
  lastClaim: number,
  streak: number,
}

Players.PlayerAdded:Connect(function(player: Player)
  local success, data = pcall(function()
    return rewardStore:GetAsync("reward_" .. player.UserId)
  end)

  local reward: RewardData = (success and type(data) == "table" and data) or {
    lastClaim = 0,
    streak = 0,
  }

  local now = os.time()
  local elapsed = now - reward.lastClaim

  if elapsed >= DAY_SECONDS then
    if elapsed < DAY_SECONDS * 2 then
      reward.streak = math.min(reward.streak + 1, #REWARDS)
    else
      reward.streak = 1 -- streak broken
    end

    local amount = REWARDS[reward.streak] or REWARDS[#REWARDS]
    reward.lastClaim = now

    -- Grant coins
    local coins = player:FindFirstChild("leaderstats")
      and player.leaderstats:FindFirstChild("Coins") :: IntValue
    if coins then
      coins.Value += amount
    end

    pcall(function()
      rewardStore:SetAsync("reward_" .. player.UserId, reward)
    end)

    print(player.Name, "claimed Day", reward.streak, "reward:", amount, "coins")
  end
end)
```

## Best Practices Summary

1. Always use `--!strict` mode
2. Type-annotate all function signatures and ambiguous locals
3. Use `task.*` library — never bare `wait()`, `spawn()`, `delay()`
4. Use `pcall` around all DataStore, HTTP, and external API calls
5. Validate ALL client input on the server — never trust RemoteEvent args
6. Use generalized iteration (`for k, v in t do`) — not `pairs`/`ipairs`
7. Use `table.freeze()` on config tables to prevent mutation
8. Set Parent LAST on new instances — never pass as constructor arg
9. Use `Color3.fromRGB()` — never `BrickColor.new()`
10. Use Attributes for custom data on instances — not StringValues/NumberValues
11. Use `PivotTo()` for model positioning — never `SetPrimaryPartCFrame`
12. Use `workspace` global — never `game.Workspace`
