/**
 * GET /api/studio/plugin
 * Serves the ForjeGames Roblox Studio plugin v4.0.0 as a downloadable .lua file.
 *
 * Features:
 * - Build-time URL injection: NEXT_PUBLIC_APP_URL replaces INJECTED_BASE_URL in the Lua
 *   so dev builds point to localhost:3000 and prod builds point to forjegames.com.
 *   No localhost probe — zero connection delay for production users.
 * - Persistent auth via plugin:SetSetting()
 * - Auto-reconnect on startup with saved token
 * - Retry with exponential backoff on 429 / network errors
 * - Session keepalive heartbeat every 30 s
 * - Full command handling: execute_luau, insert_asset, insert_model, delete_model, update_property
 * - Version checking: server signals updateAvailable when plugin is outdated
 * - Human-readable error messages in Studio output
 * - Clean DockWidget UI: status dot, code entry, place info, disconnect button
 */

import { NextRequest, NextResponse } from 'next/server'

const PLUGIN_LUA = `-- ForjeGames Studio Plugin v4.0.0
-- Install: Save to %LOCALAPPDATA%\\Roblox\\Plugins\\ForjeGames.rbxm (Windows)
--          or ~/Documents/Roblox/Plugins/ForjeGames.rbxm (Mac)
-- Then fully close and reopen Roblox Studio.

local PLUGIN_VER     = "4.0.0"
local PROD_URL       = "INJECTED_BASE_URL"  -- replaced at serve time with NEXT_PUBLIC_APP_URL
local SYNC_INTERVAL  = 1      -- seconds between command polls
local HB_INTERVAL    = 30     -- seconds between keepalive heartbeats
local MAX_FAILURES   = 30     -- consecutive failures before disconnect (generous for cold starts)
local RETRY_MAX      = 3      -- http retry attempts
local RETRY_BASE     = 2      -- seconds, doubles each attempt (max 30)

-- Services
local HttpService          = game:GetService("HttpService")
local RunService           = game:GetService("RunService")
local ChangeHistoryService = game:GetService("ChangeHistoryService")
local InsertService        = game:GetService("InsertService")
local MarketplaceService   = game:GetService("MarketplaceService")

pcall(function() HttpService.HttpEnabled = true end)

-- Place identity (resolved once at startup)
local placeId   = tostring(game.PlaceId)
local placeName = game.Name ~= "" and game.Name or ("Place " .. placeId)
pcall(function()
	local info = MarketplaceService:GetProductInfo(game.PlaceId)
	if info and info.Name and info.Name ~= "" then
		placeName = info.Name
	end
end)

-- Runtime state
local BASE_URL    = PROD_URL  -- resolved by detectBaseUrl()
local authToken   = nil
local sessionId   = nil
local isConnected = false
local lastSync       = 0
local lastHB         = 0
local fails          = 0
local isReconnecting = false

-- ============================================================
-- Persistent auth helpers
-- ============================================================

local function saveAuth(token, sid)
	pcall(function()
		plugin:SetSetting("ForjeGames_Token",     token)
		plugin:SetSetting("ForjeGames_SessionId", sid)
		plugin:SetSetting("ForjeGames_BaseUrl",   BASE_URL)
	end)
end

local function clearAuth()
	pcall(function()
		plugin:SetSetting("ForjeGames_Token",     nil)
		plugin:SetSetting("ForjeGames_SessionId", nil)
	end)
end

local function loadAuth()
	local token, sid, url
	pcall(function()
		token = plugin:GetSetting("ForjeGames_Token")
		sid   = plugin:GetSetting("ForjeGames_SessionId")
		url   = plugin:GetSetting("ForjeGames_BaseUrl")
	end)
	return token, sid, url
end

-- ============================================================
-- URL resolution
-- ============================================================
-- PROD_URL is injected at serve time from NEXT_PUBLIC_APP_URL.
-- In dev: "http://localhost:3000"
-- In prod: "https://forjegames.com"
-- We never probe localhost — zero delay for production users.

local function detectBaseUrl(savedUrl)
	-- Clear any stale saved URL that differs from our injected URL.
	-- This handles the case where a dev plugin is replaced by a prod plugin.
	if savedUrl and savedUrl ~= "" and savedUrl ~= PROD_URL then
		-- URL changed (e.g. new plugin download) — clear and use the embedded one.
		pcall(function() plugin:SetSetting("ForjeGames_BaseUrl", nil) end)
	end
	BASE_URL = PROD_URL
end

-- ============================================================
-- HTTP with retry + exponential backoff
-- ============================================================

local function httpOnce(method, path, body, extraHeaders)
	local opts = {
		Url     = BASE_URL .. path,
		Method  = method,
		Headers = { ["Content-Type"] = "application/json" },
	}
	if authToken then
		opts.Headers["Authorization"] = "Bearer " .. authToken
	end
	if extraHeaders then
		for k, v in pairs(extraHeaders) do
			opts.Headers[k] = v
		end
	end
	if body then
		opts.Body = HttpService:JSONEncode(body)
	end
	local res = HttpService:RequestAsync(opts)
	return res
end

local function httpRetry(method, path, body, maxRetries)
	maxRetries = maxRetries or RETRY_MAX
	local delay = RETRY_BASE
	local lastRes = nil
	for i = 1, maxRetries do
		local ok, res = pcall(httpOnce, method, path, body, nil)
		if ok and res then
			-- Rate limited — wait the server-specified amount then retry
			if res.StatusCode == 429 then
				local wait = delay
				pcall(function()
					local j = HttpService:JSONDecode(res.Body)
					if j and j.retryAfterMs then
						wait = math.ceil(j.retryAfterMs / 1000) + 1
					end
				end)
				if i < maxRetries then
					task.wait(math.min(wait, 30))
					delay = math.min(delay * 2, 30)
				end
				lastRes = res
				continue
			end
			-- Server error — backoff and retry
			if res.StatusCode >= 500 then
				if i < maxRetries then
					task.wait(math.min(delay, 30))
					delay = math.min(delay * 2, 30)
				end
				lastRes = res
				continue
			end
			return true, res
		end
		-- Network error
		if i < maxRetries then
			task.wait(math.min(delay, 30))
			delay = math.min(delay * 2, 30)
		end
		lastRes = nil
	end
	return false, lastRes
end

local function jsonRequest(method, path, body)
	local ok, res = httpRetry(method, path, body)
	if not ok or not res then return false, nil end
	if res.StatusCode >= 400 then return false, nil end
	local parsed = nil
	pcall(function() parsed = HttpService:JSONDecode(res.Body) end)
	return parsed ~= nil, parsed
end

-- ============================================================
-- UI construction
-- ============================================================

-- Toolbar button
local toolbar = plugin:CreateToolbar("ForjeGames")
local mainBtn = toolbar:CreateButton(
	"ForjeGames",
	"Toggle ForjeGames connection panel",
	""  -- icon (leave blank for text-only)
)
mainBtn.ClickableWhenViewportHidden = true

-- Dock widget
local widgetInfo = DockWidgetPluginGuiInfo.new(
	Enum.InitialDockState.Float,
	false, false,
	340, 360,
	300, 280
)
local widget    = plugin:CreateDockWidgetPluginGui("ForjeGamesPanel", widgetInfo)
widget.Title    = "ForjeGames"
widget.Enabled  = false

-- Root frame
local root = Instance.new("Frame")
root.Size                = UDim2.new(1, 0, 1, 0)
root.BackgroundColor3    = Color3.fromRGB(16, 16, 16)
root.BorderSizePixel     = 0
root.Parent              = widget

local rootPad = Instance.new("UIPadding", root)
rootPad.PaddingTop    = UDim.new(0, 16)
rootPad.PaddingBottom = UDim.new(0, 16)
rootPad.PaddingLeft   = UDim.new(0, 16)
rootPad.PaddingRight  = UDim.new(0, 16)

local rootLayout = Instance.new("UIListLayout", root)
rootLayout.SortOrder     = Enum.SortOrder.LayoutOrder
rootLayout.Padding       = UDim.new(0, 10)
rootLayout.FillDirection = Enum.FillDirection.Vertical

-- Header row: logo label + status dot
local headerRow = Instance.new("Frame", root)
headerRow.Size             = UDim2.new(1, 0, 0, 28)
headerRow.BackgroundTransparency = 1
headerRow.LayoutOrder      = 1

local logo = Instance.new("TextLabel", headerRow)
logo.Size           = UDim2.new(1, -36, 1, 0)
logo.BackgroundTransparency = 1
logo.Text           = "ForjeGames"
logo.TextColor3     = Color3.fromRGB(212, 175, 55)
logo.Font           = Enum.Font.GothamBold
logo.TextSize       = 20
logo.TextXAlignment = Enum.TextXAlignment.Left

local statusDot = Instance.new("Frame", headerRow)
statusDot.Size              = UDim2.new(0, 12, 0, 12)
statusDot.Position          = UDim2.new(1, -12, 0.5, -6)
statusDot.BackgroundColor3  = Color3.fromRGB(100, 100, 100)
statusDot.BorderSizePixel   = 0
Instance.new("UICorner", statusDot).CornerRadius = UDim.new(1, 0)

-- Status text
local statusLabel = Instance.new("TextLabel", root)
statusLabel.Size             = UDim2.new(1, 0, 0, 16)
statusLabel.BackgroundTransparency = 1
statusLabel.Text             = "Disconnected"
statusLabel.TextColor3       = Color3.fromRGB(130, 130, 130)
statusLabel.Font             = Enum.Font.Gotham
statusLabel.TextSize         = 12
statusLabel.TextXAlignment   = Enum.TextXAlignment.Left
statusLabel.LayoutOrder      = 2

-- Divider
local divider = Instance.new("Frame", root)
divider.Size             = UDim2.new(1, 0, 0, 1)
divider.BackgroundColor3 = Color3.fromRGB(40, 40, 40)
divider.BorderSizePixel  = 0
divider.LayoutOrder      = 3

-- === CODE ENTRY SECTION (shown when not connected) ===
local codeSection = Instance.new("Frame", root)
codeSection.Size             = UDim2.new(1, 0, 0, 140)
codeSection.BackgroundTransparency = 1
codeSection.LayoutOrder      = 4

local codeSectionLayout = Instance.new("UIListLayout", codeSection)
codeSectionLayout.SortOrder = Enum.SortOrder.LayoutOrder
codeSectionLayout.Padding   = UDim.new(0, 8)

local instrLabel = Instance.new("TextLabel", codeSection)
instrLabel.Size             = UDim2.new(1, 0, 0, 36)
instrLabel.BackgroundTransparency = 1
instrLabel.Text             = "Go to forjegames.com/editor to get your 6-character code, then enter it below:"
instrLabel.TextColor3       = Color3.fromRGB(160, 160, 160)
instrLabel.Font             = Enum.Font.Gotham
instrLabel.TextSize         = 11
instrLabel.TextWrapped      = true
instrLabel.TextXAlignment   = Enum.TextXAlignment.Left
instrLabel.LayoutOrder      = 1

-- Input frame
local inputFrame = Instance.new("Frame", codeSection)
inputFrame.Size             = UDim2.new(1, 0, 0, 52)
inputFrame.BackgroundColor3 = Color3.fromRGB(10, 10, 10)
inputFrame.BorderSizePixel  = 0
inputFrame.LayoutOrder      = 2
Instance.new("UICorner", inputFrame).CornerRadius = UDim.new(0, 8)

local inputStroke = Instance.new("UIStroke", inputFrame)
inputStroke.Color     = Color3.fromRGB(55, 55, 55)
inputStroke.Thickness = 1

local codeInput = Instance.new("TextBox", inputFrame)
codeInput.Size               = UDim2.new(1, -16, 1, 0)
codeInput.Position           = UDim2.new(0, 8, 0, 0)
codeInput.BackgroundTransparency = 1
codeInput.TextColor3         = Color3.fromRGB(212, 175, 55)
codeInput.Font               = Enum.Font.GothamBold
codeInput.TextSize           = 28
codeInput.PlaceholderText    = "AB12CD"
codeInput.PlaceholderColor3  = Color3.fromRGB(45, 45, 45)
codeInput.Text               = ""
codeInput.ClearTextOnFocus   = true
codeInput.TextXAlignment     = Enum.TextXAlignment.Center

-- Error label
local errLabel = Instance.new("TextLabel", codeSection)
errLabel.Size             = UDim2.new(1, 0, 0, 14)
errLabel.BackgroundTransparency = 1
errLabel.Text             = ""
errLabel.TextColor3       = Color3.fromRGB(255, 80, 80)
errLabel.Font             = Enum.Font.Gotham
errLabel.TextSize         = 11
errLabel.TextXAlignment   = Enum.TextXAlignment.Center
errLabel.LayoutOrder      = 3

-- Connect button
local connectBtn = Instance.new("TextButton", root)
connectBtn.Size             = UDim2.new(1, 0, 0, 44)
connectBtn.BackgroundColor3 = Color3.fromRGB(212, 175, 55)
connectBtn.TextColor3       = Color3.fromRGB(0, 0, 0)
connectBtn.Font             = Enum.Font.GothamBold
connectBtn.TextSize         = 14
connectBtn.Text             = "Connect"
connectBtn.BorderSizePixel  = 0
connectBtn.AutoButtonColor  = true
connectBtn.LayoutOrder      = 5
Instance.new("UICorner", connectBtn).CornerRadius = UDim.new(0, 8)

-- === CONNECTED INFO SECTION (shown when connected) ===
local connectedSection = Instance.new("Frame", root)
connectedSection.Size             = UDim2.new(1, 0, 0, 80)
connectedSection.BackgroundTransparency = 1
connectedSection.LayoutOrder      = 6
connectedSection.Visible          = false

local connLayout = Instance.new("UIListLayout", connectedSection)
connLayout.SortOrder = Enum.SortOrder.LayoutOrder
connLayout.Padding   = UDim.new(0, 6)

local placeNameLabel = Instance.new("TextLabel", connectedSection)
placeNameLabel.Size             = UDim2.new(1, 0, 0, 20)
placeNameLabel.BackgroundTransparency = 1
placeNameLabel.Text             = ""
placeNameLabel.TextColor3       = Color3.fromRGB(230, 230, 230)
placeNameLabel.Font             = Enum.Font.GothamBold
placeNameLabel.TextSize         = 13
placeNameLabel.TextXAlignment   = Enum.TextXAlignment.Left
placeNameLabel.LayoutOrder      = 1

local placeIdLabel = Instance.new("TextLabel", connectedSection)
placeIdLabel.Size             = UDim2.new(1, 0, 0, 14)
placeIdLabel.BackgroundTransparency = 1
placeIdLabel.Text             = ""
placeIdLabel.TextColor3       = Color3.fromRGB(90, 90, 90)
placeIdLabel.Font             = Enum.Font.Gotham
placeIdLabel.TextSize         = 10
placeIdLabel.TextXAlignment   = Enum.TextXAlignment.Left
placeIdLabel.LayoutOrder      = 2

local urlLabel = Instance.new("TextLabel", connectedSection)
urlLabel.Size             = UDim2.new(1, 0, 0, 14)
urlLabel.BackgroundTransparency = 1
urlLabel.Text             = ""
urlLabel.TextColor3       = Color3.fromRGB(70, 70, 70)
urlLabel.Font             = Enum.Font.Gotham
urlLabel.TextSize         = 10
urlLabel.TextXAlignment   = Enum.TextXAlignment.Left
urlLabel.LayoutOrder      = 3

-- Disconnect button
local disconnectBtn = Instance.new("TextButton", root)
disconnectBtn.Size             = UDim2.new(1, 0, 0, 36)
disconnectBtn.BackgroundColor3 = Color3.fromRGB(50, 50, 50)
disconnectBtn.TextColor3       = Color3.fromRGB(180, 180, 180)
disconnectBtn.Font             = Enum.Font.Gotham
disconnectBtn.TextSize         = 13
disconnectBtn.Text             = "Disconnect"
disconnectBtn.BorderSizePixel  = 0
disconnectBtn.AutoButtonColor  = true
disconnectBtn.LayoutOrder      = 7
disconnectBtn.Visible          = false
Instance.new("UICorner", disconnectBtn).CornerRadius = UDim.new(0, 8)

-- Footer: version + server indicator
local footerLabel = Instance.new("TextLabel", root)
footerLabel.Size             = UDim2.new(1, 0, 0, 12)
footerLabel.BackgroundTransparency = 1
footerLabel.Text             = "v" .. PLUGIN_VER
footerLabel.TextColor3       = Color3.fromRGB(50, 50, 50)
footerLabel.Font             = Enum.Font.Gotham
footerLabel.TextSize         = 10
footerLabel.TextXAlignment   = Enum.TextXAlignment.Right
footerLabel.LayoutOrder      = 8

-- ============================================================
-- UI state machine
-- ============================================================

local function setUI(state)
	if state == "connected" then
		-- Dot
		statusDot.BackgroundColor3 = Color3.fromRGB(16, 185, 129)
		statusLabel.Text           = "Connected"
		statusLabel.TextColor3     = Color3.fromRGB(16, 185, 129)
		-- Sections
		codeSection.Visible        = false
		connectedSection.Visible   = true
		connectBtn.Visible         = false
		disconnectBtn.Visible      = true
		-- Info
		placeNameLabel.Text        = placeName
		placeIdLabel.Text          = "Place ID: " .. placeId
		urlLabel.Text              = BASE_URL
		-- Toolbar
		-- mainBtn is a PluginToolbarButton — cannot set .Text after creation
		errLabel.Text              = ""

	elseif state == "connecting" then
		statusDot.BackgroundColor3 = Color3.fromRGB(251, 191, 36)
		statusLabel.Text           = "Connecting..."
		statusLabel.TextColor3     = Color3.fromRGB(251, 191, 36)
		connectBtn.Text            = "Connecting..."
		connectBtn.Active          = false

	elseif state == "reconnecting" then
		statusDot.BackgroundColor3 = Color3.fromRGB(251, 191, 36)
		statusLabel.Text           = "Reconnecting..."
		statusLabel.TextColor3     = Color3.fromRGB(251, 191, 36)

	else -- "disconnected"
		statusDot.BackgroundColor3 = Color3.fromRGB(90, 90, 90)
		statusLabel.Text           = "Disconnected"
		statusLabel.TextColor3     = Color3.fromRGB(130, 130, 130)
		codeSection.Visible        = true
		connectedSection.Visible   = false
		connectBtn.Visible         = true
		connectBtn.Text            = "Connect"
		connectBtn.Active          = true
		connectBtn.BackgroundColor3 = Color3.fromRGB(212, 175, 55)
		disconnectBtn.Visible      = false
		-- mainBtn is a PluginToolbarButton — cannot set .Text after creation
	end
end

-- ============================================================
-- Session management
-- ============================================================

-- Forward declaration (defined after executeCommand)
local tryReconnect

local function disconnect(silent)
	authToken   = nil
	sessionId   = nil
	isConnected = false
	fails       = 0
	clearAuth()
	setUI("disconnected")
	if not silent then
		print("[ForjeGames] Disconnected.")
	end
end

local function onFail(reason)
	fails = fails + 1
	if fails >= MAX_FAILURES then
		-- Try auto-reconnect before giving up
		if authToken and authToken ~= "" and not isReconnecting then
			isReconnecting = true
			warn("[ForjeGames] Could not reach ForjeGames server. Attempting auto-reconnect...")
			fails = 0
			setUI("reconnecting")
			task.spawn(function()
				local ok = tryReconnect(authToken, sessionId)
				isReconnecting = false
				if not ok then
					warn("[ForjeGames] Session expired. Re-enter your connection code.")
					disconnect(true)
				end
			end)
		else
			if reason then
				warn("[ForjeGames] " .. reason)
			else
				warn("[ForjeGames] Could not reach ForjeGames server. Check your internet connection.")
			end
			disconnect(true)
		end
	elseif fails % 5 == 0 then
		-- Periodic warning so users aren't left wondering what's happening
		local retryIn = math.min(fails, 30)
		statusLabel.Text = "Connection issue. Retrying in " .. retryIn .. "s..."
	end
end

local function onSuccess()
	fails = 0
end

-- ============================================================
-- Command execution
-- ============================================================

local function reportResult(cmdId, cmdType, success, errMsg)
	if not authToken then return end
	task.spawn(function()
		jsonRequest("POST", "/api/studio/update", {
			sessionId    = sessionId,
			sessionToken = authToken,
			placeId      = placeId,
			placeName    = placeName,
			event        = "command_completed",
			changes      = {{
				id        = cmdId,
				type      = "command_completed",
				command   = cmdType,
				success   = success,
				error     = errMsg,
				timestamp = os.time(),
			}},
		})
	end)
end

-- Shared state store: persists across multi-step AI commands
local _forje_state = {}

-- Protected instances that AI cannot delete
local PROTECTED = {Terrain=true, Camera=true, Baseplate=true, SpawnLocation=true}

local function executeCommand(cmd)
	local cmdId   = cmd.id or ""
	local cmdType = cmd.type or cmd.command or "unknown"
	local data    = cmd.data or {}

	if cmdType == "execute_luau" or cmdType == "execute_code" then
		local code = data.code or cmd.code or ""
		if code == "" then
			reportResult(cmdId, cmdType, false, "no code provided")
			return
		end

		-- Wrap in ChangeHistoryService recording for atomic undo
		local recordId = nil
		pcall(function()
			recordId = ChangeHistoryService:TryBeginRecording("ForjeGames: " .. (data.prompt or "build"):sub(1, 40))
		end)

		-- Expose shared state as globals so AI code can access them
		_G._forje_state = _forje_state
		_G._forje_cam = workspace.CurrentCamera
		_G._forje_selection = game:GetService("Selection")

		local fn, compErr = loadstring(code)
		if not fn then
			warn("[ForjeGames] Compile error: " .. tostring(compErr))
			reportResult(cmdId, cmdType, false, "COMPILE_ERROR: " .. tostring(compErr))
			if recordId then pcall(function() ChangeHistoryService:FinishRecording(recordId, Enum.FinishRecordingOperation.Cancel) end) end
			return
		end

		-- Count instances before execution for verification
		local beforeCount = #workspace:GetDescendants()

		local ok, runErr = pcall(fn)
		if not ok then
			warn("[ForjeGames] Runtime error: " .. tostring(runErr))
			-- Rollback on failure
			if recordId then
				pcall(function() ChangeHistoryService:FinishRecording(recordId, Enum.FinishRecordingOperation.Cancel) end)
			end
			reportResult(cmdId, cmdType, false, "RUNTIME_ERROR: " .. tostring(runErr))
			return
		end

		-- Finish recording (enables undo)
		if recordId then
			pcall(function() ChangeHistoryService:FinishRecording(recordId, Enum.FinishRecordingOperation.Commit) end)
		else
			ChangeHistoryService:SetWaypoint("ForjeGames: execute_luau")
		end

		-- Verification: count new instances created
		local afterCount = #workspace:GetDescendants()
		local created = afterCount - beforeCount

		-- Report success with verification data
		reportResult(cmdId, cmdType, true, nil)
		-- Send enriched result
		task.spawn(function()
			jsonRequest("POST", "/api/studio/update", {
				sessionId    = sessionId,
				sessionToken = authToken,
				event        = "command_result",
				changes      = {{
					id           = cmdId,
					type         = "command_result",
					success      = true,
					instancesCreated = created,
					timestamp    = os.time(),
				}},
			})
		end)

	elseif cmdType == "insert_asset" or cmdType == "insert_model" then
		local assetId = data.assetId or data.modelId
		if not assetId then
			reportResult(cmdId, cmdType, false, "assetId is required")
			return
		end
		local ok, model = pcall(function()
			return InsertService:LoadAsset(tonumber(assetId))
		end)
		if not ok or not model then
			local msg = tostring(model or "load failed")
			warn("[ForjeGames] Insert failed: " .. msg)
			reportResult(cmdId, cmdType, false, msg)
			return
		end
		-- Apply optional position
		if data.position then
			pcall(function()
				local pos = data.position
				model:SetPrimaryPartCFrame(CFrame.new(pos.X or pos.x, pos.Y or pos.y, pos.Z or pos.z))
			end)
		end
		model.Parent = workspace
		ChangeHistoryService:SetWaypoint("ForjeGames: insert_asset")
		reportResult(cmdId, cmdType, true, nil)

	elseif cmdType == "delete_model" then
		local path = data.instancePath or data.name
		if not path then
			reportResult(cmdId, cmdType, false, "instancePath is required")
			return
		end
		-- Sandbox: protect critical instances
		if PROTECTED[path] then
			reportResult(cmdId, cmdType, false, "PROTECTED: cannot delete " .. path)
			return
		end
		local target = workspace:FindFirstChild(path, true)
		if target and not PROTECTED[target.Name] then
			target:Destroy()
			ChangeHistoryService:SetWaypoint("ForjeGames: delete_model")
			reportResult(cmdId, cmdType, true, nil)
		else
			reportResult(cmdId, cmdType, false, "not found or protected: " .. tostring(path))
		end

	elseif cmdType == "update_property" then
		local path     = data.instancePath
		local propName = data.property
		local propVal  = data.value
		if not (path and propName) then
			reportResult(cmdId, cmdType, false, "instancePath and property required")
			return
		end
		local target = workspace:FindFirstChild(path, true)
		if target then
			local ok, setErr = pcall(function()
				target[propName] = propVal
			end)
			if not ok then
				warn("[ForjeGames] update_property error: " .. tostring(setErr))
				reportResult(cmdId, cmdType, false, tostring(setErr))
				return
			end
			ChangeHistoryService:SetWaypoint("ForjeGames: update_property")
			reportResult(cmdId, cmdType, true, nil)
		else
			reportResult(cmdId, cmdType, false, "instance not found: " .. tostring(path))
		end

	-- ── UNDO — revert last AI build ──────────────────────────────────────
	elseif cmdType == "undo" then
		pcall(function() ChangeHistoryService:Undo() end)
		reportResult(cmdId, cmdType, true, nil)

	-- ── REDO — redo last undone build ────────────────────────────────────
	elseif cmdType == "redo" then
		pcall(function() ChangeHistoryService:Redo() end)
		reportResult(cmdId, cmdType, true, nil)

	-- ── CLONE — duplicate an object with optional offset ─────────────────
	elseif cmdType == "clone" then
		local path = data.instancePath or data.name
		if not path then reportResult(cmdId, cmdType, false, "instancePath required"); return end
		local target = workspace:FindFirstChild(path, true)
		if not target then reportResult(cmdId, cmdType, false, "not found: " .. path); return end
		local clone = target:Clone()
		if clone and data.offset and clone:IsA("BasePart") then
			clone.Position = clone.Position + Vector3.new(data.offset.x or 0, data.offset.y or 0, data.offset.z or 0)
		end
		if clone and data.offset and clone:IsA("Model") and clone.PrimaryPart then
			clone:SetPrimaryPartCFrame(clone.PrimaryPart.CFrame + Vector3.new(data.offset.x or 0, data.offset.y or 0, data.offset.z or 0))
		end
		if clone then
			clone.Parent = target.Parent
			ChangeHistoryService:SetWaypoint("ForjeGames: clone")
			reportResult(cmdId, cmdType, true, nil)
		end

	-- ── MODIFY_SELECTED — change properties of whatever user has selected ─
	elseif cmdType == "modify_selected" then
		local sel = Selection:Get()
		if #sel == 0 then reportResult(cmdId, cmdType, false, "nothing selected"); return end
		local props = data.properties or {}
		local modified = 0
		for _, obj in ipairs(sel) do
			for propName, propVal in pairs(props) do
				pcall(function()
					-- Handle special property types
					if propName == "Color" and type(propVal) == "table" then
						obj[propName] = Color3.fromRGB(propVal.r or propVal[1] or 255, propVal.g or propVal[2] or 255, propVal.b or propVal[3] or 255)
					elseif propName == "Position" and type(propVal) == "table" then
						obj[propName] = Vector3.new(propVal.x or propVal[1] or 0, propVal.y or propVal[2] or 0, propVal.z or propVal[3] or 0)
					elseif propName == "Size" and type(propVal) == "table" then
						obj[propName] = Vector3.new(propVal.x or propVal[1] or 1, propVal.y or propVal[2] or 1, propVal.z or propVal[3] or 1)
					elseif propName == "Material" then
						obj[propName] = Enum.Material[propVal] or obj[propName]
					else
						obj[propName] = propVal
					end
					modified = modified + 1
				end)
			end
		end
		ChangeHistoryService:SetWaypoint("ForjeGames: modify_selected")
		reportResult(cmdId, cmdType, true, nil)

	-- ── SET_LIGHTING — change time of day, atmosphere, mood ──────────────
	elseif cmdType == "set_lighting" then
		pcall(function()
			local Lighting = game:GetService("Lighting")
			local props = data.properties or data
			for k, v in pairs(props) do
				if k == "ClockTime" or k == "Brightness" or k == "EnvironmentDiffuseScale" or k == "EnvironmentSpecularScale" or k == "ExposureCompensation" or k == "GeographicLatitude" then
					Lighting[k] = tonumber(v) or Lighting[k]
				elseif k == "Ambient" and type(v) == "table" then
					Lighting.Ambient = Color3.fromRGB(v.r or v[1] or 0, v.g or v[2] or 0, v.b or v[3] or 0)
				elseif k == "OutdoorAmbient" and type(v) == "table" then
					Lighting.OutdoorAmbient = Color3.fromRGB(v.r or v[1] or 0, v.g or v[2] or 0, v.b or v[3] or 0)
				elseif k == "FogColor" and type(v) == "table" then
					Lighting.FogColor = Color3.fromRGB(v.r or v[1] or 0, v.g or v[2] or 0, v.b or v[3] or 0)
				elseif k == "FogEnd" then
					Lighting.FogEnd = tonumber(v) or Lighting.FogEnd
				elseif k == "FogStart" then
					Lighting.FogStart = tonumber(v) or Lighting.FogStart
				end
			end
			-- Handle Atmosphere child
			if data.atmosphere then
				local atmo = Lighting:FindFirstChildOfClass("Atmosphere") or Instance.new("Atmosphere", Lighting)
				for ak, av in pairs(data.atmosphere) do
					pcall(function() atmo[ak] = (type(av) == "table") and Color3.fromRGB(av[1] or 0, av[2] or 0, av[3] or 0) or av end)
				end
			end
			ChangeHistoryService:SetWaypoint("ForjeGames: set_lighting")
		end)

	elseif cmdType == "scan_workspace" then
		local snapshot = {objects = {}, spawns = {}, stats = {parts=0, models=0}, bounds = {min={999999,999999,999999}, max={-999999,-999999,-999999}}}
		local count = 0
		local function round(n) return math.floor(n * 10 + 0.5) / 10 end
		local function addBounds(pos)
			snapshot.bounds.min = {math.min(snapshot.bounds.min[1], pos.X), math.min(snapshot.bounds.min[2], pos.Y), math.min(snapshot.bounds.min[3], pos.Z)}
			snapshot.bounds.max = {math.max(snapshot.bounds.max[1], pos.X), math.max(snapshot.bounds.max[2], pos.Y), math.max(snapshot.bounds.max[3], pos.Z)}
		end
		local function scan(parent, depth)
			if count >= 500 or depth > 8 then return end
			for _, child in parent:GetChildren() do
				if count >= 500 then break end
				if child:IsA("BasePart") then
					count = count + 1
					snapshot.stats.parts = snapshot.stats.parts + 1
					local p, s = child.Position, child.Size
					addBounds(p)
					table.insert(snapshot.objects, {
						n = child.Name:sub(1, 40),
						cls = child.ClassName,
						p = {round(p.X), round(p.Y), round(p.Z)},
						s = {round(s.X), round(s.Y), round(s.Z)},
						m = child.Material.Name,
						c = {math.floor(child.Color.R*255), math.floor(child.Color.G*255), math.floor(child.Color.B*255)},
					})
					if child:IsA("SpawnLocation") then
						table.insert(snapshot.spawns, {n = child.Name, p = {round(p.X), round(p.Y), round(p.Z)}})
					end
				elseif child:IsA("Model") then
					snapshot.stats.models = snapshot.stats.models + 1
					scan(child, depth + 1)
				end
			end
		end
		scan(workspace, 0)
		snapshot.stats.total = count

		-- 6. Lighting details
		pcall(function()
			local lt = game:GetService("Lighting")
			snapshot.lighting = {
				time = lt.ClockTime,
				brightness = lt.Brightness,
				ambient = {math.floor(lt.Ambient.R*255), math.floor(lt.Ambient.G*255), math.floor(lt.Ambient.B*255)},
				outdoorAmbient = {math.floor(lt.OutdoorAmbient.R*255), math.floor(lt.OutdoorAmbient.G*255), math.floor(lt.OutdoorAmbient.B*255)},
				fogColor = {math.floor(lt.FogColor.R*255), math.floor(lt.FogColor.G*255), math.floor(lt.FogColor.B*255)},
				fogStart = lt.FogStart,
				fogEnd = lt.FogEnd,
				shadowSoftness = lt.ShadowSoftness,
				technology = lt.Technology.Name,
				environmentDiffuseScale = lt.EnvironmentDiffuseScale,
				environmentSpecularScale = lt.EnvironmentSpecularScale,
				globalShadows = lt.GlobalShadows,
			}
		end)

		-- 7. Atmosphere
		pcall(function()
			local atmo = game:GetService("Lighting"):FindFirstChildOfClass("Atmosphere")
			if atmo then
				snapshot.atmosphere = {
					density = atmo.Density,
					offset = atmo.Offset,
					color = {math.floor(atmo.Color.R*255), math.floor(atmo.Color.G*255), math.floor(atmo.Color.B*255)},
					decay = {math.floor(atmo.Decay.R*255), math.floor(atmo.Decay.G*255), math.floor(atmo.Decay.B*255)},
					glare = atmo.Glare,
					haze = atmo.Haze,
				}
			end
		end)

		-- 8. Sky settings
		pcall(function()
			local sky = game:GetService("Lighting"):FindFirstChildOfClass("Sky")
			if sky then
				snapshot.sky = {
					sunAngularSize = sky.SunAngularSize,
					moonAngularSize = sky.MoonAngularSize,
					starCount = sky.StarCount,
					celestialBodiesShown = sky.CelestialBodiesShown,
				}
			end
		end)

		-- 9. Post-processing effects
		pcall(function()
			local lt = game:GetService("Lighting")
			local effects = {}
			for _, child in lt:GetChildren() do
				if child:IsA("BloomEffect") then
					table.insert(effects, {type="Bloom", intensity=child.Intensity, size=child.Size, threshold=child.Threshold})
				elseif child:IsA("BlurEffect") then
					table.insert(effects, {type="Blur", size=child.Size})
				elseif child:IsA("ColorCorrectionEffect") then
					table.insert(effects, {type="ColorCorrection", brightness=child.Brightness, contrast=child.Contrast, saturation=child.Saturation})
				elseif child:IsA("SunRaysEffect") then
					table.insert(effects, {type="SunRays", intensity=child.Intensity, spread=child.Spread})
				elseif child:IsA("DepthOfFieldEffect") then
					table.insert(effects, {type="DepthOfField", focusDistance=child.FocusDistance, nearIntensity=child.NearIntensity, farIntensity=child.FarIntensity})
				end
			end
			if #effects > 0 then snapshot.postProcessing = effects end
		end)

		-- 10. Workspace settings
		pcall(function()
			snapshot.workspace = {
				gravity = workspace.Gravity,
				fallenPartsDestroyHeight = workspace.FallenPartsDestroyHeight,
				streamingEnabled = workspace.StreamingEnabled,
				streamingMinRadius = workspace.StreamingMinRadius,
				streamingTargetRadius = workspace.StreamingTargetRadius,
			}
		end)

		-- 11. All lights in workspace
		pcall(function()
			local lights = {}
			local lightCount = 0
			local function roundI(n) return math.floor(n + 0.5) end
			for _, desc in workspace:GetDescendants() do
				if lightCount >= 30 then break end
				if desc:IsA("PointLight") or desc:IsA("SpotLight") or desc:IsA("SurfaceLight") then
					lightCount = lightCount + 1
					local parent = desc.Parent
					local pos = parent and parent:IsA("BasePart") and parent.Position or Vector3.zero
					table.insert(lights, {
						type = desc.ClassName,
						brightness = desc.Brightness,
						range = desc.Range,
						color = {math.floor(desc.Color.R*255), math.floor(desc.Color.G*255), math.floor(desc.Color.B*255)},
						parentName = parent and parent.Name or "none",
						p = {roundI(pos.X), roundI(pos.Y), roundI(pos.Z)},
					})
				end
			end
			if #lights > 0 then snapshot.lights = lights end
		end)

		-- 12. Scripts summary
		pcall(function()
			local scripts = {server=0, local_=0, module=0, names={}}
			for _, desc in workspace:GetDescendants() do
				if desc:IsA("Script") and not desc:IsA("LocalScript") and not desc:IsA("ModuleScript") then
					scripts.server = scripts.server + 1
					if #scripts.names < 20 then table.insert(scripts.names, desc:GetFullName():sub(1,60)) end
				elseif desc:IsA("LocalScript") then
					scripts.local_ = scripts.local_ + 1
				elseif desc:IsA("ModuleScript") then
					scripts.module = scripts.module + 1
				end
			end
			snapshot.scripts = scripts
		end)

		-- 13. GUI elements
		pcall(function()
			local guis = {}
			local sg = game:GetService("StarterGui")
			for _, gui in sg:GetChildren() do
				if gui:IsA("ScreenGui") then
					table.insert(guis, {n=gui.Name, enabled=gui.Enabled, children=#gui:GetChildren()})
				end
			end
			if #guis > 0 then snapshot.guis = guis end
		end)

		-- 14. Teams
		pcall(function()
			local teams = {}
			for _, team in game:GetService("Teams"):GetChildren() do
				if team:IsA("Team") then
					table.insert(teams, {n=team.Name, color={math.floor(team.TeamColor.Color.R*255), math.floor(team.TeamColor.Color.G*255), math.floor(team.TeamColor.Color.B*255)}})
				end
			end
			if #teams > 0 then snapshot.teams = teams end
		end)

		-- 15. Humanoids/NPCs
		pcall(function()
			local npcs = {}
			local npcCount = 0
			local function roundI(n) return math.floor(n + 0.5) end
			for _, desc in workspace:GetDescendants() do
				if npcCount >= 20 then break end
				if desc:IsA("Humanoid") and desc.Parent then
					npcCount = npcCount + 1
					local root = desc.Parent:FindFirstChild("HumanoidRootPart")
					local pos = root and root.Position or Vector3.zero
					table.insert(npcs, {
						n = desc.Parent.Name:sub(1,40),
						health = desc.Health,
						maxHealth = desc.MaxHealth,
						walkSpeed = desc.WalkSpeed,
						jumpHeight = desc.JumpHeight,
						p = {roundI(pos.X), roundI(pos.Y), roundI(pos.Z)},
					})
				end
			end
			if #npcs > 0 then snapshot.npcs = npcs end
		end)

		-- 16. Particle emitters
		pcall(function()
			local particles = {}
			local pCount = 0
			local function roundI(n) return math.floor(n + 0.5) end
			for _, desc in workspace:GetDescendants() do
				if pCount >= 15 then break end
				if desc:IsA("ParticleEmitter") then
					pCount = pCount + 1
					local parent = desc.Parent
					local pos = parent and parent:IsA("BasePart") and parent.Position or Vector3.zero
					table.insert(particles, {
						n = desc.Name,
						rate = desc.Rate,
						lifetime = desc.Lifetime.Max,
						parentName = parent and parent.Name or "none",
						p = {roundI(pos.X), roundI(pos.Y), roundI(pos.Z)},
					})
				end
			end
			if #particles > 0 then snapshot.particles = particles end
		end)

		-- 17. Constraints (welds, hinges, springs)
		pcall(function()
			local constraints = {welds=0, hinges=0, springs=0, ropes=0, other=0}
			for _, desc in workspace:GetDescendants() do
				if desc:IsA("WeldConstraint") or desc:IsA("Weld") then constraints.welds = constraints.welds + 1
				elseif desc:IsA("HingeConstraint") then constraints.hinges = constraints.hinges + 1
				elseif desc:IsA("SpringConstraint") then constraints.springs = constraints.springs + 1
				elseif desc:IsA("RopeConstraint") then constraints.ropes = constraints.ropes + 1
				elseif desc:IsA("Constraint") then constraints.other = constraints.other + 1
				end
			end
			snapshot.constraints = constraints
		end)

		-- 18. Remote events/functions (game architecture)
		pcall(function()
			local remotes = {}
			local rs = game:GetService("ReplicatedStorage")
			for _, child in rs:GetDescendants() do
				if #remotes >= 30 then break end
				if child:IsA("RemoteEvent") or child:IsA("RemoteFunction") then
					table.insert(remotes, {n=child.Name, type=child.ClassName, path=child:GetFullName():sub(1,80)})
				end
			end
			if #remotes > 0 then snapshot.remotes = remotes end
		end)

		-- 19. Folders structure (top-level organization)
		pcall(function()
			local folders = {}
			for _, child in workspace:GetChildren() do
				if child:IsA("Folder") then
					table.insert(folders, {n=child.Name, children=#child:GetChildren()})
				end
			end
			if #folders > 0 then snapshot.folders = folders end
		end)

		-- 20. CollectionService tags
		pcall(function()
			local cs = game:GetService("CollectionService")
			local tags = {}
			for _, tag in cs:GetAllTags() do
				local tagged = cs:GetTagged(tag)
				if #tagged > 0 then
					table.insert(tags, {tag=tag, count=#tagged})
				end
				if #tags >= 20 then break end
			end
			if #tags > 0 then snapshot.tags = tags end
		end)

		-- 21. MeshParts with mesh IDs
		pcall(function()
			local meshes = {}
			local mCount = 0
			local function roundI(n) return math.floor(n + 0.5) end
			for _, desc in workspace:GetDescendants() do
				if mCount >= 20 then break end
				if desc:IsA("MeshPart") and desc.MeshId ~= "" then
					mCount = mCount + 1
					local p = desc.Position
					table.insert(meshes, {
						n = desc.Name:sub(1,40),
						meshId = desc.MeshId:sub(1,60),
						p = {roundI(p.X), roundI(p.Y), roundI(p.Z)},
						s = {roundI(desc.Size.X), roundI(desc.Size.Y), roundI(desc.Size.Z)},
					})
				end
			end
			if #meshes > 0 then snapshot.meshParts = meshes end
		end)

		-- 22. Decals and textures
		pcall(function()
			local decals = {}
			local dCount = 0
			for _, desc in workspace:GetDescendants() do
				if dCount >= 15 then break end
				if desc:IsA("Decal") or desc:IsA("Texture") then
					dCount = dCount + 1
					table.insert(decals, {
						type = desc.ClassName,
						texture = desc.Texture:sub(1,60),
						face = desc.Face.Name,
						parentName = desc.Parent and desc.Parent.Name or "none",
					})
				end
			end
			if #decals > 0 then snapshot.decals = decals end
		end)

		-- 23. Sound objects
		pcall(function()
			local sounds = {}
			local sCount = 0
			for _, desc in workspace:GetDescendants() do
				if sCount >= 10 then break end
				if desc:IsA("Sound") then
					sCount = sCount + 1
					table.insert(sounds, {
						n = desc.Name:sub(1,40),
						soundId = desc.SoundId:sub(1,60),
						volume = desc.Volume,
						looped = desc.Looped,
						playing = desc.Playing,
					})
				end
			end
			if #sounds > 0 then snapshot.sounds = sounds end
		end)

		-- 24. Instance count totals
		pcall(function()
			snapshot.stats.totalInstances = #workspace:GetDescendants()
			snapshot.stats.totalParts = 0
			snapshot.stats.totalMeshParts = 0
			snapshot.stats.totalUnions = 0
			for _, desc in workspace:GetDescendants() do
				if desc:IsA("Part") then snapshot.stats.totalParts = snapshot.stats.totalParts + 1
				elseif desc:IsA("MeshPart") then snapshot.stats.totalMeshParts = snapshot.stats.totalMeshParts + 1
				elseif desc:IsA("UnionOperation") then snapshot.stats.totalUnions = snapshot.stats.totalUnions + 1
				end
			end
		end)

		-- 25. Place info
		snapshot.place = {
			id = placeId,
			name = placeName,
		}

		-- Sample terrain at grid points to find ground level
		local terrainSamples = {}
		pcall(function()
			local bMin = snapshot.bounds.min
			local bMax = snapshot.bounds.max
			local step = math.max(20, math.floor((bMax[1] - bMin[1]) / 10))
			for x = bMin[1], bMax[1], step do
				for z = bMin[3], bMax[3], step do
					local ray = workspace:Raycast(Vector3.new(x, 500, z), Vector3.new(0, -1000, 0))
					if ray then
						local function round(n) return math.floor(n + 0.5) end
						table.insert(terrainSamples, {round(x), round(ray.Position.Y), round(z)})
					end
				end
			end
		end)
		snapshot.terrain = terrainSamples
		-- Send back
		reportResult(cmdId, cmdType, true, nil)
		local mySessionId = sessionId
		local authToken_snap = authToken
		task.spawn(function()
			jsonRequest("POST", "/api/studio/update", {
				sessionId = mySessionId, sessionToken = authToken_snap,
				event = "workspace_snapshot",
				snapshot = snapshot,
			})
		end)
		return
	end

	reportResult(cmdId, cmdType, true, nil)
end

-- ============================================================
-- Auth handshake helpers
-- ============================================================

tryReconnect = function(savedToken, savedSession)
	-- Validate the saved token with the server
	local ok, data = jsonRequest("GET",
		"/api/studio/status?sessionId=" .. HttpService:UrlEncode(savedSession or "")
		.. "&token=" .. HttpService:UrlEncode(savedToken or ""))
	if ok and data and data.connected then
		authToken   = savedToken
		sessionId   = savedSession or data.sessionId
		isConnected = true
		fails       = 0
		saveAuth(authToken, sessionId)
		setUI("connected")
		print("[ForjeGames] Auto-reconnected to " .. placeName)
		return true
	end
	return false
end

local function doConnect(code)
	local ok, data = jsonRequest("POST", "/api/studio/auth", {
		code      = code,
		placeId   = placeId,
		placeName = placeName,
		pluginVer = PLUGIN_VER,
	})
	if ok and data and (data.token or data.sessionToken) then
		authToken   = data.token or data.sessionToken
		sessionId   = data.sessionId
		isConnected = true
		fails       = 0
		saveAuth(authToken, sessionId)
		setUI("connected")
		print("[ForjeGames] Connected to " .. placeName .. " via " .. BASE_URL)
		-- Check for update notice
		if data.updateAvailable then
			warn("[ForjeGames] Plugin update available! Download the latest version from: " .. BASE_URL .. (data.updateUrl or "/api/studio/plugin"))
		end
		return true, nil
	end
	-- Surface human-readable error messages
	local errMsg = "Invalid code. Please check and try again."
	if data and data.error then
		if data.error == "code_already_claimed" then
			errMsg = "Code already used. Generate a new one at forjegames.com/connect."
		elseif data.error == "code_expired_or_invalid" then
			errMsg = "Code expired. Generate a new one at forjegames.com/connect."
		elseif data.error == "code_mismatch" then
			errMsg = "Invalid code. Please check and try again."
		elseif data.error == "server_busy" then
			errMsg = "Server is busy. Retrying in a moment..."
		end
	end
	return false, errMsg
end

-- ============================================================
-- Button handlers
-- ============================================================

connectBtn.MouseButton1Click:Connect(function()
	local code = string.upper(string.gsub(codeInput.Text, "%s+", ""))
	if #code < 6 then
		errLabel.Text = "Enter the 6-character code from the website."
		return
	end
	setUI("connecting")
	task.spawn(function()
		local ok, errMsg = doConnect(code)
		if not ok then
			errLabel.Text              = errMsg or "Connection failed."
			connectBtn.Text            = "Connect"
			connectBtn.Active          = true
			statusDot.BackgroundColor3 = Color3.fromRGB(90, 90, 90)
			statusLabel.Text           = "Disconnected"
			statusLabel.TextColor3     = Color3.fromRGB(130, 130, 130)
		end
	end)
end)

disconnectBtn.MouseButton1Click:Connect(function()
	disconnect(false)
end)

mainBtn.Click:Connect(function()
	widget.Enabled = not widget.Enabled
end)

-- ============================================================
-- Selection tracking (fires on every selection change)
-- ============================================================

local Selection = game:GetService("Selection")
local cachedSelection = {}

local function updateSelection()
	local sel = {}
	pcall(function()
		for _, obj in ipairs(Selection:Get()) do
			local entry = {
				name = obj.Name,
				className = obj.ClassName,
				path = obj:GetFullName(),
			}
			if obj:IsA("BasePart") then
				entry.position = string.format("%.1f,%.1f,%.1f", obj.Position.X, obj.Position.Y, obj.Position.Z)
				entry.size = string.format("%.1f,%.1f,%.1f", obj.Size.X, obj.Size.Y, obj.Size.Z)
				entry.material = tostring(obj.Material)
				entry.color = string.format("%d,%d,%d", math.floor(obj.Color.R*255), math.floor(obj.Color.G*255), math.floor(obj.Color.B*255))
				entry.transparency = obj.Transparency
				entry.anchored = obj.Anchored
			elseif obj:IsA("Model") then
				entry.childCount = #obj:GetChildren()
				if obj.PrimaryPart then
					entry.position = string.format("%.1f,%.1f,%.1f", obj.PrimaryPart.Position.X, obj.PrimaryPart.Position.Y, obj.PrimaryPart.Position.Z)
				end
			end
			sel[#sel + 1] = entry
			if #sel >= 15 then break end
		end
	end)
	cachedSelection = sel
end

pcall(function() Selection.SelectionChanged:Connect(updateSelection) end)

-- ============================================================
-- Scene tree — workspace top-level structure for AI map awareness
-- ============================================================

local cachedSceneTree = {}
local lastTreeScan = 0

local function scanSceneTree()
	local now = tick()
	if now - lastTreeScan < 10 then return end
	lastTreeScan = now
	local tree = {}
	pcall(function()
		for _, child in ipairs(workspace:GetChildren()) do
			if child.Name ~= "Terrain" and child.Name ~= "Camera" then
				local node = { name = child.Name, className = child.ClassName }
				if child:IsA("Model") then
					node.childCount = #child:GetDescendants()
					if child.PrimaryPart then
						node.position = string.format("%.0f,%.0f,%.0f", child.PrimaryPart.Position.X, child.PrimaryPart.Position.Y, child.PrimaryPart.Position.Z)
					end
				elseif child:IsA("BasePart") then
					node.position = string.format("%.0f,%.0f,%.0f", child.Position.X, child.Position.Y, child.Position.Z)
					node.size = string.format("%.1f,%.1f,%.1f", child.Size.X, child.Size.Y, child.Size.Z)
				elseif child:IsA("Folder") then
					node.childCount = #child:GetChildren()
				end
				tree[#tree + 1] = node
				if #tree >= 80 then break end
			end
		end
	end)
	cachedSceneTree = tree
end

-- ============================================================
-- Cached context — 100 nearest objects within 250 studs
-- ============================================================

local cachedNearby     = {}
local cachedPartCount  = 0
local cachedModelCount = 0
local cachedLightCount = 0
local lastContextScan  = 0
local lastCamPos       = Vector3.new(0, 0, 0)
local CONTEXT_INTERVAL = 3
local NEARBY_RADIUS_SQ = 62500  -- 250 studs squared
local NEARBY_MAX       = 100

local function scanContext()
	local cam = workspace.CurrentCamera
	if not cam then return end
	local camPos = cam.CFrame.Position

	local dx0 = camPos.X - lastCamPos.X
	local dz0 = camPos.Z - lastCamPos.Z
	local movedSq = dx0*dx0 + dz0*dz0
	local now = tick()
	if movedSq < 64 and (now - lastContextScan) < CONTEXT_INTERVAL then return end
	lastCamPos = camPos
	lastContextScan = now

	local parts = {}
	local totalParts = 0
	local totalModels = 0
	local totalLights = 0
	pcall(function()
		local descendants = workspace:GetDescendants()
		for i = 1, #descendants do
			local obj = descendants[i]
			if obj:IsA("BasePart") then
				totalParts = totalParts + 1
				if obj.Name ~= "Terrain" then
					local dx = obj.Position.X - camPos.X
					local dy = obj.Position.Y - camPos.Y
					local dz = obj.Position.Z - camPos.Z
					local distSq = dx*dx + dy*dy + dz*dz
					if distSq < NEARBY_RADIUS_SQ then
						parts[#parts + 1] = {
							name = obj.Name,
							className = obj.ClassName,
							position = string.format("%.0f,%.0f,%.0f", obj.Position.X, obj.Position.Y, obj.Position.Z),
							size = string.format("%.1f,%.1f,%.1f", obj.Size.X, obj.Size.Y, obj.Size.Z),
							material = tostring(obj.Material),
							color = string.format("%d,%d,%d", math.floor(obj.Color.R*255), math.floor(obj.Color.G*255), math.floor(obj.Color.B*255)),
							parent = obj.Parent and obj.Parent.Name or "",
							d = distSq,
						}
					end
				end
			elseif obj:IsA("Model") then
				totalModels = totalModels + 1
			elseif obj:IsA("Light") then
				totalLights = totalLights + 1
			end
		end
	end)

	table.sort(parts, function(a, b) return a.d < b.d end)
	local result = {}
	for i = 1, math.min(NEARBY_MAX, #parts) do
		local p = parts[i]
		p.d = nil
		result[i] = p
	end
	cachedNearby = result
	cachedPartCount = totalParts
	cachedModelCount = totalModels
	cachedLightCount = totalLights
	scanSceneTree()
end

-- ============================================================
-- Main loop — unified sync poll (fast, single request)
-- ============================================================

RunService.Heartbeat:Connect(function()
	if not authToken then return end
	local now = tick()

	-- Scan context in background (cheap — skips if camera hasn't moved)
	scanContext()

	-- Heartbeat (every 30s) — piggybacks on cached context
	if now - lastHB >= HB_INTERVAL then
		lastHB = now
		task.spawn(function()
			local cam = workspace.CurrentCamera
			local camData = nil
			if cam then
				local cf = cam.CFrame
				local lookAt = cf.Position + cf.LookVector * 50
				camData = {
					posX = math.floor(cf.Position.X * 10) / 10,
					posY = math.floor(cf.Position.Y * 10) / 10,
					posZ = math.floor(cf.Position.Z * 10) / 10,
					lookX = math.floor(lookAt.X * 10) / 10,
					lookY = math.floor(lookAt.Y * 10) / 10,
					lookZ = math.floor(lookAt.Z * 10) / 10,
					fov = cam.FieldOfView,
				}
			end
			-- Get what the user has selected in Studio
			local selectedData = {}
			pcall(function()
				local sel = game:GetService("Selection"):Get()
				for i, obj in sel do
					if i > 5 then break end
					local function round(n) return math.floor(n + 0.5) end
					if obj:IsA("BasePart") then
						local p = obj.Position
						table.insert(selectedData, {
							n = obj.Name:sub(1,40),
							cls = obj.ClassName,
							p = {round(p.X), round(p.Y), round(p.Z)},
							s = {round(obj.Size.X), round(obj.Size.Y), round(obj.Size.Z)},
						})
					elseif obj:IsA("Model") then
						table.insert(selectedData, {n = obj.Name:sub(1,40), cls = "Model"})
					end
				end
			end)

			-- Raycast down from camera to find ground Y
			local groundY = 0
			pcall(function()
				local camPos = workspace.CurrentCamera.CFrame.Position
				local ray = workspace:Raycast(camPos, Vector3.new(0, -500, 0))
				if ray then
					groundY = math.floor(ray.Position.Y + 0.5)
				end
			end)

			local ok, _ = jsonRequest("POST", "/api/studio/update", {
				sessionId    = sessionId,
				sessionToken = authToken,
				placeId      = placeId,
				placeName    = placeName,
				event        = "heartbeat",
				timestamp    = os.time(),
				camera       = camData,
				partCount    = cachedPartCount,
				modelCount   = cachedModelCount,
				lightCount   = cachedLightCount,
				nearbyParts  = cachedNearby,
				selected     = cachedSelection,
				sceneTree    = cachedSceneTree,
				groundY      = groundY,
			})
			if ok then onSuccess() else onFail() end
		end)
	end

	-- Command poll (every 1s) — camera in query string, zero overhead
	if now - lastSync >= SYNC_INTERVAL then
		lastSync = now
		task.spawn(function()
			local camQ = ""
			pcall(function()
				local cam = workspace.CurrentCamera
				if cam then
					local p = cam.CFrame.Position
					local l = cam.CFrame.LookVector
					camQ = "&camX=" .. math.floor(p.X)
						.. "&camY=" .. math.floor(p.Y)
						.. "&camZ=" .. math.floor(p.Z)
						.. "&lookX=" .. string.format("%.2f", l.X)
						.. "&lookY=" .. string.format("%.2f", l.Y)
						.. "&lookZ=" .. string.format("%.2f", l.Z)
				end
			end)

			local ok, data = jsonRequest("GET",
				"/api/studio/sync"
				.. "?sessionId=" .. HttpService:UrlEncode(sessionId or "")
				.. "&token="     .. HttpService:UrlEncode(authToken or "")
				.. "&pluginVer=" .. HttpService:UrlEncode(PLUGIN_VER)
				.. "&lastSync="  .. tostring(math.floor(lastSync * 1000))
				.. camQ)

			if ok and data then
				onSuccess()

				-- Version update notice (non-blocking)
				if data.updateAvailable then
					warn("[ForjeGames] Plugin update available! Download the latest version from: " .. BASE_URL .. (data.updateUrl or "/api/studio/plugin"))
				end

				-- Server requesting re-auth (session evicted from cold start)
				if data.reconnect then
					warn("[ForjeGames] Session expired. Re-enter your connection code.")
					disconnect(true)
					return
				end

				local cmds = data.commands or data.changes or {}
				for _, cmd in ipairs(cmds) do
					task.spawn(executeCommand, cmd)
				end
			else
				-- Check if it was a rate-limit response
				onFail(nil)
			end
		end)
	end
end)

-- ============================================================
-- Startup: attempt auto-reconnect with persisted credentials
-- ============================================================

task.spawn(function()
	-- Detect which server to talk to
	local savedToken, savedSession, savedUrl = loadAuth()
	detectBaseUrl(savedUrl)

	if savedToken and savedToken ~= "" then
		setUI("reconnecting")
		local ok = tryReconnect(savedToken, savedSession)
		if not ok then
			-- Saved token is stale — show login UI
			clearAuth()
			setUI("disconnected")
			statusLabel.Text = "Session expired. Enter a new code."
		end
	else
		setUI("disconnected")
	end
end)

-- Cleanup on plugin unload
plugin.Unloading:Connect(function()
	widget:Destroy()
end)

print("[ForjeGames] Plugin v" .. PLUGIN_VER .. " loaded. Click the ForjeGames toolbar button to connect.")
`

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function GET(req: NextRequest) {
  // Inject the app URL at serve time so the plugin knows which server to connect to.
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://forjegames.com').replace(/\/$/, '')
  const finalLua = PLUGIN_LUA.replace('INJECTED_BASE_URL', appUrl)

  // Check if caller wants raw .lua (e.g. ?format=lua)
  const format = req.nextUrl.searchParams.get('format')

  if (format === 'lua') {
    return new NextResponse(finalLua, {
      status: 200,
      headers: {
        ...CORS,
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment; filename="ForjeGames.lua"',
        'Cache-Control': 'no-store',
      },
    })
  }

  // Default: serve as .rbxm (XML Roblox Model) — Studio loads this natively
  // Escape the Lua source for XML CDATA (handle ]]> sequences)
  const escapedLua = finalLua.replace(/\]\]>/g, ']]]]><![CDATA[>')

  const rbxm = `<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.roblox.com/roblox.xsd" version="4">
  <!-- ForjeGames Studio Plugin v4.0.0 -->
  <!-- Generated dynamically — ${new Date().toISOString()} -->
  <Item class="Script" referent="RBX0001">
    <Properties>
      <string name="Name">ForjeGames</string>
      <ProtectedString name="Source"><![CDATA[${escapedLua}]]></ProtectedString>
    </Properties>
  </Item>
</roblox>`

  return new NextResponse(rbxm, {
    status: 200,
    headers: {
      ...CORS,
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': 'attachment; filename="ForjeGames.rbxm"',
      'Cache-Control': 'no-store',
    },
  })
}
