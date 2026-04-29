// CRAWLED: Apr 29 2026 — DevForum round-based systems, wave spawners, respawn, lobby/teleport, teams
// Sources: devforum.roblox.com/t/487712, /t/1640544, /t/3194950, /t/1037152, /t/2796468

export const GAME_LOOP_PATTERNS = `
=== GAME LOOP PATTERNS FOR ROBLOX ===

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ROUND-BASED GAME LOOP (STATE MACHINE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ASCII STATE DIAGRAM:
  ┌─────────────────────────────────────────────────────┐
  │  WAITING (< min players)                            │
  │       ↓ enough players join                         │
  │  INTERMISSION (countdown, lobby spawn)              │
  │       ↓ timer ends                                  │
  │  PLAYING (assign teams, teleport, game timer)       │
  │       ↓ win condition OR timer expires              │
  │  ROUND END (announce winner, reward)                │
  │       ↓ short delay                                 │
  │  RESET (teleport back, delete map, re-loop)         │
  │       ↓                                             │
  └──────── INTERMISSION ◄──────────────────────────────┘

-- ════════════════════════════════════
-- PATTERN A: Simple Round Loop (ServerScript in ServerScriptService)
-- ════════════════════════════════════
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Teams = game:GetService("Teams")

local MIN_PLAYERS = 2
local INTERMISSION_TIME = 20
local ROUND_TIME = 180

local statusValue = ReplicatedStorage:WaitForChild("Status") -- StringValue

local function getAlivePlayers(team)
    local alive = {}
    for _, p in ipairs(team and team:GetPlayers() or Players:GetPlayers()) do
        if p.Character and p.Character:FindFirstChild("Humanoid")
            and p.Character.Humanoid.Health > 0 then
            table.insert(alive, p)
        end
    end
    return alive
end

local function teleportToSpawn(player, spawnPart)
    if player.Character and player.Character:FindFirstChild("HumanoidRootPart") then
        player.Character.HumanoidRootPart.CFrame = spawnPart.CFrame + Vector3.new(0, 3, 0)
    end
end

local function resetPlayer(player)
    player.Team = Teams["Lobby"]
    player:LoadCharacter()
end

local function sortTeams(players)
    -- Shuffle
    for i = #players, 2, -1 do
        local j = math.random(i)
        players[i], players[j] = players[j], players[i]
    end
    local half = math.floor(#players / 2)
    for i, p in ipairs(players) do
        p.Team = (i <= half) and Teams["TeamA"] or Teams["TeamB"]
    end
end

while true do
    -- WAITING phase
    statusValue.Value = "Waiting for players..."
    while #Players:GetPlayers() < MIN_PLAYERS do
        task.wait(1)
    end

    -- INTERMISSION phase
    for t = INTERMISSION_TIME, 0, -1 do
        statusValue.Value = "Intermission: " .. t
        task.wait(1)
    end

    -- PLAYING phase
    local activePlayers = Players:GetPlayers()
    sortTeams(activePlayers)
    -- Teleport each team to their spawn
    for _, p in ipairs(activePlayers) do
        local spawnName = (p.Team == Teams["TeamA"]) and "SpawnA" or "SpawnB"
        local spawn = workspace:FindFirstChild(spawnName)
        if spawn then teleportToSpawn(p, spawn) end
    end

    statusValue.Value = "Round in progress!"
    local roundWinner = nil
    local elapsed = 0

    -- Game loop with win detection
    while elapsed < ROUND_TIME do
        task.wait(1)
        elapsed += 1
        statusValue.Value = "Time left: " .. (ROUND_TIME - elapsed)

        local aliveA = getAlivePlayers(Teams["TeamA"])
        local aliveB = getAlivePlayers(Teams["TeamB"])
        if #aliveA == 0 then roundWinner = "TeamB" break end
        if #aliveB == 0 then roundWinner = "TeamA" break end
    end

    -- ROUND END phase
    if roundWinner then
        statusValue.Value = roundWinner .. " wins!"
    else
        statusValue.Value = "Time's up! Draw!"
    end
    task.wait(5)

    -- RESET phase
    for _, p in ipairs(Players:GetPlayers()) do
        resetPlayer(p)
    end
    task.wait(2)
end

-- ════════════════════════════════════
-- PATTERN B: Advanced Round System with Remote Events (ServerScript)
-- ════════════════════════════════════
local PlayersService = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local gameState = "Intermission" -- states: "Intermission" | "InGame"
local intermissionTime = 15
local gameTime = 120
local roundInProgress = false
local alivePlayers = {}

local roundStatusRemote = ReplicatedStorage:WaitForChild("RoundStatusRemote") -- RemoteEvent

local function checkPlayersAlive()
    for _, player in ipairs(alivePlayers) do
        if player and player.Character
            and player.Character:FindFirstChild("Humanoid")
            and player.Character.Humanoid.Health > 0 then
            return true
        end
    end
    return false
end

local function endRound()
    gameState = "Intermission"
    roundInProgress = false
    roundStatusRemote:FireAllClients("RoundEnded", nil)
    -- Respawn all players to lobby
    for _, p in ipairs(PlayersService:GetPlayers()) do
        p:LoadCharacter()
    end
end

local function startRound()
    gameState = "InGame"
    roundInProgress = true
    alivePlayers = {}

    for _, player in ipairs(PlayersService:GetPlayers()) do
        if player.Character and player.Character:FindFirstChild("Humanoid") then
            table.insert(alivePlayers, player)
            player.Character.Humanoid.Died:Once(function()
                -- Remove from alive list
                local idx = table.find(alivePlayers, player)
                if idx then table.remove(alivePlayers, idx) end
                if not checkPlayersAlive() then endRound() end
            end)
        end
    end

    roundStatusRemote:FireAllClients("GameStarted", gameTime)

    local startTime = os.clock()
    while os.clock() - startTime < gameTime and roundInProgress do
        task.wait(1)
    end
    if roundInProgress then endRound() end
end

PlayersService.PlayerRemoving:Connect(function(player)
    if roundInProgress then
        local idx = table.find(alivePlayers, player)
        if idx then table.remove(alivePlayers, idx) end
        if #alivePlayers == 0 then endRound() end
    end
end)

-- Main loop
while true do
    roundStatusRemote:FireAllClients("Intermission", intermissionTime)
    task.wait(intermissionTime)
    if #PlayersService:GetPlayers() >= MIN_PLAYERS then
        startRound()
    end
end

-- ════════════════════════════════════
-- CLIENT: Status Display (LocalScript in StarterGui)
-- ════════════════════════════════════
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local roundStatusRemote = ReplicatedStorage:WaitForChild("RoundStatusRemote")
local statusLabel = script.Parent:WaitForChild("StatusLabel") -- TextLabel

roundStatusRemote.OnClientEvent:Connect(function(state, timeLeft)
    if state == "Intermission" then
        statusLabel.Text = "Intermission: " .. tostring(timeLeft) .. "s"
    elseif state == "GameStarted" then
        statusLabel.Text = "GAME STARTED! Time: " .. tostring(timeLeft) .. "s"
    elseif state == "RoundEnded" then
        statusLabel.Text = "Round Over!"
    end
end)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. WAVE SPAWNER SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ASCII WAVE FLOW:
  Wave 1 → spawn N enemies → wait all dead → Wave 2 → ...
  Boss wave every 5 rounds. Difficulty × 1.15 per wave.

-- ════════════════════════════════════
-- PATTERN: Wave Spawner Module (ModuleScript in ServerScriptService)
-- ════════════════════════════════════
local WaveSpawner = {}

-- Wave config table — edit to add more types/bosses
local ENEMY_TEMPLATES = {
    Basic  = { model = "ZombieBasic",  health = 100, speed = 10, reward = 5  },
    Fast   = { model = "ZombieFast",   health = 50,  speed = 20, reward = 8  },
    Tank   = { model = "ZombieTank",   health = 400, speed = 5,  reward = 20 },
    Boss   = { model = "ZombieBoss",   health = 2000, speed = 8, reward = 100 },
}

-- Wave definitions: each entry = {type, count}
-- Auto-generated but can be overridden per-wave
local function getWaveConfig(waveNum)
    local isBossWave = waveNum % 5 == 0
    if isBossWave then
        return { { type = "Boss", count = 1 }, { type = "Tank", count = waveNum // 2 } }
    end
    local base = 5 + (waveNum * 3)
    local config = { { type = "Basic", count = math.ceil(base * 0.6) } }
    if waveNum >= 3 then
        table.insert(config, { type = "Fast", count = math.ceil(base * 0.3) })
    end
    if waveNum >= 6 then
        table.insert(config, { type = "Tank", count = math.ceil(base * 0.1) })
    end
    return config
end

local activeEnemies = {}

local function spawnEnemy(enemyType, spawnPart)
    local template = ENEMY_TEMPLATES[enemyType]
    if not template then return end

    local model = game:GetService("ReplicatedStorage"):FindFirstChild(template.model)
    if not model then warn("Enemy model not found:", template.model) return end

    local clone = model:Clone()
    clone.Parent = workspace.EnemiesFolder

    -- Position at spawn with random offset
    local offset = Vector3.new(math.random(-5,5), 0, math.random(-5,5))
    clone:PivotTo(spawnPart.CFrame + offset)

    -- Scale health
    local hum = clone:FindFirstChildOfClass("Humanoid")
    if hum then
        hum.MaxHealth = template.health
        hum.Health = template.health
        hum.WalkSpeed = template.speed
    end

    -- Track enemy
    table.insert(activeEnemies, clone)
    clone.AncestryChanged:Connect(function()
        if not clone.Parent then
            local idx = table.find(activeEnemies, clone)
            if idx then table.remove(activeEnemies, idx) end
        end
    end)

    return clone
end

function WaveSpawner.RunWave(waveNum, spawnParts, onWaveComplete)
    local config = getWaveConfig(waveNum)
    activeEnemies = {}

    print("[WaveSpawner] Starting Wave", waveNum)

    -- Spawn all enemies with stagger
    for _, entry in ipairs(config) do
        for i = 1, entry.count do
            local spawnPart = spawnParts[math.random(#spawnParts)]
            spawnEnemy(entry.type, spawnPart)
            task.wait(0.5) -- stagger spawns
        end
    end

    -- Wait until all enemies dead
    while #activeEnemies > 0 do
        -- Prune any nil entries
        for i = #activeEnemies, 1, -1 do
            if not activeEnemies[i] or not activeEnemies[i].Parent then
                table.remove(activeEnemies, i)
            end
        end
        task.wait(1)
    end

    print("[WaveSpawner] Wave", waveNum, "complete!")
    if onWaveComplete then onWaveComplete(waveNum) end
end

function WaveSpawner.RunAllWaves(totalWaves, spawnParts, onAllComplete)
    for w = 1, totalWaves do
        WaveSpawner.RunWave(w, spawnParts, function(waveNum)
            -- Fire RemoteEvent to tell clients wave ended
            game:GetService("ReplicatedStorage").WaveComplete:FireAllClients(waveNum, totalWaves)
        end)
        -- Rest between waves
        task.wait(5)
    end
    if onAllComplete then onAllComplete() end
end

return WaveSpawner

-- ════════════════════════════════════
-- USAGE (ServerScript):
-- ════════════════════════════════════
local WaveSpawner = require(game.ServerScriptService.WaveSpawner)
local spawnParts = workspace.EnemySpawns:GetChildren()
WaveSpawner.RunAllWaves(10, spawnParts, function()
    print("All waves complete! Game won!")
end)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. CUSTOM RESPAWN SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ════════════════════════════════════
-- PATTERN: Respawn Handler (Script in ServerScriptService)
-- ════════════════════════════════════
local Players = game:GetService("Players")
local Teams = game:GetService("Teams")

local RESPAWN_DELAY = 5      -- seconds before respawn
local SPECTATE_ON_DEATH = true

-- Finds the best spawn for a player based on their team
local function getSpawnForPlayer(player)
    local spawnFolder = workspace:FindFirstChild("Spawns")
    if not spawnFolder then return nil end

    local teamName = player.Team and player.Team.Name or "Lobby"
    local teamSpawns = spawnFolder:FindFirstChild(teamName)
    if teamSpawns then
        local spawns = teamSpawns:GetChildren()
        if #spawns > 0 then
            return spawns[math.random(#spawns)]
        end
    end
    -- Fallback: any SpawnLocation
    local allSpawns = workspace:GetDescendants()
    local valid = {}
    for _, v in ipairs(allSpawns) do
        if v:IsA("SpawnLocation") and v.TeamColor == (player.Team and player.Team.TeamColor or BrickColor.new("Medium stone grey")) then
            table.insert(valid, v)
        end
    end
    return valid[math.random(math.max(1, #valid))]
end

local function teleportToSpawn(character, spawnPart)
    local hrp = character:FindFirstChild("HumanoidRootPart")
    if hrp and spawnPart then
        hrp.CFrame = spawnPart.CFrame + Vector3.new(0, 3, 0)
    end
end

local function startSpectating(player)
    -- Tell client to enter spectator cam mode
    local remotes = game:GetService("ReplicatedStorage"):FindFirstChild("Remotes")
    if remotes and remotes:FindFirstChild("StartSpectate") then
        remotes.StartSpectate:FireClient(player)
    end
end

local function handleRespawn(player)
    task.wait(RESPAWN_DELAY)
    if not player or not player.Parent then return end

    -- During active round: check if player should respawn or spectate
    -- (this logic is game-specific; customize roundInProgress check)
    player:LoadCharacter()
    task.wait(0.1) -- wait for character to load

    local char = player.Character
    if char then
        local spawn = getSpawnForPlayer(player)
        if spawn then
            teleportToSpawn(char, spawn)
        end
    end
end

Players.PlayerAdded:Connect(function(player)
    player.CharacterAdded:Connect(function(character)
        local hum = character:WaitForChild("Humanoid")
        hum.Died:Connect(function()
            if SPECTATE_ON_DEATH then
                startSpectating(player)
            end
            handleRespawn(player)
        end)
    end)
end)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. LOBBY / TELEPORT SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ASCII LOBBY FLOW:
  Players join → spawn in Lobby → countdown starts at MIN_PLAYERS
  → threshold met? Keep counting → timer hits 0 → teleport all
  → new round → return to lobby after

-- ════════════════════════════════════
-- PATTERN: Lobby Manager (Script in ServerScriptService)
-- ════════════════════════════════════
local Players = game:GetService("Players")
local TeleportService = game:GetService("TeleportService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local LOBBY_PLACE_ID = 0        -- Set to your lobby PlaceId if separate game
local GAME_PLACE_ID = 0         -- Set to your game PlaceId if separate game
local MIN_PLAYERS = 4
local MAX_PLAYERS = 10
local COUNTDOWN_TIME = 30       -- seconds after MIN_PLAYERS reached

local countdownActive = false
local countdownTimer = COUNTDOWN_TIME
local lobbyStatus = ReplicatedStorage:WaitForChild("LobbyStatus") -- StringValue

local function updateStatus(msg)
    lobbyStatus.Value = msg
end

local function startCountdown()
    if countdownActive then return end
    countdownActive = true
    countdownTimer = COUNTDOWN_TIME
    print("[Lobby] Countdown started")

    while countdownTimer > 0 do
        local currentPlayers = #Players:GetPlayers()
        if currentPlayers < MIN_PLAYERS then
            -- Not enough players, cancel countdown
            countdownActive = false
            updateStatus("Waiting for players... (" .. currentPlayers .. "/" .. MIN_PLAYERS .. ")")
            return
        end
        updateStatus("Starting in " .. countdownTimer .. "s (" .. currentPlayers .. "/" .. MAX_PLAYERS .. ")")
        task.wait(1)
        countdownTimer -= 1
    end

    countdownActive = false
    -- Teleport everyone to game
    local playerList = Players:GetPlayers()
    if #playerList >= MIN_PLAYERS then
        -- Same-game teleport: move all to a spawn area
        for _, p in ipairs(playerList) do
            if p.Character and p.Character:FindFirstChild("HumanoidRootPart") then
                local gameSpawn = workspace:FindFirstChild("GameSpawn")
                if gameSpawn then
                    p.Character.HumanoidRootPart.CFrame = gameSpawn.CFrame + Vector3.new(math.random(-10,10), 3, math.random(-10,10))
                end
            end
        end
        -- OR use TeleportService for separate-place games:
        -- local accessCode = TeleportService:ReserveServer(GAME_PLACE_ID)
        -- TeleportService:TeleportToPrivateServer(GAME_PLACE_ID, accessCode, playerList)
    end
end

Players.PlayerAdded:Connect(function(player)
    local count = #Players:GetPlayers()
    updateStatus("Waiting for players... (" .. count .. "/" .. MIN_PLAYERS .. ")")
    if count >= MIN_PLAYERS then
        task.spawn(startCountdown)
    end
    -- Teleport new player to lobby spawn
    player.CharacterAdded:Connect(function(char)
        task.wait(0.1)
        local lobbySpawn = workspace:FindFirstChild("LobbySpawn")
        if lobbySpawn and char:FindFirstChild("HumanoidRootPart") then
            char.HumanoidRootPart.CFrame = lobbySpawn.CFrame + Vector3.new(math.random(-8,8), 3, math.random(-8,8))
        end
    end)
end)

Players.PlayerRemoving:Connect(function()
    local count = #Players:GetPlayers() - 1
    if count < MIN_PLAYERS then
        updateStatus("Waiting for players... (" .. count .. "/" .. MIN_PLAYERS .. ")")
    end
end)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. TEAM ASSIGNMENT SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ════════════════════════════════════
-- PATTERN: Auto-balance Team Assignment (ModuleScript)
-- ════════════════════════════════════
local Teams = game:GetService("Teams")
local TeamManager = {}

-- Auto-balance: assign to smallest team
function TeamManager.AssignPlayer(player, teamNames)
    local smallestTeam = nil
    local smallestCount = math.huge

    for _, name in ipairs(teamNames) do
        local team = Teams:FindFirstChild(name)
        if team then
            local count = #team:GetPlayers()
            if count < smallestCount then
                smallestCount = count
                smallestTeam = team
            end
        end
    end

    if smallestTeam then
        player.Team = smallestTeam
    end
end

-- Random shuffle assignment
function TeamManager.AssignAllRandom(players, teamNames)
    -- Shuffle player list
    local shuffled = table.clone(players)
    for i = #shuffled, 2, -1 do
        local j = math.random(i)
        shuffled[i], shuffled[j] = shuffled[j], shuffled[i]
    end

    -- Round-robin assign to teams
    local teamObjects = {}
    for _, name in ipairs(teamNames) do
        local t = Teams:FindFirstChild(name)
        if t then table.insert(teamObjects, t) end
    end

    for i, player in ipairs(shuffled) do
        local teamIdx = ((i - 1) % #teamObjects) + 1
        player.Team = teamObjects[teamIdx]
    end
end

-- Reset all to lobby team
function TeamManager.ResetAll(lobbyTeamName)
    local lobby = Teams:FindFirstChild(lobbyTeamName or "Lobby")
    for _, player in ipairs(game:GetService("Players"):GetPlayers()) do
        if lobby then
            player.Team = lobby
        end
    end
end

-- Get team color string for UI display
function TeamManager.GetTeamColor(player)
    if player.Team then
        return player.Team.TeamColor
    end
    return BrickColor.new("Medium stone grey")
end

return TeamManager

-- ════════════════════════════════════
-- USAGE:
-- ════════════════════════════════════
local TeamManager = require(game.ServerScriptService.TeamManager)
local allPlayers = game:GetService("Players"):GetPlayers()
TeamManager.AssignAllRandom(allPlayers, {"RedTeam", "BlueTeam"})
-- ... round plays ...
TeamManager.ResetAll("Lobby")
`;
