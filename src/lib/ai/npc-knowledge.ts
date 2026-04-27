/**
 * NPC & AI Behavior Systems Knowledge Base
 *
 * Deep NPC patterns extracted from Roblox DevForum threads, official docs,
 * and community resources. Covers pathfinding, state machines, behavior trees,
 * combat AI, dialogue systems, spawning, and performance optimization.
 *
 * Sources:
 * - devforum.roblox.com/t/simple-pathfinding-ai/1815347
 * - devforum.roblox.com/t/how-would-i-make-advanced-npc-ai/2890159
 * - devforum.roblox.com/t/tutorial-civilian-npcs-pathfinding-customer-npcs/3187486
 * - devforum.roblox.com/t/npc-system-v2-your-comprehensive-npc-system-for-your-roblox-game/4003818
 * - devforum.roblox.com/t/first-time-using-behavior-trees-any-tips-for-serverside-pathing/3226584
 * - devforum.roblox.com/t/how-you-can-use-ai-pathfinding/570721
 * - devforum.roblox.com/t/simplepath-pathfinding-module/1196762
 * - devforum.roblox.com/t/make-npc-pathfinding-more-smooth/2129908
 * - create.roblox.com/docs/characters/pathfinding
 * - create.roblox.com/docs/reference/engine/classes/PathfindingService
 * - create.roblox.com/docs/reference/engine/classes/Path
 * - And 20+ additional threads
 */

import 'server-only'

