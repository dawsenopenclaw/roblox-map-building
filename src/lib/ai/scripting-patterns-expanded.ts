// scripting-patterns-expanded.ts
// Roblox Luau scripting patterns, system designs, service deep dives, and common bugs.
// No backticks inside template strings. All code samples use single/double quotes.

export const SCRIPT_DESIGN_PATTERNS = `
=== LUAU DESIGN PATTERNS ===

--- SINGLETON MODULE ---
-- Guarantees one instance shared across all requirers in the same VM.
local MyService = {}
MyService.__index = MyService

local instance = nil

function MyService.getInstance()
  if not instance then
    instance = setmetatable({}, MyService)
    instance._data = {}
    instance._initialized = false
  end
  return instance
end

function MyService:init()
  if self._initialized then return end
  self._initialized = true
  -- setup logic here
end

function MyService:get(key)
  return self._data[key]
end

function MyService:set(key, value)
  self._data[key] = value
end

return MyService
-- Usage: local svc = require(path).getInstance()  svc:init()

--- OBSERVER / SIGNAL (BindableEvent-based) ---
-- Lightweight event bus. Replaces direct coupling between modules.
local Signal = {}
Signal.__index = Signal

function Signal.new()
  local self = setmetatable({}, Signal)
  self._event = Instance.new("BindableEvent")
  self.Event = self._event.Event
  return self
end

function Signal:Fire(...)
  self._event:Fire(...)
end

function Signal:Connect(fn)
  return self._event.Event:Connect(fn)
end

function Signal:Wait()
  return self._event.Event:Wait()
end

function Signal:Destroy()
  self._event:Destroy()
end

return Signal
-- Usage:
-- local onDamage = Signal.new()
-- onDamage:Connect(function(amount) print("took", amount) end)
-- onDamage:Fire(50)

--- STATE MACHINE ---
-- Enum states + explicit transition table. Prevents invalid state changes.
local StateMachine = {}
StateMachine.__index = StateMachine

local State = {
  Idle = "Idle",
  Running = "Running",
  Jumping = "Jumping",
  Attacking = "Attacking",
  Dead = "Dead",
}

local TRANSITIONS = {
  [State.Idle]      = { State.Running, State.Jumping, State.Attacking, State.Dead },
  [State.Running]   = { State.Idle, State.Jumping, State.Dead },
  [State.Jumping]   = { State.Idle, State.Running, State.Dead },
  [State.Attacking] = { State.Idle, State.Dead },
  [State.Dead]      = {},
}

function StateMachine.new(initialState)
  local self = setmetatable({}, StateMachine)
  self.current = initialState or State.Idle
  self._handlers = {}
  return self
end

function StateMachine:canTransition(newState)
  local allowed = TRANSITIONS[self.current]
  if not allowed then return false end
  for _, s in ipairs(allowed) do
    if s == newState then return true end
  end
  return false
end

function StateMachine:transition(newState)
  if not self:canTransition(newState) then
    warn("Invalid transition: " .. self.current .. " -> " .. newState)
    return false
  end
  local old = self.current
  self.current = newState
  if self._handlers[newState] then
    self._handlers[newState](old, newState)
  end
  return true
end

function StateMachine:onEnter(state, fn)
  self._handlers[state] = fn
end

return { StateMachine = StateMachine, State = State }

--- OBJECT POOL ---
-- Reuse expensive instances (particles, projectiles, NPCs) instead of creating/destroying.
local ObjectPool = {}
ObjectPool.__index = ObjectPool

function ObjectPool.new(template, initialSize)
  local self = setmetatable({}, ObjectPool)
  self._template = template
  self._available = {}
  self._active = {}
  for i = 1, initialSize or 10 do
    local obj = template:Clone()
    obj.Parent = workspace
    obj:SetAttribute("InPool", true)
    table.insert(self._available, obj)
  end
  return self
end

function ObjectPool:acquire()
  local obj = table.remove(self._available)
  if not obj then
    obj = self._template:Clone()
    obj.Parent = workspace
  end
  obj:SetAttribute("InPool", false)
  self._active[obj] = true
  return obj
end

function ObjectPool:release(obj)
  if not self._active[obj] then return end
  self._active[obj] = nil
  obj:SetAttribute("InPool", true)
  -- reset position/state before returning to pool
  table.insert(self._available, obj)
end

function ObjectPool:releaseAll()
  for obj in pairs(self._active) do
    self:release(obj)
  end
end

return ObjectPool

--- COMMAND PATTERN ---
-- Encapsulate actions as objects. Enables undo, queuing, logging.
local CommandQueue = {}
CommandQueue.__index = CommandQueue

function CommandQueue.new()
  local self = setmetatable({}, CommandQueue)
  self._history = {}
  return self
end

function CommandQueue:execute(cmd)
  -- cmd must have :execute() and optionally :undo()
  cmd:execute()
  table.insert(self._history, cmd)
end

function CommandQueue:undo()
  local cmd = table.remove(self._history)
  if cmd and cmd.undo then
    cmd:undo()
  end
end

-- Example command
local function MoveCommand(part, delta)
  return {
    execute = function(self)
      part.Position = part.Position + delta
    end,
    undo = function(self)
      part.Position = part.Position - delta
    end,
  }
end

--- FACTORY ---
-- Centralize creation of configured instances. Caller gets a ready object.
local EnemyFactory = {}

local ENEMY_CONFIGS = {
  Goblin  = { Health = 50,  Speed = 16, Damage = 10, ModelId = "rbxassetid://111" },
  Orc     = { Health = 150, Speed = 10, Damage = 30, ModelId = "rbxassetid://222" },
  Dragon  = { Health = 500, Speed = 20, Damage = 80, ModelId = "rbxassetid://333" },
}

function EnemyFactory.create(enemyType, spawnCFrame)
  local config = ENEMY_CONFIGS[enemyType]
  assert(config, "Unknown enemy type: " .. tostring(enemyType))

  local model = Instance.new("Model")
  model.Name = enemyType

  local humanoid = Instance.new("Humanoid", model)
  humanoid.MaxHealth = config.Health
  humanoid.Health = config.Health
  humanoid.WalkSpeed = config.Speed

  model:SetAttribute("Damage", config.Damage)
  model:SetAttribute("EnemyType", enemyType)
  model.Parent = workspace

  -- position root part
  local root = Instance.new("Part", model)
  root.Name = "HumanoidRootPart"
  root.Anchored = false
  root.CanCollide = false
  root.CFrame = spawnCFrame

  return model
end

return EnemyFactory

--- STRATEGY PATTERN ---
-- Swap behavior at runtime without changing the caller.
local MovementStrategies = {}

MovementStrategies.Walk = {
  move = function(humanoid, target)
    humanoid:MoveTo(target)
  end
}

MovementStrategies.Teleport = {
  move = function(humanoid, target)
    local root = humanoid.Parent:FindFirstChild("HumanoidRootPart")
    if root then root.CFrame = CFrame.new(target) end
  end
}

MovementStrategies.Dash = {
  move = function(humanoid, target)
    local root = humanoid.Parent:FindFirstChild("HumanoidRootPart")
    if not root then return end
    local dir = (target - root.Position).Unit
    root.Velocity = dir * 100
  end
}

local NPC = {}
NPC.__index = NPC

function NPC.new(model, strategy)
  local self = setmetatable({}, NPC)
  self.humanoid = model:FindFirstChildOfClass("Humanoid")
  self.strategy = strategy or MovementStrategies.Walk
  return self
end

function NPC:moveTo(target)
  self.strategy.move(self.humanoid, target)
end

function NPC:setStrategy(strategy)
  self.strategy = strategy
end

return { MovementStrategies = MovementStrategies, NPC = NPC }
`;

