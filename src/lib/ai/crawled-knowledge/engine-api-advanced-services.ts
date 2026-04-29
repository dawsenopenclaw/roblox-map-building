// Crawled from Roblox Creator Docs — Apr 29 2026
// CollectionService, ContentProvider, TextChatService, TextChannel,
// TeleportService, BadgeService, MessagingService, MemoryStoreService
// Focus: PRACTICAL code patterns for real games

export const ENGINE_API_ADVANCED_SERVICES = `
=== COLLECTIONSERVICE — TAG-BASED GAME SYSTEMS ===

CollectionService lets you add/remove/query string tags on ANY Instance.
Use it instead of checking class names or storing references in tables.
Tags persist across server and replicate to clients.

KEY METHODS:
  CollectionService:AddTag(instance, tagName)      -- add a tag
  CollectionService:RemoveTag(instance, tagName)   -- remove a tag
  CollectionService:HasTag(instance, tagName)      -- boolean check
  CollectionService:GetTagged(tagName)             -- returns array of all tagged instances
  CollectionService:GetTags(instance)              -- returns array of tags on instance
  CollectionService:GetInstanceAddedSignal(tag)    -- fires when instance gets tag
  CollectionService:GetInstanceRemovedSignal(tag)  -- fires when instance loses tag

PATTERN 1 — Tagging enemies and iterating them:
\`\`\`lua
local CollectionService = game:GetService("CollectionService")

-- Tag all enemies at spawn
local function tagEnemy(model)
    CollectionService:AddTag(model, "Enemy")
    CollectionService:AddTag(model, "Damageable")
end

-- Get all enemies (server or client)
local function getAllEnemies()
    return CollectionService:GetTagged("Enemy")
end

-- React when a new enemy is tagged (great for UI/highlighting)
CollectionService:GetInstanceAddedSignal("Enemy"):Connect(function(instance)
    print("New enemy spawned:", instance.Name)
    -- add highlight, register in tracker, etc.
end)

CollectionService:GetInstanceRemovedSignal("Enemy"):Connect(function(instance)
    print("Enemy removed:", instance.Name)
end)
\`\`\`

PATTERN 2 — Interactable objects system (doors, chests, buttons):
\`\`\`lua
local CollectionService = game:GetService("CollectionService")
local Players = game:GetService("Players")

-- Studio: tag any Part as "Interactable" via Tag Editor plugin
-- Then this script auto-wires them all up:

local INTERACT_DISTANCE = 10

local function setupInteractable(part)
    -- Each interactable gets a ProximityPrompt automatically
    local prompt = Instance.new("ProximityPrompt")
    prompt.ActionText = part:GetAttribute("ActionText") or "Interact"
    prompt.MaxActivationDistance = INTERACT_DISTANCE
    prompt.Parent = part

    prompt.Triggered:Connect(function(player)
        local action = part:GetAttribute("InteractAction")
        if action == "OpenDoor" then
            -- toggle door
            part.Parent.PrimaryPart.CFrame = part.Parent.PrimaryPart.CFrame * CFrame.new(0, 0, -5)
        elseif action == "GiveItem" then
            -- give item to player
            print("Giving item to", player.Name)
        end
    end)
end

-- Wire up all existing interactables
for _, part in ipairs(CollectionService:GetTagged("Interactable")) do
    setupInteractable(part)
end

-- Wire up future ones
CollectionService:GetInstanceAddedSignal("Interactable"):Connect(setupInteractable)
\`\`\`

PATTERN 3 — Damage zones (lava, water, void):
\`\`\`lua
local CollectionService = game:GetService("CollectionService")
local Players = game:GetService("Players")

local function setupDamageZone(part)
    local damage = part:GetAttribute("DamagePerSecond") or 20
    local touchingPlayers = {}

    part.Touched:Connect(function(hit)
        local character = hit.Parent
        local player = Players:GetPlayerFromCharacter(character)
        if player and not touchingPlayers[player] then
            touchingPlayers[player] = true
            task.spawn(function()
                while touchingPlayers[player] do
                    local humanoid = character:FindFirstChildOfClass("Humanoid")
                    if humanoid then
                        humanoid:TakeDamage(damage / 10)
                    end
                    task.wait(0.1)
                end
            end)
        end
    end)

    part.TouchEnded:Connect(function(hit)
        local player = Players:GetPlayerFromCharacter(hit.Parent)
        if player then
            touchingPlayers[player] = nil
        end
    end)
end

for _, zone in ipairs(CollectionService:GetTagged("DamageZone")) do
    setupDamageZone(zone)
end
CollectionService:GetInstanceAddedSignal("DamageZone"):Connect(setupDamageZone)
\`\`\`

PATTERN 4 — Checkpoint system:
\`\`\`lua
local CollectionService = game:GetService("CollectionService")
local Players = game:GetService("Players")

local playerCheckpoints = {}

local function setupCheckpoint(part)
    local checkpointIndex = part:GetAttribute("CheckpointIndex") or 0
    part.Touched:Connect(function(hit)
        local player = Players:GetPlayerFromCharacter(hit.Parent)
        if player then
            local current = playerCheckpoints[player.UserId] or -1
            if checkpointIndex > current then
                playerCheckpoints[player.UserId] = checkpointIndex
                player.RespawnLocation = part
                -- Optional: give checkpoint reward
                print(player.Name, "reached checkpoint", checkpointIndex)
            end
        end
    end)
end

for _, cp in ipairs(CollectionService:GetTagged("Checkpoint")) do
    setupCheckpoint(cp)
end
CollectionService:GetInstanceAddedSignal("Checkpoint"):Connect(setupCheckpoint)
\`\`\`

=== CONTENTPROVIDER — PRELOAD SCREENS ===

ContentProvider preloads assets before the game starts. Use it to avoid
pop-in textures, audio delays, and missing decals.

KEY METHODS:
  ContentProvider:PreloadAsync(instances, callback)
    -- instances: array of Instances or asset IDs
    -- callback(assetId, status) called per asset: "Success" | "Failure" | "AssetFetchFailed"
    -- YIELDS the current thread until all done

PATTERN — Loading screen with progress bar:
\`\`\`lua
-- LocalScript in StarterGui
local ContentProvider = game:GetService("ContentProvider")
local Players = game:GetService("Players")

-- Collect all assets to preload
local assetsToLoad = {}

-- Add all descendants of workspace and ReplicatedStorage
for _, instance in ipairs(game.Workspace:GetDescendants()) do
    table.insert(assetsToLoad, instance)
end
for _, instance in ipairs(game.ReplicatedStorage:GetDescendants()) do
    table.insert(assetsToLoad, instance)
end

local total = #assetsToLoad
local loaded = 0

-- Loading screen UI
local screenGui = Instance.new("ScreenGui")
screenGui.ResetOnSpawn = false
screenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
screenGui.Parent = Players.LocalPlayer.PlayerGui

local frame = Instance.new("Frame")
frame.Size = UDim2.fromScale(1, 1)
frame.BackgroundColor3 = Color3.fromRGB(10, 10, 10)
frame.Parent = screenGui

local bar = Instance.new("Frame")
bar.Size = UDim2.new(0, 0, 0, 20)
bar.Position = UDim2.fromScale(0.1, 0.5)
bar.BackgroundColor3 = Color3.fromRGB(212, 175, 55) -- ForjeGames gold
bar.Parent = frame

local label = Instance.new("TextLabel")
label.Size = UDim2.fromScale(1, 0.1)
label.Position = UDim2.fromScale(0, 0.4)
label.BackgroundTransparency = 1
label.TextColor3 = Color3.fromRGB(255, 255, 255)
label.Text = "Loading..."
label.Font = Enum.Font.GothamBold
label.TextScaled = true
label.Parent = frame

-- Preload with progress
ContentProvider:PreloadAsync(assetsToLoad, function(assetId, status)
    loaded = loaded + 1
    local progress = loaded / total
    bar.Size = UDim2.new(0.8 * progress, 0, 0, 20)
    label.Text = string.format("Loading... %d%%", math.floor(progress * 100))
end)

-- All done — remove loading screen
screenGui:Destroy()
\`\`\`

PATTERN — Preload specific asset IDs:
\`\`\`lua
local ContentProvider = game:GetService("ContentProvider")

local soundIds = {
    "rbxassetid://1234567890",
    "rbxassetid://0987654321",
}

-- Create Sound instances to preload audio
local sounds = {}
for _, id in ipairs(soundIds) do
    local s = Instance.new("Sound")
    s.SoundId = id
    table.insert(sounds, s)
end

ContentProvider:PreloadAsync(sounds)
print("All sounds preloaded!")
\`\`\`

=== TEXTCHATSERVICE — MODERN CHAT SYSTEM (2023+) ===

TextChatService is the new chat system. Replaces legacy chat.
Set TextChatService.ChatVersion = Enum.ChatVersion.TextChatService to enable.

KEY OBJECTS:
  TextChatService          -- the service
  TextChannel              -- a channel (e.g. "RBXGeneral", "RBXSystem", custom)
  TextChatMessage          -- a single message
  TextSource               -- represents a player in a channel

KEY PROPERTIES:
  TextChatService.ChatVersion           -- Enum.ChatVersion.TextChatService
  TextChatService.CreateDefaultTextChannels  -- bool, auto-create RBXGeneral etc.
  TextChatService.CreateDefaultCommands      -- bool, auto-create /me, /mute etc.

KEY EVENTS/CALLBACKS:
  TextChatService.OnIncomingMessage      -- callback, return TextChatMessageProperties to style
  TextChatService.MessageReceived        -- fired after message delivered
  TextChannel:SendAsync(text)           -- send a message (LocalScript)
  TextChannel.MessageReceived           -- fired when channel gets message

PATTERN 1 — Chat commands (slash commands):
\`\`\`lua
-- Script in ServerScriptService
local TextChatService = game:GetService("TextChatService")
local Players = game:GetService("Players")

-- Create a custom command
local giveCommand = Instance.new("TextChatCommand")
giveCommand.Name = "GiveCoinsCommand"
giveCommand.PrimaryAlias = "/give"
giveCommand.SecondaryAlias = "/coins"
giveCommand.Parent = TextChatService

giveCommand.Triggered:Connect(function(originTextSource, unfilteredText)
    -- Parse args: "/give 100"
    local args = unfilteredText:split(" ")
    local amount = tonumber(args[2]) or 0

    local player = Players:GetPlayerByUserId(originTextSource.UserId)
    if player then
        -- Give coins logic
        local leaderstats = player:FindFirstChild("leaderstats")
        if leaderstats and leaderstats:FindFirstChild("Coins") then
            leaderstats.Coins.Value = leaderstats.Coins.Value + amount
        end
    end
end)
\`\`\`

PATTERN 2 — Custom styled messages (colored text, prefixes):
\`\`\`lua
-- LocalScript in StarterPlayerScripts
local TextChatService = game:GetService("TextChatService")
local Players = game:GetService("Players")

TextChatService.OnIncomingMessage = function(message)
    local properties = Instance.new("TextChatMessageProperties")

    -- Style admin messages in gold
    if message.TextSource then
        local player = Players:GetPlayerByUserId(message.TextSource.UserId)
        if player then
            -- Check if admin
            local isAdmin = player:GetAttribute("IsAdmin")
            if isAdmin then
                properties.PrefixText = '<font color="#D4AF37">[ADMIN]</font> ' .. message.PrefixText
            end

            -- VIP prefix
            local isVIP = player.MembershipType == Enum.MembershipType.Premium
            if isVIP then
                properties.PrefixText = '<font color="#C0C0C0">[VIP]</font> ' .. (properties.PrefixText or message.PrefixText)
            end
        end
    end

    return properties
end
\`\`\`

PATTERN 3 — System announcements to all players:
\`\`\`lua
-- Script in ServerScriptService
local TextChatService = game:GetService("TextChatService")

local function announce(text)
    -- Get or create system channel
    local channel = TextChatService:FindFirstChild("RBXSystem", true)
        or TextChatService.TextChannels:FindFirstChild("RBXSystem")

    if channel then
        channel:DisplaySystemMessage('<font color="#FFD700">[SYSTEM] ' .. text .. '</font>')
    end
end

-- Usage
announce("Double XP event starts in 5 minutes!")

-- Countdown
task.spawn(function()
    for i = 5, 1, -1 do
        task.wait(60)
        announce(i .. " minutes until double XP!")
    end
    announce("DOUBLE XP IS NOW ACTIVE!")
end)
\`\`\`

PATTERN 4 — Kill feed / event announcements:
\`\`\`lua
-- Script in ServerScriptService
local TextChatService = game:GetService("TextChatService")

local killFeed = Instance.new("TextChannel")
killFeed.Name = "KillFeed"
killFeed.Parent = TextChatService.TextChannels

-- Add all players to the channel
local Players = game:GetService("Players")
Players.PlayerAdded:Connect(function(player)
    player.CharacterAdded:Connect(function()
        task.wait(1)
        killFeed:AddUserAsync(player.UserId)
    end)
end)

-- Broadcast a kill
local function broadcastKill(killer, victim)
    killFeed:DisplaySystemMessage(
        '<font color="#FF4444">' .. killer .. '</font> eliminated <font color="#888888">' .. victim .. '</font>'
    )
end
\`\`\`

=== TELEPORTSERVICE — PLACE TELEPORTATION ===

TeleportService moves players between places in the same universe,
or to a specific server (by JobId). Essential for hub worlds, minigames,
cross-server parties.

KEY METHODS:
  TeleportService:TeleportAsync(placeId, players, teleportOptions)
  TeleportService:TeleportToPrivateServer(placeId, serverCode, players, spawnName, teleportData, customLoadingScreen)
  TeleportService:ReserveServer(placeId) → (serverCode, privateServerId)  [yields]
  TeleportService:GetLocalPlayerTeleportData() → any  [client only, get data passed on teleport]
  TeleportService:SetTeleportGui(screenGui)  [client, custom loading screen]
  TeleportService.TeleportInitFailed event

TeleportOptions:
  local opts = Instance.new("TeleportOptions")
  opts.ShouldReserveServer = true     -- create a new private server
  opts:SetTeleportData({key = value}) -- pass data to destination place

PATTERN 1 — Teleport a player to another place:
\`\`\`lua
-- Script (server)
local TeleportService = game:GetService("TeleportService")
local Players = game:GetService("Players")

local MINIGAME_PLACE_ID = 123456789  -- replace with real place ID

local function teleportToMinigame(player)
    local success, err = pcall(function()
        TeleportService:TeleportAsync(MINIGAME_PLACE_ID, {player})
    end)
    if not success then
        warn("Teleport failed:", err)
    end
end
\`\`\`

PATTERN 2 — Party teleport (reserve server + teleport group):
\`\`\`lua
local TeleportService = game:GetService("TeleportService")

local GAME_PLACE_ID = 987654321

local function startPartyGame(players)
    -- Reserve a private server for this group
    local success, serverCode = pcall(function()
        return TeleportService:ReserveServer(GAME_PLACE_ID)
    end)

    if not success then
        warn("Could not reserve server:", serverCode)
        return
    end

    -- Teleport all party members together
    local opts = Instance.new("TeleportOptions")
    opts.ReservedServerAccessCode = serverCode
    opts:SetTeleportData({
        partyLeader = players[1].Name,
        gameMode = "Competitive",
    })

    local ok, err = pcall(function()
        TeleportService:TeleportAsync(GAME_PLACE_ID, players, opts)
    end)

    if not ok then
        warn("Party teleport failed:", err)
    end
end
\`\`\`

PATTERN 3 — Receive teleport data in destination place:
\`\`\`lua
-- LocalScript in StarterPlayerScripts (destination place)
local TeleportService = game:GetService("TeleportService")
local Players = game:GetService("Players")

local data = TeleportService:GetLocalPlayerTeleportData()
if data then
    print("Arrived with data:", data.partyLeader, data.gameMode)
    -- Apply gameMode settings, show party leader UI, etc.
end
\`\`\`

PATTERN 4 — Retry teleport on failure:
\`\`\`lua
local TeleportService = game:GetService("TeleportService")

local MAX_RETRIES = 3
local RETRY_DELAY = 2

local function safeTeleport(placeId, players, opts)
    for attempt = 1, MAX_RETRIES do
        local success, err = pcall(function()
            TeleportService:TeleportAsync(placeId, players, opts)
        end)
        if success then return end
        warn(string.format("Teleport attempt %d failed: %s", attempt, err))
        if attempt < MAX_RETRIES then
            task.wait(RETRY_DELAY)
        end
    end
    warn("All teleport attempts failed")
end
\`\`\`

=== BADGESERVICE — ACHIEVEMENTS ===

BadgeService awards and checks Roblox badges. Badges are created on
the Roblox website and identified by a numeric ID.

KEY METHODS:
  BadgeService:AwardBadge(userId, badgeId)         [server only, yields]
  BadgeService:UserHasBadgeAsync(userId, badgeId)  [server or client, yields]
  BadgeService:GetBadgeInfoAsync(badgeId)          [returns BadgeInfo, yields]

BadgeInfo properties: Name, Description, IconImageId, IsEnabled

PATTERN 1 — Award badge on achievement:
\`\`\`lua
-- Script in ServerScriptService
local BadgeService = game:GetService("BadgeService")
local Players = game:GetService("Players")

local FIRST_WIN_BADGE = 111111111
local SPEED_BADGE     = 222222222
local VETERAN_BADGE   = 333333333

local function tryAwardBadge(player, badgeId)
    -- Check not already earned (saves API calls)
    local alreadyHas = false
    local ok, result = pcall(function()
        alreadyHas = BadgeService:UserHasBadgeAsync(player.UserId, badgeId)
    end)

    if not ok then
        warn("Badge check failed:", result)
        return
    end

    if not alreadyHas then
        local awarded, err = pcall(function()
            BadgeService:AwardBadge(player.UserId, badgeId)
        end)
        if awarded then
            print("Awarded badge", badgeId, "to", player.Name)
        else
            warn("Award failed:", err)
        end
    end
end

-- Award on first win
local function onPlayerWin(player)
    tryAwardBadge(player, FIRST_WIN_BADGE)

    -- Check win count for veteran badge
    local wins = player.leaderstats and player.leaderstats.Wins
    if wins and wins.Value >= 100 then
        tryAwardBadge(player, VETERAN_BADGE)
    end
end
\`\`\`

PATTERN 2 — Badge-gated area (VIP room):
\`\`\`lua
local BadgeService = game:GetService("BadgeService")
local Players = game:GetService("Players")

local VIP_BADGE_ID = 444444444
local VIP_DOOR = workspace.VIPDoor  -- the blocking part

VIP_DOOR.Touched:Connect(function(hit)
    local player = Players:GetPlayerFromCharacter(hit.Parent)
    if not player then return end

    task.spawn(function()
        local hasBadge = false
        local ok = pcall(function()
            hasBadge = BadgeService:UserHasBadgeAsync(player.UserId, VIP_BADGE_ID)
        end)

        if ok and hasBadge then
            -- Temporarily disable collision
            VIP_DOOR.CanCollide = false
            task.wait(2)
            VIP_DOOR.CanCollide = true
        else
            -- Push player back
            local hrp = hit.Parent:FindFirstChild("HumanoidRootPart")
            if hrp then
                hrp.Velocity = hrp.CFrame.LookVector * -30 + Vector3.new(0, 15, 0)
            end
        end
    end)
end)
\`\`\`

=== MESSAGINGSERVICE — CROSS-SERVER COMMUNICATION ===

MessagingService sends messages between ALL servers running the same game.
Max message size: 1 KB. Max 150 messages/minute globally.
Required for: global leaderboards, cross-server events, announcements.

KEY METHODS:
  MessagingService:PublishAsync(topic, message)        [server only, yields]
  MessagingService:SubscribeAsync(topic, callback)     [server only, yields, returns connection]
    -- callback receives: {Data = any, Sent = number (unix timestamp)}

PATTERN 1 — Global kill announcements:
\`\`\`lua
-- Script in ServerScriptService
local MessagingService = game:GetService("MessagingService")

local TOPIC_KILL = "GlobalKill"

-- Subscribe to global kills (all servers listen)
local success, connection = pcall(function()
    return MessagingService:SubscribeAsync(TOPIC_KILL, function(msg)
        local data = msg.Data
        -- Broadcast to chat in this server
        print(string.format("[GLOBAL] %s eliminated %s in server %s",
            data.killer, data.victim, data.serverId))
    end)
end)

-- Publish a kill (this server sends to all servers)
local function broadcastKill(killerName, victimName)
    pcall(function()
        MessagingService:PublishAsync(TOPIC_KILL, {
            killer = killerName,
            victim = victimName,
            serverId = game.JobId,
            timestamp = os.time(),
        })
    end)
end
\`\`\`

PATTERN 2 — Cross-server admin shutdown:
\`\`\`lua
local MessagingService = game:GetService("MessagingService")

local TOPIC_ADMIN = "AdminBroadcast"

-- All servers listen for admin commands
pcall(function()
    MessagingService:SubscribeAsync(TOPIC_ADMIN, function(msg)
        local data = msg.Data
        if data.command == "shutdown" then
            -- Kick all players with a message
            for _, player in ipairs(game:GetService("Players"):GetPlayers()) do
                player:Kick("Server shutting down for maintenance. Back soon!")
            end
        elseif data.command == "announce" then
            -- Show announcement in chat
            print("[ADMIN BROADCAST]", data.message)
        end
    end)
end)

-- Send from admin panel
local function adminShutdownAll()
    pcall(function()
        MessagingService:PublishAsync(TOPIC_ADMIN, {command = "shutdown"})
    end)
end
\`\`\`

PATTERN 3 — Global event synchronization (boss raid across servers):
\`\`\`lua
local MessagingService = game:GetService("MessagingService")
local RunService = game:GetService("RunService")

local TOPIC_EVENT = "WorldEvent"
local eventActive = false

pcall(function()
    MessagingService:SubscribeAsync(TOPIC_EVENT, function(msg)
        local data = msg.Data
        if data.type == "BossSpawn" then
            eventActive = true
            -- Spawn boss in this server too
            print("Global boss event started by server:", data.originServer)
            spawnBoss(data.bossType)
        elseif data.type == "BossDefeated" then
            eventActive = false
            -- Give rewards to all players
            giveEventRewards()
        end
    end)
end)

local function triggerGlobalBoss(bossType)
    pcall(function()
        MessagingService:PublishAsync(TOPIC_EVENT, {
            type = "BossSpawn",
            bossType = bossType,
            originServer = game.JobId,
        })
    end)
end
\`\`\`

=== MEMORYSTORESERVICE — FAST SHARED CROSS-SERVER STORAGE ===

MemoryStoreService provides fast, temporary shared data between servers.
Use for: real-time leaderboards, matchmaking queues, active player counts.
Data expires (TTL in seconds). NOT persistent — use DataStoreService for that.

Types:
  MemoryStoreHashMap  — key/value store
  MemoryStoreSortedMap — sorted leaderboard-style store
  MemoryStoreQueue — FIFO queue (matchmaking)

KEY METHODS on MemoryStoreHashMap:
  :GetAsync(key) → value
  :SetAsync(key, value, expiration)
  :UpdateAsync(key, transformFunc, expiration)
  :RemoveAsync(key)

KEY METHODS on MemoryStoreSortedMap:
  :SetAsync(key, value, expiration) -- value = score (number)
  :GetAsync(key) → {key, value}
  :GetRangeAsync(direction, count, exclusiveLowerBound, exclusiveUpperBound)
  :UpdateAsync(key, transformFunc, expiration)
  :RemoveAsync(key)

PATTERN 1 — Real-time global leaderboard:
\`\`\`lua
-- Script in ServerScriptService
local MemoryStoreService = game:GetService("MemoryStoreService")
local Players = game:GetService("Players")

local leaderboard = MemoryStoreService:GetSortedMap("GlobalKillboard")
local EXPIRY = 3600  -- 1 hour

local function updateKills(player, kills)
    pcall(function()
        leaderboard:SetAsync(tostring(player.UserId), kills, EXPIRY)
    end)
end

local function getTopPlayers(count)
    local result = {}
    local ok, entries = pcall(function()
        return leaderboard:GetRangeAsync(Enum.SortDirection.Descending, count)
    end)
    if ok then
        for _, entry in ipairs(entries) do
            table.insert(result, {userId = entry.key, kills = entry.value})
        end
    end
    return result
end

-- Update every 30 seconds
task.spawn(function()
    while true do
        local top10 = getTopPlayers(10)
        -- Push to clients via RemoteEvent
        for _, data in ipairs(top10) do
            print(string.format("  #%d UserId:%s Kills:%d", _, data.userId, data.kills))
        end
        task.wait(30)
    end
end)
\`\`\`

PATTERN 2 — Matchmaking queue:
\`\`\`lua
local MemoryStoreService = game:GetService("MemoryStoreService")
local Players = game:GetService("Players")

local queue = MemoryStoreService:GetQueue("MatchmakingQueue")
local MATCH_SIZE = 4
local QUEUE_EXPIRY = 300  -- 5 minutes

local function joinQueue(player)
    pcall(function()
        queue:AddAsync({
            userId = player.UserId,
            name = player.Name,
            joinTime = os.time(),
            serverId = game.JobId,
        }, QUEUE_EXPIRY, 0)
    end)
    print(player.Name, "joined matchmaking queue")
end

local function tryFormMatch()
    while true do
        local ok, items = pcall(function()
            return queue:ReadAsync(MATCH_SIZE, false, 5)  -- read up to 4, wait 5s
        end)

        if ok and items and #items >= MATCH_SIZE then
            print("Match found! Players:", #items)
            -- Teleport them all to a reserved server
            local playerList = {}
            for _, item in ipairs(items) do
                local p = Players:GetPlayerByUserId(item.value.userId)
                if p then table.insert(playerList, p) end
            end
            -- TeleportService:TeleportAsync(GAME_PLACE_ID, playerList, opts)
        end

        task.wait(5)
    end
end

task.spawn(tryFormMatch)
\`\`\`

PATTERN 3 — Server activity tracker (active player count per server):
\`\`\`lua
local MemoryStoreService = game:GetService("MemoryStoreService")
local Players = game:GetService("Players")

local serverMap = MemoryStoreService:GetHashMap("ServerActivity")
local JOB_ID = game.JobId
local UPDATE_INTERVAL = 30
local EXPIRY = 120  -- 2 minutes (auto-cleans dead servers)

local function updateServerData()
    pcall(function()
        serverMap:SetAsync(JOB_ID, {
            playerCount = #Players:GetPlayers(),
            maxPlayers = Players.MaxPlayers,
            updatedAt = os.time(),
        }, EXPIRY)
    end)
end

-- Update on join/leave and on interval
Players.PlayerAdded:Connect(updateServerData)
Players.PlayerRemoving:Connect(updateServerData)

task.spawn(function()
    while true do
        updateServerData()
        task.wait(UPDATE_INTERVAL)
    end
end)
\`\`\`
`;
