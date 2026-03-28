--[[
  RobloxForge Studio Plugin — AssetManager.lua
  PLUG-03: Asset injection into workspace

  Supports:
  - InsertService:LoadAsset() for marketplace assets
  - game:GetObjects() for custom .rbxm URLs
  - Batch insertion with wait(0.05) between groups
  - Automatic parent assignment + ChangeHistoryService waypoints
--]]

local InsertService = game:GetService("InsertService")
local ChangeHistoryService = game:GetService("ChangeHistoryService")
local HttpService   = game:GetService("HttpService")
local Selection     = game:GetService("Selection")

local AssetManager = {}

-- ============================================================
-- Config
-- ============================================================
local BATCH_WAIT      = 0.05  -- seconds between batch groups
local BATCH_SIZE      = 5     -- models per batch group
local DEFAULT_PARENT  = workspace

-- ============================================================
-- Internal helpers
-- ============================================================
local function getTargetParent()
  -- Prefer selected folder, otherwise workspace
  local selected = Selection:Get()
  for _, s in ipairs(selected) do
    if s:IsA("Folder") or s:IsA("Model") then
      return s
    end
  end
  return DEFAULT_PARENT
end

local function setInstanceAttributes(instance, attrs)
  if not attrs then return end
  for key, value in pairs(attrs) do
    pcall(function()
      instance:SetAttribute(key, value)
    end)
  end
end

-- ============================================================
-- Load a marketplace asset by asset ID
-- ============================================================
function AssetManager.loadMarketplaceAsset(assetId, opts)
  opts = opts or {}

  local ok, result = pcall(function()
    return InsertService:LoadAsset(assetId)
  end)

  if not ok then
    warn("[RobloxForge AssetManager] LoadAsset failed for ID " .. tostring(assetId) .. ": " .. tostring(result))
    return nil
  end

  local model = result:FindFirstChildWhichIsA("Model") or result:FindFirstChildWhichIsA("BasePart") or result

  if opts.name then
    model.Name = opts.name
  end

  if opts.cframe then
    pcall(function()
      if model:IsA("Model") and model.PrimaryPart then
        model:SetPrimaryPartCFrame(opts.cframe)
      elseif model:IsA("BasePart") then
        model.CFrame = opts.cframe
      end
    end)
  end

  if opts.attributes then
    setInstanceAttributes(model, opts.attributes)
  end

  local parent = opts.parent or getTargetParent()
  model.Parent = parent

  -- Mark as AI-generated
  model:SetAttribute("rf_generated", true)
  model:SetAttribute("rf_asset_id", tostring(assetId))
  model:SetAttribute("rf_timestamp", os.time())

  return model
end

-- ============================================================
-- Load a custom .rbxm from URL (for AI-generated models)
-- ============================================================
function AssetManager.loadCustomModel(url, opts)
  opts = opts or {}

  local ok, result = pcall(function()
    -- game:GetObjects() accepts rbxm data as a URL or content string
    -- In production: download .rbxm bytes and insert
    -- Studio plugin can use HttpService to download, then InsertService:LoadLocalAsset
    -- For now: attempt direct GetObjects approach
    return game:GetObjects(url)
  end)

  if not ok or not result or #result == 0 then
    warn("[RobloxForge AssetManager] Failed to load custom model from " .. tostring(url) .. ": " .. tostring(result))
    return nil
  end

  local model = result[1]
  if not model then return nil end

  if opts.name then
    model.Name = opts.name
  end

  if opts.cframe then
    pcall(function()
      if model:IsA("Model") and model.PrimaryPart then
        model:SetPrimaryPartCFrame(opts.cframe)
      end
    end)
  end

  local parent = opts.parent or getTargetParent()
  model.Parent = parent

  model:SetAttribute("rf_generated", true)
  model:SetAttribute("rf_source_url", url)
  model:SetAttribute("rf_timestamp", os.time())

  return model
end

