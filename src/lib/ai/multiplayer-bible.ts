// ============================================================
// MULTIPLAYER BIBLE — ForjeGames AI Knowledge Engine
// Teaches AI to build production-grade multiplayer systems
// ALL Roblox APIs verified against create.roblox.com/docs
// NEVER SmoothPlastic. All dimensions in studs. RGB triplets.
// ============================================================

// ============================================================
// NETWORKING — RemoteEvent / RemoteFunction patterns
// ============================================================
export const MP_NETWORKING: string = `
=== ROBLOX MULTIPLAYER NETWORKING BIBLE ===

--- CORE ARCHITECTURE RULE ---
CLIENT sends input/intent. SERVER validates, processes, broadcasts result.
NEVER let the client compute authoritative state (health, currency, positions).

--- REMOTEEVENT vs REMOTEFUNCTION ---

RemoteEvent (fire and forget, no return value):
  Use for: player actions, notifications, UI updates, effects
  Client→Server: RemoteEvent:FireServer(data)     -- client fires, server listens
  Server→Client: RemoteEvent:FireClient(player, data) -- server fires one player
  Server→AllClients: RemoteEvent:FireAllClients(data) -- broadcast to everyone
  Server→SomeClients: for _, p in pairs(targetList) do RemoteEvent:FireClient(p, data) end

RemoteFunction (request/response, blocks until return):
  Use for: data queries, validation checks, purchases that need a result
  Client→Server: local result = RemoteFunction:InvokeServer(data)
  Server→Client: local result = RemoteFunction:InvokeClient(player, data)
  WARNING: Never InvokeClient from server in production — if client disconnects, server thread hangs forever
  SAFE PATTERN: wrap InvokeServer in pcall on client, add timeout guard on server

--- WHAT REPLICATES AUTOMATICALLY ---
Instance properties changed on SERVER replicate to ALL clients:
  - Part.Position, Part.CFrame, Part.Size, Part.Color, Part.Transparency
  - Part.Anchored, Part.CanCollide, Part.Massless
  - Model hierarchy changes (parenting, adding/removing children)
  - Humanoid.Health, Humanoid.MaxHealth, Humanoid.WalkSpeed, Humanoid.JumpPower
  - Values (IntValue, StringValue, BoolValue, NumberValue) set on server replicate
  - Attributes set via Instance:SetAttribute() on server replicate

DOES NOT replicate:
  - LocalScript execution (runs only on owning client)
  - Changes made inside LocalScript to non-owned instances
  - Tool:Activate() / Tool:Deactivate() locally (fire remote to sync)
  - Client-side tweens (TweenService on client doesn't sync)
  - LocalPlayer.Character modifications in LocalScript that affect physics of non-owned parts

--- REMOTE PLACEMENT RULES ---
Always place Remotes in ReplicatedStorage so both server and client can access:
  ReplicatedStorage/
    Remotes/
      PlayerActions/
        RequestJump        -- RemoteEvent
        RequestAttack      -- RemoteEvent
        RequestInteract    -- RemoteFunction (returns interaction result)
      Currency/
        RequestPurchase    -- RemoteFunction (returns {success, newBalance})
        NotifyBalanceUpdate -- RemoteEvent (server→client)
      Party/
        InvitePlayer       -- RemoteEvent
        AcceptInvite       -- RemoteEvent
        LeaveParty         -- RemoteEvent
        SyncPartyData      -- RemoteEvent (server→client broadcast)
      Social/
        SendChatMessage    -- RemoteEvent
        UpdatePresence     -- RemoteEvent

--- SERVER-SIDE REMOTE HANDLER PATTERN ---
-- In Script (ServerScriptService), never LocalScript:
local RequestAttack = game:GetService("ReplicatedStorage"):WaitForChild("Remotes"):WaitForChild("RequestAttack")
local lastFireTime: {[Player]: number} = {}
local COOLDOWN = 0.5  -- seconds between allowed fires

RequestAttack.OnServerEvent:Connect(function(player: Player, targetId: number, weaponId: string)
  -- 1. Rate limit
  local now = tick()
  if lastFireTime[player] and (now - lastFireTime[player]) < COOLDOWN then
    return  -- silently drop, never error-message exploiters
  end
  lastFireTime[player] = now

  -- 2. Validate player state
  local char = player.Character
  if not char then return end
  local humanoid = char:FindFirstChildOfClass("Humanoid")
  if not humanoid or humanoid.Health <= 0 then return end

  -- 3. Validate target exists and is in range
  local target = game.Players:GetPlayerByUserId(targetId)
  if not target then return end
  local targetChar = target.Character
  if not targetChar then return end
  local targetRoot = targetChar:FindFirstChild("HumanoidRootPart")
  local myRoot = char:FindFirstChild("HumanoidRootPart")
  if not targetRoot or not myRoot then return end
  local distance = (targetRoot.Position - myRoot.Position).Magnitude
  if distance > 15 then return end  -- max melee range 15 studs

  -- 4. Validate weapon ownership
  local validWeapons = {"Sword", "Axe", "Spear"}
  local weaponValid = false
  for _, w in ipairs(validWeapons) do
    if w == weaponId then weaponValid = true break end
  end
  if not weaponValid then return end

  -- 5. Server calculates damage (never trust client damage values)
  local baseDamage = 10
  local weaponMultipliers = {Sword = 1.0, Axe = 1.3, Spear = 0.9}
  local damage = baseDamage * (weaponMultipliers[weaponId] or 1.0)

  -- 6. Apply damage
  local targetHumanoid = targetChar:FindFirstChildOfClass("Humanoid")
  if targetHumanoid and targetHumanoid.Health > 0 then
    targetHumanoid:TakeDamage(damage)
  end
end)

--- EFFICIENT BROADCAST PATTERN (delta updates) ---
-- Don't broadcast full state every frame — only changes
local previousState: {[Player]: {health: number, position: Vector3}} = {}

local function broadcastDeltas()
  for _, player in ipairs(game.Players:GetPlayers()) do
    local char = player.Character
    if not char then continue end
    local humanoid = char:FindFirstChildOfClass("Humanoid")
    local root = char:FindFirstChild("HumanoidRootPart")
    if not humanoid or not root then continue end

    local currentHealth = humanoid.Health
    local currentPos = root.Position
    local prev = previousState[player]

    if not prev or math.abs(prev.health - currentHealth) > 0.5 or (currentPos - prev.position).Magnitude > 0.1 then
      -- Only fire if something meaningfully changed
      local StateSync = game:GetService("ReplicatedStorage"):WaitForChild("Remotes"):WaitForChild("StateSync")
      StateSync:FireAllClients(player.UserId, currentHealth, currentPos)
      previousState[player] = {health = currentHealth, position = currentPos}
    end
  end
end

game:GetService("RunService").Heartbeat:Connect(function()
  broadcastDeltas()
end)

--- BINDABLE EVENTS vs REMOTES ---
BindableEvent: server-to-server or client-to-client communication (same VM)
  Use for: module communication within server scripts, cross-module events
  local BindableEvent = Instance.new("BindableEvent")
  BindableEvent.Event:Connect(function(data) end)
  BindableEvent:Fire(data)

BindableFunction: same-VM request/response
  local BindableFunction = Instance.new("BindableFunction")
  BindableFunction.OnInvoke = function(data) return result end
  local result = BindableFunction:Invoke(data)

--- NETWORK OWNERSHIP DEEP DIVE ---
Default: server owns all unanchored parts
SetNetworkOwner(player): gives that player's client physics authority
SetNetworkOwner(nil): returns ownership to server

When to use SetNetworkOwner:
  -- Player-controlled vehicle: give to driver
  local vehicle = workspace.Car
  vehicle.PrimaryPart:SetNetworkOwner(driver)

  -- NPC: keep server-owned (nil)
  npc.HumanoidRootPart:SetNetworkOwner(nil)

  -- Projectile: give to firing player for smooth movement, validate server-side on hit
  local bullet = Instance.new("Part")
  bullet.Parent = workspace
  bullet:SetNetworkOwner(firingPlayer)

GetNetworkOwner(): returns player or nil
GetNetworkOwnershipAuto(): returns true if automatic ownership is enabled

--- ATTRIBUTE REPLICATION FOR GAME STATE ---
-- Attributes replicate server→client automatically
local gameState = workspace:SetAttribute("RoundPhase", "Lobby")     -- string
workspace:SetAttribute("TimeRemaining", 120)                          -- number
workspace:SetAttribute("RoundActive", false)                          -- bool

-- Client reads:
workspace:GetAttributeChangedSignal("RoundPhase"):Connect(function()
  local phase = workspace:GetAttribute("RoundPhase")
  -- update UI
end)

-- Server updates trigger client signal automatically
workspace:SetAttribute("RoundPhase", "Playing")  -- clients see this

--- COMPRESSION / BANDWIDTH TIPS ---
Send UserId (number) not player Username (string) — saves bytes
Round position to 2 decimal places before sending: math.floor(pos.X * 100) / 100
Batch multiple small updates into one FireAllClients call per frame
Use tick() deltas for timers, not absolute timestamps (avoids clock sync issues)
For frequently-updated data (player health), use NumberValue in character that replicates automatically instead of RemoteEvents
`;

