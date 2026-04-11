--[[
  GamePassHandler.lua

  ForjeGames Robux Payment Handler

  Place this script in ServerScriptService in your Roblox experience.
  When a player purchases a GamePass or DevProduct, this script sends
  a webhook to the ForjeGames API to credit their account.

  Configuration:
    1. Set the GAMEPASS_IDS and DEVPRODUCT_IDS to your real asset IDs
    2. Set WEBHOOK_SECRET to match your ROBLOX_WEBHOOK_SECRET env var
    3. Enable HttpService in Game Settings > Security
--]]

local MarketplaceService = game:GetService("MarketplaceService")
local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")

-- ── Configuration ─────────────────────────────────────────────────────────

-- GamePass IDs for subscription-tier purchases (one-time per user)
local GAMEPASS_IDS = {
	starter = 000000001,  -- Replace with real GamePass ID
	pro     = 000000002,  -- Replace with real GamePass ID
	studio  = 000000003,  -- Replace with real GamePass ID
}

-- DevProduct IDs for repeatable credit purchases
local DEVPRODUCT_IDS = {
	credits_100 = 000000001,  -- Replace with real DevProduct ID
	credits_500 = 000000002,  -- Replace with real DevProduct ID
}

-- API endpoint and shared secret
local WEBHOOK_URL = "https://forjegames.com/api/webhooks/roblox"
local WEBHOOK_SECRET = "CHANGE_ME"  -- Must match ROBLOX_WEBHOOK_SECRET in your .env

-- ── Reverse lookup tables ─────────────────────────────────────────────────

local gamePassToTier = {}
for name, id in pairs(GAMEPASS_IDS) do
	gamePassToTier[id] = name
end

local devProductToTier = {}
for name, id in pairs(DEVPRODUCT_IDS) do
	devProductToTier[id] = name
end

-- ── HTTP helper with retry ────────────────────────────────────────────────

local MAX_RETRIES = 3
local RETRY_DELAY = 2  -- seconds

local function sendWebhook(payload)
	local jsonPayload = HttpService:JSONEncode(payload)

	for attempt = 1, MAX_RETRIES do
		local success, result = pcall(function()
			return HttpService:PostAsync(
				WEBHOOK_URL,
				jsonPayload,
				Enum.HttpContentType.ApplicationJson,
				false,  -- compress
				{
					["x-roblox-webhook-secret"] = WEBHOOK_SECRET,
					["Content-Type"] = "application/json",
				}
			)
		end)

		if success then
			print(string.format(
				"[ForjeGames] Webhook sent successfully (attempt %d): %s",
				attempt, tostring(result)
			))
			return true
		else
			warn(string.format(
				"[ForjeGames] Webhook failed (attempt %d/%d): %s",
				attempt, MAX_RETRIES, tostring(result)
			))
			if attempt < MAX_RETRIES then
				task.wait(RETRY_DELAY * attempt)  -- Exponential-ish backoff
			end
		end
	end

	warn("[ForjeGames] All webhook retries exhausted for payload: " .. jsonPayload)
	return false
end

-- ── GamePass purchase handler ─────────────────────────────────────────────

MarketplaceService.PromptGamePassPurchaseFinished:Connect(function(player, gamePassId, wasPurchased)
	if not wasPurchased then return end

	local tier = gamePassToTier[gamePassId]
	if not tier then
		warn("[ForjeGames] Unknown GamePass ID purchased:", gamePassId)
		return
	end

	print(string.format(
		"[ForjeGames] GamePass purchased: %s (ID: %d) by %s (UserID: %d)",
		tier, gamePassId, player.Name, player.UserId
	))

	-- Send webhook in a separate thread so it does not block the main loop
	task.spawn(function()
		sendWebhook({
			type = "gamepass_purchase",
			robloxUserId = player.UserId,
			robloxUsername = player.Name,
			tier = tier,
			gamePassId = gamePassId,
			timestamp = os.time(),
		})
	end)
end)

-- ── DevProduct (credit pack) purchase handler ─────────────────────────────

MarketplaceService.ProcessReceipt = function(receiptInfo)
	local tier = devProductToTier[receiptInfo.ProductId]
	if not tier then
		warn("[ForjeGames] Unknown DevProduct ID:", receiptInfo.ProductId)
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end

	-- Retrieve player info for the webhook payload
	local player = Players:GetPlayerByUserId(receiptInfo.PlayerId)
	local playerName = player and player.Name or ("User_" .. tostring(receiptInfo.PlayerId))

	print(string.format(
		"[ForjeGames] DevProduct purchased: %s (ID: %d) by %s (UserID: %d) PurchaseID: %s",
		tier, receiptInfo.ProductId, playerName, receiptInfo.PlayerId,
		tostring(receiptInfo.PurchaseId)
	))

	local success = sendWebhook({
		type = "devproduct_purchase",
		robloxUserId = receiptInfo.PlayerId,
		robloxUsername = playerName,
		tier = tier,
		productId = receiptInfo.ProductId,
		purchaseId = tostring(receiptInfo.PurchaseId),
		timestamp = os.time(),
	})

	if success then
		return Enum.ProductPurchaseDecision.PurchaseGranted
	else
		-- Return NotProcessedYet so Roblox retries the receipt later
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end
end

-- ── Player join: check for owned GamePasses ───────────────────────────────
-- When a player joins, verify their GamePass ownership in case the webhook
-- was missed.  This is a best-effort backup — the primary flow is the
-- purchase event above.

Players.PlayerAdded:Connect(function(player)
	task.spawn(function()
		for tier, gamePassId in pairs(GAMEPASS_IDS) do
			local success, owns = pcall(function()
				return MarketplaceService:UserOwnsGamePassAsync(player.UserId, gamePassId)
			end)

			if success and owns then
				print(string.format(
					"[ForjeGames] Player %s already owns GamePass: %s",
					player.Name, tier
				))
				-- We do NOT re-send the webhook here to avoid duplicate crediting.
				-- The webhook handler has idempotency checks, but it is cleaner
				-- to only fire on actual purchase events.
			end
		end
	end)
end)

print("[ForjeGames] GamePassHandler loaded. Monitoring purchases...")
