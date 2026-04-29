// CRAWLED: Apr 29 2026 — DevForum achievements, daily rewards, leaderboards, ragdoll, CollectionService, Parallel Luau, StreamingEnabled
// Sources: devforum.roblox.com/t/1735737, /t/2652356, /t/668984, /t/405062, /t/3453740, create.roblox.com/docs/scripting/luau/parallel-luau

export const PROGRESSION_SOCIAL_SYSTEMS = `
=== PROGRESSION & SOCIAL SYSTEMS FOR ROBLOX ===

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ACHIEVEMENT / BADGE SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ════════════════════════════════════
-- PATTERN: BadgeService + Custom Popup (ServerScript + LocalScript)
-- ════════════════════════════════════

-- SERVER (Script in ServerScriptService):
local BadgeService = game:GetService("BadgeService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local DataStoreService = game:GetService("DataStoreService")

-- Create RemoteEvent: ReplicatedStorage > BadgeAwarded (RemoteEvent)
local badgeAwardedEvent = ReplicatedStorage:WaitForChild("BadgeAwarded")

-- Define all achievements: id = Roblox badge id, or 0 for custom-only
local ACHIEVEMENTS = {
    FirstKill     = { badgeId = 123456789, name = "First Blood",    desc = "Get your first kill" },
    Wins10        = { badgeId = 987654321, name = "Win Streak",     desc = "Win 10 rounds" },
    PlayTime1Hour = { badgeId = 0,         name = "Dedicated",      desc = "Play for 1 hour" }, -- custom only
}

-- Award a badge to a player (server-side, safe)
local function awardBadge(player, achievementKey)
    local achievement = ACHIEVEMENTS[achievementKey]
    if not achievement then return end

    -- Award real Roblox badge if id > 0
    if achievement.badgeId > 0 then
        local success, alreadyHas = pcall(function()
            return BadgeService:UserHasBadgeAsync(player.UserId, achievement.badgeId)
        end)
        if success and not alreadyHas then
            local awarded, err = pcall(function()
                BadgeService:AwardBadge(player.UserId, achievement.badgeId)
            end)
            if not awarded then warn("Badge award failed:", err) end
        end
    end

    -- Always fire client for custom popup (even if Roblox badge already owned)
    badgeAwardedEvent:FireClient(player, {
        name = achievement.name,
        desc = achievement.desc,
        key  = achievementKey,
    })
end

-- Example: award on kill
local function onPlayerKill(killer, victim)
    -- Check stats (implement your own stat tracking)
    local kills = killer:FindFirstChild("leaderstats") and killer.leaderstats:FindFirstChild("Kills")
    if kills and kills.Value == 1 then
        awardBadge(killer, "FirstKill")
    end
end

-- Example: Check badge on join (unlock rewards if player already has badge)
Players.PlayerAdded:Connect(function(player)
    task.wait(3) -- give server time to settle
    for key, data in pairs(ACHIEVEMENTS) do
        if data.badgeId > 0 then
            local ok, has = pcall(BadgeService.UserHasBadgeAsync, BadgeService, player.UserId, data.badgeId)
            if ok and has then
                print(player.Name .. " already has badge: " .. data.name)
            end
        end
    end
end)

-- CLIENT (LocalScript in StarterGui):
-- Disable default Roblox badge popup, show custom one instead
local StarterGui = game:GetService("StarterGui")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

StarterGui:SetCoreGuiEnabled(Enum.CoreGuiType.Backpack, true) -- keep others, disable badge popup via client
-- Note: cannot directly disable badge notifications via API; use custom notification only

local badgeAwardedEvent = ReplicatedStorage:WaitForChild("BadgeAwarded")
local notifGui = script.Parent:WaitForChild("AchievementNotif") -- ScreenGui with Frame

local function showAchievementPopup(data)
    local frame = notifGui:WaitForChild("Frame")
    frame:WaitForChild("Title").Text = "Achievement Unlocked!"
    frame:WaitForChild("Name").Text = data.name
    frame:WaitForChild("Desc").Text = data.desc
    frame.Visible = true
    frame.Position = UDim2.new(0.5, -150, 1.1, 0)

    -- Slide in
    local tweenIn = TweenService:Create(frame,
        TweenInfo.new(0.4, Enum.EasingStyle.Back, Enum.EasingDirection.Out),
        { Position = UDim2.new(0.5, -150, 0.7, 0) }
    )
    tweenIn:Play()
    tweenIn.Completed:Wait()

    task.wait(3)

    -- Slide out
    local tweenOut = TweenService:Create(frame,
        TweenInfo.new(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.In),
        { Position = UDim2.new(0.5, -150, 1.1, 0) }
    )
    tweenOut:Play()
    tweenOut.Completed:Wait()
    frame.Visible = false
end

badgeAwardedEvent.OnClientEvent:Connect(showAchievementPopup)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. DAILY REWARD / STREAK SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ════════════════════════════════════
-- PATTERN: Server-validated daily reward with 7-day streak (ServerScript)
-- ════════════════════════════════════
local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local DailyStore = DataStoreService:GetDataStore("DailyRewardDataV2")
local dailyEvent = ReplicatedStorage:WaitForChild("DailyRewardEvent") -- RemoteEvent

-- 7-day reward table (customize per day)
local REWARDS = {
    [1] = { coins = 50,  label = "50 Coins"         },
    [2] = { coins = 75,  label = "75 Coins"         },
    [3] = { coins = 100, label = "100 Coins"        },
    [4] = { coins = 100, label = "100 Coins + Spin" },
    [5] = { coins = 150, label = "150 Coins"        },
    [6] = { coins = 150, label = "150 Coins + Hat"  },
    [7] = { coins = 300, label = "MEGA: 300 Coins"  },
}

local function getPlayerData(player)
    local ok, data = pcall(function()
        return DailyStore:GetAsync(tostring(player.UserId))
    end)
    if ok and type(data) == "table" then return data end
    return { claimed = false, lastDayOfYear = 0, streak = 1 }
end

local function savePlayerData(player, data)
    pcall(function()
        DailyStore:SetAsync(tostring(player.UserId), data)
    end)
end

local function onPlayerAdded(player)
    local data = getPlayerData(player)

    -- Use day-of-year for comparison (os.date("%j"))
    local todayDOY = tonumber(os.date("%j"))
    local lastDOY  = tonumber(data.lastDayOfYear) or 0
    local daysSince = todayDOY - lastDOY

    -- Reset streak if > 1 day missed
    if daysSince > 1 then
        data.streak = 1
        data.claimed = false
    elseif daysSince == 1 then
        -- New day, can claim
        data.claimed = false
    end
    -- daysSince == 0 means same day, claimed stays as-is

    -- Clamp streak to reward table length
    data.streak = math.clamp(data.streak or 1, 1, #REWARDS)

    -- Auto-award on join if not yet claimed today
    if not data.claimed then
        local reward = REWARDS[data.streak]
        data.claimed = true
        data.lastDayOfYear = todayDOY

        -- Give reward (implement your own currency system)
        local leaderstats = player:FindFirstChild("leaderstats")
        if leaderstats and leaderstats:FindFirstChild("Coins") then
            leaderstats.Coins.Value += reward.coins
        end

        -- Tell client to show popup
        dailyEvent:FireClient(player, {
            day    = data.streak,
            label  = reward.label,
            streak = data.streak,
        })

        -- Advance streak for next day
        data.streak = (data.streak % #REWARDS) + 1
        savePlayerData(player, data)
    else
        -- Tell client reward already claimed
        dailyEvent:FireClient(player, { alreadyClaimed = true, streak = data.streak })
    end
end

Players.PlayerAdded:Connect(onPlayerAdded)
Players.PlayerRemoving:Connect(function(player)
    -- Save on leave (in case in-game changes happened)
    -- data is already saved on claim; just re-save to be safe
end)

game:BindToClose(function()
    -- Flush all pending saves on server shutdown
    for _, p in ipairs(Players:GetPlayers()) do
        local data = getPlayerData(p)
        savePlayerData(p, data)
    end
end)

-- CLIENT (LocalScript):
local dailyEvent = game:GetService("ReplicatedStorage"):WaitForChild("DailyRewardEvent")
dailyEvent.OnClientEvent:Connect(function(info)
    if info.alreadyClaimed then
        print("Already claimed today! Streak:", info.streak)
        return
    end
    -- Show popup: "Day " .. info.day .. " reward: " .. info.label
    print("DAILY REWARD! Day " .. info.day .. ": " .. info.label .. " | Streak: " .. info.streak)
    -- Tween in your GUI here
end)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. CUSTOM LEADERBOARD SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ════════════════════════════════════
-- PATTERN: Custom scrolling leaderboard beyond default leaderstats (Script + LocalScript)
-- ════════════════════════════════════

-- SERVER: Setup leaderstats and broadcast ranking
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local DataStoreService = game:GetService("DataStoreService")

local LeaderboardStore = DataStoreService:GetOrderedDataStore("GlobalKills")
local leaderboardEvent = ReplicatedStorage:WaitForChild("UpdateLeaderboard") -- RemoteEvent

-- Create basic leaderstats for in-game HUD (still needed for default scoreboard)
Players.PlayerAdded:Connect(function(player)
    local ls = Instance.new("Folder")
    ls.Name = "leaderstats"
    ls.Parent = player

    local kills = Instance.new("IntValue")
    kills.Name = "Kills"
    kills.Value = 0
    kills.Parent = ls

    local deaths = Instance.new("IntValue")
    deaths.Name = "Deaths"
    deaths.Value = 0
    deaths.Parent = ls

    local cash = Instance.new("IntValue")
    cash.Name = "Cash"
    cash.Value = 0
    cash.Parent = ls
end)

-- Save kill count to ordered DataStore on round end
local function savePlayerScore(player, score)
    local ok, err = pcall(function()
        LeaderboardStore:IncrementAsync(tostring(player.UserId), score)
    end)
    if not ok then warn("Leaderboard save failed:", err) end
end

-- Fetch top 10 and broadcast to all clients
local function updateGlobalLeaderboard()
    local ok, pages = pcall(function()
        return LeaderboardStore:GetSortedAsync(false, 10) -- descending, top 10
    end)
    if not ok then return end

    local topEntries = {}
    local data = pages:GetCurrentPage()
    for rank, entry in ipairs(data) do
        local userId = tonumber(entry.key)
        local score  = entry.value
        local name   = "[Unknown]"
        local ok2, n = pcall(function()
            return game:GetService("Players"):GetNameFromUserIdAsync(userId)
        end)
        if ok2 then name = n end
        table.insert(topEntries, { rank = rank, name = name, score = score, userId = userId })
    end

    leaderboardEvent:FireAllClients(topEntries)
end

-- Update leaderboard every 60 seconds
task.spawn(function()
    while true do
        updateGlobalLeaderboard()
        task.wait(60)
    end
end)

-- CLIENT: Render scrolling leaderboard UI
local leaderboardEvent = game:GetService("ReplicatedStorage"):WaitForChild("UpdateLeaderboard")
local Players = game:GetService("Players")
local localPlayer = Players.LocalPlayer

-- Assumes ScreenGui > ScrollingFrame > Template (Frame with Rank/Name/Score labels)
local scrollFrame = script.Parent:WaitForChild("LeaderboardFrame"):WaitForChild("ScrollingFrame")
local template    = scrollFrame:WaitForChild("EntryTemplate")
template.Visible  = false

leaderboardEvent.OnClientEvent:Connect(function(entries)
    -- Clear old entries (keep template)
    for _, child in ipairs(scrollFrame:GetChildren()) do
        if child:IsA("Frame") and child.Name ~= "EntryTemplate" then
            child:Destroy()
        end
    end

    for _, entry in ipairs(entries) do
        local row = template:Clone()
        row.Name = "Entry_" .. entry.rank
        row:WaitForChild("RankLabel").Text  = "#" .. entry.rank
        row:WaitForChild("NameLabel").Text  = entry.name
        row:WaitForChild("ScoreLabel").Text = tostring(entry.score)

        -- Highlight local player
        if entry.userId == localPlayer.UserId then
            row.BackgroundColor3 = Color3.fromRGB(212, 175, 55) -- gold
        end

        row.Visible = true
        row.Parent  = scrollFrame
    end

    -- Update scroll canvas size
    scrollFrame.CanvasSize = UDim2.new(0, 0, 0, #entries * 40 + 10)
end)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. RAGDOLL ON DEATH SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ════════════════════════════════════
-- PATTERN: Motor6D → BallSocketConstraint ragdoll (Script in ServerScriptService)
-- Works for both R6 and R15. Run SERVER-SIDE for replication.
-- ════════════════════════════════════
local Players = game:GetService("Players")

local function enableRagdoll(character)
    local humanoid = character:FindFirstChildOfClass("Humanoid")
    if not humanoid then return end

    -- CRITICAL: Prevent Roblox from auto-breaking joints on death
    humanoid.BreakJointsOnDeath = false

    humanoid.Died:Connect(function()
        -- Replace every Motor6D with a BallSocketConstraint
        for _, v in ipairs(character:GetDescendants()) do
            if v:IsA("Motor6D") then
                local att0 = Instance.new("Attachment")
                local att1 = Instance.new("Attachment")

                -- Preserve joint positions
                att0.CFrame = v.C0
                att1.CFrame = v.C1
                att0.Parent = v.Part0
                att1.Parent = v.Part1

                local bsc = Instance.new("BallSocketConstraint")
                bsc.Attachment0 = att0  -- NOTE: NOT Attatchment0 (common typo)
                bsc.Attachment1 = att1
                bsc.LimitsEnabled = true
                bsc.TwistLimitsEnabled = true
                bsc.UpperAngle = 45
                bsc.TwistUpperAngle = 45
                bsc.TwistLowerAngle = -45
                bsc.Parent = v.Part0

                v:Destroy() -- Remove the Motor6D
            end
        end

        -- Disable root part collisions so it doesn't bounce
        local hrp = character:FindFirstChild("HumanoidRootPart")
        if hrp then
            hrp.CanCollide = false
        end

        -- Optional: auto-cleanup after 8 seconds
        task.delay(8, function()
            if character and character.Parent then
                character:Destroy()
            end
        end)
    end)
end

-- Toggleable version (call enableRagdoll / disableRagdoll on demand)
local function disableRagdoll(character)
    -- Remove all BallSocketConstraints and Attachments added by ragdoll
    -- (only works if character hasn't died yet — for living ragdoll effect)
    for _, v in ipairs(character:GetDescendants()) do
        if v:IsA("BallSocketConstraint") then
            -- Remove associated attachments
            if v.Attachment0 then v.Attachment0:Destroy() end
            if v.Attachment1 then v.Attachment1:Destroy() end
            v:Destroy()
        end
    end
    -- Note: Motor6Ds need to be rebuilt (or respawn character)
end

Players.PlayerAdded:Connect(function(player)
    player.CharacterAdded:Connect(function(character)
        task.wait(0.1) -- Wait for character to fully load
        enableRagdoll(character)
    end)
end)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. COLLECTIONSERVICE / TAG-DRIVEN PATTERNS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ════════════════════════════════════
-- PATTERN: Tag-driven behavior — one script handles all tagged instances
-- ════════════════════════════════════
local CollectionService = game:GetService("CollectionService")

-- === CORE API REFERENCE ===
-- CollectionService:AddTag(instance, "TagName")      -- tag an instance
-- CollectionService:RemoveTag(instance, "TagName")   -- untag
-- CollectionService:HasTag(instance, "TagName")      -- boolean check
-- CollectionService:GetTags(instance)                -- {string} all tags on instance
-- CollectionService:GetTagged("TagName")             -- {Instance} all with this tag
-- CollectionService:GetInstanceAddedSignal("Tag")    -- fires when any instance gets tag
-- CollectionService:GetInstanceRemovedSignal("Tag")  -- fires when any instance loses tag

-- === KILL BRICK PATTERN ===
-- Tag parts "KillBrick" in Studio (use Tag Editor plugin), then:
local function setupKillBrick(part)
    part.Touched:Connect(function(hit)
        local hum = hit.Parent:FindFirstChildOfClass("Humanoid")
        if hum then hum.Health = 0 end
    end)
end

for _, part in ipairs(CollectionService:GetTagged("KillBrick")) do
    setupKillBrick(part)
end
CollectionService:GetInstanceAddedSignal("KillBrick"):Connect(setupKillBrick)

-- === INTERACTABLE DOOR PATTERN ===
local function setupDoor(doorModel)
    local openPart = doorModel:FindFirstChild("Trigger")
    if not openPart then return end

    local isOpen = false
    openPart.Touched:Connect(function(hit)
        if hit.Parent:FindFirstChild("Humanoid") and not isOpen then
            isOpen = true
            -- Tween door open
            local door = doorModel:FindFirstChild("DoorPart")
            if door then
                game:GetService("TweenService"):Create(door,
                    TweenInfo.new(0.5),
                    { CFrame = door.CFrame * CFrame.new(0, 8, 0) }
                ):Play()
            end
            task.delay(3, function()
                -- Auto-close
                if door then
                    game:GetService("TweenService"):Create(door,
                        TweenInfo.new(0.5),
                        { CFrame = door.CFrame * CFrame.new(0, -8, 0) }
                    ):Play()
                end
                isOpen = false
            end)
        end
    end)
end

for _, door in ipairs(CollectionService:GetTagged("AutoDoor")) do
    setupDoor(door)
end
CollectionService:GetInstanceAddedSignal("AutoDoor"):Connect(setupDoor)
CollectionService:GetInstanceRemovedSignal("AutoDoor"):Connect(function(door)
    -- Cleanup connections if needed
    print("Door removed:", door.Name)
end)

-- === CHECKPOINT PATTERN ===
local function setupCheckpoint(part)
    local checkpointId = part:GetAttribute("CheckpointId") or 0
    part.Touched:Connect(function(hit)
        local player = game:GetService("Players"):GetPlayerFromCharacter(hit.Parent)
        if player then
            local current = player:GetAttribute("Checkpoint") or 0
            if checkpointId > current then
                player:SetAttribute("Checkpoint", checkpointId)
                player:SetAttribute("CheckpointCFrame",
                    { part.CFrame:GetComponents() } -- serialize for DataStore
                )
            end
        end
    end)
end

for _, cp in ipairs(CollectionService:GetTagged("Checkpoint")) do
    setupCheckpoint(cp)
end
CollectionService:GetInstanceAddedSignal("Checkpoint"):Connect(setupCheckpoint)

-- NOTE: Tags set on the server replicate to clients automatically.
-- Tags set on the client are LOCAL ONLY (not visible to server).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. PARALLEL LUAU / ACTORS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- WHEN TO USE:
-- ✓ Pathfinding for many NPCs simultaneously
-- ✓ Procedural terrain/voxel generation
-- ✓ Raycasting validation for many players
-- ✓ Physics simulation prep work
-- ✗ DO NOT use for simple game logic (overhead not worth it)
-- ✗ DO NOT read/write Instance properties in parallel (must synchronize first)

-- SERVER: max 2 usable worker threads
-- CLIENT: up to 8 threads (device-dependent)

-- ════════════════════════════════════
-- PATTERN A: task.desynchronize / task.synchronize
-- ════════════════════════════════════
-- In a Script INSIDE an Actor:
local RunService = game:GetService("RunService")
local actor = script:GetActor()

-- Only run if inside an Actor
if not actor then return end

RunService.Heartbeat:ConnectParallel(function(dt)
    -- PARALLEL PHASE: heavy computation (no instance reads/writes)
    local result = 0
    for i = 1, 10000 do
        result += math.sqrt(i) * math.sin(i)
    end

    -- SERIAL PHASE: apply results to instances (must sync first)
    task.synchronize()
    workspace.ResultPart.Position = Vector3.new(result % 100, 5, 0)
end)

-- ════════════════════════════════════
-- PATTERN B: Actor Worker Pool (e.g., terrain gen, NPC AI)
-- ════════════════════════════════════
-- Main script (NOT inside an Actor initially):
local actor = script:GetActor()

if not actor then
    -- ORCHESTRATOR: Create worker pool of Actors
    local NUM_WORKERS = 8
    local workers = {}

    for i = 1, NUM_WORKERS do
        local workerActor = Instance.new("Actor")
        local workerScript = script:Clone() -- clone self into each actor
        workerScript.Parent = workerActor
        workerActor.Parent = script
        table.insert(workers, workerActor)
    end

    -- Distribute work across workers
    task.defer(function()
        local rand = Random.new()
        for x = -10, 10 do
            for z = -10, 10 do
                local worker = workers[rand:NextInteger(1, #workers)]
                worker:SendMessage("ProcessChunk", x, z)
            end
        end
    end)

    return -- Orchestrator done; workers handle the rest
end

-- WORKER: Handle messages in parallel
actor:BindToMessageParallel("ProcessChunk", function(x, z)
    -- PARALLEL: Do expensive work here
    local noiseVal = math.noise(x * 0.1, z * 0.1) * 20

    -- SERIAL: Write to instances
    task.synchronize()
    local part = Instance.new("Part")
    part.Size = Vector3.new(4, math.max(1, noiseVal), 4)
    part.Position = Vector3.new(x * 4, noiseVal / 2, z * 4)
    part.Anchored = true
    part.Parent = workspace.GeneratedTerrain
end)

-- ════════════════════════════════════
-- PATTERN C: Actor Messaging API
-- ════════════════════════════════════
-- SENDER (any Script):
local workerActor = workspace:FindFirstChild("WorkerActor")
workerActor:SendMessage("DoTask", "param1", 42, true)

-- RECEIVER (Script inside the Actor):
local actor = script:GetActor()
actor:BindToMessageParallel("DoTask", function(param1, param2, param3)
    -- Runs in parallel thread
    print("Working:", param1, param2, param3)
    task.synchronize()
    -- Now safe to modify instances
end)

-- ════════════════════════════════════
-- PATTERN D: SharedTable for cross-actor data
-- ════════════════════════════════════
-- SharedTable is a special table accessible from multiple Actors simultaneously
-- DO NOT use regular Lua tables across Actors (they copy on transfer)

local SharedTable = SharedTable -- global in Luau
local sharedData = SharedTable.new()
sharedData["score"] = 0

-- In Actor worker: atomic increment
SharedTable.increment(sharedData, "score", 1)
print("Score:", sharedData["score"])

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7. STREAMINGENABLED BEST PRACTICES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- WHAT IT DOES: Only loads parts near the player's camera.
-- Improves performance for large worlds. Parts outside range unload client-side.
-- Server always has all parts; clients only get nearby ones.

-- ENABLE IN STUDIO: Workspace.StreamingEnabled = true
-- Set StreamingMinRadius and StreamingTargetRadius in Workspace properties.

-- ════════════════════════════════════
-- GOTCHAS (common bugs):
-- ════════════════════════════════════
-- 1. WaitForChild() is REQUIRED on client — parts may not exist yet
-- 2. workspace:FindFirstChild() will return nil for unloaded parts
-- 3. LocalScripts must use :WaitForChild() or ModelStreamingMode
-- 4. NPCs/enemies set to non-Atomic streaming may vanish mid-interaction

-- ════════════════════════════════════
-- PATTERN: RequestStreamAroundAsync — force load area
-- ════════════════════════════════════
-- CLIENT (LocalScript):
local Players = game:GetService("Players")
local player = Players.LocalPlayer

-- Force stream area around a position before teleporting
local function safeTPtoPosition(targetCFrame)
    -- Request server to stream content near target
    local ok, err = pcall(function()
        player:RequestStreamAroundAsync(targetCFrame.Position, 5) -- 5 sec timeout
    end)
    if not ok then warn("StreamAround failed:", err) end

    -- Now teleport
    local char = player.Character
    if char and char:FindFirstChild("HumanoidRootPart") then
        char.HumanoidRootPart.CFrame = targetCFrame
    end
end

-- ════════════════════════════════════
-- PATTERN: ModelStreamingMode per model
-- ════════════════════════════════════
-- Set on each Model in Studio:
-- Atomic     — entire model loads or none (good for gameplay-critical objects)
-- Persistent — always loaded for all clients (good for spawn areas, important NPCs)
-- Disabled   — uses legacy per-part streaming
-- Default    — uses workspace default

-- For important game objects (spawn platforms, UI triggers, checkpoints):
-- Set ModelStreamingMode = Enum.ModelStreamingMode.Persistent

-- ════════════════════════════════════
-- PATTERN: Safe client-side instance access with streaming
-- ════════════════════════════════════
-- BAD (breaks with StreamingEnabled):
local part = workspace.SomePart -- may be nil

-- GOOD:
local part = workspace:WaitForChild("SomePart", 10)
if part then
    -- safe to use
else
    warn("SomePart did not stream in time")
end

-- For deeply nested:
local model = workspace:WaitForChild("BigBuilding", 10)
if model then
    local door = model:WaitForChild("Door", 5)
    if door then
        -- safe
    end
end
`;