export const NPC_KNOWLEDGE = `
=== NPC & AI BEHAVIOR SYSTEMS (from top Roblox developers & official docs) ===

PATHFINDINGSERVICE FUNDAMENTALS:
- PathfindingService computes paths between two points using a navigation mesh.
- Basic usage:
  local PathfindingService = game:GetService("PathfindingService")

  local path = PathfindingService:CreatePath({
    AgentRadius = 2,        -- NPC collision radius in studs (default 2)
    AgentHeight = 5,        -- NPC height in studs (default 5)
    AgentCanJump = true,    -- whether NPC can use jump links (default true)
    AgentCanClimb = false,  -- whether NPC can climb TrussParts (default false)
    WaypointSpacing = 4,    -- distance between waypoints in studs (default 4, range 4-inf)
    Costs = {               -- material/label traversal costs (higher = avoid)
      Water = 20,           -- NPC avoids water
      DangerZone = math.huge, -- NPC never enters (impassable)
      Climb = 5,            -- climbing is 5x more expensive than walking
    },
  })

  path:ComputeAsync(startPosition, endPosition)

  if path.Status == Enum.PathStatus.Success then
    local waypoints = path:GetWaypoints()
    for _, waypoint in ipairs(waypoints) do
      -- waypoint.Position: Vector3
      -- waypoint.Action: Enum.PathWaypointAction (Walk, Jump, Custom)
      -- waypoint.Label: string (custom label from PathfindingModifier)
    end
  else
    warn("Path computation failed:", path.Status)
    -- Enum.PathStatus: Success, ClosestNoPath, ClosestOutOfRange, FailStartNotEmpty, FailFinishNotEmpty, NoPath
  end

- PathfindingModifier: attach to parts to change pathfinding behavior.
  local modifier = Instance.new("PathfindingModifier")
  modifier.Label = "DangerZone"  -- matches the Costs table key
  modifier.PassThrough = false   -- if true, agent can walk through this part
  modifier.Parent = dangerPart

- PathfindingLink: creates a link between two points for custom connections.
  -- Useful for teleporters, zip lines, doors, ladders
  local link = Instance.new("PathfindingLink")
  link.Attachment0 = startAttachment
  link.Attachment1 = endAttachment
  link.Label = "Teleporter"
  link.IsBidirectional = true
  link.Parent = workspace

- Path blocked detection:
  path.Blocked:Connect(function(blockedWaypointIndex)
    -- Re-compute path when something blocks it
    path:ComputeAsync(npc.HumanoidRootPart.Position, targetPosition)
  end)

BASIC NPC MOVEMENT:
- Using Humanoid:MoveTo() to follow waypoints:
  local function moveNPCAlongPath(npc, targetPosition)
    local humanoid = npc:FindFirstChildOfClass("Humanoid")
    local rootPart = npc:FindFirstChild("HumanoidRootPart")
    if not humanoid or not rootPart then return end

    local path = PathfindingService:CreatePath({
      AgentRadius = 2,
      AgentHeight = 5,
      AgentCanJump = true,
    })

    path:ComputeAsync(rootPart.Position, targetPosition)

    if path.Status ~= Enum.PathStatus.Success then
      -- Fallback: walk directly toward target
      humanoid:MoveTo(targetPosition)
      return
    end

    local waypoints = path:GetWaypoints()
    local blockedConnection

    blockedConnection = path.Blocked:Connect(function(blockedIndex)
      blockedConnection:Disconnect()
      moveNPCAlongPath(npc, targetPosition)  -- recompute
    end)

    for i, waypoint in ipairs(waypoints) do
      if waypoint.Action == Enum.PathWaypointAction.Jump then
        humanoid.Jump = true
      end

      humanoid:MoveTo(waypoint.Position)
      local reached = humanoid.MoveToFinished:Wait()

      if not reached then
        -- NPC got stuck, recompute
        blockedConnection:Disconnect()
        moveNPCAlongPath(npc, targetPosition)
        return
      end
    end

    blockedConnection:Disconnect()
  end

- MoveTo timeout: Humanoid:MoveTo() has an 8-second timeout. If NPC doesn't reach
  the waypoint in 8 seconds, MoveToFinished fires with false. Always handle this.

- Smooth NPC movement tip: set Humanoid.WalkSpeed appropriately (default 16).
  For running NPCs: 24-32. For walking civilians: 8-12. For bosses: 12-20.

NPC STATE MACHINE PATTERN:
- The most common NPC AI pattern. Each NPC has a state that determines behavior:
  local NPC = {}
  NPC.__index = NPC

  -- States: "Idle", "Patrol", "Chase", "Attack", "Return", "Dead"
  function NPC.new(model, config)
    local self = setmetatable({}, NPC)
    self.Model = model
    self.Humanoid = model:FindFirstChildOfClass("Humanoid")
    self.RootPart = model:FindFirstChild("HumanoidRootPart")
    self.State = "Idle"
    self.Target = nil
    self.SpawnPoint = model:GetPivot().Position
    self.Config = config or {
      DetectionRange = 50,   -- studs to detect player
      AttackRange = 5,       -- studs to attack
      ChaseSpeed = 20,       -- WalkSpeed when chasing
      PatrolSpeed = 10,      -- WalkSpeed when patrolling
      AttackDamage = 15,
      AttackCooldown = 1.5,  -- seconds between attacks
      DeaggroRange = 70,     -- studs before NPC gives up chase
      ReturnThreshold = 100, -- studs from spawn before forced return
    }
    self.LastAttackTime = 0
    self.PatrolPoints = {}
    self.CurrentPatrolIndex = 1
    return self
  end

  function NPC:SetState(newState)
    if self.State == newState then return end
    local oldState = self.State
    self.State = newState

    -- Speed changes per state
    if newState == "Patrol" then
      self.Humanoid.WalkSpeed = self.Config.PatrolSpeed
    elseif newState == "Chase" or newState == "Attack" then
      self.Humanoid.WalkSpeed = self.Config.ChaseSpeed
    elseif newState == "Return" then
      self.Humanoid.WalkSpeed = self.Config.PatrolSpeed
    end
  end

  function NPC:FindNearestPlayer()
    local Players = game:GetService("Players")
    local nearest = nil
    local nearestDist = self.Config.DetectionRange

    for _, player in ipairs(Players:GetPlayers()) do
      local character = player.Character
      if character then
        local hrp = character:FindFirstChild("HumanoidRootPart")
        local hum = character:FindFirstChildOfClass("Humanoid")
        if hrp and hum and hum.Health > 0 then
          local dist = (hrp.Position - self.RootPart.Position).Magnitude
          if dist < nearestDist then
            nearest = character
            nearestDist = dist
          end
        end
      end
    end

    return nearest, nearestDist
  end

  function NPC:HasLineOfSight(target)
    local targetPart = target:FindFirstChild("HumanoidRootPart")
    if not targetPart then return false end

    local direction = (targetPart.Position - self.RootPart.Position)
    local rayParams = RaycastParams.new()
    rayParams.FilterDescendantsInstances = {self.Model, target}
    rayParams.FilterType = Enum.RaycastFilterType.Exclude

    local result = workspace:Raycast(self.RootPart.Position, direction, rayParams)
    return result == nil  -- nil means nothing blocked the ray
  end

  function NPC:Update()
    if self.Humanoid.Health <= 0 then
      self:SetState("Dead")
      return
    end

    local target, targetDist = self:FindNearestPlayer()
    local distFromSpawn = (self.RootPart.Position - self.SpawnPoint).Magnitude

    if self.State == "Idle" then
      if target and self:HasLineOfSight(target) then
        self.Target = target
        self:SetState("Chase")
      elseif #self.PatrolPoints > 0 then
        self:SetState("Patrol")
      end

    elseif self.State == "Patrol" then
      if target and self:HasLineOfSight(target) then
        self.Target = target
        self:SetState("Chase")
      else
        -- Move to next patrol point
        local patrolPoint = self.PatrolPoints[self.CurrentPatrolIndex]
        local distToPoint = (self.RootPart.Position - patrolPoint).Magnitude
        if distToPoint < 4 then
          self.CurrentPatrolIndex = (self.CurrentPatrolIndex % #self.PatrolPoints) + 1
        end
        self.Humanoid:MoveTo(patrolPoint)
      end

    elseif self.State == "Chase" then
      if not self.Target or not self.Target.Parent then
        self.Target = nil
        self:SetState("Return")
        return
      end

      local targetHumanoid = self.Target:FindFirstChildOfClass("Humanoid")
      if not targetHumanoid or targetHumanoid.Health <= 0 then
        self.Target = nil
        self:SetState("Return")
        return
      end

      local targetPart = self.Target:FindFirstChild("HumanoidRootPart")
      if not targetPart then
        self:SetState("Return")
        return
      end

      local dist = (targetPart.Position - self.RootPart.Position).Magnitude

      if dist > self.Config.DeaggroRange then
        self.Target = nil
        self:SetState("Return")
      elseif distFromSpawn > self.Config.ReturnThreshold then
        self.Target = nil
        self:SetState("Return")
      elseif dist <= self.Config.AttackRange then
        self:SetState("Attack")
      else
        -- Chase with pathfinding
        self.Humanoid:MoveTo(targetPart.Position)
      end

    elseif self.State == "Attack" then
      if not self.Target or not self.Target.Parent then
        self:SetState("Return")
        return
      end

      local targetPart = self.Target:FindFirstChild("HumanoidRootPart")
      if not targetPart then
        self:SetState("Return")
        return
      end

      local dist = (targetPart.Position - self.RootPart.Position).Magnitude

      if dist > self.Config.AttackRange * 1.5 then
        self:SetState("Chase")
      else
        -- Face target
        local lookCF = CFrame.lookAt(self.RootPart.Position, targetPart.Position)
        self.RootPart.CFrame = CFrame.new(self.RootPart.Position) *
          CFrame.Angles(0, math.atan2(-lookCF.LookVector.X, -lookCF.LookVector.Z), 0)

        -- Attack on cooldown
        local now = tick()
        if now - self.LastAttackTime >= self.Config.AttackCooldown then
          self.LastAttackTime = now
          local targetHumanoid = self.Target:FindFirstChildOfClass("Humanoid")
          if targetHumanoid then
            targetHumanoid:TakeDamage(self.Config.AttackDamage)
          end
        end
      end

    elseif self.State == "Return" then
      local dist = (self.RootPart.Position - self.SpawnPoint).Magnitude
      if dist < 5 then
        self:SetState("Idle")
        self.Humanoid.Health = self.Humanoid.MaxHealth  -- heal on return
      else
        self.Humanoid:MoveTo(self.SpawnPoint)
      end

    elseif self.State == "Dead" then
      -- Drop loot, play death animation, cleanup
      task.wait(3)
      self.Model:Destroy()
    end
  end

  -- Main NPC loop (server-side):
  local function runNPC(npcInstance, config)
    local npc = NPC.new(npcInstance, config)
    while npc.Model.Parent and npc.Humanoid.Health > 0 do
      npc:Update()
      task.wait(0.2)  -- update 5 times per second (balance between responsiveness and performance)
    end
  end

BEHAVIOR TREE PATTERN:
- More flexible than state machines for complex AI. Uses tree nodes:
  -- Node types: Selector (OR), Sequence (AND), Action (leaf), Condition (check)

  local BehaviorTree = {}

  -- Selector: tries children left-to-right, returns SUCCESS on first success
  function BehaviorTree.Selector(children)
    return function(npc)
      for _, child in ipairs(children) do
        local result = child(npc)
        if result == "SUCCESS" then return "SUCCESS" end
      end
      return "FAILURE"
    end
  end

  -- Sequence: runs children left-to-right, returns FAILURE on first failure
  function BehaviorTree.Sequence(children)
    return function(npc)
      for _, child in ipairs(children) do
        local result = child(npc)
        if result == "FAILURE" then return "FAILURE" end
      end
      return "SUCCESS"
    end
  end

  -- Condition nodes
  function BehaviorTree.IsPlayerNearby(range)
    return function(npc)
      local _, dist = npc:FindNearestPlayer()
      return dist and dist < range and "SUCCESS" or "FAILURE"
    end
  end

  function BehaviorTree.HasLineOfSight()
    return function(npc)
      return npc.Target and npc:HasLineOfSight(npc.Target) and "SUCCESS" or "FAILURE"
    end
  end

  function BehaviorTree.IsHealthLow(threshold)
    return function(npc)
      return (npc.Humanoid.Health / npc.Humanoid.MaxHealth) < threshold and "SUCCESS" or "FAILURE"
    end
  end

  -- Action nodes
  function BehaviorTree.ChaseTarget()
    return function(npc)
      if not npc.Target then return "FAILURE" end
      local targetPart = npc.Target:FindFirstChild("HumanoidRootPart")
      if not targetPart then return "FAILURE" end
      npc.Humanoid:MoveTo(targetPart.Position)
      return "SUCCESS"
    end
  end

  function BehaviorTree.AttackTarget()
    return function(npc)
      if not npc.Target then return "FAILURE" end
      local now = tick()
      if now - npc.LastAttackTime >= npc.Config.AttackCooldown then
        npc.LastAttackTime = now
        local hum = npc.Target:FindFirstChildOfClass("Humanoid")
        if hum then hum:TakeDamage(npc.Config.AttackDamage) end
        return "SUCCESS"
      end
      return "FAILURE"
    end
  end

  function BehaviorTree.Patrol()
    return function(npc)
      if #npc.PatrolPoints == 0 then return "FAILURE" end
      local point = npc.PatrolPoints[npc.CurrentPatrolIndex]
      local dist = (npc.RootPart.Position - point).Magnitude
      if dist < 4 then
        npc.CurrentPatrolIndex = (npc.CurrentPatrolIndex % #npc.PatrolPoints) + 1
      end
      npc.Humanoid:MoveTo(point)
      return "SUCCESS"
    end
  end

  function BehaviorTree.Flee()
    return function(npc)
      if not npc.Target then return "FAILURE" end
      local targetPart = npc.Target:FindFirstChild("HumanoidRootPart")
      if not targetPart then return "FAILURE" end
      local fleeDirection = (npc.RootPart.Position - targetPart.Position).Unit
      local fleeTarget = npc.RootPart.Position + fleeDirection * 30
      npc.Humanoid:MoveTo(fleeTarget)
      return "SUCCESS"
    end
  end

  function BehaviorTree.ReturnToSpawn()
    return function(npc)
      npc.Humanoid:MoveTo(npc.SpawnPoint)
      return "SUCCESS"
    end
  end

  -- Build a behavior tree:
  local enemyTree = BehaviorTree.Selector({
    -- Priority 1: Flee if low health
    BehaviorTree.Sequence({
      BehaviorTree.IsHealthLow(0.2),
      BehaviorTree.Flee(),
    }),
    -- Priority 2: Attack if in range and has LOS
    BehaviorTree.Sequence({
      BehaviorTree.IsPlayerNearby(5),
      BehaviorTree.HasLineOfSight(),
      BehaviorTree.AttackTarget(),
    }),
    -- Priority 3: Chase if player detected
    BehaviorTree.Sequence({
      BehaviorTree.IsPlayerNearby(50),
      BehaviorTree.HasLineOfSight(),
      BehaviorTree.ChaseTarget(),
    }),
    -- Priority 4: Patrol
    BehaviorTree.Patrol(),
  })

  -- Run tree each tick:
  while npc.Humanoid.Health > 0 do
    enemyTree(npc)
    task.wait(0.2)
  end

PATROL SYSTEMS:
- Waypoint-based patrol:
  local function setupPatrol(npc, waypointFolder)
    local points = {}
    for _, wp in ipairs(waypointFolder:GetChildren()) do
      if wp:IsA("BasePart") then
        table.insert(points, wp.Position)
      end
    end
    -- Sort by name for ordered patrol (Name: "1", "2", "3"...)
    table.sort(points, function(a, b)
      return a.Name < b.Name
    end)
    npc.PatrolPoints = points
  end

- Random wander within area:
  local function randomWander(npc, center, radius)
    local angle = math.random() * math.pi * 2
    local dist = math.random() * radius
    local target = center + Vector3.new(
      math.cos(angle) * dist,
      0,
      math.sin(angle) * dist
    )
    -- Raycast down to find ground
    local rayResult = workspace:Raycast(
      target + Vector3.new(0, 50, 0),
      Vector3.new(0, -100, 0),
      RaycastParams.new()
    )
    if rayResult then
      target = rayResult.Position
    end
    npc.Humanoid:MoveTo(target)
  end

- Area-bounded patrol (stay within a part):
  local function isInBounds(position, boundsPart)
    local relative = boundsPart.CFrame:PointToObjectSpace(position)
    local halfSize = boundsPart.Size / 2
    return math.abs(relative.X) <= halfSize.X
      and math.abs(relative.Z) <= halfSize.Z
  end

SHOPKEEPER NPC:
- ProximityPrompt-based interaction:
  local function createShopkeeper(npcModel, shopItems)
    local rootPart = npcModel:FindFirstChild("HumanoidRootPart")
    if not rootPart then return end

    local prompt = Instance.new("ProximityPrompt")
    prompt.ObjectText = npcModel.Name
    prompt.ActionText = "Talk"
    prompt.MaxActivationDistance = 10
    prompt.HoldDuration = 0
    prompt.RequiresLineOfSight = false
    prompt.Parent = rootPart

    prompt.Triggered:Connect(function(player)
      -- Fire remote to open shop GUI on client
      game.ReplicatedStorage.ShopRemote:FireClient(player, {
        NPCName = npcModel.Name,
        Items = shopItems,
      })
    end)

    -- NPC looks at nearest player
    local RunService = game:GetService("RunService")
    RunService.Heartbeat:Connect(function()
      local nearest = nil
      local nearestDist = 15

      for _, player in ipairs(game:GetService("Players"):GetPlayers()) do
        local char = player.Character
        if char then
          local hrp = char:FindFirstChild("HumanoidRootPart")
          if hrp then
            local dist = (hrp.Position - rootPart.Position).Magnitude
            if dist < nearestDist then
              nearest = hrp
              nearestDist = dist
            end
          end
        end
      end

      if nearest then
        local lookPos = Vector3.new(nearest.Position.X, rootPart.Position.Y, nearest.Position.Z)
        rootPart.CFrame = CFrame.lookAt(rootPart.Position, lookPos)
      end
    end)
  end

QUEST GIVER NPC:
- Quest state tracking with dialogue:
  local QuestGiver = {}

  function QuestGiver.new(npcModel, questData)
    -- questData = {
    --   QuestId = "collect_gems",
    --   Title = "Gem Collector",
    --   Description = "Collect 10 gems from the cave.",
    --   Objective = {Type = "collect", Item = "Gem", Amount = 10},
    --   Rewards = {XP = 100, Gold = 50},
    --   Dialogue = {
    --     NotStarted = "Hey adventurer! I need help collecting gems.",
    --     InProgress = "Still working on those gems? You have %d/%d so far.",
    --     Completed = "Amazing work! Here's your reward!",
    --     AlreadyDone = "Thanks again for the help!",
    --   },
    -- }

    local rootPart = npcModel:FindFirstChild("HumanoidRootPart")

    -- Exclamation mark indicator
    local indicator = Instance.new("BillboardGui")
    indicator.Size = UDim2.new(2, 0, 2, 0)
    indicator.StudsOffset = Vector3.new(0, 4, 0)
    indicator.AlwaysOnTop = true
    indicator.Parent = npcModel.Head

    local icon = Instance.new("TextLabel")
    icon.Size = UDim2.new(1, 0, 1, 0)
    icon.BackgroundTransparency = 1
    icon.Text = "!"
    icon.TextColor3 = Color3.fromRGB(255, 255, 0)
    icon.TextScaled = true
    icon.Font = Enum.Font.GothamBold
    icon.Parent = indicator

    local prompt = Instance.new("ProximityPrompt")
    prompt.ActionText = "Talk"
    prompt.MaxActivationDistance = 10
    prompt.Parent = rootPart

    prompt.Triggered:Connect(function(player)
      local questState = getPlayerQuestState(player, questData.QuestId)

      if questState == "not_started" then
        -- Show quest offer dialogue
        game.ReplicatedStorage.DialogueRemote:FireClient(player, {
          NPC = npcModel.Name,
          Text = questData.Dialogue.NotStarted,
          Options = {"Accept", "Decline"},
          QuestId = questData.QuestId,
        })
      elseif questState == "in_progress" then
        local progress = getQuestProgress(player, questData.QuestId)
        game.ReplicatedStorage.DialogueRemote:FireClient(player, {
          NPC = npcModel.Name,
          Text = string.format(questData.Dialogue.InProgress, progress, questData.Objective.Amount),
        })
      elseif questState == "ready_to_complete" then
        grantRewards(player, questData.Rewards)
        markQuestComplete(player, questData.QuestId)
        game.ReplicatedStorage.DialogueRemote:FireClient(player, {
          NPC = npcModel.Name,
          Text = questData.Dialogue.Completed,
        })
        icon.Text = ""  -- remove indicator for this player
      else
        game.ReplicatedStorage.DialogueRemote:FireClient(player, {
          NPC = npcModel.Name,
          Text = questData.Dialogue.AlreadyDone,
        })
      end
    end)
  end

DIALOGUE SYSTEM:
- Branching conversation tree:
  -- Dialogue tree structure:
  local dialogueTree = {
    start = {
      Speaker = "Elder",
      Text = "Welcome, traveler. What brings you to our village?",
      Options = {
        {Text = "I'm looking for work.", Next = "work"},
        {Text = "I'm just passing through.", Next = "passing"},
        {Text = "I heard there's danger nearby.", Next = "danger"},
      },
    },
    work = {
      Speaker = "Elder",
      Text = "Excellent! We need someone to clear the monsters from the north cave.",
      Options = {
        {Text = "I'll do it!", Next = "accept_quest", Action = "start_quest_cave"},
        {Text = "What's the reward?", Next = "reward_info"},
        {Text = "Nevermind.", Next = "end"},
      },
    },
    passing = {
      Speaker = "Elder",
      Text = "Safe travels then. Come back if you change your mind.",
      Options = {
        {Text = "Actually, do you need help?", Next = "work"},
        {Text = "Goodbye.", Next = "end"},
      },
    },
    danger = {
      Speaker = "Elder",
      Text = "Indeed. Dark creatures have been emerging from the northern cave...",
      Options = {
        {Text = "I can handle them.", Next = "work"},
        {Text = "That sounds terrifying.", Next = "end"},
      },
    },
    reward_info = {
      Speaker = "Elder",
      Text = "100 gold coins and a rare enchanted sword.",
      Options = {
        {Text = "Deal!", Next = "accept_quest", Action = "start_quest_cave"},
        {Text = "Not enough.", Next = "end"},
      },
    },
    accept_quest = {
      Speaker = "Elder",
      Text = "Brave soul! Head north and enter the cave. Return when the threat is eliminated.",
      Options = {
        {Text = "On my way!", Next = "end"},
      },
    },
  }

  -- Server-side dialogue handler:
  game.ReplicatedStorage.DialogueChoice.OnServerEvent:Connect(function(player, npcName, choiceIndex)
    local currentNode = playerDialogueState[player]
    if not currentNode then return end

    local option = currentNode.Options[choiceIndex]
    if not option then return end

    if option.Action then
      executeDialogueAction(player, option.Action)
    end

    if option.Next == "end" then
      playerDialogueState[player] = nil
      return
    end

    local nextNode = dialogueTree[option.Next]
    playerDialogueState[player] = nextNode
    game.ReplicatedStorage.DialogueRemote:FireClient(player, nextNode)
  end)

NPC SPAWNING SYSTEM:
- Spawn points with respawn timers:
  local SpawnSystem = {}

  function SpawnSystem.new(spawnFolder)
    local self = {}
    self.SpawnPoints = {}
    self.ActiveNPCs = {}

    for _, spawnPart in ipairs(spawnFolder:GetChildren()) do
      if spawnPart:IsA("BasePart") then
        table.insert(self.SpawnPoints, {
          Position = spawnPart.Position,
          NPCTemplate = spawnPart:GetAttribute("NPCTemplate"),
          RespawnTime = spawnPart:GetAttribute("RespawnTime") or 30,
          MaxCount = spawnPart:GetAttribute("MaxCount") or 1,
          CurrentCount = 0,
          Active = true,
        })
      end
    end

    function self:SpawnNPC(spawnPoint)
      if spawnPoint.CurrentCount >= spawnPoint.MaxCount then return end

      local template = game.ServerStorage.NPCTemplates:FindFirstChild(spawnPoint.NPCTemplate)
      if not template then return end

      local npcClone = template:Clone()
      npcClone:PivotTo(CFrame.new(spawnPoint.Position + Vector3.new(0, 3, 0)))
      npcClone.Parent = workspace.NPCs

      spawnPoint.CurrentCount = spawnPoint.CurrentCount + 1

      -- Handle death -> respawn
      local humanoid = npcClone:FindFirstChildOfClass("Humanoid")
      if humanoid then
        humanoid.Died:Connect(function()
          spawnPoint.CurrentCount = spawnPoint.CurrentCount - 1
          task.wait(spawnPoint.RespawnTime)
          if spawnPoint.Active then
            self:SpawnNPC(spawnPoint)
          end
        end)
      end

      return npcClone
    end

    function self:SpawnAll()
      for _, sp in ipairs(self.SpawnPoints) do
        for i = 1, sp.MaxCount do
          self:SpawnNPC(sp)
        end
      end
    end

    return self
  end

- Wave-based spawning:
  local function runWaveSpawner(config)
    -- config = {
    --   Waves = {
    --     {NPCs = {"Zombie", "Zombie", "Zombie"}, Delay = 5},
    --     {NPCs = {"Zombie", "Zombie", "Skeleton", "Skeleton"}, Delay = 10},
    --     {NPCs = {"Skeleton", "Skeleton", "Boss"}, Delay = 15},
    --   },
    --   SpawnPoints = {Vector3.new(10, 0, 10), Vector3.new(-10, 0, 10)},
    -- }

    for waveNum, wave in ipairs(config.Waves) do
      -- Announce wave
      game.ReplicatedStorage.WaveAnnounce:FireAllClients(waveNum, #config.Waves)

      task.wait(3) -- countdown

      for _, npcName in ipairs(wave.NPCs) do
        local template = game.ServerStorage.NPCTemplates:FindFirstChild(npcName)
        if template then
          local clone = template:Clone()
          local spawnPos = config.SpawnPoints[math.random(1, #config.SpawnPoints)]
          clone:PivotTo(CFrame.new(spawnPos + Vector3.new(0, 3, 0)))
          clone.Parent = workspace.NPCs
          task.wait(0.5)  -- stagger spawns
        end
      end

      -- Wait for all NPCs dead
      while #workspace.NPCs:GetChildren() > 0 do
        task.wait(1)
      end

      if waveNum < #config.Waves then
        task.wait(wave.Delay)
      end
    end
  end

NPC ANIMATION:
- Setting up NPC animations:
  local function setupNPCAnimations(npc)
    local humanoid = npc:FindFirstChildOfClass("Humanoid")
    local animator = humanoid:FindFirstChildOfClass("Animator")
    if not animator then
      animator = Instance.new("Animator")
      animator.Parent = humanoid
    end

    local animations = {
      Idle = "rbxassetid://507766666",
      Walk = "rbxassetid://507777826",
      Run = "rbxassetid://507767714",
      Attack = "rbxassetid://507768375",
    }

    local tracks = {}
    for name, id in pairs(animations) do
      local anim = Instance.new("Animation")
      anim.AnimationId = id
      tracks[name] = animator:LoadAnimation(anim)
    end

    tracks.Idle.Priority = Enum.AnimationPriority.Idle
    tracks.Idle.Looped = true
    tracks.Walk.Priority = Enum.AnimationPriority.Movement
    tracks.Walk.Looped = true
    tracks.Run.Priority = Enum.AnimationPriority.Movement
    tracks.Run.Looped = true
    tracks.Attack.Priority = Enum.AnimationPriority.Action

    tracks.Idle:Play()  -- start in idle

    return tracks
  end

  -- Switch animations based on state:
  local function updateNPCAnimation(tracks, state, speed)
    if state == "Idle" then
      if tracks.Walk.IsPlaying then tracks.Walk:Stop() end
      if tracks.Run.IsPlaying then tracks.Run:Stop() end
      if not tracks.Idle.IsPlaying then tracks.Idle:Play() end
    elseif state == "Patrol" then
      if tracks.Run.IsPlaying then tracks.Run:Stop() end
      if not tracks.Walk.IsPlaying then tracks.Walk:Play() end
    elseif state == "Chase" then
      if tracks.Walk.IsPlaying then tracks.Walk:Stop() end
      if not tracks.Run.IsPlaying then tracks.Run:Play() end
    elseif state == "Attack" then
      tracks.Attack:Play()
    end
  end

BOSS MECHANICS:
- Phase-based boss with health thresholds:
  local Boss = {}
  Boss.__index = Boss

  function Boss.new(model, config)
    local self = setmetatable({}, Boss)
    self.Model = model
    self.Humanoid = model:FindFirstChildOfClass("Humanoid")
    self.RootPart = model:FindFirstChild("HumanoidRootPart")
    self.Phase = 1
    self.Config = config or {
      MaxHealth = 1000,
      Phases = {
        {Threshold = 1.0, Speed = 16, AttackDamage = 20, AttackCooldown = 2, Abilities = {"Slash"}},
        {Threshold = 0.6, Speed = 20, AttackDamage = 30, AttackCooldown = 1.5, Abilities = {"Slash", "Spin"}},
        {Threshold = 0.3, Speed = 24, AttackDamage = 40, AttackCooldown = 1, Abilities = {"Slash", "Spin", "Stomp"}},
      },
    }
    self.Humanoid.MaxHealth = config.MaxHealth or 1000
    self.Humanoid.Health = self.Humanoid.MaxHealth
    return self
  end

  function Boss:CheckPhaseTransition()
    local healthPercent = self.Humanoid.Health / self.Humanoid.MaxHealth
    local newPhase = 1

    for i, phase in ipairs(self.Config.Phases) do
      if healthPercent <= phase.Threshold then
        newPhase = i
      end
    end

    if newPhase ~= self.Phase then
      self.Phase = newPhase
      local phaseData = self.Config.Phases[newPhase]
      self.Humanoid.WalkSpeed = phaseData.Speed

      -- Phase transition effects
      game.ReplicatedStorage.BossPhaseChange:FireAllClients(self.Model, newPhase)

      -- Brief invulnerability during transition
      self.Humanoid.Health = self.Humanoid.Health  -- prevent damage during transition anim
    end
  end

  function Boss:UseAbility(abilityName)
    if abilityName == "Slash" then
      -- Forward slash damage in cone
      local hitbox = self.RootPart.CFrame * CFrame.new(0, 0, -5)
      -- Damage players within 8 studs in front
    elseif abilityName == "Spin" then
      -- AoE spin attack (360 degrees)
      -- Damage all players within 10 studs
    elseif abilityName == "Stomp" then
      -- Ground pound with shockwave
      -- Damage all players within 15 studs, knockback
    end
  end

FRIENDLY NPC (FOLLOWER/COMPANION):
- NPC that follows the player:
  local function createFollower(npcModel, ownerPlayer)
    local humanoid = npcModel:FindFirstChildOfClass("Humanoid")
    local rootPart = npcModel:FindFirstChild("HumanoidRootPart")
    humanoid.WalkSpeed = 20

    local followDistance = 5
    local maxDistance = 50

    task.spawn(function()
      while npcModel.Parent do
        local char = ownerPlayer.Character
        if char then
          local ownerPart = char:FindFirstChild("HumanoidRootPart")
          if ownerPart then
            local dist = (ownerPart.Position - rootPart.Position).Magnitude

            if dist > maxDistance then
              -- Teleport to owner if too far
              npcModel:PivotTo(ownerPart.CFrame * CFrame.new(0, 0, 5))
            elseif dist > followDistance then
              -- Walk toward owner
              humanoid:MoveTo(ownerPart.Position)
            end
          end
        end
        task.wait(0.3)
      end
    end)
  end

PERFORMANCE OPTIMIZATION:
- NPC sleep/freeze system for distant NPCs:
  local Players = game:GetService("Players")
  local RunService = game:GetService("RunService")

  local ACTIVE_RANGE = 100     -- studs: full AI behavior
  local REDUCED_RANGE = 200    -- studs: reduced update rate
  local SLEEP_RANGE = 200      -- studs: beyond this = frozen

  local function getNearestPlayerDistance(npcPosition)
    local nearest = math.huge
    for _, player in ipairs(Players:GetPlayers()) do
      local char = player.Character
      if char then
        local hrp = char:FindFirstChild("HumanoidRootPart")
        if hrp then
          local dist = (hrp.Position - npcPosition).Magnitude
          if dist < nearest then
            nearest = dist
          end
        end
      end
    end
    return nearest
  end

  local function updateNPCLOD(npc)
    local dist = getNearestPlayerDistance(npc.RootPart.Position)

    if dist <= ACTIVE_RANGE then
      npc.UpdateRate = 0.2        -- 5 updates per second
      npc.AnimationsEnabled = true
      npc.PathfindingEnabled = true
    elseif dist <= REDUCED_RANGE then
      npc.UpdateRate = 1.0        -- 1 update per second
      npc.AnimationsEnabled = true
      npc.PathfindingEnabled = false  -- use simple MoveTo
    else
      npc.UpdateRate = 5.0        -- 1 update per 5 seconds
      npc.AnimationsEnabled = false
      npc.PathfindingEnabled = false
      -- Optionally anchor the NPC to prevent physics cost
    end
  end

- NPC pooling: reuse NPC instances instead of creating/destroying.
  local NPCPool = {}

  function NPCPool.new(template, poolSize)
    local self = {}
    self.Available = {}
    self.Active = {}

    for i = 1, poolSize do
      local clone = template:Clone()
      clone.Parent = game.ServerStorage  -- hidden
      table.insert(self.Available, clone)
    end

    function self:Get()
      local npc = table.remove(self.Available)
      if not npc then return nil end  -- pool exhausted
      table.insert(self.Active, npc)
      npc.Parent = workspace.NPCs
      return npc
    end

    function self:Return(npc)
      for i, active in ipairs(self.Active) do
        if active == npc then
          table.remove(self.Active, i)
          break
        end
      end
      -- Reset NPC state
      local hum = npc:FindFirstChildOfClass("Humanoid")
      if hum then
        hum.Health = hum.MaxHealth
      end
      npc.Parent = game.ServerStorage
      table.insert(self.Available, npc)
    end

    return self
  end

- Server performance targets:
  - 50 NPCs with full AI (pathfinding + state machine): keep server under 40ms/frame
  - 100+ NPCs: use LOD system (only nearest 20-30 have full AI)
  - PathfindingService:ComputeAsync is expensive. Cache paths, recompute only when blocked
    or every 2-3 seconds, not every frame.
  - Humanoid:MoveTo() is cheaper than pathfinding. For short distances (< 20 studs),
    use MoveTo directly instead of computing a full path.
  - Use CollectionService tags to batch-process NPCs efficiently.
`

