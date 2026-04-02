/**
 * GET /api/studio/plugin
 * Serves the ForjeGames Roblox Studio plugin v4.0.0 as a downloadable .lua file.
 *
 * Features:
 * - Smart URL auto-detection (localhost → production)
 * - Persistent auth via plugin:SetSetting()
 * - Auto-reconnect on startup with saved token
 * - Retry with exponential backoff on 429 / network errors
 * - Session keepalive heartbeat every 30 s
 * - Full command handling: execute_luau, insert_asset, insert_model, delete_model, update_property
 * - Clean DockWidget UI: status dot, code entry, place info, disconnect button
 */

import { NextResponse } from 'next/server'

const PLUGIN_LUA = `-- ForjeGames Studio Plugin v4.0.0
-- Install: Save to %LOCALAPPDATA%\\Roblox\\Plugins\\ForjeGames.lua (Windows)
--          or ~/Documents/Roblox/Plugins/ForjeGames.lua (Mac)
-- Then fully close and reopen Roblox Studio.

local PLUGIN_VER     = "4.0.0"
local PROD_URL       = "https://forjegames.com"
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
local lastSync    = 0
local lastHB      = 0
local fails       = 0

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
-- URL auto-detection
-- ============================================================

local function detectBaseUrl(savedUrl)
	-- Production plugin always connects to production.
	-- This ensures the code from forjegames.com/editor matches the server.
	-- Clear any saved localhost URL from previous dev sessions.
	if savedUrl and savedUrl:find("localhost") then
		savedUrl = nil
		pcall(function() plugin:SetSetting("ForjeGames_BaseUrl", nil) end)
	end
	if savedUrl and savedUrl ~= "" then
		BASE_URL = savedUrl
		return
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

local function onFail()
	fails = fails + 1
	if fails >= MAX_FAILURES then
		-- Try auto-reconnect before giving up
		if authToken and authToken ~= "" then
			warn("[ForjeGames] Connection lost. Attempting auto-reconnect...")
			fails = 0
			setUI("reconnecting")
			task.spawn(function()
				local ok = tryReconnect(authToken, sessionId)
				if not ok then
					warn("[ForjeGames] Auto-reconnect failed. Re-enter your code.")
					disconnect(true)
				end
			end)
		else
			disconnect(true)
		end
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
		local fn, compErr = loadstring(code)
		if not fn then
			warn("[ForjeGames] Compile error: " .. tostring(compErr))
			reportResult(cmdId, cmdType, false, tostring(compErr))
			return
		end
		local ok, runErr = pcall(fn)
		if not ok then
			warn("[ForjeGames] Runtime error: " .. tostring(runErr))
			reportResult(cmdId, cmdType, false, tostring(runErr))
			return
		end
		ChangeHistoryService:SetWaypoint("ForjeGames: execute_luau")

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

	elseif cmdType == "delete_model" then
		local path = data.instancePath or data.name
		if not path then
			reportResult(cmdId, cmdType, false, "instancePath is required")
			return
		end
		local target = workspace:FindFirstChild(path, true)
		if target then
			target:Destroy()
			ChangeHistoryService:SetWaypoint("ForjeGames: delete_model")
		else
			warn("[ForjeGames] delete_model: instance not found: " .. tostring(path))
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
		else
			warn("[ForjeGames] update_property: instance not found: " .. tostring(path))
		end
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
		return true, nil
	end
	-- Surface the server error message if available
	local errMsg = "Invalid or expired code."
	if data and data.error then
		if data.error == "code_already_claimed" then
			errMsg = "Code already used. Generate a new one."
		elseif data.error == "code_expired_or_invalid" then
			errMsg = "Code expired. Generate a new one."
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
-- Main loop — heartbeat + sync poll
-- ============================================================

RunService.Heartbeat:Connect(function()
	if not authToken then return end
	local now = tick()

	-- Keepalive heartbeat (every 30 s)
	if now - lastHB >= HB_INTERVAL then
		lastHB = now
		task.spawn(function()
			local ok, _ = jsonRequest("POST", "/api/studio/update", {
				sessionId    = sessionId,
				sessionToken = authToken,
				placeId      = placeId,
				placeName    = placeName,
				event        = "heartbeat",
				timestamp    = os.time(),
			})
			if ok then onSuccess() else onFail() end
		end)
	end

	-- Command poll (every 1 s)
	if now - lastSync >= SYNC_INTERVAL then
		lastSync = now
		task.spawn(function()
			local ok, data = jsonRequest("GET",
				"/api/studio/sync"
				.. "?sessionId=" .. HttpService:UrlEncode(sessionId or "")
				.. "&token="     .. HttpService:UrlEncode(authToken or "")
				.. "&lastSync="  .. tostring(math.floor(lastSync * 1000)))

			if ok and data then
				onSuccess()
				local cmds = data.commands or data.changes or {}
				for _, cmd in ipairs(cmds) do
					task.spawn(executeCommand, cmd)
				end
			else
				onFail()
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

export async function GET() {
  return new NextResponse(PLUGIN_LUA, {
    status: 200,
    headers: {
      ...CORS,
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': 'attachment; filename="ForjeGames.lua"',
      'Cache-Control': 'no-store',
    },
  })
}