// ============================================================
// ANTI-CHEAT — Server-side validation patterns
// ============================================================
export const MP_ANTI_CHEAT: string = `
=== ROBLOX ANTI-CHEAT BIBLE ===

FUNDAMENTAL RULE: The client is hostile. Treat every RemoteEvent as potentially fired by an exploiter with arbitrary arguments.

--- SPEED HACK DETECTION ---
-- Server validates position delta every second
-- If player moves faster than max possible speed → teleport back

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

local MAX_STUDS_PER_SECOND = 50  -- slightly above max walk+sprint speed
local lastPositions: {[Player]: {pos: Vector3, time: number}} = {}
local violations: {[Player]: number} = {}
local VIOLATION_THRESHOLD = 3  -- kicks after 3 violations

Players.PlayerAdded:Connect(function(player)
  violations[player] = 0
  player.CharacterAdded:Connect(function(char)
    local root = char:WaitForChild("HumanoidRootPart", 5)
    if not root then return end
    lastPositions[player] = {pos = root.Position, time = tick()}
  end)
end)

Players.PlayerRemoving:Connect(function(player)
  lastPositions[player] = nil
  violations[player] = nil
end)

-- Run check every second
local checkTimer = 0
RunService.Heartbeat:Connect(function(dt)
  checkTimer += dt
  if checkTimer < 1 then return end
  checkTimer = 0

  for _, player in ipairs(Players:GetPlayers()) do
    local char = player.Character
    if not char then continue end
    local root = char:FindFirstChild("HumanoidRootPart")
    if not root then continue end

    local now = tick()
    local last = lastPositions[player]
    if not last then
      lastPositions[player] = {pos = root.Position, time = now}
      continue
    end

    local elapsed = now - last.time
    if elapsed <= 0 then continue end
    local distance = (root.Position - last.pos).Magnitude
    local speed = distance / elapsed

    -- Allow brief spikes (teleport to spawn, etc.) via grace check
    local humanoid = char:FindFirstChildOfClass("Humanoid")
    local currentWalkSpeed = humanoid and humanoid.WalkSpeed or 16
    local expectedMax = currentWalkSpeed * 2.5  -- 2.5x buffer for lag

    if speed > MAX_STUDS_PER_SECOND and speed > expectedMax then
      violations[player] = (violations[player] or 0) + 1
      warn(string.format("[AntiCheat] SpeedHack: %s moved %.1f studs/sec (max %.1f). Violations: %d",
        player.Name, speed, expectedMax, violations[player]))

      -- Teleport back to last valid position
      local cf = CFrame.new(last.pos)
      root.CFrame = cf

      if violations[player] >= VIOLATION_THRESHOLD then
        player:Kick("Exploiting detected. Appeal at our Discord.")
      end
    else
      -- Valid position, update
      lastPositions[player] = {pos = root.Position, time = now}
    end
  end
end)

--- TELEPORT DETECTION ---
-- Sudden position jump without a server-authorized teleport
local authorizedTeleports: {[Player]: boolean} = {}

local function serverTeleportPlayer(player: Player, destination: CFrame)
  authorizedTeleports[player] = true
  local char = player.Character
  if not char then return end
  local root = char:FindFirstChild("HumanoidRootPart")
  if root then
    root.CFrame = destination
  end
  -- Reset last known position
  lastPositions[player] = {pos = destination.Position, time = tick()}
  task.delay(0.1, function()
    authorizedTeleports[player] = false
  end)
end

-- In the speed check above, before kicking for speed:
-- if authorizedTeleports[player] then skip check this frame end

--- NOCLIP DETECTION ---
-- Noclip exploits turn CanCollide off on character parts client-side
-- Server periodically checks character CanCollide states

RunService.Heartbeat:Connect(function()
  for _, player in ipairs(Players:GetPlayers()) do
    local char = player.Character
    if not char then continue end
    for _, part in ipairs(char:GetDescendants()) do
      if part:IsA("BasePart") and not part.CanCollide then
        -- Legitimate: HumanoidRootPart is always non-collidable
        -- Legitimate: accessory handles
        local isLegitimate = (part.Name == "HumanoidRootPart")
          or part:FindFirstAncestorOfClass("Accessory") ~= nil
          or part.Transparency >= 0.9  -- invisible parts intentionally non-collide
        if not isLegitimate then
          part.CanCollide = true  -- force it back on server
        end
      end
    end
  end
end)

--- CURRENCY EXPLOIT PREVENTION ---
-- RULE: Server is the ONLY source of truth for currency
-- Client NEVER sends "give me X coins" — it sends "I did action Y" and server decides reward

-- WRONG pattern (never do this):
-- RemoteEvent.OnServerEvent:Connect(function(player, amount)
--   addCoins(player, amount)  -- exploiter can send any amount!
-- end)

-- CORRECT pattern: server decides reward based on verified action
local function onEnemyKilledByPlayer(player: Player, enemyType: string)
  -- Verify kill happened (e.g., check enemy health is 0, check player proximity)
  local rewardTable = {
    Goblin = 5,
    Orc = 15,
    Dragon = 100,
  }
  local reward = rewardTable[enemyType] or 0
  if reward > 0 then
    addPlayerCoins(player, reward)  -- server-side function
  end
end

-- Session-locked currency (prevents duplication exploit):
-- Use session lock pattern in DataStore (see DATA PERSISTENCE section)
-- Never allow concurrent saves — lock the session when player joins, release on leave

-- Sanity check currency values before saving:
local MAX_COINS_PER_SESSION_GAIN = 10000  -- impossible to earn more legitimately in one session
local sessionGains: {[Player]: number} = {}

local function addPlayerCoins(player: Player, amount: number)
  if amount <= 0 then return end
  sessionGains[player] = (sessionGains[player] or 0) + amount
  if sessionGains[player] > MAX_COINS_PER_SESSION_GAIN then
    warn("[AntiCheat] Suspicious coin gain for " .. player.Name)
    -- Flag account, do not save inflated value
    return
  end
  -- safe to add
end

--- DAMAGE VALIDATION (Server calculates all damage) ---
-- Client fires "I attacked" with target + weapon info
-- Server recalculates: checks range, weapon damage, cooldown, target validity

local function calculateDamage(weaponName: string, critChance: number, playerStats: {attackPower: number}): number
  local baseWeaponDamage = {
    Sword = 10,
    Bow = 7,
    Staff = 12,
    Axe = 14,
  }
  local base = baseWeaponDamage[weaponName] or 5
  local attackMult = 1 + (playerStats.attackPower or 0) * 0.01  -- 1% per attack point
  local crit = (math.random() < critChance) and 2.0 or 1.0
  return math.floor(base * attackMult * crit)
end

-- Server attack handler validates everything:
local AttackRemote = game:GetService("ReplicatedStorage"):WaitForChild("Remotes"):WaitForChild("RequestAttack")
local attackCooldowns: {[Player]: number} = {}

AttackRemote.OnServerEvent:Connect(function(player: Player, targetId: number, weaponName: string)
  -- 1. Cooldown
  local now = tick()
  local lastAttack = attackCooldowns[player] or 0
  if now - lastAttack < 0.4 then return end  -- 400ms cooldown
  attackCooldowns[player] = now

  -- 2. Player alive
  local char = player.Character
  if not char then return end
  local h = char:FindFirstChildOfClass("Humanoid")
  if not h or h.Health <= 0 then return end
  local root = char:FindFirstChild("HumanoidRootPart")
  if not root then return end

  -- 3. Target exists and alive
  local targetPlayer = game.Players:GetPlayerByUserId(targetId)
  local targetChar = targetPlayer and targetPlayer.Character
  if not targetChar then return end
  local targetH = targetChar:FindFirstChildOfClass("Humanoid")
  if not targetH or targetH.Health <= 0 then return end
  local targetRoot = targetChar:FindFirstChild("HumanoidRootPart")
  if not targetRoot then return end

  -- 4. Range check
  local MELEE_RANGE = 10  -- studs
  if (root.Position - targetRoot.Position).Magnitude > MELEE_RANGE then return end

  -- 5. Weapon in hand
  local equippedTool = char:FindFirstChildOfClass("Tool")
  if not equippedTool or equippedTool.Name ~= weaponName then return end

  -- 6. Compute damage server-side
  local stats = getPlayerStats(player)  -- from DataStore or session cache
  local damage = calculateDamage(weaponName, stats.critChance, stats)

  -- 7. Apply
  targetH:TakeDamage(damage)
end)

--- REMOTE RATE LIMITING (per-player per-remote) ---
-- Generalized rate limiter for any RemoteEvent

type RateLimitConfig = {
  maxCalls: number,
  windowSeconds: number,
}

local rateLimitData: {[RemoteEvent]: {[Player]: {calls: number, windowStart: number}}} = {}

local function isRateLimited(remote: RemoteEvent, player: Player, config: RateLimitConfig): boolean
  if not rateLimitData[remote] then rateLimitData[remote] = {} end
  if not rateLimitData[remote][player] then
    rateLimitData[remote][player] = {calls = 0, windowStart = tick()}
  end

  local data = rateLimitData[remote][player]
  local now = tick()

  -- Reset window if expired
  if now - data.windowStart >= config.windowSeconds then
    data.calls = 0
    data.windowStart = now
  end

  data.calls += 1
  if data.calls > config.maxCalls then
    return true  -- rate limited
  end
  return false
end

-- Usage:
local ChatRemote = game:GetService("ReplicatedStorage"):WaitForChild("Remotes"):WaitForChild("SendChatMessage")
local CHAT_RATE = {maxCalls = 10, windowSeconds = 5}  -- max 10 messages per 5 seconds

ChatRemote.OnServerEvent:Connect(function(player: Player, message: string)
  if isRateLimited(ChatRemote, player, CHAT_RATE) then
    warn("[AntiCheat] Chat spam from " .. player.Name)
    return
  end
  -- process chat
end)

--- INPUT SANITATION ---
-- Always validate type and range of arguments from clients
local function sanitizeString(value: any, maxLength: number): string?
  if type(value) ~= "string" then return nil end
  if #value > maxLength then return nil end
  -- Strip control characters
  value = value:gsub("[%c]", "")
  if #value == 0 then return nil end
  return value
end

local function sanitizeNumber(value: any, min: number, max: number): number?
  if type(value) ~= "number" then return nil end
  if value ~= value then return nil end  -- NaN check
  if value < min or value > max then return nil end
  return value
end

local function sanitizeVector3(value: any, maxMagnitude: number): Vector3?
  if typeof(value) ~= "Vector3" then return nil end
  if value.Magnitude > maxMagnitude then return nil end
  if value.X ~= value.X or value.Y ~= value.Y or value.Z ~= value.Z then return nil end  -- NaN check
  return value
end

--- EXPLOIT LOGGING (to DataStore for review) ---
local DataStoreService = game:GetService("DataStoreService")
local exploitLog = DataStoreService:GetDataStore("ExploitLog_v1")

local function logViolation(player: Player, violationType: string, details: string)
  local key = "violations_" .. player.UserId
  local success, err = pcall(function()
    exploitLog:UpdateAsync(key, function(old)
      old = old or {}
      table.insert(old, {
        type = violationType,
        details = details,
        timestamp = os.time(),
        username = player.Name,
      })
      -- Keep only last 50 violations
      if #old > 50 then
        table.remove(old, 1)
      end
      return old
    end)
  end)
  if not success then
    warn("[AntiCheat] Failed to log violation: " .. tostring(err))
  end
end
`;

