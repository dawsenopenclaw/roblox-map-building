--[[
  ForjeGames Studio Plugin — Sync.lua
  HTTP polling sync (2-5 second interval)

  GET  /api/studio/sync?lastSync=<timestamp>&sessionId=<id>  → pending changes
  POST /api/studio/update                                     → push local changes + heartbeat
  POST /api/studio/connect                                    → announce connection
  POST /api/studio/screenshot                                 → push screenshot data

  Features:
  - Exponential backoff on failures (2s → 4s → 8s → max 30s)
  - Auto-reconnect on reconnect:true response (max 10 attempts)
  - Session expiry detection (401) with clear UI messaging
  - Server-unreachable detection with soft retry status
  - Update-available notification (once per Studio session)
  - Dedicated heartbeat keepalive POST every 30s (prevents session timeout)
  - Graceful degradation: retries silently, never crashes plugin
  - Change queue: batches local changes before pushing
  - execute_luau / structured_commands handler (no loadstring — Creator Store safe)
  - Completion sound on successful AI deploy
--]]

local HttpService  = game:GetService("HttpService")
local RunService   = game:GetService("RunService")
local LogService   = game:GetService("LogService")
local Selection    = game:GetService("Selection")
local SoundService = game:GetService("SoundService")
local TweenService = game:GetService("TweenService")
local Debris       = game:GetService("Debris")
local ChangeHistoryService = game:GetService("ChangeHistoryService")

-- Auto-enable HttpService on first run so the plugin can reach the
-- ForjeGames API. Without this, the plugin silently fails to poll.
pcall(function()
  if not HttpService.HttpEnabled then
    HttpService.HttpEnabled = true
    warn("[ForjeGames] Auto-enabled HttpService.HttpEnabled for API communication")
  end
end)

local Sync = {}

-- Plugin version is exported on the Sync module so Plugin.lua can detect
-- direct-download vs Creator Store builds without hardcoding the string in
-- two places. Store builds suffix this with "-store" at build time; the
-- loadstring auto-enable logic in Plugin.lua:init() checks for that suffix.
Sync.PLUGIN_VERSION = "4.8.0"

-- ============================================================
-- Config
-- ============================================================
local BASE_URL           = "https://forjegames.com"
local PLUGIN_VERSION     = "4.8.0"
local MIN_INTERVAL       = 5    -- seconds (was 2 — burned through Upstash free tier)
local MAX_INTERVAL       = 30   -- seconds (backoff ceiling)
local HEARTBEAT_INTERVAL = 30   -- seconds between keepalive POSTs
local MAX_RECONNECT      = 10   -- give up after this many consecutive reconnect attempts
local CONTEXT_INTERVAL   = 10   -- seconds between scene-graph context pushes
local CONSOLE_INTERVAL   = 5    -- seconds between console log pushes
local CONTEXT_MAX_DEPTH  = 8    -- max recursion depth for workspace walk
local CONSOLE_BUFFER_MAX = 50   -- max buffered log entries

-- ============================================================
-- Internal state
-- ============================================================
local _running             = false
local _heartbeatConn       = nil
local _sseClient           = nil    -- WebStreamClient for live SSE
local _sseConnected        = false  -- true when SSE is receiving events
local _token               = nil
local _sessionId           = nil
local _onStatusChange      = nil
local _onStatusMessage     = nil   -- fn(message: string, level: "info"|"warn"|"error")
local _onUpdateAvailable   = nil   -- fn(info: {latestVersion, downloadUrl, changelog, forceUpdate})
local _lastSync            = 0
local _backoffInterval     = MIN_INTERVAL
local _timeSinceLastPoll   = 0
local _timeSinceHeartbeat  = 0
local _changeQueue         = {}
local _pendingPush         = false
local _baseUrl             = nil
local _reconnectAttempts   = 0
local _updateNotified      = false   -- only show update banner once per session
local _reAuthCallback      = nil     -- set by Sync.start, called when re-auth is needed
local _timeSinceContext    = 0       -- timer for scene-graph push
local _timeSinceConsole    = 0       -- timer for console log push
local _consoleBuffer       = {}      -- ring buffer of recent LogService messages
local _consoleHooked       = false   -- true once we connect LogService.MessageOut
local _lastContextSnapshot = nil     -- previous scene snapshot for delta detection

-- ============================================================
-- Resolve base URL (production default, dev override via settings)
-- ============================================================
local function resolveBaseUrl()
  if _baseUrl then return _baseUrl end

  pcall(function()
    local devUrl = plugin and plugin:GetSetting("ForjeGames_DevUrl")
    if devUrl and type(devUrl) == "string" and #devUrl > 0 then
      _baseUrl = devUrl
    end
  end)

  if not _baseUrl then
    _baseUrl = BASE_URL
  end

  return _baseUrl
end

-- ============================================================
-- Status helpers
-- ============================================================
local function notifyStatus(connected, lastSyncTime)
  if _onStatusChange then
    _onStatusChange(connected, lastSyncTime)
  end
end

local function notifyMessage(message, level)
  level = level or "info"
  if _onStatusMessage then
    _onStatusMessage(message, level)
  else
    -- Fallback to Studio Output
    if level == "error" then
      warn("[ForjeGames] " .. message)
    elseif level == "warn" then
      warn("[ForjeGames] " .. message)
    else
      print("[ForjeGames] " .. message)
    end
  end
end

-- ============================================================
-- HTTP helpers (all pcall-wrapped — never crash the plugin)
-- ============================================================
local function authHeaders()
  local headers = {
    ["Content-Type"]     = "application/json",
    ["X-Plugin-Version"] = PLUGIN_VERSION,
  }
  if _token then
    headers["Authorization"] = "Bearer " .. _token
  end
  if _sessionId then
    headers["X-Session-Id"] = _sessionId
  end
  return headers
end

-- Ensure HTTP is enabled before every request — handles play mode transitions
-- and game setting changes that might disable it mid-session
local function ensureHttpEnabled()
  pcall(function()
    if not HttpService.HttpEnabled then
      HttpService.HttpEnabled = true
      warn("[ForjeGames] Re-enabled HttpService.HttpEnabled")
    end
  end)
end

-- Returns result table on success, nil on network failure, string "http_disabled"
-- if HttpService is blocked, string "unreachable" if server cannot be reached.
local function httpGet(path)
  ensureHttpEnabled()
  local url = resolveBaseUrl() .. path
  local ok, result = pcall(function()
    return HttpService:RequestAsync({
      Url     = url,
      Method  = "GET",
      Headers = authHeaders(),
    })
  end)

  if not ok then
    local errStr = tostring(result)
    -- Roblox throws "Http requests are not enabled" when HTTP is off
    if errStr:find("not enabled") or errStr:find("Http") then
      return nil, "http_disabled"
    end
    -- DNS failure or connection refused
    return nil, "unreachable"
  end

  return result, nil
end

local function httpPost(path, body)
  ensureHttpEnabled()
  local url = resolveBaseUrl() .. path
  local encoded
  local encOk, encErr = pcall(function()
    encoded = HttpService:JSONEncode(body)
  end)
  if not encOk then
    warn("[ForjeGames Sync] JSON encode error: " .. tostring(encErr))
    return nil, nil
  end

  local ok, result = pcall(function()
    return HttpService:RequestAsync({
      Url     = url,
      Method  = "POST",
      Headers = authHeaders(),
      Body    = encoded,
    })
  end)

  if not ok then
    local errStr = tostring(result)
    if errStr:find("not enabled") or errStr:find("Http") then
      return nil, "http_disabled"
    end
    return nil, "unreachable"
  end

  return result, nil
end

-- ============================================================
-- Completion sound — plays when AI commands finish deploying
-- ============================================================
local function playCompletionSound()
  pcall(function()
    local sound = Instance.new("Sound")
    sound.SoundId = "rbxasset://sounds/electronicpingshort.wav"
    sound.Volume = 0.3
    sound.Parent = SoundService
    sound:Play()
    Debris:AddItem(sound, 2)
  end)
end

-- ============================================================
-- Structured command value parser
-- Converts typed value tables from JSON into Roblox datatypes
-- ============================================================
local function parseStructuredValue(v)
  if type(v) ~= "table" then return v end

  local vType = v.type
  if vType == "Vector3" then
    return Vector3.new(v.x or 0, v.y or 0, v.z or 0)
  elseif vType == "CFrame" then
    return CFrame.new(v.x or 0, v.y or 0, v.z or 0)
  elseif vType == "Color3" then
    return Color3.fromRGB(v.r or 0, v.g or 0, v.b or 0)
  elseif vType == "BrickColor" then
    return BrickColor.new(v.name or "Medium stone grey")
  elseif vType == "UDim2" then
    return UDim2.new(v.sx or 0, v.ox or 0, v.sy or 0, v.oy or 0)
  elseif vType == "Enum" then
    local enumOk, enumVal = pcall(function()
      return Enum[v.enumType][v.enumValue]
    end)
    if enumOk then return enumVal end
  end

  -- If it has r/g/b keys but no type, treat as Color3
  if v.r and v.g and v.b and not vType then
    return Color3.fromRGB(v.r, v.g, v.b)
  end
  -- If it has x/y/z keys but no type, treat as Vector3
  if v.x and v.y and v.z and not vType then
    return Vector3.new(v.x, v.y, v.z)
  end

  return v
end

-- ============================================================
-- Resolve instance path for structured commands
-- Supports: "Workspace.Model.Part", "game.Workspace.Part", etc.
-- ============================================================
local function resolveStructuredPath(path)
  if not path or path == "" then return nil end

  -- Handle both "." and "/" separators (web side uses "/" sometimes)
  local normalized = path:gsub("/", ".")
  local parts = {}
  for segment in string.gmatch(normalized, "[^%.]+") do
    table.insert(parts, segment)
  end
  if #parts == 0 then return nil end

  local root
  local startIdx = 1
  local first = parts[1]
  if first == "game" then
    root = game
    startIdx = 2
  elseif first == "Workspace" or first == "workspace" then
    root = workspace
    startIdx = 2
  else
    -- Try as service
    local svcOk, svc = pcall(function() return game:GetService(first) end)
    if svcOk and svc then
      root = svc
      startIdx = 2
    else
      root = workspace
    end
  end

  local current = root
  for i = startIdx, #parts do
    local child = current:FindFirstChild(parts[i])
    if not child then return nil end
    current = child
  end
  return current
end

