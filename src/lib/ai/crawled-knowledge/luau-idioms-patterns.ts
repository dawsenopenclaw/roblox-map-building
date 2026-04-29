// Advanced Luau programming patterns for production-quality Roblox code
// These are battle-tested idioms used by senior Roblox developers

export const LUAU_IDIOMS_PATTERNS = `
=== ADVANCED LUAU IDIOMS & PATTERNS ===

--- 1. PROMISE PATTERN ---
-- Roblox Promise library style (github.com/evaera/roblox-lua-promise)
-- Use for async chains without nested callbacks

-- Promise.new(executor)
local Promise = {}
Promise.__index = Promise

function Promise.new(executor)
    local self = setmetatable({
        _status = "pending",  -- "pending" | "resolved" | "rejected"
        _value = nil,
        _callbacks = {},
        _errbacks = {},
    }, Promise)

    local function resolve(value)
        if self._status ~= "pending" then return end
        self._status = "resolved"
        self._value = value
        for _, cb in ipairs(self._callbacks) do
            task.spawn(cb, value)
        end
    end

    local function reject(reason)
        if self._status ~= "pending" then return end
        self._status = "rejected"
        self._value = reason
        for _, eb in ipairs(self._errbacks) do
            task.spawn(eb, reason)
        end
    end

    task.spawn(executor, resolve, reject)
    return self
end

function Promise:andThen(onResolved, onRejected)
    return Promise.new(function(resolve, reject)
        local function handleResolved(value)
            local ok, result = pcall(onResolved, value)
            if ok then resolve(result) else reject(result) end
        end
        local function handleRejected(reason)
            if onRejected then
                local ok, result = pcall(onRejected, reason)
                if ok then resolve(result) else reject(result) end
            else
                reject(reason)
            end
        end
        if self._status == "resolved" then
            task.spawn(handleResolved, self._value)
        elseif self._status == "rejected" then
            task.spawn(handleRejected, self._value)
        else
            table.insert(self._callbacks, handleResolved)
            table.insert(self._errbacks, handleRejected)
        end
    end)
end

function Promise:catch(onRejected)
    return self:andThen(nil, onRejected)
end

function Promise.resolve(value)
    return Promise.new(function(resolve) resolve(value) end)
end

function Promise.reject(reason)
    return Promise.new(function(_, reject) reject(reason) end)
end

-- Await a promise (yields current thread)
function Promise:await()
    if self._status == "resolved" then return true, self._value end
    if self._status == "rejected" then return false, self._value end
    local thread = coroutine.running()
    self:andThen(
        function(v) task.spawn(thread, true, v) end,
        function(e) task.spawn(thread, false, e) end
    )
    return coroutine.yield()
end

-- Usage example:
local function fetchPlayerData(userId)
    return Promise.new(function(resolve, reject)
        local success, data = pcall(function()
            return game:GetService("DataStoreService")
                :GetDataStore("PlayerData")
                :GetAsync(tostring(userId))
        end)
        if success then resolve(data or {}) else reject(data) end
    end)
end

-- Chain style:
fetchPlayerData(12345)
    :andThen(function(data)
        print("Got data:", data.level)
        return data.level * 100  -- passes to next andThen
    end)
    :andThen(function(xp)
        print("XP:", xp)
    end)
    :catch(function(err)
        warn("Failed:", err)
    end)

-- Await style (inside a task.spawn or coroutine):
task.spawn(function()
    local ok, data = fetchPlayerData(12345):await()
    if ok then
        print("Level:", data.level)
    else
        warn("Error:", data)
    end
end)


--- 2. STATE MACHINE PATTERN ---
-- Generic reusable FSM. Works for NPCs, game phases, UI, combat combos.

local StateMachine = {}
StateMachine.__index = StateMachine

function StateMachine.new(initialState, states)
    -- states = { StateName = { enter=fn, exit=fn, update=fn, transitions={Event=NextState} } }
    local self = setmetatable({
        _states = states,
        _current = nil,
        _data = {},  -- shared context between states
    }, StateMachine)
    self:transition(initialState)
    return self
end

function StateMachine:transition(newState, ...)
    local prev = self._current
    if prev and self._states[prev] and self._states[prev].exit then
        self._states[prev].exit(self._data, newState)
    end
    self._current = newState
    if self._states[newState] and self._states[newState].enter then
        self._states[newState].enter(self._data, prev, ...)
    end
end

function StateMachine:update(dt)
    local state = self._states[self._current]
    if state and state.update then
        state.update(self._data, dt)
    end
end

function StateMachine:handle(event, ...)
    local state = self._states[self._current]
    if not state then return end
    local transitions = state.transitions
    if transitions and transitions[event] then
        self:transition(transitions[event], ...)
        return true
    end
    return false
end

function StateMachine:getState()
    return self._current
end

-- NPC example:
local npcFSM = StateMachine.new("Idle", {
    Idle = {
        enter = function(data) data.idleTimer = 0 end,
        update = function(data, dt)
            data.idleTimer += dt
            if data.idleTimer > 3 then
                -- trigger patrol after 3s idle
                data.machine:handle("StartPatrol")
            end
        end,
        transitions = { StartPatrol = "Patrol", SpotPlayer = "Chase" }
    },
    Patrol = {
        enter = function(data) data.waypointIndex = 1 end,
        update = function(data, dt)
            -- move toward waypoints
        end,
        exit = function(data) data.waypointIndex = nil end,
        transitions = { SpotPlayer = "Chase", ReachedEnd = "Idle" }
    },
    Chase = {
        enter = function(data, prev, target)
            data.target = target
        end,
        update = function(data, dt)
            if not data.target or not data.target.Parent then
                data.machine:handle("LostPlayer")
            end
        end,
        transitions = { LostPlayer = "Idle", InRange = "Attack" }
    },
    Attack = {
        enter = function(data) data.attackCooldown = 0 end,
        update = function(data, dt)
            data.attackCooldown -= dt
            if data.attackCooldown <= 0 then
                data.attackCooldown = 1.5
                -- deal damage
            end
        end,
        transitions = { OutOfRange = "Chase", LostPlayer = "Idle" }
    },
})
npcFSM._data.machine = npcFSM  -- give states access to the machine

-- Game loop integration:
game:GetService("RunService").Heartbeat:Connect(function(dt)
    npcFSM:update(dt)
end)


--- 3. OBSERVER PATTERN (Signal) ---
-- Custom Signal wrapping BindableEvent. :Connect, :Fire, :Wait, :Once, :Disconnect

local Signal = {}
Signal.__index = Signal

function Signal.new()
    local self = setmetatable({
        _connections = {},
        _nextId = 0,
    }, Signal)
    return self
end

function Signal:Connect(callback)
    self._nextId += 1
    local id = self._nextId
    self._connections[id] = callback

    local connection = {
        Connected = true,
        Disconnect = function(conn)
            conn.Connected = false
            self._connections[id] = nil
        end,
    }
    return connection
end

function Signal:Once(callback)
    local conn
    conn = self:Connect(function(...)
        conn:Disconnect()
        callback(...)
    end)
    return conn
end

function Signal:Fire(...)
    -- snapshot to avoid mutation during iteration
    local snapshot = {}
    for id, cb in pairs(self._connections) do
        snapshot[id] = cb
    end
    for _, cb in pairs(snapshot) do
        task.spawn(cb, ...)
    end
end

function Signal:Wait()
    local thread = coroutine.running()
    local conn
    conn = self:Once(function(...)
        task.spawn(thread, ...)
    end)
    return coroutine.yield()
end

function Signal:DisconnectAll()
    self._connections = {}
end

-- Usage:
local onPlayerDied = Signal.new()

-- Server: listen
local conn = onPlayerDied:Connect(function(player, killer)
    print(player.Name, "was killed by", killer and killer.Name or "the environment")
    -- respawn logic
end)

-- Fire it:
onPlayerDied:Fire(game.Players:GetPlayers()[1], nil)

-- One-shot:
onPlayerDied:Once(function(player)
    print("First death was:", player.Name)
end)

-- Yield until fired:
task.spawn(function()
    local player, killer = onPlayerDied:Wait()
    print("Waited for death, got:", player.Name)
end)

-- Cleanup:
conn:Disconnect()


--- 4. OBJECT POOL PATTERN ---
-- Pre-allocate parts/projectiles. Take/return cycle. Auto-grow if empty.

local ObjectPool = {}
ObjectPool.__index = ObjectPool

function ObjectPool.new(template, initialSize, parent)
    local self = setmetatable({
        _template = template,
        _parent = parent or workspace,
        _available = {},
        _inUse = {},
        _size = 0,
    }, ObjectPool)
    self:_grow(initialSize)
    return self
end

function ObjectPool:_grow(count)
    for i = 1, count do
        local obj = self._template:Clone()
        obj.Parent = self._parent
        obj:SetAttribute("PoolActive", false)
        if obj:IsA("BasePart") then
            obj.Anchored = true
            obj.CanCollide = false
            obj.Transparency = 1
            obj.CFrame = CFrame.new(0, -1000, 0)  -- hide under map
        end
        table.insert(self._available, obj)
        self._size += 1
    end
end

function ObjectPool:Take(cframe)
    if #self._available == 0 then
        self:_grow(math.max(1, math.floor(self._size * 0.5)))  -- grow 50%
        warn("ObjectPool: auto-grew to", self._size)
    end
    local obj = table.remove(self._available)
    obj:SetAttribute("PoolActive", true)
    if cframe and obj:IsA("BasePart") then
        obj.CFrame = cframe
        obj.Anchored = false
        obj.CanCollide = true
        obj.Transparency = 0
    end
    self._inUse[obj] = true
    return obj
end

function ObjectPool:Return(obj)
    if not self._inUse[obj] then return end
    self._inUse[obj] = nil
    obj:SetAttribute("PoolActive", false)
    if obj:IsA("BasePart") then
        obj.Anchored = true
        obj.CanCollide = false
        obj.Transparency = 1
        obj.CFrame = CFrame.new(0, -1000, 0)
        obj.Velocity = Vector3.zero
        obj.RotVelocity = Vector3.zero
    end
    table.insert(self._available, obj)
end

function ObjectPool:ReturnAll()
    for obj in pairs(self._inUse) do
        self:Return(obj)
    end
end

-- Usage: bullet pool
local bulletTemplate = Instance.new("Part")
bulletTemplate.Name = "Bullet"
bulletTemplate.Size = Vector3.new(0.2, 0.2, 1)
bulletTemplate.Shape = Enum.PartType.Cylinder

local bulletPool = ObjectPool.new(bulletTemplate, 50, workspace.Bullets)

-- Fire a bullet:
local function fireBullet(origin, direction)
    local bullet = bulletPool:Take(CFrame.new(origin, origin + direction))
    -- move bullet with BodyVelocity
    local bv = Instance.new("BodyVelocity", bullet)
    bv.Velocity = direction.Unit * 200
    bv.MaxForce = Vector3.new(1e5, 1e5, 1e5)

    task.delay(3, function()
        bv:Destroy()
        bulletPool:Return(bullet)
    end)
end


--- 5. COMPONENT SYSTEM (CollectionService ECS-lite) ---
-- Tag instances with CollectionService, auto-attach behavior modules, clean lifecycle.

local CollectionService = game:GetService("CollectionService")
local ComponentRegistry = {}

-- Register a component for a tag
function ComponentRegistry.register(tag, componentModule)
    -- componentModule must have: .new(instance) → { :start(), :stop() }
    local function onAdded(instance)
        local component = componentModule.new(instance)
        instance:SetAttribute("_comp_" .. tag, true)
        component:start()

        -- cleanup when instance removed or tag removed
        local conn1 = instance.AncestryChanged:Connect(function()
            if not instance:IsDescendantOf(game) then
                component:stop()
                conn1:Disconnect()
            end
        end)
        CollectionService:GetInstanceRemovedSignal(tag):Connect(function(removed)
            if removed == instance then
                component:stop()
                conn1:Disconnect()
            end
        end)
    end

    -- Attach to existing tagged instances
    for _, instance in ipairs(CollectionService:GetTagged(tag)) do
        task.spawn(onAdded, instance)
    end
    -- Watch for new ones
    CollectionService:GetInstanceAddedSignal(tag):Connect(onAdded)
end

-- Example component: "Spinnable" tag makes parts rotate
local SpinComponent = {}
SpinComponent.__index = SpinComponent

function SpinComponent.new(instance)
    return setmetatable({
        _instance = instance,
        _connection = nil,
        _speed = instance:GetAttribute("SpinSpeed") or 90,  -- degrees/sec
    }, SpinComponent)
end

function SpinComponent:start()
    self._connection = game:GetService("RunService").Heartbeat:Connect(function(dt)
        if self._instance and self._instance.Parent then
            self._instance.CFrame *= CFrame.Angles(0, math.rad(self._speed * dt), 0)
        end
    end)
end

function SpinComponent:stop()
    if self._connection then
        self._connection:Disconnect()
        self._connection = nil
    end
end

-- Register it:
ComponentRegistry.register("Spinnable", SpinComponent)
-- Now any Part tagged "Spinnable" in Studio will auto-spin!


--- 6. COMMAND PATTERN (Undo/Redo) ---
-- Action queue with execute/undo for builder tools.

local CommandHistory = {}
CommandHistory.__index = CommandHistory

function CommandHistory.new(maxHistory)
    return setmetatable({
        _undoStack = {},
        _redoStack = {},
        _maxHistory = maxHistory or 50,
    }, CommandHistory)
end

function CommandHistory:execute(command)
    -- command = { execute=fn, undo=fn, name=string }
    command.execute()
    table.insert(self._undoStack, command)
    -- cap history
    if #self._undoStack > self._maxHistory then
        table.remove(self._undoStack, 1)
    end
    -- clear redo stack on new action
    self._redoStack = {}
end

function CommandHistory:undo()
    if #self._undoStack == 0 then return false end
    local command = table.remove(self._undoStack)
    command.undo()
    table.insert(self._redoStack, command)
    return true, command.name
end

function CommandHistory:redo()
    if #self._redoStack == 0 then return false end
    local command = table.remove(self._redoStack)
    command.execute()
    table.insert(self._undoStack, command)
    return true, command.name
end

function CommandHistory:canUndo() return #self._undoStack > 0 end
function CommandHistory:canRedo() return #self._redoStack > 0 end

-- Usage: move part command
local history = CommandHistory.new(100)

local function makeMoveCommand(part, newCFrame)
    local oldCFrame = part.CFrame
    return {
        name = "Move " .. part.Name,
        execute = function() part.CFrame = newCFrame end,
        undo = function() part.CFrame = oldCFrame end,
    }
end

-- Execute:
history:execute(makeMoveCommand(workspace.MyPart, CFrame.new(10, 5, 0)))
-- Undo:
history:undo()
-- Redo:
history:redo()


--- 7. SINGLETON MODULE PATTERN ---
-- Standard Roblox module: return table, lazy init, shared state.

-- GameManager.lua (ModuleScript in ServerScriptService)
local GameManager = {}
GameManager.__index = GameManager

local _instance = nil  -- singleton instance

function GameManager.getInstance()
    if not _instance then
        _instance = setmetatable({
            _phase = "Lobby",
            _roundNumber = 0,
            _players = {},
            _initialized = false,
        }, GameManager)
        _instance:_init()
    end
    return _instance
end

function GameManager:_init()
    if self._initialized then return end
    self._initialized = true

    game.Players.PlayerAdded:Connect(function(player)
        self._players[player.UserId] = player
    end)
    game.Players.PlayerRemoving:Connect(function(player)
        self._players[player.UserId] = nil
    end)
end

function GameManager:startRound()
    self._roundNumber += 1
    self._phase = "InRound"
    print("Round", self._roundNumber, "started")
end

function GameManager:endRound(winnerTeam)
    self._phase = "PostRound"
    print("Round ended, winner:", winnerTeam)
end

function GameManager:getPhase() return self._phase end
function GameManager:getRoundNumber() return self._roundNumber end

-- Usage from any server script:
-- local GameManager = require(game.ServerScriptService.GameManager)
-- local gm = GameManager.getInstance()
-- gm:startRound()


--- 8. RATE LIMITER (Token Bucket) ---
-- Server-side per-player rate limiting. Essential anti-exploit.

local RateLimiter = {}
RateLimiter.__index = RateLimiter

function RateLimiter.new(maxTokens, refillRate)
    -- maxTokens: burst capacity
    -- refillRate: tokens added per second
    return setmetatable({
        _maxTokens = maxTokens,
        _refillRate = refillRate,
        _buckets = {},  -- [userId] = { tokens, lastRefill }
    }, RateLimiter)
end

function RateLimiter:_getBucket(userId)
    if not self._buckets[userId] then
        self._buckets[userId] = {
            tokens = self._maxTokens,
            lastRefill = os.clock(),
        }
    end
    return self._buckets[userId]
end

function RateLimiter:check(userId, cost)
    cost = cost or 1
    local bucket = self:_getBucket(userId)
    local now = os.clock()
    local elapsed = now - bucket.lastRefill

    -- refill tokens
    bucket.tokens = math.min(
        self._maxTokens,
        bucket.tokens + elapsed * self._refillRate
    )
    bucket.lastRefill = now

    if bucket.tokens >= cost then
        bucket.tokens -= cost
        return true
    end
    return false  -- rate limited
end

function RateLimiter:removePlayer(userId)
    self._buckets[userId] = nil
end

-- Usage: 10 burst, 2 per second
local attackLimiter = RateLimiter.new(10, 2)

-- In RemoteEvent handler:
local function onPlayerAttack(player)
    if not attackLimiter:check(player.UserId) then
        warn("Rate limited:", player.Name)
        return  -- silently reject exploit
    end
    -- process attack...
end

game.Players.PlayerRemoving:Connect(function(player)
    attackLimiter:removePlayer(player.UserId)
end)


--- 9. DEBOUNCE PATTERNS ---
-- 4 variants: simple cooldown, leading-edge, trailing-edge, throttle.

-- Variant 1: Simple per-player cooldown table
local cooldowns = {}

local function onPlayerAction(player)
    if cooldowns[player.UserId] then return end
    cooldowns[player.UserId] = true

    -- do the action
    print(player.Name, "performed action")

    task.delay(0.5, function()
        cooldowns[player.UserId] = nil
    end)
end

-- Variant 2: Leading-edge debounce (fires immediately, ignores until cooldown ends)
local function makeLeadingDebounce(fn, delay)
    local lastFired = -math.huge
    return function(...)
        local now = os.clock()
        if now - lastFired >= delay then
            lastFired = now
            fn(...)
        end
    end
end

local debouncedPrint = makeLeadingDebounce(function(msg)
    print("Debounced:", msg)
end, 0.3)

-- Variant 3: Trailing-edge debounce (fires after activity stops)
local function makeTrailingDebounce(fn, delay)
    local timer = nil
    return function(...)
        local args = {...}
        if timer then task.cancel(timer) end
        timer = task.delay(delay, function()
            timer = nil
            fn(table.unpack(args))
        end)
    end
end

local trailingSearch = makeTrailingDebounce(function(query)
    print("Search for:", query)
end, 0.5)

-- Variant 4: Throttle (fires at most once per interval, leading + trailing)
local function makeThrottle(fn, interval)
    local lastCall = -math.huge
    local pendingTimer = nil
    local pendingArgs = nil

    return function(...)
        local now = os.clock()
        pendingArgs = {...}
        if now - lastCall >= interval then
            lastCall = now
            if pendingTimer then task.cancel(pendingTimer) pendingTimer = nil end
            fn(table.unpack(pendingArgs))
        elseif not pendingTimer then
            local remaining = interval - (now - lastCall)
            pendingTimer = task.delay(remaining, function()
                pendingTimer = nil
                lastCall = os.clock()
                fn(table.unpack(pendingArgs))
            end)
        end
    end
end

local throttledUpdate = makeThrottle(function(value)
    print("Update:", value)
end, 0.1)  -- max 10 times per second


--- 10. SAFE REMOTE HANDLER ---
-- Type-checking wrapper for RemoteEvent/RemoteFunction. Validates every argument.

local function safeRemote(remote, handler, schema)
    -- schema = { {type="string", optional=false}, {type="number"}, ... }
    local function validateArgs(...)
        local args = {...}
        -- first arg is always Player on server, skip it in schema
        local offset = remote:IsA("RemoteEvent") and 1 or 0
        for i, rule in ipairs(schema) do
            local val = args[i + offset]
            if val == nil then
                if not rule.optional then
                    return false, "Missing arg " .. i
                end
            elseif type(val) ~= rule.type then
                return false, string.format("Arg %d: expected %s, got %s", i, rule.type, type(val))
            elseif rule.validate and not rule.validate(val) then
                return false, "Arg " .. i .. " failed validation"
            end
        end
        return true
    end

    if remote:IsA("RemoteEvent") then
        remote.OnServerEvent:Connect(function(player, ...)
            local ok, err = validateArgs(...)
            if not ok then
                warn(string.format("[SafeRemote] %s from %s: %s", remote.Name, player.Name, err))
                return
            end
            local success, handlerErr = pcall(handler, player, ...)
            if not success then
                warn("[SafeRemote] Handler error:", handlerErr)
            end
        end)
    elseif remote:IsA("RemoteFunction") then
        remote.OnServerInvoke = function(player, ...)
            local ok, err = validateArgs(...)
            if not ok then
                warn(string.format("[SafeRemote] %s from %s: %s", remote.Name, player.Name, err))
                return nil, "Invalid request"
            end
            local success, result = pcall(handler, player, ...)
            if not success then
                warn("[SafeRemote] Handler error:", result)
                return nil, "Server error"
            end
            return result
        end
    end
end

-- Usage: purchase item remote
local purchaseRemote = game.ReplicatedStorage.Remotes.PurchaseItem
safeRemote(purchaseRemote, function(player, itemId, quantity)
    -- itemId is guaranteed string, quantity is guaranteed number 1-100
    print(player.Name, "buying", quantity, "of", itemId)
end, {
    { type = "string", validate = function(v) return #v > 0 and #v < 50 end },
    { type = "number", validate = function(v) return v >= 1 and v <= 100 and v == math.floor(v) end },
})


--- 11. DATA MIGRATION ---
-- Version-stamped player data with migration functions. No data loss on schema changes.

local DataVersion = 4  -- bump this when schema changes

local Migrations = {
    -- version 1 → 2: added "inventory" field
    [1] = function(data)
        data.inventory = data.inventory or {}
        return data
    end,
    -- version 2 → 3: split "stats" into "combat" and "social"
    [2] = function(data)
        data.combat = { kills = data.stats and data.stats.kills or 0 }
        data.social = { friends = data.stats and data.stats.friends or 0 }
        data.stats = nil
        return data
    end,
    -- version 3 → 4: added "settings" with defaults
    [3] = function(data)
        data.settings = {
            musicVolume = 0.5,
            sfxVolume = 1.0,
            autoSprint = false,
        }
        return data
    end,
}

local function migrateData(data)
    local version = data._version or 1

    if version == DataVersion then
        return data  -- already current
    end

    print(string.format("Migrating data from v%d to v%d", version, DataVersion))

    for v = version, DataVersion - 1 do
        if Migrations[v] then
            local ok, result = pcall(Migrations[v], data)
            if ok then
                data = result
            else
                warn("Migration v" .. v .. " failed:", result)
                -- continue with partial migration, don't lose all data
            end
        end
        data._version = v + 1
    end

    return data
end

local function getDefaultData()
    return {
        _version = DataVersion,
        level = 1,
        xp = 0,
        coins = 0,
        inventory = {},
        combat = { kills = 0 },
        social = { friends = 0 },
        settings = {
            musicVolume = 0.5,
            sfxVolume = 1.0,
            autoSprint = false,
        },
    }
end

-- In DataStore loader:
local function loadPlayerData(player)
    local rawData = game:GetService("DataStoreService")
        :GetDataStore("PlayerData_v2")
        :GetAsync(tostring(player.UserId))

    if not rawData then
        return getDefaultData()
    end

    return migrateData(rawData)
end


--- 12. TWEEN SEQUENCE ---
-- Chain tweens with :Completed:Wait(). Complex multi-step animations.

local TweenService = game:GetService("TweenService")

-- Helper: play tween and wait for it to finish
local function playTween(instance, tweenInfo, goals)
    local tween = TweenService:Create(instance, tweenInfo, goals)
    tween:Play()
    tween.Completed:Wait()
    return tween
end

-- Helper: build a sequence (array of steps, runs in order)
local function runTweenSequence(steps)
    -- steps = { { instance, TweenInfo, goals }, ... }
    -- Each step can also be a function for non-tween steps
    return task.spawn(function()
        for _, step in ipairs(steps) do
            if type(step) == "function" then
                step()
            else
                playTween(step[1], step[2], step[3])
            end
        end
    end)
end

-- Example: door open animation (slide up, pause, slide back)
local function animateDoorOpen(door)
    local fast = TweenInfo.new(0.3, Enum.EasingStyle.Back, Enum.EasingDirection.Out)
    local slow = TweenInfo.new(0.5, Enum.EasingStyle.Quad, Enum.EasingDirection.In)
    local wait3s = TweenInfo.new(3)

    local originalCFrame = door.CFrame
    local openCFrame = door.CFrame * CFrame.new(0, door.Size.Y, 0)

    runTweenSequence({
        { door, fast, { CFrame = openCFrame } },  -- slide open
        function() task.wait(3) end,               -- hold open
        { door, slow, { CFrame = originalCFrame } }, -- slide close
    })
end

-- Parallel tweens (run multiple at once, wait for all):
local function animateButtonPress(button)
    local info = TweenInfo.new(0.1, Enum.EasingStyle.Bounce)

    -- Start both tweens simultaneously
    local t1 = TweenService:Create(button, info, { Size = button.Size * Vector3.new(1, 0.8, 1) })
    local t2 = TweenService:Create(button, info, { Color = Color3.fromRGB(255, 200, 50) })
    t1:Play()
    t2:Play()
    t1.Completed:Wait()  -- wait for the shared duration

    -- Return to normal
    local t3 = TweenService:Create(button, TweenInfo.new(0.2), {
        Size = button.Size,
        Color = Color3.fromRGB(255, 255, 255)
    })
    t3:Play()
    t3.Completed:Wait()
end

-- Looping sequence (for idle animations):
local function startIdleLoop(part)
    local running = true
    task.spawn(function()
        while running do
            playTween(part, TweenInfo.new(1.5, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut), {
                Position = part.Position + Vector3.new(0, 0.5, 0)
            })
            playTween(part, TweenInfo.new(1.5, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut), {
                Position = part.Position
            })
        end
    end)
    return function() running = false end  -- returns stop function
end

=== END LUAU IDIOMS & PATTERNS ===
`