// ── Section Tags for Matching ───────────────────────────────────────────────

interface NPCSection {
  name: string
  keywords: string[]
  startMarker: string
  endMarker: string
}

const NPC_SECTIONS: NPCSection[] = [
  {
    name: 'pathfinding_fundamentals',
    keywords: [
      'pathfinding', 'pathfindingservice', 'createpath', 'computeasync',
      'waypoint', 'agent radius', 'agent height', 'navigation', 'navmesh',
      'pathfinding modifier', 'pathfinding link', 'path cost',
    ],
    startMarker: 'PATHFINDINGSERVICE FUNDAMENTALS:',
    endMarker: 'BASIC NPC MOVEMENT:',
  },
  {
    name: 'basic_npc_movement',
    keywords: [
      'npc movement', 'moveto', 'walk to', 'npc walk', 'npc follow path',
      'humanoid moveto', 'npc speed', 'walkspeed',
    ],
    startMarker: 'BASIC NPC MOVEMENT:',
    endMarker: 'NPC STATE MACHINE PATTERN:',
  },
  {
    name: 'state_machine',
    keywords: [
      'state machine', 'npc state', 'idle state', 'patrol state', 'chase state',
      'attack state', 'return state', 'npc ai', 'enemy ai', 'aggro', 'deaggro',
      'detection', 'line of sight', 'npc behavior',
    ],
    startMarker: 'NPC STATE MACHINE PATTERN:',
    endMarker: 'BEHAVIOR TREE PATTERN:',
  },
  {
    name: 'behavior_tree',
    keywords: [
      'behavior tree', 'selector', 'sequence', 'decorator', 'condition node',
      'action node', 'bt', 'tree node', 'decision tree', 'advanced ai',
    ],
    startMarker: 'BEHAVIOR TREE PATTERN:',
    endMarker: 'PATROL SYSTEMS:',
  },
  {
    name: 'patrol_system',
    keywords: [
      'patrol', 'waypoint patrol', 'wander', 'random walk', 'guard route',
      'sentry', 'patrol point', 'area patrol',
    ],
    startMarker: 'PATROL SYSTEMS:',
    endMarker: 'SHOPKEEPER NPC:',
  },
  {
    name: 'shopkeeper',
    keywords: [
      'shopkeeper', 'shop npc', 'vendor', 'merchant', 'proximity prompt',
      'npc shop', 'buy', 'sell', 'store npc', 'shop gui',
    ],
    startMarker: 'SHOPKEEPER NPC:',
    endMarker: 'QUEST GIVER NPC:',
  },
  {
    name: 'quest_giver',
    keywords: [
      'quest', 'quest giver', 'quest npc', 'mission', 'objective', 'quest state',
      'exclamation mark', 'quest indicator', 'quest reward', 'quest tracker',
    ],
    startMarker: 'QUEST GIVER NPC:',
    endMarker: 'DIALOGUE SYSTEM:',
  },
  {
    name: 'dialogue_system',
    keywords: [
      'dialogue', 'dialog', 'conversation', 'npc talk', 'branching dialogue',
      'dialogue tree', 'npc text', 'response', 'dialogue choice', 'speech',
    ],
    startMarker: 'DIALOGUE SYSTEM:',
    endMarker: 'NPC SPAWNING SYSTEM:',
  },
  {
    name: 'spawning_system',
    keywords: [
      'spawn', 'respawn', 'spawn point', 'wave', 'wave spawner', 'spawn system',
      'npc spawn', 'enemy spawn', 'mob spawn', 'spawn timer',
    ],
    startMarker: 'NPC SPAWNING SYSTEM:',
    endMarker: 'NPC ANIMATION:',
  },
  {
    name: 'npc_animation',
    keywords: [
      'npc animation', 'npc walk animation', 'npc idle', 'npc attack animation',
      'enemy animation', 'animate npc', 'npc run',
    ],
    startMarker: 'NPC ANIMATION:',
    endMarker: 'BOSS MECHANICS:',
  },
  {
    name: 'boss_mechanics',
    keywords: [
      'boss', 'boss fight', 'boss phase', 'boss health', 'phase transition',
      'special attack', 'boss ability', 'boss battle', 'raid boss', 'mini boss',
    ],
    startMarker: 'BOSS MECHANICS:',
    endMarker: 'FRIENDLY NPC (FOLLOWER/COMPANION):',
  },
  {
    name: 'companion_npc',
    keywords: [
      'follower', 'companion', 'pet ai', 'friendly npc', 'ally', 'follow player',
      'helper npc', 'heal bot', 'support npc',
    ],
    startMarker: 'FRIENDLY NPC (FOLLOWER/COMPANION):',
    endMarker: 'PERFORMANCE OPTIMIZATION:',
  },
  {
    name: 'npc_performance',
    keywords: [
      'npc performance', 'npc pool', 'npc lod', 'sleep npc', 'freeze npc',
      'distant npc', 'optimize npc', 'npc limit', 'server performance',
      'collection service npc', 'batch npc',
    ],
    startMarker: 'PERFORMANCE OPTIMIZATION:',
    endMarker: '(END)',
  },
]

