/**
 * GET /api/studio/plugin
 *
 * Serves the ForjeGames Roblox Studio plugin as a downloadable .lua file.
 */

import { NextResponse } from 'next/server'

const PLUGIN_LUA = `-- ForjeGames Studio Plugin v2.0.0
-- Save as ForjeGames.lua in your Plugins folder, then restart Studio.
--   Windows: %LOCALAPPDATA%\\Roblox\\Plugins\\ForjeGames.lua
--   Mac:     ~/Documents/Roblox/Plugins/ForjeGames.lua

local BASE_URL = "https://forjegames.com"
local POLL_INTERVAL = 1
local HEARTBEAT_INTERVAL = 5
local PLUGIN_VER = "2.0.0"
local MAX_FAILURES = 5

local HttpService = game:GetService("HttpService")
local RunService = game:GetService("RunService")
local ChangeHistoryService = game:GetService("ChangeHistoryService")
local MarketplaceService = game:GetService("MarketplaceService")

pcall(function() HttpService.HttpEnabled = true end)

local authToken = nil
local mySessionId = nil
local isConnected = false
local lastSync = 0
local lastHeartbeat = 0
local failures = 0
local placeId = tostring(game.PlaceId)
local placeName = "Unnamed Place"

pcall(function()
	local info = MarketplaceService:GetProductInfo(game.PlaceId)
	if info and info.Name then placeName = info.Name end
end)
if placeName == "Unnamed Place" and game.Name ~= "" then placeName = game.Name end

local toolbar = plugin:CreateToolbar("ForjeGames")
local btn = toolbar:CreateButton("ForjeGames", "Connect to ForjeGames.com", "")
btn.ClickableWhenViewportHidden = true

local function updateButton()
	if isConnected then
		btn.Text = "ForjeGames: Connected"
	else
		btn.Text = "ForjeGames: Connect"
	end
end
updateButton()

local function httpRequest(method, path, body)
	local success, result = pcall(function()
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
	return success, result
end

local function httpRetry(method, path, body, retries)
	retries = retries or 3
	local waitTime = 2
	for i = 1, retries + 1 do
		local ok, data = httpRequest(method, path, body)
		if ok and data ~= nil then return true, data end
		if i <= retries then task.wait(waitTime); waitTime = waitTime * 2 end
	end
	return false, nil
end

local function onFail()
	failures = failures + 1
	if failures >= MAX_FAILURES then
		authToken = nil
		mySessionId = nil
		isConnected = false
		failures = 0
		updateButton()
		warn("[ForjeGames] Lost connection. Click ForjeGames button to reconnect.")
	end
end

local function onSuccess() failures = 0 end

local function reportResult(cmdType, ok, errMsg)
	if not authToken then return end
	task.spawn(function()
		httpRequest("POST", "/api/studio/update", {
			sessionId = mySessionId,
			sessionToken = authToken,
			placeId = placeId,
			placeName = placeName,
			event = "command_completed",
			changes = {{type = "command_completed", command = cmdType, success = ok, error = errMsg, timestamp = os.time()}},
		})
	end)
end

local function executeCommand(cmd)
	local cmdType = cmd.type or cmd.command or "unknown"
	if cmdType == "execute_luau" or cmdType == "execute_code" then
		local code = (cmd.data and cmd.data.code) or cmd.code or ""
		if code ~= "" then
			local fn, err = loadstring(code)
			if fn then
				local runOk, runErr = pcall(fn)
				if not runOk then
					warn("[ForjeGames] Runtime error: " .. tostring(runErr))
					reportResult(cmdType, false, tostring(runErr))
					return
				end
				ChangeHistoryService:SetWaypoint("ForjeGames: Execute")
			else
				warn("[ForjeGames] Compile error: " .. tostring(err))
				reportResult(cmdType, false, tostring(err))
				return
			end
		end
	elseif cmdType == "insert_model" then
		local assetId = cmd.data and cmd.data.assetId
		if assetId then
			local insertOk, model = pcall(function()
				return game:GetService("InsertService"):LoadAsset(tonumber(assetId))
			end)
			if insertOk and model then
				model.Parent = workspace
				ChangeHistoryService:SetWaypoint("ForjeGames: Insert " .. tostring(assetId))
			else
				reportResult(cmdType, false, tostring(model))
				return
			end
		end
	elseif cmdType == "delete_model" then
		local path = cmd.data and cmd.data.instancePath
		if path then
			local target = workspace:FindFirstChild(path, true)
			if target then target:Destroy(); ChangeHistoryService:SetWaypoint("ForjeGames: Delete") end
		end
	end
	reportResult(cmdType, true, nil)
end

local function showConnectDialog()
	local old = game:GetService("CoreGui"):FindFirstChild("ForjeGamesConnect")
	if old then old:Destroy() end

	local gui = Instance.new("ScreenGui")
	gui.Name = "ForjeGamesConnect"
	gui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
	gui.Parent = game:GetService("CoreGui")

	local overlay = Instance.new("TextButton")
	overlay.Size = UDim2.new(1, 0, 1, 0)
	overlay.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
	overlay.BackgroundTransparency = 0.4
	overlay.BorderSizePixel = 0
	overlay.Text = ""
	overlay.AutoButtonColor = false
	overlay.Parent = gui
	overlay.MouseButton1Click:Connect(function() gui:Destroy() end)

	local card = Instance.new("Frame")
	card.Size = UDim2.new(0, 360, 0, 280)
	card.Position = UDim2.new(0.5, -180, 0.5, -140)
	card.BackgroundColor3 = Color3.fromRGB(18, 18, 18)
	card.BorderSizePixel = 0
	card.Parent = gui
	Instance.new("UICorner", card).CornerRadius = UDim.new(0, 14)

	local accent = Instance.new("Frame")
	accent.Size = UDim2.new(1, 0, 0, 3)
	accent.BackgroundColor3 = Color3.fromRGB(212, 175, 55)
	accent.BorderSizePixel = 0
	accent.Parent = card

	local title = Instance.new("TextLabel")
	title.Size = UDim2.new(1, -32, 0, 28)
	title.Position = UDim2.new(0, 16, 0, 18)
	title.BackgroundTransparency = 1
	title.Text = "ForjeGames"
	title.TextColor3 = Color3.fromRGB(212, 175, 55)
	title.Font = Enum.Font.GothamBold
	title.TextSize = 20
	title.TextXAlignment = Enum.TextXAlignment.Left
	title.Parent = card

	local sub = Instance.new("TextLabel")
	sub.Size = UDim2.new(1, -32, 0, 40)
	sub.Position = UDim2.new(0, 16, 0, 50)
	sub.BackgroundTransparency = 1
	sub.Text = "Enter the 6-character code shown at forjegames.com/editor (right panel)"
	sub.TextColor3 = Color3.fromRGB(150, 150, 150)
	sub.Font = Enum.Font.Gotham
	sub.TextSize = 12
	sub.TextWrapped = true
	sub.TextXAlignment = Enum.TextXAlignment.Left
	sub.Parent = card

	local inputBg = Instance.new("Frame")
	inputBg.Size = UDim2.new(1, -32, 0, 54)
	inputBg.Position = UDim2.new(0, 16, 0, 100)
	inputBg.BackgroundColor3 = Color3.fromRGB(8, 8, 8)
	inputBg.BorderSizePixel = 0
	inputBg.Parent = card
	Instance.new("UICorner", inputBg).CornerRadius = UDim.new(0, 10)
	local stroke = Instance.new("UIStroke")
	stroke.Color = Color3.fromRGB(60, 60, 60)
	stroke.Thickness = 1
	stroke.Parent = inputBg

	local input = Instance.new("TextBox")
	input.Size = UDim2.new(1, -16, 1, 0)
	input.Position = UDim2.new(0, 8, 0, 0)
	input.BackgroundTransparency = 1
	input.TextColor3 = Color3.fromRGB(212, 175, 55)
	input.Font = Enum.Font.GothamBold
	input.TextSize = 30
	input.PlaceholderText = "ABC123"
	input.PlaceholderColor3 = Color3.fromRGB(50, 50, 50)
	input.Text = ""
	input.ClearTextOnFocus = true
	input.TextXAlignment = Enum.TextXAlignment.Center
	input.Parent = inputBg

	local errLabel = Instance.new("TextLabel")
	errLabel.Size = UDim2.new(1, -32, 0, 18)
	errLabel.Position = UDim2.new(0, 16, 0, 162)
	errLabel.BackgroundTransparency = 1
	errLabel.Text = ""
	errLabel.TextColor3 = Color3.fromRGB(255, 90, 90)
	errLabel.Font = Enum.Font.Gotham
	errLabel.TextSize = 11
	errLabel.TextXAlignment = Enum.TextXAlignment.Center
	errLabel.Parent = card

	local connectBtn2 = Instance.new("TextButton")
	connectBtn2.Size = UDim2.new(1, -32, 0, 44)
	connectBtn2.Position = UDim2.new(0, 16, 0, 186)
	connectBtn2.BackgroundColor3 = Color3.fromRGB(212, 175, 55)
	connectBtn2.TextColor3 = Color3.fromRGB(0, 0, 0)
	connectBtn2.Font = Enum.Font.GothamBold
	connectBtn2.TextSize = 15
	connectBtn2.Text = "Connect"
	connectBtn2.BorderSizePixel = 0
	connectBtn2.AutoButtonColor = true
	connectBtn2.Parent = card
	Instance.new("UICorner", connectBtn2).CornerRadius = UDim.new(0, 10)

	local info = Instance.new("TextLabel")
	info.Size = UDim2.new(1, -32, 0, 16)
	info.Position = UDim2.new(0, 16, 0, 240)
	info.BackgroundTransparency = 1
	info.Text = placeName .. " (ID: " .. placeId .. ")"
	info.TextColor3 = Color3.fromRGB(70, 70, 70)
	info.Font = Enum.Font.Gotham
	info.TextSize = 10
	info.TextXAlignment = Enum.TextXAlignment.Center
	info.Parent = card

	connectBtn2.MouseButton1Click:Connect(function()
		local code = string.upper(string.gsub(input.Text, "%s", ""))
		if #code < 4 then
			errLabel.Text = "Enter the code from the website"
			return
		end
		connectBtn2.Text = "Connecting..."
		connectBtn2.Active = false
		errLabel.Text = ""

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
			failures = 0
			updateButton()
			print("[ForjeGames] Connected to " .. placeName)
			gui:Destroy()
		else
			errLabel.Text = "Invalid or expired code. Get a new one from the website."
			connectBtn2.Text = "Connect"
			connectBtn2.Active = true
		end
	end)

	task.delay(0.1, function()
		if input and input.Parent then input:CaptureFocus() end
	end)
end

btn.Click:Connect(function()
	if isConnected then
		authToken = nil
		mySessionId = nil
		isConnected = false
		failures = 0
		updateButton()
		print("[ForjeGames] Disconnected.")
	else
		showConnectDialog()
	end
end)

RunService.Heartbeat:Connect(function()
	if not authToken then return end
	local now = tick()

	if now - lastHeartbeat >= HEARTBEAT_INTERVAL then
		lastHeartbeat = now
		task.spawn(function()
			local ok = httpRequest("POST", "/api/studio/update", {
				sessionId = mySessionId, sessionToken = authToken,
				placeId = placeId, placeName = placeName,
				event = "heartbeat", timestamp = os.time(),
			})
			if ok then onSuccess() else onFail() end
		end)
	end

	if now - lastSync >= POLL_INTERVAL then
		lastSync = now
		task.spawn(function()
			local sid = mySessionId or ""
			local tok = authToken or ""
			local ok, data = httpRetry("GET",
				"/api/studio/sync?sessionId=" .. HttpService:UrlEncode(sid)
				.. "&token=" .. HttpService:UrlEncode(tok), nil, 1)
			if ok and data then
				onSuccess()
				local cmds = data.commands or data.changes or {}
				for _, cmd in ipairs(cmds) do task.spawn(executeCommand, cmd) end
			else
				onFail()
			end
		end)
	end
end)

print("[ForjeGames] Plugin v" .. PLUGIN_VER .. " loaded. Click the ForjeGames button in the toolbar.")
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
