/**
 * GET /api/studio/plugin
 * Serves the ForjeGames Roblox Studio plugin as a downloadable .lua file.
 */

import { NextResponse } from 'next/server'

const PLUGIN_LUA = `-- ForjeGames Studio Plugin v3.0.0
-- Save this file in your Plugins folder, then FULLY CLOSE and reopen Studio.
--   Windows: %LOCALAPPDATA%\\Roblox\\Plugins\\ForjeGames.lua
--   Mac:     ~/Documents/Roblox/Plugins/ForjeGames.lua

local BASE_URL = "https://forjegames.com"
local PLUGIN_VER = "3.0.0"
local MAX_FAILURES = 5

local HttpService = game:GetService("HttpService")
local RunService = game:GetService("RunService")
local ChangeHistoryService = game:GetService("ChangeHistoryService")

pcall(function() HttpService.HttpEnabled = true end)

-- State
local authToken = nil
local mySessionId = nil
local isConnected = false
local lastSync = 0
local lastHB = 0
local fails = 0
local placeId = tostring(game.PlaceId)
local placeName = game.Name ~= "" and game.Name or "Unnamed Place"

pcall(function()
	local info = game:GetService("MarketplaceService"):GetProductInfo(game.PlaceId)
	if info and info.Name then placeName = info.Name end
end)

-- Toolbar
local toolbar = plugin:CreateToolbar("ForjeGames")
local mainBtn = toolbar:CreateButton("ForjeGames", "Connect to ForjeGames.com", "")
mainBtn.ClickableWhenViewportHidden = true

-- Create the dock widget (this is the ONLY way to show GUI in modern Studio plugins)
local widgetInfo = DockWidgetPluginGuiInfo.new(
	Enum.InitialDockState.Float,
	false,  -- start hidden
	false,  -- don't override saved
	320, 300,  -- default size
	280, 250   -- min size
)
local widget = plugin:CreateDockWidgetPluginGui("ForjeGamesConnect", widgetInfo)
widget.Title = "ForjeGames"
widget.Enabled = false

-- Build the UI inside the widget
local bg = Instance.new("Frame")
bg.Size = UDim2.new(1, 0, 1, 0)
bg.BackgroundColor3 = Color3.fromRGB(22, 22, 22)
bg.BorderSizePixel = 0
bg.Parent = widget

local pad = Instance.new("UIPadding")
pad.PaddingTop = UDim.new(0, 12)
pad.PaddingBottom = UDim.new(0, 12)
pad.PaddingLeft = UDim.new(0, 14)
pad.PaddingRight = UDim.new(0, 14)
pad.Parent = bg

local layout = Instance.new("UIListLayout")
layout.SortOrder = Enum.SortOrder.LayoutOrder
layout.Padding = UDim.new(0, 8)
layout.Parent = bg

-- Title
local titleLabel = Instance.new("TextLabel")
titleLabel.Size = UDim2.new(1, 0, 0, 24)
titleLabel.BackgroundTransparency = 1
titleLabel.Text = "ForjeGames"
titleLabel.TextColor3 = Color3.fromRGB(212, 175, 55)
titleLabel.Font = Enum.Font.GothamBold
titleLabel.TextSize = 18
titleLabel.TextXAlignment = Enum.TextXAlignment.Left
titleLabel.LayoutOrder = 1
titleLabel.Parent = bg

-- Status label
local statusLabel = Instance.new("TextLabel")
statusLabel.Size = UDim2.new(1, 0, 0, 18)
statusLabel.BackgroundTransparency = 1
statusLabel.Text = "Not connected"
statusLabel.TextColor3 = Color3.fromRGB(140, 140, 140)
statusLabel.Font = Enum.Font.Gotham
statusLabel.TextSize = 12
statusLabel.TextXAlignment = Enum.TextXAlignment.Left
statusLabel.LayoutOrder = 2
statusLabel.Parent = bg

-- Instructions
local instrLabel = Instance.new("TextLabel")
instrLabel.Size = UDim2.new(1, 0, 0, 32)
instrLabel.BackgroundTransparency = 1
instrLabel.Text = "Enter the code from forjegames.com/editor:"
instrLabel.TextColor3 = Color3.fromRGB(160, 160, 160)
instrLabel.Font = Enum.Font.Gotham
instrLabel.TextSize = 11
instrLabel.TextWrapped = true
instrLabel.TextXAlignment = Enum.TextXAlignment.Left
instrLabel.LayoutOrder = 3
instrLabel.Parent = bg

-- Code input background
local inputFrame = Instance.new("Frame")
inputFrame.Size = UDim2.new(1, 0, 0, 48)
inputFrame.BackgroundColor3 = Color3.fromRGB(10, 10, 10)
inputFrame.BorderSizePixel = 0
inputFrame.LayoutOrder = 4
inputFrame.Parent = bg
Instance.new("UICorner", inputFrame).CornerRadius = UDim.new(0, 8)

local inputStroke = Instance.new("UIStroke")
inputStroke.Color = Color3.fromRGB(60, 60, 60)
inputStroke.Thickness = 1
inputStroke.Parent = inputFrame

local codeInput = Instance.new("TextBox")
codeInput.Size = UDim2.new(1, -12, 1, 0)
codeInput.Position = UDim2.new(0, 6, 0, 0)
codeInput.BackgroundTransparency = 1
codeInput.TextColor3 = Color3.fromRGB(212, 175, 55)
codeInput.Font = Enum.Font.GothamBold
codeInput.TextSize = 26
codeInput.PlaceholderText = "ABC123"
codeInput.PlaceholderColor3 = Color3.fromRGB(50, 50, 50)
codeInput.Text = ""
codeInput.ClearTextOnFocus = true
codeInput.TextXAlignment = Enum.TextXAlignment.Center
codeInput.Parent = inputFrame

-- Error label
local errLabel = Instance.new("TextLabel")
errLabel.Size = UDim2.new(1, 0, 0, 14)
errLabel.BackgroundTransparency = 1
errLabel.Text = ""
errLabel.TextColor3 = Color3.fromRGB(255, 90, 90)
errLabel.Font = Enum.Font.Gotham
errLabel.TextSize = 11
errLabel.TextXAlignment = Enum.TextXAlignment.Center
errLabel.LayoutOrder = 5
errLabel.Parent = bg

-- Connect button
local connectBtn = Instance.new("TextButton")
connectBtn.Size = UDim2.new(1, 0, 0, 40)
connectBtn.BackgroundColor3 = Color3.fromRGB(212, 175, 55)
connectBtn.TextColor3 = Color3.fromRGB(0, 0, 0)
connectBtn.Font = Enum.Font.GothamBold
connectBtn.TextSize = 14
connectBtn.Text = "Connect"
connectBtn.BorderSizePixel = 0
connectBtn.AutoButtonColor = true
connectBtn.LayoutOrder = 6
connectBtn.Parent = bg
Instance.new("UICorner", connectBtn).CornerRadius = UDim.new(0, 8)

-- Place info
local placeLabel = Instance.new("TextLabel")
placeLabel.Size = UDim2.new(1, 0, 0, 14)
placeLabel.BackgroundTransparency = 1
placeLabel.Text = placeName .. " (ID: " .. placeId .. ")"
placeLabel.TextColor3 = Color3.fromRGB(70, 70, 70)
placeLabel.Font = Enum.Font.Gotham
placeLabel.TextSize = 10
placeLabel.TextXAlignment = Enum.TextXAlignment.Center
placeLabel.LayoutOrder = 7
placeLabel.Parent = bg

-- HTTP helpers
local function httpRequest(method, path, body)
	local ok, result = pcall(function()
		local opts = {
			Url = BASE_URL .. path,
			Method = method,
			Headers = {["Content-Type"] = "application/json"},
		}
		if body then opts.Body = HttpService:JSONEncode(body) end
		local res = HttpService:RequestAsync(opts)
		if res.Success then return HttpService:JSONDecode(res.Body) end
		return nil
	end)
	return ok, result
end

local function httpRetry(method, path, body, maxRetries)
	maxRetries = maxRetries or 2
	local delay = 2
	for i = 1, maxRetries + 1 do
		local ok, data = httpRequest(method, path, body)
		if ok and data ~= nil then return true, data end
		if i <= maxRetries then task.wait(delay); delay = delay * 2 end
	end
	return false, nil
end

local function updateUI()
	if isConnected then
		mainBtn.Text = "ForjeGames (On)"
		statusLabel.Text = "Connected to " .. placeName
		statusLabel.TextColor3 = Color3.fromRGB(16, 185, 129)
		instrLabel.Visible = false
		inputFrame.Visible = false
		connectBtn.Text = "Disconnect"
		connectBtn.BackgroundColor3 = Color3.fromRGB(80, 80, 80)
		errLabel.Text = ""
	else
		mainBtn.Text = "ForjeGames"
		statusLabel.Text = "Not connected"
		statusLabel.TextColor3 = Color3.fromRGB(140, 140, 140)
		instrLabel.Visible = true
		inputFrame.Visible = true
		connectBtn.Text = "Connect"
		connectBtn.BackgroundColor3 = Color3.fromRGB(212, 175, 55)
	end
end

local function onFail()
	fails = fails + 1
	if fails >= MAX_FAILURES then
		authToken = nil
		mySessionId = nil
		isConnected = false
		fails = 0
		updateUI()
		warn("[ForjeGames] Lost connection. Click ForjeGames to reconnect.")
	end
end

local function onSuccess() fails = 0 end

local function reportResult(cmdType, success, errMsg)
	if not authToken then return end
	task.spawn(function()
		httpRequest("POST", "/api/studio/update", {
			sessionId = mySessionId, sessionToken = authToken,
			placeId = placeId, placeName = placeName,
			event = "command_completed",
			changes = {{type = "command_completed", command = cmdType, success = success, error = errMsg, timestamp = os.time()}},
		})
	end)
end

local function executeCommand(cmd)
	local cmdType = cmd.type or cmd.command or "unknown"
	if cmdType == "execute_luau" or cmdType == "execute_code" then
		local code = (cmd.data and cmd.data.code) or cmd.code or ""
		if code ~= "" then
			local fn, compErr = loadstring(code)
			if fn then
				local ok, runErr = pcall(fn)
				if not ok then
					warn("[ForjeGames] Runtime error: " .. tostring(runErr))
					reportResult(cmdType, false, tostring(runErr))
					return
				end
				ChangeHistoryService:SetWaypoint("ForjeGames Build")
			else
				warn("[ForjeGames] Compile error: " .. tostring(compErr))
				reportResult(cmdType, false, tostring(compErr))
				return
			end
		end
	elseif cmdType == "insert_model" then
		local assetId = cmd.data and cmd.data.assetId
		if assetId then
			local ok, model = pcall(function()
				return game:GetService("InsertService"):LoadAsset(tonumber(assetId))
			end)
			if ok and model then
				model.Parent = workspace
				ChangeHistoryService:SetWaypoint("ForjeGames Insert")
			else
				reportResult(cmdType, false, tostring(model))
				return
			end
		end
	elseif cmdType == "delete_model" then
		local p = cmd.data and cmd.data.instancePath
		if p then
			local t = workspace:FindFirstChild(p, true)
			if t then t:Destroy(); ChangeHistoryService:SetWaypoint("ForjeGames Delete") end
		end
	end
	reportResult(cmdType, true, nil)
end

-- Connect button handler
connectBtn.MouseButton1Click:Connect(function()
	if isConnected then
		authToken = nil
		mySessionId = nil
		isConnected = false
		fails = 0
		updateUI()
		print("[ForjeGames] Disconnected.")
		return
	end

	local code = string.upper(string.gsub(codeInput.Text, "%s", ""))
	if #code < 4 then
		errLabel.Text = "Enter the 6-char code from the website"
		return
	end

	connectBtn.Text = "Connecting..."
	connectBtn.Active = false
	errLabel.Text = ""

	task.spawn(function()
		local ok, data = httpRetry("POST", "/api/studio/auth", {
			code = code,
			placeId = placeId,
			placeName = placeName,
			pluginVer = PLUGIN_VER,
		})

		if ok and data and (data.token or data.sessionToken) then
			authToken = data.token or data.sessionToken
			mySessionId = data.sessionId
			isConnected = true
			fails = 0
			updateUI()
			print("[ForjeGames] Connected to " .. placeName .. "!")
		else
			errLabel.Text = "Invalid or expired code. Get a new one."
			connectBtn.Text = "Connect"
			connectBtn.Active = true
		end
	end)
end)

-- Toggle widget on toolbar click
mainBtn.Click:Connect(function()
	widget.Enabled = not widget.Enabled
end)

-- Main loop
RunService.Heartbeat:Connect(function()
	if not authToken then return end
	local now = tick()

	if now - lastHB >= 5 then
		lastHB = now
		task.spawn(function()
			local ok = httpRequest("POST", "/api/studio/update", {
				sessionId = mySessionId, sessionToken = authToken,
				placeId = placeId, placeName = placeName,
				event = "heartbeat", timestamp = os.time(),
			})
			if ok then onSuccess() else onFail() end
		end)
	end

	if now - lastSync >= 1 then
		lastSync = now
		task.spawn(function()
			local ok, data = httpRetry("GET",
				"/api/studio/sync?sessionId=" .. HttpService:UrlEncode(mySessionId or "")
				.. "&token=" .. HttpService:UrlEncode(authToken or ""), nil, 1)
			if ok and data then
				onSuccess()
				for _, cmd in ipairs(data.commands or data.changes or {}) do
					task.spawn(executeCommand, cmd)
				end
			else
				onFail()
			end
		end)
	end
end)

-- Cleanup
plugin.Unloading:Connect(function()
	widget:Destroy()
end)

updateUI()
print("[ForjeGames] Plugin v" .. PLUGIN_VER .. " loaded. Click ForjeGames in the toolbar.")
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