// ── Relevance Matching Function ─────────────────────────────────────────────

/**
 * Returns only the NPC knowledge sections relevant to the user's prompt.
 * Matches keywords against the lowercased prompt. Returns max 3 sections.
 */
export function getRelevantNPCKnowledge(prompt: string): string {
  const lower = prompt.toLowerCase()

  const scored = NPC_SECTIONS.map((section) => {
    let score = 0
    for (const kw of section.keywords) {
      if (lower.includes(kw)) {
        score += kw.includes(' ') ? 3 : 1
      }
    }
    return { section, score }
  })

  scored.sort((a, b) => b.score - a.score)

  const selected = scored.filter((s) => s.score > 0).slice(0, 3)

  if (selected.length === 0) {
    return '' // no match — don't inject NPC knowledge
  }

  return extractNPCSections(selected.map((s) => s.section))
}

function extractNPCSections(sections: NPCSection[]): string {
  const fullText = NPC_KNOWLEDGE
  const parts: string[] = [
    '=== NPC KNOWLEDGE (matched to your request) ===\n',
  ]

  for (const section of sections) {
    const startIdx = fullText.indexOf(section.startMarker)
    if (startIdx === -1) continue

    let endIdx: number
    if (section.endMarker === '(END)') {
      endIdx = fullText.length
    } else {
      endIdx = fullText.indexOf(section.endMarker, startIdx)
      if (endIdx === -1) endIdx = fullText.length
    }

    parts.push(fullText.slice(startIdx, endIdx).trim())
    parts.push('')
  }

  return parts.join('\n')
}