export const SCRIPT_SYSTEMS = `
=== COMPLETE SYSTEM IMPLEMENTATIONS ===

--- DATASTORE WITH SESSION LOCKING ---
-- Uses UpdateAsync to claim a lock. Prevents data corruption from multiple servers.
-- Auto-saves every 60s. Exponential backoff on failure.
local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

local PlayerDataStore = DataStoreService:GetDataStore("PlayerData_v3")
local LockStore      = DataStoreService:GetDataStore("SessionLocks_v3")

local LOCK_EXPIRY = 30   -- seconds before a lock is considered stale
local SAVE_INTERVAL = 60 -- auto-save cadence
local MAX_RETRIES = 5

local sessionData = {}   -- [userId] = { data, dirty, lockAcquired }

-- exponential backoff retry
local function withRetry(fn, retries)
  local attempt = 0
  while attempt < (retries or MAX_RETRIES) do
    local ok, result = pcall(fn)
    if ok then return result end
    attempt = attempt + 1
    task.wait(2 ^ attempt)
  end
  warn("DataStore: max retries exceeded")
  return nil
end

local function acquireLock(userId)
  local key = "lock_" .. userId
  local now = os.time()
  local acquired = false
  withRetry(function()
    LockStore:UpdateAsync(key, function(current)
      if current and (now - current.timestamp) < LOCK_EXPIRY then
        -- another server holds the lock
        return nil
      end
      acquired = true
      return { jobId = game.JobId, timestamp = now }
    end)
  end)
  return acquired
end

local function releaseLock(userId)
  local key = "lock_" .. userId
  withRetry(function()
    LockStore:UpdateAsync(key, function(current)
      if current and current.jobId == game.JobId then
        return nil  -- delete by returning nil
      end
      return current
    end)
  end)
end

local DEFAULT_DATA = {
  coins = 0,
  level = 1,
  xp = 0,
  inventory = {},
  settings = {},
}

local function loadData(userId)
  local data = withRetry(function()
    return PlayerDataStore:GetAsync(tostring(userId))
  end)
  if not data then
    data = {}
    for k, v in pairs(DEFAULT_DATA) do data[k] = v end
  end
  return data
end

local function saveData(userId)
  local session = sessionData[userId]
  if not session or not session.dirty then return end
  withRetry(function()
    PlayerDataStore:UpdateAsync(tostring(userId), function()
      return session.data
    end)
  end)
  session.dirty = false
end

Players.PlayerAdded:Connect(function(player)
  local userId = player.UserId
  local locked = acquireLock(userId)
  if not locked then
    warn("Could not acquire lock for " .. player.Name .. ". Kicking.")
    player:Kick("Your data is locked by another server. Try again in 30s.")
    return
  end
  local data = loadData(userId)
  sessionData[userId] = { data = data, dirty = false, lockAcquired = true }
end)

Players.PlayerRemoving:Connect(function(player)
  local userId = player.UserId
  saveData(userId)
  releaseLock(userId)
  sessionData[userId] = nil
end)

-- auto-save loop
task.spawn(function()
  while true do
    task.wait(SAVE_INTERVAL)
    for userId in pairs(sessionData) do
      saveData(userId)
    end
  end
end)

-- bind-to-close for shutdown
game:BindToClose(function()
  for userId in pairs(sessionData) do
    saveData(userId)
    releaseLock(userId)
  end
end)

-- Public API
local DataManager = {}

function DataManager:get(player, key)
  local session = sessionData[player.UserId]
  if not session then return nil end
  return session.data[key]
end

function DataManager:set(player, key, value)
  local session = sessionData[player.UserId]
  if not session then return end
  session.data[key] = value
  session.dirty = true
end

function DataManager:increment(player, key, amount)
  local current = self:get(player, key) or 0
  self:set(player, key, current + (amount or 1))
end

return DataManager

--- INVENTORY SYSTEM ---
local SLOT_LIMIT = 40

local Inventory = {}
Inventory.__index = Inventory

function Inventory.new(playerData)
  local self = setmetatable({}, Inventory)
  self._items = playerData.inventory or {}
  self._data = playerData
  return self
end

function Inventory:count()
  local n = 0
  for _ in pairs(self._items) do n = n + 1 end
  return n
end

function Inventory:findStack(itemId)
  for i, slot in ipairs(self._items) do
    if slot.itemId == itemId and slot.quantity < (slot.maxStack or 99) then
      return i, slot
    end
  end
  return nil, nil
end

function Inventory:add(itemId, quantity, metadata)
  quantity = quantity or 1
  metadata = metadata or {}
  local maxStack = metadata.maxStack or 99

  -- try to stack first
  local idx, slot = self:findStack(itemId)
  if idx then
    local space = maxStack - slot.quantity
    local toAdd = math.min(space, quantity)
    slot.quantity = slot.quantity + toAdd
    quantity = quantity - toAdd
  end

  -- remaining goes to new slots
  while quantity > 0 do
    if self:count() >= SLOT_LIMIT then
      warn("Inventory full, could not add " .. itemId)
      return false
    end
    local toAdd = math.min(maxStack, quantity)
    table.insert(self._items, {
      itemId = itemId,
      quantity = toAdd,
      maxStack = maxStack,
      metadata = metadata,
    })
    quantity = quantity - toAdd
  end

  self._data.inventory = self._items
  return true
end

function Inventory:remove(itemId, quantity)
  quantity = quantity or 1
  local removed = 0
  for i = #self._items, 1, -1 do
    if removed >= quantity then break end
    local slot = self._items[i]
    if slot.itemId == itemId then
      local toRemove = math.min(slot.quantity, quantity - removed)
      slot.quantity = slot.quantity - toRemove
      removed = removed + toRemove
      if slot.quantity <= 0 then
        table.remove(self._items, i)
      end
    end
  end
  self._data.inventory = self._items
  return removed >= quantity
end

function Inventory:has(itemId, quantity)
  quantity = quantity or 1
  local total = 0
  for _, slot in ipairs(self._items) do
    if slot.itemId == itemId then total = total + slot.quantity end
  end
  return total >= quantity
end

return Inventory

--- QUEST SYSTEM ---
local QuestService = {}
QuestService.__index = QuestService

local QUESTS = {
  quest_collect_coins = {
    name = "Coin Collector",
    description = "Collect 100 coins",
    type = "collect",
    target = "coins",
    goal = 100,
    reward = { coins = 50, xp = 200 },
    nextQuest = "quest_collect_coins_2",
  },
  quest_defeat_goblins = {
    name = "Goblin Slayer",
    description = "Defeat 10 goblins",
    type = "kill",
    target = "Goblin",
    goal = 10,
    reward = { coins = 100, xp = 500 },
    nextQuest = nil,
  },
}

function QuestService.new(playerData)
  local self = setmetatable({}, QuestService)
  self._data = playerData
  if not playerData.quests then
    playerData.quests = { active = {}, completed = {} }
  end
  return self
end

function QuestService:accept(questId)
  local def = QUESTS[questId]
  if not def then return false, "Unknown quest" end
  if self._data.quests.active[questId] then return false, "Already active" end
  if self._data.quests.completed[questId] then return false, "Already completed" end
  self._data.quests.active[questId] = { progress = 0, startTime = os.time() }
  return true
end

function QuestService:trackProgress(questType, target, amount)
  for questId, progress in pairs(self._data.quests.active) do
    local def = QUESTS[questId]
    if def and def.type == questType and def.target == target then
      progress.progress = (progress.progress or 0) + (amount or 1)
      if progress.progress >= def.goal then
        self:complete(questId)
      end
    end
  end
end

function QuestService:complete(questId)
  local def = QUESTS[questId]
  if not def then return end
  self._data.quests.active[questId] = nil
  self._data.quests.completed[questId] = { completedAt = os.time() }
  -- apply rewards
  self._data.coins = (self._data.coins or 0) + (def.reward.coins or 0)
  self._data.xp    = (self._data.xp or 0) + (def.reward.xp or 0)
  -- chain quest
  if def.nextQuest then
    self:accept(def.nextQuest)
  end
  return def.reward
end

return QuestService

--- COMBAT SYSTEM WITH ABILITIES ---
local CombatService = {}

local ABILITIES = {
  Fireball = {
    cooldown = 5,
    damage = 80,
    aoeRadius = 8,
    statusEffect = "Burning",
    statusDuration = 4,
  },
  Heal = {
    cooldown = 10,
    healAmount = 60,
  },
  Slash = {
    cooldown = 1,
    damage = 30,
    range = 6,
  },
}

local STATUS_EFFECTS = {
  Burning  = { damagePerTick = 5, tickInterval = 1 },
  Frozen   = { slowFactor = 0.3, duration = 3 },
  Poisoned = { damagePerTick = 3, tickInterval = 0.5 },
}

local cooldowns = {}   -- [player][ability] = timestamp
local statuses = {}    -- [character] = { effectName = { expiry, ... } }

local function getCooldownRemaining(player, abilityName)
  if not cooldowns[player] then return 0 end
  local last = cooldowns[player][abilityName]
  if not last then return 0 end
  local def = ABILITIES[abilityName]
  return math.max(0, def.cooldown - (os.clock() - last))
end

local function applyStatus(character, effectName, duration)
  if not statuses[character] then statuses[character] = {} end
  statuses[character][effectName] = {
    expiry = os.clock() + duration,
    tickNext = os.clock(),
  }
end

local function calcDamage(attacker, baseDamage)
  local bonusPct = attacker:GetAttribute("DamageBonus") or 0
  return math.floor(baseDamage * (1 + bonusPct / 100))
end

function CombatService.useAbility(player, abilityName, targets)
  local def = ABILITIES[abilityName]
  if not def then return false, "Unknown ability" end

  local remaining = getCooldownRemaining(player, abilityName)
  if remaining > 0 then
    return false, "On cooldown: " .. string.format("%.1f", remaining) .. "s"
  end

  -- set cooldown
  if not cooldowns[player] then cooldowns[player] = {} end
  cooldowns[player][abilityName] = os.clock()

  local character = player.Character
  if not character then return false, "No character" end

  if def.damage then
    for _, target in ipairs(targets) do
      local humanoid = target:FindFirstChildOfClass("Humanoid")
      if humanoid and humanoid.Health > 0 then
        local dmg = calcDamage(character, def.damage)
        humanoid:TakeDamage(dmg)
        if def.statusEffect and def.statusDuration then
          applyStatus(target, def.statusEffect, def.statusDuration)
        end
      end
    end
  end

  if def.healAmount then
    local humanoid = character:FindFirstChildOfClass("Humanoid")
    if humanoid then
      humanoid.Health = math.min(humanoid.MaxHealth, humanoid.Health + def.healAmount)
    end
  end

  return true
end

-- tick status effects (call from Heartbeat)
function CombatService.tickStatuses()
  local now = os.clock()
  for character, effects in pairs(statuses) do
    local humanoid = character:FindFirstChildOfClass("Humanoid")
    for effectName, state in pairs(effects) do
      if now >= state.expiry then
        effects[effectName] = nil
      else
        local def = STATUS_EFFECTS[effectName]
        if def and def.damagePerTick and now >= state.tickNext then
          if humanoid then humanoid:TakeDamage(def.damagePerTick) end
          state.tickNext = now + def.tickInterval
        end
      end
    end
    if not next(effects) then statuses[character] = nil end
  end
end

game:GetService("RunService").Heartbeat:Connect(CombatService.tickStatuses)

return CombatService

--- PET SYSTEM ---
local PetService = {}

local PET_DEFS = {
  FireFox = {
    maxLevel = 10,
    xpPerLevel = { 100, 250, 500, 900, 1400, 2000, 2700, 3500, 4400, 0 },
    evolveAt = 5,
    evolvesInto = "BlazeFox",
    abilities = { "FireAura", "SpeedBoost" },
    followOffset = Vector3.new(3, 0, 0),
  },
  BlazeFox = {
    maxLevel = 10,
    xpPerLevel = { 300, 700, 1200, 1800, 2500, 3300, 4200, 5200, 6300, 0 },
    evolveAt = nil,
    abilities = { "FireAura", "SpeedBoost", "FireBlast" },
    followOffset = Vector3.new(3, 0, 0),
  },
}

local equippedPets = {}   -- [userId] = { petId, model }

function PetService.equip(player, petId)
  PetService.unequip(player)
  local def = PET_DEFS[petId]
  if not def then return false end

  local model = Instance.new("Model")
  model.Name = petId .. "_pet"
  model.Parent = workspace

  equippedPets[player.UserId] = { petId = petId, model = model }

  -- follow loop
  task.spawn(function()
    while equippedPets[player.UserId] and player.Character do
      local root = player.Character:FindFirstChild("HumanoidRootPart")
      local petRoot = model:FindFirstChild("PrimaryPart")
      if root and petRoot then
        local goal = root.CFrame * CFrame.new(def.followOffset)
        model:SetPrimaryPartCFrame(
          model.PrimaryPart.CFrame:Lerp(goal, 0.1)
        )
      end
      task.wait(0.03)
    end
  end)

  return true
end

function PetService.unequip(player)
  local slot = equippedPets[player.UserId]
  if slot then
    if slot.model and slot.model.Parent then
      slot.model:Destroy()
    end
    equippedPets[player.UserId] = nil
  end
end

function PetService.addXP(playerData, petId, amount)
  if not playerData.pets then playerData.pets = {} end
  if not playerData.pets[petId] then
    playerData.pets[petId] = { level = 1, xp = 0 }
  end
  local pet = playerData.pets[petId]
  local def = PET_DEFS[petId]
  if not def then return end

  pet.xp = pet.xp + amount
  local needed = def.xpPerLevel[pet.level]
  while needed and needed > 0 and pet.xp >= needed do
    pet.xp = pet.xp - needed
    pet.level = pet.level + 1
    needed = def.xpPerLevel[pet.level]
    -- check evolve
    if def.evolveAt and pet.level >= def.evolveAt and def.evolvesInto then
      playerData.pets[def.evolvesInto] = { level = 1, xp = 0 }
      playerData.pets[petId] = nil
      return def.evolvesInto  -- signal evolution
    end
  end
end

return PetService

--- TRADING SYSTEM (ATOMIC SERVER-SIDE SWAP) ---
-- Both players must confirm. Server validates both inventories, then swaps atomically.
local TradeService = {}

local activeTrades = {}  -- [tradeId] = trade object

local function generateTradeId()
  return tostring(os.clock()):gsub("%.", "") .. tostring(math.random(1000, 9999))
end

function TradeService.initiate(playerA, playerB)
  local tradeId = generateTradeId()
  activeTrades[tradeId] = {
    players = { [playerA.UserId] = playerA, [playerB.UserId] = playerB },
    offers  = { [playerA.UserId] = {}, [playerB.UserId] = {} },
    confirmed = { [playerA.UserId] = false, [playerB.UserId] = false },
    status = "pending",
  }
  return tradeId
end

function TradeService.setOffer(tradeId, player, items)
  local trade = activeTrades[tradeId]
  if not trade or trade.status ~= "pending" then return false end
  trade.offers[player.UserId] = items
  trade.confirmed[player.UserId] = false  -- reset on offer change
  return true
end

function TradeService.confirm(tradeId, player)
  local trade = activeTrades[tradeId]
  if not trade or trade.status ~= "pending" then return false end
  trade.confirmed[player.UserId] = true

  -- check if both confirmed
  local allConfirmed = true
  for userId in pairs(trade.confirmed) do
    if not trade.confirmed[userId] then allConfirmed = false end
  end

  if allConfirmed then
    return TradeService._execute(tradeId)
  end
  return true
end

function TradeService._execute(tradeId)
  local trade = activeTrades[tradeId]
  trade.status = "executing"

  local playerIds = {}
  for userId in pairs(trade.players) do table.insert(playerIds, userId) end
  local uidA, uidB = playerIds[1], playerIds[2]
  local playerA = trade.players[uidA]
  local playerB = trade.players[uidB]

  -- validate both players still in game
  if not playerA.Parent or not playerB.Parent then
    trade.status = "cancelled"
    activeTrades[tradeId] = nil
    return false, "Player left game"
  end

  -- validate inventories have items (simplified)
  -- In production: lock player data, check each item, then swap
  local offersA = trade.offers[uidA]
  local offersB = trade.offers[uidB]

  -- swap: remove from A, give to B; remove from B, give to A
  -- (calls into DataManager and Inventory modules)

  trade.status = "completed"
  activeTrades[tradeId] = nil
  return true
end

function TradeService.cancel(tradeId)
  local trade = activeTrades[tradeId]
  if trade then
    trade.status = "cancelled"
    activeTrades[tradeId] = nil
  end
end

return TradeService
`;