-- ============================================================
-- Batch insert a list of asset definitions
-- Format: { {type, id, name, cframe, ...}, ... }
-- ============================================================
function AssetManager.batchInsert(assetDefs, opts)
  opts = opts or {}
  local parent     = opts.parent or getTargetParent()
  local onProgress = opts.onProgress
  local results    = {}

  ChangeHistoryService:SetWaypoint("RF_BatchInsert_Start")

  local total   = #assetDefs
  local current = 0

  for i = 1, total, BATCH_SIZE do
    -- Process a batch group
    for j = i, math.min(i + BATCH_SIZE - 1, total) do
      local def    = assetDefs[j]
      local model  = nil

      if def.type == "marketplace" then
        model = AssetManager.loadMarketplaceAsset(def.id, {
          name       = def.name,
          cframe     = def.cframe,
          parent     = parent,
          attributes = def.attributes,
        })
      elseif def.type == "custom" then
        model = AssetManager.loadCustomModel(def.url, {
          name   = def.name,
          cframe = def.cframe,
          parent = parent,
        })
      end

      table.insert(results, {
        def     = def,
        model   = model,
        success = model ~= nil,
      })

      current = current + 1

      if onProgress then
        onProgress(current, total, def.name)
      end
    end

    -- Wait between batch groups (prevents Studio freeze)
    if i + BATCH_SIZE <= total then
      task.wait(BATCH_WAIT)
    end
  end

  ChangeHistoryService:SetWaypoint("RF_BatchInsert_End")

  local successCount = 0
  for _, r in ipairs(results) do
    if r.success then successCount = successCount + 1 end
  end

  return {
    results      = results,
    total        = total,
    successCount = successCount,
    failCount    = total - successCount,
  }
end

-- ============================================================
-- Apply a change from Sync.lua
-- ============================================================
function AssetManager.insertFromChange(change)
  local data = change.data
  if not data then return end

  ChangeHistoryService:SetWaypoint("RF_SyncInsert_" .. (data.name or "Unknown"))

  if data.assetId then
    -- Marketplace asset
    local cframe = nil
    if data.position then
      cframe = CFrame.new(data.position.x or 0, data.position.y or 0, data.position.z or 0)
    end

    AssetManager.loadMarketplaceAsset(data.assetId, {
      name   = data.name,
      cframe = cframe,
    })
  elseif data.modelUrl then
    -- Custom AI model
    local cframe = nil
    if data.position then
      cframe = CFrame.new(data.position.x or 0, data.position.y or 0, data.position.z or 0)
    end

    AssetManager.loadCustomModel(data.modelUrl, {
      name   = data.name,
      cframe = cframe,
    })
  elseif data.script then
    -- Script insertion
    local scriptInst = Instance.new(data.scriptType or "Script")
    scriptInst.Name   = data.name or "RF_Script"
    scriptInst.Source = data.script
    scriptInst.Parent = data.parent and game:FindFirstChild(data.parent) or workspace

    scriptInst:SetAttribute("rf_generated", true)
    scriptInst:SetAttribute("rf_timestamp", os.time())
  end

  ChangeHistoryService:SetWaypoint("RF_SyncInsert_" .. (data.name or "Unknown") .. "_Done")
end

-- ============================================================
-- Remove all AI-generated instances (cleanup helper)
-- ============================================================
function AssetManager.removeAllGenerated(parent)
  parent = parent or workspace
  ChangeHistoryService:SetWaypoint("RF_RemoveGenerated")

  local removed = 0
  local function scanAndRemove(instance)
    for _, child in ipairs(instance:GetChildren()) do
      if child:GetAttribute("rf_generated") then
        child:Destroy()
        removed = removed + 1
      else
        scanAndRemove(child)
      end
    end
  end

  scanAndRemove(parent)
  ChangeHistoryService:SetWaypoint("RF_RemoveGenerated_Done")

  return removed
end

-- ============================================================
-- Get all AI-generated instances
-- ============================================================
function AssetManager.getGeneratedInstances(parent)
  parent = parent or workspace
  local instances = {}

  local function scan(instance)
    for _, child in ipairs(instance:GetChildren()) do
      if child:GetAttribute("rf_generated") then
        table.insert(instances, child)
      end
      scan(child)
    end
  end

  scan(parent)
  return instances
end

return AssetManager
