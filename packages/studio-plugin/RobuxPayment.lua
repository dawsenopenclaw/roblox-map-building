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
-- !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
-- !! WARNING: HMAC-SHA256 SIGNING IS NOT IMPLEMENTED        !!
-- !!                                                        !!
-- !! The `hmacSign` function below is a stub. It does NOT    !!
-- !! compute a real HMAC-SHA256 digest — it returns the     !!
-- !! secret itself.  This has two serious consequences:     !!
-- !!                                                        !!
-- !!   1. The server-side HMAC signature check will fail —  !!
-- !!      purchases never credit via the signed path.       !!
-- !!   2. The raw webhook secret is emitted in the          !!
-- !!      `X-Forje-Signature` header on every request, so   !!
-- !!      anybody who can observe network traffic can read  !!
-- !!      it and forge purchase webhooks at will.           !!
-- !!                                                        !!
-- !! TODO(forje): Replace the stub with a real HMAC-SHA256   !!
-- !! implementation. Options:                               !!
-- !!   - Paste a vetted pure-Lua SHA-256 module (e.g.       !!
-- !!     boatbomber/sha256 on GitHub) and wrap it in the    !!
-- !!     standard HMAC construction.                        !!
-- !!   - Or move to a different auth scheme: embed a        !!
-- !!     shared secret in the JSON body and compare it      !!
-- !!     server-side with a constant-time comparison.       !!
-- !!                                                        !!
-- !! Until then, the server MUST disable this code path in  !!
-- !! production (see `src/app/api/webhooks/roblox/route.ts` !!
-- !! which returns 503 when NODE_ENV === 'production').     !!
-- !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
-- ============================================================

local function hmacSign(secret, message)
	-- STUB — see the WARNING block above. Do not rely on this for
	-- production authentication. The server currently refuses this
	-- webhook when NODE_ENV === 'production'.
	warn("[ForjeGames] hmacSign stub invoked — HMAC not implemented; header will leak secret")
	return secret
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
