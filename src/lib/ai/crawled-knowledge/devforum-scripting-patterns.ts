// DevForum Scripting Patterns Knowledge
// Distilled from Roblox Developer Forum community posts
// Covers: DataStore, Combat, NPC/Pathfinding, Anti-exploit, Luau Optimization

export const DEVFORUM_SCRIPTING_PATTERNS = `
=== DATASTORE BEST PRACTICES ===

// Pattern from DevForum: Datastore best practices + Best practices of DataStore
// Single DataStore for all players. UpdateAsync always. Session lock on load.

local DataStoreService = game:GetService("DataStoreService")
local PlayerData = DataStoreService:GetDataStore("PlayerData_v1")

-- DEFAULT DATA template — always merge with saved data to add new keys
local DEFAULT_DATA = {
    Cash = 0,
    Level = 1,
    XP = 0,
    Inventory = {},
    Settings = { Music = true, SFX = true },
}

-- LOAD with retry + exponential backoff
local function loadData(userId)
    local MAX_RETRIES = 5
    local data = nil
    local tries = 0
    local delay = 0.5

    repeat
        tries += 1
        local success, result = pcall(function()
            return PlayerData:GetAsync(tostring(userId))
        end)
        if success then
            data = result
            break
        else
            warn("DataStore load failed attempt", tries, result)
            task.wait(delay)
            delay = math.min(delay * 2, 10) -- cap at 10s
        end
    until tries >= MAX_RETRIES

    -- Merge saved data with defaults (adds new keys from updates)
    local merged = {}
    for key, defaultVal in DEFAULT_DATA do
        if data and data[key] ~= nil then
            merged[key] = data[key]
        else
            merged[key] = defaultVal
        end
    end
    return merged
end

-- SAVE with UpdateAsync (safer than SetAsync — uses callback pattern)
local function saveData(userId, data)
    local success, err = pcall(function()
        PlayerData:UpdateAsync(tostring(userId), function(oldData)
            -- Validate new data before overwriting
            if type(data) ~= "table" then return oldData end
            return data
        end)
    end)
    if not success then
        warn("DataStore save failed for", userId, err)
    end
    return success
end

-- SESSION LOCK PATTERN (prevents multi-server data corruption)
local SessionStore = DataStoreService:GetDataStore("Sessions_v1")
local SERVER_ID = game.JobId

local function acquireSessionLock(userId)
    local locked = false
    pcall(function()
        SessionStore:UpdateAsync(tostring(userId), function(current)
            if current and current ~= SERVER_ID then
                return nil -- Don't overwrite (another server has lock)
            end
            locked = true
            return SERVER_ID
        end)
    end)
    return locked
end

local function releaseSessionLock(userId)
    pcall(function()
        SessionStore:UpdateAsync(tostring(userId), function(current)
            if current == SERVER_ID then
                return nil -- Release
            end
            return current -- Don't touch another server's lock
        end)
    end)
end

-- PLAYER DATA MANAGER
local LoadedData = {}

game.Players.PlayerAdded:Connect(function(player)
    local locked = acquireSessionLock(player.UserId)
    if not locked then
        -- Data locked by another server — kick player or wait
        player:Kick("Your data is being accessed by another server. Try again in 30 seconds.")
        return
    end
    LoadedData[player.UserId] = loadData(player.UserId)
end)

-- SAVE ON LEAVE
game.Players.PlayerRemoving:Connect(function(player)
    if LoadedData[player.UserId] then
        saveData(player.UserId, LoadedData[player.UserId])
        releaseSessionLock(player.UserId)
        LoadedData[player.UserId] = nil
    end
end)

-- AUTOSAVE every 5 minutes
task.spawn(function()
    while true do
        task.wait(300)
        for userId, data in LoadedData do
            saveData(userId, data)
        end
    end
end)

-- BIND TO CLOSE: save all players on server shutdown
game:BindToClose(function()
    if game:GetService("RunService"):IsStudio() then return end
    for _, player in game.Players:GetPlayers() do
        if LoadedData[player.UserId] then
            saveData(player.UserId, LoadedData[player.UserId])
            releaseSessionLock(player.UserId)
        end
    end
end)

=== COMBAT SYSTEM PATTERNS ===

// Pattern from DevForum: The Basics of Combat Games: Health and Damage
// Pattern from DevForum: The Basics of Combat Games: Hitboxes
// ModuleScript per character for stats. Client-detected hitboxes with server validation.

-- STAT MODULE (ModuleScript per character, placed in character model)
local StatManager = {}
StatManager.__index = StatManager

function StatManager.new(config)
    return setmetatable({
        Health    = config.MaxHealth or 100,
        MaxHealth = config.MaxHealth or 100,
        Defense   = config.Defense   or 0,
        Speed     = config.Speed     or 16,
        Blocking  = false,
        Stunned   = false,
        Dead      = false,
        _statuses = {}
    }, StatManager)
end

-- TakeDamage: returns "Kill", "Hit", or "Blocked"
function StatManager:TakeDamage(attackInfo)
    if self.Dead then return "Dead" end
    if self.Blocking and not attackInfo.BlockBreak then return "Blocked" end

    local piercing = attackInfo.Piercing or 0
    local armor = math.max(self.Defense - piercing, 0)
    local finalDamage = math.max((attackInfo.Damage or 10) - armor, 1)

    self.Health = math.max(self.Health - finalDamage, 0)
    if self.Health <= 0 then
        self.Dead = true
        return "Kill"
    end
    return "Hit"
end

-- SetStatus: interrupt-safe status effects using proxy tokens
function StatManager:SetStatus(statusName, duration, effects)
    if self._statuses[statusName] then
        self._statuses[statusName].active = false -- interrupt old
    end

    local token = {} -- unique proxy
    self._statuses[statusName] = { active = true, token = token }

    -- Apply effects
    if effects.Slow then self.Speed = self.Speed * (1 - effects.Slow) end
    if effects.Stun then self.Stunned = true end

    task.delay(duration, function()
        local status = self._statuses[statusName]
        if status and status.token == token then
            -- Remove effects
            if effects.Slow then self.Speed = self.Speed / (1 - effects.Slow) end
            if effects.Stun then self.Stunned = false end
            self._statuses[statusName] = nil
        end
    end)
end

-- HITBOX PATTERNS

-- 1. MAGNITUDE (sphere) — cheapest
local function sphereHitbox(origin, radius, excludeList)
    local hits = {}
    for _, char in workspace:GetChildren() do
        if table.find(excludeList, char) then continue end
        local root = char:FindFirstChild("HumanoidRootPart")
        if root and (root.Position - origin).Magnitude <= radius then
            table.insert(hits, char)
        end
    end
    return hits
end

-- 2. BOX (GetPartsInBox) — for directional swings
local function boxHitbox(cframe, size, excludeList)
    local hits = {}
    local seen = {}
    local params = OverlapParams.new()
    params.FilterDescendantsInstances = excludeList
    params.FilterType = Enum.RaycastFilterType.Exclude

    for _, part in workspace:GetPartBoundsInBox(cframe, size, params) do
        local char = part.Parent
        if char and char:FindFirstChild("Humanoid") and not seen[char] then
            seen[char] = true
            table.insert(hits, char)
        end
    end
    return hits
end

-- 3. RAYCAST (blade sweep) — most precise, for swords
local function bladeRaycast(attachmentA, lastPos, excludeList)
    local params = RaycastParams.new()
    params.FilterDescendantsInstances = excludeList
    params.FilterType = Enum.RaycastFilterType.Exclude

    local direction = attachmentA.WorldPosition - lastPos
    local result = workspace:Raycast(lastPos, direction, params)
    if result and result.Instance then
        local char = result.Instance.Parent
        if char:FindFirstChild("Humanoid") then
            return char
        end
    end
    return nil
end

-- CLIENT-SIDE HIT DETECTION with server validation
-- (Client detects, server validates magnitude before applying damage)

-- SERVER: listen for hit reports
local HitRemote = game.ReplicatedStorage.HitRemote
local HIT_DISTANCE_TOLERANCE = 8 -- max studs for valid hit

HitRemote.OnServerEvent:Connect(function(attacker, victim, attackId)
    -- Validate: attacker must be close enough
    local atkRoot = attacker.Character and attacker.Character:FindFirstChild("HumanoidRootPart")
    local vicRoot = victim:FindFirstChild("HumanoidRootPart")
    if not atkRoot or not vicRoot then return end

    if (atkRoot.Position - vicRoot.Position).Magnitude > HIT_DISTANCE_TOLERANCE then
        warn("Potential exploit:", attacker.Name, "hit too far")
        return
    end

    -- Apply damage server-side using StatManager
    local stats = require(victim.StatManager)
    local result = stats:TakeDamage({ Damage = 15 })

    if result == "Kill" then
        victim.Humanoid.Health = 0
    end
end)

=== NPC PATHFINDING PATTERNS ===

// Pattern from DevForum: Basics of Pathfinding + Civilian NPC Tutorial
// PathfindingService + state machine for complex NPC behavior

local PathfindingService = game:GetService("PathfindingService")

-- BASIC PATHFINDING HELPER
local function moveNPCTo(npc, targetPosition)
    local humanoid = npc:FindFirstChildOfClass("Humanoid")
    if not humanoid then return false end

    local path = PathfindingService:CreatePath({
        AgentRadius   = 2,
        AgentHeight   = 5,
        AgentCanJump  = true,
        AgentJumpHeight = 7.2,
        AgentMaxSlope = 45,
        Costs = { Water = 100 } -- avoid water
    })

    local success, err = pcall(function()
        path:ComputeAsync(npc.HumanoidRootPart.Position, targetPosition)
    end)
    if not success or path.Status ~= Enum.PathStatus.Success then
        return false
    end

    for _, waypoint in path:GetWaypoints() do
        if waypoint.Action == Enum.PathWaypointAction.Jump then
            humanoid.Jump = true
        end
        humanoid:MoveTo(waypoint.Position)
        local reached = humanoid.MoveToFinished:Wait(5)
        if not reached then break end -- stuck, give up
    end
    return true
end

-- WANDER BEHAVIOR
local function npcWander(npc, radius)
    local root = npc.HumanoidRootPart
    local attempts = 0
    repeat
        attempts += 1
        local angle = math.random() * 2 * math.pi
        local dist  = math.random(3, radius)
        local target = root.Position + Vector3.new(
            math.cos(angle) * dist, 0, math.sin(angle) * dist
        )
        if moveNPCTo(npc, target) then break end
    until attempts >= 3
end

-- CUSTOMER NPC STATE MACHINE (for tycoon/restaurant games)
-- States: Spawn → GoToCashier → GoToSeat → Sit → Leave
local function runCustomerNPC(npc, tycoon)
    -- 1. Go to cashier
    local cashier = tycoon:FindFirstChild("CashierDesk")
    if cashier then
        local occupants = cashier:GetAttribute("Occupants") or 0
        if occupants < 3 then
            cashier:SetAttribute("Occupants", occupants + 1)
            moveNPCTo(npc, cashier.Position)
            task.wait(2)
        end
    end

    -- 2. Find free chair
    local function findFreeChair()
        for _, tableModel in tycoon.Tables:GetChildren() do
            for _, chair in tableModel.Chairs:GetChildren() do
                if not chair:GetAttribute("IsOccupied") then
                    return chair
                end
            end
        end
    end

    local chair = findFreeChair()
    if chair then
        chair:SetAttribute("IsOccupied", true)
        moveNPCTo(npc, chair.Position)
        task.wait(math.random(10, 30)) -- sit and eat
        chair:SetAttribute("IsOccupied", false)
    else
        npcWander(npc, 20)
    end

    -- 3. Leave
    local exit = tycoon:FindFirstChild("Exit")
    if exit then
        moveNPCTo(npc, exit.Position)
    end

    if cashier then
        cashier:SetAttribute("Occupants", math.max(0, (cashier:GetAttribute("Occupants") or 1) - 1))
    end
    npc:Destroy()
end

-- NPC SPAWN LOOP
local function startNPCSpawner(spawnZone, tycoons, npcTemplates)
    task.spawn(function()
        while true do
            task.wait(math.random(5, 15))
            local template = npcTemplates[math.random(#npcTemplates)]
            local npc = template:Clone()
            local spawnPos = spawnZone.Position + Vector3.new(
                math.random(-5, 5), 0, math.random(-5, 5)
            )
            npc:PivotTo(CFrame.new(spawnPos))
            npc.Parent = workspace.NPCs

            -- Pick random tycoon to visit
            local tycoon = tycoons[math.random(#tycoons)]
            task.spawn(runCustomerNPC, npc, tycoon)
        end
    end)
end

-- NPC JITTER FIX (from DevForum: NPC Pathfinding jittery solution)
-- Smooth animation by setting WalkSpeed before moving
local function smoothMove(humanoid, targetPos, speed)
    humanoid.WalkSpeed = speed or 16
    humanoid:MoveTo(targetPos)
    humanoid.MoveToFinished:Wait()
    humanoid.WalkSpeed = 0 -- stop slide after reaching target
end

=== ANTI-EXPLOIT PATTERNS ===

// Pattern from DevForum: How to secure your RemoteEvent and RemoteFunction
// Never trust client. Validate everything server-side.

-- RATE LIMITER (prevent remote spam)
local RateLimits = {} -- { userId = { eventName = lastTime } }

local function checkRateLimit(player, eventName, minInterval)
    local userId = player.UserId
    if not RateLimits[userId] then RateLimits[userId] = {} end

    local now = tick()
    local last = RateLimits[userId][eventName] or 0

    if (now - last) < minInterval then
        return false -- Too fast
    end
    RateLimits[userId][eventName] = now
    return true
end

game.Players.PlayerRemoving:Connect(function(player)
    RateLimits[player.UserId] = nil
end)

-- VALIDATION HELPERS
local function validateString(value, maxLen)
    if type(value) ~= "string" then return false end
    if #value > (maxLen or 100) then return false end
    return true
end

local function validateNumber(value, min, max)
    if type(value) ~= "number" then return false end
    if value ~= value then return false end -- NaN check
    if min and value < min then return false end
    if max and value > max then return false end
    return true
end

local function validateInstance(value, className)
    if typeof(value) ~= "Instance" then return false end
    if className and not value:IsA(className) then return false end
    if not value:IsDescendantOf(workspace) and not value:IsDescendantOf(game.Players) then
        return false
    end
    return true
end

local function validateTable(value, maxSize)
    if type(value) ~= "table" then return false end
    local count = 0
    for _ in value do
        count += 1
        if count > (maxSize or 50) then return false end
    end
    return true
end

-- SAFE REMOTE HANDLER WRAPPER
-- Runs handler in separate thread (prevents queue exhaustion attacks)
local function safeHandler(remote, handler)
    remote.OnServerEvent:Connect(function(player, ...)
        task.spawn(handler, player, ...)
    end)
end

-- DISTANCE VALIDATION (prevents teleport/reach exploits)
local function validateDistance(player, position, maxDistance)
    local char = player.Character
    if not char then return false end
    local root = char:FindFirstChild("HumanoidRootPart")
    if not root then return false end
    return (root.Position - position).Magnitude <= maxDistance
end

-- EXAMPLE: Protected item pickup remote
safeHandler(game.ReplicatedStorage.PickupItem, function(player, itemInstance)
    -- Rate limit
    if not checkRateLimit(player, "PickupItem", 0.2) then return end

    -- Type check
    if not validateInstance(itemInstance, "BasePart") then return end

    -- Distance check (must be within 10 studs)
    if not validateDistance(player, itemInstance.Position, 10) then return end

    -- Business logic
    local itemName = itemInstance:GetAttribute("ItemName")
    if not validateString(itemName, 50) then return end

    local inv = PlayerInventories[player.UserId]
    if inv then
        inv:AddItem(itemName, 1)
        itemInstance:Destroy()
    end
end)

-- HONEYPOT REMOTE (detects exploiters)
-- Place a RemoteEvent that legitimate clients NEVER fire
local HoneypotRemote = Instance.new("RemoteEvent")
HoneypotRemote.Name = "SystemInternal" -- sounds legit to exploiters
HoneypotRemote.Parent = game.ReplicatedStorage

HoneypotRemote.OnServerEvent:Connect(function(player)
    -- Only exploiters fire this
    warn("EXPLOIT DETECTED:", player.Name, player.UserId)
    player:Kick("Anti-cheat triggered.")
end)

=== LUAU PERFORMANCE OPTIMIZATION ===

// Pattern from DevForum: Luau Optimizations | Make Your Game Run Faster
// Pattern from DevForum: Luau, Optimizations and Using them consciously

-- 1. TABLE PREALLOCATION (avoid repeated resize)
local function processItems(count)
    local results = table.create(count) -- preallocate
    for i = 1, count do
        results[i] = i * 2
    end
    return results
end

-- Sentinel pattern for ordered removal without gaps
local NULL = table.freeze({})
local pool = table.create(1000, NULL)

-- 2. INSTANCE POOLING (reuse, don't create/destroy)
local BulletTemplate = script.BulletTemplate
local BulletPool = table.create(50)
for i = 1, 50 do
    local b = BulletTemplate:Clone()
    b.Parent = nil
    BulletPool[i] = b
end

local function getBullet()
    return table.remove(BulletPool) or BulletTemplate:Clone()
end

local function returnBullet(bullet)
    bullet.Parent = nil
    bullet.CFrame = CFrame.new(0, -1000, 0) -- park out of world
    table.insert(BulletPool, bullet)
end

-- 3. CACHE FREQUENTLY ACCESSED GLOBALS/SERVICES
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local Players = game:GetService("Players")
-- Cache math functions for hot loops
local floor = math.floor
local random = math.random
local cos = math.cos
local sin = math.sin

-- 4. DELAY PARENTING (set all properties BEFORE parenting)
local function spawnPart(position, size, color)
    local part = Instance.new("Part")
    part.Size = size
    part.Position = position
    part.BrickColor = color
    part.Anchored = true
    part.Parent = workspace -- parent LAST
    return part
end

-- 5. AVOID UPVALUE CAPTURES IN OBJECT METHODS (DUPCLOSURE optimization)
-- Bad: creates new closure per object (unique upvalue)
local function badCreate()
    local obj = {}
    local self = obj
    function obj.update()
        print(self) -- captures unique 'self' per call = new closure
    end
    return obj
end

-- Good: pass self as parameter (shared closure)
local function goodUpdate(self)
    print(self)
end
local function goodCreate()
    local obj = {}
    obj.update = goodUpdate -- same function reference shared
    return obj
end

-- 6. LOCAL VARIABLE CACHING IN HOT LOOPS
-- Bad:
for i = 1, 10000 do
    workspace.Part.CFrame = CFrame.new(i, 0, 0) -- repeated global lookup
end

-- Good:
local part = workspace.Part
local CFrameNew = CFrame.new
for i = 1, 10000 do
    part.CFrame = CFrameNew(i, 0, 0)
end

-- 7. MINIMIZE PRINT/WARN IN PRODUCTION
-- Remove ALL debug prints from loops before shipping
-- Each print call adds ~0.01-0.1ms overhead

-- 8. OFFLOAD VISUALS TO CLIENT
-- Server: validate + store state
-- Client: particles, UI updates, visual effects
-- Use RemoteEvents to notify clients, never replicate visual state from server

-- 9. PARALLEL LUAU for independent workloads (advanced)
-- Use Actor + task.desynchronize() for physics-heavy computations
-- Shared tables via SharedTable for cross-actor communication

-- 10. --!optimize 2 pragma (Luau native codegen, experimental)
-- Add at top of performance-critical ModuleScripts:
-- --!optimize 2
-- Enables native code compilation for ~2-5x speedup in hot loops
`;