export const SCRIPT_DATA_STRUCTURES = `
=== DATA STRUCTURES IN LUAU ===

--- QUEUE ---
local Queue = {}
Queue.__index = Queue

function Queue.new()
  return setmetatable({ _data = {}, _head = 1, _tail = 0 }, Queue)
end

function Queue:push(v)
  self._tail = self._tail + 1
  self._data[self._tail] = v
end

function Queue:pop()
  if self._head > self._tail then return nil end
  local v = self._data[self._head]
  self._data[self._head] = nil
  self._head = self._head + 1
  return v
end

function Queue:peek()
  return self._data[self._head]
end

function Queue:isEmpty()
  return self._head > self._tail
end

function Queue:size()
  return self._tail - self._head + 1
end

--- PRIORITY QUEUE (min-heap) ---
local PriorityQueue = {}
PriorityQueue.__index = PriorityQueue

function PriorityQueue.new()
  return setmetatable({ _heap = {} }, PriorityQueue)
end

function PriorityQueue:push(item, priority)
  table.insert(self._heap, { item = item, priority = priority })
  self:_bubbleUp(#self._heap)
end

function PriorityQueue:pop()
  local heap = self._heap
  if #heap == 0 then return nil end
  local top = heap[1].item
  heap[1] = heap[#heap]
  heap[#heap] = nil
  self:_sinkDown(1)
  return top
end

function PriorityQueue:_bubbleUp(i)
  local heap = self._heap
  while i > 1 do
    local parent = math.floor(i / 2)
    if heap[parent].priority > heap[i].priority then
      heap[parent], heap[i] = heap[i], heap[parent]
      i = parent
    else break end
  end
end

function PriorityQueue:_sinkDown(i)
  local heap = self._heap
  local n = #heap
  while true do
    local smallest = i
    local left = 2 * i
    local right = 2 * i + 1
    if left <= n and heap[left].priority < heap[smallest].priority then
      smallest = left
    end
    if right <= n and heap[right].priority < heap[smallest].priority then
      smallest = right
    end
    if smallest == i then break end
    heap[i], heap[smallest] = heap[smallest], heap[i]
    i = smallest
  end
end

--- SET ---
local Set = {}
Set.__index = Set

function Set.new(items)
  local self = setmetatable({ _data = {} }, Set)
  if items then for _, v in ipairs(items) do self:add(v) end end
  return self
end

function Set:add(v) self._data[v] = true end
function Set:remove(v) self._data[v] = nil end
function Set:has(v) return self._data[v] == true end
function Set:size()
  local n = 0
  for _ in pairs(self._data) do n = n + 1 end
  return n
end
function Set:toArray()
  local arr = {}
  for v in pairs(self._data) do table.insert(arr, v) end
  return arr
end

--- SPATIAL GRID (for fast proximity checks) ---
local SpatialGrid = {}
SpatialGrid.__index = SpatialGrid

function SpatialGrid.new(cellSize)
  local self = setmetatable({}, SpatialGrid)
  self._cellSize = cellSize or 20
  self._cells = {}
  return self
end

function SpatialGrid:_key(x, z)
  local cx = math.floor(x / self._cellSize)
  local cz = math.floor(z / self._cellSize)
  return cx .. "," .. cz
end

function SpatialGrid:insert(id, position)
  local key = self:_key(position.X, position.Z)
  if not self._cells[key] then self._cells[key] = {} end
  self._cells[key][id] = position
end

function SpatialGrid:remove(id, position)
  local key = self:_key(position.X, position.Z)
  if self._cells[key] then self._cells[key][id] = nil end
end

function SpatialGrid:query(position, radius)
  local results = {}
  local cellRadius = math.ceil(radius / self._cellSize)
  local cx = math.floor(position.X / self._cellSize)
  local cz = math.floor(position.Z / self._cellSize)
  for dx = -cellRadius, cellRadius do
    for dz = -cellRadius, cellRadius do
      local key = (cx + dx) .. "," .. (cz + dz)
      local cell = self._cells[key]
      if cell then
        for id, pos in pairs(cell) do
          if (pos - position).Magnitude <= radius then
            table.insert(results, { id = id, position = pos })
          end
        end
      end
    end
  end
  return results
end
`;