-- ============================================================
-- Structured commands executor
-- Handles the typed command array from luauToStructuredCommands()
-- Command types: create_part, create_model, create_instance,
--   create_script, create_folder, delete_named, delete_instance,
--   set_property, move_instance, clone_instance, insert_asset,
--   execute_script, create_tween, create_sound, create_light,
--   create_ui_modifier, create_proximity_prompt, create_weld,
--   create_decal
-- ============================================================
local function executeStructuredCommands(commands, commandId)
  if not commands or type(commands) ~= "table" then return 0, 0 end

  -- Scoped undo: wrap the entire AI build in a single ChangeHistory
  -- recording so the user can Ctrl+Z the whole batch without affecting
  -- their manual work. This is the #1 UX feature from Metain that no
  -- other competitor had — now ForjeGames has it too.
  local recording = nil
  pcall(function()
    recording = ChangeHistoryService:TryBeginRecording("ForjeAI Build", "ForjeAI batch command execution")
  end)

  -- Track created instances by name for parent resolution within a batch
  local createdByName = {}
  local successCount = 0
  local failCount = 0

  for _, cmd in ipairs(commands) do
    local cmdOk, cmdErr = pcall(function()
      local cmdType = cmd.type

      if cmdType == "create_part" then
        local part = Instance.new("Part")
        part.Name = cmd.name or "FJ_Part"
        part.Anchored = (cmd.anchored ~= false)
        part:SetAttribute("fj_generated", true)

        -- Size
        if cmd.size then
          part.Size = Vector3.new(
            tonumber(cmd.size.x) or 4,
            tonumber(cmd.size.y) or 1.2,
            tonumber(cmd.size.z) or 2
          )
        elseif cmd.sizeX then
          part.Size = Vector3.new(
            tonumber(cmd.sizeX) or 4,
            tonumber(cmd.sizeY) or 4,
            tonumber(cmd.sizeZ) or 4
          )
        end

        -- Position
        if cmd.position then
          part.CFrame = CFrame.new(
            tonumber(cmd.position.x) or 0,
            tonumber(cmd.position.y) or 5,
            tonumber(cmd.position.z) or 0
          )
        elseif cmd.posX then
          part.CFrame = CFrame.new(
            tonumber(cmd.posX) or 0,
            tonumber(cmd.posY) or 5,
            tonumber(cmd.posZ) or 0
          )
        end

        -- Color
        if cmd.color then
          pcall(function()
            part.Color = Color3.fromRGB(
              tonumber(cmd.color.r) or 163,
              tonumber(cmd.color.g) or 162,
              tonumber(cmd.color.b) or 165
            )
          end)
        end

        -- Material
        if cmd.material then
          pcall(function()
            part.Material = Enum.Material[cmd.material] or Enum.Material.SmoothPlastic
          end)
        end

        -- Extra properties
        if cmd.properties and type(cmd.properties) == "table" then
          for prop, value in pairs(cmd.properties) do
            pcall(function() part[prop] = parseStructuredValue(value) end)
          end
        end

        -- Parent resolution
        local parent = workspace
        if cmd.parentName then
          local resolved = createdByName[cmd.parentName]
            or resolveStructuredPath(cmd.parentName)
            or workspace:FindFirstChild(cmd.parentName, true)
          if resolved then parent = resolved end
        elseif cmd.parent then
          local resolved = resolveStructuredPath(cmd.parent)
          if resolved then parent = resolved end
        end
        part.Parent = parent
        createdByName[part.Name] = part

      elseif cmdType == "create_model" then
        local model = Instance.new("Model")
        model.Name = cmd.name or "FJ_Model"
        model:SetAttribute("fj_generated", true)

        local parent = workspace
        if cmd.parentName then
          local resolved = createdByName[cmd.parentName]
            or resolveStructuredPath(cmd.parentName)
            or workspace:FindFirstChild(cmd.parentName, true)
          if resolved then parent = resolved end
        elseif cmd.parent then
          local resolved = resolveStructuredPath(cmd.parent)
          if resolved then parent = resolved end
        end
        model.Parent = parent
        createdByName[model.Name] = model

      elseif cmdType == "create_instance" then
        local className = cmd.className
        if not className then return end
        local inst = Instance.new(className)
        inst.Name = cmd.name or className
        inst:SetAttribute("fj_generated", true)

        if cmd.properties and type(cmd.properties) == "table" then
          for prop, value in pairs(cmd.properties) do
            pcall(function() inst[prop] = parseStructuredValue(value) end)
          end
        end

        local parent = workspace
        if cmd.parentName or cmd.parent then
          local pPath = cmd.parentName or cmd.parent
          local resolved = createdByName[pPath]
            or resolveStructuredPath(pPath)
            or workspace:FindFirstChild(pPath, true)
          if resolved then parent = resolved end
        end
        inst.Parent = parent
        createdByName[inst.Name] = inst

      elseif cmdType == "create_script" then
        local scriptType = cmd.scriptType or "Script"
        local scriptInst = Instance.new(scriptType)
        scriptInst.Name = cmd.name or "FJ_Script"
        if cmd.source then
          scriptInst.Source = cmd.source
        end
        scriptInst:SetAttribute("fj_generated", true)

        local parent = workspace
        if cmd.parent then
          local resolved = resolveStructuredPath(cmd.parent)
          if resolved then parent = resolved end
        end
        scriptInst.Parent = parent

      elseif cmdType == "delete_named" then
        local inst = workspace:FindFirstChild(cmd.name or "", true)
        if inst then inst:Destroy() end

      elseif cmdType == "delete_instance" then
        local inst = resolveStructuredPath(cmd.path or cmd.instancePath or "")
        if not inst then
          inst = workspace:FindFirstChild(cmd.path or cmd.instancePath or "", true)
        end
        if inst then inst:Destroy() end

      elseif cmdType == "set_property" then
        local inst = resolveStructuredPath(cmd.path or cmd.instancePath or "")
        if not inst then
          inst = workspace:FindFirstChild(cmd.path or cmd.instancePath or "", true)
        end
        if inst and cmd.property then
          pcall(function()
            inst[cmd.property] = parseStructuredValue(cmd.value)
          end)
        end

      elseif cmdType == "move_instance" then
        local inst = resolveStructuredPath(cmd.path or "")
        if inst then
          local newParent = resolveStructuredPath(cmd.newParent or "")
          if newParent then
            inst.Parent = newParent
          end
        end

      elseif cmdType == "clone_instance" then
        local source = resolveStructuredPath(cmd.sourcePath or "")
        if source then
          local clone = source:Clone()
          if cmd.newName then
            clone.Name = cmd.newName
          end
          clone:SetAttribute("fj_generated", true)
          local parent = resolveStructuredPath(cmd.parentPath or "") or workspace
          clone.Parent = parent
          createdByName[clone.Name] = clone
        end

      elseif cmdType == "create_folder" then
        local folder = Instance.new("Folder")
        folder.Name = cmd.name or "FJ_Folder"
        folder:SetAttribute("fj_generated", true)

        local parent = workspace
        if cmd.parentName or cmd.parent then
          local pPath = cmd.parentName or cmd.parent
          local resolved = createdByName[pPath]
            or resolveStructuredPath(pPath)
            or workspace:FindFirstChild(pPath, true)
          if resolved then parent = resolved end
        end
        folder.Parent = parent
        createdByName[folder.Name] = folder

      elseif cmdType == "insert_asset" then
        -- Insert a Roblox marketplace asset by ID within structured commands
        local robloxAssetId = cmd.assetId or cmd.robloxAssetId
        if robloxAssetId then
          local assetOk, assetResult = pcall(function()
            local InsertService = game:GetService("InsertService")
            local model = InsertService:LoadAsset(tonumber(robloxAssetId))
            if model then
              model.Name = cmd.name or ("FJ_Asset_" .. tostring(robloxAssetId))
              model:SetAttribute("fj_generated", true)

              if cmd.position then
                pcall(function()
                  local cf = CFrame.new(
                    tonumber(cmd.position.x) or 0,
                    tonumber(cmd.position.y) or 0,
                    tonumber(cmd.position.z) or 0
                  )
                  -- PivotTo works on any PVInstance without requiring a
                  -- PrimaryPart, unlike the deprecated SetPrimaryPartCFrame.
                  if model.PivotTo then
                    model:PivotTo(cf)
                  elseif model:IsA("Model") and model.PrimaryPart then
                    model:SetPrimaryPartCFrame(cf)
                  end
                end)
              end

              local parent = workspace
              if cmd.parentName or cmd.parent then
                local pPath = cmd.parentName or cmd.parent
                local resolved = createdByName[pPath]
                  or resolveStructuredPath(pPath)
                  or workspace:FindFirstChild(pPath, true)
                if resolved then parent = resolved end
              end

              -- LoadAsset wraps in a Model; move children out if single child
              local children = model:GetChildren()
              if #children == 1 then
                children[1].Parent = parent
                createdByName[children[1].Name] = children[1]
                model:Destroy()
              else
                model.Parent = parent
                createdByName[model.Name] = model
              end
            end
          end)
          if not assetOk then
            warn("[ForjeGames] insert_asset command failed: " .. tostring(assetResult))
          end
        end

      elseif cmdType == "create_tween" then
        -- Animate an existing instance's properties over time using TweenService.
        -- Data shape:
        --   { target (path/name), duration?, easingStyle?, easingDirection?,
        --     repeatCount?, reverses?, delayTime?, properties: {prop: value} }
        local target = nil
        if cmd.target then
          target = createdByName[cmd.target]
            or resolveStructuredPath(cmd.target)
            or workspace:FindFirstChild(cmd.target, true)
        end
        if target and cmd.properties and type(cmd.properties) == "table" then
          local tweenInfo = TweenInfo.new(
            tonumber(cmd.duration) or 1,
            Enum.EasingStyle[cmd.easingStyle or "Quad"] or Enum.EasingStyle.Quad,
            Enum.EasingDirection[cmd.easingDirection or "Out"] or Enum.EasingDirection.Out,
            tonumber(cmd.repeatCount) or 0,
            cmd.reverses == true,
            tonumber(cmd.delayTime) or 0
          )
          local goalProps = {}
          for prop, value in pairs(cmd.properties) do
            goalProps[prop] = parseStructuredValue(value)
          end
          local tween = TweenService:Create(target, tweenInfo, goalProps)
          tween:Play()
        end

      elseif cmdType == "create_sound" then
        -- Insert a Sound instance with SoundId and optional properties.
        -- Data shape:
        --   { assetId, name?, parent?, parentName?, looped?, volume?,
        --     playbackSpeed?, autoPlay?, rollOffMaxDistance?, rollOffMinDistance? }
        if cmd.assetId then
          local sound = Instance.new("Sound")
          sound.Name = cmd.name or "FJ_Sound"
          sound.SoundId = "rbxassetid://" .. tostring(cmd.assetId)
          sound:SetAttribute("fj_generated", true)

          if cmd.looped ~= nil then sound.Looped = cmd.looped == true end
          if cmd.volume ~= nil then
            local v = tonumber(cmd.volume)
            if v then sound.Volume = math.clamp(v, 0, 10) end
          end
          if cmd.playbackSpeed ~= nil then
            local s = tonumber(cmd.playbackSpeed)
            if s then sound.PlaybackSpeed = s end
          end
          if cmd.rollOffMaxDistance ~= nil then
            local d = tonumber(cmd.rollOffMaxDistance)
            if d then sound.RollOffMaxDistance = d end
          end
          if cmd.rollOffMinDistance ~= nil then
            local d = tonumber(cmd.rollOffMinDistance)
            if d then sound.RollOffMinDistance = d end
          end

          -- Extra properties
          if cmd.properties and type(cmd.properties) == "table" then
            for prop, value in pairs(cmd.properties) do
              pcall(function() sound[prop] = parseStructuredValue(value) end)
            end
          end

          local parent = workspace
          if cmd.parentName or cmd.parent then
            local pPath = cmd.parentName or cmd.parent
            local resolved = createdByName[pPath]
              or resolveStructuredPath(pPath)
              or workspace:FindFirstChild(pPath, true)
            if resolved then parent = resolved end
          end
          sound.Parent = parent
          createdByName[sound.Name] = sound

          if cmd.autoPlay then
            pcall(function() sound:Play() end)
          end
        end

      elseif cmdType == "create_light" then
        -- Insert a PointLight, SpotLight, or SurfaceLight on a part.
        -- Data shape:
        --   { lightType?, parent?, parentName?, range?, brightness?, color?,
        --     angle?, face?, shadows?, properties? }
        local lightType = cmd.lightType or "PointLight"
        if lightType ~= "PointLight" and lightType ~= "SpotLight" and lightType ~= "SurfaceLight" then
          lightType = "PointLight"
        end
        local light = Instance.new(lightType)
        light.Name = cmd.name or ("FJ_" .. lightType)
        light:SetAttribute("fj_generated", true)

        if cmd.range ~= nil then
          local r = tonumber(cmd.range)
          if r then light.Range = r end
        end
        if cmd.brightness ~= nil then
          local b = tonumber(cmd.brightness)
          if b then light.Brightness = b end
        end
        if cmd.color then
          pcall(function()
            if type(cmd.color) == "table" then
              light.Color = Color3.fromRGB(
                tonumber(cmd.color.r) or 255,
                tonumber(cmd.color.g) or 255,
                tonumber(cmd.color.b) or 255
              )
            end
          end)
        end
        if cmd.shadows ~= nil then
          light.Shadows = cmd.shadows == true
        end
        -- SpotLight-specific
        if lightType == "SpotLight" and cmd.angle ~= nil then
          local a = tonumber(cmd.angle)
          if a then light.Angle = a end
        end
        -- SurfaceLight-specific
        if (lightType == "SpotLight" or lightType == "SurfaceLight") and cmd.face then
          pcall(function()
            light.Face = Enum.NormalId[cmd.face] or Enum.NormalId.Front
          end)
        end

        -- Extra properties
        if cmd.properties and type(cmd.properties) == "table" then
          for prop, value in pairs(cmd.properties) do
            pcall(function() light[prop] = parseStructuredValue(value) end)
          end
        end

        local parent = workspace
        if cmd.parentName or cmd.parent then
          local pPath = cmd.parentName or cmd.parent
          local resolved = createdByName[pPath]
            or resolveStructuredPath(pPath)
            or workspace:FindFirstChild(pPath, true)
          if resolved then parent = resolved end
        end
        light.Parent = parent
        createdByName[light.Name] = light

      elseif cmdType == "create_ui_modifier" then
        -- Insert a UICorner, UIStroke, UIGradient, UIPadding, or UIListLayout
        -- on a GUI element (or any Instance).
        -- Data shape:
        --   { modifierType, parent?, parentName?, cornerRadius?,
        --     thickness?, color?, transparency?, applyStrokeMode?,
        --     rotation?, colorSequence?, transparencySequence?,
        --     paddingLeft?, paddingRight?, paddingTop?, paddingBottom?,
        --     properties? }
        local modifierType = cmd.modifierType or "UICorner"
        local validModifiers = {
          UICorner = true, UIStroke = true, UIGradient = true,
          UIPadding = true, UIListLayout = true, UIGridLayout = true,
          UITableLayout = true, UIPageLayout = true, UIScale = true,
          UIAspectRatioConstraint = true, UISizeConstraint = true,
          UITextSizeConstraint = true,
        }
        if not validModifiers[modifierType] then
          modifierType = "UICorner"
        end

        local modifier = Instance.new(modifierType)
        modifier.Name = cmd.name or ("FJ_" .. modifierType)
        modifier:SetAttribute("fj_generated", true)

        -- UICorner
        if modifierType == "UICorner" and cmd.cornerRadius ~= nil then
          pcall(function()
            local cr = tonumber(cmd.cornerRadius)
            if cr then
              modifier.CornerRadius = UDim.new(0, cr)
            end
          end)
        end
        -- UIStroke
        if modifierType == "UIStroke" then
          if cmd.thickness ~= nil then
            local t = tonumber(cmd.thickness)
            if t then modifier.Thickness = t end
          end
          if cmd.color then
            pcall(function()
              if type(cmd.color) == "table" then
                modifier.Color = Color3.fromRGB(
                  tonumber(cmd.color.r) or 0,
                  tonumber(cmd.color.g) or 0,
                  tonumber(cmd.color.b) or 0
                )
              end
            end)
          end
          if cmd.transparency ~= nil then
            local tr = tonumber(cmd.transparency)
            if tr then modifier.Transparency = tr end
          end
          if cmd.applyStrokeMode then
            pcall(function()
              modifier.ApplyStrokeMode = Enum.ApplyStrokeMode[cmd.applyStrokeMode]
                or Enum.ApplyStrokeMode.Contextual
            end)
          end
        end
        -- UIGradient
        if modifierType == "UIGradient" then
          if cmd.rotation ~= nil then
            local rot = tonumber(cmd.rotation)
            if rot then modifier.Rotation = rot end
          end
          if cmd.color then
            pcall(function()
              if type(cmd.color) == "table" then
                -- Simple two-color gradient from color table with start/finish
                if cmd.color.start and cmd.color.finish then
                  local s = cmd.color.start
                  local f = cmd.color.finish
                  modifier.Color = ColorSequence.new(
                    Color3.fromRGB(tonumber(s.r) or 255, tonumber(s.g) or 255, tonumber(s.b) or 255),
                    Color3.fromRGB(tonumber(f.r) or 0, tonumber(f.g) or 0, tonumber(f.b) or 0)
                  )
                else
                  -- Single color
                  modifier.Color = ColorSequence.new(Color3.fromRGB(
                    tonumber(cmd.color.r) or 255,
                    tonumber(cmd.color.g) or 255,
                    tonumber(cmd.color.b) or 255
                  ))
                end
              end
            end)
          end
          if cmd.transparency ~= nil then
            pcall(function()
              local tr = tonumber(cmd.transparency)
              if tr then
                modifier.Transparency = NumberSequence.new(tr)
              end
            end)
          end
        end
        -- UIPadding
        if modifierType == "UIPadding" then
          pcall(function()
            if cmd.paddingLeft ~= nil then modifier.PaddingLeft = UDim.new(0, tonumber(cmd.paddingLeft) or 0) end
            if cmd.paddingRight ~= nil then modifier.PaddingRight = UDim.new(0, tonumber(cmd.paddingRight) or 0) end
            if cmd.paddingTop ~= nil then modifier.PaddingTop = UDim.new(0, tonumber(cmd.paddingTop) or 0) end
            if cmd.paddingBottom ~= nil then modifier.PaddingBottom = UDim.new(0, tonumber(cmd.paddingBottom) or 0) end
          end)
        end

        -- Extra properties
        if cmd.properties and type(cmd.properties) == "table" then
          for prop, value in pairs(cmd.properties) do
            pcall(function() modifier[prop] = parseStructuredValue(value) end)
          end
        end

        local parent = workspace
        if cmd.parentName or cmd.parent then
          local pPath = cmd.parentName or cmd.parent
          local resolved = createdByName[pPath]
            or resolveStructuredPath(pPath)
            or workspace:FindFirstChild(pPath, true)
          if resolved then parent = resolved end
        end
        modifier.Parent = parent
        createdByName[modifier.Name] = modifier

      elseif cmdType == "create_proximity_prompt" then
        -- Insert a ProximityPrompt on a part for interactive triggers.
        -- Data shape:
        --   { parent?, parentName?, actionText?, objectText?, holdDuration?,
        --     maxActivationDistance?, keyboardKeyCode?, requiresLineOfSight?,
        --     enabled?, properties? }
        local prompt = Instance.new("ProximityPrompt")
        prompt.Name = cmd.name or "FJ_ProximityPrompt"
        prompt:SetAttribute("fj_generated", true)

        if cmd.actionText then prompt.ActionText = tostring(cmd.actionText) end
        if cmd.objectText then prompt.ObjectText = tostring(cmd.objectText) end
        if cmd.holdDuration ~= nil then
          local hd = tonumber(cmd.holdDuration)
          if hd then prompt.HoldDuration = hd end
        end
        if cmd.maxActivationDistance ~= nil then
          local mad = tonumber(cmd.maxActivationDistance)
          if mad then prompt.MaxActivationDistance = mad end
        end
        if cmd.keyboardKeyCode then
          pcall(function()
            prompt.KeyboardKeyCode = Enum.KeyCode[cmd.keyboardKeyCode] or Enum.KeyCode.E
          end)
        end
        if cmd.requiresLineOfSight ~= nil then
          prompt.RequiresLineOfSight = cmd.requiresLineOfSight == true
        end
        if cmd.enabled ~= nil then
          prompt.Enabled = cmd.enabled ~= false
        end

        -- Extra properties
        if cmd.properties and type(cmd.properties) == "table" then
          for prop, value in pairs(cmd.properties) do
            pcall(function() prompt[prop] = parseStructuredValue(value) end)
          end
        end

        local parent = workspace
        if cmd.parentName or cmd.parent then
          local pPath = cmd.parentName or cmd.parent
          local resolved = createdByName[pPath]
            or resolveStructuredPath(pPath)
            or workspace:FindFirstChild(pPath, true)
          if resolved then parent = resolved end
        end
        prompt.Parent = parent
        createdByName[prompt.Name] = prompt

      elseif cmdType == "create_weld" then
        -- Insert a WeldConstraint between two parts.
        -- Data shape:
        --   { part0 (path/name), part1 (path/name), parent?, parentName?, name? }
        local weld = Instance.new("WeldConstraint")
        weld.Name = cmd.name or "FJ_WeldConstraint"
        weld:SetAttribute("fj_generated", true)

        if cmd.part0 then
          local p0 = createdByName[cmd.part0]
            or resolveStructuredPath(cmd.part0)
            or workspace:FindFirstChild(cmd.part0, true)
          if p0 then weld.Part0 = p0 end
        end
        if cmd.part1 then
          local p1 = createdByName[cmd.part1]
            or resolveStructuredPath(cmd.part1)
            or workspace:FindFirstChild(cmd.part1, true)
          if p1 then weld.Part1 = p1 end
        end

        -- Extra properties
        if cmd.properties and type(cmd.properties) == "table" then
          for prop, value in pairs(cmd.properties) do
            pcall(function() weld[prop] = parseStructuredValue(value) end)
          end
        end

        -- Parent defaults to Part0 if available, else workspace
        local parent = weld.Part0 or workspace
        if cmd.parentName or cmd.parent then
          local pPath = cmd.parentName or cmd.parent
          local resolved = createdByName[pPath]
            or resolveStructuredPath(pPath)
            or workspace:FindFirstChild(pPath, true)
          if resolved then parent = resolved end
        end
        weld.Parent = parent
        createdByName[weld.Name] = weld

      elseif cmdType == "create_decal" then
        -- Insert a Decal or Texture on a part face.
        -- Data shape:
        --   { assetId, decalType?, face?, parent?, parentName?, name?,
        --     transparency?, color3?, studPerTileU?, studPerTileV?, properties? }
        local decalType = cmd.decalType or "Decal"
        if decalType ~= "Decal" and decalType ~= "Texture" then
          decalType = "Decal"
        end

        local decal = Instance.new(decalType)
        decal.Name = cmd.name or ("FJ_" .. decalType)
        decal:SetAttribute("fj_generated", true)

        if cmd.assetId then
          decal.Texture = "rbxassetid://" .. tostring(cmd.assetId)
        end
        if cmd.face then
          pcall(function()
            decal.Face = Enum.NormalId[cmd.face] or Enum.NormalId.Front
          end)
        end
        if cmd.transparency ~= nil then
          local tr = tonumber(cmd.transparency)
          if tr then decal.Transparency = tr end
        end
        if cmd.color3 then
          pcall(function()
            if type(cmd.color3) == "table" then
              decal.Color3 = Color3.fromRGB(
                tonumber(cmd.color3.r) or 255,
                tonumber(cmd.color3.g) or 255,
                tonumber(cmd.color3.b) or 255
              )
            end
          end)
        end
        -- Texture-specific tiling properties
        if decalType == "Texture" then
          if cmd.studPerTileU ~= nil then
            local s = tonumber(cmd.studPerTileU)
            if s then decal.StudsPerTileU = s end
          end
          if cmd.studPerTileV ~= nil then
            local s = tonumber(cmd.studPerTileV)
            if s then decal.StudsPerTileV = s end
          end
        end

        -- Extra properties
        if cmd.properties and type(cmd.properties) == "table" then
          for prop, value in pairs(cmd.properties) do
            pcall(function() decal[prop] = parseStructuredValue(value) end)
          end
        end

        local parent = workspace
        if cmd.parentName or cmd.parent then
          local pPath = cmd.parentName or cmd.parent
          local resolved = createdByName[pPath]
            or resolveStructuredPath(pPath)
            or workspace:FindFirstChild(pPath, true)
          if resolved then parent = resolved end
        end
        decal.Parent = parent
        createdByName[decal.Name] = decal

      elseif cmdType == "execute_script" then
        -- Parents a freshly-created Script/LocalScript containing arbitrary
        -- Luau source into ServerScriptService. This is functionally
        -- equivalent to loadstring() from a Creator Store policy standpoint
        -- (both run untrusted AI-generated code inside the game), so it is
        -- gated behind the same dev-only setting toggle. Store builds ship
        -- with the setting OFF and should route through structured commands
        -- instead.
        local allowExec = false
        pcall(function()
          allowExec = plugin and plugin:GetSetting("ForjeGames_AllowLoadstring") == true
        end)
        if not allowExec then
          warn("[ForjeGames] execute_script requires ForjeGames_AllowLoadstring (dev only). "
            .. "Use structured commands in Creator Store builds.")
          notifyMessage(
            "execute_script is disabled. Use structured commands or enable dev loadstring in plugin settings.",
            "warn"
          )
        else
        local scriptSource = cmd.source or cmd.code or ""
        if scriptSource ~= "" then
          local tempScript = Instance.new("Script")
          tempScript.Name = cmd.name or "FJ_TempExec_" .. tostring(tick())
          tempScript:SetAttribute("fj_generated", true)
          tempScript:SetAttribute("fj_temp_exec", true)

          -- Wrap in pcall for safety + auto-cleanup after execution
          local wrappedSource = string.format([[
-- ForjeGames auto-generated execution wrapper
local ok, err = pcall(function()
%s
end)
if not ok then
  warn("[ForjeGames TempExec] Error: " .. tostring(err))
end
-- Self-cleanup after execution
task.defer(function()
  script:Destroy()
end)
]], scriptSource)

          tempScript.Source = wrappedSource
          tempScript.Parent = cmd.runContext == "server" and game:GetService("ServerScriptService")
            or workspace
        end
        end -- end of allowExec else-branch

      elseif cmdType == "read_script" then
        -- Read the .Source of an existing script instance
        -- Input: { path: "ServerScriptService.GameManager" }
        -- Queues result back via command_result
        local target = resolveStructuredPath(cmd.path or "")
        if not target then
          target = workspace:FindFirstChild(cmd.path or "", true)
        end
        if target and (target:IsA("LuaSourceContainer")) then
          local src = ""
          pcall(function() src = target.Source or "" end)
          Sync.queueChange("script_source", {
            path = cmd.path,
            source = src,
            className = target.ClassName,
            lineCount = select(2, src:gsub("\n", "\n")) + 1,
            parent = target.Parent and target.Parent.Name or "",
            name = target.Name,
          })
        else
          Sync.queueChange("script_source", {
            path = cmd.path,
            error = "Script not found: " .. tostring(cmd.path),
          })
        end

      elseif cmdType == "modify_script" then
        -- Replace the .Source of an existing script
        -- Input: { path: "ServerScriptService.GameManager", source: "new code..." }
        local target = resolveStructuredPath(cmd.path or "")
        if not target then
          target = workspace:FindFirstChild(cmd.path or "", true)
        end
        if target and (target:IsA("LuaSourceContainer")) then
          pcall(function()
            target.Source = cmd.source or ""
          end)
        else
          warn("[ForjeGames] modify_script: script not found: " .. tostring(cmd.path))
        end

      elseif cmdType == "get_game_tree" then
        -- Serialize the DataModel hierarchy and queue it back
        local tree = { services = {}, totalScripts = 0, totalParts = 0, totalDescendants = 0 }
        local count = 0
        local MAX_DESCENDANTS = 500
        local MAX_DEPTH = 8

        local function serializeChildren(parent, depth)
          if depth > MAX_DEPTH or count > MAX_DESCENDANTS then return nil end
          local children = {}
          local ok, kids = pcall(function() return parent:GetChildren() end)
          if not ok or not kids then return children end
          for _, child in ipairs(kids) do
            count = count + 1
            if count > MAX_DESCENDANTS then break end
            local entry = {
              name = child.Name,
              className = child.ClassName,
            }
            if child:IsA("LuaSourceContainer") then
              tree.totalScripts = tree.totalScripts + 1
              local src = ""
              pcall(function() src = child.Source or "" end)
              entry.lineCount = select(2, src:gsub("\n", "\n")) + 1
              local firstLine = src:match("^(.-)\n") or src:sub(1, 80)
              entry.firstLine = firstLine:sub(1, 80)
            elseif child:IsA("BasePart") then
              tree.totalParts = tree.totalParts + 1
            end
            local numChildren = 0
            pcall(function() numChildren = #child:GetChildren() end)
            if numChildren > 0 and depth < MAX_DEPTH and count < MAX_DESCENDANTS then
              entry.children = serializeChildren(child, depth + 1)
              entry.childCount = numChildren
            elseif numChildren > 0 then
              entry.childCount = numChildren
            end
            table.insert(children, entry)
          end
          return children
        end

        -- Serialize key services
        local serviceNames = {
          "Workspace", "ServerScriptService", "ReplicatedStorage",
          "StarterPlayer", "StarterGui", "Lighting", "SoundService",
          "ServerStorage", "ReplicatedFirst", "StarterPack",
        }
        for _, svcName in ipairs(serviceNames) do
          local svcOk, svc = pcall(function() return game:GetService(svcName) end)
          if svcOk and svc then
            tree.services[svcName] = serializeChildren(svc, 1)
          end
        end

        tree.totalDescendants = count
        Sync.queueChange("game_tree", tree)

      elseif cmdType == "search_scripts" then
        -- Search all scripts for a keyword
        -- Input: { query: "DataStore" }
        local query = cmd.query or ""
        local results = {}
        local function searchIn(parent)
          pcall(function()
            for _, child in ipairs(parent:GetDescendants()) do
              if child:IsA("LuaSourceContainer") and #results < 20 then
                local src = ""
                pcall(function() src = child.Source or "" end)
                if src:find(query, 1, true) then
                  table.insert(results, {
                    path = child:GetFullName(),
                    name = child.Name,
                    className = child.ClassName,
                  })
                end
              end
            end
          end)
        end
        searchIn(game:GetService("ServerScriptService"))
        searchIn(game:GetService("ReplicatedStorage"))
        searchIn(game:GetService("StarterPlayer"))
        searchIn(game:GetService("StarterGui"))
        searchIn(workspace)
        Sync.queueChange("search_results", { query = query, results = results })

      elseif cmdType == "get_dependencies" then
        -- Extract require() dependency graph from a script
        -- Input: { path: "ServerScriptService.GameManager" }
        local target = resolveInstance(cmd.path or "")
        if target and target:IsA("LuaSourceContainer") then
          local src = ""
          pcall(function() src = target.Source or "" end)
          local deps = {}
          -- Match require(game.Service.Module) and require(script.Module) patterns
          for req in src:gmatch("require%(([^%)]+)%)") do
            local varMatch = src:match("local%s+(%w+)%s*=%s*require%(" .. req:gsub("[%(%)%.%+%-%*%?%[%]%^%$%%]", "%%%0") .. "%)")
            table.insert(deps, {
              requiredPath = req:match("^%s*(.-)%s*$"), -- trim
              variableName = varMatch or "",
            })
          end
          Sync.queueChange("dependencies", {
            path = target:GetFullName(),
            name = target.Name,
            dependencies = deps,
          })
        else
          Sync.queueChange("dependencies", { path = cmd.path, error = "Script not found" })
        end

      end
    end)

    if cmdOk then
      successCount = successCount + 1
    else
      failCount = failCount + 1
      warn("[ForjeGames] Structured command error (" .. tostring(cmd.type) .. "): " .. tostring(cmdErr))
    end
  end

  -- Finish the scoped undo recording. All parts created in this batch
  -- are now grouped into a single Ctrl+Z action. The user can undo the
  -- entire AI build without affecting their manual work.
  pcall(function()
    if recording then
      ChangeHistoryService:FinishRecording(recording, Enum.FinishRecordingOperation.Commit)
    end
  end)

  -- Report execution result back to the server so the web app knows
  -- whether the build actually landed. Without this, the chat says
  -- "Built!" after queueing without knowing if anything happened.
  if commandId then
    Sync.queueChange("command_result", {
      commandId = commandId,
      success = failCount == 0 and successCount > 0,
      partsCreated = successCount,
      partsFailed = failCount,
      totalCommands = #commands,
    })
  end

  return successCount, failCount
end

-- ============================================================
-- execute_luau handler (Creator Store safe — no loadstring)
-- Receives code from the server and converts to structured commands.
-- The web side already translates Luau to structured_commands for
-- store-edition plugins. For direct execute_luau with raw code,
-- we parse it into simple structured commands here.
-- ============================================================
local function handleExecuteLuau(data, commandId)
  if not data then return end

  -- Prefer structured commands if provided alongside code
  if data.commands and type(data.commands) == "table" then
    executeStructuredCommands(data.commands, commandId)
    playCompletionSound()
    return
  end

  -- If the server sent a structured field (legacy format), use it
  if data.structured then
    local action = data.structured.action
    if action == "create_part" then
      executeStructuredCommands({{ type = "create_part", name = data.structured.name, size = { x = data.structured.sizeX, y = data.structured.sizeY, z = data.structured.sizeZ }, position = { x = data.structured.posX, y = data.structured.posY, z = data.structured.posZ } }})
    elseif action == "delete_named" then
      executeStructuredCommands({{ type = "delete_named", name = data.structured.name }})
    elseif action == "set_property" then
      executeStructuredCommands({{ type = "set_property", instancePath = data.structured.instancePath, property = data.structured.property, value = data.structured.value }})
    end
    playCompletionSound()
    return
  end

  -- If raw code is sent, attempt to parse simple Instance.new() patterns
  -- into structured commands (best-effort, no loadstring)
  if data.code and type(data.code) == "string" then
    local code = data.code
    local commands = {}
    local hasComplexCode = false

    -- Check for constructs we cannot handle
    if code:find("for ") or code:find("while ") or code:find("repeat ")
      or code:find("function ") or code:find("coroutine%.") or code:find("task%.spawn")
      or code:find("require%(") or code:find("pcall%(") then
      hasComplexCode = true
    end

    -- Parse Instance.new("ClassName") patterns
    local varMap = {} -- varName -> { className, props }
    for varName, className in code:gmatch('local%s+(%w+)%s*=%s*Instance%.new%(%s*["\'](%w+)["\']%s*%)') do
      varMap[varName] = { className = className, props = {} }
    end

    -- Parse property assignments: varName.Property = value
    for varName, prop, value in code:gmatch('(%w+)%.(%w+)%s*=%s*(.-)%s*\n') do
      if varMap[varName] then
        varMap[varName].props[prop] = value
      end
    end

    -- Convert parsed instances to structured commands
    for varName, info in pairs(varMap) do
      local className = info.className
      local props = info.props

      if className == "Part" or className == "WedgePart" or className == "TrussPart" then
        local cmd = { type = "create_part", name = props.Name and props.Name:gsub('["\']', '') or varName }

        -- Parse position from Vector3.new(x, y, z) or CFrame.new(x, y, z)
        local posStr = props.Position or props.CFrame
        if posStr then
          local x, y, z = posStr:match("%.new%(%s*(-?[%d%.]+)%s*,%s*(-?[%d%.]+)%s*,%s*(-?[%d%.]+)")
          if x then cmd.position = { x = tonumber(x), y = tonumber(y), z = tonumber(z) } end
        end

        -- Parse size
        local sizeStr = props.Size
        if sizeStr then
          local x, y, z = sizeStr:match("%.new%(%s*(-?[%d%.]+)%s*,%s*(-?[%d%.]+)%s*,%s*(-?[%d%.]+)")
          if x then cmd.size = { x = tonumber(x), y = tonumber(y), z = tonumber(z) } end
        end

        -- Parse color
        local colorStr = props.Color or props.BrickColor
        if colorStr then
          local r, g, b = colorStr:match("fromRGB%(%s*(%d+)%s*,%s*(%d+)%s*,%s*(%d+)")
          if r then cmd.color = { r = tonumber(r), g = tonumber(g), b = tonumber(b) } end
        end

        -- Material
        local matStr = props.Material
        if matStr then
          local mat = matStr:match("Enum%.Material%.(%w+)")
          if mat then cmd.material = mat end
        end

        -- Anchored
        if props.Anchored then
          cmd.anchored = props.Anchored:find("true") ~= nil
        end

        -- Parent
        if props.Parent then
          local parentName = props.Parent:gsub('%s+', '')
          if parentName ~= "workspace" and parentName ~= "game.Workspace" then
            cmd.parentName = parentName
          end
        end

        table.insert(commands, cmd)

      elseif className == "Model" then
        local cmd = { type = "create_model", name = props.Name and props.Name:gsub('["\']', '') or varName }
        if props.Parent then
          local parentName = props.Parent:gsub('%s+', '')
          if parentName ~= "workspace" and parentName ~= "game.Workspace" then
            cmd.parentName = parentName
          end
        end
        table.insert(commands, cmd)
      else
        -- Generic instance creation
        local cmd = { type = "create_instance", className = className, name = props.Name and props.Name:gsub('["\']', '') or varName }
        table.insert(commands, cmd)
      end
    end

    if #commands > 0 then
      executeStructuredCommands(commands, commandId)
      playCompletionSound()
    elseif hasComplexCode then
      -- FALLBACK: loadstring behind a dev-only setting toggle.
      -- This is OFF by default and must be explicitly enabled in
      -- plugin settings. The Creator Store edition ships with this
      -- disabled — only direct-download / sideloaded builds should
      -- enable it.
      local allowLoadstring = false
      pcall(function()
        allowLoadstring = plugin and plugin:GetSetting("ForjeGames_AllowLoadstring") == true
      end)

      if allowLoadstring then
        warn("[ForjeGames] DEV MODE: Executing code via loadstring (not Creator Store safe)")
        local loadOk, loadErr = pcall(function()
          local fn, compileErr = loadstring(code)
          if fn then
            fn()
          else
            warn("[ForjeGames] loadstring compile error: " .. tostring(compileErr))
            error(compileErr)
          end
        end)
        if loadOk then
          playCompletionSound()
          if commandId then
            Sync.queueChange("command_result", {
              commandId = commandId, success = true,
              partsCreated = -1, partsFailed = 0, totalCommands = 1,
              method = "loadstring",
            })
          end
        else
          warn("[ForjeGames] loadstring runtime error: " .. tostring(loadErr))
          notifyMessage("Script execution failed: " .. tostring(loadErr), "error")
          if commandId then
            Sync.queueChange("command_result", {
              commandId = commandId, success = false,
              partsCreated = 0, partsFailed = 1, totalCommands = 1,
              error = tostring(loadErr), method = "loadstring",
            })
          end
        end
      else
        warn("[ForjeGames] Cannot execute complex Luau code in Creator Store mode. "
          .. "This plugin edition uses structured commands only. "
          .. "Use the direct-download plugin for advanced scripts, "
          .. "or enable ForjeGames_AllowLoadstring in plugin settings (dev only).")
        notifyMessage("Complex code requires the direct-download plugin (or enable dev loadstring in settings)", "warn")
        if commandId then
          Sync.queueChange("command_result", {
            commandId = commandId, success = false,
            partsCreated = 0, partsFailed = 0, totalCommands = 0,
            error = "store_edition_no_loadstring", method = "none",
          })
        end
      end
    else
      warn("[ForjeGames] No executable commands found in code payload")
      if commandId then
        Sync.queueChange("command_result", {
          commandId = commandId, success = false,
          partsCreated = 0, partsFailed = 0, totalCommands = 0,
          error = "no_executable_commands", method = "none",
        })
      end
    end
    return
  end

  warn("[ForjeGames] execute_luau received with no code or commands")
end

-- ============================================================
-- Handle structured_commands change type
-- Receives pre-translated commands from the web side
-- ============================================================
local function handleStructuredCommands(data)
  if not data or not data.commands then
    warn("[ForjeGames Sync] structured_commands: missing commands array")
    return
  end
  executeStructuredCommands(data.commands)
  playCompletionSound()
end

-- ============================================================
-- insert_asset command handler
-- ============================================================
local function handleInsertAsset(change)
  local data = change and change.data
  if not data then
    warn("[ForjeGames Sync] insert_asset: missing data payload")
    return
  end

  local robloxAssetId = data.robloxAssetId
  if not robloxAssetId then
    warn("[ForjeGames Sync] insert_asset: robloxAssetId is required")
    return
  end

  local assetOk, assetErr = pcall(function()
    local AssetManager = require(script.Parent.AssetManager)

    local cframe = nil
    if data.position then
      local px = tonumber(data.position.x) or 0
      local py = tonumber(data.position.y) or 0
      local pz = tonumber(data.position.z) or 0
      cframe = CFrame.new(px, py, pz)
    end

    local model = AssetManager.loadMarketplaceAsset(robloxAssetId, {
      name       = data.name or ("FJ_Asset_" .. tostring(robloxAssetId)),
      cframe     = cframe,
      attributes = {
        fj_asset_id        = tostring(data.assetId or robloxAssetId),
        fj_roblox_asset_id = tostring(robloxAssetId),
      },
    })

    if model then
      Sync.queueChange("asset_inserted", {
        assetId       = data.assetId,
        robloxAssetId = tostring(robloxAssetId),
        instanceName  = model.Name,
        success       = true,
      })
    else
      Sync.queueChange("asset_insert_failed", {
        assetId       = data.assetId,
        robloxAssetId = tostring(robloxAssetId),
        error         = "LoadAsset returned nil",
        success       = false,
      })
    end
  end)

  if not assetOk then
    warn("[ForjeGames Sync] insert_asset failed: " .. tostring(assetErr))
    Sync.queueChange("asset_insert_failed", {
      assetId       = tostring(data.assetId or ""),
      robloxAssetId = tostring(robloxAssetId),
      error         = tostring(assetErr),
      success       = false,
    })
  end
end

-- ============================================================
-- Studio Bridge command handlers
-- ============================================================

-- Resolve a dotted instance path like "Workspace.MyModel.Part1"
local function resolveInstancePath(path)
  if not path or path == "" then return nil end
  local parts = {}
  for segment in string.gmatch(path, "[^%.]+") do
    table.insert(parts, segment)
  end
  if #parts == 0 then return nil end

  -- Start from game or a known root
  local root
  local startIdx = 1
  local firstPart = parts[1]
  if firstPart == "game" then
    root = game
    startIdx = 2
  elseif firstPart == "Workspace" or firstPart == "workspace" then
    root = workspace
    startIdx = 2
  else
    -- Try as a service name first
    local svcOk, svc = pcall(function() return game:GetService(firstPart) end)
    if svcOk and svc then
      root = svc
      startIdx = 2
    else
      root = game
    end
  end

  local current = root
  for i = startIdx, #parts do
    local child = current:FindFirstChild(parts[i])
    if not child then return nil end
    current = child
  end
  return current
end

-- Build the full dotted path for an Instance
local function getInstancePath(instance)
  local pathParts = {}
  local current = instance
  while current and current ~= game do
    table.insert(pathParts, 1, current.Name)
    current = current.Parent
  end
  return table.concat(pathParts, ".")
end

-- Recursively serialize a hierarchy tree
local function serializeHierarchy(instance, depth, maxDepth)
  if depth > maxDepth then return nil end
  local node = {
    name = instance.Name,
    className = instance.ClassName,
    children = {},
  }
  for _, child in ipairs(instance:GetChildren()) do
    local childNode = serializeHierarchy(child, depth + 1, maxDepth)
    if childNode then
      table.insert(node.children, childNode)
    end
  end
  return node
end

-- Read serializable properties of an instance
local function serializeProperties(instance)
  local props = {
    Name = instance.Name,
    ClassName = instance.ClassName,
  }
  -- Common properties that are safe to read
  local commonProps = {
    "Anchored", "CanCollide", "Transparency", "Reflectance",
    "Material", "BrickColor", "Color", "Size", "CFrame",
    "Position", "Orientation", "Visible", "Enabled",
    "Value", "Text", "MaxHealth", "Health", "WalkSpeed",
    "JumpPower", "Parent",
  }
  for _, propName in ipairs(commonProps) do
    pcall(function()
      local val = instance[propName]
      if val ~= nil then
        if typeof(val) == "Vector3" then
          props[propName] = { x = val.X, y = val.Y, z = val.Z }
        elseif typeof(val) == "CFrame" then
          props[propName] = { position = { x = val.Position.X, y = val.Position.Y, z = val.Position.Z } }
        elseif typeof(val) == "Color3" then
          props[propName] = { r = val.R, g = val.G, b = val.B }
        elseif typeof(val) == "BrickColor" then
          props[propName] = tostring(val)
        elseif typeof(val) == "EnumItem" then
          props[propName] = tostring(val)
        elseif typeof(val) == "Instance" then
          props[propName] = val:GetFullName()
        elseif type(val) == "string" or type(val) == "number" or type(val) == "boolean" then
          props[propName] = val
        end
      end
    end)
  end
  return props
end

-- Decode a typed value from the MCP bridge
local function decodeTypedValue(value, valueType)
  if valueType == "number" then
    return tonumber(value) or 0
  elseif valueType == "boolean" then
    if type(value) == "boolean" then return value end
    return value == "true" or value == true
  elseif valueType == "Color3" then
    -- Expect "R,G,B" with 0-1 floats
    local parts = {}
    for v in string.gmatch(tostring(value), "[^,]+") do
      table.insert(parts, tonumber(v) or 0)
    end
    return Color3.new(parts[1] or 0, parts[2] or 0, parts[3] or 0)
  elseif valueType == "Vector3" then
    local parts = {}
    for v in string.gmatch(tostring(value), "[^,]+") do
      table.insert(parts, tonumber(v) or 0)
    end
    return Vector3.new(parts[1] or 0, parts[2] or 0, parts[3] or 0)
  elseif valueType == "BrickColor" then
    return BrickColor.new(tostring(value))
  elseif valueType == "Enum" then
    -- Expect "Enum.Material.Grass" format
    local enumVal = nil
    pcall(function()
      -- Walk the Enum path
      local parts = {}
      for v in string.gmatch(tostring(value), "[^%.]+") do
        table.insert(parts, v)
      end
      if #parts >= 3 and parts[1] == "Enum" then
        enumVal = Enum[parts[2]][parts[3]]
      end
    end)
    return enumVal or value
  else
    return value
  end
end

-- Collect all scripts under a root
local function collectScripts(root, maxResults)
  local scripts = {}
  local function recurse(inst)
    if #scripts >= maxResults then return end
    if inst:IsA("LuaSourceContainer") then
      local src = ""
      pcall(function() src = inst.Source end)
      table.insert(scripts, {
        path = getInstancePath(inst),
        className = inst.ClassName,
        source = src,
      })
    end
    for _, child in ipairs(inst:GetChildren()) do
      recurse(child)
    end
  end
  recurse(root)
  return scripts
end

-- Push a bridge result back to the server
local function pushBridgeResult(resultType, requestId, resultData)
  Sync.queueChange("bridge_result", {
    resultType = resultType,
    _requestId = requestId,
    data = resultData,
  })
end

-- Handle: get_hierarchy
local function handleGetHierarchy(data)
  local rootName = data.root or "Workspace"
  local maxDepth = data.maxDepth or 10
  local requestId = data._requestId

  local root
  if rootName == "Workspace" or rootName == "workspace" then
    root = workspace
  elseif rootName == "game" then
    root = game
  else
    local svcOk, svc = pcall(function() return game:GetService(rootName) end)
    root = svcOk and svc or workspace
  end

  local tree = serializeHierarchy(root, 1, maxDepth)
  if requestId then
    pushBridgeResult("hierarchy_result", requestId, tree)
  end
end

-- Handle: get_properties
local function handleGetProperties(data)
  local inst = resolveInstancePath(data.instancePath)
  local requestId = data._requestId
  if not inst then
    if requestId then
      pushBridgeResult("properties_result", requestId, { error = "Instance not found: " .. tostring(data.instancePath) })
    end
    return
  end
  local props = serializeProperties(inst)
  if requestId then
    pushBridgeResult("properties_result", requestId, props)
  end
end

-- Handle: set_property (bridge version with typed values)
local function handleSetProperty(data)
  local inst = resolveInstancePath(data.instancePath)
  if not inst then
    warn("[ForjeGames Sync] set_property: instance not found: " .. tostring(data.instancePath))
    return
  end
  if not data.property then return end
  local decoded = decodeTypedValue(data.value, data.valueType or "string")
  pcall(function()
    inst[data.property] = decoded
  end)
end

-- Handle: create_instance
local function handleCreateInstance(data)
  local className = data.className
  if not className then return end
  local parentPath = data.parentPath or "Workspace"
  local parent = resolveInstancePath(parentPath) or workspace

  local instOk, inst = pcall(function()
    return Instance.new(className)
  end)
  if not instOk or not inst then
    warn("[ForjeGames Sync] create_instance: failed to create " .. tostring(className))
    return
  end

  inst.Name = data.name or className
  inst:SetAttribute("fj_generated", true)

  -- Apply initial properties
  if data.properties and type(data.properties) == "table" then
    for propName, propValue in pairs(data.properties) do
      pcall(function()
        inst[propName] = propValue
      end)
    end
  end

  inst.Parent = parent
end

-- Handle: delete_instance
local function handleDeleteInstance(data)
  local inst = resolveInstancePath(data.instancePath)
  if not inst then
    -- Fallback: recursive search
    inst = game:FindFirstChild(data.instancePath, true)
  end
  if inst then
    inst:Destroy()
  end
end

-- Handle: get_scripts
local function handleGetScripts(data)
  local rootName = data.root or "game"
  local maxResults = data.maxResults or 50
  local requestId = data._requestId

  local root
  if rootName == "game" then
    root = game
  elseif rootName == "Workspace" or rootName == "workspace" then
    root = workspace
  else
    local svcOk, svc = pcall(function() return game:GetService(rootName) end)
    root = svcOk and svc or game
  end

  local scripts = collectScripts(root, maxResults)
  if requestId then
    pushBridgeResult("scripts_result", requestId, scripts)
  end
end

-- Handle: read_script (get source of a single script by path)
local function handleReadScript(data)
  local requestId = data._requestId
  local scriptPath = data.path -- e.g. "ServerScriptService.GameManager"

  if not scriptPath then
    if requestId then pushBridgeResult("read_script_result", requestId, { error = "path required" }) end
    return
  end

  -- Navigate path like "ServerScriptService.GameManager.SubModule"
  local parts = string.split(scriptPath, ".")
  local current = game
  for _, part in ipairs(parts) do
    local child = nil
    pcall(function()
      if current == game then
        child = game:GetService(part)
      else
        child = current:FindFirstChild(part)
      end
    end)
    if not child then
      if requestId then pushBridgeResult("read_script_result", requestId, { error = "Not found: " .. part }) end
      return
    end
    current = child
  end

  if not current:IsA("LuaSourceContainer") then
    if requestId then pushBridgeResult("read_script_result", requestId, { error = "Not a script: " .. scriptPath }) end
    return
  end

  local src = ""
  pcall(function() src = current.Source end)
  if requestId then
    pushBridgeResult("read_script_result", requestId, {
      path = scriptPath,
      className = current.ClassName,
      source = src,
      lineCount = #string.split(src, "\n"),
    })
  end
end

-- Handle: modify_script (replace source of an existing script)
local function handleModifyScript(data)
  local requestId = data._requestId
  local scriptPath = data.path
  local newSource = data.source or data.newSource

  if not scriptPath or not newSource then
    if requestId then pushBridgeResult("modify_script_result", requestId, { error = "path and source required" }) end
    return
  end

  local parts = string.split(scriptPath, ".")
  local current = game
  for _, part in ipairs(parts) do
    local child = nil
    pcall(function()
      if current == game then
        child = game:GetService(part)
      else
        child = current:FindFirstChild(part)
      end
    end)
    if not child then
      if requestId then pushBridgeResult("modify_script_result", requestId, { error = "Not found: " .. part }) end
      return
    end
    current = child
  end

  if not current:IsA("LuaSourceContainer") then
    if requestId then pushBridgeResult("modify_script_result", requestId, { error = "Not a script" }) end
    return
  end

  -- Record undo waypoint
  local rid = nil
  pcall(function()
    rid = ChangeHistoryService:TryBeginRecording("ForjeAI Modify Script")
  end)

  local ok, err = pcall(function()
    current.Source = newSource
  end)

  if rid then
    pcall(function()
      ChangeHistoryService:FinishRecording(rid, Enum.FinishRecordingOperation.Commit)
    end)
  end

  if ok then
    notifyMessage("Modified: " .. scriptPath, "info")
    if requestId then
      pushBridgeResult("modify_script_result", requestId, {
        path = scriptPath,
        success = true,
        lineCount = #string.split(newSource, "\n"),
      })
    end
  else
    if requestId then pushBridgeResult("modify_script_result", requestId, { error = tostring(err) }) end
  end
end

-- Handle: batch_create (create multiple scripts/instances in one command)
local function handleBatchCreate(data)
  local requestId = data._requestId
  local items = data.items
  if not items or type(items) ~= "table" then
    if requestId then pushBridgeResult("batch_create_result", requestId, { error = "items array required" }) end
    return
  end

  local rid = nil
  pcall(function()
    rid = ChangeHistoryService:TryBeginRecording("ForjeAI Batch Create")
  end)

  local results = {}
  for _, item in ipairs(items) do
    local ok, err = pcall(function()
      local className = item.type or item.className or "Script"
      local parentPath = item.parent or "ServerScriptService"
      local name = item.name or "ForjeScript"
      local source = item.source or ""

      -- Resolve parent
      local parent = nil
      pcall(function() parent = game:GetService(parentPath) end)
      if not parent then parent = game:GetService("ServerScriptService") end

      -- Remove existing with same name
      local existing = parent:FindFirstChild(name)
      if existing then existing:Destroy() end

      local inst = Instance.new(className)
      inst.Name = name
      if inst:IsA("LuaSourceContainer") then
        inst.Source = source
      end
      inst.Parent = parent
      table.insert(results, { name = name, parent = parentPath, success = true })
    end)

    if not ok then
      table.insert(results, { name = item.name or "?", error = tostring(err) })
    end
  end

  if rid then
    pcall(function()
      ChangeHistoryService:FinishRecording(rid, Enum.FinishRecordingOperation.Commit)
    end)
  end

  notifyMessage("Batch created " .. #results .. " items", "info")
  if requestId then
    pushBridgeResult("batch_create_result", requestId, { results = results, count = #results })
  end
end

-- ============================================================
-- Playtest / screenshot handlers
--
-- Roblox Studio does NOT expose plugin APIs for:
--   * Starting a playtest (there is no Plugin:StartPlaySolo, and
--     TestService:Run / StudioService:PromptPlaySolo do not work
--     from a normal plugin in edit context).
--   * Stopping a playtest (no Plugin:StopPlaySolo either).
--   * Capturing the viewport (ScreenshotHud is not a capture API;
--     CaptureService is player-only).
--
-- Rather than silently swallowing failures inside pcalls and lying
-- to the caller, these handlers surface `user_action_required`
-- results so the MCP layer can tell the AI exactly what happened.
-- ============================================================

local function handleStartPlaytest(data)
  local requestId = data and data._requestId
  notifyMessage(
    "ForjeGames: Roblox plugins cannot start playtests programmatically. Press F5 to start a playtest manually.",
    "warn"
  )
  if requestId then
    pushBridgeResult("start_playtest_result", requestId, {
      status = "user_action_required",
      message = "Roblox plugin API does not support programmatic playtest start. User must press F5 in Studio.",
    })
  end
end

local function handleStopPlaytest(data)
  local requestId = data and data._requestId
  notifyMessage(
    "ForjeGames: Roblox plugins cannot stop playtests programmatically. Press Shift+F5 to stop the current playtest manually.",
    "warn"
  )
  if requestId then
    pushBridgeResult("stop_playtest_result", requestId, {
      status = "user_action_required",
      message = "Roblox plugin API does not support programmatic playtest stop. User must press Shift+F5 in Studio.",
    })
  end
end

local function handleCaptureScreenshot(data)
  local requestId = data and data._requestId
  notifyMessage(
    "ForjeGames: Roblox plugins cannot capture the Studio viewport. Use the session screenshot uploader on the web app, or take a screenshot via Studio's built-in tools.",
    "warn"
  )
  if requestId then
    pushBridgeResult("screenshot_result", requestId, {
      status = "user_action_required",
      message = "Roblox plugin API does not support programmatic viewport capture. User must upload a screenshot manually, or the AI should rely on read_scene / get_output_log instead.",
    })
  end
end

-- Handle: simulate_input
-- Supports single actions and sequenced input arrays for automated playtesting.
-- Single action shape:
--   { inputType: "keyboard"|"mouse_click"|"mouse_move"|"mouse_scroll",
--     key?: string, action?: "press"|"release"|"tap", duration?: number,
--     x?: number, y?: number, delta?: number }
-- Sequence shape:
--   { sequence: [ { inputType, key, action, duration, x, y, wait }, ... ] }
-- Each step in a sequence can include a "wait" (seconds) to pause before the next step.
local function handleSimulateInput(data)
  local requestId = data and data._requestId
  local VIM
  local vimOk = pcall(function()
    VIM = game:GetService("VirtualInputManager")
  end)

  if not vimOk or not VIM then
    warn("[ForjeGames Sync] VirtualInputManager not available — input simulation requires Studio playtest mode")
    if requestId then
      pushBridgeResult("simulate_input_result", requestId, {
        status = "error",
        message = "VirtualInputManager not available. Input simulation only works during an active playtest (F5).",
      })
    end
    return
  end

  -- Execute a single input step. Returns true on success.
  local function executeStep(step)
    local stepOk, stepErr = pcall(function()
      local inputType = step.inputType or "keyboard"
      local action = step.action or "tap"
      local duration = tonumber(step.duration) or 0.1

      if inputType == "keyboard" then
        local keyName = step.key or "W"
        local keyCode = Enum.KeyCode[keyName]
        if not keyCode then
          warn("[ForjeGames Sync] Invalid KeyCode: " .. tostring(keyName))
          return
        end

        local isShift = step.shift and true or false

        if action == "press" then
          VIM:SendKeyEvent(true, keyCode, isShift, game)
        elseif action == "release" then
          VIM:SendKeyEvent(false, keyCode, isShift, game)
        elseif action == "hold" then
          -- Hold key for `duration` seconds then release
          VIM:SendKeyEvent(true, keyCode, isShift, game)
          task.wait(duration)
          VIM:SendKeyEvent(false, keyCode, isShift, game)
        else -- tap (press + release with brief gap)
          VIM:SendKeyEvent(true, keyCode, isShift, game)
          task.wait(duration)
          VIM:SendKeyEvent(false, keyCode, isShift, game)
        end

      elseif inputType == "mouse_click" then
        local x = tonumber(step.x) or 0
        local y = tonumber(step.y) or 0
        local button = tonumber(step.button) or 0 -- 0=left, 1=right, 2=middle
        VIM:SendMouseButtonEvent(x, y, button, true, game, 1)
        task.wait(duration)
        VIM:SendMouseButtonEvent(x, y, button, false, game, 1)

      elseif inputType == "mouse_move" then
        local x = tonumber(step.x) or 0
        local y = tonumber(step.y) or 0
        VIM:SendMouseMoveEvent(x, y, game)

      elseif inputType == "mouse_scroll" then
        local x = tonumber(step.x) or 0
        local y = tonumber(step.y) or 0
        local delta = tonumber(step.delta) or -120 -- negative = scroll down
        VIM:SendMouseWheelEvent(x, y, delta, game)

      elseif inputType == "text" then
        -- Type a string character by character with a small delay between keys
        local text = step.text or ""
        local charDelay = tonumber(step.charDelay) or 0.05
        for i = 1, #text do
          local ch = text:sub(i, i)
          local charKeyCode = Enum.KeyCode[string.upper(ch)]
          if charKeyCode then
            local needsShift = ch:match("[A-Z]") ~= nil
            VIM:SendKeyEvent(true, charKeyCode, needsShift, game)
            task.wait(charDelay)
            VIM:SendKeyEvent(false, charKeyCode, needsShift, game)
            task.wait(charDelay)
          end
        end
      end
    end)

    if not stepOk then
      warn("[ForjeGames Sync] simulate_input step error: " .. tostring(stepErr))
    end
    return stepOk
  end

  -- Sequence mode: execute an ordered list of input steps with optional waits
  if data.sequence and type(data.sequence) == "table" then
    task.spawn(function()
      local stepsExecuted = 0
      local stepsFailed = 0
      for _, step in ipairs(data.sequence) do
        -- Pre-step wait (pause before this action)
        local preWait = tonumber(step.wait) or 0
        if preWait > 0 then
          task.wait(math.min(preWait, 10)) -- cap at 10s to avoid hanging
        end

        if executeStep(step) then
          stepsExecuted += 1
        else
          stepsFailed += 1
        end
      end

      if requestId then
        pushBridgeResult("simulate_input_result", requestId, {
          status = "completed",
          stepsExecuted = stepsExecuted,
          stepsFailed = stepsFailed,
          totalSteps = #data.sequence,
        })
      end
    end)
    return
  end

  -- Single action mode (backward compatible)
  executeStep(data)

  if requestId then
    pushBridgeResult("simulate_input_result", requestId, {
      status = "completed",
      stepsExecuted = 1,
      stepsFailed = 0,
      totalSteps = 1,
    })
  end
end

-- Handle: get_output (read LogService history)
local function handleGetOutput(data)
  local maxEntries = data.maxEntries or data.limit or 100
  local filter = data.filter or "all"
  local requestId = data._requestId

  local entries = {}
  pcall(function()
    local logs = LogService:GetLogHistory()
    local startIdx = math.max(1, #logs - maxEntries + 1)
    for i = startIdx, #logs do
      local entry = logs[i]
      if entry then
        local messageType = "info"
        if entry.messageType == Enum.MessageType.MessageError then
          messageType = "error"
        elseif entry.messageType == Enum.MessageType.MessageWarning then
          messageType = "warning"
        elseif entry.messageType == Enum.MessageType.MessageInfo then
          messageType = "info"
        elseif entry.messageType == Enum.MessageType.MessageOutput then
          messageType = "output"
        end

        local include = (filter == "all")
          or (filter == "errors" and messageType == "error")
          or (filter == "warnings" and (messageType == "warning" or messageType == "error"))
          or (filter == "info" and messageType ~= "error")

        if include then
          -- Plugin format matches agentic-loop's captureOutputLog reader:
          -- it flattens to `[TYPE] text` strings.
          table.insert(entries, {
            text = entry.message,
            type = messageType,
            time = entry.timestamp,
          })
        end
      end
    end
  end)

  if requestId then
    pushBridgeResult("output_result", requestId, entries)
  end

  -- ALSO mirror the entries to /api/studio/update with event=output_log so
  -- the agentic-loop observe phase (src/lib/ai/agentic-loop.ts) can read
  -- them via getSession().latestState.outputLog without correlating by
  -- requestId. Fire-and-forget.
  task.spawn(function()
    pcall(function()
      httpPost("/api/studio/update", {
        sessionId = _sessionId,
        timestamp = os.time() * 1000,
        event     = "output_log",
        outputLog = entries,
        source    = "plugin",
        placeId   = tostring(game.PlaceId),
        changes   = {},
      })
    end)
  end)
end

-- Handle: scan_workspace — walk the workspace tree and POST a structured
-- snapshot to /api/studio/update. This is what the agentic-loop scene-
-- manifest vision check (src/lib/ai/playtest-vision.ts analyzePlaytestScene)
-- reads via session.latestState.worldSnapshot. Without this handler the
-- scene check always sees null and the loop rides entirely on the console
-- log (which can miss visually-broken-but-cleanly-compiling builds).
local function handleScanWorkspace(data)
  local maxDepth = math.min(tonumber(data.maxDepth or 4) or 4, 6)
  local maxNodes = math.min(tonumber(data.maxNodes or 300) or 300, 600)
  local requestId = data._requestId
  local nodeCount = 0

  local function collectTree(instance, depth)
    if nodeCount >= maxNodes then return nil end
    nodeCount += 1

    local node = {
      name      = instance.Name,
      className = instance.ClassName,
    }

    if instance:IsA("BasePart") then
      local pos = instance.Position
      node.position = { X = pos.X, Y = pos.Y, Z = pos.Z }
      local sz = instance.Size
      node.size = { X = sz.X, Y = sz.Y, Z = sz.Z }
      node.material = tostring(instance.Material)
      node.color = {
        R = instance.Color.R,
        G = instance.Color.G,
        B = instance.Color.B,
      }
    end

    -- Capture script Source so AI can read and edit existing scripts
    if instance:IsA("LuaSourceContainer") then
      local ok, src = pcall(function() return instance.Source end)
      if ok and src and #src > 0 then
        -- Cap at 2000 chars per script to keep payload reasonable
        node.source = #src > 2000 and string.sub(src, 1, 2000) .. "\n-- [truncated]" or src
        node.scriptType = instance.ClassName -- Script, LocalScript, or ModuleScript
      end
    end

    if depth < maxDepth then
      local children = {}
      for _, child in ipairs(instance:GetChildren()) do
        local childNode = collectTree(child, depth + 1)
        if childNode then
          table.insert(children, childNode)
        end
        if nodeCount >= maxNodes then break end
      end
      if #children > 0 then
        node.children = children
      end
    end

    return node
  end

  local tree = {}
  pcall(function()
    for _, child in ipairs(workspace:GetChildren()) do
      local node = collectTree(child, 1)
      if node then table.insert(tree, node) end
      if nodeCount >= maxNodes then break end
    end
  end)

  -- Correlated read for MCP tools
  if requestId then
    pushBridgeResult("snapshot", requestId, tree)
  end

  -- Uncorrelated fallback for agentic-loop (reads session.latestState.worldSnapshot)
  task.spawn(function()
    pcall(function()
      httpPost("/api/studio/update", {
        sessionId = _sessionId,
        timestamp = os.time() * 1000,
        event     = "workspace_snapshot",
        snapshot  = tree,
        source    = "plugin",
        placeId   = tostring(game.PlaceId),
        changes   = {},
      })
    end)
  end)
end

-- Handle: get_selection
local function handleGetSelection(data)
  local requestId = data._requestId
  local selected = {}
  pcall(function()
    local sel = Selection:Get()
    for _, inst in ipairs(sel) do
      table.insert(selected, {
        name = inst.Name,
        className = inst.ClassName,
        path = getInstancePath(inst),
      })
    end
  end)

  if requestId then
    pushBridgeResult("selection_result", requestId, selected)
  end
end

-- ============================================================
-- Apply incoming changes from the server
-- ============================================================
local function applyChanges(changes)
  if not changes or type(changes) ~= "table" then return end

  for _, change in ipairs(changes) do
    local ok, err = pcall(function()
      local changeType = change.type
      local data       = change.data

      if changeType == "execute_luau" then
        handleExecuteLuau(data, change.id)

      elseif changeType == "structured_commands" and data then
        executeStructuredCommands(data.commands, change.id)

      elseif changeType == "insert_asset" and data then
        handleInsertAsset(change)

      elseif changeType == "insert_model" and data then
        local assetOk, assetErr = pcall(function()
          local AssetManager = require(script.Parent.AssetManager)
          AssetManager.insertFromChange(change)
        end)
        if not assetOk then
          warn("[ForjeGames Sync] insert_model failed: " .. tostring(assetErr))
        end

      elseif changeType == "delete_model" and data and data.name then
        local instance = workspace:FindFirstChild(data.name, true)
        if instance then instance:Destroy() end

      elseif changeType == "update_property" and data then
        local instance = workspace:FindFirstChild(data.instancePath or "", true)
        if instance and data.property and data.value ~= nil then
          pcall(function()
            instance[data.property] = data.value
          end)
        end

      elseif changeType == "create_sound" and data then
        -- Audio pipeline: insert a Sound instance with a Roblox audio asset id.
        -- Data shape:
        --   { assetId, name?, parent?, looped?, volume?, playbackSpeed?, autoPlay? }
        local soundOk, soundErr = pcall(function()
          if not data.assetId then
            warn("[ForjeGames Sync] create_sound: missing assetId")
            return
          end

          local sound = Instance.new("Sound")
          sound.Name = data.name or "ForjeAI_Sound"
          sound.SoundId = "rbxassetid://" .. tostring(data.assetId)
          sound:SetAttribute("fj_generated", true)
          if data.kind then sound:SetAttribute("fj_audio_kind", tostring(data.kind)) end

          if data.looped ~= nil then sound.Looped = data.looped and true or false end
          if data.volume ~= nil then
            local v = tonumber(data.volume)
            if v then sound.Volume = math.clamp(v, 0, 10) end
          end
          if data.playbackSpeed ~= nil then
            local s = tonumber(data.playbackSpeed)
            if s then sound.PlaybackSpeed = s end
          end

          local parent = workspace
          if data.parent and data.parent ~= "" then
            local found = workspace:FindFirstChild(tostring(data.parent), true)
            if found then
              parent = found
            end
          end
          sound.Parent = parent

          if data.autoPlay then
            pcall(function() sound:Play() end)
          end
        end)
        if not soundOk then
          warn("[ForjeGames Sync] create_sound failed: " .. tostring(soundErr))
        end

      -- Studio Bridge commands
      elseif changeType == "get_hierarchy" and data then
        handleGetHierarchy(data)

      elseif changeType == "get_properties" and data then
        handleGetProperties(data)

      elseif changeType == "set_property" and data then
        handleSetProperty(data)

      elseif changeType == "create_instance" and data then
        handleCreateInstance(data)

      elseif changeType == "delete_instance" and data then
        handleDeleteInstance(data)

      elseif changeType == "get_scripts" and data then
        handleGetScripts(data)

      elseif changeType == "read_script" and data then
        handleReadScript(data)

      elseif changeType == "modify_script" and data then
        handleModifyScript(data)

      elseif changeType == "batch_create" and data then
        handleBatchCreate(data)

      elseif changeType == "start_playtest" and data then
        handleStartPlaytest(data)

      elseif changeType == "stop_playtest" then
        handleStopPlaytest(data or {})

      elseif changeType == "capture_screenshot" then
        handleCaptureScreenshot(data or {})

      elseif changeType == "simulate_input" and data then
        handleSimulateInput(data)

      elseif changeType == "get_output" and data then
        handleGetOutput(data)

      elseif changeType == "get_selection" then
        handleGetSelection(data or {})

      elseif changeType == "scan_workspace" then
        handleScanWorkspace(data or {})
      end
    end)

    if not ok then
      warn("[ForjeGames Sync] Failed to apply change: " .. tostring(err))
    end
  end
end

-- ============================================================
-- Scene-graph context gathering
-- Walks workspace recursively (max depth 8) and captures
-- instance metadata for AI context awareness.
-- ============================================================

local function getInstancePath(inst)
  local parts = {}
  local current = inst
  while current and current ~= game do
    table.insert(parts, 1, current.Name)
    current = current.Parent
  end
  return table.concat(parts, ".")
end

local function walkInstance(inst, depth, tree, counts)
  if depth > CONTEXT_MAX_DEPTH then return end

  local entry = {
    name      = inst.Name,
    className = inst.ClassName,
    childCount = #inst:GetChildren(),
  }

  -- BasePart properties: position, size, material, color
  if inst:IsA("BasePart") then
    counts.parts = counts.parts + 1
    local pos = inst.Position
    entry.position = { x = math.floor(pos.X * 10) / 10, y = math.floor(pos.Y * 10) / 10, z = math.floor(pos.Z * 10) / 10 }
    local sz = inst.Size
    entry.size = { x = math.floor(sz.X * 10) / 10, y = math.floor(sz.Y * 10) / 10, z = math.floor(sz.Z * 10) / 10 }
    entry.material = tostring(inst.Material)
    local col = inst.Color
    entry.color = { r = math.floor(col.R * 255), g = math.floor(col.G * 255), b = math.floor(col.B * 255) }
  end

  -- Script metadata: source preview, disabled state, parent path, require graph
  if inst:IsA("LuaSourceContainer") then
    counts.scripts = counts.scripts + 1
    local srcOk, src = pcall(function() return inst.Source end)
    if srcOk and type(src) == "string" then
      entry.source = string.sub(src, 1, 500)
      -- Extract first 3 lines for quick purpose identification
      local lines = {}
      local lineCount = 0
      for line in src:gmatch("[^\n]+") do
        lineCount = lineCount + 1
        if lineCount <= 3 then
          table.insert(lines, line)
        else
          break
        end
      end
      entry.firstLines = table.concat(lines, "\n")
      -- Extract require() dependencies
      local deps = {}
      for req in src:gmatch("require%(([^%)]+)%)") do
        table.insert(deps, req:match("^%s*(.-)%s*$"))
      end
      if #deps > 0 then
        entry.requires = deps
      end
    end
    entry.disabled = inst:IsA("Script") and inst.Disabled or false
    entry.parentPath = getInstancePath(inst.Parent)
  end

  -- Lights
  if inst:IsA("Light") then
    counts.lights = counts.lights + 1
  end

  -- Models
  if inst:IsA("Model") then
    counts.models = counts.models + 1
  end

  -- Recurse into children
  local children = {}
  for _, child in ipairs(inst:GetChildren()) do
    walkInstance(child, depth + 1, children, counts)
  end
  if #children > 0 then
    entry.children = children
  end

  table.insert(tree, entry)
end

--- Gathers a full scene-graph snapshot of workspace.
--- Returns a JSON-encodable table with counts and the tree.
function Sync.gatherFullContext()
  local tree = {}
  local counts = { parts = 0, scripts = 0, lights = 0, models = 0 }

  -- Walk Workspace (parts, models, lights, scripts)
  local ok, err = pcall(function()
    for _, child in ipairs(game.Workspace:GetChildren()) do
      walkInstance(child, 1, tree, counts)
    end
  end)
  if not ok then
    warn("[ForjeGames] gatherFullContext workspace error: " .. tostring(err))
  end

  -- Walk script-heavy services so the AI knows about ALL scripts in the game
  -- This is what Lemonade calls "contextual Roblox data" — full game awareness
  local scriptServices = {
    { name = "ServerScriptService", svc = game:GetService("ServerScriptService") },
    { name = "ReplicatedStorage", svc = game:GetService("ReplicatedStorage") },
    { name = "StarterPlayer", svc = game:GetService("StarterPlayer") },
    { name = "StarterGui", svc = game:GetService("StarterGui") },
    { name = "ServerStorage", svc = game:GetService("ServerStorage") },
    { name = "ReplicatedFirst", svc = game:GetService("ReplicatedFirst") },
  }

  for _, info in ipairs(scriptServices) do
    pcall(function()
      local svcNode = {
        name = info.name,
        className = "Service",
        childCount = #info.svc:GetChildren(),
        children = {},
        scriptType = "service",
      }
      for _, child in ipairs(info.svc:GetChildren()) do
        walkInstance(child, 2, svcNode.children, counts)
      end
      if #svcNode.children > 0 then
        table.insert(tree, svcNode)
      end
    end)
  end

  return {
    partCount   = counts.parts,
    scriptCount = counts.scripts,
    lightCount  = counts.lights,
    modelCount  = counts.models,
    tree        = tree,
    timestamp   = os.time(),
  }
end

-- ============================================================
-- Console log mirroring
-- Hooks LogService.MessageOut to buffer the last N log entries
-- ============================================================

local function hookConsoleLog()
  if _consoleHooked then return end
  _consoleHooked = true

  pcall(function()
    LogService.MessageOut:Connect(function(message, messageType)
      local entry = {
        message   = string.sub(tostring(message), 1, 500),
        type      = tostring(messageType),
        timestamp = os.time(),
      }

      table.insert(_consoleBuffer, entry)

      -- Trim to max buffer size (ring buffer)
      while #_consoleBuffer > CONSOLE_BUFFER_MAX do
        table.remove(_consoleBuffer, 1)
      end
    end)
  end)
end

--- Returns the current console buffer (array of {message, type, timestamp}).
function Sync.getConsoleBuffer()
  return _consoleBuffer
end

-- ============================================================
-- Build delta detection
-- Compares a before-state snapshot to the current state to find
-- what changed (new parts, modified scripts, errors).
-- ============================================================

local function indexSnapshot(snapshot)
  local index = {}
  if not snapshot or not snapshot.tree then return index end

  local function walk(nodes, parentPath)
    for _, node in ipairs(nodes) do
      local path = parentPath .. "/" .. node.name
      index[path] = node
      if node.children then
        walk(node.children, path)
      end
    end
  end

  walk(snapshot.tree, "")
  return index
end

--- Takes a before-state snapshot and compares to current workspace.
--- Returns a delta table: { newParts, modifiedScripts, removedParts, errors, summary }
function Sync.gatherBuildDelta(beforeState)
  local afterState = Sync.gatherFullContext()
  local beforeIndex = indexSnapshot(beforeState)
  local afterIndex = indexSnapshot(afterState)

  local newParts = {}
  local modifiedScripts = {}
  local removedParts = {}

  -- Find new and modified items
  for path, afterNode in pairs(afterIndex) do
    local beforeNode = beforeIndex[path]
    if not beforeNode then
      table.insert(newParts, { path = path, className = afterNode.className, name = afterNode.name })
    elseif afterNode.source and beforeNode.source and afterNode.source ~= beforeNode.source then
      table.insert(modifiedScripts, { path = path, name = afterNode.name, newSource = afterNode.source })
    end
  end

  -- Find removed items
  for path, beforeNode in pairs(beforeIndex) do
    if not afterIndex[path] then
      table.insert(removedParts, { path = path, className = beforeNode.className, name = beforeNode.name })
    end
  end

  -- Collect recent errors from console buffer
  local errors = {}
  for _, entry in ipairs(_consoleBuffer) do
    if entry.type == "Enum.MessageType.MessageError" or entry.type == "MessageError" then
      table.insert(errors, entry.message)
    end
  end

  return {
    newParts        = newParts,
    modifiedScripts = modifiedScripts,
    removedParts    = removedParts,
    errors          = errors,
    partCountBefore = beforeState and beforeState.partCount or 0,
    partCountAfter  = afterState.partCount,
    scriptCountBefore = beforeState and beforeState.scriptCount or 0,
    scriptCountAfter  = afterState.scriptCount,
    timestamp       = os.time(),
  }
end

-- ============================================================
-- Push scene-graph context to server (every CONTEXT_INTERVAL seconds)
-- Uses the existing /api/studio/update endpoint with event type.
-- ============================================================
local function pushContext()
  if not _token or not _sessionId then return end

  task.spawn(function()
    local snapshot = Sync.gatherFullContext()
    _lastContextSnapshot = snapshot

    local payload = {
      event     = "workspace_snapshot",
      sessionId = _sessionId,
      timestamp = os.time(),
      placeId   = game.PlaceId,
      snapshot  = snapshot,
      -- Include summary counts at top level for the update route
      partCount  = snapshot.partCount,
      modelCount = snapshot.modelCount,
      lightCount = snapshot.lightCount,
      sceneTree  = snapshot.tree,
    }

    local result, netErr = httpPost("/api/studio/update", payload)
    if not result or (result and result.StatusCode ~= 200) then
      -- Silent failure — context push is non-critical
      if netErr ~= "http_disabled" then
        -- Only warn once, not every 10s
      end
    end
  end)
end

-- ============================================================
-- Push console logs to server (every CONSOLE_INTERVAL seconds)
-- Uses the existing /api/studio/update endpoint with event type.
-- ============================================================
local function pushConsoleLogs()
  if not _token or not _sessionId then return end
  if #_consoleBuffer == 0 then return end

  task.spawn(function()
    -- Snapshot the buffer and send
    local logsToSend = {}
    for _, entry in ipairs(_consoleBuffer) do
      table.insert(logsToSend, entry)
    end

    local payload = {
      event     = "output_log",
      sessionId = _sessionId,
      timestamp = os.time(),
      placeId   = game.PlaceId,
      outputLog = logsToSend,
    }

    local result, netErr = httpPost("/api/studio/update", payload)
    -- Silent failure — console push is non-critical
  end)
end

-- ============================================================
-- Announce connection to the server
-- ============================================================
local function sendConnect()
  if not _token then return end

  local payload = {
    token         = _token,
    placeId       = game.PlaceId,
    placeName     = game.Name ~= "" and game.Name or tostring(game.PlaceId),
    pluginVersion = PLUGIN_VERSION,
    sessionId     = _sessionId,
  }

  local result, netErr = httpPost("/api/studio/connect", payload)
  if netErr == "http_disabled" then
    notifyMessage("HTTP Requests blocked — go to Game Settings > Security > Allow HTTP Requests and turn it ON, then reconnect", "error")
    notifyStatus(false, _lastSync)
    return
  end

  if result and result.StatusCode == 200 then
    local ok, data = pcall(function()
      return HttpService:JSONDecode(result.Body)
    end)
    if ok and data and data.sessionId then
      _sessionId = data.sessionId
    end
  end
end

-- ============================================================
-- Re-authenticate using stored token (called on reconnect: true)
-- ============================================================
local function attemptReAuth()
  _reconnectAttempts = _reconnectAttempts + 1

  if _reconnectAttempts > MAX_RECONNECT then
    notifyMessage("Disconnected: max reconnect attempts reached. Re-enter your code.", "error")
    notifyStatus(false, _lastSync)
    if _onStatusMessage then
      _onStatusMessage("Disconnected", "error")
    end
    _running = false
    if _heartbeatConn then
      _heartbeatConn:Disconnect()
      _heartbeatConn = nil
    end
    return
  end

  notifyMessage("Reconnecting... (attempt " .. _reconnectAttempts .. "/" .. MAX_RECONNECT .. ")", "warn")
  notifyStatus(false, _lastSync)

  if _reAuthCallback then
    -- Delegate re-auth to Plugin.lua which holds the reauthenticate function
    task.spawn(_reAuthCallback)
  else
    -- No callback: try reconnecting with existing token via connect endpoint
    task.spawn(function()
      sendConnect()
      _backoffInterval = MIN_INTERVAL
    end)
  end
end

-- ============================================================
-- Poll for pending server changes
-- ============================================================
local function pollSync()
  if not _token then return end

  -- Token goes in the Authorization header (not the URL) so it is not logged
  -- by proxies, CDNs, or Roblox's own request logger.
  -- sessionId is also sent as a header so the server can resolve the session
  -- without needing a valid JWT on every Lambda cold-start.
  local path = "/api/studio/sync?lastSync=" .. tostring(math.floor(_lastSync))
  if _sessionId then
    path = path .. "&sessionId=" .. _sessionId
  end
  -- pluginVer lets the server check for updates without relying on a separate header
  path = path .. "&pluginVer=" .. PLUGIN_VERSION

  local result, netErr = httpGet(path)

  -- Network-layer errors
  if netErr == "http_disabled" then
    notifyMessage("Error: HTTP not enabled — enable in Game Settings > Security", "error")
    notifyStatus(false, _lastSync)
    return
  end

  if netErr == "unreachable" or not result then
    _backoffInterval = math.min(_backoffInterval * 2, MAX_INTERVAL)
    notifyMessage("Server unreachable — retrying in " .. _backoffInterval .. "s", "warn")
    notifyStatus(false, _lastSync)
    return
  end

  local status = result.StatusCode

  if status == 200 then
    _backoffInterval     = MIN_INTERVAL
    _reconnectAttempts   = 0

    local ok, data = pcall(function()
      return HttpService:JSONDecode(result.Body)
    end)

    if ok and data then
      -- serverTime is Unix milliseconds. tick() returns Unix seconds as a float.
      -- If serverTime is missing, multiply tick() by 1000 to stay in ms.
      -- Never fall back to os.time() — it is not available in all Roblox contexts.
      _lastSync = data.serverTime or math.floor(tick() * 1000)

      -- Apply pending studio commands
      if data.changes and #data.changes > 0 then
        applyChanges(data.changes)
      end

      -- Auto-reconnect flag from server
      if data.reconnect == true then
        attemptReAuth()
        return
      end

      -- Update available notification (once per session)
      if data.updateAvailable == true and not _updateNotified then
        _updateNotified = true
        -- Fire the rich update callback if registered (used by Plugin.lua to show banner)
        if _onUpdateAvailable then
          _onUpdateAvailable({
            latestVersion = data.latestVersion or "latest",
            downloadUrl   = data.downloadUrl or data.updateUrl or (resolveBaseUrl() .. "/api/studio/plugin"),
            changelog     = data.changelog or "",
            forceUpdate   = data.forceUpdate == true,
          })
        else
          -- Fallback: plain Output message
          notifyMessage(
            "Plugin update available (v" .. (data.latestVersion or "latest") .. ")! " ..
            "Download: " .. (data.downloadUrl or data.updateUrl or "forjegames.com/download"),
            "warn"
          )
        end
      end
    end

    notifyStatus(true, _lastSync)

  elseif status == 401 then
    -- Session expired — prompt user to re-enter code
    _backoffInterval = MAX_INTERVAL
    notifyMessage("Session expired. Enter a new code from forjegames.com/editor", "error")
    notifyStatus(false, _lastSync)

  elseif status == 403 then
    -- HTTP service blocked at the game level
    notifyMessage("HTTP Requests blocked — go to Game Settings > Security > Allow HTTP Requests and turn it ON, then reconnect", "error")
    notifyStatus(false, _lastSync)

  elseif status == 429 then
    -- Rate limited — parse retryAfterMs from body if present, otherwise triple backoff.
    -- Keep status as connected=true so the UI doesn't flash a disconnect banner for
    -- a transient rate-limit; the plugin will resume normally on the next poll.
    local rlOk, rlData = pcall(function() return HttpService:JSONDecode(result.Body) end)
    if rlOk and rlData and rlData.retryAfterMs then
      _backoffInterval = math.min(math.ceil(rlData.retryAfterMs / 1000) + 1, MAX_INTERVAL)
    else
      _backoffInterval = math.min(_backoffInterval * 3, MAX_INTERVAL)
    end
    -- Still report connected=true — we have a live session, just throttled
    notifyStatus(true, _lastSync)

  else
    _backoffInterval = math.min(_backoffInterval * 2, MAX_INTERVAL)
    notifyStatus(false, _lastSync)
  end
end

-- ============================================================
-- Push local changes to API
-- ============================================================
local function pushChanges()
  if #_changeQueue == 0 then return end
  if not _token then return end

  local batch = {}
  for _, c in ipairs(_changeQueue) do
    table.insert(batch, c)
  end
  _changeQueue  = {}
  _pendingPush  = false

  local payload = {
    timestamp = os.time(),
    changes   = batch,
    source    = "studio-plugin",
    placeId   = game.PlaceId,
    jobId     = game.JobId,
    sessionId = _sessionId,
  }

  local result, netErr = httpPost("/api/studio/update", payload)
  if not (result and result.StatusCode == 200) then
    -- Re-queue on failure
    for _, c in ipairs(batch) do
      table.insert(_changeQueue, c)
    end
    if netErr ~= "http_disabled" then
      warn("[ForjeGames Sync] Failed to push changes, will retry")
    end
  end
end

-- ============================================================
-- Heartbeat keepalive POST (every 30 seconds)
-- Prevents the session from timing out during idle periods.
-- ============================================================
local function sendHeartbeat()
  if not _token then return end

  local payload = {
    heartbeat  = true,
    timestamp  = os.time(),
    sessionId  = _sessionId,
    placeId    = game.PlaceId,
    pluginVersion = PLUGIN_VERSION,
  }

  -- Fire and forget — don't block on result, don't retry
  task.spawn(function()
    local result, netErr = httpPost("/api/studio/update", payload)
    if netErr == "http_disabled" then
      notifyMessage("Error: HTTP not enabled — enable in Game Settings > Security", "error")
    end
    -- Heartbeat failure is silent — pollSync handles status display
  end)
end

-- ============================================================
-- Heartbeat tick
-- ============================================================
local function onHeartbeat(dt)
  if not _running then return end

  _timeSinceLastPoll  = _timeSinceLastPoll  + dt
  _timeSinceHeartbeat = _timeSinceHeartbeat + dt
  _timeSinceContext   = _timeSinceContext   + dt
  _timeSinceConsole   = _timeSinceConsole   + dt

  -- Dedicated keepalive heartbeat
  if _timeSinceHeartbeat >= HEARTBEAT_INTERVAL then
    _timeSinceHeartbeat = 0
    sendHeartbeat()
  end

  -- Scene-graph context push (every 10 seconds)
  if _timeSinceContext >= CONTEXT_INTERVAL then
    _timeSinceContext = 0
    pushContext()
  end

  -- Console log push (every 5 seconds)
  if _timeSinceConsole >= CONSOLE_INTERVAL then
    _timeSinceConsole = 0
    pushConsoleLogs()
  end

  -- Poll + push cycle
  if _timeSinceLastPoll >= _backoffInterval then
    _timeSinceLastPoll = 0
    pollSync()
    if _pendingPush then
      pushChanges()
    end
  end
end

-- ============================================================
-- Public: push a screenshot payload
-- ============================================================
function Sync.pushScreenshot(imageData)
  if not _token then return end
  local payload = {
    image     = imageData,
    placeId   = game.PlaceId,
    sessionId = _sessionId,
    timestamp = os.time(),
  }
  local result, netErr = httpPost("/api/studio/screenshot", payload)
  if netErr then return false end
  return result ~= nil and result.StatusCode == 200
end

-- ============================================================
-- Public: queue a local change for push
-- ============================================================
function Sync.queueChange(changeType, data)
  table.insert(_changeQueue, {
    type      = changeType,
    data      = data,
    timestamp = os.time(),
  })
  _pendingPush = true
end

-- ============================================================
-- Live SSE connection (replaces polling when available)
-- Uses CreateWebStreamClient (shipped Oct 2025) for instant
-- command delivery. Falls back to polling if not supported.
-- ============================================================
local function connectLiveSSE()
  if not _sessionId or not _token then return end

  -- Check if CreateWebStreamClient is available (Roblox 2025.10+)
  if not HttpService.CreateWebStreamClient then
    warn("[ForjeGames] CreateWebStreamClient not available — using polling fallback")
    return
  end

  local url = resolveBaseUrl() .. "/api/studio/live?sessionId=" .. HttpService:UrlEncode(_sessionId)

  local ok, client = pcall(function()
    local headers = authHeaders()
    return HttpService:CreateWebStreamClient(Enum.WebStreamClientType.SSE, {
      Url = url,
      Headers = headers,
    })
  end)

  if not ok or not client then
    warn("[ForjeGames] SSE connection failed — using polling fallback: " .. tostring(client))
    return
  end

  _sseClient = client

  -- Handle incoming SSE messages
  client.MessageReceived:Connect(function(message)
    local dataStr = message
    if not dataStr or dataStr == "" then return end

    local parseOk, parsed = pcall(function()
      return HttpService:JSONDecode(dataStr)
    end)
    if not parseOk or not parsed then return end

    -- Handle command events — same dispatch as applyChanges
    if parsed.type then
      _sseConnected = true
      local changeType = parsed.type
      local data = parsed.data

      if _onStatusChange then
        _onStatusChange(true, os.time())
      end

      local dispatchOk, dispatchErr = pcall(function()
        if changeType == "execute_luau" then
          handleExecuteLuau(data, parsed.id)
        elseif changeType == "structured_commands" and data then
          executeStructuredCommands(data.commands, parsed.id)
        elseif changeType == "insert_asset" and data then
          handleInsertAsset(parsed)
        end
      end)

      if not dispatchOk then
        warn("[ForjeGames SSE] Command dispatch error: " .. tostring(dispatchErr))
      end
    end
  end)

  client.Opened:Connect(function()
    _sseConnected = true
    warn("[ForjeGames] Live SSE connected — commands will arrive instantly")
    if _onStatusMessage then
      _onStatusMessage("Live connection active", "info")
    end
    if _onStatusChange then
      _onStatusChange(true, os.time())
    end
  end)

  client.Closed:Connect(function()
    _sseConnected = false
    _sseClient = nil
    warn("[ForjeGames] SSE disconnected — falling back to polling")
    if _onStatusMessage then
      _onStatusMessage("Live connection lost, using polling", "warn")
    end
    if _running then
      task.delay(5, connectLiveSSE)
    end
  end)

  client.Error:Connect(function(err)
    warn("[ForjeGames] SSE error: " .. tostring(err))
    _sseConnected = false
  end)
end

-- ============================================================
-- Public: start sync loop
--
-- opts:
--   token           string   — bearer token
--   sessionId       string?  — session ID from auth
--   onStatusChange  fn(connected: bool, lastSync: number)
--   onStatusMessage fn(message: string, level: "info"|"warn"|"error")
--   onReAuthNeeded  fn()     — called when the plugin must re-authenticate
-- ============================================================
function Sync.start(opts)
  if _running then return end

  _token              = opts.token
  _sessionId          = opts.sessionId or nil
  _onStatusChange     = opts.onStatusChange
  _onStatusMessage    = opts.onStatusMessage
  _onUpdateAvailable  = opts.onUpdateAvailable
  _reAuthCallback     = opts.onReAuthNeeded
  _backoffInterval    = MIN_INTERVAL
  _timeSinceLastPoll  = 0
  _timeSinceHeartbeat = 0
  _timeSinceContext   = 0
  _timeSinceConsole   = 0
  _reconnectAttempts  = 0
  _running            = true

  -- Hook LogService for console mirroring
  hookConsoleLog()

  task.spawn(function()
    resolveBaseUrl()
    sendConnect()
    -- Try live SSE connection (instant command delivery)
    -- Falls back to polling if CreateWebStreamClient isn't available
    task.delay(2, connectLiveSSE)
  end)

  _heartbeatConn = RunService.Heartbeat:Connect(onHeartbeat)

  task.delay(1, pollSync)
end

-- ============================================================
-- Public: stop sync loop
-- ============================================================
function Sync.stop()
  _running = false
  if _heartbeatConn then
    _heartbeatConn:Disconnect()
    _heartbeatConn = nil
  end
  if _sseClient then
    pcall(function() _sseClient:Close() end)
    _sseClient = nil
    _sseConnected = false
  end
end

-- ============================================================
-- Public: update auth token (after re-login)
-- ============================================================
function Sync.setToken(token)
  _token             = token
  _backoffInterval   = MIN_INTERVAL
  _reconnectAttempts = 0
  task.spawn(sendConnect)
end

-- ============================================================
-- Public: reset reconnect attempt counter
-- (called by Plugin.lua after a successful re-auth)
-- ============================================================
function Sync.resetReconnect()
  _reconnectAttempts = 0
  _backoffInterval   = MIN_INTERVAL
end

-- ============================================================
-- Public: get current sync status
-- ============================================================
function Sync.getStatus()
  return {
    running            = _running,
    connected          = _backoffInterval == MIN_INTERVAL,
    lastSync           = _lastSync,
    backoffInterval    = _backoffInterval,
    pendingChanges     = #_changeQueue,
    sessionId          = _sessionId,
    reconnectAttempts  = _reconnectAttempts,
  }
end

return Sync
