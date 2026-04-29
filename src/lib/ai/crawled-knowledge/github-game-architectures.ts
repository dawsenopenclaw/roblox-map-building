// Pattern from github.com/Sleitnick/Knit, github.com/Kampfkarren/Roblox,
// github.com/ethangtkt/Outrageous-Blades, github.com/ykrimhy/roblox-arena-system
// Crawled April 2026 — real open-source Roblox game code distilled into AI training patterns

export const GITHUB_GAME_ARCHITECTURES = `
==============================================================
REAL ROBLOX GAME ARCHITECTURES (from open-source repos)
==============================================================

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PATTERN 1: KNIT FRAMEWORK — SERVICE/CONTROLLER ARCHITECTURE
Source: github.com/Sleitnick/Knit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The industry standard Roblox framework. Services (server) + Controllers (client).
Lifecycle: KnitInit() runs first (all services), then KnitStart() runs (all services).
KnitStart uses task.spawn so services don't block each other.

FOLDER STRUCTURE:
  ServerScriptService/
    KnitServer (Script)
    Services/
      CombatService (ModuleScript)
      DataService (ModuleScript)
      EconomyService (ModuleScript)
  StarterPlayerScripts/
    KnitClient (Script)
    Controllers/
      UIController (ModuleScript)
      InputController (ModuleScript)
  ReplicatedStorage/
    Knit (Package)
    Shared/ (modules shared between server+client)

SERVER SIDE — CREATE A SERVICE:
  local Knit = require(ReplicatedStorage.Packages.Knit)

  local CombatService = Knit.CreateService {
    Name = "CombatService",
    Client = {
      -- These auto-become RemoteEvents/RemoteFunctions:
      PlayerHit = Knit.CreateSignal(),         -- RemoteEvent
      GetStats = Knit.CreateProperty({}),      -- RemoteProperty (replicates to all clients)
    },
  }

  -- Server-only method:
  function CombatService:DealDamage(player, target, amount)
    -- server logic here
  end

  -- Client-exposed method (becomes RemoteFunction):
  function CombatService.Client:RequestAttack(player, targetId)
    return self.Server:DealDamage(player, targetId, 10)
  end

  function CombatService:KnitInit()
    -- Runs during init phase — wire up connections here
    self.Client.PlayerHit:Connect(function(player, ...) end)
  end

  function CombatService:KnitStart()
    -- Runs after all KnitInit() complete — start game loops here
    task.spawn(function()
      while true do task.wait(0.1) -- game loop end
    end)
  end

  return CombatService

CLIENT SIDE — CREATE A CONTROLLER:
  local Knit = require(ReplicatedStorage.Packages.Knit)

  local UIController = Knit.CreateController { Name = "UIController" }

  function UIController:KnitInit()
    -- Get server service proxy (auto-wraps RemoteEvents/Functions)
    self.CombatService = Knit.GetService("CombatService")
  end

  function UIController:KnitStart()
    -- Call server method (returns Promise by default):
    self.CombatService:RequestAttack(targetId):andThen(function(result)
      print("Attack result:", result)
    end)

    -- Listen to server signal:
    self.CombatService.PlayerHit:Connect(function(...)
      -- update UI
    end)

    -- Observe replicated property:
    self.CombatService.GetStats:Observe(function(stats)
      -- refresh stats display
    end)
  end

  return UIController

STARTUP SCRIPTS:
  -- ServerScriptService/KnitServer:
  local Knit = require(ReplicatedStorage.Packages.Knit)
  Knit.AddServices(script.Parent.Services)  -- require all services
  Knit.Start():catch(warn)

  -- StarterPlayerScripts/KnitClient:
  local Knit = require(ReplicatedStorage.Packages.Knit)
  Knit.AddControllers(script.Parent.Controllers)
  Knit.Start():catch(warn)

KEY KNIT PATTERNS:
  - Services freeze after Start() — no new services can be added
  - SIGNAL_MARKER / PROPERTY_MARKER are proxy values that become Remotes
  - Middleware: Inbound/Outbound functions can validate/transform remote args
  - debug.setmemorycategory(service.Name) used for memory profiling per service
  - OnStart() returns Promise — safe to call before/after Knit starts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PATTERN 2: OBJECT-ORIENTED ARENA / GAME MODE SYSTEM
Source: github.com/ykrimhy/roblox-arena-system
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Full melee arena: matchmaking queue, rounds, score tracking, skins, kill log.
Architecture: ArenaManager (singleton) owns array of Arena objects (OOP with __index).

ARCHITECTURE:
  ArenaManager = {
    Arenas = {}   -- array of Arena instances
    :Init()       -- scan workspace/Arenas folder, create Arena objects
    :GetArenaOfPlayer(player)  -- find which arena a player is in
  }

  Arena = {       -- created via Arena.new(arenaFolder)
    Folder        -- reference to workspace model
    Queue         -- array of {Player, PadIndex, Team}
    InMatch       -- bool
    MatchData = {
      Team1Score, Team2Score,
      AlivePlayers,     -- {[userId] = bool}
      OriginalPlayers   -- {[userId] = {Team, Player, PadIndex}}
    }
    QueuePads     -- array of Part references
    ActiveDisplays -- {[userId] = {Part, UpdateFunc}}
    PadDebounce   -- {[padIndex] = bool} prevents spam
  }

OOP CREATION PATTERN:
  local Arena = {}
  Arena.__index = Arena

  function Arena.new(arenaFolder)
    local self = setmetatable({}, Arena)
    self.Folder = arenaFolder
    self.Queue = {}
    self.InMatch = false
    self.MatchData = { Team1Score=0, Team2Score=0, AlivePlayers={}, OriginalPlayers={} }
    self:SetupPads()
    return self
  end

  function Arena:StartMatch()
    if self.InMatch then return end  -- guard clause
    self.InMatch = true
    -- copy queue into OriginalPlayers for match duration
    for _, q in pairs(self.Queue) do
      self.MatchData.OriginalPlayers[q.Player.UserId] = {
        Team = q.Team, Player = q.Player, PadIndex = q.PadIndex
      }
    end
    self:StartRound()
  end

QUEUE SYSTEM PATTERN — pad-based joining:
  -- Pads are Parts in workspace. Player stands on pad to join queue.
  -- Sequential fill: pad 1, 2, 3 (team 1) | pad 6, 7, 8 (team 2)
  -- CanJoinPad checks previous pad is occupied first

  pad.Touched:Connect(function(hit)
    local player = Players:GetPlayerFromCharacter(hit.Parent)
    if not player then return end
    if self.PadDebounce[padIndex] then return end  -- debounce
    self.PadDebounce[padIndex] = true
    task.delay(1, function() self.PadDebounce[padIndex] = false end)
    -- add to queue, show popup display, start proximity monitor
  end)

  -- Proximity monitor keeps player in queue only while on pad:
  task.spawn(function()
    while player and player.Character do
      if self.InMatch then break end
      local hrp = player.Character:FindFirstChild("HumanoidRootPart")
      if hrp and (hrp.Position - pad.Position).Magnitude > 7 then
        self:RemoveFromQueue(player)
        break
      end
      task.wait(0.2)
    end
  end)

ROUND FLOW:
  StartMatch() →
    StartRound() →
      teleport all players to arena spawns
      reset AlivePlayers = {[id] = true}
  OnPlayerDied(victimId) →
    count remaining alive per team
    if one team has 0 alive → RoundWon(winningTeam)
  RoundWon(team) →
    increment team score
    if score >= WIN_SCORE and gap >= WIN_BY → EndMatch()
    else → wait(3), StartRound()
  EndMatch(winner) →
    give coins/wins/losses
    save all players
    teleport to lobby
    wait(2), ResetArena()

PLAYER DISCONNECT HANDLING:
  Players.PlayerRemoving:Connect(function(player)
    for _, arena in pairs(ArenaManager.Arenas) do
      arena:CheckForLeaver(player)  -- marks them dead, may end match
    end
  end)

CREATOR TAG PATTERN (kill attribution):
  -- When sword hits, tag the victim's humanoid:
  local tag = Instance.new("ObjectValue")
  tag.Name = "creator"
  tag.Value = attackingPlayer
  tag.Parent = victimHumanoid
  Debris:AddItem(tag, 2)  -- auto-cleanup

  -- On death, read the tag:
  hum.Died:Connect(function()
    local tag = hum:FindFirstChild("creator")
    if tag and tag.Value then
      ChangeStat(tag.Value, "Kills", 1)
    end
  end)

DAMAGE TRACKING (HealthChanged pattern):
  hum.HealthChanged:Connect(function(newHealth)
    local delta = lastHealth - newHealth
    lastHealth = newHealth
    if delta > 0 then
      local creator = hum:FindFirstChild("creator")
      if creator and creator.Value then
        TrackDamage(char, delta, creator.Value)
      end
    end
  end)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PATTERN 3: MULTIPLAYER GAME WITH VALUE-BASED DATA FOLDERS
Source: github.com/ethangtkt/Outrageous-Blades
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Older pattern using Instance Values (IntValue, BoolValue, etc.) for player state.
Each player gets a cloned PlayersValues folder. Each value = one DataStore key.

PLAYER JOIN:
  Players.PlayerAdded:Connect(function(player)
    -- Clone template values folder
    game.ReplicatedStorage.PlayersValues:Clone().Parent = player
    -- Wait for it to exist
    for i=1,10 do
      if player:FindFirstChild("PlayersValues") then break end
      task.wait(1)
    end
    local key = "User_" .. player.UserId
    LoadStats(player, key)
    player.PlayersValues.OtherValues.HasLoadedStats.Value = true
  end)

LOAD PATTERN — iterate all children and load per value:
  for _, Child in pairs(Player.PlayersValues:GetChildren()) do
    if Child:IsA("IntValue") or Child:IsA("StringValue") then
      for i = 1, FetchLimit do  -- retry up to 5 times
        local success, msg = pcall(function()
          Child.Value = DataStore:GetDataStore(Child.Name):GetAsync(key)
          -- update loading percentage
          loadingValue.Value += percentagePerValue
        end)
        if success then break end
        task.wait(RequestWaitTime)  -- 1.5s between retries
      end
    end
  end

SAVE GUARD — only save if data loaded successfully:
  function SaveStats(player, key, values)
    -- CRITICAL: check HasLoadedStats before saving to prevent data wipe
    if values.OtherValues.HasLoadedStats.Value == true then
      for _, Child in pairs(values:GetChildren()) do
        pcall(function()
          DataStore:GetDataStore(Child.Name):SetAsync(key, Child.Value)
        end)
      end
    end
  end

GAME SHUTDOWN HANDLER:
  -- BoolValue "GameShutdown" in script — set to true to trigger save-all
  script.GameShutdown.Changed:Connect(function()
    if script.GameShutdown.Value == true then
      for _, player in pairs(Players:GetChildren()) do
        SaveStats(player, "User_"..player.UserId, player.PlayersValues)
      end
    end
  end)

BATTLE STATE (ReplicatedStorage.BattleStorage):
  BattleStorage/
    PlayerOne/
      PlayersName (StringValue)
      Health (IntValue)
      Dead (BoolValue)
    PlayerTwo/ (same)
    UniqueRounds/
      Juggernaut/ EndGame (BoolValue)
      TwoBigTeams/ TeamOne/ TeamTwo/
      FreeForAll/ KillTheCarrier/ TimeBomb/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PATTERN 4: KAMPFKARREN MODULE COLLECTION STRUCTURE
Source: github.com/Kampfkarren/Roblox
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Production-grade module library by one of Roblox's most experienced devs.
Key reusable modules discovered:

MODULES LIST (use as reference for naming/structure):
  CircleAttachment.lua    — attach parts in circular patterns
  CommaSeparated.lua      — number formatting (1000 → "1,000")
  GamePasses.lua          — check/prompt gamepasses cleanly
  GetCharacter.lua        — safe character retrieval
  GetMassOfModel.lua      — physics mass calculation
  LineOfSight.lua         — raycast LOS check
  LoadRequirement.lua     — async requirement loading
  PlayerCleanup.lua       — cleanup connections on player leave
  PlayerStorage.lua       — per-player data storage
  Queue.lua               — FIFO queue data structure
  Raycast.lua             — wrapper around workspace:Raycast()
  TaskScheduler.lua       — scheduled task management
  WeakInstanceTable.lua   — table that doesn't prevent GC

GAMEPASSES MODULE PATTERN:
  -- Check ownership cleanly with pcall:
  local function PlayerHasPass(player, passId)
    local success, hasPass = pcall(function()
      return MarketplaceService:UserOwnsGamePassAsync(player.UserId, passId)
    end)
    return success and hasPass
  end

LINE OF SIGHT PATTERN:
  local function HasLineOfSight(origin, target, ignoreList)
    local direction = (target - origin).Unit
    local distance = (target - origin).Magnitude
    local params = RaycastParams.new()
    params.FilterDescendantsInstances = ignoreList
    params.FilterType = Enum.RaycastFilterType.Exclude
    local result = workspace:Raycast(origin, direction * distance, params)
    return result == nil  -- no obstruction = has LOS
  end

TASK SCHEDULER PATTERN:
  -- Schedule tasks to run at specific intervals without drift:
  local scheduler = TaskScheduler.new()
  scheduler:Add(function()
    -- runs every frame
  end)
  scheduler:AddDelay(5, function()
    -- runs 5 seconds from now
  end)
  -- Connect to RunService.Heartbeat or Stepped

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PATTERN 5: DUAL STATS SYSTEM (Match Stats + Lifetime Stats)
Source: github.com/ykrimhy/roblox-arena-system
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Two separate stat tables: in-memory per-match AND persistent lifetime.

  local LifetimeStats = {}   -- {[userId] = {Kills, Deaths, Wins, Losses, Coins, EquippedSkin}}
  local MatchStats = {}      -- {[userId] = {Kills, Deaths, Damage, Assists}}

  local function ChangeStat(player, statName, value)
    local uId = player.UserId
    -- Update both tables atomically:
    if MatchStats[uId][statName] ~= nil then
      MatchStats[uId][statName] += value
    end
    if LifetimeStats[uId][statName] ~= nil then
      LifetimeStats[uId][statName] += value
    end
    -- Sync to leaderstats IntValues:
    local ls = player:FindFirstChild("leaderstats")
    if ls and ls:FindFirstChild(statName) then
      ls[statName].Value = LifetimeStats[uId][statName]
    end
  end

  -- Reset match stats at round start:
  MatchStats[player.UserId] = {Kills=0, Deaths=0, Damage=0, Assists=0}

  -- Save only lifetime stats to DataStore:
  local function SavePlayer(player)
    pcall(function()
      PlayerStatsDS:SetAsync("User_"..player.UserId, LifetimeStats[player.UserId])
    end)
  end

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PATTERN 6: SKIN/COSMETIC SYSTEM
Source: github.com/ykrimhy/roblox-arena-system
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Skins stored in ReplicatedStorage/Skins folder. Players equip via RemoteEvent.
Active skin stored in LifetimeStats and player Attribute.

  -- Equip via RemoteEvent:
  EquipSkinEvent.OnServerEvent:Connect(function(player, skinName)
    if SkinsFolder:FindFirstChild(skinName) then
      LifetimeStats[player.UserId].EquippedSkin = skinName
      player:SetAttribute("EquippedSkin", skinName)  -- replicate to client
    end
  end)

  -- Give skin tool to player:
  function Arena:GiveSword(player)
    local skinName = LifetimeStats[player.UserId].EquippedSkin or "ClassicSword"
    local sword = SkinsFolder:FindFirstChild(skinName)
    if sword and not player.Backpack:FindFirstChild(sword.Name) then
      local clone = sword:Clone()
      clone.Parent = player.Backpack
      player.Character.Humanoid:EquipTool(clone)
    end
  end

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PATTERN 7: LEADERSTATS SETUP
Source: multiple repos
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Players.PlayerAdded:Connect(function(player)
    local ls = Instance.new("Folder")
    ls.Name = "leaderstats"
    ls.Parent = player

    local kills = Instance.new("IntValue")
    kills.Name = "Kills"
    kills.Value = 0
    kills.Parent = ls

    local coins = Instance.new("IntValue")
    coins.Name = "Coins"
    coins.Value = 0
    coins.Parent = ls

    -- Load from DataStore in task.spawn (non-blocking):
    task.spawn(function()
      local success, data = pcall(function()
        return PlayerDS:GetAsync("User_"..player.UserId)
      end)
      if success and data then
        kills.Value = data.Kills or 0
        coins.Value = data.Coins or 0
      end
    end)
  end)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PATTERN 8: SURFACE GUI IN-WORLD UI (from arena system)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Creating world-space UI (scoreboards, nameplates, stat displays):

  local part = Instance.new("Part")
  part.Size = Vector3.new(12, 6, 0.8)
  part.Transparency = 0   -- or 1 for invisible backing
  part.CanCollide = false
  part.Anchored = true
  part.Parent = workspace

  local gui = Instance.new("SurfaceGui", part)
  gui.Face = Enum.NormalId.Front
  gui.SizingMode = Enum.SurfaceGuiSizingMode.FixedSize
  gui.CanvasSize = Vector2.new(600, 300)  -- pixel resolution

  -- BOTH faces (front and back of scoreboard):
  for _, face in pairs({Enum.NormalId.Front, Enum.NormalId.Back}) do
    local sGui = Instance.new("SurfaceGui", part)
    sGui.Face = face
    -- ... add content
  end

  -- Position relative to arena:
  part.CFrame = referencePart.CFrame
    * CFrame.new(0, HEIGHT_OFFSET, FORWARD_OFFSET)
    * CFrame.Angles(0, math.rad(ROTATION), 0)

POPUP DISPLAY PATTERN (player stat cards):
  -- Create part above queue pad:
  display.CFrame = pad.CFrame
    * CFrame.new(0, POPUP_HEIGHT, 0)           -- above pad
    * CFrame.Angles(0, math.rad(-90), 0)       -- face correct direction
    * CFrame.new(0, 0, POPUP_FORWARD_OFFSET)   -- push forward

  -- Animate in with TweenService:
  frame.Size = UDim2.fromScale(0, 0)
  frame.Position = UDim2.fromScale(0.5, 0.5)
  TweenService:Create(frame, TWEEN_INFO,
    {Size = UDim2.fromScale(1,1), Position = UDim2.fromScale(0,0)}
  ):Play()

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PATTERN 9: GENERAL FOLDER/WORKSPACE ORGANIZATION
Distilled from all repos
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WORKSPACE ORGANIZATION (what real games use):
  workspace/
    Map/          -- static world geometry
    Arenas/       -- folder of Arena models, each named "Arena1", "Arena2"
      Arena1/     -- model with Team1Spawn, Team2Spawn, Pad1-Pad10, MatchDisplay
    LobbySpawns/  -- SpawnLocation parts for lobby respawn
    NPCs/         -- folder of NPC characters
    Lighting/     -- lighting effects models

REPLICATED STORAGE ORGANIZATION:
  ReplicatedStorage/
    Packages/     -- Wally packages (Knit, Promise, etc.)
    Modules/      -- shared modules
    Assets/       -- shared assets (sounds, FX)
    Skins/        -- tool variants (cosmetics)
    PlayersValues/ -- template folder cloned to each player
    Events/        -- RemoteEvents
      StartMatchEvent (RemoteEvent)
      EquipSkinEvent (RemoteEvent)
      MatchResultEvent (RemoteEvent)
    Functions/     -- RemoteFunctions
      GetStatsFunction (RemoteFunction)

SERVER STORAGE:
  ServerStorage/
    Assets/       -- server-only assets
    SaveInStudio  -- BoolValue: controls if DataStore saves in Studio

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PATTERN 10: CHARACTER RESPAWN / TELEPORT PATTERNS
Source: github.com/ykrimhy/roblox-arena-system
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  local function TeleportToLobby(player)
    if not player.Character then return end
    local hrp = player.Character:FindFirstChild("HumanoidRootPart")
    if hrp then
      -- Zero velocity first to prevent physics glitches:
      hrp.Velocity = Vector3.new(0,0,0)
      hrp.AssemblyLinearVelocity = Vector3.new(0,0,0)

      -- Find random spawn from folder:
      local spawns = workspace.LobbySpawns:GetChildren()
      if #spawns > 0 then
        local spawn = spawns[math.random(1, #spawns)]
        hrp.CFrame = spawn.CFrame + Vector3.new(0, 3, 0)
      end
    end
  end

  -- Face player toward arena center:
  local lookTarget = self.MatchDisplay.Position
  hrp.CFrame = CFrame.lookAt(
    hrp.Position,
    Vector3.new(lookTarget.X, hrp.Position.Y, lookTarget.Z)
  )

  -- Spawn with jitter to avoid stacking:
  hrp.CFrame = spawnPart.CFrame + Vector3.new(
    math.random(-5, 5), 3, math.random(-5, 5)
  )

  -- Full heal on spawn:
  local hum = player.Character:FindFirstChild("Humanoid")
  if hum then hum.Health = hum.MaxHealth end

FORCEFIELD REMOVAL PATTERN:
  local function RemoveForceField(character)
    local ff = character:FindFirstChildOfClass("ForceField")
    if ff then ff:Destroy() end
  end
  -- Call this after teleporting player so they're vulnerable immediately

SPAWN LOCATION DURATION = 0 TRICK:
  -- Disable default respawn delay:
  for _, obj in pairs(workspace:GetDescendants()) do
    if obj:IsA("SpawnLocation") then obj.Duration = 0 end
  end
  -- Also catch new spawn locations added later:
  workspace.DescendantAdded:Connect(function(obj)
    if obj:IsA("SpawnLocation") then obj.Duration = 0 end
  end)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PATTERN 11: PLAYER ATTRIBUTE SYSTEM (modern state management)
Source: github.com/ykrimhy/roblox-arena-system
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use player:SetAttribute / GetAttribute for clean state management.
Attributes replicate to client automatically.

  -- Set player state:
  player:SetAttribute("CurrentMatch", "Arena1")   -- which arena
  player:SetAttribute("State", "Arena")            -- "Lobby" | "Arena" | "Queue"
  player:SetAttribute("LockedTeamSide", "Team1")  -- team assignment
  player:SetAttribute("EquippedSkin", "FireSword") -- cosmetic

  -- Clear on leave:
  player:SetAttribute("CurrentMatch", nil)
  player:SetAttribute("State", "Lobby")
  player:SetAttribute("LockedTeamSide", nil)

  -- Client reads:
  local state = player:GetAttribute("State")
  player.AttributeChanged:Connect(function(attr)
    if attr == "State" then
      -- react to state change
    end
  end)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PATTERN 12: KILL LOG / NOTIFICATION UI
Source: github.com/ykrimhy/roblox-arena-system
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Temporary UI created on server, parented to PlayerGui, auto-destroyed:

  local function TriggerKillLog(targetPlayer, killerName, victimName, distance, ping)
    local sg = Instance.new("ScreenGui")
    sg.Name = "KillLogDisplay"
    sg.ResetOnSpawn = false
    sg.Parent = targetPlayer.PlayerGui
    Debris:AddItem(sg, 3.5)  -- auto-destroy after 3.5 seconds

    local frame = Instance.new("Frame")
    frame.Size = UDim2.new(0, 300, 0, 50)
    frame.AnchorPoint = Vector2.new(1, 1)          -- anchor bottom-right
    frame.Position = UDim2.new(0.98, 0, 0.98, 0)  -- bottom-right of screen
    frame.BackgroundColor3 = Color3.fromRGB(20, 5, 5)
    frame.BackgroundTransparency = 0.2
    frame.Parent = sg

    -- Rounded corners:
    Instance.new("UICorner", frame).CornerRadius = UDim.new(0, 8)

    -- RichText for colored names:
    local txt = Instance.new("TextLabel")
    txt.RichText = true
    txt.Text = killerName .. " killed <font color='#AA00FF'>"..victimName.."</font>"
    txt.Font = Enum.Font.GothamBold
    txt.Parent = frame
  end

  -- Broadcast kill log to ALL players in the arena:
  for _, data in pairs(self.MatchData.OriginalPlayers) do
    if data.Player then
      TriggerKillLog(data.Player, killerName, victimName, distance, ping)
    end
  end
`;