// ============================================================
// SOCIAL SYSTEMS — Friends, parties, trading, guilds, chat
// ============================================================
export const MP_SOCIAL: string = `
=== ROBLOX SOCIAL SYSTEMS BIBLE ===

--- FRIENDS LIST ---
-- Players:GetFriendsAsync(userId) returns FriendPages object
-- Each page contains up to 100 friends

local Players = game:GetService("Players")

local function getFriendsList(userId: number): {{Id: number, Username: string, IsOnline: boolean}}
  local friends = {}
  local success, pages = pcall(function()
    return Players:GetFriendsAsync(userId)
  end)
  if not success then
    warn("GetFriendsAsync failed: " .. tostring(pages))
    return friends
  end

  while true do
    local items = pages:GetCurrentPage()
    for _, friend in ipairs(items) do
      table.insert(friends, {
        Id = friend.Id,
        Username = friend.Username,
        IsOnline = friend.IsOnline,
      })
    end
    if pages.IsFinished then break end
    local ok, err = pcall(function() pages:AdvanceToNextPageAsync() end)
    if not ok then break end
  end
  return friends
end

-- Check if two players are friends:
local function areFriends(player1: Player, player2: Player): boolean
  local success, result = pcall(function()
    return player1:IsFriendsWith(player2.UserId)
  end)
  return success and result
end

-- Get mutual friends:
local function getMutualFriends(userId1: number, userId2: number): {number}
  local friends1 = getFriendsList(userId1)
  local friends2 = getFriendsList(userId2)
  local set: {[number]: boolean} = {}
  for _, f in ipairs(friends1) do set[f.Id] = true end
  local mutual = {}
  for _, f in ipairs(friends2) do
    if set[f.Id] then table.insert(mutual, f.Id) end
  end
  return mutual
end

--- PARTY SYSTEM ---
-- Parties are server-side state: leader + members list
-- Parties persist across round transitions via MessagingService or TeleportService data

type Party = {
  id: string,
  leaderId: number,
  members: {number},       -- userIds
  maxSize: number,
  created: number,         -- tick()
}

local activeParties: {[string]: Party} = {}
local playerParty: {[number]: string} = {}  -- userId → partyId

local function generatePartyId(): string
  return tostring(math.random(100000, 999999)) .. "_" .. tostring(os.time())
end

local function createParty(leader: Player, maxSize: number): Party
  local partyId = generatePartyId()
  local party: Party = {
    id = partyId,
    leaderId = leader.UserId,
    members = {leader.UserId},
    maxSize = maxSize or 4,
    created = tick(),
  }
  activeParties[partyId] = party
  playerParty[leader.UserId] = partyId
  return party
end

local function inviteToParty(leader: Player, target: Player): boolean
  local partyId = playerParty[leader.UserId]
  if not partyId then return false end
  local party = activeParties[partyId]
  if not party then return false end
  if party.leaderId ~= leader.UserId then return false end  -- only leader can invite
  if #party.members >= party.maxSize then return false end
  if playerParty[target.UserId] then return false end  -- already in a party

  -- Fire invite remote to target
  local InviteRemote = game:GetService("ReplicatedStorage"):WaitForChild("Remotes"):WaitForChild("Party"):WaitForChild("InvitePlayer")
  InviteRemote:FireClient(target, leader.UserId, leader.Name, partyId)
  return true
end

local function acceptPartyInvite(player: Player, partyId: string): boolean
  if playerParty[player.UserId] then return false end  -- already in party
  local party = activeParties[partyId]
  if not party then return false end
  if #party.members >= party.maxSize then return false end

  table.insert(party.members, player.UserId)
  playerParty[player.UserId] = partyId

  -- Notify all party members
  syncPartyToMembers(party)
  return true
end

local function leaveParty(player: Player)
  local partyId = playerParty[player.UserId]
  if not partyId then return end
  local party = activeParties[partyId]
  if not party then return end

  -- Remove from members
  for i, uid in ipairs(party.members) do
    if uid == player.UserId then
      table.remove(party.members, i)
      break
    end
  end
  playerParty[player.UserId] = nil

  -- If leader left, assign new leader or disband
  if party.leaderId == player.UserId then
    if #party.members > 0 then
      party.leaderId = party.members[1]  -- promote oldest member
    else
      activeParties[partyId] = nil  -- disband empty party
      return
    end
  end

  syncPartyToMembers(party)
end

local function syncPartyToMembers(party: Party)
  local SyncRemote = game:GetService("ReplicatedStorage"):WaitForChild("Remotes"):WaitForChild("Party"):WaitForChild("SyncPartyData")
  for _, uid in ipairs(party.members) do
    local member = game.Players:GetPlayerByUserId(uid)
    if member then
      SyncRemote:FireClient(member, {
        id = party.id,
        leaderId = party.leaderId,
        members = party.members,
        maxSize = party.maxSize,
      })
    end
  end
end

-- Clean up parties when player leaves
Players.PlayerRemoving:Connect(function(player)
  leaveParty(player)
  playerParty[player.UserId] = nil
end)

--- TRADING SYSTEM (atomic swap pattern) ---
-- Both players must confirm → server processes atomically
-- NEVER modify inventories until both confirm

type TradeOffer = {
  id: string,
  initiatorId: number,
  targetId: number,
  initiatorItems: {string},
  targetItems: {string},
  initiatorConfirmed: boolean,
  targetConfirmed: boolean,
  expiresAt: number,
  status: "pending" | "confirmed" | "cancelled" | "completed",
}

local pendingTrades: {[string]: TradeOffer} = {}
local TRADE_EXPIRY_SECONDS = 60

local function createTrade(initiator: Player, target: Player): string
  local tradeId = "trade_" .. initiator.UserId .. "_" .. target.UserId .. "_" .. os.time()
  pendingTrades[tradeId] = {
    id = tradeId,
    initiatorId = initiator.UserId,
    targetId = target.UserId,
    initiatorItems = {},
    targetItems = {},
    initiatorConfirmed = false,
    targetConfirmed = false,
    expiresAt = tick() + TRADE_EXPIRY_SECONDS,
    status = "pending",
  }

  -- Expire trades automatically
  task.delay(TRADE_EXPIRY_SECONDS, function()
    local trade = pendingTrades[tradeId]
    if trade and trade.status == "pending" then
      trade.status = "cancelled"
      notifyTradeCancelled(tradeId, "Trade expired")
      pendingTrades[tradeId] = nil
    end
  end)

  return tradeId
end

local function confirmTrade(player: Player, tradeId: string): boolean
  local trade = pendingTrades[tradeId]
  if not trade then return false end
  if trade.status ~= "pending" then return false end
  if tick() > trade.expiresAt then
    trade.status = "cancelled"
    return false
  end

  if player.UserId == trade.initiatorId then
    trade.initiatorConfirmed = true
  elseif player.UserId == trade.targetId then
    trade.targetConfirmed = true
  else
    return false  -- not part of this trade
  end

  -- Both confirmed → execute atomically
  if trade.initiatorConfirmed and trade.targetConfirmed then
    trade.status = "confirmed"
    local success = executeTradeAtomic(trade)
    if success then
      trade.status = "completed"
      pendingTrades[tradeId] = nil
    else
      trade.status = "cancelled"
      notifyTradeCancelled(tradeId, "Trade failed — items not found")
      pendingTrades[tradeId] = nil
    end
  end

  return true
end

local function executeTradeAtomic(trade: TradeOffer): boolean
  -- Lock both players' inventories before modifying
  -- Verify initiator has all initiatorItems
  local initiator = game.Players:GetPlayerByUserId(trade.initiatorId)
  local target = game.Players:GetPlayerByUserId(trade.targetId)
  if not initiator or not target then return false end

  -- Verify items exist in inventories (check session cache / DataStore)
  for _, item in ipairs(trade.initiatorItems) do
    if not playerHasItem(initiator, item) then return false end
  end
  for _, item in ipairs(trade.targetItems) do
    if not playerHasItem(target, item) then return false end
  end

  -- All validated — swap items
  for _, item in ipairs(trade.initiatorItems) do
    removeItemFromPlayer(initiator, item)
    giveItemToPlayer(target, item)
  end
  for _, item in ipairs(trade.targetItems) do
    removeItemFromPlayer(target, item)
    giveItemToPlayer(initiator, item)
  end

  -- Save both players immediately after trade
  savePlayerData(initiator)
  savePlayerData(target)

  return true
end

--- GUILDS / CLANS (DataStore-backed) ---
-- Guild data stored in DataStore, cached in server memory

type Guild = {
  id: string,
  name: string,
  tag: string,        -- 2-5 chars, shown in [TAG] before name
  ownerId: number,
  officers: {number},
  members: {number},
  maxMembers: number,
  xp: number,
  level: number,
  createdAt: number,
  description: string,
}

local DataStoreService = game:GetService("DataStoreService")
local GuildStore = DataStoreService:GetDataStore("Guilds_v1")
local guildCache: {[string]: Guild} = {}

local function getGuild(guildId: string): Guild?
  if guildCache[guildId] then return guildCache[guildId] end
  local success, data = pcall(function()
    return GuildStore:GetAsync("guild_" .. guildId)
  end)
  if success and data then
    guildCache[guildId] = data
    return data
  end
  return nil
end

local function saveGuild(guild: Guild)
  local success, err = pcall(function()
    GuildStore:SetAsync("guild_" .. guild.id, guild)
  end)
  if not success then
    warn("[Guild] Save failed: " .. tostring(err))
  end
  guildCache[guild.id] = guild
end

local function createGuild(owner: Player, name: string, tag: string): Guild?
  -- Validate name (3-32 chars, alphanumeric + spaces)
  if #name < 3 or #name > 32 then return nil end
  if #tag < 2 or #tag > 5 then return nil end

  local guildId = tostring(owner.UserId) .. "_" .. tostring(os.time())
  local guild: Guild = {
    id = guildId,
    name = name,
    tag = tag:upper(),
    ownerId = owner.UserId,
    officers = {},
    members = {owner.UserId},
    maxMembers = 50,
    xp = 0,
    level = 1,
    createdAt = os.time(),
    description = "",
  }

  saveGuild(guild)

  -- Record guild membership in player data
  setPlayerGuildId(owner, guildId)

  return guild
end

local function addGuildXP(guildId: string, amount: number)
  local guild = getGuild(guildId)
  if not guild then return end
  guild.xp += amount

  -- Level up thresholds (xp required per level)
  local xpTable = {0, 1000, 3000, 7500, 15000, 30000, 60000, 120000, 250000, 500000}
  local newLevel = 1
  for i, threshold in ipairs(xpTable) do
    if guild.xp >= threshold then newLevel = i end
  end
  guild.level = newLevel

  saveGuild(guild)

  -- Notify online guild members of XP gain
  for _, uid in ipairs(guild.members) do
    local player = game.Players:GetPlayerByUserId(uid)
    if player then
      local GuildXPRemote = game:GetService("ReplicatedStorage"):WaitForChild("Remotes"):WaitForChild("GuildXPUpdate")
      GuildXPRemote:FireClient(player, guild.xp, guild.level)
    end
  end
end

--- TEXTCHATSERVICE (modern Roblox chat) ---
-- TextChatService replaces legacy Chat service (Luau API, 2022+)

local TextChatService = game:GetService("TextChatService")

-- Configure TextChatService in server:
TextChatService.ChatVersion = Enum.ChatVersion.TextChatService
TextChatService.CreateDefaultTextChannels = true
TextChatService.CreateDefaultSystemMessages = true

-- Custom text channels for party/guild chat:
local function createPartyChannel(partyId: string): TextChannel
  local channel = Instance.new("TextChannel")
  channel.Name = "Party_" .. partyId
  channel.Parent = TextChatService
  return channel
end

-- Add player to party channel:
local function addPlayerToPartyChannel(player: Player, channel: TextChannel)
  -- TextChannelMessageSent only fires on server; use TextSource to bind players
  local source = Instance.new("TextSource")
  source.UserId = player.UserId
  source.CanSend = true
  source.Parent = channel
end

-- Filter outgoing messages (server-side):
TextChatService.OnIncomingMessage = function(message: TextChatMessage)
  -- message.TextSource.UserId = sender's UserId
  -- message.Text = raw message text
  -- message.MessageId = unique ID
  -- Return modified TextChatMessageProperties or nil to keep original
  local props = Instance.new("TextChatMessageProperties")
  -- Could add prefix: guild tag, rank badge, etc.
  return props
end

-- Send system message to specific player:
local function sendSystemMessage(player: Player, text: string)
  local generalChannel = TextChatService:FindFirstChild("RBXGeneral")
  if generalChannel and generalChannel:IsA("TextChannel") then
    generalChannel:DisplaySystemMessage(text)
  end
end

-- Guild chat channel system:
local guildChannels: {[string]: TextChannel} = {}

local function getOrCreateGuildChannel(guildId: string): TextChannel
  if guildChannels[guildId] then return guildChannels[guildId] end
  local channel = Instance.new("TextChannel")
  channel.Name = "Guild_" .. guildId
  channel.Parent = TextChatService
  guildChannels[guildId] = channel
  return channel
end
`;