export const SCRIPT_SERVICES = `
=== ROBLOX SERVICE DEEP PATTERNS ===

--- PLAYERS SERVICE ---
local Players = game:GetService("Players")

-- Character lifecycle: character can respawn. Always reconnect on each spawn.
Players.PlayerAdded:Connect(function(player)
  -- immediate data load
  local function onCharacterAdded(character)
    -- wait for humanoid safely
    local humanoid = character:WaitForChild("Humanoid", 10)
    if not humanoid then return end

    local humanoidRootPart = character:WaitForChild("HumanoidRootPart", 10)
    if not humanoidRootPart then return end

    -- set up character-specific connections
    local conn
    conn = humanoid.Died:Connect(function()
      conn:Disconnect()
      -- handle death
    end)
  end

  -- connect for current AND future spawns
  player.CharacterAdded:Connect(onCharacterAdded)
  if player.Character then
    onCharacterAdded(player.Character)
  end
end)

Players.PlayerRemoving:Connect(function(player)
  -- cleanup all connections associated with player
end)

-- Safe player data access
local function getPlayerData(player)
  -- never trust client UserId; always use server-side player object
  if not player or not player.Parent then return nil end
  return sessionData and sessionData[player.UserId]
end

--- RUNSERVICE PATTERNS ---
local RunService = game:GetService("RunService")

-- Heartbeat: fires AFTER physics step. Use on SERVER for game logic.
RunService.Heartbeat:Connect(function(dt)
  -- dt is delta time in seconds
  -- good for: NPC AI ticks, status effect ticks, leaderboard updates
end)

-- Stepped: fires BEFORE physics step. Use for forces/velocities.
RunService.Stepped:Connect(function(time, dt)
  -- good for: applying custom physics forces
end)

-- RenderStepped: CLIENT ONLY. Fires before frame render.
-- NEVER use on server (errors). Guard with IsClient check.
if RunService:IsClient() then
  RunService.RenderStepped:Connect(function(dt)
    -- good for: camera, visual effects, UI animations
    -- keep lightweight: heavy logic here kills FPS
  end)
end

-- IsServer / IsClient guards
local IS_SERVER = RunService:IsServer()
local IS_CLIENT = RunService:IsClient()

--- TWEENSERVICE PATTERNS ---
local TweenService = game:GetService("TweenService")

-- Basic tween
local function tweenPart(part, goalCFrame, duration)
  local info = TweenInfo.new(
    duration or 1,
    Enum.EasingStyle.Quad,
    Enum.EasingDirection.Out,
    0,       -- repeat count (0 = play once)
    false,   -- reverses
    0        -- delay
  )
  local tween = TweenService:Create(part, info, { CFrame = goalCFrame })
  tween:Play()
  return tween
end

-- Await tween completion
local function tweenAndWait(part, props, duration)
  local info = TweenInfo.new(duration or 1, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut)
  local tween = TweenService:Create(part, info, props)
  tween:Play()
  tween.Completed:Wait()
  tween:Destroy()
end

-- Cancel and clean up
local activeTweens = {}
local function startTween(id, part, props, duration)
  if activeTweens[id] then
    activeTweens[id]:Cancel()
    activeTweens[id]:Destroy()
  end
  local info = TweenInfo.new(duration, Enum.EasingStyle.Bounce, Enum.EasingDirection.Out)
  local t = TweenService:Create(part, info, props)
  activeTweens[id] = t
  t:Play()
  t.Completed:Connect(function()
    activeTweens[id] = nil
    t:Destroy()
  end)
end

--- PATHFINDINGSERVICE PATTERNS ---
local PathfindingService = game:GetService("PathfindingService")

local PATH_PARAMS = {
  AgentHeight = 5,
  AgentRadius = 2,
  AgentCanJump = true,
  AgentCanClimb = false,
  WaypointSpacing = 4,
  Costs = {
    Water = 20,    -- prefer to avoid water
    Mud   = 5,
  },
}

local function navigateTo(npcModel, targetPosition)
  local humanoid = npcModel:FindFirstChildOfClass("Humanoid")
  local rootPart  = npcModel:FindFirstChild("HumanoidRootPart")
  if not humanoid or not rootPart then return end

  local path = PathfindingService:CreatePath(PATH_PARAMS)
  local ok, err = pcall(function()
    path:ComputeAsync(rootPart.Position, targetPosition)
  end)
  if not ok or path.Status ~= Enum.PathStatus.Success then
    warn("Pathfind failed:", err, path.Status)
    return
  end

  local waypoints = path:GetWaypoints()
  local blocked = false

  -- handle path blocked mid-travel
  local blockedConn = path.Blocked:Connect(function(blockedWpIdx)
    blocked = true
  end)

  for i, wp in ipairs(waypoints) do
    if blocked then break end
    if wp.Action == Enum.PathWaypointAction.Jump then
      humanoid.Jump = true
    end
    humanoid:MoveTo(wp.Position)
    -- timeout so NPC doesn't get stuck forever
    local reached = humanoid.MoveToFinished:Wait()
    -- reached is false if timed out (default 8s)
    if not reached then break end
  end

  blockedConn:Disconnect()
end

--- COLLECTIONSERVICE PATTERNS ---
local CollectionService = game:GetService("CollectionService")

-- Tag instances in Studio or via script, then batch-process them
CollectionService:AddTag(somePart, "Interactable")
CollectionService:RemoveTag(somePart, "Interactable")

-- Get all tagged instances
local interactables = CollectionService:GetTagged("Interactable")
for _, obj in ipairs(interactables) do
  -- setup proximity prompt, etc.
end

-- React to new tagged instances (dynamic spawning)
CollectionService:GetInstanceAddedSignal("Interactable"):Connect(function(obj)
  setupInteractable(obj)
end)

CollectionService:GetInstanceRemovedSignal("Interactable"):Connect(function(obj)
  cleanupInteractable(obj)
end)

--- MARKETPLACESERVICE PATTERNS ---
local MarketplaceService = game:GetService("MarketplaceService")

-- PromptPurchase for game passes and developer products
local function promptPass(player, gamePassId)
  MarketplaceService:PromptGamePassPurchase(player, gamePassId)
end

local function promptProduct(player, productId)
  MarketplaceService:PromptProductPurchase(player, productId)
end

-- ProcessReceipt: MUST be idempotent. Server calls this on purchase.
-- Use a purchased receipts store to deduplicate.
local PurchasedStore = DataStoreService:GetDataStore("PurchasedReceipts")

MarketplaceService.ProcessReceipt = function(receiptInfo)
  local player = Players:GetPlayerByUserId(receiptInfo.PlayerId)
  if not player then
    return Enum.ProductPurchaseDecision.NotProcessedYet
  end

  -- idempotency check
  local receiptKey = "receipt_" .. receiptInfo.PurchaseId
  local alreadyProcessed = false
  pcall(function()
    alreadyProcessed = PurchasedStore:GetAsync(receiptKey) == true
  end)
  if alreadyProcessed then
    return Enum.ProductPurchaseDecision.PurchaseGranted
  end

  local ok = pcall(function()
    -- grant product (coins, items, etc.)
    if receiptInfo.ProductId == 123456 then
      DataManager:increment(player, "coins", 500)
    end
    -- mark as processed
    PurchasedStore:SetAsync(receiptKey, true)
  end)

  return ok
    and Enum.ProductPurchaseDecision.PurchaseGranted
    or  Enum.ProductPurchaseDecision.NotProcessedYet
end

--- TELEPORTSERVICE PATTERNS ---
local TeleportService = game:GetService("TeleportService")

-- Reserve a private server and teleport players to it
local function teleportParty(players, placeId)
  local reservedCode = TeleportService:ReserveServer(placeId)
  TeleportService:TeleportToPrivateServer(placeId, reservedCode, players)
end

-- Teleport with data (send small tables across place boundary)
local teleportData = { partyId = "abc123", difficulty = "hard" }
TeleportService:TeleportAsync(placeId, player, TeleportOptions.new())
-- On arrival: local data = TeleportService:GetLocalPlayerTeleportData()

--- TEXTSERVICE PATTERNS ---
local TextService = game:GetService("TextService")

-- ALWAYS filter user-generated text before displaying to other players
local function filterText(text, fromUserId)
  local ok, filtered = pcall(function()
    local result = TextService:FilterStringAsync(text, fromUserId)
    return result:GetNonChatStringForBroadcastAsync()
  end)
  if ok then return filtered end
  return "[message]"  -- fallback on error, never show raw
end

-- Usage in chat handler (server-side):
-- local safe = filterText(playerMessage, player.UserId)
-- broadcastToAll(safe)

--- PHYSICSSERVICE COLLISION GROUPS ---
local PhysicsService = game:GetService("PhysicsService")

-- Create groups
PhysicsService:RegisterCollisionGroup("Players")
PhysicsService:RegisterCollisionGroup("Enemies")
PhysicsService:RegisterCollisionGroup("Projectiles")
PhysicsService:RegisterCollisionGroup("Environment")

-- Set collision rules (false = no collision between groups)
PhysicsService:CollisionGroupSetCollidable("Players", "Players", false)   -- players pass through each other
PhysicsService:CollisionGroupSetCollidable("Projectiles", "Projectiles", false)
PhysicsService:CollisionGroupSetCollidable("Players", "Projectiles", true)
PhysicsService:CollisionGroupSetCollidable("Enemies", "Projectiles", true)

-- Assign parts to groups
local function assignGroup(model, groupName)
  for _, part in ipairs(model:GetDescendants()) do
    if part:IsA("BasePart") then
      part.CollisionGroup = groupName
    end
  end
end
`;

