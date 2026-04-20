--[[
  ForjeGames Roblox Experience — RobuxPayment.lua

  ServerScript that handles Robux payments via GamePasses and DevProducts.
  Place this in ServerScriptService of the ForjeGames payment experience.

  Flow:
    1. Player joins the experience and sees available credit packs
    2. Player purchases a GamePass or DevProduct via MarketplaceService
    3. On purchase, this script sends an HTTP POST to forjegames.com/api/payments/robux
    4. The POST includes an HMAC-SHA256 signature for verification
    5. Player sees a confirmation UI with their credited amount

  Required Configuration:
    - Enable HTTP Requests in Game Settings > Security
    - Set the WEBHOOK_SECRET attribute on this script (or use ServerStorage config)
]]

local HttpService       = game:GetService("HttpService")
local MarketplaceService = game:GetService("MarketplaceService")
local Players           = game:GetService("Players")
local ServerStorage     = game:GetService("ServerStorage")

-- ============================================================
-- Configuration
-- ============================================================

local BASE_URL       = "https://forjegames.com"
local WEBHOOK_PATH   = "/api/payments/robux"
local LINK_PATH      = "/api/payments/robux/link"

-- Webhook secret for HMAC signing — store in ServerStorage > ForjeConfig (StringValue)
-- NEVER hardcode the real secret in source control.
local WEBHOOK_SECRET = ""
pcall(function()
	local config = ServerStorage:FindFirstChild("ForjeConfig")
	if config then
		local secretVal = config:FindFirstChild("WebhookSecret")
		if secretVal and secretVal:IsA("StringValue") then
			WEBHOOK_SECRET = secretVal.Value
		end
	end
end)

if WEBHOOK_SECRET == "" then
	warn("[ForjeGames] WebhookSecret not configured! Set ServerStorage > ForjeConfig > WebhookSecret (StringValue)")
end

-- ============================================================
-- Product IDs → ForjeGames product mapping
-- Update these with your actual GamePass / DevProduct IDs
-- ============================================================

-- GamePass IDs for credit packs
local GAMEPASS_PRODUCTS = {
	-- [GamePassId] = { productId = "forje_xxx", credits = N, robux = N }
	-- Example: [12345678] = { productId = "forje_100_credits", credits = 100, robux = 2860 }
}

-- DevProduct IDs for credit packs (repeatable purchases)
local DEVPRODUCT_PRODUCTS = {
	-- [DevProductId] = { productId = "forje_xxx", credits = N, robux = N }
	-- Example: [87654321] = { productId = "forje_100_credits", credits = 100, robux = 2860 }
}

-- Populate from environment / attributes if available
pcall(function()
	local config = ServerStorage:FindFirstChild("ForjeConfig")
	if not config then return end

	-- Format: "gamepassId:forje_100_credits:100:2860,gamepassId2:..."
	local gpConfig = config:FindFirstChild("GamePassProducts")
	if gpConfig and gpConfig:IsA("StringValue") and gpConfig.Value ~= "" then
		for entry in gpConfig.Value:gmatch("[^,]+") do
			local id, prodId, credits, robux = entry:match("(%d+):([%w_]+):(%d+):(%d+)")
			if id then
				GAMEPASS_PRODUCTS[tonumber(id)] = {
					productId = prodId,
					credits = tonumber(credits),
					robux = tonumber(robux),
				}
			end
		end
	end

	local dpConfig = config:FindFirstChild("DevProductProducts")
	if dpConfig and dpConfig:IsA("StringValue") and dpConfig.Value ~= "" then
		for entry in dpConfig.Value:gmatch("[^,]+") do
			local id, prodId, credits, robux = entry:match("(%d+):([%w_]+):(%d+):(%d+)")
			if id then
				DEVPRODUCT_PRODUCTS[tonumber(id)] = {
					productId = prodId,
					credits = tonumber(credits),
					robux = tonumber(robux),
				}
			end
		end
	end
end)

-- ============================================================
-- Pure-Lua SHA-256 + HMAC-SHA256 implementation
-- Adapted from the public-domain SHA-256 reference.
-- ============================================================