// ============================================================
// MATCHMAKING — ELO, queues, TeleportService, teams
// ============================================================
export const MP_MATCHMAKING: string = `
=== ROBLOX MATCHMAKING BIBLE ===

--- ELO / MMR RATING SYSTEM ---
-- Standard Elo formula: K-factor determines rating volatility
-- New players: K=32 (high volatility). Established (>30 games): K=16. Top players: K=8

local function calculateNewElo(
  winnerElo: number,
  loserElo: number,
  kFactor: number
): (number, number)  -- returns (newWinnerElo, newLoserElo)
  local expectedWinner = 1 / (1 + 10 ^ ((loserElo - winnerElo) / 400))
  local expectedLoser = 1 - expectedWinner

  local newWinnerElo = math.round(winnerElo + kFactor * (1 - expectedWinner))
  local newLoserElo = math.round(loserElo + kFactor * (0 - expectedLoser))

  -- Floor at 100 — never go below bronze
  newWinnerElo = math.max(100, newWinnerElo)
  newLoserElo = math.max(100, newLoserElo)

  return newWinnerElo, newLoserElo
end

-- Draw result:
local function calculateEloForDraw(playerAElo: number, playerBElo: number, kFactor: number): (number, number)
  local expectedA = 1 / (1 + 10 ^ ((playerBElo - playerAElo) / 400))
  local newA = math.round(playerAElo + kFactor * (0.5 - expectedA))
  local newB = math.round(playerBElo + kFactor * (0.5 - (1 - expectedA)))
  return math.max(100, newA), math.max(100, newB)
end

-- Rank tiers based on Elo:
local function getEloRank(elo: number): string
  if elo < 500 then return "Bronze"
  elseif elo < 900 then return "Silver"
  elseif elo < 1200 then return "Gold"
  elseif elo < 1500 then return "Platinum"
  elseif elo < 1800 then return "Diamond"
  elseif elo < 2100 then return "Master"
  else return "Grandmaster"
  end
end

local function getKFactor(gamesPlayed: number, elo: number): number
  if gamesPlayed < 30 then return 32
  elseif elo >= 2100 then return 8
  else return 16
  end
end

--- QUEUE MANAGEMENT ---
type QueueEntry = {
  player: Player,
  elo: number,
  queuedAt: number,   -- tick()
  mode: string,       -- "1v1", "2v2", "5v5"
}

local queues: {[string]: {QueueEntry}} = {
  ["1v1"] = {},
  ["2v2"] = {},
  ["5v5"] = {},
}

local MAX_ELO_DIFFERENCE = 200  -- base allowed difference
local ELO_EXPANSION_PER_SECOND = 10  -- expand search by 10 elo per second waiting

local function joinQueue(player: Player, mode: string, playerElo: number)
  -- Remove from any existing queue first
  leaveAllQueues(player)

  local entry: QueueEntry = {
    player = player,
    elo = playerElo,
    queuedAt = tick(),
    mode = mode,
  }
  table.insert(queues[mode] or {}, entry)
end

local function leaveAllQueues(player: Player)
  for mode, queue in pairs(queues) do
    for i = #queue, 1, -1 do
      if queue[i].player == player then
        table.remove(queue, i)
      end
    end
  end
end

local function findMatch_1v1(): (QueueEntry, QueueEntry)?
  local queue = queues["1v1"]
  if #queue < 2 then return nil end

  local now = tick()
  for i = 1, #queue do
    for j = i + 1, #queue do
      local a = queue[i]
      local b = queue[j]
      -- Expand elo range based on wait time
      local waitA = now - a.queuedAt
      local waitB = now - b.queuedAt
      local expansionA = waitA * ELO_EXPANSION_PER_SECOND
      local expansionB = waitB * ELO_EXPANSION_PER_SECOND
      local allowedDiff = MAX_ELO_DIFFERENCE + math.min(expansionA, expansionB)

      if math.abs(a.elo - b.elo) <= allowedDiff then
        -- Remove both from queue
        table.remove(queue, j)
        table.remove(queue, i)
        return a, b
      end
    end
  end
  return nil
end

-- Run matchmaking every 2 seconds:
task.spawn(function()
  while true do
    task.wait(2)
    -- 1v1 matching
    while true do
      local a, b = findMatch_1v1()
      if not a then break end
      startMatch_1v1(a, b)
    end
    -- 2v2 matching (need 4 players within elo range)
    -- 5v5 matching (need 10 players or fill with bots after 60s wait)
  end
end)

--- TELEPORTSERVICE — Reserved Servers for Matches ---
-- TeleportService:ReserveServer() creates a private server for a match

local TeleportService = game:GetService("TeleportService")
local GAME_PLACE_ID = 123456789  -- replace with actual PlaceId

local function startMatch_1v1(entryA: QueueEntry, entryB: QueueEntry)
  local success, accessCode = pcall(function()
    return TeleportService:ReserveServer(GAME_PLACE_ID)
  end)

  if not success then
    warn("[Matchmaking] ReserveServer failed: " .. tostring(accessCode))
    -- Re-queue players
    table.insert(queues["1v1"], entryA)
    table.insert(queues["1v1"], entryB)
    return
  end

  -- Pack match data to send to destination server
  local matchData = {
    matchId = "match_" .. os.time() .. "_" .. math.random(1000, 9999),
    mode = "1v1",
    players = {
      {userId = entryA.player.UserId, elo = entryA.elo, team = "Red"},
      {userId = entryB.player.UserId, elo = entryB.elo, team = "Blue"},
    },
    startedAt = os.time(),
  }

  -- TeleportOptions lets us pass data to the destination server
  local teleportOptions = Instance.new("TeleportOptions")
  teleportOptions.ReservedServerAccessCode = accessCode
  teleportOptions:SetTeleportData(matchData)

  local players = {entryA.player, entryB.player}
  local ok, err = pcall(function()
    TeleportService:TeleportAsync(GAME_PLACE_ID, players, teleportOptions)
  end)

  if not ok then
    warn("[Matchmaking] TeleportAsync failed: " .. tostring(err))
    -- Return to queue
    table.insert(queues["1v1"], entryA)
    table.insert(queues["1v1"], entryB)
  end
end

-- On destination server: read match data
local function initMatchFromTeleportData()
  local Players = game:GetService("Players")
  Players.PlayerAdded:Connect(function(player)
    local data = player:GetJoinData()
    local teleportData = data.TeleportData
    if teleportData and teleportData.matchId then
      -- Apply team assignment, ELO display, etc.
      local matchInfo = teleportData  -- type: matchData table above
      assignPlayerToTeam(player, matchInfo)
    end
  end)
end

--- LOBBY PATTERN ---
-- Lobby server waits for enough players, then teleports all to match server
-- Tracks readiness state with Attributes on a folder

local lobbyFolder = workspace:FindFirstChild("LobbyState") or Instance.new("Folder", workspace)
lobbyFolder.Name = "LobbyState"
lobbyFolder:SetAttribute("PlayerCount", 0)
lobbyFolder:SetAttribute("MaxPlayers", 10)
lobbyFolder:SetAttribute("Phase", "Waiting")    -- Waiting | Countdown | Starting
lobbyFolder:SetAttribute("CountdownTime", 10)   -- seconds

local function updateLobbyState()
  local count = #game.Players:GetPlayers()
  lobbyFolder:SetAttribute("PlayerCount", count)
  local max = lobbyFolder:GetAttribute("MaxPlayers")

  if count >= max and lobbyFolder:GetAttribute("Phase") == "Waiting" then
    lobbyFolder:SetAttribute("Phase", "Countdown")
    startLobbyCountdown()
  elseif count < math.floor(max * 0.5) then
    lobbyFolder:SetAttribute("Phase", "Waiting")
  end
end

local function startLobbyCountdown()
  local timeLeft = lobbyFolder:GetAttribute("CountdownTime")
  task.spawn(function()
    while timeLeft > 0 do
      task.wait(1)
      timeLeft -= 1
      lobbyFolder:SetAttribute("CountdownTime", timeLeft)
      if #game.Players:GetPlayers() < math.floor(lobbyFolder:GetAttribute("MaxPlayers") * 0.5) then
        -- Not enough players, cancel
        lobbyFolder:SetAttribute("Phase", "Waiting")
        lobbyFolder:SetAttribute("CountdownTime", 10)
        return
      end
    end
    -- Launch match
    lobbyFolder:SetAttribute("Phase", "Starting")
    launchMatchFromLobby()
  end)
end

--- TEAM BALANCING ---
-- When assigning teams, balance by total ELO, not random

local function balanceTeams(players: {Player}, playerElos: {[number]: number}): ({Player}, {Player})
  -- Sort by ELO descending
  table.sort(players, function(a, b)
    return (playerElos[a.UserId] or 1000) > (playerElos[b.UserId] or 1000)
  end)

  local team1: {Player} = {}
  local team2: {Player} = {}
  local team1Elo = 0
  local team2Elo = 0

  -- Snake draft: 1→team1, 2→team2, 3→team2, 4→team1, 5→team1...
  for i, player in ipairs(players) do
    local elo = playerElos[player.UserId] or 1000
    if team1Elo <= team2Elo then
      table.insert(team1, player)
      team1Elo += elo
    else
      table.insert(team2, player)
      team2Elo += elo
    end
  end

  return team1, team2
end

-- Assign players to Roblox Teams:
local function assignTeams(team1Players: {Player}, team2Players: {Player})
  local Teams = game:GetService("Teams")
  local redTeam = Teams:FindFirstChild("Red") or Instance.new("Team", Teams)
  redTeam.Name = "Red"
  redTeam.TeamColor = BrickColor.new("Bright red")  -- BrickColor, not Color3

  local blueTeam = Teams:FindFirstChild("Blue") or Instance.new("Team", Teams)
  blueTeam.Name = "Blue"
  blueTeam.TeamColor = BrickColor.new("Bright blue")

  for _, player in ipairs(team1Players) do
    player.Team = redTeam
    player.TeamColor = redTeam.TeamColor
  end
  for _, player in ipairs(team2Players) do
    player.Team = blueTeam
    player.TeamColor = blueTeam.TeamColor
  end
end
`;