export const SCRIPT_NETWORKING = `
=== ROBLOX NETWORKING PATTERNS ===

--- REMOTE EVENT / FUNCTION SETUP ---
-- Structure: all remotes in a shared folder loaded at game start.
-- Server creates, client waits. Never create remotes on client.

-- shared/Remotes.lua (ModuleScript in ReplicatedStorage)
local Remotes = {}

local function getOrCreate(parent, class, name)
  local existing = parent:FindFirstChild(name)
  if existing then return existing end
  local r = Instance.new(class)
  r.Name = name
  r.Parent = parent
  return r
end

if game:GetService("RunService"):IsServer() then
  local folder = Instance.new("Folder")
  folder.Name = "Remotes"
  folder.Parent = game.ReplicatedStorage

  Remotes.UseAbility      = getOrCreate(folder, "RemoteEvent",    "UseAbility")
  Remotes.RequestData     = getOrCreate(folder, "RemoteFunction", "RequestData")
  Remotes.UINotification  = getOrCreate(folder, "RemoteEvent",    "UINotification")
  Remotes.TradeRequest    = getOrCreate(folder, "RemoteEvent",    "TradeRequest")
else
  local folder = game.ReplicatedStorage:WaitForChild("Remotes", 15)
  Remotes.UseAbility      = folder:WaitForChild("UseAbility")
  Remotes.RequestData     = folder:WaitForChild("RequestData")
  Remotes.UINotification  = folder:WaitForChild("UINotification")
  Remotes.TradeRequest    = folder:WaitForChild("TradeRequest")
end

return Remotes

--- SERVER-SIDE VALIDATION (CRITICAL SECURITY) ---
-- NEVER trust data from client. Validate everything.
local Remotes = require(game.ReplicatedStorage.Remotes)

Remotes.UseAbility.OnServerEvent:Connect(function(player, abilityName, targetId)
  -- 1. Type check
  if type(abilityName) ~= "string" then return end
  if type(targetId) ~= "number" and targetId ~= nil then return end

  -- 2. Whitelist check
  local VALID_ABILITIES = { Fireball = true, Heal = true, Slash = true }
  if not VALID_ABILITIES[abilityName] then return end

  -- 3. Existence check
  local character = player.Character
  if not character then return end

  -- 4. Range check (prevent teleport exploit)
  local targetPart = targetId and workspace:FindFirstChild(tostring(targetId))
  if targetPart then
    local root = character:FindFirstChild("HumanoidRootPart")
    if root and (root.Position - targetPart.Position).Magnitude > 100 then
      return  -- too far, likely exploiting
    end
  end

  -- 5. Cooldown check (server-side, not client)
  -- ... now safe to process
  CombatService.useAbility(player, abilityName, { targetPart })
end)

-- Rate limiting (prevent spam)
local requestCounts = {}
local RATE_LIMIT = 20   -- max requests per window
local RATE_WINDOW = 1   -- seconds

local function checkRateLimit(player)
  local userId = player.UserId
  local now = os.clock()
  if not requestCounts[userId] then
    requestCounts[userId] = { count = 0, windowStart = now }
  end
  local data = requestCounts[userId]
  if now - data.windowStart > RATE_WINDOW then
    data.count = 0
    data.windowStart = now
  end
  data.count = data.count + 1
  return data.count <= RATE_LIMIT
end

--- CLIENT-SIDE REMOTE USAGE ---
-- local Remotes = require(game.ReplicatedStorage.Remotes)

-- Fire event to server (no return value)
-- Remotes.UseAbility:FireServer("Fireball", target.Parent.Name)

-- Call function and get response (yields until server responds)
-- local data = Remotes.RequestData:InvokeServer("PlayerStats")

-- Listen for server -> client notification
-- Remotes.UINotification.OnClientEvent:Connect(function(message, notifType)
--   showNotification(message, notifType)
-- end)

--- BINDABLE EVENTS FOR MODULE COMMUNICATION ---
-- Used for same-VM (server-to-server or client-to-client) events.
-- Prefer Signal module over raw BindableEvent for cleaner API.

-- Cross-module event bus (server-side example)
local EventBus = {}
local _events = {}

function EventBus.get(name)
  if not _events[name] then
    _events[name] = Instance.new("BindableEvent")
  end
  return _events[name]
end

function EventBus.fire(name, ...)
  EventBus.get(name):Fire(...)
end

function EventBus.on(name, fn)
  return EventBus.get(name).Event:Connect(fn)
end

-- Usage:
-- EventBus.on("EnemyKilled", function(enemyType, killerPlayer)
--   QuestService:trackProgress("kill", enemyType, 1)
-- end)
-- EventBus.fire("EnemyKilled", "Goblin", player)

--- DATASTORE REQUEST BUDGET ---
-- DataStoreService has per-minute budget. Exceeding it causes throttle errors.
-- Budget: 60 + numPlayers * 10 writes/min, same for reads.
-- Use a request queue to stay within budget.

local requestQueue = Queue.new()
local BUDGET_CHECK_INTERVAL = 6  -- check every 6 seconds

task.spawn(function()
  while true do
    task.wait(BUDGET_CHECK_INTERVAL)
    local budget = DataStoreService:GetRequestBudgetForRequestType(
      Enum.DataStoreRequestType.UpdateAsync
    )
    local processed = 0
    while not requestQueue:isEmpty() and processed < math.floor(budget * 0.8) do
      local req = requestQueue:pop()
      task.spawn(req)
      processed = processed + 1
    end
  end
end)

local function queueDataStoreRequest(fn)
  requestQueue:push(fn)
end
`;

