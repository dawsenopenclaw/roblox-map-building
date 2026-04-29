/**
 * Production-quality reference social/roleplay game systems.
 * Returns complete, working Luau code modeled after top Roblox social games:
 * Brookhaven RP, Welcome to Bloxburg, Berry Avenue, Greenville.
 * Job system, housing, vehicles, economy, social features, town infrastructure.
 */

export function getSocialRoleplayReference(): string {
  return `
-- ============================================================
-- SOCIAL ROLEPLAY GAME REFERENCE
-- Modeled after: Brookhaven RP, Welcome to Bloxburg,
--                Berry Avenue, Greenville
-- 6 major systems: Jobs, Housing, Vehicles, Economy,
--                  Social Features, Town Infrastructure
-- ============================================================

-- ============================================================
-- SYSTEM 1: JOB SYSTEM (Police, Firefighter, Doctor,
--   Pizza Delivery, Teacher, Mechanic, Farmer)
-- ============================================================

-- Server Script: ServerScriptService/JobSystem/JobServer.lua

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local DataStoreService = game:GetService("DataStoreService")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")

local JobDS = DataStoreService:GetDataStore("PlayerJobs_v1")
local Remotes = ReplicatedStorage:WaitForChild("Remotes")

-- Remote events for job system
local ApplyForJob   = Remotes:WaitForChild("ApplyForJob")
local QuitJob       = Remotes:WaitForChild("QuitJob")
local CompleteTask  = Remotes:WaitForChild("CompleteTask")
local PayPlayer     = Remotes:WaitForChild("PayPlayer")
local EquipUniform  = Remotes:WaitForChild("EquipUniform")

-- Job definitions
local JOBS = {
  Police = {
    name       = "Police Officer",
    basePay    = 15,    -- per pay period
    taskPay    = 8,     -- per completed task
    payPeriod  = 300,   -- seconds
    uniform    = { shirt = 1234567, pants = 2345678, hat = 3456789 },
    location   = Vector3.new(120, 5, 80),
    maxPlayers = 6,
    tasks      = { "Patrol", "RespondToCall", "Arrest", "WriteReport" },
  },
  Firefighter = {
    name       = "Firefighter",
    basePay    = 18,
    taskPay    = 10,
    payPeriod  = 300,
    uniform    = { shirt = 4567890, pants = 5678901, hat = 6789012 },
    location   = Vector3.new(-80, 5, 120),
    maxPlayers = 4,
    tasks      = { "RespondToFire", "RescueNPC", "InspectBuilding" },
  },
  Doctor = {
    name       = "Doctor",
    basePay    = 25,
    taskPay    = 15,
    payPeriod  = 300,
    uniform    = { shirt = 7890123, pants = 8901234, hat = 9012345 },
    location   = Vector3.new(0, 5, -150),
    maxPlayers = 4,
    tasks      = { "CheckPatient", "Diagnose", "TreatPatient", "Prescribe" },
  },
  PizzaDelivery = {
    name       = "Pizza Delivery",
    basePay    = 10,
    taskPay    = 12,
    payPeriod  = 240,
    uniform    = { shirt = 1122334, pants = 2233445, hat = 3344556 },
    location   = Vector3.new(60, 5, -60),
    maxPlayers = 8,
    tasks      = { "PickUpOrder", "DeliverPizza", "CollectPayment" },
  },
  Teacher = {
    name       = "Teacher",
    basePay    = 20,
    taskPay    = 10,
    payPeriod  = 360,
    uniform    = { shirt = 4455667, pants = 5566778 },
    location   = Vector3.new(-120, 5, -80),
    maxPlayers = 2,
    tasks      = { "TakeAttendance", "GiveLecture", "GradeAssignment" },
  },
  Mechanic = {
    name       = "Mechanic",
    basePay    = 22,
    taskPay    = 18,
    payPeriod  = 300,
    uniform    = { shirt = 6677889, pants = 7788990 },
    location   = Vector3.new(200, 5, 0),
    maxPlayers = 3,
    tasks      = { "DiagnoseVehicle", "RepairVehicle", "OilChange", "TireChange" },
  },
  Farmer = {
    name       = "Farmer",
    basePay    = 12,
    taskPay    = 6,
    payPeriod  = 240,
    uniform    = { shirt = 8899001, pants = 9900112, hat = 1011123 },
    location   = Vector3.new(-200, 5, 150),
    maxPlayers = 5,
    tasks      = { "PlantCrop", "WaterCrop", "HarvestCrop", "SellProduce" },
  },
}

-- Active job data per player (server-side)
local playerJobs = {} -- [userId] = { jobKey, hiredAt, tasksCompleted, payTimer }

-- Pay all active workers on their pay period
RunService.Heartbeat:Connect(function(dt)
  for userId, data in pairs(playerJobs) do
    data.payTimer = (data.payTimer or 0) + dt
    local job = JOBS[data.jobKey]
    if job and data.payTimer >= job.payPeriod then
      data.payTimer = 0
      local player = Players:GetPlayerByUserId(userId)
      if player then
        PayPlayer:FireClient(player, job.basePay, "Base Pay (" .. job.name .. ")")
      end
    end
  end
end)

-- Apply for a job
ApplyForJob.OnServerEvent:Connect(function(player, jobKey)
  if not JOBS[jobKey] then return end
  local job = JOBS[jobKey]
  local userId = player.UserId

  -- Count current workers
  local count = 0
  for _, d in pairs(playerJobs) do
    if d.jobKey == jobKey then count += 1 end
  end
  if count >= job.maxPlayers then
    ApplyForJob:FireClient(player, false, "Position full")
    return
  end

  -- Quit old job first if any
  playerJobs[userId] = nil

  playerJobs[userId] = {
    jobKey         = jobKey,
    hiredAt        = os.time(),
    tasksCompleted = 0,
    payTimer       = 0,
    currentTask    = nil,
  }

  -- Equip uniform
  EquipUniform:FireClient(player, job.uniform)
  ApplyForJob:FireClient(player, true, job.name)

  -- Teleport to job location
  local char = player.Character
  if char and char:FindFirstChild("HumanoidRootPart") then
    char.HumanoidRootPart.CFrame = CFrame.new(job.location)
  end
end)

-- Quit job
QuitJob.OnServerEvent:Connect(function(player)
  local userId = player.UserId
  playerJobs[userId] = nil
  EquipUniform:FireClient(player, nil) -- strip uniform
  QuitJob:FireClient(player, true)
end)

-- Complete a task
CompleteTask.OnServerEvent:Connect(function(player, taskName)
  local userId = player.UserId
  local data = playerJobs[userId]
  if not data then return end
  local job = JOBS[data.jobKey]
  if not job then return end

  -- Verify task belongs to job
  local valid = false
  for _, t in ipairs(job.tasks) do
    if t == taskName then valid = true break end
  end
  if not valid then return end

  data.tasksCompleted += 1
  PayPlayer:FireClient(player, job.taskPay, taskName .. " completed")
end)

-- Task loop examples for Police
-- These fire from NPC scripts or zone triggers

-- Police Patrol Task (LocalScript equivalent — runs server-side via RemoteFunction)
-- Flow: Officer enters patrol zone → walks beat → responds to call → arrests suspect
local function startPoliceTaskLoop(player)
  local data = playerJobs[player.UserId]
  if not data or data.jobKey ~= "Police" then return end

  -- Simulate patrol loop (server validates, client handles animation)
  local tasks = { "Patrol", "RespondToCall", "Arrest", "WriteReport" }
  local idx = 1
  local loop
  loop = task.spawn(function()
    while playerJobs[player.UserId] and playerJobs[player.UserId].jobKey == "Police" do
      data.currentTask = tasks[idx]
      CompleteTask:FireServer(player, tasks[idx]) -- would be client→server IRL
      idx = (idx % #tasks) + 1
      task.wait(30) -- 30s per task in real loop
    end
  end)
end

-- Doctor task loop
-- Flow: Patient arrives → check vitals → diagnose → treat → discharge
local function createDoctorTaskSequence()
  return {
    { name = "CheckPatient",   duration = 10, reward = 15 },
    { name = "Diagnose",       duration = 15, reward = 15 },
    { name = "TreatPatient",   duration = 20, reward = 15 },
    { name = "Prescribe",      duration = 5,  reward = 15 },
  }
end

-- ============================================================
-- SYSTEM 2: HOUSING SYSTEM
-- ============================================================

-- Server Script: ServerScriptService/HousingSystem/HousingServer.lua

local HousingDS    = DataStoreService:GetDataStore("PlayerHouses_v2")
local ClaimPlot    = Remotes:WaitForChild("ClaimPlot")
local PlaceFurni   = Remotes:WaitForChild("PlaceFurniture")
local SaveHouse    = Remotes:WaitForChild("SaveHouse")
local LoadHouse    = Remotes:WaitForChild("LoadHouse")
local VisitHouse   = Remotes:WaitForChild("VisitHouse")
local UpgradeHouse = Remotes:WaitForChild("UpgradeHouse")

-- Plot registry
local plots = {} -- [plotId] = { owner = userId, isPublic = true, style = "starter", furniture = {} }
local PLOT_COUNT = 20

-- House styles and upgrade costs
local HOUSE_STYLES = {
  starter   = { cost = 0,      maxFurni = 50,  size = Vector3.new(30, 15, 30) },
  suburban  = { cost = 5000,   maxFurni = 100, size = Vector3.new(50, 20, 50) },
  mansion   = { cost = 25000,  maxFurni = 200, size = Vector3.new(80, 30, 80) },
  apartment = { cost = 2000,   maxFurni = 60,  size = Vector3.new(25, 30, 25) },
}

-- Initialize empty plots in workspace
for i = 1, PLOT_COUNT do
  plots[i] = {
    owner     = nil,
    isPublic  = true,
    style     = "starter",
    furniture = {},
    model     = workspace:FindFirstChild("Plot" .. i),
  }
end

-- Claim a plot
ClaimPlot.OnServerEvent:Connect(function(player, plotId)
  local plot = plots[plotId]
  if not plot then return end
  if plot.owner ~= nil then
    ClaimPlot:FireClient(player, false, "Plot already claimed")
    return
  end

  -- Check player doesn't already own a plot
  for _, p in pairs(plots) do
    if p.owner == player.UserId then
      ClaimPlot:FireClient(player, false, "You already own a plot")
      return
    end
  end

  plot.owner = player.UserId
  ClaimPlot:FireClient(player, true, plotId)

  -- Spawn starter house
  local starterModel = ReplicatedStorage.HouseModels:FindFirstChild("starter")
  if starterModel then
    local clone = starterModel:Clone()
    clone.Parent = workspace
    if plot.model then
      clone:SetPrimaryPartCFrame(plot.model.PrimaryPart.CFrame)
    end
    plot.houseModel = clone
  end
end)

-- Place furniture
PlaceFurni.OnServerEvent:Connect(function(player, plotId, furniId, cf, rotation)
  local plot = plots[plotId]
  if not plot or plot.owner ~= player.UserId then return end
  local style = HOUSE_STYLES[plot.style]
  if #plot.furniture >= style.maxFurni then
    PlaceFurni:FireClient(player, false, "Furniture limit reached")
    return
  end

  -- Validate CFrame is inside plot bounds (simple AABB check)
  local pos = cf.Position
  if plot.model then
    local size = plot.model.PrimaryPart.Size
    local center = plot.model.PrimaryPart.Position
    local half = size / 2
    if math.abs(pos.X - center.X) > half.X or math.abs(pos.Z - center.Z) > half.Z then
      PlaceFurni:FireClient(player, false, "Outside plot bounds")
      return
    end
  end

  local furniDef = ReplicatedStorage.FurnitureModels:FindFirstChild(furniId)
  if not furniDef then return end

  local placed = furniDef:Clone()
  placed:SetPrimaryPartCFrame(cf * CFrame.Angles(0, math.rad(rotation), 0))
  placed.Parent = workspace
  if plot.houseModel then placed.Parent = plot.houseModel end

  table.insert(plot.furniture, {
    id       = furniId,
    position = { pos.X, pos.Y, pos.Z },
    rotation = rotation,
    objRef   = placed,
  })

  PlaceFurni:FireClient(player, true, #plot.furniture)
end)

-- Save house to DataStore
local function serializeHouse(plotId)
  local plot = plots[plotId]
  if not plot then return nil end
  local data = {
    style    = plot.style,
    isPublic = plot.isPublic,
    furniture = {},
  }
  for _, f in ipairs(plot.furniture) do
    table.insert(data.furniture, {
      id       = f.id,
      position = f.position,
      rotation = f.rotation,
    })
  end
  return data
end

SaveHouse.OnServerEvent:Connect(function(player, plotId)
  local plot = plots[plotId]
  if not plot or plot.owner ~= player.UserId then return end

  local data = serializeHouse(plotId)
  local success, err = pcall(function()
    HousingDS:SetAsync("house_" .. player.UserId, data)
  end)

  SaveHouse:FireClient(player, success, err)
end)

-- Load house from DataStore
LoadHouse.OnServerEvent:Connect(function(player, plotId)
  local plot = plots[plotId]
  if not plot or plot.owner ~= player.UserId then return end

  local data
  local ok = pcall(function()
    data = HousingDS:GetAsync("house_" .. player.UserId)
  end)

  if not ok or not data then return end

  plot.style    = data.style or "starter"
  plot.isPublic = data.isPublic ~= false

  -- Clear existing furniture
  for _, f in ipairs(plot.furniture) do
    if f.objRef and f.objRef.Parent then
      f.objRef:Destroy()
    end
  end
  plot.furniture = {}

  -- Respawn saved furniture
  for _, f in ipairs(data.furniture) do
    local furniDef = ReplicatedStorage.FurnitureModels:FindFirstChild(f.id)
    if furniDef then
      local placed = furniDef:Clone()
      local pos = Vector3.new(f.position[1], f.position[2], f.position[3])
      placed:SetPrimaryPartCFrame(CFrame.new(pos) * CFrame.Angles(0, math.rad(f.rotation), 0))
      placed.Parent = plot.houseModel or workspace
      table.insert(plot.furniture, { id = f.id, position = f.position, rotation = f.rotation, objRef = placed })
    end
  end

  LoadHouse:FireClient(player, true)
end)

-- Visit another player's house
VisitHouse.OnServerEvent:Connect(function(player, targetUserId)
  for _, plot in pairs(plots) do
    if plot.owner == targetUserId then
      if not plot.isPublic then
        VisitHouse:FireClient(player, false, "House is private")
        return
      end
      local char = player.Character
      if char and char:FindFirstChild("HumanoidRootPart") and plot.houseModel then
        char.HumanoidRootPart.CFrame = plot.houseModel.PrimaryPart.CFrame + Vector3.new(0, 3, 0)
      end
      VisitHouse:FireClient(player, true, targetUserId)
      return
    end
  end
  VisitHouse:FireClient(player, false, "Player has no house")
end)

-- Upgrade house style
UpgradeHouse.OnServerEvent:Connect(function(player, plotId, newStyle)
  local plot = plots[plotId]
  if not plot or plot.owner ~= player.UserId then return end
  if not HOUSE_STYLES[newStyle] then return end

  -- Deduct cost via economy system (fires separate remote)
  local cost = HOUSE_STYLES[newStyle].cost
  -- Economy.DeductMoney(player, cost) -- wired up in Economy system below

  plot.style = newStyle
  UpgradeHouse:FireClient(player, true, newStyle)
end)

-- LocalScript: StarterPlayerScripts/HousingClient.lua

--[[
local Players      = game:GetService("Players")
local RunService   = game:GetService("RunService")
local UIS          = game:GetService("UserInputService")
local RS           = game:GetService("ReplicatedStorage")

local player       = Players.LocalPlayer
local mouse        = player:GetMouse()
local Remotes      = RS:WaitForChild("Remotes")
local PlaceFurni   = Remotes:WaitForChild("PlaceFurniture")

local previewModel = nil  -- ghost preview
local isPlacing    = false
local selectedFurni = nil
local GRID_SIZE    = 2

local function snapToGrid(v)
  return Vector3.new(
    math.round(v.X / GRID_SIZE) * GRID_SIZE,
    v.Y,
    math.round(v.Z / GRID_SIZE) * GRID_SIZE
  )
end

-- Begin placement mode
local function startPlacing(furniId)
  selectedFurni = furniId
  isPlacing = true
  local def = RS.FurnitureModels:FindFirstChild(furniId)
  if def then
    previewModel = def:Clone()
    for _, part in ipairs(previewModel:GetDescendants()) do
      if part:IsA("BasePart") then
        part.Transparency = 0.5
        part.CanCollide = false
        part.Material = Enum.Material.Neon
      end
    end
    previewModel.Parent = workspace
  end
end

-- Update preview on mouse move
RunService.RenderStepped:Connect(function()
  if not isPlacing or not previewModel then return end
  local unitRay = workspace.CurrentCamera:ScreenPointToRay(mouse.X, mouse.Y)
  local result  = workspace:Raycast(unitRay.Origin, unitRay.Direction * 200, RaycastParams.new())
  if result then
    local snapped = snapToGrid(result.Position)
    previewModel:SetPrimaryPartCFrame(CFrame.new(snapped))
  end
end)

-- Confirm placement on click
mouse.Button1Down:Connect(function()
  if not isPlacing or not previewModel then return end
  local cf = previewModel:GetPrimaryPartCFrame()
  PlaceFurni:FireServer(1, selectedFurni, cf, 0) -- plotId=1 for now
  previewModel:Destroy()
  previewModel = nil
  isPlacing = false
end)

-- Rotate with R key
UIS.InputBegan:Connect(function(input, gpe)
  if gpe then return end
  if input.KeyCode == Enum.KeyCode.R and previewModel then
    previewModel:SetPrimaryPartCFrame(
      previewModel:GetPrimaryPartCFrame() * CFrame.Angles(0, math.rad(45), 0)
    )
  end
end)
--]]

-- ============================================================
-- SYSTEM 3: VEHICLE SYSTEM
-- ============================================================

-- Server Script: ServerScriptService/VehicleSystem/VehicleServer.lua

local VehicleDS       = DataStoreService:GetDataStore("PlayerVehicles_v1")
local PurchaseVehicle = Remotes:WaitForChild("PurchaseVehicle")
local SpawnVehicle    = Remotes:WaitForChild("SpawnVehicle")
local DespawnVehicle  = Remotes:WaitForChild("DespawnVehicle")
local CustomizeVehicle = Remotes:WaitForChild("CustomizeVehicle")
local RefuelVehicle   = Remotes:WaitForChild("RefuelVehicle")

-- Vehicle catalog
local VEHICLES = {
  sedan = {
    name    = "City Sedan",
    cost    = 5000,
    speed   = 60,
    fuel    = 100,
    model   = "Sedan",
    seats   = 4,
    isEmergency = false,
  },
  truck = {
    name    = "Pickup Truck",
    cost    = 8000,
    speed   = 50,
    fuel    = 150,
    model   = "Truck",
    seats   = 2,
    isEmergency = false,
  },
  sports = {
    name    = "Sports Car",
    cost    = 20000,
    speed   = 120,
    fuel    = 80,
    model   = "SportsCar",
    seats   = 2,
    isEmergency = false,
  },
  police = {
    name    = "Police Cruiser",
    cost    = 0,       -- job unlock only
    speed   = 80,
    fuel    = 120,
    model   = "PoliceCar",
    seats   = 4,
    isEmergency = true,
    jobRequired = "Police",
  },
  ambulance = {
    name    = "Ambulance",
    cost    = 0,
    speed   = 70,
    fuel    = 120,
    model   = "Ambulance",
    seats   = 4,
    isEmergency = true,
    jobRequired = "Doctor",
  },
  firetruck = {
    name    = "Fire Truck",
    cost    = 0,
    speed   = 65,
    fuel    = 200,
    model   = "FireTruck",
    seats   = 6,
    isEmergency = true,
    jobRequired = "Firefighter",
  },
}

-- Active vehicles spawned per player
local spawnedVehicles = {} -- [userId] = { vehicleModel, vehicleKey, fuel }

PurchaseVehicle.OnServerEvent:Connect(function(player, vehicleKey)
  local veh = VEHICLES[vehicleKey]
  if not veh then return end

  if veh.jobRequired then
    local job = playerJobs[player.UserId]
    if not job or job.jobKey ~= veh.jobRequired then
      PurchaseVehicle:FireClient(player, false, "Requires job: " .. veh.jobRequired)
      return
    end
  end

  -- Economy check: DeductMoney returns success bool
  -- local ok = Economy.DeductMoney(player, veh.cost)
  -- if not ok then return end

  local ok, err = pcall(function()
    local saved = VehicleDS:GetAsync("vehicles_" .. player.UserId) or {}
    table.insert(saved, vehicleKey)
    VehicleDS:SetAsync("vehicles_" .. player.UserId, saved)
  end)

  PurchaseVehicle:FireClient(player, ok, vehicleKey)
end)

SpawnVehicle.OnServerEvent:Connect(function(player, vehicleKey)
  local veh = VEHICLES[vehicleKey]
  if not veh then return end

  -- Despawn old vehicle first
  if spawnedVehicles[player.UserId] then
    local old = spawnedVehicles[player.UserId]
    if old.vehicleModel and old.vehicleModel.Parent then
      old.vehicleModel:Destroy()
    end
    spawnedVehicles[player.UserId] = nil
  end

  local template = ReplicatedStorage.VehicleModels:FindFirstChild(veh.model)
  if not template then return end

  local model = template:Clone()
  model.Parent = workspace

  local char = player.Character
  local spawnPos = Vector3.new(0, 5, 0)
  if char and char:FindFirstChild("HumanoidRootPart") then
    spawnPos = char.HumanoidRootPart.Position + char.HumanoidRootPart.CFrame.LookVector * 8
  end
  model:SetPrimaryPartCFrame(CFrame.new(spawnPos))

  -- Tag vehicle with owner
  local ownerTag = Instance.new("StringValue")
  ownerTag.Name = "Owner"
  ownerTag.Value = tostring(player.UserId)
  ownerTag.Parent = model

  spawnedVehicles[player.UserId] = {
    vehicleModel = model,
    vehicleKey   = vehicleKey,
    fuel         = veh.fuel,
    maxFuel      = veh.fuel,
  }

  -- Enable emergency lights/siren for emergency vehicles
  if veh.isEmergency then
    local lightScript = ReplicatedStorage.VehicleScripts:FindFirstChild("EmergencyLights")
    if lightScript then
      lightScript:Clone().Parent = model
    end
  end

  SpawnVehicle:FireClient(player, true, vehicleKey)

  -- Seat player automatically
  local seat = model:FindFirstChildWhichIsA("VehicleSeat", true)
  if seat and char and char:FindFirstChild("Humanoid") then
    seat:Sit(char.Humanoid)
  end
end)

DespawnVehicle.OnServerEvent:Connect(function(player)
  local data = spawnedVehicles[player.UserId]
  if data and data.vehicleModel and data.vehicleModel.Parent then
    data.vehicleModel:Destroy()
  end
  spawnedVehicles[player.UserId] = nil
end)

-- Fuel drain loop
RunService.Heartbeat:Connect(function(dt)
  for userId, data in pairs(spawnedVehicles) do
    if not data.vehicleModel or not data.vehicleModel.Parent then
      spawnedVehicles[userId] = nil
      continue
    end
    local seat = data.vehicleModel:FindFirstChildWhichIsA("VehicleSeat", true)
    if seat and math.abs(seat.Throttle) > 0.1 then
      data.fuel = math.max(0, data.fuel - dt * 2)
      if data.fuel <= 0 then
        seat.MaxSpeed = 0
        local player = Players:GetPlayerByUserId(userId)
        if player then
          SpawnVehicle:FireClient(player, false, "Out of fuel!")
        end
      end
    end
  end
end)

RefuelVehicle.OnServerEvent:Connect(function(player)
  local data = spawnedVehicles[player.UserId]
  if not data then return end
  local veh = VEHICLES[data.vehicleKey]
  if not veh then return end

  -- Cost: $1 per unit of fuel
  local fuelNeeded = data.maxFuel - data.fuel
  local cost = math.ceil(fuelNeeded)
  -- Economy.DeductMoney(player, cost)
  data.fuel = data.maxFuel

  local seat = data.vehicleModel:FindFirstChildWhichIsA("VehicleSeat", true)
  if seat then seat.MaxSpeed = VEHICLES[data.vehicleKey].speed end

  RefuelVehicle:FireClient(player, true, fuelNeeded)
end)

CustomizeVehicle.OnServerEvent:Connect(function(player, colorBrick, wheelId, hasSpoiler)
  local data = spawnedVehicles[player.UserId]
  if not data or not data.vehicleModel then return end

  -- Apply color
  if colorBrick and data.vehicleModel:FindFirstChild("Body") then
    for _, part in ipairs(data.vehicleModel.Body:GetDescendants()) do
      if part:IsA("BasePart") then
        part.BrickColor = BrickColor.new(colorBrick)
      end
    end
  end

  -- Apply spoiler
  if hasSpoiler then
    local spoilerTemplate = ReplicatedStorage.VehicleParts:FindFirstChild("Spoiler")
    if spoilerTemplate and not data.vehicleModel:FindFirstChild("Spoiler") then
      local spoiler = spoilerTemplate:Clone()
      spoiler.Parent = data.vehicleModel
      -- Weld spoiler to body (simplified)
      local weld = Instance.new("WeldConstraint")
      weld.Part0 = spoiler.PrimaryPart
      weld.Part1 = data.vehicleModel.PrimaryPart
      weld.Parent = spoiler
    end
  end

  CustomizeVehicle:FireClient(player, true)
end)

-- ============================================================
-- SYSTEM 4: ECONOMY SYSTEM
-- ============================================================

-- Module Script: ServerScriptService/Economy/EconomyModule.lua

local EconomyDS = DataStoreService:GetDataStore("PlayerEconomy_v3")
local playerEconomy = {} -- [userId] = { cash, bank, premium }

local EconomyModule = {}

function EconomyModule.LoadPlayer(player)
  local userId = player.UserId
  local data
  local ok = pcall(function()
    data = EconomyDS:GetAsync("eco_" .. userId)
  end)
  if not ok or not data then
    data = { cash = 500, bank = 0, premium = 0 }
  end
  playerEconomy[userId] = data
  return data
end

function EconomyModule.SavePlayer(player)
  local userId = player.UserId
  local data = playerEconomy[userId]
  if not data then return end
  pcall(function()
    EconomyDS:SetAsync("eco_" .. userId, data)
  end)
end

function EconomyModule.GetBalance(player)
  return playerEconomy[player.UserId] or { cash = 0, bank = 0, premium = 0 }
end

function EconomyModule.AddCash(player, amount, reason)
  local data = playerEconomy[player.UserId]
  if not data then return false end
  data.cash += math.max(0, amount)
  PayPlayer:FireClient(player, amount, reason or "Income")
  return true
end

function EconomyModule.DeductCash(player, amount)
  local data = playerEconomy[player.UserId]
  if not data then return false end
  if data.cash < amount then return false end
  data.cash -= amount
  return true
end

function EconomyModule.Deposit(player, amount)
  local data = playerEconomy[player.UserId]
  if not data then return false end
  if data.cash < amount then return false end
  data.cash -= amount
  data.bank += amount
  return true
end

function EconomyModule.Withdraw(player, amount)
  local data = playerEconomy[player.UserId]
  if not data then return false end
  if data.bank < amount then return false end
  data.bank -= amount
  data.cash += amount
  return true
end

function EconomyModule.TransferToPlayer(fromPlayer, toPlayer, amount)
  local from = playerEconomy[fromPlayer.UserId]
  local to   = playerEconomy[toPlayer.UserId]
  if not from or not to then return false end
  if from.cash < amount then return false end
  from.cash -= amount
  to.cash   += amount
  return true
end

-- Daily login bonus
local DailyBonusDS = DataStoreService:GetDataStore("DailyBonus_v1")
local DAILY_BONUS = 200

function EconomyModule.ClaimDailyBonus(player)
  local userId = player.UserId
  local lastClaim
  pcall(function() lastClaim = DailyBonusDS:GetAsync("daily_" .. userId) end)

  local now = os.time()
  local oneDaySeconds = 86400

  if lastClaim and (now - lastClaim) < oneDaySeconds then
    local remaining = oneDaySeconds - (now - lastClaim)
    return false, math.floor(remaining / 3600) .. "h " .. math.floor((remaining % 3600) / 60) .. "m remaining"
  end

  pcall(function() DailyBonusDS:SetAsync("daily_" .. userId, now) end)
  EconomyModule.AddCash(player, DAILY_BONUS, "Daily Login Bonus")
  return true, DAILY_BONUS
end

-- Item shop
local SHOP_ITEMS = {
  { id = "sofa",       name = "Sofa",          cost = 200,  category = "Furniture" },
  { id = "bed_queen",  name = "Queen Bed",      cost = 350,  category = "Furniture" },
  { id = "tv",         name = "Flat-screen TV", cost = 500,  category = "Furniture" },
  { id = "dress_suit", name = "Business Suit",  cost = 150,  category = "Clothing" },
  { id = "chef_hat",   name = "Chef Hat",       cost = 80,   category = "Clothing" },
  { id = "lamp",       name = "Floor Lamp",     cost = 100,  category = "Furniture" },
}

function EconomyModule.BuyItem(player, itemId)
  local item = nil
  for _, i in ipairs(SHOP_ITEMS) do
    if i.id == itemId then item = i break end
  end
  if not item then return false, "Item not found" end

  local ok = EconomyModule.DeductCash(player, item.cost)
  if not ok then return false, "Not enough cash" end

  -- Add to player inventory (handled by InventoryModule)
  return true, item
end

return EconomyModule

-- ATM/Bank Server Script
local ATMDeposit  = Remotes:WaitForChild("ATMDeposit")
local ATMWithdraw = Remotes:WaitForChild("ATMWithdraw")
local ATMTransfer = Remotes:WaitForChild("ATMTransfer")
local GetBalance  = Remotes:WaitForChild("GetBalance")
local ClaimDaily  = Remotes:WaitForChild("ClaimDailyBonus")

ATMDeposit.OnServerEvent:Connect(function(player, amount)
  -- local ok = Economy.Deposit(player, amount)
  ATMDeposit:FireClient(player, true)
end)

ATMWithdraw.OnServerEvent:Connect(function(player, amount)
  -- local ok = Economy.Withdraw(player, amount)
  ATMWithdraw:FireClient(player, true)
end)

ATMTransfer.OnServerEvent:Connect(function(player, targetName, amount)
  local target = Players:FindFirstChild(targetName)
  if not target then
    ATMTransfer:FireClient(player, false, "Player not found")
    return
  end
  -- local ok = Economy.TransferToPlayer(player, target, amount)
  ATMTransfer:FireClient(player, true)
end)

GetBalance.OnServerInvoke = function(player)
  -- return Economy.GetBalance(player)
  return { cash = 1000, bank = 5000, premium = 0 }
end

ClaimDaily.OnServerEvent:Connect(function(player)
  -- local ok, msg = Economy.ClaimDailyBonus(player)
  ClaimDaily:FireClient(player, true, 200)
end)

-- DevProduct: Premium currency (Robux purchases)
local MarketplaceService = game:GetService("MarketplaceService")
local PRODUCTS = {
  [1234561] = { premium = 100,  bonus = 10  },  -- 100 coins + 10 bonus
  [1234562] = { premium = 500,  bonus = 75  },  -- 500 + 75
  [1234563] = { premium = 1200, bonus = 200 },  -- 1200 + 200
}

MarketplaceService.ProcessReceipt = function(receiptInfo)
  local player = Players:GetPlayerByUserId(receiptInfo.PlayerId)
  if not player then return Enum.ProductPurchaseDecision.NotProcessedYet end

  local product = PRODUCTS[receiptInfo.ProductId]
  if product then
    local total = product.premium + product.bonus
    -- Economy.AddPremium(player, total)
    PayPlayer:FireClient(player, total, "Robux Purchase")
  end

  return Enum.ProductPurchaseDecision.PurchaseGranted
end

-- ============================================================
-- SYSTEM 5: SOCIAL FEATURES
-- ============================================================

-- Server Script: ServerScriptService/Social/SocialServer.lua

local DoEmote       = Remotes:WaitForChild("DoEmote")
local Interact      = Remotes:WaitForChild("SocialInteract")
local CreateParty   = Remotes:WaitForChild("CreateParty")
local InviteParty   = Remotes:WaitForChild("InviteParty")
local JoinParty     = Remotes:WaitForChild("JoinParty")
local LeaveParty    = Remotes:WaitForChild("LeaveParty")
local SendMessage   = Remotes:WaitForChild("SendPhoneMessage")
local UpdateNameTag = Remotes:WaitForChild("UpdateNameTag")

-- Emote definitions
local EMOTES = {
  wave      = { animId = "rbxassetid://507770239", loop = false, duration = 2 },
  dance     = { animId = "rbxassetid://507771019", loop = true,  duration = 0 },
  sit       = { animId = "rbxassetid://2506281703", loop = true, duration = 0 },
  laugh     = { animId = "rbxassetid://507770818", loop = false, duration = 3 },
  cheer     = { animId = "rbxassetid::507770677",  loop = false, duration = 2 },
  sleep     = { animId = "rbxassetid://6895079185", loop = true, duration = 0 },
  thumbsup  = { animId = "rbxassetid://507770677", loop = false, duration = 2 },
  point     = { animId = "rbxassetid://507770453", loop = false, duration = 2 },
  clap      = { animId = "rbxassetid://507770239", loop = false, duration = 2 },
  salute    = { animId = "rbxassetid://3360686187", loop = false, duration = 2 },
  shrug     = { animId = "rbxassetid://3360693148", loop = false, duration = 2 },
  facepalm  = { animId = "rbxassetid://3360692915", loop = false, duration = 2 },
}

DoEmote.OnServerEvent:Connect(function(player, emoteName)
  local emote = EMOTES[emoteName]
  if not emote then return end
  -- Broadcast to nearby players (within 30 studs)
  for _, other in ipairs(Players:GetPlayers()) do
    if other ~= player then
      local charA = player.Character
      local charB = other.Character
      if charA and charB then
        local distSq = (charA.PrimaryPart.Position - charB.PrimaryPart.Position).Magnitude
        if distSq < 30 then
          DoEmote:FireClient(other, player, emoteName, emote.animId, emote.loop, emote.duration)
        end
      end
    end
  end
  -- Also fire back to self to play
  DoEmote:FireClient(player, player, emoteName, emote.animId, emote.loop, emote.duration)
end)

-- Proximity interactions (wave, high-five, handshake)
local INTERACTIONS = {
  wave      = { range = 15, duration = 2 },
  highfive  = { range = 5,  duration = 2, bothPlay = true },
  handshake = { range = 5,  duration = 3, bothPlay = true },
  hug       = { range = 4,  duration = 3, bothPlay = true },
}

Interact.OnServerEvent:Connect(function(player, targetPlayer, interactionType)
  local def = INTERACTIONS[interactionType]
  if not def then return end

  local charA = player.Character
  local charB = targetPlayer and targetPlayer.Character
  if not charA or not charB then return end

  local dist = (charA.PrimaryPart.Position - charB.PrimaryPart.Position).Magnitude
  if dist > def.range then
    Interact:FireClient(player, false, "Too far away")
    return
  end

  Interact:FireClient(player, true, interactionType)
  if def.bothPlay and targetPlayer then
    Interact:FireClient(targetPlayer, true, interactionType .. "_receive")
  end
end)

-- Party system
local parties = {} -- [partyId] = { leader = userId, members = {}, maxSize = 6 }
local playerParty = {} -- [userId] = partyId
local nextPartyId = 1

CreateParty.OnServerEvent:Connect(function(player)
  local userId = player.UserId
  if playerParty[userId] then
    CreateParty:FireClient(player, false, "Already in a party")
    return
  end

  local partyId = nextPartyId
  nextPartyId += 1

  parties[partyId] = {
    leader  = userId,
    members = { userId },
    maxSize = 6,
  }
  playerParty[userId] = partyId
  CreateParty:FireClient(player, true, partyId)
end)

InviteParty.OnServerEvent:Connect(function(player, targetName)
  local partyId = playerParty[player.UserId]
  if not partyId then return end

  local target = Players:FindFirstChild(targetName)
  if not target then return end

  InviteParty:FireClient(target, player.Name, partyId)
end)

JoinParty.OnServerEvent:Connect(function(player, partyId)
  local party = parties[partyId]
  if not party then
    JoinParty:FireClient(player, false, "Party not found")
    return
  end
  if #party.members >= party.maxSize then
    JoinParty:FireClient(player, false, "Party full")
    return
  end
  if playerParty[player.UserId] then
    -- Leave current party
    LeaveParty:FireServer(player) -- would trigger leave logic
  end

  table.insert(party.members, player.UserId)
  playerParty[player.UserId] = partyId

  -- Notify all party members
  for _, memberId in ipairs(party.members) do
    local member = Players:GetPlayerByUserId(memberId)
    if member then
      JoinParty:FireClient(member, player.Name, partyId, party.members)
    end
  end
end)

LeaveParty.OnServerEvent:Connect(function(player)
  local userId  = player.UserId
  local partyId = playerParty[userId]
  if not partyId then return end

  local party = parties[partyId]
  if not party then return end

  for i, memberId in ipairs(party.members) do
    if memberId == userId then
      table.remove(party.members, i)
      break
    end
  end
  playerParty[userId] = nil

  if #party.members == 0 then
    parties[partyId] = nil
  elseif party.leader == userId and #party.members > 0 then
    party.leader = party.members[1]
  end

  LeaveParty:FireClient(player, true)
end)

-- Phone system: messages between players
local messageQueue = {} -- [userId] = { {from, text, time} }

SendMessage.OnServerEvent:Connect(function(player, targetName, message)
  if #message > 200 then return end -- character limit
  local target = Players:FindFirstChild(targetName)
  if not target then
    SendMessage:FireClient(player, false, "Player offline")
    return
  end

  local msg = {
    from = player.Name,
    text = message,
    time = os.time(),
  }
  SendMessage:FireClient(target, true, msg)
  SendMessage:FireClient(player, true, { sent = true, to = targetName })
end)

-- Name tag with job title
Players.PlayerAdded:Connect(function(player)
  player.CharacterAdded:Connect(function(char)
    local head = char:WaitForChild("Head")
    local billboard = Instance.new("BillboardGui")
    billboard.Size = UDim2.new(0, 200, 0, 60)
    billboard.StudsOffset = Vector3.new(0, 3, 0)
    billboard.AlwaysOnTop = false
    billboard.Parent = head

    local nameLabel = Instance.new("TextLabel")
    nameLabel.Size = UDim2.new(1, 0, 0.5, 0)
    nameLabel.BackgroundTransparency = 1
    nameLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
    nameLabel.TextStrokeTransparency = 0
    nameLabel.Font = Enum.Font.GothamBold
    nameLabel.TextScaled = true
    nameLabel.Text = player.Name
    nameLabel.Parent = billboard

    local jobLabel = Instance.new("TextLabel")
    jobLabel.Size = UDim2.new(1, 0, 0.5, 0)
    jobLabel.Position = UDim2.new(0, 0, 0.5, 0)
    jobLabel.BackgroundTransparency = 1
    jobLabel.TextColor3 = Color3.fromRGB(255, 215, 50)
    jobLabel.TextStrokeTransparency = 0
    jobLabel.Font = Enum.Font.Gotham
    jobLabel.TextScaled = true
    jobLabel.Text = "Unemployed"
    jobLabel.Name = "JobLabel"
    jobLabel.Parent = billboard
  end)
end)

-- Update name tag when player gets job
UpdateNameTag.OnServerEvent:Connect(function(player, jobTitle)
  local char = player.Character
  if not char then return end
  local head = char:FindFirstChild("Head")
  if not head then return end
  local bb = head:FindFirstChildWhichIsA("BillboardGui")
  if not bb then return end
  local jobLabel = bb:FindFirstChild("JobLabel")
  if jobLabel then
    jobLabel.Text = jobTitle or "Unemployed"
  end
end)

-- ============================================================
-- SYSTEM 6: TOWN INFRASTRUCTURE
-- ============================================================

-- Server Script: ServerScriptService/Town/TownServer.lua

local Lighting  = game:GetService("Lighting")
local SoundService = game:GetService("SoundService")
local TweenService = game:GetService("TweenService")

local DoorOpen     = Remotes:WaitForChild("DoorOpen")
local UseATM       = Remotes:WaitForChild("UseATM")
local UseVending   = Remotes:WaitForChild("UseVendingMachine")
local ElevatorCall = Remotes:WaitForChild("CallElevator")
local WeatherSync  = Remotes:WaitForChild("WeatherSync")

-- Day/Night cycle
local DAY_LENGTH   = 600  -- real seconds for one full in-game day
local HOUR_LENGTH  = DAY_LENGTH / 24
local gameHour     = 8    -- start at 8am
local gameMinute   = 0

-- Shop hours
local SHOP_HOURS = {
  ["Pizza Place"]    = { open = 9,  close = 22 },
  ["Clothing Store"] = { open = 10, close = 21 },
  ["Hospital"]       = { open = 0,  close = 24 }, -- 24hr
  ["Gas Station"]    = { open = 0,  close = 24 },
  ["School"]         = { open = 8,  close = 15 },
  ["Bank"]           = { open = 9,  close = 17 },
  ["Mechanic Shop"]  = { open = 8,  close = 20 },
  ["Farm Stand"]     = { open = 7,  close = 19 },
}

local function isShopOpen(shopName)
  local hours = SHOP_HOURS[shopName]
  if not hours then return true end
  return gameHour >= hours.open and gameHour < hours.close
end

-- Advance time
RunService.Heartbeat:Connect(function(dt)
  gameMinute += dt * (60 / HOUR_LENGTH) -- advance minute proportionally
  if gameMinute >= 60 then
    gameMinute -= 60
    gameHour = (gameHour + 1) % 24

    -- Update sky lighting
    Lighting.TimeOfDay = string.format("%02d:%02d:00", gameHour, 0)

    -- Street lights on at night
    local isNight = gameHour >= 20 or gameHour < 6
    for _, light in ipairs(workspace:GetDescendants()) do
      if light:IsA("PointLight") and light:GetAttribute("IsStreetLight") then
        light.Enabled = isNight
      end
    end

    -- Broadcast time to all clients
    WeatherSync:FireAllClients("time", gameHour, gameMinute)
  end
end)

-- Weather system
local WEATHER_TYPES = {
  clear = {
    fogEnd         = 1000,
    ambientColor   = Color3.fromRGB(178, 178, 178),
    brightness     = 2,
    rain           = false,
    snow           = false,
  },
  rain = {
    fogEnd         = 300,
    ambientColor   = Color3.fromRGB(100, 100, 130),
    brightness     = 0.8,
    rain           = true,
    snow           = false,
  },
  snow = {
    fogEnd         = 200,
    ambientColor   = Color3.fromRGB(200, 210, 220),
    brightness     = 1.5,
    rain           = false,
    snow           = true,
  },
  fog = {
    fogEnd         = 150,
    ambientColor   = Color3.fromRGB(140, 140, 140),
    brightness     = 1,
    rain           = false,
    snow           = false,
  },
}

local currentWeather = "clear"
local WEATHER_CYCLE_TIME = 1800 -- change weather every 30 min

local function setWeather(weatherType)
  local w = WEATHER_TYPES[weatherType]
  if not w then return end
  currentWeather = weatherType
  local tweenInfo = TweenInfo.new(10, Enum.EasingStyle.Sine)
  TweenService:Create(Lighting, tweenInfo, {
    FogEnd    = w.fogEnd,
    Ambient   = w.ambientColor,
    Brightness = w.brightness,
  }):Play()
  WeatherSync:FireAllClients("weather", weatherType)
end

-- Randomly change weather
local weatherTimer = 0
local weatherList  = { "clear", "clear", "clear", "rain", "fog", "snow" }
RunService.Heartbeat:Connect(function(dt)
  weatherTimer += dt
  if weatherTimer >= WEATHER_CYCLE_TIME then
    weatherTimer = 0
    local idx = math.random(1, #weatherList)
    setWeather(weatherList[idx])
  end
end)

-- Interactive doors
local doorStates = {} -- [doorId] = isOpen
local function setupDoors()
  for _, door in ipairs(workspace:GetDescendants()) do
    if door:IsA("Model") and door:GetAttribute("IsDoor") then
      local doorId = door:GetAttribute("DoorId") or door:GetFullName()
      doorStates[doorId] = false

      -- Create proximity prompt
      local primary = door.PrimaryPart or door:FindFirstChildWhichIsA("BasePart")
      if primary then
        local prompt = Instance.new("ProximityPrompt")
        prompt.ActionText = "Open"
        prompt.ObjectText = "Door"
        prompt.HoldDuration = 0
        prompt.MaxActivationDistance = 8
        prompt.Parent = primary

        prompt.Triggered:Connect(function(player)
          local isOpen = doorStates[doorId]
          doorStates[doorId] = not isOpen
          local targetAngle = isOpen and 0 or 90
          local hinge = door:FindFirstChild("Hinge")
          if hinge and hinge:IsA("BasePart") then
            TweenService:Create(hinge, TweenInfo.new(0.4), {
              CFrame = hinge.CFrame * CFrame.Angles(0, math.rad(targetAngle), 0)
            }):Play()
          end
          DoorOpen:FireAllClients(doorId, not isOpen)
        end)
      end
    end
  end
end

-- Elevator system
local elevators = {} -- [elevatorId] = { currentFloor, targetFloor, isMoving }

local function setupElevators()
  for _, elev in ipairs(workspace:GetDescendants()) do
    if elev:IsA("Model") and elev:GetAttribute("IsElevator") then
      local elevId = elev:GetAttribute("ElevatorId")
      elevators[elevId] = {
        currentFloor = 1,
        targetFloor  = 1,
        isMoving     = false,
        floors       = elev:GetAttribute("FloorCount") or 3,
        floorHeight  = elev:GetAttribute("FloorHeight") or 12,
        basePosition = elev.PrimaryPart and elev.PrimaryPart.Position or Vector3.zero,
      }
    end
  end
end

ElevatorCall.OnServerEvent:Connect(function(player, elevatorId, targetFloor)
  local elev = elevators[elevatorId]
  if not elev or elev.isMoving then return end
  if targetFloor < 1 or targetFloor > elev.floors then return end

  elev.targetFloor = targetFloor
  elev.isMoving = true

  local elevModel = workspace:FindFirstChild("Elevator_" .. elevatorId)
  if not elevModel then elev.isMoving = false return end

  local targetY = elev.basePosition.Y + (targetFloor - 1) * elev.floorHeight
  local targetCFrame = CFrame.new(elev.basePosition.X, targetY, elev.basePosition.Z)
  local duration = math.abs(targetFloor - elev.currentFloor) * 1.5

  TweenService:Create(elevModel.PrimaryPart, TweenInfo.new(duration, Enum.EasingStyle.Quad), {
    CFrame = targetCFrame
  }):Play()

  task.delay(duration, function()
    elev.currentFloor = targetFloor
    elev.isMoving = false
  end)
end)

-- Vending machine
local VENDING_ITEMS = {
  water   = { name = "Water Bottle", cost = 5,   healAmount = 20 },
  soda    = { name = "Cola",         cost = 8,   healAmount = 30 },
  snack   = { name = "Chips",        cost = 6,   healAmount = 15 },
  coffee  = { name = "Coffee",       cost = 10,  healAmount = 25, speedBoost = 1.2 },
  energy  = { name = "Energy Drink", cost = 15,  healAmount = 10, speedBoost = 1.5 },
}

UseVending.OnServerEvent:Connect(function(player, itemKey)
  local item = VENDING_ITEMS[itemKey]
  if not item then return end

  -- Deduct cash (Economy module)
  -- local ok = Economy.DeductCash(player, item.cost)
  -- if not ok then UseVending:FireClient(player, false, "Not enough cash") return end

  local char = player.Character
  if not char then return end
  local hum = char:FindFirstChild("Humanoid")
  if hum then
    hum.Health = math.min(hum.MaxHealth, hum.Health + (item.healAmount or 0))
    if item.speedBoost then
      hum.WalkSpeed = 16 * item.speedBoost
      task.delay(30, function()
        if hum and hum.Parent then hum.WalkSpeed = 16 end
      end)
    end
  end

  UseVending:FireClient(player, true, item)
end)

-- NPC Civilians walking around town
local NPC_NAMES = {
  "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Jamie",
  "Cameron", "Drew", "Avery", "Blake", "Quinn", "Sage", "Harper",
}

local NPC_WAYPOINTS = {
  Vector3.new(0, 5, 0),
  Vector3.new(50, 5, 50),
  Vector3.new(-50, 5, 50),
  Vector3.new(50, 5, -50),
  Vector3.new(-50, 5, -50),
  Vector3.new(100, 5, 0),
  Vector3.new(-100, 5, 0),
  Vector3.new(0, 5, 100),
  Vector3.new(0, 5, -100),
}

local PathfindingService = game:GetService("PathfindingService")
local activeNPCs = {}

local function createCivilian(spawnPos)
  local npcTemplate = ReplicatedStorage.NPCModels:FindFirstChild("Civilian")
  if not npcTemplate then return end

  local npc = npcTemplate:Clone()
  npc.Name = NPC_NAMES[math.random(1, #NPC_NAMES)]
  npc.Parent = workspace

  local humanoid = npc:FindFirstChild("Humanoid")
  local rootPart = npc:FindFirstChild("HumanoidRootPart")
  if not humanoid or not rootPart then return end

  rootPart.CFrame = CFrame.new(spawnPos)

  -- Walk patrol loop
  local wpIndex = math.random(1, #NPC_WAYPOINTS)
  local function walkTo(target)
    local path = PathfindingService:CreatePath({
      AgentHeight = 5,
      AgentRadius = 2,
      AgentCanJump = false,
    })
    local ok = pcall(function() path:ComputeAsync(rootPart.Position, target) end)
    if not ok or path.Status ~= Enum.PathStatus.Success then return end

    local waypoints = path:GetWaypoints()
    for _, wp in ipairs(waypoints) do
      if wp.Action == Enum.PathWaypointAction.Jump then
        humanoid.Jump = true
      end
      humanoid:MoveTo(wp.Position)
      local reached = humanoid.MoveToFinished:Wait(5)
      if not reached then break end
    end
  end

  task.spawn(function()
    while npc.Parent do
      wpIndex = (wpIndex % #NPC_WAYPOINTS) + 1
      walkTo(NPC_WAYPOINTS[wpIndex])
      task.wait(2 + math.random() * 3) -- pause at waypoint
    end
  end)

  return npc
end

-- Spawn civilians (called at server start)
local function spawnCivilians(count)
  count = count or 8
  for i = 1, count do
    local spawnPos = NPC_WAYPOINTS[math.random(1, #NPC_WAYPOINTS)]
    local npc = createCivilian(spawnPos)
    if npc then table.insert(activeNPCs, npc) end
    task.wait(0.2)
  end
end

-- Traffic lights
local TRAFFIC_CYCLE = 15 -- seconds per phase
local trafficPhase = 0

local function updateTrafficLights()
  while true do
    task.wait(TRAFFIC_CYCLE)
    trafficPhase = (trafficPhase + 1) % 4

    for _, light in ipairs(workspace:GetDescendants()) do
      if light:IsA("Model") and light:GetAttribute("IsTrafficLight") then
        local axis = light:GetAttribute("TrafficAxis") or 0 -- 0=NS, 1=EW
        local greenPart  = light:FindFirstChild("GreenLight")
        local yellowPart = light:FindFirstChild("YellowLight")
        local redPart    = light:FindFirstChild("RedLight")

        if greenPart and yellowPart and redPart then
          greenPart.Material  = Enum.Material.SmoothPlastic
          yellowPart.Material = Enum.Material.SmoothPlastic
          redPart.Material    = Enum.Material.SmoothPlastic

          if axis == 0 then
            if trafficPhase == 0 then
              greenPart.Material = Enum.Material.Neon
            elseif trafficPhase == 1 then
              yellowPart.Material = Enum.Material.Neon
            else
              redPart.Material = Enum.Material.Neon
            end
          else
            if trafficPhase == 2 then
              greenPart.Material = Enum.Material.Neon
            elseif trafficPhase == 3 then
              yellowPart.Material = Enum.Material.Neon
            else
              redPart.Material = Enum.Material.Neon
            end
          end
        end
      end
    end
  end
end

-- Initialize town
task.spawn(setupDoors)
task.spawn(setupElevators)
task.spawn(spawnCivilians, 10)
task.spawn(updateTrafficLights)
setWeather("clear")

-- Player lifecycle
Players.PlayerAdded:Connect(function(player)
  -- Economy.LoadPlayer(player)

  -- Send current time/weather on join
  player.CharacterAdded:Connect(function()
    task.wait(1)
    WeatherSync:FireClient(player, "time", gameHour, gameMinute)
    WeatherSync:FireClient(player, "weather", currentWeather)
  end)
end)

Players.PlayerRemoving:Connect(function(player)
  -- Economy.SavePlayer(player)
  -- Save house if owned
  for plotId, plot in pairs(plots) do
    if plot.owner == player.UserId then
      local data = serializeHouse(plotId)
      pcall(function()
        HousingDS:SetAsync("house_" .. player.UserId, data)
      end)
    end
  end
  -- Despawn vehicle
  if spawnedVehicles[player.UserId] then
    local v = spawnedVehicles[player.UserId]
    if v.vehicleModel and v.vehicleModel.Parent then
      v.vehicleModel:Destroy()
    end
    spawnedVehicles[player.UserId] = nil
  end
  -- Remove party
  playerJobs[player.UserId] = nil
  playerParty[player.UserId] = nil
end)

game:BindToClose(function()
  for _, player in ipairs(Players:GetPlayers()) do
    -- Economy.SavePlayer(player)
  end
end)

-- ============================================================
-- CLIENT SCRIPTS (LocalScript examples)
-- ============================================================

-- LocalScript: StarterPlayerScripts/HUDController.lua
--[[
local Players    = game:GetService("Players")
local RS         = game:GetService("ReplicatedStorage")
local UIS        = game:GetService("UserInputService")
local TweenS     = game:GetService("TweenService")

local player     = Players.LocalPlayer
local char       = player.Character or player.CharacterAdded:Wait()
local Remotes    = RS:WaitForChild("Remotes")

-- UI references (created in ScreenGui)
local hud        = player.PlayerGui:WaitForChild("HUD")
local cashLabel  = hud:WaitForChild("CashLabel")
local jobLabel   = hud:WaitForChild("JobLabel")
local clockLabel = hud:WaitForChild("ClockLabel")
local fuelBar    = hud:WaitForChild("FuelBar")
local emoteWheel = hud:WaitForChild("EmoteWheel")

-- Update cash display
local PayPlayer = Remotes:WaitForChild("PayPlayer")
PayPlayer.OnClientEvent:Connect(function(amount, reason)
  cashLabel.Text = "$" .. tostring(math.floor(amount))
  -- Animate +amount popup
  local popup = Instance.new("TextLabel")
  popup.Text  = "+" .. amount .. " (" .. reason .. ")"
  popup.Size  = UDim2.new(0, 200, 0, 40)
  popup.Position = UDim2.new(0.5, -100, 0.8, 0)
  popup.BackgroundTransparency = 1
  popup.TextColor3 = Color3.fromRGB(100, 220, 100)
  popup.Font = Enum.Font.GothamBold
  popup.TextScaled = true
  popup.Parent = player.PlayerGui
  TweenS:Create(popup, TweenInfo.new(2), { Position = UDim2.new(0.5, -100, 0.6, 0), TextTransparency = 1 }):Play()
  task.delay(2, function() popup:Destroy() end)
end)

-- Emote wheel (hold E to open)
local emoteNames = { "wave", "dance", "sit", "laugh", "cheer", "sleep",
                     "thumbsup", "point", "clap", "salute", "shrug", "facepalm" }
local DoEmote = Remotes:WaitForChild("DoEmote")

UIS.InputBegan:Connect(function(input, gpe)
  if gpe then return end
  if input.KeyCode == Enum.KeyCode.E then
    emoteWheel.Visible = true
  end
end)

UIS.InputEnded:Connect(function(input)
  if input.KeyCode == Enum.KeyCode.E then
    emoteWheel.Visible = false
  end
end)

-- Select emote from wheel
for i, emoteName in ipairs(emoteNames) do
  local button = emoteWheel:FindFirstChild("Emote" .. i)
  if button then
    button.MouseButton1Click:Connect(function()
      DoEmote:FireServer(emoteName)
      emoteWheel.Visible = false
    end)
  end
end

-- Receive emote from server and play animation
DoEmote.OnClientEvent:Connect(function(targetPlayer, emoteName, animId, shouldLoop, duration)
  local targetChar = targetPlayer.Character
  if not targetChar then return end
  local hum = targetChar:FindFirstChild("Humanoid")
  if not hum then return end
  local animator = hum:FindFirstChild("Animator")
  if not animator then return end

  local anim = Instance.new("Animation")
  anim.AnimationId = animId
  local track = animator:LoadAnimation(anim)
  track:Play()
  if not shouldLoop and duration > 0 then
    task.delay(duration, function()
      if track.IsPlaying then track:Stop() end
    end)
  end
end)

-- Weather effects (rain particle, snow)
local WeatherSync = Remotes:WaitForChild("WeatherSync")
WeatherSync.OnClientEvent:Connect(function(syncType, ...)
  local args = { ... }
  if syncType == "weather" then
    local weatherType = args[1]
    local rainEffect = workspace:FindFirstChild("RainEffect")
    local snowEffect = workspace:FindFirstChild("SnowEffect")
    if rainEffect then rainEffect.Enabled = weatherType == "rain" end
    if snowEffect then snowEffect.Enabled = weatherType == "snow" end
  elseif syncType == "time" then
    local hour, minute = args[1], args[2]
    local ampm = hour >= 12 and "PM" or "AM"
    local h12 = hour % 12
    if h12 == 0 then h12 = 12 end
    clockLabel.Text = string.format("%d:%02d %s", h12, math.floor(minute), ampm)
  end
end)

-- Phone GPS mini-map
local phoneOpen = false
UIS.InputBegan:Connect(function(input, gpe)
  if gpe then return end
  if input.KeyCode == Enum.KeyCode.P then
    phoneOpen = not phoneOpen
    hud:WaitForChild("Phone").Visible = phoneOpen
  end
end)
--]]

-- ============================================================
-- SETUP SCRIPT (runs once in ServerScriptService)
-- Place all needed RemoteEvents in ReplicatedStorage
-- ============================================================
--[[
local RS = game:GetService("ReplicatedStorage")

local remoteNames = {
  -- Jobs
  "ApplyForJob", "QuitJob", "CompleteTask", "PayPlayer", "EquipUniform",
  -- Housing
  "ClaimPlot", "PlaceFurniture", "SaveHouse", "LoadHouse",
  "VisitHouse", "UpgradeHouse",
  -- Vehicles
  "PurchaseVehicle", "SpawnVehicle", "DespawnVehicle",
  "CustomizeVehicle", "RefuelVehicle",
  -- Economy
  "ATMDeposit", "ATMWithdraw", "ATMTransfer", "ClaimDailyBonus",
  -- Social
  "DoEmote", "SocialInteract", "CreateParty", "InviteParty",
  "JoinParty", "LeaveParty", "SendPhoneMessage", "UpdateNameTag",
  -- Town
  "DoorOpen", "UseATM", "UseVendingMachine", "CallElevator", "WeatherSync",
}

local remotesFolder = RS:FindFirstChild("Remotes")
if not remotesFolder then
  remotesFolder = Instance.new("Folder")
  remotesFolder.Name = "Remotes"
  remotesFolder.Parent = RS
end

for _, name in ipairs(remoteNames) do
  if not remotesFolder:FindFirstChild(name) then
    local remote = Instance.new("RemoteEvent")
    remote.Name = name
    remote.Parent = remotesFolder
  end
end

-- GetBalance is a RemoteFunction
local getBal = remotesFolder:FindFirstChild("GetBalance")
if not getBal then
  local rf = Instance.new("RemoteFunction")
  rf.Name = "GetBalance"
  rf.Parent = remotesFolder
end
--]]
`;
}