// ============================================================
// INSTANCES — MessagingService, cross-server, server browser
// ============================================================
export const MP_INSTANCES: string = `
=== ROBLOX CROSS-SERVER & INSTANCES BIBLE ===

--- MESSAGINGSERVICE — Cross-Server Communication ---
-- MessagingService allows servers to publish/subscribe to topics
-- Max message size: 1KB. Max publish rate: 150 messages/minute per topic.
-- Max subscriptions per server: 5

local MessagingService = game:GetService("MessagingService")

-- Topics naming convention: use descriptive prefixes
local TOPIC_GLOBAL_ANNOUNCEMENT = "GlobalAnnouncement_v1"
local TOPIC_SERVER_BROWSER = "ServerBrowser_v1"
local TOPIC_PARTY_INVITE = "PartyInvite_v1"
local TOPIC_GUILD_NOTIFICATION = "GuildNotification_v1"

-- Subscribe to a topic (do this at server startup):
local function subscribeToTopic(topic: string, handler: (any) -> ())
  local success, err = pcall(function()
    MessagingService:SubscribeAsync(topic, function(message)
      -- message.Data = the published payload
      -- message.Sent = DateTime when published (UTC)
      local ok, decodeErr = pcall(handler, message.Data)
      if not ok then
        warn("[MessagingService] Handler error for topic " .. topic .. ": " .. tostring(decodeErr))
      end
    end)
  end)
  if not success then
    warn("[MessagingService] Subscribe failed for " .. topic .. ": " .. tostring(err))
  end
end

-- Publish to all servers:
local function publishToAllServers(topic: string, data: any)
  -- Data is automatically JSON-serialized
  -- Must be serializable: strings, numbers, booleans, tables (no Instances, no Vectors directly)
  local success, err = pcall(function()
    MessagingService:PublishAsync(topic, data)
  end)
  if not success then
    warn("[MessagingService] Publish failed for " .. topic .. ": " .. tostring(err))
  end
end

-- GLOBAL ANNOUNCEMENTS (all servers see this):
subscribeToTopic(TOPIC_GLOBAL_ANNOUNCEMENT, function(data)
  -- data = {message: string, type: "event"|"system"|"winner", priority: number}
  local Players = game:GetService("Players")
  local AnnounceRemote = game:GetService("ReplicatedStorage"):WaitForChild("Remotes"):WaitForChild("GlobalAnnouncement")
  AnnounceRemote:FireAllClients(data.message, data.type)
end)

local function broadcastGlobalAnnouncement(message: string, announcementType: string)
  publishToAllServers(TOPIC_GLOBAL_ANNOUNCEMENT, {
    message = message,
    type = announcementType,
    priority = 1,
    timestamp = os.time(),
  })
end

-- SERVER BROWSER (list all active servers):
-- Each server publishes its info on startup and periodically

local currentServerData = {
  jobId = game.JobId,
  placeId = game.PlaceId,
  playerCount = 0,
  maxPlayers = game.Players.MaxPlayers,
  mapName = "Desert Arena",
  mode = "FreeForAll",
  startedAt = os.time(),
}

local function publishServerInfo()
  currentServerData.playerCount = #game.Players:GetPlayers()
  publishToAllServers(TOPIC_SERVER_BROWSER, {
    action = "heartbeat",
    server = currentServerData,
  })
end

-- Publish on startup, then every 30 seconds
publishServerInfo()
task.spawn(function()
  while true do
    task.wait(30)
    publishServerInfo()
  end
end)

-- Publish removal when server closes:
game:BindToClose(function()
  publishToAllServers(TOPIC_SERVER_BROWSER, {
    action = "remove",
    jobId = game.JobId,
  })
end)

-- Client maintains a local server list from broadcasts:
-- (This logic runs in a server script that collects incoming heartbeats)
local knownServers: {[string]: any} = {}
local SERVER_STALE_AFTER = 90  -- seconds without heartbeat = remove from list

subscribeToTopic(TOPIC_SERVER_BROWSER, function(data)
  if data.action == "heartbeat" then
    knownServers[data.server.jobId] = {
      data = data.server,
      lastSeen = tick(),
    }
  elseif data.action == "remove" then
    knownServers[data.jobId] = nil
  end
end)

-- Prune stale servers every 60 seconds:
task.spawn(function()
  while true do
    task.wait(60)
    local now = tick()
    for jobId, entry in pairs(knownServers) do
      if now - entry.lastSeen > SERVER_STALE_AFTER then
        knownServers[jobId] = nil
      end
    end
  end
end)

-- CROSS-SERVER PARTY INVITE:
-- When player A on Server 1 invites player B on Server 2:
local function sendCrossServerPartyInvite(
  senderUserId: number,
  senderName: string,
  targetUserId: number,
  partyId: string
)
  publishToAllServers(TOPIC_PARTY_INVITE, {
    targetUserId = targetUserId,
    senderUserId = senderUserId,
    senderName = senderName,
    partyId = partyId,
    sourceJobId = game.JobId,
  })
end

subscribeToTopic(TOPIC_PARTY_INVITE, function(data)
  -- Check if target player is on THIS server
  local targetPlayer = game.Players:GetPlayerByUserId(data.targetUserId)
  if not targetPlayer then return end

  -- Fire invite to that player
  local InviteRemote = game:GetService("ReplicatedStorage"):WaitForChild("Remotes"):WaitForChild("Party"):WaitForChild("InvitePlayer")
  InviteRemote:FireClient(targetPlayer, data.senderUserId, data.senderName, data.partyId, data.sourceJobId)
end)

--- TELEPORTSERVICE ADVANCED PATTERNS ---
local TeleportService = game:GetService("TeleportService")

-- TeleportService.LocalPlayerArrivedFromTeleport fires on client when player lands
-- Read arrival data:
TeleportService.LocalPlayerArrivedFromTeleport:Connect(function(customLoadingScreen, teleportData)
  -- teleportData contains what was set via TeleportOptions:SetTeleportData()
  if teleportData and teleportData.matchId then
    -- We arrived in a match server
    displayMatchIntro(teleportData)
  end
end)

-- Teleport with loading screen:
local function teleportWithLoadingScreen(players: {Player}, placeId: number, data: any)
  local loadingGui = script:FindFirstChild("LoadingScreen")  -- StarterGui-style ScreenGui
  local teleportOptions = Instance.new("TeleportOptions")
  if data then teleportOptions:SetTeleportData(data) end

  -- Show custom loading screen (must be in StarterGui or sent separately)
  local success, err = pcall(function()
    TeleportService:TeleportAsync(placeId, players, teleportOptions)
  end)
  if not success then
    warn("[Teleport] Failed: " .. tostring(err))
  end
end

-- Handle failed teleports with retry:
TeleportService.TeleportInitFailed:Connect(function(player, teleportResult, errorMessage)
  -- teleportResult: Enum.TeleportResult (Success, Failure, GameEnded, GameFull, etc.)
  warn(string.format("[Teleport] Init failed for %s: %s (%s)",
    player.Name, tostring(teleportResult), errorMessage))

  -- Notify player
  local FailRemote = game:GetService("ReplicatedStorage"):WaitForChild("Remotes"):WaitForChild("TeleportFailed")
  FailRemote:FireClient(player, "Teleport failed. Retrying...")

  -- Retry after 3 seconds (max 3 attempts)
  -- Track attempts with player attribute
  local attempts = player:GetAttribute("TeleportAttempts") or 0
  attempts += 1
  player:SetAttribute("TeleportAttempts", attempts)

  if attempts < 3 then
    task.delay(3, function()
      if player.Parent then  -- still in game
        -- Re-trigger teleport
      end
    end)
  else
    FailRemote:FireClient(player, "Could not teleport after 3 attempts. Please rejoin.")
    player:SetAttribute("TeleportAttempts", 0)
  end
end)

--- STREAMINGNETWORK OWNERSHIP PATTERNS ---
-- StreamingEnabled causes parts to load asynchronously on clients
-- Configure in workspace properties:
-- workspace.StreamingEnabled = true (set in Explorer, not script)
-- workspace.StreamingMinRadius = 64   -- studs: parts within always loaded
-- workspace.StreamingTargetRadius = 256 -- studs: target for streaming

-- ModelStreamingMode options:
-- Enum.ModelStreamingMode.Default: model streams in/out with distance
-- Enum.ModelStreamingMode.Atomic: entire model loads or nothing
-- Enum.ModelStreamingMode.Persistent: always loaded, never streamed out
-- Enum.ModelStreamingMode.PauseOutsideRadius: pauses animations when out of radius
-- Enum.ModelStreamingMode.Disabled: streaming disabled for this model

-- Set model streaming mode:
local importantBuilding = workspace:FindFirstChild("MainCastle")
if importantBuilding and importantBuilding:IsA("Model") then
  importantBuilding.ModelStreamingMode = Enum.ModelStreamingMode.Persistent  -- always loaded
end

-- NPCs and enemies: use Atomic (entire NPC loads at once, not part by part)
local npc = workspace:FindFirstChild("Goblin")
if npc and npc:IsA("Model") then
  npc.ModelStreamingMode = Enum.ModelStreamingMode.Atomic
end

-- Terrain always streams automatically — no configuration needed

-- PersistentParts: set Model.LevelOfDetail:
-- Enum.ModelLevelOfDetail.Disabled = always full detail
-- Enum.ModelLevelOfDetail.StreamingMesh = shows low-poly when far

-- RequestStreamAroundAsync: ask server to stream content near a position
-- Call from LocalScript when teleporting player to ensure area is loaded
local function waitForAreaToLoad(position: Vector3)
  local success, err = pcall(function()
    workspace:RequestStreamAroundAsync(position, 5)  -- 5 second timeout
  end)
  if not success then
    warn("[Streaming] RequestStreamAround failed: " .. tostring(err))
  end
end
`;

