--[[
  ForjeGames Studio Plugin — AssetManager.lua
  Asset injection into workspace.

  Supports:
  - InsertService:LoadAsset() for marketplace asset IDs
  - game:GetObjects() for .rbxm content strings
  - Batch insertion with task.wait() between groups
  - ChangeHistoryService waypoints for full undo support
  - Structured script insertion
--]]

local InsertService        = game:GetService("InsertService")
local ChangeHistoryService = game:GetService("ChangeHistoryService")
local Selection            = game:GetService("Selection")

local AssetManager = {}

-- ============================================================
-- Config
-- ============================================================
local BATCH_WAIT     = 0.05  -- seconds between batch groups (prevents Studio freeze)
local BATCH_SIZE     = 5     -- assets per batch
local DEFAULT_PARENT = workspace

-- ============================================================
-- Internal helpers
-- ============================================================
local function getTargetParent()
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
    pcall(function() instance:SetAttribute(key, value) end)
  end
end

-- Tag all ForjeGames-generated instances so they can be audited or bulk-removed
local function stampGenerated(instance, extra)
  pcall(function() instance:SetAttribute("fj_generated", true) end)
  pcall(function() instance:SetAttribute("fj_timestamp",  os.time()) end)
  if extra then
    for k, v in pairs(extra) do
      pcall(function() instance:SetAttribute(k, v) end)
    end
  end
end

-- ============================================================
-- Load a marketplace asset by numeric asset ID
-- ============================================================
function AssetManager.loadMarketplaceAsset(assetId, opts)
  opts = opts or {}

  -- InsertService:LoadAsset returns a Model container
  local ok, result = pcall(function()
    return InsertService:LoadAsset(tonumber(assetId))
  end)

  if not ok or not result then
    warn("[ForjeGames AssetManager] LoadAsset failed for ID "
      .. tostring(assetId) .. ": " .. tostring(result))
    return nil
  end

  -- Extract the first meaningful child (Model, BasePart, etc.)
  local model = result:FindFirstChildWhichIsA("Model")
           or result:FindFirstChildWhichIsA("BasePart")
           or result

  if opts.name then
    pcall(function() model.Name = opts.name end)
  end

  if opts.cframe then
    pcall(function()
      if model:IsA("Model") and model.PrimaryPart then
        model:SetPrimaryPartCFrame(opts.cframe)
      elseif model:IsA("BasePart") then
        model.CFrame = opts.cframe
      else
        -- Fallback: move PrimaryPart-less model via first BasePart
        local bp = model:FindFirstChildWhichIsA("BasePart", true)
        if bp then bp.CFrame = opts.cframe end
      end
    end)
  end

  if opts.attributes then
    setInstanceAttributes(model, opts.attributes)
  end

  local parent = opts.parent or getTargetParent()
  model.Parent = parent

  stampGenerated(model, { fj_asset_id = tostring(assetId) })

  return model
end

-- ============================================================
-- Load a custom model from a content string / URL
-- (works for rbxm files accessible via game:GetObjects)
-- ============================================================
function AssetManager.loadCustomModel(url, opts)
  opts = opts or {}

  local ok, result = pcall(function()
    return game:GetObjects(url)
  end)

  if not ok or not result or #result == 0 then
    warn("[ForjeGames AssetManager] Failed to load custom model from "
      .. tostring(url) .. ": " .. tostring(result))
    return nil
  end

  local model = result[1]
  if not model then return nil end

  if opts.name then
    pcall(function() model.Name = opts.name end)
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

  local parent = opts.parent or getTargetParent()
  model.Parent = parent

  stampGenerated(model, { fj_source_url = url })

  return model
end

-- ============================================================
-- Batch insert a list of asset definitions
-- def format: { type="marketplace"|"custom", id, url, name, cframe, attributes }
-- ============================================================
function AssetManager.batchInsert(assetDefs, opts)
  opts = opts or {}

  local parent     = opts.parent or getTargetParent()
  local onProgress = opts.onProgress
  local results    = {}
  local total      = #assetDefs
  local current    = 0

  ChangeHistoryService:SetWaypoint("FJ_BatchInsert_Start")

  for i = 1, total, BATCH_SIZE do
    for j = i, math.min(i + BATCH_SIZE - 1, total) do
      local def   = assetDefs[j]
      local model = nil

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

      current = current + 1
      table.insert(results, {
        def     = def,
        model   = model,
        success = model ~= nil,
      })

      if onProgress then
        onProgress(current, total, def.name or tostring(def.id or def.url))
      end
    end

    if i + BATCH_SIZE <= total then
      task.wait(BATCH_WAIT)
    end
  end

  ChangeHistoryService:SetWaypoint("FJ_BatchInsert_End")

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
-- Apply a single change object from Sync.lua
-- change.data fields:
--   assetId   → marketplace insert
--   modelUrl  → custom .rbxm insert
--   script    → script insertion
--   position  → { x, y, z } table
-- ============================================================
function AssetManager.insertFromChange(change)
  local data = change and change.data
  if not data then return end

  local label = data.name or "Unknown"
  ChangeHistoryService:SetWaypoint("FJ_SyncInsert_" .. label)

  local cframe = nil
  if data.position then
    local px = tonumber(data.position.x) or 0
    local py = tonumber(data.position.y) or 0
    local pz = tonumber(data.position.z) or 0
    cframe = CFrame.new(px, py, pz)
  end

  if data.assetId then
    AssetManager.loadMarketplaceAsset(data.assetId, {
      name   = data.name,
      cframe = cframe,
    })

  elseif data.modelUrl then
    AssetManager.loadCustomModel(data.modelUrl, {
      name   = data.name,
      cframe = cframe,
    })

  elseif data.script then
    pcall(function()
      local scriptInst = Instance.new(data.scriptType or "Script")
      scriptInst.Name   = data.name or "FJ_Script"
      scriptInst.Source = data.script
      -- Find parent service by name, default to workspace
      local parentInst = data.parent and game:FindFirstChild(data.parent) or workspace
      scriptInst.Parent = parentInst
      stampGenerated(scriptInst, {})
    end)
  end

  ChangeHistoryService:SetWaypoint("FJ_SyncInsert_" .. label .. "_Done")
end

-- ============================================================
-- Remove all ForjeGames-generated instances
-- ============================================================
function AssetManager.removeAllGenerated(parent)
  parent = parent or workspace
  ChangeHistoryService:SetWaypoint("FJ_RemoveGenerated")

  local removed = 0

  local function scanAndRemove(instance)
    for _, child in ipairs(instance:GetChildren()) do
      if child:GetAttribute("fj_generated") then
        child:Destroy()
        removed = removed + 1
      else
        scanAndRemove(child)
      end
    end
  end

  scanAndRemove(parent)
  ChangeHistoryService:SetWaypoint("FJ_RemoveGenerated_Done")
  return removed
end

-- ============================================================
-- Get all ForjeGames-generated instances
-- ============================================================
function AssetManager.getGeneratedInstances(parent)
  parent = parent or workspace
  local instances = {}

  local function scan(instance)
    for _, child in ipairs(instance:GetChildren()) do
      if child:GetAttribute("fj_generated") then
        table.insert(instances, child)
      end
      scan(child)
    end
  end

  scan(parent)
  return instances
end

return AssetManager