export const SCRIPT_COMMON_BUGS = `
=== COMMON BUGS AND FIXES ===

--- BUG: NIL INDEX ON PLAYER DATA ---
-- Problem: accessing data before PlayerAdded fires or after player leaves.
-- Fix: always guard with FindFirstChild or check sessionData existence.

-- BAD:
-- local data = sessionData[player.UserId]  -- can be nil if player just left
-- data.coins = data.coins + 1              -- ERROR: attempt to index nil

-- GOOD:
local function safeGetData(player)
  if not player or not Players:FindFirstChild(player.Name) then
    return nil
  end
  return sessionData[player.UserId]
end

local function safeModify(player, fn)
  local data = safeGetData(player)
  if data then fn(data) end
end

-- safeModify(player, function(d) d.coins = d.coins + 1 end)

--- BUG: MEMORY LEAKS ---
-- Problem: connections never disconnected, parts never destroyed.
-- Result: memory grows until server crashes or lags.

-- BAD:
-- Players.PlayerAdded:Connect(function(player)
--   RunService.Heartbeat:Connect(function()  -- new connection each PlayerAdded!
--     updatePlayerUI(player)
--   end)
-- end)

-- GOOD: track connections per player, disconnect on remove.
local playerConnections = {}

Players.PlayerAdded:Connect(function(player)
  local conns = {}
  table.insert(conns, RunService.Heartbeat:Connect(function()
    -- check player still valid
    if not player.Parent then return end
    -- updatePlayerUI(player)
  end))
  playerConnections[player.UserId] = conns
end)

Players.PlayerRemoving:Connect(function(player)
  local conns = playerConnections[player.UserId]
  if conns then
    for _, c in ipairs(conns) do c:Disconnect() end
    playerConnections[player.UserId] = nil
  end
end)

-- Always destroy created instances when done
local function spawnEffect(position)
  local effect = Instance.new("Part")
  effect.Parent = workspace
  task.delay(3, function()
    if effect and effect.Parent then
      effect:Destroy()
    end
  end)
end

--- BUG: RACE CONDITIONS ---
-- Problem: data not loaded when accessed.
-- Example: character spawns before PlayerAdded handler runs.
-- Fix: use event + loaded flag, or Promise pattern.

-- BAD:
-- Players.PlayerAdded:Connect(function(player)
--   task.wait(1)  -- arbitrary wait, NEVER do this
--   local data = sessionData[player.UserId]  -- may still be nil
-- end)

-- GOOD: fire signal when data is ready
local dataReadySignal = {}
local dataLoaded = {}

Players.PlayerAdded:Connect(function(player)
  local data = loadData(player.UserId)
  sessionData[player.UserId] = { data = data, dirty = false }
  dataLoaded[player.UserId] = true
  if dataReadySignal[player.UserId] then
    dataReadySignal[player.UserId]:Fire(data)
  end
end)

local function waitForData(player)
  if dataLoaded[player.UserId] then
    return sessionData[player.UserId].data
  end
  if not dataReadySignal[player.UserId] then
    dataReadySignal[player.UserId] = Instance.new("BindableEvent")
  end
  return dataReadySignal[player.UserId].Event:Wait()
end

-- Usage: local data = waitForData(player)

--- BUG: DATASTORE THROTTLING ---
-- Problem: too many requests causes 503/budget exhaustion.
-- Fix: batch saves, use UpdateAsync not SetAsync, respect budget.

-- Rules:
-- 1. Never SetAsync in a loop over all players
-- 2. Use UpdateAsync for all writes (atomic, returns current value)
-- 3. Cache writes and flush on auto-save interval
-- 4. Check GetRequestBudgetForRequestType before bursts
-- 5. Exponential backoff on failure (see DataManager above)

-- Budget formula: 60 + numPlayers * 10 per minute per request type
local function getBudget()
  return DataStoreService:GetRequestBudgetForRequestType(
    Enum.DataStoreRequestType.UpdateAsync
  )
end

--- BUG: REMOTE SECURITY HOLES ---
-- Problem: client sends manipulated data, server trusts it.
-- Attack vectors: negative prices, out-of-range values, forged userIds.

-- ALWAYS on server:
-- 1. Type-check all arguments
-- 2. Whitelist valid values (don't blacklist — too easy to miss)
-- 3. Clamp numeric inputs to valid ranges
-- 4. Verify ownership (player owns the item they're selling)
-- 5. Re-verify game state (player has enough coins to buy)
-- 6. Never pass UserId from client — use player object from OnServerEvent

local function validatePurchase(player, shopItemId, quantity)
  -- type checks
  if type(shopItemId) ~= "string" then return false, "bad itemId type" end
  if type(quantity) ~= "number" then return false, "bad quantity type" end

  -- range check
  quantity = math.floor(quantity)
  if quantity < 1 or quantity > 100 then return false, "invalid quantity" end

  -- whitelist
  local SHOP_ITEMS = { sword = 100, shield = 150, potion = 25 }
  if not SHOP_ITEMS[shopItemId] then return false, "unknown item" end

  -- funds check
  local coins = DataManager:get(player, "coins") or 0
  local cost = SHOP_ITEMS[shopItemId] * quantity
  if coins < cost then return false, "insufficient coins" end

  return true, cost
end

--- BUG: INFINITE YIELD / WAITFORCHILD TIMEOUT ---
-- Problem: WaitForChild with no timeout hangs forever if instance never appears.
-- Fix: always provide timeout, handle nil return.

-- BAD:
-- local part = workspace:WaitForChild("ImportantPart")  -- hangs forever if missing

-- GOOD:
local function waitFor(parent, name, timeout)
  local child = parent:WaitForChild(name, timeout or 10)
  if not child then
    warn("WaitForChild timed out: " .. name .. " in " .. parent:GetFullName())
    return nil
  end
  return child
end

-- Also: if you know something SHOULD be there immediately (server created it), use FindFirstChild
local existing = workspace:FindFirstChild("StaticPart")
if not existing then
  warn("StaticPart missing from workspace!")
  return
end

--- BUG: PHYSICS JITTER ---
-- Problem: parts that should be stationary vibrate or drift.
-- Causes: unanchored parts with no velocity, Touched events re-anchoring.

-- Fix 1: Anchor all static parts
local function anchorStaticParts(model)
  for _, part in ipairs(model:GetDescendants()) do
    if part:IsA("BasePart") and not part:IsA("UnionOperation") then
      -- skip parts in hitbox that need physics
      if part:GetAttribute("Static") ~= false then
        part.Anchored = true
      end
    end
  end
end

-- Fix 2: Use BodyPosition/BodyGyro for parts that must move but stay stable
-- Fix 3: Set CustomPhysicalProperties density low for floating objects
-- Fix 4: Never set Velocity directly every frame on networked parts (use constraints)

-- Fix 5: For server-owned parts that clients see, ensure NetworkOwnership
local function claimNetworkOwnership(part)
  -- server owns it (prevents client prediction jitter)
  if game:GetService("RunService"):IsServer() then
    part:SetNetworkOwner(nil)  -- nil = server owns
  end
end

--- BUG: CHARACTER NOT RESPECTING SPAWN POSITION ---
-- Problem: SpawnLocation not working, player spawns at origin.
-- Fix: Use RespawnLocation property on player OR set SpawnLocation.

-- Method 1: force spawn location
local function setSpawnPoint(player, cframe)
  -- works only before character spawns
  local spawn = workspace:FindFirstChildOfClass("SpawnLocation")
  if spawn then
    spawn.CFrame = cframe
  end
end

-- Method 2: teleport on CharacterAdded
Players.PlayerAdded:Connect(function(player)
  player.CharacterAdded:Connect(function(character)
    local root = character:WaitForChild("HumanoidRootPart", 5)
    if root then
      task.wait()  -- one frame for physics to settle
      root.CFrame = CFrame.new(0, 10, 0)
    end
  end)
end)

--- BUG: LEADERSTAT DESYNC ---
-- Problem: IntValue/NumberValue not updating for all clients.
-- Fix: Only write to leaderstats from server. Use Value property not attributes for leaderstats.

Players.PlayerAdded:Connect(function(player)
  local leaderstats = Instance.new("Folder")
  leaderstats.Name = "leaderstats"
  leaderstats.Parent = player

  local coins = Instance.new("IntValue")
  coins.Name = "Coins"
  coins.Value = 0
  coins.Parent = leaderstats

  -- Update from server when data changes
  -- coins.Value = DataManager:get(player, "coins")
end)

--- BUG: MODULE SCRIPT SHARED STATE CORRUPTION ---
-- Problem: ModuleScript state shared between all requirers in same VM.
-- If two systems modify the same table, race conditions occur.
-- Fix: return constructors, not shared state; or protect with flags.

-- BAD: top-level mutable state
-- local sharedTable = {}
-- function module.add(item) table.insert(sharedTable, item) end
-- Both server scripts calling this share the SAME sharedTable!

-- GOOD: constructor pattern (each caller gets own instance)
-- function module.new() return { _items = {} } end
-- function module:add(item) table.insert(self._items, item) end
`;

export const SCRIPTING_PATTERNS_EXPANDED = `
${SCRIPT_DESIGN_PATTERNS}

${SCRIPT_SYSTEMS}

${SCRIPT_DATA_STRUCTURES}

${SCRIPT_SERVICES}

${SCRIPT_NETWORKING}

${SCRIPT_COMMON_BUGS}
`;

export default SCRIPTING_PATTERNS_EXPANDED;