// ============================================================
// DATA PERSISTENCE — DataStore, session locking, ProfileService-style
// ============================================================
const MP_DATA_PERSISTENCE: string = `
=== ROBLOX DATA PERSISTENCE BIBLE ===

--- DATASTORE FUNDAMENTALS ---
-- DataStoreService:GetDataStore("Name") — persistent key-value store
-- DataStoreService:GetOrderedDataStore("Name") — sorted store for leaderboards
-- Key naming: "player_12345678" or "guild_xyz" — consistent prefix pattern
-- Max key length: 50 characters
-- Max value size: 4MB (JSON-serialized)
-- Rate limits: 60 + numPlayers*10 reads/min, 60 + numPlayers*10 writes/min

local DataStoreService = game:GetService("DataStoreService")

-- NEVER use GetAsync in a tight loop — cache data server-side

--- SESSION LOCKING (prevents duplication exploits) ---
-- When player joins: set a lock in DataStore
-- While locked: only THIS server can write the player's data
-- When player leaves: release lock and save data

local PlayerDataStore = DataStoreService:GetDataStore("PlayerData_v3")
local SessionLockStore = DataStoreService:GetDataStore("SessionLocks_v1")

type PlayerData = {
  coins: number,
  gems: number,
  level: number,
  xp: number,
  inventory: {string},
  stats: {kills: number, deaths: number, wins: number, losses: number},
  settings: {sfxVolume: number, musicVolume: number},
  lastSeen: number,
  totalPlaytime: number,
  guildId: string?,
  eloRating: number,
  gamesPlayed: number,
}

local DEFAULT_DATA: PlayerData = {
  coins = 100,
  gems = 0,
  level = 1,
  xp = 0,
  inventory = {},
  stats = {kills = 0, deaths = 0, wins = 0, losses = 0},
  settings = {sfxVolume = 0.8, musicVolume = 0.5},
  lastSeen = os.time(),
  totalPlaytime = 0,
  guildId = nil,
  eloRating = 1000,
  gamesPlayed = 0,
}

local sessionData: {[Player]: PlayerData} = {}  -- live session cache
local sessionStart: {[Player]: number} = {}     -- tick() when they joined
local sessionLocked: {[Player]: boolean} = {}   -- whether lock acquired

local MAX_RETRIES = 5
local RETRY_BASE_DELAY = 0.5  -- seconds, doubles each retry

local function withRetry(fn: () -> any, retries: number?): (boolean, any)
  retries = retries or MAX_RETRIES
  local delay = RETRY_BASE_DELAY
  for attempt = 1, retries do
    local success, result = pcall(fn)
    if success then return true, result end
    if attempt < retries then
      task.wait(delay)
      delay = math.min(delay * 2, 30)  -- cap at 30 seconds
    else
      warn("[DataStore] All retries exhausted: " .. tostring(result))
    end
  end
  return false, nil
end

local function acquireSessionLock(userId: number): boolean
  local lockKey = "lock_" .. userId
  local thisJobId = game.JobId

  local success, acquired = withRetry(function()
    return SessionLockStore:UpdateAsync(lockKey, function(currentLock)
      if currentLock == nil or currentLock == thisJobId then
        return thisJobId  -- acquire or re-acquire our own lock
      end
      -- Another server holds the lock — don't overwrite
      return nil  -- returning nil cancels the update
    end)
  end)

  return success and acquired == thisJobId
end

local function releaseSessionLock(userId: number)
  local lockKey = "lock_" .. userId
  local thisJobId = game.JobId

  withRetry(function()
    SessionLockStore:UpdateAsync(lockKey, function(currentLock)
      if currentLock == thisJobId then
        return nil  -- nil deletes the key = release lock
      end
      return currentLock  -- someone else's lock, don't touch
    end)
  end)
end

local function loadPlayerData(player: Player): PlayerData
  local key = "player_" .. player.UserId

  -- First acquire session lock
  local lockAcquired = acquireSessionLock(player.UserId)
  if not lockAcquired then
    -- Another server may have this player's session
    warn("[DataStore] Could not acquire session lock for " .. player.Name)
    -- Kick player to prevent dual-session exploit
    player:Kick("Session conflict detected. Please rejoin.")
    return DEFAULT_DATA
  end
  sessionLocked[player] = true

  local success, data = withRetry(function()
    return PlayerDataStore:GetAsync(key)
  end)

  if success and data then
    -- Merge with defaults to handle new fields
    local merged = {}
    for k, v in pairs(DEFAULT_DATA) do
      merged[k] = data[k] ~= nil and data[k] or v
    end
    -- Deep merge for nested tables
    if data.stats then
      for k, v in pairs(DEFAULT_DATA.stats) do
        merged.stats[k] = data.stats[k] ~= nil and data.stats[k] or v
      end
    end
    if data.settings then
      for k, v in pairs(DEFAULT_DATA.settings) do
        merged.settings[k] = data.settings[k] ~= nil and data.settings[k] or v
      end
    end
    return merged
  elseif success then
    -- New player
    return DEFAULT_DATA
  else
    -- Load failed — use defaults but flag for careful saving
    warn("[DataStore] Load failed for " .. player.Name .. " — using defaults")
    return DEFAULT_DATA
  end
end

local function savePlayerData(player: Player, isLeaving: boolean?): boolean
  if not sessionData[player] then return false end
  if not sessionLocked[player] then
    warn("[DataStore] Attempted to save " .. player.Name .. " without session lock")
    return false
  end

  local key = "player_" .. player.UserId
  local data = sessionData[player]

  -- Update playtime
  if sessionStart[player] then
    data.totalPlaytime = (data.totalPlaytime or 0) + math.floor(tick() - sessionStart[player])
    if not isLeaving then
      sessionStart[player] = tick()  -- reset for next save interval
    end
  end
  data.lastSeen = os.time()

  local success, err = withRetry(function()
    -- UpdateAsync is safer than SetAsync — allows conflict detection
    PlayerDataStore:UpdateAsync(key, function(oldData)
      -- Sanity checks before saving
      if data.coins < 0 then data.coins = 0 end
      if data.gems < 0 then data.gems = 0 end
      if data.level < 1 then data.level = 1 end
      if data.eloRating < 100 then data.eloRating = 100 end
      return data
    end)
  end)

  if isLeaving then
    releaseSessionLock(player.UserId)
    sessionLocked[player] = nil
  end

  return success
end

-- Auto-save every 3 minutes:
task.spawn(function()
  while true do
    task.wait(180)
    for _, player in ipairs(game.Players:GetPlayers()) do
      savePlayerData(player, false)
    end
  end
end)

-- Player join:
game.Players.PlayerAdded:Connect(function(player)
  sessionStart[player] = tick()
  local data = loadPlayerData(player)
  sessionData[player] = data

  -- Send initial data to client
  local DataLoadedRemote = game:GetService("ReplicatedStorage"):WaitForChild("Remotes"):WaitForChild("DataLoaded")
  DataLoadedRemote:FireClient(player, {
    coins = data.coins,
    gems = data.gems,
    level = data.level,
    xp = data.xp,
    eloRating = data.eloRating,
  })
end)

-- Player leave:
game.Players.PlayerRemoving:Connect(function(player)
  savePlayerData(player, true)
  sessionData[player] = nil
  sessionStart[player] = nil
end)

-- Server close (save all remaining players):
game:BindToClose(function()
  if game:GetService("RunService"):IsStudio() then return end  -- skip in Studio
  local tasks = {}
  for _, player in ipairs(game.Players:GetPlayers()) do
    table.insert(tasks, task.spawn(function()
      savePlayerData(player, true)
    end))
  end
  -- Wait for all saves to complete (max 25 seconds before forced shutdown)
  local deadline = tick() + 25
  for _, t in ipairs(tasks) do
    local remaining = deadline - tick()
    if remaining <= 0 then break end
    task.wait(0)  -- yield to allow saves to proceed
  end
end)

--- UPDATEASYNC vs SETASYNC ---
-- SetAsync(key, value): overwrites. Use for new data or when no conflict risk.
-- UpdateAsync(key, transform): reads current, transforms, writes. Safe for concurrent updates.

-- ALWAYS use UpdateAsync for:
--   - Currency modifications (add coins: read→add→write)
--   - Incrementing stats (kills, deaths, wins)
--   - Any value multiple servers might touch

-- Example: atomic coin add (safe from race conditions):
local function addCoinsAtomic(userId: number, amount: number): boolean
  local key = "player_" .. userId
  local success = withRetry(function()
    PlayerDataStore:UpdateAsync(key, function(data)
      if not data then return nil end  -- player doesn't exist, skip
      data.coins = (data.coins or 0) + amount
      if data.coins < 0 then data.coins = 0 end  -- never negative
      return data
    end)
  end)
  return success
end

--- ORDERED DATASTORE — LEADERBOARDS ---
local LeaderboardStore = DataStoreService:GetOrderedDataStore("EloLeaderboard_v1")

-- Update player's score (must be integer):
local function updateLeaderboardScore(userId: number, score: number)
  local success, err = pcall(function()
    LeaderboardStore:SetAsync(tostring(userId), math.floor(score))
  end)
  if not success then
    warn("[Leaderboard] Update failed: " .. tostring(err))
  end
end

-- Get top N players:
local function getTopPlayers(count: number): {{rank: number, userId: number, score: number}}
  local results = {}
  local success, pages = pcall(function()
    return LeaderboardStore:GetSortedAsync(false, count)  -- false = descending (highest first)
  end)
  if not success then return results end

  local pageItems = pages:GetCurrentPage()
  for rank, entry in ipairs(pageItems) do
    table.insert(results, {
      rank = rank,
      userId = tonumber(entry.key),
      score = entry.value,
    })
  end
  return results
end

-- Get player's rank:
local function getPlayerRank(userId: number): number?
  -- Note: GetRankAsync doesn't exist on DataStore — use GetSortedAsync with large page
  -- Alternative: use a secondary sorted store that tracks ranks or use MemoryStore for live rankings
  return nil  -- implement with MemoryStoreService for real-time rank
end

--- MEMORYSTORESERVICE — LIVE RANKINGS & SHORT-LIVED DATA ---
-- MemoryStore: fast, temporary (not persistent across server restarts)
-- Use for: real-time leaderboards, matchmaking queues, rate limit counters

local MemoryStoreService = game:GetService("MemoryStoreService")
local liveRankings = MemoryStoreService:GetSortedMap("LiveEloRankings")

-- Update live rank (expires after 1 hour):
local function updateLiveRank(userId: number, elo: number)
  local success, err = pcall(function()
    liveRankings:SetAsync(tostring(userId), elo, 3600)  -- 3600 second TTL
  end)
  if not success then
    warn("[MemoryStore] Live rank update failed: " .. tostring(err))
  end
end

-- Get top 10 live:
local function getLiveTopTen(): {{key: string, value: number}}
  local success, results = pcall(function()
    return liveRankings:GetRangeAsync(Enum.SortDirection.Descending, 10)
  end)
  if success then return results end
  return {}
end

-- MemoryStore Queue for matchmaking:
local matchQueue = MemoryStoreService:GetQueue("MatchmakingQueue_1v1")

local function enqueuePlayer(userId: number, elo: number)
  local priority = -elo  -- negative so higher elo = higher priority in max-heap
  local ttl = 300  -- 5 minute TTL
  local success, err = pcall(function()
    matchQueue:AddAsync({userId = userId, elo = elo, time = os.time()}, ttl, priority)
  end)
  if not success then
    warn("[Queue] Enqueue failed: " .. tostring(err))
  end
end

local function dequeueForMatch(count: number): {{userId: number, elo: number, time: number}}
  local success, items, id = pcall(function()
    return matchQueue:ReadAsync(count, false, 30)  -- 30 second visibility timeout
  end)
  if not success or not items then return {} end

  -- Process match with items
  -- Commit removal after match confirmed:
  -- matchQueue:RemoveAsync(id)
  return items, id
end
`;