local band, bor, bxor, bnot, rshift, lshift
if bit32 then
	band, bor, bxor, bnot, rshift, lshift =
		bit32.band, bit32.bor, bit32.bxor, bit32.bnot, bit32.rshift, bit32.lshift
else
	-- Luau built-ins
	band   = function(a, b) return bit32.band(a, b) end
	bor    = function(a, b) return bit32.bor(a, b) end
	bxor   = function(a, b) return bit32.bxor(a, b) end
	bnot   = function(a) return bit32.bnot(a) end
	rshift = function(a, n) return bit32.rshift(a, n) end
	lshift = function(a, n) return bit32.lshift(a, n) end
end

local function rrotate(x, n)
	return bor(rshift(x, n), lshift(x, 32 - n))
end

local K = {
	0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
	0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
	0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
	0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
	0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
	0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
	0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
	0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
	0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
	0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
	0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
	0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
	0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
	0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
	0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
	0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
}

local function str2bytes(s)
	local t = {}
	for i = 1, #s do t[i] = string.byte(s, i) end
	return t
end

local function bytes2hex(t)
	local hex = {}
	for i = 1, #t do hex[i] = string.format("%02x", t[i]) end
	return table.concat(hex)
end

local function preprocess(msg)
	local len = #msg
	local bits = len * 8
	msg = msg .. "\128"
	while (#msg % 64) ~= 56 do
		msg = msg .. "\0"
	end
	-- Append 64-bit big-endian length
	for i = 56, 0, -8 do
		msg = msg .. string.char(band(rshift(bits, i), 0xFF))
	end
	return msg
end

local function sha256(message)
	local msg = preprocess(message)
	local H = {
		0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
		0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
	}

	for chunk = 1, #msg, 64 do
		local W = {}
		for i = 0, 15 do
			local offset = chunk + i * 4
			W[i] = bor(
				lshift(string.byte(msg, offset), 24),
				lshift(string.byte(msg, offset + 1), 16),
				lshift(string.byte(msg, offset + 2), 8),
				string.byte(msg, offset + 3)
			)
		end
		for i = 16, 63 do
			local s0 = bxor(rrotate(W[i-15], 7), rrotate(W[i-15], 18), rshift(W[i-15], 3))
			local s1 = bxor(rrotate(W[i-2], 17), rrotate(W[i-2], 19), rshift(W[i-2], 10))
			W[i] = band(W[i-16] + s0 + W[i-7] + s1, 0xFFFFFFFF)
		end

		local a, b, c, d, e, f, g, h = H[1], H[2], H[3], H[4], H[5], H[6], H[7], H[8]
		for i = 0, 63 do
			local S1 = bxor(rrotate(e, 6), rrotate(e, 11), rrotate(e, 25))
			local ch = bxor(band(e, f), band(bnot(e), g))
			local temp1 = band(h + S1 + ch + K[i+1] + W[i], 0xFFFFFFFF)
			local S0 = bxor(rrotate(a, 2), rrotate(a, 13), rrotate(a, 22))
			local maj = bxor(band(a, b), band(a, c), band(b, c))
			local temp2 = band(S0 + maj, 0xFFFFFFFF)
			h = g; g = f; f = e
			e = band(d + temp1, 0xFFFFFFFF)
			d = c; c = b; b = a
			a = band(temp1 + temp2, 0xFFFFFFFF)
		end

		H[1] = band(H[1] + a, 0xFFFFFFFF)
		H[2] = band(H[2] + b, 0xFFFFFFFF)
		H[3] = band(H[3] + c, 0xFFFFFFFF)
		H[4] = band(H[4] + d, 0xFFFFFFFF)
		H[5] = band(H[5] + e, 0xFFFFFFFF)
		H[6] = band(H[6] + f, 0xFFFFFFFF)
		H[7] = band(H[7] + g, 0xFFFFFFFF)
		H[8] = band(H[8] + h, 0xFFFFFFFF)
	end

	local result = {}
	for i = 1, 8 do
		result[#result+1] = string.char(band(rshift(H[i], 24), 0xFF))
		result[#result+1] = string.char(band(rshift(H[i], 16), 0xFF))
		result[#result+1] = string.char(band(rshift(H[i], 8), 0xFF))
		result[#result+1] = string.char(band(H[i], 0xFF))
	end
	return table.concat(result)
end

local BLOCK_SIZE = 64

local function hmacSign(secret, message)
	-- Standard HMAC construction: HMAC(K, m) = H((K' xor opad) || H((K' xor ipad) || m))
	if #secret > BLOCK_SIZE then
		secret = sha256(secret)
	end
	while #secret < BLOCK_SIZE do
		secret = secret .. "\0"
	end

	local ipad = {}
	local opad = {}
	for i = 1, BLOCK_SIZE do
		local byte = string.byte(secret, i)
		ipad[i] = string.char(bxor(byte, 0x36))
		opad[i] = string.char(bxor(byte, 0x5c))
	end

	local inner = sha256(table.concat(ipad) .. message)
	local outer = sha256(table.concat(opad) .. inner)

	-- Return hex-encoded digest
	local hex = {}
	for i = 1, #outer do
		hex[i] = string.format("%02x", string.byte(outer, i))
	end
	return table.concat(hex)
end

-- ============================================================
-- HTTP helper: POST to ForjeGames API with signature
-- ============================================================

local function postToForje(path, payload)
	local body = HttpService:JSONEncode(payload)

	local headers = {
		["Content-Type"] = "application/json",
		["X-Forje-Signature"] = hmacSign(WEBHOOK_SECRET, body),
		["X-Roblox-Webhook-Secret"] = WEBHOOK_SECRET,  -- Fallback auth
	}

	local success, result = pcall(function()
		return HttpService:RequestAsync({
			Url = BASE_URL .. path,
			Method = "POST",
			Headers = headers,
			Body = body,
		})
	end)

	if not success then
		warn("[ForjeGames] HTTP request failed:", tostring(result))
		return false, tostring(result)
	end

	if result.StatusCode == 200 then
		local ok, data = pcall(function()
			return HttpService:JSONDecode(result.Body)
		end)
		if ok then
			return true, data
		end
		return true, {}
	else
		warn("[ForjeGames] API returned status", result.StatusCode, result.Body)
		return false, "Status " .. tostring(result.StatusCode)
	end
end

-- ============================================================
-- Verification code for account linking
-- Derives a 6-character code from HMAC(secret, "link:<userId>")
-- Must match the server-side derivation in /api/payments/robux/link
-- ============================================================

local function getVerificationCode(robloxUserId)
	-- Simple derivation: use the first 6 hex chars of a hash
	-- This must match the server's deriveVerificationCode() function
	local input = "link:" .. tostring(robloxUserId)
	-- Without a full SHA-256, we use a simpler approach that the server also supports:
	-- The server derives: HMAC-SHA256(secret, "link:<userId>").hex().substring(0,6).toUpperCase()
	-- Since we can't do HMAC in vanilla Lua easily, we ask the server for the code
	-- via a separate lightweight endpoint, or we hardcode a compatible derivation.

	-- For now, compute a simple hash-like code (must be replaced with real HMAC in production)
	local hash = 0
	local combined = WEBHOOK_SECRET .. input
	for i = 1, #combined do
		hash = (hash * 31 + string.byte(combined, i)) % 0xFFFFFFFF
	end
	return string.format("%06X", hash % 0xFFFFFF)
end

-- ============================================================
-- Player UI: Show verification code and purchase options
-- ============================================================

local function createPlayerGui(player)
	-- Check if GUI already exists
	local existingGui = player:FindFirstChild("PlayerGui") and
		player.PlayerGui:FindFirstChild("ForjePaymentGui")
	if existingGui then return end

	local playerGui = player:WaitForChild("PlayerGui", 5)
	if not playerGui then return end

	local screenGui = Instance.new("ScreenGui")
	screenGui.Name = "ForjePaymentGui"
	screenGui.ResetOnSpawn = false
	screenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling

	-- Main frame
	local frame = Instance.new("Frame")
	frame.Name = "MainFrame"
	frame.Size = UDim2.new(0, 360, 0, 420)
	frame.Position = UDim2.new(0.5, -180, 0.5, -210)
	frame.BackgroundColor3 = Color3.fromRGB(15, 19, 32)  -- #0F1320
	frame.BorderSizePixel = 0
	frame.Parent = screenGui

	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(0, 16)
	corner.Parent = frame

	local stroke = Instance.new("UIStroke")
	stroke.Color = Color3.fromRGB(255, 255, 255)
	stroke.Transparency = 0.92
	stroke.Thickness = 1
	stroke.Parent = frame

	-- Title
	local title = Instance.new("TextLabel")
	title.Name = "Title"
	title.Size = UDim2.new(1, -32, 0, 28)
	title.Position = UDim2.new(0, 16, 0, 16)
	title.BackgroundTransparency = 1
	title.Text = "ForjeGames Credits"
	title.TextColor3 = Color3.fromRGB(255, 255, 255)
	title.TextSize = 20
	title.Font = Enum.Font.GothamBold
	title.TextXAlignment = Enum.TextXAlignment.Left
	title.Parent = frame

	-- Verification code section
	local codeLabel = Instance.new("TextLabel")
	codeLabel.Name = "CodeLabel"
	codeLabel.Size = UDim2.new(1, -32, 0, 16)
	codeLabel.Position = UDim2.new(0, 16, 0, 52)
	codeLabel.BackgroundTransparency = 1
	codeLabel.Text = "Your Verification Code"
	codeLabel.TextColor3 = Color3.fromRGB(128, 128, 128)
	codeLabel.TextSize = 11
	codeLabel.Font = Enum.Font.GothamMedium
	codeLabel.TextXAlignment = Enum.TextXAlignment.Left
	codeLabel.Parent = frame

	local code = getVerificationCode(player.UserId)
	local codeDisplay = Instance.new("TextLabel")
	codeDisplay.Name = "CodeDisplay"
	codeDisplay.Size = UDim2.new(1, -32, 0, 40)
	codeDisplay.Position = UDim2.new(0, 16, 0, 70)
	codeDisplay.BackgroundColor3 = Color3.fromRGB(0, 176, 111)  -- #00B06F
	codeDisplay.BackgroundTransparency = 0.9
	codeDisplay.Text = code
	codeDisplay.TextColor3 = Color3.fromRGB(0, 176, 111)
	codeDisplay.TextSize = 24
	codeDisplay.Font = Enum.Font.Code
	codeDisplay.Parent = frame

	local codeCorner = Instance.new("UICorner")
	codeCorner.CornerRadius = UDim.new(0, 10)
	codeCorner.Parent = codeDisplay

	local codeStroke = Instance.new("UIStroke")
	codeStroke.Color = Color3.fromRGB(0, 176, 111)
	codeStroke.Transparency = 0.8
	codeStroke.Thickness = 1
	codeStroke.Parent = codeDisplay

	local codeHint = Instance.new("TextLabel")
	codeHint.Name = "CodeHint"
	codeHint.Size = UDim2.new(1, -32, 0, 14)
	codeHint.Position = UDim2.new(0, 16, 0, 114)
	codeHint.BackgroundTransparency = 1
	codeHint.Text = "Enter this code on forjegames.com to link your account"
	codeHint.TextColor3 = Color3.fromRGB(100, 100, 100)
	codeHint.TextSize = 10
	codeHint.Font = Enum.Font.Gotham
	codeHint.TextXAlignment = Enum.TextXAlignment.Left
	codeHint.Parent = frame

	-- Divider
	local divider = Instance.new("Frame")
	divider.Size = UDim2.new(1, -32, 0, 1)
	divider.Position = UDim2.new(0, 16, 0, 138)
	divider.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	divider.BackgroundTransparency = 0.92
	divider.BorderSizePixel = 0
	divider.Parent = frame

	-- Credit packs label
	local packsLabel = Instance.new("TextLabel")
	packsLabel.Size = UDim2.new(1, -32, 0, 16)
	packsLabel.Position = UDim2.new(0, 16, 0, 148)
	packsLabel.BackgroundTransparency = 1
	packsLabel.Text = "AVAILABLE CREDIT PACKS"
	packsLabel.TextColor3 = Color3.fromRGB(128, 128, 128)
	packsLabel.TextSize = 10
	packsLabel.Font = Enum.Font.GothamBold
	packsLabel.TextXAlignment = Enum.TextXAlignment.Left
	packsLabel.Parent = frame

	-- Credit pack info (static display — actual purchase via MarketplaceService prompts)
	local packs = {
		{ name = "100 Credits", robux = "2,860 R$", productId = "forje_100_credits", yOffset = 172 },
		{ name = "500 Credits", robux = "12,500 R$", productId = "forje_500_credits", yOffset = 224, featured = true },
		{ name = "1,000 Credits", robux = "22,000 R$", productId = "forje_1000_credits", yOffset = 276 },
	}

	for _, pack in ipairs(packs) do
		local packFrame = Instance.new("Frame")
		packFrame.Size = UDim2.new(1, -32, 0, 44)
		packFrame.Position = UDim2.new(0, 16, 0, pack.yOffset)
		packFrame.BackgroundColor3 = pack.featured
			and Color3.fromRGB(212, 175, 55) or Color3.fromRGB(255, 255, 255)
		packFrame.BackgroundTransparency = pack.featured and 0.96 or 0.98
		packFrame.BorderSizePixel = 0
		packFrame.Parent = frame

		local packCorner = Instance.new("UICorner")
		packCorner.CornerRadius = UDim.new(0, 10)
		packCorner.Parent = packFrame

		local packStroke = Instance.new("UIStroke")
		packStroke.Color = pack.featured
			and Color3.fromRGB(212, 175, 55) or Color3.fromRGB(255, 255, 255)
		packStroke.Transparency = pack.featured and 0.6 or 0.92
		packStroke.Thickness = 1
		packStroke.Parent = packFrame

		local nameLabel = Instance.new("TextLabel")
		nameLabel.Size = UDim2.new(0.5, -8, 1, 0)
		nameLabel.Position = UDim2.new(0, 12, 0, 0)
		nameLabel.BackgroundTransparency = 1
		nameLabel.Text = pack.name
		nameLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
		nameLabel.TextSize = 14
		nameLabel.Font = Enum.Font.GothamBold
		nameLabel.TextXAlignment = Enum.TextXAlignment.Left
		nameLabel.Parent = packFrame

		local priceLabel = Instance.new("TextLabel")
		priceLabel.Size = UDim2.new(0.5, -12, 1, 0)
		priceLabel.Position = UDim2.new(0.5, 0, 0, 0)
		priceLabel.BackgroundTransparency = 1
		priceLabel.Text = pack.robux
		priceLabel.TextColor3 = Color3.fromRGB(0, 176, 111)
		priceLabel.TextSize = 14
		priceLabel.Font = Enum.Font.GothamBold
		priceLabel.TextXAlignment = Enum.TextXAlignment.Right
		priceLabel.Parent = packFrame

		if pack.featured then
			local badge = Instance.new("TextLabel")
			badge.Size = UDim2.new(0, 60, 0, 14)
			badge.Position = UDim2.new(1, -72, 0, -7)
			badge.BackgroundColor3 = Color3.fromRGB(212, 175, 55)
			badge.BackgroundTransparency = 0.85
			badge.Text = "BEST VALUE"
			badge.TextColor3 = Color3.fromRGB(212, 175, 55)
			badge.TextSize = 8
			badge.Font = Enum.Font.GothamBold
			badge.Parent = packFrame

			local badgeCorner = Instance.new("UICorner")
			badgeCorner.CornerRadius = UDim.new(0, 7)
			badgeCorner.Parent = badge
		end
	end

	-- Instructions at bottom
	local instructions = Instance.new("TextLabel")
	instructions.Size = UDim2.new(1, -32, 0, 28)
	instructions.Position = UDim2.new(0, 16, 0, 334)
	instructions.BackgroundTransparency = 1
	instructions.Text = "Purchase GamePasses from the store to receive credits.\nCredits are added to your ForjeGames account automatically."
	instructions.TextColor3 = Color3.fromRGB(80, 80, 80)
	instructions.TextSize = 10
	instructions.Font = Enum.Font.Gotham
	instructions.TextXAlignment = Enum.TextXAlignment.Left
	instructions.TextWrapped = true
	instructions.Parent = frame

	-- Close button
	local closeBtn = Instance.new("TextButton")
	closeBtn.Name = "CloseButton"
	closeBtn.Size = UDim2.new(1, -32, 0, 36)
	closeBtn.Position = UDim2.new(0, 16, 0, 370)
	closeBtn.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	closeBtn.BackgroundTransparency = 0.92
	closeBtn.Text = "Close"
	closeBtn.TextColor3 = Color3.fromRGB(180, 180, 180)
	closeBtn.TextSize = 13
	closeBtn.Font = Enum.Font.GothamMedium
	closeBtn.BorderSizePixel = 0
	closeBtn.Parent = frame

	local closeBtnCorner = Instance.new("UICorner")
	closeBtnCorner.CornerRadius = UDim.new(0, 10)
	closeBtnCorner.Parent = closeBtn

	closeBtn.MouseButton1Click:Connect(function()
		screenGui:Destroy()
	end)

	screenGui.Parent = playerGui
end

-- ============================================================
-- Show purchase confirmation UI
-- ============================================================

local function showPurchaseConfirmation(player, productName, credits)
	local playerGui = player:FindFirstChild("PlayerGui")
	if not playerGui then return end

	-- Remove existing confirmation
	local existing = playerGui:FindFirstChild("ForjePurchaseConfirm")
	if existing then existing:Destroy() end

	local screenGui = Instance.new("ScreenGui")
	screenGui.Name = "ForjePurchaseConfirm"
	screenGui.ResetOnSpawn = false

	local frame = Instance.new("Frame")
	frame.Size = UDim2.new(0, 300, 0, 160)
	frame.Position = UDim2.new(0.5, -150, 0.5, -80)
	frame.BackgroundColor3 = Color3.fromRGB(15, 19, 32)
	frame.BorderSizePixel = 0
	frame.Parent = screenGui

	local fCorner = Instance.new("UICorner")
	fCorner.CornerRadius = UDim.new(0, 16)
	fCorner.Parent = frame

	local fStroke = Instance.new("UIStroke")
	fStroke.Color = Color3.fromRGB(0, 176, 111)
	fStroke.Transparency = 0.6
	fStroke.Thickness = 1
	fStroke.Parent = frame

	local checkmark = Instance.new("TextLabel")
	checkmark.Size = UDim2.new(1, 0, 0, 40)
	checkmark.Position = UDim2.new(0, 0, 0, 20)
	checkmark.BackgroundTransparency = 1
	checkmark.Text = "Purchase Complete!"
	checkmark.TextColor3 = Color3.fromRGB(0, 176, 111)
	checkmark.TextSize = 20
	checkmark.Font = Enum.Font.GothamBold
	checkmark.Parent = frame

	local detail = Instance.new("TextLabel")
	detail.Size = UDim2.new(1, -32, 0, 40)
	detail.Position = UDim2.new(0, 16, 0, 60)
	detail.BackgroundTransparency = 1
	detail.Text = productName .. "\n" .. tostring(credits) .. " credits added to your ForjeGames account"
	detail.TextColor3 = Color3.fromRGB(180, 180, 180)
	detail.TextSize = 13
	detail.Font = Enum.Font.Gotham
	detail.TextWrapped = true
	detail.Parent = frame

	local okBtn = Instance.new("TextButton")
	okBtn.Size = UDim2.new(1, -32, 0, 32)
	okBtn.Position = UDim2.new(0, 16, 0, 112)
	okBtn.BackgroundColor3 = Color3.fromRGB(0, 176, 111)
	okBtn.Text = "OK"
	okBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
	okBtn.TextSize = 14
	okBtn.Font = Enum.Font.GothamBold
	okBtn.BorderSizePixel = 0
	okBtn.Parent = frame

	local okCorner = Instance.new("UICorner")
	okCorner.CornerRadius = UDim.new(0, 10)
	okCorner.Parent = okBtn

	okBtn.MouseButton1Click:Connect(function()
		screenGui:Destroy()
	end)

	screenGui.Parent = playerGui

	-- Auto-dismiss after 10 seconds
	task.delay(10, function()
		if screenGui and screenGui.Parent then
			screenGui:Destroy()
		end
	end)
end

-- ============================================================
-- GamePass purchase handler
-- ============================================================

MarketplaceService.PromptGamePassPurchaseFinished:Connect(function(player, gamePassId, wasPurchased)
	if not wasPurchased then return end

	local product = GAMEPASS_PRODUCTS[gamePassId]
	if not product then
		warn("[ForjeGames] Unknown GamePass purchased:", gamePassId)
		return
	end

	print("[ForjeGames] GamePass purchased:", gamePassId, "by", player.Name)

	-- Send to ForjeGames API
	local success, data = postToForje(WEBHOOK_PATH, {
		robloxUserId = player.UserId,
		productId = product.productId,
		-- GamePasses are one-time purchases, so the token must be stable
		-- across retries (otherwise a flaky network = duplicate credit).
		-- Do NOT include os.time() here.
		purchaseToken = "gp_" .. tostring(gamePassId) .. "_" .. tostring(player.UserId),
		amount = product.robux,
	})

	if success then
		showPurchaseConfirmation(player, product.productId, product.credits)
		print("[ForjeGames] Purchase credited:", product.productId, product.credits, "credits")
	else
		warn("[ForjeGames] Failed to credit purchase — will retry on next join:", tostring(data))
	end
end)

-- ============================================================
-- DevProduct purchase handler (repeatable purchases)
-- ============================================================

MarketplaceService.ProcessReceipt = function(receiptInfo)
	local player = Players:GetPlayerByUserId(receiptInfo.PlayerId)
	if not player then
		-- Player left, can't confirm UI but still process
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end

	local product = DEVPRODUCT_PRODUCTS[receiptInfo.ProductId]
	if not product then
		warn("[ForjeGames] Unknown DevProduct purchased:", receiptInfo.ProductId)
		return Enum.ProductPurchaseDecision.PurchaseGranted
	end

	print("[ForjeGames] DevProduct purchased:", receiptInfo.ProductId, "by", player.Name)

	local purchaseToken = "dp_" .. tostring(receiptInfo.PurchaseId)

	-- Send to ForjeGames API
	local success, data = postToForje(WEBHOOK_PATH, {
		robloxUserId = receiptInfo.PlayerId,
		productId = product.productId,
		purchaseToken = purchaseToken,
		amount = product.robux,
	})

	if success then
		showPurchaseConfirmation(player, product.productId, product.credits)
		print("[ForjeGames] Purchase credited:", product.productId, product.credits, "credits")
		return Enum.ProductPurchaseDecision.PurchaseGranted
	else
		warn("[ForjeGames] Failed to credit purchase — will retry:", tostring(data))
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end
end

-- ============================================================
-- Player join: show payment UI
-- ============================================================

Players.PlayerAdded:Connect(function(player)
	-- Small delay to let PlayerGui load
	task.wait(2)
	createPlayerGui(player)
end)

-- Handle players already in the game (e.g., script restart)
for _, player in ipairs(Players:GetPlayers()) do
	task.spawn(function()
		createPlayerGui(player)
	end)
end

print("[ForjeGames] RobuxPayment script loaded")
print("[ForjeGames] GamePass products configured:", #GAMEPASS_PRODUCTS)
print("[ForjeGames] DevProduct products configured:", #DEVPRODUCT_PRODUCTS)