// ============================================================
// MAIN COMBINED BIBLE
// ============================================================
export const MULTIPLAYER_BIBLE: string = `
=================================================================
FORJEGAMES MULTIPLAYER SYSTEMS BIBLE — COMPLETE REFERENCE
=================================================================
All APIs verified against Roblox documentation (2024).
NEVER use SmoothPlastic. Dimensions in studs. Colors as RGB.
=================================================================

${MP_NETWORKING}

${MP_ANTI_CHEAT}

${MP_SOCIAL}

${MP_MATCHMAKING}

${MP_INSTANCES}

${MP_DATA_PERSISTENCE}

=================================================================
QUICK REFERENCE — COMMON PATTERNS
=================================================================

--- REMOTE DESIGN CHECKLIST ---
[ ] RemoteEvent placed in ReplicatedStorage/Remotes/ folder
[ ] Server handler validates player.Character exists
[ ] Server handler validates all argument types (sanitizeString, sanitizeNumber)
[ ] Server handler checks rate limit (max fires per second per player)
[ ] Server handler verifies player is in valid state for action
[ ] Server computes all authoritative values (damage, rewards, positions)
[ ] Client only sends intent, never computed values
[ ] All currency changes go through UpdateAsync (not SetAsync)

--- ANTI-CHEAT CHECKLIST ---
[ ] Speed checked server-side every second (position delta / elapsed)
[ ] All remote arguments sanitized before use
[ ] Currency never modified by client request with amount
[ ] Damage calculated server-side from weapon table, not client input
[ ] Rate limiter on every player-facing RemoteEvent
[ ] Session lock acquired before loading player data
[ ] Session lock released after saving on player leave
[ ] BindToClose saves all players within 25-second window

--- DATASTORE CHECKLIST ---
[ ] GetAsync wrapped in pcall with retry (exponential backoff)
[ ] UpdateAsync used for any concurrent-safe modification
[ ] Session lock prevents dual-server data corruption
[ ] New fields have defaults (merge with DEFAULT_DATA table)
[ ] Coins/gems floored at 0 before save
[ ] BindToClose implemented for emergency save on server shutdown
[ ] Auto-save runs every 3 minutes during session

--- MATCHMAKING CHECKLIST ---
[ ] ELO starts at 1000 for new players
[ ] K-factor: 32 (<30 games), 16 (established), 8 (top players)
[ ] Queue expands ELO range by 10/second of wait time
[ ] Teams balanced by snake draft algorithm
[ ] TeleportAsync wrapped in pcall with retry handler
[ ] TeleportInitFailed connected for error recovery
[ ] Match data passed via TeleportOptions:SetTeleportData()
[ ] Destination server reads data via player:GetJoinData().TeleportData

--- SOCIAL SYSTEMS CHECKLIST ---
[ ] Party limited to maxSize (4-8 players typical)
[ ] Party disbanded when last member leaves
[ ] Trade confirmed by BOTH players before any item movement
[ ] Trade items verified in inventory before atomic swap
[ ] Both player data saved immediately after trade
[ ] Guild data cached server-side, saved to DataStore on changes
[ ] TextChatService used (not legacy Chat service)
[ ] Guild/party channels created as TextChannel instances

--- MESSAGINGSERVICE CHECKLIST ---
[ ] Max 5 subscriptions per server (combine topics if needed)
[ ] Published data is JSON-serializable (no Instances, no Vector3 directly)
[ ] Serialize Vector3 as {x, y, z} table if needed
[ ] Handlers wrapped in pcall to prevent topic subscription death
[ ] Server browser publishes heartbeat every 30 seconds
[ ] Stale servers pruned after 90 seconds no heartbeat
[ ] game:BindToClose publishes server removal message

--- STREAMINGNETABLED CHECKLIST ---
[ ] Critical models: ModelStreamingMode = Persistent
[ ] NPCs/enemies: ModelStreamingMode = Atomic
[ ] RequestStreamAroundAsync called before teleporting player
[ ] StreamingMinRadius set to appropriate value (64-128 studs typical)
[ ] StreamingTargetRadius set (256-512 studs for large maps)

=================================================================
END OF MULTIPLAYER BIBLE
=================================================================
`;
